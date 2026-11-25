// Kitchen: the grill, the oven and the serving plate. Holds the cooking
// state and the rules for adding ingredients, cooking them and serving.
import { GRILL_SECONDS, OVEN_SECONDS, PLATE_MAX, ingredientById } from './config.js';

export function makeKitchen() {
  return {
    grill: [null, null], // { id, progress 0..1, done } or null
    oven: [null, null],
    plate: [], // ingredient ids, in the order added
    message: '',
    messageAt: 0,
  };
}

export function setMessage(kitchen, text, now) {
  kitchen.message = text;
  kitchen.messageAt = now;
}

export function tickKitchen(kitchen, dt) {
  for (const slot of kitchen.grill) {
    if (slot && !slot.done) {
      slot.progress += dt / GRILL_SECONDS;
      if (slot.progress >= 1) { slot.progress = 1; slot.done = true; }
    }
  }
  for (const slot of kitchen.oven) {
    if (slot && !slot.done) {
      slot.progress += dt / OVEN_SECONDS;
      if (slot.progress >= 1) { slot.progress = 1; slot.done = true; }
    }
  }
}

// Click an ingredient bin. Returns 'plate' | 'grill' | 'oven' | 'full' | 'busy'.
export function addIngredient(kitchen, ingId, now) {
  const ing = ingredientById(ingId);
  if (!ing) return 'busy';
  if (ing.cook === 'grill') {
    const slot = kitchen.grill.find((s) => s === null);
    if (!slot) { setMessage(kitchen, 'Grill is full!', now); return 'busy'; }
    const i = kitchen.grill.indexOf(null);
    kitchen.grill[i] = { id: ingId, progress: 0, done: false };
    return 'grill';
  }
  if (ing.cook === 'oven') {
    const i = kitchen.oven.indexOf(null);
    if (i === -1) { setMessage(kitchen, 'Oven is full!', now); return 'busy'; }
    kitchen.oven[i] = { id: ingId, progress: 0, done: false };
    return 'oven';
  }
  if (kitchen.plate.length >= PLATE_MAX) {
    setMessage(kitchen, 'Plate is full — serve or trash it!', now);
    return 'full';
  }
  kitchen.plate.push(ingId);
  return 'plate';
}

// Take a finished item off a station onto the plate. Returns true on success.
export function collectFromStation(kitchen, station, index, now) {
  const slots = station === 'grill' ? kitchen.grill : kitchen.oven;
  const slot = slots[index];
  if (!slot) return false;
  if (!slot.done) { setMessage(kitchen, 'Still cooking…', now); return false; }
  if (kitchen.plate.length >= PLATE_MAX) {
    setMessage(kitchen, 'Plate is full — serve or trash it!', now);
    return false;
  }
  kitchen.plate.push(slot.id);
  slots[index] = null;
  return true;
}

export function clearPlate(kitchen) {
  kitchen.plate = [];
}
