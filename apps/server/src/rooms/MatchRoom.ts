import { Room, type Client, ServerError } from 'colyseus';
import { ERROR_TEXT, MATCH_TIME, MAX_PLAYERS, normalizeName, PROTOCOL_VERSION, RAFT_H, RAFT_W, SCORE_TO_WIN } from '@te-nuoc/shared';
import { GameState, LobbyPlayer, LobbyState, RoomState } from './schema.js';

interface JoinOptions { mode: 'public' | 'private'; name: string; v: number }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class MatchRoom extends Room<{ state: RoomState }> {
  maxClients = MAX_PLAYERS;
  state = new RoomState();
  private mode: 'public' | 'private' = 'public';

  onCreate(options: unknown): void {
    if (!isObject(options) || (options.mode !== 'public' && options.mode !== 'private')) {
      throw new ServerError(400, ERROR_TEXT.bad_request);
    }
    this.mode = options.mode;
    this.state.lobby = new LobbyState({
      mode: this.mode, code: '', hostSessionId: '', phase: 'lobby', countdown: 0,
      teamSize: 5, scoreToWin: SCORE_TO_WIN, botFill: true,
    });
    this.state.game = new GameState({
      raftW: RAFT_W, raftH: RAFT_H, warn: false, red: 0, blue: 0, phase: 'countdown', timeLeft: MATCH_TIME,
    });
  }

  onAuth(_client: Client, options: unknown): boolean {
    if (!isObject(options) || options.v !== PROTOCOL_VERSION) {
      throw new ServerError(400, ERROR_TEXT.version_mismatch);
    }
    if (!normalizeName(options.name)) throw new ServerError(400, ERROR_TEXT.bad_request);
    return true;
  }

  onJoin(client: Client, options: JoinOptions): void {
    const name = normalizeName(options.name);
    if (!name) throw new ServerError(400, ERROR_TEXT.bad_request);
    const slot = this.state.lobby.players.size;
    const team = slot % 2;
    this.state.lobby.players.set(client.sessionId, new LobbyPlayer({
      sessionId: client.sessionId, slot, name, team, variant: Math.floor(slot / 2),
      isBot: false, ready: false, connected: true,
    }));
    if (this.mode === 'private' && !this.state.lobby.hostSessionId) this.state.lobby.hostSessionId = client.sessionId;
  }

  onLeave(client: Client): void {
    this.state.lobby.players.delete(client.sessionId);
  }
}
