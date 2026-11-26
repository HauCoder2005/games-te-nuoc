import {
  balloonHeight, activeCovers, CHARACTER_VARIANTS, homeZone, POOL_RECT, raftRect, RAFT_CENTER, TEAM_COLORS,
  TILE, VIEW_H, VIEW_W,
} from '@te-nuoc/shared';
import type { GameEvent, PlayerState, World } from '@te-nuoc/shared';
import { Effects } from './effects';
import { drawNameTags, wetTint } from './overlay';
import type { SpriteBank, SpriteFrame } from './sprites';

export type RenderView = Readonly<World> & { names?: ReadonlyMap<number, string> };

export interface Renderer {
  draw(view: RenderView, viewerSlot: number): void;
  pushEvents(events: GameEvent[], now: number): void;
}

export function integerScale(winW: number, winH: number): number {
  return Math.max(1, Math.floor(Math.min(winW / VIEW_W, winH / VIEW_H)));
}

function drawFrame(ctx: CanvasRenderingContext2D, frame: SpriteFrame | null, x: number, y: number): boolean {
  if (!frame) return false;
  ctx.drawImage(frame.img, frame.sx, frame.sy, frame.sw, frame.sh,
    Math.round(x - frame.ax), Math.round(y - frame.ay), frame.sw, frame.sh);
  return true;
}

function drawRaft(ctx: CanvasRenderingContext2D, view: RenderView, bank: SpriteBank | null): void {
  const rect = raftRect(view.raft);
  ctx.strokeStyle = '#E9FCFF';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.strokeRect(rect.x0 - 2, rect.y0 - 2, view.raft.w * TILE + 4, view.raft.h * TILE + 4);
  ctx.setLineDash([]);
  for (let row = 0; row < view.raft.h; row++) {
    for (let col = 0; col < view.raft.w; col++) {
      const x = rect.x0 + col * TILE;
      const y = rect.y0 + row * TILE;
      if (!drawFrame(ctx, bank?.tileFrame('raft_plank', (col * 7 + row * 3) % 4) ?? null, x, y)) {
        ctx.fillStyle = '#B07A47'; ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = '#7A4E2A'; ctx.strokeRect(x, y, TILE, TILE);
      }
      if (view.raft.warn && (row === 0 || row === view.raft.h - 1 || col === 0 || col === view.raft.w - 1)) {
        drawFrame(ctx, bank?.image('raft_crack') ?? null, x, y);
        if (Math.floor(view.time * 8) % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 75, 58, 0.32)'; ctx.fillRect(x, y, TILE, TILE);
        }
      }
    }
  }
  for (let col = 0; col < view.raft.w; col++) drawFrame(ctx, bank?.image('raft_edge') ?? null, rect.x0 + col * TILE, rect.y1);
  for (const team of [0, 1] as const) {
    const zone = homeZone(team, view.raft);
    ctx.fillStyle = team === 0 ? 'rgba(229, 59, 59, 0.16)' : 'rgba(59, 139, 240, 0.16)';
    ctx.fillRect(zone.x0, zone.y0, zone.x1 - zone.x0, zone.y1 - zone.y0);
  }
  ctx.fillStyle = '#FFFFFF';
  for (let y = rect.y0; y < rect.y1; y += 12) ctx.fillRect(RAFT_CENTER.x, y, 1, 6);
  drawFrame(ctx, bank?.image('flag_red') ?? null, rect.x0 + TILE, RAFT_CENTER.y);
  drawFrame(ctx, bank?.image('flag_blue') ?? null, rect.x1 - TILE, RAFT_CENTER.y);
}

function drawCharacterTraits(ctx: CanvasRenderingContext2D, player: PlayerState): void {
  const variant = CHARACTER_VARIANTS[player.variant] ?? CHARACTER_VARIANTS[0];
  const px = Math.round(player.x) - 8;
  const py = Math.round(player.y) - 23;
  // Side hair bangs visible under swim cap
  ctx.fillStyle = variant.hair;
  ctx.fillRect(px + 2, py + 5, 2, 3);
  ctx.fillRect(px + 12, py + 5, 2, 3);
  if (variant.hairStyle === 'spiky') {
    ctx.fillRect(px + 4, py + 5, 2, 2);
    ctx.fillRect(px + 7, py + 5, 2, 1);
    ctx.fillRect(px + 10, py + 5, 2, 2);
  } else if (variant.hairStyle === 'curly') {
    ctx.fillRect(px + 1, py + 5, 2, 4);
    ctx.fillRect(px + 13, py + 5, 2, 4);
    ctx.fillRect(px + 3, py + 5, 10, 1);
  } else if (variant.hairStyle === 'pigtails') {
    // Twin pigtails on both sides + ribbon ties
    ctx.fillStyle = '#2B1E2F';
    ctx.fillRect(px, py + 5, 3, 7);
    ctx.fillRect(px + 13, py + 5, 3, 7);
    ctx.fillStyle = variant.hair;
    ctx.fillRect(px + 1, py + 6, 2, 5);
    ctx.fillRect(px + 13, py + 6, 2, 5);
    ctx.fillStyle = variant.goggle;
    ctx.fillRect(px + 2, py + 5, 1, 1);
    ctx.fillRect(px + 13, py + 5, 1, 1);
  } else if (variant.hairStyle === 'long') {
    // Long side locks down to shoulders
    ctx.fillStyle = '#2B1E2F';
    ctx.fillRect(px + 1, py + 5, 2, 8);
    ctx.fillRect(px + 13, py + 5, 2, 8);
    ctx.fillStyle = variant.hair;
    ctx.fillRect(px + 2, py + 5, 2, 7);
    ctx.fillRect(px + 12, py + 5, 2, 7);
  } else if (variant.hairStyle === 'ponytail') {
    // Side ponytail puff + golden fringe
    ctx.fillStyle = '#2B1E2F';
    ctx.fillRect(px + 13, py + 3, 3, 6);
    ctx.fillStyle = variant.hair;
    ctx.fillRect(px + 13, py + 4, 2, 4);
    ctx.fillRect(px + 4, py + 5, 3, 1);
    ctx.fillRect(px + 9, py + 5, 3, 1);
  }
  if (variant.gender === 'female') {
    ctx.fillStyle = variant.blush;
    ctx.fillRect(px + 3, py + 9, 2, 1);
    ctx.fillRect(px + 11, py + 9, 2, 1);
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, bank: SpriteBank | null, time: number): void {
  if (player.status === 'respawning') return;
  const team = player.team === 0 ? 'red' : 'blue';
  const animation = player.status === 'dashing' ? 'dash' : player.status === 'hitstun' ? 'hit'
    : Math.hypot(player.mvx, player.mvy) > 10 ? 'walk' : 'idle';
  const frame = bank?.frame(`player_${team}_v${player.variant}`, animation, time) ?? null;
  ctx.save();
  if (player.status === 'protected') ctx.globalAlpha = 0.6;
  if (player.status === 'falling') ctx.globalAlpha *= Math.max(0, player.timer / 0.6);
  if (player.facing === -1 && frame) {
    ctx.translate(Math.round(player.x) * 2, 0); ctx.scale(-1, 1);
  }
  if (!drawFrame(ctx, frame, player.x, player.y)) {
    ctx.fillStyle = TEAM_COLORS[player.team];
    ctx.beginPath(); ctx.arc(player.x, player.y - 8, 8, 0, Math.PI * 2); ctx.fill();
  } else {
    drawCharacterTraits(ctx, player);
  }
  if (player.wet > 0) {
    ctx.fillStyle = `rgba(31, 163, 209, ${wetTint(player.wet)})`;
    ctx.fillRect(player.x - 8, player.y - 23, 16, 23);
  }
  ctx.restore();
  if (player.status === 'protected') drawFrame(ctx, bank?.frame('fx_bubble', 'loop', time) ?? null, player.x, player.y);
}

export function createRenderer(canvas: HTMLCanvasElement, overlay: HTMLCanvasElement, bank: SpriteBank | null): Renderer {
  const context = canvas.getContext('2d');
  const overlayContext = overlay.getContext('2d');
  if (!context || !overlayContext) throw new Error('Canvas không khả dụng');
  canvas.width = VIEW_W; canvas.height = VIEW_H;
  context.imageSmoothingEnabled = false;
  const effects = new Effects();
  let scale = 0;
  let pixelRatio = 0;

  function resize(): void {
    const nextScale = integerScale(window.innerWidth, window.innerHeight);
    const nextRatio = window.devicePixelRatio || 1;
    if (nextScale === scale && nextRatio === pixelRatio) return;
    scale = nextScale; pixelRatio = nextRatio;
    const width = VIEW_W * scale;
    const height = VIEW_H * scale;
    canvas.parentElement?.style.setProperty('width', `${width}px`);
    canvas.parentElement?.style.setProperty('height', `${height}px`);
    for (const item of [canvas, overlay]) {
      item.style.width = `${width}px`; item.style.height = `${height}px`;
    }
    overlay.width = Math.round(width * pixelRatio);
    overlay.height = Math.round(height * pixelRatio);
  }

  return {
    draw(view, viewerSlot) {
      resize();
      context.clearRect(0, 0, VIEW_W, VIEW_H);
      if (!drawFrame(context, bank?.image('bg') ?? null, 0, 0)) {
        context.fillStyle = '#1FA3D1'; context.fillRect(0, 0, VIEW_W, VIEW_H);
      }
      context.save();
      context.beginPath();
      context.rect(
        POOL_RECT.x0,
        POOL_RECT.y0,
        POOL_RECT.x1 - POOL_RECT.x0,
        POOL_RECT.y1 - POOL_RECT.y0,
      );
      context.clip();
      for (let y = POOL_RECT.y0; y < POOL_RECT.y1; y += 32) {
        for (let x = POOL_RECT.x0; x < POOL_RECT.x1; x += 32) {
          drawFrame(context, bank?.frame('water_ripple', 'loop', view.time) ?? null, x, y);
        }
      }
      context.restore();
      drawRaft(context, view, bank);
      for (const player of view.players) {
        if (player.status === 'respawning') continue;
        context.fillStyle = 'rgba(43, 30, 47, 0.3)';
        context.beginPath(); context.ellipse(player.x, player.y + 1, 7, 3, 0, 0, Math.PI * 2); context.fill();
        context.fillStyle = TEAM_COLORS[player.team];
        context.beginPath(); context.ellipse(player.x, player.y, 6, 2.5, 0, 0, Math.PI * 2); context.fill();
      }
      const entities: { y: number; draw: () => void }[] = [];
      for (const cover of activeCovers(view.raft)) entities.push({ y: cover.y + 8, draw: () => {
        if (!drawFrame(context, bank?.image('cover') ?? null, cover.x, cover.y + 8)) {
          context.fillStyle = '#E9FCFF'; context.fillRect(cover.x - 8, cover.y - 8, 16, 16);
        }
      } });
      for (const player of view.players) entities.push({ y: player.y, draw: () => drawPlayer(context, player, bank, view.time) });
      for (const balloon of view.balloons) entities.push({ y: balloon.y, draw: () => {
        const height = balloonHeight(balloon);
        context.fillStyle = 'rgba(43, 30, 47, 0.3)'; context.fillRect(balloon.x - 3, balloon.y, 6, 2);
        drawFrame(context, bank?.image('balloon') ?? null, balloon.x, balloon.y - height);
        context.fillStyle = TEAM_COLORS[balloon.team];
        context.beginPath(); context.arc(balloon.x, balloon.y - height - 3, 2, 0, Math.PI * 2); context.fill();
      } });
      entities.sort((a, b) => a.y - b.y);
      for (const entity of entities) entity.draw();
      const own = view.players.find((player) => player.slot === viewerSlot);
      if (own && own.status !== 'respawning') {
        for (let i = 0; i < own.ammo; i++) {
          const x = own.x + (i - 1) * 6;
          const y = own.y - 42;
          if (!drawFrame(context, bank?.image('balloon_small') ?? null, x, y)) {
            context.fillStyle = TEAM_COLORS[own.team];
            context.beginPath(); context.arc(x, y, 2, 0, Math.PI * 2); context.fill();
          }
        }
      }
      effects.draw(context, bank, view.time);
      overlayContext.clearRect(0, 0, overlay.width, overlay.height);
      drawNameTags(overlayContext, view.players, viewerSlot, view.names, scale, pixelRatio);
    },
    pushEvents(events, now) { effects.push(events, now); },
  };
}
