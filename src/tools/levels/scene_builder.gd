extends RefCounted
## Costruisce una scena di stanza (blockout grigio, griglia 64 px) da una descrizione in pixel.
## Usato da json_to_scenes.gd (stanze convertite dai JSON) e da slice_design.gd (stanze ridisegnate).
## Solo strumento di editor: il gioco legge le scene tramite game/level_scenes.gd.
##
## Descrizione (spec):
##   idx, name, size (Vector2), floor
##   blocks:  [Rect2]  terreno solido (celle piene, con collisione)
##   ledges:  [Rect2]  mensole attraversabili dal basso (y a mezza cella: 32 px)
##   floor_holes: [Vector2(x0, x1)]  tratti di pavimento senza celle (uscite verso il basso)
##   spikes:  [Rect2]  punte (cella di pericolo, danno gestito da traversal.gd)
##   cracks:  [{id, rect: Rect2, reward, gate}]  muri incrinati (martello)
##   rings:   [Vector2] anelli del rampino
##   exits:   [{side, x, width, target, spawn: Vector2, need}]  uscite verticali
##   saves:   [{pos: Vector2, need_clear}]  incudini
##   enemies: [{type, pos, placeholder?, swap_to?, note?, save_pos?}]
##   npcs:    [{id, pos}]   secrets: [Vector2]   landmarks: [{index, id, pos}]
##   notes:   [{pos, text}] etichette di progetto (solo editor)
##   art:     true = TileSet dipinto (tufo bagnato) visibile in gioco al posto del disegno di terrain.gd
##   mid_art: percorso del fondale del piano medio (parallasse 0.5, game/scene_backdrop.gd)
##   mid_opts: allineamento e luce del fondale (floor_v, scale, dim, light: vedi scene_backdrop.gd)
##   props:   [{kind: wheel|gate, pos, side?, height?, hint?, replaces?}]  oggetti interattivi (game/slice_props.gd);
##            replaces = id dei landmark disegnati dal codice che l'oggetto sostituisce (non vengono più disegnati)
##   cracks[].hits: colpi di martello per romperlo (2 = intatto -> danneggiato -> rotto)

const TILE := 64
const TILES_PNG := "res://rooms/blockout/blockout_tiles.png"
const TILESET := "res://rooms/blockout/blockout_tileset.tres"
## Atlante: 0 terreno, 1 mensola (piano in alto), 2 pericolo, 3 riferimento, 4 mensola bassa (+32 px).
const T_SOLID := 0
const T_LEDGE := 1
const T_HAZARD := 2
const T_REF := 3
const T_LEDGE_LOW := 4
const TILE_COUNT := 5
## Strati fisici del TileSet: 0 = terreno (layer 1), 1 = mensole (layer 4, come player.LEDGE_LAYER).
const PHYS_SOLID := 0
const PHYS_LEDGE := 1
const LEDGE_THICK := 18.0
## TileSet dipinto (prototipo Cisterne): stessi id della riga 0 e stessi strati fisici del blockout.
## Riga 0: 0 muro, 1 mensola, 2 punte, 3 riferimento, 4 mensola bassa, 5 cresta (muro con la superficie).
## Righe 1-4: blocco di muro 4x4 continuo e ripetibile (ogni cella prende il pezzo (x%4, y%4): niente giunte).
## Riga 5: cresta ripetibile 4x1. Tutti i pezzi hanno collisione piena.
const ART_PNG := "res://assets/art/slice/tufo_tiles.png"
const ART_TILESET := "res://rooms/art/tufo_tileset.tres"
const T_CREST := 5
const ART_VARIANTS := 4
const ART_WALL_ROW := 1
const ART_CREST_ROW := 5

static func make_tiles_png() -> void:
	var img := Image.create(TILE * TILE_COUNT, TILE, false, Image.FORMAT_RGBA8)
	var fills := [Color(0.42, 0.43, 0.46), Color(0.78, 0.79, 0.82), Color(0.78, 0.22, 0.2), Color(0.93, 0.6, 0.2), Color(0.72, 0.76, 0.84)]
	for i in TILE_COUNT:
		img.fill_rect(Rect2i(i * TILE, 0, TILE, TILE), fills[i])
		var edge: Color = fills[i].darkened(0.35)
		img.fill_rect(Rect2i(i * TILE, 0, TILE, 2), fills[i].lightened(0.3))
		img.fill_rect(Rect2i(i * TILE, TILE - 2, TILE, 2), edge)
		img.fill_rect(Rect2i(i * TILE, 0, 2, TILE), edge)
		img.fill_rect(Rect2i(i * TILE + TILE - 2, 0, 2, TILE), edge)
	img.fill_rect(Rect2i(T_LEDGE * TILE, 20, TILE, TILE - 20), Color(0, 0, 0, 0))
	img.fill_rect(Rect2i(T_LEDGE_LOW * TILE, 0, TILE, 32), Color(0, 0, 0, 0))
	img.fill_rect(Rect2i(T_LEDGE_LOW * TILE, 52, TILE, 12), Color(0, 0, 0, 0))
	# Punte: denti nella metà bassa della cella di pericolo.
	img.fill_rect(Rect2i(T_HAZARD * TILE, 0, TILE, 44), Color(0, 0, 0, 0))
	img.save_png(ProjectSettings.globalize_path(TILES_PNG))

## TileSet con collisioni: terreno pieno e mensole one-way (alta e a metà cella).
static func tileset() -> TileSet:
	if ResourceLoader.exists(TILESET):
		return load(TILESET)
	var ts := TileSet.new()
	ts.tile_size = Vector2i(TILE, TILE)
	ts.add_physics_layer()
	ts.set_physics_layer_collision_layer(PHYS_SOLID, 1)
	ts.set_physics_layer_collision_mask(PHYS_SOLID, 0)
	ts.add_physics_layer()
	ts.set_physics_layer_collision_layer(PHYS_LEDGE, 1 << 3)
	ts.set_physics_layer_collision_mask(PHYS_LEDGE, 0)
	var src := TileSetAtlasSource.new()
	src.texture = load(TILES_PNG)
	src.texture_region_size = Vector2i(TILE, TILE)
	ts.add_source(src, 0)
	for i in TILE_COUNT:
		src.create_tile(Vector2i(i, 0))
	var h := TILE / 2.0
	_poly(src, T_SOLID, PHYS_SOLID, Rect2(-h, -h, TILE, TILE), false)
	_poly(src, T_LEDGE, PHYS_LEDGE, Rect2(-h, -h, TILE, LEDGE_THICK), true)
	_poly(src, T_LEDGE_LOW, PHYS_LEDGE, Rect2(-h, 0, TILE, LEDGE_THICK), true)
	ResourceSaver.save(ts, TILESET)
	return load(TILESET)

## TileSet del tufo bagnato: ritagliato da 03-tufo-tileset (design/art/cisterne-grok/make_art.py).
static func art_tileset() -> TileSet:
	if ResourceLoader.exists(ART_TILESET):
		return load(ART_TILESET)
	var ts := TileSet.new()
	ts.tile_size = Vector2i(TILE, TILE)
	ts.add_physics_layer()
	ts.set_physics_layer_collision_layer(PHYS_SOLID, 1)
	ts.set_physics_layer_collision_mask(PHYS_SOLID, 0)
	ts.add_physics_layer()
	ts.set_physics_layer_collision_layer(PHYS_LEDGE, 1 << 3)
	ts.set_physics_layer_collision_mask(PHYS_LEDGE, 0)
	var src := TileSetAtlasSource.new()
	src.texture = load(ART_PNG)
	src.texture_region_size = Vector2i(TILE, TILE)
	ts.add_source(src, 0)
	for i in 6:
		src.create_tile(Vector2i(i, 0))
	for row in range(ART_WALL_ROW, ART_CREST_ROW + 1):
		for i in ART_VARIANTS:
			src.create_tile(Vector2i(i, row))
	var h := TILE / 2.0
	var full := Rect2(-h, -h, TILE, TILE)
	for t in [Vector2i(T_SOLID, 0), Vector2i(T_CREST, 0)]:
		_poly_at(src, t, PHYS_SOLID, full, false)
	for row in range(ART_WALL_ROW, ART_CREST_ROW + 1):
		for i in ART_VARIANTS:
			_poly_at(src, Vector2i(i, row), PHYS_SOLID, full, false)
	_poly(src, T_LEDGE, PHYS_LEDGE, Rect2(-h, -h, TILE, LEDGE_THICK), true)
	_poly(src, T_LEDGE_LOW, PHYS_LEDGE, Rect2(-h, 0, TILE, LEDGE_THICK), true)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(ART_TILESET.get_base_dir()))
	ResourceSaver.save(ts, ART_TILESET)
	return load(ART_TILESET)

## Pezzo dipinto di ogni cella solida: cresta se sopra è vuoto, altrimenti il pezzo del blocco 4x4 di muro.
static func paint_variants(terrain: TileMapLayer) -> void:
	var used := {}
	for c in terrain.get_used_cells():
		used[c] = true
	for c in used:
		var v := posmod(c.x, ART_VARIANTS)
		if used.has(c + Vector2i(0, -1)):
			terrain.set_cell(c, 0, Vector2i(v, ART_WALL_ROW + posmod(c.y, ART_VARIANTS)))
		else:
			terrain.set_cell(c, 0, Vector2i(v, ART_CREST_ROW))

static func _poly(src: TileSetAtlasSource, tile: int, layer: int, r: Rect2, one_way: bool) -> void:
	_poly_at(src, Vector2i(tile, 0), layer, r, one_way)

static func _poly_at(src: TileSetAtlasSource, coords: Vector2i, layer: int, r: Rect2, one_way: bool) -> void:
	var data := src.get_tile_data(coords, 0)
	data.add_collision_polygon(layer)
	data.set_collision_polygon_points(layer, 0, PackedVector2Array([r.position, Vector2(r.end.x, r.position.y), r.end, Vector2(r.position.x, r.end.y)]))
	data.set_collision_polygon_one_way(layer, 0, one_way)

static func grid_offset(floor_y: float) -> float:
	return fposmod(floor_y, TILE)

static func cols(r: Rect2) -> Vector2i:
	var c0 := floori(r.position.x / TILE)
	return Vector2i(c0, maxi(c0 + 1, ceili(r.end.x / TILE - 0.001)))

## Riga a mezza cella di una mensola: {row, low, top}.
static func ledge_row(y: float, oy: float) -> Dictionary:
	var half := roundi((y - oy) / (TILE / 2.0))
	return {"row": floori(half / 2.0), "low": half % 2 != 0, "top": half * TILE / 2.0 + oy}

static func build(spec: Dictionary, ts: TileSet) -> Node2D:
	var floor_y := float(spec.floor)
	var size: Vector2 = spec.size
	var oy := grid_offset(floor_y)
	var floor_row := roundi((floor_y - oy) / TILE)
	var root := Node2D.new()
	root.name = str(spec.get("scene_name", "Room%02d" % spec.idx))
	root.set_meta("room_id", spec.idx)
	root.set_meta("room_name", spec.name)
	root.set_meta("floor", floor_y)
	root.set_meta("size", size)
	root.set_meta("grid_offset_y", oy)
	root.set_meta("generated_by", spec.get("generated_by", "tools/levels/scene_builder.gd"))
	if spec.get("art", false):
		root.set_meta("art_tiles", true)
	if spec.has("mid_art"):
		root.set_meta("mid_art", str(spec.mid_art))
	if spec.has("mid_opts"):
		root.set_meta("mid_opts", spec.mid_opts)
	var bounds := ReferenceRect.new()
	bounds.name = "Bounds"
	bounds.size = size
	bounds.editor_only = false
	bounds.border_color = Color(0.3, 0.8, 1.0)
	bounds.border_width = 4
	root.add_child(bounds)
	var terrain := _layer("Terrain", ts, oy)
	var oneway := _layer("OneWay", ts, oy)
	var hazards := _layer("Hazards", ts, oy)
	for l in [terrain, oneway, hazards]:
		root.add_child(l)
	# Pavimento (due righe) con i buchi delle uscite verso il basso.
	for c in ceili(size.x / TILE):
		var x := c * TILE + TILE / 2.0
		var hole := false
		for hl in spec.get("floor_holes", []):
			if x > hl.x and x < hl.y:
				hole = true
		if not hole:
			terrain.set_cell(Vector2i(c, floor_row), 0, Vector2i(T_SOLID, 0))
			terrain.set_cell(Vector2i(c, floor_row + 1), 0, Vector2i(T_SOLID, 0))
	for r in spec.get("blocks", []):
		var cc := cols(r)
		var top := clampi(roundi((r.position.y - oy) / TILE), -2, floor_row - 1)
		var bottom := clampi(roundi((r.end.y - oy) / TILE), top + 1, floor_row)
		for row in range(top, bottom):
			for col in range(cc.x, cc.y):
				terrain.set_cell(Vector2i(col, row), 0, Vector2i(T_SOLID, 0))
	for r in spec.get("ledges", []):
		var cc := cols(r)
		var lr := ledge_row(r.position.y, oy)
		for col in range(cc.x, cc.y):
			oneway.set_cell(Vector2i(col, lr.row), 0, Vector2i(T_LEDGE_LOW if lr.low else T_LEDGE, 0))
	if spec.get("art", false):
		paint_variants(terrain)
	for r in spec.get("spikes", []):
		var cc := cols(r)
		var row := clampi(roundi((r.end.y - oy) / TILE) - 1, 0, floor_row - 1)
		for col in range(cc.x, cc.y):
			hazards.set_cell(Vector2i(col, row), 0, Vector2i(T_HAZARD, 0))
	var cracks := Node2D.new()
	cracks.name = "Cracks"
	root.add_child(cracks)
	for c in spec.get("cracks", []):
		var rr := ReferenceRect.new()
		rr.name = str(c.id)
		rr.position = c.rect.position
		rr.size = c.rect.size
		rr.editor_only = false
		rr.border_color = Color(0.95, 0.6, 0.2)
		rr.border_width = 3
		rr.set_meta("id", str(c.id))
		rr.set_meta("reward", int(c.get("reward", 0)))
		rr.set_meta("gate", bool(c.get("gate", false)))
		if int(c.get("hits", 1)) > 1:
			rr.set_meta("hits", int(c.hits))
		var fill := ColorRect.new()
		fill.name = "Fill"
		fill.color = Color(0.93, 0.6, 0.2, 0.45)
		fill.size = c.rect.size
		fill.mouse_filter = Control.MOUSE_FILTER_IGNORE
		rr.add_child(fill)
		cracks.add_child(rr)
		_label(rr, "muro incrinato (martello)", Color(1, 0.7, 0.3), Vector2(-40, -30))
	var markers := Node2D.new()
	markers.name = "Markers"
	root.add_child(markers)
	for g in ["Enemies", "Npcs", "Secrets", "Landmarks", "Rings", "Exits", "Saves", "Props", "Notes"]:
		var n := Node2D.new()
		n.name = g
		markers.add_child(n)
	var i := 0
	for e in spec.get("enemies", []):
		var meta := {"order": i, "type": e.type}
		var text: String = e.type
		if e.get("placeholder", false):
			meta.placeholder = true
			meta.swap_to = str(e.get("swap_to", ""))
			text = "[SEGNAPOSTO] %s -> %s" % [e.type, e.get("swap_to", "?")]
		if e.has("save_pos"):
			meta.save_pos = e.save_pos
		if e.has("note"):
			meta.note = e.note
		_marker(markers.get_node("Enemies"), "E%d_%s" % [i, e.type], e.pos, text, Color(1, 0.3, 0.9) if e.get("placeholder", false) else Color(1, 0.45, 0.4), meta)
		i += 1
	i = 0
	for n in spec.get("npcs", []):
		var meta := {"order": i, "id": n.id}
		if n.has("save_pos"):
			meta.save_pos = n.save_pos
		_marker(markers.get_node("Npcs"), "N%d_%s" % [i, n.id], n.pos, n.id, Color(0.5, 1, 0.6), meta)
		i += 1
	i = 0
	for s in spec.get("secrets", []):
		var meta := {"order": i}
		if s is Dictionary:
			if s.has("save_pos"):
				meta.save_pos = s.save_pos
			s = s.pos
		_marker(markers.get_node("Secrets"), "S%d" % i, s, "segreto", Color(1, 0.9, 0.3), meta)
		i += 1
	for m in spec.get("landmarks", []):
		_marker(markers.get_node("Landmarks"), "L%d_%s" % [m.index, str(m.id).validate_node_name()], m.pos, str(m.get("label", m.id)), Color(0.6, 0.8, 1), {"index": m.index, "id": str(m.id)})
	i = 0
	for p in spec.get("rings", []):
		_marker(markers.get_node("Rings"), "R%d" % i, p, "o anello", Color(0.4, 0.8, 1), {"order": i})
		i += 1
	i = 0
	for x in spec.get("exits", []):
		var meta := {"order": i, "side": x.side, "width": float(x.width), "target": int(x.target), "spawn": x.spawn}
		if str(x.get("need", "")) != "":
			meta.need = str(x.need)
		var y := 40.0 if x.side == "top" else floor_y - 40.0
		_marker(markers.get_node("Exits"), "X%d_%s_%d" % [i, x.side, x.target], Vector2(x.x, y), "%s -> %d %s" % ["su" if x.side == "top" else "giu", x.target, x.get("need", "")], Color(0.7, 0.7, 1), meta)
		i += 1
	i = 0
	for s in spec.get("saves", []):
		_marker(markers.get_node("Saves"), "Save%d" % i, s.pos, "incudine" + (" (a stanza liberata)" if s.get("need_clear", false) else ""), Color(1, 1, 1), {"order": i, "need_clear": bool(s.get("need_clear", false))})
		i += 1
	i = 0
	for p in spec.get("props", []):
		var meta := {"order": i, "kind": str(p.kind)}
		for k in ["side", "height", "hint", "replaces"]:
			if p.has(k):
				meta[k] = p[k]
		_marker(markers.get_node("Props"), "P%d_%s" % [i, p.kind], p.pos, "%s %s" % [p.kind, p.get("side", "")], Color(0.9, 0.75, 0.5), meta)
		i += 1
	i = 0
	for n in spec.get("notes", []):
		_marker(markers.get_node("Notes"), "Note%d" % i, n.pos, n.text, Color(0.75, 0.75, 0.75), {})
		i += 1
	_own(root, root)
	return root

static func _layer(layer_name: String, ts: TileSet, oy: float) -> TileMapLayer:
	var l := TileMapLayer.new()
	l.name = layer_name
	l.tile_set = ts
	l.position = Vector2(0, oy)
	return l

static func _label(parent: Node, text: String, color: Color, offset: Vector2) -> void:
	var label := Label.new()
	label.name = "Label"
	label.text = text
	label.position = offset
	label.add_theme_color_override("font_color", color)
	label.add_theme_font_size_override("font_size", 22)
	parent.add_child(label)

static func _marker(parent: Node, marker_name: String, pos: Vector2, text: String, color: Color, meta: Dictionary) -> void:
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
	_label(m, text, color, Vector2(-60, -44))
	parent.add_child(m)

static func _own(node: Node, owner_node: Node) -> void:
	for c in node.get_children():
		c.owner = owner_node
		_own(c, owner_node)

static func save(root: Node, path: String) -> int:
	var packed := PackedScene.new()
	packed.pack(root)
	var err := ResourceSaver.save(packed, path)
	root.free()
	return err
