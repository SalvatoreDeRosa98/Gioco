extends Node2D
## Terreno della stanza dipinto: pavimento, blocchi, mensole e pilastri usano la pietra di
## assets/art/props/terreno.png (ripetuta a specchio), i portali la grata di cancello.png.
## Ombre di contatto, muschio e bagliore dei portali aperti sono disegnati dal motore.

const STONE_TEX := preload("res://assets/art/props/terreno.png")
const GATE_TEX := preload("res://assets/art/props/cancello.png")

## Unità di mondo per pixel della pietra dipinta (pavimento e blocchi).
const STONE_SCALE := 0.28
## Scala più piccola per le mensole sottili.
const LEDGE_SCALE := 0.2
## Fasce della texture della pietra, in pixel: lastra di copertura e corsi di mattoni.
const CAP_ROWS := Vector2(0, 132)
const BRICK_ROWS := Vector2(196, 374)
## Il bordo superiore dipinto è un po' irregolare: la lastra parte poco sopra la superficie.
const CAP_LIFT := 4.0
## Altezza della grata dipinta e posizione del suo centro rispetto al bordo della stanza.
const GATE_H := 250.0
const GATE_CENTER := 40.0
const GATE_FADE := 1.6
const PORTAL_W := 64.0

var room: Dictionary = {}
var th: Dictionary = {}
var left_open := false
var right_open := false

var _tint := Color.WHITE
var _stone: Node2D
var _detail: Node2D
var _doors: Node2D
var _t := 0.0
var _gate_left := 1.0   # 1 = grata chiusa visibile, 0 = sparita
var _gate_right := 1.0


func _ready() -> void:
	_stone = _sublayer(_draw_stone)
	_detail = _sublayer(_draw_detail)
	_doors = _sublayer(_draw_doors)


func build(r: Dictionary, theme: Dictionary) -> void:
	room = r
	th = theme
	_tint = Color(Backdrop.area(r["theme"]).get("terrain_tint", "#ffffff"))
	for n in [_stone, _detail, _doors]:
		n.queue_redraw()


func set_doors(left: bool, right: bool) -> void:
	left_open = left
	right_open = right
	# Entrando in una stanza già aperta la grata non deve dissolversi davanti al giocatore.
	_gate_left = 0.0 if left else 1.0
	_gate_right = 0.0 if right else 1.0
	_doors.queue_redraw()


## Apre le grate con una dissolvenza (stanza appena ripulita).
func open_doors(left: bool, right: bool) -> void:
	left_open = left
	right_open = right


func _process(delta: float) -> void:
	_t += delta
	_gate_left = move_toward(_gate_left, 0.0 if left_open else 1.0, delta / GATE_FADE)
	_gate_right = move_toward(_gate_right, 0.0 if right_open else 1.0, delta / GATE_FADE)
	if left_open or right_open:
		_doors.queue_redraw()


func _sublayer(painter: Callable) -> Node2D:
	var n := Node2D.new()
	n.texture_repeat = CanvasItem.TEXTURE_REPEAT_MIRROR
	n.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	n.draw.connect(painter)
	add_child(n)
	return n


func _size() -> Vector2:
	return room.get("size", Vector2(1280, 720))


func _floor() -> float:
	return float(room.get("floor", 640.0))


# ---------------------------------------------------------------- Pietra dipinta

## Una fascia della texture (righe rows) stesa da x0 a x1 alla quota y, ripetuta a specchio.
func _band(c: CanvasItem, x0: float, x1: float, y: float, rows: Vector2, k: float, height: float = -1.0) -> void:
	var src_h := rows.y - rows.x
	if height > 0.0:
		src_h = minf(src_h, height / k)
	var w := (x1 - x0) / k
	c.draw_set_transform(Vector2(x0, y), 0.0, Vector2(k, k))
	# La colonna di partenza dipende da x0: blocchi diversi non mostrano la stessa porzione.
	var src_x := fposmod(x0 / k, float(STONE_TEX.get_width()) * 2.0)
	c.draw_texture_rect_region(STONE_TEX, Rect2(0, 0, w, src_h), Rect2(src_x, rows.x, w, src_h), _tint)
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


## Riempie un rettangolo con la lastra in alto e i corsi di mattoni ripetuti sotto.
func _masonry(c: CanvasItem, r: Rect2, with_cap: bool) -> void:
	var y := r.position.y
	if with_cap:
		var cap_h := (CAP_ROWS.y - CAP_ROWS.x) * STONE_SCALE
		_band(c, r.position.x, r.end.x, y - CAP_LIFT, CAP_ROWS, STONE_SCALE, r.size.y + CAP_LIFT)
		y += cap_h - CAP_LIFT
	var course := (BRICK_ROWS.y - BRICK_ROWS.x) * STONE_SCALE
	while y < r.end.y:
		_band(c, r.position.x, r.end.x, y, BRICK_ROWS, STONE_SCALE, r.end.y - y)
		y += course


func _draw_stone() -> void:
	if room.is_empty():
		return
	var size := _size()
	var fy := _floor()
	var c := _stone
	var shade := Color(_tint.darkened(0.82), 1.0)

	# Pavimento: fascia intera (lastra e mattoni), poi buio.
	var full := Vector2(CAP_ROWS.x, BRICK_ROWS.y)
	_band(c, -200.0, size.x + 200.0, fy - CAP_LIFT, full, STONE_SCALE)
	var below := fy - CAP_LIFT + (full.y - full.x) * STONE_SCALE
	c.draw_rect(Rect2(-200, below - 1.0, size.x + 400.0, size.y - below + 400.0), shade)

	# Pilastri sopra i portali.
	var door_top := fy - Room.DOOR_H
	_masonry(c, Rect2(-200, -200, 200 + Room.EDGE, door_top + 200.0), false)
	_masonry(c, Rect2(size.x - Room.EDGE, -200, 200 + Room.EDGE, door_top + 200.0), false)

	for b in room["blocks"]:
		_masonry(c, b, true)

	for l in room["ledges"]:
		var r: Rect2 = l
		_band(c, r.position.x, r.end.x, r.position.y - CAP_LIFT, CAP_ROWS, LEDGE_SCALE)


# ---------------------------------------------------------------- Ombre e dettagli

func _draw_detail() -> void:
	if room.is_empty():
		return
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(room["name"])
	var size := _size()
	var fy := _floor()
	var c := _detail
	var dark := Color(_tint.darkened(0.85), 1.0)

	# Il pavimento sfuma nel buio verso il basso.
	Art.grad_rect(c, Rect2(-200, fy + 30.0, size.x + 400.0, 80), Color(0, 0, 0, 0.0), Color(0, 0, 0, 0.75))
	_moss(c, rng, Rect2(-200, fy - CAP_LIFT, size.x + 400.0, 4))

	# Blocchi: ombre ai lati e contatto con il pavimento.
	for b in room["blocks"]:
		var r: Rect2 = b
		Art.grad_rect_h(c, Rect2(r.position.x, r.position.y, 14, r.size.y), Color(0, 0, 0, 0.55), Color(0, 0, 0, 0))
		Art.grad_rect_h(c, Rect2(r.end.x - 14, r.position.y, 14, r.size.y), Color(0, 0, 0, 0), Color(0, 0, 0, 0.55))
		c.draw_rect(Rect2(r.position.x - 1.0, r.position.y - CAP_LIFT, 2, r.size.y + CAP_LIFT), Color(0, 0, 0, 0.6))
		c.draw_rect(Rect2(r.end.x - 1.0, r.position.y - CAP_LIFT, 2, r.size.y + CAP_LIFT), Color(0, 0, 0, 0.6))
		_moss(c, rng, Rect2(r.position.x, r.position.y - CAP_LIFT, r.size.x, 4))

	# Mensole: ombra sotto e beccatelli scuri.
	for l in room["ledges"]:
		var r: Rect2 = l
		var bottom := r.position.y - CAP_LIFT + (CAP_ROWS.y - CAP_ROWS.x) * LEDGE_SCALE
		Art.grad_rect(c, Rect2(r.position.x + 6, bottom, r.size.x - 12, 26), Color(0, 0, 0, 0.45), Color(0, 0, 0, 0))
		var bx := r.position.x + 22.0
		while bx < r.end.x - 14.0:
			c.draw_colored_polygon(PackedVector2Array([
				Vector2(bx - 9, bottom), Vector2(bx + 9, bottom), Vector2(bx + 4, bottom + 18), Vector2(bx - 4, bottom + 18),
			]), dark)
			bx += 72.0
		for x in [r.position.x, r.end.x - 2.0]:
			c.draw_rect(Rect2(x, r.position.y - CAP_LIFT, 2, bottom - r.position.y + CAP_LIFT), Color(0, 0, 0, 0.5))
		_moss(c, rng, Rect2(r.position.x, r.position.y - CAP_LIFT, r.size.x, 3))

	# Pilastri: ombra verso l'interno della stanza.
	var door_top := fy - Room.DOOR_H
	Art.grad_rect_h(c, Rect2(Room.EDGE - 16.0, -200, 16, door_top + 200.0), Color(0, 0, 0, 0), Color(0, 0, 0, 0.6))
	Art.grad_rect_h(c, Rect2(size.x - Room.EDGE, -200, 16, door_top + 200.0), Color(0, 0, 0, 0.6), Color(0, 0, 0, 0))


func _moss(c: CanvasItem, rng: RandomNumberGenerator, edge: Rect2) -> void:
	var amount: float = th.get("moss", 0.0)
	if amount <= 0.0:
		return
	var moss := Color(0.28, 0.42, 0.22)
	var x := edge.position.x
	while x < edge.end.x:
		if rng.randf() < amount * 0.55:
			c.draw_line(Vector2(x, edge.position.y), Vector2(x + rng.randf_range(-3, 3), edge.position.y - rng.randf_range(3, 11)), moss.lightened(rng.randf_range(0.0, 0.2)), 2.0)
		if rng.randf() < amount * 0.06:
			c.draw_line(Vector2(x, edge.position.y + 4.0), Vector2(x, edge.position.y + rng.randf_range(10, 34)), moss.darkened(0.2), 2.0)
		x += 5.0


# ---------------------------------------------------------------- Portali

func _draw_doors() -> void:
	if room.is_empty():
		return
	var size := _size()
	_portal(_doors, left_open, _gate_left)
	_doors.draw_set_transform(Vector2(size.x, 0), 0.0, Vector2(-1, 1))
	_portal(_doors, right_open, _gate_right)
	_doors.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


## Portale sul lato sinistro (il destro è disegnato specchiato): bagliore se aperto,
## grata dipinta che si dissolve quando la stanza è ripulita.
func _portal(c: CanvasItem, is_open: bool, gate: float) -> void:
	var fy := _floor()
	var door_top := fy - Room.DOOR_H
	var w := Room.EDGE + PORTAL_W
	var r := w * 0.5
	var spring := door_top + r
	if is_open:
		var pulse := 0.5 + 0.5 * sin(_t * 2.4)
		var glow := Color(0.72, 0.86, 1.0)
		var inner := Rect2(0, spring, w, fy - spring)
		Art.grad_rect_h(c, inner, Color(glow, 0.55 + 0.15 * pulse), Color(glow, 0.05))
		c.draw_circle(Vector2(r, spring), r, Color(glow, 0.18 + 0.06 * pulse))
		for k in 5:
			var py := fy - fmod(_t * 40.0 + k * 41.0, Room.DOOR_H - 30.0)
			var px := 8.0 + fmod(k * 23.0 + _t * 9.0, w - 16.0)
			c.draw_circle(Vector2(px, py), 2.0, Color(1, 1, 1, 0.6))
	if gate > 0.0:
		var k := GATE_H / float(GATE_TEX.get_height())
		var gw := GATE_TEX.get_width() * k
		var g := clampf(gate, 0.0, 1.0)
		# La grata sale un poco mentre svanisce.
		var lift := (1.0 - g) * 40.0
		var mod := Color(_tint.r, _tint.g, _tint.b, g * g)
		c.draw_texture_rect(GATE_TEX, Rect2(GATE_CENTER - gw * 0.5, fy + 6.0 - GATE_H - lift, gw, GATE_H), false, mod)
