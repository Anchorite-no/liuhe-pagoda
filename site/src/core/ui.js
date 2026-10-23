/**
 * Small DOM helpers and shared UI pieces. No framework.
 */
import { t, tr, getLang, onLangChange, apply } from './i18n.js';
import { addWord, hasWord, removeWord } from './vocab.js';

/**
 * h('div', { class: 'panel', onclick: fn, 'data-i18n': 'ch3.x' }, child, 'text', [more])
 * - attributes starting with "on" become listeners
 * - `style` may be an object
 * - children: strings, nodes, arrays, null/false (skipped)
 */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === 'style' && typeof v === 'object') {
        Object.assign(el.style, v);
      } else if (k === 'class' || k === 'className') {
        el.className = v;
      } else if (k === 'html') {
        el.innerHTML = v;
      } else if (k === 'text') {
        el.textContent = v;
      } else if (v === true) {
        el.setAttribute(k, '');
      } else {
        el.setAttribute(k, v);
      }
    }
  }
  appendChildren(el, children);
  return el;
}

function appendChildren(el, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) appendChildren(el, c);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

/** Text node/element bound to an i18n key (updates on language change). */
export function txt(key, tag = 'span', attrs = {}) {
  return h(tag, { ...attrs, 'data-i18n': key }, t(key));
}

/** Element whose content is an inline { en, zh } pair, kept in sync with the language. */
export function bi(pair, tag = 'span', attrs = {}) {
  const el = h(tag, attrs, tr(pair));
  const off = onLangChange(() => {
    if (!el.isConnected) return off();
    el.textContent = tr(pair);
  });
  return el;
}

const CN_NUM = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

/**
 * Chapter header with the vertical Chinese plaque.
 * @param {object} o
 * @param {string} o.plaque   short Chinese name shown vertically, e.g. '造潮'
 * @param {number} [o.index]  chapter number (shown as a Chinese numeral on the plaque)
 * @param {{en:string, zh:string}} o.title
 * @param {{en:string, zh:string}} [o.lede]
 */
export function chapterHeader({ plaque, index, title, lede }) {
  const plaqueEl = h(
    'div',
    { class: 'plaque', 'aria-hidden': 'true' },
    index != null ? h('span', { class: 'plaque__num' }, CN_NUM[index] ?? String(index)) : null,
    plaque,
  );
  const titleEl = bi(title, 'h2', { class: 'ch-head__title' });
  const ledeEl = lede ? bi(lede, 'p', { class: 'ch-head__lede' }) : null;
  return h('header', { class: 'ch-head' }, plaqueEl, h('div', { class: 'ch-head__text' }, titleEl, ledeEl));
}

/**
 * Labelled range slider.
 * @returns {{ el: HTMLElement, input: HTMLInputElement, set(v:number):void, get():number }}
 */
export function rangeSlider({ label, min = 0, max = 1, step = 0.01, value = 0, format, onInput, id }) {
  const inputId = id || `r-${Math.random().toString(36).slice(2, 8)}`;
  const fmt = format || ((v) => String(v));
  const valueEl = h('output', { class: 'range__value', for: inputId });
  const input = h('input', { type: 'range', id: inputId, min, max, step, value });
  const labelEl = h('label', { for: inputId }, tr(label));
  const el = h('div', { class: 'range' }, h('div', { class: 'range__top' }, labelEl, valueEl), input);
  const sync = () => {
    valueEl.textContent = fmt(Number(input.value));
  };
  input.addEventListener('input', () => {
    sync();
    onInput && onInput(Number(input.value));
  });
  const off = onLangChange(() => {
    if (!el.isConnected) return off();
    labelEl.textContent = tr(label);
    sync();
  });
  sync();
  return {
    el,
    input,
    set(v) {
      input.value = v;
      sync();
    },
    get: () => Number(input.value),
  };
}

/**
 * Segmented control (single choice).
 * options: [{ value, label: {en, zh} }]
 */
export function segmented({ options, value, onChange, ariaLabel }) {
  const el = h('div', { class: 'seg', role: 'group' });
  const buttons = options.map((o) => {
    const b = h('button', { type: 'button', 'aria-pressed': String(o.value === value) }, tr(o.label));
    b.addEventListener('click', () => api.set(o.value, true));
    el.append(b);
    return b;
  });
  const sync = () => {
    if (ariaLabel) el.setAttribute('aria-label', tr(ariaLabel));
    options.forEach((o, i) => {
      buttons[i].textContent = tr(o.label);
      buttons[i].setAttribute('aria-pressed', String(o.value === value));
    });
  };
  const off = onLangChange(() => {
    if (!el.isConnected) return off();
    sync();
  });
  const api = {
    el,
    get: () => value,
    set(v, fire = false) {
      value = v;
      sync();
      if (fire && onChange) onChange(v);
    },
  };
  sync();
  return api;
}

/* ───────────── Speech (text-to-speech) ───────────── */
export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Speak text aloud. lang: 'en' | 'zh' (or a BCP-47 tag). */
export function speak(text, lang = 'en', rate = 0.92) {
  if (!canSpeak()) return false;
  const tag = lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : lang;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = tag;
  u.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang === tag) || voices.find((v) => v.lang && v.lang.startsWith(tag.slice(0, 2)));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
  return true;
}

/* ───────────── Vocabulary term with popover ───────────── */
let openPopover = null;

function closePopover(refocus = false) {
  if (!openPopover) return;
  openPopover.el.remove();
  openPopover.trigger.setAttribute('aria-expanded', 'false');
  if (refocus) openPopover.trigger.focus({ preventScroll: true });
  document.removeEventListener('keydown', openPopover.onKey);
  document.removeEventListener('pointerdown', openPopover.onDown, true);
  openPopover = null;
}

/**
 * Inline vocabulary term. Clicking opens a card with English, Chinese, pinyin,
 * a short definition, pronunciation, and "add to my wordbook".
 * @param {object} w { id, en, zh, pinyin?, def: {en, zh}, example?: {en, zh} }
 * @param {string|{en,zh}} [display] what to show inline (defaults to the term in the current language)
 */
export function term(w, display) {
  const btn = h('button', { type: 'button', class: 'term', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' });
  const label = () => (display ? tr(display) : getLang() === 'zh' ? w.zh : w.en);
  btn.textContent = label();
  const off = onLangChange(() => {
    if (!btn.isConnected) return off();
    btn.textContent = label();
  });
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (openPopover && openPopover.trigger === btn) return closePopover(true);
    closePopover();
    showTermCard(w, btn);
  });
  return btn;
}

function showTermCard(w, trigger) {
  const saved = () => hasWord(w.id);
  const saveBtn = h('button', { type: 'button', class: 'btn btn--ghost' });
  const syncSave = () => {
    saveBtn.textContent = saved() ? tr({ en: 'Saved to wordbook', zh: '已加入词本' }) : tr({ en: 'Add to wordbook', zh: '加入词本' });
    saveBtn.setAttribute('aria-pressed', String(saved()));
  };
  saveBtn.addEventListener('click', () => {
    if (saved()) removeWord(w.id);
    else addWord(w);
    syncSave();
  });
  syncSave();
  const actions = h('div', { class: 'popover__actions' });
  if (canSpeak()) {
    actions.append(
      h('button', { type: 'button', class: 'btn', onclick: () => speak(w.en, 'en') }, tr({ en: 'Hear it', zh: '听英文' })),
    );
  }
  actions.append(saveBtn);
  const el = h(
    'div',
    { class: 'popover', role: 'dialog', 'aria-label': w.en },
    h(
      'div',
      { class: 'popover__head' },
      h('span', { class: 'popover__en', lang: 'en' }, w.en),
      h('span', { class: 'popover__zh', lang: 'zh-CN' }, w.zh),
      w.pinyin ? h('span', { class: 'popover__py' }, w.pinyin) : null,
    ),
    w.def ? h('p', { style: { margin: '0 0 8px' } }, tr(w.def)) : null,
    w.example ? h('p', { style: { margin: 0, fontStyle: 'italic', color: '#4a575a' } }, tr(w.example)) : null,
    actions,
  );
  document.body.append(el);
  const r = trigger.getBoundingClientRect();
  const pw = el.offsetWidth;
  const ph = el.offsetHeight;
  let left = Math.min(Math.max(16, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 16);
  let top = r.bottom + 10;
  if (top + ph > window.innerHeight - 16) top = Math.max(16, r.top - ph - 10);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  trigger.setAttribute('aria-expanded', 'true');
  const onKey = (e) => {
    if (e.key === 'Escape') closePopover(true);
  };
  const onDown = (e) => {
    if (!el.contains(e.target) && e.target !== trigger) closePopover();
  };
  document.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', onDown, true);
  openPopover = { el, trigger, onKey, onDown };
  (actions.querySelector('button') || el).focus({ preventScroll: true });
}

window.addEventListener('scroll', () => {
  if (openPopover) closePopover();
}, { passive: true });

/** Re-apply data-i18n bindings inside an element (after you render new markup). */
export function localize(root) {
  apply(root);
  return root;
}

/** True when the user asked for reduced motion. */
export function reducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Simple announcement for screen readers. */
let liveRegion;
export function announce(message) {
  if (!liveRegion) {
    liveRegion = h('div', { class: 'visually-hidden', 'aria-live': 'polite' });
    document.body.append(liveRegion);
  }
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 30);
}
