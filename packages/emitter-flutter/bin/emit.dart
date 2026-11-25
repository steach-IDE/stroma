// dart run bin/emit.dart [--check] [--fonts <dir>]
// Reads dsir/shadcn.dsir.json, mappings/ and templates/, writes generated/<package>/.
// --check fails if the committed output differs from what would be written.
// --fonts is where Inter-{Regular,Medium,SemiBold}.ttf are copied from (default /Library/Fonts).
import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:scrib_ds/emitter.dart';

const packageName = 'shadcn_neutral_ui';

Future<void> main(List<String> args) async {
  final root = p.dirname(p.dirname(Platform.script.toFilePath()));
  Map<String, dynamic> readJson(String rel) =>
      jsonDecode(File(p.join(root, rel)).readAsStringSync()) as Map<String, dynamic>;

  final templateDir = Directory(p.join(root, 'templates', 'package'));
  final templates = <String, String>{
    for (final f
        in templateDir.listSync(recursive: true).whereType<File>().toList()
          ..sort((a, b) => a.path.compareTo(b.path)))
      p.posix.joinAll(p.split(p.relative(f.path, from: templateDir.path))): f.readAsStringSync(),
  };
  final files = emitPackage(
    dsir: readJson('dsir/shadcn.dsir.json'),
    mapping: readJson('mappings/shadcn.scrib.json'),
    templates: templates,
    packageName: packageName,
  );

  final out = p.join(root, 'generated', packageName);
  final check = args.contains('--check');
  var stale = 0;
  for (final e in files.entries) {
    final file = File(p.join(out, e.key));
    if (check) {
      if (!file.existsSync() || file.readAsStringSync() != e.value) {
        stderr.writeln('stale: ${p.relative(file.path, from: root)}');
        stale++;
      }
    } else {
      file.parent.createSync(recursive: true);
      file.writeAsStringSync(e.value);
    }
  }
  if (stale > 0) exit(1);
  if (!check) {
    // shortcut: fonts come from a local install and are gitignored; vendor them (OFL) before CI goldens.
    final i = args.indexOf('--fonts');
    final from = i >= 0 ? args[i + 1] : '/Library/Fonts';
    for (final w in ['Regular', 'Medium', 'SemiBold']) {
      final src = File(p.join(from, 'Inter-$w.ttf'));
      if (!src.existsSync()) {
        stderr.writeln('missing ${src.path}: goldens need Inter (pass --fonts <dir>)');
        exit(1);
      }
      final dst = File(p.join(out, 'fonts', 'Inter-$w.ttf'))..parent.createSync(recursive: true);
      src.copySync(dst.path);
    }
  }
  stdout.writeln(
    check
        ? 'generated/$packageName is up to date'
        : 'wrote ${files.length} files to generated/$packageName',
  );
}
