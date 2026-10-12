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
	# Zoom reale della camera del giocatore (Room.CAMERA_ZOOM, 1.6 nello slice-3), non una costante.
	var cam_zoom: float = p._cam.zoom.y
	check(is_equal_approx(cam_zoom, Room.CAMERA_ZOOM), "Camera del giocatore allo zoom della stanza (%.2f)" % cam_zoom)
	var px: float = rig.height * cam_zoom * 1080.0 / float(ProjectSettings.get_setting("display/window/size/viewport_height"))
	# Dimensioni rifatte coerenti (12 ottobre): figure_screen_px 230 nel tuning.
	var target := float(T.player.figure_screen_px)
	check(absf(px - target) <= 10.0, "Ferruccio alto %.0f px a 1080p con lo zoom reale %.2f (atteso %.0f ±10)" % [px, cam_zoom, target])
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
		var framed: bool = rig._frame_clips.has(clip)
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
	# Pose dei fogli 02 (15 e 16): ogni stato ha la sua clip a fotogrammi, con atlante e
	# rettangoli validi; le clip senza arte restano sul pupazzo.
	const POSE_CLIPS := ["run", "slash_a", "slash_b", "rise", "fall", "double_jump", "dash", "hurt", "parry", "grapple", "hammer", "heal"]
	for clip in POSE_CLIPS:
		check(rig._frame_clips.has(clip), "%s: clip a fotogrammi presente" % clip)
		if not rig._frame_clips.has(clip):
			continue
		var fc: Dictionary = rig._frame_clips[clip]
		var tex: Texture2D = rig._frame_textures[str(fc.atlas)]
		for f in fc.frames:
			var rr := Rect2(f[0], f[1], f[2], f[3])
			check(Rect2(Vector2.ZERO, tex.get_size()).encloses(rr), "%s: rettangolo %s dentro l'atlante" % [clip, rr])
		rig._clip = clip
		rig._clip_t = 0.0
		rig._progress = 0.0 if bool(fc.get("progress", false)) else -1.0
		rig.advance(0.016, Vector2.ZERO)
		var a0: Rect2 = rig._frame_sprite.region_rect
		rig._progress = 0.95 if bool(fc.get("progress", false)) else -1.0
		rig.advance(2.0 if bool(fc.get("hold", false)) else 0.13, Vector2.ZERO)
		if fc.frames.size() > 1:
			check(rig._frame_sprite.region_rect != a0, "%s: la sequenza avanza" % clip)
		if bool(fc.get("hold", false)):
			var last: Array = fc.frames[-1]
			check(rig._frame_sprite.region_rect == Rect2(last[0], last[1], last[2], last[3]), "%s: si ferma sull'ultimo fotogramma" % clip)
	for clip in ["idle", "crouch", "skid", "pogo", "wall", "death"]:
		check(not rig._frame_clips.has(clip), "%s: resta sul pupazzo" % clip)
	# Colpito: rinculo all'indietro appena preso il colpo, poi si smorza.
	rig._clip = "hurt"
	rig._clip_t = 0.0
	rig.advance(0.001, Vector2.ZERO)
	check(rig._frame_sprite.position.x < rig._body.position.x - 4.0, "hurt: rinculo all'indietro")
	rig.advance(0.5, Vector2.ZERO)
	check(is_equal_approx(rig._frame_sprite.position.x, rig._body.position.x), "hurt: rinculo smorzato")
	# Doppio salto: la posa raccolta ruota col rig (spin).
	rig._clip = "double_jump"
	rig.spin = 1.2
	rig._progress = 0.3
	rig.advance(0.016, Vector2.ZERO)
	check(rig.uses_frames() and is_equal_approx(rig._spin_node.rotation, 1.2), "double_jump: posa a fotogramma ruotata")
	rig.spin = 0.0
	# Atterraggio: lo squash resta entro ±0,25 (niente striscia).
	rig._clip = "idle"
	rig._squash = -3.0
	rig.advance(0.016, Vector2.ZERO)
	check(rig._body.scale.x > rig._factor * 0.8 and rig._body.scale.y > rig._factor * 0.7, "Squash limitato: la posa non diventa una striscia")
	p._squash = 2.0
	rig.select_state(p, false)
	check(absf(rig._squash) <= 0.25, "select_state limita lo squash")
	p._squash = 0.0
	# Morte: piena nel primo secondo (contorno e rim visibili), poi mai sotto 0,6.
	p.dead = true
	p._dead_t = 0.0
	p._process(0.5)
	check(rig.modulate.a >= 0.99 and rig._outline != null, "Death: alfa piena e contorno nel primo secondo")
	p._process(2.0)
	check(rig.modulate.a >= 0.59, "Death: mai sotto 0,6 di alfa (%.2f)" % rig.modulate.a)
	p.dead = false
	# Ripiego: il rig v1 resta caricabile.
	var v1 = CutoutRig.new()
	v1.height = 84.0
	root.add_child(v1)
	await process_frame
	check(v1.rig_path == CutoutRig.RIG_PATH and v1._bones.size() > 10 and v1._frame_sprite == null, "Rig v1 ancora disponibile come ripiego")
	print("FERRUCCIO V2 RIG TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
