extends Node2D
## Incudine dipinta: stessa resa materica degli altri oggetti del mondo.
const ANVIL := preload("res://assets/art/props/incudine.png")
const HEIGHT := 60.0
var focused := false
var world: Node
var _label_a := 0.0

func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS

func _process(delta: float) -> void:
	_label_a = TextDefer.step(_label_a, world, delta)
	queue_redraw()

func _draw() -> void:
	var size := Vector2(HEIGHT * ANVIL.get_width() / ANVIL.get_height(), HEIGHT)
	draw_colored_polygon(Art.ellipse(Vector2(0, -1), Vector2(25, 4), 20), Color(0, 0, 0, 0.35))
	draw_texture_rect(ANVIL, Rect2(Vector2(-size.x * 0.5, -size.y), size), false)
	if focused and _label_a > 0.01:
		Art.text(self, Art.body_font(), Vector2(-180, -HEIGHT - 16), Controls.label("interact") + "  Salva e riposa", 18, Color(Art.CREMA, _label_a), HORIZONTAL_ALIGNMENT_CENTER, 360)
