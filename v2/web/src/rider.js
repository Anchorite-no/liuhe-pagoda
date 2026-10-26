/**
 * 弄潮儿 · Ride the bore: a one-button game drawn like an ink painting.
 * You stand on the face of the tidal bore with a red flag, from Ganpu at the mouth of the
 * river to the Liuhe Pagoda. Hold (mouse, touch or space) to climb towards the crest, let go
 * to slide down. Stay high on the crest to score (“向涛头立”), dip down when spray is about to
 * burst so the flag stays dry (“手把红旗旗不湿”), reach up to catch words floating over the
 * crest. Too high and you go over the top; too low and the wall swallows you. At Laoyancang
 * a returning wave comes the other way: be high when it hits.
 *
 * open({ $, passport, onClose }) → close()
 */
import { gsap } from 'gsap';
import * as sound from './sound.js';

const RUN = 80; // seconds from the mouth of the river to the pagoda
const PLACES = [
  [0, '澉浦', 'Ganpu'],
  [0.28, '盐官', 'Yanguan'],
  [0.5, '老盐仓', 'Laoyancang'],
  [0.76, '钱塘江大桥', 'Qiantang Bridge'],
  [0.97, '六和塔', 'Liuhe Pagoda'],
];
const WORDS = [
  ['潮头', 'crest'],
  ['涌潮', 'tidal bore'],
  ['浪花', 'spray'],
  ['红旗', 'red flag'],
  ['勇气', 'courage'],
  ['弄潮儿', 'trailblazer'],
  ['海塘', 'seawall'],
  ['观潮', 'tide-watching'],
  ['鼓声', 'drumbeat'],
  ['潮信', 'the tide keeping time'],
  ['钱塘江', 'the Qiantang'],
  ['一线潮', 'single-line tide'],
];

export function open({ $, passport, onClose }) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = $('canvas', { class: 'game__canvas' });
  const msg = $('div', { class: 'rider__msg', 'aria-live': 'polite' });
  const panel = $('div', { class: 'rider__panel' });
  const ui = $('div', { class: 'game game--rider', role: 'dialog', 'aria-modal': 'true', 'aria-label': '弄潮儿 Ride the bore' },
    canvas,
    $('button', { type: 'button', class: 'game__close', onclick: () => close() }, '← 返回阅读 ', $('i', { lang: 'en' }, 'Back')),
    msg,
    panel,
  );
  document.body.append(ui);
  document.documentElement.classList.add('is-gaming');
  const g = canvas.getContext('2d');

  let W = 1;
  let H = 1;
  let dpr = 1;
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  /* ── state ── */
  let s;
  function reset() {
    s = {
      mode: 'intro', // intro → play → end
      t: 0,
      dist: 0,
      p: 0.55, // where you stand on the face: 0 its foot, 1 the crest
      v: 0,
      hold: false,
      wet: 0,
      lives: 3,
      stun: 0,
      score: 0,
      sprays: [],
      nextSpray: 4,
      words: [],
      nextWord: 6,
      caught: [],
      back: null, // the returning wave
      nextBack: 0,
      drumT: 0,
      foam: [],
      shake: 0,
      tutorial: 0,
    };
  }
  reset();
  const roar = sound.roar(0.55);

  /* ── input ── */
  const down = (e) => {
    if (e.target.closest && e.target.closest('button, a')) return;
    s.hold = true;
    if (s.mode === 'intro') start();
  };
  const up = () => (s.hold = false);
  canvas.addEventListener('pointerdown', down);
  addEventListener('pointerup', up);
  const key = (e) => {
    if (e.code === 'Space' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (e.type === 'keydown') {
        if (!s.hold && s.mode === 'intro') start();
        s.hold = true;
      } else s.hold = false;
    }
    if (e.key === 'Escape' && e.type === 'keydown') close();
  };
  addEventListener('keydown', key);
  addEventListener('keyup', key);

  function showIntro() {
    panel.hidden = false;
    panel.replaceChildren(
      $('p', { class: 'game__eyebrow', lang: 'en' }, 'RIDE THE BORE'),
      $('h2', {}, '弄潮儿'),
      $('p', { class: 'rider__poem' }, '弄潮儿向涛头立，手把红旗旗不湿。', $('br'), $('i', { lang: 'en' }, 'The tide-players stand on the crest, red flags in hand, and the flags stay dry.')),
      $('ul', { class: 'rider__how' },
        $('li', {}, $('b', {}, '按住'), ' 鼠标、屏幕或空格：往潮头上爬 ', $('i', { lang: 'en' }, 'Hold: climb towards the crest')),
        $('li', {}, $('b', {}, '松开'), ' 往下滑 ', $('i', { lang: 'en' }, 'Let go: slide down')),
        $('li', {}, $('b', {}, '站高'), ' 得分；浪花要炸开时', $('b', {}, '压低'), '，护住红旗 ', $('i', { lang: 'en' }, 'Stay high to score; dip when spray is about to burst')),
        $('li', {}, '伸手够漂在潮头上的字 ', $('i', { lang: 'en' }, 'Reach up for the words floating over the crest')),
      ),
      $('button', { type: 'button', class: 'btn', onclick: start }, '开始 ', $('i', {}, 'Start')),
    );
    gsap.from(panel, { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' });
  }
  function start() {
    if (s.mode === 'play') return;
    reset();
    s.mode = 'play';
    panel.hidden = true;
    sound.drum(1);
    say('按住往上爬，松开往下滑。', 'Hold to climb, let go to slide.');
  }
  let msgTimer = 0;
  function say(zh, en, cls = '') {
    msg.className = `rider__msg ${cls}`;
    msg.replaceChildren($('span', {}, zh), $('br'), $('i', { lang: 'en' }, en));
    gsap.fromTo(msg, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 });
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => gsap.to(msg, { opacity: 0, duration: 0.6 }), 2600);
  }

  /* ── the wave: where its face is, how high ── */
  const base = () => H * 0.72;
  const waveH = () => {
    // grows towards Yanguan, wanes past the bridge, breathes as it goes
    const d = s.dist;
    const k = 0.62 + 0.38 * Math.exp(-Math.pow((d - 0.3) / 0.28, 2)) - 0.12 * Math.max(0, d - 0.8) / 0.2;
    return H * 0.3 * k * (1 + 0.06 * Math.sin(s.t * 1.7) + 0.04 * Math.sin(s.t * 3.1));
  };
  const faceX = () => W * 0.58;
  const onFace = (p) => {
    const hh = waveH();
    const x = faceX() + Math.pow(Math.max(0, 1 - p), 1.6) * W * 0.06 - Math.max(0, p - 1) * W * 0.03;
    return [x, base() - hh * p];
  };

  /* ── a step of the game ── */
  function step(dt) {
    s.t += dt;
    if (s.mode !== 'play') return;
    s.dist = Math.min(1, s.dist + dt / RUN);
    const hh = waveH();
    roar.set(0.5 + 0.5 * (hh / (H * 0.3)));
    // drums, faster where the crowds are
    s.drumT -= dt;
    const crowd = s.dist > 0.2 && s.dist < 0.4;
    if (s.drumT <= 0) {
      sound.drum(crowd ? 0.9 : 0.5);
      s.drumT = crowd ? 0.42 : 0.9;
    }
    // you
    if (s.stun > 0) {
      s.stun -= dt;
      if (s.stun <= 0) {
        s.p = 0.5;
        s.v = 0;
      }
    } else {
      s.v += (s.hold ? 1.25 : -1.05) * dt;
      // the lip pushes you back down, the water at the foot lifts you: a little forgiveness at both ends
      if (s.p > 1) s.v -= (s.p - 1) * 7 * dt;
      if (s.p < 0.15) s.v += (0.15 - s.p) * 4 * dt;
      // the wave never sits still under you
      s.v += Math.sin(s.t * 1.3) * Math.sin(s.t * 0.7 + 1) * 0.25 * dt;
      s.v *= Math.pow(0.25, dt);
      s.v = Math.max(-0.75, Math.min(0.75, s.v));
      s.p += s.v * dt;
      if (s.p > 1.2) fall('冲过了潮头，掉进后面的浪里！', 'Over the top and into the churn!');
      else if (s.p < 0.02) fall('潮头压下来了，被吞没！', 'The wall came down on you!');
      // standing on the crest: “向涛头立”
      if (s.p > 0.7 && s.p <= 1.05) s.score += dt * 10 * (hh / (H * 0.25));
    }
    // spray: bubbles first, then it bursts above the crest
    s.nextSpray -= dt;
    if (s.nextSpray <= 0) {
      s.sprays.push({ t: 0, warn: 0.95, dur: 0.7, x: (Math.random() - 0.5) * 60 });
      s.nextSpray = 2.4 + Math.random() * (crowd ? 1.8 : 3);
      if (s.tutorial < 1) {
        s.tutorial++;
        say('白沫在冒泡：浪花要炸了，松开压低！', 'Foam bubbling: spray is coming, let go and dip!');
      }
    }
    for (const sp of s.sprays) {
      sp.t += dt;
      if (sp.t > sp.warn && sp.t < sp.warn + sp.dur) {
        if (!sp.burst) {
          sp.burst = true;
          sound.whoosh(0.8);
          s.shake = 6;
          for (let k = 0; k < 70; k++) s.foam.push({ x: faceX() + sp.x + (Math.random() - 0.5) * 120, y: base() - hh, vx: (Math.random() - 0.6) * 160, vy: -200 - Math.random() * 420, life: 1 });
        }
        // the flag is high above you: wet if you are near the crest
        if (s.stun <= 0 && s.p > 0.62) s.wet = Math.min(1, s.wet + dt * 0.9);
      }
    }
    s.sprays = s.sprays.filter((sp) => sp.t < sp.warn + sp.dur);
    s.wet = Math.max(0, s.wet - dt * 0.04);
    if (s.wet >= 1) return end(false);
    // words drift over the crest; reach up to catch them
    s.nextWord -= dt;
    if (s.nextWord <= 0) {
      const w = WORDS[s.caught.length % WORDS.length];
      s.words.push({ w, t: 0, life: 3.2 });
      s.nextWord = 5 + Math.random() * 3;
    }
    for (const w of s.words) {
      w.t += dt;
      if (!w.got && s.stun <= 0 && s.p > 0.93 && w.t > 0.4) {
        w.got = true;
        s.caught.push(w.w);
        s.score += 50;
        sound.bell(6 + (s.caught.length % 4), 0, 0.6);
        say(`${w.w[0]} · ${w.w[1]}`, `+50 · caught ${s.caught.length}`, 'is-word');
      }
    }
    s.words = s.words.filter((w) => w.t < w.life && !w.got);
    // the returning tide at Laoyancang: be high when it hits
    if (s.dist > 0.46 && s.dist < 0.64) {
      s.nextBack -= dt;
      if (!s.back && s.nextBack <= 0) {
        s.back = { t: 0, hit: 1.6 };
        say('回头潮从前面撞过来了！爬高！', 'A returning wave is coming the other way: climb!', 'is-warn');
      }
    }
    if (s.back) {
      s.back.t += dt;
      if (s.back.t >= s.back.hit && !s.back.done) {
        s.back.done = true;
        s.shake = 14;
        sound.drum(1);
        if (s.p < 0.72 && s.stun <= 0) fall('回头潮把你掀翻了！', 'The returning wave knocked you over!');
        else {
          s.score += 80;
          say('骑过了回头潮！+80', 'Over the returning wave! +80');
        }
      }
      if (s.back.t > s.back.hit + 1) {
        s.back = null;
        s.nextBack = 4 + Math.random() * 3;
      }
    }
    for (const f of s.foam) {
      f.vy += 900 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.life -= dt * 0.9;
    }
    s.foam = s.foam.filter((f) => f.life > 0);
    s.shake *= Math.pow(0.02, dt);
    if (s.dist >= 1) end(true);
  }
  function fall(zh, en) {
    s.lives--;
    s.stun = 1.3;
    s.shake = 12;
    sound.nope();
    if (s.lives <= 0) return end(false, zh, en);
    say(zh, `${en} ${s.lives} left.`, 'is-warn');
  }
  function end(won, zh, en) {
    s.mode = 'end';
    roar.set(0.2);
    panel.hidden = false;
    const score = Math.round(s.score + (won ? 300 : 0) + (1 - s.wet) * 200);
    const words = s.caught.length
      ? $('p', { class: 'rider__words' }, '接住的词 Words caught: ', s.caught.map(([z, e]) => $('span', {}, $('b', {}, z), ' ', $('i', { lang: 'en' }, e))))
      : null;
    if (won) {
      sound.windChimes(9, 2);
      passport && passport.award('rider');
    }
    panel.replaceChildren(
      $('p', { class: 'game__eyebrow', lang: 'en' }, won ? 'YOU MADE IT' : 'WASHED OUT'),
      $('h2', {}, won ? '到六和塔下了！' : s.wet >= 1 ? '红旗湿了' : '被潮水打下来了'),
      won
        ? $('p', { class: 'rider__poem' }, '弄潮儿向涛头立，手把红旗旗不湿。', $('br'), $('i', { lang: 'en' }, `You rode from Ganpu to the pagoda; the flag is ${Math.round((1 - s.wet) * 100)}% dry.`))
        : $('p', {}, zh || '浪花打湿了红旗。站高得分，浪花来时压低。', $('br'), $('i', { lang: 'en' }, en || 'The spray soaked the flag. Stay high to score, dip when the spray comes.')),
      $('p', { class: 'rider__score' }, $('b', {}, String(score)), ' 分 points · ', `${Math.round(s.dist * 100)}%`),
      words,
      won ? $('p', { class: 'hint' }, '今天，“弄潮儿”指敢于站在时代潮头的人。', $('br'), $('i', { lang: 'en' }, 'Today a tide-player is anyone who dares to ride the wave of their time.')) : null,
      $('div', { class: 'game__actions' }, $('button', { type: 'button', class: 'btn', onclick: start }, '再来一次 ', $('i', {}, 'Again')), $('button', { type: 'button', class: 'btn btn--line', onclick: () => close() }, '返回阅读 ', $('i', {}, 'Back'))),
    );
    gsap.from(panel, { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' });
  }

  /* ── drawing: rice paper, ink, one red flag ── */
  const INK = '#1b1712';
  const PAPER = '#efe7d8';
  const hill = (x0, amp, freq, seed) => (x) => amp * (0.5 + 0.3 * Math.sin((x + x0) * freq + seed) + 0.2 * Math.sin((x + x0) * freq * 2.7 + seed * 2));
  const far = hill(0, 1, 0.006, 1.3);
  const mid = hill(0, 1, 0.011, 4.1);
  function draw() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sh = s.shake > 0.3 ? (Math.random() - 0.5) * s.shake : 0;
    g.translate(sh, sh * 0.5);
    const scroll = s.t * 60 + s.dist * 4000;
    // sky and paper
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#f6f0e4');
    sky.addColorStop(0.7, PAPER);
    sky.addColorStop(1, '#e2d8c5');
    g.fillStyle = sky;
    g.fillRect(-20, -20, W + 40, H + 40);
    // a red sun, low over the estuary
    g.fillStyle = 'rgba(181,50,28,0.55)';
    g.beginPath();
    g.arc(W * 0.8, H * 0.2, Math.min(W, H) * 0.05, 0, Math.PI * 2);
    g.fill();
    // far and middle hills, washed in ink
    const horizon = base() - H * 0.02;
    for (const [fn, a, sp, amp] of [[far, 0.1, 0.08, H * 0.16], [mid, 0.17, 0.2, H * 0.1]]) {
      g.fillStyle = `rgba(27,23,18,${a})`;
      g.beginPath();
      g.moveTo(0, horizon);
      for (let x = 0; x <= W; x += 8) g.lineTo(x, horizon - fn(x + scroll * sp) * amp);
      g.lineTo(W, horizon);
      g.fill();
    }
    // landmarks ride past on the far bank
    drawLandmarks(horizon, scroll);
    // calm water ahead of the bore (right), lines drifting towards it
    g.fillStyle = '#ddd3c0';
    g.fillRect(0, base(), W, H - base());
    g.strokeStyle = 'rgba(27,23,18,0.18)';
    g.lineWidth = 1;
    for (let k = 0; k < 14; k++) {
      const y = base() + 8 + k * k * 1.6;
      const off = (scroll * (0.6 + k * 0.08)) % 90;
      g.beginPath();
      for (let x = faceX() + 20 - off; x < W; x += 90) {
        g.moveTo(x, y);
        g.lineTo(x + 30 + k * 2, y);
      }
      g.stroke();
    }
    drawWave(scroll);
    drawRider();
    // foam thrown up by bursts
    for (const f of s.foam) {
      g.fillStyle = `rgba(255,255,255,${Math.min(1, f.life * 1.4)})`;
      g.strokeStyle = `rgba(27,23,18,${f.life * 0.5})`;
      g.beginPath();
      g.arc(f.x, f.y, 2 + 3 * f.life, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    // floating words
    for (const w of s.words) {
      const [x, y] = onFace(1);
      const a = Math.min(1, w.t * 3) * Math.min(1, (w.life - w.t) * 2);
      g.globalAlpha = a;
      g.fillStyle = '#a7803a';
      g.font = `900 ${Math.round(H * 0.045)}px "Noto Serif SC", serif`;
      g.textAlign = 'center';
      g.fillText(w.w[0], x - 8, y - H * 0.11 - Math.sin(w.t * 3) * 6);
      g.font = `italic ${Math.round(H * 0.022)}px Spectral, serif`;
      g.fillText(w.w[1], x - 8, y - H * 0.11 + H * 0.03 - Math.sin(w.t * 3) * 6);
      g.globalAlpha = 1;
    }
    drawHud();
  }
  function drawLandmarks(horizon, scroll) {
    // the place you are passing slides by on the far bank; crowds and flags at Yanguan
    for (const [d, zh, en] of PLACES) {
      const x = W * 0.5 + (d - s.dist) * RUN * 60 * 1.1;
      if (x < -300 || x > W + 300) continue;
      g.fillStyle = 'rgba(27,23,18,0.55)';
      if (zh === '六和塔') drawPagoda(x, horizon - H * 0.02, H * 0.26);
      else if (zh === '钱塘江大桥') {
        g.fillStyle = 'rgba(27,23,18,0.35)';
        for (let k = 0; k < 9; k++) g.fillRect(x - 200 + k * 50, horizon - H * 0.05, 6, H * 0.05);
        g.fillRect(x - 210, horizon - H * 0.065, 420, 5);
        for (let k = 0; k < 8; k++) {
          g.beginPath();
          g.moveTo(x - 200 + k * 50, horizon - H * 0.065);
          g.lineTo(x - 175 + k * 50, horizon - H * 0.1);
          g.lineTo(x - 150 + k * 50, horizon - H * 0.065);
          g.strokeStyle = 'rgba(27,23,18,0.35)';
          g.stroke();
        }
      } else {
        // a seawall with people along it
        g.fillRect(x - 160, horizon - 6, 320, 6);
        const crowd = zh === '盐官' ? 46 : 12;
        for (let k = 0; k < crowd; k++) {
          const px = x - 150 + ((k * 97) % 300);
          const bob = Math.sin(s.t * 6 + k) * (zh === '盐官' ? 1.5 : 0.5);
          g.fillRect(px, horizon - 16 + bob, 3, 10);
          g.beginPath();
          g.arc(px + 1.5, horizon - 19 + bob, 2.2, 0, Math.PI * 2);
          g.fill();
          if (k % 9 === 0) {
            g.fillStyle = '#b5321c';
            g.fillRect(px + 2, horizon - 30 + bob, 8, 5);
            g.fillStyle = 'rgba(27,23,18,0.55)';
          }
        }
      }
      g.fillStyle = 'rgba(27,23,18,0.6)';
      g.font = `600 ${Math.round(H * 0.024)}px "Noto Serif SC", serif`;
      g.textAlign = 'center';
      g.fillText(zh, x, horizon - H * (zh === '六和塔' ? 0.3 : 0.12));
      g.font = `italic ${Math.round(H * 0.018)}px Spectral, serif`;
      g.fillText(en, x, horizon - H * (zh === '六和塔' ? 0.3 : 0.12) + H * 0.026);
    }
  }
  function drawPagoda(x, y, h) {
    g.fillStyle = 'rgba(27,23,18,0.25)';
    g.beginPath();
    g.ellipse(x, y + 4, h * 0.9, h * 0.25, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = 'rgba(27,23,18,0.75)';
    let yy = y - h * 0.18;
    for (let i = 0; i < 13; i++) {
      const w = h * (0.32 - i * 0.015);
      const th = h * (0.055 - i * 0.0015);
      g.beginPath();
      g.moveTo(x - w / 2 - th * 0.8, yy - th * 0.2);
      g.lineTo(x + w / 2 + th * 0.8, yy - th * 0.2);
      g.lineTo(x + w / 2, yy + th * 0.15);
      g.lineTo(x - w / 2, yy + th * 0.15);
      g.fill();
      g.fillRect(x - w / 2 + 2, yy - th, w - 4, th * 0.8);
      yy -= th;
    }
    g.fillRect(x - 1, yy - h * 0.08, 2, h * 0.08);
  }
  function drawWave(scroll) {
    const hh = waveH();
    const fx = faceX();
    const b = base();
    // the raised, churned river behind the bore (left)
    g.fillStyle = '#cfc4ae';
    g.beginPath();
    g.moveTo(-20, b - hh * 0.78);
    for (let x = -20; x <= fx; x += 12) g.lineTo(x, b - hh * (0.72 + 0.06 * Math.sin((x + scroll * 1.5) * 0.03)) );
    g.lineTo(fx, H);
    g.lineTo(-20, H);
    g.fill();
    // white foam torn across the churn
    g.fillStyle = 'rgba(255,255,255,0.7)';
    for (let k = 0; k < 40; k++) {
      const x = ((k * 137 + scroll * 1.6) % (fx + 40)) - 20;
      const y = b - hh * 0.7 + ((k * 53) % Math.max(1, hh * 0.9));
      g.beginPath();
      g.ellipse(x, y, 10 + (k % 5) * 4, 3, 0, 0, Math.PI * 2);
      g.fill();
    }
    // the bore: the churned river behind rises in a long back slope to the crest, then the
    // face drops away in front, a dark wall streaked as it rises
    const [cx0, cy0] = onFace(1);
    const backX = fx - W * 0.26;
    const backY = b - hh * 0.74;
    const grad = g.createLinearGradient(fx - W * 0.2, 0, fx + W * 0.05, 0);
    grad.addColorStop(0, '#cfc4ae');
    grad.addColorStop(0.45, '#6d6556');
    grad.addColorStop(0.8, '#2f2a23');
    grad.addColorStop(1, '#3d372e');
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(backX, backY);
    g.bezierCurveTo(backX + W * 0.12, backY - hh * 0.05, cx0 - W * 0.08, cy0 - hh * 0.02, cx0, cy0);
    for (let p = 1; p >= 0; p -= 0.05) {
      const [x, y] = onFace(p);
      g.lineTo(x, y);
    }
    g.lineTo(fx + W * 0.07, b + 2);
    g.lineTo(backX, b + 2);
    g.closePath();
    g.fill();
    // the face, darker near the lip
    const shade = g.createLinearGradient(0, b - hh, 0, b);
    shade.addColorStop(0, 'rgba(20,17,13,0.55)');
    shade.addColorStop(1, 'rgba(20,17,13,0)');
    g.fillStyle = shade;
    g.beginPath();
    g.moveTo(cx0 - W * 0.03, cy0);
    for (let p = 1; p >= 0; p -= 0.05) {
      const [x, y] = onFace(p);
      g.lineTo(x, y);
    }
    g.lineTo(fx - W * 0.05, b);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(239,231,216,0.18)';
    for (let k = 0; k < 10; k++) {
      const p0 = ((k * 0.13 + s.t * 0.4) % 1) * 0.9;
      const [x1, y1] = onFace(p0);
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x1 - 30, y1 + 6);
      g.stroke();
    }
    // the lip: a roll of foam along the crest, bubbling where spray is about to burst
    const [cx, cy] = onFace(1);
    for (let k = 0; k < 26; k++) {
      const u = k / 25; // along the crest, from the back slope to the lip
      const x = cx - W * 0.12 * (1 - u) + W * 0.012 * u + Math.sin(s.t * 4 + k) * 2;
      const y = cy + hh * 0.06 * Math.pow(1 - u, 2) - 2 + Math.sin(s.t * 5 + k * 1.7) * 3;
      g.fillStyle = '#fbf8f1';
      g.strokeStyle = INK;
      g.lineWidth = 1.2;
      g.beginPath();
      g.arc(x, y, 6 + (k % 4) * 2, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    for (const sp of s.sprays) {
      if (sp.t < sp.warn) {
        // bubbles: a warning
        const k = sp.t / sp.warn;
        for (let j = 0; j < 10; j++) {
          g.fillStyle = 'rgba(255,255,255,0.95)';
          g.strokeStyle = INK;
          g.beginPath();
          g.arc(cx + sp.x + (Math.random() - 0.5) * 60, cy - 10 - Math.random() * 18 * k, 2 + Math.random() * 4 * k, 0, Math.PI * 2);
          g.fill();
          g.stroke();
        }
      }
    }
    // the returning wave comes from the right
    if (s.back) {
      const k = Math.min(1, s.back.t / s.back.hit);
      const x = W + 60 - (W + 60 - fx) * k;
      const h2 = hh * 0.55;
      g.fillStyle = '#5a5244';
      g.beginPath();
      g.moveTo(x + 80, b);
      g.quadraticCurveTo(x + 20, b - h2, x, b - h2 * 0.9);
      g.quadraticCurveTo(x - 10, b - h2 * 0.5, x - 20, b);
      g.fill();
      g.fillStyle = '#fbf8f1';
      for (let j = 0; j < 8; j++) {
        g.beginPath();
        g.arc(x + j * 6, b - h2 * 0.9 + j * 3, 5, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  function drawRider() {
    let p = s.p;
    let alpha = 1;
    if (s.stun > 0) {
      alpha = 0.35 + 0.35 * Math.sin(s.t * 20);
      p = 0.35;
    }
    const [x, y] = onFace(p);
    g.globalAlpha = alpha;
    g.save();
    g.translate(x, y);
    // lean into the climb
    g.rotate(-0.25 - s.v * 0.2);
    const k = H / 900;
    g.fillStyle = INK;
    g.strokeStyle = INK;
    g.lineWidth = 4 * k;
    g.lineCap = 'round';
    // legs, body, head
    g.beginPath();
    g.moveTo(-8 * k, 0);
    g.lineTo(0, -22 * k);
    g.lineTo(9 * k, 0);
    g.moveTo(0, -22 * k);
    g.lineTo(0, -48 * k);
    g.stroke();
    g.beginPath();
    g.arc(0, -56 * k, 7 * k, 0, Math.PI * 2);
    g.fill();
    // the arm and the pole
    g.beginPath();
    g.moveTo(0, -42 * k);
    g.lineTo(12 * k, -58 * k);
    g.stroke();
    g.lineWidth = 2.5 * k;
    g.beginPath();
    g.moveTo(12 * k, -40 * k);
    g.lineTo(12 * k, -128 * k);
    g.stroke();
    // the red flag, rippling; heavier and darker as it soaks
    const wet = s.wet;
    g.fillStyle = `rgb(${181 - wet * 90},${50 - wet * 20},${28 - wet * 8})`;
    g.beginPath();
    const fw = 64 * k;
    const fh = 34 * k * (1 + wet * 0.3);
    g.moveTo(12 * k, -128 * k);
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      g.lineTo(12 * k - u * fw, -128 * k + Math.sin(s.t * 9 - u * 5) * 5 * k * u * (1 - wet * 0.7) + wet * u * 18 * k);
    }
    for (let i = 10; i >= 0; i--) {
      const u = i / 10;
      g.lineTo(12 * k - u * fw, -128 * k + fh + Math.sin(s.t * 9 - u * 5 + 0.6) * 5 * k * u * (1 - wet * 0.7) + wet * u * 24 * k);
    }
    g.fill();
    g.restore();
    g.globalAlpha = 1;
  }
  function drawHud() {
    // the river from Ganpu to the pagoda, and where you are on it
    const x0 = W * 0.2;
    const x1 = W * 0.8;
    const y = 34;
    g.strokeStyle = 'rgba(27,23,18,0.35)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x0, y);
    g.lineTo(x1, y);
    g.stroke();
    g.strokeStyle = '#b5321c';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x0, y);
    g.lineTo(x0 + (x1 - x0) * s.dist, y);
    g.stroke();
    g.font = `500 12px "Noto Serif SC", serif`;
    g.textAlign = 'center';
    for (const [d, zh] of PLACES) {
      const x = x0 + (x1 - x0) * d;
      g.fillStyle = d <= s.dist ? '#b5321c' : 'rgba(27,23,18,0.5)';
      g.fillRect(x - 1, y - 5, 2, 10);
      g.fillText(zh, x, y + 22);
    }
    g.fillStyle = INK;
    g.beginPath();
    g.arc(x0 + (x1 - x0) * s.dist, y, 6, 0, Math.PI * 2);
    g.fill();
    // score, flags left, how dry the flag is
    g.textAlign = 'left';
    g.font = `600 ${Math.round(Math.max(16, H * 0.03))}px Spectral, serif`;
    g.fillText(`${Math.round(s.score)}`, 24, H - 28);
    g.font = '13px "Noto Serif SC", serif';
    g.fillText('分 points', 24, H - 10);
    g.textAlign = 'right';
    g.fillText('红旗 Flag', W - 24, H - 46);
    g.fillStyle = 'rgba(27,23,18,0.15)';
    g.fillRect(W - 184, H - 34, 160, 10);
    g.fillStyle = s.wet > 0.7 ? '#5a2318' : '#b5321c';
    g.fillRect(W - 184, H - 34, 160 * (1 - s.wet), 10);
    g.fillStyle = INK;
    g.fillText(s.wet > 0.7 ? '快湿透了！' : '干燥 dry', W - 24, H - 10);
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i < s.lives ? '#b5321c' : 'rgba(27,23,18,0.15)';
      g.fillRect(W - 184 + i * 22, H - 64, 14, 9);
      g.fillRect(W - 184 + i * 22, H - 64, 2, 20);
    }
    // the safe band on the face, shown at the start
    if (s.mode === 'play' && s.t < 10) {
      const [ax, ay] = onFace(0.7);
      const [bx, by] = onFace(1.02);
      g.strokeStyle = 'rgba(181,50,28,0.6)';
      g.setLineDash([4, 4]);
      g.beginPath();
      g.moveTo(ax + 30, ay);
      g.lineTo(bx + 30, by);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = '#b5321c';
      g.textAlign = 'left';
      g.fillText('站在这里得分 score here', ax + 40, (ay + by) / 2);
    }
  }

  /* ── loop ── */
  let raf = 0;
  let last = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    step(reduce ? dt * 0.8 : dt);
    draw();
  }
  raf = requestAnimationFrame(loop);
  showIntro();
  if (import.meta.env.DEV)
    window.__rider = {
      start,
      // run the game for `secs` seconds holding (or not) and draw once (for testing in a background tab)
      run(secs, hold = false) {
        s.hold = hold;
        for (let k = 0; k < secs * 60; k++) step(1 / 60);
        draw();
        return { p: s.p, wet: s.wet, lives: s.lives, dist: s.dist, score: Math.round(s.score), mode: s.mode };
      },
      get s() {
        return s;
      },
    };

  function close() {
    cancelAnimationFrame(raf);
    ro.disconnect();
    roar.stop();
    removeEventListener('pointerup', up);
    removeEventListener('keydown', key);
    removeEventListener('keyup', key);
    ui.remove();
    document.documentElement.classList.remove('is-gaming');
    onClose && onClose();
  }
  return close;
}
