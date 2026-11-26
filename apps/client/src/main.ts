import '@fontsource/vt323/400.css';
import './style.css';
import { createMatch } from '@te-nuoc/shared';
import { createRenderer } from './render/renderer';
import { loadSprites } from './render/sprites';

const root = document.getElementById('app');
if (!root) throw new Error('Thiếu vùng giao diện');
const stack = document.createElement('div');
stack.className = 'game-stack';
const canvas = document.createElement('canvas');
const overlay = document.createElement('canvas');
stack.append(canvas, overlay);
root.append(stack);

const roster = Array.from({ length: 8 }, (_, slot) => ({
  slot, team: (slot < 4 ? 0 : 1) as 0 | 1, variant: slot % 4,
  isBot: slot !== 0, joinOrder: slot,
}));
const world = createMatch(1, roster, { teamSize: 4, scoreToWin: 10 });
loadSprites('/assets/manifest.json').then((bank) => {
  const renderer = createRenderer(canvas, overlay, bank);
  renderer.draw(world, 0);
  window.addEventListener('resize', () => renderer.draw(world, 0));
}).catch(() => {
  const renderer = createRenderer(canvas, overlay, null);
  renderer.draw(world, 0);
  window.addEventListener('resize', () => renderer.draw(world, 0));
});
