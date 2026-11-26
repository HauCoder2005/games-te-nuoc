import { expect, it } from 'vitest';
import { DT, MATCH_TIME } from '../src/config';
import { botInput, createBotMemory } from '../src/sim/bot';
import { createMatch, step } from '../src/sim/world';
import { mkPlayer, mkWorld } from './helpers';

it('targets nearest enemy who is not protected', () => {
  const bot = mkPlayer({ slot: 0, x: 200, y: 199, isBot: true });
  const protectedEnemy = mkPlayer({ slot: 1, team: 1, x: 290, y: 199, status: 'protected' });
  const liveEnemy = mkPlayer({ slot: 2, team: 1, x: 200, y: 310 });
  const world = mkWorld([bot, protectedEnemy, liveEnemy]);
  const out = botInput(world, 0, createBotMemory(1));
  expect(out.ay).toBeGreaterThan(300);
  expect(Math.abs(out.ax - 200)).toBeLessThan(20);
});
it('bot near edge moves inward', () => {
  const bot = mkPlayer({ x: 70, y: 199, isBot: true });
  const enemy = mkPlayer({ slot: 1, team: 1, x: 150, y: 199 });
  const world = mkWorld([bot, enemy]);
  expect(botInput(world, 0, createBotMemory(2)).mx).toBeGreaterThan(0);
});
it('reaction delay is seeded and holds movement between decisions', () => {
  const bot = mkPlayer({ x: 150, isBot: true });
  const enemy = mkPlayer({ slot: 1, team: 1, x: 400 });
  const world = mkWorld([bot, enemy]);
  const a = createBotMemory(3);
  const b = createBotMemory(3);
  const first = botInput(world, 0, a);
  botInput(world, 0, b);
  expect(a.reactAt).toBe(b.reactAt);
  expect(a.reactAt).toBeGreaterThanOrEqual(0.15);
  expect(a.reactAt).toBeLessThanOrEqual(0.3);
  enemy.x = 100;
  world.time = 0.05;
  expect(botInput(world, 0, a).mx).toBe(first.mx);
});
it('5v5 bot match terminates within match time plus 60 seconds', () => {
  const roster = Array.from({ length: 10 }, (_, slot) => ({
    slot, team: (slot < 5 ? 0 : 1) as 0 | 1, variant: slot % 5, isBot: true, joinOrder: slot,
  }));
  const world = createMatch(1, roster, { teamSize: 5, scoreToWin: 10 });
  const memories = new Map(roster.map((entry) => [entry.slot, createBotMemory(entry.slot + 1)]));
  for (let i = 0; i < (MATCH_TIME + 60) / DT && world.phase !== 'matchEnd'; i++) {
    const inputs = new Map(roster.map((entry) => [entry.slot, botInput(world, entry.slot, memories.get(entry.slot)!)]));
    step(world, inputs, DT);
  }
  expect(world.phase).toBe('matchEnd');
});
