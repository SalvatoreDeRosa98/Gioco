extends SceneTree
## Traversal fisico, persistenza degli attrezzi e sincronizzazione dei fendenti.
var failures := 0
var world
var player
var hits := 0
func _initialize() -> void:
	_run.call_deferred()
func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)
func key(code: Key, pressed: bool) -> void:
	var event := InputEventKey.new()
	event.keycode = code
	event.physical_keycode = code
	event.pressed = pressed
	Input.parse_input_event(event)
func jump_to(point: Vector2) -> bool:
	Input.action_press("jump")
	await create_timer(0.20).timeout
	Input.action_release("jump")
	var elapsed := 0.0
	var second := false
	while elapsed < 1.9:
		var dx: float = point.x - player.position.x
		Input.action_release("move_left")
		Input.action_release("move_right")
		if absf(dx) > 12:
			Input.action_press("move_right" if dx > 0 else "move_left")
		if elapsed > 0.04 and not second:
			Input.action_press("jump")
			second = true
		elif second and elapsed > 0.38:
			Input.action_release("jump")
		await create_timer(0.03).timeout
		elapsed += 0.03
		if elapsed > 0.4 and player.is_on_floor() and absf(player.position.y + 24 - point.y) < 5 and absf(player.position.x - point.x) < 20:
			Input.action_release("move_left")
			Input.action_release("move_right")
			return true
	Input.action_release("move_left")
	Input.action_release("move_right")
	print("Jump failed at ", player.position, " physics=", player.is_physics_processing(), " floor=", player.is_on_floor(), " target=", point)
	return false
func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	world = main._world
	player = world.player
	world.save_path = "user://metroidvania-test.json"
	world.set_physics_process(false)
	world.set_process(false)
	player.invulnerable = true
	world._go(5, true)
	world._save_at(Vector2(110,980))
	check(world.buy_item("grapple").begins_with("Acquisto completato"), "Catena ottenibile gratuitamente nella fucina")
	check(not world.buy_item("hammer").begins_with("Acquisto completato"), "Martello richiede il progetto")
	world.story.seen.hammer_plan = 1
	world.story.seen.sluice = 1
	world.buy_item("hammer")
	world.buy_item("wall_grip")
	world._restore_save()
	check(world.upgrades.has_all(["grapple", "hammer", "wall_grip"]), "Attrezzi persistono senza occupare accessori")
	world._go(12, true)
	await process_frame
	for enemy in get_nodes_in_group("enemies"): enemy.queue_free()
	player.teleport(Vector2(300,2270))
	player.set_physics_process(true)
	await create_timer(0.2).timeout
	# Salita completa usando la fisica del giocatore, senza teletrasporto tra mensole.
	for i in range(15):
		Input.action_release("jump")
		await create_timer(0.12).timeout
		var point := Vector2(535 if i % 2 == 0 else 785,2180-i*140)
		var reached := await jump_to(point)
		check(reached, "Campanile, mensola %d" % i)
		if not reached: break
	var reached_top := await jump_to(Vector2(640,150))
	check(reached_top, "Pianerottolo superiore del campanile raggiungibile")
	# Tutte le aperture conducono a un punto stabile e non respingono nella stanza precedente.
	for idx in [3,9,11,12,13,14]:
		for exit in Room.build(idx).vertical:
			world._go(idx,true)
			player.teleport(Vector2(exit.x, -1 if exit.side == "top" else world.room.floor+45))
			world._check_doors()
			check(world.room_index == int(exit.target), "Uscita verticale %d verso %d" % [idx,exit.target])
			for enemy in get_nodes_in_group("enemies"): enemy.queue_free()
			await create_timer(0.6).timeout
			world._check_doors()
			check(world.room_index == int(exit.target), "Arrivo stabile dopo il cambio area")
	world._go(12,true)
	player.teleport(Vector2(50,1800))
	Input.action_press("move_left")
	await create_timer(0.25).timeout
	check(player.wall_gripping and player.velocity.y <= 66,"Guanti rallentano la discesa contro il muro")
	Input.action_press("jump")
	await create_timer(0.04).timeout
	Input.action_release("jump")
	Input.action_release("move_left")
	check(player.velocity.x > 0 and player.velocity.y < 0,"Salto dal muro spinge lontano dalla parete")
	world._go(13,true)
	player.teleport(Vector2(550,1955))
	player.attacking=0.2
	player.attack_down=true
	world.traversal._physics_process(0.016)
	check(player.velocity.y < 0 and player._air_jumps > 0,"Pogo sugli spuntoni restituisce il salto")
	world._go(3,true)
	player.teleport(Vector2(1510,450))
	await physics_frame
	check(world.traversal.anchor(player.position,420) != Vector2.INF,"Anello raggiungibile dal ballatoio")
	key(KEY_Q,true)
	await create_timer(0.12).timeout
	check(player.velocity.y < -300 and player.grapple_anchor != Vector2.INF,"Q tira fisicamente la catena")
	key(KEY_Q,false)
	world._go(7,true)
	player.teleport(Vector2(1690,950))
	await create_timer(0.15).timeout
	key(KEY_V,true)
	await create_timer(0.28).timeout
	key(KEY_V,false)
	check(world.story.times_seen("market_wall") == 1,"Martello rompe il calcare")
	world._go(0,true)
	for enemy in get_nodes_in_group("enemies"): enemy.queue_free()
	player.teleport(Vector2(160,950))
	await create_timer(0.25).timeout
	player.hp=3
	player.embers=4
	key(KEY_R,true)
	await create_timer(1.0).timeout
	key(KEY_R,false)
	check(player.hp == 4 and player.embers == 0,"R consuma 4 braci e cura una maschera")
	player.slash_requested.connect(func(_p, _f, _d, _a): hits += 1)
	Input.action_press("attack")
	await create_timer(0.04).timeout
	Input.action_release("attack")
	check(hits==0,"Preparazione del fendente senza danno anticipato")
	await create_timer(0.2).timeout
	check(hits==1,"Un solo danno nella fase attiva del fendente")
	world._map.toggle()
	check(world.is_talking() and not player.is_physics_processing(),"Mappa ferma il mondo")
	world._map.toggle()
	check(player.is_physics_processing(),"Chiudere la mappa restituisce il controllo")
	world._save_at(Vector2(160,980))
	world.story.seen.clear()
	world._restore_save()
	check(world.story.times_seen("market_wall") == 1 and world.story.times_seen("visited_12") == 1,"Muri e mappa persistono al caricamento")
	DirAccess.remove_absolute(world.save_path)
	main.queue_free()
	await process_frame
	print("METROIDVANIA TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
