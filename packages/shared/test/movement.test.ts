import { expect, it } from 'vitest';
import { DASH_COOLDOWN, DASH_TIME, DT, HITSTUN_CONTROL, KB_DECAY, MOVE_ACCEL, MOVE_SPEED, PLAYER_RADIUS } from '../src/config';
import { activeCovers } from '../src/sim/raft';
import { applyMoveInput, integrate, resolveCovers, resolveOverlaps, startDash } from '../src/sim/movement';
import type { GameEvent } from '../src/sim/types';
import { inp, mkPlayer, R0 } from './helpers';

it('move velocity lerps toward MOVE_SPEED', () => {
  const player = mkPlayer();
  applyMoveInput(player, inp({ mx: 1 }), DT);
  expect(player.mvx).toBeCloseTo(MOVE_SPEED * Math.min(1, MOVE_ACCEL * DT));
});
it('diagonal movement is normalized and hitstun limits control', () => {
  const player = mkPlayer({ status: 'hitstun' });
  for (let i = 0; i < 60; i++) applyMoveInput(player, inp({ mx: 1, my: 1 }), DT);
  expect(Math.hypot(player.mvx, player.mvy)).toBeCloseTo(MOVE_SPEED * HITSTUN_CONTROL, 1);
});
it('integrates velocity and decays knockback exponentially', () => {
  const player = mkPlayer({ kbx: 100 });
  integrate(player, 1);
  expect(player.x).toBe(420);
  expect(player.kbx).toBeCloseTo(100 * Math.exp(-KB_DECAY));
});
it('dash uses movement direction, then aim when stationary', () => {
  const player = mkPlayer();
  expect(startDash(player, inp({ mx: 0, my: -1 }))).toBe(true);
  expect([player.dashX, player.dashY, player.status, player.timer, player.dashCd]).toEqual([0, -1, 'dashing', DASH_TIME, DASH_COOLDOWN]);
  player.status = 'alive'; player.dashCd = 0;
  expect(startDash(player, inp({ ax: -1, ay: 0 }))).toBe(true);
  expect([player.dashX, player.dashY]).toEqual([-1, 0]);
});
it('dash is blocked during hitstun or cooldown', () => {
  expect(startDash(mkPlayer({ status: 'hitstun' }), inp())).toBe(false);
  expect(startDash(mkPlayer({ dashCd: 1 }), inp())).toBe(false);
});
it('overlapping players separate evenly', () => {
  const a = mkPlayer({ x: 100, y: 100 });
  const b = mkPlayer({ slot: 1, x: 108, y: 100 });
  resolveOverlaps([a, b], 0, []);
  expect(a.x).toBeCloseTo(99);
  expect(b.x).toBeCloseTo(109);
});
it('dash into enemy pushes enemy and stops dasher', () => {
  const a = mkPlayer({ x: 100, status: 'dashing', dashX: 1, dashY: 0 });
  const b = mkPlayer({ slot: 1, team: 1, x: 108 });
  const events: GameEvent[] = [];
  resolveOverlaps([a, b], 0, events);
  expect(b.kbx).toBeGreaterThan(0);
  expect(a.status).toBe('alive');
  expect(events).toContainEqual(expect.objectContaining({ k: 'hit', slot: 1, by: 0 }));
});
it('dash into teammate stops without push', () => {
  const a = mkPlayer({ x: 100, status: 'dashing', dashX: 1 });
  const mate = mkPlayer({ slot: 1, x: 108 });
  const events: GameEvent[] = [];
  resolveOverlaps([a, mate], 0, events);
  expect(mate.kbx).toBe(0);
  expect(a.status).toBe('alive');
  expect(events).toHaveLength(0);
});
it('cover blocks penetration and cancels inward knockback', () => {
  const player = mkPlayer({ x: 188, y: 143, kbx: 100 });
  integrate(player, 0.01);
  resolveCovers(player, activeCovers(R0));
  expect(player.x).toBeLessThanOrEqual(200 - 8 - PLAYER_RADIUS);
  expect(player.kbx).toBe(0);
});
