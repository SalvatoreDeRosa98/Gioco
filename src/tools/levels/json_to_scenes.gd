extends SceneTree
## Strumento: converte le stanze JSON in scene di blockout grigio (TileMapLayer, griglia 64 px).
## Uso (dalla cartella src):
##   Godot_v4.6-stable_win64_console.exe --headless --path . --script res://tools/levels/json_to_scenes.gd -- [--rooms=5,9,13,15] [--force]
## Senza --force le scene già esistenti NON vengono sovrascritte (proteggono il lavoro fatto nell'editor).
## La prima esecuzione crea anche rooms/blockout/blockout_tiles.png: dopo serve "--import" e una seconda esecuzione.

const LevelScenes := preload("res://game/level_scenes.gd")
const TILE := 64
const TILES_PNG := "res://rooms/blockout/blockout_tiles.png"
const TILESET := "res://rooms/blockout/blockout_tileset.tres"
const NAMES := {5: "r05_fucina", 9: "r09_cisterne_reali", 13: "r13_cisterne_sepolte", 15: "r15_tana_ratking"}
## Indici dei tile nell'atlante: 0 terreno, 1 mensola (piano in alto), 2 pericolo, 3 riferimento (muro incrinato),
## 4 mensola bassa (piano a metà cella, +32 px): le mensole hanno così una risoluzione verticale di 32 px.
const T_SOLID := 0
const T_LEDGE := 1
const T_HAZARD := 2
const T_REF := 3
const T_LEDGE_LOW := 4
const TILE_COUNT := 5

func _initialize() -> void:
	var rooms: Array = [5, 9, 13, 15]
	var force := false
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--rooms="):
			rooms = Array(a.trim_prefix("--rooms=").split(",")).map(func(s): return int(s))
		elif a == "--force":
			force = true
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://rooms/blockout"))
	if not FileAccess.file_exists(TILES_PNG):
		_make_tiles_png()
		print("json_to_scenes: creato %s. Esegui --import e rilancia lo strumento." % TILES_PNG)
		quit(2)
		return
	var tileset := _tileset()
	LevelScenes.enabled = false
	var made := 0
	for idx in rooms:
		var path := "res://rooms/%s.tscn" % NAMES.get(idx, "r%02d" % idx)
		if FileAccess.file_exists(path) and not force:
			print("json_to_scenes: %s esiste già, saltata (usa --force)" % path)
			continue
		var root := build_scene(idx, tileset)
		var packed := PackedScene.new()
		packed.pack(root)
		var err := ResourceSaver.save(packed, path)
		root.free()
		print("json_to_scenes: stanza %d -> %s (%s)" % [idx, path, error_string(err)])
		made += int(err == OK)
	LevelScenes.enabled = true
	quit(0 if made > 0 or not force else 1)

func _make_tiles_png() -> void:
	var img := Image.create(TILE * TILE_COUNT, TILE, false, Image.FORMAT_RGBA8)
	var fills := [Color(0.42, 0.43, 0.46), Color(0.78, 0.79, 0.82), Color(0.78, 0.22, 0.2), Color(0.93, 0.6, 0.2), Color(0.72, 0.76, 0.84)]
	for i in TILE_COUNT:
		img.fill_rect(Rect2i(i * TILE, 0, TILE, TILE), fills[i])
		var edge: Color = fills[i].darkened(0.35)
		img.fill_rect(Rect2i(i * TILE, 0, TILE, 2), fills[i].lightened(0.3))
		img.fill_rect(Rect2i(i * TILE, TILE - 2, TILE, 2), edge)
		img.fill_rect(Rect2i(i * TILE, 0, 2, TILE), edge)
		img.fill_rect(Rect2i(i * TILE + TILE - 2, 0, 2, TILE), edge)
	# La mensola: solo la fascia alta piena (spessore di gioco 18 px), il resto trasparente.
	img.fill_rect(Rect2i(T_LEDGE * TILE, 20, TILE, TILE - 20), Color(0, 0, 0, 0))
	img.fill_rect(Rect2i(T_LEDGE_LOW * TILE, 0, TILE, 32), Color(0, 0, 0, 0))
	img.fill_rect(Rect2i(T_LEDGE_LOW * TILE, 52, TILE, 12), Color(0, 0, 0, 0))
	img.save_png(ProjectSettings.globalize_path(TILES_PNG))

func _tileset() -> TileSet:
	if ResourceLoader.exists(TILESET):
		return load(TILESET)
	var ts := TileSet.new()
	ts.tile_size = Vector2i(TILE, TILE)
	var src := TileSetAtlasSource.new()
	src.texture = load(TILES_PNG)
	src.texture_region_size = Vector2i(TILE, TILE)
	for i in TILE_COUNT:
		src.create_tile(Vector2i(i, 0))
	ts.add_source(src, 0)
	ResourceSaver.save(ts, TILESET)
	return load(TILESET)

static func grid_offset(floor_y: float) -> float:
	return fposmod(floor_y, TILE)

static func snap_row(y: float, oy: float) -> int:
	return roundi((y - oy) / TILE)

## Rettangolo JSON -> celle della griglia (colonne [c0, c1), riga superiore).
## half: riga a mezza cella (32 px) per le mensole; low = piano nella metà bassa della cella.
static func ledge_cells(r: Rect2, oy: float) -> Dictionary:
	# In orizzontale la cella si allarga per coprire tutto il rettangolo: i vuoti tra mensole non crescono mai.
	var c0 := floori(r.position.x / TILE)
	var c1 := maxi(c0 + 1, ceili(r.end.x / TILE - 0.001))
	var half := roundi((r.position.y - oy) / (TILE / 2.0))
	return {"c0": c0, "c1": c1, "row": snap_row(r.position.y, oy), "lrow": floori(half / 2.0), "low": half % 2 != 0, "top": half * TILE / 2.0 + oy}

static func surfaces(r: Dictionary, oy: float) -> Array:
	var floor_y := float(r.floor)
	var floor_row := snap_row(floor_y, oy)
	var list: Array = [{"x0": 0.0, "x1": float(r.size.x), "old": floor_y, "new": floor_y}]
	for rect in r.ledges:
		var c := ledge_cells(rect, oy)
		list.append({"x0": rect.position.x, "x1": rect.end.x, "old": rect.position.y, "new": c.top})
	for rect in r.blocks:
		var c := ledge_cells(rect, oy)
		list.append({"x0": rect.position.x, "x1": rect.end.x, "old": rect.position.y, "new": mini(c.row, floor_row - 1) * TILE + oy})
	return list

## Sposta un punto in verticale insieme alla superficie su cui poggia (entro 150 px sopra di essa).
static func shift_point(p: Vector2, surf: Array) -> Vector2:
	var best := INF
	var delta := 0.0
	for s in surf:
		if p.x < s.x0 - 5 or p.x > s.x1 + 5:
			continue
		var gap: float = s.old - p.y
		if gap >= -10 and gap <= 150 and gap < best:
			best = gap
			delta = s.new - s.old
	return p + Vector2(0, delta)

func build_scene(idx: int, tileset: TileSet) -> Node2D:
	var r := Room.build(idx)
	var floor_y := float(r.floor)
	var oy := grid_offset(floor_y)
	var floor_row := snap_row(floor_y, oy)
	var cols := ceili(float(r.size.x) / TILE)
	var root := Node2D.new()
	root.name = NAMES.get(idx, "r%02d" % idx).capitalize().replace(" ", "")
	root.set_meta("room_id", idx)
	root.set_meta("room_name", r.name)
	root.set_meta("floor", floor_y)
	root.set_meta("size", r.size)
	root.set_meta("grid_offset_y", oy)
	root.set_meta("generated_by", "tools/levels/json_to_scenes.gd")
	var bounds := ReferenceRect.new()
	bounds.name = "Bounds"
	bounds.size = r.size
	bounds.editor_only = false
	bounds.border_color = Color(0.3, 0.8, 1.0)
	bounds.border_width = 4
	root.add_child(bounds)
	var terrain := _layer("Terrain", tileset, oy)
	var oneway := _layer("OneWay", tileset, oy)
	var hazards := _layer("Hazards", tileset, oy)
	var reference := _layer("Reference", tileset, oy)
	for l in [terrain, oneway, hazards, reference]:
		root.add_child(l)
	for c in cols:
		terrain.set_cell(Vector2i(c, floor_row), 0, Vector2i(T_SOLID, 0))
		terrain.set_cell(Vector2i(c, floor_row + 1), 0, Vector2i(T_SOLID, 0))
	for rect in r.blocks:
		var c := ledge_cells(rect, oy)
		for row in range(mini(c.row, floor_row - 1), floor_row):
			for col in range(c.c0, c.c1):
				terrain.set_cell(Vector2i(col, row), 0, Vector2i(T_SOLID, 0))
	for rect in r.ledges:
		var c := ledge_cells(rect, oy)
		for col in range(c.c0, c.c1):
			oneway.set_cell(Vector2i(col, c.lrow), 0, Vector2i(T_LEDGE_LOW if c.low else T_LEDGE, 0))
	var data: Dictionary = Room.Expansion.data()
	for s in data.get("spikes", {}).get(str(idx), []):
		var c := ledge_cells(Rect2(s[0], s[1], s[2], s[3]), oy)
		for col in range(c.c0, c.c1):
			hazards.set_cell(Vector2i(col, mini(c.row, floor_row - 1)), 0, Vector2i(T_HAZARD, 0))
	for crack in data.get("cracks", {}).get(str(idx), []):
		var cr: Array = crack.rect
		var c0 := floori(cr[0] / TILE)
		var c1 := maxi(c0 + 1, ceili((cr[0] + cr[2]) / TILE))
		for row in range(floori((cr[1] - oy) / TILE), ceili((cr[1] + cr[3] - oy) / TILE)):
			for col in range(c0, c1):
				reference.set_cell(Vector2i(col, row), 0, Vector2i(T_REF, 0))
	var surf := surfaces(r, oy)
	var markers := Node2D.new()
	markers.name = "Markers"
	root.add_child(markers)
	var groups := {"Enemies": Color(1, 0.45, 0.4), "Npcs": Color(0.5, 1, 0.6), "Secrets": Color(1, 0.9, 0.3), "Landmarks": Color(0.6, 0.8, 1), "Reference": Color(0.8, 0.8, 0.8)}
	for g in groups:
		var n := Node2D.new()
		n.name = g
		markers.add_child(n)
	var i := 0
	for e in r.enemies:
		_marker(markers.get_node("Enemies"), "E%d_%s" % [i, e.type], shift_point(e.pos, surf), e.type, groups.Enemies, {"order": i, "type": e.type})
		i += 1
	i = 0
	for n in r.npcs:
		_marker(markers.get_node("Npcs"), "N%d_%s" % [i, n.id], shift_point(n.pos, surf), n.id, groups.Npcs, {"order": i, "id": n.id})
		i += 1
	i = 0
	for s in r.secrets:
		_marker(markers.get_node("Secrets"), "S%d" % i, shift_point(s, surf), "segreto", groups.Secrets, {"order": i})
		i += 1
	i = 0
	for m in data.get("landmarks", {}).get(str(idx), []):
		var p := Vector2(m.pos[0], m.pos[1])
		var label := "%s: %s" % [m.get("kind", ""), m.get("id", m.get("label", ""))]
		_marker(markers.get_node("Landmarks"), "L%d_%s" % [i, str(m.get("id", "route")).validate_node_name()], shift_point(p, surf), label, groups.Landmarks, {"index": i, "id": str(m.get("id", ""))})
		i += 1
	var ref := markers.get_node("Reference")
	for ring in data.get("rings", {}).get(str(idx), []):
		_marker(ref, "Ring", Vector2(ring[0], ring[1]), "o anello", Color(0.4, 0.8, 1), {})
	for v in data.get("vertical", {}).get(str(idx), []):
		var y := 40.0 if v.side == "top" else floor_y - 40.0
		_marker(ref, "Exit", Vector2(v.x, y), "%s -> %d %s" % ["su" if v.side == "top" else "giu", int(v.target), v.get("need", "")], Color(0.7, 0.7, 1), {})
	for save in data.get("saves", {}).get(str(idx), []):
		_marker(ref, "Save", Vector2(save.pos[0], save.pos[1]), "incudine", Color(1, 1, 1), {})
	_own(root, root)
	return root

func _layer(layer_name: String, tileset: TileSet, oy: float) -> TileMapLayer:
	var l := TileMapLayer.new()
	l.name = layer_name
	l.tile_set = tileset
	l.position = Vector2(0, oy)
	if layer_name == "Reference":
		l.modulate = Color(1, 1, 1, 0.6)
	return l

func _marker(parent: Node, marker_name: String, pos: Vector2, text: String, color: Color, meta: Dictionary) -> void:
	var m := Marker2D.new()
	m.name = marker_name
	m.position = pos
	m.gizmo_extents = 24
	for k in meta:
		m.set_meta(k, meta[k])
	var dot := ColorRect.new()
	dot.name = "Dot"
	dot.color = color
	dot.size = Vector2(16, 16)
	dot.position = Vector2(-8, -8)
	m.add_child(dot)
	var label := Label.new()
	label.name = "Label"
	label.text = text
	label.position = Vector2(-60, -44)
	label.add_theme_color_override("font_color", color)
	label.add_theme_font_size_override("font_size", 22)
	m.add_child(label)
	parent.add_child(m)

func _own(node: Node, owner_node: Node) -> void:
	for c in node.get_children():
		c.owner = owner_node
		_own(c, owner_node)
