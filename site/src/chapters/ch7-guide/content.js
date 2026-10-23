/**
 * ch7 content: viewpoints, audiences with sentence starters, vocabulary.
 * Facts here repeat ones verified elsewhere on the site (see NOTES.md and `sources` in index.js).
 */

export const VOCAB = [
  {
    id: 'guide-landmark',
    en: 'landmark',
    zh: '地标',
    pinyin: 'dìbiāo',
    def: { en: 'A building or place that is easy to see and helps people know where they are.', zh: '显眼、能帮人辨认方位的建筑或地点。' },
    example: { en: 'For boats on the river, the pagoda was a landmark day and night.', zh: '对江上的船来说，这座塔日夜都是地标。' },
  },
  {
    id: 'guide-viewpoint',
    en: 'viewpoint',
    zh: '观景点；视角',
    pinyin: 'guānjǐngdiǎn; shìjiǎo',
    def: { en: 'A place from which you look at something; also a way of thinking about it.', zh: '观看某物的位置；也指看问题的角度。' },
    example: { en: 'From this viewpoint you can see the pagoda and the bridge together.', zh: '从这个观景点能同时看到塔和桥。' },
  },
  {
    id: 'guide-octagonal',
    en: 'octagonal',
    zh: '八角形的',
    pinyin: 'bājiǎoxíng de',
    def: { en: 'Having eight sides and eight angles.', zh: '有八条边、八个角的。' },
    example: { en: 'The pagoda is octagonal, so every eave has eight corners.', zh: '塔是八角形的，所以每层檐都有八个翼角。' },
  },
  {
    id: 'guide-eaves',
    en: 'eaves',
    zh: '屋檐',
    pinyin: 'wūyán',
    def: { en: 'The edges of a roof that stick out beyond the wall.', zh: '屋顶伸出墙外的边缘部分。' },
    example: { en: 'Bells hang from the corners of the eaves.', zh: '檐角挂着风铃。' },
  },
  {
    id: 'guide-tidal-bore',
    en: 'tidal bore',
    zh: '涌潮',
    pinyin: 'yǒngcháo',
    def: { en: 'A wall of water that travels up a river against the current when the tide comes in.', zh: '涨潮时逆着水流向上游推进的一道水墙。' },
    example: { en: 'Surfers call the Qiantang tidal bore the Silver Dragon.', zh: '冲浪者把钱塘江涌潮叫作“银龙”。' },
  },
  {
    id: 'guide-dynasty',
    en: 'dynasty',
    zh: '朝代',
    pinyin: 'cháodài',
    def: { en: 'A period of history when one family ruled a country.', zh: '由同一家族统治国家的一段历史时期。' },
    example: { en: 'The brick body dates from the Southern Song dynasty.', zh: '砖砌塔身建于南宋。' },
  },
  {
    id: 'guide-restoration',
    en: 'restoration',
    zh: '修复；修缮',
    pinyin: 'xiūfù; xiūshàn',
    def: { en: 'Repairing an old building so that it looks and works as it once did.', zh: '修理古建筑，使它恢复原来的样子和功能。' },
    example: { en: 'Each restoration left its own layer on the pagoda.', zh: '每一次修缮都在塔上留下了自己的一层。' },
  },
  {
    id: 'guide-heritage',
    en: 'heritage',
    zh: '遗产',
    pinyin: 'yíchǎn',
    def: { en: 'Buildings, traditions and stories passed down from the past that a community wants to keep.', zh: '从过去传下来、一个群体希望保存的建筑、传统和故事。' },
    example: { en: 'The pagoda and the tide are part of Hangzhou’s heritage.', zh: '塔和潮都是杭州遗产的一部分。' },
  },
  {
    id: 'guide-overlook',
    en: 'overlook',
    zh: '俯瞰',
    pinyin: 'fǔkàn',
    def: { en: 'To stand above a place and look down on it.', zh: '从高处往下看。' },
    example: { en: 'The pagoda overlooks the Qiantang River.', zh: '六和塔俯瞰着钱塘江。' },
  },
  {
    id: 'guide-filler',
    en: 'filler word',
    zh: '口头填充词',
    pinyin: 'kǒutóu tiánchōngcí',
    def: { en: 'A word like “um”, “uh” or “you know” that fills a pause but adds no meaning.', zh: '像 um、uh、you know 这样只填补停顿、没有实际意义的词。' },
    example: { en: 'A short silence sounds better than a filler word.', zh: '短暂的停顿比口头填充词好听。' },
  },
];

/**
 * Camera viewpoints. Positions in metres (pagoda at the origin, river to the south, +Z).
 * `cam` y may be null: then it is placed `lift` metres above the terrain.
 */
export const VIEWS = [
  {
    id: 'river',
    label: { en: 'From the river', zh: '江上' },
    cam: [85, -3.6, 245],
    target: [0, 27, 0],
    fov: 32,
    see: {
      en: 'You are on a boat on the Qiantang, looking north. The pagoda rises above the trees on Yuelun Hill, almost 60 metres tall.',
      zh: '你在钱塘江的船上，面朝北。六和塔立在月轮山的树丛之上，将近60米高。',
    },
    points: [
      { en: 'Thirteen layers of eaves outside, but only seven floors inside.', zh: '外面十三层檐，里面只有七层。' },
      { en: 'The first pagoda here was built in 970 by the monk Zhijue, to calm the tide.', zh: '970年，智觉禅师在这里建起第一座塔，为的是镇潮。' },
      { en: 'A lamp at the top once guided boats at night.', zh: '塔顶曾经点灯，为夜里行船的人指路。' },
    ],
    sample: 'Look up at the hill. That tower is Liuhe Pagoda. More than a thousand years ago, a monk built the first pagoda here to calm this very river.',
    caption: 'Liuhe Pagoda from the Qiantang: built to calm the tide, and still watching it.',
  },
  {
    id: 'bridge',
    label: { en: 'From the bridge', zh: '桥上' },
    cam: [417, 20, 165],
    target: [0, 27, 0],
    fov: 18,
    see: {
      en: 'You are on the upper deck of the Qiantang River Bridge, just east of the pagoda, looking west up the river.',
      zh: '你站在钱塘江大桥的上层桥面，就在塔的东边，朝西望向上游。',
    },
    points: [
      { en: 'The bridge opened in 1937. It was designed by the engineer Mao Yisheng: the first double-deck road-and-rail bridge designed and built by Chinese engineers.', zh: '大桥1937年通车，由茅以升主持设计，是中国人自己设计建造的第一座公路铁路两用双层桥。' },
      { en: 'In December 1937, only months after it opened, it was blown up to slow the Japanese advance. It was repaired after the war.', zh: '1937年12月，通车才几个月，为阻断日军南下，大桥被炸毁，战后修复。' },
      { en: 'An ancient pagoda and a modern bridge: two ways of living with the same river.', zh: '一座古塔，一座现代大桥：与同一条江相处的两种方式。' },
    ],
    sample: 'Look west, up the river. That tower on the hill is Liuhe Pagoda. The first pagoda there was built almost a thousand years before this bridge.',
    caption: 'Two ways to meet a river: an ancient pagoda and the 1937 Qiantang River Bridge.',
  },
  {
    id: 'foot',
    label: { en: 'At the foot of the pagoda', zh: '塔下' },
    cam: [19, 1.6, 33],
    target: [0, 26, 0],
    fov: 58,
    see: {
      en: 'You are standing at the foot of the pagoda, looking up through the eaves. The wooden outside is a later addition; inside it is a brick tower.',
      zh: '你站在塔脚下，抬头穿过层层屋檐往上看。外面的木结构是后来加的，里面是一座砖塔。',
    },
    points: [
      { en: 'The brick body dates from the Southern Song rebuilding (sources give 1152, or 1156 to 1165). The timber eaves were added in the late Qing dynasty, in the Guangxu reign.', zh: '砖砌塔身是南宋重建的（资料记载为1152年，也有说1156年动工、1165年完工），木檐是清代光绪年间加建的。' },
      { en: 'The plan is octagonal: every eave has eight corners, and bells hang from them.', zh: '平面是八角形，每层檐有八个翼角，角上挂着铃。' },
      { en: 'The finial at the very top dates from the Yuan dynasty.', zh: '最顶上的塔刹是元代的。' },
    ],
    sample: 'Stand here and look straight up. Count the roofs: there are thirteen. But if you climb inside, you will only find seven floors.',
    caption: 'Thirteen roofs outside, seven floors inside. Count them yourself!',
  },
  {
    id: 'hill',
    label: { en: 'From Yuelun Hill', zh: '月轮山上' },
    cam: [-30, null, -120],
    lift: 24,
    target: [110, 4, 300],
    fov: 50,
    see: {
      en: 'You are on Yuelun Hill behind the pagoda, looking south over its roofs to the river, with the bridge on the left.',
      zh: '你在塔后的月轮山上，越过塔顶往南看，江在前方，大桥在左手边。',
    },
    points: [
      { en: 'Zhejiang University’s Zhijiang campus is on this hill, in the old buildings of Hangchow (Zhijiang) University.', zh: '浙江大学之江校区就在这座山上，用的是之江大学的老建筑。' },
      { en: 'In old texts the Qiantang is called the Zhe River (浙江), and the province is named after it. Its zigzag course also earned it the name Zhijiang, “the river shaped like 之”.', zh: '钱塘江古称“浙江”，浙江省由此得名；江道曲折如“之”字，又叫“之江”。' },
      { en: 'In the Song dynasty, crowds gathered on these banks to watch the autumn tide.', zh: '宋代，每到秋潮，人们成群结队到这一带江岸观潮。' },
    ],
    sample: 'From up here you can see the whole story: the hill, the pagoda, the river that gave Zhejiang its name, and the bridge that crossed it.',
    caption: 'The view from Yuelun Hill: pagoda, river and bridge, Hangzhou’s story in one frame.',
  },
];

export const FREE_VIEW = {
  id: 'free',
  label: { en: 'Look around freely', zh: '自由观看' },
  see: {
    en: 'Drag to turn the view, and scroll or pinch to zoom. Find your own angle for the postcard.',
    zh: '拖动可以转动视角，滚轮或双指缩放。为明信片找一个你自己的角度。',
  },
  points: [],
  sample: 'Greetings from Liuhe Pagoda, where the tide turns.',
  caption: 'Greetings from Liuhe Pagoda, where the tide turns.',
};

export const LIGHTS = [
  { value: 'day', label: { en: 'Day', zh: '白天' } },
  { value: 'dusk', label: { en: 'Dusk', zh: '黄昏' } },
  { value: 'night', label: { en: 'Night, lamp lit', zh: '夜晚点灯' } },
];

export const MOVES = [
  { id: 'open', label: { en: 'Open', zh: '开场' }, hint: { en: 'Greet them and say where you are.', zh: '打招呼，说明你们在哪里。' } },
  { id: 'describe', label: { en: 'Describe', zh: '描述' }, hint: { en: 'Point at what they can see.', zh: '指给他们看眼前的东西。' } },
  { id: 'explain', label: { en: 'Explain', zh: '讲解' }, hint: { en: 'One story or one fact, told well.', zh: '讲好一个故事或一个事实。' } },
  { id: 'connect', label: { en: 'Connect', zh: '拉近' }, hint: { en: 'Link it to their life.', zh: '和听众自己的经验联系起来。' } },
  { id: 'close', label: { en: 'Close', zh: '收尾' }, hint: { en: 'Leave them with a question, a tip or a smile.', zh: '留下一个问题、一个建议或一个微笑。' } },
];

export const AUDIENCES = [
  {
    id: 'child',
    label: { en: 'A 10-year-old', zh: '一个10岁的孩子' },
    tips: {
      en: 'Keep sentences short (under 12 words). Ask questions. Compare sizes with things a child knows. Tell it as a story.',
      zh: '句子要短（不超过12个词），多提问，用孩子熟悉的东西来比大小，把它讲成一个故事。',
    },
    maxSentence: 12,
    targets: ['guide-landmark', 'guide-tidal-bore', 'guide-eaves'],
    starters: {
      open: [
        { en: 'Hi! Do you want to hear a secret about this tower?', zh: '嗨！想听听这座塔的一个秘密吗？' },
        { en: 'Look up! Can you count the roofs with me?', zh: '抬头看！跟我一起数数有几层屋檐？' },
      ],
      describe: [
        { en: 'It’s almost 60 metres tall, as tall as a 20-storey building.', zh: '它差不多60米高，跟一栋20层的楼一样高。' },
        { en: 'It has eight sides, just like a stop sign.', zh: '它有八条边，就像“停车让行”的标志牌。' },
      ],
      explain: [
        { en: 'A long, long time ago, people were scared of the big waves in this river.', zh: '很久很久以前，人们很害怕这条江里的大浪。' },
        { en: 'So a monk built a tower here to calm the water.', zh: '于是一位和尚在这里建了一座塔，希望让江水平静下来。' },
      ],
      connect: [
        { en: 'Have you ever seen a wave as tall as a house?', zh: '你见过像房子一样高的浪吗？' },
        { en: 'Imagine you are a sailor at night, looking for the light at the top.', zh: '想象你是夜里行船的水手，正在找塔顶的灯光。' },
      ],
      close: [
        { en: 'Next time you come, listen. Can you hear the tide?', zh: '下次来的时候仔细听，你能听见潮声吗？' },
        { en: 'So, what would you name this tower?', zh: '那么，你会给这座塔起什么名字？' },
      ],
    },
    phrases: ['as tall as …', 'a long, long time ago', 'Guess what?', 'Imagine …', 'Can you see …?', 'Isn’t that amazing?'],
  },
  {
    id: 'architect',
    label: { en: 'An architecture student', zh: '一位建筑系学生' },
    tips: {
      en: 'Use precise terms and dates. Say which part comes from which period. Admit uncertainty: “Sources give …”.',
      zh: '用准确的术语和年代，说清楚哪部分属于哪个时期。资料有分歧就直说：“资料记载……”。',
    },
    maxSentence: 22,
    targets: ['guide-octagonal', 'guide-eaves', 'guide-dynasty', 'guide-restoration'],
    starters: {
      open: [
        { en: 'Welcome to Liuhe Pagoda, one of China’s first national heritage sites, listed in 1961.', zh: '欢迎来到六和塔，1961年列入第一批全国重点文物保护单位。' },
        { en: 'Let’s start with the plan: the pagoda is octagonal.', zh: '先从平面说起：塔是八角形的。' },
      ],
      describe: [
        { en: 'From outside you see thirteen eaves, but inside there are only seven storeys.', zh: '从外面看有十三层檐，里面却只有七层。' },
        { en: 'What you see is a timber exterior wrapped around a brick body.', zh: '你看到的是包在砖砌塔身外面的一层木结构外檐。' },
      ],
      explain: [
        { en: 'The brick body is Southern Song; the timber eaves were added in the late Qing dynasty, in the Guangxu reign.', zh: '砖塔身是南宋的，木檐是清代光绪年间加建的。' },
        { en: 'The finial on top dates from the Yuan dynasty.', zh: '塔顶的塔刹是元代的。' },
      ],
      connect: [
        { en: 'Notice how each eave is a little narrower than the one below it.', zh: '注意每一层檐都比下面一层略窄。' },
        { en: 'Compare the proportions with other Song pagodas you have studied.', zh: '可以把它的比例和你学过的其他宋代塔对比一下。' },
      ],
      close: [
        { en: 'If you go inside, look for the brick carvings on the sumeru bases.', zh: '如果进塔，留意须弥座上的砖雕。' },
        { en: 'Any questions about the structure?', zh: '关于结构，还有什么问题吗？' },
      ],
    },
    phrases: ['in plan', 'dates from …', 'was added later', 'a brick core', 'load-bearing', 'narrows towards the top'],
  },
  {
    id: 'surfer',
    label: { en: 'A foreign surfer', zh: '一位外国冲浪者' },
    tips: {
      en: 'Start from what they love: the wave. Explain Chinese names in plain words. Give one practical tip and one safety tip.',
      zh: '从对方热爱的东西（浪）讲起；用大白话解释中文名字；给一个实用建议和一个安全提醒。',
    },
    maxSentence: 18,
    targets: ['guide-tidal-bore', 'guide-landmark', 'guide-heritage', 'guide-viewpoint'],
    starters: {
      open: [
        { en: 'Welcome! You came for the Silver Dragon, right? This is its river.', zh: '欢迎！你是冲着“银龙”来的吧？这就是它的江。' },
        { en: 'Before you paddle out, let me tell you about this tower.', zh: '下水之前，先给你讲讲这座塔。' },
      ],
      describe: [
        { en: 'That’s Liuhe Pagoda, the Pagoda of Six Harmonies.', zh: '那是六和塔。' },
        { en: 'Locals have watched the tide from these banks for more than a thousand years.', zh: '一千多年来，本地人一直在这一带的江岸观潮。' },
      ],
      explain: [
        { en: 'It was built to calm the tide, so in a way it’s the opposite of what you’re here for!', zh: '它是为了镇住潮水而建的，跟你来这儿的目的正好相反！' },
        { en: 'In Chinese, people who ride the tide are called nongchao’er, “tide-players”.', zh: '中文把迎潮搏浪的人叫“弄潮儿”。' },
      ],
      connect: [
        { en: 'The biggest tides come around the 18th day of the eighth lunar month, usually in September or October.', zh: '最大的潮出现在农历八月十八前后，一般在公历九月或十月。' },
        { en: 'Big tides also come every month, a few days after each new and full moon.', zh: '其实每个月朔、望之后的几天也有大潮。' },
      ],
      close: [
        { en: 'Please stay behind the barriers when you watch: the tide can surge over the bank without warning.', zh: '观潮时请待在护栏后面：潮水可能毫无预兆地漫上岸。' },
        { en: 'Enjoy the ride, and say hi to the dragon for me.', zh: '玩得开心，替我向银龙问声好。' },
      ],
    },
    phrases: ['Locals call it …', 'It’s said that …', 'Watch out for …', 'If you’re lucky, …', 'The best time to come is …', 'It means something like …'],
  },
];

export const FILLERS = ['um', 'umm', 'uh', 'uhh', 'er', 'erm', 'ah', 'hmm', 'you know', 'i mean', 'kind of', 'sort of', 'basically', 'actually', 'literally'];
