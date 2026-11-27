import { Room, type Client, ServerError } from 'colyseus';
import { randomInt } from 'node:crypto';
import {
  addPlayer, botInput, botName, createBotMemory, createMatch, DT, ERROR_TEXT, MATCH_TIME,
  MAX_PLAYERS, MSG, normalizeName, PROTOCOL_VERSION, RAFT_H, RAFT_W, RNG_DIVISOR,
  SCORE_TO_WIN, setBot, step, validateInput, removePlayer, RECONNECT_GRACE, MAX_ROOMS_PER_IP_PER_MIN,
  TICK_METRICS_EVERY, TOTAL_ROUNDS,
  LOBBY_TICK_MS,
} from '@te-nuoc/shared';
import type { ErrorCode, InputFrame, World } from '@te-nuoc/shared';
import { GameState, LobbyPlayer, LobbyState, RoomState } from './schema.js';
import { generateRoomCode, releaseRoomCode } from './roomCode.js';
import { LobbyModel, publicStartDecision } from './lobby.js';
import { MsgLimiter } from './msgLimiter.js';
import { syncState } from './syncState.js';
import { RateLimiter } from './rateLimit.js';

export const roomCreationLimit = new RateLimiter(MAX_ROOMS_PER_IP_PER_MIN);

interface JoinOptions { mode: 'public' | 'private'; name: string; username?: string; v: number; variant?: number }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class MatchRoom extends Room<{ state: RoomState }> {
  maxClients = MAX_PLAYERS;
  state = new RoomState();
  world: World | null = null;
  private mode: 'public' | 'private' = 'public';
  private code = '';
  private lobby!: LobbyModel;
  private readonly limiter = new MsgLimiter();
  private readonly latestInputs = new Map<number, InputFrame>();
  private readonly previousInputs = new Map<string, InputFrame>();
  private readonly botMemory = new Map<number, ReturnType<typeof createBotMemory>>();
  private readonly namesBySlot = new Map<number, string>();
  private matchEndLogged = false;
  private creatorChecked = false;
  private tickCount = 0;
  private tickTotalMs = 0;
  private tickMaxMs = 0;

  messages = {
    [MSG.input]: (client: Client, raw: unknown) => this.receiveInput(client, raw),
    [MSG.start]: (client: Client) => { if (this.limiter.allow(client.sessionId, Date.now())) this.startMatch(client); },
    [MSG.team]: (client: Client, raw: unknown) => {
      if (!this.limiter.allow(client.sessionId, Date.now())) return;
      const team = isObject(raw) ? raw.team : undefined;
      const error = team === 0 || team === 1 ? this.lobby.setTeam(client.sessionId, team) : 'bad_request';
      if (error) this.sendError(client, error); else this.syncLobby();
    },
    [MSG.settings]: (client: Client, raw: unknown) => {
      if (!this.limiter.allow(client.sessionId, Date.now())) return;
      const error = isObject(raw) ? this.lobby.setSettings(client.sessionId, raw) : 'bad_request';
      if (error) this.sendError(client, error); else this.syncLobby();
    },
    [MSG.shuffle]: (client: Client) => {
      if (!this.limiter.allow(client.sessionId, Date.now())) return;
      const error = this.lobby.shuffle(client.sessionId, () => randomInt(RNG_DIVISOR) / RNG_DIVISOR);
      if (error) this.sendError(client, error); else this.syncLobby();
    },
    [MSG.ready]: (client: Client, raw: unknown) => {
      if (!this.limiter.allow(client.sessionId, Date.now())) return;
      const member = this.lobby.members.find((candidate) => candidate.sessionId === client.sessionId);
      if (this.mode !== 'public' || !member || this.world || !isObject(raw) || typeof raw.on !== 'boolean') {
        this.sendError(client, 'bad_request');
        return;
      }
      member.ready = raw.on;
      this.updatePublicCountdown();
      this.syncLobby();
    },
  };

  private newGameState(): GameState {
    return new GameState({
      raftW: RAFT_W, raftH: RAFT_H, warn: false, red: 0, blue: 0,
      phase: 'countdown', timeLeft: MATCH_TIME,
      pillarOwner: -1, pillarTeam: -1, pillarProgress: 0, pillarContested: false, pillarHold: 0,
      pillarRound: 1, pillarMaxRounds: TOTAL_ROUNDS,
    });
  }

  private log(evt: string): void {
    console.log(JSON.stringify({ evt, roomId: this.roomId, mode: this.mode, humans: this.lobby?.members.length ?? 0 }));
  }

  async onCreate(options: unknown): Promise<void> {
    if (!isObject(options) || (options.mode !== 'public' && options.mode !== 'private')) {
      throw new ServerError(400, ERROR_TEXT.bad_request);
    }
    this.mode = options.mode;
    this.lobby = new LobbyModel(this.mode);
    this.state.lobby = new LobbyState({
      mode: this.mode, code: '', hostSessionId: '', phase: 'lobby', countdown: 0,
      teamSize: 5, scoreToWin: SCORE_TO_WIN, botFill: true,
    });
    this.state.game = this.newGameState();
    if (this.mode === 'private') {
      this.code = await generateRoomCode(this.presence);
      this.roomId = this.code;
      this.state.lobby.code = this.code;
      await this.setPrivate(true);
    }
    this.startLobbyClock();
    this.log('room_created');
  }

  onAuth(_client: Client, options: unknown, context: { ip?: string }): boolean {
    if (!isObject(options) || options.v !== PROTOCOL_VERSION) {
      throw new ServerError(400, ERROR_TEXT.version_mismatch);
    }
    if (!normalizeName(options.name)) throw new ServerError(400, ERROR_TEXT.bad_request);
    if (this.mode === 'private' && !this.creatorChecked) {
      this.creatorChecked = true;
      if (!roomCreationLimit.hit(context.ip ?? 'unknown', Date.now())) throw new ServerError(429, ERROR_TEXT.rate_limited);
    }
    return true;
  }

  onJoin(client: Client, options: JoinOptions): void {
    const name = normalizeName(options.name);
    if (!name) throw new ServerError(400, ERROR_TEXT.bad_request);
    try {
      const member = this.world
        ? this.lobby.replaceBotWith(client.sessionId, name, options.variant, options.username)
        : this.lobby.join(client.sessionId, name, options.variant, options.username);
      if (!member) throw new Error('full');
      if (this.world) {
        const player = this.world.players.find((candidate) => candidate.slot === member.slot);
        if (player) setBot(this.world, member.slot, false);
        else addPlayer(this.world, { slot: member.slot, team: member.team, variant: member.variant, isBot: false, joinOrder: member.joinOrder });
        this.botMemory.delete(member.slot);
        this.namesBySlot.set(member.slot, member.name);
        syncState(this.world, this.state.game, this.namesBySlot);
      }
      this.updatePublicCountdown();
      this.syncLobby();
    } catch (error) {
      throw new ServerError(400, error instanceof Error && error.message === 'full' ? ERROR_TEXT.full : ERROR_TEXT.bad_request);
    }
  }

  onDrop(client: Client): void {
    const member = this.lobby.members.find((candidate) => candidate.sessionId === client.sessionId);
    if (!member || !this.world) { this.finalizeLeave(client.sessionId); return; }
    member.connected = false;
    const previous = this.previousInputs.get(client.sessionId);
    this.latestInputs.set(member.slot, {
      seq: (previous?.seq ?? 0) + 1, mx: 0, my: 0,
      ax: previous?.ax ?? RAFT_W, ay: previous?.ay ?? RAFT_H,
      th: previous?.th ?? 0, da: previous?.da ?? 0,
    });
    this.syncLobby();
    void this.allowReconnection(client, RECONNECT_GRACE).then(() => {
      member.connected = true;
      this.latestInputs.delete(member.slot);
      this.previousInputs.delete(client.sessionId);
      const player = this.world?.players.find((candidate) => candidate.slot === member.slot);
      if (player) { player.lastTh = 0; player.lastDa = 0; }
      this.syncLobby();
    }).catch(() => this.finalizeLeave(client.sessionId));
  }

  onLeave(client: Client): void { this.finalizeLeave(client.sessionId); }

  private finalizeLeave(sessionId: string): void {
    const member = this.lobby.members.find((candidate) => candidate.sessionId === sessionId);
    if (member && this.world) {
      this.latestInputs.delete(member.slot);
      this.previousInputs.delete(sessionId);
      if (this.lobby.settings.botFill) {
        setBot(this.world, member.slot, true);
        this.namesBySlot.delete(member.slot);
        this.namesBySlot.set(member.slot, botName([...this.namesBySlot.values()]));
        this.botMemory.set(member.slot, createBotMemory(randomInt(RNG_DIVISOR)));
      } else removePlayer(this.world, member.slot);
      syncState(this.world, this.state.game, this.namesBySlot);
    }
    this.lobby.leave(sessionId);
    this.limiter.remove(sessionId);
    this.updatePublicCountdown();
    this.syncLobby();
  }

  async onDispose(): Promise<void> {
    if (this.tickCount > 0) {
      console.log(JSON.stringify({ evt: 'tick_metrics', roomId: this.roomId,
        avgMs: Number((this.tickTotalMs / this.tickCount).toFixed(3)),
        maxMs: Number(this.tickMaxMs.toFixed(3)), ticks: this.tickCount }));
      this.tickCount = 0; this.tickTotalMs = 0; this.tickMaxMs = 0;
    }
    if (this.code) await releaseRoomCode(this.presence, this.code);
    this.log('room_disposed');
  }

  private syncLobby(): void {
    const target = this.state.lobby;
    target.mode = this.mode;
    target.code = this.code;
    target.hostSessionId = this.lobby.hostId ?? '';
    target.phase = this.lobby.phase;
    target.countdown = this.publicCountdown;
    target.teamSize = this.lobby.settings.teamSize;
    target.scoreToWin = this.lobby.settings.scoreToWin;
    target.botFill = this.lobby.settings.botFill;
    const keys = new Set<string>();
    for (const member of this.lobby.members) {
      keys.add(member.sessionId);
      let schemaMember = target.players.get(member.sessionId);
      if (!schemaMember) {
        schemaMember = new LobbyPlayer();
        target.players.set(member.sessionId, schemaMember);
      }
      schemaMember.sessionId = member.sessionId;
      schemaMember.slot = member.slot;
      schemaMember.username = member.username;
      schemaMember.name = member.name;
      schemaMember.team = member.team;
      schemaMember.variant = member.variant;
      schemaMember.isBot = false;
      schemaMember.ready = member.ready;
      schemaMember.connected = member.connected;
    }
    for (const key of target.players.keys()) if (!keys.has(key)) target.players.delete(key);
  }

  private sendError(client: Client, code: ErrorCode): void {
    client.send(MSG.error, { code, message: ERROR_TEXT[code] });
  }

  private receiveInput(client: Client, raw: unknown): void {
    if (!this.limiter.allow(client.sessionId, Date.now()) || !this.world) return;
    const member = this.lobby.members.find((candidate) => candidate.sessionId === client.sessionId);
    if (!member) return;
    const frame = validateInput(raw, this.previousInputs.get(client.sessionId) ?? null);
    if (!frame) return;
    this.previousInputs.set(client.sessionId, frame);
    this.latestInputs.set(member.slot, frame);
  }

  private startMatch(client: Client): void {
    const error = this.lobby.canHostStart(client.sessionId);
    if (error) { this.sendError(client, error); return; }
    this.beginMatch();
  }

  private publicCountdown = 0;

  private updatePublicCountdown(): void {
    if (this.mode !== 'public' || this.world) return;
    const humans = this.lobby.members.length;
    const ready = this.lobby.members.filter((member) => member.ready).length;
    const decision = publicStartDecision(humans, ready, humans >= MAX_PLAYERS);
    if (!decision) {
      this.publicCountdown = 0;
      this.lobby.phase = 'lobby';
    } else {
      this.publicCountdown = this.publicCountdown > 0
        ? Math.min(this.publicCountdown, decision.countdown) : decision.countdown;
      this.lobby.phase = 'starting';
    }
  }

  private beginMatch(): void {
    const roster = this.lobby.buildRoster();
    const seed = randomInt(RNG_DIVISOR);
    this.world = createMatch(seed, roster, this.lobby.settings);
    this.namesBySlot.clear();
    this.botMemory.clear();
    this.latestInputs.clear();
    this.previousInputs.clear();
    for (const entry of roster) {
      this.namesBySlot.set(entry.slot, entry.name);
      if (entry.isBot) this.botMemory.set(entry.slot, createBotMemory(seed + entry.slot));
    }
    this.lobby.phase = 'match';
    this.publicCountdown = 0;
    if (this.mode === 'public') void this.lock();
    this.matchEndLogged = false;
    this.syncLobby();
    syncState(this.world, this.state.game, this.namesBySlot);
    this.setFixedTimestep((context) => this.tick(context.dt), 1 / DT);
    this.log('match_started');
  }

  private startLobbyClock(): void {
    this.setTimestep((deltaMs) => {
      if (this.mode !== 'public' || this.publicCountdown <= 0 || this.world) return;
      this.publicCountdown = Math.max(0, this.publicCountdown - deltaMs / 1000);
      this.state.lobby.countdown = this.publicCountdown;
      if (this.publicCountdown === 0) this.beginMatch();
    }, LOBBY_TICK_MS);
  }

  private tick(dt: number): void {
    if (!this.world) return;
    const tickStart = performance.now();
    const active = this.world.phase === 'playing' || this.world.phase === 'golden';
    const inputs = active ? new Map(this.latestInputs) : new Map<number, InputFrame>();
    if (active) {
      for (const player of this.world.players) {
        if (!player.isBot) continue;
        let memory = this.botMemory.get(player.slot);
        if (!memory) {
          memory = createBotMemory(randomInt(RNG_DIVISOR));
          this.botMemory.set(player.slot, memory);
        }
        inputs.set(player.slot, botInput(this.world, player.slot, memory));
      }
    }
    const events = step(this.world, inputs, dt);
    syncState(this.world, this.state.game, this.namesBySlot);
    if (events.length) this.broadcast(MSG.events, events);
    if (this.world.phase === 'matchEnd' && !this.matchEndLogged) {
      this.matchEndLogged = true;
      this.log('match_ended');
    }
    if (this.world.phase === 'matchEnd' && this.world.phaseTimer <= 0) {
      this.world = null;
      this.state.game = this.newGameState();
      this.lobby.phase = 'lobby';
      for (const member of this.lobby.members) member.ready = false;
      if (this.mode === 'public' && this.lobby.members.length < MAX_PLAYERS) void this.unlock();
      this.syncLobby();
      this.startLobbyClock();
    }
    const tickMs = performance.now() - tickStart;
    this.tickCount++;
    this.tickTotalMs += tickMs;
    this.tickMaxMs = Math.max(this.tickMaxMs, tickMs);
    if (this.tickCount >= TICK_METRICS_EVERY || (this.world === null && this.tickCount > 0)) {
      console.log(JSON.stringify({ evt: 'tick_metrics', roomId: this.roomId,
        avgMs: Number((this.tickTotalMs / this.tickCount).toFixed(3)),
        maxMs: Number(this.tickMaxMs.toFixed(3)), ticks: this.tickCount }));
      this.tickCount = 0; this.tickTotalMs = 0; this.tickMaxMs = 0;
    }
  }
}
