import type { World } from '@te-nuoc/shared';
import { GameBalloon, GamePlayer, type GameState } from './schema.js';

export function syncState(world: World, target: GameState, names: ReadonlyMap<number, string>): void {
  const playerKeys = new Set<string>();
  for (const player of world.players) {
    const key = String(player.slot);
    playerKeys.add(key);
    let schemaPlayer = target.players.get(key);
    if (!schemaPlayer) {
      schemaPlayer = new GamePlayer();
      target.players.set(key, schemaPlayer);
    }
    schemaPlayer.slot = player.slot;
    schemaPlayer.team = player.team;
    schemaPlayer.variant = player.variant;
    schemaPlayer.isBot = player.isBot;
    schemaPlayer.name = names.get(player.slot) ?? `#${player.slot}`;
    schemaPlayer.x = player.x;
    schemaPlayer.y = player.y;
    schemaPlayer.wet = player.wet;
    schemaPlayer.status = player.status;
    schemaPlayer.timer = player.timer;
    schemaPlayer.ammo = player.ammo;
    schemaPlayer.facing = player.facing;
    schemaPlayer.aimX = player.aimX;
    schemaPlayer.aimY = player.aimY;
    schemaPlayer.ackSeq = player.ackSeq;
    schemaPlayer.ko = player.stats.ko;
    schemaPlayer.direct = player.stats.direct;
    schemaPlayer.falls = player.stats.falls;
  }
  for (const key of target.players.keys()) if (!playerKeys.has(key)) target.players.delete(key);

  const balloonKeys = new Set<string>();
  for (const balloon of world.balloons) {
    const key = String(balloon.id);
    balloonKeys.add(key);
    let schemaBalloon = target.balloons.get(key);
    if (!schemaBalloon) {
      schemaBalloon = new GameBalloon();
      target.balloons.set(key, schemaBalloon);
    }
    schemaBalloon.id = balloon.id;
    schemaBalloon.owner = balloon.owner;
    schemaBalloon.team = balloon.team;
    schemaBalloon.x = balloon.x;
    schemaBalloon.y = balloon.y;
  }
  for (const key of target.balloons.keys()) if (!balloonKeys.has(key)) target.balloons.delete(key);

  target.raftW = world.raft.w;
  target.raftH = world.raft.h;
  target.warn = world.raft.warn;
  target.red = world.score[0];
  target.blue = world.score[1];
  target.phase = world.phase;
  target.timeLeft = world.timeLeft;
  target.pillarOwner = world.pillar.owner ?? -1;
  target.pillarTeam = world.pillar.capturingTeam ?? -1;
  target.pillarProgress = world.pillar.progress;
  target.pillarContested = world.pillar.contested;
  target.pillarHold = world.pillar.holdTimer;
  target.pillarRound = world.pillar.round;
  target.pillarMaxRounds = world.pillar.maxRounds;
}
