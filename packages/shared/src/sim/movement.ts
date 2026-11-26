import { DASH_COOLDOWN, DASH_SPEED, DASH_TIME, HITSTUN_CONTROL, KB_DECAY, MOVE_ACCEL, MOVE_SPEED, PLAYER_RADIUS, TILE } from '../config';
import { applyHit } from './hit';
import type { GameEvent, InputFrame, PlayerState } from './types';

function normalized(x: number, y: number): [number, number] {
  const length = Math.hypot(x, y);
  return length > 0 ? [x / length, y / length] : [0, 0];
}

export function applyMoveInput(p: PlayerState, inp: InputFrame, dt: number): void {
  if (p.status === 'falling' || p.status === 'respawning') return;
  const [dx, dy] = normalized(inp.mx, inp.my);
  const speed = MOVE_SPEED * (p.status === 'hitstun' ? HITSTUN_CONTROL : 1);
  const blend = Math.min(1, MOVE_ACCEL * dt);
  p.mvx += (dx * speed - p.mvx) * blend;
  p.mvy += (dy * speed - p.mvy) * blend;
}

export function integrate(p: PlayerState, dt: number): void {
  if (p.status === 'falling' || p.status === 'respawning') return;
  const dashX = p.status === 'dashing' ? p.dashX * DASH_SPEED : 0;
  const dashY = p.status === 'dashing' ? p.dashY * DASH_SPEED : 0;
  p.x += (p.mvx + p.kbx + dashX) * dt;
  p.y += (p.mvy + p.kby + dashY) * dt;
  const decay = Math.exp(-KB_DECAY * dt);
  p.kbx *= decay;
  p.kby *= decay;
}

export function startDash(p: PlayerState, inp: InputFrame): boolean {
  if (p.dashCd > 0 || p.status === 'hitstun' || p.status === 'dashing' || p.status === 'falling' || p.status === 'respawning') return false;
  const [dx, dy] = normalized(inp.mx || inp.my ? inp.mx : inp.ax, inp.mx || inp.my ? inp.my : inp.ay);
  if (dx === 0 && dy === 0) return false;
  p.dashX = dx;
  p.dashY = dy;
  p.status = 'dashing';
  p.timer = DASH_TIME;
  p.dashCd = DASH_COOLDOWN;
  return true;
}

function stopDash(p: PlayerState): void {
  p.status = 'alive';
  p.timer = 0;
  p.dashX = 0;
  p.dashY = 0;
}

export function resolveOverlaps(players: PlayerState[], time: number, events: GameEvent[]): void {
  for (let i = 0; i < players.length; i++) {
    const a = players[i];
    if (a.status === 'falling' || a.status === 'respawning') continue;
    for (let j = i + 1; j < players.length; j++) {
      const b = players[j];
      if (b.status === 'falling' || b.status === 'respawning') continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);
      const overlap = 2 * PLAYER_RADIUS - length;
      if (overlap <= 0) continue;
      const nx = length > 0 ? dx / length : 1;
      const ny = length > 0 ? dy / length : 0;
      a.x -= nx * overlap / 2;
      a.y -= ny * overlap / 2;
      b.x += nx * overlap / 2;
      b.y += ny * overlap / 2;
      if (a.status === 'dashing') {
        if (a.team !== b.team && b.status !== 'protected' && a.dashX * nx + a.dashY * ny > 0) {
          applyHit(b, 'dash', a.dashX, a.dashY, a.slot, time);
          events.push({ k: 'hit', slot: b.slot, wet: b.wet, by: a.slot });
        }
        stopDash(a);
      }
      if (b.status === 'dashing') {
        if (a.team !== b.team && a.status !== 'protected' && b.dashX * nx + b.dashY * ny < 0) {
          applyHit(a, 'dash', b.dashX, b.dashY, b.slot, time);
          events.push({ k: 'hit', slot: a.slot, wet: a.wet, by: b.slot });
        }
        stopDash(b);
      }
    }
  }
}

export function resolveCovers(p: PlayerState, covers: { x: number; y: number }[]): void {
  if (p.status === 'falling' || p.status === 'respawning') return;
  const half = TILE / 2;
  for (const cover of covers) {
    const closestX = Math.max(cover.x - half, Math.min(p.x, cover.x + half));
    const closestY = Math.max(cover.y - half, Math.min(p.y, cover.y + half));
    let dx = p.x - closestX;
    let dy = p.y - closestY;
    const length = Math.hypot(dx, dy);
    if (length >= PLAYER_RADIUS) continue;
    let push: number;
    if (length > 0) {
      dx /= length;
      dy /= length;
      push = PLAYER_RADIUS - length;
    } else {
      const left = p.x - (cover.x - half);
      const right = cover.x + half - p.x;
      const top = p.y - (cover.y - half);
      const bottom = cover.y + half - p.y;
      const nearest = Math.min(left, right, top, bottom);
      dx = nearest === left ? -1 : nearest === right ? 1 : 0;
      dy = nearest === top ? -1 : nearest === bottom ? 1 : 0;
      push = nearest + PLAYER_RADIUS;
    }
    p.x += dx * push;
    p.y += dy * push;
    const inward = p.kbx * dx + p.kby * dy;
    if (inward < 0) {
      p.kbx -= inward * dx;
      p.kby -= inward * dy;
    }
    if (p.status === 'dashing') stopDash(p);
  }
}
