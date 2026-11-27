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

  it('shows radar loading screen when searching alone, then confirmation screen when enough players join', () => {
    const dom = new JSDOM('<main id="app"></main>');
    vi.stubGlobal('document', dom.window.document);
    const root = dom.window.document.getElementById('app')!;
    const send = vi.fn();
    const onLeave = vi.fn();

    // 1 player alone (countdown 0) -> Shows Radar Searching Loading screen
    renderMatchmaking(root, {
      sessionId: 'a', send,
      state: { lobby: { countdown: 0, players: new Map([['a', {
        sessionId: 'a', slot: 0, name: '<img src=x onerror=alert(1)>', team: 0,
        variant: 0, isBot: false, ready: false, connected: true,
      }]]) } },
    }, onLeave);
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('.mm-loading-screen')).not.toBeNull();
    expect(root.querySelector('.mm-radar')).not.toBeNull();
    expect(root.textContent).toContain('ĐANG GHÉP TRẬN');

    // 2nd player joins -> Transitions to Match Found confirmation board with XÁC NHẬN button
    renderMatchmaking(root, {
      sessionId: 'a', send,
      state: { lobby: { countdown: 20, players: new Map([
        ['a', {
          sessionId: 'a', slot: 0, name: '<img src=x onerror=alert(1)>', team: 0,
          variant: 0, isBot: false, ready: false, connected: true,
        }],
        ['b', {
          sessionId: 'b', slot: 1, name: 'Đối Thủ', team: 1,
          variant: 1, isBot: false, ready: false, connected: true,
        }],
      ]) } },
    }, onLeave);
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('.lq-arena-found')).not.toBeNull();
    expect(root.textContent).toContain('Trận bắt đầu sau 20 giây');
    root.querySelector<HTMLButtonElement>('.lq-confirm-btn')?.click();
    expect(send).toHaveBeenCalledWith('ready', { on: true });
    vi.unstubAllGlobals();
  });
});
