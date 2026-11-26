import { expect, it } from 'vitest';
import { publicStartDecision } from '../src/rooms/lobby.js';

it.each([
  [1, 1, false, null], [2, 2, false, 3], [3, 2, false, 20],
  [4, 1, false, null], [10, 0, true, 10],
] as const)('public start decision %i humans, %i ready', (humans, ready, full, countdown) => {
  expect(publicStartDecision(humans, ready, full)?.countdown ?? null).toBe(countdown);
});
