import { describe, expect, it } from 'vitest';
import { mulberry32, nextRng } from '../src/sim/rng';

describe('seeded RNG', () => {
  it('mulberry32 is deterministic', () => {
    const a = mulberry32(42), b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it('nextRng returns value in [0,1) and new state', () => {
    const [v, s] = nextRng(1);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
    expect(s).not.toBe(1);
  });
});
