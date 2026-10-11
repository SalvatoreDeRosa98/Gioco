extends SceneTree
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(value: bool, description: String) -> void:
	if not value:
		failures += 1
		push_error(description)
## GameSettings: default, salvataggio/lettura in user://, valori non validi, volumi sui bus.
func _run() -> void:
	GameSettings.path = "user://test-settings.cfg"
	DirAccess.remove_absolute(GameSettings.path)
	check(not GameSettings.load_settings(), "Senza file: default")
	check(GameSettings.resolution == Vector2i(1280, 720) and not GameSettings.fullscreen, "Default video")
	GameSettings.fullscreen = true
	GameSettings.resolution = Vector2i(1920, 1080)
	GameSettings.set_volume("Music", 0.25)
	GameSettings.set_volume("SFX", 1.7)
	GameSettings.set_volume("Voice", 0.0)
	check(GameSettings.save_settings() == OK, "Salva il file")
	GameSettings.reset_defaults()
	check(GameSettings.load_settings(), "Rilegge il file")
	check(GameSettings.fullscreen and GameSettings.resolution == Vector2i(1920, 1080), "Video persistito")
	check(is_equal_approx(GameSettings.volumes.Music, 0.25), "Volume musica persistito")
	check(is_equal_approx(GameSettings.volumes.SFX, 1.0), "Volume limitato a 1")
	GameSettings.apply_audio()
	for bus in ["Music", "SFX", "Voice", "Ambience"]:
		check(AudioServer.get_bus_index(bus) != -1, "Bus dedicato presente: " + bus)
	check(is_equal_approx(AudioServer.get_bus_volume_db(AudioServer.get_bus_index("Music")), linear_to_db(0.25)), "Bus Music al volume scelto")
	check(AudioServer.is_bus_mute(AudioServer.get_bus_index("Voice")), "Voci a zero = mute")
	var cfg := ConfigFile.new()
	cfg.set_value("video", "resolution", Vector2i(10, 10))
	cfg.set_value("audio", "Music", "abc")
	cfg.save(GameSettings.path)
	GameSettings.load_settings()
	check(GameSettings.resolution == Vector2i(1280, 720), "Risoluzione non valida ignorata")
	var dialog: Dictionary = root.get_node("Audio").config.sfx.dialogo
	check(str(dialog.get("bus", "")) == "Voice", "Le voci dei dialoghi vanno sul bus Voice")
	DirAccess.remove_absolute(GameSettings.path)
	print("settings_test: ", "OK" if failures == 0 else "%d fallimenti" % failures)
	quit(failures)