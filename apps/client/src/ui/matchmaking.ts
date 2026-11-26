import { MAX_PLAYERS, MSG, PUBLIC_MIN_HUMANS } from '@te-nuoc/shared';
import type { NetLobbyPlayer } from '../net/colyseus';
import { createCharacterAvatar } from './avatar';

interface PublicRoomView {
  sessionId: string;
  send(type: string, payload?: unknown): void;
  state: { lobby: { countdown: number; players: Map<string, NetLobbyPlayer> } };
}

export function waitingText(humans: number): string { return `Đang tìm người chơi… ${humans}/${MAX_PLAYERS}`; }
export function countdownText(sec: number): string { return `Trận bắt đầu sau ${Math.ceil(sec)} giây`; }

export function renderMatchmaking(root: HTMLElement, room: PublicRoomView, onLeave: () => void): void {
  const lobby = room.state.lobby;
  const members = [...lobby.players.values()].sort((a, b) => a.slot - b.slot);
  const humans = members.length;
  const hasEnoughPlayers = humans >= PUBLIC_MIN_HUMANS;
  const readyCount = members.filter((member) => member.ready).length;
  const own = lobby.players.get(room.sessionId);

  root.replaceChildren();

  const header = document.createElement('div');
  header.className = 'lq-header';
  const badge = document.createElement('div');
  badge.className = `lq-status-badge ${hasEnoughPlayers ? 'lq-found' : 'lq-searching'}`;
  badge.textContent = hasEnoughPlayers ? '⚔️ ĐÃ TÌM THẤY TRẬN ĐẤU!' : '🔍 ĐANG TÌM TRẬN ĐẤU HẠNG…';
  const title = document.createElement('h1');
  title.textContent = waitingText(humans);
  header.append(badge, title);
  root.append(header);

  // Liên Quân style 10-slot circular avatar confirmation board (5 Red vs 5 Blue)
  const arena = document.createElement('div');
  arena.className = 'lq-arena';

  const slotsGrid = document.createElement('div');
  slotsGrid.className = 'lq-slots-grid';
  for (let i = 0; i < MAX_PLAYERS; i++) {
    const member = members[i];
    const slotEl = document.createElement('div');
    const isFilled = Boolean(member);
    const isReady = Boolean(member?.ready);
    slotEl.className = `lq-slot ${isFilled ? 'lq-slot-filled' : 'lq-slot-empty'} ${isReady ? 'lq-slot-ready' : ''}`;

    const circle = document.createElement('div');
    circle.className = 'lq-slot-circle';
    if (member) {
      circle.append(createCharacterAvatar(member.variant, member.team));
      if (member.ready) {
        const check = document.createElement('span');
        check.className = 'lq-slot-check';
        check.textContent = '✓';
        circle.append(check);
      }
    } else {
      const spinner = document.createElement('span');
      spinner.className = 'lq-slot-spinner';
      spinner.textContent = '…';
      circle.append(spinner);
    }

    const nameEl = document.createElement('span');
    nameEl.className = `lq-slot-name ${member ? `team-text-${member.team}` : ''}`;
    nameEl.textContent = member ? `${member.name}${member.ready ? ' ✓' : ''}` : 'Đang chờ…';

    slotEl.append(circle, nameEl);
    slotsGrid.append(slotEl);
  }
  arena.append(slotsGrid);

  const progressText = document.createElement('div');
  progressText.className = 'lq-ready-count';
  progressText.textContent = hasEnoughPlayers
    ? `Đã xác nhận: ${readyCount}/${humans} người chơi`
    : 'Đang quét tìm thêm người chơi trong khu vực…';
  arena.append(progressText);
  root.append(arena);

  // Keep team columns for clear Red/Blue overview
  const teams = document.createElement('div');
  teams.className = 'teams';
  for (const team of [0, 1] as const) {
    const column = document.createElement('section');
    const heading = document.createElement('h2');
    heading.textContent = team === 0 ? 'ĐỘI ĐỎ' : 'ĐỘI XANH';
    column.append(heading);
    for (const member of members) {
      if (member.team !== team) continue;
      const row = document.createElement('div');
      row.className = `lobby-player team-${team}`;
      const face = document.createElement('span');
      face.className = 'lobby-face';
      face.append(createCharacterAvatar(member.variant, team));
      const text = document.createElement('span');
      text.className = `player-name team-text-${team}`;
      text.textContent = `${member.name}${member.ready ? ' ✓' : ''}`;
      row.append(face, text);
      column.append(row);
    }
    teams.append(column);
  }
  root.append(teams);

  const actions = document.createElement('div');
  actions.className = 'lq-actions';

  const ready = document.createElement('button');
  ready.className = `lq-confirm-btn ${own?.ready ? 'lq-confirmed' : ''}`;
  ready.textContent = own?.ready ? 'ĐÃ XÁC NHẬN ✓' : 'XÁC NHẬN VÀO TRẬN';
  ready.addEventListener('click', () => room.send(MSG.ready, { on: !own?.ready }));
  actions.append(ready);

  if (lobby.players.size < PUBLIC_MIN_HUMANS) {
    const hint = document.createElement('p');
    hint.className = 'lq-hint';
    hint.textContent = 'Cần ít nhất 2 người';
    actions.append(hint);
  }
  if (lobby.countdown > 0) {
    const hint = document.createElement('p');
    hint.className = 'lq-countdown';
    hint.textContent = countdownText(lobby.countdown);
    actions.append(hint);
  }

  const leave = document.createElement('button');
  leave.className = 'lq-leave-btn';
  leave.textContent = 'Rời phòng';
  leave.addEventListener('click', onLeave);
  actions.append(leave);
  root.append(actions);
}
