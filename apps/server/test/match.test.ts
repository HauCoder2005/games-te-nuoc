import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { boot, type ColyseusTestServer } from '@colyseus/testing';
import appConfig from '../src/app.config.js';
import { roomCreationLimit, type MatchRoom } from '../src/rooms/MatchRoom.js';
import { MsgLimiter } from '../src/rooms/msgLimiter.js';

let server: ColyseusTestServer<typeof appConfig>;
beforeAll(async () => { server = await boot(appConfig); });
afterAll(async () => { await server.shutdown(); });
beforeEach(async () => { await server.cleanup(); roomCreationLimit.clear(); });

const options = (name: string) => ({ mode: 'private' as const, name, v: 3 });

it('host start creates a 5v5 match with bots', async () => {
  const host = await server.sdk.create('match', options('A'));
  await host.waitForInitialState();
  host.send('start', {});
  await vi.waitFor(() => expect(host.state.lobby.phase).toBe('match'));
  expect(host.state.game.players.size).toBe(10);
  await host.leave();
});
it('nonhost start returns not_host error', async () => {
  const host = await server.sdk.create('match', options('A'));
  const guest = await server.sdk.joinById(host.roomId, options('B'));
  const error = new Promise<{ code: string }>((resolve) => guest.onMessage('err', resolve));
  guest.send('start', {});
  expect(await error).toMatchObject({ code: 'not_host' });
  await guest.leave(); await host.leave();
});
it('moving input changes authoritative position', async () => {
  const host = await server.sdk.create('match', options('A'));
  await host.waitForInitialState();
  host.send('start', {});
  await vi.waitFor(() => expect(host.state.game.players.size).toBe(10));
  await vi.waitFor(() => expect(host.state.game.phase).toBe('playing'), { timeout: 4000 });
  const slot = host.state.lobby.players.get(host.sessionId)?.slot;
  expect(slot).toBeDefined();
  const player = host.state.game.players.get(String(slot));
  const before = player?.x ?? 0;
  host.send('in', { s: 1, mx: 1, my: 0, ax: 500, ay: 199, th: 0, da: 0 });
  await vi.waitFor(() => expect(host.state.game.players.get(String(slot))?.x).toBeGreaterThan(before + 40), { timeout: 3000 });
  await host.leave();
});
it('garbage and a message flood do not crash the room', async () => {
  const host = await server.sdk.create('match', options('A'));
  const guest = await server.sdk.joinById(host.roomId, options('B'));
  host.send('start', {});
  guest.send('in', { s: 'x', mx: NaN });
  guest.send('in', null);
  for (let i = 0; i < 500; i++) guest.send('in', { s: i + 1, mx: 1, my: 0, ax: 320, ay: 199, th: 0, da: 0 });
  await vi.waitFor(() => expect(server.getRoomById<MatchRoom>(host.roomId).state.game.players.size).toBe(10));
  expect(server.getRoomById<MatchRoom>(host.roomId).clients.length).toBe(2);
  await guest.leave(); await host.leave();
});
it('leaving midmatch hands the same slot to a bot', async () => {
  const host = await server.sdk.create('match', options('A'));
  const guest = await server.sdk.joinById(host.roomId, options('B'));
  host.send('start', {});
  await vi.waitFor(() => expect(host.state.game.players.size).toBe(10));
  const slot = guest.state.lobby.players.get(guest.sessionId)?.slot;
  await guest.leave();
  await vi.waitFor(() => expect(host.state.game.players.get(String(slot))?.isBot).toBe(true));
  await host.leave();
});
it('guest joining midmatch replaces a bot on the smaller human team', async () => {
  const host = await server.sdk.create('match', options('A'));
  host.send('start', {});
  await vi.waitFor(() => expect(host.state.game.players.size).toBe(10));
  const guest = await server.sdk.joinById(host.roomId, options('B'));
  await guest.waitForInitialState();
  const slot = guest.state.lobby.players.get(guest.sessionId)?.slot;
  expect(guest.state.game.players.get(String(slot))?.isBot).toBe(false);
  await guest.leave(); await host.leave();
});
it('match end returns to lobby after ten seconds', async () => {
  const host = await server.sdk.create('match', options('A'));
  host.send('start', {});
  const room = server.getRoomById<MatchRoom>(host.roomId);
  await vi.waitFor(() => expect(room.world).not.toBeNull());
  room.world!.phase = 'matchEnd';
  room.world!.phaseTimer = 0.01;
  await vi.waitFor(() => expect(room.state.lobby.phase).toBe('lobby'));
  await host.leave();
});
it('uses a slow lobby clock and restores it after a match', async () => {
  const host = await server.sdk.create('match', options('A'));
  const room = server.getRoomById<MatchRoom>(host.roomId);
  const lobbyClock = vi.spyOn(room, 'setTimestep');
  host.send('start', {});
  await vi.waitFor(() => expect(room.world).not.toBeNull());
  room.world!.phase = 'matchEnd';
  room.world!.phaseTimer = 0.01;
  await vi.waitFor(() => expect(lobbyClock).toHaveBeenCalledWith(expect.any(Function), 100));
  await host.leave();
});
it('MsgLimiter permits at most 60 messages in a one second window', () => {
  const limiter = new MsgLimiter();
  for (let i = 0; i < 60; i++) expect(limiter.allow('a', 0)).toBe(true);
  expect(limiter.allow('a', 0)).toBe(false);
  expect(limiter.allow('b', 0)).toBe(true);
  expect(limiter.allow('a', 1000)).toBe(true);
});
