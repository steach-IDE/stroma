// Hand-written, copied verbatim into every generated package.
import 'package:flutter/material.dart' show Theme;
import 'package:flutter/widgets.dart';

import 'tokens.dart';

/// Supplies [DsTokens] below it. Without one, components use the tokens registered on the
/// ambient `ThemeData` as an extension, else the generated light or dark set by brightness.
class DsTheme extends InheritedWidget {
  const DsTheme({super.key, required this.tokens, required super.child});

  final DsTokens tokens;

  static DsTokens of(BuildContext context) {
    final scoped = context.dependOnInheritedWidgetOfExactType<DsTheme>();
    if (scoped != null) return scoped.tokens;
    final theme = Theme.of(context);
    return theme.extension<DsTokens>() ??
        (theme.brightness == Brightness.dark ? DsTokens.dark : DsTokens.light);
  }

  @override
  bool updateShouldNotify(DsTheme oldWidget) => tokens != oldWidget.tokens;
}
