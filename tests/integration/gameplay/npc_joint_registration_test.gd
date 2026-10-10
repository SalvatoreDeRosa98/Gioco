extends SceneTree
## I punti dipinti devono coincidere con le ossa in movimento, su entrambi i lati.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func _check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	var configs: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_puppets.json"))
	var children := {"shoulder":"elbow","shoulder_f":"elbow_f",
		"elbow":"wrist","elbow_f":"wrist_f","thigh":"knee",
		"thigh_f":"knee_f","knee":"ankle","knee_f":"ankle_f"}
	for key in configs:
		var config: Dictionary = configs[key]
		var rig = load("res://game/npc_painted_puppet.gd").new()
		rig.setup(config,200)
		root.add_child(rig)
		var atlas: Image = rig.pieces.torso.texture.get_image()
		for name in config.registration:
			if name == "torso" or (config.profile == "insect" and name in ["head","shoulder","shoulder_f"]):
				continue
			var sprite: Sprite2D = rig.pieces[name]
			var data: Dictionary = config.registration[name]
			var start := Vector2(float(data.start[0]),float(data.start[1])) * sprite.region_rect.size
			var pixel := Vector2i(sprite.region_rect.position+start)
			_check(atlas.get_pixelv(pixel).a > .4,key+": perno su parte opaca "+name)
			if children.has(name) and not (name.begins_with("thigh") and config.profile in ["dress","statue"]):
				var end_pixel := Vector2i(sprite.region_rect.position+Vector2(float(data.end[0]),float(data.end[1]))*sprite.region_rect.size)
				_check(atlas.get_pixelv(end_pixel).a > .4,key+": estremità su parte opaca "+name)
			for direction in [-1,1]:
				for step in 12:
					rig.set_action("slash_a",float(step)/11)
					rig.pose(step+direction*20,direction,Color.WHITE,0,false,false)
					_check(sprite.to_global(start).distance_to(rig.bones[name].global_position)<.01,
						key+": inizio agganciato "+name)
					if children.has(name) and not (name.begins_with("thigh") and config.profile in ["dress","statue"]):
						var end := Vector2(float(data.end[0]),float(data.end[1])) * sprite.region_rect.size
						_check(sprite.to_global(end).distance_to(rig.bones[children[name]].global_position)<.01,
							key+": estremità agganciata "+name)
		rig.free()
	print("npc_joint_registration_test: %d fallimenti" % failures)
	quit(1 if failures else 0)
