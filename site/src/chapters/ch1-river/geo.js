/**
 * Geography for the ch1 sand table: a schematic, not-to-scale map of the Qiantang estuary.
 *
 * Positions are real longitudes / latitudes (checked against OpenStreetMap), projected
 * to kilometres and then pushed through a gentle "magnifying lens" centred on the pagoda,
 * so the cluster of places on Yuelun Hill is readable next to a 100 km wide bay.
 * Widths of the river are exaggerated. Heights are invented for the sand-table look.
 */

const LON0 = 120.95;
const LAT0 = 30.43;
const KM_LON = 96.2; // km per degree of longitude at ~30.4°N
const KM_LAT = 111.0;

export const BOUNDS = { lon: [119.82, 122.08], lat: [29.88, 30.98] };

/** Linear projection, km. +x = east, +z = south (so north is "up" on screen from the default view). */
function lin(lon, lat) {
  return [(lon - LON0) * KM_LON, (LAT0 - lat) * KM_LAT];
}

const PAGODA_LL = [120.1266, 30.1983];
const [CX, CZ] = lin(...PAGODA_LL);
const LENS_A = 1.2; // magnification at the centre = 1 + A
const LENS_S = 9; // km

function lensFactor(r) {
  return 1 + LENS_A * Math.exp(-((r / LENS_S) ** 2));
}

/** lon/lat → map units [x, z] (with the lens). */
export function toMap(lon, lat) {
  const [x, z] = lin(lon, lat);
  const dx = x - CX;
  const dz = z - CZ;
  const r = Math.hypot(dx, dz);
  const f = lensFactor(r);
  return [CX + dx * f, CZ + dz * f];
}

/** Local magnification at a lon/lat (used to scale widths and radii). */
export function scaleAt(lon, lat) {
  const [x, z] = lin(lon, lat);
  return lensFactor(Math.hypot(x - CX, z - CZ));
}

const [BX0, BZ1] = lin(BOUNDS.lon[0], BOUNDS.lat[0]);
const [BX1, BZ0] = lin(BOUNDS.lon[1], BOUNDS.lat[1]);
export const TABLE = { x0: BX0, x1: BX1, z0: BZ0, z1: BZ1, w: BX1 - BX0, d: BZ1 - BZ0 };

/**
 * River centreline from Fuchun (upstream, west) to where Hangzhou Bay opens.
 * [lon, lat, width in km (exaggerated)]
 */
export const RIVER = [
  [119.83, 29.985, 1.0],
  [119.9, 30.015, 1.1],
  [119.96, 30.036, 1.2], // Fuyang
  [120.02, 30.055, 1.2],
  [120.08, 30.074, 1.3],
  [120.14, 30.091, 1.4],
  [120.172, 30.105, 1.5], // Yuanpu, the three-river junction near Wenyan
  [120.166, 30.13, 1.4], // the river turns north
  [120.142, 30.15, 1.3],
  [120.124, 30.17, 1.3], // Zhijiang Bridge
  [120.125, 30.186, 1.3], // below the Zhijiang campus
  [120.137, 30.193, 1.3], // Qiantang River Bridge, below the pagoda
  [120.16, 30.201, 1.4],
  [120.18, 30.211, 1.5], // Fuxing Bridge
  [120.21, 30.231, 1.6], // Xixing Bridge
  [120.245, 30.257, 1.7],
  [120.28, 30.283, 1.8], // Jiubao
  [120.318, 30.276, 2.0],
  [120.352, 30.258, 2.1], // Xiasha Bridge: the river swings south-east, then north-east again
  [120.385, 30.285, 2.3],
  [120.41, 30.318, 2.5], // Jiangdong Bridge
  [120.47, 30.36, 2.8],
  [120.55, 30.387, 3.0], // Yanguan
  [120.64, 30.37, 3.6],
  [120.71, 30.33, 5.0],
  [120.77, 30.275, 8.0], // Jiashao Bridge
  [120.86, 30.27, 12.0],
];

/** Hangzhou Bay + the open sea, one polygon [lon, lat]. */
export const SEA = [
  [120.74, 30.312], // Jianshan, north bank
  [120.83, 30.345],
  [120.9, 30.392], // Ganpu
  [120.96, 30.47],
  [121.02, 30.56],
  [121.08, 30.61], // Zhapu
  [121.2, 30.668],
  [121.34, 30.716], // Jinshan
  [121.5, 30.79],
  [121.7, 30.846],
  [121.86, 30.868],
  [121.95, 30.878], // Nanhui
  [121.975, 30.94],
  [121.96, 31.05],
  [122.3, 31.1],
  [122.3, 29.75],
  [122.0, 29.86],
  [121.85, 29.915],
  [121.72, 29.97], // Zhenhai
  [121.6, 30.1],
  [121.45, 30.24],
  [121.3, 30.31],
  [121.15, 30.315],
  [121.0, 30.245],
  [120.9, 30.19],
  [120.8, 30.2],
  [120.74, 30.222],
];

/** Islands in the sea (Jintang, part of Zhoushan): [lon, lat, radius km]. */
export const ISLANDS = [
  [121.89, 30.02, 3.2],
  [122.08, 30.03, 8.5],
  [121.98, 29.96, 2.0],
];

/** West Lake, drawn as an ellipse: [lon, lat, rx km, rz km]. */
export const WEST_LAKE = [120.143, 30.246, 1.35, 1.6];

/** Hill masses for the terrain: [lon, lat, radius km, height]. */
export const HILLS = [
  [119.98, 30.13, 24, 2.6], // hills around Fuyang and the lower Tianmu range
  [120.11, 30.225, 5, 1.6], // the hills around West Lake
  [120.12, 30.11, 8, 1.4], // south-west of the city, towards Zhuantang
  [120.33, 29.98, 20, 1.8], // Xiaoshan and the hills towards Zhuji
  [120.62, 29.93, 18, 1.5], // Kuaiji hills, south of Shaoxing
  [121.28, 29.9, 22, 1.9], // Siming hills, west of Ningbo
  [122.08, 30.03, 6, 1.0], // Zhoushan
];

/** Yuelun Hill, the small hill the pagoda stands on. */
export const YUELUN = [120.124, 30.2, 0.7, 1.05];

export const PAGODA = PAGODA_LL;

/* ───────────── Signed distance helpers (map units) ───────────── */

function segDist(px, pz, ax, az, bx, bz) {
  const vx = bx - ax;
  const vz = bz - az;
  const wx = px - ax;
  const wz = pz - az;
  const L = vx * vx + vz * vz;
  let t = L > 0 ? (wx * vx + wz * vz) / L : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = wx - vx * t;
  const dz = wz - vz * t;
  return [Math.sqrt(dx * dx + dz * dz), t];
}

/** Signed distance to a polygon (negative inside). poly: [[x,z]...] in map units. */
export function sdPolygon(poly, px, pz) {
  let d = Infinity;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi) inside = !inside;
    const [dd] = segDist(px, pz, xj, zj, xi, zi);
    if (dd < d) d = dd;
  }
  return inside ? -d : d;
}

/**
 * Resampled river: smooth centreline points with widths, in map units.
 * Returns [{ x, z, w }] (w = full width).
 */
export function riverPath(THREE, samples = 360) {
  const pts = RIVER.map(([lon, lat]) => {
    const [x, z] = toMap(lon, lat);
    return new THREE.Vector3(x, 0, z);
  });
  const widths = RIVER.map(([lon, lat, w]) => w * scaleAt(lon, lat));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const out = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const p = curve.getPointAt(u);
    // width: interpolate by the parameter of the nearest control index
    const fi = u * (RIVER.length - 1);
    const i0 = Math.floor(fi);
    const i1 = Math.min(RIVER.length - 1, i0 + 1);
    const w = widths[i0] + (widths[i1] - widths[i0]) * (fi - i0);
    out.push({ x: p.x, z: p.z, w });
  }
  return { curve, points: out };
}

/**
 * Builds a signed-distance field "distance to water" on a regular grid.
 * Negative = water. Returns Float32Array (nx+1)*(nz+1), row-major in z.
 */
export function waterField(THREE, nx, nz) {
  const { points } = riverPath(THREE);
  const sea = SEA.map(([lon, lat]) => toMap(lon, lat));
  const islands = ISLANDS.map(([lon, lat, r]) => {
    const [x, z] = toMap(lon, lat);
    return [x, z, r * scaleAt(lon, lat)];
  });
  const [lx, lz] = toMap(WEST_LAKE[0], WEST_LAKE[1]);
  const ls = scaleAt(WEST_LAKE[0], WEST_LAKE[1]);
  const lrx = WEST_LAKE[2] * ls;
  const lrz = WEST_LAKE[3] * ls;

  const W = nx + 1;
  const field = new Float32Array(W * (nz + 1));
  const dx = TABLE.w / nx;
  const dz = TABLE.d / nz;
  const FAR = 12;
  field.fill(FAR);

  // River: stamp each segment into nearby cells only.
  for (let s = 0; s < points.length - 1; s++) {
    const a = points[s];
    const b = points[s + 1];
    const margin = Math.max(a.w, b.w) / 2 + 6;
    const i0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - margin - TABLE.x0) / dx));
    const i1 = Math.min(nx, Math.ceil((Math.max(a.x, b.x) + margin - TABLE.x0) / dx));
    const j0 = Math.max(0, Math.floor((Math.min(a.z, b.z) - margin - TABLE.z0) / dz));
    const j1 = Math.min(nz, Math.ceil((Math.max(a.z, b.z) + margin - TABLE.z0) / dz));
    for (let j = j0; j <= j1; j++) {
      const pz = TABLE.z0 + j * dz;
      for (let i = i0; i <= i1; i++) {
        const px = TABLE.x0 + i * dx;
        const [d, t] = segDist(px, pz, a.x, a.z, b.x, b.z);
        const sd = d - (a.w + (b.w - a.w) * t) / 2;
        const k = j * W + i;
        if (sd < field[k]) field[k] = sd;
      }
    }
  }

  for (let j = 0; j <= nz; j++) {
    const pz = TABLE.z0 + j * dz;
    for (let i = 0; i <= nx; i++) {
      const px = TABLE.x0 + i * dx;
      const k = j * W + i;
      let d = field[k];
      // the bay and the sea
      const ds = sdPolygon(sea, px, pz);
      if (ds < d) d = ds;
      // West Lake (approximate ellipse distance)
      const ex = (px - lx) / lrx;
      const ez = (pz - lz) / lrz;
      const de = (Math.sqrt(ex * ex + ez * ez) - 1) * Math.min(lrx, lrz);
      if (de < d) d = de;
      // islands carve land back out of the sea
      for (const [ix, iz, r] of islands) {
        const di = Math.hypot(px - ix, pz - iz) - r;
        d = Math.max(d, -di);
      }
      field[k] = d;
    }
  }
  return field;
}

/* ───────────── Terrain height ───────────── */

function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function noise(x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi);
  const b = hash(xi + 1, zi);
  const c = hash(xi, zi + 1);
  const d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, z) {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < 4; o++) {
    v += amp * noise(x * f, z * f);
    f *= 2.03;
    amp *= 0.5;
  }
  return v;
}

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

let hillsMap = null;
function hillsInMap() {
  if (hillsMap) return hillsMap;
  hillsMap = HILLS.map(([lon, lat, r, hgt]) => {
    const [x, z] = toMap(lon, lat);
    return [x, z, r * scaleAt(lon, lat), hgt];
  });
  const [yx, yz] = toMap(YUELUN[0], YUELUN[1]);
  hillsMap.yuelun = [yx, yz, YUELUN[2] * scaleAt(YUELUN[0], YUELUN[1]), YUELUN[3]];
  return hillsMap;
}

/** Height of the land surface before the shoreline is applied. */
export function hillHeight(x, z) {
  const hills = hillsInMap();
  let mass = 0;
  for (const [hx, hz, r, hgt] of hills) {
    const q = ((x - hx) ** 2 + (z - hz) ** 2) / (r * r);
    if (q < 4) mass += hgt * Math.exp(-q * 1.6);
  }
  const n = fbm(x * 0.11, z * 0.11);
  let h = mass * (0.35 + 0.9 * n);
  const [yx, yz, yr, yh] = hills.yuelun;
  const qy = ((x - yx) ** 2 + (z - yz) ** 2) / (yr * yr);
  h += yh * Math.exp(-qy * 1.3);
  // very gentle relief on the plains
  h += 0.12 * fbm(x * 0.35 + 7, z * 0.35 - 3);
  return h;
}

/** Final surface height for a point with signed water distance d. */
export function surfaceHeight(x, z, d) {
  if (d < 0) return -0.12 - 0.85 * smooth(0, 2.4, -d);
  return 0.28 * smooth(0, 0.7, d) + hillHeight(x, z) * smooth(0.25, 3.2, d);
}
