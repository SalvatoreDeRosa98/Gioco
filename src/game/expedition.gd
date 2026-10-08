extends Node2D
## Varchi laterali, testimonianze e meccanismi leggibili negli ambienti dipinti.
const Data := preload("res://game/expansion_data.gd")
const GATE := preload("res://assets/art/props/cancello.png")
const LETTER := preload("res://assets/art/items/lettera.png")
var world: Node
var marks: Array = []
var selected := -1
var _time := 0.0

## Costruisce gli oggetti interattivi della stanza, senza aggiungere segnali al segreto della fucina.
func setup(owner_world: Node) -> void:
	world = owner_world
	marks = Data.data().landmarks.get(str(world.room_index), []).duplicate(true)
	z_index = 6
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	for cfg in Data.data().moving.get(str(world.room_index), []):
		var platform := preload("res://game/moving_ledge.gd").new()
		platform.setup(cfg, world)
		add_child(platform)

func _process(delta: float) -> void:
	_time += delta
	selected = -1
	var nearest := float(Data.data().interaction_radius)
	if not world.player.dead and not world.is_talking() and world.player.is_on_floor():
		var feet: Vector2 = world.player.position + Vector2(0, 24)
		for i in marks.size():
			var m: Dictionary = marks[i]
			if m.kind != "route" and world.story.times_seen(m.id) > 0:
				continue
			var distance := absf(feet.x - float(m.pos[0]))
			if distance < nearest and absf(feet.y - float(m.pos[1])) < float(Data.data().interaction_height):
				nearest = distance
				selected = i
	queue_redraw()

## Esegue al massimo un'interazione per pressione; invocata dal mondo dopo dialoghi e passaggi segreti.
func interact() -> void:
	if selected < 0 or world.is_talking() or world.in_cutscene() or world.game_over or world._talk_lock > 0 or not Input.is_action_just_pressed("interact"):
		return
	activate(marks[selected])

## Applica un varco, una leva o un frammento usando lo stesso stato persistente dei dialoghi.
func activate(m: Dictionary) -> void:
	if m.kind == "route":
		if str(m.get("need", "")) != "" and world.story.times_seen(m.need) == 0:
			world._hud.toast("Passaggio chiuso: apri il meccanismo dall'altro lato")
			return
		if str(m.get("unlock", "")) != "":
			world.story.seen[m.unlock] = 1
		world._go(int(m.target), true)
		world.player.teleport(Vector2(m.spawn[0], m.spawn[1]))
		return
	if world.story.times_seen(m.id) > 0:
		return
	world.story.seen[m.id] = 1
	world.refresh_routes()
	var lines: Array = []
	for line in m.text:
		lines.append({"text": line})
	world.hold(true)
	world.narrate({"id": m.id + "_reading", "lines": lines})
	world._hud.toast("Testimonianze %d / 3" % Data.fragment_count(world.story) if m.kind == "fragment" else "Meccanismo attivato")

func _draw() -> void:
	for i in marks.size():
		var m: Dictionary = marks[i]
		var p := Vector2(m.pos[0], m.pos[1])
		var done: bool = m.kind != "route" and world.story.times_seen(m.id) > 0
		var color := Color(0.5, 0.75, 0.8) if done else Art.OCRA
		if m.kind == "route":
			draw_texture_rect(GATE, Rect2(p - Vector2(40, 140), Vector2(80, 140)), false, Color(0.7, 0.8, 0.87, 0.8))
			if i != selected:
				Art.text(self, Art.body_font(), p - Vector2(130, 150), m.label, 16, Art.CREMA, HORIZONTAL_ALIGNMENT_CENTER, 260)
		elif m.kind == "fragment":
			draw_texture_rect(LETTER, Rect2(p - Vector2(18, 46), Vector2(36, 40)), false, Color(1, 1, 1, 0.4 if done else 1))
		else:
			var wheel := p - Vector2(0, 38)
			draw_line(p, wheel, Color("#716753"), 7, true)
			draw_arc(wheel, 24, 0, TAU, 32, color, 4, true)
			for a in range(6):
				var angle: float = a * TAU / 6 + (_time * 0.5 if done else 0)
				draw_line(wheel, wheel + Vector2.from_angle(angle) * 22, color, 2, true)
		if i == selected:
			Art.text(self, Art.body_font(), p - Vector2(180, 177 if m.kind == "route" else 86), "W / E  " + str(m.label), 19, Art.OCRA, HORIZONTAL_ALIGNMENT_CENTER, 360)
