import './styles/fonts.js';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { h, bi } from './core/ui.js';
import { apply, tr } from './core/i18n.js';
import * as audio from './core/audio.js';
import { buildTopbar, buildGauge, buildFooter } from './core/chrome.js';
import { CHAPTERS, chapterById } from './chapters/registry.js';

const main = document.getElementById('main');
const mounted = new Map(); // id -> Promise
const modules = new Map(); // id -> chapter module default export

function sectionFor(c) {
  return h(
    'section',
    { id: c.id, class: 'chapter', 'data-theme': c.theme, 'aria-label': `${c.plaque} ${c.title.en}` },
    bi({ en: 'Loading…', zh: '加载中…' }, 'p', { class: 'chapter__loading' }),
  );
}

function mountChapter(id) {
  if (mounted.has(id)) return mounted.get(id);
  const c = chapterById(id);
  const section = document.getElementById(id);
  const p = c
    .load()
    .then(async (mod) => {
      const chapter = mod.default;
      modules.set(id, chapter);
      section.textContent = '';
      await chapter.mount(section, { id, meta: c });
      apply(section);
      if (current === id && chapter.ambience) audio.setAmbience(chapter.ambience);
    })
    .catch((err) => {
      console.error(`[${id}] failed to mount`, err);
      section.textContent = '';
      section.append(
        h('p', { class: 'chapter__loading' }, tr({ en: 'This chapter could not load. Reload the page to try again.', zh: '这一章没有加载成功，请刷新页面重试。' })),
      );
    });
  mounted.set(id, p);
  return p;
}

/* ── Build page ── */
async function navigate(e, id) {
  e.preventDefault();
  await mountChapter(id);
  document.getElementById(id).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  history.replaceState(null, '', `#${id}`);
}

const { bar, menu, waterline } = buildTopbar({ onNavigate: navigate });
const gauge = buildGauge({ onNavigate: navigate });
document.body.prepend(
  h('a', { class: 'skip-link', href: '#main' }, 'Skip to content / 跳到正文'),
  bar,
  waterline,
  menu,
  gauge.el,
);

for (const c of CHAPTERS) main.append(sectionFor(c));
document.body.append(buildFooter());

/* ── Lazy mounting: load a chapter when it is within ~1.5 screens ── */
const near = new IntersectionObserver(
  (entries) => {
    for (const e of entries) if (e.isIntersecting) mountChapter(e.target.id);
  },
  { rootMargin: '150% 0px 150% 0px' },
);
for (const c of CHAPTERS) near.observe(document.getElementById(c.id));

/* ── Current chapter: the one crossing the middle of the screen ── */
let current = null;
const mid = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const id = e.target.id;
      if (id === current) continue;
      current = id;
      gauge.setCurrent(id);
      const mod = modules.get(id);
      audio.setAmbience(mod?.ambience || { river: 0.25 });
    }
  },
  { rootMargin: '-50% 0px -50% 0px' },
);
for (const c of CHAPTERS) mid.observe(document.getElementById(c.id));

/* ── Reading progress → water level ── */
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    gauge.setProgress(p);
    waterline.style.width = `${(p * 100).toFixed(2)}%`;
    bar.classList.toggle('is-solid', scrollY > innerHeight * 0.6);
  });
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ── Deep links (#ch4) ── */
const hash = location.hash.slice(1);
if (hash && chapterById(hash)) {
  mountChapter(hash).then(() => document.getElementById(hash).scrollIntoView());
}

apply(document);
