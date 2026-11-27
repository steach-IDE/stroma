// stroma.config.json: where the DSIR is, and where the package goes. Paths are relative to the config file.
import fs from 'node:fs';
import path from 'node:path';

export const CONFIG = 'stroma.config.json';

export function findConfig(cwd, explicit) {
  const file = path.resolve(cwd, explicit ?? CONFIG);
  if (!fs.existsSync(file)) throw new Error(`no ${path.basename(file)} in ${path.dirname(file)} (run \`stroma init\`)`);
  return file;
}

export function readConfig(file) {
  let cfg;
  try { cfg = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { throw new Error(`${file} is not valid JSON: ${e.message}`); }
  const dir = path.dirname(file);
  const pkg = cfg.package;
  if (!pkg?.name || !pkg?.path) throw new Error(`${file}: "package" needs a "name" and a "path"`);
  if (!/^[a-z][a-z0-9_]*$/.test(pkg.name)) throw new Error(`${file}: package name "${pkg.name}" is not a Dart package name (lower case, digits, underscores)`);
  return {
    file,
    dir,
    config: cfg,
    packageName: pkg.name,
    packageDir: path.resolve(dir, pkg.path),
    dsirFile: path.resolve(dir, cfg.dsir ?? path.join('design-system', `${pkg.name}.dsir.json`)),
    mappingFile: cfg.scribMapping ? path.resolve(dir, cfg.scribMapping) : null,
    withFonts: pkg.fonts !== false,
  };
}
