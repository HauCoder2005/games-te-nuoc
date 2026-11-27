import { VIEW_H, VIEW_W } from './config';
import type { InputFrame } from './sim/types';

export const MSG = {
  input: 'in', ready: 'ready', team: 'team', settings: 'settings', shuffle: 'shuffle',
  start: 'start', events: 'ev', error: 'err',
} as const;

export type ErrorCode = 'not_found' | 'full' | 'version_mismatch' | 'rate_limited' | 'not_host' | 'bad_request';

export const ERROR_TEXT: Record<ErrorCode, string> = {
  not_found: 'Không tìm thấy phòng',
  full: 'Phòng đầy',
  version_mismatch: 'Phiên bản khác nhau — tải lại trang (F5)',
  rate_limited: 'Thao tác quá nhanh',
  not_host: 'Chỉ chủ phòng được làm việc này',
  bad_request: 'Yêu cầu không hợp lệ',
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function counter(value: unknown): value is number {
  return finite(value) && Number.isSafeInteger(value) && value >= 0;
}

export function validateInput(raw: unknown, prev: InputFrame | null): InputFrame | null {
  if (!record(raw)) return null;
  const { s, mx, my, ax, ay, th, da } = raw;
  if (!counter(s) || !finite(mx) || !finite(my) || !finite(ax) || !finite(ay) || !counter(th) || !counter(da)) return null;
  if (ax < 0 || ax > VIEW_W || ay < 0 || ay > VIEW_H) return null;
  if (prev && (s <= prev.seq || th < prev.th || da < prev.da)) return null;
  let moveX = Math.max(-1, Math.min(1, mx));
  let moveY = Math.max(-1, Math.min(1, my));
  const length = Math.hypot(moveX, moveY);
  if (length > 1) { moveX /= length; moveY /= length; }
  return { seq: s, mx: moveX, my: moveY, ax, ay, th, da };
}
