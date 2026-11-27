// The Dart emitter, compiled to JavaScript (dist/emit.js), called with JSON in and JSON out. Node alone runs it; its
// output is byte-identical to the native Dart emitter's (a test compares them on the three examples).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
let loaded = false;

function load() {
  if (loaded) return;
  const file = path.join(dist, 'emit.js');
  if (!fs.existsSync(file)) throw new Error('the emitter is not built: run `pnpm run build` in packages/cli (once, with the Dart SDK on PATH)');
  // dart2js's runtime expects a browser's `self` and `location` (it reads `Uri.base` from them).
  globalThis.self ??= globalThis;
  globalThis.location ??= { href: 'file:///' };
  createRequire(import.meta.url)(file);
  if (typeof globalThis.stromaEmit !== 'function') throw new Error('the compiled emitter did not register itself');
  loaded = true;
}

const walk = (dir, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory()
  ? walk(path.join(dir, e.name), base)
  : e.name.startsWith('.') ? [] : [path.relative(base, path.join(dir, e.name)).split(path.sep).join('/')])).sort();

/** The hand-written files every generated package copies, keyed by their path inside the package. */
export function templates() {
  const dir = path.join(dist, 'templates');
  if (!fs.existsSync(dir)) throw new Error('the emitter templates are not built: run `pnpm run build` in packages/cli');
  return Object.fromEntries(walk(dir).map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8')]));
}

/**
 * DSIR (an object) -> { files: { path: text }, fonts: [{ file, weight }] }. Throws the emitter's own message when the
 * DSIR holds something it cannot print.
 */
export function emit({ dsir, mapping, packageName, withFonts = true }) {
  load();
  const out = JSON.parse(globalThis.stromaEmit(JSON.stringify(dsir), mapping ? JSON.stringify(mapping) : '', JSON.stringify(templates()), packageName, withFonts));
  if (out.error) throw new Error(out.error);
  return out;
}
