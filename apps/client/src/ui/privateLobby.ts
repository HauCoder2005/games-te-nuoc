import { createMatch, DT, INTERP_DELAY_MS, MSG, VIEW_H, VIEW_W } from '@te-nuoc/shared';
import type { GameEvent, InputFrame, RosterEntry, Team, World } from '@te-nuoc/shared';
import type { GameRoom } from '../net/colyseus';
import { serverErrorMessage } from '../net/colyseus';
import { Interpolator } from '../net/interp';
import { Predictor } from '../net/predict';
import { createInput } from '../input/keyboardMouse';
import { createRenderer } from '../render/renderer';
import { loadSprites } from '../render/sprites';
import { updateHud, killFeedLine } from './hud';
import { playSfx, unlockAudio } from '../audio/sfx';
import { showHome } from './home';

function button(label: string, action: () => void): HTMLButtonElement {
  const element = document.createElement('button');
  element.textContent = label;
  element.addEventListener('click', action);
  return element;
}

function worldFromRoom(room: GameRoom, current: World | null): World | null {
  const game = room.state.game;
  if (room.state.lobby.phase !== 'match') return null;
  const entries: RosterEntry[] = [...game.players.values()].map((player) => ({
    slot: player.slot, team: player.team, variant: player.variant, isBot: player.isBot, joinOrder: player.slot,
  }));
  if (!entries.length) return null;
  const world = current ?? createMatch(1, entries, {
    teamSize: room.state.lobby.teamSize === 4 ? 4 : 5,
    scoreToWin: room.state.lobby.scoreToWin === 5 ? 5 : room.state.lobby.scoreToWin === 15 ? 15 : 10,
  });
  world.players = [...game.players.values()].map((source) => {
    const target = world.players.find((player) => player.slot === source.slot)
      ?? createMatch(1, [{ slot: source.slot, team: source.team, variant: source.variant,
        isBot: source.isBot, joinOrder: source.slot }], world.settings).players[0];
    Object.assign(target, { slot: source.slot, team: source.team, variant: source.variant, isBot: source.isBot,
      x: source.x, y: source.y, wet: source.wet, status: source.status, timer: source.timer,
      ammo: source.ammo, facing: source.facing, aimX: source.aimX, aimY: source.aimY, ackSeq: source.ackSeq });
    target.stats.ko = source.ko;
    return target;
  });
  world.balloons = [...game.balloons.values()].map((balloon) => ({
    ...balloon, dx: 0, dy: 0, traveled: 0, maxDist: 1,
  }));
  world.raft = { ...world.raft, w: game.raftW, h: game.raftH, warn: game.warn };
  world.score = [game.red, game.blue];
  world.phase = game.phase as World['phase'];
  world.timeLeft = game.timeLeft;
  world.time += DT;
  return world;
}

export function showRoom(root: HTMLElement, room: GameRoom): () => void {
  unlockAudio();
  let stopped = false;
  let request = 0;
  let timer = 0;
  let world: World | null = null;
  let lastPhase = '';
  let lastLobbySignature = '';
  let predictor: Predictor | null = null;
  const samples = new Map<number, Interpolator>();
  const lastServerPosition = new Map<number, { x: number; y: number }>();
  const feed: { text: string; expires: number }[] = [];
  const panel = document.createElement('main');
  panel.className = 'online';
  root.replaceChildren(panel);
  panel.textContent = 'Đang kết nối…';
  const dispose = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(request);
    clearInterval(timer);
    input?.destroy();
    void room.leave();
  };
  const leave = button('Rời phòng', () => { dispose(); showHome(root); });
  const error = document.createElement('p');
  error.className = 'error';
  room.onMessage(MSG.error, (message: unknown) => {
    error.textContent = typeof message === 'object' && message !== null && 'code' in message
      ? serverErrorMessage(message.code) : serverErrorMessage(null);
  });
  room.onMessage(MSG.events, (message: unknown) => {
    if (!Array.isArray(message)) return;
    const events = message as GameEvent[];
    const names = new Map<number, string>();
    const teams = new Map<number, Team>();
    for (const player of room.state.game.players.values()) {
      names.set(player.slot, player.name);
      teams.set(player.slot, player.team);
    }
    for (const event of events) {
      playSfx(event);
      const line = killFeedLine(event, names, teams);
      if (line) feed.push({ text: line.map((part) => part.text).join(''), expires: performance.now() + 4000 });
    }
    renderer?.pushEvents(events, world?.time ?? 0);
  });
  room.onLeave(() => { if (!stopped) { dispose(); showHome(root); } });

  let input: ReturnType<typeof createInput> | null = null;
  let renderer: ReturnType<typeof createRenderer> | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let hud: HTMLDivElement | null = null;
  let overlay: HTMLCanvasElement | null = null;

  function showLobby(): void {
    const lobby = room.state.lobby;
    panel.replaceChildren();
    const heading = document.createElement('h1');
    heading.textContent = lobby.mode === 'private' ? `Phòng ${lobby.code}` : 'Đang tìm người chơi…';
    panel.append(heading);
    if (lobby.mode === 'private') panel.append(button('Copy link', () => {
      void navigator.clipboard.writeText(`${location.origin}/#/r/${lobby.code}`);
    }));
    const teams = document.createElement('div');
    teams.className = 'teams';
    for (const team of [0, 1] as const) {
      const column = document.createElement('section');
      const title = document.createElement('h2');
      title.textContent = team === 0 ? 'ĐỘI ĐỎ' : 'ĐỘI XANH';
      column.append(title);
      const members = [...lobby.players.values()].filter((member) => member.team === team).sort((a, b) => a.slot - b.slot);
      for (const member of members) {
        const row = document.createElement('div');
        row.className = `lobby-player team-${team}`;
        row.textContent = `${member.sessionId === lobby.hostSessionId ? '♛ ' : ''}${member.name}${member.ready ? ' ✓' : ''}`;
        column.append(row);
      }
      for (let index = members.length; index < lobby.teamSize; index++) {
        const row = document.createElement('div');
        row.className = 'lobby-empty';
        row.textContent = lobby.botFill ? 'bot' : 'trống';
        column.append(row);
      }
      if (lobby.mode === 'private') column.append(button('Sang đội này', () => room.send(MSG.team, { team })));
      teams.append(column);
    }
    panel.append(teams);
    const isHost = room.sessionId === lobby.hostSessionId;
    if (lobby.mode === 'private' && isHost) {
      const controls = document.createElement('div');
      controls.className = 'settings';
      controls.append(button(lobby.teamSize === 4 ? '4v4' : '5v5', () => room.send(MSG.settings, { teamSize: lobby.teamSize === 4 ? 5 : 4 })));
      for (const score of [5, 10, 15]) controls.append(button(`${score} điểm${score === lobby.scoreToWin ? ' ✓' : ''}`, () => room.send(MSG.settings, { scoreToWin: score })));
      controls.append(button(`Lấp chỗ trống bằng bot: ${lobby.botFill ? 'Bật' : 'Tắt'}`, () => room.send(MSG.settings, { botFill: !lobby.botFill })));
      controls.append(button('Xáo đội', () => room.send(MSG.shuffle, {})));
      panel.append(controls);
    }
    if (lobby.mode === 'private') {
      if (isHost) panel.append(button('Bắt đầu', () => room.send(MSG.start, {})));
      else {
        const waiting = document.createElement('p'); waiting.textContent = 'Chờ chủ phòng bắt đầu…'; panel.append(waiting);
      }
    } else {
      const member = lobby.players.get(room.sessionId);
      panel.append(button(member?.ready ? 'Bắt đầu ✓' : 'Bắt đầu', () => room.send(MSG.ready, { on: !member?.ready })));
      if (lobby.players.size < 2) {
        const hint = document.createElement('p'); hint.textContent = 'Cần ít nhất 2 người'; panel.append(hint);
      }
      if (lobby.countdown > 0) {
        const hint = document.createElement('p'); hint.textContent = `Trận bắt đầu sau ${Math.ceil(lobby.countdown)} giây`; panel.append(hint);
      }
    }
    panel.append(error, leave);
  }

  function showGame(): void {
    panel.replaceChildren();
    panel.className = 'practice';
    const stack = document.createElement('div');
    stack.className = 'game-stack';
    canvas = document.createElement('canvas');
    overlay = document.createElement('canvas');
    hud = document.createElement('div');
    hud.className = 'hud';
    stack.append(canvas, overlay);
    panel.append(stack, hud, error, leave);
    renderer = createRenderer(canvas, overlay, null);
    input = createInput(window, canvas, (cx, cy) => {
      const bounds = canvas!.getBoundingClientRect();
      return { x: Math.max(0, Math.min(VIEW_W, (cx - bounds.left) * VIEW_W / bounds.width)),
        y: Math.max(0, Math.min(VIEW_H, (cy - bounds.top) * VIEW_H / bounds.height)) };
    });
    void loadSprites('/assets/manifest.json').then((bank) => {
      if (!stopped && canvas && overlay) renderer = createRenderer(canvas, overlay, bank);
    }).catch(() => { /* Shape fallback. */ });
    timer = window.setInterval(() => {
      if (!input || !world) return;
      const frame: InputFrame = input.sample();
      room.send(MSG.input, { s: frame.seq, mx: frame.mx, my: frame.my, ax: frame.ax, ay: frame.ay, th: frame.th, da: frame.da });
      predictor?.apply(frame);
    }, DT * 1000);
  }

  function frame(now: number): void {
    if (stopped) return;
    if (!room.state?.lobby || !room.state.game) {
      request = requestAnimationFrame(frame);
      return;
    }
    const phase = room.state.lobby.phase;
    if (phase !== lastPhase) {
      lastPhase = phase;
      input?.destroy(); input = null;
      clearInterval(timer);
      if (phase === 'match') showGame(); else { panel.className = 'online'; world = null; lastLobbySignature = ''; }
    }
    if (phase === 'lobby') {
      const lobby = room.state.lobby;
      const signature = JSON.stringify([lobby.code, lobby.hostSessionId, lobby.countdown,
        lobby.teamSize, lobby.scoreToWin, lobby.botFill,
        [...lobby.players.values()].map((member) => [member.sessionId, member.name, member.team, member.ready])]);
      if (signature !== lastLobbySignature) { lastLobbySignature = signature; showLobby(); }
    }
    else if (renderer && hud) {
      world = worldFromRoom(room, world);
      if (world) {
        const ownSlot = room.state.lobby.players.get(room.sessionId)?.slot ?? -1;
        const own = world.players.find((player) => player.slot === ownSlot);
        const received = room.state.game.players.get(String(ownSlot));
        if (own && received) {
          predictor ??= new Predictor(own.x, own.y);
          predictor.reconcile(received);
          own.x = predictor.position.x; own.y = predictor.position.y;
        }
        for (const player of world.players) {
          if (player.slot === ownSlot) continue;
          let sample = samples.get(player.slot);
          if (!sample) { sample = new Interpolator(); samples.set(player.slot, sample); }
          const previous = lastServerPosition.get(player.slot);
          if (!previous || previous.x !== player.x || previous.y !== player.y) {
            sample.push(now, { x: player.x, y: player.y });
            lastServerPosition.set(player.slot, { x: player.x, y: player.y });
          }
          const point = sample.sample(now - INTERP_DELAY_MS);
          player.x = point.x; player.y = point.y;
        }
        const names = new Map<number, string>();
        for (const player of room.state.game.players.values()) names.set(player.slot, player.name);
        while (feed.length && feed[0].expires < now) feed.shift();
        renderer.draw({ ...world, names }, ownSlot);
        updateHud(hud, world, names, feed.map((entry) => entry.text));
      }
    }
    request = requestAnimationFrame(frame);
  }
  request = requestAnimationFrame(frame);
  return dispose;
}
