extends SceneTree
## Screenshot di verifica HUD/leggibilita' (strumento di sviluppo, non headless).
## Uso: Godot --path src -s res://scripts/dev_hud_shot.gd -- --room=4 --out=C:/tmp/shot.png
var _room := 4
var _out := "user://hud_shot.png"

func _initialize() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--room="):
			_room = int(a.substr(7))
		elif a.begins_with("--out="):
			_out = a.substr(6)
	_run.call_deferred()

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	await create_timer(0.5).timeout
	world._go(_room, true)
	await create_timer(1.6).timeout
	world._hud.toast("Muro incrinato: serve il martello del calcare")
	world._hud.toast("Parata perfetta! Scatto e fendente ricaricati")
	world._hud.toast("Il passaggio si e' aperto")
	await create_timer(0.6).timeout
	await RenderingServer.frame_post_draw
	var img := root.get_viewport().get_texture().get_image()
	img.save_png(_out)
	print("shot: ", _out, " ", img.get_size())
	quit()
