extends Control
## Interfaccia di gioco: stanza, sfogliatelle (punti vita), centesimi, compagni e messaggi.

var world
var _toast_text := ""
var _toast_t := 0.0
var _end_title := ""


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func toast(text: String) -> void:
	_toast_text = text
	_toast_t = 2.6


func show_end(won: bool) -> void:
	_end_title = "CASERTA È TUA" if won else "LA REGGIA TI HA VINTO"


func _process(delta: float) -> void:
	_toast_t = maxf(0.0, _toast_t - delta)
	queue_redraw()


func _draw() -> void:
	if world == null or world.room.is_empty():
		return
	var font := ThemeDB.fallback_font
	var vp := get_viewport_rect().size

	# Stanza, in alto a sinistra
	draw_rect(Rect2(16, 16, 330, 62), Color(0.04, 0.05, 0.07, 0.7))
	draw_rect(Rect2(16, 16, 3, 62), Art.OCRA)
	draw_string(font, Vector2(30, 44), str(world.room["name"]).to_upper(), HORIZONTAL_ALIGNMENT_LEFT, 310, 20, Art.OCRA)
	draw_string(font, Vector2(30, 66), "Stanza %d di %d" % [world.room_index + 1, 5], HORIZONTAL_ALIGNMENT_LEFT, 310, 13, Art.CREMA)

	# Centesimi, in alto a destra
	var coin_text := "%d centesimi" % int(world.coins)
	draw_string(font, Vector2(vp.x - 260, 44), coin_text, HORIZONTAL_ALIGNMENT_RIGHT, 244, 20, Art.OCRA)

	# Sfogliatelle del giocatore locale, in basso a sinistra
	var me = world.local_player()
	if me:
		for i in int(me.max_hp):
			Art.draw_pip(self, Vector2(40 + i * 28, vp.y - 40), i < int(me.hp))

	# Compagni, in alto a destra sotto i centesimi
	var y := 80.0
	for id in Net.players:
		var s: Dictionary = world.stats.get(id, {"hp": 0, "max_hp": 0, "dead": false})
		var label := "%s  %s" % [Net.players[id], "K.O." if s["dead"] else "%d/%d" % [int(s["hp"]), int(s["max_hp"])]]
		var col := Art.CREMA if not s["dead"] else Color(0.55, 0.55, 0.6)
		draw_string(font, Vector2(vp.x - 260, y), label, HORIZONTAL_ALIGNMENT_RIGHT, 244, 15, col)
		y += 24.0

	# Suggerimento comandi, in basso al centro
	draw_string(font, Vector2(0, vp.y - 14), "Frecce/WASD muovi · Spazio salta · X colpisci (S+X in aria: rimbalzo) · C scatta · Esc menu", HORIZONTAL_ALIGNMENT_CENTER, vp.x, 13, Color(Art.CREMA, 0.5))

	# Messaggio temporaneo, in alto al centro
	if _toast_t > 0.0:
		draw_string(font, Vector2(0, 120), _toast_text, HORIZONTAL_ALIGNMENT_CENTER, vp.x, 26, Color(Art.CREMA, minf(1.0, _toast_t)))

	# Fine partita
	if world.game_over:
		draw_rect(Rect2(Vector2.ZERO, vp), Color(0, 0, 0, 0.65))
		draw_string(font, Vector2(0, vp.y * 0.45), _end_title, HORIZONTAL_ALIGNMENT_CENTER, vp.x, 56, Art.OCRA)
		draw_string(font, Vector2(0, vp.y * 0.55), "Premi Esc per tornare al menu", HORIZONTAL_ALIGNMENT_CENTER, vp.x, 20, Art.CREMA)
