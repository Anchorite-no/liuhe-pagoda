/**
 * The seal book: nine seals, one for each thing the reader does on the way (nine, like the
 * nine storeys of the first tower of 970). Each one is stamped onto the screen when earned and
 * flies up into the book in the header. At the end the book becomes a certificate: drawn on a
 * canvas with the reader's name, the seals they collected and their quiz score, saved as a PNG.
 * Progress is kept in this browser only (localStorage), and the page works without it.
 */
import { gsap } from 'gsap';
import { stamp as stampSound } from './sound.js';

export const SEALS = [
  { id: 'bells', ch: '铎', zh: '听风铎', en: 'Ring the bells', at: '#meet' },
  { id: 'stones', ch: '石', zh: '投石镇江', en: 'Calm the river', at: '#origin' },
  { id: 'history', ch: '史', zh: '穿越千年', en: 'Travel the years', at: '#history' },
  { id: 'dougong', ch: '拱', zh: '搭一组斗拱', en: 'Build a dougong', at: '#apart' },
  { id: 'climb', ch: '登', zh: '登上第七层', en: 'Reach the top', at: '#climb' },
  { id: 'tidelab', ch: '潮', zh: '找到最大的潮', en: 'Find the biggest tide', at: '#tide' },
  { id: 'rider', ch: '弄', zh: '弄潮到塔下', en: 'Ride the bore', at: '#tide' },
  { id: 'words', ch: '译', zh: '当一回导游', en: 'Be the guide', at: '#world' },
  { id: 'quiz', ch: '答', zh: '答完小测', en: 'Finish the quiz', at: '#practice' },
];

const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem(`liuhe.${k}`);
      return v == null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(`liuhe.${k}`, JSON.stringify(v));
    } catch {
      /* private window: progress lasts until the tab closes */
    }
  },
};

export function createPassport($, { goTo } = {}) {
  const got = new Set(store.get('seals', []));
  let quiz = store.get('quiz', null); // { right, total }

  /* ── the header button ── */
  const count = $('b', { class: 'pass__n' }, String(got.size));
  const button = $('button', { type: 'button', class: 'pass', 'aria-haspopup': 'dialog', title: '印章册 Seal book', onclick: () => open() },
    $('span', { class: 'pass__seal', 'aria-hidden': 'true' }, '印'),
    $('span', { class: 'pass__label' }, count, '/9'),
  );

  /* ── the book ── */
  const cells = SEALS.map((s) =>
    $('li', { class: 'book__cell', 'data-id': s.id },
      $('span', { class: 'book__seal', 'aria-hidden': 'true' }, s.ch),
      $('b', {}, s.zh),
      $('i', { lang: 'en' }, s.en),
      $('a', { href: s.at, class: 'book__go', onclick: (e) => { e.preventDefault(); close(); goTo && goTo(s.at); } }, '去盖章 →'),
    ),
  );
  const nameIn = $('input', { type: 'text', maxlength: 24, placeholder: '你的名字 Your name', 'aria-label': '你的名字 Your name', value: store.get('name', '') });
  nameIn.addEventListener('input', () => store.set('name', nameIn.value));
  const preview = $('div', { class: 'cert' });
  const panel = $('aside', { class: 'book', role: 'dialog', 'aria-modal': 'true', 'aria-label': '印章册 Seal book', hidden: true },
    $('button', { type: 'button', class: 'book__close', onclick: () => close(), 'aria-label': '关闭 Close' }, '✕'),
    $('p', { class: 'book__eyebrow', lang: 'en' }, 'SEAL BOOK'),
    $('h2', {}, '印章册'),
    $('p', { class: 'book__intro' }, '一路上做九件事，盖九枚印章，正好是 970 年那座塔的九级。', $('br'), $('i', { lang: 'en' }, 'Nine things to do on the way, nine seals: as many as the storeys of the first tower of 970.')),
    $('ol', { class: 'book__grid' }, cells),
    $('div', { class: 'book__cert' },
      $('h3', {}, '登塔证书 ', $('i', { lang: 'en' }, 'Your certificate')),
      $('p', {}, '印章越多，证书上的红印越多。随时都能生成。', $('br'), $('i', { lang: 'en' }, 'The more seals, the more red on the page. Make it any time.')),
      $('div', { class: 'book__form' }, nameIn, $('button', { type: 'button', class: 'btn', onclick: () => makeCertificate() }, '生成证书 ', $('i', {}, 'Make it'))),
      preview,
    ),
  );
  const scrim = $('div', { class: 'book__scrim', hidden: true, onclick: () => close() });
  document.body.append(scrim, panel);

  function paint() {
    count.textContent = String(got.size);
    for (const c of cells) c.classList.toggle('is-got', got.has(c.dataset.id));
  }
  paint();

  function open() {
    paint();
    scrim.hidden = panel.hidden = false;
    gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.55, ease: 'power3.out' });
    gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.from(panel.querySelectorAll('.book__cell'), { y: 16, opacity: 0, duration: 0.45, stagger: 0.04, delay: 0.15, ease: 'power2.out' });
    document.documentElement.classList.add('is-boxed');
    panel.querySelector('.book__close').focus();
  }
  function close() {
    if (panel.hidden) return;
    gsap.to(panel, { xPercent: 100, duration: 0.4, ease: 'power2.in', onComplete: () => (panel.hidden = true) });
    gsap.to(scrim, { opacity: 0, duration: 0.3, onComplete: () => (scrim.hidden = true) });
    document.documentElement.classList.remove('is-boxed');
  }
  addEventListener('keydown', (e) => e.key === 'Escape' && close());

  /* ── earning a seal: it lands in the middle of the screen, then flies up into the book ── */
  function award(id) {
    const s = SEALS.find((x) => x.id === id);
    if (!s || got.has(id)) return false;
    got.add(id);
    store.set('seals', [...got]);
    stampSound();
    const fx = $('div', { class: 'stampfx', 'aria-live': 'polite' },
      $('span', { class: 'stampfx__seal' }, s.ch),
      $('p', {}, `获得印章 · ${s.zh}`, $('br'), $('i', { lang: 'en' }, `Seal earned: ${s.en}`), $('small', {}, `${got.size} / 9`)),
    );
    document.body.append(fx);
    const seal = fx.querySelector('.stampfx__seal');
    const r = button.getBoundingClientRect();
    const tl = gsap.timeline({ onComplete: () => fx.remove() });
    tl.fromTo(seal, { scale: 2.8, rotate: -24, opacity: 0 }, { scale: 1, rotate: -6, opacity: 1, duration: 0.42, ease: 'back.out(2.2)' })
      .from(fx.querySelector('p'), { y: 12, opacity: 0, duration: 0.4 }, '-=0.1')
      .to(fx.querySelector('p'), { opacity: 0, duration: 0.3 }, '+=1.1')
      .to(seal, {
        x: () => r.left + r.width / 2 - innerWidth / 2,
        y: () => r.top + r.height / 2 - innerHeight / 2,
        scale: 0.16,
        duration: 0.7,
        ease: 'power3.in',
      }, '<')
      .add(() => {
        paint();
        gsap.fromTo(button, { scale: 1.35 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1.2, 0.4)' });
      });
    return true;
  }

  /* ── the certificate ── */
  async function makeCertificate() {
    const name = nameIn.value.trim() || '无名的登塔人';
    store.set('name', nameIn.value);
    await document.fonts.ready;
    const W = 1800;
    const H = 1200;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    // rice paper with fibres
    g.fillStyle = '#f3ecdf';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(110,90,60,${Math.random() * 0.06})`;
      g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 1);
    }
    const red = '#b5321c';
    g.strokeStyle = red;
    g.lineWidth = 6;
    g.strokeRect(46, 46, W - 92, H - 92);
    g.lineWidth = 2;
    g.strokeRect(62, 62, W - 124, H - 124);
    // the pagoda in ink: thirteen eaves stepping in, the finial, the river below
    const ink = '#1b1712';
    const cx = 330;
    let y = 1010;
    g.fillStyle = 'rgba(27,23,18,0.08)';
    g.fillRect(110, 1012, 500, 6);
    for (let i = 0; i < 13; i++) {
      const w = 230 - i * 10.5;
      const h = 54 - i * 1.6;
      g.fillStyle = ink;
      g.beginPath(); // the eave, its corners lifted
      g.moveTo(cx - w / 2 - 26, y - h + 10);
      g.quadraticCurveTo(cx - w / 2 - 8, y - h + 2, cx - w / 2 + 8, y - h + 4);
      g.lineTo(cx + w / 2 - 8, y - h + 4);
      g.quadraticCurveTo(cx + w / 2 + 8, y - h + 2, cx + w / 2 + 26, y - h + 10);
      g.lineTo(cx + w / 2 + 6, y - h + 16);
      g.lineTo(cx - w / 2 - 6, y - h + 16);
      g.closePath();
      g.fill();
      g.fillStyle = i % 2 ? '#5a2318' : '#7a2c1d';
      g.fillRect(cx - w / 2 + 6, y - h + 16, w - 12, h - 16);
      g.fillStyle = 'rgba(243,236,223,0.55)';
      for (let k = 0; k < 4; k++) g.fillRect(cx - w / 2 + 22 + k * ((w - 50) / 3.2), y - h + 24, 9, 9);
      y -= h;
    }
    g.fillStyle = ink;
    g.beginPath();
    g.moveTo(cx - 60, y + 8);
    g.lineTo(cx, y - 70);
    g.lineTo(cx + 60, y + 8);
    g.fill();
    g.fillRect(cx - 3, y - 150, 6, 90);
    for (let k = 0; k < 5; k++) g.fillRect(cx - 10 + k, y - 140 + k * 14, 20 - 2 * k, 4);
    // a red sun behind it
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = 'rgba(181,50,28,0.75)';
    g.beginPath();
    g.arc(cx + 120, 300, 64, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = 'source-over';

    const X = 640;
    g.fillStyle = ink;
    g.textBaseline = 'alphabetic';
    g.font = '900 120px "Noto Serif SC", serif';
    g.fillText('登塔证书', X, 250);
    g.fillStyle = red;
    g.font = 'italic 40px Spectral, serif';
    g.fillText('Certificate of Ascent · The Pagoda of Six Harmonies', X, 315);
    g.fillStyle = ink;
    g.font = '600 64px "Noto Serif SC", serif';
    g.fillText(name, X, 450);
    g.fillStyle = 'rgba(27,23,18,0.25)';
    g.fillRect(X, 474, 620, 2);
    g.fillStyle = ink;
    g.font = '400 34px "Noto Serif SC", serif';
    g.fillText('登上了六和塔的七层，', X, 548);
    g.fillText('听见了钱塘江一千年的潮声。', X, 598);
    g.fillStyle = '#3e352d';
    g.font = 'italic 30px Spectral, serif';
    g.fillText('has climbed the seven floors of the Liuhe Pagoda', X, 652);
    g.fillText('and heard a thousand years of the Qiantang tide.', X, 692);
    // the seals, three by three; the missing ones only a faint outline
    const S = 96;
    const gx = 1380;
    const gy = 440;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    SEALS.forEach((s, i) => {
      const x = gx + (i % 3) * (S + 22);
      const yy = gy + Math.floor(i / 3) * (S + 22);
      g.save();
      g.translate(x + S / 2, yy + S / 2);
      g.rotate(((i * 37) % 9 - 4) * 0.012);
      if (got.has(s.id)) {
        g.fillStyle = red;
        g.fillRect(-S / 2, -S / 2, S, S);
        g.strokeStyle = 'rgba(251,243,234,0.8)';
        g.lineWidth = 3;
        g.strokeRect(-S / 2 + 7, -S / 2 + 7, S - 14, S - 14);
        g.fillStyle = '#fbf3ea';
        g.font = '900 54px "Noto Serif SC", serif';
        g.fillText(s.ch, 0, 4);
      } else {
        g.strokeStyle = 'rgba(181,50,28,0.3)';
        g.setLineDash([6, 6]);
        g.lineWidth = 2;
        g.strokeRect(-S / 2, -S / 2, S, S);
        g.fillStyle = 'rgba(181,50,28,0.25)';
        g.font = '900 54px "Noto Serif SC", serif';
        g.fillText(s.ch, 0, 4);
      }
      g.restore();
    });
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.fillStyle = ink;
    g.font = '400 30px "Noto Serif SC", serif';
    g.fillText(`印章 ${got.size} / 9`, gx, gy + 3 * (S + 22) + 36);
    if (quiz) g.fillText(`小测 ${quiz.right} / ${quiz.total}`, gx + 190, gy + 3 * (S + 22) + 36);
    const d = new Date();
    g.font = '400 28px "Noto Serif SC", serif';
    g.fillStyle = '#7a6d60';
    g.fillText(`${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · 杭州 月轮山`, X, 1000);
    g.font = 'italic 26px Spectral, serif';
    g.fillText(`${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · Yuelun Hill, Hangzhou`, X, 1040);
    g.font = '400 24px "Noto Serif SC", serif';
    g.fillText('浙江大学《中国文化与国际传播》 · Chinese Culture and International Communication, ZJU', X, 1100);

    const url = c.toDataURL('image/png');
    preview.replaceChildren(
      $('img', { src: url, alt: '登塔证书 Certificate' }),
      $('a', { class: 'btn btn--line', href: url, download: `六和塔登塔证书-${name}.png` }, '保存图片 ', $('i', {}, 'Save as PNG')),
    );
    gsap.from(preview.firstChild, { y: 20, opacity: 0, rotate: -1.5, duration: 0.7, ease: 'power3.out' });
  }

  return {
    button,
    award,
    open,
    has: (id) => got.has(id),
    setQuiz(right, total) {
      quiz = { right, total };
      store.set('quiz', quiz);
    },
    makeCertificate,
    /** an inline “get your certificate” block for the last chapter */
    certificateBlock() {
      return $('div', { class: 'certblock' },
        $('p', {}, '做完小测，打开印章册，写上名字，领一张属于你的登塔证书。', $('br'), $('i', { lang: 'en' }, 'Finished? Open the seal book, write your name and collect your certificate.')),
        $('button', { type: 'button', class: 'btn cta', onclick: () => open() }, '打开印章册 ', $('i', {}, 'Open the seal book')),
      );
    },
  };
}
