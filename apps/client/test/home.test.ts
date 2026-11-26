// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { CHARACTER_VARIANTS } from '@te-nuoc/shared';
import { showHome } from '../src/ui/home';

describe('home screen boxes and character selection', () => {
  it('separates name input and room code into two distinct boxes', () => {
    const root = document.createElement('div');
    location.hash = '#/r/khvt';
    showHome(root);

    const nameBox = root.querySelector('.home-box-name');
    const roomBox = root.querySelector('.home-box-room');
    expect(nameBox).not.toBeNull();
    expect(roomBox).not.toBeNull();
    expect(nameBox).not.toBe(roomBox);

    const nameInput = nameBox?.querySelector('input') as HTMLInputElement | null;
    const roomInput = roomBox?.querySelector('input') as HTMLInputElement | null;
    expect(nameInput).not.toBeNull();
    expect(roomInput).not.toBeNull();
    expect(roomInput?.value).toBe('KHVT');
  });

  it('allows selecting a character variant with face and hair details', () => {
    localStorage.removeItem('te-nuoc-variant');
    const root = document.createElement('div');
    showHome(root);

    const cards = root.querySelectorAll<HTMLButtonElement>('.char-card');
    expect(cards).toHaveLength(CHARACTER_VARIANTS.length);
    expect(cards[0].classList.contains('selected')).toBe(true);

    cards[3].click();
    expect(cards[3].classList.contains('selected')).toBe(true);
    expect(cards[0].classList.contains('selected')).toBe(false);
    expect(localStorage.getItem('te-nuoc-variant')).toBe('3');
    expect(root.querySelector('.char-detail')?.textContent).toBe(CHARACTER_VARIANTS[3].detail);
  });
});
