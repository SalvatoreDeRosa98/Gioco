extends Node2D
## Immagine residua (scatto, colpi): disegna una sagoma tramite una funzione e svanisce.

var painter: Callable
var duration := 0.28


func _ready() -> void:
	material = Art.add_material()
	var tw := create_tween()
	tw.tween_property(self, "modulate:a", 0.0, duration)
	tw.tween_callback(queue_free)


func _draw() -> void:
	if painter.is_valid():
		painter.call(self)
