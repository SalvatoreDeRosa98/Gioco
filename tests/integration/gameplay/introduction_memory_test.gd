extends SceneTree
## Flusso iniziale: lezioni, fucina, volto, salvataggio, dono della sciarpa e controller.
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
	var w = main._world
	w.save_path = "user://introduction-memory-test.json"
	if FileAccess.file_exists(w.save_path):
		DirAccess.remove_absolute(w.save_path)
	w.set_process(false)
	w.set_physics_process(false)
	var p = w.player
	p.set_physics_process(false)
	w.introduction.set_physics_process(false)
	var pause_event := InputEventAction.new()
	pause_event.action = "pause"
	pause_event.pressed = true
	w._input(pause_event)
	check(w._pause.opened and not p.is_physics_processing(), "Pausa senza perdere la sessione prima del primo salvataggio")
	w._input(pause_event)
	check(not w._pause.opened and main._world == w, "Start / Esc riprende la stessa partita")
	w._map.toggle()
	w._input(pause_event)
	check(not w._map.opened and not w._pause.opened, "Start chiude la mappa e restituisce il gioco")
	p.set_physics_process(false)
	check(not w.can_save_memories() and not p.scarf_unlocked, "Nuova partita senza memoria né scatto")
	Input.action_press("dash")
	p._physics_process(1.0 / 60.0)
	Input.action_release("dash")
	check(p._dash_t == 0, "Il tasto dello scatto non funziona prima della sciarpa")
	check(Room.save_station_id(0) == "" and w.room.enemies.is_empty(), "Piazza senza statua di salvataggio né nemici simultanei")
	check(w.room.invisible_steps.is_empty() and w.room.blocks.is_empty(), "Basamento e ingresso invisibile rimossi")
	w._save_at(Vector2(110,980))
	check(not FileAccess.file_exists(w.save_path), "Nessun salvataggio prima del padre")
	check(not w._right_open(), "Le lezioni precedono l'uscita dalla piazza")
	# Attraversa le lezioni senza dare per finita una battaglia ancora in corso.
	for step in w.introduction.steps:
		if step.condition == "enemy":
			w.introduction._spawned = false
			w.introduction._physics_process(.02)
			check(get_nodes_in_group("enemies").size() == 1, "Un solo nemico nella lezione " + step.id)
			var enemy = get_nodes_in_group("enemies")[0]
			w._hit_enemy(enemy, 99, Color.WHITE, 1)
			await process_frame
			w.introduction._physics_process(.02)
		else:
			w.introduction._finish()
	check(w.introduction.complete() and w._right_open(), "L'uscita si apre dopo la sequenza")
	check(not w.forge_ready(), "Un solo quartiere non basta per la fucina")
	w._go(1,true)
	p.set_physics_process(false)
	check(w.forge_ready(), "Due quartieri forniscono gli indizi")
	check(w._expedition.marks.any(func(m): return int(m.get("target",-1)) == Room.SECRET_ROOM), "Porta della fucina su Corso Trieste")
	p.teleport(Vector2(2060,956))
	w.enter_forge()
	p.set_physics_process(false)
	check(w.room_index == Room.SECRET_ROOM and not w.can_save_memories(), "Entrare non restituisce ancora l'identità")
	var father = w._npcs.get_children()[0]
	w.start_talk(father)
	for i in 30:
		if not w._dialogue._queue.is_empty():
			w._dialogue._advance()
		else:
			break
	w._dialogue._advance()
	await create_timer(.5).timeout
	check(w.can_save_memories() and p.identity_restored, "Il dialogo col padre restituisce l'identità")
	check(w._stations_root.get_child_count() == 1, "Prima incudine dopo il ricordo")
	w._save_at(Vector2(460,980))
	check(FileAccess.file_exists(w.save_path) and int(w.checkpoint.room) == Room.SECRET_ROOM, "Primo salvataggio nella fucina")
	w._leave_forge()
	check(w.room_index == 1 and absf(p.position.x - 2060) < .1, "Uscita della fucina alla porta corretta")
	w._go(3,true)
	p.set_physics_process(false)
	var agnese = w._npcs.get_children().filter(func(n): return n.key == "agnese")[0]
	w.start_talk(agnese)
	for i in 30:
		if not w._dialogue._queue.is_empty():
			w._dialogue._advance()
		else:
			break
	w._dialogue._advance()
	check(not w._dialogue._options.is_empty(), "Agnese offre la scelta")
	w._dialogue._choose(0)
	for i in 40:
		if not w._dialogue._queue.is_empty():
			w._dialogue._advance()
		else:
			break
	w._dialogue._advance()
	await create_timer(.5).timeout
	check(p.scarf_unlocked and w.upgrades.has("scarf"), "Il dono durante il dialogo abilita lo scatto")
	p._rig.set_story_appearance(p.scarf_unlocked,p.identity_restored)
	check(p._rig._scarf_sprites.all(func(s): return s.visible), "Sciarpa visibile dopo il dono")
	w._save_at(Vector2(1880,980))
	w.upgrades.clear()
	w.story.seen.clear()
	w._restore_save()
	check(w.can_save_memories() and p.scarf_unlocked, "Identità e sciarpa sopravvivono al riavvio")
	Controls.device_override = 1
	check(Controls.label("interact") == "Y / △" and Controls.label("shop") == "↑ croce", "Porte e incudini mostrano il controller corretto")
	Controls.device_override = -1
	DirAccess.remove_absolute(w.save_path)
	main.queue_free()
	await process_frame
	print("introduction_memory_test: %d fallimenti" % failures)
	quit(1 if failures else 0)
