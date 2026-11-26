// OKLCH -> sRGB (CSS Color 4). Pure arithmetic, so the same input always gives the same bytes.

const parseNum = (s, percentScale = 1) =>
  s.endsWith('%') ? (parseFloat(s) / 100) * percentScale : parseFloat(s);

/** Parses `oklch(L C H)` or `oklch(L C H / A)`. Throws on anything else. */
export function parseOklch(css) {
  const m = /^oklch\(\s*([^\s/]+)\s+([^\s/]+)\s+([^\s/]+)\s*(?:\/\s*([^\s)]+)\s*)?\)$/.exec(css.trim());
  if (!m) throw new Error(`not an oklch() colour: ${css}`);
  return {
    l: parseNum(m[1]),
    c: parseNum(m[2], 0.4),
    h: parseFloat(m[3]),
    alpha: m[4] === undefined ? 1 : parseNum(m[4]),
  };
}

function oklabToLinearSrgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const encode = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
const inGamut = (rgb) => rgb.every((v) => v >= -1e-6 && v <= 1 + 1e-6);

function lch(l, c, h) {
  const r = (h * Math.PI) / 180;
  return oklabToLinearSrgb(l, c * Math.cos(r), c * Math.sin(r));
}

function linearSrgbToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const clip = (rgb) => rgb.map((v) => Math.min(1, Math.max(0, v)));
const deltaEOK = (x, y) => {
  const [a, b] = [linearSrgbToOklab(x), linearSrgbToOklab(y)];
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
};

// CSS Color 4, section 13.2 "binary search gamut mapping with local MINDE" (JND 0.02).
function gamutMap(l, c, h) {
  const JND = 0.02;
  const EPS = 0.0001;
  const origin = lch(l, c, h);
  if (inGamut(origin)) return { rgb: origin, clamped: false };
  if (l >= 1) return { rgb: [1, 1, 1], clamped: true };
  if (l <= 0) return { rgb: [0, 0, 0], clamped: true };
  let clipped = clip(origin);
  if (deltaEOK(clipped, origin) < JND) return { rgb: clipped, clamped: true };
  let min = 0;
  let max = c;
  let minInGamut = true;
  while (max - min > EPS) {
    const chroma = (min + max) / 2;
    const current = lch(l, chroma, h);
    if (minInGamut && inGamut(current)) {
      min = chroma;
      continue;
    }
    clipped = clip(current);
    const e = deltaEOK(clipped, current);
    if (e < JND) {
      if (JND - e < EPS) break;
      minInGamut = false;
      min = chroma;
    } else {
      max = chroma;
    }
  }
  return { rgb: clipped, clamped: true };
}

/**
 * Returns `{ r, g, b, alpha, clamped }` with 0..255 integer channels.
 * Out-of-gamut colours are gamut-mapped as CSS Color 4 specifies (chroma reduction
 * in OKLCH with a just-noticeable-difference clip), and `clamped` records that it happened.
 */
export function oklchToSrgb(css) {
  const { l, c, h, alpha } = parseOklch(css);
  const { rgb, clamped } = gamutMap(l, c, h);
  const [r, g, b] = rgb.map((v) => Math.round(Math.min(1, Math.max(0, encode(v))) * 255));
  return { r, g, b, alpha: Math.round(alpha * 1000) / 1000, clamped };
}

export const hex = ({ r, g, b }) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
