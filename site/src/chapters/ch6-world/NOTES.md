# ch6 · 银龙 · The Silver Dragon Meets the World (dark theme)

## What is here

| File | What it does |
| --- | --- |
| `index.js` | Chapter module: header, intro, globe + card, funnel explanation with an SVG diagram, comparison, surfing events, "describe it to a foreign friend", quiz. |
| `content.js` | Every visible string (`{ en, zh }`), vocabulary, quiz, `sources`. |
| `bores.js` | The seven bores: position, names, sourced heights (`range`, `marks`), speed, season, status, story. |
| `globe.js` | Three.js dot globe (`createStage` + `createLabels`): ocean sphere with rim shading, halo, graticule, ~8,200 land dots, pulsing markers, labels hidden on the far side, screen-space declutter with leader lines, slerped camera turn to a marker (GSAP). |
| `landmask.js` | Generated once from Natural Earth 1:110m land (public domain): one bit per dot on 1.2° rows, 4.7 KB of base64. No runtime download. |
| `compare.js` | Two SVG river profiles side by side, same vertical scale (20 px = 1 m), with a 1.7 m person, shaded source range, dashed records; the bore front moves upstream. |
| `style.css` | All classes prefixed `.ch6-`. |

### Interactions
- **Globe markers** (and the list in the card, for keyboard and no-WebGL readers) turn the globe to the bore and open its card: local name, where, height, speed, season, status today, one-line story. "Compare this one" loads it next to the Qiantang in the comparison.
- **Compare**: two `<select>`s; "Draw the lower value / upper value" toggles the drawn height inside the sourced range. The Seine has no regular bore today, so its panel draws the 19th-century report as a dashed, faded wave and says so.
- **Quiz**: 5 bilingual questions with explanations; finishing calls `markDone('ch6', 'quiz')`; "Try the quiz again" resets.
- **Describe it**: prompt, private textarea (not stored), six phrases, four model answers (simple / vivid / explaining / comparing) with "Hear it".
- Reduced motion: no auto-rotation, no ring pulse, instant globe turns, static wave profiles.

### Vocabulary (`registerVocab('ch6', …)`, 9 terms)
`world-tidal-bore`, `world-tidal-range`, `world-equinox`, `world-dredging`, `world-causeway`, `world-funnel-effect`,
`world-river-surfing`, `world-nickname`, `world-undular-bore`. Four are used inline with `term()`.
Note for ch3 / ch7: ch3 may also register "tidal bore"; my id is `world-tidal-bore`, so there is no id clash, but the wordbook could show two "tidal bore" cards. If ch3 registers one, the integrator may want to drop mine.

## Facts checked (sources are also in `content.js` → `SOURCES`)

| Bore | Height used | Other facts | Sources |
| --- | --- | --- | --- |
| Qiantang | usually 1–2 m, sometimes > 3 m | 7.59–8.29 m/s measured; spring tides twice a month; 18th day of 8th lunar month. "Up to 9 m" in popular books is flagged: spray against sea walls can exceed 10 m and the tidal range at Ganpu reaches 8.93 m | Hangzhou News 2017-09-29; Kawanisi et al. 2017; Hohai Univ. journal 2003 (8.93 m, +126 % vs bay mouth); Britannica / Wikipedia for the 9 m claim |
| Pororoca (Amazon) | up to ~4 m | Tupi "great roar" (probable); equinoxes, March/September; São Domingos do Capim championship; Salazar 2003, 37 min, 12.5 km; Araguari bore lost since 2015 | Wikipedia Pororoca, Tidal bore |
| Severn | up to ~2 m; record 2.8 m (15 Oct 1966) | 13–21 km/h; ~130 days/yr; equinoxes; Jack Churchill 1955; Steve King ~12 km 2006 | Wikipedia Severn bore; Surfer Today |
| Seine mascaret | none today; 19th-c. reports up to 7.3 m | reached Rouen (~80 km); Caudebec-en-Caux crowds; dredging + Tancarville canal 1963; weak bores until 1971 | Chanson, mascaret page |
| Petitcodiac | 1–2 m before 1968; 5–75 cm after causeway | 5–13 km/h; gates opened 14 Apr 2010; 29 km ride, 24 Jul 2013 | Wikipedia Petitcodiac River; Chanson |
| Batang Lupar benak | ~1.5–3 m (sources vary) | Pesta Benak festival, Sri Aman | Surfer Today; Wikipedia Simanggang; Sarawak Government |
| Hooghly | ~1.5 m (1842 account) to "often over 7 ft" | felt to Naihati (~35 km above Kolkata); 19th-c. shipping reports | Wikipedia Hooghly River; Chanson; 1842 Encyclopaedia Britannica |

- **Funnel explanation**: Chanson's conditions (large tidal range; flat, converging mouth); Hangzhou Bay 100 km → 2.5 km at Yanguan (Hangzhou News); bed rises above Ganpu (People's Daily 2023); coastal reflection raises the range at Ganpu by 126 % to 8.93 m (Hohai Univ. 2003).
- **"Silver Dragon"**: NPR, 12 Sep 2014: Red Bull Qiantang Shoot Out, surfers from as far as Southern California, Jamie O'Brien and a teammate won, "10-foot" waves in the headline, boats/piers/pilings quote paraphrased (no direct quotation). 2019 Silver Dragon Shootout: 18 surfers, 9 teams, US$15,000 prize pool, France and South Africa shared the title (Surfer Today).
- **400+ estuaries with bores, every continent but Antarctica**: Wikipedia "Tidal bore" citing Chanson / Bartsch-Winkler & Lynch.
- Safety is only referred to briefly with a link to `#ch3` (ch3 owns the safety guide).

## For the integrator

- Nothing in shared code needs to change.
- The safety paragraph links to `#ch3`. In the full site this anchor exists; in `dev.html` it does nothing.
- Dev-only hook: `window.__ch6globe` (`focus(id, 0)` turns instantly).
- Regenerating `landmask.js` (only if you want a different dot density): the Python script I used samples Natural Earth `ne_110m_land.geojson` with even-odd point-in-polygon on rows `lat = -84 + k·1.2`, `n = floor(360·cos(lat)/1.2 + 0.5)` dots per row, LSB-first bits. `globe.js` decodes with the same rule and warns in dev if the dot count does not match `TOTAL`.
