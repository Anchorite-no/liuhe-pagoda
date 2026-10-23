/**
 * Shared vocabulary.
 *
 * Chapters register their key terms once (registerVocab). Readers can save any term to
 * "my wordbook" from a term popover; the "Be the Guide" chapter uses both lists.
 *
 * Term shape:
 *   { id: 'tidal-bore', en: 'tidal bore', zh: '涌潮', pinyin: 'yǒng cháo',
 *     def: { en: '...', zh: '...' }, example?: { en: '...', zh: '...' } }
 */

const registry = new Map(); // id -> { ...term, chapter }
const KEY = 'liuhe.wordbook';
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

let saved = load(); // array of terms

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch (_) {
    /* storage unavailable: the wordbook just lives for this visit */
  }
  for (const fn of listeners) fn(saved.slice());
}

export function registerVocab(chapter, terms) {
  for (const w of terms) registry.set(w.id, { ...w, chapter });
}

/** All registered terms, in registration order. Optionally filter by chapter id. */
export function getVocab(chapter) {
  const all = [...registry.values()];
  return chapter ? all.filter((w) => w.chapter === chapter) : all;
}

export function getWord(id) {
  return registry.get(id);
}

export function getWordbook() {
  return saved.slice();
}

const sameEn = (a, b) => a && b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** Saved under this id, or under another chapter's id for the same English word. */
export function hasWord(id) {
  const en = registry.get(id)?.en;
  return saved.some((w) => w.id === id || sameEn(w.en, en));
}

export function addWord(w) {
  if (saved.some((x) => x.id === w.id || sameEn(x.en, w.en))) return;
  saved.push({ id: w.id, en: w.en, zh: w.zh, pinyin: w.pinyin, def: w.def });
  persist();
}

export function removeWord(id) {
  const en = registry.get(id)?.en;
  saved = saved.filter((w) => w.id !== id && !sameEn(w.en, en));
  persist();
}

export function onWordbookChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
