/**
 * Timeline strip: a real sequence, so the items are an ordered list.
 * Colour bars use the shared era colours (--era-song / --era-yuan / --era-qing).
 */
import { h, bi } from '../../core/ui.js';
import { tr } from '../../core/i18n.js';
import { rich, onLang } from './rich.js';

const EVENTS = [
  {
    year: { en: '970', zh: '970 年' },
    reign: { en: 'Northern Song, Kaibao 3', zh: '北宋开宝三年' },
    era: 'early',
    text: {
      en: 'Founded. The Chan master Zhijue (Yanshou) builds a pagoda on the Wuyue royal orchard to calm the tide. A Song gazetteer says it had nine storeys.',
      zh: '始建。智觉禅师延寿在吴越钱氏的南果园开山建塔，用来镇江潮。南宋《咸淳临安志》记塔高九级。',
    },
  },
  {
    year: { en: '1121', zh: '1121 年' },
    reign: { en: 'Xuanhe era', zh: '北宋宣和年间' },
    era: 'early',
    text: {
      en: 'Burned down in the fighting at the end of the Northern Song.',
      zh: '北宋末年毁于兵火。',
    },
  },
  {
    year: { en: '1150s–1165', zh: '1152—1165 年' },
    reign: { en: 'Southern Song', zh: '南宋' },
    era: 'song',
    text: {
      en: 'Rebuilt as the seven-storey [[arch-brick-core|brick body]] that still stands. Sources disagree on the years: work began between 1152 and 1156 and was finished in 1163 or 1165.',
      zh: '重建为七层[[arch-brick-core|砖砌塔身]]，保存至今。各资料年份不一：开工有 1152、1153、1156 年等说法，完工有 1163 年与 1165 年两说。',
    },
  },
  {
    year: { en: '1271–1368', zh: '1271—1368 年' },
    reign: { en: 'Yuan dynasty', zh: '元代' },
    era: 'yuan',
    text: {
      en: 'The [[arch-finial|finial]] on the roof dates from the Yuan.',
      zh: '塔顶的[[arch-finial|塔刹]]是元代遗物。',
    },
  },
  {
    year: { en: '1368–1644', zh: '1368—1644 年' },
    reign: { en: 'Ming dynasty', zh: '明代' },
    era: 'early',
    text: {
      en: 'The wooden eaves burn and are rebuilt more than once; in the Jiajing reign they are lost completely.',
      zh: '木构外檐屡毁屡修，嘉靖年间曾全部毁去。',
    },
  },
  {
    year: { en: '1899–1900', zh: '1899—1900 年' },
    reign: { en: 'Qing, Guangxu reign', zh: '清光绪二十五至二十六年' },
    era: 'qing',
    text: {
      en: 'Zhu Zhi, a Hangzhou man, pays for new timber galleries: thirteen eaves round the seven brick storeys. Sources give 1899 or 1900.',
      zh: '杭州人朱智出资重修，在砖塔身外加建木构外檐和回廊，形成十三重檐。资料有 1899 年、1900 年两说。',
    },
  },
  {
    year: { en: '1935', zh: '1935 年' },
    reign: { en: 'Republic of China', zh: '民国' },
    era: 'modern',
    text: {
      en: 'Liang Sicheng publishes his plan to give the tower back its Song look. It is never carried out.',
      zh: '梁思成发表《杭州六和塔复原状计划》，未能实施。',
    },
  },
  {
    year: { en: '1961', zh: '1961 年' },
    reign: { en: 'People’s Republic of China', zh: '中华人民共和国' },
    era: 'modern',
    text: {
      en: 'The State Council lists it in the first batch of National Key Cultural Relics Protection Units.',
      zh: '国务院公布为第一批全国重点文物保护单位。',
    },
  },
  {
    year: { en: '1991', zh: '1991 年' },
    reign: { en: 'Largest modern repair', zh: '近代最大一次修缮' },
    era: 'modern',
    text: {
      en: 'A Tsinghua University team led by Guo Daiheng repairs the timber and roofs, following the rule “restore the old as old”.',
      zh: '清华大学郭黛姮团队主持修缮木构和屋面，遵循“整旧如旧”的原则。',
    },
  },
  {
    year: { en: 'Today', zh: '今天' },
    reign: { en: '59.89 m tall', zh: '塔高 59.89 米' },
    era: 'modern',
    text: {
      en: 'Three dynasties stand in one building: Song brick, a Yuan finial and Qing timber.',
      zh: '一座塔里站着三个朝代：宋代的砖、元代的塔刹、清代的木檐。',
    },
  },
];

export function buildTimeline() {
  const list = h(
    'ol',
    { class: 'ch4-tl__list' },
    EVENTS.map((e) =>
      h(
        'li',
        { class: `ch4-tl__item ch4-tl__item--${e.era}` },
        bi(e.year, 'p', { class: 'ch4-tl__year' }),
        bi(e.reign, 'p', { class: 'ch4-tl__reign' }),
        rich(e.text, 'p', { class: 'ch4-tl__text' }),
      ),
    ),
  );
  const scroller = h('div', { class: 'ch4-tl__scroll', tabindex: '0', role: 'region' }, list);
  onLang(scroller, () => scroller.setAttribute('aria-label', tr({ en: 'Timeline, scrolls sideways', zh: '时间轴，可左右滚动' })));
  return h(
    'section',
    { class: 'ch4-tl', 'aria-labelledby': 'ch4-tl-title' },
    bi({ en: 'A thousand years in one tower', zh: '一座塔里的一千年' }, 'h3', { class: 'ch4-h3', id: 'ch4-tl-title' }),
    scroller,
  );
}
