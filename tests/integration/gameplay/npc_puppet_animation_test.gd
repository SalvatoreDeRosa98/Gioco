extends SceneTree
## Verifica pose distinte, accessori, appoggio e collegamento delle fasi di attacco.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

## Registra una violazione mantenendo tutti i controlli nello stesso passaggio.
func check(ok: bool,message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	var configs: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_puppets.json"))
	var script = load("res://game/npc_painted_puppet.gd")
	for key in configs:
		var config: Dictionary = configs[key]
		var rig = script.new()
		rig.setup(config,100)
		root.add_child(rig)
		check(rig.bones.size() == 16,key+": scheletro completo a sedici articolazioni")
		for name in rig.pieces:
			var sprite: Sprite2D = rig.pieces[name]
			check(sprite.region_rect.size.x>0 and sprite.region_rect.size.y>0,key+": parte dipinta valida "+name)
			check(sprite.scale.x == sprite.scale.y,key+": proporzioni uniformi "+name)
		rig.pose(0,1,Color.WHITE,0,false,false)
		var head_before: float = rig.bones.head.rotation
		rig.pose(1.0,1,Color.WHITE,0,true,false)
		rig.pose(1.6,1,Color.WHITE,0,true,false)
		if config.profile != "insect":
			check(absf(rig.bones.head.rotation-head_before)>.01,key+": gesto di conversazione riconoscibile")
		if config.profile in ["standing","dress","statue"]:
			rig.pose(2,1,Color.WHITE,0,false,true)
			var knee_before: float = rig.bones.knee.rotation
			rig.pose(2.45,1,Color.WHITE,0,false,true)
			check(absf(rig.bones.knee.rotation-knee_before)>.03,key+": camminata con ginocchio articolato")
			rig.pose(2.5,-1,Color.WHITE,0,false,true)
			check(rig.scale.x == -1,key+": direzione di cammino")
			var bottom := -INF
			for foot in ["ankle","ankle_f"]:
				var sprite: Sprite2D = rig.pieces[foot]
				var size := sprite.region_rect.size
				for point in [Vector2.ZERO,Vector2(size.x,0),size,Vector2(0,size.y)]:
					bottom = maxf(bottom,rig._body.to_local(sprite.to_global(point)).y)
			check(absf(bottom-float(config.get("ground_offset",0)))<.01,key+": appoggio dei piedi senza galleggiamento")
		if bool(config.get("weapon",false)):
			rig.set_action("windup",1)
			rig.pose(3,1,Color.WHITE,0,false,false)
			var shoulder_before: float = rig.bones.shoulder.rotation
			rig.set_action("strike",.4)
			rig.pose(3.3,1,Color.WHITE,0,false,false)
			check(absf(rig.bones.shoulder.rotation-shoulder_before)>.2,key+": anticipazione e colpo distinti")
			rig.aim_weapon(.45)
			var relative: float = rig.bones.root.rotation+rig.bones.torso.rotation+rig.bones.shoulder.rotation+rig.bones.elbow.rotation+rig.bones.wrist.rotation+rig.pieces.accessory.rotation+PI*.5
			check(absf(relative-.45)<.001,key+": lama allineata al fendente fisico")
		if key == "assunta":
			check(rig._companion != null and rig._companion.bones.has("knee"),"Nunziatina ha un corpo autonomo")
		if key == "mariella":
			check(rig.pieces.has("accessory"),"Mariella conserva la sedia")
			var chair_position: Vector2 = rig.pieces.accessory.position
			rig.pose(4,1,Color.WHITE,0,true,true)
			check(rig.clip == "seated_talk" and rig.pieces.accessory.position == chair_position,"Mariella parla senza animare la sedia o alzarsi")
		rig.free()
	print("npc_puppet_animation_test: %d configurazioni, %d fallimenti" % [configs.size(),failures])
	quit(1 if failures else 0)
