extends Node2D
## Finale della campagna (bibbia §VII Gregorio, §VIII Violante, §XVI conclusione, §XVII stato del mondo).
## Dopo la sconfitta del Custode: Gregorio cade in ginocchio e parla (scelta gregorio_mercy), la sua
## anima sale; Violante scende con i fili d'oro e rivela il Velo (scelta violante_fate); il colore del
## mondo cambia secondo la scelta, breve epilogo con le voci della città, poi la schermata finale.
## È una sequenza a passi aggiornata in _process (niente await): uscire al menu a metà non lascia
## nulla in sospeso. Testi, tempi e grading in data/dialogues.json ("finale" e "npcs").

## Valori del post-processing quando il materiale non li ha ancora (vedi post_screen_grade.gdshader).
const GRADE_DEFAULTS := {
	"tint": Vector3.ONE, "contrast": 1.08, "saturation": 1.0, "lift": 0.0, "bloom_strength": 0.6,
	"vignette": 0.5, "shadow_tint": Vector3.ONE, "highlight_tint": Vector3.ONE,
	"wash_top": Vector3.ZERO, "wash_bottom": Vector3.ZERO,
}
const THREADS := 22
const THREAD_COLOR := Color(1.0, 0.8, 0.42)
const SOUL_COLOR := Color(0.6, 0.82, 1.0)

## Vero finché la sequenza è in corso (il mondo tiene fermo Ferruccio).
var running := false
var world: Node

var _cfg: Dictionary = {}
var _step := 0
var _t := 0.0
var _clock := 0.0
var _fall := Vector2.ZERO
var _gregorio: Node2D
var _violante: Node2D
var _soul: Sprite2D
var _soul_t := -1.0
var _threads: Array = []
var _threads_k := 0.0
var _threads_mode := ""
var _snap_t := 0.0
var _hand := Vector2.ZERO
var _grade_from: Dictionary = {}
var _grade_to: Dictionary = {}
var _grade_t := -1.0
var _ending: Dictionary = {}
var _held := false


## Avvia il finale: "fall_pos" è il punto in cui è caduto il Custode.
func start(w: Node, fall_pos: Vector2) -> void:
	world = w
	_cfg = Story.data().get("finale", {})
	var size: Vector2 = world.room["size"]
	_fall = Vector2(clampf(fall_pos.x, 260.0, size.x - 260.0), float(world.room["floor"]))
	z_index = 8
	material = Art.add_material()
	running = true
	_step = 0
	_t = _time("gregorio_appears")
	for i in THREADS:
		_threads.append({"a": lerpf(-PI + 0.3, -0.3, (float(i) + randf() * 0.6) / THREADS), "len": randf_range(900.0, 1600.0), "seed": randf() * TAU, "delay": randf() * 0.6})
	var audio := get_node_or_null("/root/Audio")
	if audio:
		audio.stop_loops()
		audio.stop_music(2.5)


func _time(key: String) -> float:
	return float((_cfg.get("times", {}) as Dictionary).get(key, 1.0))


func _process(delta: float) -> void:
	_clock += delta
	_update_soul(delta)
	_update_threads(delta)
	_update_grade(delta)
	queue_redraw()
	if not running or world.is_talking():
		return
	# Ferruccio si ferma appena tocca terra (il colpo finale può arrivare in salto).
	if not _held and world.player.is_on_floor():
		world.hold(true)
		_held = true
	_t -= delta
	if _step == 0 and not _held:
		return
	if _t > 0.0:
		return
	match _step:
		0:
			# Il Custode è caduto: al suo posto Gregorio, in ginocchio, con l'armatura spezzata.
			_gregorio = world.spawn_npc("gregorio_caduto", _fall)
			_gregorio.appear()
			Fx.ring(world.fx_root, _fall + Vector2(0, -60), Color(1.0, 0.75, 0.4), 220.0, 0.7)
			Fx.dust(world.fx_root, _fall, 30)
			_next(_time("gregorio_talk"))
		1:
			world.start_talk(_gregorio)
			_next(0.0)
		2:
			# Gregorio muore: resta l'armatura, una piccola luce azzurra sale verso il balcone.
			_soul = Art.glow(self, _gregorio.position + Vector2(0, -80), Color(SOUL_COLOR, 0.0), 70.0)
			_soul_t = 0.0
			var tw := create_tween()
			tw.tween_property(_gregorio, "modulate", Color(0.55, 0.55, 0.62), 2.0)
			_next(_time("soul"))
		3:
			_violante = world.spawn_npc("violante_finale", _violante_spot())
			_violante.appear()
			_hand = _violante.position + Vector2(0, -72)
			_threads_mode = "grow"
			_next(_time("violante_talk"))
		4:
			world.start_talk(_violante)
			_next(0.0)
		5:
			var fate: String = world.story.get_var("violante_fate")
			if fate == "":
				fate = "risparmiata"
			_ending = (_cfg.get("endings", {}) as Dictionary).get(fate, {})
			_threads_mode = "snap" if fate == "uccisa" else "bind"
			_snap_t = 0.0
			_start_grade(_ending.get("grade", {}))
			var audio := get_node_or_null("/root/Audio")
			if audio and str(_ending.get("music", "")) != "":
				audio.play_area(str(_ending["music"]))
			_next(_time("grade") + _time("epilogue"))
		6:
			world.narrate(_ending.get("dialogue", {}))
			_next(0.6)
		7:
			running = false
			world.finish_story(str(_ending.get("title", "")), str(_ending.get("subtitle", "")), str(_cfg.get("quote", "")))


func _next(wait: float) -> void:
	_step += 1
	_t = wait


## Violante scende oltre Gregorio (Ferruccio, Gregorio, Violante); se non c'è spazio, dall'altra parte.
func _violante_spot() -> Vector2:
	var size: Vector2 = world.room["size"]
	var d := float(_cfg.get("violante_distance", 190.0))
	var side := signf(_fall.x - world.player.global_position.x)
	if side == 0.0:
		side = 1.0
	var x := _fall.x + side * d
	if x < 200.0 or x > size.x - 200.0:
		x = _fall.x - side * d * 1.6
	return Vector2(clampf(x, 200.0, size.x - 200.0), _fall.y)


# ---------------------------------------------------------------- Anima, fili, colore

func _update_soul(delta: float) -> void:
	if _soul == null or _soul_t < 0.0:
		return
	_soul_t += delta
	var k := _soul_t / maxf(0.1, _time("soul") + 1.5)
	_soul.position.y -= 70.0 * delta
	_soul.position.x += sin(_soul_t * 2.0) * 10.0 * delta
	_soul.modulate = Color(SOUL_COLOR, 0.9 * sin(clampf(k, 0.0, 1.0) * PI))
	if k >= 1.0:
		_soul.queue_free()
		_soul = null


func _update_threads(delta: float) -> void:
	match _threads_mode:
		"grow":
			_threads_k = minf(1.0, _threads_k + delta / 2.4)
		"snap":
			_snap_t += delta
		"bind":
			_threads_k = minf(1.6, _threads_k + delta / 2.0)


func _start_grade(target: Dictionary) -> void:
	var mat: ShaderMaterial = world.post_material()
	_grade_from.clear()
	_grade_to.clear()
	for k in target:
		var v = target[k]
		var to = Vector3(float(v[0]), float(v[1]), float(v[2])) if v is Array else float(v)
		var from = mat.get_shader_parameter(k) if mat else null
		if from == null:
			from = GRADE_DEFAULTS.get(k, to)
		_grade_from[k] = from
		_grade_to[k] = to
	_grade_t = 0.0


func _update_grade(delta: float) -> void:
	if _grade_t < 0.0:
		return
	_grade_t += delta
	var k := smoothstep(0.0, 1.0, _grade_t / maxf(0.1, _time("grade")))
	var mat: ShaderMaterial = world.post_material()
	if mat:
		for name in _grade_to:
			mat.set_shader_parameter(name, lerp(_grade_from[name], _grade_to[name], k))
	if k >= 1.0:
		_grade_t = -1.0


## Fili d'oro dalle mani di Violante verso le strade (additivi). Spezzati se il Velo cade,
## più fitti e luminosi se viene ricucito.
func _draw() -> void:
	if _threads_mode == "" or _violante == null:
		return
	var snap := _threads_mode == "snap"
	var bright := 0.55 + 0.25 * clampf(_threads_k - 1.0, 0.0, 0.6) / 0.6
	draw_texture_rect(Art.soft_texture(), Rect2(_hand - Vector2(40, 40), Vector2(80, 80)), false, Color(THREAD_COLOR, (0.0 if snap else 0.5) * minf(1.0, _threads_k)))
	for i in _threads.size():
		var th: Dictionary = _threads[i]
		if not snap and _threads_mode != "bind" and i % 3 == 2:
			continue  # i fili in più compaiono solo quando Violante ricuce il Velo
		var dir := Vector2.from_angle(float(th["a"]))
		var target: Vector2 = _hand + dir * float(th["len"])
		var grow := clampf(_threads_k * 1.4 - float(th["delay"]), 0.0, 1.0)
		if snap:
			var s := _snap_t / 1.4
			if s >= 1.0:
				continue
			var cut := 0.45 + 0.1 * sin(float(th["seed"]))
			_thread(target, 0.0, cut * (1.0 - s), Color(THREAD_COLOR, 0.7 * (1.0 - s)), float(th["seed"]), s * 30.0)
			_thread(target, cut + s * 0.35, 1.0, Color(THREAD_COLOR, 0.6 * (1.0 - s) * (1.0 - s)), float(th["seed"]), s * 60.0)
		elif grow > 0.0:
			_thread(target, 0.0, grow, Color(THREAD_COLOR, bright * (0.8 + 0.2 * sin(_clock * 2.0 + float(th["seed"])))), float(th["seed"]), 0.0)


func _thread(target: Vector2, from: float, to: float, col: Color, phase: float, jitter: float) -> void:
	if to <= from:
		return
	var n := 18
	var pts := PackedVector2Array()
	var normal := (target - _hand).orthogonal().normalized()
	for i in n + 1:
		var t := lerpf(from, to, float(i) / n)
		var sag := sin(t * PI) * 40.0
		var wave := sin(_clock * 1.3 + phase + t * 7.0) * 5.0 * t
		var shake := sin(_clock * 40.0 + phase * 3.0 + t * 20.0) * jitter * t
		pts.append(_hand.lerp(target, t) + normal * (sag + wave + shake))
	draw_polyline(pts, col, 1.6, true)
