extends Node2D
## Terreno della stanza dipinto: pavimento, blocchi, mensole e pilastri usano la pietra di
## assets/art/props/terreno.png (ripetuta a specchio), i portali la grata di cancello.png.
## Ombre di contatto e bagliore dei portali aperti sono disegnati dal motore; erba, rampicanti e
## catene sono sagome disegnate una volta sola che ondeggiano sulla GPU (canvas_env_sway).
## Il Corso ha il pavimento bagnato (canvas_env_reflect) e gli schizzi della pioggia.
## Densità e colori di erba, catene e pavimento bagnato: data/areas.json (grass, chains, floor).

const STONE_TEX := preload("res://assets/art/props/terreno.png")
const GATE_TEX := preload("res://assets/art/props/cancello.png")
const SWAY_SHADER := preload("res://game/shaders/canvas_env_sway.gdshader")
const REFLECT_SHADER := preload("res://game/shaders/canvas_env_reflect.gdshader")
## Altezza della vista di base: serve a convertire unità di mondo in UV di schermo.
const VIEW_H := 720.0
## Passo con cui si cercano i punti in cui far nascere un ciuffo d'erba, in unità.
const GRASS_STEP := 7.0
const IRON := Color(0.06, 0.055, 0.06)
const IRON_HI := Color(0.3, 0.27, 0.24)

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
var _sway: Node2D
var _doors: Node2D
var _wet: Node2D
var _cfg: Dictionary = {}
# Triangoli dello strato che ondeggia (ricostruiti a ogni stanza).
var _sw_pts := PackedVector2Array()
var _sw_cols := PackedColorArray()
var _sw_idx := PackedInt32Array()
var _t := 0.0
var _gate_left := 1.0   # 1 = grata chiusa visibile, 0 = sparita
var _gate_right := 1.0


func _ready() -> void:
	_stone = _sublayer(_draw_stone)
	_detail = _sublayer(_draw_detail)
	_sway = _sublayer(_draw_sway)
	var mat := ShaderMaterial.new()
	mat.shader = SWAY_SHADER
	_sway.material = mat
	_doors = _sublayer(_draw_doors)
	_wet = Node2D.new()
	# Sopra la pietra, sotto i personaggi (entità a z 10).
	_wet.z_index = 1
	add_child(_wet)


func build(r: Dictionary, theme: Dictionary) -> void:
	room = r
	th = theme
	_cfg = Backdrop.area(r["theme"])
	_tint = Color(_cfg.get("terrain_tint", "#ffffff"))
	var grass: Dictionary = _cfg.get("grass", {})
	var mat := _sway.material as ShaderMaterial
	mat.set_shader_parameter("amplitude", float(grass.get("sway", 3.0)))
	for n in [_stone, _detail, _sway, _doors]:
		n.queue_redraw()
	_build_wet()


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
		# Tiranti laterali dal soffitto: le mensole non attraversano i pali dei lampioni.
		for x in [r.position.x + 16.0, r.end.x - 16.0]:
			c.draw_line(Vector2(x, 0), Vector2(x, r.position.y), Color(0.22, 0.2, 0.18, 0.65), 2.0)
		_band(c, r.position.x, r.end.x, r.position.y - CAP_LIFT, CAP_ROWS, LEDGE_SCALE)


# ---------------------------------------------------------------- Ombre e dettagli

func _draw_detail() -> void:
	if room.is_empty():
		return
	var size := _size()
	var fy := _floor()
	var c := _detail
	var dark := Color(_tint.darkened(0.85), 1.0)

	# Il pavimento sfuma nel buio verso il basso.
	Art.grad_rect(c, Rect2(-200, fy + 30.0, size.x + 400.0, 80), Color(0, 0, 0, 0.0), Color(0, 0, 0, 0.75))

	# Blocchi: colature d'umidità dal bordo alto, ombre ai lati e contatto con il pavimento.
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(room["name"]) + 3
	for b in room["blocks"]:
		var r: Rect2 = b
		var sx := r.position.x + rng.randf_range(10.0, 40.0)
		while sx < r.end.x - 16.0:
			var w := rng.randf_range(5.0, 16.0)
			var h := minf(rng.randf_range(24.0, 110.0), r.size.y - 10.0)
			Art.grad_rect(c, Rect2(sx, r.position.y + 6.0, w, h), Color(0, 0, 0, rng.randf_range(0.12, 0.3)), Color(0, 0, 0, 0))
			sx += rng.randf_range(26.0, 90.0)
		Art.grad_rect_h(c, Rect2(r.position.x, r.position.y, 14, r.size.y), Color(0, 0, 0, 0.55), Color(0, 0, 0, 0))
		Art.grad_rect_h(c, Rect2(r.end.x - 14, r.position.y, 14, r.size.y), Color(0, 0, 0, 0), Color(0, 0, 0, 0.55))
		c.draw_rect(Rect2(r.position.x - 1.0, r.position.y - CAP_LIFT, 2, r.size.y + CAP_LIFT), Color(0, 0, 0, 0.6))
		c.draw_rect(Rect2(r.end.x - 1.0, r.position.y - CAP_LIFT, 2, r.size.y + CAP_LIFT), Color(0, 0, 0, 0.6))

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

	# Pilastri: ombra verso l'interno della stanza.
	var door_top := fy - Room.DOOR_H
	Art.grad_rect_h(c, Rect2(Room.EDGE - 16.0, -200, 16, door_top + 200.0), Color(0, 0, 0, 0), Color(0, 0, 0, 0.6))
	Art.grad_rect_h(c, Rect2(size.x - Room.EDGE, -200, 16, door_top + 200.0), Color(0, 0, 0, 0.6), Color(0, 0, 0, 0))


# ---------------------------------------------------------------- Erba, rampicanti e catene

## Tutto ciò che ondeggia: nell'alpha del colore di vertice va il peso dell'oscillazione.
## Fili d'erba, foglie e maglie finiscono in un'unica lista di triangoli (un solo comando di
## disegno per stanza, anche con migliaia di fili).
func _draw_sway() -> void:
	if room.is_empty():
		return
	_sw_pts = PackedVector2Array()
	_sw_cols = PackedColorArray()
	_sw_idx = PackedInt32Array()
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(room["name"]) + 7
	var size := _size()
	var fy := _floor()
	var grass: Dictionary = _cfg.get("grass", {})
	var density := float(grass.get("density", 0.0))
	if density > 0.0:
		_grass_edge(rng, -200.0, size.x + 200.0, fy - CAP_LIFT + 2.0, grass, density)
		for b in room["blocks"]:
			var r: Rect2 = b
			_grass_edge(rng, r.position.x + 4.0, r.end.x - 4.0, r.position.y - CAP_LIFT + 2.0, grass, density)
			_vines(rng, r.position.x, r.end.x, r.position.y - CAP_LIFT + 30.0, grass, density, float(grass.get("vines", 0.5)))
		for l in room["ledges"]:
			var r: Rect2 = l
			_grass_edge(rng, r.position.x + 4.0, r.end.x - 4.0, r.position.y - CAP_LIFT + 2.0, grass, density * 0.7)
			_vines(rng, r.position.x + 6.0, r.end.x - 6.0, r.position.y - CAP_LIFT + (CAP_ROWS.y - CAP_ROWS.x) * LEDGE_SCALE, grass, density, 1.0)
	var chains: Dictionary = _cfg.get("chains", {})
	if float(chains.get("chance", 0.0)) > 0.0:
		for l in room["ledges"]:
			var r: Rect2 = l
			var bottom := r.position.y - CAP_LIFT + (CAP_ROWS.y - CAP_ROWS.x) * LEDGE_SCALE
			for x in [r.position.x + 24.0, r.end.x - 24.0]:
				if rng.randf() < float(chains["chance"]):
					var len_range: Array = chains.get("len", [40, 100])
					_chain(Vector2(x, bottom), rng.randf_range(float(len_range[0]), float(len_range[1])))
	if not _sw_idx.is_empty():
		RenderingServer.canvas_item_add_triangle_array(_sway.get_canvas_item(), _sw_idx, _sw_pts, _sw_cols)


## Ciuffi d'erba lungo un bordo: 3-6 fili a ventaglio, radice scura e punta più chiara.
func _grass_edge(rng: RandomNumberGenerator, x0: float, x1: float, y: float, grass: Dictionary, density: float) -> void:
	var base := Color(grass.get("color", "#101510"))
	var tip := Color(grass.get("tip", "#2a3a2a"))
	var h_range: Array = grass.get("h", [6, 16])
	var x := x0
	while x < x1:
		# Ciuffi a gruppi: il rumore lento lascia tratti spogli e tratti folti.
		var patch := 0.5 + 0.5 * sin(x * 0.013 + rng.randf() * 0.3) * sin(x * 0.0041 + 1.7)
		if rng.randf() < density * (0.25 + patch):
			var h := rng.randf_range(float(h_range[0]), float(h_range[1])) * (0.6 + patch * 0.6)
			for i in rng.randi_range(3, 6):
				var bx := x + rng.randf_range(-4.0, 4.0)
				var bh := h * rng.randf_range(0.55, 1.0)
				var lean := rng.randf_range(-0.45, 0.45) * bh
				var w := rng.randf_range(1.6, 2.8)
				var shade := tip.lerp(base, rng.randf_range(0.0, 0.6))
				_sw_tri(Vector2(bx - w, y), Vector2(bx + w, y), Vector2(bx + lean, y - bh),
					Color(base, 0.0), Color(base, 0.0), Color(shade, 1.0))
		x += GRASS_STEP


## Rampicanti che pendono dal bordo di blocchi e mensole (pesati verso il basso): stelo sottile
## e foglie irregolari, fitte in alto (dove l'edera si aggrappa) e rade verso la punta.
func _vines(rng: RandomNumberGenerator, x0: float, x1: float, y: float, grass: Dictionary, density: float, amount: float) -> void:
	var base := Color(grass.get("color", "#101510"))
	var tip := Color(grass.get("tip", "#2a3a2a"))
	var x := x0
	while x < x1:
		if rng.randf() < density * amount * 0.12:
			var length := rng.randf_range(12.0, 46.0) * (1.0 + amount * 0.5)
			var steps := 6
			var first := _sw_pts.size()
			for i in steps + 1:
				var t := float(i) / float(steps)
				var wob := sin(t * 5.0 + x) * 2.0
				var col := Color(base.lerp(tip, t * 0.5), t)
				_sw_pts.append(Vector2(x - 1.2 * (1.0 - t) + wob, y + length * t))
				_sw_pts.append(Vector2(x + 1.2 * (1.0 - t) + 0.4 + wob, y + length * t))
				_sw_cols.append(col)
				_sw_cols.append(col)
			for i in steps:
				var a := first + i * 2
				_sw_idx.append_array(PackedInt32Array([a, a + 1, a + 2, a + 1, a + 3, a + 2]))
			var leaf_y := -2.0
			while leaf_y < length:
				var t := maxf(leaf_y, 0.0) / length
				if rng.randf() > t * 0.7:
					var c := Vector2(x + sin(t * 5.0 + x) * 2.0 + rng.randf_range(-5.0, 5.0) * (1.0 - t * 0.5), y + leaf_y)
					var radius := Vector2(rng.randf_range(2.6, 4.4), rng.randf_range(1.8, 3.0))
					_sw_fan(Art.ellipse(c, radius, 6), Color(base.lerp(tip, rng.randf_range(0.0, 0.45)), t))
				leaf_y += rng.randf_range(2.5, 6.0)
		x += GRASS_STEP


## Catena di ferro appesa: maglie alternate di fronte (ovale col foro) e di taglio.
func _chain(top: Vector2, length: float) -> void:
	var link := 9.0
	var n := int(length / link)
	for i in n:
		var y := top.y + i * link
		var k := float(i) / float(maxi(n, 1))
		var p := Vector2(top.x, y + link * 0.5)
		if i % 2 == 0:
			_sw_fan(Art.ellipse(p, Vector2(3.4, 5.6), 10), Color(IRON_HI, k))
			_sw_fan(Art.ellipse(p, Vector2(1.6, 3.4), 8), Color(IRON, k))
		else:
			_sw_fan(PackedVector2Array([p + Vector2(-1.1, -5.6), p + Vector2(1.1, -5.6), p + Vector2(1.1, 5.6), p + Vector2(-1.1, 5.6)]), Color(IRON, k))
	# Gancio finale: gambo dritto e punta piegata.
	var end := Vector2(top.x, top.y + n * link + 2.0)
	_sw_fan(PackedVector2Array([end + Vector2(-1.5, -2), end + Vector2(1.5, -2), end + Vector2(1.5, 8), end + Vector2(-1.5, 8)]), Color(IRON, 1.0))
	_sw_fan(PackedVector2Array([end + Vector2(1.5, 7), end + Vector2(-5, 11), end + Vector2(-5, 8.5), end + Vector2(-1.5, 6.5)]), Color(IRON, 1.0))


## Un triangolo con tre colori (rgb = colore, alpha = peso dell'oscillazione).
func _sw_tri(a: Vector2, b: Vector2, c: Vector2, ca: Color, cb: Color, cc: Color) -> void:
	var first := _sw_pts.size()
	_sw_pts.append_array(PackedVector2Array([a, b, c]))
	_sw_cols.append_array(PackedColorArray([ca, cb, cc]))
	_sw_idx.append_array(PackedInt32Array([first, first + 1, first + 2]))


## Poligono convesso di un solo colore, triangolato a ventaglio dal primo vertice.
func _sw_fan(pts: PackedVector2Array, color: Color) -> void:
	var first := _sw_pts.size()
	_sw_pts.append_array(pts)
	for i in pts.size():
		_sw_cols.append(color)
	for i in range(1, pts.size() - 1):
		_sw_idx.append_array(PackedInt32Array([first, first + i, first + i + 1]))


# ---------------------------------------------------------------- Pavimento bagnato

## Riflessi sul pavimento e schizzi di pioggia su pavimento, blocchi e mensole (solo se l'area
## ha "floor" in data/areas.json).
func _build_wet() -> void:
	for c in _wet.get_children():
		c.queue_free()
	var floor_cfg: Dictionary = _cfg.get("floor", {})
	if floor_cfg.is_empty():
		return
	var size := _size()
	var fy := _floor()
	var depth := float(floor_cfg.get("depth", 70.0))
	var rect := ColorRect.new()
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	rect.position = Vector2(-200.0, fy - CAP_LIFT)
	rect.size = Vector2(size.x + 400.0, depth)
	var mat := ShaderMaterial.new()
	mat.shader = REFLECT_SHADER
	mat.set_shader_parameter("tint", Color(floor_cfg.get("tint", "#ffffff")))
	mat.set_shader_parameter("strength", float(floor_cfg.get("reflect", 0.6)))
	mat.set_shader_parameter("wet", float(floor_cfg.get("wet", 0.3)))
	mat.set_shader_parameter("height_uv", depth * Room.CAMERA_ZOOM / VIEW_H)
	rect.material = mat
	_wet.add_child(rect)

	mat.set_shader_parameter("depth_units", depth)
	mat.set_shader_parameter("rings", float(floor_cfg.get("rings", 0.0)))

	var drops := float(floor_cfg.get("splashes", 0.0))
	if drops <= 0.0:
		return
	var color := Color(0.85, 0.88, 1.0, 0.75)
	var surfaces: Array = [Rect2(-100.0, fy - CAP_LIFT + 3.0, size.x + 200.0, 0)]
	for b in room["blocks"]:
		var r: Rect2 = b
		surfaces.append(Rect2(r.position.x, r.position.y - CAP_LIFT + 3.0, r.size.x, 0))
	for l in room["ledges"]:
		var r: Rect2 = l
		surfaces.append(Rect2(r.position.x, r.position.y - CAP_LIFT + 2.0, r.size.x, 0))
	for r in surfaces:
		var w: float = r.size.x
		var sp := Fx.splashes(w, int(drops * w / 100.0), color)
		sp.position = Vector2(r.position.x + w * 0.5, r.position.y)
		_wet.add_child(sp)


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
