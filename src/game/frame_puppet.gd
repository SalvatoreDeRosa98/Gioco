extends Node2D
## Nemico prototipo a fotogrammi interi (Ratking e Lanterniere v2, assets/art/characters/enemies_v2).
## Stessa interfaccia di npc_painted_puppet.gd (setup/set_action/pose/aim_weapon), così ratking.gd
## ed elite.gd lo scelgono con un flag di tuning.json senza cambiare la logica. Il disegno sta in un
## CanvasGroup con lo shader di contorno e rim light di Ferruccio (white_point 1: palette invariata);
## la tinta dei preavvisi va sullo sprite, dentro il contorno, così il bordo resta scuro e leggibile.

var height := 140.0
var _cfg: Dictionary = {}
var _sprite: Sprite2D
var _group: CanvasGroup
var _action := ""
var _progress := 0.0
var _attack := ""
var _scale := 1.0
var frame := "idle"
var _glow: Sprite2D
var _bob := 0.0


func setup(sheet_json: String, screen_height: float) -> void:
	_cfg = JSON.parse_string(FileAccess.get_file_as_string(sheet_json))
	height = screen_height
	_group = CanvasGroup.new()
	_group.fit_margin = 10.0
	var mat := ShaderMaterial.new()
	mat.shader = preload("res://game/shaders/canvas_rig_outline_v2.gdshader")
	mat.set_shader_parameter("white_point", 1.0)
	mat.set_shader_parameter("highlight_desat", 0.0)
	mat.set_shader_parameter("rim_strength", 0.45)
	# Aspetto per nemico (CONTROLLO-SLICE3): contorno, colore e intensità del rim dal json.
	var look: Dictionary = _cfg.get("look", {})
	for key in look:
		var v = look[key]
		mat.set_shader_parameter(key, Color(str(v)) if v is String else float(v))
	_group.material = mat
	add_child(_group)
	_sprite = Sprite2D.new()
	_sprite.texture = load(sheet_json.get_basename() + ".png")
	_sprite.region_enabled = true
	_sprite.centered = false
	_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_group.add_child(_sprite)
	if _cfg.has("lantern"):
		# Lanterna sempre accesa: alone additivo fuori dal contorno, più forte nel windup.
		var grad := Gradient.new()
		grad.set_color(0, Color(1, 1, 1, 1))
		grad.set_color(1, Color(1, 1, 1, 0))
		var gt := GradientTexture2D.new()
		gt.gradient = grad
		gt.fill = GradientTexture2D.FILL_RADIAL
		gt.fill_from = Vector2(0.5, 0.5)
		gt.fill_to = Vector2(1.0, 0.5)
		gt.width = 128
		gt.height = 128
		_glow = Sprite2D.new()
		_glow.name = "LanternGlow"
		_glow.texture = gt
		var add := CanvasItemMaterial.new()
		add.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
		_glow.material = add
		var r := float(_cfg.lantern.radius)
		_glow.scale = Vector2.ONE * (2.0 * r / 128.0)
		add_child(_glow)
	# altezza in unità di mondo della posa idle (senza margine)
	_scale = height / float(_cfg.idle_px)
	_show("idle", 1.0)


## Tipo d'attacco corrente (Ratking: "claw", "charge", "rats") per scegliere la posa del preavviso.
func set_attack(attack: String) -> void:
	_attack = attack


func set_action(action: String, progress: float = 0.0) -> void:
	_action = action
	_progress = progress


func aim_weapon(_angle: float) -> void:
	pass


func has_frame(n: String) -> bool:
	return _cfg.frames.has(n)


func _pick(time: float, walking: bool) -> String:
	var f: Dictionary = _cfg.frames
	match _action:
		"hurt":
			return "hit" if f.has("hit") else "idle"
		"windup", "cast_windup", "crouch":
			if _attack == "charge" and f.has("charge_windup"):
				return "charge_windup"
			if _attack == "rats" and f.has("rats"):
				return "rats"
			if f.has("windup"):
				return "windup"
			return "claw" if _progress > 0.5 and f.has("claw") else "idle"
		"strike", "cast_strike", "slash_a":
			if _attack == "charge" and f.has("charge"):
				return "charge"
			if _attack == "rats" and f.has("rats"):
				return "rats"
			return "strike" if f.has("strike") else ("claw" if f.has("claw") else "idle")
		"death":
			return "death" if f.has("death") else "idle"
	if walking and _cfg.has("walk_seq"):
		var seq: Array = _cfg.walk_seq
		var i := int(time * float(_cfg.get("walk_fps", 6))) % seq.size()
		_bob = float(_cfg.get("walk_bob", [0])[i % _cfg.get("walk_bob", [0]).size()])
		return str(seq[i])
	if walking and f.has("walk1"):
		var n := 0
		while f.has("walk%d" % (n + 1)):
			n += 1
		return "walk%d" % (int(time * 8.0) % n + 1)
	return "idle"


func _show(n: String, face: float) -> void:
	frame = n
	var r: Array = _cfg.frames[n]
	var m := float(_cfg.margin)
	_sprite.region_rect = Rect2(r[0], r[1], r[2], r[3])
	var flip := face * float(_cfg.faces) < 0
	_sprite.scale = Vector2(-_scale if flip else _scale, _scale)
	# piedi sul punto d'origine, centrato in orizzontale
	_sprite.position = Vector2((r[2] * 0.5) * _scale * (1 if flip else -1), -(r[3] - m) * _scale + _bob * _scale)
	if _glow:
		var pts: Dictionary = _cfg.lantern.points
		var pt: Array = pts.get(n, [0, 0])
		_glow.visible = float(pt[0]) > 0.0
		var lx := float(pt[0]) * _scale * (-1.0 if flip else 1.0)
		_glow.position = _sprite.position + Vector2(lx, float(pt[1]) * _scale)
		var a := float(_cfg.lantern.windup_alpha) if n == "windup" else float(_cfg.lantern.alpha)
		_glow.modulate = Color(Color(str(_cfg.lantern.color)), a)
	if _group.material:
		_group.material.set_shader_parameter("rim_dir", Vector2(-face, -0.4))


func pose(time: float, face: float, tint: Color, _lift: float, _talking: bool, walking: bool) -> void:
	_bob = 0.0
	_show(_pick(time, walking), face)
	_sprite.modulate = tint
	# respiro leggero da fermo
	scale.y = 1.0 + (0.012 * sin(time * 2.4) if _action == "" and not walking else 0.0)
