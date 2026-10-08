extends SceneTree
## Accesso al Cortile e danni del Custode: corpo innocuo, lama attiva una sola volta.
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
	world.set_process(false)
	world.set_physics_process(false)
	world._go(3, true)
	check(not world._right_open(), "Cortile chiuso prima del ricordo")
	var player = world.player
	player.set_physics_process(false)
	player.position = Vector2(world.room.size.x - 55, world.room.floor - 24)
	world._check_doors()
	check(world.room_index == 3, "Il confine non permette di saltare l'obiettivo")
	for decision in ["conservato", "bruciato"]:
		world.story.set_var("father_registry", decision)
		world._refresh_choice_effects()
		check(world._right_open(), "Entrambe le decisioni aprono il Cortile: " + decision)
	world._go(4, true)
	await process_frame
	player.set_physics_process(false)
	var boss
	for enemy in get_nodes_in_group("enemies"):
		enemy.set_physics_process(false)
		if enemy.kind == "custode":
			boss = enemy
	check(boss != null and boss.hp == 36, "Vita del Custode riequilibrata")
	player.position = boss.position
	var health: int = player.hp
	world._check_contacts()
	check(player.hp == health, "Toccare il Custode non ferisce")
	boss.facing = 1
	boss._state = "sword_windup"
	boss._state_t = 0.3
	boss._ai_custode(0)
	check(player.hp == health, "Preparazione del fendente innocua")
	boss._state = "sword_swing"
	boss._state_t = float(boss._cfg.sword_swing) * (1.3 / 2.45)
	boss._sword_hit = false
	player.position = boss.position + Vector2(75, -8)
	player.iframes = 0
	boss._ai_custode(0)
	check(player.hp == health - 1, "Lama attiva causa una maschera di danno")
	player.iframes = 0
	boss._ai_custode(0)
	check(player.hp == health - 1, "Un solo colpo per fendente")
	boss._sword_hit = false
	player.iframes = 0
	player.facing = -1
	player.parry_window = 0.15
	boss._ai_custode(0)
	check(player.hp == health - 1 and boss._sword_hit, "La parata annulla e consuma il fendente")
	check(int(boss._cfg.burst_count) == 6 and float(boss._cfg.burst_speed) == 210, "Raffica ridotta e rallentata")
	main.queue_free()
	await process_frame
	print("BOSS GATE TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
