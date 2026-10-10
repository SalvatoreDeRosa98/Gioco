extends SceneTree
## Tavola di verifica del rendering reale: tre stati di Ferruccio e tutti i ritagli NPC.
func _initialize() -> void:
	_run.call_deferred()

func label_at(text: String, pos: Vector2) -> void:
	var label := Label.new()
	label.text = text
	label.position = pos
	label.add_theme_font_size_override("font_size", 13)
	root.add_child(label)

func _run() -> void:
	root.size = Vector2i(1600, 1080)
	root.content_scale_size = Vector2i(1600,1080)
	RenderingServer.set_default_clear_color(Color("#303039"))
	label_at("Ferruccio: senza ricordi / volto ritrovato / sciarpa di Agnese", Vector2(40, 15))
	var Rig = load("res://game/cutout_rig.gd")
	for i in 3:
		var rig = Rig.new()
		rig.height = 190
		rig.position = Vector2(220 + i * 480, 240)
		root.add_child(rig)
		rig.set_story_appearance(i == 2, i > 0)
		rig.advance(0, Vector2.ZERO)
		label_at(["Senza ricordi", "Dopo Gaetano", "Dopo Agnese"][i], Vector2(140 + i * 480, 255))
	var configs: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_cutouts.json"))
	var Script = load("res://game/npc_cutout_rig.gd")
	var i := 0
	for key in configs:
		var look := Story.character(key)
		if not look.has("image"):
			continue
		var tex: Texture2D = load(look.image)
		var scale := 165.0 / tex.get_height()
		var base := Vector2(133 + (i % 6) * 266, 505 + (i / 6) * 260)
		var original := Sprite2D.new()
		original.texture = tex
		original.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		original.centered = false
		original.scale = Vector2.ONE * scale
		original.position = base + Vector2(-65, 0) - Vector2(tex.get_width() * .5, tex.get_height() - 4) * scale
		root.add_child(original)
		var rig = Script.new()
		rig.setup(tex, configs[key], Vector2(tex.get_width() * .5, tex.get_height() - 4), scale)
		rig.position = base + Vector2(65, 0)
		var container := Node2D.new()
		container.position = rig.position
		rig.position = Vector2.ZERO
		root.add_child(container)
		container.add_child(rig)
		rig.pose(1.3, 1, Color.WHITE, 0, true, false)
		label_at(key + " · originale / articolato", base + Vector2(-125, 17))
		i += 1
	await process_frame
	await RenderingServer.frame_post_draw
	var result := root.get_texture().get_image().save_png("E:/gioco/.tools/painted-characters-preview.png")
	print("painted preview: ", result)
	quit()
