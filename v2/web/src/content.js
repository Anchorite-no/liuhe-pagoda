/**
 * Everything the page says, in Chinese and English side by side (the site is for an English
 * course: every paragraph is shown in both languages). Eight chapters; each step is one short
 * paragraph pair plus what the stage shows while it is read:
 *   { view: 'whole' | 'eave' | 'brackets' | 'far' | 'open' | 'groups' | 'layers' | 'cut' | 'history'
 *          | 'floor0'…'floor7' | 'practice', labels }
 *     → the real-time model (viewer.js), with that camera and disassembly stage
 *   { view: 'river' } → no tower: the ink river behind the page is the picture
 *   { image: 'media/…', video?, focus? } → a rendered picture; with video, a short path-traced loop
 *     (the picture is shown until the loop has loaded); focus is the object-position the crop
 *     centres on when the frame is narrower than the picture
 * and, inside the card:
 *   more    → “细读 Read more”: longer paragraphs, folded away until asked for
 *   photo   → a real photograph (photos.js) with its caption and credit
 *   quote   → a poem or prose passage, original and translation
 *   widget  → something to do: 'bells' | 'stones' | 'timemachine' | 'debate' | 'dougong' | 'plaque'
 *             | 'tidelab' | 'rider' | 'naming' | 'guide' | 'quiz' | 'certificate'
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
        more: {
          zh: [
            '杭州人爱拿西湖边的三座塔打比方：“保俶如美人，雷峰如老衲，六和如将军。”保俶塔纤细，雷峰塔敦厚，六和塔又高又稳，正对着钱塘江，像一位守在江口的将军。',
            '“外看十三层，内实七层”是六和塔最有名的谜题：从外面数是十三层屋檐，走进去却只能爬到第七层。为什么？读到“拆开看”一章就明白了。',
          ],
          en: [
            'Hangzhou people compare the pagodas around West Lake: “Baochu is a beauty, Leifeng an old monk, and Liuhe a general.” Slender Baochu, squat Leifeng, and Liuhe, tall and steady, facing the river like a general guarding its mouth.',
            '“Thirteen storeys outside, seven inside” is its famous riddle: you count thirteen eaves from outside, yet the stairs stop at the seventh floor. Why? The chapter “Take It Apart” will show you.',
          ],
        },
      },
      {
        view: 'eave',
        labels: [
          { id: 'roof', match: ['T05', 'roof', 7], dx: 0.16, dy: -0.12 },
          { id: 'bracket', match: ['T05', 'bracket', 7], dx: 0.18, dy: 0.02 },
          { id: 'wall', match: ['T04', 'wall', 7], dx: 0.16, dy: 0.1 },
        ],
        hold: true,
        widget: 'bells',
        zh: '走近看，每层屋檐下都有一圈斗拱，檐角挂着铁铃，风一吹就响。暗红色的木板墙上，开着一排排小方窗。',
        en: 'Up close, a band of dougong brackets runs under every eave, and iron bells ring from the corners in the wind. The dark red plank walls are pierced by rows of small square windows.',
        more: {
          zh: [
            '十三层屋檐，每层八个檐角，每个檐角挂一只铁铃，叫“风铎”，一共 104 只。一般的说法是：铃声能惊走鸟雀，保护木构；在佛教里，铃声也象征佛法传得很远，提醒世人。',
            '小方窗不只是装饰。木板墙后面是一圈回廊，窗子让光和风进去，也让登塔的人往外看江。',
          ],
          en: [
            'Thirteen eaves, eight corners each, and an iron bell at every corner: 104 wind-bells, called fengduo. Their ringing is said to keep birds off the timber; in Buddhism it also stands for the teaching carried far on the wind, a call to wake up.',
            'The small windows are not just decoration. Behind the plank walls runs a gallery; the windows let in light and air, and let climbers look out over the river.',
          ],
        },
        photo: 'eavebells',
      },
      {
        view: 'brackets',
        labels: [{ id: 'bracket', match: ['T05', 'bracket', 7], dx: 0.16, dy: -0.1 }],
        hold: true,
        zh: '再凑近看斗拱：方形的木块叫“斗”，弓形的短木叫“拱”。一层斗、一层拱交错着叠上去，向外托住伸出的屋檐，再把它的重量一点点传给柱子。十三层外檐，就靠一圈又一圈这样的斗拱托着。',
        en: 'Closer still, the dougong: the square blocks are the dou, the bow-shaped arms the gong. Block on arm, arm on block, they reach out to hold up the overhanging eave and pass its weight down into the columns. All thirteen eaves rest on ring after ring of them.',
        more: {
          zh: [
            '斗拱不用一颗钉子。每个构件上都开着槽口，斗和拱、拱和拱十字相交，靠榫卯咬在一起。',
            '一般认为斗拱还能“减震”：地震时，层层叠叠的木构件会微微滑动、挤紧，消耗掉一部分震动的能量，房子晃而不倒。',
            '北宋的《营造法式》（1103 年）把斗拱的尺寸定成一套标准：以“材”为单位，一座房子选定用几等材，所有构件的大小就跟着定下来，很像今天的模块化设计。',
          ],
          en: [
            'Not a single nail holds a dougong together. Every piece is notched; blocks and arms cross and lock into one another by mortise and tenon.',
            'Dougong are also thought to soften earthquakes: the stacked timbers slide and tighten a little, using up some of the shaking, so the building sways but stands.',
            'The Song building manual Yingzao Fashi (1103) set dougong to a standard: choose one grade of the module called cai for a building, and the size of every piece follows, rather like modular design today.',
          ],
        },
      },
      {
        view: 'far',
        zh: '1961 年，六和塔成为第一批全国重点文物保护单位。同一座山上就是浙江大学之江校区，塔下不远，是 1937 年通车的钱塘江大桥。',
        en: 'In 1961 it became one of China’s first national key monuments. Zhejiang University’s Zhijiang campus sits on the same hill, and the Qiantang River Bridge, opened in 1937, crosses the river just below.',
        more: {
          zh: [
            '钱塘江大桥由茅以升主持设计，是中国人自己设计建造的第一座铁路、公路两用双层桥。1937 年 9 月 26 日通车，仅仅 89 天后，为了阻止日军南下，大桥被忍痛炸断。据说建桥时，就已经在一个桥墩里预留了放炸药的洞。茅以升写下“抗战必胜，此桥必复”，1953 年大桥全面修复通车。',
            '今天站在六和塔上往下看，大桥就在脚下：一座千年古塔，一座快满百年的大桥，一起守着这段江面。',
          ],
          en: [
            'The bridge was designed under the engineer Mao Yisheng, the first double-deck road and rail bridge designed and built by Chinese engineers. It opened on 26 September 1937; only 89 days later it was blown up to stop the Japanese advance. A hole for the explosives is said to have been left in one pier while it was being built. Mao wrote: “We will win the war, and this bridge will rise again.” It was fully restored in 1953.',
            'From the pagoda today you look straight down on it: a thousand-year-old tower and a bridge nearly a century old, keeping watch over the same stretch of river.',
          ],
        },
        photo: 'bridge',
      },
    ],
    terms: [
      ['塔', 'pagoda'],
      ['屋檐', 'eave'],
      ['斗拱', 'dougong (bracket set)'],
      ['风铎', 'wind-bell'],
      ['榫卯', 'mortise and tenon'],
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
        more: {
          zh: [
            '“钱塘”的“塘”，就是挡潮的海塘。910 年，吴越国的开国国王钱镠征发民工修筑捍海塘：用竹子编成长笼，里面塞满大石头，一排排沉到江边，再打下木桩固定。这种竹笼石塘，比土塘结实得多。',
            '民间还流传着“钱王射潮”的故事：钱镠让弓箭手对着潮头放箭，硬是把潮水逼了回去。苏轼后来写诗：“安得夫差水犀手，三千强弩射潮低。”',
          ],
          en: [
            'The “tang” in Qiantang means a seawall. In 910 Qian Liu, founder of the Wuyue kingdom, had one built: long cages of woven bamboo packed with boulders, sunk row by row along the shore and pinned with wooden stakes, far stronger than banks of earth.',
            'A legend adds that King Qian ordered his archers to shoot at the incoming bore until it fell back. The poet Su Shi later wished for “three thousand strong crossbows to shoot the tide down”.',
          ],
        },
      },
      {
        image: 'media/tide.webp',
        video: 'media/tide.mp4',
        focus: '34% 50%',
        zh: '公元 970 年，吴越王钱弘俶舍出月轮山上的果园，由智觉禅师延寿主持建塔，为的是“镇潮”。塔名里的“六和”，一般解释为佛教的“六和敬”。',
        en: 'In 970 King Qian Chu gave up his orchard on Yuelun Hill, and the Chan master Yanshou built a pagoda there to calm the tide. The “Liuhe” in its name is usually read as the Buddhist “six harmonies”.',
        more: {
          zh: [
            '“六和敬”是僧人一起生活的六条准则：身和同住、口和无诤、意和同悦、戒和同修、见和同解、利和同均。',
            '也有人写作“六合”，指天、地和东南西北四方，好像这座塔镇住了整个天地。两种说法都有人用，英文名 the Pagoda of Six Harmonies 取的是前一种。',
            '它首先是一座佛塔，用来供奉佛舍利。主持建塔的除了延寿禅师，还有赞宁法师。',
          ],
          en: [
            'The “six harmonies” are six rules for monks living together: harmony in dwelling, in speech, in mind, in keeping the precepts, in understanding, and in sharing.',
            'Some write the name 六合, “the six directions”: heaven, earth and the four quarters, as if the tower held the whole world steady. Both readings are used; the English name, the Pagoda of Six Harmonies, follows the first.',
            'Above all it was a Buddhist pagoda, built to hold relics, raised by the monks Yanshou and Zanning.',
          ],
        },
      },
      {
        image: 'media/night.webp',
        video: 'media/night.mp4',
        zh: '据旧时记载，塔顶还点着一盏明灯。夜里在江上行船的人，就看着这盏灯辨认方向。',
        en: 'Old records say a lamp burned at the top, and boatmen on the dark river steered by its light.',
        more: {
          zh: ['英国科学史家李约瑟在《中国科学技术史》里提到六和塔：据《杭州府志》，它几乎从建成起就是一座长明的灯塔。塔镇的是潮，照的是夜路。'],
          en: ['The historian of science Joseph Needham noted that, according to the Hangzhou gazetteer, the pagoda served as a lighthouse almost from the start. It held back the tide by day and lit the way by night.'],
        },
      },
      {
        view: 'river',
        widget: 'stones',
        zh: '杭州还流传着一个民间故事，叫“六和填江”：渔家孩子六和的父亲被潮水夺走，母亲也被浪卷去。六和天天站在山上往江里扔石头，扔得龙宫摇摇晃晃。龙王只好求和，放回他的母亲，答应从此不让潮水害人。人们就在他扔石头的山上建了这座塔。',
        en: 'Hangzhou also tells a folk tale, “Liuhe Fills the River”. A fisherman’s boy named Liuhe lost his father to the tide, and his mother was swept away too. Day after day he threw stones into the river from the hill, until the Dragon King’s palace shook. The Dragon King begged for peace, sent his mother back and promised the tide would harm no one again. On the hill where the boy stood, people built the pagoda.',
      },
    ],
    terms: [
      ['镇潮', 'to calm the tide'],
      ['吴越国', 'the Wuyue kingdom'],
      ['海塘', 'seawall'],
      ['传说', 'legend'],
    ],
  },
  {
    id: 'history',
    title: { zh: '屡毁屡修', en: 'Burned and Rebuilt' },
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
        view: 'history',
        widget: 'timemachine',
        zh: '木头怕火。一千多年里，六和塔的木构外檐被烧光过好几次，又一次次修起来。拖动下面的年份，看看它经历了什么；有些年份还留下了老照片。',
        en: 'Timber fears fire. In a thousand years the pagoda’s timber casing has burned away more than once, and been rebuilt each time. Drag through the years below to see what it lived through; some years left old photographs.',
      },
      {
        view: 'whole',
        widget: 'debate',
        zh: '1935 年，建筑学家梁思成发表《杭州六和塔复原状计划》。他考证后认为，清末重建的外檐不合宋代的规制，主张按宋代的样子重新修。1991 年大修时，专家们的决定却是：清代留下什么样子，就修成什么样子。',
        en: 'In 1935 the architect Liang Sicheng published a plan to “restore the Liuhe Pagoda”. He found that the eaves rebuilt in the late Qing did not follow Song rules, and proposed rebuilding them as they would have been in the Song. When the tower was repaired in 1991, the experts decided otherwise: mend it just as the Qing had left it.',
      },
    ],
    terms: [
      ['朝代', 'dynasty'],
      ['塔刹', 'finial'],
      ['重建', 'to rebuild'],
      ['复原', 'restoration'],
      ['整旧如旧', 'repair the old as old'],
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
        more: {
          zh: ['在中国古塔里，这样“七明六暗”的做法很少见。从外面看，十三层屋檐一层层收小，轮廓匀称挺拔；从里面走，每层砖塔身都很高，对应外面的两层檐。暗层里也不是空的，藏着撑住上层屋檐的木构架。'],
          en: ['Among China’s old pagodas this “seven open, six sealed” plan is rare. From outside, thirteen eaves step in one by one into a tall, even outline; inside, each brick storey is tall enough to match two of them. The sealed levels are not empty: they hold the timber frames that carry the eave above.'],
        },
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
        view: 'brackets',
        widget: 'dougong',
        zh: '斗拱到底是怎么搭起来的？光看不如动手：从柱头上的栌斗开始，一件一件往上放，最后压上屋檐，看看重量怎样一层层传到柱子上。',
        en: 'How does a dougong actually go together? Better to build one: start with the cap block on the column, place the pieces one by one, then load the eave on top and watch the weight travel down into the column.',
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
        more: {
          zh: [
            '回廊两侧的墙脚是一圈“须弥座”。须弥座得名于佛教里的须弥山，上下宽、中间收进去，是佛像和佛塔常用的基座。',
            '六和塔里保存着 174 组南宋砖雕须弥座，雕着花卉、飞禽、走兽、乐伎和云纹，许多纹样和《营造法式》里画的一样，是研究宋代建筑装饰难得的实物。',
          ],
          en: [
            'Along the corridor runs a Sumeru plinth, named after Mount Sumeru of Buddhist cosmology: a base wide at top and bottom and drawn in at the waist, used under statues and pagodas.',
            'The pagoda keeps 174 sets of Southern Song carved-brick plinths, with flowers, birds, beasts, musicians and clouds; many patterns match the drawings in the Yingzao Fashi. They are rare surviving examples of Song decoration.',
          ],
        },
        photo: 'carving',
      },
    ],
    terms: [
      ['七明六暗', 'seven open, six sealed levels'],
      ['双筒结构', 'double-tube structure'],
      ['壶门', 'cusped doorway'],
      ['须弥座', 'Sumeru plinth'],
      ['营造法式', 'Yingzao Fashi, the Song building manual'],
    ],
  },
  {
    id: 'climb',
    title: { zh: '登塔', en: 'Climb the Seven Floors' },
    steps: [
      {
        view: 'floor0',
        zh: '从底层的门洞走进去，沿着藏在回廊里的楼梯一圈圈往上爬。每一层都挂着一块乾隆皇帝题写的匾。数一数：每块匾的第一个字，正好就是层数。',
        en: 'Step in through the ground-floor doorway and wind up the stairs hidden in the corridor. Every floor has a plaque written by the Qianlong Emperor. Look closely: the first character of each plaque is the number of its floor.',
        more: {
          zh: ['乾隆皇帝六次南巡，据说七次登上六和塔，为每层各题了一块匾，塔下院子里还立着他的诗碑。七块匾各四个字，个别字在不同资料里写法略有出入。'],
          en: ['The Qianlong Emperor made six tours of the south and is said to have climbed the pagoda seven times, writing a plaque for each floor; his poem stele still stands in the courtyard. Each plaque has four characters, and sources differ on a word or two.'],
        },
        photo: 'entrance',
      },
      ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({ view: `floor${n}`, widget: 'plaque', floor: n })),
    ],
    terms: [
      ['匾额', 'inscribed plaque'],
      ['题字', 'inscription'],
      ['彩绘', 'painted decoration'],
    ],
  },
  {
    id: 'tide',
    title: { zh: '听潮', en: 'Listening to the Tide' },
    dark: true,
    steps: [
      {
        image: 'media/listen.webp',
        video: 'media/listen.mp4',
        zh: '坐在塔里的回廊上，从门洞往外看，钱塘江就在脚下。大潮来时，先是远处一阵闷雷似的声响，接着一道白线从江口推过来，越推越高，这就是“一线潮”。',
        en: 'Sit in the gallery of the tower and look out through the doorway: the Qiantang is right below. When a big tide comes, you hear a low rumble like distant thunder, then a white line pushes up the river from the estuary, rising as it comes. This is the “single-line tide”.',
        more: {
          zh: [
            '钱塘江潮有好几种样子。在海宁盐官，潮头排成一条直线推过来，叫“一线潮”；在大缺口一带，两股潮头斜着撞在一起，叫“交叉潮”；到了老盐仓，潮水撞上拦潮的堤坝，猛地折回来，叫“回头潮”。',
            '每年农历八月十八前后潮水最大，杭州、海宁一带的人都赶去观潮。南宋时，京城的官员还会在这几天到江边检阅水军。',
          ],
          en: [
            'The Qiantang bore takes several shapes. At Yanguan in Haining it comes in one straight line, the “single-line tide”; near Dakoukou two fronts collide at an angle, the “crossing tide”; at Laoyancang it strikes a dyke and rebounds, the “returning tide”.',
            'Around the eighteenth day of the eighth lunar month the tide is at its greatest, and crowds pour out to watch. In the Southern Song, the capital’s officials reviewed the navy on the river in those days.',
          ],
        },
      },
      {
        view: 'river',
        widget: 'tidelab',
        wide: true,
        zh: '为什么钱塘江的潮这么大？三件事叠在了一起：月亮和太阳的引力，像喇叭口一样的杭州湾，还有横在江底的沙坎。动手试一试。',
        en: 'Why is the Qiantang bore so big? Three things add up: the pull of the moon and sun, the funnel of Hangzhou Bay, and the sandbar lying across the riverbed. Try it yourself.',
        more: {
          zh: [
            '杭州湾口从北岸的南汇嘴到南岸的镇海，宽约 100 公里；往里 100 多公里到海宁盐官，江面只剩 3 公里左右。大量海水从宽阔的湾口挤进窄窄的江道，水位迅速抬高。',
            '江口还横着一道巨大的沙坎，水一下子变浅，潮波的前锋被拖慢，后面的海水追上来，一浪叠一浪，竖起一道陡立的水墙。',
            '各家资料的数字略有出入：潮头一般高 1 到 2 米，最高可以超过 3 米；推进的速度每秒 5 到 7 米，快的时候接近每秒 10 米。',
          ],
          en: [
            'From Nanhui on the north shore to Zhenhai on the south, the mouth of Hangzhou Bay is about 100 km wide; a little over 100 km upstream at Yanguan the river is only about 3 km across. A huge body of sea water squeezes into the narrowing channel and the water level climbs fast.',
            'A vast sandbar lies across the estuary. Where the water suddenly shallows, the front of the tide wave slows, the water behind catches up, wave piles on wave, and a steep wall of water rises.',
            'Figures vary between sources: the bore is usually 1 to 2 m high and can top 3 m; it advances at 5 to 7 m a second, at times close to 10.',
          ],
        },
      },
      {
        image: 'media/nighttide.webp',
        video: 'media/nighttide.mp4',
        focus: '30% 50%', // the tower on the left, the moon on the right
        zh: '《水浒传》里，鲁智深夜宿六和寺，半夜听见江上潮声如雷。他想起师父留下的偈语“听潮而圆，见信而寂”，沐浴更衣，坐化而去。',
        en: 'In the novel Water Margin, the monk Lu Zhishen spends a night at Liuhe Temple and wakes to the tide roaring like thunder. Remembering his teacher’s verse, “hear the tide and be complete, see the sign and be still”, he bathes, sits down and dies in meditation.',
        more: {
          zh: [
            '在《水浒传》里和六和寺有缘的不止鲁智深。征方腊时断了一条胳膊的武松，最后也在六和寺出家，活到八十岁。',
            '金庸的武侠小说《书剑恩仇录》里，红花会的陈家洛把乾隆皇帝囚禁在六和塔上。金庸本人是海宁人，海宁正是观潮最有名的地方。',
          ],
          en: [
            'Lu Zhishen is not the only hero of Water Margin tied to Liuhe Temple. Wu Song, who lost an arm in the campaign against Fang La, also became a monk there and lived to eighty.',
            'In Jin Yong’s martial-arts novel The Book and the Sword, Chen Jialuo of the Red Flower Society holds the Qianlong Emperor prisoner in the Liuhe Pagoda. Jin Yong himself came from Haining, the town most famous for watching the tide.',
          ],
        },
      },
      {
        image: 'media/crest.webp',
        video: 'media/crest.mp4',
        widget: 'rider',
        zh: '宋代诗人潘阆写观潮：“弄潮儿向涛头立，手把红旗旗不湿。”今天，“弄潮儿”指敢于站在时代潮头的人。',
        en: 'The Song poet Pan Lang wrote of young “tide-players” standing on the crest of the bore, red flags in hand, the flags never wet. Today the word means someone who rides the wave of their time.',
        quote: {
          by: { zh: '潘阆《酒泉子》', en: 'Pan Lang, to the tune Jiuquanzi' },
          zh: '长忆观潮，满郭人争江上望。来疑沧海尽成空，万面鼓声中。弄潮儿向涛头立，手把红旗旗不湿。别来几向梦中看，梦觉尚心寒。',
          en: 'I still remember watching the tide: the whole town crowding the bank to look. As it came, it seemed the sea had emptied itself, in the roar of ten thousand drums. The tide-players stood on the crest, red flags in hand, and the flags stayed dry. Since then I have seen it often in dreams, and waking, my heart is cold still.',
        },
      },
    ],
    terms: [
      ['一线潮', 'the single-line tide (tidal bore)'],
      ['潮信', 'the tide that keeps its time'],
      ['弄潮儿', 'tide-player; pioneer'],
      ['喇叭口', 'funnel-shaped estuary'],
    ],
  },
  {
    id: 'world',
    title: { zh: '讲给世界听', en: 'Telling the World' },
    steps: [
      {
        view: 'whole',
        zh: '一座建筑走向世界，第一步是它的名字。一百多年里，六和塔在英文里写作过 Liu-ho-t’a、Liu Ho Pagoda、Six Harmonies Pagoda；今天通用 the Liuhe Pagoda，或 the Pagoda of Six Harmonies。前者照着读音拼，叫音译；后者照着意思译，叫意译。',
        en: 'For a building to reach the world, the first step is its name. Over a century the pagoda has been written Liu-ho-t’a, Liu Ho Pagoda and Six Harmonies Pagoda in English; today it is the Liuhe Pagoda, or the Pagoda of Six Harmonies. One follows the sound (transliteration), the other the meaning (translation).',
        more: {
          zh: [
            '旧的拼法来自威妥玛式拼音。1958 年起中国推行汉语拼音，“Liu-ho”就成了“Liuhe”。',
            '介绍中国文化时，常用的办法是“音译加解释”：先给出拼音，让人记住它的名字；再用一句话说清它是什么。比如 dougong, the interlocking wooden brackets under the eaves。',
          ],
          en: [
            'The older spellings come from the Wade–Giles system. From 1958 China adopted Hanyu Pinyin, and “Liu-ho” became “Liuhe”.',
            'A common way to introduce Chinese culture is “transliterate, then explain”: give the pinyin so the name sticks, then one phrase that says what it is. For example: dougong, the interlocking wooden brackets under the eaves.',
          ],
        },
      },
      {
        view: 'whole',
        widget: 'naming',
        wide: true,
        zh: '轮到你来翻译了。下面六个词，各有三种译法。选一个你觉得最好的，看看为什么。',
        en: 'Your turn to translate. Six terms, three renderings each. Pick the one you think works best and see why.',
      },
      {
        view: 'whole',
        widget: 'guide',
        wide: true,
        zh: '最后，当一回英文导游。从每一段里挑一句，拼成一段一分钟的讲解词，再听听它念出来是什么样子，跟着读一遍。',
        en: 'Finally, be the guide. Pick one sentence for each part to build a one-minute English tour, then hear it read aloud and read along.',
      },
    ],
    terms: [
      ['音译', 'transliteration'],
      ['意译', 'free translation'],
      ['导游词', 'tour script'],
      ['国际传播', 'international communication'],
    ],
  },
  {
    id: 'practice',
    title: { zh: '练一练', en: 'Practice' },
    practice: true,
    steps: [
      {
        view: 'practice',
        widget: 'quiz',
        zh: '读完了，做几道小题，看看记住了多少。每道题答完，都会说明为什么。做完以后，领一张你自己的登塔证书。',
        en: 'Now see what stayed with you: a few quick questions, each explained once you answer. Then collect your own certificate.',
      },
    ],
  },
];

/* ───────── between the chapters: full-screen pages of real photographs ─────────
   kind 'gallery': a row of photographs that slides sideways as you scroll
   kind 'essay': one photograph filling the screen, a passage of old prose over it */
export const INTERLUDES = [
  {
    after: 'meet',
    kind: 'gallery',
    id: 'real',
    eyebrow: 'THE REAL THING',
    title: { zh: '真实的六和塔', en: 'The Real Pagoda' },
    text: {
      zh: '模型之外，看看它真实的样子：从江对岸，从大桥上，从塔下，从屋檐底下。照片都来自维基共享资源，作者和授权写在每一张下面。',
      en: 'Beyond the model, the real thing: from across the river, from the bridge, from the foot of the tower, from under its eaves. All photographs are from Wikimedia Commons; the author and licence are under each one.',
    },
    photos: ['river', 'storm', 'front', 'archway', 'lookup', 'tiers', 'eavebells', 'entrance', 'gallery', 'bell'],
    bigword: '六和',
  },
  {
    after: 'climb',
    kind: 'essay',
    id: 'tide-essay',
    photo: 'borecurve',
    char: '潮',
    quote: {
      zh: '浙江之潮，天下之伟观也。自既望以至十八日为最盛。方其远出海门，仅如银线；既而渐近，则玉城雪岭际天而来，大声如雷霆，震撼激射，吞天沃日，势极雄豪。',
      en: 'The tide of the Zhe River is the greatest sight under heaven, and from the sixteenth to the eighteenth of the month it is at its height. When it first comes out of the sea gate far away, it is no more than a silver thread; then, drawing near, walls of jade and mountains of snow come reaching to the sky, with a roar like thunder, shaking and crashing, swallowing the sky and drenching the sun, overwhelming in its might.',
      by: { zh: '周密《观潮》 · 南宋', en: 'Zhou Mi, “Watching the Tide”, Southern Song' },
    },
  },
  {
    after: 'tide',
    kind: 'gallery',
    id: 'tides',
    dark: true,
    eyebrow: 'THE GREAT TIDE',
    title: { zh: '八月十八', en: 'The Eighteenth of the Eighth Month' },
    text: {
      zh: '每年农历八月十八前后，钱塘江潮最大。从海宁盐官到杭州城里，成千上万的人沿江等潮。2024 年 9 月，潮水甚至冲上了六和塔下的之江路。',
      en: 'Around the eighteenth day of the eighth lunar month the Qiantang tide is at its greatest, and crowds line the river from Yanguan to the city. In September 2024 it even broke over Zhijiang Road below the pagoda.',
    },
    photos: ['boreline', 'borecurve', 'boredragon', 'boreback', 'crowd', 'borecity', 'boreroad', 'bore1892', 'mural', 'chart'],
    bigword: '潮',
  },
  {
    after: 'tide',
    kind: 'gallery',
    id: 'century',
    eyebrow: 'A CENTURY OF PHOTOGRAPHS',
    title: { zh: '世界怎样看六和塔', en: 'How the World Saw It' },
    text: {
      zh: '一百多年来，英国人、日本人、美国人、匈牙利人都拍过六和塔，它的英文名字也一路在变。这些照片，也记下了世界认识中国的一段过程。',
      en: 'For more than a century, people from Britain, Japan, America and Hungary have photographed the pagoda, and its English name kept changing along the way. Together the pictures record a little of how the world came to know China.',
    },
    photos: ['yulemap', 'h1891', 'h1900', 'h1910', 'hymca', 'h1918', 'h1918in', 'h1926', 'h1959', 'h1987'],
    notes: {
      yulemap: ['1903', '《马可·波罗游记》英译本里的杭州', 'Hangzhou in an English edition of Marco Polo'],
      h1891: ['1891', '英国传教士慕雅德的书', 'a book by the English missionary A. E. Moule'],
      h1900: ['1900s', '英国官员骆任廷', 'British official James Stewart Lockhart'],
      h1910: ['c.1910', '杭州二我轩照相馆', 'Erwoxuan, a Hangzhou photo studio'],
      hymca: ['1913–25', '美国基督教青年会', 'the American YMCA'],
      h1918: ['1918', '日本建筑史家关野贞', 'Japanese architectural historian Sekino Tadashi'],
      h1918in: ['1918', '关野贞，塔内', 'Sekino Tadashi, inside'],
      h1926: ['1926', '日本写真集《亚细亚大观》', 'the Japanese photo series Ajia Taikan'],
      h1959: ['1959', '匈牙利 Fortepan 档案', 'Hungary’s Fortepan archive'],
      h1987: ['1987', '一位美国游客', 'an American traveller'],
    },
    bigword: '百年',
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

/* ───────── the climb: Qianlong’s seven plaques, one a floor ───────── */
export const PLAQUES = [
  {
    text: '初地坚固',
    py: 'chū dì jiān gù',
    en: 'The First Ground Stands Firm',
    zh: '“初地”是佛教说的菩萨修行十个阶位中的第一位，也正好是塔的第一层。“坚固”：根基要稳。',
    enMeaning: 'In Buddhism the “first ground” is the first of ten stages on a bodhisattva’s path, and here it is also the tower’s first floor. Everything above depends on it standing firm.',
    note: { zh: '抬头就能看见这块金字匾。', en: 'The gilded plaque hangs right above you.' },
    photo: 'plaque1',
  },
  {
    text: '二谛俱融',
    py: 'èr dì jù róng',
    en: 'The Two Truths Blend as One',
    zh: '“二谛”是佛教说的两种真理：世俗的道理和究竟的真理。“俱融”：两者融为一体。',
    enMeaning: 'The “two truths” of Buddhism are the everyday truth and the ultimate truth; on this floor they blend into one.',
    note: { zh: '抬头看：天花上画满了彩绘。', en: 'Look up: the ceiling is covered in painted patterns.' },
    photo: 'ceil2',
  },
  {
    text: '三明净域',
    py: 'sān míng jìng yù',
    en: 'The Pure Realm of the Three Insights',
    zh: '“三明”是佛教说的三种智慧：看清前世、看清世间、断尽烦恼。“净域”就是清净的境界。',
    enMeaning: 'The “three insights” are seeing past lives, seeing the workings of the world, and ending all suffering; a “pure realm” is a world made clean.',
    note: { zh: '每一层的彩绘都不一样。', en: 'Every floor is painted differently.' },
    photo: 'ceil3',
  },
  {
    text: '四天宝纲',
    py: 'sì tiān bǎo gāng',
    en: 'The Jewelled Net of the Four Heavens',
    zh: '“四天”指佛教里四大天王守护的天界；“宝纲”是缀满珠宝的网，也有资料写作“宝网”。',
    enMeaning: 'The heavens guarded by the Four Heavenly Kings, hung with a net of jewels; some sources write the last word as “net” with a different character.',
    note: { zh: '天花的图案像一张张展开的网。', en: 'The ceiling patterns spread out like nets.' },
    photo: 'ceil4',
  },
  {
    text: '五云扶盖',
    py: 'wǔ yún fú gài',
    en: 'Five-coloured Clouds Hold Up the Canopy',
    zh: '“五云”是五色的祥云；“扶盖”：托着华盖。也有资料写作“五云覆盖”。',
    enMeaning: 'Auspicious clouds of five colours bear up a canopy of honour. Some sources read it as clouds that “cover over”.',
    note: { zh: '越往上走，塔身越细，回廊也越窄。', en: 'The higher you go, the slimmer the tower and the narrower the corridor.' },
    photo: 'ceil5',
  },
  {
    text: '六鳌负戴',
    py: 'liù áo fù dài',
    en: 'Borne Up by Six Giant Turtles',
    zh: '典出《列子·汤问》：海上的仙山漂浮不定，天帝派巨鳌用头顶住，仙山才稳了下来；“六鳌”也出自这个故事。这里是说塔像仙山一样，被稳稳地托着。也写作“六鳌负载”。',
    enMeaning: 'From the Liezi: the islands of the immortals drifted on the sea until giant turtles were sent to hold them up on their heads; the “six turtles” come from the same tale. The tower, like those islands, is held steady.',
    note: { zh: '天花正中盘着一条龙。', en: 'A dragon coils in the middle of a ceiling.' },
    photo: 'dragon',
  },
  {
    text: '七宝庄严',
    py: 'qī bǎo zhuāng yán',
    en: 'Adorned with the Seven Treasures',
    zh: '“七宝”是佛经里的七种珍宝，比如金、银、琉璃；“庄严”是装饰得庄重华美。登到最高一层，像是到了佛国。',
    enMeaning: 'The seven treasures of the sutras, gold, silver, lapis and more, and “adorned” in splendour: at the top you arrive, as it were, in the Buddha’s land.',
    note: { zh: '顶层正中立着一根粗大的心柱，塔刹就架在它上面。窗外，钱塘江大桥就在脚下。', en: 'A thick central mast stands in the middle of the top floor, carrying the finial. Outside, the Qiantang bridge lies at your feet.' },
    photo: 'pillar',
  },
];

/* ───────── the time machine: what happened, and what the tower looked like after ─────────
   state: 'ghost' the first tower, long gone · 'gone' destroyed · 'brick' timber casing burned away · 'whole' */
export const TIMELINE = [
  { y: 970, state: 'ghost', zh: '吴越王钱弘俶在月轮山建塔镇潮，塔高九级，塔上点灯为夜航指路。这座最初的塔早已不在，这里的虚影只是示意它的位置。', en: 'King Qian Chu of Wuyue builds a nine-storey pagoda on Yuelun Hill to calm the tide, with a lamp for boats at night. That first tower is long gone; the faint shape only marks its place.' },
  { y: 1121, state: 'gone', zh: '北宋末年方腊起义，战火中塔几乎全毁。', en: 'In the uprising led by Fang La at the end of the Northern Song, the pagoda is all but destroyed.' },
  { y: 1163, state: 'whole', zh: '南宋绍兴二十三年（1153 年）在原址重建，隆兴元年（1163 年）完工，塔身改为七层砖砌。今天的砖塔身就是这一次留下的。那时也有木构外檐，只是样子和今天不同。', en: 'Rebuilding starts in 1153 and is finished in 1163, now with seven brick storeys: the brick body standing today. It had timber eaves too, though not the ones you see now.' },
  { y: 1524, state: 'whole', zh: '元代元统年间（1333–1335 年）和明代嘉靖三年（1524 年），先后重修外檐、重装塔刹。', en: 'Repairs in the Yuan (1333–1335) and again in 1524 renew the eaves and refit the finial.' },
  { y: 1533, state: 'brick', zh: '嘉靖十二年（1533 年），倭寇纵火，木构外檐几乎烧光，只剩下砖塔身。', en: 'In 1533 raiding pirates set it alight; the timber eaves burn almost entirely, leaving only the brick body.' },
  { y: 1735, state: 'whole', zh: '清雍正十三年（1735 年）重建外檐。后来乾隆皇帝南巡，为每一层题写了匾额。', en: 'The eaves are rebuilt in 1735. Later the Qianlong Emperor, touring the south, writes a plaque for every floor.' },
  { y: 1861, state: 'brick', zh: '咸丰十一年（1861 年），太平天国战争中外檐再次被焚。', en: 'In 1861, in the Taiping war, the eaves burn once more.' },
  { y: 1891, state: 'brick', photo: 'h1891', zh: '这张照片印在英国传教士慕雅德（Arthur E. Moule）1891 年出版的书里：塔只剩光秃秃的砖身，墙上长出了草木。', en: 'This photograph, printed in a book by the English missionary Arthur E. Moule in 1891, shows the bare brick body with plants growing out of it.' },
  { y: 1900, state: 'whole', photo: 'h1900', zh: '光绪二十六年（1900 年），十三层木构外檐重新建起，就是我们今天看到的样子。这张照片是英国人骆任廷在 1900 年代拍的，外檐还很新。', en: 'In 1900 the thirteen timber eaves are rebuilt: the tower we see today. This photograph by the Briton James Stewart Lockhart, from the 1900s, shows the eaves still new.' },
  { y: 1918, state: 'whole', photo: 'h1918', zh: '日本建筑史学家关野贞来杭州考察，拍下了江边的六和塔。', en: 'The Japanese architectural historian Sekino Tadashi photographs the pagoda by the river.' },
  { y: 1935, state: 'whole', photo: 'songmodel', zh: '梁思成发表复原计划，主张按宋代的样子重修外檐，后来没有实施。照片里是根据他的复原图做的模型。', en: 'Liang Sicheng proposes rebuilding the eaves in Song style; it never happens. The photograph shows a model made from his drawings.' },
  { y: 1959, state: 'whole', photo: 'h1959', zh: '匈牙利 Fortepan 档案里的一张照片：塔下已经有了公路和成排的房子。', en: 'A photograph from Hungary’s Fortepan archive: a road and rows of houses now run below the tower.' },
  { y: 1961, state: 'whole', zh: '六和塔成为第一批全国重点文物保护单位。', en: 'The pagoda is listed among China’s first national key monuments.' },
  { y: 1991, state: 'whole', zh: '新中国成立后规模最大的一次修缮：加固塔基，更换一万多张屋瓦和朽坏的木构件，原则是“整旧如旧”。1992 年重新开放。', en: 'The largest repair since 1949: the foundation strengthened, over ten thousand roof tiles and decayed timbers replaced, on the principle of “repair the old as old”. It reopens in 1992.' },
  { y: 2014, state: 'whole', zh: '又一次大修，闭塔 343 天，装上了 133 个传感器，随时监测塔基沉降和木构开裂。', en: 'Another repair closes it for 343 days and installs 133 sensors that watch for settling and cracks in the timber.' },
  { y: 2026, state: 'whole', photo: 'river', zh: '今天。木构外檐已经站了一百多年，砖塔身站了八百多年。', en: 'Today. The timber casing has stood for over a century, the brick body for more than eight hundred years.' },
];

/* ───────── restore or keep? ───────── */
export const DEBATE = {
  q: { zh: '如果由你来决定，你会怎么修？', en: 'If it were your call, how would you repair it?' },
  options: [
    {
      pick: { zh: '复原成宋代的样子', en: 'Restore the Song look' },
      zh: '梁思成的理由：南宋的砖塔身是六和塔最古老、最珍贵的部分，外檐应当和它相配，让人看到宋代建筑真实的面貌。他还画出了复原图。',
      en: 'Liang’s case: the Song brick body is the oldest and most precious part, and the eaves should match it, so people can see what Song architecture really looked like. He even drew the restored design.',
      photo: 'songmodel',
    },
    {
      pick: { zh: '保留清代的样子', en: 'Keep the Qing look' },
      zh: '1991 年的理由：清代外檐本身也有一百多年了，是这座塔历史的一部分；照推测去“复原”，可能造出一座从来没存在过的塔。这就是“整旧如旧”。',
      en: 'The 1991 case: the Qing eaves are over a century old and part of the tower’s story themselves; “restoring” from guesswork might produce a tower that never existed. That is “repair the old as old”.',
      photo: 'tiers',
    },
  ],
  after: {
    zh: '两种想法都有道理，这也是世界各地修古建筑时常常遇到的难题。1964 年的国际文件《威尼斯宪章》里有一句话：修复“应止于推测开始的地方”。',
    en: 'Both views make sense, and restorers everywhere face the same dilemma. The Venice Charter of 1964, an international guide to conservation, says restoration “must stop at the point where conjecture begins”.',
  },
};

/* ───────── naming workshop ───────── */
export const NAMING = [
  {
    zh: '六和塔',
    py: 'liùhé tǎ',
    options: [
      { en: 'the Liuhe Pagoda (the Pagoda of Six Harmonies)', v: 2, why: { zh: '最好：音译让人记住名字，括号里的意译让人看懂意思。正式场合第一次提到时这样写最稳妥。', en: 'Best: the pinyin makes the name stick and the translation in brackets makes it clear. Safest for a first mention.' } },
      { en: 'Six-Harmony Tower', v: 1, why: { zh: '还行：意思到了，但 tower 太笼统，pagoda 才说明它是一座佛塔。', en: 'Fair: the meaning is there, but “tower” is vague; “pagoda” says it is a Buddhist tower.' } },
      { en: 'Liu He Ta', v: 0, why: { zh: '不好：三个字全部音译，外国读者不知道 Ta 是什么，也不知道它是一座塔。', en: 'Weak: all three syllables are transliterated; readers cannot tell that “Ta” means a pagoda.' } },
    ],
  },
  {
    zh: '斗拱',
    py: 'dǒugǒng',
    options: [
      { en: 'bucket arch', v: 0, why: { zh: '不好：逐字直译（斗 = bucket，拱 = arch），反而让人以为是个拱门。', en: 'Weak: word for word (dou = bucket, gong = arch), it makes people picture an archway.' } },
      { en: 'dougong, the interlocking wooden brackets that hold up the eaves', v: 2, why: { zh: '最好：音译加解释。名字保住了，一句话也说清了它是什么、有什么用。', en: 'Best: transliterate, then explain. The name is kept, and one phrase says what it is and what it does.' } },
      { en: 'bracket set', v: 1, why: { zh: '还行：建筑书里常用，意思准确，但中文名字丢了。', en: 'Fair: common in architecture books and accurate, but the Chinese name is lost.' } },
    ],
  },
  {
    zh: '一线潮',
    py: 'yīxiàn cháo',
    options: [
      { en: 'a tidal bore', v: 1, why: { zh: '还行：专业、准确，但“一条线”的画面没了。', en: 'Fair: precise and technical, but the picture of a single line is gone.' } },
      { en: 'one thread tide', v: 0, why: { zh: '不好：把“线”译成 thread（线团的线），读者摸不着头脑。', en: 'Weak: “thread” as in sewing thread leaves readers puzzled.' } },
      { en: 'the “single-line tide”, a tidal bore that arrives as one straight wall of water', v: 2, why: { zh: '最好：保留了中文的画面，又补上了它在科学上叫什么。', en: 'Best: it keeps the Chinese image and adds what the phenomenon is called.' } },
    ],
  },
  {
    zh: '弄潮儿（今义）',
    py: 'nòngcháo’ér',
    options: [
      { en: 'a trailblazer, someone who rides the wave of their time', v: 2, why: { zh: '最好：今天说一个人是“弄潮儿”，说的是敢为人先，用 trailblazer、pioneer 最贴切。', en: 'Best: today the word praises someone who dares to go first; trailblazer or pioneer fits.' } },
      { en: 'tide player', v: 1, why: { zh: '还行：讲宋代观潮风俗时可以直译，但说今天的人就不够了。', en: 'Fair: fine when describing the Song custom, but not for the modern meaning.' } },
      { en: 'naughty tide boy', v: 0, why: { zh: '不好：“弄”不是调皮捣蛋的意思。', en: 'Weak: 弄 here is not “naughty” at all.' } },
    ],
  },
  {
    zh: '整旧如旧',
    py: 'zhěng jiù rú jiù',
    options: [
      { en: 'make the old look new again', v: 0, why: { zh: '不好：意思正好反了。“整旧如旧”恰恰是不要修成新的。', en: 'Weak: the exact opposite. The whole point is not to make it look new.' } },
      { en: 'repair the old as old', v: 1, why: { zh: '还行：保留了原文的对称感，但外国读者需要再解释一句。', en: 'Fair: it keeps the echo of the original, but readers need one more sentence.' } },
      { en: 'conserve it as found, with minimal intervention', v: 2, why: { zh: '最好：这是国际文物保护的通用说法，专业读者一看就懂。', en: 'Best: the standard wording of international conservation, clear to any specialist.' } },
    ],
  },
  {
    zh: '镇潮',
    py: 'zhèn cháo',
    options: [
      { en: 'to town the tide', v: 0, why: { zh: '不好：把“镇”当成了“城镇”的镇。', en: 'Weak: it mistakes 镇 “to calm” for 镇 “a town”.' } },
      { en: 'to calm the tide', v: 2, why: { zh: '最好：意思准确，语气也平和，符合人们建塔祈求平安的心愿。', en: 'Best: accurate, and gentle in tone, like the hope for safety behind the tower.' } },
      { en: 'to suppress the tide', v: 1, why: { zh: '还行：意思对，但语气像在打仗。', en: 'Fair: the meaning is right, but it sounds like a battle.' } },
    ],
  },
];

/* ───────── be the guide: one sentence for each part ───────── */
export const GUIDE = [
  {
    part: { zh: '开场', en: 'Opening' },
    options: [
      { en: 'Hello everybody, now we arrive the Liuhe Pagoda.', v: 0, note: { zh: 'arrive 后面要加 at；而且一开口就该让大家有东西可看。', en: '“Arrive” needs “at”, and an opening should give people something to look at.' } },
      { en: 'Welcome! Look up at the tower above the river: this is the Liuhe Pagoda.', v: 2, note: { zh: '先让听众抬头看，再说出名字，开场就抓住了注意力。', en: 'Get them looking first, then name it: attention caught.' } },
      { en: 'Good morning. The building in front of us is a pagoda.', v: 1, note: { zh: '没错，但太平淡，也没说出它的名字。', en: 'Correct, but flat, and it never says the name.' } },
    ],
  },
  {
    part: { zh: '它是什么', en: 'What it is' },
    options: [
      { en: 'It has a very long history and a very beautiful appearance.', v: 0, note: { zh: '空话：听众听完记不住任何一个事实。', en: 'Empty words: nobody remembers a single fact.' } },
      { en: 'It is an eight-sided pagoda, about sixty metres high.', v: 1, note: { zh: '有事实，但少了让人好奇的东西。', en: 'Facts, but nothing to make people curious.' } },
      { en: 'It is sixty metres tall, with thirteen eaves outside but only seven floors inside.', v: 2, note: { zh: '一个谜题，立刻勾起好奇心。', en: 'A riddle: instant curiosity.' } },
    ],
  },
  {
    part: { zh: '为什么建', en: 'Why it was built' },
    options: [
      { en: 'It was built in 970 to calm the Qiantang tide, and a lamp at the top guided boats at night.', v: 2, note: { zh: '年份、目的、一个生动的细节，都有了。', en: 'A date, a purpose and one vivid detail.' } },
      { en: 'It was built in 970 by the king of Wuyue.', v: 1, note: { zh: '没错，但没说为什么建。', en: 'True, but it does not say why.' } },
      { en: 'It was built for killing the evil dragon of the river.', v: 0, note: { zh: '把传说当成了史实，而且“镇潮”不是斗恶龙。', en: 'It turns a legend into history, and “calming the tide” is not dragon-slaying.' } },
    ],
  },
  {
    part: { zh: '历史与结构', en: 'History and structure' },
    options: [
      { en: 'It is made of wood and stone and has many floors.', v: 0, note: { zh: '太笼统，而且塔身是砖不是石头。', en: 'Too vague, and the body is brick, not stone.' } },
      { en: 'What you see is centuries layered together: a Song brick body inside, wrapped in timber eaves rebuilt in 1900.', v: 2, note: { zh: '一句话讲清了塔的两层，也讲清了它的年代。', en: 'One sentence explains both layers and their ages.' } },
      { en: 'It was destroyed and rebuilt many times.', v: 1, note: { zh: '没错，可以再具体一点。', en: 'True; could be more specific.' } },
    ],
  },
  {
    part: { zh: '文化故事', en: 'A story' },
    options: [
      { en: 'It is a symbol of Chinese culture and Chinese people love it very much.', v: 0, note: { zh: '口号式的句子，外国听众很难有共鸣。', en: 'A slogan; it is hard for visitors to feel anything.' } },
      { en: 'In the novel Water Margin, the monk Lu Zhishen died here.', v: 1, note: { zh: '有故事，但听众不知道为什么要在乎。', en: 'A story, but why should they care?' } },
      { en: 'Every autumn the tide roars past, and a Song poet wrote of young men riding the crest with red flags that never got wet.', v: 2, note: { zh: '声音、画面、诗，全有了。', en: 'Sound, image and a poem, all at once.' } },
    ],
  },
  {
    part: { zh: '结尾', en: 'Closing' },
    options: [
      { en: 'Now you have free time to take photos.', v: 1, note: { zh: '实用，但收得太快。', en: 'Practical, but abrupt.' } },
      { en: 'That is all, thank you.', v: 0, note: { zh: '结束得太突然，没有留下印象。', en: 'Too sudden; nothing to remember.' } },
      { en: 'Climb to the seventh floor and look out: the river, the bridge and a thousand years are right below you.', v: 2, note: { zh: '把听众送上塔，也留下一个画面。', en: 'It sends them up the tower with a picture in mind.' } },
    ],
  },
];

/* ───────── practice: what the story told, in the order it was told ───────── */
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
    q: { zh: '民间故事“六和填江”里，六和是怎样让龙王求和的？', en: 'In the folk tale “Liuhe Fills the River”, how does Liuhe make the Dragon King give in?' },
    options: [
      { zh: '对着潮头射箭', en: 'By shooting arrows at the bore' },
      { zh: '天天往江里扔石头', en: 'By throwing stones into the river every day' },
      { zh: '在塔顶点灯', en: 'By lighting a lamp on the tower' },
      { zh: '敲响大钟', en: 'By ringing a great bell' },
    ],
    answer: 1,
    why: { zh: '六和天天往江里扔石头，震得龙宫摇晃，龙王只好求和。射潮是另一个传说“钱王射潮”。这些都是民间故事，塔名一般认为来自佛教“六和敬”。', en: 'Liuhe threw stones every day until the palace shook. Shooting the tide is a different legend, about King Qian Liu. Both are folk tales; the name is usually traced to the Buddhist “six harmonies”.' },
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
    q: { zh: '1891 年的老照片里，六和塔为什么只剩光秃秃的砖塔身？', en: 'Why does the 1891 photograph show only a bare brick tower?' },
    options: [
      { zh: '那时塔还没建好', en: 'It was not finished yet' },
      { zh: '木构外檐在 1861 年的战火中被烧掉了', en: 'The timber eaves had burned in the war of 1861' },
      { zh: '外檐被拆下来送去维修', en: 'The eaves had been taken down for repair' },
      { zh: '照片拍的是另一座塔', en: 'It shows a different pagoda' },
    ],
    answer: 1,
    why: { zh: '1861 年太平天国战争中外檐被焚，直到 1900 年才重建。木构怕火，六和塔的外檐至少被烧光过两次。', en: 'The eaves burned in the Taiping war in 1861 and were not rebuilt until 1900. Timber fears fire: the casing burned away at least twice.' },
  },
  {
    q: { zh: '1991 年大修，讲究的是什么？', en: 'What principle guided the major repair of 1991?' },
    options: [
      { zh: '全部换成新材料', en: 'Replace everything with new material' },
      { zh: '“整旧如旧”，尽量保留原样', en: '“Repair the old as old”: keep it as it was' },
      { zh: '按宋代的样子复原', en: 'Restore it to its Song appearance' },
      { zh: '改成钢筋混凝土结构', en: 'Rebuild it in reinforced concrete' },
    ],
    answer: 1,
    why: { zh: '“整旧如旧”：清代留下什么样子，就修成什么样子，不把老塔修成一座新塔。按宋代样子复原，是梁思成 1935 年的主张，没有实施。', en: '“Repair the old as old”: mend it as the Qing left it, not as a new tower. Restoring the Song look was Liang Sicheng’s proposal of 1935, never carried out.' },
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
    q: { zh: '乾隆给七层各题了一块匾。这七块匾有什么共同点？', en: 'Qianlong wrote a plaque for each of the seven floors. What do they have in common?' },
    options: [
      { zh: '都写着“六和”两个字', en: 'Each says “Liuhe”' },
      { zh: '每块匾的第一个字正好是层数', en: 'The first character of each is its floor number' },
      { zh: '都是同一句佛经', en: 'They all quote the same sutra' },
      { zh: '都是建塔人的名字', en: 'They name the builders' },
    ],
    answer: 1,
    why: { zh: '初地坚固、二谛俱融、三明净域、四天宝纲、五云扶盖、六鳌负戴、七宝庄严：从“初（一）”数到“七”。', en: 'Chu (first), er, san, si, wu, liu, qi: from one up to seven, floor by floor.' },
  },
  {
    q: { zh: '下面哪一个不是钱塘江大潮形成的原因？', en: 'Which of these does NOT help make the Qiantang bore?' },
    options: [
      { zh: '月亮和太阳的引力', en: 'The pull of the moon and the sun' },
      { zh: '像喇叭口一样的杭州湾', en: 'The funnel shape of Hangzhou Bay' },
      { zh: '横在江底的沙坎', en: 'The sandbar across the riverbed' },
      { zh: '塔顶的灯光', en: 'The lamp at the top of the pagoda' },
    ],
    answer: 3,
    why: { zh: '日月引力让海水涨落，喇叭口把海水挤高，沙坎让潮头变陡。塔灯照的是夜路，管不了潮水。', en: 'The moon and sun raise the tide, the funnel squeezes it higher, and the sandbar steepens the front. The lamp only lit the way for boats.' },
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
  {
    q: { zh: '“dougong, the interlocking wooden brackets under the eaves”用的是哪种译法？', en: '“dougong, the interlocking wooden brackets under the eaves” uses which approach?' },
    options: [
      { zh: '纯音译', en: 'Transliteration only' },
      { zh: '纯意译', en: 'Translation only' },
      { zh: '音译加解释', en: 'Transliterate, then explain' },
      { zh: '逐字直译', en: 'Word for word' },
    ],
    answer: 2,
    why: { zh: '先用拼音 dougong 保住名字，再用一句英文说清它是什么：这是介绍中国文化最常用、也最稳妥的办法。', en: 'The pinyin keeps the name and the phrase explains it: the most common and reliable way to introduce Chinese culture.' },
  },
];

export const SOURCES = [
  ['杭州市人民政府：六和塔（英文页）', 'https://www.ehangzhou.gov.cn/2018-06/14/c_242884.htm'],
  ['杭州网：六和塔与镇潮（2021）', 'https://hznews.hangzhou.com.cn/wghz/content/2021-12/31/content_8133553.htm'],
  ['杭州网：六和塔外看 13 层为什么爬到 7 层就到顶（2022）', 'https://hznews.hangzhou.com.cn/chengshi/content/2022-09/04/content_8345267_0.htm'],
  ['杭州网：27 年前六和塔的一次大修（2018）', 'https://hznews.hangzhou.com.cn/chengshi/content/2018-09/11/content_7065768_3.htm'],
  ['澎湃新闻：六和塔的四次大修与乾隆题匾（2020）', 'https://www.thepaper.cn/newsDetail_forward_9561498'],
  ['维基百科：六和塔（历代毁修、174 组砖雕须弥座）', 'https://zh.wikipedia.org/wiki/%E5%85%AD%E5%92%8C%E5%A1%94'],
  ['光明网：六和塔（2025）', 'https://m.gmw.cn/2025-08/24/content_1304122360.htm'],
  ['买购网：六和塔（引《咸淳临安志》）', 'https://m.maigoo.com/citiao/139599.html'],
  ['Wikipedia: Liuhe Pagoda', 'https://en.wikipedia.org/wiki/Liuhe_Pagoda'],
  ['杭州网：钱塘江大桥', 'https://hznews.hangzhou.com.cn/chengshi/content/2020-07/20/content_7777121_2.htm'],
  ['中国日报：茅以升忍痛炸毁建成仅 89 天的大桥', 'https://cn.chinadaily.com.cn/a/202111/05/WS61d9779ea3107be497a01520.html'],
  ['杭州网：钱塘的“塘”是海塘的“塘”', 'https://hznews.hangzhou.com.cn/chengshi/content/2025-05/19/content_8997549_2.htm'],
  ['澎湃新闻：鲁智深与六和寺', 'https://www.thepaper.cn/newsDetail_forward_8175342'],
  ['《建筑史学刊》论文（参考文献列有梁思成《杭州六和塔复原状计划》，《中国营造学社汇刊》5 卷 3 期，1935）', 'https://www.jgcm.ac.cn/jah/article/doi/10.12329/20969368.2021.02008'],
  ['ICOMOS: The Venice Charter (1964)', 'https://www.icomos.org/images/DOCUMENTS/Charters/venice_e.pdf'],
  ['Wikimedia Commons: Liuhe Pagoda（照片与建模参考）', 'https://commons.wikimedia.org/wiki/Category:Liuhe_Pagoda'],
];
