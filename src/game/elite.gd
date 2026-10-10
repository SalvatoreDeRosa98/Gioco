extends CharacterBody2D
## Due incontri intermedi: il capitano prepara un fendente; la Madre annuncia tre proiettili.
const Data := preload("res://game/expansion_data.gd")
var kind := "capitano"
var half := Vector2(22, 34)
var hp := 14
var max_hp := 14
var damage := 1
var coins := 22
var touch_cd := 0.0
var facing := -1.0
var world: Node
var _cfg: Dictionary
var _tex: Texture2D
var _timer := 1.8
var _windup := false
var _pattern := 0
var _aim := Vector2.RIGHT
var _swing := 0.0
var _flash := 0.0
var _rig: Node2D
var _clock := 0.0

func _ready() -> void:
	var rigs: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_cutouts.json"))
	_rig = preload("res://game/npc_cutout_rig.gd").new()
	_rig.setup(_tex, rigs[_cfg.rig], Vector2(_tex.get_width() * .5, _tex.get_height()), float(_cfg.height) / _tex.get_height())
	var feet := Node2D.new()
	feet.position.y = half.y
	feet.show_behind_parent = true
	add_child(feet)
	feet.add_child(_rig)

## Prepara l'incontro e l'aspetto dal tipo presente nei dati della stanza.
func setup(data: Dictionary, owner_world: Node) -> void:
	world = owner_world
	kind = data.type
	_cfg = Data.data().elites[kind]
	_tex = load(_cfg.image)
	position = data.pos
	hp = int(_cfg.hp)
	max_hp = hp
	damage = int(_cfg.damage)
	coins = int(_cfg.coins)
	if kind == "madre":
		half = Vector2(40, 64)
	elif kind == "cavaliere":
		half = Vector2(28, 48)
	elif kind == "guardia":
		half = Vector2(20, 38)
	elif kind == "spettro":
		half = Vector2(22, 34)
	_resolve_spawn()
	collision_layer = 4
	collision_mask = 1 | 4
	var cs := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = half * 2
	cs.shape = shape
	add_child(cs)
	add_to_group("enemies")
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS

	var sm := ShaderMaterial.new()

	sm.shader = preload("res://game/shaders/canvas_char_volume.gdshader")

	material = sm

## Appoggia i nemici terrestri sopra il suolo e i blocchi, mai dentro la muratura.
## Ripete il controllo per i basamenti composti da più blocchi sovrapposti.
func _resolve_spawn() -> void:
	if kind == "spettro":
		return
	position.y = minf(position.y, float(world.room.floor) - half.y)
	var blocks: Array = world.room.get("blocks", [])
	for pass_index in range(blocks.size() + 1):
		var moved := false
		for block: Rect2 in blocks:
			if Rect2(position - half, half * 2).intersects(block):
				position.y = block.position.y - half.y
				moved = true
		if not moved:
			break

func _physics_process(delta: float) -> void:
	if world.is_talking() or world.in_cutscene():
		return
	_timer -= delta
	_clock += delta
	_swing = maxf(0, _swing - delta)
	_flash = maxf(0, _flash - delta)
	touch_cd = maxf(0, touch_cd - delta)
	if kind == "spettro":
		velocity.y = sin(_timer * 3.5) * 45.0
	else:
		velocity.y = minf(900, velocity.y + 1500 * delta)
	velocity.x = 0
	var target = world.alive_player()
	if target:
		var distance: float = absf(target.position.x - position.x)
		if not _windup:
			facing = signf(target.position.x - position.x)
			if distance > float(_cfg.range):
				velocity.x = facing * float(_cfg.speed)
			elif _timer <= 0:
				if world != null and world.has_method("request_attack_token") and not world.request_attack_token(self):
					pass
				else:
					_windup = true
					_timer = float(_cfg.windup)
					_aim = (target.position - position).normalized()
		elif _timer <= 0:
			_release_attack_token()
			_windup = false
			_timer = float(_cfg.cooldown) * (0.8 if hp <= max_hp / 2 else 1.0)
			_swing = 0.3
			match kind:
				"madre":
					var direction: Vector2 = _aim
					for angle in ([-0.36, -0.18, 0.0, 0.18, 0.36] if _pattern % 2 else [-0.24, 0.0, 0.24]):
						world.enemy_fire(position, direction.rotated(angle), 180, Color(0.6, 0.82, 1))
				"guardia":
					velocity.x = facing * 250.0
					world.boss_sword_hit(position, position + Vector2(facing * float(_cfg.reach), 16), position.x)
					Audio.sfx("fendente")
				"cavaliere":
					if _pattern % 2:
						world.enemy_shockwave(position + Vector2(0, half.y - 6))
						Audio.sfx("custode_urto")
					else:
						world.boss_sword_hit(position, position + Vector2(facing * float(_cfg.reach), 26), position.x)
						Audio.sfx("fendente")
				"spettro":
					for angle in [-0.28, 0.0, 0.28]:
						world.enemy_fire(position, _aim.rotated(angle), 170, Color(0.75, 0.45, 0.95))
					Audio.sfx("custode_raffica")
				_:
					if _pattern % 2:
						world.enemy_shockwave(position + Vector2(0, half.y - 6))
					else:
						world.boss_sword_hit(position, position + Vector2(facing * float(_cfg.reach), 30), position.x)
			_pattern += 1
	# Repulsione orizzontale morbida: evita la sovrapposizione tra nemici
	if kind != "spettro":
		for other in get_tree().get_nodes_in_group("enemies"):
			if other != self and is_instance_valid(other) and other is CharacterBody2D:
				var dx: float = position.x - other.position.x
				if absf(dx) < 38.0 and absf(position.y - other.position.y) < 35.0:
					var push_sign: float = signf(dx) if dx != 0.0 else (1.0 if get_instance_id() > other.get_instance_id() else -1.0)
					velocity.x += push_sign * (38.0 - absf(dx)) * 3.5
	move_and_slide()
	if _flash > 0:
		_rig.set_action("hurt", 1.0 - _flash / .15)
	elif _windup:
		_rig.set_action("cast_windup" if kind in ["madre","spettro"] else "windup", 1.0 - _timer / float(_cfg.windup))
	elif _swing > 0:
		_rig.set_action("cast_strike" if kind in ["madre","spettro"] else "strike", 1.0 - _swing / .3)
	else:
		_rig.set_action("")
	_rig.pose(_clock, facing, Color(1.4,1.25,1) if _flash > 0 else Color.WHITE, 0, _windup or _swing > 0, absf(velocity.x) > 1)
	queue_redraw()


func _exit_tree() -> void:
	_release_attack_token()


func _release_attack_token() -> void:
	if world != null and world.has_method("release_attack_token"):
		world.release_attack_token(self)


## Riceve colpi e restituisce true una volta sconfitto, lasciando al mondo ricompense e obiettivi.
func take_hit(amount: int, push: Vector2 = Vector2.ZERO) -> bool:
	_release_attack_token()
	hp -= amount
	_flash = 0.15
	velocity += push * 80
	if hp <= 0:
		if _cfg.has("flag"):
			world.story.seen[str(_cfg.flag)] = 1
		queue_free()
		return true
	return false

func _draw() -> void:
	var h := float(_cfg.height)
	draw_set_transform(Vector2.ZERO, 0, Vector2(facing, 1))
	if _windup:
		var cue := "FENDENTE"
		match kind:
			"madre": cue = "VENTAGLIO"
			"guardia": cue = "STOCCATA"
			"cavaliere": cue = "URTO SISMICO" if _pattern % 2 else "FENDENTE PESANTE"
			"spettro": cue = "RAFFICA SPETTRALE"
			_: cue = "ONDA A TERRA" if _pattern % 2 else "FENDENTE"
		Art.text(self, Art.body_font(), Vector2(-100, -h - 5), cue, 14, Art.OCRA, HORIZONTAL_ALIGNMENT_CENTER, 200)
		var w_total := float(_cfg.windup)
		var w_prog := clampf(1.0 - _timer / maxf(0.01, w_total), 0.0, 1.0)
		if w_prog > 0.4:
			var gleam_pos := Vector2(16.0, half.y - h * 0.6)
			var g_alpha := clampf((w_prog - 0.4) / 0.6, 0.0, 1.0)
			var g_len := 8.0 * g_alpha + (5.0 if w_prog > 0.8 else 0.0)
			draw_line(gleam_pos - Vector2(g_len, 0), gleam_pos + Vector2(g_len, 0), Color(1.0, 0.9, 0.4, g_alpha), 2.0)
			draw_line(gleam_pos - Vector2(0, g_len), gleam_pos + Vector2(0, g_len), Color(1.0, 0.9, 0.4, g_alpha), 2.0)
			draw_circle(gleam_pos, 3.0 * g_alpha, Color(1.0, 1.0, 0.8, g_alpha))
	if _windup or _swing > 0:
		draw_arc(Vector2(18, 0), float(_cfg.reach), -1.0, 0.65, 24, Color(Art.OCRA, 0.9 if _swing > 0 else 0.6), 3 if _swing > 0 else 1, true)
	draw_set_transform(Vector2.ZERO)
	Art.text(self, Art.body_font(), Vector2(-150, -h + half.y - 28), _cfg.name, 17, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 300)
	draw_rect(Rect2(-45, -h + half.y - 16, 90, 4), Color(0, 0, 0, 0.7))
	draw_rect(Rect2(-45, -h + half.y - 16, 90.0 * hp / max_hp, 4), Art.OCRA)
