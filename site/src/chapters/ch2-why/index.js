/**
 * Chapter 2: Why a Pagoda Here?
 * Scrollytelling: text steps on the left drive a sticky 3D scene on the right.
 *   A. 910: the river eats its banks; King Qian Liu's bamboo-cage seawall (pagoda not built yet)
 *   B. 970: the pagoda rises; what "Six Harmonies" means (six directions / six harmonies)
 *   C. a lamp for the boats: light it and the boats hold their course
 *   D. faith and engineering: choose an English verb for 镇潮
 */
import './style.css';
import { gsap } from 'gsap';
import { h, bi, chapterHeader, segmented, term, reducedMotion, announce } from '../../core/ui.js';
import { tr, onLangChange } from '../../core/i18n.js';
import * as audio from '../../core/audio.js';
import { markDone } from '../../core/progress.js';
import { registerVocab, getWord } from '../../core/vocab.js';
import { createStage, THREE } from '../../three/stage.js';
import { createPagoda } from '../../three/pagoda.js';
import { createLandscape, WATER_Y, RIVER_NEAR, RIVER_FAR } from '../../three/landscape.js';
import { createLabels } from '../../three/labels.js';
import { canvasTexture, glow } from '../../three/textures.js';

const VOCAB = [
  {
    id: 'hist-kingdom',
    en: 'kingdom',
    zh: '王国',
    pinyin: 'wáng guó',
    def: { en: 'A country ruled by a king or queen.', zh: '由国王统治的国家。' },
    example: { en: 'Hangzhou was the capital of the Kingdom of Wuyue.', zh: '杭州曾是吴越国的都城。' },
  },
  {
    id: 'eng-seawall',
    en: 'seawall',
    zh: '海塘',
    pinyin: 'hǎi táng',
    def: { en: 'A strong wall built along a coast or river mouth to keep out the sea.', zh: '沿海岸或江口修筑、用来抵挡海潮的堤坝。' },
    example: { en: 'The seawall was built from bamboo cages filled with stones.', zh: '这道海塘用装满石块的竹笼筑成。' },
  },
  {
    id: 'cult-legend',
    en: 'legend',
    zh: '传说',
    pinyin: 'chuán shuō',
    def: { en: 'An old story that many people tell, which may not be historically true.', zh: '流传很久、未必真实发生过的故事。' },
    example: { en: 'Legend says the king shot arrows at the tide.', zh: '传说钱王曾向潮头放箭。' },
  },
  {
    id: 'cult-monk',
    en: 'monk',
    zh: '僧人',
    pinyin: 'sēng rén',
    def: { en: 'A man who lives in a religious community, here a Buddhist one.', zh: '出家修行的人，这里指佛教僧人。' },
    example: { en: 'A Buddhist monk led the building of the pagoda.', zh: '一位僧人主持修建了这座塔。' },
  },
  {
    id: 'cult-harmony',
    en: 'harmony',
    zh: '和；和谐',
    pinyin: 'hé xié',
    def: { en: 'A peaceful state in which people or things fit well together.', zh: '人与人、事物与事物之间相处融洽的状态。' },
    example: { en: 'The name means “Six Harmonies”.', zh: '塔名的意思是“六种和合”。' },
  },
  {
    id: 'nav-beacon',
    en: 'beacon',
    zh: '航标灯',
    pinyin: 'háng biāo dēng',
    def: { en: 'A light placed high up to guide ships or warn them of danger.', zh: '设在高处、为船只指引方向或警示危险的灯。' },
    example: { en: 'At night the pagoda worked as a beacon for boats.', zh: '夜里，这座塔就像一盏为船指路的航标灯。' },
  },
  {
    id: 'trans-suppress',
    en: 'to suppress',
    zh: '镇（压住）',
    pinyin: 'zhèn',
    def: { en: 'To stop something by force. One possible translation of 镇 in 镇潮.', zh: '用力量压制住某种东西；是“镇潮”中“镇”的一种译法。' },
    example: { en: 'The pagoda was built to suppress the tide.', zh: '这座塔是为镇潮而建的。' },
  },
];
registerVocab('ch2', VOCAB);
const W = (id) => getWord(id);

const STEPS = ['a', 'b', 'c', 'd'];

// Camera per step: position, target
const CAMS = {
  a: { p: [-34, 1.5, 84], t: [30, -4, 47], preset: 'dusk' },
  b: { p: [62, 28, 122], t: [0, 30, 0], preset: 'day' },
  c: { p: [-130, 16, 340], t: [30, 24, 0], preset: 'night' },
  d: { p: [170, 70, 420], t: [0, 18, 0], preset: 'dusk' },
};

const HARMONIES = [
  ['身和同住', { en: 'Live together in peace', zh: '身体上和睦共处' }],
  ['口和无诤', { en: 'Speak without quarrelling', zh: '言语上不起争执' }],
  ['意和同悦', { en: 'Share joy in mind', zh: '心意上同喜同乐' }],
  ['戒和同修', { en: 'Keep the same rules of conduct', zh: '共同遵守戒律' }],
  ['见和同解', { en: 'Share the same understanding', zh: '见解上达成一致' }],
  ['利和同均', { en: 'Share benefits equally', zh: '利益上平均分享' }],
];

const DIRECTIONS = [
  { zh: '天', en: 'Heaven', v: [0, 1, 0] },
  { zh: '地', en: 'Earth', v: [0, -1, 0] },
  { zh: '东', en: 'East', v: [1, 0, 0] },
  { zh: '西', en: 'West', v: [-1, 0, 0] },
  { zh: '南', en: 'South', v: [0, 0, 1] },
  { zh: '北', en: 'North', v: [0, 0, -1] },
];

const VERBS = [
  {
    id: 'calm',
    label: 'to calm the tide',
    feedback: {
      en: 'Gentle and true to the wish behind the tower: people hoped the river would grow quiet. A good choice for most readers.',
      zh: '语气温和，准确传达了“愿江水平静”的心愿，适合大多数读者。',
    },
  },
  {
    id: 'suppress',
    label: 'to suppress the tide',
    feedback: {
      en: 'Closest to the literal 镇 (to press down, to hold in place), but in English it can sound forceful or even political. Add a sentence of context if you use it.',
      zh: '最贴近“镇”的字面意思（压住、镇住），但在英文里可能显得强硬，甚至带政治色彩。用它时最好补一句背景说明。',
    },
  },
  {
    id: 'guard',
    label: 'to guard against the tide',
    feedback: {
      en: 'Sounds practical, like a flood barrier. It loses the religious hope behind the tower, so pair it with a sentence about faith.',
      zh: '听起来像防洪工程，很实用，却丢掉了塔背后的信仰色彩，最好再补一句说明。',
    },
  },
];

/* ───────────── 3D props ───────────── */

function cageTexture() {
  return canvasTexture(128, 128, (g, w, hgt) => {
    g.fillStyle = '#6f6a5c';
    g.fillRect(0, 0, w, hgt);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(${150 + Math.random() * 60},${145 + Math.random() * 50},${130 + Math.random() * 40},0.9)`;
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * hgt, 5 + Math.random() * 9, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = '#c9a85a';
    g.lineWidth = 4;
    for (let k = -w; k < w * 2; k += 22) {
      g.beginPath();
      g.moveTo(k, 0);
      g.lineTo(k + hgt, hgt);
      g.stroke();
      g.beginPath();
      g.moveTo(k + hgt, 0);
      g.lineTo(k, hgt);
      g.stroke();
    }
  }, { repeat: [3, 1] });
}

/** King Qian Liu's seawall: bamboo cages of stone, lines of timber piles. */
function createSeawall() {
  const group = new THREE.Group();
  const cageGeo = new THREE.CylinderGeometry(1.5, 1.5, 3.4, 10, 1);
  cageGeo.rotateX(Math.PI / 2);
  const cageMat = new THREE.MeshStandardMaterial({ map: cageTexture(), roughness: 1 });
  const span = 1400;
  const step = 3.1;
  const n = Math.floor(span / step);
  const cages = new THREE.InstancedMesh(cageGeo, cageMat, n * 3);
  const m = new THREE.Matrix4();
  let k = 0;
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < n; i++) {
      const x = -span / 2 + i * step + (row === 1 ? step / 2 : 0);
      const y = WATER_Y + 1.4 + (row === 2 ? 2.7 : 0);
      const z = RIVER_NEAR + 4 - (row === 1 ? 3.0 : 0) - (row === 2 ? 1.5 : 0);
      m.makeTranslation(x, y, z);
      cages.setMatrixAt(k++, m);
    }
  }
  group.add(cages);
  const pileGeo = new THREE.CylinderGeometry(0.18, 0.22, 5, 6);
  const piles = new THREE.InstancedMesh(pileGeo, new THREE.MeshStandardMaterial({ color: '#5b4a36', roughness: 1 }), Math.floor(span / 1.4));
  for (let i = 0; i < piles.count; i++) {
    m.makeTranslation(-span / 2 + i * 1.4, WATER_Y + 1.6, RIVER_NEAR + 6.6);
    piles.setMatrixAt(i, m);
  }
  group.add(piles);
  return group;
}

function createArrow(dir, length = 20, color = '#e0aa45') {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, length - 3, 8), mat);
  shaft.position.y = (length - 3) / 2;
  const head = new THREE.Mesh(new THREE.ConeGeometry(2, 3.6, 12), mat);
  head.position.y = length - 1.5;
  g.add(shaft, head);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize());
  return g;
}

function createBoat() {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-6, 0.6);
  shape.quadraticCurveTo(-5.5, -0.9, -2, -1.1);
  shape.lineTo(3.5, -1.1);
  shape.quadraticCurveTo(6.2, -0.6, 6.8, 1.2);
  shape.lineTo(-6, 0.6);
  const hullGeo = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false });
  hullGeo.translate(0, 0, -1.5);
  const hull = new THREE.Mesh(hullGeo, new THREE.MeshStandardMaterial({ color: '#3a2a1f', roughness: 0.9 }));
  g.add(hull);
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0);
  sailShape.lineTo(4.2, 0.4);
  sailShape.lineTo(3.4, 8.6);
  sailShape.lineTo(-0.4, 8.2);
  sailShape.lineTo(0, 0);
  const sail = new THREE.Mesh(
    new THREE.ShapeGeometry(sailShape),
    new THREE.MeshStandardMaterial({ color: '#8a6a45', roughness: 1, side: THREE.DoubleSide }),
  );
  sail.position.set(-1.5, 1.1, 0);
  sail.rotation.y = Math.PI / 2 - 0.25;
  g.add(sail);
  const lantern = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glow(), color: '#ffcf7a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  lantern.position.set(5.5, 2.4, 0);
  lantern.scale.set(3.2, 3.2, 1);
  g.add(lantern);
  g.userData.lantern = lantern;
  return g;
}

/* ───────────── Chapter ───────────── */

export default {
  id: 'ch2',
  ambience: { river: 0.5, wind: 0.25, rumble: 0 },
  sources: [
    {
      title: { en: 'Hangzhou News: the Qiantang seawall, "a Great Wall on the sea" (2025)', zh: '杭州网：钱塘的“塘”是海塘的“塘”（2025）' },
      url: 'https://hznews.hangzhou.com.cn/chengshi/content/2025-05/19/content_8997549_2.htm',
    },
    {
      title: { en: 'Tide News: Qian Liu’s bamboo-cage seawall and the legend of shooting the tide', zh: '潮新闻：钱氏捍海塘与“钱王射潮”' },
      url: 'https://tidenews.com.cn/news.html?id=2937732',
    },
    {
      title: { en: 'Hangzhou News: Liuhe Pagoda, built in 970 by Qian Chu to calm the tide (2021)', zh: '杭州网：钱弘俶建六和塔以镇江潮（2021）' },
      url: 'https://hznews.hangzhou.com.cn/wghz/content/2021-12/31/content_8133553.htm',
    },
    {
      title: { en: 'Hangzhou Municipal Government: Liuhe Pagoda', zh: '杭州市人民政府：六和塔' },
      url: 'https://www.ehangzhou.gov.cn/2018-06/14/c_242884.htm',
    },
    {
      title: { en: 'Maigoo: Liuhe Pagoda (quotes the Xianchun Lin’an Zhi on Zhijue/Yanshou founding the pagoda)', zh: '买购网：六和塔（引《咸淳临安志》“智觉禅师延寿始于钱氏南果园开山建塔”）' },
      url: 'https://m.maigoo.com/citiao/139599.html',
      note: { en: 'secondary; quotes the Song gazetteer', zh: '二手资料，转引宋代方志' },
    },
    {
      title: { en: 'Ctrip guide: Liuhe Pagoda (lamp at the top guiding boats at night)', zh: '携程：六和塔（顶层明灯为夜航船只指路）' },
      url: 'https://gs.ctrip.com/html5/you/sight/hangzhou14/2039.html',
      note: { en: 'travel guide; treat as secondary', zh: '旅游资料，仅作参考' },
    },
  ],

  mount(section) {
    const still = reducedMotion();

    section.append(
      chapterHeader({
        plaque: '镇潮',
        index: 2,
        title: { en: 'Why a Pagoda Here?', zh: '为什么在这里建塔' },
        lede: {
          en: 'A river that floods, a kingdom that fights back, and a tower that keeps a lamp burning.',
          zh: '一条会决堤的江，一个与潮水较劲的王国，还有一座点着灯的塔。',
        },
      }),
    );

    /* ── Text steps ── */
    const releaseBtn = bi({ en: 'Send in a tide', zh: '放一次潮' }, 'button', { type: 'button', class: 'btn' });
    const meaning = segmented({
      ariaLabel: { en: 'Two readings of the name', zh: '塔名的两种解释' },
      options: [
        { value: 'directions', label: { en: 'Six directions 六合', zh: '天地四方（六合）' } },
        { value: 'harmonies', label: { en: 'Six harmonies 六和', zh: '六和敬' } },
      ],
      value: 'directions',
      onChange: (v) => {
        harmonyList.hidden = v === 'directions';
        directionNote.hidden = v !== 'directions';
        if (setMeaning3D) setMeaning3D(v);
      },
    });
    const lampBtn = h('button', { type: 'button', class: 'btn', 'aria-pressed': 'false' });
    let setMeaning3D = null;

    const harmonyList = h(
      'ul',
      { class: 'ch2-harmonies', hidden: true },
      HARMONIES.map(([zh, pair]) => h('li', null, h('span', { class: 'zh', lang: 'zh-CN' }, zh), bi(pair))),
    );
    const directionNote = bi(
      {
        en: 'Heaven, earth, east, west, south and north: together they mean the whole world. That is why the tower is also written 六合塔.',
        zh: '天、地、东、西、南、北，合起来指整个天地。所以这座塔也写作“六合塔”。',
      },
      'p',
      { class: 'note' },
    );

    const feedback = h('p', { class: 'ch2-feedback', 'aria-live': 'polite' });
    let chosenVerb = null;
    const verbButtons = VERBS.map((v) => {
      const b = h('button', { type: 'button', 'aria-pressed': 'false', lang: 'en' }, v.label);
      b.addEventListener('click', () => {
        chosenVerb = v;
        verbButtons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        feedback.textContent = tr(v.feedback);
        markDone('ch2', 'chose-a-verb');
      });
      return b;
    });
    onLangChange(() => {
      if (chosenVerb) feedback.textContent = tr(chosenVerb.feedback);
    });

    const stepEls = {
      a: h(
        'article',
        { class: 'ch2-step', 'data-step': 'a' },
        bi({ en: '910, the Kingdom of Wuyue', zh: '公元 910 年，吴越国' }, 'span', { class: 'ch2-date' }),
        bi({ en: 'A river that eats its banks', zh: '吞岸的江' }, 'h3'),
        h(
          'p',
          null,
          bi({
            en: 'In the tenth century Hangzhou was the capital of Wuyue, a small ',
            zh: '十世纪时，杭州是吴越国的都城。这个小',
          }),
          term(W('hist-kingdom'), { en: 'kingdom', zh: '王国' }),
          bi({
            en: ' on the lower Qiantang. Its wealth came from the river, and so did its worst floods: big tides broke the earthen banks and turned farmland into river.',
            zh: '靠钱塘江富裕起来，最大的祸患也来自钱塘江：大潮冲垮土堤，把农田变成江面。',
          }),
        ),
        h(
          'p',
          null,
          bi({ en: 'In 910 King Qian Liu ordered a new ', zh: '公元 910 年，吴越王钱镠下令修筑新的' }),
          term(W('eng-seawall'), { en: 'seawall', zh: '海塘' }),
          bi({
            en: ': huge bamboo cages packed with stones, held in place by rows of timber piles. Modern archaeology has confirmed how sturdy this structure was.',
            zh: '：用巨竹编成竹笼，里面填满石块，再打下成排的木桩加固。现代考古证实了这种结构的坚固耐久。',
          }),
        ),
        h(
          'p',
          { class: 'ch2-legend' },
          bi({ en: 'A ', zh: '' }),
          term(W('cult-legend'), { en: 'legend', zh: '传说' }),
          bi({
            en: ' adds that the king had archers shoot arrows at the incoming tide until it turned back. Old histories such as the Xianchun Lin’an Zhi record the story; the seawall was real.',
            zh: '还说，钱王命弓箭手向潮头放箭，硬是把潮水逼退，这就是“钱王射潮”。《吴越备史》《咸淳临安志》等书都有记载；海塘则是真实存在的工程。',
          }),
        ),
        h('div', { class: 'ch2-controls' }, releaseBtn),
      ),
      b: h(
        'article',
        { class: 'ch2-step', 'data-step': 'b' },
        bi({ en: '970', zh: '公元 970 年' }, 'span', { class: 'ch2-date' }),
        bi({ en: 'A tower to calm the water', zh: '一座镇潮的塔' }, 'h3'),
        h(
          'p',
          null,
          bi({
            en: 'In 970 Qian Chu, the last king of Wuyue, gave up his south orchard on Yuelun Hill so that a pagoda could be built there. The Buddhist ',
            zh: '公元 970 年，吴越国最后一位国王钱弘俶舍出月轮山上的南果园，在那里建塔。主持建塔的',
          }),
          term(W('cult-monk'), { en: 'monk', zh: '僧人' }),
          bi({
            en: ' who led the work was the Chan master Zhijue, better known as Yanshou, according to the Song-dynasty gazetteer of Hangzhou (some modern pages write Zhiyuan). The tower was meant to calm the tide: a hope placed in faith rather than in engineering. Local accounts say that once it stood, the tide no longer spilled over the banks.',
            zh: '，据南宋《咸淳临安志》记载，是智觉禅师延寿（也有现代资料写作“智元禅师”）。建塔是为了“镇潮”，这是寄托在信仰上的愿望，而不是工程手段。据说塔建成之后，江潮果然不再漫过堤岸。',
          }),
        ),
        h(
          'p',
          null,
          bi({ en: 'Why “Six ', zh: '为什么叫“六和”？“' }),
          term(W('cult-harmony'), { en: 'Harmonies', zh: '和' }),
          bi({
            en: '”? The name has two readings. Switch between them:',
            zh: '”字有两种解释，切换看看：',
          }),
        ),
        h('div', { class: 'ch2-controls' }, meaning.el),
        directionNote,
        harmonyList,
      ),
      c: h(
        'article',
        { class: 'ch2-step', 'data-step': 'c' },
        bi({ en: 'After dark', zh: '入夜之后' }, 'span', { class: 'ch2-date' }),
        bi({ en: 'A lamp for the boats', zh: '照船的灯' }, 'h3'),
        h(
          'p',
          null,
          bi({
            en: 'The pagoda had a practical job too. Sources describe lamps lit at the top so that boats on the dark river could find their way. A light high on a hill is easy to steer by: it works as a ',
            zh: '这座塔还有一项实际用途。资料记载，塔顶点着明灯，给夜里在江上行船的人指路。高处的一盏灯最容易辨认方向，就像一座',
          }),
          term(W('nav-beacon'), { en: 'beacon', zh: '航标灯' }),
          bi({ en: '.', zh: '。' }),
        ),
        bi(
          {
            en: 'Try it: with the lamp out, the boats drift; light it and they hold their course.',
            zh: '试一试：灯灭时，船只在江上漂；点亮塔灯，船就能稳住航向。',
          },
          'p',
          { class: 'note' },
        ),
        h('div', { class: 'ch2-controls' }, lampBtn),
      ),
      d: h(
        'article',
        { class: 'ch2-step', 'data-step': 'd' },
        bi({ en: 'Then and now', zh: '从古到今' }, 'span', { class: 'ch2-date' }),
        bi({ en: 'Faith and engineering', zh: '信仰与工程' }, 'h3'),
        bi(
          {
            en: 'Hangzhou faced the tide in two ways at once: with seawalls that engineers kept rebuilding for a thousand years, and with a pagoda that gave people hope and a light to steer by.',
            zh: '杭州人用两种办法同时面对江潮：一是工匠们修了上千年的海塘，二是一座给人希望、也给船指路的塔。',
          },
          'p',
        ),
        h(
          'div',
          { class: 'ch2-choice' },
          h(
            'p',
            null,
            bi({
              en: 'When you explain 镇潮 to a friend from abroad, which English verb would you choose? ',
              zh: '向外国朋友解释“镇潮”时，你会选哪个英文动词？可以参考',
            }),
            term(W('trans-suppress'), { en: '(see also: suppress)', zh: '“镇”的译法' }),
          ),
          h('div', { class: 'ch2-choice__options' }, verbButtons),
          feedback,
        ),
      ),
    };

    const stageEl = h('div', { class: 'stage' });
    const stageWrap = h('div', { class: 'ch2-stagewrap' }, stageEl);
    const steps = h('div', { class: 'ch2-steps' }, STEPS.map((s) => stepEls[s]));
    section.append(h('div', { class: 'ch2-layout' }, steps, stageWrap));

    /* ── 3D ── */
    const stage = createStage(stageEl, { fov: 40, far: 12000, camera: CAMS.a.p, target: CAMS.a.t });
    const lampState = { on: false };
    const syncLampBtn = () => {
      lampBtn.textContent = lampState.on ? tr({ en: 'Put out the lamp', zh: '熄灭塔灯' }) : tr({ en: 'Light the lamp', zh: '点亮塔灯' });
      lampBtn.setAttribute('aria-pressed', String(lampState.on));
    };
    syncLampBtn();
    onLangChange(syncLampBtn);

    if (!stage) {
      releaseBtn.hidden = true;
      lampBtn.addEventListener('click', () => {
        lampState.on = !lampState.on;
        syncLampBtn();
        markDone('ch2', 'lit-the-lamp');
      });
      return;
    }

    const land = createLandscape(stage.scene, { preset: 'dusk', bridge: false, stage });
    const river = land.river;
    const pagoda = createPagoda({ interior: false });
    stage.scene.add(pagoda.group);
    river.setReflections({ towerHeight: pagoda.height });
    river.setLamp(0, new THREE.Vector3(0, pagoda.tiers[12].y0 + 2, 0));

    const seawall = createSeawall();
    stage.scene.add(seawall);
    if (import.meta.env.DEV) window.__ch2 = { stage, land, pagoda, seawall, boats: null };

    // Six directions
    const arrows = new THREE.Group();
    arrows.position.set(0, 30, 0);
    for (const d of DIRECTIONS) arrows.add(createArrow(d.v, d.v[1] !== 0 ? 34 : 26));
    arrows.visible = false;
    stage.scene.add(arrows);
    const labels = createLabels(stage);
    const dirLabels = DIRECTIONS.map((d) => {
      const el = h('span', { class: 'hotspot ch2-dirlabel', 'aria-hidden': 'true' }, d.zh, h('span', { class: 'ch2-dirlabel__en' }, ` ${d.en}`));
      const len = d.v[1] !== 0 ? 37 : 29;
      labels.add(el, new THREE.Vector3(d.v[0] * len, 30 + d.v[1] * len, d.v[2] * len));
      labels.setHidden(el, true);
      return el;
    });

    // Boats
    const boats = [];
    for (let i = 0; i < 6; i++) {
      const b = createBoat();
      const lane = RIVER_NEAR + 140 + i * 120;
      b.userData = {
        ...b.userData,
        lane,
        x: -500 + i * 190,
        z: lane + (Math.random() - 0.5) * 80,
        heading: Math.random() * Math.PI * 2,
        dirSign: i % 2 ? 1 : -1,
      };
      b.visible = false;
      stage.scene.add(b);
      boats.push(b);
    }

    /* State */
    const cam = { px: CAMS.a.p[0], py: CAMS.a.p[1], pz: CAMS.a.p[2], tx: CAMS.a.t[0], ty: CAMS.a.t[1], tz: CAMS.a.t[2] };
    const bore = { pos: -2000, h: 0 };
    let current = null;
    let built = 0; // pagoda build-up 0..1
    let wallRise = 0;
    harmonyList.hidden = true;
    let lampLevel = 0;

    function moveCamera(step) {
      const c = CAMS[step];
      if (still) {
        Object.assign(cam, { px: c.p[0], py: c.p[1], pz: c.p[2], tx: c.t[0], ty: c.t[1], tz: c.t[2] });
        land.setPreset(c.preset, 0);
        return;
      }
      gsap.to(cam, { px: c.p[0], py: c.p[1], pz: c.p[2], tx: c.t[0], ty: c.t[1], tz: c.t[2], duration: 2.2, ease: 'power2.inOut', overwrite: true });
      land.setPreset(c.preset, 2.2);
    }

    function runTide() {
      bore.pos = -1500;
      bore.h = 3;
      audio.surge(0.9, 8);
      if (still) {
        bore.pos = -150;
        return;
      }
      gsap.fromTo(bore, { pos: -1500 }, { pos: 1500, duration: 16, ease: 'none', overwrite: true });
    }
    releaseBtn.addEventListener('click', runTide);

    setMeaning3D = (v) => {
      const dirs = v === 'directions';
      arrows.visible = dirs && current === 'b';
      dirLabels.forEach((el) => labels.setHidden(el, !(dirs && current === 'b')));
    };

    function setLamp(on, byReader = true) {
      lampState.on = on;
      syncLampBtn();
      if (on && byReader) {
        markDone('ch2', 'lit-the-lamp');
        announce(tr({ en: 'The lamp is lit. The boats hold their course.', zh: '塔灯已点亮，船只稳住了航向。' }));
        audio.bell(0.6);
      }
    }
    lampBtn.addEventListener('click', () => setLamp(!lampState.on));

    function activate(step) {
      if (step === current) return;
      current = step;
      Object.values(stepEls).forEach((el) => el.classList.toggle('is-active', el.dataset.step === step));
      moveCamera(step);
      const pagodaShown = step !== 'a';
      if (still) built = pagodaShown ? 1 : 0;
      else gsap.to({ v: built }, { v: pagodaShown ? 1 : 0, duration: pagodaShown ? 2.6 : 0.8, ease: 'power2.out', onUpdate() { built = this.targets()[0].v; } });
      wallRise = 1;
      boats.forEach((b) => (b.visible = step === 'c' || step === 'd'));
      if (step === 'a') runTide();
      if (step === 'd' && !lampState.on) setLamp(true, false);
      setMeaning3D(meaning.get());
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) activate(e.target.dataset.step);
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    Object.values(stepEls).forEach((el) => io.observe(el));
    activate('a');

    /* Per frame */
    let wallLevel = 0;
    stage.onTick((dt, elapsed) => {
      land.update(dt, elapsed);
      stage.camera.position.set(cam.px, cam.py, cam.pz);
      stage.camera.lookAt(cam.tx, cam.ty, cam.tz);

      // tide
      river.setBore(0, { dir: [-1, 0], pos: bore.pos, height: bore.h, width: 14 });

      // pagoda rises in step B (it did not exist in 910)
      const s = Math.max(0.001, built);
      pagoda.group.scale.set(1, s, 1);
      pagoda.group.visible = built > 0.01;
      river.setReflections({ towerHeight: pagoda.height * built });

      // seawall
      wallLevel += (wallRise - wallLevel) * Math.min(1, dt * 2);
      seawall.position.y = (wallLevel - 1) * 7;
      seawall.visible = wallLevel > 0.02;

      // lamp
      const lampTarget = lampState.on ? 1 : 0;
      lampLevel += (lampTarget - lampLevel) * Math.min(1, dt * 3);
      pagoda.setLamp(lampLevel * built);
      river.setLamp(lampLevel * built);
      const rang = pagoda.update(elapsed, { wind: 0.35 });
      if (rang.length && current !== 'a') audio.bell(0.4);

      // boats: drift in the dark, hold a course when the lamp is lit
      for (const b of boats) {
        if (!b.visible) continue;
        const u = b.userData;
        if (lampLevel > 0.5) {
          const want = u.dirSign > 0 ? 0 : Math.PI;
          let d = want - u.heading;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          u.heading += d * Math.min(1, dt * 0.8);
          u.z += (u.lane - u.z) * Math.min(1, dt * 0.25);
          u.speed = 6;
        } else {
          u.heading += (Math.sin(elapsed * 0.4 + u.lane) * 0.6) * dt;
          u.speed = 1.6;
        }
        u.x += Math.cos(u.heading) * u.speed * dt;
        u.z += -Math.sin(u.heading) * u.speed * dt;
        u.z = Math.min(RIVER_FAR - 40, Math.max(RIVER_NEAR + 60, u.z));
        if (u.x > 900) u.x = -900;
        if (u.x < -900) u.x = 900;
        const y = river.heightAt(u.x, u.z) + 0.2 + Math.sin(elapsed * 1.3 + u.lane) * 0.15;
        b.position.set(u.x, y, u.z);
        b.rotation.y = u.heading;
        b.rotation.z = Math.sin(elapsed * 1.1 + u.lane) * 0.04;
        b.userData.lantern.material.opacity = 0.35 + 0.65 * (1 - lampLevel * 0.3);
      }
    });
  },
};
