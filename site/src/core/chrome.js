/**
 * Site chrome: top bar (brand, language, sound, menu), the tide-gauge side navigation,
 * the mobile water line + menu, and the footer with sources.
 */
import { h, bi } from './ui.js';
import { tr, getLang, setLang, onLangChange } from './i18n.js';
import * as audio from './audio.js';
import { CHAPTERS } from '../chapters/registry.js';

const CN = ['序', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

export function buildTopbar({ onNavigate } = {}) {
  const enBtn = h('button', { type: 'button', lang: 'en' }, 'EN');
  const zhBtn = h('button', { type: 'button', lang: 'zh-CN' }, '中文');
  const syncLang = () => {
    enBtn.setAttribute('aria-pressed', String(getLang() === 'en'));
    zhBtn.setAttribute('aria-pressed', String(getLang() === 'zh'));
  };
  enBtn.addEventListener('click', () => setLang('en'));
  zhBtn.addEventListener('click', () => setLang('zh'));
  syncLang();
  onLangChange(syncLang);
  const langSwitch = h('div', { class: 'lang-switch', role: 'group', 'aria-label': 'Language / 语言' }, enBtn, zhBtn);

  const soundBtn = h('button', { type: 'button', class: 'tool-btn tool-btn--sound' });
  const soundIcon = (on) =>
    `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/>${
      on ? '<path d="M16 9c1.3 1.6 1.3 4.4 0 6M18.5 6.5c2.8 3 2.8 8 0 11"/>' : '<path d="M17 9.5l5 5M22 9.5l-5 5"/>'
    }</svg>`;
  const syncSound = () => {
    const on = audio.isEnabled();
    soundBtn.setAttribute('aria-pressed', String(on));
    const label = on ? tr({ en: 'Sound on', zh: '声音开' }) : tr({ en: 'Sound off', zh: '声音关' });
    soundBtn.innerHTML = `${soundIcon(on)}<span class="tool-btn__text">${label}</span>`;
    soundBtn.setAttribute('aria-label', tr({ en: 'River sounds', zh: '江声' }));
  };
  soundBtn.addEventListener('click', () => audio.setEnabled(!audio.isEnabled()));
  audio.onSoundChange(syncSound);
  onLangChange(syncSound);
  syncSound();

  const menu = buildMenu(onNavigate);
  const menuBtn = h('button', { type: 'button', class: 'tool-btn menu-btn', 'aria-expanded': 'false', 'aria-controls': 'site-menu' });
  const syncMenuLabel = () => {
    menuBtn.textContent = tr({ en: 'Chapters', zh: '目录' });
  };
  syncMenuLabel();
  onLangChange(syncMenuLabel);
  menuBtn.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      menu.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  const bar = h(
    'header',
    { class: 'topbar' },
    h(
      'a',
      { class: 'brand', href: '#ch0' },
      h('span', { class: 'brand__zh', lang: 'zh-CN' }, '潮起六和'),
      h('span', { class: 'brand__en', lang: 'en' }, 'Where the Tide Turns'),
    ),
    h('div', { class: 'topbar__tools' }, langSwitch, soundBtn, menuBtn),
  );
  const waterline = h('div', { class: 'waterline', 'aria-hidden': 'true' });
  return { bar, menu, waterline };
}

function buildMenu(onNavigate) {
  const list = h('ol');
  CHAPTERS.forEach((c, i) => {
    const a = h('a', { href: `#${c.id}` }, h('span', { class: 'zh', lang: 'zh-CN' }, c.plaque), bi(c.title));
    if (onNavigate) a.addEventListener('click', (e) => onNavigate(e, c.id));
    list.append(h('li', null, a));
  });
  return h('nav', { class: 'menu', id: 'site-menu', hidden: true, 'aria-label': 'Chapters' }, list);
}

/** Tide-gauge side navigation. Returns { el, setProgress(0..1), setCurrent(id) } */
export function buildGauge({ onNavigate } = {}) {
  const water = h('div', { class: 'gauge__water' });
  const marks = h('ol', { class: 'gauge__marks' });
  const links = new Map();
  CHAPTERS.forEach((c, i) => {
    const pct = CHAPTERS.length === 1 ? 50 : 3 + (i / (CHAPTERS.length - 1)) * 94;
    const a = h('a', { href: `#${c.id}` }, CN[i] ?? String(i));
    const tip = bi(c.title, 'span', { class: 'gauge__tip' });
    const syncLabel = () => a.setAttribute("aria-label", `${c.plaque}: ${tr(c.title)}`);
    syncLabel();
    onLangChange(syncLabel);
    if (onNavigate) a.addEventListener('click', (e) => onNavigate(e, c.id));
    marks.append(h('li', { class: 'gauge__mark', style: { top: `${pct}%` } }, a, tip));
    links.set(c.id, a);
  });
  const el = h(
    'nav',
    { class: 'gauge', 'aria-label': 'Chapters / 章节' },
    h('div', { class: 'gauge__column' }, water, marks),
  );
  return {
    el,
    setProgress(p) {
      water.style.height = `${(p * 100).toFixed(2)}%`;
    },
    setCurrent(id) {
      for (const [cid, a] of links) {
        if (cid === id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      }
    },
  };
}

/** Footer: credits + every chapter's sources (loaded lazily). */
export function buildFooter() {
  const sourcesWrap = h('div');
  const el = h(
    'footer',
    { class: 'site-footer', id: 'sources' },
    bi({ en: 'Sources and credits', zh: '资料来源与说明' }, 'h2'),
    bi(
      {
        en: 'Made for the course “Chinese Culture and International Communication”, Zhejiang University, autumn–winter 2026. The 3D models, textures and sounds on this site are generated in code; the pagoda is an educational model, not a survey drawing.',
        zh: '本网站为浙江大学《中国文化与国际传播》课程作业（2026 年秋冬学期）。网站中的 3D 模型、材质和声音均由代码生成；六和塔模型是教学示意模型，不是测绘图。',
      },
      'p',
      { style: { maxWidth: '80ch' } },
    ),
    bi(
      {
        en: 'Dates and figures come from the sources below. Where sources disagree, the text says so.',
        zh: '文中年代与数据来自下列资料；各资料说法不一致的地方，正文中已注明。',
      },
      'p',
      { style: { maxWidth: '80ch' } },
    ),
    sourcesWrap,
  );

  let loaded = false;
  const render = async () => {
    const mods = await Promise.all(CHAPTERS.map((c) => c.load().catch(() => null)));
    sourcesWrap.textContent = '';
    CHAPTERS.forEach((c, i) => {
      const src = mods[i]?.default?.sources;
      if (!src || !src.length) return;
      const ul = h('ul');
      for (const s of src) {
        const title = typeof s.title === 'string' ? s.title : tr(s.title);
        ul.append(h('li', null, s.url ? h('a', { href: s.url, target: '_blank', rel: 'noopener' }, title) : title, s.note ? ` (${tr(s.note)})` : ''));
      }
      sourcesWrap.append(h('h3', null, `${c.plaque}  ${tr(c.title)}`), ul);
    });
  };
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting) && !loaded) {
        loaded = true;
        render();
        io.disconnect();
      }
    },
    { rootMargin: '400px 0px' },
  );
  io.observe(el);
  onLangChange(() => loaded && render());
  return el;
}
