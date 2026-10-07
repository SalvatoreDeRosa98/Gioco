class_name Art
extends RefCounted
## Palette, font, texture generate e funzioni di disegno condivise.
## Tutta la grafica è procedurale: forme vettoriali, gradienti per vertice, shader e luci 2D.

const OCRA := Color("#d9a441")
const OCRA_DARK := Color("#7a5520")
const CREMA := Color("#f3e6c8")
const AVORIO := Color("#efe8dc")
const ROSA_POMPEI := Color("#c0604a")
const NOTTE := Color("#07080d")
const INCHIOSTRO := Color("#0c0a10")

static var _title_font: Font
static var _title_wide: Font
static var _body_font: Font
static var _soft_tex: Texture2D
static var _light_tex: Texture2D
static var _streak_tex: Texture2D
static var _leaf_tex: Texture2D
static var _add_mat: CanvasItemMaterial


# ---------------------------------------------------------------- Font

## Cinzel, per titoli e numeri (capitale romana, come le iscrizioni della Reggia).
static func title_font() -> Font:
	if _title_font == null:
		_title_font = _variation("res://assets/fonts/Cinzel.ttf", 600, 0)
	return _title_font


## Cinzel con spaziatura larga, per i titoli d'area.
static func title_wide() -> Font:
	if _title_wide == null:
		_title_wide = _variation("res://assets/fonts/Cinzel.ttf", 500, 7)
	return _title_wide


## Cormorant Garamond, per testi e messaggi.
static func body_font() -> Font:
	if _body_font == null:
		_body_font = _variation("res://assets/fonts/CormorantGaramond.ttf", 600, 0)
	return _body_font


static func _variation(path: String, weight: int, spacing: int) -> Font:
	var base: Font = load(path)
	if base == null:
		return ThemeDB.fallback_font
	var fv := FontVariation.new()
	fv.base_font = base
	var ts := TextServerManager.get_primary_interface()
	fv.variation_opentype = {ts.name_to_tag("wght"): weight}
	if spacing != 0:
		fv.set_spacing(TextServer.SPACING_GLYPH, spacing)
	return fv


# ---------------------------------------------------------------- Texture generate

## Disco morbido 64x64 per particelle e bagliori.
static func soft_texture() -> Texture2D:
	if _soft_tex == null:
		_soft_tex = _radial(64, [[0.0, 1.0], [0.35, 0.6], [1.0, 0.0]])
	return _soft_tex


## Disco ampio 256x256 con caduta dolce, per le PointLight2D.
static func light_texture() -> Texture2D:
	if _light_tex == null:
		_light_tex = _radial(256, [[0.0, 1.0], [0.2, 0.7], [0.55, 0.22], [1.0, 0.0]])
	return _light_tex


## Striscia verticale per pioggia e scintille allineate alla velocità.
static func streak_texture() -> Texture2D:
	if _streak_tex == null:
		var g := Gradient.new()
		g.set_color(0, Color(1, 1, 1, 0))
		g.set_color(1, Color(1, 1, 1, 0))
		g.add_point(0.5, Color(1, 1, 1, 1))
		var t := GradientTexture2D.new()
		t.gradient = g
		t.width = 4
		t.height = 32
		t.fill_from = Vector2(0.5, 0.0)
		t.fill_to = Vector2(0.5, 1.0)
		_streak_tex = t
	return _streak_tex


## Foglia ellittica 16x8 per le foglie che cadono.
static func leaf_texture() -> Texture2D:
	if _leaf_tex == null:
		var img := Image.create(16, 8, false, Image.FORMAT_RGBA8)
		for y in 8:
			for x in 16:
				var dx := (float(x) - 7.5) / 8.0
				var dy := (float(y) - 3.5) / 4.0
				var d := dx * dx + dy * dy
				img.set_pixel(x, y, Color(1, 1, 1, clampf((1.0 - d) * 3.0, 0.0, 1.0)))
		_leaf_tex = ImageTexture.create_from_image(img)
	return _leaf_tex


static func _radial(size: int, stops: Array) -> Texture2D:
	var g := Gradient.new()
	g.set_offset(0, stops[0][0])
	g.set_color(0, Color(1, 1, 1, stops[0][1]))
	g.set_offset(1, stops[stops.size() - 1][0])
	g.set_color(1, Color(1, 1, 1, stops[stops.size() - 1][1]))
	for i in range(1, stops.size() - 1):
		g.add_point(stops[i][0], Color(1, 1, 1, stops[i][1]))
	var t := GradientTexture2D.new()
	t.gradient = g
	t.fill = GradientTexture2D.FILL_RADIAL
	t.fill_from = Vector2(0.5, 0.5)
	t.fill_to = Vector2(1.0, 0.5)
	t.width = size
	t.height = size
	return t


## Materiale additivo condiviso per bagliori e luci finte.
static func add_material() -> CanvasItemMaterial:
	if _add_mat == null:
		_add_mat = CanvasItemMaterial.new()
		_add_mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	return _add_mat


# ---------------------------------------------------------------- Nodi di luce

## Bagliore additivo (non illumina, ma si somma: ottimo con il bloom).
static func glow(parent: Node, pos: Vector2, color: Color, diameter: float) -> Sprite2D:
	var s := Sprite2D.new()
	s.texture = soft_texture()
	s.material = add_material()
	s.modulate = color
	s.position = pos
	s.scale = Vector2.ONE * diameter / 64.0
	parent.add_child(s)
	return s


## Luce 2D reale: illumina pietra e personaggi sotto il CanvasModulate.
static func point_light(parent: Node, pos: Vector2, color: Color, energy: float, diameter: float) -> PointLight2D:
	var l := PointLight2D.new()
	l.texture = light_texture()
	l.color = color
	l.energy = energy
	l.texture_scale = diameter / 256.0
	l.position = pos
	parent.add_child(l)
	return l


# ---------------------------------------------------------------- Disegno

## Rettangolo con gradiente verticale.
static func grad_rect(c: CanvasItem, r: Rect2, top: Color, bottom: Color) -> void:
	c.draw_polygon(
		PackedVector2Array([r.position, Vector2(r.end.x, r.position.y), r.end, Vector2(r.position.x, r.end.y)]),
		PackedColorArray([top, top, bottom, bottom]))


## Rettangolo con gradiente orizzontale (per colonne e tronchi illuminati di lato).
static func grad_rect_h(c: CanvasItem, r: Rect2, left: Color, right: Color) -> void:
	c.draw_polygon(
		PackedVector2Array([r.position, Vector2(r.end.x, r.position.y), r.end, Vector2(r.position.x, r.end.y)]),
		PackedColorArray([left, right, right, left]))


## Punti di un'ellisse (o di un arco di ellisse).
static func ellipse(center: Vector2, radius: Vector2, n: int = 24, from: float = 0.0, to: float = TAU) -> PackedVector2Array:
	# Un'ellisse chiusa non ripete il primo punto: la triangolazione rifiuta vertici doppi.
	var closed := to - from >= TAU - 0.0001
	var count := n if closed else n + 1
	var pts := PackedVector2Array()
	for i in count:
		var a := lerpf(from, to, float(i) / float(n))
		pts.append(center + Vector2(cos(a) * radius.x, sin(a) * radius.y))
	return pts


## Ellisse piena con colore al centro e al bordo (sfumatura radiale finta).
static func shaded_ellipse(c: CanvasItem, center: Vector2, radius: Vector2, inner: Color, outer: Color, n: int = 20) -> void:
	var pts := PackedVector2Array([center])
	var cols := PackedColorArray([inner])
	for i in n + 1:
		var a := TAU * float(i) / float(n)
		pts.append(center + Vector2(cos(a) * radius.x, sin(a) * radius.y))
		cols.append(outer)
	for i in n:
		c.draw_polygon(PackedVector2Array([pts[0], pts[i + 1], pts[i + 2]]), PackedColorArray([cols[0], cols[i + 1], cols[i + 2]]))


## Arco "a mezzaluna" pieno con spessore che si assottiglia agli estremi: fendenti e scie.
static func crescent(c: CanvasItem, center: Vector2, radius: float, width: float, from: float, to: float, inner: Color, outer: Color, n: int = 18) -> void:
	var outer_pts := PackedVector2Array()
	var inner_pts := PackedVector2Array()
	for i in n + 1:
		var k := float(i) / float(n)
		var a := lerpf(from, to, k)
		var w := width * sin(k * PI)
		var dir := Vector2(cos(a), sin(a))
		outer_pts.append(center + dir * (radius + w * 0.5))
		inner_pts.append(center + dir * (radius - w * 0.5))
	for i in n:
		c.draw_polygon(
			PackedVector2Array([outer_pts[i], outer_pts[i + 1], inner_pts[i + 1], inner_pts[i]]),
			PackedColorArray([outer, outer, inner, inner]))


## Maschera di Pulcinella usata come "punto vita" nell'HUD.
static func draw_mask(c: CanvasItem, center: Vector2, size: float, filled: bool, glow_amount: float) -> void:
	var s := size
	var pts := PackedVector2Array([
		Vector2(-1.0, -0.2), Vector2(-0.88, -0.72), Vector2(-0.35, -1.0), Vector2(0.35, -1.0),
		Vector2(0.88, -0.72), Vector2(1.0, -0.2), Vector2(0.72, 0.28), Vector2(0.24, 0.34),
		Vector2(0.1, 1.0), Vector2(-0.12, 0.62), Vector2(-0.24, 0.34), Vector2(-0.72, 0.28),
	])
	for i in pts.size():
		pts[i] = center + pts[i] * s
	if filled:
		var cols := PackedColorArray()
		for p in pts:
			var k := clampf((p.y - (center.y - s)) / (2.0 * s), 0.0, 1.0)
			cols.append(Color(0.98, 0.96, 0.92, glow_amount).lerp(Color(0.72, 0.7, 0.72, glow_amount), k))
		c.draw_polygon(pts, cols)
		c.draw_circle(center + Vector2(-0.42, -0.32) * s, s * 0.19, INCHIOSTRO)
		c.draw_circle(center + Vector2(0.42, -0.32) * s, s * 0.19, INCHIOSTRO)
	else:
		c.draw_colored_polygon(pts, Color(0.05, 0.05, 0.08, 0.6))
	var outline := pts.duplicate()
	outline.append(pts[0])
	c.draw_polyline(outline, Color(0.02, 0.02, 0.03, 0.9) if filled else Color(0.85, 0.82, 0.75, 0.35), 1.6, true)


## Testo con ombra morbida (due passate): leggibile su qualunque sfondo.
static func text(c: CanvasItem, font: Font, pos: Vector2, s: String, size: int, color: Color, align: HorizontalAlignment = HORIZONTAL_ALIGNMENT_LEFT, width: float = -1.0) -> void:
	c.draw_string(font, pos + Vector2(0, 2), s, align, width, size, Color(0, 0, 0, 0.55 * color.a))
	c.draw_string(font, pos, s, align, width, size, color)


## Colore dell'anima rilasciata da ciascun nemico alla morte.
static func enemy_color(kind: String) -> Color:
	match kind:
		"vespa":
			return Color("#ffcf5a")
		"statua":
			return Color("#9fd8ff")
		"custode":
			return Color("#ffb347")
		_:
			return Color("#b48cff")
