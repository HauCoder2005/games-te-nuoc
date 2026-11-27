import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

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

  set(account: AccountRecord): void {
    this.accounts.set(account.username.toLowerCase(), account);
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
