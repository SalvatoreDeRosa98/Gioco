extends SceneTree
## Cavaliere Borbonico: nome in barra, barra della vita sul CanvasLayer più alto e salti sulle
## mensole dell'arena per seguire Ferruccio (salita e discesa), con danno da contatto intatto.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(value: bool, description: String) -> void:
	print(("ok    " if value else "FAIL  ") + description)
	if not value:
		failures += 1
		push_error(description)

func _feet(boss) -> float:
	return boss.global_position.y + boss.half.y

func _wait_boss(boss, cond: Callable, seconds: float) -> bool:
	var t := 0.0
	while t < seconds and not cond.call():
		await physics_frame
		t += 1.0 / 60.0
	return cond.call()

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.save_path = "user://cavaliere-borbonico-test.json"
	for id in ["archive_1", "archive_2", "archive_3"]:
		world.story.mark_seen(id)
	for id in Room.Expansion.DISTRICT_SEALS:
		world.story.mark_seen(id)
	world.story.set_var("father_registry", "conservato")
	world._go(4, true)
	await process_frame
	var player = world.player
	player.invulnerable = true
	var boss
	for enemy in get_nodes_in_group("enemies"):
		if enemy.kind == "custode":
			boss = enemy
	check(boss != null, "Il boss del Cortile esiste")
	world._arena.activate()
	boss._state = "walk"
	boss._state_t = 99.0
	await process_frame
	await process_frame

	# Barra della vita: nome e livello più alto fra quelli di gioco.
	check(world.boss_bar_layer != null and world.boss_bar_layer.get_child(0).boss_title() == "CAVALIERE BORBONICO", "La barra mostra CAVALIERE BORBONICO")
	var top := -1000
	for node in root.find_children("*", "CanvasLayer", true, false):
		if node != world.boss_bar_layer and node.layer < 40:
			top = maxi(top, node.layer)
	check(world.boss_bar_layer.layer > top and world.boss_bar_layer.layer > world._dialogue.layer, "La barra del boss è sopra HUD, dialoghi e dissolvenza (%d > %d)" % [world.boss_bar_layer.layer, top])
	check(world._hud.get_parent().layer < world.boss_bar_layer.layer, "L'HUD è sotto la barra del boss")

	# Salita: Ferruccio sulla mensola alta (820..1100, y 620), il Cavaliere a terra.
	boss.global_position = Vector2(700, float(world.room.floor) - boss.half.y)
	boss.velocity = Vector2.ZERO
	player.global_position = Vector2(960, 620 - 24)
	player.velocity = Vector2.ZERO
	await _wait_boss(boss, func() -> bool: return player.is_on_floor(), 1.0)
	var saw_jump := [false]
	var ok_up: bool = await _wait_boss(boss, func() -> bool:
		if boss._state in ["jump_windup", "platform_jump"]:
			saw_jump[0] = true
		boss._state_t = maxf(boss._state_t, 0.05) if boss._state == "walk" else boss._state_t
		return boss.is_on_floor() and absf(_feet(boss) - 620.0) < 10.0, 5.0)
	check(saw_jump[0], "Il Cavaliere telegrafa e salta verso la mensola di Ferruccio")
	check(ok_up and boss.global_position.x > 820 and boss.global_position.x < 1100, "Il Cavaliere atterra sulla mensola alta (piedi y=%.0f x=%.0f)" % [_feet(boss), boss.global_position.x])

	# Salita da mensola laterale: Ferruccio sulla mensola bassa sinistra (300..540, y 860).
	player.global_position = Vector2(400, 860 - 24)
	player.velocity = Vector2.ZERO
	boss._climb_cd = 0.0
	var ok_side: bool = await _wait_boss(boss, func() -> bool:
		boss._state_t = maxf(boss._state_t, 0.05) if boss._state == "walk" else boss._state_t
		return boss.is_on_floor() and absf(_feet(boss) - 860.0) < 10.0 and boss.global_position.x < 560, 7.0)
	check(ok_side, "Il Cavaliere segue Ferruccio sulla mensola laterale (piedi y=%.0f x=%.0f)" % [_feet(boss), boss.global_position.x])

	# Discesa: Ferruccio torna a terra, il Cavaliere scende dalla mensola.
	player.global_position = Vector2(900, float(world.room.floor) - 24)
	player.velocity = Vector2.ZERO
	var ok_down: bool = await _wait_boss(boss, func() -> bool:
		boss._state_t = maxf(boss._state_t, 0.05) if boss._state == "walk" else boss._state_t
		return boss.is_on_floor() and absf(_feet(boss) - float(world.room.floor)) < 10.0, 6.0)
	check(ok_down, "Il Cavaliere scende dalle mensole per inseguire Ferruccio (piedi y=%.0f)" % _feet(boss))
	check(boss.get_collision_mask_value(boss.LEDGE_LAYER), "Dopo la discesa le mensole tornano solide per il Cavaliere")

	# Danno da contatto e velocità invariati.
	player.invulnerable = false
	player.iframes = 0
	player.global_position = boss.global_position
	var hp: int = player.hp
	world._check_contacts()
	check(player.hp == hp - 1 and boss.speed >= 200, "Contatto ancora dannoso e boss veloce")
	main.queue_free()
	await process_frame
	print("CAVALIERE BORBONICO TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)