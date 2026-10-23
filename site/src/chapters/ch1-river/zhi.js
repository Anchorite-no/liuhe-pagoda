/**
 * The character 之, drawn for this site as three brush strokes.
 * Each stroke is a filled outline revealed by an animated mask that follows the brush path,
 * so it "writes" itself in stroke order: 点 (dot), 横撇 (turning stroke), 平捺 (long sweep).
 */
import { reducedMotion } from '../../core/ui.js';

const NS = 'http://www.w3.org/2000/svg';

// [outline (filled), brush path (mask), mask width]
const STROKES = [
  [
    'M95 17 C104 15 117 26 121 38 C124 47 118 55 109 52 C101 49 97 38 94 29 C92 23 92 18 95 17 Z',
    'M96 20 C102 30 108 40 114 48',
    26,
  ],
  [
    'M44 79 C70 77 108 71 137 64 C146 62 154 67 151 76 C134 100 102 125 66 146 C58 151 51 147 55 140 C82 120 110 99 126 83 C100 86 75 90 51 92 C42 93 37 82 44 79 Z',
    'M46 85 C80 81 110 76 142 70 C118 98 92 120 60 142',
    24,
  ],
  [
    'M51 126 C60 121 67 130 64 141 C61 153 72 161 94 163 C123 165 151 161 173 155 C184 152 192 159 185 169 C178 177 161 179 140 179 C110 180 80 178 62 170 C43 162 39 139 51 126 Z',
    'M55 130 C57 150 66 166 100 170 C132 173 160 166 188 162',
    28,
  ],
];

function el(tag, attrs) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

let uid = 0;

/** Returns { svg, play(), show() } */
export function createZhi({ label }) {
  const id = `ch1-zhi-${++uid}`;
  const svg = el('svg', { viewBox: '0 0 220 200', class: 'ch1-zhi__svg', role: 'img', 'aria-label': label || '之' });
  const defs = el('defs', {});
  svg.append(defs);
  // faint practice grid (米字格), as in a copybook
  const grid = el('g', { class: 'ch1-zhi__grid', 'aria-hidden': 'true' });
  grid.append(
    el('rect', { x: 14, y: 4, width: 192, height: 192, fill: 'none' }),
    el('line', { x1: 110, y1: 4, x2: 110, y2: 196 }),
    el('line', { x1: 14, y1: 100, x2: 206, y2: 100 }),
    el('line', { x1: 14, y1: 4, x2: 206, y2: 196 }),
    el('line', { x1: 206, y1: 4, x2: 14, y2: 196 }),
  );
  svg.append(grid);

  const brushes = [];
  STROKES.forEach(([outline, brush, width], i) => {
    const maskId = `${id}-m${i}`;
    const mask = el('mask', { id: maskId, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 220, height: 200 });
    const bp = el('path', {
      d: brush,
      fill: 'none',
      stroke: '#fff',
      'stroke-width': width,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });
    mask.append(bp);
    defs.append(mask);
    svg.append(el('path', { d: outline, class: 'ch1-zhi__ink', mask: `url(#${maskId})` }));
    brushes.push(bp);
  });

  // small red seal in the corner
  const seal = el('g', { class: 'ch1-zhi__seal', 'aria-hidden': 'true' });
  seal.append(el('rect', { x: 176, y: 150, width: 26, height: 26, rx: 2 }));
  const sealText = el('text', { x: 189, y: 169, 'text-anchor': 'middle' });
  sealText.textContent = '江';
  seal.append(sealText);
  svg.append(seal);

  const lengths = brushes.map((b) => {
    try {
      return b.getTotalLength() || 200;
    } catch (_) {
      return 200;
    }
  });

  function setProgress(i, k) {
    const L = lengths[i] + 4;
    brushes[i].setAttribute('stroke-dasharray', `${L} ${L}`);
    brushes[i].setAttribute('stroke-dashoffset', String(L * (1 - k)));
  }

  let raf = 0;
  function show() {
    cancelAnimationFrame(raf);
    brushes.forEach((_, i) => setProgress(i, 1));
    seal.style.opacity = '1';
  }

  function play() {
    cancelAnimationFrame(raf);
    if (reducedMotion()) return show();
    // recompute lengths once the svg is in the document
    brushes.forEach((b, i) => {
      try {
        lengths[i] = b.getTotalLength() || lengths[i];
      } catch (_) {
        /* not rendered yet */
      }
      setProgress(i, 0);
    });
    seal.style.opacity = '0';
    const durations = [380, 900, 1000];
    const gaps = [180, 220, 0];
    const t0 = performance.now();
    const step = (now) => {
      let t = now - t0;
      let done = true;
      for (let i = 0; i < 3; i++) {
        const d = durations[i];
        if (t <= 0) {
          setProgress(i, 0);
          done = false;
        } else if (t < d) {
          const k = t / d;
          setProgress(i, 1 - (1 - k) * (1 - k));
          done = false;
        } else {
          setProgress(i, 1);
        }
        t -= d + gaps[i];
      }
      if (done) {
        seal.style.opacity = '1';
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  // start hidden
  brushes.forEach((_, i) => setProgress(i, 0));
  seal.style.opacity = '0';
  return { svg, play, show };
}
