// Generated from the DSIR. Do not edit.
// ignore_for_file: sort_child_properties_last
import 'package:flutter/widgets.dart';
import 'package:shadcn_neutral_ui/shadcn_neutral_ui.dart';

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
const oracleParts = <String, Type>{'title': CardTitle, 'content': CardContent};

Widget buildNode(Map<String, dynamic> n, {WidgetStatesController? states, bool disabled = false}) {
  final text = n['text'] as String?;
  List<Widget> kids() => [
    for (final c in (n['children'] as List? ?? const [])) buildNode((c as Map).cast()),
  ];
  switch (n[r'$component'] ?? n['type']) {
    case 'Badge':
      return Badge(
        variant: _enumByName(BadgeVariant.values, n['variant'] as String),
        icon: n['icon'] == true ? const OracleIcon() : null,
        child: text == null ? null : Text(text),
        statesController: states,
        onPressed: n['interactive'] == true ? () {} : null,
      );
    case 'Button':
      return Button(
        variant: _enumByName(ButtonVariant.values, n['variant'] as String),
        size: _enumByName(ButtonSize.values, n['size'] as String),
        icon: n['icon'] == true ? const OracleIcon() : null,
        child: text == null ? null : Text(text),
        statesController: states,
        onPressed: disabled ? null : () {},
      );
    case 'Card':
      return Card(children: text == null ? kids() : [Text(text)]);
    case 'CardAction':
      return CardAction(child: text == null ? null : Text(text));
    case 'CardContent':
      return CardContent(child: text == null ? null : Text(text));
    case 'CardDescription':
      return CardDescription(child: text == null ? null : Text(text));
    case 'CardFooter':
      return CardFooter(children: text == null ? kids() : [Text(text)]);
    case 'CardHeader':
      final action = n['action'] as Map?;
      return CardHeader(
        children: text == null ? kids() : [Text(text)],
        action: action == null ? null : buildNode(action.cast()),
      );
    case 'CardTitle':
      return CardTitle(child: text == null ? null : Text(text));
  }
  throw ArgumentError('unknown node ${n[r'$component'] ?? n['type']}');
}
