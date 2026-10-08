extends Node2D
## Oggetto raccoglibile (centesimi o mozzarella). Lo crea l'host; la posizione iniziale basta a tutti.

const MOZZARELLA_TEX := preload("res://assets/art/items/mozzarella.png")
const COIN_TEX := preload("res://assets/art/items/moneta.png")
## Larghezza a schermo delle icone, in unità di mondo.
const MOZZARELLA_W := 30.0
const COIN_W := 20.0

var item := "centesimi"
var value := 1
var _t := 0.0


func setup(d: Dictionary) -> void:
	position = d["pos"]
	item = str(d["item"])
	value = int(d["value"])
	_t = randf() * 6.0
	add_to_group("pickups")


func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	var col := Color(1.0, 0.95, 0.85) if item == "mozzarella" else Color(0.55, 0.8, 1.0)
	Art.glow(self, Vector2.ZERO, Color(col, 0.55), 70.0)
	Art.point_light(self, Vector2.ZERO, col, 0.5, 200.0)


func _process(delta: float) -> void:
	_t += delta
	queue_redraw()


func _draw() -> void:
	var bob := sin(_t * 3.2) * 4.0
	if item == "mozzarella":
		var sz := Vector2(MOZZARELLA_W, MOZZARELLA_W * MOZZARELLA_TEX.get_height() / MOZZARELLA_TEX.get_width())
		draw_texture_rect(MOZZARELLA_TEX, Rect2(Vector2(0, bob) - sz * 0.5, sz), false)
	else:
		# Moneta di luce che ruota su sé stessa: si stringe in orizzontale.
		var spin := maxf(0.12, absf(cos(_t * 3.0)))
		var sz := Vector2(COIN_W * spin, COIN_W)
		draw_texture_rect(COIN_TEX, Rect2(Vector2(0, bob) - sz * 0.5, sz), false)
