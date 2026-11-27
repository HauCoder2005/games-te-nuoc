import { MAX_PLAYERS } from '@te-nuoc/shared';
import type { NetLobbyPlayer } from '../net/colyseus';
import { createCharacterAvatar } from './avatar';
import { createIconButton } from './icons';

interface PublicRoomView {
  sessionId: string;
  state: { lobby: { countdown: number; players: Map<string, NetLobbyPlayer> } };
}

export function waitingText(humans: number): string {
  return 'Đang tìm người chơi… ' + humans + '/' + MAX_PLAYERS;
}

const searchStartByRoot = new WeakMap<HTMLElement, number>();
const searchTimerByRoot = new WeakMap<HTMLElement, number>();

function clearSearchTimer(root: HTMLElement): void {
  const timer = searchTimerByRoot.get(root);
  if (timer === undefined) return;
  clearInterval(timer);
  searchTimerByRoot.delete(root);
}

function formatSearchClock(elapsedSec: number): string {
  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

export function renderMatchmaking(root: HTMLElement, room: PublicRoomView, onLeave: () => void): void {
  const members = [...room.state.lobby.players.values()].sort((a, b) => a.slot - b.slot);
  const own = room.state.lobby.players.get(room.sessionId);
  clearSearchTimer(root);
  root.replaceChildren();

  let startTime = searchStartByRoot.get(root);
  if (startTime === undefined) {
    startTime = Date.now();
    searchStartByRoot.set(root, startTime);
  }

  const searchCard = document.createElement('div');
  searchCard.className = 'mm-loading-screen';
  const badge = document.createElement('div');
  badge.className = 'lq-status-badge lq-searching';
  badge.textContent = 'ĐANG GHÉP TRẬN';
  const title = document.createElement('h1');
  title.textContent = waitingText(members.length);

  const radarWrap = document.createElement('div');
  radarWrap.className = 'mm-radar';
  for (let ring = 1; ring <= 3; ring++) {
    const circle = document.createElement('div');
    circle.className = 'mm-radar-ring mm-ring-' + ring;
    radarWrap.append(circle);
  }
  const sweep = document.createElement('div');
  sweep.className = 'mm-radar-sweep';
  const centerAvatar = document.createElement('div');
  centerAvatar.className = 'mm-radar-avatar';
  centerAvatar.append(createCharacterAvatar(own?.variant ?? 0, own?.team ?? 0));
  radarWrap.append(sweep, centerAvatar);

  const ownNameTag = document.createElement('div');
  ownNameTag.className = 'mm-own-name';
  ownNameTag.textContent = own?.name ?? 'Bạn';
  const timerEl = document.createElement('div');
  timerEl.className = 'mm-timer';
  const updateTimer = () => {
    const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
    timerEl.textContent = 'THỜI GIAN TÌM: ' + formatSearchClock(elapsed);
  };
  updateTimer();
  if (typeof window !== 'undefined') {
    const intervalId = window.setInterval(() => {
      if (!root.isConnected || !timerEl.isConnected) {
        clearSearchTimer(root);
        return;
      }
      updateTimer();
    }, 1000);
    searchTimerByRoot.set(root, intervalId);
  }

  const slotsGrid = document.createElement('div');
  slotsGrid.className = 'lq-slots-grid mm-slots-grid';
  for (let slot = 0; slot < MAX_PLAYERS; slot++) {
    const member = members[slot];
    const slotEl = document.createElement('div');
    slotEl.className = 'lq-slot ' + (member ? 'lq-slot-filled' : 'lq-slot-empty');
    const circle = document.createElement('div');
    circle.className = 'lq-slot-circle';
    if (member) circle.append(createCharacterAvatar(member.variant, member.team));
    else {
      const placeholder = document.createElement('span');
      placeholder.className = 'lq-slot-spinner';
      placeholder.textContent = '?';
      circle.append(placeholder);
    }
    const name = document.createElement('span');
    name.className = 'lq-slot-name' + (member ? ' team-text-' + member.team : '');
    name.textContent = member?.name ?? 'Đang chờ';
    slotEl.append(circle, name);
    slotsGrid.append(slotEl);
  }

  const hint = document.createElement('p');
  hint.className = 'lq-hint';
  hint.textContent = 'Đủ 10 người sẽ tự vào trận 5v5';
  const cancelBtn = createIconButton('log-out', 'HỦY GHÉP TRẬN', () => {
    clearSearchTimer(root);
    searchStartByRoot.delete(root);
    onLeave();
  });
  cancelBtn.classList.add('lq-leave-btn', 'mm-cancel-btn');
  searchCard.append(badge, title, radarWrap, ownNameTag, timerEl, slotsGrid, hint, cancelBtn);
  root.append(searchCard);
}
