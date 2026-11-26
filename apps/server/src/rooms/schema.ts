import { schema, t, type SchemaType } from '@colyseus/schema';

export const LobbyPlayer = schema({
  sessionId: t.string(), slot: t.uint8(), name: t.string(), team: t.uint8(),
  variant: t.uint8(), isBot: t.boolean(), ready: t.boolean(), connected: t.boolean(),
}, 'LobbyPlayer');
export type LobbyPlayer = SchemaType<typeof LobbyPlayer>;

export const LobbyState = schema({
  mode: t.string(), code: t.string(), hostSessionId: t.string(), phase: t.string(),
  countdown: t.float32(), teamSize: t.uint8(), scoreToWin: t.uint8(),
  botFill: t.boolean(), players: t.map(LobbyPlayer),
}, 'LobbyState');
export type LobbyState = SchemaType<typeof LobbyState>;

export const GamePlayer = schema({
  slot: t.uint8(), team: t.uint8(), variant: t.uint8(), isBot: t.boolean(), name: t.string(),
  x: t.float32(), y: t.float32(), wet: t.float32(),
  status: t.string(), timer: t.float32(), ammo: t.uint8(), facing: t.int8(),
  aimX: t.float32(), aimY: t.float32(), ackSeq: t.uint32(), ko: t.uint8(),
}, 'GamePlayer');
export type GamePlayer = SchemaType<typeof GamePlayer>;

export const GameBalloon = schema({
  id: t.uint32(), owner: t.uint8(), team: t.uint8(), x: t.float32(), y: t.float32(),
}, 'GameBalloon');
export type GameBalloon = SchemaType<typeof GameBalloon>;

export const GameState = schema({
  players: t.map(GamePlayer), balloons: t.map(GameBalloon),
  raftW: t.uint8(), raftH: t.uint8(), warn: t.boolean(), red: t.uint8(), blue: t.uint8(),
  phase: t.string(), timeLeft: t.float32(),
}, 'GameState');
export type GameState = SchemaType<typeof GameState>;

export const RoomState = schema({ lobby: LobbyState, game: GameState }, 'RoomState');
export type RoomState = SchemaType<typeof RoomState>;
