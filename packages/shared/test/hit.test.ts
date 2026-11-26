import { expect, it } from 'vitest';
import { HITSTUN, KB_DIRECT, KB_DASH, WET_DASH } from '../src/config';
import { applyHit } from '../src/sim/hit';
import { mkPlayer } from './helpers';

it('adds wet before calculating knockback', () => {
  const target = mkPlayer({ wet: 40 });
  const force = applyHit(target, 'direct', 1, 0, 9, 2);
  expect(target.wet).toBe(50);
  expect(force).toBeCloseTo(KB_DIRECT * 2);
  expect(target.kbx).toBeCloseTo(force);
  expect(target.status).toBe('hitstun');
  expect(target.timer).toBe(HITSTUN);
  expect([target.lastHitBy, target.lastHitTime]).toEqual([9, 2]);
});
it('normalizes hit direction and adds to existing knockback', () => {
  const target = mkPlayer({ kbx: 12 });
  const force = applyHit(target, 'dash', 3, 4, 9, 2);
  expect(target.wet).toBe(WET_DASH);
  expect(force).toBeCloseTo(KB_DASH * (1 + WET_DASH / 50));
  expect(target.kbx).toBeCloseTo(12 + force * 3 / 5);
  expect(target.kby).toBeCloseTo(force * 4 / 5);
});
it.each(['protected', 'falling', 'respawning'] as const)('%s player ignores hits', (status) => {
  const target = mkPlayer({ status });
  expect(applyHit(target, 'direct', 1, 0, 9, 0)).toBe(0);
  expect([target.wet, target.kbx, target.lastHitBy]).toEqual([0, 0, null]);
});
