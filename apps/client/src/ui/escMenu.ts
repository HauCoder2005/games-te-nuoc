import type { World } from '@te-nuoc/shared';
import { createIconButton } from './icons';

export function attachGameMenus(panel: HTMLElement, world: () => World | null,
  names: () => ReadonlyMap<number, string>, onLeave: () => void): () => void {
  const menu = document.createElement('div');
  menu.className = 'pause-menu';
  menu.hidden = true;
  const heading = document.createElement('h2'); heading.textContent = 'TẠM DỪNG';
  const resume = createIconButton('play', 'Tiếp tục', () => { menu.hidden = true; });
  const leave = createIconButton('log-out', 'Rời phòng', onLeave);
  menu.append(heading, resume, leave);
  const stats = document.createElement('div');
  stats.className = 'stats-menu';
  stats.hidden = true;
  panel.append(menu, stats);
  const down = (event: KeyboardEvent) => {
    if (event.code === 'Escape') { menu.hidden = !menu.hidden; event.preventDefault(); }
    if (event.code !== 'Tab') return;
    event.preventDefault();
    stats.replaceChildren();
    const heading = document.createElement('h2'); heading.textContent = 'THỐNG KÊ'; stats.append(heading);
    for (const player of world()?.players ?? []) {
      const line = document.createElement('p');
      line.textContent = `${player.team === 0 ? 'ĐỎ' : 'XANH'} · ${names().get(player.slot) ?? `#${player.slot}`} · KO ${player.stats.ko} · Trúng thẳng ${player.stats.direct} · Rơi ${player.stats.falls}`;
      stats.append(line);
    }
    stats.hidden = false;
  };
  const up = (event: KeyboardEvent) => { if (event.code === 'Tab') stats.hidden = true; };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    menu.remove(); stats.remove();
  };
}
