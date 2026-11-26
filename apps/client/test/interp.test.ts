import { expect, it } from 'vitest';
import { Interpolator } from '../src/net/interp';

it('interpolates halfway and limits extrapolation to 100ms', () => {
  const interp = new Interpolator();
  interp.push(0, { x: 0, y: 0 });
  interp.push(100, { x: 10, y: 20 });
  expect(interp.sample(50)).toEqual({ x: 5, y: 10 });
  expect(interp.sample(400).x).toBeCloseTo(20);
});
