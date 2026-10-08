extends Node2D
## Attrezzi da fabbro, ferri d'aggancio e ostacoli persistenti delle aree.
const Data := preload("res://game/expansion_data.gd")
var world: Node
var rings: Array = []
var cracks: Array = []
var spikes: Array = []
var _hammer_cd := 0.0
var _hammer_pending := false

## Ricostruisce solo i muri che non sono stati rotti nella partita corrente.
func setup(w: Node) -> void:
	world = w
	var key := str(w.room_index)
	rings = Data.data().get("rings", {}).get(key, [])
	cracks = Data.data().get("cracks", {}).get(key, [])
	spikes = Data.data().get("spikes", {}).get(key, [])
	z_index = 7
	for c in cracks:
		if w.story.times_seen(c.id) > 0:
			continue
		var body := StaticBody2D.new()
		body.name = c.id
		var shape := CollisionShape2D.new()
		var rect := RectangleShape2D.new()
		rect.size = Vector2(c.rect[2], c.rect[3])
		shape.shape = rect
		shape.position = Vector2(c.rect[0], c.rect[1]) + rect.size / 2
		body.add_child(shape)
		add_child(body)

## Restituisce l'anello più vicino e visibile sopra il giocatore, oppure INF.
func anchor(from: Vector2, reach: float) -> Vector2:
	var result := Vector2.INF
	var nearest := reach
	for a in rings:
		var point := Vector2(a[0], a[1])
		var distance := from.distance_to(point)
		if point.y < from.y - 15 and distance < nearest:
			var ray := PhysicsRayQueryParameters2D.create(from, point, 1)
			if get_world_2d().direct_space_state.intersect_ray(ray).is_empty():
				nearest = distance
				result = point
	return result

func _physics_process(delta: float) -> void:
	if world.is_talking() or world.player.dead:
		return
	_hammer_cd = maxf(0, _hammer_cd - delta)
	var player = world.player
	var hammer_input := Input.is_action_just_pressed("hammer") or Input.is_physical_key_pressed(KEY_V)
	if hammer_input and _hammer_cd == 0 and world.upgrades.has("hammer") and player.attacking <= 0:
		_hammer_cd = float(Tuning.data.player.hammer_cooldown)
		player.hammer_time = float(Tuning.data.player.hammer_time)
		_hammer_pending = true
	if _hammer_pending and player.hammer_time <= float(Tuning.data.player.hammer_time) * 0.57:
		_hammer_pending = false
		for c in cracks:
			var rect := Rect2(c.rect[0], c.rect[1], c.rect[2], c.rect[3])
			if world.story.times_seen(c.id) == 0 and rect.grow(float(Tuning.data.player.hammer_reach)).has_point(player.position):
				world.story.seen[c.id] = 1
				var body := get_node_or_null(NodePath(c.id)) as StaticBody2D
				if body:
					body.collision_layer = 0
					body.queue_free()
				world._spawn_pickup(rect.get_center(), "secret", int(c.reward))
				Fx.dust(world.fx_root, rect.get_center(), 22)
				player.add_trauma(0.25)
				world._hud.toast("Il calcare cede sotto il martello")
	for a in spikes:
		var rect := Rect2(a[0], a[1], a[2], a[3])
		if rect.grow(12).has_point(player.position + Vector2(0, 24)):
			if player.attacking > 0 and player.attack_down:
				player.bounce()
			else:
				world._hurt_player(1, player.position.x - player.facing)
	queue_redraw()

func _draw() -> void:
	for exit in world.room.get("vertical", []):
		if not exit.get("open", true):
			var y := 12.0 if exit.side == "top" else float(world.room.floor)
			draw_line(Vector2(exit.x - exit.width/2, y), Vector2(exit.x + exit.width/2, y), Art.OCRA, 6)
			Art.text(self, Art.body_font(), Vector2(exit.x - 160, y+45), "Serve " + ("la catena della fucina" if exit.need == "grapple" else "la presa dei guanti"), 17, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 320)
	for a in rings:
		var p := Vector2(a[0], a[1])
		draw_line(p - Vector2(0, 64), p, Color("#61564a"), 3, true)
		draw_arc(p, 12, 0, TAU, 24, Color("#29272b"), 6, true)
		draw_arc(p, 12, -PI, 0, 16, Color("#c0a677"), 2, true)
		draw_arc(p, 12, 0, PI, 16, Color("#78654b"), 2, true)
		if world.upgrades.has("grapple") and p.distance_to(world.player.position) < float(Tuning.data.player.grapple_range):
			draw_arc(p, 17, 0, TAU, 24, Color(Art.CREMA, 0.25), 1, true)
	for c in cracks:
		if world.story.times_seen(c.id) > 0:
			continue
		var r := Rect2(c.rect[0], c.rect[1], c.rect[2], c.rect[3])
		draw_texture_rect(preload("res://assets/art/props/terreno.png"), r, false, Color(0.7, 0.7, 0.65))
		var points := PackedVector2Array()
		for i in 7:
			points.append(Vector2(r.get_center().x + (-9 if i % 2 else 9), r.position.y + r.size.y * i / 6.0))
		draw_polyline(points, Color("#17171c"), 3, true)
	for a in spikes:
		for x in range(int(a[0]), int(a[0] + a[2]), 20):
			draw_colored_polygon(PackedVector2Array([Vector2(x, a[1]+20), Vector2(x+10, a[1]), Vector2(x+20, a[1]+20)]), Color("#999eaa"))
	if world.player.grapple_anchor != Vector2.INF:
		draw_line(world.player.position, world.player.grapple_anchor, Art.OCRA, 2, true)
