// Hand-written primitive, copied verbatim into every generated package.
import 'package:flutter/widgets.dart';

/// How a box lays out its children: CSS block, flex row, inline-flex row, flex column, or grid.
enum DsLayout { block, row, inlineRow, column, grid }

enum DsAlign { start, center, end }

/// Resolved style of one box. Generated resolvers build it by merging rules in CSS cascade
/// order, so a later [merge] wins, like a later CSS rule.
@immutable
class DsStyle {
  const DsStyle({
    this.layout,
    this.crossAlign,
    this.mainAlign,
    this.gap,
    this.height,
    this.width,
    this.paddingX,
    this.paddingY,
    this.paddingTop,
    this.paddingBottom,
    this.radius,
    this.background,
    this.foreground,
    this.borderWidth,
    this.borderColor,
    this.ringWidth,
    this.ringColor,
    this.shadows,
    this.opacity,
    this.fontSize,
    this.lineHeight,
    this.fontWeight,
    this.underline,
    this.maxLines,
    this.clip,
    this.transition,
    this.curve,
  });

  final DsLayout? layout;
  final DsAlign? crossAlign;
  final DsAlign? mainAlign;
  final double? gap;
  final double? height;
  final double? width;
  final double? paddingX;
  final double? paddingY;
  final double? paddingTop;
  final double? paddingBottom;
  final double? radius;
  final Color? background;
  final Color? foreground;
  final double? borderWidth;
  final Color? borderColor;
  final double? ringWidth;
  final Color? ringColor;
  final List<BoxShadow>? shadows;
  final double? opacity;
  final double? fontSize;

  /// A factor of [fontSize], like unitless CSS line-height and Flutter's `TextStyle.height`.
  final double? lineHeight;
  final FontWeight? fontWeight;
  final bool? underline;
  final int? maxLines;
  final bool? clip;
  final Duration? transition;
  final Curve? curve;

  DsStyle merge(DsStyle o) => DsStyle(
        layout: o.layout ?? layout,
        crossAlign: o.crossAlign ?? crossAlign,
        mainAlign: o.mainAlign ?? mainAlign,
        gap: o.gap ?? gap,
        height: o.height ?? height,
        width: o.width ?? width,
        paddingX: o.paddingX ?? paddingX,
        paddingY: o.paddingY ?? paddingY,
        paddingTop: o.paddingTop ?? paddingTop,
        paddingBottom: o.paddingBottom ?? paddingBottom,
        radius: o.radius ?? radius,
        background: o.background ?? background,
        foreground: o.foreground ?? foreground,
        borderWidth: o.borderWidth ?? borderWidth,
        borderColor: o.borderColor ?? borderColor,
        ringWidth: o.ringWidth ?? ringWidth,
        ringColor: o.ringColor ?? ringColor,
        shadows: o.shadows ?? shadows,
        opacity: o.opacity ?? opacity,
        fontSize: o.fontSize ?? fontSize,
        lineHeight: o.lineHeight ?? lineHeight,
        fontWeight: o.fontWeight ?? fontWeight,
        underline: o.underline ?? underline,
        maxLines: o.maxLines ?? maxLines,
        clip: o.clip ?? clip,
        transition: o.transition ?? transition,
        curve: o.curve ?? curve,
      );
}

extension DsColor on Color {
  /// Tailwind's `bg-x/NN` is `color-mix(in oklab, x NN%, transparent)`: the same colour with
  /// its alpha scaled, including a token that already has alpha.
  Color scaleAlpha(double factor) => withValues(alpha: a * factor);
}
