class_name SaveSlots
extends RefCounted
## Slot di salvataggio: percorsi, migrazione del vecchio salvataggio singolo e riepilogo
## (area, tempo di gioco, data) mostrato nel menu.

const COUNT := 3
## Il salvataggio unico delle versioni precedenti.
const LEGACY_PATH := "user://ferruccio-save.json"
## Cartella degli slot (i test la spostano altrove).
static var dir := "user://"
## Slot della partita in corso (1..COUNT).
static var current := 1


static func path(slot: int) -> String:
	return dir.path_join("ferruccio-slot-%d.json" % clampi(slot, 1, COUNT))


static func exists(slot: int) -> bool:
	return FileAccess.file_exists(path(slot))


static func any_exists() -> bool:
	for s in range(1, COUNT + 1):
		if exists(s):
			return true
	return false


## Slot usato piu' di recente (0 se non ce n'e' nessuno).
static func latest() -> int:
	var best := 0
	var best_t := -1
	for s in range(1, COUNT + 1):
		var i := info(s)
		if i.exists and int(i.saved_at) > best_t:
			best_t = int(i.saved_at)
			best = s
	return best


## Copia il vecchio salvataggio singolo nello slot 1 se questo e' vuoto. Il file originale
## resta dov'e' (nessuna perdita se si torna a una versione precedente). True se ha migrato.
static func migrate_legacy(legacy: String = LEGACY_PATH) -> bool:
	if not FileAccess.file_exists(legacy) or exists(1):
		return false
	DirAccess.make_dir_recursive_absolute(dir)
	var text := FileAccess.get_file_as_string(legacy)
	var parsed = JSON.parse_string(text)
	if not parsed is Dictionary:
		return false
	if not parsed.has("saved_at"):
		parsed["saved_at"] = int(FileAccess.get_modified_time(legacy))
	var f := FileAccess.open(path(1), FileAccess.WRITE)
	if f == null:
		return false
	f.store_string(JSON.stringify(parsed))
	f.close()
	return true


static func delete(slot: int) -> void:
	if exists(slot):
		DirAccess.remove_absolute(path(slot))


## Riepilogo dello slot: {exists, area, play_time (s), saved_at (unix), valid}.
static func info(slot: int) -> Dictionary:
	var out := {"slot": slot, "exists": false, "valid": false, "area": "", "play_time": 0.0, "saved_at": 0}
	if not exists(slot):
		return out
	out.exists = true
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path(slot)))
	if not parsed is Dictionary:
		return out
	out.valid = true
	out.play_time = float(parsed.get("play_time", 0.0))
	out.saved_at = int(parsed.get("saved_at", FileAccess.get_modified_time(path(slot))))
	var area := str(parsed.get("area", ""))
	if area == "":
		var cp = parsed.get("checkpoint", {})
		if cp is Dictionary and cp.has("room"):
			area = area_name(int(cp.room))
	out.area = area
	return out


## Nome della stanza per il riepilogo.
static func area_name(room: int) -> String:
	if room < 0 or room >= Room.COUNT:
		return "Sconosciuta"
	return str(Room.build(room).get("name", "Stanza %d" % room))


static func format_time(seconds: float) -> String:
	var m := int(seconds) / 60
	return "%d h %02d min" % [m / 60, m % 60]


static func format_date(unix: int) -> String:
	if unix <= 0:
		return "-"
	var d := Time.get_datetime_dict_from_unix_time(unix + int(Time.get_time_zone_from_system().bias) * 60)
	return "%02d/%02d/%d %02d:%02d" % [d.day, d.month, d.year, d.hour, d.minute]


## Riga di testo per il pulsante dello slot.
static func describe(slot: int) -> String:
	var i := info(slot)
	if not i.exists:
		return "Slot %d  \u00b7  vuoto" % slot
	if not i.valid:
		return "Slot %d  \u00b7  salvataggio danneggiato" % slot
	return "Slot %d  \u00b7  %s  \u00b7  %s  \u00b7  %s" % [slot, i.area, format_time(i.play_time), format_date(i.saved_at)]