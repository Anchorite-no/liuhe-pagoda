/**
 * ch4 vocabulary: the words a visitor needs to describe how the pagoda is built.
 * Ids are prefixed "arch-" so they stay unique across chapters.
 */
import { registerVocab } from '../../core/vocab.js';

export const WORDS = {
  'arch-eave': {
    id: 'arch-eave',
    en: 'eave',
    zh: '屋檐',
    pinyin: 'wūyán',
    def: {
      en: 'The lower edge of a roof that sticks out past the wall, so rain falls clear of it.',
      zh: '屋顶伸出墙外的边缘部分，让雨水落在离墙较远的地方。',
    },
    example: {
      en: 'The pagoda has thirteen eaves, one above another.',
      zh: '六和塔有十三重檐，一层叠着一层。',
    },
  },
  'arch-storey': {
    id: 'arch-storey',
    en: 'storey',
    zh: '楼层',
    pinyin: 'lóucéng',
    def: {
      en: 'One level of a building that you can stand and walk on. American English spells it “story”.',
      zh: '建筑里人能站立、行走的一层。美式英语拼作 story。',
    },
    example: {
      en: 'Inside, the tower has only seven storeys.',
      zh: '塔里面其实只有七层。',
    },
  },
  'arch-bracket-set': {
    id: 'arch-bracket-set',
    en: 'bracket set (dougong)',
    zh: '斗拱',
    pinyin: 'dǒugǒng',
    def: {
      en: 'A cluster of interlocking wooden blocks and arms on top of a column or wall. It carries the weight of a deep eave outward.',
      zh: '柱子或墙顶上由方块（斗）和弓形横木（拱）层层咬合而成的构件，把深远出檐的重量向外挑出、向下传递。',
    },
    example: {
      en: 'Bracket sets let the eaves reach far beyond the wall.',
      zh: '有了斗拱，屋檐才能挑出墙外很远。',
    },
  },
  'arch-finial': {
    id: 'arch-finial',
    en: 'finial',
    zh: '塔刹',
    pinyin: 'tǎchà',
    def: {
      en: 'The ornament at the very top of a pagoda: a mast with rings, a gourd or “pearls”.',
      zh: '塔顶最上面的装饰部分，通常由刹杆、相轮、宝珠或葫芦组成。',
    },
    example: {
      en: 'The finial is about a century younger than the brick body.',
      zh: '塔刹比砖砌塔身晚了大约一百多年。',
    },
  },
  'arch-brick-core': {
    id: 'arch-brick-core',
    en: 'brick core',
    zh: '砖砌塔身',
    pinyin: 'zhuānqì tǎshēn',
    def: {
      en: 'The load-bearing masonry tower inside the building. At Liuhe it is Southern Song brick, wrapped in a later timber skin.',
      zh: '建筑内部承重的砖石塔体。六和塔的砖砌塔身是南宋原物，外面包着后来加的木结构。',
    },
    example: {
      en: 'Take away the timber and you see the brick core.',
      zh: '拿掉木外檐，就能看到砖砌塔身。',
    },
  },
  'arch-cross-section': {
    id: 'arch-cross-section',
    en: 'cross-section',
    zh: '剖面',
    pinyin: 'pōumiàn',
    def: {
      en: 'A view of an object as if it had been cut straight through, so you can see the inside.',
      zh: '假想把物体直直切开后看到的内部图样。',
    },
    example: {
      en: 'The cross-section shows two brick walls with a corridor between them.',
      zh: '剖面图上能看到两道砖墙，中间夹着回廊。',
    },
  },
  'arch-sumeru-plinth': {
    id: 'arch-sumeru-plinth',
    en: 'Sumeru plinth',
    zh: '须弥座',
    pinyin: 'xūmízuò',
    def: {
      en: 'A stepped base with a narrow, recessed “waist” in the middle. It is named after Mount Sumeru, the mountain at the centre of the world in Buddhist cosmology.',
      zh: '上下有几层线脚、中间收进一道“束腰”的台座，名字来自佛教宇宙观中位于世界中心的须弥山。',
    },
    example: {
      en: 'The waist of the Sumeru plinth is carved with flowers and birds.',
      zh: '须弥座的束腰上刻着花鸟。',
    },
  },
  'arch-wind-bell': {
    id: 'arch-wind-bell',
    en: 'wind-bell',
    zh: '风铃（风铎）',
    pinyin: 'fēnglíng (fēngduó)',
    def: {
      en: 'A small bell hung from the corner of an eave. It rings when the wind blows.',
      zh: '挂在檐角、随风摇响的小铃。',
    },
    example: {
      en: 'A wind-bell hangs from every corner of every eave.',
      zh: '每一重檐的每一个角上都挂着风铃。',
    },
  },
  'arch-pingzuo': {
    id: 'arch-pingzuo',
    en: 'balcony platform (pingzuo)',
    zh: '平座',
    pinyin: 'píngzuò',
    def: {
      en: 'In Song-style towers, the platform with a railing that runs round a storey, resting on bracket sets.',
      zh: '宋式楼阁和塔上，绕着每层外侧、由斗拱托起并设栏杆的平台。',
    },
    example: {
      en: 'Liang Sicheng drew an open balcony platform on every storey.',
      zh: '梁思成在复原图里给每一层都画了开敞的平座。',
    },
  },
};

export function registerCh4Vocab() {
  registerVocab('ch4', Object.values(WORDS));
}
