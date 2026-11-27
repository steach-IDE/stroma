import 'dart:convert';
import 'dart:io';

import 'package:stroma_emitter/emitter.dart';
import 'package:test/test.dart';

void main() {
  Map<String, dynamic> read(String p) =>
      jsonDecode(File(p).readAsStringSync()) as Map<String, dynamic>;
  final dsir = read('../../examples/shadcn-neutral/design-system/shadcn.dsir.json');
  final mapping = read('../adapter-scrib/mappings/shadcn.scrib.json');

  Map<String, String> emit(Map<String, dynamic> d) =>
      emitPackage(dsir: d, mapping: mapping, templates: const {}, packageName: 'pkg');

  test('emitting twice gives identical files', () {
    expect(emit(dsir), equals(emit(dsir)));
  });

  test('every cascade line names the class it came from', () {
    final button = emit(dsir)['lib/src/components/button.dart']!;
    expect(button, contains('// focus-visible:ring-destructive/20'));
    expect(button, contains('variant != ButtonVariant.destructive'));
  });

  test('a style key with no Flutter mapping fails', () {
    final broken = jsonDecode(jsonEncode(dsir)) as Map<String, dynamic>;
    ((broken['components'] as List).first['rules'] as List).add({
      'when': <String, dynamic>{},
      'target': 'root',
      'set': {'mixBlendMode': 'multiply'},
      'from': 'mix-blend-multiply',
    });
    expect(() => emit(broken), throwsA(isA<EmitException>()));
  });

  test('cva option names become Dart enum values', () {
    expect(enumValue('default'), 'regular');
    expect(enumValue('icon-xs'), 'iconXs');
    expect(camel('primary-foreground'), 'primaryForeground');
  });

  test('an inferred DSIR (no globals, part slots named by data-slot, measured radii) emits', () {
    final inferred = read('../../examples/shadcn-neutral/inferred/shadcn.dsir.json');
    final files = emit(inferred);
    expect(files, equals(emit(inferred)));
    final header = files['lib/src/components/card.dart']!;
    expect(header, contains('required bool hasAction'));
    expect(header, contains('trailing: action'));
    expect(files['lib/src/components/badge.dart']!, contains('Widget? icon'));
  });

  test(
    'a DSIR with four themes, no radius and Carbon-style names emits one token set per mode',
    () {
      final carbon = read('../../examples/carbon/inferred/carbon.dsir.json');
      final files = emitPackage(dsir: carbon, templates: const {}, packageName: 'carbon_ui');
      expect(
        files,
        equals(emitPackage(dsir: carbon, templates: const {}, packageName: 'carbon_ui')),
      );
      final tokens = files['lib/src/tokens.dart']!;
      for (final mode in ['white', 'g10', 'g90', 'g100']) {
        expect(tokens, contains('static const $mode = DsTokens('));
      }
      expect(tokens, contains('static const light = white;'));
      expect(tokens, contains('static const dark = g100;'));
      expect(files['lib/src/components/tile.dart']!, contains("t.mode == 'g90'"));
      expect(
        files['lib/src/components/button.dart']!,
        contains('dangerTertiary'),
      ); // danger--tertiary
      expect(
        files['lib/src/components/tag.dart']!,
        contains('ringInset: true'),
      ); // Carbon's inset border
      expect(
        files['lib/src/components/button.dart']!,
        contains('v2xl'),
      ); // 2xl is not a Dart identifier
      expect(files.containsKey('scrib/scrib_adapter.dart'), isFalse);
      expect(files.containsKey('test/pressable_test.dart'), isFalse);
    },
  );

  test(
    'a DSIR with page colours and no page tokens (Material UI) emits them; a big component splits over sheets',
    () {
      final mui = read('../../examples/mui/inferred/mui.dsir.json');
      final files = emitPackage(
        dsir: mui,
        templates: const {},
        packageName: 'mui_ui',
        withFonts: false,
      );
      expect(
        files['lib/src/tokens.dart']!,
        contains('Color get pageBackground => pageColourBackground;'),
      );
      expect(files['pubspec.yaml']!, isNot(contains('fonts:')));
      final cells = (jsonDecode(files['test/oracle/cells.json']!) as List)
          .cast<Map<String, dynamic>>();
      expect({for (final c in cells) c['sheet']}, {'button-1', 'button-2'});
      expect(
        cells.where((c) => c['sheet'] == 'button-1' && c['mode'] == 'light').length,
        lessThanOrEqualTo(200),
      );
    },
  );

  test('tokens that name no page background fail, saying so', () {
    final broken =
        jsonDecode(jsonEncode(read('../../examples/carbon/inferred/carbon.dsir.json')))
            as Map<String, dynamic>;
    ((broken['tokens'] as Map)['color'] as Map).removeWhere(
      (k, _) => (k as String).endsWith('background'),
    );
    expect(
      () => emitPackage(dsir: broken, templates: const {}, packageName: 'carbon_ui'),
      throwsA(predicate((e) => e is EmitException && e.message.contains('page background'))),
    );
  });

  test('a DSIR\'s font files come from its family and the weights its rules use', () {
    expect(fontFiles(dsir).map((f) => f.$1), [
      'Inter-Regular.ttf',
      'Inter-Medium.ttf',
      'Inter-SemiBold.ttf',
    ]);
    final carbon = read('../../examples/carbon/inferred/carbon.dsir.json');
    expect(fontFiles(carbon).map((f) => f.$1), ['IBMPlexSans-Regular.ttf']);
    final pubspec = emitPackage(
      dsir: carbon,
      templates: const {},
      packageName: 'carbon_ui',
    )['pubspec.yaml']!;
    expect(pubspec, contains('family: IBM Plex Sans'));
    expect(pubspec, contains('asset: fonts/IBMPlexSans-Regular.ttf'));
  });

  for (final example in ['shadcn-neutral', 'carbon', 'mui']) {
    test('the committed $example example is what the emitter writes now', () {
      final run = Process.runSync(Platform.resolvedExecutable, [
        'run',
        'bin/emit.dart',
        '--check',
        '--example',
        example,
      ]);
      expect(run.exitCode, 0, reason: '${run.stdout}${run.stderr}');
    });
  }
}
