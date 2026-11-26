import { CHARACTER_VARIANTS, MAX_NAME_LENGTH, normalizeName } from '@te-nuoc/shared';
import { startPractice } from '../offline/practice';
import { connect, mapJoinError, parseRoute } from '../net/colyseus';
import { showRoom } from './privateLobby';
import { createCharacterAvatar } from './avatar';
import { formatStarIcons, getLeaderboard, getPlayerStars, getPlayerWins, getRankTier } from './rank';

export function isTouchOnly(nav: { maxTouchPoints: number }, mq: (query: string) => boolean): boolean {
  return nav.maxTouchPoints > 0 && !mq('(pointer: fine)');
}

function getStoredVariant(): number {
  const raw = Number(localStorage.getItem('te-nuoc-variant') ?? '0');
  return Number.isInteger(raw) && raw >= 0 && raw < CHARACTER_VARIANTS.length ? raw : 0;
}

export function showHome(root: HTMLElement): void {
  root.replaceChildren();
  const panel = document.createElement('main');
  panel.className = 'home';
  const title = document.createElement('h1');
  title.textContent = 'Aqua Blast';
  panel.append(title);
  if (isTouchOnly(navigator, (query) => window.matchMedia(query).matches)) {
    const notice = document.createElement('p');
    notice.textContent = 'Game cần bàn phím và chuột';
    panel.append(notice);
    root.append(panel);
    return;
  }
  const nameBox = document.createElement('section');
  nameBox.className = 'home-box home-box-name';
  const label = document.createElement('label');
  label.textContent = 'Tên của bạn';
  const name = document.createElement('input');
  name.placeholder = 'Nhập tên (tối đa 12 ký tự)';
  name.value = localStorage.getItem('te-nuoc-name') ?? '';
  label.append(name);

  let selectedVariant = getStoredVariant();
  const stars = getPlayerStars();
  const wins = getPlayerWins();
  const tier = getRankTier(stars);

  const rankBanner = document.createElement('div');
  rankBanner.className = 'rank-profile-bar';
  const rankBadge = document.createElement('div');
  rankBadge.className = 'rank-tier-badge';
  rankBadge.style.borderColor = tier.color;
  rankBadge.textContent = `${tier.icon} ${tier.name}`;
  const rankStars = document.createElement('div');
  rankStars.className = 'rank-stars-display';
  rankStars.textContent = `${formatStarIcons(stars)} · ${wins} trận thắng (Thắng +1 ⭐)`;
  rankBanner.append(rankBadge, rankStars);
  const charTitle = document.createElement('div');
  charTitle.className = 'char-picker-title';
  charTitle.textContent = 'Chọn nhân vật (vào trận sẽ mặc đồng phục màu đội Đỏ/Xanh)';
  const charGrid = document.createElement('div');
  charGrid.className = 'char-picker';
  const charDetail = document.createElement('div');
  charDetail.className = 'char-detail';
  const updateDetailText = (index: number) => {
    const v = CHARACTER_VARIANTS[index];
    charDetail.textContent = `${v.label} (${v.role}) — ${v.detail}`;
  };
  updateDetailText(selectedVariant);
  const charCards: HTMLButtonElement[] = [];

  for (const variant of CHARACTER_VARIANTS) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `char-card${variant.id === selectedVariant ? ' selected' : ''}`;
    card.dataset.variant = String(variant.id);
    const portrait = document.createElement('div');
    portrait.className = 'char-portrait';
    portrait.append(createCharacterAvatar(variant.id, 'casual'));
    const cardLabel = document.createElement('span');
    cardLabel.className = 'char-card-label';
    cardLabel.textContent = variant.label;
    const cardRole = document.createElement('span');
    cardRole.className = `char-card-role gender-${variant.gender}`;
    cardRole.textContent = variant.role;
    card.append(portrait, cardLabel, cardRole);
    card.addEventListener('click', () => {
      selectedVariant = variant.id;
      localStorage.setItem('te-nuoc-variant', String(selectedVariant));
      updateDetailText(selectedVariant);
      for (const item of charCards) item.classList.toggle('selected', item === card);
      renderLeaderboardRows();
    });
    charCards.push(card);
    charGrid.append(card);
  }
  nameBox.append(rankBanner, label, charTitle, charGrid, charDetail);

  const roomBox = document.createElement('section');
  roomBox.className = 'home-box home-box-room';
  const roomLabel = document.createElement('label');
  roomLabel.textContent = 'Mã phòng';
  const roomRow = document.createElement('div');
  roomRow.className = 'room-input-row';
  const roomCode = document.createElement('input');
  roomCode.placeholder = 'Mã phòng (4 chữ)';
  roomCode.value = parseRoute(location.hash).roomCode ?? '';

  const button = document.createElement('button');
  button.textContent = 'Chơi thử với bot';
  const error = document.createElement('p');
  error.className = 'error';
  const cleanName = (): string | null => {
    const clean = normalizeName(name.value);
    if (!clean) { error.textContent = 'Vui lòng nhập tên'; return null; }
    localStorage.setItem('te-nuoc-name', clean);
    localStorage.setItem('te-nuoc-variant', String(selectedVariant));
    error.textContent = '';
    return clean;
  };
  const join = async (mode: 'private' | 'code' | 'public'): Promise<void> => {
    const clean = cleanName();
    if (!clean) return;
    error.textContent = 'Đang kết nối…';
    try {
      const client = connect();
      const room = mode === 'private' ? await client.createPrivate(clean, selectedVariant)
        : mode === 'code' ? await client.joinByCode(roomCode.value, clean, selectedVariant)
          : await client.quickMatch(clean, selectedVariant);
      if (mode === 'private') location.hash = `#/r/${room.roomId}`;
      showRoom(root, room);
    } catch (cause) {
      error.textContent = mapJoinError(cause);
      const retry = document.createElement('button');
      retry.textContent = 'Thử lại';
      retry.addEventListener('click', () => { retry.remove(); void join(mode); });
      error.append(retry);
    }
  };
  const create = document.createElement('button');
  create.textContent = 'Tạo phòng riêng';
  create.addEventListener('click', () => { void join('private'); });
  const quick = document.createElement('button');
  quick.textContent = 'Ghép ngẫu nhiên';
  quick.addEventListener('click', () => { void join('public'); });
  const enter = document.createElement('button');
  enter.textContent = 'Vào';
  enter.addEventListener('click', () => { void join('code'); });
  roomRow.append(roomCode, enter);
  roomLabel.append(roomRow);
  roomBox.append(roomLabel, create);
  button.addEventListener('click', () => {
    const clean = cleanName();
    if (!clean) return;
    startPractice(root);
  });

  // Leaderboard box right on the home matchmaking screen
  const leaderboardBox = document.createElement('section');
  leaderboardBox.className = 'home-box home-box-leaderboard';
  const lbHeader = document.createElement('div');
  lbHeader.className = 'lb-header';
  const lbTitle = document.createElement('span');
  lbTitle.className = 'lb-title';
  lbTitle.textContent = '🏆 BẢNG XẾP HẠNG LEO RANK';
  const lbRule = document.createElement('span');
  lbRule.className = 'lb-rule';
  lbRule.textContent = 'Thắng 1 trận = +1 ⭐';
  lbHeader.append(lbTitle, lbRule);

  const lbList = document.createElement('div');
  lbList.className = 'lb-list';
  const renderLeaderboardRows = () => {
    lbList.replaceChildren();
    const entries = getLeaderboard(name.value || 'Bạn', selectedVariant);
    entries.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = `lb-row ${entry.isSelf ? 'lb-row-self' : ''} lb-rank-${index + 1}`;
      const rankNum = document.createElement('span');
      rankNum.className = 'lb-pos';
      rankNum.textContent = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
      const avatarWrap = document.createElement('span');
      avatarWrap.className = 'lb-avatar';
      avatarWrap.append(createCharacterAvatar(entry.variant, 'casual'));
      const entryName = document.createElement('span');
      entryName.className = 'lb-name';
      entryName.textContent = entry.isSelf ? `${entry.name} (Bạn)` : entry.name;
      const entryTier = getRankTier(entry.stars);
      const tierTag = document.createElement('span');
      tierTag.className = 'lb-tier';
      tierTag.style.color = entryTier.color;
      tierTag.textContent = `${entryTier.icon} ${entryTier.name}`;
      const starCount = document.createElement('span');
      starCount.className = 'lb-stars';
      starCount.textContent = `⭐ ${entry.stars}`;
      row.append(rankNum, avatarWrap, entryName, tierTag, starCount);
      lbList.append(row);
    });
  };
  name.addEventListener('input', () => {
    name.value = Array.from(name.value).slice(0, MAX_NAME_LENGTH).join('');
    renderLeaderboardRows();
  });
  renderLeaderboardRows();
  leaderboardBox.append(lbHeader, lbList);

  panel.append(nameBox, roomBox, quick, button, leaderboardBox, error);
  root.append(panel);
}
