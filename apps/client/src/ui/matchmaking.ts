import { MAX_PLAYERS, MSG } from '@te-nuoc/shared';
import type { NetLobbyPlayer } from '../net/colyseus';

interface PublicRoomView {
  sessionId: string;
  send(type: string, payload?: unknown): void;
  state: { lobby: { countdown: number; players: Map<string, NetLobbyPlayer> } };
}

export function waitingText(humans: number): string { return `Đang tìm người chơi… ${humans}/${MAX_PLAYERS}`; }
export function countdownText(sec: number): string { return `Trận bắt đầu sau ${Math.ceil(sec)} giây`; }

export function renderMatchmaking(root: HTMLElement, room: PublicRoomView, onLeave: () => void): void {
  const lobby = room.state.lobby;
  root.replaceChildren();
  const title = document.createElement('h1');
  title.textContent = waitingText(lobby.players.size);
  root.append(title);
  const teams = document.createElement('div');
  teams.className = 'teams';
  for (const team of [0, 1] as const) {
    const column = document.createElement('section');
    const heading = document.createElement('h2');
    heading.textContent = team === 0 ? 'ĐỘI ĐỎ' : 'ĐỘI XANH';
    column.append(heading);
    for (const member of lobby.players.values()) {
      if (member.team !== team) continue;
      const row = document.createElement('div');
      row.className = `lobby-player team-${team}`;
      row.textContent = `${member.name}${member.ready ? ' ✓' : ''}`;
      column.append(row);
    }
    teams.append(column);
  }
  root.append(teams);
  const own = lobby.players.get(room.sessionId);
  const ready = document.createElement('button');
  ready.textContent = own?.ready ? 'Bắt đầu ✓' : 'Bắt đầu';
  ready.addEventListener('click', () => room.send(MSG.ready, { on: !own?.ready }));
  root.append(ready);
  if (lobby.players.size < 2) {
    const hint = document.createElement('p'); hint.textContent = 'Cần ít nhất 2 người'; root.append(hint);
  }
  if (lobby.countdown > 0) {
    const hint = document.createElement('p'); hint.textContent = countdownText(lobby.countdown); root.append(hint);
  }
  const leave = document.createElement('button');
  leave.textContent = 'Rời phòng';
  leave.addEventListener('click', onLeave);
  root.append(leave);
}
