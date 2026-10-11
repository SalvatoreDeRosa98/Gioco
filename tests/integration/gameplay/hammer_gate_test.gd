extends SceneTree
## Martello obbligatorio: nella Galleria degli Orologi la memoria dell'orologiaio (sigillo richiesto
## dal Cortile) è chiusa fra due muri incrinati. Senza martello non si passa, con il martello sì.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(value: bool, description: String) -> void:
	print(("ok    " if value else "FAIL  ") + description)
	if not value:
		failures += 1
		push_error(description)

func _walk(world, action: String, seconds: float) -> void:
	Input.action_press(action)
	var t := 0.0
	while t < seconds:
		await physics_frame
		t += 1.0 / 60.0
	Input.action_release(action)
	await physics_frame

func _hammer(world) -> void:
	Input.action_press("hammer")
	await physics_frame
	Input.action_release("hammer")
	for i in 40:
		await physics_frame

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.save_path = "user://hammer-gate-test.json"
	world.upgrades.erase("hammer")
	world.upgrades["grapple"] = true
	world._go(14, true)
	await process_frame
	for e in get_nodes_in_group("enemies"):
		e.queue_free()
	var player = world.player
	player.invulnerable = true
	var ids := []
	for c in world.traversal.cracks:
		ids.append(c.id)
	check("clock_wall_west" in ids and "clock_wall_east" in ids, "La Galleria ha i due muri incrinati che chiudono la memoria")
	var memory_x := 1450.0
	# Da sinistra, senza martello.
	player.global_position = Vector2(1100, 950)
	await _walk(world, "move_right", 2.0)
	check(player.global_position.x < 1260.0, "Senza martello il muro ovest blocca (x=%.0f)" % player.global_position.x)
	world.traversal._crack_hint_cd = 0.0
	await physics_frame
	await physics_frame
	check(world._hud._toast_text.contains("serve il martello"), "Toccando il muro compare l'avviso: " + world._hud._toast_text)
	# Salto e rampino non scavalcano il muro.
	for i in 3:
		Input.action_press("move_right")
		Input.action_press("jump")
		for k in 30:
			await physics_frame
		Input.action_release("jump")
		for k in 30:
			await physics_frame
		Input.action_release("move_right")
	check(player.global_position.x < 1260.0, "Saltare non aggira il muro (x=%.0f)" % player.global_position.x)
	# Da destra, senza martello.
	# Sopra il gradino (1650..1800, y 870) il muro est chiude il passaggio.
	player.global_position = Vector2(1780, 840)
	player.velocity = Vector2.ZERO
	await _walk(world, "move_left", 2.0)
	check(player.global_position.x > 1720.0, "Senza martello il muro est blocca (x=%.0f)" % player.global_position.x)
	await _hammer(world)
	check(world.story.times_seen("clock_wall_east") == 0, "V senza martello non rompe nulla")
	# Con il martello.
	world.upgrades["hammer"] = true
	player.global_position = Vector2(1780, 840)
	await _walk(world, "move_left", 0.6)
	await _hammer(world)
	check(world.story.times_seen("clock_wall_east") > 0, "Il martello rompe il muro est")
	await _walk(world, "move_left", 1.5)
	check(player.global_position.x < 1660.0 and player.global_position.x > 1320.0, "Dopo il muro si raggiunge la memoria (x=%.0f, memoria a %.0f)" % [player.global_position.x, memory_x])
	main.queue_free()
	await process_frame
	print("HAMMER GATE TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)