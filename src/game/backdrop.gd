extends Node2D
## Sfondo a strati con parallasse manuale: cielo (shader su CanvasLayer fisso), strato lontano,
## nebbia, strato medio, raggi di luce, nebbia bassa, primo piano scuro e meteo.
## Si ricostruisce a ogni stanza; update_camera() va chiamato ogni frame con il centro della camera.

const PainterScript := preload("res://game/painter.gd")
const SKY_SHADER := preload("res://game/shaders/canvas_env_sky.gdshader")
const FOG_SHADER := preload("res://game/shaders/canvas_env_fog.gdshader")

const VIEW := Vector2(1280, 720)
const FAR_SCROLL := 0.18
const MID_SCROLL := 0.5
const SHAFT_SCROLL := 0.62
const FG_SCROLL := 1.3

var _sky_layer: CanvasLayer
var _sky_mat: ShaderMaterial
var _layers: Array = []   # elementi: {"node": Node2D, "s": float}
var _weather: CPUParticles2D
var _weather_top := false


## zoom: ingrandimento della camera (serve a sapere quanto mondo si vede in verticale).
## with_fg: false nel menu, dove lo strato scuro in primo piano coprirebbe il titolo.
func build(theme_name: String, room_size: Vector2, floor_y: float, zoom: float = 1.0, with_fg: bool = true) -> void:
	_clear()
	var th := Themes.get_theme(theme_name)
	_build_sky(th)
	var cam_low := room_size.y - VIEW.y * 0.5 / zoom
	var seed_base := hash(theme_name)

	var far := _layer(FAR_SCROLL, -40)
	_painter(far, th.far_kind, th, FAR_SCROLL, room_size, floor_y, cam_low, seed_base + 1)

	var mid_base := _base_for(MID_SCROLL, floor_y, cam_low)
	var mid_fog := _layer(MID_SCROLL, -36)
	_fog(mid_fog, Rect2(-800, mid_base - 340.0, room_size.x * MID_SCROLL + 1600.0, 520), th.fog, th.fog_density * 0.85, 0.003)

	var mid := _layer(MID_SCROLL, -30)
	_painter(mid, th.mid_kind, th, MID_SCROLL, room_size, floor_y, cam_low, seed_base + 2)

	if theme_name in ["oro", "belvedere", "giardino"]:
		var shafts := _layer(SHAFT_SCROLL, -26)
		_painter(shafts, "shafts", th, SHAFT_SCROLL, room_size, floor_y, cam_low, seed_base + 3)

	var low_fog := _layer(1.0, 30)
	_fog(low_fog, Rect2(-400, floor_y - 200.0, room_size.x + 800.0, 280), th.fog, th.fog_density * 0.55, 0.005)

	if with_fg:
		var fg := _layer(FG_SCROLL, 40)
		_painter(fg, th.fg_kind, th, FG_SCROLL, room_size, floor_y, cam_low, seed_base + 4)

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
		else:
			node.position = center * (1.0 - float(l["s"]))
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


func _layer(scroll: float, z: int) -> Node2D:
	var n := Node2D.new()
	n.z_index = z
	add_child(n)
	_layers.append({"node": n, "s": scroll})
	return n


## Linea di terra dello strato: coincide con il pavimento quando la camera è in basso.
static func _base_for(scroll: float, floor_y: float, cam_low: float) -> float:
	return floor_y - cam_low * (1.0 - scroll)


func _painter(parent: Node2D, kind: String, th: Dictionary, scroll: float, room_size: Vector2, floor_y: float, cam_low: float, s: int) -> void:
	var p = PainterScript.new()
	parent.add_child(p)
	p.setup(kind, th, -800.0, room_size.x * scroll + 800.0, _base_for(scroll, floor_y, cam_low), s)


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
