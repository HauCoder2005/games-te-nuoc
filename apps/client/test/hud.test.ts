import { expect, it } from 'vitest';
import { chipStatus, formatClock, killFeedLine } from '../src/ui/hud';
import { mkPlayer } from '../../../packages/shared/test/helpers';

it('formats clock with ceiling seconds', () => {
  expect(formatClock(151)).toBe('2:31');
  expect(formatClock(5.2)).toBe('0:06');
});
it('shows respawn, protection and wetness states', () => {
  expect(chipStatus(mkPlayer({ status: 'respawning', timer: 1.2 }))).toBe('HỒI 2');
  expect(chipStatus(mkPlayer({ status: 'protected' }))).toBe('BẢO VỆ');
  expect(chipStatus(mkPlayer({ wet: 14.4 }))).toBe('14%');
});
it('makes kill feed lines from fall events', () => {
  const names = new Map([[2, 'Bin'], [3, 'Su']]);
  expect(killFeedLine({ k: 'fall', slot: 3, by: 2 }, names)?.map((piece) => piece.text).join('')).toBe('Bin ném Su xuống nước!');
  expect(killFeedLine({ k: 'fall', slot: 3, by: null }, names)?.map((piece) => piece.text).join('')).toBe('Su tự nhảy xuống hồ!');
});
