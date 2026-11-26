import { expect, it } from 'vitest';
import { botName, dedupeName, normalizeName, normalizeRoomCode } from '../src/names';

it('blank names are rejected, spaces collapsed, and HTML remains plain text', () => {
  expect(normalizeName('   ')).toBeNull();
  expect(normalizeName('  Nguyễn   Văn\tTèo  ')).toBe('Nguyễn Văn T');
  expect(normalizeName('<b>x</b>')).toBe('<b>x</b>');
});
it('truncates by code point and removes control characters', () => {
  expect(Array.from(normalizeName('😀'.repeat(20)) ?? '')).toHaveLength(12);
  expect(normalizeName('A\u0000B\u0007C')).toBe('ABC');
});
it('deduplicates while retaining the 12 character limit', () => {
  expect(dedupeName('Tèo', ['Tèo', 'Tèo 2'])).toBe('Tèo 3');
  expect(dedupeName('123456789012', ['123456789012'])).toBe('1234567890 2');
});
it('bot names skip names already taken and include suffix', () => {
  expect(botName(['Tèo'])).toBe('Tí (bot)');
  expect(botName([])).toBe('Tèo (bot)');
});
it('normalizes codes with arbitrary spaces and case', () => {
  expect(normalizeRoomCode(' k h v t ')).toBe('KHVT');
  expect(normalizeRoomCode('khvt')).toBe('KHVT');
  expect(normalizeRoomCode('k\n h\tvt')).toBe('KHVT');
});
