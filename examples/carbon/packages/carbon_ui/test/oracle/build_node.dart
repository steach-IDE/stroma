// Generated from the DSIR. Do not edit.
// ignore_for_file: sort_child_properties_last
import 'package:flutter/widgets.dart';
import 'package:carbon_ui/carbon_ui.dart';

/// Stands in for an svg icon: a circle of radius 10 in a 24 box, like the HTML fixture's svg.
class OracleIcon extends StatelessWidget {
  const OracleIcon({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = IconTheme.of(context);
    final size = theme.size ?? 24;
    return SizedBox.square(
      dimension: size,
      child: Center(
        child: Container(
          width: size * 20 / 24,
          height: size * 20 / 24,
          decoration: BoxDecoration(color: theme.color, shape: BoxShape.circle),
        ),
      ),
    );
  }
}

T _enumByName<T extends Enum>(List<T> values, String option) {
  if (option == 'default') return values.byName('regular');
  final name = option.replaceAllMapped(RegExp('-+(.)'), (m) => m[1]!.toUpperCase());
  return values.byName(RegExp(r'^\d').hasMatch(name) ? 'v$name' : name);
}

/// Widgets whose geometry the oracle reads by name (a card's title and content).
const oracleParts = <String, Type>{};

Widget buildNode(Map<String, dynamic> n, {WidgetStatesController? states, bool disabled = false}) {
  final text = n['text'] as String?;
  List<Widget> kids() => [
    for (final c in (n['children'] as List? ?? const [])) buildNode((c as Map).cast()),
  ];
  switch (n[r'$component'] ?? n['type']) {
    case 'Button':
      return Button(
        kind: _enumByName(ButtonKind.values, n['kind'] as String),
        size: _enumByName(ButtonSize.values, n['size'] as String),
        children: text == null ? kids() : [Text(text)],
        statesController: states,
        onPressed: disabled ? null : () {},
      );
    case 'Tag':
      return Tag(
        type: _enumByName(TagType.values, n['type'] as String),
        size: _enumByName(TagSize.values, n['size'] as String),
        children: text == null ? kids() : [Text(text)],
      );
    case 'Tile':
      return Tile(
        child: text == null ? null : Text(text),
        statesController: states,
        onPressed: n['interactive'] == true ? () {} : null,
      );
  }
  throw ArgumentError('unknown node ${n[r'$component'] ?? n['type']}');
}
