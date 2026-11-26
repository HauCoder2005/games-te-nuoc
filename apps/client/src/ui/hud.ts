import type { GameEvent, PlayerState, Team, World } from '@te-nuoc/shared';

export function formatClock(sec: number): string {
  const rounded = Math.max(0, Math.ceil(sec));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

export function chipStatus(player: PlayerState): string {
  if (player.status === 'respawning' || player.status === 'falling') return `HỒI ${Math.ceil(player.timer)}`;
  if (player.status === 'protected') return 'BẢO VỆ';
  return `${Math.round(player.wet)}%`;
}

export function killFeedLine(
  event: GameEvent,
  names: ReadonlyMap<number, string>,
  teams?: ReadonlyMap<number, Team>,
): { text: string; team: Team }[] | null {
  if (event.k !== 'fall') return null;
  const fallenName = names.get(event.slot) ?? `#${event.slot}`;
  const fallenTeam = teams?.get(event.slot) ?? 0;
  if (event.by === null) return [{ text: `${fallenName} tự nhảy xuống hồ!`, team: fallenTeam }];
  const attackerName = names.get(event.by) ?? `#${event.by}`;
  const attackerTeam = teams?.get(event.by) ?? 0;
  return [
    { text: attackerName, team: attackerTeam },
    { text: ' ném ', team: attackerTeam },
    { text: fallenName, team: fallenTeam },
    { text: ' xuống nước!', team: fallenTeam },
  ];
}

export function updateHud(root: HTMLElement, world: World, names: ReadonlyMap<number, string>, feed: string[]): void {
  root.replaceChildren();
  const score = document.createElement('div');
  score.className = 'score';
  score.textContent = `ĐỎ ${world.score[0]} : ${world.score[1]} XANH`;
  const clock = document.createElement('div');
  clock.className = 'clock';
  clock.textContent = formatClock(world.timeLeft);
  const messages = document.createElement('div');
  messages.className = 'feed';
  for (const text of feed.slice(-4)) {
    const line = document.createElement('div');
    line.textContent = text;
    messages.append(line);
  }
  const chips = document.createElement('div');
  chips.className = 'chips';
  for (const player of world.players) {
    const chip = document.createElement('div');
    chip.className = `chip team-${player.team}`;
    const name = document.createElement('span');
    name.textContent = names.get(player.slot) ?? `#${player.slot}`;
    const stats = document.createElement('span');
    stats.textContent = `${chipStatus(player)} · KO ${player.stats.ko}`;
    chip.append(name, stats);
    chips.append(chip);
  }
  root.append(score, clock, messages, chips);
}
