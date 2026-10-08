extends RefCounted
## Dati delle nuove aree e collegamenti. Gli ID precedenti restano validi per i salvataggi.
static var _data: Dictionary = {}

## Configurazione condivisa di stanze, varchi e prove.
static func data() -> Dictionary:
	if _data.is_empty():
		_data = JSON.parse_string(FileAccess.get_file_as_string("res://data/expansion.json"))
	return _data

## Converte le coordinate JSON nei tipi usati dalle collisioni e dal disegno.
static func room_data(idx: int) -> Dictionary:
	var r: Dictionary = data().rooms[str(idx)].duplicate(true)
	r.size = Vector2(r.size[0], r.size[1])
	for key in ["blocks", "ledges"]:
		var rectangles: Array = []
		for a in r[key]:
			rectangles.append(Rect2(a[0], a[1], a[2], a[3]))
		r[key] = rectangles
	for key in ["enemies", "npcs", "decor"]:
		for d in r[key]:
			d.pos = Vector2(d.pos[0], d.pos[1])
	var secrets: Array = []
	for p in r.secrets:
		secrets.append(Vector2(p[0], p[1]))
	r.secrets = secrets
	r.merge({"branch": -1, "branch_platform": Rect2(), "invisible_steps": [], "boss": false, "indoor": idx in [8, 10, 11]})
	return r

## Destinazione del bordo sinistro o destro; -1 indica un muro senza uscita.
static func edge(idx: int, right: bool) -> int:
	return int(data().edges.get(str(idx), [-1, -1])[1 if right else 0])

## Tutti i frammenti degli Archivi sono richiesti, indipendentemente dalla scelta sul registro.
static func archive_ready(story: RefCounted) -> bool:
	for id in ["archive_1", "archive_2", "archive_3"]:
		if story.times_seen(id) == 0:
			return false
	return true

## Progresso leggibile per l'obiettivo del Cortile.
static func fragment_count(story: RefCounted) -> int:
	var count := 0
	for id in ["archive_1", "archive_2", "archive_3"]:
		count += int(story.times_seen(id) > 0)
	return count
