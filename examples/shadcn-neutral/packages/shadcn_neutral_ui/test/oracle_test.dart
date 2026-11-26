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
import 'package:shadcn_neutral_ui/shadcn_neutral_ui.dart';

const sheetWidth = 1200.0;
const sheetHeight = 3200.0;

/// Stands in for an svg icon: a circle of radius 10 in a 24 box, like the HTML fixture's svg.
class OracleIcon extends StatelessWidget {
  const OracleIcon({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = IconTheme.of(context);
    final size = theme.size ?? 24;
    return SizedBox.square(
      dimension: size,
      child: Center(
        child: Container(
          width: size * 20 / 24,
          height: size * 20 / 24,
          decoration: BoxDecoration(color: theme.color, shape: BoxShape.circle),
        ),
      ),
    );
  }
}

T _enumByName<T extends Enum>(List<T> values, String option) => values.byName(
  option == 'default'
      ? 'regular'
      : option.replaceAllMapped(RegExp('-(.)'), (m) => m[1]!.toUpperCase()),
);

Widget buildNode(Map<String, dynamic> n, {WidgetStatesController? states, bool disabled = false}) {
  final text = n['text'] as String?;
  List<Widget> kids() => [
    for (final c in (n['children'] as List? ?? const [])) buildNode((c as Map).cast()),
  ];
  switch (n['type']) {
    case 'Button':
      return Button(
        variant: _enumByName(ButtonVariant.values, n['variant'] as String),
        size: _enumByName(ButtonSize.values, n['size'] as String),
        icon: n['icon'] == true ? const OracleIcon() : null,
        statesController: states,
        onPressed: disabled ? null : () {},
        child: text == null ? null : Text(text),
      );
    case 'Badge':
      return Badge(
        variant: _enumByName(BadgeVariant.values, n['variant'] as String),
        statesController: states,
        onPressed: n['interactive'] == true ? () {} : null,
        child: Text(text!),
      );
    case 'Card':
      return Card(children: kids());
    case 'CardHeader':
      final action = n['action'] as Map?;
      return CardHeader(action: action == null ? null : buildNode(action.cast()), children: kids());
    case 'CardTitle':
      return CardTitle(child: Text(text!));
    case 'CardDescription':
      return CardDescription(child: Text(text!));
    case 'CardContent':
      return CardContent(child: Text(text!));
    case 'CardFooter':
      return CardFooter(children: kids());
  }
  throw ArgumentError('unknown node ${n['type']}');
}

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
    // Components ask for family Inter from this package, which Flutter names packages/<pkg>/Inter.
    final loader = FontLoader('packages/shadcn_neutral_ui/Inter');
    for (final w in ['Regular', 'Medium', 'SemiBold']) {
      loader.addFont(
        Future.value(ByteData.sublistView(File('fonts/Inter-$w.ttf').readAsBytesSync())),
      );
    }
    await loader.load();
  });

  for (final entry in sheets.entries) {
    testWidgets('oracle ${entry.key}', (tester) async {
      tester.view.devicePixelRatio = 2;
      tester.view.physicalSize = const Size(sheetWidth * 2, sheetHeight * 2);
      addTearDown(tester.view.reset);
      final dark = entry.key.endsWith('.dark');
      final tokens = dark ? DsTokens.dark : DsTokens.light;
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
                  color: tokens.background,
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
              'title': first(find.byKey(ValueKey(c['id'])), CardTitle),
              'content': first(find.byKey(ValueKey(c['id'])), CardContent),
            },
        },
      };
      final out = File('build/oracle/flutter/${entry.key}.json');
      out.parent.createSync(recursive: true);
      out.writeAsStringSync(const JsonEncoder.withIndent('  ').convert(geometry));
    });
  }
}
