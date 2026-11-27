export const VIEW_W = 640;
export const VIEW_H = 360;
export const JOYSTICK_DEADZONE_PX = 4;
export const LEADERBOARD_REFRESH_MS = 5000;
export const TILE = 16;
export const DT = 1 / 30;
export const LOBBY_TICK_MS = 100;
export const POOL_RECT = { x0: 24, y0: 60, x1: 616, y1: 338 } as const;
export const RAFT_CENTER = { x: 320, y: 199 } as const;
export const RAFT_W = 32;
export const RAFT_H = 14;
export const RAFT_MIN_W = 20;
export const RAFT_MIN_H = 4;
export const COVERS = [{ x: 200, y: 143 }, { x: 440, y: 143 }, { x: 200, y: 255 }, { x: 440, y: 255 }] as const;
export const MATCH_TIME = 300;
export const LAST_MINUTE_AT = 60;
export const GOLDEN_SHRINK_EVERY = 20;
export const SCORE_TO_WIN = 10;
export const START_COUNTDOWN = 3;
export const MATCH_END_TIME = 10;
export const SHRINK_WARNING = 3;
export const RESPAWN_TIME = 3;
export const SPAWN_PROTECT = 1.5;
export const SPAWN_CLEARANCE = 12;
export const SPAWN_TRIES = 16;
export const PLAYER_RADIUS = 5;
export const MOVE_SPEED = 108;
export const MOVE_ACCEL = 22;
export const BALLOON_SPEED = 320;
export const BALLOON_RANGE_MIN = 24;
export const BALLOON_RANGE_MAX = 190;
export const BALLOON_RADIUS = 3;
export const BALLOON_SPAWN_OFFSET = 8;
export const BALLOON_ARC_HEIGHT = 8;
export const SPLASH_RADIUS = 18;
export const AMMO_MAX = 3;
export const AMMO_REGEN = 0.85;
export const THROW_COOLDOWN = 0.18;
export const KB_DIRECT = 85;
export const KB_SPLASH = 55;
export const KB_DASH = 120;
export const WET_DIRECT = 10;
export const WET_SPLASH = 5;
export const WET_DASH = 8;
export const WET_SCALE = 50;
export const KB_DECAY = 4.5;
export const HITSTUN = 0.25;
export const HITSTUN_CONTROL = 0.3;
export const DASH_SPEED = 300;
export const DASH_TIME = 0.18;
export const DASH_COOLDOWN = 2;
export const FALL_TIME = 0.6;
export const KO_CREDIT_WINDOW = 3;
export const PILLAR_RADIUS = 48;
export const PILLAR_CAPTURE_TIME = 20;
export const PILLAR_DECAY_RATE = 0.35;
export const PILLAR_HOLD_SCORE_TIME = 8;
export const TOTAL_ROUNDS = 5;
export const CHAIN_KB_MIN = 120;
export const CHAIN_TRANSFER = 0.4;
export const CHAIN_COOLDOWN = 0.3;
export const BOT_MIN_DIST = 70;
export const BOT_MAX_DIST = 140;
export const BOT_EDGE_DIST = 24;
export const BOT_REACT_MIN = 0.15;
export const BOT_REACT_MAX = 0.3;
export const BOT_DASH_DIST = 35;
export const BOT_DASH_CHANCE = 0.08;
export const MAX_PLAYERS = 10;
export const PUBLIC_MIN_HUMANS = 2;
export const PUBLIC_HALF_READY_WAIT = 20;
export const PUBLIC_FULL_WAIT = 10;
export const RECONNECT_GRACE = 20;
export const MAX_ROOMS_PER_IP_PER_MIN = 5;
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const MAX_MSGS_PER_SEC = 60;
export const MSG_WINDOW_MS = 1000;
export const TICK_METRICS_EVERY = 900;
export const LOADTEST_CLIENTS = 100;
export const LOADTEST_DURATION_MS = 120_000;
export const INTERP_DELAY_MS = 120;
export const INTERP_EXTRAP_MS = 100;
export const PREDICT_SNAP_PX = 24;
export const PREDICT_BLEND = 0.2;
export const PROTOCOL_VERSION = 3;
export const TEAM_COLORS = ['#E53B3B', '#3B8BF0'] as const;
export const TEAM_NAME_COLORS = ['#FF7A7A', '#6EC1FF'] as const;
export const SELF_NAME_COLOR = '#FFE066';
export const NAME_TAG_FONT_PX = 12;
export const NAME_TAG_STROKE_PX = 2.5;
export const NAME_TAG_SIDE_GAP = 11;
export const NAME_TAG_TOP_OFFSET = 25;
export const NAME_TAG_SIDE_Y_OFFSET = 10;
export const CHARACTER_VARIANTS = [
  {
    id: 0,
    label: 'Tèo',
    role: 'Nam · Da vàng',
    detail: 'Tóc đen ngắn · Kính xanh',
    gender: 'male',
    skin: '#D9A06A',
    skinShade: '#B8885A',
    hair: '#22202A',
    hairStyle: 'spiky',
    goggle: '#8FE3FF',
    blush: '#C87D55',
  },
  {
    id: 1,
    label: 'Na',
    role: 'Nữ · Da trắng',
    detail: 'Tóc nâu buộc 2 bên · Kính vàng',
    gender: 'female',
    skin: '#F6D2B0',
    skinShade: '#D9B290',
    hair: '#6B3E26',
    hairStyle: 'pigtails',
    goggle: '#FFE066',
    blush: '#FF9EAA',
  },
  {
    id: 2,
    label: 'Bin',
    role: 'Nam · Da đen',
    detail: 'Tóc xoăn đen · Kính lục',
    gender: 'male',
    skin: '#8D5524',
    skinShade: '#6E411B',
    hair: '#1A1822',
    hairStyle: 'curly',
    goggle: '#9BF07A',
    blush: '#753F18',
  },
  {
    id: 3,
    label: 'Su',
    role: 'Nữ · Da vàng',
    detail: 'Tóc đen dài · Kính hồng',
    gender: 'female',
    skin: '#E8B48A',
    skinShade: '#C7966E',
    hair: '#1E1B28',
    hairStyle: 'long',
    goggle: '#FF94C2',
    blush: '#F27D9C',
  },
  {
    id: 4,
    label: 'Mai',
    role: 'Nữ · Da trắng',
    detail: 'Tóc vàng đuôi gà · Kính cam',
    gender: 'female',
    skin: '#F6D2B0',
    skinShade: '#D9B290',
    hair: '#F0B429',
    hairStyle: 'ponytail',
    goggle: '#FFA64D',
    blush: '#FF9EAA',
  },
] as const;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ROOM_CODE_LENGTH = 4;
export const ROOM_CODE_SET = '$roomcodes';
export const MAX_NAME_LENGTH = 12;
export const RNG_INCREMENT = 0x6D2B79F5;
export const RNG_DIVISOR = 4294967296;
