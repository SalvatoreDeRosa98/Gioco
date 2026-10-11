extends SceneTree
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(value: bool, description: String) -> void:
	if not value:
		failures += 1
		push_error(description)
## SaveSlots: 3 slot, migrazione del salvataggio singolo nello slot 1, riepilogo e formati.
func _run() -> void:
	SaveSlots.dir = "user://test-slots-unit/"
	DirAccess.make_dir_recursive_absolute(SaveSlots.dir)
	for s in range(1, 4):
		SaveSlots.delete(s)
	var legacy := "user://test-slots-unit/legacy.json"
	check(SaveSlots.COUNT >= 3, "Almeno 3 slot")
	check(SaveSlots.path(1) != SaveSlots.path(2) and SaveSlots.path(2) != SaveSlots.path(3), "Percorsi distinti")
	check(not SaveSlots.any_exists() and SaveSlots.latest() == 0, "Nessuno slot")
	var state := {"version": 1, "checkpoint": {"room": 1, "x": 500, "y": 900}, "coins": 3}
	var f := FileAccess.open(legacy, FileAccess.WRITE)
	f.store_string(JSON.stringify(state))
	f.close()
	check(SaveSlots.migrate_legacy(legacy), "Migra il vecchio salvataggio")
	check(SaveSlots.exists(1) and FileAccess.file_exists(legacy), "Slot 1 creato, originale intatto")
	check(not SaveSlots.migrate_legacy(legacy), "Non sovrascrive uno slot 1 esistente")
	var i := SaveSlots.info(1)
	check(i.valid and i.area == SaveSlots.area_name(1) and i.area != "", "Area ricavata dal checkpoint: " + str(i.area))
	check(int(i.saved_at) > 0, "Data dal file")
	var st2 := state.duplicate(true)
	st2["play_time"] = 3725.0
	st2["area"] = "Cisterne Reali"
	st2["saved_at"] = int(Time.get_unix_time_from_system()) + 100
	f = FileAccess.open(SaveSlots.path(3), FileAccess.WRITE)
	f.store_string(JSON.stringify(st2))
	f.close()
	var i3 := SaveSlots.info(3)
	check(i3.area == "Cisterne Reali" and is_equal_approx(i3.play_time, 3725.0), "Info slot 3")
	check(SaveSlots.latest() == 3, "Ultimo slot usato")
	check(SaveSlots.format_time(3725.0) == "1 h 02 min", "Formato tempo: " + SaveSlots.format_time(3725.0))
	check(SaveSlots.describe(2).contains("vuoto"), "Slot vuoto descritto")
	check(SaveSlots.describe(3).contains("Cisterne Reali") and SaveSlots.describe(3).contains("1 h 02 min"), "Descrizione slot pieno")
	f = FileAccess.open(SaveSlots.path(2), FileAccess.WRITE)
	f.store_string("{rotto")
	f.close()
	check(not SaveSlots.info(2).valid and SaveSlots.describe(2).contains("danneggiato"), "Slot danneggiato riconosciuto")
	# Il mondo salva nello slot corrente con area, tempo e data.
	SaveSlots.current = 2
	var w = load("res://game/world.gd").new()
	check(w.save_path == SaveSlots.path(2), "Il mondo usa lo slot corrente")
	w.free()
	for s in range(1, 4):
		SaveSlots.delete(s)
	DirAccess.remove_absolute(legacy)
	SaveSlots.current = 1
	print("save_slots_test: ", "OK" if failures == 0 else "%d fallimenti" % failures)
	quit(failures)