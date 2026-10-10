extends SceneTree
## Le clip seguono la vera IA di guardie, lanciatori, duellante e Custode.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

## Registra gli errori di integrazione senza fermarsi al primo avversario.
func check(ok: bool,message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var w = main._world
	w.set_process(false)
	w.set_physics_process(false)
	w.player.set_physics_process(false)
	w.player.invulnerable = true
	w.introduction.set_physics_process(false)
	for kind in ["guardia","capitano","madre","cavaliere","spettro"]:
		var elite = load("res://game/elite.gd").new()
		elite.setup({"type":kind,"pos":Vector2(1100,930)},w)
		w.add_child(elite)
		elite.set_physics_process(false)
		w.player.position = elite.position+Vector2(60,0)
		elite._windup = true
		elite._timer = float(elite._cfg.windup)*.5
		elite._physics_process(0)
		var expected := "cast" if kind in ["madre","spettro"] else "slash_a"
		check(elite._rig._puppet.clip == expected,kind+": anticipazione collegata alla IA")
		var progress: float = elite._rig._puppet._action_progress
		elite._windup = false
		elite._swing = .2
		elite._timer = 500
		elite._physics_process(0)
		check(elite._rig._puppet._action_progress > progress,kind+": colpo dopo l'anticipazione")
		elite._swing = 0
		elite._physics_process(0)
		check(elite._rig._puppet._action == "",kind+": torna al movimento dopo il colpo")
		elite.free()
	var duelist = load("res://game/duelist.gd").new()
	duelist.setup({"pos":Vector2(1100,930)},w)
	w.add_child(duelist)
	duelist.set_physics_process(false)
	w.player.position = duelist.position+Vector2(60,0)
	duelist._windup = float(root.get_node("Tuning").data.progression.duelist_windup)*.5
	duelist._physics_process(0)
	check(duelist._rig._puppet.clip == "slash_a","Taddeo usa l'anticipazione articolata")
	duelist.free()
	w._go(4,true)
	await process_frame
	for enemy in get_nodes_in_group("enemies"):
		enemy.set_physics_process(false)
		if enemy.kind != "custode":
			continue
		check(enemy._painted_puppet != null,"Custode ridipinto articolato")
		for state in ["walk","sword_windup","sword_swing","crouch","leap","burst"]:
			enemy._state = state
			enemy._state_t = .1
			enemy._look_t += 1
			enemy._update_painted_puppet()
			check(enemy._painted_puppet.bones.has("knee"),"Custode mantiene lo scheletro in "+state)
	print("npc_puppet_gameplay_test: %d fallimenti" % failures)
	main.queue_free()
	await process_frame
	quit(1 if failures else 0)
