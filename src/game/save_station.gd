extends Node2D
## Una statua sconfitta diventa un altare luminoso: W/E salva nelle vicinanze.
var focused := false
var _time := 0.0

func _process(delta: float) -> void:
	_time += delta
	queue_redraw()

func _draw() -> void:
	var gold := Color(1.0, 0.8, 0.4)
	draw_circle(Vector2(0, -32), 48.0 + sin(_time * 2.0) * 4.0, Color(gold, 0.12))
	draw_rect(Rect2(-24, -12, 48, 12), Color(0.4, 0.32, 0.2))
	draw_colored_polygon(PackedVector2Array([Vector2(-15, -12), Vector2(-10, -54), Vector2(0, -68), Vector2(10, -54), Vector2(15, -12)]), gold)
	draw_arc(Vector2(0, -42), 28, 0, TAU, 40, Color(gold, 0.8), 2.0, true)
	if focused:
		Art.text(self, Art.body_font(), Vector2(-120, -86), "W / E  Salva e riposa", 20, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 240)
