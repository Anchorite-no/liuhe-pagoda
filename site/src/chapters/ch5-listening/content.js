/**
 * ch5 content: the Water Margin scene, three poems, the Translation Lab items and vocabulary.
 *
 * Classical Chinese texts are public domain (checked against Wikisource, see `sources` in index.js).
 * Every English translation and every note here is our own writing.
 *
 * Rich strings may contain vocabulary tokens: [[term-id]] or [[term-id|shown text]].
 */

/* ───────────── Vocabulary ───────────── */
export const VOCAB = [
  {
    id: 'lit-punctual',
    en: 'punctual',
    zh: '守时的',
    pinyin: 'shǒushí de',
    def: {
      en: 'Arriving or happening at exactly the expected time.',
      zh: '按约定或预期的时间到来、发生，不早不晚。',
    },
    example: {
      en: 'The tide is so punctual that the monks called it the tide that keeps its word.',
      zh: '潮水来得极准时，和尚们说它“不失信”，所以叫“潮信”。',
    },
  },
  {
    id: 'lit-verse',
    en: 'verse',
    zh: '偈；诗句',
    pinyin: 'jì; shījù',
    def: {
      en: 'Writing arranged in lines with a rhythm; also a single line of a poem. A Buddhist verse of teaching is a gatha (偈).',
      zh: '有节奏、分行的文字，也指诗中的一句。佛教里用来开示的短诗叫“偈”。',
    },
    example: {
      en: 'His teacher gave him a four-line verse that he only understood years later.',
      zh: '师父给了他四句偈语，他多年以后才明白。',
    },
  },
  {
    id: 'lit-meditation',
    en: 'meditation',
    zh: '打坐；坐禅',
    pinyin: 'dǎzuò; zuòchán',
    def: {
      en: 'Sitting still and quieting the mind, often as a religious practice.',
      zh: '静坐、收摄心念，常作为一种宗教修行。',
    },
    example: {
      en: 'He crossed his legs and sat in meditation in the Dharma Hall.',
      zh: '他盘起双腿，在法堂上打坐。',
    },
  },
  {
    id: 'lit-pass-away',
    en: 'pass away',
    zh: '去世；（僧人）圆寂',
    pinyin: 'qùshì; yuánjì',
    def: {
      en: 'A gentle, respectful way to say “die”. For a Buddhist monk, Chinese uses 圆寂, “perfect stillness”.',
      zh: '“死”的委婉、尊重的说法。僧人去世，汉语称“圆寂”。',
    },
    example: {
      en: 'By the time his friends arrived, he had passed away, still sitting upright.',
      zh: '等朋友们赶到，他已经端坐着圆寂了。',
    },
  },
  {
    id: 'lit-enlightenment',
    en: 'enlightenment',
    zh: '顿悟；觉悟',
    pinyin: 'dùnwù; juéwù',
    def: {
      en: 'In Buddhism, suddenly seeing the truth about yourself and the world.',
      zh: '佛教用语，指忽然看清自己和世界的真相。',
    },
    example: {
      en: 'The roar of the tide brought him a moment of enlightenment.',
      zh: '潮声让他忽然大悟。',
    },
  },
  {
    id: 'lit-pioneer',
    en: 'pioneer',
    zh: '弄潮儿；开拓者',
    pinyin: 'nòngcháo’ér; kāituòzhě',
    def: {
      en: 'Someone who is among the first to do something new and risky. Chinese often calls such people 弄潮儿, “tide-players”.',
      zh: '最先去做新的、有风险的事情的人。汉语常把这样的人叫做“弄潮儿”。',
    },
    example: {
      en: 'Shenzhen in the 1980s was full of pioneers riding the wave of reform.',
      zh: '上世纪八十年代的深圳，到处是改革大潮中的弄潮儿。',
    },
  },
  {
    id: 'lit-spectacle',
    en: 'spectacle',
    zh: '壮观的景象',
    pinyin: 'zhuàngguān de jǐngxiàng',
    def: {
      en: 'A sight so large or impressive that people gather to watch it.',
      zh: '规模宏大、令人惊叹、让人争相观看的景象。',
    },
    example: {
      en: 'For Su Shi, the eighteenth-day tide was the greatest spectacle under heaven.',
      zh: '在苏轼看来，八月十八的潮是天下最壮观的景象。',
    },
  },
  {
    id: 'lit-domestication',
    en: 'domestication',
    zh: '归化（翻译）',
    pinyin: 'guīhuà',
    def: {
      en: 'A way of translating that makes the text feel natural to the reader, even if some foreign images are replaced.',
      zh: '一种翻译策略：让译文读起来像本国语言写的，必要时用读者熟悉的说法替换原文的意象。',
    },
    example: {
      en: '“Ride the wave of change” is a domestication of 弄潮儿.',
      zh: '把“弄潮儿”译成 ride the wave of change，就是归化。',
    },
  },
  {
    id: 'lit-foreignisation',
    en: 'foreignisation',
    zh: '异化（翻译）',
    pinyin: 'yìhuà',
    def: {
      en: 'A way of translating that keeps the strangeness of the original (names, images, ideas), even if the reader needs a note.',
      zh: '一种翻译策略：保留原文的陌生感（人名、意象、观念），哪怕读者需要看注释。',
    },
    example: {
      en: 'Keeping “chaoxin, the tide that keeps its word” is foreignisation.',
      zh: '保留 chaoxin 并解释为“守信的潮”，就是异化。',
    },
  },
];

/* ───────────── Part 1: Lu Zhishen hears the tide (Water Margin, ch. 119) ───────────── */
export const STORY_INTRO = {
  en: 'From the novel *Water Margin* (水浒传), chapter 119. The book took shape in the 14th century from older storytellers’ tales, and the oldest complete editions that survive date from the 1500s. It is fiction, but the river, the tide and the pagoda were real.',
  zh: '出自小说《水浒传》第一百一十九回“鲁智深浙江坐化”。这部书在十四世纪前后由说书人的故事汇集成书，现存最早的完整刻本出自十六世纪。故事是虚构的，可江、潮和塔都是真的。',
};

/**
 * Beats of the story. `seal` is the short inscription shown on the ink painting while the beat is read.
 * `verse` (optional) is shown typeset vertically beside an English rendering.
 */
export const BEATS = [
  {
    seal: '八月十五',
    title: { en: 'A camp by the river', zh: '江边扎营' },
    body: {
      en: '*Water Margin* follows the 108 outlaws of Mount Liang. Near the end of the book, after a bloody campaign against the rebel Fang La, what is left of their army camps at Liuhe Temple, at the foot of the pagoda. Two of the toughest heroes, the monk Lu Zhishen and Wu Song, lodge in the monks’ quarters. It is the fifteenth night of the eighth month: “the moon white, the wind clear, water and sky one shade of blue-green.”',
      zh: '《水浒传》写的是梁山泊一百零八条好汉。快到全书结尾，宋江的人马征讨方腊，一场恶战下来死伤大半，余下的人马屯在六和塔下的六和寺。鲁智深和武松两条好汉住进了寺里的僧房。这天是八月十五，书里写道：“是夜月白风清，水天共碧。”',
    },
  },
  {
    seal: '潮信',
    title: { en: 'Thunder at midnight', zh: '半夜雷响' },
    body: {
      en: 'At midnight Lu Zhishen wakes to a roar like thunder from the river. A fighter all his life, he takes it for war drums, jumps up and grabs his staff. The monks laugh. “Those aren’t drums. That is the Qiantang tide keeping its word. It comes twice every day and night and never misses its hour. Tonight is the fifteenth, so it is due at midnight. Because it never breaks faith, we call it chaoxin, the tide’s xin.” In other words, the tide is perfectly [[lit-punctual|punctual]].',
      zh: '睡到半夜，鲁智深“忽听得江上潮声雷响”。他厮杀了一辈子，只道是战鼓响、敌军来了，跳起身来提了禅杖就要出去。众僧都笑了：“不是战鼓响，乃是钱塘江潮信响。”又说这潮信“日夜两番来，并不违时刻”，今天八月十五，合当三更子时潮来，“因不失信，谓之潮信”。说白了，潮水极其[[lit-punctual|守时]]。',
    },
  },
  {
    seal: '听潮而圆',
    title: { en: 'An old riddle comes true', zh: '偈语应验' },
    body: {
      en: 'Suddenly he understands, claps his hands and laughs. Years before, on Mount Wutai, his teacher, the Elder Zhizhen, gave him a four-line [[lit-verse|verse]] that he never understood:',
      zh: '鲁智深“从此心中忽然大悟，拍掌笑道”：当年在五台山，师父智真长老曾嘱咐给他四句[[lit-verse|偈言]]，他一直没弄明白：',
    },
    verse: {
      zh: ['逢夏而擒', '遇腊而执', '听潮而圆', '见信而寂'],
      en: ['Meeting Xia, seize him.', 'Meeting La, hold him.', 'Hearing the tide, become round.', 'Seeing the sign, become still.'],
    },
    after: {
      en: 'Now every line fits. In the war he caught Xiahou Cheng (夏) alive and took Fang La (腊) prisoner himself. Tonight he has heard the tide and seen it keep faith (信). “Tell me,” he asks the monks, “what does yuanji mean?” Round (圆) and still (寂). They are amazed: “You’re a monk and you don’t know? In the Buddha’s house, yuanji means death.”',
      zh: '如今句句应验：在万松林里活捉了夏侯成，是“逢夏而擒”；生擒方腊，是“遇腊而执”；今夜听了潮、见了“信”，正应了后两句。他问众僧：“如何唤做圆寂？”众僧道：“你是出家人，还不省得佛门中‘圆寂’便是死？”',
    },
  },
  {
    seal: '见信而寂',
    title: { en: 'Sitting still', zh: '坐化' },
    body: {
      en: 'He asks for a tub of hot water and bathes. He puts on the monk’s robe the emperor gave him, sends a soldier to tell Song Jiang to come, and asks the monks for paper and a brush. He writes a short verse, lights incense, takes a meditation chair in the Dharma Hall and crosses his legs, left foot over right, in [[lit-meditation|meditation]]. When Song Jiang hurries in with the other leaders, Lu Zhishen is sitting in the chair and does not move. He has [[lit-pass-away|passed away]]. His verse reads:',
      zh: '他请僧人烧一桶汤来沐浴，换上一身御赐的僧衣，叫军校去请宋江来，又向寺里讨了纸笔，写下一篇颂子。然后焚起一炉香，在法堂上捉把禅椅当中坐了，左脚搭在右脚，[[lit-meditation|打坐]]入定。等宋江急急带着众头领赶来，鲁智深已经坐在禅椅上不动了，就这样[[lit-pass-away|圆寂]]。他留下的颂子是：',
    },
    verse: {
      zh: ['平生不修善果', '只爱杀人放火', '忽地顿开金绳', '这里扯断玉锁', '咦', '钱塘江上潮信来', '今日方知我是我'],
      en: [
        'All my life I never tended the fruit of good deeds;',
        'I only loved to kill and set fires.',
        'Suddenly the golden cord flies open;',
        'here the jade lock snaps.',
        'Ah!',
        'On the Qiantang the tide keeps its word and comes:',
        'today at last I know that I am I.',
      ],
    },
    after: {
      en: 'A brawler who “only loved to kill” dies in perfect calm. Many readers see the last line as a moment of Chan (Zen) [[lit-enlightenment|enlightenment]]: he finally sees who he really is.',
      zh: '一个“只爱杀人放火”的莽汉，走得如此安详。很多读者把最后一句看作禅宗式的[[lit-enlightenment|顿悟]]：他终于看清了自己。',
    },
  },
  {
    seal: '我是我',
    title: { en: 'The one who stayed', zh: '留下的人' },
    body: {
      en: 'Wu Song, badly wounded in the war (the book says he lost an arm), turns down honours in the capital. “I am crippled now,” he tells Song Jiang, “and I don’t wish to go to court.” He will stay at Liuhe Temple as a quiet man of the Way: “that suits me very well.” The novel adds that he lived there until he died peacefully at eighty.',
      zh: '武松在征方腊时受了重伤，“虽然不死，已成废人”，朝廷的封赏名单上写着他“折臂”。他对宋江说：“小弟今已残疾，不愿赴京朝觐。”他要留在六和寺，“已作清闲道人，十分好了”。书里还交代一句：“武松自此只在六和寺中出家，后至八十善终。”',
    },
  },
];

/* ───────────── Part 2: Poets at the river ───────────── */
export const POEMS = [
  {
    id: 'bai',
    author: { en: 'Bai Juyi', zh: '白居易' },
    title: { en: '“Remembering the South” (Yi Jiangnan), no. 2', zh: '《忆江南》其二' },
    dates: { en: 'Tang dynasty, 772–846', zh: '唐，772—846' },
    zh: ['江南忆', '最忆是杭州', '山寺月中寻桂子', '郡亭枕上看潮头', '何日更重游'],
    zhText: '江南忆，最忆是杭州。山寺月中寻桂子，郡亭枕上看潮头。何日更重游？',
    en: [
      'The South I remember,',
      'and Hangzhou I remember most:',
      'in the hill temple, under the moon, hunting for osmanthus seeds;',
      'in the prefect’s pavilion, head on my pillow, watching the crest of the tide.',
      'When will I go back again?',
    ],
    note: {
      en: 'Bai Juyi governed Hangzhou from 822 to 824 and wrote this years after he left. A local legend said that on autumn nights osmanthus seeds fell from the moon onto the hill temples. His office stood close enough to the river that he could watch the bore from his pillow.',
      zh: '白居易822年至824年任杭州刺史，这首词是他离开杭州多年后写的。当地传说，秋夜里月中的桂子会落到山寺里。他的州衙离江很近，躺在枕上就能看见潮头。',
    },
  },
  {
    id: 'pan',
    author: { en: 'Pan Lang', zh: '潘阆' },
    title: { en: '“Spring of Wine” (Jiuquanzi), no. 4 of 10', zh: '《酒泉子》（十之四）' },
    dates: { en: 'Northern Song, died around 1010', zh: '北宋，约卒于1010年前后' },
    zh: ['长忆观潮', '满郭人争江上望', '来疑沧海尽成空', '万面鼓声中', '弄潮儿向涛头立', '手把红旗旗不湿', '别来几向梦中看', '梦觉尚心寒'],
    zhText: '长忆观潮，满郭人争江上望。来疑沧海尽成空，万面鼓声中。弄潮儿向涛头立，手把红旗旗不湿。别来几向梦中看，梦觉尚心寒。',
    en: [
      'I often remember watching the tide:',
      'the whole town crowding to the river to look.',
      'As it came, it seemed the sea had emptied itself',
      'into the roar of ten thousand drums.',
      'The tide-riders stood up on the crest of the wave,',
      'red flags in their hands, and the flags stayed dry.',
      'Since I left, how often I have watched it in dreams,',
      'and woken with my heart still cold.',
    ],
    note: {
      en: 'Pan Lang wrote a set of ten songs to the tune “Jiuquanzi” remembering Hangzhou; this is the fourth. The nongchao’er (弄潮儿) in line five were young swimmers who rode into the bore holding flags. About two centuries later Zhou Mi’s memoir of the city, Wulin jiushi (武林旧事), describes hundreds of them, hair loose and bodies tattooed, carrying big silk flags whose tails hardly got wet.',
      zh: '潘阆用《酒泉子》词牌写了十首回忆杭州的词，这是第四首。第五句的“弄潮儿”是手持旗帜、迎着潮头游泳的年轻人。大约两百年后，周密在《武林旧事》里写到，数百名“吴儿善泅者”披发文身，手持大彩旗出没于浪中，“而旗尾略不沾湿”。',
    },
  },
  {
    id: 'su',
    author: { en: 'Su Shi', zh: '苏轼' },
    title: { en: 'from “Teasing the examiners to hurry their marking”', zh: '《催试官考较戏作》（节选）' },
    dates: { en: 'Northern Song, 1037–1101; written 1072', zh: '北宋，1037—1101；作于1072年' },
    zh: ['八月十八潮', '壮观天下无', '鲲鹏水击三千里', '组练长驱十万夫', '红旗青盖互明灭', '黑沙白浪相吞屠'],
    zhText: '八月十八潮，壮观天下无。鲲鹏水击三千里，组练长驱十万夫。红旗青盖互明灭，黑沙白浪相吞屠。',
    en: [
      'The tide of the eighth month, eighteenth day:',
      'no sight under heaven is as grand.',
      'Like the great Peng bird striking the water for three thousand li,',
      'like a hundred thousand armoured men charging on and on.',
      'Red flags and blue canopies flash and vanish;',
      'black sand and white waves swallow and slaughter each other.',
    ],
    note: {
      en: 'In 1072 Su Shi was deputy governor of Hangzhou and helped run the autumn examinations. The poem praises the moon and the tide, then ends by reminding his fellow examiners that candidates in white robes are waiting outside: light another candle and keep marking. The Peng is the giant bird of the Zhuangzi. The eighteenth day of the eighth lunar month is still the traditional peak of tide-watching.',
      zh: '1072年苏轼任杭州通判，参与主持秋试。诗里先写中秋月色和八月十八的潮，最后提醒同僚：“愿君闻此添蜡烛，门外白袍如立鹄”，还是点上蜡烛接着阅卷吧。“鲲鹏水击三千里”用的是《庄子》的典故。农历八月十八至今仍是传统的观潮正日。',
    },
  },
];

/* ───────────── Part 3: Translation Lab ───────────── */
export const LAB = [
  {
    id: 'chaoxin',
    source: '潮信',
    pinyin: 'cháo xìn',
    gloss: {
      en: '潮 tide · 信 message; trust, keeping your word; a fixed time',
      zh: '潮：潮水 · 信：消息；信用、守约；准时',
    },
    context: {
      en: 'Water Margin, ch. 119. The monks explain that the tide never misses its hour: “because it never breaks faith, we call it the tide’s xin.”',
      zh: '《水浒传》第一百一十九回。众僧解释：潮水从不误时，“因不失信，谓之潮信”。',
    },
    prompt: {
      en: 'How would you say 潮信 in English so that a reader feels both “on time” and “a message”?',
      zh: '“潮信”怎么译，才能让英文读者同时感到“准时”和“消息”两层意思？',
    },
    versions: [
      {
        kind: 'literal',
        text: 'the tide’s message',
        keeps: { en: 'The picture of news arriving, which matters because the tide is a message of death for Lu Zhishen.', zh: '保留了“消息到来”的画面。这很重要，因为潮对鲁智深来说正是死亡的消息。' },
        loses: { en: 'Punctuality and trust. An English reader will not hear “on time” or “keeping faith”.', zh: '丢了“准时”和“守信”。英文读者听不出潮水从不误时。' },
      },
      {
        kind: 'interpretive',
        text: 'the punctual tide',
        keeps: { en: 'Exactly what the monks explain. Clear and natural.', zh: '准确传达了众僧的解释，清楚自然。' },
        loses: { en: 'The sense of a sign or summons. “Punctual” sounds like a train timetable, not fate.', zh: '丢了“征兆、召唤”的意味。punctual 听起来像火车时刻表，而不是命运。' },
      },
      {
        kind: 'foreignising',
        text: 'chaoxin, the tide that keeps its word',
        keeps: { en: 'The Chinese word and the pun on 信 (trust, message, fixed time) that the whole scene turns on.', zh: '保留了原词，也保住了整段故事所依赖的“信”字双关（信用、消息、准时）。' },
        loses: { en: 'Smoothness. The reader meets a strange word and needs the explanation every time.', zh: '牺牲了流畅：读者遇到一个陌生词，每次都得靠解释。' },
      },
    ],
  },
  {
    id: 'nongchaoer',
    source: '弄潮儿',
    pinyin: 'nòng cháo ér',
    gloss: {
      en: '弄 play with, handle · 潮 tide · 儿 young man',
      zh: '弄：玩弄、驾驭 · 潮：潮水 · 儿：年轻人',
    },
    context: {
      en: 'Pan Lang’s song: young swimmers who rode into the bore with flags. Today 弄潮儿 also means people who lead the way in something new, as in 时代弄潮儿.',
      zh: '潘阆《酒泉子》：手持红旗、迎潮而上的年轻泳者。今天“弄潮儿”也指敢为人先、引领潮流的人，比如“时代弄潮儿”。',
    },
    prompt: {
      en: 'Translate it twice in your head: once for the Song-dynasty swimmers, once for a modern news headline. Which do you write?',
      zh: '试着在心里译两遍：一遍给宋代的泳者，一遍给今天的新闻标题。你写下哪一个？',
    },
    versions: [
      {
        kind: 'literal',
        text: 'tide-players',
        keeps: { en: 'The bold, almost reckless picture of people playing with a wall of water.', zh: '保留了与潮水嬉戏的大胆画面，甚至有点鲁莽。' },
        loses: { en: 'That it was a skilled public performance, and the modern sense of “pioneer”.', zh: '丢了这是一种高超技艺和公开表演，也没有现代“开拓者”的意思。' },
      },
      {
        kind: 'interpretive',
        text: 'tide-riders, the swimmers who met the bore holding flags',
        keeps: { en: 'What they actually did. “Riders” also links them to today’s bore surfers.', zh: '说清了他们到底做什么。riders 还能让人联想到今天的涌潮冲浪者。' },
        loses: { en: 'Brevity. It explains instead of naming.', zh: '丢了简洁：这是解释，不是名字。' },
      },
      {
        kind: 'domesticating',
        text: 'pioneers riding the wave of change',
        keeps: { en: 'The modern meaning, in an English idiom that happens to share the water image.', zh: '传达了现代引申义，而且英文习语恰好也用“浪”的意象。' },
        loses: { en: 'Hangzhou, the river and a thousand years of history. It could describe anyone, anywhere.', zh: '丢了杭州、钱塘江和一千年的历史，放在哪里、说谁都行。' },
      },
    ],
  },
  {
    id: 'liuhe',
    source: '六和',
    pinyin: 'liù hé',
    gloss: {
      en: '六 six · 和 harmony, peace, together',
      zh: '六：六 · 和：和谐、和睦、和合',
    },
    context: {
      en: 'Most sources say the pagoda was named after the Buddhist “six harmonies” (六和敬), six ways monks live together in peace: in deed, speech, mind, precepts, views and sharing. It is also written 六合 (“six directions”: heaven, earth and the four quarters).',
      zh: '多数资料说塔名取佛教“六和敬”之义，指僧团和合共处的六条：身和同住、口和无诤、意和同悦、戒和同修、见和同解、利和同均。塔又名“六合塔”，取“天地四方”之意。',
    },
    prompt: {
      en: 'You are writing the sign at the gate. What goes on it?',
      zh: '假如你来写景区门口的英文标牌，你会写什么？',
    },
    versions: [
      {
        kind: 'transliteration',
        text: 'Liuhe Pagoda',
        keeps: { en: 'The sound. It matches maps, tickets and search results, so visitors can find it.', zh: '保留读音，与地图、门票、搜索结果一致，游客找得到。' },
        loses: { en: 'All meaning. To a visitor it is just a name.', zh: '意思全没了，对游客来说只是一个名字。' },
      },
      {
        kind: 'literal',
        text: 'Pagoda of Six Harmonies',
        keeps: { en: 'The number and the idea of harmony. Memorable and poetic.', zh: '保留了“六”和“和”，好记，有诗意。' },
        loses: { en: 'What the six are. It quietly picks the Buddhist reading over “six directions”.', zh: '读者不知道“六和”是哪六条；而且悄悄选了佛教的解释，放弃了“天地四方”。' },
      },
      {
        kind: 'interpretive',
        text: 'Liuhe Pagoda, the Pagoda of Six Harmonies, named for six ways monks live in peace together',
        keeps: { en: 'Name, meaning and culture together: the usual guide’s solution on first mention.', zh: '名字、意思和文化一起交代，是讲解员第一次提到塔名时的常用做法。' },
        loses: { en: 'Too long for a sign or a map label. It works only when you have time to talk.', zh: '太长，放不进标牌和地图，只适合有时间慢慢讲的场合。' },
      },
    ],
  },
  {
    id: 'yuanji',
    source: '听潮而圆，见信而寂',
    pinyin: 'tīng cháo ér yuán, jiàn xìn ér jì',
    gloss: {
      en: '听 hear · 潮 tide · 而 and then · 圆 round, complete · 见 see · 信 sign, faith · 寂 still, silent. Together 圆寂 means a monk’s death.',
      zh: '听潮“而”圆，见信“而”寂；“圆”有圆满之意，“寂”是寂静。“圆”“寂”合起来就是“圆寂”，即僧人去世。',
    },
    context: {
      en: 'The last two lines of the riddle the Elder Zhizhen gave Lu Zhishen. The death is hidden inside the riddle, split across the two lines.',
      zh: '智真长老留给鲁智深的偈语后两句。“死”藏在谜里，被拆在两句之中。',
    },
    prompt: {
      en: 'Can your English keep it a riddle, or will you explain it?',
      zh: '你的译文能保留谜语的味道吗，还是直接把意思说破？',
    },
    versions: [
      {
        kind: 'literal',
        text: 'Hearing the tide, become round; seeing the sign, become still.',
        keeps: { en: 'The parallel shape and the mystery: it still sounds like a prophecy.', zh: '保留了对仗和神秘感，听起来仍像预言。' },
        loses: { en: 'English readers cannot see the hidden word yuanji, so “round” and “still” never add up to death.', zh: '英文读者看不出藏着的“圆寂”，round 和 still 拼不出“死”。' },
      },
      {
        kind: 'interpretive',
        text: 'When you hear the tide, your path is complete; when its sign arrives, you will pass into stillness.',
        keeps: { en: 'The meaning: his death is foretold, gently.', zh: '意思到位：委婉地预言了他的死。' },
        loses: { en: 'The riddle. It reads like an explanation, so the moment of “aha!” is gone.', zh: '谜没了。读起来像解释，鲁智深那一下“恍然大悟”也就没了。' },
      },
      {
        kind: 'foreignising',
        text: 'Hear the tide: be round. See its faith: be still. (Round + still = yuanji, the word for a monk’s death.)',
        keeps: { en: 'The split word and the pun on 信, with a note so the reader can solve it like Lu Zhishen.', zh: '保住了拆字和“信”的双关，再加一个注释，让读者像鲁智深一样解开谜底。' },
        loses: { en: 'A riddle with a footnote is no longer quite a riddle, and “see its faith” is strange English.', zh: '带注释的谜语就不太像谜语了，而且 see its faith 是很别扭的英文。' },
      },
    ],
  },
  {
    id: 'woshiwo',
    source: '今日方知我是我',
    pinyin: 'jīnrì fāng zhī wǒ shì wǒ',
    gloss: {
      en: '今日 today · 方 only now · 知 know · 我是我 I am I',
      zh: '今日：今天 · 方：才 · 知：知道 · 我是我',
    },
    context: {
      en: 'The last line of Lu Zhishen’s death verse. After a life of fighting he sees his true self: in Chan (Zen) language, he has “seen his nature”.',
      zh: '鲁智深临终颂子的最后一句。厮杀一生，终于认清了自己，用禅宗的话说就是“明心见性”。',
    },
    prompt: {
      en: '“I am I” can sound flat in English. Is that a problem, or the point?',
      zh: 'I am I 在英文里可能显得平淡。这是问题，还是恰恰是重点？',
    },
    versions: [
      {
        kind: 'literal',
        text: 'Only today do I know that I am I.',
        keeps: { en: 'The stark mirror of 我是我, which is the heart of the line.', zh: '保留了“我是我”的镜像结构，这正是这句的核心。' },
        loses: { en: 'Little in meaning, but some readers will hear a tautology rather than an awakening.', zh: '意思基本不丢，但有些读者会觉得是同义反复，而感受不到“觉悟”。' },
      },
      {
        kind: 'interpretive',
        text: 'Today, at last, I know my true self.',
        keeps: { en: 'The sense of awakening, in natural English.', zh: '用自然的英文传达了“觉悟”。' },
        loses: { en: 'The bare repetition. “True self” sounds a little like a self-help book.', zh: '丢了光秃秃的重复；true self 听起来有点像励志书。' },
      },
      {
        kind: 'domesticating',
        text: 'Today I know: I am who I am.',
        keeps: { en: 'A solemn, memorable rhythm that English readers already know.', zh: '庄重、好记，是英文读者熟悉的节奏。' },
        loses: { en: 'It echoes God’s words in the Bible (“I am that I am”), bringing the wrong religion into a Buddhist moment.', zh: '它会让人想到《圣经》里上帝的自称（I am that I am），把另一种宗教带进了一个佛教的瞬间。' },
      },
    ],
  },
  {
    id: 'bayue',
    source: '八月十八潮，壮观天下无',
    pinyin: 'bā yuè shíbā cháo, zhuàngguān tiānxià wú',
    gloss: {
      en: '八月十八 eighth month, eighteenth day (lunar calendar) · 潮 tide · 壮观 grand sight · 天下 all under heaven · 无 there is none',
      zh: '八月十八：农历八月十八日 · 潮：潮水 · 壮观：雄伟的景象 · 天下：普天之下 · 无：没有（能比的）',
    },
    context: {
      en: 'Su Shi, 1072. The date is lunar, so it falls on a different day in September or October each year. Writing “August 18” would be wrong.',
      zh: '苏轼，1072年。这是农历日期，每年落在公历九月或十月的不同日子，译成 August 18 就错了。',
    },
    prompt: {
      en: 'Keep the date, change the date, or drop the date?',
      zh: '日期是保留、换算，还是干脆不译？',
    },
    versions: [
      {
        kind: 'literal',
        text: 'The tide of the eighth month’s eighteenth day: under heaven there is no sight so grand.',
        keeps: { en: 'The exact date and “under heaven”.', zh: '保留了确切日期和“天下”。' },
        loses: { en: 'The punch of five characters per line, and readers may still think of August.', zh: '丢了五言诗的力度，而且读者仍可能以为是八月（August）。' },
      },
      {
        kind: 'domesticating',
        text: 'The great autumn tide: nothing on earth can match it.',
        keeps: { en: 'The feeling and the season, in words any English reader understands at once.', zh: '传达了气势和季节，任何英文读者一读就懂。' },
        loses: { en: 'The date itself, which is the whole reason people gathered on that day.', zh: '丢了日期本身，而人们正是为了这一天才聚到江边。' },
      },
      {
        kind: 'foreignising',
        text: 'Eighth moon, eighteenth day, the tide: in all the world, none grander.',
        keeps: { en: '“Moon” for a lunar month signals a different calendar, and the line stays short and strong.', zh: '用 moon 指农历月，提示这是另一种历法；句子短而有力。' },
        loses: { en: 'Some readers will not know that “eighth moon” means a month.', zh: '有些读者不知道 eighth moon 指的是一个月份。' },
      },
    ],
  },
];

export const KIND_LABELS = {
  literal: { en: 'Literal', zh: '直译' },
  interpretive: { en: 'Interpretive', zh: '意译' },
  foreignising: { en: 'Foreignising', zh: '异化' },
  domesticating: { en: 'Domesticating', zh: '归化' },
  transliteration: { en: 'Transliteration', zh: '音译' },
};
