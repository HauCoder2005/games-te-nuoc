import { describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { renderMatchmaking, waitingText } from '../src/ui/matchmaking';
import { showError } from '../src/ui/errors';

describe('public waiting room', () => {
  it('formats human count in Vietnamese', () => {
    expect(waitingText(6)).toBe('Đang tìm người chơi… 6/10');
    expect(showError('full')).toBe('Phòng đầy');
  });

  it('keeps the spinning radar until ten people and never shows bots or a ready button', () => {
    const dom = new JSDOM('<main id="app"></main>');
    vi.stubGlobal('document', dom.window.document);
    const root = dom.window.document.getElementById('app')!;
    const onLeave = vi.fn();

    // 1 player alone (countdown 0) -> Shows Radar Searching Loading screen
    renderMatchmaking(root, {
      sessionId: 'a',
      state: { lobby: { countdown: 0, players: new Map([['a', {
        sessionId: 'a', slot: 0, name: '<img src=x onerror=alert(1)>', team: 0,
        variant: 0, isBot: false, ready: false, connected: true,
      }]]) } },
    }, onLeave);
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('.mm-loading-screen')).not.toBeNull();
    expect(root.querySelector('.mm-radar')).not.toBeNull();
    expect(root.textContent).toContain('ĐANG GHÉP TRẬN');

    // A second player keeps the room searching for eight more humans.
    renderMatchmaking(root, {
      sessionId: 'a',
      state: { lobby: { countdown: 0, players: new Map([
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
    expect(root.querySelector('.mm-loading-screen')).not.toBeNull();
    expect(root.textContent).toContain('2/10');
    expect(root.querySelectorAll('.lq-slot')).toHaveLength(10);
    expect(root.textContent).not.toContain('BOT');
    expect(root.querySelector('.lq-confirm-btn')).toBeNull();
    vi.unstubAllGlobals();
  });
});
