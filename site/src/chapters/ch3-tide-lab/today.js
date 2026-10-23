/**
 * "Today's tide": lunar date, moon age and the next spring-tide windows, computed in the
 * browser (lunar-javascript for the Chinese calendar, a mean synodic month for the Moon).
 */
import { Solar, Lunar } from 'lunar-javascript';
import { SYNODIC, phaseKey } from './model.js';

const NEW_MOON_JD = 2451550.1; // 2000-01-06 18:14 UTC, a known new moon
const DAY_MS = 86400000;

/** Spring-tide windows on the Qiantang, by lunar day. */
export const WINDOWS = [
  [1, 3],
  [15, 18],
];

function julianDay(date) {
  return date.getTime() / DAY_MS + 2440587.5;
}

/** Moon age in days (0 = new moon) and the lit fraction, for a JS Date. */
export function moonAge(date = new Date()) {
  const age = (((julianDay(date) - NEW_MOON_JD) % SYNODIC) + SYNODIC) % SYNODIC;
  const lit = (1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2;
  return { age, lit, phase: phaseKey(age) };
}

const inWindow = (d) => WINDOWS.find(([a, b]) => d >= a && d <= b) || null;

function solarOf(date) {
  return Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function toDate(solar) {
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
}

/** Season option of the lab for a Gregorian date. */
export function seasonFor(date) {
  const m = date.getMonth() + 1;
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

/**
 * Everything the "Today's tide" panel shows.
 * @returns {{ date, lunar:{year,month,day,leap,monthZh,dayZh}, moon, window, next, next818 }}
 */
export function todayInfo(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const solar = solarOf(today);
  const lunar = solar.getLunar();
  const month = lunar.getMonth(); // negative for a leap month
  const day = lunar.getDay();
  const info = {
    date: today,
    lunar: {
      year: lunar.getYear(),
      month: Math.abs(month),
      leap: month < 0,
      day,
      monthZh: `${month < 0 ? '闰' : ''}${lunar.getMonthInChinese()}月`,
      dayZh: lunar.getDayInChinese(),
    },
    moon: moonAge(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20)),
    window: null, // current window { from, to, start, end } if today is in one
    next: null, // next window starting after today
    next818: null,
  };

  // walk forward day by day (at most two lunar months)
  let s = solar;
  let cur = inWindow(day);
  if (cur) {
    let end = s;
    while (inWindow(end.next(1).getLunar().getDay()) === cur) end = end.next(1);
    let start = s;
    while (inWindow(start.next(-1).getLunar().getDay()) === cur) start = start.next(-1);
    info.window = { from: cur[0], to: cur[1], start: toDate(start), end: toDate(end) };
    s = end;
  }
  for (let i = 1; i <= 62; i++) {
    const n = s.next(1);
    const w = inWindow(n.getLunar().getDay());
    if (w && inWindow(s.getLunar().getDay()) !== w) {
      let end = n;
      while (inWindow(end.next(1).getLunar().getDay()) === w) end = end.next(1);
      const startDate = toDate(n);
      info.next = {
        from: w[0],
        to: w[1],
        start: startDate,
        end: toDate(end),
        days: Math.round((startDate - today) / DAY_MS),
      };
      break;
    }
    s = n;
  }

  // the next 18th day of the 8th lunar month (today counts)
  let y = lunar.getYear();
  let d818 = toDate(Lunar.fromYmd(y, 8, 18).getSolar());
  if (d818 < today) d818 = toDate(Lunar.fromYmd(++y, 8, 18).getSolar());
  info.next818 = { date: d818, days: Math.round((d818 - today) / DAY_MS), lunarYear: y };
  return info;
}

export function formatDate(date, lang) {
  if (lang === 'zh') return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShort(date, lang) {
  if (lang === 'zh') return `${date.getMonth() + 1}月${date.getDate()}日`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}
