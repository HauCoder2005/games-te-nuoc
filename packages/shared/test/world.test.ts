import { expect, it } from 'vitest';
import { AMMO_MAX, DT, FALL_TIME, MATCH_TIME, RESPAWN_TIME, SPAWN_PROTECT, START_COUNTDOWN } from '../src/config';
import { addPlayer, createMatch, removePlayer, setBot, step } from '../src/sim/world';
import { inp, mkPlayer, mkWorld } from './helpers';

it('creates countdown with players in team home zones', () => {
  const world = createMatch(5, [
    { slot: 0, team: 0, variant: 0, isBot: false, joinOrder: 0 },
    { slot: 1, team: 1, variant: 0, isBot: true, joinOrder: 1 },
  ], { teamSize: 4, scoreToWin: 10 });
  expect([world.phase, world.phaseTimer, world.timeLeft]).toEqual(['countdown', START_COUNTDOWN, MATCH_TIME]);
  expect(world.players[0].x).toBeGreaterThanOrEqual(80);
  expect(world.players[1].x).toBeLessThanOrEqual(560);
  step(world, new Map([[0, inp({ mx: 1, th: 1 })]]), DT);
  expect(world.players[0].x).toBeGreaterThanOrEqual(80);
  expect(world.balloons).toHaveLength(0);
});
it('falling off grants point and respawns protected with full resources', () => {
  const red = mkPlayer({ x: 63, status: 'alive', wet: 80, ammo: 0 });
  const blue = mkPlayer({ slot: 1, team: 1, x: 500 });
  const world = mkWorld([red, blue]);
  const events = step(world, new Map(), DT);
  expect(world.score).toEqual([0, 1]);
  expect(events).toContainEqual({ k: 'fall', slot: 0, by: null });
  for (let i = 0; i < Math.ceil((FALL_TIME + RESPAWN_TIME) / DT) + 2; i++) step(world, new Map(), DT);
  expect(red.status).toBe('protected');
  expect(red.timer).toBeLessThanOrEqual(SPAWN_PROTECT);
  expect([red.wet, red.ammo, red.dashCd]).toEqual([0, AMMO_MAX, 0]);
  expect(red.x).toBeGreaterThanOrEqual(80);
  expect(red.x).toBeLessThanOrEqual(128);
});
it('one throw counter jump creates one balloon and acknowledges input', () => {
  const red = mkPlayer({ aimX: 400, aimY: 199 });
  const world = mkWorld([red, mkPlayer({ slot: 1, team: 1, x: 500 })]);
  step(world, new Map([[0, inp({ seq: 7, th: 3 })]]), DT);
  expect(world.balloons).toHaveLength(1);
  expect(red.ackSeq).toBe(7);
  expect(red.lastTh).toBe(3);
  step(world, new Map([[0, inp({ seq: 8, th: 3 })]]), DT);
  expect(world.balloons).toHaveLength(1);
});
it('same seed and inputs give identical state after 3000 ticks', () => {
  const roster = [
    { slot: 0, team: 0 as const, variant: 0, isBot: false, joinOrder: 0 },
    { slot: 1, team: 1 as const, variant: 0, isBot: false, joinOrder: 1 },
  ];
  const a = createMatch(42, roster, { teamSize: 4, scoreToWin: 10 });
  const b = createMatch(42, roster, { teamSize: 4, scoreToWin: 10 });
  for (let i = 0; i < 3000; i++) {
    const inputs = new Map([[0, inp({ seq: i, mx: i % 2 ? 1 : -1, th: Math.floor(i / 30), ax: 450, ay: 199 })]]);
    step(a, inputs, DT); step(b, inputs, DT);
  }
  expect(JSON.stringify(a)).toBe(JSON.stringify(b));
});
it('team emptied mid match ends immediately', () => {
  const world = mkWorld([mkPlayer(), mkPlayer({ slot: 1, team: 1 })]);
  removePlayer(world, 0);
  step(world, new Map(), DT);
  expect(world.winner).toBe(1);
});
it('bot handoff preserves position and score', () => {
  const world = mkWorld([mkPlayer({ x: 250, isBot: false })]);
  world.score = [2, 4];
  setBot(world, 0, true);
  expect([world.players[0].x, world.players[0].isBot, world.score]).toEqual([250, true, [2, 4]]);
  addPlayer(world, { slot: 5, team: 1, variant: 0, isBot: true, joinOrder: 5 });
  expect(world.players.map((player) => player.slot)).toEqual([0, 5]);
});
