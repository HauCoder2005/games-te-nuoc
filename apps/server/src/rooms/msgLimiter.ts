import { MAX_MSGS_PER_SEC, MSG_WINDOW_MS } from '@te-nuoc/shared';

interface WindowCount { start: number; count: number }

export class MsgLimiter {
  private readonly windows = new Map<string, WindowCount>();

  allow(sessionId: string, nowMs: number): boolean {
    const current = this.windows.get(sessionId);
    if (!current || nowMs < current.start || nowMs - current.start >= MSG_WINDOW_MS) {
      this.windows.set(sessionId, { start: nowMs, count: 1 });
      return true;
    }
    if (current.count >= MAX_MSGS_PER_SEC) return false;
    current.count++;
    return true;
  }

  remove(sessionId: string): void { this.windows.delete(sessionId); }
}
