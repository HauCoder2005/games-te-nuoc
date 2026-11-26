// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { createInput } from '../src/input/keyboardMouse';
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
