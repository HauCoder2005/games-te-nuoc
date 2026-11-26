// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { showHome } from '../src/ui/home';

describe('home screen boxes', () => {
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
});
