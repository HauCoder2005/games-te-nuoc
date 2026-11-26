import { describe, expect, it } from 'vitest';
import { parseRoute } from '../src/net/colyseus';

describe('room route', () => {
  it('normalizes a private code from the hash', () => {
    expect(parseRoute('#/r/khvt').roomCode).toBe('KHVT');
    expect(parseRoute('#/').roomCode).toBeNull();
    expect(parseRoute('#/r/INVALID').roomCode).toBeNull();
  });
});
