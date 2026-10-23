/**
 * Procedural model of the Liuhe Pagoda (六和塔), built entirely in code.
 *
 * Proportions follow the published figures (total ≈ 59.9 m, octagonal plan, 13 exterior
 * eaves over 7 brick storeys — "七明六暗"). Details are simplified and stylised; this is an
 * educational model, not a survey.
 *
 * Scene units are metres. The pagoda stands on the origin, ground at y = 0, front face
 * toward +Z. Octagon faces point at angles k·45° measured from +Z toward +X.
 *
 *   const pagoda = createPagoda();
 *   scene.add(pagoda.group);
 *   pagoda.setPartVisible('timber', false);   // reveal the Song brick body
 *   pagoda.setEraColors(true);                // Song / Yuan / Qing colour coding
 *   pagoda.setStyle('ink' | 'real' | 'blueprint');
 *   pagoda.setSection(true);                  // cut away the front half
 *   pagoda.setLamp(1);                        // lamp at the top + glowing windows
 *   stage.onTick((dt, t) => pagoda.update(t, { wind: 0.5 }));
 *
 * Parts (pagoda.parts[name] is a THREE.Group):
 *   plinth  stone base                              era: —
 *   timber  Qing exterior: walls, eaves, brackets, bells   era: qing
 *   shell   Southern Song brick outer wall (7 storeys)     era: song
 *   core    Southern Song brick inner core                 era: song
 *   floors  floor slabs of the 7 walkable storeys          era: song
 *   finial  Yuan spire (塔刹)                               era: yuan
 *   lamp    glow sprites + point light at the top storey
 *
 * Metadata: pagoda.tiers (13), pagoda.storeys (7), pagoda.height, pagoda.bellPositions,
 *           pagoda.facePoint(), pagoda.shellPoint().
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';

const HALF = Math.PI / 8;
const COS_H = Math.cos(HALF);

export const ERA_COLORS = {
  song: '#b07a5a',
  yuan: '#5f8a7e',
  qing: '#8b3a25',
  none: '#8e928c',
};

export const PART_ERA = {
  plinth: null,
  timber: 'qing',
  shell: 'song',
  core: 'song',
  floors: 'song',
  finial: 'yuan',
  lamp: null,
};

const PLINTH_H = 1.6;

/** Exterior tiers (13). Even indices are walkable storeys (明层), odd are sealed (暗层). */
function layoutTiers() {
  const tiers = [];
  let y = PLINTH_H;
  for (let i = 0; i < 13; i++) {
    const height = 4.8 - i * 0.115;
    const radius = 10.2 - i * 0.33; // circumradius of the timber wall
    tiers.push({
      index: i,
      y0: y,
      y1: y + height,
      height,
      radius,
      overhang: 3.1 - i * 0.07,
      kind: i % 2 === 0 ? 'ming' : 'an',
      storey: i % 2 === 0 ? i / 2 : null,
    });
    y += height;
  }
  return tiers;
}

/** Point on an octagon of circumradius R, side k (0..7), parameter u 0..1 along the side. */
function octPoint(R, k, u) {
  const a0 = k * (Math.PI / 4) - HALF;
  const a1 = k * (Math.PI / 4) + HALF;
  const x0 = R * Math.sin(a0);
  const z0 = R * Math.cos(a0);
  const x1 = R * Math.sin(a1);
  const z1 = R * Math.cos(a1);
  return new THREE.Vector2(x0 + (x1 - x0) * u, z0 + (z1 - z0) * u);
}

/** Octagonal prism (open or closed), faces aligned with the pagoda's facing. */
function octPrism(rBottom, rTop, height, y0, open = true) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, height, 8, 1, open, HALF);
  g.translate(0, y0 + height / 2, 0);
  return g;
}

/** Flat octagonal ring (annulus) at height y, facing up (or down if flip). */
function octAnnulus(rOuter, rInner, y, flip = false) {
  const pos = [];
  for (let k = 0; k < 8; k++) {
    const o0 = octPoint(rOuter, k, 0);
    const o1 = octPoint(rOuter, k, 1);
    const i0 = octPoint(rInner, k, 0);
    const i1 = octPoint(rInner, k, 1);
    const quad = [o0, o1, i1, o0, i1, i0];
    if (flip) quad.reverse();
    for (const p of quad) pos.push(p.x, y, p.y);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const uv = [];
  for (let i = 0; i < pos.length; i += 3) uv.push(pos[i] * 0.1, pos[i + 2] * 0.1);
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/**
 * Curved eave skirt with upturned corners.
 * rIn/rOut are circumradii; returns { top, under, fascia, ridges[], tips[] } geometries/points.
 */
function eave({ rIn, yIn, rOut, yOut, upturn = 0.8, flare = 0.9, thickness = 0.32, S = 8, rows = 6 }) {
  const top = [];
  const under = [];
  const fascia = [];
  const ridgePts = [];
  const tips = [];

  const point = (k, j, r) => {
    const u = j / S;
    const s = r / rows;
    const t = Math.abs(u - 0.5) * 2; // 0 at mid-side, 1 at corner
    const pin = octPoint(rIn, k, u);
    const pout = octPoint(rOut, k, u);
    const ext = flare * Math.pow(t, 3);
    const len = pout.length();
    pout.multiplyScalar((len + ext) / len);
    const xz = pin.clone().lerp(pout, s);
    const y = yIn + (yOut - yIn) * (2 * s - s * s) + upturn * Math.pow(t, 2.5) * Math.pow(s, 3);
    return new THREE.Vector3(xz.x, y, xz.y);
  };

  const sideLen = 2 * rOut * Math.sin(HALF);
  const slopeLen = Math.hypot(rOut - rIn, yIn - yOut);

  for (let k = 0; k < 8; k++) {
    const P = [];
    for (let r = 0; r <= rows; r++) {
      P.push([]);
      for (let j = 0; j <= S; j++) P[r].push(point(k, j, r));
    }
    const build = (offsetY, flip) => {
      const pos = [];
      const uv = [];
      const idx = [];
      for (let r = 0; r <= rows; r++) {
        for (let j = 0; j <= S; j++) {
          const p = P[r][j];
          pos.push(p.x, p.y - offsetY * (r / rows) ** 0.5, p.z);
          uv.push(((j / S) * sideLen) / 3.2, ((r / rows) * slopeLen) / 3.2);
        }
      }
      const W = S + 1;
      for (let r = 0; r < rows; r++) {
        for (let j = 0; j < S; j++) {
          const a = r * W + j;
          const b = a + 1;
          const c = a + W;
          const d = c + 1;
          if (flip) idx.push(a, b, c, b, d, c);
          else idx.push(a, c, b, b, c, d);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    };
    top.push(build(0, false));
    under.push(build(thickness, true));

    // Fascia board along the outer edge
    const fpos = [];
    const fidx = [];
    const fuv = [];
    for (let j = 0; j <= S; j++) {
      const p = P[rows][j];
      fpos.push(p.x, p.y, p.z, p.x, p.y - thickness, p.z);
      fuv.push(j / S, 0, j / S, 1);
    }
    for (let j = 0; j < S; j++) {
      const a = j * 2;
      fidx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(fpos, 3));
    fg.setAttribute('uv', new THREE.Float32BufferAttribute(fuv, 2));
    fg.setIndex(fidx);
    fg.computeVertexNormals();
    fascia.push(fg);

    // Hip ridge along the corner at the end of this side
    const rp = [];
    for (let r = 0; r <= rows; r++) rp.push(P[r][S].clone().add(new THREE.Vector3(0, 0.12, 0)));
    ridgePts.push(rp);
    tips.push(P[rows][S].clone());
  }

  const ridges = ridgePts.map((pts) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.14, 5, false));
  return { top, under, fascia, ridges, tips };
}

function bellGeometry() {
  const parts = [];
  const hanger = new THREE.CylinderGeometry(0.03, 0.03, 0.28, 4);
  hanger.translate(0, -0.14, 0);
  const body = new THREE.CylinderGeometry(0.1, 0.2, 0.36, 8, 1, false);
  body.translate(0, -0.46, 0);
  const lip = new THREE.TorusGeometry(0.2, 0.03, 4, 8);
  lip.rotateX(Math.PI / 2);
  lip.translate(0, -0.64, 0);
  const plate = new THREE.BoxGeometry(0.02, 0.24, 0.16);
  plate.translate(0, -0.84, 0);
  parts.push(hanger, body, lip, plate);
  return mergeGeometries(parts.map(ni));
}

const ni = (g) => (g.index ? g.toNonIndexed() : g);

/* ───────────────────────── Materials ───────────────────────── */

/** Back faces (seen through a section cut) render darker, like an interior in shadow. */
function withSectionFill(mat) {
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      '#include <dithering_fragment>\n  if (!gl_FrontFacing) { gl_FragColor.rgb *= 0.72; }',
    );
  };
  mat.customProgramCacheKey = () => 'sectionfill';
  return mat;
}

let toonGradient = null;
function getToonGradient() {
  if (toonGradient) return toonGradient;
  const data = new Uint8Array([70, 150, 230, 255]);
  toonGradient = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  toonGradient.minFilter = toonGradient.magFilter = THREE.NearestFilter;
  toonGradient.needsUpdate = true;
  return toonGradient;
}

function inkMaterial(color) {
  return withSectionFill(
    new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: getToonGradient(), side: THREE.FrontSide }),
  );
}

function eraMaterial(era) {
  return withSectionFill(
    new THREE.MeshStandardMaterial({ color: new THREE.Color(ERA_COLORS[era || 'none']), roughness: 0.85, metalness: 0 }),
  );
}

function blueprintMaterial() {
  return new THREE.MeshBasicMaterial({ color: '#0f3550', transparent: true, opacity: 0.28, depthWrite: false });
}

/* ───────────────────────── Builder ───────────────────────── */

export function createPagoda(options = {}) {
  const { interior = true, bells = true, lamp = true } = options;
  const tiers = layoutTiers();
  const group = new THREE.Group();
  group.name = 'LiuhePagoda';

  const parts = {};
  for (const name of Object.keys(PART_ERA)) {
    const g = new THREE.Group();
    g.name = name;
    parts[name] = g;
    group.add(g);
  }

  const allMeshes = [];
  const outlineMeshes = [];
  const edgeLines = [];
  let style = 'real';
  let eraOn = false;
  let clipPlanes = [];
  const partAlpha = {}; // last opacity set per part (outlines hide on faded parts)
  const outlineOn = (part) => style === 'ink' && !eraOn && (partAlpha[part] ?? 1) > 0.6;

  /** Register a mesh with its material variants. */
  function addMesh(partName, geometry, realMat, inkColor, { outline = true, castShadow = false } = {}) {
    withSectionFill(realMat);
    const mesh = new THREE.Mesh(geometry, realMat);
    mesh.castShadow = castShadow;
    mesh.userData.part = partName;
    mesh.userData.mats = {
      real: realMat,
      ink: inkMaterial(inkColor),
      era: eraMaterial(PART_ERA[partName]),
      blueprint: blueprintMaterial(),
    };
    parts[partName].add(mesh);
    allMeshes.push(mesh);
    if (outline) {
      const o = new THREE.Mesh(geometry, outlineMaterial);
      o.visible = false;
      o.userData.outlineOf = mesh;
      parts[partName].add(o);
      outlineMeshes.push(o);
    }
    return mesh;
  }

  const outlineMaterial = new THREE.MeshBasicMaterial({ color: '#1b1f22', side: THREE.BackSide });
  outlineMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n  transformed += normalize(objectNormal) * 0.09;',
    );
  };

  /* ── Plinth ── */
  {
    const tex = TX.stone();
    const g = mergeGeometries([
      octPrism(13.6, 13.4, 0.8, 0, false),
      octPrism(12.5, 12.3, 0.8, 0.8, false),
    ]);
    addMesh('plinth', g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), '#a9ada6');
  }

  /* ── Timber exterior (Qing) ── */
  const wallGeos = [];
  const bracketGeos = [];
  const eaveTop = [];
  const eaveUnder = [];
  const eaveFascia = [];
  const ridgeGeos = [];
  const bellPositions = [];

  tiers.forEach((t, i) => {
    const next = tiers[i + 1];
    const wallTop = t.y1 - 0.2;
    const taper = next ? (t.radius - next.radius) * 0.25 : 0.1;
    wallGeos.push(octPrism(t.radius, t.radius - taper, wallTop - t.y0, t.y0, true));

    // bracket sets (斗拱) under the eave: three per side
    const rB = t.radius - taper;
    for (let k = 0; k < 8; k++) {
      for (const u of [0.18, 0.5, 0.82]) {
        const p = octPoint(rB, k, u);
        const b = new THREE.BoxGeometry(0.42, 0.55, 1.0);
        b.translate(0, 0, 0.35);
        b.rotateY(k * (Math.PI / 4));
        b.translate(p.x, wallTop - 0.25, p.y);
        bracketGeos.push(b);
      }
    }

    const isTop = !next;
    const e = eave({
      rIn: isTop ? 1.0 : next.radius - 0.25,
      yIn: isTop ? t.y1 + 1.5 : t.y1 + 0.35,
      rOut: t.radius + t.overhang,
      yOut: t.y1 - 1.45,
      upturn: 1.15,
      flare: 1.2,
      rows: isTop ? 8 : 6,
    });
    eaveTop.push(...e.top);
    eaveUnder.push(...e.under);
    eaveFascia.push(...e.fascia);
    ridgeGeos.push(...e.ridges);
    for (const tip of e.tips) bellPositions.push(tip.clone().add(new THREE.Vector3(0, -0.15, 0)));
  });

  const wallTex = TX.timberWall();
  const wallGlow = TX.timberWallGlow();
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.8,
    emissiveMap: wallGlow,
    emissive: new THREE.Color('#ffb04a'),
    emissiveIntensity: 0,
  });
  addMesh('timber', mergeGeometries(wallGeos), wallMat, '#8c5b4c');
  addMesh(
    'timber',
    mergeGeometries(bracketGeos.map(ni)),
    new THREE.MeshStandardMaterial({ color: '#5a2216', roughness: 0.85 }),
    '#5b4a44',
    { outline: false },
  );
  const tiles = TX.roofTiles();
  addMesh('timber', mergeGeometries(eaveTop), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.75 }), '#3d4447');
  addMesh(
    'timber',
    mergeGeometries(eaveUnder),
    new THREE.MeshStandardMaterial({ color: '#4c2017', roughness: 0.9 }),
    '#6b5b55',
    { outline: false },
  );
  addMesh(
    'timber',
    mergeGeometries(eaveFascia),
    new THREE.MeshStandardMaterial({ color: '#6e2a1a', roughness: 0.8 }),
    '#4f4440',
    { outline: false },
  );
  addMesh(
    'timber',
    mergeGeometries(ridgeGeos.map(ni)),
    new THREE.MeshStandardMaterial({ color: '#2c3133', roughness: 0.7 }),
    '#202426',
    { outline: false },
  );

  /* Wind-bells (风铎) at every eave corner: 13 × 8 = 104 */
  let bellMesh = null;
  const bellPhase = [];
  if (bells) {
    const bellMat = new THREE.MeshStandardMaterial({ color: '#3b3a36', roughness: 0.5, metalness: 0.6 });
    withSectionFill(bellMat);
    bellMesh = new THREE.InstancedMesh(bellGeometry(), bellMat, bellPositions.length);
    bellMesh.userData.part = 'timber';
    bellMesh.userData.mats = {
      real: bellMat,
      ink: inkMaterial('#2a2d2f'),
      era: eraMaterial('qing'),
      blueprint: blueprintMaterial(),
    };
    const m = new THREE.Matrix4();
    bellPositions.forEach((p, i) => {
      m.makeTranslation(p.x, p.y, p.z);
      bellMesh.setMatrixAt(i, m);
      bellPhase.push(Math.random() * Math.PI * 2);
    });
    parts.timber.add(bellMesh);
    allMeshes.push(bellMesh);
  }

  /* ── Brick body (Southern Song): outer shell, inner core, floors ── */
  const storeys = [];
  for (let f = 0; f < 7; f++) {
    const a = tiers[2 * f];
    const b = tiers[Math.min(2 * f + 1, 12)];
    storeys.push({
      index: f,
      y0: a.y0,
      y1: b.y1,
      height: b.y1 - a.y0,
      shellR: a.radius - 1.3,
      shellRTop: b.radius - 1.3,
      wall: 1.4,
      coreR: a.radius - 1.3 - 3.6,
      coreRTop: b.radius - 1.3 - 3.6,
    });
  }

  if (interior) {
    const shellOuter = [];
    const shellInner = [];
    const shellCaps = [];
    const plinthBands = [];
    const corbels = [];
    const coreGeos = [];
    const floorGeos = [];
    storeys.forEach((s) => {
      shellOuter.push(octPrism(s.shellR, s.shellRTop, s.height, s.y0, true));
      shellInner.push(octPrism(s.shellR - s.wall, s.shellRTop - s.wall, s.height, s.y0, true));
      // 须弥座 band at the foot of each storey: base moulding, recessed waist, top moulding
      plinthBands.push(
        octPrism(s.shellR + 0.3, s.shellR + 0.3, 0.32, s.y0, false),
        octPrism(s.shellR + 0.05, s.shellR + 0.05, 0.6, s.y0 + 0.32, false),
        octPrism(s.shellR + 0.28, s.shellR + 0.28, 0.26, s.y0 + 0.92, false),
      );
      // corbelled brick eave (叠涩) at the top of each storey
      for (let c = 0; c < 4; c++) {
        corbels.push(octPrism(s.shellRTop + 0.18 * (c + 1), s.shellRTop + 0.18 * (c + 1), 0.18, s.y1 - 0.9 + c * 0.18, false));
      }
      coreGeos.push(octPrism(s.coreR, s.coreRTop, s.height, s.y0, false));
      floorGeos.push(octAnnulus(s.shellR - s.wall, s.coreR, s.y0 + 0.36, false), octAnnulus(s.shellR - s.wall, s.coreR, s.y0, true));
      // floor slab edge
      floorGeos.push(octPrism(s.shellR - s.wall, s.shellR - s.wall, 0.36, s.y0, true));
    });
    const top = storeys[6];
    shellCaps.push(octAnnulus(top.shellRTop, 0.01, top.y1, false));

    const shellTex = TX.brickShellFaces(5);
    addMesh('shell', mergeGeometries(shellOuter), new THREE.MeshStandardMaterial({ map: shellTex, roughness: 0.92 }), '#a07d6c');
    const innerTex = TX.brick(9, [140, 98, 78]);
    innerTex.repeat.set(10, 2);
    addMesh(
      'shell',
      mergeGeometries([...shellInner, ...shellCaps].map(ni)),
      new THREE.MeshStandardMaterial({ map: innerTex, roughness: 0.95, side: THREE.BackSide }),
      '#8a6d60',
      { outline: false },
    );
    addMesh(
      'shell',
      mergeGeometries([...plinthBands, ...corbels].map(ni)),
      new THREE.MeshStandardMaterial({ color: '#a57d63', roughness: 0.9 }),
      '#9b8173',
    );
    const coreTex = TX.brick(13, [128, 92, 74]);
    coreTex.repeat.set(4, 2);
    addMesh('core', mergeGeometries(coreGeos.map(ni)), new THREE.MeshStandardMaterial({ map: coreTex, roughness: 0.95 }), '#7d665b');
    addMesh(
      'floors',
      mergeGeometries(floorGeos.map(ni)),
      new THREE.MeshStandardMaterial({ color: '#9a8a76', roughness: 0.95, side: THREE.DoubleSide }),
      '#a39684',
      { outline: false },
    );
    parts.shell.visible = false;
    parts.core.visible = false;
    parts.floors.visible = false;
  }

  /* ── Finial (Yuan) ── */
  const topTier = tiers[12];
  const finialBase = topTier.y1 + 1.35;
  {
    const geos = [];
    geos.push(octPrism(1.15, 0.9, 0.45, finialBase, false));
    const dome = new THREE.SphereGeometry(0.95, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.scale(1, 0.7, 1);
    dome.translate(0, finialBase + 0.45, 0);
    geos.push(dome);
    const shaft = new THREE.CylinderGeometry(0.11, 0.13, 3.0, 8);
    shaft.translate(0, finialBase + 0.95 + 1.5, 0);
    geos.push(shaft);
    for (let r = 0; r < 5; r++) {
      const disc = new THREE.CylinderGeometry(0.72 - r * 0.08, 0.72 - r * 0.08, 0.1, 16);
      disc.translate(0, finialBase + 1.25 + r * 0.32, 0);
      geos.push(disc);
    }
    const pearl1 = new THREE.SphereGeometry(0.34, 14, 10);
    pearl1.translate(0, finialBase + 3.05, 0);
    const pearl2 = new THREE.SphereGeometry(0.24, 14, 10);
    pearl2.translate(0, finialBase + 3.55, 0);
    geos.push(pearl1, pearl2);
    addMesh(
      'finial',
      mergeGeometries(geos.map(ni)),
      new THREE.MeshStandardMaterial({ color: '#4a4d45', roughness: 0.45, metalness: 0.7 }),
      '#3a3f3c',
    );
  }
  const height = finialBase + 3.8;

  /* ── Lamp ── */
  let lampLight = null;
  const lampSprites = [];
  if (lamp) {
    const glowTex = TX.glow();
    const t = tiers[12];
    for (let k = 0; k < 8; k++) {
      const p = octPoint(t.radius + 0.6, k, 0.5);
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: glowTex, color: '#ffc46b', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
      );
      s.position.set(p.x, (t.y0 + t.y1) / 2 - 0.3, p.y);
      s.scale.set(7, 7, 1);
      parts.lamp.add(s);
      lampSprites.push(s);
    }
    lampLight = new THREE.PointLight('#ffb457', 0, 140, 1.6);
    lampLight.position.set(0, (t.y0 + t.y1) / 2, 0);
    parts.lamp.add(lampLight);
  }

  /* ───────────────────────── API ───────────────────────── */
  const _m4 = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _e = new THREE.Euler();
  const _one = new THREE.Vector3(1, 1, 1);

  function currentMat(mesh) {
    if (style === 'blueprint') return mesh.userData.mats.blueprint;
    if (eraOn) return mesh.userData.mats.era;
    return style === 'ink' ? mesh.userData.mats.ink : mesh.userData.mats.real;
  }

  function refresh() {
    for (const m of allMeshes) {
      m.material = currentMat(m);
    }
    for (const o of outlineMeshes) o.visible = outlineOn(o.userData.outlineOf.userData.part);
    for (const l of edgeLines) l.visible = style === 'blueprint';
    applyClip();
  }

  function eachMaterial(fn) {
    for (const m of allMeshes) for (const mat of Object.values(m.userData.mats)) fn(mat, m);
    fn(outlineMaterial);
  }

  function applyClip() {
    eachMaterial((mat) => {
      mat.clippingPlanes = clipPlanes;
      mat.clipShadows = true;
    });
    for (const l of edgeLines) l.material.clippingPlanes = clipPlanes;
  }

  function ensureEdges() {
    if (edgeLines.length) return;
    for (const m of allMeshes) {
      if (m.isInstancedMesh) continue;
      const eg = new THREE.EdgesGeometry(m.geometry, 28);
      const line = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: '#9fd3ff', transparent: true, opacity: 0.85 }));
      line.visible = false;
      m.parent.add(line);
      line.userData.edgesOf = m;
      edgeLines.push(line);
    }
  }

  const api = {
    group,
    parts,
    tiers,
    storeys,
    height,
    bellPositions,
    finialBase,
    THREE,

    /** The active section plane (shared by every material), or null. Mutate it to turn the cut. */
    get sectionPlane() {
      return clipPlanes[0] || null;
    },

    setPartVisible(name, visible) {
      if (parts[name]) parts[name].visible = visible;
    },

    /** 0..1. Applies to every material variant of that part. */
    setPartOpacity(name, alpha) {
      const meshes = allMeshes.filter((m) => m.userData.part === name);
      for (const m of meshes) {
        for (const mat of Object.values(m.userData.mats)) {
          if (mat === m.userData.mats.blueprint) continue;
          const wasT = mat.transparent;
          mat.transparent = alpha < 0.999;
          mat.opacity = alpha;
          mat.depthWrite = alpha >= 0.999;
          if (wasT !== mat.transparent) mat.needsUpdate = true;
        }
      }
      partAlpha[name] = alpha;
      for (const o of outlineMeshes) if (o.userData.outlineOf.userData.part === name) o.visible = outlineOn(name);
      if (parts[name]) parts[name].visible = alpha > 0.001;
    },

    /** 'real' | 'ink' | 'blueprint' */
    setStyle(next) {
      style = next;
      if (style === 'blueprint') ensureEdges();
      refresh();
    },
    getStyle: () => style,

    /** Colour every part by the dynasty it dates from. */
    setEraColors(on) {
      eraOn = !!on;
      refresh();
    },

    /**
     * Cut the model with a plane. Pass false to remove.
     * Default keeps the half behind the plane z = 0 (removes the front, +Z half).
     */
    setSection(on, normal = new THREE.Vector3(0, 0, -1), constant = 0) {
      clipPlanes = on ? [new THREE.Plane(normal.clone().normalize(), constant)] : [];
      eachMaterial((mat, mesh) => {
        if (mesh && mat === mesh.userData.mats.blueprint) return;
        if (mat === outlineMaterial) return;
        if (mat.side !== THREE.BackSide) mat.side = on ? THREE.DoubleSide : THREE.FrontSide;
        mat.needsUpdate = true;
      });
      applyClip();
    },

    /** Lamp at the top storey and warm window glow. 0..1 */
    setLamp(v) {
      for (const s of lampSprites) s.material.opacity = v;
      if (lampLight) lampLight.intensity = v * 900;
      wallMat.emissiveIntensity = v * 0.4;
    },

    /** Per-frame: sways the bells. Returns indices of bells that "rang" this frame (for audio). */
    update(elapsed, { wind = 0.3 } = {}) {
      if (!bellMesh) return [];
      const m = _m4;
      const q = _q;
      const e = _e;
      const one = _one;
      const rang = [];
      for (let i = 0; i < bellPositions.length; i++) {
        const ph = bellPhase[i];
        const a = wind * 0.35 * Math.sin(elapsed * (1.3 + (i % 5) * 0.11) + ph);
        e.set(a * 0.6, 0, a);
        q.setFromEuler(e);
        m.compose(bellPositions[i], q, one);
        bellMesh.setMatrixAt(i, m);
        if (wind > 0.25 && Math.random() < wind * 0.0009) rang.push(i);
      }
      bellMesh.instanceMatrix.needsUpdate = true;
      return rang;
    },

    /** Point on face k (0..7) of exterior tier i. hFrac 0..1 up the wall, out = metres outside the wall. */
    facePoint(i, k, hFrac = 0.5, out = 0.5) {
      const t = tiers[i];
      const p = octPoint((t.radius + out / COS_H), k, 0.5);
      return new THREE.Vector3(p.x, t.y0 + (t.y1 - t.y0) * hFrac, p.y);
    },

    /** Point on face k of brick storey f. */
    shellPoint(f, k, hFrac = 0.5, out = 0.3) {
      const s = storeys[f];
      const p = octPoint(s.shellR + out / COS_H, k, 0.5);
      return new THREE.Vector3(p.x, s.y0 + s.height * hFrac, p.y);
    },

    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
      for (const m of allMeshes) for (const mat of Object.values(m.userData.mats)) mat.dispose();
      outlineMaterial.dispose();
    },
  };

  return api;
}
