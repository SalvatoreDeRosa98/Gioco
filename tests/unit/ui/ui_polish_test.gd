extends SceneTree
## Rifiniture: flag da sviluppatore e niente sovrapposizioni fra barra del boss, dialoghi/narrazioni,
## titolo d'area e coda avvisi (Ratking e Cavaliere); titolo con velatura piccola; icona Guanti.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(value: bool, description: String) -> void:
	if not value:
		failures += 1
		push_error(description)

func _no_overlap(world, label: String) -> void:
	var vp: Vector2 = world.get_viewport().get_visible_rect().size
	var bar: Rect2 = world.boss_bar_layer.get_child(0).bar_rect(vp.x)
	check(world._dialogue.is_open(), label + ": la narrazione e' aperta")
	var box: Rect2 = world._dialogue.panel_rect(vp.x)
	check(not bar.intersects(box), label + ": barra del boss %s e riquadro narrazione %s non si toccano" % [bar, box])
	check(not world._hud.area_title_visible(), label + ": niente titolo d'area sopra la narrazione")
	world._hud.toast("Avviso di prova")
	var notice_top: float = vp.y - world._hud.NOTICE_BOTTOM - 26.0 - (world._hud.notices.max_visible - 1) * world._hud.NOTICE_STEP
	check(notice_top > box.end.y, label + ": la coda avvisi resta sotto la narrazione (%.0f > %.0f)" % [notice_top, box.end.y])

func _run() -> void:
	SaveSlots.dir = "user://test-polish-slots/"
	InputRemap.path = "user://test-polish-input.cfg"
	# --- Flag dev
	DevFlags.force = -1
	check(not DevFlags.enabled(), "Senza --dev ne' impostazione gli strumenti dev sono spenti")
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	await process_frame
	main._on_play_pressed(false, 1)
	var world = main._world
	world.save_path = "user://test-polish-save.json"
	await process_frame
	world.player.invulnerable = true
	check(not world._hud.dev_overlay_visible(), "Invulnerabile da test ma senza flag: nessuna scritta SVILUPPATORE")
	world.player.invulnerable = false
	world._toggle_developer_mode()
	check(not world.player.invulnerable, "Ctrl+Maiusc+F12 non fa nulla senza flag")
	DevFlags.force = 1
	world._toggle_developer_mode()
	check(world.player.invulnerable and world._hud.dev_overlay_visible(), "Con il flag la modalita' dev funziona e si vede")
	var vp0: Vector2 = world.get_viewport().get_visible_rect().size
	check(not world._hud.dev_overlay_rect(vp0).intersects(world.boss_bar_layer.get_child(0).bar_rect(vp0.x)), "La scritta dev non tocca mai il cartiglio del boss")
	DevFlags.force = -1
	# --- Ratking: narrazione all'attivazione
	world._go(Room.RATKING_ROOM, true)
	await process_frame
	var rk = null
	for e in get_nodes_in_group("enemies"):
		if e.get("kind") == "ratking":
			rk = e
	check(rk != null, "Ratking presente")
	if rk:
		rk.activate()
		for i in 4:
			await process_frame
		_no_overlap(world, "Ratking")
		world._hud.area_title("Tana di Ratking", "")
		world._dialogue.debug_skip()
		for i in 30:
			if world.is_talking(): world._dialogue.debug_skip()
			await process_frame
		check(not world._hud.area_title_visible() and world._hud._title_t < 0.0, "Ratking: TANA DI RATKING non resta a schermo durante lo scontro")
		world._dialogue.debug_skip()
	# --- Cavaliere: arena, titolo d'area e narrazione
	world._go(Room.BOSS_ROOM, true)
	await process_frame
	world._arena.activate()
	for i in 4:
		await process_frame
	check(not world._hud.area_title_visible(), "Cavaliere: niente titolo d'area sopra lo scontro")
	world.narrate({"lines": [{"who": "gregorio", "text": "Prova di sovrapposizione"}]})
	for i in 4:
		await process_frame
	_no_overlap(world, "Cavaliere")
	# --- Titolo: velatura piccola e semitrasparente
	var title = load("res://game/title_screen.gd").new()
	var vp := Vector2(1280, 720)
	var cart: Rect2 = title.cart_rect(vp)
	check(cart.size.x <= vp.x * 0.55 and cart.size.y <= vp.y * 0.4, "Velatura del titolo piccola: %s" % cart)
	check(title.CART_ALPHA <= 0.6, "Velatura semitrasparente")
	check(cart.position.y > vp.y * 0.2, "I putti in alto restano scoperti")
	title.free()
	# --- Icona Guanti collegata, Rampino e Martello con le illustrazioni esistenti
	var icons: Dictionary = load("res://game/world_map.gd").SKILL_ICONS
	check(icons.wall_grip.resource_path.ends_with("segnaposto/abilita_guanti.png"), "Guanti: icona 96x96")
	check(icons.wall_grip.get_width() == 96, "Icona Guanti 96x96")
	check(icons.grapple.resource_path.ends_with("carta/icona_catena.png") and icons.hammer.resource_path.ends_with("carta/icona_martello.png"), "Rampino e Martello restano illustrati")
	world._shop.show_shop()
	await process_frame
	check(world._shop._rows.find_child("Icona_wall_grip", true, false) != null, "Il banco della fucina mostra l'icona dei Guanti")
	world._shop.hide_shop()
	DirAccess.remove_absolute("user://test-polish-save.json")
	print("ui_polish_test: ", "OK" if failures == 0 else "%d fallimenti" % failures)
	quit(failures)