// Pixel helpers shared by the oracle's comparators: sampling a 2x render, and measuring a corner radius from the
// antialiasing along its diagonal.
import { PNG } from 'pngjs';
import { differenceCiede2000, parse } from 'culori';

export const S = 2; // device pixel ratio on both sides

export const LIMITS = { px: 1, deltaE: 2 };
export const de = differenceCiede2000();
export const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
export const deltaE = (a, b) => de(parse(hex(a)), parse(hex(b)));

export function pixel(png, x, y) {
  const xi = Math.min(png.width - 1, Math.max(0, Math.round(x)));
  const yi = Math.min(png.height - 1, Math.max(0, Math.round(y)));
  const i = (yi * png.width + xi) * 4;
  return [png.data[i], png.data[i + 1], png.data[i + 2]];
}
export const avg = (ps) => [0, 1, 2].map((k) => ps.reduce((s, p) => s + p[k], 0) / ps.length);
export const sample = (png, x, y) => avg([pixel(png, x, y), pixel(png, x + 1, y), pixel(png, x, y + 1), pixel(png, x + 1, y + 1)]);
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export function bilinear(png, x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const [a, b, c, d] = [pixel(png, x0, y0), pixel(png, x0 + 1, y0), pixel(png, x0, y0 + 1), pixel(png, x0 + 1, y0 + 1)];
  return [0, 1, 2].map((k) => (a[k] * (1 - fx) + b[k] * fx) * (1 - fy) + (c[k] * (1 - fx) + d[k] * fx) * fy);
}

/**
 * Corner radius from antialiasing. Walk the exact (subpixel) diagonal in from the box's
 * top-left corner until coverage, measured between the page and the box's inside colour,
 * reaches one half. The arc crosses the diagonal at r(1 - 1/sqrt 2) on each axis.
 * Null when the box is not distinguishable from the page (ghost, link, outline on its own
 * background): there is no visible corner to measure.
 */
export function radius(png, box, inside) {
  const x0 = box.x * S;
  const y0 = box.y * S;
  const page = pixel(png, x0 - 6, y0 - 6);
  const span = dist(inside, page);
  if (span < 30) return null;
  const k = 1 - Math.SQRT1_2;
  const tmax = (Math.min(box.w, box.h) / 2) * S * k + 2; // where a fully round end would cross
  let prev = 0;
  for (let t = 0; t <= tmax; t += 0.125) {
    // Pixel (i, j) covers [i, i+1); its value is the coverage at its centre (i + 0.5).
    const cov = dist(bilinear(png, x0 + t - 0.5, y0 + t - 0.5), page) / span;
    if (cov >= 0.5) {
      const tc = t === 0 ? 0 : t - 0.125 + (0.125 * (0.5 - prev)) / (cov - prev);
      return tc / S / k;
    }
    prev = cov;
  }
  return null;
}

/** Glyph colour: the pixel in the text box furthest from the background. */
export function glyph(png, r, bg) {
  let best = bg;
  for (let y = r.y * S; y < (r.y + r.h) * S; y++) {
    for (let x = r.x * S; x < (r.x + r.w) * S; x++) {
      const p = pixel(png, x, y);
      if (dist(p, bg) > dist(best, bg)) best = p;
    }
  }
  return best;
}

export function crop(png, r, pad = 5) {
  const x0 = Math.round((r.x - pad) * S);
  const y0 = Math.round((r.y - pad) * S);
  const w = Math.round((r.w + 2 * pad) * S);
  const h = Math.round((r.h + 2 * pad) * S);
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = pixel(png, x0 + x, y0 + y);
      const i = (y * w + x) * 4;
      out.data[i] = p[0]; out.data[i + 1] = p[1]; out.data[i + 2] = p[2]; out.data[i + 3] = 255;
    }
  }
  return out;
}

/** Mean SSIM over 8x8 windows (stride 4) on luma, over the overlap of two crops. */
export function ssim(a, b) {
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const luma = (png, x, y) => { const i = (y * png.width + x) * 4; return 0.299 * png.data[i] + 0.587 * png.data[i + 1] + 0.114 * png.data[i + 2]; };
  const C1 = (0.01 * 255) ** 2;
  const C2 = (0.03 * 255) ** 2;
  let total = 0;
  let n = 0;
  for (let y = 0; y + 8 <= h; y += 4) {
    for (let x = 0; x + 8 <= w; x += 4) {
      let ma = 0, mb = 0;
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { ma += luma(a, x + i, y + j); mb += luma(b, x + i, y + j); }
      ma /= 64; mb /= 64;
      let va = 0, vb = 0, cov = 0;
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
        const da = luma(a, x + i, y + j) - ma; const db = luma(b, x + i, y + j) - mb;
        va += da * da; vb += db * db; cov += da * db;
      }
      va /= 63; vb /= 63; cov /= 63;
      total += ((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2));
      n++;
    }
  }
  return n ? total / n : 1;
}

export function heatmap(a, b) {
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ia = (y * a.width + x) * 4; const ib = (y * b.width + x) * 4; const io = (y * w + x) * 4;
      const d = Math.min(255, 3 * Math.hypot(a.data[ia] - b.data[ib], a.data[ia + 1] - b.data[ib + 1], a.data[ia + 2] - b.data[ib + 2]));
      out.data[io] = 255; out.data[io + 1] = 255 - d; out.data[io + 2] = 255 - d; out.data[io + 3] = 255;
    }
  }
  return out;
}

