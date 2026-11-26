import { COVERS, RAFT_CENTER, RAFT_MIN_H, RAFT_MIN_W, TILE } from '../config';
import type { RaftState, Team } from './types';

export interface Rect { x0: number; y0: number; x1: number; y1: number }

export function raftRect(r: RaftState): Rect {
  return {
    x0: RAFT_CENTER.x - r.w * TILE / 2,
    y0: RAFT_CENTER.y - r.h * TILE / 2,
    x1: RAFT_CENTER.x + r.w * TILE / 2,
    y1: RAFT_CENTER.y + r.h * TILE / 2,
  };
}

export function isOnRaft(x: number, y: number, r: RaftState): boolean {
  const bounds = raftRect(r);
  return x > bounds.x0 && x < bounds.x1 && y > bounds.y0 && y < bounds.y1;
}

export function homeZone(team: Team, r: RaftState): Rect {
  const bounds = raftRect(r);
  return {
    x0: team === 0 ? bounds.x0 + TILE : bounds.x1 - 4 * TILE,
    x1: team === 0 ? bounds.x0 + 4 * TILE : bounds.x1 - TILE,
    y0: bounds.y0 + TILE,
    y1: bounds.y1 - TILE,
  };
}

export function activeCovers(r: RaftState): { x: number; y: number }[] {
  const bounds = raftRect(r);
  const half = TILE / 2;
  return COVERS.filter(({ x, y }) =>
    x - half >= bounds.x0 && x + half <= bounds.x1 &&
    y - half >= bounds.y0 && y + half <= bounds.y1,
  ).map(({ x, y }) => ({ x, y }));
}

export function shrunk(r: RaftState): RaftState {
  return {
    w: Math.max(RAFT_MIN_W, r.w - 2),
    h: Math.max(RAFT_MIN_H, r.h - 2),
    warn: false,
    warnTimer: 0,
  };
}
