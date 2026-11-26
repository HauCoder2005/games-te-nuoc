import { expect, it } from 'vitest';
import { BALLOON_RANGE_MAX, BALLOON_RANGE_MIN, DT, WET_DIRECT, WET_SPLASH } from '../src/config';
import { balloonHeight, stepBalloons, tryThrow } from '../src/sim/balloons';
import type { GameEvent } from '../src/sim/types';
import { mkPlayer, mkWorld } from './helpers';

it('range is clamped to min and max from the feet', () => {
  const near = mkPlayer({ x: 300, y: 199, aimX: 305, aimY: 199 });
  const far = mkPlayer({ slot: 1, x: 300, y: 250, aimX: 700, aimY: 250 });
  const world = mkWorld([near, far]);
  tryThrow(world, near, []);
  tryThrow(world, far, []);
  expect(world.balloons.map((balloon) => balloon.maxDist)).toEqual([BALLOON_RANGE_MIN, BALLOON_RANGE_MAX]);
  expect(world.balloons[0].x).toBe(308);
});
it('balloon passes through teammates', () => {
  const shooter = mkPlayer({ x: 100, y: 199, aimX: 250, aimY: 199 });
  const teammate = mkPlayer({ slot: 1, x: 125, y: 199 });
  const world = mkWorld([shooter, teammate]);
  tryThrow(world, shooter, []);
  for (let i = 0; i < 4; i++) stepBalloons(world, DT, []);
  expect(teammate.wet).toBe(0);
  expect(world.balloons).toHaveLength(1);
});
it('direct target is not splashed again, nearby enemy is, teammate is not', () => {
  const shooter = mkPlayer({ x: 100, y: 199, aimX: 250, aimY: 199 });
  const target = mkPlayer({ slot: 1, team: 1, x: 140, y: 199 });
  const nearby = mkPlayer({ slot: 2, team: 1, x: 140, y: 210 });
  const teammate = mkPlayer({ slot: 3, x: 140, y: 190 });
  const world = mkWorld([shooter, target, nearby, teammate]);
  const events: GameEvent[] = [];
  tryThrow(world, shooter, events);
  for (let i = 0; i < 8; i++) stepBalloons(world, DT, events);
  expect([target.wet, nearby.wet, teammate.wet]).toEqual([WET_DIRECT, WET_SPLASH, 0]);
  expect(target.stats.direct).toBe(0);
  expect(shooter.stats.direct).toBe(1);
  expect(events).toContainEqual(expect.objectContaining({ k: 'burst', direct: true }));
});
it('balloon bursts at cover surface', () => {
  const shooter = mkPlayer({ x: 150, y: 143, aimX: 260, aimY: 143 });
  const world = mkWorld([shooter]);
  const events: GameEvent[] = [];
  tryThrow(world, shooter, events);
  for (let i = 0; i < 12; i++) stepBalloons(world, DT, events);
  const burst = events.find((event) => event.k === 'burst');
  expect(burst?.k).toBe('burst');
  if (burst?.k === 'burst') expect(burst.x).toBeLessThanOrEqual(192);
  expect(world.balloons).toHaveLength(0);
});
it('throwing while protected removes protection', () => {
  const shooter = mkPlayer({ status: 'protected', aimX: 400, aimY: 199 });
  const world = mkWorld([shooter]);
  tryThrow(world, shooter, []);
  expect(shooter.status).toBe('alive');
  expect(world.balloons).toHaveLength(1);
});
it('no ammo means the throw press is dropped', () => {
  const shooter = mkPlayer({ ammo: 0 });
  const world = mkWorld([shooter]);
  tryThrow(world, shooter, []);
  shooter.ammo = 1;
  expect(world.balloons).toHaveLength(0);
});
it('balloon arc is visual and starts and ends at ground level', () => {
  const shooter = mkPlayer({ x: 100, aimX: 200, aimY: 199 });
  const world = mkWorld([shooter]);
  tryThrow(world, shooter, []);
  const balloon = world.balloons[0];
  expect(balloonHeight(balloon)).toBeCloseTo(0);
  balloon.traveled = balloon.maxDist / 2;
  expect(balloonHeight(balloon)).toBeCloseTo(8);
  balloon.traveled = balloon.maxDist;
  expect(balloonHeight(balloon)).toBeCloseTo(0);
});
