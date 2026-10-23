/**
 * Tiny bilingual (en / zh) dictionary system.
 *
 *   register('ch3', { en: { title: 'Make a Tide' }, zh: { title: '造一次潮' } })
 *   t('ch3.title')                 → string in the current language
 *   t('ch3.count', { n: 3 })       → replaces {n}
 *   tr({ en: 'Hi', zh: '你好' })    → inline pair, no registration needed
 *
 * DOM binding (call apply(root) after rendering, it is also re-run on every language change):
 *   <h2 data-i18n="ch3.title"></h2>                     → textContent
 *   <p data-i18n-html="ch3.lede"></p>                   → innerHTML (only for trusted, authored strings)
 *   <button data-i18n-attr="aria-label:ch3.play;title:ch3.play">
 */

const dicts = { en: {}, zh: {} };
const listeners = new Set();

function readStoredLang() {
  try {
    const v = localStorage.getItem('liuhe.lang');
    if (v === 'en' || v === 'zh') return v;
  } catch (_) {
    /* storage unavailable */
  }
  return null;
}

function urlLang() {
  try {
    const v = new URLSearchParams(location.search).get('lang');
    if (v === 'en' || v === 'zh') return v;
  } catch (_) {
    /* ignore */
  }
  return null;
}

// Default to English: the course trains English expression. Chinese is one click away.
let lang = urlLang() || readStoredLang() || 'en';

function setDocLang() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
}
setDocLang();

function deepMerge(target, src) {
  for (const k of Object.keys(src)) {
    const v = src[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      target[k] = deepMerge(target[k] && typeof target[k] === 'object' ? target[k] : {}, v);
    } else {
      target[k] = v;
    }
  }
  return target;
}

export function register(ns, pair) {
  for (const l of ['en', 'zh']) {
    if (!pair[l]) continue;
    dicts[l][ns] = deepMerge(dicts[l][ns] || {}, pair[l]);
  }
}

function lookup(l, key) {
  let node = dicts[l];
  for (const part of key.split('.')) {
    if (node == null) return undefined;
    node = node[part];
  }
  return node;
}

function fill(str, vars) {
  if (!vars || typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Value for key in current language. Falls back to the other language, then to the key. */
export function t(key, vars) {
  let v = lookup(lang, key);
  if (v === undefined) v = lookup(lang === 'en' ? 'zh' : 'en', key);
  if (v === undefined) {
    if (import.meta.env.DEV) console.warn('[i18n] missing key', key);
    return key;
  }
  return fill(v, vars);
}

/** Raw value (may be an array/object) for key in current language. */
export function tv(key) {
  const v = lookup(lang, key);
  return v === undefined ? lookup(lang === 'en' ? 'zh' : 'en', key) : v;
}

/** Inline pair: tr({ en, zh }) */
export function tr(pair, vars) {
  if (pair == null) return '';
  if (typeof pair === 'string') return pair;
  return fill(pair[lang] ?? pair.en ?? pair.zh ?? '', vars);
}

export function getLang() {
  return lang;
}

export function setLang(next) {
  if (next !== 'en' && next !== 'zh') return;
  if (next === lang) return;
  lang = next;
  try {
    localStorage.setItem('liuhe.lang', lang);
  } catch (_) {
    /* ignore */
  }
  setDocLang();
  apply(document);
  for (const fn of listeners) {
    try {
      fn(lang);
    } catch (e) {
      console.error(e);
    }
  }
}

/** Subscribe to language changes. Returns an unsubscribe function. */
export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function apply(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  });
}
