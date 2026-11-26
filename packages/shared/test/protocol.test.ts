import { expect, it } from 'vitest';
import { validateInput } from '../src/protocol';
import type { InputFrame } from '../src/sim/types';

const raw = (over: Record<string, unknown> = {}): Record<string, unknown> => ({ s: 1, mx: 0, my: 0, ax: 320, ay: 199, th: 0, da: 0, ...over });
const prev = (over: Partial<InputFrame> = {}): InputFrame => ({ seq: 0, mx: 0, my: 0, ax: 320, ay: 199, th: 0, da: 0, ...over });

it('rejects NaN, strings, missing fields and wrong container types', () => {
  expect(validateInput(raw({ mx: NaN }), null)).toBeNull();
  expect(validateInput(raw({ s: '1' }), null)).toBeNull();
  expect(validateInput({ s: 1 }, null)).toBeNull();
  expect(validateInput([], null)).toBeNull();
  expect(validateInput(null, null)).toBeNull();
});
it('clamps and normalizes direction', () => {
  const frame = validateInput(raw({ mx: 5, my: 5 }), null);
  expect(frame).toMatchObject({ seq: 1, mx: expect.closeTo(Math.SQRT1_2), my: expect.closeTo(Math.SQRT1_2) });
});
it('rejects invalid aim and noninteger counters', () => {
  expect(validateInput(raw({ ax: 641 }), null)).toBeNull();
  expect(validateInput(raw({ ay: -1 }), null)).toBeNull();
  expect(validateInput(raw({ th: 0.5 }), null)).toBeNull();
  expect(validateInput(raw({ da: -1 }), null)).toBeNull();
});
it('counters cannot decrease and sequence must increase', () => {
  expect(validateInput(raw({ th: 2 }), prev({ th: 5 }))).toBeNull();
  expect(validateInput(raw({ da: 2 }), prev({ da: 5 }))).toBeNull();
  expect(validateInput(raw({ s: 3 }), prev({ seq: 3 }))).toBeNull();
  expect(validateInput(raw({ s: 4, th: 5, da: 5 }), prev({ seq: 3, th: 5, da: 5 }))).toMatchObject({ seq: 4, th: 5, da: 5 });
});
