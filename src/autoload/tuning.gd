extends Node
## Valori di bilanciamento caricati da data/tuning.json: i numeri di gioco non stanno nel codice.

var data: Dictionary = {}


func _ready() -> void:
	var file := FileAccess.open("res://data/tuning.json", FileAccess.READ)
	if file == null:
		push_error("data/tuning.json mancante: uso valori vuoti")
		return
	data = JSON.parse_string(file.get_as_text())
