/**
 * Compose a postcard on a 2D canvas: the captured 3D view on the left, a title, the reader's
 * caption and a drawn stamp on the right, in the site's typography (Spectral + Noto Serif SC).
 */

export const CARD_W = 1600;
export const CARD_H = 1000;

const PAPER = '#f1efe6';
const INK = '#182025';
const MUTED = '#4a575a';
const LACQUER = '#8b3a25';
const LAMP = '#e0aa45';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function ensureFonts(caption) {
  if (!document.fonts || !document.fonts.load) return;
  const loads = [
    document.fonts.load('600 64px "Spectral"'),
    document.fonts.load('italic 400 32px "Spectral"', caption || 'Greetings'),
    document.fonts.load('400 26px "Spectral"'),
    document.fonts.load('600 34px "Noto Serif SC"', '六和塔杭州钱塘江'),
  ];
  try {
    await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 1500))]);
  } catch (_) {
    /* fall back to system serif */
  }
}

function wrap(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawStamp(ctx, x, y, w, h) {
  // perforated edge
  ctx.save();
  ctx.fillStyle = '#fbfaf5';
  ctx.shadowColor = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = 6;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.fillStyle = PAPER;
  const r = 5;
  for (let i = 0; i <= w; i += 16) {
    ctx.beginPath();
    ctx.arc(x + i, y, r, 0, Math.PI * 2);
    ctx.arc(x + i, y + h, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let j = 0; j <= h; j += 16) {
    ctx.beginPath();
    ctx.arc(x, y + j, r, 0, Math.PI * 2);
    ctx.arc(x + w, y + j, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const ix = x + 12;
  const iy = y + 12;
  const iw = w - 24;
  const ih = h - 24;
  ctx.fillStyle = LACQUER;
  ctx.fillRect(ix, iy, iw, ih);
  // pagoda silhouette in lamp gold
  const cx = ix + iw / 2;
  const base = iy + ih - 34;
  const s = ih - 64;
  ctx.fillStyle = LAMP;
  let yy = base;
  for (let i = 0; i < 13; i++) {
    const th = (s * 0.82) / 13;
    const wb = iw * 0.34 * (1 - i * 0.035);
    ctx.fillRect(cx - wb / 2, yy - th * 0.75, wb, th * 0.75);
    ctx.beginPath();
    ctx.moveTo(cx - wb * 0.78, yy - th * 0.95);
    ctx.lineTo(cx + wb * 0.78, yy - th * 0.95);
    ctx.lineTo(cx + wb * 0.55, yy - th * 0.7);
    ctx.lineTo(cx - wb * 0.55, yy - th * 0.7);
    ctx.closePath();
    ctx.fill();
    yy -= th;
  }
  ctx.fillRect(cx - 1.5, yy - s * 0.14, 3, s * 0.14);
  ctx.fillStyle = '#f6efe2';
  ctx.font = '600 20px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText('六和塔', cx, iy + ih - 10);
  ctx.textAlign = 'left';
}

function drawPostmark(ctx, cx, cy, dateText) {
  ctx.save();
  ctx.strokeStyle = 'rgba(24, 32, 37, 0.55)';
  ctx.fillStyle = 'rgba(24, 32, 37, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = '600 15px "Spectral", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = 'HANGZHOU · QIANTANG RIVER · ';
  const step = (Math.PI * 2) / label.length;
  for (let i = 0; i < label.length; i++) {
    const a = -Math.PI / 2 + i * step;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * 59, cy + Math.sin(a) * 59);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(label[i], 0, 0);
    ctx.restore();
  }
  ctx.font = '600 17px "Spectral", serif';
  ctx.fillText(dateText, cx, cy);
  // wavy cancel lines
  ctx.lineWidth = 2;
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    for (let x = 0; x <= 170; x += 4) {
      const y = cy - 30 + k * 20 + Math.sin(x * 0.08) * 5;
      if (x === 0) ctx.moveTo(cx + 78 + x, y);
      else ctx.lineTo(cx + 78 + x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * @param {HTMLCanvasElement} canvas  target canvas (resized to CARD_W × CARD_H)
 * @param {{ image: string, caption: string, viewLabel: string, name?: string, date: Date }} o
 */
export async function composePostcard(canvas, { image, caption, viewLabel, name, date }) {
  await ensureFonts(caption);
  const img = image ? await loadImage(image).catch(() => null) : null;
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  // faint paper grain
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(24,32,37,${0.015 + rnd() * 0.025})`;
    ctx.fillRect(rnd() * CARD_W, rnd() * CARD_H, 1 + rnd() * 1.5, 1 + rnd() * 2.5);
  }

  // photo, cover-fit
  const px = 48;
  const py = 48;
  const pw = 960;
  const ph = CARD_H - 96;
  ctx.fillStyle = '#11181c';
  ctx.fillRect(px, py, pw, ph);
  if (img) {
    const s = Math.max(pw / img.width, ph / img.height);
    const sw = pw / s;
    const sh = ph / s;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, px, py, pw, ph);
  }
  ctx.strokeStyle = 'rgba(24,32,37,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);

  // right side
  const rx = px + pw + 60;
  const rw = CARD_W - rx - 56;
  drawStamp(ctx, CARD_W - 56 - 150, 64, 150, 186);
  const d = date || new Date();
  const dateText = `${d.getFullYear()}·${String(d.getMonth() + 1).padStart(2, '0')}·${String(d.getDate()).padStart(2, '0')}`;
  drawPostmark(ctx, CARD_W - 56 - 210, 210, dateText);

  ctx.fillStyle = INK;
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'italic 400 30px "Spectral", serif';
  ctx.fillText('Greetings from', rx, 330);
  ctx.font = '600 66px "Spectral", serif';
  ctx.fillText('Liuhe Pagoda', rx, 400);
  ctx.font = '600 34px "Noto Serif SC", serif';
  ctx.fillStyle = LACQUER;
  ctx.fillText('六和塔 · 杭州', rx, 452);
  ctx.fillStyle = MUTED;
  ctx.font = 'italic 400 24px "Spectral", serif';
  ctx.fillText(viewLabel || '', rx, 494);

  ctx.strokeStyle = 'rgba(24,32,37,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rx, 526);
  ctx.lineTo(rx + rw, 526);
  ctx.stroke();

  ctx.fillStyle = INK;
  let size = 34;
  let lines;
  do {
    ctx.font = `italic 400 ${size}px "Spectral", serif`;
    lines = wrap(ctx, caption || '', rw);
    size -= 2;
  } while (lines.length * size * 1.45 > 300 && size > 20);
  const lh = (size + 2) * 1.45;
  lines.slice(0, 9).forEach((l, i) => ctx.fillText(l, rx, 580 + i * lh));

  ctx.font = '400 26px "Spectral", serif';
  ctx.fillStyle = MUTED;
  if (name) ctx.fillText(`— ${name}`, rx, CARD_H - 92);
  ctx.font = '400 18px "Spectral", serif';
  ctx.fillText('Made at “Where the Tide Turns” · 潮起六和', rx, CARD_H - 56);
  return canvas;
}

export function downloadCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(false);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve(true);
    }, 'image/png');
  });
}
