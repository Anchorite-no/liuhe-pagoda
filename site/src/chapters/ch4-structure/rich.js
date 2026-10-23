/**
 * Bilingual paragraphs with inline vocabulary terms.
 *
 *   rich({ en: 'An [[arch-eave|eave]] is …', zh: '[[arch-eave|檐]]是……' })
 *
 * Markup inside the strings:
 *   [[id|shown text]]  vocabulary button (term() from core/ui.js)
 *   _text_             <em> (book and journal titles)
 * The element re-renders itself when the language changes.
 */
import { h, term } from '../../core/ui.js';
import { getLang, onLangChange, tr } from '../../core/i18n.js';
import { WORDS } from './vocab.js';

const TOKEN = /\[\[([\w-]+)\|([^\]]+)\]\]|_([^_]+)_/g;

export function fillRich(el, str) {
  el.textContent = '';
  let last = 0;
  for (const m of str.matchAll(TOKEN)) {
    if (m.index > last) el.append(str.slice(last, m.index));
    if (m[1]) {
      const w = WORDS[m[1]];
      el.append(w ? term(w, m[2]) : m[2]);
    } else {
      el.append(h('em', null, m[3]));
    }
    last = m.index + m[0].length;
  }
  if (last < str.length) el.append(str.slice(last));
  return el;
}

export function rich(pair, tag = 'p', attrs = {}) {
  const el = h(tag, attrs);
  let shown = null;
  const render = () => {
    const lang = getLang();
    if (shown === lang) return;
    shown = lang;
    fillRich(el, tr(pair));
  };
  render();
  const off = onLangChange(() => {
    if (!el.isConnected) return off();
    render();
  });
  return el;
}

/** Keep any callback in sync with the language while `el` stays in the document. */
export function onLang(el, fn) {
  fn();
  const off = onLangChange(() => {
    if (!el.isConnected) return off();
    fn();
  });
}
