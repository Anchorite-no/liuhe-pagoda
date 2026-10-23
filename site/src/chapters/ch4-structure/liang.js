/**
 * "Liang Sicheng's what-if": two elevation drawings, today ↔ an illustrative reading of
 * his 1935 restoration plan, with a wipe slider.
 *
 * What we could confirm about the plan (see NOTES.md): restore the Southern Song look;
 * on each storey an open balcony platform (平座) on bracket sets with a railing, the wall,
 * then one deep eave with upturned corners — seven eaves instead of thirteen. The drawing
 * below follows that description and the proportions of our 3D model. It is NOT a copy of
 * his drawings, and the caption says so.
 */
import { h, bi, rangeSlider } from '../../core/ui.js';
import { tr } from '../../core/i18n.js';
import { rich, onLang } from './rich.js';

const NS = 'http://www.w3.org/2000/svg';
const W = 320;
const H = 460;
const GROUND = 438;
const K = 6.6; // px per metre
const CX = W / 2;
const C22 = Math.cos(Math.PI / 8);

/* Same tier layout as src/three/pagoda.js, so the drawing matches the 3D model. */
const PLINTH_H = 1.6;
const TIERS = [];
{
  let y = PLINTH_H;
  for (let i = 0; i < 13; i++) {
    const height = 4.8 - i * 0.115;
    TIERS.push({ i, y0: y, y1: y + height, R: 10.2 - i * 0.33, over: 3.1 - i * 0.07, ming: i % 2 === 0 });
    y += height;
  }
}
const STOREYS = [];
for (let f = 0; f < 7; f++) {
  const a = TIERS[2 * f];
  const b = TIERS[Math.min(2 * f + 1, 12)];
  STOREYS.push({ f, y0: a.y0, y1: b.y1, R: a.R - 1.3, Rtop: b.R - 1.3 });
}
const TOP_Y = TIERS[12].y1;

const px = (m) => m * K;
const Y = (m) => GROUND - m * K;
const f1 = (n) => n.toFixed(1);

/** Eave seen in elevation: sloping roof with upturned corners. Half-widths in metres. */
function eave(yTop, halfIn, halfOut, drop, upturn, thick = 0.45) {
  const yi = Y(yTop);
  const yo = Y(yTop - drop);
  const tip = Y(yTop - drop + upturn);
  const xi = px(halfIn);
  const xo = px(halfOut);
  const th = px(thick);
  const right = `L${f1(CX + xi)} ${f1(yi)} Q${f1(CX + xo * 0.82)} ${f1(yo + th * 0.2)} ${f1(CX + xo)} ${f1(tip)} Q${f1(CX + xo * 0.86)} ${f1(yo + th * 1.4)} ${f1(CX + xo * 0.62)} ${f1(yo + th)}`;
  const left = `L${f1(CX - xo * 0.62)} ${f1(yo + th)} Q${f1(CX - xo * 0.86)} ${f1(yo + th * 1.4)} ${f1(CX - xo)} ${f1(tip)} Q${f1(CX - xo * 0.82)} ${f1(yo + th * 0.2)} ${f1(CX - xi)} ${f1(yi)} Z`;
  const tiles = [];
  const n = Math.max(6, Math.round(xo / 7));
  for (let k = 1; k < n; k++) {
    const u = k / n;
    const x0 = (u * 2 - 1) * xi;
    const x1 = (u * 2 - 1) * xo * 0.7;
    tiles.push(`M${f1(CX + x0)} ${f1(yi + 1)} L${f1(CX + x1)} ${f1(yo + th * 0.3)}`);
  }
  return `<path class="lg-eave" d="M${f1(CX - xi)} ${f1(yi)} ${right} ${left}"/><path class="lg-tile" d="${tiles.join(' ')}"/>`;
}

function wall(y0, y1, half, cls = 'lg-wall') {
  return `<rect class="${cls}" x="${f1(CX - px(half))}" y="${f1(Y(y1))}" width="${f1(px(half) * 2)}" height="${f1(px(y1 - y0))}"/>`;
}

function arched(y0, hgt, half, cls = 'lg-open') {
  const x0 = CX - px(half);
  const x1 = CX + px(half);
  const yb = Y(y0);
  const ys = Y(y0 + hgt - half);
  return `<path class="${cls}" d="M${f1(x0)} ${f1(yb)} L${f1(x0)} ${f1(ys)} A${f1(px(half))} ${f1(px(half))} 0 0 1 ${f1(x1)} ${f1(ys)} L${f1(x1)} ${f1(yb)} Z"/>`;
}

function finial(yBase) {
  const b = Y(yBase);
  const s = K;
  return `<g class="lg-finial">
    <rect x="${f1(CX - 1.1 * s)}" y="${f1(b - 0.5 * s)}" width="${f1(2.2 * s)}" height="${f1(0.5 * s)}"/>
    <path d="M${f1(CX - 0.95 * s)} ${f1(b - 0.5 * s)} Q${f1(CX)} ${f1(b - 1.6 * s)} ${f1(CX + 0.95 * s)} ${f1(b - 0.5 * s)} Z"/>
    <rect x="${f1(CX - 0.12 * s)}" y="${f1(b - 4.4 * s)}" width="${f1(0.24 * s)}" height="${f1(3.4 * s)}"/>
    ${[0, 1, 2, 3, 4].map((r) => `<rect x="${f1(CX - (0.72 - r * 0.08) * s)}" y="${f1(b - (1.3 + r * 0.32) * s)}" width="${f1((1.44 - r * 0.16) * s)}" height="${f1(0.12 * s)}"/>`).join('')}
    <circle cx="${CX}" cy="${f1(b - 3.1 * s)}" r="${f1(0.34 * s)}"/>
    <circle cx="${CX}" cy="${f1(b - 3.6 * s)}" r="${f1(0.24 * s)}"/>
  </g>`;
}

function plinth() {
  return `<rect class="lg-plinth" x="${f1(CX - px(13.6 * C22))}" y="${f1(Y(0.8))}" width="${f1(px(13.6 * C22) * 2)}" height="${f1(px(0.8))}"/>
  <rect class="lg-plinth" x="${f1(CX - px(12.5 * C22))}" y="${f1(Y(1.6))}" width="${f1(px(12.5 * C22) * 2)}" height="${f1(px(0.8))}"/>`;
}

function roof(yTop, halfOut) {
  // pyramidal top roof rising to the finial base
  const peak = TOP_Y + 1.5;
  return eave(peak, 1.0, halfOut, peak - (yTop - 1.4), 1.2, 0.5);
}

/** Today: 13 eaves (Qing timber galleries around the Song brick body). */
function today() {
  let walls = '';
  let eaves = '';
  TIERS.forEach((t, i) => {
    const next = TIERS[i + 1];
    const half = t.R * C22;
    walls += wall(t.y0, t.y1 - 0.2, half);
    // posts at the corners of the visible faces
    for (const s of [-1, -0.41, 0.41, 1]) {
      const x = CX + s * px(half) - (s > 0 ? 3 : 0);
      walls += `<rect class="lg-post" x="${f1(x)}" y="${f1(Y(t.y1 - 0.2))}" width="3" height="${f1(px(t.y1 - 0.2 - t.y0))}"/>`;
    }
    if (t.ming) walls += arched(t.y0 + 0.2, Math.min(3.0, t.y1 - t.y0 - 1.6), 0.9);
    else walls += `<rect class="lg-lattice" x="${f1(CX - px(2.4))}" y="${f1(Y(t.y1 - 1.5))}" width="${f1(px(4.8))}" height="${f1(px(t.y1 - t.y0 - 2.1))}"/>`;
    const halfOut = (t.R + t.over) * C22 + 1.2;
    if (next) eaves = eave(t.y1 + 0.35, (next.R - 0.25) * C22, halfOut, 1.8, 1.15) + eaves;
    else eaves = roof(t.y1, halfOut) + eaves;
  });
  return plinth() + walls + eaves + finial(TIERS[12].y1 + 1.35);
}

/** Liang's proposal as we read it: 7 storeys, each with balcony platform, wall and one deep eave. */
function liang() {
  let out = '';
  let eaves = '';
  STOREYS.forEach((s, f) => {
    const half = s.R * C22;
    const halfTop = s.Rtop * C22;
    const balcony = f > 0 ? 2.0 : 0;
    // wall (the brick body, which survives today)
    out += wall(s.y0, s.y1 - 0.4, (half + halfTop) / 2 + 0.2);
    // doorway
    out += arched(s.y0 + balcony + 0.1, 3.6, 1.0);
    // corner columns
    for (const sg of [-1, 1]) {
      const x = CX + sg * px((half + halfTop) / 2 + 0.2) - (sg > 0 ? 3 : 0);
      out += `<rect class="lg-post" x="${f1(x)}" y="${f1(Y(s.y1 - 0.4))}" width="3" height="${f1(px(s.y1 - 0.4 - s.y0))}"/>`;
    }
    // bracket band under the eave
    const by = s.y1 - 1.3;
    out += `<rect class="lg-brackets" x="${f1(CX - px(halfTop + 0.8))}" y="${f1(Y(by + 0.9))}" width="${f1(px(halfTop + 0.8) * 2)}" height="${f1(px(0.9))}"/>`;
    for (let k = -3; k <= 3; k++) {
      const x = CX + (k / 3) * px(halfTop + 0.4);
      out += `<rect class="lg-dou" x="${f1(x - 4)}" y="${f1(Y(by + 0.9))}" width="8" height="${f1(px(0.45))}"/>`;
    }
    if (f > 0) {
      // balcony platform (平座): bracket band, deck, railing
      const deck = s.y0 + 0.9;
      const bh = half + 1.7;
      out += `<rect class="lg-brackets" x="${f1(CX - px(half + 1.2))}" y="${f1(Y(deck))}" width="${f1(px(half + 1.2) * 2)}" height="${f1(px(0.9))}"/>`;
      for (let k = -3; k <= 3; k++) {
        const x = CX + (k / 3) * px(half + 0.8);
        out += `<rect class="lg-dou" x="${f1(x - 4)}" y="${f1(Y(deck - 0.2))}" width="8" height="${f1(px(0.4))}"/>`;
      }
      out += `<rect class="lg-deck" x="${f1(CX - px(bh))}" y="${f1(Y(deck + 0.25))}" width="${f1(px(bh) * 2)}" height="${f1(px(0.25))}"/>`;
      const rail = deck + 1.15;
      out += `<path class="lg-rail" d="M${f1(CX - px(bh))} ${f1(Y(rail))} H${f1(CX + px(bh))} M${f1(CX - px(bh))} ${f1(Y(rail - 0.5))} H${f1(CX + px(bh))}"/>`;
      let posts = '';
      const n = 14;
      for (let k = 0; k <= n; k++) {
        const x = CX - px(bh) + (k / n) * px(bh) * 2;
        posts += `M${f1(x)} ${f1(Y(deck + 0.25))} V${f1(Y(rail))} `;
      }
      out += `<path class="lg-rail lg-rail--thin" d="${posts}"/>`;
    }
    const halfOut = halfTop + 3.6;
    if (f < 6) eaves = eave(s.y1 + 0.2, halfTop - 0.3, halfOut, 2.2, 1.1) + eaves;
    else eaves = roof(s.y1, halfOut) + eaves;
  });
  return plinth() + out + eaves + finial(TIERS[12].y1 + 1.35);
}

function svg(kind, label) {
  const body = kind === 'today' ? today() : liang();
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="${NS}" aria-hidden="true" focusable="false" class="lg lg--${kind}">
    <rect class="lg-paper" width="${W}" height="${H}"/>
    <line class="lg-ground" x1="0" x2="${W}" y1="${GROUND}" y2="${GROUND}"/>
    ${body}
    <text class="lg-label" x="${kind === 'today' ? 14 : W - 14}" y="26" text-anchor="${kind === 'today' ? 'start' : 'end'}">${label}</text>
  </svg>`;
}

export function buildLiang() {
  const todayBox = h('div', { class: 'ch4-wipe__layer ch4-wipe__today' });
  const liangBox = h('div', { class: 'ch4-wipe__layer ch4-wipe__liang' });
  const divider = h('div', { class: 'ch4-wipe__divider', 'aria-hidden': 'true' }, h('span', { class: 'ch4-wipe__knob' }));
  const wipe = h('div', { class: 'ch4-wipe' }, todayBox, liangBox, divider);

  let pos = 50;
  const setPos = (v) => {
    pos = Math.max(0, Math.min(100, v));
    liangBox.style.clipPath = `inset(0 0 0 ${pos}%)`;
    divider.style.left = `${pos}%`;
  };

  const slider = rangeSlider({
    label: { en: 'Move the divider (left: today, right: Liang’s idea)', zh: '移动分隔线（左：今天，右：梁思成设想）' },
    min: 0,
    max: 100,
    step: 1,
    value: 50,
    format: (v) =>
      v >= 98 ? tr({ en: 'all today', zh: '全是今天' }) : v <= 2 ? tr({ en: 'all Liang', zh: '全是梁思成方案' }) : `${Math.round(v)}%`,
    onInput: setPos,
  });
  slider.el.classList.add('ch4-wipe__range');

  // Drag directly on the drawing (horizontal drags; vertical swipes still scroll the page).
  let dragging = false;
  const fromEvent = (e) => {
    const r = wipe.getBoundingClientRect();
    const v = ((e.clientX - r.left) / r.width) * 100;
    setPos(v);
    slider.set(Math.round(pos));
  };
  wipe.addEventListener('pointerdown', (e) => {
    dragging = true;
    wipe.setPointerCapture(e.pointerId);
    fromEvent(e);
  });
  wipe.addEventListener('pointermove', (e) => dragging && fromEvent(e));
  const end = () => (dragging = false);
  wipe.addEventListener('pointerup', end);
  wipe.addEventListener('pointercancel', end);

  const render = () => {
    todayBox.innerHTML = svg('today', tr({ en: 'Today · 13 eaves', zh: '今天 · 十三重檐' }));
    liangBox.innerHTML = svg('liang', tr({ en: 'Liang’s idea · 7 eaves', zh: '梁思成设想 · 七重檐' }));
    setPos(pos);
  };

  const el = h(
    'section',
    { class: 'ch4-liang', 'aria-labelledby': 'ch4-liang-title' },
    bi({ en: 'Liang Sicheng’s what-if', zh: '梁思成的设想' }, 'h3', { class: 'ch4-h3', id: 'ch4-liang-title' }),
    h(
      'div',
      { class: 'ch4-liang__grid' },
      h(
        'div',
        { class: 'prose' },
        rich({
          en: 'In 1934 Zeng Yangfu, head of Zhejiang’s construction department, wanted the pagoda returned to its Song appearance and invited the architect Liang Sicheng (梁思成) to study it. Liang spent more than ten days measuring the tower and checked its brackets and carvings against the _Yingzao Fashi_. His verdict: the seven-storey brick body is genuine Southern Song work. In March 1935 he published _A Plan to Restore the Liuhe Pagoda, Hangzhou_ (杭州六和塔复原状计划) in the _Bulletin of the Society for Research in Chinese Architecture_ (中国营造学社汇刊), volume 5, number 3.',
          zh: '1934 年，时任浙江省建设厅厅长的曾养甫想把六和塔恢复成南宋的样子，请建筑学家梁思成来研究。梁思成在塔上测量了十多天，把斗拱、雕刻和《营造法式》逐一对照，认定七层砖砌塔身是南宋原物。1935 年 3 月，他在《中国营造学社汇刊》第五卷第三期发表了《杭州六和塔复原状计划》。',
        }),
        rich({
          en: 'He did not like the late-Qing timber. To him it made a famous tower look squat and heavy, “a great injustice” to it. His drawings (an elevation, a section and a plan of every storey) show a Song-style tower instead. Each storey has an open [[arch-pingzuo|balcony platform]] with a railing, carried on [[arch-bracket-set|bracket sets]]; above it rises the wall, and above that one deep eave with upturned corners. That makes seven eaves, not thirteen.',
          zh: '他对清末的木外檐很不满意，认为它让名塔显得“肥矮”，是“名塔莫大的委曲”。他的复原图（立面、剖面和各层平面）画的是一座宋式塔：每一层都有由[[arch-bracket-set|斗拱]]托起、带栏杆的开敞[[arch-pingzuo|平座]]，上面是塔身，再上面是一圈出檐深远、檐角起翘的腰檐。这样一共七重檐，而不是十三重。',
        }),
        rich({
          en: 'The plan was never carried out. Zeng was soon posted to Guangdong, and in 1937 full-scale war with Japan began. When the pagoda had its biggest modern repair in 1991, the team led by Liang’s former student Guo Daiheng chose the opposite principle: keep the Qing exterior and “restore the old as old” (整旧如旧).',
          zh: '这个计划最终没有实施：曾养甫不久调往广东，1937 年全面抗战爆发。1991 年六和塔迎来近代规模最大的一次修缮，梁思成的学生郭黛姮带领团队反而选择保留清代外檐，“整旧如旧”。',
        }),
        h(
          'div',
          { class: 'ch4-turn' },
          bi({ en: 'Your turn', zh: '轮到你' }, 'p', { class: 'ch4-turn__title' }),
          rich({
            en: 'Should the timber come off? Answer in two English sentences. Start with “I would…” or “I wouldn’t…, because…”.',
            zh: '该不该拆掉木外檐？用两句英文回答，可以用 “I would… / I wouldn’t…, because…” 开头。',
          }),
        ),
      ),
      h(
        'figure',
        { class: 'ch4-liang__fig' },
        wipe,
        slider.el,
        h(
          'figcaption',
          { class: 'note' },
          bi(
            {
              en: 'Drag to compare. Left: the pagoda today. Right: our drawing of Liang’s idea, based on published descriptions of his 1935 plan. It is an illustrative interpretation, not a copy of his drawings; proportions follow our 3D model.',
              zh: '拖动比较。左：今天的六和塔；右：我们根据公开资料对梁思成 1935 年方案所作的示意性解读，并非他原图的摹本，比例取自本站的 3D 模型。',
            },
            'span',
          ),
        ),
      ),
    ),
  );

  onLang(el, render);
  return el;
}
