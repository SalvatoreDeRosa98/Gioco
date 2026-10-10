extends SceneTree
## Fotogrammi del gioco reale: introduzione, porta, incudine e pausa con controller.
func _initialize() -> void:
	_run.call_deferred()

func shot(name: String) -> void:
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("E:/gioco/.tools/" + name + ".png")

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var w = main._world
	w.player.invulnerable = true
	w.player.teleport(Vector2(430,950))
	await create_timer(1).timeout
	await shot("intro-piazza")
	w._go(1,true)
	Controls.device_override = 1
	w.player.teleport(Vector2(2060,950))
	await create_timer(1).timeout
	await shot("forge-door-controller")
	w.enter_forge()
	w._on_dialogue_effect("restore_identity")
	w.player.teleport(Vector2(460,950))
	await create_timer(1).timeout
	await shot("forge-save-controller")
	w._pause.toggle()
	await create_timer(.2).timeout
	await shot("pause-controller")
	quit()
