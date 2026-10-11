extends SceneTree
## Prove fisiche delle risalite, del trasporto e del menu pad; niente salvataggi su disco.
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
	await process_frame
	main._play_button.grab_focus()
	var down := InputEventJoypadButton.new()
	down.button_index = JOY_BUTTON_DPAD_DOWN
	down.pressed = true
	main._input(down)
	check(root.gui_get_focus_owner().text == "Nuova partita", "Pad sposta il focus nel menu")
	var accept := InputEventJoypadButton.new()
	accept.button_index = JOY_BUTTON_A
	accept.pressed = true
	main._input(accept)
	check(main._world != null, "A/Croce avvia la nuova partita")
	var w = main._world
	w.set_process(false)
	w.set_physics_process(false)
	w.player.invulnerable = true
	check(not w._left_open(), "Piazza: cancello sinistro inizialmente chiuso")
	w.story.seen["visited_1"] = 1
	check(w._left_open(), "Corso scoperto: cancello sinistro di Piazza aperto")
	w.player.position = Vector2(40,956)
	w._check_doors()
	check(w.room_index == 1, "Cancello sinistro conduce a Corso Trieste")
	check(w.buy_item("grapple") != "Acquisto completato", "Rampino non acquistabile")
	for idx in range(Room.COUNT):
		for enemy: Dictionary in Room.build(idx).enemies:
			check(enemy.type != "spettro" or idx == 12,"Spirito solo nel campanile")
	w._go(13,true)
	await process_frame
	w._clear_hostile()
	await process_frame
	check(not w.room.vertical[0].open,"Risalita bloccata senza rampino")
	w.player.teleport(Vector2(570,1976))
	w.player.set_physics_process(true)
	Input.action_press("jump")
	await physics_frame
	Input.action_release("jump")
	var highest := 1976.0
	for i in 70:
		if i == 12: Input.action_press("jump")
		if i == 13: Input.action_release("jump")
		await physics_frame
		highest = minf(highest,w.player.position.y)
	check(highest > 1710,"Doppio salto non raggiunge il primo appoggio")
	w.upgrades["grapple"] = true
	w.story.seen["ratking_defeated"] = 1
	w._go(13,true)
	await process_frame
	w._clear_hostile()
	await process_frame
	w.player.teleport(Vector2(570,1976))
	w.player.set_physics_process(true)
	Input.action_press("grapple")
	for i in 360:
		await physics_frame
		if w.player.position.y < 0: break
	Input.action_release("grapple")
	print("cistern climb endpoint: ", w.player.position)
	check(w.player.position.y < 30,"Rampino risale l'intero pozzo")
	w._go(3,true)
	await process_frame
	w._clear_hostile()
	await process_frame
	w.player.teleport(Vector2(2230,956))
	Input.action_press("grapple")
	for i in 300:
		await physics_frame
		if w.player.position.y < 0: break
	Input.action_release("grapple")
	print("belvedere climb endpoint: ",w.player.position)
	check(w.player.position.y < 30,"Dalla fidanzata si risale fino al varco del campanile")
	w._go(10,true)
	await process_frame
	w._clear_hostile()
	await process_frame
	var platform = w._expedition.get_child(0)
	platform._elapsed = 0
	platform.position = platform._origin
	w.player.teleport(platform.position-Vector2(0,26))
	w.player.velocity = Vector2.ZERO
	var start_x: float = w.player.position.x
	for i in 150: await physics_frame
	check(w.player.is_on_floor() and w.player.position.x > start_x+100,"La passerella trasporta Ferruccio")
	print("platform endpoint: ",platform.position," player: ",w.player.position)
	check(absf(w.player.position.y+24-570)<40,"Passerella arriva all'altezza della leva")
	w.player.teleport(Vector2(1200,546))
	for i in 4: await physics_frame
	w._expedition._process(.1)
	check(w._expedition.selected >= 0,"Leva selezionabile da un appoggio fisso")
	w._expedition.activate(w._expedition.marks[0])
	check(w.story.times_seen("loom")>0,"Leva azionabile")
	w._dialogue._open = false
	w.hold(false)
	w.story.seen["mother_defeated"] = 1
	check(w._right_open(),"Telaio e Madre aprono la via agli Archivi")
	var entries: Array = w._map.quest_entries()
	check(entries.any(func(q): return q.key == "loom" and q.done),"Registro aggiorna il telaio")
	w._go(12,true)
	await process_frame
	var statue
	for enemy in get_nodes_in_group("enemies"):
		if enemy.kind == "statua": statue = enemy
	check(statue != null,"Statua presente per la prova")
	var original: Vector2 = statue.position
	for i in 60: await physics_frame
	check(statue.position.distance_to(original)<1,"Statua non cade dalle piattaforme")
	main.queue_free()
	await process_frame
	print("progression_routes_test: %d fallimenti" % failures)
	quit(1 if failures else 0)
