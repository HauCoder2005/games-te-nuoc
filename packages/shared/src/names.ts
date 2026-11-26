import { MAX_NAME_LENGTH } from './config';

const BOT_NAMES = ['Tèo', 'Tí', 'Bin', 'Su', 'Na', 'Mập', 'Khoa', 'Hưng', 'Mai', 'Vy'] as const;

export function normalizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const clean = raw.replace(/\s/gu, ' ').replace(/[\p{Cc}\p{Cf}]/gu, '').trim().replace(/ +/gu, ' ');
  const name = Array.from(clean).slice(0, MAX_NAME_LENGTH).join('').trim();
  return name || null;
}

export function dedupeName(name: string, taken: string[]): string {
  if (!taken.includes(name)) return name;
  let number = 2;
  while (true) {
    const suffix = ` ${number}`;
    const candidate = Array.from(name).slice(0, MAX_NAME_LENGTH - suffix.length).join('').trimEnd() + suffix;
    if (!taken.includes(candidate)) return candidate;
    number++;
  }
}

export function botName(taken: string[]): string {
  for (const base of BOT_NAMES) {
    if (!taken.includes(base) && !taken.includes(`${base} (bot)`)) return `${base} (bot)`;
  }
  return dedupeName('Tèo (bot)', taken);
}

export function normalizeRoomCode(raw: string): string {
  return raw.replace(/\s+/gu, '').toUpperCase();
}
