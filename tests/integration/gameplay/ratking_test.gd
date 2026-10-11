extends SceneTree
## Due uscite solo a stanza liberata, incontro isolato dal finale e vittoria persistente.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.set_process(false)
	world.set_physics_process(false)
	world._go(13, true)
	await process_frame
	world.hold(true)
	check(not world._left_open() and not world._right_open(), "Entrambe le uscite chiuse con nemici vivi")
	for mark in world._expedition.marks:
		if mark.kind == "route":
			world._expedition.activate(mark)
	check(world.room_index == 13, "Il portale interattivo non aggira lo scontro")
	world._room_t = 1
	var enemies := get_nodes_in_group("enemies")
	for i in enemies.size()-1:
		enemies[i].queue_free()
	await process_frame
	world._check_cleared()
	check(not world.room_cleared, "Un solo nemico superstite mantiene chiuse le uscite")
	enemies[-1].queue_free()
	await process_frame
	world._check_cleared()
	check(not world._left_open() and world._right_open(), "Ultimo nemico: si apre solo la via di Ratking")
	world.player.position = Vector2(40,1976)
	world._check_doors()
	check(world.room_index == 13, "Sinistra resta chiusa fino a Ratking")
	world._go(13, true)
	world.player.position = Vector2(1240,1976)
	world._check_doors()
	check(world.room_index == Room.RATKING_ROOM, "Destra entra nella Tana di Ratking")
	await process_frame
	world.hold(true)
	var boss = world.boss()
	check(boss != null and boss.kind == "ratking", "Boss distinto da Donna Luciana")
	check(world._left_open(), "Prima dell'ingaggio è possibile tornare indietro")
	boss.activate()
	check(not world._left_open() and world.is_talking(), "Dialogo d'ingresso e arena chiusa")
	world._dialogue._open = false
	world.hold(false)
	world.player.set_physics_process(false)
	boss.set_physics_process(false)
	world.player.position = boss.position + Vector2(-70,0)
	world.player.iframes = 0
	var health: int = world.player.hp
	boss._attack = "claw"
	boss._enter("windup", .8)
	boss._physics_process(.1)
	check(world.player.hp == health, "Artigli: preparazione innocua")
	boss._hit = false
	boss._enter("strike", .3)
	boss._physics_process(.02)
	check(world.player.hp == health-1, "Artigli: colpo attivo causa danno")
	world.player.iframes = 0
	boss._physics_process(.02)
	check(world.player.hp == health-1, "Un solo danno per fendente")
	boss._attack = "charge"
	boss._enter("strike", .5)
	boss._physics_process(.02)
	check(absf(boss.velocity.x) > 400, "Carica effettiva")
	boss._call_rats()
	check(get_nodes_in_group("rat_swarm").size() == 3, "Prima fase: tre ratti")
	boss.hp = boss.max_hp / 2
	boss._call_rats()
	check(get_nodes_in_group("rat_swarm").size() == 8, "Seconda fase: cinque ratti")
	check(boss.take_hit(100), "Ratking sconfitto")
	world._on_enemy_killed(boss)
	await process_frame
	world._room_t = 1
	world._check_cleared()
	check(world.room_cleared and world._left_open(), "Vittoria riapre l'uscita")
	check(get_nodes_in_group("rat_swarm").is_empty(), "Ratti rimossi alla vittoria")
	check(world.story.times_seen("ratking_defeated") > 0 and not world.game_over and not world.in_cutscene(), "Vittoria registrata senza finale principale")
	check(world.upgrades.has("grapple"), "Ratking dona subito il rampino")
	world._dialogue._open = false
	world._go(13,false)
	check(world._left_open() and world.room.vertical[0].open, "Dopo Ratking: scorciatoia e risalita aperte")
	world._go(Room.RATKING_ROOM,true)
	await process_frame
	check(world.boss() == null and world._left_open(), "Rientro: boss non ricompare e uscita aperta")
	var state := {"checkpoint":{"room":15,"x":160,"y":956}, "coins":world.coins,
		"cleared":world.cleared, "defeated":world.defeated, "stations":world.stations,
		"vars":world.story.vars, "seen":world.story.seen, "upgrades":world.upgrades,
		"equipped":world.equipped, "choice_uses":world.choice_uses}
	var restored: Dictionary = JSON.parse_string(JSON.stringify(state))
	world._restore_state(restored)
	await process_frame
	check(world.room_index == 15 and world.room_cleared and world.boss() == null,
		"Caricamento dello stato serializzato conserva la vittoria")
	main.queue_free()
	await process_frame
	print("ratking_test: %d fallimenti" % failures)
	quit(1 if failures else 0)
