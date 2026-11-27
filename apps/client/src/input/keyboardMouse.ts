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
  let touchMove = { mx: 0, my: 0 };
  const movement = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);

  const down = (event: KeyboardEvent) => {
    if (movement.has(event.code) || event.code === 'Space') event.preventDefault();
    if (event.code === 'Space' && !held.has('Space') && !event.repeat) da++;
    held.add(event.code);
  };
  const up = (event: KeyboardEvent) => { held.delete(event.code); };
  const clear = () => {
    held.clear();
    touchMove = { mx: 0, my: 0 };
  };
  const visibility = () => { if (target.document.hidden) clear(); };
  const mouse = (event: MouseEvent) => { aim = toWorld(event.clientX, event.clientY); };
  const click = (event: MouseEvent) => {
    mouse(event);
    if (event.button === 0) th++;
    if (event.button === 2) da++;
  };
  const contextMenu = (event: MouseEvent) => event.preventDefault();

  // Mobile Touch Controls (Virtual Joystick left + Aim/Throw pad & Dash button right)
  let touchUi: HTMLDivElement | null = null;
  let joyTouchId: number | null = null;
  let joyOrigin = { x: 0, y: 0 };
  const JOY_MAX_R = 42;

  const isTouchDevice = (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
    || 'ontouchstart' in target;

  const parent = canvas.parentElement;
  let joyKnob: HTMLDivElement | null = null;

  const onCanvasTouchStart = (event: TouchEvent) => {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const t = event.changedTouches[i];
      const bounds = canvas.getBoundingClientRect();
      const relX = t.clientX - bounds.left;
      if (relX >= bounds.width * 0.42) {
        event.preventDefault();
        aim = toWorld(t.clientX, t.clientY);
        th++;
      }
    }
  };

  const onCanvasTouchMove = (event: TouchEvent) => {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const t = event.changedTouches[i];
      if (t.identifier === joyTouchId) continue;
      aim = toWorld(t.clientX, t.clientY);
    }
  };

  if (isTouchDevice && parent) {
    touchUi = target.document.createElement('div');
    touchUi.className = 'mobile-touch-controls';

    const joyZone = target.document.createElement('div');
    joyZone.className = 'touch-joystick-zone';
    const joyBase = target.document.createElement('div');
    joyBase.className = 'touch-joystick-base';
    joyKnob = target.document.createElement('div');
    joyKnob.className = 'touch-joystick-knob';
    joyBase.append(joyKnob);
    joyZone.append(joyBase);

    const updateJoystick = (clientX: number, clientY: number) => {
      const dx = clientX - joyOrigin.x;
      const dy = clientY - joyOrigin.y;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(JOY_MAX_R, dist);
      const nx = dist > 4 ? dx / dist : 0;
      const ny = dist > 4 ? dy / dist : 0;
      touchMove = { mx: nx, my: ny };
      if (joyKnob) {
        joyKnob.style.transform = `translate(${Math.round(nx * clamped)}px, ${Math.round(ny * clamped)}px)`;
      }
    };

    joyZone.addEventListener('touchstart', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const t = event.changedTouches[0];
      if (!t) return;
      joyTouchId = t.identifier;
      const rect = joyBase.getBoundingClientRect();
      joyOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      updateJoystick(t.clientX, t.clientY);
    }, { passive: false });

    joyZone.addEventListener('touchmove', (event) => {
      event.preventDefault();
      event.stopPropagation();
      for (let i = 0; i < event.changedTouches.length; i++) {
        const t = event.changedTouches[i];
        if (t.identifier === joyTouchId) {
          updateJoystick(t.clientX, t.clientY);
        }
      }
    }, { passive: false });

    const resetJoystick = (event: TouchEvent) => {
      for (let i = 0; i < event.changedTouches.length; i++) {
        if (event.changedTouches[i].identifier === joyTouchId) {
          joyTouchId = null;
          touchMove = { mx: 0, my: 0 };
          if (joyKnob) joyKnob.style.transform = 'translate(0px, 0px)';
        }
      }
    };
    joyZone.addEventListener('touchend', resetJoystick);
    joyZone.addEventListener('touchcancel', resetJoystick);

    const actionButtons = target.document.createElement('div');
    actionButtons.className = 'touch-action-buttons';

    const throwBtn = target.document.createElement('button');
    throwBtn.type = 'button';
    throwBtn.className = 'touch-btn touch-btn-throw';
    throwBtn.textContent = 'NÉM';
    throwBtn.addEventListener('touchstart', (event) => {
      event.preventDefault();
      event.stopPropagation();
      th++;
    }, { passive: false });
    throwBtn.addEventListener('click', (event) => {
      event.preventDefault();
      th++;
    });

    const dashBtn = target.document.createElement('button');
    dashBtn.type = 'button';
    dashBtn.className = 'touch-btn touch-btn-dash';
    dashBtn.textContent = 'HÚC';
    dashBtn.addEventListener('touchstart', (event) => {
      event.preventDefault();
      event.stopPropagation();
      da++;
    }, { passive: false });
    dashBtn.addEventListener('click', (event) => {
      event.preventDefault();
      da++;
    });

    actionButtons.append(dashBtn, throwBtn);
    touchUi.append(joyZone, actionButtons);
    parent.append(touchUi);
  }

  target.addEventListener('keydown', down);
  target.addEventListener('keyup', up);
  target.addEventListener('blur', clear);
  target.document.addEventListener('visibilitychange', visibility);
  canvas.addEventListener('mousemove', mouse);
  canvas.addEventListener('mousedown', click);
  canvas.addEventListener('contextmenu', contextMenu);
  canvas.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onCanvasTouchMove, { passive: false });

  return {
    sample() {
      seq++;
      const kbMx = Number(held.has('KeyD') || held.has('ArrowRight')) - Number(held.has('KeyA') || held.has('ArrowLeft'));
      const kbMy = Number(held.has('KeyS') || held.has('ArrowDown')) - Number(held.has('KeyW') || held.has('ArrowUp'));
      const mx = kbMx !== 0 || kbMy !== 0 ? kbMx : touchMove.mx;
      const my = kbMx !== 0 || kbMy !== 0 ? kbMy : touchMove.my;
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
      canvas.removeEventListener('touchstart', onCanvasTouchStart);
      canvas.removeEventListener('touchmove', onCanvasTouchMove);
      touchUi?.remove();
    },
  };
}
