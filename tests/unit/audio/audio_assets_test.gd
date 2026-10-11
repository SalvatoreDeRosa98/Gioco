extends SceneTree
## Ogni file referenziato da audio.json esiste, si carica come AudioStream, ha licenza/autore/fonte/url
## e non e' piu' segnaposto; musiche e ambienti sono in loop.
var failures := 0

func check(v: bool, d: String) -> void:
	if not v:
		failures += 1
		push_error(d)

func _initialize() -> void:
	var cfg: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/audio.json"))
	var base: String = cfg.base
	var count := 0
	for section in ["areas", "sfx"]:
		for id in cfg[section]:
			var e: Dictionary = cfg[section][id]
			check(not e.get("todo", false) and not e.has("placeholder"), "%s/%s: niente piu' segnaposto" % [section, id])
			for k in ["license", "author", "source", "url"]:
				check(str(e.get(k, "")).strip_edges() != "", "%s/%s: manca %s" % [section, id, k])
			var files: Array = e.get("files", [])
			for k in ["music", "ambience"]:
				if str(e.get(k, "")) != "":
					files.append(e[k])
			for f in files:
				var path: String = base + str(f)
				check(ResourceLoader.exists(path), "%s/%s: file mancante %s" % [section, id, path])
				var stream = load(path) if ResourceLoader.exists(path) else null
				check(stream is AudioStream and stream.get_length() > 0.05, "%s/%s: %s non e' un AudioStream valido" % [section, id, path])
				if section == "areas" and stream is AudioStreamOggVorbis:
					check(stream.loop, "%s: %s deve essere in loop" % [id, path])
				count += 1
	for id in ["parata", "ratti"]:
		check(cfg.sfx.has(id), "Nuovo effetto %s presente" % id)
	check(cfg.areas.has("boss_cavaliere"), "Tema del Cavaliere presente")
	check(FileAccess.file_exists("res://../CREDITS.md") or FileAccess.file_exists(ProjectSettings.globalize_path("res://").path_join("../CREDITS.md")), "CREDITS.md presente")
	print("audio_assets_test: %d file controllati, " % count, "OK" if failures == 0 else "%d fallimenti" % failures)
	quit(failures)