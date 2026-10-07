extends Node2D
## Oggetto raccoglibile (centesimi o mozzarella). Lo crea l'host; la posizione iniziale basta a tutti.

var item := "centesimi"
var value := 1
var _t := 0.0


func setup(d: Dictionary) -> void:
	position = d["pos"]
	item = str(d["item"])
	value = int(d["value"])
	add_to_group("pickups")


func _process(delta: float) -> void:
	_t += delta
	queue_redraw()


func _draw() -> void:
	var bob := sin(_t * 4.0) * 3.0
	var glow := 0.5 + 0.2 * sin(_t * 3.0)
	if item == "mozzarella":
		draw_circle(Vector2(0, bob), 16, Color(1, 0.95, 0.85, 0.15 * glow))
		draw_circle(Vector2(0, bob), 9, Color("#f7f2ea"))
		draw_circle(Vector2(-3, bob - 3), 3, Color(1, 1, 1, 0.9))
	else:
		draw_circle(Vector2(0, bob), 14, Color(1, 0.8, 0.4, 0.15 * glow))
		draw_circle(Vector2(0, bob), 7, Color("#e8b44a"))
		draw_circle(Vector2(0, bob), 4.5, Color("#c48a2a"))
		draw_circle(Vector2(-2, bob - 2), 1.5, Color(1, 1, 0.8, 0.8))
