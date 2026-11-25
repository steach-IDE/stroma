// Hand-written primitive, copied verbatim into every generated package.
import 'package:flutter/widgets.dart';

/// Button behaviour written once: hover, keyboard-only focus (CSS :focus-visible), press,
/// Enter/Space activation, disabled, and button semantics. Style comes from [builder].
class DsPressable extends StatefulWidget {
  const DsPressable({
    super.key,
    required this.onPressed,
    required this.builder,
    this.error = false,
    this.statesController,
    this.focusNode,
    this.autofocus = false,
    this.semanticLabel,
  });

  /// Null disables the control, like `disabled` on a `<button>`.
  final VoidCallback? onPressed;
  final Widget Function(BuildContext context, Set<WidgetState> states) builder;

  /// `aria-invalid`, shown as [WidgetState.error].
  final bool error;
  final WidgetStatesController? statesController;
  final FocusNode? focusNode;
  final bool autofocus;
  final String? semanticLabel;

  @override
  State<DsPressable> createState() => _DsPressableState();
}

class _DsPressableState extends State<DsPressable> {
  WidgetStatesController? _own;
  WidgetStatesController get _states =>
      widget.statesController ?? (_own ??= WidgetStatesController());

  bool get _enabled => widget.onPressed != null;

  @override
  void initState() {
    super.initState();
    _states.addListener(_changed);
    _sync();
  }

  @override
  void didUpdateWidget(DsPressable old) {
    super.didUpdateWidget(old);
    if (old.statesController != widget.statesController) {
      (old.statesController ?? _own)?.removeListener(_changed);
      _states.addListener(_changed);
    }
    _sync();
  }

  void _sync() {
    _states.update(WidgetState.disabled, !_enabled);
    _states.update(WidgetState.error, widget.error);
    if (!_enabled) _states.update(WidgetState.pressed, false);
  }

  void _changed() => setState(() {});

  @override
  void dispose() {
    _states.removeListener(_changed);
    _own?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      enabled: _enabled,
      label: widget.semanticLabel,
      child: FocusableActionDetector(
        enabled: _enabled,
        focusNode: widget.focusNode,
        autofocus: widget.autofocus,
        mouseCursor: _enabled ? SystemMouseCursors.click : MouseCursor.defer,
        onShowHoverHighlight: (v) => _states.update(WidgetState.hovered, v),
        onShowFocusHighlight: (v) => _states.update(WidgetState.focused, v),
        actions: {
          ActivateIntent: CallbackAction<ActivateIntent>(onInvoke: (_) => widget.onPressed?.call()),
        },
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapDown: _enabled ? (_) => _states.update(WidgetState.pressed, true) : null,
          onTapUp: _enabled ? (_) => _states.update(WidgetState.pressed, false) : null,
          onTapCancel: _enabled ? () => _states.update(WidgetState.pressed, false) : null,
          onTap: widget.onPressed,
          child: widget.builder(context, _states.value),
        ),
      ),
    );
  }
}
