extends Control
## HUD: maschere di Pulcinella come punti vita, centesimi, titolo d'area all'ingresso,
## barra del boss, messaggi e schermata finale. Solo visualizzazione: legge lo stato dal mondo.

const MASK_TEX := preload("res://assets/art/items/maschera.png")
const COIN_TEX := preload("res://assets/art/items/moneta.png")
## Altezza a schermo di una maschera-vita, in pixel.
const MASK_H := 40.0
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
var _end_quote := ""
var _end_t := -1.0
var _hint_t := HINT_TIME
var _coins_shown := 0.0
var _boss_name_t := -1.0


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func area_title(title: String, subtitle: String) -> void:
	_title = title.to_upper()
	_subtitle = subtitle
	_title_t = 0.0


func toast(text: String) -> void:
	_toast_text = text
	_toast_t = TOAST_TIME


## Schermata finale. Senza testi usa quelli generici di vittoria o sconfitta; il finale della storia
## passa titolo, sottotitolo e una citazione conclusiva (vedi data/dialogues.json, "finale").
func show_end(won: bool, title: String = "", subtitle: String = "", quote: String = "") -> void:
	_end_title = title if title != "" else ("CASERTA È SALVA" if won else "LA REGGIA TI HA VINTO")
	_end_sub = subtitle if subtitle != "" else ("Il Custode è caduto. La città respira di nuovo." if won else "Il Custode veglia ancora sul Cortile d'Onore.")
	_end_quote = quote
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
	_draw_area_title(vp)
	_draw_boss(vp)
	if _toast_t > 0.0:
		var a := minf(1.0, _toast_t * 2.0)
		Art.text(self, Art.body_font(), Vector2(0, vp.y - 118.0), _toast_text, 28, Color(Art.CREMA, a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	if _hint_t > 0.0:
		var a := minf(1.0, _hint_t / 3.0) * 0.6
		var hint := "A/D muovi · Spazio salta · X colpisci · C scatta · F para · S+Spazio scendi · W parla/salva · Esc menu"
		Art.text(self, Art.body_font(), Vector2(0, vp.y - 26.0), hint, 19, Color(Art.CREMA, a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	if _end_t >= 0.0:
		_draw_end(vp)
	elif world.room_index == Room.SECRET_ROOM and not world.is_talking():
		Art.text(self, Art.body_font(), Vector2(0, vp.y - 58), "B  Apri la fucina · Acquisti e accessori", 22, Art.OCRA, HORIZONTAL_ALIGNMENT_CENTER, vp.x)


func _draw_vitals() -> void:
	var me = world.player
	# Alone scuro dietro all'HUD per leggibilità su qualunque sfondo.
	Art.shaded_ellipse(self, Vector2(130, 80), Vector2(230, 120), Color(0, 0, 0, 0.4), Color(0, 0, 0, 0.0), 24)
	if me:
		var parry_text: String = "F  Parata pronta" if me.parry_cooldown <= 0.0 else "Parata %.1f s" % me.parry_cooldown
		Art.text(self, Art.body_font(), Vector2(34, 158), parry_text, 18, Art.CREMA)
		Art.text(self, Art.body_font(), Vector2(34, 182), me.dash_status(), 18, Art.CREMA)
		Art.text(self, Art.body_font(), Vector2(34, 206), "Accessori %d/%d" % [world.equipped.size(), world.accessory_slots()], 16, Art.CREMA)
		var hp := int(me.hp)
		for i in int(me.max_hp):
			var pulse := 0.6 + 0.4 * sin(_t * 3.0 + i * 0.6) if hp <= 1 and i == 0 else 1.0
			_draw_mask(Vector2(54 + i * 44, 56), i < hp, pulse)
	draw_line(Vector2(34, 92), Vector2(260, 92), Color(Art.CREMA, 0.25), 1.0)
	draw_colored_polygon(PackedVector2Array([Vector2(30, 92), Vector2(34, 88), Vector2(38, 92), Vector2(34, 96)]), Color(Art.CREMA, 0.5))
	var coin := Vector2(48, 118)
	draw_texture_rect(COIN_TEX, Rect2(coin - Vector2(13, 13), Vector2(26, 26)), false)
	Art.text(self, Art.title_font(), Vector2(66, 128), str(int(round(_coins_shown))), 26, Art.CREMA)


## Maschera di Pulcinella dipinta: piena se il punto vita c'è, sagoma scura se perso.
func _draw_mask(center: Vector2, filled: bool, glow_amount: float) -> void:
	var sz := Vector2(MASK_H * MASK_TEX.get_width() / MASK_TEX.get_height(), MASK_H)
	var r := Rect2(center - sz * 0.5, sz)
	if filled:
		draw_texture_rect(MASK_TEX, Rect2(r.position + Vector2(0, 2), sz), false, Color(0, 0, 0, 0.5))
		draw_texture_rect(MASK_TEX, r, false, Color(1, 1, 1, glow_amount))
	else:
		draw_texture_rect(MASK_TEX, r, false, Color(0.12, 0.12, 0.16, 0.55))


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
	var esc_y := ly + 96.0
	if _end_quote != "":
		# La citazione arriva dopo, più piano: è la frase che il giocatore si porta via.
		var qa := clampf((_end_t - 1.8) / 1.5, 0.0, 1.0)
		Art.text(self, Art.body_font(), Vector2(0, ly + 104.0), _end_quote, 23, Color(Art.OCRA.lightened(0.3), 0.85 * qa), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
		esc_y = ly + 158.0
	Art.text(self, Art.body_font(), Vector2(0, esc_y), "W esplora Caserta  ·  Esc menu", 22, Color(Art.CREMA, 0.6 * a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
