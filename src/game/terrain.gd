extends Node2D
## Terreno della stanza: pavimento, blocchi e pilastri in pietra (shader), mensole su beccatelli,
## cornicioni, muschio, ombre di contatto e portali d'uscita ad arco (aperti o chiusi da grate).

const STONE_SHADER := preload("res://game/shaders/canvas_env_stone.gdshader")
const PORTAL_W := 64.0

var room: Dictionary = {}
var th: Dictionary = {}
var left_open := false
var right_open := false

var _body: Node2D
var _ledges: Node2D
var _detail: Node2D
var _doors: Node2D
var _body_mat: ShaderMaterial
var _ledge_mat: ShaderMaterial
var _t := 0.0


func _ready() -> void:
	_body_mat = _stone_material(Vector2(72, 36), 0.22)
	_ledge_mat = _stone_material(Vector2(38, 18), 0.18)
	_body = _sublayer(_body_mat, _draw_body)
	_ledges = _sublayer(_ledge_mat, _draw_ledges)
	_detail = _sublayer(null, _draw_detail)
	_doors = _sublayer(null, _draw_doors)


func build(r: Dictionary, theme: Dictionary) -> void:
	room = r
	th = theme
	_body_mat.set_shader_parameter("mortar", th.mortar)
	_ledge_mat.set_shader_parameter("mortar", th.mortar)
	for n in [_body, _ledges, _detail, _doors]:
		n.queue_redraw()


func set_doors(left: bool, right: bool) -> void:
	left_open = left
	right_open = right
	_doors.queue_redraw()


func _process(delta: float) -> void:
	_t += delta
	if left_open or right_open:
		_doors.queue_redraw()


func _stone_material(brick: Vector2, variation: float) -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = STONE_SHADER
	m.set_shader_parameter("brick", brick)
	m.set_shader_parameter("variation", variation)
	return m


func _sublayer(mat: ShaderMaterial, painter: Callable) -> Node2D:
	var n := Node2D.new()
	n.material = mat
	n.draw.connect(painter)
	add_child(n)
	return n


func _size() -> Vector2:
	return room.get("size", Vector2(1280, 720))


func _floor() -> float:
	return float(room.get("floor", 640.0))


# ---------------------------------------------------------------- Masse in pietra (shader)

func _draw_body() -> void:
	if room.is_empty():
		return
	var size := _size()
	var fy := _floor()
	var stone: Color = th.stone
	_body.draw_rect(Rect2(-200, fy, size.x + 400.0, size.y - fy + 200.0), stone.darkened(0.12))
	for b in room["blocks"]:
		_body.draw_rect(b, stone)
	var door_top := fy - Room.DOOR_H
	_body.draw_rect(Rect2(-200, -200, 200 + Room.EDGE, door_top + 200.0), stone.darkened(0.2))
	_body.draw_rect(Rect2(size.x - Room.EDGE, -200, 200 + Room.EDGE, door_top + 200.0), stone.darkened(0.2))


func _draw_ledges() -> void:
	if room.is_empty():
		return
	for l in room["ledges"]:
		_ledges.draw_rect(l, (th.stone as Color).lightened(0.06))


# ---------------------------------------------------------------- Dettagli (senza shader)

func _draw_detail() -> void:
	if room.is_empty():
		return
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(room["name"])
	var size := _size()
	var fy := _floor()
	var light: Color = th.stone_light
	var stone: Color = th.stone
	var c := _detail

	# Pavimento: bordo illuminato e terreno che sfuma nel buio.
	Art.grad_rect(c, Rect2(-200, fy - 3.0, size.x + 400.0, 12), light, stone.darkened(0.1))
	Art.grad_rect(c, Rect2(-200, fy + 9.0, size.x + 400.0, 150), Color(0, 0, 0, 0.0), Color(0, 0, 0, 0.7))
	c.draw_rect(Rect2(-200, fy + 159.0, size.x + 400.0, 600), Color(0, 0, 0, 0.7))
	_moss(c, rng, Rect2(-200, fy, size.x + 400.0, 4))

	# Blocchi: cornicione, ombre laterali, crepe.
	for b in room["blocks"]:
		var r: Rect2 = b
		c.draw_rect(Rect2(r.position.x - 6, r.position.y - 6.0, r.size.x + 12, 12), light)
		c.draw_rect(Rect2(r.position.x - 6, r.position.y + 6.0, r.size.x + 12, 3), Color(0, 0, 0, 0.4))
		Art.grad_rect_h(c, Rect2(r.position.x, r.position.y + 9.0, 16, r.size.y - 9.0), Color(0, 0, 0, 0.35), Color(0, 0, 0, 0))
		Art.grad_rect_h(c, Rect2(r.end.x - 16, r.position.y + 9.0, 16, r.size.y - 9.0), Color(0, 0, 0, 0), Color(0, 0, 0, 0.35))
		for k in int(r.size.x / 140.0):
			var cx := r.position.x + rng.randf_range(10.0, r.size.x - 10.0)
			var cy := r.position.y + rng.randf_range(16.0, maxf(18.0, r.size.y - 10.0))
			c.draw_polyline(PackedVector2Array([Vector2(cx, cy), Vector2(cx + rng.randf_range(-8, 8), cy + 9), Vector2(cx + rng.randf_range(-6, 10), cy + 18)]), Color(0, 0, 0, 0.35), 1.5)
		_moss(c, rng, Rect2(r.position.x - 6, r.position.y - 6.0, r.size.x + 12, 4))

	# Mensole: bordo chiaro, ombra sotto, beccatelli.
	for l in room["ledges"]:
		var r: Rect2 = l
		c.draw_rect(Rect2(r.position, Vector2(r.size.x, 3)), light)
		Art.grad_rect(c, Rect2(r.position.x + 6, r.end.y, r.size.x - 12, 30), Color(0, 0, 0, 0.35), Color(0, 0, 0, 0))
		var bx := r.position.x + 22.0
		while bx < r.end.x - 14.0:
			c.draw_colored_polygon(PackedVector2Array([
				Vector2(bx - 9, r.end.y), Vector2(bx + 9, r.end.y), Vector2(bx + 4, r.end.y + 20), Vector2(bx - 4, r.end.y + 20),
			]), stone.darkened(0.25))
			c.draw_line(Vector2(bx - 9, r.end.y), Vector2(bx + 9, r.end.y), light.darkened(0.2), 1.5)
			bx += 72.0
		_moss(c, rng, Rect2(r.position, Vector2(r.size.x, 3)))

	# Pilastri ai lati: lesena chiara e capitello sopra il portale.
	var door_top := fy - Room.DOOR_H
	for x in [Room.EDGE - 10.0, size.x - Room.EDGE]:
		c.draw_rect(Rect2(x, -200, 10, door_top + 200.0), Color(light, 0.25))
	c.draw_rect(Rect2(-10, door_top - 26.0, Room.EDGE + PORTAL_W + 28.0, 14), light)
	c.draw_rect(Rect2(size.x - Room.EDGE - PORTAL_W - 18.0, door_top - 26.0, Room.EDGE + PORTAL_W + 28.0, 14), light)


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
	_portal(_doors, left_open)
	_doors.draw_set_transform(Vector2(size.x, 0), 0.0, Vector2(-1, 1))
	_portal(_doors, right_open)
	_doors.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


## Portale sul lato sinistro (il destro è disegnato specchiato).
func _portal(c: CanvasItem, is_open: bool) -> void:
	var fy := _floor()
	var door_top := fy - Room.DOOR_H
	var x := 0.0
	var w := Room.EDGE + PORTAL_W
	var r := w * 0.5
	var spring := door_top + r
	var light: Color = th.stone_light
	var stone: Color = th.stone

	var inner := Rect2(x, spring, w, fy - spring)
	if is_open:
		var pulse := 0.5 + 0.5 * sin(_t * 2.4)
		var glow := Color(0.72, 0.86, 1.0)
		Art.grad_rect_h(c, inner, Color(glow, 0.55 + 0.15 * pulse), Color(glow, 0.05))
		c.draw_circle(Vector2(x + r, spring), r, Color(glow, 0.18 + 0.06 * pulse))
		for k in 5:
			var py := fy - fmod(_t * 40.0 + k * 41.0, Room.DOOR_H - 30.0)
			var px := x + 8.0 + fmod(k * 23.0 + _t * 9.0, w - 16.0)
			c.draw_circle(Vector2(px, py), 2.0, Color(1, 1, 1, 0.6))
	else:
		c.draw_rect(inner, Color(0.02, 0.02, 0.03))
		c.draw_circle(Vector2(x + r, spring), r, Color(0.02, 0.02, 0.03))
		var iron := Color(0.16, 0.16, 0.2)
		var bx := x + 8.0
		while bx < x + w - 4.0:
			c.draw_line(Vector2(bx, spring - r * 0.6), Vector2(bx, fy), iron, 4.0)
			c.draw_colored_polygon(PackedVector2Array([Vector2(bx - 4, spring - r * 0.6), Vector2(bx + 4, spring - r * 0.6), Vector2(bx, spring - r * 0.6 - 10)]), iron)
			bx += 13.0
		c.draw_line(Vector2(x, fy - 70.0), Vector2(x + w, fy - 70.0), iron, 4.0)
		c.draw_line(Vector2(x, spring + 10.0), Vector2(x + w, spring + 10.0), iron, 4.0)
	# Cornice ad arco e stipite.
	c.draw_arc(Vector2(x + r, spring), r + 7.0, PI, TAU, 24, stone.lightened(0.1), 14.0)
	c.draw_arc(Vector2(x + r, spring), r + 1.0, PI, TAU, 24, light, 3.0)
	c.draw_rect(Rect2(x + w, spring, 16, fy - spring), stone.lightened(0.05))
	c.draw_rect(Rect2(x + w, spring, 3, fy - spring), light)
	c.draw_colored_polygon(PackedVector2Array([Vector2(x + r - 9, door_top - 8), Vector2(x + r + 9, door_top - 8), Vector2(x + r + 6, door_top + 12), Vector2(x + r - 6, door_top + 12)]), light)
