import { expect, it } from 'vitest';
import { publicCanStart } from '../src/rooms/lobby.js';

it.each([1, 2, 5, 9, 10] as const)('public match needs ten humans (%i joined)', (humans) => {
  expect(publicCanStart(humans)).toBe(humans === 10);
});
