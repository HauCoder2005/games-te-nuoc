// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { CHARACTER_VARIANTS } from '@te-nuoc/shared';
import { showHome } from '../src/ui/home';
import { addWinStar, getPlayerStars, getRankTier } from '../src/ui/rank';

describe('home screen boxes, character selection, and rank leaderboard', () => {
  it('separates name input and room code into two distinct boxes and renders leaderboard', () => {
    const root = document.createElement('div');
    location.hash = '#/r/khvt';
    showHome(root);

    expect(root.querySelector('h1')?.textContent).toBe('Aqua Blast');
    const nameBox = root.querySelector('.home-box-name');
    const roomBox = root.querySelector('.home-box-room');
    const lbBox = root.querySelector('.home-box-leaderboard');
    expect(nameBox).not.toBeNull();
    expect(roomBox).not.toBeNull();
    expect(lbBox).not.toBeNull();
    expect(nameBox).not.toBe(roomBox);
    expect(lbBox?.querySelectorAll('.lb-row').length).toBeGreaterThanOrEqual(5);

    const nameInput = nameBox?.querySelector('input') as HTMLInputElement | null;
    const roomInput = roomBox?.querySelector('input') as HTMLInputElement | null;
    expect(nameInput).not.toBeNull();
    expect(roomInput).not.toBeNull();
    expect(roomInput?.value).toBe('KHVT');
  });

  it('allows selecting distinct male/female characters and increments rank star on win', () => {
    localStorage.removeItem('te-nuoc-variant');
    localStorage.removeItem('aqua-blast-stars');
    localStorage.removeItem('aqua-blast-wins');
    const root = document.createElement('div');
    showHome(root);

    const cards = root.querySelectorAll<HTMLButtonElement>('.char-card');
    expect(cards).toHaveLength(CHARACTER_VARIANTS.length);
    cards[2].click();
    expect(localStorage.getItem('te-nuoc-variant')).toBe('2');

    expect(getPlayerStars()).toBe(0);
    const afterWin = addWinStar();
    expect(afterWin.stars).toBe(1);
    expect(getRankTier(3).name).toBe('Bạc Đoàn');
  });
});
