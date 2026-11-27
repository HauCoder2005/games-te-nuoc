import { expect, it } from 'vitest';
import { integerScale } from '../src/render/renderer';
import { nameTagSide, visibleNameTags, wetTint } from '../src/render/overlay';

it('integerScale uses largest whole multiplier that fits', () => {
  expect(integerScale(1920, 1080)).toBe(3);
  expect(integerScale(1366, 768)).toBe(2);
  expect(integerScale(500, 300)).toBe(1);
});
it('name tags appear for teammates only', () => {
  const players = [{ slot: 0, team: 0 as const }, { slot: 1, team: 1 as const }, { slot: 2, team: 0 as const }];
  expect(visibleNameTags(players, 0)).toEqual([0, 2]);
  expect(visibleNameTags(players, null)).toEqual([0, 1, 2]);
});
it('own name stays beside the character and flips inside the right edge', () => {
  expect(nameTagSide(100, 40, 640, 11)).toEqual({ x: 111, align: 'left' });
  expect(nameTagSide(620, 40, 640, 11)).toEqual({ x: 609, align: 'right' });
});
it('wet tint caps at 40 percent', () => {
  expect(wetTint(0)).toBe(0);
  expect(wetTint(75)).toBeCloseTo(0.2);
  expect(wetTint(999)).toBe(0.4);
});
