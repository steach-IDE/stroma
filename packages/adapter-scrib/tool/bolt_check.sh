#!/usr/bin/env bash
# Compiles packages/scrib/examples/bolt.tsp with scrib_compiler's pluggable Shadcn target, swaps in
# the generated adapter (unless --baseline), then runs flutter analyze and renders every route at
# 320, 390 and 1280 px. Output goes to .stroma/bolt-<mode>/ (gitignored). Needs SCRIB_DIR.
#   tool/bolt_check.sh [--baseline]
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
repo="$(cd "$here/../.." && pwd)"
scrib="${SCRIB_DIR:?set SCRIB_DIR to a Scrib checkout (the repository root)}"
mode=generated; [[ "${1:-}" == "--baseline" ]] && mode=baseline
app="$repo/.stroma/bolt-$mode"
pkg="$repo/examples/shadcn-neutral/packages/shadcn_neutral_ui"

if [[ ! -d "$app" ]]; then
  (cd "$scrib/packages/scrib_compiler" && dart run bin/scrib_compiler.dart compile --target flutter --output "$app" ../scrib/examples/bolt.tsp >/dev/null)
fi
ds="$app/lib/design_system"

if [[ $mode == generated && ! -f "$ds/shadcn_adapter.dart" ]]; then
  mv "$ds/adapter.dart" "$ds/shadcn_adapter.dart"
  # shortcut: the base adapter's icon lookup is private; expose it until the contract exports one.
  printf '\nIconData? scribResolveIcon(ScribIcon icon, String label) => _resolveIcon(icon, label);\n' >> "$ds/shadcn_adapter.dart"
  # pubspec: add the generated package by path, under dependencies.
  sed -i '' "s|^dependencies:|dependencies:\n  shadcn_neutral_ui:\n    path: $pkg|" "$app/pubspec.yaml"
fi
# Every run: the adapter just emitted, never a copy left from an earlier run.
if [[ $mode == generated ]]; then cp "$pkg/scrib/scrib_adapter.dart" "$ds/adapter.dart"; fi

routes=$(grep -oE "static const [a-zA-Z]+ = '[^']+'" "$app/lib/router.dart" | sed -E "s/.*'(.*)'/'\1'/" | paste -sd, -)
cat > "$app/test/routes_test.dart" <<DART
// Written by packages/scrib_ds/tool/bolt_check.sh: every route at three widths, no Flutter errors.
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:scrib_generated_app/main.dart';
import 'package:scrib_generated_app/router.dart';

void main() {
  // The base adapter downloads fonts at runtime; tests have no network, so fall back silently.
  GoogleFonts.config.allowRuntimeFetching = false;
  for (final width in [320.0, 390.0, 1280.0]) {
    for (final route in [$routes]) {
      testWidgets('\$route at \${width.toInt()}px', (tester) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = Size(width, 900);
        addTearDown(tester.view.reset);
        appRouter.go(route);
        await tester.pumpWidget(const MainApp());
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      });
    }
  }
}
DART

if [[ $mode == generated ]]; then
  cat > "$app/test/uses_generated_test.dart" <<'DART'
// Written by packages/scrib_ds/tool/bolt_check.sh: the screens render the generated widgets.
import 'package:flutter_test/flutter_test.dart';
import 'package:scrib_generated_app/main.dart';
import 'package:scrib_generated_app/router.dart';
import 'package:shadcn_neutral_ui/shadcn_neutral_ui.dart' as ds;

void main() {
  testWidgets('bolt-home renders generated Button and Card', (tester) async {
    appRouter.go(AppRoutes.boltHome);
    await tester.pumpWidget(const MainApp());
    await tester.pumpAndSettle();
    expect(find.byType(ds.Button), findsWidgets);
    expect(find.byType(ds.Card), findsWidgets);
  });
}
DART
fi

cd "$app"
flutter pub get >/dev/null
echo "== flutter analyze ($mode)"
flutter analyze --no-fatal-infos --no-fatal-warnings 2>&1 | tail -n 25 || true
echo "== routes ($mode)"
flutter test test/routes_test.dart $( [[ $mode == generated ]] && echo test/uses_generated_test.dart ) -r expanded 2>&1 | grep -E "EXCEPTION|overflowed|Error|error:|All tests passed|tests? failed|-[0-9]+:" | tail -n 60 || true
