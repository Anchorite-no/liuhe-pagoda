/**
 * Procedural soundscape (Web Audio). No audio files: river, wind, low tide rumble,
 * pagoda wind-bells and tide surges are all synthesised, so nothing needs licensing
 * or a network request.
 *
 * Sound is OFF until the reader turns it on (top bar button). All calls are safe
 * when sound is off; they simply do nothing.
 *
 *   audio.setAmbience({ river: 0.5, wind: 0.2, rumble: 0 })   // continuous layers, 0..1
 *   audio.bell(0.8)                                             // one wind-bell strike
 *   audio.surge(1, 6)                                           // tide roar: intensity, seconds
 */

const KEY = 'liuhe.sound';
let ctx = null;
let master = null;
let enabled = false;
let layers = null;
let target = { river: 0, wind: 0, rumble: 0 };
const listeners = new Set();

function makeNoiseBuffer(c, seconds = 3, brown = false) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else {
        d[i] = w;
      }
    }
  }
  return buf;
}

function loopSource(buf) {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  s.start();
  return s;
}

function lfo(freq, depth, param) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = freq;
  g.gain.value = depth;
  o.connect(g).connect(param);
  o.start();
  return o;
}

function build() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  const white = makeNoiseBuffer(ctx, 3, false);
  const brown = makeNoiseBuffer(ctx, 4, true);

  // River: filtered noise with a slow swell
  const riverF = ctx.createBiquadFilter();
  riverF.type = 'lowpass';
  riverF.frequency.value = 520;
  riverF.Q.value = 0.4;
  const riverG = ctx.createGain();
  riverG.gain.value = 0;
  loopSource(brown).connect(riverF).connect(riverG).connect(master);
  lfo(0.07, 160, riverF.frequency);

  // Wind: band-passed white noise sweeping slowly
  const windF = ctx.createBiquadFilter();
  windF.type = 'bandpass';
  windF.frequency.value = 700;
  windF.Q.value = 1.2;
  const windG = ctx.createGain();
  windG.gain.value = 0;
  loopSource(white).connect(windF).connect(windG).connect(master);
  lfo(0.05, 380, windF.frequency);

  // Rumble: the far-off thunder of an approaching bore
  const rumbleF = ctx.createBiquadFilter();
  rumbleF.type = 'lowpass';
  rumbleF.frequency.value = 130;
  const rumbleG = ctx.createGain();
  rumbleG.gain.value = 0;
  loopSource(brown).connect(rumbleF).connect(rumbleG).connect(master);

  layers = {
    river: { gain: riverG, scale: 0.55 },
    wind: { gain: windG, scale: 0.12 },
    rumble: { gain: rumbleG, scale: 1.4 },
  };
  layers.white = white;
  return true;
}

function applyTargets(ramp = 1.5) {
  if (!ctx || !layers) return;
  const now = ctx.currentTime;
  for (const k of ['river', 'wind', 'rumble']) {
    const L = layers[k];
    const v = Math.max(0, Math.min(1, target[k] || 0)) * L.scale;
    L.gain.gain.cancelScheduledValues(now);
    L.gain.gain.setTargetAtTime(v, now, ramp / 3);
  }
}

export function isEnabled() {
  return enabled;
}

export function setEnabled(on) {
  on = !!on;
  if (on && !ctx && !build()) return;
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch (_) {
    /* ignore */
  }
  if (ctx) {
    if (on && ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(on ? 0.9 : 0.0001, now, 0.4);
    applyTargets(0.8);
  }
  for (const fn of listeners) fn(enabled);
}

export function onSoundChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Remembered preference (the context itself can only start after a user gesture). */
export function wantsSound() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch (_) {
    return false;
  }
}

export function setAmbience(levels, ramp = 1.5) {
  target = { river: 0, wind: 0, rumble: 0, ...levels };
  if (enabled) applyTargets(ramp);
}

export function getAmbience() {
  return { ...target };
}

/** One wind-bell strike. strength 0..1, pan -1..1 */
export function bell(strength = 0.7, pan = (Math.random() - 0.5) * 0.8) {
  if (!enabled || !ctx) return;
  const now = ctx.currentTime;
  const base = 980 + Math.random() * 220;
  const out = ctx.createGain();
  out.gain.value = 0.16 * strength;
  let node = out;
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    out.connect(p);
    node = p;
  }
  node.connect(master);
  // Inharmonic partials of a small cast-iron bell
  const partials = [
    [1, 1, 2.6],
    [2.76, 0.5, 1.6],
    [5.4, 0.25, 0.9],
    [8.93, 0.12, 0.5],
  ];
  for (const [ratio, amp, decay] of partials) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = base * ratio;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(amp, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    o.connect(g).connect(out);
    o.start(now);
    o.stop(now + decay + 0.05);
  }
}

/** Roar of a passing bore. intensity 0..1, duration seconds */
export function surge(intensity = 1, duration = 6) {
  if (!enabled || !ctx) return;
  const now = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = layers.white;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(180, now);
  f.frequency.linearRampToValueAtTime(900 + 900 * intensity, now + duration * 0.35);
  f.frequency.linearRampToValueAtTime(260, now + duration);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.5 * intensity + 0.05, now + duration * 0.3);
  g.gain.setTargetAtTime(0.0001, now + duration * 0.55, duration * 0.18);
  src.connect(f).connect(g).connect(master);
  src.start(now);
  src.stop(now + duration + 1);
}
