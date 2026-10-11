extends Node
## Menu iniziale su uno scenario animato della Reggia di notte (gioco per un solo giocatore).
## Quando la partita parte, lo scenario del menu viene rimosso e si crea il mondo di gioco.

const WORLD_SCRIPT := preload("res://game/world.gd")
const BackdropScript := preload("res://game/backdrop.gd")
const POST_SHADER := preload("res://game/shaders/post_screen_grade.gdshader")

var _scene: Node2D
var _backdrop
var _cam: Camera2D
var _post_layer: CanvasLayer
var _ui: CanvasLayer
var _menu_box: VBoxContainer
var _play_button: Button
var _world: Node2D
var _menu_axis := 0
const OptionsPanel := preload("res://game/options_panel.gd")
const RemapPanel := preload("res://game/remap_panel.gd")
## Pannelli del menu principale.
var _menu_center: Control
var _slots_center: Control
var _slots_box: VBoxContainer
var _slots_title: Label
var _slot_buttons: Array[Button] = []
## "continue" o "new": cosa fa la scelta di uno slot.
var _slots_mode := "new"
## Slot in attesa di conferma di sovrascrittura (0 = nessuno).
var _confirm_slot := 0
var _options: Control
var _remap: Control

## Il menu accetta direttamente croce, stick e A/Croce anche dopo un clic fuori dai pulsanti.
func _input(event: InputEvent) -> void:
	if is_instance_valid(_world) or not is_instance_valid(_ui) or not _ui.visible:
		return
	if (_options and _options.visible) or (_remap and _remap.visible):
		return
	if _slots_center and _slots_center.visible and event.is_action_pressed("ui_cancel"):
		_show_main_box()
		get_viewport().set_input_as_handled()
		return
	Controls.observe(event)
	if event is InputEventJoypadMotion and event.axis == JOY_AXIS_LEFT_Y:
		if absf(event.axis_value) < .25:
			_menu_axis = 0
		elif absf(event.axis_value) > .55 and _menu_axis != int(signf(event.axis_value)):
			_menu_axis = int(signf(event.axis_value))
			_move_menu_focus(_menu_axis)
		get_viewport().set_input_as_handled()
	elif event is InputEventJoypadButton and event.pressed:
		if event.button_index in [JOY_BUTTON_DPAD_UP,JOY_BUTTON_DPAD_DOWN]:
			_move_menu_focus(-1 if event.button_index == JOY_BUTTON_DPAD_UP else 1)
			get_viewport().set_input_as_handled()
		elif event.button_index in [JOY_BUTTON_A, JOY_BUTTON_START]:
			var focused := get_viewport().gui_get_focus_owner() as Button
			if focused == null:
				focused = _play_button
			focused.pressed.emit()
			get_viewport().set_input_as_handled()
	elif event is InputEventKey and event.pressed and not event.echo:
		if event.keycode in [KEY_UP, KEY_W, KEY_DOWN, KEY_S]:
			_move_menu_focus(-1 if event.keycode in [KEY_UP, KEY_W] else 1)
			get_viewport().set_input_as_handled()
		elif event.keycode in [KEY_ENTER, KEY_KP_ENTER, KEY_SPACE]:
			var focused := get_viewport().gui_get_focus_owner() as Button
			if focused == null:
				focused = _play_button
			focused.pressed.emit()
			get_viewport().set_input_as_handled()

func _move_menu_focus(direction: int) -> void:
	var buttons: Array[Button] = []
	for child in _active_box().get_children():
		if child is Button and not child.disabled and child.visible:
			buttons.append(child)
	if buttons.is_empty():
		return
	var index := buttons.find(get_viewport().gui_get_focus_owner())
	if index < 0:
		buttons[0].grab_focus()
	else:
		buttons[posmod(index + direction, buttons.size())].grab_focus()
var _t := 0.0


func _ready() -> void:
	_ensure_inputs()
	InputRemap.capture_defaults()
	InputRemap.load_bindings()
	GameSettings.load_settings()
	GameSettings.apply()
	SaveSlots.migrate_legacy()
	_build_scene()
	_build_ui()
	_run_auto_args()


func _process(delta: float) -> void:
	_t += delta
	if _cam and _backdrop:
		_cam.position = Vector2(960.0 + sin(_t * 0.07) * 260.0, 600.0 + sin(_t * 0.05) * 40.0)
		_backdrop.update_camera(_cam.get_screen_center_position())


func _run_auto_args() -> void:
	# Test in locale: godot --path src -- --play --room=3 --at=900 --demo --shot=/tmp/x.png
	var args := OS.get_cmdline_user_args()
	for a in args:
		if a.begins_with("--shot="):
			var delay := 6.0
			for b in args:
				if b.begins_with("--shot-at="):
					delay = float(b.trim_prefix("--shot-at="))
			_capture_later(a.trim_prefix("--shot="), delay)
	if "--perf" in args:
		_print_perf()
	for a in args:
		if a.begins_with("--quit-at="):
			get_tree().create_timer(float(a.trim_prefix("--quit-at="))).timeout.connect(get_tree().quit)
	if "--play" in args:
		get_tree().create_timer(1.0).timeout.connect(_on_play_pressed)


## Solo per test: ogni 2 s stampa FPS, chiamate di disegno, oggetti e primitive del fotogramma.
func _print_perf() -> void:
	while true:
		await get_tree().create_timer(2.0).timeout
		print("perf fps=%d draw=%d obj=%d prim=%d nodi=%d" % [
			Performance.get_monitor(Performance.TIME_FPS),
			Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
			Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME),
			Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),
			Performance.get_monitor(Performance.OBJECT_NODE_COUNT)])


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
		"parry": [KEY_F, KEY_K],
		"shop": [KEY_B],
		# Parlare con i personaggi: W e Freccia su come in Hollow Knight, E per chi preferisce.
		"interact": [KEY_W, KEY_UP, KEY_E],
		# Abilità metroidvania e strumenti:
		"grapple": [KEY_Q],
		"hammer": [KEY_V],
		"heal": [KEY_R],
		"map": [KEY_M, KEY_TAB],
		"pause": [KEY_ESCAPE],
	}
	for action in binds:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for k in binds[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = k
			ev.keycode = k
			InputMap.action_add_event(action, ev)
	# Mappatura Gamepad completa (schema Xbox / PlayStation):
	# A / Croce: Salto
	# X / Quadrato: Attacco spada
	# B / Cerchio: Martello calcare
	# Y / Triangolo: Interagisci / Parla
	# RB / R1: Scatto (dash)
	# LB / L1: Parata (parry)
	# RT / R2: Catena / Rampino
	# LT / L2: Cura con le braci (tenuto da fermo)
	# Back / Select: Mappa del mondo
	# Start: Menu / Pausa
	# DPad Up: Negozio fucina
	var pad := {
		"jump": JOY_BUTTON_A,
		"attack": JOY_BUTTON_X,
		"hammer": JOY_BUTTON_B,
		"interact": JOY_BUTTON_Y,
		"dash": JOY_BUTTON_RIGHT_SHOULDER,
		"parry": JOY_BUTTON_LEFT_SHOULDER,
		"map": JOY_BUTTON_BACK,
		"pause": JOY_BUTTON_START,
		"shop": JOY_BUTTON_DPAD_UP,
	}
	for action in pad:
		var jb := InputEventJoypadButton.new()
		jb.button_index = pad[action]
		InputMap.action_add_event(action, jb)
	var axes := {
		"move_left": [JOY_AXIS_LEFT_X, -1.0],
		"move_right": [JOY_AXIS_LEFT_X, 1.0],
		"move_up": [JOY_AXIS_LEFT_Y, -1.0],
		"move_down": [JOY_AXIS_LEFT_Y, 1.0],
		"grapple": [JOY_AXIS_TRIGGER_RIGHT, 1.0],
		"heal": [JOY_AXIS_TRIGGER_LEFT, 1.0],
	}
	for action in axes:
		var jm := InputEventJoypadMotion.new()
		jm.axis = axes[action][0]
		jm.axis_value = axes[action][1]
		InputMap.action_add_event(action, jm)
	# Supporto DPad per il movimento:
	var dpad := {
		"move_left": JOY_BUTTON_DPAD_LEFT,
		"move_right": JOY_BUTTON_DPAD_RIGHT,
		"move_up": JOY_BUTTON_DPAD_UP,
		"move_down": JOY_BUTTON_DPAD_DOWN,
	}
	for action in dpad:
		var db := InputEventJoypadButton.new()
		db.button_index = dpad[action]
		InputMap.action_add_event(action, db)


# ---------------------------------------------------------------- Scenario animato

func _build_scene() -> void:
	_scene = Node2D.new()
	add_child(_scene)
	_backdrop = BackdropScript.new()
	_scene.add_child(_backdrop)
	_backdrop.build("oro", Vector2(1920, 1080), 980.0, 1.0, false)
	_cam = Camera2D.new()
	_cam.position = Vector2(960, 600)
	_scene.add_child(_cam)
	_cam.make_current()

	_post_layer = CanvasLayer.new()
	_post_layer.layer = 5
	add_child(_post_layer)
	var post := ColorRect.new()
	post.set_anchors_preset(Control.PRESET_FULL_RECT)
	post.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var mat := ShaderMaterial.new()
	mat.shader = POST_SHADER
	var th := Themes.get_theme("oro")
	mat.set_shader_parameter("tint", th.tint)
	mat.set_shader_parameter("contrast", th.contrast)
	mat.set_shader_parameter("bloom_strength", th.bloom)
	mat.set_shader_parameter("vignette", 0.7)
	post.material = mat
	_post_layer.add_child(post)


func _free_scene() -> void:
	if _scene:
		_scene.queue_free()
		_scene = null
		_backdrop = null
		_cam = null
	if _post_layer:
		_post_layer.queue_free()
		_post_layer = null


# ---------------------------------------------------------------- Interfaccia

func _build_ui() -> void:
	_ui = CanvasLayer.new()
	_ui.layer = 10
	add_child(_ui)

	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.theme = _make_theme()
	_ui.add_child(root)

	var shade := Control.new()
	shade.set_anchors_preset(Control.PRESET_FULL_RECT)
	shade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	shade.draw.connect(_draw_shade.bind(shade))
	root.add_child(shade)

	_menu_box = _screen(root)
	_add_title(_menu_box)
	_spacer(_menu_box, 8)
	_play_button = _button(_menu_box, "Gioca", func() -> void: _open_slots("continue" if SaveSlots.any_exists() else "new"))
	_button(_menu_box, "Nuova partita", func() -> void: _open_slots("new"))
	_button(_menu_box, "Opzioni", func() -> void: _open_panel(_options))
	_button(_menu_box, "Comandi", func() -> void: _open_panel(_remap))
	_button(_menu_box, "Esci dal gioco", func() -> void: get_tree().quit())
	_menu_center = _menu_box.get_parent()
	_slots_box = _screen(root)
	_slots_box.custom_minimum_size = Vector2(820, 0)
	_slots_center = _slots_box.get_parent()
	_slots_title = _label(_slots_box, "", 34, Art.title_font())
	_spacer(_slots_box, 10)
	for s in range(1, SaveSlots.COUNT + 1):
		var b := _button(_slots_box, "", _on_slot_pressed.bind(s))
		b.add_theme_font_override("font", Art.body_font())
		b.add_theme_font_size_override("font_size", 22)
		_slot_buttons.append(b)
	_spacer(_slots_box, 6)
	_button(_slots_box, "Indietro", _show_main_box)
	_slots_center.hide()
	_options = OptionsPanel.new()
	root.add_child(_options)
	_options.hide()
	_options.closed.connect(_show_main_box)
	_remap = RemapPanel.new()
	root.add_child(_remap)
	_remap.hide()
	_remap.closed.connect(_show_main_box)

	var footer := _label(root, "Beta  ·  Caserta, 1845", 18, Art.body_font())
	footer.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	footer.position = Vector2(-300, -44)
	footer.size = Vector2(600, 30)
	footer.add_theme_color_override("font_color", Color(Art.CREMA, 0.45))
	_show_menu()


func _draw_shade(c: Control) -> void:
	var s := c.size
	Art.grad_rect(c, Rect2(0, 0, s.x, s.y * 0.5), Color(0, 0, 0, 0.0), Color(0, 0, 0, 0.35))
	Art.grad_rect(c, Rect2(0, s.y * 0.5, s.x, s.y * 0.5), Color(0, 0, 0, 0.35), Color(0, 0, 0, 0.6))


func _screen(root: Control) -> VBoxContainer:
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(center)
	var box := VBoxContainer.new()
	box.custom_minimum_size = Vector2(520, 0)
	box.add_theme_constant_override("separation", 10)
	center.add_child(box)
	return box


func _show_menu() -> void:
	_ui.visible = true
	_show_main_box()
	_play_button.text = "CONTINUA" if SaveSlots.any_exists() else "GIOCA"
	Audio.play_area("menu")
	_play_button.call_deferred("grab_focus")


func _add_title(box: VBoxContainer) -> void:
	var t := _label(box, "FERRUCCIO", 96, Art.title_font())
	t.autowrap_mode = TextServer.AUTOWRAP_OFF
	t.add_theme_color_override("font_color", Color("#f4d9a0"))
	t.add_theme_color_override("font_shadow_color", Color(1.0, 0.62, 0.25, 0.4))
	t.add_theme_constant_override("shadow_outline_size", 22)
	t.add_theme_constant_override("shadow_offset_x", 0)
	t.add_theme_constant_override("shadow_offset_y", 0)
	var orn := Control.new()
	orn.custom_minimum_size = Vector2(0, 18)
	orn.draw.connect(_draw_ornament.bind(orn))
	box.add_child(orn)
	var sub := _label(box, "LA MENZOGNA DEI BORBONE", 24, Art.title_wide())
	sub.add_theme_color_override("font_color", Art.CREMA)
	_spacer(box, 22)


func _draw_ornament(c: Control) -> void:
	var cx := c.size.x * 0.5
	var y := c.size.y * 0.5
	c.draw_line(Vector2(cx - 210, y), Vector2(cx - 16, y), Color(Art.OCRA, 0.8), 1.5)
	c.draw_line(Vector2(cx + 16, y), Vector2(cx + 210, y), Color(Art.OCRA, 0.8), 1.5)
	c.draw_colored_polygon(PackedVector2Array([Vector2(cx - 9, y), Vector2(cx, y - 6), Vector2(cx + 9, y), Vector2(cx, y + 6)]), Art.OCRA)
	c.draw_circle(Vector2(cx - 214, y), 2.5, Art.OCRA)
	c.draw_circle(Vector2(cx + 214, y), 2.5, Art.OCRA)


func _spacer(parent: Node, h: float) -> void:
	var s := Control.new()
	s.custom_minimum_size = Vector2(0, h)
	parent.add_child(s)


func _label(parent: Node, text: String, font_size: int, font: Font) -> Label:
	var l := Label.new()
	l.text = text
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.add_theme_font_override("font", font)
	l.add_theme_font_size_override("font_size", font_size)
	parent.add_child(l)
	return l


func _button(parent: Node, text: String, on_press: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(0, 50)
	b.pressed.connect(func() -> void: Audio.sfx("menu_click"))
	b.pressed.connect(on_press)
	parent.add_child(b)
	return b


func _make_theme() -> Theme:
	var t := Theme.new()
	t.default_font = Art.body_font()
	t.set_font("font", "Button", Art.title_font())
	t.set_font_size("font_size", "Button", 26)
	var empty := StyleBoxEmpty.new()
	t.set_stylebox("normal", "Button", empty)
	t.set_stylebox("disabled", "Button", empty)
	t.set_stylebox("hover", "Button", _underline(Color(Art.OCRA, 0.9)))
	t.set_stylebox("pressed", "Button", _underline(Art.OCRA))
	t.set_stylebox("focus", "Button", _underline(Color(Art.OCRA, 0.9)))
	t.set_color("font_color", "Button", Color(Art.CREMA, 0.85))
	t.set_color("font_hover_color", "Button", Color("#f4d9a0"))
	t.set_color("font_focus_color", "Button", Color("#f4d9a0"))
	t.set_color("font_pressed_color", "Button", Art.OCRA)
	t.set_color("font_disabled_color", "Button", Color(Art.CREMA, 0.3))

	var field := StyleBoxFlat.new()
	field.bg_color = Color(0, 0, 0, 0.35)
	field.border_color = Color(Art.CREMA, 0.35)
	field.border_width_bottom = 1
	field.set_content_margin_all(8)
	var field_focus := field.duplicate() as StyleBoxFlat
	field_focus.border_color = Art.OCRA
	field_focus.border_width_bottom = 2
	t.set_stylebox("normal", "LineEdit", field)
	t.set_stylebox("focus", "LineEdit", field_focus)
	t.set_font("font", "LineEdit", Art.body_font())
	t.set_font_size("font_size", "LineEdit", 24)
	t.set_color("font_color", "LineEdit", Art.CREMA)
	t.set_color("font_placeholder_color", "LineEdit", Color(Art.CREMA, 0.35))
	t.set_color("caret_color", "LineEdit", Art.OCRA)
	t.set_color("font_color", "Label", Art.CREMA)
	return t


func _underline(color: Color) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(color, 0.06)
	sb.border_color = color
	sb.border_width_bottom = 2
	sb.set_content_margin_all(6)
	return sb


# ---------------------------------------------------------------- Slot e pannelli

func _active_box() -> VBoxContainer:
	return _slots_box if _slots_center and _slots_center.visible else _menu_box


func _show_main_box() -> void:
	if _slots_center:
		_slots_center.hide()
	if _options:
		_options.hide()
	if _remap:
		_remap.hide()
	_menu_center.show()
	_play_button.call_deferred("grab_focus")


func _open_panel(panel: Control) -> void:
	_menu_center.hide()
	panel.open()


## Mostra i 3 slot: "continue" carica (solo slot pieni), "new" inizia (chiede conferma se pieno).
func _open_slots(mode: String) -> void:
	_slots_mode = mode
	_confirm_slot = 0
	_slots_title.text = "CONTINUA" if mode == "continue" else "NUOVA PARTITA"
	_refresh_slots()
	_menu_center.hide()
	_slots_center.show()
	var target := SaveSlots.latest() if mode == "continue" else _first_free_slot()
	_slot_buttons[maxi(1, target) - 1].call_deferred("grab_focus")


func _first_free_slot() -> int:
	for s in range(1, SaveSlots.COUNT + 1):
		if not SaveSlots.exists(s):
			return s
	return 1


func _refresh_slots() -> void:
	for i in _slot_buttons.size():
		var s := i + 1
		var b := _slot_buttons[i]
		b.text = SaveSlots.describe(s)
		b.disabled = _slots_mode == "continue" and not SaveSlots.info(s).valid
		if _confirm_slot == s:
			b.text = "Slot %d  \u00b7  Sovrascrivere? Premi ancora per confermare" % s


func _on_slot_pressed(slot: int) -> void:
	if _slots_mode == "continue":
		_on_play_pressed(true, slot)
		return
	if SaveSlots.exists(slot) and _confirm_slot != slot:
		_confirm_slot = slot
		_refresh_slots()
		return
	SaveSlots.delete(slot)
	_on_play_pressed(false, slot)


# ---------------------------------------------------------------- Partita

func _on_play_pressed(resume: bool = true, slot: int = 0) -> void:
	if _world:
		return
	if slot > 0:
		SaveSlots.current = slot
	elif resume and SaveSlots.latest() > 0:
		SaveSlots.current = SaveSlots.latest()
	_ui.visible = false
	_free_scene()
	_world = WORLD_SCRIPT.new()
	_world.resume_save = resume
	_world.name = "World"
	_world.exit_requested.connect(_return_to_menu)
	add_child(_world)


## Esc in partita: il mondo viene scartato e torna lo scenario del menu.
func _return_to_menu() -> void:
	if _world:
		remove_child(_world)
		_world.queue_free()
		_world = null
	if _scene == null:
		_build_scene()
	_ui.visible = true
	_show_menu()
