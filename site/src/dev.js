/**
 * Single-chapter harness for development: /dev.html?ch=ch3
 * Mounts one chapter immediately, with the real top bar (language + sound).
 * Add &lang=zh to start in Chinese.
 */
import './styles/fonts.js';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { h } from './core/ui.js';
import { apply } from './core/i18n.js';
import * as audio from './core/audio.js';
import { buildTopbar } from './core/chrome.js';
import { CHAPTERS, chapterById } from './chapters/registry.js';

const params = new URLSearchParams(location.search);
const id = params.get('ch') || 'ch0';
const c = chapterById(id);
const main = document.getElementById('main');

const { bar, menu } = buildTopbar();
document.body.prepend(bar, menu);
addEventListener('scroll', () => bar.classList.toggle('is-solid', scrollY > 80), { passive: true });

if (!c) {
  main.append(h('p', { style: { padding: '120px 24px' } }, `Unknown chapter "${id}". Try one of: ${CHAPTERS.map((x) => x.id).join(', ')}`));
} else {
  // spacer above so scroll-triggered effects have room to start
  if (params.has('spacer')) main.append(h('div', { style: { height: '100vh', background: '#0e1316' } }));
  const section = h('section', { id: c.id, class: 'chapter', 'data-theme': c.theme });
  main.append(section);
  main.append(h('div', { style: { height: '60vh', background: '#0e1316' } }));
  c.load().then(async (mod) => {
    const chapter = mod.default;
    await chapter.mount(section, { id: c.id, meta: c });
    apply(section);
    if (chapter.ambience) audio.setAmbience(chapter.ambience);
    window.__chapter = chapter;
    console.info(`[dev] mounted ${c.id}`);
  });
}
apply(document);
