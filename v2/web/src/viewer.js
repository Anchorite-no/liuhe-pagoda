/**
 * The real-time model (pagoda.glb) that sits behind the whole story.
 * It comes apart like an engine, with the same numbers as blender/lib/explode.py: one value u
 * runs the disassembly (0 whole → 1 timber casing opened in two halves → 2 seven storey groups
 * → 3 the lowest eaves in layers → 4 the brick body cut open). Parts only slide along their axes.
 * Each step of the story calls show(view, labels); the reader can drag to turn it at any time,
 * zoom with Ctrl + wheel / pinch / the buttons, or open explore mode for the wheel and a slider.
 * The time machine calls setHistory(state): the timber casing (T00…T12) burns away from the
 * bottom up with glowing edges and sparks, and grows back from the bottom when rebuilt; the
 * brick body can go too ('gone'), and the first tower of 970 is a faint ghost.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCallouts } from './callouts.js';
import { LABELS } from './content.js';

const BG = 0xece5d8; // rice paper

// ── the disassembly (keep in step with blender/lib/explode.py; Blender x, y = three x, -z) ──
const AZ = -Math.PI / 8; // the split plane runs through two opposite corners
const NX = Math.cos(AZ);
const NY = Math.sin(AZ);
const OPEN = 17;
const GAP = 3;
const LAYER = 2.4;
const LAYER_OUT = 2.2;
const FINIAL_UP = 6;
const LAYER_OF = { floor: 0, wall: 1, bracket: 2, bracketwall: 2, roof: 3, bells: 3 };
const ROOM = LAYER * 7 + 2;
export const STAGES = 4;

const clamp01 = (u) => Math.max(0, Math.min(1, u));
const smooth = (u) => {
  u = clamp01(u);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const seg = (u, a, b) => smooth((u - a) / (b - a));
const faceAngle = (k) => -Math.PI / 2 + (k * Math.PI) / 4;
/** octagon side a point belongs to (three.js coords) */
const sectorOf = (x, z) => (((Math.round((Math.atan2(-z, x) - faceAngle(0)) / (Math.PI / 4)) % 8) + 8) % 8);
const sideOf = (face) => (face < 0 ? 0 : Math.cos(faceAngle(face)) * NX + Math.sin(faceAngle(face)) * NY > 0 ? 1 : -1);

/** what the timeline needs to know about a piece, from its parent's name (T05, S2, S2_cut) */
function pieceInfo(parentName, part, face) {
  const timber = parentName[0] === 'T';
  const index = timber ? Number(parentName.slice(1, 3)) : Number(parentName[1]);
  return {
    part,
    face,
    timber,
    group: timber ? Math.floor(index / 2) : index,
    side: sideOf(face),
    layer: timber ? (index % 2) * 4 + (LAYER_OF[part] || 0) : 0,
  };
}

/** translation of piece p at u, written into out (three.js coords) */
function offsetAt(out, p, u) {
  let x = 0;
  let y = 0;
  let z = 0;
  if (p.timber && p.side) {
    const k = p.side * OPEN * seg(u, 0.2, 1);
    x += NX * k;
    y += NY * k;
  }
  const start = 1 + ((6 - p.group) / 6) * 0.35; // the top group moves first
  z += GAP * p.group * seg(u, start, start + 0.65);
  if (p.group >= 1) z += ROOM * seg(u, 2, 2.35);
  else if (p.timber) {
    const s0 = 2.3 + ((7 - p.layer) / 7) * 0.35; // the top layer first
    const k = seg(u, s0, s0 + 0.35);
    z += LAYER * p.layer * k;
    if (p.side) {
      const o = p.side * LAYER_OUT * (LAYER_OF[p.part] || 0) * k;
      x += NX * o;
      y += NY * o;
    }
  }
  return out.set(x, z, -y);
}
const finialLift = (u) => FINIAL_UP * seg(u, 0, 0.3) + GAP * 6 * seg(u, 1, 1.65) + ROOM * seg(u, 2, 2.35);

// what each step of the story shows: disassembly stage, camera, and whether it turns slowly
export const VIEWS = {
  whole: { u: 0, pos: [-94, 49, 94], tgt: [0, 32, 0], spin: true },
  eave: { u: 0, pos: [-33, 31, 24], tgt: [-5, 23.5, 5] },
  brackets: { u: 0, pos: [-15.5, 20.2, 15.5], tgt: [-5.6, 26.4, 5.6] },
  far: { u: 0, pos: [-110, 42, 117], tgt: [0, 30, 0], spin: true },
  history: { u: 0, pos: [-104, 44, 96], tgt: [0, 29, 0], spin: true },
  open: { u: 1, pos: [-140, 93, 98], tgt: [0, 36, 0] },
  groups: { u: 2, pos: [-166, 107, 117], tgt: [0, 42, 0] },
  layers: { u: 3, pos: [-112, 68, 79], tgt: [0, 16, 0] },
  cut: { u: 4, pos: [-91, 62, 64], tgt: [0, 17, 0] },
  practice: { u: 0, pos: [-94, 40, 98], tgt: [0, 30, 0], spin: true },
  // the climb: the camera winds up round the tower, one turn of the stair at a time
  floor0: { u: 0, pos: [-40, 9, 46], tgt: [0, 9, 0] },
};
// the middle of each open (ming) level, metres above the ground: floors 1–7
export const FLOOR_Y = [2.9, 12, 20.6, 28.8, 36.5, 43.8, 50.7];
FLOOR_Y.forEach((y, k) => {
  const a = 2.35 + k * 0.55;
  const r = 40 - k * 1.6;
  VIEWS[`floor${k + 1}`] = { u: 0, pos: [Math.cos(a) * r, y + 7, Math.sin(a) * r], tgt: [0, y + 2.5, 0] };
});
// the stage buttons in explore mode
export const STAGE_VIEWS = ['whole', 'open', 'groups', 'layers', 'cut'];

// Colours taken from photographs of the real tower (weathered maroon timber, near-black tiles),
// a little brighter than life so the parts still read on paper.
const MATS = {
  Tiles: { color: '#3a3d42', roughness: 0.62 },
  Timber: { color: '#66291d', roughness: 0.66 },
  TimberDark: { color: '#3a1a12', roughness: 0.74 },
  WallBoard: { color: '#74392c', roughness: 0.8 },
  FloorWood: { color: '#76472a', roughness: 0.78 },
  WindowVoid: { color: '#120b08', roughness: 1 },
  PlasterAged: { color: '#ece3d2', roughness: 0.9 },
  Stone: { color: '#9a958c', roughness: 0.85 },
  DarkStone: { color: '#4b453d', roughness: 0.7 },
  Iron: { color: '#5f4a32', roughness: 0.38, metalness: 0.75 },
  BrickCut: { color: '#c2592f', roughness: 0.9 },
};

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Weathered planks: boards of slightly different tone, dark seams, rain streaks running down. */
function plankTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  for (let x = 0; x < 256; x += 32) {
    const v = 196 + Math.random() * 59;
    g.fillStyle = `rgb(${v},${v * 0.97},${v * 0.95})`;
    g.fillRect(x, 0, 32, 256);
    g.fillStyle = 'rgba(0,0,0,0.6)';
    g.fillRect(x, 0, 2, 256);
  }
  for (let i = 0; i < 90; i++) {
    // grain and streaks: thin, long, darker or paler
    const dark = Math.random() < 0.75;
    g.fillStyle = dark ? `rgba(20,8,4,${Math.random() * 0.16})` : `rgba(255,240,225,${Math.random() * 0.1})`;
    const y = Math.random() * 256;
    g.fillRect(Math.random() * 256, y, 1 + Math.random() * 2.5, 30 + Math.random() * 220);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const NOISE_GLSL = /* glsl */ `
float bHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float bNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(bHash(i), bHash(i + vec3(1,0,0)), f.x), mix(bHash(i + vec3(0,1,0)), bHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(bHash(i + vec3(0,0,1)), bHash(i + vec3(1,0,1)), f.x), mix(bHash(i + vec3(0,1,1)), bHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}`;

/**
 * Everything the real-time materials add to three's standard material, in one patch:
 *  - planks: world-space triplanar texture (the model has no UVs)
 *  - tiles: grooves running down the roof, one channel of tiles every 0.33 m along each eave
 *  - weather: a slow world-space mottling, so no surface is one flat colour
 *  - burn: a dissolve driven by uniforms; the edge glows like embers and chars as it goes
 *  - soot: the brick body darkens while it stands without its timber casing
 *  - sketch: the casing turns pale and see-through, for eaves that stood but were never recorded
 */
function patchMaterial(mat, { planks = null, tiles = false, burn, dir, soot = null, sketch, key }) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uBurn = burn;
    sh.uniforms.uSketch = sketch;
    sh.uniforms.uDir = dir;
    sh.uniforms.uSoot = soot || { value: 0 };
    if (planks) sh.uniforms.tpMap = { value: planks };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying vec3 vWN;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#ifdef USE_INSTANCING\nvWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#endif\nvWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uBurn; uniform float uDir; uniform float uSoot; uniform float uSketch; varying vec3 vWPos; varying vec3 vWN;
         ${planks ? 'uniform sampler2D tpMap;' : ''}
         ${NOISE_GLSL}`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         ${planks ? `{ vec3 bw = pow(abs(vWN), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
           vec3 tx = texture2D(tpMap, vWPos.zy * 1.6).rgb; vec3 ty = texture2D(tpMap, vWPos.xz * 1.6).rgb; vec3 tz = texture2D(tpMap, vWPos.xy * 1.6).rgb;
           diffuseColor.rgb *= tx * bw.x + ty * bw.y + tz * bw.z; }` : ''}
         ${tiles ? `{ float a = atan(-vWPos.z, vWPos.x); float k = floor(a / 0.7853982 + 0.5) * 0.7853982;
           vec2 t = vec2(-sin(k), -cos(k)); float s = dot(vWPos.xz, t) / 0.33;
           float groove = smoothstep(0.0, 0.18, abs(fract(s) - 0.5) - 0.28);
           diffuseColor.rgb *= mix(1.0, 0.62, groove * smoothstep(0.2, 0.8, vWN.y)); }` : ''}
         diffuseColor.rgb *= 0.86 + 0.24 * bNoise(vWPos * vec3(0.9, 0.35, 0.9));
         float bn = 0.0;
         if (uBurn > 0.0) {
           float h = clamp(vWPos.y / 62.0, 0.0, 1.0);
           bn = 0.6 * bNoise(vWPos * 0.42) + 0.15 * bNoise(vWPos * 2.1) + 0.3 * (uDir > 0.0 ? h : 1.0 - h);
           float b = uBurn * 1.3 - 0.12;
           if (bn < b) discard;
           diffuseColor.rgb *= mix(0.08, 1.0, smoothstep(0.0, 0.14, bn - b));
         }
         if (uSoot > 0.0) diffuseColor.rgb *= mix(1.0, 0.36 + 0.3 * bNoise(vWPos * vec3(0.6, 0.15, 0.6)), uSoot);
         if (uSketch > 0.0) {
           diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.81, 0.72), 0.8 * uSketch);
           diffuseColor.a *= 1.0 - 0.7 * uSketch;
         }`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         if (uBurn > 0.0) {
           float e = 1.0 - smoothstep(0.0, 0.05, bn - (uBurn * 1.3 - 0.12));
           totalEmissiveRadiance += vec3(1.0, 0.38, 0.08) * e * 6.0 * step(uBurn, 0.999);
         }`,
      );
  };
  mat.customProgramCacheKey = () => key;
}

function describe(name, lang, instanced = false) {
  const zh = lang === 'zh';
  const t = name.match(/^T(\d\d)/);
  const s = name.match(/^S(\d)/);
  if (/^Finial/.test(name)) return zh ? ['塔刹', '元代遗物，铁铸。塔顶的“葫芦”和相轮都是它的一部分。'] : ['Finial', 'Yuan dynasty, cast iron: the gourd and rings at the very top.'];
  if (/^Podium/.test(name)) return zh ? ['台基', '塔下的砖石基座，高约 0.73 米。'] : ['Podium', 'The brick and stone base, about 0.73 m high.'];
  if (t) {
    const i = Number(t[1]);
    const kind = i % 2 === 0;
    const tierZh = `第 ${i + 1} 层外檐（${kind ? '明层' : '暗层'}）`;
    const tierEn = `Eave tier ${i + 1} (${kind ? 'open storey' : 'sealed storey'})`;
    let part = zh ? '清代木构，1900 年重建。' : 'Qing timber, rebuilt in 1900.';
    if (instanced) part = zh ? '斗拱：一层层木块与横木交错，把屋檐的重量传到柱子上。' : 'Bracket sets: blocks and arms that carry the eave down to the columns.';
    else if (/roof/.test(name)) part = zh ? '屋檐：深灰瓦、檐角起翘，下面露出两排椽头。清代木构。' : 'Roof: grey tiles, lifted corners, two rows of rafter ends below. Qing timber.';
    else if (/bracket/.test(name) || /Bracket/.test(name)) part = zh ? '斗拱：一层层木块与横木交错，把屋檐的重量传到柱子上。' : 'Bracket sets: blocks and arms that carry the eave down to the columns.';
    else if (/bells/.test(name)) part = zh ? '风铎：檐角挂的铁铃，十三层共 104 只。' : 'Wind-bells: 104 iron bells, one at every eave corner.';
    else if (/wall/.test(name)) part = zh ? '木板墙与小方窗。墙后是回廊，回廊里面才是砖塔身。' : 'Plank wall and small windows. Behind it runs the gallery, and behind that the brick body.';
    else if (/floor/.test(name)) part = zh ? '回廊地板：木构外檐与砖塔身之间可以行走的一圈。' : 'Gallery floor: the walkway between the timber shell and the brick body.';
    return [zh ? tierZh : tierEn, part];
  }
  if (s) {
    const f = Number(s[1]);
    const head = zh ? `砖塔身第 ${f + 1} 层（南宋）` : `Brick storey ${f + 1} (Southern Song)`;
    let part = zh ? '南宋重建的砖砌塔身，外刷白灰。' : 'Southern Song brick, plastered white.';
    if (/shell/.test(name)) part = zh ? '外墙：厚墙上开着壶门和壁龛。' : 'Outer wall, pierced by cusped doorways and niches.';
    else if (/core/.test(name)) part = zh ? '内墙：围着最中心的塔心室。' : 'Inner wall, around the central chamber.';
    else if (/plinth/.test(name)) part = zh ? '须弥座：回廊两侧的雕花基座，许多纹样与《营造法式》相合。' : 'Sumeru plinths along the corridor, carved with motifs found in the Yingzao Fashi.';
    else if (/stairs/.test(name)) part = zh ? '楼梯：藏在回廊里，一圈圈盘旋向上。' : 'Stairs, winding up inside the corridor.';
    else if (/floor/.test(name)) part = zh ? '楼板：把外墙和内墙连成一体。' : 'Floor slab tying the outer and inner walls together.';
    else if (/altar/.test(name)) part = zh ? '塔心室里的佛座。' : 'Altar platform in the central chamber.';
    return [head, part];
  }
  return null;
}

export function createViewer(container, { glb = 'media/pagoda.glb', onReady, onProgress, onWheelHint, onChange, onPart, onLand } = {}) {
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  // transparent: the ink field behind the page shows around the tower, and takes its shadow
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = !small; // phones: skip shadows, keep the frame rate
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // redrawn when parts move, otherwise every third frame (see frame)
  container.append(renderer.domElement);
  const callouts = createCallouts(container);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 380, 1100);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 3000);
  camera.position.set(...VIEWS.whole.pos);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...VIEWS.whole.tgt);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.55;
  controls.enableZoom = false; // the wheel scrolls the story; Ctrl + wheel or explore mode zooms
  controls.zoomSpeed = 1.4;
  controls.zoomToCursor = true;
  controls.minDistance = 6;
  controls.maxDistance = 620;
  controls.maxPolarAngle = Math.PI * 0.52;
  // not straight down: overhead, "up" on screen is undefined and a small drag spins the picture
  controls.minPolarAngle = Math.PI * 0.08;
  controls.enablePan = false;
  controls.autoRotateSpeed = 0.7;
  renderer.domElement.style.touchAction = 'pan-y';

  // warm key light from the front left, a cool rim from behind, a little warm fill
  const hemi = new THREE.HemisphereLight(0xdfe6f0, 0x8a7258, 1.0);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffd8ac, 3.8);
  key.position.set(-120, 150, 120);
  key.castShadow = true;
  key.shadow.mapSize.set(small ? 2048 : 4096, small ? 2048 : 4096);
  Object.assign(key.shadow.camera, { left: -80, right: 80, top: 120, bottom: -40, near: 10, far: 600 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xa9c1ff, 1.6);
  rim.position.set(140, 90, -150);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xff9d6a, 0.55);
  fill.position.set(80, 20, 140);
  scene.add(fill);

  // the floor: only the tower's shadow, falling on the ink field behind
  const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.ShadowMaterial({ color: 0x2a2018, opacity: 0.3 }));
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.receiveShadow = true;
  scene.add(shadowFloor);

  // the centre line of the drawing, drawn over the parts like a dash-dot line on paper
  const axisGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.7, 0), new THREE.Vector3(0, 70, 0)]);
  const axisLine = new THREE.Line(axisGeo, new THREE.LineDashedMaterial({ color: 0xb5321c, dashSize: 2.2, gapSize: 0.9, transparent: true, opacity: 0, depthTest: false }));
  axisLine.renderOrder = 10;
  scene.add(axisLine);

  // post: ambient occlusion makes the stacked eaves and brackets read; multisampled so edges stay clean
  let composer = null;
  let ao = null;
  if (!small) {
    const rt = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    ao = new GTAOPass(scene, camera, 1, 1);
    ao.updateGtaoMaterial({ radius: 1.4, distanceExponent: 1.5, thickness: 2, scale: 1.2, samples: 12 });
    ao.blendIntensity = 0.9;
    composer.addPass(ao);
    composer.addPass(new OutputPass());
  }

  const plank = plankTexture();
  // two sets of materials: the timber casing (it can burn) and the rest (brick body, podium, finial)
  const burnU = { timber: { value: 0 }, brick: { value: 0 } };
  const dirU = { timber: { value: 1 }, brick: { value: 1 } };
  const sootU = { value: 0 };
  const sketchU = { value: 0 }; // the casing drawn pale and see-through: eaves whose form is not known
  const noSketch = { value: 0 };
  const mats = {};
  const timberMats = {};
  for (const [name, p] of Object.entries(MATS)) {
    for (const timber of [false, true]) {
      const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(p.color), roughness: p.roughness, metalness: p.metalness || 0 });
      const kind = timber ? 'timber' : 'brick';
      patchMaterial(m, {
        planks: name === 'WallBoard' ? plank : null,
        tiles: name === 'Tiles',
        burn: burnU[kind],
        dir: dirU[kind],
        soot: timber ? null : sootU,
        sketch: timber ? sketchU : noSketch,
        key: `${name}|${kind}`,
      });
      (timber ? timberMats : mats)[name] = m;
    }
  }
  const allMats = [...Object.values(mats), ...Object.values(timberMats)];
  const isTimber = (o) => {
    for (let p = o; p; p = p.parent) if (/^T\d\d/.test(p.name)) return true;
    return false;
  };

  const groups = { tiers: [], storeys: [], cuts: [] };
  let finial = null;
  let finialRest = null;
  let finialC = null;
  let model = null;
  const pieces = []; // every part of the file, for labels: { c, parent, ...pieceInfo }
  const movers = []; // what actually moves: the parts merged by how they move { obj, rest, ...pieceInfo }
  const instances = []; // bracket sets drawn as instances: { mesh, i, I, c, parent, ...pieceInfo }
  const instMeshes = new Set();

  function register() {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3();
    model.traverse((o) => {
      const ud = o.userData || {};
      if (ud.part !== undefined && o.parent) {
        box.setFromObject(o);
        const face = Number(ud.face ?? -1);
        pieces.push({ obj: o, rest: o.position.clone(), c: box.getCenter(new THREE.Vector3()), parent: o.parent.name, ...pieceInfo(o.parent.name, ud.part, face) });
      }
      if (o.isInstancedMesh) {
        o.frustumCulled = false;
        instMeshes.add(o);
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        const gc = o.geometry.boundingBox.getCenter(new THREE.Vector3());
        for (let i = 0; i < o.count; i++) {
          const I = new THREE.Matrix4();
          o.getMatrixAt(i, I);
          const c = gc.clone().applyMatrix4(o.matrixWorld.clone().multiply(I));
          instances.push({ mesh: o, i, I, c, parent: o.name, ...pieceInfo(o.name, 'bracket', sectorOf(c.x, c.z)) });
        }
      }
    });
    finialRest = finial.position.clone();
    // where each storey, eave and the podium rest: the time machine lowers them back into place
    for (const o of [...groups.tiers, ...groups.storeys, model.getObjectByName('Podium')]) if (o) o.userData.restY = o.position.y;
    finialC = new THREE.Box3().setFromObject(finial).getCenter(new THREE.Vector3());
  }

  /** Parts that always move together (same parent, part and side of the split) become one mesh
   *  per material: the file's 1,800 meshes draw in a few hundred calls, in every pass (shadow,
   *  colour, ambient occlusion). Labels still use each part's own centre from `pieces`. */
  function mergeParts() {
    const byKey = new Map();
    for (const p of pieces) {
      const key = `${p.parent}|${p.part}|${p.timber ? p.side : 0}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(p);
    }
    const toParent = new THREE.Matrix4();
    const m = new THREE.Matrix4();
    for (const list of byKey.values()) {
      const p0 = list[0];
      const parent = p0.obj.parent;
      toParent.copy(parent.matrixWorld).invert();
      const byMat = new Map();
      for (const p of list) {
        p.obj.traverse((o) => {
          if (!o.isMesh || o.isInstancedMesh) return;
          // position and normal only: the materials are flat colour or world-space triplanar
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', o.geometry.attributes.position.clone());
          g.setAttribute('normal', o.geometry.attributes.normal.clone());
          g.setIndex(o.geometry.index.clone());
          g.applyMatrix4(m.multiplyMatrices(toParent, o.matrixWorld));
          if (!byMat.has(o.material)) byMat.set(o.material, []);
          byMat.get(o.material).push(g);
          o.geometry.dispose();
        });
        p.obj.removeFromParent();
        delete p.obj;
      }
      const holder = new THREE.Group();
      holder.name = `${p0.parent}_${p0.part}`; // describe() reads the tier or storey and the part from this
      for (const [mat, geos] of byMat) {
        const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
        mesh.name = holder.name;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        holder.add(mesh);
        for (const g of geos) g.dispose();
      }
      parent.add(holder);
      const { timber, side, group, layer, part } = p0;
      movers.push({ obj: holder, rest: holder.position.clone(), timber, side, group, layer, part });
    }
  }

  const draco = new DRACOLoader();
  draco.setDecoderPath('draco/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.load(
    glb,
    (gltf) => {
      model = gltf.scene;
      model.traverse((o) => {
        if (o.isMesh) {
          const nm = (o.material && o.material.name) || '';
          const k = Object.keys(MATS).find((m) => nm === m || nm.startsWith(m + '.'));
          if (k) o.material = (isTimber(o) ? timberMats : mats)[k];
          o.castShadow = true;
          o.receiveShadow = true;
        }
        if (/^T\d\d$/.test(o.name)) groups.tiers.push(o);
        else if (/^S\d_cut$/.test(o.name)) groups.cuts.push(o);
        else if (/^S\d$/.test(o.name)) groups.storeys.push(o);
        else if (o.name === 'Finial') finial = o;
      });
      for (const c of groups.cuts) c.visible = false;
      scene.add(model);
      register();
      mergeParts();
      apply();
      onReady && onReady();
    },
    (xhr) => onProgress && xhr.total && onProgress(xhr.loaded / xhr.total),
    (err) => console.error('[viewer] load failed', err),
  );

  /* ── the disassembly: one number u; whenever it changes, every part is placed ── */
  let u = 0;
  const _o = new THREE.Vector3();
  const _m = new THREE.Matrix4();
  function apply() {
    if (!model) return;
    shadowDirty = true;
    for (const p of movers) p.obj.position.copy(p.rest).add(offsetAt(_o, p, u));
    for (const q of instances) {
      offsetAt(_o, q, u);
      _m.copy(q.I);
      _m.elements[12] += _o.x;
      _m.elements[13] += _o.y;
      _m.elements[14] += _o.z;
      q.mesh.setMatrixAt(q.i, _m);
    }
    for (const m of instMeshes) {
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
    }
    if (!finial.userData.dropping) finial.position.copy(finialRest).y += finialLift(u);
    const cut = u > 3.5;
    for (const s of groups.storeys) s.visible = !cut && !hidden.brick && !s.userData.waiting;
    for (const s of groups.cuts) s.visible = cut && !hidden.brick;
    // the centre line shows while the parts are apart
    axisGeo.attributes.position.setY(1, finialC.y + finialLift(u) + 9);
    axisGeo.attributes.position.needsUpdate = true;
    axisGeo.computeBoundingSphere();
    axisLine.computeLineDistances();
    axisLine.material.opacity = 0.8 * seg(u, 0.4, 0.9);
    onChange && onChange({ u, stage: Math.abs(u - Math.round(u)) < 0.02 ? Math.round(u) : -1 });
  }

  /* ── the time machine ──
     What stood in a given year, as three layers: the brick body (standing or not), the timber
     casing (none; a pale sketch, for eaves that stood but whose form nobody recorded; or the
     eaves that stand today, rebuilt in 1900), and the ghost of the first tower of 970.
     Fire burns a layer away from the foot up; building sets it back piece by piece, storey on
     storey, each landing with a knock, so a rebuild looks like work, not like the fire undone. */
  const LOOKS = {
    ghost: { brick: true, timber: 'solid', ghost: true },
    gone: { brick: false, timber: 'none' },
    sketch: { brick: true, timber: 'sketch' },
    brick: { brick: true, timber: 'none', soot: true },
    whole: { brick: true, timber: 'solid' },
  };
  const hidden = { brick: false, timber: false };
  const look = { brick: true, timber: 'solid', ghost: false };
  const hist = { T: 0, B: 0, ghost: 0, soot: 0, sketch: 0, appear: 1, tT: 0, tB: 0, tGhost: 0, tSoot: 0, tSketch: 0, tAppear: 1 };
  const drops = []; // pieces being set in place: { obj, rest, t, kind }
  const DROP = 9; // metres a piece is lowered from
  function showGroup(kind, on) {
    hidden[kind] = !on;
    if (!model) return;
    // the finial stands on the top roof: it goes and comes with the casing
    if (kind === 'timber') for (const t of [...groups.tiers, finial]) t.visible = on;
    else {
      const podium = model.getObjectByName('Podium');
      if (podium) podium.visible = on;
      apply();
    }
    shadowDirty = true;
  }
  /** put every piece still being lowered straight in its place */
  function finishDrops() {
    for (const d of drops) {
      d.obj.position.y = d.rest;
      d.obj.userData.waiting = d.obj.userData.dropping = false;
      d.obj.visible = true;
    }
    drops.length = 0;
  }
  function lower(obj, rest, delay, kind) {
    obj.userData.waiting = true;
    obj.userData.dropping = true;
    obj.visible = false;
    drops.push({ obj, rest, t: -delay, kind });
  }
  /** the brick body goes up storey by storey; returns the time it takes */
  function buildBrick() {
    burnU.brick.value = hist.B = hist.tB = 0;
    showGroup('brick', true);
    const parts = [model.getObjectByName('Podium'), ...groups.storeys].filter(Boolean);
    parts.forEach((o, k) => lower(o, o.userData.restY, k * 0.24, 'brick'));
    return parts.length * 0.24 + 0.3;
  }
  /** the casing goes up eave by eave from the bottom, and the finial is set on the top roof */
  function buildTimber(delay) {
    burnU.timber.value = hist.T = hist.tT = 0;
    showGroup('timber', true);
    groups.tiers.forEach((t, k) => lower(t, t.userData.restY, delay + k * 0.16, 'timber'));
    lower(finial, finialRest.y, delay + groups.tiers.length * 0.16 + 0.15, 'brick');
  }
  function burn(kind) {
    const k = kind === 'timber' ? 'T' : 'B';
    dirU[kind].value = 1;
    hist[`t${k}`] = 1;
  }
  /** 'whole' | 'sketch' (eaves of unknown form) | 'brick' (casing burned off) | 'gone' (destroyed) | 'ghost' (the first tower) */
  function setHistory(state) {
    const L = LOOKS[state] || LOOKS.whole;
    const prev = { ...look };
    if (!model) return Object.assign(look, { ghost: false }, L);
    finishDrops();
    if (L.ghost && !prev.brick) {
      // the first tower: it simply fades up out of nothing
      burnU.brick.value = burnU.timber.value = hist.B = hist.tB = hist.T = hist.tT = 0;
      showGroup('brick', true);
      showGroup('timber', true);
      hist.ghost = 1;
      hist.appear = 0;
    } else {
      let wait = 0;
      if (L.brick && !prev.brick) wait = buildBrick();
      if (!L.brick && prev.brick) burn('brick');
      const had = prev.brick && prev.timber !== 'none';
      if (L.timber !== 'none' && !had) buildTimber(wait);
      if (L.timber === 'none' && prev.timber !== 'none' && prev.brick) burn('timber');
    }
    hist.tGhost = L.ghost ? 1 : 0;
    hist.tAppear = 1;
    hist.tSoot = L.soot ? 1 : 0;
    hist.tSketch = L.timber === 'sketch' ? 1 : 0;
    // jumping straight into a sketch (no building) starts it pale rather than fading from solid
    if (L.timber === 'sketch' && prev.timber === 'none') hist.sketch = 1;
    Object.assign(look, { ghost: false, soot: false }, L);
  }
  /** back to today at once, no fire and no building (leaving the time machine) */
  function resetHistory() {
    finishDrops();
    burnU.brick.value = burnU.timber.value = 0;
    Object.assign(hist, { T: 0, B: 0, ghost: 0, soot: 0, sketch: 0, appear: 1, tT: 0, tB: 0, tGhost: 0, tSoot: 0, tSketch: 0, tAppear: 1 });
    showGroup('brick', true);
    showGroup('timber', true);
    Object.assign(look, LOOKS.whole, { ghost: false, soot: false });
  }
  let fadeFlags = '';
  function stepHistory(dt) {
    let moving = drops.length > 0;
    const rate = dt / 2.4; // a whole casing burns in about two and a half seconds
    for (const [k, kind] of [['T', 'timber'], ['B', 'brick']]) {
      const tgt = hist[`t${k}`];
      let v = hist[k];
      if (v >= tgt) continue;
      v = Math.min(tgt, v + rate);
      hist[k] = v;
      burnU[kind].value = v;
      moving = true;
      if (dt < 1) sparks.emit(v, kind, dt);
      // the top roof burns last; the finial it carried comes down with it
      if (kind === 'timber' && v > 0.85 && !finial.userData.dropping) finial.visible = false;
      if (v >= 1) showGroup(kind, false);
    }
    for (const k of ['ghost', 'soot', 'sketch', 'appear']) {
      const tgt = hist[`t${k[0].toUpperCase()}${k.slice(1)}`];
      if (hist[k] === tgt) continue;
      hist[k] = tgt > hist[k] ? Math.min(tgt, hist[k] + dt / 1.2) : Math.max(tgt, hist[k] - dt / 1.2);
      moving = true;
    }
    // pieces being lowered into place: invisible until their turn, then down with a soft stop
    for (const d of drops) {
      d.t += dt;
      if (d.t < 0) continue;
      if (d.obj.userData.waiting) {
        d.obj.userData.waiting = false;
        d.obj.visible = true;
      }
      const k = Math.min(1, d.t / 0.42);
      d.obj.position.y = d.rest + DROP * Math.pow(1 - k, 3);
      if (k >= 1 && !d.landed) {
        d.landed = true;
        d.obj.userData.dropping = false;
        onLand && onLand(d.kind);
      }
    }
    for (let i = drops.length - 1; i >= 0; i--) if (drops[i].landed) drops.splice(i, 1);
    sootU.value = hist.soot;
    sketchU.value = hist.sketch;
    // see-through layers: everything for the ghost, the casing alone while it is a sketch
    const g = hist.ghost;
    const flags = `${g > 0}|${hist.sketch > 0}`;
    if (flags !== fadeFlags) {
      fadeFlags = flags;
      for (const m of Object.values(mats)) {
        m.transparent = g > 0;
        m.depthWrite = !(g > 0);
        m.needsUpdate = true;
      }
      for (const m of Object.values(timberMats)) {
        m.transparent = g > 0 || hist.sketch > 0;
        m.depthWrite = !(g > 0 || hist.sketch > 0.5);
        m.needsUpdate = true;
      }
    }
    // ambient occlusion would draw a dark smudge round every spark: it rests while they fly
    if (ao) ao.enabled = !(g > 0) && !sparks.live;
    const op = (1 - 0.84 * g) * hist.appear;
    for (const m of allMats) m.opacity = op;
    shadowFloor.visible = g < 0.5 && hist.B < 1;
    if (moving) shadowDirty = true;
    sparks.step(dt);
  }

  /** sparks thrown up while timber burns: a few points that rise, drift and fade out */
  const sparks = (() => {
    const N = 220;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const life = new Float32Array(N);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    // light is added, but the canvas's alpha is left alone: over the bare page a dying spark must
    // fade to nothing, not turn into a dark speck hanging in the air
    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.4,
        vertexColors: true,
        depthWrite: false,
        transparent: true,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
        blendSrcAlpha: THREE.ZeroFactor,
        blendDstAlpha: THREE.OneFactor,
      }),
    );
    pts.frustumCulled = false;
    pts.renderOrder = 5;
    scene.add(pts);
    let next = 0;
    let live = 0;
    return {
      get live() {
        return live > 0;
      },
      emit(burn, kind, dt) {
        // the fire front climbs the tower as the burn goes on
        const front = 62 * THREE.MathUtils.clamp((burn * 1.3 - 0.5) / 0.32, 0, 1);
        const n = Math.round(dt * (kind === 'timber' ? 70 : 50) + Math.random() * 0.6);
        for (let j = 0; j < n; j++) {
          const i = next;
          next = (next + 1) % N;
          const a = Math.random() * Math.PI * 2;
          const y = THREE.MathUtils.clamp(front + (Math.random() - 0.6) * 9, 0.5, 62);
          const r = (kind === 'timber' ? 10.5 - y * 0.075 : 7.6 - y * 0.06) + Math.random() * 1.5;
          pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
          vel.set([Math.cos(a) * (0.6 + Math.random()), 3 + Math.random() * 5, Math.sin(a) * (0.6 + Math.random())], i * 3);
          life[i] = 1;
        }
        live = 2.2;
        pts.visible = true;
      },
      step(dt) {
        if (live <= 0) return;
        live -= dt;
        pts.visible = live > 0;
        for (let i = 0; i < N; i++) {
          if (life[i] <= 0) {
            col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0;
            continue;
          }
          life[i] -= dt * (0.7 + (i % 7) * 0.1);
          const k = Math.max(0, life[i]);
          vel[i * 3] += (Math.random() - 0.5) * dt * 4;
          vel[i * 3 + 2] += (Math.random() - 0.5) * dt * 4;
          for (let c = 0; c < 3; c++) pos[i * 3 + c] += vel[i * 3 + c] * dt;
          // white-hot to orange to a dull red as it cools
          col[i * 3] = 1.6 * k;
          col[i * 3 + 1] = 0.9 * k * k;
          col[i * 3 + 2] = 0.35 * k * k * k;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
      },
    };
  })();

  /* ── callouts: names of parts, in both languages, following the parts ── */
  let labelSet = [];
  let labelU = 0; // labels show when u is at the stage they belong to
  let stageLabels = {}; // view name -> labels, for explore mode
  const membersOf = (l) => {
    if (l.members) return l.members;
    if (l.match === 'Finial') return (l.members = []);
    const specs = Array.isArray(l.match[0]) ? l.match : [l.match];
    l.members = [...pieces, ...instances].filter((p) => specs.some(([parent, part, face]) => p.parent === parent && p.part === part && (face === -1 || p.face === face)));
    return l.members;
  };
  function setLabels(list, atU) {
    labelSet = (list || []).map((l) => ({ ...l, members: null }));
    labelU = atU;
  }
  const _a = new THREE.Vector3();
  const _s = new THREE.Vector3();
  function drawLabels() {
    if (!model) return;
    if (exploring) {
      // in explore mode the names follow the slider: those of the nearest stage
      const k = Math.round(u);
      if (k !== labelU || !labelSet.length) setLabels(stageLabels[STAGE_VIEWS[k]], k);
    }
    const opacity = clamp01(1 - Math.abs(u - labelU) / 0.18);
    const w = container.clientWidth;
    const h = container.clientHeight;
    const list = [];
    if (opacity > 0.01)
      for (const l of labelSet) {
        if (l.match === 'Finial') _a.copy(finialC).y += finialLift(u);
        else {
          const members = membersOf(l);
          if (!members.length) continue;
          _a.set(0, 0, 0);
          for (const p of members) _a.add(_s.copy(p.c).add(offsetAt(_o, p, u)));
          _a.divideScalar(members.length);
        }
        _a.project(camera);
        if (_a.z > 1) continue;
        const x = ((_a.x + 1) / 2) * w;
        const y = ((1 - _a.y) / 2) * h;
        list.push({ id: l.id, x, y, lx: x + l.dx * w, ly: y + l.dy * h, text: LABELS[l.id], opacity });
      }
    callouts.set(list);
  }

  /* ── steps: u and the camera move together ── */
  let tween = null;
  let view = 'whole';
  function tweenU(to, dur) {
    tween = { from: u, to, t0: performance.now(), dur };
  }
  function show(name, labels) {
    const v = VIEWS[name];
    if (!v) return;
    view = name;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 10 : Math.min(4200, Math.max(1500, Math.abs(v.u - u) * 1600));
    tweenU(v.u, dur);
    setLabels(labels, v.u);
    moveCamera(v.pos, v.tgt, reduce ? 0.01 : Math.max(1.8, dur / 1000));
    controls.autoRotate = !!v.spin && !reduce;
  }
  /** explore mode: the stage buttons and the slider */
  function setStage(k) {
    show(STAGE_VIEWS[k], stageLabels[STAGE_VIEWS[k]]);
  }
  function setU(v) {
    tween = null;
    controls.autoRotate = false;
    u = Math.max(0, Math.min(STAGES, v));
    apply();
  }

  let camAnim = null;
  function moveCamera(pos, tgt, dur = 2.6) {
    camAnim = {
      p0: camera.position.clone(),
      t0: controls.target.clone(),
      p1: new THREE.Vector3(...pos),
      t1: new THREE.Vector3(...tgt),
      start: performance.now(),
      dur: dur * 1000,
    };
  }

  /* ── zoom: buttons (animated), Ctrl + wheel and pinch (immediate) ── */
  const _off = new THREE.Vector3();
  function zoomBy(f) {
    _off.copy(camera.position).sub(controls.target);
    _off.setLength(THREE.MathUtils.clamp(_off.length() * f, controls.minDistance, controls.maxDistance));
    camera.position.copy(controls.target).add(_off);
  }
  function zoom(f) {
    _off.copy(camera.position).sub(controls.target);
    _off.setLength(THREE.MathUtils.clamp(_off.length() * f, controls.minDistance, controls.maxDistance));
    moveCamera(controls.target.clone().add(_off).toArray(), controls.target.toArray(), 0.45);
  }
  function resetView() {
    const v = VIEWS[view];
    moveCamera(v.pos, v.tgt, 1.2);
  }
  renderer.domElement.addEventListener(
    'wheel',
    (e) => {
      if (exploring) {
        camAnim = null; // OrbitControls zooms toward the pointer
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        camAnim = null;
        controls.autoRotate = false;
        zoomBy(Math.exp(e.deltaY * 0.01));
      } else onWheelHint && onWheelHint();
    },
    { passive: false },
  );
  controls.addEventListener('start', () => {
    camAnim = null;
    controls.autoRotate = false;
  });

  /* ── explore mode: full screen, the wheel zooms ── */
  let exploring = false;
  /** The wheel zooms toward the pointer, and OrbitControls moves the turning point along with it.
   *  Off the tower's axis, every later drag swings the tower round that point and it leans across
   *  the screen; so the point is put back on the axis (only its height follows the pointer). */
  function keepOnAxis() {
    const t = controls.target;
    const y = THREE.MathUtils.clamp(t.y, 2, 72);
    if (Math.abs(t.x) < 1e-4 && Math.abs(t.z) < 1e-4 && y === t.y) return;
    camera.position.x -= t.x;
    camera.position.y += y - t.y;
    camera.position.z -= t.z;
    t.set(0, y, 0);
  }
  let offset = { x: 0, y: 0 };
  let offsetTo = { x: 0, y: 0 };
  // where the page's cards end, when a card is wider than the story column (0: the usual framing)
  let room = 0;
  const baseOffset = () => {
    const w = container.clientWidth;
    if (w <= 900) return { x: 0, y: 0.16 };
    // the tower in the middle of the free space right of the card
    return { x: Math.max(0.14, room / (2 * w)), y: 0.03 };
  };
  function setExplore(on) {
    exploring = on;
    controls.enableZoom = on;
    offsetTo = on ? (container.clientWidth > 900 ? { x: 0.1, y: 0.04 } : { x: 0, y: 0.12 }) : baseOffset();
    if (!on) setLabels([], labelU);
  }

  /* ── picking ── */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let infoEl = null;
  let highlighted = null;
  function pick(ev) {
    if (!model) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const shown = (o) => {
      for (let p = o; p; p = p.parent) if (!p.visible) return false;
      return true;
    };
    const hits = ray.intersectObject(model, true).filter((h) => shown(h.object));
    if (!hits.length) return showInfo(null);
    const o = hits[0].object;
    let zh = null;
    let named = o;
    while (named && !zh) {
      zh = describe(named.name, 'zh', named === o && o.isInstancedMesh);
      if (!zh) named = named.parent;
    }
    if (!zh) return showInfo(null);
    showInfo([zh, describe(named.name, 'en', named === o && o.isInstancedMesh)], o);
    // a tap on the tower can be heard: bells ring, wood knocks (main.js decides)
    onPart && onPart({ name: named.name, y: hits[0].point.y, x: ev.clientX / innerWidth });
  }
  function showInfo(pair, obj) {
    if (highlighted) {
      highlighted.mesh.material = highlighted.mat;
      highlighted = null;
    }
    if (!infoEl) return;
    if (!pair) {
      infoEl.classList.remove('is-on');
      return;
    }
    const [zh, en] = pair;
    infoEl.innerHTML = `<b>${zh[0]}</b><span>${zh[1]}</span><b lang="en">${en[0]}</b><span lang="en">${en[1]}</span>`;
    infoEl.classList.add('is-on');
    if (obj && obj.isMesh && !obj.isInstancedMesh) {
      const hm = obj.material.clone();
      hm.onBeforeCompile = obj.material.onBeforeCompile;
      hm.customProgramCacheKey = obj.material.customProgramCacheKey;
      hm.emissive = new THREE.Color(0x8a5a1e);
      hm.emissiveIntensity = 0.55;
      highlighted = { mesh: obj, mat: obj.material };
      obj.material = hm;
    }
  }
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => (down = [e.clientX, e.clientY]));
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 5) pick(e);
    down = null;
  });

  /* ── loop ── */
  function applyOffset() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const px = offset.x * w;
    const py = offset.y * h;
    if (Math.abs(px) < 0.5 && Math.abs(py) < 0.5) camera.clearViewOffset();
    else camera.setViewOffset(w, h, -px, py, w, h);
  }
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (composer) composer.setSize(w, h);
    if (!exploring) offset = offsetTo = baseOffset();
    applyOffset();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  /* ── the light lives: the sun swings slowly to and fro, clouds pass, the camera breathes ── */
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY_POS = key.position.clone();
  const warm = new THREE.Color(0xffd8ac);
  const pale = new THREE.Color(0xfff2e0);
  const sway = new THREE.Vector3();
  const _sw = new THREE.Vector3();
  let dragging = false;
  controls.addEventListener('start', () => (dragging = true));
  controls.addEventListener('end', () => (dragging = false));
  function liveLight(time) {
    // the sun: a slow swing of about forty degrees round the tower, a little up and down
    const a = 0.36 * Math.sin((time * 2 * Math.PI) / 28);
    const e = 0.08 * Math.sin((time * 2 * Math.PI) / 28 + 1.2);
    _sw.copy(KEY_POS).applyAxisAngle(THREE.Object3D.DEFAULT_UP, a);
    _sw.y = KEY_POS.y * (1 + e);
    key.position.copy(_sw);
    // passing clouds: the sun dims and pales for a while, then comes back warm
    const cloud = Math.max(0, Math.sin(time * 0.31) * 0.6 + Math.sin(time * 0.17 + 2.0) * 0.4);
    key.intensity = 3.8 * (1 - 0.3 * cloud);
    key.color.copy(warm).lerp(pale, cloud);
    hemi.intensity = 1.0 + 0.15 * cloud;
    rim.intensity = 1.6 * (1 - 0.2 * cloud);
  }
  function breathe(time) {
    // a slow loop around where the camera is: never adds up, never fights a drag
    camera.position.sub(sway);
    if (dragging || exploring) {
      sway.set(0, 0, 0);
      return;
    }
    const d = camera.position.distanceTo(controls.target) * 0.006;
    sway.set(Math.sin(time * 0.45) * d, Math.sin(time * 0.31 + 1.0) * d * 0.6, Math.cos(time * 0.45) * d * 0.8);
  }

  let running = false;
  let raf = 0;
  let shadowDirty = true;
  let shadowTick = 0;
  let lastNow = 0;
  let bellGlow = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 1 / 60;
    lastNow = now;
    if (model) stepHistory(reduceMotion ? 10 : dt);
    if (bellGlow > 0) {
      bellGlow = Math.max(0, bellGlow - dt * 0.7);
      timberMats.Iron.emissive.setRGB(1.4 * bellGlow, 0.85 * bellGlow, 0.3 * bellGlow);
    }
    if (!reduceMotion) liveLight(now / 1000);
    if (tween) {
      const t = clamp01((now - tween.t0) / tween.dur);
      u = tween.from + (tween.to - tween.from) * t; // the easing is inside each part's own move
      if (t >= 1) tween = null;
      apply();
    }
    if (camAnim) {
      const t = Math.min(1, (now - camAnim.start) / camAnim.dur);
      const k = ease(t);
      camera.position.lerpVectors(camAnim.p0, camAnim.p1, k);
      controls.target.lerpVectors(camAnim.t0, camAnim.t1, k);
      if (t >= 1) camAnim = null;
    }
    if (Math.abs(offset.x - offsetTo.x) > 1e-4 || Math.abs(offset.y - offsetTo.y) > 1e-4) {
      offset = { x: offset.x + (offsetTo.x - offset.x) * 0.12, y: offset.y + (offsetTo.y - offset.y) * 0.12 };
      applyOffset();
    }
    if (!reduceMotion) breathe(now / 1000);
    controls.update();
    if (exploring) keepOnAxis();
    if (!reduceMotion) {
      camera.position.add(sway);
      camera.lookAt(controls.target);
    }
    // the sun swings slowly: its shadow only needs redrawing every few frames, unless parts move
    if (shadowDirty || ++shadowTick % 3 === 0) {
      renderer.shadowMap.needsUpdate = true;
      shadowDirty = false;
    }
    if (composer) composer.render();
    else renderer.render(scene, camera);
    drawLabels();
  }

  if (import.meta.env.DEV)
    window.__viewer = {
      scene,
      camera,
      controls,
      renderer,
      get model() {
        return model;
      },
      get u() {
        return u;
      },
      pick,
      pieces,
      movers,
      instances,
      hist,
      /** advance the time machine by dt seconds and draw once (the page may be in a background tab) */
      step(dt, draw = true) {
        stepHistory(dt);
        controls.update();
        if (!draw) return;
        if (composer) composer.render();
        else renderer.render(scene, camera);
      },
    };

  return {
    show,
    setStage,
    setU,
    zoom,
    resetView,
    setExplore,
    setStageLabels(map) {
      stageLabels = map;
    },
    get u() {
      return u;
    },
    get ready() {
      return !!model;
    },
    attachInfo(el) {
      infoEl = el;
    },
    hideInfo() {
      showInfo(null);
    },
    /** keep the tower clear of a card whose right edge is px from the left of the stage (0: none) */
    setRoom(px) {
      room = px;
      if (!exploring) offsetTo = baseOffset();
    },
    setHistory,
    resetHistory,
    /** the finial is lifted off and set on the top again (a repair year in the time machine) */
    dropFinial() {
      if (!model || !finial.visible || finial.userData.dropping) return;
      lower(finial, finialRest.y, 0.2, 'brick');
    },
    /** the bells catch the light for a moment (the wind button) */
    glowBells() {
      bellGlow = 1;
    },
    start() {
      if (running) return;
      running = true;
      lastNow = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
