/**
 * The chapters, in reading order. main.js builds one <section> per entry and
 * lazy-loads the chapter module when the reader gets close to it.
 *
 * `plaque` is the short Chinese name on the vertical board; `title` is the full
 * title in each language; `theme` sets the section's light/dark surface.
 */
export const CHAPTERS = [
  {
    id: 'ch0',
    folder: 'ch0-prologue',
    plaque: '潮来',
    title: { en: 'The Eighteenth Night', zh: '八月十八' },
    theme: 'dark',
    load: () => import('./ch0-prologue/index.js'),
  },
  {
    id: 'ch1',
    folder: 'ch1-river',
    plaque: '之江',
    title: { en: 'The River That Named Us', zh: '一条江，一个名字' },
    theme: 'light',
    load: () => import('./ch1-river/index.js'),
  },
  {
    id: 'ch2',
    folder: 'ch2-why',
    plaque: '镇潮',
    title: { en: 'Why a Pagoda Here?', zh: '为什么在这里建塔' },
    theme: 'dark',
    load: () => import('./ch2-why/index.js'),
  },
  {
    id: 'ch3',
    folder: 'ch3-tide-lab',
    plaque: '造潮',
    title: { en: 'Make a Tide', zh: '造一次潮' },
    theme: 'dark',
    load: () => import('./ch3-tide-lab/index.js'),
  },
  {
    id: 'ch4',
    folder: 'ch4-structure',
    plaque: '明七暗六',
    title: { en: 'Thirteen Outside, Seven Inside', zh: '外十三，内七' },
    theme: 'light',
    load: () => import('./ch4-structure/index.js'),
  },
  {
    id: 'ch5',
    folder: 'ch5-listening',
    plaque: '听潮',
    title: { en: 'Listening to the Tide', zh: '听潮' },
    theme: 'light',
    load: () => import('./ch5-listening/index.js'),
  },
  {
    id: 'ch6',
    folder: 'ch6-world',
    plaque: '银龙',
    title: { en: 'The Silver Dragon Meets the World', zh: '银龙与世界' },
    theme: 'dark',
    load: () => import('./ch6-world/index.js'),
  },
  {
    id: 'ch7',
    folder: 'ch7-guide',
    plaque: '讲解员',
    title: { en: 'Be the Guide', zh: '我是讲解员' },
    theme: 'light',
    load: () => import('./ch7-guide/index.js'),
  },
];

export function chapterById(id) {
  return CHAPTERS.find((c) => c.id === id);
}
