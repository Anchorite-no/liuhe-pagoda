/**
 * ch1 text. Every visible string is an { en, zh } pair.
 * Facts and their sources are listed in NOTES.md and in the module's `sources`.
 */

export const VOCAB = [
  {
    id: 'river-estuary',
    en: 'estuary',
    zh: '河口；入海口',
    pinyin: 'hékǒu; rùhǎikǒu',
    def: {
      en: 'The wide part of a river where it meets the sea, and where fresh water mixes with salt water.',
      zh: '河流入海的宽阔河段，淡水和海水在这里交汇、混合。',
    },
    example: { en: 'The Qiantang estuary opens into Hangzhou Bay.', zh: '钱塘江河口向东敞开，汇入杭州湾。' },
  },
  {
    id: 'river-funnel-bay',
    en: 'funnel-shaped bay',
    zh: '喇叭形海湾',
    pinyin: 'lǎbaxíng hǎiwān',
    def: {
      en: 'A bay that is very wide at the mouth and narrows quickly inland, like a funnel.',
      zh: '湾口很宽、往里迅速收窄的海湾，形状像漏斗或喇叭。',
    },
    example: {
      en: 'Hangzhou Bay is a funnel-shaped bay: about 100 km wide at the mouth.',
      zh: '杭州湾是一个喇叭形海湾，湾口宽约 100 公里。',
    },
  },
  {
    id: 'river-upstream',
    en: 'upstream',
    zh: '上游；向上游',
    pinyin: 'shàngyóu',
    def: {
      en: 'Towards the place a river comes from, against the direction of the current.',
      zh: '朝着河流来的方向，即逆着水流的方向。',
    },
    example: { en: 'The campus is just upstream of the pagoda.', zh: '之江校区就在六和塔的上游一点。' },
  },
  {
    id: 'river-downstream',
    en: 'downstream',
    zh: '下游；向下游',
    pinyin: 'xiàyóu',
    def: {
      en: 'In the direction the river flows, towards the sea.',
      zh: '顺着水流的方向，朝着大海。',
    },
    example: { en: 'The 1937 bridge crosses the river just downstream of the pagoda.', zh: '1937 年建成的大桥就在塔的下游跨过江面。' },
  },
  {
    id: 'river-meander',
    en: 'meander',
    zh: '河曲；（河流）蜿蜒',
    pinyin: 'héqū; wānyán',
    def: {
      en: 'A big bend in a river; as a verb, to follow a winding course.',
      zh: '河道上的大弯；作动词时指河流弯弯曲曲地流淌。',
    },
    example: { en: 'The river meanders past Hangzhou in a shape like 之.', zh: '江水弯弯曲曲地流过杭州，形状像个“之”字。' },
  },
  {
    id: 'river-campus',
    en: 'campus',
    zh: '校园；校区',
    pinyin: 'xiàoyuán; xiàoqū',
    def: {
      en: 'The land and buildings of a university or college.',
      zh: '大学或学院的土地和建筑。',
    },
    example: { en: 'ZJU has several campuses; Zhijiang is the oldest-looking one.', zh: '浙大有好几个校区，之江校区看上去最古老。' },
  },
  {
    id: 'river-missionary-college',
    en: 'missionary college',
    zh: '教会大学',
    pinyin: 'jiàohuì dàxué',
    def: {
      en: 'A college founded and run by a religious mission, often from abroad.',
      zh: '由宗教差会（常常来自国外）创办和管理的高等学校。',
    },
    example: {
      en: 'Hangchow University grew out of a missionary school founded in Ningbo in 1845.',
      zh: '之江大学源自 1845 年在宁波创办的一所教会学校。',
    },
  },
  {
    id: 'river-double-deck-bridge',
    en: 'double-deck bridge',
    zh: '双层桥',
    pinyin: 'shuāngcéng qiáo',
    def: {
      en: 'A bridge with two levels, for example a road on top and a railway below.',
      zh: '有上下两层桥面的桥，比如上层走汽车、下层走火车。',
    },
    example: { en: 'The Qiantang River Bridge is a double-deck road-and-rail bridge.', zh: '钱塘江大桥是一座公路铁路两用的双层桥。' },
  },
  {
    id: 'river-heritage-site',
    en: 'nationally protected heritage site',
    zh: '全国重点文物保护单位',
    pinyin: 'quánguó zhòngdiǎn wénwù bǎohù dānwèi',
    def: {
      en: "A building or site listed by China's State Council for protection at the highest, national level.",
      zh: '由国务院公布、在国家层面重点保护的文物建筑或遗址。',
    },
    example: {
      en: 'Both the old campus and the bridge became nationally protected heritage sites in 2006.',
      zh: '之江大学旧址和钱塘江大桥都在 2006 年成为全国重点文物保护单位。',
    },
  },
];

export const T = {
  title: { en: 'The River That Named Us', zh: '一条江，一个名字' },
  lede: {
    en: 'Before it was a province or a university, Zhejiang was a river. Follow it from the sea to the hill where the pagoda, the old campus and a famous bridge stand side by side.',
    zh: '“浙江”先是一条江的名字，后来才是一个省、一所大学的名字。顺着这条江从海口一路往上，走到月轮山下：六和塔、之江老校园和一座有名的大桥就挨在一起。',
  },
  intro: {
    en: [
      'Zhejiang University is named after Zhejiang Province, and the province is named after a river. Today we call it the Qiantang. It rises in the hills to the south-west, turns sharply several times as it passes Hangzhou, and then opens into the sea through Hangzhou Bay, one of the most dramatic {estuary} in the world.',
      'The map below is a sand table, the kind of model planners and museums use. Press a flag to fly there and read about the place.',
    ],
    zh: [
      '浙江大学的名字来自浙江省，浙江省的名字来自一条江，就是今天的钱塘江。它发源于西南的群山，流过杭州时接连拐了几个急弯，最后经杭州湾入海。这是世界上最有气势的{estuary}之一。',
      '下面的地图是一个沙盘，就像规划馆、博物馆里摆的那种。点一面小旗，镜头会飞过去，旁边会出现这个地方的介绍。',
    ],
  },
  mapLabel: { en: 'Schematic sand table of the Qiantang estuary', zh: '钱塘江河口示意沙盘' },
  schematic: { en: 'Schematic, not to scale. The white arrow points north.', zh: '示意图，不按比例。白色箭头指向北方。' },
  hint: { en: 'Drag to turn the table. Ctrl + scroll to zoom.', zh: '拖动可转动沙盘，按住 Ctrl 再滚动滚轮可缩放。' },
  overview: { en: 'Back to the whole map', zh: '回到全图' },
  trace: { en: 'Trace the 之', zh: '描一描“之”字' },
  traceAgain: { en: 'Trace it again', zh: '再描一次' },
  placesHead: { en: 'Places on the map', zh: '地图上的地点' },
  placesIntro: {
    en: 'Open all six to finish this map. You can also use these buttons instead of the flags.',
    zh: '六个地点都看过，这张地图就完成了。也可以直接用下面的按钮代替地图上的小旗。',
  },
  opened: { en: '{n} of 6 opened', zh: '已看 {n} / 6' },
  allOpened: {
    en: 'You have visited every flag. Now press “Trace the 之” to see where the old name came from.',
    zh: '六面小旗都看过了。再点“描一描‘之’字”，看看“之江”这个名字是怎么来的。',
  },
  nextPlace: { en: 'Next place', zh: '下一个地点' },
  close: { en: 'Close', zh: '关闭' },
  backToList: { en: 'All places', zh: '全部地点' },
  zhiHead: { en: 'A river shaped like a character', zh: '像一个字的江' },
  zhiBody: {
    en: 'Watched from the hills above Hangzhou, the river bends one way, then back, then out towards the sea. People saw the character 之 (zhī) in those bends, so the river was also called the Zhijiang, “the 之 River”. The old college on Yuelun Hill took that name too.',
    zh: '从杭州城边的山上往下看，江水先往一边拐，又折回来，再朝大海流去。人们觉得这几道弯像个“之”字，所以钱塘江又叫“之江”。月轮山上的老大学也用了这个名字。',
  },
  zhiStrokes: {
    en: 'Brush order: the dot, the turning stroke, then the long sweep along the bottom.',
    zh: '笔顺：先点，再写横撇（折笔），最后是底下长长的平捺。',
  },
  zhiPinyin: { en: 'zhī · a classical word meaning “to go” or “of”', zh: 'zhī · 古汉语里有“往、去”和“的”等意思' },
  zhiCaption: { en: 'The character 之, drawn for this site', zh: '本网站绘制的“之”字' },
  replayZhi: { en: 'Draw the character again', zh: '再写一遍' },

  namesHead: { en: 'One river, many names', zh: '一条江，好几个名字' },
  names: [
    {
      word: '浙 · 浙江',
      py: 'Zhè · Zhèjiāng',
      en: 'The oldest name is simply 浙, the Zhe River, or 浙江. One traditional explanation links 浙 with 折, “to bend”, because the river twists so much, though scholars still argue about where the character came from.',
      zh: '最早的名字就是一个“浙”字，也叫“浙江”。一种传统说法认为“浙”与“折”相通，指江流曲折；不过“浙”字到底从哪里来，学界至今还有争论。',
    },
    {
      word: '之江',
      py: 'Zhījiāng',
      en: 'Seen from above, its bends look like the character 之, so it was also called the Zhijiang. The name lives on in the Zhijiang campus and in Hangzhou street names.',
      zh: '从高处看，江流的几道弯像个“之”字，所以又叫“之江”。这个名字今天还留在浙大之江校区和杭州的路名里。',
    },
    {
      word: '钱塘江',
      py: 'Qiántáng Jiāng',
      en: 'The name used today comes from Qiantang, the old county around Hangzhou that the river flows past.',
      zh: '今天通用的名字来自“钱塘”，也就是江流经过的杭州一带的古县名。',
    },
    {
      word: '浙江省 · 浙江大学',
      py: 'Zhèjiāng Shěng · Zhèjiāng Dàxué',
      en: 'The province took its name from the river, and the university took its name from the province. So when you say “ZJU”, in a way you are saying the river’s name.',
      zh: '浙江省因江得名，浙江大学又因省得名。所以说出“浙大”两个字，某种意义上也是在叫这条江的名字。',
    },
  ],
  spellings: {
    en: 'Older English books and maps use other spellings: Chekiang for Zhejiang and Hangchow for Hangzhou. That is why 之江大学 appears in English as Hangchow University, and why ZJU was once National Chekiang University. If you search old archives, try both spellings.',
    zh: '老的英文书和地图用的是旧拼法：浙江写作 Chekiang，杭州写作 Hangchow。所以之江大学的英文名是 Hangchow University，浙大以前叫 National Chekiang University。查老档案时，新旧两种拼法都要试试。',
  },

  campusHead: { en: 'A college on Yuelun Hill', zh: '月轮山上的大学' },
  campusIntro: {
    en: 'The red-brick buildings next to the pagoda began as a small {missionary} school on the coast. Here is how it reached the hill, and how it became part of ZJU.',
    zh: '六和塔旁边那片红砖楼，最早是海边一所小小的{missionary}学校。它怎样搬到这座山上，又怎样成了浙大的一部分，看下面的时间线。',
  },
  campusTimeline: [
    {
      year: '1845',
      en: 'In Ningbo, American Presbyterian missionaries, led by Divie Bethune McCartee, open a boys’ boarding school (崇信义塾).',
      zh: '美国北长老会传教士麦嘉缔（Divie Bethune McCartee）等人在宁波开办“崇信义塾”，是一所男童寄宿学校。',
    },
    {
      year: '1867',
      en: 'The school moves to Hangzhou and becomes the Hangchow Presbyterian Boys’ School (育英义塾).',
      zh: '学校迁到杭州，改名“育英义塾”。',
    },
    {
      year: '1897',
      en: 'College courses are added: it is now Hangchow Presbyterian College (育英书院).',
      zh: '开设大学课程，改称“育英书院”（Hangchow Presbyterian College）。',
    },
    {
      year: '1908–1911',
      en: 'A new campus rises on the hillside above the river. Sources give different dates: building began in 1908 or 1909, and the college moved in by 1911. Its Chinese name becomes 之江大学, after the river below.',
      zh: '在江边的山坡上建起新校园。各资料说法不一：有的说 1908 年动工，有的说 1909 年，1911 年迁入。中文校名改为“之江大学”，取自山下的这条江。',
    },
    {
      year: '1952',
      en: 'In the nationwide reorganisation of universities, Hangchow University is dissolved. Its departments go to Zhejiang University, Zhejiang Teachers College and other schools.',
      zh: '全国院系调整，之江大学撤销，各系分别并入浙江大学、浙江师范学院等校。',
    },
    {
      year: '1961',
      en: 'The campus is handed to Zhejiang University. Today it is ZJU’s Zhijiang campus, home to the Guanghua Law School.',
      zh: '校址划归浙江大学，就是今天的浙大之江校区，光华法学院就在这里。',
    },
    {
      year: '2006',
      en: 'The former campus becomes a {heritage}. Twenty-two buildings from the college years survive.',
      zh: '之江大学旧址被列为{heritage}，保存着 22 幢之江大学时期的建筑。',
    },
  ],
  campusNote: {
    en: 'In English, use “Hangchow University” or “Hangchow Christian College” for the old college and “Zhijiang campus” for ZJU today.',
    zh: '用英文介绍时：老学校叫 Hangchow University 或 Hangchow Christian College，今天的校区叫 Zhijiang campus。',
  },

  bridgeHead: { en: 'A bridge built for a country at war', zh: '在战火中建成的大桥' },
  bridgeIntro: {
    en: 'Downstream of the pagoda, the Qiantang River Bridge is a {doubledeck}: cars on top, trains below. Its chief engineer, Mao Yisheng (茅以升), had to fight the river’s silt and tides, and then a war.',
    zh: '六和塔下游的钱塘江大桥是一座{doubledeck}：上层走汽车，下层走火车。总工程师茅以升（Mao Yisheng）要对付江底的流沙和潮水，后来还要面对战争。',
  },
  bridgeTimeline: [
    {
      year: '1934',
      en: 'Construction starts on 8 August (some sources date the ground-breaking ceremony to 11 November).',
      zh: '8 月 8 日正式动工（也有资料把开工典礼记为 11 月 11 日）。',
    },
    {
      year: '1937',
      en: 'On 26 September the first train crosses (some sources give 29 September). The bridge is 1,453 m long including the approaches.',
      zh: '9 月 26 日第一列火车驶过大桥（也有资料记为 9 月 29 日）。大桥连引桥全长 1453 米。',
    },
    {
      year: '1937',
      en: 'On 23 December, with Japanese troops closing in on Hangzhou, the builders blow up their own bridge on orders, to slow the advance. Two piers and five steel spans are destroyed. Mao keeps the bridge’s records safe through the war.',
      zh: '12 月 23 日，日军逼近杭州，建桥的人奉命亲手炸毁大桥，以阻滞日军南下，两座桥墩被毁，五孔钢梁落入江中。茅以升带着建桥资料辗转逃难，一直保存到战后。',
    },
    {
      year: '1946–1953',
      en: 'Repairs begin after the war. Road and rail traffic are fully restored in May 1953.',
      zh: '抗战胜利后开始修复，1953 年 5 月公路、铁路全面恢复通车。',
    },
    {
      year: '2006',
      en: 'The bridge becomes a nationally protected heritage site. Trains still cross it every day.',
      zh: '大桥被列为全国重点文物保护单位，至今每天仍有火车通过。',
    },
  ],
  bridgeNote: {
    en: 'Chinese sources call it the first double-deck road-and-rail bridge designed and built by Chinese engineers. Foreign firms were contracted for parts of the work, such as some piers and the steel spans, so if an English source says “built by Dorman Long”, it is talking about that steelwork.',
    zh: '中文资料称它是中国人自己设计、建造的第一座公路铁路两用双层桥。部分工程（如部分桥墩和钢梁）曾由外国公司承包，所以英文资料里写“由 Dorman Long 建造”，说的是钢梁那部分。',
  },

  sayHead: { en: 'Say it in English', zh: '用英语说一说' },
  sayIntro: {
    en: 'Read these aloud, then try your own version. Each one uses a word from this chapter.',
    zh: '先把这几句读出来，再试着用自己的话说。每句都用到了本章的词。',
  },
  hear: { en: 'Hear it', zh: '听一听' },
  sentences: [
    {
      en: 'Zhejiang Province takes its name from the river, and Zhejiang University takes its name from the province.',
      zh: '浙江省因江得名，浙江大学又因省得名。',
    },
    {
      en: 'Seen from the hills, the river bends like the Chinese character 之, so people also called it the Zhijiang.',
      zh: '从山上看，江流弯得像个“之”字，所以人们也叫它“之江”。',
    },
    {
      en: 'Hangzhou Bay is shaped like a funnel: about a hundred kilometres wide at the mouth, but only two or three kilometres wide by the time the tide reaches Yanguan.',
      zh: '杭州湾像个漏斗：湾口宽约一百公里，潮水到盐官时，江面只剩两三公里宽。',
    },
    {
      en: 'The Zhijiang campus is just upstream of the pagoda, and the 1937 bridge is just downstream.',
      zh: '之江校区就在六和塔的上游一点，1937 年的大桥就在下游一点。',
    },
  ],
  yourTurn: {
    en: 'Your turn: a visiting student asks where ZJU’s oldest-looking campus is. Answer in two or three sentences, using “upstream”, “on the hill” and “next to”.',
    zh: '轮到你了：一位来访的留学生问你，浙大哪个校区看起来最古老、在哪里。用两三句英语回答，用上 upstream、on the hill 和 next to。',
  },
  yourTurnLabel: { en: 'Your answer (only you can see this)', zh: '你的回答（只有你自己能看到）' },
  yourTurnModel: { en: 'Show a model answer', zh: '看参考回答' },
  yourTurnModelText: {
    en: 'It’s the Zhijiang campus. It’s on the hill next to the Liuhe Pagoda, by the Qiantang River, and it’s just upstream of the old 1937 bridge.',
    zh: '参考：It’s the Zhijiang campus. It’s on the hill next to the Liuhe Pagoda, by the Qiantang River, and it’s just upstream of the old 1937 bridge.（是之江校区，在钱塘江边六和塔旁的山上，就在 1937 年老桥的上游。）',
  },
};

/** Places on the sand table. `ll` = [lon, lat]. `view` = camera distance when flying there. */
export const PLACES = [
  {
    id: 'bay',
    ll: [121.8, 30.43],
    pole: 1.0,
    view: 78,
    name: { en: 'Mouth of Hangzhou Bay', zh: '杭州湾口' },
    body: [
      {
        en: 'Between Nanhui in Shanghai and Zhenhai in Ningbo, the mouth of Hangzhou Bay is about 100 km wide. Inland it narrows fast. At Yanguan, about 130 km upstream, the river is roughly 2.5 km wide, and below the pagoda the main part of the 1937 bridge crosses it in 1,072 m.',
        zh: '杭州湾口北起上海南汇嘴，南到宁波镇海，宽约 100 公里。往里走，海湾迅速收窄：到上游约 130 公里的盐官，江面只有 2.5 公里左右；到了六和塔下，1937 年大桥的正桥 1072 米就跨过了江面。',
      },
      {
        en: 'Push a rising tide into a funnel like this and the water has nowhere to go but up. That squeeze, together with a shallow river bed further upstream, is why the Qiantang bore is so strong. Chapter 3 lets you make one.',
        zh: '涨潮的海水涌进这样一个“喇叭口”，越往里越挤，只能越堆越高。再加上上游江底变浅，钱塘江涌潮才这样凶猛。第三章可以亲手“造”一次潮。',
      },
    ],
  },
  {
    id: 'yanguan',
    ll: [120.55, 30.402],
    pole: 1.0,
    view: 34,
    name: { en: 'Yanguan, Haining', zh: '海宁盐官' },
    body: [
      {
        en: 'For centuries this has been the classic place to watch the tide. When the main channel shifted north in the Ming and Qing dynasties, the river at Yanguan became straight, so the bore often arrives here as one unbroken white line: the famous “single-line tide” (一线潮).',
        zh: '盐官是观潮的老地方。明清时期钱塘江主槽北移，盐官一段江道变得顺直，潮头到这里往往是一条整齐的白线，这就是有名的“一线潮”。',
      },
      {
        en: 'The biggest crowds come around the 18th day of the eighth lunar month, usually in September or October.',
        zh: '每年农历八月十八前后（一般在公历九、十月间），海塘上的人最多。',
      },
    ],
  },
  {
    id: 'pagoda',
    ll: [120.1266, 30.1983],
    pole: 1.45,
    view: 10,
    name: { en: 'Liuhe Pagoda, Yuelun Hill', zh: '月轮山 · 六和塔' },
    body: [
      {
        en: 'The pagoda stands on Yuelun Hill, right where the river swings past the city. It was first built in 970, in the Wuyue kingdom, to calm the tide. The brick body you see today is a Southern Song rebuilding, and the wooden eaves were added in the Qing dynasty.',
        zh: '六和塔立在月轮山上，正对着江流从城边转过去的地方。塔始建于公元 970 年（吴越国时期），为镇潮而建。今天的砖砌塔身是南宋重建的，外面的木檐是清代加的。',
      },
      {
        en: 'A lamp at the top once guided boats on the river at night. Why build a pagoda here at all? Chapter 2 tells that story.',
        zh: '塔顶曾经点灯，为夜里江上的船指路。为什么偏偏在这里建塔？第二章会讲这个故事。',
      },
    ],
  },
  {
    id: 'campus',
    ll: [120.1193, 30.1933],
    pole: 0.7,
    view: 10,
    name: { en: 'ZJU Zhijiang campus', zh: '浙大之江校区' },
    body: [
      {
        en: 'Less than a kilometre west of the pagoda, red-brick buildings stand among the trees on the same hills. This was Hangchow University (之江大学), a college that grew out of a school founded by American missionaries.',
        zh: '从六和塔往西不到一公里，同一片山坡的树林里散落着红砖老楼。这里原是之江大学，它的前身是美国传教士创办的一所学校。',
      },
      {
        en: 'It has belonged to Zhejiang University since 1961 and is a nationally protected heritage site. Its full story is told below the map.',
        zh: '1961 年起校址归浙江大学，现在是全国重点文物保护单位。完整的故事在地图下面。',
      },
    ],
  },
  {
    id: 'bridge',
    ll: [120.137, 30.1935],
    pole: 1.05,
    view: 11,
    name: { en: 'Qiantang River Bridge', zh: '钱塘江大桥' },
    body: [
      {
        en: 'Just downstream of the pagoda, the steel trusses of the 1937 bridge still carry trains below and cars above. The engineer Mao Yisheng led its design and construction.',
        zh: '就在塔的下游，1937 年建成的钢桁梁桥至今仍是下层走火车、上层走汽车。大桥由茅以升主持设计和建造。',
      },
      {
        en: 'It took three years to build. Less than three months after the first train crossed, its own builders blew it up to slow the Japanese advance. The story is told below the map.',
        zh: '大桥用了三年建成。第一列火车通过后不到三个月，建桥的人又亲手把它炸断，以阻滞日军。完整的故事在地图下面。',
      },
    ],
  },
  {
    id: 'westlake',
    ll: [120.143, 30.246],
    pole: 1.1,
    view: 18,
    name: { en: 'West Lake', zh: '西湖' },
    body: [
      {
        en: 'West Lake lies about 5 km north of the pagoda, with the old city along its eastern shore. A ring of hills stands between them, which is why the pagoda looks out over the river, not the lake.',
        zh: '西湖在六和塔以北约 5 公里，老城沿着湖的东岸展开。湖和塔之间隔着一圈山，所以六和塔面朝钱塘江，而不是西湖。',
      },
      {
        en: 'The West Lake Cultural Landscape of Hangzhou has been a UNESCO World Heritage Site since 2011. On this map the lake is drawn larger than life so that you can find it.',
        zh: '“杭州西湖文化景观”2011 年列入联合国教科文组织《世界遗产名录》。地图上的西湖画得比实际大，方便你找到它。',
      },
    ],
  },
];

/** Non-interactive orientation labels on the table. */
export const MAP_LABELS = [
  { ll: [121.98, 30.5], text: { en: 'East China Sea', zh: '东海' }, kind: 'sea' },
  { ll: [121.25, 30.5], text: { en: 'Hangzhou Bay', zh: '杭州湾' }, kind: 'sea' },
  { ll: [120.3, 30.235], text: { en: 'Qiantang River', zh: '钱塘江' }, kind: 'river' },
  { ll: [119.93, 30.0], text: { en: 'Fuchun River', zh: '富春江' }, kind: 'river' },
  { ll: [120.205, 30.285], text: { en: 'Hangzhou', zh: '杭州' }, kind: 'city' },
  { ll: [121.86, 30.93], text: { en: 'Shanghai (Nanhui)', zh: '上海南汇' }, kind: 'city' },
  { ll: [121.6, 29.93], text: { en: 'Ningbo', zh: '宁波' }, kind: 'city' },
  { ll: [120.68, 30.5], text: { en: 'Haining', zh: '海宁' }, kind: 'city' },
  { ll: [120.92, 30.43], text: { en: 'Ganpu', zh: '澉浦' }, kind: 'town' },
  { ll: [119.96, 30.07], text: { en: 'Fuyang', zh: '富阳' }, kind: 'town' },
];

export const SOURCES = [
  {
    title: { en: 'Hangchow University (Wikipedia, with references to Shen Shanhong ed. 1989 and the Zhejiang Bureau of Cultural Relics)', zh: '之江大学（英文维基百科，引用《杭州大学校史》等）' },
    url: 'https://en.wikipedia.org/wiki/Hangchow_University',
    note: { en: '1845 Ningbo, 1867 move, 1897 college, 1911 hill campus, 1952 dissolution, 2006 listing', zh: '1845 年宁波创办、1867 年迁杭、1897 年改书院、1911 年迁山上、1952 年撤销、2006 年列国保' },
  },
  {
    title: { en: 'Zhejiang University, Zhijiang campus history (ZJU document)', zh: '浙江大学之江校区历史介绍（浙大文件）' },
    url: 'https://rwsk.zju.edu.cn/_upload/article/files/4b/6e/3af9b67a4adcb6b47d41c273c157/c4b7d8f3-9765-481a-889c-fbe3e3bad990.doc',
    note: { en: 'Building began 1908 under Robert Fitch; campus to ZJU in 1961; 22 protected buildings', zh: '1908 年由费佩德主持始建；1961 年划归浙大；22 幢文物建筑' },
  },
  {
    title: { en: 'Hangzhou News: the old Zhijiang University on Yuelun Hill (2018)', zh: '杭州网：月轮山上的之江大学（2018）' },
    url: 'https://hznews.hangzhou.com.cn/wghz/content/2018-09/12/content_7066424_2.htm',
  },
  {
    title: { en: 'Hangzhou News: 80 years of the Qiantang River Bridge (2017)', zh: '杭州网：钱塘江大桥 80 年（2017）' },
    url: 'https://hznews.hangzhou.com.cn/chengshi/content/2017-09/26/content_6670978_2.htm',
    note: { en: 'Demolition on 23 December 1937: two piers, five spans', zh: '1937 年 12 月 23 日炸桥：两座桥墩、五孔钢梁' },
  },
  {
    title: { en: 'Guangming Online: the Qiantang River Bridge (2023)', zh: '光明网：钱塘江大桥（2023）' },
    url: 'https://m.gmw.cn/baijia/2023-01/09/36287617.html',
    note: { en: 'Opened 26 September 1937; 1,453 m; full reopening May 1953', zh: '1937 年 9 月 26 日通车；全长 1453 米；1953 年 5 月全面恢复通车' },
  },
  {
    title: { en: '12371.cn: Mao Yisheng and the Qiantang River Bridge (2019)', zh: '共产党员网：茅以升与钱塘江大桥（2019）' },
    url: 'https://www.12371.cn/2019/10/09/ARTI1570574847207452.shtml',
  },
  {
    title: { en: 'Qiantang River Bridge (Wikipedia / Structurae)', zh: '钱塘江大桥（英文维基百科 / Structurae）' },
    url: 'https://en.wikipedia.org/wiki/Qiantang_River_Bridge',
    note: { en: 'Start 8 August 1934; Dorman Long steelwork; main bridge 1,072 m', zh: '1934 年 8 月 8 日动工；钢梁由 Dorman Long 承建；正桥 1072 米' },
  },
  {
    title: { en: 'Xinhua: why Yanguan became the place to watch the tide (2023)', zh: '新华网：盐官为何成为观潮胜地（2023）' },
    url: 'https://www.news.cn/politics/2023-10/01/c_1129895368.htm',
  },
  {
    title: { en: 'People’s Daily: how many shapes can the Qiantang tide take? (2023)', zh: '人民日报：钱塘潮有多少种形态？（2023）' },
    url: 'https://paper.people.com.cn/rmrb/html/2023-09/18/nw.D110000renmrb_20230918_2-13.htm',
  },
  {
    title: { en: 'Hangzhou News: tide-watching safety and the shape of the bay (2017)', zh: '杭州网：观潮安全与杭州湾地形（2017）' },
    note: { en: 'Bay mouth about 100 km (Nanhui to Zhenhai); about 2.5 km wide at Yanguan; bore usually 1–2 m, sometimes over 3 m', zh: '湾口南汇咀至镇海约 100 公里；盐官江面约 2.5 公里；潮头一般 1–2 米，最高 3 米以上' },
    url: 'https://hznews.hangzhou.com.cn/chengshi/content/2017-09/29/content_6675089_2.htm',
  },
  {
    title: { en: 'NPR: Riding the “Silver Dragon” (2014), on Hangzhou Bay as a funnel', zh: 'NPR：驾驭“银龙”（2014），关于杭州湾的“漏斗”作用' },
    url: 'https://www.npr.org/sections/parallels/2014/09/12/347950272/riding-the-silver-dragon-surfers-tame-chinas-10-foot-river-waves',
  },
  {
    title: { en: 'UNESCO: West Lake Cultural Landscape of Hangzhou (inscribed 2011)', zh: '联合国教科文组织：杭州西湖文化景观（2011 年列入）' },
    url: 'https://whc.unesco.org/en/list/1334',
  },
  {
    title: { en: 'Map positions checked against OpenStreetMap (© OpenStreetMap contributors, ODbL)', zh: '地图位置参照 OpenStreetMap（© OpenStreetMap 贡献者，ODbL）' },
    url: 'https://www.openstreetmap.org/copyright',
  },
];
