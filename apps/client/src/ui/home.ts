import { CHARACTER_VARIANTS, MAX_NAME_LENGTH, normalizeName } from '@te-nuoc/shared';
import { startPractice } from '../offline/practice';
import { connect, mapJoinError, parseRoute } from '../net/colyseus';
import { showRoom } from './privateLobby';
import { createCharacterAvatar } from './avatar';
import { createIconButton, setButtonContent } from './icons';
import {
  formatStarIcons, getActiveAccount, getLeaderboard, getPlayerStars,
  getPlayerWins, getRankTier, registerOrLoginAccount,
} from './rank';

export function isTouchOnly(nav: { maxTouchPoints: number }, mq: (query: string) => boolean): boolean {
  return nav.maxTouchPoints > 0 && !mq('(pointer: fine)');
}

function getStoredVariant(): number {
  const active = getActiveAccount();
  if (active) return active.variant;
  const raw = Number(localStorage.getItem('te-nuoc-variant') ?? '0');
  return Number.isInteger(raw) && raw >= 0 && raw < CHARACTER_VARIANTS.length ? raw : 0;
}

export function showHome(root: HTMLElement): void {
  root.replaceChildren();
  const layout = document.createElement('div');
  layout.className = 'home-layout';

  // Left separate panel: Leaderboard box
  const leaderboardPanel = document.createElement('aside');
  leaderboardPanel.className = 'home-leaderboard-panel home-box-leaderboard';

  // Right main panel: Game controls & Auth/Character box + Room box
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

  const activeAccount = getActiveAccount();
  let selectedVariant = getStoredVariant();

  const nameBox = document.createElement('section');
  nameBox.className = 'home-box home-box-name';

  const rankBanner = document.createElement('div');
  rankBanner.className = 'rank-profile-bar';
  const rankBadge = document.createElement('div');
  rankBadge.className = 'rank-tier-badge';
  const rankStars = document.createElement('div');
  rankStars.className = 'rank-stars-display';
  const updateRankBanner = () => {
    const stars = getPlayerStars();
    const wins = getPlayerWins();
    const tier = getRankTier(stars);
    rankBadge.style.borderColor = tier.color;
    rankBadge.textContent = `${tier.icon} ${tier.name}`;
    rankStars.textContent = `${formatStarIcons(stars)} · ${wins} thắng (Thắng +1 ⭐)`;
  };
  updateRankBanner();
  rankBanner.append(rankBadge, rankStars);

  // Quick Username & Password registration/login inside the account box
  const authGrid = document.createElement('div');
  authGrid.className = 'auth-grid';

  const label = document.createElement('label');
  label.textContent = 'Tên của bạn (Username)';
  const name = document.createElement('input');
  name.placeholder = 'Nhập Username (tối đa 12 ký tự)';
  name.value = activeAccount?.username ?? localStorage.getItem('te-nuoc-name') ?? '';
  label.append(name);

  const passLabel = document.createElement('label');
  passLabel.textContent = 'Mật khẩu (Đăng ký / Đăng nhập nhanh)';
  const passRow = document.createElement('div');
  passRow.className = 'auth-pass-row';
  const password = document.createElement('input');
  password.type = 'password';
  password.className = 'auth-password-input';
  password.placeholder = 'Mật khẩu (≥ 3 ký tự)';
  password.value = activeAccount?.password ?? '123';

  const authStatus = document.createElement('div');
  authStatus.className = 'auth-status';
  if (activeAccount) {
    authStatus.textContent = `✅ Đã đăng nhập: ${activeAccount.username} (Đã lên Bảng Xếp Hạng)`;
  } else {
    authStatus.textContent = '💡 Nhập Username + Mật khẩu để ghi danh lên Bảng Xếp Hạng';
  }

  const authBtn = createIconButton('user-plus', activeAccount ? 'Cập nhật TK' : 'Đăng ký / Lưu TK', () => {
    const res = registerOrLoginAccount(name.value, password.value, selectedVariant);
    if (!res.ok) {
      error.textContent = res.error;
      return;
    }
    error.textContent = '';
    name.value = res.account.username;
    authStatus.textContent = res.created
      ? `🎉 Đã tạo tài khoản "${res.account.username}" & đưa lên Bảng Xếp Hạng!`
      : `✅ Đã đăng nhập tài khoản "${res.account.username}"!`;
    setButtonContent(authBtn, 'check-circle', 'Đã lưu TK');
    updateRankBanner();
    renderLeaderboardRows();
  });

  passRow.append(password, authBtn);
  passLabel.append(passRow);
  authGrid.append(label, passLabel);

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
  nameBox.append(rankBanner, authGrid, authStatus, charTitle, charGrid, charDetail);

  const roomBox = document.createElement('section');
  roomBox.className = 'home-box home-box-room';
  const roomLabel = document.createElement('label');
  roomLabel.textContent = 'Mã phòng';
  const roomRow = document.createElement('div');
  roomRow.className = 'room-input-row';
  const roomCode = document.createElement('input');
  roomCode.placeholder = 'Mã phòng (4 chữ)';
  roomCode.value = parseRoute(location.hash).roomCode ?? '';

  const error = document.createElement('p');
  error.className = 'error';

  const cleanName = (): string | null => {
    const clean = normalizeName(name.value);
    if (!clean) { error.textContent = 'Vui lòng nhập tên'; return null; }
    const pass = password.value.trim() || '123';
    const authRes = registerOrLoginAccount(clean, pass, selectedVariant);
    if (!authRes.ok) {
      error.textContent = authRes.error;
      return null;
    }
    localStorage.setItem('te-nuoc-name', authRes.account.username);
    localStorage.setItem('te-nuoc-variant', String(selectedVariant));
    error.textContent = '';
    updateRankBanner();
    renderLeaderboardRows();
    return authRes.account.username;
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
      const retry = createIconButton('refresh', 'Thử lại', () => {
        retry.remove();
        void join(mode);
      });
      error.append(retry);
    }
  };

  const create = createIconButton('plus', 'Tạo phòng riêng', () => { void join('private'); });
  const quick = createIconButton('swords', 'Ghép ngẫu nhiên', () => { void join('public'); });
  const enter = createIconButton('log-in', 'Vào', () => { void join('code'); });
  const button = createIconButton('bot', 'Chơi thử với bot', () => {
    const clean = cleanName();
    if (!clean) return;
    startPractice(root);
  });

  roomRow.append(roomCode, enter);
  roomLabel.append(roomRow);
  roomBox.append(roomLabel, create);

  // Build Left Leaderboard Column
  const lbHeader = document.createElement('div');
  lbHeader.className = 'lb-header';
  const lbTitle = document.createElement('div');
  lbTitle.className = 'lb-title';
  lbTitle.textContent = '🏆 BẢNG XẾP HẠNG';
  const lbRule = document.createElement('div');
  lbRule.className = 'lb-rule';
  lbRule.textContent = 'Thắng 1 trận = +1 ⭐';
  const lbSub = document.createElement('div');
  lbSub.className = 'lb-subtitle';
  lbSub.textContent = 'Đăng ký nhanh Username + Mật khẩu bên phải để lưu Sao & đua Top!';
  lbHeader.append(lbTitle, lbRule, lbSub);

  const lbList = document.createElement('div');
  lbList.className = 'lb-list';
  const renderLeaderboardRows = () => {
    lbList.replaceChildren();
    const entries = getLeaderboard(name.value, selectedVariant);
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
  leaderboardPanel.append(lbHeader, lbList);

  panel.append(nameBox, roomBox, quick, button, error);
  layout.append(leaderboardPanel, panel);
  root.append(layout);
}
