# ch5 · 听潮 · Listening to the Tide

## What is here

| File | Purpose |
| --- | --- |
| `index.js` | Chapter module: header, the Lu Zhishen story beside the ink painting, the poems, the Translation Lab, `sources`. |
| `content.js` | All texts: vocabulary (9 terms, ids `lit-*`), story beats with verses, three poems, six lab items. |
| `ink.js` | Procedural ink-wash night river on a 2D canvas (pagoda on Yuelun Hill, full moon, misty hills, line-drawn water). `draw(p)` brings the bore in as a single line from the horizon toward the viewer. |
| `lab.js` | Translation Lab: tabs for six phrases, the reader's own version (localStorage), three versions with "keeps / loses" notes, TTS, "copy my translations", the domestication vs foreignisation panel. |
| `rich.js` | Bilingual paragraphs with inline `term()` buttons (`[[id|shown]]`) and `*italic*`; re-render on language change. |
| `style.css` | Everything prefixed `.ch5-`. |

### The orchestrated moment
The ink painting is sticky beside the story (on phones it pins under the top bar at ~34vh). As the
reader scrolls through five beats, the tide comes in: calm river → a line on the horizon as the
"thunder" wakes Lu Zhishen → closer during the riddle → huge as he sits down → gone, leaving churned
water, for Wu Song's ending. A vertical inscription (八月十五 / 潮信 / 听潮而圆 / 见信而寂 / 我是我)
and a red seal change with each beat. Progress is measured live with `getBoundingClientRect` on scroll
(only while visible), so it stays right when chapters above finish loading. With
`prefers-reduced-motion`, the painting jumps between five still states, one per beat.

### Progress and storage
- `markDone('ch5', 'translation-lab-tried')` after the first comparison with the reader's own text.
- `markDone('ch5', 'translation-lab')` once all six phrases have been compared.
- localStorage key `liuhe.ch5.lab` = `{ [itemId]: { text, revealed } }` (wrapped in try/catch).

## Facts and texts verified

| Claim / text | Source |
| --- | --- |
| Lu Zhishen at 六和寺: 潮信 explained as "日夜两番来，并不违时刻…因不失信，谓之潮信"; 八月十五, 三更子时; recalls 逢夏而擒、遇腊而执、听潮而圆、见信而寂 (夏侯成, 方腊); asks "如何唤做圆寂"; bathes, 御赐僧衣, sends for 宋江, writes the 颂, sits in 禅椅 in 法堂, left foot over right; the 颂 text "平生不修善果…钱塘江上潮信来，今日方知我是我" | 《水浒传》百二十回本 第119回, Wikisource |
| Wu Song: "虽然不死，已成废人"; "折臂"; "小弟今已残疾，不愿赴京朝觐"; "已作清闲道人，十分好了"; "后至八十善终" | same chapter |
| 潘阆《酒泉子》(十之四) full text, "来疑沧海尽成空" (not 尽成花) | Wikisource page 酒泉子（十之四） |
| Pan Lang's dates uncertain; Wang Zhaopeng gives 962?–1010 → we say "died around 1010" | Aisixiang (王兆鹏《北宋隐士词人潘阆生平考索》) |
| 苏轼 "八月十八潮，壮观天下无" is from 《催试官考较戏作》 (full text incl. 鲲鹏水击三千里, 组练长驱十万夫, 愿君闻此添蜡烛，门外白袍如立鹄) | Wikisource |
| Su Shi in Hangzhou as 通判 in 1072, supervising the exams | widely documented; poem's own content (examiners, candidates in white robes) |
| 白居易《忆江南》"江南忆，最忆是杭州。山寺月中寻桂子，郡亭枕上看潮头。何日更重游" | Wikisource |
| 周密《武林旧事》卷三 观潮: 吴儿善泅者数百，披发文身，手持大彩旗，旗尾略不沾湿 | Wikisource (search result for 吴儿善泅者 → 武林舊事/卷三) |
| 六和 = 六和敬; also 六合塔, "天地四方"; built 970 by 智觉禅师 to calm the tide; rebuilt 1152 | Hangzhou News 2018-09-11 |
| The six harmonies: 身和同住、口和无诤、意和同悦、戒和同修、见和同解、利和同均 | 郑振煌《六和敬》, 慧炬 2006 (NTU Buddhist library record) |
| Schleiermacher 1813 (two methods), Venuti 1995 (domestication / foreignization) | Wikipedia article, standard translation-studies facts |

All English translations of the verses and of the lab items are our own. No modern published
translation is quoted.

## Notes for the integrator
- No changes needed in shared code.
- `dev.js` has no scroll listener for the solid top bar, so in the harness text shows through the
  gradient bar above the pinned painting on phones; on the main page the bar turns solid.
- Vocabulary ids are prefixed `lit-` to avoid collisions (ch2 uses `cult-`, `trans-`).
- Tested at 1440×900, 960×760 and 375×812 in both languages; no console errors or warnings.
