extends SceneTree
## Fotogrammi del combattimento nel renderer reale, con Ferruccio a distanza giocabile.
func _initialize() -> void:
	_run.call_deferred()

func shot(label: String) -> void:
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("E:/gioco/.tools/ratking-"+label+".png")

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var w = main._world
	w._go(Room.RATKING_ROOM,true)
	await process_frame
	w.player.teleport(Vector2(710,956))
	await create_timer(.8).timeout
	await shot("dialogue")
	w._dialogue._open = false
	w._dialogue.hide()
	w.hold(false)
	w.player.set_physics_process(false)
	w._hud._title_t = -1.0
	var boss = w.boss()
	boss.set_physics_process(false)
	boss.position = Vector2(890,935)
	boss._attack = "claw"
	boss._enter("windup",.8)
	boss._timer = .25
	await create_timer(.2).timeout
	await shot("arena")
	boss._call_rats()
	await create_timer(.3).timeout
	await shot("rats")
	quit()
