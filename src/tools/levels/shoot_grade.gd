extends SceneTree
## Screenshot per misurare colori di pavimento e grading (p90) in alcune stanze.
## Uso (dalla cartella src, NON headless):
##   Godot_v4.6-stable_win64_console.exe --path . --resolution 1600x900 --script res://tools/levels/shoot_grade.gd -- --out=C:/percorso --rooms=0,1,2,4,6
## Accanto a ogni PNG scrive <nome>.json con la riga di schermo del pavimento (floor_px).
var out_dir := "user://shots"
var rooms: Array = [0, 1, 2, 4, 6]

func _initialize() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="):
			out_dir = a.trim_prefix("--out=")
		elif a.begins_with("--rooms="):
			rooms = Array(a.trim_prefix("--rooms=").split(",")).map(func(s): return int(s))
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
	for idx in rooms:
		world._go(idx, true)
		world.player.teleport(Vector2(world.room.size.x * 0.5, float(world.room.floor) - 30.0))
		world.hold(true)
		await _frames(45)
		var cam: Camera2D = root.get_viewport().get_camera_2d()
		var vs := Vector2(root.get_visible_rect().size)
		var wv: Viewport = world.get_viewport()
		var fy := (wv.get_canvas_transform() * Vector2(0, float(world.room.floor))).y * vs.y / float(wv.get_visible_rect().size.y)
		var name := "room%02d" % idx
		root.get_viewport().get_texture().get_image().save_png(out_dir.path_join(name + ".png"))
		var f := FileAccess.open(out_dir.path_join(name + ".json"), FileAccess.WRITE)
		f.store_string(JSON.stringify({"room": idx, "theme": world.room.theme, "floor_px": fy, "w": vs.x, "h": vs.y}))
		f.close()
		print("shoot_grade: ", name, " theme=", world.room.theme)
	quit(0)
