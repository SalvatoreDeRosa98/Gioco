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
	check(max_seen <= 1, "Stanza 13: mai piu' di un avviso in basso (visti %d)" % max_seen)
	check(title_seen, "Il titolo d'area e' comparso")
	check(name_after, "Sparito il titolo, il nome del nemico compare")
	DirAccess.remove_absolute("user://test-r13-save.json")
	print("room13_text_test: ", "OK" if failures == 0 else "%d fallimenti" % failures)
	quit(failures)