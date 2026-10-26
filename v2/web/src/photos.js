/**
 * Real photographs (tools/photos.py fetches them from Wikimedia Commons and writes their credits):
 * the captions, a figure with its credit line, and a full-screen lightbox to look closer.
 * Every picture carries its author and licence wherever it appears.
 */
import { gsap } from 'gsap';
import { CREDITS } from './photo-credits.js';

const CAPTIONS = {
  river: ['从钱塘江南岸望六和塔（2024 年）', 'The pagoda seen across the Qiantang from the south bank, 2024'],
  storm: ['从钱塘江大桥上看，一场暴雨正压过来（2016 年）', 'From the Qiantang River Bridge, with a storm coming in, 2016'],
  front: ['正面：红墙、台阶和塔（2012 年）', 'The front: red walls, steps and the tower, 2012'],
  tiers: ['一层层外檐：暗红的木墙、深灰的屋瓦、檐角的铁铃', 'Tier on tier: dark red timber, grey tiles, iron bells at the corners'],
  lookup: ['从塔下仰望十三层屋檐', 'Looking up at the thirteen eaves'],
  eavebells: ['檐角的风铎和一排瓦当', 'A wind-bell and a row of tile ends at an eave corner'],
  archway: ['塔前的石牌坊', 'The stone archway before the pagoda'],
  entrance: ['底层门洞上的“六和塔”匾', 'The “Liuhe Pagoda” plaque over the ground-floor door'],
  gallery: ['底层的外廊：木柱、粉墙、圆门', 'The ground-floor veranda: timber columns, white walls, a round door'],
  plaque1: ['第一层的乾隆题匾“初地坚固”', 'Qianlong’s plaque on the first floor: “The First Ground Stands Firm”'],
  ceil2: ['第二层的彩绘天花', 'Painted ceiling, second floor'],
  ceil3: ['第三层的彩绘', 'Painted beams and ceiling, third floor'],
  ceil4: ['第四层的彩绘天花', 'Painted ceiling, fourth floor'],
  ceil5: ['第五层的彩绘', 'Painted decoration, fifth floor'],
  pillar: ['顶层的心柱', 'The central mast on the top floor'],
  carving: ['塔内须弥座上的砖雕花纹', 'Carved brick on a Sumeru plinth inside the pagoda'],
  dragon: ['塔内彩绘天花正中的龙', 'A dragon at the centre of a painted ceiling'],
  songmodel: ['按梁思成复原图制作的模型：宋式外檐', 'A model built from Liang Sicheng’s restoration drawings, with Song-style eaves'],
  bell: ['六和塔下的钟亭', 'The bell pavilion below the pagoda'],
  bridge: ['钱塘江大桥（2020 年）', 'The Qiantang River Bridge, 2020'],
  bridgetop: ['从塔顶俯瞰钱塘江大桥', 'The bridge from the top of the pagoda'],
  h1891: ['约 1891 年：外檐被烧掉后的砖塔身', 'About 1891: the brick body after the eaves had burned'],
  h1900: ['1900 年代：刚刚重建的外檐（骆任廷 摄）', '1900s: the newly rebuilt eaves (James Stewart Lockhart)'],
  h1910: ['约 1910 年：杭州二我轩照相馆', 'About 1910: Erwoxuan Photo Studio, Hangzhou'],
  h1918: ['1918 年：江边的六和塔（关野贞 摄）', '1918: the pagoda by the river (Sekino Tadashi)'],
  h1918in: ['1918 年：塔内的壶门（关野贞 摄）', '1918: a cusped doorway inside (Sekino Tadashi)'],
  h1926: ['1926 年：日本出版的写真集《亚细亚大观》', '1926: from the Japanese photo series Ajia Taikan'],
  h1959: ['1959 年：匈牙利 Fortepan 档案', '1959: from Hungary’s Fortepan archive'],
  hymca: ['1913–1925 年：美国基督教青年会档案里的江景', '1913–1925: the river in the YMCA archives'],
  h1987: ['1987 年：一位美国游客镜头里的杭州', '1987: Hangzhou through an American traveller’s lens'],
  boreline: ['海宁盐官的一线潮（2022 年）', 'The single-line tide at Yanguan, Haining, 2022'],
  borecurve: ['潮头在盐官江面上划出一道弧（2017 年）', 'The bore curving across the river at Yanguan, 2017'],
  boredragon: ['盐官的“龙头潮”', 'The “dragon-head” bore at Yanguan'],
  boreback: ['撞上堤坝折回来的“回头潮”', 'The “returning tide”, thrown back by a dyke'],
  borecity: ['2019 年农历八月十八，潮水经过杭州的城市阳台', 'The bore passing Hangzhou’s riverfront on the 18th of the eighth lunar month, 2019'],
  boreroad: ['2024 年 9 月，潮水冲上六和塔下的之江路', 'September 2024: the tide breaks over Zhijiang Road, just below the pagoda'],
  bore1892: ['1892 年 10 月 6 日：英国海军军官穆尔考察时拍下的钱塘江潮', '6 October 1892: the bore, photographed in a survey by the British naval officer W. U. Moore'],
  mural: ['博物馆里描绘钱塘江弄潮风俗的壁画', 'A museum mural of the tide-riders of the Qiantang'],
  chart: ['1888 年英国海图：杭州湾像一只喇叭口', 'An 1888 British chart: Hangzhou Bay opens like a funnel'],
  crowd: ['盐官观潮的人群', 'Crowds waiting for the tide at Yanguan'],
  yulemap: ['英国学者亨利·玉尔为《马可·波罗游记》画的杭州地图（1903 年版）', 'Hangzhou, mapped by Henry Yule for his edition of Marco Polo’s travels, 1903'],
};

export const PHOTOS = Object.fromEntries(
  Object.entries(CREDITS).map(([id, c]) => [id, { id, ...c, zh: CAPTIONS[id]?.[0] || '', en: CAPTIONS[id]?.[1] || '' }]),
);

/** "author · licence" as a link to the file's page on Commons */
export function creditLine($, p) {
  const who = p.author || 'Wikimedia Commons';
  return $('a', { class: 'credit', href: p.page, target: '_blank', rel: 'noopener', lang: 'en' }, `${who} · ${p.license || 'Wikimedia Commons'}`);
}

/**
 * A photograph with its caption and credit. Click to look closer (the lightbox steps through
 * `group`, the other photographs shown alongside it).
 */
export function figure($, id, { cls = '', group = null, caption = true } = {}) {
  const p = PHOTOS[id];
  if (!p) return null;
  const img = $('img', { src: p.src, alt: p.zh, loading: 'lazy', decoding: 'async', width: p.w, height: p.h });
  const fig = $('figure', { class: `photo ${cls}` },
    $('button', { type: 'button', class: 'photo__open', 'aria-label': `放大 ${p.zh} · Enlarge`, onclick: () => openLightbox(id, group) }, img),
    caption && $('figcaption', {}, $('span', { class: 'zh' }, p.zh), ' ', $('i', { class: 'en', lang: 'en' }, p.en), creditLine($, p)),
  );
  return fig;
}

/* ───────── lightbox ───────── */
let box = null;
let list = [];
let at = 0;
function build() {
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  };
  box = el('div', 'lightbox');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.hidden = true;
  const img = el('img', 'lightbox__img');
  const cap = el('div', 'lightbox__cap');
  const prev = el('button', 'lightbox__nav lightbox__prev', '←');
  const next = el('button', 'lightbox__nav lightbox__next', '→');
  const close = el('button', 'lightbox__close', '✕ <i lang="en">Close</i>');
  for (const b of [prev, next, close]) b.type = 'button';
  prev.setAttribute('aria-label', '上一张 Previous');
  next.setAttribute('aria-label', '下一张 Next');
  box.append(img, cap, prev, next, close);
  document.body.append(box);
  const go = (d) => {
    if (list.length < 2) return;
    at = (at + d + list.length) % list.length;
    show();
  };
  prev.onclick = () => go(-1);
  next.onclick = () => go(1);
  close.onclick = closeLightbox;
  box.addEventListener('click', (e) => e.target === box && closeLightbox());
  addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
  box._img = img;
  box._cap = cap;
  box._nav = [prev, next];
}
function show() {
  const p = PHOTOS[list[at]];
  box._img.src = p.src;
  box._img.alt = p.zh;
  box._cap.innerHTML = '';
  const a = document.createElement('a');
  a.href = p.page;
  a.target = '_blank';
  a.rel = 'noopener';
  a.lang = 'en';
  a.textContent = `${p.author || 'Wikimedia Commons'} · ${p.license}`;
  const zh = document.createElement('b');
  zh.textContent = p.zh;
  const en = document.createElement('span');
  en.lang = 'en';
  en.textContent = p.en;
  const n = document.createElement('small');
  n.textContent = list.length > 1 ? `${at + 1} / ${list.length}` : '';
  box._cap.append(zh, en, a, n);
  for (const b of box._nav) b.hidden = list.length < 2;
  gsap.fromTo(box._img, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' });
}
export function openLightbox(id, group) {
  if (!box) build();
  list = group && group.includes(id) ? group : [id];
  at = list.indexOf(id);
  box.hidden = false;
  document.documentElement.classList.add('is-boxed');
  show();
  gsap.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.35 });
  box.querySelector('.lightbox__close').focus();
}
export function closeLightbox() {
  if (!box || box.hidden) return;
  gsap.to(box, {
    opacity: 0,
    duration: 0.25,
    onComplete: () => {
      box.hidden = true;
      document.documentElement.classList.remove('is-boxed');
    },
  });
}
