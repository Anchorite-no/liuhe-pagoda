/**
 * ch6 text. Every visible string is an { en, zh } pair.
 */

export const VOCAB = [
  {
    id: 'world-tidal-bore',
    en: 'tidal bore',
    zh: '涌潮',
    pinyin: 'yǒngcháo',
    def: {
      en: 'A wave or step of water that travels up a river against the current when a strong tide comes in.',
      zh: '大潮涨潮时，逆着河水向上游推进的一道潮头或水墙。',
    },
    example: { en: 'More than 400 estuaries around the world have a tidal bore.', zh: '全世界有 400 多个河口会出现涌潮。' },
  },
  {
    id: 'world-tidal-range',
    en: 'tidal range',
    zh: '潮差',
    pinyin: 'cháochā',
    def: {
      en: 'The difference in height between high tide and low tide.',
      zh: '高潮和低潮之间的水位差。',
    },
    example: { en: 'At Ganpu the tidal range can reach almost 9 m.', zh: '澉浦的潮差最大接近 9 米。' },
  },
  {
    id: 'world-equinox',
    en: 'equinox',
    zh: '春分；秋分（二分点）',
    pinyin: 'chūnfēn; qiūfēn',
    def: {
      en: 'One of the two days a year, in March and September, when day and night are about the same length.',
      zh: '一年中昼夜几乎等长的两天，在 3 月和 9 月。',
    },
    example: { en: 'The Severn bore is biggest around the equinoxes.', zh: '塞文河涌潮在春分、秋分前后最大。' },
  },
  {
    id: 'world-dredging',
    en: 'dredging',
    zh: '疏浚',
    pinyin: 'shūjùn',
    def: {
      en: 'Digging mud and sand out of the bottom of a river or harbour so that ships can pass.',
      zh: '挖掉河底或港口底部的泥沙，让船只能够通行。',
    },
    example: { en: 'Dredging changed the Seine estuary and the mascaret almost disappeared.', zh: '疏浚改变了塞纳河口，那里的涌潮几乎消失了。' },
  },
  {
    id: 'world-causeway',
    en: 'causeway',
    zh: '堤道',
    pinyin: 'dīdào',
    def: {
      en: 'A raised road or embankment built across water or wet ground.',
      zh: '横跨水面或湿地修筑的高出地面的道路或堤坝。',
    },
    example: { en: 'A 1968 causeway shrank the Petitcodiac bore to a ripple.', zh: '1968 年修的堤道让佩蒂科迪亚克河的涌潮缩成了小波纹。' },
  },
  {
    id: 'world-funnel-effect',
    en: 'funnel effect',
    zh: '喇叭口效应；漏斗效应',
    pinyin: 'lǎbakǒu xiàoyìng',
    def: {
      en: 'What happens when moving water is squeezed into a narrower space and has to rise or speed up.',
      zh: '流动的水被挤进越来越窄的空间，只能抬高或加速。',
    },
    example: { en: 'Hangzhou Bay’s funnel effect makes the tide pile up.', zh: '杭州湾的喇叭口效应让潮水越堆越高。' },
  },
  {
    id: 'world-river-surfing',
    en: 'river surfing',
    zh: '河流冲浪',
    pinyin: 'héliú chōnglàng',
    def: {
      en: 'Surfing on a wave in a river, such as a tidal bore, instead of on the sea.',
      zh: '在河里的浪上冲浪（比如涌潮），而不是在海上。',
    },
    example: { en: 'The Severn is often called the birthplace of river surfing.', zh: '塞文河常被称为“河流冲浪的发源地”。' },
  },
  {
    id: 'world-nickname',
    en: 'nickname',
    zh: '绰号；昵称',
    pinyin: 'chuòhào; nìchēng',
    def: {
      en: 'An informal name people use instead of the official one.',
      zh: '人们在正式名称之外用的非正式叫法。',
    },
    example: { en: 'Surfers gave the Qiantang bore the nickname “Silver Dragon”.', zh: '冲浪者给钱塘江涌潮起了个绰号，叫“银龙”。' },
  },
  {
    id: 'world-undular-bore',
    en: 'undular bore',
    zh: '波状涌潮',
    pinyin: 'bōzhuàng yǒngcháo',
    def: {
      en: 'A gentle bore made of a train of smooth waves, without a breaking white front.',
      zh: '由一串平缓的波组成、前锋不破碎翻白的涌潮。',
    },
    example: { en: 'A weak bore is often undular; a strong one breaks into a wall of foam.', zh: '弱的涌潮常常是波状的；强的涌潮前锋会破碎成一道白色水墙。' },
  },
];

export const T = {
  title: { en: 'The Silver Dragon Meets the World', zh: '银龙与世界' },
  lede: {
    en: 'The Qiantang bore is not the only wave that runs uphill. Spin the globe, meet its cousins, and find the words to describe it to someone who has never seen it.',
    zh: '会“逆流而上”的潮，不止钱塘江一处。转动地球，认识它在世界各地的“亲戚”，再学着用英语把它讲给没见过的人听。',
  },
  intro: {
    en: [
      'A {bore} forms where a big tide meets a river mouth of the right shape. More than 400 estuaries on every continent except Antarctica have one, but only a few are big enough to be famous. Press a marker to visit one.',
    ],
    zh: [
      '大潮遇上形状合适的河口，就会形成{bore}。除了南极洲，各大洲共有 400 多个河口出现过涌潮，但够得上“有名”的只有少数几个。点一下地球上的标记去看看。',
    ],
  },
  globeLabel: { en: 'Globe with markers for notable tidal bores', zh: '标出著名涌潮的地球' },
  globeNote: {
    en: 'Coastlines: Natural Earth (public domain), drawn as dots.',
    zh: '海岸线：Natural Earth（公共领域数据），以点阵表示。',
  },
  hint: { en: 'Drag to spin the globe', zh: '拖动可以转动地球' },
  listHead: { en: 'Seven famous bores', zh: '七处有名的涌潮' },
  listIntro: { en: 'Choose one to open its card, or press a marker on the globe.', zh: '选一处打开卡片，也可以直接点地球上的标记。' },
  backToList: { en: 'All bores', zh: '全部涌潮' },
  compareThis: { en: 'Compare this one', zh: '拿它来比较' },
  labels: {
    local: { en: 'Local name', zh: '当地叫法' },
    where: { en: 'Where', zh: '地点' },
    height: { en: 'Height', zh: '高度' },
    speed: { en: 'Speed and reach', zh: '速度与范围' },
    season: { en: 'When', zh: '时间' },
    status: { en: 'Today', zh: '现状' },
  },

  funnelHead: { en: 'Why Hangzhou Bay makes a dragon', zh: '杭州湾为什么能“养”出一条龙' },
  funnel: {
    en: [
      'Hubert Chanson, an engineer at the University of Queensland who has spent years studying tidal bores, lists two conditions: a large {range} and a river mouth that is wide, flat and narrows inland. Hangzhou Bay has both.',
      'Its mouth is about 100 km wide, between Nanhui and Zhenhai. By Yanguan, 130 km upstream, the river is only about 2.5 km across. Above Ganpu the bed rises sharply, so the water gets shallow. The rising tide is squeezed sideways and from below. That is the {funnel}: the water piles up, the front of the tide steepens, and it becomes a moving step of water.',
      'Reflection along the coast also matters. At Ganpu the tidal range is more than twice as large as at the bay mouth, reaching 8.93 m.',
    ],
    zh: [
      '澳大利亚昆士兰大学的工程师休伯特·尚松（Hubert Chanson）研究涌潮多年。他总结了两个条件：{range}要大，河口要宽、要平，而且越往里越窄。杭州湾两样都占了。',
      '杭州湾口从南汇咀到镇海宽约 100 公里；到上游 130 多公里的盐官，江面只剩 2.5 公里左右。澉浦以上江底急剧抬高，水变浅了。涨潮的海水两边被挤、底下被托，这就是{funnel}：水越堆越高，潮头越来越陡，最后变成一道向前推进的“水台阶”。',
      '海岸对潮波的反射也起了作用：澉浦的潮差比湾口大一倍多，最大达到 8.93 米。',
    ],
  },
  funnelFig: {
    plan: { en: 'Seen from above', zh: '俯视' },
    section: { en: 'Seen from the side', zh: '侧视' },
    mouth: { en: 'mouth ≈ 100 km', zh: '湾口约 100 公里' },
    yanguan: { en: 'Yanguan ≈ 2.5 km', zh: '盐官约 2.5 公里' },
    tide: { en: 'rising tide', zh: '涨潮' },
    bar: { en: 'the bed rises above Ganpu', zh: '澉浦以上江底抬高' },
    sea: { en: 'sea', zh: '海' },
    river: { en: 'river', zh: '江' },
    caption: { en: 'Schematic, not to scale', zh: '示意图，不按比例' },
    alt: {
      en: 'Diagram: Hangzhou Bay narrows from about 100 km at the mouth to about 2.5 km at Yanguan, and the river bed rises above Ganpu, so the incoming tide is squeezed and steepens into a bore.',
      zh: '示意图：杭州湾从湾口约 100 公里收窄到盐官约 2.5 公里，澉浦以上江底抬高，涨潮的海水被挤压，潮头变陡，形成涌潮。',
    },
  },

  compareHead: { en: 'Compare two bores', zh: '比一比两处涌潮' },
  compareIntro: {
    en: 'Both waves are drawn to the same scale, next to a person 1.7 m tall. The shaded band shows the range the sources give; dashed lines mark records or reports.',
    zh: '两道潮按同一比例画出，旁边站着一个 1.7 米高的人作参照。阴影带是资料给出的高度范围，虚线是纪录或历史记载。',
  },
  compareA: { en: 'First bore', zh: '第一处' },
  compareB: { en: 'Second bore', zh: '第二处' },
  showHigh: { en: 'Draw the upper value', zh: '按上限画' },
  showLow: { en: 'Draw the lower value', zh: '按下限画' },
  noBoreToday: { en: 'No regular bore today: the dashed line is a historical report.', zh: '今天已经没有稳定的涌潮，虚线是历史记载。' },
  person: { en: '1.7 m person', zh: '1.7 米的人' },
  metres: { en: '{n} m', zh: '{n} 米' },
  profileAlt: { en: '{name}: {height}', zh: '{name}：{height}' },

  surfHead: { en: 'Surfing the Silver Dragon', zh: '冲浪者眼里的“银龙”' },
  surfIntro: {
    en: 'To international surfers, the Qiantang bore has a {nickname}: the Silver Dragon. Unlike a sea wave, it does not break on a beach. It keeps rolling upriver, so one ride can last for many minutes.',
    zh: '在国际冲浪圈，钱塘江涌潮有个{nickname}：“银龙”（Silver Dragon）。它不像海浪那样拍上沙滩就没了，而是一路往上游推进，所以一次能冲很久。',
  },
  surfEvents: [
    {
      year: '2014',
      en: 'NPR reported on the Red Bull Qiantang Shoot Out in September 2014. Surfers came from as far away as Southern California to ride a wave the headline put at about 10 feet (3 m). Hawaiian surfer Jamie O’Brien and a teammate won. He told NPR that boats, piers and pilings made it nothing like an ocean wave.',
      zh: '2014 年 9 月，美国全国公共广播电台（NPR）报道了“红牛钱塘江冲浪赛”。冲浪者从美国南加州等地远道而来，报道标题说浪高约 10 英尺（约 3 米）。夏威夷冲浪手杰米·奥布莱恩和队友夺冠。他对 NPR 说，江上有船、码头和桩子，和海浪完全不一样。',
    },
    {
      year: '2019',
      en: 'At the 2019 Silver Dragon Shootout, 18 surfers in 9 teams competed for a US$15,000 prize pool. The judges could not separate the best two teams and declared a draw between France and South Africa.',
      zh: '2019 年的“银龙冲浪赛”（Silver Dragon Shootout）有 9 支队伍、18 名冲浪者参赛，奖金池 1.5 万美元。评委分不出最好的两队高下，最后判法国队和南非队并列第一。',
    },
  ],
  safety: {
    en: 'The bore is dangerous to watch from the wrong place: it can jump sea walls, and people have died on the bank. Chapter 3 has the full tide-watching safety guide.',
    zh: '在不该站的地方看潮很危险：潮水会翻上海塘，岸上也出过人命。完整的观潮安全指南在第三章。',
  },
  safetyLink: { en: 'Read the safety guide in Chapter 3', zh: '去看第三章的观潮安全指南' },

  describeHead: { en: 'Describe it to a foreign friend', zh: '讲给外国朋友听' },
  describePrompt: {
    en: 'A friend from abroad asks: “What is this Silver Dragon everyone talks about?” Write three or four sentences. Say what it is, what it looks and sounds like, and why it happens.',
    zh: '一位外国朋友问你：“大家说的‘银龙’到底是什么？”用英语写三四句话：它是什么，看上去、听上去什么样，为什么会出现。',
  },
  describeLabel: { en: 'Your description (only you can see this)', zh: '你的描述（只有你自己能看到）' },
  phrasesHead: { en: 'Useful phrases', zh: '可以用上的说法' },
  phrases: [
    { en: 'a wall of water', zh: '一堵水墙' },
    { en: 'a low rumble, like distant thunder', zh: '低沉的轰鸣，像远处的雷声' },
    { en: 'a white line on the horizon', zh: '天边的一道白线' },
    { en: 'rushes upstream against the current', zh: '逆着水流冲向上游' },
    { en: 'the bay narrows like a funnel', zh: '海湾像漏斗一样收窄' },
    { en: 'it comes twice a month, with the spring tides', zh: '每月大潮时来两次' },
  ],
  showModels: { en: 'Show model answers', zh: '看参考答案' },
  hideModels: { en: 'Hide model answers', zh: '收起参考答案' },
  hear: { en: 'Hear it', zh: '听一听' },
  models: [
    {
      tag: { en: 'Simple', zh: '简单版' },
      en: 'It’s a huge wave that rushes up the Qiantang River from the sea. Surfers call it the Silver Dragon.',
      zh: '这是一道从海上冲进钱塘江的大浪。冲浪的人叫它“银龙”。',
    },
    {
      tag: { en: 'Vivid', zh: '生动版' },
      en: 'First you hear a low rumble, like distant thunder. Then a white line appears on the horizon and races towards you, and suddenly the whole river is moving the wrong way.',
      zh: '先是听到低沉的轰鸣，像远处的雷声；接着天边出现一道白线，朝你飞奔过来，突然之间，整条江都在倒着流。',
    },
    {
      tag: { en: 'Explaining', zh: '解释版' },
      en: 'Hangzhou Bay is shaped like a funnel. When a big tide comes in, the water is squeezed into a narrower and shallower channel, so it piles up into a moving wall.',
      zh: '杭州湾的形状像个漏斗。大潮涌进来时，海水被挤进越来越窄、越来越浅的江道，只好堆成一堵向前推进的水墙。',
    },
    {
      tag: { en: 'Comparing', zh: '比较版' },
      en: 'It’s China’s best-known tidal bore, a cousin of the pororoca on the Amazon and the Severn bore in England, and it is often called the biggest in the world.',
      zh: '它是中国最有名的涌潮，和亚马孙河的“波罗罗卡”、英国的塞文河涌潮算是“亲戚”，常被称为世界上最大的涌潮。',
    },
  ],

  quizHead: { en: 'Five quick questions', zh: '五道小题' },
  quizIntro: { en: 'Choose an answer to see the explanation.', zh: '选一个答案，就能看到解析。' },
  quizScore: { en: 'You got {n} of 5.', zh: '答对 {n} / 5 题。' },
  quizRetry: { en: 'Try the quiz again', zh: '重新做一遍' },
  quizRight: { en: 'Right.', zh: '答对了。' },
  quizWrong: { en: 'Not quite.', zh: '不太对。' },
  quiz: [
    {
      q: { en: 'Which river’s bore is called the pororoca?', zh: '哪条河的涌潮叫“波罗罗卡”（pororoca）？' },
      options: [
        { en: 'The Amazon, in Brazil', zh: '巴西的亚马孙河' },
        { en: 'The Severn, in England', zh: '英国的塞文河' },
        { en: 'The Seine, in France', zh: '法国的塞纳河' },
        { en: 'The Hooghly, in India', zh: '印度的胡格利河' },
      ],
      answer: 0,
      explain: {
        en: 'Pororoca is the Brazilian name for the bore at the mouth of the Amazon. The word may come from Tupi, meaning something like “great roar”.',
        zh: 'pororoca 是巴西人对亚马孙河口涌潮的叫法，可能来自图皮语，意思大约是“大轰鸣”。',
      },
    },
    {
      q: { en: 'Why is the Qiantang bore so strong?', zh: '钱塘江涌潮为什么这么强？' },
      options: [
        { en: 'Strong winds from the Pacific push the water inland', zh: '太平洋上的大风把海水吹进来' },
        { en: 'Hangzhou Bay narrows like a funnel and the river bed gets shallow', zh: '杭州湾像漏斗一样收窄，江底又变浅' },
        { en: 'Dams upstream release water at high tide', zh: '上游水库在涨潮时放水' },
        { en: 'The river is unusually deep near Hangzhou', zh: '杭州附近的江水特别深' },
      ],
      answer: 1,
      explain: {
        en: 'A big tidal range plus the funnel shape: about 100 km wide at the mouth, about 2.5 km at Yanguan, with a rising bed above Ganpu. The tide is squeezed until its front becomes a wall.',
        zh: '潮差大，再加上喇叭口地形：湾口约 100 公里，到盐官只有约 2.5 公里，澉浦以上江底又抬高。潮水被一路挤压，潮头就成了一堵墙。',
      },
    },
    {
      q: { en: 'Which famous bore almost disappeared after dredging and river works in the 1960s?', zh: '哪处有名的涌潮在 20 世纪 60 年代的疏浚和河道整治后几乎消失？' },
      options: [
        { en: 'The Batang Lupar benak', zh: '巴当鲁巴河的“贝纳”' },
        { en: 'The Qiantang bore', zh: '钱塘江涌潮' },
        { en: 'The Seine mascaret', zh: '塞纳河涌潮' },
        { en: 'The pororoca', zh: '亚马孙河的“波罗罗卡”' },
      ],
      answer: 2,
      explain: {
        en: 'Dredging and training works, including the Tancarville canal (1963), reshaped the Seine estuary. Only weak bores were seen after 1971.',
        zh: '疏浚和河道整治（包括 1963 年建成的坦卡维尔运河）改变了塞纳河口的形状，1971 年以后只见过很弱的涌潮。',
      },
    },
    {
      q: { en: 'What nickname do international surfers use for the Qiantang bore?', zh: '国际冲浪者给钱塘江涌潮起了什么绰号？' },
      options: [
        { en: 'The Golden Tiger', zh: '金虎' },
        { en: 'The Jade Snake', zh: '玉蛇' },
        { en: 'The White Horse', zh: '白马' },
        { en: 'The Silver Dragon', zh: '银龙' },
      ],
      answer: 3,
      explain: {
        en: 'The Silver Dragon. NPR used the name in its 2014 report, and a 2019 contest was called the Silver Dragon Shootout.',
        zh: '“银龙”。NPR 在 2014 年的报道里用了这个叫法，2019 年还有一场比赛就叫“银龙冲浪赛”。',
      },
    },
    {
      q: { en: 'Which bore started to come back after causeway gates were opened in 2010?', zh: '哪处涌潮在 2010 年堤道闸门打开以后开始恢复？' },
      options: [
        { en: 'The Petitcodiac, in Canada', zh: '加拿大的佩蒂科迪亚克河' },
        { en: 'The Severn, in England', zh: '英国的塞文河' },
        { en: 'The Hooghly, in India', zh: '印度的胡格利河' },
        { en: 'The Qiantang, in China', zh: '中国的钱塘江' },
      ],
      answer: 0,
      explain: {
        en: 'A 1968 causeway near Moncton shrank the Petitcodiac bore to a ripple. Since the gates were opened for good in April 2010, it has been growing again, and surfers rode it for 29 km in 2013.',
        zh: '1968 年蒙克顿附近修的堤道让佩蒂科迪亚克河涌潮缩成了小波纹。2010 年 4 月闸门永久打开后，涌潮逐渐恢复，2013 年冲浪者在这里冲了 29 公里。',
      },
    },
  ],
};

export const SOURCES = [
  {
    title: { en: 'NPR: Riding the “Silver Dragon,” surfers tame China’s 10-foot river waves (12 September 2014)', zh: 'NPR：驾驭“银龙”（2014 年 9 月 12 日）' },
    url: 'https://www.npr.org/sections/parallels/2014/09/12/347950272/riding-the-silver-dragon-surfers-tame-chinas-10-foot-river-waves',
  },
  {
    title: { en: 'Surfer Today: 2019 Silver Dragon Shootout (18 surfers, 9 teams, shared title)', zh: 'Surfer Today：2019 年银龙冲浪赛（9 队 18 人，并列冠军）' },
    url: 'https://www.surfertoday.com/surfing/france-and-south-africa-share-victory-at-2019-silver-dragon-shootout',
  },
  {
    title: { en: 'H. Chanson, Tidal bores (University of Queensland)', zh: 'H. Chanson：涌潮（昆士兰大学）' },
    url: 'https://staff.civil.uq.edu.au/h.chanson/tid_bore.html',
    note: { en: 'Conditions for a bore; Petitcodiac, Seine, Hooghly, Batang Lupar', zh: '涌潮形成条件；佩蒂科迪亚克河、塞纳河、胡格利河、巴当鲁巴河' },
  },
  {
    title: { en: 'H. Chanson, The tidal bore of the Seine (mascaret)', zh: 'H. Chanson：塞纳河涌潮' },
    url: 'https://staff.civil.uq.edu.au/h.chanson/mascaret.html',
    note: { en: 'Fronts up to 7.3 m in 19th-century reports; Tancarville canal 1963; last sightings 1971', zh: '19 世纪记录潮头达 7.3 米；1963 年坦卡维尔运河；最后记录 1971 年' },
  },
  {
    title: { en: 'H. Chanson (2011), Tidal Bores, Aegir, Eagre, Mascaret, Pororoca: Theory and Observations, World Scientific', zh: 'H. Chanson（2011）《涌潮：理论与观测》，World Scientific' },
    url: 'https://staff.civil.uq.edu.au/h.chanson/reprints/book16.htm',
  },
  {
    title: { en: 'Li, Pan, Chanson & Pan (2019), Real-time characteristics of tidal bore propagation in the Qiantang River Estuary, Continental Shelf Research', zh: 'Li、潘冬子、Chanson、潘存鸿（2019），钱塘江河口涌潮传播的雷达观测，《Continental Shelf Research》' },
    url: 'https://staff.civil.uq.edu.au/h.chanson/reprints/Li_et_al_csr_2019.pdf',
  },
  {
    title: { en: 'Kawanisi et al. (2017), Monitoring tidal bores using an acoustic tomography system, Journal of Coastal Research 33(1)', zh: 'Kawanisi 等（2017），用声层析系统监测涌潮，《Journal of Coastal Research》' },
    url: 'https://bioone.org/journals/journal-of-coastal-research/volume-33/issue-1/JCOASTRES-D-15-00172.1/Monitoring-Tidal-Bores-using-Acoustic-Tomography-System/10.2112/JCOASTRES-D-15-00172.1.full',
    note: { en: 'Qiantang bore 1.0–1.32 m high, 7.59–8.29 m/s', zh: '钱塘江潮头高 1.0～1.32 米，速度每秒 7.59～8.29 米' },
  },
  {
    title: { en: 'Hangzhou News: bay width, Yanguan width and bore height (29 September 2017)', zh: '杭州网：湾口宽度、盐官江面宽度与潮头高度（2017 年 9 月 29 日）' },
    url: 'https://hznews.hangzhou.com.cn/chengshi/content/2017-09/29/content_6675089_2.htm',
  },
  {
    title: { en: 'Advances in Science and Technology of Water Resources (Hohai University, 2003): tidal range at Ganpu up to 8.93 m', zh: '《水利水电科技进展》（河海大学，2003）：澉浦潮差最大 8.93 米' },
    url: 'https://jour.hhu.edu.cn/slsdkjjz/article/pdf/jz20030502',
  },
  {
    title: { en: 'People’s Daily: how many shapes can the Qiantang tide take? (18 September 2023)', zh: '人民日报：钱塘潮有多少种形态？（2023 年 9 月 18 日）' },
    url: 'https://paper.people.com.cn/rmrb/html/2023-09/18/nw.D110000renmrb_20230918_2-13.htm',
  },
  {
    title: { en: 'Tidal bore (Wikipedia), citing Chanson and Bartsch-Winkler & Lynch (1988)', zh: '涌潮（英文维基百科），引用 Chanson 与 Bartsch-Winkler & Lynch（1988）' },
    url: 'https://en.wikipedia.org/wiki/Tidal_bore',
    note: { en: 'Over 400 estuaries; Araguari bore lost since 2015', zh: '400 多个河口；阿拉瓜里河涌潮 2015 年后消失' },
  },
  { title: { en: 'Pororoca (Wikipedia)', zh: 'Pororoca（英文维基百科）' }, url: 'https://en.wikipedia.org/wiki/Pororoca' },
  { title: { en: 'Severn bore (Wikipedia)', zh: '塞文河涌潮（英文维基百科）' }, url: 'https://en.wikipedia.org/wiki/Severn_bore' },
  { title: { en: 'Petitcodiac River (Wikipedia)', zh: '佩蒂科迪亚克河（英文维基百科）' }, url: 'https://en.wikipedia.org/wiki/Petitcodiac_River' },
  {
    title: { en: 'Simanggang / Sri Aman (Wikipedia) and Sarawak Government event page for Pesta Benak', zh: '斯里阿曼（英文维基百科）与砂拉越州政府“涌潮节”页面' },
    url: 'https://en.wikipedia.org/wiki/Simanggang',
  },
  { title: { en: 'Sarawak Government: Pesta Benak', zh: '砂拉越州政府：涌潮节' }, url: 'https://sarawak.gov.my/web/home/event_view/1/72' },
  { title: { en: 'Surfer Today: The Benak, the Malaysian tidal bore', zh: 'Surfer Today：马来西亚涌潮“贝纳”' }, url: 'https://www.surfertoday.com/surfing/the-benak-the-renowned-malaysian-tidal-bore' },
  { title: { en: 'Hooghly River (Wikipedia)', zh: '胡格利河（英文维基百科）' }, url: 'https://en.wikipedia.org/wiki/Hooghly_River' },
  {
    title: { en: 'Encyclopaedia Britannica, 7th edition (1842): “Hoogly”, a rise of five feet at Calcutta', zh: '《不列颠百科全书》第 7 版（1842）“胡格利河”条：加尔各答潮水骤涨五英尺' },
    url: 'https://jimclifford.ca/early_encyclopedia_britannica/articles/1842/eb_7th_1842_009853.html',
  },
  {
    title: { en: 'Encyclopaedia Britannica: tidal bore (the popular “nearly 9 m” figure for the Qiantang)', zh: '《不列颠百科全书》：涌潮（钱塘江“近 9 米”的通俗说法）' },
    url: 'https://www.britannica.com/science/tidal-bore',
  },
  {
    title: { en: 'Natural Earth 1:110m land polygons (public domain), used for the dot globe', zh: 'Natural Earth 1:1.1 亿陆地数据（公共领域），用于点阵地球' },
    url: 'https://www.naturalearthdata.com/',
  },
];
