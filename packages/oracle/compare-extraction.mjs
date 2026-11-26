// Compares a generated package's Flutter cells with an extraction (packages/extractor): what Chrome drew for the
// design system's own Storybook, cell by cell. Used where there is no Chrome reference sheet, as for Carbon.
//   node compare-extraction.mjs --extraction <dir> --dsir <file> --package <dir> [--out <summary.json>]
// Gated, as in compare.mjs: height, padding and corner radius within 1 px, background within dE2000 2, and the text
// colour within dE2000 5 (the glyph pixel furthest from the background, Chrome's image of the cell against Flutter's
// golden: thin glyphs antialias differently in the two engines, so the tolerance is wider than for a flat fill).
// Chrome's numbers are its computed styles and, from `<cell>.png`, its pixels; Flutter's are its geometry and the
// golden's pixels. Width and SSIM are reported only.
// A failing cell is never hidden: the summary lists each group of failures with a measured and an expected value.
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { LIMITS, S, crop, deltaE, glyph, hex, pixel, radius, sample, ssim } from './pixels.mjs';
import { CROP_MARGIN } from '../extractor/src/crop.mjs';
import { blockOf, literalColor } from '../infer/src/infer.mjs';
import { pageTokenNames } from '../dsir/src/page.mjs';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const extraction = arg('extraction');
const dsirPath = arg('dsir');
const pkg = arg('package');
if (!extraction || !dsirPath || !pkg) {
  console.error('usage: compare-extraction.mjs --extraction <dir> --dsir <file> --package <dir> [--out <summary.json>]');
  process.exit(2);
}
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const dsir = readJson(dsirPath);
const index = readJson(path.join(extraction, 'index.json'));
const flutterDir = path.join(pkg, 'build', 'oracle', 'flutter');
const goldenDir = path.join(pkg, 'test', 'goldens');

/** Text colour tolerance, dE2000. */
const TEXT_DE = 5;
const px = (v) => (typeof v === 'string' && v.endsWith('px') ? Number.parseFloat(v) : null);
const components = Object.fromEntries(dsir.components.map((c) => [c.slot, c]));
const usesInteractive = (c) => c.rules.some((r) => r.when.interactive);

// The page the Flutter sheet paints: the DSIR's `tokens.page` when it has one, else the token the emitter finds by name.
const page = (mode) => {
  const colour = dsir.tokens.page?.background[mode] ?? dsir.tokens.color[pageTokenNames(dsir.tokens.color).background]?.[mode];
  if (!colour) throw new Error(`the DSIR names no page background for mode ${mode}`);
  return [1, 3, 5].map((i) => Number.parseInt(colour.hex.slice(i, i + 2), 16));
};

/** A computed colour (any format inference reads: rgb, oklch, hex) painted over the page, as the Flutter sheet paints it. */
function composite(css, under, opacity = 1) {
  const { hex: h, alpha: own } = literalColor(css);
  const alpha = own * opacity; // an element's opacity (a disabled button's) fades its background too
  const rgb = [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
  return rgb.map((c, i) => c * alpha + under[i] * (1 - alpha));
}

// Which sheet draws which cell is the package's own record (large components are split over several sheets).
const sheetOf = Object.fromEntries(readJson(path.join(pkg, 'test', 'oracle', 'cells.json')).map((c) => [c.id, `${c.sheet}.${c.mode}`]));
const nodeOf = Object.fromEntries(readJson(path.join(pkg, 'test', 'oracle', 'cells.json')).map((c) => [c.id, c.node]));
const goldens = {};
const png = (sheet) => (goldens[sheet] ??= PNG.sync.read(fs.readFileSync(path.join(goldenDir, `${sheet}.png`))));
const geometry = {};
const flutter = (sheet) => (geometry[sheet] ??= readJson(path.join(flutterDir, `${sheet}.json`)));

const results = [];
const skipped = [];
const seen = new Set();
for (const cell of index.cells) {
  const data = readJson(path.join(extraction, cell.file));
  const root = data.elements[0];
  const slot = root.attrs['data-slot'] ?? root.attrs['data-part'] ?? root.attrs['data-scope'] ?? blockOf(root.attrs.class ?? '');
  const comp = components[slot];
  const name = comp.name.toLowerCase(); // the DSIR's name (overrides may have renamed what inference called it)
  const values = Object.keys(comp.variants).map((axis) => cell.args[axis]);
  const id = `${name}.${[...values, cell.state].join('.')}.${cell.theme}`;
  // One DSIR component can stand for two stories (a tile and a clickable tile): the one whose cells the
  // Flutter widget draws for this state is the one with the matching interactivity.
  if (usesInteractive(comp) && (root.role === 'link') !== (cell.state !== 'rest')) {
    skipped.push({ id, story: cell.story, why: 'the story is not interactive in the way the Flutter cell for this state is' });
    continue;
  }
  // A Flutter cell is matched to the story that draws the same thing: one with an icon only for a cell with an icon.
  const hasIcon = data.elements.some((e, i) => i > 0 && e.tag === 'svg' && e.parent === 0);
  if (id in nodeOf && (nodeOf[id].icon === true) !== hasIcon) {
    skipped.push({ id, story: cell.story, why: `the story ${hasIcon ? 'draws' : 'draws no'} icon, the Flutter cell ${hasIcon ? 'has none' : 'has one'}` });
    continue;
  }
  if (seen.has(id)) { skipped.push({ id, story: cell.story, why: 'another story already drew this cell' }); continue; }
  const sheet = sheetOf[id];
  const f = sheet ? flutter(sheet).cells[id] : null;
  if (!f) { skipped.push({ id, story: cell.story, why: 'Flutter draws no such cell' }); continue; }

  const checks = {};
  const add = (key, expected, got, limit, gate = true) => {
    const diff = expected == null || got == null ? null : Math.abs(expected - got);
    checks[key] = { chrome: expected, flutter: got, diff, pass: !gate || diff == null ? null : diff <= limit };
  };
  add('height', root.box.h, f.box.h, LIMITS.px);
  add('width', root.box.w, f.box.w, LIMITS.px, false);
  const first = f.text ?? f.icon;
  // Where the content starts: the border and the padding (Carbon's button is a 1px border plus 15px of padding).
  // An icon-only button centres its icon, so the content starts where the icon's own box does, not at the padding.
  const svgChild = data.elements.findIndex((e, i) => i > 0 && e.tag === 'svg' && e.parent === 0);
  const inset = svgChild >= 0 && !root.text ? data.elements[svgChild].box.x - root.box.x : px(root.style['border-left-width']) + px(root.style['padding-left']);
  add('padLeft', inset, first ? first.x - f.box.x : null, LIMITS.px);

  const under = page(cell.theme);
  const expectedBg = composite(root.style['background-color'], under, Number(root.style.opacity ?? 1));
  const fp = png(sheet);
  const fbg = sample(fp, (f.box.x + 3) * S, (f.box.y + f.box.h / 2) * S);
  const de = deltaE(expectedBg, fbg);
  checks.background = { chrome: hex(expectedBg), flutter: hex(fbg), diff: de, pass: de < LIMITS.deltaE };
  if (cell.state === 'rest') {
    // Chrome clamps a radius to half the shorter side; the pixel measurement sees the clamped corner.
    const r = px(root.style['border-top-left-radius']);
    add('radius', r == null ? null : Math.min(r, root.box.h / 2, root.box.w / 2), radius(fp, f.box, fbg), LIMITS.px);
  }
  seen.add(id);
  // Pixels: Chrome's image of the cell against the same region of Flutter's golden.
  const cropFile = path.join(extraction, cell.file.replace(/\.json$/, '.png'));
  if (fs.existsSync(cropFile)) {
    const chrome = PNG.sync.read(fs.readFileSync(cropFile));
    const flutterCrop = crop(fp, f.box, CROP_MARGIN);
    const score = ssim(chrome, flutterCrop);
    checks.ssim = { chrome: 1, flutter: Number(score.toFixed(4)), diff: Number((1 - score).toFixed(4)), pass: null };
    if (f.text) {
      const offset = { x: CROP_MARGIN - f.box.x, y: CROP_MARGIN - f.box.y };
      const bgChrome = pixel(chrome, (CROP_MARGIN + 3) * S, (CROP_MARGIN + f.box.h / 2) * S);
      const [gc, gf] = [glyph(chrome, { x: f.text.x + offset.x, y: f.text.y + offset.y, w: f.text.w, h: f.text.h }, bgChrome), glyph(fp, f.text, fbg)];
      const dt = deltaE(gc, gf);
      checks.textColor = { chrome: hex(gc), flutter: hex(gf), diff: dt, pass: dt < TEXT_DE };
    }
  }
  results.push({ id, story: cell.story, state: cell.state, checks, pass: Object.values(checks).every((k) => k.pass !== false) });
}

// Failures, grouped by component and check, each with its worst cell.
const groups = {};
for (const r of results.filter((x) => !x.pass)) {
  for (const [key, v] of Object.entries(r.checks)) {
    if (v.pass !== false) continue;
    const g = (groups[`${r.id.split('.')[0]} ${key}`] ??= { count: 0, worst: null });
    g.count++;
    if (!g.worst || v.diff > g.worst.diff) g.worst = { id: r.id, chrome: v.chrome, flutter: v.flutter, diff: v.diff };
  }
}
const ssims = results.map((r) => r.checks.ssim?.flutter).filter((v) => v != null);
const summary = {
  textColorLimit: TEXT_DE,
  ssim: ssims.length ? { cells: ssims.length, mean: Number((ssims.reduce((a, b) => a + b, 0) / ssims.length).toFixed(4)), min: Math.min(...ssims) } : null,
  limits: LIMITS,
  cells: results.length,
  passed: results.filter((r) => r.pass).length,
  skipped: skipped.length,
  byComponent: Object.fromEntries([...new Set(results.map((r) => r.id.split('.')[0]))].sort().map((c) => {
    const rs = results.filter((r) => r.id.startsWith(`${c}.`));
    const ss = rs.map((r) => r.checks.ssim?.flutter).filter((v) => v != null);
    return [c, { cells: rs.length, pass: rs.filter((r) => r.pass).length, ...(ss.length ? { ssimMean: Number((ss.reduce((a, b) => a + b, 0) / ss.length).toFixed(4)), ssimMin: Math.min(...ss) } : {}) }];
  })),
  failures: groups,
};
const out = arg('out');
if (out) fs.writeFileSync(out, JSON.stringify({ summary, skipped, results }, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
if (summary.passed !== summary.cells) process.exitCode = 1;
