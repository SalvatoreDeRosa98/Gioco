extends Node
## Menu iniziale e lobby. Quando la partita parte crea il mondo di gioco.

const WORLD_SCRIPT := preload("res://game/world.gd")

var _ui: CanvasLayer
var _menu_box: VBoxContainer
var _lobby_box: VBoxContainer
var _name_edit: LineEdit
var _ip_edit: LineEdit
var _port_edit: LineEdit
var _status: Label
var _players_label: Label
var _hint_label: Label
var _start_button: Button
var _world: Node2D


func _ready() -> void:
	_ensure_inputs()
	_build_ui()
	Net.lobby_changed.connect(_refresh_lobby)
	Net.game_started.connect(_enter_world)
	Net.session_ended.connect(_return_to_menu)
	_run_auto_args()


func _run_auto_args() -> void:
	# Test in locale: godot --path src --headless -- --host --autostart --name=A
	var args := OS.get_cmdline_user_args()
	for a in args:
		if a.begins_with("--name="):
			_name_edit.text = a.trim_prefix("--name=")
		elif a.begins_with("--port="):
			_port_edit.text = a.trim_prefix("--port=")
	if "--host" in args:
		_on_host_pressed()
		if "--autostart" in args:
			get_tree().create_timer(3.0).timeout.connect(Net.start_game)
	for a in args:
		if a.begins_with("--join="):
			_ip_edit.text = a.trim_prefix("--join=")
			_on_join_pressed()
		elif a.begins_with("--shot="):
			_capture_later(a.trim_prefix("--shot="), 6.0)


## Salva uno screenshot dopo qualche secondo (verifica visiva in locale).
func _capture_later(path: String, seconds: float) -> void:
	await get_tree().create_timer(seconds).timeout
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(path)
	print("screenshot salvato: ", path)


func _ensure_inputs() -> void:
	var binds := {
		"move_left": [KEY_A, KEY_LEFT],
		"move_right": [KEY_D, KEY_RIGHT],
		"move_up": [KEY_W, KEY_UP],
		"move_down": [KEY_S, KEY_DOWN],
		"jump": [KEY_SPACE, KEY_Z],
		"attack": [KEY_X, KEY_J],
		"dash": [KEY_C, KEY_SHIFT],
	}
	for action in binds:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for k in binds[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = k
			InputMap.action_add_event(action, ev)


func _build_ui() -> void:
	_ui = CanvasLayer.new()
	add_child(_ui)

	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.theme = _make_theme()
	root.draw.connect(Art.draw_backdrop.bind(root))
	root.resized.connect(root.queue_redraw)
	_ui.add_child(root)

	_menu_box = _screen(root)
	_add_title(_menu_box)
	_name_edit = _line_edit(_menu_box, "Il tuo nome", "Cavaliere")
	_ip_edit = _line_edit(_menu_box, "Indirizzo IP dell'host", "127.0.0.1")
	_port_edit = _line_edit(_menu_box, "Porta", str(Net.DEFAULT_PORT))
	_button(_menu_box, "Ospita partita", _on_host_pressed)
	_button(_menu_box, "Unisciti", _on_join_pressed)
	_status = _label(_menu_box, "", 16)

	_lobby_box = _screen(root)
	_add_title(_lobby_box)
	_players_label = _label(_lobby_box, "", 20)
	_hint_label = _label(_lobby_box, "", 15)
	_start_button = _button(_lobby_box, "Inizia la partita", _on_start_pressed)
	_button(_lobby_box, "Esci", _on_leave_pressed)
	_show(_menu_box)


func _screen(root: Control) -> VBoxContainer:
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(center)
	var box := VBoxContainer.new()
	box.custom_minimum_size = Vector2(460, 0)
	box.add_theme_constant_override("separation", 12)
	center.add_child(box)
	return box


func _show(box: VBoxContainer) -> void:
	_menu_box.get_parent().visible = box == _menu_box
	_lobby_box.get_parent().visible = box == _lobby_box


func _add_title(box: VBoxContainer) -> void:
	var t := _label(box, "CASERTA", 64)
	t.add_theme_color_override("font_color", Art.OCRA)
	_label(box, "IL CUSTODE DELLA REGGIA", 18)
	_label(box, "Avventura co-op · 2–4 giocatori", 14)


func _label(parent: Node, text: String, font_size: int) -> Label:
	var l := Label.new()
	l.text = text
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.add_theme_font_size_override("font_size", font_size)
	parent.add_child(l)
	return l


func _line_edit(parent: Node, placeholder: String, value: String) -> LineEdit:
	var e := LineEdit.new()
	e.placeholder_text = placeholder
	e.text = value
	e.custom_minimum_size = Vector2(0, 44)
	parent.add_child(e)
	return e


func _button(parent: Node, text: String, on_press: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(0, 50)
	b.pressed.connect(on_press)
	parent.add_child(b)
	return b


func _make_theme() -> Theme:
	var t := Theme.new()
	t.set_stylebox("normal", "Button", _box(Color("#23303a"), Art.OCRA_DARK))
	t.set_stylebox("hover", "Button", _box(Color("#2e3f4c"), Art.OCRA))
	t.set_stylebox("pressed", "Button", _box(Color("#161f26"), Art.OCRA))
	t.set_stylebox("focus", "Button", _box(Color.TRANSPARENT, Art.OCRA))
	t.set_color("font_color", "Button", Art.CREMA)
	t.set_color("font_hover_color", "Button", Art.OCRA)
	t.set_font_size("font_size", "Button", 22)
	t.set_stylebox("normal", "LineEdit", _box(Color("#161c22"), Art.OCRA_DARK))
	t.set_stylebox("focus", "LineEdit", _box(Color("#161c22"), Art.OCRA))
	t.set_color("font_color", "LineEdit", Art.CREMA)
	t.set_color("font_placeholder_color", "LineEdit", Color(Art.CREMA, 0.4))
	t.set_font_size("font_size", "LineEdit", 20)
	t.set_color("font_color", "Label", Art.CREMA)
	return t


func _box(bg: Color, border: Color) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(10)
	sb.set_content_margin_all(10)
	return sb


func _player_name() -> String:
	var t := _name_edit.text.strip_edges()
	return t.left(16) if t != "" else "Cavaliere"


func _on_host_pressed() -> void:
	var port := int(_port_edit.text)
	if Net.host(port, _player_name()) != OK:
		_status.text = "Impossibile aprire la porta %d." % port
		return
	_status.text = ""
	_show(_lobby_box)
	_refresh_lobby()


func _on_join_pressed() -> void:
	var err := Net.join(_ip_edit.text.strip_edges(), int(_port_edit.text), _player_name())
	if err != OK:
		_status.text = "Indirizzo o porta non validi."
		return
	_status.text = ""
	_show(_lobby_box)
	_refresh_lobby()


func _on_start_pressed() -> void:
	Net.start_game()


func _on_leave_pressed() -> void:
	Net.leave()


func _refresh_lobby() -> void:
	if not _lobby_box.get_parent().visible:
		return
	var ids: Array = Net.players.keys()
	ids.sort()
	var lines: PackedStringArray = []
	for id in ids:
		lines.append("• %s%s" % [Net.players[id], "  (ospita)" if id == 1 else ""])
	_players_label.text = "\n".join(lines) if not lines.is_empty() else "In attesa di giocatori..."
	_start_button.visible = Net.is_host()
	_start_button.disabled = ids.is_empty()
	_hint_label.text = "" if Net.is_host() else "In attesa che l'host avvii la partita."


func _enter_world() -> void:
	_ui.visible = false
	_world = WORLD_SCRIPT.new()
	_world.name = "World"
	add_child(_world)


func _return_to_menu(reason: String) -> void:
	if _world:
		remove_child(_world)
		_world.queue_free()
		_world = null
	_ui.visible = true
	_show(_menu_box)
	_status.text = reason
