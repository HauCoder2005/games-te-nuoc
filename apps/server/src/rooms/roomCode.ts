import { randomInt } from 'node:crypto';
import type { Presence } from 'colyseus';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, ROOM_CODE_SET } from '@te-nuoc/shared';

const pending = new Set<string>();

export async function generateRoomCode(presence: Presence, rng: () => number = () => randomInt(ROOM_CODE_ALPHABET.length) / ROOM_CODE_ALPHABET.length): Promise<string> {
  while (true) {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      const value = rng();
      const index = Math.min(ROOM_CODE_ALPHABET.length - 1, Math.max(0, Math.floor(value * ROOM_CODE_ALPHABET.length)));
      code += ROOM_CODE_ALPHABET[index];
    }
    const occupied = await presence.sismember(ROOM_CODE_SET, code);
    if (occupied || pending.has(code)) continue;
    pending.add(code);
    try {
      await presence.sadd(ROOM_CODE_SET, code);
      return code;
    } catch (error) {
      pending.delete(code);
      throw error;
    }
  }
}

export async function releaseRoomCode(presence: Presence, code: string): Promise<void> {
  await presence.srem(ROOM_CODE_SET, code);
  pending.delete(code);
}
