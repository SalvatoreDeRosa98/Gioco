extends SceneTree
## Stanze in scena (5, 9, 12, 13, 14, 15) con zoom 1.0 e 1.6:
## - la camera non mostra mai nulla oltre i bordi della stanza (angoli, centro, vicino alle uscite);
## - nessun PNG e nessun nemico sovrapposti (spawn a meno di 200 px sulla stessa quota);
## - il cartello del cancello sinistro della stanza 13 sta nello schermo e fuori dalle zone dell'HUD.
const ROOMS := [5, 9, 12, 13, 14, 15]
const ZOOMS := [1.0, 1.6]
const MIN_GAP := 200.0
const CameraBounds := preload("res://game/camera_bounds.gd")
const SliceProps := preload("res://game/slice_props.gd")
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

## Attende che la stanza sia caricata e la camera abbia i limiti della nuova stanza.
func _settle(world, idx: int) -> void:
	for k in 120:
		await process_frame
		var cam: Camera2D = world.player._cam
		if world.room_index == idx and cam.limit_right == int(world.room.size.x) and cam.limit_bottom == int(world.room.size.y):
			return

func _cam_name() -> String:
	var c := root.get_viewport().get_camera_2d()
	return str(c.get_path()) + " zoom " + str(c.zoom) + " center " + str(c.get_screen_center_position()) if c else "nessuna"

func _cam_lim() -> Array:
	var c := root.get_viewport().get_camera_2d()
	return [c.limit_left, c.limit_top, c.limit_right, c.limit_bottom] if c else []

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	# Dati: PNG e nemici distanti.
	for idx in ROOMS:
		var r := Room.build(idx)
		for n in r.get("npcs", []):
			var np := Vector2(n.pos[0], n.pos[1])
			for e in r.enemies:
				var ep := Vector2(e.pos[0], e.pos[1])
				var same_level := absf(np.y - ep.y) < 120.0
				check(not same_level or absf(np.x - ep.x) >= MIN_GAP, "Stanza %d: %s e %s (%s) a %.0f px" % [idx, n.id, e.type, ep, absf(np.x - ep.x)])
	# Calcolo dei limiti (anche per viste più grandi della stanza).
	var lim := CameraBounds.limits(Vector2(1280, 1080), Vector2(1600, 900))
	check(lim.position.x == -160.0 and lim.size.x == 1600.0 and lim.position.y == 0.0, "Vista più larga della stanza: stanza centrata")
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.story.mark_seen("lesson_menu")
	world.story.mark_seen("ferruccio_identity")
	var player = world.player
	player.invulnerable = true
	for z in ZOOMS:
		for idx in ROOMS:
			world._go(idx, true)
			await _settle(world, idx)
			check(world.room_index == idx, "Stanza %d caricata" % idx)
			player._cam.zoom = Vector2(z, z)
			for e in get_nodes_in_group("enemies"):
				e.queue_free()
			var size: Vector2 = world.room.size
			var floor_y := float(world.room.floor)
			for p in [Vector2(150, floor_y - 30), Vector2(size.x - 150, floor_y - 30), Vector2(size.x / 2, 60), Vector2(150, 60), Vector2(size.x - 150, 60), Vector2(size.x / 2, floor_y - 30)]:
				player.teleport(p)
				world.hold(true)
				await process_frame
				player._cam.reset_smoothing()
				await process_frame
				await process_frame
				if world.room_index != idx:
					world._go(idx, true)
					await _settle(world, idx)
					player._cam.zoom = Vector2(z, z)
					continue
				var v := CameraBounds.visible_world(root.get_viewport())
				var room_rect := Rect2(Vector2.ZERO, size).grow(1.5)
				var fits := v.size.x <= size.x + 1.0 and v.size.y <= size.y + 1.0
				check(not fits or room_rect.encloses(v), "Zoom %.1f stanza %d giocatore %s: vista %s oltre la stanza %s (camera %s limiti %s)" % [z, idx, p, v, size, _cam_name(), _cam_lim()])
			world.hold(false)
		# Cartello del cancello sinistro della 13.
		world._go(13, true)
		await _settle(world, 13)
		player._cam.zoom = Vector2(z, z)
		for e in get_nodes_in_group("enemies"):
			e.queue_free()
		var props = world._slice_props
		var gate: Dictionary = props.props.filter(func(p): return p.kind == "gate" and str(p.get("side", "")) == "left")[0]
		player.teleport(Vector2(gate.pos.x + 90, gate.pos.y - 30))
		world.hold(true)
		await process_frame
		player._cam.reset_smoothing()
		await process_frame
		await process_frame
		var ct: Transform2D = root.get_viewport().get_canvas_transform()
		var vp := root.get_viewport().get_visible_rect().size
		var labels := {"cancello": props.hint_rect(gate)}
		for m in world._expedition.marks:
			if str(m.kind) == "route" and absf(float(m.pos[0]) - gate.pos.x) < 300.0:
				labels["passaggio " + str(m.id)] = world._expedition.label_rect(Vector2(m.pos[0], m.pos[1]), "route", Controls.label("interact") + "  " + str(m.label))
		check(labels.size() >= 2, "Stanza 13: cartello del passaggio a sinistra trovato")
		for name in labels:
			var hr: Rect2 = labels[name]
			var screen := Rect2(ct * hr.position, Vector2.ZERO).expand(ct * hr.end)
			check(Rect2(Vector2.ZERO, vp).encloses(screen), "Zoom %.1f: cartello %s fuori schermo %s" % [z, name, screen])
			if name != "cancello":
				for gr: Rect2 in props.sprite_rects():
					check(not gr.intersects(hr), "Zoom %.1f: cartello %s %s coperto dal cancello %s" % [z, name, hr, gr])
			for hz: Rect2 in SliceProps.hud_rects(vp):
				check(not hz.intersects(screen), "Zoom %.1f: cartello %s %s sotto l'HUD %s" % [z, name, screen, hz])
		world.hold(false)
	main.queue_free()
	await process_frame
	print("level_view_test: %d fallimenti" % failures)
	quit(1 if failures else 0)
