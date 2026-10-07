extends Node2D
## Oggetto raccoglibile (centesimi o mozzarella). Lo crea l'host; la posizione iniziale basta a tutti.

var item := "centesimi"
var value := 1
var _t := 0.0


func setup(d: Dictionary) -> void:
	position = d["pos"]
	item = str(d["item"])
	value = int(d["value"])
	_t = randf() * 6.0
	add_to_group("pickups")


func _ready() -> void:
	var col := Color(1.0, 0.95, 0.85) if item == "mozzarella" else Color(1.0, 0.78, 0.35)
	Art.glow(self, Vector2.ZERO, Color(col, 0.55), 70.0)
	Art.point_light(self, Vector2.ZERO, col, 0.5, 200.0)


func _process(delta: float) -> void:
	_t += delta
	queue_redraw()


func _draw() -> void:
	var bob := sin(_t * 3.2) * 4.0
	if item == "mozzarella":
		Art.shaded_ellipse(self, Vector2(0, bob), Vector2(10, 9), Color(1, 1, 0.98), Color(0.82, 0.8, 0.76), 16)
		draw_colored_polygon(PackedVector2Array([Vector2(-2, bob - 8), Vector2(6, bob - 14), Vector2(3, bob - 7)]), Color(0.35, 0.6, 0.3))
		draw_circle(Vector2(-3, bob - 3), 2.5, Color(1, 1, 1, 0.9))
	else:
		var spin := absf(cos(_t * 3.0))
		var w := maxf(1.5, 8.0 * spin)
		Art.shaded_ellipse(self, Vector2(0, bob), Vector2(w, 8), Color(1.0, 0.86, 0.45), Color(0.72, 0.48, 0.15), 16)
		if spin > 0.4:
			draw_arc(Vector2(0, bob), 5.0, 0.0, TAU, 12, Color(0.6, 0.38, 0.1, 0.8), 1.2)
		if fmod(_t, 2.2) < 0.25:
			var k := fmod(_t, 2.2) / 0.25
			draw_line(Vector2(-6, bob - 6) + Vector2(k * 12, 0), Vector2(-6, bob + 6) + Vector2(k * 12, 0), Color(1, 1, 1, 0.7 * (1.0 - k)), 2.0)
