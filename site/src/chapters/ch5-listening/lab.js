/**
 * Translation Lab / 译名实验室.
 * For each phrase the reader writes an English version first (kept in localStorage on this
 * device only), then compares it with three versions and notes on what each keeps and loses.
 */
import { h, bi, canSpeak, speak, announce } from '../../core/ui.js';
import { tr, onLangChange } from '../../core/i18n.js';
import { markDone } from '../../core/progress.js';
import { LAB, KIND_LABELS } from './content.js';
import { rich } from './rich.js';

const STORE = 'liuhe.ch5.lab';

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch (_) {
    return {};
  }
}

function save(state) {
  try {
    localStorage.setItem(STORE, JSON.stringify(state));
    return true;
  } catch (_) {
    return false;
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    const ta = h('textarea', { style: { position: 'fixed', opacity: '0' } }, text);
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (__) {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

/** Keep a node's text in sync with a pair, or with a function returning a string. */
function live(el, fn) {
  const set = () => {
    el.textContent = typeof fn === 'function' ? fn() : tr(fn);
  };
  set();
  const off = onLangChange(() => {
    if (!el.isConnected) return off();
    set();
  });
  return el;
}

export function buildLab() {
  const state = load();
  let current = LAB.findIndex((it) => !state[it.id]?.revealed);
  if (current < 0) current = 0;

  const tabs = LAB.map((it, i) =>
    h(
      'button',
      {
        type: 'button',
        role: 'tab',
        id: `ch5-tab-${it.id}`,
        class: 'ch5-lab__tab',
        'aria-controls': 'ch5-lab-panel',
        onclick: () => select(i, true),
      },
      h('span', { class: 'ch5-lab__tab-zh', lang: 'zh-CN' }, it.source),
      h('span', { class: 'ch5-lab__tab-py' }, it.pinyin),
      h('span', { class: 'ch5-lab__tab-mark', 'aria-hidden': 'true' }),
    ),
  );
  const tablist = h('div', { class: 'ch5-lab__tabs', role: 'tablist' }, tabs);
  const syncTablistLabel = () => tablist.setAttribute('aria-label', tr({ en: 'Phrases to translate', zh: '待译词句' }));
  syncTablistLabel();
  onLangChange(syncTablistLabel);

  tablist.addEventListener('keydown', (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key in keys) {
      e.preventDefault();
      select((current + keys[e.key] + LAB.length) % LAB.length, true, true);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      select(e.key === 'Home' ? 0 : LAB.length - 1, true, true);
    }
  });

  const panel = h('div', { class: 'ch5-lab__panel', role: 'tabpanel', id: 'ch5-lab-panel', tabindex: '-1' });
  const progressEl = h('p', { class: 'ch5-lab__progress', 'aria-live': 'polite' });
  const copyBtn = h('button', { type: 'button', class: 'btn btn--ghost' });
  live(copyBtn, { en: 'Copy my translations', zh: '复制我的译文' });
  const copyNote = h('span', { class: 'note', role: 'status' });
  copyBtn.addEventListener('click', async () => {
    const lines = [tr({ en: 'Translation Lab: my versions', zh: '译名实验室：我的译文' }), ''];
    for (const it of LAB) {
      const mine = (state[it.id]?.text || '').trim();
      lines.push(`${it.source} (${it.pinyin})`);
      lines.push(`${tr({ en: 'Mine', zh: '我的译文' })}: ${mine || '—'}`);
      for (const v of it.versions) lines.push(`${tr(KIND_LABELS[v.kind])}: ${v.text}`);
      lines.push('');
    }
    const ok = await copyText(lines.join('\n'));
    copyNote.textContent = ok
      ? tr({ en: 'Copied. Paste it into your notes or homework.', zh: '已复制，可以粘贴到笔记或作业里。' })
      : tr({ en: 'Copying is blocked in this browser.', zh: '这个浏览器不允许复制。' });
  });

  function syncProgress() {
    const tried = LAB.filter((it) => state[it.id]?.revealed).length;
    progressEl.textContent = tr(
      { en: 'You have compared {n} of {total}.', zh: '已对照 {n} / {total} 条。' },
      { n: tried, total: LAB.length },
    );
    tabs.forEach((t, i) => {
      const done = !!state[LAB[i].id]?.revealed;
      t.classList.toggle('is-done', done);
      t.querySelector('.ch5-lab__tab-mark').textContent = done ? '✓' : '';
    });
  }

  function select(i, focusTab = false, moveFocus = false) {
    current = i;
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tabs[i].id);
    renderPanel();
    if (moveFocus) tabs[i].focus();
    else if (focusTab && document.activeElement !== tabs[i]) tabs[i].focus({ preventScroll: true });
  }

  function speakBtn(text, lang, label) {
    if (!canSpeak()) return null;
    const b = h('button', { type: 'button', class: 'ch5-say', onclick: () => speak(text, lang) });
    live(b, label);
    return b;
  }

  function renderPanel() {
    const it = LAB[current];
    const entry = state[it.id] || (state[it.id] = { text: '', revealed: false });
    const taId = `ch5-ta-${it.id}`;

    const textarea = h('textarea', { id: taId, rows: 3, lang: 'en', spellcheck: 'true', class: 'ch5-lab__input', autocomplete: 'off' });
    textarea.value = entry.text || '';
    const placeholder = () => textarea.setAttribute('placeholder', tr({ en: 'Type your English here…', zh: '在这里写下你的英文译法……' }));
    placeholder();
    const offPh = onLangChange(() => (textarea.isConnected ? placeholder() : offPh()));

    const savedNote = h('span', { class: 'note ch5-lab__saved' });
    let saveResult = null;
    const savedText = () =>
      saveResult == null
        ? ''
        : saveResult
          ? tr({ en: 'Saved on this device only.', zh: '只保存在这台设备上。' })
          : tr({ en: 'Could not save (private browsing?). Copy your text before leaving.', zh: '无法保存（可能是隐私模式），离开前请先复制。' });
    live(savedNote, savedText);
    const compareBtn = h('button', { type: 'button', class: 'btn' });
    live(compareBtn, { en: 'Compare with three versions', zh: '和三种译法对照' });
    const skipBtn = h('button', { type: 'button', class: 'ch5-link' });
    live(skipBtn, { en: 'Show them without trying', zh: '不写了，直接看' });

    let saveTimer = 0;
    const syncButtons = () => {
      const has = textarea.value.trim().length >= 2;
      compareBtn.disabled = !has;
      skipBtn.hidden = has || entry.revealed;
    };
    textarea.addEventListener('input', () => {
      entry.text = textarea.value;
      syncButtons();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveResult = save(state);
        savedNote.textContent = savedText();
        if (yours) yours.textContent = textarea.value.trim() || '—';
      }, 400);
    });

    const versionsEl = h('div', { class: 'ch5-lab__versions' });
    let yours = null;

    function reveal(withOwn) {
      entry.revealed = true;
      save(state);
      versionsEl.replaceChildren(...renderVersions(it, entry));
      yours = versionsEl.querySelector('.ch5-lab__mine-text');
      versionsEl.hidden = false;
      skipBtn.hidden = true;
      syncProgress();
      if (withOwn) markDone('ch5', 'translation-lab-tried');
      if (LAB.every((x) => state[x.id]?.revealed)) markDone('ch5', 'translation-lab');
      announce(tr({ en: 'Three versions shown below your answer.', zh: '三种译法已显示在你的答案下方。' }));
    }
    compareBtn.addEventListener('click', () => reveal(true));
    skipBtn.addEventListener('click', () => reveal(false));

    if (entry.revealed) {
      versionsEl.append(...renderVersions(it, entry));
      yours = versionsEl.querySelector('.ch5-lab__mine-text');
    } else versionsEl.hidden = true;
    syncButtons();

    const next = current < LAB.length - 1 ? current + 1 : null;
    const nextBtn =
      next != null
        ? h('button', { type: 'button', class: 'btn btn--ghost ch5-lab__next', onclick: () => select(next, true) })
        : null;
    if (nextBtn) live(nextBtn, () => tr({ en: 'Next phrase: {s}', zh: '下一条：{s}' }, { s: LAB[next].source }));

    panel.replaceChildren(
      h(
        'div',
        { class: 'ch5-lab__source' },
        h('p', { class: 'ch5-lab__zh', lang: 'zh-CN' }, it.source),
        h('p', { class: 'ch5-lab__py' }, it.pinyin),
        speakBtn(it.source, 'zh', { en: 'Hear the Chinese', zh: '听中文' }),
      ),
      live(h('p', { class: 'ch5-lab__gloss' }), it.gloss),
      live(h('p', { class: 'ch5-lab__context note' }), it.context),
      h(
        'div',
        { class: 'ch5-lab__try' },
        live(h('label', { for: taId, class: 'ch5-lab__prompt' }), it.prompt),
        textarea,
        h('div', { class: 'ch5-lab__actions' }, compareBtn, skipBtn, savedNote),
      ),
      versionsEl,
      nextBtn,
    );
  }

  function renderVersions(it, entry) {
    const mine = (entry.text || '').trim();
    const out = [
      h(
        'div',
        { class: 'ch5-lab__mine' },
        live(h('span', { class: 'ch5-lab__kind' }), { en: 'Yours', zh: '你的译文' }),
        h('p', { class: 'ch5-lab__mine-text', lang: 'en' }, mine || '—'),
      ),
    ];
    for (const v of it.versions) {
      out.push(
        h(
          'article',
          { class: `ch5-lab__version ch5-lab__version--${v.kind}` },
          h(
            'div',
            { class: 'ch5-lab__vhead' },
            live(h('span', { class: 'ch5-lab__kind' }), KIND_LABELS[v.kind]),
            speakBtn(v.text, 'en', { en: 'Hear it', zh: '听英文' }),
          ),
          h('p', { class: 'ch5-lab__vtext', lang: 'en' }, v.text),
          h(
            'dl',
            { class: 'ch5-lab__kl' },
            live(h('dt'), { en: 'Keeps', zh: '保留了' }),
            live(h('dd'), v.keeps),
            live(h('dt'), { en: 'Loses', zh: '失去了' }),
            live(h('dd'), v.loses),
          ),
        ),
      );
    }
    return out;
  }

  const theory = h(
    'aside',
    { class: 'ch5-lab__theory' },
    bi({ en: 'Two directions', zh: '两个方向' }, 'h4'),
    rich({
      en: 'In 1813 the German thinker Friedrich Schleiermacher said a translator has two choices: leave the writer in peace and move the reader towards the writer, or leave the reader in peace and move the writer towards the reader. In 1995 the American scholar Lawrence Venuti named the two roads. [[lit-foreignisation|Foreignisation]] keeps what is strange about the original. [[lit-domestication|Domestication]] makes the text feel at home in the new language.',
      zh: '1813年，德国思想家施莱尔马赫说，译者只有两条路：要么尽量不打扰作者，让读者向作者靠拢；要么尽量不打扰读者，让作者向读者靠拢。1995年，美国学者韦努蒂给这两条路起了名字：[[lit-foreignisation|异化]]保留原文的陌生感，[[lit-domestication|归化]]让译文在新的语言里显得自然。',
    }),
    rich({
      en: '“Literal” and “interpretive” describe how closely you follow the words. Domestication and foreignisation describe whose culture the text leans towards. Neither road is always right: a sign at the gate, a poem in a book and a guide talking to a surfer need different answers. Ask who is listening and what they need to take away.',
      zh: '“直译”和“意译”说的是贴不贴原文的字句；“归化”和“异化”说的是译文向哪一种文化靠拢。哪条路都不是永远正确：景区门口的标牌、书里的一首诗、讲解员对一位冲浪者说的话，需要的答案各不相同。先问一句：谁在听？他们需要带走什么？',
    }),
  );

  const root = h(
    'div',
    { class: 'ch5-lab' },
    h('div', { class: 'ch5-lab__main' }, tablist, panel),
    h('div', { class: 'ch5-lab__side' }, theory, h('div', { class: 'ch5-lab__foot' }, progressEl, copyBtn, copyNote)),
  );

  onLangChange(() => {
    if (!root.isConnected) return;
    syncProgress();
    copyNote.textContent = '';
  });

  select(current);
  syncProgress();
  return root;
}
