extends CharacterBody2D
## Boss delle Cisterne: artigli, carica e ratti, sempre annunciati e seguiti da recupero.
var kind := "ratking"
var half := Vector2(24, 45)
var hp := 32
var max_hp := 32
var damage := 1
var coins := 45
var touch_cd := 0.0
var facing := -1.0
var world: Node
var _cfg: Dictionary
var _rig: Node2D
var _clock := 0.0
var _state := "waiting"
var _timer := 0.0
var _duration := 1.0
var _pattern := 0
var _attack := "claw"
var _hit := false
var _flash := 0.0

## Imposta collisioni e statistiche senza alterare gli altri boss.
func setup(data: Dictionary, owner_world: Node) -> void:
	world = owner_world
	_cfg = Room.Expansion.data().ratking
	position = data.pos
	hp = int(_cfg.hp)
	max_hp = hp
	damage = int(_cfg.damage)
	coins = int(_cfg.coins)
	collision_layer = 0
	collision_mask = 1 | (1 << 3)
	var shape := RectangleShape2D.new()
	shape.size = half * 2
	var collision := CollisionShape2D.new()
	collision.shape = shape
	add_child(collision)
	add_to_group("enemies")
	var configs: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_puppets.json"))
	_rig = preload("res://game/npc_painted_puppet.gd").new()
	_rig.setup(configs.ratking, float(_cfg.height))
	var feet := Node2D.new()
	feet.position.y = half.y
	add_child(feet)
	feet.add_child(_rig)

func _process(delta: float) -> void:
	_clock += delta
	_flash = maxf(0, _flash - delta)
	var action := ""
	if _state == "windup":
		action = "cast_windup" if _attack == "rats" else "windup"
	elif _state == "strike":
		action = "cast_strike" if _attack == "rats" else "strike"
	_rig.set_action("hurt" if _flash > 0 else action, 1.0 - _timer / _duration)
	_rig.pose(_clock, facing, Color(1.5, 1.2, 1) if _flash > 0 else Color.WHITE, 0, world.is_talking(), absf(velocity.x) > 5)
	queue_redraw()

func _physics_process(delta: float) -> void:
	if world.is_talking() or world.in_cutscene() or world.alive_player() == null:
		return
	touch_cd = maxf(0, touch_cd - delta)
	velocity.y = minf(900, velocity.y + 1500 * delta)
	velocity.x = 0
	var target: Node2D = world.alive_player()
	if _state == "waiting":
		if target.position.x >= float(_cfg.trigger_x):
			activate()
		return
	_timer -= delta
	match _state:
		"approach":
			var dx := target.position.x - position.x
			if absf(dx) > 4:
				facing = signf(dx)
			if absf(dx) > float(_cfg.claw_reach) * .8:
				velocity.x = facing * float(_cfg.speed)
			if _timer <= 0:
				_attack = ["claw", "charge", "rats"][_pattern % 3]
				if _attack == "claw" and absf(dx) > float(_cfg.claw_reach):
					_attack = "charge"
				_enter("windup", float(_cfg.windup))
		"windup":
			if _timer <= 0:
				_hit = false
				_enter("strike", float(_cfg.charge_time) if _attack == "charge" else .32)
				Audio.sfx("fendente")
				if _attack == "rats":
					_call_rats()
		"strike":
			if _attack == "charge":
				velocity.x = facing * float(_cfg.charge_speed)
			elif _attack == "claw" and not _hit:
				_hit = world.boss_sword_hit(position, position + Vector2(facing * float(_cfg.claw_reach), 5), position.x)
			if _timer <= 0 or (_attack == "charge" and is_on_wall()):
				_pattern += 1
				_enter("recover", float(_cfg.recovery))
		"recover":
			if _timer <= 0:
				_enter("approach", .45 if hp <= max_hp / 2 else .9)
	move_and_slide()
	position.x = clampf(position.x, 70, float(world.room.size.x) - 70)

## Chiude l'ingresso soltanto quando Ferruccio entra davvero nell'arena.
func activate() -> void:
	if _state != "waiting":
		return
	world.arena_active = true
	# La tana si vede tutta: camera d'arena con tween (tuning.json, "ratking_arena").
	ArenaCamera.enter(world, world.player._cam, Tuning.data.get("ratking_arena", {}))
	world._hud._title_t = -1.0
	world.refresh_routes()
	_enter("approach", 1.2)
	world.hold(true)
	world.narrate(_cfg.intro)

func _enter(state: String, seconds: float) -> void:
	if state == "windup":
		Audio.sfx("ratking_preavviso")
	_state = state
	_timer = seconds
	_duration = seconds

func _call_rats() -> void:
	var count := 5 if hp <= max_hp / 2 else 3
	Audio.sfx("ratti")
	for i in count:
		var rat := preload("res://game/rat_swarm.gd").new()
		rat.setup(Vector2(position.x - facing * i * 58, float(world.room.floor) - 13), facing, float(_cfg.rat_speed), float(i) * .16, world)
		world._entities.add_child(rat)

## Registra un solo abbattimento e disperde i ratti prima di riaprire il varco.
func take_hit(amount: int, _push: Vector2 = Vector2.ZERO) -> bool:
	if is_queued_for_deletion():
		return false
	hp -= amount
	_flash = .15
	if hp <= 0:
		for cam in get_tree().get_nodes_in_group(ArenaCamera.GROUP):
			cam.leave(float(Tuning.data.get("ratking_arena", {}).get("zoom_out_time", 0.9)))
		for rat in get_tree().get_nodes_in_group("rat_swarm"):
			rat.queue_free()
		queue_free()
		return true
	return false

func _draw() -> void:
	if _state == "strike" and _attack == "claw":
		draw_set_transform(Vector2.ZERO, 0, Vector2(facing, 1))
		for offset in [-8.0, 0.0, 8.0]:
			draw_arc(Vector2(0, offset), float(_cfg.claw_reach), -.65, .35, 20, Color(Art.OCRA, .75), 2, true)
		draw_set_transform(Vector2.ZERO)
	if _state != "windup":
		return
	var cue: String = {"claw":"ARTIGLI", "charge":"CARICA", "rats":"RICHIAMO DEI RATTI"}[_attack]
	Art.text(self, Art.body_font(), Vector2(-145,-115), cue, 16, Art.OCRA, HORIZONTAL_ALIGNMENT_CENTER, 290)
	var progress := 1.0 - _timer / _duration
	draw_arc(Vector2(0,-20), 50, -PI*.5, -PI*.5 + TAU*progress, 36, Art.OCRA, 2, true)
