extends Node2D
## Visualizzatore standalone: gatto, vespa e Ferruccio alla stessa scala (stessa ORTHO e RES dei render).
## SU/GIÙ: scegli il personaggio. SINISTRA/DESTRA: cambia clip. SPAZIO: rallentatore 0,5×. ESC: esci.

const SETS := [
	{"name": "Ferruccio", "root": "res://frames/ferruccio/", "x": 230.0},
	{"name": "Gatto", "root": "res://frames/gatto/", "x": 640.0},
	{"name": "Vespa", "root": "res://frames/vespa/", "x": 1050.0},
]
const GROUND_Y := 600.0
## Secondi fermi sull'ultimo fotogramma delle clip non in loop, poi ripartono.
const HOLD := 0.8

var _sprites: Array[AnimatedSprite2D] = []
var _labels: Array[Label] = []
var _clips: Array = []
var _clip_idx: Array[int] = []
var _hold: Array[float] = []
var _selected := 0
var _slow := false
var _help: Label


func _ready() -> void:
	RenderingServer.set_default_clear_color(Color(0.08, 0.09, 0.11))
	for i in SETS.size():
		var cfgset: Dictionary = SETS[i]
		var meta: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(cfgset.root + "animations.json"))
		var frames := SpriteFrames.new()
		frames.remove_animation("default")
		var names: Array = meta.clips.keys()
		names.sort()
		var size := int(meta.size)
		for clip in names:
			var cfg: Dictionary = meta.clips[clip]
			frames.add_animation(clip)
			frames.set_animation_speed(clip, float(cfg.fps))
			frames.set_animation_loop(clip, bool(cfg.loop))
			var atlas := load(cfgset.root + clip + ".png") as Texture2D
			var cols := int(cfg.columns)
			for f in int(cfg.frames):
				var tex := AtlasTexture.new()
				tex.atlas = atlas
				tex.region = Rect2((f % cols) * size, int(f / cols) * size, size, size)
				frames.add_frame(clip, tex)
		var sprite := AnimatedSprite2D.new()
		sprite.sprite_frames = frames
		sprite.centered = false
		var feet: Array = meta.feet
		sprite.offset = -Vector2(float(feet[0]), float(feet[1]))
		var target_h: float = 230.0 if cfgset.name == "Ferruccio" else (62.0 if cfgset.name == "Gatto" else 48.0)
		var k := target_h / float(meta.height_pixels)
		sprite.scale = Vector2(k, k)
		sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		sprite.position = Vector2(float(cfgset.x), GROUND_Y)
		add_child(sprite)
		_sprites.append(sprite)
		_clips.append(names)
		_clip_idx.append(0)
		_hold.append(0.0)
		sprite.play(names[0])

		var lab := Label.new()
		lab.position = Vector2(float(cfgset.x) - 150.0, GROUND_Y + 28.0)
		lab.add_theme_font_size_override("font_size", 22)
		add_child(lab)
		_labels.append(lab)

	_help = Label.new()
	_help.position = Vector2(24.0, 20.0)
	_help.add_theme_font_size_override("font_size", 20)
	add_child(_help)
	queue_redraw()
	_refresh()


func _draw() -> void:
	draw_line(Vector2(0.0, GROUND_Y), Vector2(1280.0, GROUND_Y), Color(0.3, 0.33, 0.4), 2.0)


func _process(delta: float) -> void:
	for i in _sprites.size():
		var sp := _sprites[i]
		sp.speed_scale = 0.5 if _slow else 1.0
		var clip: String = _clips[i][_clip_idx[i]]
		if not sp.sprite_frames.get_animation_loop(clip) and not sp.is_playing():
			_hold[i] += delta
			if _hold[i] >= HOLD:
				_hold[i] = 0.0
				sp.play(clip)


func _unhandled_input(event: InputEvent) -> void:
	var key := event as InputEventKey
	if key == null or not key.pressed or key.echo:
		return
	match key.keycode:
		KEY_UP:
			_selected = posmod(_selected - 1, SETS.size())
		KEY_DOWN:
			_selected = posmod(_selected + 1, SETS.size())
		KEY_RIGHT:
			_step_clip(1)
		KEY_LEFT:
			_step_clip(-1)
		KEY_SPACE:
			_slow = not _slow
		KEY_ESCAPE:
			get_tree().quit()
	_refresh()


func _step_clip(d: int) -> void:
	var n: int = _clips[_selected].size()
	_clip_idx[_selected] = posmod(_clip_idx[_selected] + d, n)
	var clip: String = _clips[_selected][_clip_idx[_selected]]
	_sprites[_selected].play(clip)
	_hold[_selected] = 0.0


func _refresh() -> void:
	for i in SETS.size():
		var clip: String = _clips[i][_clip_idx[i]]
		var fps := _sprites[i].sprite_frames.get_animation_speed(clip)
		var mark := "►" if i == _selected else " "
		_labels[i].text = "%s %s · %s · %d fps" % [mark, SETS[i].name, clip, int(fps)]
		_labels[i].modulate = Color(1.0, 0.9, 0.4) if i == _selected else Color(0.7, 0.72, 0.78)
	_help.text = "SU/GIÙ personaggio · SINISTRA/DESTRA clip · SPAZIO rallentatore 0,5× (%s) · ESC esci" % ("ON" if _slow else "off")
