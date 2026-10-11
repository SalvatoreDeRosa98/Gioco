extends SceneTree
## Vertical slice «Le Cisterne di Gaetano»: stanze 9, 13, 15 ridisegnate in scena (tools/levels/slice_design.gd).
## Controlla: dati letti dalle scene (punte, muri incrinati, anelli, uscite, incudini, segnaposto della guardia),
## collisioni dai tile in gioco, raggiungibilità con e senza abilità, segnaposti della carta dalle scene.
const LevelScenes := preload("res://game/level_scenes.gd")
const WorldMap := preload("res://game/world_map.gd")
const JUMP_UP := 200.0
const JUMP_REACH := 280.0
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	for idx in [9, 13, 15]:
		var r := Room.build(idx)
		check(r.get("scene", "") != "", "Stanza %d: costruita dalla scena" % idx)
		var layers := LevelScenes.physics_layers(idx)
		check(layers.size() == 2, "Stanza %d: strati Terrain e OneWay" % idx)
		for l in layers:
			check(l.tile_set.get_physics_layers_count() == 2 and not l.get_used_cells().is_empty(), "Stanza %d: %s con collisioni" % [idx, l.name])
			l.free()
		check(LevelScenes.saves_for(idx).size() == 1, "Stanza %d: un'incudine nella scena" % idx)
		check(_reachable(r, Vector2(r.saves[0].pos.x, r.saves[0].pos.y)), "Stanza %d: incudine raggiungibile" % idx)
	var r9 := Room.build(9)
	var guard: Array = r9.enemies.filter(func(e): return e.get("placeholder", false))
	check(guard.size() == 1 and guard[0].type == "guardia" and guard[0].swap_to == "guardia_parata", "Stanza 9: segnaposto della guardia della parata")
	check(r9.vertical.size() == 1 and r9.vertical[0].side == "bottom" and int(r9.vertical[0].target) == 13, "Stanza 9: caduta verso le Cisterne Sepolte dalla scena")
	check(r9.cracks.size() == 1 and r9.secrets.size() == 3 and r9.landmark_pos.has(0) and r9.landmark_pos.has(1), "Stanza 9: muro incrinato, 3 segreti, chiusa e incisione")
	check(_reachable(r9, r9.landmark_pos[0]), "Stanza 9: la chiusa si raggiunge saltando")
	check(not _reachable(r9, r9.landmark_pos[1]), "Stanza 9: la cima del camino richiede i guanti")
	check(_reachable(r9, r9.secrets[0]), "Stanza 9: segreto sopra la discesa raggiungibile col doppio salto")
	var r13 := Room.build(13)
	check(r13.rings.size() == 6 and r13.spikes.size() == 1 and r13.cracks.size() == 1, "Stanza 13: anelli, punte e muro incrinato dalla scena")
	check(r13.spikes[0][0] <= 390 and r13.spikes[0][0] + r13.spikes[0][2] >= 390 and is_equal_approx(r13.spikes[0][1] + r13.spikes[0][3], 2000.0), "Stanza 13: punte a terra")
	check(r13.vertical.size() == 1 and r13.vertical[0].get("need", "") == "grapple", "Stanza 13: risalita col rampino")
	check(not _reachable(r13, Vector2(570, 1072)) and not _reachable(r13, Vector2(570, -25)), "Stanza 13: senza rampino non si risale oltre la seconda mensola")
	check(_reachable(r13, r13.secrets[0]), "Stanza 13: segreto a destra raggiungibile dal muretto")
	check(r13.landmark_pos.size() == 3, "Stanza 13: disegno del martello, passaggio per Piazza, Tana")
	var r15 := Room.build(15)
	check(r15.enemies.size() == 1 and r15.enemies[0].type == "ratking" and r15.boss, "Stanza 15: arena con Ratking")
	for l in r15.ledges:
		check(_reachable(r15, Vector2(l.get_center().x, l.position.y)), "Stanza 15: pedana %s raggiungibile" % l)
	# Carta del mondo: segnaposti calcolati dalle posizioni della scena.
	var pins := WorldMap.pins(r9, Vector2(500, 300), Vector2(146, 48))
	check(pins.size() == 2 and Rect2(Vector2(500, 300) - Vector2(73, 24), Vector2(146, 48)).grow(1).has_point(pins[0]), "Carta: segnaposti della stanza 9 dalla scena")
	# In gioco: collisioni dai tile, nessun corpo per le mensole, il giocatore atterra sulla mensola.
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.set_physics_process(false)
	world.player.invulnerable = true
	world._go(9, true)
	await process_frame
	for e in get_nodes_in_group("enemies"):
		e.queue_free()
	var tile_layers := 0
	var ledge_bodies := 0
	for c in world._walls.get_children():
		if c is TileMapLayer and c.collision_enabled:
			tile_layers += 1
		elif c is StaticBody2D and c.get_collision_layer_value(4):
			ledge_bodies += 1
	check(tile_layers == 2 and ledge_bodies == 0, "In gioco: fisica di pavimento e mensole dai tile (%d strati, %d corpi mensola)" % [tile_layers, ledge_bodies])
	world.player.teleport(Vector2(320, 760))
	world.player.set_physics_process(true)
	await create_timer(0.8).timeout
	check(world.player.is_on_floor() and absf(world.player.position.y + 24 - 852) < 6, "In gioco: atterraggio sulla mensola L1 (y=%.1f)" % world.player.position.y)
	world.player.teleport(Vector2(1300, 900))
	await create_timer(0.6).timeout
	check(world.player.is_on_floor() and absf(world.player.position.y + 24 - 980) < 6, "In gioco: pavimento dai tile (y=%.1f)" % world.player.position.y)
	world._go(15, true)
	await process_frame
	check(world.stations.has(Room.save_station_id(15)) == bool(world.cleared.get(15, false)), "Tana: incudine solo a stanza liberata")
	main.queue_free()
	await process_frame
	print("level_slice_test: %d fallimenti" % failures)
	quit(1 if failures else 0)

## Vero se il punto (appoggiato a una superficie) è raggiungibile da terra con salti e doppio salto, senza abilità.
func _reachable(r: Dictionary, target: Vector2) -> bool:
	var surf: Array = [Rect2(0, r.floor, r.size.x, 1)]
	for l in r.ledges + r.blocks:
		surf.append(l)
	var seen := {0: true}
	var queue := [0]
	while not queue.is_empty():
		var cur: Rect2 = surf[queue.pop_front()]
		if target.x >= cur.position.x - 40 and target.x <= cur.end.x + 40 and target.y <= cur.position.y + 2 and cur.position.y - target.y <= JUMP_UP:
			return true
		for j in surf.size():
			if seen.has(j):
				continue
			var nxt: Rect2 = surf[j]
			var rise := cur.position.y - nxt.position.y
			var gap := maxf(0.0, maxf(nxt.position.x - cur.end.x, cur.position.x - nxt.end.x))
			if rise <= JUMP_UP and gap <= JUMP_REACH:
				seen[j] = true
				queue.append(j)
	return false
