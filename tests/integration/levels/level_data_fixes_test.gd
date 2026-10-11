extends SceneTree
## Dati coerenti: scorciatoia sinistra Piazza -> Corso (voluta, si apre dopo aver visitato Corso),
## Cisterne Sepolte -> Piazza solo dopo Ratking, incudini nelle stanze 9, 13 e 15 (13 e 15 a stanza liberata,
## posizioni lette dalle scene), compatibili col salvataggio.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	var data: Dictionary = Room.Expansion.data()
	check(data.edges["0"].map(func(v): return int(v)) == [1, 1], "Piazza: Corso a destra e scorciatoia a sinistra")
	for idx in [9, 13, 15]:
		check(Room.save_station_id(idx) != "", "Stanza %d: id di incudine definito" % idx)
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.set_process(false)
	world.set_physics_process(false)
	world.story.mark_seen("lesson_menu")
	world.story.mark_seen("ferruccio_identity")
	world._go(0, true)
	await process_frame
	world.story.seen["visited_1"] = 1
	check(world._left_open() and world._right_open(), "Piazza: scorciatoia aperta dopo aver visitato Corso")
	world.player.position = Vector2(20, float(world.room.floor) - 30)
	world._check_doors()
	check(world.room_index == 1, "Piazza: la scorciatoia sinistra porta a Corso")
	# Cisterne Reali: incudine subito disponibile.
	world._go(9, true)
	await process_frame
	check(world.stations.has(Room.save_station_id(9)), "Cisterne Reali: incudine registrata all'ingresso")
	check(world._stations_root.get_child_count() == 1, "Cisterne Reali: incudine visibile")
	# Cisterne Sepolte: sinistra chiusa prima di Ratking anche a stanza liberata; incudine solo a stanza liberata.
	world._go(13, true)
	await process_frame
	check(not world.stations.has(Room.save_station_id(13)), "Cisterne Sepolte: niente incudine con nemici vivi")
	for e in get_nodes_in_group("enemies"):
		e.queue_free()
	# Stanza 13 a due ondate (feat/gameplay): si scarta anche la seconda ondata in attesa.
	world.pending_wave.clear()
	await process_frame
	world._room_t = 1
	world._check_cleared()
	check(world.room_cleared and world.stations.has(Room.save_station_id(13)), "Cisterne Sepolte: incudine dopo aver liberato la stanza")
	check(not world._left_open(), "Cisterne Sepolte: passaggio per Piazza chiuso prima di Ratking")
	world.player.position = Vector2(20, float(world.room.floor) - 30)
	world._check_doors()
	check(world.room_index == 13, "Cisterne Sepolte: il bordo sinistro non aggira Ratking")
	world.story.mark_seen("ratking_defeated")
	check(world._left_open(), "Cisterne Sepolte: passaggio aperto dopo Ratking")
	world._check_doors()
	check(world.room_index == 0, "Cisterne Sepolte: dopo Ratking il bordo sinistro porta a Piazza")
	# Tana: incudine solo dopo la vittoria (stanza liberata).
	world.cleared[Room.RATKING_ROOM] = true
	world._go(Room.RATKING_ROOM, true)
	await process_frame
	check(world.stations.has(Room.save_station_id(Room.RATKING_ROOM)), "Tana di Ratking: incudine dopo la vittoria")
	# Lo stato serializzato conserva le incudini nuove.
	var state := {"checkpoint": {"room": 9, "x": 520, "y": 950}, "coins": world.coins, "cleared": world.cleared,
		"defeated": world.defeated, "stations": world.stations, "vars": world.story.vars, "seen": world.story.seen,
		"upgrades": world.upgrades, "equipped": world.equipped, "choice_uses": world.choice_uses}
	world._restore_state(JSON.parse_string(JSON.stringify(state)))
	await process_frame
	check(world.room_index == 9 and world.stations.has(Room.save_station_id(13)), "Caricamento: incudini e stanza ripristinate")
	main.queue_free()
	await process_frame
	print("level_data_fixes_test: %d fallimenti" % failures)
	quit(1 if failures else 0)
