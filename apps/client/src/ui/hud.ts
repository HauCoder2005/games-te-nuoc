import type { GameEvent, PlayerState, Team, World } from '@te-nuoc/shared';
import { createCharacterAvatar } from './avatar';

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

export function updateHud(root: HTMLElement, world: World, names: ReadonlyMap<number, string>, feed: string[],
  options: { roomLabel?: string; banner?: string } = {}): void {
  root.replaceChildren();
  if (options.roomLabel) {
    const label = document.createElement('div'); label.className = 'room-label'; label.textContent = options.roomLabel; root.append(label);
  }
  const score = document.createElement('div');
  score.className = 'score';
  const red = document.createElement('span'); red.className = 'score-red'; red.textContent = `ĐỎ ${world.score[0]}`;
  const separator = document.createElement('span'); separator.className = 'score-separator'; separator.textContent = ':';
  const blue = document.createElement('span'); blue.className = 'score-blue'; blue.textContent = `${world.score[1]} XANH`;
  score.append(red, separator, blue);
  const clock = document.createElement('div');
  clock.className = 'clock';
  clock.textContent = formatClock(world.timeLeft);

  const pillarHud = document.createElement('div');
  pillarHud.className = 'pillar-hud';
  const pillarText = document.createElement('div');
  pillarText.className = 'pillar-text';
  const pct = Math.round(world.pillar.progress * 100);
  if (world.pillar.contested) {
    pillarText.textContent = '⚔️ CỘT GIỮA: ĐANG TRANH CHẤP!';
  } else if (world.pillar.capturingTeam !== null && world.pillar.progress > 0) {
    const teamName = world.pillar.capturingTeam === 0 ? 'ĐỘI ĐỎ' : 'ĐỘI XANH';
    pillarText.textContent = `🚩 ${teamName} ĐANG CHIẾM CỘT (${pct}%)`;
  } else if (world.pillar.owner !== null) {
    const teamName = world.pillar.owner === 0 ? 'ĐỘI ĐỎ' : 'ĐỘI XANH';
    pillarText.textContent = `🏛️ CỘT GIỮA: ${teamName} ĐANG GIỮ (+1 điểm mỗi 7s)`;
  } else {
    pillarText.textContent = '🏛️ CỘT GIỮA: CHƯA AI CHIẾM (Đứng vào vòng tròn giữa bè)';
  }
  const pillarBar = document.createElement('div');
  pillarBar.className = 'pillar-bar';
  const pillarFill = document.createElement('div');
  const activeTeam = world.pillar.capturingTeam ?? world.pillar.owner;
  pillarFill.className = `pillar-fill ${activeTeam === 0 ? 'pillar-fill-red' : activeTeam === 1 ? 'pillar-fill-blue' : ''}`;
  pillarFill.style.width = `${world.pillar.owner !== null && world.pillar.capturingTeam === null ? 100 : pct}%`;
  pillarBar.append(pillarFill);
  pillarHud.append(pillarText, pillarBar);

  if (options.banner) {
    const banner = document.createElement('div'); banner.className = 'banner'; banner.textContent = options.banner; root.append(banner);
  }
  const messages = document.createElement('div');
  messages.className = 'feed';
  for (const text of feed.slice(-4)) {
    const line = document.createElement('div');
    line.textContent = text;
    messages.append(line);
  }
  const chips = document.createElement('div');
  chips.className = 'chips';
  for (const player of [...world.players].sort((a, b) => a.team - b.team || a.slot - b.slot)) {
    const chip = document.createElement('div');
    chip.className = `chip team-${player.team}`;
    const face = document.createElement('span');
    face.className = 'chip-face';
    face.append(createCharacterAvatar(player.variant, player.team));
    const name = document.createElement('span');
    name.className = `chip-name team-text-${player.team}`;
    name.textContent = names.get(player.slot) ?? `#${player.slot}`;
    const stats = document.createElement('span');
    stats.className = 'chip-stats';
    stats.textContent = `${chipStatus(player)} · KO ${player.stats.ko}`;
    chip.append(face, name, stats);
    chips.append(chip);
  }
  root.append(score, clock, pillarHud, messages, chips);
}
