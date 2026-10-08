extends SceneTree
## Acquisti atomici, effetti delle scelte, duello, scatto e città dopo il finale.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(value: bool, description: String) -> void:
	if not value:
		failures += 1
		push_error(description)

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	var player = world.player
	world.save_path = "user://progression-shop-regression.json"
	world.set_process(false)
	world.set_physics_process(false)
	player.set_physics_process(false)
	world.coins = 100
	world._save_at(Vector2(310, 980))
	world._go(Room.SECRET_ROOM, true)
	world._shop.show_shop()
	world._shop._rows.get_child(1).get_child(1).pressed.emit()
	check(world._shop._message.text.begins_with("Acquisto completato"), "Il pulsante acquista gli stivali indicati")
	world._shop.hide_shop()
	player.set_physics_process(false)
	check(world.coins == 75 and is_equal_approx(player._cfg.dash_cooldown, 0.85), "Prezzo e scatto migliorato")
	world.buy_item("boots")
	check(world.coins == 75, "Acquisto duplicato rifiutato")
	world.buy_item("pocket")
	world.buy_item("grip")
	check(world.coins == 10 and world.accessory_slots() == 2 and world.equipped.size() == 2, "Tasca e secondo accessorio")
	check(is_equal_approx(player._cfg.attack_cooldown, 0.28 * 0.85), "Impugnatura modifica il combattimento")
	world.buy_item("mask")
	check(world.coins == 10 and not world.upgrades.has("mask"), "Denaro insufficiente non speso")
	player.hp = 3
	world.buy_item("heal")
	check(world.coins == 2 and player.hp == 4, "Cura acquista una sola maschera")
	world._go_restart()
	check(world.room_index == 0 and world.coins == 2 and world.upgrades.has("boots"), "Morte mantiene acquisti e spesa senza spostare checkpoint")
	world.coins = 999
	world.upgrades.clear()
	world._restore_save()
	check(world.coins == 2 and world.upgrades.has("boots") and world.equipped.has("grip"), "Riapertura mantiene acquisti e accessori")
	world._go(Room.SECRET_ROOM, true)
	world.coins = 100
	var correct_path: String = world.save_path
	world.save_path = "user://missing-shop-test-directory/save.json"
	check(world.buy_item("mask").begins_with("Acquisto non riuscito") and world.coins == 100 and not world.upgrades.has("mask") and player.max_hp == 5, "Errore su disco annulla spesa e potenziamento")
	world.save_path = correct_path
	world.coins = 2
	world.story.set_var("agnese_memory", "risvegliata")
	world.apply_upgrades()
	check(world.accessory_slots() == 3, "Agnese risvegliata aggiunge uno spazio")
	world.story.set_var("agnese_memory", "sopita")
	world.apply_upgrades()
	check(world.accessory_slots() == 2 and is_equal_approx(world.detection_multiplier(), 0.7), "Agnese sopita riduce l'avvistamento")
	world._go(1, true)
	world._talk_lock = 0
	world.story.set_var("taddeo_trust", "accusato")
	player.teleport(Vector2(1150, 505))
	player.velocity = Vector2(0, 120)
	player.set_physics_process(true)
	await create_timer(0.15).timeout
	player.set_physics_process(false)
	Input.action_press("interact")
	world._update_branch()
	Input.action_release("interact")
	check(world.room_index == 1, "Accusare Taddeo chiude la scorciatoia")
	world.story.set_var("taddeo_trust", "perdonato")
	await create_timer(0.03).timeout
	Input.action_press("interact")
	world._update_branch()
	Input.action_release("interact")
	check(world.room_index == 3, "Perdonare Taddeo apre la scorciatoia")
	world._go(1, true)
	world.story.set_var("taddeo_trust", "accusato")
	world._start_taddeo_duel()
	var duelist: Node = null
	for enemy in get_nodes_in_group("enemies"):
		if enemy.has_meta("taddeo_duel") and not enemy.is_queued_for_deletion():
			duelist = enemy
	check(duelist != null, "Duello opzionale con Taddeo")
	world._hit_enemy(duelist, 99, Color.WHITE, 1)
	check(world.upgrades.has("guard") and world.story.times_seen("taddeo_duel_won") == 1, "Duello assegna accessorio")
	world._go(2, true)
	world._spawn_enemy("statua", Vector2(1000, 800))
	var statue: Node = null
	for enemy in get_nodes_in_group("enemies"):
		if not enemy.is_queued_for_deletion() and enemy.kind == "statua" and enemy.position == Vector2(1000, 800):
			statue = enemy
	player.teleport(Vector2(960, 800))
	player.facing = 1
	player.iframes = 0
	player.parry_window = 0.18
	world.story.set_var("father_registry", "bruciato")
	world._hurt_player(1, 1000)
	world._do_slash(player.position, 1, false, false)
	check(statue.hp == 4, "Registro bruciato potenzia il primo attacco dopo parata")
	world._do_slash(player.position, 1, false, false)
	check(statue.hp == 3, "Il bonus della parata si consuma")
	world.story.set_var("father_registry", "conservato")
	statue.anim = "charge"
	world._do_slash(player.position, 1, false, false)
	check(statue.anim == "idle" and is_equal_approx(statue._shoot_cd, 2.2), "Registro conservato interrompe il lancio")
	world._go(0, true)
	world.story.set_var("tonino_memory", "negato")
	world._refresh_choice_effects()
	check(get_nodes_in_group("pickups").any(func(p: Node) -> bool: return not p.is_queued_for_deletion() and p.item == "tonino_treasure"), "Tonino indica tesoro con imboscata")
	world.story.set_var("tonino_memory", "restituito")
	world._talk_npc = world._npcs.get_children().filter(func(n: Node) -> bool: return n.key == "tonino")[0]
	player.hp = 2
	world._on_dialogue_closed()
	world._on_dialogue_closed()
	check(player.hp == 3, "Tonino cura una volta tra due salvataggi")
	world._save_at(Vector2(310, 980))
	player.hp = 2
	world._on_dialogue_closed()
	check(player.hp == 3, "Salvataggio ripristina la cura di Tonino")
	world._talk_npc = null
	world._talk_lock = 0
	world.toggle_accessory("boots")
	check(is_equal_approx(player._cfg.dash_cooldown, 1.0), "Ricarica base dello scatto: un secondo")
	player.teleport(Vector2(1000, 100))
	player._dash_cd = 0
	player._air_dash_used = false
	player.set_physics_process(true)
	Input.action_press("dash")
	await create_timer(0.05).timeout
	Input.action_release("dash")
	check(player._dash_cd > 0.6 and player._air_dash_used, "Scatto in aria avvia ricarica")
	await create_timer(0.2).timeout
	player._dash_cd = 0
	Input.action_press("dash")
	await create_timer(0.05).timeout
	Input.action_release("dash")
	check(player._dash_t <= 0, "Secondo scatto in aria bloccato anche a timer scaduto")
	player.set_physics_process(false)
	player.parry_window = 0.18
	check(player.try_parry(player.position.x + player.facing * 20) and not player._air_dash_used, "Parata ricarica anche lo scatto aereo")
	var free := Room.build(Room.EPILOGUE_ROOM, {"violante_fate": "uccisa", "gregorio_mercy": "attacco"})
	var dream := Room.build(Room.EPILOGUE_ROOM, {"violante_fate": "risparmiata", "gregorio_mercy": "dialogo"})
	check(free["enemies"].size() == 3 and dream["enemies"].is_empty(), "Scelte finali cambiano i nemici")
	check(not free["blocks"].is_empty() and dream["blocks"].is_empty(), "Gregorio cambia il percorso")
	world.story.set_var("violante_fate", "uccisa")
	world.story.set_var("gregorio_mercy", "attacco")
	world.finish_story("Caserta", "Test", "")
	world._begin_epilogue()
	check(world.room_index == Room.EPILOGUE_ROOM and not world.game_over, "Epilogo giocabile dopo schermata finale")
	world._restore_save()
	check(world.room_index == Room.EPILOGUE_ROOM and world.story.get_var("violante_fate") == "uccisa", "Riapertura mantiene città e scelte finali")
	DirAccess.remove_absolute(world.save_path)
	main.queue_free()
	await process_frame
	print("PROGRESSION TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
