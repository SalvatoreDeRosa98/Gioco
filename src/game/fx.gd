class_name Fx
extends RefCounted
## Effetti visivi locali: particelle, onde d'urto, anime, meteo e hit-stop.
## Non sono sincronizzati: ogni PC li crea da sé (l'host li annuncia con una RPC leggera).


## Particelle "one shot" configurabili. Si eliminano da sole a fine vita.
static func particles(parent: Node, pos: Vector2, color: Color, cfg: Dictionary) -> CPUParticles2D:
	var p := CPUParticles2D.new()
	p.position = pos
	p.texture = cfg.get("texture", Art.soft_texture())
	p.one_shot = true
	p.explosiveness = cfg.get("explosiveness", 1.0)
	p.amount = cfg.get("amount", 16)
	p.lifetime = cfg.get("life", 0.6)
	p.direction = cfg.get("dir", Vector2.UP)
	p.spread = cfg.get("spread", 180.0)
	p.gravity = cfg.get("gravity", Vector2.ZERO)
	p.initial_velocity_min = cfg.get("vmin", 60.0)
	p.initial_velocity_max = cfg.get("vmax", 200.0)
	p.damping_min = cfg.get("damping", 0.0)
	p.damping_max = cfg.get("damping", 0.0)
	p.scale_amount_min = cfg.get("smin", 0.1)
	p.scale_amount_max = cfg.get("smax", 0.3)
	p.emission_shape = CPUParticles2D.EMISSION_SHAPE_SPHERE
	p.emission_sphere_radius = cfg.get("radius", 4.0)
	p.particle_flag_align_y = cfg.get("align", false)
	var curve := Curve.new()
	curve.add_point(Vector2(0.0, 1.0))
	curve.add_point(Vector2(1.0, 0.0))
	p.scale_amount_curve = curve
	var ramp := Gradient.new()
	ramp.set_color(0, color)
	ramp.set_color(1, Color(color, 0.0))
	p.color_ramp = ramp
	if cfg.get("additive", true):
		p.material = Art.add_material()
	p.emitting = true
	parent.add_child(p)
	parent.get_tree().create_timer(p.lifetime + 0.6).timeout.connect(p.queue_free)
	return p


## Colpo andato a segno: scintille nella direzione del colpo, lampo e anello.
static func hit(parent: Node, pos: Vector2, color: Color, dir: float) -> void:
	particles(parent, pos, color, {
		"texture": Art.streak_texture(), "amount": 14, "life": 0.32, "dir": Vector2(dir, -0.2),
		"spread": 55.0, "vmin": 260.0, "vmax": 620.0, "damping": 1100.0, "smin": 0.5, "smax": 0.9, "align": true,
	})
	particles(parent, pos, Color(1, 1, 1, 0.9), {"amount": 1, "life": 0.14, "vmin": 0.0, "vmax": 0.0, "smin": 2.2, "smax": 2.2})
	ring(parent, pos, Color(color, 0.8), 46.0, 0.22)


## Morte di un nemico: esplosione di frammenti, anime che salgono e anello ampio.
static func death(parent: Node, pos: Vector2, color: Color) -> void:
	particles(parent, pos, color, {
		"amount": 34, "life": 0.9, "vmin": 90.0, "vmax": 360.0, "damping": 320.0, "smin": 0.12, "smax": 0.32,
	})
	particles(parent, pos, Color(color.lightened(0.4), 0.9), {
		"amount": 10, "life": 1.8, "explosiveness": 0.6, "dir": Vector2.UP, "spread": 50.0,
		"gravity": Vector2(0, -90), "vmin": 20.0, "vmax": 70.0, "smin": 0.25, "smax": 0.45, "radius": 18.0,
	})
	particles(parent, pos, Color(1, 1, 1, 1), {"amount": 1, "life": 0.2, "vmin": 0.0, "vmax": 0.0, "smin": 4.0, "smax": 4.0})
	ring(parent, pos, Color(color, 0.9), 110.0, 0.4)


## Polvere a terra (atterraggi, corsa, onde d'urto). Non additiva: è materia, non luce.
static func dust(parent: Node, pos: Vector2, amount: int, spread_dir: float = 0.0) -> void:
	particles(parent, pos, Color(0.78, 0.74, 0.7, 0.45), {
		"amount": amount, "life": 0.55, "dir": Vector2(spread_dir, -1.0) if spread_dir != 0.0 else Vector2.UP,
		"spread": 70.0, "vmin": 30.0, "vmax": 110.0, "damping": 120.0, "gravity": Vector2(0, -30),
		"smin": 0.2, "smax": 0.45, "additive": false, "radius": 10.0,
	})


## Scintille dorate quando si raccoglie qualcosa.
static func sparkle(parent: Node, pos: Vector2, color: Color) -> void:
	particles(parent, pos, color, {
		"amount": 12, "life": 0.6, "vmin": 40.0, "vmax": 160.0, "damping": 200.0, "gravity": Vector2(0, -60),
		"smin": 0.08, "smax": 0.18,
	})
	ring(parent, pos, Color(color, 0.7), 34.0, 0.3)


## Anello che si espande e svanisce.
static func ring(parent: Node, pos: Vector2, color: Color, radius: float, duration: float) -> void:
	var n := Node2D.new()
	n.position = pos
	n.material = Art.add_material()
	n.scale = Vector2.ONE * 0.2
	n.draw.connect(_draw_ring.bind(n, radius, color))
	parent.add_child(n)
	var tw := n.create_tween().set_parallel(true)
	tw.tween_property(n, "scale", Vector2.ONE, duration).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_property(n, "modulate:a", 0.0, duration)
	tw.chain().tween_callback(n.queue_free)


static func _draw_ring(n: CanvasItem, radius: float, color: Color) -> void:
	n.draw_arc(Vector2.ZERO, radius, 0.0, TAU, 48, color, 3.0, true)
	n.draw_arc(Vector2.ZERO, radius * 0.92, 0.0, TAU, 48, Color(color, color.a * 0.35), 6.0, true)


## Breve congelamento del tempo per dare peso ai colpi.
static func hitstop(node: Node, duration: float) -> void:
	if Engine.time_scale < 1.0 or not node.is_inside_tree():
		return
	Engine.time_scale = 0.05
	await node.get_tree().create_timer(duration, true, false, true).timeout
	Engine.time_scale = 1.0


## Meteo continuo che segue la camera (pioggia, lucciole, braci, pulviscolo).
static func weather(kind: String, th: Dictionary) -> CPUParticles2D:
	var p := CPUParticles2D.new()
	p.local_coords = false
	p.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	p.emission_rect_extents = Vector2(820, 480)
	p.texture = Art.soft_texture()
	p.spread = 180.0
	var ramp := Gradient.new()
	var col: Color = th.get("lamp", Color.WHITE)
	match kind:
		"rain":
			p.texture = Art.streak_texture()
			p.amount = 320
			p.lifetime = 0.75
			p.direction = Vector2(0.18, 1.0)
			p.spread = 3.0
			p.initial_velocity_min = 950.0
			p.initial_velocity_max = 1150.0
			p.particle_flag_align_y = true
			p.scale_amount_min = 0.55
			p.scale_amount_max = 0.9
			p.emission_rect_extents = Vector2(900, 60)
			col = Color(0.75, 0.8, 0.95, 0.32)
			ramp.set_color(0, col)
			ramp.set_color(1, Color(col, 0.15))
		"fireflies":
			p.amount = 46
			p.lifetime = 6.0
			p.initial_velocity_min = 8.0
			p.initial_velocity_max = 26.0
			p.scale_amount_min = 0.07
			p.scale_amount_max = 0.13
			p.material = Art.add_material()
			col = Color(0.8, 1.0, 0.45, 1.0)
			ramp.set_color(0, Color(col, 0.0))
			ramp.set_color(1, Color(col, 0.0))
			ramp.add_point(0.2, col)
			ramp.add_point(0.45, Color(col, 0.25))
			ramp.add_point(0.75, col)
		"embers":
			p.amount = 70
			p.lifetime = 4.5
			p.direction = Vector2.UP
			p.spread = 50.0
			p.gravity = Vector2(10, -35)
			p.initial_velocity_min = 15.0
			p.initial_velocity_max = 55.0
			p.scale_amount_min = 0.04
			p.scale_amount_max = 0.09
			p.material = Art.add_material()
			col = Color(1.0, 0.62, 0.25, 1.0)
			ramp.set_color(0, Color(col, 0.0))
			ramp.set_color(1, Color(1.0, 0.3, 0.1, 0.0))
			ramp.add_point(0.15, col)
		"leaves":
			p.texture = Art.leaf_texture()
			p.amount = 16
			p.lifetime = 9.0
			p.direction = Vector2(1, 0.4)
			p.gravity = Vector2(8, 22)
			p.initial_velocity_min = 15.0
			p.initial_velocity_max = 45.0
			p.angular_velocity_min = -90.0
			p.angular_velocity_max = 90.0
			p.scale_amount_min = 0.7
			p.scale_amount_max = 1.2
			col = Color(0.42, 0.55, 0.3, 0.9)
			ramp.set_color(0, Color(col, 0.0))
			ramp.set_color(1, Color(col, 0.0))
			ramp.add_point(0.1, col)
		_:
			p.amount = 60
			p.lifetime = 7.0
			p.gravity = Vector2(0, -4)
			p.initial_velocity_min = 4.0
			p.initial_velocity_max = 14.0
			p.scale_amount_min = 0.03
			p.scale_amount_max = 0.07
			p.material = Art.add_material()
			col = Color(col, 0.55)
			ramp.set_color(0, Color(col, 0.0))
			ramp.set_color(1, Color(col, 0.0))
			ramp.add_point(0.3, col)
	p.color_ramp = ramp
	p.preprocess = p.lifetime
	return p
