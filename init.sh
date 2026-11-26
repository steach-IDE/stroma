#!/usr/bin/env bash
# Stroma's baseline check. Run it at the start and end of every session; a failure is the first thing to fix.
#   1. The harness: required files, feature_list.json integrity, shell syntax.
#   2. Every package under packages/: Node (pnpm) and Dart/Flutter checks, found by their manifest.
# Nothing here writes outside the repository or deletes anything. The first run downloads the pinned fonts
# (tool/fetch-fonts.sh) into .stroma/fonts; later runs use that copy.
set -euo pipefail
cd "$(dirname "$0")"

fail() { echo "FAIL: $*" >&2; exit 1; }
step() { echo "== $*"; }

step "harness files"
for f in README.md LICENSE AGENTS.md CLAUDE.md feature_list.json progress.md session-handoff.md \
         .claude/rules/git-and-issues.md .claude/hooks/require-issue-branch.sh .github/scripts/work-gate.sh; do
  [[ -f "$f" ]] || fail "missing $f"
done
echo "ok"

step "feature_list.json"
python3 - <<'PY' || fail "feature_list.json is invalid (see above)"
import json, sys
data = json.load(open("feature_list.json"))
features = data["features"]
ids = [f["id"] for f in features]
errors = []
if len(ids) != len(set(ids)):
    errors.append("duplicate feature ids")
known = set(ids)
for f in features:
    for key in ("id", "name", "description", "dependencies", "status", "done_when", "evidence"):
        if key not in f:
            errors.append(f"{f.get('id', '?')}: missing '{key}'")
    if f.get("status") not in ("not-started", "in-progress", "done"):
        errors.append(f"{f['id']}: status must be not-started, in-progress or done")
    for d in f.get("dependencies", []):
        if d not in known:
            errors.append(f"{f['id']}: unknown dependency {d}")
    if f.get("status") == "done" and not f.get("evidence", "").strip():
        errors.append(f"{f['id']}: done without evidence")
    if f.get("status") in ("in-progress", "done"):
        by_id = {x["id"]: x for x in features}
        for d in f.get("dependencies", []):
            if d in by_id and by_id[d]["status"] != "done":
                errors.append(f"{f['id']}: started before its dependency {d} is done")
active = [f["id"] for f in features if f.get("status") == "in-progress"]
if len(active) > 1:
    errors.append(f"more than one feature in progress: {', '.join(active)}")
# No dependency cycles.
deps = {f["id"]: f.get("dependencies", []) for f in features}
state = {}
def visit(n, path):
    if state.get(n) == 1:
        errors.append("dependency cycle: " + " -> ".join(path + [n])); return
    if state.get(n) == 2 or n not in deps: return
    state[n] = 1
    for d in deps[n]: visit(d, path + [n])
    state[n] = 2
for n in deps: visit(n, [])
if errors:
    print("\n".join(errors), file=sys.stderr); sys.exit(1)
done = sum(f["status"] == "done" for f in features)
print(f"ok: {len(features)} features, {done} done, in progress: {', '.join(active) or 'none'}")
PY

step "shell syntax"
while IFS= read -r -d '' s; do bash -n "$s" || fail "syntax error in $s"; done \
  < <(find . -name '*.sh' -not -path './node_modules/*' -not -path '*/node_modules/*' -not -path './.git/*' -print0)
echo "ok"

shopt -s nullglob
# Packages first (alphabetical: dsir installs before the enricher that imports it), then generated examples.
packages=(packages/*/ examples/*/packages/*/ examples/*/storybook/)
if [[ ${#packages[@]} -eq 0 ]]; then
  step "packages"
  echo "none yet: only the harness was checked"
fi
# ${a[@]+...} keeps an empty array legal under set -u in bash 3.2 (macOS).
for pkg in ${packages[@]+"${packages[@]}"}; do
  pkg="${pkg%/}"
  if [[ -f "$pkg/package.json" ]]; then
    step "$pkg (node)"
    command -v pnpm >/dev/null || fail "$pkg needs pnpm (see its README for the Node version)"
    (cd "$pkg" && pnpm install --frozen-lockfile >/dev/null)
    for script in check lint test build; do
      if node -e "process.exit(require('./$pkg/package.json').scripts?.['$script'] ? 0 : 1)"; then
        (cd "$pkg" && pnpm run -s "$script") || fail "$pkg: pnpm run $script"
      fi
    done
  fi
  if [[ -f "$pkg/pubspec.yaml" ]]; then
    if grep -qE '^\s+sdk: flutter' "$pkg/pubspec.yaml"; then
      step "$pkg (flutter)"
      command -v flutter >/dev/null || fail "$pkg needs the Flutter SDK"
      (cd "$pkg" && flutter pub get >/dev/null && flutter analyze) || fail "$pkg: flutter analyze"
      if grep -q 'asset: fonts/' "$pkg/pubspec.yaml"; then
        # Goldens need the exact pinned font bytes (fonts are downloaded, never committed).
        tool/pin-fonts.sh "$pkg" || fail "$pkg: pinned fonts"
      fi
      if [[ -d "$pkg/test" ]]; then
        (cd "$pkg" && flutter test) || fail "$pkg: flutter test"
      fi
    else
      step "$pkg (dart)"
      command -v dart >/dev/null || fail "$pkg needs the Dart SDK"
      (cd "$pkg" && dart pub get >/dev/null && dart analyze && { [[ ! -d test ]] || dart test; }) || fail "$pkg: dart checks"
    fi
  fi
done

echo
echo "Baseline is green. Next:"
echo "  1. Read feature_list.json and pick ONE feature whose dependencies are done."
echo "  2. Open or find its GitHub issue and branch <type>/<issue number>-<few words>."
echo "  3. Run ./init.sh again before you call it done, and record the evidence."
