import { expect, it } from 'vitest';
import { COVERS, DT, POOL_RECT, RAFT_CENTER, RAFT_H, RAFT_MIN_H, RAFT_MIN_W, RAFT_W, ROOM_CODE_ALPHABET, TEAM_COLORS } from '../src/config';

it('raft fits inside pool', () => {
  expect(RAFT_CENTER.x - RAFT_W * 8).toBeGreaterThan(POOL_RECT.x0);
  expect(RAFT_CENTER.y + RAFT_H * 8).toBeLessThan(POOL_RECT.y1);
});
it('room code alphabet excludes I and O', () => {
  expect(ROOM_CODE_ALPHABET).not.toMatch(/[IO]/);
  expect(ROOM_CODE_ALPHABET).toHaveLength(24);
});
it('keeps the world and team defaults from the design', () => {
  expect(DT).toBe(1 / 30);
  expect([RAFT_W, RAFT_H, RAFT_MIN_W, RAFT_MIN_H]).toEqual([32, 14, 20, 4]);
  expect(COVERS).toEqual([{ x: 200, y: 143 }, { x: 440, y: 143 }, { x: 200, y: 255 }, { x: 440, y: 255 }]);
  expect(TEAM_COLORS).toEqual(['#E53B3B', '#3B8BF0']);
});
