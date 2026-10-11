extends SceneTree
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(value: bool, description: String) -> void:
	if not value:
		failures += 1
		push_error(description)
## InputRemap: rimappatura tastiera e controller, conflitti, persistenza e reset.
func _run() -> void:
	InputRemap.path = "user://test-input.cfg"
	InputRemap.delete_saved()
	var main = load("res://scripts/main.gd").new()
	main._ensure_inputs()
	InputRemap.capture_defaults()
	for a in InputRemap.ACTIONS:
		check(InputMap.has_action(a), "Azione rimappabile esiste: " + a)
		check(not InputRemap.events(a, false).is_empty(), "Default tastiera: " + a)
	check(InputRemap.label("jump", false) == "Spazio", "Etichetta salto: " + InputRemap.label("jump", false))
	var k := InputEventKey.new()
	k.physical_keycode = KEY_L
	k.pressed = true
	InputRemap.rebind("jump", k)
	check(InputRemap.label("jump", false) == "L", "Salto su L")
	check(InputRemap.is_customized("jump", false) and not InputRemap.is_customized("jump", true), "Personalizzato solo da tastiera")
	check(Controls.label("jump") == "L" or Controls.device_override == 1 or not Input.get_connected_joypads().is_empty(), "I suggerimenti seguono la rimappatura")
	var x := InputEventKey.new()
	x.physical_keycode = KEY_X
	var removed := InputRemap.rebind("dash", x)
	check(removed.has("attack"), "X tolto dal colpo quando va allo scatto")
	var b := InputEventJoypadButton.new()
	b.button_index = JOY_BUTTON_Y
	InputRemap.rebind("parry", b)
	check(InputRemap.label("parry", true) == "Y / Triangolo", "Parata su Y")
	check(not InputRemap.events("interact", true).any(func(e): return InputRemap.same(e, b)), "Y tolto da interagisci")
	var axis := InputEventJoypadMotion.new()
	axis.axis = JOY_AXIS_RIGHT_Y
	axis.axis_value = 0.9
	InputRemap.rebind("map", axis)
	check(InputRemap.label("map", true) == "Stick dx giu'", "Asse come binding")
	check(InputRemap.save_bindings() == OK, "Salva i comandi")
	InputRemap.reset()
	check(InputRemap.label("jump", false) == "Spazio" and not InputRemap.is_customized("dash", false), "Reset ai default")
	check(InputRemap.load_bindings(), "Ricarica i comandi")
	check(InputRemap.label("jump", false) == "L" and InputRemap.label("parry", true) == "Y / Triangolo" and InputRemap.label("map", true) == "Stick dx giu'", "Comandi persistiti")
	var ev := InputEventKey.new()
	ev.physical_keycode = KEY_L
	ev.keycode = KEY_L
	ev.pressed = true
	check(ev.is_action("jump") or InputMap.event_is_action(ev, "jump"), "L aziona davvero il salto")
	InputRemap.reset()
	InputRemap.delete_saved()
	check(not InputRemap.load_bindings(), "Senza file nessuna modifica")
	main.free()
	print("input_remap_test: ", "OK" if failures == 0 else "%d fallimenti" % failures)
	quit(failures)