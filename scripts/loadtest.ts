import { Client } from '@colyseus/sdk';
import {
  DT, LOADTEST_CLIENTS, LOADTEST_DURATION_MS, MSG, mulberry32, PROTOCOL_VERSION,
  VIEW_H, VIEW_W,
} from '../packages/shared/src/index';
import type { NetState } from '../apps/client/src/net/colyseus';

function argValue(flag: string, fallback: string): string {
  const index = process.argv.indexOf(flag);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback;
}

const url = argValue('--url', 'ws://localhost:2567');
const clientCount = Number(argValue('--clients', String(LOADTEST_CLIENTS)));
const durationMs = Number(argValue('--duration', String(LOADTEST_DURATION_MS)));

async function main(): Promise<void> {
  const rooms = await Promise.all(
    Array.from({ length: clientCount }, async (_, index) => {
      const client = new Client(url);
      const room = await client.joinOrCreate<NetState>('match', {
        mode: 'public',
        name: `Bot${index + 1}`,
        v: PROTOCOL_VERSION,
      });
      room.onMessage(MSG.events, () => {});
      room.onMessage(MSG.error, () => {});
      room.send(MSG.ready, { on: true });
      return { room, rng: mulberry32(index + 1), seq: 0, th: 0, da: 0, readied: true };
    }),
  );

  const uniqueRooms = new Set(rooms.map((entry) => entry.room.roomId));
  const httpUrl = url.replace(/^ws(s?):\/\//, 'http$1://').replace(/\/$/, '') + '/health';
  const healthRes = await fetch(httpUrl);
  const health = (await healthRes.json()) as { ok: boolean; rooms: number; clients: number };
  console.log(JSON.stringify({ connected: rooms.length, uniqueRooms: uniqueRooms.size, health }));

  const interval = setInterval(() => {
    for (const entry of rooms) {
      if (entry.room.state?.lobby?.phase === 'lobby' && !entry.readied) {
        entry.readied = true;
        entry.room.send(MSG.ready, { on: true });
      } else if (entry.room.state?.lobby?.phase === 'match') {
        entry.readied = false;
      }
      entry.seq++;
      const angle = entry.rng() * Math.PI * 2;
      if (entry.rng() < 0.08) entry.th++;
      if (entry.rng() < 0.02) entry.da++;
      entry.room.send(MSG.input, {
        s: entry.seq,
        mx: (entry.rng() - 0.5) * 0.4,
        my: (entry.rng() - 0.5) * 0.4,
        ax: Math.cos(angle) * VIEW_W,
        ay: Math.sin(angle) * VIEW_H,
        th: entry.th,
        da: entry.da,
      });
    }
  }, Math.round(DT * 1000));

  await new Promise((resolve) => setTimeout(resolve, durationMs));
  clearInterval(interval);
  await Promise.all(rooms.map((entry) => entry.room.leave()));
}

await main();
