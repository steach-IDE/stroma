#!/usr/bin/env bash
# Copies the pinned font a generated package's pubspec.yaml asks for into its fonts/ folder.
#   tool/pin-fonts.sh <package dir>
# The family comes from pubspec.yaml; Inter and IBM Plex Sans are pinned (fetch-fonts.sh, fetch-plex.sh).
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
pkg="$1"
family="$(awk '/- family:/ { sub(/.*- family: */, ""); print; exit }' "$pkg/pubspec.yaml")"
case "$family" in
  Inter) "$repo/tool/fetch-fonts.sh" "$pkg/fonts" ;;
  "IBM Plex Sans") "$repo/tool/fetch-plex.sh" "$pkg/fonts" ;;
  *) echo "pin-fonts: $pkg uses the font family \"$family\", which has no pinned download" >&2; exit 1 ;;
esac
