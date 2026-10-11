class_name Controls
extends RefCounted
## Suggerimenti coerenti con l'ultimo dispositivo usato e con i binding reali.
static var device_override := -1
const KEYS := {"move": "A / D", "jump": "Spazio", "attack": "X", "parry": "F", "interact": "E", "dash": "C", "shop": "B", "map": "M", "pause": "Esc", "grapple": "Q", "hammer": "V", "heal": "R", "drop": "S + Spazio"}
const PAD := {"move": "Stick / croce", "jump": "A / ×", "attack": "X / □", "parry": "LB / L1", "interact": "Y / △", "dash": "RB / R1", "shop": "↑ croce", "map": "Back / Select", "pause": "Start / Options", "grapple": "RT / R2", "hammer": "B / ○", "heal": "LT / L2", "drop": "↓ + A / ×"}

## Il controller collegato è il dispositivo iniziale, poi prevale l'ultimo input.
static func label(action: String) -> String:
	var pad := device_override == 1 or (device_override < 0 and not Input.get_connected_joypads().is_empty())
	var custom := _custom_label(action, pad)
	if custom != "":
		return custom
	return str((PAD if pad else KEYS).get(action, action))


## Testo dai binding reali se il giocatore ha rimappato l'azione, altrimenti "".
static func _custom_label(action: String, pad: bool) -> String:
	if not InputRemap.has_defaults():
		return ""
	if action == "move":
		if InputRemap.is_customized("move_left", pad) or InputRemap.is_customized("move_right", pad):
			return InputRemap.label("move_left", pad) + " / " + InputRemap.label("move_right", pad)
		return ""
	if action == "drop":
		if InputRemap.is_customized("move_down", pad) or InputRemap.is_customized("jump", pad):
			return InputRemap.label("move_down", pad) + " + " + InputRemap.label("jump", pad)
		return ""
	if InputRemap.ACTIONS.has(action) and InputRemap.is_customized(action, pad):
		return InputRemap.label(action, pad)
	return ""

## Ignora i piccoli movimenti involontari degli stick.
static func observe(event: InputEvent) -> void:
	if event is InputEventJoypadButton or (event is InputEventJoypadMotion and absf(event.axis_value) > 0.25):
		device_override = 1
	elif event is InputEventKey or event is InputEventMouseButton:
		device_override = 0
