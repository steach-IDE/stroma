import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { differenceCiede2000, parse, toGamut } from 'culori';
import { ingest } from '../ingest.mjs';
import { oklchToSrgb, hex } from '../oklch.mjs';
import { mapClasses, loadTailwindTheme } from '../tailwind.mjs';

const ctx = { theme: loadTailwindTheme(), tokens: new Set(['primary']), order: new Map([['bg-primary', 1n]]) };

test('every theme colour matches culori within deltaE2000 < 1', () => {
  const { cssVarsV4 } = JSON.parse(fs.readFileSync(new URL('../sources/colors-neutral.json', import.meta.url)));
  const de = differenceCiede2000();
  for (const mode of ['light', 'dark']) {
    for (const [name, value] of Object.entries(cssVarsV4[mode])) {
      if (!value.startsWith('oklch(')) continue;
      const ref = toGamut('rgb', 'oklch')(parse(value));
      const d = de(parse(hex(oklchToSrgb(value))), { ...ref, alpha: 1 });
      assert.ok(d < 1, `${mode}.${name}: deltaE ${d}`);
    }
  }
});

test('an out-of-gamut colour is gamut-mapped and flagged', () => {
  const c = oklchToSrgb('oklch(0.577 0.245 27.325)');
  assert.equal(hex(c), '#e7000b');
  assert.equal(c.clamped, true);
});

test('an unknown Tailwind class fails instead of being dropped', () => {
  assert.throws(() => mapClasses('bg-primary skew-x-12', ctx), /unmapped Tailwind class "skew-x-12"/);
  assert.throws(() => mapClasses('peer-hover:bg-primary', ctx), /unmapped Tailwind variant "peer-hover"/);
});

test('tailwind-merge removes the base ring colour where a variant overrides it', async () => {
  const dsir = JSON.parse((await ingest())['shadcn.dsir.json']);
  const button = dsir.components.find((c) => c.name === 'Button');
  const ring = button.rules.find((r) => r.from === 'focus-visible:ring-ring/50');
  assert.deepEqual(ring.except, [{ variant: 'destructive' }]);
});

test('ingest is byte-identical across runs and matches the committed dsir/', async () => {
  const [a, b] = [await ingest(), await ingest()];
  assert.deepEqual(a, b);
  for (const [rel, content] of Object.entries(a)) {
    assert.equal(fs.readFileSync(new URL(`../../../examples/shadcn-neutral/design-system/${rel}`, import.meta.url), 'utf8'), content, `design-system/${rel} is stale`);
  }
});
