// Checks the built Storybook the way the extractor reads it: its index, the argTypes from Storybook's own
// story store, and a render with a root the extractor can find without any data-* marker.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { serveStatic } from '../../../../packages/extractor/src/serve.mjs';

const built = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'storybook-static');
let server;
let browser;

before(async () => {
  assert.ok(fs.existsSync(path.join(built, 'index.json')), 'run `pnpm run build-storybook` first');
  server = await serveStatic(built);
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await server?.close?.();
});

test('the index lists the Button, Tag and Tile stories', () => {
  const index = JSON.parse(fs.readFileSync(path.join(built, 'index.json'), 'utf8'));
  const ids = Object.values(index.entries).filter((e) => e.type === 'story').map((e) => e.id).sort();
  assert.deepEqual(ids, ['button--default', 'tag--read-only', 'tile--clickable', 'tile--default']);
});

test('the controls are Carbon\'s own axes, and each story renders a Carbon root', async () => {
  const page = await browser.newPage();
  const seen = {};
  for (const id of ['button--default', 'tag--read-only', 'tile--default', 'tile--clickable']) {
    await page.goto(`${server.url}/iframe.html?id=${id}&viewMode=story`);
    seen[id] = await page.evaluate(async (storyId) => {
      const preview = window.__STORYBOOK_PREVIEW__;
      await preview.ready();
      const story = await preview.storyStore.loadStory({ storyId });
      return Object.fromEntries(Object.entries(story.argTypes).filter(([, t]) => t.options).map(([k, t]) => [k, t.options]));
    }, id);
    await page.locator('#storybook-root :is(.cds--btn, .cds--tag, .cds--tile)').first().waitFor({ timeout: 10_000 });
  }
  assert.deepEqual(seen['button--default'].kind, ['primary', 'secondary', 'tertiary', 'ghost', 'danger', 'danger--tertiary', 'danger--ghost']);
  assert.deepEqual(seen['button--default'].size, ['xs', 'sm', 'md', 'lg', 'xl', '2xl']);
  assert.deepEqual(seen['tag--read-only'].size, ['sm', 'md', 'lg']);
  assert.equal(seen['tag--read-only'].type.length, 8);
  assert.deepEqual(seen['tile--default'], {});
  await page.close();
});
