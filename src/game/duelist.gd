extends CharacterBody2D
## Duello opzionale: guardia dipinta, attacchi annunciati e premio solo alla vittoria.
const IMAGE := preload("res://assets/art/characters/taddeo.png")
var kind := "duellante"
var half := Vector2(18, 34)
var hp := 8
var max_hp := 8
var damage := 1
var coins := 0
var touch_cd := 0.0
var world: Node
var facing := -1.0
var _attack := 1.8
var _pattern := 0
var _windup := 0.0
var dying := false
var _die_t := 0.0
var _flash := 0.0
var _rig: Node2D
var _clock := 0.0
var _swing := 0.0

func _ready() -> void:
	var rigs: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_cutouts.json"))
	_rig = preload("res://game/npc_cutout_rig.gd").new()
	_rig.setup(IMAGE, rigs.combat_duellante, Vector2(IMAGE.get_width() * .5, IMAGE.get_height()), float(Tuning.data.progression.duelist_height) / IMAGE.get_height())
	var feet := Node2D.new()
	feet.position.y = half.y
	feet.show_behind_parent = true
	add_child(feet)
	feet.add_child(_rig)

## Prepara collisioni, valori di combattimento e posizione dell'incontro.
func setup(data: Dictionary, owner_world: Node) -> void:
	world = owner_world
	position = data["pos"]
	position.y = minf(position.y, float(world.room.floor) - half.y)
	for pass_index in range(world.room.get("blocks", []).size() + 1):
		for block: Rect2 in world.room.get("blocks", []):
			if Rect2(position - half, half * 2).intersects(block):
				position.y = block.position.y - half.y
	hp = int(Tuning.data.progression.duelist_hp)
	max_hp = hp
	_attack = float(Tuning.data.progression.duelist_attack_cooldown)
	collision_layer = 4
	collision_mask = 1 | 8
	var shape := CollisionShape2D.new()
	var rectangle := RectangleShape2D.new()
	rectangle.size = half * 2
	shape.shape = rectangle
	add_child(shape)
	add_to_group("enemies")

func _physics_process(delta: float) -> void:
	if dying:
		_die_t -= delta
		velocity.y = minf(900.0, velocity.y + 1500.0 * delta)
		rotation += delta * 1.4 * (-facing if facing != 0.0 else 1.0)
		modulate.a = clampf(_die_t / 0.48, 0.0, 1.0)
		move_and_slide()
		if _die_t <= 0.0:
			queue_free()
		return
	if world.is_talking() or world.in_cutscene():
		return
	touch_cd = maxf(0, touch_cd - delta)
	_clock += delta
	_flash = maxf(0, _flash - delta)
	_swing = maxf(0, _swing - delta)
	velocity.y = minf(900, velocity.y + 1500 * delta)
	var target: Node2D = world.alive_player()
	velocity.x = 0
	if target:
		facing = -1.0 if target.position.x < position.x else 1.0
		_attack -= delta
		if _windup > 0:
			_windup -= delta
			if _windup <= 0:
				_swing = .3
				if _pattern % 2:
					world.boss_sword_hit(position, position + Vector2(facing * 110, 15), position.x)
				else:
					world.enemy_fire(position + Vector2(facing * 30, -12), Vector2(facing, 0), float(Tuning.data.progression.duelist_bullet_speed), Art.OCRA)
				_pattern += 1
				_attack = float(Tuning.data.progression.duelist_attack_cooldown)
		elif absf(target.position.x - position.x) > float(Tuning.data.progression.duelist_attack_range):
			velocity.x = facing * float(Tuning.data.progression.duelist_speed)
		elif _attack <= 0:
			_windup = float(Tuning.data.progression.duelist_windup)
	move_and_slide()
	if _flash > 0:
		_rig.set_action("hurt", 1.0 - _flash / .15)
	elif _windup > 0:
		_rig.set_action("windup", 1.0 - _windup / float(Tuning.data.progression.duelist_windup))
	elif _swing > 0:
		_rig.set_action("strike", 1.0 - _swing / .3)
	else:
		_rig.set_action("")
	_rig.pose(_clock, facing, Color.WHITE if _flash > 0 else Color(.9,.8,.75), 0, _windup > 0, absf(velocity.x) > 1)
	queue_redraw()

## Il duello finisce a zero vita; Taddeo resta vivo come personaggio della storia.
func take_hit(amount: int, push: Vector2 = Vector2.ZERO) -> bool:
	if dying:
		return false
	hp -= amount
	_flash = 0.15
	velocity += push * 120
	if hp <= 0:
		dying = true
		_die_t = 0.48
		damage = 0
		collision_layer = 0
		collision_mask = 0
		velocity = Vector2(-facing * 80.0, -140.0)
		return true
	return false

func _draw() -> void:
	if _windup > 0:
		var w_total := float(Tuning.data.progression.duelist_windup)
		var w_prog := clampf(1.0 - _windup / maxf(0.01, w_total), 0.0, 1.0)
		draw_arc(Vector2(facing * 22, -10), 30, -1.1, 1.1, 12, Art.OCRA, 3, true)
		if w_prog > 0.4:
			var gleam_pos := Vector2(facing * 32, -15)
			var g_alpha := clampf((w_prog - 0.4) / 0.6, 0.0, 1.0)
			var g_len := 7.0 * g_alpha + (4.0 if w_prog > 0.8 else 0.0)
			draw_line(gleam_pos - Vector2(g_len, 0), gleam_pos + Vector2(g_len, 0), Color(1.0, 0.9, 0.45, g_alpha), 2.0)
			draw_line(gleam_pos - Vector2(0, g_len), gleam_pos + Vector2(0, g_len), Color(1.0, 0.9, 0.45, g_alpha), 2.0)
			draw_circle(gleam_pos, 2.5 * g_alpha, Color(1.0, 1.0, 0.8, g_alpha))
	Art.text(self, Art.body_font(), Vector2(-100, -100), "Taddeo" if has_meta("taddeo_duel") else "Guardia della Reggia", 16, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 200)
	draw_rect(Rect2(-30, -92, 60, 3), Color(0, 0, 0, 0.7))
	draw_rect(Rect2(-30, -92, 60.0 * hp / max_hp, 3), Art.OCRA)
