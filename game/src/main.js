// Main: the game itself. Owns the state, the loop, and every action
// (start, add ingredient, collect, serve, trash, restart). Draws via render.js.
import { VIEW, LAYOUT, SHIFT_SECONDS, MAX_LIVES, INGREDIENTS, ingredientById } from './config.js';
import { mulberry32 } from './random.js';
import { makeOrderBoard, tickOrders, findMatchingOrder } from './orders.js';
import { makeKitchen, addIngredient, collectFromStation, tickKitchen, clearPlate, setMessage } from './kitchen.js';
import { renderAll } from './render.js';
import { attachInput, hitTest } from './input.js';
import { sfx, ensureAudio, startMusic, stopMusic, toggleMute, isMuted } from './audio.js';
import { shotMode, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW.w * dpr;
  canvas.height = VIEW.h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function makeButtons() {
  const s = LAYOUT.side;
  return {
    serve: { x: s.x + 20, y: s.y + 52, w: s.w - 40, h: 56, hover: false },
    trash: { x: s.x + 20, y: s.y + 120, w: s.w - 40, h: 48, hover: false },
    start: { x: 640 - 170, y: 300 + 76, w: 340, h: 56, hover: false },
    restart: { x: 640 - 170, y: 320 + 84, w: 340, h: 56, hover: false },
  };
}

const game = {
  screen: 'title', // 'title' | 'playing' | 'over'
  rng: mulberry32((Date.now() % 2147483647) || 1),
  board: null,
  kitchen: null,
  buttons: makeButtons(),
  score: 0,
  coins: 0,
  lives: MAX_LIVES,
  combo: 0,
  bestCombo: 0,
  served: 0,
  timeLeft: SHIFT_SECONDS,
  now: 0,
  hoverBin: null,
  lastTick: 0,
  frozen: false, // shot mode: render one fixed frame, no loop updates

  reset() {
    this.rng = mulberry32((Date.now() % 2147483647) || 1);
    this.board = makeOrderBoard(this.rng);
    this.kitchen = makeKitchen();
    this.score = 0;
    this.coins = 0;
    this.lives = MAX_LIVES;
    this.combo = 0;
    this.bestCombo = 0;
    this.served = 0;
    this.timeLeft = SHIFT_SECONDS;
    this.now = 0;
  },

  start() {
    this.reset();
    this.screen = 'playing';
    ensureAudio();
    startMusic();
    sfx.start();
    this.announce('Shift started. Cook the orders before time runs out!');
  },

  endShift() {
    this.screen = 'over';
    stopMusic();
    sfx.over();
    this.announce(`Shift over. Score ${this.score}, ${this.served} dishes served.`);
  },

  announce(msg) {
    statusEl.textContent = msg;
  },

  servePlate() {
    if (this.screen !== 'playing') return;
    if (this.kitchen.plate.length === 0) {
      setMessage(this.kitchen, 'Plate is empty!', this.now);
      return;
    }
    const match = findMatchingOrder(this.board, this.kitchen.plate);
    if (!match) {
      this.lives -= 1;
      this.combo = 0;
      sfx.buzz();
      setMessage(this.kitchen, 'Wrong dish! −1 ❤️', this.now);
      clearPlate(this.kitchen);
      if (this.lives <= 0) this.endShift();
      return;
    }
    const { order, dish } = match;
    const timeBonus = Math.ceil(order.timeLeft) * 2;
    const comboBonus = this.combo * 10;
    const earned = dish.price + timeBonus + comboBonus;
    this.score += earned;
    this.coins += dish.price;
    this.served += 1;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.board.orders = this.board.orders.filter((o) => o.id !== order.id);
    clearPlate(this.kitchen);
    sfx.serve();
    setMessage(this.kitchen, `${dish.emoji} ${dish.name} served! +${earned}`, this.now);
    this.announce(`${dish.name} served for ${earned} points.`);
  },

  onClick(px, py) {
    ensureAudio();
    const hit = hitTest(this, px, py);
    if (!hit) return;
    if (hit.kind === 'start') { this.start(); return; }
    if (hit.kind === 'restart') { this.start(); return; }
    if (hit.kind === 'serve') { this.servePlate(); return; }
    if (hit.kind === 'trash') {
      clearPlate(this.kitchen);
      sfx.pop();
      setMessage(this.kitchen, 'Plate cleared.', this.now);
      return;
    }
    if (hit.kind === 'grill' || hit.kind === 'oven') {
      if (collectFromStation(this.kitchen, hit.kind, hit.index, this.now)) {
        sfx.place();
        setMessage(this.kitchen, 'On the plate!', this.now);
      } else {
        sfx.tick();
      }
      return;
    }
    if (hit.kind === 'bin') {
      const result = addIngredient(this.kitchen, hit.id, this.now);
      if (result === 'plate') sfx.place();
      else if (result === 'grill' || result === 'oven') sfx.pop();
      else sfx.buzz();
    }
  },

  onKey(key) {
    if (key === 'm' || key === 'M') { toggleMute(); return; }
    if (this.screen === 'title' && (key === 'Enter' || key === ' ')) { this.start(); return; }
    if (this.screen === 'over' && (key === 'r' || key === 'R' || key === 'Enter')) { this.start(); return; }
    if (this.screen !== 'playing') return;
    if (key === ' ' || key === 'Enter') { this.servePlate(); return; }
    if (key === 't' || key === 'T') {
      clearPlate(this.kitchen);
      sfx.pop();
      setMessage(this.kitchen, 'Plate cleared.', this.now);
      return;
    }
    const ing = INGREDIENTS.find((i) => i.key === key);
    if (ing) {
      ensureAudio();
      const result = addIngredient(this.kitchen, ing.id, this.now);
      if (result === 'plate') sfx.place();
      else if (result === 'grill' || result === 'oven') sfx.pop();
      else sfx.buzz();
    }
  },
};

function tick(nowMs) {
  const dt = Math.min(0.1, (nowMs - game.lastTick) / 1000 || 0);
  game.lastTick = nowMs;
  if (game.screen === 'playing') {
    game.now += dt;
    game.timeLeft -= dt;
    if (game.timeLeft <= 0) {
      game.timeLeft = 0;
      game.endShift();
    } else {
      tickKitchen(game.kitchen, dt);
      const expired = tickOrders(game.board, dt);
      for (const o of expired) {
        game.lives -= 1;
        game.combo = 0;
        sfx.buzz();
        setMessage(game.kitchen, 'Order expired! −1 ❤️', game.now);
        game.announce('An order expired.');
      }
      if (game.lives <= 0) game.endShift();
    }
  }
  renderAll(ctx, game);
  if (!game.frozen) requestAnimationFrame(tick);
}

function boot() {
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  game.reset();
  attachInput(canvas, game);
  const shot = shotMode();
  if (shot) {
    game.frozen = true;
    stageShot(game, shot);
    game.lastTick = 0;
    renderAll(ctx, game);
    document.title = `Sizzle & Serve — shot ${shot.shot}`;
    return;
  }
  game.lastTick = performance.now();
  requestAnimationFrame(tick);
}

boot();
