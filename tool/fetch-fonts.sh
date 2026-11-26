#!/usr/bin/env bash
# Pinned fonts for golden tests and reference renders.
#   tool/fetch-fonts.sh [<dest dir>...]   (no destination: download and verify only)
# Downloads the official Inter release once into .stroma/fonts/ (resuming a partial download), checks every file
# against tool/fonts.sha256, and copies the three weights into each <dest dir>. A hash that doesn't match stops
# everything and names the file: the cache is never trusted, repaired or used silently.
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
manifest="$repo/tool/fonts.sha256"
cache="$repo/.stroma/fonts/inter-4.1"
zip_url="https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip"
weights=(Regular Medium SemiBold)

sha256() { if command -v sha256sum >/dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d' ' -f1; }
expected() { awk -v f="$1" '$2 == f { print $1 }' "$manifest"; }
check() { # <file in cache>: exits naming the file if its hash isn't the pinned one
  local want got
  want="$(expected "$1")"
  [[ -n "$want" ]] || { echo "fetch-fonts: $1 has no hash in tool/fonts.sha256" >&2; exit 1; }
  [[ -f "$cache/$1" ]] || { echo "fetch-fonts: $1 is missing (no network? the download did not finish)" >&2; exit 1; }
  got="$(sha256 "$cache/$1")"
  [[ "$got" == "$want" ]] || {
    echo "fetch-fonts: $1 has the wrong SHA-256" >&2
    echo "  expected $want" >&2
    echo "  got      $got" >&2
    echo "  delete .stroma/fonts and run again; if it fails again, the download source has changed" >&2
    exit 1
  }
}

mkdir -p "$cache"
have_all=1
for w in "${weights[@]}"; do [[ -f "$cache/Inter-$w.ttf" ]] || have_all=0; done
if [[ $have_all -eq 0 ]]; then
  zip="$cache/Inter-4.1.zip"
  if [[ ! -f "$zip" ]] || [[ "$(sha256 "$zip")" != "$(expected Inter-4.1.zip)" ]]; then
    echo "fetch-fonts: downloading Inter 4.1 (33.7 MB, once)"
    for attempt in 1 2 3 4 5 6 7 8 9 10; do
      curl -sSL --fail -C - -o "$zip" "$zip_url" && [[ "$(sha256 "$zip")" == "$(expected Inter-4.1.zip)" ]] && break
      echo "fetch-fonts: download incomplete, resuming (attempt $attempt)" >&2
    done
  fi
  check Inter-4.1.zip
  for w in "${weights[@]}"; do unzip -q -o -j "$zip" "extras/ttf/Inter-$w.ttf" -d "$cache"; done
  unzip -q -o -j "$zip" LICENSE.txt -d "$cache"
fi
for w in "${weights[@]}"; do check "Inter-$w.ttf"; done

for dest in "$@"; do
  mkdir -p "$dest"
  for w in "${weights[@]}"; do cp "$cache/Inter-$w.ttf" "$dest/"; done
done
echo "fetch-fonts: Inter 4.1 verified and copied to $# folder(s)"
