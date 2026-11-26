import { describe, expect, it } from 'vitest';
import { CHAIN_COOLDOWN } from '../src/config';
import { resolveOverlaps } from '../src/sim/movement';
import { createMatch } from '../src/sim/world';

describe('chain collisions', () => {
  it('fast knocked player transfers 40% kb to overlapped teammate', () => {
    const world = createMatch(1, [
      { slot: 0, team: 0, variant: 0, isBot: false, joinOrder: 0 },
      { slot: 1, team: 0, variant: 1, isBot: false, joinOrder: 1 },
    ], { teamSize: 5, scoreToWin: 10 });
    const [player, mate] = world.players;
    player.x = 300; player.y = 200; player.kbx = 200; player.kby = 0; player.wet = 40;
    mate.x = 304; mate.y = 200; mate.kbx = 0; mate.kby = 0; mate.wet = 0;
    resolveOverlaps(world.players, 1, [], world.chainCd);
    expect(mate.kbx).toBeCloseTo(0.4 * 200);
    expect(mate.wet).toBe(0);
  });

  it('no transfer to enemies', () => {
    const world = createMatch(1, [
      { slot: 0, team: 0, variant: 0, isBot: false, joinOrder: 0 },
      { slot: 1, team: 1, variant: 0, isBot: false, joinOrder: 1 },
    ], { teamSize: 5, scoreToWin: 10 });
    const [player, enemy] = world.players;
    player.x = 300; player.y = 200; player.kbx = 200; player.kby = 0;
    enemy.x = 304; enemy.y = 200; enemy.kbx = 0; enemy.kby = 0;
    resolveOverlaps(world.players, 1, [], world.chainCd);
    expect(enemy.kbx).toBe(0);
  });

  it('pair cooldown 0.3s', () => {
    const world = createMatch(1, [
      { slot: 0, team: 0, variant: 0, isBot: false, joinOrder: 0 },
      { slot: 1, team: 0, variant: 1, isBot: false, joinOrder: 1 },
    ], { teamSize: 5, scoreToWin: 10 });
    const [player, mate] = world.players;
    player.x = 300; player.y = 200; player.kbx = 200; player.kby = 0;
    mate.x = 304; mate.y = 200; mate.kbx = 0; mate.kby = 0;
    resolveOverlaps(world.players, 1, [], world.chainCd);
    expect(mate.kbx).toBeCloseTo(80);

    player.x = 300; player.y = 200; player.kbx = 200;
    mate.x = 304; mate.y = 200; mate.kbx = 0;
    resolveOverlaps(world.players, 1 + CHAIN_COOLDOWN - 0.05, [], world.chainCd);
    expect(mate.kbx).toBe(0);

    player.x = 300; player.y = 200; player.kbx = 200;
    mate.x = 304; mate.y = 200; mate.kbx = 0;
    resolveOverlaps(world.players, 1 + CHAIN_COOLDOWN + 0.01, [], world.chainCd);
    expect(mate.kbx).toBeCloseTo(80);
  });
});
