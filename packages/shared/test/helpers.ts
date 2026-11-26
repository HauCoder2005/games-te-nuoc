import { AMMO_MAX, MATCH_TIME, RAFT_H, RAFT_W } from '../src/config';
import type { InputFrame, PlayerState, RaftState, World } from '../src/sim/types';

export const R0: RaftState = { w: RAFT_W, h: RAFT_H, warn: false, warnTimer: 0 };

export function mkPlayer(over: Partial<PlayerState> = {}): PlayerState {
  return {
    slot: 0, team: 0, variant: 0, isBot: false, joinOrder: 0,
    x: 320, y: 199, mvx: 0, mvy: 0, kbx: 0, kby: 0, wet: 0,
    status: 'alive', timer: 0, ammo: AMMO_MAX, ammoTimer: 0, throwCd: 0, dashCd: 0,
    dashX: 0, dashY: 0, lastHitBy: null, lastHitTime: -Infinity,
    lastTh: 0, lastDa: 0, ackSeq: 0, facing: 1, aimX: 1, aimY: 0,
    stats: { ko: 0, direct: 0, falls: 0, streak: 0 },
    ...over,
  };
}

export function inp(over: Partial<InputFrame> = {}): InputFrame {
  return { seq: 0, mx: 0, my: 0, ax: 1, ay: 0, th: 0, da: 0, ...over };
}

export function mkWorld(players: PlayerState[] = []): World {
  return {
    tick: 0, time: 0, rng: 1, phase: 'playing', phaseTimer: 0, timeLeft: MATCH_TIME,
    settings: { teamSize: 5, scoreToWin: 10 }, players, balloons: [], nextBalloonId: 1,
    raft: { ...R0 }, score: [0, 0], lastMinuteDone: false, goldenTimer: 0, winner: null,
    chainCd: {},
  };
}
