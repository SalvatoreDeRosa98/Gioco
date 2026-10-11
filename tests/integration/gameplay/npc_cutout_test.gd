extends SceneTree
## Ogni NPC visibile ha un rig completo; i ritagli ricostruiscono tutta la tela.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	var script = load("res://game/npc_cutout_rig.gd")
	var configs: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_cutouts.json"))
	var looks: Dictionary = Story.data().characters.duplicate(true)
	var elites: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/expansion.json")).elites
	for cfg in elites.values():
		looks[cfg.rig] = {"image": cfg.image}
	var puppets: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_puppets.json"))
	var checked := 0
	for key in looks:
		var look: Dictionary = looks[key]
		if not look.has("image") or (puppets.has(key) and not configs.has(key)):
			continue
		check(configs.has(key), "Configurazione del personaggio " + key)
		if not configs.has(key):
			continue
		var tex: Texture2D = load(look.image)
		var rig = script.new()
		rig.setup(tex, configs[key], Vector2(tex.get_width() / 2.0, tex.get_height()), 1.0)
		root.add_child(rig)
		check(rig._puppet != null,key + ": usa i nuovi pezzi ridipinti completi")
		if rig._puppet:
			var sprite: Sprite2D = rig.pieces.head
			check(sprite.region_enabled and sprite.region_rect.size.y > 0,key + ": testa dipinta separata")
			var scale_before := sprite.scale
			rig.pose(1.3,-1,Color.WHITE,0,true,false)
			rig.pose(1.9,-1,Color.WHITE,0,true,false)
			check(rig.scale.x == -1 and rig.bones.head.rotation != 0,key + ": sguardo e dialogo articolati")
			check(sprite.scale == scale_before,key + ": parti rigide senza stiramento")
			check(rig.bones.has("knee") and rig.bones.has("elbow_f"),key + ": ginocchia e braccio posteriore")
			rig.free()
			checked += 1
			continue
		var area := 0.0
		for name in rig.pieces:
			if str(name).begins_with("joint_"):
				continue
			var mesh: Polygon2D = rig.pieces[name]
			check(mesh.polygons.size() > 0, key + ": parte senza triangoli")
			for tri: PackedInt32Array in mesh.polygons:
				var a := mesh.uv[tri[0]]
				var b := mesh.uv[tri[1]]
				var c := mesh.uv[tri[2]]
				area += absf((b - a).cross(c - a)) / 2.0
		var canvas_area := float(tex.get_width() * tex.get_height())
		check(absf(area - canvas_area) / canvas_area < 0.0001, key + ": ritagli con vuoti o sovrapposizioni")
		var vertices: PackedVector2Array = rig.pieces.head.polygon.duplicate()
		rig.pose(1.3, -1, Color.WHITE, 0, true, false)
		check(rig.scale.x == -1 and rig.bones.head.rotation != 0, key + ": sguardo e dialogo articolati")
		check(rig.pieces.head.polygon == vertices, key + ": il dipinto non viene deformato")
		rig.free()
		checked += 1
	print("npc_cutout_test: %d personaggi, %d fallimenti" % [checked, failures])
	quit(1 if failures else 0)
