import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyOverrides } from '../src/overrides.mjs';
import { validate } from '../../dsir/src/validate.mjs';

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (...p) => JSON.parse(fs.readFileSync(path.join(repo, ...p), 'utf8'));
// Inference's own output, before any overrides (the committed examples have theirs applied).
const shadcn = read('packages', 'infer', 'test', 'fixtures', 'shadcn.inferred.dsir.json');
const carbon = read('packages', 'infer', 'test', 'fixtures', 'carbon.inferred.dsir.json');

const radiusRefs = (dsir) => dsir.components.flatMap((c) => c.rules.map((r) => r.set.radius?.token).filter(Boolean));
const colourRefs = (dsir) => dsir.components.flatMap((c) => c.rules.flatMap((r) => ['bg', 'fg', 'borderColor', 'ringColor'].map((k) => r.set[k]?.token).filter(Boolean)));

test('a radius rename reaches the derived table and every rule, and the result is still a valid DSIR', () => {
  const out = applyOverrides(shadcn, { tokens: { radius: { 'radius-minus2': 'radius-md', 'radius-plus4': 'radius-xl' } } });
  assert.deepEqual(Object.keys(out.tokens.radius.derived).sort(), ['md', 'xl']);
  assert.equal(out.tokens.radius.derived.md, shadcn.tokens.radius.derived.minus2, 'the value is not touched');
  assert.ok(radiusRefs(out).includes('radius-md') && !radiusRefs(out).includes('radius-minus2'));
  assert.deepEqual(validate(out), []);
  assert.deepEqual(radiusRefs(shadcn).length, radiusRefs(out).length);
});

test('a component and a colour token rename reach every rule; rules are otherwise untouched', () => {
  const out = applyOverrides(carbon, { components: { Btn: { name: 'Button', role: 'button' } }, tokens: { color: { 'cds-background': 'background' } } });
  assert.deepEqual(out.components.map((c) => c.name), ['Button', 'Tag', 'Tile']);
  assert.ok('background' in out.tokens.color && !('cds-background' in out.tokens.color));
  assert.ok(!colourRefs(out).includes('cds-background'));
  assert.equal(colourRefs(out).length, colourRefs(carbon).length);
  assert.deepEqual(out.components[0].rules.map((r) => r.when), carbon.components[0].rules.map((r) => r.when), 'conditions are untouched');
  assert.deepEqual(validate(out), []);
  assert.equal(carbon.components[0].name, 'Btn', 'the input is not changed');
});

test('an override naming something that does not exist fails, naming it', () => {
  assert.throws(() => applyOverrides(carbon, { components: { Nope: { name: 'X' } } }), /component "Nope" does not exist \(have: Btn, Tag, Tile\)/);
  assert.throws(() => applyOverrides(carbon, { components: { Btn: { slots: { ghost: { kind: 'content' } } } } }), /component "Btn" has no slot "ghost"/);
  assert.throws(() => applyOverrides(carbon, { tokens: { color: { nope: 'x' } } }), /colour token "nope" does not exist/);
  assert.throws(() => applyOverrides(shadcn, { tokens: { radius: { 'radius-lg': 'radius-x' } } }), /radius token "radius-lg" does not exist/);
});

test('a rename onto a taken name, an unprefixed radius token and an unknown key fail', () => {
  assert.throws(() => applyOverrides(carbon, { components: { Btn: { name: 'Tag' } } }), /cannot rename component "Btn" to "Tag"/);
  assert.throws(() => applyOverrides(carbon, { tokens: { color: { 'cds-background': 'cds-layer' } } }), /cannot rename colour token "cds-background" to "cds-layer"/);
  assert.throws(() => applyOverrides(shadcn, { tokens: { radius: { minus2: 'md' } } }), /must be written with its radius- prefix/);
  assert.throws(() => applyOverrides(shadcn, { tokens: { radius: { 'radius-base': 'radius-x' } } }), /base radius token cannot be renamed/);
  assert.throws(() => applyOverrides(carbon, { components: { Btn: { colour: 'red' } } }), /unknown key "colour"/);
  assert.throws(() => applyOverrides(carbon, { thing: {} }), /the file has an unknown key "thing"/);
});
