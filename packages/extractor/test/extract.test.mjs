import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { extract } from '../src/extract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const example = path.join(here, '..', '..', '..', 'examples', 'shadcn-neutral', 'storybook');
const storybook = path.join(example, 'storybook-static');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'stroma-extract-'));
const read = (dir, rel) => JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8'));

before(() => {
  // The example Storybook is this package's real input; build it if this checkout hasn't yet.
  if (fs.existsSync(path.join(storybook, 'index.json'))) return;
  for (const args of [['install', '--frozen-lockfile'], ['run', 'build-storybook']]) {
    const run = spawnSync('pnpm', args, { cwd: example, stdio: 'inherit', env: { ...process.env, STORYBOOK_DISABLE_TELEMETRY: '1' } });
    assert.equal(run.status, 0, `pnpm ${args.join(' ')} in the example Storybook`);
  }
});

test('two runs write byte-identical cells, one per variant x state x theme', async () => {
  const [a, b] = [path.join(tmp(), 'out'), path.join(tmp(), 'out')];
  const stories = ['badge--as-link', 'card--full'];
  const first = await extract({ storybook, out: a, stories });
  await extract({ storybook, out: b, stories });
  // The link badge: 6 variants x rest/hovered/focused x light/dark. The card is not interactive: rest x 2 themes.
  assert.deepEqual(first, { stories: 2, cells: 6 * 3 * 2 + 2 });
  const files = (dir) => fs.readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.json') || f.endsWith('.png')).sort();
  assert.deepEqual(files(a), files(b));
  // Cell files and the image of each cell (what Chrome drew) are byte-identical across runs.
  for (const f of files(a)) assert.ok(fs.readFileSync(path.join(a, f)).equals(fs.readFileSync(path.join(b, f))), f);
  assert.equal(files(a).filter((f) => f.endsWith('.png')).length, first.cells, 'one image per cell');
  const story = read(a, 'index.json').stories['badge--as-link'];
  assert.deepEqual(story.defaults, { variant: 'default' });
  assert.deepEqual(story.themes, ['light', 'dark']);
  // The image is the root's box plus a 6 px margin, at 2x.
  const png = fs.readFileSync(path.join(a, 'badge--as-link/theme=dark,variant=secondary,state=hovered.png'));
  const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)];
  const box = read(a, 'badge--as-link/theme=dark,variant=secondary,state=hovered.json').elements[0].box;
  assert.ok(Math.abs(w - (box.w + 12) * 2) <= 2 && Math.abs(h - (box.h + 12) * 2) <= 2, `image ${w}x${h} for a ${box.w}x${box.h} box`);
  const cell = read(a, 'badge--as-link/theme=dark,variant=secondary,state=hovered.json');
  assert.equal(cell.elements[0].attrs['data-variant'], 'secondary');
  assert.equal(cell.elements[0].role, 'link');
});

test("matched rules keep var() and the variable's value is recorded", async () => {
  const out = path.join(tmp(), 'out');
  await extract({ storybook, out, stories: ['button--default'], where: { variant: 'default', size: 'default' } });
  const rest = read(out, 'button--default/theme=light,size=default,variant=default,state=rest.json').elements[0];
  const bg = rest.rules.find((r) => r.selector === '.bg-primary');
  assert.deepEqual(bg?.decls, [['background-color', 'var(--primary)']]);
  assert.match(rest.vars['--primary'], /^oklch\(/);
  const hovered = read(out, 'button--default/theme=light,size=default,variant=default,state=hovered.json').elements[0];
  assert.notEqual(hovered.style['background-color'], rest.style['background-color'], 'hover:bg-primary/90 applies');
  assert.ok(fs.existsSync(path.join(out, 'button--default/theme=light,size=default,variant=default,state=disabled.json')));
});

test('a story without a marked component root fails, naming the story', async () => {
  // A minimal stand-in for a Storybook build: the preview API the extractor uses, and a root with no data-slot.
  const fake = tmp();
  fs.writeFileSync(path.join(fake, 'index.json'), JSON.stringify({ v: 5, entries: { 'plain--default': { type: 'story', id: 'plain--default' } } }));
  fs.writeFileSync(path.join(fake, 'iframe.html'), `<!doctype html><div id="storybook-root"><div>no marker</div></div>
<script>window.__STORYBOOK_PREVIEW__ = { ready: async () => {}, storyStore: {
  loadStory: async () => ({ title: 'Plain', name: 'Default', argTypes: {} }), projectAnnotations: {}, args: { get: () => ({}) } } };</script>`);
  await assert.rejects(extract({ storybook: fake, out: path.join(tmp(), 'out') }), /plain--default: no component root/);
});

test('--root finds a root that has no data-* marker, and fails naming the story when nothing matches', async () => {
  const fake = tmp();
  fs.writeFileSync(path.join(fake, 'index.json'), JSON.stringify({ v: 5, entries: { 'plain--default': { type: 'story', id: 'plain--default' } } }));
  fs.writeFileSync(path.join(fake, 'iframe.html'), `<!doctype html><div id="storybook-root"><div class="ds-box">no marker</div></div>
<script>window.__STORYBOOK_PREVIEW__ = { ready: async () => {}, storyStore: {
  loadStory: async () => ({ title: 'Plain', name: 'Default', argTypes: {} }), projectAnnotations: {}, args: { get: () => ({}) } } };</script>`);
  await assert.rejects(extract({ storybook: fake, out: path.join(tmp(), 'out'), root: '.nothing' }), /plain--default: no component root.*nothing matches \.nothing/);
  const out = path.join(tmp(), 'out');
  const { cells } = await extract({ storybook: fake, out, root: '.other, .ds-box' });
  assert.equal(cells, 1);
  assert.equal(read(out, 'plain--default/state=rest.json').elements[0].tag, 'div');
});

test('a request outside the Storybook is blocked, and listed in index.json', async () => {
  const fake = tmp();
  fs.writeFileSync(path.join(fake, 'index.json'), JSON.stringify({ v: 5, entries: { 'plain--default': { type: 'story', id: 'plain--default' } } }));
  fs.writeFileSync(path.join(fake, 'iframe.html'), `<!doctype html><link rel="stylesheet" href="http://127.0.0.1:9/outside.css">
<div id="storybook-root"><div data-slot="x">x</div></div>
<script>window.__STORYBOOK_PREVIEW__ = { ready: async () => {}, storyStore: {
  loadStory: async () => ({ title: 'Plain', name: 'Default', argTypes: {} }), projectAnnotations: {}, args: { get: () => ({}) } } };</script>`);
  const out = path.join(tmp(), 'out');
  await extract({ storybook: fake, out });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out, 'index.json'), 'utf8')).blocked, ['http://127.0.0.1:9/outside.css']);
});

test('a rule inserted through the CSS object model (CSS-in-JS) is recorded with its declarations', async () => {
  const fake = tmp();
  fs.writeFileSync(path.join(fake, 'index.json'), JSON.stringify({ v: 5, entries: { 'plain--default': { type: 'story', id: 'plain--default' } } }));
  fs.writeFileSync(path.join(fake, 'iframe.html'), `<!doctype html><style id="s"></style>
<div id="storybook-root"><div class="css-abc" data-slot="x">x</div></div>
<script>document.getElementById('s').sheet.insertRule('.css-abc { background-color: #1976d2; padding: 6px 16px; }');
window.__STORYBOOK_PREVIEW__ = { ready: async () => {}, storyStore: {
  loadStory: async () => ({ title: 'Plain', name: 'Default', argTypes: {} }), projectAnnotations: {}, args: { get: () => ({}) } } };</script>`);
  const out = path.join(tmp(), 'out');
  await extract({ storybook: fake, out });
  const rules = read(out, 'plain--default/state=rest.json').elements[0].rules;
  const decls = rules.flatMap((r) => r.decls);
  assert.ok(decls.some(([n, v]) => n === 'background-color' && v === 'rgb(25, 118, 210)'), JSON.stringify(rules));
  assert.ok(decls.some(([n]) => n === 'padding'), 'the shorthand as written is kept');
});

test('it refuses to write into a directory that already holds files', async () => {
  const out = tmp();
  fs.writeFileSync(path.join(out, 'old.json'), '{}');
  await assert.rejects(extract({ storybook, out, stories: ['card--full'] }), /is not empty/);
});
