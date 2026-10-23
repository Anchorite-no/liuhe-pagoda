/**
 * Section fill ("poché") for the brick body: where the section plane cuts the walls,
 * floors and inner core, draw solid bands so the reader sees thickness, the corridor
 * and the central chamber. Built flat in local XY (x along the cut, y up) and turned
 * every frame to lie on the pagoda's section plane.
 *
 * The plane passes through the tower's axis, so the cut through an octagon of
 * circumradius R lies between R·cos 22.5° and R from the axis; we use the mean.
 */
import * as THREE from 'three';

const K = (1 + Math.cos(Math.PI / 8)) / 2;
const CORE_WALL = 1.5; // the inner wall round the central chamber (illustrative)

function quad(pos, x0b, x1b, x0t, x1t, y0, y1) {
  pos.push(x0b, y0, 0, x1b, y0, 0, x1t, y1, 0, x0b, y0, 0, x1t, y1, 0, x0t, y1, 0);
}

export function createCutFill(pagoda) {
  const pos = [];
  for (const s of pagoda.storeys) {
    const y0 = s.y0;
    const y1 = s.y1;
    const oB = s.shellR * K;
    const oT = s.shellRTop * K;
    const iB = (s.shellR - s.wall) * K;
    const iT = (s.shellRTop - s.wall) * K;
    const cB = s.coreR * K;
    const cT = s.coreRTop * K;
    for (const sg of [-1, 1]) {
      // outer brick wall
      quad(pos, sg * iB, sg * oB, sg * iT, sg * oT, y0, y1);
      // inner wall round the chamber
      quad(pos, sg * (cB - CORE_WALL), sg * cB, sg * (cT - CORE_WALL), sg * cT, y0, y1);
      // floor slab across the corridor
      quad(pos, sg * cB, sg * iB, sg * cB, sg * iB, y0, y0 + 0.36);
    }
    // chamber floor
    quad(pos, -(cB - CORE_WALL), cB - CORE_WALL, -(cB - CORE_WALL), cB - CORE_WALL, y0, y0 + 0.36);
  }
  const top = pagoda.storeys[6];
  quad(pos, -top.shellRTop * K, top.shellRTop * K, -top.shellRTop * K, top.shellRTop * K, top.y1 - 0.3, top.y1);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const mat = new THREE.MeshBasicMaterial({ color: '#3a2620', side: THREE.DoubleSide, fog: false });
  const mesh = new THREE.Mesh(g, mat);
  mesh.visible = false;
  mesh.renderOrder = 1;

  const COLORS = { real: '#3a2620', ink: '#262624', blueprint: '#9fd3ff', era: '#6a3f2b' };

  return {
    mesh,
    /** n: the section plane normal (pointing away from the camera). */
    align(n) {
      mesh.rotation.set(0, Math.atan2(-n.x, -n.z), 0);
      mesh.position.set(n.x * 0.03, 0, n.z * 0.03);
    },
    setLook(style, era) {
      mat.color.set(style === 'blueprint' ? COLORS.blueprint : era ? COLORS.era : COLORS[style] || COLORS.real);
      mat.transparent = style === 'blueprint';
      mat.opacity = style === 'blueprint' ? 0.55 : 1;
    },
  };
}
