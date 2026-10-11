class_name GameSettings
extends RefCounted
## Opzioni del giocatore (video e volumi), salvate in un ConfigFile in user://.
## Stato statico: main le carica e applica all'avvio, i pannelli opzioni le modificano.

## File delle opzioni (i test lo spostano altrove).
static var path := "user://settings.cfg"
## Risoluzioni proposte in finestra.
const RESOLUTIONS: Array[Vector2i] = [Vector2i(1280, 720), Vector2i(1600, 900), Vector2i(1920, 1080), Vector2i(2560, 1440)]
## Bus regolabili dal giocatore, con il nome mostrato nel menu.
const BUSES := {"Music": "Musica", "SFX": "Effetti", "Voice": "Voci", "Ambience": "Ambiente"}

static var fullscreen := false
static var resolution := Vector2i(1280, 720)
## Volume lineare 0..1 per bus.
static var volumes := {"Music": 0.8, "SFX": 0.8, "Voice": 0.8, "Ambience": 0.8}


## Riporta tutto ai valori di fabbrica (non salva).
static func reset_defaults() -> void:
	fullscreen = false
	resolution = Vector2i(1280, 720)
	volumes = {"Music": 0.8, "SFX": 0.8, "Voice": 0.8, "Ambience": 0.8}


## Legge il file; valori mancanti o non validi restano ai default. Ritorna true se il file c'era.
static func load_settings() -> bool:
	reset_defaults()
	var cfg := ConfigFile.new()
	if cfg.load(path) != OK:
		return false
	fullscreen = bool(cfg.get_value("video", "fullscreen", false))
	var r = cfg.get_value("video", "resolution", resolution)
	if r is Vector2i and r.x >= 640 and r.y >= 360:
		resolution = r
	for bus in BUSES:
		volumes[bus] = clampf(float(cfg.get_value("audio", bus, volumes[bus])), 0.0, 1.0)
	return true


static func save_settings() -> Error:
	var cfg := ConfigFile.new()
	cfg.set_value("video", "fullscreen", fullscreen)
	cfg.set_value("video", "resolution", resolution)
	for bus in BUSES:
		cfg.set_value("audio", bus, float(volumes[bus]))
	return cfg.save(path)


static func set_volume(bus: String, linear: float) -> void:
	volumes[bus] = clampf(linear, 0.0, 1.0)
	apply_audio()


## dB del bus per un volume lineare (0 = muto).
static func volume_db(linear: float) -> float:
	return -80.0 if linear <= 0.001 else linear_to_db(linear)


static func apply_audio() -> void:
	for bus in BUSES:
		var idx := AudioServer.get_bus_index(bus)
		if idx != -1:
			AudioServer.set_bus_volume_db(idx, volume_db(float(volumes[bus])))
			AudioServer.set_bus_mute(idx, float(volumes[bus]) <= 0.001)


static func apply_video() -> void:
	if DisplayServer.get_name() == "headless":
		return
	if fullscreen:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
		var screen := DisplayServer.screen_get_size()
		var size := Vector2i(mini(resolution.x, screen.x), mini(resolution.y, screen.y))
		DisplayServer.window_set_size(size)
		DisplayServer.window_set_position(DisplayServer.screen_get_position() + (screen - size) / 2)


static func apply() -> void:
	apply_audio()
	apply_video()