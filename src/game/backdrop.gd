class_name Backdrop
extends Node2D
## Sfondo a strati con parallasse manuale: cielo (shader su CanvasLayer fisso), strati dipinti
## (lontano, medio, primo piano) e, sopra di essi, ciò che li fa vivere: nebbie a più profondità,
## fili d'oro del Velo, raggi di luce, cittadini addormentati in controluce, particelle per strato,
## stormi nel cielo e meteo. Tutto è descritto in data/areas.json; i colori stanno in themes.gd.
## Si ricostruisce a ogni stanza; update_camera() va chiamato ogni frame con il centro della camera.

const SKY_SHADER := preload("res://game/shaders/canvas_env_sky.gdshader")
const FOG_SHADER := preload("res://game/shaders/canvas_env_fog.gdshader")
const LAYER_SHADER := preload("res://game/shaders/canvas_env_layer.gdshader")
const RAYS_SHADER := preload("res://game/shaders/canvas_env_rays.gdshader")
const ThreadsScript := preload("res://game/env_threads.gd")
const FlockScript := preload("res://game/env_flock.gd")
const AREAS_PATH := "res://data/areas.json"
const ART_DIR := "res://assets/art/areas/"
const ASSET_DIR := "res://assets/art/"

const VIEW := Vector2(1280, 720)
## Margine oltre i bordi della stanza coperto dagli strati (unità dello strato).
const MARGIN := 800.0
## Profondità del colore steso sotto uno strato appoggiato al pavimento.
const FILL_DEPTH := 1400.0
## Tetto alle particelle di un singolo campo (gli strati lenti coprono aree molto larghe).
const MAX_FIELD := 260

static var _areas: Dictionary = {}

var _sky_layer: CanvasLayer
var _sky_mat: ShaderMaterial
var _layers: Array = []   # elementi: {"node": Node2D, "s": float, "lock_y": bool, "follow": bool, "flock": stormo}
var _weather: CPUParticles2D
var _weather_top := false
var _zoom := 1.0
var _room := Vector2(1280, 720)
var _floor := 640.0
var _cam_low := 0.0
var _th: Dictionary = {}
var _rng := RandomNumberGenerator.new()


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
	_room = room_size
	_floor = floor_y
	_th = Themes.get_theme(theme_name)
	_rng.seed = hash(theme_name)
	_build_sky(_th)
	_cam_low = room_size.y - VIEW.y * 0.5 / zoom
	var cfg := area(theme_name)

	for c in cfg.get("layers", []):
		if float(c["scroll"]) > 1.0 and not with_fg:
			continue
		var node := _layer(float(c["scroll"]), int(c.get("z", -30)), c.get("anchor", "ground") == "top")
		_painted(node, c)
	for c in cfg.get("fogs", []):
		if float(c["scroll"]) <= 1.0 or with_fg:
			_fog_band(c)
	for c in cfg.get("rays", []):
		_rays(c)
	if cfg.has("figures"):
		_figures(cfg["figures"])
	for c in cfg.get("fields", []):
		if float(c["scroll"]) <= 1.0 or with_fg:
			_field(c)
	if cfg.has("flock"):
		_flock(cfg["flock"])

	var kind: String = _th.weather
	_weather = Fx.weather(kind, _th)
	_weather.z_index = 35
	_weather_top = kind == "rain"
	add_child(_weather)
	if theme_name == "giardino":
		var leaves := Fx.weather("leaves", _th)
		leaves.z_index = 34
		add_child(leaves)
		_layers.append({"node": leaves, "s": 0.0, "follow": true})
	_link_grade()


## Sposta gli strati in base al centro della camera (parallasse) e fa seguire il meteo.
func update_camera(center: Vector2) -> void:
	for l in _layers:
		var node: Node2D = l["node"]
		if l.get("follow", false):
			node.position = center
			continue
		var s := float(l["s"])
		node.position = Vector2(center.x * (1.0 - s), center.y if l.get("lock_y", false) else center.y * (1.0 - s))
		if l.has("flock"):
			l["flock"].view_center = center - node.position
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


## Aggancio provvisorio al post-processing: world.gd tiene il materiale in _post_mat e imposta
## solo tinta, contrasto, saturazione, bloom e vignetta; qui si aggiungono viraggio e velo di luce.
## Quando world.gd chiamerà Themes.apply_grade() da sé, questa funzione diventa superflua.
func _link_grade() -> void:
	var host := get_parent()
	if host == null:
		return
	var mat = host.get("_post_mat")
	if mat is ShaderMaterial:
		Themes.apply_grade(mat, _th)


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
func _base(scroll: float) -> float:
	return _floor - _cam_low * (1.0 - scroll)


## Metà della vista in unità di mondo.
func _half_view() -> Vector2:
	return VIEW * 0.5 / _zoom


## Rettangolo (coordinate locali di uno strato a velocità s) che la camera può mostrare.
func _reach(s: float) -> Rect2:
	var h := _half_view()
	var x0 := h.x * s - h.x
	var x1 := (_room.x - h.x) * s + h.x
	var y0 := h.y * s - h.y
	var y1 := (_room.y - h.y) * s + h.y
	return Rect2(x0, y0, x1 - x0, y1 - y0)


## Intervallo orizzontale in coordinate di strato: [x0, x1] del mondo moltiplicati per s,
## oppure, se manca, tutto ciò che la camera può mostrare.
func _span(cfg: Dictionary, s: float) -> Vector2:
	if cfg.has("x"):
		return Vector2(float(cfg["x"][0]) * s, float(cfg["x"][1]) * s)
	var r := _reach(s)
	return Vector2(r.position.x - 40.0, r.end.x + 40.0)


static func _pick(r: RandomNumberGenerator, range_value, fallback: float) -> float:
	if range_value is Array:
		return r.randf_range(float(range_value[0]), float(range_value[1]))
	if range_value == null:
		return fallback
	return float(range_value)


# ---------------------------------------------------------------- Strati dipinti

## Uno strato dipinto: immagine ripetuta a specchio in orizzontale per coprire tutta la stanza.
## Chiavi opzionali: lift (alza lo strato), flip (parte dalla copia specchiata), threads (fili d'oro).
func _painted(parent: Node2D, cfg: Dictionary) -> void:
	var tex: Texture2D = load(ART_DIR + str(cfg["tex"]))
	if tex == null:
		push_error("strato mancante: " + str(cfg["tex"]))
		return
	var scroll := float(cfg["scroll"])
	var k := float(cfg["scale"])
	var rows: Array = cfg.get("rows", [0, tex.get_height()])
	var row0 := float(rows[0])
	var row1 := float(rows[1])
	var top: bool = cfg.get("anchor", "ground") == "top"

	# Tratto orizzontale da coprire, in unità dello strato.
	var left := -MARGIN
	var right := _room.x * scroll + MARGIN
	if top:
		left = -VIEW.x / _zoom
		right = _room.x * scroll + VIEW.x / _zoom
	# La colonna "center" dell'immagine cade al centro della stanza.
	var center_x := _room.x * 0.5 * scroll
	var img_center := float(cfg.get("center", tex.get_width() * 0.5))
	if cfg.get("flip", false):
		img_center = tex.get_width() * 2.0 - img_center
	var src_left := img_center + (left - center_x) / k

	var sprite := Sprite2D.new()
	sprite.texture = tex
	sprite.centered = false
	sprite.region_enabled = true
	sprite.region_rect = Rect2(src_left, row0, (right - left) / k, row1 - row0)
	sprite.texture_repeat = CanvasItem.TEXTURE_REPEAT_MIRROR
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	sprite.scale = Vector2(k, k)
	var tint := Color(cfg.get("tint", "#ffffff"))
	sprite.material = _layer_material(tint, float(cfg.get("haze", 0.0)), float(cfg.get("blur", 0.0)))
	if cfg.has("fade"):
		# Dissolvenza in alto tra due righe dell'immagine (es. per togliere il cielo dipinto).
		var h := float(tex.get_height())
		(sprite.material as ShaderMaterial).set_shader_parameter("fade_rows", Vector2(float(cfg["fade"][0]) / h, float(cfg["fade"][1]) / h))

	if top:
		# Cornice agganciata al bordo alto dello schermo (lo strato segue la camera in verticale).
		sprite.position = Vector2(left, -VIEW.y * 0.5 / _zoom + float(cfg.get("offset_y", 0.0)))
		parent.add_child(sprite)
		return

	var base := _base(scroll) - float(cfg.get("lift", 0.0))
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

	if cfg.has("threads"):
		var w := float(tex.get_width())
		var anchors: Array = []
		for a in cfg["threads"].get("anchors", []):
			# Ogni finestra si ripete in tutte le copie (dritte e specchiate) dell'immagine.
			for u in _mirror_copies(float(a[0]), w, src_left, src_left + (right - left) / k):
				anchors.append(Vector2(left + (u - src_left) * k, sprite.position.y + (float(a[1]) - row0) * k))
		_threads(parent, cfg["threads"], anchors, scroll, base)


func _layer_material(tint: Color, haze: float, blur: float) -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = LAYER_SHADER
	mat.set_shader_parameter("tint", tint)
	mat.set_shader_parameter("haze_color", _th.fog)
	mat.set_shader_parameter("haze", haze)
	mat.set_shader_parameter("blur", blur)
	return mat


## Coordinate u (pixel della regione ripetuta a specchio) in cui ricompare la colonna x dell'immagine.
static func _mirror_copies(x: float, w: float, u0: float, u1: float) -> Array:
	var out: Array = []
	var period := w * 2.0
	for n in range(int(floor((u0 - w) / period)), int(ceil((u1 + w) / period)) + 1):
		for u in [x + period * n, period * n - x]:
			if u >= u0 and u <= u1:
				out.append(u)
	return out


# ---------------------------------------------------------------- Fili d'oro

## Fili che salgono verso la Reggia (rise) e ghirlande tra agganci vicini (garland).
func _threads(parent: Node2D, cfg: Dictionary, anchors: Array, scroll: float, base: float) -> void:
	var t := ThreadsScript.new()
	t.z_index = int(cfg.get("z", 1))
	t.setup(cfg, _th.lamp)
	parent.add_child(t)
	anchors.sort_custom(func(a: Vector2, b: Vector2) -> bool: return a.x < b.x)
	var width := float(cfg.get("width", 8.0))
	var rise: Dictionary = cfg.get("rise", {})
	if not rise.is_empty():
		# I fili salgono per un tratto (len) piegando verso la Reggia (to, pull) e si arricciano (curl).
		var to: Array = rise.get("to", [_room.x * 0.5, -1600.0])
		var target := Vector2(float(to[0]) * scroll, base + float(to[1]))
		var pull := float(rise.get("pull", 0.3))
		for a: Vector2 in anchors:
			for i in int(rise.get("per", 1)):
				if _rng.randf() > float(rise.get("chance", 1.0)):
					continue
				var length := _pick(_rng, rise.get("len"), 360.0)
				var dir := Vector2((target.x - a.x) * pull / maxf(absf(target.y - a.y), 1.0), -1.0)
				dir = (dir + Vector2(_rng.randf_range(-0.25, 0.25), 0.0)).normalized()
				var end := a + dir * length
				var side := -1.0 if _rng.randf() < 0.5 else 1.0
				var bend := dir.orthogonal() * side * _pick(_rng, rise.get("curl"), 40.0)
				t.add_thread(a, end, bend, _pick(_rng, rise.get("wave"), 10.0) * -side, width, _pick(_rng, rise.get("bright"), 1.0), _rng.randf(), false)
	var converge: Dictionary = cfg.get("converge", {})
	if not converge.is_empty():
		# Ragnatela: ogni aggancio tende un filo verso lo stesso punto (il balcone della Reggia).
		var to: Array = converge.get("to", [_room.x * 0.5, -300.0])
		var point := Vector2(float(to[0]) * scroll, base + float(to[1]))
		for a: Vector2 in anchors:
			if _rng.randf() <= float(converge.get("chance", 1.0)) and a.distance_to(point) > 20.0:
				var sag := _pick(_rng, converge.get("sag"), 30.0)
				t.add_thread(a, point, Vector2(0.0, sag), 0.0, width, _pick(_rng, converge.get("bright"), 0.8), _rng.randf(), true)
	var garland: Dictionary = cfg.get("garland", {})
	if not garland.is_empty():
		var max_gap := float(garland.get("max_gap", 400.0))
		var max_dy := float(garland.get("max_dy", 120.0))
		for i in anchors.size() - 1:
			var a: Vector2 = anchors[i]
			var b: Vector2 = anchors[i + 1]
			var gap := b.x - a.x
			if gap < 8.0 or gap > max_gap or absf(b.y - a.y) > max_dy or _rng.randf() > float(garland.get("chance", 0.7)):
				continue
			var sag := _pick(_rng, garland.get("sag"), 40.0) * gap / max_gap + 6.0
			t.add_thread(a, b, Vector2(0.0, sag), 0.0, width * 0.8, _pick(_rng, garland.get("bright"), 0.8), _rng.randf(), true)


# ---------------------------------------------------------------- Nebbie, luce, figure

## Banco di nebbia a una certa profondità. y e h relativi alla linea di terra dello strato.
func _fog_band(cfg: Dictionary) -> void:
	var s := float(cfg["scroll"])
	var node := _layer(s, int(cfg.get("z", -35)))
	var span := _span(cfg, s)
	var rect := ColorRect.new()
	rect.position = Vector2(span.x, _base(s) + float(cfg.get("y", -300.0)))
	rect.size = Vector2(span.y - span.x, float(cfg.get("h", 400.0)))
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var mat := ShaderMaterial.new()
	mat.shader = FOG_SHADER
	mat.set_shader_parameter("fog_color", Color(cfg["color"]) if cfg.has("color") else _th.fog)
	mat.set_shader_parameter("density", float(cfg.get("density", 0.3)))
	mat.set_shader_parameter("scale", float(cfg.get("scale", 0.004)))
	mat.set_shader_parameter("speed", float(cfg.get("speed", 0.02)))
	rect.material = mat
	node.add_child(rect)


## Fasci di luce volumetrica (shader canvas_env_rays) con polvere luminosa dentro.
## screen: true aggancia il rettangolo allo schermo (sole basso, sorgente all'infinito).
func _rays(cfg: Dictionary) -> void:
	var screen: bool = cfg.get("screen", false)
	var s := 0.0 if screen else float(cfg["scroll"])
	var node := _layer(s, int(cfg.get("z", -20)))
	var r: Rect2
	if screen:
		r = Rect2(-_half_view(), _half_view() * 2.0)
	else:
		var span := _span(cfg, s)
		r = Rect2(span.x, _base(s) + float(cfg.get("top", -800.0)), span.y - span.x, float(cfg.get("h", 800.0)))
	var rect := ColorRect.new()
	rect.position = r.position
	rect.size = r.size
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var mat := ShaderMaterial.new()
	mat.shader = RAYS_SHADER
	var color := Color(cfg.get("color", _th.lamp.to_html()))
	mat.set_shader_parameter("color", color)
	mat.set_shader_parameter("size", r.size)
	var o: Array = cfg.get("origin", [0.5, -1.0])
	mat.set_shader_parameter("origin", Vector2(float(o[0]), float(o[1])))
	for key in ["intensity", "density", "sharpness", "speed", "falloff", "floor_light", "fade_top", "fade_side", "cone", "seed", "axis", "radial", "reach"]:
		if cfg.has(key):
			mat.set_shader_parameter(key, float(cfg[key]))
	rect.material = mat
	node.add_child(rect)
	if cfg.has("dust") and not screen:
		var amount := _field_amount(float(cfg["dust"]), r)
		var dust := Fx.field("dust", r.grow_individual(0, -r.size.y * 0.1, 0, -r.size.y * 0.15), amount, _th, {"color": color.to_html()})
		node.add_child(dust)


## Cittadini addormentati dal Velo: sagome scure ferme sul piano intermedio, ognuna con un filo
## d'oro che le sale dalla testa verso la Reggia.
func _figures(cfg: Dictionary) -> void:
	var s := float(cfg.get("scroll", 0.72))
	var node := _layer(s, int(cfg.get("z", -20)))
	var base := _base(s)
	var tint := Color(cfg.get("tint", "#141a26"))
	var mat := _layer_material(tint, float(cfg.get("haze", 0.2)), float(cfg.get("blur", 1.2)))
	var heads: Array = []
	for f in cfg.get("list", []):
		var tex: Texture2D = load(ASSET_DIR + str(f["tex"]))
		if tex == null:
			push_error("figura mancante: " + str(f["tex"]))
			continue
		var h := float(f.get("h", cfg.get("h", 120.0)))
		var k := h / float(tex.get_height())
		var w := tex.get_width() * k
		var x := float(f["x"]) * s
		var sprite := Sprite2D.new()
		sprite.texture = tex
		sprite.centered = false
		sprite.flip_h = f.get("flip", false)
		sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		sprite.scale = Vector2(k, k)
		sprite.position = Vector2(x - w * 0.5, base - h + float(cfg.get("sink", 4.0)))
		sprite.material = mat
		node.add_child(sprite)
		if f.get("thread", true):
			heads.append(Vector2(x + float(f.get("head_dx", 0.0)) * k * (-1.0 if sprite.flip_h else 1.0), base - h * float(cfg.get("head", 0.9))))
	if cfg.has("threads") and not heads.is_empty():
		_threads(node, cfg["threads"], heads, s, base)


## Particelle per un rettangolo, date quelle per schermata.
func _field_amount(density: float, r: Rect2) -> int:
	var view := _half_view() * 2.0
	return clampi(int(density * r.get_area() / (view.x * view.y)), 1, MAX_FIELD)


## Particelle ambientali su uno strato (lucciole lontane, pulviscolo, pioggia di fondo, bokeh).
## y: [alto, basso] relativi alla linea di terra dello strato; senza y copre tutta l'altezza.
func _field(cfg: Dictionary) -> void:
	var s := float(cfg["scroll"])
	var node := _layer(s, int(cfg.get("z", -25)))
	var reach := _reach(s)
	var span := _span(cfg, s)
	var r := Rect2(span.x, reach.position.y, span.y - span.x, reach.size.y)
	if cfg.has("y"):
		var base := _base(s)
		r.position.y = base + float(cfg["y"][0])
		r.size.y = float(cfg["y"][1]) - float(cfg["y"][0])
	node.add_child(Fx.field(str(cfg["kind"]), r, _field_amount(float(cfg.get("density", 30.0)), r), _th, cfg))


func _flock(cfg: Dictionary) -> void:
	var s := float(cfg.get("scroll", 0.06))
	var node := _layer(s, int(cfg.get("z", -44)))
	var flock := FlockScript.new()
	flock.setup(cfg, _half_view(), _rng.randi())
	node.add_child(flock)
	_layers[_layers.size() - 1]["flock"] = flock
