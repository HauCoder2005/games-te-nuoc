import { expect, it } from 'vitest';
import { Predictor } from '../src/net/predict';

it('snaps above 24px and blends smaller errors', () => {
  const predictor = new Predictor(0, 0);
  predictor.reconcile({ x: 30, y: 0, ackSeq: 0, status: 'alive' });
  expect(predictor.position.x).toBe(30);
  predictor.reconcile({ x: 40, y: 0, ackSeq: 0, status: 'alive' });
  expect(predictor.position.x).toBe(32);
});

it('disables prediction during hitstun', () => {
  const predictor = new Predictor(0, 0);
  predictor.reconcile({ x: 12, y: 6, ackSeq: 0, status: 'hitstun' });
  expect(predictor.position).toEqual({ x: 12, y: 6 });
  expect(predictor.enabled).toBe(false);
});
