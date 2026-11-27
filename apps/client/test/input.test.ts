// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { createInput, joystickVector } from '../src/input/keyboardMouse';
import { fitGameViewport } from '../src/render/renderer';
import { isTouchOnly } from '../src/ui/home';

const sources: { destroy(): void }[] = [];
afterEach(() => { for (const source of sources.splice(0)) source.destroy(); });

function setup() {
  const canvas = document.createElement('canvas');
  document.body.append(canvas);
  const source = createInput(window, canvas, (x, y) => ({ x, y }));
  sources.push(source);
  return { canvas, source };
}

it('blur releases held movement keys', () => {
  const { source } = setup();
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
  expect(source.sample().mx).toBe(1);
  window.dispatchEvent(new Event('blur'));
  expect(source.sample().mx).toBe(0);
});
it('visibility change releases held keys', () => {
  const { source } = setup();
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  document.dispatchEvent(new Event('visibilitychange'));
  expect(source.sample().my).toBe(0);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
});
it('each mouse press increments throw counter', () => {
  const { canvas, source } = setup();
  canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
  canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
  expect(source.sample().th).toBe(2);
});
it('space increments dash once per key press', () => {
  const { source } = setup();
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', repeat: true }));
  expect(source.sample().da).toBe(1);
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
  expect(source.sample().da).toBe(2);
});
it('touch-only devices are detected', () => {
  expect(isTouchOnly({ maxTouchPoints: 5 }, () => false)).toBe(true);
  expect(isTouchOnly({ maxTouchPoints: 0 }, () => true)).toBe(false);
});
it('joystick has a dead zone and proportional travel', () => {
  expect(joystickVector(2, 0, 40)).toEqual({ mx: 0, my: 0, knobX: 0, knobY: 0 });
  expect(joystickVector(20, 0, 40).mx).toBeCloseTo(0.5);
  expect(joystickVector(80, 0, 40).mx).toBe(1);
});
it('game viewport keeps the 16:9 map inside a landscape phone', () => {
  const fit = fitGameViewport(844, 390);
  expect(fit.width / fit.height).toBeCloseTo(640 / 360, 2);
  expect(fit.width).toBeLessThanOrEqual(844);
  expect(fit.height).toBeLessThanOrEqual(390);
});
it('creates mobile touch action buttons on touch devices and increments throw/dash', () => {
  const wrapper = document.createElement('div');
  const canvas = document.createElement('canvas');
  wrapper.append(canvas);
  document.body.append(wrapper);
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 });
  const source = createInput(window, canvas, (x, y) => ({ x, y }), () => ({ x: 320, y: 199 }));
  sources.push(source);

  const throwBtn = wrapper.querySelector<HTMLButtonElement>('.touch-btn-throw');
  const dashBtn = wrapper.querySelector<HTMLButtonElement>('.touch-btn-dash');
  expect(throwBtn).not.toBeNull();
  expect(dashBtn).not.toBeNull();
  // Buttons use SVG icons (dual swords & lightning bolt) instead of text
  expect(throwBtn?.querySelector('svg')).not.toBeNull();
  expect(dashBtn?.querySelector('svg')).not.toBeNull();
  expect(throwBtn?.textContent).toBe('');
  expect(dashBtn?.textContent).toBe('');

  throwBtn?.click();
  dashBtn?.click();
  const sample = source.sample();
  expect(sample.th).toBe(1);
  expect(sample.da).toBe(1);
  const touch = new Event('touchstart', { bubbles: true, cancelable: true });
  throwBtn?.dispatchEvent(touch);
  throwBtn?.click();
  expect(source.sample().th).toBe(2);
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 0 });
});
