/**
 * "Carved in brick": a Sumeru plinth with a carved waist, drawn in SVG.
 * The motifs are our own line illustrations of the motif TYPES the sources list
 * (figures, flying apsaras, flowers, birds and beasts). They are not copies of
 * particular carvings in the pagoda, and the UI says so.
 */
import { h, bi, segmented } from '../../core/ui.js';
import { tr } from '../../core/i18n.js';
import { rich, onLang } from './rich.js';

const NS = 'http://www.w3.org/2000/svg';

/* Each motif is drawn in a 200 × 100 box. `fill` = raised relief, `line` = cut line. */
const MOTIFS = [
  {
    id: 'apsara',
    name: { en: 'Flying apsara', zh: '飞天' },
    text: {
      en: 'A heavenly being who flies without wings, carried by streaming scarves. The Song manual calls such figures “flying immortals” (飞仙).',
      zh: '不用翅膀、只凭飘带凌空飞行的天人。《营造法式》里把这类形象称作“飞仙”。',
    },
    svg: `
      <path class="l" d="M64 46 C62 30 76 18 96 18 C118 18 128 30 150 26 C166 23 176 14 192 10" stroke-width="5"/><path class="r" d="M64 46 C62 30 76 18 96 18 C118 18 128 30 150 26 C166 23 176 14 192 10" stroke-width="2.4"/>
      <path class="l" d="M86 60 C98 78 124 84 146 76 C164 70 178 72 194 84" stroke-width="5"/><path class="r" d="M86 60 C98 78 124 84 146 76 C164 70 178 72 194 84" stroke-width="2.4"/>
      <path class="f" d="M78 50 C92 53 108 50 124 42 C130 39 136 40 140 44 C134 50 128 54 120 58 C104 66 90 67 80 61 Z"/>
      <path class="c" d="M88 58 C100 60 112 56 124 48 M96 63 C108 63 120 57 131 50"/>
      <path class="f" d="M138 42 C142 39 147 40 149 43 C146 46 141 46 138 44 Z"/>
      <path class="f" d="M59 44 C64 39 72 42 78 48 C82 52 83 58 79 61 C72 61 64 55 60 49 Z"/>
      <path class="c" d="M61 45 C64 47 68 47 71 45"/>
      <path class="l" d="M64 48 C58 53 50 55 42 53" stroke-width="4.4"/><path class="r" d="M64 48 C58 53 50 55 42 53" stroke-width="2.1"/>
      <path class="l" d="M73 46 C77 40 81 36 85 30" stroke-width="4.4"/><path class="r" d="M73 46 C77 40 81 36 85 30" stroke-width="2.1"/>
      <path class="f" d="M40 53 C34 49 34 41 38 36 C42 40 44 47 40 53 Z"/>
      <path class="f" d="M37 53 C31 53 27 49 27 45 C31 46 35 49 37 53 Z"/>
      <path class="f" d="M42 53 C47 51 49 47 49 43 C46 45 43 49 42 53 Z"/>
      <circle class="f" cx="58" cy="36" r="7"/>
      <ellipse class="f" cx="55" cy="27.5" rx="4.2" ry="3.4"/>
      <path class="c" d="M52 33 C54 30 60 29 64 32"/>
      <g transform="translate(10 84) scale(1.0)"><path class="f" d="M0 0 C0 -7 9 -9 12 -4 C14 -10 24 -10 26 -4 C30 -8 38 -6 38 0 C38 4 34 6 30 5 L6 5 C2 5 0 3 0 0 Z"/><path class="c" d="M10 2 C10 -2 16 -2 16 1 C16 3 13 3 13 1 M24 1 C24 -3 30 -3 30 0"/></g>
      <g transform="translate(150 92) scale(0.8)"><path class="f" d="M0 0 C0 -7 9 -9 12 -4 C14 -10 24 -10 26 -4 C30 -8 38 -6 38 0 C38 4 34 6 30 5 L6 5 C2 5 0 3 0 0 Z"/><path class="c" d="M10 2 C10 -2 16 -2 16 1 C16 3 13 3 13 1 M24 1 C24 -3 30 -3 30 0"/></g>`,
  },
  {
    id: 'child',
    name: { en: 'Child on a lotus', zh: '化生童子' },
    text: {
      en: 'In Buddhist art a soul reborn in paradise appears as a child rising from a lotus. The Song manual lists such “transformation-born” figures (化生) among its carved figures.',
      zh: '佛教艺术里，往生净土的人从莲花中化生，表现为莲花上的孩童。《营造法式》把“化生”列为雕刻的人物题材之一。',
    },
    svg: `
      <path class="c" d="M10 92 C14 72 30 62 46 66 C56 68 58 78 50 80 C44 81 42 74 48 74"/>
      <path class="f" d="M30 63 C26 55 30 49 36 47 C38 53 36 59 30 63 Z"/>
      <path class="f" d="M16 78 C8 76 4 70 6 66 C12 68 16 72 16 78 Z"/>
      <path class="c" d="M190 92 C186 72 170 62 154 66 C144 68 142 78 150 80 C156 81 158 74 152 74"/>
      <path class="f" d="M170 63 C174 55 170 49 164 47 C162 53 164 59 170 63 Z"/>
      <path class="f" d="M184 78 C192 76 196 70 194 66 C188 68 184 72 184 78 Z"/>
      <path class="f" d="M70 90 C62 86 56 84 50 86 C56 92 64 94 72 93 Z"/>
      <path class="f" d="M130 90 C138 86 144 84 150 86 C144 92 136 94 128 93 Z"/>
      <path class="f" d="M68 93 C70 81 84 75 100 75 C116 75 130 81 132 93 Z"/>
      <path class="c" d="M84 93 C82 85 86 79 92 77 M100 93 L100 76 M116 93 C118 85 114 79 108 77"/>
      <path class="f" d="M92 75 C90 69 90 63 94 59 L100 61 C99 67 98 71 98 75 Z"/>
      <path class="f" d="M104 60 L110 58 C116 62 120 66 123 71 C119 73 114 71 110 67 Z"/>
      <path class="f" d="M88 60 C86 50 88 43 94 39 L106 39 C112 43 114 50 112 60 C106 64 94 64 88 60 Z"/>
      <path class="c" d="M94 43 L100 40 L106 43 L100 55 Z"/>
      <path class="l" d="M108 43 C116 37 120 29 122 21" stroke-width="4.4"/><path class="r" d="M108 43 C116 37 120 29 122 21" stroke-width="2.1"/>
      <path class="l" d="M92 45 C86 47 82 51 80 57" stroke-width="4.4"/><path class="r" d="M92 45 C86 47 82 51 80 57" stroke-width="2.1"/>
      <path class="c" d="M122 21 C124 15 130 11 138 11"/>
      <path class="f" d="M138 11 C146 4 160 6 165 14 C157 19 145 19 138 11 Z"/>
      <path class="c" d="M140 11 C148 11 156 12 163 14 M148 11 L151 7 M154 12 L158 9"/>
      <path class="f" d="M80 57 C74 55 72 49 74 45 C78 49 80 53 80 57 Z"/>
      <circle class="f" cx="100" cy="29" r="10"/>
      <path class="f" d="M97 19 C96 14 100 12 102 14 C102 17 100 19 98 20 Z"/>
      <path class="f" d="M90 25 C86 22 86 18 89 17 C91 19 92 22 91 25 Z"/>
      <circle class="d" cx="97" cy="29" r="1.1"/>
      <circle class="d" cx="104" cy="29" r="1.1"/>
      <path class="c" d="M98 33.5 C99.5 34.5 101.5 34.5 103 33.5"/>`,
  },
  {
    id: 'phoenix',
    name: { en: 'Phoenix', zh: '凤凰' },
    text: {
      en: 'The king of birds, with a crest and a long sweeping tail: a sign of peace and good government. Peacocks and parrots appear on the plinths too.',
      zh: '百鸟之王，头有冠羽、尾羽修长，象征太平盛世。塔内须弥座上还刻有孔雀、鹦鹉。',
    },
    svg: `
      <path class="l" d="M80 62 C60 54 36 44 16 46" stroke-width="5"/><path class="r" d="M80 62 C60 54 36 44 16 46" stroke-width="2.4"/>
      <path class="l" d="M82 66 C62 70 40 78 22 88" stroke-width="5"/><path class="r" d="M82 66 C62 70 40 78 22 88" stroke-width="2.4"/>
      <path class="l" d="M86 68 C74 80 58 92 42 96" stroke-width="4"/><path class="r" d="M86 68 C74 80 58 92 42 96" stroke-width="1.9"/>
      <path class="f" d="M6 44 C10 36 20 36 24 44 C20 52 10 52 6 44 Z"/>
      <circle class="d" cx="15" cy="44" r="2"/>
      <path class="f" d="M12 88 C16 80 26 80 30 86 C26 94 16 95 12 88 Z"/>
      <circle class="d" cx="21" cy="87.5" r="2"/>
      <path class="f" d="M34 96 C38 90 46 90 49 94 C45 99 38 100 34 96 Z"/>
      <path class="c" d="M40 50 C38 46 40 42 44 42 M52 54 C50 50 52 46 56 46 M34 82 C32 78 34 74 38 74 M50 76 C48 72 50 68 54 68"/>
      <path class="f" d="M74 60 C78 48 96 44 110 50 C118 54 120 64 114 70 C104 76 86 74 76 68 Z"/>
      <path class="c" d="M84 66 C92 70 102 70 110 64"/>
      <path class="f" d="M86 52 C80 38 84 20 98 10 C99 22 104 34 112 44 C104 48 94 50 86 52 Z"/>
      <path class="f" d="M92 50 C86 40 88 28 96 22 C97 32 100 40 106 46 Z"/>
      <path class="c" d="M92 46 C92 36 95 26 99 18 M99 48 C100 40 102 32 106 26"/>
      <path class="f" d="M110 52 C118 44 120 34 126 28 C130 24 136 24 139 28 C135 31 131 36 129 42 C126 50 120 56 114 60 Z"/>
      <path class="f" d="M138 26 L149 29 L139 32 Z"/>
      <path class="c" d="M134 25 C134 17 140 13 147 13 M131 25 C129 17 132 11 137 7"/>
      <circle class="d" cx="134.5" cy="28" r="1.4"/>
      <path class="c" d="M100 72 L98 84 L92 88 M98 84 L104 88 M108 70 L110 82 L106 88 M110 82 L116 86"/>
      <g transform="translate(150 70) scale(1.0)"><path class="f" d="M0 0 C0 -7 9 -9 12 -4 C14 -10 24 -10 26 -4 C30 -8 38 -6 38 0 C38 4 34 6 30 5 L6 5 C2 5 0 3 0 0 Z"/><path class="c" d="M10 2 C10 -2 16 -2 16 1 C16 3 13 3 13 1 M24 1 C24 -3 30 -3 30 0"/></g>
      <g transform="translate(158 40) scale(0.7)"><path class="f" d="M0 0 C0 -7 9 -9 12 -4 C14 -10 24 -10 26 -4 C30 -8 38 -6 38 0 C38 4 34 6 30 5 L6 5 C2 5 0 3 0 0 Z"/><path class="c" d="M10 2 C10 -2 16 -2 16 1 C16 3 13 3 13 1 M24 1 C24 -3 30 -3 30 0"/></g>`,
  },
  {
    id: 'lion',
    name: { en: 'Lion', zh: '狮子' },
    text: {
      en: 'Lions are not native to China, so carvers worked from imagination: a curly mane, a playful pose, often a ribbon ball. Qilin, the scaly unicorn-like beast, appears beside them.',
      zh: '中国本土不产狮子，工匠多凭想象来刻：卷曲的鬃毛、嬉戏的姿态，常常还配一只绣球。旁边还刻有麒麟。',
    },
    svg: `
      <path class="l" d="M36 66 C46 58 50 50 46 44" stroke-width="3.6"/><path class="r" d="M36 66 C46 58 50 50 46 44" stroke-width="1.7"/>
      <path class="l" d="M16 80 C10 86 6 88 2 86" stroke-width="3.6"/><path class="r" d="M16 80 C10 86 6 88 2 86" stroke-width="1.7"/>
      <circle class="f" cx="26" cy="72" r="11"/>
      <path class="c" d="M15 72 H37 M26 61 V83 M18.5 64.5 L33.5 79.5 M33.5 64.5 L18.5 79.5"/>
      <path class="f" d="M132 64 C136 72 142 80 150 84 L156 82 C152 76 150 70 152 62 Z"/>
      <path class="f" d="M144 62 C152 68 160 72 168 72 L170 68 C164 66 160 62 158 56 Z"/>
      <path class="f" d="M78 60 C72 68 62 76 52 80 L50 76 C58 70 64 62 68 54 Z"/>
      <path class="f" d="M92 64 C90 72 86 80 80 86 L86 88 C94 82 98 74 100 66 Z"/>
      <path class="f" d="M68 46 C82 34 116 32 138 38 C154 42 162 52 158 62 C154 70 140 70 128 68 C112 66 94 68 82 64 C72 60 66 54 68 46 Z"/>
      <path class="c" d="M88 40 c2 -4 7 -4 8 0 c1 -4 6 -4 7 0 M108 36 c2 -4 7 -4 8 0 c1 -4 6 -4 7 0 M130 38 c2 -4 7 -3 7 1 M86 62 C102 66 120 66 136 64"/>
      <circle class="f" cx="50" cy="79" r="3.6"/><circle class="f" cx="83" cy="87" r="3.6"/>
      <circle class="f" cx="153" cy="83" r="3.6"/><circle class="f" cx="169" cy="70" r="3.6"/>
      <path class="c" d="M72 62 c-3 2 -3 6 0 7 M140 68 c3 2 3 6 0 7"/>
      <path class="l" d="M158 48 C168 40 170 30 164 22" stroke-width="4.2"/><path class="r" d="M158 48 C168 40 170 30 164 22" stroke-width="2.0"/>
      <path class="c" d="M164 22 c-4 -4 2 -10 6 -6 c3 3 -1 7 -3 4 M170 32 c4 -3 9 1 6 5 c-2 3 -6 1 -4 -1 M167 42 c5 0 7 5 3 7"/>
      <circle class="f" cx="60" cy="41" r="19"/>
      <path class="c" d="M41.2 38.4 a2.5 2.5 0 1 1 5 0 a1.4 1.4 0 1 1 -2.8 0 M45.5 29.7 a2.5 2.5 0 1 1 5 0 a1.4 1.4 0 1 1 -2.8 0 M53.9 24.9 a2.5 2.5 0 1 1 5 0 a1.4 1.4 0 1 1 -2.8 0 M63.6 25.7 a2.5 2.5 0 1 1 5 0 a1.4 1.4 0 1 1 -2.8 0 M71.1 31.7 a2.5 2.5 0 1 1 5 0 a1.4 1.4 0 1 1 -2.8 0 M74.0 41.0 a2.5 2.5 0 1 1 5 0 a1.4 1.4 0 1 1 -2.8 0 M71.1 50.3 a2.5 2.5 0 1 1 5 0 a1.4 1.4 0 1 1 -2.8 0 M63.6 56.3 a2.5 2.5 0 1 1 5 0 a1.4 1.4 0 1 1 -2.8 0 M53.9 57.1 a2.5 2.5 0 1 1 5 0 a1.4 1.4 0 1 1 -2.8 0 M45.5 52.3 a2.5 2.5 0 1 1 5 0 a1.4 1.4 0 1 1 -2.8 0 M41.2 43.6 a2.5 2.5 0 1 1 5 0 a1.4 1.4 0 1 1 -2.8 0"/>
      <circle class="f" cx="60" cy="42" r="12.5"/>
      <circle class="f" cx="55" cy="39" r="3.2"/><circle class="f" cx="65" cy="39" r="3.2"/>
      <circle class="d" cx="55" cy="39" r="1.4"/><circle class="d" cx="65" cy="39" r="1.4"/>
      <path class="c" d="M50 34 C52 32 55 32 57 34 M63 34 C65 32 68 32 70 34"/>
      <path class="f" d="M57 44 C57 42 63 42 63 44 C63 46.5 57 46.5 57 44 Z"/>
      <path class="c" d="M54 49 C57 52 63 52 66 49"/>`,
  },
  {
    id: 'pomegranate',
    name: { en: 'Pomegranate scroll', zh: '海石榴花' },
    text: {
      en: 'A winding vine with leaves and fruit full of seeds, a wish for many children. It is the first of the flower patterns in the Song manual’s painting chapter (海石榴华).',
      zh: '缠绕的枝蔓间结着多籽的石榴，寓意多子多福。《营造法式》彩画作的花纹，第一品就是“海石榴华”。',
    },
    svg: `
      <path class="l" d="M0 58 C24 26 52 26 76 56 S126 88 150 56 S184 26 200 40" stroke-width="5.2"/><path class="r" d="M0 58 C24 26 52 26 76 56 S126 88 150 56 S184 26 200 40" stroke-width="2.5"/>
      <path class="c" d="M30 38 C34 30 42 28 46 32 C48 35 45 38 42 36 M112 76 C116 84 124 86 128 82 C130 79 127 76 124 78 M172 34 C168 26 160 24 156 28"/>
      <path class="f" d="M22 40 C14 30 16 20 24 16 C30 24 30 34 22 40 Z"/>
      <path class="f" d="M14 50 C6 48 2 42 4 38 C10 40 14 44 14 50 Z"/>
      <path class="f" d="M50 33 C58 23 68 21 74 25 C70 33 60 37 50 33 Z"/>
      <path class="f" d="M96 76 C88 86 78 90 70 86 C74 78 84 74 96 76 Z"/>
      <path class="f" d="M106 80 C104 90 98 96 92 96 C92 88 98 82 106 80 Z"/>
      <path class="f" d="M160 46 C156 36 160 26 168 22 C172 32 170 40 160 46 Z"/>
      <path class="f" d="M184 30 C190 20 198 18 200 22 C198 30 192 34 184 30 Z"/>
      <path class="c" d="M22 38 L23 20 M52 32 L72 25 M94 77 L72 85 M161 44 L167 25"/>
      <circle class="f" cx="62" cy="62" r="12"/><path class="f" d="M56 52 L58 45 L61 50 L64 45 L66 50 L69 46 L68 52 Z"/><path class="f s" d="M54 64 C58 57 66 57 70 64 C66 70 58 70 54 64 Z"/><circle class="d" cx="57.5" cy="63.5" r="1.25"/><circle class="d" cx="60.5" cy="61.5" r="1.25"/><circle class="d" cx="63.5" cy="61.5" r="1.25"/><circle class="d" cx="66.5" cy="63.5" r="1.25"/><circle class="d" cx="59" cy="66" r="1.25"/><circle class="d" cx="62" cy="64.5" r="1.25"/><circle class="d" cx="65" cy="66" r="1.25"/><circle class="d" cx="62" cy="67.5" r="1.25"/>
      <circle class="f" cx="140" cy="38" r="12"/><path class="f" d="M134 28 L136 21 L139 26 L142 21 L144 26 L147 22 L146 28 Z"/><path class="f s" d="M132 40 C136 33 144 33 148 40 C144 46 136 46 132 40 Z"/><circle class="d" cx="135.5" cy="39.5" r="1.25"/><circle class="d" cx="138.5" cy="37.5" r="1.25"/><circle class="d" cx="141.5" cy="37.5" r="1.25"/><circle class="d" cx="144.5" cy="39.5" r="1.25"/><circle class="d" cx="137" cy="42" r="1.25"/><circle class="d" cx="140" cy="40.5" r="1.25"/><circle class="d" cx="143" cy="42" r="1.25"/><circle class="d" cx="140" cy="43.5" r="1.25"/>`,
  },
  {
    id: 'lotus',
    name: { en: 'Lotus', zh: '荷花' },
    text: {
      en: 'It grows out of mud yet stays clean, so in Buddhism it stands for purity. In the manual’s list of flower patterns, the “treasure flower” (宝相华) and the lotus (莲荷华) come straight after the pomegranate.',
      zh: '出淤泥而不染，在佛教里象征清净。《营造法式》的花纹名目里，紧随海石榴华的就是宝相华和莲荷华。',
    },
    svg: `
      <path class="l" d="M100 96 C100 80 98 70 100 60 M100 96 C80 90 60 82 44 70 M100 96 C120 90 140 84 156 72 M100 96 C114 76 132 50 150 34" stroke-width="4.4"/>
      <path class="r" d="M100 96 C100 80 98 70 100 60 M100 96 C80 90 60 82 44 70 M100 96 C120 90 140 84 156 72 M100 96 C114 76 132 50 150 34" stroke-width="2.2"/>
      <ellipse class="f" cx="38" cy="62" rx="30" ry="15"/>
      <path class="c" d="M38 62 L10 58 M38 62 L18 72 M38 62 L40 47 M38 62 L58 50 M38 62 L64 66 M38 62 L46 76"/>
      <ellipse class="f" cx="164" cy="66" rx="28" ry="14"/>
      <path class="c" d="M164 66 L138 62 M164 66 L146 76 M164 66 L166 52 M164 66 L184 56 M164 66 L190 70 M164 66 L172 79"/>
      <path class="f" d="M100 62 C92 56 88 44 92 30 C98 36 102 46 100 62 Z"/>
      <path class="f" d="M100 62 C108 56 112 44 108 30 C102 36 98 46 100 62 Z"/>
      <path class="f" d="M100 62 C88 62 76 54 72 40 C82 42 92 50 100 62 Z"/>
      <path class="f" d="M100 62 C112 62 124 54 128 40 C118 42 108 50 100 62 Z"/>
      <path class="f" d="M100 64 C88 68 74 66 66 56 C78 54 90 58 100 64 Z"/>
      <path class="f" d="M100 64 C112 68 126 66 134 56 C122 54 110 58 100 64 Z"/>
      <path class="f" d="M100 22 C96 14 98 6 100 2 C102 6 104 14 100 22 Z" transform="translate(0 6)"/>
      <path class="f" d="M150 34 C144 26 144 16 150 10 C156 16 156 26 150 34 Z"/>
      <path class="c" d="M150 32 L150 14"/>`,
  },
];

const PANEL = { w: 168, h: 84 };

function motifGroup(m, x, y, scale, cls) {
  return `<g class="${cls}" transform="translate(${x} ${y}) scale(${scale})">
    <g class="ch4-relief-shadow" transform="translate(1.6 1.8)">${m.svg}</g>
    <g class="ch4-relief">${m.svg}</g>
  </g>`;
}

/** The plinth: top slab, upper mouldings, waist with three panels, lower mouldings, base. */
function plinthSvg(active) {
  const i = MOTIFS.findIndex((m) => m.id === active);
  const prev = MOTIFS[(i + MOTIFS.length - 1) % MOTIFS.length];
  const next = MOTIFS[(i + 1) % MOTIFS.length];
  const panels = [prev, MOTIFS[i], next];
  const left = 46;
  const post = 14;
  const top = 74;
  let waist = '';
  panels.forEach((m, k) => {
    const x = left + post + k * (PANEL.w + post);
    waist += `<rect class="ch4-pl-panel" x="${x}" y="${top}" width="${PANEL.w}" height="${PANEL.h}" rx="2"/>`;
    waist += motifGroup(m, x + 4, top + 4, (PANEL.w - 8) / 200, k === 1 ? 'ch4-motif ch4-motif--on' : 'ch4-motif');
  });
  for (let k = 0; k < 4; k++) {
    const x = left + k * (PANEL.w + post);
    waist += `<rect class="ch4-pl-post" x="${x}" y="${top - 6}" width="${post}" height="${PANEL.h + 12}"/>`;
  }
  return `<svg viewBox="0 0 640 250" xmlns="${NS}" role="img" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="ch4-brick" width="40" height="14" patternUnits="userSpaceOnUse">
        <rect width="40" height="14" fill="#b88664"/>
        <path d="M0 13.5 H40 M20 0 V7 M0 7 H40 M40 7 V14 M0 7 V14" stroke="#9d6c4f" stroke-width="1" fill="none"/>
      </pattern>
    </defs>
    <rect class="ch4-pl-slab" x="14" y="18" width="612" height="24"/>
    <path class="ch4-pl-mould" d="M24 42 H616 L604 54 H36 Z"/>
    <path class="ch4-pl-mould ch4-pl-mould--deep" d="M36 54 H604 L594 62 H46 Z"/>
    <rect class="ch4-pl-waist" x="46" y="62" width="548" height="108"/>
    ${waist}
    <path class="ch4-pl-mould ch4-pl-mould--deep" d="M46 170 H594 L604 178 H36 Z"/>
    <path class="ch4-pl-mould" d="M36 178 H604 L616 190 H24 Z"/>
    <rect class="ch4-pl-slab" x="14" y="190" width="612" height="24"/>
    <rect class="ch4-pl-base" x="6" y="214" width="628" height="22"/>
  </svg>`;
}

export function buildCarvings({ onPeel } = {}) {
  let active = 'apsara';
  const figure = h('div', { class: 'ch4-plinth' });
  const capName = h('h4', { class: 'ch4-motif-name' });
  const capText = h('p', { class: 'ch4-motif-text' });

  const render = () => {
    const m = MOTIFS.find((x) => x.id === active);
    figure.innerHTML = plinthSvg(active);
    capName.textContent = tr(m.name);
    capText.textContent = tr(m.text);
  };

  const seg = segmented({
    options: MOTIFS.map((m) => ({ value: m.id, label: m.name })),
    value: active,
    ariaLabel: { en: 'Choose a motif', zh: '选择纹样' },
    onChange: (v) => {
      active = v;
      render();
    },
  });
  seg.el.classList.add('ch4-motif-seg');

  const el = h(
    'section',
    { class: 'ch4-carvings', id: 'ch4-carvings', 'aria-labelledby': 'ch4-carvings-title' },
    bi({ en: 'Carved in brick', zh: '砖上的雕刻' }, 'h3', { class: 'ch4-h3', id: 'ch4-carvings-title' }),
    h(
      'div',
      { class: 'ch4-carvings__grid' },
      h(
        'div',
        { class: 'prose' },
        rich({
          en: 'Walk the corridor inside the brick body and look down. At the foot of the walls runs a [[arch-sumeru-plinth|Sumeru plinth]]: a stepped base with a narrow, recessed “waist”. The waist panels are carved with figures, flying apsaras, flowers, birds and beasts: pomegranates, lotus and “treasure flowers”; phoenixes, peacocks and parrots; lions and qilin. Sources count them differently, from 174 groups to more than 200 carvings.',
          zh: '沿着砖塔身里的回廊走，低头看墙脚：那里有一圈[[arch-sumeru-plinth|须弥座]]，上下几层线脚，中间收进去一道“束腰”。束腰上刻着人物、飞天、花卉和鸟兽：石榴、荷花、宝相花，凤凰、孔雀、鹦鹉，狮子、麒麟。各家资料统计的数目不一，从 174 组到二百多处都有。',
        }),
        rich({
          en: 'Many of the patterns match the _Yingzao Fashi_ (营造法式, “Treatise on Architectural Methods”), the building manual the Song court printed in 1103. Real buildings that can be checked against the book are rare, so these bricks are precious evidence of how its rules were used.',
          zh: '其中许多纹样能在宋代官方建筑规范《营造法式》（1103 年刊行）里找到对应。能和这本书对照的宋代实物并不多，所以这些砖雕是研究《营造法式》的珍贵实物资料。',
        }),
        onPeel
          ? h(
              'p',
              null,
              (() => {
                const b = bi({ en: 'Peel the timber in the 3D model to see the brick body', zh: '在上方 3D 模型里剥去木檐，看看砖塔身' }, 'button', {
                  type: 'button',
                  class: 'btn btn--ghost',
                });
                b.addEventListener('click', onPeel);
                return b;
              })(),
            )
          : null,
      ),
      h(
        'figure',
        { class: 'ch4-plinth-fig' },
        figure,
        h('div', { class: 'ch4-motif-pick' }, bi({ en: 'Choose a motif for the middle panel', zh: '为中间那块选一种纹样' }, 'span', { class: 'label' }), seg.el),
        h('figcaption', { class: 'ch4-motif-cap', 'aria-live': 'polite' }, capName, capText),
        bi(
          {
            en: 'Illustrations drawn for this site to show the types of motif. They are not copies of particular carvings in the pagoda. The plinth profile is simplified.',
            zh: '以上为本站绘制的示意图，用来说明纹样类型，并非塔内某一块砖雕的摹本；须弥座线脚也做了简化。',
          },
          'p',
          { class: 'note ch4-illus-note' },
        ),
      ),
    ),
  );

  onLang(el, render);
  return el;
}
