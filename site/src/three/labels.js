/**
 * HTML labels pinned to 3D points.
 *
 *   const labels = createLabels(stage);
 *   const el = h('button', { class: 'hotspot' }, 'Finial');
 *   labels.add(el, new THREE.Vector3(0, 60, 0));
 *   labels.remove(el);
 *
 * Elements are appended to stage.container (which must be position: relative — `.stage` is).
 * Labels behind the camera or outside the view are hidden.
 */
import * as THREE from 'three';

export function createLabels(stage) {
  const items = new Map(); // el -> { pos, offset }
  const v = new THREE.Vector3();

  function update() {
    const w = stage.container.clientWidth;
    const hgt = stage.container.clientHeight;
    for (const [el, it] of items) {
      v.copy(it.pos);
      if (it.object) it.object.localToWorld(v);
      v.project(stage.camera);
      const visible = v.z < 1 && v.z > -1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 && !it.hidden;
      if (!visible) {
        el.style.visibility = 'hidden';
        continue;
      }
      el.style.visibility = '';
      const x = (v.x * 0.5 + 0.5) * w + (it.offset?.[0] || 0);
      const y = (-v.y * 0.5 + 0.5) * hgt + (it.offset?.[1] || 0);
      el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }

  const off = stage.onTick(update);

  return {
    /** pos: Vector3 (world, or local to `object` if given). offset: [px, py] screen nudge. */
    add(el, pos, { object = null, offset = null } = {}) {
      if (!el.parentNode) stage.container.append(el);
      el.style.left = '0';
      el.style.top = '0';
      items.set(el, { pos: pos.clone ? pos.clone() : new THREE.Vector3(...pos), object, offset, hidden: false });
      update();
      return el;
    },
    remove(el) {
      items.delete(el);
      el.remove();
    },
    setHidden(el, hidden) {
      const it = items.get(el);
      if (it) it.hidden = hidden;
      update();
    },
    setPosition(el, pos) {
      const it = items.get(el);
      if (it) it.pos.copy(pos);
    },
    update,
    dispose() {
      off();
      for (const el of items.keys()) el.remove();
      items.clear();
    },
  };
}
