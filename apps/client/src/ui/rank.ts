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

export function getPlayerStars(): number {
  const raw = Number(localStorage.getItem(STARS_KEY) ?? '0');
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
}

export function getPlayerWins(): number {
  const raw = Number(localStorage.getItem(WINS_KEY) ?? '0');
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
}

export function addWinStar(): { stars: number; wins: number; tier: RankTier } {
  const stars = getPlayerStars() + 1;
  const wins = getPlayerWins() + 1;
  localStorage.setItem(STARS_KEY, String(stars));
  localStorage.setItem(WINS_KEY, String(wins));
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
  const clean = playerName.trim() || 'Bạn';
  const stars = getPlayerStars();
  const wins = getPlayerWins();
  const rivals = DEFAULT_RIVALS.filter((entry) => entry.name.toLowerCase() !== clean.toLowerCase());
  const all: LeaderboardEntry[] = [
    ...rivals,
    { name: clean, stars, wins, variant: playerVariant, isSelf: true },
  ];
  all.sort((a, b) => b.stars - a.stars || (a.isSelf ? -1 : 1));
  return all.slice(0, 6);
}
