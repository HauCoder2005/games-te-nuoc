import {
  AMMO_MAX, AMMO_REGEN, MATCH_TIME, RAFT_H, RAFT_W, RESPAWN_TIME,
  SPAWN_CLEARANCE, SPAWN_PROTECT, SPAWN_TRIES, START_COUNTDOWN, TILE,
} from '../config';
import { stepBalloons, tryThrow } from './balloons';
import { endMatch, onFall, updateClock } from './match';
import { applyMoveInput, integrate, resolveCovers, resolveOverlaps, startDash } from './movement';
import { activeCovers, homeZone, isOnRaft } from './raft';
import { nextRng } from './rng';
import type { GameEvent, InputFrame, MatchSettings, PlayerState, RosterEntry, World } from './types';

function makePlayer(w: World, e: RosterEntry): PlayerState {
  const zone = homeZone(e.team, w.raft);
  const teammates = w.players.filter((p) => p.team === e.team).length;
  return {
    ...e,
    x: (zone.x0 + zone.x1) / 2,
    y: zone.y0 + (teammates + 1) * (zone.y1 - zone.y0) / (w.settings.teamSize + 1),
    mvx: 0, mvy: 0, kbx: 0, kby: 0, wet: 0,
    status: 'alive', timer: 0, ammo: AMMO_MAX, ammoTimer: 0, throwCd: 0, dashCd: 0,
    dashX: 0, dashY: 0, lastHitBy: null, lastHitTime: 0,
    lastTh: 0, lastDa: 0, ackSeq: 0, facing: e.team === 0 ? 1 : -1,
    aimX: e.team === 0 ? zone.x1 + TILE : zone.x0 - TILE,
    aimY: (zone.y0 + zone.y1) / 2,
    stats: { ko: 0, direct: 0, falls: 0, streak: 0 },
  };
}

export function createMatch(seed: number, roster: RosterEntry[], settings: MatchSettings): World {
  const w: World = {
    tick: 0, time: 0, rng: seed >>> 0, phase: 'countdown', phaseTimer: START_COUNTDOWN,
    timeLeft: MATCH_TIME, settings, players: [], balloons: [], nextBalloonId: 1,
    raft: { w: RAFT_W, h: RAFT_H, warn: false, warnTimer: 0 },
    score: [0, 0], lastMinuteDone: false, goldenTimer: 0, winner: null,
    chainCd: {},
  };
  for (const entry of [...roster].sort((a, b) => a.slot - b.slot)) addPlayer(w, entry);
  return w;
}

export function addPlayer(w: World, e: RosterEntry): void {
  if (w.players.some((p) => p.slot === e.slot)) return;
  w.players.push(makePlayer(w, e));
  w.players.sort((a, b) => a.slot - b.slot);
}

export function removePlayer(w: World, slot: number): void {
  const index = w.players.findIndex((p) => p.slot === slot);
  if (index < 0) return;
  const team = w.players[index].team;
  w.players.splice(index, 1);
  if ((w.phase === 'playing' || w.phase === 'golden') && !w.players.some((p) => p.team === team)) {
    endMatch(w, team === 0 ? 1 : 0, []);
  }
}

export function setBot(w: World, slot: number, isBot: boolean): void {
  const p = w.players.find((candidate) => candidate.slot === slot);
  if (p) p.isBot = isBot;
}

function random(w: World): number {
  const [value, state] = nextRng(w.rng);
  w.rng = state;
  return value;
}

function respawn(w: World, p: PlayerState, events: GameEvent[]): void {
  const zone = homeZone(p.team, w.raft);
  let x = (zone.x0 + zone.x1) / 2;
  let y = (zone.y0 + zone.y1) / 2;
  for (let attempt = 0; attempt < SPAWN_TRIES; attempt++) {
    const col = Math.floor(random(w) * 3);
    const candidateX = zone.x0 + (col + 0.5) * TILE;
    const candidateY = zone.y0 + random(w) * (zone.y1 - zone.y0);
    x = candidateX; y = candidateY;
    if (w.players.every((other) => other === p || other.status === 'falling' || other.status === 'respawning' || Math.hypot(other.x - x, other.y - y) >= SPAWN_CLEARANCE)) break;
  }
  p.x = x; p.y = y;
  p.mvx = 0; p.mvy = 0; p.kbx = 0; p.kby = 0; p.wet = 0;
  p.status = 'protected'; p.timer = SPAWN_PROTECT;
  p.ammo = AMMO_MAX; p.ammoTimer = 0; p.throwCd = 0; p.dashCd = 0;
  p.lastHitBy = null;
  events.push({ k: 'respawn', slot: p.slot });
}

function updatePlayerTimers(w: World, p: PlayerState, dt: number, events: GameEvent[]): void {
  p.throwCd = Math.max(0, p.throwCd - dt);
  p.dashCd = Math.max(0, p.dashCd - dt);
  if (p.ammo < AMMO_MAX) {
    p.ammoTimer += dt;
    while (p.ammoTimer >= AMMO_REGEN && p.ammo < AMMO_MAX) {
      p.ammo++;
      p.ammoTimer -= AMMO_REGEN;
    }
  } else p.ammoTimer = 0;
  if (p.status === 'alive') return;
  p.timer -= dt;
  if (p.timer > 0) return;
  if (p.status === 'falling') {
    p.status = 'respawning';
    p.timer = RESPAWN_TIME;
  } else if (p.status === 'respawning') respawn(w, p, events);
  else {
    p.status = 'alive';
    p.timer = 0;
    p.dashX = 0; p.dashY = 0;
  }
}

export function step(w: World, inputs: Map<number, InputFrame>, dt: number): GameEvent[] {
  const events: GameEvent[] = [];
  w.tick++;
  if (w.phase === 'countdown' || w.phase === 'matchEnd') {
    updateClock(w, dt, events);
    return events;
  }
  w.time += dt;
  const actions = new Map<number, { frame: InputFrame; throwPressed: boolean; dashPressed: boolean }>();
  for (const p of w.players) {
    const frame = inputs.get(p.slot);
    if (!frame) continue;
    const throwPressed = frame.th > p.lastTh;
    const dashPressed = frame.da > p.lastDa;
    p.lastTh = frame.th; p.lastDa = frame.da; p.ackSeq = frame.seq;
    p.aimX = frame.ax; p.aimY = frame.ay;
    if (frame.ax !== p.x) p.facing = frame.ax < p.x ? -1 : 1;
    actions.set(p.slot, { frame, throwPressed, dashPressed });
  }
  for (const p of w.players) updatePlayerTimers(w, p, dt, events);
  for (const p of w.players) {
    const action = actions.get(p.slot);
    if (action?.dashPressed) {
      if (p.status === 'protected') p.status = 'alive';
      startDash(p, action.frame);
    }
    if (action?.throwPressed) tryThrow(w, p, events);
  }
  for (const p of w.players) {
    applyMoveInput(p, actions.get(p.slot)?.frame ?? { seq: p.ackSeq, mx: 0, my: 0, ax: p.aimX, ay: p.aimY, th: p.lastTh, da: p.lastDa }, dt);
    integrate(p, dt);
  }
  const covers = activeCovers(w.raft);
  for (const p of w.players) resolveCovers(p, covers);
  resolveOverlaps(w.players, w.time, events, w.chainCd);
  stepBalloons(w, dt, events);
  for (const p of w.players) {
    if (p.status !== 'falling' && p.status !== 'respawning' && !isOnRaft(p.x, p.y, w.raft)) onFall(w, p, events);
  }
  if (w.phase === 'playing' || w.phase === 'golden') updateClock(w, dt, events);
  if (w.phase === 'playing' || w.phase === 'golden') {
    const red = w.players.some((p) => p.team === 0);
    const blue = w.players.some((p) => p.team === 1);
    if (red !== blue) endMatch(w, red ? 0 : 1, events);
  }
  return events;
}
