extends SceneTree
## Titolo senza 'SEGNAPOSTO', motto con MDCCCXLV intero dentro lo schermo e la velatura a 1280x720,
## 1600x900, 1920x1080; stanza 13: HUD, avvisi, titolo d'area e scritte dei passaggi dentro lo schermo.
var failures := 0

func check(v: bool, d: String) -> void:
	if not v:
		failures += 1
		push_error(d)

func _initialize() -> void:
	_run.call_deferred()

func _run() -> void:
	SaveSlots.dir = "user://test-layout-slots/"
	InputRemap.path = "user://test-layout-input.cfg"
	var src := FileAccess.get_file_as_string("res://game/title_screen.gd")
	for line in src.split("\n"):
		var code := line.strip_edges()
		if not code.begins_with("#") and code.contains("\"") :
			check(not code.to_upper().contains("SEGNAPOSTO"), "Titolo: nessuna scritta SEGNAPOSTO disegnata (%s)" % code)
	var title = load("res://game/title_screen.gd").new()
	check(title.MOTTO.contains("MDCCCXLV"), "Il motto contiene MDCCCXLV (1845)")
	for vp in [Vector2(1280, 720), Vector2(1600, 900), Vector2(1920, 1080)]:
		var r: Rect2 = title.motto_rect(vp)
		var s: int = title.motto_size(vp)
		var w := Art.title_wide().get_string_size(title.MOTTO, HORIZONTAL_ALIGNMENT_LEFT, -1, s).x
		check(w <= r.size.x and Rect2(Vector2.ZERO, vp).encloses(r), "%s: motto intero (%.0f px in %s)" % [vp, w, r])
		check(title.cart_rect(vp).grow(1.0).encloses(r), "%s: motto dentro la velatura" % vp)
	title.free()
	# --- stanza 13
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	await process_frame
	main._on_play_pressed(false, 1)
	var world = main._world
	world.save_path = "user://test-layout-save.json"
	await process_frame
	world._go(13, true)
	for i in 5:
		await process_frame
	var vp: Vector2 = world.get_viewport().get_visible_rect().size
	var screen := Rect2(Vector2.ZERO, vp)
	var hud = world._hud
	check(screen.encloses(hud.vitals_rect()), "Stanza 13: pannello HUD dentro lo schermo")
	var tw: float = Art.title_wide().get_string_size("CISTERNE SEPOLTE", HORIZONTAL_ALIGNMENT_LEFT, -1, hud.title_size("CISTERNE SEPOLTE", vp.x)).x
	check(tw <= vp.x - 2.0 * hud.TITLE_SIDE + 1.0, "Stanza 13: titolo d'area entro i margini")
	var long := "Muro incrinato: serve il martello del calcare per aprirlo, e qualcosa di piu'"
	check(Art.body_font().get_string_size(long, HORIZONTAL_ALIGNMENT_LEFT, -1, 18).x < vp.x, "Avviso lungo entro lo schermo")
	var ex = world._expedition
	check(ex != null and ex.marks.size() > 0, "Stanza 13: passaggi presenti")
	var checked := 0
	for x in [60.0, 200.0, 400.0, 900.0, 1500.0]:
		world.player.position.x = x
		for i in 4:
			await process_frame
		var xf: Transform2D = ex.get_global_transform_with_canvas()
		for m in ex.marks:
			var p := Vector2(m.pos[0], m.pos[1])
			var anchor := p - Vector2(0, ex.ARCH_SPRING + ex.ARCH_R + 60 if m.kind == "route" else 86)
			var lr: Rect2 = xf * ex.label_rect(anchor, "E  " + str(m.get("label", "")))
			var on_screen: bool = screen.intersects(xf * Rect2(p - Vector2(40, 200), Vector2(80, 200)))
			if not on_screen:
				continue
			check(screen.grow(1.0).encloses(lr), "Stanza 13 x=%.0f: scritta '%s' dentro lo schermo %s" % [x, m.get("label", ""), lr])
			check(not lr.intersects(hud.vitals_rect()), "Stanza 13 x=%.0f: scritta '%s' non sotto il pannello HUD" % [x, m.get("label", "")])
			checked += 1
	check(checked > 0, "Stanza 13: almeno una scritta di passaggio controllata")
	DirAccess.remove_absolute("user://test-layout-save.json")
	print("layout_text_test: ", "OK" if failures == 0 else "%d fallimenti" % failures)
	quit(failures)