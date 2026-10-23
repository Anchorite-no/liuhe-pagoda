/**
 * Dot globe with markers for tidal bores.
 *
 *   const globe = createGlobe(el, { bores, onSelect });
 *   globe.focus('severn'); globe.setActive(id); globe.dispose();
 *
 * Land is drawn as dots from a bundled Natural Earth mask (landmask.js). Returns null without WebGL.
 */
import { gsap } from 'gsap';
import { createStage } from '../../three/stage.js';
import { createLabels } from '../../three/labels.js';
import { h, reducedMotion } from '../../core/ui.js';
import { tr, onLangChange } from '../../core/i18n.js';
import { STEP, TOTAL, MASK } from './landmask.js';

const R = 1;

export function latLonToVec(THREE, lat, lon, r = R) {
  const la = THREE.MathUtils.degToRad(lat);
  const lo = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r);
}

function decodeMask() {
  const bin = atob(MASK);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function createGlobe(container, { bores, onSelect }) {
  const stage = createStage(container, {
    fov: 32,
    near: 0.1,
    far: 50,
    camera: [0, 0.6, 4.4],
    target: [0, 0, 0],
    controls: true,
    background: '#10171a',
    controlsOptions: {
      enableZoom: false,
      enablePan: false,
      rotateSpeed: 0.55,
      minPolarAngle: 0.35,
      maxPolarAngle: Math.PI - 0.35,
    },
  });
  if (!stage) return null;
  const { THREE, scene, camera, controls } = stage;
  stage.renderer.domElement.style.touchAction = 'pan-y';
  const reduce = reducedMotion();
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 0.35;
  const stopAuto = () => {
    controls.autoRotate = false;
  };
  // Keep the whole globe in view whatever the shape of the stage.
  const fitDist = () => 1.2 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(1, camera.aspect));
  controls.addEventListener('start', stopAuto);

  /* ── Ocean sphere with a soft rim ── */
  const ocean = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.995, 72, 48),
    new THREE.ShaderMaterial({
      uniforms: { uDeep: { value: new THREE.Color('#132026') }, uRim: { value: new THREE.Color('#2c4249') } },
      vertexShader: `
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uDeep; uniform vec3 uRim;
        varying vec3 vN; varying vec3 vV;
        void main() {
          float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.2);
          gl_FragColor = vec4(mix(uDeep, uRim, f), 1.0);
        }`,
    }),
  );
  scene.add(ocean);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.1, 48, 32),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color('#9fb3ad') } },
      vertexShader: `
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; varying vec3 vN; varying vec3 vV;
        void main() {
          float f = pow(max(0.0, 0.62 - dot(-vN, vV) * 0.62), 3.0);
          gl_FragColor = vec4(uColor, f * 0.55);
        }`,
    }),
  );
  scene.add(halo);

  /* ── Graticule ── */
  {
    const pts = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lon = -180; lon < 180; lon += 4) {
        pts.push(latLonToVec(THREE, lat, lon, R * 1.001), latLonToVec(THREE, lat, lon + 4, R * 1.001));
      }
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let lat = -84; lat < 84; lat += 4) {
        pts.push(latLonToVec(THREE, lat, lon, R * 1.001), latLonToVec(THREE, lat + 4, lon, R * 1.001));
      }
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#4a6168', transparent: true, opacity: 0.28 })));
  }

  /* ── Land dots ── */
  {
    const bytes = decodeMask();
    const positions = [];
    let k = 0;
    for (let row = 0; row <= 140; row++) {
      const lat = -84 + row * STEP;
      const n = Math.max(1, Math.floor((360 * Math.cos(THREE.MathUtils.degToRad(lat))) / STEP + 0.5));
      for (let i = 0; i < n; i++, k++) {
        if (bytes[k >> 3] & (1 << (k & 7))) {
          const lon = -180 + ((i + 0.5) * 360) / n;
          const v = latLonToVec(THREE, lat, lon, R * 1.004);
          positions.push(v.x, v.y, v.z);
        }
      }
    }
    if (import.meta.env.DEV && k !== TOTAL) console.warn('[ch6] land mask size mismatch', k, TOTAL);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const dpr = stage.renderer.getPixelRatio();
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uSize: { value: 2.6 * dpr }, uColor: { value: new THREE.Color('#dfe6e1') } },
      vertexShader: `
        uniform float uSize; varying float vFace;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vec3 n = normalize(normalMatrix * normalize(position));
          vFace = dot(n, normalize(-mv.xyz));
          gl_PointSize = uSize * (4.4 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; varying float vFace;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          if (dot(c, c) > 0.25) discard;
          float a = smoothstep(-0.05, 0.35, vFace);
          gl_FragColor = vec4(uColor, a * 0.85);
        }`,
    });
    scene.add(new THREE.Points(g, m));
  }

  /* ── Markers ── */
  const labels = createLabels(stage);
  const markerGeo = new THREE.SphereGeometry(0.016, 16, 12);
  const ringGeo = new THREE.RingGeometry(0.028, 0.036, 40);
  const markerMat = new THREE.MeshBasicMaterial({ color: '#e0aa45' });
  const markers = new Map();
  for (const b of bores) {
    const n = latLonToVec(THREE, b.ll[0], b.ll[1]).normalize();
    const dot = new THREE.Mesh(markerGeo, markerMat);
    dot.position.copy(n).multiplyScalar(R * 1.006);
    scene.add(dot);
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: '#e0aa45', transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.position.copy(n).multiplyScalar(R * 1.007);
    ring.lookAt(n.clone().multiplyScalar(2));
    scene.add(ring);
    const btn = h(
      'button',
      { type: 'button', class: 'hotspot ch6-marker', 'aria-expanded': 'false', 'aria-controls': 'ch6-card', onclick: () => onSelect && onSelect(b.id) },
      tr(b.short),
    );
    const offset = [0, -18];
    const anchor = n.clone().multiplyScalar(R * 1.012);
    labels.add(btn, anchor, { offset });
    markers.set(b.id, { n, anchor, btn, ring, b, offset, phase: Math.random() * Math.PI * 2, w: 0, hgt: 0 });
  }
  const leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  leaders.setAttribute('class', 'ch6-leaders');
  leaders.setAttribute('aria-hidden', 'true');
  for (const m of markers.values()) {
    m.line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    leaders.append(m.line);
  }
  container.append(leaders);
  let measure = true;
  const offLang = onLangChange(() => {
    for (const m of markers.values()) m.btn.textContent = tr(m.b.short);
    measure = true;
  });

  // Push overlapping labels apart (Severn and Seine, or Qiantang and Hooghly on a phone).
  const pv = new THREE.Vector3();
  function declutter() {
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const list = [];
    for (const m of markers.values()) {
      if (measure || !m.w) {
        m.w = m.btn.offsetWidth;
        m.hgt = m.btn.offsetHeight;
      }
      pv.copy(m.anchor).project(camera);
      m.sx = (pv.x * 0.5 + 0.5) * cw;
      m.sy = (-pv.y * 0.5 + 0.5) * ch;
      const pref = m.b.labelOffset || [0, -18];
      m.cx = m.sx + pref[0];
      m.cy = m.sy + pref[1];
      if (m.shown) list.push(m);
    }
    measure = false;
    for (let it = 0; it < 10; it++) {
      let moved = false;
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          const ox = (a.w + b.w) / 2 + 6 - Math.abs(a.cx - b.cx);
          const oy = (a.hgt + b.hgt) / 2 + 4 - Math.abs(a.cy - b.cy);
          if (ox > 0 && oy > 0) {
            moved = true;
            const push = oy / 2 + 0.5;
            if (a.cy <= b.cy) {
              a.cy -= push;
              b.cy += push;
            } else {
              a.cy += push;
              b.cy -= push;
            }
          }
        }
      }
      if (!moved) break;
    }
    for (const m of markers.values()) {
      m.cx = Math.min(cw - m.w / 2 - 4, Math.max(m.w / 2 + 4, m.cx));
      m.offset[0] = m.cx - m.sx;
      m.offset[1] = m.cy - m.sy;
      const far = m.shown && Math.hypot(m.offset[0], m.offset[1]) > 26;
      m.line.setAttribute('visibility', far ? 'visible' : 'hidden');
      if (far) {
        m.line.setAttribute('x1', m.sx.toFixed(1));
        m.line.setAttribute('y1', m.sy.toFixed(1));
        m.line.setAttribute('x2', m.cx.toFixed(1));
        m.line.setAttribute('y2', m.cy.toFixed(1));
      }
    }
  }

  // Hide labels on the far side of the globe; pulse the rings.
  const camDir = new THREE.Vector3();
  stage.onTick((dt, t) => {
    const want = fitDist();
    if (Math.abs(camera.position.length() - want) > 0.01) camera.position.setLength(want);
    camDir.copy(camera.position).normalize();
    for (const m of markers.values()) {
      const shown = m.n.dot(camDir) >= 0.18;
      if (shown !== m.shown) {
        m.shown = shown;
        labels.setHidden(m.btn, !shown);
      }
      if (!reduce) {
        const k = (t * 0.6 + m.phase) % 1;
        m.ring.scale.setScalar(1 + k * 1.6);
        m.ring.material.opacity = 0.75 * (1 - k);
      }
    }
    declutter();
    labels.update();
  });

  /* ── Turning to a marker ── */
  let tween = null;
  function focus(id, duration = 1.4) {
    const m = markers.get(id);
    if (!m) return;
    stopAuto();
    if (tween) tween.kill();
    const from = camera.position.clone().normalize();
    // look slightly from above the marker so it sits a little below the centre
    const to = m.n.clone().add(new THREE.Vector3(0, 0.1, 0)).normalize();
    const q0 = new THREE.Quaternion();
    const q1 = new THREE.Quaternion().setFromUnitVectors(from, to);
    const qt = new THREE.Quaternion();
    const s = { k: 0 };
    const apply = () => {
      qt.slerpQuaternions(q0, q1, s.k);
      camera.position.copy(from).applyQuaternion(qt).multiplyScalar(fitDist());
      camera.lookAt(0, 0, 0);
    };
    if (reduce || duration === 0) {
      s.k = 1;
      apply();
      controls.update();
      return;
    }
    tween = gsap.to(s, { k: 1, duration, ease: 'power2.inOut', onUpdate: apply });
  }

  function setActive(id) {
    for (const [mid, m] of markers) m.btn.setAttribute('aria-expanded', String(mid === id));
  }

  // Start with Asia in view, so the Qiantang is the first thing you see.
  focus('qiantang', 0);
  camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
  controls.update();

  return {
    stage,
    focus,
    setActive,
    dispose() {
      if (tween) tween.kill();
      offLang();
      labels.dispose();
      stage.dispose();
    },
  };
}
