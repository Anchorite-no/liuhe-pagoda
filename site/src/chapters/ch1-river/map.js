/**
 * The ch1 sand table: a schematic 3D model of the Qiantang estuary with flags you can press.
 *
 *   const map = createRiverMap(el, { places, labels, onSelect });
 *   map.flyTo('pagoda'); map.overview(); map.trace(); map.dispose();
 *
 * Returns null if WebGL is unavailable (the chapter then shows the place list only).
 */
import { gsap } from 'gsap';
import { createStage } from '../../three/stage.js';
import { createLabels } from '../../three/labels.js';
import { h, reducedMotion } from '../../core/ui.js';
import { tr, onLangChange } from '../../core/i18n.js';
import { TABLE, toMap, waterField, surfaceHeight, riverPath } from './geo.js';

const BG = '#d3d9d2';

export function createRiverMap(container, { places, mapLabels, onSelect }) {
  const stage = createStage(container, {
    fov: 40,
    near: 0.2,
    far: 2400,
    camera: [0, 160, 140],
    target: [0, 0, 4],
    controls: true,
    background: BG,
    exposure: 1.05,
    controlsOptions: {
      enablePan: true,
      screenSpacePanning: false,
      minDistance: 5,
      maxDistance: 520,
      maxPolarAngle: 1.3,
      rotateSpeed: 0.6,
      panSpeed: 0.8,
    },
  });
  if (!stage) return null;
  const { THREE, scene, camera, controls } = stage;
  // Keep vertical swipes for page scrolling on touch screens.
  stage.renderer.domElement.style.touchAction = 'pan-y';
  // A plain mouse wheel scrolls the page; Ctrl/⌘ + wheel (or a trackpad pinch) zooms the table.
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  controls.enableZoom = coarse;
  const onWheel = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const f = Math.exp(Math.max(-60, Math.min(60, e.deltaY)) * 0.004);
    const off = camera.position.clone().sub(controls.target);
    const d = Math.min(controls.maxDistance, Math.max(controls.minDistance, off.length() * f));
    camera.position.copy(controls.target).add(off.setLength(d));
  };
  stage.renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
  scene.fog = new THREE.Fog(BG, 520, 1300);

  /* ── Light ── */
  scene.add(new THREE.HemisphereLight('#f6f2e7', '#7d8278', 1.25));
  const sun = new THREE.DirectionalLight('#fff3dc', 1.9);
  sun.position.set(-120, 160, 90);
  scene.add(sun);

  /* ── Terrain ── */
  const NX = 270;
  const NZ = Math.round((NX * TABLE.d) / TABLE.w);
  const field = waterField(THREE, NX, NZ);
  const W = NX + 1;
  const count = W * (NZ + 1);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const heights = new Float32Array(count);
  const cSand = new THREE.Color('#e2d6b6');
  const cPlain = new THREE.Color('#cfcca6');
  const cHill = new THREE.Color('#a7ae88');
  const cHigh = new THREE.Color('#8e9876');
  const cBed = new THREE.Color('#b9ad8c');
  const tmp = new THREE.Color();
  for (let j = 0; j <= NZ; j++) {
    const z = TABLE.z0 + (j / NZ) * TABLE.d;
    for (let i = 0; i <= NX; i++) {
      const x = TABLE.x0 + (i / NX) * TABLE.w;
      const k = j * W + i;
      const d = field[k];
      const y = surfaceHeight(x, z, d);
      heights[k] = y;
      pos[k * 3] = x;
      pos[k * 3 + 1] = y;
      pos[k * 3 + 2] = z;
      if (y < 0.05) tmp.copy(cBed);
      else if (y < 0.35) tmp.copy(cSand).lerp(cPlain, (y - 0.05) / 0.3);
      else if (y < 1.4) tmp.copy(cPlain).lerp(cHill, (y - 0.35) / 1.05);
      else tmp.copy(cHill).lerp(cHigh, Math.min(1, (y - 1.4) / 1.4));
      const n = (Math.sin(x * 1.7 + z * 0.9) * Math.sin(z * 1.3 - x * 0.4)) * 0.025;
      col[k * 3] = tmp.r + n;
      col[k * 3 + 1] = tmp.g + n;
      col[k * 3 + 2] = tmp.b + n;
    }
  }
  const idx = new Uint32Array(NX * NZ * 6);
  let q = 0;
  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const a = j * W + i;
      const b = a + 1;
      const c = a + W;
      const d = c + 1;
      idx[q++] = a;
      idx[q++] = c;
      idx[q++] = b;
      idx[q++] = b;
      idx[q++] = c;
      idx[q++] = d;
    }
  }
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  tGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  tGeo.setIndex(new THREE.BufferAttribute(idx, 1));
  tGeo.computeVertexNormals();
  const tMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  // Contour lines, like the printed levels on a planning model.
  tMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vH;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvH = position.y;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vH;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float cv = vH / 0.42;
        float cl = abs(fract(cv - 0.5) - 0.5) / max(fwidth(cv), 1e-4);
        float line = (1.0 - min(cl, 1.0)) * step(0.5, vH);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.74, line * 0.6);`,
      );
  };
  const terrain = new THREE.Mesh(tGeo, tMat);
  scene.add(terrain);

  function heightAt(x, z) {
    const fi = ((x - TABLE.x0) / TABLE.w) * NX;
    const fj = ((z - TABLE.z0) / TABLE.d) * NZ;
    const i = Math.max(0, Math.min(NX - 1, Math.floor(fi)));
    const j = Math.max(0, Math.min(NZ - 1, Math.floor(fj)));
    const u = Math.min(1, Math.max(0, fi - i));
    const v = Math.min(1, Math.max(0, fj - j));
    const k = j * W + i;
    const a = heights[k];
    const b = heights[k + 1];
    const c = heights[k + W];
    const d = heights[k + W + 1];
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  }

  /* ── Water ── */
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(TABLE.w, TABLE.d),
    new THREE.MeshStandardMaterial({ color: '#7f9d9b', roughness: 0.28, metalness: 0.05, transparent: true, opacity: 0.86 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set((TABLE.x0 + TABLE.x1) / 2, 0, (TABLE.z0 + TABLE.z1) / 2);
  water.renderOrder = 1;
  scene.add(water);

  /* ── Table frame ── */
  const wood = new THREE.MeshStandardMaterial({ color: '#5b3b29', roughness: 0.7 });
  const rim = 3.2;
  const frameH = 4.2;
  const cx = (TABLE.x0 + TABLE.x1) / 2;
  const cz = (TABLE.z0 + TABLE.z1) / 2;
  const sides = [
    [TABLE.w + rim * 2, rim, cx, TABLE.z0 - rim / 2],
    [TABLE.w + rim * 2, rim, cx, TABLE.z1 + rim / 2],
    [rim, TABLE.d, TABLE.x0 - rim / 2, cz],
    [rim, TABLE.d, TABLE.x1 + rim / 2, cz],
  ];
  for (const [w, d, x, z] of sides) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, frameH, d), wood);
    m.position.set(x, 0.9 - frameH / 2, z);
    scene.add(m);
  }
  const base = new THREE.Mesh(new THREE.BoxGeometry(TABLE.w + rim * 2, 2, TABLE.d + rim * 2), wood);
  base.position.set(cx, 0.9 - frameH - 1, cz);
  scene.add(base);

  /* ── North arrow on the frame corner ── */
  const arrowMat = new THREE.MeshStandardMaterial({ color: '#efe6cf', roughness: 0.6 });
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(1.6, 5, 3), arrowMat);
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.set(TABLE.x1 - 6, 1.3, TABLE.z0 + 7);
  scene.add(arrow);

  /* ── River path (for models and the 之 trace) ── */
  const river = riverPath(THREE, 480);

  function riverTangentNear(x, z) {
    let best = 0;
    let bd = Infinity;
    river.points.forEach((p, i) => {
      const d = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    const a = river.points[Math.max(0, best - 2)];
    const b = river.points[Math.min(river.points.length - 1, best + 2)];
    const t = new THREE.Vector2(b.x - a.x, b.z - a.z).normalize();
    return { t, w: river.points[best].w, p: river.points[best] };
  }

  /* ── Little models ── */
  const models = new THREE.Group();
  scene.add(models);
  const placePos = new Map();
  for (const p of places) {
    const [x, z] = toMap(...p.ll);
    placePos.set(p.id, new THREE.Vector3(x, Math.max(0.05, heightAt(x, z)), z));
  }

  // Pagoda: thirteen eaves outside, as on the real tower.
  {
    const g = new THREE.Group();
    const body = new THREE.MeshStandardMaterial({ color: '#8b3a25', roughness: 0.7 });
    const eave = new THREE.MeshStandardMaterial({ color: '#4b4541', roughness: 0.6 });
    const H = 1.9;
    const tiers = 13;
    for (let t = 0; t < tiers; t++) {
      const f = 1 - (t / tiers) * 0.38;
      const y = (t / tiers) * H;
      const hb = H / tiers;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * f, 0.21 * f, hb * 0.8, 8), body);
      m.position.y = y + hb * 0.4;
      g.add(m);
      const e = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * f, 0.33 * f, hb * 0.28, 8), eave);
      e.position.y = y + hb * 0.86;
      g.add(e);
    }
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 8), eave);
    fin.position.y = H + 0.18;
    g.add(fin);
    g.position.copy(placePos.get('pagoda'));
    g.position.y -= 0.05;
    models.add(g);
  }

  // Zhijiang campus: red-brick blocks among the trees.
  {
    const brick = new THREE.MeshStandardMaterial({ color: '#9c4b36', roughness: 0.85 });
    const roof = new THREE.MeshStandardMaterial({ color: '#4f5653', roughness: 0.8 });
    const c = placePos.get('campus');
    const blocks = [
      [0, 0, 0.55, 0.3, 0.32],
      [0.75, -0.35, 0.45, 0.28, 0.3],
      [-0.7, 0.2, 0.5, 0.26, 0.28],
      [0.25, 0.7, 0.4, 0.24, 0.3],
      [-0.3, -0.75, 0.42, 0.26, 0.28],
    ];
    for (const [dx, dz, w, hgt, d] of blocks) {
      const x = c.x + dx;
      const z = c.z + dz;
      const y = heightAt(x, z);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, d), brick);
      m.position.set(x, y + hgt / 2, z);
      m.rotation.y = 0.3;
      models.add(m);
      const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.74, 0.14, 4), roof);
      r.position.set(x, y + hgt + 0.07, z);
      r.rotation.y = 0.3 + Math.PI / 4;
      r.scale.set(1, 1, d / w);
      models.add(r);
    }
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), brick);
    const ty = heightAt(c.x + 0.4, c.z + 0.25);
    tower.position.set(c.x + 0.4, ty + 0.3, c.z + 0.25);
    models.add(tower);
    // a few trees
    const leaf = new THREE.MeshStandardMaterial({ color: '#6f7f5b', roughness: 0.9 });
    const treeGeo = new THREE.IcosahedronGeometry(0.16, 0);
    for (let i = 0; i < 26; i++) {
      const a = i * 2.4;
      const r = 0.5 + (i % 5) * 0.32;
      const x = c.x + Math.cos(a) * r;
      const z = c.z + Math.sin(a) * r;
      const tree = new THREE.Mesh(treeGeo, leaf);
      tree.position.set(x, heightAt(x, z) + 0.12, z);
      tree.scale.setScalar(0.8 + (i % 3) * 0.25);
      models.add(tree);
    }
  }

  // Qiantang River Bridge: a double-deck truss across the river.
  {
    const b = placePos.get('bridge');
    const { t, w } = riverTangentNear(b.x, b.z);
    const len = w + 1.6;
    const g = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: '#56626a', roughness: 0.5, metalness: 0.3 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.2), steel);
    deck.position.y = 0.62;
    g.add(deck);
    const lower = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, 0.16), steel);
    lower.position.y = 0.34;
    g.add(lower);
    const spans = 16;
    const pts = [];
    for (let s = 0; s < spans; s++) {
      const x0 = -len / 2 + (s / spans) * len;
      const x1 = -len / 2 + ((s + 1) / spans) * len;
      for (const zz of [-0.09, 0.09]) {
        pts.push(x0, 0.34, zz, (x0 + x1) / 2, 0.62, zz, (x0 + x1) / 2, 0.62, zz, x1, 0.34, zz);
      }
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.6, 6), steel);
      pier.position.set(x0, 0.04, 0);
      g.add(pier);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#3d474d' })));
    g.position.set(b.x, 0, b.z);
    // The bridge crosses at right angles to the current.
    g.rotation.y = -Math.atan2(t.x, t.y);
    models.add(g);
  }

  /* ── Flags ── */
  const labels = createLabels(stage);
  const flagMat = new THREE.MeshStandardMaterial({ color: '#7d520c', roughness: 0.6, side: THREE.DoubleSide });
  const poleMat = new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.5 });
  const poleGeo = new THREE.CylinderGeometry(0.022, 0.022, 1, 6);
  poleGeo.translate(0, 0.5, 0);
  const flagGeo = new THREE.BufferGeometry();
  flagGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 0, 0.42, 0.9, 0, 0, 0.8, 0], 3));
  flagGeo.computeVertexNormals();
  const flags = new Map();
  for (const p of places) {
    const base = placePos.get(p.id).clone();
    if (p.id === 'bridge') base.y = 0.62;
    if (p.id === 'pagoda') base.y += 2.05;
    const g = new THREE.Group();
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.scale.y = p.pole;
    g.add(pole);
    const cloth = new THREE.Mesh(flagGeo, flagMat);
    cloth.position.y = p.pole - 1;
    g.add(cloth);
    g.position.copy(base);
    scene.add(g);
    const btn = h(
      'button',
      {
        type: 'button',
        class: 'hotspot ch1-flag',
        'aria-expanded': 'false',
        'aria-controls': 'ch1-panel',
        onclick: () => onSelect && onSelect(p.id),
      },
      tr(p.name),
    );
    const offset = [0, 0];
    labels.add(btn, base.clone().setY(base.y + p.pole), { offset });
    flags.set(p.id, { g, btn, base, p, offset, w: 0, hgt: 0 });
  }
  // Leader lines from each pole top to its label, when the label had to move aside.
  const leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  leaders.setAttribute('class', 'ch1-leaders');
  leaders.setAttribute('aria-hidden', 'true');
  for (const f of flags.values()) {
    f.line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    leaders.append(f.line);
  }
  container.append(leaders);

  const mapLabelEls = [];
  for (const m of mapLabels) {
    const [x, z] = toMap(...m.ll);
    const el = h('span', { class: `ch1-maplabel ch1-maplabel--${m.kind}`, 'aria-hidden': 'true' }, tr(m.text));
    labels.add(el, new THREE.Vector3(x, m.kind === 'sea' ? 0.2 : heightAt(x, z) + 0.3, z));
    mapLabelEls.push({ el, m });
  }
  const northEl = h('span', { class: 'ch1-maplabel ch1-maplabel--north', 'aria-hidden': 'true' }, 'N');
  labels.add(northEl, new THREE.Vector3(TABLE.x1 - 6, 1.6, TABLE.z0 + 2.4));

  let measureAgain = true;
  const offLang = onLangChange(() => {
    for (const { btn, p } of flags.values()) btn.textContent = tr(p.name);
    for (const { el, m } of mapLabelEls) el.textContent = tr(m.text);
    measureAgain = true;
  });

  const proj = new THREE.Vector3();
  function declutter() {
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const list = [];
    for (const f of flags.values()) {
      if (measureAgain || !f.w) {
        f.w = f.btn.offsetWidth;
        f.hgt = f.btn.offsetHeight;
      }
      proj.copy(f.top).project(camera);
      const visible = proj.z < 1 && Math.abs(proj.x) < 1.05 && Math.abs(proj.y) < 1.05;
      f.sx = (proj.x * 0.5 + 0.5) * cw;
      f.sy = (-proj.y * 0.5 + 0.5) * ch;
      f.cx = f.sx;
      f.cy = f.sy - f.hgt / 2 - 4;
      f.visible = visible && !flagsHidden;
      if (visible) list.push(f);
    }
    measureAgain = false;
    for (let it = 0; it < 12; it++) {
      let moved = false;
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          const ox = (a.w + b.w) / 2 + 6 - Math.abs(a.cx - b.cx);
          const oy = (a.hgt + b.hgt) / 2 + 4 - Math.abs(a.cy - b.cy);
          if (ox > 0 && oy > 0) {
            moved = true;
            const push = oy / 2 + 0.5;
            if (a.cy < b.cy || (a.cy === b.cy && a.sy < b.sy)) {
              a.cy -= push;
              b.cy += push;
            } else {
              a.cy += push;
              b.cy -= push;
            }
          }
        }
      }
      if (!moved) break;
    }
    for (const f of flags.values()) {
      if (!f.visible) {
        f.line.setAttribute('visibility', 'hidden');
        continue;
      }
      f.cx = Math.min(cw - f.w / 2 - 4, Math.max(f.w / 2 + 4, f.cx));
      f.offset[0] = f.cx - f.sx;
      f.offset[1] = f.cy - f.sy;
      const ly = f.cy + (f.cy < f.sy ? f.hgt / 2 : -f.hgt / 2);
      const far = Math.hypot(f.cx - f.sx, ly - f.sy) > 6;
      f.line.setAttribute('visibility', far ? 'visible' : 'hidden');
      f.line.setAttribute('x1', f.sx.toFixed(1));
      f.line.setAttribute('y1', f.sy.toFixed(1));
      f.line.setAttribute('x2', f.cx.toFixed(1));
      f.line.setAttribute('y2', ly.toFixed(1));
    }
  }

  // Flags keep roughly the same size on screen while you zoom.
  stage.onTick(() => {
    const d = camera.position.distanceTo(controls.target);
    const s = Math.min(10, Math.max(0.28, d * 0.04));
    for (const f of flags.values()) {
      f.g.scale.setScalar(s);
      f.top = (f.top || new THREE.Vector3()).copy(f.base);
      f.top.y += f.p.pole * s;
      labels.setPosition(f.btn, f.top);
    }
    declutter();
    labels.update();
    // Small orientation labels only make sense from far away.
    const showSmall = d > 60;
    for (const { el, m } of mapLabelEls) {
      el.style.opacity = m.kind === 'town' && !showSmall ? '0' : '';
    }
  });

  /* ── The 之 trace ── */
  const traceCurve = new THREE.CatmullRomCurve3(
    river.points.filter((_, i) => i <= river.points.length * 0.93).map((p) => new THREE.Vector3(p.x, 0.32, p.z)),
    false,
    'centripetal',
  );
  const TUBE_SEG = 600;
  const RAD = 6;
  const traceGeo = new THREE.TubeGeometry(traceCurve, TUBE_SEG, 0.42, RAD, false);
  const traceMat = new THREE.MeshBasicMaterial({ color: '#a8402a', transparent: true, opacity: 0.95, depthTest: false });
  const traceMesh = new THREE.Mesh(traceGeo, traceMat);
  traceMesh.renderOrder = 5;
  traceGeo.setDrawRange(0, 0);
  traceMesh.visible = false;
  scene.add(traceMesh);
  const traceTotal = traceGeo.index.count;

  /* ── Camera moves ── */
  let tween = null;
  const dirFromSouth = new THREE.Vector3(0.18, 0.86, 0.78).normalize();

  /** Smallest camera distance (along dir from target) at which all points fit in the view. */
  const probe = new THREE.PerspectiveCamera();
  function fitDistance(target, dir, pts, margin = 0.9) {
    probe.fov = camera.fov;
    probe.aspect = camera.aspect;
    probe.near = camera.near;
    probe.far = camera.far;
    probe.updateProjectionMatrix();
    const v = new THREE.Vector3();
    const fits = (dist) => {
      probe.position.copy(target).addScaledVector(dir, dist);
      probe.lookAt(target);
      probe.updateMatrixWorld();
      return pts.every((p) => {
        v.copy(p).project(probe);
        return Math.abs(v.x) <= margin && Math.abs(v.y) <= margin && v.z < 1;
      });
    };
    let lo = 5;
    let hi = 2000;
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) hi = mid;
      else lo = mid;
    }
    return hi;
  }

  const corner = (x, z, y = 0.9) => new THREE.Vector3(x, y, z);
  const tableCorners = [
    corner(TABLE.x0 - rim, TABLE.z0 - rim),
    corner(TABLE.x1 + rim, TABLE.z0 - rim),
    corner(TABLE.x0 - rim, TABLE.z1 + rim),
    corner(TABLE.x1 + rim, TABLE.z1 + rim),
  ];

  function overviewPose() {
    // Landscape: from the south, north up, slightly from the west so Hangzhou sits a little closer.
    // Portrait: from the west, so the long table runs up the screen and the bay opens at the top.
    const portrait = camera.aspect < 1;
    const target = new THREE.Vector3(cx, 0, cz + (portrait ? 0 : 3));
    const elev = portrait ? 1.08 : 1.0;
    const az = portrait ? -Math.PI / 2 : -0.1;
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev));
    const dist = fitDistance(target, dir, tableCorners, portrait ? 0.99 : 0.97);
    return { position: target.clone().addScaledVector(dir, dist), target };
  }

  function tracePose() {
    const pts = traceCurve.getSpacedPoints(24);
    const box = new THREE.Box3().setFromPoints(pts);
    const target = box.getCenter(new THREE.Vector3());
    target.y = 0;
    const dir = camera.aspect < 1 ? new THREE.Vector3(-0.3, 0.95, 0).normalize() : new THREE.Vector3(0, 0.96, 0.28).normalize();
    const dist = fitDistance(target, dir, pts, 0.8);
    return { position: target.clone().addScaledVector(dir, dist), target };
  }

  function placePose(id) {
    const f = flags.get(id);
    const target = placePos.get(id).clone();
    if (id === 'pagoda') target.y += 0.8;
    const position = target.clone().add(dirFromSouth.clone().multiplyScalar(f.p.view));
    return { position, target };
  }

  function moveTo({ position, target }, duration = 1.8) {
    if (tween) tween.kill();
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (reducedMotion() || duration === 0) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      return Promise.resolve();
    }
    const lift = Math.min(120, p0.distanceTo(position) * 0.22);
    const s = { k: 0 };
    return new Promise((resolve) => {
      tween = gsap.to(s, {
        k: 1,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          const k = s.k;
          camera.position.lerpVectors(p0, position, k);
          camera.position.y += Math.sin(Math.PI * k) * lift;
          controls.target.lerpVectors(t0, target, k);
        },
        onComplete: resolve,
      });
    });
  }

  function setActive(id) {
    for (const [pid, f] of flags) f.btn.setAttribute('aria-expanded', String(pid === id));
  }

  let flagsHidden = false;
  function hideFlags(hidden) {
    flagsHidden = hidden;
    for (const f of flags.values()) {
      f.g.visible = !hidden;
      labels.setHidden(f.btn, hidden);
      f.btn.hidden = hidden;
    }
    leaders.style.display = hidden ? 'none' : '';
  }

  // Start on the whole table once the canvas has a size.
  requestAnimationFrame(() => {
    stage.setSize();
    moveTo(overviewPose(), 0);
  });

  let traceTween = null;
  return {
    stage,
    flyTo(id) {
      if (flagsHidden) hideFlags(false);
      setActive(id);
      return moveTo(placePose(id));
    },
    overview() {
      if (flagsHidden) hideFlags(false);
      setActive(null);
      return moveTo(overviewPose(), 1.6);
    },
    async trace() {
      setActive(null);
      hideFlags(true);
      if (traceTween) traceTween.kill();
      traceMesh.visible = true;
      traceGeo.setDrawRange(0, 0);
      await moveTo(tracePose(), 1.6);
      if (reducedMotion()) {
        traceGeo.setDrawRange(0, traceTotal);
        return;
      }
      const s = { k: 0 };
      await new Promise((resolve) => {
        traceTween = gsap.to(s, {
          k: 1,
          duration: 3.2,
          ease: 'power1.inOut',
          onUpdate: () => {
            const n = Math.floor((s.k * traceTotal) / (RAD * 6)) * RAD * 6;
            traceGeo.setDrawRange(0, n);
          },
          onComplete: resolve,
        });
      });
    },
    hideTrace() {
      traceMesh.visible = false;
    },
    /** Jump without animation: 'overview' | 'trace' | a place id. */
    jump(name) {
      const pose = name === 'overview' ? overviewPose() : name === 'trace' ? tracePose() : placePose(name);
      if (name === 'trace') {
        traceMesh.visible = true;
        traceGeo.setDrawRange(0, traceTotal);
      }
      moveTo(pose, 0);
      stage.render();
    },
    dispose() {
      stage.renderer.domElement.removeEventListener('wheel', onWheel);
      if (tween) tween.kill();
      if (traceTween) traceTween.kill();
      offLang();
      labels.dispose();
      stage.dispose();
    },
  };
}

