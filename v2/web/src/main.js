import './fonts.css'; // Noto Serif SC, only the characters the site uses (tools/subset_fonts.py)
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/400-italic.css';
import '@fontsource/ibm-plex-mono/500.css';
import './style.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import Lenis from 'lenis';

import { TITLE, CHAPTERS, QUIZ, SOURCES } from './content.js';
import { createViewer, STAGE_VIEWS } from './viewer.js';
import { createInkField } from './ascii.js';
import { quizBlock } from './learn.js';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(c));
  return el;
};
const SEALS = ['壹', '贰', '叁', '肆', '伍', '陆'];
// a dry brush stroke, drawn under each chapter title
const brush = () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 320 24');
  svg.setAttribute('class', 'brush');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path d="M4 15 C 60 7, 120 18, 180 11 S 280 8, 316 13" />';
  return svg;
};

const app = document.getElementById('app');

/* ───────── the stage: live model, framed pictures, the ink crowd ───────── */
const view3d = $('div', { class: 'stage__3d' });
const loading = $('div', { class: 'stage__loading' }, $('span', {}, '载入三维模型 Loading the 3D model'), $('i', { class: 'stage__bar' }));
const info = $('div', { class: 'info', role: 'status' });
const plates = $('div', { class: 'stage__plates' });
const inkCanvas = $('canvas', { class: 'ink', 'aria-hidden': 'true' });
const zoomBar = $('div', { class: 'ctrl', role: 'group', 'aria-label': '三维控制 3D controls' },
  $('span', { class: 'ctrl__hint' }, '拖动旋转 · Ctrl+滚轮缩放 ', $('i', {}, 'Drag to turn · Ctrl+scroll to zoom')),
  $('button', { type: 'button', title: '放大 Zoom in', onclick: () => viewer.zoom(0.7) }, '+'),
  $('button', { type: 'button', title: '缩小 Zoom out', onclick: () => viewer.zoom(1 / 0.7) }, '−'),
  $('button', { type: 'button', title: '回到这一步的视角 Reset view', onclick: () => viewer.resetView() }, '⟲'),
  $('button', { type: 'button', class: 'ctrl__explore', onclick: () => setExplore(true) }, '全屏探索', $('i', {}, 'Explore')),
);
const stage = $('div', { class: 'stage' }, inkCanvas, view3d, plates, loading, info, zoomBar);

/* ───────── header ───────── */
const navItems = CHAPTERS.map((c, i) =>
  $('a', { href: `#${c.id}`, class: 'nav__item', title: `${c.title.zh} ${c.title.en}` }, $('b', {}, SEALS[i]), $('span', {}, c.title.zh)),
);
const progress = $('i', { class: 'top__progress' });
const top = $('header', { class: 'top' },
  $('a', { class: 'top__name', href: '#cover' }, $('b', { class: 'seal seal--sm' }, '六和'), $('span', {}, '六和塔'), $('i', {}, 'Liuhe Pagoda')),
  $('nav', { class: 'nav', 'aria-label': '章节 Chapters' }, navItems),
  progress,
);

/* ───────── cover ───────── */
const coverTitle = $('h1', { class: 'cover__title' }, TITLE.zh);
const cover = $('section', { class: 'cover', id: 'cover' },
  coverTitle,
  $('div', { class: 'cover__side' },
    $('p', { class: 'cover__en', lang: 'en' }, TITLE.en),
    $('p', { class: 'cover__sub' }, TITLE.sub.zh),
    $('p', { class: 'cover__sub cover__sub--en', lang: 'en' }, TITLE.sub.en),
    $('p', { class: 'cover__course' }, '浙江大学《中国文化与国际传播》', $('br'), $('i', { lang: 'en' }, 'Chinese Culture and International Communication, ZJU')),
  ),
  $('div', { class: 'cover__cue', 'aria-hidden': 'true' }, $('span', {}, '向下 Scroll'), $('i')),
);

/* ───────── chapters ───────── */
const steps = []; // { el, step, chapter }: every card, and each chapter title (its first step)
const story = $('main', { class: 'story' }, cover);
CHAPTERS.forEach((ch, ci) => {
  const head = $('header', { class: 'chapter__head' },
    $('b', { class: 'seal' }, SEALS[ci]),
    $('h2', {}, ch.title.zh),
    $('p', { class: 'chapter__en', lang: 'en' }, ch.title.en),
    brush(),
  );
  const sec = $('section', { class: `chapter${ch.practice ? ' chapter--practice' : ''}`, id: ch.id }, head);
  // the title already sets the stage for the chapter's first step: a jump from the nav lands on
  // the title, and should not leave up whatever the page scrolled past on the way
  steps.push({ el: head, step: ch.steps[0], chapter: ci });
  ch.steps.forEach((st, si) => {
    const card = $('article', { class: `card${st.hold ? ' card--hold' : ''}` });
    if (st.zh) card.append($('p', { class: 'zh' }, st.zh), $('p', { class: 'en', lang: 'en' }, st.en));
    if (st.timeline)
      card.append($('ol', { class: 'timeline' }, st.timeline.map(([y, t]) => $('li', {}, $('span', { class: 'timeline__y' }, y), $('span', { class: 'zh' }, t.zh), $('i', { class: 'en', lang: 'en' }, t.en)))));
    if (st.explore)
      card.append($('button', { type: 'button', class: 'btn cta', onclick: () => setExplore(true) }, '全屏自己拆一拆 ', $('i', { lang: 'en' }, 'Take it apart yourself')));
    if (si === ch.steps.length - 1 && ch.terms)
      card.append($('dl', { class: 'terms' }, ch.terms.map(([zh, en]) => [$('dt', {}, zh), $('dd', { lang: 'en' }, en)])));
    if (ch.practice) card.append(quizBlock($, QUIZ));
    steps.push({ el: card, step: st, chapter: ci });
    sec.append(card);
  });
  story.append(sec);
});

/* ───────── footer ───────── */
const foot = $('footer', { class: 'foot', id: 'sources' },
  $('div', { class: 'foot__inner' },
    $('h2', {}, '资料来源 ', $('i', { lang: 'en' }, 'Sources')),
    $('ul', {}, SOURCES.map(([t, u]) => $('li', {}, $('a', { href: u, target: '_blank', rel: 'noopener' }, t)))),
    $('p', {}, '浙江大学《中国文化与国际传播》课程作业。六和塔三维模型依据公开资料与照片在 Blender 中程序化建模，属于教学示意，不是测绘图。'),
    $('p', { lang: 'en' }, 'Made for the ZJU course “Chinese Culture and International Communication”. The 3D pagoda was modelled procedurally in Blender from published figures and photographs; it is a teaching reconstruction, not a survey.'),
  ),
);

/* ───────── explore mode ───────── */
const stageBtns = [
  ['完整', 'Whole'],
  ['打开外壳', 'Casing off'],
  ['七明六暗', 'Seven & six'],
  ['一层檐', 'One eave'],
  ['剖开', 'Cut open'],
].map(([zh, en], k) => $('button', { type: 'button', 'aria-pressed': String(k === 0), onclick: () => viewer.setStage(k) }, zh, $('i', { lang: 'en' }, en)));
const slider = $('input', { type: 'range', min: 0, max: 4000, value: 0, step: 1, 'aria-label': '拆解 Take apart' });
slider.addEventListener('input', () => viewer.setU(slider.value / 1000));
const exploreUI = $('div', { class: 'explore', hidden: true },
  $('button', { type: 'button', class: 'explore__close', onclick: () => setExplore(false) }, '← 返回阅读 ', $('i', { lang: 'en' }, 'Back to the story')),
  $('p', { class: 'explore__hint' }, '拖动旋转 · 滚轮缩放 · 点构件看介绍', $('br'), $('i', { lang: 'en' }, 'Drag to turn · scroll to zoom · click a part')),
  $('div', { class: 'explore__bar' },
    $('label', { class: 'explore__slider' }, $('span', {}, '拆解 ', $('i', { lang: 'en' }, 'Take apart')), slider),
    $('div', { class: 'explore__stages', role: 'group' }, stageBtns),
  ),
);

app.append(stage, top, story, foot, exploreUI);

/* ───────── the model ───────── */
const viewer = createViewer(view3d, {
  onProgress: (f) => loading.style.setProperty('--p', f),
  onReady: () => {
    gsap.to(loading, { opacity: 0, duration: 0.8, onComplete: () => loading.remove() });
    if (!reduce) gsap.from(view3d, { opacity: 0, y: 40, duration: 1.6, ease: 'power3.out' });
    activate(current, true);
  },
  onChange: ({ u, stage: k }) => {
    if (document.activeElement !== slider) slider.value = Math.round(u * 1000);
    stageBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === k)));
  },
});
viewer.attachInfo(info);
// in explore mode the slider shows the callouts of the nearest step
const stageLabels = {};
for (const c of CHAPTERS) for (const s of c.steps) if (s.view && s.labels && STAGE_VIEWS.includes(s.view)) stageLabels[s.view] = s.labels;
viewer.setStageLabels(stageLabels);
viewer.start();
createInkField(inkCanvas, { getScroll: () => (lenis ? lenis.animatedScroll : scrollY) });

/* ───────── which step is being read → what the stage shows ───────── */
const plateLayers = new Map();
// a re-rendered clip keeps its file name; browsers that kept an older one for a week (as the
// server once told them to) see a new address and fetch it again
const fresh = (url) => `${url}?v=2`;
function plateFor(st) {
  const key = st.video || st.image;
  if (!plateLayers.has(key)) {
    // a looping clip where there is one (the still is its poster), otherwise the still
    const img = st.video
      ? $('video', { src: fresh(st.video), poster: fresh(st.image), muted: true, loop: true, playsinline: true, preload: 'auto', 'aria-hidden': 'true' })
      : $('img', { src: fresh(st.image), alt: '', decoding: 'async' });
    if (st.video) img.muted = true;
    // where the crop centres when the frame is narrower than the picture (phones)
    if (st.focus) img.style.objectPosition = st.focus;
    const el = $('div', { class: 'plate' }, img);
    plates.append(el);
    plateLayers.set(key, { el, img, video: !!st.video, on: false });
  }
  return plateLayers.get(key);
}
const playPlate = (p, on) => {
  if (!p || !p.video) return;
  if (on && !reduce) p.img.play().catch(() => {});
  else p.img.pause();
};
/** One picture (or none) is up; every other one fades out. A new fade takes over the layer's
 *  opacity from any fade still running on it (overwrite): a chapter jump passes several steps
 *  in a second, and an older fade-in would otherwise finish after the newer fade-out and leave
 *  its picture stuck on top of the page. */
function showPlate(p) {
  for (const layer of plateLayers.values()) {
    const on = layer === p;
    if (layer.on === on) continue;
    layer.on = on;
    if (on) {
      playPlate(layer, true);
      if (!reduce && !layer.video) gsap.fromTo(layer.img, { scale: 1.08 }, { scale: 1, duration: 9, ease: 'none', overwrite: 'auto' });
    }
    gsap.to(layer.el, { opacity: on ? 1 : 0, duration: on ? 1.1 : 0.9, ease: 'power2.inOut', overwrite: 'auto', onComplete: on ? null : () => playPlate(layer, false) });
  }
}
let current = { view: 'whole' };
// the practice card is wider than the story column: the tower moves right to stay clear of it
const roomFor = (st) => (st.view === 'practice' ? document.querySelector('.chapter--practice .card').getBoundingClientRect().right : 0);
addEventListener('resize', () => !current.image && viewer.setRoom(roomFor(current)));
function activate(st, force = false) {
  if (st === current && !force) return;
  current = st;
  if (st.image) {
    showPlate(plateFor(st));
    gsap.to([view3d, zoomBar], { opacity: 0, duration: 0.8, overwrite: 'auto', onComplete: () => current.image && viewer.stop() });
    // the faded tower still sits on the stage: it must not take clicks, drags or the zoom wheel
    view3d.classList.add('is-off');
    zoomBar.classList.add('is-off');
    viewer.hideInfo();
  } else {
    showPlate(null);
    viewer.setRoom(roomFor(st));
    viewer.start();
    gsap.to([view3d, zoomBar], { opacity: 1, duration: 0.8, overwrite: 'auto' });
    view3d.classList.remove('is-off');
    zoomBar.classList.remove('is-off');
    if (viewer.ready) viewer.show(st.view || 'whole', st.labels);
  }
}

/* ───────── motion: smooth scrolling, reveals, the steps ───────── */
const lenis = reduce ? null : new Lenis({ lerp: 0.085, smoothWheel: true });
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
document.querySelectorAll('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { duration: 1.6 });
    else t.scrollIntoView();
  }),
);

// header: progress line and the current chapter
gsap.to(progress, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });
CHAPTERS.forEach((c, i) =>
  ScrollTrigger.create({
    trigger: `#${c.id}`,
    start: 'top 55%',
    end: 'bottom 55%',
    onToggle: (self) => self.isActive && navItems.forEach((n, j) => n.classList.toggle('is-on', j === i)),
  }),
);
ScrollTrigger.create({ trigger: cover, start: 'top top', end: 'bottom 30%', onToggle: (self) => top.classList.toggle('is-cover', self.isActive) });

// each card sets the stage when it reaches the middle of the screen
steps.forEach(({ el, step }) =>
  ScrollTrigger.create({ trigger: el, start: 'top 62%', end: 'bottom 38%', onToggle: (self) => self.isActive && activate(step) }),
);
ScrollTrigger.create({ trigger: cover, start: 'top top', end: 'bottom 40%', onEnterBack: () => activate({ view: 'whole' }) });

document.fonts.ready.then(() => {
  if (reduce) return;
  // cover: the title rises out of the paper, stroke by stroke
  const t = SplitText.create(coverTitle, { type: 'chars' });
  gsap.from(t.chars, { yPercent: 60, opacity: 0, filter: 'blur(12px)', duration: 1.6, ease: 'power3.out', stagger: 0.18, delay: 0.2 });
  gsap.from('.cover__side > *', { y: 24, opacity: 0, duration: 1.2, ease: 'power2.out', stagger: 0.12, delay: 0.8 });
  gsap.to(coverTitle, { yPercent: -18, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: cover, start: 'top top', end: 'bottom top', scrub: true } });

  // chapter heads: the seal is stamped, the title appears, the brush stroke is drawn
  document.querySelectorAll('.chapter__head').forEach((h) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: h, start: 'top 78%' } });
    const title = SplitText.create(h.querySelector('h2'), { type: 'chars' });
    tl.from(h.querySelector('.seal'), { scale: 1.6, rotate: -14, opacity: 0, duration: 0.55, ease: 'back.out(2.4)' })
      .from(title.chars, { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06 }, '-=0.2')
      .from(h.querySelector('.chapter__en'), { y: 12, opacity: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5')
      .from(h.querySelector('.brush path'), { drawSVG: 0, duration: 1.1, ease: 'power2.inOut' }, '-=0.6');
  });

  // cards: Chinese characters ink in, the English follows line by line
  document.querySelectorAll('.card').forEach((card) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 82%' } });
    tl.from(card, { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out' });
    const zh = card.querySelector(':scope > .zh');
    const en = card.querySelector(':scope > .en');
    if (zh) tl.from(SplitText.create(zh, { type: 'chars' }).chars, { opacity: 0.08, duration: 0.5, ease: 'none', stagger: 0.012 }, '-=0.6');
    if (en) {
      const lines = SplitText.create(en, { type: 'lines', mask: 'lines' }).lines;
      tl.from(lines, { yPercent: 100, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, '-=0.5');
    }
    const items = card.querySelectorAll('.timeline li, .terms dt, .terms dd');
    if (items.length) tl.from(items, { x: -18, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.06 }, '-=0.4');
  });
  ScrollTrigger.refresh();
});

/* ───────── explore mode: full screen model, the wheel zooms ───────── */
function setExplore(on) {
  document.body.classList.toggle('is-exploring', on);
  exploreUI.hidden = !on;
  viewer.setExplore(on);
  if (on) {
    if (lenis) lenis.stop();
    const v = STAGE_VIEWS.includes(current.view) ? current.view : 'whole';
    activate({ view: v, labels: stageLabels[v] }, true);
    gsap.from(exploreUI.children, { y: 20, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' });
  } else {
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
    const active = steps.find(({ el }) => {
      const r = el.getBoundingClientRect();
      return r.top < innerHeight * 0.62 && r.bottom > innerHeight * 0.38;
    });
    activate(active ? active.step : { view: 'whole' }, true);
  }
}
addEventListener('keydown', (e) => e.key === 'Escape' && document.body.classList.contains('is-exploring') && setExplore(false));

if (import.meta.env.DEV) window.__app = { viewer, lenis, activate };
