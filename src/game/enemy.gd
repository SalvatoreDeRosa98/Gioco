extends CharacterBody2D
## Nemico: IA, vita, reazioni ai colpi e aspetto (gatto, vespa, statua, Custode). I danni al
## giocatore li decide il mondo (world.gd); qui c'è solo ciò che il nemico fa da sé.
##
## Gatto e vespa seguono la scuola di Hollow Knight: pochi gesti, ognuno annunciato da un
## telegrafo leggibile (posa + suono) e seguito da una pausa in cui si può punire. I numeri di
## gioco stanno in data/tuning.json (enemies); qui restano solo le costanti di disegno.

const GRAVITY := 1500.0
const MAX_FALL := 900.0
const SPRITE_SHADER := preload("res://game/shaders/canvas_char_sprite.gdshader")

## Immagini dipinte (assets/art/enemies, bosses). Perni e ancore in pixel della tela;
## le parti mobili e i loro poligoni vengono da tools/art/rig_nemici.py.
const GATTO_BODY := preload("res://assets/art/enemies/gatto_rig/corpo.png")
const GATTO_TAIL := preload("res://assets/art/enemies/gatto_rig/coda.png")
const GATTO_HEAD := preload("res://assets/art/enemies/gatto_rig/testa.png")
const GATTO_HIND_A := preload("res://assets/art/enemies/gatto_rig/zampa_post_a.png")
const GATTO_HIND_B := preload("res://assets/art/enemies/gatto_rig/zampa_post_b.png")
const GATTO_FORE_A := preload("res://assets/art/enemies/gatto_rig/zampa_ant_a.png")
const GATTO_FORE_B := preload("res://assets/art/enemies/gatto_rig/zampa_ant_b.png")
const GATTO_FEET := Vector2(400, 592)
const GATTO_TAIL_ROOT := Vector2(190, 290)
const GATTO_NECK := Vector2(618, 182)
const GATTO_HIP_A := Vector2(225, 430)
const GATTO_HIP_B := Vector2(305, 422)
const GATTO_SHOULDER_A := Vector2(512, 458)
const GATTO_SHOULDER_B := Vector2(588, 460)
const GATTO_EYE := Vector2(722, 147)
const GATTO_SCALE := 0.078
const VESPA_BODY := preload("res://assets/art/enemies/vespa_rig/corpo.png")
const VESPA_WINGS := preload("res://assets/art/enemies/vespa_rig/ali.png")
const VESPA_ABDOMEN := preload("res://assets/art/enemies/vespa_rig/addome.png")
const VESPA_CENTER := Vector2(330, 420)
const VESPA_WING_ROOT := Vector2(338, 226)
const VESPA_WAIST := Vector2(298, 298)
const VESPA_SCALE := 0.0755
const STATUA_TEX := preload("res://assets/art/enemies/statua.png")
const STATUA_FEET := Vector2(165, 1010)
const STATUA_SCALE := 0.103
const CUSTODE_TEX := preload("res://assets/art/bosses/custode.png")
const CUSTODE_FEET := Vector2(360, 1010)
const CUSTODE_LILY := Vector2(420, 340)
const CUSTODE_SCALE := 0.176
## Ritmo del passo del Custode (radianti/s): ogni mezzo periodo un piede tocca terra.
const CUSTODE_STEP_RATE := 3.5
## Mensole attraversabili (vedi player.gd): i gatti ci camminano sopra, le vespe le attraversano.
const LEDGE_LAYER := 4
## Distanza minima dai bordi della stanza: i nemici non escono dai portali aperti.
const ROOM_MARGIN := 60.0
## Mezza altezza del giocatore (player.gd HALF.y): serve a sapere dove poggia i piedi.
const PLAYER_HALF_Y := 24.0
## Spinta laterale (px/s) che fa scendere il gatto rimasto in bilico su uno spigolo.
const PERCH_NUDGE := 120.0
## Probabilità che il gatto miagoli quando si ferma (solo atmosfera).
const MEOW_CHANCE := 0.3
## Oltre questa distanza dal giocatore (circa mezzo schermo) i versi dei nemici non si sentono.
const HEAR_RANGE := 700.0

# Solo aspetto: ampiezze e ritmi delle pose (il gameplay è tutto in tuning.json).
## Radianti di fase del passo per pixel percorso: le zampe seguono lo spostamento, niente pattinate.
const GAIT_PER_PX := 0.19
## Oscillazione massima delle zampe del gatto (radianti).
const LEG_SWING := 0.34
## Battiti d'ala della vespa (radianti/s di fase) a riposo.
const WING_RATE := 38.0
## Molla delle pose: pulsazione (rad/s) e smorzamento (1 = critico, meno = un piccolo rimbalzo).
const POSE_OMEGA := 15.0
const POSE_DAMP := 0.55

## Canali della posa, ognuno inseguito da una molla smorzata: gli stati cambiano solo i
## bersagli, così il passaggio da una posa all'altra non scatta mai.
enum P { SX, SY, TILT, HEAD, TAIL, LIFT, STRIDE, FORE, HIND, GLOW, SHAKE, WING }
const P_COUNT := 12
const P_REST: Array[float] = [1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0]

var kind := "gatto"
var hp := 3
var max_hp := 3
var half := Vector2(20, 14)
var speed := 70.0
var damage := 1
var coins := 2
var flash := 0.0
var facing := 1.0
var anim := "idle"
## Secondi prima che il contatto possa ferire di nuovo il giocatore.
var touch_cd := 0.0
var world: Node

var _cfg: Dictionary = {}
var _rng := RandomNumberGenerator.new()
var _t := 0.0
var _dt := 0.0
var _seed := 0.0
var _dir := 1.0
var _shoot_cd := 1.5
var _state := "walk"
## Gatto e vespa: secondi trascorsi nello stato e durata prevista. Il Custode usa _state_t come conto alla rovescia.
var _state_t := 1.5
var _state_len := 0.0
var _airborne := false
var _step_s := 0.0
## Spinta dei colpi per chi non ha uno stato di stordimento (statua, Custode).
var _knock_v := Vector2.ZERO
# Gatto
var _rest_kind := ""
var _rest_flipped := false
var _turn_to := 1.0
var _notice_cd := 0.0
var _pounce_cd := 0.0
var _blocked_t := 0.0
var _stuck_t := 0.0
var _stuck_x := 0.0
var _gait := 0.0
## Velocità orizzontale voluta durante salti e agguati.
var _air_vx := 0.0
## Secondi passati in aria senza scendere né salire (appollaiato su uno spigolo).
var _perch_t := 0.0
## Quota dei piedi del giocatore sull'ultima superficie toccata (INF = non ancora vista).
var _tgt_floor_y := INF
# Vespa
var _home := Vector2.ZERO
var _orbit_a := 0.0
var _orbit_dir := 1.0
var _attack_cd := 0.0
var _dive_dir := Vector2.RIGHT
var _dive_left := 0.0
var _wing_ph := 0.0
# Aspetto
var _look_t := 0.0
var _last_anim := ""
var _anim_start := 0.0
var _pose := PackedFloat32Array()
var _pose_v := PackedFloat32Array()
var _goal := PackedFloat32Array()
var _last_facing := 1.0
var _eye_at := Vector2.ZERO
var _mat: ShaderMaterial
var _aura: Sprite2D
var _aura_scale := Vector2.ONE


func setup(d: Dictionary, w: Node) -> void:
	kind = str(d["type"])
	_cfg = Tuning.data.enemies[kind]
	hp = int(_cfg["hp"])
	max_hp = hp
	speed = float(_cfg["speed"])
	damage = int(_cfg["damage"])
	coins = int(_cfg["coins"])
	world = w
	position = d["pos"]
	_home = position
	_shoot_cd = float(_cfg.get("fire_every", 2.0)) * 0.6
	_rng.randomize()
	_t = _rng.randf() * 10.0
	_seed = _rng.randf() * TAU
	_dir = -1.0 if _rng.randf() < 0.5 else 1.0
	facing = _dir
	_last_facing = facing
	half = _half_for(kind)
	collision_layer = 0
	collision_mask = 1
	# Le vespe volano attraverso le mensole: posarcisi sopra le farebbe incagliare in picchiata.
	set_collision_mask_value(LEDGE_LAYER, kind != "vespa")
	if kind == "vespa":
		motion_mode = CharacterBody2D.MOTION_MODE_FLOATING

	var sh := RectangleShape2D.new()
	sh.size = half * 2.0
	var cs := CollisionShape2D.new()
	cs.shape = sh
	add_child(cs)

	_pose.resize(P_COUNT)
	_pose_v.resize(P_COUNT)
	_goal.resize(P_COUNT)
	for i in P_COUNT:
		_pose[i] = P_REST[i]

	add_to_group("enemies")
	_mat = ShaderMaterial.new()
	_mat.shader = SPRITE_SHADER
	material = _mat
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	match kind:
		"custode":
			_state = "walk"
			_state_t = 1.5
			Art.point_light(self, Vector2(0, -20), Color(1.0, 0.7, 0.35), 0.7, 520.0)
			_aura = Art.glow(self, Vector2.ZERO, Color(1.0, 0.72, 0.32), 90.0)
		"statua":
			# Alone azzurro: distingue la statua nemica da quelle decorative.
			_aura = Art.glow(self, Vector2(0, -24), Color(0.55, 0.8, 1.0), 120.0)
			_aura.show_behind_parent = true
			# Marmo bianco: le luci 2D lo brucerebbero, basta l'alone.
			light_mask = 0
		"vespa":
			Art.point_light(self, Vector2(-6, 6), Color(1.0, 0.75, 0.35), 0.35, 200.0)
			_enter("wander")
			_notice_cd = _f("spawn_grace")
		_:
			# Occhi che si accendono quando il gatto si accorge del giocatore (telegrafo).
			_aura = Art.glow(self, Vector2.ZERO, Color(0.72, 0.55, 1.0), 15.0)
			_aura.modulate.a = 0.0
			_enter("walk", _rand("patrol_time_min", "patrol_time_max"))
			# Appena entrati nella stanza il giocatore ha un attimo per orientarsi.
			_notice_cd = _f("spawn_grace")
	if _aura:
		_aura_scale = _aura.scale


static func _half_for(k: String) -> Vector2:
	match k:
		"vespa":
			return Vector2(16, 12)
		"statua":
			return Vector2(20, 34)
		"custode":
			return Vector2(48, 64)
		_:
			return Vector2(20, 14)


# ---------------------------------------------------------------- IA

func _physics_process(delta: float) -> void:
	_dt = delta
	flash = maxf(0.0, flash - delta * 5.0)
	touch_cd = maxf(0.0, touch_cd - delta)
	match kind:
		"vespa":
			_ai_vespa(delta)
		"statua":
			_ai_statua(delta)
		"custode":
			_ai_custode(delta)
		_:
			_ai_gatto(delta)
	if _knock_v != Vector2.ZERO:
		velocity += _knock_v
		_knock_v = _knock_v.move_toward(Vector2.ZERO, 1400.0 * delta)
	move_and_slide()
	match kind:
		"vespa":
			_after_move_vespa()
		"statua", "custode":
			pass
		_:
			_after_move_gatto()


func _f(key: String) -> float:
	return float(_cfg[key])


func _rand(key_min: String, key_max: String) -> float:
	return _rng.randf_range(_f(key_min), _f(key_max))


func _enter(state: String, length: float = 0.0) -> void:
	_state = state
	_state_t = 0.0
	_state_len = length


## Nessun muro tra due punti (campionato ogni 24 px sui rettangoli solidi della stanza).
func _clear_line(a: Vector2, b: Vector2) -> bool:
	var steps := int(a.distance_to(b) / 24.0) + 1
	for i in range(1, steps):
		if world.is_solid(a.lerp(b, float(i) / float(steps))):
			return false
	return true


func _face_x(x: float) -> void:
	if absf(x - global_position.x) > 6.0:
		_dir = signf(x - global_position.x)


# ---------------------------------------------------------------- Gatto

## Gatto randagio: pattuglia a passo ritmato e ogni tanto si ferma (si siede, si guarda attorno,
## si stiracchia). Quando vede il giocatore inarca la schiena (telegrafo), poi lo rincorre: salta
## sulle mensole e sui blocchi, scende dai bordi e balza d'agguato con un arco parabolico.
func _ai_gatto(delta: float) -> void:
	_state_t += delta
	_notice_cd = maxf(0.0, _notice_cd - delta)
	_pounce_cd = maxf(0.0, _pounce_cd - delta)
	var target: Node2D = world.alive_player()
	var on_floor := is_on_floor()
	var want := 0.0
	var accel := _f("accel")
	var ballistic := false
	match _state:
		"walk":
			want = _dir * speed * _step_pulse()
			# Gli ostacoli si guardano PRIMA di muoversi, con sonde nel punto davanti: niente
			# letture di is_on_wall() vecchie di un frame (il gatto si girava avanti e indietro).
			if on_floor and _blocked_ahead(_dir):
				_enter_turn(-_dir)
				want = 0.0
			elif _state_t >= _state_len:
				_start_rest()
			_look_for(target)
		"turn":
			# Breve frenata; a metà si volta (la molla della posa maschera lo specchiamento).
			if _state_t >= _state_len * 0.45:
				_dir = _turn_to
			if _state_t >= _state_len:
				_dir = _turn_to
				_enter("walk", _rand("patrol_time_min", "patrol_time_max"))
			_look_for(target)
		"rest":
			if _rest_kind == "guarda" and not _rest_flipped and _state_t >= _state_len * 0.5:
				_rest_flipped = true
				_dir = -_dir
			if _state_t >= _state_len:
				var nd := -_dir if _rng.randf() < 0.35 else _dir
				if _blocked_ahead(nd):
					nd = -nd
				_dir = nd
				_enter("walk", _rand("patrol_time_min", "patrol_time_max"))
			_look_for(target)
		"notice":
			if target:
				_face_x(target.global_position.x)
			if _state_t >= _state_len:
				_blocked_t = 0.0
				_enter("chase")
		"chase":
			want = _chase(target, on_floor)
		"crouch":
			if target:
				_face_x(target.global_position.x)
			if _state_t >= _state_len:
				_launch_pounce(target)
				ballistic = true
		"pounce", "jump":
			# La velocità orizzontale del salto si riapplica a ogni frame: strisciando contro lo
			# spigolo di un blocco move_and_slide la azzera, e il gatto ricadrebbe in verticale.
			velocity.x = _air_vx
			ballistic = true
		"land":
			if _state_t >= _state_len:
				_after_recover(target)
		"hurt":
			# Spinta del colpo che si smorza: attrito pieno a terra, poco in aria.
			accel = _f("accel") * 1.4 if on_floor else 250.0
			ballistic = not on_floor and _state_t < 0.12
			if _state_t >= _state_len:
				_after_recover(target)
	velocity.y = minf(velocity.y + GRAVITY * delta, MAX_FALL)
	if not ballistic:
		velocity.x = move_toward(velocity.x, want, accel * delta)
	if on_floor:
		_gait += absf(velocity.x) * delta * GAIT_PER_PX / (1.0 + absf(velocity.x) / 200.0)
	facing = _dir
	anim = _state
	_watchdog(delta, on_floor, want)


## Passo ritmato: la camminata spinge a ogni passo invece di scorrere a velocità costante.
func _step_pulse() -> float:
	var s := sin(_gait)
	return 0.75 + 0.5 * s * s


func _enter_turn(new_dir: float) -> void:
	_turn_to = new_dir
	_enter("turn", _f("turn_time"))


func _start_rest() -> void:
	_enter("rest", _rand("rest_time_min", "rest_time_max"))
	var r := _rng.randf()
	_rest_kind = "siede" if r < 0.4 else ("guarda" if r < 0.75 else "stira")
	_rest_flipped = false
	# Ogni tanto, fermandosi, miagola: il gatto si fa sentire prima di farsi vedere.
	if _rng.randf() < MEOW_CHANCE:
		_sfx("gatto_miao")


## Dopo l'atterraggio o lo stordimento: riprende la caccia se il giocatore è ancora lì.
func _after_recover(target: Node2D) -> void:
	if target and global_position.distance_to(target.global_position) < _f("lose_range"):
		_blocked_t = 0.0
		_enter("chase")
	else:
		_enter("walk", _rand("patrol_time_min", "patrol_time_max"))


## Telegrafo dell'avvistamento: saltino di sorpresa, schiena inarcata, occhi accesi, soffio.
func _look_for(target: Node2D) -> void:
	if target == null or _notice_cd > 0.0:
		return
	var d := target.global_position - global_position
	if absf(d.x) > _f("sight_range") or absf(d.y) > _f("sight_height"):
		return
	if signf(d.x) != _dir and absf(d.x) > _f("sight_behind"):
		return
	if not _clear_line(global_position + Vector2(0, -half.y * 0.5), target.global_position):
		return
	_face_x(target.global_position.x)
	_tgt_floor_y = INF
	_enter("notice", _f("notice_time"))
	if is_on_floor():
		velocity.y = -_f("notice_hop")
	velocity.x = 0.0
	_sfx("gatto_soffio")


## Rincorsa: restituisce la velocità orizzontale voluta e decide salti, discese e agguati.
func _chase(target: Node2D, on_floor: bool) -> float:
	if target == null:
		_start_rest()
		return 0.0
	var d := target.global_position - global_position
	if d.length() > _f("lose_range"):
		_notice_cd = _f("notice_cooldown")
		_start_rest()
		return 0.0
	# Altezza dei piedi del giocatore: mentre salta conta l'ultima superficie su cui stava.
	if target is CharacterBody2D and (target as CharacterBody2D).is_on_floor():
		_tgt_floor_y = target.global_position.y + PLAYER_HALF_Y
	elif _tgt_floor_y == INF:
		_tgt_floor_y = target.global_position.y + PLAYER_HALF_Y
	# Isteresi: arrivato addosso al giocatore lo oltrepassa di un poco prima di voltarsi, così
	# la carica resta una carica (alla Husk) invece di fermarsi incollata a lui.
	if absf(d.x) > _f("pounce_min_range") or absf(d.y) > 60.0:
		_face_x(target.global_position.x)
	var run := _f("chase_speed")
	if not on_floor:
		return _dir * run
	var feet_y := global_position.y + half.y
	var dy := _tgt_floor_y - feet_y   # < 0: il giocatore sta più in alto
	var aim_x := target.global_position.x
	# 1) Agguato: vicino, quasi alla stessa altezza e con la via libera.
	var ady := target.global_position.y + PLAYER_HALF_Y - feet_y
	if _pounce_cd <= 0.0 and absf(d.x) <= _f("pounce_range") and absf(d.x) >= _f("pounce_min_range") \
			and ady > -_f("pounce_reach_up") and ady < 80.0 \
			and _clear_line(global_position + Vector2(0, -half.y), target.global_position):
		_enter("crouch", _f("pounce_windup"))
		return 0.0
	# 2) Il giocatore è più in alto: cerca una mensola o un blocco raggiungibile con un salto.
	if dy < -50.0:
		var goal := _climb_goal(target.global_position.x)
		if goal.x != INF:
			if absf(goal.x - global_position.x) <= _f("jump_reach") and not _wall_between(goal):
				_jump_to(goal, _f("jump_arc"), run * 1.9)
				_enter("jump")
				return velocity.x
			aim_x = goal.x
			_face_x(aim_x)
		elif absf(d.x) < 40.0:
			return _wait_blocked()
	# Il giocatore è da questa parte dell'ostacolo o del bordo (carica che lo ha oltrepassato):
	# niente salti, si torna verso di lui.
	var beyond := signf(aim_x - global_position.x) == _dir and absf(aim_x - global_position.x) > half.x + 8.0
	if not beyond and dy > -30.0 and _blocked_ahead(_dir):
		_dir = signf(d.x) if signf(d.x) != _dir and absf(d.x) > 2.0 else -_dir
		return 0.0 if _blocked_ahead(_dir) else _dir * run
	# 3) Ostacolo davanti: un blocco basso si scavalca, un muro alto no.
	if _wall_ahead(_dir):
		var h := _obstacle_height(_dir)
		if h <= _f("jump_height_max"):
			_jump_to(Vector2(global_position.x + _dir * (half.x + 34.0), feet_y - h), _f("jump_arc"), run * 1.6)
			_enter("jump")
			return velocity.x
		return _wait_blocked()
	# 4) Bordo davanti: scende se il giocatore è più in basso, altrimenti salta verso di lui o aspetta.
	if not _ground_ahead(_dir):
		if dy > 30.0:
			_blocked_t = 0.0
			return _dir * run
		var land := _landing_near(target.global_position.x)
		if land.x != INF and absf(land.x - global_position.x) <= _f("jump_reach"):
			_jump_to(land, _f("jump_arc"), run * 1.9)
			_enter("jump")
			return velocity.x
		return _wait_blocked()
	_blocked_t = 0.0
	if aim_x != target.global_position.x and absf(aim_x - global_position.x) < 10.0:
		return 0.0
	return _dir * run


## Davanti a un ostacolo che non sa superare il gatto soffia e aspetta; poi lascia perdere.
func _wait_blocked() -> float:
	_blocked_t += _dt
	if _blocked_t >= _f("give_up_time"):
		_blocked_t = 0.0
		_notice_cd = _f("notice_cooldown")
		_start_rest()
	return 0.0


## Mensola o blocco più adatto per salire verso il giocatore: raggiungibile con un salto dai
## piedi del gatto, non più alto del giocatore, il più vicino possibile a lui. INF se non c'è.
func _climb_goal(tx: float) -> Vector2:
	var feet_y := global_position.y + half.y
	var t_feet := _tgt_floor_y
	var best := Vector2(INF, INF)
	var best_score := INF
	var rects: Array = world.room["ledges"] + world.room["blocks"]
	for r: Rect2 in rects:
		var h := feet_y - r.position.y
		if h < 24.0 or h > _f("jump_height_max") or r.position.y < t_feet - 20.0:
			continue
		var gx := clampf(tx, r.position.x + 18.0, r.end.x - 18.0)
		var score := absf(gx - tx) + absf(r.position.y - t_feet) + absf(gx - global_position.x) * 0.5
		if score < best_score:
			best_score = score
			best = Vector2(gx, r.position.y)
	return best


## Punto d'atterraggio sulla superficie dove sta il giocatore (per saltare da un bordo all'altro).
func _landing_near(tx: float) -> Vector2:
	var feet_y := global_position.y + half.y
	var t_feet := _tgt_floor_y
	if feet_y - t_feet > _f("jump_height_max"):
		return Vector2(INF, INF)
	var rects: Array = world.room["ledges"] + world.room["blocks"]
	for r: Rect2 in rects:
		if absf(r.position.y - t_feet) < 12.0 and tx > r.position.x - 10.0 and tx < r.end.x + 10.0:
			var gx := clampf(tx, r.position.x + 18.0, r.end.x - 18.0)
			return Vector2(gx, r.position.y)
	return Vector2(INF, INF)


## Un solido sul percorso verso il punto d'arrivo (il salto andrebbe a sbattere).
func _wall_between(goal: Vector2) -> bool:
	var from := global_position + Vector2(0, -half.y - 30.0)
	return not _clear_line(from, goal + Vector2(0, -half.y - 30.0))


## Salto balistico: dai piedi del gatto al punto "goal" (piedi all'arrivo), con l'apice "arc"
## pixel sopra il più alto dei due. La velocità orizzontale è limitata a max_vx.
func _jump_to(goal: Vector2, arc: float, max_vx: float) -> void:
	var feet := global_position + Vector2(0, half.y)
	var apex_y := minf(feet.y, goal.y) - arc
	var vy := -sqrt(2.0 * GRAVITY * (feet.y - apex_y))
	var t := -vy / GRAVITY + sqrt(2.0 * maxf(goal.y - apex_y, 0.0) / GRAVITY)
	velocity = Vector2(clampf((goal.x - feet.x) / maxf(t, 0.05), -max_vx, max_vx), vy)
	_air_vx = velocity.x
	if absf(velocity.x) > 1.0:
		_dir = signf(velocity.x)
	_kick(P.SY, 4.0)
	_kick(P.SX, -3.0)


## Fine del telegrafo: balzo verso il punto in cui il giocatore è ADESSO (si può schivare).
func _launch_pounce(target: Node2D) -> void:
	var goal := global_position + Vector2(_dir * 120.0, half.y)
	if target:
		goal = target.global_position + Vector2(0, PLAYER_HALF_Y)
	var reach := _f("pounce_range") * 1.15
	goal.x = global_position.x + clampf(goal.x - global_position.x, -reach, reach)
	_jump_to(goal, _f("pounce_arc"), _f("pounce_max_speed"))
	_enter("pounce")
	_sfx("gatto_balzo")


func _land() -> void:
	var was_pounce := _state == "pounce"
	if was_pounce:
		_pounce_cd = _f("pounce_cooldown")
	_enter("land", _f("land_recover") * (1.0 if was_pounce else 0.35))
	velocity.x *= 0.25
	# Schiacciamento d'atterraggio, più forte dopo l'agguato.
	_kick(P.SY, -6.0 if was_pounce else -4.0)
	_kick(P.SX, 5.0 if was_pounce else 3.0)
	if world.get("fx_root"):
		Fx.dust(world.fx_root, global_position + Vector2(0, half.y), 8 if was_pounce else 4)


func _wall_ahead(dir: float) -> bool:
	var x := global_position.x + dir * (half.x + 4.0)
	var size: Vector2 = world.room["size"]
	if x < ROOM_MARGIN or x > size.x - ROOM_MARGIN:
		return true
	return world.is_solid(Vector2(x, global_position.y)) or world.is_solid(Vector2(x, global_position.y + half.y - 4.0))


func _ground_ahead(dir: float) -> bool:
	return world.is_ground(Vector2(global_position.x + dir * (half.x + 4.0), global_position.y + half.y + 6.0))


func _blocked_ahead(dir: float) -> bool:
	return _wall_ahead(dir) or not _ground_ahead(dir)


## Altezza del solido davanti, misurata dai piedi; oltre il salto massimo (o il bordo stanza) = INF.
func _obstacle_height(dir: float) -> float:
	var x := global_position.x + dir * (half.x + 4.0)
	var size: Vector2 = world.room["size"]
	if x < ROOM_MARGIN or x > size.x - ROOM_MARGIN:
		return INF
	var feet_y := global_position.y + half.y
	var h := 0.0
	while world.is_solid(Vector2(x, feet_y - h - 2.0)):
		h += 8.0
		if h > _f("jump_height_max") + 8.0:
			return INF
	return h


## Dopo lo spostamento: atterraggi e muri. La normale del muro dice da che parte girarsi: il verso
## viene assegnato, mai invertito alla cieca, così due letture di fila danno la stessa risposta.
func _after_move_gatto() -> void:
	# Appollaiato su uno spigolo (in aria ma fermo): una spinta di lato lo fa scendere.
	if not is_on_floor() and absf(get_position_delta().y) < 0.5:
		_perch_t += _dt
		if _perch_t > 0.2:
			_perch_t = 0.0
			var side := _dir if not _wall_ahead(_dir) else -_dir
			velocity.x = side * PERCH_NUDGE
			_air_vx = velocity.x
	else:
		_perch_t = 0.0
	if _state == "pounce" or _state == "jump":
		if is_on_floor() and _state_t > 0.08:
			_land()
		return
	if _state == "walk" and is_on_wall():
		var nx := signf(get_wall_normal().x)
		if nx != 0.0 and nx != _dir:
			_enter_turn(nx)


## Rete di sicurezza: se in marcia non avanza per 0.7 s cambia strada (o rinuncia alla caccia).
func _watchdog(delta: float, on_floor: bool, want: float) -> void:
	if not on_floor or absf(want) < 1.0 or (_state != "walk" and _state != "chase"):
		_stuck_x = global_position.x
		_stuck_t = 0.0
		return
	if absf(global_position.x - _stuck_x) > 3.0:
		_stuck_x = global_position.x
		_stuck_t = 0.0
		return
	_stuck_t += delta
	if _stuck_t < 0.7:
		return
	_stuck_t = 0.0
	if _state == "walk":
		_enter_turn(-_dir)
	else:
		_notice_cd = _f("notice_cooldown")
		_start_rest()


# ---------------------------------------------------------------- Vespa

## Vespa: ronza attorno al punto di partenza; vista la preda le gira attorno con un volo
## ondeggiante, poi si ferma, vibra e si piega all'indietro (telegrafo), picchia in linea retta
## e rimbalza indietro prima di riprendere a girare.
func _ai_vespa(delta: float) -> void:
	_state_t += delta
	_t += delta
	_notice_cd = maxf(0.0, _notice_cd - delta)
	var target: Node2D = world.alive_player()
	var want := Vector2.ZERO
	var steer := _f("steer")
	var wobble := 1.0
	match _state:
		"wander":
			var wr := _f("wander_radius")
			var goal := _home + Vector2(sin(_t * 0.43 + _seed) * wr, sin(_t * 0.77 + _seed * 1.7) * wr * 0.35)
			want = ((goal - global_position) * 1.4).limit_length(speed * 0.6)
			if target and _notice_cd <= 0.0 and global_position.distance_to(target.global_position) < _f("sight_range") \
					and _clear_line(global_position, target.global_position):
				_enter("notice", _f("notice_time"))
				_kick(P.SY, 4.0)
		"notice":
			want = Vector2(0, -40)
			wobble = 0.3
			if target:
				_face_x(target.global_position.x)
			if _state_t >= _state_len:
				_start_orbit(target, 0.6)
		"orbit":
			if target == null or global_position.distance_to(target.global_position) > _f("lose_range"):
				_home = global_position
				_notice_cd = _f("notice_cooldown")
				_enter("wander")
			else:
				_orbit_a += _f("orbit_speed") * _orbit_dir * delta
				var r := _f("orbit_radius")
				var center := target.global_position + Vector2(0, -_f("orbit_height"))
				var goal := center + Vector2(cos(_orbit_a) * r, sin(_orbit_a) * r * 0.4)
				want = ((goal - global_position) * 2.2).limit_length(speed)
				_face_x(target.global_position.x)
				_attack_cd -= delta
				if _attack_cd <= 0.0 and global_position.distance_to(target.global_position) < _f("attack_range") \
						and _clear_line(global_position, target.global_position):
					_enter("windup", _f("windup_time"))
		"windup":
			# Telegrafo: frena, arretra un poco, vibra e si piega indietro (vibrazione e posa nel disegno).
			steer = 7.0
			wobble = 0.1
			if target:
				_face_x(target.global_position.x)
				want = (global_position - target.global_position).normalized() * 40.0
			if _state_t >= _state_len:
				var aim := global_position + Vector2(_dir * 120.0, 60.0)
				if target:
					aim = target.global_position + Vector2(0, -4)
				_dive_dir = (aim - global_position).normalized()
				_dive_left = global_position.distance_to(aim) + _f("dive_overshoot")
				_enter("dive")
				velocity = _dive_dir * _f("dive_speed")
				_kick(P.SX, 5.0)
				_sfx("vespa_picchiata")
		"dive":
			# Linea retta, nessuna sterzata: leggibile e schivabile.
			velocity = _dive_dir * _f("dive_speed")
			_dive_left -= _f("dive_speed") * delta
			if absf(_dive_dir.x) > 0.05:
				_dir = signf(_dive_dir.x)
			if _dive_left <= 0.0 or _state_t >= _f("dive_time_max"):
				_enter("retreat", _f("retreat_time"))
			facing = _dir
			anim = _state
			return
		"retreat":
			var k := 1.0 - clampf(_state_t / maxf(_state_len, 0.01), 0.0, 1.0)
			want = -_dive_dir * _f("retreat_speed") * k + Vector2(0, -60.0)
			steer = 5.0
			wobble = 0.5
			if _state_t >= _state_len:
				_start_orbit(target, 1.0)
		"hurt":
			steer = 2.5
			wobble = 0.0
			if _state_t >= _state_len:
				_enter("retreat", _f("retreat_time") * 0.7)
	want += _wobble() * wobble * speed * 0.35
	want += _avoid_walls() * speed * 1.2
	velocity = velocity.lerp(want, 1.0 - exp(-steer * delta))
	if _state != "orbit" and _state != "windup" and _state != "notice" and absf(velocity.x) > 12.0:
		_dir = signf(velocity.x)
	facing = _dir
	anim = _state


func _start_orbit(target: Node2D, cd_scale: float) -> void:
	_enter("orbit")
	_attack_cd = _rand("attack_cooldown_min", "attack_cooldown_max") * cd_scale
	_orbit_dir = -1.0 if _rng.randf() < 0.5 else 1.0
	if target:
		var rel := global_position - (target.global_position + Vector2(0, -_f("orbit_height")))
		_orbit_a = atan2(rel.y / 0.4, rel.x)


## Volo organico: due sinusoidi sovrapposte per asse, sfasate per ogni vespa.
func _wobble() -> Vector2:
	return Vector2(sin(_t * 1.9 + _seed) * 0.6 + sin(_t * 3.7 + _seed * 2.3) * 0.4,
			sin(_t * 2.6 + _seed * 1.3) * 0.6 + sin(_t * 5.3 + _seed * 0.7) * 0.4)


## Spinta via da muri, blocchi, pavimento e bordi della stanza vicini (0..1).
func _avoid_walls() -> Vector2:
	var push := Vector2.ZERO
	var m := _f("wall_margin")
	for i in 8:
		var d := Vector2.RIGHT.rotated(TAU * float(i) / 8.0)
		if world.is_solid(global_position + d * m):
			push -= d
	var size: Vector2 = world.room["size"]
	if global_position.x < ROOM_MARGIN + m:
		push.x += 1.0
	elif global_position.x > size.x - ROOM_MARGIN - m:
		push.x -= 1.0
	return push.limit_length(1.0)


## Picchiata contro un muro o il pavimento: rimbalza indietro invece di strisciarci contro.
func _after_move_vespa() -> void:
	if _state != "dive" or get_slide_collision_count() == 0:
		return
	_enter("retreat", _f("retreat_time"))
	velocity = -_dive_dir * _f("retreat_speed") * 0.6
	_kick(P.SX, -5.0)
	_kick(P.SY, 5.0)


# ---------------------------------------------------------------- Statua e Custode

## Statua: ferma, guarda il giocatore più vicino, si carica e spara in orizzontale.
func _ai_statua(delta: float) -> void:
	velocity.y = minf(velocity.y + GRAVITY * delta, MAX_FALL)
	velocity.x = 0.0
	var target: Node2D = world.alive_player()
	if target and absf(target.global_position.x - global_position.x) > 4.0:
		facing = signf(target.global_position.x - global_position.x)
	_shoot_cd -= delta
	var was := anim
	anim = "charge" if _shoot_cd < 0.6 else "idle"
	if anim == "charge" and was != "charge":
		_sfx("statua_carica")
	if _shoot_cd <= 0.0:
		_shoot_cd = _f("fire_every")
		world.enemy_fire(global_position + Vector2(facing * 26.0, -40.0), Vector2(facing, 0.0), _f("bullet_speed"), Color(0.6, 0.85, 1.0))
		_sfx("statua_sparo")


## Boss: cammina verso il giocatore, poi alterna balzo con onda d'urto e raffica radiale.
func _ai_custode(delta: float) -> void:
	velocity.y = minf(velocity.y + GRAVITY * delta, 1000.0)
	var target: Node2D = world.alive_player()
	if target and absf(target.global_position.x - global_position.x) > 4.0 and _state == "walk":
		facing = signf(target.global_position.x - global_position.x)
	_state_t -= delta
	match _state:
		"walk":
			velocity.x = facing * speed
			anim = "walk"
			# Passi a ritmo del sobbalzo disegnato (_draw_custode): uno a ogni appoggio.
			var step := sin(_look_t * CUSTODE_STEP_RATE)
			if signf(step) != signf(_step_s):
				_sfx("custode_passo")
			_step_s = step
			if _state_t <= 0.0:
				if randf() < 0.5:
					_state = "crouch"
					_state_t = 0.35
				else:
					_state = "burst"
					_state_t = 1.0
		"crouch":
			velocity.x = 0.0
			anim = "crouch"
			if _state_t <= 0.0:
				_state = "leap"
				_airborne = false
				velocity = Vector2(facing * 260.0, -680.0)
		"leap":
			anim = "leap"
			if not is_on_floor():
				_airborne = true
			elif _airborne:
				world.enemy_shockwave(global_position + Vector2(0, half.y - 6.0))
				_sfx("custode_urto")
				_state = "walk"
				_state_t = 1.6
				velocity.x = 0.0
		"burst":
			velocity.x = 0.0
			anim = "burst"
			if _state_t <= 0.0:
				world.enemy_burst(global_position + Vector2(0, -40.0), 10)
				_sfx("custode_raffica")
				_state = "walk"
				_state_t = 2.2


# ---------------------------------------------------------------- Colpi ricevuti

## Colpo ricevuto. "push" è la direzione del colpo (dal giocatore verso il nemico): i nemici
## leggeri vengono spinti e storditi un attimo, statua e Custode quasi non si muovono.
## Ritorna true se il nemico è morto.
func take_hit(dmg: int, push: Vector2 = Vector2.ZERO) -> bool:
	hp -= dmg
	flash = 1.0
	if hp <= 0:
		_sfx("nemico_ucciso")
		queue_free()
		return true
	_sfx("nemico_colpito")
	_react(push)
	return false


func _react(push: Vector2) -> void:
	var dir := push.normalized() if push != Vector2.ZERO else Vector2(-facing, 0.0)
	var k := _f("knockback")
	var stun := _f("hitstun")
	# Schiacciamento elastico: il colpo comprime la figura, la molla la riporta in forma.
	var heft := 1.0 if stun > 0.0 else 0.35
	_kick(P.SX, 7.0 * heft)
	_kick(P.SY, -7.0 * heft)
	_kick(P.TILT, dir.x * facing * 4.0 * heft)
	match kind:
		"gatto":
			velocity.x = (dir.x if absf(dir.x) > 0.2 else -facing * 0.4) * k
			velocity.y = -_f("knock_lift") if dir.y < 0.5 else maxf(velocity.y, dir.y * k * 0.5)
			if absf(dir.x) > 0.2:
				_dir = -signf(dir.x)   # si gira verso chi l'ha colpito
			_enter("hurt", stun)
		"vespa":
			velocity = dir * k
			_dive_dir = -dir
			_enter("hurt", stun)
		_:
			_knock_v = Vector2(dir.x * k, 0.0)


## Effetto sonoro (nomi in data/audio.json). Gli effetti non sono posizionali: un nemico
## lontano dal giocatore, fuori dallo schermo, resta muto.
func _sfx(sfx_name: String) -> void:
	var p: Node2D = world.alive_player() if world else null
	if p and p.global_position.distance_to(global_position) > HEAR_RANGE:
		return
	Audio.sfx(sfx_name)


# ---------------------------------------------------------------- Aspetto

func _process(delta: float) -> void:
	_look_t += delta
	if anim != _last_anim:
		_last_anim = anim
		_anim_start = _look_t
	_update_pose(minf(delta, 1.0 / 30.0))
	_wing_ph += delta * WING_RATE * _pose[P.WING]
	_mat.set_shader_parameter("flash", flash)
	_update_glows()
	queue_redraw()


## Avanzamento 0..1 dell'animazione corrente (calcolato dal tempo di vista).
func _anim_progress(duration: float) -> float:
	return clampf((_look_t - _anim_start) / duration, 0.0, 1.0)


## Spinta istantanea alla velocità di un canale della posa (colpi, atterraggi, giravolte).
func _kick(ch: int, amount: float) -> void:
	if _pose_v.size() > ch:
		_pose_v[ch] += amount


func _update_pose(delta: float) -> void:
	for i in P_COUNT:
		_goal[i] = P_REST[i]
	match kind:
		"vespa":
			_goal_vespa()
		"statua", "custode":
			pass
		_:
			_goal_gatto()
	# Molla smorzata per canale: le pose si inseguono senza scatti.
	var k := POSE_OMEGA * POSE_OMEGA
	var c := 2.0 * POSE_DAMP * POSE_OMEGA
	for i in P_COUNT:
		_pose_v[i] += (k * (_goal[i] - _pose[i]) - c * _pose_v[i]) * delta
		_pose[i] += _pose_v[i] * delta
	# Girarsi è uno specchiamento istantaneo: un colpo di molla in larghezza lo fa sembrare una giravolta.
	if facing != _last_facing:
		_last_facing = facing
		_kick(P.SX, -6.0)


func _goal_gatto() -> void:
	var on_floor := is_on_floor()
	var run := clampf(absf(velocity.x) / _f("chase_speed"), 0.0, 1.0)
	_goal[P.STRIDE] = clampf(absf(velocity.x) / maxf(speed, 1.0), 0.0, 1.0) if on_floor else 0.0
	_goal[P.TAIL] = 0.05 + 0.3 * run
	_goal[P.HEAD] = 0.05 * _goal[P.STRIDE]   # camminando la testa anticipa, un po' bassa
	_goal[P.TILT] = 0.05 * run
	var k := clampf(_state_t / maxf(_state_len, 0.01), 0.0, 1.0)
	match _state:
		"rest":
			match _rest_kind:
				"siede":
					# Seduto: posteriore giù, zampe dietro piegate in avanti, testa che guarda in giro.
					_goal[P.TILT] = -0.16
					_goal[P.HIND] = -0.55
					_goal[P.FORE] = 0.06
					_goal[P.LIFT] = 1.5
					_goal[P.HEAD] = -0.08 + sin(_look_t * 0.9 + _seed) * 0.08
					_goal[P.TAIL] = 0.1
				"guarda":
					_goal[P.HEAD] = -0.12 + sin(_look_t * 1.4 + _seed) * 0.14
					_goal[P.TAIL] = 0.2
					_goal[P.SY] = 0.98
				_:
					# Stiracchiata: zampe davanti allungate, petto basso, poi torna in piedi.
					if k < 0.6:
						_goal[P.FORE] = -0.5
						_goal[P.TILT] = 0.2
						_goal[P.HIND] = 0.12
						_goal[P.HEAD] = 0.16
						_goal[P.SX] = 1.08
						_goal[P.SY] = 0.9
						_goal[P.TAIL] = 0.5
		"turn":
			_goal[P.HEAD] = -0.1
			_goal[P.SY] = 0.96
		"notice":
			# Telegrafo: schiena inarcata (alto e stretto), coda ritta, pelo che vibra, occhi accesi.
			_goal[P.SX] = 0.86
			_goal[P.SY] = 1.2
			_goal[P.HEAD] = -0.3
			_goal[P.TAIL] = 0.95
			_goal[P.GLOW] = 1.0
			_goal[P.SHAKE] = 0.8
			_goal[P.FORE] = 0.08
			_goal[P.HIND] = -0.08
		"chase":
			_goal[P.GLOW] = 0.7
			_goal[P.HEAD] = 0.1
			_goal[P.TAIL] = 0.35 + 0.1 * run
			if on_floor and absf(velocity.x) < 20.0:
				# Fermo davanti a un ostacolo: soffia a schiena inarcata.
				_goal[P.SX] = 0.93
				_goal[P.SY] = 1.09
				_goal[P.HEAD] = -0.15
				_goal[P.TAIL] = 0.7
				_goal[P.SHAKE] = 0.35
				_goal[P.GLOW] = 1.0
		"crouch":
			# Carica dell'agguato: basso e largo, posteriore che freme.
			_goal[P.SX] = 1.14
			_goal[P.SY] = 0.8
			_goal[P.LIFT] = 2.5
			_goal[P.HEAD] = 0.16
			_goal[P.TAIL] = 0.15 + sin(_look_t * 24.0) * 0.12
			_goal[P.HIND] = 0.18
			_goal[P.FORE] = -0.12
			_goal[P.GLOW] = 1.0
			_goal[P.SHAKE] = 0.45
			_goal[P.TILT] = 0.06
		"pounce", "jump":
			# In volo: allungato lungo la traiettoria, zampe davanti protese e dietro distese.
			_goal[P.TILT] = clampf(atan2(velocity.y, absf(velocity.x) + 1.0) * 0.45, -0.45, 0.45)
			_goal[P.SX] = 1.16
			_goal[P.SY] = 0.88
			_goal[P.FORE] = -0.6 if velocity.y < 0.0 else -0.25
			_goal[P.HIND] = 0.55
			_goal[P.TAIL] = -0.15
			_goal[P.HEAD] = -0.05
			_goal[P.GLOW] = 1.0 if _state == "pounce" else 0.6
		"land":
			_goal[P.SX] = 1.1
			_goal[P.SY] = 0.88
			_goal[P.LIFT] = 1.5
			_goal[P.FORE] = 0.1
			_goal[P.HIND] = -0.1
			_goal[P.GLOW] = 0.6
		"hurt":
			_goal[P.SX] = 0.9
			_goal[P.SY] = 1.1
			_goal[P.TILT] = -0.18
			_goal[P.HEAD] = -0.25
			_goal[P.TAIL] = 0.55
			_goal[P.GLOW] = 0.4


func _goal_vespa() -> void:
	var v := velocity
	var pitch := clampf(atan2(v.y, absf(v.x) + 30.0), -0.6, 0.8)
	var fwd := clampf(absf(v.x) / maxf(speed, 1.0), 0.0, 1.5)
	# Si inclina nella direzione del volo; l'addome "respira".
	_goal[P.TILT] = pitch * 0.4 + fwd * 0.12
	_goal[P.HEAD] = sin(_look_t * 2.3 + _seed) * 0.06
	match _state:
		"notice":
			_goal[P.SHAKE] = 0.5
			_goal[P.HEAD] = -0.15
			_goal[P.WING] = 1.3
			_goal[P.SX] = 0.95
			_goal[P.SY] = 1.06
		"windup":
			# Telegrafo: indietro col busto, pungiglione puntato in avanti, vibrazione crescente.
			_goal[P.TILT] = -0.38
			_goal[P.HEAD] = -0.42
			_goal[P.SHAKE] = minf(1.0, _state_t / maxf(_state_len, 0.01) * 2.0)
			_goal[P.WING] = 1.5
			_goal[P.SX] = 0.94
			_goal[P.SY] = 1.06
		"dive":
			# Picchiata col pungiglione davanti: il busto si piega poco, l'addome molto.
			_goal[P.TILT] = pitch * 0.35
			_goal[P.HEAD] = -0.6
			_goal[P.WING] = 1.9
			_goal[P.SX] = 1.08
			_goal[P.SY] = 0.94
		"retreat":
			_goal[P.TILT] = -0.2
			_goal[P.HEAD] = 0.12
			_goal[P.WING] = 1.3
		"hurt":
			_goal[P.TILT] = -0.35
			_goal[P.HEAD] = 0.3
			_goal[P.WING] = 0.6
			_goal[P.SX] = 0.9
			_goal[P.SY] = 1.1


func _draw() -> void:
	if kind != "vespa":
		# Ombra a terra: in salto resta sul pavimento e si stringe con la quota.
		var drop := 0.0 if kind != "gatto" or is_on_floor() else _ground_below()
		var k := clampf(1.0 - drop / 220.0, 0.25, 1.0)
		draw_colored_polygon(Art.ellipse(Vector2(0, half.y + 1.0 + drop), Vector2(half.x * 0.9 * k, 4.0 * k), 16), Color(0, 0, 0, 0.32 * k))
	match kind:
		"vespa":
			_draw_vespa()
		"statua":
			_draw_statua()
		"custode":
			_draw_custode()
		_:
			_draw_gatto()
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	if kind != "custode" and hp < max_hp and hp > 0:
		var w := half.x * 2.0
		draw_rect(Rect2(-w * 0.5, -half.y - 16.0, w, 3), Color(0, 0, 0, 0.6))
		draw_rect(Rect2(-w * 0.5, -half.y - 16.0, w * float(hp) / float(max_hp), 3), Art.enemy_color(kind))


## Distanza dai piedi alla prima superficie sotto (al massimo 240 px), per l'ombra in salto.
func _ground_below() -> float:
	if world == null or world.room.is_empty():
		return 0.0
	var feet := global_position + Vector2(0, half.y)
	var h := 0.0
	while h < 240.0 and not world.is_ground(feet + Vector2(0, h + 2.0)):
		h += 8.0
	return h


## Trasformazione dell'immagine: il punto "anchor" (pixel) va in "at", con specchiatura,
## inclinazione e schiacciamento attorno a quel punto.
func _sprite_xf(at: Vector2, anchor: Vector2, k: float, tilt: float, sq: Vector2) -> Transform2D:
	return Transform2D(tilt * facing, Vector2(facing * sq.x, sq.y) * k, 0.0, at) * Transform2D(0.0, Vector2.ONE, 0.0, -anchor)


## Rotazione/scala di un pezzo attorno al suo perno, in pixel della tela.
static func _about(pivot: Vector2, angle: float, scale_v: Vector2 = Vector2.ONE) -> Transform2D:
	return Transform2D(angle, scale_v, 0.0, pivot) * Transform2D(0.0, Vector2.ONE, 0.0, -pivot)


## Disegna un pezzo (stessa tela dell'immagine intera) ruotato/scalato attorno al suo perno.
func _piece(base: Transform2D, tex: Texture2D, pivot: Vector2, angle: float = 0.0, scale_v: Vector2 = Vector2.ONE, mod: Color = Color.WHITE) -> void:
	draw_set_transform_matrix(base * _about(pivot, angle, scale_v))
	draw_texture(tex, Vector2.ZERO, mod)


func _draw_gatto() -> void:
	var p := _pose
	var ph := _gait
	var stride := clampf(p[P.STRIDE], 0.0, 1.2)
	var bob := -absf(sin(ph)) * 1.4 * stride
	var shake := Vector2(sin(_look_t * 61.0), sin(_look_t * 47.0) * 0.5) * p[P.SHAKE]
	var sq := Vector2(p[P.SX], p[P.SY] + 0.03 * sin(ph * 2.0) * stride)
	var tilt := p[P.TILT] + sin(ph) * 0.025 * stride
	var base := _sprite_xf(Vector2(0, half.y + bob + p[P.LIFT]) + shake, GATTO_FEET, GATTO_SCALE, tilt, sq)
	# Coda viva: onda lenta più un guizzo; più ampia quando il gatto è fermo.
	var tail := p[P.TAIL] + sin(_look_t * 2.1 + _seed) * (0.14 - 0.06 * stride) + sin(_look_t * 5.3 + _seed) * 0.04
	_piece(base, GATTO_TAIL, GATTO_TAIL_ROOT, tail)
	_piece(base, GATTO_BODY, Vector2.ZERO)
	# Passo a coppie diagonali: posteriore A con anteriore B, posteriore B con anteriore A.
	var swing := sin(ph) * LEG_SWING * stride
	_piece(base, GATTO_HIND_A, GATTO_HIP_A, p[P.HIND] + swing)
	_piece(base, GATTO_HIND_B, GATTO_HIP_B, p[P.HIND] - swing)
	_piece(base, GATTO_FORE_A, GATTO_SHOULDER_A, p[P.FORE] - swing)
	_piece(base, GATTO_FORE_B, GATTO_SHOULDER_B, p[P.FORE] + swing)
	# La testa ondeggia in controfase col corpo: resta stabile mentre il corpo sobbalza.
	var head := p[P.HEAD] + sin(ph * 2.0 + 1.2) * 0.035 * stride
	_piece(base, GATTO_HEAD, GATTO_NECK, head)
	_eye_at = (base * _about(GATTO_NECK, head)) * GATTO_EYE


func _draw_vespa() -> void:
	var p := _pose
	var calm := 1.0 - clampf(p[P.SHAKE], 0.0, 1.0)
	var bob := sin(_look_t * 3.0 + _seed) * 2.5 * calm
	var shake := Vector2(sin(_look_t * 83.0), cos(_look_t * 71.0)) * 1.6 * p[P.SHAKE]
	var base := _sprite_xf(Vector2(0, bob) + shake, VESPA_CENTER, VESPA_SCALE, p[P.TILT], Vector2(p[P.SX], p[P.SY]))
	_piece(base, VESPA_ABDOMEN, VESPA_WAIST, p[P.HEAD])
	_piece(base, VESPA_BODY, Vector2.ZERO)
	# Ali: battito rapidissimo, schiacciate verso la radice; una seconda posa semitrasparente
	# sfasata fa da scia e le fa sembrare sfocate.
	var flap := absf(sin(_wing_ph))
	var trail := absf(sin(_wing_ph + 1.3))
	_piece(base, VESPA_WINGS, VESPA_WING_ROOT, -0.12 * trail, Vector2(1.0, 0.45 + 0.55 * trail), Color(1, 1, 1, 0.35))
	_piece(base, VESPA_WINGS, VESPA_WING_ROOT, -0.12 * flap, Vector2(1.0, 0.45 + 0.55 * flap))


func _draw_statua() -> void:
	var charge := _anim_progress(0.6) if anim == "charge" else 0.0
	# Tremito mentre si carica: la pietra vibra prima di sparare.
	var shake := Vector2(sin(_look_t * 60.0), 0.0) * 1.2 * charge
	var sq := Vector2(_pose[P.SX], _pose[P.SY])
	var base := _sprite_xf(Vector2(0, half.y) + shake, STATUA_FEET, STATUA_SCALE, _pose[P.TILT] * 0.3, sq)
	_piece(base, STATUA_TEX, Vector2.ZERO)


func _draw_custode() -> void:
	var t := _look_t
	var walk := absf(velocity.x) > 10.0
	var bob := -absf(sin(t * CUSTODE_STEP_RATE)) * 4.0 if walk else sin(t * 1.6) * 1.0
	var tilt := sin(t * CUSTODE_STEP_RATE) * 0.03 if walk else 0.0
	var sq := Vector2.ONE
	match anim:
		"crouch":
			sq = Vector2(1.08, 0.88)
		"leap":
			sq = Vector2(0.94, 1.08)
		"burst":
			tilt = -0.07 * _anim_progress(0.4)
	sq *= Vector2(_pose[P.SX], _pose[P.SY])
	var base := _sprite_xf(Vector2(0, half.y + bob), CUSTODE_FEET, CUSTODE_SCALE, tilt + _pose[P.TILT] * 0.3, sq)
	_piece(base, CUSTODE_TEX, Vector2.ZERO)


## Aloni e luci che seguono l'immagine (aggiornati ogni frame).
func _update_glows() -> void:
	if _aura == null:
		return
	match kind:
		"statua":
			var charge := _anim_progress(0.6) if anim == "charge" else 0.0
			_aura.modulate = Color(0.55, 0.8, 1.0, 0.16 + 0.5 * charge)
			_aura.scale = _aura_scale * (1.0 + 0.35 * charge)
		"custode":
			var charge := _anim_progress(1.0) if anim == "burst" else 0.0
			var pulse := 0.5 + 0.5 * sin(_look_t * 4.0)
			var at := (CUSTODE_LILY - CUSTODE_FEET) * CUSTODE_SCALE
			_aura.position = Vector2(at.x * facing, half.y + at.y)
			_aura.modulate = Color(1.0, 0.72, 0.32, 0.25 + 0.15 * pulse + 0.6 * charge)
			_aura.scale = _aura_scale * (1.0 + 0.8 * charge)
		"gatto":
			var g := clampf(_pose[P.GLOW], 0.0, 1.2)
			_aura.position = _eye_at
			_aura.modulate = Color(0.75, 0.58, 1.0, 0.6 * g)
			_aura.scale = _aura_scale * (0.75 + 0.4 * g)
