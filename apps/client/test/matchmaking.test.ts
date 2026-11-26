import { describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { countdownText, renderMatchmaking, waitingText } from '../src/ui/matchmaking';
import { showError } from '../src/ui/errors';

describe('public waiting room', () => {
  it('formats human count and countdown in Vietnamese', () => {
    expect(waitingText(6)).toBe('Đang tìm người chơi… 6/10');
    expect(countdownText(20)).toBe('Trận bắt đầu sau 20 giây');
    expect(showError('full')).toBe('Phòng đầy');
  });

  it('renders names as text and sends ready toggles', () => {
    const dom = new JSDOM('<main id="app"></main>');
    vi.stubGlobal('document', dom.window.document);
    const root = dom.window.document.getElementById('app')!;
    const send = vi.fn();
    renderMatchmaking(root, {
      sessionId: 'a', send,
      state: { lobby: { countdown: 20, players: new Map([['a', {
        sessionId: 'a', slot: 0, name: '<img src=x onerror=alert(1)>', team: 0,
        variant: 0, isBot: false, ready: false, connected: true,
      }]]) } },
    }, () => {});
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toContain('Trận bắt đầu sau 20 giây');
    root.querySelector('button')?.click();
    expect(send).toHaveBeenCalledWith('ready', { on: true });
    vi.unstubAllGlobals();
  });
});
