const SVG_NS = 'http://www.w3.org/2000/svg';

function makeSvg(paths: string[], viewBox = '0 0 24 24', fill = 'none', stroke = 'currentColor', strokeWidth = '2.3'): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('fill', fill);
  svg.setAttribute('stroke', stroke);
  svg.setAttribute('stroke-width', strokeWidth);
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

export function createFullscreenExpandIcon(): SVGSVGElement {
  return makeSvg([
    'M8 3H5a2 2 0 0 0-2 2v3',
    'M21 8V5a2 2 0 0 0-2-2h-3',
    'M3 16v3a2 2 0 0 0 2 2h3',
    'M16 21h3a2 2 0 0 0 2-2v-3',
  ]);
}

export function createFullscreenCompressIcon(): SVGSVGElement {
  return makeSvg([
    'M4 14h6v6',
    'M20 10h-6V4',
    'M14 10l7-7',
    'M3 21l7-7',
  ]);
}

export function createDualSwordsIcon(): SVGSVGElement {
  return makeSvg([
    'M14.5 17.5 3 6V3h3l11.5 11.5',
    'M13 19l6-6',
    'M16 16l4 4',
    'M19 21l2-2',
    'M14.5 6.5 18 3h3v3l-3.5 3.5',
    'M5 14l4 4',
    'M7 17l-3 3',
    'M3 19l2 2',
  ]);
}

export function createDashBoltIcon(): SVGSVGElement {
  return makeSvg(
    ['M13 2 3 14h9l-1 8 10-12h-9l1-8z'],
    '0 0 24 24',
    'currentColor',
    'currentColor',
    '1.8',
  );
}

interface FullscreenDoc extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

interface FullscreenElem extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

export function isFullscreenActive(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDoc;
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
}

export async function toggleFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return;
  const doc = document as FullscreenDoc;
  const root = document.documentElement as FullscreenElem;
  try {
    if (!isFullscreenActive()) {
      if (root.requestFullscreen) await root.requestFullscreen();
      else if (root.webkitRequestFullscreen) await root.webkitRequestFullscreen();
      if (typeof screen !== 'undefined' && 'orientation' in screen) {
        const orient = screen.orientation as ScreenOrientation & { lock?: (mode: string) => Promise<void> };
        if (typeof orient.lock === 'function') {
          await orient.lock('landscape').catch(() => {});
        }
      }
    } else {
      if (doc.exitFullscreen) await doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    }
  } catch {
    /* Fallback: scroll address bar out of view on iOS Safari */
    window.scrollTo(0, 1);
  }
}

export function ensureFloatingFullscreenButton(): HTMLButtonElement {
  let btn = document.getElementById('yt-fullscreen-btn') as HTMLButtonElement | null;
  if (btn) return btn;

  btn = document.createElement('button');
  btn.id = 'yt-fullscreen-btn';
  btn.type = 'button';
  btn.className = 'yt-fullscreen-btn';
  btn.title = 'Toàn màn hình (Ẩn thanh địa chỉ)';
  btn.setAttribute('aria-label', 'Toàn màn hình');

  const syncIcon = () => {
    if (!btn) return;
    btn.replaceChildren(
      isFullscreenActive() ? createFullscreenCompressIcon() : createFullscreenExpandIcon(),
    );
    btn.classList.toggle('is-fullscreen', isFullscreenActive());
  };
  syncIcon();

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    void toggleFullscreen().then(syncIcon);
  });

  document.addEventListener('fullscreenchange', syncIcon);
  document.addEventListener('webkitfullscreenchange', syncIcon);
  document.body.append(btn);
  return btn;
}
