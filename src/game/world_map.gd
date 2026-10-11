extends CanvasLayer
const DialogueBoxScript := preload("res://game/dialogue_box.gd")
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
	canvas.draw_rect(Rect2(Vector2.ZERO, viewport), Color(0.02, 0.025, 0.04, 0.97))
	var scale := minf(viewport.x / 1320.0, viewport.y / 720.0)
	canvas.draw_set_transform((viewport - Vector2(1320,720) * scale) / 2, 0, Vector2.ONE * scale)
	Art.text(canvas, Art.title_font(), Vector2(40, 45), "LE STRADE DELLA REGGIA", 25, Art.OCRA)
	Art.text(canvas, Art.body_font(), Vector2(800,45), "Tab / "+Controls.label("interact")+" · "+("Mappa" if journal else "Registro missioni"),20,Art.CREMA)
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
	Art.text(canvas, Art.title_font(), Vector2(40, 78), "SIGILLI: %d / 7" % seal_count, 16, Art.CREMA)
	var sy := 100.0
	for k in Room.Expansion.DISTRICT_SEALS:
		var has_it: bool = world.story.times_seen(k) > 0
		var col := Art.OCRA if has_it else Color(0.42, 0.44, 0.48)
		var mark := "✔ " if has_it else "○ "
		Art.text(canvas, Art.body_font(), Vector2(40, sy), mark + seal_names.get(k, k), 13, col)
		sy += 18.0
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
				canvas.draw_polyline(PackedVector2Array([PLACES[14], Vector2(1050,75), Vector2(1050,320), PLACES[11]]), Color(Art.OCRA,0.45),2,true)
			else:
				canvas.draw_line(PLACES[pair[0]], PLACES[pair[1]], Color(Art.OCRA, 0.45), 2, true)
	for idx in PLACES:
		if world.story.times_seen("visited_%d" % idx) == 0:
			continue
		var p: Vector2 = PLACES[idx]
		var r := Room.build(idx)
		var dims := Vector2(146, 48) if r.size.y < 1500 else Vector2(115, 80)
		canvas.draw_rect(Rect2(p - dims / 2, dims), Color("#263741"))
		canvas.draw_rect(Rect2(p - dims / 2, dims), Art.CREMA if idx == world.room_index else Art.OCRA, false, 2)
		Art.text(canvas, Art.body_font(), p + Vector2(-90, 5), r.name, 14, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 180)
		if idx == world.room_index:
			canvas.draw_circle(p + Vector2(0, dims.y / 2 + 10), 4, Art.CREMA)
	var close_txt := Controls.label("map") + " / " + Controls.label("pause") + "  Chiudi"
	var skills_txt := Controls.label("grapple") + " Catena · " + Controls.label("hammer") + " Martello · " + Controls.label("heal") + " Cura con 4 braci · Giù + " + Controls.label("attack") + " Rimbalzo"
	Art.text(canvas, Art.body_font(), Vector2(40, 670), "%s   ·   Punto bianco: sei qui   ·   Esplora per completare la carta" % close_txt, 20, Art.CREMA)
	Art.text(canvas, Art.body_font(), Vector2(40, 701), skills_txt, 17, Art.OCRA)

func _draw_journal() -> void:
	var entries := quest_entries()
	Art.text(canvas,Art.title_font(),Vector2(40,94),"REGISTRO MISSIONI",24,Art.CREMA)
	var first := journal_page*6
	for i in range(first,mini(first+6,entries.size())):
		var quest: Dictionary = entries[i]
		var y := 145.0+float(i-first)*80
		var color := Color(.5,.65,.58) if quest.done else Art.OCRA
		Art.text(canvas,Art.title_font(),Vector2(40,y),("COMPLETATA · " if quest.done else "DA FARE · ")+str(quest.title),20,color)
		Art.text(canvas,Art.body_font(),Vector2(40,y+29),quest.text,20,Art.CREMA)
	Art.text(canvas,Art.body_font(),Vector2(40,670),"← / → · Pagina %d/%d     %s · Chiudi" % [journal_page+1,maxi(1, ceili(entries.size()/6.0)),Controls.label("map")],20,Art.CREMA)
