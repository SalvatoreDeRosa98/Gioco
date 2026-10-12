extends Sprite2D
## Gatto a fotogrammi disegnati (tools/art/gatto_cut.py): atlanti in assets/art/enemies/gatto_frames/.
## enemy.gd sceglie la clip e il fotogramma dallo stato; qui solo caricamento e ritaglio dell'atlante.
## L'origine resta ai piedi; i fotogrammi guardano a destra e si specchiano con facing.

const ROOT := "res://assets/art/enemies/gatto_frames/"

var _meta: Dictionary
var _atlas := {}
var _t := 0.0
var _loop_clip := ""


## Vero se gli atlanti esistono: altrimenti enemy.gd resta sul gatto a pezzi.
static func available() -> bool:
	return FileAccess.file_exists(ROOT + "animations.json")


## height: altezza del gatto in piedi (dai piedi alle orecchie) in pixel di mondo.
func setup(height: float) -> void:
	_meta = JSON.parse_string(FileAccess.get_file_as_string(ROOT + "animations.json"))
	for clip in _meta.clips:
		_atlas[clip] = load(ROOT + clip + ".png")
	centered = false
	region_enabled = true
	use_parent_material = true  # il lampo del colpo (shader del nemico) vale anche per lo sprite
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	var k := height / float(_meta.height_pixels)
	scale = Vector2(k, k)
	offset = -Vector2(float(_meta.feet[0]), float(_meta.feet[1]))


func frame_count(clip: String) -> int:
	return int(_meta.clips[clip].frames)


## Mostra il fotogramma i della clip.
func show_frame(clip: String, i: int) -> void:
	var cfg: Dictionary = _meta.clips[clip]
	var n := int(cfg.frames)
	i = clampi(i, 0, n - 1)
	var size := float(_meta.size)
	var cols := int(cfg.columns)
	texture = _atlas[clip]
	region_rect = Rect2((i % cols) * size, floori(float(i) / cols) * size, size, size)


## Clip in ciclo al suo fps, moltiplicato per speed (passo legato alla velocità).
func play_loop(clip: String, delta: float, speed: float = 1.0) -> void:
	if clip != _loop_clip:
		_loop_clip = clip
		_t = 0.0
	_t += delta * speed
	show_frame(clip, int(_t * float(_meta.clips[clip].fps)) % frame_count(clip))


## Fotogrammi da first a last (compresi) in proporzione all'avanzamento k (0..1).
func play_progress(clip: String, k: float, first: int = 0, last: int = -1) -> void:
	_loop_clip = ""
	if last < 0:
		last = frame_count(clip) - 1
	show_frame(clip, first + int(round(clampf(k, 0.0, 1.0) * float(last - first))))
