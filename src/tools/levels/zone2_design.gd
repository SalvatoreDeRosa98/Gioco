extends SceneTree
## Zona 2 «Campanile e Orologi» (ZONA-2.md): blockout delle stanze 12 (Campanile delle Voci) e
## 14 (Galleria degli Orologi). Dopo la prima generazione le scene sono la fonte di verità: si ritoccano
## nell'editor. Rilanciare solo con --force (sovrascrive le modifiche fatte a mano).
## Uso (dalla cartella src):
##   Godot_v4.6-stable_win64_console.exe --headless --path . --script res://tools/levels/zone2_design.gd -- [--force]
##
## Griglia 64 px allineata al pavimento, mensole a mezza cella. Salto: risalita massima 200 px
## (tuning.json -> player.jump_height_max); rampino: anelli entro 420 px (player.grapple_range).
## Entrate e uscite restano compatibili con i JSON delle stanze vicine:
##   3 -> 12 arriva a (530, 2156) su una mensola sopra il varco; 11 -> 14 arriva a (3310, 930) sul pavimento.

const Builder := preload("res://tools/levels/scene_builder.gd")

static func r12() -> Dictionary:
	# Campanile delle Voci: torre a zig-zag (sinistra 320-576, destra 576-832), salti da +128.
	# Ingresso dal basso (Belvedere, rampino); uscita in alto verso la Galleria coi guanti (wall_grip).
	# Due segreti: nicchia murata a sinistra (martello) e nido in alto a destra (rampino o guanti).
	var left := 320.0
	var right := 576.0
	var lys := [1948.0, 1692.0, 1436.0, 1180.0, 924.0, 668.0]
	var rys := [2076.0, 1820.0, 1564.0, 1308.0, 1052.0, 796.0, 540.0]
	var ledges: Array = [Rect2(384, 2204, 192, 18)]   # L0: sopra il varco, qui si arriva dal Belvedere
	for y in lys:
		ledges.append(Rect2(left, y, 256, 18))
	for y in rys:
		ledges.append(Rect2(right, y, 256, 18))
	ledges.append(Rect2(576, 412, 192, 18))           # pianerottolo delle campane, fondo del camino d'uscita
	ledges.append(Rect2(1088, 284, 192, 18))          # nido segreto (anello o guanti)
	# Percorso a salti usato dai test fisici (centro della mensola, y del piano).
	var route: Array = [Vector2(480, 2204)]
	for i in 13:
		route.append(Vector2(704, rys[i / 2]) if i % 2 == 0 else Vector2(448, lys[i / 2]))
	route.append(Vector2(672, 412))
	return {
		"idx": 12, "name": "Campanile delle Voci", "size": Vector2(1280, 2400), "floor": 2300.0, "scene_name": "R12Campanile",
		"generated_by": "tools/levels/zone2_design.gd",
		"mid_art": "res://assets/art/areas/espansione/campanile.png", "mid_opts": {"dim": 0.5},
		"blocks": [
			Rect2(0, 1148, 320, 64),     # pavimento della nicchia murata
			Rect2(0, 892, 320, 64),      # volta della nicchia
			Rect2(512, 60, 64, 256),     # camino dell'uscita: parete sinistra
			Rect2(768, 60, 64, 256),     # camino dell'uscita: parete destra
		],
		# Coi guanti si sale solo il camino dell'uscita: dal pianerottolo (412) col salto non si esce.
		"climb": [Rect2(512, 60, 64, 256), Rect2(768, 60, 64, 256)],
		"ledges": ledges,
		"floor_holes": [Vector2(320, 640)],
		"cracks": [{"id": "bell_niche_wall", "rect": Rect2(256, 956, 64, 192), "reward": 30, "gate": false}],
		"rings": [Vector2(1080, 420)],
		"exits": [
			{"side": "bottom", "x": 530.0, "width": 220.0, "target": 3, "spawn": Vector2(1510, 170), "need": ""},
			{"side": "top", "x": 630.0, "width": 220.0, "target": 14, "spawn": Vector2(420, 826), "need": "wall_grip"},
		],
		"saves": [{"pos": Vector2(1100, 2300), "need_clear": false}],
		"enemies": [
			{"type": "cavaliere", "pos": Vector2(1000, 2266)},
			{"type": "gatto", "pos": Vector2(448, 1928)},
			{"type": "vespa", "pos": Vector2(1000, 1700)},
			{"type": "spettro", "pos": Vector2(600, 1350)},
			{"type": "statua", "pos": Vector2(448, 890)},
			{"type": "vespa", "pos": Vector2(980, 700)},
		],
		"secrets": [Vector2(128, 1120), Vector2(1184, 256)],
		"landmarks": [{"index": 0, "id": "bells", "label": "campane (sigillo)", "pos": Vector2(700, 412)}],
		"route": route,
		"notes": [
			{"pos": Vector2(330, 2260), "text": "Dal Belvedere (rampino)"},
			{"pos": Vector2(40, 1110), "text": "Nicchia: martello"},
			{"pos": Vector2(1000, 230), "text": "Nido: anello"},
			{"pos": Vector2(560, 120), "text": "Uscita: guanti"},
		],
	}

static func r14() -> Dictionary:
	# Galleria degli Orologi: tre ambienti. Ovest (arrivo dal Campanile, anello verso il segreto),
	# camera della memoria chiusa tra due muri incrinati (martello, 7° sigillo), est verso gli Archivi.
	# I muri mantengono id e rettangoli dei JSON (salvataggi e hammer_gate_test).
	return {
		"idx": 14, "name": "Galleria degli Orologi", "size": Vector2(3520, 1080), "floor": 980.0, "scene_name": "R14GalleriaOrologi",
		"generated_by": "tools/levels/zone2_design.gd",
		"mid_art": "res://assets/art/areas/espansione/galleria_orologi.png",
		"mid_opts": {"floor_v": 0.85, "scale": 1.4, "dim": 0.7},
		"blocks": [Rect2(1600, 916, 256, 64)],   # gradino sotto il muro est
		"ledges": [
			Rect2(384, 852, 128, 18),     # sopra il varco: arrivo dal Campanile
			Rect2(704, 852, 192, 18),
			Rect2(960, 724, 256, 18),
			Rect2(896, 468, 256, 18),     # segreto ovest (anello)
			Rect2(1344, 852, 128, 18),    # camera della memoria
			Rect2(1408, 724, 192, 18),
			Rect2(1920, 788, 256, 18),    # sopra le punte
			Rect2(2304, 724, 256, 18),
			Rect2(2752, 468, 256, 18),    # segreto est (anello)
			Rect2(3136, 788, 256, 18),
		],
		"floor_holes": [Vector2(256, 640)],
		"spikes": [Rect2(1920, 960, 256, 20)],
		"cracks": [
			{"id": "clock_wall_west", "rect": Rect2(1260, -400, 60, 1380), "reward": 10, "gate": true},
			{"id": "clock_wall_east", "rect": Rect2(1660, -400, 60, 1270), "reward": 10, "gate": true},
		],
		"rings": [Vector2(1024, 520), Vector2(2640, 560)],
		"exits": [{"side": "bottom", "x": 420.0, "width": 220.0, "target": 12, "spawn": Vector2(672, 380), "need": ""}],
		"saves": [{"pos": Vector2(3000, 980), "need_clear": false}],
		"enemies": [
			{"type": "guardia", "pos": Vector2(800, 946)},
			{"type": "lanterniere", "pos": Vector2(1100, 946)},
			{"type": "vespa", "pos": Vector2(2100, 620)},
			{"type": "duellante", "pos": Vector2(2450, 946)},
			{"type": "guardia", "pos": Vector2(2700, 946)},
			{"type": "cavaliere", "pos": Vector2(2850, 946)},
			{"type": "gatto", "pos": Vector2(3200, 960)},
		],
		"secrets": [Vector2(1024, 440), Vector2(2880, 440)],
		"landmarks": [{"index": 0, "id": "clock_memory", "label": "dedica dell'orologiaio (sigillo)", "pos": Vector2(1450, 724)}],
		"notes": [
			{"pos": Vector2(330, 900), "text": "Dal Campanile (guanti)"},
			{"pos": Vector2(1330, 600), "text": "Memoria: martello"},
			{"pos": Vector2(3300, 900), "text": "Verso gli Archivi"},
		],
	}

func _initialize() -> void:
	var force := "--force" in OS.get_cmdline_user_args()
	var ts := Builder.tileset()
	for pair in [[r12(), "res://rooms/r12_campanile.tscn"], [r14(), "res://rooms/r14_galleria_orologi.tscn"]]:
		if FileAccess.file_exists(pair[1]) and not force:
			print("zone2_design: %s esiste già, saltata (usa --force)" % pair[1])
			continue
		var err := Builder.save(Builder.build(pair[0], ts), pair[1])
		print("zone2_design: %s (%s)" % [pair[1], error_string(err)])
	quit(0)
