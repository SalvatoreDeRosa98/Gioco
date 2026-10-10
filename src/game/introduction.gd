extends Node
## Piazza Dante insegna i comandi in sequenza e presenta un nemico alla volta.
## Il progresso vive nella memoria della sessione; la morte non ripete le lezioni finite.
var world: Node
var steps: Array
var current := 0
var _elapsed := 0.0
var _spawned := false
var _pressed := false
var _start_x := 0.0

## Recupera la prima lezione ancora da completare.
func setup(w: Node) -> void:
	world = w
	steps = JSON.parse_string(FileAccess.get_file_as_string("res://data/introduction.json")).steps
	_start_x = w.player.position.x
	while current < steps.size() and world.story.times_seen("lesson_" + steps[current].id) > 0:
		current += 1

## Vero quando si può lasciare la zona introduttiva.
func complete() -> bool:
	return current >= steps.size()

## Suggerimento per la lezione corrente, adattato al controller.
func hint() -> String:
	if complete():
		return "Corso Trieste · La bottega di tuo padre è oltre la piazza"
	var step: Dictionary = steps[current]
	var text: String = step.text
	for action in ["dash", "grapple", "hammer", "heal"]:
		text = text.replace("{" + action + "}", Controls.label(action))
	return Controls.label(step.action) + "  " + text

func _input(event: InputEvent) -> void:
	if not complete() and not world.is_talking() and InputMap.has_action(str(steps[current].action)) and event.is_action_pressed(str(steps[current].action)):
		_pressed = true
		# La mappa ferma la fisica: registra la lezione prima di aprirla.
		if steps[current].condition == "action":
			_finish()

func _physics_process(delta: float) -> void:
	if complete() or world.player.dead or world.is_talking() or world.in_cutscene() or world._map.opened or world._shop.opened:
		return
	_elapsed += delta
	var step: Dictionary = steps[current]
	var done := false
	match str(step.condition):
		"move": done = absf(world.player.position.x - _start_x) >= float(step.distance)
		"jump": done = world.player.velocity.y < 0 and not world.player.is_on_floor()
		"double_jump": done = world.player._air_jumps < int(world.player._cfg.air_jumps)
		"drop": done = world.player._drop_t > 0
		"talk": done = world.story.times_seen("forge_first_clue") > 0 or world.story.times_seen("tonino_primo") > 0 or world.story.get_var("tonino_memory") != ""
		"enemy":
			if not _spawned:
				world._spawn_enemy(step.enemy, Vector2(step.pos[0], step.pos[1]))
				_spawned = true
			done = _spawned and get_tree().get_nodes_in_group("enemies").is_empty()
		"action": done = _pressed
		"wait": done = _elapsed >= float(step.seconds)
	if done:
		_finish()

func _finish() -> void:
	world.story.seen["lesson_" + steps[current].id] = 1
	current += 1
	_elapsed = 0
	_spawned = false
	_pressed = false
	if complete():
		world.refresh_routes()
