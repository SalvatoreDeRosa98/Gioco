extends RefCounted
## Adattatore stanze: se una stanza ha una scena costruita nell'editor (TileMapLayer a griglia di 64 px),
## la geometria e le posizioni vengono lette da lì; altrimenti restano quelle dei JSON.
## Le scene sono elencate in data/expansion.json -> "scene_rooms". Gli ID delle stanze non cambiano.
##
## Struttura attesa della scena (generata da res://tools/levels/json_to_scenes.gd):
##   Root (Node2D, meta: room_id, floor, grid_offset_y)
##   ├── Terrain  (TileMapLayer)  celle sopra la riga del pavimento = blocchi solidi
##   ├── OneWay   (TileMapLayer)  mensole attraversabili dal basso (spessore di gioco LEDGE_H);
##   │                           tile 1 = piano in alto nella cella, tile 4 = piano a metà cella (+32 px)
##   ├── Hazards / Reference (TileMapLayer, solo visivi: punte e muri incrinati restano nel JSON)
##   └── Markers/Enemies, Markers/Npcs, Markers/Secrets, Markers/Landmarks (Marker2D con metadati)

const TILE := 64
const LEDGE_H := 18.0
const LEDGE_LOW_TILE := 4
const Expansion := preload("res://game/expansion_data.gd")

## Interruttore globale: false forza i soli JSON (usato dai test di parità).
static var enabled := true
static var _cache: Dictionary = {}

static func scene_path(idx: int) -> String:
	return str(Expansion.data().get("scene_rooms", {}).get(str(idx), ""))

static func has_scene(idx: int) -> bool:
	var path := scene_path(idx)
	return enabled and path != "" and ResourceLoader.exists(path)

## Applica alla stanza costruita dai JSON i dati letti dalla scena. Restituisce r modificato.
static func apply(idx: int, r: Dictionary) -> Dictionary:
	if not has_scene(idx):
		return r
	var data := read_scene(idx)
	if data.is_empty():
		return r
	r.blocks = data.blocks
	r.ledges = data.ledges
	var alias := {}
	_apply_positions(r.get("enemies", []), data.enemies, alias)
	_apply_positions(r.get("npcs", []), data.npcs, {})
	if data.secrets.size() == r.get("secrets", []).size():
		for i in data.secrets.size():
			alias["%d:%d" % [roundi(data.secrets[i].x), roundi(data.secrets[i].y)]] = r.secrets[i]
		r.secrets = data.secrets
	# Posizione nuova -> posizione JSON: gli id di nemici e segreti nei salvataggi non cambiano.
	r["pos_alias"] = alias
	r["landmark_pos"] = data.landmarks
	r["scene"] = scene_path(idx)
	return r

static func _apply_positions(items: Array, positions: Array, alias: Dictionary) -> void:
	if items.size() != positions.size():
		push_warning("LevelScenes: numero di marcatori diverso dal JSON, posizioni JSON mantenute")
		return
	for i in items.size():
		alias["%d:%d" % [roundi(positions[i].x), roundi(positions[i].y)]] = items[i].pos
		items[i].pos = positions[i]

## Legge una scena e la riduce agli stessi tipi usati da Room (Rect2, Vector2). Risultato in cache.
static func read_scene(idx: int) -> Dictionary:
	var path := scene_path(idx)
	if _cache.has(path):
		return _cache[path].duplicate(true)
	var packed: PackedScene = load(path)
	if packed == null:
		return {}
	var root: Node = packed.instantiate()
	var out := read_root(root)
	root.free()
	_cache[path] = out
	return out.duplicate(true)

static func read_root(root: Node) -> Dictionary:
	var oy := float(root.get_meta("grid_offset_y", 0.0))
	var floor_y := float(root.get_meta("floor", 980.0))
	var floor_row := roundi((floor_y - oy) / TILE)
	var out := {"blocks": [], "ledges": [], "enemies": [], "npcs": [], "secrets": [], "landmarks": {}}
	var terrain: TileMapLayer = root.get_node_or_null("Terrain")
	if terrain:
		for rect in merge_cells(terrain.get_used_cells(), floor_row):
			out.blocks.append(Rect2(rect.position.x * TILE, rect.position.y * TILE + oy, rect.size.x * TILE, rect.size.y * TILE))
	var oneway: TileMapLayer = root.get_node_or_null("OneWay")
	if oneway:
		var high: Array = []
		var low: Array = []
		for c in oneway.get_used_cells():
			(low if oneway.get_cell_atlas_coords(c).x == LEDGE_LOW_TILE else high).append(c)
		for pair in [[high, 0.0], [low, TILE / 2.0]]:
			for rect in merge_cells(pair[0], 1 << 20, false):
				out.ledges.append(Rect2(rect.position.x * TILE, rect.position.y * TILE + oy + pair[1], rect.size.x * TILE, LEDGE_H))
	for group in ["Enemies", "Npcs", "Secrets"]:
		var holder := root.get_node_or_null("Markers/" + group)
		if holder:
			var list: Array = []
			for m in holder.get_children():
				list.append({"order": int(m.get_meta("order", 0)), "pos": (m as Node2D).position})
			list.sort_custom(func(a, b): return a.order < b.order)
			for item in list:
				out[group.to_lower()].append(item.pos)
	var lm := root.get_node_or_null("Markers/Landmarks")
	if lm:
		for m in lm.get_children():
			out.landmarks[int(m.get_meta("index", 0))] = (m as Node2D).position
	return out

## Unisce le celle in rettangoli: prima corse orizzontali per riga, poi corse uguali su righe consecutive.
## Le celle dalla riga max_row in giù (pavimento) sono ignorate.
static func merge_cells(cells: Array, max_row: int, vertical := true) -> Array:
	var rows := {}
	for c in cells:
		if c.y >= max_row:
			continue
		if not rows.has(c.y):
			rows[c.y] = []
		rows[c.y].append(c.x)
	var runs: Array = []
	var keys := rows.keys()
	keys.sort()
	for y in keys:
		var xs: Array = rows[y]
		xs.sort()
		var start: int = xs[0]
		var prev: int = xs[0]
		for i in range(1, xs.size() + 1):
			if i < xs.size() and xs[i] == prev + 1:
				prev = xs[i]
				continue
			runs.append(Rect2i(start, y, prev - start + 1, 1))
			if i < xs.size():
				start = xs[i]
				prev = xs[i]
	if not vertical:
		return runs
	var merged: Array = []
	for run in runs:
		var joined := false
		for i in merged.size():
			var m: Rect2i = merged[i]
			if m.position.x == run.position.x and m.size.x == run.size.x and m.end.y == run.position.y:
				merged[i] = Rect2i(m.position, Vector2i(m.size.x, m.size.y + 1))
				joined = true
				break
		if not joined:
			merged.append(run)
	return merged
