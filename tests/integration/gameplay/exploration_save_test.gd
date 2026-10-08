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
	for i in Room.COUNT:
		var room := Room.build(i)
		check(not room["secrets"].is_empty(), "Tesoro in ogni area")
		for ledge in room["ledges"]:
			check(ledge.position.x > Room.EDGE and ledge.end.x < room["size"].x - Room.EDGE, "Mensole fuori dai pilastri")
	DirAccess.remove_absolute(world.save_path)
	main.queue_free()
	await process_frame
	print("GAMEPLAY TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
