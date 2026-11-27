// Builds what the CLI ships in dist/: the emitter compiled to JavaScript (needs the Dart SDK, once, at build time) and
// the templates every generated package copies. Users of the built package need Node alone.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const emitter = path.join(root, '..', 'emitter-flutter');
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });

// The emitter's own dependencies (dart_style) must be resolved: on a clean checkout nothing has run `dart pub get` yet.
const pub = spawnSync('dart', ['pub', 'get'], { cwd: emitter, encoding: 'utf8' });
if (pub.error || pub.status !== 0) {
  console.error(`stroma build: dart pub get failed (is the Dart SDK on PATH, and the network reachable?)\n${pub.error?.message ?? ''}${pub.stdout}${pub.stderr}`);
  process.exit(1);
}
const compile = spawnSync('dart', ['compile', 'js', path.join(emitter, 'web', 'emit_js.dart'), '-O2', '-o', path.join(dist, 'emit.js')], { cwd: emitter, encoding: 'utf8' });
if (compile.error || compile.status !== 0) {
  console.error(`stroma build: dart compile js failed (is the Dart SDK on PATH?)\n${compile.error?.message ?? ''}${compile.stdout}${compile.stderr}`);
  process.exit(1);
}
for (const extra of ['emit.js.deps', 'emit.js.map']) fs.rmSync(path.join(dist, extra), { force: true });
fs.rmSync(path.join(dist, 'templates'), { recursive: true, force: true });
fs.cpSync(path.join(emitter, 'templates', 'package'), path.join(dist, 'templates'), { recursive: true, filter: (src) => !path.basename(src).startsWith('.') });
console.log(`stroma build: dist/emit.js (${Math.round(fs.statSync(path.join(dist, 'emit.js')).size / 1024)} KB) and dist/templates`);
