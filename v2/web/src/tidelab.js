/**
 * Tide lab: why the Qiantang bore is so big, as three things you can change.
 *  ① the moon: drag it round the earth. Sun and moon pulling in line give spring tides; the
 *     water answers two or three days late, which is why the great tide comes on the 18th
 *     of the lunar month, not the 15th. The eighth lunar month adds a little more.
 *  ② the funnel: the tide runs up Hangzhou Bay, 100 km wide at the mouth, about 3 km at
 *     Yanguan; squeezed sideways it grows taller (Green's law: height ∝ 1/√width).
 *  ③ the sandbar: shallow water slows the front, the water behind catches up and the swell
 *     stands up into a wall (a bore) instead of a gentle rise.
 * The numbers are an illustration in the right proportions, not a forecast.
 */
import { gsap } from 'gsap';

const SVGNS = 'http://www.w3.org/2000/svg';
const SYNODIC = 29.530588853;
const LAG = 2.5; // days between the moon lining up and the biggest tide
// the river from the sea (s = 0) to the pagoda (s = 1): map point, drawn width, real width in km
const RIVER = [
  [590, 155, 230, 100],
  [500, 151, 160, 60],
  [420, 150, 70, 20],
  [350, 150, 34, 8],
  [300, 150, 20, 3],
  [240, 147, 14, 1.6],
  [180, 139, 12, 1.3],
  [120, 124, 11, 1.1],
  [64, 110, 10, 1],
  [34, 104, 10, 1],
];
const S_YANGUAN = 4 / (RIVER.length - 1);

function along(s) {
  const f = Math.max(0, Math.min(1, s)) * (RIVER.length - 1);
  const i = Math.min(RIVER.length - 2, Math.floor(f));
  const k = f - i;
  return RIVER[i].map((v, j) => v + (RIVER[i + 1][j] - v) * k);
}

/** today's lunar day, near enough: days since a known new moon */
function lunarToday() {
  const ref = Date.UTC(2000, 0, 6, 18, 14);
  const age = (((Date.now() - ref) / 86400000) % SYNODIC + SYNODIC) % SYNODIC;
  return Math.floor(age) + 1;
}

const LUNAR = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

export function createTideLab($, { onBiggest } = {}) {
  const st = { day: 3, eighth: false, sand: true, s: -1, running: false };
  const svg = (tag, attrs = {}) => {
    const e = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };

  /* ── ① the moon ── */
  const moonSvg = svg('svg', { viewBox: '-160 -150 320 300', class: 'lab__moon', role: 'img', 'aria-label': '月亮绕地球 The moon around the earth' });
  const sunG = svg('g');
  for (let k = -2; k <= 2; k++) sunG.append(svg('line', { x1: -158, y1: k * 26, x2: -128, y2: k * 26, class: 'lab__ray' }));
  const sunT = svg('text', { x: -156, y: -64, class: 'lab__lbl' });
  sunT.textContent = '太阳 Sun →';
  sunG.append(sunT);
  const orbit = svg('circle', { r: 108, class: 'lab__orbit' });
  const bulge = svg('ellipse', { rx: 50, ry: 36, class: 'lab__bulge' });
  const earth = svg('circle', { r: 24, class: 'lab__earth' });
  const moonG = svg('g', { class: 'lab__moonG', tabindex: '0', role: 'slider', 'aria-label': '月亮的位置 Moon position' });
  const moonDark = svg('circle', { r: 13, class: 'lab__moonDark' });
  const moonLit = svg('path', { d: 'M0,-13 A13,13 0 0 0 0,13 Z', class: 'lab__moonLit' }); // the half facing the sun
  const grip = svg('circle', { r: 26, class: 'lab__grip' });
  moonG.append(grip, moonDark, moonLit);
  const marks = [
    [Math.PI, '初一 新月'],
    [0, '十五 满月'],
  ].map(([a, t]) => {
    const e = svg('text', { x: Math.cos(a) * 132, y: Math.sin(a) * 132 + 4, class: 'lab__mark', 'text-anchor': 'middle' });
    e.textContent = t;
    return e;
  });
  moonSvg.append(sunG, orbit, bulge, earth, ...marks, moonG);
  const dayOut = $('b', { class: 'lab__day' });
  const springOut = $('span', { class: 'lab__spring' });
  const eighth = $('input', { type: 'checkbox' });
  eighth.addEventListener('change', () => {
    st.eighth = eighth.checked;
    paint();
  });
  const todayBtn = $('button', { type: 'button', class: 'btn btn--line btn--small' }, '今天 ', $('i', {}, 'Today'));
  todayBtn.addEventListener('click', () => setDay(lunarToday()));

  /* ── ② the funnel ── */
  const map = svg('svg', { viewBox: '0 0 600 300', class: 'lab__map', role: 'img', 'aria-label': '杭州湾地图 Map of Hangzhou Bay' });
  const shore = (sign) =>
    RIVER.map((p, i) => {
      const a = RIVER[Math.max(0, i - 1)];
      const b = RIVER[Math.min(RIVER.length - 1, i + 1)];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const L = Math.hypot(dx, dy);
      return [p[0] + (sign * -dy / L) * p[2] / 2, p[1] + (sign * dx / L) * p[2] / 2];
    });
  const north = shore(1);
  const south = shore(-1);
  const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  map.append(svg('rect', { x: 0, y: 0, width: 600, height: 300, class: 'lab__land' }));
  map.append(svg('path', { d: `${path(north)}${path(south.slice().reverse()).replace('M', 'L')}Z`, class: 'lab__water' }));
  const sandbar = svg('path', { d: `M236,138 C280,128 380,126 430,120 L430,182 C380,176 280,172 236,160 Z`, class: 'lab__sand' });
  map.append(sandbar);
  map.append(svg('path', { d: path(north), class: 'lab__shore' }), svg('path', { d: path(south), class: 'lab__shore' }));
  const label = (x, y, zh, en, cls = '') => {
    const t = svg('text', { x, y, class: `lab__place ${cls}` });
    t.textContent = zh;
    const e = svg('tspan', { x, dy: 13, class: 'lab__placeEn' });
    e.textContent = en;
    t.append(e);
    map.append(t);
  };
  label(520, 26, '南汇嘴', 'Nanhui');
  label(520, 280, '镇海', 'Zhenhai');
  label(405, 98, '澉浦', 'Ganpu');
  label(285, 124, '盐官', 'Yanguan');
  label(14, 74, '六和塔', 'Liuhe Pagoda', 'is-pagoda');
  label(470, 160, '杭州湾', 'Hangzhou Bay', 'is-water');
  label(320, 214, '沙坎', 'sandbar', 'is-sand');
  map.append(svg('path', { d: 'M596,40 L596,270', class: 'lab__dim' }));
  const dim = svg('text', { x: 586, y: 160, class: 'lab__dimT', transform: 'rotate(-90 586 160)', 'text-anchor': 'middle' });
  dim.textContent = '约 100 km';
  const dim2 = svg('text', { x: 300, y: 180, class: 'lab__dimT', 'text-anchor': 'middle' });
  dim2.textContent = '约 3 km';
  map.append(dim, dim2);
  // the pagoda, a tiny glyph at the end of the river
  map.append(svg('path', { d: 'M38,98 l4,-14 l4,14 z M36,98 h12 v3 h-12z', class: 'lab__pagoda' }));
  const front = svg('line', { class: 'lab__front' });
  const wake = svg('path', { class: 'lab__wake' });
  map.append(wake, front);
  const sand = $('input', { type: 'checkbox', checked: true });
  sand.addEventListener('change', () => {
    st.sand = sand.checked;
    paint();
  });

  /* ── the side view ── */
  const cv = $('canvas', { class: 'lab__profile', 'aria-hidden': 'true' });
  const read = $('p', { class: 'lab__read', 'aria-live': 'polite' });
  const go = $('button', { type: 'button', class: 'btn' }, '▶ 放潮 ', $('i', {}, 'Release the tide'));
  go.addEventListener('click', run);

  const el = $('div', { class: 'widget lab' },
    $('div', { class: 'lab__panels' },
      $('div', { class: 'lab__panel' },
        $('p', { class: 'lab__step' }, $('b', {}, '①'), ' 拖动月亮 ', $('i', { lang: 'en' }, 'Drag the moon')),
        moonSvg,
        $('p', { class: 'lab__dayline' }, '农历 ', dayOut, ' ', springOut),
        $('div', { class: 'lab__row' },
          $('label', { class: 'lab__check' }, eighth, $('span', {}, '农历八月（秋分前后）', $('i', { lang: 'en' }, ' 8th lunar month'))),
          todayBtn,
        ),
      ),
      $('div', { class: 'lab__panel lab__panel--map' },
        $('p', { class: 'lab__step' }, $('b', {}, '②'), ' 喇叭口 ', $('i', { lang: 'en' }, 'The funnel'), '　', $('b', {}, '③'), ' ', $('label', { class: 'lab__check lab__check--inline' }, sand, $('span', {}, '江底沙坎 ', $('i', { lang: 'en' }, 'Sandbar')))),
        map,
        cv,
        $('div', { class: 'lab__row' }, go, read),
      ),
    ),
  );

  /* ── the physics, in proportion ── */
  const T = () => {
    const th = (2 * Math.PI * (st.day - 1 - LAG)) / SYNODIC;
    return 0.45 + 0.55 * Math.abs(Math.cos(th));
  };
  const height = (s) => {
    const [, , , w] = along(s);
    const decay = s > S_YANGUAN ? Math.exp(-(s - S_YANGUAN) * 1.6) : 1;
    return 0.42 * T() * (st.eighth ? 1.15 : 1) * Math.sqrt(100 / w) * (st.sand ? 1.15 : 0.72) * decay;
  };
  const peak = () => height(S_YANGUAN);

  function setDay(d) {
    st.day = ((Math.round(d) - 1 + 30) % 30) + 1;
    paint();
  }
  function paint() {
    const a = Math.PI + (2 * Math.PI * (st.day - 1)) / SYNODIC;
    moonG.setAttribute('transform', `translate(${(Math.cos(a) * 108).toFixed(1)},${(Math.sin(a) * 108).toFixed(1)})`);
    moonG.setAttribute('aria-valuenow', st.day);
    moonG.setAttribute('aria-valuetext', LUNAR[st.day - 1]);
    const t = T();
    // the water heaps up towards the moon (and away from it); the sun pulls it round again
    bulge.setAttribute('rx', (32 + 30 * t).toFixed(1));
    bulge.setAttribute('ry', (34 - 6 * t).toFixed(1));
    bulge.setAttribute('transform', `rotate(${((a * 180) / Math.PI).toFixed(1)})`);
    dayOut.textContent = LUNAR[st.day - 1];
    springOut.textContent = t > 0.86 ? '大潮 Spring tide' : t < 0.6 ? '小潮 Neap tide' : '中潮 Middling tide';
    springOut.className = `lab__spring ${t > 0.86 ? 'is-big' : t < 0.6 ? 'is-small' : ''}`;
    sandbar.style.opacity = st.sand ? 1 : 0;
    if (!st.running) {
      read.replaceChildren($('span', {}, `按现在的设置，盐官潮高约 ${peak().toFixed(1)} 米`), $('br'), $('i', { lang: 'en' }, `With these settings: about ${peak().toFixed(1)} m at Yanguan`));
    }
    drawFront();
  }

  // drag the moon round
  let dragging = false;
  const toDay = (e) => {
    const r = moonSvg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 320 - 160;
    const y = ((e.clientY - r.top) / r.height) * 300 - 150;
    let a = Math.atan2(y, x) - Math.PI;
    a = ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    setDay(1 + (a / (2 * Math.PI)) * SYNODIC);
  };
  moonSvg.addEventListener('pointerdown', (e) => {
    dragging = true;
    moonSvg.setPointerCapture(e.pointerId);
    toDay(e);
  });
  moonSvg.addEventListener('pointermove', (e) => dragging && toDay(e));
  moonSvg.addEventListener('pointerup', () => (dragging = false));
  moonG.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setDay(st.day + 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setDay(st.day - 1);
  });

  function drawFront() {
    if (st.s < 0 || st.s > 1) {
      front.setAttribute('opacity', 0);
      wake.setAttribute('opacity', 0);
      return;
    }
    const s = st.s;
    const [x, y, w] = along(s);
    const [x2, y2] = along(Math.min(1, s + 0.01));
    const dx = x2 - x;
    const dy = y2 - y;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L;
    const ny = dx / L;
    front.setAttribute('x1', x + (nx * w) / 2);
    front.setAttribute('y1', y + (ny * w) / 2);
    front.setAttribute('x2', x - (nx * w) / 2);
    front.setAttribute('y2', y - (ny * w) / 2);
    front.setAttribute('stroke-width', (2 + height(s) * 2.2).toFixed(1));
    front.setAttribute('opacity', 1);
    // the raised water behind the front, back towards the sea
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const ss = Math.max(0, s - k * 0.012);
      const [px, py, pw] = along(ss);
      pts.push([px, py, pw]);
    }
    const top = pts.map(([px, py, pw]) => `${px},${py - pw / 2}`);
    const bot = pts.map(([px, py, pw]) => `${px},${py + pw / 2}`).reverse();
    wake.setAttribute('d', `M${top.join('L')}L${bot.join('L')}Z`);
    wake.setAttribute('opacity', 0.9);
  }

  /* ── the side view: river surface from the pagoda (left) to the sea (right) ── */
  let raf = 0;
  let t0 = 0;
  function draw(now) {
    raf = requestAnimationFrame(draw);
    const t = now / 1000;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    if (!W) return;
    if (cv.width !== Math.round(W * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const night = document.body.classList.contains('is-night');
    const ink = night ? '#e7dfd2' : '#1b1712';
    const base = H * 0.62;
    const mPx = H * 0.11; // pixels per metre
    const X = (s) => W - s * W; // the sea on the right, as on the map
    // riverbed, with the sandbar
    g.beginPath();
    g.moveTo(0, H);
    for (let i = 0; i <= 60; i++) {
      const s = i / 60;
      const bar = st.sand ? Math.exp(-Math.pow((s - 0.36) / 0.1, 2)) * 0.22 : 0;
      g.lineTo(X(s), H - H * (0.1 + bar));
    }
    g.lineTo(W, H);
    g.closePath();
    g.fillStyle = night ? 'rgba(200,170,120,0.18)' : 'rgba(167,128,58,0.22)';
    g.fill();
    // the water
    g.beginPath();
    const fs = st.s;
    for (let i = 0; i <= 240; i++) {
      const s = i / 240;
      let y = base + Math.sin(s * 40 + t * 2) * 1.2;
      if (fs >= 0 && s < fs) {
        // behind the front (seaward): raised water, rolling
        const h = height(s) * Math.exp(-(fs - s) * 4) + height(fs) * 0.35 * Math.min(1, (fs - s) * 8);
        y -= h * mPx * (st.sand ? 1 : Math.min(1, (fs - s) * 22));
      }
      g.lineTo(X(s), y);
    }
    g.lineTo(0, H);
    g.lineTo(W, H);
    g.closePath();
    g.fillStyle = night ? 'rgba(160,190,210,0.22)' : 'rgba(46,80,100,0.18)';
    g.fill();
    g.strokeStyle = ink;
    g.lineWidth = 1.2;
    g.stroke();
    // the front itself: a white lip of foam on a wall, or a gentle hump
    if (fs >= 0 && fs <= 1) {
      const x = X(fs);
      const h = height(fs) * mPx;
      g.fillStyle = night ? '#fbf6ee' : '#ffffff';
      g.strokeStyle = ink;
      if (st.sand) {
        g.beginPath();
        g.moveTo(x - 2, base);
        g.lineTo(x - 2, base - h);
        g.quadraticCurveTo(x - 10, base - h - 8, x - 16, base - h + 2);
        g.quadraticCurveTo(x - 6, base - h + 4, x + 6, base - h - 2);
        g.closePath();
        g.fill();
        g.stroke();
        for (let k = 0; k < 6; k++) g.fillRect(x - 14 + Math.random() * 20, base - h - 6 - Math.random() * 14, 2, 2);
      }
      g.fillStyle = ink;
      g.font = '600 13px "Noto Serif SC", serif';
      g.textAlign = 'center';
      g.fillText(`${height(fs).toFixed(1)} m`, x, base - h - 20);
    }
    // places along the river
    g.font = '12px "Noto Serif SC", serif';
    g.fillStyle = night ? 'rgba(231,223,210,0.7)' : 'rgba(27,23,18,0.6)';
    g.textAlign = 'center';
    for (const [s, n] of [[0.02, '杭州湾口'], [2 / 9, '澉浦'], [S_YANGUAN, '盐官'], [0.97, '六和塔']]) {
      g.fillText(n, X(s), H - 6);
      g.fillRect(X(s) - 0.5, H - 22, 1, 6);
    }
    if (st.running) {
      const k = Math.min(1, (now - t0) / 7000);
      st.s = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      drawFront();
      if (k >= 1) finish();
    }
  }

  function run() {
    if (st.running) return;
    st.running = true;
    st.s = 0;
    t0 = performance.now();
    go.disabled = true;
    read.replaceChildren($('span', {}, '潮水从杭州湾口涌进来了……'), $('br'), $('i', { lang: 'en' }, 'The tide pours in at the mouth of the bay…'));
  }
  function finish() {
    st.running = false;
    go.disabled = false;
    const p = peak();
    const big = T() > 0.95 && st.eighth && st.sand;
    const tips = [];
    if (T() <= 0.95) tips.push(['把月亮拖到农历初三或十八前后（潮比月相晚两三天）', 'move the moon to about the 3rd or 18th day (the tide lags the moon by two or three days)']);
    if (!st.eighth) tips.push(['勾上“农历八月”', 'tick “8th lunar month”']);
    if (!st.sand) tips.push(['打开江底沙坎', 'switch the sandbar on']);
    read.replaceChildren(
      $('span', {}, `潮头经过盐官时约 ${p.toFixed(1)} 米，到六和塔下还有约 ${height(0.97).toFixed(1)} 米。`),
      $('br'),
      $('i', { lang: 'en' }, `About ${p.toFixed(1)} m passing Yanguan, still about ${height(0.97).toFixed(1)} m below the pagoda.`),
      $('br'),
      big
        ? $('b', { class: 'lab__win' }, '这就是八月十八的大潮：日月合力、喇叭口、沙坎，三样叠在一起。', $('i', { lang: 'en' }, ' The great tide of the 18th: moon and sun, the funnel and the sandbar, all at once.'))
        : $('small', {}, `想要更大的潮？试试：${tips.map((x) => x[0]).join('；')}。`, $('i', { lang: 'en' }, ` For a bigger one: ${tips.map((x) => x[1]).join('; ')}.`)),
    );
    if (big) {
      gsap.fromTo(read, { scale: 1.04 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      onBiggest && onBiggest();
    }
  }

  paint();
  return {
    el,
    start() {
      if (!raf) raf = requestAnimationFrame(draw);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
