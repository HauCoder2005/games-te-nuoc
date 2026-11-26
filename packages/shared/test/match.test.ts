import { expect, it } from 'vitest';
import { FALL_TIME, GOLDEN_SHRINK_EVERY, PILLAR_CAPTURE_TIME, PILLAR_HOLD_SCORE_TIME, SHRINK_WARNING } from '../src/config';
import { computeAwards, onFall, updateClock, updatePillar } from '../src/sim/match';
import type { GameEvent } from '../src/sim/types';
import { mkPlayer, mkWorld } from './helpers';

it('self fall scores for opposing team', () => {
  const red = mkPlayer();
  const world = mkWorld([red, mkPlayer({ slot: 1, team: 1 })]);
  const events: GameEvent[] = [];
  onFall(world, red, events);
  expect(world.score).toEqual([0, 1]);
  expect(red.status).toBe('falling');
  expect(red.timer).toBe(FALL_TIME);
  expect(events).toContainEqual({ k: 'fall', slot: 0, by: null });
});
it('KO credit expires and streak banners occur at 3 and 5', () => {
  const red = mkPlayer({ slot: 0, team: 0 });
  const blue = mkPlayer({ slot: 1, team: 1 });
  const world = mkWorld([red, blue]);
  const events: GameEvent[] = [];
  for (let n = 1; n <= 5; n++) {
    red.status = 'alive'; red.lastHitBy = blue.slot; red.lastHitTime = world.time;
    onFall(world, red, events);
    expect(blue.stats.ko).toBe(n);
  }
  expect(events).toContainEqual({ k: 'streak', slot: 1, n: 3 });
  expect(events).toContainEqual({ k: 'streak', slot: 1, n: 5 });
  red.status = 'alive'; red.lastHitTime = world.time - 4;
  onFall(world, red, events);
  expect(events.at(-2)).toEqual({ k: 'fall', slot: 0, by: null });
  expect(blue.stats.ko).toBe(5);
  blue.status = 'alive'; onFall(world, blue, events);
  expect(blue.stats.streak).toBe(0);
});
it('match point and win use selected score target', () => {
  const red = mkPlayer({ slot: 0, team: 0 });
  const blue = mkPlayer({ slot: 1, team: 1 });
  const world = mkWorld([red, blue]);
  world.settings.scoreToWin = 5;
  world.score = [3, 0];
  const events: GameEvent[] = [];
  onFall(world, blue, events);
  expect(events).toContainEqual({ k: 'matchPoint', teams: [0] });
  blue.status = 'alive'; onFall(world, blue, events);
  expect(world.phase).toBe('matchEnd');
  expect(world.winner).toBe(0);
});
it('last minute warns then shrinks after 3 seconds', () => {
  const world = mkWorld();
  const events: GameEvent[] = [];
  world.timeLeft = 60.1;
  updateClock(world, 0.2, events);
  expect(events).toContainEqual({ k: 'lastMinute' });
  expect(events).toContainEqual({ k: 'shrinkWarn' });
  expect(world.raft.warn).toBe(true);
  updateClock(world, SHRINK_WARNING, events);
  expect([world.raft.w, world.raft.h]).toEqual([30, 12]);
});
it('tie at timeout enters golden and next score wins', () => {
  const red = mkPlayer({ slot: 0, team: 0 });
  const blue = mkPlayer({ slot: 1, team: 1 });
  const world = mkWorld([red, blue]);
  world.timeLeft = 0.1;
  world.score = [4, 4];
  world.raft.w = 30; world.raft.h = 12;
  const events: GameEvent[] = [];
  updateClock(world, 0.2, events);
  expect(world.phase).toBe('golden');
  expect(events).toContainEqual({ k: 'golden' });
  expect(world.raft.warn).toBe(true);
  updateClock(world, SHRINK_WARNING, events);
  expect([world.raft.w, world.raft.h]).toEqual([28, 10]);
  onFall(world, blue, events);
  expect(world.winner).toBe(0);
});
it('golden keeps shrinking every interval down to 20x4', () => {
  const world = mkWorld();
  world.phase = 'golden'; world.raft = { w: 28, h: 10, warn: false, warnTimer: 0 };
  const events: GameEvent[] = [];
  for (let i = 0; i < 6; i++) updateClock(world, GOLDEN_SHRINK_EVERY, events);
  expect([world.raft.w, world.raft.h]).toEqual([20, 4]);
});
it('awards use join order for ties', () => {
  const first = mkPlayer({ slot: 3, joinOrder: 0, stats: { ko: 2, direct: 4, falls: 3, streak: 0 } });
  const second = mkPlayer({ slot: 1, joinOrder: 1, stats: { ko: 2, direct: 4, falls: 3, streak: 0 } });
  expect(computeAwards(mkWorld([second, first]))).toEqual({ mvp: 3, sharpshooter: 3, mostFalls: 3 });
});
it('center pillar takes long to capture, stalls when contested, and scores over time', () => {
  const red = mkPlayer({ slot: 0, team: 0, x: 320, y: 199 });
  const blue = mkPlayer({ slot: 1, team: 1, x: 500, y: 199 });
  const world = mkWorld([red, blue]);
  const events: GameEvent[] = [];

  // Halfway capture
  updatePillar(world, PILLAR_CAPTURE_TIME / 2, events);
  expect(world.pillar.capturingTeam).toBe(0);
  expect(world.pillar.progress).toBeCloseTo(0.5);
  expect(world.pillar.owner).toBeNull();

  // Enemy steps into center pillar zone -> contested, progress freezes
  blue.x = 325;
  updatePillar(world, 5, events);
  expect(world.pillar.contested).toBe(true);
  expect(world.pillar.progress).toBeCloseTo(0.5);

  // Enemy knocked out of zone -> capture completes after remaining half
  blue.x = 500;
  updatePillar(world, PILLAR_CAPTURE_TIME / 2 + 0.1, events);
  expect(world.pillar.owner).toBe(0);
  expect(world.pillar.round).toBe(2);
  expect(world.score).toEqual([1, 0]);
  expect(events).toContainEqual({ k: 'pillarCaptured', team: 0 });

  // Holding the captured pillar generates extra points every PILLAR_HOLD_SCORE_TIME seconds
  updatePillar(world, PILLAR_HOLD_SCORE_TIME + 0.1, events);
  expect(world.score).toEqual([2, 0]);
});
