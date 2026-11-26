// Validates a DSIR 0.2 document: first the JSON Schema, then the cross-references a schema can't
// express (a rule's variant axis and value exist on its component; a colour or radius token exists).
// Every error names a JSON Pointer path into the document.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const schema = JSON.parse(readFileSync(fileURLToPath(new URL('../schema/dsir-0.2.schema.json', import.meta.url)), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
const checkSchema = ajv.compile(schema);

const FIXED_CONDITIONS = new Set(['mode', 'states', 'hasIcon', 'interactive', 'hasSlot']);
const COLOR_KEYS = ['bg', 'fg', 'borderColor', 'ringColor'];

function schemaErrors() {
  // A failed oneOf reports one error per branch plus a generic "must match exactly one schema".
  // Keep the generic one only where nothing more specific was said about that path.
  const errors = (checkSchema.errors ?? []).map((e) => {
    const path = e.instancePath || '/';
    let message = e.message;
    if (e.keyword === 'additionalProperties') message = `unknown key "${e.params.additionalProperty}"`;
    if (e.keyword === 'required') message = `missing "${e.params.missingProperty}"`;
    if (e.keyword === 'enum') message = `must be one of ${e.params.allowedValues.map((v) => JSON.stringify(v)).join(', ')}`;
    return { path, message, generic: e.keyword === 'oneOf' };
  });
  const specific = new Set(errors.filter((e) => !e.generic).map((e) => e.path));
  const unique = new Map();
  for (const e of errors) {
    if (e.generic && specific.has(e.path)) continue;
    unique.set(`${e.path} ${e.message}`, { path: e.path, message: e.message });
  }
  return [...unique.values()];
}

function crossReferenceErrors(doc) {
  const errors = [];
  const colorTokens = new Set(Object.keys(doc.tokens.color));
  const radiusTokens = new Set(Object.keys(doc.tokens.radius?.derived ?? {}).map((k) => `radius-${k}`));
  const err = (path, message) => errors.push({ path, message });

  const checkSet = (set, path) => {
    for (const key of COLOR_KEYS) {
      const token = set[key]?.token;
      if (token !== undefined && !colorTokens.has(token)) err(`${path}/${key}/token`, `unknown colour token "${token}"`);
    }
    const radius = set.radius?.token;
    if (radius !== undefined && !radiusTokens.has(radius)) err(`${path}/radius/token`, `unknown radius token "${radius}"`);
  };
  const checkAxes = (conditions, variants, path) => {
    for (const [axis, value] of Object.entries(conditions)) {
      if (FIXED_CONDITIONS.has(axis)) continue;
      if (!(axis in variants)) err(`${path}/${axis}`, `"${axis}" is not a variant axis of this component`);
      else if (!variants[axis].includes(value)) err(`${path}/${axis}`, `"${value}" is not an option of "${axis}"`);
    }
  };

  for (const [selector, group] of Object.entries(doc.globals)) {
    group.rules.forEach((r, i) => checkSet(r.set, `/globals/${selector}/rules/${i}/set`));
  }
  const names = new Set();
  doc.components.forEach((c, ci) => {
    const base = `/components/${ci}`;
    if (names.has(c.name)) err(`${base}/name`, `duplicate component "${c.name}"`);
    names.add(c.name);
    checkAxes(c.defaultVariants, c.variants, `${base}/defaultVariants`);
    c.rules.forEach((r, ri) => {
      checkAxes(r.when, c.variants, `${base}/rules/${ri}/when`);
      (r.except ?? []).forEach((ex, ei) => checkAxes(ex, c.variants, `${base}/rules/${ri}/except/${ei}`));
      checkSet(r.set, `${base}/rules/${ri}/set`);
    });
  });
  return errors;
}

/** Returns a list of { path, message }; empty when the document is a valid DSIR 0.2. */
export function validate(doc) {
  if (!checkSchema(doc)) return schemaErrors();
  return crossReferenceErrors(doc);
}
