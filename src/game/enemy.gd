extends CharacterBody2D
## Nemico. Solo l'host esegue l'IA e applica i danni; posizione e stato sono replicati ai client.

const GRAVITY := 1500.0

var kind := "gatto"
var hp := 3
var max_hp := 3
var half := Vector2(16, 12)
var speed := 70.0
var damage := 1
var coins := 2
var flash := 0.0          # replicato
var facing := 1.0         # replicato
var touch_cd: Dictionary = {}
var world: Node

var _t := 0.0
var _dir := 1.0
var _shoot_cd := 1.5
var _state := "walk"
var _state_t := 1.5
var _airborne := false
var _spawn_x := 0.0


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
	_spawn_x = position.x
	_shoot_cd = float(cfg.get("fire_every", 2.0)) * 0.5
	half = _half_for(kind)
	collision_layer = 4
	collision_mask = 1
	set_multiplayer_authority(1)

	var sh := RectangleShape2D.new()
	sh.size = half * 2.0
	var cs := CollisionShape2D.new()
	cs.shape = sh
	add_child(cs)

	var sync := MultiplayerSynchronizer.new()
	sync.set_multiplayer_authority(1)
	var rep := SceneReplicationConfig.new()
	rep.add_property(NodePath(":position"))
	rep.add_property(NodePath(":flash"))
	rep.add_property(NodePath(":facing"))
	sync.replication_config = rep
	add_child(sync)
	add_to_group("enemies")


static func _half_for(k: String) -> Vector2:
	match k:
		"vespa":
			return Vector2(14, 12)
		"statua":
			return Vector2(18, 30)
		"custode":
			return Vector2(48, 60)
		_:
			return Vector2(18, 12)


func _physics_process(delta: float) -> void:
	flash = maxf(0.0, flash - delta * 5.0)
	queue_redraw()
	if not multiplayer.is_server():
		return
	_t += delta
	for k in touch_cd.keys():
		touch_cd[k] = maxf(0.0, float(touch_cd[k]) - delta)
	match kind:
		"vespa":
			_ai_vespa()
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
	if is_on_wall() or (is_on_floor() and not world.is_solid(ahead)):
		_dir = -_dir
	facing = _dir


## Volatile: insegue quando è vicino, altrimenti pattuglia in orizzontale.
func _ai_vespa() -> void:
	var target: Node2D = world.nearest_alive_player(global_position)
	if target and global_position.distance_to(target.global_position) < 420.0:
		var to: Vector2 = target.global_position - global_position
		velocity = velocity.lerp(to.normalized() * speed, 0.05)
	else:
		velocity = velocity.lerp(Vector2(_dir * speed * 0.5, sin(_t * 2.2) * 60.0), 0.05)
		if position.x < 120.0 or position.x > 1160.0:
			_dir = -_dir
	if absf(velocity.x) > 5.0:
		facing = signf(velocity.x)


## Statua: ferma, guarda il giocatore più vicino e spara orizzontalmente.
func _ai_statua(delta: float) -> void:
	velocity.y = minf(velocity.y + GRAVITY * delta, 900.0)
	velocity.x = 0.0
	var target: Node2D = world.nearest_alive_player(global_position)
	if target and absf(target.global_position.x - global_position.x) > 4.0:
		facing = signf(target.global_position.x - global_position.x)
	_shoot_cd -= delta
	if _shoot_cd <= 0.0:
		var cfg: Dictionary = Tuning.data.enemies.statua
		_shoot_cd = float(cfg.fire_every)
		world.enemy_fire(global_position + Vector2(facing * 22.0, -14.0), Vector2(facing, 0.0), float(cfg.bullet_speed))


## Boss: cammina verso il giocatore, poi alterna balzo con onda d'urto e raffica radiale.
func _ai_custode(delta: float) -> void:
	velocity.y = minf(velocity.y + GRAVITY * delta, 1000.0)
	var target: Node2D = world.nearest_alive_player(global_position)
	if target and absf(target.global_position.x - global_position.x) > 4.0:
		facing = signf(target.global_position.x - global_position.x)
	_state_t -= delta
	match _state:
		"walk":
			velocity.x = facing * speed
			if _state_t <= 0.0:
				if randf() < 0.5:
					_state = "leap"
					_airborne = false
					velocity = Vector2(facing * 240.0, -640.0)
				else:
					_state = "burst"
					_state_t = 1.0
		"leap":
			if not is_on_floor():
				_airborne = true
			elif _airborne:
				world.enemy_shockwave(global_position + Vector2(0, half.y - 4.0))
				_state = "walk"
				_state_t = 1.6
				velocity.x = 0.0
		"burst":
			velocity.x = 0.0
			if _state_t <= 0.0:
				world.enemy_burst(global_position + Vector2(0, -40.0), 8)
				_state = "walk"
				_state_t = 2.2


func take_hit(dmg: int) -> bool:
	hp -= dmg
	flash = 1.0
	if hp <= 0:
		queue_free()
		return true
	return false


func _draw() -> void:
	var c := Art.enemy_color(kind).lerp(Color.WHITE, flash)
	var t := _t
	draw_circle(Vector2(0, half.y * 0.9), half.x * 0.9, Color(0, 0, 0, 0.3))
	match kind:
		"vespa":
			var flap := sin(t * 40.0) * 5.0
			draw_circle(Vector2(-4, -half.y - 2 + flap * 0.2), 7.0, Color(1, 1, 1, 0.25))
			draw_circle(Vector2(4, -half.y - 2 - flap * 0.2), 7.0, Color(1, 1, 1, 0.25))
			draw_circle(Vector2.ZERO, half.x * 0.8, c.darkened(0.3))
			draw_line(Vector2(-half.x * 0.7, -4), Vector2(half.x * 0.5, -4), Color("#15120a"), 3.0)
			draw_line(Vector2(-half.x * 0.7, 4), Vector2(half.x * 0.5, 4), Color("#15120a"), 3.0)
			draw_colored_polygon(PackedVector2Array([Vector2(-half.x * 0.8, 0), Vector2(-half.x * 1.5, -3), Vector2(-half.x * 1.5, 3)]), c)
			_eyes(Vector2(half.x * 0.3, -2), 2.0, Color("#ffe27a"))
		"statua":
			var stone := c.darkened(0.25)
			draw_rect(Rect2(-half.x, -half.y * 0.25, half.x * 2.0, half.y * 1.25), stone.darkened(0.2))
			draw_circle(Vector2(0, -half.y * 0.55), half.x * 0.7, stone)
			draw_rect(Rect2(-half.x * 0.6, -half.y * 0.15, half.x * 1.2, half.y * 0.7), stone)
			_eyes(Vector2(facing * 4.0, -half.y * 0.55), 1.6, Color("#ff9a7a"))
		"custode":
			draw_circle(Vector2.ZERO, half.x * 1.1, Color(c, 0.12))
			draw_circle(Vector2(0, 4), half.x, c.darkened(0.45))
			draw_arc(Vector2(0, 4), half.x * 0.75, 0.0, TAU, 48, c, 3.0)
			var wing := sin(t * 3.0) * 10.0
			draw_colored_polygon(PackedVector2Array([Vector2(-half.x * 0.4, -10), Vector2(-half.x * 1.6, -half.y * 0.9 + wing), Vector2(-half.x * 0.5, 14)]), c.darkened(0.35))
			draw_colored_polygon(PackedVector2Array([Vector2(half.x * 0.4, -10), Vector2(half.x * 1.6, -half.y * 0.9 + wing), Vector2(half.x * 0.5, 14)]), c.darkened(0.35))
			_eyes(Vector2(facing * 14.0, -10), 3.0, Color("#ffb347"))
		_:
			var flap_g := sin(t * 18.0) * 3.0
			draw_circle(Vector2(0, -2), half.x, c)
			draw_colored_polygon(PackedVector2Array([Vector2(-half.x, -2), Vector2(-half.x - 10, -8 + flap_g), Vector2(-half.x, 4)]), c.darkened(0.2))
			draw_circle(Vector2(half.x * 0.9, -6), 5.0, c.darkened(0.1))
			_eyes(Vector2(facing * 6.0, -8), 1.8, Color("#ffd27a"))

	if max_hp > 3:
		var w := half.x * 2.0
		draw_rect(Rect2(-w * 0.5, -half.y - 12, w, 4), Color(0, 0, 0, 0.6))
		draw_rect(Rect2(-w * 0.5, -half.y - 12, w * float(hp) / float(max_hp), 4), Art.ROSA_POMPEI)


func _eyes(at: Vector2, r: float, glow: Color) -> void:
	draw_circle(at + Vector2(-r * 1.2, 0), r * 2.2, Color(glow, 0.25))
	draw_circle(at + Vector2(r * 1.2, 0), r * 2.2, Color(glow, 0.25))
	draw_circle(at + Vector2(-r * 1.2, 0), r, glow)
	draw_circle(at + Vector2(r * 1.2, 0), r, glow)
