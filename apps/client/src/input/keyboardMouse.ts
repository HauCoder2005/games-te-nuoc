import type { InputFrame } from '@te-nuoc/shared';

export interface InputSource { sample(): InputFrame; destroy(): void }

export function createInput(
  target: Window,
  canvas: HTMLCanvasElement,
  toWorld: (cx: number, cy: number) => { x: number; y: number },
): InputSource {
  const held = new Set<string>();
  let seq = 0; let th = 0; let da = 0;
  let aim = { x: 320, y: 199 };
  const movement = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);

  const down = (event: KeyboardEvent) => {
    if (movement.has(event.code) || event.code === 'Space') event.preventDefault();
    if (event.code === 'Space' && !held.has('Space') && !event.repeat) da++;
    held.add(event.code);
  };
  const up = (event: KeyboardEvent) => { held.delete(event.code); };
  const clear = () => held.clear();
  const visibility = () => { if (target.document.hidden) clear(); };
  const mouse = (event: MouseEvent) => { aim = toWorld(event.clientX, event.clientY); };
  const click = (event: MouseEvent) => {
    mouse(event);
    if (event.button === 0) th++;
    if (event.button === 2) da++;
  };
  const contextMenu = (event: MouseEvent) => event.preventDefault();
  target.addEventListener('keydown', down);
  target.addEventListener('keyup', up);
  target.addEventListener('blur', clear);
  target.document.addEventListener('visibilitychange', visibility);
  canvas.addEventListener('mousemove', mouse);
  canvas.addEventListener('mousedown', click);
  canvas.addEventListener('contextmenu', contextMenu);

  return {
    sample() {
      seq++;
      const mx = Number(held.has('KeyD') || held.has('ArrowRight')) - Number(held.has('KeyA') || held.has('ArrowLeft'));
      const my = Number(held.has('KeyS') || held.has('ArrowDown')) - Number(held.has('KeyW') || held.has('ArrowUp'));
      const length = Math.hypot(mx, my);
      return { seq, mx: length ? mx / length : 0, my: length ? my / length : 0, ax: aim.x, ay: aim.y, th, da };
    },
    destroy() {
      target.removeEventListener('keydown', down);
      target.removeEventListener('keyup', up);
      target.removeEventListener('blur', clear);
      target.document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('mousemove', mouse);
      canvas.removeEventListener('mousedown', click);
      canvas.removeEventListener('contextmenu', contextMenu);
    },
  };
}
