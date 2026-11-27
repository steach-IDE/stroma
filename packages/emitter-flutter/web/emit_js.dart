// The emitter as a JavaScript module: `dart compile js web/emit_js.dart`. It registers `stromaEmit` on the global
// object; the npm package's CLI calls it. JSON in, JSON out, so no Dart type crosses the boundary.
import 'dart:convert';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

import 'package:stroma_emitter/emitter.dart';

void main() {
  globalContext.setProperty(
    'stromaEmit'.toJS,
    ((
          JSString dsir,
          JSString mapping,
          JSString templates,
          JSString packageName,
          JSBoolean withFonts,
        ) {
          try {
            final files = emitPackage(
              dsir: (jsonDecode(dsir.toDart) as Map).cast<String, dynamic>(),
              mapping: mapping.toDart.isEmpty
                  ? null
                  : (jsonDecode(mapping.toDart) as Map).cast<String, dynamic>(),
              templates: (jsonDecode(templates.toDart) as Map).cast<String, String>(),
              packageName: packageName.toDart,
              withFonts: withFonts.toDart,
            );
            final decoded = (jsonDecode(dsir.toDart) as Map).cast<String, dynamic>();
            return jsonEncode({
              'files': files,
              'fonts': [
                for (final (file, weight) in fontFiles(decoded)) {'file': file, 'weight': weight},
              ],
            }).toJS;
          } on EmitException catch (e) {
            return jsonEncode({'error': e.message}).toJS;
          }
        })
        .toJS,
  );
}
