import { MAX_NAME_LENGTH, normalizeName } from '@te-nuoc/shared';
import { startPractice } from '../offline/practice';
import { connect, mapJoinError, parseRoute } from '../net/colyseus';
import { showRoom } from './privateLobby';

export function isTouchOnly(nav: { maxTouchPoints: number }, mq: (query: string) => boolean): boolean {
  return nav.maxTouchPoints > 0 && !mq('(pointer: fine)');
}

export function showHome(root: HTMLElement): void {
  root.replaceChildren();
  const panel = document.createElement('main');
  panel.className = 'home';
  const title = document.createElement('h1');
  title.textContent = 'TÉ NƯỚC!';
  panel.append(title);
  if (isTouchOnly(navigator, (query) => window.matchMedia(query).matches)) {
    const notice = document.createElement('p');
    notice.textContent = 'Game cần bàn phím và chuột';
    panel.append(notice);
    root.append(panel);
    return;
  }
  const nameBox = document.createElement('section');
  nameBox.className = 'home-box home-box-name';
  const label = document.createElement('label');
  label.textContent = 'Tên của bạn';
  const name = document.createElement('input');
  name.placeholder = 'Nhập tên (tối đa 12 ký tự)';
  name.value = localStorage.getItem('te-nuoc-name') ?? '';
  name.addEventListener('input', () => { name.value = Array.from(name.value).slice(0, MAX_NAME_LENGTH).join(''); });
  label.append(name);
  nameBox.append(label);

  const roomBox = document.createElement('section');
  roomBox.className = 'home-box home-box-room';
  const roomLabel = document.createElement('label');
  roomLabel.textContent = 'Mã phòng';
  const roomRow = document.createElement('div');
  roomRow.className = 'room-input-row';
  const roomCode = document.createElement('input');
  roomCode.placeholder = 'Mã phòng (4 chữ)';
  roomCode.value = parseRoute(location.hash).roomCode ?? '';

  const button = document.createElement('button');
  button.textContent = 'Chơi thử với bot';
  const error = document.createElement('p');
  error.className = 'error';
  const cleanName = (): string | null => {
    const clean = normalizeName(name.value);
    if (!clean) { error.textContent = 'Vui lòng nhập tên'; return null; }
    localStorage.setItem('te-nuoc-name', clean);
    error.textContent = '';
    return clean;
  };
  const join = async (mode: 'private' | 'code' | 'public'): Promise<void> => {
    const clean = cleanName();
    if (!clean) return;
    error.textContent = 'Đang kết nối…';
    try {
      const client = connect();
      const room = mode === 'private' ? await client.createPrivate(clean)
        : mode === 'code' ? await client.joinByCode(roomCode.value, clean) : await client.quickMatch(clean);
      if (mode === 'private') location.hash = `#/r/${room.roomId}`;
      showRoom(root, room);
    } catch (cause) {
      error.textContent = mapJoinError(cause);
      const retry = document.createElement('button');
      retry.textContent = 'Thử lại';
      retry.addEventListener('click', () => { retry.remove(); void join(mode); });
      error.append(retry);
    }
  };
  const create = document.createElement('button');
  create.textContent = 'Tạo phòng riêng';
  create.addEventListener('click', () => { void join('private'); });
  const quick = document.createElement('button');
  quick.textContent = 'Ghép ngẫu nhiên';
  quick.addEventListener('click', () => { void join('public'); });
  const enter = document.createElement('button');
  enter.textContent = 'Vào';
  enter.addEventListener('click', () => { void join('code'); });
  roomRow.append(roomCode, enter);
  roomLabel.append(roomRow);
  roomBox.append(roomLabel, create);
  button.addEventListener('click', () => {
    const clean = cleanName();
    if (!clean) return;
    startPractice(root);
  });
  panel.append(nameBox, roomBox, quick, button, error);
  root.append(panel);
}
