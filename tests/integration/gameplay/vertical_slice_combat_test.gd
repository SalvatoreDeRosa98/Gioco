extends SceneTree
## Vertical slice: guardia nelle Cisterne Reali (stanza 9) per insegnare la parata,
## seconda fase di Ratking sotto la soglia di vita e tetto dei ratti evocati vivi.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	var T: Dictionary = root.get_node("Tuning").data
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.set_process(false)
	world.set_physics_process(false)

	# 1. Stanza 9: un lanterniere e una guardia (6 HP, stoccata parabile).
	world._go(9, true)
	await process_frame
	var kinds := {}
	var guard: Node = null
	for e in get_nodes_in_group("enemies"):
		kinds[e.kind] = int(kinds.get(e.kind, 0)) + 1
		if e.kind == "guardia":
			guard = e
	check(int(kinds.get("lanterniere", 0)) == 1, "Stanza 9: resta un solo lanterniere (%s)" % [kinds])
	check(int(kinds.get("guardia", 0)) == 1, "Stanza 9: c'è una guardia")
	if guard:
		check(guard.max_hp == 6, "La guardia ha 6 HP")
		var p = world.player
		p.dead = false
		p.iframes = 0.0
		p.invulnerable = false
		p.teleport(guard.position + Vector2(-60, 0))
		p.facing = 1.0
		p.parry_window = float(T.player.parry_window)
		var hp_before: int = p.hp
		world.boss_sword_hit(guard.position, guard.position + Vector2(-95, 16), guard.position.x)
		check(p.hp == hp_before, "La stoccata della guardia si para")
		p.parry_window = 0.0
		p.iframes = 0.0
		world.boss_sword_hit(guard.position, guard.position + Vector2(-95, 16), guard.position.x)
		check(p.hp == hp_before - 1, "Senza parata la stoccata ferisce")

	# 2. Ratking: soglia della fase 2.
	var rk = load("res://game/ratking.gd").new()
	world.room_index = 15
	rk.setup({"pos": Vector2(800, 900)}, world)
	world._entities.add_child(rk)
	await process_frame
	check(rk.max_hp == int(T.ratking.hp), "HP di Ratking dal tuning")
	var threshold := int(ceil(rk.max_hp * float(T.ratking.phase2_threshold)))
	rk.take_hit(rk.max_hp - threshold - 1)
	check(rk.phase == 1, "Sopra la soglia resta in fase 1 (hp %d)" % rk.hp)
	rk.take_hit(1)
	check(rk.phase == 2 and rk._state == "roar", "A metà vita entra in fase 2 col ruggito (hp %d)" % rk.hp)
	check(float(rk.v("windup")) < float(T.ratking.windup), "Fase 2 più aggressiva: preavviso più breve")
	check(rk.v("pattern") != T.ratking.pattern, "Fase 2 con pattern diverso")

	# 3. Tetto dei ratti vivi.
	var cap := int(rk.v("max_rats_alive"))
	for i in 5:
		rk._call_rats()
	check(rk.rats_alive() == cap, "Ratti vivi fermi al tetto %d (sono %d)" % [cap, rk.rats_alive()])
	for r in get_nodes_in_group("rat_swarm"):
		r.queue_free()
	await process_frame
	rk.phase = 1
	rk._call_rats()
	check(rk.rats_alive() == mini(int(T.ratking.rats_per_call), int(T.ratking.max_rats_alive)), "Fase 1: evoca rats_per_call ratti")

	print("VERTICAL SLICE COMBAT TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
