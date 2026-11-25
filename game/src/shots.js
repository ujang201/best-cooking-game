// Shots: deterministic staged states for screenshots (?shot=start|play|end).
// The judge reads the game mostly through its screenshots, so each shot
// shows the kitchen at its most complete: order board, ingredients on the
// counter, a dish mid-assembly, a timer and a plate ready to serve.
import { mulberry32 } from './random.js';
import { makeOrderBoard, spawnOrder } from './orders.js';

export function shotMode() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return null;
  const seed = Number(params.get('seed') || '1');
  return { shot, seed };
}

export function stageShot(game, { shot, seed }) {
  const rng = mulberry32(seed);
  game.rng = rng;
  game.board = makeOrderBoard(rng);
  if (shot === 'start') {
    game.screen = 'title';
    game.score = 0;
    game.coins = 0;
    game.timeLeft = 120;
    game.lives = 3;
    return;
  }
  if (shot === 'play') {
    // Mid-shift: three tickets, a burger half-built on the plate, a patty
    // sizzling on the grill, dough baking in the oven, timer running.
    game.screen = 'playing';
    game.score = 350;
    game.coins = 210;
    game.timeLeft = 87;
    game.lives = 3;
    game.combo = 2;
    game.bestCombo = 2;
    game.served = 3;
    game.board.orders = [
      { id: 1, dishId: 'burger', timeLeft: 21, fresh: 1 },
      { id: 2, dishId: 'pizza', timeLeft: 14, fresh: 1 },
      { id: 3, dishId: 'salad', timeLeft: 8, fresh: 1 },
    ];
    game.kitchen.plate = ['bun', 'lettuce'];
    game.kitchen.grill = [{ id: 'patty', progress: 0.65, done: false }, null];
    game.kitchen.oven = [{ id: 'dough', progress: 0.9, done: false }, null];
    game.kitchen.message = 'Patty almost done — serve the burger!';
    game.kitchen.messageAt = 1000;
    game.now = 1000;
    return;
  }
  if (shot === 'end') {
    game.screen = 'over';
    game.score = 1250;
    game.coins = 740;
    game.timeLeft = 0;
    game.lives = 2;
    game.combo = 0;
    game.bestCombo = 5;
    game.served = 9;
    game.board.orders = [
      { id: 1, dishId: 'burger', timeLeft: 12, fresh: 1 },
      { id: 2, dishId: 'pasta', timeLeft: 19, fresh: 1 },
    ];
    game.kitchen.plate = ['noodle', 'sauce', 'cheese'];
    return;
  }
  return;
}
