extends SceneTree
## Ratking e Lanterniere v2 a fotogrammi (flag art_v2 in tuning.json, vecchi atlanti in legacy/),
## stanza 13 a due ondate e anello-presagio non agganciabile nell'arena di Ratking.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	var T: Dictionary = root.get_node("Tuning").data
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.set_process(false)
	world.set_physics_process(false)

	# 1. Arte v2 e ripiego.
	for n in ["ratking", "lanterniere"]:
		check(ResourceLoader.exists("res://assets/art/characters/npc_puppets/legacy/%s.png" % n), "Vecchio atlante %s conservato in legacy/" % n)
		check(ResourceLoader.exists("res://assets/art/characters/enemies_v2/%s.png" % n), "Atlante v2 %s presente" % n)
		var sheet: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/art/characters/enemies_v2/%s.json" % n))
		check(int(sheet.margin) >= 4, "%s: margine trasparente di almeno 4 px" % n)
	var zoom := 1.6  # zoom di feat/ui-audio, come per Ferruccio
	check(absf(float(T.ratking.art_v2_height) * zoom - 180.0) < 6.0, "Ratking a 180 px a 1080p")
	check(absf(float(T.lanterniere.art_v2_height) * zoom - 140.0) < 6.0, "Lanterniere a 140 px a 1080p")

	# 2. Stanza 13: prima statua e lanterniere, poi lanterniere, gatto e vespa.
	world._go(13, true)
	await process_frame
	var first := {}
	for e in get_nodes_in_group("enemies"):
		first[e.kind] = int(first.get(e.kind, 0)) + 1
	check(first == {"statua": 1, "lanterniere": 1}, "Stanza 13, prima ondata: statua e lanterniere (%s)" % [first])
	var lant: Node = null
	for e in get_nodes_in_group("enemies"):
		if e.kind == "lanterniere":
			lant = e
	if lant:
		check(lant._rig.get_script() == preload("res://game/frame_puppet.gd"), "Il lanterniere usa l'arte v2")
		lant._rig.set_action("windup", 0.5)
		lant._rig.pose(0.0, 1.0, Color.RED, 0, false, false)
		check(lant._rig.frame == "windup" and lant._rig._sprite.modulate == Color.RED, "Preavviso: posa windup con la tinta colorata")
		# CONTROLLO-SLICE3 §7-8: contorno e rim azzurro, lanterna sempre accesa, camminata sfalsata.
		var lm: ShaderMaterial = lant._rig._group.material
		check(is_equal_approx(float(lm.get_shader_parameter("outline_px")), 3.0) and is_equal_approx(float(lm.get_shader_parameter("rim_strength")), 0.6), "Lanterniere: contorno 3 px e rim 0,6")
		check(lant._rig._glow != null and lant._rig._glow.visible and lant._rig._glow.modulate.a >= 0.99, "Lanterna al massimo nel windup")
		lant._rig.set_action("", 0.0)
		var seen := {}
		for i in 8:
			lant._rig.pose(i * 0.17, 1.0, Color.WHITE, 0, false, true)
			seen[lant._rig.frame] = true
			check(lant._rig._glow.visible and absf(lant._rig._glow.modulate.a - 0.5) < 0.01, "Lanterna accesa camminando (%s)" % lant._rig.frame)
	var pend: Array = []
	for e in world.pending_wave:
		pend.append(e.type)
	pend.sort()
	check(pend == ["gatto", "lanterniere", "vespa"], "Seconda ondata in attesa (%s)" % [pend])
	for e in get_nodes_in_group("enemies"):
		e.remove_from_group("enemies")
		e.queue_free()
	await process_frame
	world._room_t = 5.0
	world._check_cleared()
	check(not world.room_cleared, "Stanza non ripulita prima della seconda ondata")
	for i in 120:
		world._check_cleared()
		if world.pending_wave.is_empty():
			break
		await physics_frame
	await process_frame
	var second := {}
	for e in get_nodes_in_group("enemies"):
		second[e.kind] = int(second.get(e.kind, 0)) + 1
	check(second == {"lanterniere": 1, "gatto": 1, "vespa": 1}, "Seconda ondata entrata (%s)" % [second])

	# 3. Arena di Ratking: anello disegnato ma non agganciabile; Ratking con l'arte v2.
	world._go(15, true)
	await process_frame
	var trav = world.traversal if "traversal" in world else null
	if trav == null:
		for c in world.get_children():
			if c.get_script() and c.get_script().resource_path == "res://game/traversal.gd":
				trav = c
	check(trav != null and trav.omen_rings.size() == 1, "Anello-presagio nell'arena")
	if trav:
		var ring := Vector2(trav.omen_rings[0][0], trav.omen_rings[0][1])
		check(trav.anchor(ring + Vector2(0, 150), 1000.0) == Vector2.INF, "L'anello non è agganciabile")
	for e in get_nodes_in_group("enemies"):
		if e.kind == "ratking":
			check(e._rig.get_script() == preload("res://game/frame_puppet.gd"), "Ratking usa l'arte v2")
			e._rig.set_attack("charge")
			e._rig.set_action("windup", 0.5)
			e._rig.pose(0.0, 1.0, Color.WHITE, 0, false, false)
			check(e._rig.frame == "charge_windup", "Ratking: posa di preavviso della carica")
			var rm: ShaderMaterial = e._rig._group.material
			check(is_equal_approx(float(rm.get_shader_parameter("rim_strength")), 0.5) and is_equal_approx(float(rm.get_shader_parameter("rim_px")), 2.0), "Ratking: rim azzurro 2 px alfa 0,5")
			e._state = "windup"
			e._attack = "charge"
			e._duration = 1.0
			e._timer = 0.6
			e._process(0.0)
			check(e._rig._sprite.modulate == Color.WHITE, "Preavviso della carica senza tinta sullo sprite")
			e._timer = 0.1
			e._process(0.0)
			check(e._rig._sprite.modulate == Color(1.25, 1.1, 1.0), "Lampo finale con modulate (1.25, 1.1, 1)")
	print("COMBAT ART WAVES TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
