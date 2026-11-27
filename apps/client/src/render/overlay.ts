import {
  NAME_TAG_FONT_PX, NAME_TAG_SIDE_GAP, NAME_TAG_SIDE_Y_OFFSET, NAME_TAG_STROKE_PX,
  NAME_TAG_TOP_OFFSET, SELF_NAME_COLOR, TEAM_NAME_COLORS,
} from '@te-nuoc/shared';
import type { PlayerState, Team } from '@te-nuoc/shared';

export function visibleNameTags(players: { slot: number; team: Team }[], viewerTeam: Team | null): number[] {
  return players.filter((player) => viewerTeam === null || player.team === viewerTeam).map((player) => player.slot);
}

export function wetTint(wet: number): number {
  return Math.max(0, Math.min(0.4, wet / 150 * 0.4));
}

export function nameTagSide(centerX: number, textWidth: number, canvasWidth: number, gap: number): { x: number; align: 'left' | 'right' } {
  return centerX + gap + textWidth <= canvasWidth
    ? { x: centerX + gap, align: 'left' }
    : { x: centerX - gap, align: 'right' };
}

export function drawNameTags(
  context: CanvasRenderingContext2D,
  players: PlayerState[],
  viewerSlot: number,
  names: ReadonlyMap<number, string> | undefined,
  scaleX: number,
  pixelRatio: number,
  scaleY = scaleX,
): void {
  const viewerTeam = players.find((player) => player.slot === viewerSlot)?.team ?? null;
  const visible = new Set(visibleNameTags(players, viewerTeam));
  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'bottom';
  context.font = `800 ${NAME_TAG_FONT_PX * pixelRatio}px 'Segoe UI', system-ui, -apple-system, sans-serif`;
  context.lineWidth = NAME_TAG_STROKE_PX * pixelRatio;
  context.lineJoin = 'round';
  for (const player of players) {
    if (!visible.has(player.slot) || player.status === 'respawning') continue;
    const name = names?.get(player.slot) ?? `#${player.slot}`;
    const isSelf = player.slot === viewerSlot;
    const label = isSelf ? `${name} (bạn)` : name;
    const centerX = player.x * scaleX * pixelRatio;
    const anchor = isSelf
      ? nameTagSide(centerX, context.measureText(label).width, context.canvas.width, NAME_TAG_SIDE_GAP * scaleX * pixelRatio)
      : { x: centerX, align: 'center' as const };
    const x = anchor.x;
    const y = (player.y - (isSelf ? NAME_TAG_SIDE_Y_OFFSET : NAME_TAG_TOP_OFFSET)) * scaleY * pixelRatio;
    context.textAlign = anchor.align;
    context.textBaseline = isSelf ? 'middle' : 'bottom';
    context.strokeStyle = '#181020';
    context.fillStyle = isSelf ? SELF_NAME_COLOR : TEAM_NAME_COLORS[player.team];
    context.strokeText(label, x, y);
    context.fillText(label, x, y);
    if (isSelf) {
      const arrowY = (player.y - 43) * scaleY * pixelRatio;
      context.fillStyle = '#FFFFFF';
      context.beginPath();
      context.moveTo(centerX, arrowY);
      context.lineTo(centerX - 4.5 * pixelRatio, arrowY - 6 * pixelRatio);
      context.lineTo(centerX + 4.5 * pixelRatio, arrowY - 6 * pixelRatio);
      context.fill();
    }
  }
  context.restore();
}
