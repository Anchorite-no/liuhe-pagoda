# ch7 · 讲解员 · Be the Guide

## What is here

| File | Purpose |
| --- | --- |
| `index.js` | Chapter module, six steps: viewpoint → listener and script → record → feedback → postcard → journey. |
| `content.js` | Vocabulary (10 terms, ids `guide-*`), 4 viewpoints + free orbit, light presets, the five "moves" of a tour, three audiences with sentence starters (EN + 中文 gloss) and expressions, filler-word list. |
| `scene.js` | 3D stage: `createLandscape(scene, { preset: 'day', bridge: true, stage })` + `createPagoda()`. Glides between preset cameras with GSAP (instant with reduced motion), free orbit, Day / Dusk / Night (lamp lit), `capture()` (renders at ≥1400 px wide, reads `toDataURL` in the same tick, restores the pixel ratio). |
| `recorder.js` | `MediaRecorder` (mic requested only on click, 60 s auto-stop, Blob kept in memory, object URL for playback/download) and a Web Speech API wrapper (`en-US`, continuous, restarts after Chrome's silence timeouts). |
| `feedback.js` | Word count, pace (recorded wpm, or estimate at 130 wpm), target words (tolerates plurals, -ed/-ing, -ise/-ize), filler words, sentence length, highlighted text, short tips. |
| `postcard.js` | 1600×1000 postcard on a 2D canvas: capture on the left; "Greetings from Liuhe Pagoda", 六和塔 · 杭州, viewpoint, the reader's caption (auto-sized), signature, a drawn stamp and postmark. PNG download via `toBlob`. |
| `util.js` | `live()` text binding, TTS button, `rich()` with `term()` tokens, copy to clipboard, local state, `speakAll()`. |
| `style.css` | Everything prefixed `.ch7-`. |

### Behaviour worth knowing
- **Microphone:** only requested when "Start recording" is clicked. Audio never leaves the device.
  Clear messages for: no secure context / no MediaRecorder, permission denied, no microphone,
  start failure.
- **Live transcript is opt-in** (checkbox, off by default) because Chrome/Edge send the audio to
  Google/Microsoft. The note says so, and that it often fails in mainland China. On `network`,
  `not-allowed`, `audio-capture` etc. the recording continues and the reader is told to type. If the
  browser has no SpeechRecognition the checkbox is disabled with an explanation. The typed-script path
  works everywhere.
- **Target words:** reader's wordbook first, then words suggested for the chosen audience, ch7's guide
  words, then other chapters' registered terms (deduplicated by English). Defaults follow the
  audience until the reader ticks/unticks something.
- **Postcard:** the compact viewpoint and light controls in step 5 drive the same 3D stage; once a card
  exists it re-renders after the camera arrives. If WebGL is unavailable the card is drawn without a
  picture.
- **Journey:** reads `CHAPTERS` from `../registry.js` (import only) and `getProgress()`; wordbook with
  TTS per word, "Hear them all", "Copy as text", remove.

### Progress and storage
- `markDone('ch7', 'gave-a-tour')` when feedback runs on ≥ 20 English words (typed or transcribed).
- `markDone('ch7', 'recorded-a-tour')` when a recording of ≥ 5 s finishes.
- `markDone('ch7', 'made-a-postcard')` when a postcard is generated (or downloaded).
- localStorage key `liuhe.ch7` = `{ audience, targets, customTargets, script, caption, name }`.
  Recordings are never stored.

## Facts used (all repeated from verified material)

| Claim | Source |
| --- | --- |
| First pagoda 970, by the monk Zhijue (智觉禅师), to calm the tide; rebuilt 1152; name from 六和敬 | Hangzhou News 2018-09-11, content_7065768 (also in ch5 sources) |
| Rebuilding date disputed: 1152, or 1156–1165 → the text gives both | Hangzhou News (1152); other sources via search (1156–1165) |
| Southern Song brick body; timber exterior from the Guangxu reign (late Qing); 七明六暗 (even storeys sealed); first national heritage list 1961 | Hangzhou News 2018-09-11, content_7065675 (Guo Daiheng interview) |
| Finial Yuan; ≈ 59.9 m; octagonal; lamp at the top for boats; sumeru-base brick carvings | project plan `../六和塔方案.md` §2 (shared facts; ch2/ch4 cover them in depth) |

“One of the best-preserved brick-and-timber pagodas in China” appears only on travel sites, so it is
not used.
| Qiantang River Bridge: Mao Yisheng, opened 1937, first double-deck road-and-rail bridge designed and built by Chinese engineers, blown up December 1937, repaired after the war | project plan §1 |
| Qiantang anciently called 浙江, province named after it; zigzag course → 之江; ZJU Zhijiang campus on Yuelun Hill in Hangchow University's old buildings | project plan §1 |
| Biggest tides around the 18th day of the 8th lunar month (September–October); big tides also a few days after each new and full moon | project plan §4.2; Su Shi poem (ch5) |
| Song-dynasty crowds watching the autumn tide in Hangzhou | Pan Lang, Su Shi, Zhou Mi (ch5 sources) |

## Notes for the integrator
- Only five dev servers are allowed per folder, so the `ch7` launch config could not start while the
  other sessions were running; ch7 was tested through the `ch5` server at `/dev.html?ch=ch7`.
- `guide-tidal-bore` duplicates ch0's `tide-tidal-bore` in English. ch7 deduplicates by English in its
  lists, so both can stay; drop mine if you prefer a single entry.
- `speak()` in `core/ui.js` cancels the queue on every call, so "Hear them all" uses a local
  `speakAll()` in `util.js`. If you want it shared, a `speakQueue(list)` in `ui.js` would do.
- Tested: all viewpoints, free orbit, lights, starters → script, feedback, postcard (capture + compose
  + download button), wordbook add/remove, recording with a synthetic audio stream, the speech
  `network` error path with a mocked recogniser, denied / missing microphone paths. The real
  microphone was not triggered in testing.
- Tested at 1024×768 and 375×812 in both languages; no horizontal scroll, no console errors.
