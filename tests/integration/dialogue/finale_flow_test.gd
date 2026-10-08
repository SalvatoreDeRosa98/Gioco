extends SceneTree
## Test d'integrazione del finale: il Custode cade subito (--boss-defeated), Gregorio parla e si
## sceglie "Tieni la spada alzata", Violante rivela il Velo e si sceglie "Spezza il Velo"; poi si
## controllano le variabili della bibbia, il viraggio verso la Libertà e la schermata finale.
## Uso: godot --headless --path src -s <percorso assoluto di questo file> -- --room=4 --at=900 --boss-defeated
## Esce con codice 0 se tutto passa, 1 altrimenti.

const MAIN_SCENE := "res://scenes/main.tscn"

var _failures := 0
var _main: Node


func _initialize() -> void:
	_run.call_deferred()


func _check(cond: bool, what: String) -> void:
	print(("ok    " if cond else "FAIL  ") + what)
	if not cond:
		_failures += 1


func _tap(action: String) -> void:
	var ev := InputEventAction.new()
	ev.action = action
	ev.pressed = true
	Input.parse_input_event(ev)
	await process_frame
	await process_frame
	var up := InputEventAction.new()
	up.action = action
	up.pressed = false
	Input.parse_input_event(up)
	await process_frame


func _wait_until(cond: Callable, ms: int) -> bool:
	var t0 := Time.get_ticks_msec()
	while not cond.call() and Time.get_ticks_msec() - t0 < ms:
		await process_frame
	return cond.call()


## Fa scorrere le battute fino alla scelta, aspetta che le risposte accettino la conferma e
## sceglie la risposta "index" (0 = sinistra, 1 = destra).
func _choose(box, index: int) -> void:
	var t0 := Time.get_ticks_msec()
	while box._options.is_empty() and Time.get_ticks_msec() - t0 < 30000:
		await _tap("jump")
		await create_timer(0.15).timeout
	await _wait_until(func() -> bool: return box._typed() and box._opt_t > box.CHOICE_GUARD, 8000)
	if index == 1:
		await _tap("move_right")
	await _tap("jump")


func _close_dialogue(world) -> void:
	var t0 := Time.get_ticks_msec()
	while world.is_talking() and Time.get_ticks_msec() - t0 < 30000:
		await create_timer(0.2).timeout
		await _tap("attack")


func _run() -> void:
	# Arrange
	_main = load(MAIN_SCENE).instantiate()
	root.add_child(_main)
	await process_frame
	_main.call("_on_play_pressed")
	await create_timer(0.5).timeout
	var world: Node = _main.get_node_or_null("World")
	_check(world != null, "il mondo esiste")
	if world == null:
		quit(1)
		return
	var box = world._dialogue

	# Act 1: Gregorio.
	_check(await _wait_until(func() -> bool: return world.is_talking(), 20000), "dopo il Custode parla Gregorio")
	_check(world.in_cutscene() and not world.player.is_physics_processing(), "durante il finale Ferruccio è fermo")
	await _choose(box, 1)
	_check(world.story.get_var("gregorio_mercy") == "attacco", "la scelta imposta gregorio_mercy = attacco")
	await _close_dialogue(world)
	_check(not world.player.is_physics_processing(), "tra un dialogo e l'altro Ferruccio resta fermo")

	# Act 2: Violante.
	_check(await _wait_until(func() -> bool: return world.is_talking(), 20000), "poi parla Violante")
	await _choose(box, 0)
	_check(world.story.get_var("violante_fate") == "uccisa", "la scelta imposta violante_fate = uccisa")
	await _close_dialogue(world)

	# Act 3: viraggio, epilogo e schermata finale.
	_check(await _wait_until(func() -> bool: return world.is_talking(), 20000), "arriva l'epilogo")
	var sat = world.post_material().get_shader_parameter("saturation")
	_check(sat != null and float(sat) > 1.4, "il colore vira verso la Libertà (saturazione %s)" % str(sat))
	await _close_dialogue(world)
	_check(await _wait_until(func() -> bool: return world.game_over, 5000), "la partita finisce dopo l'epilogo")
	_check(world._hud._end_title == "IL VELO È SPEZZATO", "titolo del finale della Libertà")
	_check(world._hud._end_quote != "", "citazione conclusiva presente")

	# Cleanup
	_main.queue_free()
	await process_frame
	print("%d errori" % _failures)
	quit(1 if _failures > 0 else 0)
