/**
 * Reading aloud with the browser's own voices (Web Speech API): English for the tour script
 * and the terms, Mandarin for the Chinese words. Nothing is sent anywhere; when a browser has
 * no voice for a language the speak buttons simply stay hidden.
 */
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

let voices = [];
const load = () => (voices = canSpeak ? speechSynthesis.getVoices() : []);
if (canSpeak) {
  load();
  speechSynthesis.addEventListener?.('voiceschanged', load);
}

/** the most natural-sounding voice the browser has for a language */
function pick(lang) {
  const base = lang.slice(0, 2);
  const list = voices.filter((v) => v.lang.replace('_', '-').startsWith(base));
  const score = (v) =>
    (v.lang.replace('_', '-') === lang ? 4 : 0) + (/natural|neural|online|premium|enhanced/i.test(v.name) ? 3 : 0) + (/google|microsoft|samantha|daniel|xiaoxiao|tingting/i.test(v.name) ? 1 : 0);
  return list.sort((a, b) => score(b) - score(a))[0] || null;
}

export function hasVoice(lang) {
  return canSpeak && (voices.length === 0 || !!pick(lang));
}

/**
 * Speak `text`. onWord(charIndex) follows along where the voice reports word boundaries.
 * Returns a promise that settles when the voice stops.
 */
export function speak(text, lang = 'en-US', { rate = 0.92, onWord, onStart } = {}) {
  if (!canSpeak) return Promise.resolve();
  speechSynthesis.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const v = pick(lang);
    if (v) u.voice = v;
    u.rate = rate;
    u.onstart = () => onStart && onStart();
    u.onboundary = (e) => onWord && e.name !== 'sentence' && onWord(e.charIndex);
    u.onend = u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (canSpeak) speechSynthesis.cancel();
}

/** a small speaker button that reads `text` */
export function sayButton($, text, lang = 'en-US', label = '朗读 Listen') {
  if (!canSpeak) return null;
  const b = $('button', { type: 'button', class: 'say', title: label, 'aria-label': `${label}: ${text}` }, '');
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a4.5 4.5 0 010 7M18.5 6a8 8 0 010 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  b.addEventListener('click', async (e) => {
    e.stopPropagation();
    b.classList.add('is-on');
    await speak(text, lang, { rate: lang.startsWith('zh') ? 0.85 : 0.9 });
    b.classList.remove('is-on');
  });
  return b;
}
