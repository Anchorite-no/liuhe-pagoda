/**
 * Build a dougong: a full-screen game with its own small three.js scene.
 * Thirteen pieces of a simplified Song bracket set lie on the bench round a column. Drag one
 * onto the glowing place where it belongs (or just click it). A piece can only go in once what
 * it rests on is in place; if not, it tells you what is missing, in both languages. When the
 * set is complete, load the eave on top and watch the weight travel down, piece by piece,
 * into the column. The proportions follow the Song module only loosely: a teaching model.
 *
 * open({ $, passport, onClose }) → close()
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import * as sound from './sound.js';
import { sayButton } from './speak.js';

// name, pinyin, English, what it does (zh, en)
const INFO = {
  ludou: ['栌斗', 'lú dǒu', 'cap block', '整组斗拱的底座，坐在柱头上。上面所有构件的重量，最后都压在它身上。', 'The base of the whole set, sitting on the column head; everything above ends up resting on it.'],
  nidao: ['泥道拱', 'nídào gǒng', 'wall arm', '顺着墙的方向，卡进栌斗的槽口，向左右伸出。', 'Runs along the wall, set into the cap block’s slot, reaching left and right.'],
  huagong: ['华拱', 'huá gǒng', 'projecting arm', '和泥道拱十字相交，向外挑出，把支点一步步推向屋檐。', 'Crosses the wall arm at right angles and reaches outward, carrying the support out towards the eave.'],
  sandou: ['散斗', 'sàn dǒu', 'small block', '小斗，坐在拱的两端，托起上一层。', 'A small block at each end of an arm, holding up the next layer.'],
  qixin: ['齐心斗', 'qíxīn dǒu', 'centre block', '正对柱心的小斗，坐在两拱交叉的地方。', 'A small block right over the column’s centre, where the two arms cross.'],
  jiaohu: ['交互斗', 'jiāohù dǒu', 'crossing block', '坐在华拱外端，开着十字口，让上面的令拱和耍头交叉卡住。', 'Sits on the outer end of the projecting arm, slotted both ways so the pieces above can cross in it.'],
  zhutou: ['柱头枋', 'zhùtóu fāng', 'wall beam', '顺墙的长木枋，把相邻的几组斗拱连成一体。', 'A long beam along the wall, tying neighbouring bracket sets together.'],
  linggong: ['令拱', 'lìng gǒng', 'outer arm', '最外面的一道拱，平行于墙，托住撩檐枋。', 'The outermost arm, parallel to the wall, carrying the eave purlin.'],
  shuatou: ['耍头', 'shuǎ tóu', 'beak', '向外伸出的木头，末端削成鸟嘴的样子，既拉结又装饰。', 'A beam that pokes out, its tip cut like a beak: it ties the set together and decorates it.'],
  liaoyan: ['撩檐枋', 'liáoyán fāng', 'eave purlin', '最外面的长枋，屋檐的椽子就搭在它上面。', 'The outermost beam; the rafters of the eave rest on it.'],
};

// the slots: type, where it goes (its bottom centre), what it rests on
const SLOTS = [
  { id: 'ludou', type: 'ludou', at: [0, 0, 0], needs: [] },
  { id: 'nidao', type: 'nidao', at: [0, 1.2, 0], needs: ['ludou'] },
  { id: 'huagong', type: 'huagong', at: [0, 1.2, 2], needs: ['ludou'] },
  { id: 'sdL', type: 'sandou', at: [-5, 2.7, 0], needs: ['nidao'] },
  { id: 'sdR', type: 'sandou', at: [5, 2.7, 0], needs: ['nidao'] },
  { id: 'qixin', type: 'qixin', at: [0, 2.7, 0], needs: ['nidao', 'huagong'] },
  { id: 'jiaohu', type: 'jiaohu', at: [0, 2.7, 7.5], needs: ['huagong'] },
  { id: 'zhutou', type: 'zhutou', at: [0, 3.7, 0], needs: ['sdL', 'sdR', 'qixin'] },
  { id: 'linggong', type: 'linggong', at: [0, 3.7, 7.5], needs: ['jiaohu'] },
  { id: 'shuatou', type: 'shuatou', at: [0, 3.7, 4.5], needs: ['linggong', 'zhutou'] },
  { id: 'sdL2', type: 'sandou', at: [-4, 5.2, 7.5], needs: ['linggong'] },
  { id: 'sdR2', type: 'sandou', at: [4, 5.2, 7.5], needs: ['linggong'] },
  { id: 'liaoyan', type: 'liaoyan', at: [0, 6.2, 7.5], needs: ['sdL2', 'sdR2'] },
];
const nameOf = (id) => INFO[SLOTS.find((s) => s.id === id).type][0];

/* ── geometry ── */
function frustum(bottom, top, h) {
  const g = new THREE.CylinderGeometry(top / Math.SQRT2, bottom / Math.SQRT2, h, 4, 1);
  g.rotateY(Math.PI / 4);
  g.translate(0, h / 2, 0);
  return g;
}
function box(w, h, d, x = 0, y = 0, z = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y + h / 2, z);
  return g;
}
/** a dou: a tapered foot, a flat waist, and ears with a cross slot between them */
function dou(size, h, cross = true) {
  const foot = h * 0.45;
  const waist = h * 0.2;
  const ear = h - foot - waist;
  const s = size;
  const parts = [frustum(s * 0.72, s, foot), box(s, waist, s, 0, foot)];
  const e = s * 0.32;
  const o = s / 2 - e / 2;
  for (const [x, z] of [[-o, -o], [o, -o], [-o, o], [o, o]]) parts.push(box(e, ear, e, x, foot + waist, z));
  if (!cross) parts.push(box(s, ear, e, 0, foot + waist, -o), box(s, ear, e, 0, foot + waist, o));
  return parts;
}
/** a gong: an arm with its lower ends rounded up in facets (卷杀) */
function gong(len, h, t, beak = false) {
  const sh = new THREE.Shape();
  const L = len / 2;
  const facets = 4;
  const curl = len * 0.18;
  sh.moveTo(-L, h);
  sh.lineTo(beak ? L + 1.2 : L, h);
  if (beak) {
    sh.lineTo(L + 1.6, h * 0.45);
    sh.lineTo(L, h * 0.2);
  } else {
    for (let k = 0; k <= facets; k++) {
      const a = (k / facets) * (Math.PI / 2);
      sh.lineTo(L - curl * (1 - Math.cos(a)), h * 0.55 * (1 - Math.sin(a)));
    }
  }
  for (let k = facets; k >= 0; k--) {
    const a = (k / facets) * (Math.PI / 2);
    sh.lineTo(-L + curl * (1 - Math.cos(a)), h * 0.55 * (1 - Math.sin(a)));
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 });
  g.translate(0, 0, -t / 2);
  return [g];
}
function makePiece(type) {
  switch (type) {
    case 'ludou': return dou(3.2, 2.0);
    case 'sandou': return dou(1.6, 1.0, false);
    case 'qixin': return dou(1.6, 1.0, false);
    case 'jiaohu': return dou(1.7, 1.0, true);
    case 'nidao': return gong(12, 1.5, 1.0);
    case 'linggong': return gong(10, 1.5, 1.0);
    case 'huagong': return gong(13, 1.5, 1.0).map((g) => g.rotateY(-Math.PI / 2));
    case 'shuatou': return gong(11, 1.5, 1.0, true).map((g) => g.rotateY(-Math.PI / 2));
    case 'zhutou': return [box(20, 1.5, 1.0)];
    case 'liaoyan': return [box(20, 1.5, 1.1)];
  }
  return [];
}

/** where each piece waits on the bench: offset along the row, which row, which way it lies */
const BLOCK_ROW = ['sandou', 'ludou', 'sandou', 'qixin', 'sandou', 'jiaohu', 'sandou']; // shuffled, front row
const ARMS = ['nidao', 'huagong', 'linggong', 'shuatou'];
function benchSpot(type, seen) {
  const n = (seen[type] = (seen[type] || 0) + 1) - 1; // the n-th piece of this kind
  if (BLOCK_ROW.includes(type)) {
    const k = BLOCK_ROW.map((t, j) => (t === type ? j : -1)).filter((j) => j >= 0)[n];
    return { off: -10 + k * 3.4, fwd: -10, along: 'x' };
  }
  if (ARMS.includes(type)) {
    const k = ARMS.indexOf(type);
    return { off: k % 2 ? 7 : -6, fwd: k < 2 ? -3 : 3.5, along: type === 'huagong' || type === 'shuatou' ? 'z' : 'x' };
  }
  return { off: 0, fwd: type === 'zhutou' ? 9 : 13, along: 'x' };
}

export function open({ $, passport, onClose }) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = $('canvas', { class: 'game__canvas' });
  const tip = $('div', { class: 'game__tip', 'aria-live': 'polite' });
  const card = $('div', { class: 'game__card' });
  const stats = $('p', { class: 'game__stats' });
  const tray = $('ol', { class: 'dg__tray' });
  const loadBtn = $('button', { type: 'button', class: 'btn', hidden: true }, '压上屋檐 ', $('i', {}, 'Load the eave'));
  const explodeBtn = $('button', { type: 'button', class: 'btn btn--line btn--small', hidden: true }, '拆开看看 ', $('i', {}, 'Explode'));
  const again = $('button', { type: 'button', class: 'btn btn--line btn--small' }, '重来 ', $('i', {}, 'Start again'));
  const ui = $('div', { class: 'game game--dougong', role: 'dialog', 'aria-modal': 'true', 'aria-label': '搭斗拱 Build a dougong' },
    canvas,
    $('div', { class: 'game__side' },
      $('button', { type: 'button', class: 'game__close', onclick: () => close() }, '← 返回阅读 ', $('i', { lang: 'en' }, 'Back')),
      $('p', { class: 'game__eyebrow', lang: 'en' }, 'BUILD A DOUGONG'),
      $('h2', {}, '搭一组斗拱'),
      $('p', { class: 'game__intro' }, '把构件拖到发光的位置上，或直接点一下。从柱头开始，自下而上。', $('br'), $('i', { lang: 'en' }, 'Drag each piece onto its glowing place, or just click it. Start at the column head and work up.')),
      stats,
      tray,
      card,
      $('div', { class: 'game__actions' }, loadBtn, explodeBtn, again),
    ),
    tip,
  );
  document.body.append(ui);
  document.documentElement.classList.add('is-gaming');

  /* ── scene ── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xece5d8);
  scene.fog = new THREE.Fog(0xece5d8, 70, 140);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.4;
  const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 400);
  camera.position.set(-30, 21, 40);
  // the camera's right and forward on the floor: where the bench goes
  const BENCH_FWD = new THREE.Vector3(34, 0, -36).normalize();
  const BENCH_RIGHT = new THREE.Vector3(-BENCH_FWD.z, 0, BENCH_FWD.x);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(4, -0.5, 4);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 14;
  controls.maxDistance = 80;
  controls.enablePan = false;
  const sun = new THREE.DirectionalLight(0xffe2bd, 3);
  sun.position.set(-20, 40, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30 });
  sun.shadow.bias = -0.0005;
  scene.add(sun, new THREE.HemisphereLight(0xe8eef5, 0x8a7258, 1.1));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshStandardMaterial({ color: 0xe2d8c5, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -9;
  ground.receiveShadow = true;
  scene.add(ground);
  const red = new THREE.MeshStandardMaterial({ color: 0x7a2c1d, roughness: 0.6 });
  const column = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.8, 9, 24), red);
  column.position.y = -4.5;
  column.castShadow = column.receiveShadow = true;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0x9a958c, roughness: 0.9 }));
  base.position.y = -8.6;
  scene.add(column, base);

  // pieces: unpainted timber, each a slightly different tone
  const pieces = [];
  const bench = [];
  const seen = {};
  SLOTS.forEach((slot, i) => {
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.045, 0.55, 0.22 + ((i * 37) % 11) / 160), roughness: 0.66 });
    const g = new THREE.Group();
    for (const geo of makePiece(slot.type)) {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
    }
    g.userData = { type: slot.type, placed: null, mat };
    // the bench: laid out in rows on the floor to the right of the column, as the camera sees it:
    // blocks in front, arms behind them, the two long beams at the back
    const { off, fwd, along } = benchSpot(slot.type, seen);
    const home = new THREE.Vector3(0, -9 + 0.02, 0).addScaledVector(BENCH_RIGHT, 16 + off).addScaledVector(BENCH_FWD, fwd + 5);
    g.position.copy(home);
    // long pieces lie along the row; blocks a little askew
    g.rotation.y = (along === 'z' ? 0.88 : -0.69) + (((i * 53) % 7) - 3) * 0.03;
    g.userData.home = home;
    g.userData.homeRot = g.rotation.y;
    scene.add(g);
    pieces.push(g);
    bench.push(g);
  });
  // ghosts: where a piece of the dragged type could go now
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xb5321c, transparent: true, opacity: 0.22, depthWrite: false });
  const ghosts = SLOTS.map((slot) => {
    const g = new THREE.Group();
    for (const geo of makePiece(slot.type)) g.add(new THREE.Mesh(geo, ghostMat));
    g.position.set(...slot.at);
    g.visible = false;
    scene.add(g);
    return g;
  });
  const filled = new Map(); // slot id → piece
  const ready = (slot) => !filled.has(slot.id) && slot.needs.every((n) => filled.has(n));
  const openSlots = (type) => SLOTS.filter((s) => s.type === type && !filled.has(s.id));

  /* ── the side panel ── */
  let moves = 0;
  let mistakes = 0;
  const t0 = performance.now();
  function paintTray() {
    const counts = {};
    for (const s of SLOTS) if (!filled.has(s.id)) counts[s.type] = (counts[s.type] || 0) + 1;
    tray.replaceChildren(
      ...Object.keys(INFO).map((type) => {
        const left = counts[type] || 0;
        const can = SLOTS.some((s) => s.type === type && ready(s));
        return $('li', { class: `${left ? '' : 'is-done'} ${can ? 'is-ready' : ''}` },
          $('b', {}, INFO[type][0]), $('span', { lang: 'zh-Latn' }, INFO[type][1]), $('i', { lang: 'en' }, INFO[type][2]),
          $('small', {}, left ? `×${left}` : '✓'),
        );
      }),
    );
    stats.textContent = `已放 ${filled.size} / ${SLOTS.length} · 放错 ${mistakes} 次 · Placed ${filled.size} of ${SLOTS.length}, ${mistakes} slips`;
  }
  function showCard(type) {
    const [zh, py, en, dz, de] = INFO[type];
    card.replaceChildren(
      $('p', { class: 'dg__name' }, $('b', {}, zh), ' ', $('span', { lang: 'zh-Latn' }, py), sayButton($, zh, 'zh-CN', '读中文 Listen'), ' ', $('i', { lang: 'en' }, en), sayButton($, en, 'en-US', 'Listen')),
      $('p', {}, dz),
      $('p', { lang: 'en', class: 'en' }, de),
    );
    gsap.fromTo(card, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 });
  }
  let tipTimer = 0;
  function say(zh, en, bad = false) {
    tip.replaceChildren($('span', {}, zh), $('br'), $('i', { lang: 'en' }, en));
    tip.classList.toggle('is-bad', bad);
    gsap.fromTo(tip, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 });
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => gsap.to(tip, { opacity: 0, duration: 0.5 }), 4200);
  }
  paintTray();
  say('先找“栌斗”：最大的那个方斗，它坐在柱头上。', 'Find the cap block first: the biggest square block; it sits on the column head.');

  /* ── placing ── */
  function place(piece, slot) {
    filled.set(slot.id, piece);
    piece.userData.placed = slot.id;
    bench.splice(bench.indexOf(piece), 1);
    moves++;
    const to = new THREE.Vector3(...slot.at);
    const lift = Math.max(piece.position.y, to.y) + 6;
    const tl = gsap.timeline();
    tl.to(piece.position, { y: lift, duration: reduce ? 0 : 0.35, ease: 'power2.out' })
      .to(piece.position, { x: to.x, z: to.z, duration: reduce ? 0 : 0.45, ease: 'power2.inOut' }, '<0.1')
      .to(piece.rotation, { y: 0, duration: reduce ? 0 : 0.45 }, '<')
      .to(piece.position, { y: to.y, duration: reduce ? 0 : 0.28, ease: 'power3.in', onComplete: () => sound.knock(0.8 + Math.random() * 0.4) });
    showCard(slot.type);
    paintTray();
    if (filled.size === SLOTS.length) {
      setTimeout(() => {
        say('整组斗拱搭好了！现在压上屋檐，看看重量怎么走。', 'The set is complete! Now load the eave and watch where the weight goes.');
        loadBtn.hidden = false;
        gsap.from(loadBtn, { scale: 0.8, opacity: 0, duration: 0.5, ease: 'back.out(2)' });
      }, 900);
    }
  }
  function refuse(piece) {
    mistakes++;
    sound.nope();
    const type = piece.userData.type;
    const slot = SLOTS.find((s) => s.type === type && !filled.has(s.id));
    const missing = slot.needs.filter((n) => !filled.has(n)).map(nameOf);
    const uniq = [...new Set(missing)];
    say(`还不行：${INFO[type][0]}要放在${uniq.join('、')}上面，先把${uniq.join('、')}放好。`, `Not yet: the ${INFO[type][2]} rests on the ${uniq.map((n) => INFO[Object.keys(INFO).find((k) => INFO[k][0] === n)][2]).join(' and the ')}; place that first.`, true);
    gsap.fromTo(piece.position, { x: piece.position.x - 0.6 }, { x: piece.position.x, duration: 0.5, ease: 'elastic.out(1.4, 0.25)' });
    paintTray();
  }
  function goHome(piece) {
    gsap.to(piece.position, { x: piece.userData.home.x, y: piece.userData.home.y, z: piece.userData.home.z, duration: 0.5, ease: 'power2.out' });
    gsap.to(piece.rotation, { y: piece.userData.homeRot, duration: 0.5 });
  }

  /* ── pointer: hover, drag, click ── */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  const hitP = new THREE.Vector3();
  let hover = null;
  let drag = null;
  const setNdc = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  const pieceAt = () => {
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(bench, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o.parent && !o.userData.type) o = o.parent;
    return o;
  };
  const highlight = (p, on) => p && p.userData.mat.emissive.setHex(on ? 0x5a2a0a : 0x000000);
  canvas.addEventListener('pointermove', (e) => {
    setNdc(e);
    if (drag) {
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(dragPlane, hitP)) drag.piece.position.copy(hitP).add(drag.offset);
      drag.moved = true;
      return;
    }
    const p = pieceAt();
    if (p !== hover) {
      highlight(hover, false);
      hover = p;
      highlight(hover, true);
      canvas.style.cursor = p ? 'grab' : '';
      if (p) {
        const [zh, py, en] = INFO[p.userData.type];
        tip.replaceChildren($('span', {}, `${zh} ${py}`), $('br'), $('i', { lang: 'en' }, en));
        tip.classList.remove('is-bad');
        gsap.to(tip, { opacity: 1, duration: 0.2 });
      }
    }
  });
  canvas.addEventListener('pointerdown', (e) => {
    setNdc(e);
    const p = pieceAt();
    if (!p) return;
    controls.enabled = false;
    canvas.setPointerCapture(e.pointerId);
    // drag on a plane facing the camera, through the middle of the bracket set
    const n = new THREE.Vector3();
    camera.getWorldDirection(n);
    dragPlane.setFromNormalAndCoplanarPoint(n.negate(), new THREE.Vector3(0, 3, 4));
    ray.setFromCamera(ndc, camera);
    ray.ray.intersectPlane(dragPlane, hitP);
    drag = { piece: p, offset: new THREE.Vector3(0, 0.5, 0), moved: false, x: e.clientX, y: e.clientY };
    gsap.killTweensOf(p.position);
    for (const s of openSlots(p.userData.type)) ghosts[SLOTS.indexOf(s)].visible = true;
    canvas.style.cursor = 'grabbing';
  });
  const onUp = (e) => {
    if (!drag) return;
    const { piece } = drag;
    const clicked = Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6;
    drag = null;
    controls.enabled = true;
    canvas.style.cursor = '';
    ghosts.forEach((g) => (g.visible = false));
    const slots = openSlots(piece.userData.type);
    // the nearest open place of this kind, on screen
    let best = null;
    let bestD = Infinity;
    const r = canvas.getBoundingClientRect();
    for (const s of slots) {
      const v = new THREE.Vector3(...s.at).add(new THREE.Vector3(0, 0.8, 0)).project(camera);
      const d = Math.hypot(((v.x + 1) / 2) * r.width + r.left - e.clientX, ((1 - v.y) / 2) * r.height + r.top - e.clientY);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    const target = clicked ? slots.find(ready) || slots[0] : bestD < 90 ? best : null;
    if (!target) return goHome(piece);
    if (!ready(target)) {
      // perhaps another place of the same kind is ready
      const other = slots.find(ready);
      if (other && !clicked) return place(piece, other);
      if (other) return place(piece, other);
      goHome(piece);
      return refuse(piece);
    }
    place(piece, target);
  };
  addEventListener('pointerup', onUp);

  /* ── the load: the eave comes down, the weight runs down the set into the column ── */
  const roof = new THREE.Group();
  const tiles = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.7, transparent: true });
  {
    // rafters resting on the eave purlin, sloping down and out; tiles laid over them
    const raft = new THREE.MeshStandardMaterial({ color: 0x4e1a10, roughness: 0.7 });
    const slope = 0.32;
    const yAt = (z) => 7.7 + 0.35 + (7.5 - z) * Math.tan(slope);
    for (let x = -8; x <= 8; x += 1.6) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 22, 8), raft);
      r.rotation.x = Math.PI / 2 + slope;
      r.position.set(x, yAt(6), 6);
      r.castShadow = true;
      roof.add(r);
    }
    const slab = new THREE.Mesh(new THREE.BoxGeometry(18, 0.8, 22), tiles);
    slab.rotation.x = slope;
    slab.position.set(0, yAt(6) + 0.75, 6);
    slab.castShadow = true;
    roof.add(slab);
  }
  roof.position.y = 40;
  roof.visible = false;
  scene.add(roof);
  const flows = [
    ['liaoyan', 'sdL2', 'linggong', 'jiaohu', 'huagong', 'ludou'],
    ['liaoyan', 'sdR2', 'linggong', 'shuatou', 'zhutou', 'qixin', 'nidao', 'ludou'],
    ['zhutou', 'sdL', 'nidao', 'ludou'],
    ['zhutou', 'sdR', 'nidao', 'ludou'],
  ];
  const beads = [];
  const beadMat = new THREE.MeshBasicMaterial({ color: 0xffb347 });
  function centreOf(id) {
    const box3 = new THREE.Box3().setFromObject(filled.get(id));
    return box3.getCenter(new THREE.Vector3());
  }
  let loaded = false;
  loadBtn.addEventListener('click', () => {
    if (loaded) return;
    loaded = true;
    loadBtn.hidden = true;
    roof.visible = true;
    gsap.to(roof.position, {
      y: 0,
      duration: reduce ? 0 : 1.3,
      ease: 'bounce.out',
      onComplete: () => {
        sound.drum(1);
        // the tiles fade so the weight can be seen going down through the set
        gsap.to(tiles, { opacity: 0.3, duration: 0.8, delay: 0.3 });
        // the weight, as glowing beads running down each path into the column
        for (const path of flows) {
          const pts = path.map(centreOf);
          pts.push(new THREE.Vector3(0, -2, 0), new THREE.Vector3(0, -8.6, 0));
          const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
          for (let k = 0; k < 6; k++) {
            const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), beadMat);
            b.userData = { curve, t: -k * 0.16 };
            scene.add(b);
            beads.push(b);
          }
        }
        // each piece glows as the weight passes through it, top to bottom
        const order = ['liaoyan', 'sdL2', 'sdR2', 'linggong', 'shuatou', 'jiaohu', 'zhutou', 'sdL', 'sdR', 'qixin', 'huagong', 'nidao', 'ludou'];
        order.forEach((id, k) => {
          const m = filled.get(id).userData.mat;
          gsap.fromTo(m.emissive, { r: 0.6, g: 0.25, b: 0.02 }, { r: 0, g: 0, b: 0, duration: 1.2, delay: 0.25 + k * 0.18 });
        });
        gsap.fromTo(red.emissive, { r: 0, g: 0, b: 0 }, { r: 0.5, g: 0.2, b: 0.02, duration: 0.6, delay: 2.6, yoyo: true, repeat: 1 });
        setTimeout(() => {
          const secs = Math.round((performance.now() - t0) / 1000);
          const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
          say('屋檐的重量被分成几路，一层层往下传，最后都汇到柱子上。这就是斗拱的本事。', 'The weight of the eave splits into several paths, passes down layer by layer and gathers in the column. That is what a dougong does.');
          stats.replaceChildren($('b', { class: 'dg__stars' }, '★'.repeat(stars) + '☆'.repeat(3 - stars)), ` 用时 ${secs} 秒 · 放错 ${mistakes} 次 · ${secs}s, ${mistakes} slips`);
          explodeBtn.hidden = false;
          passport && passport.award('dougong');
        }, 3200);
      },
    });
  });
  let exploded = false;
  explodeBtn.addEventListener('click', () => {
    exploded = !exploded;
    explodeBtn.firstChild.textContent = exploded ? '合起来 ' : '拆开看看 ';
    roof.visible = !exploded;
    for (const [id, p] of filled) {
      const s = SLOTS.find((x) => x.id === id);
      const k = SLOTS.indexOf(s);
      gsap.to(p.position, { y: s.at[1] + (exploded ? k * 1.4 : 0), duration: 0.9, ease: 'power3.inOut' });
    }
  });
  again.addEventListener('click', () => {
    close(true);
    open({ $, passport, onClose });
  });

  /* ── loop ── */
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // the side panel covers the left: centre the scene in what is left of the screen
    const side = w > 900 ? Math.min(360, w * 0.92) : 0;
    if (side) camera.setViewOffset(w, h, -side / 2, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  let raf = 0;
  const clock = new THREE.Clock();
  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta());
    controls.update();
    ghostMat.opacity = 0.16 + 0.12 * Math.sin(performance.now() / 220);
    for (const b of beads) {
      b.userData.t += dt * 0.35;
      if (b.userData.t > 1) b.userData.t -= 1.2;
      b.visible = b.userData.t >= 0;
      if (b.visible) b.position.copy(b.userData.curve.getPoint(b.userData.t));
    }
    renderer.render(scene, camera);
  }
  frame();
  gsap.from(ui.querySelector('.game__side'), { x: -40, opacity: 0, duration: 0.6, ease: 'power3.out' });
  gsap.from(camera.position, { x: -60, y: 40, z: 70, duration: reduce ? 0 : 1.6, ease: 'power3.out' });

  if (import.meta.env.DEV)
    window.__dg = {
      // put every piece in place, in order (for testing the ending)
      solve() {
        for (const s of SLOTS) if (!filled.has(s.id)) place(bench.find((p) => p.userData.type === s.type), s);
      },
      frame: () => {
        controls.update();
        renderer.render(scene, camera);
      },
    };

  const onKey = (e) => e.key === 'Escape' && close();
  addEventListener('keydown', onKey);
  function close(silent = false) {
    cancelAnimationFrame(raf);
    ro.disconnect();
    removeEventListener('keydown', onKey);
    removeEventListener('pointerup', onUp);
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
    pmrem.dispose();
    renderer.dispose();
    ui.remove();
    document.documentElement.classList.remove('is-gaming');
    if (!silent) onClose && onClose();
  }
  return close;
}
