extends Node2D
## Fondale del piano medio per le stanze in scena (meta "mid_art"): parallasse 0.5 dietro alle piattaforme.
## L'immagine è già scurita e desaturata (design/art/cisterne-grok/make_art.py, art-bible: "Medio 0.5,
## scurito: non deve competere con il piano di gioco"). Copre la vista spostandosi a metà velocità.
##
## Opzioni facoltative (meta "mid_opts" della scena, es. Tana di Ratking):
##   floor_v: frazione d'altezza dell'immagine in cui sta il suo pavimento; viene tenuta sul pavimento della
##            stanza (niente parallasse verticale), così il trono resta appoggiato dietro all'arena.
##   scale:   scala dell'immagine in modalità floor_v (1.0 = pixel dell'immagine = pixel di mondo).
##   dim:     moltiplicatore di luminosità del fondale (piattaforme più leggibili).
##   light:   {x, top_w, bottom_w, color}: raggio di luce additivo in mondo, da y=0 al pavimento.
const SCROLL := 0.5
const SHADE := Color("#0b1016")
var texture: Texture2D
var room_size := Vector2(1280, 720)
var floor_y := 980.0
var opts: Dictionary = {}
var beam: Node2D

func setup(room: Dictionary) -> void:
	texture = load(str(room.mid_art))
	room_size = room.size
	floor_y = float(room.get("floor", 980.0))
	opts = room.get("mid_opts", {})
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	z_index = -15
	if opts.has("light"):
		beam = Node2D.new()
		beam.name = "Moonbeam"
		var mat := CanvasItemMaterial.new()
		mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
		beam.material = mat
		# Sopra il fondale e sotto tile e personaggi: accento di luce, non copre il gioco.
		beam.z_as_relative = false
		beam.z_index = 2
		beam.draw.connect(_draw_beam)
		add_child(beam)

## Rettangolo (in coordinate di mondo) occupato dal fondale per una vista con angolo in alto a sinistra top_left.
func layer_rect(top_left: Vector2, view: Vector2) -> Rect2:
	var span := view + (room_size - view).max(Vector2.ZERO) * SCROLL
	var travel := (room_size - view).max(Vector2.ONE)
	var p := (top_left / travel).clamp(Vector2.ZERO, Vector2.ONE)
	return Rect2(top_left - p * (span - view), span)

## Dove si disegna l'immagine per una data vista (mondo).
func image_rect(top_left: Vector2, view: Vector2) -> Rect2:
	var r := layer_rect(top_left, view)
	var tex := Vector2(texture.get_size())
	if opts.has("floor_v"):
		var k := float(opts.get("scale", 1.0))
		var size := tex * k
		return Rect2(Vector2(r.get_center().x - size.x / 2.0, floor_y - float(opts.floor_v) * size.y), size)
	var k := maxf(r.size.x / tex.x, r.size.y / tex.y)
	var size := tex * k
	return Rect2(r.get_center() - size / 2.0, size)

func _process(_delta: float) -> void:
	queue_redraw()
	if beam:
		beam.queue_redraw()

func _draw() -> void:
	draw_rect(Rect2(Vector2(-400, -400), room_size + Vector2(800, 800)), SHADE)
	var cam := get_viewport().get_camera_2d()
	if texture == null or cam == null:
		return
	var view := get_viewport_rect().size / cam.zoom
	var dim := float(opts.get("dim", 1.0))
	draw_texture_rect(texture, image_rect(cam.get_screen_center_position() - view / 2.0, view), false, Color(dim, dim, dim))

func _draw_beam() -> void:
	var l: Dictionary = opts.light
	var x := float(l.x)
	var tw := float(l.get("top_w", 160.0)) / 2.0
	var bw := float(l.get("bottom_w", 420.0)) / 2.0
	var c := Color(str(l.get("color", "#9fb8d8")))
	var t := Time.get_ticks_msec() * 0.001
	var a := 0.16 + 0.02 * sin(t * 0.9)
	var pts := PackedVector2Array([Vector2(x - tw, 0), Vector2(x + tw, 0), Vector2(x + bw, floor_y), Vector2(x - bw, floor_y)])
	beam.draw_polygon(pts, PackedColorArray([Color(c, a), Color(c, a), Color(c, a * 0.25), Color(c, a * 0.25)]))
	# Nucleo più stretto e chiazza sul pavimento.
	var core := PackedVector2Array([Vector2(x - tw * 0.4, 0), Vector2(x + tw * 0.4, 0), Vector2(x + bw * 0.45, floor_y), Vector2(x - bw * 0.45, floor_y)])
	beam.draw_polygon(core, PackedColorArray([Color(c, a * 0.8), Color(c, a * 0.8), Color(c, a * 0.2), Color(c, a * 0.2)]))
	beam.draw_set_transform(Vector2(x, floor_y), 0.0, Vector2(1.0, 0.16))
	beam.draw_circle(Vector2.ZERO, bw * 0.8, Color(c, 0.08))
	beam.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	# Pulviscolo nel raggio.
	for i in 14:
		var u := fposmod(float(i) * 0.37 + t * 0.03, 1.0)
		var y := floor_y * fposmod(float(i) * 0.61 - t * 0.02, 1.0)
		var w := lerpf(tw, bw, y / floor_y)
		beam.draw_circle(Vector2(x - w + 2.0 * w * u, y), 1.6, Color(c, 0.35))
