class_name ArenaCamera
extends Camera2D
## Camera fissa delle arene dei boss: inquadra tutto il riquadro dell'arena (tuning.json,
## "frame") con lo zoom piu' grande possibile, e ci arriva dalla camera del giocatore con un
## tween morbido; all'uscita torna indietro e restituisce la camera al giocatore.

const GROUP := "arena_camera"

var _from: Camera2D
var _tween: Tween
var exiting := false


## Zoom massimo con cui il riquadro sta tutto nello schermo, limitato a [min_zoom, max_zoom].
static func fit_zoom(frame: Rect2, view: Vector2, min_zoom: float = 0.85, max_zoom: float = 4.0) -> float:
	if frame.size.x <= 0.0 or frame.size.y <= 0.0:
		return 1.0
	return clampf(minf(view.x / frame.size.x, view.y / frame.size.y), min_zoom, max_zoom)


## Riquadro da una voce di tuning: {"frame": [x, y, w, h]}.
static func frame_of(cfg: Dictionary) -> Rect2:
	var f: Array = cfg.get("frame", [0, 0, 1920, 1080])
	return Rect2(float(f[0]), float(f[1]), float(f[2]), float(f[3]))


## Crea la camera sotto `parent`, parte dalla vista della camera `from` e va sull'arena.
static func enter(parent: Node, from: Camera2D, cfg: Dictionary) -> ArenaCamera:
	var cam := ArenaCamera.new()
	cam.add_to_group(GROUP)
	parent.add_child(cam)
	cam._from = from
	var frame := frame_of(cfg)
	var view := cam.get_viewport_rect().size
	var target_zoom := fit_zoom(frame, view, float(cfg.get("min_zoom", 0.85)), float(cfg.get("max_zoom", 1.8)))
	var target_pos := frame.get_center()
	if is_instance_valid(from):
		cam.global_position = from.get_screen_center_position()
		cam.zoom = from.zoom
	else:
		cam.global_position = target_pos
		cam.zoom = Vector2.ONE * target_zoom
	cam.make_current()
	cam._go(target_pos, target_zoom, float(cfg.get("zoom_in_time", 1.2)))
	return cam


## Zoom finale previsto per questa arena nella vista corrente.
static func target_zoom_for(cfg: Dictionary, view: Vector2) -> float:
	return fit_zoom(frame_of(cfg), view, float(cfg.get("min_zoom", 0.85)), float(cfg.get("max_zoom", 1.8)))


## Torna alla camera del giocatore con un tween, poi la rende attiva e si elimina.
func leave(seconds: float) -> void:
	if exiting:
		return
	exiting = true
	if not is_instance_valid(_from):
		queue_free()
		return
	_go(_from.get_screen_center_position(), _from.zoom.x, seconds)
	_tween.finished.connect(func() -> void:
		if is_instance_valid(_from):
			_from.make_current()
		queue_free())


func _go(pos: Vector2, z: float, seconds: float) -> void:
	if _tween:
		_tween.kill()
	_tween = create_tween().set_parallel(true).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	_tween.tween_property(self, "global_position", pos, maxf(0.01, seconds))
	_tween.tween_property(self, "zoom", Vector2.ONE * z, maxf(0.01, seconds))