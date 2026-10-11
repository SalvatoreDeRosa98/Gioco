class_name PanelUi
extends RefCounted
## Piccoli costruttori di interfaccia condivisi dai pannelli (opzioni, comandi, slot, pausa).


static func title(text: String) -> Label:
	var l := Label.new()
	l.text = text
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.add_theme_font_override("font", Art.title_font())
	l.add_theme_font_size_override("font_size", 34)
	l.add_theme_color_override("font_color", Color("#f4d9a0"))
	return l


static func section(text: String) -> Label:
	var l := Label.new()
	l.text = text.to_upper()
	l.add_theme_font_override("font", Art.title_wide())
	l.add_theme_font_size_override("font_size", 17)
	l.add_theme_color_override("font_color", Art.OCRA)
	return l


static func row(caption: String, control: Control) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 18)
	var l := Label.new()
	l.text = caption
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	l.add_theme_font_override("font", Art.body_font())
	l.add_theme_font_size_override("font_size", 21)
	l.add_theme_color_override("font_color", Art.CREMA)
	h.add_child(l)
	control.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(control)
	return h


static func button(text: String, min_h: float = 44.0) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(0, min_h)
	b.pressed.connect(func() -> void: Audio.sfx("menu_click"))
	return b