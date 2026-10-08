class_name Room
extends RefCounted
## Layout delle stanze: dimensioni, pavimento, blocchi solidi, mensole attraversabili dal basso,
## nemici e decorazioni. I dati sono identici su tutti i PC.

const MAIN_COUNT := 5
const SECRET_ROOM := 5
const EPILOGUE_ROOM := 6
const COUNT := 15
const BOSS_ROOM := 4
const ARCHIVES_ROOM := 11
const Expansion := preload("res://game/expansion_data.gd")
## Altezza dei portali d'uscita, appoggiati al pavimento.
const DOOR_H := 220.0
## Spessore visibile dei pilastri ai lati della stanza.
const EDGE := 36.0
## Ingrandimento della camera di gioco: personaggi più grandi, mondo più raccolto.
const CAMERA_ZOOM := 1.25

const ROOMS := [
	{
		"name": "Piazza Dante",
		"subtitle": "Il cuore della città",
		"theme": "piazza",
		"size": Vector2(2560, 1080),
		"floor": 980.0,
		"blocks": [Rect2(1000, 900, 560, 80), Rect2(1100, 840, 360, 60)],
		"ledges": [Rect2(320, 800, 220, 18), Rect2(640, 690, 200, 18), Rect2(1170, 640, 220, 18), Rect2(1700, 720, 220, 18), Rect2(2000, 820, 240, 18)],
		# Personaggi (punto dei piedi): chiavi di "npcs" in data/dialogues.json.
		"npcs": [
			{"id": "tonino", "pos": Vector2(430, 980)},
			{"id": "assunta", "pos": Vector2(905, 980)},
		],
		"enemies": [
			{"type": "gatto", "pos": Vector2(700, 960)},
			{"type": "guardia", "pos": Vector2(1450, 960)},
			{"type": "gatto", "pos": Vector2(1850, 960)},
			{"type": "vespa", "pos": Vector2(2150, 600)},
		],
		"decor": [
			{"kind": "lamp", "pos": Vector2(220, 980)},
			{"kind": "lamp", "pos": Vector2(880, 980)},
			{"kind": "statue", "pos": Vector2(1280, 840)},
			{"kind": "lamp", "pos": Vector2(1680, 980)},
			{"kind": "lamp", "pos": Vector2(2400, 980)},
		],
	},
	{
		"name": "Corso Trieste",
		"subtitle": "Sotto i portici, sotto la pioggia",
		"theme": "strada",
		"size": Vector2(2560, 1080),
		"floor": 980.0,
		"blocks": [Rect2(760, 890, 240, 90), Rect2(1700, 870, 300, 110)],
		"ledges": [Rect2(260, 780, 200, 18), Rect2(520, 660, 180, 18), Rect2(860, 560, 220, 18), Rect2(1260, 700, 200, 18), Rect2(1500, 590, 180, 18), Rect2(2000, 740, 220, 18), Rect2(2240, 620, 200, 18)],
		"npcs": [
			{"id": "guardia_corso", "pos": Vector2(620, 980)},
			{"id": "taddeo_corso", "pos": Vector2(2150, 980)},
			{"id": "mariella", "pos": Vector2(1860, 980)},
		],
		"enemies": [
			{"type": "gatto", "pos": Vector2(450, 960)},
			{"type": "guardia", "pos": Vector2(1200, 960)},
			{"type": "vespa", "pos": Vector2(1000, 420)},
			{"type": "vespa", "pos": Vector2(1800, 460)},
			{"type": "gatto", "pos": Vector2(2250, 960)},
		],
		"decor": [
			{"kind": "lamp", "pos": Vector2(150, 980)},
			{"kind": "lamp", "pos": Vector2(640, 980)},
			{"kind": "lamp", "pos": Vector2(1200, 980)},
			{"kind": "lamp", "pos": Vector2(1640, 980)},
			{"kind": "lamp", "pos": Vector2(2100, 980)},
		],
	},
	{
		"name": "Villa Comunale",
		"subtitle": "Dove le statue non dormono",
		"theme": "giardino",
		"size": Vector2(2560, 1080),
		"floor": 980.0,
		"blocks": [Rect2(620, 910, 200, 70), Rect2(1140, 925, 320, 55), Rect2(1880, 910, 200, 70)],
		"ledges": [Rect2(300, 760, 200, 18), Rect2(820, 650, 240, 18), Rect2(1190, 540, 220, 18), Rect2(1600, 650, 240, 18), Rect2(2080, 760, 200, 18)],
		"npcs": [
			{"id": "don_ciccio", "pos": Vector2(270, 980)},
			{"id": "gaetano_ricordo", "pos": Vector2(1300, 925)},
			{"id": "bianca_ricordo", "pos": Vector2(1720, 980)},
		],
		"enemies": [
			{"type": "gatto", "pos": Vector2(450, 960)},
			{"type": "statua", "pos": Vector2(930, 616)},
			{"type": "vespa", "pos": Vector2(1500, 380)},
			{"type": "cavaliere", "pos": Vector2(1650, 946)},
			{"type": "statua", "pos": Vector2(2350, 946)},
		],
		"decor": [
			{"kind": "lamp", "pos": Vector2(560, 980)},
			{"kind": "lamp", "pos": Vector2(2200, 980)},
		],
	},
	{
		"name": "Belvedere di San Leucio",
		"subtitle": "La città della seta",
		"theme": "belvedere",
		"size": Vector2(2560, 1080),
		"floor": 980.0,
		"blocks": [Rect2(520, 880, 480, 100), Rect2(1000, 780, 520, 200), Rect2(1520, 700, 360, 280)],
		"ledges": [Rect2(220, 800, 180, 18), Rect2(1120, 560, 200, 18), Rect2(1640, 480, 200, 18), Rect2(2120, 720, 220, 18)],
		"npcs": [
			{"id": "carmela", "pos": Vector2(300, 980)},
			{"id": "taddeo_sanleucio", "pos": Vector2(1600, 980)},
			{"id": "agnese", "pos": Vector2(1880, 980)},
		],
		"enemies": [
			{"type": "gatto", "pos": Vector2(760, 860)},
			{"type": "statua", "pos": Vector2(1700, 666)},
			{"type": "vespa", "pos": Vector2(1250, 380)},
			{"type": "cavaliere", "pos": Vector2(1300, 760)},
			{"type": "vespa", "pos": Vector2(2250, 520)},
			{"type": "gatto", "pos": Vector2(2200, 960)},
		],
		"decor": [
			{"kind": "lamp", "pos": Vector2(2050, 980)},
		],
	},
	{
		"name": "Cortile d'Onore",
		"subtitle": "Il Custode della Reggia",
		"theme": "oro",
		"size": Vector2(1920, 1080),
		"floor": 980.0,
		"blocks": [],
		"ledges": [Rect2(300, 770, 240, 18), Rect2(1380, 770, 240, 18), Rect2(840, 610, 240, 18)],
		# Violante osserva dall'alto e canta la filastrocca, poi sparisce: nessun dialogo prima del boss.
		"npcs": [
			{"id": "violante_balcone", "pos": Vector2(1560, 770)},
		],
		"enemies": [{"type": "custode", "pos": Vector2(1400, 900)}],
		"decor": [
			{"kind": "torch", "pos": Vector2(330, 700)},
			{"kind": "statue", "pos": Vector2(960, 980)},
			{"kind": "torch", "pos": Vector2(1590, 700)},
		],
	},
	{
		"name": "La fucina del ricordo", "subtitle": "Una voce oltre il Velo",
		"theme": "belvedere", "size": Vector2(1280, 1080), "floor": 980.0,
		"blocks": [], "ledges": [], "enemies": [],
		"npcs": [{"id": "fantasma_umano", "pos": Vector2(790, 980)}],
		"decor": [],
	},
	{
		"name": "Caserta dopo il Velo", "subtitle": "Le conseguenze restano",
		"theme": "piazza", "size": Vector2(2560, 1080), "floor": 980.0,
		"blocks": [], "ledges": [], "enemies": [], "decor": [], "npcs": [],
	},
]


## Percorsi superiori a gradini: dislivelli di 110-120 raggiungibili con il doppio salto.
const EXPLORATION_LEDGES := [
	[Rect2(280, 860, 220, 18), Rect2(540, 750, 220, 18), Rect2(800, 640, 220, 18), Rect2(1050, 530, 220, 18), Rect2(1320, 640, 240, 18), Rect2(1590, 750, 220, 18), Rect2(1880, 860, 220, 18)],
	[Rect2(240, 860, 220, 18), Rect2(500, 750, 220, 18), Rect2(760, 640, 240, 18), Rect2(1040, 530, 220, 18), Rect2(1310, 640, 220, 18), Rect2(1580, 750, 220, 18), Rect2(1920, 750, 220, 18), Rect2(2180, 640, 220, 18)],
	[Rect2(280, 860, 220, 18), Rect2(540, 750, 220, 18), Rect2(820, 650, 240, 18), Rect2(1100, 540, 220, 18), Rect2(1370, 650, 220, 18), Rect2(1640, 760, 220, 18), Rect2(2050, 800, 240, 18)],
	[Rect2(220, 860, 220, 18), Rect2(580, 760, 220, 18), Rect2(860, 650, 220, 18), Rect2(1130, 540, 220, 18), Rect2(1410, 430, 220, 18), Rect2(1690, 540, 220, 18), Rect2(1970, 660, 220, 18), Rect2(2240, 780, 200, 18)],
	[Rect2(280, 860, 240, 18), Rect2(560, 750, 220, 18), Rect2(830, 640, 240, 18), Rect2(1100, 750, 220, 18), Rect2(1380, 770, 240, 18)],
]
const SECRETS := [Vector2(1150, 500), Vector2(1140, 500), Vector2(1200, 510), Vector2(1510, 400), Vector2(950, 610)]
const BRANCHES := {0: SECRET_ROOM, 2: 0, 1: 3, 3: 1}
## Scalino senza disegno, 140 unità sopra la piattaforma più alta: richiede il doppio salto.
const FIRST_SECRET_STEP := Rect2(1110, 390, 120, 14)
## Una sola statua per area sblocca il salvataggio; quella alta della Villa è esclusa.
const SAVE_STATUES := [Vector2(2320, 946), Vector2(2320, 946), Vector2(2350, 946), Vector2(1700, 666)]

static func save_station_id(idx: int) -> String:
	if idx >= SAVE_STATUES.size():
		return ""
	var pos: Vector2 = SAVE_STATUES[idx]
	return "%d:statua:%d:%d" % [idx, roundi(pos.x), roundi(pos.y)]

## Aggiunge le aperture verticali senza cambiare gli ID delle aree salvate.
static func build(idx: int, choices: Dictionary = {}) -> Dictionary:
	var r := _base_build(idx, choices).duplicate(true)
	r["vertical"] = Expansion.data().get("vertical", {}).get(str(idx), [])
	for l in Expansion.data().get("extra_ledges", {}).get(str(idx), []):
		r.ledges.append(Rect2(l[0], l[1], l[2], l[3]))
	return r


static func _base_build(idx: int, choices: Dictionary = {}) -> Dictionary:
	if idx >= 7:
		return Expansion.room_data(idx)
	var r: Dictionary = ROOMS[idx]
	if idx == EPILOGUE_ROOM:
		return _epilogue(choices)
	if idx == SECRET_ROOM:
		var extra := r.duplicate(true)
		extra.merge({"secrets": [], "branch": -1, "branch_platform": Rect2(), "invisible_steps": [], "boss": false, "indoor": true})
		return extra
	return {
		"name": r["name"],
		"subtitle": r["subtitle"],
		"theme": r["theme"],
		"size": r["size"],
		"floor": r["floor"],
		"blocks": r["blocks"],
		"ledges": EXPLORATION_LEDGES[idx],
		"enemies": _enemies(idx),
		"secrets": [SECRETS[idx]],
		"branch": BRANCHES.get(idx, -1),
		"branch_platform": FIRST_SECRET_STEP if idx == 0 else highest_platform(idx),
		"invisible_steps": [FIRST_SECRET_STEP] if idx == 0 else [],
		"decor": _decorations(idx),
		"boss": idx == MAIN_COUNT - 1,
	}


## Il Velo cambia la città; la scelta di Gregorio decide il passaggio delle guardie.
static func _epilogue(choices: Dictionary) -> Dictionary:
	var free := str(choices.get("violante_fate", "")) == "uccisa"
	var peaceful := str(choices.get("gregorio_mercy", "")) == "dialogo"
	var r: Dictionary = ROOMS[EPILOGUE_ROOM].duplicate(true)
	r["name"] = "Caserta libera" if free else "Caserta sotto il Velo"
	r["subtitle"] = "Le anime ricordano, le ombre resistono" if free else "La città sogna ancora"
	r["theme"] = "piazza" if free else "oro"
	r["blocks"] = [Rect2(1080, 740, 180, 240)] if not peaceful else []
	r["ledges"] = [Rect2(800, 860, 220, 18), Rect2(1060, 750, 220, 18), Rect2(1340, 860, 220, 18)] if not peaceful else [Rect2(900, 900, 500, 18)]
	r["enemies"] = [{"type": "gatto", "pos": Vector2(720, 960)}, {"type": "vespa", "pos": Vector2(1800, 760)}] if free else []
	if not peaceful:
		r["enemies"].append({"type": "duellante", "pos": Vector2(1510, 946)})
	r["npcs"] = [{"id": "cittadino_libero" if free else "cittadino_velato", "pos": Vector2(2020, 980)}]
	r.merge({"secrets": [Vector2(2200, 940)], "branch": -1, "branch_platform": Rect2(), "invisible_steps": [], "boss": false})
	return r


## Il passaggio nascosto occupa la piattaforma più alta, senza oggetti o indicazioni.
static func highest_platform(idx: int) -> Rect2:
	var highest: Rect2 = EXPLORATION_LEDGES[idx][0]
	for ledge in EXPLORATION_LEDGES[idx]:
		if ledge.position.y < highest.position.y:
			highest = ledge
	return highest


static func _enemies(idx: int) -> Array:
	var enemies: Array = ROOMS[idx]["enemies"].duplicate(true)
	if idx < 2:
		enemies.append({"type": "statua", "pos": Vector2(2320, 946)})
	return enemies


static func _decorations(idx: int) -> Array:
	var result: Array = []
	for decoration in ROOMS[idx]["decor"]:
		if decoration["kind"] != "lamp" and decoration["kind"] != "torch":
			result.append(decoration.duplicate(true))
	# Lampioni a terra fuori dai percorsi: niente mensole dentro i pali.
	var width: float = ROOMS[idx]["size"].x
	result.append({"kind": "lamp", "pos": Vector2(140, 980)})
	result.append({"kind": "lamp", "pos": Vector2(width - 140, 980)})
	return result


## Collisioni solide: soffitto, pavimento, pareti sopra i portali, blocchi e grate chiuse.
static func solids(room: Dictionary, left_open: bool, right_open: bool) -> Array:
	var size: Vector2 = room["size"]
	var fy: float = room["floor"]
	var door_top := fy - DOOR_H
	var out: Array = []
	for side in ["top", "bottom"]:
		var holes: Array = []
		for exit in room.get("vertical", []):
			if exit.side == side and exit.get("open", true):
				holes.append(Vector2(exit.x - exit.width / 2.0, exit.x + exit.width / 2.0))
		holes.sort_custom(func(a: Vector2, b: Vector2) -> bool: return a.x < b.x)
		var start := -200.0
		var y := -200.0 if side == "top" else fy
		var h := 200.0 if side == "top" else size.y - fy + 200.0
		for hole in holes:
			out.append(Rect2(start, y, hole.x - start, h))
			start = hole.y
		out.append(Rect2(start, y, size.x + 200.0 - start, h))
	out.append(Rect2(-200, -200, 200.0 + EDGE, door_top + 200.0))
	out.append(Rect2(size.x - EDGE, -200, 200.0 + EDGE, door_top + 200.0))
	out.append_array(room["blocks"])
	if not left_open:
		out.append(Rect2(-200, door_top, 240, DOOR_H))
	if not right_open:
		out.append(Rect2(size.x - 40.0, door_top, 240, DOOR_H))
	return out


## Punti in cui compaiono i giocatori entrando da sinistra (true) o da destra (false).
static func entry_points(room: Dictionary, from_left: bool) -> Array:
	var size: Vector2 = room["size"]
	var fy: float = room["floor"]
	var out: Array = []
	for i in 4:
		out.append(Vector2(110 + i * 44, fy - 30.0) if from_left else Vector2(size.x - 110.0 - i * 44, fy - 30.0))
	return out
