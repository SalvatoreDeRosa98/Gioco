extends SceneTree
## Pupazzo a ritaglio di Ferruccio: clip, sincronia dei colpi con le hitbox, scia e morte.
var failures := 0
func _initialize() -> void:
	_run.call_deferred()
func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)
func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var p = main._world.player
	p.set_physics_process(false)
	main._world.set_physics_process(false)
	var rig = p._rig
	check(rig is CutoutRig, "Ferruccio usa il pupazzo a ritaglio")
	check(rig._clips.size() == 17, "Tutte le diciassette clip caricate")
	var textured := 0
	for s in rig.find_children("*", "Sprite2D", true, false):
		textured += int(s.texture != null)
	check(textured == rig._rig.sprites.size(), "Ogni pezzo del dipinto ha la sua immagine")
	p.grounded = true
	p.move_vel = Vector2(250, 0)
	rig.select_state(p, true)
	check(rig.current_clip() == "run", "Corsa selezionata")
	rig.advance(0.2, p.move_vel)
	var thigh_run: float = rig._bones["thigh"].rotation
	rig.advance(0.17, p.move_vel)
	check(not is_equal_approx(thigh_run, rig._bones["thigh"].rotation), "Le gambe si muovono correndo")
	p.attacking = p._cfg.attack_time * 0.6
	p.slash_side = 1
	rig.select_state(p, true)
	rig.advance(0.016, Vector2.ZERO)
	var windup: float = rig._bones["shoulder"].rotation
	p.attacking = p._cfg.attack_time * 0.5
	rig.select_state(p, true)
	rig.advance(0.016, Vector2.ZERO)
	check(rig.current_clip() == "slash_a" and rig._bones["shoulder"].rotation < windup, "Il fendente segue l'avanzamento della hitbox")
	p.attack_down = true
	rig.select_state(p, false)
	check(rig.current_clip() == "pogo", "Colpo verso il basso")
	p.attacking = 0
	p.attack_down = false
	p.parry_window = 0.1
	rig.select_state(p, false)
	check(rig.current_clip() == "parry", "Parata visibile")
	p.parry_window = 0
	p.dashing = true
	rig.select_state(p, false)
	rig.facing = -1
	rig.advance(0.016, Vector2.ZERO)
	var ghost: Node2D = rig.make_ghost(Color.RED)
	check(ghost.scale.x < 0 and not ghost.find_children("*", "Sprite2D", true, false).is_empty(), "La scia copia la posa e l'orientamento")
	ghost.free()
	p.dashing = false
	p.dead = true
	rig.select_state(p, false)
	check(rig.current_clip() == "death" and not rig._clips.death.loop, "Morte non ripetuta")
	main.queue_free()
	await process_frame
	print("CUTOUT ANIMATION TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
