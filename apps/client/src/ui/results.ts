import type { Awards, GameEvent } from '@te-nuoc/shared';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag: string, attrs: Record<string, string>): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

export function createTrophyIcon(rank: 1 | 2 | 3): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('class', `trophy-svg trophy-rank-${rank}`);

  const palette = rank === 1
    ? { main: '#FFD700', light: '#FFF380', dark: '#C89600', ribbon: '#E53B3B', gem: '#FF3B6B' }
    : rank === 2
      ? { main: '#E0E8F0', light: '#FFFFFF', dark: '#8B9BB4', ribbon: '#3B8BF0', gem: '#3B8BF0' }
      : { main: '#E08E55', light: '#FFB984', dark: '#9A5226', ribbon: '#2EC4B6', gem: '#FFE066' };

  if (rank === 1) {
    // Gold Champion Cup with handles, star, and pedestal
    svg.append(
      svgEl('path', { d: 'M8 5 H24 V13 C24 17.5 20.5 20.5 16 20.5 C11.5 20.5 8 17.5 8 13 Z', fill: palette.main, stroke: '#2B1E2F', 'stroke-width': '1.6' }),
      svgEl('path', { d: 'M8 7 H4 V11 C4 14 6 15.5 8 15.5', fill: 'none', stroke: palette.main, 'stroke-width': '2.4' }),
      svgEl('path', { d: 'M24 7 H28 V11 C28 14 26 15.5 24 15.5', fill: 'none', stroke: palette.main, 'stroke-width': '2.4' }),
      svgEl('rect', { x: '14', y: '20', width: '4', height: '5', fill: palette.dark }),
      svgEl('rect', { x: '10', y: '25', width: '12', height: '3', rx: '1', fill: palette.main, stroke: '#2B1E2F', 'stroke-width': '1.4' }),
      svgEl('rect', { x: '7', y: '28', width: '18', height: '3', rx: '1', fill: '#523440', stroke: '#2B1E2F', 'stroke-width': '1.4' }),
      svgEl('polygon', { points: '16,8 17.6,11.2 21,11.7 18.5,14.1 19.1,17.5 16,15.8 12.9,17.5 13.5,14.1 11,11.7 14.4,11.2', fill: palette.light }),
    );
  } else {
    // Medal with V-ribbon & embossed star/crown
    svg.append(
      svgEl('polygon', { points: '10,2 15,2 17,13 12,13', fill: palette.ribbon, stroke: '#2B1E2F', 'stroke-width': '1.2' }),
      svgEl('polygon', { points: '22,2 17,2 15,13 20,13', fill: palette.ribbon, stroke: '#2B1E2F', 'stroke-width': '1.2' }),
      svgEl('circle', { cx: '16', cy: '19', r: '9.5', fill: palette.main, stroke: '#2B1E2F', 'stroke-width': '1.6' }),
      svgEl('circle', { cx: '16', cy: '19', r: '7.2', fill: 'none', stroke: palette.dark, 'stroke-width': '1.2' }),
      svgEl('polygon', { points: '16,13 17.5,16.5 21.3,16.9 18.5,19.4 19.3,23.1 16,21.2 12.7,23.1 13.5,19.4 10.7,16.9 14.5,16.5', fill: palette.light }),
    );
  }
  return svg;
}

export function bannerFor(event: GameEvent, _score: [number, number], scoreToWin: number,
  names: ReadonlyMap<number, string> = new Map()): string | null {
  switch (event.k) {
    case 'matchPoint':
      if (event.teams.length > 1) return `${scoreToWin - 1} – ${scoreToWin - 1}! AI GHI TIẾP SẼ THẮNG!`;
      return `ĐIỂM QUYẾT ĐỊNH — ĐỘI ${event.teams[0] === 0 ? 'ĐỎ' : 'XANH'}!`;
    case 'golden': return 'BÀN THẮNG VÀNG!';
    case 'lastMinute': return 'PHÚT CUỐI — BÈ CO LẠI!';
    case 'streak':
      if (event.n === 3) return `${names.get(event.slot) ?? `#${event.slot}`} đang nóng tay! 🔥`;
      if (event.n === 5) return `${names.get(event.slot) ?? `#${event.slot}`} KHÔNG THỂ CẢN!`;
      return null;
    default: return null;
  }
}

export function awardLines(awards: Awards, names: ReadonlyMap<number, string>): string[] {
  return [
    `MVP: ${awards.mvp === null ? '—' : names.get(awards.mvp) ?? `#${awards.mvp}`}`,
    `Thánh Ném: ${awards.sharpshooter === null ? '—' : names.get(awards.sharpshooter) ?? `#${awards.sharpshooter}`}`,
    `Vua Tõm: ${awards.mostFalls === null ? '—' : names.get(awards.mostFalls) ?? `#${awards.mostFalls}`}`,
  ];
}

export function showResults(root: HTMLElement, winner: 0 | 1, score: [number, number],
  awards: Awards, names: ReadonlyMap<number, string>): void {
  root.replaceChildren();
  root.className = `result result-team-${winner}`;

  const header = document.createElement('div');
  header.className = 'result-header';
  const crown = document.createElement('div');
  crown.className = 'result-crown';
  crown.textContent = '🏆 BẢNG VÀNG CHIẾN THẮNG 🏆';
  const heading = document.createElement('h2');
  heading.textContent = `ĐỘI ${winner === 0 ? 'ĐỎ' : 'XANH'} THẮNG! · ${score[0]} : ${score[1]}`;
  header.append(crown, heading);
  root.append(header);

  const cards = [
    {
      rank: 1 as const,
      badge: 'TOP 1 · CÚP VÀNG',
      title: 'MVP',
      subtitle: 'Nhiều KO nhất',
      player: awards.mvp === null ? '—' : names.get(awards.mvp) ?? `#${awards.mvp}`,
      fullLine: `MVP: ${awards.mvp === null ? '—' : names.get(awards.mvp) ?? `#${awards.mvp}`}`,
    },
    {
      rank: 2 as const,
      badge: 'TOP 2 · HUÂN CHƯƠNG BẠC',
      title: 'Thánh Ném',
      subtitle: 'Ném trúng thẳng nhiều nhất',
      player: awards.sharpshooter === null ? '—' : names.get(awards.sharpshooter) ?? `#${awards.sharpshooter}`,
      fullLine: `Thánh Ném: ${awards.sharpshooter === null ? '—' : names.get(awards.sharpshooter) ?? `#${awards.sharpshooter}`}`,
    },
    {
      rank: 3 as const,
      badge: 'TOP 3 · HUÂN CHƯƠNG ĐỒNG',
      title: 'Vua Tõm',
      subtitle: 'Rơi xuống hồ nhiều nhất',
      player: awards.mostFalls === null ? '—' : names.get(awards.mostFalls) ?? `#${awards.mostFalls}`,
      fullLine: `Vua Tõm: ${awards.mostFalls === null ? '—' : names.get(awards.mostFalls) ?? `#${awards.mostFalls}`}`,
    },
  ];

  // Display in Podium order: Top 2 (left), Top 1 (center elevated), Top 3 (right)
  const podiumOrder = [cards[1], cards[0], cards[2]];
  const podium = document.createElement('div');
  podium.className = 'podium';

  for (const item of podiumOrder) {
    const card = document.createElement('div');
    card.className = `podium-card podium-rank-${item.rank}`;

    const badge = document.createElement('div');
    badge.className = 'podium-badge';
    badge.textContent = item.badge;

    const iconWrap = document.createElement('div');
    iconWrap.className = 'podium-icon';
    iconWrap.append(createTrophyIcon(item.rank));

    const title = document.createElement('div');
    title.className = 'podium-title';
    title.textContent = item.title;

    const player = document.createElement('div');
    player.className = 'podium-player';
    player.textContent = item.player;

    const subtitle = document.createElement('div');
    subtitle.className = 'podium-subtitle';
    subtitle.textContent = item.subtitle;

    // Hidden accessible line for text matching
    const srLine = document.createElement('p');
    srLine.className = 'podium-line';
    srLine.textContent = item.fullLine;

    card.append(badge, iconWrap, title, player, subtitle, srLine);
    podium.append(card);
  }

  root.append(podium);
}
