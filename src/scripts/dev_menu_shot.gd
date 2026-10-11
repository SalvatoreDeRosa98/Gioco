extends SceneTree
## Screenshot di menu opzioni, slot, pausa e comandi (strumento di sviluppo, non headless).
## Uso: Godot --path src -s res://scripts/dev_menu_shot.gd -- --out=E:/gioco/shots-ui
## Usa file di prova in user:// (shot-*) e non tocca salvataggi e opzioni reali.
var _out := "user://"

func _initialize() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="):
			_out = a.substr(6)
	SaveSlots.dir = "user://shot-slots/"
	GameSettings.path = "user://shot-settings.cfg"
	InputRemap.path = "user://shot-input.cfg"
	DirAccess.make_dir_recursive_absolute(SaveSlots.dir)
	var now := int(Time.get_unix_time_from_system())
	var demo := [{"room": 1, "area": "Corso Trieste", "t": 1460.0, "d": now - 86400 * 2}, {"room": 3, "area": "Cisterne Reali", "t": 9925.0, "d": now - 3600}]
	for i in demo.size():
		var st := {"version": 1, "checkpoint": {"room": demo[i].room, "x": 600, "y": 900}, "coins": 12, "play_time": demo[i].t, "area": demo[i].area, "saved_at": demo[i].d}
		var f := FileAccess.open(SaveSlots.path(i + 1), FileAccess.WRITE)
		f.store_string(JSON.stringify(st))
		f.close()
	SaveSlots.delete(3)
	_run.call_deferred()

func _shot(name: String) -> void:
	for i in 3:
		await process_frame
	await RenderingServer.frame_post_draw
	var img := root.get_viewport().get_texture().get_image()
	img.resize(1280, 720, Image.INTERPOLATE_LANCZOS)
	img.save_jpg(_out.path_join(name + ".jpg"), 0.88)
	print("shot: ", name)

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	await create_timer(1.5).timeout
	main._open_slots("continue")
	await _shot("slot_continua")
	main._show_main_box()
	main._open_panel(main._options)
	await _shot("opzioni")
	main._show_main_box()
	main._open_panel(main._remap)
	main._remap._start_capture("jump", false)
	await _shot("comandi_menu")
	main._remap._cancel_capture()
	main._show_main_box()
	main._on_play_pressed(false, 3)
	await create_timer(2.5).timeout
	var w = main._world
	w._pause.toggle()
	await _shot("pausa")
	w._pause._open_sub(w._pause.remap)
	await _shot("pausa_comandi")
	for s in range(1, 4):
		SaveSlots.delete(s)
	quit()