extends Node2D
## Oggetti interattivi dipinti delle stanze in scena (Markers/Props): ruota della chiusa e cancello.
## - wheel: segue la leva "sluice" (expedition.gd). Quando la chiusa si apre la ruota sobbalza e gira l'acqua.
## - gate: cancello a due battenti sulla porta (side left/right). Chiuso finché la porta resta chiusa
##   (world._left_open/_right_open); si apre in dissolvenza; da vicino, se chiuso, mostra il suggerimento.
const WHEEL := preload("res://assets/art/slice/ruota_chiusa.png")
const GATE_SHUT := preload("res://assets/art/slice/cancello_chiuso.png")
const GATE_OPEN := preload("res://assets/art/slice/cancello_aperto.png")
const OPEN_TIME := 0.8
var world: Node
var props: Array = []
## Stato per oggetto: open (0..1) per i cancelli, spin (secondi rimasti di animazione) per la ruota.
var state: Array = []
var _t := 0.0

func setup(w: Node) -> void:
	world = w
	props = w.room.get("props", [])
	z_index = 6  # sopra le porte di terrain.gd: il cancello dipinto le copre
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	for p in props:
		state.append({"open": 1.0 if is_open(p) else 0.0, "spin": 0.0, "was": is_open(p)})

func is_open(p: Dictionary) -> bool:
	match str(p.kind):
		"gate":
			return world._left_open() if str(p.get("side", "right")) == "left" else world._right_open()
		"wheel":
			return world.story.times_seen("sluice") > 0
	return false

func _process(delta: float) -> void:
	_t += delta
	for i in props.size():
		var p: Dictionary = props[i]
		var s: Dictionary = state[i]
		var now := is_open(p)
		if now and not s.was:
			s.spin = 1.4
			Fx.dust(world.fx_root, p.pos + Vector2(0, -20), 16)
		s.was = now
		s.spin = maxf(0.0, s.spin - delta)
		s.open = move_toward(s.open, 1.0 if now else 0.0, delta / OPEN_TIME)
	queue_redraw()

func _sprite(tex: Texture2D, base: Vector2, height: float, alpha := 1.0, offset := Vector2.ZERO, angle := 0.0) -> void:
	var size := Vector2(tex.get_size()) * (height / tex.get_height())
	draw_set_transform(base + offset, angle, Vector2.ONE)
	draw_texture_rect(tex, Rect2(Vector2(-size.x / 2.0, -size.y), size), false, Color(1, 1, 1, alpha))
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw() -> void:
	for i in props.size():
		var p: Dictionary = props[i]
		var s: Dictionary = state[i]
		var h := float(p.get("height", 200.0))
		match str(p.kind):
			"wheel":
				var spin := float(s.spin)
				var shake := sin(_t * 40.0) * 3.0 * spin
				_sprite(WHEEL, p.pos, h, 1.0, Vector2(shake, 0), sin(_t * 30.0) * 0.02 * spin)
				if float(s.open) > 0.5:
					# Acqua che scorre dopo l'apertura: bagliore freddo alla base.
					draw_circle(p.pos + Vector2(0, -12), 26.0 + sin(_t * 3.0) * 3.0, Color(0.55, 0.75, 0.9, 0.12))
			"gate":
				_sprite(GATE_SHUT, p.pos, h, 1.0 - float(s.open))
				_sprite(GATE_OPEN, p.pos, h, float(s.open))
				if float(s.open) < 0.05 and world.player and absf(world.player.position.x - p.pos.x) < 200.0 and absf(world.player.position.y - p.pos.y) < 260.0:
					Art.text(self, Art.body_font(), p.pos + Vector2(-170, -h - 30), str(p.get("hint", "Chiuso")), 18, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 340)
