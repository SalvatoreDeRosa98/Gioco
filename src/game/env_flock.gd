extends Node2D
## Stormi lontani che attraversano il cielo ogni tanto: pipistrelli di notte (volo a zig-zag,
## battito rapido) o rondini all'alba (battito lento e planate). Sagome disegnate dal motore su
## uno strato di parallasse quasi fermo; si ridisegna solo mentre uno stormo è in volo.

## Margine oltre il bordo della vista da cui partono e oltre cui spariscono gli uccelli.
const EDGE := 60.0

## Centro della vista in coordinate locali dello strato (lo aggiorna Backdrop.update_camera).
var view_center := Vector2.ZERO

var _cfg: Dictionary = {}
var _half := Vector2(512, 288)
var _birds: Array = []   # elementi: {"pos", "vel", "phase", "size", "flap", "seed"}
var _next := 0.0
var _t := 0.0
var _bats := true
var _color := Color.BLACK
var _rng := RandomNumberGenerator.new()


## cfg da data/areas.json ("flock"); view_half: metà della vista in unità di mondo.
func setup(cfg: Dictionary, view_half: Vector2, seed_value: int) -> void:
	_cfg = cfg
	_half = view_half
	_bats = cfg.get("kind", "bats") == "bats"
	_color = Color(cfg.get("color", "#10121a"))
	_rng.seed = seed_value
	var every: Array = cfg.get("every", [8.0, 16.0])
	# Il primo stormo arriva presto: la scena deve sembrare viva subito.
	_next = _rng.randf_range(1.5, float(every[0]))


func _process(delta: float) -> void:
	_t += delta
	_next -= delta
	if _next <= 0.0:
		_spawn()
		var every: Array = _cfg.get("every", [8.0, 16.0])
		_next = _rng.randf_range(float(every[0]), float(every[1]))
	if _birds.is_empty():
		return
	var alive: Array = []
	for b in _birds:
		var v: Vector2 = b["vel"]
		if _bats:
			# Zig-zag nervoso dei pipistrelli.
			v.y = sin(_t * 5.0 + float(b["seed"])) * 40.0 + cos(_t * 2.3 + float(b["seed"]) * 2.0) * 25.0
		else:
			v.y = sin(_t * 0.8 + float(b["seed"])) * 8.0
		b["pos"] = (b["pos"] as Vector2) + v * delta
		b["phase"] = float(b["phase"]) + delta * float(b["flap"])
		if absf((b["pos"] as Vector2).x - view_center.x) < _half.x + EDGE * 3.0:
			alive.append(b)
	_birds = alive
	queue_redraw()


func _spawn() -> void:
	var count_range: Array = _cfg.get("count", [3, 7])
	var y_range: Array = _cfg.get("y", [0.1, 0.35])
	var size_range: Array = _cfg.get("size", [5.0, 8.0])
	var speed_range: Array = _cfg.get("speed", [70.0, 120.0])
	var from_left := _rng.randf() < 0.5
	var dir := 1.0 if from_left else -1.0
	var start := Vector2(view_center.x - dir * (_half.x + EDGE),
		view_center.y - _half.y + _rng.randf_range(float(y_range[0]), float(y_range[1])) * _half.y * 2.0)
	var speed := _rng.randf_range(float(speed_range[0]), float(speed_range[1]))
	for i in _rng.randi_range(int(count_range[0]), int(count_range[1])):
		var spread := Vector2(-dir * _rng.randf_range(0.0, 120.0), _rng.randf_range(-35.0, 35.0))
		_birds.append({
			"pos": start + spread,
			"vel": Vector2(dir * speed * _rng.randf_range(0.9, 1.1), 0.0),
			"phase": _rng.randf_range(0.0, TAU),
			"size": _rng.randf_range(float(size_range[0]), float(size_range[1])),
			"flap": _rng.randf_range(15.0, 19.0) if _bats else _rng.randf_range(6.0, 8.0),
			"seed": _rng.randf_range(0.0, 100.0),
		})


func _draw() -> void:
	for b in _birds:
		var p: Vector2 = b["pos"]
		var s: float = b["size"]
		var ph: float = b["phase"]
		if _bats:
			var f := sin(ph)
			# Ali membranose a punte, corpo piccolo.
			var wing := PackedVector2Array([
				p + Vector2(-s, -f * s * 0.7), p + Vector2(-s * 0.55, -f * s * 0.2 + s * 0.15),
				p + Vector2(-s * 0.3, s * 0.05), p + Vector2(0, -s * 0.12),
				p + Vector2(s * 0.3, s * 0.05), p + Vector2(s * 0.55, -f * s * 0.2 + s * 0.15),
				p + Vector2(s, -f * s * 0.7),
			])
			draw_polyline(wing, _color, maxf(1.5, s * 0.28), true)
			draw_circle(p, s * 0.2, _color)
		else:
			# Rondini: battito, poi planata ad ali tese.
			var glide := smoothstep(0.3, 0.9, sin(ph * 0.21 + float(b["seed"])))
			var f := sin(ph) * (1.0 - glide) + 0.15 * glide
			var wing := PackedVector2Array([
				p + Vector2(-s, -f * s * 0.8), p + Vector2(-s * 0.4, -f * s * 0.15 - s * 0.08),
				p, p + Vector2(s * 0.4, -f * s * 0.15 - s * 0.08), p + Vector2(s, -f * s * 0.8),
			])
			draw_polyline(wing, _color, maxf(1.2, s * 0.2), true)
