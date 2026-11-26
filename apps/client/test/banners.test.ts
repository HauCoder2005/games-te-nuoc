// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { awardLines, bannerFor, showResults } from '../src/ui/results';

it('shows exact match point, golden, final minute and streak banners', () => {
  expect(bannerFor({ k: 'matchPoint', teams: [1] }, [8, 9], 10)).toBe('ĐIỂM QUYẾT ĐỊNH — ĐỘI XANH!');
  expect(bannerFor({ k: 'matchPoint', teams: [0] }, [9, 8], 10)).toBe('ĐIỂM QUYẾT ĐỊNH — ĐỘI ĐỎ!');
  expect(bannerFor({ k: 'matchPoint', teams: [0, 1] }, [9, 9], 10)).toBe('9 – 9! AI GHI TIẾP SẼ THẮNG!');
  expect(bannerFor({ k: 'matchPoint', teams: [0, 1] }, [14, 14], 15)).toBe('14 – 14! AI GHI TIẾP SẼ THẮNG!');
  expect(bannerFor({ k: 'golden' }, [9, 9], 10)).toBe('BÀN THẮNG VÀNG!');
  expect(bannerFor({ k: 'lastMinute' }, [8, 8], 10)).toBe('PHÚT CUỐI — BÈ CO LẠI!');
  expect(bannerFor({ k: 'streak', slot: 2, n: 3 }, [0, 0], 10, new Map([[2, 'Tí']]))).toBe('Tí đang nóng tay! 🔥');
  expect(bannerFor({ k: 'streak', slot: 2, n: 5 }, [0, 0], 10, new Map([[2, 'Tí']]))).toBe('Tí KHÔNG THỂ CẢN!');
});

it('formats all three awards and renders Top 1-2-3 trophy podium with medal icons', () => {
  const names = new Map([[1, 'An'], [2, 'Bình'], [3, 'Chi']]);
  expect(awardLines({ mvp: 1, sharpshooter: 2, mostFalls: 3 }, names)).toEqual([
    'MVP: An', 'Thánh Ném: Bình', 'Vua Tõm: Chi',
  ]);

  const root = document.createElement('div');
  showResults(root, 1, [2, 10], { mvp: 1, sharpshooter: 2, mostFalls: 3 }, names);
  expect(root.querySelectorAll('.podium-card')).toHaveLength(3);
  expect(root.querySelectorAll('.trophy-svg')).toHaveLength(3);
  expect(root.querySelector('.podium-rank-1 .podium-player')?.textContent).toBe('An');
  expect(root.querySelector('.podium-rank-2 .podium-player')?.textContent).toBe('Bình');
  expect(root.querySelector('.podium-rank-3 .podium-player')?.textContent).toBe('Chi');
});
