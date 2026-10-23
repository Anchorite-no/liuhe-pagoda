# ch1 · 之江 · The River That Named Us (light theme)

## What is here

| File | What it does |
| --- | --- |
| `index.js` | Chapter module: header, intro, map + side panel, names, two timelines, "Say it in English". |
| `content.js` | Every visible string (`{ en, zh }`), the six places, map labels, vocabulary, `sources`. |
| `geo.js` | Real lon/lat for the river, Hangzhou Bay, islands and West Lake; projection to km plus a gentle magnifying "lens" around the pagoda (A = 1.2, s = 9 km), water signed-distance field, terrain heights. |
| `map.js` | The Three.js sand table (`createStage` + `createLabels`): terrain with contour lines, water, wooden frame, north arrow, mini pagoda / campus / bridge, six flags with screen-space label declutter and leader lines, GSAP camera flights, the 之 trace. |
| `zhi.js` | The character 之 drawn for this site as three filled brush strokes, revealed in stroke order by animated SVG masks. |
| `style.css` | All classes prefixed `.ch1-`. |

### Interactions
- **Flags** (and the always-visible list in the side panel, for keyboard and no-WebGL readers): fly the camera there and open a bilingual card. Opening all six calls `markDone('ch1', 'opened-all-places')`.
- **Trace the 之**: hides the flags, flies to a top view, draws a red line from the Fuchun River to the bay along the real bends, then writes 之 in the side panel. Calls `markDone('ch1', 'traced-zhi')`.
- Camera: drag to orbit, right-drag to pan, **Ctrl/⌘ + wheel** (or trackpad pinch) to zoom, so a plain wheel still scrolls the page. Touch: two-finger zoom; vertical swipes scroll the page (`touch-action: pan-y` on the canvas).
- Reduced motion: camera jumps, the trace and the character appear instantly.
- No WebGL: the stage is hidden, the panel list and the 之 card still work.

### Vocabulary (`registerVocab('ch1', …)`, 9 terms)
`river-estuary`, `river-funnel-bay`, `river-upstream`, `river-downstream`, `river-meander`, `river-campus`,
`river-missionary-college`, `river-double-deck-bridge`, `river-heritage-site`. Four are used inline with `term()`.

### Size
Terrain 271 × 153 vertices (~82k triangles), ~91k triangles total, ~100 draw calls. The water field takes ~30 ms once.

## Facts checked (sources are also in `content.js` → `SOURCES`)

- **Names**: 浙 / 浙江 / 之江 / 钱塘江; the province named after the river. The 浙 ↔ 折 ("to bend") link is given as a traditional explanation only; the etymology is disputed (zdic / Baidu entries, Tencent News discussion), so the text says so.
- **Old spellings**: Chekiang, Hangchow; Hangchow University; National Chekiang University (ZJU's Republican-era English name).
- **Zhijiang / Hangchow University** (Wikipedia "Hangchow University" with its references; ZJU document on the Zhijiang campus; Hangzhou News 2018):
  1845 Ningbo boys' boarding school 崇信义塾, Northern Presbyterian mission, D. B. McCartee; 1867 to Hangzhou (育英义塾); 1897 Hangchow Presbyterian College (育英书院); hill campus: **sources disagree**, the ZJU document says building began in 1908 (Robert Fitch), Hangzhou News says large-scale building began in 1909, Wikipedia says the move happened in 1911. The text gives "1908 or 1909 … moved in by 1911". 1952 dissolved in the reorganisation; 1961 campus to ZJU (Wikipedia also mentions 1958 once; the ZJU document says 1961); 2006 national heritage listing (6th batch); 22 surviving college-era buildings; now home to Guanghua Law School.
- **Qiantang River Bridge** (Guangming Online 2023, Hangzhou News 2017, 12371.cn 2019, Wikipedia/Structurae):
  start 8 Aug 1934 (Hangzhou News puts the ground-breaking ceremony on 11 Nov 1934; both are mentioned); first train 26 Sep 1937 (Structurae says 29 Sep; both are mentioned); 1,453 m with approaches, main bridge 1,072 m; blown up on orders on 23 Dec 1937, two piers and five spans destroyed; Mao Yisheng kept the records; repairs after the war, full road + rail reopening May 1953; national heritage 2006; Dorman Long built the steel superstructure, a Danish firm (康益洋行) had a pier contract. The text says "first double-deck road-and-rail bridge designed and built by Chinese engineers" is how Chinese sources describe it, and explains the foreign contracts.
- **Hangzhou Bay** (Hangzhou News 2017-09-29): mouth about 100 km (Nanhui to Zhenhai); about 2.5 km wide at Yanguan, ~130 km upstream. I dropped the often-repeated "20 km at Ganpu / 1 km at Hangzhou" because I only found it in a weak source.
- **Yanguan** (Xinhua 2023): became the classic tide-watching place in the Ming–Qing period, when the channel swung north and the Yanguan reach became straight → the "single-line tide".
- **West Lake**: UNESCO World Heritage, 2011. About 5 km north of the pagoda (from OSM coordinates).
- **Pagoda** (970, Wuyue; Southern Song brick body; Qing eaves; lamp): kept short and consistent with the plan document; ch2 and ch4 own the details.
- **Map positions**: geocoded with OpenStreetMap / Nominatim at development time (credited in `sources`). No runtime requests.

## For the integrator

- Nothing in shared code needs to change.
- Dev-only hook: `window.__ch1map` (stripped from production by `import.meta.env.DEV`). `__ch1map.jump('overview' | 'trace' | placeId)` moves the camera instantly, which is handy for screenshots.
- The chapter links readers to chapter 2 and chapter 3 in prose only (no anchors), so it does not depend on their ids.
- If the Browser pane is hidden, `requestAnimationFrame` is throttled and the GSAP flights pause until the page is visible again. That is expected.
