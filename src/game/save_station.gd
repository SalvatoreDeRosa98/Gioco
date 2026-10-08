extends Node2D
## Incudine dipinta: stessa resa materica degli altri oggetti del mondo.
const ANVIL := preload("res://assets/art/props/incudine.png")
const HEIGHT := 60.0
var focused := false

func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS

func _process(_delta: float) -> void:
	queue_redraw()

func _draw() -> void:
	var size := Vector2(HEIGHT * ANVIL.get_width() / ANVIL.get_height(), HEIGHT)
	draw_colored_polygon(Art.ellipse(Vector2(0, -1), Vector2(25, 4), 20), Color(0, 0, 0, 0.35))
	draw_texture_rect(ANVIL, Rect2(Vector2(-size.x * 0.5, -size.y), size), false)
	if focused:
		Art.text(self, Art.body_font(), Vector2(-120, -HEIGHT - 16), "W / E  Salva e riposa", 18, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 240)
