/**
 * Prologue: "The Eighteenth Night".
 * A pinned, scroll-driven opening. Scrolling brings the tidal bore up the Qiantang River,
 * past the Liuhe Pagoda, while night turns to dawn and the camera climbs the tower.
 */
import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { h, bi, reducedMotion } from '../../core/ui.js';
import { tr, onLangChange } from '../../core/i18n.js';
import * as audio from '../../core/audio.js';
import { markDone } from '../../core/progress.js';
import { registerVocab } from '../../core/vocab.js';
import { createStage, THREE } from '../../three/stage.js';
import { createPagoda } from '../../three/pagoda.js';
import { createLandscape, WATER_Y, RIVER_NEAR, RIVER_FAR } from '../../three/landscape.js';
import { glow } from '../../three/textures.js';

gsap.registerPlugin(ScrollTrigger);

const CAPTIONS = [
  {
    range: [0.04, 0.27],
    en: 'Every autumn, around the eighteenth day of the eighth lunar month, the sea pushes into the Qiantang River as one long wall of water.',
    zh: '每年农历八月十八前后，海潮涌进钱塘江，在江面上推成一道长长的水墙。',
  },
  {
    range: [0.3, 0.52],
    en: 'This is the tidal bore. It travels upstream, against the current, and people in Hangzhou have gathered to watch it for well over a thousand years.',
    zh: '这就是涌潮。它逆着江流往上游推进。杭州人观潮的历史，已经有一千多年。',
  },
  {
    range: [0.55, 0.78],
    en: 'In 970, a pagoda was raised on Yuelun Hill above the river. People hoped it would calm the tide. It still stands: the Liuhe Pagoda, the Pagoda of Six Harmonies.',
    zh: '公元 970 年，人们在江边的月轮山上建起一座塔，希望它能镇住江潮。这座塔今天还在，就是六和塔。',
  },
  {
    range: [0.8, 1.01],
    en: 'Read on to follow the river, take the tower apart, make a tide of your own, and learn to tell this story in English.',
    zh: '接着往下看：认识这条江，拆开这座塔，亲手造一次潮，再学着用英文把这个故事讲出来。',
  },
];

// Camera keyframes: [progress, position, look-at target]
const KEYS = [
  [0.0, [-210, 5, 175], [40, 32, 0]],
  [0.3, [-70, 6, 300], [600, 0, 390]],
  [0.5, [70, 4, 335], [280, 1, 360]],
  [0.63, [45, 20, 200], [0, 24, 20]],
  [0.8, [62, 44, 46], [0, 44, 0]],
  [1.0, [-28, 74, -98], [260, 0, 430]],
];

const BORE_START_X = 1100; // where the front is at progress 0 (east, toward the sea)
const BORE_TRAVEL = 1800; // metres travelled over the whole prologue
const BORE_H = 3.0;

registerVocab('ch0', [
  {
    id: 'tide-tidal-bore',
    en: 'tidal bore',
    zh: '涌潮',
    pinyin: 'yǒng cháo',
    def: {
      en: 'A wave or wall of water that travels up a river against the current when the tide comes in.',
      zh: '涨潮时逆着河流向上游推进的潮头或水墙。',
    },
    example: { en: 'The Qiantang tidal bore is strongest in autumn.', zh: '钱塘江涌潮在秋天最为壮观。' },
  },
  {
    id: 'cal-lunar-month',
    en: 'lunar month',
    zh: '农历月',
    pinyin: 'nóng lì yuè',
    def: {
      en: 'A month of the traditional Chinese calendar, which follows the phases of the moon.',
      zh: '中国传统历法中的月份，按月相变化计算。',
    },
    example: { en: 'The festival falls on the eighteenth day of the eighth lunar month.', zh: '这个节日在农历八月十八。' },
  },
  {
    id: 'pagoda-pagoda',
    en: 'pagoda',
    zh: '塔',
    pinyin: 'tǎ',
    def: {
      en: 'A tower with several storeys and roofs, usually linked to Buddhism.',
      zh: '多层、多檐的高塔，通常与佛教有关。',
    },
    example: { en: 'The Liuhe Pagoda overlooks the Qiantang River.', zh: '六和塔俯瞰着钱塘江。' },
  },
  {
    id: 'geo-upstream',
    en: 'upstream',
    zh: '上游；逆流',
    pinyin: 'shàng yóu',
    def: {
      en: 'Toward the source of a river, against the direction the water usually flows.',
      zh: '朝河流源头的方向，与水流通常的方向相反。',
    },
    example: { en: 'The bore travels upstream from the bay.', zh: '潮头从海湾向上游推进。' },
  },
]);

function buildCurves() {
  const pos = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k[1])), false, 'centripetal');
  const tgt = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k[2])), false, 'centripetal');
  return { pos, tgt };
}

/** Map overall progress p onto the keyframe curve parameter. */
function curveParam(p) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i][0];
    const b = KEYS[i + 1][0];
    if (p <= b || i === KEYS.length - 2) {
      const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
      const s = t * t * (3 - 2 * t);
      return (i + s) / (KEYS.length - 1);
    }
  }
  return 1;
}

function waveSvg() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 112 10');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  let d = 'M0 5';
  for (let x = 0; x < 112; x += 14) d += ` q 3.5 -5 7 0 t 7 0`;
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#e0aa45');
  path.setAttribute('stroke-width', '1.6');
  svg.append(path);
  return svg;
}

/** Spray thrown up along the breaking front. */
function createSpray(count = 1600) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    seeds[i * 3] = Math.random(); // behind-front offset
    seeds[i * 3 + 1] = Math.random(); // phase
    seeds[i * 3 + 2] = RIVER_NEAR + 12 + Math.random() * (RIVER_FAR - RIVER_NEAR - 24); // z
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 3.2,
    map: glow('rgba(255,255,255,1)', 'rgba(255,255,255,0)'),
    color: '#f4f5ef',
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return {
    points,
    update(frontX, height, elapsed, wobbleFn) {
      for (let i = 0; i < count; i++) {
        const back = seeds[i * 3];
        const ph = seeds[i * 3 + 1];
        const z = seeds[i * 3 + 2];
        const life = (elapsed * 0.7 + ph) % 1;
        const x = frontX + wobbleFn(z) + back * 9 + life * 4;
        const y = WATER_Y + height * (0.9 + 0.9 * Math.sin(life * Math.PI)) + back * 0.6;
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = Math.min(0.6, height * 0.3);
    },
  };
}

export default {
  id: 'ch0',
  ambience: { river: 0.45, wind: 0.15, rumble: 0.05 },
  sources: [
    {
      title: { en: 'Hangzhou Municipal Government: Liuhe Pagoda', zh: '杭州市人民政府：六和塔（英文页）' },
      url: 'https://www.ehangzhou.gov.cn/2018-06/14/c_242884.htm',
    },
    {
      title: { en: 'Hangzhou News: the Liuhe Pagoda and the Qiantang tide (2021)', zh: '杭州网：六和塔与钱江潮（2021）' },
      url: 'https://hznews.hangzhou.com.cn/wghz/content/2021-12/31/content_8133553.htm',
    },
    {
      title: { en: "People's Daily: the forms of the Qiantang tide (2023)", zh: '人民日报：钱塘潮有多少种形态（2023）' },
      url: 'https://paper.people.com.cn/rmrb/html/2023-09/18/nw.D110000renmrb_20230918_2-13.htm',
    },
  ],

  mount(section) {
    section.classList.add('chapter--bleed');
    const still = reducedMotion();

    const stageEl = h('div', { class: 'stage' });
    const viewport = h('div', { class: 'ch0-viewport' }, stageEl);

    const title = h(
      'div',
      { class: 'ch0-title' },
      h('h1', { class: 'ch0-title__zh', lang: 'zh-CN' }, '潮起六和'),
      h(
        'div',
        { class: 'ch0-title__side' },
        h('p', { class: 'ch0-title__en', lang: 'en' }, 'Where the Tide Turns'),
        bi(
          {
            en: 'The Liuhe Pagoda and the Qiantang tidal bore, Hangzhou. A bilingual guide for learners of English and of China.',
            zh: '杭州六和塔与钱江潮。一份中英双语的学习指南，讲给想了解中国、也想练好英文的你。',
          },
          'p',
          { class: 'ch0-title__intro' },
        ),
      ),
    );

    const captionEls = CAPTIONS.map((c) => bi(c, 'p', { class: 'ch0-caption' }));
    const captions = h('div', { class: 'ch0-captions', 'aria-live': still ? null : 'polite' }, captionEls);

    const hint = h(
      'div',
      { class: 'ch0-hint', 'aria-hidden': 'true' },
      bi({ en: 'Scroll to bring in the tide', zh: '向下滚动，潮水就来了' }),
      h('span', { class: 'ch0-hint__line' }, waveSvg()),
    );

    const skip = bi({ en: 'Skip the opening', zh: '跳过开场' }, 'button', { class: 'ch0-skip', type: 'button' });
    skip.addEventListener('click', () => {
      const next = document.getElementById('ch1');
      if (next) next.scrollIntoView({ behavior: still ? 'auto' : 'smooth' });
    });

    const root = h('div', { class: `ch0${still ? ' ch0--static' : ''}` }, viewport, title, skip, captions, hint);
    section.append(root);

    const stage = createStage(stageEl, { fov: 42, far: 12000, camera: KEYS[0][1], target: KEYS[0][2] });
    if (!stage) {
      root.classList.add('ch0--static');
      return;
    }

    const land = createLandscape(stage.scene, { preset: 'night', bridge: true, stage });
    const pagoda = createPagoda({ interior: false });
    stage.scene.add(pagoda.group);
    land.river.setReflections({ towerHeight: pagoda.height });
    land.river.setBore(0, { dir: [-1, 0], pos: -BORE_START_X, height: BORE_H, width: 14, wobble: 1 });
    land.river.setLamp(1, new THREE.Vector3(0, pagoda.tiers[12].y0 + 2, 0));
    const spray = createSpray();
    stage.scene.add(spray.points);

    const curves = buildCurves();
    const camPos = new THREE.Vector3();
    const camTgt = new THREE.Vector3();

    let target = still ? 0.62 : 0;
    let cur = target;
    let lastFrontX = null;
    let lastAmb = -1;
    let completed = false;

    const wobble = (z) => 1 * (Math.sin(z * 0.006 + 1.7) * 9);

    function apply(p, elapsed, dt) {
      // camera
      const u = curveParam(p);
      curves.pos.getPoint(u, camPos);
      curves.tgt.getPoint(u, camTgt);
      stage.camera.position.copy(camPos);
      stage.camera.lookAt(camTgt);

      // sky: night → dawn → early day
      if (p < 0.45) land.mixPresets('night', 'dawn', p / 0.45);
      else land.mixPresets('dawn', 'day', Math.min(0.55, (p - 0.45) / 0.55));

      // lamp fades as dawn comes
      const lamp = Math.max(0, 1 - p / 0.32);
      pagoda.setLamp(lamp);
      land.river.setLamp(lamp);

      // the bore
      const frontX = BORE_START_X - BORE_TRAVEL * p;
      land.river.setBore(0, { pos: -frontX });
      spray.update(frontX, BORE_H, elapsed, wobble);

      // sound: rumble grows as the front nears the camera; a surge as it passes
      const dist = Math.abs(frontX - camPos.x);
      const rumble = Math.max(0, 1 - dist / 1000) * 0.9;
      if (Math.abs(rumble - lastAmb) > 0.04) {
        audio.setAmbience({ river: 0.45, wind: 0.15, rumble }, 0.6);
        lastAmb = rumble;
      }
      if (lastFrontX != null && Math.sign(lastFrontX - camPos.x) !== Math.sign(frontX - camPos.x)) {
        audio.surge(1, 7);
      }
      lastFrontX = frontX;

      const nearPagoda = Math.abs(frontX) < 160;
      const rang = pagoda.update(elapsed, { wind: nearPagoda ? 0.8 : 0.3 });
      if (rang.length) audio.bell(0.5 + Math.random() * 0.4);

      if (!still) {
        title.style.opacity = String(Math.max(0, 1 - p / 0.1));
        skip.style.visibility = p > 0.12 ? 'hidden' : '';
        hint.style.opacity = String(Math.max(0, 1 - p / 0.06));
        CAPTIONS.forEach((c, i) => captionEls[i].classList.toggle('is-on', p >= c.range[0] && p < c.range[1]));
      }
      if (!completed && p > 0.97) {
        completed = true;
        markDone('ch0', 'watched-the-tide');
      }
    }

    // Portrait phones: widen the vertical field of view so the pagoda and river still fit.
    let lastAspect = 0;
    const fitFov = () => {
      const a = stage.camera.aspect;
      if (a === lastAspect) return;
      lastAspect = a;
      stage.camera.fov = a < 1 ? Math.min(70, 42 / Math.pow(a, 0.65)) : 42;
      stage.camera.updateProjectionMatrix();
    };

    stage.onTick((dt, elapsed) => {
      fitFov();
      // ease toward the scroll position so the camera glides instead of jumping
      cur += (target - cur) * Math.min(1, dt * 4);
      if (Math.abs(target - cur) < 0.0005) cur = target;
      land.update(dt, elapsed);
      apply(cur, elapsed, dt);
    });

    if (!still) {
      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: '+=320%',
        pin: true,
        pinSpacing: true,
        onUpdate: (self) => {
          target = self.progress;
        },
      });
      // Other chapters mount lazily below and change the page height.
      let timer = 0;
      const ro = new ResizeObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(() => ScrollTrigger.refresh(), 250);
      });
      ro.observe(document.getElementById('main') || document.body);
    } else {
      apply(target, 0, 0);
    }

    onLangChange(() => ScrollTrigger.refresh());
    if (import.meta.env.DEV) window.__ch0 = { stage, land, pagoda };
  },
};
