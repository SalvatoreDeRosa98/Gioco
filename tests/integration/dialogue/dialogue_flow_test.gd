extends SceneTree
## Test d'integrazione dei dialoghi: avvia la partita a San Leucio accanto ad Agnese, preme "parla",
## fa scorrere le battute, sceglie la seconda risposta e controlla che la variabile della bibbia
## sia registrata, che durante il dialogo giocatore e nemici siano fermi e che dopo il controllo torni.
## Uso: godot --headless --path src -s <percorso assoluto di questo file> -- --room=3 --at=2280
## (senza --cleared: i nemici della stanza devono esserci per controllare che si fermino).
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


## Attesa in tempo reale: in modalità headless i frame non sono limitati a 60 al secondo.
func _wait(seconds: float) -> void:
	await create_timer(seconds).timeout


## Un tasto premuto e rilasciato, come lo vedrebbe il gioco (eventi e stato di Input).
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


func _run() -> void:
	# Arrange: la partita parte nella stanza indicata sulla riga di comando.
	_main = load(MAIN_SCENE).instantiate()
	root.add_child(_main)
	await process_frame
	_main.call("_on_play_pressed")
	await _wait(1.5)
	var world: Node = _main.get_node_or_null("World")
	_check(world != null, "il mondo esiste")
	if world == null:
		quit(1)
		return
	var agnese: Node = null
	for n in world.get_node("Npcs").get_children():
		if n.key == "agnese":
			agnese = n
	_check(agnese != null, "Agnese è nella stanza")
	_check(agnese != null and agnese.focused, "Ferruccio è abbastanza vicino: compare l'invito")

	# Act 1: "parla" apre il dialogo.
	await _tap("interact")
	await _wait(0.3)
	_check(world.is_talking(), "il tasto parla apre il riquadro")
	_check(not world.player.is_physics_processing(), "durante il dialogo Ferruccio è fermo")
	var enemies := world.get_tree().get_nodes_in_group("enemies")
	var frozen := not enemies.is_empty()
	for e in enemies:
		frozen = frozen and not e.is_physics_processing()
	_check(frozen, "durante il dialogo i nemici sono sospesi")

	# Act 2: le battute scorrono fino alla scelta (salto e colpo fanno avanzare).
	var box = world._dialogue
	var guard := 0
	while box._options.is_empty() and guard < 30:
		await _tap("jump" if guard % 2 == 0 else "attack")
		await _wait(0.1)
		guard += 1
	_check(not box._options.is_empty(), "si arriva alla scelta a due risposte")
	# La domanda si scrive da sola; le risposte accettano la conferma solo dopo un attimo.
	var start := Time.get_ticks_msec()
	while not (box._typed() and box._opt_t > box.CHOICE_GUARD) and Time.get_ticks_msec() - start < 5000:
		await process_frame
	await _tap("move_right")
	_check(box._sel == 1, "destra seleziona la seconda risposta")
	await _tap("jump")
	_check(world.story.get_var("agnese_memory") == "sopita", "la scelta imposta agnese_memory = sopita")

	# Act 3: fine del dialogo e ritorno del controllo.
	guard = 0
	while world.is_talking() and guard < 30:
		await _tap("attack")
		await _wait(0.15)
		guard += 1
	_check(not world.is_talking(), "il riquadro si chiude dopo l'ultima battuta")
	await _wait(0.5)
	_check(world.player.is_physics_processing(), "dopo il dialogo Ferruccio si muove di nuovo")
	var resumed := true
	for e in world.get_tree().get_nodes_in_group("enemies"):
		resumed = resumed and e.is_physics_processing()
	_check(resumed, "dopo il dialogo i nemici riprendono")
	_check(world.story.pick("agnese", world.story_ctx()).get("id") == "agnese_giglio", "il dialogo successivo è quello del giglio")

	# Cleanup.
	_main.queue_free()
	await process_frame
	print("%d errori" % _failures)
	quit(1 if _failures > 0 else 0)
