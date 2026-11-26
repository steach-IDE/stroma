// Generated from the DSIR tokens (DTCG files in dsir/tokens/). Do not edit.
import 'package:flutter/material.dart';

/// Design tokens for one mode. Colours are sRGB conversions of the source OKLCH values.
@immutable
class DsTokens extends ThemeExtension<DsTokens> {
  const DsTokens({
    required this.brightness,
    required this.background,
    required this.foreground,
    required this.card,
    required this.cardForeground,
    required this.popover,
    required this.popoverForeground,
    required this.primary,
    required this.primaryForeground,
    required this.secondary,
    required this.secondaryForeground,
    required this.muted,
    required this.mutedForeground,
    required this.accent,
    required this.accentForeground,
    required this.destructive,
    required this.border,
    required this.input,
    required this.ring,
    this.radius = 10,
    this.fontFamily = 'Inter',
    this.fontPackage = 'shadcn_neutral_ui',
  });

  final Brightness brightness;

  /// `--background`
  final Color background;

  /// `--foreground`
  final Color foreground;

  /// `--card`
  final Color card;

  /// `--card-foreground`
  final Color cardForeground;

  /// `--popover`
  final Color popover;

  /// `--popover-foreground`
  final Color popoverForeground;

  /// `--primary`
  final Color primary;

  /// `--primary-foreground`
  final Color primaryForeground;

  /// `--secondary`
  final Color secondary;

  /// `--secondary-foreground`
  final Color secondaryForeground;

  /// `--muted`
  final Color muted;

  /// `--muted-foreground`
  final Color mutedForeground;

  /// `--accent`
  final Color accent;

  /// `--accent-foreground`
  final Color accentForeground;

  /// `--destructive`
  final Color destructive;

  /// `--border`
  final Color border;

  /// `--input`
  final Color input;

  /// `--ring`
  final Color ring;

  /// `--radius`. The scale below derives from it, as shadcn's `@theme inline` does.
  final double radius;
  final String fontFamily;
  final String? fontPackage;

  /// `--radius-sm`: calc(var(--radius) - 4px)
  double get radiusSm => radius - 4;

  /// `--radius-md`: calc(var(--radius) - 2px)
  double get radiusMd => radius - 2;

  /// `--radius-lg`: calc(var(--radius) + 0px)
  double get radiusLg => radius;

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
    brightness: Brightness.light,
    background: Color(0xFFFFFFFF),
    foreground: Color(0xFF0A0A0A),
    card: Color(0xFFFFFFFF),
    cardForeground: Color(0xFF0A0A0A),
    popover: Color(0xFFFFFFFF),
    popoverForeground: Color(0xFF0A0A0A),
    primary: Color(0xFF171717),
    primaryForeground: Color(0xFFFAFAFA),
    secondary: Color(0xFFF5F5F5),
    secondaryForeground: Color(0xFF171717),
    muted: Color(0xFFF5F5F5),
    mutedForeground: Color(0xFF737373),
    accent: Color(0xFFF5F5F5),
    accentForeground: Color(0xFF171717),
    destructive: Color(0xFFE7000B),
    border: Color(0xFFE5E5E5),
    input: Color(0xFFE5E5E5),
    ring: Color(0xFFA1A1A1),
  );

  static const dark = DsTokens(
    brightness: Brightness.dark,
    background: Color(0xFF0A0A0A),
    foreground: Color(0xFFFAFAFA),
    card: Color(0xFF171717),
    cardForeground: Color(0xFFFAFAFA),
    popover: Color(0xFF171717),
    popoverForeground: Color(0xFFFAFAFA),
    primary: Color(0xFFE5E5E5),
    primaryForeground: Color(0xFF171717),
    secondary: Color(0xFF262626),
    secondaryForeground: Color(0xFFFAFAFA),
    muted: Color(0xFF262626),
    mutedForeground: Color(0xFFA1A1A1),
    accent: Color(0xFF262626),
    accentForeground: Color(0xFFFAFAFA),
    destructive: Color(0xFFFF6467),
    border: Color.from(alpha: 0.1, red: 1, green: 1, blue: 1),
    input: Color.from(alpha: 0.15, red: 1, green: 1, blue: 1),
    ring: Color(0xFF737373),
  );

  @override
  DsTokens copyWith({
    Brightness? brightness,
    Color? background,
    Color? foreground,
    Color? card,
    Color? cardForeground,
    Color? popover,
    Color? popoverForeground,
    Color? primary,
    Color? primaryForeground,
    Color? secondary,
    Color? secondaryForeground,
    Color? muted,
    Color? mutedForeground,
    Color? accent,
    Color? accentForeground,
    Color? destructive,
    Color? border,
    Color? input,
    Color? ring,
    double? radius,
  }) => DsTokens(
    brightness: brightness ?? this.brightness,
    background: background ?? this.background,
    foreground: foreground ?? this.foreground,
    card: card ?? this.card,
    cardForeground: cardForeground ?? this.cardForeground,
    popover: popover ?? this.popover,
    popoverForeground: popoverForeground ?? this.popoverForeground,
    primary: primary ?? this.primary,
    primaryForeground: primaryForeground ?? this.primaryForeground,
    secondary: secondary ?? this.secondary,
    secondaryForeground: secondaryForeground ?? this.secondaryForeground,
    muted: muted ?? this.muted,
    mutedForeground: mutedForeground ?? this.mutedForeground,
    accent: accent ?? this.accent,
    accentForeground: accentForeground ?? this.accentForeground,
    destructive: destructive ?? this.destructive,
    border: border ?? this.border,
    input: input ?? this.input,
    ring: ring ?? this.ring,
    radius: radius ?? this.radius,
    fontFamily: fontFamily,
    fontPackage: fontPackage,
  );

  @override
  DsTokens lerp(DsTokens? other, double t) {
    if (other == null) return this;
    return DsTokens(
      brightness: t < 0.5 ? brightness : other.brightness,
      background: Color.lerp(background, other.background, t)!,
      foreground: Color.lerp(foreground, other.foreground, t)!,
      card: Color.lerp(card, other.card, t)!,
      cardForeground: Color.lerp(cardForeground, other.cardForeground, t)!,
      popover: Color.lerp(popover, other.popover, t)!,
      popoverForeground: Color.lerp(popoverForeground, other.popoverForeground, t)!,
      primary: Color.lerp(primary, other.primary, t)!,
      primaryForeground: Color.lerp(primaryForeground, other.primaryForeground, t)!,
      secondary: Color.lerp(secondary, other.secondary, t)!,
      secondaryForeground: Color.lerp(secondaryForeground, other.secondaryForeground, t)!,
      muted: Color.lerp(muted, other.muted, t)!,
      mutedForeground: Color.lerp(mutedForeground, other.mutedForeground, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      accentForeground: Color.lerp(accentForeground, other.accentForeground, t)!,
      destructive: Color.lerp(destructive, other.destructive, t)!,
      border: Color.lerp(border, other.border, t)!,
      input: Color.lerp(input, other.input, t)!,
      ring: Color.lerp(ring, other.ring, t)!,
      radius: radius + (other.radius - radius) * t,
      fontFamily: fontFamily,
      fontPackage: fontPackage,
    );
  }
}
