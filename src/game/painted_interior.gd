extends Node2D
## Fondale panoramico originale della Reggia, allineato al pavimento fisico della stanza.
var texture: Texture2D
var size := Vector2(2560, 1080)
var floor_y := 980.0

## Carica l'ambiente richiesto; gli arredi dipinti restano dietro alle piattaforme.
func setup(room: Dictionary) -> void:
	texture = load("res://assets/art/areas/espansione/%s.png" % room.art)
	size = room.size
	floor_y = room.floor
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	z_index = -15

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color("#101921"))
	draw_texture_rect(texture, Rect2(0, 0, size.x, floor_y / 0.9), false)
