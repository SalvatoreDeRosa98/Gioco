class_name Backdrop
extends Node2D
## Sfondo a strati con parallasse manuale: cielo (shader su CanvasLayer fisso), strati dipinti
## (lontano, medio, primo piano) descritti in data/areas.json, banchi di nebbia e meteo.
## Si ricostruisce a ogni stanza; update_camera() va chiamato ogni frame con il centro della camera.

const SKY_SHADER := preload("res://game/shaders/canvas_env_sky.gdshader")
const FOG_SHADER := preload("res://game/shaders/canvas_env_fog.gdshader")
const LAYER_SHADER := preload("res://game/shaders/canvas_env_layer.gdshader")
const AREAS_PATH := "res://data/areas.json"
const ART_DIR := "res://assets/art/areas/"

const VIEW := Vector2(1280, 720)
## Margine oltre i bordi della stanza coperto dagli strati (unità dello strato).
const MARGIN := 800.0
## Profondità del colore steso sotto uno strato appoggiato al pavimento.
const FILL_DEPTH := 1400.0

static var _areas: Dictionary = {}

var _sky_layer: CanvasLayer
var _sky_mat: ShaderMaterial
var _layers: Array = []   # elementi: {"node": Node2D, "s": float, "lock_y": bool}
var _weather: CPUParticles2D
var _weather_top := false
var _zoom := 1.0


## Configurazione dipinta di un'area (strati e tinta del terreno) da data/areas.json.
static func area(theme_name: String) -> Dictionary:
	if _areas.is_empty():
		var file := FileAccess.open(AREAS_PATH, FileAccess.READ)
		if file == null:
			push_error("data/areas.json mancante")
			return {}
		_areas = JSON.parse_string(file.get_as_text())
	return _areas.get(theme_name, {})


## zoom: ingrandimento della camera (serve a sapere quanto mondo si vede).
## with_fg: false nel menu, dove gli strati in primo piano coprirebbero il titolo.
func build(theme_name: String, room_size: Vector2, floor_y: float, zoom: float = 1.0, with_fg: bool = true) -> void:
	_clear()
	_zoom = zoom
	var th := Themes.get_theme(theme_name)
	_build_sky(th)
	var cam_low := room_size.y - VIEW.y * 0.5 / zoom

	for cfg in area(theme_name).get("layers", []):
		var scroll := float(cfg["scroll"])
		if scroll > 1.0 and not with_fg:
			continue
		var node := _layer(scroll, int(cfg.get("z", -30)), cfg.get("anchor", "ground") == "top")
		_painted(node, cfg, th, room_size, floor_y, cam_low)
		# Nebbia tra lo strato lontano e quello medio: dà profondità e stacca i piani.
		if scroll < 0.3:
			var fog_s := 0.35
			var fog := _layer(fog_s, int(cfg.get("z", -40)) + 4)
			var base := _base_for(fog_s, floor_y, cam_low)
			_fog(fog, Rect2(-MARGIN, base - 340.0, room_size.x * fog_s + MARGIN * 2.0, 520), th.fog, th.fog_density * 0.85, 0.003)

	var low_fog := _layer(1.0, 30)
	_fog(low_fog, Rect2(-400, floor_y - 200.0, room_size.x + 800.0, 280), th.fog, th.fog_density * 0.55, 0.005)

	var kind: String = th.weather
	_weather = Fx.weather(kind, th)
	_weather.z_index = 35
	_weather_top = kind == "rain"
	add_child(_weather)
	if theme_name == "giardino":
		var leaves := Fx.weather("leaves", th)
		leaves.z_index = 34
		add_child(leaves)
		_layers.append({"node": leaves, "s": 0.0, "follow": true})


## Sposta gli strati in base al centro della camera (parallasse) e fa seguire il meteo.
func update_camera(center: Vector2) -> void:
	for l in _layers:
		var node: Node2D = l["node"]
		if l.get("follow", false):
			node.position = center
			continue
		var s := float(l["s"])
		node.position = Vector2(center.x * (1.0 - s), center.y if l.get("lock_y", false) else center.y * (1.0 - s))
	if _weather:
		_weather.position = center + (Vector2(0, -VIEW.y * 0.5 - 60.0) if _weather_top else Vector2.ZERO)
	if _sky_mat:
		_sky_mat.set_shader_parameter("scroll", center / VIEW)


func _clear() -> void:
	for l in _layers:
		(l["node"] as Node).queue_free()
	_layers.clear()
	if _weather:
		_weather.queue_free()
		_weather = null


func _build_sky(th: Dictionary) -> void:
	if _sky_layer == null:
		_sky_layer = CanvasLayer.new()
		_sky_layer.layer = -10
		add_child(_sky_layer)
		var rect := ColorRect.new()
		rect.set_anchors_preset(Control.PRESET_FULL_RECT)
		rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_sky_mat = ShaderMaterial.new()
		_sky_mat.shader = SKY_SHADER
		rect.material = _sky_mat
		_sky_layer.add_child(rect)
	_sky_mat.set_shader_parameter("top_color", th.sky_top)
	_sky_mat.set_shader_parameter("bottom_color", th.sky_bottom)
	_sky_mat.set_shader_parameter("horizon_color", th.horizon)
	_sky_mat.set_shader_parameter("cloud_color", th.cloud)
	_sky_mat.set_shader_parameter("moon_color", th.moon_color)
	_sky_mat.set_shader_parameter("moon", th.moon)
	_sky_mat.set_shader_parameter("moon_pos", th.moon_pos)
	_sky_mat.set_shader_parameter("moon_radius", 0.038)
	_sky_mat.set_shader_parameter("stars", th.stars)
	_sky_mat.set_shader_parameter("clouds", th.clouds)


func _layer(scroll: float, z: int, lock_y: bool = false) -> Node2D:
	var n := Node2D.new()
	n.z_index = z
	add_child(n)
	_layers.append({"node": n, "s": scroll, "lock_y": lock_y})
	return n


## Linea di terra dello strato: coincide con il pavimento quando la camera è in basso.
static func _base_for(scroll: float, floor_y: float, cam_low: float) -> float:
	return floor_y - cam_low * (1.0 - scroll)


## Uno strato dipinto: immagine ripetuta a specchio in orizzontale per coprire tutta la stanza.
func _painted(parent: Node2D, cfg: Dictionary, th: Dictionary, room_size: Vector2, floor_y: float, cam_low: float) -> void:
	var tex: Texture2D = load(ART_DIR + str(cfg["tex"]))
	if tex == null:
		push_error("strato mancante: " + str(cfg["tex"]))
		return
	var scroll := float(cfg["scroll"])
	var k := float(cfg["scale"])
	var rows: Array = cfg.get("rows", [0, tex.get_height()])
	var row0 := float(rows[0])
	var row1 := float(rows[1])

	# Tratto orizzontale da coprire, in unità dello strato.
	var left := -MARGIN
	var right := room_size.x * scroll + MARGIN
	if cfg.get("anchor", "ground") == "top":
		left = -VIEW.x / _zoom
		right = room_size.x * scroll + VIEW.x / _zoom
	# La colonna "center" dell'immagine cade al centro della stanza.
	var center_x := room_size.x * 0.5 * scroll
	var img_center := float(cfg.get("center", tex.get_width() * 0.5))
	var src_left := img_center + (left - center_x) / k

	var sprite := Sprite2D.new()
	sprite.texture = tex
	sprite.centered = false
	sprite.region_enabled = true
	sprite.region_rect = Rect2(src_left, row0, (right - left) / k, row1 - row0)
	sprite.texture_repeat = CanvasItem.TEXTURE_REPEAT_MIRROR
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	sprite.scale = Vector2(k, k)
	var mat := ShaderMaterial.new()
	mat.shader = LAYER_SHADER
	var tint := Color(cfg.get("tint", "#ffffff"))
	mat.set_shader_parameter("tint", tint)
	mat.set_shader_parameter("haze_color", th.fog)
	mat.set_shader_parameter("haze", float(cfg.get("haze", 0.0)))
	mat.set_shader_parameter("blur", float(cfg.get("blur", 0.0)))
	sprite.material = mat

	if cfg.get("anchor", "ground") == "top":
		# Cornice agganciata al bordo alto dello schermo (lo strato segue la camera in verticale).
		sprite.position = Vector2(left, -VIEW.y * 0.5 / _zoom + float(cfg.get("offset_y", 0.0)))
		parent.add_child(sprite)
		return

	var base := _base_for(scroll, floor_y, cam_low)
	var ground := float(cfg["ground"])
	sprite.position = Vector2(left, base - (ground - row0) * k)
	if cfg.has("fill"):
		var fill := ColorRect.new()
		fill.color = Color(cfg["fill"]) * Color(tint.r, tint.g, tint.b)
		fill.position = Vector2(left, base - 2.0)
		fill.size = Vector2(right - left, FILL_DEPTH)
		fill.mouse_filter = Control.MOUSE_FILTER_IGNORE
		parent.add_child(fill)
	parent.add_child(sprite)


func _fog(parent: Node2D, r: Rect2, color: Color, density: float, scale: float) -> void:
	var rect := ColorRect.new()
	rect.position = r.position
	rect.size = r.size
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var mat := ShaderMaterial.new()
	mat.shader = FOG_SHADER
	mat.set_shader_parameter("fog_color", color)
	mat.set_shader_parameter("density", density)
	mat.set_shader_parameter("scale", scale)
	rect.material = mat
	parent.add_child(rect)
