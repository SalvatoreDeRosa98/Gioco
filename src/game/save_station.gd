extends Node2D
## Piccola incudine su ceppo: Ferruccio torna al suo mestiere per salvare e riposare.
var focused := false

func _process(_delta: float) -> void:
	queue_redraw()

func _draw() -> void:
	# Ombra di contatto e piccolo ceppo di legno, appoggiato alla superficie.
	draw_colored_polygon(Art.ellipse(Vector2(0, -1), Vector2(25, 4), 20), Color(0, 0, 0, 0.35))
	draw_rect(Rect2(-14, -18, 28, 17), Color("#49362b"))
	draw_colored_polygon(PackedVector2Array([Vector2(-14, -18), Vector2(-10, -21), Vector2(13, -21), Vector2(14, -18)]), Color("#80634a"))
	for x in [-9, -3, 6, 11]:
		draw_line(Vector2(x, -15), Vector2(x - 1, -3), Color("#30271f"), 1.0)
	draw_line(Vector2(-14, -6), Vector2(14, -6), Color("#25272a"), 2.0)
	# Piede, collo e tavola d'acciaio, con corno appuntito rivolto a sinistra.
	draw_colored_polygon(PackedVector2Array([Vector2(-18, -20), Vector2(-14, -25), Vector2(-7, -27), Vector2(-6, -33), Vector2(-16, -36), Vector2(-17, -44), Vector2(20, -44), Vector2(20, -36), Vector2(7, -33), Vector2(6, -27), Vector2(15, -25), Vector2(19, -20)]), Color("#343a42"))
	draw_colored_polygon(PackedVector2Array([Vector2(-17, -44), Vector2(-26, -41), Vector2(-36, -38), Vector2(-26, -36), Vector2(-16, -36)]), Color("#68717a"))
	draw_rect(Rect2(-16, -44, 36, 3), Color("#a3a8a8"))
	draw_line(Vector2(-15, -35), Vector2(-7, -32), Color("#717881"), 1.5)
	draw_line(Vector2(-6, -31), Vector2(-7, -26), Color("#717881"), 1.5)
	draw_line(Vector2(-17, -21), Vector2(18, -21), Color("#7b8288"), 1.5)
	draw_circle(Vector2(14, -42), 1.5, Color("#242a30"))
	if focused:
		draw_line(Vector2(-16, -45), Vector2(20, -45), Color(Art.CREMA, 0.8), 1.0)
		Art.text(self, Art.body_font(), Vector2(-120, -66), "W / E  Salva e riposa", 18, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 240)
