extends SceneTree
## Prova headless dell'autoload Audio: flag di loop, aree, effetti, loop sfx.
## Lancio: cd src && godot --headless --audio-driver Dummy --path . --script ../tools/audio/godot_probe.gd
## Esce con codice 1 se qualcosa non va (file mancanti, loop spenti, autoload assente).

var _frames := 0
var _errors := 0

func _check(cond: bool, msg: String) -> void:
	if cond:
		print("OK   ", msg)
	else:
		_errors += 1
		printerr("FAIL ", msg)

func _process(_delta: float) -> bool:
	_frames += 1
	var audio: Node = root.get_node_or_null("Audio")
	if _frames == 2:
		_check(audio != null, "autoload Audio presente")
		if audio == null:
			quit(1)
			return true
		for bus in ["Music", "Ambience", "SFX"]:
			_check(AudioServer.get_bus_index(bus) >= 0, "bus " + bus)
		var areas: Dictionary = audio.config["areas"]
		for theme in areas:
			var a: Dictionary = areas[theme]
			for key in ["music", "ambience"]:
				var rel: String = a[key]
				if rel.is_empty():
					continue
				var s := load("res://assets/audio/" + rel) as AudioStreamOggVorbis
				_check(s != null and s.loop, "%s %s caricato con loop=true (%.1f s)" % [theme, rel, s.get_length() if s else 0.0])
		var sfx: Dictionary = audio.config["sfx"]
		for id in sfx:
			for rel in sfx[id]["files"]:
				var w := load("res://assets/audio/" + rel) as AudioStream
				_check(w != null, "sfx %s -> %s (%.2f s)" % [id, rel, w.get_length() if w else 0.0])
		var buzz := load("res://assets/audio/sfx/vespa_ronzio.wav") as AudioStreamWAV
		_check(buzz.loop_mode == AudioStreamWAV.LOOP_FORWARD, "vespa_ronzio in loop forward")
		audio.play_area("menu")
	if _frames == 10:
		_check(audio.current_area == "menu", "area menu attiva")
		audio.play_area("piazza")
		for id in audio.config["sfx"]:
			if not audio.config["sfx"][id].get("loop", false):
				_check(audio.sfx(id) != null, "sfx(%s) suona" % id)
		audio.set_loop_sfx("vespa_ronzio", true)
		audio.sfx("inesistente")
	if _frames == 60:
		audio.set_loop_sfx("vespa_ronzio", true, -6.0)
		audio.play_area("oro")
	if _frames == 120:
		audio.set_loop_sfx("vespa_ronzio", false)
		audio.stop_music(0.5)
		audio.stop_ambience(0.5)
	if _frames == 200:
		var playing := 0
		for c in audio.get_children():
			if c is AudioStreamPlayer and c.playing:
				playing += 1
		print("player ancora attivi: ", playing)
		print("errori: ", _errors)
		quit(1 if _errors > 0 else 0)
	return false
