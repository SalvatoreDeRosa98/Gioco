extends SceneTree
## Test di Story (stato narrativo e scelta dei dialoghi) e dei dati in data/dialogues.json.
## Il progetto non ha ancora gdUnit4: questo è un piccolo esecutore autonomo con funzioni test_*.
## Uso: godot --headless --path src -s <percorso assoluto di questo file>
## Esce con codice 0 se tutto passa, 1 altrimenti.

const MAX_LINE := 120
const SPECIAL_KEYS := ["cleared", "seen", "unseen"]

var _failures := 0
var _current := ""


func _initialize() -> void:
	var names: Array = []
	for m in get_method_list():
		if str(m["name"]).begins_with("test_"):
			names.append(str(m["name"]))
	names.sort()
	for n in names:
		_current = n
		var before := _failures
		_reset_data()
		call(n)
		print(("PASS  " if _failures == before else "FAIL  ") + n)
	_reset_data()
	print("%d test, %d errori" % [names.size(), _failures])
	quit(1 if _failures > 0 else 0)


func _check(cond: bool, what: String) -> void:
	if not cond:
		_failures += 1
		printerr("  [%s] %s" % [_current, what])


## Dati finti per i test della logica: non dipendono dai testi veri.
func _fixture() -> Dictionary:
	return {
		"settings": {},
		"characters": {"anna": {"name": "Anna"}},
		"npcs": {
			"anna": {"character": "anna", "dialogue": [
				{"id": "primo", "once": true, "lines": [{"who": "anna", "text": "Ciao."}]},
				{"id": "dopo", "once": true, "when": {"cleared": true, "tonino_memory": ""}, "lines": [{"text": "Gesto."}]},
				{"id": "ricorda", "when": {"tonino_memory": "restituito"}, "lines": [{"text": "Ricorda."}]},
				{"id": "giro", "cycle": [[{"text": "A"}], [{"text": "B"}]]},
			]},
		},
	}


func _reset_data() -> void:
	Story._data = {}


func _use_fixture() -> void:
	Story._data = _fixture()


# ---------------------------------------------------------------- Logica

func test_new_story_all_vars_undecided() -> void:
	var s := Story.new()
	for k in Story.VARS:
		_check(s.get_var(k) == "", "%s dovrebbe partire vuota" % k)
	_check(s.vars.size() == 6, "le variabili della bibbia sono sei")


func test_set_var_rejects_values_outside_bible() -> void:
	var s := Story.new()
	s.set_var("taddeo_trust", "forse")
	_check(s.get_var("taddeo_trust") == "", "un valore inventato non deve passare")
	s.set_var("taddeo_trust", "perdonato")
	_check(s.get_var("taddeo_trust") == "perdonato", "un valore della bibbia deve passare")


func test_check_value_patterns_match() -> void:
	var s := Story.new()
	_check(s.check({"agnese_memory": ""}, {}), "'' vale per una variabile non decisa")
	_check(not s.check({"agnese_memory": "*"}, {}), "'*' non vale prima della decisione")
	_check(s.check({"agnese_memory": "!sopita"}, {}), "'!x' vale se diversa")
	s.apply({"agnese_memory": "sopita"})
	_check(s.check({"agnese_memory": "*"}, {}), "'*' vale dopo la decisione")
	_check(not s.check({"agnese_memory": "!sopita"}, {}), "'!x' non vale se uguale")
	_check(s.check({"agnese_memory": "sopita"}, {}), "valore esatto")


func test_check_cleared_and_seen() -> void:
	var s := Story.new()
	_check(s.check({"cleared": true}, {"cleared": true}), "stanza liberata")
	_check(not s.check({"cleared": true}, {"cleared": false}), "stanza non liberata")
	_check(s.check({"unseen": "x"}, {}), "unseen prima")
	s.mark_seen("x")
	_check(s.check({"seen": "x"}, {}), "seen dopo")
	_check(not s.check({"unseen": ["x", "y"]}, {}), "unseen con elenco")


func test_pick_follows_story_progression() -> void:
	_use_fixture()
	var s := Story.new()
	var ctx := {"cleared": false}
	var e := s.pick("anna", ctx)
	_check(str(e.get("id")) == "primo", "il primo incontro viene prima di tutto")
	_check(s.has_new("anna", ctx), "un incontro 'once' non ascoltato è una novità")
	s.begin(e)
	e = s.pick("anna", ctx)
	_check(str(e.get("id")) == "giro", "senza stanza liberata resta il dialogo ripetibile")
	_check(not s.has_new("anna", ctx), "un dialogo ripetibile non è una novità")
	ctx["cleared"] = true
	e = s.pick("anna", ctx)
	_check(str(e.get("id")) == "dopo", "a stanza liberata arriva l'incontro nuovo")
	s.begin(e)
	s.apply({"tonino_memory": "restituito"})
	e = s.pick("anna", ctx)
	_check(str(e.get("id")) == "ricorda", "la scelta cambia il dialogo")


func test_begin_cycle_rotates_variants() -> void:
	_use_fixture()
	var s := Story.new()
	var entry: Dictionary = Story.npc("anna")["dialogue"][3]
	var first: Array = s.begin(entry)
	var second: Array = s.begin(entry)
	var third: Array = s.begin(entry)
	_check(str(first[0]["text"]) == "A" and str(second[0]["text"]) == "B" and str(third[0]["text"]) == "A", "le varianti ruotano")
	_check(s.times_seen("giro") == 3, "ogni ascolto viene contato")


func test_begin_returns_copy_not_data() -> void:
	_use_fixture()
	var s := Story.new()
	var entry: Dictionary = Story.npc("anna")["dialogue"][0]
	var lines: Array = s.begin(entry)
	lines.pop_front()
	_check((entry["lines"] as Array).size() == 1, "consumare le battute non deve toccare i dati")


# ---------------------------------------------------------------- Dati veri (dialogues.json)

func test_dialogues_json_is_consistent() -> void:
	var d := Story.data()
	_check(d.has("npcs") and d.has("characters") and d.has("settings"), "sezioni principali")
	var chars: Dictionary = d.get("characters", {})
	var ids := {}
	for key in d.get("npcs", {}):
		for e in (d["npcs"][key] as Dictionary).get("dialogue", []):
			ids[str(e.get("id", ""))] = true
		var bark: Dictionary = (d["npcs"][key] as Dictionary).get("bark", {})
		if not bark.is_empty():
			ids[str(bark.get("id", ""))] = true
	for c in chars:
		var img := str((chars[c] as Dictionary).get("image", ""))
		_check(img == "" or ResourceLoader.exists(img), "immagine mancante per %s: %s" % [c, img])
	for key in d.get("npcs", {}):
		var n: Dictionary = d["npcs"][key]
		_check(chars.has(str(n.get("character", ""))), "%s: personaggio sconosciuto" % key)
		_check_cond(n.get("when", {}), ids, key)
		var seen_here := {}
		for e in n.get("dialogue", []):
			var id := str(e.get("id", ""))
			_check(id != "" and not seen_here.has(id), "%s: id mancante o doppio '%s'" % [key, id])
			seen_here[id] = true
			_check_cond(e.get("when", {}), ids, id)
			var groups: Array = e.get("cycle", [e.get("lines", [])])
			for g in groups:
				_check_lines(g, chars, ids, id)
			if e.has("choice"):
				var opts: Array = e["choice"].get("options", [])
				_check(opts.size() == 2, "%s: una scelta ha due risposte" % id)
				for o in opts:
					_check(str(o.get("label", "")) != "", "%s: risposta senza testo" % id)
					for v in (o.get("set", {}) as Dictionary):
						_check(Story.VARS.has(v) and (Story.VARS[v] as Array).has(str(o["set"][v])), "%s: imposta un valore fuori dalla bibbia" % id)
					_check_lines(o.get("lines", []), chars, ids, id)
		var bark: Dictionary = n.get("bark", {})
		if not bark.is_empty():
			_check_lines(bark.get("lines", []), chars, ids, key)


func _check_lines(lines: Array, chars: Dictionary, ids: Dictionary, where: String) -> void:
	_check(not lines.is_empty(), "%s: nessuna battuta" % where)
	for l in lines:
		var t := str(l.get("text", ""))
		_check(t != "", "%s: battuta vuota" % where)
		_check(t.length() <= MAX_LINE, "%s: battuta oltre %d caratteri (%d): %s" % [where, MAX_LINE, t.length(), t])
		var who := str(l.get("who", ""))
		_check(who == "" or chars.has(who), "%s: chi parla? '%s'" % [where, who])
		var item := str(l.get("item", ""))
		_check(item == "" or ResourceLoader.exists("res://assets/art/items/%s.png" % item), "%s: oggetto mancante '%s'" % [where, item])
		_check_cond(l.get("if", {}), ids, where)


func _check_cond(cond: Dictionary, ids: Dictionary, where: String) -> void:
	for k in cond:
		var v = cond[k]
		if SPECIAL_KEYS.has(k):
			if k != "cleared":
				for id in (v if v is Array else [v]):
					_check(ids.has(str(id)), "%s: rimanda a un dialogo che non esiste '%s'" % [where, id])
			continue
		_check(Story.VARS.has(k), "%s: variabile sconosciuta '%s'" % [where, k])
		var want := str(v).trim_prefix("!")
		_check(want == "" or want == "*" or (Story.VARS.get(k, []) as Array).has(want), "%s: valore sconosciuto %s=%s" % [where, k, v])
