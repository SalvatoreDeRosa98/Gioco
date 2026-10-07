extends Control
## HUD: maschere di Pulcinella come punti vita, centesimi, compagni, titolo d'area all'ingresso,
## barra del boss, messaggi e schermata finale. Solo visualizzazione: legge lo stato dal mondo.

const TITLE_TIME := 4.4
const TOAST_TIME := 2.8
const HINT_TIME := 16.0

var world
var _t := 0.0
var _toast_text := ""
var _toast_t := 0.0
var _title := ""
var _subtitle := ""
var _title_t := -1.0
var _end_title := ""
var _end_sub := ""
var _end_t := -1.0
var _hint_t := HINT_TIME
var _coins_shown := 0.0
var _boss_name_t := -1.0


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func area_title(title: String, subtitle: String) -> void:
	_title = title.to_upper()
	_subtitle = subtitle
	_title_t = 0.0


func toast(text: String) -> void:
	_toast_text = text
	_toast_t = TOAST_TIME


func show_end(won: bool) -> void:
	_end_title = "CASERTA È SALVA" if won else "LA REGGIA TI HA VINTO"
	_end_sub = "Il Custode è caduto. La città respira di nuovo." if won else "Il Custode veglia ancora sul Cortile d'Onore."
	_end_t = 0.0


func _process(delta: float) -> void:
	_t += delta
	_toast_t = maxf(0.0, _toast_t - delta)
	_hint_t = maxf(0.0, _hint_t - delta)
	if _title_t >= 0.0:
		_title_t += delta
		if _title_t > TITLE_TIME:
			_title_t = -1.0
	if _end_t >= 0.0:
		_end_t += delta
	if world:
		_coins_shown = move_toward(_coins_shown, float(world.coins), maxf(1.0, absf(float(world.coins) - _coins_shown) * 6.0) * delta)
	queue_redraw()


func _draw() -> void:
	if world == null or world.room.is_empty():
		return
	var vp := get_viewport_rect().size
	_draw_vitals()
	_draw_party()
	_draw_area_title(vp)
	_draw_boss(vp)
	if _toast_t > 0.0:
		var a := minf(1.0, _toast_t * 2.0)
		Art.text(self, Art.body_font(), Vector2(0, vp.y - 118.0), _toast_text, 28, Color(Art.CREMA, a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	if _hint_t > 0.0:
		var a := minf(1.0, _hint_t / 3.0) * 0.6
		var hint := "A/D muovi  ·  Spazio salta  ·  X colpisci  ·  S+X in aria rimbalza  ·  C scatta  ·  S+Spazio scendi  ·  Esc menu"
		Art.text(self, Art.body_font(), Vector2(0, vp.y - 26.0), hint, 19, Color(Art.CREMA, a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	if _end_t >= 0.0:
		_draw_end(vp)


func _draw_vitals() -> void:
	var me = world.local_player()
	# Alone scuro dietro all'HUD per leggibilità su qualunque sfondo.
	Art.shaded_ellipse(self, Vector2(130, 80), Vector2(230, 120), Color(0, 0, 0, 0.4), Color(0, 0, 0, 0.0), 24)
	if me:
		var hp := int(me.hp)
		for i in int(me.max_hp):
			var pulse := 0.6 + 0.4 * sin(_t * 3.0 + i * 0.6) if hp <= 1 and i == 0 else 1.0
			Art.draw_mask(self, Vector2(54 + i * 44, 56), 16.0, i < hp, pulse)
	draw_line(Vector2(34, 92), Vector2(260, 92), Color(Art.CREMA, 0.25), 1.0)
	draw_colored_polygon(PackedVector2Array([Vector2(30, 92), Vector2(34, 88), Vector2(38, 92), Vector2(34, 96)]), Color(Art.CREMA, 0.5))
	var coin := Vector2(48, 118)
	draw_circle(coin, 14.0, Color(1.0, 0.75, 0.3, 0.15))
	Art.shaded_ellipse(self, coin, Vector2(9, 9), Color(1.0, 0.86, 0.45), Color(0.7, 0.46, 0.14), 16)
	draw_arc(coin, 5.5, 0.0, TAU, 12, Color(0.55, 0.35, 0.1, 0.8), 1.2)
	Art.text(self, Art.title_font(), Vector2(66, 128), str(int(round(_coins_shown))), 26, Art.CREMA)


func _draw_party() -> void:
	var y := 168.0
	var me_id: int = world.multiplayer.get_unique_id()
	var ids: Array = Net.players.keys()
	ids.sort()
	for id in ids:
		if id == me_id:
			continue
		var s: Dictionary = world.stats.get(id, {"hp": 0, "max_hp": 0, "dead": false})
		var p = world._find_player(id)
		var col: Color = p.tint if p else Art.CREMA
		var dead: bool = s["dead"]
		Art.text(self, Art.body_font(), Vector2(36, y), str(Net.players[id]), 20, Color(col.lightened(0.2), 0.5 if dead else 0.95))
		for k in int(s["max_hp"]):
			var on: bool = k < int(s["hp"])
			draw_circle(Vector2(160 + k * 13, y - 6), 4.0, Color(Art.AVORIO, 0.9) if on else Color(1, 1, 1, 0.15))
		if dead:
			Art.text(self, Art.body_font(), Vector2(160 + int(s["max_hp"]) * 13 + 8, y), "caduto", 18, Color(1, 0.5, 0.45, 0.8))
		y += 28.0


func _draw_area_title(vp: Vector2) -> void:
	if _title_t < 0.0:
		return
	var a := minf(1.0, _title_t / 0.9) * minf(1.0, (TITLE_TIME - _title_t) / 1.2)
	var cy := vp.y * 0.28
	var cx := vp.x * 0.5
	Art.grad_rect(self, Rect2(0, cy - 90.0, vp.x, 90), Color(0, 0, 0, 0), Color(0, 0, 0, 0.35 * a))
	Art.grad_rect(self, Rect2(0, cy, vp.x, 90), Color(0, 0, 0, 0.35 * a), Color(0, 0, 0, 0))
	Art.text(self, Art.title_wide(), Vector2(0, cy), _title, 54, Color(Art.CREMA, a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	var spread := 60.0 + 200.0 * ease(minf(1.0, _title_t / 1.4), 0.3)
	var ly := cy + 26.0
	draw_line(Vector2(cx - spread - 20.0, ly), Vector2(cx - 18.0, ly), Color(Art.OCRA, 0.8 * a), 1.5)
	draw_line(Vector2(cx + 18.0, ly), Vector2(cx + spread + 20.0, ly), Color(Art.OCRA, 0.8 * a), 1.5)
	draw_colored_polygon(PackedVector2Array([Vector2(cx - 9, ly), Vector2(cx, ly - 6), Vector2(cx + 9, ly), Vector2(cx, ly + 6)]), Color(Art.OCRA, a))
	Art.text(self, Art.body_font(), Vector2(0, ly + 38.0), _subtitle, 26, Color(Art.OCRA.lightened(0.3), 0.9 * a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)


func _draw_boss(vp: Vector2) -> void:
	var boss = world.boss()
	if boss == null:
		_boss_name_t = -1.0
		return
	if _boss_name_t < 0.0:
		_boss_name_t = 0.0
	_boss_name_t += get_process_delta_time()
	var a := minf(1.0, _boss_name_t / 1.5)
	var w := 620.0
	var x := (vp.x - w) * 0.5
	var y := vp.y - 70.0
	Art.text(self, Art.title_wide(), Vector2(0, y - 16.0), "IL CUSTODE DELLA REGGIA", 22, Color(Art.CREMA, a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	var frac := clampf(float(boss.hp) / maxf(1.0, float(boss.max_hp)), 0.0, 1.0)
	draw_rect(Rect2(x - 2, y - 2, w + 4, 12), Color(0, 0, 0, 0.7 * a))
	Art.grad_rect(self, Rect2(x, y, w * frac, 8), Color(1.0, 0.72, 0.3, a), Color(0.6, 0.15, 0.08, a))
	draw_rect(Rect2(x - 2, y - 2, w + 4, 12), Color(Art.OCRA, 0.6 * a), false, 1.0)
	for side in [x - 14.0, x + w + 14.0]:
		draw_colored_polygon(PackedVector2Array([Vector2(side - 7, y + 4), Vector2(side, y - 3), Vector2(side + 7, y + 4), Vector2(side, y + 11)]), Color(Art.OCRA, a))


func _draw_end(vp: Vector2) -> void:
	var a := minf(1.0, _end_t / 1.5)
	draw_rect(Rect2(Vector2.ZERO, vp), Color(0.01, 0.01, 0.02, 0.72 * a))
	Art.text(self, Art.title_wide(), Vector2(0, vp.y * 0.44), _end_title, 64, Color(Art.OCRA.lightened(0.15), a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	var cx := vp.x * 0.5
	var ly := vp.y * 0.44 + 30.0
	draw_line(Vector2(cx - 280, ly), Vector2(cx - 20, ly), Color(Art.OCRA, 0.7 * a), 1.5)
	draw_line(Vector2(cx + 20, ly), Vector2(cx + 280, ly), Color(Art.OCRA, 0.7 * a), 1.5)
	draw_colored_polygon(PackedVector2Array([Vector2(cx - 10, ly), Vector2(cx, ly - 7), Vector2(cx + 10, ly), Vector2(cx, ly + 7)]), Color(Art.OCRA, a))
	Art.text(self, Art.body_font(), Vector2(0, ly + 46.0), _end_sub, 28, Color(Art.CREMA, a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	Art.text(self, Art.body_font(), Vector2(0, ly + 96.0), "Premi Esc per tornare al menu", 22, Color(Art.CREMA, 0.6 * a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
