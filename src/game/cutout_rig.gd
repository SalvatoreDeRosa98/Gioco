class_name CutoutRig
extends Node2D
## Ferruccio come pupazzo a ritaglio: i pezzi del dipinto originale (tagliati e completati da
## tools/art/cutout_ferruccio.py) ruotano attorno alle loro articolazioni, come in Rayman Legends
## o Child of Light, invece di stirare un'unica immagine.
##
## Le animazioni sono pose chiave in data/ferruccio_anim.json (tools/art/cutout_anims.py) e
## vengono campionate a scatti, 12 pose al secondo per i movimenti e più fitte per i colpi,
## per avere la resa di un'animazione disegnata. Sciarpa a catena con molle che seguono la velocità.
##
## Stessa interfaccia di sprite_rig.gd verso player.gd: [method select_state], [method advance],
## [method make_ghost] e le proprietà facing, flash, spin, ambient.

const RIG_PATH := "res://assets/art/characters/ferruccio_cutout/"
const ANIM_PATH := "res://data/ferruccio_anim.json"
## Altezza della figura dipinta in pixel della tela, dai piedi alla punta del cappello.
const CANVAS_HEIGHT := 1004.0
## Altezza del centro del corpo sopra i piedi (pixel della tela): perno della capriola.
const SPIN_CENTER := 420.0
## Pose al secondo per le azioni guidate dall'avanzamento (colpi, martello, capriola).
const ACTION_FPS := 24.0
const POSE_BONES := ["torso", "neck", "shoulder", "elbow", "wrist", "thigh", "knee", "ankle",
	"shoulder_f", "elbow_f", "wrist_f", "thigh_f", "knee_f", "ankle_f", "scarf1", "scarf2", "scarf3"]

var height := 84.0
## Cartella del pupazzo: v1 (dipinto originale) o v2 (arte approvata 02/07/08), scelta da tuning.json
## ("player.rig_dir"); le texture v1 restano come ripiego.
var rig_path := RIG_PATH
var facing := 1.0
var flash := 0.0
var spin := 0.0
var ambient := Color.WHITE
var light_color := Color.WHITE
var light_dir := Vector2.ZERO
var ambient_amount := 0.3

var _rig: Dictionary
var _clips: Dictionary
var _bones := {}
var _rest := {}
var _spin_node: Node2D
var _body: Node2D
var _factor := 1.0
var _clip := "idle"
var _clip_t := 0.0
var _progress := -1.0
var _action_len := 0.3
var _speed_scale := 1.0
var _squash := 0.0
var _vel := Vector2.ZERO
var _time := 0.0
var _scarf := [0.0, 0.0, 0.0]
var _scarf_v := [0.0, 0.0, 0.0]
var _weapon_sprite: Sprite2D
var _sword_texture: Texture2D
var _hammer_texture: Texture2D
var _head_sprite: Sprite2D
var _masked_head: Texture2D
var _bare_head: Texture2D
var _human_head: Texture2D
var _scarf_sprites: Array[Sprite2D] = []
## Clip a fotogrammi interi (rig v2: corsa e attacco disegnati), al posto dei pezzi.
var _frame_clips: Dictionary = {}
var _frame_sprite: Sprite2D
var _frame_textures := {}


func _ready() -> void:
	_rig = JSON.parse_string(FileAccess.get_file_as_string(rig_path + "rig.json"))
	_clips = JSON.parse_string(FileAccess.get_file_as_string(ANIM_PATH)).clips
	_factor = height / CANVAS_HEIGHT
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_spin_node = Node2D.new()
	_spin_node.position = Vector2(0, -SPIN_CENTER * _factor)
	_spin_node.use_parent_material = true
	add_child(_spin_node)
	_body = Node2D.new()
	_body.position = Vector2(0, SPIN_CENTER * _factor)
	_body.scale = Vector2.ONE * _factor
	# La luce è già dipinta: le luci 2D della scena non devono bruciare la tunica.
	var painted := CanvasItemMaterial.new()
	painted.light_mode = CanvasItemMaterial.LIGHT_MODE_UNSHADED
	_body.material = painted
	_spin_node.add_child(_body)
	for name in _rig.bones:
		_make_bone(name)
	var far_tint: Array = _rig.far_tint
	for spr in _rig.sprites:
		var piece: Dictionary = _rig.pieces[spr.piece]
		var bone: Dictionary = _rig.bones[spr.bone]
		var s := Sprite2D.new()
		s.texture = load(rig_path + piece.file)
		s.centered = false
		s.position = Vector2(piece.pos[0], piece.pos[1]) - Vector2(bone.pivot[0], bone.pivot[1])
		s.z_index = int(spr.z)
		s.use_parent_material = true
		if spr.far:
			s.self_modulate = Color(far_tint[0], far_tint[1], far_tint[2])
		_bones[spr.bone].add_child(s)
		if spr.piece == "testa":
			_head_sprite = s
			_masked_head = s.texture
		if str(spr.piece).begins_with("sciarpa") or spr.piece == "nodo":
			_scarf_sprites.append(s)
		if spr.piece == "mano" and spr.bone == "wrist":
			_weapon_sprite = s
			_sword_texture = s.texture
	if ResourceLoader.exists(rig_path + "mano_martello.png"):
		_hammer_texture = load(rig_path + "mano_martello.png")
	elif ResourceLoader.exists(rig_path + "martello.png"):
		_hammer_texture = load(rig_path + "martello.png")
	_update_weapon()
	if ResourceLoader.exists(rig_path + "testa_umana.png"):
		_human_head = load(rig_path + "testa_umana.png")
	if ResourceLoader.exists(rig_path + "testa_senza_sciarpa.png"):
		_bare_head = load(rig_path + "testa_senza_sciarpa.png")
	_frame_clips = _rig.get("frame_clips", {})
	if not _frame_clips.is_empty():
		_frame_sprite = Sprite2D.new()
		_frame_sprite.centered = false
		_frame_sprite.region_enabled = true
		_frame_sprite.visible = false
		_frame_sprite.material = painted
		_spin_node.add_child(_frame_sprite)
		for clip in _frame_clips:
			var atlas := str(_frame_clips[clip].atlas)
			if not _frame_textures.has(atlas):
				_frame_textures[atlas] = load(rig_path + atlas)
	set_story_appearance(false, false)
	_apply(_sample("idle", 0.0))

## La sciarpa compare solo col dono di Agnese; Gaetano restituisce il volto umano.
func set_story_appearance(scarf: bool, identity: bool) -> void:
	for sprite in _scarf_sprites:
		sprite.visible = scarf
	if _head_sprite == null:
		return
	var texture := _human_head if identity and _human_head != null else (_bare_head if not scarf and _bare_head != null else _masked_head)
	_head_sprite.texture = texture
	_head_sprite.scale = _masked_head.get_size() / texture.get_size()


func _make_bone(name: String) -> Node2D:
	if _bones.has(name):
		return _bones[name]
	var cfg: Dictionary = _rig.bones[name]
	var node := Node2D.new()
	node.name = name
	node.use_parent_material = true
	var pivot := Vector2(cfg.pivot[0], cfg.pivot[1])
	if cfg.parent == null:
		node.position = Vector2.ZERO
		_body.add_child(node)
	else:
		var parent := _make_bone(cfg.parent)
		var pp: Array = _rig.bones[cfg.parent].pivot
		node.position = pivot - Vector2(pp[0], pp[1])
		parent.add_child(node)
	_bones[name] = node
	_rest[name] = node.position
	return node


## Sceglie la clip dallo stato del giocatore; colpi, martello e capriola seguono il tempo
## effettivo delle hitbox invece di un orologio proprio.
func select_state(player: Node, running: bool) -> void:
	set_story_appearance(player.scarf_unlocked, player.identity_restored)
	var clip := "idle"
	var progress := -1.0
	var length := 0.3
	if player.dead:
		clip = "death"
	elif player.hammer_time > 0:
		clip = "hammer"
		length = float(player._cfg.hammer_time)
		progress = 1.0 - player.hammer_time / length
	elif player.attacking > 0:
		clip = "pogo" if player.attack_down else ("slash_a" if player.slash_side > 0 else "slash_b")
		length = float(player._cfg.attack_time)
		progress = 1.0 - player.attacking / length
	elif player.parry_window > 0:
		clip = "parry"
	elif player._flash > 0.7:
		clip = "hurt"
	elif player.grapple_anchor != Vector2.INF:
		clip = "grapple"
	elif player.wall_gripping:
		clip = "wall"
	elif player._heal_t > 0:
		clip = "heal"
	elif player.dashing:
		clip = "dash"
	elif player._spin_t >= 0:
		clip = "double_jump"
		length = float(player._cfg.double_jump_spin_time)
		progress = player._spin_t / length
	elif not player.grounded:
		clip = "rise" if player.move_vel.y < 0 else "fall"
	elif bool(player.get("crouching")):
		clip = "crouch"
	elif player._skid_t > 0:
		clip = "skid"
	elif running:
		clip = "run"
	if clip != _clip:
		_clip = clip
		_clip_t = 0.0
		_update_weapon()
	_progress = progress
	_action_len = length
	_squash = float(player._squash)
	_speed_scale = clampf(absf(player.move_vel.x) / float(player._cfg.speed), 0.5, 1.4) if clip == "run" else 1.0


## Nome della clip in corso (per test e strumenti di sviluppo).
func current_clip() -> String:
	return _clip


func _update_weapon() -> void:
	if _weapon_sprite == null or _hammer_texture == null or _sword_texture == null:
		return
	if _clip == "hammer":
		if _weapon_sprite.texture != _hammer_texture:
			_weapon_sprite.texture = _hammer_texture
	else:
		if _weapon_sprite.texture != _sword_texture:
			_weapon_sprite.texture = _sword_texture


## Avanza la clip, applica la posa e il moto secondario della sciarpa.
func advance(delta: float, velocity: Vector2) -> void:
	_update_weapon()
	_time += delta
	_clip_t += delta * _speed_scale
	_vel = velocity
	var cfg: Dictionary = _clips[_clip]
	var t: float
	if cfg.progress and _progress >= 0.0:
		var steps := maxf(4.0, roundf(_action_len * ACTION_FPS))
		t = floorf(clampf(_progress, 0.0, 1.0) * steps) / steps * float(cfg.length)
	else:
		t = _clip_t
		if cfg.loop and float(cfg.length) > 0.0:
			t = fmod(t, float(cfg.length))
		var fps := float(cfg.fps)
		t = floorf(t * fps + 0.0001) / fps
	var pose := _sample(_clip, t)
	_update_scarf(delta)
	_apply(pose)
	_update_frames(t, float(cfg.length))
	scale.x = facing
	_spin_node.rotation = spin
	_body.scale = Vector2(_factor * (1.0 - _squash * 0.6), _factor * (1.0 + _squash))
	var lift := float(_rig.get("brightness", 1.0))
	_body.modulate = (Color.WHITE * Color(lift, lift, lift)).lerp(ambient, ambient_amount * 0.5).lerp(Color(1.8, 1.8, 1.8), flash)
	if _frame_sprite and _frame_sprite.visible:
		_frame_sprite.modulate = _body.modulate
		var k: float = _factor * float(_frame_clips[_clip].canvas_per_px)
		_frame_sprite.scale = Vector2(k * (1.0 - _squash * 0.6), k * (1.0 + _squash))


## Rig v2: corsa e colpi usano i fotogrammi interi disegnati; la sciarpa e il resto del pupazzo
## restano per le altre 15 clip. Ancora del fotogramma = piedi, come la radice del pupazzo.
func _update_frames(t: float, length: float) -> void:
	if _frame_sprite == null:
		return
	var use := _frame_clips.has(_clip)
	_frame_sprite.visible = use
	_body.visible = not use
	if not use:
		return
	var fc: Dictionary = _frame_clips[_clip]
	var frames: Array = fc.frames
	var u: float
	if bool(fc.get("progress", false)) and _progress >= 0.0:
		u = clampf(_progress, 0.0, 0.999)
	else:
		u = fmod(_clip_t * float(fc.get("fps", 12)) / frames.size(), 1.0)
	var f: Array = frames[mini(int(u * frames.size()), frames.size() - 1)]
	_frame_sprite.texture = _frame_textures[str(fc.atlas)]
	_frame_sprite.region_rect = Rect2(f[0], f[1], f[2], f[3])
	_frame_sprite.offset = Vector2(-float(f[4]), -float(f[5]))
	_frame_sprite.position = _body.position


## Clip mostrata a fotogrammi interi (per test e strumenti).
func uses_frames() -> bool:
	return _frame_sprite != null and _frame_sprite.visible


## Posa della clip all'istante t (secondi della clip): interpolazione tra le chiavi vicine.
func _sample(clip_name: String, t: float) -> Dictionary:
	var keys: Array = _clips[clip_name].keys
	if t <= float(keys[0].t):
		return keys[0].pose
	for i in keys.size() - 1:
		var a: Dictionary = keys[i]
		var b: Dictionary = keys[i + 1]
		if t <= float(b.t):
			var u := (t - float(a.t)) / maxf(float(b.t) - float(a.t), 0.0001)
			return _mix(a.pose, b.pose, _ease(u, str(a.ease)))
	return keys[keys.size() - 1].pose


static func _ease(u: float, kind: String) -> float:
	match kind:
		"step":
			return 0.0
		"in":
			return u * u
		"out":
			return 1.0 - (1.0 - u) * (1.0 - u)
		_:
			return u * u * (3.0 - 2.0 * u)


static func _mix(a: Dictionary, b: Dictionary, u: float) -> Dictionary:
	var out := {}
	for k in a:
		out[k] = lerpf(float(a[k]), float(b.get(k, 0.0)), u)
	for k in b:
		if not out.has(k):
			out[k] = lerpf(0.0, float(b[k]), u)
	return out


func _apply(pose: Dictionary) -> void:
	for name in POSE_BONES:
		if _bones.has(name):
			var extra := 0.0
			if name.begins_with("scarf"):
				extra = _scarf[int(name.right(1)) - 1]
			_bones[name].rotation = deg_to_rad(float(pose.get(name, 0.0)) + extra)
	_bones["hips"].position = _rest["hips"] + Vector2(float(pose.get("hips_x", 0.0)), float(pose.get("hips_y", 0.0)))
	_bones["root"].position = Vector2(float(pose.get("root_x", 0.0)), float(pose.get("root_y", 0.0)))
	_bones["root"].rotation = deg_to_rad(float(pose.get("root_rot", 0.0)))


## Sciarpa: tre molle in catena. Correndo e cadendo si solleva all'indietro, saltando ricade;
## ondeggia di più quanto più si va veloci. Positivo = coda più alta.
func _update_scarf(delta: float) -> void:
	var run := clampf(absf(_vel.x) / 270.0, 0.0, 1.4)
	var lift := run * 24.0 + clampf(_vel.y / 600.0, -1.0, 1.0) * 16.0
	for i in 3:
		var flutter: float = sin(_time * (7.0 + i * 2.3) + i * 1.7) * (2.0 + run * 7.0) * (0.5 + i * 0.4)
		var target: float = lift * (0.45 + i * 0.3) + flutter
		var follow: float = _scarf[i - 1] * 0.35 if i > 0 else 0.0
		var acc: float = (target + follow - _scarf[i]) * (70.0 - i * 15.0) - _scarf_v[i] * (9.0 - i * 1.5)
		_scarf_v[i] += acc * delta
		_scarf[i] = clampf(_scarf[i] + _scarf_v[i] * delta, -25.0, 70.0)


## Copia statica della posa corrente per la scia dello scatto.
func make_ghost(color: Color) -> Node2D:
	var holder := Node2D.new()
	holder.scale = Vector2(facing, 1.0)
	var copy := _spin_node.duplicate(0) as Node2D
	holder.add_child(copy)
	holder.modulate = color
	holder.texture_filter = texture_filter
	return holder
