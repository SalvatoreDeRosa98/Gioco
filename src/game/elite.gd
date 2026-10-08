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
var _swing := 0.0
var _flash := 0.0

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
	collision_layer = 4
	collision_mask = 1 | 4
	var cs := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = half * 2
	cs.shape = shape
	add_child(cs)
	add_to_group("enemies")
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS

func _physics_process(delta: float) -> void:
	if world.is_talking() or world.in_cutscene():
		return
	_timer -= delta
	_swing = maxf(0, _swing - delta)
	_flash = maxf(0, _flash - delta)
	touch_cd = maxf(0, touch_cd - delta)
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
				_windup = true
				_timer = float(_cfg.windup)
		elif _timer <= 0:
			_windup = false
			_timer = float(_cfg.cooldown)
			_swing = 0.3
			if kind == "madre":
				var direction: Vector2 = (target.position - position).normalized()
				for angle in [-0.24, 0.0, 0.24]:
					world.enemy_fire(position, direction.rotated(angle), 180, Color(0.6, 0.82, 1))
			else:
				world.boss_sword_hit(position, position + Vector2(facing * float(_cfg.reach), 30), position.x)
	move_and_slide()
	queue_redraw()

## Riceve colpi e restituisce true una volta sconfitto, lasciando al mondo ricompense e obiettivi.
func take_hit(amount: int, push: Vector2 = Vector2.ZERO) -> bool:
	hp -= amount
	_flash = 0.15
	velocity += push * 80
	if hp <= 0:
		queue_free()
		return true
	return false

func _draw() -> void:
	var h := float(_cfg.height)
	var size := Vector2(h * _tex.get_width() / _tex.get_height(), h)
	draw_set_transform(Vector2.ZERO, 0, Vector2(facing, 1))
	draw_texture_rect(_tex, Rect2(Vector2(-size.x / 2, half.y - h), size), false, Color(1.4, 1.25, 1) if _flash > 0 else Color.WHITE)
	if _windup or _swing > 0:
		draw_arc(Vector2(18, 0), float(_cfg.reach), -1.0, 0.65, 24, Color(Art.OCRA, 0.8), 3 if _swing > 0 else 1, true)
	draw_set_transform(Vector2.ZERO)
	Art.text(self, Art.body_font(), Vector2(-150, -h + half.y - 28), _cfg.name, 17, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 300)
	draw_rect(Rect2(-45, -h + half.y - 16, 90, 4), Color(0, 0, 0, 0.7))
	draw_rect(Rect2(-45, -h + half.y - 16, 90.0 * hp / max_hp, 4), Art.OCRA)
