extends Control
## Schermata del titolo nello stile della Carta Reale borbonica: pergamena, doppia cornice con
## fregi d'angolo, inchiostro seppia e ocra, logo e "Premi un tasto" lampeggiante.
## Qualunque tasto, pulsante o clic la chiude (segnale `dismissed`) e si passa al menu.

signal dismissed

## UNICO PUNTO DEL LOGO: quando esistera' l'immagine definitiva basta salvarla in questo
## percorso (PNG con trasparenza) e verra' usata al posto del logo segnaposto in testo dipinto.
const LOGO_IMAGE := "res://assets/art/ui/logo_titolo.png"
const PAPER := preload("res://assets/art/ui/carta/carta_reale.png")
const INK := Color("#3b2414")
const INK_SOFT := Color(0.23, 0.14, 0.08, 0.55)
const RED := Color("#7a1d14")
## Periodo del lampeggio di "Premi un tasto", in secondi.
const BLINK := 1.4

var _t := 0.0
var _logo: Texture2D


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	if ResourceLoader.exists(LOGO_IMAGE):
		_logo = load(LOGO_IMAGE)


## True finche' il logo e' il segnaposto in testo dipinto.
func uses_placeholder_logo() -> bool:
	return _logo == null


func _process(delta: float) -> void:
	_t += delta
	queue_redraw()


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		dismiss()


## Chiude il titolo una sola volta.
func dismiss() -> void:
	if not visible:
		return
	hide()
	Audio.sfx("menu_click")
	dismissed.emit()


func _draw() -> void:
	var vp := size
	draw_rect(Rect2(Vector2.ZERO, vp), Color("#1a120b"))
	var paper := Rect2(Vector2(28, 22), vp - Vector2(56, 44))
	draw_texture_rect(PAPER, paper, false, Color(1.0, 0.97, 0.9))
	# Bruciatura dei bordi della pergamena.
	for i in 6:
		draw_rect(paper.grow(-i * 5.0), Color(0.24, 0.13, 0.05, 0.11), false, 10.0)
	_frame(paper.grow(-34.0), 3.0, INK)
	_frame(paper.grow(-44.0), 1.0, INK_SOFT)
	for corner in [paper.grow(-34.0).position, Vector2(paper.grow(-34.0).end.x, paper.grow(-34.0).position.y), paper.grow(-34.0).end, Vector2(paper.grow(-34.0).position.x, paper.grow(-34.0).end.y)]:
		_fleuron(corner)
	var cx := vp.x * 0.5
	# Cartiglio centrale: pergamena chiara sopra la carta, perche' il titolo si legga.
	var cart := Rect2(vp.x * 0.17, vp.y * 0.15, vp.x * 0.66, vp.y * 0.7)
	draw_rect(cart.grow(10.0), Color(0.16, 0.09, 0.04, 0.35), true)
	draw_rect(cart, Color("#e9d8b0"), true)
	for i in 5:
		draw_rect(cart.grow(-i * 4.0), Color(0.5, 0.33, 0.15, 0.08), false, 8.0)
	_frame(cart.grow(-12.0), 2.0, INK)
	_frame(cart.grow(-18.0), 1.0, INK_SOFT)
	Art.text(self, Art.title_wide(), Vector2(0, vp.y * 0.2), "REGNO DELLE DUE SICILIE  \u00b7  CASERTA, MDCCCXLV", 18, INK_SOFT, HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	if _logo:
		var h := vp.y * 0.36
		var w := h * _logo.get_width() / float(_logo.get_height())
		draw_texture_rect(_logo, Rect2(cx - w * 0.5, vp.y * 0.24, w, h), false)
	else:
		_placeholder_logo(vp)
	_rule(Vector2(cx, vp.y * 0.66), 230.0)
	var a := 0.35 + 0.65 * (0.5 + 0.5 * cos(_t * TAU / BLINK))
	Art.text(self, Art.title_wide(), Vector2(0, vp.y * 0.76), "PREMI UN TASTO", 26, Color(RED, a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	Art.text(self, Art.body_font(), Vector2(0, vp.y - 62), "Beta  \u00b7  per Real Concessione", 16, INK_SOFT, HORIZONTAL_ALIGNMENT_CENTER, vp.x)


## Logo SEGNAPOSTO: titolo in lettere "dipinte" (ombra, contorno a inchiostro, oro), con la
## dicitura che e' provvisorio. Sostituire salvando l'immagine in LOGO_IMAGE.
func _placeholder_logo(vp: Vector2) -> void:
	var y := vp.y * 0.44
	var font := Art.title_font()
	for o in [Vector2(5, 6), Vector2(3, 4)]:
		Art.text(self, font, Vector2(o.x, y + o.y), "FERRUCCIO", 112, Color(0.2, 0.1, 0.04, 0.35), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	for d in [Vector2(-2, 0), Vector2(2, 0), Vector2(0, -2), Vector2(0, 2)]:
		Art.text(self, font, Vector2(d.x, y + d.y), "FERRUCCIO", 112, INK, HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	Art.text(self, font, Vector2(0, y), "FERRUCCIO", 112, Color("#c9973f"), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	Art.text(self, font, Vector2(0, y - 3), "FERRUCCIO", 112, Color(1.0, 0.86, 0.55, 0.35), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	Art.text(self, Art.title_wide(), Vector2(0, y + 52), "LA MENZOGNA DEI BORBONE", 28, RED, HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	var tag := Rect2(vp.x * 0.5 - 120, y - 150, 240, 26)
	draw_rect(tag, Color(0.48, 0.11, 0.08, 0.12), true)
	draw_rect(tag, Color(RED, 0.6), false, 1.0)
	Art.text(self, Art.body_font(), Vector2(tag.position.x, tag.position.y + 19), "LOGO SEGNAPOSTO", 15, Color(RED, 0.85), HORIZONTAL_ALIGNMENT_CENTER, tag.size.x)


func _frame(r: Rect2, width: float, col: Color) -> void:
	draw_rect(r, col, false, width)


func _fleuron(c: Vector2) -> void:
	draw_circle(c, 9.0, INK)
	draw_circle(c, 5.0, Color("#c9973f"))
	for ang in [0.0, PI * 0.5, PI, PI * 1.5]:
		var d := Vector2.from_angle(ang)
		draw_line(c + d * 10.0, c + d * 26.0, INK, 2.0)
		draw_colored_polygon(PackedVector2Array([c + d * 26.0 + d.orthogonal() * 4.0, c + d * 34.0, c + d * 26.0 - d.orthogonal() * 4.0]), INK)


func _rule(c: Vector2, half: float) -> void:
	draw_line(c - Vector2(half, 0), c - Vector2(14, 0), INK, 1.5)
	draw_line(c + Vector2(14, 0), c + Vector2(half, 0), INK, 1.5)
	draw_colored_polygon(PackedVector2Array([c + Vector2(-9, 0), c + Vector2(0, -6), c + Vector2(9, 0), c + Vector2(0, 6)]), RED)