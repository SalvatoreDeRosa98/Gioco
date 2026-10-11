extends SceneTree
## Guanti (wall_grip) con la fisica del giocatore: presa solo sulle superfici marcate (Markers/Climb).
## Bordi della stanza e muri non marcati: nessuna presa, la discesa non rallenta.
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
	world.save_path = "user://climb-test.json"
	world.upgrades["wall_grip"] = true
	var player = world.player
	player.invulnerable = true
	# [stanza, posizione, tasto, deve fare presa, descrizione]
	var cases := [
		[12, Vector2(50, 1800), "move_left", false, "Campanile: bordo sinistro della stanza"],
		[12, Vector2(1230, 1800), "move_right", false, "Campanile: bordo destro della stanza"],
		[12, Vector2(340, 1060), "move_left", false, "Campanile: muro incrinato della nicchia (non marcato)"],
		[13, Vector2(735, 1930), "move_left", false, "Cisterne Sepolte: muretto (non marcato)"],
		[12, Vector2(600, 150), "move_left", true, "Campanile: parete sinistra del camino d'uscita"],
		[12, Vector2(744, 150), "move_right", true, "Campanile: parete destra del camino d'uscita"],
		[9, Vector2(2266, 400), "move_left", true, "Cisterne Reali: parete del camino"],
	]
	for c in cases:
		world._go(c[0], true)
		await process_frame
		for e in get_nodes_in_group("enemies"):
			e.queue_free()
		player.teleport(c[1])
		player.velocity = Vector2.ZERO
		player.set_physics_process(true)
		Input.action_press(c[2])
		var gripped := false
		var on_wall := false
		for i in 18:
			await physics_frame
			gripped = gripped or player.wall_gripping
			on_wall = on_wall or player.is_on_wall()
		Input.action_release(c[2])
		check(on_wall, "%s: il giocatore tocca il muro" % c[4])
		check(gripped == c[3], "%s: presa %s" % [c[4], "attesa" if c[3] else "NON attesa"])
		if not c[3]:
			check(player.velocity.y > 66.0 or player.is_on_floor(), "%s: la discesa non rallenta (vy=%.0f)" % [c[4], player.velocity.y])
	main.queue_free()
	await process_frame
	print("level_climb_test: %d fallimenti" % failures)
	quit(1 if failures else 0)
