/**
 * The setting around the pagoda: sky, mist, light, Yuelun Hill (月轮山) behind,
 * the far south bank, trees, and optionally the Qiantang River Bridge (钱塘江大桥).
 *
 * World layout (metres):
 *   pagoda at the origin, ground y = 0, facing +Z (south, toward the river)
 *   river surface at y = WATER_Y, spanning z ≈ RIVER_NEAR … RIVER_FAR, running along X
 *   +X is downstream/east (toward Hangzhou Bay); the tide travels toward −X
 *
 *   const land = createLandscape(stage.scene, { preset: 'dawn', bridge: true });
 *   land.setPreset('night', 3);           // blend over 3 s
 *   stage.onTick((dt) => land.update(dt));
 *   land.river  // the createRiver() instance (if river: true)
 */
import * as THREE from 'three';
import { createRiver } from './water.js';
import { glow } from './textures.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const WATER_Y = -7;
export const RIVER_NEAR = 45;
export const RIVER_FAR = 1150;
export const BRIDGE_X = 420;

export const PRESETS = {
  dawn: {
    zenith: '#3d5468', horizon: '#e7c9a3', fog: '#c9c3b2', fogNear: 160, fogFar: 2600,
    sunDir: [0.85, 0.12, 0.5], sun: '#ffd09a', sunI: 2.2, hemiSky: '#c7cfd6', hemiGround: '#5d5545', hemiI: 0.9,
    water: { deep: '#3a3629', shallow: '#76694b', sky: '#d8c4a2', hill: '#3d4537', tower: '#4e261b' }, stars: 0, sunDisc: 1, exposure: 1.0,
  },
  day: {
    zenith: '#6f8ea4', horizon: '#dfe4df', fog: '#d3d9d4', fogNear: 220, fogFar: 3200,
    sunDir: [0.35, 0.8, 0.45], sun: '#fff4e0', sunI: 2.6, hemiSky: '#dde6ea', hemiGround: '#6b6550', hemiI: 1.1,
    water: { deep: '#3e3a2b', shallow: '#7a6e50', sky: '#c9d3d3', hill: '#46523f', tower: '#5a2a1e' }, stars: 0, sunDisc: 0, exposure: 1.0,
  },
  dusk: {
    zenith: '#2f3a55', horizon: '#e39a6a', fog: '#b9958a', fogNear: 160, fogFar: 2500,
    sunDir: [-0.85, 0.1, 0.45], sun: '#ffb27a', sunI: 2.0, hemiSky: '#9aa3be', hemiGround: '#4a3f38', hemiI: 0.8,
    water: { deep: '#332e27', shallow: '#6d5c49', sky: '#d4977a', hill: '#2f3029', tower: '#45201a' }, stars: 0.15, sunDisc: 1, exposure: 1.0,
  },
  night: {
    zenith: '#05080f', horizon: '#1b2733', fog: '#141d26', fogNear: 120, fogFar: 2200,
    sunDir: [-0.3, 0.55, 0.6], sun: '#9fb4d6', sunI: 0.45, hemiSky: '#2b3a52', hemiGround: '#0d0f12', hemiI: 0.35,
    water: { deep: '#0e1316', shallow: '#1f2628', sky: '#25344a', hill: '#080b0d', tower: '#1a0e0b' }, stars: 1, sunDisc: 0.6, exposure: 1.1,
  },
};

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
    gl_Position.z = gl_Position.w; // always at the far plane
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunDisc;
  uniform float uStars;
  varying vec3 vDir;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, -0.2, 1.0);
    vec3 col = mix(uHorizon, uZenith, pow(max(h, 0.0), 0.55));
    float sd = max(dot(d, normalize(uSunDir)), 0.0);
    col += uSunColor * (pow(sd, 900.0) * 3.0 + pow(sd, 12.0) * 0.25) * uSunDisc;
    if (uStars > 0.0 && d.y > 0.05) {
      vec3 cell = floor(d * 380.0);
      float s = hash(cell);
      col += vec3(step(0.9965, s)) * uStars * smoothstep(0.05, 0.4, d.y) * 0.9;
    }
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/* deterministic value noise for terrain */
function makeNoise(seed = 1) {
  const perm = new Uint8Array(512);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h, x, y) => {
    const v = h & 3;
    return (v & 1 ? -x : x) + (v & 2 ? -y : y);
  };
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const noise = (x, y) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const a = perm[X] + Y;
    const b = perm[X + 1] + Y;
    const l1 = grad(perm[a], x, y) + u * (grad(perm[b], x - 1, y) - grad(perm[a], x, y));
    const l2 = grad(perm[a + 1], x, y - 1) + u * (grad(perm[b + 1], x - 1, y - 1) - grad(perm[a + 1], x, y - 1));
    return l1 + v * (l2 - l1);
  };
  return (x, y, oct = 5) => {
    let f = 0;
    let amp = 0.5;
    let freq = 1;
    for (let i = 0; i < oct; i++) {
      f += amp * noise(x * freq, y * freq);
      freq *= 2.03;
      amp *= 0.5;
    }
    return f;
  };
}

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Terrain height at (x, z). Exported so chapters can place things on the ground. */
const fbm = makeNoise(42);
export function terrainHeight(x, z) {
  // north bank: a terrace around the pagoda, then Yuelun Hill rising behind it (−Z)
  if (z < RIVER_NEAR + 25) {
    const bank = smooth(RIVER_NEAR + 25, RIVER_NEAR - 15, z); // 0 at the riverbed edge, 1 inland
    const base = (WATER_Y - 6) * (1 - bank);
    const hill = smooth(-50, -280, z);
    const ridge = 110 * hill * (0.6 + 0.8 * fbm(x * 0.0022 + 3.1, z * 0.0022));
    const detail = 5 * fbm(x * 0.012, z * 0.012) * hill;
    const terrace = 1 - smooth(45, 100, Math.hypot(x, z * 1.2));
    return base + (ridge + detail) * (1 - terrace);
  }
  // river bed
  if (z < RIVER_FAR) return WATER_Y - 6;
  // south bank: low fields, then far hills
  const bank = smooth(RIVER_FAR, RIVER_FAR + 40, z);
  const far = smooth(RIVER_FAR + 500, RIVER_FAR + 1600, z);
  const hills = 210 * far * (0.5 + 0.8 * fbm(x * 0.0012 + 9.0, z * 0.0015));
  return WATER_Y - 6 + bank * (6 - WATER_Y + 2) + hills;
}

function buildTerrain() {
  const W = 6000;
  const D = 4200;
  const segX = 240;
  const segZ = 210;
  const geo = new THREE.PlaneGeometry(W, D, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, 600);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cMud = new THREE.Color('#7d735c');
  const cGrass = new THREE.Color('#6f7a60');
  const cForest = new THREE.Color('#46553f');
  const cFar = new THREE.Color('#62706d');
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = terrainHeight(x, z);
    pos.setY(i, y);
    if (y < WATER_Y + 1.5) tmp.copy(cMud);
    else if (z > RIVER_FAR) tmp.copy(cGrass).lerp(cFar, smooth(RIVER_FAR, RIVER_FAR + 1200, z));
    else tmp.copy(cGrass).lerp(cForest, smooth(4, 40, y));
    tmp.offsetHSL(0, 0, (fbm(x * 0.02, z * 0.02) - 0) * 0.06);
    colors.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, flatShading: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'Terrain';
  mesh.receiveShadow = true;
  return mesh;
}

function buildTrees(count = 5200) {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const col = new THREE.Color();
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let n = 0;
  let guard = 0;
  while (n < count && guard++ < count * 20) {
    const x = (rnd() - 0.5) * 2600;
    const z = -30 - rnd() * 700;
    if (Math.hypot(x, z * 1.3) < 70) continue; // keep the pagoda terrace clear
    const y = terrainHeight(x, z);
    if (y < 2) continue;
    const r = 2.6 + rnd() * 3.4;
    p.set(x, y + r * 0.7, z);
    s.set(r, r * (0.9 + rnd() * 0.7), r);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI);
    m.compose(p, q, s);
    mesh.setMatrixAt(n, m);
    col.setHSL(0.27 + rnd() * 0.08, 0.16 + rnd() * 0.1, 0.2 + rnd() * 0.1);
    mesh.setColorAt(n, col);
    n++;
  }
  mesh.count = n;
  mesh.name = 'Trees';
  return mesh;
}

/** Qiantang River Bridge (1937): stylised double-deck steel truss on piers. */
export function buildBridge() {
  const group = new THREE.Group();
  group.name = 'QiantangBridge';
  const steel = new THREE.MeshStandardMaterial({ color: '#4f5a5d', roughness: 0.6, metalness: 0.5 });
  const concrete = new THREE.MeshStandardMaterial({ color: '#9a9a90', roughness: 0.95 });
  const z0 = RIVER_NEAR - 30;
  const z1 = RIVER_FAR + 30;
  const spans = 16;
  const len = (z1 - z0) / spans;
  const deckY = 8;
  const trussH = 10;
  const halfW = 5;
  const box = (w, h, d, x, y, z, mat) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  for (let i = 0; i <= spans; i++) {
    const z = z0 + i * len;
    box(9, deckY - WATER_Y + 6, 4, 0, (deckY + WATER_Y - 6) / 2, z, concrete);
  }
  // decks
  box(10, 0.8, z1 - z0, 0, deckY, (z0 + z1) / 2, steel);
  box(12, 0.6, z1 - z0, 0, deckY + trussH, (z0 + z1) / 2, steel);
  // Warren truss with verticals, both sides, as thin boxes merged into one mesh
  const members = [];
  const panels = 4;
  for (let i = 0; i < spans; i++) {
    const za = z0 + i * len;
    for (let k = 0; k < panels; k++) {
      const a = za + (k * len) / panels;
      const b = za + ((k + 1) * len) / panels;
      for (const sx of [-halfW, halfW]) {
        members.push([sx, deckY, a, sx, deckY + trussH, a]);
        if (k % 2) members.push([sx, deckY + trussH, a, sx, deckY, b]);
        else members.push([sx, deckY, a, sx, deckY + trussH, b]);
      }
    }
  }
  const geos = [];
  const mid = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  for (const [ax, ay, az, bx, by, bz] of members) {
    const a = new THREE.Vector3(ax, ay, az);
    const b = new THREE.Vector3(bx, by, bz);
    const l = a.distanceTo(b);
    const g = new THREE.BoxGeometry(0.5, 0.5, l);
    g.applyMatrix4(new THREE.Matrix4().lookAt(a, b, Math.abs(ay - by) > l * 0.99 ? new THREE.Vector3(1, 0, 0) : up));
    mid.addVectors(a, b).multiplyScalar(0.5);
    g.translate(mid.x, mid.y, mid.z);
    geos.push(g);
  }
  for (const sx of [-halfW, halfW]) {
    for (const yy of [deckY, deckY + trussH]) {
      const g = new THREE.BoxGeometry(0.7, 0.7, z1 - z0);
      g.translate(sx, yy, (z0 + z1) / 2);
      geos.push(g);
    }
  }
  group.add(new THREE.Mesh(mergeGeometries(geos), steel));
  group.position.x = BRIDGE_X;
  return group;
}

export function createLandscape(scene, opts = {}) {
  const { preset = 'day', hills = true, trees = true, river = true, bridge = false, stage = null } = opts;
  const root = new THREE.Group();
  root.name = 'Landscape';
  scene.add(root);

  // Sky dome
  const skyUniforms = {
    uZenith: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3() },
    uSunColor: { value: new THREE.Color() },
    uSunDisc: { value: 0 },
    uStars: { value: 0 },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(5000, 32, 16),
    new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    }),
  );
  sky.name = 'Sky';
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  root.add(sky);

  scene.fog = new THREE.Fog('#cccccc', 200, 3000);

  const hemi = new THREE.HemisphereLight('#ffffff', '#444444', 1);
  const sun = new THREE.DirectionalLight('#ffffff', 2);
  sun.position.set(300, 400, 300);
  root.add(hemi, sun, sun.target);

  let terrain = null;
  let treeMesh = null;
  if (hills) {
    terrain = buildTerrain();
    root.add(terrain);
  }
  if (trees && hills) {
    treeMesh = buildTrees();
    root.add(treeMesh);
  }

  let riverApi = null;
  if (river) {
    riverApi = createRiver({ y: WATER_Y, z: (RIVER_NEAR + RIVER_FAR) / 2, depth: RIVER_FAR - RIVER_NEAR + 60, width: 6000 });
    root.add(riverApi.mesh);
  }

  let bridgeGroup = null;
  if (bridge) {
    bridgeGroup = buildBridge();
    root.add(bridgeGroup);
  }

  // Current values (lerped toward target)
  const cur = {};
  let from = null;
  let to = null;
  let tBlend = 1;
  let blendDur = 0;
  const C = (v) => new THREE.Color(v);

  function snapshot(p) {
    return {
      zenith: C(p.zenith),
      horizon: C(p.horizon),
      fog: C(p.fog),
      fogNear: p.fogNear,
      fogFar: p.fogFar,
      sunDir: new THREE.Vector3(...p.sunDir).normalize(),
      sun: C(p.sun),
      sunI: p.sunI,
      hemiSky: C(p.hemiSky),
      hemiGround: C(p.hemiGround),
      hemiI: p.hemiI,
      wDeep: C(p.water.deep),
      wShallow: C(p.water.shallow),
      wSky: C(p.water.sky),
      wHill: C(p.water.hill),
      wTower: C(p.water.tower),
      stars: p.stars,
      sunDisc: p.sunDisc,
      exposure: p.exposure,
    };
  }

  function applyValues(v) {
    skyUniforms.uZenith.value.copy(v.zenith);
    skyUniforms.uHorizon.value.copy(v.horizon);
    skyUniforms.uSunDir.value.copy(v.sunDir);
    skyUniforms.uSunColor.value.copy(v.sun);
    skyUniforms.uSunDisc.value = v.sunDisc;
    skyUniforms.uStars.value = v.stars;
    scene.fog.color.copy(v.fog);
    scene.fog.near = v.fogNear;
    scene.fog.far = v.fogFar;
    sun.color.copy(v.sun);
    sun.intensity = v.sunI;
    sun.position.copy(v.sunDir).multiplyScalar(800);
    hemi.color.copy(v.hemiSky);
    hemi.groundColor.copy(v.hemiGround);
    hemi.intensity = v.hemiI;
    if (riverApi) {
      riverApi.uniforms.uDeep.value.copy(v.wDeep);
      riverApi.uniforms.uShallow.value.copy(v.wShallow);
      riverApi.uniforms.uSky.value.copy(v.wSky);
      riverApi.uniforms.uHill.value.copy(v.wHill);
      riverApi.uniforms.uTowerColor.value.copy(v.wTower);
      riverApi.setSun(v.sunDir, v.sun, v.sunI * 0.6);
    }
    if (stage) stage.renderer.toneMappingExposure = v.exposure;
    Object.assign(cur, v);
  }

  function lerpValues(a, b, t) {
    const out = {};
    for (const k of Object.keys(a)) {
      const av = a[k];
      const bv = b[k];
      if (av.isColor) out[k] = av.clone().lerp(bv, t);
      else if (av.isVector3) out[k] = av.clone().lerp(bv, t).normalize();
      else out[k] = av + (bv - av) * t;
    }
    return out;
  }

  let presetName = preset;
  applyValues(snapshot(PRESETS[preset]));

  const api = {
    group: root,
    sky,
    sun,
    hemi,
    terrain,
    trees: treeMesh,
    river: riverApi,
    bridge: bridgeGroup,
    get preset() {
      return presetName;
    },
    /** Switch lighting preset ('dawn' | 'day' | 'dusk' | 'night'), blending over `duration` seconds. */
    setPreset(name, duration = 0) {
      if (!PRESETS[name]) return;
      presetName = name;
      const target = snapshot(PRESETS[name]);
      if (duration <= 0) {
        applyValues(target);
        tBlend = 1;
        return;
      }
      from = { ...cur };
      for (const k of Object.keys(from)) if (from[k] && from[k].clone) from[k] = from[k].clone();
      to = target;
      tBlend = 0;
      blendDur = duration;
    },
    /** Blend directly between two presets: t = 0 → a, 1 → b (for scroll-driven scenes). */
    mixPresets(a, b, t) {
      applyValues(lerpValues(snapshot(PRESETS[a]), snapshot(PRESETS[b]), Math.min(1, Math.max(0, t))));
    },
    update(dt, elapsed) {
      if (tBlend < 1 && from && to) {
        tBlend = Math.min(1, tBlend + dt / blendDur);
        const k = tBlend * tBlend * (3 - 2 * tBlend);
        applyValues(lerpValues(from, to, k));
      }
      if (riverApi && elapsed != null) riverApi.update(elapsed);
    },
    glowTexture: glow,
    dispose() {
      root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
      scene.remove(root);
    },
  };
  return api;
}
