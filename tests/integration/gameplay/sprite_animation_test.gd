extends SceneTree
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
	check(rig.sprite.sprite_frames.get_animation_names().size() == 17, "Tutte le diciassette sequenze caricate")
	p.grounded = true
	p.move_vel = Vector2(250,0)
	rig.select_state(p,true)
	check(rig.sprite.animation == "run", "Corsa selezionata")
	p.attacking = p._cfg.attack_time * 0.5
	p.slash_side = 1
	rig.select_state(p,true)
	check(rig.sprite.animation == "slash_a" and rig.sprite.frame == 4, "Fendente sincronizzato con la hitbox")
	p.attack_down = true
	rig.select_state(p,false)
	check(rig.sprite.animation == "pogo", "Colpo verso il basso")
	p.attacking = 0
	p.parry_window = 0.1
	rig.select_state(p,false)
	check(rig.sprite.animation == "parry", "Parata visibile")
	p.parry_window = 0
	p.dashing = true
	rig.select_state(p,false)
	rig.facing = -1
	rig.advance(0.016,Vector2.ZERO)
	var ghost = rig.make_ghost(Color.RED)
	check(ghost.texture != null and ghost.scale.x < 0, "Scia copia il fotogramma e l'orientamento")
	ghost.free()
	p.dead = true
	rig.select_state(p,false)
	check(rig.sprite.animation == "death" and not rig.sprite.sprite_frames.get_animation_loop("death"), "Morte non ripetuta")
	main.queue_free()
	await process_frame
	print("SPRITE ANIMATION TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
