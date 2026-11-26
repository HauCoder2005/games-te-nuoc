import { HITSTUN, KB_DASH, KB_DIRECT, KB_SPLASH, WET_DASH, WET_DIRECT, WET_SCALE, WET_SPLASH } from '../config';
import type { PlayerState } from './types';

export function applyHit(
  target: PlayerState,
  kind: 'direct' | 'splash' | 'dash',
  dirX: number,
  dirY: number,
  by: number,
  time: number,
): number {
  if (target.status === 'protected' || target.status === 'falling' || target.status === 'respawning') return 0;
  const length = Math.hypot(dirX, dirY);
  if (length === 0) return 0;
  const wet = kind === 'direct' ? WET_DIRECT : kind === 'splash' ? WET_SPLASH : WET_DASH;
  const base = kind === 'direct' ? KB_DIRECT : kind === 'splash' ? KB_SPLASH : KB_DASH;
  target.wet += wet;
  const force = base * (1 + target.wet / WET_SCALE);
  target.kbx += force * dirX / length;
  target.kby += force * dirY / length;
  target.status = 'hitstun';
  target.timer = HITSTUN;
  target.lastHitBy = by;
  target.lastHitTime = time;
  return force;
}
