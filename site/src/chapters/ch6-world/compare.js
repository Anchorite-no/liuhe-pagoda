/**
 * Two bores side by side, drawn to the same vertical scale next to a 1.7 m person.
 * The bore front moves upstream (right to left) through each panel.
 */
import { h, reducedMotion } from '../../core/ui.js';
import { tr, onLangChange } from '../../core/i18n.js';

const NS = 'http://www.w3.org/2000/svg';
const VW = 420;
const VH = 270;
const BASE = 214; // water surface before the bore
const BED = 254;
const PX_PER_M = 20; // vertical scale: 8 m = 160 px
const X0 = 70; // the water starts here (the bank with the person is on the left)
const MAX_M = 8;

function s(tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
}

function surfacePath(front, H) {
  // ahead of the bore (left, upstream): calm water; behind it: raised, with undulations
  let d = `M ${X0} ${BED} L ${X0} ${BASE}`;
  for (let x = X0; x <= VW; x += 3) {
    let y;
    if (x < front) {
      const k = Math.exp(-(front - x) / 9);
      y = BASE - H * 0.05 * k;
    } else {
      const dd = x - front;
      const rise = H * (1 - Math.exp(-dd / 5));
      const und = H * 0.16 * Math.exp(-dd / 70) * Math.sin(dd / 11);
      y = BASE - rise - und;
    }
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  return `${d} L ${VW} ${BED} Z`;
}

function crestPath(front, H) {
  let d = '';
  for (let x = Math.max(X0, front - 2); x <= Math.min(VW, front + 34); x += 2) {
    const dd = Math.max(0, x - front);
    const rise = H * (1 - Math.exp(-dd / 5));
    const und = H * 0.16 * Math.exp(-dd / 70) * Math.sin(dd / 11);
    d += `${d ? ' L' : 'M'} ${x} ${(BASE - rise - und).toFixed(1)}`;
  }
  return d;
}

const y = (m) => BASE - m * PX_PER_M;

function buildPanel() {
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}`, class: 'ch6-profile__svg', role: 'img' });
  const title = s('title');
  svg.append(title);
  // grid
  const grid = s('g', { class: 'ch6-profile__grid', 'aria-hidden': 'true' });
  const gridLabels = [];
  for (let m = 1; m <= MAX_M; m++) {
    grid.append(s('line', { x1: X0 - 6, y1: y(m), x2: VW, y2: y(m) }));
    const t = s('text', { x: X0 - 10, y: y(m) + 4, 'text-anchor': 'end' });
    gridLabels.push([t, m]);
    grid.append(t);
  }
  svg.append(grid);
  // range band and marks (behind the water)
  const band = s('rect', { class: 'ch6-profile__band', x: X0, width: VW - X0, y: 0, height: 0 });
  svg.append(band);
  const marks = s('g', { class: 'ch6-profile__marks' });
  svg.append(marks);
  // water
  const water = s('path', { class: 'ch6-profile__water' });
  const crest = s('path', { class: 'ch6-profile__crest' });
  svg.append(water, crest);
  // bed and calm level
  svg.append(s('line', { class: 'ch6-profile__bed', x1: X0, y1: BED, x2: VW, y2: BED }));
  // bank with a person 1.7 m tall
  svg.append(s('rect', { class: 'ch6-profile__bank', x: 0, y: BASE, width: X0, height: VH - BASE }));
  const ph = 1.7 * PX_PER_M;
  const px = 34;
  const person = s('g', { class: 'ch6-profile__person', 'aria-hidden': 'true' });
  const headR = ph * 0.075;
  person.append(
    s('circle', { cx: px, cy: BASE - ph + headR, r: headR }),
    s('path', {
      d: `M ${px - 4} ${BASE - ph + headR * 2 + 1.5} L ${px + 4} ${BASE - ph + headR * 2 + 1.5} L ${px + 5} ${BASE - ph * 0.45} L ${px + 2.2} ${BASE - ph * 0.45} L ${px + 2.2} ${BASE} L ${px - 2.2} ${BASE} L ${px - 2.2} ${BASE - ph * 0.45} L ${px - 5} ${BASE - ph * 0.45} Z`,
    }),
  );
  svg.append(person);
  const personLabel = s('text', { class: 'ch6-profile__plabel', x: px, y: BASE + 16, 'text-anchor': 'middle' });
  svg.append(personLabel);
  return { svg, title, band, marks, water, crest, gridLabels, personLabel };
}

/**
 * @param {object} o
 * @param {Array} o.bores
 * @param {string[]} o.initial  [idA, idB]
 * @param {object} o.T  strings
 */
export function createCompare({ bores, initial, T }) {
  let ids = initial.slice();
  let mode = 'high';
  const panels = [0, 1].map(() => buildPanel());
  const selects = [0, 1].map((i) => {
    const sel = h('select', { class: 'ch6-select', id: `ch6-cmp-${i}` });
    sel.addEventListener('change', () => {
      ids[i] = sel.value;
      render();
    });
    return sel;
  });
  const selectLabels = [T.compareA, T.compareB].map((pair, i) => h('label', { class: 'label', for: `ch6-cmp-${i}` }, tr(pair)));
  const facts = [0, 1].map(() => h('div', { class: 'ch6-profile__facts' }));
  const notes = [0, 1].map(() => h('p', { class: 'note ch6-profile__note' }));

  const modeBtn = h('button', { type: 'button', class: 'btn btn--ghost ch6-mode', 'aria-pressed': 'false' });
  modeBtn.addEventListener('click', () => {
    mode = mode === 'high' ? 'low' : 'high';
    render();
  });

  const cols = [0, 1].map((i) =>
    h(
      'div',
      { class: 'ch6-profile' },
      h('div', { class: 'ch6-profile__pick' }, selectLabels[i], selects[i]),
      h('figure', { class: 'ch6-profile__fig' }, panels[i].svg),
      facts[i],
      notes[i],
    ),
  );
  const el = h('div', { class: 'ch6-compare' }, h('div', { class: 'ch6-compare__cols' }, cols), h('div', { class: 'ch6-compare__tools' }, modeBtn));

  const heights = [0, 0];
  const fill = () => {
    selects.forEach((sel, i) => {
      sel.replaceChildren(...bores.map((b) => h('option', { value: b.id }, tr(b.name))));
      sel.value = ids[i];
    });
  };

  function heightFor(b) {
    if (b.range) {
      const [lo, hi] = b.range;
      return mode === 'low' && lo != null ? lo : hi;
    }
    // no bore today: draw the historical report
    return b.marks[0] ? b.marks[0].v : 0;
  }

  function render() {
    ids.forEach((id, i) => {
      const b = bores.find((x) => x.id === id);
      const p = panels[i];
      const hm = heightFor(b);
      heights[i] = hm * PX_PER_M;
      p.svg.classList.toggle('is-historical', !b.range);
      if (b.range) {
        const lo = b.range[0] ?? 0;
        const hi = b.range[1];
        p.band.setAttribute('y', y(hi));
        p.band.setAttribute('height', Math.max(1, (hi - lo) * PX_PER_M));
        p.band.style.display = '';
      } else {
        p.band.style.display = 'none';
      }
      p.marks.replaceChildren();
      for (const m of b.marks) {
        p.marks.append(s('line', { x1: X0, y1: y(m.v), x2: VW, y2: y(m.v) }));
        p.marks.append(s('text', { x: VW - 4, y: y(m.v) - 5, 'text-anchor': 'end' }, `${tr(m.label)} · ${tr(T.metres, { n: m.v })}`));
      }
      for (const [t, m] of p.gridLabels) t.textContent = tr(T.metres, { n: m });
      p.personLabel.textContent = tr(T.person);
      p.title.textContent = tr(T.profileAlt, { name: tr(b.name), height: tr(b.rangeText) });
      facts[i].replaceChildren(
        h('p', { class: 'ch6-profile__name' }, tr(b.name)),
        h('p', { class: 'ch6-profile__h' }, tr(b.rangeText)),
        h('p', { class: 'note' }, `${tr(T.labels.speed)}: ${tr(b.speed)}`),
        h('p', { class: 'note' }, `${tr(T.labels.season)}: ${tr(b.season)}`),
      );
      notes[i].textContent = b.range ? '' : tr(T.noBoreToday);
      notes[i].hidden = !!b.range;
    });
    modeBtn.textContent = tr(mode === 'high' ? T.showLow : T.showHigh);
    modeBtn.setAttribute('aria-pressed', String(mode === 'low'));
    if (!running) drawFrame(performance.now());
  }

  /* animation */
  let raf = 0;
  let running = false;
  let visible = false;
  const reduce = reducedMotion();
  const PERIOD = 7000;
  function drawFrame(now) {
    panels.forEach((p, i) => {
      // static frame for reduced motion: front a third of the way in
      const k = reduce ? 0.62 : ((now + i * 900) % PERIOD) / PERIOD;
      const front = VW + 20 - k * (VW - X0 + 80);
      p.water.setAttribute('d', surfacePath(front, heights[i]));
      p.crest.setAttribute('d', crestPath(front, heights[i]));
    });
  }
  function loop(now) {
    drawFrame(now);
    raf = requestAnimationFrame(loop);
  }
  function evaluate() {
    const should = visible && !reduce && document.visibilityState === 'visible';
    if (should && !running) {
      running = true;
      raf = requestAnimationFrame(loop);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) visible = e.isIntersecting;
    evaluate();
  });
  io.observe(el);
  document.addEventListener('visibilitychange', evaluate);

  fill();
  render();
  const off = onLangChange(() => {
    if (!el.isConnected) return off();
    selectLabels[0].textContent = tr(T.compareA);
    selectLabels[1].textContent = tr(T.compareB);
    fill();
    render();
  });

  return {
    el,
    set(i, id) {
      ids[i] = id;
      selects[i].value = id;
      render();
    },
  };
}
