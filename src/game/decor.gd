extends Node2D
## Elemento decorativo del piano di gioco: lampione, torcia, statua dipinta. Alberi, fontane,
## colonne e stendardi stanno negli sfondi dipinti. Lampioni e torce aggiungono luci reali
## (PointLight2D), bagliori additivi e particelle; solo quelli animati si ridisegnano ogni frame.

var kind := "lamp"
var th: Dictionary = {}
var _t := 0.0
var _redraw := false
var _light: PointLight2D
var _glow: Sprite2D
var _base_energy := 1.0
var _seed := 0.0

## Le luci del piano di gioco illuminano anche gli sfondi dipinti: energia contenuta.
const LAMP_ENERGY := 0.8
const TORCH_ENERGY := 0.85
const STATUE_TEX := preload("res://assets/art/props/statua_cavaliere.png")
## Altezza a schermo della statua dipinta (piedistallo compreso), in unità di mondo.
const STATUE_H := 230.0
const IRON := Color(0.07, 0.07, 0.09)
const IRON_HI := Color(0.28, 0.28, 0.33)


func setup(k: String, theme: Dictionary, pos: Vector2) -> void:
	kind = k
	th = theme
	position = pos
	_seed = pos.x * 0.37
	var lamp: Color = th.lamp
	match kind:
		"lamp":
			_light = Art.point_light(self, Vector2(0, -232), lamp, LAMP_ENERGY, 760.0)
			_glow = Art.glow(self, Vector2(0, -232), Color(lamp, 0.35), 110.0)
		"torch":
			_light = Art.point_light(self, Vector2(0, -14), lamp, TORCH_ENERGY, 640.0)
			_glow = Art.glow(self, Vector2(0, -16), Color(lamp, 0.55), 100.0)
			_embers(lamp)
			_redraw = true
	if _light:
		_base_energy = _light.energy
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	# Lampioni e torce non si illuminano da soli: la loro luce brucerebbe il vetro e il ferro.
	if _light:
		light_mask = 0
	set_process(_light != null or _redraw)


func _process(delta: float) -> void:
	_t += delta
	if _light:
		var flick := 1.0 + 0.05 * sin(_t * 13.0 + _seed) + 0.035 * sin(_t * 27.0 + _seed * 2.0)
		_light.energy = _base_energy * flick
		if _glow:
			_glow.modulate.a = clampf(0.4 * flick, 0.0, 1.0)
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
	# Vetro ambrato, non bianco: il bagliore lo aggiunge il post-processing.
	Art.grad_rect(self, Rect2(-11, -248, 22, 32), Color(lamp.lightened(0.25), 1.0), Color(lamp.darkened(0.35), 1.0))
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
	# Statua del cavaliere col giglio, dipinta: piedistallo appoggiato sul punto di posa.
	var k := STATUE_H / float(STATUE_TEX.get_height())
	var sz := Vector2(STATUE_TEX.get_width(), STATUE_TEX.get_height()) * k
	var tint: Color = th.get("ambient", Color.WHITE)
	draw_texture_rect(STATUE_TEX, Rect2(Vector2(-sz.x * 0.5, -sz.y + 4.0), sz), false, tint.lerp(Color.WHITE, 0.35))
