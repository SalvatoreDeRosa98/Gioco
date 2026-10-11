extends CanvasLayer
const DialogueBoxScript := preload("res://game/dialogue_box.gd")
const MAP_BG := preload("res://assets/art/ui/carta/carta_reale.png")
const SEALS := {
	"market_seal": preload("res://assets/art/ui/carta/sigillo_mercato.png"),
	"barracks_seal": preload("res://assets/art/ui/carta/sigillo_caserma.png"),
	"sluice": preload("res://assets/art/ui/carta/sigillo_chiusa.png"),
	"loom": preload("res://assets/art/ui/carta/sigillo_telaio.png"),
	"bells": preload("res://assets/art/ui/carta/sigillo_campane.png"),
	"hammer_plan": preload("res://assets/art/ui/carta/sigillo_disegno.png"),
	"clock_memory": preload("res://assets/art/ui/carta/sigillo_orologio.png"),
}
const SKILL_ICONS := {
	"grapple": preload("res://assets/art/ui/carta/icona_catena.png"),
	"hammer": preload("res://assets/art/ui/carta/icona_martello.png"),
	"guard": preload("res://assets/art/ui/carta/icona_parata.png"),
	"scarf": preload("res://assets/art/ui/carta/icona_sciarpa.png"),
	"heal": preload("res://assets/art/ui/carta/icona_cura.png"),
}
## Carta delle aree visitate: conserva l'esplorazione attraverso story.seen.
const PLACES := {
	0: Vector2(100, 320), 1: Vector2(310, 320), 2: Vector2(520, 320),
	3: Vector2(740, 320), 4: Vector2(1160, 320), 5: Vector2(310, 210),
	6: Vector2(100, 530), 7: Vector2(310, 450), 8: Vector2(520, 210),
	9: Vector2(740, 450), 10: Vector2(950, 210), 11: Vector2(950, 320),
	12: Vector2(740, 150), 13: Vector2(740, 580), 14: Vector2(950, 75),
	15: Vector2(1000, 580)
}
var world: Node
var opened := false
var canvas: Control
var journal := false
var journal_page := 0

## Obiettivi derivati dallo stato della partita, inclusi i vecchi salvataggi.
func quest_entries() -> Array:
	var pending: Array = []
	var complete: Array = []
	var quests: Array = JSON.parse_string(FileAccess.get_file_as_string("res://data/quests.json"))
	for quest: Dictionary in quests:
		var done := false
		match str(quest.condition):
			"seen": done = world.story.times_seen(quest.key)>0
			"upgrade": done = world.upgrades.has(quest.key)
			"choice": done = world.story.get_var(quest.key)!=""
			"cleared": done = bool(world.cleared.get(int(quest.key),false))
			"archives": done = Room.Expansion.archive_ready(world.story)
			"seals": done = Room.Expansion.all_seals_ready(world.story)
		quest["done"] = done
		if done:
			complete.append(quest)
		else:
			pending.append(quest)
	return pending+complete

## Tab o Interagisci alterna carta e registro; sinistra/destra scorre le missioni.
func handle_input(event: InputEvent) -> void:
	if event.is_action_pressed("interact") or (event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_TAB):
		journal = not journal
		journal_page = 0
	if journal:
		var right_pressed: bool = event.is_action_pressed("ui_right") or event.is_action_pressed("move_right")
		var left_pressed: bool = event.is_action_pressed("ui_left") or event.is_action_pressed("move_left")
		var direction := int(right_pressed) - int(left_pressed)
		var total_pages := maxi(1, ceili(quest_entries().size() / 6.0))
		journal_page = clampi(journal_page + direction, 0, total_pages - 1)
	canvas.queue_redraw()

func _ready() -> void:
	layer = 45
	canvas = Control.new()
	canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
	canvas.draw.connect(_draw_map)
	add_child(canvas)
	canvas.hide()

## La carta ferma il gioco; M o Esc restituiscono il controllo.
func toggle() -> void:
	opened = not opened
	canvas.visible = opened
	world._freeze_for_talk(opened)
	canvas.queue_redraw()

func _draw_map() -> void:
	var viewport := canvas.get_viewport_rect().size
	canvas.draw_rect(Rect2(Vector2.ZERO, viewport), Color(0.02, 0.025, 0.04, 0.98))
	var scale := minf(viewport.x / 1320.0, viewport.y / 720.0)
	canvas.draw_set_transform((viewport - Vector2(1320,720) * scale) / 2, 0, Vector2.ONE * scale)
	
	# Carta Reale ad hoc: pergamena borbonica 1845 con cornice barocca
	canvas.draw_texture_rect(MAP_BG, Rect2(0, 0, 1320, 720), false, Color(1, 1, 1, 0.36))
	
	Art.text(canvas, Art.title_font(), Vector2(40, 36), "CARTA REALE DELLE TERRE DI CASERTA", 23, Art.OCRA)
	Art.text(canvas, Art.body_font(), Vector2(800, 38), "Tab / " + Controls.label("interact") + " · " + ("Mappa" if journal else "Registro missioni"), 19, Art.CREMA)
	if journal:
		_draw_journal()
		return
	var seal_names := {
		"market_seal": "Mercato",
		"barracks_seal": "Caserma",
		"sluice": "Cisterne",
		"loom": "Telaio",
		"bells": "Campanile",
		"hammer_plan": "Martello",
		"clock_memory": "Orologiaio",
	}
	var seal_count := Room.Expansion.seals_count(world.story)
	Art.text(canvas, Art.title_font(), Vector2(40, 68), "I SETTE SIGILLI REALI: %d / 7" % seal_count, 15, Art.CREMA)
	var sy := 95.0
	for k in Room.Expansion.DISTRICT_SEALS:
		var has_it: bool = world.story.times_seen(k) > 0
		var tex: Texture2D = SEALS.get(k)
		if tex != null:
			var mod := Color(1.0, 1.0, 1.0, 0.95) if has_it else Color(0.25, 0.22, 0.2, 0.4)
			canvas.draw_texture_rect(tex, Rect2(40, sy - 2, 28, 28), false, mod)
		var col := Art.OCRA if has_it else Color(0.48, 0.46, 0.44)
		var mark := "✔ " if has_it else "○ "
		Art.text(canvas, Art.body_font(), Vector2(76, sy + 3), mark + seal_names.get(k, k), 13, col)
		sy += 30.0

	var links: Array = []
	for idx in PLACES:
		for right in [false, true]:
			var target := Room.Expansion.edge(idx, right)
			if PLACES.has(target): links.append([idx, target])
		for exit in Room.Expansion.data().get("vertical", {}).get(str(idx), []):
			links.append([idx, int(exit.target)])
		for mark in Room.Expansion.data().landmarks.get(str(idx), []):
			if mark.kind == "route": links.append([idx, int(mark.target)])
	for pair in links:
		if world.story.times_seen("visited_%d" % pair[0]) > 0 and world.story.times_seen("visited_%d" % pair[1]) > 0:
			if (pair[0] == 14 and pair[1] == 11) or (pair[0] == 11 and pair[1] == 14):
				canvas.draw_polyline(PackedVector2Array([PLACES[14], Vector2(1050,75), Vector2(1050,320), PLACES[11]]), Color(Art.OCRA,0.65),2,true)
			else:
				canvas.draw_line(PLACES[pair[0]], PLACES[pair[1]], Color(Art.OCRA, 0.65), 2, true)
	for idx in PLACES:
		if world.story.times_seen("visited_%d" % idx) == 0:
			continue
		var p: Vector2 = PLACES[idx]
		var r := Room.build(idx)
		var dims := Vector2(146, 48) if r.size.y < 1500 else Vector2(115, 80)
		canvas.draw_rect(Rect2(p - dims / 2, dims), Color("#1b252e", 0.9))
		canvas.draw_rect(Rect2(p - dims / 2, dims), Art.CREMA if idx == world.room_index else Art.OCRA, false, 2)
		Art.text(canvas, Art.body_font(), p + Vector2(-90, 5), r.name, 14, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 180)
		if idx == world.room_index:
			canvas.draw_circle(p + Vector2(0, dims.y / 2 + 10), 4, Art.CREMA)

	# Medaglioni abilità artigiane di Ferruccio in basso a destra
	var skill_defs := [
		{"id": "grapple", "label": "Catena"},
		{"id": "hammer", "label": "Martello"},
		{"id": "guard", "label": "Fibbia"},
		{"id": "scarf", "label": "Sciarpa"},
		{"id": "heal", "label": "Cura"},
	]
	var sx := 840.0
	for sk in skill_defs:
		var unlocked: bool = sk.id == "heal" or world.upgrades.has(sk.id)
		var icon_tex: Texture2D = SKILL_ICONS.get(sk.id)
		if icon_tex != null:
			var mod := Color(1.0, 1.0, 1.0, 0.95) if unlocked else Color(0.25, 0.22, 0.2, 0.35)
			canvas.draw_texture_rect(icon_tex, Rect2(sx, 642, 38, 38), false, mod)
		Art.text(canvas, Art.body_font(), Vector2(sx + 19, 686), sk.label, 12, Art.OCRA if unlocked else Color(0.45, 0.42, 0.4), HORIZONTAL_ALIGNMENT_CENTER, 70)
		sx += 88.0

	var close_txt := Controls.label("map") + " / " + Controls.label("pause") + "  Chiudi"
	var skills_txt := Controls.label("grapple") + " Catena · " + Controls.label("hammer") + " Martello · " + Controls.label("heal") + " Cura · " + Controls.label("dash") + " Scatto"
	Art.text(canvas, Art.body_font(), Vector2(40, 665), "%s   ·   Punto bianco: sei qui   ·   Esplora per completare la carta" % close_txt, 19, Art.CREMA)
	Art.text(canvas, Art.body_font(), Vector2(40, 693), skills_txt, 16, Art.OCRA)

func _draw_journal() -> void:
	var entries := quest_entries()
	canvas.draw_texture_rect(MAP_BG, Rect2(0, 0, 1320, 720), false, Color(1, 1, 1, 0.22))
	Art.text(canvas, Art.title_font(), Vector2(40, 84), "REGISTRO DELLE MEMORIE E DEGLI INCARICHI", 23, Art.CREMA)
	var first := journal_page * 6
	for i in range(first, mini(first + 6, entries.size())):
		var quest: Dictionary = entries[i]
		var y := 138.0 + float(i - first) * 82
		var color := Color(0.5, 0.75, 0.6) if quest.done else Art.OCRA
		var stamp := "★ COMPLETATA · " if quest.done else "○ DA FARE · "
		Art.text(canvas, Art.title_font(), Vector2(40, y), stamp + str(quest.title), 20, color)
		Art.text(canvas, Art.body_font(), Vector2(40, y + 29), quest.text, 20, Art.CREMA)
	Art.text(canvas, Art.body_font(), Vector2(40, 670), "← / → · Pagina %d/%d     %s · Chiudi" % [journal_page + 1, maxi(1, ceili(entries.size() / 6.0)), Controls.label("map")], 20, Art.CREMA)
