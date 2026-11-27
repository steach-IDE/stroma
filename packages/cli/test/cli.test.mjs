import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.join(root, '..', '..');
const bin = path.join(root, 'bin', 'stroma.mjs');
// Node alone: no Dart (or anything else) on the PATH when the CLI runs.
const env = { PATH: path.dirname(process.execPath), HOME: os.tmpdir() };
const stroma = (cwd, ...args) => spawnSync(process.execPath, [bin, ...args], { cwd, env, encoding: 'utf8' });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'stroma-cli-'));

/** A copy of an example without its Storybook, fonts and build output: its DSIR, its config and its committed package. */
function copyExample(name, pkg) {
  const dir = tmp();
  const from = path.join(repo, 'examples', name);
  fs.cpSync(path.join(from, 'inferred'), path.join(dir, 'inferred'), { recursive: true });
  fs.copyFileSync(path.join(from, 'stroma.config.json'), path.join(dir, 'stroma.config.json'));
  fs.cpSync(path.join(from, 'packages', pkg), path.join(dir, 'packages', pkg), { recursive: true, filter: (s) => !/\/(fonts|build|\.dart_tool)(\/|$)/.test(s) });
  return dir;
}

test('emit --check, with Node alone, finds each example up to date: the JS emitter writes what the Dart one did', () => {
  for (const example of ['shadcn-neutral', 'carbon', 'mui']) {
    const run = stroma(path.join(repo, 'examples', example), 'emit', '--check');
    assert.equal(run.status, 0, `${example}: ${run.stdout}${run.stderr}`);
    assert.match(run.stdout, /is up to date/);
  }
});

test('emit --check fails, naming the file, for an edited, a missing and a no-longer-emitted file; emit repairs all three', () => {
  const dir = copyExample('carbon', 'carbon_ui');
  const tag = path.join(dir, 'packages/carbon_ui/lib/src/components/tag.dart');
  const tokens = path.join(dir, 'packages/carbon_ui/lib/src/tokens.dart');
  const old = path.join(dir, 'packages/carbon_ui/lib/src/components/old.dart');
  assert.equal(stroma(dir, 'emit', '--check').status, 0, 'the copy starts clean');
  fs.appendFileSync(tag, '// edited by hand\n');
  fs.rmSync(tokens);
  fs.writeFileSync(old, '// a component that was removed\n');
  const run = stroma(dir, 'emit', '--check');
  assert.equal(run.status, 1);
  assert.match(run.stderr, /stale: packages\/carbon_ui\/lib\/src\/components\/tag\.dart/);
  assert.match(run.stderr, /stale: packages\/carbon_ui\/lib\/src\/tokens\.dart/);
  assert.match(run.stderr, /stale: packages\/carbon_ui\/lib\/src\/components\/old\.dart is no longer emitted/);
  assert.equal(stroma(dir, 'emit').status, 0);
  assert.equal(fs.existsSync(old), false, 'the file that is no longer emitted is removed');
  assert.equal(stroma(dir, 'emit', '--check').status, 0, 'and a check afterwards is clean');
});

test('a DSIR the emitter cannot print, and a DSIR that is not there, fail with the reason', () => {
  const dir = copyExample('carbon', 'carbon_ui');
  const file = path.join(dir, 'inferred/carbon.dsir.json');
  const dsir = JSON.parse(fs.readFileSync(file, 'utf8'));
  dsir.components[0].rules[0].set.mixBlendMode = 'multiply';
  fs.writeFileSync(file, JSON.stringify(dsir));
  const bad = stroma(dir, 'emit');
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /no Flutter mapping/);
  fs.rmSync(file);
  const missing = stroma(dir, 'emit');
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /DSIR .*carbon\.dsir\.json does not exist/);
});

test('init writes a config that emit reads, and refuses to overwrite or to accept a bad package name', () => {
  const dir = tmp();
  const init = stroma(dir, 'init', '--storybook', 'https://storybook.acme.dev', '--name', 'acme_ui');
  assert.equal(init.status, 0, init.stderr);
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'stroma.config.json'), 'utf8'));
  assert.deepEqual(cfg.source, { storybook: 'https://storybook.acme.dev' });
  assert.deepEqual(cfg.package, { name: 'acme_ui', path: path.join('packages', 'acme_ui') });
  assert.equal(stroma(dir, 'init', '--storybook', 'x', '--name', 'acme_ui').status, 1, 'refuses to overwrite');
  assert.equal(stroma(tmp(), 'init', '--storybook', 'x', '--name', 'Acme-UI').status, 2, 'a Dart package name');
  const emit = stroma(dir, 'emit');
  assert.equal(emit.status, 1);
  assert.match(emit.stderr, /design-system\/acme_ui\.dsir\.json does not exist/);
});

test('the commands that are not built yet say so and exit non-zero; an unknown one does too', () => {
  for (const command of ['extract', 'review', 'verify', 'update']) {
    const run = stroma(tmp(), command);
    assert.equal(run.status, 2, command);
    assert.match(run.stderr, /not in this version/);
  }
  assert.equal(stroma(tmp(), 'frobnicate').status, 2);
});
