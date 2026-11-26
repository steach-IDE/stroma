import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mine } from '../src/mine.mjs';
import { colorRef, fallbacksOf } from '../src/values.mjs';
import { infer, literalColor } from '../src/infer.mjs';
import { compare } from '../src/compare.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..', '..', '..');
const expressible = (d, v) => (d === 'state' ? v !== 'rest' : d === 'hasIcon' ? v === 'true' : true);

test('a value under an unwritable condition comes from the at-rest cells', () => {
  // px depends on size and on having an icon; only "has an icon" can be written as a condition.
  const cells = [];
  for (const [size, plain, icon] of [['md', 16, 12], ['sm', 12, 10]]) {
    for (const state of ['rest', 'disabled']) {
      cells.push({ when: { size, state, hasIcon: 'false' }, value: plain }, { when: { size, state, hasIcon: 'true' }, value: icon });
    }
  }
  const { rules, wrong } = mine(cells, ['size', 'state', 'hasIcon'], expressible);
  assert.deepEqual(wrong, []);
  // Check what the rules predict (any equivalent rule set is fine), in cascade order: a later match wins.
  const predict = (when) => rules.reduce((v, r) => (Object.entries(r.when).every(([d, x]) => when[d] === x) ? r.value : v), null);
  for (const c of cells) assert.equal(predict(c.when), c.value, JSON.stringify(c.when));
  assert.equal(rules.find((r) => r.when.size === 'md' && !r.when.hasIcon)?.value, 16, 'a written rule holds the plain value');
  assert.ok(!rules.some((r) => r.when.state), 'state does not matter, so no state rule survives');
});

test('what no rule can explain is reported, not hidden', () => {
  const cells = [{ when: { hasIcon: 'false' }, value: 1 }, { when: { hasIcon: 'true' }, value: 2 }, { when: { hasIcon: 'false' }, value: 3 }];
  assert.equal(mine(cells, ['hasIcon'], expressible).wrong.length, 1);
});

test('colour declarations become token references', () => {
  assert.deepEqual(colorRef('var(--primary)'), { token: 'primary', alpha: 1 });
  assert.deepEqual(colorRef('color-mix(in oklab, var(--primary) 90%, transparent)'), { token: 'primary', alpha: 0.9 });
  assert.deepEqual(colorRef('#0000'), { transparent: true });
  assert.equal(colorRef('#123456'), null);
  assert.deepEqual(literalColor('oklch(20.5% 0 0)'), { hex: '#171717', alpha: 1 });
  assert.deepEqual(literalColor('rgba(0, 0, 0, 0.05)'), { hex: '#000000', alpha: 0.05 });
  assert.throws(() => literalColor('lab(50 0 0)'), /can't read/);
});

test('the example extraction gives a valid DSIR that explains every value and matches the source', async () => {
  const { extract } = await import(path.join(repo, 'packages', 'extractor', 'src', 'extract.mjs'));
  const storybook = path.join(repo, 'examples', 'shadcn-neutral', 'storybook', 'storybook-static');
  const extraction = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'stroma-infer-')), 'x');
  // Every story, so every component is known (a component left out would be read as a part of another),
  // narrowed to one variant combination to stay quick.
  await extract({ storybook, out: extraction, where: { variant: 'default', size: 'default' } });
  const a = infer({ extraction, license: 'MIT', source: 'test' });
  const b = infer({ extraction, license: 'MIT', source: 'test' });
  assert.equal(JSON.stringify(a.dsir), JSON.stringify(b.dsir), 'deterministic');
  assert.equal(a.report.fit.percent, 100);
  assert.deepEqual(a.dsir.components.find((c) => c.name === 'Card').anatomy.children, ['card-header', 'card-content', 'card-footer']);
  const header = a.dsir.components.find((c) => c.name === 'CardHeader');
  assert.deepEqual(header.rules.find((r) => r.when.hasSlot === 'card-action')?.set.columns, ['1fr', 'auto']);
  const source = JSON.parse(fs.readFileSync(path.join(repo, 'examples', 'shadcn-neutral', 'design-system', 'shadcn.dsir.json'), 'utf8'));
  const vs = compare(a.dsir, source).components;
  assert.ok(vs.Button.variantsMatch && vs.Button.defaultsMatch && vs.Badge.variantsMatch);
  assert.deepEqual(vs.Card.colourTokens.sourceOnly, [], "every colour token the source's Card uses was recovered");
});

test('var(--name, fallback) is the token `name`, and its fallback is the value when no theme defines it', () => {
  assert.deepEqual(colorRef('var(--cds-button-primary,#0f62fe)'), { token: 'cds-button-primary', alpha: 1 });
  assert.deepEqual(colorRef('var(--cds-layer)'), { token: 'cds-layer', alpha: 1 });
  const rules = [{ decls: [['background-color', 'var(--cds-button-primary,#0f62fe)'], ['color', 'var(--cds-text, rgba(0, 0, 0, .5))']] }];
  assert.deepEqual([...fallbacksOf(rules)], [['cds-button-primary', '#0f62fe'], ['cds-text', 'rgba(0, 0, 0, .5)']]);
});

test('a root with no data-* marker is a component named by its block class, and its theme names are its modes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stroma-infer-'));
  const cells = [];
  for (const theme of ['white', 'g100']) {
    const file = `x--default/theme=${theme},state=rest.json`;
    fs.mkdirSync(path.join(dir, 'x--default'), { recursive: true });
    const bg = theme === 'white' ? 'rgb(255, 255, 255)' : 'rgb(22, 22, 22)';
    fs.writeFileSync(path.join(dir, file), JSON.stringify({ story: 'x--default', theme, args: {}, state: 'rest', elements: [{
      tag: 'div', parent: -1, role: null, attrs: { class: 'ds--box ds--box--wide' }, text: '', box: { x: 0, y: 0, w: 10, h: 10 },
      style: { 'background-color': bg, color: 'rgb(0, 0, 0)', 'border-top-color': 'rgb(0, 0, 0)', 'font-family': 'Plex', 'padding-left': '0px', 'padding-top': '0px' },
      rules: [{ selector: '.ds--box', at: [], decls: [['background-color', 'var(--ds-layer,#ffffff)']] }],
      vars: { '--ds-layer': bg },
    }] }));
    cells.push({ story: 'x--default', theme, args: {}, state: 'rest', file });
  }
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ stories: {}, cells }));
  const { dsir } = infer({ extraction: dir, license: 'Apache-2.0', source: 'test' });
  assert.deepEqual(dsir.components.map((c) => [c.name, c.slot]), [['Box', 'ds--box']]);
  assert.deepEqual(Object.keys(dsir.tokens.color['ds-layer']).sort(), ['g100', 'white']);
});

test('intent loss on shadcn: colour tokens and radius values survive, radius names and class names do not', async () => {
  const { execFileSync } = await import('node:child_process');
  const out = execFileSync(process.execPath, [
    path.join(here, '..', 'bin', 'intent-loss.mjs'),
    '--inferred', path.join(repo, 'examples', 'shadcn-neutral', 'inferred', 'shadcn.dsir.json'),
    '--source', path.join(repo, 'examples', 'shadcn-neutral', 'design-system', 'shadcn.dsir.json'),
  ], { encoding: 'utf8' });
  assert.match(out, /colour tokens a component uses, recovered by name\s+23\/23 \(100%\)/);
  assert.match(out, /radius references, same value in px\s+6\/6 \(100%\)/);
  assert.match(out, /radius references, same token name\s+0\/6 \(0%\)/);
});

test('a token whose value depends on a variant, not only the mode, is written as the literal colours it was', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stroma-infer-'));
  const cells = [];
  for (const [color, bg] of [['red', 'rgb(255, 0, 0)'], ['blue', 'rgb(0, 0, 255)']]) {
    const file = `x--default/theme=light,color=${color},state=rest.json`;
    fs.mkdirSync(path.join(dir, 'x--default'), { recursive: true });
    fs.writeFileSync(path.join(dir, file), JSON.stringify({ story: 'x--default', theme: 'light', args: { color }, state: 'rest', elements: [{
      tag: 'div', parent: -1, role: null, attrs: { class: 'ds-box' }, text: '', box: { x: 0, y: 0, w: 10, h: 10 },
      style: { 'background-color': bg, color: 'rgb(0, 0, 0)', 'border-top-color': 'rgb(0, 0, 0)', 'font-family': 'Plex', 'padding-left': '0px', 'padding-top': '0px' },
      rules: [{ selector: '.ds-box', at: [], decls: [['background-color', 'var(--ds-fill)']] }],
      vars: { '--ds-fill': bg },
    }] }));
    cells.push({ story: 'x--default', theme: 'light', args: { color }, state: 'rest', file });
  }
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ stories: { 'x--default': { axes: { color: ['red', 'blue'] }, defaults: { color: 'red' }, themes: ['light'], title: 'X', name: 'Default' } }, cells }));
  const { dsir, report } = infer({ extraction: dir, license: 'MIT', source: 'test' });
  assert.deepEqual(dsir.components[0].unsupported, []);
  assert.deepEqual(dsir.tokens.color, {});
  const bgs = dsir.components[0].rules.flatMap((r) => (r.set.bg ? [[r.when.color ?? 'base', r.set.bg.hex]] : []));
  // Which colour is the base rule and which the override is the miner's choice; both must be there, as literals.
  assert.deepEqual(bgs.map(([, hex]) => hex).sort(), ['#0000ff', '#ff0000']);
  assert.deepEqual(report.writtenAsLiterals, ['ds-fill']);
});
