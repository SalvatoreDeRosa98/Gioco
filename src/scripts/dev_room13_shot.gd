extends SceneTree
## Screenshot della stanza 13 (testi a sinistra: HUD, avvisi, titolo d'area, cartelli/narrazione).
## Uso: Godot --path src -s res://scripts/dev_room13_shot.gd -- --out=DIR [--suffix=_v3] [--at=X]
var _out := "user://"
var _suffix := ""
var _at := -1.0
func _initialize() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="): _out = a.substr(6)
		if a.begins_with("--suffix="): _suffix = a.substr(9)
		if a.begins_with("--at="): _at = float(a.substr(5))
	SaveSlots.dir = "user://shot13-slots/"
	GameSettings.path = "user://shot13-settings.cfg"
	InputRemap.path = "user://shot13-input.cfg"
	_run.call_deferred()
func _shot(name: String) -> void:
	for i in 3:
		await process_frame
	await RenderingServer.frame_post_draw
	var img := root.get_viewport().get_texture().get_image()
	img.resize(1280, 720, Image.INTERPOLATE_LANCZOS)
	img.save_jpg(_out.path_join(name + _suffix + ".jpg"), 0.85)
	print("shot: ", name)
func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	await create_timer(0.8).timeout
	main._on_play_pressed(false, 3)
	await create_timer(1.0).timeout
	var w = main._world
	w._go(13, true)
	await create_timer(0.3).timeout
	if _at >= 0.0:
		w.player.position.x = _at
	w._hud.toast("Muro incrinato: serve il martello del calcare per aprirlo")
	w._hud.toast("Moneta raccolta")
	await create_timer(1.0).timeout
	await _shot("room13")
	quit()