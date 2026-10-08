extends SceneTree
const Expansion := preload("res://game/expansion_data.gd")
var failures := 0
func _initialize() -> void:
	_run.call_deferred()
func check(value: bool, description: String) -> void:
	if not value:
		failures += 1
		push_error(description)
func _run() -> void:
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var w = main._world
	w.set_process(false)
	w.set_physics_process(false)
	w.save_path = "user://expansion-test.json"
	for idx in range(7, 12):
		w._go(idx, true)
		check(w.room.name != "" and w._npcs.get_child_count() > 0, "Area e NPC caricati: %d" % idx)
		check(w.room.ledges.size() >= 5, "Area esplorabile in verticale: %d" % idx)
		await process_frame
	w._go(11, true)
	w.story.set_var("father_registry", "conservato")
	check(not w._right_open(), "Registro da solo non apre più il Cortile")
	for id in ["archive_1", "archive_2", "archive_3"]:
		w.story.mark_seen(id)
	check(not w._right_open(), "Frammenti senza sigilli di quartiere non aprono il boss")
	for id in Expansion.DISTRICT_SEALS:
		w.story.mark_seen(id)
	check(w._right_open(), "Registro, frammenti e sigilli aprono il boss")
	w.story.set_var("father_registry", "bruciato")
	check(w._right_open(), "Bruciare il registro permette comunque il finale")
	w.story.seen.erase("sluice")
	w._go(9, true)
	check(not w._right_open(), "Chiusa blocca il bordo delle Cisterne")
	w.story.mark_seen("sluice")
	check(w._right_open(), "Chiusa azionata apre il Belvedere")
	w._go(8, true)
	check(not w._right_open(), "Capitano sorveglia l'uscita della Caserma")
	w.story.mark_seen("captain_defeated")
	check(w._right_open(), "Capitano sconfitto apre percorso alternativo")
	for id in Expansion.DISTRICT_SEALS: w.story.mark_seen(id)
	w._save_at(Vector2(110, 980))
	w.story.seen.clear()
	w._restore_save()
	check(w.story.times_seen("sluice") > 0 and Expansion.archive_ready(w.story) and Expansion.all_seals_ready(w.story), "Meccanismi e frammenti persistono nel salvataggio")
	DirAccess.remove_absolute(w.save_path)
	main.queue_free()
	await process_frame
	print("EXPANSION TEST: %d failure(s)" % failures)
	quit(1 if failures else 0)
