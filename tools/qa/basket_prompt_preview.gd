extends SceneTree
## Verifica il cesto e gli inviti tastiera/pad nella stanza del mercato.
func _initialize() -> void:
	_run.call_deferred()

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var w = main._world
	w._go(7,true)
	w.player.teleport(Vector2(365,956))
	await create_timer(.8).timeout
	w._hud._title_t = -1
	for enemy in get_nodes_in_group("enemies"):
		enemy.set_physics_process(false)
	for device in [0,1]:
		Controls.device_override = device
		await create_timer(.6).timeout
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("E:/gioco/.tools/basket-prompt-%d.png" % device)
	main.queue_free()
	await process_frame
	quit()
