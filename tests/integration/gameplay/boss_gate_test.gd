extends SceneTree
## Accesso al Cortile e danni del Custode: danno da contatto, arena chiusa e lama attiva una sola volta.
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
	world._go(Room.ARCHIVES_ROOM, true)
	check(not world._right_open(), "Cortile chiuso prima del ricordo")
	var player = world.player
	player.set_physics_process(false)
	player.position = Vector2(world.room.size.x - 55, world.room.floor - 24)
	world._check_doors()
	check(world.room_index == Room.ARCHIVES_ROOM, "Il confine non permette di saltare l'obiettivo")
	for id in ["archive_1", "archive_2", "archive_3"]:
		world.story.mark_seen(id)
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
	world._arena.activate()
	check(world.arena_active and not world._left_open(), "L'arena chiude l'ingresso")
	check(world.room.ledges.size() == 3 and world.is_solid(Vector2(200,900)), "Il Cortile cambia assetto fisico")
	check(boss.speed >= 200, "Custode più che raddoppiato in velocità")
	player.position = boss.position
	var health: int = player.hp
	world._check_contacts()
	check(player.hp == health - 1, "Toccare il Custode ferisce")
	health = player.hp
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
	check(int(boss._cfg.burst_count) == 6 and float(boss._cfg.burst_speed) == 270, "Raffica più veloce ma ancora leggibile")
	var shortcut := InputEventKey.new()
	shortcut.keycode = KEY_F12
	shortcut.ctrl_pressed = true
	shortcut.shift_pressed = true
	shortcut.pressed = true
	world._input(shortcut)
	player.iframes = 0
	player.parry_window = 0
	world._hurt_player(99, player.position.x - 30)
	player.take_damage(99)
	check(player.invulnerable and player.hp == player.max_hp and not player.dead, "Comando nascosto protegge da ogni danno")
	world._go(0, true)
	check(player.invulnerable, "Modalità sviluppatore mantiene la protezione cambiando stanza")
	shortcut.echo = true
	world._input(shortcut)
	check(player.invulnerable, "La ripetizione del tasto non disattiva la modalità")
	shortcut.echo = false
	world._input(shortcut)
	player.take_damage(1)
	check(not player.invulnerable and player.hp == player.max_hp - 1, "Stesso comando ripristina i danni normali")
	main.queue_free()
	await process_frame
	print("BOSS GATE TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
