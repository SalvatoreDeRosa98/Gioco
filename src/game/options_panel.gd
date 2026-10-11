extends Control
## Pannello opzioni (menu principale e pausa): schermo intero, risoluzione, volumi per bus.
## Ogni modifica si applica subito e si salva in user:// (vedi GameSettings).

signal closed

var _fullscreen: CheckButton
var _resolution: OptionButton
var _sliders := {}
var _back: Button


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var bg := ColorRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0.015, 0.02, 0.03, 0.96)
	add_child(bg)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	var box := VBoxContainer.new()
	box.custom_minimum_size = Vector2(640, 0)
	box.add_theme_constant_override("separation", 14)
	center.add_child(box)
	box.add_child(PanelUi.title("OPZIONI"))
	box.add_child(PanelUi.section("Video"))
	_fullscreen = CheckButton.new()
	_fullscreen.text = "Schermo intero"
	_fullscreen.toggled.connect(func(on: bool) -> void:
		GameSettings.fullscreen = on
		_resolution.disabled = on
		_commit(true))
	box.add_child(_fullscreen)
	_resolution = OptionButton.new()
	for r in GameSettings.RESOLUTIONS:
		_resolution.add_item("%d x %d" % [r.x, r.y])
	_resolution.item_selected.connect(func(i: int) -> void:
		GameSettings.resolution = GameSettings.RESOLUTIONS[i]
		_commit(true))
	box.add_child(PanelUi.row("Risoluzione in finestra", _resolution))
	box.add_child(PanelUi.section("Audio"))
	for bus in GameSettings.BUSES:
		var s := HSlider.new()
		s.min_value = 0
		s.max_value = 100
		s.step = 5
		s.custom_minimum_size = Vector2(300, 28)
		s.focus_mode = Control.FOCUS_ALL
		s.value_changed.connect(func(v: float) -> void:
			GameSettings.set_volume(bus, v / 100.0)
			_commit(false))
		_sliders[bus] = s
		box.add_child(PanelUi.row(GameSettings.BUSES[bus], s))
	var reset := PanelUi.button("Ripristina predefiniti")
	reset.pressed.connect(func() -> void:
		GameSettings.reset_defaults()
		refresh()
		_commit(true))
	box.add_child(reset)
	_back = PanelUi.button("Indietro")
	_back.pressed.connect(close)
	box.add_child(_back)
	refresh()


## Ricarica i controlli dai valori correnti.
func refresh() -> void:
	_fullscreen.set_pressed_no_signal(GameSettings.fullscreen)
	_resolution.disabled = GameSettings.fullscreen
	_resolution.select(maxi(0, GameSettings.RESOLUTIONS.find(GameSettings.resolution)))
	for bus in _sliders:
		_sliders[bus].set_value_no_signal(round(float(GameSettings.volumes[bus]) * 100.0))


func open() -> void:
	refresh()
	show()
	_fullscreen.grab_focus()


func close() -> void:
	hide()
	closed.emit()


func _commit(video: bool) -> void:
	if video:
		GameSettings.apply_video()
	GameSettings.save_settings()


func _unhandled_input(event: InputEvent) -> void:
	if visible and event.is_action_pressed("ui_cancel"):
		close()
		get_viewport().set_input_as_handled()