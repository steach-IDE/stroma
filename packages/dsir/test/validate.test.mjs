import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validate } from '../src/validate.mjs';
import { migrate, migrate01to02, migrate02to03 } from '../src/migrate.mjs';

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

test('a DSIR that is not 0.3.x is rejected', () => {
  const doc = fixture();
  doc.dsirVersion = '0.2.0';
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

test('migration from 0.1 adds provenance and behaviour, reaches 0.3, and is deterministic', () => {
  const v03 = fixture();
  const v01 = {
    ...v03,
    dsirVersion: '0.1.0',
    globals: Object.fromEntries(Object.entries(v03.globals).map(([k, g]) => [k, { ...g, rules: g.rules.map(({ provenance, ...r }) => r) }])),
    components: v03.components.map(({ rules, ...c }) => ({ ...c, behaviour: null, rules: rules.map(({ provenance, ...r }) => r) })),
  };
  const a = migrate(v01);
  assert.deepEqual(validate(a), []);
  assert.equal(JSON.stringify(a), JSON.stringify(migrate(v01)));
  assert.deepEqual(a, v03);
  assert.equal(migrate01to02(v01).dsirVersion, '0.2.0');
  assert.equal(migrate02to03(migrate01to02(v01)).dsirVersion, '0.3.0');
  assert.deepEqual(migrate(v03), v03, 'a current DSIR is unchanged');
  assert.throws(() => migrate({ ...v03, dsirVersion: '9.0.0' }), /unsupported DSIR version/);
});

test('anatomy lists child part slots, and an unknown slot is rejected', () => {
  const doc = fixture();
  const card = doc.components.findIndex((c) => c.name === 'Card');
  doc.components[card].anatomy = { children: ['card-header', 'card-content', 'card-footer'] };
  assert.deepEqual(validate(doc), []);
  doc.components[card].anatomy.children.push('card-sidebar');
  assert.match(only(validate(doc), `/components/${card}/anatomy/children/3`), /"card-sidebar" is not the slot of any component/);
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

test('ringInset is a boolean on a rule that has a ring', () => {
  const doc = fixture();
  const set = doc.components[0].rules[0].set;
  set.ringWidth = 1;
  set.ringInset = true;
  assert.deepEqual(validate(doc), []);
  set.ringInset = 'yes';
  assert.ok(validate(doc).some((e) => /ringInset/.test(e.path)), 'a non-boolean is rejected');
});
