// Render: every pixel of the kitchen, drawn on canvas with shapes and
// emoji — no image files. One clear job: turn game state into a picture.
import { VIEW, LAYOUT, INGREDIENTS, DISHES, ingredientById, dishById, SHIFT_SECONDS } from './config.js';
import { plateProgress } from './orders.js';
import { isMuted } from './audio.js';

const C = {
  wall: '#f6d9a0', wallDark: '#eec27f', floor: '#b5764a', floorDark: '#a5663f',
  counter: '#8a5a3b', counterTop: '#c98d5f', board: '#3e2f23', boardEdge: '#6b4a2f',
  cream: '#fff6e3', ink: '#3a2417', red: '#d94f3d', green: '#4caf6d',
  gold: '#f2c14e', steel: '#9aa5ad', steelDark: '#6e7a82',
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function emoji(ctx, s, x, y, size) {
  ctx.font = `${size}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function drawWallAndFloor(ctx) {
  ctx.fillStyle = C.wall;
  ctx.fillRect(0, 0, VIEW.w, 596);
  ctx.fillStyle = C.wallDark;
  for (let x = 0; x < VIEW.w; x += 96) ctx.fillRect(x, 300, 2, 296);
  ctx.fillStyle = C.floor;
  ctx.fillRect(0, 596, VIEW.w, 124);
  ctx.fillStyle = C.floorDark;
  for (let y = 620; y < 720; y += 34) ctx.fillRect(0, y, VIEW.w, 2);
}

export function drawTopBar(ctx, game) {
  const { x, y, w, h } = LAYOUT.topBar;
  ctx.fillStyle = '#fff6e3';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#e8b06a';
  ctx.fillRect(x, y + h - 4, w, 4);
  // Shift timer.
  const t = Math.max(0, game.timeLeft);
  const mm = Math.floor(t / 60);
  const ss = Math.floor(t % 60).toString().padStart(2, '0');
  const urgent = t <= 15;
  text(ctx, `⏱ ${mm}:${ss}`, 24, 42, 26, urgent ? C.red : C.ink);
  // Timer bar.
  const bw = 180;
  ctx.fillStyle = '#e5d3b3';
  rr(ctx, 150, 24, bw, 16, 8); ctx.fill();
  ctx.fillStyle = urgent ? C.red : C.green;
  rr(ctx, 150, 24, bw * (t / SHIFT_SECONDS), 16, 8); ctx.fill();
  // Score, coins, lives.
  text(ctx, `⭐ ${game.score}`, 420, 42, 26, C.ink);
  text(ctx, `🪙 ${game.coins}`, 580, 42, 26, '#8a6d1a');
  const hearts = '❤️'.repeat(game.lives) + '🖤'.repeat(3 - game.lives);
  text(ctx, hearts, 760, 42, 24, C.red);
  if (game.combo > 1) text(ctx, `🔥 COMBO x${game.combo}`, 980, 42, 24, '#e07b00');
  text(ctx, isMuted() ? '🔇 M' : '🔊 M', 1210, 42, 20, '#7a5a40', 'bold', 'right');
}

export function drawBoard(ctx, board) {
  const { x, y, w, h } = LAYOUT.board;
  ctx.fillStyle = C.boardEdge;
  rr(ctx, x - 6, y - 6, w + 12, h + 12, 14); ctx.fill();
  ctx.fillStyle = C.board;
  rr(ctx, x, y, w, h, 10); ctx.fill();
  text(ctx, '📋 ORDER BOARD', x + w / 2, y + 34, 22, '#ffd94d', 'bold', 'center');
  ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + 20, y + 48); ctx.lineTo(x + w - 20, y + 48); ctx.stroke();
  if (board.orders.length === 0) {
    text(ctx, 'No orders yet…', x + w / 2, y + 200, 18, '#cbb59a', 'normal', 'center');
    text(ctx, '…they arrive soon!', x + w / 2, y + 228, 18, '#cbb59a', 'normal', 'center');
    return;
  }
  board.orders.forEach((o, i) => {
    const dish = dishById(o.dishId);
    const oy = y + 66 + i * 138;
    const pop = Math.min(1, o.fresh * 4);
    ctx.save();
    ctx.globalAlpha = pop;
    ctx.translate(0, (1 - pop) * -8);
    ctx.fillStyle = '#fff6e3';
    rr(ctx, x + 14, oy, w - 28, 122, 10); ctx.fill();
    emoji(ctx, dish.emoji, x + 46, oy + 34, 40);
    text(ctx, dish.name, x + 76, oy + 28, 22, C.ink);
    text(ctx, `$${dish.price}`, x + w - 28, oy + 28, 18, '#8a6d1a', 'bold', 'right');
    // Needed ingredients.
    dish.needs.forEach((id, j) => {
      const ing = ingredientById(id);
      emoji(ctx, ing.emoji, x + 92 + j * 40, oy + 62, 26);
    });
    // Countdown bar.
    const barW = w - 28 - 76;
    ctx.fillStyle = '#e5d3b3';
    rr(ctx, x + 76, oy + 86, barW, 12, 6); ctx.fill();
    const frac = Math.max(0, o.timeLeft / 28);
    ctx.fillStyle = frac > 0.5 ? C.green : frac > 0.25 ? '#e8a13a' : C.red;
    rr(ctx, x + 76, oy + 86, barW * frac, 12, 6); ctx.fill();
    text(ctx, `${Math.ceil(o.timeLeft)}s`, x + w - 28, oy + 110, 14, o.timeLeft <= 5 ? C.red : '#7a5a40', 'bold', 'right');
    ctx.restore();
  });
}

function drawStation(ctx, box, title, slots, icon, accent) {
  ctx.fillStyle = '#fff6e3';
  rr(ctx, box.x, box.y, box.w, box.h, 12); ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = 3;
  rr(ctx, box.x, box.y, box.w, box.h, 12); ctx.stroke();
  text(ctx, title, box.x + 16, box.y + 30, 20, C.ink);
  slots.forEach((slot, i) => {
    const sx = box.x + 30 + i * 130;
    const sy = box.y + 52;
    ctx.fillStyle = slot ? '#fff' : '#efe3cc';
    rr(ctx, sx, sy, 110, 78, 10); ctx.fill();
    ctx.strokeStyle = C.steelDark; ctx.lineWidth = 2;
    rr(ctx, sx, sy, 110, 78, 10); ctx.stroke();
    if (slot) {
      const ing = ingredientById(slot.id);
      emoji(ctx, ing.emoji, sx + 55, sy + 30, 38);
      if (!slot.done) {
        ctx.fillStyle = '#e5d3b3';
        rr(ctx, sx + 10, sy + 58, 90, 10, 5); ctx.fill();
        ctx.fillStyle = '#e07b00';
        rr(ctx, sx + 10, sy + 58, 90 * slot.progress, 10, 5); ctx.fill();
        text(ctx, 'cooking…', sx + 55, sy + 92, 11, '#7a5a40', 'normal', 'center');
      } else {
        text(ctx, 'READY! click it', sx + 55, sy + 92, 11, C.green, 'bold', 'center');
        ctx.fillStyle = 'rgba(76,175,109,0.18)';
        rr(ctx, sx, sy, 110, 78, 10); ctx.fill();
      }
    } else {
      emoji(ctx, icon, sx + 55, sy + 30, 30);
      text(ctx, 'empty', sx + 55, sy + 92, 11, '#b09a7d', 'normal', 'center');
    }
  });
}

export function drawKitchen(ctx, kitchen, game) {
  drawStation(ctx, LAYOUT.grill, '🔥 GRILL — patty (4s)', kitchen.grill, '🥩', '#d94f3d');
  drawStation(ctx, LAYOUT.oven, '🍞 OVEN — dough (5s)', kitchen.oven, '🥖', '#e8a13a');
  // Plate.
  const p = LAYOUT.plate;
  ctx.fillStyle = '#fff6e3';
  rr(ctx, p.x, p.y, p.w, p.h, 12); ctx.fill();
  ctx.strokeStyle = '#8a5a3b'; ctx.lineWidth = 3;
  rr(ctx, p.x, p.y, p.w, p.h, 12); ctx.stroke();
  text(ctx, '🍽 YOUR PLATE', p.x + 16, p.y + 30, 20, C.ink);
  // The plate itself.
  ctx.fillStyle = '#fdfdfd';
  ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + 150, 118, 82, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9b896'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + 150, 118, 82, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + 150, 88, 58, 0, 0, Math.PI * 2); ctx.stroke();
  if (kitchen.plate.length === 0) {
    text(ctx, 'empty — add ingredients!', p.x + p.w / 2, p.y + 154, 15, '#b09a7d', 'normal', 'center');
  } else {
    // Stack the dish mid-assembly on the plate.
    const cx = p.x + p.w / 2;
    const cy = p.y + 150;
    kitchen.plate.forEach((id, i) => {
      const ing = ingredientById(id);
      const off = (i - (kitchen.plate.length - 1) / 2) * 52;
      emoji(ctx, ing.emoji, cx + off, cy - 18 + (i % 2) * 26, 40);
    });
  }
  // Progress hint: best matching order so far.
  let hint = null;
  let best = 0;
  for (const o of game.board.orders) {
    const dish = dishById(o.dishId);
    const pr = plateProgress(kitchen.plate, dish.needs);
    if (pr.hit > best) { best = pr.hit; hint = { dish, pr }; }
  }
  if (kitchen.plate.length > 0 && hint) {
    text(ctx, `${hint.dish.emoji} ${hint.dish.name}: ${hint.pr.hit}/${hint.pr.total} ingredients`, p.x + p.w / 2, p.y + 268, 16, best === hint.pr.total ? C.green : C.ink, 'bold', 'center');
  } else if (kitchen.plate.length > 0) {
    text(ctx, 'Hmm — matches no order yet', p.x + p.w / 2, p.y + 268, 15, C.red, 'normal', 'center');
  } else {
    text(ctx, 'Build a dish from an order ticket →', p.x + p.w / 2, p.y + 268, 15, '#7a5a40', 'normal', 'center');
  }
  // Side panel: serve / trash / help.
  const s = LAYOUT.side;
  ctx.fillStyle = '#fff6e3';
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.strokeStyle = '#8a5a3b'; ctx.lineWidth = 3;
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.stroke();
  text(ctx, '🧑‍🍳 CHEF', s.x + 20, s.y + 32, 20, C.ink);
  drawButton(ctx, game.buttons.serve, '✅ SERVE  (Space)', C.green, '#fff');
  drawButton(ctx, game.buttons.trash, '🗑 TRASH PLATE  (T)', '#e8a13a', '#fff');
  text(ctx, 'Served: ' + game.served, s.x + 20, s.y + 196, 17, C.ink);
  text(ctx, 'Best combo: x' + game.bestCombo, s.x + 20, s.y + 222, 17, C.ink);
  text(ctx, 'How to play:', s.x + 20, s.y + 258, 15, '#7a5a40', 'bold');
  text(ctx, '1 · Click bins (or keys 1–8)', s.x + 20, s.y + 280, 14, '#7a5a40', 'normal');
  text(ctx, '2 · Grill patty, bake dough', s.x + 20, s.y + 300, 14, '#7a5a40', 'normal');
  // Toast message.
  if (kitchen.message && game.now - kitchen.messageAt < 2.5) {
    ctx.font = 'bold 16px "Trebuchet MS", "Segoe UI", sans-serif';
    const mw = ctx.measureText(kitchen.message).width + 36;
    ctx.fillStyle = 'rgba(58,36,23,0.9)';
    rr(ctx, 640 - mw / 2, 540, mw, 36, 18); ctx.fill();
    text(ctx, kitchen.message, 640, 563, 16, '#fff6e3', 'bold', 'center');
  }
}

export function drawButton(ctx, btn, label, bg, fg) {
  ctx.fillStyle = btn.hover ? shade(bg, -18) : bg;
  rr(ctx, btn.x, btn.y, btn.w, btn.h, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
  rr(ctx, btn.x, btn.y, btn.w, btn.h, 12); ctx.stroke();
  text(ctx, label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 7, 19, fg, 'bold', 'center');
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

export function drawCounter(ctx, game) {
  const { x, y, w, h } = LAYOUT.counter;
  ctx.fillStyle = C.counter;
  rr(ctx, x, y, w, h, 12); ctx.fill();
  ctx.fillStyle = C.counterTop;
  rr(ctx, x, y, w, 14, 7); ctx.fill();
  text(ctx, '🥕 INGREDIENTS — click a bin or press its number key', x + 16, y + 34, 16, '#ffe9c4', 'bold');
  const bw = 138, gap = 12;
  INGREDIENTS.forEach((ing, i) => {
    const bx = x + 16 + i * (bw + gap);
    const by = y + 44;
    const hot = game.hoverBin === ing.id;
    ctx.fillStyle = hot ? '#fff' : '#fff6e3';
    rr(ctx, bx, by, bw, 52, 10); ctx.fill();
    ctx.strokeStyle = ing.color; ctx.lineWidth = 3;
    rr(ctx, bx, by, bw, 52, 10); ctx.stroke();
    emoji(ctx, ing.emoji, bx + 26, by + 27, 30);
    text(ctx, ing.name, bx + 48, by + 24, 15, C.ink);
    text(ctx, `[${ing.key}] ${ing.cook ? (ing.cook === 'grill' ? '→ grill' : '→ oven') : 'ready'}`, bx + 48, by + 42, 11, '#7a5a40', 'normal');
  });
}

export function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(43,26,18,0.55)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  const cx = 640, cy = 300;
  ctx.fillStyle = '#fff6e3';
  rr(ctx, cx - 340, cy - 170, 680, 340, 20); ctx.fill();
  ctx.strokeStyle = '#e8a13a'; ctx.lineWidth = 4;
  rr(ctx, cx - 340, cy - 170, 680, 340, 20); ctx.stroke();
  emoji(ctx, '👨‍🍳', cx, cy - 108, 64);
  text(ctx, 'SIZZLE & SERVE', cx, cy - 40, 48, C.ink, 'bold', 'center');
  text(ctx, 'The lunch rush is on! Cook fast, serve faster.', cx, cy - 4, 19, '#7a5a40', 'normal', 'center');
  text(ctx, '🍔 Burger · 🥗 Salad · 🍕 Pizza · 🍝 Pasta', cx, cy + 32, 19, C.ink, 'normal', 'center');
  text(ctx, 'Grill the patty, bake the dough, match the tickets.', cx, cy + 60, 16, '#7a5a40', 'normal', 'center');
  drawButton(ctx, game.buttons.start, '▶  START COOKING  (Enter)', C.green, '#fff');
  text(ctx, 'Mouse + keyboard · 2-minute shift · 3 lives', cx, cy + 152, 14, '#7a5a40', 'normal', 'center');
}

export function drawGameOver(ctx, game) {
  ctx.fillStyle = 'rgba(43,26,18,0.6)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  const cx = 640, cy = 320;
  ctx.fillStyle = '#fff6e3';
  rr(ctx, cx - 320, cy - 160, 640, 320, 20); ctx.fill();
  ctx.strokeStyle = '#e8a13a'; ctx.lineWidth = 4;
  rr(ctx, cx - 320, cy - 160, 640, 320, 20); ctx.stroke();
  emoji(ctx, game.lives > 0 ? '🏆' : '💔', cx, cy - 106, 56);
  text(ctx, game.lives > 0 ? 'SHIFT COMPLETE!' : 'KITCHEN CLOSED!', cx, cy - 32, 40, C.ink, 'bold', 'center');
  text(ctx, `⭐ Score: ${game.score}    🪙 Coins: ${game.coins}`, cx, cy + 8, 22, C.ink, 'normal', 'center');
  text(ctx, `🍽 Dishes served: ${game.served}    🔥 Best combo: x${game.bestCombo}`, cx, cy + 40, 19, '#7a5a40', 'normal', 'center');
  const verdict = game.score >= 800 ? 'Michelin material! 🌟' : game.score >= 400 ? 'Solid line cook! 👏' : 'Keep practising, chef! 🍳';
  text(ctx, verdict, cx, cy + 72, 19, C.ink, 'normal', 'center');
  drawButton(ctx, game.buttons.restart, '↻  COOK AGAIN  (R)', C.green, '#fff');
}

export function renderAll(ctx, game) {
  drawWallAndFloor(ctx);
  drawTopBar(ctx, game);
  drawBoard(ctx, game.board);
  drawKitchen(ctx, game.kitchen, game);
  drawCounter(ctx, game);
  if (game.screen === 'title') drawTitle(ctx, game);
  if (game.screen === 'over') drawGameOver(ctx, game);
}
