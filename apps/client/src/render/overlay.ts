import { SELF_NAME_COLOR, TEAM_NAME_COLORS } from '@te-nuoc/shared';
import type { PlayerState, Team } from '@te-nuoc/shared';

export function visibleNameTags(players: { slot: number; team: Team }[], viewerTeam: Team | null): number[] {
  return players.filter((player) => viewerTeam === null || player.team === viewerTeam).map((player) => player.slot);
}

export function wetTint(wet: number): number {
  return Math.max(0, Math.min(0.4, wet / 150 * 0.4));
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
  context.font = `800 ${15 * pixelRatio}px 'Segoe UI', system-ui, -apple-system, sans-serif`;
  context.lineWidth = 4 * pixelRatio;
  context.lineJoin = 'round';
  for (const player of players) {
    if (!visible.has(player.slot) || player.status === 'respawning') continue;
    const name = names?.get(player.slot) ?? `#${player.slot}`;
    const isSelf = player.slot === viewerSlot;
    const label = isSelf ? `${name} (bạn)` : name;
    const x = player.x * scaleX * pixelRatio;
    const y = (player.y - 25) * scaleY * pixelRatio;
    context.strokeStyle = '#181020';
    context.fillStyle = isSelf ? SELF_NAME_COLOR : TEAM_NAME_COLORS[player.team];
    context.strokeText(label, x, y);
    context.fillText(label, x, y);
    if (isSelf) {
      context.fillStyle = SELF_NAME_COLOR;
      context.beginPath();
      context.moveTo(x, y - 18 * pixelRatio);
      context.lineTo(x - 4.5 * pixelRatio, y - 24 * pixelRatio);
      context.lineTo(x + 4.5 * pixelRatio, y - 24 * pixelRatio);
      context.fill();
    }
  }
  context.restore();
}
