/**
 * Callouts drawn over a picture, the way a technical drawing names its parts: a dot on the
 * part, a thin leader line with an elbow, the name at the end. Also an optional dash-dot
 * centre line. Callers give positions in CSS pixels of the container; this only draws.
 */
const SVG = 'http://www.w3.org/2000/svg';

export function createCallouts(container) {
  const root = document.createElement('div');
  root.className = 'callouts';
  root.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(SVG, 'svg');
  root.append(svg);
  container.append(root);
  const axis = document.createElementNS(SVG, 'line');
  axis.setAttribute('class', 'callouts__axis');
  svg.append(axis);
  const items = new Map(); // id -> { path, dot, label }

  function item(id) {
    if (items.has(id)) return items.get(id);
    const path = document.createElementNS(SVG, 'polyline');
    path.setAttribute('class', 'callouts__lead');
    const dot = document.createElementNS(SVG, 'circle');
    dot.setAttribute('class', 'callouts__dot');
    dot.setAttribute('r', '3');
    svg.append(path, dot);
    const label = document.createElement('span');
    label.className = 'callouts__label';
    root.append(label);
    const it = { path, dot, label };
    items.set(id, it);
    return it;
  }

  /**
   * list: [{ id, x, y, lx, ly, text, opacity }]  (anchor x,y; label point lx,ly)
   * line: { x0, y0, x1, y1, opacity } or null
   */
  function set(list, line = null) {
    const seen = new Set();
    for (const c of list) {
      if (c.opacity <= 0.01) continue;
      seen.add(c.id);
      const it = item(c.id);
      const left = c.lx < c.x;
      // a name is either one string or { zh, en }: Chinese on top, English under it
      const key = typeof c.text === 'string' ? c.text : `${c.text.zh}|${c.text.en}`;
      if (it.key !== key) {
        it.key = key;
        if (typeof c.text === 'string') it.label.textContent = c.text;
        else it.label.innerHTML = `<b>${c.text.zh}</b><i lang="en">${c.text.en}</i>`;
      }
      // keep the whole name inside the picture, however long it is in this language
      const lw = it.label.offsetWidth + 6;
      const W = root.clientWidth;
      const lx = left ? Math.max(lw + 8, c.lx) : Math.min(W - lw - 8, c.lx);
      const ly = Math.max(14, Math.min(root.clientHeight - 14, c.ly));
      // the leader leaves the part on a slant, then runs level under the name
      const ex = lx + (left ? 14 : -14);
      it.path.setAttribute('points', `${c.x},${c.y} ${ex},${ly} ${lx},${ly}`);
      it.dot.setAttribute('cx', c.x);
      it.dot.setAttribute('cy', c.y);
      it.path.style.opacity = it.dot.style.opacity = it.label.style.opacity = c.opacity;
      it.label.style.transform = `translate(${lx}px, ${ly}px) translate(${left ? 'calc(-100% - 6px)' : '6px'}, -50%)`;
    }
    for (const [id, it] of items) {
      if (seen.has(id)) continue;
      it.path.style.opacity = it.dot.style.opacity = it.label.style.opacity = 0;
    }
    if (line && line.opacity > 0.01) {
      axis.setAttribute('x1', line.x0);
      axis.setAttribute('y1', line.y0);
      axis.setAttribute('x2', line.x1);
      axis.setAttribute('y2', line.y1);
      axis.style.opacity = line.opacity;
    } else axis.style.opacity = 0;
  }

  return { set, root };
}

/** 0..1: fully shown inside [from, to], fading over `fade` frames at both ends */
export function within(frame, from, to, fade = 8) {
  if (frame < from - fade || frame > to + fade) return 0;
  if (frame < from) return (frame - (from - fade)) / fade;
  if (frame > to) return 1 - (frame - to) / fade;
  return 1;
}
