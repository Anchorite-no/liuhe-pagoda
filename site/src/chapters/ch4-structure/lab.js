/**
 * ch4 signature interaction: peel the pagoda.
 *
 * A tall, sticky 3D stage (shared createPagoda model, our own misty setting) and three
 * control panels: peel / dynasty colours / section / style, the climb through the seven
 * walkable storeys, and five points of interest with hotspots and info cards.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { h, bi, rangeSlider, segmented, reducedMotion, announce } from '../../core/ui.js';
import { tr } from '../../core/i18n.js';
import { markDone } from '../../core/progress.js';
import * as audio from '../../core/audio.js';
import { createStage } from '../../three/stage.js';
import { createPagoda } from '../../three/pagoda.js';
import { createLabels } from '../../three/labels.js';
import { canvasTexture } from '../../three/textures.js';
import { createScenery } from './scene.js';
import { createCutFill } from './cutfill.js';
import { rich, fillRich, onLang } from './rich.js';

const HALF = Math.PI / 8;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ───────────── small UI pieces ───────────── */

function toggle(label, onChange) {
  const b = h(
    'button',
    { type: 'button', role: 'switch', 'aria-checked': 'false', class: 'ch4-switch' },
    h('span', { class: 'ch4-switch__track', 'aria-hidden': 'true' }, h('span', { class: 'ch4-switch__thumb' })),
    bi(label, 'span', { class: 'ch4-switch__label' }),
  );
  let on = false;
  const api = {
    el: b,
    get: () => on,
    set(v, fire = false) {
      on = !!v;
      b.setAttribute('aria-checked', String(on));
      if (fire) onChange(on);
    },
  };
  b.addEventListener('click', () => api.set(!on, true));
  return api;
}

function btn(label, cls, onClick) {
  const b = bi(label, 'button', { type: 'button', class: cls });
  b.addEventListener('click', onClick);
  return b;
}

/** Label pinned to a 3D point; the pill sits to the left or right of the point. */
function tag(label, side = 'right', extra = '') {
  return h('div', { class: `ch4-anchor ch4-anchor--${side} ${extra}`, 'aria-hidden': 'true' }, bi(label, 'span', { class: 'ch4-tag' }));
}

/* ───────────── text ───────────── */

const ERA_LEGEND = [
  { era: 'song', label: { en: 'Southern Song brick body, 1150s–1160s', zh: '南宋砖砌塔身，12 世纪中叶' } },
  { era: 'yuan', label: { en: 'Yuan finial, 1271–1368', zh: '元代塔刹，1271—1368 年' } },
  { era: 'qing', label: { en: 'Qing timber eaves, 1899–1900', zh: '清代木外檐，1899—1900 年' } },
  { era: 'none', label: { en: 'Stone base (not colour-coded)', zh: '石台基（不标朝代）' } },
];

const SPOTS = [
  {
    id: 'finial',
    name: { en: 'Finial (Yuan)', zh: '塔刹（元代）' },
    era: { en: 'Yuan dynasty, 1271–1368', zh: '元代，1271—1368 年' },
    body: {
      en: 'The spire on the roof is a [[arch-finial|finial]]: a mast with rings and “pearls” on a domed base. It dates from the Yuan dynasty, about a century after the brick body was finished, so this one tower carries work from three dynasties. In 1957 a lightning rod was fixed to the iron gourd at its top.',
      zh: '屋顶上的尖顶叫[[arch-finial|塔刹]]：覆钵形的底座上立着刹杆，套着相轮和宝珠。它是元代的遗物，比砖砌塔身晚一百年左右，所以这一座塔上有三个朝代的手笔。1957 年，塔顶的生铁葫芦上装了避雷针。',
    },
  },
  {
    id: 'bells',
    name: { en: '104 wind-bells', zh: '104 只风铃' },
    era: { en: 'Hung on the Qing eaves', zh: '挂在清代檐角上' },
    body: {
      en: 'A [[arch-wind-bell|wind-bell]] hangs from each of the eight corners of all thirteen eaves: 13 × 8 = 104. When the wind comes up the river, the whole tower rings. Count the corners on one eave in the model, then multiply.',
      zh: '十三重檐，每重八个角，每个角挂一只[[arch-wind-bell|风铃]]：13 × 8 = 104。江风一起，整座塔都在响。可以在模型上数一数一重檐有几个角，再乘一乘。',
    },
  },
  {
    id: 'lamp',
    name: { en: 'The lamp', zh: '塔顶明灯' },
    era: { en: 'A lighthouse for the river', zh: '江上的灯塔' },
    body: {
      en: 'Old accounts say a lamp was lit in the top storey to guide boats on the Qiantang at night. The historian of Chinese science Joseph Needham wrote that the pagoda served as a lighthouse almost from the start. A pagoda built to calm the tide also helped people travel on it.',
      zh: '史料记载，塔的顶层点着明灯，为夜里在钱塘江上行船的人指路。研究中国科技史的李约瑟写道，这座塔几乎从建成起就兼作灯塔。为镇潮而建的塔，也在帮人们在潮水上行路。',
    },
  },
  {
    id: 'carvings',
    name: { en: 'Brick carvings', zh: '须弥座砖雕' },
    era: { en: 'Southern Song, inside the brick body', zh: '南宋，在砖塔身里' },
    body: {
      en: 'Inside, at the foot of the walls along the corridor, brick [[arch-sumeru-plinth|Sumeru plinths]] carry Southern Song carvings: figures, flying apsaras, flowers, birds and beasts. Many patterns match the Song building manual, the _Yingzao Fashi_ (1103). You cannot see them from outside: they are behind the timber.',
      zh: '塔内回廊的墙脚是一圈砖砌[[arch-sumeru-plinth|须弥座]]，束腰上有南宋砖雕：人物、飞天、花卉、鸟兽。许多纹样能在宋代《营造法式》（1103 年刊行）里找到对应。从外面看不到它们，因为都藏在木檐后面。',
    },
  },
  {
    id: 'eaves',
    name: { en: 'Timber eaves (Qing)', zh: '木外檐（清代）' },
    era: { en: 'Qing dynasty, 1899–1900', zh: '清代，1899—1900 年' },
    body: {
      en: 'The red galleries and thirteen tiled [[arch-eave|eaves]] are the youngest layer, added in 1899–1900 and wrapped round the Song brick tower like a coat. Under each eave, rows of [[arch-bracket-set|bracket sets]] carry the weight of the roof out beyond the wall.',
      zh: '红色的回廊和十三重灰瓦[[arch-eave|檐]]是最年轻的一层，1899—1900 年才加上去，像一件外衣裹住宋代砖塔。每重檐下都有一排[[arch-bracket-set|斗拱]]，把屋檐的重量挑到墙外。',
    },
  },
];

/* ───────────── the lab ───────────── */

export function buildLab({ onCarvingsLink } = {}) {
  const reduced = reducedMotion();
  const state = { peel: 0, era: false, section: false, style: 'real', mode: 'explore', storey: -1, lamp: false, card: null };

  /* DOM skeleton */
  const stageEl = h('div', { class: 'stage ch4-stage' });
  const hint = bi({ en: 'Drag sideways to turn the tower', zh: '左右拖动可旋转' }, 'div', { class: 'stage__hint ch4-hint' });
  const homeBtn = btn({ en: 'Whole tower', zh: '看全塔' }, 'ch4-hud-btn', () => goHome());
  const hud = h('div', { class: 'stage__hud ch4-hud' }, homeBtn);
  const cardEl = h('div', { class: 'ch4-card', role: 'dialog', 'aria-modal': 'false', hidden: true });
  stageEl.append(hint, hud, cardEl);
  const stageWrap = h('div', { class: 'ch4-stage-wrap' }, stageEl);

  /* ── Panel 1: peel ── */
  const peelSlider = rangeSlider({
    label: { en: 'Peel away the Qing timber', zh: '剥去清代木外檐' },
    min: 0,
    max: 1,
    step: 0.01,
    value: 0,
    format: (v) =>
      v < 0.01 ? tr({ en: 'timber on', zh: '木檐完整' }) : v > 0.99 ? tr({ en: 'brick body only', zh: '只剩砖塔身' }) : `${Math.round(v * 100)}%`,
    onInput: (v) => {
      if (peelTween) peelTween.kill();
      setPeel(v);
    },
  });
  const peelBtn = h('button', { type: 'button', class: 'btn' });
  const syncPeelBtn = () => {
    peelBtn.textContent = state.peel > 0.5 ? tr({ en: 'Put the timber back', zh: '把木檐装回去' }) : tr({ en: 'Peel it for me', zh: '帮我剥开' });
  };
  peelBtn.addEventListener('click', () => animatePeel(state.peel > 0.5 ? 0 : 1));
  const peelStatus = h('p', { class: 'note ch4-status', 'aria-live': 'polite' });

  const eraToggle = toggle({ en: 'Colour by dynasty', zh: '按朝代上色' }, (v) => {
    state.era = v;
    applyLook();
    announce(v ? tr({ en: 'Coloured by dynasty', zh: '已按朝代上色' }) : tr({ en: 'Natural colours', zh: '已恢复原色' }));
  });
  const eraNote = bi({ en: 'Dynasty colours are not shown in Blueprint style.', zh: '线图模式下不显示朝代颜色。' }, 'p', { class: 'note ch4-era-note', hidden: true });
  const legend = h(
    'ul',
    { class: 'ch4-legend' },
    ERA_LEGEND.map((l) => h('li', null, h('span', { class: `ch4-swatch ch4-swatch--${l.era}`, 'aria-hidden': 'true' }), bi(l.label, 'span'))),
  );

  const sectionToggle = toggle({ en: 'Cut it open', zh: '剖开塔身' }, (v) => {
    state.section = v;
    applySection();
    if (v && state.mode === 'explore') {
      closeCard(false);
      flyTo(view('section'), 1.4);
    }
    announce(v ? tr({ en: 'Section view on', zh: '已显示剖面' }) : tr({ en: 'Section view off', zh: '已关闭剖面' }));
  });

  const styleSeg = segmented({
    options: [
      { value: 'real', label: { en: 'Real', zh: '写实' } },
      { value: 'ink', label: { en: 'Ink', zh: '水墨' } },
      { value: 'blueprint', label: { en: 'Blueprint', zh: '线图' } },
    ],
    value: 'real',
    ariaLabel: { en: 'Drawing style', zh: '画法' },
    onChange: (v) => {
      state.style = v;
      applyLook();
    },
  });

  const panelPeel = h(
    'section',
    { class: 'ch4-panel', 'aria-labelledby': 'ch4-p1' },
    bi({ en: 'Peel the pagoda', zh: '剥开这座塔' }, 'h3', { class: 'ch4-panel__title', id: 'ch4-p1' }),
    rich({
      en: 'The red timber galleries and grey-tiled eaves are the youngest part of the building, added in 1899–1900. Underneath stands the Southern Song [[arch-brick-core|brick core]], finished in the 1160s. Drag the slider to take the timber off.',
      zh: '红色的木回廊和灰瓦檐是全塔最年轻的部分，1899—1900 年才加上去。里面立着的是南宋的[[arch-brick-core|砖砌塔身]]，12 世纪 60 年代完工。拖动滑块，把木外檐拿掉。',
    }),
    peelSlider.el,
    h('div', { class: 'ch4-row' }, peelBtn),
    peelStatus,
    h('div', { class: 'ch4-ctl' }, eraToggle.el, eraNote, legend),
    h(
      'div',
      { class: 'ch4-ctl' },
      sectionToggle.el,
      rich(
        {
          en: 'A [[arch-cross-section|cross-section]] shows what the walls hide. Liuhe is built like two tubes, one inside the other: an outer brick wall, a corridor where visitors walk, and an inner brick wall round a small central chamber, tied together by floor slabs at every storey. The timber galleries cling to the outside.',
          zh: '[[arch-cross-section|剖面]]能看到墙后面藏着什么。六和塔像两个套在一起的筒：外圈砖墙、供人行走的回廊、内圈砖墙和中间小小的塔心室，每层用楼板连成一体。木回廊贴在最外面。',
        },
        'p',
        { class: 'note' },
      ),
    ),
    h('div', { class: 'ch4-ctl' }, bi({ en: 'Drawing style', zh: '画法' }, 'span', { class: 'label' }), styleSeg.el),
  );

  /* ── Panel 2: climb ── */
  const ladder = h('ol', { class: 'ch4-ladder' });
  const rungButtons = [];
  for (let i = 0; i < 13; i++) {
    const ming = i % 2 === 0;
    const f = i / 2;
    const width = `${100 - i * 3.6}%`;
    if (ming) {
      const b = h('button', { type: 'button', class: 'ch4-rung__btn', 'aria-pressed': 'false' });
      onLang(b, () => {
        b.textContent = '';
        b.append(
          h('span', { class: 'ch4-rung__main' }, tr({ en: 'Storey {n}', zh: '第 {n} 层' }, { n: f + 1 })),
          h('span', { class: 'ch4-rung__sub' }, tr({ en: 'tier {t} · walkable', zh: '第 {t} 重檐 · 明层' }, { t: i + 1 })),
        );
      });
      b.addEventListener('click', () => climbTo(f));
      rungButtons.push(b);
      ladder.append(h('li', { class: 'ch4-rung ch4-rung--ming', style: { width } }, b));
    } else {
      ladder.append(
        h(
          'li',
          { class: 'ch4-rung ch4-rung--an', style: { width } },
          bi({ en: `tier ${i + 1} · sealed`, zh: `第 ${i + 1} 重檐 · 暗层` }, 'span'),
        ),
      );
    }
  }
  const upBtn = h('button', { type: 'button', class: 'btn' });
  const downBtn = h('button', { type: 'button', class: 'btn btn--ghost' });
  const leaveBtn = btn({ en: 'Leave the tower', zh: '回到塔外' }, 'btn btn--ghost', () => leaveClimb());
  upBtn.addEventListener('click', () => climbTo(state.mode === 'climb' ? Math.min(6, state.storey + 1) : 0));
  downBtn.addEventListener('click', () => climbTo(Math.max(0, state.storey - 1)));
  const readout = h('div', { class: 'ch4-readout', 'aria-live': 'polite' });

  const panelClimb = h(
    'section',
    { class: 'ch4-panel', 'aria-labelledby': 'ch4-p2' },
    bi({ en: 'Climb the tower', zh: '登塔' }, 'h3', { class: 'ch4-panel__title', id: 'ch4-p2' }),
    rich({
      en: 'Inside, stairs wind up through the brick body. Each [[arch-storey|storey]] you reach opens onto a timber gallery. The tier above it is sealed: from outside it looks like one more floor, with its own eave, but the stairs never stop there. The sealed tiers sit where a Song tower had its open [[arch-pingzuo|balcony platforms]]; the late-Qing builders boxed them in.',
      zh: '塔内的楼梯在砖塔身里盘旋向上。每到一[[arch-storey|层]]，都能走到外面的木回廊上；而它上面那一重是封死的：从外面看也像一层，还有自己的檐，可楼梯从不在那里停。这些暗层所在的位置，原本是宋式塔开敞的[[arch-pingzuo|平座]]，清末重修时被围了起来。',
    }),
    h(
      'div',
      { class: 'ch4-climb' },
      h('div', { class: 'ch4-ladder-wrap' }, bi({ en: 'The 13 tiers, from the ground up', zh: '十三重，从下往上' }, 'span', { class: 'label' }), ladder),
      h('div', { class: 'ch4-climb__side' }, h('div', { class: 'ch4-row' }, upBtn, downBtn, leaveBtn), readout),
    ),
  );

  /* ── Panel 3: look closer ── */
  const spotButtons = SPOTS.map((s) => {
    const b = bi(s.name, 'button', { type: 'button', class: 'btn btn--ghost ch4-spot-btn', 'aria-haspopup': 'dialog' });
    b.addEventListener('click', () => openCard(s.id, b));
    return b;
  });
  const panelLook = h(
    'section',
    { class: 'ch4-panel', 'aria-labelledby': 'ch4-p3' },
    bi({ en: 'Look closer', zh: '细看' }, 'h3', { class: 'ch4-panel__title', id: 'ch4-p3' }),
    bi(
      { en: 'Five details, also marked on the model. Each one opens a short card.', zh: '五个细节，模型上也有标记，点开是一张小卡片。' },
      'p',
      { class: 'note' },
    ),
    h('div', { class: 'ch4-spots' }, spotButtons),
  );

  const el = h(
    'div',
    { class: 'ch4-lab' },
    h('div', { class: 'ch4-lab__stage' }, stageWrap),
    h('div', { class: 'ch4-lab__panels' }, panelPeel, panelClimb, panelLook),
  );

  /* ───────────── 3D ───────────── */
  let stage = null;
  let pagoda = null;
  let scenery = null;
  let labels = null;
  const spotEls = {};
  const overlays = {};
  let sectionArr = null;
  let windBoost = 0;
  let lastBell = 0;
  let peelTween = null;
  let cut = null;

  /** Call once the lab is in the document, so the stage can measure itself. */
  function init() {
    stage = createStage(stageEl, {
      camera: [40, 34, 88],
      target: [0, 28.5, 0],
      controls: true,
      fov: 38,
      far: 2000,
      background: '#e3e6e0',
      shadows: true,
      controlsOptions: { enableZoom: false, enablePan: false, minPolarAngle: 0.3, maxPolarAngle: 1.62, rotateSpeed: 0.6 },
    });

    if (stage) {
      const { scene, camera, controls, renderer } = stage;
      // Let vertical swipes scroll the page on touch screens; horizontal drags turn the tower.
      renderer.domElement.style.touchAction = 'pan-y';
      controls.addEventListener('start', () => {
        gsap.killTweensOf(camera.position);
        gsap.killTweensOf(controls.target);
        hint.classList.add('is-hidden');
      });

      const hideHint = stage.onTick((dt, elapsed) => {
        if (elapsed > 7) {
          hint.classList.add('is-hidden');
          hideHint();
        }
      });

      scenery = createScenery(scene, { shadows: true });
      pagoda = createPagoda();
      scene.add(pagoda.group);
      pagoda.group.traverse((o) => {
        if (o.isMesh && !o.userData.outlineOf) o.castShadow = true;
      });
      labels = createLabels(stage);
      cut = createCutFill(pagoda);
      scene.add(cut.mesh);
      if (import.meta.env.DEV) window.__ch4 = { stage, pagoda, state, getPlanes: () => sectionArr };

      /* hotspots */
      const t = pagoda.tiers;
      const bellIdx = 7 * 8 + 6; // tier 8, the left-front corner
      const spotPos = {
        finial: V(0, pagoda.finialBase + 2.4, 0),
        bells: pagoda.bellPositions[bellIdx].clone().add(V(0, -0.6, 0)),
        lamp: pagoda.facePoint(12, 2, 0.05, 1.5),
        carvings: pagoda.shellPoint(0, 7, 0.06, 1.0),
        eaves: pagoda.facePoint(3, 1, 0.95, 2.6),
      };
      for (const s of SPOTS) {
        const b = bi(s.name, 'button', { type: 'button', class: 'hotspot ch4-hotspot', 'aria-haspopup': 'dialog' });
        b.addEventListener('click', () => openCard(s.id, b));
        spotEls[s.id] = b;
        labels.add(b, spotPos[s.id]);
      }

      /* section tags (explore mode) */
      overlays.sectionTags = [
        { el: tag({ en: 'Timber gallery (Qing)', zh: '木回廊（清）' }, 'left'), r: () => pagoda.storeys[0].shellR + 0.7, y: 5.2 },
        { el: tag({ en: 'Outer brick wall', zh: '外圈砖墙' }, 'left'), r: () => pagoda.storeys[0].shellR - 0.7, y: 8.4 },
        { el: tag({ en: 'Corridor', zh: '回廊' }, 'left'), r: () => (pagoda.storeys[1].coreR + pagoda.storeys[1].shellR - 1.4) / 2, y: 16.5 },
        { el: tag({ en: 'Inner wall and chamber', zh: '内墙与塔心室' }, 'left'), r: () => pagoda.storeys[2].coreR - 0.8, y: 25 },
        { el: tag({ en: 'Floor slab', zh: '楼板' }, 'left'), r: () => (pagoda.storeys[2].coreR + pagoda.storeys[2].shellR - 1.4) / 2, y: pagoda.storeys[2].y0 + 0.2 },
      ];
      for (const st of overlays.sectionTags) labels.add(st.el, V(0, st.y, 0));

      /* climb overlays */
      const hatch = canvasTexture(
        64,
        64,
        (g, w, hgt) => {
          g.clearRect(0, 0, w, hgt);
          g.fillStyle = 'rgba(32,44,52,0.28)';
          g.fillRect(0, 0, w, hgt);
          g.strokeStyle = 'rgba(24,32,37,0.9)';
          g.lineWidth = 7;
          for (let k = -hgt; k < w + hgt; k += 22) {
            g.beginPath();
            g.moveTo(k, hgt);
            g.lineTo(k + hgt, 0);
            g.stroke();
          }
        },
        { srgb: true },
      );
      const sealedMat = new THREE.MeshBasicMaterial({ map: hatch, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const walkMat = new THREE.MeshBasicMaterial({ color: '#f6f1e2', transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
      const floorMat = new THREE.MeshBasicMaterial({ color: '#f8f3e4', transparent: true, opacity: 0.92, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
      overlays.mats = [sealedMat, walkMat, floorMat];
      overlays.sealed = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true, HALF), sealedMat);
      overlays.walk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true, HALF), walkMat);
      overlays.floor = new THREE.Mesh(new THREE.RingGeometry(0.5, 1, 8, 1, -5 * HALF), floorMat);
      overlays.floor.rotation.x = -Math.PI / 2;
      const person = new THREE.Group();
      const skin = new THREE.MeshStandardMaterial({ color: '#1f2a30', roughness: 0.7 });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.0, 4, 10), skin);
      body.position.y = 0.76;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), skin);
      head.position.y = 1.56;
      person.add(body, head);
      overlays.person = person;
      for (const m of [overlays.sealed, overlays.walk, overlays.floor, person]) {
        m.visible = false;
        scene.add(m);
      }
      overlays.walkTag = tag({ en: 'Walkable floor', zh: '可以站人的楼面' }, 'left', 'ch4-anchor--walk');
      overlays.sealedTag = tag({ en: 'Sealed tier outside', zh: '外面是暗层' }, 'left', 'ch4-anchor--sealed');
      overlays.personTag = tag({ en: 'A visitor, 1.7 m', zh: '游客，身高 1.7 米' }, 'left');
      labels.add(overlays.walkTag, V(0, 0, 0));
      labels.add(overlays.sealedTag, V(0, 0, 0));
      labels.add(overlays.personTag, V(0, 0, 0));

      /* per frame */
      const nrm = new THREE.Vector3();
      const left = new THREE.Vector3();
      const tmp = new THREE.Vector3();
      const frameTick = (dt, elapsed) => {
        windBoost = Math.max(0, windBoost - dt * 0.35);
        const wind = reduced ? 0 : 0.28 + windBoost;
        const rang = pagoda.update(elapsed, { wind });
        if (rang.length && audio.isEnabled() && elapsed - lastBell > 3.5 && state.peel < 0.6) {
          lastBell = elapsed;
          audio.bell(0.25 + windBoost * 0.5);
        }
        // Turn the section plane so the cut always faces the camera.
        nrm.copy(controls.target).sub(camera.position);
        nrm.y = 0;
        if (nrm.lengthSq() < 1e-6) nrm.set(0, 0, -1);
        nrm.normalize();
        left.set(nrm.z, 0, -nrm.x); // screen-left (forward × up, negated)
        const plane = sectionArr && sectionArr[0];
        if (plane) {
          plane.normal.copy(nrm);
          plane.constant = 0;
          cut.align(nrm);
        }
        if (sectionOn() && state.mode === 'explore') {
          for (const st of overlays.sectionTags) labels.setPosition(st.el, tmp.copy(left).multiplyScalar(st.r()).setY(st.y));
        }
        if (state.mode === 'climb') {
          const s = pagoda.storeys[state.storey];
          const corridor = (s.coreR + s.shellR - s.wall) / 2;
          person.position.copy(left).multiplyScalar(corridor).addScaledVector(nrm, 1.1);
          person.position.y = s.y0 + 0.36;
          person.rotation.y = Math.atan2(-left.x, -left.z);
          labels.setPosition(overlays.personTag, tmp.copy(person.position).addScaledVector(left, 0.4).setY(s.y0 + 2.6));
          labels.setPosition(overlays.walkTag, tmp.copy(left).multiplyScalar(-corridor).addScaledVector(nrm, 0.5).setY(s.y0 + 1.2));
          const an = pagoda.tiers[2 * state.storey + 1];
          if (an) labels.setPosition(overlays.sealedTag, tmp.copy(left).multiplyScalar(-(an.radius - 0.2)).setY((an.y0 + an.y1) / 2));
        }
      };
      stage.onTick(frameTick);
      if (import.meta.env.DEV) {
        // Drive frames by hand when the preview runs in a background tab (rAF throttled).
        gsap.ticker.lagSmoothing(0);
        window.__ch4.frame = (n = 1) => {
          for (let i = 0; i < n; i++) {
            gsap.ticker.tick();
            frameTick(1 / 60, stage.elapsed + i / 60);
            stage.controls.update();
          }
          labels.update();
          stage.render();
        };
      }

      applyLook();
      applySection();
      applyMode();
      // Start a little framed for the stage's aspect ratio.
      const v = view('overview');
      camera.position.copy(v.pos);
      controls.target.copy(v.target);
      controls.update();
    } else {
      stageWrap.classList.add('is-fallback');
    }
  }

  /* ───────────── views ───────────── */
  function aspectFactor() {
    if (!stage) return 1;
    const a = stage.camera.aspect;
    return a < 1 ? 1 + (1 - a) * 1.1 : 1;
  }

  function orbit(target, az, horiz, rise, shift = false) {
    const k = aspectFactor();
    const pos = V(target.x + Math.sin(az) * horiz * k, target.y + rise * k, target.z + Math.cos(az) * horiz * k);
    if (shift && stage) {
      // Move the subject out from under the info card: to the right on wide stages, lower on narrow ones.
      const dist = pos.distanceTo(target);
      const tanV = Math.tan(THREE.MathUtils.degToRad(stage.camera.fov / 2));
      const off = stage.container.clientWidth >= 640 ? V(-Math.cos(az), 0, Math.sin(az)).multiplyScalar(dist * tanV * stage.camera.aspect * 0.32) : V(0, dist * tanV * 0.3, 0);
      pos.add(off);
      target = target.clone().add(off);
    }
    return { pos, target };
  }

  function view(id) {
    const P = pagoda;
    if (id === 'overview') return orbit(V(0, 29, 0), 0.42, 104, 6);
    if (id === 'finial') return orbit(V(0, P.finialBase + 1.6, 0), 0.5, 20, 3, true);
    if (id === 'lamp') {
      const t = P.tiers[12];
      return orbit(V(0, (t.y0 + t.y1) / 2 + 1.5, 0), 0.75, 26, 3, true);
    }
    if (id === 'bells') {
      const b = P.bellPositions[7 * 8 + 6];
      const az = Math.atan2(b.x, b.z) + 0.6;
      return orbit(V(b.x * 0.75, b.y - 1.5, b.z * 0.75), az, 24, -2, true);
    }
    if (id === 'carvings') return orbit(V(0, 4.5, 0), -0.75, 34, 4, true);
    if (id === 'section') return orbit(V(0, 16, 0), 0.42, 50, 5);
    if (id === 'eaves') {
      const t = P.tiers[3];
      return orbit(V(0, t.y1, 0), 0.62, 30, 3, true);
    }
    if (id === 'storey') {
      const s = P.storeys[state.storey];
      return orbit(V(0, s.y0 + 4, 0), 0.5, 52 + s.shellR * 0.4, 8);
    }
    return view('overview');
  }

  function flyTo(v, duration = 1.5) {
    if (!stage) return;
    const { camera, controls } = stage;
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);
    if (reduced) {
      camera.position.copy(v.pos);
      controls.target.copy(v.target);
      controls.update();
      return;
    }
    gsap.to(camera.position, { x: v.pos.x, y: v.pos.y, z: v.pos.z, duration, ease: 'power2.inOut' });
    gsap.to(controls.target, { x: v.target.x, y: v.target.y, z: v.target.z, duration, ease: 'power2.inOut' });
  }

  function goHome() {
    closeCard(false);
    if (state.mode === 'climb') leaveClimb();
    else flyTo(view('overview'));
  }

  /* ───────────── state → scene ───────────── */
  function sectionOn() {
    return state.section || state.mode === 'climb';
  }

  function setPeel(v) {
    state.peel = v;
    peelSlider.set(v);
    syncPeelBtn();
    applyPeel();
    if (v >= 0.98) markDone('ch4', 'peeled');
  }

  function animatePeel(to) {
    if (peelTween) peelTween.kill();
    if (reduced || !stage) {
      setPeel(to);
      return;
    }
    const proxy = { v: state.peel };
    peelTween = gsap.to(proxy, {
      v: to,
      duration: 2.4 * Math.abs(to - state.peel) + 0.2,
      ease: 'power2.inOut',
      onUpdate: () => setPeel(proxy.v),
    });
  }

  function applyPeel() {
    const v = state.peel;
    peelStatus.textContent =
      v > 0.98
        ? tr({ en: 'Now you see the Southern Song brick body: seven storeys, built in the 1150s–1160s.', zh: '现在看到的是南宋砖砌塔身：七层，建于 12 世纪 50—60 年代。' })
        : v > 0.02
          ? tr({ en: 'The timber is fading. Look for the brick storeys inside.', zh: '木檐正在变淡，留意里面一层层的砖塔身。' })
          : tr({ en: 'Thirteen eaves, as seen from the river.', zh: '从江上看，就是这十三重檐。' });
    if (!pagoda) return;
    pagoda.setPartOpacity('timber', 1 - v);
    const showBody = v > 0.001 || sectionOn();
    for (const p of ['shell', 'core', 'floors']) pagoda.setPartVisible(p, showBody);
    syncHotspots();
  }

  function applyLook() {
    const bp = state.style === 'blueprint';
    eraToggle.el.disabled = bp;
    eraNote.hidden = !bp;
    legend.classList.toggle('is-active', state.era && !bp);
    if (!pagoda) return;
    pagoda.setStyle(state.style);
    pagoda.setEraColors(state.era);
    // setStyle/setEraColors reset the ink outlines; re-apply the peel so they match the opacity.
    pagoda.setPartOpacity('timber', 1 - state.peel);
    cut.setLook(state.style, state.era);
    applyPalette();
  }

  function applyPalette() {
    if (!scenery) return;
    if (state.style === 'blueprint') scenery.applyPalette('blueprint');
    else scenery.applyPalette(state.style, 'dusk', state.lamp ? 0.85 : 0);
    pagoda.setLamp(state.lamp ? 1 : 0);
  }

  function applySection() {
    if (!pagoda) return;
    const on = sectionOn();
    pagoda.setSection(on);
    // The pagoda keeps one shared array of clipping planes; we steer its plane every frame.
    sectionArr = on ? pagoda.parts.plinth.children[0].material.clippingPlanes : null;
    cut.mesh.visible = on;
    for (const m of overlays.mats) {
      m.clippingPlanes = sectionArr || [];
      m.needsUpdate = true;
    }
    for (const st of overlays.sectionTags) labels.setHidden(st.el, !(on && state.mode === 'explore'));
    applyPeel();
  }

  function syncHotspots() {
    if (!labels) return;
    const climbing = state.mode === 'climb';
    for (const s of SPOTS) {
      const timberOnly = s.id === 'bells' || s.id === 'eaves';
      const hide = climbing || !!state.card || (timberOnly && state.peel > 0.7);
      labels.setHidden(spotEls[s.id], hide);
    }
  }

  /* ───────────── climb ───────────── */
  function climbTo(f) {
    closeCard(false);
    const entering = state.mode !== 'climb';
    state.mode = 'climb';
    state.storey = f;
    if (entering) applySection();
    applyMode();
    flyTo(view('storey'), entering ? 1.8 : 1.2);
    if (f === 6) markDone('ch4', 'climbed');
  }

  function leaveClimb() {
    state.mode = 'explore';
    state.storey = -1;
    applySection();
    applyMode();
    flyTo(view('overview'));
    announce(tr({ en: 'Back outside the tower', zh: '回到了塔外' }));
  }

  function applyMode() {
    const climbing = state.mode === 'climb';
    rungButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(climbing && i === state.storey)));
    upBtn.textContent = climbing ? tr({ en: 'Climb up a storey', zh: '往上一层' }) : tr({ en: 'Start the climb', zh: '开始登塔' });
    upBtn.disabled = climbing && state.storey >= 6;
    downBtn.textContent = tr({ en: 'Go down a storey', zh: '往下一层' });
    downBtn.hidden = !climbing;
    downBtn.disabled = state.storey <= 0;
    leaveBtn.hidden = !climbing;
    renderReadout();
    syncHotspots();
    if (!pagoda) return;
    for (const k of ['sealed', 'walk', 'floor', 'person']) overlays[k].visible = climbing;
    labels.setHidden(overlays.walkTag, !climbing);
    labels.setHidden(overlays.personTag, !climbing);
    labels.setHidden(overlays.sealedTag, !climbing || state.storey >= 6);
    if (!climbing) return;
    const f = state.storey;
    const s = pagoda.storeys[f];
    const ming = pagoda.tiers[2 * f];
    const an = pagoda.tiers[2 * f + 1];
    overlays.floor.geometry.dispose();
    overlays.floor.geometry = new THREE.RingGeometry(s.coreR + 0.05, s.shellR - s.wall - 0.05, 8, 1, -5 * HALF);
    overlays.floor.position.y = s.y0 + 0.4;
    overlays.walk.scale.set(ming.radius + 0.35, ming.height - 1.2, ming.radius + 0.35);
    overlays.walk.position.y = ming.y0 + (ming.height - 1.2) / 2;
    overlays.sealed.visible = !!an;
    if (an) {
      overlays.sealed.scale.set(an.radius + 0.35, an.height - 1.0, an.radius + 0.35);
      overlays.sealed.position.y = an.y0 + (an.height - 1.0) / 2;
      overlays.sealed.material.map.repeat.set(Math.round((an.radius * 2 * Math.PI) / 3), 1);
    }
  }

  function renderReadout() {
    readout.textContent = '';
    if (state.mode !== 'climb') {
      fillRich(
        readout.appendChild(h('p')),
        tr({
          en: 'Choose a storey, or press “Start the climb”. The model cuts open and a small figure shows where you would stand.',
          zh: '选一层，或者按“开始登塔”。模型会剖开，一个小人告诉你站在哪里。',
        }),
      );
      return;
    }
    const f = state.storey;
    const n = f + 1;
    const tier = 2 * f + 1;
    const hgt = pagoda ? Math.round(pagoda.storeys[f].y0) : null;
    readout.append(
      h('p', { class: 'ch4-readout__head' }, tr({ en: 'Storey {n} of 7 · tier {t} of 13', zh: '第 {n} 层（共 7 层）· 第 {t} 重（共 13 重）' }, { n, t: tier })),
    );
    let body;
    if (f === 0) {
      body = {
        en: 'The ground storey. Look down at the foot of the walls: the brick Sumeru plinths with their carvings start here. Above you, tier 2 is the first sealed level.',
        zh: '底层。低头看墙脚：带砖雕的须弥座从这里开始。头顶的第 2 重就是第一个暗层。',
      };
    } else if (f === 6) {
      body = {
        en: 'The top storey, and the last stop for the stairs. No sealed tier above: only the roof and the Yuan finial. Old accounts say a lamp burned up here at night to guide boats on the river.',
        zh: '顶层，也是楼梯的终点。上面没有暗层了，只有屋顶和元代塔刹。史料说，夜里这里点着明灯，为江上的船指路。',
      };
    } else {
      body = {
        en: 'You have passed {s} sealed tier{p} on the way up. Above you, tier {a} is sealed too: it has an eave outside but no floor you can reach.',
        zh: '一路上来，你已经经过了 {s} 个暗层。头顶的第 {a} 重也是暗层：外面有檐，里面却没有能走上去的楼面。',
      };
    }
    readout.append(h('p', null, tr(body, { s: f, p: f === 1 ? '' : 's', a: tier + 1 })));
    if (hgt != null) {
      readout.append(
        h(
          'p',
          { class: 'note' },
          tr({ en: 'Floor level in our model: about {m} m above the ground.', zh: '在本模型中，这层楼面约离地 {m} 米。' }, { m: hgt }),
        ),
      );
    }
    announce(tr({ en: 'Storey {n} of 7', zh: '第 {n} 层' }, { n }));
  }

  /* ───────────── cards ───────────── */
  let cardTrigger = null;

  function cardActions(id) {
    const row = h('div', { class: 'ch4-row ch4-card__actions' });
    if (id === 'bells') {
      row.append(
        btn({ en: 'Ring the bells', zh: '让风铃响起来' }, 'btn', () => {
          windBoost = 1.2;
          audio.bell(0.9);
          setTimeout(() => audio.bell(0.6), 380);
          if (!audio.isEnabled()) announce(tr({ en: 'Turn the sound on in the top bar to hear the bells.', zh: '在顶栏打开声音，才能听到铃声。' }));
        }),
      );
      if (!audio.isEnabled()) row.append(bi({ en: 'Sound is off: turn it on in the top bar to hear them.', zh: '声音已关闭，可在顶栏打开。' }, 'p', { class: 'note' }));
    }
    if (id === 'lamp') {
      const b = h('button', { type: 'button', class: 'btn', 'aria-pressed': String(state.lamp) });
      const sync = () => {
        b.textContent = state.lamp ? tr({ en: 'Put out the lamp', zh: '熄灭明灯' }) : tr({ en: 'Light the lamp', zh: '点亮明灯' });
        b.setAttribute('aria-pressed', String(state.lamp));
      };
      sync();
      b.addEventListener('click', () => {
        state.lamp = !state.lamp;
        applyPalette();
        sync();
      });
      row.append(b);
    }
    if (id === 'carvings' || id === 'eaves') {
      if (state.peel < 0.98) row.append(btn({ en: 'Peel the timber away', zh: '剥去木外檐' }, 'btn', () => animatePeel(1)));
      if (id === 'carvings' && onCarvingsLink)
        row.append(btn({ en: 'See drawings of the motifs', zh: '看纹样示意图' }, 'btn btn--ghost', () => {
          closeCard(false);
          onCarvingsLink();
        }));
    }
    if (id === 'finial' && !state.era && state.style !== 'blueprint') {
      row.append(btn({ en: 'Colour by dynasty', zh: '按朝代上色' }, 'btn btn--ghost', () => {
        eraToggle.set(true, true);
        renderCard();
      }));
    }
    return row;
  }

  function renderCard() {
    const s = SPOTS.find((x) => x.id === state.card);
    if (!s) return;
    cardEl.textContent = '';
    const title = h('h4', { class: 'ch4-card__title', id: 'ch4-card-title', tabindex: '-1' }, tr(s.name));
    const close = h('button', { type: 'button', class: 'ch4-card__close', 'aria-label': tr({ en: 'Close', zh: '关闭' }) }, '×');
    close.addEventListener('click', () => closeCard(true));
    cardEl.setAttribute('aria-labelledby', 'ch4-card-title');
    cardEl.append(
      close,
      title,
      h('p', { class: 'ch4-card__era' }, tr(s.era)),
      fillRich(h('p', { class: 'ch4-card__body' }), tr(s.body)),
      cardActions(s.id),
    );
    return title;
  }

  function openCard(id, trigger) {
    if (state.mode === 'climb') leaveClimb();
    state.card = id;
    cardTrigger = trigger;
    cardEl.hidden = false;
    for (const b of Object.values(spotEls)) b.setAttribute('aria-expanded', 'false');
    if (spotEls[id]) spotEls[id].setAttribute('aria-expanded', 'true');
    const title = renderCard();
    syncHotspots();
    if (pagoda) flyTo(view(id), 1.4);
    // On small screens the stage may be above the fold of the panel button.
    if (trigger && !stageEl.contains(trigger)) stageWrap.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    title.focus({ preventScroll: true });
  }

  function closeCard(refocus) {
    if (!state.card) return;
    state.card = null;
    if (state.lamp) {
      // The lamp is a demonstration inside its card; put it out when the card closes.
      state.lamp = false;
      applyPalette();
    }
    cardEl.hidden = true;
    for (const b of Object.values(spotEls)) b.setAttribute('aria-expanded', 'false');
    syncHotspots();
    if (refocus && cardTrigger) cardTrigger.focus({ preventScroll: true });
    cardTrigger = null;
  }

  cardEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCard(true);
  });

  /* language changes: rebuild the text the lab writes itself */
  onLang(el, () => {
    syncPeelBtn();
    applyPeel();
    applyMode();
    if (state.card) renderCard();
  });

  return { el, init, peelTo: animatePeel, stageWrap };
}
