import { ERROR_TEXT } from '@te-nuoc/shared';
import type { ErrorCode } from '@te-nuoc/shared';

export function showError(code: ErrorCode): string { return ERROR_TEXT[code]; }
export const CONNECTION_LOST_TEXT = 'Mất kết nối — đang thử lại…';
