import { CHARACTER_VARIANTS, MAX_NAME_LENGTH, normalizeName } from '@te-nuoc/shared';
import { startPractice } from '../offline/practice';
import { connect, mapJoinError, parseRoute } from '../net/colyseus';
import { showRoom } from './privateLobby';
import { createCharacterAvatar } from './avatar';
import { createIconButton } from './icons';
import {
  getActiveAccount, getLeaderboard, getPlayerStars,
  getPlayerWins, getRankTier, loginAccount, logoutAccount,
  registerAccount, registerOrLoginAccount, updateActiveAccountProfile,
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

  const panel = document.createElement('main');
  panel.className = 'home';
  const title = document.createElement('h1');
  title.textContent = 'Aqua Blast';
  panel.append(title);

  const leaderboardPanel = document.createElement('aside');
  leaderboardPanel.className = 'home-leaderboard-panel home-box-leaderboard';

  if (isTouchOnly(navigator, (query) => window.matchMedia(query).matches)) {
    const notice = document.createElement('p');
    notice.textContent = 'Game cần bàn phím và chuột';
    panel.append(notice);
    root.append(panel);
    return;
  }

  let selectedVariant = getStoredVariant();
  let authTab: 'login' | 'register' = 'login';

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
    rankBadge.textContent = `HẠNG ${tier.name}`;
    rankStars.textContent = `${stars} SAO · ${wins} THẮNG`;
  };
  updateRankBanner();
  rankBanner.append(rankBadge, rankStars);

  const gameNameInput = document.createElement('input');
  gameNameInput.placeholder = 'Tên nhân vật';
  gameNameInput.value = getActiveAccount()?.gameName ?? localStorage.getItem('te-nuoc-name') ?? '';
  gameNameInput.addEventListener('input', () => {
    gameNameInput.value = Array.from(gameNameInput.value).slice(0, MAX_NAME_LENGTH).join('');
    updateActiveAccountProfile(gameNameInput.value, selectedVariant);
    renderLeaderboardRows();
  });

  const authContainer = document.createElement('div');
  authContainer.className = 'auth-container';
  const error = document.createElement('p');
  error.className = 'error';

  let loginUserInput = document.createElement('input');
  let loginPassInput = document.createElement('input');
  let regUserInput = document.createElement('input');
  let regPassInput = document.createElement('input');
  let regConfirmInput = document.createElement('input');

  const renderAuthSection = () => {
    authContainer.replaceChildren();
    const currentAcc = getActiveAccount();

    if (currentAcc) {
      const loggedBox = document.createElement('div');
      loggedBox.className = 'auth-logged-card';

      const loggedHeader = document.createElement('div');
      loggedHeader.className = 'auth-logged-header';
      const userSummary = document.createElement('div');
      userSummary.className = 'auth-user-summary';
      const userBadge = document.createElement('span');
      userBadge.className = 'auth-username-tag';
      userBadge.textContent = `@${currentAcc.username}`;
      userSummary.append(userBadge);

      const logoutBtn = createIconButton('log-out', 'THOÁT TK', () => {
        logoutAccount();
        updateRankBanner();
        renderAuthSection();
        renderLeaderboardRows();
      });
      logoutBtn.className = 'pixel-btn auth-logout-btn';
      loggedHeader.append(userSummary, logoutBtn);

      const gameNameLabel = document.createElement('label');
      gameNameLabel.textContent = 'Tên game';
      gameNameInput.value = currentAcc.gameName;
      gameNameLabel.append(gameNameInput);

      loggedBox.append(loggedHeader, gameNameLabel);
      authContainer.append(loggedBox);
      return;
    }

    const tabsBar = document.createElement('div');
    tabsBar.className = 'auth-tabs';
    const tabLoginBtn = createIconButton('log-in', 'ĐĂNG NHẬP', () => {
      authTab = 'login';
      error.textContent = '';
      renderAuthSection();
    });
    tabLoginBtn.classList.toggle('active', authTab === 'login');
    const tabRegBtn = createIconButton('user-plus', 'ĐĂNG KÝ', () => {
      authTab = 'register';
      error.textContent = '';
      renderAuthSection();
    });
    tabRegBtn.classList.toggle('active', authTab === 'register');
    tabsBar.append(tabLoginBtn, tabRegBtn);
    authContainer.append(tabsBar);

    if (authTab === 'login') {
      const form = document.createElement('div');
      form.className = 'auth-form auth-form-login';

      const userLabel = document.createElement('label');
      userLabel.textContent = 'Username';
      loginUserInput = gameNameInput;
      loginUserInput.placeholder = 'Username';
      userLabel.append(loginUserInput);

      const passLabel = document.createElement('label');
      passLabel.textContent = 'Mật khẩu';
      const passRow = document.createElement('div');
      passRow.className = 'auth-pass-row';
      loginPassInput = document.createElement('input');
      loginPassInput.type = 'password';
      loginPassInput.className = 'auth-password-input';
      loginPassInput.placeholder = 'Mật khẩu';
      loginPassInput.value = '123';

      const submitLogin = createIconButton('log-in', 'VÀO TK', () => {
        const res = loginAccount(loginUserInput.value, loginPassInput.value, selectedVariant);
        if (!res.ok) {
          error.textContent = res.error;
          return;
        }
        error.textContent = '';
        gameNameInput.value = res.account.gameName;
        updateRankBanner();
        renderAuthSection();
        renderLeaderboardRows();
      });

      passRow.append(loginPassInput, submitLogin);
      passLabel.append(passRow);
      form.append(userLabel, passLabel);
      authContainer.append(form);
    } else {
      const form = document.createElement('div');
      form.className = 'auth-form auth-form-register';

      const regRow1 = document.createElement('div');
      regRow1.className = 'auth-two-cols';

      const userLabel = document.createElement('label');
      userLabel.textContent = 'Username';
      regUserInput = document.createElement('input');
      regUserInput.className = 'reg-username-input';
      regUserInput.placeholder = 'Username';
      regUserInput.addEventListener('input', () => {
        regUserInput.value = Array.from(regUserInput.value).slice(0, MAX_NAME_LENGTH).join('');
      });
      userLabel.append(regUserInput);

      const gameLabel = document.createElement('label');
      gameLabel.textContent = 'Tên game';
      gameNameInput.placeholder = 'Tên hiển thị';
      gameLabel.append(gameNameInput);
      regRow1.append(userLabel, gameLabel);

      const regRow2 = document.createElement('div');
      regRow2.className = 'auth-two-cols';

      const passLabel = document.createElement('label');
      passLabel.textContent = 'Mật khẩu';
      regPassInput = document.createElement('input');
      regPassInput.type = 'password';
      regPassInput.className = 'reg-password-input';
      regPassInput.placeholder = 'Mật khẩu';
      passLabel.append(regPassInput);

      const confirmLabel = document.createElement('label');
      confirmLabel.textContent = 'Xác nhận MK';
      regConfirmInput = document.createElement('input');
      regConfirmInput.type = 'password';
      regConfirmInput.className = 'reg-confirm-input';
      regConfirmInput.placeholder = 'Nhập lại MK';
      confirmLabel.append(regConfirmInput);
      regRow2.append(passLabel, confirmLabel);

      const submitReg = createIconButton('user-plus', 'TẠO TÀI KHOẢN', () => {
        const res = registerAccount(
          regUserInput.value,
          gameNameInput.value,
          regPassInput.value,
          regConfirmInput.value,
          selectedVariant,
        );
        if (!res.ok) {
          error.textContent = res.error;
          return;
        }
        error.textContent = '';
        gameNameInput.value = res.account.gameName;
        updateRankBanner();
        renderAuthSection();
        renderLeaderboardRows();
      });
      submitReg.classList.add('auth-submit-full');

      form.append(regRow1, regRow2, submitReg);
      authContainer.append(form);
    }
  };

  const charTitle = document.createElement('div');
  charTitle.className = 'char-picker-title';
  charTitle.textContent = 'NHÂN VẬT';
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
      updateActiveAccountProfile(gameNameInput.value, selectedVariant);
      updateDetailText(selectedVariant);
      for (const item of charCards) item.classList.toggle('selected', item === card);
      renderLeaderboardRows();
    });
    charCards.push(card);
    charGrid.append(card);
  }

  const roomBox = document.createElement('section');
  roomBox.className = 'home-box home-box-room';
  const roomLabel = document.createElement('label');
  roomLabel.textContent = 'PHÒNG RIÊNG';
  const roomRow = document.createElement('div');
  roomRow.className = 'room-input-row';
  const roomCode = document.createElement('input');
  roomCode.placeholder = 'Mã 4 chữ';
  roomCode.value = parseRoute(location.hash).roomCode ?? '';

  const lbHeader = document.createElement('div');
  lbHeader.className = 'lb-header';
  const lbTitle = document.createElement('div');
  lbTitle.className = 'lb-title';
  lbTitle.textContent = 'BẢNG XẾP HẠNG';
  const lbRule = document.createElement('div');
  lbRule.className = 'lb-rule';
  lbRule.textContent = '1 THẮNG = +1 SAO';
  lbHeader.append(lbTitle, lbRule);

  const lbList = document.createElement('div');
  lbList.className = 'lb-list';
  const renderLeaderboardRows = () => {
    lbList.replaceChildren();
    const entries = getLeaderboard(gameNameInput.value, selectedVariant);
    entries.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = `lb-row ${entry.isSelf ? 'lb-row-self' : ''} lb-rank-${index + 1}`;
      const rankNum = document.createElement('span');
      rankNum.className = 'lb-pos';
      rankNum.textContent = `#${index + 1}`;
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
      tierTag.textContent = entryTier.name;
      const starCount = document.createElement('span');
      starCount.className = 'lb-stars';
      starCount.textContent = `${entry.stars} SAO`;
      row.append(rankNum, avatarWrap, entryName, tierTag, starCount);
      lbList.append(row);
    });
  };

  renderAuthSection();
  renderLeaderboardRows();
  nameBox.append(rankBanner, authContainer, charTitle, charGrid, charDetail);
  leaderboardPanel.append(lbHeader, lbList);

  const resolvePlayerCredentials = (): { username: string; gameName: string } | null => {
    const current = getActiveAccount();
    if (current) {
      const updatedGameName = normalizeName(gameNameInput.value) ?? current.gameName;
      updateActiveAccountProfile(updatedGameName, selectedVariant);
      error.textContent = '';
      return { username: current.username, gameName: updatedGameName };
    }
    const cleanGame = normalizeName(gameNameInput.value);
    if (!cleanGame) {
      error.textContent = 'Vui lòng nhập Tên của bạn';
      return null;
    }
    const rawUser = authTab === 'register' && normalizeName(regUserInput.value)
      ? normalizeName(regUserInput.value)!
      : cleanGame;
    const rawPass = (authTab === 'register' ? regPassInput.value : loginPassInput.value).trim() || '123';
    const authRes = registerOrLoginAccount(rawUser, rawPass, selectedVariant, cleanGame);
    if (!authRes.ok) {
      error.textContent = authRes.error;
      return null;
    }
    error.textContent = '';
    updateRankBanner();
    renderAuthSection();
    renderLeaderboardRows();
    return { username: authRes.account.username, gameName: authRes.account.gameName };
  };

  const join = async (mode: 'private' | 'code' | 'public'): Promise<void> => {
    const creds = resolvePlayerCredentials();
    if (!creds) return;
    error.textContent = 'Đang kết nối…';
    try {
      const client = connect();
      const room = mode === 'private'
        ? await client.createPrivate(creds.gameName, selectedVariant, creds.username)
        : mode === 'code'
          ? await client.joinByCode(roomCode.value, creds.gameName, selectedVariant, creds.username)
          : await client.quickMatch(creds.gameName, selectedVariant, creds.username);
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
    const creds = resolvePlayerCredentials();
    if (!creds) return;
    startPractice(root);
  });

  roomRow.append(roomCode, enter);
  roomLabel.append(roomRow);
  roomBox.append(roomLabel, create);

  panel.append(nameBox, roomBox, quick, button, error);
  layout.append(panel, leaderboardPanel);
  root.append(layout);
}
