extends SceneTree
## Zona 2 «Campanile e Orologi»: stanze 12 e 14 in scena (tools/levels/zone2_design.gd).
## Controlla: dati dalle scene (uscite, anelli, muri, incudini, nemici esistenti, landmark), raggiungibilità
## con e senza abilità (salto+doppio salto, rampino, guanti, martello), arrivi compatibili coi JSON vicini,
## un solo disegno per elemento (fondale, terreno, muri) e la salita fisica sul percorso di riferimento.
const LevelScenes := preload("res://game/level_scenes.gd")
const JUMP_UP := 200.0
const JUMP_REACH := 280.0
const GRAPPLE := 420.0
const KNOWN_ENEMIES := ["vespa", "gatto", "statua", "spettro", "lanterniere", "guardia", "duellante", "cavaliere", "ratking"]
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	for idx in [12, 14]:
		var r := Room.build(idx)
		check(r.get("scene", "") != "", "Stanza %d: costruita dalla scena" % idx)
		var layers := LevelScenes.physics_layers(idx)
		check(layers.size() == 2, "Stanza %d: Terrain e OneWay con collisioni" % idx)
		for l in layers:
			check(l.tile_set.get_physics_layers_count() == 2 and not l.get_used_cells().is_empty(), "Stanza %d: %s con collisioni" % [idx, l.name])
			l.free()
		check(LevelScenes.saves_for(idx).size() == 1, "Stanza %d: un'incudine" % idx)
		check(_reach(r, r.saves[0].pos, {}), "Stanza %d: incudine raggiungibile senza abilità" % idx)
		check(r.secrets.size() == 2, "Stanza %d: due segreti" % idx)
		for e in r.enemies:
			check(e.type in KNOWN_ENEMIES and not e.get("placeholder", false), "Stanza %d: nemico di tipo esistente (%s)" % [idx, e.type])
		check(ResourceLoader.exists(str(r.get("mid_art", ""))), "Stanza %d: fondale del piano medio" % idx)
	var r12 := Room.build(12)
	var top: Dictionary = r12.vertical.filter(func(x): return x.side == "top")[0]
	var bottom: Dictionary = r12.vertical.filter(func(x): return x.side == "bottom")[0]
	check(top.get("need", "") == "wall_grip" and int(top.target) == 14 and int(bottom.target) == 3, "Campanile: giù al Belvedere, su alla Galleria coi guanti")
	check(_reach(r12, r12.landmark_pos[0], {}), "Campanile: le campane si raggiungono saltando")
	check(_reach(r12, Vector2(672, 284), {}), "Campanile: pianerottolo sotto l'uscita raggiungibile")
	check(not _reach(r12, r12.secrets[0], {"grapple": true, "wall_grip": true}), "Campanile: nicchia murata chiusa senza martello (anche con rampino e guanti)")
	check(_reach(r12, r12.secrets[0], {"hammer": true}), "Campanile: nicchia aperta col martello")
	check(not _reach(r12, r12.secrets[1], {}), "Campanile: nido irraggiungibile senza abilità")
	check(_reach(r12, r12.secrets[1], {"grapple": true}), "Campanile: nido raggiungibile col rampino")
	# Arrivo dal Belvedere (JSON della stanza 3): in piedi su una mensola, non sopra il varco.
	var from3: Dictionary = Room.build(3).vertical.filter(func(x): return int(x.target) == 12)[0]
	check(_standing(r12, Vector2(from3.spawn[0], from3.spawn[1])), "Campanile: arrivo dal Belvedere su una superficie")
	check(_standing(r12, Vector2(Room.build(14).vertical[0].spawn[0], Room.build(14).vertical[0].spawn[1])), "Campanile: arrivo dalla Galleria su una superficie")
	var r14 := Room.build(14)
	var ids: Array = r14.cracks.map(func(c): return c.id)
	check("clock_wall_west" in ids and "clock_wall_east" in ids, "Galleria: i due muri della memoria con gli id dei salvataggi")
	var memory: Vector2 = r14.landmark_pos[0]
	check(not _reach(r14, memory, {"grapple": true, "wall_grip": true}), "Galleria: memoria chiusa senza martello (anche con rampino e guanti)")
	check(_reach(r14, memory, {"hammer": true}), "Galleria: memoria raggiungibile col martello")
	check(not _reach(r14, r14.secrets[0], {}) and _reach(r14, r14.secrets[0], {"grapple": true}), "Galleria: segreto ovest col rampino")
	check(not _reach(r14, r14.secrets[1], {}) and _reach(r14, r14.secrets[1], {"grapple": true}), "Galleria: segreto est col rampino")
	check(_standing(r14, Vector2(top.spawn[0], top.spawn[1])), "Galleria: arrivo dal Campanile su una mensola")
	var from11: Dictionary = Room.build(11).vertical.filter(func(x): return int(x.target) == 14)[0]
	check(_standing(r14, Vector2(from11.spawn[0], from11.spawn[1])), "Galleria: arrivo dagli Archivi sul pavimento")
	# In gioco: un solo disegno per elemento.
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.set_physics_process(false)
	for idx in [12, 14]:
		world._go(idx, true)
		await process_frame
		check(not world._backdrop.visible and world._forge_backdrop.get_script().resource_path.ends_with("scene_backdrop.gd"), "Stanza %d: solo il fondale in parallasse (niente painted_interior)" % idx)
		var visible_tiles := 0
		for c in world._walls.get_children():
			if c is TileMapLayer and c.modulate.a > 0.01:
				visible_tiles += 1
		check(visible_tiles == 0 and not world._terrain.room.ledges.is_empty(), "Stanza %d: blockout disegnato solo da terrain.gd (tile invisibili)" % idx)
		check(world.stations.size() >= 1, "Stanza %d: incudine registrata" % idx)
	main.queue_free()
	await process_frame
	print("level_zone2_test: %d fallimenti" % failures)
	quit(1 if failures else 0)

## Vero se a pos (piedi) c'è una superficie entro 40 px sotto.
func _standing(r: Dictionary, pos: Vector2) -> bool:
	for s in _surfaces(r):
		if pos.x >= s.position.x and pos.x <= s.end.x and s.position.y - (pos.y + 24.0) >= -2.0 and s.position.y - (pos.y + 24.0) <= 40.0:
			return true
	return false

## Superfici d'appoggio: tratti di pavimento (senza i varchi), mensole, cime dei blocchi.
func _surfaces(r: Dictionary) -> Array:
	var out: Array = []
	var cells: Array = LevelScenes.read_scene(_idx(r)).floor_cells
	cells.sort()
	var cut: Array = r.blocks.duplicate()
	for c in r.cracks:
		cut.append(Rect2(c.rect[0], c.rect[1], c.rect[2], c.rect[3]))
	var start := -1000
	var prev := -1000
	for c in cells + [100000]:
		if c != prev + 1:
			if start > -1000:
				# Il pavimento si spezza sotto blocchi e muri incrinati: ogni tratto è una superficie a sé.
				var parts: Array = [Vector2(start * 64, (prev + 1) * 64)]
				for w: Rect2 in cut:
					if w.position.y < r.floor and w.end.y >= r.floor - 1.0:
						var next: Array = []
						for p: Vector2 in parts:
							if w.end.x <= p.x or w.position.x >= p.y:
								next.append(p)
							else:
								if w.position.x > p.x:
									next.append(Vector2(p.x, w.position.x))
								if w.end.x < p.y:
									next.append(Vector2(w.end.x, p.y))
						parts = next
				for p: Vector2 in parts:
					out.append(Rect2(p.x, r.floor, p.y - p.x, 1))
			start = c
		prev = c
	for l in r.ledges + r.blocks:
		out.append(l)
	return out

func _idx(r: Dictionary) -> int:
	return 12 if r.size.y > 2000 else 14

## Muri pieni: blocchi, muri incrinati intatti (senza martello), bordi della stanza.
func _walls(r: Dictionary, tools: Dictionary) -> Array:
	var out: Array = [Rect2(-64, -800, 64 + Room.EDGE, r.size.y + 1600), Rect2(r.size.x - Room.EDGE, -800, 64 + Room.EDGE, r.size.y + 1600)]
	out.append_array(r.blocks)
	if not tools.get("hammer", false):
		for c in r.cracks:
			out.append(Rect2(c.rect[0], c.rect[1], c.rect[2], c.rect[3]))
	return out

## Bloccato se, nella fascia orizzontale tra le due superfici, i muri non lasciano un varco alto almeno
## quanto Ferruccio (100 px) tra la cima del salto e la superficie più alta. Una superficie sotto un soffitto
## (es. la nicchia murata) si raggiunge solo di lato, dal varco tra soffitto e pavimento.
func _blocked(a: Rect2, b: Rect2, walls: Array) -> bool:
	var x0 := minf(a.get_center().x, b.get_center().x)
	var x1 := maxf(a.get_center().x, b.get_center().x)
	var hi := minf(a.position.y, b.position.y)
	var lo := hi - JUMP_UP - 100.0
	for pair in [[a, b], [b, a]]:
		var s: Rect2 = pair[0]
		var other: Rect2 = pair[1]
		for w: Rect2 in walls:
			var same := w.position.x <= other.get_center().x and w.end.x >= other.get_center().x and w.end.y <= other.position.y
			if not same and w.position.x <= s.position.x and w.end.x >= s.end.x and w.end.y <= s.position.y and w.end.y > lo:
				# Si entra di lato, uscendo da sotto il soffitto verso l'altra superficie.
				var right := other.get_center().x > s.get_center().x
				var sx0 := s.get_center().x if right else w.position.x - 1.0
				var sx1 := w.end.x + 1.0 if right else s.get_center().x
				if not _slot(sx0, sx1, w.end.y, s.position.y, walls):
					return true
	return not _slot(x0, x1, lo, hi, walls)

## Vero se tra x0 e x1 resta un varco verticale libero di almeno 100 px tra lo e hi.
func _slot(x0: float, x1: float, lo: float, hi: float, walls: Array) -> bool:
	var spans: Array = []
	for w: Rect2 in walls:
		if w.end.x <= x0 or w.position.x >= x1 or w.end.y <= lo or w.position.y >= hi:
			continue
		spans.append(Vector2(maxf(w.position.y, lo), minf(w.end.y, hi)))
	spans.sort_custom(func(p, q): return p.x < q.x)
	var y := lo
	for sp: Vector2 in spans:
		if sp.x - y >= 100.0:
			return true
		y = maxf(y, sp.y)
	return hi - y >= 100.0

## Raggiungibilità da terra (o dall'arrivo) con salto e doppio salto; tools: grapple, wall_grip, hammer.
func _reach(r: Dictionary, target: Vector2, tools: Dictionary) -> bool:
	var surf := _surfaces(r)
	var walls := _walls(r, tools)
	if tools.get("grapple", false):
		for ring in r.rings:
			surf.append(Rect2(ring[0] - 40, ring[1] + 40, 80, 1))
	var n_base := surf.size()
	var starts: Array = []
	for i in surf.size():
		# Partenze: i punti d'arrivo nella stanza (non i tratti chiusi, come la camera della memoria).
		for p: Vector2 in ([Vector2(300, r.floor), Vector2(480, 2204)] if _idx(r) == 12 else [Vector2(3310, r.floor), Vector2(440, 852)]):
			if p.x >= surf[i].position.x and p.x <= surf[i].end.x and absf(p.y - surf[i].position.y) < 2.0:
				starts.append(i)
	var seen := {}
	for s in starts:
		seen[s] = true
	var queue: Array = starts.duplicate()
	while not queue.is_empty():
		var ci: int = queue.pop_front()
		var cur: Rect2 = surf[ci]
		if target.x >= cur.position.x - 40 and target.x <= cur.end.x + 40 and target.y <= cur.position.y + 2 and cur.position.y - target.y <= JUMP_UP and not _blocked(cur, Rect2(target.x, target.y, 1, 1), walls):
			return true
		for j in surf.size():
			if seen.has(j):
				continue
			var nxt: Rect2 = surf[j]
			var ok := false
			var rise := cur.position.y - nxt.position.y
			var gap := maxf(0.0, maxf(nxt.position.x - cur.end.x, cur.position.x - nxt.end.x))
			if j >= n_base:
				# Anello: sopra il giocatore ed entro la portata del rampino da un punto della superficie.
				var ring := Vector2(nxt.get_center().x, nxt.position.y - 40)
				var near := Vector2(clampf(ring.x, cur.position.x, cur.end.x), cur.position.y - 24)
				ok = ring.y < near.y - 15 and near.distance_to(ring) <= GRAPPLE
			else:
				ok = rise <= JUMP_UP and gap <= JUMP_REACH
				if not ok and tools.get("wall_grip", false):
					ok = _grip(cur, nxt, walls)
			if ok and not _blocked(cur, nxt, walls):
				seen[j] = true
				queue.append(j)
	return false

## Guanti: si risale un muro vicino a entrambe le superfici, se nessun blocco attaccato al muro sbarra la salita.
func _grip(a: Rect2, b: Rect2, walls: Array) -> bool:
	if b.position.y >= a.position.y:
		return false
	for w: Rect2 in walls:
		for face in [w.position.x, w.end.x]:
			var da := minf(absf(a.position.x - face), absf(a.end.x - face))
			var db := minf(absf(b.position.x - face), absf(b.end.x - face))
			if da > 200.0 or db > 280.0 or b.position.y < w.position.y - JUMP_UP or a.position.y > w.end.y + 200.0:
				continue
			var stopped := false
			for o: Rect2 in walls:
				if o == w:
					continue
				var touches: bool = o.position.x <= face + 70.0 and o.end.x >= face - 70.0
				if touches and o.position.y < a.position.y and o.end.y > b.position.y + 1.0:
					stopped = true
			if not stopped:
				return true
	return false
