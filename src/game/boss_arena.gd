extends Node2D
## Il Cortile si chiude e cambia assetto prima che il Custode inizi l'assalto.
var world: Node
var active := false
var _closing := 0.0
var _camera: Camera2D

func _process(delta: float) -> void:
	if world.room_index != Room.BOSS_ROOM or world.room_cleared or world.is_talking() or world.in_cutscene():
		return
	if not active and world.player.position.x >= float(Tuning.data.arena.trigger_x):
		activate()
	if active:
		_closing = minf(1, _closing + delta / float(Tuning.data.arena.transition_time))
		queue_redraw()

## Trasforma terreno, illuminazione e camera prima di liberare il boss.
func activate() -> void:
	if active:
		return
	active = true
	world.arena_active = true
	world.room.ledges = []
	for r in Tuning.data.arena.ledges:
		world.room.ledges.append(Rect2(r[0],r[1],r[2],r[3]))
	world.room.blocks.append(Rect2(180,0,40,980))
	world.room.blocks.append(Rect2(1700,0,40,980))
	world._terrain.build(world.room, Themes.get_theme("oro"))
	world.refresh_routes()
	_camera = Camera2D.new()
	_camera.position = Vector2(960,540)
	_camera.zoom = Vector2.ONE * float(Tuning.data.arena.camera_zoom)
	add_child(_camera)
	_camera.make_current()
	world.player.add_trauma(0.6)
	world._hud.area_title("L'arena del Custode", "Il Cortile chiude le sue porte")
	var tween := create_tween()
	tween.tween_property(world._backdrop, "modulate", Color(0.6,0.48,0.7), float(Tuning.data.arena.transition_time))
	for enemy in get_tree().get_nodes_in_group("enemies"):
		if enemy.kind == "custode":
			enemy._state_t = float(Tuning.data.arena.transition_time)
			enemy._state = "arena_intro"
	for x in [240,1680]:
		Art.point_light(self,Vector2(x,780),Color(1,0.35,0.2),1.2,600)
		Fx.dust(world.fx_root,Vector2(x,970),24)

func _draw() -> void:
	if not active:
		return
	var texture := preload("res://assets/art/props/cancello.png")
	for x in [190,1710]:
		draw_texture_rect(texture,Rect2(x-55,lerpf(-600,440,_closing),110,540),false,Color(0.7,0.55,0.65))
