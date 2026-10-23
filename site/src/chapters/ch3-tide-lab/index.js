/**
 * Chapter 3 — Make a Tide (造潮).
 * The tide lab: set the Moon, the season, the funnel, the sandbar and the wind, then release
 * a bore up the Qiantang past the Liuhe Pagoda. Plus today's tide, how a bore forms, the
 * three classic shapes, and a bilingual tide-watching safety guide.
 */
import './style.css';
import { h, bi, chapterHeader, rangeSlider, segmented, term, speak, canSpeak, reducedMotion, announce } from '../../core/ui.js';
import { tr, getLang, onLangChange } from '../../core/i18n.js';
import { registerVocab } from '../../core/vocab.js';
import { markDone, isDone } from '../../core/progress.js';
import { compute, explain, practiceSentence, REAL, PHASE_NAMES, KIND_NAMES, phaseKey } from './model.js';
import { todayInfo, seasonFor, formatDate, formatShort } from './today.js';
import { orbitDiagram, moonIcon, estuaryDiagram, shapeIcon } from './diagrams.js';
import { T, VOCAB, SHARED_TERMS, SOURCES } from './content.js';
import { createTideScene } from './scene.js';

registerVocab('ch3', VOCAB);

const TERMS = Object.fromEntries([...VOCAB, ...Object.values(SHARED_TERMS)].map((w) => [w.id, w]));
const ZH_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const SHAPES = ['line', 'cross', 'return'];

/* ───────────── small helpers ───────────── */

/** Language listeners that clean themselves up once their element leaves the page. */
function onLang(fn, el) {
  const off = onLangChange(() => {
    if (el && !el.isConnected) return off();
    fn();
  });
}

/** Turn "text {term-id} text {term-id|en|zh}" into nodes with inline vocabulary buttons. */
function richNodes(str) {
  const out = [];
  const re = /\{([a-z]+-[a-z0-9-]+)(?:\|([^|}]*)\|([^}]*))?\}/g;
  let last = 0;
  let m;
  while ((m = re.exec(str))) {
    if (m.index > last) out.push(str.slice(last, m.index));
    const w = TERMS[m[1]];
    out.push(w ? term(w, m[2] ? { en: m[2], zh: m[3] } : undefined) : m[0]);
    last = re.lastIndex;
  }
  if (last < str.length) out.push(str.slice(last));
  return out;
}

/** Element with rich bilingual content; `get` returns a { en, zh } pair or a string. */
function rich(get, tag = 'p', attrs = {}) {
  const el = h(tag, attrs);
  const render = () => el.replaceChildren(...richNodes(tr(typeof get === 'function' ? get() : get)));
  render();
  onLang(render, el);
  return el;
}

/** Text bound to a function of the language (for values computed on the fly). */
function live(get, tag = 'span', attrs = {}) {
  const el = h(tag, attrs);
  const render = () => {
    el.textContent = get();
  };
  render();
  onLang(render, el);
  el.refresh = render;
  return el;
}

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};
const zhDay = (d) => (d <= 10 ? `初${ZH_NUM[d]}` : d < 20 ? `十${ZH_NUM[d - 10]}` : d === 20 ? '二十' : d < 30 ? `廿${ZH_NUM[d - 20]}` : '三十');
const fmt = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toFixed(d);
const phaseOfDay = (d) => phaseKey(d - 0.5);

function scrollIntoViewIfNeeded(el) {
  const r = el.getBoundingClientRect();
  if (r.top >= 56 && r.bottom <= window.innerHeight) return;
  el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
}

/* ───────────── the chapter ───────────── */

export default {
  id: 'ch3',
  ambience: { river: 0.5, wind: 0.15, rumble: 0.18 },
  sources: SOURCES,

  mount(section) {
    const state = { ...REAL, shape: 'line' };
    let current = compute(state);
    let base = { r: current, p: { ...state } };
    let lastWhat = null;
    let why = { what: 'init', pair: explain('init', null, current, state) };
    const released = new Set(isDone('ch3', 'all-three-shapes') ? SHAPES : []);

    section.append(chapterHeader({ plaque: '造潮', index: 3, title: { en: 'Make a Tide', zh: '造一次潮' }, lede: T.lede }));
    section.append(rich(T.intro, 'p', { class: 'ch3-intro' }));

    /* ── stage ── */
    const stageEl = h('div', { class: 'stage ch3-stage' });
    const hint = bi(T.hint, 'div', { class: 'stage__hint' });
    const lapse = bi(T.timelapse, 'div', { class: 'ch3-lapse', hidden: true });
    const stillNote = bi(T.stillNote, 'p', { class: 'ch3-stillnote', hidden: true });
    const hudRelease = h('button', { type: 'button', class: 'btn ch3-hud-release' });
    const overviewBtn = bi(T.overview, 'button', { type: 'button', class: 'btn btn--ghost ch3-overview' });
    const hud = h('div', { class: 'stage__hud' }, hudRelease, overviewBtn);
    stageEl.append(hint, lapse, stillNote, hud);

    /* ── estuary instrument ── */
    const estuary = estuaryDiagram({
      labels: {
        place: (p) => tr({ en: p.en, zh: p.zh }),
        sea: () => tr(T.sea),
        plan: () => tr(T.plan),
        profile: () => tr(T.profile),
        mouth: (v) => tr(T.mouthTag, { v: fmt(v, 0) }),
        bar: (v) => tr(T.barTag, { v: fmt(v, 1).replace(/\.0$/, '') }),
      },
    });
    onLang(() => estuary.relabel(), estuary.el);
    const estuaryFig = h('figure', { class: 'ch3-estuary-fig panel' }, estuary.el, bi(T.estuaryCaption, 'figcaption', { class: 'note' }));

    /* ── result panel ── */
    const kindEl = live(() => tr(KIND_NAMES[current.kind]), 'p', { class: 'ch3-result__kind' });
    const heightEl = live(() => tr(T.meters, { v: fmt(current.height) }), 'dd', { class: 'ch3-result__big' });
    const speedEl = h('dd');
    speedEl.refresh = () => {
      if (current.speed > 0) {
        speedEl.replaceChildren(
          h('span', { class: 'ch3-nowrap' }, tr(T.speedMs, { v: fmt(current.speed) })),
          ' · ',
          h('span', { class: 'ch3-nowrap' }, tr(T.speedKmh, { k: fmt(current.speed * 3.6, 0) })),
        );
      } else speedEl.textContent = tr(T.noSpeed);
    };
    speedEl.refresh();
    onLang(speedEl.refresh, speedEl);
    const rangeEl = live(() => tr(T.meters, { v: fmt(current.range) }), 'dd');
    const scaleFill = h('span', { class: 'ch3-scale__fill' });
    const scale = h(
      'div',
      { class: 'ch3-scale', 'aria-hidden': 'true' },
      h('span', { class: 'ch3-scale__track' }, h('span', { class: 'ch3-scale__band' }), scaleFill, h('span', { class: 'ch3-scale__max' })),
      h('span', { class: 'ch3-scale__labels' }, bi(T.scaleUsual, 'span', { class: 'ch3-scale__l1' }), bi(T.scaleMax, 'span', { class: 'ch3-scale__l2' })),
    );
    const whyEl = live(() => tr(why.pair), 'p', { class: 'ch3-result__why' });
    const sayText = h('q', { class: 'ch3-say__text', lang: 'en' });
    const sayBtn = canSpeak() ? bi(T.hear, 'button', { type: 'button', class: 'btn btn--ghost ch3-say__btn' }) : null;
    if (sayBtn) sayBtn.addEventListener('click', () => speak(sayText.textContent, 'en'));
    const modelList = h('ol', { class: 'ch3-model__steps' }, T.modelSteps.map((s) => bi(s, 'li')));
    const result = h(
      'div',
      { class: 'ch3-result panel' },
      h('div', { class: 'ch3-result__head' }, bi(T.resultTitle, 'h3'), bi(T.modelBadge, 'span', { class: 'ch3-badge' })),
      kindEl,
      h(
        'dl',
        { class: 'ch3-result__nums' },
        h('div', { class: 'ch3-result__num ch3-result__num--main' }, bi(T.height, 'dt'), heightEl),
        h('div', { class: 'ch3-result__num' }, bi(T.speed, 'dt'), speedEl),
        h('div', { class: 'ch3-result__num' }, bi(T.range, 'dt'), rangeEl),
      ),
      scale,
      whyEl,
      h('div', { class: 'ch3-say' }, bi(T.sayIt, 'span', { class: 'label' }), h('p', { class: 'ch3-say__line' }, sayText, sayBtn)),
      h('details', { class: 'ch3-model' }, bi(T.howModel, 'summary'), modelList),
    );

    /* ── controls ── */
    const orbit = orbitDiagram();
    const alignNote = live(() => tr(current.align > 0.8 ? T.spring : current.align < 0.25 ? T.neap : T.between), 'p', { class: 'ch3-align' });
    const moonSlider = rangeSlider({
      label: T.moonLabel,
      min: 1,
      max: 30,
      step: 1,
      value: state.day,
      format: (v) => tr(T.moonValue, { d: v, dz: zhDay(v), phase: tr(PHASE_NAMES[phaseOfDay(v)]) }),
      onInput: (v) => change('day', v),
    });
    const seasonSeg = segmented({
      options: ['spring', 'summer', 'autumn', 'winter'].map((v) => ({ value: v, label: T.seasons[v] })),
      value: state.season,
      ariaLabel: T.seasonLabel,
      onChange: (v) => change('season', v),
    });
    const mouthSlider = rangeSlider({
      label: T.mouthLabel,
      min: 5,
      max: 120,
      step: 5,
      value: state.mouth,
      format: (v) => tr(T.mouthValue, { v }) + (v === REAL.mouth ? tr(T.real) : ''),
      onInput: (v) => change('mouth', v),
    });
    const barSlider = rangeSlider({
      label: T.barLabel,
      min: 0,
      max: 12,
      step: 0.5,
      value: state.bar,
      format: (v) => tr(T.barValue, { v: String(v) }) + (v === REAL.bar ? tr(T.real) : ''),
      onInput: (v) => change('bar', v),
    });
    const windSlider = rangeSlider({
      label: T.windLabel,
      min: -10,
      max: 15,
      step: 1,
      value: state.wind,
      format: (v) => (v === 0 ? tr(T.windCalm) : v > 0 ? tr(T.windOn, { v }) : tr(T.windOff, { v: -v })),
      onInput: (v) => change('wind', v),
    });
    const shapeCaption = live(() => tr(T.shapeCaption[state.shape]), 'p', { class: 'note ch3-shape-caption' });
    const shapeSeg = segmented({
      options: SHAPES.map((v) => ({ value: v, label: T.shapes[v] })),
      value: state.shape,
      ariaLabel: T.shapeLabel,
      onChange: (v) => setShape(v),
    });
    const releaseBtn = h('button', { type: 'button', class: 'btn ch3-release' });
    const realBtn = bi(T.realSettings, 'button', { type: 'button', class: 'btn btn--ghost' });
    const controls = h(
      'aside',
      { class: 'ch3-controls panel' },
      bi(T.controlsTitle, 'h3', { class: 'ch3-controls__title' }),
      h('div', { class: 'ch3-ctl ch3-ctl--moon' }, moonSlider.el, h('div', { class: 'ch3-moonrow' }, orbit.el, alignNote), bi(T.orbitNote, 'p', { class: 'note ch3-orbit-note' })),
      h('div', { class: 'ch3-ctl' }, bi(T.seasonLabel, 'span', { class: 'label' }), seasonSeg.el),
      h('div', { class: 'ch3-ctl' }, mouthSlider.el, barSlider.el, windSlider.el),
      h('div', { class: 'ch3-ctl' }, bi(T.shapeLabel, 'span', { class: 'label' }), shapeSeg.el, shapeCaption),
      h('div', { class: 'ch3-actions' }, releaseBtn, realBtn),
    );

    const lab = h('div', { class: 'ch3-lab' }, h('div', { class: 'ch3-lab__stage' }, stageEl), result, controls, estuaryFig);
    section.append(lab);

    /* ── today's tide ── */
    const info = todayInfo();
    const bigMoon = moonIcon(64);
    bigMoon.set(info.moon.age);
    const L = () => getLang();
    const todayDate = rich(() => ({
      en: `Today is ${formatDate(info.date, 'en')}: the ${ordinal(info.lunar.day)} day of the ${info.lunar.leap ? 'leap ' : ''}${ordinal(info.lunar.month)} month in the {cal-lunar-calendar}.`,
      zh: `今天是${formatDate(info.date, 'zh')}，{cal-lunar-calendar|lunar calendar|农历}${info.lunar.monthZh}${info.lunar.dayZh}。`,
    }));
    const todayMoon = live(() =>
      tr(T.todayMoon, { age: fmt(info.moon.age), phase: tr(PHASE_NAMES[info.moon.phase]), lit: Math.round(info.moon.lit * 100) }),
    'p');
    const lday = (d) => (L() === 'zh' ? zhDay(d) : d);
    const todayWindow = live(() => {
      if (info.window) return tr(T.inWindow, { a: lday(info.window.from), b: lday(info.window.to), end: formatShort(info.window.end, L()) });
      if (info.next) return tr(T.nextWindow, { n: info.next.days, start: formatShort(info.next.start, L()), end: formatShort(info.next.end, L()), a: lday(info.next.from), b: lday(info.next.to) });
      return '';
    }, 'p', { class: 'ch3-today__window' });
    const today818 = live(() => (info.next818.days === 0 ? tr(T.is818) : tr(T.next818, { date: formatDate(info.next818.date, L()), n: info.next818.days })), 'p');
    const setTodayBtn = bi(T.setToday, 'button', { type: 'button', class: 'btn btn--ghost' });
    const todayEl = h(
      'section',
      { class: 'ch3-today panel', 'aria-labelledby': 'ch3-today-title' },
      h('div', { class: 'ch3-today__moon' }, bigMoon.el),
      h(
        'div',
        { class: 'ch3-today__text' },
        bi(T.todayTitle, 'h3', { id: 'ch3-today-title' }),
        todayDate,
        todayMoon,
        todayWindow,
        today818,
        bi(T.todayNote, 'p', { class: 'note' }),
        setTodayBtn,
      ),
    );
    section.append(todayEl);

    /* ── how a bore is made ── */
    const facts = h(
      'aside',
      { class: 'ch3-facts panel' },
      bi(T.factsTitle, 'h4'),
      h('dl', null, T.facts.map((f) => h('div', { class: 'ch3-facts__row' }, bi(f.k, 'dt'), bi(f.v, 'dd')))),
      bi(T.factsNote, 'p', { class: 'note' }),
      h('div', { class: 'ch3-check' }, bi(T.checkTitle, 'h4'), bi(T.check, 'p')),
    );
    section.append(
      h(
        'section',
        { class: 'ch3-how', 'aria-labelledby': 'ch3-how-title' },
        bi(T.howTitle, 'h3', { class: 'ch3-h3', id: 'ch3-how-title' }),
        h(
          'div',
          { class: 'ch3-how__grid' },
          h('div', { class: 'prose ch3-how__text' }, T.how.map((x) => [bi(x.head, 'h4'), rich(x.body)])),
          facts,
        ),
      ),
    );

    /* ── three shapes ── */
    const shapeList = h('ul', { class: 'ch3-shapes__list' });
    for (const c of T.shapeCards) {
      const other = live(() => (getLang() === 'zh' ? c.name.en : c.name.zh), 'span', { class: 'ch3-shapes__alt' });
      const otherLang = () => other.setAttribute('lang', getLang() === 'zh' ? 'en' : 'zh-CN');
      otherLang();
      onLang(otherLang, other);
      const tryBtn = bi({ en: `Release a ${c.name.en.toLowerCase()}`, zh: `放一次${c.name.zh}` }, 'button', { type: 'button', class: 'btn btn--ghost' });
      tryBtn.addEventListener('click', () => {
        shapeSeg.set(c.id, true);
        scrollIntoViewIfNeeded(stageEl);
        release();
      });
      shapeList.append(
        h(
          'li',
          { class: 'ch3-shapes__item' },
          shapeIcon(c.id),
          h(
            'div',
            { class: 'ch3-shapes__body' },
            h('h4', null, bi(c.name), ' ', other),
            bi(c.place, 'p', { class: 'ch3-shapes__place' }),
            bi(c.body, 'p'),
            tryBtn,
          ),
        ),
      );
    }
    section.append(
      h(
        'section',
        { class: 'ch3-shapes', 'aria-labelledby': 'ch3-shapes-title' },
        bi(T.shapesTitle, 'h3', { class: 'ch3-h3', id: 'ch3-shapes-title' }),
        bi(T.shapesIntro, 'p', { class: 'ch3-lead' }),
        shapeList,
      ),
    );

    /* ── safety guide ── */
    const safetyList = h('ol', { class: 'ch3-safety__list' });
    for (const s of T.safety) {
      const hear = canSpeak() ? h('button', { type: 'button', class: 'ch3-safety__hear', onclick: () => speak(s.say, 'en') }) : null;
      if (hear) {
        const lbl = () => hear.setAttribute('aria-label', `${tr(T.hear)}: ${s.say}`);
        hear.append(bi(T.hear));
        lbl();
        onLang(lbl, hear);
      }
      safetyList.append(
        h(
          'li',
          { class: 'ch3-safety__item' },
          h('p', { class: 'ch3-safety__say', lang: 'en' }, s.say),
          live(() => (getLang() === 'zh' ? s.zh : ''), 'p', { class: 'ch3-safety__zh', lang: 'zh-CN' }),
          bi(s.more, 'p', { class: 'ch3-safety__more' }),
          hear,
        ),
      );
    }
    section.append(
      h(
        'section',
        { class: 'ch3-safety', 'aria-labelledby': 'ch3-safety-title' },
        bi(T.safetyTitle, 'h3', { class: 'ch3-h3', id: 'ch3-safety-title' }),
        bi(T.safetyIntro, 'p', { class: 'ch3-lead' }),
        bi(T.safetySay, 'p', { class: 'label' }),
        safetyList,
      ),
    );

    /* ── 3D ── */
    let frontU = null;
    const scene = createTideScene(stageEl, {
      onFrame: (x) => {
        if (x == null) return;
        const u = Math.max(0, Math.min(1, x / 1500));
        if (frontU === null || Math.abs(u - frontU) > 0.002) {
          frontU = u;
          estuary.setWave(u, current);
        }
      },
    });
    if (!scene) lab.classList.add('ch3-lab--flat');
    else if (import.meta.env.DEV) window.__ch3 = scene;

    /* ── behaviour ── */
    function renderAll() {
      orbit.set(state.day);
      estuary.setGeometry(state.mouth, state.bar);
      for (const el of [kindEl, heightEl, speedEl, rangeEl, whyEl, alignNote, shapeCaption]) el.refresh();
      scaleFill.style.width = `${Math.min(100, (current.height / 5) * 100).toFixed(1)}%`;
      sayText.textContent = practiceSentence(state, current);
      result.dataset.kind = current.kind;
    }

    let running = false;
    function syncButtons() {
      const label = tr(running ? T.skip : T.release);
      releaseBtn.textContent = label;
      hudRelease.textContent = label;
      lapse.hidden = !running;
      overviewBtn.hidden = running;
    }
    onLang(syncButtons, releaseBtn);

    function change(what, value) {
      if (what !== lastWhat) {
        base = { r: current, p: { ...state } };
        lastWhat = what;
      }
      state[what] = value;
      if (what === 'wind' && scene) scene.setWind(value);
      current = compute(state);
      why = { what, pair: explain(what, base.r, current, state, base.p) };
      renderAll();
      if (!running) {
        estuary.setWave(null);
        if (scene) scene.clear();
        stillNote.hidden = true;
      }
    }

    function setShape(v) {
      state.shape = v;
      lastWhat = 'shape';
      why = { what: 'shape', pair: explain('shape', current, current, state) };
      if (scene) scene.setShape(v);
      renderAll();
    }

    function done() {
      running = false;
      syncButtons();
      markDone('ch3', 'made-a-tide');
      released.add(state.shape);
      if (SHAPES.every((s) => released.has(s))) markDone('ch3', 'all-three-shapes');
      announce(`${tr(T.height)}: ${tr(T.meters, { v: fmt(current.height) })}. ${tr(why.pair)}`);
    }

    function release() {
      if (running) {
        if (scene) scene.skip();
        return;
      }
      scrollIntoViewIfNeeded(stageEl);
      lastWhat = null;
      const still = reducedMotion();
      if (!scene || still) {
        // a still frame: no camera move, no travelling wave
        estuary.setWave(0.02, current);
        if (scene) {
          scene.release(current, { instant: true });
          stillNote.hidden = !still;
        }
        done();
        return;
      }
      running = true;
      syncButtons();
      stillNote.hidden = true;
      scene.release(current).then(() => {
        estuary.setWave(0.02, current);
        done();
      });
    }

    releaseBtn.addEventListener('click', release);
    hudRelease.addEventListener('click', release);
    overviewBtn.addEventListener('click', () => scene && scene.resetView());
    if (!scene) {
      hudRelease.hidden = true;
      overviewBtn.hidden = true;
      hint.hidden = true;
    }

    function applySettings(next, what) {
      lastWhat = null;
      base = { r: current, p: { ...state } };
      Object.assign(state, next);
      moonSlider.set(state.day);
      seasonSeg.set(state.season);
      mouthSlider.set(state.mouth);
      barSlider.set(state.bar);
      windSlider.set(state.wind);
      if (scene) scene.setWind(state.wind);
      current = compute(state);
      why = { what, pair: explain(what, base.r, current, state, base.p) };
      renderAll();
      if (!running) {
        estuary.setWave(null);
        if (scene) scene.clear();
      }
    }

    realBtn.addEventListener('click', () => applySettings({ ...REAL }, 'init'));
    setTodayBtn.addEventListener('click', () => {
      applySettings({ day: info.lunar.day, season: seasonFor(info.date) }, 'day');
      scrollIntoViewIfNeeded(lab);
    });

    if (scene) {
      scene.setShape(state.shape);
      scene.setWind(state.wind);
    }
    syncButtons();
    renderAll();
  },
};
