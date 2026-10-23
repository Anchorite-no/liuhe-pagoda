/**
 * Words for ch3: vocabulary, sources and the longer bilingual texts.
 * Inline vocabulary is written as {term-id} or {term-id|display en|display zh} inside rich strings.
 */

/** Terms owned by this chapter (registered with registerVocab('ch3', …)). */
export const VOCAB = [
  {
    id: 'tide-spring-tide',
    en: 'spring tide',
    zh: '大潮（朔望潮）',
    pinyin: 'dà cháo',
    def: {
      en: 'The biggest tides of the month, around new moon and full moon, when the Sun and the Moon pull in a line. Nothing to do with the season.',
      zh: '每月朔、望前后的大潮。此时太阳和月亮的引力方向一致、互相叠加。英文 spring 在这里与春天无关。',
    },
    example: { en: 'Spring tides on the Qiantang come a day or two after the full moon.', zh: '钱塘江的大潮在满月之后一两天到来。' },
  },
  {
    id: 'tide-neap-tide',
    en: 'neap tide',
    zh: '小潮',
    pinyin: 'xiǎo cháo',
    def: {
      en: 'The smallest tides of the month, around the half-moons, when the Sun pulls at right angles to the Moon.',
      zh: '每月上弦、下弦前后的小潮，此时太阳和月亮的引力方向接近垂直。',
    },
    example: { en: 'At neap tide the bore is small or does not form at all.', zh: '小潮时，涌潮很小，甚至形不成。' },
  },
  {
    id: 'cal-lunar-calendar',
    en: 'lunar calendar',
    zh: '农历',
    pinyin: 'nóng lì',
    def: {
      en: 'The traditional Chinese calendar. Each month follows the Moon: day 1 is the new moon and day 15 or 16 is the full moon.',
      zh: '中国传统历法。每个月跟着月亮走：初一是新月（朔），十五或十六是满月（望）。',
    },
    example: { en: 'In the lunar calendar, the famous tide falls on the 18th day of the 8th month.', zh: '按农历算，最有名的大潮在八月十八。' },
  },
  {
    id: 'tide-funnel-shaped',
    en: 'funnel-shaped',
    zh: '喇叭形的',
    pinyin: 'lǎ ba xíng de',
    def: {
      en: 'Wide at one end and narrow at the other, like a funnel. Hangzhou Bay is about 100 km wide at its mouth and about 1 km wide near Hangzhou.',
      zh: '一头宽、一头窄，像漏斗或喇叭。杭州湾湾口宽约 100 公里，到杭州附近只有约 1 公里。',
    },
    example: { en: 'The funnel-shaped bay squeezes the tide and makes it higher.', zh: '喇叭形的海湾挤压潮水，让潮变高。' },
  },
  {
    id: 'tide-sandbar',
    en: 'sandbar',
    zh: '沙坎；沙洲',
    pinyin: 'shā kǎn',
    def: {
      en: 'A long ridge of sand or silt on the bed of a river or the sea. The Qiantang’s sandbar is about 130 km long.',
      zh: '河床或海底上隆起的长条形泥沙堆积。钱塘江河口的沙坎长约 130 公里。',
    },
    example: { en: 'Over the sandbar the water is shallow, so the wave slows down and steepens.', zh: '沙坎上水浅，潮波变慢、变陡。' },
  },
  {
    id: 'tide-crest',
    en: 'crest',
    zh: '潮头；浪峰',
    pinyin: 'cháo tóu',
    def: {
      en: 'The top of a wave. For a tidal bore, the steep front edge where the water breaks into foam.',
      zh: '波浪的最高处。涌潮的潮头就是最陡、翻起白沫的前缘。',
    },
    example: { en: 'The crest of the bore broke against the seawall.', zh: '潮头拍打在海塘上。' },
  },
  {
    id: 'tide-tidal-range',
    en: 'tidal range',
    zh: '潮差',
    pinyin: 'cháo chā',
    def: {
      en: 'The difference in height between high tide and low tide at one place.',
      zh: '同一地点高潮和低潮之间的水位差。',
    },
    example: { en: 'The tidal range at Ganpu can be almost 9 metres.', zh: '澉浦的潮差最大接近 9 米。' },
  },
  {
    id: 'tide-equinox',
    en: 'equinox',
    zh: '分点（春分、秋分）',
    pinyin: 'fēn diǎn',
    def: {
      en: 'One of the two days a year, in March and September, when the Sun is directly above the equator and day and night are about the same length.',
      zh: '一年中太阳直射赤道、昼夜几乎等长的两天，即春分（三月）和秋分（九月）。',
    },
    example: { en: 'The biggest tides of the year come around the equinoxes.', zh: '一年中最大的潮出现在春分、秋分前后。' },
  },
];

/**
 * Terms first registered by the prologue (ch0). Used inline here with the same ids, so the
 * wordbook stays de-duplicated, but not re-registered (that would move them to ch3).
 */
export const SHARED_TERMS = {
  'tide-tidal-bore': {
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
  'geo-upstream': {
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
};

export const SOURCES = [
  {
    title: {
      en: 'Xie & Wang (2021), Seasonal tidal dynamics in the Qiantang Estuary, Frontiers in Earth Science',
      zh: 'Xie & Wang（2021），《钱塘江河口的季节性潮汐动力》，Frontiers in Earth Science',
    },
    url: 'https://doi.org/10.3389/feart.2021.782640',
    note: {
      en: 'Widths: about 100 km at the bay mouth, 18 km at Ganpu, 2.5 km at Yanguan, 1 km at Zhakou; mean tidal range 3.2 m at the mouth, about 6 m at Ganpu; low river flow from August to March.',
      zh: '宽度：湾口约 100 公里、澉浦 18 公里、盐官约 2.5 公里、闸口约 1 公里；平均潮差湾口 3.2 米、澉浦约 6 米；八月至次年三月为枯水期。',
    },
  },
  {
    title: {
      en: 'Xie (2018), Morphodynamic response of a large tidal channel system to embankment in Hangzhou Bay, Anthropocene Coasts',
      zh: 'Xie（2018），《杭州湾大型潮汐通道对围垦的地貌响应》，Anthropocene Coasts',
    },
    url: 'https://doi.org/10.1139/anc-2018-0003',
    note: {
      en: 'The sandbar: about 130 km long, the bed rising from about 10 m below sea level at Zhapu to about 1 m above it near Qibao.',
      zh: '沙坎：长约 130 公里，河床从乍浦附近海平面以下约 10 米抬升到七堡附近海平面以上约 1 米。',
    },
  },
  {
    title: {
      en: 'Pan & Lu (2010), 2D numerical simulation of tidal bore on Qiantang River using KFVS scheme, Coastal Engineering Proceedings',
      zh: '潘存鸿、卢海燕（2010），《钱塘江涌潮的 KFVS 二维数值模拟》，国际海岸工程会议论文',
    },
    url: 'https://doi.org/10.9753/icce.v32.currents.29',
    note: {
      en: 'Largest bores about 4 m; bore speed generally 4–7 m/s; mean tidal range at Ganpu 5.62 m, maximum 9 m; cross, single-line and returning bores.',
      zh: '最大涌潮高约 4 米；推进速度一般 4–7 米/秒；澉浦年均潮差 5.62 米，最大 9 米；交叉潮、一线潮、回头潮。',
    },
  },
  {
    title: {
      en: 'Wang, Pan & Chen (2022), Tidal bore dynamics around the similar right-angle shoreline in the Qiantang Estuary, China Ocean Engineering',
      zh: 'Wang、Pan、Chen（2022），《钱塘江河口类直角岸线附近的涌潮动力》，China Ocean Engineering',
    },
    url: 'https://doi.org/10.1007/s13344-022-0059-y',
    note: {
      en: 'Bores form near Ganpu and run upstream for over 100 km at 20–30 km/h; about 3 m high in the Yanguan reach at spring tides; the returning (back-flow) bore forms at Laoyancang.',
      zh: '涌潮在澉浦附近形成，以每小时 20–30 公里向上游推进一百多公里；大潮时盐官河段潮高约 3 米；回头潮在老盐仓形成。',
    },
  },
  {
    title: {
      en: 'Guangming Online (2026-09-24): why the Qiantang tide is greatest around the 18th of the 8th month',
      zh: '光明网（2026-09-24）：钱江潮为何八月十八最壮观',
    },
    url: 'https://m.gmw.cn/2026-09/24/content_1304567856.htm',
    note: {
      en: 'Timing, funnel, sandbar and wind; average speed 5–7 m/s, up to 10 m/s; where to see each shape; safety advice.',
      zh: '天时、地利、风势；平均速度 5–7 米/秒，最快约 10 米/秒；各种潮形的观赏地点；观潮安全提示。',
    },
  },
  {
    title: { en: "People's Daily (2023-09-18): how many shapes does the Qiantang tide have?", zh: '人民日报（2023-09-18）：钱塘潮有多少种形态？' },
    url: 'https://paper.people.com.cn/rmrb/html/2023-09/18/nw.D110000renmrb_20230918_2-13.htm',
  },
  {
    title: { en: 'NPR (2014): Riding the Silver Dragon', zh: '美国国家公共电台（2014）：驾驭“银龙”' },
    url: 'https://www.npr.org/sections/parallels/2014/09/12/347950272/riding-the-silver-dragon-surfers-tame-chinas-10-foot-river-waves',
    note: { en: 'Nearly 60 spectators killed in 1993.', zh: '1993 年近 60 名观潮者遇难。' },
  },
  {
    title: { en: 'Irish Examiner / Xinhua (2007): Rising wave kills eight in China', zh: '爱尔兰《审查者报》转引新华社（2007）' },
    url: 'https://www.irishexaminer.com/maintopics/arid-30321860.html',
    note: {
      en: '3 October 1993: 86 people swept away, 19 bodies recovered, 40 never found.',
      zh: '1993 年 10 月 3 日：86 人被卷走，找到 19 具遗体，40 人失踪。',
    },
  },
  {
    title: { en: 'Zhang et al. (2012), Astronomical tide and typhoon-induced storm surge in Hangzhou Bay', zh: 'Zhang 等（2012），《杭州湾的天文潮与台风风暴潮》' },
    url: 'https://doi.org/10.5772/28153',
    note: { en: 'Strong onshore winds push large volumes of sea water into the bay.', zh: '强劲的向岸风把大量海水推进湾内。' },
  },
  {
    title: { en: 'NOAA: What is a spring tide?', zh: '美国国家海洋和大气管理局：什么是大潮？' },
    url: 'https://oceanservice.noaa.gov/facts/springtide.html',
  },
  {
    title: { en: 'lunar-javascript (6tail): Chinese calendar library used for “Today’s tide”', zh: 'lunar-javascript（6tail）：“今日潮讯”使用的农历库' },
    url: 'https://github.com/6tail/lunar-javascript',
  },
];

export const T = {
  lede: {
    en: 'Twice a month the sea runs up the Qiantang River as a wall of water. Line up the Moon, choose the season, shape the bay, raise the sandbar, and let a tide go.',
    zh: '每个月有两次，海水沿钱塘江涌上来，立成一道水墙。排好月亮，选好季节，捏出海湾的形状，垫高江底的沙坎，然后放出一潮。',
  },
  intro: {
    en: 'A {tide-tidal-bore} is the front edge of the incoming tide when it rises so fast that the water forms a step, which then travels {geo-upstream} against the river. The Qiantang’s is one of the largest in the world. Four things build it: the pull of the Moon and the Sun, a {tide-funnel-shaped} bay, a huge {tide-sandbar} in the riverbed, and the wind. Try each one in the lab.',
    zh: '{tide-tidal-bore}是涨潮的前锋：潮水涨得太快，水面陡然抬高成一道“台阶”，逆着江流向{geo-upstream|upstream|上游}推进。钱塘江涌潮是世界上规模最大的涌潮之一。造出它要四样东西：日月的引力、{tide-funnel-shaped|funnel-shaped|喇叭形}的海湾、江底巨大的{tide-sandbar|sandbar|沙坎}，还有风。下面的实验室里，可以一样一样地试。',
  },

  // lab
  controlsTitle: { en: 'Build your tide', zh: '调配一次潮' },
  moonLabel: { en: 'Lunar day', zh: '农历日期' },
  moonValue: { en: 'Day {d} · {phase}', zh: '{dz} · {phase}' },
  spring: { en: 'Spring tide: the Sun, Earth and Moon are in a line, so their pulls add up.', zh: '大潮：日、地、月排成一线，引潮力叠加。' },
  neap: { en: 'Neap tide: the Moon pulls at right angles to the Sun, so they partly cancel.', zh: '小潮：月亮和太阳的引力方向垂直，互相抵消一部分。' },
  between: { en: 'Between spring and neap: the Sun and Moon are partly lined up.', zh: '介于大潮和小潮之间：日月部分对齐。' },
  orbitNote: { en: 'Seen from above the North Pole. Sunlight comes from the left.', zh: '从北极上空俯视，阳光从左边照来。' },
  seasonLabel: { en: 'Season', zh: '季节' },
  seasons: {
    spring: { en: 'Spring equinox', zh: '春分前后' },
    summer: { en: 'Summer', zh: '夏季' },
    autumn: { en: 'Autumn equinox', zh: '秋分前后' },
    winter: { en: 'Winter', zh: '冬季' },
  },
  mouthLabel: { en: 'Width of the bay mouth', zh: '湾口宽度' },
  mouthValue: { en: '{v} km', zh: '{v} 公里' },
  real: { en: ' (real)', zh: '（真实）' },
  barLabel: { en: 'Height of the sandbar', zh: '沙坎高度' },
  barValue: { en: '{v} m', zh: '{v} 米' },
  windLabel: { en: 'Wind', zh: '风' },
  windCalm: { en: 'Calm', zh: '无风' },
  windOn: { en: 'SE {v} m/s, onshore', zh: '东南风 {v} 米/秒（向岸）' },
  windOff: { en: 'NW {v} m/s, offshore', zh: '西北风 {v} 米/秒（离岸）' },
  shapeLabel: { en: 'Shape of the bore', zh: '潮的形态' },
  shapes: {
    line: { en: 'Single line', zh: '一线潮' },
    cross: { en: 'Cross', zh: '交叉潮' },
    return: { en: 'Returning', zh: '回头潮' },
  },
  shapeCaption: {
    line: { en: 'Straight channel, no obstacles: one clean line from bank to bank, as at Yanguan.', zh: '江道顺直、没有阻挡：一条白线横贯江面，盐官最典型。' },
    cross: { en: 'A sandbank splits the tide; the two branches meet in an X, as at Daquekou.', zh: '沙洲把潮水分成两股，再相遇时交叉成“X”，大缺口最典型。' },
    return: { en: 'A long dike throws the bore back toward the bank, as at Laoyancang.', zh: '长长的丁坝把潮头反弹回岸边，老盐仓最典型。' },
  },
  release: { en: 'Release the tide', zh: '放潮' },
  skip: { en: 'Skip to the result', zh: '直接看结果' },
  realSettings: { en: 'Use the real 18th of the 8th month', zh: '恢复真实的八月十八' },
  overview: { en: 'Back to the overview', zh: '回到全景' },
  hint: { en: 'Drag to look around · heights to scale', zh: '拖动可旋转视角 · 高度按真实比例' },
  timelapse: { en: 'Time-lapse ×20', zh: '时间快放 20 倍' },
  stillNote: { en: 'Reduced motion is on, so the tide is shown as a still.', zh: '已开启“减少动态效果”，所以这里只显示静止画面。' },

  // result
  resultTitle: { en: 'Result', zh: '结果' },
  modelBadge: { en: 'Teaching model, not a forecast', zh: '教学模型，不是预报' },
  height: { en: 'Bore height', zh: '潮头高度' },
  speed: { en: 'Speed', zh: '推进速度' },
  range: { en: 'Tidal range at the head of the bay', zh: '湾顶潮差' },
  meters: { en: '{v} m', zh: '{v} 米' },
  speedMs: { en: '{v} m/s', zh: '{v} 米/秒' },
  speedKmh: { en: '{k} km/h', zh: '每小时 {k} 公里' },
  noSpeed: { en: 'no front', zh: '没有潮头' },
  scaleUsual: { en: 'about 3 m at Yanguan in spring tides', zh: '大潮时盐官约 3 米' },
  scaleMax: { en: 'largest ≈ 4 m', zh: '最大约 4 米' },
  sayIt: { en: 'Say it in English', zh: '用英文说一说' },
  hear: { en: 'Hear it', zh: '听一听' },
  howModel: { en: 'How the model works', zh: '模型是怎么算的' },
  modelSteps: [
    {
      en: 'Moon: the tidal range at the bay mouth is 4.0 m at spring tide and about half that at neap tide, peaking two days after new and full moon.',
      zh: '月亮：湾口潮差在大潮时取 4.0 米，小潮时约为一半，峰值在朔、望之后两天。',
    },
    {
      en: 'Season: ×1.10 around the autumn equinox, ×1.00 spring, ×0.92 winter, ×0.85 summer (flood season).',
      zh: '季节：秋分前后 ×1.10，春分 ×1.00，冬季 ×0.92，夏季汛期 ×0.85。',
    },
    {
      en: 'Funnel: the narrowing bay multiplies the range by up to about 1.9 (real data: 3.2 m at the mouth, about 6 m at Ganpu).',
      zh: '喇叭口：收窄的海湾把潮差放大，最多约 1.9 倍（实测：湾口 3.2 米，澉浦约 6 米）。',
    },
    { en: 'Wind: ±2 % of the range for every m/s of onshore or offshore wind.', zh: '风：向岸或离岸风每 1 米/秒，潮差增减 2%。' },
    {
      en: 'Sandbar: the water over the bar at low tide is 12 m minus the bar height. The bigger the tidal range compared with that depth, the more of it turns into a breaking front.',
      zh: '沙坎：低潮时沙坎上的水深 = 12 米 − 沙坎高度。潮差与水深之比越大，越多的潮差转化成破碎的潮头。',
    },
    {
      en: 'Speed: a bore runs at about √(g × depth), a little faster when it is higher, minus the river’s current.',
      zh: '速度：涌潮的速度约为 √(重力加速度 × 水深)，潮头越高略快一些，再减去江水的流速。',
    },
  ],

  // estuary diagram
  plan: { en: 'From above: the funnel', zh: '俯视：喇叭口' },
  profile: { en: 'Side view: riverbed, sandbar and the tide', zh: '剖面：江底、沙坎与潮水' },
  sea: { en: 'East China Sea', zh: '东海' },
  mouthTag: { en: 'mouth {v} km wide', zh: '湾口宽 {v} 公里' },
  barTag: { en: 'sandbar {v} m', zh: '沙坎 {v} 米' },
  estuaryCaption: {
    en: 'Schematic, not to scale: widths and depths are exaggerated so you can see them. The wave runs in from the sea on the right and steepens over the sandbar.',
    zh: '示意图，不按比例：宽度和深度都放大了。潮波从右边的海上进来，在沙坎上变陡。',
  },

  // today
  todayTitle: { en: 'Today’s tide', zh: '今日潮讯' },
  todayDate: {
    en: 'Today is {date}: day {day} of the {month} month in the {cal}.',
    zh: '今天是{date}，{cal}{monthZh}{dayZh}。',
  },
  todayMoon: { en: 'The Moon is about {age} days old: {phase}, {lit}% lit.', zh: '月龄约 {age} 天，{phase}，月面被照亮约 {lit}%。' },
  inWindow: {
    en: 'You are in a spring-tide window now (lunar days {a}–{b}, until {end}).',
    zh: '现在正处在大潮期（农历{a}至{b}，到{end}为止）。',
  },
  nextWindow: {
    en: 'Next spring-tide window: in {n} days, {start} – {end} (lunar days {a}–{b}).',
    zh: '下一个大潮期：{n} 天后，{start}至{end}（农历{a}至{b}）。',
  },
  next818: { en: 'Next 18th day of the 8th lunar month: {date}, {n} days away.', zh: '下一个农历八月十八：{date}，还有 {n} 天。' },
  is818: { en: 'Today is the 18th day of the 8th lunar month, the classic day to watch the tide.', zh: '今天就是农历八月十八，传统的观潮日。' },
  todayNote: {
    en: 'Big tides on the Qiantang come a day or two after new and full moon. Times and heights change every day: check the local tide forecast before you go.',
    zh: '钱塘江的大潮通常比朔、望晚一两天。潮时和潮高每天都不同，出发前请查当地的潮汐预报。',
  },
  setToday: { en: 'Set the lab to today', zh: '用今天的条件做实验' },

  // how
  howTitle: { en: 'How a bore is made', zh: '涌潮是怎样形成的' },
  how: [
    {
      head: { en: 'The Moon and the Sun', zh: '日月的引力' },
      body: {
        en: 'The Moon’s gravity pulls the ocean into a bulge, and the Sun adds a smaller one. At new moon and full moon the two pulls line up and add together: a {tide-spring-tide} (the name has nothing to do with the season). At the half-moons they work at right angles and partly cancel: a {tide-neap-tide}. On the Qiantang the biggest tides arrive a day or two after the alignment, which is why the famous date is the 18th of the lunar month, not the 15th.',
        zh: '月球的引力把海水拉出一个“隆起”，太阳再添上一个小一些的。朔日和望日，日月引力方向一致、互相叠加，形成{tide-spring-tide|spring tide|大潮}（英文 spring tide 里的 spring 和春天无关）。上弦、下弦时，两股引力方向垂直，互相抵消一部分，形成{tide-neap-tide|neap tide|小潮}。钱塘江的大潮要比日月对齐晚一两天才到，所以观潮的日子是十八，而不是十五。',
      },
    },
    {
      head: { en: 'Why autumn', zh: '为什么是八月' },
      body: {
        en: 'Around an {tide-equinox} the Sun stands over the equator, and spring tides are among the largest of the year. In autumn the Qiantang also carries little water (its low-flow season runs from August to March), so less river current pushes back against the sea. That is why the 18th day of the 8th month in the {cal-lunar-calendar}, close to the autumn equinox, became the day to watch the tide.',
        zh: '{tide-equinox|equinox|春分、秋分}前后太阳直射赤道，这时的大潮是一年中最大的几次。秋天又正值钱塘江的枯水期（每年八月到次年三月），往下冲的江水少，顶托海潮的力量也小。所以靠近秋分的{cal-lunar-calendar|lunar calendar|农历}八月十八，成了观潮的日子。',
      },
    },
    {
      head: { en: 'The funnel', zh: '喇叭口' },
      body: {
        en: 'Hangzhou Bay is {tide-funnel-shaped}: about 100 km wide at its mouth, 18 km at Ganpu, 2.5 km at Yanguan and only about 1 km by the Liuhe Pagoda, where the 1937 bridge crosses the river. As the tide is squeezed into this narrowing channel it grows taller. The average {tide-tidal-range} is about 3.2 m at the mouth and about 6 m at Ganpu, and the largest ranges there reach about 9 m.',
        zh: '杭州湾是{tide-funnel-shaped|funnel-shaped|喇叭形}的：湾口宽约 100 公里，到澉浦约 18 公里，到盐官约 2.5 公里，到六和塔下、1937 年建成的钱塘江大桥一带只剩 1 公里左右。潮水被挤进越来越窄的水道，越涨越高：湾口的平均{tide-tidal-range|tidal range|潮差}约 3.2 米，到澉浦约 6 米，最大潮差可达 9 米左右。',
      },
    },
    {
      head: { en: 'The sandbar', zh: '沙坎' },
      body: {
        en: 'Silt carried in by the tide has built a gigantic {tide-sandbar} in the riverbed, about 130 km long, whose top stands roughly 10 m above the bed on either side. At low tide the water over it is very shallow. A wave slows down in shallow water (its speed is about the square root of gravity times depth), so the front of the tide slows while the deeper water behind keeps coming. The back catches up with the front, the wave steepens, and its {tide-crest} breaks into a wall of foam: the bore.',
        zh: '潮水带进来的泥沙，在江底堆出一条长约 130 公里的巨大{tide-sandbar|sandbar|沙坎}，坎顶比两侧河床高出约 10 米。低潮时，沙坎上的水很浅。波浪在浅水里会变慢（速度大约是重力加速度乘水深再开平方），于是潮的前锋慢了下来，后面深水里的潮水却还在往前赶。后浪追上前浪，波面越来越陡，{tide-crest|crest|潮头}终于翻成一道白色的水墙，这就是涌潮。',
      },
    },
    {
      head: { en: 'The wind', zh: '风势' },
      body: {
        en: 'Wind can add to all of this or take some away. An onshore south-easterly pushes extra sea water into the bay, and a typhoon can drive huge volumes of water into the estuary; an offshore north-westerly holds the water back.',
        zh: '风可以给潮“加码”，也可以“减码”。从海上吹来的东南风把更多海水推进湾里，台风更是能把大量海水灌进河口；从陆地吹向海上的西北风则把海水往外推。',
      },
    },
  ],
  factsTitle: { en: 'What the sources say', zh: '资料里的数字' },
  facts: [
    {
      k: { en: 'Bore height', zh: '潮头高度' },
      v: { en: 'about 3 m at Yanguan in spring tides; the largest about 4 m', zh: '大潮时盐官约 3 米；最大约 4 米' },
    },
    {
      k: { en: 'Speed', zh: '推进速度' },
      v: { en: 'usually about 4–8 m/s (15–30 km/h); up to about 10 m/s', zh: '一般每秒 4–8 米左右（每小时 15–30 公里）；最快约每秒 10 米' },
    },
    {
      k: { en: 'Width of the bay', zh: '海湾宽度' },
      v: { en: '100 km at the mouth → 18 km at Ganpu → 2.5 km at Yanguan → 1 km by the pagoda', zh: '湾口 100 公里 → 澉浦 18 公里 → 盐官 2.5 公里 → 塔下 1 公里' },
    },
    {
      k: { en: 'Tidal range', zh: '潮差' },
      v: { en: '3.2 m at the mouth, about 6 m at Ganpu (average); about 9 m at most', zh: '湾口 3.2 米，澉浦约 6 米（平均）；最大约 9 米' },
    },
    {
      k: { en: 'Sandbar', zh: '沙坎' },
      v: { en: 'about 130 km long, about 10 m high', zh: '长约 130 公里，高约 10 米' },
    },
  ],
  factsNote: {
    en: 'Sources differ a little, so these are ranges. Bores run along about 100 km of river, from near Ganpu to Wenyan.',
    zh: '各家数据略有出入，所以给的是范围。涌潮从澉浦附近一直推进到闻堰，全程约 100 公里。',
  },
  checkTitle: { en: 'Check the claim', zh: '核实一下' },
  check: {
    en: 'You will often read that the bore can be 9 metres high. Researchers put the largest bores at about 4 m; 9 m is the largest tidal range at Ganpu, the whole rise and fall of the tide. When you explain the bore to a visitor, say which number you mean.',
    zh: '常能看到“潮头高达 9 米”的说法。研究者测得的最大潮头约 4 米；9 米其实是澉浦的最大潮差，也就是一次涨落的总高度。给外国朋友讲解时，要说清楚指的是哪个数字。',
  },

  // shapes
  shapesTitle: { en: 'Three shapes of the tide', zh: '潮的三种形态' },
  shapesIntro: {
    en: 'The same tide looks different along the river, because the riverbed and the banks shape it. In the lab, a sandbank appears for the cross tide and a dike for the returning tide.',
    zh: '同一潮水，在江上不同地方样子不同，因为江底和堤岸在塑造它。在实验室里，选交叉潮会出现沙洲，选回头潮会出现丁坝。',
  },
  shapeCards: [
    {
      id: 'line',
      name: { en: 'Single-line tide', zh: '一线潮' },
      place: { en: 'Yanguan, Haining', zh: '海宁盐官' },
      body: {
        en: 'Where the channel is straight and free of sandbanks, the bore arrives as one clean line from bank to bank. Yanguan, in the reach where the bore is usually at its biggest, is the classic place to see it.',
        zh: '江道顺直、没有沙洲的地方，潮头齐齐整整，从一岸连到另一岸，像一条白线横过江面。盐官一带通常是涌潮最大的河段，也是看一线潮最经典的地方。',
      },
    },
    {
      id: 'cross',
      name: { en: 'Cross tide', zh: '交叉潮' },
      place: { en: 'Daquekou, Haining', zh: '海宁大缺口' },
      body: {
        en: 'Further downstream, sandbanks split the incoming tide into two branches. When they meet again, the fronts cross in an X and spray shoots up where they collide. It depends on how the sand lies, so you will not see it on every tide.',
        zh: '再往下游，江中多沙洲，潮水绕过沙洲分成两股，再相遇时交叉成“X”形，相撞处水花冲天。它取决于沙洲的位置，所以不是每次大潮都能见到。',
      },
    },
    {
      id: 'return',
      name: { en: 'Returning tide', zh: '回头潮' },
      place: { en: 'Laoyancang, Haining', zh: '海宁老盐仓' },
      body: {
        en: 'When the bore runs head-on into a sharp bend or a dike, it is thrown back the way it came. At Laoyancang a long dike juts into the river and hurls the water back against the seawall; returning tides are also seen at Meinüba in Xiaoshan. It is the most spectacular shape, and the most dangerous for spectators, because the water comes back where no one expects it.',
        zh: '潮头迎面撞上急弯或丁坝，会被折回，朝来的方向奔涌。老盐仓有一条长长的拦河丁坝伸进江中，把潮水甩回来，重重拍在海塘上；萧山美女坝也能看到回头潮。它最壮观，对观潮的人也最危险，因为潮水会从意想不到的方向回来。',
      },
    },
  ],

  // safety
  safetyTitle: { en: 'Watching the tide safely', zh: '安全观潮' },
  safetyIntro: {
    en: 'The bore is beautiful, and it is dangerous. On 3 October 1993, 86 people watching the tide were swept into the river; 19 bodies were recovered and 40 people were never found, so nearly 60 died. Here is advice you could give a visitor, in sentences you can use.',
    zh: '涌潮很美，也很危险。1993 年 10 月 3 日，86 名观潮者被潮水卷入江中，找到 19 具遗体，另有 40 人始终没有找到，遇难者近 60 人。下面这些提醒，可以直接讲给来观潮的外国朋友听。',
  },
  safety: [
    {
      say: 'Check the tide times before you go, and get there early.',
      zh: '出发前查好潮时，早点到。',
      more: {
        en: 'The bore reaches each viewing spot at a different time, and the local forecast tells you when.',
        zh: '涌潮到达各个观潮点的时间不同，当地的潮汐预报会写明。',
      },
    },
    {
      say: 'Please stay behind the railing.',
      zh: '请待在栏杆后面。',
      more: {
        en: 'Watch from an official viewing area. Never climb onto the seawall, a dike, a jetty or the steps down to the water, and keep off the mudflats.',
        zh: '在正式的观潮区观看。不要爬上海塘、丁坝、码头或下到水边的台阶，也不要走上滩涂。',
      },
    },
    {
      say: 'When you see the white line, step back, not forward.',
      zh: '看到白线来了，往后退，别往前凑。',
      more: {
        en: 'The bore moves faster than you can run: on average 5 to 7 metres a second.',
        zh: '涌潮比人跑得快，平均每秒 5 到 7 米。',
      },
    },
    {
      say: 'Be careful: the tide can come back.',
      zh: '小心，潮水会回头。',
      more: {
        en: 'Returning and cross tides change direction and can jump the wall. Stay back after the first wave has passed, because the water keeps rising.',
        zh: '回头潮、交叉潮会改变方向，甚至越过堤岸。第一道潮头过去后也别急着靠近，水位还在上涨。',
      },
    },
    {
      say: 'Follow the staff and the loudspeaker announcements.',
      zh: '听从工作人员和广播的指挥。',
      more: {
        en: 'Some viewing spots close in some seasons. Check the latest local notices.',
        zh: '有些观潮点在某些年份不开放，以当地最新通知为准。',
      },
    },
    {
      say: 'If the water reaches you, hold on to something fixed, crouch down and protect your head.',
      zh: '如果被潮水打到，抓住固定的东西，蹲低，护住头。',
      more: {
        en: 'Call 110 for help. Only try to rescue someone if you can do it safely.',
        zh: '拨打 110 求救。只有在确保自身安全时才去救人。',
      },
    },
  ],
  safetySay: { en: 'Say it to a visitor', zh: '对外国朋友这样说' },
};
