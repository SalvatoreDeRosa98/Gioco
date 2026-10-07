class_name Room
extends RefCounted
## Layout fisso delle stanze: pareti, piattaforme, nemici e punti d'ingresso.
## I dati sono identici su tutti i PC, quindi nessun seed è necessario.

const COUNT := 5
const FLOOR_Y := 640.0

const WALLS := [
	Rect2(-40, -40, 1360, 40),
	Rect2(-40, 640, 1360, 80),
	Rect2(-40, 0, 40, 280),
	Rect2(-40, 440, 40, 200),
	Rect2(1280, 0, 40, 280),
	Rect2(1280, 440, 40, 200),
]

const ROOMS := [
	{
		"name": "Piazza Dante",
		"theme": "piazza",
		"platforms": [Rect2(240, 520, 200, 24), Rect2(560, 420, 180, 24), Rect2(860, 520, 200, 24), Rect2(1010, 330, 180, 24)],
		"enemies": [{"type": "gatto", "pos": Vector2(700, 618)}, {"type": "gatto", "pos": Vector2(1000, 618)}],
	},
	{
		"name": "Corso Trieste",
		"theme": "strada",
		"platforms": [Rect2(120, 540, 220, 24), Rect2(420, 440, 160, 24), Rect2(680, 340, 160, 24), Rect2(940, 440, 220, 24)],
		"enemies": [{"type": "vespa", "pos": Vector2(500, 220)}, {"type": "vespa", "pos": Vector2(900, 200)}, {"type": "gatto", "pos": Vector2(300, 618)}],
	},
	{
		"name": "Villa Comunale",
		"theme": "giardino",
		"platforms": [Rect2(200, 520, 160, 24), Rect2(480, 400, 240, 24), Rect2(820, 520, 160, 24), Rect2(1000, 380, 200, 24)],
		"enemies": [{"type": "gatto", "pos": Vector2(360, 618)}, {"type": "statua", "pos": Vector2(1080, 610)}],
	},
	{
		"name": "Belvedere di San Leucio",
		"theme": "belvedere",
		"platforms": [Rect2(160, 500, 140, 24), Rect2(360, 380, 140, 24), Rect2(560, 260, 140, 24), Rect2(780, 380, 140, 24), Rect2(980, 500, 140, 24)],
		"enemies": [{"type": "vespa", "pos": Vector2(650, 150)}, {"type": "statua", "pos": Vector2(900, 610)}, {"type": "gatto", "pos": Vector2(250, 618)}],
	},
	{
		"name": "Cortile d'Onore",
		"theme": "oro",
		"platforms": [Rect2(200, 480, 180, 24), Rect2(900, 480, 180, 24), Rect2(550, 330, 180, 24)],
		"enemies": [{"type": "custode", "pos": Vector2(960, 580)}],
	},
]


static func build(idx: int) -> Dictionary:
	var r: Dictionary = ROOMS[idx]
	var solids: Array = WALLS.duplicate()
	solids.append_array(r["platforms"])
	return {
		"name": r["name"],
		"theme": r["theme"],
		"solids": solids,
		"enemies": r["enemies"],
		"boss": idx == COUNT - 1,
	}


## Punti in cui compaiono i giocatori entrando da sinistra (true) o da destra (false).
static func entry_points(from_left: bool) -> Array:
	var out: Array = []
	for i in 4:
		out.append(Vector2(120 + i * 44, 610) if from_left else Vector2(1160 - i * 44, 610))
	return out
