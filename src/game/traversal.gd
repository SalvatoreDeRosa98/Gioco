extends Node2D
## Attrezzi da fabbro, ferri d'aggancio e ostacoli persistenti delle aree.
const Data := preload("res://game/expansion_data.gd")
var world: Node
var rings: Array = []
var cracks: Array = []
var spikes: Array = []
var _hammer_cd := 0.0
var _hammer_pending := false
## Pausa tra due avvisi "Serve il martello" quando Ferruccio tocca un muro incrinato senza martello.
var _crack_hint_cd := 0.0
## Muro incrinato dipinto (stanze con tile_art): intatto, danneggiato (primo colpo), rotto.
const CRACK_ART := [preload("res://assets/art/slice/muro_incrinato_intatto.png"), preload("res://assets/art/slice/muro_incrinato_danneggiato.png"), preload("res://assets/art/slice/muro_incrinato_rotto.png")]

## Ricostruisce solo i muri che non sono stati rotti nella partita corrente.
func setup(w: Node) -> void:
	world = w
	var key := str(w.room_index)
	# Stanze in scena: anelli, muri incrinati e punte vengono dalla scena (Room.build), altrimenti dai JSON.
	rings = w.room.get("rings", Data.data().get("rings", {}).get(key, []))
	cracks = w.room.get("cracks", Data.data().get("cracks", {}).get(key, []))
	spikes = w.room.get("spikes", Data.data().get("spikes", {}).get(key, []))
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

## Ritaglio centrale del pannello con le stesse proporzioni del rettangolo del muro.
static func crack_region(tex: Texture2D, r: Rect2) -> Rect2:
	var ts := Vector2(tex.get_size())
	var aspect := r.size.x / r.size.y
	var src := Vector2(minf(ts.x, ts.y * aspect), 0)
	src.y = src.x / aspect
	return Rect2((ts - src) / 2.0, src)

## 0 intatto, 1 danneggiato, 2 rotto.
func crack_state(c: Dictionary) -> int:
	if world.story.times_seen(c.id) > 0:
		return 2
	return 1 if world.story.times_seen(str(c.id) + "_crepa") > 0 else 0

func _draw_crack_art(c: Dictionary) -> void:
	var r := Rect2(c.rect[0], c.rect[1], c.rect[2], c.rect[3])
	var state := crack_state(c)
	var tex: Texture2D = CRACK_ART[state]
	# Disegno = collisione: si ritaglia il centro del pannello con le proporzioni del muro, senza deformarlo.
	draw_texture_rect_region(tex, r, crack_region(tex, r))
	if state < 2:
		# Leggibilità: alone ocra che pulsa finché il muro non cede.
		var pulse := 0.25 + 0.2 * sin(Time.get_ticks_msec() * 0.004)
		draw_rect(r.grow(3), Color(Art.OCRA, pulse), false, 2.0)

## Id del muro incrinato ancora intatto a contatto con Ferruccio, oppure "".
func near_crack() -> String:
	for c in cracks:
		if world.story.times_seen(c.id) == 0 and Rect2(c.rect[0], c.rect[1], c.rect[2], c.rect[3]).grow(30.0).has_point(world.player.position):
			return str(c.id)
	return ""

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
	var hammer_input := Input.is_action_just_pressed("hammer") or Input.is_physical_key_pressed(KEY_V) or Input.is_key_pressed(KEY_V)
	if hammer_input and _hammer_cd == 0 and world.upgrades.has("hammer") and player.attacking <= 0:
		_hammer_cd = float(Tuning.data.player.hammer_cooldown)
		player.hammer_time = float(Tuning.data.player.hammer_time)
		_hammer_pending = true
	if _hammer_pending and player.hammer_time <= float(Tuning.data.player.hammer_time) * 0.57:
		_hammer_pending = false
		for c in cracks:
			var rect := Rect2(c.rect[0], c.rect[1], c.rect[2], c.rect[3])
			if world.story.times_seen(c.id) == 0 and rect.grow(float(Tuning.data.player.hammer_reach)).has_point(player.position):
				# Muri da più colpi ("hits" nella scena): i colpi intermedi lo danneggiano e basta.
				var dmg_key := str(c.id) + "_crepa"
				if world.story.times_seen(dmg_key) < int(c.get("hits", 1)) - 1:
					world.story.seen[dmg_key] = world.story.times_seen(dmg_key) + 1
					Fx.dust(world.fx_root, rect.get_center(), 12)
					player.add_trauma(0.15)
					world._hud.toast("Il muro si spacca: ancora un colpo")
					continue
				world.story.seen[c.id] = 1
				var body := get_node_or_null(NodePath(c.id)) as StaticBody2D
				if body:
					body.collision_layer = 0
					body.queue_free()
				world._spawn_pickup(rect.get_center(), "secret", int(c.reward))
				Fx.dust(world.fx_root, rect.get_center(), 22)
				player.add_trauma(0.25)
				world._hud.toast("Il calcare cede sotto il martello")
	_crack_hint_cd = maxf(0.0, _crack_hint_cd - delta)
	if _crack_hint_cd == 0.0 and near_crack() != "" and not world.upgrades.has("hammer"):
		_crack_hint_cd = 3.5
		world._hud.toast("Muro incrinato: serve il martello del calcare (" + Controls.label("hammer") + ")")
	for a in spikes:
		var rect := Rect2(a[0], a[1], a[2], a[3])
		if rect.grow(12).has_point(player.position + Vector2(0, 24)):
			if player.attacking > 0 and player.attack_down:
				player.bounce()
				Fx.dust(world.fx_root, player.position + Vector2(0, 24), 10)
				player.add_trauma(0.18)
			else:
				world._hurt_player(1, player.position.x - player.facing)
	queue_redraw()

func _draw() -> void:
	for exit in world.room.get("vertical", []):
		if not exit.get("open", true):
			var y := 12.0 if exit.side == "top" else float(world.room.floor)
			draw_line(Vector2(exit.x - exit.width/2, y), Vector2(exit.x + exit.width/2, y), Art.OCRA, 6)
			Art.text(self, Art.body_font(), Vector2(exit.x - 160, y+45), "Serve " + ("il rampino di Ratking" if exit.need == "grapple" else "la presa dei guanti"), 17, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 320)
	for a in rings:
		var p := Vector2(a[0], a[1])
		draw_line(p - Vector2(0, 64), p, Color("#61564a"), 3, true)
		draw_arc(p, 12, 0, TAU, 24, Color("#29272b"), 6, true)
		draw_arc(p, 12, -PI, 0, 16, Color("#c0a677"), 2, true)
		draw_arc(p, 12, 0, PI, 16, Color("#78654b"), 2, true)
		if world.upgrades.has("grapple") and p.distance_to(world.player.position) < float(Tuning.data.player.grapple_range):
			draw_arc(p, 17, 0, TAU, 24, Color(Art.CREMA, 0.25), 1, true)
	for c in cracks:
		if world.room.get("tile_art", false):
			_draw_crack_art(c)
			continue
		if world.story.times_seen(c.id) > 0:
			continue
		var r := Rect2(c.rect[0], c.rect[1], c.rect[2], c.rect[3])
		draw_rect(r, Color("#6d6458"), true)
		draw_texture_rect(preload("res://assets/art/props/terreno.png"), r, true, Color(1.0, 0.95, 0.85))
		# Crepe ben leggibili: tronco a zig-zag, rami laterali e alone ocra che pulsa.
		var pulse := 0.35 + 0.25 * sin(Time.get_ticks_msec() * 0.004)
		draw_rect(r.grow(3), Color(Art.OCRA, pulse), false, 3.0)
		var top := maxf(r.position.y, float(world.room.floor) - 520.0)
		var span := r.end.y - top
		var points := PackedVector2Array()
		for i in 13:
			points.append(Vector2(r.get_center().x + (-r.size.x * 0.22 if i % 2 else r.size.x * 0.22), top + span * i / 12.0))
		draw_polyline(points, Color("#121216"), 4, true)
		for i in range(1, 12, 2):
			var from := points[i]
			var side := -1.0 if i % 4 == 1 else 1.0
			draw_line(from, from + Vector2(side * r.size.x * 0.45, -14), Color("#1c1b20"), 2, true)
		if c.get("gate", false) and absf(world.player.position.x - r.get_center().x) < 260 and not world.upgrades.has("hammer"):
			Art.text(self, Art.body_font(), Vector2(r.get_center().x - 160, float(world.room.floor) - 300), "Muro incrinato · serve il martello", 18, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 320)
	for a in spikes:
		for x in range(int(a[0]), int(a[0] + a[2]), 20):
			draw_colored_polygon(PackedVector2Array([Vector2(x, a[1]+20), Vector2(x+10, a[1]), Vector2(x+20, a[1]+20)]), Color("#999eaa"))
	if world.player.grapple_anchor != Vector2.INF:
		draw_line(world.player.position, world.player.grapple_anchor, Art.OCRA, 2, true)
