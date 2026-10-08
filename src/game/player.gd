extends CharacterBody2D
## Cavaliere-Pulcinella giocabile: movimento, vita, camera e aspetto.
## L'aspetto è un CharRig (mesh deformabile, char_rig.gd): qui si scelgono pose, effetti e suoni.
## Danni, raccolta e stanze li decide il mondo (world.gd), che lo chiama per colpi e ripartenze.

signal slash_requested(pos: Vector2, facing: float, down: bool, air: bool)

const HALF := Vector2(13, 24)
## Altezza a schermo dalla punta del cappello ai piedi, in unità di mondo.
const FIGURE_HEIGHT := 84.0
## Maschera di collisione: 1 = muri e blocchi, 4 = mensole attraversabili.
const LEDGE_LAYER := 4
## Colore della sciarpa (rosso dipinto): serve alle scie dello scatto e al fendente.
const SCARF_COLOR := Color("#e8483f")
## Da dove arriva la luce se il tema dell'area non lo dice (in alto a sinistra, come nei dipinti).
const DEFAULT_LIGHT_DIR := Vector2(-0.55, -0.83)
## Quanto la tinta dell'area colora Ferruccio.
const AMBIENT_AMOUNT := 0.3
## Durata delle scie dello scatto e intervallo tra l'una e l'altra (secondi).
const GHOST_LIFE := 0.28
const GHOST_EVERY := 0.03

var hp := 5
var max_hp := 5
var dead := false
## Secondi di invulnerabilità rimasti dopo un colpo subito.
var iframes := 0.0
var world: Node

# Stato di movimento e animazione (il mondo li legge e, nei dialoghi, li azzera).
var facing := 1.0
var attacking := 0.0
var attack_down := false
var grounded := true
var dashing := false
var move_vel := Vector2.ZERO
var slash_side := 1.0

var _cfg: Dictionary = {}
var _coyote := 0.0
var _jump_buf := 0.0
var _dash_t := 0.0
var _dash_cd := 0.0
var _attack_cd := 0.0
var _knock_t := 0.0
var _drop_t := 0.0
var _air_jumps := 0
var _jump_held := false
var _skid_t := 0.0
## Tempo dall'inizio della capriola del doppio salto (< 0 = nessuna capriola in corso).
var _spin_t := -1.0
var _was_grounded := true

var _cam: Camera2D
var _light: PointLight2D
var _rig: CharRig
## Disegna il fendente davanti al personaggio (i figli si disegnano dopo il padre).
var _front: Node2D
var _trauma := 0.0
var _look := 0.0
var _t := 0.0
## Fase della corsa (rad), al passo con i piedi: vedi CharRig.run_rate.
var _run := 0.0
var _run_amount := 0.0
var _last_step := 0
## Schiacciamento extra (frazione d'altezza, < 0 schiaccia) che torna a zero da sé.
var _squash := 0.0
var _ghost_t := 0.0
var _flash := 0.0
# Il corpo si muove a passi di fisica; il disegno sta tra l'ultimo passo e il precedente, così
# anche a 120-144 Hz la figura scorre senza scatti (la fisica resta a 60 Hz).
var _prev_pos := Vector2.ZERO
var _cur_pos := Vector2.ZERO
var _shown := Vector2.ZERO


func setup(pos: Vector2) -> void:
	position = pos
	_prev_pos = pos
	_cur_pos = pos
	_cfg = Tuning.data.player
	max_hp = int(_cfg.max_hp)
	hp = max_hp
	_air_jumps = int(_cfg.get("air_jumps", 1))
	collision_layer = 2
	collision_mask = 1
	set_collision_mask_value(LEDGE_LAYER, true)

	var sh := RectangleShape2D.new()
	sh.size = HALF * 2.0
	var cs := CollisionShape2D.new()
	cs.shape = sh
	add_child(cs)


func _ready() -> void:
	_light = Art.point_light(self, Vector2(0, -10), Color(1.0, 0.93, 0.82), 0.55, 460.0)
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_rig = CharRig.new()
	_rig.height = FIGURE_HEIGHT
	_rig.position = Vector2(0, HALF.y)
	_rig.light_dir = DEFAULT_LIGHT_DIR
	add_child(_rig)
	_front = Node2D.new()
	_front.draw.connect(_draw_slash)
	add_child(_front)
	_cam = Camera2D.new()
	_cam.zoom = Vector2.ONE * Room.CAMERA_ZOOM
	_cam.position_smoothing_enabled = true
	_cam.position_smoothing_speed = 6.5
	add_child(_cam)
	_cam.make_current()
	if world and not world.room.is_empty():
		apply_room(world.room["size"])


## Limiti della camera alla stanza corrente.
func apply_room(size: Vector2) -> void:
	if _cam == null:
		return
	_cam.limit_left = 0
	_cam.limit_top = 0
	_cam.limit_right = int(size.x)
	_cam.limit_bottom = int(size.y)
	_cam.reset_smoothing()


## Tinta e luce dell'area (themes.gd: "ambient", "lamp", facoltativo "light_dir"): legano
## Ferruccio alla scena con la luce di taglio e il chiaroscuro del suo shader.
func apply_theme(th: Dictionary) -> void:
	if _rig == null:
		return
	_rig.ambient = th.get("ambient", Color.WHITE)
	_rig.light_color = Color(th.get("lamp", Color(1.0, 0.93, 0.8))).lerp(Color.WHITE, 0.35)
	_rig.ambient_amount = AMBIENT_AMOUNT
	var d: Vector2 = th.get("light_dir", DEFAULT_LIGHT_DIR)
	_rig.light_dir = d.normalized()


func add_trauma(amount: float) -> void:
	_trauma = minf(1.0, _trauma + amount)


# ---------------------------------------------------------------- Movimento

func _physics_process(delta: float) -> void:
	_prev_pos = global_position
	iframes = maxf(0.0, iframes - delta)
	if attacking > 0.0:
		attacking = maxf(0.0, attacking - delta)
	if dead:
		velocity = Vector2.ZERO
		move_vel = velocity
		move_and_slide()
		_cur_pos = global_position
		return

	_attack_cd = maxf(0.0, _attack_cd - delta)
	_dash_cd = maxf(0.0, _dash_cd - delta)
	_knock_t = maxf(0.0, _knock_t - delta)
	if _drop_t > 0.0:
		_drop_t -= delta
		if _drop_t <= 0.0:
			set_collision_mask_value(LEDGE_LAYER, true)

	var axis := 0.0 if _knock_t > 0.0 else Input.get_axis("move_left", "move_right")
	if axis != 0.0:
		facing = signf(axis)

	var jump_pressed := Input.is_action_just_pressed("jump")
	_jump_held = Input.is_action_pressed("jump")
	var want_drop := Input.is_action_pressed("move_down") and jump_pressed and is_on_floor()
	if want_drop:
		_drop_t = 0.25
		set_collision_mask_value(LEDGE_LAYER, false)
		jump_pressed = false
	elif jump_pressed:
		_jump_buf = float(_cfg.jump_buffer)
	else:
		_jump_buf = maxf(0.0, _jump_buf - delta)

	if Input.is_action_just_pressed("dash") and _dash_cd <= 0.0 and _dash_t <= 0.0:
		_dash_t = float(_cfg.dash_time)
		_dash_cd = float(_cfg.dash_cooldown)
		_spin_t = -1.0
		_sfx("scatto")
	if Input.is_action_just_pressed("attack") and _attack_cd <= 0.0:
		_attack_cd = float(_cfg.attack_cooldown)
		attacking = float(_cfg.attack_time)
		attack_down = Input.is_action_pressed("move_down") and not is_on_floor()
		slash_side = -slash_side
		slash_requested.emit(global_position, facing, attack_down, not is_on_floor())
		_sfx("fendente")

	var vy_before := velocity.y
	if _dash_t > 0.0:
		_dash_t -= delta
		velocity = Vector2(facing * float(_cfg.dash_speed), 0.0)
	else:
		var on_floor := is_on_floor()
		if on_floor:
			_air_jumps = int(_cfg.air_jumps)
		_coyote = float(_cfg.coyote) if on_floor else maxf(0.0, _coyote - delta)
		_move_horizontal(axis, on_floor, delta)
		_apply_gravity(on_floor, delta)
		if _jump_buf > 0.0 and _coyote > 0.0:
			_jump()
		elif jump_pressed and not on_floor and _air_jumps > 0:
			_double_jump()
		if Input.is_action_just_released("jump") and velocity.y < 0.0:
			velocity.y *= float(_cfg.jump_cut)
	move_and_slide()
	_cur_pos = global_position
	grounded = is_on_floor()
	dashing = _dash_t > 0.0
	move_vel = velocity
	if grounded and not _was_grounded:
		_land(vy_before)
	_was_grounded = grounded


## Corsa con una curva: da fermo spinge forte, vicino alla velocità piena addolcisce; a terra
## frena deciso e inverte ancora più deciso, con una breve scivolata e un po' di polvere.
func _move_horizontal(axis: float, on_floor: bool, delta: float) -> void:
	var speed := float(_cfg.speed)
	var target := axis * speed
	var turning := axis != 0.0 and absf(velocity.x) > 1.0 and signf(axis) != signf(velocity.x)
	var accel: float
	if on_floor:
		if axis == 0.0:
			accel = float(_cfg.decel_ground)
		elif turning:
			accel = float(_cfg.turn_accel)
		else:
			accel = float(_cfg.accel_ground)
	else:
		accel = float(_cfg.accel_air) if axis != 0.0 else float(_cfg.decel_air)
	var gap := clampf(absf(target - velocity.x) / speed, 0.0, 1.0)
	var curve := lerpf(float(_cfg.accel_curve), 1.0, gap)
	if on_floor and turning and absf(velocity.x) > float(_cfg.skid_speed) and _skid_t <= 0.0:
		_skid_t = float(_cfg.skid_time)
		_skid_fx()
	velocity.x = move_toward(velocity.x, target, accel * curve * delta)


## Gravità più leggera vicino all'apice se il salto è tenuto (si ha tempo di mirare l'atterraggio),
## più forte in caduta (il salto non galleggia).
func _apply_gravity(on_floor: bool, delta: float) -> void:
	var g := float(_cfg.gravity)
	if not on_floor and _jump_held and absf(velocity.y) < float(_cfg.apex_threshold):
		g *= float(_cfg.apex_gravity_mult)
	elif velocity.y > 0.0:
		g *= float(_cfg.fall_gravity_mult)
	velocity.y = minf(velocity.y + g * delta, float(_cfg.max_fall))


func _jump() -> void:
	velocity.y = float(_cfg.jump_velocity)
	_jump_buf = 0.0
	_coyote = 0.0
	_squash = 0.2
	Fx.dust(_fx_root(), global_position + Vector2(0, HALF.y), 5)
	_sfx("salto")


## Salto in aria: sbuffo di luce, piume e fili sotto i piedi, ginocchia raccolte e capriola.
func _double_jump() -> void:
	_air_jumps -= 1
	_jump_buf = 0.0
	velocity.y = float(_cfg.double_jump_velocity)
	_squash = 0.15
	_spin_t = 0.0
	var feet := global_position + Vector2(0, HALF.y)
	var root := _fx_root()
	Fx.ring(root, feet, Color(1.0, 0.92, 0.75, 0.85), 30.0, 0.3)
	Fx.particles(root, feet, Color(1.0, 0.95, 0.85, 0.9), {
		"texture": Art.streak_texture(), "amount": 10, "life": 0.45, "dir": Vector2.DOWN, "spread": 70.0,
		"vmin": 90.0, "vmax": 220.0, "damping": 260.0, "gravity": Vector2(0, 120), "smin": 0.25, "smax": 0.5,
		"align": true, "radius": 8.0,
	})
	Fx.particles(root, feet, Color(SCARF_COLOR.lightened(0.35), 0.8), {
		"amount": 6, "life": 0.9, "dir": Vector2.DOWN, "spread": 110.0, "vmin": 30.0, "vmax": 90.0,
		"damping": 60.0, "gravity": Vector2(0, 40), "smin": 0.08, "smax": 0.16, "radius": 10.0,
	})
	_sfx("doppio_salto")


## Atterraggio: schiacciamento e polvere in proporzione alla velocità di caduta.
func _land(vy: float) -> void:
	var from := float(_cfg.land_squash_speed)
	if vy < from * 0.5:
		return
	var k := clampf((vy - from) / maxf(float(_cfg.max_fall) - from, 1.0), 0.0, 1.0)
	_squash = -(0.08 + 0.2 * k)
	Fx.dust(_fx_root(), global_position + Vector2(0, HALF.y), 4 + int(10.0 * k))
	_sfx("atterraggio", lerpf(-8.0, 0.0, k))


func _skid_fx() -> void:
	Fx.dust(_fx_root(), global_position + Vector2(-facing * 4.0, HALF.y), 6, -facing)
	_sfx("passo")


# ---------------------------------------------------------------- Aspetto

func _process(delta: float) -> void:
	_t += delta
	var v := move_vel
	var fx_root := _fx_root()
	_squash *= exp(-11.0 * delta)
	_skid_t = maxf(0.0, _skid_t - delta)

	# Interpolazione del disegno tra gli ultimi due passi di fisica.
	_shown = _prev_pos.lerp(_cur_pos, Engine.get_physics_interpolation_fraction()) - global_position
	_rig.position = Vector2(0, HALF.y) + _shown
	_front.position = _shown

	# Corsa al passo con i piedi: la fase avanza di quanto serve perché il piede non scivoli.
	var speed := absf(v.x)
	var running := grounded and speed > 30.0 and not dashing and not dead
	var amount := clampf(speed / float(_cfg.speed), 0.35, 1.0) if running else 0.0
	_run_amount = lerpf(_run_amount, amount, 1.0 - exp(-10.0 * delta))
	if running:
		_run += delta * CharRig.run_rate(speed, _run_amount, FIGURE_HEIGHT) * float(_cfg.run_cadence)
		var step := CharRig.run_steps(_run)
		if step != _last_step:
			_last_step = step
			Fx.dust(fx_root, global_position + Vector2(facing * 6.0, HALF.y), 2, -facing)
			_sfx("passo", lerpf(-6.0, 0.0, _run_amount))

	_update_spin(delta)
	_rig.set_target(_pose(running))
	_rig.facing = facing
	_rig.flash = _flash
	_rig.modulate.a = 0.35 if dead else 1.0
	_rig.advance(delta, v)

	if dashing and not dead:
		_ghost_t -= delta
		if _ghost_t <= 0.0:
			_ghost_t = GHOST_EVERY
			_spawn_ghost(fx_root)

	_flash = maxf(0.0, _flash - delta * 4.0)
	_light.energy = 0.0 if dead else 0.55

	if _cam:
		# L'anticipo va sulla posizione (rispetta i limiti della stanza); la scossa sull'offset.
		_look = lerpf(_look, facing * 80.0, 1.0 - exp(-2.2 * delta))
		_cam.position = Vector2(_look, -40.0) + _shown
		var shake := _trauma * _trauma * 20.0
		_cam.offset = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)) * shake
		_trauma = maxf(0.0, _trauma - 1.7 * delta)
	queue_redraw()
	_front.queue_redraw()


## La posa obiettivo del momento; il rig la raggiunge sfumando (mai salti da una posa all'altra).
func _pose(running: bool) -> Dictionary:
	var pose: Dictionary
	if dead:
		pose = CharRig.pose_dead()
	elif dashing:
		pose = CharRig.pose_dash()
	elif _spin_t >= 0.0:
		pose = CharRig.pose_double_jump()
	elif not grounded:
		pose = CharRig.pose_air(move_vel.y)
	elif _skid_t > 0.0:
		pose = CharRig.pose_skid()
	elif running:
		pose = CharRig.pose_run(_run, _run_amount)
	else:
		pose = CharRig.pose_idle(_t)
	if attacking > 0.0 and not dead:
		var k := 1.0 - attacking / float(_cfg.attack_time)
		pose.merge(CharRig.pose_slash_down(k) if attack_down else CharRig.pose_slash(k, slash_side), true)
	pose["squash"] = float(pose.get("squash", 0.0)) + _squash
	return pose


## Capriola del doppio salto: un giro (o quanti ne dice il tuning) con partenza e arrivo dolci;
## se si tocca terra prima, finisce in fretta invece di scattare dritto.
func _update_spin(delta: float) -> void:
	if _spin_t < 0.0:
		_rig.spin = 0.0
		return
	var dur := float(_cfg.double_jump_spin_time)
	_spin_t += delta * (4.0 if grounded else 1.0)
	var t := clampf(_spin_t / dur, 0.0, 1.0)
	_rig.spin = TAU * float(_cfg.double_jump_spin) * t * t * (3.0 - 2.0 * t)
	if t >= 1.0:
		_spin_t = -1.0
		_rig.spin = 0.0


func _spawn_ghost(parent: Node) -> void:
	var g := _rig.make_ghost(SCARF_COLOR)
	g.position = _rig.global_position  # fx_root sta all'origine del mondo
	g.modulate.a = 0.55
	parent.add_child(g)
	var tw := g.create_tween()
	tw.tween_property(g, "modulate:a", 0.0, GHOST_LIFE)
	tw.tween_callback(g.queue_free)


func _fx_root() -> Node:
	return world.fx_root if world else get_parent()


## Punto unico per i suoni: li suona l'autoload Audio quando c'è (nomi in src/data/audio.json);
## [param db] si somma al volume configurato.
func _sfx(sound: String, db := 0.0) -> void:
	var audio := get_node_or_null("/root/Audio")
	if audio and audio.has_method("sfx"):
		audio.call("sfx", sound, db)


func _draw() -> void:
	var a := 0.35 if dead else 1.0
	var air := 0.0 if grounded else 1.0
	draw_colored_polygon(Art.ellipse(Vector2(0, HALF.y + 1.0) + _shown, Vector2(15.0 - air * 5.0, 3.5), 16), Color(0, 0, 0, 0.35 * a * (1.0 - air * 0.6)))


## Fendente: mezzaluna luminosa che svanisce, davanti al personaggio.
func _draw_slash() -> void:
	if attacking <= 0.0 or dead:
		return
	var atk := 1.0 - attacking / float(_cfg.attack_time)
	var k := 1.0 - atk
	var inner := Color(1, 1, 1, 0.95 * k)
	var outer := Color(SCARF_COLOR.lightened(0.4), 0.0)
	_front.draw_set_transform(Vector2(0, HALF.y), 0.0, Vector2(facing, 1.0))
	if attack_down:
		Art.crescent(_front, Vector2(0, -6), 38.0, 20.0, 0.18 * PI, 0.82 * PI, inner, outer)
	else:
		var from := -1.35 * slash_side
		var to := lerpf(from, 1.15 * slash_side, ease(atk, 0.35))
		Art.crescent(_front, Vector2(6, -36), 46.0, 22.0, minf(from, to), maxf(from, to), inner, outer)
	_front.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


# ---------------------------------------------------------------- Comandi dal mondo

## Toglie punti vita; a zero Ferruccio cade. Lampo bianco e scossa di camera.
func take_damage(dmg: int) -> void:
	hp = maxi(0, hp - dmg)
	dead = hp <= 0
	_flash = 1.0
	add_trauma(0.55)
	_sfx("ferito")


## Restituisce punti vita (mozzarella), senza superare il massimo.
func heal(amount: int) -> void:
	hp = mini(max_hp, hp + amount)


## Dopo la caduta: vita piena e nessuna invulnerabilità residua.
func revive() -> void:
	dead = false
	hp = max_hp
	iframes = 0.0


func teleport(pos: Vector2) -> void:
	global_position = pos
	velocity = Vector2.ZERO
	move_vel = Vector2.ZERO
	_dash_t = 0.0
	_spin_t = -1.0
	_prev_pos = pos
	_cur_pos = pos
	_shown = Vector2.ZERO
	reset_physics_interpolation()
	if _cam:
		_cam.reset_smoothing()


func knock(dir: float) -> void:
	velocity = Vector2(dir * 280.0, -260.0)
	_knock_t = 0.2


## Rimbalzo sul nemico colpito dall'alto (pogo): come in Hollow Knight ridà il salto in aria.
func bounce() -> void:
	velocity.y = float(_cfg.pogo_velocity)
	_dash_t = 0.0
	_spin_t = -1.0
	_squash = 0.2
	_air_jumps = int(_cfg.air_jumps)
