extends Node2D
## Proiettile nemico: si muove in linea retta e svanisce a fine vita. Le collisioni con muri
## e giocatore le controlla il mondo (world.gd). Disegna alone, nucleo e scia.

const TRAIL := 8

var vel := Vector2.ZERO
var damage := 1
var life := 3.0
var color := Color.WHITE
var radius := 6.0
var _trail := PackedVector2Array()


func setup(d: Dictionary) -> void:
	position = d["pos"]
	vel = d["vel"]
	damage = int(d["dmg"])
	color = d["color"]
	life = float(d["life"])
	radius = float(d["radius"])
	add_to_group("bullets")


func _ready() -> void:
	Art.glow(self, Vector2.ZERO, Color(color, 0.7), radius * 9.0)


func _physics_process(delta: float) -> void:
	position += vel * delta
	life -= delta
	if life <= 0.0:
		queue_free()


func _process(_delta: float) -> void:
	_trail.append(global_position)
	if _trail.size() > TRAIL:
		_trail.remove_at(0)
	queue_redraw()


func _draw() -> void:
	for i in _trail.size():
		var k := float(i) / float(TRAIL)
		draw_circle(to_local(_trail[i]), radius * (0.3 + 0.6 * k), Color(color, 0.35 * k))
	draw_circle(Vector2.ZERO, radius * 1.4, Color(color, 0.5))
	draw_circle(Vector2.ZERO, radius, color.lightened(0.3))
	draw_circle(Vector2.ZERO, radius * 0.5, Color(1, 1, 1, 0.95))
