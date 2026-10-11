extends SceneTree
## Stanza 13 all'ingresso: mai piu' di un avviso in basso; il nome del nemico (es. Lanterniere del Velo)
## non compare sopra titolo/sottotitolo d'area e, quando compare, non ne interseca il riquadro.
var failures := 0

func check(v: bool, d: String) -> void:
	if not v:
		failures += 1
		push_error(d)

func _initialize() -> void:
	_run.call_deferred()

func _run() -> void:
	SaveSlots.dir = "user://test-r13-slots/"
	InputRemap.path = "user://test-r13-input.cfg"
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	await process_frame
	main._on_play_pressed(false, 1)
	var world = main._world
	world.save_path = "user://test-r13-save.json"
	await process_frame
	world.player.invulnerable = true
	world._go(13, true)
	world._hud.toast("Muro incrinato: serve il martello del calcare per aprirlo")
	world._hud.toast("Moneta raccolta")
	world._hud.toast("Terzo avviso")
	var vp: Vector2 = world.get_viewport().get_visible_rect().size
	var elites := []
	for e in get_nodes_in_group("enemies"):
		if e.has_method("name_rect_screen"):
			elites.append(e)
	check(not elites.is_empty(), "Stanza 13: c'e' almeno un nemico con nome")
	var max_seen := 0
	var title_seen := false
	var name_after := false
	var ex = world._expedition
	var labels_after := false
	var t0 := Time.get_ticks_msec()
	var i := 0
	while Time.get_ticks_msec() - t0 < 6500:  # tempo reale: tutto il titolo (4,4 s) e la dissolvenza del nome
		await process_frame
		i += 1
		max_seen = maxi(max_seen, world._hud.notices.visible().size())
		var tr: Rect2 = world._hud.title_rect(vp)
		var showing: bool = world._hud.area_title_visible()
		title_seen = title_seen or showing
		for e in elites:
			if not is_instance_valid(e):
				continue
			if showing:
				check(not e.name_visible() or not e.name_rect_screen().intersects(tr), "Frame %d: nome '%s' sopra il titolo d'area" % [i, e._cfg.name])
				check(e.name_deferred(), "Frame %d: nome rimandato mentre c'e' il titolo" % i)
			elif e.name_visible():
				name_after = true
		if showing:
			check(not ex.labels_visible(), "Frame %d: scritte dei passaggi nascoste mentre c'e' il titolo" % i)
		elif ex.labels_visible():
			labels_after = true
	check(max_seen <= 1, "Stanza 13: mai piu' di un avviso in basso (visti %d)" % max_seen)
	check(title_seen, "Il titolo d'area e' comparso")
	check(name_after, "Sparito il titolo, il nome del nemico compare")
	check(labels_after, "Sparito il titolo, le scritte dei passaggi compaiono")
	# Sfalsamento delle etichette (label_rank): name_rect_screen() segue lo stesso offset del disegno.
	var a = elites[0]
	var b = a.duplicate()
	b.world = a.world
	b._cfg = a._cfg
	b.kind = a.kind
	b._tex = a._tex
	b.process_mode = Node.PROCESS_MODE_DISABLED
	a.get_parent().add_child(b)
	b.global_position = a.global_position + Vector2(40, 0)
	await process_frame
	var lower = a if a.get_instance_id() > b.get_instance_id() else b
	check(lower.label_rank() >= 1, "Due nemici con nome vicini: uno ha rango >= 1")
	check(is_equal_approx(lower.label_dy(), -lower.LABEL_STEP * lower.label_rank()), "label_dy() = -LABEL_STEP * label_rank()")
	var base_y: float = (lower.get_global_transform_with_canvas() * Vector2(0, -float(lower._cfg.height) + lower.half.y - 45)).y
	var scale_y: float = lower.get_global_transform_with_canvas().get_scale().y
	check(is_equal_approx(lower.name_rect_screen().position.y, base_y + lower.label_dy() * scale_y), "name_rect_screen() include lo sfalsamento (%.1f vs %.1f)" % [lower.name_rect_screen().position.y, base_y + lower.label_dy() * scale_y])
	b.queue_free()
	DirAccess.remove_absolute("user://test-r13-save.json")
	print("room13_text_test: ", "OK" if failures == 0 else "%d fallimenti" % failures)
	quit(failures)