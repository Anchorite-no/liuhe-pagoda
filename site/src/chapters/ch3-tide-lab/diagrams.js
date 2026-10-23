/**
 * SVG instruments for the tide lab: the Sun–Earth–Moon diagram, a moon-phase icon,
 * the estuary "sand table" (plan + long profile, with the tide wave travelling up it)
 * and small top-view icons of the three bore shapes. All decorative (aria-hidden);
 * everything they show is also said in text.
 */
import { moonAngle, alignment, RIVER_WIDTH_KM } from './model.js';

const NS = 'http://www.w3.org/2000/svg';

export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  for (const c of children) if (c) el.append(c);
  return el;
}

function svgRoot(w, hgt, cls) {
  return s('svg', { viewBox: `0 0 ${w} ${hgt}`, class: cls, 'aria-hidden': 'true', focusable: 'false' });
}

/* ───────────────────────── Moon phase icon ───────────────────────── */

/** Path of the lit part of the moon disc for an age fraction f (0 new, 0.5 full). */
function litPath(cx, cy, r, f) {
  const k = Math.cos(2 * Math.PI * f); // 1 at new, −1 at full
  const waxing = f < 0.5;
  const rx = Math.abs(k) * r;
  // outer arc on the lit side, terminator ellipse back
  const sweepOuter = waxing ? 1 : 0;
  const sweepInner = (waxing ? k > 0 : k < 0) ? 0 : 1;
  return `M${cx} ${cy - r} A${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy + r} A${rx} ${r} 0 0 ${sweepInner} ${cx} ${cy - r}Z`;
}

export function moonIcon(size = 40) {
  const svg = svgRoot(40, 40, 'ch3-moonicon');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  const disc = s('circle', { cx: 20, cy: 20, r: 17, class: 'ch3-moonicon__dark' });
  const lit = s('path', { class: 'ch3-moonicon__lit' });
  svg.append(disc, lit);
  return {
    el: svg,
    set(ageDays, synodic = 29.530588853) {
      const f = (((ageDays % synodic) + synodic) % synodic) / synodic;
      lit.setAttribute('d', litPath(20, 20, 17, f));
    },
  };
}

/* ───────────────────────── Sun–Earth–Moon ───────────────────────── */

/**
 * Seen from above the North Pole: sunlight from the left, Earth in the middle with its
 * tidal bulge, the Moon on its orbit. The bulge stretches most when Sun and Moon line up.
 */
export function orbitDiagram() {
  const W = 260;
  const H = 150;
  const cx = 160;
  const cy = 75;
  const R = 56;
  const svg = svgRoot(W, H, 'ch3-orbit');
  // sunlight
  const rays = s('g', { class: 'ch3-orbit__rays' });
  for (let i = 0; i < 5; i++) {
    const y = 23 + i * 26;
    rays.append(s('line', { x1: 34, y1: y, x2: 74, y2: y }));
  }
  const sun = s('g', { class: 'ch3-orbit__sun' }, s('circle', { cx: 0, cy: cy, r: 30 }));
  const orbit = s('circle', { cx, cy, r: R, class: 'ch3-orbit__path' });
  const sunBulge = s('ellipse', { cx, cy, rx: 21, ry: 17, class: 'ch3-orbit__bulge ch3-orbit__bulge--sun' });
  const bulge = s('ellipse', { cx, cy, rx: 26, ry: 16, class: 'ch3-orbit__bulge' });
  const earth = s('circle', { cx, cy, r: 13, class: 'ch3-orbit__earth' });
  const moonG = s('g');
  const moonDark = s('circle', { r: 8, class: 'ch3-orbit__moon-dark' });
  const moonLit = s('path', { d: 'M0 -8 A8 8 0 0 0 0 8 Z', class: 'ch3-orbit__moon-lit' });
  moonG.append(moonDark, moonLit);
  const pull = s('line', { class: 'ch3-orbit__pull', x1: cx, y1: cy });
  svg.append(sun, rays, orbit, sunBulge, bulge, pull, earth, moonG);
  return {
    el: svg,
    set(day) {
      const th = moonAngle(day); // 0 = new (towards the Sun, left), π = full
      const mx = cx - R * Math.cos(th);
      const my = cy + R * Math.sin(th);
      moonG.setAttribute('transform', `translate(${mx.toFixed(1)} ${my.toFixed(1)})`);
      pull.setAttribute('x2', mx.toFixed(1));
      pull.setAttribute('y2', my.toFixed(1));
      const al = alignment(day + 2); // alignment of the bodies themselves, without the tidal lag
      const deg = (-th * 180) / Math.PI;
      bulge.setAttribute('rx', (20 + 10 * al).toFixed(1));
      bulge.setAttribute('ry', (17 - 3 * al).toFixed(1));
      bulge.setAttribute('transform', `rotate(${deg.toFixed(1)} ${cx} ${cy})`);
      svg.classList.toggle('is-spring', al > 0.8);
      svg.classList.toggle('is-neap', al < 0.25);
    },
  };
}

/* ───────────────────────── Estuary sand table ───────────────────────── */

// Along-estuary coordinate u: 0 at the Liuhe Pagoda (Zhakou), 1 at the bay mouth.
const PLACES = [
  { id: 'pagoda', u: 0.0, en: 'Liuhe Pagoda', zh: '六和塔' },
  { id: 'yanguan', u: 0.3, en: 'Yanguan', zh: '盐官' },
  { id: 'ganpu', u: 0.55, en: 'Ganpu', zh: '澉浦' },
];

/** River/bay width (km) along the estuary for a given mouth width. */
export function widthAt(u, mouthKm) {
  const yU = 0.3;
  if (u <= yU) {
    // the river: about 1 km at the pagoda, 2.5 km at Yanguan
    return 1 + (RIVER_WIDTH_KM - 1) * (u / yU);
  }
  const t = (u - yU) / (1 - yU);
  return RIVER_WIDTH_KM * Math.pow(Math.max(mouthKm, RIVER_WIDTH_KM) / RIVER_WIDTH_KM, Math.pow(t, 0.8));
}

/**
 * Bed level along the estuary (m, relative to low water), for a sandbar height. Matches the
 * model: over the crest of the bar the water is 12 m − bar deep at low tide.
 */
export function bedAt(u, bar) {
  const base = -12 - 3 * Math.max(0, u - 0.26); // deeper toward the sea
  const bump = Math.exp(-Math.pow((u - 0.26) / 0.17, 2)); // crest between Hangzhou and Yanguan
  return base + bar * bump;
}

export function estuaryDiagram({ labels }) {
  const W = 480;
  const H = 336;
  const L = 14; // left margin (pagoda end)
  const Rm = 12; // right margin
  const planCy = 96;
  const planScale = 1.15; // px per km of width (exaggerated vertically, as on any river map)
  const profTop = 206;
  const profBot = 300;
  const svg = svgRoot(W, H, 'ch3-estuary');
  const X = (u) => L + u * (W - L - Rm);
  // plan
  const water = s('path', { class: 'ch3-estuary__water' });
  const shoreN = s('path', { class: 'ch3-estuary__shore' });
  const shoreS = s('path', { class: 'ch3-estuary__shore' });
  const front = s('line', { class: 'ch3-estuary__front' });
  const sea = s('text', { class: 'ch3-estuary__sea', x: W - Rm - 8, y: planCy + 5, 'text-anchor': 'end' });
  const widthTag = s('text', { class: 'ch3-estuary__dim', x: W - Rm, y: 18, 'text-anchor': 'end' });
  // profile
  const bed = s('path', { class: 'ch3-estuary__bed' });
  const surf = s('path', { class: 'ch3-estuary__surf' });
  const lowLine = s('line', { class: 'ch3-estuary__low', x1: X(0), x2: X(1) });
  const barTag = s('text', { class: 'ch3-estuary__dim', 'text-anchor': 'middle' });
  const profTitle = s('text', { class: 'ch3-estuary__title', x: L, y: profTop - 22 });
  const planTitle = s('text', { class: 'ch3-estuary__title', x: L, y: 18 });
  const placeG = s('g', { class: 'ch3-estuary__places' });
  svg.append(water, shoreN, shoreS, front, sea, widthTag, planTitle, bed, surf, lowLine, barTag, profTitle, placeG);

  const placeEls = PLACES.map((p) => {
    const x = X(p.u);
    const tick = s('line', { x1: x, x2: x, y1: planCy + 8, y2: profBot, class: 'ch3-estuary__tick' });
    const t = s('text', { x, y: profBot + 22, 'text-anchor': p.id === 'pagoda' ? 'start' : 'middle', class: `ch3-estuary__place ch3-estuary__place--${p.id}` });
    placeG.append(tick, t);
    return { p, t };
  });
  // a tiny pagoda glyph at the river's end
  const glyph = s('path', {
    class: 'ch3-estuary__pagoda',
    d: `M${X(0) - 4} ${planCy + 6} h8 l-1 -4 h2 l-2 -4 h1.5 l-2 -4 h1 l-1.5 -4 l-1.5 4 h1 l-2 4 h1.5 l-2 4 h2 z`,
  });
  svg.append(glyph);

  const yProf = (m) => {
    // map −16 … +7 m into the profile box
    const t = (m + 16) / 23;
    return profBot - t * (profBot - profTop);
  };

  let mouth = 100;
  let bar = 10;
  const N = 120;

  function drawStatic() {
    const top = [];
    const bot = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const hw = Math.max(1, (widthAt(u, mouth) * planScale) / 2);
      top.push(`${X(u).toFixed(1)} ${(planCy - hw).toFixed(1)}`);
      bot.push(`${X(u).toFixed(1)} ${(planCy + hw).toFixed(1)}`);
    }
    water.setAttribute('d', `M${top.join('L')}L${bot.slice().reverse().join('L')}Z`);
    shoreN.setAttribute('d', `M${top.join('L')}`);
    shoreS.setAttribute('d', `M${bot.join('L')}`);
    let b = `M${X(0)} ${profBot}`;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      b += `L${X(u).toFixed(1)} ${yProf(bedAt(u, bar)).toFixed(1)}`;
    }
    b += `L${X(1)} ${profBot}Z`;
    bed.setAttribute('d', b);
    const yLow = yProf(0);
    lowLine.setAttribute('y1', yLow);
    lowLine.setAttribute('y2', yLow);
    const crestU = 0.26;
    barTag.setAttribute('x', X(crestU));
    barTag.setAttribute('y', Math.min(yProf(bedAt(crestU, bar)) + 20, profBot - 6));
  }

  let wave = null; // { u, amp, steep } or null
  function drawSurface() {
    const yLow = 0;
    let d = '';
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      let eta = yLow;
      if (wave) {
        // raised water behind the front (seaward, u > front), low water ahead
        const lam = wave.lambda(u);
        const a = wave.amp(u);
        eta = yLow + a * 0.5 * (1 + Math.tanh((u - wave.u) / lam));
        if (wave.steep > 0.05 && u > wave.u) eta += a * 0.08 * wave.steep * Math.sin((u - wave.u) * 260) * Math.exp(-(u - wave.u) / 0.04);
      }
      const bedM = bedAt(u, bar);
      eta = Math.max(eta, bedM + 0.3);
      d += `${i ? 'L' : 'M'}${X(u).toFixed(1)} ${yProf(eta).toFixed(1)}`;
    }
    surf.setAttribute('d', d);
    if (wave) {
      const x = X(wave.u);
      const w = Math.max(1, widthAt(wave.u, mouth) * planScale);
      front.setAttribute('x1', x);
      front.setAttribute('x2', x);
      front.setAttribute('y1', planCy - w / 2);
      front.setAttribute('y2', planCy + w / 2);
      front.style.opacity = '1';
    } else {
      front.style.opacity = '0';
    }
  }

  function relabel() {
    for (const { p, t } of placeEls) t.textContent = labels.place(p);
    sea.textContent = labels.sea();
    planTitle.textContent = labels.plan();
    profTitle.textContent = labels.profile();
    widthTag.textContent = labels.mouth(mouth);
    barTag.textContent = labels.bar(bar);
  }

  drawStatic();
  drawSurface();
  relabel();

  return {
    el: svg,
    setGeometry(m, b) {
      mouth = m;
      bar = b;
      drawStatic();
      drawSurface();
      relabel();
    },
    relabel,
    /**
     * Show the tide wave with its front at u (1 = mouth … 0 = pagoda).
     * result: model output (range, height). Pass null to clear.
     */
    setWave(u, result) {
      if (u == null || !result) {
        wave = null;
        drawSurface();
        return;
      }
      const R = result.range;
      const steep = Math.min(1, result.height / 3);
      const ampAt = (x) => {
        // tide range grows through the funnel to the bay head, then friction eats it upstream
        const g = x > 0.55 ? result.range0 + (R - result.range0) * ((1 - x) / 0.45) : R * (0.35 + 0.65 * Math.pow(x / 0.55, 0.7));
        return g * 0.55;
      };
      wave = {
        u,
        steep,
        amp: ampAt,
        lambda: (x) => {
          // the front is long and gentle at sea and steepens over the sandbar
          const sea = 0.12;
          const sharp = result.height >= 0.15 ? 0.004 + 0.02 * (1 - steep) : 0.05;
          const k = Math.min(1, Math.max(0, (0.6 - x) / 0.3));
          return sea + (sharp - sea) * k;
        },
      };
      drawSurface();
    },
  };
}

/* ───────────────────────── Shape icons ───────────────────────── */

/** Tiny top views of the three classic shapes (river runs left–right, tide comes from the right). */
export function shapeIcon(kind) {
  const svg = svgRoot(120, 64, `ch3-shapeicon ch3-shapeicon--${kind}`);
  svg.append(
    s('rect', { x: 0, y: 8, width: 120, height: 48, class: 'ch3-shapeicon__river' }),
    s('line', { x1: 0, y1: 8, x2: 120, y2: 8, class: 'ch3-shapeicon__bank' }),
    s('line', { x1: 0, y1: 56, x2: 120, y2: 56, class: 'ch3-shapeicon__bank' }),
  );
  const arrow = (x1, y1, x2, y2) =>
    s('path', { d: `M${x1} ${y1} L${x2} ${y2}`, class: 'ch3-shapeicon__arrow', 'marker-end': 'url(#ch3-arrowhead)' });
  const defs = s(
    'defs',
    {},
    s('marker', { id: 'ch3-arrowhead', viewBox: '0 0 6 6', refX: 5, refY: 3, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }, s('path', { d: 'M0 0 L6 3 L0 6 z', class: 'ch3-shapeicon__head' })),
  );
  svg.append(defs);
  if (kind === 'line') {
    svg.append(s('path', { d: 'M60 10 Q63 32 60 54', class: 'ch3-shapeicon__front' }), arrow(78, 32, 66, 32));
  } else if (kind === 'cross') {
    svg.append(
      s('ellipse', { cx: 104, cy: 32, rx: 14, ry: 6, class: 'ch3-shapeicon__shoal' }),
      s('path', { d: 'M46 10 L74 54', class: 'ch3-shapeicon__front' }),
      s('path', { d: 'M46 54 L74 10', class: 'ch3-shapeicon__front' }),
      arrow(82, 20, 70, 26),
      arrow(82, 44, 70, 38),
    );
  } else {
    svg.append(
      s('path', { d: 'M40 8 L48 40', class: 'ch3-shapeicon__dike' }),
      s('path', { d: 'M30 30 Q36 44 32 54', class: 'ch3-shapeicon__front ch3-shapeicon__front--faint' }),
      s('path', { d: 'M58 14 L80 40', class: 'ch3-shapeicon__front' }),
      arrow(66, 30, 82, 22),
    );
  }
  return svg;
}
