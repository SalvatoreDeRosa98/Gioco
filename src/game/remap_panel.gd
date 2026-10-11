extends Control
## Rimappatura comandi: per ogni azione un pulsante tastiera e uno controller. Premendone uno
## il pannello aspetta il nuovo tasto/pulsante (Canc annulla) e salva subito (vedi InputRemap).

signal closed

## Secondi di attesa del nuovo tasto prima di annullare.
const CAPTURE_TIME := 6.0

var _buttons := {}  # action -> [key_button, pad_button]
var _capture_action := ""
var _capture_pad := false
var _capture_t := 0.0
var _status: Label
var _first: Button
var _back: Button


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var bg := ColorRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0.015, 0.02, 0.03, 0.96)
	add_child(bg)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right"]:
		margin.add_theme_constant_override("margin_" + side, 220)
	margin.add_theme_constant_override("margin_top", 24)
	margin.add_theme_constant_override("margin_bottom", 20)
	add_child(margin)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 8)
	margin.add_child(box)
	box.add_child(PanelUi.title("COMANDI"))
	var head := HBoxContainer.new()
	for cap in ["Azione", "Tastiera", "Controller"]:
		var l := PanelUi.section(cap)
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		head.add_child(l)
	box.add_child(head)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	box.add_child(scroll)
	var list := VBoxContainer.new()
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override("separation", 2)
	scroll.add_child(list)
	for action in InputRemap.ACTIONS:
		var h := HBoxContainer.new()
		var l := Label.new()
		l.text = InputRemap.ACTIONS[action]
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		l.add_theme_font_override("font", Art.body_font())
		l.add_theme_font_size_override("font_size", 20)
		l.add_theme_color_override("font_color", Art.CREMA)
		h.add_child(l)
		var pair := []
		for pad in [false, true]:
			var b := PanelUi.button("", 34.0)
			b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			b.add_theme_font_override("font", Art.body_font())
			b.add_theme_font_size_override("font_size", 19)
			b.pressed.connect(_start_capture.bind(action, pad))
			h.add_child(b)
			pair.append(b)
			if _first == null:
				_first = b
		_buttons[action] = pair
		list.add_child(h)
	_status = Label.new()
	_status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status.add_theme_font_override("font", Art.body_font())
	_status.add_theme_font_size_override("font_size", 18)
	_status.add_theme_color_override("font_color", Art.OCRA)
	box.add_child(_status)
	var bottom := HBoxContainer.new()
	bottom.alignment = BoxContainer.ALIGNMENT_CENTER
	bottom.add_theme_constant_override("separation", 40)
	var reset := PanelUi.button("Ripristina predefiniti")
	reset.pressed.connect(func() -> void:
		InputRemap.reset()
		InputRemap.delete_saved()
		_status.text = "Comandi riportati ai valori predefiniti"
		refresh())
	bottom.add_child(reset)
	_back = PanelUi.button("Indietro")
	_back.pressed.connect(close)
	bottom.add_child(_back)
	box.add_child(bottom)
	refresh()


func refresh() -> void:
	for action in _buttons:
		_buttons[action][0].text = InputRemap.label(action, false)
		_buttons[action][1].text = InputRemap.label(action, true)


func open() -> void:
	_capture_action = ""
	_status.text = "Scegli un comando e premi il nuovo tasto (Canc annulla)"
	refresh()
	show()
	_first.grab_focus()


func close() -> void:
	if _capture_action != "":
		_cancel_capture()
		return
	hide()
	closed.emit()


func is_capturing() -> bool:
	return _capture_action != ""


func _start_capture(action: String, pad: bool) -> void:
	_capture_action = action
	_capture_pad = pad
	_capture_t = CAPTURE_TIME
	_buttons[action][1 if pad else 0].text = "Premi un pulsante del controller..." if pad else "Premi un tasto..."
	_status.text = "%s: in attesa (Canc per annullare)" % InputRemap.ACTIONS[action]


func _cancel_capture() -> void:
	_capture_action = ""
	_status.text = "Annullato"
	refresh()


func _process(delta: float) -> void:
	if _capture_action != "":
		_capture_t -= delta
		if _capture_t <= 0.0:
			_cancel_capture()


func _input(event: InputEvent) -> void:
	if not visible or _capture_action == "":
		return
	if not event.is_pressed() or event.is_echo():
		return
	if event is InputEventKey and event.keycode == KEY_DELETE:
		_cancel_capture()
		get_viewport().set_input_as_handled()
		return
	var ok := (_capture_pad and InputRemap.is_pad(event)) or (not _capture_pad and event is InputEventKey)
	if event is InputEventJoypadMotion and absf(event.axis_value) < 0.6:
		ok = false
	if not ok:
		if event is InputEventKey or event is InputEventJoypadButton:
			get_viewport().set_input_as_handled()
		return
	get_viewport().set_input_as_handled()
	var action := _capture_action
	_capture_action = ""
	var removed := InputRemap.rebind(action, event)
	InputRemap.save_bindings()
	var msg := "%s: %s" % [InputRemap.ACTIONS[action], InputRemap.label(action, _capture_pad)]
	if not removed.is_empty():
		msg += "  (tolto da: %s)" % ", ".join(removed.map(func(a): return InputRemap.ACTIONS[a]))
	_status.text = msg
	refresh()
	_buttons[action][1 if _capture_pad else 0].grab_focus.call_deferred()


func _unhandled_input(event: InputEvent) -> void:
	if visible and _capture_action == "" and event.is_action_pressed("ui_cancel"):
		close()
		get_viewport().set_input_as_handled()