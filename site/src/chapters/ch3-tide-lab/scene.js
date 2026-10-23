/**
 * The tide lab's 3D stage: the shared landscape (Yuelun Hill, the river, the 1937 bridge),
 * the pagoda, a seawall with spectators for scale, and two set pieces that only appear for
 * their bore shape: a mid-river sandbank (cross tide) and a long dike (returning tide).
 *
 * Bore heights are to scale; motion is a ×20 time-lapse.
 */
import { createStage, THREE } from '../../three/stage.js';
import { createPagoda } from '../../three/pagoda.js';
import { createLandscape, WATER_Y, RIVER_NEAR, RIVER_FAR } from '../../three/landscape.js';
import { stone, glow } from '../../three/textures.js';
import * as audio from '../../core/audio.js';

export const TIMELAPSE = 20;

const START_X = 1500; // the front starts here (east, beyond the bridge)
const END_X = -760; // and runs out of view here
const Z_MID = (RIVER_NEAR + RIVER_FAR) / 2;
const CROSS_ANGLE = (26 * Math.PI) / 180;
// The dike leans 30° downstream from the north bank, making a pocket that throws the tide back at the seawall.
const DIKE_ANGLE = (30 * Math.PI) / 180;
const DIKE_LEN = 500;
const DIKE_ROOT = new THREE.Vector2(-470, 44);
const DIKE_TIP = DIKE_ROOT.clone().add(new THREE.Vector2(Math.sin(DIKE_ANGLE), Math.cos(DIKE_ANGLE)).multiplyScalar(DIKE_LEN));
const AMBIENCE = { river: 0.5, wind: 0.15, rumble: 0.18 };

// Idle camera and the release flights: [progress, camera, target]
const OVERVIEW = { pos: [-300, 48, 330], tgt: [150, 14, 40] };
const FLIGHTS = {
  line: [
    [0.0, [-300, 48, 330], [150, 14, 40]],
    [0.3, [-150, 24, 270], [420, 2, 380]],
    [0.52, [-170, 8, 330], [80, 8, 120]],
    [0.68, [-120, 6, 290], [0, 17, 40]],
    [0.86, [-60, 17, 290], [-320, -2, 220]],
    [1.0, [-10, 28, 330], [-420, -4, 330]],
  ],
  return: [
    [0.0, [-300, 48, 330], [150, 14, 40]],
    [0.28, [-150, 24, 270], [420, 2, 380]],
    [0.5, [-170, 8, 330], [80, 8, 120]],
    [0.6, [-130, 9, 300], [-20, 14, 60]],
    [0.7, [-250, 14, 22], [-300, -2, 300]],
    [0.85, [-285, 11, 28], [-370, -3, 280]],
    [1.0, [-280, 13, 24], [-330, -3, 260]],
  ],
};
FLIGHTS.cross = FLIGHTS.line;

function smooth(t) {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
}

/** Spray along up to two fronts, and a splash where a returning front hits the seawall. */
function createSpray(count = 1100, splashCount = 500) {
  const total = count * 2 + splashCount;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(total * 3);
  const seeds = new Float32Array(total * 3);
  for (let i = 0; i < total; i++) {
    seeds[i * 3] = Math.random();
    seeds[i * 3 + 1] = Math.random();
    seeds[i * 3 + 2] = RIVER_NEAR + 14 + Math.random() * (RIVER_FAR - RIVER_NEAR - 28);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 2.6,
    map: glow('rgba(255,255,255,1)', 'rgba(255,255,255,0)'),
    color: '#f4f5ef',
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.visible = false;
  const wob = (l, f, t) => f.wobble * (Math.sin(l * 0.006 + 1.7) * 9 + Math.sin(l * 0.031 + t * 0.6) * 2.2);
  const hide = (i) => {
    pos[i * 3 + 1] = -999;
  };
  return {
    points,
    /** splash: null or { x, z, height, strength } — where a front meets the wall. */
    update(fronts, elapsed, maskAt, splash) {
      let any = false;
      for (let k = 0; k < 2; k++) {
        const f = fronts[k];
        const on = f.height > 0.25;
        any = any || on;
        for (let j = 0; j < count; j++) {
          const i = k * count + j;
          if (!on) {
            hide(i);
            continue;
          }
          const back = seeds[i * 3];
          const ph = seeds[i * 3 + 1];
          const z = seeds[i * 3 + 2];
          const dx = f.dir.x;
          const dz = f.dir.y;
          let x = (f.pos - dz * z) / dx;
          const l = -dz * x + dx * z;
          const shift = -wob(l, f, elapsed) - back * 8 - ((elapsed * 0.7 + ph) % 1) * 3;
          x += dx * shift;
          const zz = z + dz * shift;
          if (maskAt && maskAt(k, x, zz) < 0.4) {
            hide(i);
            continue;
          }
          const life = (elapsed * 0.7 + ph) % 1;
          pos[i * 3] = x;
          pos[i * 3 + 1] = WATER_Y + f.height * (0.85 + 0.8 * Math.sin(life * Math.PI)) + back * 0.5;
          pos[i * 3 + 2] = zz;
        }
      }
      for (let j = 0; j < splashCount; j++) {
        const i = count * 2 + j;
        if (!splash) {
          hide(i);
          continue;
        }
        any = true;
        const a = seeds[i * 3];
        const ph = seeds[i * 3 + 1];
        const life = (elapsed * 0.8 + ph) % 1;
        const rise = Math.sin(life * Math.PI);
        pos[i * 3] = splash.x + (a - 0.5) * 70 * splash.strength;
        pos[i * 3 + 1] = WATER_Y + splash.height * (1 + 3.2 * rise * splash.strength) + a * 2;
        pos[i * 3 + 2] = splash.z + 4 - life * 10 * splash.strength;
      }
      geo.attributes.position.needsUpdate = true;
      points.visible = any;
      const hMax = Math.max(fronts[0].height, fronts[1].height);
      mat.opacity = Math.min(0.6, hMax * 0.22);
    },
  };
}

/** Stone seawall and promenade along the north bank, a railing and a crowd for scale. */
const WALL_Z = 48; // river face of the seawall
const WALL_TOP = 0.6;
function createBank() {
  const g = new THREE.Group();
  g.name = 'Seawall';
  const len = 1500;
  const depth = 22;
  const tex = stone();
  tex.repeat.set(len / 8, 3.4);
  const wallMat = new THREE.MeshStandardMaterial({ color: '#b9b7ab', map: tex, roughness: 0.95 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(len, WALL_TOP + 14, depth), wallMat);
  wall.position.set(0, (WALL_TOP - 14) / 2, WALL_Z - depth / 2);
  g.add(wall);
  // railing along the edge
  const railMat = new THREE.MeshStandardMaterial({ color: '#4d5352', roughness: 0.7, metalness: 0.2 });
  for (const y of [0.55, 1.1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.08), railMat);
    rail.position.set(0, WALL_TOP + y, WALL_Z - 0.6);
    g.add(rail);
  }
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 1.15, 0.1), railMat, Math.floor(len / 3));
  const m = new THREE.Matrix4();
  for (let i = 0; i < posts.count; i++) {
    m.makeTranslation(-len / 2 + i * 3, WALL_TOP + 0.57, WALL_Z - 0.6);
    posts.setMatrixAt(i, m);
  }
  g.add(posts);
  // spectators behind the railing
  const count = 520;
  const crowd = new THREE.InstancedMesh(
    new THREE.CapsuleGeometry(0.24, 1.15, 2, 6),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }),
    count,
  );
  const col = new THREE.Color();
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const palette = ['#2c3a4a', '#8b3a25', '#d8d2c2', '#3f5a4c', '#b98a3c', '#5b5f6a', '#a54f3a', '#e6e2d6'];
  for (let n = 0; n < count; ) {
    const x = -480 + rnd() * 840;
    if (Math.abs(x) < 30) continue; // keep the view of the pagoda clear
    const z = WALL_Z - 2 - Math.pow(rnd(), 1.6) * 9;
    m.makeTranslation(x, WALL_TOP + 0.82, z);
    crowd.setMatrixAt(n, m);
    col.set(palette[Math.floor(rnd() * palette.length)]);
    crowd.setColorAt(n, col);
    n++;
  }
  g.add(crowd);
  return g;
}

/** Long stone dike (丁坝) jutting into the river, as at Laoyancang. */
function createDike() {
  const g = new THREE.Group();
  g.name = 'Dike';
  const dir = DIKE_TIP.clone().sub(DIKE_ROOT);
  const len = dir.length();
  const tex = stone();
  tex.repeat.set(4, 60);
  const mat = new THREE.MeshStandardMaterial({ color: '#d2d0c4', map: tex, roughness: 0.95 });
  const topY = WATER_Y + 5;
  const body = new THREE.Mesh(new THREE.BoxGeometry(14, topY - (WATER_Y - 7), len), mat);
  body.position.set((DIKE_ROOT.x + DIKE_TIP.x) / 2, (topY + WATER_Y - 7) / 2, (DIKE_ROOT.y + DIKE_TIP.y) / 2);
  body.rotation.y = Math.atan2(dir.x, dir.y);
  g.add(body);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(9, 11, topY - (WATER_Y - 7), 16), mat);
  head.position.set(DIKE_TIP.x, body.position.y, DIKE_TIP.y);
  g.add(head);
  g.visible = false;
  return g;
}

/** Low sandbank in mid-river that splits the tide (cross tide). */
function createShoal() {
  const geo = new THREE.SphereGeometry(1, 40, 12);
  const mat = new THREE.MeshStandardMaterial({ color: '#a39675', roughness: 1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.set(230, 2.0, 95);
  mesh.position.set(START_X + 250, WATER_Y - 1.5, Z_MID);
  mesh.visible = false;
  return mesh;
}

/**
 * Let each bore front of the shared river be clipped by two half-planes, by patching the
 * river's shader in place (see NOTES.md for the request to add this to src/three/water.js).
 * Returns null, and the lab runs without masks, if the shared shader no longer matches.
 */
function addFrontMasks(river) {
  const mat = river.material;
  const u = mat.uniforms;
  const n = river.fronts.length;
  const OPEN = [0, 0, -1, 1];
  let ok = true;
  const patch = (src) => {
    const a = src.replace(
      /uniform float uWobble\[(\d+)\];/,
      (m, k) => `${m}
  uniform vec4 uMaskA[${k}];
  uniform vec4 uMaskB[${k}];
  uniform float uMaskInv[${k}];
  float frontMask(vec2 p, int i) {
    vec4 a = uMaskA[i];
    vec4 b = uMaskB[i];
    float m = smoothstep(-a.w, a.w, dot(p, a.xy) - a.z) * smoothstep(-b.w, b.w, dot(p, b.xy) - b.z);
    return uMaskInv[i] > 0.5 ? 1.0 - m : m;
  }`,
    );
    const b = a.replace(/float H = uHeight\[i\];\s*if \(H <= 0\.0\) continue;/, (m) => `${m}
      H *= frontMask(p, i);
      if (H <= 0.0) continue;`);
    if (a === src || b === a) ok = false;
    return b;
  };
  const vs = patch(mat.vertexShader);
  const fs = patch(mat.fragmentShader);
  if (!ok) {
    console.info('[ch3] river shader changed; returning tide shown without masks');
    return null;
  }
  u.uMaskA = { value: Array.from({ length: n }, () => new THREE.Vector4(...OPEN)) };
  u.uMaskB = { value: Array.from({ length: n }, () => new THREE.Vector4(...OPEN)) };
  u.uMaskInv = { value: new Array(n).fill(0) };
  mat.vertexShader = vs;
  mat.fragmentShader = fs;
  mat.needsUpdate = true;
  const state = Array.from({ length: n }, () => ({ a: OPEN, b: OPEN, invert: false }));
  const sm = (e0, e1, x) => {
    const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return k * k * (3 - 2 * k);
  };
  return {
    /** mask: { a: [nx, nz, c, soft], b: [...], invert } or null for none. */
    set(i, mask) {
      const m = mask || { a: OPEN, b: OPEN, invert: false };
      state[i] = { a: m.a || OPEN, b: m.b || OPEN, invert: !!m.invert };
      u.uMaskA.value[i].set(...state[i].a);
      u.uMaskB.value[i].set(...state[i].b);
      u.uMaskInv.value[i] = state[i].invert ? 1 : 0;
    },
    clear() {
      for (let i = 0; i < n; i++) this.set(i, null);
    },
    at(i, x, z) {
      const { a, b, invert } = state[i];
      const m = sm(-a[3], a[3], x * a[0] + z * a[1] - a[2]) * sm(-b[3], b[3], x * b[0] + z * b[1] - b[2]);
      return invert ? 1 - m : m;
    },
  };
}

/** Reflection of direction d about a wall with unit normal n. */
function reflect(d, n) {
  const k = 2 * d.dot(n);
  return new THREE.Vector2(d.x - k * n.x, d.y - k * n.y);
}

export function createTideScene(container, { onFrame } = {}) {
  const narrow = () => container.clientWidth / Math.max(1, container.clientHeight) < 1;
  const stage = createStage(container, {
    fov: 40,
    far: 12000,
    camera: OVERVIEW.pos,
    target: OVERVIEW.tgt,
    controls: true,
    controlsOptions: { minDistance: 60, maxDistance: 1500, maxPolarAngle: 1.42, rotateSpeed: 0.6 },
  });
  if (!stage) return null;
  // let vertical swipes scroll the page on touch screens; horizontal drags still orbit
  stage.renderer.domElement.style.touchAction = 'pan-y';

  const { scene, camera, controls } = stage;
  const land = createLandscape(scene, { preset: 'day', bridge: true, stage });
  const river = land.river;
  const pagoda = createPagoda({ interior: false });
  scene.add(pagoda.group);
  river.setReflections({ towerHeight: pagoda.height });
  const masks = addFrontMasks(river);
  const bank = createBank();
  const dike = createDike();
  const shoal = createShoal();
  const spray = createSpray();
  scene.add(bank, dike, shoal, spray.points);

  function fitFov() {
    camera.fov = narrow() ? 58 : 40;
    camera.updateProjectionMatrix();
  }
  fitFov();
  const ro = new ResizeObserver(fitFov);
  if (narrow()) {
    camera.position.set(-330, 44, 400);
    controls.target.set(110, -2, 70);
    controls.update();
  }
  ro.observe(container);

  // camera flights, one per shape
  const flights = {};
  for (const [name, keys] of Object.entries(FLIGHTS)) {
    flights[name] = {
      keys,
      pos: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k[1])), false, 'centripetal'),
      tgt: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k[2])), false, 'centripetal'),
    };
  }
  function flightParam(keys, p) {
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i][0];
      const b = keys[i + 1][0];
      if (p <= b || i === keys.length - 2) return (i + smooth((p - a) / (b - a))) / (keys.length - 1);
    }
    return 1;
  }
  const camP = new THREE.Vector3();
  const camT = new THREE.Vector3();

  // dike geometry for the returning tide
  const dikeDir = DIKE_TIP.clone().sub(DIKE_ROOT).normalize();
  const dikeN = new THREE.Vector2(dikeDir.y, -dikeDir.x); // normal facing the pocket (downstream side)
  const incoming = new THREE.Vector2(-1, 0);
  const reflected = reflect(incoming, dikeN);
  const dikeC = DIKE_ROOT.dot(dikeN);
  const hitX = DIKE_TIP.x + 10; // the incoming front reaches the dike's head here
  const tipRayN = new THREE.Vector2(-reflected.y, reflected.x); // normal of the ray reflected from the head
  if (tipRayN.x > 0) tipRayN.multiplyScalar(-1); // pointing west, into the pocket
  const MASKS = {
    // the incoming front is hidden in the dike's shadow (upstream of it, north of its head)
    incoming: { a: [-dikeN.x, -dikeN.y, -dikeC, 12], b: [0, -1, -DIKE_TIP.y, 30], invert: true },
    // the reflected front exists only in the pocket between the dike and the ray from its head
    reflected: { a: [dikeN.x, dikeN.y, dikeC, 12], b: [tipRayN.x, tipRayN.y, DIKE_TIP.dot(tipRayN), 40] },
  };

  let shape = 'line';
  let wind = 0;
  let run = null; // { result, shape, s, total, speed, ... }
  let fade = null; // fade-out after a run
  let resolveRun = null;
  let manualCam = false;
  let stillFrame = false; // reduced motion: a still result, no spray

  function boreParams(result) {
    const H = result.height;
    if (H < 0.15) return { height: 0.22, width: 70, wobble: 1.6 };
    if (H < 0.6) return { height: H, width: 32, wobble: 1.4 };
    if (H < 1.5) return { height: H, width: 16, wobble: 1.1 };
    return { height: H, width: 10, wobble: 1 };
  }

  function totalFor(sh) {
    if (sh === 'return') return START_X - hitX + 820;
    return START_X - END_X;
  }

  /** Place the fronts for travel distance s (metres from the start). */
  function layout(sh, s, bp) {
    const H = bp.height;
    if (sh === 'cross') {
      const xc = START_X - s; // crossing point, just upstream of the sandbank
      const sig = -xc * Math.cos(CROSS_ANGLE);
      const off = Z_MID * Math.sin(CROSS_ANGLE);
      river.setBore(0, { dir: [-Math.cos(CROSS_ANGLE), Math.sin(CROSS_ANGLE)], pos: sig + off, height: H * 0.72, width: bp.width, wobble: bp.wobble });
      river.setBore(1, { dir: [-Math.cos(CROSS_ANGLE), -Math.sin(CROSS_ANGLE)], pos: sig - off, height: H * 0.72, width: bp.width, wobble: bp.wobble });
      return xc;
    }
    const x = START_X - s;
    if (sh === 'return' && masks) {
      river.setBore(0, { dir: [-1, 0], pos: -x, height: H, width: bp.width, wobble: bp.wobble });
      // the mirror image of the incoming front; its mask keeps it to the side the dike throws it
      const pos1 = -x - 2 * dikeC * incoming.dot(dikeN);
      river.setBore(1, { dir: [reflected.x, reflected.y], pos: pos1, height: H * 0.9, width: bp.width * 0.9, wobble: bp.wobble * 0.7 });
      return x;
    }
    river.setBore(0, { dir: [-1, 0], pos: -x, height: H, width: bp.width, wobble: bp.wobble });
    river.setBore(1, { height: 0 });
    return x;
  }

  /** Distance s that makes a good still frame (reduced motion / skip). */
  function snapshotS(sh) {
    if (sh === 'return') return START_X - hitX + 330;
    if (sh === 'cross') return START_X - 60;
    return START_X - 90;
  }

  function applyMasks(sh) {
    if (!masks) return;
    if (sh === 'return') {
      masks.set(0, MASKS.incoming);
      masks.set(1, MASKS.reflected);
    } else masks.clear();
  }

  function setShape(next) {
    shape = next;
    dike.visible = next === 'return';
    shoal.visible = next === 'cross';
  }

  function setWind(ms) {
    wind = ms;
    river.setWave(0.18 + 0.014 * Math.abs(ms));
  }

  function setCameraPose(pos, tgt) {
    camera.position.set(...pos);
    controls.target.set(...tgt);
    camera.lookAt(controls.target);
  }

  // portrait screens: a little further back and looking lower, so the pagoda and the river both fit
  const overview = () => (narrow() ? { pos: [-330, 44, 400], tgt: [110, -2, 70] } : OVERVIEW);

  function resetView() {
    if (run) return;
    const o = overview();
    setCameraPose(o.pos, o.tgt);
    controls.update();
  }

  function finish() {
    if (!run) return;
    const r = run;
    run = null;
    controls.enabled = true;
    audio.setAmbience(AMBIENCE, 2);
    fade = { t: 0, dur: 2.2, from: [river.fronts[0].height, river.fronts[1].height] };
    if (resolveRun) resolveRun(r);
    resolveRun = null;
  }

  /**
   * Run the bore past the pagoda. instant: show a still frame of the result (no motion).
   * Returns a promise that resolves when the run (or still) is done.
   */
  function release(result, { instant = false } = {}) {
    if (run) finish();
    fade = null;
    const bp = boreParams(result);
    const total = totalFor(shape);
    const real = result.speed > 0 ? result.speed : 6;
    applyMasks(shape);
    stillFrame = instant;
    if (instant) {
      layout(shape, snapshotS(shape), bp);
      audio.surge(Math.min(1, 0.15 + result.height / 3.5), 4);
      return Promise.resolve();
    }
    controls.enabled = false;
    manualCam = false;
    run = {
      result,
      bp,
      shape,
      s: 0,
      total,
      speed: real * TIMELAPSE,
      surged: false,
      fromPos: camera.position.clone(), // ease out of wherever the reader left the camera
      fromTgt: controls.target.clone(),
    };
    layout(shape, 0, bp);
    return new Promise((res) => {
      resolveRun = res;
    });
  }

  /** Jump to the still frame of the current run. */
  function skip() {
    if (!run) return;
    const r = run;
    finish();
    fade = null;
    layout(r.shape, snapshotS(r.shape), r.bp);
    resetView();
  }

  /** Development helper: freeze the scene at progress p (0..1) of a run with this result. */
  function pose(result, p) {
    finish();
    fade = null;
    const bp = boreParams(result);
    applyMasks(shape);
    layout(shape, p * totalFor(shape), bp);
    const f = flights[shape];
    const u = flightParam(f.keys, p);
    f.pos.getPoint(u, camP);
    f.tgt.getPoint(u, camT);
    camera.position.copy(camP);
    controls.target.copy(camT);
    camera.lookAt(camT);
  }

  function clear() {
    stillFrame = false;
    river.clearBores();
    if (masks) masks.clear();
    fade = null;
  }

  // the reader may grab the view during a run: stop steering the camera
  stage.renderer.domElement.addEventListener('pointerdown', () => {
    if (run) {
      manualCam = true;
      controls.enabled = true;
    }
  });

  let lastAmb = -1;
  stage.onTick((dt, elapsed) => {
    land.update(dt, elapsed);
    let near = 0;
    let frontX = null;
    if (run) {
      run.s = Math.min(run.total, run.s + run.speed * dt);
      const x = layout(run.shape, run.s, run.bp);
      frontX = x;
      const p = run.s / run.total;
      if (!manualCam) {
        const f = flights[run.shape];
        const u = flightParam(f.keys, p);
        f.pos.getPoint(u, camP);
        f.tgt.getPoint(u, camT);
        const k = smooth(p / 0.18);
        if (k < 1) {
          camP.lerpVectors(run.fromPos, camP, k);
          camT.lerpVectors(run.fromTgt, camT, k);
        }
        camera.position.copy(camP);
        controls.target.copy(camT);
        camera.lookAt(camT);
      }
      // sound: the rumble grows as the front nears the pagoda, a surge as it arrives
      near = Math.max(0, 1 - Math.abs(x) / 900);
      const I = Math.min(1, 0.2 + run.result.height / 3.5);
      const rumble = AMBIENCE.rumble + near * 0.75 * I;
      if (Math.abs(rumble - lastAmb) > 0.04) {
        audio.setAmbience({ ...AMBIENCE, rumble }, 0.5);
        lastAmb = rumble;
      }
      if (!run.surged && x < 380) {
        run.surged = true;
        audio.surge(I, 6.5);
      }
      if (run.s >= run.total) finish();
    } else if (fade) {
      fade.t += dt;
      const k = 1 - smooth(fade.t / fade.dur);
      river.setBore(0, { height: fade.from[0] * k });
      river.setBore(1, { height: fade.from[1] * k });
      if (fade.t >= fade.dur) clear();
    }
    let splash = null;
    const f1 = river.fronts[1];
    if (masks && shape === 'return' && f1.height > 0.25) {
      const zw = WALL_Z + 2;
      const xw = (f1.pos - f1.dir.y * zw) / f1.dir.x; // where the reflected front crosses the wall line
      const inPocket = masks.at(1, xw, zw + 6);
      if (inPocket > 0.3) splash = { x: xw, z: WALL_Z, height: f1.height, strength: inPocket };
    }
    if (stillFrame) spray.points.visible = false;
    else spray.update(river.fronts, elapsed, masks ? masks.at : null, splash);
    const rang = pagoda.update(elapsed, { wind: 0.25 + Math.max(0, wind) * 0.03 + near * 0.6 });
    if (rang.length) audio.bell(0.4 + Math.random() * 0.4);
    if (onFrame) onFrame(frontX);
  });

  return {
    stage,
    land,
    river,
    pagoda,
    setShape,
    setWind,
    release,
    skip,
    clear,
    pose,
    resetView,
    get running() {
      return !!run;
    },
    dispose() {
      ro.disconnect();
      stage.dispose();
    },
  };
}
