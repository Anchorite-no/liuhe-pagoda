/**
 * The quiet, misty setting for the ch4 pagoda: ground, terrace, a few trees and
 * rings of far hills that fade into fog. Light enough for the light theme.
 * Three looks follow the drawing style: real (river mist), ink (paper), blueprint.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const HALF = Math.PI / 8;

export const PALETTES = {
  real: {
    bg: '#e3e6e0',
    ground: '#c6c9bc',
    terrace: '#b5b3a9',
    path: '#c0bdb2',
    hills: ['#d3d8d3', '#c4ccc8', '#b3bdba'],
    tree: '#93a08f',
    fog: [170, 640],
    hemi: 1.35,
    sun: 2.3,
  },
  ink: {
    bg: '#ece8dc',
    ground: '#e1dccd',
    terrace: '#d2ccbb',
    path: '#d9d3c3',
    hills: ['#dcd9cf', '#cbc9c0', '#b7b7af'],
    tree: '#a3a59c',
    fog: [170, 640],
    hemi: 1.5,
    sun: 1.8,
  },
  blueprint: {
    bg: '#163049',
    fog: null,
    hemi: 1,
    sun: 1,
  },
  dusk: {
    bg: '#5b6873',
    ground: '#6f746e',
    terrace: '#676761',
    path: '#6d6c66',
    hills: ['#66727b', '#5f6b74', '#56626b'],
    tree: '#4c5650',
    fog: [150, 600],
    hemi: 0.45,
    sun: 0.35,
  },
};

function rand(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/** A cylinder of far hills, lower toward the river side (+Z). */
function hillRing(radius, base, amp, seed, color) {
  const seg = 160;
  const g = new THREE.CylinderGeometry(radius, radius, 1, seg, 1, true);
  const pos = g.attributes.position;
  const r = rand(seed);
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const a = Math.atan2(x, z); // 0 toward +Z
    if (pos.getY(i) > 0) {
      const n = 0.55 * Math.sin(a * 3 + ph[0]) + 0.3 * Math.sin(a * 7 + ph[1]) + 0.15 * Math.sin(a * 17 + ph[2]);
      const riverSide = Math.max(0, Math.cos(a));
      const hgt = (base + amp * (0.5 + 0.5 * n)) * (1 - 0.75 * riverSide * riverSide);
      pos.setY(i, hgt);
    } else {
      pos.setY(i, -30);
    }
  }
  g.computeVertexNormals();
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, fog: true });
  return new THREE.Mesh(g, m);
}

function treeGeometry() {
  const trunk = new THREE.CylinderGeometry(0.25, 0.35, 3, 5);
  trunk.translate(0, 1.5, 0);
  const crown = new THREE.IcosahedronGeometry(2.6, 1);
  crown.scale(1, 1.2, 1);
  crown.translate(0, 4.6, 0);
  const crown2 = new THREE.IcosahedronGeometry(1.8, 1);
  crown2.translate(1.1, 6.3, 0.4);
  return mergeGeometries([trunk, crown, crown2].map((g) => (g.index ? g.toNonIndexed() : g)));
}

export function createScenery(scene, { shadows = true } = {}) {
  const group = new THREE.Group();
  group.name = 'ch4-scenery';
  scene.add(group);

  const groundMat = new THREE.MeshStandardMaterial({ color: PALETTES.real.ground, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(900, 48), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = shadows;
  group.add(ground);

  const terraceMat = new THREE.MeshStandardMaterial({ color: PALETTES.real.terrace, roughness: 0.95 });
  const terrace = new THREE.Mesh(new THREE.CylinderGeometry(23, 23.8, 0.4, 8, 1, false, HALF), terraceMat);
  terrace.position.y = 0.2;
  terrace.receiveShadow = shadows;
  group.add(terrace);

  const pathMat = new THREE.MeshStandardMaterial({ color: PALETTES.real.path, roughness: 0.95 });
  const path = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.3, 46), pathMat);
  path.position.set(0, 0.15, 46);
  path.receiveShadow = shadows;
  group.add(path);

  // Trees: a loose ring, leaving the view toward the river (+Z) open.
  const r = rand(42);
  const spots = [];
  while (spots.length < 70) {
    const a = r() * Math.PI * 2;
    const d = 42 + r() * 120;
    const front = Math.cos(a);
    if (front > 0.5 && d < 140) continue;
    spots.push([Math.sin(a) * d, Math.cos(a) * d, 0.7 + r() * 0.6, r() * Math.PI]);
  }
  const treeMat = new THREE.MeshStandardMaterial({ color: PALETTES.real.tree, roughness: 1 });
  const trees = new THREE.InstancedMesh(treeGeometry(), treeMat, spots.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  spots.forEach(([x, z, s, rot], i) => {
    e.set(0, rot, 0);
    q.setFromEuler(e);
    m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s, s));
    trees.setMatrixAt(i, m4);
  });
  trees.castShadow = shadows;
  trees.receiveShadow = false;
  group.add(trees);

  const hills = [
    hillRing(300, 26, 34, 3, PALETTES.real.hills[0]),
    hillRing(420, 46, 56, 9, PALETTES.real.hills[1]),
    hillRing(560, 70, 80, 21, PALETTES.real.hills[2]),
  ];
  for (const hl of hills) group.add(hl);

  // Blueprint grid (only in blueprint style)
  const grid = new THREE.GridHelper(240, 48, '#6f9fc4', '#2c5476');
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  grid.position.y = 0.02;
  grid.visible = false;
  scene.add(grid);

  // Lights
  const hemi = new THREE.HemisphereLight('#f4f6f1', '#8f8573', PALETTES.real.hemi);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff1dc', PALETTES.real.sun);
  sun.position.set(62, 115, 78);
  sun.target.position.set(0, 18, 0);
  scene.add(sun, sun.target);
  if (shadows) {
    sun.castShadow = true;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    const c = sun.shadow.camera;
    c.left = -48;
    c.right = 48;
    c.top = 60;
    c.bottom = -40;
    c.near = 40;
    c.far = 300;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
  }
  const fill = new THREE.DirectionalLight('#dfe8f0', 0.55);
  fill.position.set(-80, 40, -50);
  scene.add(fill);

  const fog = new THREE.Fog(PALETTES.real.bg, ...PALETTES.real.fog);
  scene.fog = fog;
  scene.background = new THREE.Color(PALETTES.real.bg);

  const current = { bg: new THREE.Color(PALETTES.real.bg) };
  const tmp = new THREE.Color();

  /** Blend between two palettes (t = 0..1 toward `b`). */
  function applyPalette(a, b = a, t = 0) {
    const pa = PALETTES[a];
    const pb = PALETTES[b];
    const blueprint = a === 'blueprint';
    group.visible = !blueprint;
    grid.visible = blueprint;
    const col = (ka, kb) => tmp.set(ka).lerp(new THREE.Color(kb), t);
    scene.background.copy(col(pa.bg, pb.bg));
    if (blueprint) {
      scene.fog = null;
    } else {
      scene.fog = fog;
      fog.color.copy(scene.background);
      fog.near = pa.fog[0] + (pb.fog[0] - pa.fog[0]) * t;
      fog.far = pa.fog[1] + (pb.fog[1] - pa.fog[1]) * t;
      groundMat.color.copy(col(pa.ground, pb.ground));
      terraceMat.color.copy(col(pa.terrace, pb.terrace));
      pathMat.color.copy(col(pa.path, pb.path));
      treeMat.color.copy(col(pa.tree, pb.tree));
      hills.forEach((hl, i) => hl.material.color.copy(col(pa.hills[i], pb.hills[i])));
    }
    hemi.intensity = pa.hemi + (pb.hemi - pa.hemi) * t;
    sun.intensity = pa.sun + (pb.sun - pa.sun) * t;
    current.bg.copy(scene.background);
  }

  return { group, grid, hemi, sun, fill, applyPalette };
}
