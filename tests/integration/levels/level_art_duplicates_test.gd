extends SceneTree
## Prototipo artistico Cisterne (stanze 9, 13, 15): nessun elemento vecchio disegnato dal codice sotto
## al suo sostituto dipinto. Fallisce se nella stessa stanza convivono:
##  - cancello dipinto e portale/grata di terrain.gd sullo stesso lato;
##  - oggetto dipinto e landmark di expedition.gd (ruota/ingranaggi, arco con saracinesca) dentro l'ingombro del disegno;
##  - muro incrinato dipinto e muro incrinato procedurale; tile dipinti e blocchi/mensole di terrain.gd;
##  - fondale in parallasse e fondale vecchio (Backdrop, painted_interior).
## Controlla anche che il muro incrinato non sia deformato e che il disegno coincida con la collisione.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	var Traversal = load("res://game/traversal.gd")
	world.set_physics_process(false)
	for idx in [9, 13, 15]:
		world._go(idx, true)
		await process_frame
		var r: Dictionary = world.room
		check(r.get("tile_art", false), "Stanza %d: prototipo artistico attivo" % idx)
		# Fondali: solo il piano medio in parallasse.
		check(not world._backdrop.visible, "Stanza %d: fondale vecchio (Backdrop) nascosto" % idx)
		check(world._forge_backdrop.get_script().resource_path.ends_with("scene_backdrop.gd"), "Stanza %d: niente painted_interior sotto la parallasse" % idx)
		var painted := 0
		for c in world.get_children():
			if c.get_script() and c.get_script().resource_path.ends_with("painted_interior.gd"):
				painted += 1
		check(painted == 0, "Stanza %d: nessun painted_interior rimasto (%d)" % [idx, painted])
		# Terreno: con i tile dipinti terrain.gd non disegna blocchi né mensole.
		check(world._terrain.room.blocks.is_empty() and world._terrain.room.ledges.is_empty(), "Stanza %d: terrain.gd non ridisegna blocchi e mensole" % idx)
		# Oggetti dipinti contro il vecchio disegnato dal codice.
		var props: Array = r.get("props", [])
		for p in props:
			if p.kind == "gate":
				check(not world._terrain.draws_portal(str(p.side)), "Stanza %d: cancello dipinto e portale vecchio a %s" % [idx, p.side])
			var exp = world._expedition
			for i in exp.marks.size():
				var m: Dictionary = exp.marks[i]
				var mp := Vector2(m.pos[0], m.pos[1])
				# Ingombro del disegno: larghezza ~0.75 dell'altezza, più margine.
				if absf(mp.x - p.pos.x) < float(p.get("height", 200.0)) * 0.375 + 40.0 and absf(mp.y - p.pos.y) < float(p.get("height", 200.0)):
					check(not exp.draws_mark(i), "Stanza %d: %s dipinto sopra il landmark disegnato %s" % [idx, p.kind, m.id])
		# Lati senza cancello dipinto: il portale vecchio resta (non c'è un sostituto).
		for side in ["left", "right"]:
			if not props.any(func(p): return p.kind == "gate" and p.get("side", "") == side):
				check(world._terrain.draws_portal(side), "Stanza %d: portale %s senza sostituto deve restare" % [idx, side])
		# Muri incrinati: solo il disegno a 3 stati, in proporzione e grande quanto la collisione.
		for c in world.traversal.cracks:
			var rect := Rect2(c.rect[0], c.rect[1], c.rect[2], c.rect[3])
			for tex in Traversal.CRACK_ART:
				var reg: Rect2 = Traversal.crack_region(tex, rect)
				check(absf(reg.size.x / reg.size.y - rect.size.x / rect.size.y) < 0.01 and Rect2(Vector2.ZERO, Vector2(tex.get_size())).encloses(reg), "Stanza %d: muro %s non deformato" % [idx, c.id])
			var body: StaticBody2D = world.traversal.get_node_or_null(NodePath(c.id))
			if body:
				var shape: CollisionShape2D = body.get_child(0)
				check(Rect2(shape.position - shape.shape.size / 2.0, shape.shape.size).is_equal_approx(rect), "Stanza %d: collisione del muro %s = disegno" % [idx, c.id])
	main.queue_free()
	await process_frame
	print("level_art_duplicates_test: %d fallimenti" % failures)
	quit(1 if failures else 0)
