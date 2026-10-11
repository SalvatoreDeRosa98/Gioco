extends SceneTree
## Nuovo Ferruccio (rig v2 dall'arte approvata): pupazzo caricato dal tuning, altezza a schermo
## 140-160 px a 1080p, tutte le clip funzionanti, corsa e colpi a fotogrammi interi, v1 come ripiego.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	var T: Dictionary = root.get_node("Tuning").data
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.set_physics_process(false)
	var p = world.player
	p.set_physics_process(false)
	await process_frame
	var rig = p._rig
	check(rig.rig_path == str(T.player.rig_dir), "Il rig v2 viene dal tuning (%s)" % rig.rig_path)
	# Altezza a schermo: unità del mondo x zoom della camera x (1080 / altezza della finestra)
	# Misura con lo zoom 1.6 della camera di feat/ui-audio (lo zoom di riferimento del gioco).
	const UI_ZOOM := 1.6
	var px: float = rig.height * UI_ZOOM * 1080.0 / float(ProjectSettings.get_setting("display/window/size/viewport_height"))
	check(px >= 140.0 and px <= 160.0, "Ferruccio alto %.0f px a 1080p con zoom 1.6 (140-160)" % px)
	check(rig._outline != null and rig._outline.material != null, "Contorno v2 (shader §3.4) attivo")
	check(rig._layer != null and rig._layer.layer > 5 and rig._layer.follow_viewport_enabled, "Ferruccio sopra il color grading (layer %d), segue la camera" % (rig._layer.layer if rig._layer else -1))
	rig.advance(0.016, Vector2.ZERO)
	check(rig._proxy.global_position.is_equal_approx(rig.global_position), "Il proxy segue il rig")
	# Tutte le clip si applicano senza errori; corsa e colpi usano i fotogrammi disegnati.
	var clips: Dictionary = rig._clips
	check(clips.size() >= 17, "Almeno 17 clip (%d)" % clips.size())
	for clip in clips:
		rig._clip = clip
		rig._clip_t = 0.0
		rig._progress = 0.5 if bool(clips[clip].progress) else -1.0
		rig.advance(0.05, Vector2.ZERO)
		rig.advance(0.05, Vector2(200, 0))
		var framed: bool = clip in ["run", "slash_a", "slash_b"]
		check(rig.uses_frames() == framed, "%s: fotogrammi interi = %s" % [clip, framed])
		check(rig._body.visible != framed, "%s: pupazzo visibile solo senza fotogrammi" % clip)
	# I fotogrammi della corsa avanzano col tempo, quelli del colpo con l'avanzamento della hitbox.
	rig._clip = "run"
	rig._clip_t = 0.0
	rig.advance(0.01, Vector2(250, 0))
	var r0: Rect2 = rig._frame_sprite.region_rect
	rig.advance(0.12, Vector2(250, 0))
	check(rig._frame_sprite.region_rect != r0, "La corsa cambia fotogramma")
	rig._clip = "slash_b"
	rig._progress = 0.05
	rig.advance(0.016, Vector2.ZERO)
	var s0: Rect2 = rig._frame_sprite.region_rect
	rig._progress = 0.9
	rig.advance(0.016, Vector2.ZERO)
	check(rig._frame_sprite.region_rect != s0, "Il colpo segue l'avanzamento")
	# Ripiego: il rig v1 resta caricabile.
	var v1 = CutoutRig.new()
	v1.height = 84.0
	root.add_child(v1)
	await process_frame
	check(v1.rig_path == CutoutRig.RIG_PATH and v1._bones.size() > 10 and v1._frame_sprite == null, "Rig v1 ancora disponibile come ripiego")
	print("FERRUCCIO V2 RIG TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
