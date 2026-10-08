extends Node2D
## Personaggio non giocante. L'immagine dipinta è disegnata su una griglia morbida che si deforma:
## respiro nel petto, dondolio che cresce verso la testa, sobbalzo quando nota Ferruccio, giro verso
## di lui e piccolo ritmo mentre parla. I ricordi (Gaetano, Bianca) galleggiano in un alone di luce.
## Sopra la testa compaiono l'invito a parlare e le battute di passaggio.
## Non ha collisioni e non è nel gruppo dei nemici: non blocca il passaggio e non prende colpi.
## Dati in data/dialogues.json: "npcs" per il comportamento, "characters" per l'aspetto.

const DialogueBoxScript := preload("res://game/dialogue_box.gd")
## Griglia della deformazione: colonne e righe di quadrilateri sull'immagine.
const COLS := 3
const ROWS := 12
## Disegni sopra a tutto (pioggia e foglie comprese): invito e battute devono restare leggibili.
const OVERLAY_Z := 60
const MOTES := 14

## Chiave del personaggio in dialogues.json ("npcs").
var key := ""
## Chi parla attraverso questo corpo (per il ritmo del respiro durante le battute).
var speakers: Array = []
## Vero quando Ferruccio è abbastanza vicino da parlarci: mostra l'invito.
var focused := false
var world: Node

var _cfg: Dictionary = {}
var _look: Dictionary = {}
var _set: Dictionary = {}
var _tex: Texture2D
var _scale := 0.1
var _feet := Vector2.ZERO
var _height := 120.0
var _memory := false
var _glow_col := Color.WHITE
var _tint := Color.WHITE
var _turn_mode := "near"
var _home := Vector2.ZERO
var _home_face := 1.0
var _face := 1.0
var _face_target := 1.0
var _t := 0.0
var _age := 0.0
var _present := true
var _alpha := 1.0
var _drift := Vector2.ZERO
var _prompt_a := 0.0
var _new_a := 0.0
var _hop := 0.0
var _hop_v := 0.0
var _near := false
var _away_t := 0.0
var _voice := false
var _talking := false
var _has_new := false
var _poll := 0.0
var _bark: Dictionary = {}
var _bark_i := -1
var _bark_t := 0.0
var _bark_done := false
var _overlay: Node2D
var _glow: Sprite2D
var _light: PointLight2D
var _motes: Array = []
var _idx := PackedInt32Array()
var _uvs := PackedVector2Array()


## Prepara il personaggio "k" di dialogues.json nel punto dei piedi "pos".
func setup(k: String, pos: Vector2, w: Node) -> void:
	key = k
	world = w
	position = pos
	_home = pos
	_cfg = Story.npc(k)
	_look = Story.character(str(_cfg.get("character", k)))
	_set = Story.settings()
	_tex = load(str(_look.get("image", ""))) as Texture2D
	_height = float(_look.get("height", 120.0))
	if _tex:
		_scale = _height / float(_tex.get_height())
		var fp: Array = _look.get("feet", [])
		_feet = Vector2(float(fp[0]), float(fp[1])) if fp.size() == 2 else Vector2(_tex.get_width() * 0.5, _tex.get_height() - 4.0)
	_memory = bool(_look.get("memory", false))
	var gc: Array = _look.get("glow", [1.0, 1.0, 1.0])
	_glow_col = Color(float(gc[0]), float(gc[1]), float(gc[2]))
	var tc: Array = _look.get("tint", [1.0, 1.0, 1.0])
	_tint = Color(float(tc[0]), float(tc[1]), float(tc[2]))
	speakers = _cfg.get("speakers", [str(_cfg.get("character", k))])
	_turn_mode = str(_cfg.get("turn", "near"))
	_home_face = signf(float(_cfg.get("face", 1.0)))
	_face = _home_face
	_face_target = _home_face
	_bark = _cfg.get("bark", {})
	_t = randf() * 10.0


func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_overlay = Node2D.new()
	_overlay.z_as_relative = false
	_overlay.z_index = OVERLAY_Z
	_overlay.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	_overlay.draw.connect(_draw_overlay)
	add_child(_overlay)
	if _memory:
		# Luce propria: le luci dei lampioni brucerebbero l'immagine già luminosa.
		light_mask = 0
		_glow = Art.glow(self, Vector2(0, -_height * 0.5), Color(_glow_col, 0.3), _height * 2.6)
		_glow.show_behind_parent = true
		_light = Art.point_light(self, Vector2(0, -_height * 0.55), _glow_col, 0.55, _height * 5.0)
		for i in MOTES:
			_motes.append(_new_mote(true))
	elif _look.has("light"):
		var l: Array = _look["light"]
		_light = Art.point_light(self, Vector2(float(l[5]), float(l[6])), Color(float(l[0]), float(l[1]), float(l[2])), float(l[3]), float(l[4]))
	_build_grid()
	_present = _check_present()
	_alpha = 1.0 if _present else 0.0
	visible = _present


# ---------------------------------------------------------------- Stato

## Vero se adesso si può parlare con lui (presente, visibile, con qualcosa da dire).
func can_talk() -> bool:
	return _present and _alpha > 0.9 and bool(_cfg.get("talk", true)) and not (_cfg.get("dialogue", []) as Array).is_empty()


## Il dialogo comincia: si volta verso Ferruccio (salvo i dialoghi in cui non deve guardarlo).
func begin_talk(entry: Dictionary, player_x: float) -> void:
	_talking = true
	if not _bark_done:
		# Una battuta di passaggio interrotta dal dialogo ricomincia dopo.
		_bark_i = -1
	if _turn_mode != "never" and bool(entry.get("turn", true)) and absf(player_x - global_position.x) > 4.0:
		_face_target = signf(player_x - global_position.x)


## Comparsa in scena (finale): parte trasparente e sfuma; con "arrive": "descend" scende dall'alto.
func appear() -> void:
	_alpha = 0.0
	visible = true
	if str(_cfg.get("arrive", "")) == "descend":
		position = _home + Vector2(0, -40.0)


func end_talk() -> void:
	_talking = false
	_voice = false
	_poll = 0.0


## Chi parla nel riquadro è questo personaggio: il corpo segue il ritmo delle parole.
func set_voice(on: bool) -> void:
	_voice = on


func _check_present() -> bool:
	return world.story.check(_cfg.get("when", {}), world.story_ctx())


func _start_leave() -> void:
	match str(_cfg.get("leave", "fade")):
		"walk":
			var away := signf(global_position.x - world.player.global_position.x)
			_drift = Vector2((away if away != 0.0 else 1.0) * 75.0, 0.0)
			_face_target = signf(_drift.x)
		"rise":
			_drift = Vector2(0, -28.0)
		_:
			_drift = Vector2.ZERO


# ---------------------------------------------------------------- Aggiornamento

func _process(delta: float) -> void:
	_t += delta
	_age += delta
	_poll -= delta
	if _poll <= 0.0:
		_poll = 0.25
		var p := _check_present()
		# Chi sta parlando se ne va (o svanisce) solo a dialogo finito, mai a metà battuta.
		if p != _present and not _talking:
			_present = p
			if p:
				position = _home
				_drift = Vector2.ZERO
			else:
				_start_leave()
		_has_new = can_talk() and world.story.has_new(key, world.story_ctx())

	# Comparsa e congedo: i ricordi sfumano più lentamente delle persone.
	var fade_time := 1.4 if _memory else 0.9
	_alpha = move_toward(_alpha, 1.0 if _present else 0.0, delta / fade_time)
	if not _present:
		position += _drift * delta
	elif position != _home:
		# Arrivo dall'alto (vedi appear): scivola dolcemente al suo posto.
		position = position.lerp(_home, 1.0 - exp(-3.0 * delta))
	visible = _alpha > 0.002
	if not visible:
		return

	_update_attention(delta)
	_update_bark(delta)
	if _memory:
		_update_motes(delta)
		var pulse := 0.85 + 0.15 * sin(_t * 2.1)
		_glow.modulate = Color(_glow_col, 0.3 * _alpha * pulse)
		_glow.position = Vector2(0, -_height * 0.5 + _float_y())
		_light.energy = 0.55 * _alpha * pulse
	elif _light:
		_light.energy = float((_look.get("light", [0, 0, 0, 0.5]) as Array)[3]) * _alpha * (1.0 + 0.04 * sin(_t * 9.0))
	queue_redraw()
	_overlay.queue_redraw()


## Sguardo, giro e sobbalzo: reagisce a Ferruccio quando si avvicina.
func _update_attention(delta: float) -> void:
	var p: Node2D = world.player
	var near := false
	var dx := 0.0
	if p and not p.dead and _present:
		dx = p.global_position.x - global_position.x
		near = absf(dx) < float(_set.get("notice_radius", 240.0)) and absf(p.global_position.y - global_position.y) < 180.0
	if near and not _near and _turn_mode != "never":
		_hop_v += 2.4
	_near = near
	if _present and not _talking:
		if near and _turn_mode == "near" and absf(dx) > 8.0:
			_face_target = signf(dx)
			_away_t = 0.0
		elif not near:
			_away_t += delta
			if _away_t > 1.5:
				_face_target = _home_face
	var turn_time := maxf(0.05, float(_set.get("turn_time", 0.2)))
	_face = move_toward(_face, _face_target, delta * 2.0 / turn_time)
	var hop := spring_step(_hop, _hop_v, delta)
	_hop = hop.x
	_hop_v = hop.y

	_prompt_a = move_toward(_prompt_a, 1.0 if focused and not _talking else 0.0, delta / 0.22)
	_new_a = move_toward(_new_a, 1.0 if _has_new and not focused and not _talking else 0.0, delta / 0.6)


## Battute di passaggio: dette a mezza voce quando Ferruccio passa, senza fermare il gioco.
func _update_bark(delta: float) -> void:
	if _bark.is_empty() or _bark_done or not _present or _talking:
		return
	var lines: Array = _bark.get("lines", [])
	if _bark_i < 0:
		var p: Node2D = world.player
		if p == null or p.dead or world.is_talking() or _age < float(_bark.get("delay", 0.0)):
			return
		if absf(p.global_position.x - global_position.x) < float(_bark.get("radius", 300.0)):
			_bark_i = 0
			_bark_t = 0.0
		return
	_bark_t += delta
	if _bark_i < lines.size() and _bark_t > _bark_duration(lines[_bark_i]):
		_bark_i += 1
		_bark_t = 0.0
	if _bark_i >= lines.size():
		_bark_done = true
		if bool(_bark.get("once", false)):
			world.story.mark_seen(str(_bark.get("id", key)))
			_poll = 0.0


## Molla del sobbalzo (posizione, velocità): un piccolo slancio che si smorza da solo.
## Il passo è limitato e lo stiramento ha un tetto: con un frame lungo (caricamento della stanza)
## la molla esplodeva e l'immagine diventava una colonna scura alta e stretta.
static func spring_step(x: float, v: float, delta: float) -> Vector2:
	var dt := minf(delta, 1.0 / 30.0)
	v += (-x * 260.0 - v * 13.0) * dt
	return Vector2(clampf(x + v * dt, -0.5, 0.5), v)


func _bark_duration(line: Dictionary) -> float:
	return float(_set.get("bark_hold", 2.4)) + str(line.get("text", "")).length() * float(_set.get("bark_per_char", 0.05))


func _float_y() -> float:
	return sin(_t * 1.3) * float(_set.get("memory_float", 4.0)) if _memory else 0.0


func _new_mote(spread: bool) -> Dictionary:
	return {
		"p": Vector2(randf_range(-0.4, 0.4) * _height * 0.6, -randf_range(0.0, 1.0 if spread else 0.25) * _height),
		"v": randf_range(10.0, 26.0),
		"life": randf_range(1.6, 3.2),
		"t": randf() * (2.0 if spread else 0.0),
		"s": randf_range(2.0, 4.5),
	}


func _update_motes(delta: float) -> void:
	for i in _motes.size():
		var m: Dictionary = _motes[i]
		m["t"] = float(m["t"]) + delta
		m["p"] = (m["p"] as Vector2) + Vector2(sin(_t * 1.7 + i) * 4.0 * delta, -float(m["v"]) * delta)
		if float(m["t"]) > float(m["life"]):
			_motes[i] = _new_mote(false)


# ---------------------------------------------------------------- Disegno

func _build_grid() -> void:
	_idx.clear()
	_uvs.clear()
	for r in ROWS + 1:
		for c in COLS + 1:
			_uvs.append(Vector2(float(c) / COLS, float(r) / ROWS))
	for r in ROWS:
		for c in COLS:
			var i0 := r * (COLS + 1) + c
			var i1 := i0 + 1
			var i2 := i0 + COLS + 1
			var i3 := i2 + 1
			_idx.append_array([i0, i1, i3, i0, i3, i2])


func _draw() -> void:
	if _tex == null:
		return
	var a := _alpha
	if not _memory:
		var sw := float(_look.get("shadow", _height * 0.17))
		draw_colored_polygon(Art.ellipse(Vector2(0, 1), Vector2(sw, 4.0), 18), Color(0, 0, 0, 0.32 * a))
	else:
		for m in _motes:
			var k := float(m["t"]) / float(m["life"])
			var ma := sin(k * PI) * 0.75 * a
			var s := float(m["s"])
			var mp: Vector2 = m["p"]
			draw_texture_rect(Art.soft_texture(), Rect2(mp - Vector2(s, s), Vector2(s, s) * 2.0), false, Color(_glow_col.lightened(0.4), ma))
	_draw_body(a)


## L'immagine come griglia deformata: i piedi restano fermi, il resto respira e ondeggia.
func _draw_body(a: float) -> void:
	var breath := sin(_t * TAU / float(_set.get("breath_period", 3.4))) * float(_look.get("breath", 1.0))
	var sway := sin(_t * TAU / float(_set.get("sway_period", 5.6)) + _home.x * 0.01) * float(_set.get("sway_amount", 1.6))
	var talk := absf(sin(_t * 12.5)) * 0.016 if _voice else 0.0
	var walk_bob := -absf(sin(_t * 9.0)) * 2.0 if (not _present and _drift.x != 0.0) else 0.0
	var lift := _float_y() + walk_bob
	var w := float(_tex.get_width())
	var h := float(_tex.get_height())
	var pts := PackedVector2Array()
	var cols := PackedColorArray()
	pts.resize(_uvs.size())
	cols.resize(_uvs.size())
	for i in _uvs.size():
		var uv := _uvs[i]
		var l := (Vector2(uv.x * w, uv.y * h) - _feet) * _scale
		var hn := clampf(-l.y / _height, 0.0, 1.1)
		# Il petto si gonfia (campana attorno a 0.62 dell'altezza), tutta la figura si allunga un poco.
		var chest := exp(-pow((hn - 0.62) / 0.2, 2.0))
		l.x *= 1.0 + (breath * 0.022 + talk * 0.6) * chest
		l.y *= 1.0 + breath * 0.009 + talk + _hop * 0.22
		# Dondolio: cresce col quadrato dell'altezza, i piedi non scivolano.
		l.x += sway * hn * hn
		l.x *= _face
		l.y += lift
		pts[i] = l
		var col := Color(_tint, a)
		if _memory:
			# I ricordi svaniscono verso i piedi e tremolano appena.
			col.a = a * (0.25 + 0.75 * smoothstep(0.0, 0.4, hn)) * (0.9 + 0.1 * sin(_t * 7.0 + hn * 6.0))
		cols[i] = col
	RenderingServer.canvas_item_add_triangle_array(get_canvas_item(), _idx, pts, cols, _uvs, PackedInt32Array(), PackedFloat32Array(), _tex.get_rid())


## Invito a parlare, segnale di un incontro nuovo e battute di passaggio. Disegnati alla scala
## dello schermo (annullando lo zoom della camera) perché il testo resti nitido.
func _draw_overlay() -> void:
	var zoom := get_viewport().get_canvas_transform().get_scale().x
	if zoom <= 0.0:
		return
	var top := -_height - 10.0 + _float_y()
	var ink := 1.0 / zoom
	if _prompt_a > 0.0:
		var y := top - 22.0 + (1.0 - ease(_prompt_a, 0.5)) * 8.0 + sin(_t * 2.4) * 1.5
		_overlay.draw_set_transform(Vector2(0, y), 0.0, Vector2(ink, ink))
		_draw_prompt(_prompt_a * _alpha)
	if _new_a > 0.0:
		var pulse := 0.45 + 0.35 * sin(_t * 3.0)
		_overlay.draw_set_transform(Vector2(0, top - 8.0 + sin(_t * 2.0) * 2.0), 0.0, Vector2(ink, ink))
		var r := 4.5
		_overlay.draw_colored_polygon(PackedVector2Array([Vector2(-r, 0), Vector2(0, -r * 1.4), Vector2(r, 0), Vector2(0, r * 1.4)]), Color(Art.OCRA, pulse * _new_a * _alpha))
		_overlay.draw_texture_rect(Art.soft_texture(), Rect2(-14, -14, 28, 28), false, Color(Art.OCRA, 0.35 * _new_a * _alpha))
	if _bark_i >= 0 and not _bark_done and not _talking:
		var lines: Array = _bark.get("lines", [])
		if _bark_i < lines.size():
			var line: Dictionary = lines[_bark_i]
			var dur := _bark_duration(line)
			var ba := minf(1.0, _bark_t / 0.5) * minf(1.0, (dur - _bark_t) / 0.7) * _alpha
			# Il testo resta dentro lo schermo anche se il personaggio è vicino al bordo.
			var sx := get_global_transform_with_canvas().origin.x
			var half := float(_set.get("bark_width", 300.0)) * 0.62
			var vw := get_viewport_rect().size.x
			var shift := clampf(sx, half + 12.0, vw - half - 12.0) - sx
			_overlay.draw_set_transform(Vector2(shift * ink, top - 16.0 - (1.0 - minf(1.0, _bark_t / 0.5)) * 4.0), 0.0, Vector2(ink, ink))
			_draw_bark(str(line.get("text", "")), ba)
	_overlay.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


## Tasto in un cerchio ocra e il verbo in maiuscoletto, come gli inviti di Hollow Knight.
func _draw_prompt(a: float) -> void:
	var c := _overlay
	var key_label := "Y" if DialogueBoxScript.pad else "W"
	var r := 12.0
	c.draw_texture_rect(Art.soft_texture(), Rect2(-30, -30, 60, 60), false, Color(0, 0, 0, 0.55 * a))
	c.draw_circle(Vector2.ZERO, r, Color(0.03, 0.03, 0.05, 0.7 * a))
	c.draw_arc(Vector2.ZERO, r, 0.0, TAU, 32, Color(Art.OCRA, 0.95 * a), 1.5, true)
	var kf := Art.title_font()
	var ks := 15
	var kw := kf.get_string_size(key_label, HORIZONTAL_ALIGNMENT_LEFT, -1, ks).x
	c.draw_string(kf, Vector2(-kw * 0.5, ks * 0.36), key_label, HORIZONTAL_ALIGNMENT_LEFT, -1, ks, Color(Art.CREMA, a))
	var verb := str(_cfg.get("verb", "Parla")).to_upper()
	var vf := Art.title_wide()
	var vs := 12
	var vw := vf.get_string_size(verb, HORIZONTAL_ALIGNMENT_LEFT, -1, vs).x
	var vy := r + 18.0
	Art.text(c, vf, Vector2(-vw * 0.5, vy), verb, vs, Color(Art.CREMA, 0.9 * a))
	var lx := vw * 0.5 + 8.0
	c.draw_line(Vector2(lx, vy - 4.0), Vector2(lx + 16.0, vy - 4.0), Color(Art.OCRA, 0.7 * a), 1.0, true)
	c.draw_line(Vector2(-lx, vy - 4.0), Vector2(-lx - 16.0, vy - 4.0), Color(Art.OCRA, 0.7 * a), 1.0, true)


## Battuta di passaggio: corsivo crema su un velo d'ombra, a più righe se serve.
func _draw_bark(text: String, a: float) -> void:
	if a <= 0.0:
		return
	var c := _overlay
	var f := DialogueBoxScript.italic_font()
	var fs := 19
	var bw := float(_set.get("bark_width", 300.0))
	var size := f.get_multiline_string_size(text, HORIZONTAL_ALIGNMENT_CENTER, bw, fs)
	var y0 := -size.y
	c.draw_texture_rect(Art.soft_texture(), Rect2(-bw * 0.62, y0 - 26.0, bw * 1.24, size.y + 44.0), false, Color(0, 0, 0, 0.5 * a))
	c.draw_multiline_string(f, Vector2(-bw * 0.5, y0 + fs + 2.0), text, HORIZONTAL_ALIGNMENT_CENTER, bw, fs, -1, Color(0, 0, 0, 0.6 * a))
	c.draw_multiline_string(f, Vector2(-bw * 0.5, y0 + fs), text, HORIZONTAL_ALIGNMENT_CENTER, bw, fs, -1, Color(Art.CREMA, a))
