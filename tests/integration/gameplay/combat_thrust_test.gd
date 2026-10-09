extends SceneTree
## Test per il game feel del combattimento: accuratezza delle hitbox dell'affondo ('slash_a'),
## fendente ('slash_b'), colpo in picchiata (pogo), hit-stop e camera trauma.

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
	var player = world.player

	world.set_physics_process(false)
	player.set_physics_process(false)

	# Pulizia nemici iniziali della stanza
	for e in get_nodes_in_group("enemies"):
		e.queue_free()
	await process_frame

	var base_pos := Vector2(500.0, 500.0)
	player.teleport(base_pos)
	player.facing = 1.0

	# 1. Verifica estensione della hitbox dell'affondo ('slash_a', player.slash_side > 0)
	# Il centro dell'affondo è a +64 con half.x 48, portata massima orizzontale = 500 + 64 + 48 = 612.
	# Il vecchio fendente arrivava a 500 + 46 + 38 = 584.
	# Creiamo un nemico di test a x = 600 (a portata di affondo, ma fuori dalla portata del fendente).
	var EnemyClass = load("res://game/enemy.gd")
	var dummy_thrust = EnemyClass.new()
	dummy_thrust.setup({"type": "gatto", "pos": Vector2(610.0, 490.0)}, world)
	world._entities.add_child(dummy_thrust)
	dummy_thrust.hp = 10

	# Tentativo 1 con fendente (slash_side = -1.0): NON deve colpire dummy a 600
	player.slash_side = -1.0
	var hp_before: int = dummy_thrust.hp
	world._do_slash(player.global_position, player.facing, false, false)
	check(dummy_thrust.hp == hp_before, "Il fendente non raggiunge nemici oltre la sua portata (x=600)")

	# Tentativo 2 con affondo (slash_side = 1.0): DEVE colpire dummy a 600
	player.slash_side = 1.0
	player._trauma = 0.0
	world._do_slash(player.global_position, player.facing, false, false)
	check(dummy_thrust.hp < hp_before, "L'affondo ('slash_a') raggiunge il bersaglio distante grazie all'allungo di ~84 unità")
	check(player._trauma >= 0.35, "L'impatto applica camera trauma (almeno 0.35)")
	check(is_equal_approx(Engine.time_scale, 0.05), "L'impatto attiva il micro-freeze di hit-stop (time_scale = 0.05)")

	# Aspetta la fine del timer di hit-stop
	await create_timer(0.1, true, false, true).timeout
	check(is_equal_approx(Engine.time_scale, 1.0), "A fine hit-stop la velocità del gioco torna normale (time_scale = 1.0)")

	dummy_thrust.queue_free()

	# 2. Verifica colpo in picchiata (pogo, down = true)
	var dummy_pogo = EnemyClass.new()
	dummy_pogo.setup({"type": "gatto", "pos": Vector2(500.0, 540.0)}, world)
	world._entities.add_child(dummy_pogo)
	dummy_pogo.hp = 5
	var pogo_hp_before: int = dummy_pogo.hp
	world._do_slash(player.global_position, player.facing, true, true)
	check(dummy_pogo.hp < pogo_hp_before, "Il colpo verso il basso (pogo) colpisce sotto i piedi")

	dummy_pogo.queue_free()
	main.queue_free()
	await process_frame

	print("COMBAT THRUST TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
