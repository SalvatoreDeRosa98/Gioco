extends SceneTree
## Fotogrammi delle figure nuove accanto a Ferruccio nelle stanze effettive.
func _initialize() -> void:
	_run.call_deferred()

## Salva il fotogramma del renderer reale dopo l'aggiornamento della scena.
func shot(name: String) -> void:
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("E:/gioco/.tools/"+name+".png")

func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var w = main._world
	w.player.invulnerable = true
	w.player.teleport(Vector2(490,950))
	await create_timer(1.0).timeout
	await shot("npc-puppets-tonino-game")
	w.introduction.set_physics_process(false)
	w.player.teleport(Vector2(1140,950))
	var guard = load("res://game/elite.gd").new()
	guard.setup({"type":"guardia","pos":Vector2(1260,942)},w)
	w.add_child(guard)
	await create_timer(1.0).timeout
	await shot("npc-puppets-guard-game")
	w._go(1,true)
	w.player.teleport(Vector2(1370,950))
	await create_timer(1.0).timeout
	await shot("npc-puppets-mariella-game")
	w._go(4,true)
	w.player.teleport(Vector2(900,950))
	await create_timer(1.0).timeout
	await shot("npc-puppets-custode-game")
	quit()
