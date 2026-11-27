import { normalizeName } from '@te-nuoc/shared';

export interface RankTier {
  name: string;
  minStars: number;
  icon: string;
  color: string;
}

export const RANK_TIERS: readonly RankTier[] = [
  { name: 'ĐỒNG', minStars: 0, icon: '', color: '#E08E55' },
  { name: 'BẠC', minStars: 3, icon: '', color: '#D8E2EF' },
  { name: 'VÀNG', minStars: 6, icon: '', color: '#FFD700' },
  { name: 'BẠCH KIM', minStars: 10, icon: '', color: '#4CC9F0' },
  { name: 'KIM CƯƠNG', minStars: 15, icon: '', color: '#B57CFF' },
  { name: 'CAO THỦ', minStars: 22, icon: '', color: '#FF5C77' },
];

export interface LeaderboardEntry {
  username?: string;
  name: string;
  stars: number;
  wins: number;
  variant: number;
  isSelf?: boolean;
}

export interface StoredAccount {
  username: string;
  gameName: string;
  password: string;
  stars: number;
  wins: number;
  variant: number;
}

const DEFAULT_RIVALS: readonly LeaderboardEntry[] = [
  { username: 'hungthuythan', name: 'Hưng Thủy Thần', stars: 16, wins: 16, variant: 2 },
  { username: 'maibantia', name: 'Mai Bắn Tỉa', stars: 12, wins: 12, variant: 4 },
  { username: 'khoasongthan', name: 'Khoa Sóng Thần', stars: 9, wins: 9, variant: 0 },
  { username: 'suthuykich', name: 'Su Thủy Kích', stars: 6, wins: 6, variant: 3 },
  { username: 'nabongnuoc', name: 'Na Bóng Nước', stars: 3, wins: 3, variant: 1 },
  { username: 'titapboi', name: 'Tí Tập Bơi', stars: 1, wins: 1, variant: 0 },
];

const STARS_KEY = 'aqua-blast-stars';
const WINS_KEY = 'aqua-blast-wins';
const ACCOUNTS_KEY = 'aqua-blast-accounts';
const SESSION_KEY = 'aqua-blast-session';
const COOKIE_NAME = 'aqua_blast_session';

function setSessionCookie(sessionKey: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(sessionKey)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

function getSessionCookie(): string | null {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const [k, v] = part.trim().split('=');
    if (k === COOKIE_NAME && v) return decodeURIComponent(v);
  }
  return null;
}

function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

function loadAccountsMap(): Record<string, StoredAccount> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return {};
    const record = parsed as Record<string, Partial<StoredAccount>>;
    const normalized: Record<string, StoredAccount> = {};
    for (const [k, val] of Object.entries(record)) {
      if (val && typeof val.username === 'string') {
        normalized[k] = {
          username: val.username,
          gameName: typeof val.gameName === 'string' && val.gameName ? val.gameName : val.username,
          password: typeof val.password === 'string' ? val.password : '123',
          stars: typeof val.stars === 'number' ? val.stars : 0,
          wins: typeof val.wins === 'number' ? val.wins : 0,
          variant: typeof val.variant === 'number' ? val.variant : 0,
        };
      }
    }
    return normalized;
  } catch {
    return {};
  }
}

function saveAccountsMap(map: Record<string, StoredAccount>): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(map));
}

function persistActiveSession(key: string, account: StoredAccount): void {
  localStorage.setItem(SESSION_KEY, key);
  setSessionCookie(key);
  localStorage.setItem('te-nuoc-username', account.username);
  localStorage.setItem('te-nuoc-name', account.gameName);
  localStorage.setItem('te-nuoc-variant', String(account.variant));
  localStorage.setItem(STARS_KEY, String(account.stars));
  localStorage.setItem(WINS_KEY, String(account.wins));
}

export function getActiveAccount(): StoredAccount | null {
  const sessionKey = localStorage.getItem(SESSION_KEY) ?? getSessionCookie();
  if (!sessionKey) return null;
  const map = loadAccountsMap();
  const acc = map[sessionKey] ?? null;
  if (acc && !localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, sessionKey);
  }
  return acc;
}

export function registerAccount(
  rawUsername: string,
  rawGameName: string,
  rawPassword: string,
  rawConfirmPassword: string,
  variant: number,
): { ok: true; account: StoredAccount } | { ok: false; error: string } {
  const cleanUser = normalizeName(rawUsername);
  if (!cleanUser) return { ok: false, error: 'Vui lòng nhập Username' };
  const cleanGameName = normalizeName(rawGameName);
  if (!cleanGameName) return { ok: false, error: 'Vui lòng nhập Tên trong game' };
  const pass = rawPassword.trim();
  if (pass.length < 3) return { ok: false, error: 'Vui lòng nhập mật khẩu (tối thiểu 3 ký tự)' };
  if (pass !== rawConfirmPassword.trim()) {
    return { ok: false, error: 'Mật khẩu xác nhận không khớp!' };
  }

  const key = cleanUser.toLowerCase();
  const map = loadAccountsMap();
  if (map[key]) {
    return { ok: false, error: 'Username này đã tồn tại, vui lòng chuyển sang Đăng nhập!' };
  }

  const created: StoredAccount = {
    username: cleanUser,
    gameName: cleanGameName,
    password: pass,
    stars: 0,
    wins: 0,
    variant,
  };
  map[key] = created;
  saveAccountsMap(map);
  persistActiveSession(key, created);
  void syncRegisterToServer(created, rawConfirmPassword.trim());
  return { ok: true, account: created };
}

export function loginAccount(
  rawUsername: string,
  rawPassword: string,
  variant?: number,
): { ok: true; account: StoredAccount } | { ok: false; error: string } {
  const cleanUser = normalizeName(rawUsername);
  if (!cleanUser) return { ok: false, error: 'Vui lòng nhập Username' };
  const pass = rawPassword.trim();
  if (pass.length < 3) return { ok: false, error: 'Vui lòng nhập mật khẩu (tối thiểu 3 ký tự)' };

  const key = cleanUser.toLowerCase();
  const map = loadAccountsMap();
  const existing = map[key];
  if (!existing) {
    return { ok: false, error: 'Tài khoản chưa tồn tại! Vui lòng bấm Đăng ký.' };
  }
  if (existing.password !== pass) {
    return { ok: false, error: 'Mật khẩu không đúng cho tài khoản này!' };
  }
  if (typeof variant === 'number') existing.variant = variant;
  map[key] = existing;
  saveAccountsMap(map);
  persistActiveSession(key, existing);
  void syncAuthToServer(existing.username, existing.gameName, existing.password, existing.variant);
  return { ok: true, account: existing };
}

export function updateActiveAccountProfile(
  rawGameName: string,
  variant: number,
): StoredAccount | null {
  const active = getActiveAccount();
  if (!active) return null;
  const cleanGame = normalizeName(rawGameName) ?? active.gameName;
  const key = active.username.toLowerCase();
  const map = loadAccountsMap();
  active.gameName = cleanGame;
  active.variant = variant;
  map[key] = active;
  saveAccountsMap(map);
  persistActiveSession(key, active);
  void syncAuthToServer(active.username, active.gameName, active.password, active.variant);
  return active;
}

export function registerOrLoginAccount(
  rawUsername: string,
  rawPassword: string,
  variant: number,
  rawGameName?: string,
): { ok: true; created: boolean; account: StoredAccount } | { ok: false; error: string } {
  const cleanUser = normalizeName(rawUsername);
  if (!cleanUser) return { ok: false, error: 'Vui lòng nhập tên tài khoản (Username)' };
  const cleanGameName = normalizeName(rawGameName) ?? cleanUser;
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
    if (rawGameName && normalizeName(rawGameName)) {
      existing.gameName = cleanGameName;
    }
    map[key] = existing;
    saveAccountsMap(map);
    persistActiveSession(key, existing);
    void syncAuthToServer(existing.username, existing.gameName, existing.password, existing.variant);
    return { ok: true, created: false, account: existing };
  }

  const created: StoredAccount = {
    username: cleanUser,
    gameName: cleanGameName,
    password: pass,
    stars: getPlayerStars(),
    wins: getPlayerWins(),
    variant,
  };
  map[key] = created;
  saveAccountsMap(map);
  persistActiveSession(key, created);
  void syncAuthToServer(created.username, created.gameName, created.password, created.variant);
  return { ok: true, created: true, account: created };
}

export function logoutAccount(): void {
  localStorage.removeItem(SESSION_KEY);
  clearSessionCookie();
}

function apiBaseUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL.replace(/^ws(s?):\/\//, 'http$1://').replace(/\/$/, '');
  }
  if (typeof location !== 'undefined') {
    const httpProto = location.protocol === 'https:' ? 'https:' : 'http:';
    const host = location.hostname || 'localhost';
    if (location.port === '5173') {
      return `${httpProto}//${host}:2567`;
    }
    return `${httpProto}//${location.host || `${host}:2567`}`;
  }
  return 'http://localhost:2567';
}

async function syncRegisterToServer(account: StoredAccount, confirmPassword: string): Promise<void> {
  if (typeof fetch !== 'function') return;
  try {
    await fetch(`${apiBaseUrl()}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: account.username,
        gameName: account.gameName,
        password: account.password,
        confirmPassword,
        variant: account.variant,
      }),
    });
  } catch {
    /* Offline fallback */
  }
}

async function syncAuthToServer(username: string, gameName: string, password: string, variant: number): Promise<void> {
  if (typeof fetch !== 'function') return;
  try {
    await fetch(`${apiBaseUrl()}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, gameName, password, variant }),
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

  const sessionKey = localStorage.getItem(SESSION_KEY) ?? getSessionCookie();
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
  if (stars === 0) return '☆ 0';
  if (stars <= 5) return `${'⭐'.repeat(stars)} (${stars})`;
  return `⭐ ×${stars}`;
}

export function getLeaderboard(playerName: string, playerVariant: number): LeaderboardEntry[] {
  const active = getActiveAccount();
  const cleanGameName = (active?.gameName ?? playerName).trim();
  const cleanUser = (active?.username ?? cleanGameName).toLowerCase();
  const map = loadAccountsMap();
  const registeredEntries: LeaderboardEntry[] = Object.values(map).map((acc) => ({
    username: acc.username,
    name: acc.gameName,
    stars: acc.stars,
    wins: acc.wins,
    variant: acc.variant,
    isSelf: cleanUser.length > 0 && acc.username.toLowerCase() === cleanUser,
  }));

  const takenUsers = new Set(registeredEntries.map((entry) => (entry.username ?? entry.name).toLowerCase()));
  const rivals = DEFAULT_RIVALS.filter((entry) => !takenUsers.has((entry.username ?? entry.name).toLowerCase()));
  const all: LeaderboardEntry[] = [...rivals, ...registeredEntries];

  if (cleanGameName && !takenUsers.has(cleanUser)) {
    all.push({
      username: cleanGameName,
      name: cleanGameName,
      stars: getPlayerStars(),
      wins: getPlayerWins(),
      variant: playerVariant,
      isSelf: true,
    });
  }

  all.sort((a, b) => b.stars - a.stars || (a.isSelf ? -1 : 1));
  return all.slice(0, 7);
}
