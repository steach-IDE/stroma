// Generated from the DSIR tokens (DTCG files in dsir/tokens/). Do not edit.
import 'package:flutter/material.dart';

/// Design tokens for one mode. Colours are sRGB conversions of the source OKLCH values.
@immutable
class DsTokens extends ThemeExtension<DsTokens> {
  const DsTokens({
    required this.mode,
    required this.brightness,
    required this.accent,
    required this.accentForeground,
    required this.background,
    required this.border,
    required this.card,
    required this.cardForeground,
    required this.colorWhite,
    required this.destructive,
    required this.foreground,
    required this.input,
    required this.mutedForeground,
    required this.primary,
    required this.primaryForeground,
    required this.ring,
    required this.secondary,
    required this.secondaryForeground,
    this.radius = 10,
    this.fontFamily = 'Inter',
    this.fontPackage = 'shadcn_neutral_ui',
  });

  /// The theme this set is for, as the design system names it.
  final String mode;
  final Brightness brightness;

  /// `--accent`
  final Color accent;

  /// `--accent-foreground`
  final Color accentForeground;

  /// `--background`
  final Color background;

  /// `--border`
  final Color border;

  /// `--card`
  final Color card;

  /// `--card-foreground`
  final Color cardForeground;

  /// `--color-white`
  final Color colorWhite;

  /// `--destructive`
  final Color destructive;

  /// `--foreground`
  final Color foreground;

  /// `--input`
  final Color input;

  /// `--muted-foreground`
  final Color mutedForeground;

  /// `--primary`
  final Color primary;

  /// `--primary-foreground`
  final Color primaryForeground;

  /// `--ring`
  final Color ring;

  /// `--secondary`
  final Color secondary;

  /// `--secondary-foreground`
  final Color secondaryForeground;

  /// `--radius`. The scale below derives from it, as shadcn's `@theme inline` does.
  final double radius;
  final String fontFamily;
  final String? fontPackage;

  /// `--radius-md`: calc(var(--radius) - 2px)
  double get radiusMd => radius - 2;

  /// `--radius-xl`: calc(var(--radius) + 4px)
  double get radiusXl => radius + 4;

  /// What components inherit from `body`: the browser's 16px, preflight's line-height
  /// 1.5, and `text-foreground` from the style's base layer.
  TextStyle get bodyText => TextStyle(
    fontFamily: fontFamily,
    package: fontPackage,
    fontSize: 16,
    height: 1.5,
    fontWeight: FontWeight.w400,
    color: foreground,
    leadingDistribution: TextLeadingDistribution.even,
    decoration: TextDecoration.none,
  );

  static const light = DsTokens(
    mode: 'light',
    brightness: Brightness.light,
    accent: Color(0xFFF5F5F5),
    accentForeground: Color(0xFF171717),
    background: Color(0xFFFFFFFF),
    border: Color(0xFFE5E5E5),
    card: Color(0xFFFFFFFF),
    cardForeground: Color(0xFF0A0A0A),
    colorWhite: Color(0xFFFFFFFF),
    destructive: Color(0xFFE7000B),
    foreground: Color(0xFF0A0A0A),
    input: Color.from(
      alpha: 0.15,
      red: 1,
      green: 1,
      blue: 1,
    ), // not measured in light: no rule reads it there
    mutedForeground: Color(0xFF737373),
    primary: Color(0xFF171717),
    primaryForeground: Color(0xFFFAFAFA),
    ring: Color(0xFFA1A1A1),
    secondary: Color(0xFFF5F5F5),
    secondaryForeground: Color(0xFF171717),
  );

  static const dark = DsTokens(
    mode: 'dark',
    brightness: Brightness.dark,
    accent: Color(0xFF262626),
    accentForeground: Color(0xFFFAFAFA),
    background: Color(0xFF0A0A0A),
    border: Color.from(alpha: 0.1, red: 1, green: 1, blue: 1),
    card: Color(0xFF171717),
    cardForeground: Color(0xFFFAFAFA),
    colorWhite: Color(0xFFFFFFFF),
    destructive: Color(0xFFFF6467),
    foreground: Color(0xFFFAFAFA),
    input: Color.from(alpha: 0.15, red: 1, green: 1, blue: 1),
    mutedForeground: Color(0xFFA1A1A1),
    primary: Color(0xFFE5E5E5),
    primaryForeground: Color(0xFF171717),
    ring: Color(0xFF737373),
    secondary: Color(0xFF262626),
    secondaryForeground: Color(0xFFFAFAFA),
  );

  static const all = [light, dark];

  static DsTokens byMode(String mode) => all.firstWhere((t) => t.mode == mode);

  /// What paints the page, and its text.
  Color get pageBackground => background;
  Color get pageForeground => foreground;

  @override
  DsTokens copyWith({
    Brightness? brightness,
    Color? accent,
    Color? accentForeground,
    Color? background,
    Color? border,
    Color? card,
    Color? cardForeground,
    Color? colorWhite,
    Color? destructive,
    Color? foreground,
    Color? input,
    Color? mutedForeground,
    Color? primary,
    Color? primaryForeground,
    Color? ring,
    Color? secondary,
    Color? secondaryForeground,
    double? radius,
  }) => DsTokens(
    mode: mode,
    brightness: brightness ?? this.brightness,
    accent: accent ?? this.accent,
    accentForeground: accentForeground ?? this.accentForeground,
    background: background ?? this.background,
    border: border ?? this.border,
    card: card ?? this.card,
    cardForeground: cardForeground ?? this.cardForeground,
    colorWhite: colorWhite ?? this.colorWhite,
    destructive: destructive ?? this.destructive,
    foreground: foreground ?? this.foreground,
    input: input ?? this.input,
    mutedForeground: mutedForeground ?? this.mutedForeground,
    primary: primary ?? this.primary,
    primaryForeground: primaryForeground ?? this.primaryForeground,
    ring: ring ?? this.ring,
    secondary: secondary ?? this.secondary,
    secondaryForeground: secondaryForeground ?? this.secondaryForeground,
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
      accent: Color.lerp(accent, other.accent, t)!,
      accentForeground: Color.lerp(accentForeground, other.accentForeground, t)!,
      background: Color.lerp(background, other.background, t)!,
      border: Color.lerp(border, other.border, t)!,
      card: Color.lerp(card, other.card, t)!,
      cardForeground: Color.lerp(cardForeground, other.cardForeground, t)!,
      colorWhite: Color.lerp(colorWhite, other.colorWhite, t)!,
      destructive: Color.lerp(destructive, other.destructive, t)!,
      foreground: Color.lerp(foreground, other.foreground, t)!,
      input: Color.lerp(input, other.input, t)!,
      mutedForeground: Color.lerp(mutedForeground, other.mutedForeground, t)!,
      primary: Color.lerp(primary, other.primary, t)!,
      primaryForeground: Color.lerp(primaryForeground, other.primaryForeground, t)!,
      ring: Color.lerp(ring, other.ring, t)!,
      secondary: Color.lerp(secondary, other.secondary, t)!,
      secondaryForeground: Color.lerp(secondaryForeground, other.secondaryForeground, t)!,
      radius: radius + (other.radius - radius) * t,
      fontFamily: fontFamily,
      fontPackage: fontPackage,
    );
  }
}
