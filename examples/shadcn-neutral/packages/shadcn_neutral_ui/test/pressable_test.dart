// Hand-written, copied into every generated package. Drives DsPressable through real input
// (keyboard, mouse) rather than a preset statesController, which the oracle test uses.
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart' hide Badge, Card;
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shadcn_neutral_ui/shadcn_neutral_ui.dart';

void main() {
  Future<WidgetStatesController> pump(WidgetTester tester, {VoidCallback? onPressed}) async {
    final states = WidgetStatesController();
    addTearDown(states.dispose);
    await tester.pumpWidget(
      MaterialApp(
        home: Center(
          child: Button(statesController: states, onPressed: onPressed, child: const Text('Go')),
        ),
      ),
    );
    return states;
  }

  testWidgets('Tab gives keyboard focus and Enter presses', (tester) async {
    var presses = 0;
    final states = await pump(tester, onPressed: () => presses++);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.pump();
    expect(states.value, contains(WidgetState.focused));
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(presses, 1);
  });

  testWidgets('a mouse over the button is hover', (tester) async {
    final states = await pump(tester, onPressed: () {});
    final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
    addTearDown(mouse.removePointer);
    await mouse.addPointer(location: Offset.zero);
    await mouse.moveTo(tester.getCenter(find.byType(Button)));
    await tester.pump();
    expect(states.value, contains(WidgetState.hovered));
  });

  testWidgets('without onPressed the button is disabled and takes no focus', (tester) async {
    final states = await pump(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.pump();
    expect(states.value, contains(WidgetState.disabled));
    expect(states.value, isNot(contains(WidgetState.focused)));
  });
}
