extends CharacterBody2D
## Cavaliere-Pulcinella giocabile. Il peer proprietario muove il personaggio e ne replica
## posizione e stato; ogni PC ricostruisce localmente pose, sciarpa, polvere e scie.

signal slash_requested(pos: Vector2, facing: float, down: bool, air: bool)

const HALF := Vector2(13, 24)
const GhostScript := preload("res://game/ghost.gd")
const SCARF_POINTS := 9
const SCARF_SEG := 6.5
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
var _scarf := PackedVector2Array()
var _scarf_prev := PackedVector2Array()


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

	_update_scarf(delta, v)
	_flash = maxf(0.0, _flash - delta * 4.0)
	_light.energy = 0.0 if dead else 0.55

	if _cam:
		# L'anticipo va sulla posizione (rispetta i limiti della stanza); la scossa sull'offset.
		_look = lerpf(_look, facing * 80.0, 1.0 - exp(-2.2 * delta))
		_cam.position = Vector2(_look, -40.0)
		var shake := _trauma * _trauma * 20.0
		_cam.offset = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)) * shake
		_trauma = maxf(0.0, _trauma - 1.7 * delta)
	queue_redraw()


func _update_scarf(delta: float, v: Vector2) -> void:
	var anchor := global_position + Vector2(-facing * 3.0, -2.0 * _squash.y)
	if _scarf.size() != SCARF_POINTS:
		_scarf.resize(SCARF_POINTS)
		_scarf_prev.resize(SCARF_POINTS)
		for i in SCARF_POINTS:
			_scarf[i] = anchor + Vector2(-facing * i * SCARF_SEG, 0)
			_scarf_prev[i] = _scarf[i]
	_scarf[0] = anchor
	var dt2 := delta * delta
	for i in range(1, SCARF_POINTS):
		var cur := _scarf[i]
		var vel := (cur - _scarf_prev[i]) * 0.9
		_scarf_prev[i] = cur
		var flutter := Vector2(sin(_t * 7.0 + i * 0.9) * 40.0, cos(_t * 5.0 + i) * 20.0)
		_scarf[i] = cur + vel + (Vector2(-v.x * 0.6, 300.0) + flutter) * dt2
	for _iter in 3:
		for i in range(1, SCARF_POINTS):
			var d := _scarf[i] - _scarf[i - 1]
			var l := d.length()
			if l > SCARF_SEG:
				_scarf[i] = _scarf[i - 1] + d / l * SCARF_SEG


func _spawn_ghost(parent: Node) -> void:
	var g = GhostScript.new()
	g.position = global_position  # fx_root sta all'origine del mondo
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
		"moving": absf(move_vel.x) > 30.0, "hat": _hat, "breathe": sin(_t * 2.6) * 0.8,
		"tint": tint, "alpha": alpha, "flash": _flash, "silhouette": silhouette, "dead": dead,
		"attack": atk, "attack_down": attack_down, "slash_side": slash_side,
	}


func _draw() -> void:
	var a := 0.35 if dead else 1.0
	var air := 0.0 if grounded else 1.0
	draw_colored_polygon(Art.ellipse(Vector2(0, HALF.y + 1.0), Vector2(15.0 - air * 5.0, 3.5), 16), Color(0, 0, 0, 0.35 * a * (1.0 - air * 0.6)))
	_draw_scarf(a)
	draw_figure(self, _pose(a, false))
	Art.text(self, Art.body_font(), Vector2(-70, -76), player_name, 17, Color(tint.lightened(0.2), 0.9 * a), HORIZONTAL_ALIGNMENT_CENTER, 140)


func _draw_scarf(alpha: float) -> void:
	if _scarf.size() != SCARF_POINTS:
		return
	var left := PackedVector2Array()
	var right := PackedVector2Array()
	var cols := PackedColorArray()
	for i in SCARF_POINTS:
		var p := to_local(_scarf[i])
		var nxt := to_local(_scarf[mini(i + 1, SCARF_POINTS - 1)])
		var prv := to_local(_scarf[maxi(i - 1, 0)])
		var dir := (nxt - prv).normalized()
		var n := Vector2(-dir.y, dir.x)
		var k := float(i) / float(SCARF_POINTS - 1)
		var w := lerpf(4.5, 1.2, k)
		left.append(p + n * w)
		right.append(p - n * w)
		cols.append(Color(tint.lerp(tint.darkened(0.55), k), alpha))
	# Triangoli singoli: la sciarpa può ripiegarsi su sé stessa e un poligono unico non si triangolerebbe.
	for i in SCARF_POINTS - 1:
		draw_primitive(PackedVector2Array([left[i], left[i + 1], right[i + 1]]), PackedColorArray([cols[i], cols[i + 1], cols[i + 1]]), PackedVector2Array())
		draw_primitive(PackedVector2Array([left[i], right[i + 1], right[i]]), PackedColorArray([cols[i], cols[i + 1], cols[i]]), PackedVector2Array())


## Disegna il cavaliere. È statica perché la usano anche le immagini residue dello scatto.
static func draw_figure(c: CanvasItem, p: Dictionary) -> void:
	var f: float = p["facing"]
	var sq: Vector2 = p["squash"]
	var alpha: float = p["alpha"]
	var flash: float = p["flash"]
	var tint: Color = p["tint"]
	var sil: bool = p["silhouette"]
	var grounded: bool = p["grounded"]
	var moving: bool = p["moving"]
	var run: float = p["run"]
	var vy: float = p["vy"]
	var hat: float = p["hat"]
	var breathe: float = p["breathe"]

	var ink := Color(0.06, 0.05, 0.08, alpha)
	var hi := Color(0.97, 0.95, 0.9, alpha)
	var lo := Color(0.6, 0.62, 0.74, alpha)
	var skin := Color(0.93, 0.8, 0.68, alpha)
	var steel := Color(0.86, 0.9, 0.98, alpha)
	if sil:
		ink = Color(tint, alpha)
		hi = ink
		lo = ink
		skin = ink
		steel = ink
	elif flash > 0.0:
		hi = hi.lerp(Color(1, 1, 1, alpha), flash)
		lo = lo.lerp(Color(1, 0.9, 0.9, alpha), flash)
		skin = skin.lerp(Color(1, 1, 1, alpha), flash)

	c.draw_set_transform(Vector2(0, HALF.y), 0.0, Vector2(f * sq.x, sq.y))

	# Gambe: ciclo di corsa, raccolte in aria, appoggiate da fermo.
	var l1: Vector2
	var l2: Vector2
	if not grounded:
		l1 = Vector2(-5, -4 if vy < 0.0 else -1)
		l2 = Vector2(6, -8 if vy < 0.0 else -3)
	elif moving:
		l1 = Vector2(sin(run) * 8.0, -maxf(0.0, cos(run)) * 5.0)
		l2 = Vector2(sin(run + PI) * 8.0, -maxf(0.0, cos(run + PI)) * 5.0)
	else:
		l1 = Vector2(-4, 0)
		l2 = Vector2(5, 0)
	var hip := Vector2(0, -12.0 + breathe * 0.3)
	for leg in [l2, l1]:
		var foot: Vector2 = leg
		c.draw_line(hip + Vector2(foot.x * 0.2, 0), foot + Vector2(0, -3), ink, 7.0, true)
		c.draw_line(hip + Vector2(foot.x * 0.2, 0), foot + Vector2(0, -3), lo, 4.5, true)
		c.draw_colored_polygon(Art.ellipse(foot + Vector2(1.5, -1.8), Vector2(4.2, 2.6), 10), ink)

	# Camicione bianco svasato, con orlo mosso dalla corsa.
	var sway := sin(run) * 1.5 if moving else 0.0
	var top_y := -31.0 + breathe
	var tunic := PackedVector2Array([
		Vector2(-7, top_y), Vector2(8, top_y), Vector2(12.5 + sway, -9), Vector2(6, -6.5),
		Vector2(0, -8.5), Vector2(-6, -6.5), Vector2(-12.5 + sway, -8.5),
	])
	var outline := tunic.duplicate()
	outline.append(tunic[0])
	c.draw_polyline(outline, ink, 3.2, true)
	c.draw_polygon(tunic, PackedColorArray([hi, hi, lo, lo, lo, lo, lo]))
	c.draw_line(Vector2(-9.5, -18.0 + breathe * 0.5), Vector2(10, -18.0 + breathe * 0.5), ink, 2.2, true)
	c.draw_circle(Vector2(4.5, -25.0 + breathe), 1.2, ink)
	c.draw_circle(Vector2(5.0, -21.5 + breathe), 1.2, ink)

	# Braccio e spada; durante l'attacco il braccio compie l'arco.
	var shoulder := Vector2(2.5, -27.0 + breathe)
	var atk: float = p["attack"]
	var hand: Vector2
	var blade_dir: Vector2
	if atk >= 0.0:
		if p["attack_down"]:
			hand = Vector2(4, -10)
			blade_dir = Vector2(0.15, 1.0).normalized()
		else:
			var side: float = p["slash_side"]
			var a := lerpf(-1.5 * side, 1.1 * side, ease(atk, 0.35))
			blade_dir = Vector2(cos(a), sin(a))
			hand = shoulder + blade_dir * 11.0
	else:
		hand = Vector2(8, -16.0 + breathe)
		blade_dir = Vector2(0.4, 0.92).normalized()
	c.draw_line(shoulder, hand, ink, 7.0, true)
	c.draw_line(shoulder, hand, lo, 4.5, true)
	var tip := hand + blade_dir * 25.0
	c.draw_line(hand, tip, ink, 4.2, true)
	c.draw_line(hand, tip, steel, 2.2, true)
	var guard := Vector2(-blade_dir.y, blade_dir.x) * 4.5
	c.draw_line(hand + guard, hand - guard, Color(Art.OCRA, alpha) if not sil else ink, 2.4, true)

	# Testa, maschera nera dal naso adunco e occhi luminosi.
	var head := Vector2(1.5, -38.0 + breathe)
	c.draw_circle(head, 9.8, ink)
	c.draw_circle(head, 8.5, skin)
	c.draw_colored_polygon(PackedVector2Array([
		head + Vector2(-9, -2.5), head + Vector2(-6.5, -8), head + Vector2(5, -8.5), head + Vector2(9.5, -4),
		head + Vector2(14, 1.5), head + Vector2(10.5, 3.5), head + Vector2(8, 1), head + Vector2(3, 1.5), head + Vector2(-8.5, 0.5),
	]), ink)
	if not p["dead"] and not sil:
		var eye := Color(1.0, 0.98, 0.92, alpha).lerp(Color(tint, alpha), 0.25)
		c.draw_circle(head + Vector2(5.2, -3.5), 3.4, Color(eye, 0.25 * alpha))
		c.draw_circle(head + Vector2(5.2, -3.5), 1.7, eye)
		c.draw_circle(head + Vector2(0.8, -3.5), 1.4, eye)

	# Coppolone: cono alto che si piega con il movimento (molla).
	var hb := head + Vector2(-1, -6.5)
	var htip := hb + Vector2(-4.0 + hat * 20.0, -25.0 + absf(hat) * 7.0)
	var hmid := hb.lerp(htip, 0.5) + Vector2(hat * 7.0, 0)
	var hat_pts := PackedVector2Array([hb + Vector2(-9.5, 1.5), hmid + Vector2(-5.5, 0), htip, hmid + Vector2(5.5, 0), hb + Vector2(9.5, 1.5)])
	var hat_line := hat_pts.duplicate()
	hat_line.append(hat_pts[0])
	c.draw_polyline(hat_line, ink, 3.0, true)
	c.draw_polygon(hat_pts, PackedColorArray([hi, hi, lo, lo, hi]))
	c.draw_line(hb + Vector2(-9.5, 1.5), hb + Vector2(9.5, 1.5), ink, 2.2, true)

	# Fendente: mezzaluna luminosa che svanisce.
	if atk >= 0.0 and not sil:
		var k := 1.0 - atk
		var inner := Color(1, 1, 1, 0.95 * k * alpha)
		var outer := Color(tint.lightened(0.4), 0.0)
		if p["attack_down"]:
			Art.crescent(c, Vector2(0, -6), 34.0, 18.0, 0.18 * PI, 0.82 * PI, inner, outer)
		else:
			var side2: float = p["slash_side"]
			var from := -1.35 * side2
			var to := lerpf(from, 1.15 * side2, ease(atk, 0.35))
			Art.crescent(c, Vector2(4, -24), 40.0, 20.0, minf(from, to), maxf(from, to), inner, outer)

	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


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
	_scarf.clear()
	if _cam:
		_cam.reset_smoothing()


func knock(dir: float) -> void:
	velocity = Vector2(dir * 280.0, -260.0)
	_knock_t = 0.2


func bounce() -> void:
	velocity.y = float(_cfg.pogo_velocity)
	_dash_t = 0.0
	_squash = Vector2(0.8, 1.25)
