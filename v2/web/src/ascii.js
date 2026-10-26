/**
 * The page's background: the Qiantang tide in characters. Fine characters cover the rice paper
 * like pixels (the same idea as the ASCII stadium on ZJU Run's login page); each character
 * cell looks out over a river in perspective and takes as much ink as it sees there.
 * The water is drawn the way ink painters draw waves: lines along the crests, deeper where
 * the swell rises. Every so often the bore (一线潮) comes up from the horizon: a dark wall of
 * water with a white lip of foam, spray thrown above it, churned water behind.
 * Characters tremble a little; near the pointer they scramble and shake; a click drops
 * ripples that spread across the water.
 *
 * createInkField(canvas, { getScroll, onDrop }) → { setCalm(k), setNight(on), pause(on), dispose() }
 *   onDrop(x, y): a click landed on the water (the legend of Liuhe throwing stones counts them)
 *   setCalm(k):   0 the river as it is … 1 flat calm, no bore (the Dragon King has given in)
 *   setNight(on): pale characters on a dark page, for the tide chapter
 */

// glyphs from sparse to dense
const CHARS = " .,:;-~=+*?!|0#X%WM@";
const CAM_H = 3.2; // eye height over the water
const HORIZON = 0.42; // where the far bank sits, from the top of the screen
const FOCAL = 1.15; // in screen heights
const BORE_PERIOD = 30; // seconds between tides
const BORE_RUN = 21; // seconds a tide takes from the horizon to the near edge

const VS = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FS = `#version 300 es
precision highp float;
precision highp int;
out vec4 outColor;
uniform sampler2D uGlyphs;  // all glyphs in a row, each cellPx × cellPx, white on transparent
uniform vec2 uGrid;         // cols, rows
uniform int uCellPx;        // device pixels per cell
uniform float uHeight;      // canvas height in device pixels
uniform float uTime;
uniform float uDrift;       // how far the water has run past (scroll + time)
uniform float uBore;        // distance of the bore from the eye (negative: none)
uniform vec4 uPointer;      // cell x, cell y (from the top), on, radius in cells
uniform vec4 uRipple;       // world x, z of the last click, age (s), on
uniform vec4 uRing;         // cell x, y (from the top) of the last click, age (s), on
uniform vec3 uInk;
uniform vec3 uWash;
uniform float uCalm;        // 0 the river as it is … 1 still water
const float N = ${CHARS.length}.0;
const float CAM_H = ${CAM_H.toFixed(2)};
const float HORIZON = ${HORIZON.toFixed(3)};
const float FOCAL = ${FOCAL.toFixed(3)};
const float BAYER[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);

float hash3(vec3 p) {
  uvec3 v = uvec3(ivec3(floor(p)) + 1048576);
  uint h = v.x * 1597334677u ^ v.y * 3812015801u ^ v.z * 2798796415u;
  h = (h ^ (h >> 16u)) * 2246822519u;
  h ^= h >> 13u;
  return float(h) * (1.0 / 4294967296.0);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash3(vec3(i, 9.0));
  float b = hash3(vec3(i + vec2(1.0, 0.0), 9.0));
  float c = hash3(vec3(i + vec2(0.0, 1.0), 9.0));
  float d = hash3(vec3(i + vec2(1.0, 1.0), 9.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// the swell: a few trains of waves running towards the eye, at slightly different angles
float swell(vec2 p, float t) {
  float h = 0.0;
  h += 0.36 * sin(dot(p, normalize(vec2(0.18, -1.0))) * 0.42 + t * 1.05);
  h += 0.22 * sin(dot(p, normalize(vec2(-0.35, -1.0))) * 0.78 + t * 1.45 + 1.3);
  h += 0.12 * sin(dot(p, normalize(vec2(0.6, -1.0))) * 1.35 + t * 1.9 + 2.1);
  h += 0.07 * sin(dot(p, normalize(vec2(-0.9, -0.5))) * 2.3 + t * 2.4 + 0.4);
  h += 0.18 * (vnoise(p * 0.18 + vec2(0.0, t * 0.25)) - 0.5);
  return h;
}

// the bore's front is not straight: it wanders across the river
float boreWobble(float x) {
  return sin(x * 0.09 + 1.7) * 2.2 + sin(x * 0.23) * 0.8;
}

// ink in one cell: screen position uv (0..1, y down) → how dark
float ink(vec2 uv, float t) {
  float aspect = uGrid.x / uGrid.y;
  vec3 dir = normalize(vec3((uv.x - 0.5) * aspect, HORIZON - uv.y, FOCAL));
  if (dir.y > -0.002) {
    // above the water: the far bank, a low wash of hills
    float x = (uv.x - 0.5) * aspect;
    float hill = 0.035 + 0.025 * sin(x * 4.0 + 1.2) + 0.018 * sin(x * 11.0 + 0.3) + 0.01 * sin(x * 27.0);
    float above = HORIZON - uv.y;
    return above < hill ? 0.2 * (1.0 - above / hill * 0.6) : 0.0;
  }
  float dist = CAM_H / -dir.y;
  vec2 p = vec2(dir.x, dir.z) * dist + vec2(0.0, uDrift);
  float far = smoothstep(12.0, 140.0, dist);

  // is there a tide coming? the bore is a wall of water across the river at distance uBore
  float zb = -1.0;
  if (uBore > 0.0) {
    zb = uBore + boreWobble(p.x);
    float tb = zb / dir.z;              // where the ray meets the wall's plane
    float yb = CAM_H + dir.y * tb;      // and at what height
    float hb = 3.4 + 0.9 * sin(p.x * 0.13 + 0.6) + 0.55 * sin(p.x * 0.37 + t * 0.8) + 0.5 * vnoise(vec2(p.x * 0.5, t * 1.5));
    if (dist > zb && tb > 0.0) {
      float lip = 0.95 + 0.4 * vnoise(vec2(p.x * 0.8, t));
      if (yb < hb - lip && yb > -0.2) {
        // the face of the wave: dark water, streaked as it rises, darkest just under the lip
        float streak = vnoise(vec2(p.x * 1.6, yb * 3.0 - t * 2.0));
        float foot = smoothstep(-0.2, 0.7, yb);  // the foot of the wall melts into the water
        return (0.42 + 0.3 * streak + 0.2 * smoothstep(0.0, hb - lip, yb)) * (0.35 + 0.65 * foot);
      }
      if (yb >= hb - lip && yb < hb + 0.05) {
        // the lip: a thick roll of white foam, outlined in ink, bubbling with dark flecks
        float u = (yb - (hb - lip)) / (lip + 0.05);
        float fleck = vnoise(vec2(p.x * 5.0, yb * 7.0 + t * 5.0));
        if (u > 0.88 || u < 0.06) return 0.78;
        if (u < 0.2) return 0.32 * fleck;          // the foam folding into the dark face
        return fleck > 0.7 ? 0.4 : 0.0;
      }
      if (yb >= hb && yb < hb + 4.0) {
        // spray: droplets flung up off the crest, thinning upward, flickering
        float rise = (yb - hb) / 4.0;
        float plume = vnoise(vec2(p.x * 0.6, t * 1.2));   // spray comes off in plumes
        float drop = hash3(vec3(floor(uv * uGrid), floor(t * 12.0)));
        return drop > 0.5 + 0.45 * rise + 0.3 * (1.0 - plume) ? 0.45 * (1.0 - rise) : 0.0;
      }
    }
  }

  float h = swell(p, t) * (1.0 - 0.75 * uCalm);
  // a dropped stone: rings spreading over the water
  if (uRipple.w > 0.5) {
    float r = length(p - uRipple.xy);
    float front = uRipple.z * 6.0;
    h += 0.45 * sin((r - front) * 2.2) * exp(-pow(r - front, 2.0) * 0.06) * exp(-uRipple.z * 0.5);
  }
  // behind the bore the river is churned up and foaming
  float churn = 0.0;
  if (zb > 0.0) {
    churn = smoothstep(zb, zb + 3.0, dist) * (1.0 - smoothstep(zb + 60.0, zb + 130.0, dist));
    h += churn * 0.6 * (vnoise(p * 0.7 + t) - 0.5);
  }

  // ink strokes along the crests of each train of waves, broken like a brush, as painters draw
  // water; the front slopes of the big swell take a light wash
  float w = mix(0.13, 0.32, far);
  float ph1 = dot(p, normalize(vec2(0.18, -1.0))) * 0.42 + t * 1.05 + h * 0.6;
  float ph2 = dot(p, normalize(vec2(-0.35, -1.0))) * 0.78 + t * 1.45 + 1.3;
  float ph3 = dot(p, normalize(vec2(0.6, -1.0))) * 1.35 + t * 1.9 + 2.1;
  float ph4 = dot(p, normalize(vec2(-0.15, -1.0))) * 2.6 + t * 2.7 + 0.7;
  float c1 = smoothstep(1.0 - w, 1.0, sin(ph1)) * smoothstep(0.18, 0.45, vnoise(p * vec2(0.09, 0.3) + 3.0));
  float c2 = smoothstep(1.0 - w * 1.2, 1.0, sin(ph2)) * smoothstep(0.25, 0.5, vnoise(p * vec2(0.14, 0.4) + 11.0));
  float c3 = smoothstep(1.0 - w * 1.4, 1.0, sin(ph3)) * smoothstep(0.35, 0.6, vnoise(p * vec2(0.2, 0.6) + 23.0));
  float c4 = smoothstep(1.0 - w * 1.6, 1.0, sin(ph4)) * smoothstep(0.45, 0.65, vnoise(p * vec2(0.35, 1.0) + 31.0)) * (1.0 - far);
  float crest = max(max(c1, c2 * 0.85), max(c3 * 0.6, c4 * 0.45)) * (1.0 - 0.8 * uCalm);
  float slope = max(0.0, cos(ph1)) * 0.12 * (1.0 - far) * (1.0 - uCalm);
  float d = 0.05 + slope + crest * mix(0.75, 0.38, far);
  // foam patches: white holes in the ink where the water is churned
  if (churn > 0.0) {
    float foam = vnoise(p * vec2(0.35, 0.9) + vec2(0.0, t * 0.8));
    d = mix(d, 0.32, churn * 0.5);                       // the churned water is darker...
    d *= 1.0 - churn * smoothstep(0.4, 0.62, foam);      // ...and torn open by white foam
  }
  // the far water fades into the haze, almost to nothing at the horizon
  return d * mix(1.0, 0.12, smoothstep(25.0, 200.0, dist));
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uHeight - gl_FragCoord.y); // device px, y down
  ivec2 cell = ivec2(px) / uCellPx;
  if (float(cell.x) >= uGrid.x || float(cell.y) >= uGrid.y) discard;
  vec2 c = vec2(cell);
  float d = ink((c + 0.5) / uGrid, uTime) * 0.6; // a light hand: the tide stays behind the words

  // flat washes would come out as rows of one character: let the ink vary a little per cell
  // (no scatter of marks over the bare paper: they read as dust floating round the tower)
  d *= 0.85 + 0.3 * hash3(vec3(c, 3.0));

  // the pointer: a small soft patch where the characters already there are re-picked and
  // quiver (it adds none of its own); its edge is dithered, so it fades out cell by cell
  float pd = length(c + 0.5 - uPointer.xy);
  float fall = uPointer.z * (1.0 - smoothstep(uPointer.w * 0.3, uPointer.w, pd));
  float hover = hash3(vec3(c, floor(uTime * 18.0) + 41.0)) < fall ? fall : 0.0;

  // a click: rings of characters spreading out over the whole page, like a stone dropped in water
  float ring = 0.0;
  if (uRing.w > 0.5) {
    float r = length(c + 0.5 - uRing.xy);
    for (int k = 0; k < 3; k++) {
      float front = uRing.z * 26.0 - float(k) * 5.5;
      if (front <= 0.0) continue;
      float wv = exp(-pow(r - front, 2.0) * 0.12) * exp(-uRing.z * 0.75) * (1.0 - 0.25 * float(k));
      ring = max(ring, wv * (0.6 + 0.4 * hash3(vec3(c, floor(uTime * 16.0) + float(k)))));
    }
    d = max(d, ring * 0.95);
  }

  float bayer = BAYER[(cell.y & 3) * 4 + (cell.x & 3)] / 16.0 - 0.47;
  float idx = floor((N - 1.0) * clamp(d * 1.08, 0.0, 1.0) + bayer * 1.5);
  if ((hover > 0.05 || ring > 0.25) && idx > 0.5) idx = 1.0 + floor(hash3(vec3(c, floor(uTime * 14.0) + 7.0)) * (N - 1.0));
  idx = clamp(idx, 0.0, N - 1.0);
  if (idx < 0.5) discard;

  // tremble: every character sits a little off its place, and moves now and then
  float amp = 0.6 + 1.3 * fall + 2.2 * ring;
  float tick = floor(uTime * (6.0 + 12.0 * fall));
  vec2 j = (vec2(hash3(vec3(c, tick + 11.0)), hash3(vec3(c, tick + 23.0))) - 0.5) * amp;
  ivec2 inCell = ivec2(px - c * float(uCellPx) - j);
  if (inCell.x < 0 || inCell.y < 0 || inCell.x >= uCellPx || inCell.y >= uCellPx) discard;
  float cov = texelFetch(uGlyphs, ivec2(int(idx) * uCellPx + inCell.x, inCell.y), 0).a;
  if (cov < 0.01) discard;

  vec3 col = mix(uWash, uInk, smoothstep(0.22, 0.7, d));
  float a = cov * (0.22 + 0.6 * smoothstep(0.0, 0.6, d));
  outColor = vec4(col * a, a);
}
`;

export function createInkField(canvas, { getScroll = () => scrollY, onDrop } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, stencil: false });
  const none = { setCalm() {}, setNight() {}, pause() {}, dispose() {} };
  if (!gl) return none;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const prog = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]]) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('[ink]', gl.getShaderInfoLog(sh));
      return none;
    }
    gl.attachShader(prog, sh);
  }
  gl.bindAttribLocation(prog, 0, 'aPos');
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const U = Object.fromEntries(['uGlyphs', 'uGrid', 'uCellPx', 'uHeight', 'uTime', 'uDrift', 'uBore', 'uPointer', 'uRipple', 'uRing', 'uInk', 'uWash', 'uCalm'].map((n) => [n, gl.getUniformLocation(prog, n)]));
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const glyphTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, glyphTex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  gl.uniform1i(U.uGlyphs, 0);
  // ink and wash: dark on paper by day, pale on dark paper at night (they cross-fade)
  const DAY = [
    [0.105, 0.09, 0.07],
    [0.45, 0.43, 0.4],
  ];
  const NIGHT = [
    [0.86, 0.82, 0.74],
    [0.42, 0.4, 0.37],
  ];
  let night = 0;
  let nightTo = 0;
  let calm = 0;
  let calmTo = 0;
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  let W = 1;
  let H = 1;
  let dpr = 1;
  let cellCss = 7;
  let cellPx = 7;
  let cols = 1;
  let rows = 1;
  let glyphKey = '';

  function buildGlyphs() {
    const key = `${cellPx}`;
    if (key === glyphKey) return;
    glyphKey = key;
    const g = document.createElement('canvas');
    g.width = CHARS.length * cellPx;
    g.height = cellPx;
    const c = g.getContext('2d');
    c.font = `500 ${Math.round(cellCss * 1.3 * dpr)}px "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace`;
    c.fillStyle = '#fff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 1; i < CHARS.length; i++) c.fillText(CHARS[i], i * cellPx + cellPx / 2, cellPx / 2);
    gl.bindTexture(gl.TEXTURE_2D, glyphTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, g);
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    cellCss = W < 720 ? 6 : 7;
    cellPx = Math.max(6, Math.round(cellCss * dpr));
    cols = Math.ceil(canvas.width / cellPx);
    rows = Math.ceil(canvas.height / cellPx);
    buildGlyphs();
  }

  /** where on the water a point of the screen lands (the same camera as the shader) */
  function toWater(x, y, drift) {
    const aspect = cols / rows;
    // the shader works in whole cells, so map through the cell grid, not the canvas size
    const u = (x * dpr) / cellPx / cols;
    const v = (y * dpr) / cellPx / rows;
    const dx = (u - 0.5) * aspect;
    const dy = HORIZON - v;
    if (dy > -0.002) return null;
    const len = Math.hypot(dx, dy, FOCAL);
    const dist = CAM_H / (-dy / len);
    return [(dx / len) * dist, (FOCAL / len) * dist + drift];
  }

  /* ── pointer ── */
  const pointer = { x: -1e4, y: -1e4, on: 0 };
  let ripple = [0, 0];
  let rippleAge = 99;
  let drift = 0;
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.on = e.pointerType === 'touch' ? 0 : 1;
  };
  const onLeave = () => (pointer.on = 0);
  let ring = [0, 0];
  let ringAge = 99;
  let press = null;
  const onDown = (e) => {
    press = e.target.closest && e.target.closest('button, a, input, textarea, label, .card, .tabs, .ctrl, .explore, .info, .top, .interlude, .book, .lightbox, .game, .foot') ? null : [e.clientX, e.clientY];
  };
  const onUp = (e) => {
    if (!press || Math.hypot(e.clientX - press[0], e.clientY - press[1]) > 6) return; // a drag is not a click
    press = null;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const cellReal = cellPx / dpr;
    ring = [x / cellReal, y / cellReal];
    ringAge = 0;
    const w = toWater(x, y, drift);
    if (w) {
      ripple = w;
      rippleAge = 0;
      onDrop && onDrop(e.clientX, e.clientY);
    }
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);

  let t = 0;
  function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.uniform2f(U.uGrid, cols, rows);
    gl.uniform1i(U.uCellPx, cellPx);
    gl.uniform1f(U.uHeight, canvas.height);
    gl.uniform1f(U.uTime, t);
    // the water runs past slowly, a little faster while the page is being scrolled
    drift = t * 1.2 + getScroll() * 0.012;
    gl.uniform1f(U.uDrift, drift);
    // the tide: comes in from far off, rolls up to the near edge of the picture, then the river settles
    const phase = (t + 4) % BORE_PERIOD;
    gl.uniform1f(U.uBore, phase < BORE_RUN && calm < 0.3 ? 170 * Math.pow(1 - phase / BORE_RUN, 1.25) + 2.5 : -1);
    gl.uniform1f(U.uCalm, calm);
    const mix3 = (a, b) => a.map((v, i) => v + (b[i] - v) * night);
    gl.uniform3f(U.uInk, ...mix3(DAY[0], NIGHT[0]));
    gl.uniform3f(U.uWash, ...mix3(DAY[1], NIGHT[1]));
    const cellReal = cellPx / dpr; // CSS pixels per cell, after rounding to whole device pixels
    gl.uniform4f(U.uPointer, pointer.x / cellReal, pointer.y / cellReal, pointer.on, Math.max(24, Math.min(44, Math.min(W, H) * 0.032)) / cellReal);
    gl.uniform4f(U.uRipple, ripple[0], ripple[1], rippleAge, rippleAge < 8 ? 1 : 0);
    gl.uniform4f(U.uRing, ring[0], ring[1], ringAge, ringAge < 4 ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, glyphTex);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  let raf = 0;
  let last = 0;
  let disposed = false;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    t += dt;
    rippleAge += dt;
    ringAge += dt;
    night += Math.sign(nightTo - night) * Math.min(Math.abs(nightTo - night), dt / 1.2);
    calm += Math.sign(calmTo - calm) * Math.min(Math.abs(calmTo - calm), dt / 2.5);
    render();
  }

  const ro = new ResizeObserver(() => {
    resize();
    render();
  });
  ro.observe(canvas);
  resize();
  const go = () => {
    if (disposed) return;
    glyphKey = '';
    buildGlyphs();
    if (reduce) t = 9; // a still moment with the tide half-way in
    render();
    if (!reduce) raf = requestAnimationFrame(loop);
  };
  // glyphs need the monospace font; draw once it has arrived
  if (document.fonts) document.fonts.load(`500 ${cellCss * 1.3}px "IBM Plex Mono"`).then(go, go);
  else go();
  const onVis = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf && !reduce && !paused) {
      last = 0;
      raf = requestAnimationFrame(loop);
    }
  };
  document.addEventListener('visibilitychange', onVis);
  let paused = false;

  return {
    setCalm(k) {
      calmTo = k;
      if (reduce) (calm = k), render();
    },
    setNight(on) {
      nightTo = on ? 1 : 0;
      if (reduce) (night = nightTo), render();
    },
    /** something opaque covers the whole page: stop drawing until it moves away */
    pause(on) {
      if (on === paused || reduce) return;
      paused = on;
      if (on) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    },
  };
}
