extends SceneTree
## Icone UI: tutte definitive nel manifest, file presenti con la dimensione dichiarata
## (abilita' 96x96, mappa 48x48), trasparenza ai bordi; mappa e fucina usano le icone giuste.
var failures := 0

func check(v: bool, d: String) -> void:
	if not v:
		failures += 1
		push_error(d)

func _initialize() -> void:
	var dir := "res://assets/art/ui/segnaposto/"
	var m: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(dir + "manifest.json"))
	check(not bool(m.get("placeholder", true)), "Manifest: nessuna icona segnaposto")
	for n in ["abilita_guanti", "abilita_rampino", "abilita_martello", "mappa_crepa", "mappa_anello", "mappa_incudine", "mappa_saracinesca"]:
		check(m.icons.has(n), n + " nel manifest")
		var e: Dictionary = m.icons.get(n, {})
		check(not bool(e.get("placeholder", true)) and str(e.get("license", "")) != "" and str(e.get("generator", "")) != "", n + ": definitiva, con licenza e generatore")
		var tex: Texture2D = load(dir + n + ".png")
		var want := 96 if n.begins_with("abilita") else 48
		check(tex != null and tex.get_width() == want and tex.get_height() == want, "%s: %dx%d" % [n, want, want])
		if tex:
			var img := tex.get_image()
			check(img.get_pixel(0, 0).a < 0.1 and img.get_pixel(want / 2, want / 2).a > 0.9, n + ": medaglione con bordi trasparenti")
	var wm = load("res://game/world_map.gd")
	check(wm.SKILL_ICONS.wall_grip.resource_path.ends_with("abilita_guanti.png"), "Carta: Guanti col medaglione")
	for k in wm.MAP_ICONS:
		check(wm.MAP_ICONS[k].resource_path.begins_with(dir + "mappa_"), "Carta: icona %s dalla serie definitiva" % k)
	print("icons_test: ", "OK" if failures == 0 else "%d fallimenti" % failures)
	quit(failures)