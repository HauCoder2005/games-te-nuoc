import { INTERP_EXTRAP_MS } from '@te-nuoc/shared';

type Point = { x: number; y: number };

export class Interpolator<T extends Point = Point> {
  private samples: { time: number; value: T }[] = [];

  push(time: number, value: T): void {
    if (!Number.isFinite(time)) return;
    this.samples.push({ time, value: { ...value } });
    this.samples.sort((a, b) => a.time - b.time);
    if (this.samples.length > 3) this.samples.shift();
  }

  sample(time: number): T {
    if (!this.samples.length) throw new Error('Chưa có dữ liệu');
    const first = this.samples[0];
    if (time <= first.time || this.samples.length === 1) return { ...first.value };
    for (let index = 1; index < this.samples.length; index++) {
      const previous = this.samples[index - 1];
      const next = this.samples[index];
      if (time <= next.time) return this.mix(previous, next, (time - previous.time) / (next.time - previous.time || 1));
    }
    const previous = this.samples[this.samples.length - 2];
    const next = this.samples[this.samples.length - 1];
    return this.mix(previous, next, 1 + Math.min(INTERP_EXTRAP_MS, time - next.time) / (next.time - previous.time || 1));
  }

  private mix(a: { value: T }, b: { value: T }, ratio: number): T {
    return { ...b.value, x: a.value.x + (b.value.x - a.value.x) * ratio,
      y: a.value.y + (b.value.y - a.value.y) * ratio };
  }
}
