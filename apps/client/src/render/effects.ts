import type { GameEvent } from '@te-nuoc/shared';
import type { SpriteBank } from './sprites';

interface Effect { kind: 'burst' | 'fall'; x: number; y: number; started: number }

export class Effects {
  private readonly effects: Effect[] = [];

  push(events: GameEvent[], now: number): void {
    for (const event of events) {
      if (event.k === 'burst') this.effects.push({ kind: 'burst', x: event.x, y: event.y, started: now });
    }
  }

  draw(context: CanvasRenderingContext2D, bank: SpriteBank | null, now: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      const elapsed = now - effect.started;
      if (elapsed > 0.6) { this.effects.splice(i, 1); continue; }
      const frame = bank?.frame(effect.kind === 'burst' ? 'fx_burst' : 'fx_fall', 'play', elapsed);
      if (frame) context.drawImage(frame.img, frame.sx, frame.sy, frame.sw, frame.sh, effect.x - frame.ax, effect.y - frame.ay, frame.sw, frame.sh);
    }
  }
}
