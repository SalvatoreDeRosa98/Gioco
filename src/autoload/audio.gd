extends Node
## Audio del gioco (autoload "Audio"): musica per area con dissolvenza incrociata,
## un ambiente in loop, una piccola pool di effetti con pitch leggermente variato
## e gli effetti continui (il ronzio delle vespe).
## Nomi, file e volumi stanno in data/audio.json: qui non c'è nessun numero da ritoccare.
## I bus "Music", "Ambience" e "SFX" vengono creati da codice se mancano.
##
## Esempi:
##   Audio.play_area("piazza")                    # musica + ambiente dell'area
##   Audio.sfx("passo")                           # una variante a caso
##   Audio.sfx("colpo", -3.0)                     # 3 dB più piano del solito
##   Audio.set_loop_sfx("vespa_ronzio", vespe_vive > 0)
##   Audio.stop_music(1.0)

const CONFIG_PATH := "res://data/audio.json"
const SILENT_DB := -60.0
const MIN_LIN := 0.001

## Configurazione letta da data/audio.json.
var config: Dictionary = {}
## Area (tema) che sta suonando ora, "" se nessuna.
var current_area: String = ""

var _music: Array[AudioStreamPlayer] = []
var _music_db: Array[float] = [0.0, 0.0]
var _active := 0
var _ambience: AudioStreamPlayer
var _amb_db := 0.0
var _pool: Array[AudioStreamPlayer] = []
var _pool_next := 0
var _loops: Dictionary = {}  # nome -> AudioStreamPlayer
var _cache: Dictionary = {}  # percorso -> AudioStream
var _last_variant: Dictionary = {}  # nome -> indice dell'ultima variante
var _warned: Dictionary = {}
var _music_tween: Tween
var _amb_tween: Tween
var _rng := RandomNumberGenerator.new()


func _ready() -> void:
	# La musica continua anche col gioco in pausa (menu, dialoghi).
	process_mode = Node.PROCESS_MODE_ALWAYS
	_rng.randomize()
	_load_config()
	_ensure_buses()
	for i in 2:
		var p := AudioStreamPlayer.new()
		p.name = "Music%d" % i
		p.bus = &"Music"
		p.volume_db = SILENT_DB
		add_child(p)
		_music.append(p)
	_ambience = AudioStreamPlayer.new()
	_ambience.name = "Ambience"
	_ambience.bus = &"Ambience"
	_ambience.volume_db = SILENT_DB
	add_child(_ambience)
	for i in int(config.get("pool_size", 12)):
		var p := AudioStreamPlayer.new()
		p.name = "Sfx%d" % i
		p.bus = &"SFX"
		add_child(p)
		_pool.append(p)


# ---------------------------------------------------------------- API

## Fa partire musica e ambiente dell'area `theme` ("menu", "piazza", "strada",
## "giardino", "belvedere", "oro") con dissolvenza incrociata. Se l'area è già
## quella che suona non fa nulla: si può chiamare a ogni cambio di stanza.
func play_area(theme: String) -> void:
	if theme == current_area:
		return
	var areas: Dictionary = config.get("areas", {})
	if not areas.has(theme):
		_warn_once("area:" + theme, "Audio: area sconosciuta '%s'" % theme)
		return
	current_area = theme
	var a: Dictionary = areas[theme]
	_crossfade_music(_stream(String(a.get("music", ""))), float(a.get("music_db", 0.0)))
	_switch_ambience(_stream(String(a.get("ambience", ""))), float(a.get("ambience_db", 0.0)))


## Suona l'effetto `id` (vedi data/audio.json). `volume_db` si somma al volume
## configurato. Restituisce il player usato (o null se il nome non esiste).
func sfx(id: String, volume_db: float = 0.0) -> AudioStreamPlayer:
	var e := _sfx_entry(id)
	if e.is_empty():
		return null
	var stream := _pick_variant(id, e)
	if stream == null:
		return null
	var p := _free_player()
	p.stream = stream
	p.volume_db = float(e.get("db", 0.0)) + volume_db
	var pv := float(e.get("pitch", 0.03))
	p.pitch_scale = 1.0 + _rng.randf_range(-pv, pv)
	p.play()
	return p


## Accende o spegne un effetto continuo (es. "vespa_ronzio"). È idempotente: si
## può chiamare a ogni frame con lo stato voluto (es. `vespe_vicine > 0`).
## Con `playing` vero e l'effetto già acceso aggiorna solo il volume.
func set_loop_sfx(id: String, playing: bool, volume_db: float = 0.0) -> void:
	if playing:
		var e := _sfx_entry(id)
		if e.is_empty():
			return
		var target := float(e.get("db", 0.0)) + volume_db
		if _loops.has(id):
			var lp: AudioStreamPlayer = _loops[id]
			lp.volume_db = lerpf(lp.volume_db, target, 0.2)
			return
		var stream := _pick_variant(id, e)
		if stream == null:
			return
		_force_loop(stream)
		var p := AudioStreamPlayer.new()
		p.name = "Loop_" + id
		p.bus = &"SFX"
		p.stream = stream
		p.volume_db = SILENT_DB
		add_child(p)
		p.play()
		var tw := create_tween()
		tw.tween_method(_set_fade.bind(p, target), 0.0, 1.0, 0.25)
		_loops[id] = p
	elif _loops.has(id):
		var p: AudioStreamPlayer = _loops[id]
		_loops.erase(id)
		var tw := create_tween()
		tw.tween_property(p, "volume_db", SILENT_DB, 0.25)
		tw.tween_callback(p.queue_free)


## Spegne tutti gli effetti continui (utile al cambio di stanza).
func stop_loops() -> void:
	for id in _loops.keys():
		set_loop_sfx(id, false)


## Sfuma e ferma la musica in `fade` secondi. L'ambiente resta.
func stop_music(fade: float = 1.0) -> void:
	current_area = ""
	if _music_tween:
		_music_tween.kill()
	_music_tween = create_tween().set_parallel(true)
	for i in 2:
		var p := _music[i]
		if p.playing:
			_music_tween.tween_method(_set_fade.bind(p, _music_db[i]), _fade_level(p, _music_db[i]), 0.0, maxf(fade, 0.01))
	_music_tween.chain().tween_callback(_stop_music_players)


## Sfuma e ferma l'ambiente in `fade` secondi.
func stop_ambience(fade: float = 1.0) -> void:
	if _amb_tween:
		_amb_tween.kill()
	if not _ambience.playing:
		return
	_amb_tween = create_tween()
	_amb_tween.tween_method(_set_fade.bind(_ambience, _amb_db), _fade_level(_ambience, _amb_db), 0.0, maxf(fade, 0.01))
	_amb_tween.tween_callback(_ambience.stop)


## Volume di un bus ("Music", "Ambience", "SFX") in dB, per le opzioni.
func set_bus_volume(bus_name: String, volume_db: float) -> void:
	var idx := AudioServer.get_bus_index(bus_name)
	if idx >= 0:
		AudioServer.set_bus_volume_db(idx, volume_db)


# ---------------------------------------------------------------- musica e ambiente

func _crossfade_music(stream: AudioStream, vol_db: float) -> void:
	var fade := float(config.get("crossfade", 1.5))
	var old := _music[_active]
	var old_db := _music_db[_active]
	if _music_tween:
		_music_tween.kill()
	# Stesso brano già in corso (due aree con la stessa musica): si regola solo il volume.
	if stream != null and old.playing and old.stream == stream:
		_music_db[_active] = vol_db
		_music_tween = create_tween()
		_music_tween.tween_method(_set_fade.bind(old, vol_db), _fade_level(old, old_db), 1.0, fade)
		return
	_music_tween = create_tween().set_parallel(true)
	if old.playing:
		_music_tween.tween_method(_set_fade.bind(old, old_db), _fade_level(old, old_db), 0.0, fade)
	_active = 1 - _active
	var nw := _music[_active]
	_music_db[_active] = vol_db
	if stream != null:
		nw.stream = stream
		nw.volume_db = SILENT_DB
		nw.play()
		_music_tween.tween_method(_set_fade.bind(nw, vol_db), 0.0, 1.0, fade)
	_music_tween.chain().tween_callback(old.stop)


func _switch_ambience(stream: AudioStream, vol_db: float) -> void:
	var fade := float(config.get("ambience_fade", 1.2))
	if _amb_tween:
		_amb_tween.kill()
	if stream != null and _ambience.playing and _ambience.stream == stream:
		var from := _fade_level(_ambience, _amb_db)
		_amb_db = vol_db
		_amb_tween = create_tween()
		_amb_tween.tween_method(_set_fade.bind(_ambience, vol_db), from, 1.0, fade)
		return
	_amb_tween = create_tween()
	if _ambience.playing:
		_amb_tween.tween_method(_set_fade.bind(_ambience, _amb_db), _fade_level(_ambience, _amb_db), 0.0, fade * 0.5)
	_amb_tween.tween_callback(_start_ambience.bind(stream, vol_db))
	if stream != null:
		_amb_tween.tween_method(_set_fade.bind(_ambience, vol_db), 0.0, 1.0, fade)


func _start_ambience(stream: AudioStream, vol_db: float) -> void:
	_ambience.stop()
	_amb_db = vol_db
	if stream == null:
		return
	_ambience.stream = stream
	_ambience.volume_db = SILENT_DB
	_ambience.play()


func _stop_music_players() -> void:
	for p in _music:
		p.stop()


## Dissolvenza a potenza costante: x in [0, 1] -> volume in dB sopra `base_db`.
func _set_fade(x: float, p: AudioStreamPlayer, base_db: float) -> void:
	p.volume_db = base_db + linear_to_db(maxf(sin(clampf(x, 0.0, 1.0) * PI * 0.5), MIN_LIN))


## Inverso di _set_fade: a che punto della dissolvenza si trova il player.
func _fade_level(p: AudioStreamPlayer, base_db: float) -> float:
	if not p.playing:
		return 0.0
	var lin := clampf(db_to_linear(p.volume_db - base_db), 0.0, 1.0)
	return asin(lin) / (PI * 0.5)


# ---------------------------------------------------------------- effetti

func _sfx_entry(id: String) -> Dictionary:
	var table: Dictionary = config.get("sfx", {})
	if not table.has(id):
		_warn_once("sfx:" + id, "Audio: effetto sconosciuto '%s'" % id)
		return {}
	return table[id]


func _pick_variant(id: String, e: Dictionary) -> AudioStream:
	var files: Array = e.get("files", [])
	if files.is_empty():
		return null
	var i := 0
	if files.size() > 1:
		# mai la stessa variante due volte di fila
		i = _rng.randi_range(0, files.size() - 2)
		if i >= int(_last_variant.get(id, -1)):
			i += 1
		_last_variant[id] = i
	return _stream(String(files[i]))


func _free_player() -> AudioStreamPlayer:
	for k in _pool.size():
		var p := _pool[(_pool_next + k) % _pool.size()]
		if not p.playing:
			_pool_next = (_pool_next + k + 1) % _pool.size()
			return p
	# tutti occupati: si ruba il più vecchio (giro circolare)
	var p := _pool[_pool_next]
	_pool_next = (_pool_next + 1) % _pool.size()
	p.stop()
	return p


func _force_loop(stream: AudioStream) -> void:
	# Il loop è già attivo negli .import; qui solo per sicurezza.
	if stream is AudioStreamWAV:
		var w := stream as AudioStreamWAV
		if w.loop_mode == AudioStreamWAV.LOOP_DISABLED:
			w.loop_mode = AudioStreamWAV.LOOP_FORWARD
			w.loop_begin = 0
			w.loop_end = int(w.get_length() * w.mix_rate)
	elif stream is AudioStreamOggVorbis:
		(stream as AudioStreamOggVorbis).loop = true


# ---------------------------------------------------------------- dati e risorse

func _load_config() -> void:
	var file := FileAccess.open(CONFIG_PATH, FileAccess.READ)
	if file == null:
		push_error("Audio: %s mancante, niente audio" % CONFIG_PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if parsed is Dictionary:
		config = parsed
	else:
		push_error("Audio: %s non è un JSON valido" % CONFIG_PATH)


func _ensure_buses() -> void:
	var vols: Dictionary = config.get("buses", {})
	for bus_name in ["Music", "Ambience", "SFX"]:
		if AudioServer.get_bus_index(bus_name) != -1:
			continue
		AudioServer.add_bus()
		var idx := AudioServer.bus_count - 1
		AudioServer.set_bus_name(idx, bus_name)
		AudioServer.set_bus_send(idx, &"Master")
		AudioServer.set_bus_volume_db(idx, float(vols.get(bus_name, 0.0)))


func _stream(rel: String) -> AudioStream:
	if rel.is_empty():
		return null
	var path := String(config.get("base", "res://assets/audio/")) + rel
	if _cache.has(path):
		return _cache[path]
	if not ResourceLoader.exists(path):
		_warn_once("file:" + path, "Audio: file mancante %s" % path)
		return null
	var s := load(path) as AudioStream
	_cache[path] = s
	return s


func _warn_once(key: String, msg: String) -> void:
	if _warned.has(key):
		return
	_warned[key] = true
	push_warning(msg)
