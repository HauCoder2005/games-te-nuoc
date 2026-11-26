export type Team = 0 | 1;
export type PlayerStatus = 'alive' | 'hitstun' | 'dashing' | 'falling' | 'respawning' | 'protected';
export type Phase = 'countdown' | 'playing' | 'golden' | 'matchEnd';
export interface InputFrame { seq: number; mx: number; my: number; ax: number; ay: number; th: number; da: number }
export interface MatchSettings { teamSize: 4 | 5; scoreToWin: 5 | 10 | 15 }
export interface RosterEntry { slot: number; team: Team; variant: number; isBot: boolean; joinOrder: number }
export interface PlayerStats { ko: number; direct: number; falls: number; streak: number }
export interface PlayerState extends RosterEntry {
  x: number; y: number; mvx: number; mvy: number; kbx: number; kby: number; wet: number;
  status: PlayerStatus; timer: number; ammo: number; ammoTimer: number; throwCd: number; dashCd: number;
  dashX: number; dashY: number; lastHitBy: number | null; lastHitTime: number;
  lastTh: number; lastDa: number; ackSeq: number; facing: 1 | -1; aimX: number; aimY: number; stats: PlayerStats;
}
export interface BalloonState { id: number; owner: number; team: Team; x: number; y: number; dx: number; dy: number; traveled: number; maxDist: number }
export interface RaftState { w: number; h: number; warn: boolean; warnTimer: number }
export interface PillarState {
  owner: Team | null;
  capturingTeam: Team | null;
  progress: number;
  contested: boolean;
  holdTimer: number;
}
export interface World {
  tick: number; time: number; rng: number; phase: Phase; phaseTimer: number; timeLeft: number;
  settings: MatchSettings; players: PlayerState[]; balloons: BalloonState[]; nextBalloonId: number;
  raft: RaftState; pillar: PillarState; score: [number, number]; lastMinuteDone: boolean; goldenTimer: number; winner: Team | null;
  chainCd: Record<string, number>;
}
export type GameEvent =
  | { k: 'throw'; slot: number } | { k: 'burst'; x: number; y: number; direct: boolean; team: Team }
  | { k: 'hit'; slot: number; wet: number; by: number } | { k: 'fall'; slot: number; by: number | null }
  | { k: 'score'; team: Team; red: number; blue: number } | { k: 'respawn'; slot: number }
  | { k: 'streak'; slot: number; n: number } | { k: 'matchPoint'; teams: Team[] }
  | { k: 'pillarCaptured'; team: Team }
  | { k: 'lastMinute' } | { k: 'golden' } | { k: 'shrinkWarn' } | { k: 'shrink'; w: number; h: number }
  | { k: 'matchEnd'; winner: Team; awards: Awards };
export interface Awards { mvp: number | null; sharpshooter: number | null; mostFalls: number | null }
