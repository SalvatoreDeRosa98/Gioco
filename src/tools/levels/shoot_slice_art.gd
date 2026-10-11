extends SceneTree
## Screenshot in gioco del prototipo artistico delle Cisterne (stanze 9, 13, 15).
## Uso (dalla cartella src, NON headless):
##   Godot_v4.6-stable_win64_console.exe --path . --resolution 1600x900 --script res://tools/levels/shoot_slice_art.gd -- --out=C:/percorso
const SHOTS := [
	["r09_ingresso", 9, Vector2(330, 950), {}],
	["r09_muro_intatto", 9, Vector2(300, 560), {}],
	["r09_muro_danneggiato", 9, Vector2(300, 560), {"cistern_entry_wall_crepa": 1}],
	["r09_muro_rotto", 9, Vector2(300, 560), {"cistern_entry_wall": 1}],
	["r09_ruota_chiusa", 9, Vector2(1300, 380), {}],
	["r09_cancello_chiuso", 9, Vector2(2300, 950), {}],
	["r09_cancello_aperto", 9, Vector2(2300, 950), {"sluice": 1}],
	["r13_fondo", 13, Vector2(700, 1970), {}],
	["r13_anelli", 13, Vector2(600, 1060), {}],
	["r13_cancello_sbarrato", 13, Vector2(200, 1970), {}],
	["r15_arena", 15, Vector2(500, 950), {}],
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
		for k in ["sluice", "cistern_entry_wall", "cistern_entry_wall_crepa"]:
			world.story.seen.erase(k)
		for k in shot[3]:
			world.story.seen[k] = shot[3][k]
		world._go(shot[1], true)
		world.player.teleport(shot[2])
		world.hold(true)
		await _frames(40)
		var img := root.get_viewport().get_texture().get_image()
		var path := out_dir.path_join("%s.png" % shot[0])
		img.save_png(path)
		print("shoot_slice_art: ", path)
	quit(0)
