import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { boot, type ColyseusTestServer } from '@colyseus/testing';
import appConfig from '../src/app.config.js';
import { MatchRoom } from '../src/rooms/MatchRoom.js';

let server: ColyseusTestServer<typeof appConfig>;
beforeAll(async () => { server = await boot(appConfig, 2573); });
afterAll(async () => { await server.shutdown(); });
beforeEach(async () => { await server.cleanup(); });
const options = (name: string) => ({ mode: 'public', name, v: 3 });

it('quick matchers share a public room and an eleventh gets another room', async () => {
  const clients = [];
  for (let i = 0; i < 11; i++) clients.push(await server.sdk.joinOrCreate('match', options(`P${i}`)));
  expect(clients[1].roomId).toBe(clients[0].roomId);
  expect(clients[9].roomId).toBe(clients[0].roomId);
  expect(clients[10].roomId).not.toBe(clients[0].roomId);
  for (const client of clients) await client.leave();
});

it('ready countdown starts and leaving ready player cancels it', async () => {
  const a = await server.sdk.joinOrCreate('match', options('A'));
  const b = await server.sdk.joinOrCreate('match', options('B'));
  await new Promise((resolve) => setTimeout(resolve, 100));
  a.send('ready', { on: true }); b.send('ready', { on: true });
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(a.state.lobby.countdown).toBeGreaterThan(0);
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

it('locks on match start, routes newcomer elsewhere, then unlocks after match', async () => {
  const a = await server.sdk.joinOrCreate('match', options('A'));
  const b = await server.sdk.joinOrCreate('match', options('B'));
  a.send('ready', { on: true }); b.send('ready', { on: true });
  const room = server.getRoomById(a.roomId) as MatchRoom;
  const limit = Date.now() + 4500;
  while (!room.world && Date.now() < limit) await new Promise((resolve) => setTimeout(resolve, 50));
  expect(room.world).not.toBeNull();
  expect(room.locked).toBe(true);
  const newcomer = await server.sdk.joinOrCreate('match', options('C'));
  expect(newcomer.roomId).not.toBe(a.roomId);
  if (room.world) { room.world.phase = 'matchEnd'; room.world.phaseTimer = 0; }
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(room.locked).toBe(false);
  await a.leave(); await b.leave(); await newcomer.leave();
}, 7000);
