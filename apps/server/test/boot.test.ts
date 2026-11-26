import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { boot, type ColyseusTestServer } from '@colyseus/testing';
import appConfig from '../src/app.config.js';

let server: ColyseusTestServer<typeof appConfig>;
beforeAll(async () => { server = await boot(appConfig); });
afterAll(async () => { await server.shutdown(); });
beforeEach(async () => { await server.cleanup(); });

it('/health returns ok and room counts', async () => {
  const response = await server.http.get('/health');
  expect(response.data).toMatchObject({ ok: true, rooms: 0, clients: 0 });
});
it('rejects wrong protocol version', async () => {
  await expect(server.sdk.joinOrCreate('match', { mode: 'public', name: 'A', v: 2 })).rejects.toThrow();
});
it('rejects blank name', async () => {
  await expect(server.sdk.joinOrCreate('match', { mode: 'public', name: '  ', v: 3 })).rejects.toThrow();
});
it('rejects unknown mode', async () => {
  await expect(server.sdk.create('match', { mode: 'x', name: 'A', v: 3 })).rejects.toThrow();
});
it('valid player joins a public match room', async () => {
  const room = await server.sdk.joinOrCreate('match', { mode: 'public', name: 'A', v: 3 });
  await room.waitForInitialState();
  expect(room.roomId).toBeTruthy();
  expect(room.state.lobby.mode).toBe('public');
  await room.leave();
});
