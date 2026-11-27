import { MAX_PLAYERS, MSG, PUBLIC_MIN_HUMANS } from '@te-nuoc/shared';
import type { NetLobbyPlayer } from '../net/colyseus';
import { createCharacterAvatar } from './avatar';
import { createIconButton } from './icons';

interface PublicRoomView {
  sessionId: string;
  send(type: string, payload?: unknown): void;
  state: { lobby: { countdown: number; players: Map<string, NetLobbyPlayer> } };
}

export function waitingText(humans: number): string { return `Đang tìm người chơi… ${humans}/${MAX_PLAYERS}`; }
export function countdownText(sec: number): string { return `Trận bắt đầu sau ${Math.ceil(sec)} giây`; }

const searchStartByRoot = new WeakMap<HTMLElement, number>();
const searchTimerByRoot = new WeakMap<HTMLElement, number>();

function clearSearchTimer(root: HTMLElement): void {
  const timer = searchTimerByRoot.get(root);
  if (timer !== undefined) {
    clearInterval(timer);
    searchTimerByRoot.delete(root);
  }
}

function formatSearchClock(elapsedSec: number): string {
  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function renderMatchmaking(root: HTMLElement, room: PublicRoomView, onLeave: () => void): void {
  const lobby = room.state.lobby;
  const members = [...lobby.players.values()].sort((a, b) => a.slot - b.slot);
  const humans = members.length;
  const isMatchFound = humans >= PUBLIC_MIN_HUMANS || lobby.countdown > 0;
  const readyCount = members.filter((member) => member.ready).length;
  const own = lobby.players.get(room.sessionId);

  clearSearchTimer(root);
  root.replaceChildren();

  if (!isMatchFound) {
    // Phase 1: Matchmaking Radar Searching / Loading Screen (waiting for another player to click Matchmake)
    let startTime = searchStartByRoot.get(root);
    if (!startTime) {
      startTime = Date.now();
      searchStartByRoot.set(root, startTime);
    }

    const searchCard = document.createElement('div');
    searchCard.className = 'mm-loading-screen';

    const badge = document.createElement('div');
    badge.className = 'lq-status-badge lq-searching';
    badge.textContent = 'ĐANG GHÉP TRẬN';

    const title = document.createElement('h1');
    title.textContent = waitingText(humans);

    // Animated Radar Ring with player's character avatar in the center
    const radarWrap = document.createElement('div');
    radarWrap.className = 'mm-radar';
    const ring1 = document.createElement('div');
    ring1.className = 'mm-radar-ring mm-ring-1';
    const ring2 = document.createElement('div');
    ring2.className = 'mm-radar-ring mm-ring-2';
    const ring3 = document.createElement('div');
    ring3.className = 'mm-radar-ring mm-ring-3';
    const sweep = document.createElement('div');
    sweep.className = 'mm-radar-sweep';

    const centerAvatar = document.createElement('div');
    centerAvatar.className = 'mm-radar-avatar';
    centerAvatar.append(createCharacterAvatar(own?.variant ?? 0, own?.team ?? 0));

    radarWrap.append(ring1, ring2, ring3, sweep, centerAvatar);

    const ownNameTag = document.createElement('div');
    ownNameTag.className = 'mm-own-name';
    ownNameTag.textContent = own?.name ?? 'Bạn';

    const timerEl = document.createElement('div');
    timerEl.className = 'mm-timer';
    const updateTimer = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - (startTime ?? Date.now())) / 1000));
      timerEl.textContent = `THỜI GIAN TÌM: ${formatSearchClock(elapsed)}`;
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

    const loadingDots = document.createElement('div');
    loadingDots.className = 'mm-loading-bar';
    const loadingFill = document.createElement('div');
    loadingFill.className = 'mm-loading-fill';
    loadingDots.append(loadingFill);

    const hint = document.createElement('p');
    hint.className = 'lq-hint';
    hint.textContent = 'Đang tìm đối thủ cùng bấm Ghép ngẫu nhiên… (Cần ít nhất 2 người)';

    const cancelBtn = createIconButton('log-out', 'HỦY GHÉP TRẬN', () => {
      clearSearchTimer(root);
      searchStartByRoot.delete(root);
      onLeave();
    });
    cancelBtn.classList.add('lq-leave-btn', 'mm-cancel-btn');

    searchCard.append(badge, title, radarWrap, ownNameTag, timerEl, loadingDots, hint, cancelBtn);
    root.append(searchCard);
    return;
  }

  // Phase 2: Enough players found -> Show Match Found 10-slot Arena & Confirm Button!
  searchStartByRoot.delete(root);

  const header = document.createElement('div');
  header.className = 'lq-header';
  const badge = document.createElement('div');
  badge.className = 'lq-status-badge lq-found';
  badge.textContent = 'ĐÃ TÌM THẤY TRẬN';
  const title = document.createElement('h1');
  title.textContent = waitingText(humans);
  header.append(badge, title);
  root.append(header);

  const arena = document.createElement('div');
  arena.className = 'lq-arena lq-arena-found';

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
      spinner.textContent = 'BOT';
      circle.append(spinner);
    }

    const nameEl = document.createElement('span');
    nameEl.className = `lq-slot-name ${member ? `team-text-${member.team}` : ''}`;
    nameEl.textContent = member ? `${member.name}${member.ready ? ' ✓' : ''}` : 'Bot lấp chỗ';

    slotEl.append(circle, nameEl);
    slotsGrid.append(slotEl);
  }
  arena.append(slotsGrid);

  const progressText = document.createElement('div');
  progressText.className = 'lq-ready-count';
  progressText.textContent = `XÁC NHẬN: ${readyCount}/${humans}`;
  arena.append(progressText);
  root.append(arena);

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

  const ready = createIconButton(
    own?.ready ? 'check-circle' : 'swords',
    own?.ready ? 'ĐÃ XÁC NHẬN' : 'XÁC NHẬN VÀO TRẬN',
    () => room.send(MSG.ready, { on: !own?.ready }),
  );
  ready.classList.add('lq-confirm-btn');
  if (own?.ready) ready.classList.add('lq-confirmed');
  actions.append(ready);

  if (lobby.countdown > 0) {
    const hint = document.createElement('p');
    hint.className = 'lq-countdown';
    hint.textContent = countdownText(lobby.countdown);
    actions.append(hint);
  }

  const leave = createIconButton('log-out', 'Rời phòng', () => {
    clearSearchTimer(root);
    onLeave();
  });
  leave.classList.add('lq-leave-btn');
  actions.append(leave);
  root.append(actions);
}
