extends SceneTree
## Test di parata, statue, salvataggio su disco e ripristino dopo la morte.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, description: String) -> void:
	if not ok:
		failures += 1
		push_error(description)

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.save_path = "user://gameplay-regression-save.json"
	world.set_physics_process(false)
	world.set_process(false)
	world.player.set_physics_process(false)
	var player = world.player
	player.facing = 1.0
	player.parry_window = 0.18
	player._dash_cd = 0.5
	check(not player.try_parry(player.position.x - 20), "Parata da dietro rifiutata")
	check(player.try_parry(player.position.x + 20), "Parata frontale riuscita")
	check(player._dash_cd == 0.0, "Scatto ricaricato solo dopo parata")
	check(not player.try_parry(player.position.x + 20), "Una finestra para una sola volta")
	player._dash_cd = 0.5
	check(not player.try_parry(player.position.x + 20) and player._dash_cd == 0.5, "Parata fuori tempo non ricarica")
	world._load_room(2, true, false)
	var statue: Node = null
	for enemy in get_nodes_in_group("enemies"):
		if not enemy.is_queued_for_deletion() and enemy.kind == "statua":
			if str(enemy.get_meta("save_id")) != Room.save_station_id(2):
				world._hit_enemy(enemy, 99, Color.WHITE, 1.0)
				check(world.stations.is_empty(), "Statua sulla piattaforma della Villa non crea incudine")
				continue
			statue = enemy
			break
	check(statue != null, "Statua presente")
	world._hit_enemy(statue, 99, Color.WHITE, 1.0)
	check(world.stations.size() == 1, "La statua sconfitta attiva una stazione")
	world.coins = 37
	world.story.set_var("taddeo_trust", "perdonato")
	var station: Dictionary = world.stations.values()[0]
	var pos := Vector2(float(station["x"]), float(station["y"]))
	world._save_at(pos)
	check(FileAccess.file_exists(world.save_path), "Salvataggio su disco")
	world.coins = 99
	world.story.set_var("taddeo_trust", "accusato")
	world._load_room(3, true, false)
	player.dead = true
	world._go_restart()
	check(world.room_index == 2 and world.coins == 37, "Morte ripristina stanza e monete salvate")
	check(world.story.get_var("taddeo_trust") == "perdonato", "Ripristino scelte narrative")
	check(not player.dead and player.hp == player.max_hp, "Ripristino vita")
	world.coins = 0
	world._restore_save()
	check(world.coins == 37 and world.stations.size() == 1, "Riapertura ripristina salvataggio e altare")
	world._save_at(pos)
	check(world.coins == 37, "Secondo salvataggio sostituisce file esistente")
	check(world._right_open(), "Esplorazione aperta senza pulire stanza")
	for i in Room.MAIN_COUNT:
		var room := Room.build(i)
		var highest: Rect2 = room["branch_platform"]
		check(not room["secrets"].is_empty(), "Tesoro in ogni area")
		for ledge in room["ledges"]:
			check(highest.position.y <= ledge.position.y, "Passaggio alla quota più alta")
			check(ledge.position.x > Room.EDGE and ledge.end.x < room["size"].x - Room.EDGE, "Mensole fuori dai pilastri")
	world._load_room(0, true, false)
	check(world._stations_root.get_child_count() == 0, "Nessun portale o suggerimento visibile per il passaggio")
	check(world.room["invisible_steps"] == [Room.FIRST_SECRET_STEP], "Scalino segreto collidibile separato dal disegno")
	check(not world.room["ledges"].has(Room.FIRST_SECRET_STEP), "Scalino non visibile nel terreno")
	await physics_frame
	player.teleport(Vector2(1160, Room.highest_platform(0).position.y - player.HALF.y - 1))
	player.velocity = Vector2(0, 120)
	player.set_physics_process(true)
	await create_timer(0.15).timeout
	Input.action_press("jump")
	await create_timer(0.26).timeout
	Input.action_release("jump")
	await physics_frame
	await physics_frame
	Input.action_press("jump")
	await create_timer(0.36).timeout
	Input.action_release("jump")
	await create_timer(0.4).timeout
	player.set_physics_process(false)
	check(player.is_on_floor(), "Il giocatore può atterrare sullo scalino invisibile")
	check(absf(player.position.y - 366) < 3, "Il doppio salto raggiunge lo scalino invisibile")
	Input.action_press("interact")
	world._process(0.016)
	Input.action_release("interact")
	check(world.room_index == Room.SECRET_ROOM, "W sullo scalino entra nella stanza extra")
	check(not world.room["boss"] and not world._right_open(), "La stanza extra non cambia il boss finale")
	check(world._npcs.get_children().any(func(n: Node) -> bool: return n.key == "fantasma_umano"), "Fantasma umano nella stanza extra")
	player.set_physics_process(true)
	await create_timer(0.15).timeout
	check(world.room_index == Room.SECRET_ROOM, "L'ingresso resta nella fucina dopo il fotogramma dell'interazione")
	Input.action_press("interact")
	world._process(0.016)
	Input.action_release("interact")
	check(world.room_index == 0, "Una nuova pressione W vicino all'uscita lascia la fucina")
	world._go(Room.SECRET_ROOM, true)
	player.teleport(Vector2(Room.EDGE, float(world.room["floor"]) - player.HALF.y))
	world._check_doors()
	check(world.room_index == 0 and absf(player.position.y - 366) < 3, "Uscita ritorna allo scalino senza perdere progresso")
	DirAccess.remove_absolute(world.save_path)
	main.queue_free()
	await process_frame
	print("GAMEPLAY TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
