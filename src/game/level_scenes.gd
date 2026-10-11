extends RefCounted
## Adattatore stanze: se una stanza ha una scena costruita nell'editor (TileMapLayer a griglia di 64 px),
## geometria, nemici, punti d'interesse, punte, muri incrinati, anelli, uscite verticali e incudini
## vengono letti da lì; altrimenti restano quelli dei JSON. Le scene sono elencate in
## data/expansion.json -> "scene_rooms". Gli ID delle stanze non cambiano.
##
## Struttura della scena (vedi res://tools/levels/scene_builder.gd):
##   Root (Node2D, meta: room_id, floor, size, grid_offset_y)
##   ├── Terrain  (TileMapLayer, collisione layer 1)  pavimento e blocchi solidi
##   ├── OneWay   (TileMapLayer, collisione layer 4, one-way)  tile 1 = piano in alto, tile 4 = a metà cella
##   ├── Hazards  (TileMapLayer)  punte: il danno resta in traversal.gd
##   ├── Cracks   (ReferenceRect con meta id, reward, gate)  muri incrinati
##   └── Markers/Enemies|Npcs|Secrets|Landmarks|Rings|Exits|Saves|Props (Marker2D con metadati)
## Meta facoltativi della radice: art_tiles (tile dipinti visibili in gioco), mid_art (fondale del piano medio).
## In gioco la fisica di pavimento, blocchi e mensole viene dai tile (physics_layers); bordi, porte
## e tappi delle uscite chiuse restano generati dal codice (Room.solids).

const TILE := 64
const LEDGE_H := 18.0
const LEDGE_LOW_TILE := 4
const SPIKE_H := 20.0
const Expansion := preload("res://game/expansion_data.gd")

## Interruttore globale: false forza i soli JSON (usato dai test di parità).
static var enabled := true
static var _cache: Dictionary = {}
static var _packed: Dictionary = {}

static func scene_path(idx: int) -> String:
	return str(Expansion.data().get("scene_rooms", {}).get(str(idx), ""))

static func has_scene(idx: int) -> bool:
	var path := scene_path(idx)
	return enabled and path != "" and ResourceLoader.exists(path)

static func _scene(idx: int) -> PackedScene:
	var path := scene_path(idx)
	if not _packed.has(path):
		_packed[path] = load(path)
	return _packed[path]

## Applica alla stanza costruita dai JSON i dati letti dalla scena. Restituisce r modificato.
static func apply(idx: int, r: Dictionary) -> Dictionary:
	if not has_scene(idx):
		return r
	var data := read_scene(idx)
	if data.is_empty():
		return r
	for key in ["blocks", "ledges", "enemies", "npcs", "secrets", "spikes", "cracks", "rings", "saves"]:
		r[key] = data[key]
	r["scene_vertical"] = data.vertical
	r["landmark_pos"] = data.landmarks
	r["pos_alias"] = data.alias
	r["scene"] = scene_path(idx)
	r["props"] = data.props
	# Ciò che un oggetto dipinto sostituisce non va più disegnato dal codice (terrain.gd, expedition.gd).
	r["hide_doors"] = []
	r["hidden_marks"] = []
	for p in data.props:
		if p.kind == "gate":
			r.hide_doors.append(str(p.get("side", "right")))
		for id in p.get("replaces", []):
			r.hidden_marks.append(str(id))
	if data.art_tiles:
		r["tile_art"] = true
	if data.mid_art != "":
		r["mid_art"] = data.mid_art
		r["mid_opts"] = data.mid_opts
	return r

## Incudini della stanza: dalla scena se esiste, altrimenti da expansion.json -> "saves".
static func saves_for(idx: int) -> Array:
	if has_scene(idx):
		return read_scene(idx).saves
	var out: Array = []
	for s in Expansion.data().get("saves", {}).get(str(idx), []):
		out.append({"pos": Vector2(s.pos[0], s.pos[1]), "need_clear": bool(s.get("need_clear", false))})
	return out

## Nuove istanze degli strati con collisione (Terrain, OneWay) da aggiungere al mondo di gioco.
static func physics_layers(idx: int) -> Array:
	if not has_scene(idx):
		return []
	var root: Node = _scene(idx).instantiate()
	var out: Array = []
	for layer_name in ["Terrain", "OneWay"]:
		var l: TileMapLayer = root.get_node_or_null(layer_name)
		if l:
			root.remove_child(l)
			l.owner = null
			out.append(l)
	root.free()
	return out

## Legge una scena e la riduce agli stessi tipi usati da Room (Rect2, Vector2). Risultato in cache.
static func read_scene(idx: int) -> Dictionary:
	var path := scene_path(idx)
	if _cache.has(path):
		return _cache[path].duplicate(true)
	var packed := _scene(idx)
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
	var out := {"blocks": [], "ledges": [], "enemies": [], "npcs": [], "secrets": [], "landmarks": {}, "spikes": [],
		"cracks": [], "rings": [], "vertical": [], "saves": [], "alias": {}, "floor_cells": [], "props": [],
		"art_tiles": bool(root.get_meta("art_tiles", false)), "mid_art": str(root.get_meta("mid_art", "")),
		"mid_opts": root.get_meta("mid_opts", {})}
	var terrain: TileMapLayer = root.get_node_or_null("Terrain")
	if terrain:
		for rect in merge_cells(terrain.get_used_cells(), floor_row):
			out.blocks.append(Rect2(rect.position.x * TILE, rect.position.y * TILE + oy, rect.size.x * TILE, rect.size.y * TILE))
		for c in terrain.get_used_cells():
			if c.y == floor_row:
				out.floor_cells.append(c.x)
	var oneway: TileMapLayer = root.get_node_or_null("OneWay")
	if oneway:
		var high: Array = []
		var low: Array = []
		for c in oneway.get_used_cells():
			(low if oneway.get_cell_atlas_coords(c).x == LEDGE_LOW_TILE else high).append(c)
		for pair in [[high, 0.0], [low, TILE / 2.0]]:
			for rect in merge_cells(pair[0], 1 << 20, false):
				out.ledges.append(Rect2(rect.position.x * TILE, rect.position.y * TILE + oy + pair[1], rect.size.x * TILE, LEDGE_H))
	var hazards: TileMapLayer = root.get_node_or_null("Hazards")
	if hazards:
		for rect in merge_cells(hazards.get_used_cells(), 1 << 20, false):
			out.spikes.append([rect.position.x * TILE, (rect.position.y + 1) * TILE + oy - SPIKE_H, rect.size.x * TILE, SPIKE_H])
	var cracks := root.get_node_or_null("Cracks")
	if cracks:
		for c in cracks.get_children():
			var rr := c as Control
			out.cracks.append({"id": str(c.get_meta("id", c.name)), "rect": [rr.position.x, rr.position.y, rr.size.x, rr.size.y],
				"reward": int(c.get_meta("reward", 0)), "gate": bool(c.get_meta("gate", false)), "hits": int(c.get_meta("hits", 1))})
	for m in _sorted(root, "Markers/Enemies"):
		var e := {"type": str(m.get_meta("type")), "pos": m.position}
		if m.get_meta("placeholder", false):
			e.placeholder = true
			e.swap_to = str(m.get_meta("swap_to", ""))
		if m.has_meta("wave"):
			e.wave = int(m.get_meta("wave"))
		out.enemies.append(e)
		_alias(out.alias, m)
	for m in _sorted(root, "Markers/Npcs"):
		out.npcs.append({"id": str(m.get_meta("id")), "pos": m.position})
	for m in _sorted(root, "Markers/Secrets"):
		out.secrets.append(m.position)
		_alias(out.alias, m)
	for m in _sorted(root, "Markers/Rings"):
		out.rings.append([m.position.x, m.position.y])
	for m in _sorted(root, "Markers/Exits"):
		var x := {"side": str(m.get_meta("side")), "x": m.position.x, "width": float(m.get_meta("width", 220.0)),
			"target": int(m.get_meta("target")), "spawn": [m.get_meta("spawn").x, m.get_meta("spawn").y]}
		if m.has_meta("need"):
			x.need = str(m.get_meta("need"))
		out.vertical.append(x)
	for m in _sorted(root, "Markers/Props"):
		var p := {"kind": str(m.get_meta("kind")), "pos": m.position}
		for k in ["side", "height", "hint", "replaces"]:
			if m.has_meta(k):
				p[k] = m.get_meta(k)
		out.props.append(p)
	for m in _sorted(root, "Markers/Saves"):
		out.saves.append({"pos": m.position, "need_clear": bool(m.get_meta("need_clear", false))})
	var lm := root.get_node_or_null("Markers/Landmarks")
	if lm:
		for m in lm.get_children():
			out.landmarks[int(m.get_meta("index", 0))] = (m as Node2D).position
	return out

## Id di salvataggio stabili: se il marcatore ricorda la posizione JSON originale, la si usa.
static func _alias(alias: Dictionary, m: Node2D) -> void:
	if m.has_meta("save_pos"):
		alias["%d:%d" % [roundi(m.position.x), roundi(m.position.y)]] = m.get_meta("save_pos")

static func _sorted(root: Node, path: String) -> Array:
	var holder := root.get_node_or_null(path)
	if holder == null:
		return []
	var list: Array = holder.get_children()
	list.sort_custom(func(a, b): return int(a.get_meta("order", 0)) < int(b.get_meta("order", 0)))
	return list

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
