// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { CHARACTER_VARIANTS } from '@te-nuoc/shared';
import { showHome } from '../src/ui/home';
import { addWinStar, getActiveAccount, getPlayerStars, getRankTier } from '../src/ui/rank';

describe('home screen boxes, right leaderboard, login & register forms, and pixel buttons', () => {
  it('places leaderboard in a separate right panel with clean pixel buttons and no button SVG icons', () => {
    localStorage.clear();
    document.cookie = 'aqua_blast_session=; path=/; max-age=0';
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

    const pixelButtons = mainPanel?.querySelectorAll('button.pixel-btn') ?? [];
    expect(pixelButtons.length).toBeGreaterThanOrEqual(5);
    for (const btn of pixelButtons) {
      expect(btn.querySelector('svg')).toBeNull();
    }
  });

  it('switches to dedicated registration form (username, gameName, password, confirmPassword) and persists login in localStorage and cookie', () => {
    localStorage.clear();
    document.cookie = 'aqua_blast_session=; path=/; max-age=0';
    const root = document.createElement('div');
    showHome(root);

    const cards = root.querySelectorAll<HTMLButtonElement>('.char-card');
    expect(cards).toHaveLength(CHARACTER_VARIANTS.length);
    cards[2].click();
    expect(localStorage.getItem('te-nuoc-variant')).toBe('2');

    // Click "ĐĂNG KÝ" tab
    const tabButtons = root.querySelectorAll<HTMLButtonElement>('.auth-tabs button');
    expect(tabButtons).toHaveLength(2);
    tabButtons[1].click();

    const regForm = root.querySelector('.auth-form-register');
    expect(regForm).not.toBeNull();

    const inputs = regForm!.querySelectorAll<HTMLInputElement>('input');
    expect(inputs).toHaveLength(4);
    const [usernameInput, gameNameInput, passInput, confirmInput] = inputs;

    usernameInput.value = 'teovip01';
    gameNameInput.value = 'Tèo Siêu Cấp';
    passInput.value = 'pass123';
    confirmInput.value = 'mismatch';

    const submitRegBtn = regForm!.querySelector<HTMLButtonElement>('.auth-submit-full')!;
    submitRegBtn.click();
    expect(root.querySelector('.error')?.textContent).toContain('không khớp');
    expect(getActiveAccount()).toBeNull();

    confirmInput.value = 'pass123';
    submitRegBtn.click();

    expect(getActiveAccount()?.username).toBe('teovip01');
    expect(getActiveAccount()?.gameName).toBe('Tèo Siêu Cấp');
    expect(document.cookie).toContain('aqua_blast_session=teovip01');
    expect(root.querySelector('.auth-logged-card')).not.toBeNull();
    expect(root.querySelector('.auth-username-tag')?.textContent).toBe('@teovip01');

    const root2 = document.createElement('div');
    showHome(root2);
    expect(root2.querySelector('.auth-logged-card')).not.toBeNull();
    expect(root2.querySelector('.auth-username-tag')?.textContent).toBe('@teovip01');

    expect(getPlayerStars()).toBe(0);
    const afterWin = addWinStar();
    expect(afterWin.stars).toBe(1);
    expect(getActiveAccount()?.stars).toBe(1);
    expect(getRankTier(3).name).toBe('BẠC');
  });
});
