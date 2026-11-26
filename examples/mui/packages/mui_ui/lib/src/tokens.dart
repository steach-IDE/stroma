// Generated from the DSIR tokens (DTCG files in dsir/tokens/). Do not edit.
import 'package:flutter/material.dart';

/// Design tokens for one mode. Colours are sRGB conversions of the source OKLCH values.
@immutable
class DsTokens extends ThemeExtension<DsTokens> {
  const DsTokens({
    required this.mode,
    required this.brightness,
    required this.pageColourBackground,
    required this.pageColourForeground,
    this.radius = 0,
    this.fontFamily = 'Roboto',
    this.fontPackage = 'mui_ui',
  });

  /// The theme this set is for, as the design system names it.
  final String mode;
  final Brightness brightness;

  /// `--page-colour-background`
  final Color pageColourBackground;

  /// `--page-colour-foreground`
  final Color pageColourForeground;

  /// `--radius`. The scale below derives from it, as shadcn's `@theme inline` does.
  final double radius;
  final String fontFamily;
  final String? fontPackage;

  /// What components inherit from `body`: the browser's 16px, preflight's line-height
  /// 1.5, and `text-foreground` from the style's base layer.
  TextStyle get bodyText => TextStyle(
    fontFamily: fontFamily,
    package: fontPackage,
    fontSize: 16,
    height: 1.5,
    fontWeight: FontWeight.w400,
    color: pageColourForeground,
    leadingDistribution: TextLeadingDistribution.even,
    decoration: TextDecoration.none,
  );

  static const light = DsTokens(
    mode: 'light',
    brightness: Brightness.light,
    pageColourBackground: Color(0xFFFFFFFF),
    pageColourForeground: Color(0xFF000000),
  );

  static const dark = DsTokens(
    mode: 'dark',
    brightness: Brightness.dark,
    pageColourBackground: Color(0xFF121212),
    pageColourForeground: Color(0xFF000000),
  );

  static const all = [light, dark];

  static DsTokens byMode(String mode) => all.firstWhere((t) => t.mode == mode);

  /// What paints the page, and its text.
  Color get pageBackground => pageColourBackground;
  Color get pageForeground => pageColourForeground;

  @override
  DsTokens copyWith({
    Brightness? brightness,
    Color? pageColourBackground,
    Color? pageColourForeground,
    double? radius,
  }) => DsTokens(
    mode: mode,
    brightness: brightness ?? this.brightness,
    pageColourBackground: pageColourBackground ?? this.pageColourBackground,
    pageColourForeground: pageColourForeground ?? this.pageColourForeground,
    radius: radius ?? this.radius,
    fontFamily: fontFamily,
    fontPackage: fontPackage,
  );

  @override
  DsTokens lerp(DsTokens? other, double t) {
    if (other == null) return this;
    return DsTokens(
      mode: t < 0.5 ? mode : other.mode,
      brightness: t < 0.5 ? brightness : other.brightness,
      pageColourBackground: Color.lerp(pageColourBackground, other.pageColourBackground, t)!,
      pageColourForeground: Color.lerp(pageColourForeground, other.pageColourForeground, t)!,
      radius: radius + (other.radius - radius) * t,
      fontFamily: fontFamily,
      fontPackage: fontPackage,
    );
  }
}
