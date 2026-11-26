#!/usr/bin/env bash
# Pinned IBM Plex Sans for Carbon's golden tests, the way fetch-fonts.sh pins Inter.
#   tool/fetch-plex.sh [<dest dir>...]   (no destination: download and verify only)
# Downloads the official @ibm/plex-sans 1.1.0 release (the version the Carbon Storybook's npm package is) once into
# .stroma/fonts/, checks every file against tool/fonts.sha256, and copies Light, Regular and SemiBold, with the
# SIL OFL licence, into each <dest dir>. A wrong hash stops everything and names the file.
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
manifest="$repo/tool/fonts.sha256"
cache="$repo/.stroma/fonts/plex-sans-1.1.0"
zip_url="https://github.com/IBM/plex/releases/download/%40ibm%2Fplex-sans%401.1.0/ibm-plex-sans.zip"
weights=(Light Regular SemiBold)

sha256() { if command -v sha256sum >/dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d' ' -f1; }
expected() { awk -v f="$1" '$2 == f { print $1 }' "$manifest"; }
check() { # <file in cache>: exits naming the file if its hash isn't the pinned one
  local want got
  want="$(expected "$1")"
  [[ -n "$want" ]] || { echo "fetch-plex: $1 has no hash in tool/fonts.sha256" >&2; exit 1; }
  [[ -f "$cache/$1" ]] || { echo "fetch-plex: $1 is missing (no network? the download did not finish)" >&2; exit 1; }
  got="$(sha256 "$cache/$1")"
  [[ "$got" == "$want" ]] || {
    echo "fetch-plex: $1 has the wrong SHA-256" >&2
    echo "  expected $want" >&2
    echo "  got      $got" >&2
    echo "  delete .stroma/fonts and run again; if it fails again, the download source has changed" >&2
    exit 1
  }
}

mkdir -p "$cache"
have_all=1
for w in "${weights[@]}"; do [[ -f "$cache/IBMPlexSans-$w.ttf" ]] || have_all=0; done
if [[ $have_all -eq 0 ]]; then
  zip="$cache/ibm-plex-sans-1.1.0.zip"
  if [[ ! -f "$zip" ]] || [[ "$(sha256 "$zip")" != "$(expected ibm-plex-sans-1.1.0.zip)" ]]; then
    echo "fetch-plex: downloading IBM Plex Sans 1.1.0 (9.9 MB, once)"
    for attempt in 1 2 3 4 5 6 7 8 9 10; do
      curl -sSL --fail -C - --max-time 120 -o "$zip" "$zip_url" && [[ "$(sha256 "$zip")" == "$(expected ibm-plex-sans-1.1.0.zip)" ]] && break
      echo "fetch-plex: download incomplete, resuming (attempt $attempt)" >&2
    done
  fi
  check ibm-plex-sans-1.1.0.zip
  for w in "${weights[@]}"; do unzip -q -o -j "$zip" "ibm-plex-sans/fonts/complete/ttf/IBMPlexSans-$w.ttf" -d "$cache"; done
  unzip -q -o -j "$zip" ibm-plex-sans/LICENSE.txt -d "$cache"
fi
for w in "${weights[@]}"; do check "IBMPlexSans-$w.ttf"; done

for dest in "$@"; do
  mkdir -p "$dest"
  for w in "${weights[@]}"; do cp "$cache/IBMPlexSans-$w.ttf" "$dest/"; done
  cp "$cache/LICENSE.txt" "$dest/LICENSE-IBM-Plex.txt"
done
echo "fetch-plex: IBM Plex Sans 1.1.0 verified and copied to $# folder(s)"
