import { Client, type Room } from '@colyseus/sdk';
import { ERROR_TEXT, normalizeRoomCode, PROTOCOL_VERSION, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@te-nuoc/shared';
import type { ErrorCode, PlayerStatus, Team } from '@te-nuoc/shared';

export interface NetLobbyPlayer {
  sessionId: string; slot: number; name: string; team: Team; variant: number;
  isBot: boolean; ready: boolean; connected: boolean;
}
export interface NetGamePlayer {
  slot: number; team: Team; variant: number; isBot: boolean; name: string;
  x: number; y: number; wet: number; status: PlayerStatus; timer: number;
  ammo: number; facing: 1 | -1; aimX: number; aimY: number; ackSeq: number; ko: number;
}
export interface NetState {
  lobby: {
    mode: string; code: string; hostSessionId: string; phase: string; countdown: number;
    teamSize: number; scoreToWin: number; botFill: boolean;
    players: Map<string, NetLobbyPlayer>;
  };
  game: {
    players: Map<string, NetGamePlayer>;
    balloons: Map<string, { id: number; owner: number; team: Team; x: number; y: number }>;
    raftW: number; raftH: number; warn: boolean; red: number; blue: number;
    phase: string; timeLeft: number;
  };
}
export type GameRoom = Room<unknown, NetState>;

export function parseRoute(hash: string): { roomCode: string | null } {
  const match = /^#\/r\/([^/]+)$/i.exec(hash);
  if (!match) return { roomCode: null };
  const code = normalizeRoomCode(match[1]);
  return { roomCode: validRoomCode(code) ? code : null };
}

function validRoomCode(code: string): boolean {
  return code.length === ROOM_CODE_LENGTH && [...code].every((letter) => ROOM_CODE_ALPHABET.includes(letter));
}

export function mapJoinError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String(error.message);
    if (message.includes(ERROR_TEXT.full)) return ERROR_TEXT.full;
    if (message.includes(ERROR_TEXT.version_mismatch)) return ERROR_TEXT.version_mismatch;
    if (message.includes(ERROR_TEXT.not_found) || message.includes('not found')) return ERROR_TEXT.not_found;
  }
  return 'Không kết nối được server';
}

export class GameClient {
  private readonly client: Client;
  constructor(url: string) { this.client = new Client(url); }
  async createPrivate(name: string): Promise<GameRoom> {
    return this.client.create<NetState>('match', { mode: 'private', name, v: PROTOCOL_VERSION });
  }
  async joinByCode(code: string, name: string): Promise<GameRoom> {
    const normalized = normalizeRoomCode(code);
    if (!validRoomCode(normalized)) throw new Error(ERROR_TEXT.not_found);
    return this.client.joinById<NetState>(normalized, { name, v: PROTOCOL_VERSION });
  }
  async quickMatch(name: string): Promise<GameRoom> {
    return this.client.joinOrCreate<NetState>('match', { mode: 'public', name, v: PROTOCOL_VERSION });
  }
}

export function connect(url = import.meta.env.VITE_SERVER_URL ?? `ws://${location.hostname}:2567`): GameClient {
  return new GameClient(url);
}

export function serverErrorMessage(code: unknown): string {
  return typeof code === 'string' && code in ERROR_TEXT ? ERROR_TEXT[code as ErrorCode] : ERROR_TEXT.bad_request;
}
