import {
  BALLOON_ARC_HEIGHT, BALLOON_RADIUS, BALLOON_RANGE_MAX, BALLOON_RANGE_MIN,
  BALLOON_SPAWN_OFFSET, BALLOON_SPEED, PLAYER_RADIUS, SPLASH_RADIUS,
  THROW_COOLDOWN, TILE,
} from '../config';
import { applyHit } from './hit';
import { activeCovers } from './raft';
import type { BalloonState, GameEvent, PlayerState, World } from './types';

export function tryThrow(w: World, p: PlayerState, events: GameEvent[]): void {
  if (p.status === 'protected') p.status = 'alive';
  if (p.ammo <= 0 || p.throwCd > 0 || p.status === 'hitstun' || p.status === 'dashing' || p.status === 'falling' || p.status === 'respawning') return;
  const aimDx = p.aimX - p.x;
  const aimDy = p.aimY - p.y;
  const aimLength = Math.hypot(aimDx, aimDy);
  const dx = aimLength > 0 ? aimDx / aimLength : p.facing;
  const dy = aimLength > 0 ? aimDy / aimLength : 0;
  w.balloons.push({
    id: w.nextBalloonId++, owner: p.slot, team: p.team,
    x: p.x + dx * BALLOON_SPAWN_OFFSET,
    y: p.y + dy * BALLOON_SPAWN_OFFSET,
    dx, dy, traveled: 0,
    maxDist: Math.max(BALLOON_RANGE_MIN, Math.min(BALLOON_RANGE_MAX, aimLength)),
  });
  p.ammo--;
  p.throwCd = THROW_COOLDOWN;
  events.push({ k: 'throw', slot: p.slot });
}

function circleDistance(b: BalloonState, p: PlayerState, maxDist: number): number | null {
  const rx = p.x - b.x;
  const ry = p.y - b.y;
  const along = rx * b.dx + ry * b.dy;
  const radius = PLAYER_RADIUS + BALLOON_RADIUS;
  const perpendicular2 = rx * rx + ry * ry - along * along;
  if (perpendicular2 > radius * radius) return null;
  const offset = Math.sqrt(Math.max(0, radius * radius - perpendicular2));
  const entry = along - offset;
  const distance = entry < 0 && along + offset >= 0 ? 0 : entry;
  return distance >= 0 && distance <= maxDist ? distance : null;
}

function coverDistance(b: BalloonState, cover: { x: number; y: number }, maxDist: number): number | null {
  const half = TILE / 2 + BALLOON_RADIUS;
  let entry = -Infinity;
  let exit = Infinity;
  for (const [origin, direction, center] of [[b.x, b.dx, cover.x], [b.y, b.dy, cover.y]]) {
    if (direction === 0) {
      if (origin < center - half || origin > center + half) return null;
      continue;
    }
    const a = (center - half - origin) / direction;
    const z = (center + half - origin) / direction;
    entry = Math.max(entry, Math.min(a, z));
    exit = Math.min(exit, Math.max(a, z));
  }
  if (exit < 0 || entry > exit) return null;
  const distance = Math.max(0, entry);
  return distance <= maxDist ? distance : null;
}

function burst(w: World, b: BalloonState, direct: PlayerState | null, events: GameEvent[]): void {
  events.push({ k: 'burst', x: b.x, y: b.y, direct: direct !== null, team: b.team });
  if (direct) {
    const force = applyHit(direct, 'direct', b.dx, b.dy, b.owner, w.time);
    if (force > 0) {
      const owner = w.players.find((p) => p.slot === b.owner);
      if (owner) owner.stats.direct++;
      events.push({ k: 'hit', slot: direct.slot, wet: direct.wet, by: b.owner });
    }
  }
  for (const p of w.players) {
    if (p.team === b.team || p === direct || p.status === 'protected' || p.status === 'falling' || p.status === 'respawning') continue;
    const dx = p.x - b.x;
    const dy = p.y - b.y;
    const distance = Math.hypot(dx, dy);
    if (distance > SPLASH_RADIUS) continue;
    const force = applyHit(p, 'splash', distance < 1 ? b.dx : dx, distance < 1 ? b.dy : dy, b.owner, w.time);
    if (force > 0) events.push({ k: 'hit', slot: p.slot, wet: p.wet, by: b.owner });
  }
}

export function stepBalloons(w: World, dt: number, events: GameEvent[]): void {
  const survivors: BalloonState[] = [];
  const covers = activeCovers(w.raft);
  for (const b of w.balloons) {
    const remaining = Math.max(0, b.maxDist - b.traveled);
    const distance = Math.min(BALLOON_SPEED * dt, remaining);
    let collision = distance;
    let direct: PlayerState | null = null;
    let collided = false;
    for (const p of w.players) {
      if (p.team === b.team || p.status === 'protected' || p.status === 'falling' || p.status === 'respawning') continue;
      const hitAt = circleDistance(b, p, collision);
      if (hitAt !== null && hitAt <= collision) {
        collision = hitAt;
        direct = p;
        collided = true;
      }
    }
    for (const cover of covers) {
      const hitAt = coverDistance(b, cover, collision);
      if (hitAt !== null && hitAt <= collision) {
        collision = hitAt;
        direct = null;
        collided = true;
      }
    }
    b.x += b.dx * collision;
    b.y += b.dy * collision;
    b.traveled += collision;
    if (collided || b.traveled >= b.maxDist) burst(w, b, direct, events);
    else survivors.push(b);
  }
  w.balloons = survivors;
}

export function balloonHeight(b: BalloonState): number {
  return BALLOON_ARC_HEIGHT * Math.sin(Math.PI * b.traveled / b.maxDist);
}
