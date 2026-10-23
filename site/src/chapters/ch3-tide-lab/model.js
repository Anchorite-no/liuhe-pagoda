/**
 * The tide lab's teaching model. Deliberately simple: every step is one idea a
 * student can say in a sentence, and the constants are tuned so the "real" settings
 * land on published figures (see NOTES.md):
 *
 *   tidal range at the bay mouth  R0 = 4.0 m × moon × season
 *   tidal range at the bay head   R  = R0 × funnel gain × wind
 *   depth over the sandbar        h  = 12 m − sandbar height   (at low water, ≥ 0.8 m)
 *   steepness                     ε  = R / h
 *   bore height                   H  = R × 0.42 × (1 − e^(−(ε − 1) / 1.8))   (0 if ε ≤ 1)
 *   bore speed                    c  = √(g·h₂·(h + h₂) / 2h) − river current,  h₂ = h + H
 *
 * Teaching model, not a forecast.
 */

export const SYNODIC = 29.530588853;
export const TIDE_LAG_DAYS = 2; // big tides come a couple of days after new / full moon
export const RIVER_WIDTH_KM = 2.5; // the river at Yanguan, where the funnel ends
export const REAL = { day: 18, season: 'autumn', mouth: 100, bar: 10, wind: 0 };

export const SEASONS = {
  spring: { factor: 1.0, river: 0.5 },
  summer: { factor: 0.85, river: 1.2 },
  autumn: { factor: 1.1, river: 0.4 },
  winter: { factor: 0.92, river: 0.4 },
};

/** Angle Sun–Earth–Moon in radians for a lunar day (day 1 = new moon). 0 = new, π = full. */
export function moonAngle(day) {
  return (2 * Math.PI * (day - 1)) / SYNODIC;
}

/** 0..1: how well the Sun's and Moon's pulls line up (1 = spring tide, 0 = neap tide), with the tidal lag. */
export function alignment(day) {
  const th = moonAngle(day - TIDE_LAG_DAYS);
  return (1 + Math.cos(2 * th)) / 2;
}

/** Astronomical tide factor: 1 at spring tide, 0.48 at neap tide. */
export function moonFactor(day) {
  const k = 0.35; // solar / lunar tide ratio (roughly S2 / M2)
  const th = moonAngle(day - TIDE_LAG_DAYS);
  return (1 + k * Math.cos(2 * th)) / (1 + k);
}

/** How much the funnel multiplies the tidal range between the mouth and the head of the bay. */
export function funnelGain(mouthKm) {
  const w = Math.max(RIVER_WIDTH_KM, mouthKm);
  return 1 + (0.9 * Math.log(w / RIVER_WIDTH_KM)) / Math.log(40);
}

export function windFactor(ms) {
  return 1 + 0.02 * ms;
}

/**
 * @param {{day:number, season:string, mouth:number, bar:number, wind:number}} p
 */
export function compute(p) {
  const season = SEASONS[p.season] || SEASONS.autumn;
  const moon = moonFactor(p.day);
  const range0 = 4.0 * moon * season.factor;
  const gain = funnelGain(p.mouth);
  const wf = windFactor(p.wind);
  const range = range0 * gain * wf;
  const depth = Math.max(0.8, 12 - p.bar);
  const steep = range / depth;
  const frac = steep > 1 ? 0.42 * (1 - Math.exp(-(steep - 1) / 1.8)) : 0;
  const height = range * frac;
  let speed = 0;
  if (height >= 0.15) {
    const h1 = depth;
    const h2 = depth + height;
    speed = Math.sqrt((9.81 * h2 * (h1 + h2)) / (2 * h1)) - season.river;
  }
  let kind = 'none';
  if (height >= 3) kind = 'exceptional';
  else if (height >= 1.5) kind = 'strong';
  else if (height >= 0.6) kind = 'small';
  else if (height >= 0.15) kind = 'ripple';
  return {
    moon,
    align: alignment(p.day),
    seasonFactor: season.factor,
    river: season.river,
    range0,
    gain,
    wind: wf,
    range,
    depth,
    steep,
    height,
    speed,
    kind,
  };
}

/** Phase name key for a moon age in days. */
export function phaseKey(age) {
  const f = (((age % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC;
  if (f < 0.034 || f >= 0.966) return 'new';
  if (f < 0.216) return 'waxingCrescent';
  if (f < 0.284) return 'firstQuarter';
  if (f < 0.466) return 'waxingGibbous';
  if (f < 0.534) return 'full';
  if (f < 0.716) return 'waningGibbous';
  if (f < 0.784) return 'lastQuarter';
  return 'waningCrescent';
}

export const PHASE_NAMES = {
  new: { en: 'new moon', zh: '新月（朔）' },
  waxingCrescent: { en: 'waxing crescent', zh: '蛾眉月' },
  firstQuarter: { en: 'first quarter', zh: '上弦月' },
  waxingGibbous: { en: 'waxing gibbous', zh: '盈凸月' },
  full: { en: 'full moon', zh: '满月（望）' },
  waningGibbous: { en: 'waning gibbous', zh: '亏凸月' },
  lastQuarter: { en: 'last quarter', zh: '下弦月' },
  waningCrescent: { en: 'waning crescent', zh: '残月' },
};

export const KIND_NAMES = {
  none: { en: 'No bore: the tide just rises', zh: '没有涌潮：潮水只是慢慢涨起来' },
  ripple: { en: 'A ripple bore: a train of small waves', zh: '波状潮：一串小波浪' },
  small: { en: 'A small breaking bore', zh: '小规模的破碎潮头' },
  strong: { en: 'A strong breaking bore', zh: '强劲的破碎潮头' },
  exceptional: { en: 'An exceptional bore', zh: '罕见的大潮头' },
};

const fmt = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toFixed(d);

/**
 * One sentence explaining what changed and why. `what` is the control that changed last,
 * prev / next are compute() results, p / pp the current and previous settings. Returns { en, zh }.
 */
export function explain(what, prev, next, p, pp = p) {
  const a = fmt(prev ? prev.height : next.height);
  const b = fmt(next.height);
  const up = prev ? next.height > prev.height + 0.005 : true;
  const same = prev && Math.abs(next.height - prev.height) < 0.05;
  const moveEn = same ? `stays at about ${b} m` : `${up ? 'grows' : 'shrinks'} from ${a} m to ${b} m`;
  const moveZh = same ? `保持在 ${b} 米左右` : `从 ${a} 米${up ? '涨到' : '降到'} ${b} 米`;

  if (next.kind === 'none' && what !== 'shape') {
    if (p.bar < 6) {
      return {
        en: `With the sandbar only ${fmt(p.bar, 0)} m high the water stays deep, so the wave front is never slowed down enough to break: the tide rises gently and there is no bore.`,
        zh: `沙坎只有 ${fmt(p.bar, 0)} 米高，江水还很深，潮波的前锋没有被拖慢到会“立起来”的程度，所以潮水只是缓缓上涨，形不成涌潮。`,
      };
    }
    return {
      en: `The tidal range at the head of the bay is only ${fmt(next.range)} m, too small to build a wall of water over the sandbar, so the tide simply rises.`,
      zh: `湾顶的潮差只有 ${fmt(next.range)} 米，不足以在沙坎上堆起一道水墙，潮水只是慢慢涨起来。`,
    };
  }

  switch (what) {
    case 'day': {
      const al = next.align;
      if (al > 0.8)
        return {
          en: `On lunar day ${p.day} the Sun, Earth and Moon are almost in a line, so their pulls add up into a spring tide: the bore ${moveEn}.`,
          zh: `农历${p.day}日，太阳、地球和月亮几乎排成一线，引潮力叠加成大潮，潮头${moveZh}。`,
        };
      if (al < 0.25)
        return {
          en: `On lunar day ${p.day} the Moon pulls at right angles to the Sun, so the two partly cancel out into a neap tide: the bore ${moveEn}.`,
          zh: `农历${p.day}日，月亮和太阳的引力方向接近垂直，互相抵消一部分，形成小潮，潮头${moveZh}。`,
        };
      return {
        en: `On lunar day ${p.day} the Sun and Moon are only partly lined up, so the tide is between spring and neap: the bore ${moveEn}.`,
        zh: `农历${p.day}日，日月只是部分对齐，潮汐介于大潮和小潮之间，潮头${moveZh}。`,
      };
    }
    case 'season':
      if (p.season === 'autumn')
        return {
          en: `Around the autumn equinox the Sun stands over the equator and adds the most to the Moon's pull, while the river is low and pushes back less: the bore ${moveEn}.`,
          zh: `秋分前后太阳直射赤道，对月亮引潮力的“加成”最大；这时江水流量小，顶托的力量也小，潮头${moveZh}。`,
        };
      if (p.season === 'summer')
        return {
          en: `In summer the river is in flood and its current pushes against the incoming tide, and the Sun is far from the equator: the bore ${moveEn}.`,
          zh: `夏季是汛期，江水下泄的力量顶住进来的潮水，太阳又远离赤道，潮头${moveZh}。`,
        };
      if (p.season === 'winter')
        return {
          en: `In winter the river is low, but the Sun is far south of the equator and adds less to the Moon's pull: the bore ${moveEn}.`,
          zh: `冬季江水虽小，但太阳远在赤道以南，对月亮引潮力的加成变小，潮头${moveZh}。`,
        };
      return {
        en: `Around the spring equinox the Sun again helps the Moon, but the river is starting to rise for the rainy season: the bore ${moveEn}.`,
        zh: `春分前后太阳同样“帮”月亮一把，但江水开始为雨季上涨，潮头${moveZh}。`,
      };
    case 'mouth':
      return p.mouth >= pp.mouth
        ? {
            en: `A ${fmt(p.mouth, 0)} km wide mouth gathers more sea and squeezes it into the same narrow river, so the tidal range at the head of the bay reaches ${fmt(next.range)} m: the bore ${moveEn}.`,
            zh: `湾口宽 ${fmt(p.mouth, 0)} 公里，收进更多海水，再挤进同样窄的江道，湾顶潮差达到 ${fmt(next.range)} 米，潮头${moveZh}。`,
          }
        : {
            en: `A ${fmt(p.mouth, 0)} km mouth makes a gentler funnel with less water to squeeze, so the tidal range at the head of the bay is ${fmt(next.range)} m: the bore ${moveEn}.`,
            zh: `湾口只有 ${fmt(p.mouth, 0)} 公里，“喇叭”收得不那么急，能挤压的海水少了，湾顶潮差为 ${fmt(next.range)} 米，潮头${moveZh}。`,
          };
    case 'bar':
      return {
        en: `With a ${fmt(p.bar, 0)} m sandbar the water over it is only about ${fmt(next.depth)} m deep at low tide; the front of the wave slows down in the shallows while the deeper water behind catches up, so the wave steepens: the bore ${moveEn}.`,
        zh: `沙坎高 ${fmt(p.bar, 0)} 米，低潮时上面的水只有约 ${fmt(next.depth)} 米深；潮波前锋在浅水里变慢，后面深水里的潮水追上来，波面越来越陡，潮头${moveZh}。`,
      };
    case 'wind':
      if (p.wind > 0.5)
        return {
          en: `An onshore south-easterly wind of ${fmt(p.wind, 0)} m/s piles extra sea water into the bay, raising the tidal range to ${fmt(next.range)} m: the bore ${moveEn}.`,
          zh: `${fmt(p.wind, 0)} 米/秒的东南风从海上吹向陆地，把更多海水推进湾里，潮差升到 ${fmt(next.range)} 米，潮头${moveZh}。`,
        };
      if (p.wind < -0.5)
        return {
          en: `An offshore north-westerly wind of ${fmt(-p.wind, 0)} m/s holds water back out at sea, lowering the tidal range to ${fmt(next.range)} m: the bore ${moveEn}.`,
          zh: `${fmt(-p.wind, 0)} 米/秒的西北风从陆地吹向海上，把海水往外推，潮差降到 ${fmt(next.range)} 米，潮头${moveZh}。`,
        };
      return {
        en: `With no wind, only the Moon, the Sun and the shape of the bay decide the tide: the bore ${moveEn}.`,
        zh: `没有风的时候，潮的大小只由日月和海湾的形状决定，潮头${moveZh}。`,
      };
    case 'shape':
      return {
        en: `Same tide, different riverbed: the height stays at about ${b} m, but where it meets sandbanks and dikes the bore changes shape.`,
        zh: `潮还是那一潮，江道不同：潮高仍在 ${b} 米左右，但遇到沙洲和丁坝，潮头就会变换形态。`,
      };
    default:
      return {
        en: `With these settings the tidal range at the head of the bay is ${fmt(next.range)} m and the water over the sandbar is ${fmt(next.depth)} m deep, so the bore is about ${b} m high.`,
        zh: `在这组条件下，湾顶潮差 ${fmt(next.range)} 米，沙坎上水深 ${fmt(next.depth)} 米，潮头高约 ${b} 米。`,
      };
  }
}

/** A model sentence in English the reader can practise saying. */
export function practiceSentence(p, r) {
  const fmt1 = (v) => fmt(v);
  const seasonEn = { spring: 'in spring', summer: 'in summer', autumn: 'in autumn', winter: 'in winter' }[p.season];
  if (r.kind === 'none')
    return `On lunar day ${p.day} ${seasonEn}, there is no bore: the tide just rises, because the water over the sandbar is too deep.`;
  const al = r.align > 0.8 ? 'a spring tide' : r.align < 0.25 ? 'a neap tide' : 'a middling tide';
  return `On lunar day ${p.day} ${seasonEn}, ${al} and a funnel-shaped bay push up a bore about ${fmt1(r.height)} metres high, racing upstream at ${fmt1(r.speed)} metres per second.`;
}
