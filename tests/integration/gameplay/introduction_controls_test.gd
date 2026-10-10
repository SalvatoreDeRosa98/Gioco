extends SceneTree
## Percorre le prime lezioni con input reali e collisioni: movimento, doppio salto e discesa.
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
	var w = main._world
	w.set_process(false)
	w.set_physics_process(false)
	Input.action_press("move_right")
	await create_timer(.8).timeout
	Input.action_release("move_right")
	check(w.introduction.steps[w.introduction.current].id == "jump", "Il movimento reale completa la prima lezione")
	w.player.teleport(Vector2(430,950))
	await create_timer(.15).timeout
	Input.action_press("jump")
	await create_timer(.18).timeout
	Input.action_release("jump")
	await create_timer(.03).timeout
	check(w.introduction.steps[w.introduction.current].id == "double_jump", "Il salto apre la lezione del salto in aria")
	Input.action_press("jump")
	await create_timer(.18).timeout
	Input.action_release("jump")
	await create_timer(.7).timeout
	check(w.introduction.steps[w.introduction.current].id == "drop", "Il doppio salto reale completa la lezione")
	check(w.player.is_on_floor() and absf(w.player.position.y - 836) < 3, "La mensola è raggiungibile senza scatto")
	Input.action_press("move_down")
	Input.action_press("jump")
	await create_timer(.12).timeout
	Input.action_release("jump")
	Input.action_release("move_down")
	await create_timer(.5).timeout
	check(w.introduction.steps[w.introduction.current].id == "talk", "Giù e salto fanno scendere dalla mensola")
	check(w.player.is_on_floor() and absf(w.player.position.y - 956) < 3, "Ferruccio atterra vicino a Tonino")
	check(get_nodes_in_group("enemies").is_empty(), "Nessun nemico interrompe le lezioni iniziali")
	main.queue_free()
	await process_frame
	print("introduction_controls_test: %d fallimenti" % failures)
	quit(1 if failures else 0)
