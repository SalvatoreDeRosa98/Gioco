extends Node2D
## Ritagli rigidi del dipinto originale su perni gerarchici, come il rig di Ferruccio.
## I contorni e le articolazioni sono specifici di ogni figura in npc_cutouts.json.
## Le UV restano nella tela originale: non si ridipinge e non si stira la figura.
var bones: Dictionary = {}
var pieces: Dictionary = {}
var _config: Dictionary
var _rest: Dictionary = {}
var _canvas := Vector2.ZERO
var _feet := Vector2.ZERO
var _factor := 1.0
var _puppet: Node2D

## Costruisce il corpo articolato dal dipinto e dai contorni normalizzati dell'NPC.
func setup(tex: Texture2D, config: Dictionary, feet: Vector2, factor: float) -> void:
	if config.has("puppet"):
		var puppets: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_puppets.json"))
		_puppet = preload("res://game/npc_painted_puppet.gd").new()
		_puppet.setup(puppets[config.puppet], tex.get_height() * factor)
		add_child(_puppet)
		bones = _puppet.bones
		pieces = _puppet.pieces
		return
	_config = config
	_canvas = tex.get_size()
	_feet = feet
	_factor = factor
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	var painted := CanvasItemMaterial.new()
	painted.light_mode = CanvasItemMaterial.LIGHT_MODE_NORMAL
	material = painted
	var body := Node2D.new()
	body.name = "torso"
	body.position = (_point(config.body_pivot) - feet) * factor
	body.use_parent_material = true
	add_child(body)
	bones.torso = body
	_rest.torso = _point(config.body_pivot)
	var contours: Array = []
	for part in config.parts:
		var bone := Node2D.new()
		bone.name = part.name
		var parent: Node2D = bones[part.parent]
		var pivot := _point(part.pivot)
		bone.position = (pivot - _rest[part.parent]) * factor
		bone.use_parent_material = true
		parent.add_child(bone)
		bones[part.name] = bone
		_rest[part.name] = pivot
		var outline := PackedVector2Array()
		for p in part.outline:
			outline.append(_point(p))
		contours.append({"name": part.name, "outline": outline})
	var regions: Dictionary = {"torso": []}
	for part in contours:
		regions[part.name] = []
	# Piccole celle evitano i poligoni con buchi durante la sottrazione delle braccia.
	for row in 32:
		for col in 16:
			var x0 := _canvas.x * col / 16.0
			var x1 := _canvas.x * (col + 1) / 16.0
			var y0 := _canvas.y * row / 32.0
			var y1 := _canvas.y * (row + 1) / 32.0
			var remaining: Array = [PackedVector2Array([Vector2(x0, y0), Vector2(x1, y0), Vector2(x1, y1), Vector2(x0, y1)])]
			for part in contours:
				var next: Array = []
				for polygon: PackedVector2Array in remaining:
					regions[part.name].append_array(Geometry2D.intersect_polygons(polygon, part.outline))
					next.append_array(Geometry2D.clip_polygons(polygon, part.outline))
				remaining = next
			regions.torso.append_array(remaining)
	for part_name in regions:
		_make_piece(part_name, regions[part_name], tex)
	for part in contours:
		_make_joint_overlap(part.name, part.outline, tex)

func _make_joint_overlap(part_name: String, outline: PackedVector2Array, tex: Texture2D) -> void:
	# Fasce di tela lungo i bordi dei ritagli: coprono i piccoli movimenti delle
	# giunture, senza duplicare l'intero pezzo né stirare il dipinto.
	var padding := _canvas.y * float(_config.get("joint_overlap", 0.009))
	if padding <= 0:
		return
	var strips: Array = []
	var area := 0.0
	for i in outline.size():
		area += outline[i].cross(outline[(i + 1) % outline.size()])
	for i in outline.size():
		var a := outline[i]
		var b := outline[(i + 1) % outline.size()]
		var edge := b - a
		var outward := Vector2(edge.y, -edge.x).normalized() * (1.0 if area > 0 else -1.0)
		strips.append(PackedVector2Array([a - outward * .5, b - outward * .5, b + outward * padding, a + outward * padding]))
	var name := "joint_" + part_name
	_rest[name] = _rest[part_name]
	bones[name] = bones[part_name]
	_make_piece(name, strips, tex)
	pieces[name].z_index = -1
	bones.erase(name)

func _point(p: Array) -> Vector2:
	return Vector2(float(p[0]), float(p[1])) * _canvas

func _make_piece(part_name: String, regions: Array, tex: Texture2D) -> void:
	var mesh := Polygon2D.new()
	mesh.name = "dipinto_" + part_name
	mesh.texture = tex
	mesh.use_parent_material = true
	var vertices := PackedVector2Array()
	var uv := PackedVector2Array()
	var triangles: Array[PackedInt32Array] = []
	for region: PackedVector2Array in regions:
		var indices := Geometry2D.triangulate_polygon(region)
		var start := vertices.size()
		for point in region:
			vertices.append((point - _rest[part_name]) * _factor)
			uv.append(point)
		for i in range(0, indices.size(), 3):
			triangles.append(PackedInt32Array([start + indices[i], start + indices[i + 1], start + indices[i + 2]]))
	mesh.polygon = vertices
	mesh.uv = uv
	mesh.polygons = triangles
	bones[part_name].add_child(mesh)
	pieces[part_name] = mesh

## Posa a 12 fotogrammi al secondo: respiro, sguardo e piccoli gesti di conversazione.
## Gli abiti lunghi, la sedia e gli oggetti restano nei ritagli stabiliti dal disegno.
func pose(time: float, face: float, tint: Color, lift: float, talking: bool, walking: bool) -> void:
	if _puppet:
		scale.x = face
		_puppet.pose(time,1,tint,lift,talking,walking)
		return
	var t := floorf(time * 12.0) / 12.0
	scale.x = face
	modulate = tint
	position.y = lift
	var breath := sin(t * TAU / float(_config.get("breath_period", 3.4)))
	var gesture := sin(t * 5.5) if talking else 0.0
	for part_name in bones:
		var amount := float(_config.motion.get(part_name, 0.0))
		var angle := breath * amount
		if part_name.begins_with("head"):
			angle += gesture * amount * 1.6
		elif part_name.begins_with("arm") or part_name.begins_with("hand"):
			angle += gesture * amount * 2.0
		elif part_name.begins_with("leg") and walking:
			angle += sin(t * 9.0) * amount * 4.0 * (-1.0 if part_name.ends_with("far") else 1.0)
		bones[part_name].rotation = angle

## Collega le animazioni dipinte alla fase reale dell'azione dell'avversario.
func set_action(action: String, progress: float = 0.0) -> void:
	if _puppet:
		_puppet.set_action(action, progress)
