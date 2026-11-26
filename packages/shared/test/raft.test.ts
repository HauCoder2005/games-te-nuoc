import { expect, it } from 'vitest';
import { activeCovers, homeZone, isOnRaft, raftRect, shrunk } from '../src/sim/raft';
import type { RaftState } from '../src/sim/types';

const R0: RaftState = { w: 32, h: 14, warn: false, warnTimer: 0 };

it('raftRect of 32x14 is x 64..576, y 87..311', () => {
  expect(raftRect(R0)).toEqual({ x0: 64, y0: 87, x1: 576, y1: 311 });
});
it('edge is water', () => {
  expect(isOnRaft(64.5, 199, R0)).toBe(true);
  expect(isOnRaft(64, 199, R0)).toBe(false);
  expect(isOnRaft(63.9, 199, R0)).toBe(false);
});
it('home zones use columns 2–4 and omit the top and bottom rows', () => {
  expect(homeZone(0, R0)).toEqual({ x0: 80, y0: 103, x1: 128, y1: 295 });
  expect(homeZone(1, R0)).toEqual({ x0: 512, y0: 103, x1: 560, y1: 295 });
});
it('covers sink when their whole tile no longer fits the raft', () => {
  expect(activeCovers(R0)).toHaveLength(4);
  expect(activeCovers({ ...R0, w: 26, h: 8 })).toHaveLength(4);
  expect(activeCovers({ ...R0, w: 24, h: 6 })).toHaveLength(0);
});
it('shrunk stops at 20x4 and clears the warning', () => {
  expect(shrunk({ ...R0, w: 20, h: 4, warn: true, warnTimer: 1 })).toEqual({ w: 20, h: 4, warn: false, warnTimer: 0 });
});
