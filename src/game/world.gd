extends Node2D
## Mondo di gioco a scorrimento laterale per un solo giocatore: stanze, porte, nemici, colpi,
## danni, raccolta, morte e ripartenza, boss e schermata finale.
## La presentazione (sfondi, terreno, luci, decorazioni, effetti, post-processing) sta in nodi a parte.

## Esc: chiede al menu di riprendere il controllo.
signal exit_requested

const PlayerScript := preload("res://game/player.gd")
const EnemyScript := preload("res://game/enemy.gd")
const ProjectileScript := preload("res://game/projectile.gd")
const PickupScript := preload("res://game/pickup.gd")
const HudScript := preload("res://game/hud.gd")
const BackdropScript := preload("res://game/backdrop.gd")
const TerrainScript := preload("res://game/terrain.gd")
const DecorScript := preload("res://game/decor.gd")
const NpcScript := preload("res://game/npc.gd")
const DialogueBoxScript := preload("res://game/dialogue_box.gd")
const FinaleScript := preload("res://game/finale.gd")
const POST_SHADER := preload("res://game/shaders/post_screen_grade.gdshader")

## Livello di collisione delle mensole attraversabili dal basso.
const LEDGE_LAYER := 4
const StationScript := preload("res://game/save_station.gd")
const SAVE_PATH := "user://ferruccio-save.json"
var save_path := SAVE_PATH
var stations: Dictionary = {}
var defeated: Dictionary = {}
var checkpoint: Dictionary = {}
var _stations_root: Node2D
var _saved_state: Dictionary = {}
var resume_save := true

var room: Dictionary = {}
var room_index := 0
var room_cleared := false
var coins := 0
var cleared: Dictionary = {}   # indice stanza -> bool
var game_over := false
var victory := false
var fx_root: Node2D
var player: PlayerScript
## Stato narrativo (variabili della bibbia, dialoghi ascoltati): sopravvive a cadute e ripartenze.
var story := Story.new()

var _backdrop
var _terrain
var _decor: Node2D
var _walls: Node2D
var _entities: Node2D
var _hud
var _fade: ColorRect
var _post_mat: ShaderMaterial
var _solids: Array = []
var _rng := RandomNumberGenerator.new()
var _room_t := 0.0
var _death_t := -1.0
var _shown_room := -1
## Solo per test visivi (--demo): il giocatore corre, salta e colpisce da solo.
var _demo := "--demo" in OS.get_cmdline_user_args()
var _demo_t := 0.0
var _npcs: Node2D
var _dialogue
var _talk_npc: Node
## Secondi prima di ridare il controllo dopo un dialogo: il tasto che lo chiude non deve far saltare.
var _talk_lock := 0.0
## Finale della storia (game/finale.gd) e punto in cui è caduto il Custode.
var _finale
var _boss_fall := Vector2.ZERO


func _ready() -> void:
	_rng.randomize()
	_backdrop = BackdropScript.new()
	add_child(_backdrop)
	_decor = Node2D.new()
	_decor.z_index = 2
	add_child(_decor)
	_stations_root = Node2D.new()
	_stations_root.z_index = 11
	add_child(_stations_root)
	_terrain = TerrainScript.new()
	_terrain.z_index = 5
	add_child(_terrain)
	_walls = Node2D.new()
	add_child(_walls)
	# Personaggi non giocanti: dietro a Ferruccio e ai nemici, davanti al terreno.
	_npcs = Node2D.new()
	_npcs.name = "Npcs"
	_npcs.z_index = 9
	add_child(_npcs)
	_entities = Node2D.new()
	_entities.name = "Entities"
	_entities.z_index = 10
	add_child(_entities)
	fx_root = Node2D.new()
	fx_root.z_index = 20
	add_child(fx_root)

	_build_overlays()
	_dialogue = DialogueBoxScript.new()
	add_child(_dialogue)
	_dialogue.closed.connect(_on_dialogue_closed)
	_dialogue.effect.connect(_on_dialogue_effect)
	_dialogue.voice.connect(_on_dialogue_voice)

	player = PlayerScript.new()
	player.setup(Vector2.ZERO)
	player.world = self
	player.slash_requested.connect(_do_slash)
	_entities.add_child(player)

	# Solo per test visivi: godot --path src -- --play --room=3
	var start_room := 0
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--room="):
			start_room = clampi(int(a.trim_prefix("--room=")), 0, Room.COUNT - 1)
	# Solo per test: --story=variabile:valore,... --cleared (stanza già liberata) --talk (vedi _test_talk).
	_apply_test_story()
	_load_room(start_room, true, "--cleared" in OS.get_cmdline_user_args())
	var explicit_room := false
	for arg in OS.get_cmdline_user_args():
		explicit_room = explicit_room or arg.begins_with("--room=")
	if resume_save and not explicit_room:
		_restore_save()
	if "--boss-defeated" in OS.get_cmdline_user_args():
		get_tree().create_timer(1.5).timeout.connect(_test_defeat_boss)
	if "--talk" in OS.get_cmdline_user_args():
		get_tree().create_timer(5.0).timeout.connect(_test_talk)


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		Engine.time_scale = 1.0
		exit_requested.emit()


func _process(delta: float) -> void:
	if _demo:
		_demo_input(delta)
	_update_talk(delta)
	_update_stations()
	_update_branch()
	var cam := get_viewport().get_camera_2d()
	var center: Vector2 = cam.get_screen_center_position() if cam else room.get("size", Vector2(1280, 720)) * 0.5
	_backdrop.update_camera(center)


func _physics_process(delta: float) -> void:
	if game_over or room.is_empty() or is_talking():
		return
	_room_t += delta
	_check_contacts()
	_check_bullets()
	_check_pickups()
	_check_cleared()
	_check_doors()
	_check_death(delta)
	Audio.set_loop_sfx("vespa_ronzio", _wasps_alive() > 0)


## Vespe ancora in volo nella stanza (per il ronzio continuo).
func _wasps_alive() -> int:
	var n := 0
	for e in get_tree().get_nodes_in_group("enemies"):
		if e.kind == "vespa":
			n += 1
	return n


func _demo_input(delta: float) -> void:
	_demo_t += delta
	Input.action_press("move_right")
	# [azione, periodo, sfasamento]: il secondo "jump", 0.38 s dopo il primo, è il doppio salto.
	var presses := {}
	for action in [["attack", 0.7, 0.0], ["jump", 1.9, 0.5], ["jump", 1.9, 0.12]]:
		var on: bool = fmod(_demo_t + float(action[2]), float(action[1])) < 0.12
		presses[action[0]] = bool(presses.get(action[0], false)) or on
	for a in presses:
		if presses[a]:
			Input.action_press(a)
		else:
			Input.action_release(a)


# ---------------------------------------------------------------- Costruzione

func _build_overlays() -> void:
	var post_layer := CanvasLayer.new()
	post_layer.layer = 5
	add_child(post_layer)
	var post := ColorRect.new()
	post.set_anchors_preset(Control.PRESET_FULL_RECT)
	post.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_post_mat = ShaderMaterial.new()
	_post_mat.shader = POST_SHADER
	post.material = _post_mat
	post_layer.add_child(post)

	var ui := CanvasLayer.new()
	ui.layer = 10
	add_child(ui)
	_hud = HudScript.new()
	_hud.world = self
	ui.add_child(_hud)

	var fade_layer := CanvasLayer.new()
	fade_layer.layer = 20
	add_child(fade_layer)
	_fade = ColorRect.new()
	_fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	_fade.color = Color("#050608")
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	fade_layer.add_child(_fade)


func _apply_grade(th: Dictionary) -> void:
	var tint: Vector3 = th.tint
	_post_mat.set_shader_parameter("tint", tint)
	_post_mat.set_shader_parameter("contrast", th.contrast)
	_post_mat.set_shader_parameter("saturation", th.saturation)
	_post_mat.set_shader_parameter("bloom_strength", th.bloom)
	_post_mat.set_shader_parameter("vignette", th.vignette)
	# Viraggio e velo di luce per area (vedi Themes.apply_grade).
	Themes.apply_grade(_post_mat, th)


# ---------------------------------------------------------------- Stanze

func _load_room(idx: int, from_left: bool, cleared_now: bool) -> void:
	room_index = idx
	room = Room.build(idx)
	room_cleared = cleared_now
	var th := Themes.get_theme(room["theme"])
	_backdrop.build(room["theme"], room["size"], room["floor"], Room.CAMERA_ZOOM)
	_terrain.build(room, th)
	_terrain.set_doors(_left_open(), _right_open())
	_build_walls()
	_build_decor(th)
	_build_npcs()
	_build_stations()
	_apply_grade(th)
	Audio.stop_loops()
	Audio.play_area(room["theme"])
	_fade_in()
	if idx != _shown_room:
		_shown_room = idx
		_hud.area_title(room["name"], room["subtitle"])

	var spawn: Vector2 = Room.entry_points(room, from_left)[0]
	# Solo per test visivi: --at=X fa comparire il giocatore in quel punto del pavimento.
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--at="):
			spawn = Vector2(float(a.trim_prefix("--at=")), float(room["floor"]) - 30.0)
	player.teleport(spawn)
	player.apply_room(room["size"])
	player.apply_theme(th)

	_room_t = 0.0
	_death_t = -1.0
	_clear_hostile()
	_revive_player()
	if not cleared_now:
		for e in room["enemies"]:
			if not defeated.has(_enemy_id(e["type"], e["pos"])):
				_spawn_enemy(e["type"], e["pos"])
	for p in room.get("secrets", []):
		if not defeated.has(_enemy_id("secret", p)):
			_spawn_pickup(p, "secret", 15)


func _left_open() -> bool:
	return room_index > 0


func _right_open() -> bool:
	# Le aree ordinarie si esplorano liberamente; il Custode resta l'ultimo incontro.
	return room_index < Room.COUNT - 1


func _build_walls() -> void:
	for c in _walls.get_children():
		var old := c as StaticBody2D
		old.collision_layer = 0
		old.queue_free()
	_solids = Room.solids(room, _left_open(), _right_open())
	for r in _solids:
		_add_body(r, false)
	for l in room["ledges"]:
		_add_body(l, true)


func _add_body(r: Rect2, one_way: bool) -> void:
	var body := StaticBody2D.new()
	var cs := CollisionShape2D.new()
	var sh := RectangleShape2D.new()
	sh.size = r.size
	cs.shape = sh
	cs.position = r.get_center()
	if one_way:
		cs.one_way_collision = true
		body.collision_layer = 0
		body.set_collision_layer_value(LEDGE_LAYER, true)
	body.add_child(cs)
	_walls.add_child(body)


func _build_decor(th: Dictionary) -> void:
	for c in _decor.get_children():
		c.queue_free()
	for d in room["decor"]:
		var node = DecorScript.new()
		node.setup(d["kind"], th, d["pos"])
		_decor.add_child(node)


func _clear_hostile() -> void:
	for group in ["enemies", "bullets", "pickups"]:
		for n in get_tree().get_nodes_in_group(group):
			n.queue_free()


## Dopo la morte il giocatore riparte con tutta la vita.
func _revive_player() -> void:
	if player.dead:
		player.revive()


func _go(idx: int, from_left: bool) -> void:
	_load_room(idx, from_left, bool(cleared.get(idx, false)))


func _go_restart() -> void:
	if not checkpoint.is_empty():
		_restore_state(_saved_state)
		return
	# Ferruccio è caduto: si torna all'ingresso della stanza corrente e si riparte da zero.
	_load_room(room_index, true, bool(cleared.get(room_index, false)))


func _check_doors() -> void:
	if player.dead:
		return
	var size: Vector2 = room["size"]
	var door_top: float = float(room["floor"]) - Room.DOOR_H
	var pos: Vector2 = player.global_position
	if pos.y < door_top:
		return
	if _right_open() and pos.x >= size.x - Room.EDGE - 10.0:
		_go(room_index + 1, true)
	elif _left_open() and pos.x <= Room.EDGE + 10.0:
		_go(room_index - 1, false)


func _check_cleared() -> void:
	if room_cleared or _room_t < 0.8:
		return
	if not get_tree().get_nodes_in_group("enemies").is_empty():
		return
	cleared[room_index] = true
	_mark_cleared()
	if room["boss"]:
		_start_finale()
	else:
		var size: Vector2 = room["size"]
		_spawn_pickup(Vector2(size.x * 0.5, float(room["floor"]) - 40.0), "centesimi", int(Tuning.data.rewards.room_clear_coins))


## Se il giocatore è caduto, dopo una breve pausa la stanza riparte dall'ingresso.
func _check_death(delta: float) -> void:
	if not player.dead:
		_death_t = -1.0
		return
	if _death_t < 0.0:
		_death_t = float(Tuning.data.player.respawn_delay)
	_death_t -= delta
	if _death_t <= 0.0:
		_death_t = -1.0
		_go_restart()


func _mark_cleared() -> void:
	room_cleared = true
	_build_walls()
	_terrain.open_doors(_left_open(), _right_open())
	Audio.sfx("portale")
	if not room["boss"]:
		_hud.toast("Il passaggio si è aperto")


func _end_game(won: bool) -> void:
	game_over = true
	victory = won
	_hud.show_end(won)
	Audio.stop_loops()
	Audio.stop_music(2.5)


## Effetti visivi (particelle, hitstop, scossa di camera) in un punto del mondo.
func _fx(kind: String, pos: Vector2, col: Color, dir: float) -> void:
	match kind:
		"hit":
			Fx.hit(fx_root, pos, col, dir)
			Fx.hitstop(self, 0.045)
			_shake_near(pos, 0.18)
		"death":
			Fx.death(fx_root, pos, col)
			Fx.hitstop(self, 0.09)
			_shake_near(pos, 0.4)
		"hurt":
			Fx.hit(fx_root, pos, Color(1.0, 0.35, 0.3), dir)
			Fx.hitstop(self, 0.07)
		"collect":
			Fx.sparkle(fx_root, pos, col)
		"shock":
			Fx.ring(fx_root, pos, col, 150.0, 0.45)
			Fx.dust(fx_root, pos, 26)
			_shake_near(pos, 0.55)
		"burst":
			Fx.ring(fx_root, pos, col, 190.0, 0.5)
			_shake_near(pos, 0.3)


func _shake_near(pos: Vector2, amount: float) -> void:
	if player.global_position.distance_to(pos) < 1100.0:
		player.add_trauma(amount)


# ---------------------------------------------------------------- Giocatore

## Il giocatore ha colpito: cerca i nemici nell'area del fendente.
func _do_slash(pos: Vector2, facing: float, down: bool, air: bool) -> void:
	if game_over or player.dead:
		return
	var center := pos + Vector2(0, 42) if down else pos + Vector2(facing * 46.0, -6.0)
	var half := Vector2(30, 32) if down else Vector2(40, 30)
	var bounce := false
	for e in get_tree().get_nodes_in_group("enemies"):
		if e.is_queued_for_deletion():
			continue
		if _overlap(center, half, e.global_position, e.half):
			_hit_enemy(e, 1, Color(1.0, 0.95, 0.85), facing, down)
			if down and air:
				bounce = true
	if bounce:
		player.bounce()


func _hurt_player(dmg: int, from_x: float) -> void:
	if game_over or player.dead or player.iframes > 0.0:
		return
	if player.try_parry(from_x):
		_fx("shock", player.global_position, Color(0.65, 0.9, 1.0), player.facing)
		_hud.toast("Parata perfetta! Scatto e fendente ricaricati")
		return
	player.iframes = float(Tuning.data.player.hurt_iframes)
	player.take_damage(dmg)
	var dir := 1.0 if player.global_position.x >= from_x else -1.0
	_fx("hurt", player.global_position, Color.WHITE, dir)
	if player.dead:
		_hud.toast("Ferruccio è caduto")
	else:
		player.knock(dir)


## Il giocatore se è in vita (serve all'IA dei nemici), altrimenti null.
func alive_player() -> Node2D:
	return null if player.dead else player


## Il boss della stanza, se presente (serve all'HUD per la barra della vita).
func boss() -> Node:
	for e in get_tree().get_nodes_in_group("enemies"):
		if e.kind == "custode" and not e.is_queued_for_deletion():
			return e
	return null


# ---------------------------------------------------------------- Nemici, proiettili, raccolta

func _spawn_enemy(kind: String, pos: Vector2) -> void:
	var e = EnemyScript.new()
	e.set_meta("save_id", _enemy_id(kind, pos))
	e.setup({"type": kind, "pos": pos}, self)
	_entities.add_child(e)


func _spawn_pickup(pos: Vector2, item: String, value: int) -> void:
	var pk = PickupScript.new()
	pk.setup({"pos": pos, "item": item, "value": value})
	_entities.add_child(pk)


## Colpo a un nemico: la spinta va nel verso del fendente (in basso per il colpo in picchiata);
## quanto lo sposta e lo stordisce lo decide il nemico (enemy.gd, take_hit).
func _hit_enemy(e: Node, dmg: int, col: Color, dir: float, down: bool = false) -> void:
	var push := Vector2(dir * 0.35, 1.0).normalized() if down else Vector2(dir, -0.15).normalized()
	var killed: bool = e.take_hit(dmg, push)
	if killed:
		_fx("death", e.global_position, Art.enemy_color(e.kind), dir)
		_on_enemy_killed(e)
	else:
		_fx("hit", e.global_position, col, dir)


func _on_enemy_killed(e: Node) -> void:
	defeated[str(e.get_meta("save_id"))] = true
	if e.kind == "statua" and str(e.get_meta("save_id")) == Room.save_station_id(room_index):
		var floor_y := float(room["floor"])
		for surface in room["ledges"] + room["blocks"]:
			var r: Rect2 = surface
			if e.global_position.x >= r.position.x and e.global_position.x <= r.end.x and r.position.y >= e.global_position.y:
				floor_y = minf(floor_y, r.position.y)
		stations[str(e.get_meta("save_id"))] = {"room": room_index, "x": e.global_position.x, "y": floor_y}
		_build_stations()
		_hud.toast("Un'incudine è apparsa: avvicinati e premi W per salvare")
	if e.kind == "custode":
		_boss_fall = e.global_position
	_spawn_pickup(e.global_position, "centesimi", int(e.coins))
	if e.kind != "custode" and _rng.randf() < float(Tuning.data.rewards.heal_chance):
		_spawn_pickup(e.global_position + Vector2(0, -30), "mozzarella", 1)


func _check_contacts() -> void:
	for e in get_tree().get_nodes_in_group("enemies"):
		if player.dead:
			return
		if e.is_queued_for_deletion():
			continue
		if not _overlap(e.global_position, e.half, player.global_position, PlayerScript.HALF):
			continue
		if e.touch_cd > 0.0:
			continue
		e.touch_cd = 0.8
		_hurt_player(int(e.damage), e.global_position.x)


func _check_bullets() -> void:
	for b in get_tree().get_nodes_in_group("bullets"):
		if b.is_queued_for_deletion():
			continue
		if is_solid(b.global_position):
			b.queue_free()
			continue
		if player.dead:
			continue
		if _overlap(b.global_position, Vector2(b.radius, b.radius), player.global_position, PlayerScript.HALF):
			_hurt_player(int(b.damage), b.global_position.x)
			b.queue_free()


func _check_pickups() -> void:
	if player.dead:
		return
	for pk in get_tree().get_nodes_in_group("pickups"):
		if pk.is_queued_for_deletion():
			continue
		if _overlap(pk.global_position, Vector2(14, 14), player.global_position, PlayerScript.HALF):
			_collect(pk)
			return


func _collect(pk: Node) -> void:
	if pk.item == "secret":
		defeated[_enemy_id("secret", pk.global_position)] = true
		coins += int(pk.value)
		player.heal(1)
		_hud.toast("Tesoro trovato: +15 centesimi e una maschera")
		_fx("collect", pk.global_position, Color(1.0, 0.8, 0.35), 0.0)
	elif pk.item == "centesimi":
		coins += int(pk.value)
		Audio.sfx("moneta")
		_fx("collect", pk.global_position, Color(1.0, 0.8, 0.35), 0.0)
	elif pk.item == "mozzarella":
		player.heal(1)
		Audio.sfx("mozzarella")
		_fx("collect", pk.global_position, Color(1.0, 0.97, 0.9), 0.0)
	pk.queue_free()


## Usato dai nemici: proiettile singolo.
func enemy_fire(pos: Vector2, dir: Vector2, speed: float, col: Color = Color(1.0, 0.68, 0.38)) -> void:
	var b = ProjectileScript.new()
	b.setup({
		"pos": pos, "vel": dir.normalized() * speed,
		"dmg": 1, "color": col, "life": 3.0, "radius": 6.0,
	})
	_entities.add_child(b)


## Usato dal boss: proiettili radiali.
func enemy_burst(pos: Vector2, count: int) -> void:
	_fx("burst", pos, Color(1.0, 0.7, 0.3), 0.0)
	for i in count:
		enemy_fire(pos, Vector2.RIGHT.rotated(TAU * float(i) / float(count)), 260.0)


## Usato dal boss all'atterraggio: onda d'urto a terra in entrambe le direzioni.
func enemy_shockwave(pos: Vector2) -> void:
	_fx("shock", pos, Color(1.0, 0.8, 0.5), 0.0)
	enemy_fire(pos + Vector2(0, -8), Vector2.LEFT, 400.0)
	enemy_fire(pos + Vector2(0, -8), Vector2.RIGHT, 400.0)


## Muri, blocchi e grate chiuse (i proiettili si fermano qui).
func is_solid(p: Vector2) -> bool:
	for s in _solids:
		if (s as Rect2).has_point(p):
			return true
	return false


## Qualunque superficie su cui si può stare in piedi, mensole comprese.
func is_ground(p: Vector2) -> bool:
	if is_solid(p):
		return true
	for l in room.get("ledges", []):
		if (l as Rect2).has_point(p):
			return true
	return false


func _enemy_id(kind: String, pos: Vector2) -> String:
	return "%d:%s:%d:%d" % [room_index, kind, roundi(pos.x), roundi(pos.y)]


func _build_stations() -> void:
	for n in _stations_root.get_children():
		_stations_root.remove_child(n)
		n.queue_free()
	for id in stations:
		var data: Dictionary = stations[id]
		# Anche i vecchi salvataggi non mostrano più incudini sulle statue escluse.
		if str(id) != Room.save_station_id(int(data["room"])):
			continue
		if int(data["room"]) != room_index:
			continue
		var node := StationScript.new()
		node.position = Vector2(float(data["x"]), float(data["y"]))
		node.set_meta("station_id", id)
		_stations_root.add_child(node)


func _update_stations() -> void:
	var best: Node2D = null
	var nearest := 80.0
	for node in _stations_root.get_children():
		node.focused = false
		var distance: float = (player.global_position + Vector2(0, PlayerScript.HALF.y)).distance_to(node.position)
		if distance < nearest:
			nearest = distance
			best = node
	if best == null or player.dead or is_talking() or in_cutscene() or game_over or _talk_lock > 0.0:
		return
	best.focused = true
	if Input.is_action_just_pressed("interact") and player.is_on_floor():
		_save_at(best.position)


func _update_branch() -> void:
	if player.dead or game_over or is_talking() or in_cutscene() or _talk_lock > 0.0:
		return
	if int(room.get("branch", -1)) < 0 or not player.is_on_floor():
		return
	var platform: Rect2 = room["branch_platform"]
	var feet := player.global_position + Vector2(0, PlayerScript.HALF.y)
	if feet.x >= platform.position.x and feet.x <= platform.end.x and absf(feet.y - platform.position.y) <= 6.0 and Input.is_action_just_pressed("interact"):
		_go(int(room["branch"]), true)


func _save_at(pos: Vector2) -> void:
	var new_checkpoint := {"room": room_index, "x": pos.x, "y": pos.y - PlayerScript.HALF.y}
	var state := {"version": 1, "checkpoint": new_checkpoint, "coins": coins, "cleared": cleared, "defeated": defeated, "stations": stations, "vars": story.vars, "seen": story.seen}
	var file := FileAccess.open(save_path + ".tmp", FileAccess.WRITE)
	if file == null:
		_hud.toast("Salvataggio non riuscito")
		return
	file.store_string(JSON.stringify(state))
	file.flush()
	var error := file.get_error()
	file.close()
	if error != OK or DirAccess.rename_absolute(save_path + ".tmp", save_path) != OK:
		_hud.toast("Salvataggio non riuscito")
		return
	checkpoint = new_checkpoint
	_saved_state = state.duplicate(true)
	player.heal(player.max_hp)
	_hud.toast("Partita salvata · Vita ripristinata")


func _restore_save() -> void:
	if not FileAccess.file_exists(save_path):
		return
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(save_path))
	if not parsed is Dictionary or int(parsed.get("version", 0)) != 1:
		_hud.toast("Salvataggio non valido")
		return
	var point = parsed.get("checkpoint", {})
	if not point is Dictionary or not point.has_all(["room", "x", "y"]) or int(point["room"]) < 0 or int(point["room"]) >= Room.COUNT:
		return
	for key in ["cleared", "defeated", "stations", "vars", "seen"]:
		if not parsed.get(key) is Dictionary:
			return
	if not parsed.has("coins"):
		return
	for station in parsed["stations"].values():
		if not station is Dictionary or not station.has_all(["room", "x", "y"]):
			return
	var saved_room := Room.build(int(point["room"]))
	if float(point["x"]) < Room.EDGE or float(point["x"]) > saved_room["size"].x - Room.EDGE or float(point["y"]) < 0 or float(point["y"]) > float(saved_room["floor"]):
		return
	_saved_state = parsed.duplicate(true)
	_restore_state(_saved_state)


func _restore_state(state: Dictionary) -> void:
	checkpoint = state["checkpoint"].duplicate(true)
	coins = int(state["coins"])
	cleared.clear()
	for key in state["cleared"]:
		cleared[int(key)] = bool(state["cleared"][key])
	defeated = state["defeated"].duplicate(true)
	stations = state["stations"].duplicate(true)
	story.vars = state["vars"].duplicate(true)
	story.seen = state["seen"].duplicate(true)
	var idx := int(checkpoint["room"])
	player.revive()
	_load_room(idx, true, bool(cleared.get(idx, false)))
	player.teleport(Vector2(float(checkpoint["x"]), float(checkpoint["y"])))


# ---------------------------------------------------------------- Utilità

static func _overlap(a: Vector2, a_half: Vector2, b: Vector2, b_half: Vector2) -> bool:
	return absf(a.x - b.x) < a_half.x + b_half.x and absf(a.y - b.y) < a_half.y + b_half.y


func _fade_in() -> void:
	_fade.modulate = Color(1, 1, 1, 1)
	var tw := create_tween()
	tw.tween_property(_fade, "modulate:a", 0.0, 0.7).set_trans(Tween.TRANS_SINE)


# ---------------------------------------------------------------- Personaggi e dialoghi

## Crea i personaggi della stanza: collocazioni in Room.ROOMS (chiave "npcs"),
## aspetto, comportamento e testi in data/dialogues.json.
func _build_npcs() -> void:
	for c in _npcs.get_children():
		c.queue_free()
	for d in (Room.ROOMS[room_index] as Dictionary).get("npcs", []):
		var n = NpcScript.new()
		n.setup(str(d["id"]), d["pos"], self)
		_npcs.add_child(n)


## Stato della stanza per le condizioni dei dialoghi (vedi Story.check).
func story_ctx() -> Dictionary:
	return {"cleared": room_cleared}


## Vero mentre il riquadro dei dialoghi è aperto: giocatore e nemici restano fermi.
func is_talking() -> bool:
	return _dialogue != null and _dialogue.is_open()


## Sceglie il personaggio più vicino con cui si può parlare (mostra il suo invito)
## e apre il dialogo col tasto "parla". Dopo il dialogo ridà il controllo con un attimo di ritardo.
func _update_talk(delta: float) -> void:
	_talk_lock = maxf(0.0, _talk_lock - delta)
	if is_talking():
		return
	if _talk_npc != null and _talk_lock <= 0.0:
		_talk_npc = null
		if not in_cutscene():
			_freeze_for_talk(false)
	var best: Node = null
	if _talk_npc == null and not game_over and not in_cutscene() and not player.dead and player.is_on_floor():
		var st := Story.settings()
		var rx := float(st.get("talk_radius_x", 78.0))
		var ry := float(st.get("talk_radius_y", 90.0))
		var feet: Vector2 = player.global_position + Vector2(0, PlayerScript.HALF.y)
		var best_d := INF
		for n in _npcs.get_children():
			if n.is_queued_for_deletion() or not n.can_talk():
				continue
			var d: Vector2 = n.global_position - feet
			if absf(d.x) < rx and absf(d.y) < ry and absf(d.x) < best_d:
				best = n
				best_d = absf(d.x)
	for n in _npcs.get_children():
		n.focused = n == best
	if best and InputMap.has_action("interact") and Input.is_action_just_pressed("interact"):
		start_talk(best)


## Apre il dialogo del personaggio (dal tasto "parla", dai test o dal finale).
func start_talk(n: Node) -> void:
	var entry := story.pick(n.key, story_ctx())
	if entry.is_empty():
		return
	_talk_npc = n
	_freeze_for_talk(true)
	n.focused = false
	var dx: float = n.global_position.x - player.global_position.x
	if absf(dx) > 2.0:
		player.facing = signf(dx)
	n.begin_talk(entry, player.global_position.x)
	_dialogue.open(entry, story)


## Durante il dialogo Ferruccio sta fermo e i nemici sospendono movimenti e attacchi.
## L'aspetto continua ad animarsi (respiro, sguardo): si ferma solo la fisica.
func _freeze_for_talk(on: bool) -> void:
	player.set_physics_process(not on)
	if on:
		player.velocity = Vector2.ZERO
		player.set("move_vel", Vector2.ZERO)
		player.set("attacking", 0.0)
		player.set("dashing", false)
	for group in ["enemies", "bullets"]:
		for e in get_tree().get_nodes_in_group(group):
			e.set_physics_process(not on)
			if on and e is CharacterBody2D:
				(e as CharacterBody2D).velocity = Vector2.ZERO


func _on_dialogue_closed() -> void:
	if is_instance_valid(_talk_npc):
		_talk_npc.end_talk()
	_talk_lock = 0.2


## Effetti chiesti dalle battute (dialogues.json, chiave "do").
func _on_dialogue_effect(what: String) -> void:
	match what:
		"heal":
			player.heal(1)
			_fx("collect", player.global_position + Vector2(0, -20), Color(1.0, 0.97, 0.9), 0.0)


func _on_dialogue_voice(who: String, on: bool) -> void:
	for n in _npcs.get_children():
		n.set_voice(on and who in n.speakers)


## Solo per test: --story=taddeo_trust:perdonato,agnese_memory:sopita imposta le variabili.
func _apply_test_story() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--story="):
			for pair in a.trim_prefix("--story=").split(","):
				var kv := pair.split(":")
				if kv.size() == 2:
					story.set_var(kv[0], kv[1])


## Solo per test visivi (--talk): apre il dialogo del personaggio --talk-npc=chiave (o del più
## vicino) e salta --talk-skip=N battute, per fotografare riquadro e scelte.
func _test_talk() -> void:
	var want := ""
	var skip := 0
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--talk-npc="):
			want = a.trim_prefix("--talk-npc=")
		elif a.begins_with("--talk-skip="):
			skip = int(a.trim_prefix("--talk-skip="))
	var target: Node = null
	var best := INF
	for n in _npcs.get_children():
		if not n.can_talk() or (want != "" and n.key != want):
			continue
		var d := absf(n.global_position.x - player.global_position.x)
		if d < best:
			best = d
			target = n
	if target == null:
		push_warning("--talk: nessun personaggio con cui parlare")
		return
	start_talk(target)
	for i in skip:
		_dialogue.debug_skip()


# ---------------------------------------------------------------- Finale

## Il Custode è caduto: invece della schermata finale parte la sequenza di Gregorio e Violante.
func _start_finale() -> void:
	if _finale != null:
		return
	# Se Ferruccio è caduto nello stesso istante del Custode, si rialza: la storia continua.
	_revive_player()
	_finale = FinaleScript.new()
	add_child(_finale)
	var at := _boss_fall if _boss_fall != Vector2.ZERO else player.global_position + Vector2(player.facing * 160.0, 0)
	_finale.start(self, at)


## Vero mentre il finale è in corso: Ferruccio resta fermo anche tra un dialogo e l'altro.
func in_cutscene() -> bool:
	return _finale != null and _finale.running


## Ferma (o libera) Ferruccio e i nemici durante una sequenza, come nei dialoghi.
func hold(on: bool) -> void:
	_freeze_for_talk(on)


## Crea un personaggio fuori dalle liste della stanza (finale).
func spawn_npc(key: String, pos: Vector2) -> Node2D:
	var n = NpcScript.new()
	n.setup(key, pos, self)
	_npcs.add_child(n)
	return n


## Apre il riquadro con un dialogo senza personaggio in scena (epilogo del finale).
func narrate(entry: Dictionary) -> void:
	if entry.is_empty():
		return
	_dialogue.open(entry, story)


## Materiale del post-processing: il finale lo vira verso la Libertà o la Concordia.
func post_material() -> ShaderMaterial:
	return _post_mat


## Fine della storia: schermata finale con i testi del finale scelto.
func finish_story(title: String, subtitle: String, quote: String) -> void:
	game_over = true
	victory = true
	_hud.show_end(true, title, subtitle, quote)
	Audio.stop_loops()


## Solo per test (--boss-defeated, con --room=4): il Custode cade subito e parte il finale.
func _test_defeat_boss() -> void:
	for e in get_tree().get_nodes_in_group("enemies"):
		if e.kind == "custode":
			_boss_fall = e.global_position
			e.queue_free()
