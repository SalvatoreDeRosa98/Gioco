extends Node2D
## Oggetti interattivi dipinti delle stanze in scena (Markers/Props): ruota della chiusa e cancello.
## - wheel: segue la leva "sluice" (expedition.gd). Quando la chiusa si apre la ruota sobbalza e gira l'acqua.
## - gate: cancello a due battenti sulla porta (side left/right). Chiuso finché la porta resta chiusa
##   (world._left_open/_right_open); si apre in dissolvenza; da vicino, se chiuso, mostra il suggerimento.
##   Il cancello sta nello sfondo (_back, z 3): pavimento, pilastri e personaggi gli passano davanti.
const WHEEL := preload("res://assets/art/slice/ruota_chiusa.png")
const GATE_SHUT := preload("res://assets/art/slice/cancello_chiuso.png")
const GATE_OPEN := preload("res://assets/art/slice/cancello_aperto.png")
## Tono del cancello: un po' spento e bluastro, come la luce della stanza, così non sembra incollato.
const GATE_TONE := Color(0.76, 0.76, 0.82, 1.0)
const OPEN_TIME := 0.8
var world: Node
var props: Array = []
## Stato per oggetto: open (0..1) per i cancelli, spin (secondi rimasti di animazione) per la ruota.
var state: Array = []
var _t := 0.0
## Figlio con z relativo -3 (assoluto 3): disegna i cancelli dietro terrain (5) e tile dipinti (4).
var _back: Node2D

func setup(w: Node) -> void:
	world = w
	props = w.room.get("props", [])
	z_index = 6  # ruota e cartelli dei cancelli sopra terrain.gd (5)
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_back = Node2D.new()
	_back.z_index = -3
	_back.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_back.draw.connect(_draw_gates)
	add_child(_back)
	for p in props:
		state.append({"open": 1.0 if is_open(p) else 0.0, "spin": 0.0, "was": is_open(p)})

func is_open(p: Dictionary) -> bool:
	match str(p.kind):
		"gate":
			return world._left_open() if str(p.get("side", "right")) == "left" else world._right_open()
		"wheel":
			return world.story.times_seen("sluice") > 0
	return false

func _process(delta: float) -> void:
	_t += delta
	for i in props.size():
		var p: Dictionary = props[i]
		var s: Dictionary = state[i]
		var now := is_open(p)
		if now and not s.was:
			s.spin = 1.4
			Fx.dust(world.fx_root, p.pos + Vector2(0, -20), 16)
		s.was = now
		s.spin = maxf(0.0, s.spin - delta)
		s.open = move_toward(s.open, 1.0 if now else 0.0, delta / OPEN_TIME)
	queue_redraw()
	_back.queue_redraw()

## Riquadro del suggerimento del cancello (mondo): verso l'interno della stanza rispetto al cancello
## e sempre dentro la vista della camera, così non esce dallo schermo.
const HINT_W := 340.0
const HINT_H := 28.0
func hint_rect(p: Dictionary) -> Rect2:
	var h := float(p.get("height", 200.0))
	var inward := 1.0 if str(p.get("side", "right")) == "left" else -1.0
	var x := float(p.pos.x) + inward * 60.0 - HINT_W / 2.0 + inward * HINT_W / 2.0
	var r := Rect2(x, float(p.pos.y) - h - 40.0, HINT_W, HINT_H)
	var view := visible_rect()
	if view.size.x > HINT_W + 32.0:
		r.position.x = clampf(r.position.x, view.position.x + 16.0, view.end.x - 16.0 - HINT_W)
	r.position.y = clampf(r.position.y, view.position.y + 16.0, view.end.y - 16.0 - HINT_H)
	return fit_label(get_viewport(), r)

## Zone dello schermo occupate dall'HUD (pixel del viewport): pannello vita/monete in alto a sinistra
## (hud.gd: Rect2(18, 18, VITALS_RIGHT - 18, 128 + 4 * 21) con VITALS_RIGHT = 290, più margine) e la
## fascia bassa di avvisi, notifiche e comandi (hud.gd: toast a vp.y - 118, notifiche da vp.y - 104 - 26).
static func hud_rects(vp: Vector2) -> Array:
	return [Rect2(0, 0, 330, 250), Rect2(0, vp.y - 150.0, vp.x, 150.0)]

## Le zone dell'HUD in coordinate di mondo (con lo zoom attuale).
static func hud_world_rects(vp: Viewport) -> Array:
	var inv := vp.get_canvas_transform().affine_inverse()
	var out := []
	for s: Rect2 in hud_rects(vp.get_visible_rect().size):
		out.append(Rect2(inv * s.position, Vector2.ZERO).expand(inv * s.end))
	return out

## Riquadro di un cartello (coordinate di mondo) dentro la vista e fuori dalle zone dell'HUD: se serve
## lo sposta sotto, a destra o sopra di ogni zona e tiene la posizione valida più vicina a quella voluta.
## Usato dai cartelli dei cancelli (qui) e dei passaggi (expedition.gd).
static func fit_label(vp: Viewport, r: Rect2, avoid: Array = []) -> Rect2:
	var zones := hud_world_rects(vp) + avoid
	var inv := vp.get_canvas_transform().affine_inverse()
	var view := Rect2(inv * Vector2.ZERO, Vector2.ZERO).expand(inv * vp.get_visible_rect().size)
	var inner := view.grow(-16.0)
	if inner.size.x > r.size.x:
		r.position.x = clampf(r.position.x, inner.position.x, inner.end.x - r.size.x)
	if inner.size.y > r.size.y:
		r.position.y = clampf(r.position.y, inner.position.y, inner.end.y - r.size.y)
	var ok := func(c: Rect2) -> bool:
		if not inner.encloses(c):
			return false
		for z: Rect2 in zones:
			if z.intersects(c):
				return false
		return true
	if ok.call(r):
		return r
	var best := r
	var best_d := INF
	for z: Rect2 in zones:
		for pos in [Vector2(r.position.x, z.end.y + 8.0), Vector2(z.end.x + 8.0, r.position.y), Vector2(r.position.x, z.position.y - 8.0 - r.size.y),
				Vector2(z.end.x + 8.0, z.end.y + 8.0)]:
			var c := Rect2(pos, r.size)
			c.position.x = clampf(c.position.x, inner.position.x, inner.end.x - c.size.x)
			c.position.y = clampf(c.position.y, inner.position.y, inner.end.y - c.size.y)
			if ok.call(c) and c.position.distance_to(r.position) < best_d:
				best = c
				best_d = c.position.distance_to(r.position)
	return best

## Area di mondo inquadrata dalla camera.
func visible_rect() -> Rect2:
	var cam := get_viewport().get_camera_2d()
	if cam == null:
		return Rect2(Vector2(-1e6, -1e6), Vector2(2e6, 2e6))
	var view := get_viewport_rect().size / cam.zoom
	return Rect2(cam.get_screen_center_position() - view / 2.0, view)

## Unico cartello del cancello, secondo lo stato: chiuso -> "hint" (es. "Sbarrato dalla Tana: prima
## Ratking"); aperto -> l'invito del passaggio che il cancello sostituisce (landmark "route" in
## "replaces", es. "Passaggio per Piazza Dante"), così arco e cancello non hanno due cartelli.
func gate_label(p: Dictionary, s: Dictionary) -> String:
	if float(s.open) < 0.05:
		return str(p.get("hint", "Chiuso"))
	var ex = world.get("_expedition")
	if is_instance_valid(ex):
		for m in ex.marks:
			if str(m.kind) == "route" and str(m.get("id", "")) in p.get("replaces", []):
				return Controls.label("interact") + "  " + str(m.label)
	return ""


## Riquadri (mondo) dei soli sprite dei cancelli.
func gate_rects() -> Array:
	var out := []
	for p: Dictionary in props:
		if p.kind == "gate":
			var h := float(p.get("height", 200.0))
			var size := Vector2(GATE_SHUT.get_size()) * (h / GATE_SHUT.get_height())
			out.append(Rect2(Vector2(p.pos.x - size.x / 2.0, p.pos.y - size.y), size))
	return out


## Riquadri (mondo) dei cancelli disegnati e dei loro cartelli: i cartelli degli altri oggetti non
## ci finiscono sotto né sopra.
func sprite_rects() -> Array:
	var out := []
	for p: Dictionary in props:
		if p.kind == "gate":
			var h := float(p.get("height", 200.0))
			var size := Vector2(GATE_SHUT.get_size()) * (h / GATE_SHUT.get_height())
			out.append(Rect2(Vector2(p.pos.x - size.x / 2.0, p.pos.y - size.y), size))
			out.append(hint_rect(p).grow(4.0))
	return out

## Disegna su `c` (self o _back) lo sprite dipinto con base in `base`, altezza `height`, tinta `col`.
func _sprite(c: CanvasItem, tex: Texture2D, base: Vector2, height: float, col := Color.WHITE, offset := Vector2.ZERO, angle := 0.0) -> void:
	var size := Vector2(tex.get_size()) * (height / tex.get_height())
	c.draw_set_transform(base + offset, angle, Vector2.ONE)
	c.draw_texture_rect(tex, Rect2(Vector2(-size.x / 2.0, -size.y), size), false, col)
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

## Cancelli nello sfondo: solo lo sprite (il cartello resta in _draw, sopra le piattaforme).
func _draw_gates() -> void:
	for i in props.size():
		var p: Dictionary = props[i]
		if str(p.kind) != "gate":
			continue
		var s: Dictionary = state[i]
		var h := float(p.get("height", 200.0))
		var shut := Color(GATE_TONE.r, GATE_TONE.g, GATE_TONE.b, 1.0 - float(s.open))
		var open := Color(GATE_TONE.r, GATE_TONE.g, GATE_TONE.b, float(s.open))
		_sprite(_back, GATE_SHUT, p.pos, h, shut)
		_sprite(_back, GATE_OPEN, p.pos, h, open)

func _draw() -> void:
	for i in props.size():
		var p: Dictionary = props[i]
		var s: Dictionary = state[i]
		var h := float(p.get("height", 200.0))
		match str(p.kind):
			"wheel":
				var spin := float(s.spin)
				var shake := sin(_t * 40.0) * 3.0 * spin
				_sprite(self, WHEEL, p.pos, h, Color.WHITE, Vector2(shake, 0), sin(_t * 30.0) * 0.02 * spin)
				if float(s.open) > 0.5:
					# Acqua che scorre dopo l'apertura: bagliore freddo alla base.
					draw_circle(p.pos + Vector2(0, -12), 26.0 + sin(_t * 3.0) * 3.0, Color(0.55, 0.75, 0.9, 0.12))
			"gate":
				var label := gate_label(p, s)
				if label != "" and world.player and absf(world.player.position.x - p.pos.x) < 200.0 and absf(world.player.position.y - p.pos.y) < 260.0:
					var hr := hint_rect(p)
					Art.text(self, Art.body_font(), hr.position + Vector2(0, 20), label, 18, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, hr.size.x)
