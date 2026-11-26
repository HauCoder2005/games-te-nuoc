import { expect, it } from 'vitest';
import { POOL_RECT, RAFT_CENTER, RAFT_H, RAFT_W, ROOM_CODE_ALPHABET } from '../src/config';

it('raft fits inside pool', () => {
  expect(RAFT_CENTER.x - RAFT_W * 8).toBeGreaterThan(POOL_RECT.x0);
  expect(RAFT_CENTER.y + RAFT_H * 8).toBeLessThan(POOL_RECT.y1);
});
it('room code alphabet excludes I and O', () => {
  expect(ROOM_CODE_ALPHABET).not.toMatch(/[IO]/);
  expect(ROOM_CODE_ALPHABET).toHaveLength(24);
});
