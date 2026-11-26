import { botInput, botName, createBotMemory, createMatch, DT, step, VIEW_H, VIEW_W } from '@te-nuoc/shared';
import type { InputFrame, RosterEntry } from '@te-nuoc/shared';
import { unlockAudio, playSfx } from '../audio/sfx';
import { createInput } from '../input/keyboardMouse';
import { createRenderer } from '../render/renderer';
import { loadSprites } from '../render/sprites';
import { showHome } from '../ui/home';
import { killFeedLine, updateHud } from '../ui/hud';

export function startPractice(root: HTMLElement): () => void {
  unlockAudio();
  root.replaceChildren();
  const panel = document.createElement('div');
  panel.className = 'practice';
  const stack = document.createElement('div');
  stack.className = 'game-stack';
  const canvas = document.createElement('canvas');
  const overlay = document.createElement('canvas');
  stack.append(canvas, overlay);
  const hud = document.createElement('div');
  hud.className = 'hud';
  const leave = document.createElement('button');
  leave.className = 'leave';
  leave.textContent = 'Rời phòng';
  panel.append(stack, hud, leave);
  root.append(panel);

  const roster: RosterEntry[] = Array.from({ length: 8 }, (_, slot) => ({
    slot, team: slot < 4 ? 0 : 1, variant: slot % 4, isBot: slot !== 0, joinOrder: slot,
  }));
  const names = new Map<number, string>();
  names.set(0, localStorage.getItem('te-nuoc-name') ?? 'Bạn');
  for (const entry of roster.slice(1)) names.set(entry.slot, botName([...names.values()]));
  const world = createMatch(Math.floor(Math.random() * 0xffffffff), roster, { teamSize: 4, scoreToWin: 10 });
  const teams = new Map(roster.map((entry) => [entry.slot, entry.team]));
  const memories = new Map(roster.slice(1).map((entry) => [entry.slot, createBotMemory(entry.slot + 1)]));
  const source = createInput(window, canvas, (cx, cy) => {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(VIEW_W, (cx - bounds.left) * VIEW_W / bounds.width)),
      y: Math.max(0, Math.min(VIEW_H, (cy - bounds.top) * VIEW_H / bounds.height)),
    };
  });
  let renderer = createRenderer(canvas, overlay, null);
  let stopped = false;
  let request = 0;
  let lastTime = performance.now();
  let accumulator = 0;
  const feed: { text: string; expires: number }[] = [];
  let resultShown = false;
  const stop = () => {
    stopped = true;
    cancelAnimationFrame(request);
    source.destroy();
  };
  leave.addEventListener('click', () => { stop(); showHome(root); });

  void loadSprites('/assets/manifest.json').then((bank) => {
    if (!stopped) renderer = createRenderer(canvas, overlay, bank);
  }).catch(() => { /* Keep shape fallback. */ });

  const frame = (now: number) => {
    if (stopped) return;
    accumulator += Math.min(0.25, (now - lastTime) / 1000);
    lastTime = now;
    while (accumulator >= DT) {
      const inputs = new Map<number, InputFrame>([[0, source.sample()]]);
      for (const entry of roster.slice(1)) inputs.set(entry.slot, botInput(world, entry.slot, memories.get(entry.slot)!));
      const events = step(world, inputs, DT);
      for (const event of events) {
        playSfx(event);
        const line = killFeedLine(event, names, teams);
        if (line) feed.push({ text: line.map((part) => part.text).join(''), expires: now + 4000 });
      }
      renderer.pushEvents(events, world.time);
      accumulator -= DT;
    }
    while (feed.length && feed[0].expires < now) feed.shift();
    renderer.draw({ ...world, names }, 0);
    updateHud(hud, world, names, feed.map((entry) => entry.text));
    if (world.phase === 'matchEnd' && !resultShown) {
      resultShown = true;
      const result = document.createElement('div');
      result.className = 'result';
      result.textContent = `${world.winner === 0 ? 'ĐỘI ĐỎ' : 'ĐỘI XANH'} THẮNG! · ${world.score[0]} : ${world.score[1]}`;
      panel.append(result);
    }
    request = requestAnimationFrame(frame);
  };
  request = requestAnimationFrame(frame);
  return stop;
}
