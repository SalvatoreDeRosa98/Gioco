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
var _t := 0.0


func _ready() -> void:
	_ensure_inputs()
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
		# Parlare con i personaggi: W e Freccia su come in Hollow Knight, E per chi preferisce.
		"interact": [KEY_W, KEY_UP, KEY_E],
	}
	for action in binds:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for k in binds[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = k
			InputMap.action_add_event(action, ev)
	var pad := {"jump": JOY_BUTTON_A, "attack": JOY_BUTTON_X, "dash": JOY_BUTTON_RIGHT_SHOULDER, "interact": JOY_BUTTON_Y}
	for action in pad:
		var jb := InputEventJoypadButton.new()
		jb.button_index = pad[action]
		InputMap.action_add_event(action, jb)
	var axes := {"move_left": [JOY_AXIS_LEFT_X, -1.0], "move_right": [JOY_AXIS_LEFT_X, 1.0], "move_up": [JOY_AXIS_LEFT_Y, -1.0], "move_down": [JOY_AXIS_LEFT_Y, 1.0]}
	for action in axes:
		var jm := InputEventJoypadMotion.new()
		jm.axis = axes[action][0]
		jm.axis_value = axes[action][1]
		InputMap.action_add_event(action, jm)


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
	_play_button = _button(_menu_box, "Nuova partita", _on_play_pressed)
	_button(_menu_box, "Esci dal gioco", func() -> void: get_tree().quit())

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


# ---------------------------------------------------------------- Partita

func _on_play_pressed() -> void:
	if _world:
		return
	_ui.visible = false
	_free_scene()
	_world = WORLD_SCRIPT.new()
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
