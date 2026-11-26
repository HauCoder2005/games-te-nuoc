import { normalizeName } from '@te-nuoc/shared';

export interface RankTier {
  name: string;
  minStars: number;
  icon: string;
  color: string;
}

export const RANK_TIERS: readonly RankTier[] = [
  { name: 'Đồng Đoàn', minStars: 0, icon: '🥉', color: '#E08E55' },
  { name: 'Bạc Đoàn', minStars: 3, icon: '🥈', color: '#D8E2EF' },
  { name: 'Vàng Đoàn', minStars: 6, icon: '🥇', color: '#FFD700' },
  { name: 'Bạch Kim', minStars: 10, icon: '💎', color: '#4CC9F0' },
  { name: 'Kim Cương', minStars: 15, icon: '👑', color: '#B57CFF' },
  { name: 'Cao Thủ', minStars: 22, icon: '🔥', color: '#FF5C77' },
];

export interface LeaderboardEntry {
  name: string;
  stars: number;
  wins: number;
  variant: number;
  isSelf?: boolean;
}

export interface StoredAccount {
  username: string;
  password: string;
  stars: number;
  wins: number;
  variant: number;
}

const DEFAULT_RIVALS: readonly LeaderboardEntry[] = [
  { name: 'Hưng Thủy Thần', stars: 16, wins: 16, variant: 2 },
  { name: 'Mai Bắn Tỉa', stars: 12, wins: 12, variant: 4 },
  { name: 'Khoa Sóng Thần', stars: 9, wins: 9, variant: 0 },
  { name: 'Su Thủy Kích', stars: 6, wins: 6, variant: 3 },
  { name: 'Na Bóng Nước', stars: 3, wins: 3, variant: 1 },
  { name: 'Tí Tập Bơi', stars: 1, wins: 1, variant: 0 },
];

const STARS_KEY = 'aqua-blast-stars';
const WINS_KEY = 'aqua-blast-wins';
const ACCOUNTS_KEY = 'aqua-blast-accounts';
const SESSION_KEY = 'aqua-blast-session';

function loadAccountsMap(): Record<string, StoredAccount> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, StoredAccount>) : {};
  } catch {
    return {};
  }
}

function saveAccountsMap(map: Record<string, StoredAccount>): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(map));
}

export function getActiveAccount(): StoredAccount | null {
  const sessionKey = localStorage.getItem(SESSION_KEY);
  if (!sessionKey) return null;
  const map = loadAccountsMap();
  return map[sessionKey] ?? null;
}

export function registerOrLoginAccount(
  rawUsername: string,
  rawPassword: string,
  variant: number,
): { ok: true; created: boolean; account: StoredAccount } | { ok: false; error: string } {
  const cleanUser = normalizeName(rawUsername);
  if (!cleanUser) return { ok: false, error: 'Vui lòng nhập tên tài khoản (Username)' };
  const pass = rawPassword.trim();
  if (pass.length < 3) return { ok: false, error: 'Vui lòng nhập mật khẩu (tối thiểu 3 ký tự)' };

  const key = cleanUser.toLowerCase();
  const map = loadAccountsMap();
  const existing = map[key];
  if (existing) {
    if (existing.password !== pass) {
      return { ok: false, error: 'Mật khẩu không đúng cho tài khoản này!' };
    }
    existing.variant = variant;
    map[key] = existing;
    saveAccountsMap(map);
    localStorage.setItem(SESSION_KEY, key);
    localStorage.setItem('te-nuoc-name', existing.username);
    localStorage.setItem(STARS_KEY, String(existing.stars));
    localStorage.setItem(WINS_KEY, String(existing.wins));
    void syncAuthToServer(existing.username, existing.password, existing.variant);
    return { ok: true, created: false, account: existing };
  }

  const created: StoredAccount = {
    username: cleanUser,
    password: pass,
    stars: getPlayerStars(),
    wins: getPlayerWins(),
    variant,
  };
  map[key] = created;
  saveAccountsMap(map);
  localStorage.setItem(SESSION_KEY, key);
  localStorage.setItem('te-nuoc-name', created.username);
  localStorage.setItem(STARS_KEY, String(created.stars));
  localStorage.setItem(WINS_KEY, String(created.wins));
  void syncAuthToServer(created.username, created.password, created.variant);
  return { ok: true, created: true, account: created };
}

export function logoutAccount(): void {
  localStorage.removeItem(SESSION_KEY);
}

function apiBaseUrl(): string {
  const wsUrl = import.meta.env.VITE_SERVER_URL ?? (typeof location !== 'undefined' ? `ws://${location.hostname}:2567` : 'ws://localhost:2567');
  return wsUrl.replace(/^ws(s?):\/\//, 'http$1://').replace(/\/$/, '');
}

async function syncAuthToServer(username: string, password: string, variant: number): Promise<void> {
  if (typeof fetch !== 'function') return;
  try {
    await fetch(`${apiBaseUrl()}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, variant }),
    });
  } catch {
    /* Offline fallback */
  }
}

export function getPlayerStars(): number {
  const active = getActiveAccount();
  if (active) return active.stars;
  const raw = Number(localStorage.getItem(STARS_KEY) ?? '0');
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
}

export function getPlayerWins(): number {
  const active = getActiveAccount();
  if (active) return active.wins;
  const raw = Number(localStorage.getItem(WINS_KEY) ?? '0');
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
}

export function addWinStar(): { stars: number; wins: number; tier: RankTier } {
  const stars = getPlayerStars() + 1;
  const wins = getPlayerWins() + 1;
  localStorage.setItem(STARS_KEY, String(stars));
  localStorage.setItem(WINS_KEY, String(wins));

  const sessionKey = localStorage.getItem(SESSION_KEY);
  if (sessionKey) {
    const map = loadAccountsMap();
    const account = map[sessionKey];
    if (account) {
      account.stars = stars;
      account.wins = wins;
      map[sessionKey] = account;
      saveAccountsMap(map);
      if (typeof fetch === 'function') {
        void fetch(`${apiBaseUrl()}/api/rank/win`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: account.username, password: account.password }),
        }).catch(() => {});
      }
    }
  }
  return { stars, wins, tier: getRankTier(stars) };
}

export function getRankTier(stars: number): RankTier {
  let current = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (stars >= tier.minStars) current = tier;
  }
  return current;
}

export function formatStarIcons(stars: number): string {
  if (stars === 0) return '☆ 0 sao';
  if (stars <= 5) return `${'⭐'.repeat(stars)} (${stars} sao)`;
  return `⭐ ×${stars}`;
}

export function getLeaderboard(playerName: string, playerVariant: number): LeaderboardEntry[] {
  const active = getActiveAccount();
  const clean = (active?.username ?? playerName).trim();
  const map = loadAccountsMap();
  const registeredEntries: LeaderboardEntry[] = Object.values(map).map((acc) => ({
    name: acc.username,
    stars: acc.stars,
    wins: acc.wins,
    variant: acc.variant,
    isSelf: clean.length > 0 && acc.username.toLowerCase() === clean.toLowerCase(),
  }));

  const takenNames = new Set(registeredEntries.map((entry) => entry.name.toLowerCase()));
  const rivals = DEFAULT_RIVALS.filter((entry) => !takenNames.has(entry.name.toLowerCase()));
  const all: LeaderboardEntry[] = [...rivals, ...registeredEntries];

  if (clean && !takenNames.has(clean.toLowerCase())) {
    all.push({
      name: clean,
      stars: getPlayerStars(),
      wins: getPlayerWins(),
      variant: playerVariant,
      isSelf: true,
    });
  }

  all.sort((a, b) => b.stars - a.stars || (a.isSelf ? -1 : 1));
  return all.slice(0, 7);
}
