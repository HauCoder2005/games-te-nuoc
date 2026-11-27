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
it('leaderboard reflects a registered win immediately', async () => {
  const username = `r${Date.now().toString(36).slice(-8)}`;
  await server.http.post('/api/register', { body: { username, gameName: 'Người thật', password: 'pass123' } });
  await server.http.post('/api/rank/win', { body: { username, password: 'pass123' } });
  const response = await server.http.get('/api/leaderboard');
  expect(response.data.leaderboard).toContainEqual(expect.objectContaining({ username, name: 'Người thật', stars: 1 }));
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
