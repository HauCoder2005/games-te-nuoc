import { BALLOON_RANGE_MAX, JOYSTICK_DEADZONE_PX, VIEW_H, VIEW_W } from '@te-nuoc/shared';
import type { InputFrame } from '@te-nuoc/shared';
import { createDashBoltIcon, createDualSwordsIcon } from '../ui/fullscreen';

export interface InputSource { sample(): InputFrame; destroy(): void }

export function joystickVector(dx: number, dy: number, radius: number): { mx: number; my: number; knobX: number; knobY: number } {
  const distance = Math.hypot(dx, dy);
  if (distance <= JOYSTICK_DEADZONE_PX) return { mx: 0, my: 0, knobX: 0, knobY: 0 };
  const travel = Math.min(radius, distance);
  const factor = travel / distance;
  return { mx: dx * factor / radius, my: dy * factor / radius, knobX: dx * factor, knobY: dy * factor };
}

export function createInput(
  target: Window,
  canvas: HTMLCanvasElement,
  toWorld: (cx: number, cy: number) => { x: number; y: number },
  getOwnPos?: () => { x: number; y: number } | null,
): InputSource {
  const held = new Set<string>();
  let seq = 0; let th = 0; let da = 0;
  let aim = { x: 320, y: 199 };
  let touchMove = { mx: 0, my: 0 };
  let joyAimDir: { dx: number; dy: number } | null = null;
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
    joyTouchId = null;
    joyKnob?.style.setProperty('transform', 'translate(0px, 0px)');
  };
  const visibility = () => { if (target.document.hidden) clear(); };
  const mouse = (event: MouseEvent) => {
    joyAimDir = null;
    aim = toWorld(event.clientX, event.clientY);
  };
  const click = (event: MouseEvent) => {
    mouse(event);
    if (event.button === 0) th++;
    if (event.button === 2) da++;
  };
  const contextMenu = (event: MouseEvent) => event.preventDefault();

  // Mobile Touch Controls (Circular Virtual Joystick left + Circular Icon Buttons right)
  let touchUi: HTMLDivElement | null = null;
  let joyTouchId: number | null = null;
  let joyOrigin = { x: 0, y: 0 };

  const isTouchDevice = (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
    || 'ontouchstart' in target;

  const parent = canvas.parentElement;
  let joyKnob: HTMLDivElement | null = null;

  const updateAimFromDir = (dx: number, dy: number) => {
    const own = getOwnPos?.();
    const ox = own?.x ?? 320;
    const oy = own?.y ?? 199;
    aim = {
      x: Math.max(0, Math.min(VIEW_W, ox + dx * (BALLOON_RANGE_MAX * 0.75))),
      y: Math.max(0, Math.min(VIEW_H, oy + dy * (BALLOON_RANGE_MAX * 0.75))),
    };
  };

  const onCanvasTouchStart = (event: TouchEvent) => {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const t = event.changedTouches[i];
      const bounds = canvas.getBoundingClientRect();
      const relX = t.clientX - bounds.left;
      if (relX >= bounds.width * 0.42) {
        event.preventDefault();
        joyAimDir = null;
        aim = toWorld(t.clientX, t.clientY);
        th++;
      }
    }
  };

  const onCanvasTouchMove = (event: TouchEvent) => {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const t = event.changedTouches[i];
      if (t.identifier === joyTouchId) continue;
      joyAimDir = null;
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
      const radius = Math.max(1, (joyBase.getBoundingClientRect().width - (joyKnob?.getBoundingClientRect().width ?? 0)) / 2);
      const vector = joystickVector(dx, dy, radius);
      touchMove = { mx: vector.mx, my: vector.my };
      if (dist > JOYSTICK_DEADZONE_PX) {
        joyAimDir = { dx: dx / dist, dy: dy / dist };
        updateAimFromDir(joyAimDir.dx, joyAimDir.dy);
      }
      if (joyKnob) {
        joyKnob.style.transform = `translate(${Math.round(vector.knobX)}px, ${Math.round(vector.knobY)}px)`;
      }
    };

    joyZone.addEventListener('touchstart', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (joyTouchId !== null) return;
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

    // Throw button: Circular with Dual Swords icon (no text)
    const throwBtn = target.document.createElement('button');
    throwBtn.type = 'button';
    throwBtn.className = 'touch-btn touch-btn-throw';
    throwBtn.setAttribute('aria-label', 'Ném bóng nước');
    throwBtn.append(createDualSwordsIcon());
    let lastThrowTouch = -Infinity;
    throwBtn.addEventListener('touchstart', (event) => {
      event.preventDefault();
      event.stopPropagation();
      lastThrowTouch = performance.now();
      if (joyAimDir) updateAimFromDir(joyAimDir.dx, joyAimDir.dy);
      th++;
    }, { passive: false });
    throwBtn.addEventListener('click', (event) => {
      event.preventDefault();
      if (performance.now() - lastThrowTouch < 500) return;
      if (joyAimDir) updateAimFromDir(joyAimDir.dx, joyAimDir.dy);
      th++;
    });

    // Dash button: Circular with Lightning Bolt Dash icon (no text)
    const dashBtn = target.document.createElement('button');
    dashBtn.type = 'button';
    dashBtn.className = 'touch-btn touch-btn-dash';
    dashBtn.setAttribute('aria-label', 'Húc tốc biến');
    dashBtn.append(createDashBoltIcon());
    let lastDashTouch = -Infinity;
    dashBtn.addEventListener('touchstart', (event) => {
      event.preventDefault();
      event.stopPropagation();
      lastDashTouch = performance.now();
      if (joyAimDir) updateAimFromDir(joyAimDir.dx, joyAimDir.dy);
      da++;
    }, { passive: false });
    dashBtn.addEventListener('click', (event) => {
      event.preventDefault();
      if (performance.now() - lastDashTouch < 500) return;
      if (joyAimDir) updateAimFromDir(joyAimDir.dx, joyAimDir.dy);
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
      const normMx = length > 1 ? mx / length : mx;
      const normMy = length > 1 ? my / length : my;
      if (joyAimDir) {
        updateAimFromDir(joyAimDir.dx, joyAimDir.dy);
      } else if (normMx !== 0 || normMy !== 0) {
        // Also update aim direction if moving on touch without an explicit mouse aim
        if (isTouchDevice) updateAimFromDir(normMx, normMy);
      }
      return { seq, mx: normMx, my: normMy, ax: aim.x, ay: aim.y, th, da };
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
