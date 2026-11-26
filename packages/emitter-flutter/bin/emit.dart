// dart run bin/emit.dart [--check] [--dsir <file>] [--mapping <file> | --no-mapping] [--package <name>] [--out <dir>] [--fonts <dir>]
// Emits a Flutter package from a DSIR. The defaults build the shadcn example in examples/shadcn-neutral.
// --check fails if the committed output differs from what would be written, or holds files no longer emitted.
// --fonts is where Inter-{Regular,Medium,SemiBold}.ttf are copied from (default: the pinned copy that
// tool/fetch-fonts.sh keeps in .stroma/fonts/inter-4.1).
import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:stroma_emitter/emitter.dart';

Future<void> main(List<String> args) async {
  final root = p.dirname(p.dirname(Platform.script.toFilePath()));
  final repo = p.normalize(p.join(root, '..', '..'));
  String option(String name, String fallback) {
    final i = args.indexOf('--$name');
    return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
  }

  final dsirPath = option(
    'dsir',
    p.join(repo, 'examples', 'shadcn-neutral', 'inferred', 'shadcn.dsir.json'),
  );
  final mappingPath = option(
    'mapping',
    p.join(repo, 'packages', 'adapter-scrib', 'mappings', 'shadcn.scrib.json'),
  );
  final packageName = option('package', 'shadcn_neutral_ui');
  final out = option('out', p.join(repo, 'examples', 'shadcn-neutral', 'packages', packageName));
  Map<String, dynamic> readJson(String path) =>
      jsonDecode(File(path).readAsStringSync()) as Map<String, dynamic>;

  final templateDir = Directory(p.join(root, 'templates', 'package'));
  final templates = <String, String>{
    for (final f
        in templateDir
            .listSync(recursive: true)
            .whereType<File>()
            .where((f) => !p.basename(f.path).startsWith('.')) // .DS_Store and friends
            .toList()
          ..sort((a, b) => a.path.compareTo(b.path)))
      p.posix.joinAll(p.split(p.relative(f.path, from: templateDir.path))): f.readAsStringSync(),
  };
  final dsir = readJson(dsirPath);
  final files = emitPackage(
    dsir: dsir,
    mapping: args.contains('--no-mapping') ? null : readJson(mappingPath),
    templates: templates,
    packageName: packageName,
  );

  final check = args.contains('--check');
  var stale = 0;
  for (final e in files.entries) {
    final file = File(p.join(out, e.key));
    if (check) {
      if (!file.existsSync() || file.readAsStringSync() != e.value) {
        stderr.writeln('stale: ${p.relative(file.path, from: repo)}');
        stale++;
      }
    } else {
      file.parent.createSync(recursive: true);
      file.writeAsStringSync(e.value);
    }
  }
  // Files the emitter owns but no longer writes (a renamed or removed component). Fonts, goldens
  // (written by flutter test) and tool output are not the emitter's.
  final outDir = Directory(out);
  final leftovers = outDir.existsSync()
      ? outDir
            .listSync(recursive: true)
            .whereType<File>()
            .map((f) => p.posix.joinAll(p.split(p.relative(f.path, from: out))))
            .where((rel) => !files.containsKey(rel))
            .where((rel) => !RegExp(r'^(fonts|build|\.dart_tool|test/goldens)/').hasMatch(rel))
            .where((rel) => !p.basename(rel).startsWith('.') && rel != 'pubspec.lock')
            .toList()
      : <String>[];
  for (final rel in leftovers) {
    if (check) {
      stderr.writeln('stale: ${p.relative(p.join(out, rel), from: repo)} is no longer emitted');
      stale++;
    } else {
      File(p.join(out, rel)).deleteSync();
    }
  }
  if (stale > 0) exit(1);
  if (!check) {
    // Goldens are only reproducible with the exact font bytes, so the default is a pinned copy.
    final family = (((dsir['tokens'] as Map)['font'] as Map?)?['sans'] as Map?)?['family'];
    final pinned = {'Inter': 'inter-4.1', 'IBM Plex Sans': 'plex-sans-1.1.0'}[family];
    final i = args.indexOf('--fonts');
    if (i < 0 && pinned == null) {
      stderr.writeln('$family has no pinned fonts: pass --fonts <dir> with its .ttf files');
      exit(1);
    }
    final from = i >= 0 ? args[i + 1] : p.join(repo, '.stroma', 'fonts', pinned);
    for (final (file, _) in fontFiles(dsir)) {
      final src = File(p.join(from, file));
      if (!src.existsSync()) {
        stderr.writeln(
          'missing ${src.path}: run tool/fetch-fonts.sh or tool/fetch-plex.sh first, or pass --fonts <dir>',
        );
        exit(1);
      }
      final dst = File(p.join(out, 'fonts', file))..parent.createSync(recursive: true);
      src.copySync(dst.path);
    }
    // The fonts' licence travels with them.
    final licence = File(p.join(from, 'LICENSE.txt'));
    if (licence.existsSync()) licence.copySync(p.join(out, 'fonts', 'LICENSE.txt'));
  }
  stdout.writeln(
    check
        ? '${p.relative(out, from: repo)} is up to date'
        : 'wrote ${files.length} files to ${p.relative(out, from: repo)}',
  );
}
