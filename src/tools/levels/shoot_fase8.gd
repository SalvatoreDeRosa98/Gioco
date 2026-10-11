extends SceneTree
## Screenshot fase 8: stanza 9 (Cesare e guardia, bordo destro) e cancello sinistro della 13, zoom 1.0 e 1.6.
func _initialize() -> void:
	_run.call_deferred()
func _run() -> void:
	var out := "user://fase8"
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="):
			out = a.trim_prefix("--out=")
	DirAccess.make_dir_recursive_absolute(out)
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.story.mark_seen("lesson_menu")
	world.story.mark_seen("ferruccio_identity")
	world.player.invulnerable = true
	for z in [1.0, 1.6]:
		for spec in [[9, Vector2(800, 950), "r09_cesare_guardia"], [9, Vector2(2440, 950), "r09_bordo_destro"], [13, Vector2(160, 1966), "r13_cancello_sinistro"]]:
			world._go(spec[0], true)
			for k in 30:
				await process_frame
			world.player._cam.zoom = Vector2(z, z)
			world.player.teleport(spec[1])
			for k in 10:
				await process_frame
			world.player._cam.reset_smoothing()
			for k in 20:
				await process_frame
			root.get_texture().get_image().save_png("%s/%s_zoom%s.png" % [out, spec[2], str(z).replace(".", "")])
	quit(0)
