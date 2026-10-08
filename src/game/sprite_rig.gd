extends Node2D
## Fotogrammi 2D renderizzati dal modello Blender: l'origine resta ancorata ai piedi.
const ROOT := "res://assets/art/characters/ferruccio_frames/"
var height := 84.0
var facing := 1.0
var flash := 0.0
var spin := 0.0 # La capriola è già inclusa nei fotogrammi.
var ambient := Color.WHITE
var light_color := Color.WHITE
var light_dir := Vector2.ZERO
var ambient_amount := 0.3
var sprite: AnimatedSprite2D
var _meta: Dictionary
var _factor := 1.0

func _ready() -> void:
	_meta = JSON.parse_string(FileAccess.get_file_as_string(ROOT + "animations.json"))
	_factor = height / float(_meta.height_pixels)
	var frames := SpriteFrames.new()
	frames.remove_animation("default")
	for clip in _meta.clips:
		var cfg: Dictionary = _meta.clips[clip]
		frames.add_animation(clip)
		frames.set_animation_speed(clip, cfg.fps)
		frames.set_animation_loop(clip, cfg.loop)
		var atlas: Texture2D = load(ROOT + clip + ".png")
		for i in int(cfg.frames):
			var texture := AtlasTexture.new()
			texture.atlas = atlas
			texture.region = Rect2((i % int(cfg.columns)) * int(_meta.size), (i / int(cfg.columns)) * int(_meta.size), _meta.size, _meta.size)
			frames.add_frame(clip, texture)
	sprite = AnimatedSprite2D.new()
	# L'illuminazione è già dipinta nel render; le luci 2D non devono bruciare la tunica.
	var painted := CanvasItemMaterial.new()
	painted.light_mode = CanvasItemMaterial.LIGHT_MODE_UNSHADED
	sprite.material = painted
	sprite.sprite_frames = frames
	sprite.centered = false
	sprite.offset = -Vector2(_meta.feet[0], _meta.feet[1])
	sprite.scale = Vector2.ONE * _factor
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	add_child(sprite)
	sprite.play("idle")

## Seleziona lo stato visivo; gli attacchi seguono il tempo effettivo delle hitbox.
func select_state(player: Node, running: bool) -> void:
	var clip := "idle"
	var progress := -1.0
	if player.dead:
		clip = "death"
	elif player.hammer_time > 0:
		clip = "hammer"
		progress = 1.0 - player.hammer_time / float(player._cfg.hammer_time)
	elif player.attacking > 0:
		clip = "pogo" if player.attack_down else ("slash_a" if player.slash_side > 0 else "slash_b")
		progress = 1.0 - player.attacking / float(player._cfg.attack_time)
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
		progress = player._spin_t / float(player._cfg.double_jump_spin_time)
	elif not player.grounded:
		clip = "rise" if player.move_vel.y < 0 else "fall"
	elif player._skid_t > 0:
		clip = "skid"
	elif running:
		clip = "run"
	if sprite.animation != clip:
		sprite.play(clip)
	if progress >= 0:
		sprite.pause()
		sprite.frame = mini(int(_meta.clips[clip].frames) - 1, int(clampf(progress, 0, 1) * int(_meta.clips[clip].frames)))
	else:
		sprite.play()
	sprite.speed_scale = clampf(absf(player.move_vel.x) / float(player._cfg.speed), 0.4, 1.5) if clip == "run" else 1.0

## Applica orientamento e tinta ambientale senza deformare i fotogrammi.
func advance(_delta: float, _velocity: Vector2) -> void:
	scale.x = facing
	sprite.modulate = Color.WHITE.lerp(ambient, ambient_amount * 0.5).lerp(Color(1.8, 1.8, 1.8), flash)

## Copia il fotogramma corrente per la scia dello scatto.
func make_ghost(color: Color) -> Node2D:
	var ghost := Sprite2D.new()
	ghost.texture = sprite.sprite_frames.get_frame_texture(sprite.animation, sprite.frame)
	ghost.centered = false
	ghost.offset = sprite.offset
	ghost.scale = Vector2(facing, 1) * _factor
	ghost.modulate = color
	return ghost
