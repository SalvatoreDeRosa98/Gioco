extends Node2D
## Varchi laterali, testimonianze e meccanismi leggibili negli ambienti dipinti.
const Data := preload("res://game/expansion_data.gd")
const LETTER := preload("res://assets/art/items/lettera.png")
const Terrain := preload("res://game/terrain.gd")
## Misure del portale in pietra dei varchi laterali, in unità di mondo.
const ARCH_OPEN := 92.0
const ARCH_SPRING := 150.0
const ARCH_R := 46.0
const ARCH_PILLAR := 24.0
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
		if bool(m.get("need_clear", false)) and not world.room_cleared:
			world._hud.toast("Sconfiggi tutti i nemici delle Cisterne per raggiungere Ratking")
			return
		if int(m.target) == Room.SECRET_ROOM:
			world.enter_forge()
			return
		if str(m.get("need", "")) != "" and world.story.times_seen(m.need) == 0:
			world._hud.toast(str(m.get("locked_hint","Passaggio chiuso: apri il meccanismo dall'altro lato")))
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
	if str(m.id).begins_with("archive_"):
		world._hud.toast("Testimonianze %d / 3" % Data.fragment_count(world.story))
	elif m.id in Data.DISTRICT_SEALS:
		world._hud.toast("Sigillo quartiere risvegliato (%d/%d)" % [Data.seals_count(world.story), Data.seals_total()])
	else:
		world._hud.toast("Meccanismo attivato")

func _draw() -> void:
	for i in marks.size():
		var m: Dictionary = marks[i]
		var p := Vector2(m.pos[0], m.pos[1])
		var done: bool = m.kind != "route" and world.story.times_seen(m.id) > 0
		var color := Color(0.5, 0.75, 0.8) if done else Art.OCRA
		if m.kind == "route":
			var locked: bool = (bool(m.get("need_clear", false)) and not world.room_cleared) or (str(m.get("need", "")) != "" and world.story.times_seen(m.need) == 0)
			var is_forge: bool = str(m.get("id", "")) == "forge_door" or int(m.get("target", -1)) == Room.SECRET_ROOM
			_archway(p, locked, i == selected, is_forge)
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
			var txt: String = Controls.label("interact") + "  " + str(m.label)
			var r := label_rect(p - Vector2(0, ARCH_SPRING + ARCH_R + 60 if m.kind == "route" else 86), txt)
			Art.text(self, Art.body_font(), r.position + Vector2(0, LABEL_SIZE), txt, LABEL_SIZE, Art.OCRA, HORIZONTAL_ALIGNMENT_CENTER, r.size.x)


const LABEL_SIZE := 19
## Margine dai bordi dello schermo per le scritte dei passaggi.
const LABEL_MARGIN := 16.0


## Riquadro (coordinate locali) della scritta di un passaggio centrata su anchor (base del testo):
## spostato in orizzontale perche' resti tutto dentro lo schermo e non finisca sotto il pannello
## dell'HUD in alto a sinistra (stanza 13: "Passaggio per Piazza Dante" usciva a sinistra).
func label_rect(anchor: Vector2, txt: String) -> Rect2:
	var w := Art.body_font().get_string_size(txt, HORIZONTAL_ALIGNMENT_LEFT, -1, LABEL_SIZE).x + 12.0
	var local := Rect2(anchor + Vector2(-w * 0.5, -LABEL_SIZE), Vector2(w, LABEL_SIZE + 6.0))
	if not is_inside_tree():
		return local
	var xf := get_global_transform_with_canvas()
	var vp := get_viewport_rect().size
	var scr := xf * local
	var hud_panel := Rect2()
	if world and world.get("_hud") and world._hud.has_method("vitals_rect"):
		hud_panel = world._hud.vitals_rect()
	var min_x := LABEL_MARGIN
	if hud_panel.size.x > 0.0 and scr.position.y < hud_panel.end.y + 4.0 and scr.end.y > hud_panel.position.y:
		min_x = hud_panel.end.x + 12.0
	var max_x := vp.x - LABEL_MARGIN - scr.size.x
	scr.position.x = clampf(scr.position.x, min_x, maxf(min_x, max_x))
	scr.position.y = clampf(scr.position.y, LABEL_MARGIN, vp.y - LABEL_MARGIN - scr.size.y)
	var back := xf.affine_inverse() * scr
	return Rect2(back.position, local.size)


## Portale in pietra appoggiato al suolo, con la stessa pietra dipinta del terreno:
## saracinesca alzata e luce calda se il passaggio è aperto, grata abbassata se è chiuso.
func _archway(base: Vector2, locked: bool, near: bool, is_forge: bool = false) -> void:
	var tint := _stone_tint()
	var half := ARCH_OPEN * 0.5
	var spring := base.y - ARCH_SPRING
	var center := Vector2(base.x, spring)
	# Ombra di contatto e soglia.
	draw_set_transform(base + Vector2(0, 2), 0.0, Vector2(1.0, 0.14))
	draw_circle(Vector2.ZERO, half + ARCH_PILLAR + 26, Color(0, 0, 0, 0.45))
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	# Vano scuro.
	var hole := PackedVector2Array()
	for k in 25:
		hole.append(center + Vector2.from_angle(PI + PI * k / 24.0) * half)
	hole.append(Vector2(base.x + half, base.y))
	hole.append(Vector2(base.x - half, base.y))
	draw_colored_polygon(hole, Color(0.025, 0.03, 0.045))
	if not locked:
		var pulse := 0.5 + 0.5 * sin(_time * 2.0)
		var warm := Color(1.0, 0.74, 0.42)
		var glow := (0.22 if near else 0.12) + 0.05 * pulse
		Art.grad_rect(self, Rect2(base.x - half, spring - ARCH_R * 0.4, ARCH_OPEN, base.y - spring + ARCH_R * 0.4), Color(warm, 0.0), Color(warm, glow))
		draw_set_transform(base, 0.0, Vector2(1.0, 0.18))
		draw_circle(Vector2.ZERO, half + 10, Color(warm, glow * 0.8))
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	# Saracinesca: tutta giù se chiusa, raccolta sotto l'arco se aperta.
	var bottom := base.y - 4.0 if locked else spring + 22.0
	var top := spring - ARCH_R + 6.0
	var x := base.x - half + 7.0
	while x < base.x + half - 4.0:
		var dx := absf(x - base.x)
		var y0 := center.y - sqrt(maxf(half * half - dx * dx, 0.0)) + 4.0
		draw_line(Vector2(x, maxf(y0, top)), Vector2(x, bottom), Terrain.IRON, 4.0)
		draw_line(Vector2(x - 1.0, maxf(y0, top)), Vector2(x - 1.0, bottom), Terrain.IRON_HI, 1.0)
		if not locked:
			draw_colored_polygon(PackedVector2Array([Vector2(x - 3, bottom), Vector2(x + 3, bottom), Vector2(x, bottom + 9)]), Terrain.IRON)
		x += 12.0
	for y in ([spring + 8.0, bottom - 10.0] if locked else [spring + 12.0]):
		if y < bottom:
			draw_line(Vector2(base.x - half + 2, y), Vector2(base.x + half - 2, y), Terrain.IRON, 5.0)
	if locked:
		draw_line(Vector2(base.x - half + 10, base.y - 70), Vector2(base.x + half - 10, base.y - 40), Color(0.35, 0.32, 0.28), 4.0)
		draw_line(Vector2(base.x - half + 10, base.y - 40), Vector2(base.x + half - 10, base.y - 70), Color(0.35, 0.32, 0.28), 4.0)
		draw_rect(Rect2(base.x - 9, base.y - 64, 18, 20), Color(0.42, 0.34, 0.2))
	# Pilastri e arco in pietra.
	_stone_column(Rect2(base.x - half - ARCH_PILLAR, spring, ARCH_PILLAR, ARCH_SPRING), tint)
	_stone_column(Rect2(base.x + half, spring, ARCH_PILLAR, ARCH_SPRING), tint)
	var mid := half + ARCH_PILLAR * 0.5
	var tex: Texture2D = Terrain.STONE_TEX
	var tw := float(tex.get_width())
	var th := float(tex.get_height())
	var shade := tint.darkened(0.15)
	var rows := Terrain.BRICK_ROWS
	for k in 9:
		var a0 := PI + PI * k / 9.0
		var a1 := PI + PI * (k + 1) / 9.0
		var pts := PackedVector2Array([center + Vector2.from_angle(a0) * half, center + Vector2.from_angle(a0) * (half + ARCH_PILLAR),
			center + Vector2.from_angle(a1) * (half + ARCH_PILLAR), center + Vector2.from_angle(a1) * half])
		var u0 := fposmod(base.x * 3.1 + k * 211.0, tw - 120.0) / tw
		var u1 := u0 + 90.0 / tw
		var uvs := PackedVector2Array([Vector2(u0, (rows.y - 4.0) / th), Vector2(u0, rows.x / th), Vector2(u1, rows.x / th), Vector2(u1, (rows.y - 4.0) / th)])
		draw_polygon(pts, PackedColorArray([shade, shade, shade, shade]), uvs, tex)
		draw_polyline(PackedVector2Array([pts[0], pts[1]]), Color(0, 0, 0, 0.45), 1.5)
	draw_arc(center, half, PI, TAU, 32, Color(0, 0, 0, 0.7), 2.0, true)
	draw_arc(center, half + ARCH_PILLAR, PI, TAU, 32, Color(0, 0, 0, 0.55), 2.0, true)
	var cap := Terrain.CAP_ROWS
	var key := Rect2(base.x - 12, spring - half - ARCH_PILLAR - 5, 24, ARCH_PILLAR + 10)
	draw_texture_rect_region(tex, key, Rect2(400, cap.x, key.size.x / 0.2, key.size.y / 0.2), shade.lightened(0.06))
	draw_rect(key, Color(0, 0, 0, 0.55), false, 1.5)
	# Capitelli.
	for side in [-1.0, 1.0]:
		var cx: float = base.x + side * mid
		var cr := Rect2(cx - ARCH_PILLAR * 0.5 - 5, spring - 7, ARCH_PILLAR + 10, 11)
		draw_texture_rect_region(tex, cr, Rect2(900 + side * 300, cap.x, cr.size.x / 0.2, cr.size.y / 0.2), shade.lightened(0.06))
		draw_rect(cr, Color(0, 0, 0, 0.55), false, 1.5)
	if is_forge:
		var plaque_y := spring - half - ARCH_PILLAR - 36.0
		var plaque := Rect2(base.x - 120.0, plaque_y, 240.0, 28.0)
		draw_rect(plaque, Color(0.06, 0.05, 0.04, 0.88))
		draw_rect(plaque, Color(Art.OCRA, 0.9), false, 2.0)
		Art.text(self, Art.body_font(), Vector2(base.x - 120.0, plaque_y + 19.0), "⚒ FUCINA DI GAETANO ⚒", 15, Art.OCRA, HORIZONTAL_ALIGNMENT_CENTER, 240.0)
		for k in 6:
			var seed_k: float = float(k) * 1.37
			var life_prog := fmod(_time * 0.45 + seed_k * 0.2, 1.0)
			var ember_x := base.x + sin(_time * 1.8 + seed_k * 2.5) * 35.0 + (float(k) - 2.5) * 12.0
			var ember_y := base.y - 40.0 - life_prog * 220.0
			var ember_a := (1.0 - life_prog) * (0.8 + 0.2 * sin(_time * 5.0 + seed_k))
			var ember_col := Color(1.0, 0.65 + 0.25 * sin(seed_k), 0.2, ember_a)
			draw_circle(Vector2(ember_x, ember_y), 2.2 * (1.0 - life_prog * 0.4), ember_col)


## Colonna in conci, presa dalla stessa texture della pietra del pavimento.
func _stone_column(r: Rect2, tint: Color) -> void:
	var k := Terrain.STONE_SCALE
	var rows := Terrain.BRICK_ROWS
	var course := (rows.y - rows.x) * k * 0.5
	var y := r.end.y
	var n := 0
	while y > r.position.y + 0.5:
		var h := minf(course, y - r.position.y)
		var src := Rect2(fposmod(r.position.x / k + n * 173.0, 1500.0), rows.x, r.size.x / k, h / k)
		draw_texture_rect_region(Terrain.STONE_TEX, Rect2(r.position.x, y - h, r.size.x, h), src, tint.darkened(0.15))
		draw_line(Vector2(r.position.x, y - h), Vector2(r.end.x, y - h), Color(0, 0, 0, 0.35), 1.0)
		y -= h
		n += 1
	draw_rect(r, Color(0, 0, 0, 0.5), false, 1.5)


func _stone_tint() -> Color:
	var terrain = world.get("_terrain")
	if terrain != null:
		return terrain.get("_tint")
	return Color.WHITE
