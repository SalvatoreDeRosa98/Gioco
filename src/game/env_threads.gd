extends Node2D
## I fili d'oro del Velo della Concordia: partono dalle finestre accese e dalle teste dei cittadini
## addormentati e salgono verso la Reggia, oppure pendono a ghirlanda tra una finestra e l'altra.
## La geometria (una striscia di triangoli per filo) si costruisce una volta sola; oscillazione,
## bagliore e scintille che corrono verso la Reggia li fa lo shader canvas_env_thread sulla GPU.

const SHADER := preload("res://game/shaders/canvas_env_thread.gdshader")
## Lunghezza di un segmento della striscia, in unità di mondo (fili lunghi = più segmenti).
const SEGMENT_LEN := 36.0
const MIN_SEGMENTS := 10
const MAX_SEGMENTS := 56
## La lunghezza viaggia nel colore di vertice divisa per questo valore (vedi lo shader).
const LEN_SCALE := 4096.0

var _points := PackedVector2Array()
var _uvs := PackedVector2Array()
var _colors := PackedColorArray()
var _indices := PackedInt32Array()
var _count := 0


## cfg: chiavi di aspetto da data/areas.json (color, alpha, width, sway, sway_speed, spark,
## spark_speed, spark_spacing, glow, core, rise_len); lamp: colore di riserva se cfg non ha "color".
func setup(cfg: Dictionary, lamp: Color) -> void:
	var mat := ShaderMaterial.new()
	mat.shader = SHADER
	mat.set_shader_parameter("color", Color(cfg.get("color", lamp.to_html())))
	mat.set_shader_parameter("intensity", float(cfg.get("alpha", 1.0)))
	mat.set_shader_parameter("sway", float(cfg.get("sway", 6.0)))
	mat.set_shader_parameter("sway_speed", float(cfg.get("sway_speed", 0.55)))
	mat.set_shader_parameter("spark", float(cfg.get("spark", 2.2)))
	mat.set_shader_parameter("spark_speed", float(cfg.get("spark_speed", 70.0)))
	mat.set_shader_parameter("spark_spacing", float(cfg.get("spark_spacing", 260.0)))
	mat.set_shader_parameter("glow", float(cfg.get("glow", 0.3)))
	mat.set_shader_parameter("core", float(cfg.get("core", 0.16)))
	mat.set_shader_parameter("rise_len", float(cfg.get("rise_len", 450.0)))
	material = mat


## Aggiunge un filo da p0 a p1. bend: spostamento del punto medio (per le ghirlande è il peso
## verso il basso, per i fili che salgono è una curva laterale); wave: ampiezza di una leggera S.
## garland: true per i fili tesi tra due agganci (non svaniscono verso il cielo e sono fermi ai capi).
func add_thread(p0: Vector2, p1: Vector2, bend: Vector2, wave: float, width: float, bright: float, phase: float, garland: bool) -> void:
	var chord := p1 - p0
	var length := chord.length() + bend.length()
	if length < 4.0:
		return
	var perp := chord.orthogonal().normalized()
	var n := clampi(int(length / SEGMENT_LEN), MIN_SEGMENTS, MAX_SEGMENTS)
	var first := _points.size()
	var hw := width * 0.5
	var data := Color(fposmod(phase, 1.0), minf(length / LEN_SCALE, 1.0), bright, 1.0 if garland else 0.0)
	for i in n + 1:
		var t := float(i) / float(n)
		# Parabola (buona approssimazione della catenaria) più una S che si spegne verso la punta.
		var p := p0 + chord * t + bend * (4.0 * t * (1.0 - t)) + perp * (wave * sin(TAU * t) * (1.0 - t))
		var tangent := chord + bend * (4.0 * (1.0 - 2.0 * t)) + perp * (wave * (TAU * cos(TAU * t) * (1.0 - t) - sin(TAU * t)))
		var nrm := tangent.orthogonal().normalized() * hw
		_points.append(p + nrm)
		_points.append(p - nrm)
		_uvs.append(Vector2(t, 0.0))
		_uvs.append(Vector2(t, 1.0))
		_colors.append(data)
		_colors.append(data)
	for i in n:
		var a := first + i * 2
		_indices.append_array(PackedInt32Array([a, a + 1, a + 2, a + 1, a + 3, a + 2]))
	_count += 1
	queue_redraw()


## Numero di fili costruiti (per i controlli di densità).
func thread_count() -> int:
	return _count


func _draw() -> void:
	if _indices.is_empty():
		return
	RenderingServer.canvas_item_add_triangle_array(get_canvas_item(), _indices, _points, _colors, _uvs)
