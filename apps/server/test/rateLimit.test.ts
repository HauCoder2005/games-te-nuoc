import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { boot, type ColyseusTestServer } from '@colyseus/testing';
import appConfig from '../src/app.config.js';
import { RateLimiter } from '../src/rooms/rateLimit.js';
import { roomCreationLimit } from '../src/rooms/MatchRoom.js';

let server: ColyseusTestServer<typeof appConfig>;
beforeAll(async () => { server = await boot(appConfig, 2575); });
afterAll(async () => { await server.shutdown(); });
beforeEach(async () => { await server.cleanup(); roomCreationLimit.clear(); });

it('allows five private creations per IP per minute', () => {
  const limiter = new RateLimiter(5);
  for (let index = 0; index < 5; index++) expect(limiter.hit('1.1.1.1', 0)).toBe(true);
  expect(limiter.hit('1.1.1.1', 1000)).toBe(false);
  expect(limiter.hit('2.2.2.2', 1000)).toBe(true);
  expect(limiter.hit('1.1.1.1', 61_000)).toBe(true);
});

it('rejects the sixth private room from one IP', async () => {
  const clients = [];
  for (let index = 0; index < 5; index++) clients.push(await server.sdk.create('match', { mode: 'private', name: `P${index}`, v: 3 }));
  await expect(server.sdk.create('match', { mode: 'private', name: 'Extra', v: 3 })).rejects.toThrow('Thao tác quá nhanh');
  for (const client of clients) await client.leave();
});
