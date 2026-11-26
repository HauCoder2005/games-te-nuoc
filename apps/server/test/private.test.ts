import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { boot, type ColyseusTestServer } from '@colyseus/testing';
import { LocalPresence } from 'colyseus';
import appConfig from '../src/app.config.js';
import { generateRoomCode, releaseRoomCode } from '../src/rooms/roomCode.js';

let server: ColyseusTestServer<typeof appConfig>;
beforeAll(async () => { server = await boot(appConfig, 2569); });
afterAll(async () => { await server.shutdown(); });
beforeEach(async () => { await server.cleanup(); });

const options = (name: string, mode: 'private' | 'public' = 'private') => ({ mode, name, v: 3 });

it('private room id is a four-letter code and can be joined by id', async () => {
  const first = await server.sdk.create('match', options('A'));
  await first.waitForInitialState();
  expect(first.roomId).toMatch(/^[A-HJ-NP-Z]{4}$/);
  expect(first.state.lobby.code).toBe(first.roomId);
  const second = await server.sdk.joinById(first.roomId, options('B'));
  expect(second.roomId).toBe(first.roomId);
  await first.leave(); await second.leave();
});
it('public matchmaking never lands in a private room', async () => {
  const privateRoom = await server.sdk.create('match', options('A'));
  const publicRoom = await server.sdk.joinOrCreate('match', options('C', 'public'));
  expect(publicRoom.roomId).not.toBe(privateRoom.roomId);
  await privateRoom.leave(); await publicRoom.leave();
});
it('unknown code is rejected', async () => {
  await expect(server.sdk.joinById('ZZZZ', options('D'))).rejects.toThrow();
});
it('room disposal releases its reserved code', async () => {
  const client = await server.sdk.create('match', options('A'));
  const room = server.getRoomById(client.roomId);
  expect(await room.presence.sismember('$roomcodes', client.roomId)).toBe(1);
  await room.disconnect();
  expect(await room.presence.sismember('$roomcodes', client.roomId)).toBe(0);
});
it('generator retries collisions and release removes reserved code', async () => {
  const presence = new LocalPresence();
  const first = await generateRoomCode(presence, () => 0);
  expect(first).toBe('AAAA');
  let calls = 0;
  const second = await generateRoomCode(presence, () => { calls++; return calls <= 4 ? 0 : 0.1; });
  expect(second).not.toBe(first);
  expect(await presence.sismember('$roomcodes', second)).toBe(1);
  await releaseRoomCode(presence, first);
  expect(await presence.sismember('$roomcodes', first)).toBe(0);
});
