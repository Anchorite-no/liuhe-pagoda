/** Small helpers for ch7 (kept local so the chapter stays self-contained). */
import { h, term, canSpeak, speak } from '../../core/ui.js';
import { tr, onLangChange } from '../../core/i18n.js';
import { getWord } from '../../core/vocab.js';

/** Keep an element's text in sync with a { en, zh } pair or a function returning a string. */
export function live(el, src, attr) {
  const set = () => {
    const v = typeof src === 'function' ? src() : tr(src);
    if (attr) el.setAttribute(attr, v);
    else el.textContent = v;
  };
  set();
  const off = onLangChange(() => {
    if (!el.isConnected) return off();
    set();
  });
  el._refresh = set;
  return el;
}

export function sayBtn(getText, label = { en: 'Hear it', zh: '听英文' }, cls = 'ch7-say') {
  if (!canSpeak()) return null;
  const b = h('button', {
    type: 'button',
    class: cls,
    onclick: () => speak(typeof getText === 'function' ? getText() : getText, 'en', 0.92),
  });
  return live(b, label);
}

const TOKEN = /\[\[([\w-]+)(?:\|([^\]]+))?\]\]/g;

/** Paragraph with [[term-id|shown]] tokens turned into vocabulary buttons; re-renders on language change. */
export function rich(pair, tag = 'p', attrs = {}) {
  const el = h(tag, attrs);
  const render = () => {
    const str = tr(pair);
    const out = [];
    let last = 0;
    for (const m of str.matchAll(TOKEN)) {
      if (m.index > last) out.push(str.slice(last, m.index));
      const w = getWord(m[1]);
      out.push(w ? term(w, m[2] ? { en: m[2], zh: m[2] } : undefined) : m[2] || m[1]);
      last = m.index + m[0].length;
    }
    if (last < str.length) out.push(str.slice(last));
    el.replaceChildren(...out);
  };
  render();
  const off = onLangChange(() => {
    if (!el.isConnected) return off();
    render();
  });
  return el;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    const ta = h('textarea', { style: { position: 'fixed', opacity: '0' } }, text);
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (__) {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

const KEY = 'liuhe.ch7';
export function loadState() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch (_) {
    return {};
  }
}
export function saveState(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj));
  } catch (_) {
    /* storage unavailable: state lives for this visit */
  }
}

/** Speak a list of English words one after another. */
export function speakAll(list) {
  if (!canSpeak() || !list.length) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voices = synth.getVoices();
  const voice = voices.find((v) => v.lang === 'en-US') || voices.find((v) => v.lang && v.lang.startsWith('en'));
  for (const text of list) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    if (voice) u.voice = voice;
    synth.speak(u);
  }
}

export function fmtTime(s) {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}
