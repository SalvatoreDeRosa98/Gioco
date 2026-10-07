extends Node2D
## Strato di sfondo procedurale (lontano, medio, primo piano o raggi di luce) per un'area di Caserta.
## Viene disegnato una sola volta: la parallasse sposta il nodo, non lo ridisegna.
## Il generatore casuale ha un seme fisso, quindi lo stesso strato è identico su tutti i PC.

var kind := "city"
var th: Dictionary = {}
var x0 := -800.0
var x1 := 2000.0
var base := 900.0
var seed_value := 1
var rng := RandomNumberGenerator.new()


func setup(k: String, theme: Dictionary, from_x: float, to_x: float, base_y: float, s: int) -> void:
	kind = k
	th = theme
	x0 = from_x
	x1 = to_x
	base = base_y
	seed_value = s
	if kind == "shafts":
		material = Art.add_material()
	queue_redraw()


func _draw() -> void:
	rng.seed = seed_value
	match kind:
		"city":
			_city()
		"rooftops":
			_rooftops()
		"canopy":
			_canopy()
		"hills":
			_hills()
		"reggia":
			_reggia()
		"facades":
			_facades()
		"arcade":
			_arcade()
		"garden":
			_garden()
		"factory":
			_factory()
		"colonnade":
			_colonnade()
		"railing":
			_fg_railing()
		"awnings":
			_fg_awnings()
		"foliage":
			_fg_foliage()
		"grass":
			_fg_grass()
		"columns":
			_fg_columns()
		"shafts":
			_shafts()


# ================================================================ Strati lontani

func _city() -> void:
	var col: Color = th.far
	var glow: Color = th.far_glow
	var x := x0
	while x < x1:
		var w := rng.randf_range(70.0, 190.0)
		var h := rng.randf_range(90.0, 280.0)
		var top := base - h
		draw_rect(Rect2(x, top, w + 1.0, h + 1600.0), col)
		var r := rng.randf()
		if r < 0.16:
			var rad := w * 0.32
			draw_circle(Vector2(x + w * 0.5, top), rad, col)
			draw_rect(Rect2(x + w * 0.5 - 3.0, top - rad - 20.0, 6.0, 22.0), col)
		elif r < 0.32:
			var tw := maxf(22.0, w * 0.26)
			var tx := x + w * 0.62
			draw_rect(Rect2(tx, top - 130.0, tw, 131.0), col)
			draw_colored_polygon(PackedVector2Array([Vector2(tx - 5, top - 130), Vector2(tx + tw + 5, top - 130), Vector2(tx + tw * 0.5, top - 178)]), col)
			draw_rect(Rect2(tx + tw * 0.3, top - 112, tw * 0.4, 16), Color(glow, 0.6))
		elif r < 0.55:
			draw_colored_polygon(PackedVector2Array([Vector2(x - 4, top), Vector2(x + w + 4, top), Vector2(x + w * 0.5, top - h * 0.16)]), col)
		_windows(x, top, w, h, glow, 0.2, Vector2(6, 10), Vector2(24, 32))
		x += w + rng.randf_range(-24.0, 8.0)
	_haze(th.fog, base - 260.0, 460.0, 0.55)


func _rooftops() -> void:
	var col: Color = th.far
	var glow: Color = th.far_glow
	var x := x0
	while x < x1:
		var w := rng.randf_range(90.0, 200.0)
		var h := rng.randf_range(100.0, 230.0)
		var top := base - h
		draw_rect(Rect2(x, top, w + 1.0, h + 1600.0), col)
		var ph := rng.randf_range(24.0, 60.0)
		var peak := x + w * 0.5 + rng.randf_range(-20.0, 20.0)
		draw_colored_polygon(PackedVector2Array([Vector2(x - 6, top), Vector2(x + w + 6, top), Vector2(peak, top - ph)]), col)
		if rng.randf() < 0.6:
			var cx := x + rng.randf_range(0.2, 0.8) * w
			draw_rect(Rect2(cx, top - ph * 0.6 - 26.0, 10.0, 30.0), col)
		if rng.randf() < 0.35:
			var ax := x + w * 0.3
			draw_line(Vector2(ax, top - ph * 0.4), Vector2(ax, top - ph - 40.0), col, 2.0)
			draw_line(Vector2(ax - 14, top - ph - 30.0), Vector2(ax + 14, top - ph - 30.0), col, 2.0)
		_windows(x, top, w, h, glow, 0.16, Vector2(7, 11), Vector2(26, 34))
		if rng.randf() < 0.3:
			var ly := top + rng.randf_range(40.0, 90.0)
			var lx2 := x + w + 60.0
			draw_line(Vector2(x + w - 10, ly), Vector2(lx2, ly + 10), col.lightened(0.08), 1.5)
			for k in 4:
				var cx2 := lerpf(x + w, lx2 - 10.0, (float(k) + 0.5) / 4.0)
				draw_rect(Rect2(cx2, ly + 3.0 + k * 2.0, 10, 14), col.lightened(0.12))
		x += w + rng.randf_range(-10.0, 40.0)
	_haze(th.fog, base - 240.0, 420.0, 0.6)


func _canopy() -> void:
	var col: Color = th.far
	var rim := Color(th.moon_color, 0.12)
	draw_rect(Rect2(x0, base - 60.0, x1 - x0, 1700.0), col)
	var x := x0
	while x < x1:
		var r := rng.randf_range(55.0, 135.0)
		var cy := base - rng.randf_range(60.0, 210.0)
		draw_rect(Rect2(x - 8, cy, 16, base - cy + 10.0), col)
		draw_circle(Vector2(x, cy), r, col)
		draw_arc(Vector2(x, cy), r - 4.0, PI * 1.1, PI * 1.65, 14, rim, 6.0)
		x += rng.randf_range(45.0, 110.0)
	_haze(th.fog, base - 220.0, 400.0, 0.6)


func _hills() -> void:
	var back: Color = (th.far as Color).lerp(th.fog, 0.45)
	_hill_row(back, base - 240.0, 70.0, 0.0031, 1.3)
	_belvedere((x0 + x1) * 0.5, base - 205.0)
	_hill_row(th.far, base - 120.0, 90.0, 0.0047, 4.1)
	_haze(th.fog, base - 200.0, 380.0, 0.5)


func _hill_row(col: Color, y: float, amp: float, freq: float, phase: float) -> void:
	var pts := PackedVector2Array()
	var x := x0
	while x <= x1 + 30.0:
		var h := 0.6 * sin(x * freq + phase) + 0.4 * sin(x * freq * 2.7 + phase * 1.7)
		pts.append(Vector2(x, y - amp * h))
		x += 30.0
	pts.append(Vector2(x1 + 30.0, base + 1600.0))
	pts.append(Vector2(x0, base + 1600.0))
	draw_colored_polygon(pts, col)


## Il Real Belvedere di San Leucio, sulla collina.
func _belvedere(cx: float, ground: float) -> void:
	var col: Color = (th.far as Color).lerp(th.fog, 0.25)
	var glow: Color = th.far_glow
	var w := 580.0
	var h := 120.0
	var left := cx - w * 0.5
	draw_rect(Rect2(left, ground - h, w, h + 260.0), col)
	draw_rect(Rect2(cx - 80, ground - h - 50.0, 160, 60), col)
	draw_colored_polygon(PackedVector2Array([Vector2(cx - 92, ground - h - 50), Vector2(cx + 92, ground - h - 50), Vector2(cx, ground - h - 92)]), col)
	draw_rect(Rect2(cx - 14, ground - h - 132.0, 28, 50), col)
	draw_circle(Vector2(cx, ground - h - 112.0), 7.0, Color(glow, 0.55))
	for row in 2:
		for i in 16:
			var wx := left + 22.0 + i * 34.0
			if absf(wx - cx) < 92.0:
				continue
			var wy := ground - h + 22.0 + row * 46.0
			var wc := Color(glow, rng.randf_range(0.3, 0.8)) if rng.randf() < 0.3 else col.darkened(0.3)
			draw_rect(Rect2(wx, wy + 5, 10, 18), wc)
			draw_circle(Vector2(wx + 5, wy + 5), 5.0, wc)


## La facciata della Reggia di Caserta: lunghissima, quattro ordini di finestre, corpo centrale.
func _reggia() -> void:
	var col: Color = th.far
	var light := col.lightened(0.07)
	var glow: Color = th.far_glow
	var top := base - 330.0
	draw_rect(Rect2(x0, top, x1 - x0, 1700.0), col)
	var px := x0 + 200.0
	while px < x1:
		draw_rect(Rect2(px - 80, top - 36.0, 160, 40), col)
		px += 900.0
	var cx := (x0 + x1) * 0.5
	draw_rect(Rect2(cx - 220, top - 74.0, 440, 80), col)
	draw_colored_polygon(PackedVector2Array([Vector2(cx - 240, top - 74), Vector2(cx + 240, top - 74), Vector2(cx, top - 146)]), col)
	draw_circle(Vector2(cx, top - 156.0), 46.0, col)
	draw_rect(Rect2(cx - 5, top - 226.0, 10, 30), col)
	draw_rect(Rect2(x0, top - 4.0, x1 - x0, 6), light)
	draw_rect(Rect2(x0, top + 96.0, x1 - x0, 4), light)
	draw_rect(Rect2(x0, top + 196.0, x1 - x0, 4), light)
	var bx := x0
	while bx < x1:
		draw_rect(Rect2(bx, top - 14.0, 4, 10), col)
		bx += 12.0
	var wx := x0 + 14.0
	while wx < x1:
		for row in 4:
			var wy := top + 18.0 + row * 72.0
			var lit := rng.randf() < (0.28 if row < 3 else 0.45)
			var wc := Color(glow, rng.randf_range(0.5, 0.95)) if lit else col.darkened(0.35)
			draw_rect(Rect2(wx, wy + 8, 14, 30), wc)
			draw_circle(Vector2(wx + 7, wy + 8), 7.0, wc)
		wx += 44.0
	_haze(th.fog, base - 120.0, 300.0, 0.45)


# ================================================================ Strati medi

func _facades() -> void:
	var col: Color = th.mid
	var glow: Color = th.mid_glow
	var x := x0
	while x < x1:
		var w := rng.randf_range(260.0, 420.0)
		var h := rng.randf_range(330.0, 520.0)
		var top := base - h
		var body := col.lightened(rng.randf_range(0.0, 0.06))
		Art.grad_rect(self, Rect2(x, top, w, h + 1600.0), body.lightened(0.05), body.darkened(0.25))
		var trim := body.lightened(0.13)
		draw_rect(Rect2(x - 8, top - 12.0, w + 16, 14), trim)
		draw_rect(Rect2(x - 4, top - 18.0, w + 8, 6), trim.darkened(0.12))
		draw_rect(Rect2(x - 3, base - 172.0, w + 6, 8), trim)
		draw_rect(Rect2(x, top, 10, h), body.lightened(0.05))
		draw_rect(Rect2(x + w - 10, top, 10, h), body.lightened(0.05))
		var n := maxi(2, int(w / 95.0))
		var aw := w / n
		for i in n:
			var lit := rng.randf() < 0.5
			_arch(Vector2(x + aw * (i + 0.5), base), aw * 0.62, 150.0, glow if lit else Color(0, 0, 0, 0), body.darkened(0.45))
		var rows := int((h - 210.0) / 92.0)
		var cols := maxi(2, int(w / 80.0))
		for ry in rows:
			for cx in cols:
				var wpos := Vector2(x + (cx + 0.5) * w / cols - 13.0, top + 40.0 + ry * 92.0)
				_window(wpos, Vector2(26, 46), glow, rng.randf() < 0.32, body)
			if rng.randf() < 0.45:
				var by := top + 40.0 + ry * 92.0 + 50.0
				draw_rect(Rect2(x + 20, by, w - 40, 5), trim)
				var rx := x + 22.0
				while rx < x + w - 22.0:
					draw_line(Vector2(rx, by), Vector2(rx, by - 16), trim.darkened(0.25), 2.0)
					rx += 9.0
				draw_line(Vector2(x + 20, by - 16), Vector2(x + w - 20, by - 16), trim.darkened(0.25), 2.0)
		x += w + rng.randf_range(0.0, 50.0)
	_haze(th.fog, base - 200.0, 380.0, 0.35)


func _arcade() -> void:
	var col: Color = th.mid
	var glow: Color = th.mid_glow
	var top := base - 480.0
	Art.grad_rect(self, Rect2(x0, top, x1 - x0, 1700.0), col.lightened(0.05), col.darkened(0.25))
	var trim := col.lightened(0.13)
	draw_rect(Rect2(x0, top - 60.0, x1 - x0, 48), col.darkened(0.3))
	draw_rect(Rect2(x0, top - 14.0, x1 - x0, 16), trim)
	var wx := x0 + 30.0
	while wx < x1:
		_window(Vector2(wx, top + 30.0), Vector2(24, 44), glow, rng.randf() < 0.3, col)
		_window(Vector2(wx, top + 120.0), Vector2(24, 44), glow, rng.randf() < 0.25, col)
		wx += 92.0
	draw_rect(Rect2(x0, base - 292.0, x1 - x0, 10), trim)
	var cx := x0
	while cx < x1:
		var w := 150.0
		var shop := rng.randf() < 0.65
		var hue: Color = glow.lerp(Color(1.0, 0.86, 0.62), rng.randf())
		_arch(Vector2(cx + w * 0.5, base), w - 26.0, 270.0, hue if shop else Color(0, 0, 0, 0), col.darkened(0.5))
		if shop:
			draw_rect(Rect2(cx + 30, base - 206.0, w - 60, 14), Color(hue, 0.4))
		Art.grad_rect_h(self, Rect2(cx - 13, base - 282.0, 26, 282), col.lightened(0.14), col.darkened(0.15))
		draw_rect(Rect2(cx - 17, base - 288.0, 34, 8), trim)
		cx += w
	_haze(th.fog, base - 160.0, 300.0, 0.3)


func _garden() -> void:
	var col: Color = th.mid
	var x := x0
	while x < x1:
		var r := rng.randf()
		if r < 0.55:
			_tree(Vector2(x, base), rng.randf_range(0.8, 1.3), col)
		elif r < 0.78:
			_palm(Vector2(x, base), rng.randf_range(0.9, 1.25), col)
		else:
			_statue_sil(Vector2(x, base), col.lightened(0.1))
		x += rng.randf_range(170.0, 300.0)
	var hx := x0
	while hx < x1:
		draw_circle(Vector2(hx, base - 18.0), 34.0, col.darkened(0.15))
		hx += 40.0
	draw_rect(Rect2(x0, base - 18.0, x1 - x0, 1700.0), col.darkened(0.15))
	_haze(th.fog, base - 200.0, 360.0, 0.4)


func _factory() -> void:
	var col: Color = th.mid
	var glow: Color = th.mid_glow
	var x := x0
	while x < x1:
		var w := rng.randf_range(600.0, 900.0)
		var h := rng.randf_range(260.0, 320.0)
		var top := base - h
		Art.grad_rect(self, Rect2(x, top, w, h + 1600.0), col.lightened(0.07), col.darkened(0.22))
		draw_rect(Rect2(x, top - 40.0, w, 28), col.darkened(0.25))
		draw_rect(Rect2(x - 10, top - 12.0, w + 20, 14), col.lightened(0.15))
		var wx := x + 40.0
		while wx < x + w - 60.0:
			_arch(Vector2(wx + 30.0, base - 40.0), 52.0, 150.0, glow if rng.randf() < 0.35 else Color(0, 0, 0, 0), col.darkened(0.4))
			_window(Vector2(wx + 18.0, top + 30.0), Vector2(22, 34), glow, rng.randf() < 0.2, col)
			wx += 110.0
		x += w + rng.randf_range(80.0, 200.0)
		for k in rng.randi_range(1, 3):
			_cypress(Vector2(x - rng.randf_range(20.0, 70.0), base), rng.randf_range(0.8, 1.2), col.darkened(0.15))
	_haze(th.fog, base - 200.0, 380.0, 0.45)


func _colonnade() -> void:
	var col: Color = th.mid
	var glow: Color = th.mid_glow
	var top := base - 700.0
	draw_rect(Rect2(x0, top, x1 - x0, 1800.0), col.darkened(0.25))
	draw_rect(Rect2(x0, top, x1 - x0, 60), col.lightened(0.06))
	draw_rect(Rect2(x0, top + 60.0, x1 - x0, 10), col.lightened(0.16))
	var x := x0
	var i := 0
	while x < x1:
		var span := 300.0
		_niche(Vector2(x + span * 0.5, base - 40.0), col, glow)
		if i % 2 == 0:
			_banner_static(Vector2(x + span * 0.5, top + 70.0))
		draw_circle(Vector2(x + 52.0, base - 330.0), 40.0, Color(glow, 0.12))
		draw_circle(Vector2(x + 52.0, base - 330.0), 7.0, Color(glow, 0.9))
		_column(Vector2(x, base), 64.0, 640.0, col.lightened(0.05))
		x += span
		i += 1
	_haze(th.fog, base - 160.0, 300.0, 0.35)


# ================================================================ Primo piano (scuro, davanti al gioco)

## Linea di terra del primo piano: un po' sotto il pavimento, così non copre personaggi e nemici.
func _fg_ground() -> float:
	return base + 78.0


func _fg_railing() -> void:
	var col: Color = th.fg
	var gb := _fg_ground()
	var x := x0 + rng.randf_range(100.0, 400.0)
	while x < x1:
		var length := rng.randf_range(260.0, 520.0)
		var y := gb - 76.0
		draw_rect(Rect2(x - 10, gb - 14.0, length + 20, 1000), col)
		draw_rect(Rect2(x, y, length, 5), col)
		draw_rect(Rect2(x, y + 44.0, length, 5), col)
		var px := x
		while px < x + length:
			draw_rect(Rect2(px, y - 8.0, 4, gb - 14.0 - (y - 8.0)), col)
			draw_colored_polygon(PackedVector2Array([Vector2(px - 3, y - 8), Vector2(px + 7, y - 8), Vector2(px + 2, y - 22)]), col)
			px += 16.0
		if rng.randf() < 0.35:
			_fg_lamp(Vector2(x + length + 40.0, gb))
		x += length + rng.randf_range(900.0, 1500.0)


func _fg_lamp(bc: Vector2) -> void:
	var col: Color = th.fg
	draw_rect(Rect2(bc.x - 6, bc.y - 560.0, 12, 1200), col)
	draw_colored_polygon(PackedVector2Array([bc + Vector2(-22, -560), bc + Vector2(22, -560), bc + Vector2(28, -610), bc + Vector2(-28, -610)]), col)
	draw_colored_polygon(PackedVector2Array([bc + Vector2(-34, -610), bc + Vector2(34, -610), bc + Vector2(0, -640)]), col)
	draw_circle(bc + Vector2(0, -585), 60.0, Color(th.lamp, 0.12))
	draw_rect(Rect2(bc.x - 14, bc.y - 600.0, 28, 34), Color(th.lamp, 0.7))


func _fg_awnings() -> void:
	var col: Color = th.fg
	var x := x0
	while x < x1:
		var span := rng.randf_range(500.0, 900.0)
		var y := base - 760.0 + rng.randf_range(-60.0, 60.0)
		var pts := PackedVector2Array()
		for k in 21:
			var t := float(k) / 20.0
			pts.append(Vector2(lerpf(x, x + span, t), y + sin(t * PI) * 70.0))
		draw_polyline(pts, col, 2.5, true)
		for k in range(2, 20, 3):
			var p := pts[k] + Vector2(0, 9)
			draw_circle(p, 18.0, Color(th.lamp, 0.14))
			draw_circle(p, 5.0, Color(th.lamp, 0.95))
		x += span + rng.randf_range(300.0, 700.0)
	var gb := _fg_ground()
	var bx := x0 + 200.0
	while bx < x1:
		draw_rect(Rect2(bx, gb - 70.0, 90, 1000), col)
		draw_rect(Rect2(bx + 96.0, gb - 44.0, 70, 1000), col)
		draw_circle(Vector2(bx + 220.0, gb - 16.0), 46.0, col)
		bx += rng.randf_range(900.0, 1500.0)


func _fg_foliage() -> void:
	var col: Color = th.fg
	var x := x0 + 150.0
	while x < x1:
		var root := Vector2(x, _fg_ground() + 60.0)
		for k in 9:
			var a := lerpf(-PI * 0.92, -PI * 0.08, float(k) / 8.0) + rng.randf_range(-0.1, 0.1)
			var length := rng.randf_range(110.0, 210.0)
			var dir := Vector2(cos(a), sin(a))
			var tip := root + dir * length
			var n := Vector2(-dir.y, dir.x) * length * 0.16
			var mid := root.lerp(tip, 0.45)
			draw_colored_polygon(PackedVector2Array([root, mid + n, tip, mid - n]), col)
		x += rng.randf_range(500.0, 1000.0)
	var vx := x0 + 80.0
	while vx < x1:
		var top := base - 1250.0
		var length := rng.randf_range(300.0, 650.0)
		var pts := PackedVector2Array()
		for k in 16:
			var t := float(k) / 15.0
			pts.append(Vector2(vx + sin(t * 5.0 + vx) * 12.0, top + t * length))
		draw_polyline(pts, col, 3.0, true)
		for k in range(1, 16, 2):
			draw_colored_polygon(_leaf(pts[k], PI * 0.5 + rng.randf_range(-1.0, 1.0), 18.0), col)
		vx += rng.randf_range(300.0, 700.0)


func _fg_grass() -> void:
	var col: Color = th.fg
	var gb := _fg_ground() + 40.0
	var x := x0 + 100.0
	while x < x1:
		for k in 16:
			var bx := x + rng.randf_range(-40.0, 40.0)
			var h := rng.randf_range(60.0, 150.0)
			var lean := rng.randf_range(-30.0, 30.0)
			draw_colored_polygon(PackedVector2Array([Vector2(bx - 4, gb), Vector2(bx + 4, gb), Vector2(bx + lean, gb - h)]), col)
		draw_rect(Rect2(x - 50, gb - 4.0, 100, 1000), col)
		x += rng.randf_range(400.0, 900.0)


func _fg_columns() -> void:
	var col: Color = th.fg
	var x := x0 + rng.randf_range(200.0, 600.0)
	while x < x1:
		Art.grad_rect_h(self, Rect2(x, base - 2200.0, 120, 3400), col.lightened(0.06), col)
		draw_rect(Rect2(x - 20, _fg_ground() - 30.0, 160, 1000), col)
		var cy := base - 1300.0
		var chain_x := x + rng.randf_range(300.0, 500.0)
		while cy < base - 700.0:
			draw_arc(Vector2(chain_x, cy), 7.0, 0.0, TAU, 10, col, 3.0)
			cy += 12.0
		x += rng.randf_range(1100.0, 1600.0)


# ================================================================ Raggi di luce (additivi)

func _shafts() -> void:
	var light: Color = th.get("shaft", th.moon_color)
	var x := x0
	while x < x1:
		var tw := rng.randf_range(50.0, 140.0)
		var bw := tw * rng.randf_range(2.0, 3.2)
		var slant := rng.randf_range(120.0, 260.0)
		var top := base - 950.0
		var bottom := base + 40.0
		var a := rng.randf_range(0.05, 0.11)
		draw_polygon(
			PackedVector2Array([Vector2(x, top), Vector2(x + tw, top), Vector2(x + slant + bw, bottom), Vector2(x + slant, bottom)]),
			PackedColorArray([Color(light, a), Color(light, a), Color(light, 0.0), Color(light, 0.0)]))
		x += rng.randf_range(260.0, 620.0)


# ================================================================ Elementi riusabili

func _haze(color: Color, top: float, height: float, alpha: float) -> void:
	Art.grad_rect(self, Rect2(x0, top, x1 - x0, height), Color(color, 0.0), Color(color, alpha))
	draw_rect(Rect2(x0, top + height, x1 - x0, 1600.0), Color(color, alpha))


func _windows(x: float, top: float, w: float, h: float, glow: Color, chance: float, size: Vector2, step: Vector2) -> void:
	var cols := int((w - 16.0) / step.x)
	var rows := int((h - 30.0) / step.y)
	for ry in rows:
		for cx in cols:
			if rng.randf() < chance:
				draw_rect(Rect2(Vector2(x + 12.0 + cx * step.x, top + 18.0 + ry * step.y), size), Color(glow, rng.randf_range(0.35, 0.95)))


func _arch(bc: Vector2, w: float, h: float, glow: Color, dark: Color) -> void:
	var r := w * 0.5
	var spring := bc.y - h + r
	var rect := Rect2(bc.x - r, spring, w, bc.y - spring)
	draw_rect(rect, dark)
	draw_circle(Vector2(bc.x, spring), r, dark)
	if glow.a > 0.0:
		Art.grad_rect(self, rect, Color(glow, 0.15), Color(glow, 0.7))
		draw_circle(Vector2(bc.x, spring), r, Color(glow, 0.12))
		draw_circle(Vector2(bc.x, bc.y), r * 1.3, Color(glow, 0.06))
	draw_arc(Vector2(bc.x, spring), r + 3.0, PI, TAU, 16, dark.lightened(0.3), 4.0)


func _window(p: Vector2, s: Vector2, glow: Color, lit: bool, body: Color) -> void:
	draw_rect(Rect2(p - Vector2(3, 3), s + Vector2(6, 6)), body.lightened(0.1))
	if lit:
		Art.grad_rect(self, Rect2(p, s), Color(glow, 0.95), Color(glow.darkened(0.35), 0.9))
		draw_line(Vector2(p.x + s.x * 0.5, p.y), Vector2(p.x + s.x * 0.5, p.y + s.y), body.darkened(0.35), 2.0)
		draw_line(Vector2(p.x, p.y + s.y * 0.4), Vector2(p.x + s.x, p.y + s.y * 0.4), body.darkened(0.35), 2.0)
		draw_circle(p + s * 0.5, s.y * 1.1, Color(glow, 0.05))
	else:
		draw_rect(Rect2(p, s), body.darkened(0.5))
		draw_rect(Rect2(p.x - 9, p.y, 8, s.y), body.darkened(0.12))
		draw_rect(Rect2(p.x + s.x + 1, p.y, 8, s.y), body.darkened(0.12))
	draw_rect(Rect2(p.x - 5, p.y + s.y + 2.0, s.x + 10.0, 4), body.lightened(0.15))


func _tree(pos: Vector2, s: float, col: Color) -> void:
	var h := 200.0 * s
	draw_colored_polygon(PackedVector2Array([pos + Vector2(-13 * s, 0), pos + Vector2(13 * s, 0), pos + Vector2(5 * s, -h), pos + Vector2(-5 * s, -h)]), col.darkened(0.2))
	var crown := pos + Vector2(0, -h - 30.0 * s)
	for k in 7:
		var off := Vector2(rng.randf_range(-70.0, 70.0), rng.randf_range(-50.0, 40.0)) * s
		draw_circle(crown + off, rng.randf_range(45.0, 78.0) * s, col.lightened(rng.randf_range(0.0, 0.06)))
	for k in 3:
		var off := Vector2(rng.randf_range(-60.0, 10.0), rng.randf_range(-60.0, -20.0)) * s
		draw_circle(crown + off, rng.randf_range(20.0, 36.0) * s, Color(col.lightened(0.14), 0.6))
	draw_arc(crown + Vector2(-10, -10) * s, 80.0 * s, PI * 1.05, PI * 1.6, 16, Color(th.moon_color, 0.1), 7.0)


func _palm(pos: Vector2, s: float, col: Color) -> void:
	var h := 270.0 * s
	var bend := rng.randf_range(-50.0, 50.0) * s
	var pts := PackedVector2Array()
	for k in 13:
		var t := float(k) / 12.0
		pts.append(pos + Vector2(bend * t * t, -h * t))
	draw_polyline(pts, col.darkened(0.15), 12.0 * s, true)
	var top := pts[pts.size() - 1]
	for k in 8:
		var a := -PI * 0.5 + (float(k) - 3.5) * 0.42
		var frond := PackedVector2Array()
		for j in 9:
			var t := float(j) / 8.0
			frond.append(top + Vector2(cos(a), sin(a)) * 110.0 * s * t + Vector2(0, 70.0 * s * t * t))
		draw_polyline(frond, col.lightened(0.04), 7.0 * s, true)


func _cypress(pos: Vector2, s: float, col: Color) -> void:
	var pts := PackedVector2Array()
	for k in 21:
		var a := TAU * float(k) / 20.0
		var y := -cos(a) * 150.0 * s - 150.0 * s
		var w := sin(a) * 26.0 * s * (0.4 + 0.6 * clampf((y + 300.0 * s) / (300.0 * s), 0.0, 1.0))
		pts.append(pos + Vector2(w, y))
	draw_colored_polygon(pts, col)


func _statue_sil(pos: Vector2, col: Color) -> void:
	draw_rect(Rect2(pos.x - 30, pos.y - 70.0, 60, 70), col.darkened(0.1))
	draw_rect(Rect2(pos.x - 36, pos.y - 76.0, 72, 8), col)
	draw_colored_polygon(PackedVector2Array([pos + Vector2(-16, -76), pos + Vector2(16, -76), pos + Vector2(12, -160), pos + Vector2(-10, -160)]), col)
	draw_circle(pos + Vector2(1, -172), 12.0, col)
	draw_line(pos + Vector2(10, -150), pos + Vector2(30, -200), col, 7.0)


func _column(bc: Vector2, w: float, h: float, col: Color) -> void:
	var left := bc.x - w * 0.5
	var lit := col.lightened(0.16)
	var dark := col.darkened(0.3)
	Art.grad_rect_h(self, Rect2(left, bc.y - h, w * 0.5, h), dark, lit)
	Art.grad_rect_h(self, Rect2(bc.x, bc.y - h, w * 0.5, h), lit, dark)
	var fx := left + 8.0
	while fx < left + w - 6.0:
		draw_line(Vector2(fx, bc.y - h + 26.0), Vector2(fx, bc.y - 30.0), Color(0, 0, 0, 0.18), 2.0)
		fx += 9.0
	draw_rect(Rect2(left - 12, bc.y - h - 4.0, w + 24, 20), lit)
	draw_circle(Vector2(left - 6, bc.y - h + 10.0), 9.0, lit)
	draw_circle(Vector2(left + w + 6, bc.y - h + 10.0), 9.0, lit)
	draw_rect(Rect2(left - 14, bc.y - 28.0, w + 28, 28), lit.darkened(0.1))
	draw_rect(Rect2(left - 8, bc.y - 38.0, w + 16, 10), lit)


func _niche(bc: Vector2, col: Color, glow: Color) -> void:
	var w := 120.0
	var h := 300.0
	var spring := bc.y - h + w * 0.5
	draw_rect(Rect2(bc.x - w * 0.5, spring, w, bc.y - spring), col.darkened(0.55))
	draw_circle(Vector2(bc.x, spring), w * 0.5, col.darkened(0.55))
	Art.grad_rect(self, Rect2(bc.x - w * 0.5, spring, w, bc.y - spring), Color(glow, 0.0), Color(glow, 0.12))
	_statue_sil(bc, col.lightened(0.22))


func _banner_static(top: Vector2) -> void:
	var red := Color(0.32, 0.05, 0.06)
	var gold := Color(0.75, 0.55, 0.25)
	draw_colored_polygon(PackedVector2Array([top + Vector2(-34, 0), top + Vector2(34, 0), top + Vector2(34, 190), top + Vector2(0, 220), top + Vector2(-34, 190)]), red)
	draw_rect(Rect2(top.x - 34, top.y, 68, 6), gold)
	draw_line(top + Vector2(-28, 8), top + Vector2(-28, 188), Color(gold, 0.6), 2.0)
	draw_line(top + Vector2(28, 8), top + Vector2(28, 188), Color(gold, 0.6), 2.0)
	draw_circle(top + Vector2(0, 80), 16.0, Color(gold, 0.8))
	draw_circle(top + Vector2(0, 80), 10.0, red)


func _leaf(p: Vector2, a: float, size: float) -> PackedVector2Array:
	var d := Vector2(cos(a), sin(a))
	var n := Vector2(-d.y, d.x)
	return PackedVector2Array([p, p + d * size * 0.5 + n * size * 0.25, p + d * size, p + d * size * 0.5 - n * size * 0.25])
