/**
 * The practice chapter: a short quiz on what the story told, every line in both languages,
 * with the reason shown once a question is answered.
 */

/** Chinese and English together: <span>中文</span><i>English</i> */
const both = ($, tag, attrs, t) => $(tag, attrs, $('span', { class: 'zh' }, t.zh), ' ', $('i', { class: 'en', lang: 'en' }, t.en));

/* ───────── quiz ───────── */
export function quizBlock($, items) {
  const wrap = $('div', { class: 'quiz' });
  const score = $('p', { class: 'quiz__score', 'aria-live': 'polite' });
  let answered = 0;
  let right = 0;
  const cards = [];
  function update() {
    if (answered < items.length) {
      score.textContent = '';
      return;
    }
    const all = right === items.length;
    score.replaceChildren(
      $('span', { class: 'zh' }, `答对 ${right} / ${items.length}。${all ? '全对！' : '没答对的，回到前面对应的章节看看。'}`),
      ' ',
      $('i', { class: 'en', lang: 'en' }, `${right} of ${items.length} right. ${all ? 'All correct!' : 'For the ones you missed, look back at that chapter.'}`),
    );
  }
  items.forEach((q, i) => {
    const why = both($, 'p', { class: 'quiz__why', hidden: true }, q.why);
    const card = $('div', { class: 'quiz__q', role: 'group' });
    const opts = q.options.map((o, k) => {
      const b = $('button', { type: 'button', class: 'quiz__opt' }, o.zh === o.en ? o.zh : [$('span', { class: 'zh' }, o.zh), ' ', $('i', { class: 'en', lang: 'en' }, o.en)]);
      b.addEventListener('click', () => {
        if (card.dataset.done) return;
        card.dataset.done = '1';
        opts.forEach((x, j) => {
          x.disabled = true;
          if (j === q.answer) x.classList.add('is-right');
        });
        if (k === q.answer) right++;
        else b.classList.add('is-wrong');
        answered++;
        why.hidden = false;
        update();
      });
      return b;
    });
    card.append(both($, 'p', { class: 'quiz__text' }, { zh: `${i + 1}. ${q.q.zh}`, en: q.q.en }), $('div', { class: 'quiz__opts' }, opts), why);
    cards.push({ card, opts, why });
    wrap.append(card);
  });
  const again = $('button', { type: 'button', class: 'btn btn--line btn--small' }, '重做 Again');
  again.addEventListener('click', () => {
    answered = right = 0;
    for (const c of cards) {
      delete c.card.dataset.done;
      c.why.hidden = true;
      for (const x of c.opts) {
        x.disabled = false;
        x.classList.remove('is-right', 'is-wrong');
      }
    }
    update();
  });
  wrap.append($('div', { class: 'quiz__foot' }, score, again));
  return wrap;
}
