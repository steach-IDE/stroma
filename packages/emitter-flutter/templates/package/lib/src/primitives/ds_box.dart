// Hand-written primitive, copied verbatim into every generated package.
import 'package:flutter/widgets.dart';

import '../tokens.dart';
import 'ds_style.dart';

/// Paints one CSS box from a resolved [DsStyle]: border-box size, padding, background,
/// border, shadow, focus ring, opacity, inherited text and icon style, and flex layout.
class DsBox extends StatelessWidget {
  const DsBox({
    super.key,
    required this.style,
    required this.tokens,
    this.icon = const DsStyle(),
    this.children = const [],
    this.trailing,
    this.resetText = false,
  });

  final DsStyle style;
  final DsStyle icon;
  final DsTokens tokens;
  final List<Widget> children;

  /// The `auto` column of a `grid-cols-[1fr_auto]` grid (a card header's action).
  final Widget? trailing;

  /// A component root starts from the design system's body text, as CSS inherits from `body`,
  /// instead of from whatever text style the host app has around it.
  final bool resetText;

  static MainAxisAlignment _main(DsAlign? a) => switch (a) {
    DsAlign.center => MainAxisAlignment.center,
    DsAlign.end => MainAxisAlignment.end,
    _ => MainAxisAlignment.start,
  };

  static CrossAxisAlignment _cross(DsAlign? a) => switch (a) {
    DsAlign.center => CrossAxisAlignment.center,
    DsAlign.end => CrossAxisAlignment.end,
    _ => CrossAxisAlignment.start,
  };

  Widget _layout() {
    final s = style;
    final gap = s.gap ?? 0;
    switch (s.layout ?? DsLayout.block) {
      case DsLayout.row:
      case DsLayout.inlineRow:
        return Row(
          // inline-flex sizes to content; a fixed width (size-9) still centres its content.
          mainAxisSize: s.layout == DsLayout.inlineRow && s.width == null
              ? MainAxisSize.min
              : MainAxisSize.max,
          mainAxisAlignment: _main(s.mainAlign),
          crossAxisAlignment: _cross(s.crossAlign),
          spacing: gap,
          children: children,
        );
      case DsLayout.column:
        // CSS flex-col defaults to align-items: stretch.
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          spacing: gap,
          children: children,
        );
      case DsLayout.grid:
        final rows = Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          spacing: gap,
          children: children,
        );
        if (trailing == null) return rows;
        return Row(
          crossAxisAlignment: _cross(s.crossAlign),
          spacing: gap,
          children: [
            Expanded(child: rows),
            trailing!,
          ],
        );
      case DsLayout.block:
        if (children.length == 1) return children.single;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: children,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = style;
    final radius = BorderRadius.circular(s.radius ?? 0);
    final borderWidth = s.borderWidth ?? 0;
    final ringWidth = s.ringWidth ?? 0;
    final text = TextStyle(
      fontFamily: tokens.fontFamily,
      package: tokens.fontPackage,
      color: s.foreground,
      fontSize: s.fontSize,
      height: s.lineHeight,
      fontWeight: s.fontWeight,
      decoration: s.underline == true ? TextDecoration.underline : TextDecoration.none,
      decorationColor: s.foreground,
      leadingDistribution: TextLeadingDistribution.even,
    );
    Widget content = IconTheme.merge(
      data: IconThemeData(size: icon.width, color: s.foreground),
      child: _layout(),
    );
    content = resetText
        ? DefaultTextStyle(
            style: tokens.bodyText.merge(text),
            maxLines: s.maxLines,
            softWrap: s.maxLines != 1,
            overflow: s.maxLines == 1 ? TextOverflow.ellipsis : TextOverflow.clip,
            child: content,
          )
        : DefaultTextStyle.merge(
            style: text,
            maxLines: s.maxLines,
            softWrap: s.maxLines == 1 ? false : null,
            overflow: s.maxLines == 1 ? TextOverflow.ellipsis : null,
            child: content,
          );
    final duration = s.transition ?? Duration.zero;
    final curve = s.curve ?? Curves.linear;
    Widget box = AnimatedContainer(
        duration: duration,
        curve: curve,
        height: s.height,
        width: s.width,
        // Container adds the border width to this padding, which is CSS border-box sizing.
        padding: EdgeInsets.fromLTRB(
          s.paddingX ?? 0,
          s.paddingTop ?? s.paddingY ?? 0,
          s.paddingX ?? 0,
          s.paddingBottom ?? s.paddingY ?? 0,
        ),
        clipBehavior: s.clip == true ? Clip.antiAlias : Clip.none,
        decoration: BoxDecoration(
          color: s.background,
          border: borderWidth > 0
              ? Border.all(width: borderWidth, color: s.borderColor ?? const Color(0x00000000))
              : null,
          borderRadius: radius,
          boxShadow: s.shadows,
        ),
        // A Tailwind ring is a spread box-shadow outside the border box, never under it, so it
        // is painted as an outside stroke rather than a BoxShadow (which would fill underneath).
        // (An inset ring, Carbon's borders and focus rings, is painted below, inside the border.)
        foregroundDecoration: ringWidth > 0 && s.ringInset != true
            ? BoxDecoration(
                border: Border.all(
                  width: ringWidth,
                  color: s.ringColor ?? const Color(0x00000000),
                  strokeAlign: BorderSide.strokeAlignOutside,
                ),
                borderRadius: radius,
              )
            : null,
        child: content,
    );
    // CSS paints an inset shadow inside the padding box: inside the border, over the background.
    if (ringWidth > 0 && s.ringInset == true) {
      box = CustomPaint(
        foregroundPainter: _InsetRingPainter(
          inset: borderWidth,
          width: ringWidth,
          color: s.ringColor ?? const Color(0x00000000),
          radius: s.radius ?? 0,
        ),
        child: box,
      );
    }
    return AnimatedOpacity(opacity: s.opacity ?? 1, duration: duration, curve: curve, child: box);
  }
}

/// A ring inside the padding box, as CSS `box-shadow: inset 0 0 0 Wpx colour` draws it: [inset] (the border width)
/// in from the edge, [width] thick, with the corners' radius reduced to match.
class _InsetRingPainter extends CustomPainter {
  const _InsetRingPainter({
    required this.inset,
    required this.width,
    required this.color,
    required this.radius,
  });

  final double inset;
  final double width;
  final Color color;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final outer = RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius)).deflate(inset);
    canvas.drawDRRect(outer, outer.deflate(width), Paint()..color = color);
  }

  @override
  bool shouldRepaint(_InsetRingPainter old) =>
      old.inset != inset || old.width != width || old.color != color || old.radius != radius;
}
