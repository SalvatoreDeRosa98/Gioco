extends SceneTree
## Screenshot del gatto nel gioco vero: la stanza 12 (Campanile) e la 13 (Cisterne Sepolte), vicino ai marker dei gatti.
## Uso (dalla cartella src, NON headless):
##   Godot_v4.6-stable_win64_console.exe --path . --resolution 1600x900 --script res://tools/levels/shoot_gatto_ingioco.gd -- --out=C:/percorso
const SHOTS := [
	["gatto_campanile", 12, Vector2(330, 1928)],
	["gatto_cisterne_sepolte", 13, Vector2(820, 1980)],
]
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
	for shot in SHOTS:
		world._go(shot[1], true)
		world.player.teleport(shot[2])
		await _frames(60)
		var img := root.get_viewport().get_texture().get_image()
		var path := out_dir.path_join("%s.png" % shot[0])
		img.save_png(path)
		print("shoot_gatto_ingioco: ", path)
	quit(0)
