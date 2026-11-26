import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validate } from '../src/validate.mjs';
import { migrate01to02 } from '../src/migrate.mjs';

const fixturePath = fileURLToPath(new URL('../fixtures/shadcn/shadcn.dsir.json', import.meta.url));
const fixture = () => JSON.parse(readFileSync(fixturePath, 'utf8'));
const buttonRule = (doc, from) => doc.components[0].rules.findIndex((r) => r.from === from);
const only = (errors, path) => {
  assert.equal(errors.length, 1, JSON.stringify(errors, null, 2));
  assert.equal(errors[0].path, path);
  return errors[0].message;
};

test('the shadcn fixture (Button, Badge, Card and its parts) is valid', () => {
  const doc = fixture();
  assert.deepEqual(validate(doc), []);
  assert.deepEqual(doc.components.map((c) => c.name).slice(0, 3), ['Button', 'Badge', 'Card']);
});

test('an unknown style key is rejected, never ignored', () => {
  const doc = fixture();
  const i = buttonRule(doc, 'h-9');
  doc.components[0].rules[i].set.mixBlend = 'multiply';
  assert.match(only(validate(doc), `/components/0/rules/${i}/set`), /unknown key "mixBlend"/);
});

test('a rule without provenance is rejected', () => {
  const doc = fixture();
  delete doc.components[1].rules[0].provenance;
  assert.match(only(validate(doc), '/components/1/rules/0'), /missing "provenance"/);
});

test('an unknown behaviour pattern is rejected', () => {
  const doc = fixture();
  doc.components[0].behaviour = 'clicky';
  assert.match(only(validate(doc), '/components/0/behaviour'), /must be one of/);
});

test('a DSIR that is not 0.2.x is rejected', () => {
  const doc = fixture();
  doc.dsirVersion = '0.1.0';
  assert.match(only(validate(doc), '/dsirVersion'), /must match pattern/);
});

test('a variant value the component does not declare is rejected', () => {
  const doc = fixture();
  const i = buttonRule(doc, 'h-9');
  doc.components[0].rules[i].when.size = 'huge';
  assert.match(only(validate(doc), `/components/0/rules/${i}/when/size`), /"huge" is not an option of "size"/);
});

test('a misspelt condition is caught as an unknown variant axis', () => {
  const doc = fixture();
  doc.components[0].rules[0].when.mdoe = 'dark';
  assert.match(only(validate(doc), '/components/0/rules/0/when/mdoe'), /not a variant axis/);
});

test('a colour token that does not exist is rejected', () => {
  const doc = fixture();
  const i = buttonRule(doc, 'bg-primary');
  doc.components[0].rules[i].set.bg.token = 'primray';
  assert.match(only(validate(doc), `/components/0/rules/${i}/set/bg/token`), /unknown colour token "primray"/);
});

test('migration from 0.1 adds provenance and behaviour, and is deterministic', () => {
  const v02 = fixture();
  const v01 = {
    ...v02,
    dsirVersion: '0.1.0',
    globals: Object.fromEntries(Object.entries(v02.globals).map(([k, g]) => [k, { ...g, rules: g.rules.map(({ provenance, ...r }) => r) }])),
    components: v02.components.map(({ rules, ...c }) => ({ ...c, behaviour: null, rules: rules.map(({ provenance, ...r }) => r) })),
  };
  const a = migrate01to02(v01);
  assert.deepEqual(validate(a), []);
  assert.equal(JSON.stringify(a), JSON.stringify(migrate01to02(v01)));
  assert.deepEqual(a, v02);
  assert.throws(() => migrate01to02(v02), /expected a DSIR 0.1.x/);
});

test('the CLI exits 0 on a valid file and 1 with the path on a broken one', () => {
  const cli = fileURLToPath(new URL('../bin/validate.mjs', import.meta.url));
  assert.equal(spawnSync(process.execPath, [cli, fixturePath]).status, 0);
  const doc = fixture();
  doc.components[0].behaviour = 'clicky';
  const broken = join(mkdtempSync(join(tmpdir(), 'dsir-')), 'broken.dsir.json');
  writeFileSync(broken, JSON.stringify(doc));
  const run = spawnSync(process.execPath, [cli, broken], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /\/components\/0\/behaviour: must be one of/);
});
