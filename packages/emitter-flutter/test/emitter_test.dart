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

  test('the committed example is what the emitter writes now', () {
    final run = Process.runSync(Platform.resolvedExecutable, ['run', 'bin/emit.dart', '--check']);
    expect(run.exitCode, 0, reason: '${run.stdout}${run.stderr}');
  });
}
