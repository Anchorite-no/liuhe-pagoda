/**
 * The things to do inside the story cards. Each widget is built once:
 *   make(ctx, step) → { el, enter?(), leave?() }
 * enter/leave run when the card becomes (or stops being) the one being read, so a widget can
 * drive the stage: the time machine burns and rebuilds the tower, the stones calm the river.
 * ctx: { $, viewer, ink, passport, openGame(name) }
 */
import { gsap } from 'gsap';
import { TIMELINE, DEBATE, PLAQUES, NAMING, GUIDE, QUIZ } from './content.js';
import { figure, PHOTOS } from './photos.js';
import * as sound from './sound.js';
import { speak, stopSpeaking, sayButton, canSpeak } from './speak.js';
import { quizBlock } from './learn.js';
import { createTideLab } from './tidelab.js';

const both = ($, zh, en, tag = 'p', cls = '') => $(tag, { class: cls }, $('span', { class: 'zh' }, zh), ' ', $('i', { class: 'en', lang: 'en' }, en));

/* ───────── 风铎: ring the bells ───────── */
function bells(ctx) {
  const { $ } = ctx;
  const btn = $('button', { type: 'button', class: 'btn btn--wind' }, '起风了 ', $('i', {}, 'Let the wind blow'));
  btn.addEventListener('click', () => {
    sound.windChimes(11, 2.8);
    ctx.viewer.glowBells();
    ctx.passport.award('bells');
  });
  const el = $('div', { class: 'widget widget--bells' },
    btn,
    $('p', { class: 'hint' }, '也可以直接点塔上的屋檐，听听不同高度的铃声。', $('br'), $('i', { lang: 'en' }, 'Or tap the eaves themselves: higher bells ring higher.')),
  );
  return { el };
}

/* ───────── 六和填江: seven stones calm the river ───────── */
function stones(ctx) {
  const { $ } = ctx;
  const N = 7;
  let n = 0;
  let active = false;
  const pebbles = Array.from({ length: N }, () => $('i', { class: 'pebble' }));
  const status = $('p', { class: 'stones__status', 'aria-live': 'polite' });
  const say = (zh, en) => status.replaceChildren($('span', {}, zh), $('br'), $('i', { lang: 'en' }, en));
  say('你也来试试：点击页面上的江面，投下七块石头。', 'Try it: click the river on the page to throw seven stones.');
  const el = $('div', { class: 'widget widget--stones' }, $('div', { class: 'pebbles' }, pebbles), status);
  ctx.onDrop((x) => {
    if (!active || n >= N) return;
    sound.plop((x / innerWidth) * 2 - 1);
    gsap.fromTo(pebbles[n], { scale: 0, y: -20 }, { scale: 1, y: 0, duration: 0.4, ease: 'back.out(3)' });
    pebbles[n].classList.add('is-in');
    n++;
    ctx.ink.setCalm(Math.min(0.9, (n / N) * 0.9));
    if (n < N) say(`还剩 ${N - n} 块。龙宫晃了一下……`, `${N - n} to go. The Dragon Palace shudders…`);
    else {
      ctx.ink.setCalm(1);
      say('江面平静下来了。龙王求和：放回六和的母亲，从此不让潮水害人。', 'The river falls still. The Dragon King gives in: Liuhe’s mother comes home, and the tide will harm no one.');
      el.append(both($, '这是民间故事；塔名一般认为来自佛教的“六和敬”。', 'This is a folk tale; the name is usually traced to the Buddhist “six harmonies”.', 'p', 'hint'));
      ctx.passport.award('stones');
    }
  });
  return {
    el,
    enter() {
      active = true;
      if (n >= N) ctx.ink.setCalm(1);
    },
    leave() {
      active = false;
      ctx.ink.setCalm(0);
    },
  };
}

/* ───────── 时光机: drag through a thousand years ───────── */
const ERA = (y) =>
  y < 960 ? ['', ''] : y < 978 ? ['吴越', 'Wuyue'] : y < 1127 ? ['北宋', 'Northern Song'] : y < 1279 ? ['南宋', 'Southern Song'] : y < 1368 ? ['元', 'Yuan'] : y < 1644 ? ['明', 'Ming'] : y < 1912 ? ['清', 'Qing'] : y < 1949 ? ['民国', 'Republic of China'] : ['中华人民共和国', 'People’s Republic'];
const STATE_NAME = {
  ghost: ['最初的塔（已不存）', 'the first tower (lost)'],
  gone: ['毁', 'destroyed'],
  brick: ['只剩砖塔身', 'brick body only'],
  whole: ['砖身木檐', 'brick body, timber eaves'],
};
function timemachine(ctx) {
  const { $ } = ctx;
  const last = TIMELINE.length - 1;
  let at = last;
  let active = false;
  const seen = new Set([last]);
  const year = $('b', { class: 'tm__year' });
  const era = $('span', { class: 'tm__era' });
  const state = $('span', { class: 'tm__state' });
  const text = $('div', { class: 'tm__text' });
  const pic = $('div', { class: 'tm__pic' });
  const ticks = TIMELINE.map((e, i) =>
    $('button', { type: 'button', class: `tm__tick tm__tick--${e.state}`, style: `left:${(i / last) * 100}%`, title: String(e.y), 'aria-label': String(e.y), onclick: () => go(i) }, i % 3 === 0 || i === last ? $('small', {}, e.y) : null),
  );
  const thumb = $('span', { class: 'tm__thumb', 'aria-hidden': 'true' });
  const track = $('div', { class: 'tm__track' }, $('i', { class: 'tm__line' }), ticks, thumb);
  const range = $('input', { type: 'range', min: 0, max: last, step: 1, value: at, class: 'tm__range', 'aria-label': '年份 Year' });
  range.addEventListener('input', () => go(Number(range.value)));
  const prev = $('button', { type: 'button', class: 'btn btn--line btn--small', onclick: () => go(Math.max(0, at - 1)) }, '← 上一个');
  const next = $('button', { type: 'button', class: 'btn btn--line btn--small', onclick: () => go(Math.min(last, at + 1)) }, '下一个 →');
  let playing = null;
  const play = $('button', { type: 'button', class: 'btn btn--small', onclick: () => (playing ? stop() : start()) }, '▶ 从 970 年播放 ', $('i', {}, 'Play'));
  function start() {
    play.firstChild.textContent = '■ 停止 ';
    go(0);
    playing = setInterval(() => (at < last ? go(at + 1) : stop()), 3400);
  }
  function stop() {
    clearInterval(playing);
    playing = null;
    play.firstChild.textContent = '▶ 从 970 年播放 ';
  }
  const el = $('div', { class: 'widget tm' },
    $('div', { class: 'tm__head' }, year, $('div', {}, era, state)),
    track, range,
    $('div', { class: 'tm__nav' }, prev, play, next),
    text, pic,
  );
  let shownState = 'whole';
  function go(i, quiet = false) {
    const prevState = TIMELINE[at].state;
    at = i;
    range.value = i;
    const e = TIMELINE[i];
    seen.add(i);
    const counter = { y: Number(year.textContent) || e.y };
    gsap.to(counter, { y: e.y, duration: quiet ? 0 : 0.6, ease: 'power2.out', onUpdate: () => (year.textContent = Math.round(counter.y)) });
    const [ez, ee] = ERA(e.y);
    era.replaceChildren(ez, ' ', $('i', { lang: 'en' }, ee));
    state.textContent = `${STATE_NAME[e.state][0]} · ${STATE_NAME[e.state][1]}`;
    state.className = `tm__state is-${e.state}`;
    thumb.style.left = `${(i / last) * 100}%`;
    ticks.forEach((t, k) => t.classList.toggle('is-on', k === i));
    text.replaceChildren($('p', { class: 'zh' }, e.zh), $('p', { class: 'en', lang: 'en' }, e.en));
    pic.replaceChildren();
    if (e.photo && PHOTOS[e.photo]) pic.append(figure($, e.photo, { cls: 'photo--tm', group: TIMELINE.filter((x) => x.photo).map((x) => x.photo) }));
    if (!quiet) gsap.from([text, pic], { opacity: 0, y: 8, duration: 0.45, ease: 'power2.out' });
    if (active) applyState(e.state, prevState);
    if (seen.size >= 10) ctx.passport.award('history');
  }
  function applyState(s) {
    if (s === shownState) return;
    const burning = (s === 'brick' || s === 'gone') && shownState !== 'gone';
    const rising = s === 'whole' && shownState !== 'whole';
    shownState = s;
    ctx.viewer.setHistory(s);
    if (burning) sound.fire(2.6);
    else if (rising) sound.rebuild(2.2);
  }
  go(at, true);
  return {
    el,
    enter() {
      active = true;
      shownState = 'whole';
      applyState(TIMELINE[at].state);
    },
    leave() {
      active = false;
      stop();
      ctx.viewer.setHistory('whole');
      shownState = 'whole';
    },
  };
}

/* ───────── 复原还是保留: Liang Sicheng or 1991 ───────── */
function debate(ctx) {
  const { $ } = ctx;
  const out = $('div', { class: 'debate__out' });
  const picks = DEBATE.options.map((o, i) =>
    $('button', { type: 'button', class: 'debate__pick', onclick: () => choose(i) }, $('b', {}, o.pick.zh), $('i', { lang: 'en' }, o.pick.en)),
  );
  function choose(i) {
    picks.forEach((p, k) => {
      p.classList.toggle('is-on', k === i);
      p.setAttribute('aria-pressed', String(k === i));
    });
    out.replaceChildren(
      $('div', { class: 'debate__sides' },
        DEBATE.options.map((o, k) =>
          $('div', { class: `debate__side${k === i ? ' is-mine' : ''}` },
            $('b', {}, k === i ? '你的选择 · ' : '另一种看法 · ', $('i', { lang: 'en' }, k === i ? 'Your pick' : 'The other view')),
            figure($, o.photo, { caption: false }),
            $('p', { class: 'zh' }, o.zh),
            $('p', { class: 'en', lang: 'en' }, o.en),
          ),
        ),
      ),
      both($, DEBATE.after.zh, DEBATE.after.en, 'p', 'debate__after'),
    );
    gsap.from(out.querySelectorAll('.debate__side, .debate__after'), { y: 16, opacity: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out' });
  }
  const el = $('div', { class: 'widget debate' }, both($, DEBATE.q.zh, DEBATE.q.en, 'p', 'debate__q'), $('div', { class: 'debate__picks' }, picks), out);
  return { el };
}

/* ───────── 登塔: one plaque a floor ───────── */
const NUM = ['一', '二', '三', '四', '五', '六', '七'];
function plaque(ctx, step) {
  const { $ } = ctx;
  const n = step.floor;
  const p = PLAQUES[n - 1];
  // a little elevation: seven floors, this one lit
  const tower = $('div', { class: 'climb__tower', 'aria-hidden': 'true' }, [7, 6, 5, 4, 3, 2, 1].map((k) => $('i', { class: k === n ? 'is-on' : k < n ? 'is-done' : '' })));
  // old plaques read from right to left
  const board = $('div', { class: 'plaque__board', lang: 'zh-Hant' }, [...p.text].reverse().map((c, k) => $('span', { class: k === 3 ? 'is-num' : '' }, c)));
  const el = $('div', { class: 'widget climb' },
    $('div', { class: 'climb__head' },
      tower,
      $('div', {},
        $('p', { class: 'climb__floor' }, `第${NUM[n - 1]}层`, $('i', { lang: 'en' }, ` Floor ${n}`)),
        $('div', { class: 'plaque' }, board),
        $('p', { class: 'plaque__py', lang: 'zh-Latn' }, p.py, sayButton($, p.text, 'zh-CN', '读中文 Listen')),
        $('p', { class: 'plaque__en', lang: 'en' }, `“${p.en}”`),
      ),
    ),
    $('p', { class: 'zh' }, p.zh),
    $('p', { class: 'en', lang: 'en' }, p.enMeaning),
    both($, p.note.zh, p.note.en, 'p', 'climb__note'),
    figure($, p.photo, { group: PLAQUES.map((x) => x.photo) }),
    n === 1 ? both($, '小提示：古代的匾从右往左读。红圈里的字就是层数。', 'Tip: old plaques read from right to left. The circled character is the floor number.', 'p', 'hint') : null,
  );
  return {
    el,
    enter() {
      gsap.fromTo(board.children, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.5, stagger: { each: 0.12, from: 'end' }, ease: 'power2.out' });
      if (n === 7) ctx.passport.award('climb');
    },
  };
}

/* ───────── 译名工坊 ───────── */
const VERDICT = ['不好 Weak', '还行 Fair', '最好 Best'];
// the verdict is already on the tag in front of the reason
const bare = (t) => t.replace(/^(最好|还行|不好)：|^(Best|Fair|Weak): /, '');
function naming(ctx) {
  const { $ } = ctx;
  let done = 0;
  let score = 0;
  const total = $('p', { class: 'naming__total', 'aria-live': 'polite' });
  const items = NAMING.map((it) => {
    const why = $('div', { class: 'naming__why' });
    const opts = it.options.map((o) => {
      const b = $('button', { type: 'button', class: 'naming__opt', lang: 'en' }, o.en);
      b.addEventListener('click', () => {
        if (card.dataset.done) return;
        card.dataset.done = '1';
        done++;
        score += o.v;
        opts.forEach((x, k) => {
          x.disabled = true;
          x.classList.add(`v${it.options[k].v}`);
        });
        b.classList.add('is-mine');
        const best = it.options.find((x) => x.v === 2);
        why.replaceChildren(
          $('p', {}, $('b', { class: `tag v${o.v}` }, VERDICT[o.v]), ' ', bare(o.why.zh), $('br'), $('i', { lang: 'en' }, bare(o.why.en))),
          o.v < 2 ? $('p', {}, $('b', { class: 'tag v2' }, VERDICT[2]), ' ', $('span', { lang: 'en' }, best.en), $('br'), bare(best.why.zh)) : null,
        );
        gsap.from(why, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.out' });
        if (done === NAMING.length) {
          total.replaceChildren($('b', {}, `${score} / ${NAMING.length * 2}`), ' 译名工坊完成。', $('i', { lang: 'en' }, ' Workshop complete. '), score >= 10 ? '很有国际传播的眼光！' : '多想一步：外国读者第一次听到它，能看懂吗？');
        }
      });
      return b;
    });
    const card = $('div', { class: 'naming__item' },
      $('p', { class: 'naming__term' }, $('b', {}, it.zh), $('span', { lang: 'zh-Latn' }, it.py), sayButton($, it.zh.replace(/（.*）/, ''), 'zh-CN', '读中文 Listen')),
      $('div', { class: 'naming__opts' }, opts),
      why,
    );
    return card;
  });
  const el = $('div', { class: 'widget naming' }, $('div', { class: 'naming__grid' }, items), total);
  return { el };
}

/* ───────── 当一回导游: build a script, hear it, read along ───────── */
function guide(ctx) {
  const { $ } = ctx;
  const chosen = GUIDE.map(() => null);
  const lines = GUIDE.map(() => $('span', { class: 'script__line' }));
  const script = $('div', { class: 'script is-empty', lang: 'en' }, lines);
  const fb = $('div', { class: 'guide__fb' });
  const slots = GUIDE.map((g, i) => {
    const opts = g.options.map((o, k) =>
      $('button', { type: 'button', class: 'guide__opt', lang: 'en', 'aria-pressed': 'false', onclick: () => pick(i, k) }, o.en),
    );
    return $('div', { class: 'guide__slot' }, $('p', { class: 'guide__part' }, $('b', {}, `${i + 1}`), g.part.zh, $('i', { lang: 'en' }, ` ${g.part.en}`)), $('div', { class: 'guide__opts' }, opts));
  });
  function pick(i, k) {
    chosen[i] = k;
    script.classList.remove('is-empty');
    slots[i].querySelectorAll('.guide__opt').forEach((b, j) => b.setAttribute('aria-pressed', String(j === k)));
    lines[i].textContent = GUIDE[i].options[k].en + ' ';
    gsap.fromTo(lines[i], { backgroundColor: 'rgba(181,50,28,0.25)' }, { backgroundColor: 'rgba(181,50,28,0)', duration: 1.2 });
    fb.replaceChildren();
  }
  const ready = () => chosen.every((c) => c != null);
  const listen = $('button', { type: 'button', class: 'btn btn--small' }, '▶ 听一遍 ', $('i', {}, 'Listen'));
  const along = $('button', { type: 'button', class: 'btn btn--line btn--small' }, '跟读 ', $('i', {}, 'Read along'));
  const finish = $('button', { type: 'button', class: 'btn btn--line btn--small' }, '完成，看点评 ', $('i', {}, 'Done: feedback'));
  const bar = $('i', { class: 'guide__bar' });
  let running = false;
  async function read(withPauses) {
    if (running) {
      running = false;
      stopSpeaking();
      return;
    }
    if (!ready()) {
      fb.replaceChildren(both($, '先把六段都选好。', 'Choose a sentence for all six parts first.', 'p', 'hint'));
      return;
    }
    running = true;
    for (let i = 0; i < lines.length && running; i++) {
      lines.forEach((l, k) => l.classList.toggle('is-reading', k === i));
      await speak(GUIDE[i].options[chosen[i]].en, 'en-US', { rate: 0.9 });
      if (withPauses && running) {
        // your turn: as long again as the sentence took to say
        const ms = Math.max(2200, GUIDE[i].options[chosen[i]].en.length * 75);
        lines[i].classList.add('is-yours');
        await new Promise((r) => gsap.fromTo(bar, { scaleX: 1 }, { scaleX: 0, duration: ms / 1000, ease: 'none', onComplete: r }));
        lines[i].classList.remove('is-yours');
      }
    }
    running = false;
    lines.forEach((l) => l.classList.remove('is-reading'));
  }
  listen.addEventListener('click', () => read(false));
  along.addEventListener('click', () => read(true));
  finish.addEventListener('click', () => {
    if (!ready()) {
      fb.replaceChildren(both($, '先把六段都选好。', 'Choose a sentence for all six parts first.', 'p', 'hint'));
      return;
    }
    const s = chosen.reduce((a, k, i) => a + GUIDE[i].options[k].v, 0);
    const stars = s >= 11 ? 3 : s >= 8 ? 2 : 1;
    fb.replaceChildren(
      $('p', { class: 'guide__stars' }, '★'.repeat(stars) + '☆'.repeat(3 - stars), ' ', $('b', {}, `${s} / 12`), ' ', stars === 3 ? '金牌导游！' : stars === 2 ? '不错的导游。' : '再挑一挑。', $('i', { lang: 'en' }, stars === 3 ? ' A gold-star guide!' : stars === 2 ? ' A good guide.' : ' Try a few different picks.')),
      $('ol', {}, chosen.map((k, i) => {
        const o = GUIDE[i].options[k];
        return $('li', { class: `v${o.v}` }, $('b', { class: `tag v${o.v}` }, VERDICT[o.v]), ' ', o.note.zh, ' ', $('i', { lang: 'en' }, o.note.en));
      })),
    );
    gsap.from(fb.children, { y: 10, opacity: 0, stagger: 0.08, duration: 0.4 });
    ctx.passport.award('words');
  });
  const el = $('div', { class: 'widget guide' },
    $('div', { class: 'guide__slots' }, slots),
    $('div', { class: 'guide__stage' },
      $('p', { class: 'guide__label' }, '你的讲解词 ', $('i', { lang: 'en' }, 'Your script')),
      script,
      bar,
      $('div', { class: 'guide__actions' }, canSpeak ? [listen, along] : both($, '这个浏览器不支持朗读，可以自己大声读一遍。', 'This browser cannot read aloud; read it out yourself.', 'p', 'hint'), finish),
      fb,
    ),
  );
  return { el, leave: () => running && read() };
}

/* ───────── games and the lab ───────── */
function gameCard(ctx, name, seal, zh, en, cta) {
  const { $ } = ctx;
  const done = $('span', { class: 'game-cta__done' }, '已完成 ✓ Done');
  done.hidden = !ctx.passport.has(seal);
  const el = $('div', { class: `widget game-cta game-cta--${name}` },
    $('div', { class: 'game-cta__art', 'aria-hidden': 'true' }),
    $('div', {},
      $('p', {}, zh, $('br'), $('i', { lang: 'en' }, en)),
      $('button', { type: 'button', class: 'btn', onclick: () => ctx.openGame(name, () => (done.hidden = !ctx.passport.has(seal))) }, cta[0], ' ', $('i', {}, cta[1])),
      done,
    ),
  );
  return { el };
}
const dougong = (ctx) => gameCard(ctx, 'dougong', 'dougong', '十三个构件，一个一个放上去。放错了，它会告诉你缺什么。', 'Thirteen pieces, one at a time. Put one in the wrong place and it tells you what is missing.', ['动手搭斗拱', 'Build it']);
const rider = (ctx) => gameCard(ctx, 'rider', 'rider', '你就是弄潮儿：站上潮头，护住红旗，从海宁一路冲到六和塔下。', 'You are the tide-player: stand on the crest, keep the red flag dry, and ride from Haining to the pagoda.', ['开始弄潮', 'Ride the bore']);
function tidelab(ctx) {
  const lab = createTideLab(ctx.$, { onBiggest: () => ctx.passport.award('tidelab') });
  return { el: lab.el, enter: lab.start, leave: lab.stop };
}

function quiz(ctx) {
  const { $ } = ctx;
  const el = $('div', { class: 'widget' },
    quizBlock($, QUIZ, {
      onDone: (right, total) => {
        ctx.passport.setQuiz(right, total);
        ctx.passport.award('quiz');
      },
    }),
    ctx.passport.certificateBlock(),
  );
  return { el };
}

export const WIDGETS = { bells, stones, timemachine, debate, plaque, naming, guide, dougong, rider, tidelab, quiz };
