// Config: every tunable number, dish and ingredient of Sizzle & Serve.
// One clear job: data, no logic.
export const VIEW = { w: 1280, h: 720 };

export const SHIFT_SECONDS = 120;
export const ORDER_TIME = 28;
export const MAX_ORDERS = 3;
export const MAX_LIVES = 3;
export const PLATE_MAX = 5;
export const GRILL_SECONDS = 4;
export const OVEN_SECONDS = 5;

export const INGREDIENTS = [
  { id: 'bun',     name: 'Bun',     emoji: '🍞', key: '1', cook: null,   color: '#e8b06a' },
  { id: 'patty',   name: 'Patty',   emoji: '🥩', key: '2', cook: 'grill', color: '#c65a4e' },
  { id: 'lettuce', name: 'Lettuce', emoji: '🥬', key: '3', cook: null,   color: '#7dc383' },
  { id: 'tomato',  name: 'Tomato',  emoji: '🍅', key: '4', cook: null,   color: '#e4573d' },
  { id: 'cheese',  name: 'Cheese',  emoji: '🧀', key: '5', cook: null,   color: '#f2c14e' },
  { id: 'dough',   name: 'Dough',   emoji: '🥖', key: '6', cook: 'oven',  color: '#e8d5a8' },
  { id: 'noodle',  name: 'Noodle',  emoji: '🍜', key: '7', cook: null,   color: '#f0d089' },
  { id: 'sauce',   name: 'Sauce',   emoji: '🥫', key: '8', cook: null,   color: '#b8442c' },
];

export const DISHES = [
  { id: 'burger', name: 'Burger', emoji: '🍔', needs: ['bun', 'patty', 'lettuce', 'tomato'], price: 100 },
  { id: 'salad',  name: 'Salad',  emoji: '🥗', needs: ['lettuce', 'tomato', 'cheese'],      price: 80 },
  { id: 'pizza',  name: 'Pizza',  emoji: '🍕', needs: ['dough', 'tomato', 'cheese'],        price: 110 },
  { id: 'pasta',  name: 'Pasta',  emoji: '🍝', needs: ['noodle', 'sauce', 'cheese'],        price: 90 },
];

export function ingredientById(id) {
  return INGREDIENTS.find((i) => i.id === id);
}

export function dishById(id) {
  return DISHES.find((d) => d.id === id);
}

// Layout rectangles (logical 1280x720 canvas).
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 16, y: 80, w: 288, h: 500 },
  grill: { x: 336, y: 96, w: 280, h: 150 },
  oven: { x: 336, y: 262, w: 280, h: 150 },
  plate: { x: 640, y: 96, w: 320, h: 316 },
  side: { x: 984, y: 96, w: 280, h: 316 },
  counter: { x: 16, y: 596, w: 1248, h: 108 },
};
