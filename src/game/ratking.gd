extends CharacterBody2D
## Boss delle Cisterne: artigli, carica e ratti, sempre annunciati e seguiti da recupero.
## Sotto la soglia di vita entra in fase 2 (ruggito, pattern diverso, più rapido). Numeri in tuning.json (ratking).
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
var phase := 1
var _combo := 0
var _story: Dictionary

## Imposta collisioni e statistiche senza alterare gli altri boss.
func setup(data: Dictionary, owner_world: Node) -> void:
	world = owner_world
	_cfg = Tuning.data.ratking
	_story = Room.Expansion.data().ratking
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

## Valore del tuning per la fase corrente: la fase 2 sovrascrive solo le chiavi che definisce.
func v(key: String):
	if phase >= 2 and _cfg.phase2.has(key):
		return _cfg.phase2[key]
	return _cfg[key]


func is_phase2_threshold() -> bool:
	return hp > 0 and hp <= int(ceil(max_hp * float(_cfg.phase2_threshold)))


## Colore del preavviso per l'attacco in arrivo.
func telegraph_color(attack: String) -> Color:
	var c: Array = _cfg.telegraph_colors[attack]
	return Color(c[0], c[1], c[2])


## Ratti evocati ancora vivi nella stanza.
func rats_alive() -> int:
	var n := 0
	for rat in get_tree().get_nodes_in_group("rat_swarm"):
		if not rat.is_queued_for_deletion():
			n += 1
	return n


func _process(delta: float) -> void:
	_clock += delta
	_flash = maxf(0, _flash - delta)
	var action := ""
	if _state == "windup":
		action = "cast_windup" if _attack == "rats" else "windup"
	elif _state == "strike":
		action = "cast_strike" if _attack == "rats" else "strike"
	_rig.set_action("hurt" if _flash > 0 else action, 1.0 - _timer / _duration)
	var tint := Color.WHITE
	if _flash > 0:
		tint = Color(1.5, 1.2, 1)
	elif _state == "windup":
		# Preavviso leggibile: tinta del colore dell'attacco che cresce, lampo negli ultimi istanti.
		var k := clampf(1.0 - _timer / maxf(0.01, _duration), 0.0, 1.0)
		tint = Color.WHITE.lerp(telegraph_color(_attack) * 1.4, 0.35 + 0.4 * k)
		if _timer <= float(_cfg.telegraph_flash):
			tint = Color(1.8, 1.8, 1.8)
	elif _state == "roar":
		tint = Color(1.6, 0.7, 0.6) if int(_clock * 12.0) % 2 == 0 else Color.WHITE
	_rig.pose(_clock, facing, tint, 0, world.is_talking(), absf(velocity.x) > 5)
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
				velocity.x = facing * float(v("speed"))
			if _timer <= 0:
				var pattern: Array = v("pattern")
				_attack = str(pattern[_pattern % pattern.size()])
				if _attack == "claw" and absf(dx) > float(_cfg.claw_reach):
					_attack = "charge"
				if _attack == "rats" and rats_alive() >= int(v("max_rats_alive")):
					_attack = "claw" if absf(dx) <= float(_cfg.claw_reach) else "charge"
				_combo = int(v("claw_combo")) if _attack == "claw" else 1
				_enter("windup", float(v("windup")))
		"windup":
			if _timer <= 0:
				_hit = false
				_enter("strike", float(_cfg.charge_time) if _attack == "charge" else float(_cfg.claw_time))
				Audio.sfx("fendente")
				if _attack == "rats":
					_call_rats()
		"strike":
			if _attack == "charge":
				velocity.x = facing * float(v("charge_speed"))
			elif _attack == "claw" and not _hit:
				_hit = world.boss_sword_hit(position, position + Vector2(facing * float(_cfg.claw_reach), 5), position.x)
			if _timer <= 0 or (_attack == "charge" and is_on_wall()):
				_combo -= 1
				if _combo > 0:
					# Combo di artigli in fase 2: secondo colpo dopo un breve preavviso.
					_enter("windup", float(v("windup")) * 0.5)
				else:
					_pattern += 1
					_enter("recover", float(v("recovery")))
		"recover":
			if _timer <= 0:
				_enter("approach", float(v("approach_time")))
		"roar":
			if _timer <= 0:
				_enter("approach", float(v("approach_time")))
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
	_enter("approach", float(_cfg.intro_delay))
	world.hold(true)
	world.narrate(_story.intro)

func _enter(state: String, seconds: float) -> void:
	if state == "windup":
		Audio.sfx("ratking_preavviso")
	_state = state
	_timer = seconds
	_duration = seconds

func _call_rats() -> void:
	# Tetto ai ratti vivi: ne evoca solo quanti mancano al massimo della fase.
	var count := mini(int(v("rats_per_call")), int(v("max_rats_alive")) - rats_alive())
	for i in maxi(0, count):
		var rat := preload("res://game/rat_swarm.gd").new()
		rat.setup(Vector2(position.x - facing * i * float(_cfg.rat_spacing), float(world.room.floor) - 13), facing, float(_cfg.rat_speed), float(i) * float(_cfg.rat_stagger), world)
		rat._life = float(_cfg.rat_life)
		world._entities.add_child(rat)

## Registra un solo abbattimento e disperde i ratti prima di riaprire il varco.
func take_hit(amount: int, _push: Vector2 = Vector2.ZERO) -> bool:
	if is_queued_for_deletion():
		return false
	hp -= amount
	_flash = .15
	if phase == 1 and is_phase2_threshold():
		_enter_phase2()
	if hp <= 0:
		for cam in get_tree().get_nodes_in_group(ArenaCamera.GROUP):
			cam.leave(float(Tuning.data.get("ratking_arena", {}).get("zoom_out_time", 0.9)))
		for rat in get_tree().get_nodes_in_group("rat_swarm"):
			rat.queue_free()
		queue_free()
		return true
	return false

## Seconda fase: ruggito (lampo e scossa), poi pattern e tempi della fase 2.
func _enter_phase2() -> void:
	phase = 2
	_pattern = 0
	_combo = 0
	velocity.x = 0
	_enter("roar", float(_cfg.phase2_roar))
	if world.player and world.player.has_method("add_trauma"):
		world.player.add_trauma(float(_cfg.phase2_shake))
	if world.get("_hud") and world._hud.has_method("toast"):
		world._hud.toast("Ratking s'infuria: i ratti escono da ogni crepa!")


func _draw() -> void:
	if _state == "strike" and _attack == "claw":
		draw_set_transform(Vector2.ZERO, 0, Vector2(facing, 1))
		for offset in [-8.0, 0.0, 8.0]:
			draw_arc(Vector2(0, offset), float(_cfg.claw_reach), -.65, .35, 20, Color(Art.OCRA, .75), 2, true)
		draw_set_transform(Vector2.ZERO)
	if _state == "roar":
		Art.text(self, Art.body_font(), Vector2(-145,-115), "FURIA", 18, Color(1, .4, .3), HORIZONTAL_ALIGNMENT_CENTER, 290)
		return
	if _state != "windup":
		return
	var col := telegraph_color(_attack)
	var cue: String = {"claw":"ARTIGLI", "charge":"CARICA", "rats":"RICHIAMO DEI RATTI"}[_attack]
	Art.text(self, Art.body_font(), Vector2(-145,-115), cue, 16, col, HORIZONTAL_ALIGNMENT_CENTER, 290)
	var progress := 1.0 - _timer / _duration
	draw_arc(Vector2(0,-20), 50, -PI*.5, -PI*.5 + TAU*progress, 36, col, 3, true)
	if _attack == "charge":
		# Traiettoria della carica: linea a terra nella direzione di corsa.
		draw_line(Vector2(0, half.y - 2), Vector2(facing * 360.0, half.y - 2), Color(col, 0.35 + 0.5 * progress), 4)
	elif _attack == "claw":
		draw_set_transform(Vector2.ZERO, 0, Vector2(facing, 1))
		draw_arc(Vector2.ZERO, float(_cfg.claw_reach), -.65, .35, 20, Color(col, 0.25 + 0.5 * progress), 2, true)
		draw_set_transform(Vector2.ZERO)
	if _timer <= float(_cfg.telegraph_flash):
		draw_circle(Vector2(0, -20), 30.0 * (1.0 - _timer / float(_cfg.telegraph_flash)) + 8.0, Color(1, 1, 1, 0.5))
