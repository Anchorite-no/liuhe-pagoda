/**
 * An ink-wash night river, drawn on a 2D canvas: Yuelun Hill and the pagoda on the left,
 * a full moon, distant hills in mist, and water drawn as fine brush lines (after the
 * line-water studies of Southern Song painting). draw(p) advances the tide: p = 0 calm,
 * then the bore appears on the horizon as a single line, comes toward the viewer and
 * passes out of the frame, leaving churned water behind.
 *
 *   const ink = createInkTide(canvas);
 *   ink.draw(0.4);
 *   ink.dispose();
 *
 * Everything is procedural and deterministic, so redrawing for scroll never flickers.
 */

const INK = '29, 35, 38'; // rgb of the ink
const PAPER = '#e8e6dc';
const PAPER_LIGHT = '#f3f2ec';

function rng(seed) {
  let s = (seed >>> 0) % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function makeNoise(seed) {
  const r = rng(seed);
  const vals = Array.from({ length: 256 }, r);
  const n = (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const t = f * f * (3 - 2 * f);
    const a = vals[i & 255];
    const b = vals[(i + 1) & 255];
    return a + (b - a) * t;
  };
  return (x, oct = 4) => {
    let s = 0;
    let amp = 0.5;
    let fr = 1;
    let norm = 0;
    for (let k = 0; k < oct; k++) {
      s += amp * n(x * fr + k * 17.3);
      norm += amp;
      fr *= 2.1;
      amp *= 0.5;
    }
    return s / norm; // 0..1
  };
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const ink = (a) => `rgba(${INK}, ${a})`;

export function createInkTide(canvas) {
  const ctx = canvas.getContext('2d');
  const back = document.createElement('canvas');
  const front = document.createElement('canvas');
  let W = 1;
  let H = 1;
  let dpr = 1;
  let L = null; // layout
  let lastP = 0;

  function layout() {
    const horizon = H * 0.55;
    L = {
      horizon,
      moon: { x: W * 0.76, y: H * 0.16, r: Math.min(W, H) * 0.055 },
      hillEnd: W * 0.6,
      hillFoot: horizon + H * 0.05,
      pagodaX: W * 0.25,
    };
    // pagoda height: as tall as the frame allows, keeping the finial clear of the top edge
    L.s = Math.min(H * 0.5, W * 0.56, hillY(L.pagodaX) - H * 0.06);
    return L;
  }

  const hillNoise = makeNoise(11);
  function hillY(x) {
    const n = hillNoise;
    const k = 1 - smooth(0, L.hillEnd, x);
    return L.hillFoot - H * 0.34 * Math.pow(k, 0.9) - H * 0.035 * (n(x * 0.012) - 0.5) * k;
  }

  /* ── Static back layer: paper, sky, moon, far hills ── */
  function drawBack() {
    back.width = W;
    back.height = H;
    const c = back.getContext('2d');
    c.fillStyle = PAPER;
    c.fillRect(0, 0, W, H);
    // paper fibre speckle
    const r = rng(3);
    for (let i = 0; i < (W * H) / 900; i++) {
      c.fillStyle = ink(0.02 + r() * 0.03);
      c.fillRect(r() * W, r() * H, dpr * (0.6 + r()), dpr * (0.6 + r() * 2));
    }
    // night sky wash, left open around the moon
    const { moon } = L;
    const g = c.createRadialGradient(moon.x, moon.y, moon.r * 1.05, moon.x, moon.y, Math.max(W, H));
    g.addColorStop(0, ink(0));
    g.addColorStop(0.12, ink(0.06));
    g.addColorStop(0.6, ink(0.1));
    g.addColorStop(1, ink(0.07));
    c.fillStyle = g;
    c.fillRect(0, 0, W, L.horizon + H * 0.02);
    c.fillStyle = PAPER_LIGHT;
    c.beginPath();
    c.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = ink(0.12);
    c.lineWidth = dpr;
    c.stroke();

    // far hills, two washes, misty at the foot
    const ridge = (seed, base, lift, freq, x0) => {
      const n = makeNoise(seed);
      const pts = [];
      for (let x = x0; x <= W + 8; x += 6 * dpr) pts.push([x, base - H * lift * (0.35 + 0.65 * n((x / W) * freq))]);
      return pts;
    };
    const wash = (pts, base, aTop) => {
      for (let pass = 0; pass < 3; pass++) {
        const off = pass * 1.6 * dpr;
        c.beginPath();
        c.moveTo(pts[0][0], base);
        for (const [x, y] of pts) c.lineTo(x, y + off);
        c.lineTo(W + 8, base);
        c.closePath();
        const top = Math.min(...pts.map((p) => p[1]));
        const gr = c.createLinearGradient(0, top, 0, base);
        gr.addColorStop(0, ink(aTop / 3));
        gr.addColorStop(1, ink(0));
        c.fillStyle = gr;
        c.fill();
      }
    };
    wash(ridge(21, L.horizon, 0.2, 3.2, -8), L.horizon, 0.2);
    wash(ridge(37, L.horizon + H * 0.01, 0.1, 5, W * 0.35), L.horizon + H * 0.01, 0.3);
  }

  /* ── Static front layer: Yuelun Hill, trees, the pagoda ── */
  function drawFront() {
    front.width = W;
    front.height = H;
    const c = front.getContext('2d');
    c.clearRect(0, 0, W, H);
    const r = rng(9);
    // hill body
    const bottom = L.hillFoot + H * 0.03;
    c.beginPath();
    c.moveTo(-4, bottom);
    for (let x = -4; x <= L.hillEnd + 4; x += 4 * dpr) c.lineTo(x, hillY(x));
    c.lineTo(L.hillEnd + 4, bottom);
    c.closePath();
    const g = c.createLinearGradient(0, L.hillFoot - H * 0.34, 0, bottom);
    g.addColorStop(0, ink(0.5));
    g.addColorStop(0.65, ink(0.22));
    g.addColorStop(1, ink(0));
    c.fillStyle = g;
    c.fill();
    // texture strokes (cun) following the slope
    c.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
      const x = r() * L.hillEnd * 0.95;
      const top = hillY(x);
      const y = top + 3 * dpr + r() * (L.hillFoot - top) * 0.75;
      const len = (5 + r() * 14) * dpr;
      const slope = (hillY(x + 6) - hillY(x - 6)) / 12;
      c.strokeStyle = ink(0.08 + r() * 0.16);
      c.lineWidth = (0.6 + r() * 1.4) * dpr;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + len, y + len * slope + (r() - 0.5) * 3 * dpr);
      c.stroke();
    }
    // moss dots and small trees along the ridge
    for (let i = 0; i < 60; i++) {
      const x = r() * L.hillEnd * 0.62;
      if (Math.abs(x - L.pagodaX) < L.s * 0.2) continue;
      const y = hillY(x) + r() * 6 * dpr;
      c.fillStyle = ink(0.35 + r() * 0.35);
      const rr = (1 + r() * 2.6) * dpr;
      c.beginPath();
      c.ellipse(x, y, rr * 1.3, rr, 0, 0, Math.PI * 2);
      c.fill();
    }
    drawPagoda(c);
  }

  function drawPagoda(c) {
    const { s, pagodaX: cx } = L;
    const ground = hillY(cx) + 2 * dpr;
    const baseH = s * 0.035;
    const finialH = s * 0.13;
    const tiersH = s - baseH - finialH;
    const N = 13;
    const weights = Array.from({ length: N }, (_, i) => 1 - i * 0.022);
    const wSum = weights.reduce((a, b) => a + b, 0);
    // plinth
    c.fillStyle = ink(0.55);
    c.fillRect(cx - s * 0.19, ground - baseH, s * 0.38, baseH);
    let y = ground - baseH;
    for (let i = 0; i < N; i++) {
      const th = (tiersH * weights[i]) / wSum;
      const wBody = s * 0.29 * (1 - i * 0.034);
      const wEave = wBody * 1.5;
      const top = y - th;
      // wall
      c.fillStyle = ink(0.24);
      c.fillRect(cx - wBody / 2, top + th * 0.18, wBody, th * 0.82);
      if (i % 2 === 0) {
        c.fillStyle = ink(0.62);
        c.fillRect(cx - wBody * 0.07, y - th * 0.5, wBody * 0.14, th * 0.36);
      }
      // eave: a sweeping band with upturned tips
      const et = th * 0.16;
      const ey = top + th * 0.2;
      c.beginPath();
      c.moveTo(cx - wEave / 2, ey - th * 0.16);
      c.quadraticCurveTo(cx - wEave * 0.36, ey + et * 0.6, cx - wBody * 0.4, ey + et * 0.4);
      c.lineTo(cx + wBody * 0.4, ey + et * 0.4);
      c.quadraticCurveTo(cx + wEave * 0.36, ey + et * 0.6, cx + wEave / 2, ey - th * 0.16);
      c.quadraticCurveTo(cx + wEave * 0.3, ey - et * 0.5, cx, ey - et * 0.9);
      c.quadraticCurveTo(cx - wEave * 0.3, ey - et * 0.5, cx - wEave / 2, ey - th * 0.16);
      c.closePath();
      c.fillStyle = ink(0.8);
      c.fill();
      y = top;
    }
    // finial
    c.strokeStyle = ink(0.8);
    c.lineWidth = Math.max(1, s * 0.008);
    c.beginPath();
    c.moveTo(cx, y);
    c.lineTo(cx, y - finialH);
    c.stroke();
    c.fillStyle = ink(0.8);
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.ellipse(cx, y - finialH * (0.2 + k * 0.17), s * (0.022 - k * 0.003), s * 0.008, 0, 0, Math.PI * 2);
      c.fill();
    }
    // low mist across the foot of the hill and the pagoda base
    const mg = c.createLinearGradient(0, ground - s * 0.05, 0, ground + s * 0.08);
    mg.addColorStop(0, 'rgba(232, 230, 220, 0)');
    mg.addColorStop(0.55, 'rgba(232, 230, 220, 0.45)');
    mg.addColorStop(1, 'rgba(232, 230, 220, 0)');
    c.fillStyle = mg;
    c.fillRect(0, ground - s * 0.05, L.hillEnd + 10, s * 0.13);
  }

  /* ── Water and tide, redrawn for each p ──
   * We look down the river toward the bay, so the bore is the famous "single line" (一线潮):
   * it appears on the horizon, comes toward us growing taller, and passes out of the frame,
   * leaving churned water behind it. */
  const crestNoise = makeNoise(5);
  // Keyframes tie the bore to the story: it appears as the thunder wakes Lu Zhishen,
  // is close when he sits down, and has passed by the time Wu Song's story is told.
  const KEYS = [
    [0.12, 0],
    [0.3, 0.16],
    [0.5, 0.38],
    [0.68, 0.62],
    [0.84, 0.95],
    [0.97, 1.3],
  ];
  function boreDepth(p) {
    if (p <= KEYS[0][0]) return 0;
    for (let i = 1; i < KEYS.length; i++) {
      const [p1, t1] = KEYS[i];
      const [p0, t0] = KEYS[i - 1];
      if (p <= p1) return t0 + (t1 - t0) * smooth(p0, p1, p) * 0.5 + (t1 - t0) * ((p - p0) / (p1 - p0)) * 0.5;
    }
    return KEYS[KEYS.length - 1][1];
  }
  function drawWater(p) {
    const { horizon, moon } = L;
    const N = Math.max(18, Math.min(42, Math.round(H / (13 * dpr))));
    const depthY = (t) => horizon + (H * 1.03 - horizon) * Math.pow(Math.max(0, t), 1.65);
    const tb = boreDepth(p); // 0 on the horizon … >1 past the viewer
    const strength = smooth(0.08, 0.2, p);
    const yb = depthY(tb);
    const crestH = (H * 0.006 + H * 0.06 * Math.pow(Math.min(tb, 1.25), 1.3)) * strength;
    // the front bows toward us in the deep channel and runs slightly oblique
    const front = (x) => yb + Math.sin((Math.PI * x) / W) * crestH * 0.9 + (x / W - 0.5) * crestH * 0.8;
    const height = (x) => crestH * (0.7 + 0.6 * crestNoise((x / W) * 7));
    const visible = strength > 0 && yb - crestH * 2 < H;

    // churned water behind (above) the front: a grey wash, darkest just behind the crest
    if (visible) {
      const bottom = Math.min(H, yb);
      const g = ctx.createLinearGradient(0, horizon, 0, bottom);
      g.addColorStop(0, ink(0.04 * strength));
      g.addColorStop(1, ink(0.14 * strength));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(W, horizon);
      for (let x = W; x >= 0; x -= 8 * dpr) ctx.lineTo(x, front(x) - height(x) * 0.5);
      ctx.closePath();
      ctx.fill();
    } else if (strength > 0) {
      ctx.fillStyle = ink(0.08 * strength);
      ctx.fillRect(0, horizon, W, H - horizon);
    }

    // brush lines, broken irregularly and opened under the moon; rougher once the bore has passed
    ctx.lineCap = 'round';
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const y0 = depthY(t);
      const r = rng(100 + i);
      const amp = (0.5 + 3 * t) * dpr;
      const freq = 0.018 / (0.35 + t) / dpr;
      ctx.strokeStyle = ink(0.12 + 0.26 * t);
      ctx.lineWidth = (0.5 + 1.1 * t) * dpr;
      const gapHalf = moon.r * (0.35 + t * 1.6);
      let x = -r() * 60 * dpr;
      ctx.beginPath();
      while (x < W) {
        const seg = (40 + r() * 180) * dpr * (0.6 + t);
        const gap = (6 + r() * 26) * dpr;
        const x1 = Math.min(W, x + seg);
        let pen = false;
        for (let xx = Math.max(0, x); xx <= x1; xx += 4 * dpr) {
          if (Math.abs(xx - moon.x) < gapHalf * (0.6 + 0.4 * Math.sin(i * 2.3 + xx * 0.01))) {
            pen = false;
            continue;
          }
          const passed = strength > 0 && y0 < front(xx) - height(xx) * 0.5;
          const k = passed ? 1.9 : 1;
          let yy = y0 + Math.sin(xx * freq + i * 1.7) * amp * k;
          if (passed) yy += Math.sin(xx * freq * 2.9 + i) * amp * 0.7;
          if (!pen) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
          pen = true;
          if (passed && r() < 0.08) pen = false; // choppy water breaks into short strokes
        }
        x = x1 + gap;
      }
      ctx.stroke();
    }

    if (!visible) return;
    // the front: paper-white foam crowned with uneven scalloped crests and a crisp lower edge
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.moveTo(0, front(0) + 2 * dpr);
    for (let x = 0; x <= W; x += 5 * dpr) ctx.lineTo(x, front(x) - height(x));
    ctx.lineTo(W, front(W) + 2 * dpr);
    for (let x = W; x >= 0; x -= 10 * dpr) ctx.lineTo(x, front(x) + 2 * dpr);
    ctx.closePath();
    ctx.fill();
    const rows = 3;
    for (let k = 0; k < rows; k++) {
      const r = rng(50 + k);
      ctx.strokeStyle = ink((0.62 - k * 0.17) * strength);
      ctx.lineWidth = Math.max(0.7, (1.5 - k * 0.35) * dpr * (0.7 + tb * 0.5));
      ctx.beginPath();
      let x = -r() * 20 * dpr;
      while (x < W) {
        const hh = height(x);
        const w = Math.max(4 * dpr, hh * (0.55 + r() * 0.9) * (1 - k * 0.15));
        const y = front(x) - hh * (1 - k / rows) + (r() - 0.5) * hh * 0.12;
        const lift = w * (0.3 + r() * 0.25);
        ctx.moveTo(x, y + lift * 0.5);
        ctx.quadraticCurveTo(x + w * (0.4 + r() * 0.2), y - lift, x + w, y + lift * 0.5);
        x += w * (0.8 + r() * 0.4);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = ink(0.72 * strength);
    ctx.lineWidth = Math.max(1, 1.5 * dpr * (0.6 + tb));
    ctx.beginPath();
    for (let x = 0; x <= W; x += 6 * dpr) {
      const y = front(x) + Math.sin(x * 0.03 / dpr) * dpr * (0.4 + tb);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // spray above the crest
    const r = rng(7);
    ctx.fillStyle = ink(0.22 * strength);
    for (let k = 0; k < 140; k++) {
      const x = r() * W;
      const y = front(x) - height(x) * (1 + r() * 0.9);
      ctx.beginPath();
      ctx.arc(x, y, (0.4 + r() * (0.5 + tb)) * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw(p = lastP) {
    lastP = p;
    if (!L) return;
    ctx.drawImage(back, 0, 0);
    drawWater(p);
    ctx.drawImage(front, 0, 0);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(rect.width * dpr));
    H = Math.max(1, Math.round(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    L = layout();
    drawBack();
    drawFront();
    draw(lastP);
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);
  resize();

  return {
    draw,
    resize,
    dispose() {
      ro.disconnect();
    },
  };
}
