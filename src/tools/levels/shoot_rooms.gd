extends SceneTree
## Screenshot delle stanze in blockout (scena intera) e in gioco (vista della camera).
## Uso (dalla cartella src, NON headless):
##   Godot_v4.6-stable_win64_console.exe --path . --resolution 1600x900 --script res://tools/levels/shoot_rooms.gd -- --out=C:/percorso
const LevelScenes := preload("res://game/level_scenes.gd")
const ROOMS := [9, 13, 15]
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

func _save(name: String) -> void:
	var img := root.get_viewport().get_texture().get_image()
	var path := out_dir.path_join(name)
	img.save_png(path)
	print("shoot_rooms: ", path)

func _run() -> void:
	RenderingServer.set_default_clear_color(Color(0.08, 0.09, 0.11))
	var view := Vector2(root.get_visible_rect().size)
	for idx in ROOMS:
		var scene: Node2D = load(LevelScenes.scene_path(idx)).instantiate()
		root.add_child(scene)
		var size: Vector2 = scene.get_meta("size")
		var cam := Camera2D.new()
		cam.position = size / 2
		var z := minf(view.x / (size.x + 120), view.y / (size.y + 120))
		cam.zoom = Vector2(z, z)
		scene.add_child(cam)
		cam.make_current()
		var title := Label.new()
		title.text = "Stanza %d - %s (blockout ridisegnato, griglia 64 px)" % [idx, scene.get_meta("room_name")]
		title.add_theme_font_size_override("font_size", int(28 / z))
		title.position = Vector2(20, 10)
		scene.add_child(title)
		await _frames(4)
		_save("blockout_r%02d.png" % idx)
		scene.queue_free()
		await _frames(2)
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.story.mark_seen("lesson_menu")
	world.story.mark_seen("ferruccio_identity")
	for idx in ROOMS:
		world._go(idx, true)
		world.hold(true)
		await _frames(30)
		_save("ingame_r%02d.png" % idx)
	quit(0)
