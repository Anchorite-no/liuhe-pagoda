# ch4 · 明七暗六 · Thirteen Outside, Seven Inside / 外十三，内七

Light theme. The architecture chapter and the main 3D showpiece of the building.

## What is built

| File | What it does |
| --- | --- |
| `index.js` | Module: header (index 4), intro (eave vs storey vs eave tier), lab, carvings, Liang, timeline, "Say it in English", `sources`, screen-reader summary of the 3D view. `ambience: { river: 0.3, wind: 0.25 }`. |
| `lab.js` | The signature interaction. Sticky 3D stage (shared `createPagoda`) plus three panels: **Peel the pagoda** (peel slider + "Peel it for me" GSAP moment, "Colour by dynasty" switch with `--era-*` legend, "Cut it open" section switch, Real / Ink / Blueprint), **Climb the tower** (13-rung ladder drawn like the tower's taper; 7 walkable buttons, 6 hatched sealed rungs; camera steps storey by storey with a cutaway, a 1.7 m visitor figure for scale, floor highlight and sealed-tier band), **Look closer** (5 points of interest, also hotspots on the model, each opening an info card that flies the camera there). |
| `scene.js` | Light misty setting: ground, octagonal terrace, path, ~70 instanced trees, three rings of fogged hills; palettes for real / ink / blueprint and a dusk blend used by the lamp demo. |
| `cutfill.js` | Section "poché": solid bands drawn on the cut so wall thickness, corridor, floor slabs and the inner wall + chamber read clearly. Turns with the section plane. |
| `carvings.js` | SVG Sumeru plinth with a carved waist; 6 motif illustrations (flying apsara, child on a lotus, phoenix, lion, pomegranate scroll, lotus), drawn by us, labelled as illustrations. |
| `liang.js` | Liang Sicheng's what-if: two SVG elevations (today 13 eaves ↔ Song-style 7 eaves with balcony platforms), wipe slider + drag; labelled as an illustrative interpretation. Proportions come from the same tier layout as `pagoda.js`. |
| `timeline.js` | Horizontal, keyboard-scrollable timeline (970 → today), era-coloured bars. |
| `vocab.js` | 9 terms, ids prefixed `arch-`: eave, storey, bracket set (dougong), finial, brick core, cross-section, Sumeru plinth, wind-bell, balcony platform (pingzuo). |
| `rich.js` | Bilingual paragraphs with inline `term()` buttons: `[[id|shown text]]`, `_italic_`; re-renders on language change. |
| `style.css` | All classes prefixed `.ch4-`. |

Progress: `markDone('ch4', 'peeled')` when the peel reaches 98 %; `markDone('ch4', 'climbed')` on reaching storey 7.

Interaction details:
- The section plane turns with the camera so the cut always faces the reader (we steer the plane object the pagoda's materials share; see requests below).
- Turning the cut on flies to a closer view of the lower storeys; climbing forces the cut on and restores the reader's choice on leaving.
- Hotspots hide while climbing, while a card is open, and (bells, eaves) once the timber is mostly peeled.
- Lamp card: "Light the lamp" blends the setting to dusk and lights `setLamp(1)`; it goes out when the card closes.
- Bells card: "Ring the bells" calls `audio.bell()` and gusts the wind (sound only if the reader turned it on; the card says so).
- Touch: the canvas uses `touch-action: pan-y`, so vertical swipes scroll the page and horizontal drags turn the tower. Zoom is off (no wheel hijacking).
- ≤1099 px: one column; the stage cell is sticky under the top bar (52svh, 46svh on phones) and the panels scroll under it. On phones the climb buttons and readout come before the ladder.
- Reduced motion: camera moves and the peel jump instead of animating; bells do not sway; CSS transitions off.
- WebGL missing: `createStage` returns null, the panels and all text still work.

Checked in `dev.html?ch=ch4` at 1440×900, 800×600 and 375×812, EN and 中文 switched live; keyboard (hotspot → Enter opens card, focus moves to its title, Tab reaches its actions, Esc closes and returns focus); no console errors or warnings. Scene ≈ 64k triangles including the shadow pass, ~24 draw calls.

## Facts verified (and how they are worded)

- **Founded 970** (北宋开宝三年) by the Chan master 智觉禅师延寿 (Zhijue, i.e. Yanshou) on the Qian family's southern orchard, to calm the tide. 《咸淳临安志》 as quoted on Maigoo: "智觉禅师延寿始于钱氏南果园开山建塔……以镇江潮，塔高九级，五十余丈". Some popular pages write 智元禅师; we follow the Song gazetteer. Hangzhou News 2022 names Qian Hongchu as the one who proposed it. Site text: "A Song gazetteer says it had nine storeys."
- **Destroyed 1121** (宣和年间) in war (Wikipedia; Hangzhou gov.; Maigoo 宣和三年). One travel page says 宣和五年; we say "1121 … at the end of the Northern Song".
- **Southern Song rebuild**: sources disagree. Start 1152 (绍兴二十二年), 1153 (二十三年, Hangzhou News 2022), 1154 (二十四年, Dahepiao) or 1156 (二十六年, Maigoo); finish 1163 (隆兴元年) or 1165 (乾道元年; Hangzhou gov., Wikipedia). Site text says exactly that.
- **Seven-storey brick body is Southern Song; finial is Yuan; timber exterior is Qing** (Guangming 2025; Hangzhou News 2018/2022; The Paper 2020).
- **Qing timber exterior**: 光绪二十五年 (1899) or 二十六年 (1900), paid for by 朱智 (Zhu Zhi), a Hangzhou man (Hangzhou News 2022; Guangming 2025; Maigoo gives both years). Site: "1899–1900", "Sources give 1899 or 1900".
- **七明六暗**: 13 exterior tiers; odd tiers open onto the brick body, even tiers sealed (Hangzhou News 2018, The Paper 2020). The sealed tiers sit where a Song tower had open 平座 balconies that the late-Qing rebuild boxed in (Tencent News 2020 and the Liang sources below).
- **Double-tube structure**: outer wall, corridor (回廊), inner wall, central chamber (塔心室) (Hangzhou News 2022; Guangming "双套筒"). Our 3D core is a solid prism; the poché draws an inner wall round a chamber (illustrative thickness 1.5 m).
- **Height 59.89 m** (Hangzhou government English site; Maigoo; Tencent 2020).
- **104 wind-bells**: Maigoo "塔檐翘角上挂了104只铁铃" = 13 eaves × 8 corners; `pagoda.bellPositions.length` is also 104. Popular source only; no official count found.
- **Lamp / lighthouse**: Maigoo "塔的顶层装有明灯，为夜晚航行的船只指路"; Hangzhou News 2022 attributes the record to 张岱; Joseph Needham (via Wikipedia) said it served as a lighthouse almost from the start. Site says "Old accounts say…".
- **Lightning rod 1957** on the cast-iron gourd at the top (Hangzhou News 2018, content_7065768_3: "1957年，在塔顶生铁葫芦上安装了“屮”形避雷针").
- **Brick carvings**: on the waists (束腰) of the Sumeru plinths along the inner walls and the corridor; figures, flying immortals, flowers (pomegranate, lotus, 宝相), birds (phoenix, peacock, parrot), beasts (lion, qilin) (Maigoo; Hangzhou News 2022; Guangming names 化生童子 and phoenix). Count: 174 groups (Dahepiao) vs "200多处" (Maigoo); site says both. Match with the Yingzao Fashi: "大部分" (Guangming), "部分式样…如出一辙" (Dahepiao); site says "many".
- **Yingzao Fashi**: completed 1100, printed 1103 (China Oldenburg). Its 彩画作 flower list starts 海石榴华, 宝相华, 莲荷华 (found in two articles quoting 卷十四). "飞仙" and "化生" as manual categories are from my reading of 卷十二/十四; I could not fetch the original text online — worth a check against a printed edition.
- **National protection**: first batch of 全国重点文物保护单位, State Council, 1961 (Hangzhou News 2018). The date 4 March 1961 appears only on a travel page, so the site gives the year only.
- **1991 repair** led by Guo Daiheng (郭黛姮, Tsinghua; a former student of Liang Sicheng), "整旧如旧" (Hangzhou News 2018; The Paper 2020).

### Liang Sicheng's plan: what is confirmed vs. our interpretation

Confirmed (Hangzhou News 2012, Tencent News 2020, Douban table of contents): 《杭州六和塔复原状计划》, 《中国营造学社汇刊》 vol. 5 no. 3, March 1935; invited in 1934 by Zeng Yangfu (曾养甫), Zhejiang construction commissioner; >10 days of survey; brick body judged genuine Southern Song, matching the Yingzao Fashi; he called the present state "名塔莫大的委曲" and the 13-eave timber body "肥矮"; drawings = coloured restoration view, elevation, section, plan of each storey, roof plan; the restored view shows open 平座 on tiered brackets with railings and deep upturned eaves; seven storeys; never carried out (Zeng transferred to Guangdong; war from 1937).

Our interpretation (labelled on the page): the exact proportions, the bracket rhythm, the door on every storey and the absence of a 平座 on the ground storey are ours. We have not seen the original drawings. If someone can check the 1935 plates (or 《梁思成全集》), the SVG in `liang.js` is easy to adjust.

## Requests / notes for the integrator

1. **`pagoda.js`: expose the section plane.** We steer the plane by reading `pagoda.parts.plinth.children[0].material.clippingPlanes[0]` after `setSection(true)` (`lab.js`, `applySection`). It works because every material shares one array, but it is an internal detail. A `pagoda.sectionPlane` getter (or `setSectionNormal(v)` that mutates without `needsUpdate`) would make it official.
2. **`pagoda.js`: `setStyle` / `setEraColors` reset the ink outlines without looking at part opacity**, so a half-peeled timber shows black outlines after a style change. We call `setPartOpacity('timber', …)` again after every style change as a workaround.
3. Section caps: if other chapters want a readable cut, `cutfill.js` could move into `src/three/` (it only needs `pagoda.storeys`).
4. **`stage.js`: OrbitControls sets `touch-action: none` on the canvas**, which traps vertical swipes on phones. We set `renderer.domElement.style.touchAction = 'pan-y'` after `createStage`. Consider doing this in `createStage` for every chapter.
5. Dev only: `window.__ch4` (stage, pagoda, state, `frame(n)` to step frames when the preview tab is in the background) exists under `import.meta.env.DEV` and is stripped from the build.
6. Dev harness: because `registry.js` dynamically imports every chapter, a save in any chapter folder triggers a full reload in every running dev server. Harmless, but it explains sudden reloads during parallel work.
7. Sources: 13 entries in `sources`; the Liang, lamp, bell and carving facts above rely partly on news and encyclopedia pages, so the wording hedges where they disagree.
