import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { boot, type ColyseusTestServer } from '@colyseus/testing';
import appConfig from '../src/app.config.js';
import { MatchRoom } from '../src/rooms/MatchRoom.js';

let server: ColyseusTestServer<typeof appConfig>;
beforeAll(async () => { server = await boot(appConfig, 2573); });
afterAll(async () => { await server.shutdown(); });
beforeEach(async () => { await server.cleanup(); });
const options = (name: string) => ({ mode: 'public', name, v: 3 });

it('waits for ten humans, starts automatically without bots, and routes an eleventh elsewhere', async () => {
  const clients = [];
  for (let i = 0; i < 9; i++) clients.push(await server.sdk.joinOrCreate('match', options(`P${i}`)));
  const room = server.getRoomById(clients[0].roomId) as MatchRoom;
  expect(room.world).toBeNull();
  expect(room.state.lobby.botFill).toBe(false);
  clients.push(await server.sdk.joinOrCreate('match', options('P9')));
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(room.world).not.toBeNull();
  expect(room.world?.players).toHaveLength(10);
  expect(room.world?.players.every((player) => !player.isBot)).toBe(true);
  expect(clients[9].state.lobby.phase).toBe('match');
  clients.push(await server.sdk.joinOrCreate('match', options('P10')));
  expect(clients[1].roomId).toBe(clients[0].roomId);
  expect(clients[9].roomId).toBe(clients[0].roomId);
  expect(clients[10].roomId).not.toBe(clients[0].roomId);
  for (const client of clients) await client.leave();
});

it('two ready players cannot start a public match', async () => {
  const a = await server.sdk.joinOrCreate('match', options('A'));
  const b = await server.sdk.joinOrCreate('match', options('B'));
  const errors: string[] = [];
  a.onMessage('err', (message: { code: string }) => errors.push(message.code));
  b.onMessage('err', (message: { code: string }) => errors.push(message.code));
  await new Promise((resolve) => setTimeout(resolve, 100));
  a.send('ready', { on: true }); b.send('ready', { on: true });
  await new Promise((resolve) => setTimeout(resolve, 100));
  const room = server.getRoomById(a.roomId) as MatchRoom;
  expect(room.state.lobby.countdown).toBe(0);
  expect(room.world).toBeNull();
  expect(errors).toEqual(['bad_request', 'bad_request']);
  await b.leave();
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(a.state.lobby.countdown).toBe(0);
  await a.leave();
});

it('public room rejects private controls', async () => {
  const a = await server.sdk.joinOrCreate('match', options('A'));
  await a.waitForInitialState();
  const errors: string[] = [];
  a.onMessage('err', (message: { code: string }) => errors.push(message.code));
  a.send('team', { team: 1 }); a.send('settings', { teamSize: 4 }); a.send('start', {});
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(errors).toHaveLength(3);
  await a.leave();
});

it('unlocks a completed public room when a player leaves', async () => {
  const clients = [];
  for (let i = 0; i < 10; i++) clients.push(await server.sdk.joinOrCreate('match', options(`U${i}`)));
  const room = server.getRoomById(clients[0].roomId) as MatchRoom;
  expect(room.world).not.toBeNull();
  expect(room.locked).toBe(true);
  await clients[9].leave();
  expect(room.world?.players).toHaveLength(9);
  expect(room.world?.players.every((player) => !player.isBot)).toBe(true);
  if (room.world) { room.world.phase = 'matchEnd'; room.world.phaseTimer = 0; }
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(room.locked).toBe(false);
  for (const client of clients.slice(0, 9)) await client.leave();
}, 7000);

it('shows the lobby briefly before automatically rematching ten connected humans', async () => {
  const clients = [];
  for (let i = 0; i < 10; i++) clients.push(await server.sdk.joinOrCreate('match', options(`R${i}`)));
  const room = server.getRoomById(clients[0].roomId) as MatchRoom;
  const oldWorld = room.world;
  expect(oldWorld).not.toBeNull();
  oldWorld!.phase = 'matchEnd';
  oldWorld!.phaseTimer = 0;
  await vi.waitFor(() => expect(room.state.lobby.phase).toBe('lobby'));
  await vi.waitFor(() => expect(room.world).not.toBe(oldWorld), { timeout: 2500 });
  await vi.waitFor(() => expect(room.state.lobby.phase).toBe('match'), { timeout: 2500 });
  expect(room.world?.players.every((player) => !player.isBot)).toBe(true);
  for (const client of clients) await client.leave();
}, 5000);
