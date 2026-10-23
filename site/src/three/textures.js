/**
 * Procedural canvas textures (no image files, nothing to license).
 */
import * as THREE from 'three';

function rand(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export function canvasTexture(w, h, draw, { srgb = true, repeat = [1, 1], wrap = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  if (wrap) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 4;
  return tex;
}

/** Grey roof tiles: channels run down the slope (v), rows across (u). */
export function roofTiles() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#41484a';
    g.fillRect(0, 0, w, h);
    const r = rand(7);
    for (let x = 0; x < w; x += 32) {
      // convex cover tile
      const grad = g.createLinearGradient(x, 0, x + 20, 0);
      grad.addColorStop(0, '#2f3537');
      grad.addColorStop(0.45, '#5f686a');
      grad.addColorStop(1, '#30373a');
      g.fillStyle = grad;
      g.fillRect(x, 0, 20, h);
      // shadowed pan tile gap
      g.fillStyle = '#2a2f31';
      g.fillRect(x + 20, 0, 3, h);
    }
    for (let y = 0; y < h; y += 32) {
      g.fillStyle = 'rgba(20,24,26,0.45)';
      g.fillRect(0, y, w, 2);
      for (let x = 0; x < w; x += 32) {
        g.fillStyle = `rgba(255,255,255,${0.03 + r() * 0.05})`;
        g.fillRect(x + 2, y + 3, 16, 26);
      }
    }
  });
}

/** One face of the Qing timber gallery wall: corner posts, painted lintel, lattice window. */
export function timberWall() {
  return canvasTexture(256, 256, (g, w, h) => {
    const r = rand(11);
    g.fillStyle = '#7a3222';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(40,10,4,${0.05 + r() * 0.08})`;
      g.fillRect(r() * w, 0, 1 + r() * 2, h);
    }
    // lintel band with a thin blue-green painted line (Qing beam painting)
    g.fillStyle = '#4e1d12';
    g.fillRect(0, 0, w, 30);
    g.fillStyle = '#2f5b57';
    g.fillRect(0, 10, w, 7);
    g.fillStyle = '#b48a3c';
    g.fillRect(0, 17, w, 2);
    // skirting
    g.fillStyle = '#4a1c12';
    g.fillRect(0, h - 22, w, 22);
    // corner posts
    g.fillStyle = '#4a1b10';
    g.fillRect(0, 0, 14, h);
    g.fillRect(w - 14, 0, 14, h);
    // window opening with lattice
    const wx = 72;
    const wy = 70;
    const ww = 112;
    const wh = 120;
    g.fillStyle = '#3c160d';
    g.fillRect(wx - 8, wy - 8, ww + 16, wh + 16);
    g.fillStyle = '#140c09';
    g.fillRect(wx, wy, ww, wh);
    g.strokeStyle = '#6b2b1b';
    g.lineWidth = 3;
    for (let x = wx + 14; x < wx + ww; x += 14) {
      g.beginPath();
      g.moveTo(x, wy);
      g.lineTo(x, wy + wh);
      g.stroke();
    }
    for (let y = wy + 15; y < wy + wh; y += 15) {
      g.beginPath();
      g.moveTo(wx, y);
      g.lineTo(wx + ww, y);
      g.stroke();
    }
  }, { repeat: [8, 1] });
}

/** Emissive mask matching timberWall(): window panes glow, lattice stays dark. */
export function timberWallGlow() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, h);
    const wx = 72;
    const wy = 70;
    const ww = 112;
    const wh = 120;
    const grad = g.createRadialGradient(w / 2, wy + wh / 2, 10, w / 2, wy + wh / 2, 90);
    grad.addColorStop(0, '#ffe2a8');
    grad.addColorStop(1, '#c8782a');
    g.fillStyle = grad;
    g.fillRect(wx, wy, ww, wh);
    g.strokeStyle = '#000';
    g.lineWidth = 3;
    for (let x = wx + 14; x < wx + ww; x += 14) {
      g.beginPath();
      g.moveTo(x, wy);
      g.lineTo(x, wy + wh);
      g.stroke();
    }
    for (let y = wy + 15; y < wy + wh; y += 15) {
      g.beginPath();
      g.moveTo(wx, y);
      g.lineTo(wx + ww, y);
      g.stroke();
    }
  }, { repeat: [8, 1] });
}

function drawBricks(g, w, h, seed, base = [154, 106, 82]) {
  const r = rand(seed);
  g.fillStyle = '#bfae98';
  g.fillRect(0, 0, w, h);
  const bh = 16;
  const bw = 48;
  for (let row = 0; row * bh < h; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let x = -bw; x < w + bw; x += bw) {
      const k = 0.82 + r() * 0.3;
      g.fillStyle = `rgb(${(base[0] * k) | 0},${(base[1] * k) | 0},${(base[2] * k) | 0})`;
      g.fillRect(x + off + 1, row * bh + 1, bw - 2, bh - 2);
    }
  }
}

/** Running-bond brick (Southern Song brick body). */
export function brick(seed = 3, base) {
  return canvasTexture(256, 256, (g, w, h) => drawBricks(g, w, h, seed, base));
}

/**
 * Brick shell, two faces per tile: an arched doorway, then a shallow niche.
 * Use repeat [4, 1] on an 8-sided prism so doors and niches alternate.
 */
export function brickShellFaces(seed = 5) {
  return canvasTexture(512, 256, (g, w, h) => {
    drawBricks(g, w, h, seed);
    const face = (cx, door) => {
      const ow = door ? 92 : 70;
      const oh = door ? 170 : 110;
      const top = door ? h - oh - 6 : 70;
      g.fillStyle = '#8a8270';
      g.beginPath();
      g.moveTo(cx - ow / 2 - 8, top + oh + 6);
      g.lineTo(cx - ow / 2 - 8, top + ow / 2);
      g.arc(cx, top + ow / 2, ow / 2 + 8, Math.PI, 0);
      g.lineTo(cx + ow / 2 + 8, top + oh + 6);
      g.closePath();
      g.fill();
      g.fillStyle = door ? '#120d0b' : '#4a3a30';
      g.beginPath();
      g.moveTo(cx - ow / 2, top + oh);
      g.lineTo(cx - ow / 2, top + ow / 2);
      g.arc(cx, top + ow / 2, ow / 2, Math.PI, 0);
      g.lineTo(cx + ow / 2, top + oh);
      g.closePath();
      g.fill();
    };
    face(128, true);
    face(384, false);
    // corner pilasters (brick imitating timber columns)
    g.fillStyle = 'rgba(70,40,28,0.55)';
    for (const x of [0, 248, 256, 504]) g.fillRect(x, 0, 8, h);
  }, { repeat: [4, 1] });
}

/** Weathered stone for the plinth. */
export function stone() {
  return canvasTexture(256, 128, (g, w, h) => {
    const r = rand(17);
    g.fillStyle = '#8e928c';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      for (let x = (y / 32) % 2 ? -32 : 0; x < w; x += 64) {
        const k = 0.88 + r() * 0.2;
        g.fillStyle = `rgb(${(142 * k) | 0},${(146 * k) | 0},${(140 * k) | 0})`;
        g.fillRect(x + 1, y + 1, 62, 30);
      }
    }
    for (let i = 0; i < 400; i++) {
      g.fillStyle = `rgba(30,35,32,${r() * 0.12})`;
      g.fillRect(r() * w, r() * h, 2, 2);
    }
  }, { repeat: [8, 1] });
}

/** Soft round glow for sprites (lamp, sun, moon). */
export function glow(inner = 'rgba(255,226,168,1)', outer = 'rgba(255,170,60,0)') {
  return canvasTexture(128, 128, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, inner);
    grad.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.6)'));
    grad.addColorStop(1, outer);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, { wrap: false });
}
