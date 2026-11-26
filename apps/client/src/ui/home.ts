import { MAX_NAME_LENGTH, normalizeName } from '@te-nuoc/shared';
import { startPractice } from '../offline/practice';

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
  const label = document.createElement('label');
  label.textContent = 'Tên của bạn';
  const name = document.createElement('input');
  name.value = localStorage.getItem('te-nuoc-name') ?? '';
  name.addEventListener('input', () => { name.value = Array.from(name.value).slice(0, MAX_NAME_LENGTH).join(''); });
  label.append(name);
  const button = document.createElement('button');
  button.textContent = 'Chơi thử với bot';
  const error = document.createElement('p');
  button.addEventListener('click', () => {
    const clean = normalizeName(name.value);
    if (!clean) { error.textContent = 'Vui lòng nhập tên'; return; }
    localStorage.setItem('te-nuoc-name', clean);
    startPractice(root);
  });
  panel.append(label, button, error);
  root.append(panel);
}
