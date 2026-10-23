/**
 * createStage(container, options) — one Three.js renderer bound to a DOM element.
 *
 * - Sizes itself to the container (ResizeObserver).
 * - Renders only while the container is on screen and the tab is visible.
 * - Caps device pixel ratio (1.5 on small screens, 2 otherwise).
 * - Returns null (and shows a bilingual message) if WebGL is unavailable,
 *   so chapters must handle `if (!stage) return;`.
 *
 *   const stage = createStage(el, { camera: [60, 30, 120], target: [0, 20, 0], controls: true });
 *   stage.onTick((dt, elapsed) => { ... });
 *   stage.dispose();
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { tr } from '../core/i18n.js';

export { THREE };

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (_) {
    return false;
  }
}

function fallback(container) {
  const p = document.createElement('p');
  p.className = 'chapter__loading';
  p.textContent = tr({
    en: 'This 3D view needs WebGL. Try a recent version of Chrome, Edge, Safari or Firefox.',
    zh: '这个 3D 场景需要 WebGL，请使用较新版本的 Chrome、Edge、Safari 或 Firefox 打开。',
  });
  container.append(p);
}

export function createStage(container, opts = {}) {
  const {
    fov = 40,
    near = 0.5,
    far = 6000,
    camera: camPos = [0, 30, 140],
    target = [0, 20, 0],
    controls: useControls = false,
    controlsOptions = {},
    background = null,
    alpha = false,
    antialias = true,
    toneMapping = THREE.ACESFilmicToneMapping,
    exposure = 1,
    shadows = false,
    maxDpr,
    alwaysRender = false,
  } = opts;

  if (!webglAvailable()) {
    fallback(container);
    return null;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias, alpha, powerPreference: 'high-performance' });
  } catch (e) {
    console.error(e);
    fallback(container);
    return null;
  }

  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const dprCap = maxDpr ?? (small ? 1.5 : 2);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = toneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.localClippingEnabled = true;
  if (shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  if (background != null) scene.background = new THREE.Color(background);

  const camera = new THREE.PerspectiveCamera(fov, 1, near, far);
  camera.position.set(...camPos);
  camera.lookAt(...target);

  let controls = null;
  if (useControls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.zoomToCursor = false;
    Object.assign(controls, controlsOptions);
    controls.update();
    // OrbitControls sets touch-action: none, which traps page scrolling on phones.
    // pan-y keeps vertical swipes for the page; horizontal drags still turn the view.
    renderer.domElement.style.touchAction = 'pan-y';
  }

  const ticks = new Set();
  const clock = new THREE.Clock(false);
  let elapsed = 0;
  let raf = 0;
  let onScreen = false;
  let running = false;
  let disposed = false;

  function setSize() {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1);
    elapsed += dt;
    for (const fn of ticks) fn(dt, elapsed);
    if (controls) controls.update();
    renderer.render(scene, camera);
  }

  function start() {
    if (running || disposed) return;
    running = true;
    clock.start();
    clock.getDelta();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    clock.stop();
  }

  function evaluate() {
    if ((onScreen || alwaysRender) && document.visibilityState === 'visible') start();
    else stop();
  }

  const ro = new ResizeObserver(() => {
    setSize();
    if (!running) renderer.render(scene, camera);
  });
  ro.observe(container);

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) onScreen = e.isIntersecting;
      evaluate();
    },
    { rootMargin: '120px 0px' },
  );
  io.observe(container);

  const onVis = () => evaluate();
  document.addEventListener('visibilitychange', onVis);

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    stop();
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => evaluate());

  setSize();

  const stage = {
    THREE,
    scene,
    camera,
    renderer,
    controls,
    container,
    get elapsed() {
      return elapsed;
    },
    get running() {
      return running;
    },
    /** Register a per-frame callback (dt, elapsed). Returns an unsubscribe function. */
    onTick(fn) {
      ticks.add(fn);
      return () => ticks.delete(fn);
    },
    render() {
      renderer.render(scene, camera);
    },
    start,
    stop,
    setSize,
    dispose() {
      disposed = true;
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      if (controls) controls.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of mats) {
          for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
          m.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
  return stage;
}
