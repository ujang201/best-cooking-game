// Orders: the order board. Spawns tickets, counts them down, matches a
// finished plate against a ticket. Pure logic, no drawing.
import { DISHES, ORDER_TIME, MAX_ORDERS } from './config.js';
import { pick } from './random.js';

export function makeOrderBoard(rng) {
  return {
    rng,
    orders: [],
    nextId: 1,
    spawnIn: 0.5,
  };
}

export function spawnOrder(board) {
  const dish = pick(board.rng, DISHES);
  board.orders.push({
    id: board.nextId++,
    dishId: dish.id,
    timeLeft: ORDER_TIME,
    fresh: 0, // seconds since spawn, for pop-in animation
  });
}

export function tickOrders(board, dt) {
  // Returns the list of orders that expired this tick.
  const expired = [];
  for (const o of board.orders) {
    o.timeLeft -= dt;
    o.fresh += dt;
  }
  board.orders = board.orders.filter((o) => {
    if (o.timeLeft <= 0) { expired.push(o); return false; }
    return true;
  });
  board.spawnIn -= dt;
  if (board.spawnIn <= 0 && board.orders.length < MAX_ORDERS) {
    spawnOrder(board);
    board.spawnIn = 6 + board.rng() * 4;
  }
  return expired;
}

function sortedIds(ids) {
  return ids.slice().sort();
}

export function plateMatches(plateIds, dishNeeds) {
  const a = sortedIds(plateIds);
  const b = sortedIds(dishNeeds);
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// Finds the first order whose dish the plate completes, or null.
export function findMatchingOrder(board, plateIds) {
  for (const o of board.orders) {
    const dish = DISHES.find((d) => d.id === o.dishId);
    if (plateMatches(plateIds, dish.needs)) return { order: o, dish };
  }
  return null;
}

// How many of the plate's items belong to this dish (for a progress hint).
export function plateProgress(plateIds, dishNeeds) {
  const need = dishNeeds.slice();
  let hit = 0;
  for (const id of plateIds) {
    const i = need.indexOf(id);
    if (i !== -1) { need.splice(i, 1); hit++; }
  }
  return { hit, total: dishNeeds.length };
}
