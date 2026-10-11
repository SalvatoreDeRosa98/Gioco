extends SceneTree
## Strumento: converte le stanze JSON in scene di blockout (TileMapLayer con collisioni, griglia 64 px).
## Uso (dalla cartella src):
##   Godot_v4.6-stable_win64_console.exe --headless --path . --script res://tools/levels/json_to_scenes.gd -- [--rooms=5] [--force]
## Senza --force le scene esistenti NON vengono sovrascritte (proteggono il lavoro fatto nell'editor).
## Le stanze 9, 13 e 15 sono ridisegnate a mano: vedi slice_design.gd (non riconvertirle dai JSON).
## La prima esecuzione crea rooms/blockout/blockout_tiles.png: dopo serve "--import" e una seconda esecuzione.

const LevelScenes := preload("res://game/level_scenes.gd")
const Builder := preload("res://tools/levels/scene_builder.gd")
const NAMES := {5: "r05_fucina", 9: "r09_cisterne_reali", 13: "r13_cisterne_sepolte", 15: "r15_tana_ratking"}

func _initialize() -> void:
	var rooms: Array = [5]
	var force := false
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--rooms="):
			rooms = Array(a.trim_prefix("--rooms=").split(",")).map(func(s): return int(s))
		elif a == "--force":
			force = true
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://rooms/blockout"))
	if not FileAccess.file_exists(Builder.TILES_PNG):
		Builder.make_tiles_png()
		print("json_to_scenes: creato %s. Esegui --import e rilancia lo strumento." % Builder.TILES_PNG)
		quit(2)
		return
	var ts := Builder.tileset()
	LevelScenes.enabled = false
	for idx in rooms:
		var path := "res://rooms/%s.tscn" % NAMES.get(idx, "r%02d" % idx)
		if FileAccess.file_exists(path) and not force:
			print("json_to_scenes: %s esiste già, saltata (usa --force)" % path)
			continue
		var err := Builder.save(Builder.build(spec_from_json(idx), ts), path)
		print("json_to_scenes: stanza %d -> %s (%s)" % [idx, path, error_string(err)])
	LevelScenes.enabled = true
	quit(0)

## Superfici originali e loro nuova quota dopo l'aggancio alla griglia.
static func _surfaces(r: Dictionary, oy: float) -> Array:
	var fy := float(r.floor)
	var floor_row := roundi((fy - oy) / Builder.TILE)
	var list: Array = [{"x0": 0.0, "x1": float(r.size.x), "old": fy, "new": fy}]
	for rect in r.ledges:
		list.append({"x0": rect.position.x, "x1": rect.end.x, "old": rect.position.y, "new": Builder.ledge_row(rect.position.y, oy).top})
	for rect in r.blocks:
		list.append({"x0": rect.position.x, "x1": rect.end.x, "old": rect.position.y, "new": mini(roundi((rect.position.y - oy) / Builder.TILE), floor_row - 1) * Builder.TILE + oy})
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

static func spec_from_json(idx: int) -> Dictionary:
	var r := Room.build(idx)
	var data: Dictionary = Room.Expansion.data()
	var key := str(idx)
	var oy := Builder.grid_offset(float(r.floor))
	var surf := _surfaces(r, oy)
	var spec := {"idx": idx, "name": r.name, "size": r.size, "floor": float(r.floor), "scene_name": NAMES.get(idx, "r%02d" % idx).capitalize().replace(" ", ""),
		"generated_by": "tools/levels/json_to_scenes.gd", "blocks": r.blocks, "ledges": r.ledges, "floor_holes": [],
		"spikes": [], "cracks": [], "rings": [], "exits": [], "saves": [], "enemies": [], "npcs": [], "secrets": [], "landmarks": []}
	for s in data.get("spikes", {}).get(key, []):
		spec.spikes.append(Rect2(s[0], s[1], s[2], s[3]))
	for c in data.get("cracks", {}).get(key, []):
		spec.cracks.append({"id": c.id, "rect": Rect2(c.rect[0], c.rect[1], c.rect[2], c.rect[3]), "reward": c.get("reward", 0), "gate": c.get("gate", false)})
	for p in data.get("rings", {}).get(key, []):
		spec.rings.append(Vector2(p[0], p[1]))
	for x in data.get("vertical", {}).get(key, []):
		spec.exits.append({"side": x.side, "x": float(x.x), "width": float(x.width), "target": int(x.target), "spawn": Vector2(x.spawn[0], x.spawn[1]), "need": str(x.get("need", ""))})
		if x.side == "bottom":
			spec.floor_holes.append(Vector2(x.x - x.width / 2.0, x.x + x.width / 2.0))
	for s in data.get("saves", {}).get(key, []):
		spec.saves.append({"pos": Vector2(s.pos[0], s.pos[1]), "need_clear": s.get("need_clear", false)})
	for e in r.enemies:
		spec.enemies.append({"type": e.type, "pos": shift_point(e.pos, surf), "save_pos": e.pos})
	for n in r.npcs:
		spec.npcs.append({"id": n.id, "pos": shift_point(n.pos, surf), "save_pos": n.pos})
	for s in r.secrets:
		spec.secrets.append({"pos": shift_point(s, surf), "save_pos": s})
	var i := 0
	for m in data.get("landmarks", {}).get(key, []):
		spec.landmarks.append({"index": i, "id": str(m.get("id", "route")), "label": "%s: %s" % [m.get("kind", ""), m.get("id", m.get("label", ""))], "pos": shift_point(Vector2(m.pos[0], m.pos[1]), surf)})
		i += 1
	return spec
