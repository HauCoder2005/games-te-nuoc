import { expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AccountStore } from '../src/accountStore.js';

it('persists real leaderboard entries and returns current ranking after a win', () => {
  const dir = mkdtempSync(join(tmpdir(), 'te-nuoc-rank-'));
  try {
    const path = join(dir, 'accounts.json');
    const store = new AccountStore(path);
    store.set({ username: 'A', gameName: 'An', password: 'pw1', stars: 0, wins: 0, variant: 0 });
    store.set({ username: 'B', gameName: 'Bình', password: 'pw2', stars: 2, wins: 2, variant: 1 });
    store.win('a');
    expect(new AccountStore(path).leaderboard()).toEqual([
      expect.objectContaining({ username: 'B', stars: 2 }),
      expect.objectContaining({ username: 'A', stars: 1 }),
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
