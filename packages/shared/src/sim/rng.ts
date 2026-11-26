import { RNG_DIVISOR, RNG_INCREMENT } from '../config';

export function nextRng(state: number): [number, number] {
  const nextState = (state + RNG_INCREMENT) >>> 0;
  let t = nextState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / RNG_DIVISOR, nextState];
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    const [value, nextState] = nextRng(state);
    state = nextState;
    return value;
  };
}
