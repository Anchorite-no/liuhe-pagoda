/**
 * The Qiantang River surface with a travelling tidal bore.
 *
 *   const river = createRiver({ width: 4000, depth: 1100, z: 600, y: WATER_Y });
 *   scene.add(river.mesh);
 *   river.setBore(0, { pos: 300, height: 2.5, dir: [-1, 0] });   // front 0 at 300 m along dir
 *   stage.onTick((dt, t) => river.update(t));
 *   river.heightAt(x, z)  // CPU estimate of the surface height (for boats, cameras)
 *
 * Bore model (per front i, s = dot(p, dir) − pos, i.e. distance ahead of the front):
 *   s > 0  ahead of the front — calm, low water
 *   s ≈ 0  the breaking front — steep crest, most foam
 *   s < 0  behind — raised water with decaying undulations (whelps)
 * Up to two fronts, so "cross tide" (交叉潮) and "returning tide" (回头潮) can be staged.
 */
import * as THREE from 'three';

const MAX_FRONTS = 2;

const boreGLSL = /* glsl */ `
  uniform float uTime;
  uniform vec2  uDir[${MAX_FRONTS}];
  uniform float uPos[${MAX_FRONTS}];
  uniform float uHeight[${MAX_FRONTS}];
  uniform float uWidth[${MAX_FRONTS}];
  uniform float uWobble[${MAX_FRONTS}];

  // s = distance ahead of front i (>0 not yet reached, <0 already passed)
  float boreS(vec2 p, int i) {
    vec2 d = uDir[i];
    vec2 perp = vec2(-d.y, d.x);
    float along = dot(p, d) - uPos[i];
    float lateral = dot(p, perp);
    // a bore front is never perfectly straight: slow bends + fine jaggedness
    along += uWobble[i] * (sin(lateral * 0.006 + 1.7) * 9.0 + sin(lateral * 0.031 + uTime * 0.6) * 2.2);
    return along;
  }

  // height of all fronts at p; foam (0..1) returned through the out param
  float boreH(vec2 p, out float foam) {
    float h = 0.0;
    foam = 0.0;
    for (int i = 0; i < ${MAX_FRONTS}; i++) {
      float H = uHeight[i];
      if (H <= 0.0) continue;
      float s = boreS(p, i);
      float w = uWidth[i];
      float raised = 1.0 - smoothstep(-w, w * 0.2, s);
      float crest = exp(-pow((s + w * 0.25) / (w * 0.55), 2.0));
      float behind = step(s, 0.0);
      float whelps = behind * 0.22 * sin(s * 0.16 - uTime * 1.3) * exp(s / 90.0);
      h += H * (0.55 * raised + 0.75 * crest + whelps);
      float strength = clamp(H / 1.0, 0.0, 1.0);
      foam += clamp(crest * 1.6 + behind * (0.55 * exp(s / 50.0) + 0.45 * exp(s / 220.0)), 0.0, 1.0) * strength;
    }
    return h;
  }
`;

const vertex = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  uniform float uWave;
  uniform vec2  uFlow;
  ${boreGLSL}
  varying vec3 vWorld;
  varying vec3 vNormal2;
  varying float vRaise;

  float ambient(vec2 p) {
    vec2 q = p + uFlow * uTime;
    return uWave * (
      sin(q.x * 0.045 + uTime * 0.9) * 0.35 +
      sin(q.y * 0.06 - uTime * 1.1 + q.x * 0.01) * 0.3 +
      sin((q.x + q.y) * 0.11 + uTime * 1.7) * 0.15
    );
  }

  float surface(vec2 p) {
    float f;
    return boreH(p, f) + ambient(p);
  }

  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    float h = surface(wp.xz);
    float e = 1.5;
    float hx = surface(wp.xz + vec2(e, 0.0));
    float hz = surface(wp.xz + vec2(0.0, e));
    vNormal2 = normalize(vec3(h - hx, e, h - hz));
    wp.y += h;
    vWorld = wp.xyz;
    vRaise = h;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragment = /* glsl */ `
  #include <common>
  #include <fog_pars_fragment>
  ${boreGLSL}
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSky;
  uniform vec3 uFoamColor;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunStrength;
  uniform vec3 uLampPos;
  uniform float uLamp;
  uniform vec3 uHill;
  uniform float uHillHeight;
  uniform vec3 uTowerPos;
  uniform vec3 uTowerColor;
  uniform float uTowerHeight;
  uniform float uTowerRadius;
  varying vec3 vWorld;
  varying vec3 vNormal2;
  varying float vRaise;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.07; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 V = normalize(cameraPosition - vWorld);
    float camDist = length(cameraPosition - vWorld);
    // fine ripples, stretched along the current; fade with distance to avoid shimmer
    vec2 rp = vWorld.xz * vec2(0.18, 0.5) + vec2(uTime * 0.35, uTime * 0.05);
    float rippleAmt = 0.35 * (1.0 - smoothstep(300.0, 1500.0, camDist)) + 0.08;
    vec3 n = normalize(vNormal2 + vec3(fbm(rp) - 0.5, 0.0, fbm(rp + 31.7) - 0.5) * rippleAmt);
    float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
    float depthMix = clamp(0.45 + vRaise * 0.12, 0.0, 1.0);
    vec3 water = mix(uDeep, uShallow, depthMix);
    // silt streaks drifting with the current
    float streak = fbm(vWorld.xz * vec2(0.004, 0.03) + vec2(uTime * 0.02, 0.0));
    water *= 0.85 + 0.3 * streak;

    // What the surface reflects: sky, or the dark hill / the pagoda on the north bank (fake reflection)
    vec3 R = reflect(-V, n);
    vec3 refl = uSky;
    float horiz = max(length(R.xz), 0.05);
    float north = smoothstep(0.0, 0.35, -R.z / horiz);
    if (north > 0.0) {
      float distN = max(vWorld.z + 120.0, 40.0);
      float hillElev = uHillHeight / distN;
      float elevR = R.y / horiz;
      float hillMask = (1.0 - smoothstep(hillElev * 0.6, hillElev * 1.1 + 0.02, elevR)) * north;
      refl = mix(refl, uHill, hillMask);
      // the pagoda
      vec3 toT = uTowerPos - vWorld;
      vec2 hd = normalize(toT.xz);
      vec2 rh = R.xz / horiz;
      float dist = length(toT.xz);
      float halfAng = uTowerRadius / dist;
      float topElev = (uTowerPos.y + uTowerHeight - vWorld.y) / dist;
      float taper = mix(1.0, 0.55, clamp(elevR / max(topElev, 0.001), 0.0, 1.0));
      float sideT = 1.0 - smoothstep(halfAng * 0.7 * taper, halfAng * 1.15 * taper, length(rh - hd));
      float tower = sideT * (1.0 - smoothstep(topElev * 0.92, topElev, elevR)) * north;
      refl = mix(refl, uTowerColor, tower * 0.9);
    }
    vec3 col = mix(water, refl, 0.12 + 0.68 * fres);
    // sun glitter
    vec3 Hs = normalize(uSunDir + V);
    float nh = max(dot(n, Hs), 0.0);
    col += uSunColor * (pow(nh, 220.0) * 2.0 + pow(nh, 30.0) * 0.08) * uSunStrength;
    // lamp reflection streak at night
    if (uLamp > 0.0) {
      vec3 L = normalize(uLampPos - vWorld);
      vec3 H2 = normalize(L + V);
      col += vec3(1.0, 0.72, 0.36) * pow(max(dot(n, H2), 0.0), 60.0) * uLamp * 1.6;
    }
    // foam, evaluated per pixel so the front stays crisp: broken, streaky, densest at the crest
    float bf;
    boreH(vWorld.xz, bf);
    if (bf > 0.001) {
      float fn = fbm(vWorld.xz * vec2(0.09, 0.22) + vec2(uTime * 0.4, 0.0));
      float fn2 = fbm(vWorld.xz * 0.7 - uTime * 0.9);
      float foam = smoothstep(0.32, 0.7, bf * (0.5 + 0.9 * fn) + fn2 * 0.2 * bf);
      vec3 foamCol = uFoamColor * (0.82 + 0.18 * fn2);
      col = mix(col, foamCol, foam);
    }
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export function createRiver(opts = {}) {
  const {
    width = 4000, // along X (the river runs east–west)
    depth = 1100, // along Z
    x = 0,
    z = 600,
    y = 0,
    segX = 640,
    segZ = 150,
    deep = '#3b372a',
    shallow = '#776b4d',
    sky = '#c9d1cf',
    foam = '#f1f2ec',
    wave = 0.18,
  } = opts;

  // Denser vertices near the pagoda (x ≈ 0), coarser toward the far ends of the river.
  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  {
    const pos = geo.attributes.position;
    const half = width / 2;
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) - x * 0) / half;
      pos.setX(i, Math.sign(u) * Math.pow(Math.abs(u), 1.7) * half);
    }
  }
  geo.rotateX(-Math.PI / 2);

  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uTime: { value: 0 },
      uWave: { value: wave },
      uFlow: { value: new THREE.Vector2(3, 0) },
      uDir: { value: [new THREE.Vector2(-1, 0), new THREE.Vector2(-1, 0)] },
      uPos: { value: [0, 0] },
      uHeight: { value: [0, 0] },
      uWidth: { value: [10, 10] },
      uWobble: { value: [1, 1] },
      uDeep: { value: new THREE.Color(deep) },
      uShallow: { value: new THREE.Color(shallow) },
      uSky: { value: new THREE.Color(sky) },
      uFoamColor: { value: new THREE.Color(foam) },
      uSunDir: { value: new THREE.Vector3(0.6, 0.35, 0.5).normalize() },
      uSunColor: { value: new THREE.Color('#fff1d6') },
      uSunStrength: { value: 1.2 },
      uLampPos: { value: new THREE.Vector3(0, 54, 0) },
      uLamp: { value: 0 },
      uHill: { value: new THREE.Color('#3b4636') },
      uHillHeight: { value: 95 },
      uTowerPos: { value: new THREE.Vector3(0, 0, 0) },
      uTowerColor: { value: new THREE.Color('#5a2a1e') },
      uTowerHeight: { value: 60 },
      uTowerRadius: { value: 9 },
    },
  ]);

  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, fog: true });
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.frustumCulled = false;
  mesh.name = 'QiantangRiver';

  const fronts = [
    { dir: new THREE.Vector2(-1, 0), pos: 0, height: 0, width: 10, wobble: 1 },
    { dir: new THREE.Vector2(-1, 0), pos: 0, height: 0, width: 10, wobble: 1 },
  ];

  function sync() {
    for (let i = 0; i < MAX_FRONTS; i++) {
      uniforms.uDir.value[i].copy(fronts[i].dir);
      uniforms.uPos.value[i] = fronts[i].pos;
      uniforms.uHeight.value[i] = fronts[i].height;
      uniforms.uWidth.value[i] = fronts[i].width;
      uniforms.uWobble.value[i] = fronts[i].wobble;
    }
  }

  // CPU mirror of the shader's bore height (ambient waves approximated).
  function boreHeight(px, pz) {
    let h = 0;
    const t = uniforms.uTime.value;
    for (const f of fronts) {
      if (f.height <= 0) continue;
      const perpX = -f.dir.y;
      const perpZ = f.dir.x;
      let along = px * f.dir.x + pz * f.dir.y - f.pos;
      const lateral = px * perpX + pz * perpZ;
      along += f.wobble * (Math.sin(lateral * 0.006 + 1.7) * 9 + Math.sin(lateral * 0.031 + t * 0.6) * 2.2);
      const s = along;
      const w = f.width;
      const sm = (e0, e1, x) => {
        const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
        return k * k * (3 - 2 * k);
      };
      const raised = 1 - sm(-w, w * 0.2, s);
      const crest = Math.exp(-(((s + w * 0.25) / (w * 0.55)) ** 2));
      const whelps = s <= 0 ? 0.22 * Math.sin(s * 0.16 - t * 1.3) * Math.exp(s / 90) : 0;
      h += f.height * (0.55 * raised + 0.75 * crest + whelps);
    }
    return h;
  }

  sync();

  return {
    mesh,
    material,
    uniforms,
    fronts,
    /**
     * Configure front i (0 or 1).
     * dir: [dx, dz] travel direction (normalised for you), pos: metres along dir from the
     * world origin, height: metres (0 disables), width: steepness length, wobble: 0..2.
     */
    setBore(i, { dir, pos, height, width, wobble } = {}) {
      const f = fronts[i];
      if (dir) f.dir.set(dir[0], dir[1]).normalize();
      if (pos != null) f.pos = pos;
      if (height != null) f.height = height;
      if (width != null) f.width = width;
      if (wobble != null) f.wobble = wobble;
      sync();
    },
    clearBores() {
      for (const f of fronts) f.height = 0;
      sync();
    },
    setColors({ deep: d, shallow: s, sky: k, foam: fm } = {}) {
      if (d) uniforms.uDeep.value.set(d);
      if (s) uniforms.uShallow.value.set(s);
      if (k) uniforms.uSky.value.set(k);
      if (fm) uniforms.uFoamColor.value.set(fm);
    },
    setSun(dirVec3, color, strength) {
      if (dirVec3) uniforms.uSunDir.value.copy(dirVec3).normalize();
      if (color) uniforms.uSunColor.value.set(color);
      if (strength != null) uniforms.uSunStrength.value = strength;
    },
    setLamp(intensity, worldPos) {
      uniforms.uLamp.value = intensity;
      if (worldPos) uniforms.uLampPos.value.copy(worldPos);
    },
    /** Colour of the hill and pagoda seen reflected in the water (fake reflection). */
    setReflections({ hill, tower, hillHeight, towerHeight, towerPos } = {}) {
      if (hill) uniforms.uHill.value.set(hill);
      if (tower) uniforms.uTowerColor.value.set(tower);
      if (hillHeight != null) uniforms.uHillHeight.value = hillHeight;
      if (towerHeight != null) uniforms.uTowerHeight.value = towerHeight;
      if (towerPos) uniforms.uTowerPos.value.copy(towerPos);
    },
    setWave(v) {
      uniforms.uWave.value = v;
    },
    update(elapsed) {
      uniforms.uTime.value = elapsed;
    },
    /** Approximate surface height in world units at (x, z), including the water level. */
    heightAt(px, pz) {
      return mesh.position.y + boreHeight(px, pz);
    },
    dispose() {
      geo.dispose();
      material.dispose();
    },
  };
}
