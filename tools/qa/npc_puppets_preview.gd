extends SceneTree
## Verifica in Godot i nuovi dipinti assemblati e sei pose reali per personaggio.
func _initialize() -> void:
	_run.call_deferred()

func _run() -> void:
	root.size = Vector2i(1600,1080)
	root.content_scale_size = Vector2i(1600,1080)
	RenderingServer.set_default_clear_color(Color("#34313b"))
	var configs: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_puppets.json"))
	var only := ""
	var view_state := 0
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--character="):
			only = arg.trim_prefix("--character=")
		if arg.begins_with("--state="):
			view_state = int(arg.trim_prefix("--state="))
	var script = load("res://game/npc_painted_puppet.gd")
	var i := 0
	for key in configs:
		if key.begins_with("combat_") or key in ["gaetano_umano","violante_scesa","rosa"]:
			continue
		if only != "" and key != only:
			continue
		var count := 6 if only != "" else 1
		for state in count:
			var cell := state if only != "" else i
			var holder := Node2D.new()
			holder.position = Vector2(235+(cell%3)*530,430+(cell/3)*500) if only != "" else Vector2(135+(cell%6)*265,250+(cell/6)*270)
			root.add_child(holder)
			var rig = script.new()
			rig.setup(configs[key],360 if only != "" else 195)
			holder.add_child(rig)
			var pose_state := state if only != "" else view_state
			if pose_state >= 3:
				rig.set_action("parry" if pose_state == 3 else "slash_a",[0,0,0,.5,.35,.65][pose_state])
			rig.pose(1.3,1,Color.WHITE,0,pose_state==1,pose_state==2)
			if pose_state in [1,2]:
				rig.pose(1.9,1,Color.WHITE,0,pose_state==1,pose_state==2)
			var label := Label.new()
			label.text = str(key) + (" · " + ["idle","talk","walk","guard","windup","strike"][state] if only != "" else "")
			label.position = holder.position + Vector2(-95,15)
			root.add_child(label)
		i += 1
	await process_frame
	await RenderingServer.frame_post_draw
	var name := "npc-puppets-" + (only if only != "" else "gallery")
	if only == "" and view_state != 0:
		name += "-" + str(view_state)
	root.get_texture().get_image().save_png("E:/gioco/.tools/"+name+".png")
	print("painted puppet preview: ",name)
	quit()
