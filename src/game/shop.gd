extends CanvasLayer
## Fucina: prezzi, acquisti ed equipaggiamento leggibili con mouse, tastiera e controller.
var world: Node
var opened := false
var _root: Control
var _rows: VBoxContainer
var _balance: Label
var _message: Label

func _ready() -> void:
	layer = 40
	_root = Control.new()
	var ui_theme := Theme.new()
	ui_theme.default_font = Art.body_font()
	ui_theme.default_font_size = 21
	_root.theme = ui_theme
	_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_root)
	var shade := ColorRect.new()
	shade.set_anchors_preset(Control.PRESET_FULL_RECT)
	shade.color = Color(0.015, 0.02, 0.035, 0.94)
	_root.add_child(shade)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.add_child(center)
	var box := VBoxContainer.new()
	box.custom_minimum_size = Vector2(900, 0)
	box.add_theme_constant_override("separation", 10)
	center.add_child(box)
	_label(box, "LA FUCINA DI GAETANO", 32, Art.OCRA)
	_balance = _label(box, "", 21, Art.CREMA)
	_label(box, "Compra i materiali. Scegli gli accessori da portare con te.", 18, Art.CREMA)
	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(900, 440)
	box.add_child(scroll)
	_rows = VBoxContainer.new()
	_rows.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_rows.add_theme_constant_override("separation", 12)
	scroll.add_child(_rows)
	_message = _label(box, "", 18, Art.OCRA)
	var close := Button.new()
	close.text = "Torna alla fucina · Esc / B"
	close.pressed.connect(hide_shop)
	box.add_child(close)
	_root.visible = false

func _label(parent: Node, text: String, size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_override("font", Art.body_font())
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", color)
	parent.add_child(label)
	return label

## Apre il banco e ferma il mondo mentre si compra o si sceglie l'equipaggiamento.
func show_shop() -> void:
	opened = true
	_root.visible = true
	world._freeze_for_talk(true)
	_refresh()

## Restituisce il controllo senza spostare o curare Ferruccio.
func hide_shop() -> void:
	opened = false
	_root.visible = false
	world._freeze_for_talk(false)
	world._talk_lock = 0.2

func _refresh() -> void:
	_balance.text = "%d centesimi  ·  Accessori equipaggiati %d / %d" % [world.coins, world.equipped.size(), world.accessory_slots()]
	for child in _rows.get_children():
		_rows.remove_child(child)
		child.queue_free()
	var first_button: Button = null
	for key in Tuning.data.shop:
		var item: Dictionary = Tuning.data.shop[key]
		var row := HBoxContainer.new()
		_rows.add_child(row)
		var info := VBoxContainer.new()
		info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(info)
		_label(info, "%s · %d centesimi" % [item.name, item.price], 22, Art.CREMA)
		_label(info, item.description, 17, Color(Art.CREMA, 0.7))
		var button := Button.new()
		button.custom_minimum_size = Vector2(145, 46)
		button.text = "Posseduto" if world.upgrades.has(key) else "Acquista"
		button.disabled = world.upgrades.has(key) or world.coins < int(item.price) or (key == "heal" and world.player.hp >= world.player.max_hp)
		if item.has("need") and world.story.times_seen(item.need) == 0:
			button.disabled = true
			button.text = "Progetto mancante"
		button.pressed.connect(func() -> void:
			_message.text = world.buy_item(str(key))
			_refresh())
		row.add_child(button)
		if first_button == null and not button.disabled:
			first_button = button
	_label(_rows, "ACCESSORI · uno spazio per ogni accessorio attivo", 20, Art.OCRA)
	var names := {"boots": "Stivali temprati", "grip": "Impugnatura rinforzata", "guard": "Fibbia della guardia (+0,04 s alla parata)"}
	for key in names:
		if not world.upgrades.has(key):
			continue
		var row := HBoxContainer.new()
		_rows.add_child(row)
		var label := _label(row, names[key], 20, Art.CREMA)
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var button := Button.new()
		button.text = "Rimuovi" if world.equipped.has(key) else "Equipaggia"
		button.pressed.connect(func() -> void:
			_message.text = world.toggle_accessory(str(key))
			_refresh())
		row.add_child(button)
		if first_button == null:
			first_button = button
	if first_button != null:
		first_button.grab_focus()
