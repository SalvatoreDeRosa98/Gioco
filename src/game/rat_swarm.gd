extends Node2D
## Ratto evocato: attraversa il pavimento, si evita saltando e scompare contro i muri.
var radius := 12.0
var damage := 1
var _speed := 235.0
var _direction := 1.0
var _life := 7.0
var _delay := 0.0
var _clock := 0.0
var _sprite: Sprite2D
var world: Node

## Usa il ratto dipinto nello stesso atlante di Ratking.
func setup(point: Vector2, direction: float, speed: float, delay: float, owner_world: Node) -> void:
	world = owner_world
	position = point
	_direction = direction
	_speed = speed
	_delay = delay
	var config: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_puppets.json")).ratking
	var r: Array = config.regions.accessory
	_sprite = Sprite2D.new()
	_sprite.texture = load(config.atlas)
	_sprite.region_enabled = true
	_sprite.region_rect = Rect2(r[0],r[1],r[2],r[3])
	_sprite.scale = Vector2(direction,1) * (38.0 / float(r[2]))
	add_child(_sprite)
	add_to_group("rat_swarm")
	visible = false

func _physics_process(delta: float) -> void:
	if world.is_talking() or world.in_cutscene() or world.alive_player() == null:
		return
	_delay -= delta
	if _delay > 0:
		return
	if not is_in_group("bullets"):
		add_to_group("bullets")
	visible = true
	_clock += delta
	_life -= delta
	position.x += _direction * _speed * delta
	_sprite.position.y = -absf(sin(_clock*22))*3
	if _life <= 0:
		queue_free()
