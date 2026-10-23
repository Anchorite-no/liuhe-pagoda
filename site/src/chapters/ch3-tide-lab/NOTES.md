# ch3 · Make a Tide (造潮): notes

## What is here

| File | What it does |
| --- | --- |
| `index.js` | Chapter module: header, intro, the tide lab (stage + result + controls + estuary diagram), "Today's tide", "How a bore is made", the three shapes, the safety guide. Registers vocabulary, marks progress. |
| `model.js` | The teaching model (pure functions) and the "what changed and why" sentences. |
| `scene.js` | 3D stage: shared landscape (river, hill, 1937 bridge) + pagoda, a stone seawall with railing and ~500 spectators for scale, a mid-river sandbank (cross tide) and a 500 m dike (returning tide); the bore run, camera flights, spray, sound. |
| `diagrams.js` | SVG instruments: Sun–Earth–Moon orbit diagram, moon-phase icon, estuary "sand table" (plan view of the funnel + long profile with the sandbar and the tide wave), small shape icons. |
| `today.js` | Lunar date (lunar-javascript), moon age (mean synodic month), next spring-tide window, next lunar 8/18. |
| `content.js` | All long bilingual text, vocabulary and sources. |
| `style.css` | Chapter styles, all `.ch3-` prefixed. |

### The lab
- Controls: lunar day 1–30 (with orbit diagram and spring/neap note), season (spring equinox / summer / autumn equinox / winter), bay-mouth width 5–120 km, sandbar height 0–12 m, wind −10 (offshore NW) … +15 (onshore SE) m/s, bore shape (single line / cross / returning). "Use the real 18th of the 8th month" resets to 18 / autumn / 100 km / 10 m / calm.
- Result panel updates live: bore height, speed (m/s and km/h), tidal range at the head of the bay, a 0–5 m meter (band ≈3 m, tick 4 m), one sentence on what changed and why, a model English sentence to practise (with "Hear it" via speechSynthesis), and a collapsible "How the model works". Labelled "Teaching model, not a forecast / 教学模型，不是预报".
- "Release the tide": the bore runs from beyond the bridge, past the pagoda, as a ×20 time-lapse at the model's speed (≈11–15 s), with a camera flight (eases out of wherever the reader left the camera), `audio.surge` as it nears the pagoda, rumble ambience swelling, pagoda bells. Grabbing the canvas mid-run hands the camera back to the reader. The release button becomes "Skip to the result". The estuary diagram's wave runs from the bay mouth to the pagoda in sync.
- Reduced motion (checked at click time): no flight, no moving wave, no spray; a still frame of the bore just short of the pagoda (or the reflection in the dike pocket), with a note on the stage.
- Returning tide: the dike leans 30° downstream from the north bank, so the reflected front runs back into the pocket and slams the seawall where the crowd stands (with a splash). Cross tide: two fronts at ±26° meeting in an X just upstream of a sandbank.
- On screens < 1100 px the lab stacks (stage → result → controls → diagram) and a second Release button appears on the stage.

### Progress keys
- `markDone('ch3', 'made-a-tide')` after the first release finishes (or the first still).
- `markDone('ch3', 'all-three-shapes')` after a release with each of the three shapes.

### Vocabulary (`registerVocab('ch3', …)`, 8 terms)
`tide-spring-tide`, `tide-neap-tide`, `cal-lunar-calendar`, `tide-funnel-shaped`, `tide-sandbar`, `tide-crest`, `tide-tidal-range`, `tide-equinox`.
Also used inline (not re-registered, so they stay with ch0): `tide-tidal-bore`, `geo-upstream`, copied verbatim from ch0's definitions.

## The teaching model (model.js)

```
R0 = 4.0 m × moon × season                         tidal range at the bay mouth
moon  = (1 + 0.35·cos 2θ) / 1.35, θ = 2π(day − 1 − 2)/29.53     1 at spring tide, 0.48 at neap; peak 2 days after new/full moon
season: autumn 1.10, spring 1.00, winter 0.92, summer 0.85     (river current 0.4–1.2 m/s, used for speed)
R  = R0 × funnel × wind,  funnel = 1 + 0.9·ln(W/2.5)/ln 40,  wind = 1 + 0.02·v
h  = max(0.8, 12 − bar)                             water over the sandbar at low tide
ε  = R / h
H  = R × 0.42 × (1 − e^(−(ε−1)/1.8)) if ε > 1, else 0
c  = √(g·h₂(h+h₂)/2h) − river current,  h₂ = h + H   (bore jump speed)
```
Calibration: the real settings (day 18, autumn, 100 km, 10 m, calm) give R ≈ 8.3 m (largest tidal range ≈ 9 m), H ≈ 2.9 m (≈3 m at Yanguan in spring tides), c ≈ 8.7 m/s (31 km/h; sources give 4–8 m/s typical, up to ~10). Neap → ≈0.7 m. No sandbar → no bore. Typhoon-strength onshore wind → ≈4.2 m (largest ≈4 m). Funnel gain 1.9 at 100 km matches 3.2 m → ~6 m mouth-to-Ganpu.

## Facts verified, with sources

| Fact used | Source |
| --- | --- |
| Bay ≈100 km wide at the mouth, 18 km at Ganpu, ≈2.5 km at Yanguan, ≈1 km at Zhakou; mean tidal range 3.2 m at the mouth, ≈6 m at Ganpu; low river flow Aug–Mar | Xie & Wang 2021, *Frontiers in Earth Science*, doi:10.3389/feart.2021.782640 |
| Sandbar ≈130 km long; bed rises from ≈10 m below MSL at Zhapu to ≈1 m above near Qibao, then falls toward Fuyang (so ≈10 m high) | Xie 2018, *Anthropocene Coasts*, doi:10.1139/anc-2018-0003 |
| Largest bore ≈4 m; speed generally 4–7 m/s; Ganpu mean range 5.62 m, max 9 m; single-line, cross and returning bores | Pan & Lu 2010, ICCE, doi:10.9753/icce.v32.currents.29 |
| Bores form near Ganpu, run >100 km upstream to Wenyan at 20–30 km/h; ≈3.0 m in the Yanguan reach at spring tides; returning (back-flow) bore forms at Laoyancang | Wang, Pan & Chen 2022, *China Ocean Engineering*, doi:10.1007/s13344-022-0059-y |
| 天时/地利/风势; average 5–7 m/s, up to 10 m/s; 一线潮 at Yanguan, 交叉潮 at Daquekou, 回头潮 at Laoyancang, Xiaoshan Meinüba (and Jiuxi); safety advice incl. hold on, crouch, protect your head, call 110 | Guangming Online 2026-09-24, m.gmw.cn/2026-09/24/content_1304567856.htm |
| How each shape forms (sandbanks downstream → cross tide; sharp bend / dam → returning) | People's Daily 2023-09-18 |
| 1993: "nearly 60" killed watching | NPR 2014, "Riding the Silver Dragon" |
| 3 Oct 1993: 86 swept away, 19 bodies recovered, 40 never found (19 + 40 = 59, consistent with NPR) | Irish Examiner 2007 quoting Xinhua |
| Onshore / typhoon winds push water into Hangzhou Bay | Zhang et al. 2012, doi:10.5772/28153 |
| Spring tides at new/full moon, neap at quarters | NOAA Ocean Service |

Where sources disagree the page gives ranges ("What the sources say" box) and a "Check the claim" note: the popular "9 m bore" is really the largest tidal range at Ganpu. Things I could not verify and therefore did not state: the exact length of the Laoyancang dike (press says "600-odd metres"; the text only says "a long dike"), whether particular viewing spots are open this year (the text says "some close in some seasons").

## For the integrator: shared code

1. **Bore-front masks in `createRiver` (please add).** The returning tide needs a reflected front that exists only on the dike's side, and the incoming front hidden in the dike's shadow. `scene.js → addFrontMasks()` patches the shared river material at runtime:
   - adds `uniform vec4 uMaskA[N], uMaskB[N]; uniform float uMaskInv[N];` and `float frontMask(vec2 p, int i)` right after `uniform float uWobble[N];`
   - multiplies `H *= frontMask(p, i)` right after `float H = uHeight[i]; if (H <= 0.0) continue;` in `boreH`.
   Each mask is a half-plane `[nx, nz, c, soft]` (front kept where `dot(p, n) > c`, smooth over `soft` m); a front is kept inside both (or outside both if `uMaskInv`). If either of those two shader lines changes, the patch fails safely (one `console.info`), and the returning tide shows unmasked infinite fronts. A native option like `setBore(i, { mask: { a, b, invert } })` (and the same factor in the CPU `heightAt`) would let me drop the patch.
2. **Touch scrolling over stages.** OrbitControls sets `touch-action: none` on the canvas, which traps page scrolling on phones. I set `renderer.domElement.style.touchAction = 'pan-y'` on my canvas (vertical swipes scroll, horizontal drags orbit). Consider doing this in `createStage` for every chapter.
3. **Vocabulary overlaps to resolve site-wide:** ch6 registers `world-equinox` and `world-tidal-range` (I register `tide-equinox`, `tide-tidal-range`); ch1 registers `river-funnel-bay` (≈ my `tide-funnel-shaped`) and `river-upstream` (≈ ch0's `geo-upstream`). I dropped my seawall term because ch2 has `eng-seawall`.
4. `window.__ch3` (the scene object, with a `pose(result, p)` helper that freezes a run at progress p) is exposed for debugging, like `window.__ch0`. Remove if you prefer.

## Checked
- `dev.html?ch=ch3` and `&lang=zh`, live language switching (only the plaque and the deliberate alt-language shape names stay in the other language), 1440×900 and 375×812 (no horizontal scroll), all three shapes, skip, reduced-motion still, both progress keys, no console errors or warnings.
- Not checked on a real phone or with a screen reader; TTS needs a browser voice.
