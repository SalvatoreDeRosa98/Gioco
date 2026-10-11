extends SceneTree
## Parità JSON -> scena (griglia 64 px): stesse entità, geometria entro mezza cella, stessa raggiungibilità.
const LevelScenes := preload("res://game/level_scenes.gd")
const ROOMS := [5, 9, 13, 15]
const TOL := 32.0
## Salto verticale massimo usato per la raggiungibilità (tuning.json -> player.jump_height_max).
const JUMP_UP := 200.0
const JUMP_REACH := 280.0
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	for idx in ROOMS:
		check(LevelScenes.has_scene(idx), "Stanza %d: scena registrata e presente" % idx)
		LevelScenes.enabled = false
		var a := Room.build(idx)
		LevelScenes.enabled = true
		var b := Room.build(idx)
		check(b.get("scene", "") != "", "Stanza %d: Room.build usa la scena" % idx)
		check(a.size == b.size and a.floor == b.floor and a.name == b.name, "Stanza %d: dimensioni, pavimento e nome invariati" % idx)
		_compare_rects(idx, "blocks", a.blocks, b.blocks)
		_compare_rects(idx, "ledges", a.ledges, b.ledges)
		for key in ["enemies", "npcs"]:
			check(a[key].size() == b[key].size(), "Stanza %d: numero di %s" % [idx, key])
			for i in mini(a[key].size(), b[key].size()):
				check(a[key][i].get("type", a[key][i].get("id")) == b[key][i].get("type", b[key][i].get("id")), "Stanza %d: %s %d stesso tipo" % [idx, key, i])
				check(a[key][i].pos.distance_to(b[key][i].pos) <= TOL + 1, "Stanza %d: %s %d entro %d px" % [idx, key, i, TOL])
		check(a.secrets.size() == b.secrets.size(), "Stanza %d: numero di segreti" % idx)
		for i in mini(a.secrets.size(), b.secrets.size()):
			check(a.secrets[i].distance_to(b.secrets[i]) <= TOL + 1, "Stanza %d: segreto %d entro %d px" % [idx, i, TOL])
		check(_reachable(a) == _reachable(b), "Stanza %d: stesse mensole raggiungibili da terra (%s / %s)" % [idx, _reachable(a), _reachable(b)])
		var marks: Array = Room.Expansion.data().landmarks.get(str(idx), [])
		for i in marks.size():
			var p: Vector2 = b.landmark_pos.get(i, Vector2(marks[i].pos[0], marks[i].pos[1]))
			check(p.distance_to(Vector2(marks[i].pos[0], marks[i].pos[1])) <= TOL + 1, "Stanza %d: punto d'interesse %d entro %d px" % [idx, i, TOL])
			check(_near_surface(b, p), "Stanza %d: punto d'interesse %d appoggiato a una superficie" % [idx, i])
		for key in b.get("pos_alias", {}):
			check(b.pos_alias[key] is Vector2, "Stanza %d: alias di salvataggio valido" % idx)
		# Le celle lette devono stare sulla griglia di 64 px rispetto all'origine della stanza.
		var oy := fposmod(float(b.floor), 64.0)
		for r in b.blocks:
			check(fposmod(r.position.x, 64.0) == 0.0 and is_equal_approx(fposmod(r.position.y - oy, 64.0), 0.0), "Stanza %d: blocco %s sulla griglia" % [idx, r])
		for r in b.ledges:
			check(fposmod(r.position.x, 64.0) == 0.0 and is_equal_approx(fposmod(r.position.y - oy, 32.0), 0.0), "Stanza %d: mensola %s sulla griglia (mezza cella in verticale)" % [idx, r])
	# Unione delle celle: due righe uguali diventano un solo blocco, corse separate restano separate.
	var merged := LevelScenes.merge_cells([Vector2i(0, 0), Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(4, 0), Vector2i(0, 9)], 9)
	check(merged.size() == 2 and Rect2i(0, 0, 2, 2) in merged and Rect2i(4, 0, 1, 1) in merged, "merge_cells: blocchi uniti, pavimento escluso")
	print("level_scene_parity_test: %d fallimenti" % failures)
	quit(1 if failures else 0)

func _compare_rects(idx: int, key: String, a: Array, b: Array) -> void:
	check(a.size() == b.size(), "Stanza %d: numero di %s (%d / %d)" % [idx, key, a.size(), b.size()])
	var sa := a.duplicate()
	var sb := b.duplicate()
	var by_pos := func(x: Rect2, y: Rect2): return x.position.x < y.position.x or (x.position.x == y.position.x and x.position.y < y.position.y)
	sa.sort_custom(by_pos)
	sb.sort_custom(by_pos)
	for i in mini(sa.size(), sb.size()):
		var ra: Rect2 = sa[i]
		var rb: Rect2 = sb[i]
		check(rb.position.x <= ra.position.x and ra.position.x - rb.position.x < 64 and rb.end.x >= ra.end.x and rb.end.x - ra.end.x < 64 and absf(ra.position.y - rb.position.y) <= TOL, "Stanza %d: %s %s coperto da %s (bordi entro una cella, mai più stretto)" % [idx, key, ra, rb])

## Indici (nell'ordine JSON) delle mensole raggiungibili partendo dal pavimento, solo con salti.
func _reachable(r: Dictionary) -> Array:
	var surf: Array = [Rect2(0, r.floor, r.size.x, 1)]
	for l in r.ledges + r.blocks:
		surf.append(l)
	var seen := {0: true}
	var queue := [0]
	while not queue.is_empty():
		var cur: Rect2 = surf[queue.pop_front()]
		for j in surf.size():
			if seen.has(j):
				continue
			var nxt: Rect2 = surf[j]
			var rise := cur.position.y - nxt.position.y
			var gap := maxf(0.0, maxf(nxt.position.x - cur.end.x, cur.position.x - nxt.end.x))
			if rise <= JUMP_UP and gap <= JUMP_REACH:
				seen[j] = true
				queue.append(j)
	var out := seen.keys()
	out.sort()
	return out

func _near_surface(r: Dictionary, p: Vector2) -> bool:
	if absf(float(r.floor) - p.y) <= 65:
		return true
	for l in r.ledges + r.blocks:
		if p.x >= l.position.x - 66 and p.x <= l.end.x + 66 and absf(l.position.y - p.y) <= 65:
			return true
	return false
