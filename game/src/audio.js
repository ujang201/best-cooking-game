// Audio: all sounds are synthesized live with WebAudio oscillators —
// no audio files, no network. One clear job: bleeps, dings and a tune.
let ctx = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

// A cheerful little loop: C major, bouncy. (note, beats)
const MELODY = [
  ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1],
  ['A5', 1], ['G5', 1], ['E5', 1], ['C5', 1],
  ['D5', 1], ['F5', 1], ['A5', 1], ['F5', 1],
  ['G5', 2], ['E5', 1], ['D5', 1],
];
const FREQ = {
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.0,
};

export function ensureAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  if (muted) stopMusic(); else startMusic();
  return muted;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  if (muted || !ensureAudio()) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  pop() { tone(660, 0.08, 'triangle', 0.10); },
  place() { tone(440, 0.07, 'triangle', 0.10); tone(880, 0.06, 'sine', 0.06, 0.05); },
  ding() { tone(1174.66, 0.25, 'sine', 0.12); tone(1567.98, 0.3, 'sine', 0.08, 0.08); },
  serve() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.16, 'triangle', 0.12, i * 0.07));
  },
  buzz() { tone(160, 0.25, 'sawtooth', 0.10); tone(120, 0.3, 'sawtooth', 0.08, 0.1); },
  tick() { tone(980, 0.05, 'square', 0.05); },
  start() { [392, 523.25, 659.25].forEach((f, i) => tone(f, 0.14, 'triangle', 0.11, i * 0.09)); },
  over() { [659.25, 523.25, 392, 329.63].forEach((f, i) => tone(f, 0.25, 'triangle', 0.11, i * 0.14)); },
};

export function startMusic() {
  if (muted || musicTimer || !ensureAudio()) return;
  const beat = 0.22;
  musicTimer = setInterval(() => {
    if (muted) return;
    const [note, beats] = MELODY[musicStep % MELODY.length];
    tone(FREQ[note], beat * beats * 0.9, 'triangle', 0.045);
    musicStep++;
  }, beat * 1000);
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
}
