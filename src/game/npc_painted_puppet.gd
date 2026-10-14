extends Node2D
## Parti ridipinte complete e articolazioni gerarchiche; clip condivise con Ferruccio.
## I rettangoli dell'atlante, le proporzioni e le pose specifiche sono dati esterni.
var bones: Dictionary = {}
var pieces: Dictionary = {}
var clip := "idle"
var _config: Dictionary
var _anatomy: Dictionary
var _clips: Dictionary
var _rest: Dictionary = {}
var _body: Node2D
var _factor := 1.0
var _start := 0.0
var _action := ""
var _action_progress := 0.0
var _last_time := -1.0
var _blend: Dictionary = {}
var _companion: Node2D
var _profile: Dictionary
var _blink_phase := 0.0

## Assembla una figura alta height pixel dai pezzi dipinti dell'atlante.
func setup(config: Dictionary, height: float) -> void:
	_blink_phase = randf() * 6.0
	_config = config
	_anatomy = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_puppet_anatomy.json"))
	_clips = JSON.parse_string(FileAccess.get_file_as_string("res://data/ferruccio_anim.json")).clips.duplicate(true)
	for name in _anatomy.clips:
		_clips[name] = _anatomy.clips[name]
	_factor = height / float(config.height)
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	var painted := CanvasItemMaterial.new()
	painted.light_mode = CanvasItemMaterial.LIGHT_MODE_NORMAL
	material = painted
	_body = Node2D.new()
	_body.scale = Vector2.ONE * _factor
	_body.use_parent_material = true
	add_child(_body)
	var anatomy: Dictionary = _anatomy.profiles[config.profile]
	_profile = anatomy
	for name in anatomy.bones:
		var data: Dictionary = anatomy.bones[name]
		var bone := Node2D.new()
		bone.name = name
		bone.position = Vector2(float(data.offset[0]), float(data.offset[1]))
		bone.use_parent_material = true
		bones[name] = bone
		_rest[name] = bone.position
		var parent: Node2D = _body if data.parent == "" else bones[data.parent]
		parent.add_child(bone)
	var atlas: Texture2D = load(config.atlas)
	for name in anatomy.pieces:
		if not config.regions.has(name):
			continue
		var data: Dictionary = anatomy.pieces[name]
		var rect: Array = config.regions[name]
		var size := Vector2(float(rect[2]), float(rect[3]))
		var sprite := Sprite2D.new()
		sprite.texture = atlas
		sprite.region_enabled = true
		sprite.region_rect = Rect2(float(rect[0]), float(rect[1]), size.x, size.y)
		sprite.region_filter_clip_enabled = true
		sprite.centered = false
		sprite.scale = Vector2.ONE * float(data.span) / size.y
		sprite.position = -Vector2(float(data.anchor[0]) * size.x, float(data.anchor[1]) * size.y) * sprite.scale
		sprite.z_index = int(data.z)
		sprite.use_parent_material = true
		bones[data.bone].add_child(sprite)
		pieces[name] = sprite
	_register_joints()
	if config.has("extra"):
		_setup_extra(atlas)
	else:
		_setup_accessory(atlas)
	if config.has("companion"):
		var companions: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_puppets.json"))
		_companion = get_script().new()
		_companion.setup(companions[config.companion.character],height*float(config.companion.height))
		_companion.position = Vector2(float(config.companion.offset[0]),float(config.companion.offset[1]))*height
		add_child(_companion)
	_apply(_sample("idle", 0))
	_level_basket()

## Cesto e lanterna restano diritti, agganciati alla mano anche mentre il braccio ruota.
func _level_basket() -> void:
	if str(_config.accessory) not in ["basket","lantern"] or not pieces.has("accessory"):
		return
	var angle := 0.0
	var joint: Node2D = bones.wrist
	while joint != _body:
		angle += joint.rotation
		joint = joint.get_parent() as Node2D
	var basket: Sprite2D = pieces.accessory
	basket.rotation = -angle
	var anchor: Vector2 = basket.get_meta("painted_anchor")
	basket.position = Vector2(0,float(_anatomy.hand_grip))-anchor.rotated(basket.rotation)

func _register_joints() -> void:
	# The painted neck and shoulder sockets belong to the torso image, not its box.
	var torso: Sprite2D = pieces.torso
	for name in _config.sockets:
		if _config.profile == "insect":
			continue
		var socket: Array = _config.sockets[name]
		bones[name].position = torso.position + Vector2(float(socket[0]),float(socket[1])) * torso.region_rect.size * torso.scale
		_rest[name] = bones[name].position
	var children := {"shoulder":"elbow","shoulder_f":"elbow_f",
		"elbow":"wrist","elbow_f":"wrist_f","thigh":"knee",
		"thigh_f":"knee_f","knee":"ankle","knee_f":"ankle_f"}
	for name in _config.registration:
		if _config.profile == "insect" and name in ["head","shoulder","shoulder_f"]:
			continue
		var sprite: Sprite2D = pieces[name]
		var data: Dictionary = _config.registration[name]
		var size := sprite.region_rect.size
		var start := Vector2(float(data.start[0]),float(data.start[1])) * size
		var end := Vector2(float(data.end[0]),float(data.end[1])) * size
		if name == "torso":
			continue
		if name == "head":
			sprite.scale = Vector2.ONE * float(_config.head_span) / size.y
		elif name.begins_with("wrist"):
			sprite.rotation = PI*.5-(end-start).angle()
		elif children.has(name):
			# Skirts are cloth panels covering both leg segments, not thigh bones.
			if name.begins_with("thigh") and _config.profile in ["dress","statue"]:
				sprite.position = -start * sprite.scale
				continue
			var axis := end-start
			var length: float = bones[children[name]].position.length()
			sprite.scale = Vector2.ONE * length / axis.length()
			sprite.rotation = PI*.5-axis.angle()
		# Transform the pivot by the same rotation as the drawing. This is what
		# keeps a diagonally painted sleeve attached when its elbow bends.
		sprite.position = -(start * sprite.scale).rotated(sprite.rotation)

func _setup_extra(atlas: Texture2D) -> void:
	var extra_config: Dictionary = _config.duplicate(true)
	extra_config.accessory = _config.extra
	extra_config.regions.accessory = _config.regions.extra
	var saved := _config
	_config = extra_config
	_setup_accessory(atlas)
	pieces.extra = pieces.accessory
	pieces.erase("accessory")
	_config = saved
	# Mantiene il vero accessorio oltre al mantello o al piedistallo.
	if str(_config.accessory) != "":
		_setup_accessory(atlas)

func _setup_accessory(atlas: Texture2D) -> void:
	if not _config.regions.has("accessory") or str(_config.accessory).is_empty():
		return
	var data: Dictionary = _anatomy.accessories[_config.accessory]
	var r: Array = _config.regions.accessory
	var sprite := Sprite2D.new()
	sprite.texture = atlas
	sprite.region_enabled = true
	sprite.region_rect = Rect2(float(r[0]),float(r[1]),float(r[2]),float(r[3]))
	sprite.region_filter_clip_enabled = true
	sprite.centered = false
	sprite.scale = Vector2.ONE * float(data.span) / float(r[3])
	sprite.rotation = deg_to_rad(float(data.get("angle",0)))
	var anchor := Vector2(float(data.anchor[0])*float(r[2]),float(data.anchor[1])*float(r[3])) * sprite.scale
	sprite.position = -anchor.rotated(sprite.rotation)
	sprite.set_meta("painted_anchor",anchor)
	if data.bone == "wrist":
		sprite.position += Vector2(0,float(_anatomy.hand_grip))
	sprite.z_index = int(data.get("z",1))
	sprite.use_parent_material = true
	var parent: Node2D = _body if data.bone == "" else bones[data.bone]
	parent.add_child(sprite)
	if data.has("position"):
		sprite.position += Vector2(float(data.position[0]),float(data.position[1]))
	pieces.accessory = sprite

## Usa la vera fase dell'attacco: anticipazione, colpo e recupero seguono l'IA.
func set_action(action: String, progress: float = 0.0) -> void:
	_action = action
	_action_progress = clampf(progress,0,1)
	if _anatomy.combat.has(action):
		var cfg: Dictionary = _anatomy.combat[action]
		_action = cfg.clip
		_action_progress = lerpf(float(cfg.start),float(cfg.end),_action_progress)

## Mantiene l'orientamento della lama uguale al fendente usato dalla collisione.
func aim_weapon(angle: float) -> void:
	if not pieces.has("accessory") or not bool(_config.get("weapon",false)):
		return
	var arm: float = bones.root.rotation+bones.torso.rotation+bones.shoulder.rotation+bones.elbow.rotation+bones.wrist.rotation
	pieces.accessory.rotation = angle-PI*.5-arm
	var anchor: Vector2 = pieces.accessory.get_meta("painted_anchor")
	pieces.accessory.position = Vector2(0,float(_anatomy.hand_grip))-anchor.rotated(pieces.accessory.rotation)

## Camminata, conversazione e riposo campionati come le clip del protagonista.
func pose(time: float, face: float, tint: Color, lift: float, talking: bool, walking: bool) -> void:
	scale.x = face
	modulate = tint
	position.y = lift
	var next := "run" if walking else ("talk" if talking else "npc_idle")
	if _config.profile == "seated":
		next = "seated_talk" if talking else "seated_idle"
	elif _config.profile == "kneeling":
		next = "kneeling_talk" if talking else "kneeling_idle"
	elif _config.profile == "insect":
		next = "insect_idle"
	if _action != "":
		next = _action
	if next != clip:
		clip = next
		_start = time
	var cfg: Dictionary = _clips[clip]
	var t := maxf(0,time - _start) * float(_config.get("pace",1.0))
	if _action != "":
		t = _action_progress * float(cfg.length)
	elif cfg.loop:
		t = fmod(t,float(cfg.length))
	t = floorf(t * float(cfg.fps)) / float(cfg.fps)
	var target := _sample(clip,t)
	if not talking and not walking and _action == "" and _config.has("rest_pose"):
		for name in _config.rest_pose:
			target[name] = float(target.get(name,0))+float(_config.rest_pose[name])
	# Le transizioni hanno lo stesso passo disegnato delle pose, senza scatti del busto.
	if time != _last_time:
		var weight := minf(1,maxf(0,time-_last_time)*float(_anatomy.transition_speed)) if _last_time >= 0 else 1.0
		_blend = _mix(_blend,target,weight)
		_last_time = time
	_apply(_blend)
	if bones.has("head"):
		var shut := fposmod(time + _blink_phase, 4.6) < 0.09
		bones.head.scale = Vector2(1.0, 0.9 if shut else 1.0)
	_level_basket()
	if pieces.has("extra") and _config.extra == "cloak":
		pieces.extra.rotation = deg_to_rad(sin(time*TAU/float(_anatomy.secondary.cloak_period))*float(_anatomy.secondary.cloak_angle))
	if _companion:
		_companion.pose(time+.4,1,Color.WHITE,0,talking,walking)

func _sample(name: String, t: float) -> Dictionary:
	var keys: Array = _clips[name].keys
	if t <= float(keys[0].t):
		return keys[0].pose.duplicate(true)
	for i in keys.size()-1:
		var a: Dictionary = keys[i]
		var b: Dictionary = keys[i+1]
		if t <= float(b.t):
			var u := (t-float(a.t))/maxf(.0001,float(b.t)-float(a.t))
			var ease := str(a.get("ease","inout"))
			if ease == "step":
				u = 0
			elif ease == "in":
				u *= u
			elif ease == "out":
				u = 1-(1-u)*(1-u)
			else:
				u = u*u*(3-2*u)
			return _mix(a.pose,b.pose,u)
	return keys[-1].pose.duplicate(true)

func _mix(a: Dictionary,b: Dictionary,u: float) -> Dictionary:
	var result := {}
	for name in _anatomy.animated:
		result[name] = lerpf(float(a.get(name,0)),float(b.get(name,0)),u)
	return result

func _apply(pose: Dictionary) -> void:
	for name in bones:
		var angle_key: String = "neck" if name == "head" else str(name)
		var amount := float((_profile.get("motion_scale",{}) as Dictionary).get(angle_key,1.0))
		bones[name].rotation = deg_to_rad(float(pose.get(angle_key,0))*amount)
	var hips: Vector2 = _rest.hips
	bones.hips.position = hips + Vector2(float(pose.get("hips_x",0)),float(pose.get("hips_y",0)))
	var root_rest: Vector2 = _rest.root
	bones.root.position = root_rest + Vector2(float(pose.get("root_x",0)),float(pose.get("root_y",0)))
	bones.root.rotation = deg_to_rad(float(pose.get("root_rot",0)))
	if clip not in ["rise","fall","double_jump"] and _config.profile != "insect":
		var bottom := -INF
		for name in ["ankle","ankle_f"]:
			var sprite: Sprite2D = pieces[name]
			var size := sprite.region_rect.size
			for point in [Vector2.ZERO,Vector2(size.x,0),size,Vector2(0,size.y)]:
				bottom = maxf(bottom,_body.to_local(sprite.to_global(point)).y)
		bones.root.position.y += float(_config.get("ground_offset",0))-bottom
