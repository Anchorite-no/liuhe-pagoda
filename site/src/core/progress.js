/**
 * Records what the reader has done, so the final chapter can reflect it back.
 *   markDone('ch3', 'made-a-tide')
 *   isDone('ch3', 'made-a-tide')
 *   getProgress() → { ch3: ['made-a-tide'], ... }
 */
const KEY = 'liuhe.progress';
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === 'object' ? obj : {};
  } catch (_) {
    return {};
  }
}

let state = load();

export function markDone(chapter, key) {
  const list = state[chapter] || (state[chapter] = []);
  if (list.includes(key)) return;
  list.push(key);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (_) {
    /* ignore */
  }
  for (const fn of listeners) fn(getProgress());
}

export function isDone(chapter, key) {
  return !!(state[chapter] && state[chapter].includes(key));
}

export function getProgress() {
  return JSON.parse(JSON.stringify(state));
}

export function onProgress(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
