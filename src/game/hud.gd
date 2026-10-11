extends Control
## HUD: maschere di Pulcinella come punti vita, centesimi, titolo d'area all'ingresso,
## barra del boss, messaggi e schermata finale. Solo visualizzazione: legge lo stato dal mondo.

const MASK_TEX := preload("res://assets/art/items/maschera.png")
const COIN_TEX := preload("res://assets/art/items/moneta.png")
const DialogueBoxScript := preload("res://game/dialogue_box.gd")
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
var _lesson_label: Label


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_lesson_label = Label.new()
	_lesson_label.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_lesson_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_lesson_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_lesson_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_lesson_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_lesson_label.add_theme_font_override("font", Art.body_font())
	_lesson_label.add_theme_font_size_override("font_size", 19)
	_lesson_label.add_theme_color_override("font_color", Art.CREMA)
	_lesson_label.add_theme_color_override("font_shadow_color", Color.BLACK)
	_lesson_label.add_theme_constant_override("shadow_offset_x", 1)
	_lesson_label.add_theme_constant_override("shadow_offset_y", 1)
	add_child(_lesson_label)


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
	_end_sub = subtitle if subtitle != "" else ("Il Cavaliere Borbonico è caduto. La città respira di nuovo." if won else "Il Cavaliere Borbonico veglia ancora sul Cortile d'Onore.")
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
		_lesson_label.visible = world.room_index == 0 and is_instance_valid(world.introduction) and not world.is_talking()
		if _lesson_label.visible:
			var viewport := get_viewport_rect().size
			var card_w := minf(760.0, viewport.x - 80.0)
			_lesson_label.position = Vector2((viewport.x - card_w) * 0.5, 22.0)
			_lesson_label.size = Vector2(card_w, 48.0)
			_lesson_label.text = world.introduction.hint()
	queue_redraw()


func _draw() -> void:
	if world == null or world.room.is_empty():
		return
	var vp := get_viewport_rect().size
	if _lesson_label.visible:
		var card_w := minf(760.0, vp.x - 80.0)
		var card := Rect2((vp.x - card_w) * 0.5 - 12.0, 16.0, card_w + 24.0, 56.0)
		draw_rect(card, Color(0.04, 0.04, 0.07, 0.88), true)
		draw_rect(card, Color(Art.OCRA, 0.8), false, 1.5)
	_draw_vitals()
	_draw_area_title(vp)
	if world.player.invulnerable:
		Art.text(self, Art.body_font(), Vector2(0, 28), "SVILUPPATORE · NESSUN DANNO", 18, Art.OCRA, HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	if _toast_t > 0.0:
		var a := minf(1.0, _toast_t * 2.0)
		Art.text(self, Art.body_font(), Vector2(0, vp.y - 118.0), _toast_text, 28, Color(Art.CREMA, a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	if world.room_index != 0 and _hint_t > 0.0:
		var a := minf(1.0, _hint_t / 3.0) * 0.6
		var hint := Controls.label("move") + " muovi · " + Controls.label("jump") + " salta · " + Controls.label("attack") + " colpisci · " + Controls.label("interact") + " interagisci"
		Art.text(self, Art.body_font(), Vector2(0, vp.y - 26.0), hint, 19, Color(Art.CREMA, a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	if _end_t >= 0.0:
		_draw_end(vp)
	elif world.room_index == Room.SECRET_ROOM and not world.is_talking():
		var forge_hint := "Avvicinati a Gaetano: qui può restituirti il tuo nome"
		if world.can_save_memories():
			forge_hint = Controls.label("interact") + "  Esci · " + Controls.label("shop") + "  Lavorazioni" if world.player.position.x < 180 else Controls.label("shop") + "  Lavorazioni · Incudine per custodire i ricordi · Uscita a sinistra"
		Art.text(self, Art.body_font(), Vector2(0, vp.y - 58), forge_hint, 22, Art.OCRA, HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	elif world.room_index == Room.ARCHIVES_ROOM and not world.is_talking():
		var seals_done := Room.Expansion.seals_count(world.story)
		var seals_tot := Room.Expansion.seals_total()
		var fragments := Room.Expansion.fragment_count(world.story)
		var objective := "Sigilli quartieri %d/%d · Testimonianze %d/3" % [seals_done, seals_tot, fragments]
		if seals_done < seals_tot:
			objective += " · Esplora tutti i quartieri per aprire il Cortile"
		elif world.story.get_var("father_registry") == "":
			objective += " · Ascolta il ricordo di Gaetano nella Villa"
		else:
			objective += " · Il portale del Custode è aperto!"
		Art.text(self, Art.body_font(), Vector2(0, vp.y - 58), objective, 20, Art.OCRA, HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	elif world.room_index in [8, 9, 10] and not world._right_open() and not world.is_talking():
		var objective: String = {8: "Sconfiggi il capitano per raggiungere il Belvedere", 9: "Aziona la chiusa sul ballatoio più alto", 10: "Libera il telaio e sconfiggi la Madre di Marmo"}[world.room_index]
		Art.text(self, Art.body_font(), Vector2(0, vp.y - 58), objective, 21, Art.OCRA, HORIZONTAL_ALIGNMENT_CENTER, vp.x)


func _draw_vitals() -> void:
	var me = world.player
	# Alone scuro dietro all'HUD per leggibilità su qualunque sfondo.
	Art.shaded_ellipse(self, Vector2(130, 80), Vector2(230, 120), Color(0, 0, 0, 0.4), Color(0, 0, 0, 0.0), 24)
	if me:
		var parry_key := Controls.label("parry")
		var parry_text: String = "%s  Parata pronta" % parry_key if me.parry_cooldown <= 0.0 else "Parata %.1f s" % me.parry_cooldown
		Art.text(self, Art.body_font(), Vector2(34, 158), parry_text, 18, Art.CREMA)
		Art.text(self, Art.body_font(), Vector2(34, 182), me.dash_status(), 18, Art.CREMA)
		Art.text(self, Art.body_font(), Vector2(34, 206), "Accessori %d/%d" % [world.equipped.size(), world.accessory_slots()], 16, Art.CREMA)
		Art.text(self, Art.body_font(), Vector2(34, 230), "%s  Braci %d/12" % [Controls.label("heal"), me.embers], 16, Art.OCRA)
		Art.text(self, Art.body_font(), Vector2(34, 254), Controls.label("map") + "  Mappa", 16, Art.OCRA)
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
