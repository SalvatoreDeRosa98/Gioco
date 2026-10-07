extends Node2D
## Elemento decorativo di una stanza: lampione, torcia, statua, colonna, fontana, albero, cipresso,
## palma, panchina, stendardo, vaso. Alcuni aggiungono luci reali (PointLight2D), bagliori additivi
## e particelle; solo quelli animati si ridisegnano ogni frame.

var kind := "lamp"
var th: Dictionary = {}
var _t := 0.0
var _redraw := false
var _light: PointLight2D
var _glow: Sprite2D
var _base_energy := 1.0
var _seed := 0.0

const IRON := Color(0.07, 0.07, 0.09)
const IRON_HI := Color(0.28, 0.28, 0.33)
const MARBLE := Color(0.78, 0.76, 0.72)
const MARBLE_SHADE := Color(0.4, 0.41, 0.46)


func setup(k: String, theme: Dictionary, pos: Vector2) -> void:
	kind = k
	th = theme
	position = pos
	_seed = pos.x * 0.37
	var lamp: Color = th.lamp
	match kind:
		"lamp":
			_light = Art.point_light(self, Vector2(0, -232), lamp, 1.2, 820.0)
			_glow = Art.glow(self, Vector2(0, -232), Color(lamp, 0.6), 130.0)
		"torch":
			_light = Art.point_light(self, Vector2(0, -14), lamp, 1.35, 720.0)
			_glow = Art.glow(self, Vector2(0, -16), Color(lamp, 0.75), 120.0)
			_embers(lamp)
			_redraw = true
		"fountain":
			_light = Art.point_light(self, Vector2(0, -90), Color(0.55, 0.8, 1.0), 0.65, 460.0)
			_spray()
			_redraw = true
		"banner":
			_redraw = true
	if _light:
		_base_energy = _light.energy
	set_process(_light != null or _redraw)


func _process(delta: float) -> void:
	_t += delta
	if _light:
		var flick := 1.0 + 0.05 * sin(_t * 13.0 + _seed) + 0.035 * sin(_t * 27.0 + _seed * 2.0)
		_light.energy = _base_energy * flick
		if _glow:
			_glow.modulate.a = clampf(0.6 * flick, 0.0, 1.0)
	if _redraw:
		queue_redraw()


func _draw() -> void:
	match kind:
		"lamp":
			_draw_lamp()
		"torch":
			_draw_torch()
		"statue":
			_draw_statue()
		"column":
			_draw_column()
		"fountain":
			_draw_fountain()
		"tree":
			_draw_tree()
		"cypress":
			_draw_cypress()
		"palm":
			_draw_palm()
		"bench":
			_draw_bench()
		"banner":
			_draw_banner()
		"vase":
			_draw_vase()


# ---------------------------------------------------------------- Luci

func _draw_lamp() -> void:
	draw_colored_polygon(PackedVector2Array([Vector2(-17, 0), Vector2(17, 0), Vector2(10, -28), Vector2(-10, -28)]), IRON)
	draw_rect(Rect2(-12, -32, 24, 6), IRON_HI)
	Art.grad_rect_h(self, Rect2(-4, -212, 8, 182), IRON_HI, IRON)
	draw_circle(Vector2(0, -120), 6.0, IRON)
	draw_circle(Vector2(0, -170), 4.5, IRON)
	draw_rect(Rect2(-8, -214, 16, 6), IRON_HI)
	draw_colored_polygon(PackedVector2Array([Vector2(-15, -214), Vector2(15, -214), Vector2(19, -252), Vector2(-19, -252)]), IRON)
	var lamp: Color = th.lamp
	Art.grad_rect(self, Rect2(-11, -248, 22, 32), Color(1, 0.97, 0.88), Color(lamp, 1.0))
	draw_line(Vector2(0, -248), Vector2(0, -216), Color(IRON, 0.7), 1.5)
	draw_colored_polygon(PackedVector2Array([Vector2(-24, -252), Vector2(24, -252), Vector2(0, -272)]), IRON)
	draw_circle(Vector2(0, -275), 3.5, IRON_HI)


func _draw_torch() -> void:
	draw_rect(Rect2(-3, 4, 6, 44), IRON)
	draw_rect(Rect2(-10, 30, 20, 4), IRON_HI)
	draw_colored_polygon(PackedVector2Array([Vector2(-11, -2), Vector2(11, -2), Vector2(6, 12), Vector2(-6, 12)]), IRON)
	var lamp: Color = th.lamp
	var f1 := sin(_t * 17.0 + _seed) * 3.0
	var f2 := sin(_t * 11.0 + _seed * 1.7) * 2.0
	draw_colored_polygon(PackedVector2Array([Vector2(-10, -2), Vector2(10, -2), Vector2(6 + f2, -22), Vector2(f1, -42), Vector2(-6 + f2, -22)]), Color(lamp, 0.95))
	draw_colored_polygon(PackedVector2Array([Vector2(-5, -2), Vector2(5, -2), Vector2(3, -14), Vector2(f1 * 0.5, -26), Vector2(-3, -14)]), Color(1, 0.95, 0.75))


func _embers(color: Color) -> void:
	var p := CPUParticles2D.new()
	p.position = Vector2(0, -24)
	p.texture = Art.soft_texture()
	p.material = Art.add_material()
	p.amount = 10
	p.lifetime = 1.4
	p.direction = Vector2.UP
	p.spread = 25.0
	p.gravity = Vector2(0, -40)
	p.initial_velocity_min = 20.0
	p.initial_velocity_max = 60.0
	p.scale_amount_min = 0.04
	p.scale_amount_max = 0.08
	var ramp := Gradient.new()
	ramp.set_color(0, Color(1, 0.85, 0.5, 1))
	ramp.set_color(1, Color(color, 0.0))
	p.color_ramp = ramp
	add_child(p)


# ---------------------------------------------------------------- Pietra e marmo

func _draw_statue() -> void:
	var stone: Color = th.stone
	var light: Color = th.stone_light
	Art.grad_rect_h(self, Rect2(-36, -84, 72, 84), light, stone.darkened(0.2))
	draw_rect(Rect2(-42, -90, 84, 10), light)
	draw_rect(Rect2(-44, -10, 88, 10), stone)
	draw_polygon(PackedVector2Array([Vector2(-18, -90), Vector2(20, -90), Vector2(15, -158), Vector2(-12, -158)]),
		PackedColorArray([MARBLE_SHADE, MARBLE, MARBLE, MARBLE_SHADE]))
	for k in 4:
		draw_line(Vector2(-10 + k * 7, -92), Vector2(-6 + k * 6, -150), Color(0, 0, 0, 0.18), 1.5)
	draw_polygon(PackedVector2Array([Vector2(-13, -158), Vector2(15, -158), Vector2(17, -202), Vector2(-11, -202)]),
		PackedColorArray([MARBLE_SHADE, MARBLE, MARBLE, MARBLE_SHADE]))
	draw_line(Vector2(12, -196), Vector2(30, -222), MARBLE, 7.0, true)
	draw_line(Vector2(30, -222), Vector2(34, -248), MARBLE, 6.0, true)
	draw_circle(Vector2(35, -254), 6.0, MARBLE)
	draw_line(Vector2(-10, -196), Vector2(-18, -170), MARBLE_SHADE, 7.0, true)
	draw_circle(Vector2(2, -214), 12.0, MARBLE)
	draw_arc(Vector2(2, -214), 12.0, PI * 0.9, PI * 1.9, 12, MARBLE_SHADE, 3.0)
	draw_arc(Vector2(2, -214), 13.5, PI * 1.05, PI * 1.85, 10, Color(0.5, 0.55, 0.35, 0.8), 2.5)


func _draw_column() -> void:
	var light: Color = (th.stone_light as Color).lightened(0.05)
	var dark: Color = (th.stone as Color).darkened(0.25)
	var w := 46.0
	var h := 520.0
	Art.grad_rect_h(self, Rect2(-w * 0.5, -h, w * 0.5, h), dark, light)
	Art.grad_rect_h(self, Rect2(0, -h, w * 0.5, h), light, dark)
	var fx := -w * 0.5 + 6.0
	while fx < w * 0.5 - 4.0:
		draw_line(Vector2(fx, -h + 24), Vector2(fx, -34), Color(0, 0, 0, 0.16), 2.0)
		fx += 7.0
	draw_rect(Rect2(-w * 0.5 - 10, -h - 4, w + 20, 18), light)
	draw_circle(Vector2(-w * 0.5 - 6, -h + 8), 8.0, light)
	draw_circle(Vector2(w * 0.5 + 6, -h + 8), 8.0, light)
	draw_rect(Rect2(-w * 0.5 - 12, -26, w + 24, 26), dark.lightened(0.15))
	draw_rect(Rect2(-w * 0.5 - 6, -34, w + 12, 9), light)


func _draw_fountain() -> void:
	var stone: Color = th.stone_light
	var water := Color(0.25, 0.48, 0.62)
	Art.shaded_ellipse(self, Vector2(0, -6), Vector2(168, 20), stone, stone.darkened(0.3))
	Art.shaded_ellipse(self, Vector2(0, -10), Vector2(150, 12), water.lightened(0.15), water.darkened(0.3))
	Art.grad_rect_h(self, Rect2(-14, -122, 28, 116), stone, stone.darkened(0.35))
	draw_colored_polygon(PackedVector2Array([Vector2(-64, -122), Vector2(64, -122), Vector2(42, -144), Vector2(-42, -144)]), stone.darkened(0.15))
	Art.shaded_ellipse(self, Vector2(0, -144), Vector2(44, 7), water.lightened(0.2), water)
	draw_circle(Vector2(0, -158), 9.0, stone)
	draw_circle(Vector2(0, -170), 5.0, stone)
	var jet := Color(0.75, 0.92, 1.0, 0.55)
	for k in 6:
		var side := -1.0 if k % 2 == 0 else 1.0
		var spread := 40.0 + float(k / 2) * 34.0
		var pts := PackedVector2Array()
		for j in 13:
			var t := float(j) / 12.0
			var wob := sin(_t * 6.0 + k) * 2.0
			pts.append(Vector2(side * spread * t + wob * t, -172.0 - 40.0 * t + 150.0 * t * t * (1.0 + float(k / 2) * 0.12)))
		draw_polyline(pts, jet, 2.0, true)
	for k in 4:
		var rr := fmod(_t * 30.0 + k * 35.0, 140.0)
		draw_arc(Vector2(0, -10), rr, 0.0, PI, 24, Color(1, 1, 1, 0.25 * (1.0 - rr / 140.0)), 1.5)


func _spray() -> void:
	var p := CPUParticles2D.new()
	p.position = Vector2(0, -172)
	p.texture = Art.soft_texture()
	p.material = Art.add_material()
	p.amount = 40
	p.lifetime = 1.1
	p.direction = Vector2.UP
	p.spread = 35.0
	p.gravity = Vector2(0, 420)
	p.initial_velocity_min = 90.0
	p.initial_velocity_max = 170.0
	p.scale_amount_min = 0.04
	p.scale_amount_max = 0.1
	var ramp := Gradient.new()
	ramp.set_color(0, Color(0.85, 0.95, 1.0, 0.7))
	ramp.set_color(1, Color(0.6, 0.85, 1.0, 0.0))
	p.color_ramp = ramp
	add_child(p)


# ---------------------------------------------------------------- Verde

func _leaf_colors() -> Array:
	var base: Color = (th.mid as Color).lerp(Color(0.16, 0.27, 0.18), 0.65)
	return [base.darkened(0.25), base, base.lightened(0.18)]


func _draw_tree() -> void:
	var cols := _leaf_colors()
	var bark := Color(0.12, 0.1, 0.1)
	draw_colored_polygon(PackedVector2Array([Vector2(-24, 0), Vector2(-10, -8), Vector2(-8, -260), Vector2(8, -260), Vector2(12, -8), Vector2(28, 0)]), bark)
	draw_line(Vector2(0, -180), Vector2(-60, -260), bark, 9.0, true)
	draw_line(Vector2(2, -210), Vector2(70, -290), bark, 8.0, true)
	var rng := RandomNumberGenerator.new()
	rng.seed = int(_seed * 100.0)
	for layer in 3:
		for k in 9 - layer * 2:
			var off := Vector2(rng.randf_range(-120.0, 120.0), rng.randf_range(-90.0, 40.0)) * (1.0 - layer * 0.2)
			off += Vector2(-12, -14) * layer
			var r := rng.randf_range(42.0, 70.0) * (1.0 - layer * 0.25)
			draw_circle(Vector2(0, -320) + off, r, cols[layer])
	draw_arc(Vector2(-20, -340), 120.0, PI * 1.05, PI * 1.55, 20, Color(th.moon_color, 0.12), 8.0)


func _draw_cypress() -> void:
	var cols := _leaf_colors()
	var pts := PackedVector2Array()
	for k in 25:
		var a := TAU * float(k) / 24.0
		var y := -cos(a) * 190.0 - 190.0
		var w := sin(a) * 32.0 * (0.35 + 0.65 * clampf((y + 380.0) / 380.0, 0.0, 1.0))
		pts.append(Vector2(w, y))
	draw_colored_polygon(pts, cols[0])
	var hl := PackedVector2Array()
	for p in pts:
		if p.x < 0.0:
			hl.append(p * Vector2(0.55, 0.97) + Vector2(-4, 0))
	if hl.size() > 2:
		draw_colored_polygon(hl, cols[1])
	draw_rect(Rect2(-5, -8, 10, 8), Color(0.12, 0.1, 0.1))


func _draw_palm() -> void:
	var cols := _leaf_colors()
	var bark := Color(0.2, 0.16, 0.13)
	var pts := PackedVector2Array()
	for k in 15:
		var t := float(k) / 14.0
		pts.append(Vector2(40.0 * t * t, -330.0 * t))
	for k in pts.size() - 1:
		draw_line(pts[k], pts[k + 1], bark if k % 2 == 0 else bark.lightened(0.1), 13.0 - k * 0.3, true)
	var top := pts[pts.size() - 1]
	var sway := sin(_t * 0.8 + _seed) * 0.05
	for k in 9:
		var a := -PI * 0.5 + (float(k) - 4.0) * 0.4 + sway
		var frond := PackedVector2Array()
		for j in 10:
			var t := float(j) / 9.0
			frond.append(top + Vector2(cos(a), sin(a)) * 130.0 * t + Vector2(0, 80.0 * t * t))
		draw_polyline(frond, cols[k % 3], 8.0, true)


# ---------------------------------------------------------------- Arredo

func _draw_bench() -> void:
	var wood := Color(0.32, 0.2, 0.13)
	for x in [-50.0, 44.0]:
		draw_line(Vector2(x, 0), Vector2(x + 3, -24), IRON, 4.0)
		draw_arc(Vector2(x + 3, -36), 10.0, PI * 0.5, PI * 1.5, 10, IRON, 3.0)
	for k in 3:
		draw_rect(Rect2(-56, -28 + k * -12.0 - (8.0 if k > 0 else 0.0), 112, 6), wood.lightened(k * 0.05))
	draw_rect(Rect2(-56, -26, 112, 6), wood)


func _draw_banner() -> void:
	var red := Color(0.48, 0.07, 0.08)
	var gold := Color(0.85, 0.64, 0.28)
	var w := 72.0
	var h := 240.0
	var left := PackedVector2Array()
	var right := PackedVector2Array()
	for k in 13:
		var t := float(k) / 12.0
		var wave := sin(_t * 1.8 + t * 4.0 + _seed) * 7.0 * t
		left.append(Vector2(-w * 0.5 + wave, t * h))
		right.append(Vector2(w * 0.5 + wave, t * h))
	var tail := right[12] + Vector2(-w * 0.5, 34)
	var pts := PackedVector2Array()
	pts.append_array(left)
	pts.append(tail)
	right.reverse()
	pts.append_array(right)
	var cols := PackedColorArray()
	for p in pts:
		cols.append(red.lerp(red.darkened(0.5), clampf(p.y / h, 0.0, 1.0)))
	draw_polygon(pts, cols)
	draw_line(Vector2(-w * 0.5 - 6, 0), Vector2(w * 0.5 + 6, 0), IRON_HI, 5.0)
	var c := Vector2(sin(_t * 1.8 + 1.6 + _seed) * 3.5, h * 0.4)
	draw_circle(c, 22.0, gold)
	draw_circle(c, 17.0, red.darkened(0.2))
	draw_line(c + Vector2(0, -12), c + Vector2(0, 12), gold, 3.0)
	draw_line(c + Vector2(-8, -2), c + Vector2(8, -2), gold, 3.0)
	draw_circle(c + Vector2(0, -12), 3.5, gold)
	var outline := left.duplicate()
	outline.append(tail)
	draw_polyline(outline, Color(gold, 0.85), 2.5, true)


func _draw_vase() -> void:
	var stone: Color = th.stone_light
	Art.grad_rect_h(self, Rect2(-22, -40, 44, 40), stone, stone.darkened(0.35))
	draw_rect(Rect2(-26, -44, 52, 6), stone)
	var urn := PackedVector2Array([Vector2(-14, -44), Vector2(14, -44), Vector2(26, -72), Vector2(20, -96), Vector2(28, -104), Vector2(-28, -104), Vector2(-20, -96), Vector2(-26, -72)])
	var cols := PackedColorArray()
	for p in urn:
		cols.append(stone.darkened(0.35) if p.x > 0.0 else stone)
	draw_polygon(urn, cols)
	var leaf := _leaf_colors()
	for k in 7:
		var a := -PI * 0.5 + (float(k) - 3.0) * 0.38
		draw_line(Vector2(0, -104), Vector2(0, -104) + Vector2(cos(a), sin(a)) * 46.0, leaf[k % 3], 6.0, true)
