class_name Story
extends RefCounted
## Stato narrativo della partita: le sei variabili della bibbia (design/narrative/ferruccio-bibbia.md,
## §XIX), i dialoghi già ascoltati e la scelta del dialogo giusto per ogni personaggio.
## Vive nel mondo: sopravvive alle cadute e alle ripartenze della stanza, sparisce tornando al menu.
## I testi e le condizioni stanno in data/dialogues.json; qui c'è solo la logica che li interpreta.

const DATA_PATH := "res://data/dialogues.json"

## Le sei decisioni binarie della campagna e i loro due valori. "" = non ancora decisa.
const VARS := {
	"tonino_memory": ["restituito", "negato"],
	"taddeo_trust": ["perdonato", "accusato"],
	"father_registry": ["conservato", "bruciato"],
	"agnese_memory": ["risvegliata", "sopita"],
	"gregorio_mercy": ["dialogo", "attacco"],
	"violante_fate": ["uccisa", "risparmiata"],
}

static var _data: Dictionary = {}

## Variabile -> valore scelto ("" finché il giocatore non decide).
var vars: Dictionary = {}
## Id di dialogo o di battuta di passaggio -> quante volte è stato ascoltato.
var seen: Dictionary = {}


func _init() -> void:
	for k in VARS:
		vars[k] = ""


# ---------------------------------------------------------------- Dati

## Contenuto di data/dialogues.json, letto una volta sola.
static func data() -> Dictionary:
	if _data.is_empty():
		var file := FileAccess.open(DATA_PATH, FileAccess.READ)
		if file == null:
			push_error("data/dialogues.json mancante: nessun dialogo")
			_data = {"settings": {}, "characters": {}, "npcs": {}}
		else:
			var parsed = JSON.parse_string(file.get_as_text())
			_data = parsed if parsed is Dictionary else {"settings": {}, "characters": {}, "npcs": {}}
	return _data


## Valori di presentazione e ritmo (raggi, velocità del testo, respiro).
static func settings() -> Dictionary:
	return data().get("settings", {})


## Comportamento e dialoghi di un personaggio collocato nel mondo (chiave di "npcs").
static func npc(key: String) -> Dictionary:
	return data().get("npcs", {}).get(key, {})


## Aspetto e nome di un personaggio (chiave di "characters").
static func character(id: String) -> Dictionary:
	return data().get("characters", {}).get(id, {})


## Nome da mostrare nel riquadro per chi parla; "" per i gesti muti di Ferruccio.
static func speaker_name(who: String) -> String:
	if who == "":
		return ""
	return str(character(who).get("name", who.capitalize()))


# ---------------------------------------------------------------- Variabili

func get_var(name: String) -> String:
	return str(vars.get(name, ""))


## Registra una decisione. Valori fuori dalla bibbia vengono rifiutati (errore nei dati).
func set_var(name: String, value: String) -> void:
	if not VARS.has(name) or not (VARS[name] as Array).has(value):
		push_warning("Story: valore non previsto %s = %s" % [name, value])
		return
	vars[name] = value


## Applica le variabili impostate da una risposta ({"taddeo_trust": "perdonato"}).
func apply(changes: Dictionary) -> void:
	for k in changes:
		set_var(str(k), str(changes[k]))


func mark_seen(id: String) -> void:
	seen[id] = times_seen(id) + 1


func times_seen(id: String) -> int:
	return int(seen.get(id, 0))


# ---------------------------------------------------------------- Condizioni

## Vero se tutte le condizioni valgono. Chiavi: una variabile della bibbia (valore esatto,
## "" = non decisa, "*" = decisa, "!x" = diversa da x), "cleared" (stanza liberata, bool),
## "seen" / "unseen" (id di dialogo o elenco di id), "any" (elenco di condizioni: ne basta una).
## ctx porta lo stato della stanza.
func check(cond: Dictionary, ctx: Dictionary) -> bool:
	for k in cond:
		var want = cond[k]
		match str(k):
			"cleared":
				if bool(ctx.get("cleared", false)) != bool(want):
					return false
			"seen":
				for id in _as_list(want):
					if times_seen(id) == 0:
						return false
			"unseen":
				for id in _as_list(want):
					if times_seen(id) > 0:
						return false
			"any":
				# Almeno uno dei gruppi di condizioni deve valere (es. "ha una prova": registro o Taddeo).
				var ok := false
				for sub in (want as Array):
					if check(sub, ctx):
						ok = true
						break
				if not ok:
					return false
			_:
				if not match_value(get_var(str(k)), str(want)):
					return false
	return true


## Confronto di un valore con la condizione: "*" qualunque decisione, "!x" tutto tranne x.
static func match_value(have: String, want: String) -> bool:
	if want == "*":
		return have != ""
	if want.begins_with("!"):
		return have != want.substr(1)
	return have == want


static func _as_list(v) -> Array:
	return v if v is Array else [str(v)]


# ---------------------------------------------------------------- Scelta del dialogo

## Il primo dialogo del personaggio che vale adesso: quelli "once" già ascoltati si saltano.
## Dizionario vuoto se non ha niente da dire.
func pick(key: String, ctx: Dictionary) -> Dictionary:
	for e in npc(key).get("dialogue", []):
		var entry: Dictionary = e
		if bool(entry.get("once", false)) and times_seen(str(entry["id"])) > 0:
			continue
		if check(entry.get("when", {}), ctx):
			return entry
	return {}


## Vero se il personaggio ha un incontro nuovo (un dialogo "once" non ancora ascoltato) disponibile.
func has_new(key: String, ctx: Dictionary) -> bool:
	var entry := pick(key, ctx)
	return not entry.is_empty() and bool(entry.get("once", false))


## Avvia un dialogo: restituisce le battute da recitare (per i dialoghi "cycle" una delle varianti,
## a rotazione) e lo segna come ascoltato.
func begin(entry: Dictionary) -> Array:
	var id := str(entry.get("id", ""))
	var lines: Array = entry.get("lines", [])
	if entry.has("cycle"):
		var variants: Array = entry["cycle"]
		if not variants.is_empty():
			lines = variants[times_seen(id) % variants.size()]
	mark_seen(id)
	return lines.duplicate()
