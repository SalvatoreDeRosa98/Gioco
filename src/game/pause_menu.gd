extends CanvasLayer
## Pausa locale: riprende la stessa sessione anche prima del primo salvataggio.
## Riprendi, Opzioni, Comandi (rimappatura), Torna al menu, Esci dal gioco.
const OptionsPanel := preload("res://game/options_panel.gd")
const RemapPanel := preload("res://game/remap_panel.gd")

var world: Node
var opened := false
var _panel: Control
var _main: Control
var _resume: Button
var _options_button: Button
var _controls_button: Button
var _quit_button: Button
var options: Control
var remap: Control
## Esci dal gioco chiede una conferma (secondo clic).
var _quit_armed := false


func _ready() -> void:
	layer = 55
	_panel = Control.new()
	var theme := Theme.new()
	theme.default_font = Art.body_font()
	theme.default_font_size = 21
	theme.set_font("font", "Button", Art.title_font())
	theme.set_font_size("font_size", "Button", 24)
	theme.set_color("font_color", "Button", Color(Art.CREMA, 0.85))
	theme.set_color("font_focus_color", "Button", Color("#f4d9a0"))
	theme.set_color("font_hover_color", "Button", Color("#f4d9a0"))
	var empty := StyleBoxEmpty.new()
	theme.set_stylebox("normal", "Button", empty)
	var line := StyleBoxFlat.new()
	line.bg_color = Color(Art.OCRA, 0.06)
	line.border_color = Art.OCRA
	line.border_width_bottom = 2
	line.set_content_margin_all(6)
	theme.set_stylebox("focus", "Button", line)
	theme.set_stylebox("hover", "Button", line)
	theme.set_stylebox("pressed", "Button", line)
	_panel.theme = theme
	_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_panel)
	_main = Control.new()
	_main.set_anchors_preset(Control.PRESET_FULL_RECT)
	_panel.add_child(_main)
	var background := ColorRect.new()
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.color = Color(.015, .02, .03, .94)
	_main.add_child(background)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_main.add_child(center)
	var box := VBoxContainer.new()
	box.custom_minimum_size = Vector2(560, 0)
	box.add_theme_constant_override("separation", 12)
	center.add_child(box)
	box.add_child(PanelUi.title("IL CAMMINO ATTENDE"))
	_resume = _add(box, "Riprendi", toggle)
	_options_button = _add(box, "Opzioni", func() -> void: _open_sub(options))
	_controls_button = _add(box, "Comandi", func() -> void: _open_sub(remap))
	_add(box, "Torna al menu principale", func() -> void: world.exit_requested.emit())
	_quit_button = _add(box, "Esci dal gioco", _on_quit)
	var note := Label.new()
	note.text = "Tornando al menu riparti dall'ultima incudine"
	note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	note.add_theme_font_size_override("font_size", 17)
	note.add_theme_color_override("font_color", Color(Art.CREMA, 0.55))
	box.add_child(note)
	options = OptionsPanel.new()
	_panel.add_child(options)
	options.hide()
	options.closed.connect(_close_sub.bind(_options_button))
	remap = RemapPanel.new()
	_panel.add_child(remap)
	remap.hide()
	remap.closed.connect(_close_sub.bind(_controls_button))
	_panel.hide()


func _add(box: VBoxContainer, text: String, cb: Callable) -> Button:
	var b := PanelUi.button(text, 46.0)
	b.pressed.connect(cb)
	box.add_child(b)
	return b


## Congela la sessione (o la riprende).
func toggle() -> void:
	opened = not opened
	_panel.visible = opened
	world._freeze_for_talk(opened)
	_quit_armed = false
	_quit_button.text = "Esci dal gioco"
	options.hide()
	remap.hide()
	_main.show()
	if opened:
		_resume.grab_focus()


## Esc / Start / B: chiude il sottopannello aperto, altrimenti riprende il gioco.
func back() -> void:
	if remap.visible:
		remap.close()
	elif options.visible:
		options.close()
	else:
		toggle()


func is_capturing() -> bool:
	return remap.visible and remap.is_capturing()


func _open_sub(panel: Control) -> void:
	_main.hide()
	panel.open()


func _close_sub(focus: Button) -> void:
	_main.show()
	focus.grab_focus()


func _on_quit() -> void:
	if not _quit_armed:
		_quit_armed = true
		_quit_button.text = "Esci dal gioco? Premi ancora per confermare"
		return
	world.get_tree().quit()