/**
 * ch4 · 明七暗六 · Thirteen Outside, Seven Inside / 外十三，内七
 *
 * The architecture chapter: peel the pagoda (3D), climb its seven walkable storeys,
 * look at the Song brick carvings, compare with Liang Sicheng's 1935 restoration plan,
 * and follow a thousand years of building history.
 */
import './style.css';
import { chapterHeader, h, bi, speak, canSpeak, reducedMotion } from '../../core/ui.js';
import { registerCh4Vocab } from './vocab.js';
import { rich } from './rich.js';
import { buildLab } from './lab.js';
import { buildCarvings } from './carvings.js';
import { buildLiang } from './liang.js';
import { buildTimeline } from './timeline.js';

const SAY = [
  {
    en: 'From the outside the pagoda seems to have thirteen storeys, but inside there are only seven you can walk on.',
    zh: '从外面看，六和塔好像有十三层，可里面能走上去的只有七层。',
  },
  {
    en: 'The brick body is Southern Song, the finial is Yuan, and the timber eaves were added at the end of the Qing.',
    zh: '砖砌塔身是南宋的，塔刹是元代的，木檐是清末加上去的。',
  },
  {
    en: 'A wind-bell hangs from every corner of every eave: a hundred and four in all.',
    zh: '每一重檐的每个角上都挂着风铃，一共一百零四只。',
  },
];

function buildPractice() {
  return h(
    'section',
    { class: 'ch4-say', 'aria-labelledby': 'ch4-say-title' },
    bi({ en: 'Say it in English', zh: '用英文说一说' }, 'h3', { class: 'ch4-h3', id: 'ch4-say-title' }),
    bi(
      {
        en: 'Three sentences a guide might use at the foot of the tower. Read each one aloud, then try it without looking.',
        zh: '这三句话，导游站在塔下时可能会用到。先跟着读，再试着不看原文说出来。',
      },
      'p',
      { class: 'ch4-say__intro' },
    ),
    h(
      'ol',
      { class: 'ch4-say__list' },
      SAY.map((s) =>
        h(
          'li',
          null,
          h('p', { class: 'ch4-say__en', lang: 'en' }, s.en),
          h('p', { class: 'ch4-say__zh', lang: 'zh-CN' }, s.zh),
          canSpeak()
            ? (() => {
                const b = bi({ en: 'Hear it', zh: '听一遍' }, 'button', { type: 'button', class: 'btn btn--ghost ch4-say__btn' });
                b.addEventListener('click', () => speak(s.en, 'en'));
                return b;
              })()
            : null,
        ),
      ),
    ),
  );
}

export default {
  id: 'ch4',
  ambience: { river: 0.3, wind: 0.25 },
  sources: [
    {
      title: { en: 'Hangzhou News: Why does the 13-tier Liuhe Pagoda end at storey seven? (2022)', zh: '杭州网：杭州观潮胜地六和塔 外面看看13层 为什么爬到7层就到顶了？（2022）' },
      url: 'https://hznews.hangzhou.com.cn/chengshi/content/2022-09/04/content_8345267_0.htm',
      note: { en: '970 founding, 1153 rebuild, Zhu Zhi’s timber exterior of 1900, 七明六暗, double-tube plan, carvings on every plinth, first-batch national listing.', zh: '970 年始建、1153 年重建、1900 年朱智加建木外檐、七明六暗、双筒结构、须弥座砖雕、第一批全国重点文物保护单位。' },
    },
    {
      title: { en: 'Hangzhou News: Guo Daiheng on the 1991 restoration (2018)', zh: '杭州网：清华大学教授郭黛姮讲述 27 年前的那次大修（2018）' },
      url: 'https://hznews.hangzhou.com.cn/chengshi/content/2018-09/11/content_7065675_0.htm',
      note: { en: 'Song brick body, Guangxu-era timber, sealed even tiers, 1961 listing, “restore the old as old”.', zh: '南宋砖塔身、光绪年间木檐、偶数层封闭、1961 年列入国保、“整旧如旧”。' },
    },
    {
      title: { en: 'Hangzhou News: The 1991 repair and earlier ones (2018)', zh: '杭州网：27年前 六和塔曾经历过一次大修（2018）' },
      url: 'https://hznews.hangzhou.com.cn/chengshi/content/2018-09/11/content_7065768_3.htm',
      note: { en: 'Repairs in 1953, 1957 (lightning rod on the cast-iron gourd), 1971, 1991 and 2013.', zh: '1953、1957（塔顶生铁葫芦装避雷针）、1971、1991、2013 年的修缮。' },
    },
    {
      title: { en: 'Hangzhou News: What did Liuhe Pagoda look like to Liang Sicheng? (2012)', zh: '杭州网：梁思成眼中的六和塔到底什么样？（2012）' },
      url: 'https://hznews.hangzhou.com.cn/chengshi/content/2012-03/16/content_4108832_0.htm',
      note: { en: 'Contents of the 1935 plan: restoration drawing with open balcony platforms and deep eaves; elevation, section, plans; why it was shelved.', zh: '1935 年复原计划的内容：开敞平座、深远出檐的复原图，立面、剖面、各层平面，以及计划搁置的原因。' },
    },
    {
      title: { en: 'Tencent News: Liuhe Pagoda, Liang Sicheng’s unfinished plan (2020)', zh: '腾讯新闻：杭州六和塔：未完成的方案 梁思成的遗憾（2020）' },
      url: 'https://news.qq.com/rain/a/20201117A03YLT00',
      note: { en: 'Liang’s criticism of the squat thirteen-eave exterior and the seven-storey Song form he proposed.', zh: '梁思成对“肥矮十三层檐”的批评，以及他主张的七层宋式原状。' },
    },
    {
      title: { en: 'Contents of the Bulletin of the Society for Research in Chinese Architecture', zh: '《中国营造学社汇刊》目录' },
      url: 'https://www.douban.com/note/782463191/',
      note: { en: 'Vol. 5 no. 3, March 1935: 杭州六和塔复原状计划, Liang Sicheng.', zh: '第五卷第三期，1935 年 3 月：梁思成《杭州六和塔复原状计划》。' },
    },
    {
      title: { en: 'Guangming Online: three dynasties in one pagoda (2025)', zh: '光明网：六和塔的三个朝代（2025）' },
      url: 'https://m.gmw.cn/2025-08/24/content_1304122360.htm',
      note: { en: 'Song body, Yuan finial, Qing timber; most carvings match the Yingzao Fashi.', zh: '塔身南宋、塔刹元代、外檐清代；砖雕大部分能在《营造法式》里找到出处。' },
    },
    {
      title: { en: 'The Paper: Guo Daiheng and the 1991 repair (2020)', zh: '澎湃新闻：郭黛姮与六和塔修缮（2020）' },
      url: 'https://www.thepaper.cn/newsDetail_forward_9561498',
      note: { en: 'Seven-storey Song brick body inside a thirteen-eave Qing timber exterior; minimal-intervention principle.', zh: '南宋七层砖砌塔身外包清代十三层木檐；“不改变现状，最低干预”。' },
    },
    {
      title: { en: 'Hangzhou government: Liuhe Pagoda', zh: '杭州市政府英文网：六和塔' },
      url: 'https://www.ehangzhou.gov.cn/2018-06/14/c_242884.htm',
      note: { en: 'Height 59.89 m; destroyed 1121, rebuilt by 1165.', zh: '塔高 59.89 米；1121 年被毁，1165 年重建。' },
    },
    {
      title: { en: 'Wikipedia: Liuhe Pagoda', zh: '维基百科：六和塔（英文）' },
      url: 'https://en.wikipedia.org/wiki/Liuhe_Pagoda',
      note: { en: 'Joseph Needham on the pagoda as a lighthouse.', zh: '李约瑟关于六和塔兼作灯塔的论述。' },
    },
    {
      title: { en: 'Maigoo encyclopedia: 六和塔', zh: '买购百科：六和塔' },
      url: 'https://m.maigoo.com/citiao/139599.html',
      note: { en: '104 iron bells; 200+ carvings with their motifs; the Xianchun Lin’an Zhi on Zhijue (Yanshou) and the nine-storey first tower; 1156–1165 rebuild; the lamp.', zh: '104 只铁铃；二百多处砖雕及题材；《咸淳临安志》所记智觉禅师延寿建塔、塔高九级；1156—1165 年重建；塔顶明灯。' },
    },
    {
      title: { en: 'Dahepiao travel: Liuhe Pagoda', zh: '大河票务网：六和塔' },
      url: 'https://www.dahepiao.com/lvyounews1/20221021320527.html',
      note: { en: '174 groups of Song brick carvings; some match the Yingzao Fashi painting patterns.', zh: '宋代砖雕共一百七十四组，部分式样与《营造法式》彩画作制度图样如出一辙。' },
    },
    {
      title: { en: 'China Oldenburg: Yingzao Fashi, Treatise on Architectural Methods', zh: 'China Oldenburg：《营造法式》简介' },
      url: 'https://china-oldenburg.de/2015/08/treatise-on-architectural-methods/',
      note: { en: 'Completed in 1100, printed in 1103.', zh: '1100 年编成，1103 年刊行。' },
    },
  ],

  async mount(section) {
    registerCh4Vocab();
    section.classList.add('ch4');

    section.append(
      chapterHeader({
        plaque: '明七暗六',
        index: 4,
        title: { en: 'Thirteen Outside, Seven Inside', zh: '外十三，内七' },
        lede: {
          en: 'From the river you count thirteen roofs. Climb inside and the stairs run out at seven. Peel the pagoda layer by layer to see why, and which dynasty built which part.',
          zh: '从江上看，六和塔有十三重檐；走进去爬，七层就到顶了。把这座塔一层层剥开，看看原因在哪里，每一部分又出自哪个朝代。',
        },
      }),
    );

    section.append(
      h(
        'div',
        { class: 'prose ch4-intro' },
        rich({
          en: 'Two words help here. An [[arch-eave|eave]] is the edge of a roof that sticks out past the wall; one band of wall with its eave on top makes an eave tier. A [[arch-storey|storey]] is a level you can actually stand on. In most towers each storey has one eave, so the numbers match. At Liuhe they don’t: thirteen eave tiers wrap round only seven storeys. Chinese guides sum it up in four characters, 七明六暗, “seven open, six hidden”.',
          zh: '先分清两个词。[[arch-eave|檐]]是伸出墙外的那圈屋顶边缘，一段墙身加上头顶的一圈檐，就是外观上的“一重”。[[arch-storey|层]]指人真正能站上去的楼层。一般的塔一层配一重檐，数目对得上；六和塔却对不上：十三重檐，里面只有七层。导游常用四个字概括：七明六暗。',
        }),
      ),
    );

    const lab = buildLab({
      onCarvingsLink: () => document.getElementById('ch4-carvings')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }),
    });
    section.append(lab.el);
    lab.init();

    section.append(
      buildCarvings({
        onPeel: () => {
          lab.peelTo(1);
          lab.stageWrap.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
        },
      }),
      buildLiang(),
      buildTimeline(),
      buildPractice(),
    );

    // Screen-reader summary of what the 3D view shows.
    section.append(
      bi(
        {
          en: 'Summary of the 3D view: the pagoda has 13 exterior eave tiers but 7 walkable storeys; the 6 sealed tiers alternate with them. Its brick body is Southern Song, its finial Yuan, and its timber exterior Qing (1899–1900).',
          zh: '3D 视图要点：六和塔外观十三重檐，里面七个可登的明层，六个暗层与之相间；砖砌塔身为南宋，塔刹为元代，木外檐为清代（1899—1900 年）。',
        },
        'p',
        { class: 'visually-hidden' },
      ),
    );
  },
};
