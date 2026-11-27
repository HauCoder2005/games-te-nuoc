import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const HASH_PREFIX = 'scrypt$';
const HASH_FORMAT = /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{64}$/;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `${HASH_PREFIX}${salt}$${hash}`;
}

export interface AccountRecord {
  username: string;
  gameName: string;
  password: string;
  stars: number;
  wins: number;
  variant: number;
}

export class AccountStore {
  private readonly accounts = new Map<string, AccountRecord>();

  constructor(private readonly filePath: string | null) {
    if (!filePath || !existsSync(filePath)) return;
    const data: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
    if (!Array.isArray(data)) throw new Error('Dữ liệu tài khoản không hợp lệ');
    for (const value of data) {
      if (typeof value !== 'object' || value === null || !('username' in value) || typeof value.username !== 'string'
        || !('gameName' in value) || typeof value.gameName !== 'string'
        || !('password' in value) || typeof value.password !== 'string'
        || !('stars' in value) || typeof value.stars !== 'number'
        || !('wins' in value) || typeof value.wins !== 'number'
        || !('variant' in value) || typeof value.variant !== 'number') throw new Error('Dữ liệu tài khoản không hợp lệ');
      const account: AccountRecord = {
        username: value.username, gameName: value.gameName, password: value.password,
        stars: value.stars, wins: value.wins, variant: value.variant,
      };
      this.accounts.set(account.username.toLowerCase(), account);
    }
  }

  get(username: string): AccountRecord | undefined { return this.accounts.get(username.toLowerCase()); }

  verify(username: string, password: string): boolean {
    const account = this.get(username);
    if (!account) return false;
    if (!HASH_FORMAT.test(account.password)) {
      if (account.password !== password) return false;
      this.set(account);
      return true;
    }
    const [, salt, expectedHex] = account.password.split('$');
    if (!salt || !expectedHex || expectedHex.length !== 64) return false;
    const expected = Buffer.from(expectedHex, 'hex');
    if (expected.length !== 32) return false;
    return timingSafeEqual(scryptSync(password, salt, 32), expected);
  }

  set(account: AccountRecord): void {
    const stored = { ...account, password: HASH_FORMAT.test(account.password)
      ? account.password : hashPassword(account.password) };
    this.accounts.set(account.username.toLowerCase(), stored);
    this.save();
  }

  win(username: string): AccountRecord | undefined {
    const account = this.get(username);
    if (!account) return undefined;
    account.stars++;
    account.wins++;
    this.save();
    return account;
  }

  leaderboard(): Omit<AccountRecord, 'password'>[] {
    return [...this.accounts.values()]
      .sort((a, b) => b.stars - a.stars || b.wins - a.wins || a.username.localeCompare(b.username))
      .slice(0, 10)
      .map(({ username, gameName, stars, wins, variant }) => ({ username, gameName, stars, wins, variant }));
  }

  private save(): void {
    if (!this.filePath) return;
    mkdirSync(dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    writeFileSync(temporaryPath, JSON.stringify([...this.accounts.values()]), { mode: 0o600 });
    renameSync(temporaryPath, this.filePath);
  }
}
