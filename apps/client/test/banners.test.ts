import { expect, it } from 'vitest';
import { awardLines, bannerFor } from '../src/ui/results';

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

it('formats all three awards', () => {
  expect(awardLines({ mvp: 1, sharpshooter: 2, mostFalls: 3 }, new Map([[1, 'An'], [2, 'Bình'], [3, 'Chi']]))).toEqual([
    'MVP: An', 'Thánh Ném: Bình', 'Vua Tõm: Chi',
  ]);
});
