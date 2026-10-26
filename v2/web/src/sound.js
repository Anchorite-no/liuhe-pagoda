/**
 * Every sound on the page is synthesised here with Web Audio, nothing is downloaded:
 * iron wind-bells (inharmonic partials, tuned to the pentatonic scale), a wooden knock, the
 * thud of a seal, war drums and the roar of the bore for the tide game, crackling fire for the
 * time machine, and a quiet river for the background. Sounds only start from a click or a key,
 * as browsers require; the river ambience is off until the reader turns it on.
 */
let ctx = null;
let master = null;
let noiseBuf = null;

export function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    // two seconds of brown noise, looped wherever noise is needed
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const out = (pan = 0) => {
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
  if (p.pan) p.pan.value = Math.max(-1, Math.min(1, pan));
  p.connect(master);
  return p;
};

// 宫 商 角 徵 羽 over two octaves, from D
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const noteHz = (k) => 293.66 * Math.pow(2, PENTA[Math.max(0, Math.min(PENTA.length - 1, k))] / 12);

/** an iron bell: k picks the note (higher on higher eaves), pan -1..1 */
export function bell(k = 4, pan = 0, vel = 1) {
  if (!audio()) return;
  const t = ctx.currentTime;
  const f = noteHz(k);
  const dest = out(pan);
  // a bell's overtones are not whole multiples: that is what makes it sound like metal
  for (const [r, g, dec] of [[1, 0.5, 2.8], [2.02, 0.22, 1.9], [2.74, 0.16, 1.4], [3.96, 0.08, 0.9], [5.4, 0.06, 0.6], [0.5, 0.12, 3.4]]) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f * r * (1 + (Math.random() - 0.5) * 0.004);
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(g * vel * 0.5, t + 0.004);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    o.connect(gn).connect(dest);
    o.start(t);
    o.stop(t + dec + 0.1);
  }
}

/** the wind passes: bells ring one after another, all round the tower */
export function windChimes(n = 9, span = 2.6) {
  if (!audio()) return;
  for (let i = 0; i < n; i++) {
    setTimeout(() => bell(2 + Math.floor(Math.random() * 8), Math.random() * 1.6 - 0.8, 0.5 + Math.random() * 0.5), (i / n) * span * 1000 + Math.random() * 180);
  }
  whoosh(span);
}

function noise(dur, { type = 'bandpass', f = 800, q = 1, gain = 0.5, attack = 0.005, pan = 0, at = 0 } = {}) {
  const t = ctx.currentTime + at;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  const fl = ctx.createBiquadFilter();
  fl.type = type;
  fl.frequency.value = f;
  fl.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl).connect(g).connect(out(pan));
  s.start(t, Math.random() * 1.5);
  s.stop(t + dur + 0.05);
  return { fl, g, t };
}

export function whoosh(dur = 2.5) {
  if (!audio()) return;
  const n = noise(dur, { f: 500, q: 0.7, gain: 0.25, attack: dur * 0.4 });
  n.fl.frequency.linearRampToValueAtTime(1400, n.t + dur * 0.5);
  n.fl.frequency.linearRampToValueAtTime(400, n.t + dur);
}

/** wood on wood: a dougong piece seating in its notch */
export function knock(pitch = 1) {
  if (!audio()) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(420 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(180 * pitch, t + 0.08);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g).connect(out());
  o.start(t);
  o.stop(t + 0.2);
  noise(0.06, { f: 1800 * pitch, q: 2, gain: 0.35 });
}

/** a stone into the river: a falling “plop” and a splash */
export function plop(pan = 0) {
  if (!audio()) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(900, t);
  o.frequency.exponentialRampToValueAtTime(140, t + 0.12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g).connect(out(pan));
  o.start(t);
  o.stop(t + 0.25);
  noise(0.35, { f: 2400, q: 0.8, gain: 0.22, pan, at: 0.03 });
  noise(0.6, { type: 'lowpass', f: 500, gain: 0.25, pan, at: 0.02 });
}

/** a wrong move: a dull double tap */
export function nope() {
  if (!audio()) return;
  knock(0.55);
  setTimeout(() => knock(0.5), 110);
}

/** a seal pressed onto paper */
export function stamp() {
  if (!audio()) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(out());
  o.start(t);
  o.stop(t + 0.35);
  noise(0.12, { type: 'lowpass', f: 900, gain: 0.5 });
  setTimeout(() => bell(7, 0, 0.35), 160);
}

/** one beat of a war drum (“万面鼓声中”) */
export function drum(vel = 1) {
  if (!audio()) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.85 * vel, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  o.connect(g).connect(out((Math.random() - 0.5) * 0.6));
  o.start(t);
  o.stop(t + 0.5);
  noise(0.09, { type: 'lowpass', f: 600, gain: 0.4 * vel });
}

/** fire: a run of crackles over a low rush, for `dur` seconds */
export function fire(dur = 2.4) {
  if (!audio()) return;
  noise(dur, { type: 'lowpass', f: 700, gain: 0.3, attack: 0.4 });
  const pops = Math.round(dur * 22);
  for (let i = 0; i < pops; i++) noise(0.03 + Math.random() * 0.04, { f: 1500 + Math.random() * 3000, q: 3, gain: 0.15 + Math.random() * 0.3, pan: Math.random() * 2 - 1, at: Math.random() * dur });
}

/** a soft rising shimmer: something rebuilt */
export function rebuild(dur = 2) {
  if (!audio()) return;
  for (let i = 0; i < 6; i++) setTimeout(() => bell(i + 3, (i % 2 ? 0.4 : -0.4), 0.25), (i / 6) * dur * 1000);
}

/**
 * A continuous roar whose loudness follows `level` (0..1): the bore in the tide game,
 * or, very quietly, the river under the page. Returns { set(level), stop() }.
 */
export function roar(base = 0.5) {
  if (!audio()) return { set() {}, stop() {} };
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  const fl = ctx.createBiquadFilter();
  fl.type = 'lowpass';
  fl.frequency.value = 350;
  const g = ctx.createGain();
  g.gain.value = 0;
  s.connect(fl).connect(g).connect(master);
  s.start();
  let stopped = false;
  return {
    set(level) {
      if (stopped) return;
      const t = ctx.currentTime;
      g.gain.setTargetAtTime(base * level, t, 0.25);
      fl.frequency.setTargetAtTime(250 + 1500 * level, t, 0.3);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      setTimeout(() => s.stop(), 1500);
    },
  };
}

/** the river under the page: a soft wash of water, a far bell now and then */
let river = null;
let riverBells = 0;
export function setAmbience(on) {
  if (on) {
    if (!audio()) return false;
    if (!river) {
      river = roar(0.16);
      let k = 0;
      const swell = () => {
        if (!river) return;
        k += 0.13;
        river.set(0.55 + 0.35 * Math.sin(k) * Math.sin(k * 0.37));
      };
      swell();
      river.timer = setInterval(swell, 400);
      riverBells = setInterval(() => Math.random() < 0.35 && bell(2 + Math.floor(Math.random() * 6), Math.random() - 0.5, 0.18), 5200);
    }
    return true;
  }
  if (river) {
    clearInterval(river.timer);
    clearInterval(riverBells);
    river.stop();
    river = null;
  }
  return false;
}
