/**
 * ch5 · 听潮 · Listening to the Tide
 * Literature and translation: Lu Zhishen's last night at Liuhe Temple (Water Margin, ch. 119)
 * beside an ink-wash river whose tide rises as you read, three poets' tides, and the
 * Translation Lab, where the reader translates first and compares afterwards.
 */
import './style.css';
import { chapterHeader, h, bi, canSpeak, speak, reducedMotion } from '../../core/ui.js';
import { tr, onLangChange } from '../../core/i18n.js';
import { registerVocab } from '../../core/vocab.js';
import { VOCAB, STORY_INTRO, BEATS, POEMS } from './content.js';
import { rich } from './rich.js';
import { createInkTide } from './ink.js';
import { buildLab } from './lab.js';

registerVocab('ch5', VOCAB);

function sayBtn(text, lang, label) {
  if (!canSpeak()) return null;
  const b = h('button', { type: 'button', class: 'ch5-say', onclick: () => speak(text, lang, lang === 'zh' ? 0.8 : 0.9) });
  const set = () => (b.textContent = tr(label));
  set();
  const off = onLangChange(() => (b.isConnected ? set() : off()));
  return b;
}

/** Chinese lines set vertically (right to left) beside our English rendering. */
function verseBlock(v) {
  return h(
    'figure',
    { class: 'ch5-verse' },
    h('div', { class: 'ch5-verse__zh', lang: 'zh-CN' }, v.zh.map((l) => h('span', null, l))),
    h(
      'figcaption',
      { class: 'ch5-verse__side' },
      h('ol', { class: 'ch5-verse__en', lang: 'en' }, v.en.map((l) => h('li', null, l))),
      h(
        'div',
        { class: 'ch5-tools' },
        sayBtn(v.zh.join('，'), 'zh', { en: 'Hear the Chinese', zh: '听中文' }),
        sayBtn(v.en.join(' '), 'en', { en: 'Hear the English', zh: '听英文' }),
      ),
      bi({ en: 'English: our own translation.', zh: '英译为本站自译。' }, 'p', { class: 'note' }),
    ),
  );
}

function buildStory() {
  const canvas = h('canvas', { class: 'ch5-ink__canvas', 'aria-hidden': 'true' });
  const sealText = h('span', { class: 'ch5-ink__words' });
  const inscription = h(
    'div',
    { class: 'ch5-ink__inscription', lang: 'zh-CN', 'aria-hidden': 'true' },
    sealText,
    h('span', { class: 'ch5-ink__seal' }, '听潮'),
  );
  const inkBox = h('div', { class: 'ch5-ink' }, h('div', { class: 'ch5-ink__frame' }, canvas, inscription));

  const beatEls = BEATS.map((b, i) =>
    h(
      'article',
      { class: 'ch5-beat', 'data-beat': String(i) },
      bi(b.title, 'h4', { class: 'ch5-beat__title' }),
      rich(b.body),
      b.verse ? verseBlock(b.verse) : null,
      b.after ? rich(b.after) : null,
    ),
  );
  const beats = h('div', { class: 'ch5-beats' }, beatEls);
  const wrap = h('div', { class: 'ch5-story' }, inkBox, beats);

  const ink = createInkTide(canvas);
  const reduce = reducedMotion();
  let active = -1;

  function setBeat(i) {
    if (i === active) return;
    active = i;
    sealText.classList.remove('is-in');
    void sealText.offsetWidth;
    sealText.textContent = BEATS[i].seal;
    sealText.classList.add('is-in');
    beatEls.forEach((el, k) => el.classList.toggle('is-active', k === i));
    if (reduce) ink.draw(i / (BEATS.length - 1));
  }
  setBeat(0);

  const beatIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) setBeat(Number(e.target.dataset.beat));
    },
    { rootMargin: '-40% 0px -50% 0px' },
  );
  beatEls.forEach((el) => beatIO.observe(el));

  if (!reduce) {
    // The tide follows reading progress through the story (measured live, so it stays right
    // even when chapters above finish loading and push this one down).
    let visible = false;
    let queued = false;
    const progress = () => {
      const r = beats.getBoundingClientRect();
      const vh = window.innerHeight;
      return Math.min(1, Math.max(0, (vh * 0.6 - r.top) / Math.max(1, r.height - vh * 0.15)));
    };
    const onScroll = () => {
      if (!visible || queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        ink.draw(progress());
      });
    };
    new IntersectionObserver((entries) => {
      for (const e of entries) visible = e.isIntersecting;
      onScroll();
    }).observe(wrap);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    ink.draw(0);
  }

  return wrap;
}

function poemBlock(p) {
  return h(
    'article',
    { class: 'ch5-poem' },
    h(
      'div',
      { class: 'ch5-poem__zh', lang: 'zh-CN' },
      p.zh.map((l) => h('span', null, l)),
      h('span', { class: 'ch5-poem__sign' }, p.author.zh),
    ),
    h(
      'div',
      { class: 'ch5-poem__body' },
      h(
        'header',
        { class: 'ch5-poem__head' },
        bi(p.author, 'h4', { class: 'ch5-poem__author' }),
        bi(p.title, 'p', { class: 'ch5-poem__title' }),
        bi(p.dates, 'p', { class: 'note' }),
      ),
      h('ol', { class: 'ch5-poem__en', lang: 'en' }, p.en.map((l) => h('li', null, l))),
      h(
        'div',
        { class: 'ch5-tools' },
        sayBtn(p.zhText, 'zh', { en: 'Hear the Chinese', zh: '听中文' }),
        sayBtn(p.en.join(' '), 'en', { en: 'Hear the English', zh: '听英文' }),
      ),
      bi(p.note, 'p', { class: 'ch5-poem__note' }),
    ),
  );
}

export default {
  id: 'ch5',
  ambience: { river: 0.35, wind: 0.12, rumble: 0 },
  sources: [
    {
      title: { en: 'Water Margin (120-chapter edition), chapter 119, on Wikisource', zh: '《水浒传》（百二十回本）第一百十九回，维基文库' },
      url: 'https://zh.wikisource.org/wiki/%E6%B0%B4%E6%BB%B8%E5%82%B3_(120%E5%9B%9E%E6%9C%AC)/%E7%AC%AC119%E5%9B%9E',
      note: { en: 'Text of Lu Zhishen’s death at Liuhe Temple and Wu Song staying on; quotes checked against this edition.', zh: '鲁智深六和寺坐化、武松出家的原文，本章引文据此核对。' },
    },
    {
      title: { en: 'Pan Lang, “Jiuquanzi” (no. 4 of 10), on Wikisource', zh: '潘阆《酒泉子》（十之四），维基文库' },
      url: 'https://zh.wikisource.org/wiki/%E9%85%92%E6%B3%89%E5%AD%90%EF%BC%88%E5%8D%81%E4%B9%8B%E5%9B%9B%EF%BC%89',
    },
    {
      title: { en: 'Su Shi, “Cui shiguan kaojiao xizuo”, on Wikisource', zh: '苏轼《催试官考较戏作》，维基文库' },
      url: 'https://zh.wikisource.org/wiki/%E5%82%AC%E8%A9%A6%E5%AE%98%E8%80%83%E8%BC%83%E6%88%B2%E4%BD%9C',
      note: { en: 'Source of “八月十八潮，壮观天下无”.', zh: '“八月十八潮，壮观天下无”的出处。' },
    },
    {
      title: { en: 'Bai Juyi, “Yi Jiangnan”, on Wikisource', zh: '白居易《忆江南》，维基文库' },
      url: 'https://zh.wikisource.org/wiki/%E6%86%B6%E6%B1%9F%E5%8D%97_(%E7%99%BD%E5%B1%85%E6%98%93)',
    },
    {
      title: { en: 'Zhou Mi, Wulin jiushi, juan 3 (“Watching the tide”), on Wikisource', zh: '周密《武林旧事》卷三（观潮），维基文库' },
      url: 'https://zh.wikisource.org/wiki/%E6%AD%A6%E6%9E%97%E8%88%8A%E4%BA%8B/%E5%8D%B7%E4%B8%89',
      note: { en: 'The flag-carrying swimmers (弄潮儿) of Southern Song Hangzhou.', zh: '南宋杭州手持彩旗的弄潮儿。' },
    },
    {
      title: { en: 'Hangzhou News: “27 years ago, Liuhe Pagoda had a major repair” (2018)', zh: '杭州网《27年前 六和塔曾经历过一次大修》（2018）' },
      url: 'https://hznews.hangzhou.com.cn/chengshi/content/2018-09/11/content_7065768_0.htm',
      note: { en: 'Name from the Buddhist “six harmonies” (六和敬); also written 六合, “heaven, earth and the four directions”.', zh: '塔名取佛教“六和敬”之义，又名六合塔，取“天地四方”之意。' },
    },
    {
      title: { en: 'Cheng Chen-huang, “The Six Principles of Reverent Harmony” (Torch of Wisdom, 2006), NTU Buddhist library record', zh: '郑振煌《六和敬：佛教三大语系的团结与合作基础》（《慧炬》，2006），台大佛学数位图书馆' },
      url: 'https://dlbs.liberal.ntu.edu.tw/DLMBS/search/search_detail.jsp?seq=142747',
      note: { en: 'The six: living together, no disputes, shared joy, shared precepts, shared understanding, equal sharing.', zh: '身和同住、口和无诤、意和同悦、戒和同修、见和同解、利和同均。' },
    },
    {
      title: { en: 'Wang Zhaopeng, a study of Pan Lang’s life (Aisixiang)', zh: '王兆鹏《北宋隐士词人潘阆生平考索》（爱思想网）' },
      url: 'https://www.aisixiang.com/data/99737.html',
      note: { en: 'Pan Lang’s dates are uncertain; this study gives c. 962–1010.', zh: '潘阆生卒年不详，此文考为约962—1010年。' },
    },
    {
      title: { en: 'Domestication and foreignization (Schleiermacher 1813; Venuti 1995)', zh: '归化与异化（施莱尔马赫1813；韦努蒂1995）' },
      url: 'https://en.wikipedia.org/wiki/Domestication_and_foreignization',
    },
  ],

  async mount(section) {
    section.append(
      chapterHeader({
        plaque: '听潮',
        index: 5,
        title: { en: 'Listening to the Tide', zh: '听潮' },
        lede: {
          en: 'For a thousand years people have listened to this river and tried to put it into words. Read a monk’s last night and three poets’ tides, then try translating them yourself.',
          zh: '一千年来，人们听着这条江，想把它写下来。先读一位和尚的最后一夜、三位诗人笔下的潮，再自己动手把它们译成英文。',
        },
      }),
    );

    section.append(
      h(
        'div',
        { class: 'ch5-part' },
        bi({ en: 'The night Lu Zhishen heard the tide', zh: '鲁智深听潮' }, 'h3', { class: 'ch5-part__title' }),
        rich(STORY_INTRO, 'p', { class: 'ch5-part__intro' }),
      ),
      buildStory(),
    );

    section.append(
      h(
        'div',
        { class: 'ch5-part' },
        bi({ en: 'Poets at the river', zh: '诗人看潮' }, 'h3', { class: 'ch5-part__title' }),
        rich(
          {
            en: 'Lu Zhishen heard the tide in the dark. Poets came to watch it, and each found a different way to say how big it was. Read the Chinese aloud first: the rhythm is half the meaning. Each column reads top to bottom, right to left.',
            zh: '鲁智深是在黑夜里听潮，诗人们则是专程来看潮，各自想办法写出它有多壮阔。先把中文读出声来，节奏本身就是意思的一半。竖排从上到下、从右往左读。',
          },
          'p',
          { class: 'ch5-part__intro' },
        ),
      ),
      h('div', { class: 'ch5-poems' }, POEMS.map(poemBlock)),
    );

    section.append(
      h(
        'div',
        { class: 'ch5-part', id: 'ch5-lab' },
        bi({ en: 'Translation Lab', zh: '译名实验室' }, 'h3', { class: 'ch5-part__title' }),
        rich(
          {
            en: 'Six phrases from this chapter that resist easy English. For each one, write your own version first. Then compare it with three versions we wrote, each with a note on what it keeps and what it loses. Your answers stay on this device.',
            zh: '本章里有六个不好译的词句。每一条先写下你自己的英文，再和我们写的三种译法对照，看看每种译法保留了什么、丢掉了什么。你的答案只保存在这台设备上。',
          },
          'p',
          { class: 'ch5-part__intro' },
        ),
      ),
      buildLab(),
      rich(
        {
          en: 'Keep the version you like best. In the last chapter you become the guide, and you will need a way to say these things to a visitor.',
          zh: '把你最满意的译法留着。最后一章轮到你当讲解员，你会需要用英文把这些讲给游客听。',
        },
        'p',
        { class: 'ch5-outro' },
      ),
    );
  },
};
