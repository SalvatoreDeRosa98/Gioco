extends SceneTree
## Test del game feel: valori di tuning nelle fasce di progetto e comportamento di
## startup del fendente, input buffer dell'attacco, parata e knockback.

var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func in_range(v: float, lo: float, hi: float, name: String) -> void:
	check(v >= lo - 0.0001 and v <= hi + 0.0001, "%s = %s fuori da [%s, %s]" % [name, v, lo, hi])

func _run() -> void:
	var p: Dictionary = root.get_node("Tuning").data.player
	var f: Dictionary = root.get_node("Tuning").data.feel
	in_range(float(p.attack_startup), 0.05, 0.07, "attack_startup")
	in_range(float(p.attack_buffer), 0.1, 0.12, "attack_buffer")
	in_range(float(p.jump_buffer), 0.1, 0.12, "jump_buffer")
	in_range(float(p.coyote), 0.08, 0.1, "coyote")
	in_range(float(p.dash_cooldown), 0.5, 0.6, "dash_cooldown")
	in_range(float(p.respawn_delay), 0.8, 1.2, "respawn_delay")
	in_range(float(p.parry_window), 0.15, 0.2, "parry_window")
	for k in ["hitstop_hit", "hitstop_kill", "hitstop_hurt", "hitstop_parry"]:
		in_range(float(f[k]), 0.05, 0.08, k)
	check(float(root.get_node("Tuning").data.progression.boots_dash_cooldown) < float(p.dash_cooldown), "Gli stivali migliorano lo scatto")
	check(float(p.attack_startup) < float(p.attack_time), "Startup dentro la durata dell'attacco")

	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	var player = world.player
	world.set_physics_process(false)
	for e in get_nodes_in_group("enemies"):
		e.queue_free()
	await process_frame
	player.teleport(Vector2(500, 500))

	# Startup: il fendente parte dopo attack_startup, non prima.
	var fired := [0.0]
	var elapsed := [0.0]
	player.slash_requested.connect(func(_a, _b, _c, _d): if fired[0] == 0.0: fired[0] = elapsed[0])
	player._attack_cd = 0.0
	Input.action_press("attack")
	var dt := 1.0 / 120.0
	for i in 60:
		elapsed[0] += dt
		player._physics_process(dt)
		if i == 0:
			Input.action_release("attack")
		if fired[0] > 0.0:
			break
	check(fired[0] > 0.0, "Il fendente parte")
	check(fired[0] <= float(p.attack_startup) + 2.0 * dt, "Startup del fendente %.3f s <= %.3f s" % [fired[0], float(p.attack_startup)])

	# Input buffer: premuto durante la ricarica, parte appena finisce.
	player.attacking = 0.0
	player._attack_cd = float(p.attack_buffer) * 0.5
	Input.action_press("attack")
	player._physics_process(dt)
	Input.action_release("attack")
	var started := false
	for i in int(float(p.attack_buffer) / dt):
		player._physics_process(dt)
		if player.attacking > 0.0 and player._attack_cd > float(p.attack_cooldown) - 2.0 * dt:
			started = true
			break
	check(started, "Attacco bufferizzato eseguito a fine ricarica")

	# Parata: ricarica e invulnerabilità dal tuning.
	player.parry_window = float(p.parry_window)
	player.facing = 1.0
	check(player.try_parry(player.global_position.x + 20.0), "Parata frontale")
	check(is_equal_approx(player.iframes, float(p.parry_success_iframes)), "Invulnerabilità post-parata dal tuning")

	# Knockback del danno dal tuning.
	player.knock(1.0)
	check(is_equal_approx(player.velocity.x, float(p.hurt_knockback_x)) and is_equal_approx(player.velocity.y, float(p.hurt_knockback_y)), "Knockback dal tuning")

	Engine.time_scale = 1.0
	print("combat_feel_test: %d errori" % failures)
	quit(1 if failures > 0 else 0)
