extends SceneTree
## Fotogrammi del gioco vero attorno a Ferruccio, montati in una striscia (strumento di sviluppo).
##
## Uso (dalla radice del repository):
##   xvfb-run -a -s "-screen 0 1280x720x24" $HOME/Godot_v4.6-stable_linux.x86_64 --path src \
##     --rendering-driver opengl3 --resolution 1280x720 -s res://scripts/dev_play_frames.gd \
##     -- --play --room=0 --at=400 --demo --from=9.5 --every=4 --count=16 --out=/tmp/striscia.png
## Avvia il menu come main.tscn (che legge gli stessi argomenti --play/--room/--at/--demo), poi da
## --from secondi salva --count ritagli 300x300 centrati sul giocatore, uno ogni --every frame,
## in una griglia di 6 colonne.

## Caricata a tempo d'esecuzione (non preload): gli autoload (Tuning, Audio) devono esistere già.
const MAIN_SCENE := "res://scenes/main.tscn"
const CROP := Vector2i(300, 300)

var _from := 9.5
var _every := 4
var _count := 16
var _out := "/tmp/striscia.png"


func _initialize() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--from="):
			_from = float(a.substr(7))
		elif a.begins_with("--every="):
			_every = int(a.substr(8))
		elif a.begins_with("--count="):
			_count = int(a.substr(8))
		elif a.begins_with("--out="):
			_out = a.substr(6)
	_run.call_deferred()


func _run() -> void:
	root.add_child((load(MAIN_SCENE) as PackedScene).instantiate())
	await create_timer(_from).timeout
	var cols := mini(_count, 6)
	var rows := ceili(_count / float(cols))
	var strip := Image.create(CROP.x * cols, CROP.y * rows, false, Image.FORMAT_RGBA8)
	for i in _count:
		for f in _every:
			await process_frame
		await RenderingServer.frame_post_draw
		var shot := root.get_viewport().get_texture().get_image()
		shot.convert(Image.FORMAT_RGBA8)
		var center := Vector2(shot.get_size()) * 0.5
		var main := root.get_child(root.get_child_count() - 1)
		var w: Node = main.get("_world")
		if w and w.get("player"):
			var p: Node2D = w.player
			center = p.get_global_transform_with_canvas().origin + Vector2(0, -20)
		var r := Rect2i(Vector2i(center) - CROP / 2, CROP)
		r.position = r.position.clamp(Vector2i.ZERO, shot.get_size() - CROP)
		strip.blit_rect(shot, r, Vector2i((i % cols) * CROP.x, (i / cols) * CROP.y))
	strip.save_png(_out)
	print("striscia salvata: ", _out)
	quit()
