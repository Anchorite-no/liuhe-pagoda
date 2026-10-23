# Developer guide: 潮起六和 · Where the Tide Turns

A bilingual (English / 中文) interactive learning site about the **Liuhe Pagoda (六和塔)** and the
**Qiantang tidal bore (钱江潮)**, made for the ZJU course *Chinese Culture and International
Communication* (中国文化与国际传播). Audience: Chinese university students practising English
expression, plus international students. The site must teach culture **and** train English
expression, and it must include real 3D.

Background material (Chinese): `../六和塔方案.md` (site plan and verified facts), `../课程任务说明.md`.

## Running

```bash
npm run dev -- --port 5170 --mode main      # whole site at /
```

Single-chapter harness: `http://localhost:<port>/dev.html?ch=ch3` (`&lang=zh` to start in Chinese,
`&spacer` adds a screen of space above the chapter for scroll effects).

Parallel sessions: each chapter has its own dev-server config in `.claude/launch.json`
(`ch0` → port 5171, `ch1` → 5172 … `ch7` → 5178). Always pass `--mode <name>`; the Vite cache dir
depends on the mode so parallel servers never collide. **Do not run `vite build`** while others
work: the integrator builds at the end.

## Hard rules for chapter authors

1. **Only edit files inside your own chapter folder(s)**: `src/chapters/<chN-name>/**`. Never edit
   `src/core`, `src/three`, `src/styles`, `index.html`, `dev.html`, `package.json`,
   `.claude/launch.json` or another chapter. If you need a change in shared code, copy the helper
   into your folder and adapt it there, and write the request in your folder's `NOTES.md`.
2. **No new npm packages.** Available: `three` (incl. `three/addons/...`), `gsap` (incl.
   `gsap/ScrollTrigger`), `lunar-javascript`. Fonts are already loaded.
3. **No runtime network requests to third parties.** The site must work inside mainland China:
   no CDNs, Google Fonts, external images, iframes, YouTube, maps tiles, analytics. Plain `<a href>`
   links to sources are fine.
4. **No copyrighted media.** Generate visuals in code (Three.js, SVG, canvas) or draw them. Do not
   paste photos. Classical Chinese texts (水浒传, 苏轼, 潘阆 …) are public domain; modern published
   translations are not, so write your own English translations.
5. **Everything is bilingual.** Every visible string exists in English and Chinese. English is the
   default language. Write natural English (B2–C1 readers), not translated-sounding English. Write
   natural Chinese too.
6. **Facts must be right.** Verify with web search, prefer official / academic sources, list them in
   your module's `sources`. If sources disagree, say so in the text ("Sources give 1152 or 1165").
   Never invent quotes, numbers or people. Label illustrative reconstructions as illustrative.
7. **Accessibility and mobile.** Works at 375px wide, with touch, keyboard (all controls focusable,
   visible focus), and `prefers-reduced-motion`. Text contrast AA. 3D canvases are decorative
   (`aria-hidden`); every insight they show must also be stated in text.
8. **Performance.** Use `createStage` (renders only while on screen). Keep each scene's triangle count
   sensible (the shared landscape is ~250k triangles; the pagoda ~25k). Dispose what you create if you
   unmount. Avoid layout thrash on scroll; use GSAP ScrollTrigger or IntersectionObserver.

## Chapter module contract

`src/chapters/<folder>/index.js` default-exports:

```js
export default {
  id: 'ch3',
  ambience: { river: 0.5, wind: 0.2, rumble: 0 }, // optional sound bed while this chapter is on screen
  sources: [{ title: { en: '…', zh: '…' }, url: 'https://…', note?: { en, zh } }],
  async mount(section, { id, meta }) {
    // section is the empty <section class="chapter" data-theme="dark|light" id="ch3">.
    // Render everything into it. Called once, when the reader is ~1.5 screens away.
  },
};
```

Registered chapters (`src/chapters/registry.js` owns titles, plaque text and theme; don't edit it,
mirror it):

| id | folder | plaque | title (en / zh) | theme |
| --- | --- | --- | --- | --- |
| ch0 | ch0-prologue | 潮来 | The Eighteenth Night / 八月十八 | dark |
| ch1 | ch1-river | 之江 | The River That Named Us / 一条江，一个名字 | light |
| ch2 | ch2-why | 镇潮 | Why a Pagoda Here? / 为什么在这里建塔 | dark |
| ch3 | ch3-tide-lab | 造潮 | Make a Tide / 造一次潮 | dark |
| ch4 | ch4-structure | 明七暗六 | Thirteen Outside, Seven Inside / 外十三，内七 | light |
| ch5 | ch5-listening | 听潮 | Listening to the Tide / 听潮 | light |
| ch6 | ch6-world | 银龙 | The Silver Dragon Meets the World / 银龙与世界 | dark |
| ch7 | ch7-guide | 讲解员 | Be the Guide / 我是讲解员 | light |

Start every chapter with the shared header so the site reads as one piece:

```js
import { chapterHeader } from '../../core/ui.js';
section.append(chapterHeader({ plaque: '造潮', index: 3, title: { en: 'Make a Tide', zh: '造一次潮' }, lede: { en: '…', zh: '…' } }));
```

The section already has padding (left padding leaves room for the tide-gauge nav on desktop). Add
`section.classList.add('chapter--bleed')` if you need full-bleed and handle padding yourself.

## Shared modules

### i18n: `src/core/i18n.js`
- `register(ns, { en: {...}, zh: {...} })`, then `t('ns.key', vars)`; `tv(key)` returns arrays/objects.
- `tr({ en, zh })` resolves an inline pair. `getLang()`, `setLang()`, `onLangChange(fn)`.
- DOM binding: `data-i18n="ns.key"` (text), `data-i18n-html` (trusted HTML), `data-i18n-attr="aria-label:ns.key"`.
  After rendering, call `apply(root)` (main.js also re-applies on every language change).

### UI: `src/core/ui.js`
- `h(tag, attrs, ...children)`: element builder (`onclick`, `style` object, `class`, `html`, `text`).
- `txt(key)`, `bi({en, zh}, tag, attrs)`: text bound to the current language.
- `chapterHeader(...)`, `rangeSlider({label:{en,zh}, min, max, step, value, format, onInput})`,
  `segmented({options:[{value,label:{en,zh}}], value, onChange})`.
- `term(word, display?)`: inline vocabulary button that opens a card (EN/中文/pinyin/definition,
  pronunciation, "add to wordbook"). `speak(text, 'en'|'zh')`, `canSpeak()`.
- `reducedMotion()`, `announce(msg)` (screen-reader live region).

### Vocabulary and progress: `src/core/vocab.js`, `src/core/progress.js`
- `registerVocab('ch3', [{ id, en, zh, pinyin, def:{en,zh}, example?:{en,zh} }])`: register 5–10
  key terms per chapter. Ids must be globally unique: prefix with the topic, e.g. `tide-spring-tide`.
- `getVocab(chapter?)`, `getWordbook()`, `onWordbookChange(fn)`.
- `markDone('ch3', 'made-a-tide')` when the reader completes a key interaction; `getProgress()`.

### Audio: `src/core/audio.js`
Off until the reader turns it on. `setAmbience({river, wind, rumble})`, `bell(strength)`,
`surge(intensity, seconds)`. All calls are safe when sound is off.

### 3D: `src/three/*`
- `createStage(el, { camera:[x,y,z], target:[x,y,z], controls, fov, far, background })` (with
  `controls` the canvas gets `touch-action: pan-y`, so phones can still scroll the page) → `{ THREE,
  scene, camera, renderer, controls, onTick(fn(dt, elapsed)), render(), dispose() }` or **`null`
  if WebGL is unavailable** (then show text only). Put the element in a `.stage` container
  (`.stage--tall`, `.stage--full`).
- `createPagoda()` → `{ group, parts, tiers, storeys, height, bellPositions, setPartVisible,
  setPartOpacity, setStyle('real'|'ink'|'blueprint'), setEraColors(bool), setSection(bool, normal),
  setLamp(0..1), update(elapsed, {wind}), facePoint(tier, face, hFrac, out), shellPoint(storey, face,
  hFrac, out), sectionPlane }` (`sectionPlane` is the live clipping plane after `setSection(true)`;
  mutate it to turn the cut). Parts: `plinth`, `timber` (Qing exterior), `shell`/`core`/`floors` (Southern Song
  brick body, hidden by default), `finial` (Yuan), `lamp`. Units are metres; height ≈ 60 m; front
  face toward +Z.
- `createLandscape(scene, { preset:'dawn'|'day'|'dusk'|'night', bridge, river, hills, trees, stage })`
  → `{ river, sky, sun, hemi, terrain, bridge, setPreset(name, seconds), mixPresets(a,b,t),
  update(dt, elapsed) }`. Constants: `WATER_Y = -7`, `RIVER_NEAR = 45`, `RIVER_FAR = 1150` (river
  runs along X, south of the pagoda), `BRIDGE_X = 420`, `terrainHeight(x,z)`.
- `createRiver(opts)` → `{ mesh, setBore(i, {dir:[dx,dz], pos, height, width, wobble}), clearBores(),
  heightAt(x,z), setColors, setSun, setLamp, setReflections, setWave, update(elapsed) }`. Up to two
  bore fronts. A front sits where `dot(p, dir) = pos`; increase `pos` to move it along `dir`. The tide
  comes from the east, so use `dir: [-1, 0]` and increase `pos` from about −1500.
- `createLabels(stage)` → `add(el, Vector3)`: HTML hotspots pinned to 3D points (`.hotspot` style).
- `src/three/textures.js`: procedural canvas textures (brick, tiles, stone, glow).

## Design system (read before styling)

Palette from the subject (see `src/styles/tokens.css`): night river `--ink`, river mist `--mist`,
bore foam `--foam`, Qiantang silt `--silt`, pagoda lacquer `--lacquer`, lamp gold `--lamp`
(interactive accent only), era colours `--era-song / --era-yuan / --era-qing`. Use `var(--bg)`,
`var(--surface)`, `var(--text)`, `var(--text-muted)`, `var(--accent)`, `var(--line)` so components work
on both themes.

Type: Spectral (English serif) + Noto Serif SC (Chinese, Song typeface). Scale tokens `--fs-12 …
--fs-72`. Body 18px. Measure ≤ 66ch.

Components in `components.css`: `.ch-head`/`.plaque`, `.split` (+ `.sticky`), `.panel`,
`.panel--glass`, `.btn`, `.btn--ghost`, `.seg`, `.range`, `.stage`, `.stage__hud`, `.stage__hint`,
`.hotspot`, `.term`, `.note`, `.label`, `.prose`.

Principles:
- The 3D scene is the hero of each chapter; text panels stay quiet.
- Gold (`--accent`) marks things you can press or drag, and nothing else.
- Avoid template tells: no all-caps eyebrow labels, no "01 / 02" markers unless the content really is
  a sequence, no identical card grids with drop shadows, no gradient washes, no "→" on every button,
  no fade-up animation on every block. One orchestrated motion moment per chapter is plenty.
- Buttons say exactly what happens ("Release the tide", "Hide the timber eaves").
- Put chapter-specific CSS in your own folder (`style.css`, imported from your `index.js`) and prefix
  every class with your chapter id (`.ch3-…`) so nothing leaks.

## Definition of done for a chapter

- Mounts in `dev.html?ch=<id>` with **no console errors or warnings**, in both languages (switch
  live with the top-bar toggle; all text must update).
- Looks right at 1440×900 and 375×812 (check screenshots), keyboard-operable, reduced-motion safe.
- `sources` filled; 5–10 terms registered with `registerVocab`; at least one `markDone`.
- `NOTES.md` in your folder: what you built, facts you verified (with sources), anything the
  integrator must know or change in shared code.
