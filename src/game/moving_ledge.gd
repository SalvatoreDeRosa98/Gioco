extends AnimatableBody2D
## Passerella del telaio: trasporta chi vi atterra, poi si ferma quando si libera il meccanismo.
const STONE := preload("res://assets/art/props/terreno.png")
var _cfg: Dictionary
var _world: Node
var _elapsed := 0.0
var _origin: Vector2
var _size: Vector2

## Costruisce la mensola attraversabile e configura tragitto e durata dai dati.
func setup(cfg: Dictionary, owner_world: Node) -> void:
	_cfg = cfg
	_world = owner_world
	_origin = Vector2(cfg.pos[0], cfg.pos[1])
	_size = Vector2(cfg.size[0], cfg.size[1])
	position = _origin
	collision_layer = 4
	collision_mask = 0
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = _size
	shape.shape = rect
	shape.one_way_collision = true
	shape.position = Vector2(0, _size.y * 0.5)
	add_child(shape)
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS

func _physics_process(delta: float) -> void:
	if _world.is_talking() or _world.in_cutscene():
		return
	if _world.story.times_seen(_cfg.stop) == 0:
		_elapsed += delta
		position = _origin + Vector2(_cfg.travel[0], _cfg.travel[1]) * sin(_elapsed * TAU / float(_cfg.period))
	else:
		position = position.move_toward(_origin, 80 * delta)

func _draw() -> void:
	draw_texture_rect_region(STONE, Rect2(-_size.x / 2, 0, _size.x, 24), Rect2(0, 0, 600, 132))
	draw_line(Vector2(-_size.x / 2 + 20, 0), Vector2(-_size.x / 2 + 20, -400), Color(Art.OCRA, 0.4), 1)
	draw_line(Vector2(_size.x / 2 - 20, 0), Vector2(_size.x / 2 - 20, -400), Color(Art.OCRA, 0.4), 1)
