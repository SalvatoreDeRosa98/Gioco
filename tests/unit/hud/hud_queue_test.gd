extends SceneTree
## Coda notifiche dell'HUD: ordine, limite visibile, niente duplicati, scadenza e dissolvenza.
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(value: bool, description: String) -> void:
	if not value:
		failures += 1
		push_error(description)

func _run() -> void:
	var q1 = load("res://game/hud_queue.gd").new()
	check(q1.max_visible == 1, "Di default un solo avviso alla volta")
	for t in ["x", "y", "z"]:
		q1.push(t)
	check(q1.visible().size() == 1 and q1.visible()[0].text == "x" and q1.pending_count() == 2, "Gli altri aspettano in fila")
	q1.update(q1.life + 0.01)
	check(q1.visible().size() == 1 and q1.visible()[0].text == "y", "Scaduto il primo, sale il secondo")
	# Logica generica della coda (con piu' posti, per i test di ordine e scadenza).
	var q = load("res://game/hud_queue.gd").new()
	q.life = 2.0
	q.max_visible = 3
	q.push("a")
	q.push("b")
	q.push("c")
	q.push("d")
	q.push("")
	check(q.visible().size() == 3, "Al massimo 3 notifiche visibili")
	check(q.pending_count() == 1, "La quarta aspetta in coda")
	check(q.visible()[0].text == "a" and q.visible()[2].text == "c", "Ordine d'arrivo rispettato")
	q.push("b")
	q.push("d")
	check(q.visible().size() == 3 and q.pending_count() == 1, "Testi duplicati non si accumulano")
	check(q.visible()[0].alpha == 0.0, "Appena arrivata parte trasparente")
	q.update(1.0)
	check(is_equal_approx(q.visible()[0].alpha, 1.0), "A meta' vita e' piena")
	q.update(1.1)
	check(q.visible().size() == 1 and q.visible()[0].text == "d", "Scadute le prime, sale quella in attesa")
	check(q.pending_count() == 0, "Coda svuotata")
	q.update(5.0)
	check(q.visible().is_empty(), "Tutto scade")
	# HUD reale: tanti avvisi insieme, se ne vede uno alla volta.
	var hud = load("res://game/hud.gd").new()
	for t in ["uno", "due", "tre", "quattro"]:
		hud.toast(t)
	check(hud._toast_text == "quattro", "_toast_text tiene l'ultimo avviso")
	check(hud.notices.visible().size() == 1 and hud.notices.pending_count() == 3, "HUD: 1 avviso visibile, 3 in attesa")
	check(hud.NOTICE_STEP >= 36.0, "Passo verticale maggiore dell'altezza della lastra")
	var big: int = hud.title_size("L'ARENA DEL CAVALIERE BORBONICO", 1280.0)
	check(big < 54 and Art.title_wide().get_string_size("L'ARENA DEL CAVALIERE BORBONICO", HORIZONTAL_ALIGNMENT_LEFT, -1, big).x <= 1280.0 - 2.0 * hud.TITLE_SIDE, "Titolo lungo ridotto entro i margini")
	check(hud.title_size("ROMA", 1280.0) == 54, "Titolo corto a corpo pieno")
	check(hud._lesson_card(Vector2(1280, 720)).position.x >= hud.VITALS_RIGHT, "Lezione non sopra il pannello vita")
	hud.free()
	print("hud_queue_test: ", "OK" if failures == 0 else "%d fallimenti" % failures)
	quit(failures)