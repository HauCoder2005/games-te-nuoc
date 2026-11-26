import {
  BALLOON_RANGE_MAX, BALLOON_SPEED, BOT_DASH_CHANCE, BOT_DASH_DIST,
  BOT_EDGE_DIST, BOT_MAX_DIST, BOT_MIN_DIST, BOT_REACT_MAX, BOT_REACT_MIN,
  PILLAR_RADIUS, RAFT_CENTER,
} from '../config';
import { raftRect } from './raft';
import { nextRng } from './rng';
import type { InputFrame, PlayerState, World } from './types';

export interface BotMemory {
  seq: number;
  th: number;
  da: number;
  reactAt: number;
  rng: number;
  held: Pick<InputFrame, 'mx' | 'my' | 'ax' | 'ay'>;
}

export function createBotMemory(seed: number): BotMemory {
  return { seq: 0, th: 0, da: 0, reactAt: 0, rng: seed >>> 0, held: { mx: 0, my: 0, ax: RAFT_CENTER.x, ay: RAFT_CENTER.y } };
}

function random(mem: BotMemory): number {
  const [value, state] = nextRng(mem.rng);
  mem.rng = state;
  return value;
}

function nearestEnemy(w: World, bot: PlayerState): PlayerState | null {
  let best: PlayerState | null = null;
  let distance = Infinity;
  for (const p of w.players) {
    if (p.team === bot.team || p.status === 'protected' || p.status === 'falling' || p.status === 'respawning') continue;
    const candidate = Math.hypot(p.x - bot.x, p.y - bot.y);
    if (candidate < distance) { best = p; distance = candidate; }
  }
  return best;
}

export function botInput(w: World, slot: number, mem: BotMemory): InputFrame {
  const bot = w.players.find((p) => p.slot === slot);
  mem.seq++;
  if (!bot) return { seq: mem.seq, ...mem.held, th: mem.th, da: mem.da };
  if (w.time < mem.reactAt) return { seq: mem.seq, ...mem.held, th: mem.th, da: mem.da };
  mem.reactAt = w.time + BOT_REACT_MIN + random(mem) * (BOT_REACT_MAX - BOT_REACT_MIN);
  const target = nearestEnemy(w, bot);
  let mx = 0; let my = 0;
  let ax = mem.held.ax; let ay = mem.held.ay;
  const bounds = raftRect(w.raft);
  const nearEdge = bot.x - bounds.x0 < BOT_EDGE_DIST || bounds.x1 - bot.x < BOT_EDGE_DIST || bot.y - bounds.y0 < BOT_EDGE_DIST || bounds.y1 - bot.y < BOT_EDGE_DIST;
  if (target) {
    const dx = target.x - bot.x;
    const dy = target.y - bot.y;
    const distance = Math.hypot(dx, dy);
    const leadTime = Math.min(distance, BALLOON_RANGE_MAX) / BALLOON_SPEED;
    ax = target.x + (target.mvx + target.kbx) * leadTime;
    ay = target.y + (target.mvy + target.kby) * leadTime;
    if (distance > BOT_MAX_DIST) { mx = dx / distance; my = dy / distance; }
    else if (distance < BOT_MIN_DIST && distance > 0) { mx = -dx / distance; my = -dy / distance; }
    if (w.pillar && w.pillar.owner !== bot.team) {
      const pdx = RAFT_CENTER.x - bot.x;
      const pdy = RAFT_CENTER.y - bot.y;
      const pdist = Math.hypot(pdx, pdy);
      if (pdist > PILLAR_RADIUS * 0.75) {
        mx = mx * 0.55 + (pdx / pdist) * 0.45;
        my = my * 0.55 + (pdy / pdist) * 0.45;
      }
    }
    if (distance <= BALLOON_RANGE_MAX && bot.ammo > 0 && bot.throwCd <= 0) mem.th++;
    if (distance < BOT_DASH_DIST && bot.dashCd <= 0 && !nearEdge && random(mem) < BOT_DASH_CHANCE) mem.da++;
  } else if (w.pillar && w.pillar.owner !== bot.team) {
    const pdx = RAFT_CENTER.x - bot.x;
    const pdy = RAFT_CENTER.y - bot.y;
    const pdist = Math.hypot(pdx, pdy);
    if (pdist > PILLAR_RADIUS * 0.5) { mx = pdx / pdist; my = pdy / pdist; }
  }
  if (bot.x - bounds.x0 < BOT_EDGE_DIST) mx = 1;
  else if (bounds.x1 - bot.x < BOT_EDGE_DIST) mx = -1;
  if (bot.y - bounds.y0 < BOT_EDGE_DIST) my = 1;
  else if (bounds.y1 - bot.y < BOT_EDGE_DIST) my = -1;
  const length = Math.hypot(mx, my);
  if (length > 1) { mx /= length; my /= length; }
  mem.held = { mx, my, ax, ay };
  return { seq: mem.seq, ...mem.held, th: mem.th, da: mem.da };
}
