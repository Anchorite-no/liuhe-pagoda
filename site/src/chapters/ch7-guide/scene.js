/**
 * The viewpoint picker: landscape (day, with the bridge) + pagoda, four preset cameras and free orbit.
 *
 *   const scene = createGuideScene(el);
 *   scene.setView(VIEWS[1]);        // glides there (instant with reduced motion)
 *   scene.setFree(true);            // orbit controls on
 *   scene.setLight('night');
 *   const url = scene.capture();    // JPEG data URL of the current view
 */
import { gsap } from 'gsap';
import { createStage } from '../../three/stage.js';
import { createPagoda } from '../../three/pagoda.js';
import { createLandscape, terrainHeight, WATER_Y } from '../../three/landscape.js';
import { reducedMotion } from '../../core/ui.js';

export function resolveCam(view) {
  const [x, y, z] = view.cam;
  return [x, y == null ? terrainHeight(x, z) + (view.lift || 20) : y, z];
}

export function createGuideScene(container, firstView) {
  const cam0 = resolveCam(firstView);
  const stage = createStage(container, {
    camera: cam0,
    target: firstView.target,
    fov: firstView.fov,
    far: 6000,
    controls: true,
    controlsOptions: { minDistance: 12, maxDistance: 900, rotateSpeed: 0.6, zoomSpeed: 0.8 },
  });
  if (!stage) return null;
  const { THREE, camera, controls } = stage;
  controls.disconnect(); // presets first: leave touch scrolling to the page

  const land = createLandscape(stage.scene, { preset: 'day', bridge: true, stage });
  const pagoda = createPagoda();
  stage.scene.add(pagoda.group);

  let free = false;
  let tween = null;
  stage.onTick((dt, t) => {
    land.update(dt, t);
    pagoda.update(t, { wind: 0.35 });
    if (free) {
      // keep the free camera above ground and water
      const p = camera.position;
      const floor = Math.max(terrainHeight(p.x, p.z), WATER_Y) + 1.5;
      if (p.y < floor) p.y = floor;
    }
  });

  const from = { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 40 };
  const to = { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 40 };

  function glide(pos, target, fov, seconds = 2.2) {
    if (tween) tween.kill();
    from.pos.copy(camera.position);
    from.target.copy(controls.target);
    from.fov = camera.fov;
    to.pos.set(...pos);
    to.target.set(...target);
    to.fov = fov;
    const apply = (k) => {
      camera.position.lerpVectors(from.pos, to.pos, k);
      controls.target.lerpVectors(from.target, to.target, k);
      camera.fov = from.fov + (to.fov - from.fov) * k;
      camera.updateProjectionMatrix();
      controls.update();
    };
    if (reducedMotion() || seconds <= 0) {
      apply(1);
      stage.render();
      return Promise.resolve();
    }
    const s = { k: 0 };
    return new Promise((resolve) => {
      tween = gsap.to(s, {
        k: 1,
        duration: seconds,
        ease: 'power2.inOut',
        onUpdate: () => apply(s.k),
        onComplete: () => {
          tween = null;
          resolve();
        },
      });
    });
  }

  let lightName = 'day';

  return {
    stage,
    /** Glide to a preset view. Resolves when the camera arrives. */
    setView(view, seconds) {
      free = false;
      controls.disconnect();
      return glide(resolveCam(view), view.target, view.fov, seconds);
    },
    /** Orbit freely around the pagoda, starting from wherever the camera is. */
    setFree(on) {
      free = on;
      if (!on) {
        controls.disconnect();
        return Promise.resolve();
      }
      const p = camera.position.toArray();
      const dist = camera.position.distanceTo(new THREE.Vector3(0, 24, 0));
      // pull very distant cameras closer so orbiting feels anchored to the pagoda
      const k = dist > 320 ? 320 / dist : 1;
      const pos = [p[0] * k, Math.max(p[1], 6), p[2] * k];
      return glide(pos, [0, 24, 0], 42, 1.4).then(() => {
        if (free) controls.connect();
      });
    },
    setLight(name) {
      lightName = name;
      // blend only while the scene is animating; off screen, switch at once so a capture is right
      land.setPreset(name, reducedMotion() || !stage.running ? 0 : 2);
      pagoda.setLamp(name === 'night' ? 1 : name === 'dusk' ? 0.35 : 0);
      if (!stage.running) stage.render();
    },
    get light() {
      return lightName;
    },
    /** Render now and read the pixels in the same tick (no preserveDrawingBuffer needed). */
    capture() {
      // render at least ~1400 px wide so the postcard stays sharp on phones, then restore
      const r = stage.renderer;
      const prev = r.getPixelRatio();
      const w = Math.max(1, container.clientWidth);
      const boost = Math.min(3, Math.max(prev, 1400 / w));
      if (boost !== prev) r.setPixelRatio(boost);
      stage.render();
      const url = r.domElement.toDataURL('image/jpeg', 0.92);
      if (boost !== prev) {
        r.setPixelRatio(prev);
        stage.render();
      }
      return url;
    },
    dispose() {
      if (tween) tween.kill();
      land.dispose();
      pagoda.dispose();
      stage.dispose();
    },
  };
}
