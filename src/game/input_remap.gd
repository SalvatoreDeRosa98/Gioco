class_name InputRemap
extends RefCounted
## Rimappatura di tastiera e controller per tutte le azioni di gioco dell'InputMap.
## I binding di fabbrica si fotografano dopo main._ensure_inputs(); quelli personalizzati
## si salvano in user:// e si possono riportare ai default.

## File dei comandi personalizzati (i test lo spostano altrove).
static var path := "user://input.cfg"
## Azioni rimappabili, nell'ordine del menu, con il nome mostrato.
const ACTIONS := {
	"move_left": "Sinistra", "move_right": "Destra", "move_up": "Su", "move_down": "Giu' / scendi",
	"jump": "Salto", "attack": "Colpo", "dash": "Scatto", "parry": "Parata", "interact": "Interagisci",
	"grapple": "Catena", "hammer": "Martello", "heal": "Cura", "map": "Mappa", "shop": "Lavorazioni",
	"pause": "Pausa",
}
const PAD_BUTTONS := {
	JOY_BUTTON_A: "A / Croce", JOY_BUTTON_B: "B / Cerchio", JOY_BUTTON_X: "X / Quadrato", JOY_BUTTON_Y: "Y / Triangolo",
	JOY_BUTTON_LEFT_SHOULDER: "LB / L1", JOY_BUTTON_RIGHT_SHOULDER: "RB / R1", JOY_BUTTON_BACK: "Back / Select",
	JOY_BUTTON_START: "Start / Options", JOY_BUTTON_LEFT_STICK: "L3", JOY_BUTTON_RIGHT_STICK: "R3",
	JOY_BUTTON_DPAD_UP: "Croce su", JOY_BUTTON_DPAD_DOWN: "Croce giu'", JOY_BUTTON_DPAD_LEFT: "Croce sinistra",
	JOY_BUTTON_DPAD_RIGHT: "Croce destra", JOY_BUTTON_GUIDE: "Guide",
}

static var _defaults := {}


## Fotografa i binding attuali come default di fabbrica.
static func capture_defaults() -> void:
	_defaults.clear()
	for a in ACTIONS:
		if InputMap.has_action(a):
			_defaults[a] = InputMap.action_get_events(a).map(func(e): return e.duplicate())


static func has_defaults() -> bool:
	return not _defaults.is_empty()


static func is_pad(ev: InputEvent) -> bool:
	return ev is InputEventJoypadButton or ev is InputEventJoypadMotion


## Eventi dell'azione per tastiera (pad=false) o controller (pad=true).
static func events(action: String, pad: bool) -> Array:
	if not InputMap.has_action(action):
		return []
	return InputMap.action_get_events(action).filter(func(e): return is_pad(e) == pad and (pad or e is InputEventKey or e is InputEventMouseButton))


## Sostituisce il binding principale (tastiera o controller, secondo l'evento) dell'azione.
## Lo stesso tasto viene tolto dalle altre azioni della stessa famiglia, cosi' non ci sono doppioni
## involontari. Ritorna le azioni da cui e' stato tolto.
static func rebind(action: String, ev: InputEvent) -> Array:
	var removed := []
	var clean := _normalize(ev)
	if clean == null or not InputMap.has_action(action):
		return removed
	for other in ACTIONS:
		if other == action or not InputMap.has_action(other):
			continue
		for e in InputMap.action_get_events(other):
			if same(e, clean):
				InputMap.action_erase_event(other, e)
				removed.append(other)
	var current := events(action, is_pad(clean))
	if not current.is_empty():
		InputMap.action_erase_event(action, current[0])
	for e in InputMap.action_get_events(action):
		if same(e, clean):
			InputMap.action_erase_event(action, e)
	# Il nuovo binding diventa il principale: si rimettono gli altri dopo.
	var rest := InputMap.action_get_events(action)
	InputMap.action_erase_events(action)
	InputMap.action_add_event(action, clean)
	for e in rest:
		InputMap.action_add_event(action, e)
	return removed


## True se i due eventi rappresentano lo stesso tasto/pulsante/asse.
static func same(a: InputEvent, b: InputEvent) -> bool:
	if a is InputEventKey and b is InputEventKey:
		return _key(a) == _key(b)
	if a is InputEventJoypadButton and b is InputEventJoypadButton:
		return a.button_index == b.button_index
	if a is InputEventJoypadMotion and b is InputEventJoypadMotion:
		return a.axis == b.axis and signf(a.axis_value) == signf(b.axis_value)
	return false


static func _key(e: InputEventKey) -> int:
	return e.physical_keycode if e.physical_keycode != KEY_NONE else e.keycode


## Copia pulita dell'evento (senza stato premuto, device qualunque); null se non adatto.
static func _normalize(ev: InputEvent) -> InputEvent:
	if ev is InputEventKey:
		var k := InputEventKey.new()
		var code := _key(ev)
		if code == KEY_NONE:
			return null
		k.physical_keycode = code
		k.keycode = code
		return k
	if ev is InputEventJoypadButton:
		var b := InputEventJoypadButton.new()
		b.button_index = ev.button_index
		return b
	if ev is InputEventJoypadMotion:
		if absf(ev.axis_value) < 0.5:
			return null
		var m := InputEventJoypadMotion.new()
		m.axis = ev.axis
		m.axis_value = signf(ev.axis_value)
		return m
	return null


## Riporta tutte le azioni ai binding di fabbrica.
static func reset() -> void:
	for a in _defaults:
		InputMap.action_erase_events(a)
		for e in _defaults[a]:
			InputMap.action_add_event(a, e.duplicate())


## L'azione ha binding diversi dai default per quella famiglia di dispositivi?
static func is_customized(action: String, pad: bool) -> bool:
	if not _defaults.has(action):
		return false
	var d: Array = _defaults[action].filter(func(e): return is_pad(e) == pad)
	var c := events(action, pad)
	if d.size() != c.size():
		return true
	for i in d.size():
		if not same(d[i], c[i]):
			return true
	return false


static func save_bindings() -> Error:
	var cfg := ConfigFile.new()
	for a in ACTIONS:
		if InputMap.has_action(a):
			cfg.set_value("input", a, InputMap.action_get_events(a).map(_serialize).filter(func(d): return not d.is_empty()))
	return cfg.save(path)


## Applica i binding salvati sopra ai default. True se il file c'era.
static func load_bindings() -> bool:
	var cfg := ConfigFile.new()
	if cfg.load(path) != OK:
		return false
	for a in ACTIONS:
		if not cfg.has_section_key("input", a) or not InputMap.has_action(a):
			continue
		var list = cfg.get_value("input", a, [])
		if not list is Array:
			continue
		var evs := []
		for d in list:
			var e := _deserialize(d)
			if e:
				evs.append(e)
		if evs.is_empty():
			continue
		InputMap.action_erase_events(a)
		for e in evs:
			InputMap.action_add_event(a, e)
	return true


static func delete_saved() -> void:
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(path)


static func _serialize(e: InputEvent) -> Dictionary:
	if e is InputEventKey:
		return {"t": "key", "k": _key(e)}
	if e is InputEventJoypadButton:
		return {"t": "btn", "b": e.button_index}
	if e is InputEventJoypadMotion:
		return {"t": "axis", "a": e.axis, "v": signf(e.axis_value)}
	return {}


static func _deserialize(d) -> InputEvent:
	if not d is Dictionary:
		return null
	match str(d.get("t", "")):
		"key":
			var k := InputEventKey.new()
			k.physical_keycode = int(d.get("k", 0))
			k.keycode = k.physical_keycode
			return k if k.physical_keycode != KEY_NONE else null
		"btn":
			var b := InputEventJoypadButton.new()
			b.button_index = int(d.get("b", 0))
			return b
		"axis":
			var m := InputEventJoypadMotion.new()
			m.axis = int(d.get("a", 0))
			m.axis_value = float(d.get("v", 1.0))
			return m
	return null


## Nome leggibile di un evento.
static func event_label(e: InputEvent) -> String:
	if e is InputEventKey:
		var s := OS.get_keycode_string(_key(e))
		return {"Space": "Spazio", "Escape": "Esc", "Shift": "Maiusc", "Up": "Freccia su", "Down": "Freccia giu'", "Left": "Freccia sinistra", "Right": "Freccia destra", "Enter": "Invio", "Tab": "Tab"}.get(s, s)
	if e is InputEventJoypadButton:
		return PAD_BUTTONS.get(e.button_index, "Pulsante %d" % e.button_index)
	if e is InputEventJoypadMotion:
		var names := {JOY_AXIS_LEFT_X: ["Stick sx sinistra", "Stick sx destra"], JOY_AXIS_LEFT_Y: ["Stick sx su", "Stick sx giu'"], JOY_AXIS_RIGHT_X: ["Stick dx sinistra", "Stick dx destra"], JOY_AXIS_RIGHT_Y: ["Stick dx su", "Stick dx giu'"], JOY_AXIS_TRIGGER_LEFT: ["LT / L2", "LT / L2"], JOY_AXIS_TRIGGER_RIGHT: ["RT / R2", "RT / R2"]}
		var pair: Array = names.get(e.axis, ["Asse %d-" % e.axis, "Asse %d+" % e.axis])
		return pair[0 if e.axis_value < 0 else 1]
	return "?"


## Binding principale dell'azione per la famiglia di dispositivi, come testo ("-" se nessuno).
static func label(action: String, pad: bool) -> String:
	var evs := events(action, pad)
	return "-" if evs.is_empty() else event_label(evs[0])