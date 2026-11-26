import { RATE_LIMIT_WINDOW_MS } from '@te-nuoc/shared';

export class RateLimiter {
  private readonly hits = new Map<string, number[]>();
  constructor(private readonly maxPerMin: number) {}

  hit(ip: string, nowMs: number): boolean {
    const recent = (this.hits.get(ip) ?? []).filter((time) => nowMs - time < RATE_LIMIT_WINDOW_MS && time <= nowMs);
    if (recent.length >= this.maxPerMin) { this.hits.set(ip, recent); return false; }
    recent.push(nowMs);
    this.hits.set(ip, recent);
    return true;
  }

  clear(): void { this.hits.clear(); }
}
