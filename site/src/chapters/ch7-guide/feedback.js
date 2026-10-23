/**
 * Feedback on a spoken transcript or typed script: words, pace, target words, filler words.
 * Pure functions, no DOM except highlight().
 */
import { FILLERS } from './content.js';

const WORD = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;
export const GUIDE_WPM = 130; // a calm guide's speaking pace

export function countWords(text) {
  return (text.match(WORD) || []).length;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Regex for a vocabulary term that tolerates plurals, -ed/-ing, British/American -ise/-ize. */
export function termRegex(en) {
  const words = en
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .split(/[\s/]+/)
    .filter(Boolean)
    .map((w) => escapeRe(w).replace(/is(e|ation|ing|ed)/g, 'i[sz]$1').replace(/our\b/, 'o(?:u)?r'));
  if (!words.length) return null;
  const last = words.pop();
  const stem = last.endsWith('y') ? `${last.slice(0, -1)}(?:y|ies|ied)` : `${last}(?:s|es|ed|d|ing)?`;
  return new RegExp(`\\b${[...words, stem].join('[\\s-]+')}\\b`, 'gi');
}

function fillerRegex(f) {
  return new RegExp(`\\b${f.split(' ').map(escapeRe).join('\\s+')}\\b`, 'gi');
}

/**
 * @param {string} text
 * @param {{ seconds?: number, targets?: Array<{id:string,en:string}>, maxSentence?: number }} opts
 */
export function analyse(text, { seconds = 0, targets = [], maxSentence = 18 } = {}) {
  const words = countWords(text);
  const cjk = (text.match(/[㐀-鿿]/g) || []).length;
  const sentences = text
    .split(/[.!?。！？]+/)
    .map((s) => s.trim())
    .filter((s) => countWords(s) > 0);
  const avgSentence = sentences.length ? words / sentences.length : 0;
  const longest = sentences.reduce((m, s) => Math.max(m, countWords(s)), 0);
  const wpm = seconds > 3 ? Math.round(words / (seconds / 60)) : 0;
  const estSeconds = Math.round((words / GUIDE_WPM) * 60);

  const matches = []; // { start, end, kind }
  const used = [];
  const unused = [];
  for (const t of targets) {
    const re = termRegex(t.en);
    if (!re) continue;
    let found = false;
    for (const m of text.matchAll(re)) {
      found = true;
      matches.push({ start: m.index, end: m.index + m[0].length, kind: 'target' });
    }
    (found ? used : unused).push(t);
  }
  const fillers = [];
  for (const f of FILLERS) {
    let n = 0;
    for (const m of text.matchAll(fillerRegex(f))) {
      n++;
      matches.push({ start: m.index, end: m.index + m[0].length, kind: 'filler' });
    }
    if (n) fillers.push({ word: f, count: n });
  }
  const fillerTotal = fillers.reduce((a, f) => a + f.count, 0);
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const spans = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.start < lastEnd) continue;
    spans.push(m);
    lastEnd = m.end;
  }
  return { text, words, cjk, sentences: sentences.length, avgSentence, longest, wpm, estSeconds, used, unused, fillers, fillerTotal, spans, maxSentence };
}

/** Text with <mark> around target words and filler words. */
export function highlight(text, spans, doc = document) {
  const frag = doc.createDocumentFragment();
  let i = 0;
  for (const s of spans) {
    if (s.start > i) frag.append(text.slice(i, s.start));
    const mark = doc.createElement('mark');
    mark.className = s.kind === 'target' ? 'ch7-hl ch7-hl--target' : 'ch7-hl ch7-hl--filler';
    mark.textContent = text.slice(s.start, s.end);
    frag.append(mark);
    i = s.end;
  }
  if (i < text.length) frag.append(text.slice(i));
  return frag;
}

/** Short, concrete suggestions as { en, zh } pairs. */
export function tips(r, { source }) {
  const out = [];
  if (r.words < 20 && r.cjk > r.words) {
    out.push({ en: 'Try it in English: this is your chance to practise!', zh: '试着用英文说吧，这正是练习的机会！' });
    return out;
  }
  if (r.words < 60) out.push({ en: 'A one-minute tour needs about 120–150 words. Add one more fact or a question for your listener.', zh: '一分钟的讲解大约需要120—150个词。再加一个事实，或者向听众提一个问题。' });
  if (r.words > 190) out.push({ en: 'That is more than a minute at a comfortable pace. Cut one idea and keep the best story.', zh: '按舒服的语速，这已经超过一分钟了。删掉一个点，留下最好的那个故事。' });
  if (source === 'speech' && r.wpm) {
    if (r.wpm > 165) out.push({ en: 'You spoke quickly. Pause after each landmark you point at, so your listener can look.', zh: '你说得有点快。每指一处景物就停一下，让听众有时间看。' });
    else if (r.wpm < 95) out.push({ en: 'Your pace was slow. That is fine for a child; for adults, link ideas with “and”, “so”, “but”.', zh: '语速偏慢。给孩子讲没问题；给成年人讲，可以用 and、so、but 把句子连起来。' });
  }
  if (r.longest > r.maxSentence + 6) out.push({ en: 'Your longest sentence is hard to follow when spoken. Split it in two.', zh: '最长的那句话说出来不好跟，拆成两句吧。' });
  if (r.unused.length && r.used.length < Math.min(3, r.used.length + r.unused.length)) {
    out.push({ en: `Try to fit in “${r.unused[0].en}”.`, zh: `试着用上 “${r.unused[0].en}”。` });
  }
  if (r.fillerTotal >= 3) out.push({ en: 'Several filler words: a short silence sounds more confident than “um”.', zh: '填充词有点多：短暂的停顿比 um 听起来更自信。' });
  if (!/\?/.test(r.text || '') && r.words >= 60) out.push({ en: 'Ask your listener one question. It turns a speech into a tour.', zh: '向听众提一个问题，讲解就从“演讲”变成了“导览”。' });
  if (!out.length) out.push({ en: 'Clear, well paced and on target. Record it again without looking at your script.', zh: '清楚、节奏好、目标词也用上了。试着不看稿再录一遍。' });
  return out;
}
