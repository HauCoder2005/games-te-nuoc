const SVG_NS = 'http://www.w3.org/2000/svg';

export type IconName =
  | 'swords' | 'plus' | 'log-in' | 'bot' | 'check' | 'check-circle'
  | 'log-out' | 'copy' | 'shuffle' | 'play' | 'users' | 'target'
  | 'cpu' | 'refresh' | 'user-plus' | 'key' | 'trophy' | 'shield' | 'arrow-right-left';

const ICON_PATHS: Record<IconName, string[]> = {
  swords: [
    'M14.5 17.5 3 6V3h3l11.5 11.5',
    'M13 19l6-6',
    'M16 16l4 4',
    'M19 21l2-2',
    'M14.5 6.5 18 3h3v3l-3.5 3.5',
    'M5 14l4 4',
    'M7 17l-3 3',
    'M3 19l2 2',
  ],
  plus: [
    'M12 5v14',
    'M5 12h14',
  ],
  'log-in': [
    'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4',
    'M10 17l5-5-5-5',
    'M15 12H3',
  ],
  bot: [
    'M12 8V4H8',
    'M4 12h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Z',
    'M2 14h2',
    'M20 14h2',
    'M15 13v2',
    'M9 13v2',
  ],
  check: [
    'M20 6 9 17l-5-5',
  ],
  'check-circle': [
    'M22 11.08V12a10 10 0 1 1-5.93-9.14',
    'M22 4 12 14.01l-3-3',
  ],
  'log-out': [
    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4',
    'M16 17l5-5-5-5',
    'M21 12H9',
  ],
  copy: [
    'M8 8h12v12H8z',
    'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2',
  ],
  shuffle: [
    'M16 3h5v5',
    'M4 20 21 3',
    'M21 16v5h-5',
    'M15 15l6 6',
    'M4 4l5 5',
  ],
  play: [
    'M6 3l14 9-14 9V3z',
  ],
  users: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  target: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
    'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  ],
  cpu: [
    'M4 4h16v16H4z',
    'M9 9h6v6H9z',
    'M9 1v3',
    'M15 1v3',
    'M9 20v3',
    'M15 20v3',
    'M20 9h3',
    'M20 14h3',
    'M1 9h3',
    'M1 14h3',
  ],
  refresh: [
    'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8',
    'M3 3v5h5',
  ],
  'user-plus': [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M19 8v6',
    'M22 11h-6',
  ],
  key: [
    'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
  ],
  trophy: [
    'M6 9H4.5a2.5 2.5 0 0 1 0-5H6',
    'M18 9h1.5a2.5 2.5 0 0 0 0-5H18',
    'M4 22h16',
    'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22',
    'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22',
    'M18 2H6v7a6 6 0 0 0 12 0V2Z',
  ],
  shield: [
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
  ],
  'arrow-right-left': [
    'M16 3l4 4-4 4',
    'M20 7H4',
    'M8 21l-4-4 4-4',
    'M4 17h16',
  ],
};

export function createIcon(name: IconName): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.3');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('class', `btn-icon icon-${name}`);
  svg.setAttribute('aria-hidden', 'true');
  for (const d of ICON_PATHS[name]) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

export function setButtonContent(btn: HTMLButtonElement, icon: IconName, label: string): void {
  btn.replaceChildren();
  btn.classList.add('icon-btn');
  const iconEl = createIcon(icon);
  const textEl = document.createElement('span');
  textEl.className = 'btn-text';
  textEl.textContent = label;
  btn.append(iconEl, textEl);
}

export function createIconButton(icon: IconName, label: string, onClick?: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  setButtonContent(btn, icon, label);
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
