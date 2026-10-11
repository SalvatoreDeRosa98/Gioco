extends SceneTree
## Screenshot del Lanterniere nelle stanze in cui compare (9, 13, 14), per confrontare il contrasto col fondo.
## Uso (dalla cartella src, NON headless):
##   Godot_v4.6-stable_win64_console.exe --path . --resolution 1600x900 --script res://tools/levels/shoot_lanterniere.gd -- --out=C:/percorso
var out_dir := "user://shots"

func _initialize() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="):
			out_dir = a.trim_prefix("--out=")
	DirAccess.make_dir_recursive_absolute(out_dir)
	_run.call_deferred()

func _frames(n: int) -> void:
	for i in n:
		await process_frame
	await RenderingServer.frame_post_draw

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.story.mark_seen("lesson_menu")
	world.story.mark_seen("ferruccio_identity")
	var n := 0
	for idx in [9, 13, 14]:
		world._go(idx, true)
		await _frames(2)
		for e in get_nodes_in_group("enemies"):
			if str(e.kind) != "lanterniere" or not e.is_inside_tree():
				continue
			world.player.teleport(e.position + Vector2(-260, 0))
			world.hold(true)
			await _frames(40)
			root.get_viewport().get_texture().get_image().save_png(out_dir.path_join("lanterniere_r%02d_%d.png" % [idx, n]))
			print("shoot_lanterniere: r%02d %s" % [idx, e.position])
			n += 1
			break
	quit(0)
