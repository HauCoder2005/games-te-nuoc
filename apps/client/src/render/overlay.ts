import { TEAM_COLORS } from '@te-nuoc/shared';
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
  scale: number,
  pixelRatio: number,
): void {
  const viewerTeam = players.find((player) => player.slot === viewerSlot)?.team ?? null;
  const visible = new Set(visibleNameTags(players, viewerTeam));
  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'bottom';
  context.font = `${18 * pixelRatio}px VT323, monospace`;
  context.lineWidth = 3 * pixelRatio;
  for (const player of players) {
    if (!visible.has(player.slot) || player.status === 'respawning') continue;
    const name = names?.get(player.slot) ?? `#${player.slot}`;
    const label = player.slot === viewerSlot ? `${name} (bạn)` : name;
    const x = player.x * scale * pixelRatio;
    const y = (player.y - 25) * scale * pixelRatio;
    context.strokeStyle = '#2B1E2F';
    context.fillStyle = TEAM_COLORS[player.team];
    context.strokeText(label, x, y);
    context.fillText(label, x, y);
    if (player.slot === viewerSlot) {
      context.fillStyle = '#FFFFFF';
      context.beginPath();
      context.moveTo(x, y - 19 * pixelRatio);
      context.lineTo(x - 4 * pixelRatio, y - 25 * pixelRatio);
      context.lineTo(x + 4 * pixelRatio, y - 25 * pixelRatio);
      context.fill();
    }
  }
  context.restore();
}
