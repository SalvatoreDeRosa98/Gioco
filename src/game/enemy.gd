extends CharacterBody2D
## Nemico: IA, vita e aspetto (gatto, vespa, statua, Custode). I danni al giocatore e i colpi
## ricevuti li decide il mondo (world.gd); qui c'è solo ciò che il nemico fa da sé.

const GRAVITY := 1500.0
const SPRITE_SHADER := preload("res://game/shaders/canvas_char_sprite.gdshader")

## Immagini dipinte (assets/art/enemies, bosses). Perni e ancore in pixel della tela;
## le parti mobili vengono da tools/art/rig_nemici.py.
const GATTO_BODY := preload("res://assets/art/enemies/gatto_rig/corpo.png")
const GATTO_TAIL := preload("res://assets/art/enemies/gatto_rig/coda.png")
const GATTO_FEET := Vector2(400, 592)
const GATTO_TAIL_ROOT := Vector2(190, 290)
const GATTO_SCALE := 0.078
const VESPA_BODY := preload("res://assets/art/enemies/vespa_rig/corpo.png")
const VESPA_WINGS := preload("res://assets/art/enemies/vespa_rig/ali.png")
const VESPA_CENTER := Vector2(330, 420)
const VESPA_WING_ROOT := Vector2(338, 226)
const VESPA_SCALE := 0.0755
const STATUA_TEX := preload("res://assets/art/enemies/statua.png")
const STATUA_FEET := Vector2(165, 1010)
const STATUA_SCALE := 0.103
const CUSTODE_TEX := preload("res://assets/art/bosses/custode.png")
const CUSTODE_FEET := Vector2(360, 1010)
const CUSTODE_LILY := Vector2(420, 340)
const CUSTODE_SCALE := 0.176
## Mensole attraversabili (vedi player.gd): anche i nemici ci camminano sopra.
const LEDGE_LAYER := 4

var kind := "gatto"
var hp := 3
var max_hp := 3
var half := Vector2(20, 14)
var speed := 70.0
var damage := 1
var coins := 2
var flash := 0.0
var facing := 1.0
var anim := "idle"
## Secondi prima che il contatto possa ferire di nuovo il giocatore.
var touch_cd := 0.0
var world: Node

var _t := 0.0
var _dir := 1.0
var _shoot_cd := 1.5
var _state := "walk"
var _state_t := 1.5
var _airborne := false
var _look_t := 0.0
var _last_anim := ""
var _anim_start := 0.0
var _mat: ShaderMaterial
var _aura: Sprite2D
var _aura_scale := Vector2.ONE


func setup(d: Dictionary, w: Node) -> void:
	kind = str(d["type"])
	var cfg: Dictionary = Tuning.data.enemies[kind]
	hp = int(cfg["hp"])
	max_hp = hp
	speed = float(cfg["speed"])
	damage = int(cfg["damage"])
	coins = int(cfg["coins"])
	world = w
	position = d["pos"]
	_shoot_cd = float(cfg.get("fire_every", 2.0)) * 0.6
	_t = randf() * 10.0
	half = _half_for(kind)
	collision_layer = 0
	collision_mask = 1
	set_collision_mask_value(LEDGE_LAYER, true)

	var sh := RectangleShape2D.new()
	sh.size = half * 2.0
	var cs := CollisionShape2D.new()
	cs.shape = sh
	add_child(cs)

	add_to_group("enemies")
	_mat = ShaderMaterial.new()
	_mat.shader = SPRITE_SHADER
	material = _mat
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	match kind:
		"custode":
			Art.point_light(self, Vector2(0, -20), Color(1.0, 0.7, 0.35), 0.7, 520.0)
			_aura = Art.glow(self, Vector2.ZERO, Color(1.0, 0.72, 0.32), 90.0)
		"statua":
			# Alone azzurro: distingue la statua nemica da quelle decorative.
			_aura = Art.glow(self, Vector2(0, -24), Color(0.55, 0.8, 1.0), 120.0)
			_aura.show_behind_parent = true
			# Marmo bianco: le luci 2D lo brucerebbero, basta l'alone.
			light_mask = 0
		"vespa":
			Art.point_light(self, Vector2(-6, 6), Color(1.0, 0.75, 0.35), 0.35, 200.0)
	if _aura:
		_aura_scale = _aura.scale


static func _half_for(k: String) -> Vector2:
	match k:
		"vespa":
			return Vector2(16, 12)
		"statua":
			return Vector2(20, 34)
		"custode":
			return Vector2(48, 64)
		_:
			return Vector2(20, 14)


# ---------------------------------------------------------------- IA

func _physics_process(delta: float) -> void:
	flash = maxf(0.0, flash - delta * 5.0)
	touch_cd = maxf(0.0, touch_cd - delta)
	match kind:
		"vespa":
			_ai_vespa(delta)
		"statua":
			_ai_statua(delta)
		"custode":
			_ai_custode(delta)
		_:
			_ai_gatto(delta)
	move_and_slide()


## Camminatore: gira davanti ai muri e ai precipizi.
func _ai_gatto(delta: float) -> void:
	velocity.y = minf(velocity.y + GRAVITY * delta, 900.0)
	velocity.x = _dir * speed
	var ahead := global_position + Vector2(_dir * (half.x + 6.0), half.y + 6.0)
	if is_on_wall() or (is_on_floor() and not world.is_ground(ahead)):
		_dir = -_dir
	facing = _dir
	anim = "walk"


## Volatile: insegue quando è vicino, altrimenti pattuglia in orizzontale.
func _ai_vespa(delta: float) -> void:
	var target: Node2D = world.alive_player()
	var w := 1.0 - exp(-3.0 * delta)
	if target and global_position.distance_to(target.global_position) < 460.0:
		var to: Vector2 = target.global_position + Vector2(0, -20) - global_position
		velocity = velocity.lerp(to.normalized() * speed, w)
		anim = "chase"
	else:
		velocity = velocity.lerp(Vector2(_dir * speed * 0.5, sin(_t * 2.2) * 60.0), w)
		var size: Vector2 = world.room["size"]
		if position.x < 140.0 or position.x > size.x - 140.0:
			_dir = -_dir
		anim = "idle"
	_t += delta
	if absf(velocity.x) > 5.0:
		facing = signf(velocity.x)


## Statua: ferma, guarda il giocatore più vicino, si carica e spara in orizzontale.
func _ai_statua(delta: float) -> void:
	velocity.y = minf(velocity.y + GRAVITY * delta, 900.0)
	velocity.x = 0.0
	var target: Node2D = world.alive_player()
	if target and absf(target.global_position.x - global_position.x) > 4.0:
		facing = signf(target.global_position.x - global_position.x)
	_shoot_cd -= delta
	anim = "charge" if _shoot_cd < 0.6 else "idle"
	if _shoot_cd <= 0.0:
		var cfg: Dictionary = Tuning.data.enemies.statua
		_shoot_cd = float(cfg.fire_every)
		world.enemy_fire(global_position + Vector2(facing * 26.0, -40.0), Vector2(facing, 0.0), float(cfg.bullet_speed), Color(0.6, 0.85, 1.0))


## Boss: cammina verso il giocatore, poi alterna balzo con onda d'urto e raffica radiale.
func _ai_custode(delta: float) -> void:
	velocity.y = minf(velocity.y + GRAVITY * delta, 1000.0)
	var target: Node2D = world.alive_player()
	if target and absf(target.global_position.x - global_position.x) > 4.0 and _state == "walk":
		facing = signf(target.global_position.x - global_position.x)
	_state_t -= delta
	match _state:
		"walk":
			velocity.x = facing * speed
			anim = "walk"
			if _state_t <= 0.0:
				if randf() < 0.5:
					_state = "crouch"
					_state_t = 0.35
				else:
					_state = "burst"
					_state_t = 1.0
		"crouch":
			velocity.x = 0.0
			anim = "crouch"
			if _state_t <= 0.0:
				_state = "leap"
				_airborne = false
				velocity = Vector2(facing * 260.0, -680.0)
		"leap":
			anim = "leap"
			if not is_on_floor():
				_airborne = true
			elif _airborne:
				world.enemy_shockwave(global_position + Vector2(0, half.y - 6.0))
				_state = "walk"
				_state_t = 1.6
				velocity.x = 0.0
		"burst":
			velocity.x = 0.0
			anim = "burst"
			if _state_t <= 0.0:
				world.enemy_burst(global_position + Vector2(0, -40.0), 10)
				_state = "walk"
				_state_t = 2.2


func take_hit(dmg: int) -> bool:
	hp -= dmg
	flash = 1.0
	if hp <= 0:
		queue_free()
		return true
	return false


# ---------------------------------------------------------------- Aspetto

func _process(delta: float) -> void:
	_look_t += delta
	if anim != _last_anim:
		_last_anim = anim
		_anim_start = _look_t
	_mat.set_shader_parameter("flash", flash)
	_update_glows()
	queue_redraw()


## Avanzamento 0..1 dell'animazione corrente (calcolato dal tempo di vista).
func _anim_progress(duration: float) -> float:
	return clampf((_look_t - _anim_start) / duration, 0.0, 1.0)


func _draw() -> void:
	draw_colored_polygon(Art.ellipse(Vector2(0, half.y + 1.0), Vector2(half.x * 0.9, 4.0), 16), Color(0, 0, 0, 0.32))
	match kind:
		"vespa":
			_draw_vespa()
		"statua":
			_draw_statua()
		"custode":
			_draw_custode()
		_:
			_draw_gatto()
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	if kind != "custode" and hp < max_hp and hp > 0:
		var w := half.x * 2.0
		draw_rect(Rect2(-w * 0.5, -half.y - 16.0, w, 3), Color(0, 0, 0, 0.6))
		draw_rect(Rect2(-w * 0.5, -half.y - 16.0, w * float(hp) / float(max_hp), 3), Art.enemy_color(kind))


## Trasformazione dell'immagine: il punto "anchor" (pixel) va in "at", con specchiatura,
## inclinazione e schiacciamento attorno a quel punto.
func _sprite_xf(at: Vector2, anchor: Vector2, k: float, tilt: float, sq: Vector2) -> Transform2D:
	return Transform2D(tilt * facing, Vector2(facing * sq.x, sq.y) * k, 0.0, at) * Transform2D(0.0, Vector2.ONE, 0.0, -anchor)


## Disegna un pezzo (stessa tela dell'immagine intera) ruotato/scalato attorno al suo perno.
func _piece(base: Transform2D, tex: Texture2D, pivot: Vector2, angle: float = 0.0, scale_v: Vector2 = Vector2.ONE) -> void:
	var local := Transform2D(angle, scale_v, 0.0, pivot) * Transform2D(0.0, Vector2.ONE, 0.0, -pivot)
	draw_set_transform_matrix(base * local)
	draw_texture(tex, Vector2.ZERO)


func _draw_gatto() -> void:
	var t := _look_t
	var moving := absf(velocity.x) > 10.0
	var ph := t * 9.0
	var bob := -absf(sin(ph)) * 1.6 if moving else 0.0
	var tilt := sin(ph) * 0.035 if moving else 0.0
	var sq := Vector2(1.0, 1.0 + (0.025 * sin(ph * 2.0) if moving else 0.012 * sin(t * 2.2)))
	var base := _sprite_xf(Vector2(0, half.y + bob), GATTO_FEET, GATTO_SCALE, tilt, sq)
	_piece(base, GATTO_TAIL, GATTO_TAIL_ROOT, sin(t * 3.2) * 0.12 + (0.05 if moving else 0.0))
	_piece(base, GATTO_BODY, Vector2.ZERO)


func _draw_vespa() -> void:
	var t := _look_t
	var bob := sin(t * 3.0) * 3.0
	var lean := clampf(absf(velocity.x) / maxf(speed, 1.0), 0.0, 1.0) * 0.18
	var base := _sprite_xf(Vector2(0, bob), VESPA_CENTER, VESPA_SCALE, lean, Vector2.ONE)
	# Ali: battito rapidissimo, schiacciate verso la radice.
	var flap := absf(sin(t * 38.0))
	_piece(base, VESPA_BODY, Vector2.ZERO)
	_piece(base, VESPA_WINGS, VESPA_WING_ROOT, -0.12 * flap, Vector2(1.0, 0.45 + 0.55 * flap))


func _draw_statua() -> void:
	var charge := _anim_progress(0.6) if anim == "charge" else 0.0
	# Tremito mentre si carica: la pietra vibra prima di sparare.
	var shake := Vector2(sin(_look_t * 60.0), 0.0) * 1.2 * charge
	var base := _sprite_xf(Vector2(0, half.y) + shake, STATUA_FEET, STATUA_SCALE, 0.0, Vector2.ONE)
	_piece(base, STATUA_TEX, Vector2.ZERO)


func _draw_custode() -> void:
	var t := _look_t
	var walk := absf(velocity.x) > 10.0
	var bob := -absf(sin(t * 3.5)) * 4.0 if walk else sin(t * 1.6) * 1.0
	var tilt := sin(t * 3.5) * 0.03 if walk else 0.0
	var sq := Vector2.ONE
	match anim:
		"crouch":
			sq = Vector2(1.08, 0.88)
		"leap":
			sq = Vector2(0.94, 1.08)
		"burst":
			tilt = -0.07 * _anim_progress(0.4)
	var base := _sprite_xf(Vector2(0, half.y + bob), CUSTODE_FEET, CUSTODE_SCALE, tilt, sq)
	_piece(base, CUSTODE_TEX, Vector2.ZERO)


## Aloni e luci che seguono l'immagine (aggiornati ogni frame).
func _update_glows() -> void:
	if _aura == null:
		return
	match kind:
		"statua":
			var charge := _anim_progress(0.6) if anim == "charge" else 0.0
			_aura.modulate = Color(0.55, 0.8, 1.0, 0.16 + 0.5 * charge)
			_aura.scale = _aura_scale * (1.0 + 0.35 * charge)
		"custode":
			var charge := _anim_progress(1.0) if anim == "burst" else 0.0
			var pulse := 0.5 + 0.5 * sin(_look_t * 4.0)
			var at := (CUSTODE_LILY - CUSTODE_FEET) * CUSTODE_SCALE
			_aura.position = Vector2(at.x * facing, half.y + at.y)
			_aura.modulate = Color(1.0, 0.72, 0.32, 0.25 + 0.15 * pulse + 0.6 * charge)
			_aura.scale = _aura_scale * (1.0 + 0.8 * charge)
