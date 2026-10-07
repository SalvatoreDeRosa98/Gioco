extends CharacterBody2D
## Nemico. Solo l'host esegue l'IA e applica i danni; posizione, velocità, vita e stato di
## animazione sono replicati ai client, che ricostruiscono l'aspetto localmente.

const GRAVITY := 1500.0
## Mensole attraversabili (vedi player.gd): anche i nemici ci camminano sopra.
const LEDGE_LAYER := 4

var kind := "gatto"
var hp := 3           # replicato
var max_hp := 3
var half := Vector2(20, 14)
var speed := 70.0
var damage := 1
var coins := 2
var flash := 0.0      # replicato
var facing := 1.0     # replicato
var anim := "idle"    # replicato
var touch_cd: Dictionary = {}
var world: Node

var _t := 0.0
var _dir := 1.0
var _shoot_cd := 1.5
var _state := "walk"
var _state_t := 1.5
var _airborne := false
var _look_t := 0.0
var _last_anim := ""
var _anim_start := 0.0


func setup(d: Dictionary, w: Node) -> void:
	kind = str(d["type"])
	var cfg: Dictionary = Tuning.data.enemies[kind]
	var override_hp := int(d["hp"])
	hp = override_hp if override_hp > 0 else int(cfg["hp"])
	max_hp = hp
	speed = float(cfg["speed"])
	damage = int(cfg["damage"])
	coins = int(cfg["coins"])
	world = w
	position = d["pos"]
	_shoot_cd = float(cfg.get("fire_every", 2.0)) * 0.6
	_t = randf() * 10.0
	half = _half_for(kind)
	collision_layer = 0
	collision_mask = 1
	set_collision_mask_value(LEDGE_LAYER, true)
	set_multiplayer_authority(1)

	var sh := RectangleShape2D.new()
	sh.size = half * 2.0
	var cs := CollisionShape2D.new()
	cs.shape = sh
	add_child(cs)

	var sync := MultiplayerSynchronizer.new()
	# Nome fisso: il percorso del nodo deve essere identico su tutti i PC.
	sync.name = "Sync"
	sync.set_multiplayer_authority(1)
	var rep := SceneReplicationConfig.new()
	for prop in [":position", ":velocity", ":flash", ":facing", ":hp", ":anim"]:
		rep.add_property(NodePath(prop))
	sync.replication_config = rep
	add_child(sync)
	add_to_group("enemies")
	if kind == "custode":
		Art.point_light(self, Vector2(0, -20), Color(1.0, 0.7, 0.35), 0.7, 520.0)


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


# ---------------------------------------------------------------- IA (solo host)

func _physics_process(delta: float) -> void:
	flash = maxf(0.0, flash - delta * 5.0)
	if not multiplayer.is_server():
		return
	for k in touch_cd.keys():
		touch_cd[k] = maxf(0.0, float(touch_cd[k]) - delta)
	match kind:
		"vespa":
			_ai_vespa(delta)
		"statua":
			_ai_statua(delta)
		"custode":
			_ai_custode(delta)
		_:
			_ai_gatto(delta)
	move_and_slide()


## Camminatore: gira davanti ai muri e ai precipizi.
func _ai_gatto(delta: float) -> void:
	velocity.y = minf(velocity.y + GRAVITY * delta, 900.0)
	velocity.x = _dir * speed
	var ahead := global_position + Vector2(_dir * (half.x + 6.0), half.y + 6.0)
	if is_on_wall() or (is_on_floor() and not world.is_ground(ahead)):
		_dir = -_dir
	facing = _dir
	anim = "walk"


## Volatile: insegue quando è vicino, altrimenti pattuglia in orizzontale.
func _ai_vespa(delta: float) -> void:
	var target: Node2D = world.nearest_alive_player(global_position)
	var w := 1.0 - exp(-3.0 * delta)
	if target and global_position.distance_to(target.global_position) < 460.0:
		var to: Vector2 = target.global_position + Vector2(0, -20) - global_position
		velocity = velocity.lerp(to.normalized() * speed, w)
		anim = "chase"
	else:
		velocity = velocity.lerp(Vector2(_dir * speed * 0.5, sin(_t * 2.2) * 60.0), w)
		var size: Vector2 = world.room["size"]
		if position.x < 140.0 or position.x > size.x - 140.0:
			_dir = -_dir
		anim = "idle"
	_t += delta
	if absf(velocity.x) > 5.0:
		facing = signf(velocity.x)


## Statua: ferma, guarda il giocatore più vicino, si carica e spara in orizzontale.
func _ai_statua(delta: float) -> void:
	velocity.y = minf(velocity.y + GRAVITY * delta, 900.0)
	velocity.x = 0.0
	var target: Node2D = world.nearest_alive_player(global_position)
	if target and absf(target.global_position.x - global_position.x) > 4.0:
		facing = signf(target.global_position.x - global_position.x)
	_shoot_cd -= delta
	anim = "charge" if _shoot_cd < 0.6 else "idle"
	if _shoot_cd <= 0.0:
		var cfg: Dictionary = Tuning.data.enemies.statua
		_shoot_cd = float(cfg.fire_every)
		world.enemy_fire(global_position + Vector2(facing * 26.0, -40.0), Vector2(facing, 0.0), float(cfg.bullet_speed), Color(0.6, 0.85, 1.0))


## Boss: cammina verso il giocatore, poi alterna balzo con onda d'urto e raffica radiale.
func _ai_custode(delta: float) -> void:
	velocity.y = minf(velocity.y + GRAVITY * delta, 1000.0)
	var target: Node2D = world.nearest_alive_player(global_position)
	if target and absf(target.global_position.x - global_position.x) > 4.0 and _state == "walk":
		facing = signf(target.global_position.x - global_position.x)
	_state_t -= delta
	match _state:
		"walk":
			velocity.x = facing * speed
			anim = "walk"
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
				_state = "walk"
				_state_t = 1.6
				velocity.x = 0.0
		"burst":
			velocity.x = 0.0
			anim = "burst"
			if _state_t <= 0.0:
				world.enemy_burst(global_position + Vector2(0, -40.0), 10)
				_state = "walk"
				_state_t = 2.2


func take_hit(dmg: int) -> bool:
	hp -= dmg
	flash = 1.0
	if hp <= 0:
		queue_free()
		return true
	return false


# ---------------------------------------------------------------- Aspetto (tutti i PC)

func _process(delta: float) -> void:
	_look_t += delta
	if anim != _last_anim:
		_last_anim = anim
		_anim_start = _look_t
	queue_redraw()


## Avanzamento 0..1 dell'animazione corrente (calcolato localmente: funziona anche sui client).
func _anim_progress(duration: float) -> float:
	return clampf((_look_t - _anim_start) / duration, 0.0, 1.0)


func _draw() -> void:
	var white := Color(1, 1, 1)
	draw_colored_polygon(Art.ellipse(Vector2(0, half.y + 1.0), Vector2(half.x * 0.9, 4.0), 16), Color(0, 0, 0, 0.32))
	match kind:
		"vespa":
			_draw_vespa(white)
		"statua":
			_draw_statua(white)
		"custode":
			_draw_custode(white)
		_:
			_draw_gatto(white)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	if kind != "custode" and hp < max_hp and hp > 0:
		var w := half.x * 2.0
		draw_rect(Rect2(-w * 0.5, -half.y - 16.0, w, 3), Color(0, 0, 0, 0.6))
		draw_rect(Rect2(-w * 0.5, -half.y - 16.0, w * float(hp) / float(max_hp), 3), Art.enemy_color(kind))


func _eyes(at: Vector2, gap: float, r: float, glow: Color) -> void:
	for dx in [-gap, gap]:
		draw_circle(at + Vector2(dx, 0), r * 2.6, Color(glow, 0.22))
		draw_circle(at + Vector2(dx, 0), r, glow.lightened(0.3))


func _draw_gatto(white: Color) -> void:
	var t := _look_t
	var moving := absf(velocity.x) > 10.0
	var ph := t * 15.0
	var body := Color(0.08, 0.06, 0.11).lerp(white, flash)
	var rim := Color(0.62, 0.48, 0.95, 0.75)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2(facing, 1.0))
	var tail := PackedVector2Array()
	for k in 9:
		var u := float(k) / 8.0
		tail.append(Vector2(-17.0 - u * 16.0, -4.0 - u * 20.0 + sin(t * 4.0 + u * 3.0) * 5.0 * u))
	draw_polyline(tail, body, 4.0, true)
	for i in 4:
		var lx: float = [-13.0, -7.0, 7.0, 13.0][i]
		var swing := sin(ph + i * PI * 0.5) * 4.5 if moving else 0.0
		draw_line(Vector2(lx, 2), Vector2(lx + swing, 14), body, 3.6, true)
	var arch := sin(ph) * 1.0 if moving else sin(t * 2.0) * 0.6
	var back := PackedVector2Array([
		Vector2(-19, 3), Vector2(-17, -8), Vector2(-7, -14 + arch), Vector2(7, -12), Vector2(16, -6), Vector2(16, 4), Vector2(-15, 6),
	])
	draw_colored_polygon(back, body)
	draw_polyline(PackedVector2Array([Vector2(-17, -8), Vector2(-7, -14 + arch), Vector2(7, -12)]), rim, 1.8, true)
	var head := Vector2(19, -10)
	draw_circle(head, 8.5, body)
	draw_colored_polygon(PackedVector2Array([head + Vector2(-7, -4), head + Vector2(-4, -15), head + Vector2(0, -6)]), body)
	draw_colored_polygon(PackedVector2Array([head + Vector2(1, -6), head + Vector2(5, -15), head + Vector2(8, -3)]), body)
	draw_arc(head, 8.5, PI * 1.1, PI * 1.6, 8, rim, 1.6)
	_eyes(head + Vector2(4, -1), 2.6, 1.8, Color(0.85, 0.7, 1.0))


func _draw_vespa(white: Color) -> void:
	var t := _look_t
	var gold := Color(0.95, 0.7, 0.18).lerp(white, flash)
	var ink := Color(0.1, 0.07, 0.04)
	draw_set_transform(Vector2(0, sin(t * 3.0) * 3.0), 0.0, Vector2(facing, 1.0))
	var flap := sin(t * 70.0)
	var wing := Color(0.85, 0.92, 1.0, 0.32)
	draw_colored_polygon(Art.ellipse(Vector2(-2, -14 - flap * 3.0), Vector2(13, 5.0 + flap * 2.5), 14), wing)
	draw_colored_polygon(Art.ellipse(Vector2(5, -13 + flap * 3.0), Vector2(11, 4.0 - flap * 2.0), 14), Color(wing, 0.22))
	for k in 3:
		draw_line(Vector2(2 + k * 4, 4), Vector2(-2 + k * 5, 14 + sin(t * 9.0 + k) * 2.0), ink, 1.5)
	draw_circle(Vector2(-14, 4), 10.0, Color(1.0, 0.75, 0.3, 0.18))
	Art.shaded_ellipse(self, Vector2(-7, 2), Vector2(12, 8.5), gold.lightened(0.15), gold.darkened(0.3), 16)
	for x in [-11.0, -5.0, 1.0]:
		draw_line(Vector2(x, -6), Vector2(x - 2.0, 9), ink, 3.0, true)
	draw_colored_polygon(PackedVector2Array([Vector2(-18, 2), Vector2(-27, 7), Vector2(-17, 7)]), ink)
	draw_circle(Vector2(6, -1), 7.0, Color(0.25, 0.16, 0.06).lerp(white, flash))
	draw_circle(Vector2(13, -2), 5.0, ink.lerp(white, flash))
	_eyes(Vector2(15, -3), 1.6, 1.5, Color(1.0, 0.35, 0.25))


func _draw_statua(white: Color) -> void:
	var charge := _anim_progress(0.6) if anim == "charge" else 0.0
	var marble := Color(0.78, 0.77, 0.74).lerp(white, flash)
	var shade := Color(0.42, 0.43, 0.48).lerp(white, flash)
	var glow := Color(0.6, 0.85, 1.0)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2(facing, 1.0))
	Art.grad_rect_h(self, Rect2(-22, 8, 44, 26), marble.darkened(0.15), shade.darkened(0.2))
	draw_rect(Rect2(-25, 4, 50, 7), marble)
	draw_polygon(PackedVector2Array([Vector2(-13, 4), Vector2(15, 4), Vector2(11, -26), Vector2(-9, -26)]), PackedColorArray([shade, marble, marble, shade]))
	draw_polygon(PackedVector2Array([Vector2(-10, -26), Vector2(12, -26), Vector2(13, -48), Vector2(-9, -48)]), PackedColorArray([shade, marble, marble, shade]))
	var raise := -18.0 if anim == "charge" else 0.0
	draw_line(Vector2(9, -44), Vector2(24, -36 + raise), marble, 6.0, true)
	draw_circle(Vector2(26, -37 + raise), 4.0, marble)
	draw_line(Vector2(-8, -44), Vector2(-14, -24), shade, 6.0, true)
	draw_circle(Vector2(2, -58), 10.0, marble)
	draw_arc(Vector2(2, -58), 10.0, PI * 0.9, PI * 1.9, 10, shade, 2.5)
	var crack := Color(glow, 0.25 + 0.75 * charge)
	draw_polyline(PackedVector2Array([Vector2(-4, -46), Vector2(1, -36), Vector2(-3, -24), Vector2(3, -12), Vector2(0, 2)]), crack, 1.6 + charge, true)
	draw_polyline(PackedVector2Array([Vector2(6, -60), Vector2(3, -54), Vector2(7, -50)]), crack, 1.4, true)
	if charge > 0.0:
		draw_circle(Vector2(26, -37 + raise), 14.0, Color(glow, 0.3))
	_eyes(Vector2(5, -59), 2.4, 1.4, glow if charge > 0.0 else Color(0.85, 0.9, 1.0))


func _draw_custode(white: Color) -> void:
	var t := _look_t
	var gold := Color(0.86, 0.66, 0.3).lerp(white, flash)
	var gold_dark := Color(0.4, 0.27, 0.1).lerp(white, flash * 0.6)
	var steel := Color(0.18, 0.16, 0.18).lerp(white, flash)
	var cape := Color(0.42, 0.06, 0.07)
	var core := Color(1.0, 0.7, 0.3)
	var walk := absf(velocity.x) > 10.0
	var step := sin(t * 7.0) * 6.0 if walk else 0.0
	var crouch := 10.0 if anim == "crouch" else 0.0
	var burst := anim == "burst"
	draw_set_transform(Vector2(0, crouch), 0.0, Vector2(facing, 1.0))

	# Mantello che ondeggia dietro.
	var cape_pts := PackedVector2Array([Vector2(-26, -40), Vector2(10, -42), Vector2(-14 + sin(t * 2.0) * 6.0, 58), Vector2(-52 + sin(t * 2.4) * 8.0, 50)])
	draw_polygon(cape_pts, PackedColorArray([cape, cape, cape.darkened(0.5), cape.darkened(0.5)]))

	# Gambe corazzate.
	for s in [-1.0, 1.0]:
		var lx: float = s * 14.0
		var off: float = step * s
		draw_polygon(PackedVector2Array([Vector2(lx - 10, 8), Vector2(lx + 10, 8), Vector2(lx + 9 + off, 58), Vector2(lx - 11 + off, 58)]),
			PackedColorArray([steel.lightened(0.15), steel, steel.darkened(0.3), steel.darkened(0.3)]))
		draw_rect(Rect2(lx - 13 + off, 52, 26, 10), gold_dark)
		draw_rect(Rect2(lx - 11, 24, 22, 5), gold)

	# Torso e corazza dorata.
	var torso := PackedVector2Array([Vector2(-34, -44), Vector2(34, -44), Vector2(28, 12), Vector2(-28, 12)])
	draw_polygon(torso, PackedColorArray([gold.lightened(0.15), gold, gold_dark, gold_dark]))
	draw_polyline(PackedVector2Array([Vector2(-34, -44), Vector2(34, -44), Vector2(28, 12), Vector2(-28, 12), Vector2(-34, -44)]), gold_dark.darkened(0.4), 2.5, true)
	draw_line(Vector2(0, -42), Vector2(0, 10), gold_dark, 2.0)

	# Nucleo: giglio borbonico che si accende prima della raffica.
	var charge := _anim_progress(1.0) if burst else 0.0
	var pulse := 0.5 + 0.5 * sin(t * 4.0)
	var ccol := Color(core, 0.35 + 0.25 * pulse + charge * 0.6)
	draw_circle(Vector2(0, -16), 26.0 + charge * 18.0, Color(core, 0.08 + charge * 0.2))
	draw_circle(Vector2(0, -10), 5.0, ccol)
	draw_circle(Vector2(-7, -20), 4.5, ccol)
	draw_circle(Vector2(7, -20), 4.5, ccol)
	draw_circle(Vector2(0, -24), 5.5, ccol)
	draw_line(Vector2(-10, -14), Vector2(10, -14), ccol, 3.0)

	# Spallacci.
	for s in [-1.0, 1.0]:
		Art.shaded_ellipse(self, Vector2(s * 36.0, -42), Vector2(16, 12), gold.lightened(0.2), gold_dark, 14)

	# Braccio e alabarda (alzati durante la carica).
	var raise := -34.0 if burst else 0.0
	var hand := Vector2(44, -20 + raise)
	draw_line(Vector2(34, -40), hand, steel, 12.0, true)
	draw_line(hand + Vector2(0, -110), hand + Vector2(0, 66), Color(0.3, 0.2, 0.12), 5.0, true)
	draw_colored_polygon(PackedVector2Array([hand + Vector2(0, -110), hand + Vector2(22, -88), hand + Vector2(22, -70), hand + Vector2(0, -78)]), Color(0.75, 0.78, 0.85))
	draw_colored_polygon(PackedVector2Array([hand + Vector2(-3, -110), hand + Vector2(3, -110), hand + Vector2(0, -132)]), Color(0.75, 0.78, 0.85))
	draw_line(Vector2(-34, -40), Vector2(-40, -6 + raise * 0.6), steel, 12.0, true)

	# Elmo con cimiero e visiera luminosa.
	var head := Vector2(0, -62)
	Art.shaded_ellipse(self, head, Vector2(20, 22), gold.lightened(0.1), gold_dark, 16)
	draw_rect(Rect2(head.x - 14, head.y - 2, 30, 7), Color(0.05, 0.03, 0.02))
	var plume := PackedVector2Array()
	for k in 9:
		var u := float(k) / 8.0
		plume.append(head + Vector2(-u * 34.0, -20.0 - sin(u * PI) * 16.0 + sin(t * 3.0 + u * 2.0) * 3.0))
	draw_polyline(plume, Color(0.65, 0.08, 0.1), 9.0, true)
	_eyes(head + Vector2(6, 1), 5.0, 2.2, Color(1.0, 0.75, 0.3))
