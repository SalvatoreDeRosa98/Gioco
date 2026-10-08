extends CanvasLayer
## Riquadro dei dialoghi, in alto come in Hollow Knight: nome in Cinzel tra ornamenti ocra, testo
## in Cormorant che compare a macchina da scrivere (con pause sulla punteggiatura), gesti muti di
## Ferruccio in corsivo ocra, scelte a due risposte. Fondo scuro sfumato, nessuna cornice pesante.
## Non decide la storia: chiede a Story di controllare le condizioni e di registrare le scelte;
## il mondo blocca giocatore e nemici finché il riquadro è aperto.

## Il dialogo è finito (dopo la dissolvenza di chiusura).
signal closed
## Una battuta chiede un effetto di gioco (per ora "heal": la mozzarella di Tonino).
signal effect(name: String)
## Inizio e fine della battuta di un personaggio: il suo corpo segue il ritmo delle parole.
signal voice(who: String, on: bool)

const ITEM_PATH := "res://assets/art/items/%s.png"
const BOX_W := 780.0
const BOX_TOP := 26.0
const TEXT_SIZE := 27
const LINE_H := 34.0
const NAME_SIZE := 19
const OPTION_SIZE := 21
const ITEM_SIZE := 64.0
## Tempo minimo prima di accettare un tasto (evita di saltare la prima battuta per sbaglio).
const INPUT_GUARD := 0.18
## Secondi dopo la comparsa delle risposte prima che la conferma venga accettata.
const CHOICE_GUARD := 0.45
const ADVANCE_ACTIONS := ["interact", "jump", "attack", "ui_accept"]

## Ultimo dispositivo usato: decide se l'invito mostra "W" o "Y".
static var pad := false
static var _italic: FontVariation

var story: Story
var _canvas: Control
var _open := false
var _closing := false
var _k := 0.0
var _t := 0.0
var _guard := 0.0
var _queue: Array = []
var _choice: Dictionary = {}
var _options: Array = []
var _opt_k := 0.0
var _opt_t := 0.0
var _sel := 0
var _sel_x := 0.0
var _who := ""
var _name := ""
var _name_k := 1.0
var _gesture := false
var _text := ""
var _wrapped: Array = []
var _shown := 0.0
var _last_char := 0
var _total := 0
var _pause := 0.0
var _item: Texture2D
var _item_k := 0.0
var _set: Dictionary = {}


## Corsivo finto (inclinato) per i gesti di Ferruccio e le battute di passaggio.
static func italic_font() -> Font:
	if _italic == null:
		_italic = FontVariation.new()
		_italic.base_font = Art.body_font()
		# Inclinazione di circa 11 gradi: l'asse y del glifo si sposta verso destra salendo.
		_italic.variation_transform = Transform2D(Vector2(1, 0), Vector2(-0.2, 1), Vector2.ZERO)
	return _italic


func _ready() -> void:
	layer = 15
	_set = Story.settings()
	_canvas = Control.new()
	_canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
	_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_canvas.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_canvas.draw.connect(_draw_box)
	add_child(_canvas)
	visible = false


func is_open() -> bool:
	return _open


## Apre il riquadro con un dialogo scelto da Story.pick (le battute arrivano da Story.begin).
func open(entry: Dictionary, s: Story) -> void:
	story = s
	_queue = story.begin(entry)
	_choice = entry.get("choice", {})
	_options = []
	_opt_k = 0.0
	_open = true
	_closing = false
	_k = 0.0
	_guard = INPUT_GUARD
	_name = ""
	_who = ""
	visible = true
	_advance()


# ---------------------------------------------------------------- Sequenza

func _advance() -> void:
	while not _queue.is_empty():
		var line: Dictionary = _queue.pop_front()
		if story.check(line.get("if", {}), _ctx()):
			_show_line(line)
			return
	if not _choice.is_empty() and _options.is_empty():
		_show_choice()
		return
	_close()


func _ctx() -> Dictionary:
	var w := get_parent()
	return w.story_ctx() if w and w.has_method("story_ctx") else {}


func _show_line(line: Dictionary) -> void:
	if _who != "":
		voice.emit(_who, false)
	var who := str(line.get("who", ""))
	var new_name := Story.speaker_name(who)
	if new_name != _name:
		_name_k = 0.0
	_who = who
	_name = new_name
	_gesture = who == ""
	var item_id := str(line.get("item", ""))
	_item = load(ITEM_PATH % item_id) as Texture2D if item_id != "" and ResourceLoader.exists(ITEM_PATH % item_id) else null
	_item_k = 0.0
	_set_text(str(line.get("text", "")))
	if line.has("do"):
		effect.emit(str(line["do"]))
	if _who != "":
		voice.emit(_who, true)
	_sfx("dialogue_open" if _k < 0.5 else "dialogue_line")


func _show_choice() -> void:
	var prompt := str(_choice.get("prompt", ""))
	if prompt != "":
		if _who != "":
			voice.emit(_who, false)
		_who = ""
		_name = ""
		_gesture = true
		_set_text(prompt)
		_item = null
	_options = _choice.get("options", [])
	_sel = 0
	_opt_k = 0.0
	_opt_t = 0.0
	_sel_x = 0.0


func _choose(i: int) -> void:
	var opt: Dictionary = _options[i]
	story.apply(opt.get("set", {}))
	_queue = (opt.get("lines", []) as Array).duplicate()
	_choice = {}
	_options = []
	_sfx("dialogue_choice")
	_advance()


func _close() -> void:
	if _who != "":
		voice.emit(_who, false)
	_who = ""
	_closing = true


func _set_text(text: String) -> void:
	_text = text
	_wrapped = _wrap(text, _font(), TEXT_SIZE, _text_width())
	_total = text.length()
	_shown = 0.0
	_last_char = 0
	_pause = 0.0


func _font() -> Font:
	return italic_font() if _gesture else Art.body_font()


func _text_width() -> float:
	return BOX_W - 150.0 - (ITEM_SIZE + 18.0 if _item != null else 0.0)


## Va a capo per parole. Ogni riga è [testo, indice del primo carattere].
static func _wrap(text: String, font: Font, size: int, width: float) -> Array:
	var out: Array = []
	var line := ""
	var start := 0
	var pos := 0
	for word in text.split(" "):
		var attempt := word if line == "" else line + " " + word
		if line != "" and font.get_string_size(attempt, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x > width:
			out.append([line, start])
			start = pos
			line = word
		else:
			line = attempt
		pos += word.length() + 1
	out.append([line, start])
	return out


# ---------------------------------------------------------------- Tempo e tasti

func _process(delta: float) -> void:
	if not _open:
		return
	_t += delta
	_guard -= delta
	if _closing:
		_k = move_toward(_k, 0.0, delta / 0.22)
		if _k <= 0.0:
			_open = false
			visible = false
			closed.emit()
			return
	else:
		_k = move_toward(_k, 1.0, delta / 0.3)
	_name_k = move_toward(_name_k, 1.0, delta / 0.2)
	_item_k = move_toward(_item_k, 1.0, delta / 0.35)
	_type(delta)
	if not _options.is_empty() and _typed():
		_opt_k = move_toward(_opt_k, 1.0, delta / 0.3)
		_opt_t += delta
	_canvas.queue_redraw()


## Macchina da scrivere: caratteri al secondo dai dati, pause dopo virgole e punti.
func _type(delta: float) -> void:
	if _typed() or _closing:
		return
	if _pause > 0.0:
		_pause -= delta
		return
	_shown += delta * float(_set.get("chars_per_second", 48.0))
	var every := maxi(1, int(_set.get("blip_every", 4)))
	while _last_char < mini(int(_shown), _total):
		var ch := _text[_last_char]
		_last_char += 1
		if _last_char % every == 0 and ch != " ":
			_sfx("dialogue_blip")
		if _last_char < _total:
			match ch:
				",":
					_pause = float(_set.get("pause_comma", 0.07))
				":", ";":
					_pause = float(_set.get("pause_colon", 0.12))
				".", "!", "?":
					_pause = float(_set.get("pause_stop", 0.22))
			if _pause > 0.0:
				_shown = float(_last_char)
				return
	if _typed() and _who != "":
		voice.emit(_who, false)


func _typed() -> bool:
	return _last_char >= _total


func _input(event: InputEvent) -> void:
	if event is InputEventJoypadButton or (event is InputEventJoypadMotion and absf(event.axis_value) > 0.5):
		pad = true
	elif event is InputEventKey:
		pad = false
	if not _open or _closing or _guard > 0.0 or not event.is_pressed() or event.is_echo():
		return
	var advance := _is_advance(event)
	if not advance and not _options.is_empty() and _typed():
		# W e Freccia su sono anche "parla" (conferma): qui scelgono solo gli altri tasti di direzione.
		for a in ["move_left", "move_right", "move_down", "move_up", "ui_left", "ui_right", "ui_down", "ui_up"]:
			if InputMap.has_action(a) and event.is_action_pressed(a):
				_sel = 1 - _sel
				_sfx("dialogue_move")
				get_viewport().set_input_as_handled()
				return
	if not advance:
		return
	get_viewport().set_input_as_handled()
	if not _typed():
		# Premere durante la scrittura mostra subito tutta la battuta.
		_shown = float(_total)
		_last_char = _total
		_pause = 0.0
		if _who != "":
			voice.emit(_who, false)
	elif not _options.is_empty():
		# Le risposte accettano la conferma solo dopo un attimo: chi sta premendo per far scorrere
		# le battute non deve scegliere per sbaglio.
		if _opt_t > CHOICE_GUARD:
			_choose(_sel)
	else:
		_advance()


static func _is_advance(event: InputEvent) -> bool:
	for a in ADVANCE_ACTIONS:
		if InputMap.has_action(a) and event.is_action_pressed(a):
			return true
	return false


## Solo per i test visivi: completa la battuta corrente e passa alla successiva.
func debug_skip() -> void:
	_shown = float(_total)
	_last_char = _total
	_pause = 0.0
	_k = 1.0
	if _options.is_empty():
		_advance()


## Suoni dell'autoload Audio (se c'è): il riquadro funziona anche senza.
func _sfx(name: String) -> void:
	var audio := get_node_or_null("/root/Audio")
	if audio and audio.has_method("sfx"):
		audio.sfx(name)


# ---------------------------------------------------------------- Disegno

func _draw_box() -> void:
	if not _open:
		return
	var c := _canvas
	var vp := c.size
	var a := ease(_k, 0.6)
	var cx := vp.x * 0.5
	var x0 := cx - BOX_W * 0.5
	var y0 := BOX_TOP - (1.0 - a) * 14.0
	var name_h := 30.0 if _name != "" else 8.0
	var text_h := maxf(1.0, float(_wrapped.size())) * LINE_H
	var opt_h := 58.0 * ease(_opt_k, 0.5) if not _options.is_empty() else 0.0
	var body_h := maxf(text_h, ITEM_SIZE if _item != null else 0.0)
	var h := 22.0 + name_h + 22.0 + body_h + opt_h + 34.0

	_soft_panel(c, Rect2(x0 - 70.0, y0 - 16.0, BOX_W + 140.0, h + 36.0), 0.8 * a)

	# Nome e ornamento superiore (si allarga dal centro, come i titoli d'area).
	var orn_y := y0 + 18.0 + name_h
	if _name != "":
		var na := a * ease(_name_k, 0.5)
		Art.text(c, Art.title_wide(), Vector2(0, orn_y - 12.0), _name.to_upper(), NAME_SIZE, Color(Art.OCRA.lightened(0.3), na), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	var spread := (BOX_W * 0.5 - 60.0) * ease(_k, 0.3)
	_ornament(c, cx, orn_y, spread, a)

	# Oggetto mostrato (mozzarella, lettera, registro...): a sinistra del testo, con un alone.
	var text_cx := cx
	var ty := orn_y + 22.0
	if _item != null:
		var ik := ease(_item_k, 0.4)
		var isz := Vector2(ITEM_SIZE, ITEM_SIZE * _item.get_height() / maxf(1.0, _item.get_width()))
		var ic := Vector2(x0 + 70.0 + ITEM_SIZE * 0.5, ty + body_h * 0.5)
		c.draw_texture_rect(Art.soft_texture(), Rect2(ic - Vector2(56, 56), Vector2(112, 112)), false, Color(Art.OCRA, 0.22 * a * ik))
		c.draw_texture_rect(_item, Rect2(ic - isz * 0.5 * (0.85 + 0.15 * ik) + Vector2(0, (1.0 - ik) * 6.0), isz * (0.85 + 0.15 * ik)), false, Color(1, 1, 1, a * ik))
		text_cx += (ITEM_SIZE + 18.0) * 0.5

	# Testo: ogni riga è centrata sulla sua larghezza finale, così non balla mentre compare.
	var font := _font()
	var col := Color("#e6cf9c") if _gesture else Art.CREMA
	var visible_chars := int(_shown) if not _typed() else _total
	var ly := ty + (body_h - text_h) * 0.5 + LINE_H * 0.78
	for row in _wrapped:
		var line: String = row[0]
		var start: int = row[1]
		var n := clampi(visible_chars - start, 0, line.length())
		if n > 0:
			var full_w := font.get_string_size(line, HORIZONTAL_ALIGNMENT_LEFT, -1, TEXT_SIZE).x
			Art.text(c, font, Vector2(text_cx - full_w * 0.5, ly), line.substr(0, n), TEXT_SIZE, Color(col, a))
		ly += LINE_H

	# Scelta a due risposte: la selezionata è ocra, con rombi ai lati e una sottolineatura che scivola.
	var bottom := ty + body_h + 14.0
	if not _options.is_empty() and _opt_k > 0.0:
		_draw_options(c, cx, bottom + 26.0, a * ease(_opt_k, 0.5))
		bottom += opt_h

	# Ornamento inferiore e indicatore "continua" quando la battuta è completa.
	var by := bottom + 10.0
	c.draw_line(Vector2(cx - spread * 0.55, by), Vector2(cx + spread * 0.55, by), Color(Art.OCRA, 0.35 * a), 1.0, true)
	if _typed() and _options.is_empty() and not _closing:
		var bob := sin(_t * 4.0) * 2.0
		var pa := (0.6 + 0.4 * sin(_t * 4.0)) * a
		var p := Vector2(cx, by + 1.0 + bob)
		c.draw_colored_polygon(PackedVector2Array([p + Vector2(-6, -3), p + Vector2(6, -3), p + Vector2(0, 5)]), Color(Art.OCRA, pa))


func _draw_options(c: Control, cx: float, y: float, a: float) -> void:
	var f := Art.title_font()
	var gap := 90.0
	var widths: Array = []
	var total := gap
	for o in _options:
		var w := f.get_string_size(str((o as Dictionary).get("label", "")), HORIZONTAL_ALIGNMENT_LEFT, -1, OPTION_SIZE).x
		widths.append(w)
		total += w
	var x := cx - total * 0.5
	var centers: Array = []
	for i in _options.size():
		var w: float = widths[i]
		centers.append(x + w * 0.5)
		var on := i == _sel
		var col := Color("#f4d9a0", a) if on else Color(Art.CREMA, 0.5 * a)
		Art.text(c, f, Vector2(x, y), str((_options[i] as Dictionary).get("label", "")), OPTION_SIZE, col)
		x += w + gap
	var target: float = centers[_sel]
	_sel_x = target if _sel_x == 0.0 else lerpf(_sel_x, target, 1.0 - exp(-14.0 * get_process_delta_time()))
	var sw: float = widths[_sel] * 0.5 + 6.0
	var uy := y + 9.0
	Art.grad_rect_h(c, Rect2(_sel_x - sw, uy, sw, 1.5), Color(Art.OCRA, 0.0), Color(Art.OCRA, 0.9 * a))
	Art.grad_rect_h(c, Rect2(_sel_x, uy, sw, 1.5), Color(Art.OCRA, 0.9 * a), Color(Art.OCRA, 0.0))
	for side in [-1.0, 1.0]:
		var d := Vector2(_sel_x + side * (sw + 12.0), y - 7.0)
		c.draw_colored_polygon(PackedVector2Array([d + Vector2(-5, 0), d + Vector2(0, -5), d + Vector2(5, 0), d + Vector2(0, 5)]), Color(Art.OCRA, a))


## Linea ocra con rombo centrale e puntini alle estremità (stesso ornamento di menu e titoli).
func _ornament(c: Control, cx: float, y: float, spread: float, a: float) -> void:
	c.draw_line(Vector2(cx - spread, y), Vector2(cx - 14.0, y), Color(Art.OCRA, 0.75 * a), 1.5, true)
	c.draw_line(Vector2(cx + 14.0, y), Vector2(cx + spread, y), Color(Art.OCRA, 0.75 * a), 1.5, true)
	c.draw_colored_polygon(PackedVector2Array([Vector2(cx - 8, y), Vector2(cx, y - 5), Vector2(cx + 8, y), Vector2(cx, y + 5)]), Color(Art.OCRA, a))
	c.draw_circle(Vector2(cx - spread - 4.0, y), 2.0, Color(Art.OCRA, a))
	c.draw_circle(Vector2(cx + spread + 4.0, y), 2.0, Color(Art.OCRA, a))


## Fondo scuro che sfuma su tutti i lati: una griglia di quadrilateri con l'alfa dei bordi a zero.
static func _soft_panel(c: CanvasItem, r: Rect2, alpha: float) -> void:
	var xs := [0.0, 0.1, 0.24, 0.76, 0.9, 1.0]
	var xa := [0.0, 0.6, 1.0, 1.0, 0.6, 0.0]
	var ys := [0.0, 0.22, 0.6, 1.0]
	var ya := [0.0, 1.0, 1.0, 0.0]
	var base := Color(0.02, 0.018, 0.03)
	for j in ys.size() - 1:
		for i in xs.size() - 1:
			var p0 := r.position + Vector2(r.size.x * xs[i], r.size.y * ys[j])
			var p1 := r.position + Vector2(r.size.x * xs[i + 1], r.size.y * ys[j])
			var p2 := r.position + Vector2(r.size.x * xs[i + 1], r.size.y * ys[j + 1])
			var p3 := r.position + Vector2(r.size.x * xs[i], r.size.y * ys[j + 1])
			c.draw_polygon(PackedVector2Array([p0, p1, p2, p3]), PackedColorArray([
				Color(base, alpha * xa[i] * ya[j]), Color(base, alpha * xa[i + 1] * ya[j]),
				Color(base, alpha * xa[i + 1] * ya[j + 1]), Color(base, alpha * xa[i] * ya[j + 1])]))
