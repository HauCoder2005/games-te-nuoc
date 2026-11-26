import { DT, MATCH_TIME } from '../src/config';
import { botInput, createBotMemory } from '../src/sim/bot';
import { createMatch, step } from '../src/sim/world';
import type { RosterEntry } from '../src/sim/types';

const durations: number[] = [];
let closeGames = 0;
for (let seed = 1; seed <= 20; seed++) {
  const roster: RosterEntry[] = Array.from({ length: 10 }, (_, slot) => ({
    slot, team: slot < 5 ? 0 : 1, variant: slot % 5, isBot: true, joinOrder: slot,
  }));
  const world = createMatch(seed, roster, { teamSize: 5, scoreToWin: 10 });
  const memories = new Map(roster.map((entry) => [entry.slot, createBotMemory(seed * 100 + entry.slot)]));
  for (let tick = 0; tick < (MATCH_TIME + 60) / DT && world.phase !== 'matchEnd'; tick++) {
    const inputs = new Map(roster.map((entry) => [entry.slot, botInput(world, entry.slot, memories.get(entry.slot)!)]));
    step(world, inputs, DT);
  }
  durations.push(world.time);
  if (Math.abs(world.score[0] - world.score[1]) <= 3) closeGames++;
  console.log(`Trận ${seed}: ${world.time.toFixed(1)}s, Đỏ ${world.score[0]}–${world.score[1]} Xanh`);
}
const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
console.log(`Trung bình: ${average.toFixed(1)}s; sát nút: ${closeGames}/20 (${(closeGames / 20 * 100).toFixed(0)}%)`);
