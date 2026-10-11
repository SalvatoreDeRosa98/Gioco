extends Control
## Barra della vita del boss (Cavaliere Borbonico, Ratking) in alto al centro, su un CanvasLayer
## dedicato sopra a tutto il resto (vedi world.BOSS_BAR_LAYER). Solo visualizzazione.

## Nome mostrato sopra la barra per ogni tipo di boss.
const NAMES := {"custode": "CAVALIERE BORBONICO", "ratking": "RATKING \u00b7 IL FIGLIO DELLE CISTERNE"}
const WIDTH := 620.0
const TOP := 62.0

var world
var _t := -1.0


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS


## Nome del boss attuale come appare a schermo ("" se non c'è un boss).
func boss_title() -> String:
	var boss = world.boss() if world else null
	return "" if boss == null else str(NAMES.get(boss.kind, str(boss.kind).to_upper()))


func _process(delta: float) -> void:
	var boss = world.boss() if world else null
	if boss == null:
		_t = -1.0
	else:
		_t = maxf(_t, 0.0) + delta
	queue_redraw()


func _draw() -> void:
	var boss = world.boss() if world else null
	if boss == null or _t < 0.0:
		return
	var vp := get_viewport_rect().size
	var a := minf(1.0, _t / 1.2)
	var x := (vp.x - WIDTH) * 0.5
	var y := TOP
	Art.grad_rect(self, Rect2(0, 0, vp.x, y + 40.0), Color(0, 0, 0, 0.5 * a), Color(0, 0, 0, 0))
	Art.text(self, Art.title_wide(), Vector2(0, y - 16.0), boss_title(), 22, Color(Art.CREMA, a), HORIZONTAL_ALIGNMENT_CENTER, vp.x)
	var frac := clampf(float(boss.hp) / maxf(1.0, float(boss.max_hp)), 0.0, 1.0)
	draw_rect(Rect2(x - 2, y - 2, WIDTH + 4, 14), Color(0, 0, 0, 0.75 * a))
	Art.grad_rect(self, Rect2(x, y, WIDTH * frac, 10), Color(1.0, 0.72, 0.3, a), Color(0.6, 0.15, 0.08, a))
	draw_rect(Rect2(x - 2, y - 2, WIDTH + 4, 14), Color(Art.OCRA, 0.7 * a), false, 1.0)
	for side in [x - 14.0, x + WIDTH + 14.0]:
		draw_colored_polygon(PackedVector2Array([Vector2(side - 7, y + 5), Vector2(side, y - 2), Vector2(side + 7, y + 5), Vector2(side, y + 12)]), Color(Art.OCRA, a))
