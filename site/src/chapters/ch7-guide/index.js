/**
 * ch7 · 讲解员 · Be the Guide
 * The output chapter: pick a 3D viewpoint, choose a listener, build a script, record a
 * one-minute tour (audio stays on the device), get feedback, make a postcard of the view,
 * and look back over the journey and the wordbook.
 */
import './style.css';
import { chapterHeader, h, bi, segmented, announce, canSpeak } from '../../core/ui.js';
import { tr, onLangChange } from '../../core/i18n.js';
import { registerVocab, getVocab, getWord, getWordbook, onWordbookChange, removeWord } from '../../core/vocab.js';
import { markDone, getProgress, onProgress } from '../../core/progress.js';
import { CHAPTERS } from '../registry.js';
import { VOCAB, VIEWS, FREE_VIEW, LIGHTS, MOVES, AUDIENCES } from './content.js';
import { createGuideScene } from './scene.js';
import { analyse, highlight, tips, countWords, GUIDE_WPM } from './feedback.js';
import { canRecord, createRecorder, canTranscribe, createTranscriber } from './recorder.js';
import { composePostcard, downloadCanvas } from './postcard.js';
import { live, sayBtn, rich, copyText, loadState, saveState, speakAll, fmtTime } from './util.js';

registerVocab('ch7', VOCAB);

const MAX_SECONDS = 60;
const ALL_VIEWS = [...VIEWS, FREE_VIEW];

function part(id, n, title, intro) {
  return h(
    'div',
    { class: 'ch7-part', id },
    h('h3', { class: 'ch7-part__title' }, h('span', { class: 'ch7-part__n', 'aria-hidden': 'true' }, String(n)), bi(title)),
    intro ? rich(intro, 'p', { class: 'ch7-part__intro' }) : null,
  );
}

export default {
  id: 'ch7',
  ambience: { river: 0.3, wind: 0.15, rumble: 0 },
  sources: [
    {
      title: { en: 'Hangzhou News: “27 years ago, Liuhe Pagoda had a major repair” (2018)', zh: '杭州网《27年前 六和塔曾经历过一次大修》（2018）' },
      url: 'https://hznews.hangzhou.com.cn/chengshi/content/2018-09/11/content_7065768_0.htm',
      note: {
        en: 'Built 970 by the monk Zhijue to calm the tide; rebuilt in the Southern Song (1150s–1160s); name from the Buddhist “six harmonies”.',
        zh: '970年智觉禅师为镇钱江潮而建，南宋时（12世纪50至60年代）重建，塔名取佛教“六和敬”之义。',
      },
    },
    {
      title: {
        en: 'Hangzhou News: Guo Daiheng on the 1991 repair of Liuhe Pagoda (2018)',
        zh: '杭州网《矗立潮头近千年 六和塔为何神采依旧？》（2018，郭黛姮谈1991年大修）',
      },
      url: 'https://hznews.hangzhou.com.cn/chengshi/content/2018-09/11/content_7065675_0.htm',
      note: {
        en: 'Southern Song brick body, timber exterior from the Guangxu reign (Qing), “seven open, six sealed” storeys, first national heritage list in 1961.',
        zh: '南宋砖砌塔身，外包清光绪年间木结构，“七明六暗”，1961年列为第一批全国重点文物保护单位。',
      },
    },
    {
      title: { en: 'MDN: MediaStream Recording API', zh: 'MDN：MediaStream Recording API（录音）' },
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API',
      note: { en: 'How the recorder works; audio is kept in the browser.', zh: '录音功能的技术说明；音频只保存在浏览器里。' },
    },
    {
      title: { en: 'MDN: Web Speech API (speech recognition)', zh: 'MDN：Web Speech API（语音识别）' },
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API',
      note: {
        en: 'In Chrome and Edge, recognition runs on the browser maker’s servers, so it can fail offline or in mainland China.',
        zh: 'Chrome 和 Edge 的语音识别在浏览器厂商的服务器上进行，离线或在中国大陆时可能无法使用。',
      },
    },
  ],

  async mount(section) {
    const saved = loadState();
    const state = {
      view: VIEWS[0],
      audience: AUDIENCES.find((a) => a.id === saved.audience) || AUDIENCES[0],
      targets: new Set(saved.targets || []),
      customTargets: !!saved.customTargets,
      script: saved.script || '',
      caption: saved.caption || '',
      name: saved.name || '',
      transcript: '',
      recSeconds: 0,
    };
    const persist = () =>
      saveState({
        audience: state.audience.id,
        targets: [...state.targets],
        customTargets: state.customTargets,
        script: state.script,
        caption: state.caption,
        name: state.name,
      });

    section.append(
      chapterHeader({
        plaque: '讲解员',
        index: 7,
        title: { en: 'Be the Guide', zh: '我是讲解员' },
        lede: {
          en: 'Your turn to speak. Choose where you stand and who is listening, then give a one-minute tour in English and send a postcard of the view.',
          zh: '轮到你开口了。选一个位置、选一位听众，用英文做一分钟讲解，再把眼前的风景做成一张明信片。',
        },
      }),
      rich(
        {
          en: 'Everything you write or record stays on this device. Nothing is uploaded.',
          zh: '你写下或录下的一切都只保存在这台设备上，不会上传。',
        },
        'p',
        { class: 'ch7-privacy note' },
      ),
    );

    /* ───────────── 1 · Viewpoint ───────────── */
    const stageEl = h('div', { class: 'stage ch7-stage' });
    const hint = h('p', { class: 'stage__hint', hidden: true });
    live(hint, { en: 'Drag to look around · scroll or pinch to zoom', zh: '拖动环视 · 滚轮或双指缩放' });
    stageEl.append(hint);

    const viewBtns = new Map(); // id -> [buttons]
    function viewButton(v, cls) {
      const b = h('button', { type: 'button', class: cls, 'aria-pressed': 'false', onclick: () => chooseView(v.id) });
      live(b, v.label);
      if (!viewBtns.has(v.id)) viewBtns.set(v.id, []);
      viewBtns.get(v.id).push(b);
      return b;
    }
    const viewList = h('div', { class: 'ch7-views', role: 'group' }, ALL_VIEWS.map((v) => viewButton(v, 'ch7-views__btn')));
    live(viewList, { en: 'Viewpoints', zh: '视角' }, 'aria-label');

    const lightSegs = [];
    function lightControl() {
      const seg = segmented({
        options: LIGHTS,
        value: 'day',
        ariaLabel: { en: 'Light', zh: '光线' },
        onChange: (v) => {
          lightSegs.forEach((s) => s.set(v));
          scene && scene.setLight(v);
          if (cardMade) refreshCardSoon();
        },
      });
      lightSegs.push(seg);
      return seg.el;
    }

    const seeTitle = h('h4', { class: 'ch7-see__title' });
    const seeText = h('p', { class: 'ch7-see__text' });
    const pointsHead = h('p', { class: 'label' });
    live(pointsHead, { en: 'Point out', zh: '可以指给听众看' });
    const pointsList = h('ul', { class: 'ch7-see__points' });
    const sampleText = h('p', { class: 'ch7-see__sample', lang: 'en' });
    const useSample = h('button', { type: 'button', class: 'btn btn--ghost ch7-small', onclick: () => addToScript(state.view.sample) });
    live(useSample, { en: 'Add this line to my script', zh: '把这句加进讲稿' });
    const sampleBox = h(
      'div',
      { class: 'ch7-see__samplebox' },
      live(h('p', { class: 'label' }), { en: 'A line you could say here', zh: '在这里可以这样说' }),
      sampleText,
      h('div', { class: 'ch7-row' }, sayBtn(() => state.view.sample), useSample),
    );

    function renderSee() {
      const v = state.view;
      seeTitle.textContent = tr(v.label);
      seeText.textContent = tr(v.see);
      pointsList.replaceChildren(...v.points.map((p) => h('li', null, tr(p))));
      pointsHead.hidden = !v.points.length;
      sampleText.textContent = v.sample;
    }
    onLangChange(() => section.isConnected && renderSee());

    section.append(
      part('ch7-where', 1, { en: 'Choose where you stand', zh: '选一个位置' }, {
        en: 'Every good tour starts with where your listener is standing. Try each [[guide-viewpoint|viewpoint]] and notice what you would point at first.',
        zh: '好的讲解从听众站的位置开始。逐个试试这些[[guide-viewpoint|视角]]，想想你会先指给他们看什么。',
      }),
      h(
        'div',
        { class: 'ch7-viewer' },
        stageEl,
        h(
          'div',
          { class: 'ch7-viewer__panel' },
          live(h('p', { class: 'label' }), { en: 'Viewpoint', zh: '视角' }),
          viewList,
          live(h('p', { class: 'label ch7-gap' }), { en: 'Light', zh: '光线' }),
          lightControl(),
          h('div', { class: 'ch7-see', 'aria-live': 'polite' }, seeTitle, seeText, pointsHead, pointsList),
          sampleBox,
        ),
      ),
    );

    const scene = createGuideScene(stageEl, VIEWS[0]);

    let viewToken = 0;
    async function chooseView(id, instant = false) {
      const v = ALL_VIEWS.find((x) => x.id === id);
      state.view = v;
      for (const [vid, btns] of viewBtns) btns.forEach((b) => b.setAttribute('aria-pressed', String(vid === id)));
      renderSee();
      hint.hidden = id !== 'free';
      const token = ++viewToken;
      if (scene) {
        if (id === 'free') await scene.setFree(true);
        else await scene.setView(v, instant ? 0 : undefined);
      }
      if (token === viewToken && cardMade) refreshCardSoon();
    }
    for (const [vid, btns] of viewBtns) btns.forEach((b) => b.setAttribute('aria-pressed', String(vid === 'river')));
    renderSee();

    /* ───────────── 2 · Listener and script ───────────── */
    const audienceSeg = segmented({
      options: AUDIENCES.map((a) => ({ value: a.id, label: a.label })),
      value: state.audience.id,
      ariaLabel: { en: 'Who is listening?', zh: '谁在听？' },
      onChange: (id) => {
        state.audience = AUDIENCES.find((a) => a.id === id);
        if (!state.customTargets) state.targets = new Set(defaultTargets());
        persist();
        renderAudience();
        renderTargets();
      },
    });
    const tipsEl = h('p', { class: 'ch7-tips' });
    const movesEl = h('div', { class: 'ch7-moves' });
    const phrasesEl = h('div', { class: 'ch7-phrases' });

    const scriptId = 'ch7-script';
    const scriptTa = h('textarea', { id: scriptId, class: 'ch7-textarea', rows: 8, lang: 'en', spellcheck: 'true' });
    scriptTa.value = state.script;
    live(scriptTa, { en: 'Write your tour here, or tap the sentence starters to build it.', zh: '在这里写讲稿，或者点上面的句子开头来搭建。' }, 'placeholder');
    const scriptCount = h('p', { class: 'note ch7-count', 'aria-live': 'polite' });
    const syncCount = () => {
      const n = countWords(scriptTa.value);
      scriptCount.textContent = tr(
        { en: '{n} words · about {t} at a calm guide’s pace ({wpm} words a minute)', zh: '{n} 个词 · 按讲解员的平稳语速（每分钟 {wpm} 词）约 {t}' },
        { n, t: fmtTime((n / GUIDE_WPM) * 60), wpm: GUIDE_WPM },
      );
    };
    syncCount();
    onLangChange(() => section.isConnected && syncCount());
    let scriptTimer = 0;
    scriptTa.addEventListener('input', () => {
      state.script = scriptTa.value;
      syncCount();
      clearTimeout(scriptTimer);
      scriptTimer = setTimeout(persist, 400);
    });

    function addToScript(text) {
      const v = scriptTa.value;
      scriptTa.value = v + (v && !/\s$/.test(v) ? ' ' : '') + text;
      state.script = scriptTa.value;
      syncCount();
      persist();
      announce(tr({ en: 'Added to your script.', zh: '已加入讲稿。' }));
    }

    function renderAudience() {
      const a = state.audience;
      tipsEl.textContent = tr(a.tips);
      movesEl.replaceChildren(
        ...MOVES.map((m) =>
          h(
            'div',
            { class: 'ch7-move' },
            h('h4', { class: 'ch7-move__title' }, tr(m.label), h('span', { class: 'ch7-move__hint' }, tr(m.hint))),
            h(
              'div',
              { class: 'ch7-move__starters' },
              a.starters[m.id].map((s) =>
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'ch7-starter',
                    'aria-label': `${tr({ en: 'Add to script:', zh: '加入讲稿：' })} ${s.en}`,
                    onclick: () => addToScript(s.en),
                  },
                  h('span', { class: 'ch7-starter__en', lang: 'en' }, s.en),
                  h('span', { class: 'ch7-starter__zh only-zh', lang: 'zh-CN' }, s.zh),
                ),
              ),
            ),
          ),
        ),
      );
      phrasesEl.replaceChildren(
        h('p', { class: 'label' }, tr({ en: 'Useful expressions (tap to add)', zh: '常用表达（点击加入）' })),
        h(
          'div',
          { class: 'ch7-chips' },
          a.phrases.map((p) => h('button', { type: 'button', class: 'ch7-chip', lang: 'en', onclick: () => addToScript(p) }, p)),
        ),
      );
    }

    /* target words */
    function defaultTargets() {
      return [...getWordbook().slice(0, 4).map((w) => w.id), ...state.audience.targets];
    }
    if (!state.customTargets || !state.targets.size) state.targets = new Set(defaultTargets());

    function lookupWord(id) {
      return getWord(id) || getWordbook().find((w) => w.id === id);
    }
    function selectedTargets() {
      const seen = new Set();
      const out = [];
      for (const id of state.targets) {
        const w = lookupWord(id);
        if (!w || seen.has(w.en.toLowerCase())) continue;
        seen.add(w.en.toLowerCase());
        out.push(w);
      }
      return out;
    }
    const targetsEl = h('div', { class: 'ch7-targets__groups' });
    const targetSummary = h('p', { class: 'note' });
    function renderTargets() {
      const seen = new Set();
      const groups = [];
      const add = (label, list) => {
        const items = [];
        for (const w of list) {
          if (!w) continue;
          const k = w.en.toLowerCase();
          if (seen.has(k)) continue;
          seen.add(k);
          items.push(w);
        }
        if (items.length) groups.push({ label, items });
      };
      add({ en: 'From your wordbook', zh: '来自你的词本' }, getWordbook());
      add({ en: 'Suggested for this listener', zh: '适合这位听众' }, state.audience.targets.map(getWord));
      add({ en: 'Guide words', zh: '讲解常用词' }, getVocab('ch7'));
      add({ en: 'From other chapters', zh: '来自其他章节' }, getVocab().filter((w) => w.chapter !== 'ch7').slice(0, 30));
      targetsEl.replaceChildren(
        ...groups.map((g) =>
          h(
            'fieldset',
            { class: 'ch7-targets__group' },
            h('legend', { class: 'label' }, tr(g.label)),
            h(
              'div',
              { class: 'ch7-chips' },
              g.items.map((w) => {
                const input = h('input', { type: 'checkbox', checked: state.targets.has(w.id) });
                input.addEventListener('change', () => {
                  state.customTargets = true;
                  if (input.checked) state.targets.add(w.id);
                  else state.targets.delete(w.id);
                  persist();
                  syncTargetSummary();
                });
                return h(
                  'label',
                  { class: 'ch7-check' },
                  input,
                  h('span', { lang: 'en' }, w.en),
                  h('span', { class: 'ch7-check__zh', lang: 'zh-CN' }, w.zh),
                );
              }),
            ),
          ),
        ),
      );
      if (!getWordbook().length) {
        targetsEl.prepend(
          rich(
            {
              en: 'Your wordbook is empty. Tap a dotted word anywhere on the site, like [[guide-heritage|heritage]], and choose “Add to wordbook”: it will show up here.',
              zh: '你的词本还是空的。点网站上任何带虚线的词，比如[[guide-heritage|遗产]]，选择“加入词本”，它就会出现在这里。',
            },
            'p',
            { class: 'note' },
          ),
        );
      }
      syncTargetSummary();
    }
    function syncTargetSummary() {
      const n = selectedTargets().length;
      targetSummary.textContent = tr({ en: '{n} target words chosen. Try to use them in your tour.', zh: '已选 {n} 个目标词，讲解时尽量用上。' }, { n });
    }

    section.append(
      part('ch7-listener', 2, { en: 'Choose your listener', zh: '选你的听众' }, {
        en: 'The same pagoda sounds different to different people. A tour has five moves; tap any sentence starter to add it to your script, then make it your own.',
        zh: '同一座塔，讲给不同的人听，说法就不一样。一段讲解有五步；点任何一个句子开头就能加进讲稿，再改成你自己的话。',
      }),
      h('div', { class: 'ch7-audience' }, audienceSeg.el, tipsEl),
      h(
        'div',
        { class: 'ch7-builder' },
        h('div', { class: 'ch7-builder__moves' }, movesEl, phrasesEl),
        h(
          'div',
          { class: 'ch7-builder__side' },
          h(
            'div',
            { class: 'ch7-targets' },
            live(h('h4', { class: 'ch7-side__title' }), { en: 'Target words', zh: '目标词' }),
            targetSummary,
            targetsEl,
          ),
        ),
      ),
      h(
        'div',
        { class: 'ch7-script' },
        live(h('label', { for: scriptId, class: 'ch7-script__label' }), { en: 'Your script (a draft is fine)', zh: '你的讲稿（草稿就好）' }),
        scriptTa,
        scriptCount,
      ),
    );
    renderAudience();
    renderTargets();
    onLangChange(() => {
      if (!section.isConnected) return;
      renderAudience();
      renderTargets();
    });
    onWordbookChange(() => {
      if (!state.customTargets) state.targets = new Set(defaultTargets());
      renderTargets();
    });

    /* ───────────── 3 · Record ───────────── */
    const recBtn = h('button', { type: 'button', class: 'btn ch7-rec' });
    const stopBtn = h('button', { type: 'button', class: 'btn btn--ghost', disabled: true });
    live(stopBtn, { en: 'Stop', zh: '停止' });
    const timerEl = h('span', { class: 'ch7-timer', 'aria-live': 'off' }, `0:00 / ${fmtTime(MAX_SECONDS)}`);
    const barFill = h('span', { class: 'ch7-meter__fill' });
    const bar = h('div', { class: 'ch7-meter', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(MAX_SECONDS), 'aria-valuenow': '0' }, barFill);
    live(bar, { en: 'Recording time', zh: '录音时长' }, 'aria-label');
    const recStatus = h('p', { class: 'ch7-status', role: 'status' });
    let recStatusPair = null;
    const setRecStatus = (pair, kind = '') => {
      recStatusPair = pair;
      recStatus.className = `ch7-status ${kind ? `ch7-status--${kind}` : ''}`;
      recStatus.textContent = pair ? tr(pair) : '';
    };
    onLangChange(() => section.isConnected && setRecStatus(recStatusPair, recStatus.className.includes('warn') ? 'warn' : ''));

    const audioEl = h('audio', { controls: true, class: 'ch7-audio', preload: 'metadata' });
    const dlLink = h('a', { class: 'btn btn--ghost', href: '#', download: 'liuhe-tour.webm' });
    live(dlLink, { en: 'Download recording', zh: '下载录音' });
    const delBtn = h('button', { type: 'button', class: 'ch7-link' });
    live(delBtn, { en: 'Delete recording', zh: '删除录音' });
    const playback = h('div', { class: 'ch7-playback', hidden: true }, audioEl, h('div', { class: 'ch7-row' }, dlLink, delBtn));

    const liveId = 'ch7-live';
    const liveBox = h('input', { type: 'checkbox', id: liveId });
    const liveLabel = h('label', { for: liveId });
    live(liveLabel, { en: 'Show a live transcript (English, US)', zh: '显示实时英文字幕（美式英语识别）' });
    const liveNote = h('p', { class: 'note' });
    if (!canTranscribe()) {
      liveBox.disabled = true;
      live(liveNote, {
        en: 'Live transcript is not available in this browser (it works in Chrome and Edge). Record anyway, then type what you said in the box below.',
        zh: '这个浏览器不支持实时字幕（Chrome 和 Edge 可以）。照样录音，然后在下面的框里打出你说的话。',
      });
    } else {
      live(liveNote, {
        en: 'The transcript uses your browser’s speech service, which sends the sound to the browser maker (Google for Chrome, Microsoft for Edge). It often fails in mainland China; if it does, just type. Your recording itself never leaves this device.',
        zh: '实时字幕使用浏览器自带的语音服务，声音会发送给浏览器厂商（Chrome 是谷歌，Edge 是微软）。在中国大陆经常用不了，用不了就直接打字。录音本身不会离开这台设备。',
      });
    }

    const transId = 'ch7-transcript';
    const transTa = h('textarea', { id: transId, class: 'ch7-textarea', rows: 5, lang: 'en', spellcheck: 'true' });
    live(transTa, { en: 'What you said appears here if the live transcript works. You can also type it, or fix mistakes.', zh: '如果实时字幕可用，你说的话会出现在这里。也可以自己输入，或修改识别错误。' }, 'placeholder');
    transTa.addEventListener('input', () => {
      state.transcript = transTa.value;
    });

    let currentUrl = null;
    const recorder = createRecorder({
      maxSeconds: MAX_SECONDS,
      onTick: (s) => {
        timerEl.textContent = `${fmtTime(s)} / ${fmtTime(MAX_SECONDS)}`;
        barFill.style.width = `${(s / MAX_SECONDS) * 100}%`;
        bar.setAttribute('aria-valuenow', String(Math.round(s)));
      },
      onStop: ({ url, seconds, ext }) => {
        transcriber && transcriber.stop();
        state.recSeconds = seconds;
        currentUrl = url;
        audioEl.src = url;
        const d = new Date();
        const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
        dlLink.href = url;
        dlLink.download = `liuhe-tour-${stamp}.${ext}`;
        playback.hidden = false;
        setRecording(false);
        setRecStatus(
          transcriptFailed
            ? {
                en: `Recorded ${fmtTime(seconds)}. The live transcript did not work this time: type what you said in the transcript box, then check it below.`,
                zh: `已录 ${fmtTime(seconds)}。这次实时字幕没有成功：请在文字稿框里打出你说的话，再到下面看反馈。`,
              }
            : {
                en: `Recorded ${fmtTime(seconds)}. Listen back, then check it below.`,
                zh: `已录 ${fmtTime(seconds)}。回放听听，再到下面看反馈。`,
              },
          transcriptFailed ? 'warn' : 'ok',
        );
        if (seconds >= 5) markDone('ch7', 'recorded-a-tour');
        if (transTa.value.trim()) sourceSeg.set('speech');
      },
      onError: (code) => {
        transcriber && transcriber.stop();
        setRecording(false);
        const msgs = {
          unsupported: {
            en: 'Recording needs a recent browser on a secure (https) page. You can still type your script and get feedback.',
            zh: '录音需要较新的浏览器，并且页面使用 https。你仍然可以输入讲稿并获得反馈。',
          },
          denied: {
            en: 'Microphone access was blocked. Allow it from the icon in the address bar and try again, or type your script instead.',
            zh: '麦克风权限被拒绝。可以在地址栏的图标里允许后再试，或者直接输入讲稿。',
          },
          nomic: { en: 'No microphone was found. Plug one in, or type your script instead.', zh: '没有找到麦克风。接上麦克风，或者直接输入讲稿。' },
          failed: { en: 'The recording could not start. Try again, or type your script instead.', zh: '录音没能开始。再试一次，或者直接输入讲稿。' },
        };
        setRecStatus(msgs[code] || msgs.failed, 'warn');
      },
    });

    let transcriber = null;
    let transcriptFailed = false;
    function startTranscript() {
      transcriptFailed = false;
      if (!liveBox.checked || !canTranscribe()) return;
      transTa.value = '';
      transcriber = createTranscriber({
        onText: (finalText, interim) => {
          transTa.value = finalText + (interim ? (finalText ? ' ' : '') + interim : '');
          state.transcript = transTa.value;
        },
        onError: (code) => {
          transcriptFailed = true;
          const msg =
            code === 'network'
              ? {
                  en: 'The speech service could not be reached (this often happens in mainland China or offline). Your audio is still recording: type what you said in the transcript box.',
                  zh: '连不上语音服务（在中国大陆或离线时常见）。录音还在继续，请在字幕框里打出你说的话。',
                }
              : code === 'not-allowed' || code === 'service-not-allowed'
                ? {
                    en: 'The browser blocked speech recognition. Your audio is still recording: type your words in the transcript box.',
                    zh: '浏览器禁止了语音识别。录音还在继续，请在字幕框里打出你说的话。',
                  }
                : code === 'audio-capture'
                  ? { en: 'The transcript could not use the microphone. Type your words instead.', zh: '字幕无法使用麦克风，请改为打字。' }
                  : { en: `The live transcript stopped (${code}). Type your words in the box instead.`, zh: `实时字幕中断了（${code}），请在框里打字。` };
          setRecStatus(msg, 'warn');
        },
      });
      transcriber && transcriber.start('');
    }

    function setRecording(on) {
      recBtn.disabled = on;
      stopBtn.disabled = !on;
      recBtn.classList.toggle('is-live', on);
      recBtn._refresh && recBtn._refresh();
    }
    live(recBtn, () => (recorder.recording ? tr({ en: 'Recording…', zh: '正在录音…' }) : tr({ en: 'Start recording (1 minute)', zh: '开始录音（1分钟）' })));

    recBtn.addEventListener('click', async () => {
      setRecStatus({ en: 'Asking for the microphone…', zh: '正在请求麦克风…' });
      startTranscript();
      const ok = await recorder.start();
      if (ok) {
        setRecording(true);
        playback.hidden = true;
        setRecStatus({ en: 'Recording. Speak to your listener; it stops by itself at one minute.', zh: '正在录音。对着你的听众讲吧，满一分钟会自动停止。' });
      } else {
        transcriber && transcriber.stop();
      }
    });
    stopBtn.addEventListener('click', () => recorder.stop());
    delBtn.addEventListener('click', () => {
      recorder.discard();
      audioEl.removeAttribute('src');
      audioEl.load();
      currentUrl = null;
      playback.hidden = true;
      setRecStatus({ en: 'Recording deleted.', zh: '录音已删除。' });
    });

    const recPanel = h(
      'div',
      { class: 'ch7-recorder panel' },
      h('div', { class: 'ch7-row ch7-row--rec' }, recBtn, stopBtn, timerEl),
      bar,
      recStatus,
      playback,
      h('div', { class: 'ch7-live' }, h('div', { class: 'ch7-row' }, liveBox, liveLabel), liveNote),
      h(
        'div',
        { class: 'ch7-script' },
        live(h('label', { for: transId, class: 'ch7-script__label' }), { en: 'Transcript of your tour', zh: '讲解文字稿' }),
        transTa,
      ),
    );
    if (!canRecord()) {
      recBtn.disabled = true;
      setRecStatus(
        {
          en: 'This browser cannot record here (it needs a secure https page and a recent browser). Type your script above, and check it below.',
          zh: '这个浏览器在此无法录音（需要 https 页面和较新的浏览器）。请在上面输入讲稿，再到下面检查。',
        },
        'warn',
      );
    }

    section.append(
      part('ch7-record', 3, { en: 'Give your tour', zh: '开讲' }, {
        en: 'Face your listener, look at the view above, and talk for up to one minute. Don’t read word for word: glance at your script, then speak.',
        zh: '面向你的听众，看着上面的风景，讲上最多一分钟。别逐字念稿：瞄一眼讲稿，然后开口说。',
      }),
      recPanel,
    );

    /* ───────────── 4 · Feedback ───────────── */
    const sourceSeg = segmented({
      options: [
        { value: 'speech', label: { en: 'My transcript', zh: '我的文字稿' } },
        { value: 'script', label: { en: 'My typed script', zh: '我写的讲稿' } },
      ],
      value: 'script',
      ariaLabel: { en: 'What should we check?', zh: '检查哪一份？' },
    });
    const checkBtn = h('button', { type: 'button', class: 'btn' });
    live(checkBtn, { en: 'Check my tour', zh: '检查我的讲解' });
    const results = h('div', { class: 'ch7-results', 'aria-live': 'polite' });
    let lastResult = null;

    function runCheck() {
      const source = sourceSeg.get();
      const text = (source === 'speech' ? transTa.value : scriptTa.value).trim();
      if (!text) {
        lastResult = { empty: true, source };
        renderResults();
        return;
      }
      const r = analyse(text, {
        seconds: source === 'speech' ? state.recSeconds : 0,
        targets: selectedTargets(),
        maxSentence: state.audience.maxSentence,
      });
      lastResult = { r, source, text };
      renderResults();
      if (r.words >= 20) markDone('ch7', 'gave-a-tour');
    }
    checkBtn.addEventListener('click', runCheck);

    function stat(label, value, extra) {
      return h('div', { class: 'ch7-stat' }, h('dt', null, tr(label)), h('dd', null, value, extra ? h('span', { class: 'ch7-stat__extra' }, extra) : null));
    }

    function renderResults() {
      if (!lastResult) {
        results.replaceChildren();
        return;
      }
      if (lastResult.empty) {
        results.replaceChildren(
          h(
            'p',
            { class: 'ch7-status ch7-status--warn' },
            lastResult.source === 'speech'
              ? tr({ en: 'Your transcript is empty. Record with the live transcript on, or type what you said.', zh: '文字稿是空的。打开实时字幕再录一次，或者打出你说的话。' })
              : tr({ en: 'Your script is empty. Write a few sentences in step 2 first.', zh: '讲稿是空的。先在第2步写几句话。' }),
          ),
        );
        return;
      }
      const { r, source, text } = lastResult;
      const speechPace = source === 'speech' && r.wpm;
      const lengthValue = speechPace ? fmtTime(state.recSeconds) : `~${fmtTime(r.estSeconds)}`;
      const paceWord = !speechPace
        ? ''
        : r.wpm > 165
          ? tr({ en: 'fast', zh: '偏快' })
          : r.wpm < 95
            ? tr({ en: 'slow', zh: '偏慢' })
            : tr({ en: 'comfortable', zh: '舒服' });
      const lengthExtra = speechPace
        ? tr({ en: ' · recorded, {wpm} words a minute ({p})', zh: ' · 录音，每分钟 {wpm} 词（{p}）' }, { wpm: r.wpm, p: paceWord })
        : tr({ en: ' · estimated at {wpm} words a minute', zh: ' · 按每分钟 {wpm} 词估算' }, { wpm: GUIDE_WPM });
      const totalTargets = r.used.length + r.unused.length;
      results.replaceChildren(
        h(
          'dl',
          { class: 'ch7-stats' },
          stat({ en: 'Words', zh: '词数' }, String(r.words)),
          stat({ en: 'Length and pace', zh: '时长与语速' }, lengthValue, lengthExtra),
          stat(
            { en: 'Target words used', zh: '用上的目标词' },
            totalTargets ? `${r.used.length} / ${totalTargets}` : '—',
            r.used.length ? ` · ${r.used.map((w) => w.en).join(', ')}` : '',
          ),
          stat(
            { en: 'Filler words', zh: '填充词' },
            r.fillerTotal ? String(r.fillerTotal) : tr({ en: 'none', zh: '没有' }),
            r.fillerTotal ? ` · ${r.fillers.map((f) => `${f.word} ×${f.count}`).join(', ')}` : '',
          ),
        ),
        h(
          'div',
          { class: 'ch7-hltext' },
          h(
            'p',
            { class: 'ch7-legend note' },
            h('mark', { class: 'ch7-hl ch7-hl--target' }, tr({ en: 'target word', zh: '目标词' })),
            ' ',
            h('mark', { class: 'ch7-hl ch7-hl--filler' }, tr({ en: 'filler word', zh: '填充词' })),
          ),
          h('p', { class: 'ch7-hltext__body', lang: 'en' }, highlight(text, r.spans)),
        ),
        r.unused.length
          ? h('p', { class: 'note' }, tr({ en: 'Not used yet: ', zh: '还没用上：' }), r.unused.map((w) => w.en).join(', '))
          : null,
        h('h4', { class: 'ch7-side__title' }, tr({ en: 'Try this next', zh: '下一步可以试试' })),
        h('ul', { class: 'ch7-tiplist' }, tips(r, { source }).map((tp) => h('li', null, tr(tp)))),
      );
    }
    onLangChange(() => section.isConnected && renderResults());

    const copyScriptBtn = h('button', { type: 'button', class: 'btn btn--ghost' });
    live(copyScriptBtn, { en: 'Copy my script', zh: '复制讲稿' });
    const copyScriptNote = h('span', { class: 'note', role: 'status' });
    copyScriptBtn.addEventListener('click', async () => {
      const text = [scriptTa.value.trim(), transTa.value.trim() ? `\n— ${tr({ en: 'Transcript', zh: '文字稿' })} —\n${transTa.value.trim()}` : ''].join('');
      const ok = await copyText(text || '');
      copyScriptNote.textContent = ok ? tr({ en: 'Copied.', zh: '已复制。' }) : tr({ en: 'Copying is blocked in this browser.', zh: '这个浏览器不允许复制。' });
    });

    section.append(
      part('ch7-feedback', 4, { en: 'How did it go?', zh: '听听反馈' }, {
        en: 'Check your transcript or your typed script. You will see the length and pace, which target words you used, and any [[guide-filler|filler words]].',
        zh: '检查你的文字稿或讲稿：看看时长和语速、用上了哪些目标词，以及有没有[[guide-filler|口头填充词]]。',
      }),
      h(
        'div',
        { class: 'ch7-feedback panel' },
        h('div', { class: 'ch7-row' }, sourceSeg.el, checkBtn),
        results,
        h('div', { class: 'ch7-row ch7-gap' }, copyScriptBtn, copyScriptNote),
      ),
    );

    /* ───────────── 5 · Postcard ───────────── */
    const cardCanvas = h('canvas', { class: 'ch7-card__canvas', hidden: true, role: 'img' });
    const cardEmpty = h('p', { class: 'ch7-card__empty' });
    live(cardEmpty, { en: 'Your postcard will appear here.', zh: '你的明信片会出现在这里。' });
    const capId = 'ch7-caption';
    const capTa = h('textarea', { id: capId, class: 'ch7-textarea', rows: 3, maxlength: '220', lang: 'en' });
    capTa.value = state.caption;
    live(capTa, { en: 'Write one or two sentences in English for the back of your card.', zh: '用英文写一两句话，写在明信片上。' }, 'placeholder');
    const capCount = h('span', { class: 'note' });
    const syncCap = () => (capCount.textContent = `${capTa.value.length} / 220`);
    syncCap();
    capTa.addEventListener('input', () => {
      state.caption = capTa.value;
      syncCap();
      persist();
    });
    const suggestBtn = h('button', { type: 'button', class: 'ch7-link' });
    live(suggestBtn, { en: 'Suggest a caption for this view', zh: '为这个视角推荐一句' });
    suggestBtn.addEventListener('click', () => {
      capTa.value = state.view.caption;
      state.caption = capTa.value;
      syncCap();
      persist();
    });
    const nameId = 'ch7-name';
    const nameIn = h('input', { id: nameId, type: 'text', class: 'ch7-input', maxlength: '40', autocomplete: 'off' });
    nameIn.value = state.name;
    live(nameIn, { en: 'Optional', zh: '可不填' }, 'placeholder');
    nameIn.addEventListener('input', () => {
      state.name = nameIn.value;
      persist();
    });
    const makeBtn = h('button', { type: 'button', class: 'btn' });
    live(makeBtn, { en: 'Make my postcard', zh: '生成明信片' });
    const dlCardBtn = h('button', { type: 'button', class: 'btn btn--ghost', disabled: true });
    live(dlCardBtn, { en: 'Download as PNG', zh: '下载 PNG 图片' });
    const cardStatus = h('p', { class: 'note', role: 'status' });

    let cardMade = false;
    let cardBusy = false;
    let cardTimer = 0;
    function refreshCardSoon() {
      clearTimeout(cardTimer);
      cardTimer = setTimeout(makeCard, 250);
    }
    async function makeCard() {
      if (cardBusy) return;
      cardBusy = true;
      try {
        const image = scene ? scene.capture() : null;
        const viewLabel = state.view.id === 'free' ? 'Liuhe Pagoda, Hangzhou' : `Seen ${state.view.label.en.toLowerCase()}`;
        await composePostcard(cardCanvas, {
          image,
          caption: capTa.value.trim() || state.view.caption,
          viewLabel,
          name: nameIn.value.trim(),
          date: new Date(),
        });
        cardCanvas.hidden = false;
        cardEmpty.hidden = true;
        cardCanvas.setAttribute('aria-label', tr({ en: 'Your postcard: {c}', zh: '你的明信片：{c}' }, { c: capTa.value.trim() || state.view.caption }));
        dlCardBtn.disabled = false;
        if (!cardMade) markDone('ch7', 'made-a-postcard');
        cardMade = true;
        cardStatus.textContent = tr({ en: 'Postcard ready. Change the view, light or caption and press the button again to update it.', zh: '明信片做好了。换个视角、光线或文字，再点一次按钮就能更新。' });
      } catch (e) {
        console.error(e);
        cardStatus.textContent = tr({ en: 'The postcard could not be drawn. Try again.', zh: '明信片没能生成，请再试一次。' });
      } finally {
        cardBusy = false;
      }
    }
    makeBtn.addEventListener('click', makeCard);
    dlCardBtn.addEventListener('click', async () => {
      const ok = await downloadCanvas(cardCanvas, `liuhe-postcard-${state.view.id}.png`);
      if (ok) markDone('ch7', 'made-a-postcard');
    });

    const cardViews = h('div', { class: 'ch7-views ch7-views--compact', role: 'group' }, ALL_VIEWS.map((v) => viewButton(v, 'ch7-views__btn')));
    live(cardViews, { en: 'Viewpoint for the postcard', zh: '明信片的视角' }, 'aria-label');
    for (const [vid, btns] of viewBtns) btns.forEach((b) => b.setAttribute('aria-pressed', String(vid === state.view.id)));

    section.append(
      part('ch7-postcard', 5, { en: 'Send a postcard', zh: '寄一张明信片' }, {
        en: 'Pick a view and a light, write a caption in your best English, and download the card to share.',
        zh: '选一个视角和光线，用你最好的英文写一句话，下载明信片分享出去。',
      }),
      h(
        'div',
        { class: 'ch7-card' },
        h('div', { class: 'ch7-card__preview' }, cardCanvas, cardEmpty),
        h(
          'div',
          { class: 'ch7-card__form' },
          live(h('p', { class: 'label' }), { en: 'Viewpoint', zh: '视角' }),
          cardViews,
          live(h('p', { class: 'label ch7-gap' }), { en: 'Light', zh: '光线' }),
          lightControl(),
          h(
            'div',
            { class: 'ch7-field ch7-gap' },
            live(h('label', { for: capId, class: 'label' }), { en: 'Caption', zh: '明信片文字' }),
            capTa,
            h('div', { class: 'ch7-row ch7-row--between' }, suggestBtn, capCount),
          ),
          h(
            'div',
            { class: 'ch7-field' },
            live(h('label', { for: nameId, class: 'label' }), { en: 'Signed', zh: '署名' }),
            nameIn,
          ),
          h('div', { class: 'ch7-row ch7-gap' }, makeBtn, dlCardBtn),
          cardStatus,
        ),
      ),
    );
    if (!scene) {
      cardStatus.textContent = tr({ en: 'The 3D view is not available, so the postcard will have no picture.', zh: '3D 场景不可用，明信片上将没有画面。' });
    }

    /* ───────────── 6 · Journey ───────────── */
    const journeySummary = h('p', { class: 'ch7-journey__summary' });
    const chapterList = h('ol', { class: 'ch7-chapters' });
    const wordList = h('ul', { class: 'ch7-words' });
    const wordEmpty = rich(
      {
        en: 'No words saved yet. Tap any dotted word, like [[guide-landmark|landmark]], and choose “Add to wordbook”.',
        zh: '还没有收藏任何词。点任何带虚线的词，比如[[guide-landmark|地标]]，选择“加入词本”。',
      },
      'p',
      { class: 'note' },
    );
    const hearAllBtn = h('button', { type: 'button', class: 'btn btn--ghost' });
    live(hearAllBtn, { en: 'Hear them all', zh: '全部听一遍' });
    hearAllBtn.addEventListener('click', () => speakAll(getWordbook().map((w) => w.en)));
    if (!canSpeak()) hearAllBtn.hidden = true;
    const copyWordsBtn = h('button', { type: 'button', class: 'btn btn--ghost' });
    live(copyWordsBtn, { en: 'Copy as text', zh: '复制为文本' });
    const copyWordsNote = h('span', { class: 'note', role: 'status' });
    copyWordsBtn.addEventListener('click', async () => {
      const lines = getWordbook().map((w) => `${w.en} — ${w.zh}${w.pinyin ? ` (${w.pinyin})` : ''}${w.def ? `: ${w.def.en}` : ''}`);
      const ok = await copyText(lines.join('\n'));
      copyWordsNote.textContent = ok ? tr({ en: 'Copied.', zh: '已复制。' }) : tr({ en: 'Copying is blocked in this browser.', zh: '这个浏览器不允许复制。' });
    });

    function renderJourney() {
      const prog = getProgress();
      const done = CHAPTERS.filter((c) => (prog[c.id] || []).length);
      journeySummary.textContent = tr(
        { en: 'You have completed activities in {n} of {total} chapters.', zh: '你已经在 {total} 章中的 {n} 章完成了活动。' },
        { n: done.length, total: CHAPTERS.length },
      );
      chapterList.replaceChildren(
        ...CHAPTERS.map((c) => {
          const n = (prog[c.id] || []).length;
          return h(
            'li',
            { class: `ch7-chapter ${n ? 'is-done' : ''}` },
            h('span', { class: 'ch7-chapter__plaque', lang: 'zh-CN', 'aria-hidden': 'true' }, c.plaque),
            h('span', { class: 'ch7-chapter__title' }, tr(c.title)),
            n
              ? h('span', { class: 'ch7-chapter__state' }, tr({ en: '{n} done', zh: '完成 {n} 项' }, { n }))
              : h('a', { class: 'ch7-chapter__go', href: `#${c.id}` }, tr({ en: 'Visit', zh: '去看看' })),
          );
        }),
      );
      const words = getWordbook();
      wordEmpty.hidden = !!words.length;
      hearAllBtn.disabled = !words.length;
      copyWordsBtn.disabled = !words.length;
      wordList.replaceChildren(
        ...words.map((w) =>
          h(
            'li',
            { class: 'ch7-word' },
            h(
              'div',
              { class: 'ch7-word__head' },
              h('span', { class: 'ch7-word__en', lang: 'en' }, w.en),
              h('span', { class: 'ch7-word__zh', lang: 'zh-CN' }, w.zh),
              w.pinyin ? h('span', { class: 'ch7-word__py' }, w.pinyin) : null,
            ),
            w.def ? h('p', { class: 'ch7-word__def' }, tr(w.def)) : null,
            h(
              'div',
              { class: 'ch7-row' },
              sayBtn(w.en),
              h(
                'button',
                { type: 'button', class: 'ch7-link', onclick: () => removeWord(w.id) },
                tr({ en: 'Remove', zh: '移除' }),
                h('span', { class: 'visually-hidden' }, ` ${w.en}`),
              ),
            ),
          ),
        ),
      );
    }
    renderJourney();
    onProgress(() => section.isConnected && renderJourney());
    onWordbookChange(() => section.isConnected && renderJourney());
    onLangChange(() => section.isConnected && renderJourney());

    section.append(
      part('ch7-journey', 6, { en: 'Your journey', zh: '你的旅程' }, {
        en: 'What you did on this site, and the words you collected. Copy them into your notes and keep practising.',
        zh: '这是你在本站做过的事，以及收集到的词。把它们复制到笔记里，继续练习。',
      }),
      h(
        'div',
        { class: 'ch7-journey' },
        h('div', { class: 'ch7-journey__progress' }, journeySummary, chapterList),
        h(
          'div',
          { class: 'ch7-journey__words' },
          live(h('h4', { class: 'ch7-side__title' }), { en: 'My wordbook', zh: '我的词本' }),
          h('div', { class: 'ch7-row' }, hearAllBtn, copyWordsBtn, copyWordsNote),
          wordEmpty,
          wordList,
        ),
      ),
      rich(
        {
          en: 'Thank you for listening to the tide with us. Next time you stand beneath Liuhe Pagoda, you will know what to say.',
          zh: '谢谢你和我们一起听潮。下次站在六和塔下，你就知道该说些什么了。',
        },
        'p',
        { class: 'ch7-outro' },
      ),
    );

    // keep both viewpoint groups and the panel in step on first paint
    chooseView(state.view.id, true);
  },
};
