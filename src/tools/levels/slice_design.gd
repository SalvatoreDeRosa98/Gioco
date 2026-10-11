extends SceneTree
## Ridisegno della vertical slice «Le Cisterne di Gaetano» (VERTICAL-SLICE.md, sezioni 2-3).
## Genera le scene di blockout delle stanze 9, 13 e 15. Dopo la prima generazione le scene sono la fonte
## di verità: si ritoccano nell'editor. Rilanciare solo con --force (sovrascrive le modifiche fatte a mano).
## Uso (dalla cartella src):
##   Godot_v4.6-stable_win64_console.exe --headless --path . --script res://tools/levels/slice_design.gd -- [--force]
##
## Griglia: celle da 64 px allineate al pavimento; mensole a mezza cella (32 px) in verticale.
## Salto: risalita massima 200 px (tuning.json -> player.jump_height_max), mensole a +96/+128 px.

const Builder := preload("res://tools/levels/scene_builder.gd")

static func r9() -> Dictionary:
	# Cisterne Reali. Ingresso dalla Villa (sinistra), incudine subito, salita alla chiusa,
	# discesa a destra verso la caduta nelle Cisterne Sepolte. Righe: 20 + 64k, mensole 20 + 32k.
	return {
		"idx": 9, "name": "Cisterne Reali", "size": Vector2(2560, 1080), "floor": 980.0, "scene_name": "R09CisterneReali",
		"art": true, "mid_art": "res://assets/art/slice/cisterne_reali_mid.png",
		"props": [
			{"kind": "wheel", "pos": Vector2(1440, 404), "height": 170.0},
			{"kind": "gate", "pos": Vector2(2492, 980), "side": "right", "height": 250.0, "hint": "Saracinesca chiusa: gira la ruota della chiusa"},
		],
		"generated_by": "tools/levels/slice_design.gd",
		"blocks": [
			Rect2(0, 340, 448, 64),      # volta sopra la nicchia del martello
			Rect2(2176, 84, 64, 704),    # camino: parete sinistra (sospesa, si passa sotto)
			Rect2(2368, 84, 64, 704),    # camino: parete destra
		],
		"ledges": [
			Rect2(192, 852, 256, 18),    # L1  +128
			Rect2(448, 756, 256, 18),    # L2  +96
			Rect2(704, 628, 256, 18),    # L3  +128
			Rect2(960, 532, 320, 18),    # L4  +96
			Rect2(1216, 404, 320, 18),   # L5  ballatoio della chiusa +128
			Rect2(64, 596, 384, 18),     # soppalco: dal L2 (+160), porta al muro incrinato
			Rect2(1536, 532, 256, 18),   # R1  segreto (doppio salto)
			Rect2(1856, 660, 256, 18),   # R2  discesa
			Rect2(2240, 276, 128, 18),   # cima del camino (serve la presa dei guanti)
		],
		"floor_holes": [Vector2(1730, 1950)],
		"cracks": [{"id": "cistern_entry_wall", "rect": Rect2(128, 404, 64, 192), "reward": 40, "gate": false, "hits": 2}],
		"exits": [{"side": "bottom", "x": 1840.0, "width": 220.0, "target": 13, "spawn": Vector2(570, 170), "need": ""}],
		"saves": [{"pos": Vector2(260, 980), "need_clear": false}],
		"npcs": [{"id": "cesare_cisterne", "pos": Vector2(470, 980)}],
		"enemies": [
			# E2_guardia: il tipo "guardia" di elite.gd (stoccata parabile, 6 HP), lo stesso usato da Gameplay
			# in d6e2123 (origin/feat/gameplay). Terzo marcatore: VAult bot lo chiama E2_guardia.
			{"type": "vespa", "pos": Vector2(650, 690)},
			{"type": "lanterniere", "pos": Vector2(1500, 946)},
			{"type": "guardia", "pos": Vector2(1000, 946), "note": "Insegna la parata: stoccata parabile (tuning.json -> player.parry_window)."},
			{"type": "vespa", "pos": Vector2(1860, 470)},
			{"type": "statua", "pos": Vector2(2060, 946)},
		],
		"secrets": [Vector2(1680, 490), Vector2(2304, 236), Vector2(90, 560)],
		"landmarks": [
			{"index": 0, "id": "sluice", "label": "leva: chiusa (sigillo)", "pos": Vector2(1400, 404)},
			{"index": 1, "id": "cesare_incisione", "label": "incisione di Cesare (lore)", "pos": Vector2(2304, 276)},
		],
		"notes": [
			{"pos": Vector2(120, 900), "text": "Ingresso dalla Villa"},
			{"pos": Vector2(2240, 860), "text": "Camino: guanti"},
			{"pos": Vector2(1780, 900), "text": "Caduta (senso unico)"},
			{"pos": Vector2(1000, 860), "text": "Parata: guardia"},
		],
	}

static func r13() -> Dictionary:
	# Cisterne Sepolte. Si cade dall'alto; fondo diviso in due incontri da un muretto; incudine prima
	# della Tana; risalita con gli anelli (rampino); nicchia col muro incrinato (martello). Righe: 16 + 64k.
	return {
		"idx": 13, "name": "Cisterne Sepolte", "size": Vector2(1280, 2100), "floor": 2000.0, "scene_name": "R13CisterneSepolte",
		"art": true, "mid_art": "res://assets/art/slice/cisterne_sepolte_mid.png",
		"props": [{"kind": "gate", "pos": Vector2(68, 2000), "side": "left", "height": 250.0, "hint": "Sbarrato dalla Tana: prima Ratking"}],
		"generated_by": "tools/levels/slice_design.gd",
		"blocks": [
			Rect2(0, 1168, 448, 128),    # volta della nicchia (spessa: dalla mensola G2 non ci si sale sopra)
			Rect2(640, 1872, 64, 128),   # muretto che separa i due incontri (+128, si scavalca)
		],
		"ledges": [
			Rect2(448, 1712, 256, 18),   # G1: fuori portata del doppio salto da terra
			Rect2(512, 1392, 256, 18),
			Rect2(448, 1072, 256, 18),
			Rect2(512, 752, 256, 18),
			Rect2(448, 432, 256, 18),
			Rect2(64, 1520, 384, 18),    # pavimento della nicchia (da G1 +192 o scendendo da G2)
			Rect2(896, 1712, 256, 18),   # mensola del segreto, dal muretto (+160)
		],
		"spikes": [Rect2(320, 1980, 128, 20)],
		"cracks": [{"id": "cistern_wall", "rect": Rect2(192, 1296, 64, 224), "reward": 30, "gate": false, "hits": 2}],
		"rings": [Vector2(570, 1660), Vector2(670, 1320), Vector2(570, 980), Vector2(670, 640), Vector2(570, 300), Vector2(570, -25)],
		"exits": [{"side": "top", "x": 570.0, "width": 220.0, "target": 9, "spawn": Vector2(1650, 956), "need": "grapple"}],
		"saves": [{"pos": Vector2(860, 2000), "need_clear": true}],
		"enemies": [
			{"type": "statua", "pos": Vector2(560, 1966)},
			{"type": "vespa", "pos": Vector2(500, 1840)},
			{"type": "lanterniere", "pos": Vector2(820, 1966)},
			{"type": "gatto", "pos": Vector2(980, 1980)},
			{"type": "lanterniere", "pos": Vector2(1120, 1966)},
		],
		"secrets": [Vector2(1010, 1680), Vector2(110, 1480)],
		"landmarks": [
			{"index": 0, "id": "hammer_plan", "label": "disegno del martello (sigillo)", "pos": Vector2(230, 2000)},
			{"index": 1, "id": "cistern_return_0", "label": "passaggio per Piazza (dopo Ratking)", "pos": Vector2(120, 2000)},
			{"index": 2, "id": "cistern_ratking", "label": "Tana di Ratking", "pos": Vector2(1160, 2000)},
		],
		"notes": [
			{"pos": Vector2(300, 1900), "text": "Incontro A"},
			{"pos": Vector2(900, 1900), "text": "Incontro B"},
			{"pos": Vector2(200, 1200), "text": "Nicchia: martello"},
		],
	}

static func r15() -> Dictionary:
	# Tana di Ratking: arena piatta e leggibile. Due pedane basse per scavalcare la carica,
	# una centrale più alta; l'anello dipinto è solo un presagio (non agganciabile).
	return {
		"idx": 15, "name": "Tana di Ratking", "size": Vector2(1600, 1080), "floor": 980.0, "scene_name": "R15TanaRatking",
		"art": true, "mid_art": "res://assets/art/slice/tana_ratking_mid.png",
		"generated_by": "tools/levels/slice_design.gd",
		"ledges": [
			Rect2(320, 852, 256, 18),    # pedana sinistra +128
			Rect2(1024, 852, 256, 18),   # pedana destra +128
			Rect2(640, 692, 320, 18),    # pedana centrale +160 dalle laterali
		],
		"saves": [{"pos": Vector2(800, 980), "need_clear": true}],
		"enemies": [{"type": "ratking", "pos": Vector2(1100, 935)}],
		"notes": [
			{"pos": Vector2(800, 420), "text": "o anello dipinto (presagio)"},
			{"pos": Vector2(330, 940), "text": "ingaggio"},
		],
	}

func _initialize() -> void:
	var force := "--force" in OS.get_cmdline_user_args()
	var ts := Builder.art_tileset()
	for pair in [[r9(), "res://rooms/r09_cisterne_reali.tscn"], [r13(), "res://rooms/r13_cisterne_sepolte.tscn"], [r15(), "res://rooms/r15_tana_ratking.tscn"]]:
		if FileAccess.file_exists(pair[1]) and not force:
			print("slice_design: %s esiste già, saltata (usa --force)" % pair[1])
			continue
		var err := Builder.save(Builder.build(pair[0], ts), pair[1])
		print("slice_design: %s (%s)" % [pair[1], error_string(err)])
	quit(0)
