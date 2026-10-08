extends Node2D
## Stanza raccolta: muratura dipinta, travi e vecchia forgia sotto una luce calda.
const STONE := preload("res://assets/art/props/terreno.png")

func _draw() -> void:
	draw_rect(Rect2(0, 0, 1280, 1080), Color("#16171d"))
	for y in range(260, 980, 100):
		for x in range(0, 1280, 200):
			draw_texture_rect(STONE, Rect2(x, y, 200, 100), false, Color(0.23, 0.21, 0.23))
	for x in [70, 600, 1190]:
		draw_rect(Rect2(x, 260, 26, 720), Color("#28201c"))
		draw_line(Vector2(x + 5, 270), Vector2(x + 5, 970), Color("#493529"), 3)
	draw_rect(Rect2(60, 390, 1160, 24), Color("#30241f"))
	# La vecchia bocca della forgia è spenta: il calore resta soltanto nella memoria.
	draw_texture_rect(STONE, Rect2(330, 690, 200, 290), false, Color(0.4, 0.3, 0.25))
	draw_rect(Rect2(365, 790, 130, 150), Color("#100e13"))
	draw_rect(Rect2(365, 930, 130, 10), Color("#8c4d30"))
	draw_line(Vector2(390, 932), Vector2(470, 932), Color("#c98952"), 2)
	# Banco consumato e attrezzi, disegnati nello stesso tono della stanza.
	draw_rect(Rect2(860, 906, 225, 15), Color("#584131"))
	for x in [885, 1055]:
		draw_rect(Rect2(x, 921, 14, 59), Color("#342b25"))
	draw_line(Vector2(910, 902), Vector2(960, 902), Color("#969185"), 5)
	draw_line(Vector2(950, 901), Vector2(945, 875), Color("#564132"), 5)
	Art.grad_rect(self, Rect2(0, 0, 1280, 980), Color(0, 0, 0, 0.55), Color(0, 0, 0, 0.08))
