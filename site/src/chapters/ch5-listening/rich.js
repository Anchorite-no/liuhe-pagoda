/**
 * Bilingual paragraphs with inline vocabulary terms.
 *   rich({ en: 'The tide is [[lit-punctual|punctual]].', zh: '…' }, 'p')
 * Tokens: [[term-id]] or [[term-id|shown text]] → term() button; *text* → <em>.
 * The element re-renders itself when the language changes.
 */
import { h, term } from '../../core/ui.js';
import { tr, onLangChange } from '../../core/i18n.js';
import { getWord } from '../../core/vocab.js';

const TOKEN = /\[\[([\w-]+)(?:\|([^\]]+))?\]\]|\*([^*]+)\*/g;

export function richNodes(str) {
  const out = [];
  let last = 0;
  for (const m of str.matchAll(TOKEN)) {
    if (m.index > last) out.push(str.slice(last, m.index));
    if (m[1]) {
      const w = getWord(m[1]);
      const shown = m[2] ? { en: m[2], zh: m[2] } : undefined;
      out.push(w ? term(w, shown) : m[2] || m[1]);
    } else {
      out.push(h('em', null, m[3]));
    }
    last = m.index + m[0].length;
  }
  if (last < str.length) out.push(str.slice(last));
  return out;
}

export function rich(pair, tag = 'p', attrs = {}) {
  const el = h(tag, attrs);
  const render = () => el.replaceChildren(...richNodes(tr(pair)));
  render();
  const off = onLangChange(() => {
    if (!el.isConnected) return off();
    render();
  });
  return el;
}
