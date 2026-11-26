// Compares Flutter goldens + geometry with the Chrome references, cell by cell.
// Geometry and colour decide pass/fail; SSIM is reported, not gated, since the two engines
// antialias text differently. Writes .stroma/oracle/report/{index.html,summary.json,crops/} at the repository root.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { differenceCiede2000, formatHex, parse, toGamut } from 'culori';

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const example = path.join(repo, 'examples', 'shadcn-neutral');
const pkg = path.join(example, 'packages', 'shadcn_neutral_ui');
const chromeDir = path.join(repo, '.stroma', 'oracle', 'chrome');
const flutterDir = path.join(pkg, 'build', 'oracle', 'flutter');
const reportDir = path.join(repo, '.stroma', 'oracle', 'report');
const cropDir = path.join(reportDir, 'crops');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const S = 2; // device pixel ratio on both sides

const LIMITS = { px: 1, deltaE: 2 };
const de = differenceCiede2000();
const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const deltaE = (a, b) => de(parse(hex(a)), parse(hex(b)));

function pixel(png, x, y) {
  const xi = Math.min(png.width - 1, Math.max(0, Math.round(x)));
  const yi = Math.min(png.height - 1, Math.max(0, Math.round(y)));
  const i = (yi * png.width + xi) * 4;
  return [png.data[i], png.data[i + 1], png.data[i + 2]];
}
const avg = (ps) => [0, 1, 2].map((k) => ps.reduce((s, p) => s + p[k], 0) / ps.length);
const sample = (png, x, y) => avg([pixel(png, x, y), pixel(png, x + 1, y), pixel(png, x, y + 1), pixel(png, x + 1, y + 1)]);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function bilinear(png, x, y) {
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
function radius(png, box, inside) {
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
function glyph(png, r, bg) {
  let best = bg;
  for (let y = r.y * S; y < (r.y + r.h) * S; y++) {
    for (let x = r.x * S; x < (r.x + r.w) * S; x++) {
      const p = pixel(png, x, y);
      if (dist(p, bg) > dist(best, bg)) best = p;
    }
  }
  return best;
}

function crop(png, r, pad = 5) {
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
function ssim(a, b) {
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

function heatmap(a, b) {
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

function compareCell(id, c, f, chromePng, flutterPng, state) {
  const checks = {};
  const add = (name, cv, fv, limit, gate = true) => {
    const diff = cv == null || fv == null ? null : Math.abs(cv - fv);
    checks[name] = { chrome: cv, flutter: fv, diff, pass: !gate || diff == null ? null : diff <= limit };
  };
  const isCard = id.startsWith('card.');
  add('height', c.box.h, f.box.h, LIMITS.px);
  add('width', c.box.w, f.box.w, LIMITS.px, false); // text advance differs between engines: informational
  if (isCard) {
    // Measured from the first part: the title, or the content of a content-only card.
    const [cf, ff] = [c.title ?? c.content, f.title ?? f.content];
    add('padLeft', cf.x - c.box.x, ff.x - f.box.x, LIMITS.px);
    add('padTop', cf.y - c.box.y, ff.y - f.box.y, LIMITS.px);
    if (c.title) add('titleHeight', c.title.h, f.title.h, LIMITS.px);
    add('contentTop', c.content.y - c.box.y, f.content.y - f.box.y, LIMITS.px, false);
  } else {
    const ci = c.text ?? c.icon;
    const fi = f.text ?? f.icon;
    add('padLeft', ci.x - c.box.x, fi.x - f.box.x, LIMITS.px);
  }
  const sy = isCard ? 12 : c.box.h / 2;
  const cbg = sample(chromePng, (c.box.x + 3) * S, (c.box.y + sy) * S);
  const fbg = sample(flutterPng, (f.box.x + 3) * S, (f.box.y + sy) * S);
  // Radius is read at rest only: a focus ring hides the corner.
  if (state === 'rest') add('radius', radius(chromePng, c.box, cbg), radius(flutterPng, f.box, fbg), LIMITS.px);
  const bgDe = deltaE(cbg, fbg);
  checks.background = { chrome: hex(cbg), flutter: hex(fbg), diff: bgDe, pass: bgDe < LIMITS.deltaE };
  const ct = c.text ?? c.title;
  const ft = f.text ?? f.title;
  if (ct && ft) {
    const cg = glyph(chromePng, ct, cbg);
    const fg = glyph(flutterPng, ft, fbg);
    checks.textColor = { chrome: hex(cg), flutter: hex(fg), diff: deltaE(cg, fg), pass: null };
  }
  const ca = crop(chromePng, c.box);
  const fa = crop(flutterPng, f.box);
  const score = ssim(ca, fa);
  const name = id.replace(/[^\w.-]/g, '_');
  fs.writeFileSync(path.join(cropDir, `${name}.chrome.png`), PNG.sync.write(ca));
  fs.writeFileSync(path.join(cropDir, `${name}.flutter.png`), PNG.sync.write(fa));
  fs.writeFileSync(path.join(cropDir, `${name}.diff.png`), PNG.sync.write(heatmap(ca, fa)));
  const pass = Object.values(checks).every((k) => k.pass !== false);
  return { id, state, checks, ssim: score, pass, crops: name };
}

function tokenCheck() {
  const dsir = readJson(path.join(example, 'design-system', 'shadcn.dsir.json'));
  const chrome = readJson(path.join(chromeDir, 'tokens.json'));
  // shortcut: compares with shadcn's source cssVars, so the token check is shadcn-only until feat-005 measures tokens.
  const { cssVarsV4 } = readJson(path.join(repo, 'packages', 'enricher-shadcn', 'sources', 'colors-neutral.json'));
  const rows = [];
  for (const mode of ['light', 'dark']) {
    for (const [name, modes] of Object.entries(dsir.tokens.color)) {
      const v = modes[mode];
      const ours = parse(v.hex);
      // Reference conversion: culori's CSS Color 4 gamut mapping of the source OKLCH value.
      const ref = toGamut('rgb', 'oklch')(parse(cssVarsV4[mode][name]));
      const vsCulori = de({ ...ours, alpha: 1 }, { ...ref, alpha: 1 });
      // Chrome draws each swatch over the body (bg-background), so composite ours the same way.
      const a = v.alpha;
      const page = parse(dsir.tokens.color.background[mode].hex);
      const comp = [ours.r * a + page.r * (1 - a), ours.g * a + page.g * (1 - a), ours.b * a + page.b * (1 - a)].map((ch) => ch * 255);
      const vsChrome = deltaE(comp, chrome[mode][name]);
      rows.push({ mode, name, source: cssVarsV4[mode][name], hex: v.hex, alpha: a, culori: formatHex(ref), vsCulori, chrome: hex(chrome[mode][name]), vsChrome, pass: vsCulori < 1 && vsChrome < 1 });
    }
  }
  return rows;
}

function main() {
  fs.rmSync(reportDir, { recursive: true, force: true });
  fs.mkdirSync(cropDir, { recursive: true });
  const results = [];
  for (const file of fs.readdirSync(chromeDir).filter((f) => /^\w+\.(light|dark)\.json$/.test(f)).sort()) {
    const key = file.replace(/\.json$/, '');
    const c = readJson(path.join(chromeDir, file));
    const f = readJson(path.join(flutterDir, file));
    const cp = PNG.sync.read(fs.readFileSync(path.join(chromeDir, `${key}.png`)));
    const fp = PNG.sync.read(fs.readFileSync(path.join(pkg, 'test', 'goldens', `${key}.png`)));
    for (const id of Object.keys(c.cells)) {
      if (!f.cells[id]) throw new Error(`flutter has no cell ${id}`);
      results.push({ sheet: key, ...compareCell(id, c.cells[id], f.cells[id], cp, fp, id.split('.').at(-2)) });
    }
  }
  const tokens = tokenCheck();
  const bySheet = {};
  for (const r of results) {
    const s = (bySheet[r.sheet] ??= { cells: 0, pass: 0, ssimSum: 0, ssimMin: 1, failures: {} });
    s.cells++; if (r.pass) s.pass++;
    s.ssimSum += r.ssim; s.ssimMin = Math.min(s.ssimMin, r.ssim);
    for (const [k, v] of Object.entries(r.checks)) if (v.pass === false) s.failures[k] = (s.failures[k] ?? 0) + 1;
  }
  const summary = {
    limits: LIMITS,
    cells: results.length,
    passed: results.filter((r) => r.pass).length,
    sheets: Object.fromEntries(Object.entries(bySheet).map(([k, s]) => [k, { cells: s.cells, pass: s.pass, ssimMean: +(s.ssimSum / s.cells).toFixed(4), ssimMin: +s.ssimMin.toFixed(4), failures: s.failures }])),
    tokens: { checked: tokens.length, passed: tokens.filter((t) => t.pass).length, worstVsCulori: +Math.max(...tokens.map((t) => t.vsCulori)).toFixed(4), worstVsChrome: +Math.max(...tokens.map((t) => t.vsChrome)).toFixed(4) },
  };
  fs.writeFileSync(path.join(reportDir, 'summary.json'), JSON.stringify({ summary, tokens, results }, null, 2));
  fs.writeFileSync(path.join(reportDir, 'index.html'), report(summary, tokens, results));
  console.log(JSON.stringify(summary, null, 2));
  if (summary.passed !== summary.cells || summary.tokens.passed !== summary.tokens.checked) process.exitCode = 1;
}

const fmt = (v) => (v == null ? '—' : typeof v === 'number' ? v.toFixed(2) : v);

function report(summary, tokens, results) {
  const sw = (h) => `<span class="sw" style="background:${h}"></span>${h}`;
  const rows = results.map((r) => `<tr class="${r.pass ? '' : 'fail'}"><td><code>${r.id}</code></td>
<td><img src="crops/${r.crops}.chrome.png"></td><td><img src="crops/${r.crops}.flutter.png"></td><td><img src="crops/${r.crops}.diff.png"></td>
<td>${Object.entries(r.checks).map(([k, v]) => `<div class="${v.pass === false ? 'bad' : ''}">${k}: ${String(v.chrome).startsWith('#') ? sw(v.chrome) + ' / ' + sw(v.flutter) : fmt(v.chrome) + ' / ' + fmt(v.flutter)} <b>Δ ${fmt(v.diff)}</b>${v.pass === null ? ' <i>info</i>' : ''}</div>`).join('')}</td>
<td>${r.ssim.toFixed(3)}</td><td>${r.pass ? 'pass' : '<b>FAIL</b>'}</td></tr>`).join('\n');
  const tokenRows = tokens.map((t) => `<tr class="${t.pass ? '' : 'fail'}"><td>${t.mode}</td><td>--${t.name}</td><td><code>${t.source}</code></td><td>${sw(t.hex)}${t.alpha < 1 ? ` α${t.alpha}` : ''}</td><td>${sw(t.culori)} Δ ${t.vsCulori.toFixed(3)}</td><td>${sw(t.chrome)} Δ ${t.vsChrome.toFixed(3)}</td></tr>`).join('\n');
  const sheetRows = Object.entries(summary.sheets).map(([k, s]) => `<tr><td>${k}</td><td>${s.pass}/${s.cells}</td><td>${s.ssimMean}</td><td>${s.ssimMin}</td><td>${Object.entries(s.failures).map(([f, n]) => `${f}: ${n}`).join(', ') || '—'}</td></tr>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>scrib_ds oracle</title>
<style>body{font:13px system-ui;margin:24px;color:#222}table{border-collapse:collapse;margin-bottom:24px}td,th{border:1px solid #ddd;padding:4px 6px;vertical-align:middle;text-align:left}
img{image-rendering:pixelated;max-width:260px}.fail{background:#fff1f1}.bad{color:#b00}.sw{display:inline-block;width:10px;height:10px;border:1px solid #999;margin-right:3px;vertical-align:middle}</style>
<h1>scrib_ds visual oracle: shadcn Button, Badge, Card</h1>
<p>Chrome (real Tailwind v4 markup) vs Flutter golden, both at 2x with Inter. Gated: height, padding and radius within ±${LIMITS.px}px, background ΔE2000 &lt; ${LIMITS.deltaE}. Width, text colour and SSIM are reported only.</p>
<p><b>${summary.passed}/${summary.cells}</b> cells pass. Tokens: <b>${summary.tokens.passed}/${summary.tokens.checked}</b> (worst ΔE vs culori ${summary.tokens.worstVsCulori}, vs Chrome ${summary.tokens.worstVsChrome}).</p>
<table><tr><th>sheet</th><th>pass</th><th>SSIM mean</th><th>SSIM min</th><th>failures</th></tr>${sheetRows}</table>
<h2>Tokens</h2><table><tr><th>mode</th><th>token</th><th>source</th><th>DSIR</th><th>culori</th><th>Chrome pixel</th></tr>${tokenRows}</table>
<h2>Cells</h2><table><tr><th>cell</th><th>Chrome</th><th>Flutter</th><th>diff</th><th>checks (chrome / flutter)</th><th>SSIM</th><th></th></tr>${rows}</table>`;
}

main();
