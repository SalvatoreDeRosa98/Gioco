class_name Room
extends RefCounted
## Layout delle stanze: dimensioni, pavimento, blocchi solidi, mensole attraversabili dal basso,
## nemici e decorazioni. I dati sono identici su tutti i PC.

const COUNT := 5
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
			{"id": "mariella", "pos": Vector2(2320, 980)},
		],
		"enemies": [
			{"type": "gatto", "pos": Vector2(450, 960)},
			{"type": "vespa", "pos": Vector2(1000, 420)},
			{"type": "vespa", "pos": Vector2(1800, 460)},
			{"type": "gatto", "pos": Vector2(2250, 960)},
		],
		"decor": [
			{"kind": "lamp", "pos": Vector2(150, 980)},
			{"kind": "lamp", "pos": Vector2(1200, 980)},
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
			{"id": "taddeo_sanleucio", "pos": Vector2(2130, 980)},
			{"id": "agnese", "pos": Vector2(2330, 980)},
		],
		"enemies": [
			{"type": "gatto", "pos": Vector2(760, 860)},
			{"type": "statua", "pos": Vector2(1700, 666)},
			{"type": "vespa", "pos": Vector2(1250, 380)},
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
]


static func build(idx: int) -> Dictionary:
	var r: Dictionary = ROOMS[idx]
	return {
		"name": r["name"],
		"subtitle": r["subtitle"],
		"theme": r["theme"],
		"size": r["size"],
		"floor": r["floor"],
		"blocks": r["blocks"],
		"ledges": r["ledges"],
		"enemies": r["enemies"],
		"decor": r["decor"],
		"boss": idx == COUNT - 1,
	}


## Collisioni solide: soffitto, pavimento, pareti sopra i portali, blocchi e grate chiuse.
static func solids(room: Dictionary, left_open: bool, right_open: bool) -> Array:
	var size: Vector2 = room["size"]
	var fy: float = room["floor"]
	var door_top := fy - DOOR_H
	var out: Array = [
		Rect2(-200, -200, size.x + 400.0, 200),
		Rect2(-200, fy, size.x + 400.0, size.y - fy + 200.0),
		Rect2(-200, -200, 200.0 + EDGE, door_top + 200.0),
		Rect2(size.x - EDGE, -200, 200.0 + EDGE, door_top + 200.0),
	]
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
