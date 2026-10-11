extends Node2D
## Fondale del piano medio per le stanze in scena (meta "mid_art"): parallasse 0.5 dietro alle piattaforme.
## L'immagine è già scurita e desaturata (design/art/cisterne-grok/make_art.py, art-bible: "Medio 0.5,
## scurito: non deve competere con il piano di gioco"). Copre la vista spostandosi a metà velocità.
const SCROLL := 0.5
const SHADE := Color("#0b1016")
var texture: Texture2D
var room_size := Vector2(1280, 720)

func setup(room: Dictionary) -> void:
	texture = load(str(room.mid_art))
	room_size = room.size
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	z_index = -15

## Rettangolo (in coordinate di mondo) occupato dal fondale per una vista con angolo in alto a sinistra top_left.
func layer_rect(top_left: Vector2, view: Vector2) -> Rect2:
	var span := view + (room_size - view).max(Vector2.ZERO) * SCROLL
	var travel := (room_size - view).max(Vector2.ONE)
	var p := (top_left / travel).clamp(Vector2.ZERO, Vector2.ONE)
	return Rect2(top_left - p * (span - view), span)

func _process(_delta: float) -> void:
	queue_redraw()

func _draw() -> void:
	draw_rect(Rect2(Vector2(-400, -400), room_size + Vector2(800, 800)), SHADE)
	var cam := get_viewport().get_camera_2d()
	if texture == null or cam == null:
		return
	var view := get_viewport_rect().size / cam.zoom
	var r := layer_rect(cam.get_screen_center_position() - view / 2.0, view)
	# Copertura senza deformare: l'immagine riempie r e si centra.
	var tex := Vector2(texture.get_size())
	var k := maxf(r.size.x / tex.x, r.size.y / tex.y)
	var size := tex * k
	draw_texture_rect(texture, Rect2(r.get_center() - size / 2.0, size), false)
