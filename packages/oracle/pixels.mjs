// Pixel helpers shared by the oracle's comparators: sampling a 2x render, and measuring a corner radius from the
// antialiasing along its diagonal.
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

