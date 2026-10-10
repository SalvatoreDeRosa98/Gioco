extends SceneTree
## Confronta i dipinti degli avversari con i ritagli animati nello stesso renderer.
func _initialize() -> void:
	_run.call_deferred()
func _run() -> void:
	root.content_scale_size = Vector2i(1280,720)
	RenderingServer.set_default_clear_color(Color("#303039"))
	var configs: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/npc_cutouts.json"))
	var elites: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/expansion.json")).elites
	elites.duellante = {"image":"res://assets/art/characters/taddeo.png","rig":"combat_duellante"}
	var Rig = load("res://game/npc_cutout_rig.gd")
	var i := 0
	for key in elites:
		var cfg: Dictionary = elites[key]
		var tex: Texture2D = load(cfg.image)
		var factor := 240.0 / tex.get_height()
		var base := Vector2(213 + (i % 3) * 426, 290 + (i / 3) * 340)
		var source := Sprite2D.new()
		source.texture = tex
		source.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		source.centered = false
		source.position = base + Vector2(-80,0) - Vector2(tex.get_width() * .5,tex.get_height()) * factor
		source.scale = Vector2.ONE * factor
		root.add_child(source)
		var holder := Node2D.new()
		holder.position = base + Vector2(80,0)
		root.add_child(holder)
		var rig = Rig.new()
		rig.setup(tex,configs[cfg.rig],Vector2(tex.get_width() * .5,tex.get_height()),factor)
		holder.add_child(rig)
		rig.pose(1.3,1,Color.WHITE,0,true,true)
		var label := Label.new()
		label.text = key + " · originale / articolato"
		label.position = base + Vector2(-180,15)
		label.add_theme_font_size_override("font_size",17)
		root.add_child(label)
		i += 1
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("E:/gioco/.tools/combat-cutouts-preview.png")
	quit()
