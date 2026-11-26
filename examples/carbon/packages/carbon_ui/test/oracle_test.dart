// Hand-written oracle harness, copied into every generated package.
// Pumps every cell in test/oracle/cells.json at 2x, writes one golden per sheet and mode, and
// writes each cell's measured geometry to build/oracle/flutter/<sheet>.<mode>.json for the
// comparison against Chrome (packages/scrib_ds/oracle).
import 'dart:convert';
import 'dart:io';

import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:carbon_ui/carbon_ui.dart';

import 'oracle/build_node.dart';

const sheetWidth = 1200.0;
const sheetHeight = 3200.0;

Map<String, double> _rect(Rect r, Offset o) => {
  'x': r.left - o.dx,
  'y': r.top - o.dy,
  'w': r.width,
  'h': r.height,
};

void main() {
  final cells = (jsonDecode(File('test/oracle/cells.json').readAsStringSync()) as List)
      .cast<Map<String, dynamic>>();
  final sheets = <String, List<Map<String, dynamic>>>{};
  for (final c in cells) {
    (sheets['${c['sheet']}.${c['mode']}'] ??= []).add(c);
  }

  setUpAll(() async {
    // Components ask for the design system's family from this package, which Flutter names packages/<pkg>/<family>.
    final loader = FontLoader('packages/carbon_ui/IBM Plex Sans');
    final fonts = Directory('fonts').existsSync()
        ? Directory('fonts').listSync().whereType<File>().toList()
        : [];
    fonts.sort((a, b) => a.path.compareTo(b.path));
    for (final f in fonts.where((f) => f.path.endsWith('.ttf'))) {
      loader.addFont(Future.value(ByteData.sublistView(f.readAsBytesSync())));
    }
    await loader.load();
  });

  for (final entry in sheets.entries) {
    testWidgets('oracle ${entry.key}', (tester) async {
      tester.view.devicePixelRatio = 2;
      tester.view.physicalSize = const Size(sheetWidth * 2, sheetHeight * 2);
      addTearDown(tester.view.reset);
      final tokens = DsTokens.byMode(entry.key.substring(entry.key.indexOf('.') + 1));
      const sheetKey = ValueKey('sheet');

      Widget cell(Map<String, dynamic> c) {
        final state = c['state'] as String;
        final controller = switch (state) {
          'hovered' => WidgetStatesController({WidgetState.hovered}),
          'focused' => WidgetStatesController({WidgetState.focused}),
          _ => null,
        };
        Widget w = KeyedSubtree(
          key: ValueKey(c['id']),
          child: buildNode(
            (c['node'] as Map).cast(),
            states: controller,
            disabled: state == 'disabled',
          ),
        );
        if (c['width'] != null) w = SizedBox(width: (c['width'] as num).toDouble(), child: w);
        return Padding(padding: const EdgeInsets.all(6), child: w);
      }

      await tester.pumpWidget(
        Directionality(
          textDirection: TextDirection.ltr,
          child: DsTheme(
            tokens: tokens,
            child: Align(
              alignment: Alignment.topLeft,
              child: RepaintBoundary(
                key: sheetKey,
                child: Container(
                  width: sheetWidth,
                  color: tokens.pageBackground,
                  padding: const EdgeInsets.all(16),
                  child: DefaultTextStyle(
                    style: tokens.bodyText,
                    child: Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [for (final c in entry.value) cell(c)],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      // matchesGoldenFile on a finder captures at 1x; the oracle compares at 2x like Chrome.
      final boundary = tester.renderObject<RenderRepaintBoundary>(find.byKey(sheetKey));
      final image = (await tester.runAsync(() => boundary.toImage(pixelRatio: 2)))!;
      // Goldens are Linux renders, the platform CI runs on. Other platforms rasterise text slightly
      // differently (1-2% of pixels, even with the same font files), so they skip the comparison but
      // still write the geometry the oracle reads. Regenerate them with the update-goldens workflow.
      if (Platform.isLinux) {
        await expectLater(image, matchesGoldenFile('goldens/${entry.key}.png'));
      }

      final origin = tester.getRect(find.byKey(sheetKey)).topLeft;
      Map<String, double>? first(Finder of, Type type) {
        final f = find.descendant(of: of, matching: find.byType(type));
        return f.evaluate().isEmpty ? null : _rect(tester.getRect(f.first), origin);
      }

      final geometry = <String, Object?>{
        'sheet': _rect(tester.getRect(find.byKey(sheetKey)), origin),
        'cells': {
          for (final c in entry.value)
            c['id'] as String: {
              'box': _rect(tester.getRect(find.byKey(ValueKey(c['id']))), origin),
              'text': first(find.byKey(ValueKey(c['id'])), RichText),
              'icon': first(find.byKey(ValueKey(c['id'])), OracleIcon),
              for (final part in oracleParts.entries)
                part.key: first(find.byKey(ValueKey(c['id'])), part.value),
            },
        },
      };
      final out = File('build/oracle/flutter/${entry.key}.json');
      out.parent.createSync(recursive: true);
      out.writeAsStringSync(const JsonEncoder.withIndent('  ').convert(geometry));
    });
  }
}
