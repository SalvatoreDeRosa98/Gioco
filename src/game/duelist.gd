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
var _flash := 0.0

## Prepara collisioni, valori di combattimento e posizione dell'incontro.
func setup(data: Dictionary, owner_world: Node) -> void:
	world = owner_world
	position = data["pos"]
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
	if world.is_talking() or world.in_cutscene():
		return
	touch_cd = maxf(0, touch_cd - delta)
	_flash = maxf(0, _flash - delta)
	velocity.y = minf(900, velocity.y + 1500 * delta)
	var target: Node2D = world.alive_player()
	velocity.x = 0
	if target:
		facing = -1.0 if target.position.x < position.x else 1.0
		_attack -= delta
		if _windup > 0:
			_windup -= delta
			if _windup <= 0:
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
	queue_redraw()

## Il duello finisce a zero vita; Taddeo resta vivo come personaggio della storia.
func take_hit(amount: int, push: Vector2 = Vector2.ZERO) -> bool:
	hp -= amount
	_flash = 0.15
	velocity += push * 120
	if hp <= 0:
		queue_free()
		return true
	return false

func _draw() -> void:
	var size := Vector2(110.0 * IMAGE.get_width() / IMAGE.get_height(), 110)
	draw_set_transform(Vector2.ZERO, 0, Vector2(facing, 1))
	draw_texture_rect(IMAGE, Rect2(Vector2(-size.x / 2, half.y - size.y), size), false, Color.WHITE if _flash > 0 else Color(0.9, 0.8, 0.75))
	draw_set_transform(Vector2.ZERO)
	if _windup > 0:
		draw_arc(Vector2(facing * 22, -10), 30, -1.1, 1.1, 12, Art.OCRA, 3, true)
	Art.text(self, Art.body_font(), Vector2(-100, -100), "Taddeo" if has_meta("taddeo_duel") else "Guardia della Reggia", 16, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 200)
	draw_rect(Rect2(-30, -92, 60, 3), Color(0, 0, 0, 0.7))
	draw_rect(Rect2(-30, -92, 60.0 * hp / max_hp, 3), Art.OCRA)
