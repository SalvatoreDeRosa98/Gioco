class_name Art
extends RefCounted
## Palette e disegni procedurali condivisi. Nessun asset esterno: stile scuro e malinconico
## con silhouette e luci calde, ispirato a metroidvania come Hollow Knight.

const OCRA := Color("#d9a441")
const OCRA_DARK := Color("#7a5520")
const CREMA := Color("#f3e6c8")
const ROSA_POMPEI := Color("#c0604a")
const MARMO := Color("#d8d2c4")
const PIETRA := Color("#262a36")
const PIETRA_LUCE := Color("#5a6078")
const NOTTE := Color("#0b0d14")


static func theme_colors(theme: String) -> Dictionary:
	match theme:
		"strada":
			return {"top": Color("#121116"), "bottom": Color("#2c2630"), "accent": Color("#e58f7a")}
		"giardino":
			return {"top": Color("#0c1812"), "bottom": Color("#1f3a2c"), "accent": Color("#9ae0a0")}
		"belvedere":
			return {"top": Color("#0b1220"), "bottom": Color("#1d3150"), "accent": Color("#7fd1c7")}
		"oro":
			return {"top": Color("#1a1208"), "bottom": Color("#3d2a10"), "accent": Color("#f2c46d")}
		_:
			return {"top": Color("#0f1520"), "bottom": Color("#22283a"), "accent": Color("#f2c46d")}


static func enemy_color(kind: String) -> Color:
	match kind:
		"vespa":
			return Color("#f0c24b")
		"statua":
			return Color("#9fa3ae")
		"custode":
			return Color("#c9a24e")
		_:
			return Color("#8b8fa3")


static func draw_backdrop(c: Control) -> void:
	var s := c.size
	c.draw_rect(Rect2(Vector2.ZERO, s), NOTTE)
	for i in 14:
		var f := float(i) / 14.0
		c.draw_rect(Rect2(0, f * s.y, s.x, s.y / 14.0 + 1.0), NOTTE.lerp(Color("#1f2433"), f))
	var step := 220.0
	for x in range(0, int(s.x) + int(step), int(step)):
		var cx := float(x) + step * 0.5
		c.draw_rect(Rect2(cx - 60, s.y * 0.45, 120, s.y * 0.55), Color("#06070b"))
		c.draw_circle(Vector2(cx, s.y * 0.45), 60, Color("#06070b"))
	c.draw_rect(Rect2(0, s.y * 0.9, s.x, s.y * 0.1), Color("#06070b"))


static func draw_room_bg(c: CanvasItem, theme: String, t: float) -> void:
	var pal := theme_colors(theme)
	var top: Color = pal.top
	var bottom: Color = pal.bottom
	var accent: Color = pal.accent
	for i in 16:
		var f := float(i) / 16.0
		c.draw_rect(Rect2(0, f * 720.0, 1280, 720.0 / 16.0 + 1.0), top.lerp(bottom, f))
	# Arcate della Reggia sullo sfondo, in silhouette
	var far := bottom.darkened(0.35)
	for x in range(-40, 1320, 240):
		var cx := float(x) + 120.0
		c.draw_rect(Rect2(cx - 52, 330, 104, 320), far)
		c.draw_circle(Vector2(cx, 330), 52, far)
	# Lanterne calde che pulsano
	for p in [Vector2(220, 120), Vector2(1060, 96), Vector2(640, 60)]:
		var a := 0.5 + 0.2 * sin(t * 2.0 + p.x * 0.01)
		c.draw_circle(p, 56, Color(accent, 0.07 * a))
		c.draw_circle(p, 22, Color(accent, 0.12 * a))
		c.draw_circle(p, 5, Color(accent, 0.9))
	# Foschia in basso
	for i in 4:
		c.draw_rect(Rect2(0, 600 + i * 20, 1280, 30), Color(0, 0, 0, 0.07 * float(i + 1)))


static func draw_stone(c: CanvasItem, r: Rect2, theme: String) -> void:
	var accent: Color = theme_colors(theme).accent
	c.draw_rect(r, PIETRA)
	c.draw_rect(Rect2(r.position, Vector2(r.size.x, 3)), PIETRA_LUCE.lerp(accent, 0.12))
	c.draw_rect(Rect2(r.position + Vector2(0, r.size.y - 3), Vector2(r.size.x, 3)), Color("#14161d"))


static func draw_door(c: CanvasItem, r: Rect2, is_open: bool, t: float) -> void:
	if is_open:
		var pulse := 0.5 + 0.5 * sin(t * 3.0)
		c.draw_rect(r, Color(0.6, 0.85, 1.0, 0.1 + 0.08 * pulse))
		c.draw_rect(Rect2(r.position.x + r.size.x * 0.5 - 2, r.position.y, 4, r.size.y), Color(0.7, 0.9, 1.0, 0.5))
	else:
		c.draw_rect(r, Color("#0a0c12"))
		var x := r.position.x + 6.0
		while x < r.end.x - 4.0:
			c.draw_rect(Rect2(x, r.position.y, 3, r.size.y), Color("#3a3f4f"))
			x += 10.0


static func draw_pip(c: CanvasItem, center: Vector2, filled: bool) -> void:
	var col := ROSA_POMPEI if filled else Color(0.1, 0.1, 0.13, 0.9)
	c.draw_circle(center, 11.0, Color(0, 0, 0, 0.6))
	c.draw_circle(center, 9.0, col)
	if filled:
		c.draw_circle(center + Vector2(-3, -3), 2.5, Color(1, 0.9, 0.8, 0.7))


static func spawn_slash(parent: Node, pos: Vector2, facing: float, down: bool) -> void:
	var n := Node2D.new()
	n.position = pos
	parent.add_child(n)
	n.draw.connect(_draw_slash.bind(n, facing, down))
	var tw := n.create_tween()
	tw.tween_property(n, "modulate:a", 0.0, 0.16)
	tw.tween_callback(n.queue_free)


static func _draw_slash(n: CanvasItem, facing: float, down: bool) -> void:
	if down:
		n.draw_arc(Vector2(0, 30), 36.0, 0.25 * PI, 0.75 * PI, 16, CREMA, 4.0)
	else:
		var base := 0.0 if facing > 0.0 else PI
		n.draw_arc(Vector2(facing * 30.0, -6.0), 40.0, base - 0.9, base + 0.9, 18, CREMA, 4.0)
