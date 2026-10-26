/**
 * Full-screen pages between the chapters, opaque, over the stage:
 *  - gallery: the page pins and a row of real photographs slides sideways as you scroll, the
 *    photos at different depths (some drift faster than others), a huge word behind them
 *  - essay: one photograph fills the screen and slowly pushes in; a passage of old prose
 *    rises over it line by line, a single great character behind
 * buildInterlude($, data, { cover }) → { el, init() }: init() sets up the scroll animations
 * once the fonts are in; cover(id, on) tells the page the stage behind is hidden (so it can rest).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { figure, PHOTOS } from './photos.js';

export function buildInterlude($, d, { cover }) {
  return d.kind === 'essay' ? essay($, d, cover) : gallery($, d, cover);
}

function gallery($, d, cover) {
  const figs = d.photos.map((id, i) => {
    const note = d.notes && d.notes[id];
    const f = figure($, id, { cls: `photo--strip ${PHOTOS[id] && PHOTOS[id].h > PHOTOS[id].w ? 'is-tall' : ''}`, group: d.photos });
    if (!f) return null;
    if (note) f.prepend($('p', { class: 'strip__note' }, $('b', {}, note[0]), $('span', {}, note[1]), $('i', { lang: 'en' }, note[2])));
    f.dataset.depth = String([0.0, 0.12, -0.08, 0.06, -0.14][i % 5]);
    return f;
  });
  const track = $('div', { class: 'strip__track' },
    $('header', { class: 'strip__head' },
      $('p', { class: 'eyebrow', lang: 'en' }, d.eyebrow),
      $('h2', {}, d.title.zh),
      $('p', { class: 'strip__en', lang: 'en' }, d.title.en),
      $('p', { class: 'zh' }, d.text.zh),
      $('p', { class: 'en', lang: 'en' }, d.text.en),
      $('p', { class: 'strip__cue', 'aria-hidden': 'true' }, '继续向下滚动，照片向左展开 → ', $('i', { lang: 'en' }, 'keep scrolling')),
    ),
    figs,
  );
  const word = $('div', { class: 'strip__word', 'aria-hidden': 'true' }, d.bigword);
  const el = $('section', { class: `interlude strip${d.dark ? ' is-dark' : ''}`, id: d.id, 'aria-label': `${d.title.zh} ${d.title.en}` }, word, track);
  return {
    el,
    init() {
      // the row slides in sideways, where lazy loading looks too late: fetch it all as the page nears
      ScrollTrigger.create({ trigger: el, start: 'top bottom+=1200', once: true, onEnter: () => el.querySelectorAll('img').forEach((i) => (i.loading = 'eager')) });
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        const dist = () => Math.max(0, track.scrollWidth - innerWidth + 80);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: () => `+=${dist()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onToggle: (self) => cover(d.id, self.isActive),
          },
        });
        tl.to(track, { x: () => -dist(), ease: 'none' }, 0);
        tl.to(word, { xPercent: -30, ease: 'none' }, 0);
        // depth: each photograph drifts at its own pace, so the row has layers
        for (const f of figs) if (f) tl.to(f, { x: () => Number(f.dataset.depth) * innerWidth * 0.22, ease: 'none' }, 0);
        return () => cover(d.id, false);
      });
      mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => {
        ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom bottom', onToggle: (self) => cover(d.id, self.isActive) });
      });
      gsap.from(track.querySelector('.strip__head').children, { y: 30, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 70%' } });
    },
  };
}

function essay($, d, cover) {
  const p = PHOTOS[d.photo];
  const img = $('img', { src: p.src, alt: p.zh, loading: 'lazy', decoding: 'async' });
  const zh = $('p', { class: 'essay__zh' }, d.quote.zh);
  const en = $('p', { class: 'essay__en', lang: 'en' }, d.quote.en);
  const el = $('section', { class: 'interlude essay', id: d.id },
    $('div', { class: 'essay__bg' }, img),
    $('div', { class: 'essay__char', 'aria-hidden': 'true' }, d.char),
    $('blockquote', { class: 'essay__quote' },
      zh,
      en,
      $('footer', {}, $('span', {}, d.quote.by.zh), ' · ', $('i', { lang: 'en' }, d.quote.by.en)),
    ),
    $('a', { class: 'essay__credit', href: p.page, target: '_blank', rel: 'noopener', lang: 'en' }, `${p.en} · ${p.author} · ${p.license}`),
  );
  return {
    el,
    init() {
      ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom bottom', onToggle: (self) => cover(d.id, self.isActive) });
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.fromTo(img, { scale: 1.25, yPercent: -6 }, { scale: 1, yPercent: 6, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo(el.querySelector('.essay__char'), { yPercent: 30 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      const chars = SplitText.create(zh, { type: 'chars' }).chars;
      const lines = SplitText.create(en, { type: 'lines', mask: 'lines' }).lines;
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 45%' } });
      tl.from(chars, { opacity: 0, y: 14, filter: 'blur(6px)', duration: 0.6, stagger: 0.025, ease: 'power2.out' })
        .from(lines, { yPercent: 100, duration: 0.8, stagger: 0.07, ease: 'power3.out' }, '-=0.8')
        .from(el.querySelector('.essay__quote footer'), { opacity: 0, y: 10, duration: 0.6 }, '-=0.3');
    },
  };
}
