extends SceneTree
## Prove fisiche: doppio salto fino alla chiusa e raccolta reale dei frammenti con W.
var failures := 0
var world
var player
func _initialize() -> void:
	_run.call_deferred()
func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)
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
	world.set_physics_process(false)
	player.invulnerable = true
	world._go(9, true)
	await process_frame
	for e in get_nodes_in_group("enemies"):
		e.queue_free()
	player.teleport(Vector2(330, 950))
	player.set_physics_process(true)
	await create_timer(0.15).timeout
	for point in [Vector2(330,860),Vector2(590,750),Vector2(850,640),Vector2(1110,530),Vector2(1400,420)]:
		var reached := await jump_to(point)
		check(reached, "Salto reale verso la chiusa: " + str(point))
		if not reached:
			break
	await create_timer(0.1).timeout
	Input.action_press("interact")
	world._process(0.016)
	await create_timer(0.04).timeout
	Input.action_release("interact")
	check(world.story.times_seen("sluice") > 0 and world.is_talking(), "W aziona la chiusa raggiunta saltando")
	for i in 20:
		world._dialogue.debug_skip()
	await create_timer(0.3).timeout
	check(player.is_physics_processing() and not world.is_talking(), "La lettura restituisce il controllo")
	world._go(11, true)
	world.story.set_var("father_registry", "conservato")
	await process_frame
	for e in get_nodes_in_group("enemies"):
		e.queue_free()
	for marker in world._expedition.marks.duplicate(true):
		if marker.kind != "fragment":
			continue
		player.teleport(Vector2(marker.pos[0], marker.pos[1] - 25))
		player.set_physics_process(true)
		await create_timer(0.2).timeout
		Input.action_press("interact")
		world._process(0.016)
		await create_timer(0.04).timeout
		Input.action_release("interact")
		check(world.story.times_seen(marker.id) == 1, "Frammento raccolto con W: " + marker.id)
		for i in 20:
			world._dialogue.debug_skip()
		await create_timer(0.3).timeout
	check(world._right_open(), "Tre frammenti e ricordo aprono fisicamente il Cortile")
	main.queue_free()
	await process_frame
	print("TRAVERSAL TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
