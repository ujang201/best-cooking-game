// Input: mouse clicks and keyboard, mapped to game actions.
// One clear job: translate events into calls on the game object.
import { INGREDIENTS, LAYOUT } from './config.js';

function inside(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function canvasPos(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

export function binRect(index) {
  const { x, y } = LAYOUT.counter;
  return { x: x + 16 + index * 150, y: y + 44, w: 138, h: 52 };
}

export function stationSlotRect(box, index) {
  return { x: box.x + 30 + index * 130, y: box.y + 52, w: 110, h: 78 };
}

export function attachInput(canvas, game) {
  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPos(canvas, event);
    game.hoverBin = null;
    INGREDIENTS.forEach((ing, i) => {
      if (inside(p.x, p.y, binRect(i))) game.hoverBin = ing.id;
    });
    for (const key of ['serve', 'trash', 'start', 'restart']) {
      const b = game.buttons[key];
      if (b) b.hover = inside(p.x, p.y, b);
    }
  });

  canvas.addEventListener('click', (event) => {
    const p = canvasPos(canvas, event);
    game.onClick(p.x, p.y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    game.onKey(event.key);
  });
}

// Hit-test a click; returns what was hit, or null.
export function hitTest(game, px, py) {
  if (game.screen === 'title' && inside(px, py, game.buttons.start)) return { kind: 'start' };
  if (game.screen === 'over' && inside(px, py, game.buttons.restart)) return { kind: 'restart' };
  if (game.screen !== 'playing') return null;
  if (inside(px, py, game.buttons.serve)) return { kind: 'serve' };
  if (inside(px, py, game.buttons.trash)) return { kind: 'trash' };
  for (let i = 0; i < 2; i++) {
    if (inside(px, py, stationSlotRect(LAYOUT.grill, i))) return { kind: 'grill', index: i };
    if (inside(px, py, stationSlotRect(LAYOUT.oven, i))) return { kind: 'oven', index: i };
  }
  for (let i = 0; i < INGREDIENTS.length; i++) {
    if (inside(px, py, binRect(i))) return { kind: 'bin', id: INGREDIENTS[i].id };
  }
  return null;
}
