// Checks the built Storybook the way the extractor (feat-005) will read it: its index, the argTypes from
// Storybook's own story store, and a real render in headless Chromium. Run after `pnpm run build-storybook`.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const built = path.join(root, 'storybook-static');
const enricher = path.join(root, '..', '..', '..', 'packages', 'enricher-shadcn');
const { parseComponentFile } = await import(path.join(enricher, 'ingest.mjs'));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.png': 'image/png' };
let server;
let base;
let browser;

before(async () => {
  assert.ok(fs.existsSync(path.join(built, 'index.json')), 'run `pnpm run build-storybook` first');
  server = http.createServer((req, res) => {
    const file = path.join(built, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(built) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.close();
});

test('the index lists the Button, Badge and Card stories', () => {
  const index = JSON.parse(fs.readFileSync(path.join(built, 'index.json'), 'utf8'));
  const stories = Object.values(index.entries).filter((e) => e.type === 'story').map((e) => e.id).sort();
  assert.deepEqual(stories, [
    'badge--as-link', 'badge--default',
    'button--default', 'button--icon-only',
    'card--content-only', 'card--full', 'card--with-action',
  ]);
});

test("the story controls are the registry's cva variants", async () => {
  const page = await browser.newPage();
  await page.goto(`${base}/iframe.html?id=button--default&viewMode=story`);
  const argTypes = await page.evaluate(async () => {
    const preview = window.__STORYBOOK_PREVIEW__;
    await preview.ready();
    const read = async (storyId) => {
      const story = await preview.storyStore.loadStory({ storyId });
      return Object.fromEntries(Object.entries(story.argTypes).filter(([, t]) => t.options).map(([k, t]) => [k, t.options]));
    };
    return { button: await read('button--default'), badge: await read('badge--default') };
  });
  await page.close();
  for (const name of ['button', 'badge']) {
    const source = JSON.parse(fs.readFileSync(path.join(enricher, 'sources', `${name}.json`), 'utf8')).files[0].content;
    const cva = parseComponentFile(source).cva[0].config.variants;
    const expected = Object.fromEntries(Object.entries(cva).map(([axis, o]) => [axis, Object.keys(o)]));
    assert.deepEqual(argTypes[name], expected, `${name} controls`);
  }
});

for (const theme of ['light', 'dark']) {
  test(`the default button renders in the ${theme} theme with the pinned Inter`, async () => {
    const page = await browser.newPage();
    await page.goto(`${base}/iframe.html?id=button--default&viewMode=story&globals=theme:${theme}`);
    const button = page.locator('button[data-slot=button]');
    await button.waitFor();
    const seen = await page.evaluate(async () => {
      await document.fonts.ready;
      const el = document.querySelector('button[data-slot=button]');
      return {
        dark: document.documentElement.classList.contains('dark'),
        inter: document.fonts.check('500 14px Inter'),
        family: getComputedStyle(el).fontFamily,
        text: el.textContent,
      };
    });
    await page.close();
    assert.equal(seen.dark, theme === 'dark');
    assert.ok(seen.inter, 'Inter 500 is loaded');
    assert.match(seen.family, /^Inter/);
    assert.equal(seen.text, 'Button');
  });
}

test('the sync check fails when a component no longer matches the registry', () => {
  const file = path.join(root, 'src', 'components', 'ui', 'badge.tsx');
  const original = fs.readFileSync(file, 'utf8');
  try {
    fs.writeFileSync(file, original.replace('rounded-full', 'rounded-md'));
    const run = spawnSync(process.execPath, ['scripts/sync.mjs', '--check'], { cwd: root, encoding: 'utf8' });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /stale: src\/components\/ui\/badge\.tsx/);
  } finally {
    fs.writeFileSync(file, original);
  }
  assert.equal(spawnSync(process.execPath, ['scripts/sync.mjs', '--check'], { cwd: root }).status, 0);
});
