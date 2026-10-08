extends Node2D
## Interno completamente dipinto, con gli stessi materiali delle altre aree.
const INTERIOR := preload("res://assets/art/areas/fucina/interno.png")

func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	Art.point_light(self, Vector2(350, 895), Color(1.0, 0.7, 0.4), 0.18, 360)

func _draw() -> void:
	draw_rect(Rect2(0, 0, 1280, 1080), Color("#0b1118"))
	# La superficie del pavimento dipinto coincide con la collisione a quota 980.
	draw_texture_rect(INTERIOR, Rect2(0, 395, 1280, 722), false)
