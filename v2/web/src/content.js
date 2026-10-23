/**
 * Everything the page says, in Chinese and English side by side (the site is for an English
 * course: every paragraph is shown in both languages). Six chapters; each step is one short
 * paragraph pair plus what the stage shows while it is read:
 *   { view: 'whole' | 'eave' | 'far' | 'open' | 'groups' | 'layers' | 'cut' | 'practice', labels }
 *     → the real-time model (viewer.js), with that camera and disassembly stage
 *   { image: 'media/…', video?, focus? } → a rendered picture; with video, a short path-traced loop
 *     (the picture is shown until the loop has loaded); focus is the object-position the crop
 *     centres on when the frame is narrower than the picture
 */

export const TITLE = {
  zh: '六和塔',
  en: 'The Pagoda of Six Harmonies',
  sub: { zh: '钱塘江边，看了一千年潮', en: 'A thousand years above the Qiantang tide' },
};

export const CHAPTERS = [
  {
    id: 'meet',
    title: { zh: '初见', en: 'First Sight' },
    steps: [
      {
        view: 'whole',
        zh: '杭州钱塘江北岸的月轮山上，立着一座八角形的高塔，这就是六和塔。它高约 60 米，从外面数，一共有十三层屋檐。',
        en: 'On Yuelun Hill, above the north bank of the Qiantang River in Hangzhou, stands an eight-sided tower: the Liuhe Pagoda, the Pagoda of Six Harmonies. It is about 60 metres tall, with thirteen eaves.',
      },
      {
        view: 'eave',
        labels: [
          { id: 'roof', match: ['T05', 'roof', 7], dx: 0.16, dy: -0.12 },
          { id: 'bracket', match: ['T05', 'bracket', 7], dx: 0.18, dy: 0.02 },
          { id: 'wall', match: ['T04', 'wall', 7], dx: 0.16, dy: 0.1 },
        ],
        hold: true,
        zh: '走近看，每层屋檐下都有一圈斗拱，檐角挂着铁铃，风一吹就响。暗红色的木板墙上，开着一排排小方窗。',
        en: 'Up close, a band of dougong brackets runs under every eave, and iron bells ring from the corners in the wind. The dark red plank walls are pierced by rows of small square windows.',
      },
      {
        view: 'brackets',
        labels: [{ id: 'bracket', match: ['T05', 'bracket', 7], dx: 0.16, dy: -0.1 }],
        hold: true,
        zh: '再凑近看斗拱：方形的木块叫“斗”，弓形的短木叫“拱”。一层斗、一层拱交错着叠上去，向外托住伸出的屋檐，再把它的重量一点点传给柱子。十三层外檐，就靠一圈又一圈这样的斗拱托着。',
        en: 'Closer still, the dougong: the square blocks are the dou, the bow-shaped arms the gong. Block on arm, arm on block, they reach out to hold up the overhanging eave and pass its weight down into the columns. All thirteen eaves rest on ring after ring of them.',
      },
      {
        view: 'far',
        zh: '1961 年，六和塔成为第一批全国重点文物保护单位。同一座山上就是浙江大学之江校区，塔下不远，是 1937 年通车的钱塘江大桥。',
        en: 'In 1961 it became one of China’s first national key monuments. Zhejiang University’s Zhijiang campus sits on the same hill, and the Qiantang River Bridge, opened in 1937, crosses the river just below.',
      },
    ],
    terms: [
      ['塔', 'pagoda'],
      ['屋檐', 'eave'],
      ['斗拱', 'dougong (bracket set)'],
    ],
  },
  {
    id: 'origin',
    title: { zh: '缘起', en: 'Why a Pagoda Here' },
    steps: [
      {
        image: 'media/tide.webp',
        video: 'media/tide.mp4',
        focus: '34% 50%', // keeps both the pagoda (left) and the sun (right) on a phone
        zh: '十世纪的杭州是吴越国的都城。钱塘江给这里带来富庶，也带来灾难：每逢大潮，海水倒灌，冲垮堤岸，淹没农田。',
        en: 'In the tenth century Hangzhou was the capital of the Wuyue kingdom. The river made it rich, and it brought disaster too: great tides surged inland, broke the banks and drowned the fields.',
      },
      {
        image: 'media/tide.webp',
        video: 'media/tide.mp4',
        focus: '34% 50%', // keeps both the pagoda (left) and the sun (right) on a phone
        zh: '公元 970 年，吴越王钱弘俶舍出月轮山上的果园，由智觉禅师延寿主持建塔，为的是“镇潮”。塔名里的“六和”，一般解释为佛教的“六和敬”。',
        en: 'In 970 King Qian Chu gave up his orchard on Yuelun Hill, and the Chan master Yanshou built a pagoda there to calm the tide. The “Liuhe” in its name is usually read as the Buddhist “six harmonies”.',
      },
      {
        image: 'media/night.webp',
        video: 'media/night.mp4',
        zh: '据旧时记载，塔顶还点着一盏明灯。夜里在江上行船的人，就看着这盏灯辨认方向。',
        en: 'Old records say a lamp burned at the top, and boatmen on the dark river steered by its light.',
      },
    ],
    terms: [
      ['镇潮', 'to calm the tide'],
      ['吴越国', 'the Wuyue kingdom'],
    ],
  },
  {
    id: 'dynasties',
    title: { zh: '一座塔，三个朝代', en: 'One Tower, Three Dynasties' },
    steps: [
      {
        view: 'open',
        labels: [
          { id: 'song', match: ['S3', 'shell', 7], dx: 0.22, dy: -0.1 },
          { id: 'yuan', match: 'Finial', dx: 0.14, dy: 0 },
          { id: 'qing', match: ['T06', 'wall', 7], dx: -0.16, dy: -0.04 },
        ],
        zh: '六和塔不是一次建成的。今天看到的，是三个朝代叠在一起：南宋的砖砌塔身，元代的铁塔刹，清代的木构外檐。',
        en: 'The pagoda was not built in one go. What stands today is three dynasties stacked together: a Southern Song brick body, a Yuan iron finial and Qing timber eaves.',
      },
      {
        view: 'open',
        labels: [
          { id: 'song', match: ['S3', 'shell', 7], dx: 0.22, dy: -0.1 },
          { id: 'yuan', match: 'Finial', dx: 0.14, dy: 0 },
          { id: 'qing', match: ['T06', 'wall', 7], dx: -0.16, dy: -0.04 },
        ],
        timeline: [
          ['970', { zh: '建塔，九级', en: 'Built, nine storeys' }],
          ['1121', { zh: '毁于兵火', en: 'Destroyed in war' }],
          ['1150s', { zh: '南宋重建砖塔身', en: 'Brick body rebuilt (Southern Song)' }],
          ['元 Yuan', { zh: '铸铁塔刹', en: 'Iron finial cast' }],
          ['1900', { zh: '清代重建十三层木檐', en: 'Thirteen timber eaves rebuilt (Qing)' }],
          ['1991', { zh: '大修，“整旧如旧”', en: 'Major repair: “repair the old as old”' }],
        ],
      },
    ],
    terms: [
      ['朝代', 'dynasty'],
      ['塔刹', 'finial'],
      ['重建', 'to rebuild'],
    ],
  },
  {
    id: 'apart',
    title: { zh: '拆开看', en: 'Take It Apart' },
    steps: [
      {
        view: 'groups',
        labels: [
          { id: 'ming', match: ['T04', 'wall', 7], dx: -0.16, dy: 0.06 },
          { id: 'an', match: ['T05', 'wall', 7], dx: -0.16, dy: -0.04 },
          { id: 'storey', match: ['S2', 'shell', 7], dx: 0.24, dy: -0.03 },
        ],
        zh: '外面十三层，里面却只能爬到第七层。把塔分成七组就明白了：每层砖塔身对应两层外檐，下面是开门通回廊的“明层”，上面是封闭的“暗层”。这叫“七明六暗”。',
        en: 'Thirteen eaves outside, yet the stairs stop at the seventh floor. Split the tower into seven groups and it makes sense: each brick storey carries two eaves, an open level with doors to the gallery and a sealed level above. Seven open, six sealed: “qi ming liu an”.',
      },
      {
        view: 'layers',
        labels: [
          { id: 'roof', match: ['T01', 'roof', 0], dx: 0.12, dy: -0.06 },
          { id: 'bracket', match: ['T00', 'bracket', 0], dx: 0.14, dy: 0.02 },
          { id: 'wall', match: ['T01', 'wall', 7], dx: -0.13, dy: -0.05 },
          { id: 'floor', match: ['T00', 'floor', 7], dx: -0.13, dy: 0.04 },
        ],
        zh: '再把最下面的两层檐一层层拆开：回廊地板、柱子和木板墙、斗拱、屋檐。上一层压在下一层上，斗拱把屋檐的重量一点点传给柱子。',
        en: 'Take the two lowest eaves apart, layer by layer: gallery floor, columns and plank wall, dougong, roof. Each rests on the one below, and the dougong pass the weight of the roof down into the columns.',
      },
      {
        view: 'cut',
        labels: [
          { id: 'shell', match: ['S0_cut', 'shell', 6], dx: -0.2, dy: -0.07 },
          { id: 'corridor', match: [['S0_cut', 'core', 6], ['S0_cut', 'shell', 6]], dx: -0.2, dy: 0.06 },
          { id: 'core', match: ['S0_cut', 'core', 0], dx: 0.2, dy: -0.08 },
          { id: 'chamber', match: ['S0_cut', 'chamberfloor', -1], dx: 0.22, dy: 0.05 },
        ],
        explore: true,
        zh: '最后剖开砖塔身：外墙、回廊、内墙、塔心室，两层筒一个套着一个，楼梯就藏在回廊里。这种“双筒”结构让高塔更加稳固。',
        en: 'Finally, cut the brick body open: outer wall, corridor, inner wall, central chamber. Two tubes, one inside the other, with the stairs in between. This “double tube” keeps a tall tower steady.',
      },
      {
        image: 'media/interior.webp',
        zh: '从回廊往里走，要穿过两道对齐的壶门。门洞的上沿是一串向内卷的弧线，像花瓣一样。穿过它们，就进了塔心室。',
        en: 'From the corridor you pass through two cusped doorways, one lined up behind the other, their tops curling inward like petals, and step into the central chamber.',
      },
    ],
    terms: [
      ['七明六暗', 'seven open, six sealed levels'],
      ['双筒结构', 'double-tube structure'],
      ['壶门', 'cusped doorway'],
    ],
  },
  {
    id: 'tide',
    title: { zh: '听潮', en: 'Listening to the Tide' },
    steps: [
      {
        image: 'media/listen.webp',
        video: 'media/listen.mp4',
        zh: '坐在塔里的回廊上，从门洞往外看，钱塘江就在脚下。大潮来时，先是远处一阵闷雷似的声响，接着一道白线从江口推过来，越推越高，这就是“一线潮”。',
        en: 'Sit in the gallery of the tower and look out through the doorway: the Qiantang is right below. When a big tide comes, you hear a low rumble like distant thunder, then a white line pushes up the river from the estuary, rising as it comes. This is the “single-line tide”.',
      },
      {
        image: 'media/nighttide.webp',
        video: 'media/nighttide.mp4',
        focus: '30% 50%', // the tower on the left, the moon on the right
        zh: '《水浒传》里，鲁智深夜宿六和寺，半夜听见江上潮声如雷。他想起师父留下的偈语“听潮而圆，见信而寂”，沐浴更衣，坐化而去。',
        en: 'In the novel Water Margin, the monk Lu Zhishen spends a night at Liuhe Temple and wakes to the tide roaring like thunder. Remembering his teacher’s verse, “hear the tide and be complete, see the sign and be still”, he bathes, sits down and dies in meditation.',
      },
      {
        image: 'media/crest.webp',
        video: 'media/crest.mp4',
        zh: '宋代诗人潘阆写观潮：“弄潮儿向涛头立，手把红旗旗不湿。”今天，“弄潮儿”指敢于站在时代潮头的人。',
        en: 'The Song poet Pan Lang wrote of young “tide-players” standing on the crest of the bore, red flags in hand, the flags never wet. Today the word means someone who rides the wave of their time.',
      },
    ],
    terms: [
      ['一线潮', 'the single-line tide (tidal bore)'],
      ['潮信', 'the tide that keeps its time'],
      ['弄潮儿', 'tide-player; pioneer'],
    ],
  },
  {
    id: 'practice',
    title: { zh: '练一练', en: 'Practice' },
    practice: true,
    steps: [
      {
        view: 'practice',
        zh: '读完了，做十道小题，看看记住了多少。每道题答完，都会说明为什么。',
        en: 'Now see what stayed with you: ten quick questions, each explained once you answer.',
      },
    ],
  },
];

/** names of parts in the callouts, both languages */
export const LABELS = {
  song: { zh: '南宋 · 砖砌塔身', en: 'Southern Song · brick body' },
  yuan: { zh: '元 · 铁塔刹', en: 'Yuan · iron finial' },
  qing: { zh: '清 · 木构外檐', en: 'Qing · timber eaves' },
  ming: { zh: '明层', en: 'Open level' },
  an: { zh: '暗层', en: 'Sealed level' },
  storey: { zh: '砖塔身第 3 层', en: 'Brick storey 3' },
  roof: { zh: '屋檐', en: 'Eave roof' },
  bracket: { zh: '斗拱', en: 'Dougong' },
  wall: { zh: '柱与木板墙', en: 'Columns, plank wall' },
  floor: { zh: '回廊地板', en: 'Gallery floor' },
  shell: { zh: '外墙（外筒）', en: 'Outer wall' },
  corridor: { zh: '回廊与楼梯', en: 'Corridor, stairs' },
  core: { zh: '内墙（内筒）', en: 'Inner wall' },
  chamber: { zh: '塔心室', en: 'Central chamber' },
};

/* ───────── practice: what the story told, two questions a chapter, in the order it was told ───────── */
export const QUIZ = [
  {
    q: { zh: '斗拱里方形的木块叫“斗”，弓形的短木叫“拱”。它们一层层叠上去，是为了什么？', en: 'In a dougong the square blocks are dou and the bow-shaped arms gong. What are they stacked up for?' },
    options: [
      { zh: '只是装饰', en: 'Only decoration' },
      { zh: '托住伸出的屋檐，把重量传给柱子', en: 'To hold up the eave and pass its weight to the columns' },
      { zh: '把雨水排走', en: 'To drain the rain away' },
      { zh: '挂风铃', en: 'To hang the bells' },
    ],
    answer: 1,
    why: { zh: '斗和拱交错叠上去，向外托住屋檐，再把它的重量一点点传给柱子。十三层外檐都靠它们托着。', en: 'Block on arm, arm on block, they reach out under the eave and pass its weight down into the columns. All thirteen eaves rest on them.' },
  },
  {
    q: { zh: '和六和塔在同一座山上的，是哪里？', en: 'What else stands on the same hill as the pagoda?' },
    options: [
      { zh: '浙江大学之江校区', en: 'Zhejiang University’s Zhijiang campus' },
      { zh: '浙江大学紫金港校区', en: 'Zhejiang University’s Zijingang campus' },
      { zh: '雷峰塔', en: 'Leifeng Pagoda' },
      { zh: '灵隐寺', en: 'Lingyin Temple' },
    ],
    answer: 0,
    why: { zh: '塔在钱塘江北岸的月轮山上，之江校区就在同一座山上；塔下不远，是 1937 年通车的钱塘江大桥。', en: 'The pagoda stands on Yuelun Hill above the Qiantang, and the Zhijiang campus is on the same hill. Just below, the Qiantang River Bridge has crossed the river since 1937.' },
  },
  {
    q: { zh: '公元 970 年建塔，最主要是为了什么？', en: 'What was the pagoda built for in 970?' },
    options: [
      { zh: '镇潮', en: 'To calm the tide' },
      { zh: '收藏佛经', en: 'To keep sutras' },
      { zh: '瞭望敌情', en: 'To watch for enemies' },
      { zh: '登高观景', en: 'As a viewpoint' },
    ],
    answer: 0,
    why: { zh: '钱塘江大潮常常冲垮堤岸、淹没农田。吴越王钱弘俶舍出月轮山上的果园，由智觉禅师延寿主持建塔，为的就是“镇潮”。', en: 'The great tides broke the banks and drowned the fields. King Qian Chu of Wuyue gave his orchard on Yuelun Hill, and the Chan master Yanshou built the pagoda there “to calm the tide”.' },
  },
  {
    q: { zh: '塔名里的“六和”，一般怎么解释？', en: 'How is the “Liuhe” in its name usually explained?' },
    options: [
      { zh: '六条江河在这里汇合', en: 'Six rivers meet here' },
      { zh: '塔经历了六个朝代', en: 'It has lived through six dynasties' },
      { zh: '佛教的“六和敬”', en: 'The Buddhist “six harmonies”' },
      { zh: '塔最初只有六层', en: 'It first had six storeys' },
    ],
    answer: 2,
    why: { zh: '一般解释为佛教的“六和敬”，所以英文常译作 the Pagoda of Six Harmonies。970 年最初建的塔有九级。', en: 'It is usually read as the Buddhist “six harmonies”, hence the English name, the Pagoda of Six Harmonies. The first tower of 970 had nine storeys.' },
  },
  {
    q: { zh: '今天的塔是三个朝代叠在一起的。砖砌塔身、铁塔刹、木构外檐，依次来自哪三个朝代？', en: 'Today’s pagoda is three dynasties stacked together. The brick body, the iron finial and the timber eaves come from which three, in that order?' },
    options: [
      { zh: '南宋、元、清', en: 'Southern Song, Yuan, Qing' },
      { zh: '北宋、元、明', en: 'Northern Song, Yuan, Ming' },
      { zh: '唐、宋、元', en: 'Tang, Song, Yuan' },
      { zh: '南宋、明、清', en: 'Southern Song, Ming, Qing' },
    ],
    answer: 0,
    why: { zh: '970 年的塔在 1121 年毁于兵火。南宋重建了砖塔身，元代铸了铁塔刹，清代在 1900 年重建了十三层木檐。', en: 'The tower of 970 was destroyed in war in 1121. The Southern Song rebuilt the brick body, the Yuan cast the iron finial, and the Qing rebuilt the thirteen timber eaves in 1900.' },
  },
  {
    q: { zh: '1991 年大修，讲究的是什么？', en: 'What principle guided the major repair of 1991?' },
    options: [
      { zh: '全部换成新材料', en: 'Replace everything with new material' },
      { zh: '“整旧如旧”，尽量保留原样', en: '“Repair the old as old”: keep it as it was' },
      { zh: '拆掉按原样重建', en: 'Pull it down and build it again' },
      { zh: '改成钢筋混凝土结构', en: 'Rebuild it in reinforced concrete' },
    ],
    answer: 1,
    why: { zh: '“整旧如旧”：修的是一座老塔，就让它还是老塔的样子，不把它修成一座新塔。', en: '“Repair the old as old”: an old tower is mended so that it still looks old, not made into a new one.' },
  },
  {
    q: { zh: '外面数有十三层屋檐，楼梯却只能走到第七层。为什么？', en: 'Thirteen eaves outside, yet the stairs stop at the seventh floor. Why?' },
    options: [
      { zh: '上面六层年久失修，不让上去', en: 'The top six are closed for repairs' },
      { zh: '每层砖塔身对应两层外檐：开门的明层和封闭的暗层', en: 'Each brick storey carries two eaves: an open level and a sealed one' },
      { zh: '外檐是后加的装饰，里面是空的', en: 'The eaves are later decoration, empty inside' },
      { zh: '塔的上半截是实心的', en: 'The upper half is solid' },
    ],
    answer: 1,
    why: { zh: '这叫“七明六暗”：七个开门通回廊的明层，夹着六个封闭的暗层，合起来正好十三层檐。', en: 'This is “qi ming liu an”: seven open levels with doors to the gallery and six sealed levels between them, thirteen eaves in all.' },
  },
  {
    q: { zh: '剖开砖塔身，能看到“双筒”结构。它是什么样的？', en: 'Cut open, the brick body shows a “double tube”. What is it?' },
    options: [
      { zh: '两座塔并排站着', en: 'Two towers side by side' },
      { zh: '外墙和内墙两层筒，中间是藏着楼梯的回廊', en: 'An outer and an inner wall, with the stair corridor between them' },
      { zh: '两层砖墙之间填满了夯土', en: 'Two brick walls with rammed earth between them' },
      { zh: '塔分成上下两段', en: 'An upper and a lower half' },
    ],
    answer: 1,
    why: { zh: '外墙是外筒，内墙是内筒，楼梯藏在两筒之间的回廊里，最里面是塔心室。两层筒套在一起，高塔更稳。', en: 'The outer wall is one tube and the inner wall another; the stairs run in the corridor between them, and the central chamber lies inside. Together they keep a tall tower steady.' },
  },
  {
    q: { zh: '《水浒传》里，是谁夜宿六和寺，听见潮声后坐化？', en: 'In Water Margin, who spends a night at Liuhe Temple and, hearing the tide, dies in meditation?' },
    options: [
      { zh: '宋江', en: 'Song Jiang' },
      { zh: '李逵', en: 'Li Kui' },
      { zh: '吴用', en: 'Wu Yong' },
      { zh: '鲁智深', en: 'Lu Zhishen' },
    ],
    answer: 3,
    why: { zh: '鲁智深半夜被潮声惊醒，才知道这是钱塘江的“潮信”。他想起师父的偈语“听潮而圆，见信而寂”，于是沐浴更衣，坐化而去。', en: 'Woken by the roar, Lu Zhishen learns it is the Qiantang tide keeping its time, its “xin”. He remembers his teacher’s verse, “hear the tide and be complete, see the sign and be still”, bathes, sits down and dies in meditation.' },
  },
  {
    q: { zh: '潘阆写“弄潮儿向涛头立，手把红旗旗不湿”。今天说一个人是“弄潮儿”，是什么意思？', en: 'Pan Lang wrote of “tide-players” on the crest, red flags in hand. What does it mean today to call someone a tide-player?' },
    options: [
      { zh: '很会游泳的人', en: 'A strong swimmer' },
      { zh: '喜欢看热闹的人', en: 'Someone who loves a spectacle' },
      { zh: '敢站在时代潮头的人', en: 'Someone who rides the wave of their time' },
      { zh: '靠打鱼为生的人', en: 'A fisherman' },
    ],
    answer: 2,
    why: { zh: '宋代的弄潮儿举着红旗踏潮而立；今天这个词指敢于站在时代潮头的人，英文可以说 a pioneer、a trailblazer。', en: 'Song youths stood on the bore with red flags; today the word means someone at the front of their time, a pioneer or trailblazer.' },
  },
];

export const SOURCES = [
  ['杭州市人民政府：六和塔（英文页）', 'https://www.ehangzhou.gov.cn/2018-06/14/c_242884.htm'],
  ['杭州网：六和塔与镇潮（2021）', 'https://hznews.hangzhou.com.cn/wghz/content/2021-12/31/content_8133553.htm'],
  ['杭州网：六和塔外看 13 层为什么爬到 7 层就到顶（2022）', 'https://hznews.hangzhou.com.cn/chengshi/content/2022-09/04/content_8345267_0.htm'],
  ['杭州网：27 年前六和塔的一次大修（2018）', 'https://hznews.hangzhou.com.cn/chengshi/content/2018-09/11/content_7065768_3.htm'],
  ['光明网：六和塔（2025）', 'https://m.gmw.cn/2025-08/24/content_1304122360.htm'],
  ['买购网：六和塔（引《咸淳临安志》）', 'https://m.maigoo.com/citiao/139599.html'],
  ['Wikipedia: Liuhe Pagoda', 'https://en.wikipedia.org/wiki/Liuhe_Pagoda'],
  ['杭州网：钱塘江大桥', 'https://hznews.hangzhou.com.cn/chengshi/content/2020-07/20/content_7777121_2.htm'],
  ['澎湃新闻：鲁智深与六和寺', 'https://www.thepaper.cn/newsDetail_forward_8175342'],
  ['Wikimedia Commons: Liuhe Pagoda（建模参考照片）', 'https://commons.wikimedia.org/wiki/Category:Liuhe_Pagoda'],
];
