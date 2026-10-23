/**
 * ch1 · 之江 · The River That Named Us
 * A sand-table map of the Qiantang estuary, the river's names, the old Zhijiang campus
 * and the 1937 bridge, with a little English practice at the end.
 */
import './style.css';
import { chapterHeader, h, term, speak, canSpeak, announce } from '../../core/ui.js';
import { tr, onLangChange, getLang } from '../../core/i18n.js';
import { registerVocab } from '../../core/vocab.js';
import { markDone, isDone } from '../../core/progress.js';
import { T, PLACES, MAP_LABELS, VOCAB, SOURCES } from './content.js';
import { createZhi } from './zhi.js';

const W = Object.fromEntries(VOCAB.map((w) => [w.id, w]));
const TERMS = {
  estuary: [W['river-estuary'], { en: 'estuaries', zh: '河口' }],
  missionary: [W['river-missionary-college'], { en: 'missionary', zh: '教会' }],
  heritage: [W['river-heritage-site'], null],
  doubledeck: [W['river-double-deck-bridge'], null],
};

/** Keep a node's content in sync with the language. render() returns child nodes. */
function live(node, render) {
  const draw = () => node.replaceChildren(...[].concat(render()));
  draw();
  const off = onLangChange(() => {
    if (!node.isConnected) return off();
    draw();
  });
  return node;
}

/** Text with {key} placeholders turned into vocabulary buttons. */
function rich(str) {
  const out = [];
  let last = 0;
  str.replace(/\{(\w+)\}/g, (m, key, i) => {
    out.push(str.slice(last, i));
    const t = TERMS[key];
    out.push(t ? term(t[0], t[1] || undefined) : m);
    last = i + m.length;
    return m;
  });
  out.push(str.slice(last));
  return out;
}

const langOf = () => (getLang() === 'zh' ? 'zh' : 'en');

export default {
  id: 'ch1',
  ambience: { river: 0.35, wind: 0.12, rumble: 0 },
  sources: SOURCES,
  async mount(section) {
    registerVocab('ch1', VOCAB);
    section.classList.add('ch1');
    section.append(chapterHeader({ plaque: '之江', index: 1, title: T.title, lede: T.lede }));

    /* ── Intro ── */
    section.append(
      live(h('div', { class: 'prose ch1-intro' }), () => T.intro[langOf()].map((p) => h('p', null, ...rich(p)))),
    );

    /* ── Map + panel ── */
    const stageEl = h('div', { class: 'stage ch1-stage', 'aria-label': tr(T.mapLabel), role: 'region' });
    const schematic = live(h('p', { class: 'ch1-schematic' }), () => tr(T.schematic));
    const hint = live(h('p', { class: 'stage__hint ch1-hint' }), () => tr(T.hint));
    const overviewBtn = live(h('button', { type: 'button', class: 'btn btn--ghost ch1-hudbtn' }), () => tr(T.overview));
    const traceBtn = h('button', { type: 'button', class: 'btn ch1-hudbtn' });
    const hud = h('div', { class: 'ch1-hud' }, overviewBtn, traceBtn);
    stageEl.append(schematic, hint);
    const panel = h('aside', { class: 'panel ch1-panel', id: 'ch1-panel', 'aria-live': 'polite' });
    const mapWrap = h('div', { class: 'ch1-map' }, h('div', { class: 'ch1-mapcol' }, stageEl, hud), panel);
    section.append(mapWrap);

    const opened = new Set();
    let view = { kind: 'list' };
    let traced = isDone('ch1', 'traced-zhi');
    const zhi = createZhi({ label: '之' });

    const syncTraceBtn = () => {
      traceBtn.textContent = tr(traced ? T.traceAgain : T.trace);
    };
    syncTraceBtn();
    onLangChange(syncTraceBtn);

    function renderPanel() {
      panel.replaceChildren();
      if (view.kind === 'place') {
        const p = PLACES.find((x) => x.id === view.id);
        const i = PLACES.indexOf(p);
        const next = PLACES[(i + 1) % PLACES.length];
        panel.append(
          h('h3', { class: 'ch1-panel__title', tabindex: '-1' }, tr(p.name)),
          ...p.body.map((b) => h('p', null, tr(b))),
          h(
            'div',
            { class: 'ch1-panel__actions' },
            h('button', { type: 'button', class: 'btn', onclick: () => openPlace(next.id) }, `${tr(T.nextPlace)}: ${tr(next.name)}`),
            h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => showList(true) }, tr(T.backToList)),
          ),
          progressLine(),
        );
      } else if (view.kind === 'zhi') {
        panel.append(
          h('h3', { class: 'ch1-panel__title' }, tr(T.zhiHead)),
          h(
            'figure',
            { class: 'ch1-zhi' },
            zhi.svg,
            h('figcaption', null, h('span', { class: 'ch1-zhi__py' }, tr(T.zhiPinyin)), h('span', { class: 'note' }, tr(T.zhiCaption))),
          ),
          h('p', null, tr(T.zhiBody)),
          h('p', { class: 'note' }, tr(T.zhiStrokes)),
          h(
            'div',
            { class: 'ch1-panel__actions' },
            h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => zhi.play() }, tr(T.replayZhi)),
            h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => showList(true) }, tr(T.backToList)),
          ),
        );
      } else {
        panel.append(
          h('h3', { class: 'ch1-panel__title' }, tr(T.placesHead)),
          h('p', { class: 'note' }, tr(T.placesIntro)),
          h(
            'ul',
            { class: 'ch1-places' },
            PLACES.map((p) =>
              h(
                'li',
                null,
                h(
                  'button',
                  { type: 'button', class: 'ch1-places__btn', 'aria-pressed': String(opened.has(p.id)), onclick: () => openPlace(p.id) },
                  h('span', { class: 'ch1-places__mark', 'aria-hidden': 'true' }, opened.has(p.id) ? '✓' : ''),
                  tr(p.name),
                ),
              ),
            ),
          ),
          progressLine(),
        );
        if (opened.size === PLACES.length) panel.append(h('p', { class: 'ch1-done' }, tr(T.allOpened)));
      }
    }

    function progressLine() {
      return h('p', { class: 'note ch1-progress' }, tr(T.opened, { n: opened.size }));
    }

    let map = null;

    function openPlace(id) {
      view = { kind: 'place', id };
      opened.add(id);
      renderPanel();
      const p = PLACES.find((x) => x.id === id);
      announce(tr(p.name));
      if (map) map.flyTo(id);
      if (opened.size === PLACES.length && !isDone('ch1', 'opened-all-places')) {
        markDone('ch1', 'opened-all-places');
      }
    }

    function showList(fly) {
      view = { kind: 'list' };
      renderPanel();
      if (fly && map) map.overview();
    }

    async function runTrace() {
      view = { kind: 'zhi' };
      renderPanel();
      traceBtn.disabled = true;
      if (map) await map.trace();
      traceBtn.disabled = false;
      zhi.play();
      traced = true;
      syncTraceBtn();
      markDone('ch1', 'traced-zhi');
    }

    overviewBtn.addEventListener('click', () => showList(true));
    traceBtn.addEventListener('click', runTrace);
    onLangChange(() => {
      if (panel.isConnected) renderPanel();
      stageEl.setAttribute('aria-label', tr(T.mapLabel));
    });
    renderPanel();

    // Build the 3D table lazily (it is the heaviest thing in the chapter).
    const { createRiverMap } = await import('./map.js');
    map = createRiverMap(stageEl, { places: PLACES, mapLabels: MAP_LABELS, onSelect: openPlace });
    if (import.meta.env.DEV) window.__ch1map = map;
    if (!map) {
      mapWrap.classList.add('ch1-map--flat');
      overviewBtn.remove();
      hint.remove();
    }

    /* ── Names ── */
    section.append(
      h(
        'div',
        { class: 'ch1-block' },
        live(h('h3', { class: 'ch1-h' }), () => tr(T.namesHead)),
        h(
          'dl',
          { class: 'ch1-names' },
          T.names.map((n) =>
            h(
              'div',
              { class: 'ch1-names__item' },
              h('dt', null, h('span', { class: 'ch1-names__word', lang: 'zh-CN' }, n.word), h('span', { class: 'ch1-names__py' }, n.py)),
              live(h('dd'), () => tr(n)),
            ),
          ),
        ),
        live(h('p', { class: 'ch1-aside' }), () => tr(T.spellings)),
      ),
    );

    /* ── Timelines ── */
    const timeline = (items) =>
      h(
        'ol',
        { class: 'ch1-timeline' },
        items.map((it) =>
          h('li', null, h('span', { class: 'ch1-timeline__year' }, it.year), live(h('p'), () => rich(tr(it)))),
        ),
      );

    section.append(
      h(
        'div',
        { class: 'ch1-block ch1-block--two' },
        h(
          'div',
          null,
          live(h('h3', { class: 'ch1-h' }), () => tr(T.campusHead)),
          live(h('p', { class: 'ch1-lead' }), () => rich(tr(T.campusIntro))),
          timeline(T.campusTimeline),
          live(h('p', { class: 'note' }), () => tr(T.campusNote)),
        ),
        h(
          'div',
          null,
          live(h('h3', { class: 'ch1-h' }), () => tr(T.bridgeHead)),
          live(h('p', { class: 'ch1-lead' }), () => rich(tr(T.bridgeIntro))),
          timeline(T.bridgeTimeline),
          live(h('p', { class: 'note' }), () => tr(T.bridgeNote)),
        ),
      ),
    );

    /* ── Say it in English ── */
    const answer = h('textarea', { class: 'ch1-answer', rows: '4', id: 'ch1-answer', lang: 'en', spellcheck: 'true' });
    const model = live(h('p', { class: 'ch1-model', hidden: true }), () => tr(T.yourTurnModelText));
    const modelBtn = live(
      h('button', {
        type: 'button',
        class: 'btn btn--ghost',
        'aria-expanded': 'false',
        onclick: () => {
          model.hidden = !model.hidden;
          modelBtn.setAttribute('aria-expanded', String(!model.hidden));
        },
      }),
      () => tr(T.yourTurnModel),
    );
    section.append(
      h(
        'div',
        { class: 'ch1-block ch1-say' },
        live(h('h3', { class: 'ch1-h' }), () => tr(T.sayHead)),
        live(h('p', { class: 'ch1-lead' }), () => tr(T.sayIntro)),
        h(
          'ul',
          { class: 'ch1-sentences' },
          T.sentences.map((s) =>
            h(
              'li',
              null,
              h('p', { class: 'ch1-sentences__en', lang: 'en' }, s.en),
              h('p', { class: 'ch1-sentences__zh', lang: 'zh-CN' }, s.zh),
              canSpeak()
                ? live(h('button', { type: 'button', class: 'btn btn--ghost ch1-hear', onclick: () => speak(s.en, 'en') }), () => tr(T.hear))
                : null,
            ),
          ),
        ),
        live(h('p', { class: 'ch1-yourturn' }), () => tr(T.yourTurn)),
        live(h('label', { for: 'ch1-answer', class: 'label' }), () => tr(T.yourTurnLabel)),
        answer,
        h('div', { class: 'ch1-panel__actions' }, modelBtn),
        model,
      ),
    );
  },
};
