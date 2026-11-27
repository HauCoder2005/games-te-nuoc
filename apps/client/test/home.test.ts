// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { CHARACTER_VARIANTS } from '@te-nuoc/shared';
import { showHome } from '../src/ui/home';
import { addWinStar, getActiveAccount, getPlayerStars, getRankTier, registerOrLoginAccount } from '../src/ui/rank';

describe('home screen boxes, left leaderboard, quick auth, and Lucide button icons', () => {
  it('places leaderboard in a separate right panel and adds Lucide SVG icons to buttons', () => {
    const root = document.createElement('div');
    location.hash = '#/r/khvt';
    showHome(root);

    expect(root.querySelector('h1')?.textContent).toBe('Aqua Blast');
    const layout = root.querySelector('.home-layout');
    const lbPanel = root.querySelector('aside.home-leaderboard-panel');
    const mainPanel = root.querySelector('main.home');
    expect(layout).not.toBeNull();
    expect(lbPanel).not.toBeNull();
    expect(mainPanel).not.toBeNull();
    expect(layout?.firstElementChild).toBe(mainPanel);
    expect(layout?.lastElementChild).toBe(lbPanel);

    const nameBox = mainPanel?.querySelector('.home-box-name');
    const roomBox = mainPanel?.querySelector('.home-box-room');
    expect(nameBox).not.toBeNull();
    expect(roomBox).not.toBeNull();
    expect(lbPanel?.querySelectorAll('.lb-row').length).toBeGreaterThanOrEqual(5);

    const roomInput = roomBox?.querySelector('input') as HTMLInputElement | null;
    expect(roomInput?.value).toBe('KHVT');

    // All action buttons have Lucide SVG icons
    const iconButtons = mainPanel?.querySelectorAll('button.icon-btn') ?? [];
    expect(iconButtons.length).toBeGreaterThanOrEqual(5);
    for (const btn of iconButtons) {
      expect(btn.querySelector('svg.btn-icon')).not.toBeNull();
    }
  });

  it('supports quick username/password registration and saves rank stars to leaderboard', () => {
    localStorage.clear();
    const root = document.createElement('div');
    showHome(root);

    const cards = root.querySelectorAll<HTMLButtonElement>('.char-card');
    expect(cards).toHaveLength(CHARACTER_VARIANTS.length);
    cards[2].click();
    expect(localStorage.getItem('te-nuoc-variant')).toBe('2');

    const reg = registerOrLoginAccount('TèoVip', 'pass123', 2);
    expect(reg.ok).toBe(true);
    expect(getActiveAccount()?.username).toBe('TèoVip');

    const wrong = registerOrLoginAccount('TèoVip', 'wrong', 2);
    expect(wrong.ok).toBe(false);

    expect(getPlayerStars()).toBe(0);
    const afterWin = addWinStar();
    expect(afterWin.stars).toBe(1);
    expect(getActiveAccount()?.stars).toBe(1);
    expect(getRankTier(3).name).toBe('Bạc Đoàn');
  });
});
