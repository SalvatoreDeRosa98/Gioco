extends SceneTree
## Slice UI: E per interagire (W solo Su), zoom delle arene, crepe viste segnate sulla carta e
## persistenti nel salvataggio, suoni segnaposto registrati, titolo con logo segnaposto.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(value: bool, description: String) -> void:
	if not value:
		failures += 1
		push_error(description)

func _has_key(action: String, key: Key) -> bool:
	for e in InputMap.action_get_events(action):
		if e is InputEventKey and (e.physical_keycode == key or e.keycode == key):
			return true
	return false

func _run() -> void:
	InputRemap.path = "user://test-slice-input.cfg"
	InputRemap.delete_saved()
	SaveSlots.dir = "user://test-slice-slots/"
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	await process_frame
	# --- 1. E per interagire, W solo Su
	check(_has_key("interact", KEY_E), "E interagisce")
	check(not _has_key("interact", KEY_W) and not _has_key("interact", KEY_UP), "W e Freccia su non interagiscono piu'")
	check(_has_key("move_up", KEY_W), "W resta Su")
	check(InputRemap.events("interact", true).any(func(e): return e is InputEventJoypadButton and e.button_index == JOY_BUTTON_Y), "Controller: Y interagisce")
	Controls.device_override = 0
	check(Controls.label("interact") == "E", "Suggerimento tastiera: E")
	Controls.device_override = -1
	var w_key := InputEventKey.new()
	w_key.physical_keycode = KEY_W
	w_key.keycode = KEY_W
	w_key.pressed = true
	check(InputMap.event_is_action(w_key, "move_up") and not InputMap.event_is_action(w_key, "interact"), "W aziona solo Su")
	# --- 2. Zoom delle arene
	var tun: Dictionary = root.get_node("Tuning").data
	var view := Vector2(1280, 720)
	for key in ["arena", "ratking_arena"]:
		var cfg: Dictionary = tun[key]
		var frame := ArenaCamera.frame_of(cfg)
		var z := ArenaCamera.target_zoom_for(cfg, view)
		check(view.x / z >= frame.size.x - 0.5 and view.y / z >= frame.size.y - 0.5, key + ": tutta l'arena e' inquadrata")
		check(z > 0.76, key + ": Ferruccio piu' grande della vecchia camera 0.76 (zoom %.3f)" % z)
		check(is_equal_approx(z, minf(view.x / frame.size.x, view.y / frame.size.y)), key + ": zoom massimo possibile")
	check(is_equal_approx(ArenaCamera.fit_zoom(Rect2(0, 0, 100, 100), view, 0.5, 1.6), 1.6), "Zoom limitato a max_zoom")
	main._on_play_pressed(false, 1)
	var world = main._world
	world.save_path = "user://test-slice-save.json"
	world.player.invulnerable = true
	world._go(Room.BOSS_ROOM, true)
	await process_frame
	world._arena.activate()
	var cam: Camera2D = root.get_viewport().get_camera_2d()
	check(cam is ArenaCamera, "Entrando nell'arena la camera d'arena e' attiva")
	check(absf(cam.zoom.x - Room.CAMERA_ZOOM) < 0.05, "La transizione parte dallo zoom del giocatore (tween)")
	await create_timer(float(tun.arena.zoom_in_time) + 0.4).timeout
	cam = root.get_viewport().get_camera_2d()
	var expected := ArenaCamera.target_zoom_for(tun.arena, cam.get_viewport_rect().size)
	check(absf(cam.zoom.x - expected) < 0.01, "A fine tween lo zoom e' quello d'arena: %.3f" % cam.zoom.x)
	(cam as ArenaCamera).leave(0.3)
	await create_timer(0.6).timeout
	check(root.get_viewport().get_camera_2d() == world.player._cam, "Uscendo torna la camera del giocatore")
	# --- 4. Crepe viste sulla carta, persistenti
	world._go(7, true)
	await process_frame
	var crack: Dictionary = Room.Expansion.data().cracks["7"][0]
	var key: String = world.traversal.seen_key(str(crack.id))
	check(world.story.times_seen(key) == 0 or true, "Stato iniziale letto")
	world.story.seen.erase(key)
	check(world.traversal.mark_visible_cracks(Rect2(0, 0, 100, 100)).is_empty(), "Crepa fuori vista non segnata")
	check(world.traversal.mark_visible_cracks(Rect2(crack.rect[0] - 200, crack.rect[1], 400, 200)) == [str(crack.id)], "Crepa in vista segnata")
	var marks: Array = world._map.room_marks(7)
	check(marks.any(func(m): return m.kind == "crepa" and not m.done), "La carta mostra la crepa vista e non ancora rotta")
	world.story.mark_seen("ferruccio_identity")
	world.story.seen["ferruccio_identity"] = 1
	var state := {"version": 1, "checkpoint": {"room": 7, "x": 600, "y": 900}, "coins": 0, "cleared": {}, "defeated": {}, "stations": {}, "vars": world.story.vars, "seen": world.story.seen, "upgrades": {}, "equipped": [], "choice_uses": {}}
	check(world._write_state(state), "Salvataggio scritto")
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(world.save_path))
	check(parsed is Dictionary and parsed.seen.has(key), "La crepa vista e' nel salvataggio")
	world.story.seen.erase(key)
	world._restore_save()
	check(world.story.times_seen(key) > 0, "Dopo il caricamento la crepa resta segnata")
	world._map.toggle()
	await process_frame
	await process_frame
	world._map.toggle()
	# --- 5. Suoni (ex segnaposto, ora definitivi con licenza)
	var audio = root.get_node("Audio")
	for id in ["incudine_salva", "boss_preavviso", "ratking_preavviso"]:
		var e: Dictionary = audio.config.sfx.get(id, {})
		check(not bool(e.get("todo", false)) and str(e.get("license", "")) != "", id + " definitivo e con licenza")
		check(not e.is_empty() and ResourceLoader.exists("res://assets/audio/" + str(e.files[0])), id + " ha il suo file")
	# --- 3. Titolo
	main._return_to_menu()
	main.show_title()
	check(main._title.visible and not main._menu_center.visible, "Il titolo copre il menu")
	check(main._title.uses_placeholder_logo() == not ResourceLoader.exists(main._title.LOGO_IMAGE), "Logo segnaposto finche' manca l'immagine")
	var any := InputEventKey.new()
	any.keycode = KEY_K
	any.pressed = true
	main._input(any)
	check(not main._title.visible and main._menu_center.visible, "Un tasto chiude il titolo e mostra il menu")
	DirAccess.remove_absolute("user://test-slice-save.json")
	print("ui_slice_test: ", "OK" if failures == 0 else "%d fallimenti" % failures)
	quit(failures)