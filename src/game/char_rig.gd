class_name CharRig
extends Node2D
## Ferruccio come mesh deformabile senza giunture (fase 1 del rig "rotondo").
##
## L'immagine dipinta è una griglia di triangoli piegata nel vertex shader
## (shaders/canvas_char_mesh.gdshader) secondo la mappa dei pesi di tools/art/rig_ferruccio_mesh.py:
## gambe che si piegano all'anca e al ginocchio, busto che respira, si inclina e si schiaccia,
## cappello a molla, sciarpa che ondeggia, orlo che si apre, manica che segue il braccio.
## La spada con la mano è un pezzo rigido che ruota attorno al polso; un ritaglio del polsino,
## deformato come il corpo, la ricopre così la mano esce dalla manica.
##
## L'origine del nodo è il punto tra i piedi, a terra; +y in basso. Le pose sono nello spazio
## dell'immagine rivolta a destra: [member facing] la specchia. Angoli in radianti (positivo =
## orario sull'immagine), spostamenti in pixel della tela dipinta (1004 px = [member height]).
##
## Uso: [method set_pose] imposta subito; [method set_target] + [method advance] ogni frame
## sfumano verso la posa e aggiungono il moto secondario (cappello, sciarpa, orlo) dalla velocità.
## Le pose pronte sono [method pose_idle], [method pose_run], [method pose_air], [method pose_slash],
## [method pose_dash], [method pose_dead], [method pose_double_jump], [method pose_slash_down],
## [method pose_skid]; [method run_rate] e [method run_steps] tengono la corsa al passo coi piedi.

const FIGURE_TEX := preload("res://assets/art/characters/ferruccio_rig/figura.png")
const BACK_TEX := preload("res://assets/art/characters/ferruccio_rig/dietro.png")
const HAND_TEX := preload("res://assets/art/characters/ferruccio_rig/mano_spada.png")
const WEIGHTS_TEX := preload("res://assets/art/characters/ferruccio_rig/pesi.png")
const MESH_SHADER := preload("res://game/shaders/canvas_char_mesh.gdshader")

## Tela dipinta e punti fissi, in pixel (devono coincidere con lo shader e con rig_ferruccio_mesh.py).
const CANVAS := Vector2(679, 1024)
const FEET := Vector2(368, 1012)
const FIGURE_SPAN := 1004.0
## Polso: perno della mano, al centro del bordo del polsino.
const WRIST := Vector2(366, 617)
## Polsino ridisegnato sopra la mano; sparisce quando la mano ruota oltre CUFF_FADE (rad).
const CUFF_RECT := Rect2(333, 594, 64, 26)
const CUFF_FADE := Vector2(0.7, 1.3)
## Perni delle gambe e punti del piede (tallone, punta, suola) usati per appoggiare a terra.
const HIP_FRONT := Vector2(332, 792)
const KNEE_FRONT := Vector2(336, 872)
const HIP_BACK := Vector2(392, 792)
const KNEE_BACK := Vector2(374, 866)
## Altri perni del corpo: spalla (manica), base del cappello, nodo della sciarpa, bacino (inclinazione).
const SHOULDER := Vector2(350, 372)
const HAT_PIVOT := Vector2(366, 158)
const SCARF_KNOT := Vector2(345, 318)
const HIP_CENTER := Vector2(364, 800)
## Nello strato principale la sciarpa si muove solo a destra di questa colonna (la coda corta davanti).
const SCARF_FRONT_X := 372.0
## Sopra questa riga il busto si inclina del tutto; asse verticale e punta del cappello.
const CHEST_Y := 430.0
const AXIS_X := 368.0
const TOP_Y := 8.0
## Mezza altezza della piega del ginocchio, respiro (salita in px e allargamento), volume nello schiacciamento.
const KNEE_SOFT := 30.0
const BREATH_PX := 5.0
const BREATH_WIDEN := 0.025
const BULGE := 0.9
const FOOT_FRONT: Array[Vector2] = [Vector2(302, 1008), Vector2(424, 1006), Vector2(386, 1017)]
const FOOT_BACK: Array[Vector2] = [Vector2(360, 962), Vector2(452, 980), Vector2(430, 985)]
## Frazione della luce di taglio sulla mano e sulla spada (il loro bordo è spesso davanti alla tunica).
const HAND_RIM := 0.4
## Griglia: colonne uniformi; righe più fitte nelle gambe, dove la mesh si piega di più.
const GRID_COLS := 24
const GRID_ROWS_BODY := 24
const GRID_ROWS_LEGS := 22
const LEGS_FROM_Y := 740.0

## Corsa: ampiezza dell'anca (rad) e anticipo di fase di anca e ginocchio rispetto al passo.
const RUN_SWING := 0.7
const RUN_HIP_LEAD := 0.7
const RUN_KNEE_LEAD := 0.45
## Piega massima del ginocchio a metà del ritorno: oltre 1.3 rad anche la punta del piede si alza.
const RUN_KNEE_MAX := 1.45
## Sobbalzo della corsa (px della tela: giù a metà appoggio, su nel volo) e quanto il piede più
## basso viene riportato a terra (1 = sempre: passo da camminata; meno = un po' di volo).
const RUN_BOB := 9.0
const RUN_PLANT := 0.55
## Centro della capriola, in frazione d'altezza dai piedi.
const SPIN_CENTER := 0.45

## Velocità (1/s) con cui [method advance] porta ogni parametro verso la posa obiettivo.
const BLEND_RATES := {
	"sword": 38.0, "arm": 26.0, "squash": 22.0, "leg_front": 18.0, "leg_back": 18.0,
	"lean": 10.0, "tilt": 12.0, "hem_open": 8.0, "hem_drag": 8.0, "scarf_lift": 6.0, "hat": 8.0,
	"plant": 10.0, "bob": 20.0,
}
const DEFAULT_BLEND := 14.0
## Nomi dei parametri di posa accettati da set_pose / set_target / get_pose.
const POSE_KEYS: Array[StringName] = [
	&"leg_front", &"leg_back", &"lean", &"tilt", &"squash", &"breath", &"arm", &"sword", &"hat",
	&"scarf_lift", &"scarf_phase", &"scarf_wave", &"hem_open", &"hem_drag", &"bob", &"plant",
]

@export_group("Aspetto")
## Altezza a schermo dalla punta del cappello ai piedi, in unità di mondo.
@export var height := 84.0
## 1 = rivolto a destra, -1 = a sinistra.
@export var facing := 1.0

@export_group("Posa")
## Gamba vicina: x = anca (rad, negativo = in avanti, ±0.9), y = ginocchio (rad, 0..1.5, stinco indietro).
@export var leg_front := Vector2.ZERO
## Gamba lontana, come [member leg_front].
@export var leg_back := Vector2.ZERO
## Busto in avanti (rad, -0.4..0.5), morbido dal bacino al petto; le gambe non ruotano.
@export var lean := 0.0
## Rotazione rigida di tutta la figura attorno ai piedi (rad): caduta, scatto.
@export var tilt := 0.0
## Allungamento (>0) o schiacciamento (<0) in frazione d'altezza, -0.35..0.35; piedi fermi.
@export var squash := 0.0
## Respiro, -1..1 (di solito sin(t * 2.6)).
@export var breath := 0.0
## Braccio attorno alla spalla (rad, positivo = polso indietro, -0.25..0.25: oltre, la manica
## trascina troppo la tunica, che è dipinta nello stesso strato).
@export var arm := 0.0
## Spada e mano attorno al polso, rispetto all'avambraccio (rad, -2.6..1.2; il fendente va da -2.3 a 0.7).
@export var sword := 0.0
## Flessione del cappello (rad, positivo = punta in su, -0.6..0.6).
@export var hat := 0.0
## Sciarpa sollevata all'indietro (rad, -0.3..1.0).
@export var scarf_lift := 0.0
## Fase dell'onda della sciarpa (rad); advance() la fa correre da sé.
@export var scarf_phase := 0.0
## Ampiezza dell'onda alle frange (px della tela, 0..30).
@export var scarf_wave := 0.0
## Apertura a campana dell'orlo, 0..1.
@export var hem_open := 0.0
## Orlo trascinato all'indietro (positivo) o in avanti, -1..1.
@export var hem_drag := 0.0
## Spostamento verticale extra (px della tela, negativo = su).
@export var bob := 0.0
## 0..1: quanto il piede più basso viene riportato a terra quando le gambe si aprono o si piegano
## (1 a terra, 0 in aria; i valori intermedi sfumano il passaggio).
@export_range(0.0, 1.0) var plant := 1.0
## Capriola (rad, positivo = in avanti) attorno al centro del corpo. Non fa parte delle pose:
## si imposta direttamente, così sfumare non la fa girare all'indietro.
@export var spin := 0.0

@export_group("Moto secondario")
## advance() aggiunge cappello, sciarpa e orlo che seguono il movimento con una molla.
@export var cloth_dynamics := true

@export_group("Luce e colore")
## Lampo (0..1) verso [member flash_color]: colpi subiti, immagini residue dello scatto.
@export var flash := 0.0
@export var flash_color := Color.WHITE
## Ricolorazione della sciarpa (0 = rossa dipinta).
@export var scarf_color := Color(0.91, 0.28, 0.25)
@export var scarf_amount := 0.0
## Da dove arriva la luce, sullo schermo (x a destra, y in basso).
@export var light_dir := Vector2(-0.55, -0.83)
@export var light_color := Color(1.0, 0.93, 0.8)
## Tinta dell'area (themes.gd) e quanto colora il personaggio.
@export var ambient := Color.WHITE
@export var ambient_amount := 0.0
## Intensità della luce di taglio sul bordo illuminato.
@export var rim_strength := 0.55

static var _mesh_cache: ArrayMesh
static var _cuff_cache: ArrayMesh
static var _weights_img: Image

var _target := {}
var _root: Node2D
var _body: MeshInstance2D
var _hand: Sprite2D
var _cuff: MeshInstance2D
var _mat: ShaderMaterial
var _hand_mat: ShaderMaterial
var _prev_vel := Vector2.ZERO
var _has_prev := false
# Moto secondario: valori e velocità delle molle, sommati alla posa.
var _hat_dyn := 0.0
var _hat_v := 0.0
var _scarf_dyn := 0.0
var _scarf_v := 0.0
var _hem_dyn := 0.0
var _hem_v := 0.0
var _open_dyn := 0.0
var _wave_dyn := 4.0
var _phase_dyn := 0.0
var _drop_prev := 0.0


func _init() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_mat = ShaderMaterial.new()
	_mat.shader = MESH_SHADER
	_mat.set_shader_parameter("weights", WEIGHTS_TEX)
	_mat.set_shader_parameter("back_tex", BACK_TEX)
	# I perni stanno qui e non nei default dello shader: deform_point() usa gli stessi.
	var fixed := {
		"canvas_size": CANVAS, "feet_y": FEET.y, "top_y": TOP_Y, "axis_x": AXIS_X,
		"hip_front": HIP_FRONT, "knee_front": KNEE_FRONT, "hip_back": HIP_BACK, "knee_back": KNEE_BACK,
		"knee_soft": KNEE_SOFT, "shoulder": SHOULDER, "hat_pivot": HAT_PIVOT, "scarf_knot": SCARF_KNOT,
		"hip_center": HIP_CENTER, "chest_y": CHEST_Y, "breath_px": BREATH_PX, "breath_widen": BREATH_WIDEN,
		"bulge": BULGE, "scarf_front_x": SCARF_FRONT_X,
	}
	for k in fixed:
		_mat.set_shader_parameter(k, fixed[k])
	_hand_mat = ShaderMaterial.new()
	_hand_mat.shader = MESH_SHADER
	_hand_mat.set_shader_parameter("rigid", true)
	_hand_mat.set_shader_parameter("weights", WEIGHTS_TEX)
	_hand_mat.set_shader_parameter("back_tex", HAND_TEX)
	# Il guanto nero davanti alla tunica bianca non ha un vero bordo in ombra: chiaroscuro leggero.
	_hand_mat.set_shader_parameter("shade_strength", 0.1)

	_root = Node2D.new()
	add_child(_root)
	_body = MeshInstance2D.new()
	_body.mesh = _figure_mesh()
	_body.texture = FIGURE_TEX
	_body.material = _mat
	_root.add_child(_body)
	_hand = Sprite2D.new()
	_hand.texture = HAND_TEX
	_hand.centered = false
	_hand.offset = -WRIST
	_hand.material = _hand_mat
	_root.add_child(_hand)
	_cuff = MeshInstance2D.new()
	_cuff.mesh = _cuff_mesh()
	_cuff.texture = FIGURE_TEX
	_cuff.material = _mat
	_root.add_child(_cuff)
	apply()


func _process(_delta: float) -> void:
	apply()


## Imposta subito i parametri presenti in [param p] (chiavi di [constant POSE_KEYS]).
func set_pose(p: Dictionary) -> void:
	for k in p:
		if POSE_KEYS.has(StringName(k)):
			set(k, p[k])
	apply()


## Posa da raggiungere con morbidezza: [method advance] vi avvicina i parametri (vedi [constant BLEND_RATES]).
func set_target(p: Dictionary) -> void:
	for k in p:
		if POSE_KEYS.has(StringName(k)):
			_target[k] = p[k]


## La posa corrente come dizionario (per immagini residue o per salvarla).
func get_pose() -> Dictionary:
	var out := {}
	for k in POSE_KEYS:
		out[String(k)] = get(k)
	return out


## Un passo di animazione: sfuma verso la posa obiettivo e, se [member cloth_dynamics], fa seguire
## al cappello, alla sciarpa e all'orlo il movimento. [param vel] è la velocità del personaggio
## in unità di mondo al secondo (quella di CharacterBody2D).
func advance(delta: float, vel := Vector2.ZERO) -> void:
	if delta <= 0.0:
		return
	for k in _target:
		var tgt: Variant = _target[k]
		if tgt is bool:
			set(k, tgt)
		else:
			var rate: float = BLEND_RATES.get(k, DEFAULT_BLEND)
			set(k, lerp(get(k), tgt, 1.0 - exp(-rate * delta)))
	if cloth_dynamics:
		_simulate(delta, vel)
	apply()


## Copia statica della posa attuale (immagini residue dello scatto): tinta piena di [param color].
func make_ghost(color: Color) -> CharRig:
	var g := CharRig.new()
	g.height = height
	g.facing = facing
	g.cloth_dynamics = false
	g.set_pose(get_pose())
	g.hat = hat + _hat_dyn
	g.scarf_lift = scarf_lift + _scarf_dyn
	g.hem_drag = hem_drag + _hem_dyn
	g.hem_open = hem_open + _open_dyn
	g.spin = spin
	g.flash = 1.0
	g.flash_color = color
	g.global_position = global_position
	g.apply()
	return g


## Manda allo shader e ai nodi i parametri correnti (lo fa già _process; utile dopo modifiche a mano).
func apply() -> void:
	if _mat == null:
		return
	var s := height / FIGURE_SPAN
	var f := 1.0 if facing >= 0.0 else -1.0
	var hat_t := hat + _hat_dyn
	var lift_t := scarf_lift + _scarf_dyn
	var drag_t := clampf(hem_drag + _hem_dyn, -1.0, 1.0)
	var open_t := clampf(hem_open + _open_dyn, 0.0, 1.0)
	var wave_t := scarf_wave + (_wave_dyn if cloth_dynamics else 0.0)
	var phase_t := scarf_phase + _phase_dyn
	var ldir := Vector2(light_dir.x * f, light_dir.y)
	for m in [_mat, _hand_mat]:
		m.set_shader_parameter("flash", flash)
		m.set_shader_parameter("flash_color", flash_color)
		m.set_shader_parameter("light_dir", ldir)
		m.set_shader_parameter("light_color", light_color)
		m.set_shader_parameter("ambient", ambient)
		m.set_shader_parameter("ambient_amount", ambient_amount)
	_mat.set_shader_parameter("rim_strength", rim_strength)
	_hand_mat.set_shader_parameter("rim_strength", rim_strength * HAND_RIM)
	_mat.set_shader_parameter("scarf_color", scarf_color)
	_mat.set_shader_parameter("scarf_amount", scarf_amount)
	_mat.set_shader_parameter("leg_front", leg_front)
	_mat.set_shader_parameter("leg_back", leg_back)
	_mat.set_shader_parameter("lean", lean)
	_mat.set_shader_parameter("squash", squash)
	_mat.set_shader_parameter("breath", breath)
	_mat.set_shader_parameter("arm", arm)
	_mat.set_shader_parameter("hat", hat_t)
	_mat.set_shader_parameter("scarf_lift", lift_t)
	_mat.set_shader_parameter("scarf_phase", phase_t)
	_mat.set_shader_parameter("scarf_wave", wave_t)
	_mat.set_shader_parameter("hem_open", open_t)
	_mat.set_shader_parameter("hem_drag", drag_t)

	var drop := bob + _foot_lift() * clampf(plant, 0.0, 1.0)
	_root.scale = Vector2(f * s, s)
	# Prima l'inclinazione attorno ai piedi, poi la capriola attorno al centro del corpo.
	var p0 := Vector2(0.0, drop * s).rotated(tilt * f)
	var c := Vector2(0.0, -height * SPIN_CENTER)
	_root.position = c + (p0 - c).rotated(spin * f)
	_root.rotation = (tilt + spin) * f
	# La mano segue il polso deformato e ruota con avambraccio e busto.
	var w := deform_point(WRIST)
	_hand.position = w - FEET
	_hand.rotation = sword + arm + lean * _chest_weight(WRIST.y)
	# Polso molto piegato: la mano passa davanti al polsino, che quindi sparisce.
	_cuff.self_modulate.a = 1.0 - smoothstep(CUFF_FADE.x, CUFF_FADE.y, absf(sword))


## Dove finisce un punto della tela (px) con la posa corrente, nello stesso sistema (px della tela).
## Rispecchia il vertex shader: serve per agganciare oggetti al corpo (la mano, effetti, cappello).
func deform_point(p: Vector2, back_layer := false) -> Vector2:
	var wa := _weights_at(p / CANVAS, 0)
	var wb := _weights_at(p / CANVAS, 1)
	var hip := HIP_BACK if back_layer else HIP_FRONT
	var knee := KNEE_BACK if back_layer else KNEE_FRONT
	var ang := leg_back if back_layer else leg_front
	var wl := wa.g if back_layer else wa.r
	var q := _leg(p, hip, knee, ang, wl)
	q = _rot(q, SHOULDER, arm * wb.g)
	q = _rot(q, HAT_PIVOT, (hat + _hat_dyn) * wa.b)
	var ws := wb.r * (1.0 if back_layer else smoothstep(SCARF_FRONT_X - 40.0, SCARF_FRONT_X, p.x))
	q = _rot(q, SCARF_KNOT, (scarf_lift + _scarf_dyn) * ws)
	return _body_fields(p, q)


# ---------------------------------------------------------------- Pose pronte

## Fermo: respiro lento, spada che segue appena il petto. [param t] in secondi.
static func pose_idle(t: float) -> Dictionary:
	var b := sin(t * 2.6)
	return {
		"leg_front": Vector2.ZERO, "leg_back": Vector2.ZERO, "lean": 0.02, "tilt": 0.0, "squash": 0.0,
		"breath": b, "arm": 0.03 * b, "sword": 0.04 * sin(t * 2.6 - 0.6), "hat": 0.0, "scarf_lift": 0.0,
		"hem_open": 0.0, "hem_drag": 0.0, "bob": 0.0, "plant": 1.0,
	}


## Corsa. [param phase] in radianti (un passo completo ogni 2π): a π/2 - RUN_HIP_LEAD la gamba
## vicina tocca terra davanti, a 3π/2 - RUN_HIP_LEAD la lontana (vedi [method run_steps]).
## [param amount] 0..1 riduce l'ampiezza quando si va piano. L'anca anticipa il ginocchio: la
## gamba che torna avanti porta il ginocchio in alto e il piede sotto il bacino, poi si distende
## prima dell'appoggio. Il corpo è più basso a metà appoggio e sale nel volo tra un passo e l'altro;
## il braccio va in controfase, il busto pende avanti.
static func pose_run(phase: float, amount := 1.0) -> Dictionary:
	var a := clampf(amount, 0.0, 1.0)
	var g := phase + RUN_HIP_LEAD
	var hip := RUN_SWING * a * sin(g)
	var s := sin(phase)
	return {
		"leg_front": Vector2(-hip, _run_knee(phase + RUN_KNEE_LEAD) * a),
		"leg_back": Vector2(hip, _run_knee(phase + RUN_KNEE_LEAD + PI) * a),
		"lean": (0.1 + 0.05 * a) + 0.03 * cos(2.0 * g), "tilt": 0.0, "squash": 0.03 * a * cos(2.0 * g),
		"breath": 0.0, "arm": 0.12 * a * s, "sword": 0.12 * a * sin(phase - 0.8),
		"bob": RUN_BOB * a * cos(2.0 * g), "hem_open": (0.2 + 0.3 * absf(sin(g))) * a, "hem_drag": 0.3 * a,
		"scarf_lift": 0.15 * a, "plant": RUN_PLANT,
	}


## Velocità di fase della corsa (rad/s) perché il piede in appoggio scorra all'indietro alla
## stessa velocità del corpo: niente pattinaggio. [param speed] e [param height] in unità di mondo.
static func run_rate(speed: float, amount: float, height: float) -> float:
	var leg := (FOOT_FRONT[2].y - HIP_FRONT.y) * height / FIGURE_SPAN
	return absf(speed) / maxf(leg * RUN_SWING * clampf(amount, 0.2, 1.0), 0.001)


## Numero di passi compiuti fino a [param phase]: cambia di 1 a ogni appoggio (suoni e polvere).
static func run_steps(phase: float) -> int:
	return floori((phase + RUN_HIP_LEAD - PI * 0.5) / PI)


## Piega del ginocchio nella corsa: forte nel ritorno della gamba (fase con cos > 0), lieve in appoggio.
static func _run_knee(phase: float) -> float:
	var c := cos(phase)
	return RUN_KNEE_MAX * pow(maxf(0.0, c), 1.4) + 0.14 * maxf(0.0, -c)


## In aria: [param vy] velocità verticale (negativa = sale). Salendo una gamba si raccoglie,
## scendendo le gambe pendono e l'orlo si gonfia.
static func pose_air(vy: float) -> Dictionary:
	var k := clampf(0.5 + vy / 900.0, 0.0, 1.0)  # 0 = salita piena, 1 = caduta
	var rise := {
		"leg_front": Vector2(-0.8, 1.25), "leg_back": Vector2(0.3, 0.55), "lean": 0.06, "squash": 0.06,
		"arm": -0.12, "sword": -0.3, "hem_open": 0.25,
	}
	var fall := {
		"leg_front": Vector2(-0.22, 0.4), "leg_back": Vector2(0.32, 0.8), "lean": -0.03, "squash": 0.02,
		"arm": -0.2, "sword": 0.25, "hem_open": 0.75,
	}
	var out := blend(rise, fall, k)
	out.merge({"tilt": 0.0, "breath": 0.0, "hem_drag": 0.0, "bob": 0.0, "plant": 0.0})
	return out


## Doppio salto: ginocchia raccolte al petto (la capriola la dà [member spin]).
static func pose_double_jump() -> Dictionary:
	return {
		"leg_front": Vector2(-1.0, 1.5), "leg_back": Vector2(-0.45, 1.35), "lean": 0.12, "tilt": 0.0,
		"squash": 0.04, "breath": 0.0, "arm": -0.15, "sword": 0.35, "hem_open": 0.7, "hem_drag": 0.0,
		"bob": 0.0, "plant": 0.0,
	}


## Fendente orizzontale: [param k] avanzamento 0..1, [param side] verso del colpo (+1 / -1).
## Anticipo (la spada arretra ancora un poco), colpo con easing e una punta oltre il fine corsa
## che rientra (follow-through); il braccio accompagna la spada, il busto si sbilancia avanti.
static func pose_slash(k: float, side: float) -> Dictionary:
	# Stile animazione "Frame by Frame" (Salt and Sanctuary / Metroidvania)
	# Il tempo viene discretizzato per dare il senso di 'pose' mantenute.
	# Anticipazione (0-0.25), Colpo violento (0.25-0.35), Follow-through (0.35-0.6), Recupero (0.6-1.0)
	
	var from := -2.4 if side > 0.0 else 0.8
	var to := 0.8 if side > 0.0 else -2.2
	var dir := signf(to - from)
	
	var p := {}
	
	if k < 0.25:
		# Anticipazione: si tira indietro, accumula potenza
		var t = k / 0.25
		p = {
			"sword": from - 0.4 * dir * t,
			"arm": -0.3 * dir * t,
			"lean": -0.15 * t,
			"squash": 0.05 * t,
			"hat": 0.1 * t,
			"scarf_lift": 0.3 * t,
			"leg_front": Vector2(-0.1, 0.4) * t,
			"leg_back": Vector2(0.2, 0.6) * t,
		}
	elif k < 0.35:
		# L'ATTACCO: smear frame rapidissimo! Scatta in avanti
		var t = (k - 0.25) / 0.1
		p = {
			"sword": lerpf(from, to, t),
			"arm": lerpf(-0.3 * dir, 0.4 * dir, t),
			"lean": lerpf(-0.15, 0.3, t),
			"squash": lerpf(0.05, -0.1, t),
			"hat": lerpf(0.1, -0.3, t),
			"scarf_lift": lerpf(0.3, -0.5, t),
			"hem_open": lerpf(0.0, 0.5, t),
			"leg_front": Vector2(lerpf(-0.1, -0.4, t), lerpf(0.4, 0.8, t)),
			"leg_back": Vector2(lerpf(0.2, 0.4, t), lerpf(0.6, 0.2, t)),
		}
	elif k < 0.6:
		# Follow-through (hold frame d'impatto prolungato)
		var t = (k - 0.35) / 0.25
		# Curva ease-out per assorbire l'impatto
		var e = 1.0 - pow(1.0 - t, 3.0)
		p = {
			"sword": to + 0.1 * dir * e,
			"arm": 0.4 * dir - 0.1 * dir * e,
			"lean": 0.3 + 0.05 * e,
			"squash": -0.1 + 0.05 * e,
			"hat": -0.3 + 0.1 * e,
			"scarf_lift": -0.5 + 0.2 * e,
			"hem_open": 0.5 - 0.2 * e,
			"leg_front": Vector2(-0.4, 0.8),
			"leg_back": Vector2(0.4, 0.2),
		}
	else:
		# Recupero
		var t = (k - 0.6) / 0.4
		var e = t * t # ease in
		p = {
			"sword": lerpf(to + 0.1 * dir, 0.0, e),
			"arm": lerpf(0.3 * dir, 0.0, e),
			"lean": lerpf(0.35, 0.0, e),
			"squash": lerpf(-0.05, 0.0, e),
			"hat": lerpf(-0.2, 0.0, e),
			"scarf_lift": lerpf(-0.3, 0.0, e),
			"hem_open": lerpf(0.3, 0.0, e),
			"leg_front": Vector2(-0.4 * (1-e), 0.8 * (1-e)),
			"leg_back": Vector2(0.4 * (1-e), 0.2 * (1-e)),
		}
	
	return p


## Fendente verso il basso in aria: spada puntata giù, gambe raccolte per il rimbalzo.
static func pose_slash_down(k: float) -> Dictionary:
	var e := 1.0 - pow(1.0 - clampf(k, 0.0, 1.0), 3.0)
	return {
		"sword": lerpf(0.2, 1.05, e), "arm": 0.1, "lean": 0.08,
		"leg_front": Vector2(-0.8, 1.1), "leg_back": Vector2(-0.35, 0.95), "plant": 0.0,
	}


## Frenata sul posto quando si inverte la corsa: già girato, il corpo scivola all'indietro
## puntando la gamba lontana, il busto spinge nel nuovo verso.
static func pose_skid() -> Dictionary:
	return {
		"leg_front": Vector2(-0.15, 0.6), "leg_back": Vector2(0.6, 0.05), "lean": 0.22, "tilt": 0.0,
		"squash": -0.06, "breath": 0.0, "arm": -0.1, "sword": 0.25, "hem_open": 0.3, "bob": 0.0,
		"plant": 1.0,
	}


## Scatto: tutto proteso in avanti, stoffe tirate indietro.
static func pose_dash() -> Dictionary:
	return {
		"leg_front": Vector2(-0.75, 0.55), "leg_back": Vector2(0.8, 0.35), "lean": 0.28, "tilt": 0.0,
		"squash": -0.05, "breath": 0.0, "arm": 0.2, "sword": 0.5, "hem_open": 0.4, "hem_drag": 1.0,
		"scarf_lift": 0.7, "hat": -0.25, "bob": 0.0, "plant": 1.0,
	}


## A terra, svenuto all'indietro.
static func pose_dead() -> Dictionary:
	return {
		"leg_front": Vector2(-0.3, 0.2), "leg_back": Vector2(-0.1, 0.4), "lean": -0.1, "tilt": -1.45,
		"squash": 0.0, "breath": 0.0, "arm": -0.2, "sword": 0.6, "hem_open": 0.2, "hem_drag": -0.3,
		"scarf_lift": -0.2, "hat": 0.3, "bob": 0.0, "plant": 0.0,
	}


static func pose_parry() -> Dictionary:
	return {
		"leg_front": Vector2(-0.2, 0.1), "leg_back": Vector2(0.3, -0.1), "lean": -0.1, "tilt": 0.0,
		"squash": -0.05, "breath": 0.0, "arm": 0.3, "sword": -1.2, "hem_open": 0.1, "hem_drag": 0.0,
		"plant": 1.0,
	}


static func pose_wall() -> Dictionary:
	return {
		"leg_front": Vector2(-0.3, 0.4), "leg_back": Vector2(0.2, 0.8), "lean": 0.1, "tilt": 0.0,
		"squash": 0.0, "breath": 0.0, "arm": -0.4, "sword": -0.5, "hem_open": 0.2, "hem_drag": -0.1,
		"plant": 0.0,
	}


static func pose_grapple() -> Dictionary:
	return {
		"leg_front": Vector2(-0.2, 0.2), "leg_back": Vector2(0.1, 0.5), "lean": 0.3, "tilt": 0.0,
		"squash": -0.1, "breath": 0.0, "arm": 0.6, "sword": -0.2, "hem_open": 0.4, "hem_drag": 0.5,
		"plant": 0.0,
	}


static func pose_heal() -> Dictionary:
	return {
		"leg_front": Vector2(-0.1, 0.0), "leg_back": Vector2(0.1, 0.0), "lean": 0.15, "tilt": 0.0,
		"squash": 0.05, "breath": 1.0, "arm": -0.1, "sword": 0.4, "hem_open": 0.0, "hem_drag": 0.0,
		"plant": 1.0,
	}


static func pose_hammer(k: float) -> Dictionary:
	return {
		"leg_front": Vector2(-0.5, 0.2), "leg_back": Vector2(0.5, -0.2), "lean": 0.2 + 0.2 * k, "tilt": 0.0,
		"squash": 0.0, "breath": 0.0, "arm": -0.2 + k, "sword": 0.5 - k, "hem_open": 0.2, "hem_drag": 0.1,
		"plant": 1.0,
	}


## Mescola due pose (stesse chiavi) con [param k] 0..1; i booleani passano a metà.
static func blend(a: Dictionary, b: Dictionary, k: float) -> Dictionary:
	var out := {}
	for key in a:
		if not b.has(key):
			out[key] = a[key]
		elif a[key] is bool or b[key] is bool:
			out[key] = b[key] if k >= 0.5 else a[key]
		else:
			out[key] = lerp(a[key], b[key], k)
	for key in b:
		if not out.has(key):
			out[key] = b[key]
	return out


# ---------------------------------------------------------------- Moto secondario

## Molle smorzate: ciascuna insegue un equilibrio che dipende dalla velocità e riceve una spinta
## dall'accelerazione (la stoffa resta indietro quando il corpo parte, prosegue quando si ferma).
func _simulate(delta: float, vel: Vector2) -> void:
	# Anche il sobbalzo dei passi (piede appoggiato, bob) muove il corpo: le stoffe lo sentono.
	var drop := bob + _foot_lift() * clampf(plant, 0.0, 1.0)
	if _has_prev:
		vel.y += (drop - _drop_prev) / delta * height / FIGURE_SPAN
	_drop_prev = drop
	var acc := Vector2.ZERO
	if _has_prev:
		acc = (vel - _prev_vel) / delta
	_prev_vel = vel
	_has_prev = true
	var f := 1.0 if facing >= 0.0 else -1.0
	var fwd := vel.x * f
	var acc_fwd := clampf(acc.x * f, -6000.0, 6000.0)
	var acc_y := clampf(acc.y, -9000.0, 9000.0)
	var speed := absf(fwd)

	# Cappello: cadendo la punta si alza, salendo si abbassa; all'atterraggio prosegue verso il basso.
	var hat_eq := clampf(vel.y * 0.00045 - speed * 0.0002, -0.45, 0.45)
	_hat_v += ((hat_eq - _hat_dyn) * 150.0 - _hat_v * 7.0 + acc_y * 0.00012 - acc_fwd * 0.00005) * delta
	_hat_dyn = clampf(_hat_dyn + _hat_v * delta, -0.7, 0.7)

	# Sciarpa: più pesante e lenta; la corsa e la caduta la sollevano all'indietro.
	var scarf_eq := clampf(speed * 0.0016 + vel.y * 0.0005, -0.3, 0.75)
	_scarf_v += ((scarf_eq - _scarf_dyn) * 55.0 - _scarf_v * 6.0 + acc_fwd * 0.0002 + acc_y * 0.00006) * delta
	_scarf_dyn = clampf(_scarf_dyn + _scarf_v * delta, -0.4, 1.0)
	# L'onda corre più veloce e ampia con la velocità.
	_phase_dyn = fmod(_phase_dyn + delta * (2.2 + speed * 0.035 + absf(vel.y) * 0.008), TAU * 64.0)
	var wave_eq := clampf(4.0 + speed * 0.055 + absf(vel.y) * 0.012, 0.0, 26.0)
	_wave_dyn = lerpf(_wave_dyn, wave_eq, 1.0 - exp(-3.0 * delta))

	# Orlo: trascinato dalla velocità, oscilla quando si cambia passo; in volo si gonfia.
	var hem_eq := clampf(fwd * 0.0016, -0.6, 0.6)
	_hem_v += ((hem_eq - _hem_dyn) * 120.0 - _hem_v * 9.0 + acc_fwd * 0.00035) * delta
	_hem_dyn = clampf(_hem_dyn + _hem_v * delta, -0.8, 0.8)
	_open_dyn = lerpf(_open_dyn, clampf(maxf(0.0, vel.y) * 0.0006, 0.0, 0.5), 1.0 - exp(-6.0 * delta))


# ---------------------------------------------------------------- Geometria

## Quanto il piede più basso si è alzato rispetto alla posa a riposo (px della tela, >= 0).
func _foot_lift() -> float:
	var lift := INF
	for leg in 2:
		var back := leg == 1
		var pts: Array[Vector2] = FOOT_BACK if back else FOOT_FRONT
		var rest := -INF
		var now := -INF
		for p in pts:
			rest = maxf(rest, p.y)
			now = maxf(now, _leg(p, HIP_BACK if back else HIP_FRONT, KNEE_BACK if back else KNEE_FRONT, leg_back if back else leg_front, 1.0).y)
		lift = minf(lift, rest - now)
	return maxf(0.0, lift)


static func _rot(p: Vector2, c: Vector2, a: float) -> Vector2:
	return c + (p - c).rotated(a)


## Come nello shader: ginocchio (piega morbida) poi anca, angoli scalati dal peso.
static func _leg(p: Vector2, hip: Vector2, knee: Vector2, ang: Vector2, w: float) -> Vector2:
	var kw := smoothstep(knee.y - KNEE_SOFT, knee.y + KNEE_SOFT, p.y)
	var q := _rot(p, knee, ang.y * kw * w)
	return _rot(q, hip, ang.x * w)


static func _chest_weight(y: float) -> float:
	return 1.0 - smoothstep(CHEST_Y, HIP_CENTER.y, y)


## Inclinazione, schiacciamento e respiro (campi morbidi in altezza) come nel vertex shader.
func _body_fields(p: Vector2, q: Vector2) -> Vector2:
	q = _rot(q, HIP_CENTER, lean * _chest_weight(p.y))
	var span := FEET.y - TOP_Y
	var u := clampf((FEET.y - p.y) / span, 0.0, 1.0)
	var rise := lerpf(u, smoothstep(0.12, 0.8, u), 0.6)
	var waist := smoothstep(0.08, 0.42, u) * (1.0 - smoothstep(0.5, 0.92, u))
	var chest := smoothstep(0.35, 0.6, u) * (1.0 - smoothstep(0.7, 0.85, u))
	var side := clampf(p.x - AXIS_X, -160.0, 160.0)
	q.y -= squash * span * rise + breath * BREATH_PX * smoothstep(0.3, 0.7, u)
	q.x += side * (breath * BREATH_WIDEN * chest - squash * BULGE * waist)
	return q


## Peso bilineare dal riquadro [param tile] della mappa (come textureLod nello shader), uv della tela.
static func _weights_at(uv: Vector2, tile: int) -> Color:
	if _weights_img == null:
		_weights_img = _image_of(WEIGHTS_TEX)
		if _weights_img == null:
			return Color(0, 0, 0, 1)
	var sz := _weights_img.get_size()
	var half := sz.x >> 1
	var x := clampf(uv.x * half - 0.5, 0.0, half - 1.0) + tile * half
	var y := clampf(uv.y * sz.y - 0.5, 0.0, sz.y - 1.0)
	var x0 := int(x)
	var y0 := int(y)
	var x1 := mini(x0 + 1, sz.x - 1)
	var y1 := mini(y0 + 1, sz.y - 1)
	var top := _weights_img.get_pixel(x0, y0).lerp(_weights_img.get_pixel(x1, y0), x - x0)
	var bottom := _weights_img.get_pixel(x0, y1).lerp(_weights_img.get_pixel(x1, y1), x - x0)
	return top.lerp(bottom, y - y0)


## La griglia del corpo, costruita una volta e condivisa: prima lo strato di dietro (gamba lontana e
## coda della sciarpa, UV.x + 2, disegnato sotto), poi la figura. Le celle trasparenti non vengono emesse.
static func _figure_mesh() -> ArrayMesh:
	if _mesh_cache:
		return _mesh_cache
	var verts := PackedVector2Array()
	var uvs := PackedVector2Array()
	var idx := PackedInt32Array()
	var xs := PackedFloat32Array()
	var ys := PackedFloat32Array()
	for i in GRID_COLS + 1:
		xs.append(CANVAS.x * i / GRID_COLS)
	for j in GRID_ROWS_BODY:
		ys.append(LEGS_FROM_Y * j / GRID_ROWS_BODY)
	for j in GRID_ROWS_LEGS + 1:
		ys.append(LEGS_FROM_Y + (CANVAS.y - LEGS_FROM_Y) * j / GRID_ROWS_LEGS)
	_add_grid(_image_of(BACK_TEX), xs, ys, 1.0, verts, uvs, idx)
	_add_grid(_image_of(FIGURE_TEX), xs, ys, 0.0, verts, uvs, idx)
	_mesh_cache = _make_mesh(verts, uvs, idx)
	return _mesh_cache


## Il polsino: una piccola griglia sopra la mano, con gli stessi pesi del corpo.
static func _cuff_mesh() -> ArrayMesh:
	if _cuff_cache:
		return _cuff_cache
	var verts := PackedVector2Array()
	var uvs := PackedVector2Array()
	var idx := PackedInt32Array()
	var xs := PackedFloat32Array()
	var ys := PackedFloat32Array()
	for i in 5:
		xs.append(CUFF_RECT.position.x + CUFF_RECT.size.x * i / 4.0)
	for j in 3:
		ys.append(CUFF_RECT.position.y + CUFF_RECT.size.y * j / 2.0)
	_add_grid(null, xs, ys, 0.0, verts, uvs, idx)
	_cuff_cache = _make_mesh(verts, uvs, idx)
	return _cuff_cache


## L'immagine di una texture per leggerne i pixel; null se il renderer non la conserva
## (avvio --headless): allora la griglia resta intera e i pesi sul processore valgono zero.
static func _image_of(tex: Texture2D) -> Image:
	var img := tex.get_image()
	if img == null or img.is_empty():
		return null
	if img.is_compressed():
		img.decompress()
	return img


## Aggiunge una griglia di vertici (px della tela, origine ai piedi) e i suoi triangoli;
## la diagonale alterna a scacchiera così la piega non ha una direzione preferita.
static func _add_grid(img: Image, xs: PackedFloat32Array, ys: PackedFloat32Array, layer: float,
		verts: PackedVector2Array, uvs: PackedVector2Array, idx: PackedInt32Array) -> void:
	var base := verts.size()
	var nx := xs.size()
	for y in ys:
		for x in xs:
			verts.append(Vector2(x, y) - FEET)
			uvs.append(Vector2(x / CANVAS.x + 2.0 * layer, y / CANVAS.y))
	var bounds := Rect2i(Vector2i.ZERO, Vector2i(CANVAS))
	for j in ys.size() - 1:
		for i in nx - 1:
			if img:
				var r := Rect2i(int(xs[i]) - 2, int(ys[j]) - 2, int(xs[i + 1] - xs[i]) + 5, int(ys[j + 1] - ys[j]) + 5).intersection(bounds)
				if r.size.x <= 0 or r.size.y <= 0 or img.get_region(r).is_invisible():
					continue
			var a := base + j * nx + i
			if (i + j) % 2 == 0:
				idx.append_array([a, a + 1, a + nx + 1, a, a + nx + 1, a + nx])
			else:
				idx.append_array([a, a + 1, a + nx, a + 1, a + nx + 1, a + nx])


static func _make_mesh(verts: PackedVector2Array, uvs: PackedVector2Array, idx: PackedInt32Array) -> ArrayMesh:
	# Via i vertici delle celle scartate: il vertex shader lavora solo su quelli usati.
	var remap := PackedInt32Array()
	remap.resize(verts.size())
	remap.fill(-1)
	var used_v := PackedVector2Array()
	var used_uv := PackedVector2Array()
	for n in idx.size():
		var v := idx[n]
		if remap[v] < 0:
			remap[v] = used_v.size()
			used_v.append(verts[v])
			used_uv.append(uvs[v])
		idx[n] = remap[v]
	verts = used_v
	uvs = used_uv
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = verts
	arrays[Mesh.ARRAY_TEX_UV] = uvs
	arrays[Mesh.ARRAY_INDEX] = idx
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	return mesh


