extends CharacterBody2D
## Cavaliere giocabile. Il peer proprietario muove il personaggio; gli altri ricevono posizione e stato.

signal slash_requested(pos: Vector2, facing: float, down: bool, air: bool)

const HALF := Vector2(13, 22)

var peer_id := 1
var player_name := ""
var tint := Color.WHITE
var hp := 5
var max_hp := 5
var dead := false
var facing := 1.0          # replicato
var attacking := 0.0       # replicato: >0 mentre il colpo è attivo
var attack_down := false   # replicato

var _cfg: Dictionary = {}
var _coyote := 0.0
var _jump_buf := 0.0
var _dash_t := 0.0
var _dash_cd := 0.0
var _attack_cd := 0.0
var _knock_t := 0.0
var _flash := 0.0
var _shake := 0.0


func setup(d: Dictionary) -> void:
	peer_id = int(d["peer"])
	player_name = str(d["name"])
	tint = d["tint"]
	position = d["pos"]
	_cfg = Tuning.data.player
	max_hp = int(_cfg.max_hp)
	hp = max_hp
	set_multiplayer_authority(peer_id)
	collision_layer = 2
	collision_mask = 1

	var sh := RectangleShape2D.new()
	sh.size = HALF * 2.0
	var cs := CollisionShape2D.new()
	cs.shape = sh
	add_child(cs)

	var sync := MultiplayerSynchronizer.new()
	sync.set_multiplayer_authority(peer_id)
	var cfg := SceneReplicationConfig.new()
	cfg.add_property(NodePath(":position"))
	cfg.add_property(NodePath(":facing"))
	cfg.add_property(NodePath(":attacking"))
	cfg.add_property(NodePath(":attack_down"))
	sync.replication_config = cfg
	add_child(sync)
	add_to_group("players")


func _physics_process(delta: float) -> void:
	if attacking > 0.0 and is_multiplayer_authority():
		attacking = maxf(0.0, attacking - delta)
	if not is_multiplayer_authority():
		return
	if dead:
		velocity = Vector2.ZERO
		move_and_slide()
		return

	_attack_cd = maxf(0.0, _attack_cd - delta)
	_dash_cd = maxf(0.0, _dash_cd - delta)
	_knock_t = maxf(0.0, _knock_t - delta)
	var axis := 0.0 if _knock_t > 0.0 else Input.get_axis("move_left", "move_right")
	if axis != 0.0:
		facing = signf(axis)

	if Input.is_action_just_pressed("jump"):
		_jump_buf = float(_cfg.jump_buffer)
	else:
		_jump_buf = maxf(0.0, _jump_buf - delta)
	if Input.is_action_just_pressed("dash") and _dash_cd <= 0.0 and _dash_t <= 0.0:
		_dash_t = float(_cfg.dash_time)
		_dash_cd = float(_cfg.dash_cooldown)
	if Input.is_action_just_pressed("attack") and _attack_cd <= 0.0:
		_attack_cd = float(_cfg.attack_cooldown)
		attacking = float(_cfg.attack_time)
		attack_down = Input.is_action_pressed("move_down")
		slash_requested.emit(global_position, facing, attack_down, not is_on_floor())

	if _dash_t > 0.0:
		_dash_t -= delta
		velocity = Vector2(facing * float(_cfg.dash_speed), 0.0)
	else:
		var on_floor := is_on_floor()
		_coyote = float(_cfg.coyote) if on_floor else maxf(0.0, _coyote - delta)
		var accel := float(_cfg.accel_ground) if on_floor else float(_cfg.accel_air)
		velocity.x = move_toward(velocity.x, axis * float(_cfg.speed), accel * delta)
		var g := float(_cfg.gravity)
		if velocity.y > 0.0:
			g *= float(_cfg.fall_gravity_mult)
		velocity.y = minf(velocity.y + g * delta, float(_cfg.max_fall))
		if _jump_buf > 0.0 and _coyote > 0.0:
			velocity.y = float(_cfg.jump_velocity)
			_jump_buf = 0.0
			_coyote = 0.0
		if Input.is_action_just_released("jump") and velocity.y < 0.0:
			velocity.y *= float(_cfg.jump_cut)
	move_and_slide()


func _process(delta: float) -> void:
	_flash = maxf(0.0, _flash - delta * 4.0)
	_shake = move_toward(_shake, 0.0, 30.0 * delta)
	queue_redraw()


## Dal server: applica punti vita, stato di morte e (solo al proprietario) scossa.
func apply_stats(s: Dictionary) -> void:
	var new_hp := int(s["hp"])
	if new_hp < hp:
		_flash = 1.0
		_shake = 7.0
	hp = new_hp
	max_hp = int(s["max_hp"])
	dead = bool(s["dead"])


func teleport(pos: Vector2) -> void:
	global_position = pos
	velocity = Vector2.ZERO
	_dash_t = 0.0


func knock(dir: float) -> void:
	velocity = Vector2(dir * 260.0, -240.0)
	_knock_t = 0.18


func bounce() -> void:
	velocity.y = float(_cfg.pogo_velocity)
	_dash_t = 0.0


func _draw() -> void:
	var alpha := 0.3 if dead else 1.0
	var t := Time.get_ticks_msec() / 1000.0
	var moving := absf(velocity.x) > 20.0 and is_on_floor()
	var breathe := sin(t * (12.0 if moving else 2.5)) * (1.5 if moving else 0.8)
	var f := facing
	var cloak := Color(0.05, 0.05, 0.07, alpha).lerp(Color(1, 1, 1, alpha), _flash * 0.6)

	# Ombra a terra
	draw_circle(Vector2(0, 24), 14, Color(0, 0, 0, 0.35 * alpha))
	# Mantello con bordo colorato del giocatore
	var cape := PackedVector2Array([
		Vector2(-f * 4, -6 + breathe), Vector2(f * 4, -6 + breathe),
		Vector2(-f * 14, 22), Vector2(-f * 26, 16 + breathe),
	])
	draw_colored_polygon(cape, cloak)
	draw_polyline(PackedVector2Array([Vector2(-f * 14, 22), Vector2(-f * 26, 16 + breathe)]), Color(tint, alpha * 0.8), 2.0)
	# Corpo e testa
	draw_colored_polygon(PackedVector2Array([
		Vector2(-9, -4 + breathe), Vector2(9, -4 + breathe), Vector2(8, 20), Vector2(-8, 20),
	]), cloak)
	draw_circle(Vector2(0, -15 + breathe), 9.0, cloak)
	# Cappuccio a punta
	draw_colored_polygon(PackedVector2Array([
		Vector2(-10, -17 + breathe), Vector2(10, -17 + breathe), Vector2(f * 3, -29 + breathe),
	]), cloak)
	# Occhi luminosi, come nei cavalieri silhouette
	if not dead:
		var eye_c := Vector2(f * 3.0, -15 + breathe)
		draw_circle(eye_c + Vector2(-3, 0), 3.2, Color(tint, 0.25))
		draw_circle(eye_c + Vector2(3, 0), 3.2, Color(tint, 0.25))
		draw_circle(eye_c + Vector2(-3, 0), 1.6, Color(1, 1, 1, 0.95))
		draw_circle(eye_c + Vector2(3, 0), 1.6, Color(1, 1, 1, 0.95))

	# Arma: arco di colpo mentre attacca
	if attacking > 0.0:
		var k := attacking / 0.2
		var col := Color(1, 0.95, 0.8, 0.9 * k)
		if attack_down:
			draw_arc(Vector2(0, 30), 36.0, 0.25 * PI, 0.75 * PI, 16, col, 4.0)
		else:
			var base := 0.0 if f > 0.0 else PI
			draw_arc(Vector2(f * 30.0, -6.0), 40.0, base - 0.9, base + 0.9, 18, col, 4.0)

	# Nome del giocatore
	draw_string(ThemeDB.fallback_font, Vector2(-50, -44), player_name, HORIZONTAL_ALIGNMENT_CENTER, 100, 12, Color(tint, alpha))
