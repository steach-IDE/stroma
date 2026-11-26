// Generated from the DSIR tokens (DTCG files in dsir/tokens/). Do not edit.
import 'package:flutter/material.dart';

/// Design tokens for one mode. Colours are sRGB conversions of the source OKLCH values.
@immutable
class DsTokens extends ThemeExtension<DsTokens> {
  const DsTokens({
    required this.mode,
    required this.brightness,
    required this.cdsBackground,
    required this.cdsBackgroundHover,
    required this.cdsBackgroundInverse,
    required this.cdsButtonDangerHover,
    required this.cdsButtonDangerPrimary,
    required this.cdsButtonDangerSecondary,
    required this.cdsButtonDisabled,
    required this.cdsButtonPrimary,
    required this.cdsButtonPrimaryHover,
    required this.cdsButtonSecondary,
    required this.cdsButtonSecondaryHover,
    required this.cdsButtonTertiary,
    required this.cdsButtonTertiaryHover,
    required this.cdsLayer,
    required this.cdsLayerHover,
    required this.cdsLinkPrimary,
    required this.cdsLinkPrimaryHover,
    required this.cdsTagBackgroundBlue,
    required this.cdsTagBackgroundCyan,
    required this.cdsTagBackgroundGray,
    required this.cdsTagBackgroundGreen,
    required this.cdsTagBackgroundRed,
    required this.cdsTagBackgroundTeal,
    required this.cdsTagColorBlue,
    required this.cdsTagColorCyan,
    required this.cdsTagColorGray,
    required this.cdsTagColorGreen,
    required this.cdsTagColorRed,
    required this.cdsTagColorTeal,
    required this.cdsTextDisabled,
    required this.cdsTextInverse,
    required this.cdsTextOnColor,
    required this.cdsTextOnColorDisabled,
    required this.cdsTextPrimary,
    this.radius = 0,
    this.fontFamily = 'IBM Plex Sans',
    this.fontPackage = 'carbon_ui',
  });

  /// The theme this set is for, as the design system names it.
  final String mode;
  final Brightness brightness;

  /// `--cds-background`
  final Color cdsBackground;

  /// `--cds-background-hover`
  final Color cdsBackgroundHover;

  /// `--cds-background-inverse`
  final Color cdsBackgroundInverse;

  /// `--cds-button-danger-hover`
  final Color cdsButtonDangerHover;

  /// `--cds-button-danger-primary`
  final Color cdsButtonDangerPrimary;

  /// `--cds-button-danger-secondary`
  final Color cdsButtonDangerSecondary;

  /// `--cds-button-disabled`
  final Color cdsButtonDisabled;

  /// `--cds-button-primary`
  final Color cdsButtonPrimary;

  /// `--cds-button-primary-hover`
  final Color cdsButtonPrimaryHover;

  /// `--cds-button-secondary`
  final Color cdsButtonSecondary;

  /// `--cds-button-secondary-hover`
  final Color cdsButtonSecondaryHover;

  /// `--cds-button-tertiary`
  final Color cdsButtonTertiary;

  /// `--cds-button-tertiary-hover`
  final Color cdsButtonTertiaryHover;

  /// `--cds-layer`
  final Color cdsLayer;

  /// `--cds-layer-hover`
  final Color cdsLayerHover;

  /// `--cds-link-primary`
  final Color cdsLinkPrimary;

  /// `--cds-link-primary-hover`
  final Color cdsLinkPrimaryHover;

  /// `--cds-tag-background-blue`
  final Color cdsTagBackgroundBlue;

  /// `--cds-tag-background-cyan`
  final Color cdsTagBackgroundCyan;

  /// `--cds-tag-background-gray`
  final Color cdsTagBackgroundGray;

  /// `--cds-tag-background-green`
  final Color cdsTagBackgroundGreen;

  /// `--cds-tag-background-red`
  final Color cdsTagBackgroundRed;

  /// `--cds-tag-background-teal`
  final Color cdsTagBackgroundTeal;

  /// `--cds-tag-color-blue`
  final Color cdsTagColorBlue;

  /// `--cds-tag-color-cyan`
  final Color cdsTagColorCyan;

  /// `--cds-tag-color-gray`
  final Color cdsTagColorGray;

  /// `--cds-tag-color-green`
  final Color cdsTagColorGreen;

  /// `--cds-tag-color-red`
  final Color cdsTagColorRed;

  /// `--cds-tag-color-teal`
  final Color cdsTagColorTeal;

  /// `--cds-text-disabled`
  final Color cdsTextDisabled;

  /// `--cds-text-inverse`
  final Color cdsTextInverse;

  /// `--cds-text-on-color`
  final Color cdsTextOnColor;

  /// `--cds-text-on-color-disabled`
  final Color cdsTextOnColorDisabled;

  /// `--cds-text-primary`
  final Color cdsTextPrimary;

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
    color: cdsTextPrimary,
    leadingDistribution: TextLeadingDistribution.even,
    decoration: TextDecoration.none,
  );

  static const g10 = DsTokens(
    mode: 'g10',
    brightness: Brightness.light,
    cdsBackground: Color(0xFFF4F4F4),
    cdsBackgroundHover: Color.from(alpha: 0.122, red: 0.5529, green: 0.5529, blue: 0.5529),
    cdsBackgroundInverse: Color(0xFF393939),
    cdsButtonDangerHover: Color(0xFFB81921),
    cdsButtonDangerPrimary: Color(0xFFDA1E28),
    cdsButtonDangerSecondary: Color(0xFFDA1E28),
    cdsButtonDisabled: Color(0xFFC6C6C6),
    cdsButtonPrimary: Color(0xFF0F62FE),
    cdsButtonPrimaryHover: Color(0xFF0050E6),
    cdsButtonSecondary: Color(0xFF393939),
    cdsButtonSecondaryHover: Color(0xFF474747),
    cdsButtonTertiary: Color(0xFF0F62FE),
    cdsButtonTertiaryHover: Color(0xFF0050E6),
    cdsLayer: Color(0xFFFFFFFF),
    cdsLayerHover: Color(0xFFE8E8E8),
    cdsLinkPrimary: Color(0xFF0F62FE),
    cdsLinkPrimaryHover: Color(0xFF0043CE),
    cdsTagBackgroundBlue: Color(0xFFD0E2FF),
    cdsTagBackgroundCyan: Color(0xFFBAE6FF),
    cdsTagBackgroundGray: Color(0xFFE0E0E0),
    cdsTagBackgroundGreen: Color(0xFFA7F0BA),
    cdsTagBackgroundRed: Color(0xFFFFD7D9),
    cdsTagBackgroundTeal: Color(0xFF9EF0F0),
    cdsTagColorBlue: Color(0xFF0043CE),
    cdsTagColorCyan: Color(0xFF00539A),
    cdsTagColorGray: Color(0xFF161616),
    cdsTagColorGreen: Color(0xFF0E6027),
    cdsTagColorRed: Color(0xFFA2191F),
    cdsTagColorTeal: Color(0xFF005D5D),
    cdsTextDisabled: Color.from(alpha: 0.251, red: 0.0863, green: 0.0863, blue: 0.0863),
    cdsTextInverse: Color(0xFFFFFFFF),
    cdsTextOnColor: Color(0xFFFFFFFF),
    cdsTextOnColorDisabled: Color(0xFF8D8D8D),
    cdsTextPrimary: Color(0xFF161616),
  );

  static const g100 = DsTokens(
    mode: 'g100',
    brightness: Brightness.dark,
    cdsBackground: Color(0xFF161616),
    cdsBackgroundHover: Color.from(alpha: 0.161, red: 0.5529, green: 0.5529, blue: 0.5529),
    cdsBackgroundInverse: Color(0xFFF4F4F4),
    cdsButtonDangerHover: Color(0xFFB81921),
    cdsButtonDangerPrimary: Color(0xFFDA1E28),
    cdsButtonDangerSecondary: Color(0xFFFA4D56),
    cdsButtonDisabled: Color.from(alpha: 0.302, red: 0.5529, green: 0.5529, blue: 0.5529),
    cdsButtonPrimary: Color(0xFF0F62FE),
    cdsButtonPrimaryHover: Color(0xFF0050E6),
    cdsButtonSecondary: Color(0xFF6F6F6F),
    cdsButtonSecondaryHover: Color(0xFF5E5E5E),
    cdsButtonTertiary: Color(0xFFFFFFFF),
    cdsButtonTertiaryHover: Color(0xFFF4F4F4),
    cdsLayer: Color(0xFF262626),
    cdsLayerHover: Color(0xFF333333),
    cdsLinkPrimary: Color(0xFF78A9FF),
    cdsLinkPrimaryHover: Color(0xFFA6C8FF),
    cdsTagBackgroundBlue: Color(0xFF0043CE),
    cdsTagBackgroundCyan: Color(0xFF00539A),
    cdsTagBackgroundGray: Color(0xFF525252),
    cdsTagBackgroundGreen: Color(0xFF0E6027),
    cdsTagBackgroundRed: Color(0xFFA2191F),
    cdsTagBackgroundTeal: Color(0xFF005D5D),
    cdsTagColorBlue: Color(0xFFD0E2FF),
    cdsTagColorCyan: Color(0xFFBAE6FF),
    cdsTagColorGray: Color(0xFFF4F4F4),
    cdsTagColorGreen: Color(0xFFA7F0BA),
    cdsTagColorRed: Color(0xFFFFD7D9),
    cdsTagColorTeal: Color(0xFF9EF0F0),
    cdsTextDisabled: Color.from(alpha: 0.251, red: 0.9569, green: 0.9569, blue: 0.9569),
    cdsTextInverse: Color(0xFF161616),
    cdsTextOnColor: Color(0xFFFFFFFF),
    cdsTextOnColorDisabled: Color.from(alpha: 0.251, red: 1, green: 1, blue: 1),
    cdsTextPrimary: Color(0xFFF4F4F4),
  );

  static const g90 = DsTokens(
    mode: 'g90',
    brightness: Brightness.dark,
    cdsBackground: Color(0xFF262626),
    cdsBackgroundHover: Color.from(alpha: 0.161, red: 0.5529, green: 0.5529, blue: 0.5529),
    cdsBackgroundInverse: Color(0xFFF4F4F4),
    cdsButtonDangerHover: Color(0xFFB81921),
    cdsButtonDangerPrimary: Color(0xFFDA1E28),
    cdsButtonDangerSecondary: Color(0xFFFF8389),
    cdsButtonDisabled: Color.from(alpha: 0.302, red: 0.5529, green: 0.5529, blue: 0.5529),
    cdsButtonPrimary: Color(0xFF0F62FE),
    cdsButtonPrimaryHover: Color(0xFF0050E6),
    cdsButtonSecondary: Color(0xFF6F6F6F),
    cdsButtonSecondaryHover: Color(0xFF5E5E5E),
    cdsButtonTertiary: Color(0xFFFFFFFF),
    cdsButtonTertiaryHover: Color(0xFFF4F4F4),
    cdsLayer: Color(0xFF393939),
    cdsLayerHover: Color(0xFF474747),
    cdsLinkPrimary: Color(0xFF78A9FF),
    cdsLinkPrimaryHover: Color(0xFFA6C8FF),
    cdsTagBackgroundBlue: Color(0xFF0043CE),
    cdsTagBackgroundCyan: Color(0xFF00539A),
    cdsTagBackgroundGray: Color(0xFF525252),
    cdsTagBackgroundGreen: Color(0xFF0E6027),
    cdsTagBackgroundRed: Color(0xFFA2191F),
    cdsTagBackgroundTeal: Color(0xFF005D5D),
    cdsTagColorBlue: Color(0xFFD0E2FF),
    cdsTagColorCyan: Color(0xFFBAE6FF),
    cdsTagColorGray: Color(0xFFF4F4F4),
    cdsTagColorGreen: Color(0xFFA7F0BA),
    cdsTagColorRed: Color(0xFFFFD7D9),
    cdsTagColorTeal: Color(0xFF9EF0F0),
    cdsTextDisabled: Color.from(alpha: 0.251, red: 0.9569, green: 0.9569, blue: 0.9569),
    cdsTextInverse: Color(0xFF161616),
    cdsTextOnColor: Color(0xFFFFFFFF),
    cdsTextOnColorDisabled: Color.from(alpha: 0.251, red: 1, green: 1, blue: 1),
    cdsTextPrimary: Color(0xFFF4F4F4),
  );

  static const white = DsTokens(
    mode: 'white',
    brightness: Brightness.light,
    cdsBackground: Color(0xFFFFFFFF),
    cdsBackgroundHover: Color.from(alpha: 0.122, red: 0.5529, green: 0.5529, blue: 0.5529),
    cdsBackgroundInverse: Color(0xFF393939),
    cdsButtonDangerHover: Color(0xFFB81921),
    cdsButtonDangerPrimary: Color(0xFFDA1E28),
    cdsButtonDangerSecondary: Color(0xFFDA1E28),
    cdsButtonDisabled: Color(0xFFC6C6C6),
    cdsButtonPrimary: Color(0xFF0F62FE),
    cdsButtonPrimaryHover: Color(0xFF0050E6),
    cdsButtonSecondary: Color(0xFF393939),
    cdsButtonSecondaryHover: Color(0xFF474747),
    cdsButtonTertiary: Color(0xFF0F62FE),
    cdsButtonTertiaryHover: Color(0xFF0050E6),
    cdsLayer: Color(0xFFF4F4F4),
    cdsLayerHover: Color(0xFFE8E8E8),
    cdsLinkPrimary: Color(0xFF0F62FE),
    cdsLinkPrimaryHover: Color(0xFF0043CE),
    cdsTagBackgroundBlue: Color(0xFFD0E2FF),
    cdsTagBackgroundCyan: Color(0xFFBAE6FF),
    cdsTagBackgroundGray: Color(0xFFE0E0E0),
    cdsTagBackgroundGreen: Color(0xFFA7F0BA),
    cdsTagBackgroundRed: Color(0xFFFFD7D9),
    cdsTagBackgroundTeal: Color(0xFF9EF0F0),
    cdsTagColorBlue: Color(0xFF0043CE),
    cdsTagColorCyan: Color(0xFF00539A),
    cdsTagColorGray: Color(0xFF161616),
    cdsTagColorGreen: Color(0xFF0E6027),
    cdsTagColorRed: Color(0xFFA2191F),
    cdsTagColorTeal: Color(0xFF005D5D),
    cdsTextDisabled: Color.from(alpha: 0.251, red: 0.0863, green: 0.0863, blue: 0.0863),
    cdsTextInverse: Color(0xFFFFFFFF),
    cdsTextOnColor: Color(0xFFFFFFFF),
    cdsTextOnColorDisabled: Color(0xFF8D8D8D),
    cdsTextPrimary: Color(0xFF161616),
  );

  static const light = white;
  static const dark = g100;
  static const all = [g10, g100, g90, white];

  static DsTokens byMode(String mode) => all.firstWhere((t) => t.mode == mode);

  /// What paints the page, and its text.
  Color get pageBackground => cdsBackground;
  Color get pageForeground => cdsTextPrimary;

  @override
  DsTokens copyWith({
    Brightness? brightness,
    Color? cdsBackground,
    Color? cdsBackgroundHover,
    Color? cdsBackgroundInverse,
    Color? cdsButtonDangerHover,
    Color? cdsButtonDangerPrimary,
    Color? cdsButtonDangerSecondary,
    Color? cdsButtonDisabled,
    Color? cdsButtonPrimary,
    Color? cdsButtonPrimaryHover,
    Color? cdsButtonSecondary,
    Color? cdsButtonSecondaryHover,
    Color? cdsButtonTertiary,
    Color? cdsButtonTertiaryHover,
    Color? cdsLayer,
    Color? cdsLayerHover,
    Color? cdsLinkPrimary,
    Color? cdsLinkPrimaryHover,
    Color? cdsTagBackgroundBlue,
    Color? cdsTagBackgroundCyan,
    Color? cdsTagBackgroundGray,
    Color? cdsTagBackgroundGreen,
    Color? cdsTagBackgroundRed,
    Color? cdsTagBackgroundTeal,
    Color? cdsTagColorBlue,
    Color? cdsTagColorCyan,
    Color? cdsTagColorGray,
    Color? cdsTagColorGreen,
    Color? cdsTagColorRed,
    Color? cdsTagColorTeal,
    Color? cdsTextDisabled,
    Color? cdsTextInverse,
    Color? cdsTextOnColor,
    Color? cdsTextOnColorDisabled,
    Color? cdsTextPrimary,
    double? radius,
  }) => DsTokens(
    mode: mode,
    brightness: brightness ?? this.brightness,
    cdsBackground: cdsBackground ?? this.cdsBackground,
    cdsBackgroundHover: cdsBackgroundHover ?? this.cdsBackgroundHover,
    cdsBackgroundInverse: cdsBackgroundInverse ?? this.cdsBackgroundInverse,
    cdsButtonDangerHover: cdsButtonDangerHover ?? this.cdsButtonDangerHover,
    cdsButtonDangerPrimary: cdsButtonDangerPrimary ?? this.cdsButtonDangerPrimary,
    cdsButtonDangerSecondary: cdsButtonDangerSecondary ?? this.cdsButtonDangerSecondary,
    cdsButtonDisabled: cdsButtonDisabled ?? this.cdsButtonDisabled,
    cdsButtonPrimary: cdsButtonPrimary ?? this.cdsButtonPrimary,
    cdsButtonPrimaryHover: cdsButtonPrimaryHover ?? this.cdsButtonPrimaryHover,
    cdsButtonSecondary: cdsButtonSecondary ?? this.cdsButtonSecondary,
    cdsButtonSecondaryHover: cdsButtonSecondaryHover ?? this.cdsButtonSecondaryHover,
    cdsButtonTertiary: cdsButtonTertiary ?? this.cdsButtonTertiary,
    cdsButtonTertiaryHover: cdsButtonTertiaryHover ?? this.cdsButtonTertiaryHover,
    cdsLayer: cdsLayer ?? this.cdsLayer,
    cdsLayerHover: cdsLayerHover ?? this.cdsLayerHover,
    cdsLinkPrimary: cdsLinkPrimary ?? this.cdsLinkPrimary,
    cdsLinkPrimaryHover: cdsLinkPrimaryHover ?? this.cdsLinkPrimaryHover,
    cdsTagBackgroundBlue: cdsTagBackgroundBlue ?? this.cdsTagBackgroundBlue,
    cdsTagBackgroundCyan: cdsTagBackgroundCyan ?? this.cdsTagBackgroundCyan,
    cdsTagBackgroundGray: cdsTagBackgroundGray ?? this.cdsTagBackgroundGray,
    cdsTagBackgroundGreen: cdsTagBackgroundGreen ?? this.cdsTagBackgroundGreen,
    cdsTagBackgroundRed: cdsTagBackgroundRed ?? this.cdsTagBackgroundRed,
    cdsTagBackgroundTeal: cdsTagBackgroundTeal ?? this.cdsTagBackgroundTeal,
    cdsTagColorBlue: cdsTagColorBlue ?? this.cdsTagColorBlue,
    cdsTagColorCyan: cdsTagColorCyan ?? this.cdsTagColorCyan,
    cdsTagColorGray: cdsTagColorGray ?? this.cdsTagColorGray,
    cdsTagColorGreen: cdsTagColorGreen ?? this.cdsTagColorGreen,
    cdsTagColorRed: cdsTagColorRed ?? this.cdsTagColorRed,
    cdsTagColorTeal: cdsTagColorTeal ?? this.cdsTagColorTeal,
    cdsTextDisabled: cdsTextDisabled ?? this.cdsTextDisabled,
    cdsTextInverse: cdsTextInverse ?? this.cdsTextInverse,
    cdsTextOnColor: cdsTextOnColor ?? this.cdsTextOnColor,
    cdsTextOnColorDisabled: cdsTextOnColorDisabled ?? this.cdsTextOnColorDisabled,
    cdsTextPrimary: cdsTextPrimary ?? this.cdsTextPrimary,
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
      cdsBackground: Color.lerp(cdsBackground, other.cdsBackground, t)!,
      cdsBackgroundHover: Color.lerp(cdsBackgroundHover, other.cdsBackgroundHover, t)!,
      cdsBackgroundInverse: Color.lerp(cdsBackgroundInverse, other.cdsBackgroundInverse, t)!,
      cdsButtonDangerHover: Color.lerp(cdsButtonDangerHover, other.cdsButtonDangerHover, t)!,
      cdsButtonDangerPrimary: Color.lerp(cdsButtonDangerPrimary, other.cdsButtonDangerPrimary, t)!,
      cdsButtonDangerSecondary: Color.lerp(
        cdsButtonDangerSecondary,
        other.cdsButtonDangerSecondary,
        t,
      )!,
      cdsButtonDisabled: Color.lerp(cdsButtonDisabled, other.cdsButtonDisabled, t)!,
      cdsButtonPrimary: Color.lerp(cdsButtonPrimary, other.cdsButtonPrimary, t)!,
      cdsButtonPrimaryHover: Color.lerp(cdsButtonPrimaryHover, other.cdsButtonPrimaryHover, t)!,
      cdsButtonSecondary: Color.lerp(cdsButtonSecondary, other.cdsButtonSecondary, t)!,
      cdsButtonSecondaryHover: Color.lerp(
        cdsButtonSecondaryHover,
        other.cdsButtonSecondaryHover,
        t,
      )!,
      cdsButtonTertiary: Color.lerp(cdsButtonTertiary, other.cdsButtonTertiary, t)!,
      cdsButtonTertiaryHover: Color.lerp(cdsButtonTertiaryHover, other.cdsButtonTertiaryHover, t)!,
      cdsLayer: Color.lerp(cdsLayer, other.cdsLayer, t)!,
      cdsLayerHover: Color.lerp(cdsLayerHover, other.cdsLayerHover, t)!,
      cdsLinkPrimary: Color.lerp(cdsLinkPrimary, other.cdsLinkPrimary, t)!,
      cdsLinkPrimaryHover: Color.lerp(cdsLinkPrimaryHover, other.cdsLinkPrimaryHover, t)!,
      cdsTagBackgroundBlue: Color.lerp(cdsTagBackgroundBlue, other.cdsTagBackgroundBlue, t)!,
      cdsTagBackgroundCyan: Color.lerp(cdsTagBackgroundCyan, other.cdsTagBackgroundCyan, t)!,
      cdsTagBackgroundGray: Color.lerp(cdsTagBackgroundGray, other.cdsTagBackgroundGray, t)!,
      cdsTagBackgroundGreen: Color.lerp(cdsTagBackgroundGreen, other.cdsTagBackgroundGreen, t)!,
      cdsTagBackgroundRed: Color.lerp(cdsTagBackgroundRed, other.cdsTagBackgroundRed, t)!,
      cdsTagBackgroundTeal: Color.lerp(cdsTagBackgroundTeal, other.cdsTagBackgroundTeal, t)!,
      cdsTagColorBlue: Color.lerp(cdsTagColorBlue, other.cdsTagColorBlue, t)!,
      cdsTagColorCyan: Color.lerp(cdsTagColorCyan, other.cdsTagColorCyan, t)!,
      cdsTagColorGray: Color.lerp(cdsTagColorGray, other.cdsTagColorGray, t)!,
      cdsTagColorGreen: Color.lerp(cdsTagColorGreen, other.cdsTagColorGreen, t)!,
      cdsTagColorRed: Color.lerp(cdsTagColorRed, other.cdsTagColorRed, t)!,
      cdsTagColorTeal: Color.lerp(cdsTagColorTeal, other.cdsTagColorTeal, t)!,
      cdsTextDisabled: Color.lerp(cdsTextDisabled, other.cdsTextDisabled, t)!,
      cdsTextInverse: Color.lerp(cdsTextInverse, other.cdsTextInverse, t)!,
      cdsTextOnColor: Color.lerp(cdsTextOnColor, other.cdsTextOnColor, t)!,
      cdsTextOnColorDisabled: Color.lerp(cdsTextOnColorDisabled, other.cdsTextOnColorDisabled, t)!,
      cdsTextPrimary: Color.lerp(cdsTextPrimary, other.cdsTextPrimary, t)!,
      radius: radius + (other.radius - radius) * t,
      fontFamily: fontFamily,
      fontPackage: fontPackage,
    );
  }
}
