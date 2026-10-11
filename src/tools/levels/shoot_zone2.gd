extends SceneTree
## Screenshot della Zona 2 (stanze 12 e 14): scena intera del blockout e viste in gioco.
## Uso (dalla cartella src, NON headless):
##   Godot_v4.6-stable_win64_console.exe --path . --resolution 1600x900 --script res://tools/levels/shoot_zone2.gd -- --out=C:/percorso
const LevelScenes := preload("res://game/level_scenes.gd")
const SHOTS := [
	["r12_ingresso", 12, Vector2(500, 2270)],
	["r12_nicchia", 12, Vector2(448, 1120)],
	["r12_campane", 12, Vector2(672, 228)],
	["r14_arrivo", 14, Vector2(440, 826)],
	["r14_muro_ovest", 14, Vector2(1150, 950)],
	["r14_memoria", 14, Vector2(1480, 700)],
	["r14_punte", 14, Vector2(2050, 760)],
	["r14_archivi", 14, Vector2(3150, 950)],
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

func _save(name: String) -> void:
	root.get_viewport().get_texture().get_image().save_png(out_dir.path_join(name + ".png"))
	print("shoot_zone2: ", name)

func _run() -> void:
	RenderingServer.set_default_clear_color(Color(0.08, 0.09, 0.11))
	var view := Vector2(root.get_visible_rect().size)
	for idx in [12, 14]:
		var scene: Node2D = load(LevelScenes.scene_path(idx)).instantiate()
		root.add_child(scene)
		var size: Vector2 = scene.get_meta("size")
		var cam := Camera2D.new()
		cam.position = size / 2
		var z := minf(view.x / (size.x + 120), view.y / (size.y + 120))
		cam.zoom = Vector2(z, z)
		scene.add_child(cam)
		cam.make_current()
		await _frames(4)
		_save("blockout_r%02d" % idx)
		scene.queue_free()
		await _frames(2)
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.story.mark_seen("lesson_menu")
	world.story.mark_seen("ferruccio_identity")
	for shot in SHOTS:
		world._go(shot[1], true)
		world.player.teleport(shot[2])
		world.hold(true)
		await _frames(40)
		_save(shot[0])
	quit(0)
