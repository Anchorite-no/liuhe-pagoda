/**
 * ch6 · 银龙 · The Silver Dragon Meets the World
 * A dot globe of the world's notable tidal bores, a to-scale comparison, the surfers'
 * Silver Dragon, a speaking prompt and a five-question quiz.
 */
import './style.css';
import { chapterHeader, h, term, speak, canSpeak, announce } from '../../core/ui.js';
import { tr, onLangChange, getLang } from '../../core/i18n.js';
import { registerVocab } from '../../core/vocab.js';
import { markDone } from '../../core/progress.js';
import { T, VOCAB, SOURCES } from './content.js';
import { BORES } from './bores.js';
import { createCompare } from './compare.js';

const W = Object.fromEntries(VOCAB.map((w) => [w.id, w]));
// [term, inline display] — the display keeps one Chinese form where the card lists two
const TERMS = {
  bore: [W['world-tidal-bore']],
  range: [W['world-tidal-range']],
  funnel: [W['world-funnel-effect'], { en: 'funnel effect', zh: '喇叭口效应' }],
  nickname: [W['world-nickname'], { en: 'nickname', zh: '绰号' }],
};

function live(node, render) {
  const draw = () => node.replaceChildren(...[].concat(render()));
  draw();
  const off = onLangChange(() => {
    if (!node.isConnected) return off();
    draw();
  });
  return node;
}

function rich(str) {
  const out = [];
  let last = 0;
  str.replace(/\{(\w+)\}/g, (m, key, i) => {
    out.push(str.slice(last, i));
    out.push(TERMS[key] ? term(TERMS[key][0], TERMS[key][1]) : m);
    last = i + m.length;
    return m;
  });
  out.push(str.slice(last));
  return out;
}

const langOf = () => (getLang() === 'zh' ? 'zh' : 'en');

/* ── Funnel diagram (plan + section), drawn in SVG ── */
function funnelFigure() {
  const NS = 'http://www.w3.org/2000/svg';
  const s = (tag, attrs = {}, text) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    return n;
  };
  const svg = s('svg', { viewBox: '0 0 560 330', class: 'ch6-funnel__svg', role: 'img' });
  const title = s('title');
  svg.append(title);
  const texts = [];
  const label = (x, y, key, cls = '', anchor = 'start') => {
    const t = s('text', { x, y, class: cls, 'text-anchor': anchor });
    texts.push([t, key]);
    svg.append(t);
    return t;
  };
  // plan view: the bay narrowing from right (sea) to left (river)
  label(16, 24, 'plan', 'ch6-funnel__head');
  svg.append(
    s('path', {
      class: 'ch6-funnel__water',
      d: 'M 30 100 C 120 98 200 92 280 80 C 360 66 440 44 540 34 L 540 186 C 440 176 360 154 280 140 C 200 128 120 122 30 120 Z',
    }),
  );
  // incoming tide arrows
  for (const [x, yy, w] of [
    [520, 110, 46],
    [420, 110, 40],
    [320, 110, 34],
    [220, 110, 28],
  ]) {
    svg.append(s('path', { class: 'ch6-funnel__arrow', d: `M ${x} ${yy} L ${x - w} ${yy} M ${x - w + 8} ${yy - 6} L ${x - w} ${yy} L ${x - w + 8} ${yy + 6}` }));
  }
  svg.append(s('line', { class: 'ch6-funnel__dim', x1: 548, y1: 34, x2: 548, y2: 186 }));
  label(540, 206, 'mouth', 'ch6-funnel__txt', 'end');
  svg.append(s('line', { class: 'ch6-funnel__dim', x1: 70, y1: 99, x2: 70, y2: 121 }));
  label(64, 146, 'yanguan', 'ch6-funnel__txt');
  label(500, 72, 'sea', 'ch6-funnel__txt ch6-funnel__txt--soft', 'end');
  label(36, 92, 'river', 'ch6-funnel__txt ch6-funnel__txt--soft');
  label(370, 134, 'tide', 'ch6-funnel__txt ch6-funnel__txt--tide', 'middle');
  // section: the bed rising above Ganpu
  label(16, 236, 'section', 'ch6-funnel__head');
  svg.append(s('path', { class: 'ch6-funnel__secwater', d: 'M 30 252 L 540 252 L 540 318 C 420 318 330 314 270 300 C 220 288 140 270 30 266 Z' }));
  svg.append(s('path', { class: 'ch6-funnel__bed', d: 'M 30 266 C 140 270 220 288 270 300 C 330 314 420 318 540 318' }));
  label(250, 322, 'bar', 'ch6-funnel__txt', 'middle');
  label(544, 246, 'caption', 'ch6-funnel__txt ch6-funnel__txt--soft', 'end');
  const sync = () => {
    title.textContent = tr(T.funnelFig.alt);
    for (const [t, key] of texts) t.textContent = tr(T.funnelFig[key]);
  };
  sync();
  onLangChange(sync);
  return h('figure', { class: 'ch6-funnel' }, svg);
}

/* ── Quiz ── */
function buildQuiz() {
  const wrap = h('div', { class: 'ch6-quiz' });
  let answers = new Array(T.quiz.length).fill(null);
  const scoreEl = h('p', { class: 'ch6-quiz__score', 'aria-live': 'polite' });
  const retry = h('button', { type: 'button', class: 'btn btn--ghost', hidden: true });
  retry.addEventListener('click', () => {
    answers = answers.map(() => null);
    draw();
    wrap.querySelector('button')?.focus();
  });

  function draw() {
    wrap.replaceChildren(
      ...T.quiz.map((q, qi) => {
        const chosen = answers[qi];
        const fs = h('fieldset', { class: 'ch6-q' }, h('legend', { class: 'ch6-q__legend' }, h('span', { class: 'ch6-q__n' }, `${qi + 1}`), tr(q.q)));
        const opts = h('div', { class: 'ch6-q__opts' });
        q.options.forEach((o, oi) => {
          const state = chosen == null ? '' : oi === q.answer ? 'right' : oi === chosen ? 'wrong' : '';
          const b = h(
            'button',
            {
              type: 'button',
              class: `ch6-q__opt${state ? ` is-${state}` : ''}`,
              'aria-pressed': String(chosen === oi),
              disabled: chosen != null && oi !== chosen && oi !== q.answer ? true : null,
              onclick: () => {
                if (answers[qi] != null) return;
                answers[qi] = oi;
                draw();
                const next = wrap.querySelectorAll('.ch6-q')[qi];
                next?.querySelector('.ch6-q__fb')?.focus();
                announce(tr(oi === q.answer ? T.quizRight : T.quizWrong));
              },
            },
            tr(o),
          );
          opts.append(b);
        });
        fs.append(opts);
        if (chosen != null) {
          fs.append(
            h(
              'p',
              { class: `ch6-q__fb ${chosen === q.answer ? 'is-right' : 'is-wrong'}`, tabindex: '-1' },
              h('strong', null, tr(chosen === q.answer ? T.quizRight : T.quizWrong)),
              ' ',
              tr(q.explain),
            ),
          );
        }
        return fs;
      }),
      scoreEl,
      retry,
    );
    const done = answers.every((a) => a != null);
    const n = answers.filter((a, i) => a === T.quiz[i].answer).length;
    scoreEl.textContent = done ? tr(T.quizScore, { n }) : '';
    retry.textContent = tr(T.quizRetry);
    retry.hidden = !done;
    if (done) markDone('ch6', 'quiz');
  }
  draw();
  onLangChange(() => {
    if (wrap.isConnected) draw();
  });
  return wrap;
}

export default {
  id: 'ch6',
  ambience: { river: 0.25, wind: 0.25, rumble: 0 },
  sources: SOURCES,
  async mount(section) {
    registerVocab('ch6', VOCAB);
    section.classList.add('ch6');
    section.append(chapterHeader({ plaque: '银龙', index: 6, title: T.title, lede: T.lede }));
    section.append(live(h('div', { class: 'prose ch6-intro' }), () => T.intro[langOf()].map((p) => h('p', null, ...rich(p)))));

    /* ── Globe + card ── */
    const stageEl = h('div', { class: 'stage ch6-stage', role: 'region', 'aria-label': tr(T.globeLabel) });
    const hint = live(h('p', { class: 'stage__hint' }), () => tr(T.hint));
    const credit = live(h('p', { class: 'ch6-credit' }), () => tr(T.globeNote));
    stageEl.append(hint, credit);
    const card = h('aside', { class: 'panel ch6-card', id: 'ch6-card', 'aria-live': 'polite' });
    const wrap = h('div', { class: 'ch6-globe' }, stageEl, card);
    section.append(wrap);

    let current = null;
    let compare = null;
    let globe = null;

    function row(labelPair, value) {
      return h('div', { class: 'ch6-card__row' }, h('dt', null, tr(labelPair)), h('dd', null, tr(value)));
    }

    function drawCard() {
      card.replaceChildren();
      if (!current) {
        card.append(
          h('h3', { class: 'ch6-card__title' }, tr(T.listHead)),
          h('p', { class: 'note' }, tr(T.listIntro)),
          h(
            'ul',
            { class: 'ch6-list' },
            BORES.map((b) =>
              h(
                'li',
                null,
                h(
                  'button',
                  { type: 'button', class: 'ch6-list__btn', onclick: () => open(b.id) },
                  h('span', { class: `ch6-dot ch6-dot--${b.status}`, 'aria-hidden': 'true' }),
                  h('span', null, tr(b.name), h('span', { class: 'ch6-list__place' }, tr(b.place))),
                ),
              ),
            ),
          ),
        );
        return;
      }
      const b = BORES.find((x) => x.id === current);
      card.append(
        h('h3', { class: 'ch6-card__title' }, tr(b.name)),
        h('p', { class: `ch6-status ch6-status--${b.status}` }, tr(b.statusText)),
        h(
          'dl',
          { class: 'ch6-card__facts' },
          row(T.labels.local, b.local),
          row(T.labels.where, b.place),
          row(T.labels.height, b.rangeText),
          row(T.labels.speed, b.speed),
          row(T.labels.season, b.season),
        ),
        h('p', { class: 'ch6-card__story' }, tr(b.story)),
        h(
          'div',
          { class: 'ch6-card__actions' },
          b.id !== 'qiantang'
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'btn',
                  onclick: () => {
                    compare.set(0, 'qiantang');
                    compare.set(1, b.id);
                    document.getElementById('ch6-compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
                  },
                },
                `${tr(T.compareThis)}`,
              )
            : null,
          h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => open(null) }, tr(T.backToList)),
        ),
      );
    }

    function open(id) {
      current = id;
      drawCard();
      if (globe) {
        globe.setActive(id);
        if (id) globe.focus(id);
      }
      if (id) announce(tr(BORES.find((b) => b.id === id).name));
    }
    drawCard();
    onLangChange(() => {
      drawCard();
      stageEl.setAttribute('aria-label', tr(T.globeLabel));
    });

    const { createGlobe } = await import('./globe.js');
    globe = createGlobe(stageEl, { bores: BORES, onSelect: open });
    if (import.meta.env.DEV) window.__ch6globe = globe;
    if (!globe) {
      wrap.classList.add('ch6-globe--flat');
      hint.remove();
    }

    /* ── Why the funnel ── */
    section.append(
      h(
        'div',
        { class: 'ch6-block ch6-why' },
        h(
          'div',
          { class: 'ch6-why__text' },
          live(h('h3', { class: 'ch6-h' }), () => tr(T.funnelHead)),
          live(h('div', { class: 'prose' }), () => T.funnel[langOf()].map((p) => h('p', null, ...rich(p)))),
        ),
        funnelFigure(),
      ),
    );

    /* ── Compare ── */
    compare = createCompare({ bores: BORES, initial: ['qiantang', 'severn'], T });
    section.append(
      h(
        'div',
        { class: 'ch6-block', id: 'ch6-compare' },
        live(h('h3', { class: 'ch6-h' }), () => tr(T.compareHead)),
        live(h('p', { class: 'ch6-lead' }), () => tr(T.compareIntro)),
        compare.el,
      ),
    );

    /* ── Surfing ── */
    section.append(
      h(
        'div',
        { class: 'ch6-block ch6-surf' },
        live(h('h3', { class: 'ch6-h' }), () => tr(T.surfHead)),
        live(h('p', { class: 'ch6-lead' }), () => rich(tr(T.surfIntro))),
        h(
          'ol',
          { class: 'ch6-events' },
          T.surfEvents.map((ev) => h('li', null, h('span', { class: 'ch6-events__year' }, ev.year), live(h('p'), () => tr(ev)))),
        ),
        h(
          'p',
          { class: 'ch6-safety' },
          live(h('span'), () => tr(T.safety)),
          ' ',
          live(h('a', { href: '#ch3' }), () => tr(T.safetyLink)),
        ),
      ),
    );

    /* ── Describe it ── */
    const models = h('ul', { class: 'ch6-models', hidden: true, id: 'ch6-models' });
    const drawModels = () =>
      models.replaceChildren(
        ...T.models.map((m) =>
          h(
            'li',
            null,
            h('span', { class: 'ch6-models__tag' }, tr(m.tag)),
            h('p', { class: 'ch6-models__en', lang: 'en' }, m.en),
            h('p', { class: 'ch6-models__zh', lang: 'zh-CN' }, m.zh),
            canSpeak() ? h('button', { type: 'button', class: 'btn btn--ghost ch6-hear', onclick: () => speak(m.en, 'en') }, tr(T.hear)) : null,
          ),
        ),
      );
    drawModels();
    onLangChange(drawModels);
    const modelsBtn = h('button', { type: 'button', class: 'btn', 'aria-expanded': 'false', 'aria-controls': 'ch6-models' });
    const syncModelsBtn = () => {
      modelsBtn.textContent = tr(models.hidden ? T.showModels : T.hideModels);
      modelsBtn.setAttribute('aria-expanded', String(!models.hidden));
    };
    modelsBtn.addEventListener('click', () => {
      models.hidden = !models.hidden;
      syncModelsBtn();
    });
    syncModelsBtn();
    onLangChange(syncModelsBtn);

    section.append(
      h(
        'div',
        { class: 'ch6-block ch6-describe' },
        live(h('h3', { class: 'ch6-h' }), () => tr(T.describeHead)),
        live(h('p', { class: 'ch6-lead' }), () => tr(T.describePrompt)),
        h(
          'div',
          { class: 'ch6-describe__grid' },
          h(
            'div',
            null,
            live(h('label', { class: 'label', for: 'ch6-answer' }), () => tr(T.describeLabel)),
            h('textarea', { id: 'ch6-answer', class: 'ch6-answer', rows: '6', lang: 'en', spellcheck: 'true' }),
            h('div', { class: 'ch6-describe__actions' }, modelsBtn),
          ),
          h(
            'div',
            { class: 'ch6-phrases' },
            live(h('h4'), () => tr(T.phrasesHead)),
            h(
              'ul',
              null,
              T.phrases.map((p) => h('li', null, h('span', { lang: 'en' }, p.en), h('span', { class: 'ch6-phrases__zh', lang: 'zh-CN' }, p.zh))),
            ),
          ),
        ),
        models,
      ),
    );

    /* ── Quiz ── */
    section.append(
      h(
        'div',
        { class: 'ch6-block' },
        live(h('h3', { class: 'ch6-h' }), () => tr(T.quizHead)),
        live(h('p', { class: 'ch6-lead' }), () => tr(T.quizIntro)),
        buildQuiz(),
      ),
    );
  },
};
