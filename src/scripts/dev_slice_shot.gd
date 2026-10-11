extends SceneTree
## Screenshot della slice UI: titolo, menu, arena del Cavaliere e della Tana, carta con crepe.
## Uso: Godot --path src -s res://scripts/dev_slice_shot.gd -- --out=E:/gioco/shots-ui
## Usa slot/opzioni/comandi di prova in user:// (shot-*), non tocca quelli reali.
var _out := "user://"
var _suffix := ""

func _initialize() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="):
			_out = a.substr(6)
		if a.begins_with("--suffix="):
			_suffix = a.substr(9)
	SaveSlots.dir = "user://shot-slots/"
	GameSettings.path = "user://shot-settings.cfg"
	InputRemap.path = "user://shot-input.cfg"
	_run.call_deferred()

func _shot(name: String) -> void:
	for i in 3:
		await process_frame
	await RenderingServer.frame_post_draw
	var img := root.get_viewport().get_texture().get_image()
	img.resize(1280, 720, Image.INTERPOLATE_LANCZOS)
	img.save_jpg(_out.path_join(name + _suffix + ".jpg"), 0.88)
	print("shot: ", name)

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	await create_timer(1.0).timeout
	main.show_title()
	await create_timer(0.3).timeout
	await _shot("titolo")
	main._title.dismiss()
	await create_timer(0.4).timeout
	await _shot("menu")
	main._on_play_pressed(false, 3)
	await create_timer(1.0).timeout
	var w = main._world
	w.player.hp = w.player.max_hp
	w._go(Room.BOSS_ROOM, true)
	await create_timer(0.8).timeout
	w.player.position.x = 600
	w._arena.activate()
	await create_timer(0.6).timeout
	await _shot("arena_transizione")
	await create_timer(1.6).timeout
	await _shot("arena_cavaliere")
	w._go(Room.RATKING_ROOM, true)
	await create_timer(0.8).timeout
	for e in get_nodes_in_group("enemies"):
		if e.has_method("activate") and e.get("kind") == "ratking":
			e.activate()
	await create_timer(1.6).timeout
	await _shot("arena_ratking")
	for i in [0, 1, 2, 3, 7, 9, 13, 15]:
		w.story.seen["visited_%d" % i] = 1
	for room in ["7", "13"]:
		for c in Room.Expansion.data().cracks[room]:
			w.story.seen[w.traversal.seen_key(str(c.id))] = 1
	w.story.seen["market_wall"] = 1
	w._go(7, true)
	await create_timer(0.5).timeout
	w._map.toggle()
	await _shot("mappa_crepe")
	w._map.toggle()
	for up in ["grapple", "wall_grip", "hammer"]:
		w.upgrades[up] = true
	w._map.toggle()
	await _shot("abilita_guanti")
	w._map.toggle()
	w.coins = 200
	w.story.seen["sluice"] = 1
	w._shop.show_shop()
	await _shot("fucina_guanti")
	quit()
	return
	quit()