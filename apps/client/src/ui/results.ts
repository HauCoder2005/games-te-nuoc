import type { Awards, GameEvent } from '@te-nuoc/shared';

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
  root.className = 'result';
  const heading = document.createElement('h2');
  heading.textContent = `ĐỘI ${winner === 0 ? 'ĐỎ' : 'XANH'} THẮNG! · ${score[0]} : ${score[1]}`;
  root.append(heading);
  for (const line of awardLines(awards, names)) {
    const row = document.createElement('p'); row.textContent = line; root.append(row);
  }
}
