import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { boot, type ColyseusTestServer } from '@colyseus/testing';
import appConfig from '../src/app.config.js';
import { roomCreationLimit, type MatchRoom } from '../src/rooms/MatchRoom.js';

let server: ColyseusTestServer<typeof appConfig>;
beforeAll(async () => { server = await boot(appConfig, 2574); });
afterAll(async () => { await server.shutdown(); });
beforeEach(async () => { await server.cleanup(); roomCreationLimit.clear(); });
const options = (name: string) => ({ mode: 'private', name, v: 3 });

it('reconnect within grace period keeps slot and team', async () => {
  const host = await server.sdk.create('match', options('A'));
  host.onMessage('ev', () => {});
  const guest = await server.sdk.joinById(host.roomId, options('B'));
  host.send('start', {});
  const room = server.getRoomById<MatchRoom>(host.roomId);
  await vi.waitFor(() => expect(room.world).not.toBeNull());
  const member = room.state.lobby.players.get(guest.sessionId)!;
  const slot = member.slot;
  const team = member.team;
  const token = guest.reconnectionToken;
  guest.reconnection.enabled = false;
  await guest.leave(false);
  await vi.waitFor(() => expect(room.state.lobby.players.get(guest.sessionId)?.connected).toBe(false));
  const rejoined = await server.sdk.reconnect(token);
  await vi.waitFor(() => expect(room.state.lobby.players.get(rejoined.sessionId)?.connected).toBe(true));
  expect(room.state.lobby.players.get(rejoined.sessionId)?.slot).toBe(slot);
  expect(room.state.lobby.players.get(rejoined.sessionId)?.team).toBe(team);
  await rejoined.leave(); await host.leave();
});

it('bot takes a dropped player slot after 20 seconds', async () => {
  const host = await server.sdk.create('match', options('A'));
  host.onMessage('ev', () => {});
  const guest = await server.sdk.joinById(host.roomId, options('B'));
  host.send('start', {});
  const room = server.getRoomById<MatchRoom>(host.roomId);
  await vi.waitFor(() => expect(room.world).not.toBeNull());
  const slot = room.state.lobby.players.get(guest.sessionId)!.slot;
  guest.reconnection.enabled = false;
  await guest.leave(false);
  await vi.waitFor(() => expect(room.state.lobby.players.get(guest.sessionId)?.connected).toBe(false));
  await vi.waitFor(() => expect(room.world?.players.find((player) => player.slot === slot)?.isBot).toBe(true), { timeout: 22_000 });
  await host.leave();
}, 25_000);
