extends CharacterBody2D
## Cavaliere-Pulcinella giocabile. Il peer proprietario muove il personaggio e ne replica
## posizione e stato; ogni PC ricostruisce localmente pose, sciarpa, polvere e scie.

signal slash_requested(pos: Vector2, facing: float, down: bool, air: bool)

const HALF := Vector2(13, 24)
const GhostScript := preload("res://game/ghost.gd")
const SPRITE_SHADER := preload("res://game/shaders/canvas_char_sprite.gdshader")

## Pupazzo dipinto: pezzi prodotti da tools/art/rig_ferruccio.py, tutti sulla stessa tela 679x1024.
const RIG_BODY := preload("res://assets/art/characters/ferruccio_rig/corpo.png")
const RIG_SWORD := preload("res://assets/art/characters/ferruccio_rig/spada.png")
const RIG_LEG_FRONT := preload("res://assets/art/characters/ferruccio_rig/gamba_avanti.png")
const RIG_LEG_BACK := preload("res://assets/art/characters/ferruccio_rig/gamba_dietro.png")
## Altezza a schermo dalla punta del cappello ai piedi, in unità di mondo.
const RIG_HEIGHT := 84.0
## Perni in pixel della tela: punto tra i piedi, anche delle due gambe, polso della spada.
const RIG_FEET := Vector2(368, 1012)
const RIG_HIP_FRONT := Vector2(330, 790)
const RIG_HIP_BACK := Vector2(388, 790)
const RIG_WRIST := Vector2(368, 648)
## Distanza anca-piede in pixel: serve ad abbassare il corpo quando le gambe si aprono.
const RIG_LEG_LEN := 225.0
const RIG_SCALE := RIG_HEIGHT / 1004.0
## Ampiezza dell'oscillazione delle gambe nella corsa (radianti).
const RUN_SWING := 0.55
## Maschera di collisione: 1 = muri e blocchi, 4 = mensole attraversabili.
const LEDGE_LAYER := 4

var peer_id := 1
var player_name := ""
var tint := Color.WHITE
var hp := 5
var max_hp := 5
var dead := false
var world: Node

# Replicati dal proprietario.
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

var _cam: Camera2D
var _light: PointLight2D
var _trauma := 0.0
var _look := 0.0
var _t := 0.0
var _run := 0.0
var _squash := Vector2.ONE
var _was_grounded := true
var _prev_vy := 0.0
var _dust_t := 0.0
var _ghost_t := 0.0
var _hat := 0.0
var _hat_v := 0.0
var _flash := 0.0
var _mat: ShaderMaterial


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
	set_collision_mask_value(LEDGE_LAYER, true)

	var sh := RectangleShape2D.new()
	sh.size = HALF * 2.0
	var cs := CollisionShape2D.new()
	cs.shape = sh
	add_child(cs)

	var sync := MultiplayerSynchronizer.new()
	# Nome fisso: il percorso del nodo deve essere identico su tutti i PC.
	sync.name = "Sync"
	sync.set_multiplayer_authority(peer_id)
	var cfg := SceneReplicationConfig.new()
	for prop in [":position", ":facing", ":attacking", ":attack_down", ":grounded", ":dashing", ":move_vel", ":slash_side"]:
		cfg.add_property(NodePath(prop))
	sync.replication_config = cfg
	add_child(sync)
	add_to_group("players")


func _ready() -> void:
	_light = Art.point_light(self, Vector2(0, -10), Color(1.0, 0.93, 0.82), 0.55, 460.0)
	# La sciarpa dipinta prende il colore del giocatore; il lampo bianco segnala i colpi subiti.
	_mat = ShaderMaterial.new()
	_mat.shader = SPRITE_SHADER
	_mat.set_shader_parameter("scarf_color", tint)
	_mat.set_shader_parameter("scarf_amount", 1.0)
	material = _mat
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	if is_multiplayer_authority():
		_cam = Camera2D.new()
		_cam.zoom = Vector2.ONE * Room.CAMERA_ZOOM
		_cam.position_smoothing_enabled = true
		_cam.position_smoothing_speed = 6.5
		add_child(_cam)
		_cam.make_current()
		if world and not world.room.is_empty():
			apply_room(world.room["size"])


## Limiti della camera alla stanza corrente (solo per il proprio personaggio).
func apply_room(size: Vector2) -> void:
	if _cam == null:
		return
	_cam.limit_left = 0
	_cam.limit_top = 0
	_cam.limit_right = int(size.x)
	_cam.limit_bottom = int(size.y)
	_cam.reset_smoothing()


func add_trauma(amount: float) -> void:
	_trauma = minf(1.0, _trauma + amount)


# ---------------------------------------------------------------- Movimento (solo proprietario)

func _physics_process(delta: float) -> void:
	if not is_multiplayer_authority():
		return
	if attacking > 0.0:
		attacking = maxf(0.0, attacking - delta)
	if dead:
		velocity = Vector2.ZERO
		move_vel = velocity
		move_and_slide()
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

	var want_drop := Input.is_action_pressed("move_down") and Input.is_action_just_pressed("jump") and is_on_floor()
	if want_drop:
		_drop_t = 0.25
		set_collision_mask_value(LEDGE_LAYER, false)
	elif Input.is_action_just_pressed("jump"):
		_jump_buf = float(_cfg.jump_buffer)
	else:
		_jump_buf = maxf(0.0, _jump_buf - delta)

	if Input.is_action_just_pressed("dash") and _dash_cd <= 0.0 and _dash_t <= 0.0:
		_dash_t = float(_cfg.dash_time)
		_dash_cd = float(_cfg.dash_cooldown)
	if Input.is_action_just_pressed("attack") and _attack_cd <= 0.0:
		_attack_cd = float(_cfg.attack_cooldown)
		attacking = float(_cfg.attack_time)
		attack_down = Input.is_action_pressed("move_down") and not is_on_floor()
		slash_side = -slash_side
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
	grounded = is_on_floor()
	dashing = _dash_t > 0.0
	move_vel = velocity


# ---------------------------------------------------------------- Aspetto (tutti i PC)

func _process(delta: float) -> void:
	_t += delta
	var v := move_vel
	var fx_root: Node = world.fx_root if world else get_parent()

	if grounded and not _was_grounded:
		if _prev_vy > 380.0:
			_squash = Vector2(1.3, 0.74)
			Fx.dust(fx_root, global_position + Vector2(0, HALF.y), 12)
	elif not grounded and _was_grounded and v.y < -150.0:
		_squash = Vector2(0.78, 1.26)
	if dashing:
		_squash = Vector2(1.22, 0.86)
	_was_grounded = grounded
	_prev_vy = v.y
	_squash = _squash.lerp(Vector2.ONE, 1.0 - exp(-11.0 * delta))

	if grounded and absf(v.x) > 30.0:
		_run += delta * absf(v.x) * 0.048
		_dust_t -= delta
		if _dust_t <= 0.0:
			_dust_t = 0.22
			Fx.dust(fx_root, global_position + Vector2(-facing * 6.0, HALF.y), 3, -facing)

	var target := clampf(-v.x * 0.0011 + v.y * 0.0006 * -facing, -0.65, 0.65)
	_hat_v += (target - _hat) * 140.0 * delta
	_hat_v *= exp(-7.5 * delta)
	_hat += _hat_v * delta

	if dashing and not dead:
		_ghost_t -= delta
		if _ghost_t <= 0.0:
			_ghost_t = 0.03
			_spawn_ghost(fx_root)

	_flash = maxf(0.0, _flash - delta * 4.0)
	_mat.set_shader_parameter("flash", _flash)
	_light.energy = 0.0 if dead else 0.55

	if _cam:
		# L'anticipo va sulla posizione (rispetta i limiti della stanza); la scossa sull'offset.
		_look = lerpf(_look, facing * 80.0, 1.0 - exp(-2.2 * delta))
		_cam.position = Vector2(_look, -40.0)
		var shake := _trauma * _trauma * 20.0
		_cam.offset = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)) * shake
		_trauma = maxf(0.0, _trauma - 1.7 * delta)
	queue_redraw()


func _spawn_ghost(parent: Node) -> void:
	var g = GhostScript.new()
	g.position = global_position  # fx_root sta all'origine del mondo
	g.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	var pose := _pose(0.55, true)
	g.painter = func(c: CanvasItem) -> void: draw_figure(c, pose)
	parent.add_child(g)


func _pose(alpha: float, silhouette: bool) -> Dictionary:
	var atk := -1.0
	var atk_time := float(_cfg.get("attack_time", 0.2))
	if attacking > 0.0:
		atk = 1.0 - attacking / atk_time
	return {
		"facing": facing, "squash": _squash, "run": _run, "grounded": grounded, "vy": move_vel.y,
		"moving": absf(move_vel.x) > 30.0, "dashing": dashing, "hat": _hat, "breathe": sin(_t * 2.6),
		"tint": tint, "alpha": alpha, "silhouette": silhouette, "dead": dead,
		"attack": atk, "attack_down": attack_down, "slash_side": slash_side,
	}


func _draw() -> void:
	var a := 0.35 if dead else 1.0
	var air := 0.0 if grounded else 1.0
	draw_colored_polygon(Art.ellipse(Vector2(0, HALF.y + 1.0), Vector2(15.0 - air * 5.0, 3.5), 16), Color(0, 0, 0, 0.35 * a * (1.0 - air * 0.6)))
	draw_figure(self, _pose(a, false))
	Art.text(self, Art.body_font(), Vector2(-70, -HALF.y - RIG_HEIGHT * 0.5 - 22.0), player_name, 17, Color(tint.lightened(0.2), 0.9 * a), HORIZONTAL_ALIGNMENT_CENTER, 140)


## Disegna Ferruccio con i pezzi dipinti (corpo, spada, due gambe) ruotati e spostati in base
## alla posa. È statica perché la usano anche le immagini residue dello scatto (silhouette).
static func draw_figure(c: CanvasItem, p: Dictionary) -> void:
	var f: float = p["facing"]
	var sq: Vector2 = p["squash"]
	var alpha: float = p["alpha"]
	var sil: bool = p["silhouette"]
	var mod := Color(p["tint"], alpha) if sil else Color(1, 1, 1, alpha)
	var run: float = p["run"]
	var vy: float = p["vy"]
	var atk: float = p["attack"]
	var breathe: float = p["breathe"]

	# Angoli in radianti nello spazio dell'immagine (rivolta a destra): negativo = in avanti/in alto.
	var lean := 0.0
	var bob := 0.0
	var leg_front := 0.0
	var leg_back := 0.0
	var sword := breathe * 0.03
	var stretch := 1.0 + breathe * 0.008
	if p["dead"]:
		lean = -1.45
	elif p["dashing"]:
		lean = 0.3
		leg_front = -0.7
		leg_back = 0.75
		sword = 0.55
	elif not p["grounded"]:
		leg_front = -0.55 if vy < 0.0 else -0.25
		leg_back = 0.35 if vy < 0.0 else 0.18
		lean = 0.05 if vy < 0.0 else -0.04
		sword = -0.18 if vy < 0.0 else 0.12
	elif p["moving"]:
		var s := sin(run)
		leg_front = -s * RUN_SWING
		leg_back = s * RUN_SWING
		# Il corpo scende quando le gambe sono aperte, così il piede d'appoggio tocca terra.
		bob = RIG_LEG_LEN * (1.0 - cos(RUN_SWING * s))
		lean = 0.16
		sword = 0.14 * s
		stretch = 1.0
	# Ritardo elastico (molla calcolata in _process): il corpo oscilla quando parte o si ferma.
	lean += float(p["hat"]) * 0.22 * f

	if atk >= 0.0:
		if p["attack_down"]:
			sword = 0.95
			leg_front = -0.8
			leg_back = -0.35
		else:
			var side: float = p["slash_side"]
			var from := -2.3 if side > 0.0 else 0.9
			var to := 0.7 if side > 0.0 else -2.0
			sword = lerpf(from, to, ease(atk, 0.35))
			lean += 0.12 * (1.0 - atk)

	var base := Transform2D(lean * f, Vector2(f * sq.x, sq.y * stretch) * RIG_SCALE, 0.0, Vector2(0, HALF.y)) \
		* Transform2D(0.0, Vector2.ONE, 0.0, -RIG_FEET + Vector2(0, bob))
	var dim := Color(0.78, 0.78, 0.84, 1.0) if not sil else Color(1, 1, 1, 1)
	_part(c, base, RIG_LEG_BACK, RIG_HIP_BACK, leg_back, mod * dim)
	_part(c, base, RIG_LEG_FRONT, RIG_HIP_FRONT, leg_front, mod)
	_part(c, base, RIG_BODY, Vector2.ZERO, 0.0, mod)
	_part(c, base, RIG_SWORD, RIG_WRIST, sword, mod)
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

	# Fendente: mezzaluna luminosa che svanisce.
	if atk >= 0.0 and not sil:
		var tint: Color = p["tint"]
		var k := 1.0 - atk
		var inner := Color(1, 1, 1, 0.95 * k * alpha)
		var outer := Color(tint.lightened(0.4), 0.0)
		c.draw_set_transform(Vector2(0, HALF.y), 0.0, Vector2(f * sq.x, sq.y))
		if p["attack_down"]:
			Art.crescent(c, Vector2(0, -6), 38.0, 20.0, 0.18 * PI, 0.82 * PI, inner, outer)
		else:
			var side2: float = p["slash_side"]
			var from2 := -1.35 * side2
			var to2 := lerpf(from2, 1.15 * side2, ease(atk, 0.35))
			Art.crescent(c, Vector2(6, -36), 46.0, 22.0, minf(from2, to2), maxf(from2, to2), inner, outer)
		c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


## Un pezzo del pupazzo ruotato attorno al suo perno (coordinate in pixel dell'immagine).
static func _part(c: CanvasItem, base: Transform2D, tex: Texture2D, pivot: Vector2, angle: float, mod: Color) -> void:
	var local := Transform2D(angle, Vector2.ONE, 0.0, pivot) * Transform2D(0.0, Vector2.ONE, 0.0, -pivot)
	c.draw_set_transform_matrix(base * local)
	c.draw_texture(tex, Vector2.ZERO, mod)


# ---------------------------------------------------------------- Comandi dal server

## Dal server: punti vita e stato di morte. Al proprietario fa anche tremare lo schermo.
func apply_stats(s: Dictionary) -> void:
	var new_hp := int(s["hp"])
	if new_hp < hp:
		_flash = 1.0
		add_trauma(0.55)
	hp = new_hp
	max_hp = int(s["max_hp"])
	dead = bool(s["dead"])


func teleport(pos: Vector2) -> void:
	global_position = pos
	velocity = Vector2.ZERO
	move_vel = Vector2.ZERO
	_dash_t = 0.0
	if _cam:
		_cam.reset_smoothing()


func knock(dir: float) -> void:
	velocity = Vector2(dir * 280.0, -260.0)
	_knock_t = 0.2


func bounce() -> void:
	velocity.y = float(_cfg.pogo_velocity)
	_dash_t = 0.0
	_squash = Vector2(0.8, 1.25)
