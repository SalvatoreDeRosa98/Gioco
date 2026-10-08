extends Node2D
## Partita co-op a scorrimento laterale. L'host decide stanze, nemici, danni e raccolta;
## ogni client muove il proprio cavaliere e riceve il resto tramite MultiplayerSpawner.
## La presentazione (sfondi, terreno, luci, decorazioni, effetti, post-processing) è locale.

const PlayerScript := preload("res://game/player.gd")
const EnemyScript := preload("res://game/enemy.gd")
const ProjectileScript := preload("res://game/projectile.gd")
const PickupScript := preload("res://game/pickup.gd")
const HudScript := preload("res://game/hud.gd")
const BackdropScript := preload("res://game/backdrop.gd")
const TerrainScript := preload("res://game/terrain.gd")
const DecorScript := preload("res://game/decor.gd")
const POST_SHADER := preload("res://game/shaders/post_screen_grade.gdshader")

const RESPAWN_DELAY := 2.5
## Livello di collisione delle mensole attraversabili dal basso.
const LEDGE_LAYER := 4

## Colore della sciarpa di ciascun giocatore, in ordine di ingresso.
var PLAYER_COLORS := [Color("#e8483f"), Color("#3fc1d9"), Color("#f2c046"), Color("#a77bff")]

var room: Dictionary = {}
var room_index := 0
var room_cleared := false
var stats: Dictionary = {}     # peer_id -> {hp, max_hp, dead, iframes}
var coins := 0
var cleared: Dictionary = {}   # indice stanza -> bool (verità dell'host)
var game_over := false
var victory := false
var fx_root: Node2D

var _backdrop
var _terrain
var _decor: Node2D
var _walls: Node2D
var _entities: Node2D
var _spawner: MultiplayerSpawner
var _hud
var _fade: ColorRect
var _post_mat: ShaderMaterial
var _solids: Array = []
var _rng := RandomNumberGenerator.new()
var _room_t := 0.0
var _transitioning := false
var _wipe_t := -1.0
var _shown_room := -1
## Solo per test visivi (--demo): il giocatore locale corre, salta e colpisce da solo.
var _demo := "--demo" in OS.get_cmdline_user_args()
var _demo_t := 0.0


func _ready() -> void:
	_rng.randomize()
	_backdrop = BackdropScript.new()
	add_child(_backdrop)
	_decor = Node2D.new()
	_decor.z_index = 2
	add_child(_decor)
	_terrain = TerrainScript.new()
	_terrain.z_index = 5
	add_child(_terrain)
	_walls = Node2D.new()
	add_child(_walls)
	_entities = Node2D.new()
	_entities.name = "Entities"
	_entities.z_index = 10
	add_child(_entities)
	fx_root = Node2D.new()
	fx_root.z_index = 20
	add_child(fx_root)

	_spawner = MultiplayerSpawner.new()
	_spawner.name = "Spawner"
	add_child(_spawner)
	_spawner.spawn_path = NodePath("../Entities")
	_spawner.spawn_function = _make_entity
	multiplayer.peer_disconnected.connect(_on_peer_left)

	_build_overlays()

	if multiplayer.is_server():
		_setup_roster()
		# Solo per test visivi: godot --path src -- --host --autostart --room=3
		var start_room := 0
		for a in OS.get_cmdline_user_args():
			if a.begins_with("--room="):
				start_room = clampi(int(a.trim_prefix("--room=")), 0, Room.COUNT - 1)
		_load_room.rpc(start_room, true, false)


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		Engine.time_scale = 1.0
		Net.leave()


func _process(delta: float) -> void:
	if _demo:
		_demo_input(delta)
	var cam := get_viewport().get_camera_2d()
	var center: Vector2 = cam.get_screen_center_position() if cam else room.get("size", Vector2(1280, 720)) * 0.5
	_backdrop.update_camera(center)


func _physics_process(delta: float) -> void:
	# Logica di gioco solo sull'host.
	if not multiplayer.is_server() or game_over or room.is_empty():
		return
	_room_t += delta
	for id in stats:
		var s: Dictionary = stats[id]
		s["iframes"] = maxf(0.0, float(s["iframes"]) - delta)
	_check_contacts()
	_check_bullets()
	_check_pickups()
	_check_cleared()
	_check_doors()
	_check_wipe(delta)


func _demo_input(delta: float) -> void:
	_demo_t += delta
	Input.action_press("move_right")
	for action in [["attack", 0.7, 0.0], ["jump", 1.9, 0.5]]:
		if fmod(_demo_t + float(action[2]), float(action[1])) < 0.12:
			Input.action_press(action[0])
		else:
			Input.action_release(action[0])


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


func _setup_roster() -> void:
	var first := Room.build(0)
	var entries: Array = Room.entry_points(first, true)
	var ids := _player_order()
	for i in ids.size():
		var id: int = ids[i]
		stats[id] = {"hp": int(Tuning.data.player.max_hp), "max_hp": int(Tuning.data.player.max_hp), "dead": false, "iframes": 0.0}
		_spawner.spawn({
			"kind": "player",
			"peer": id,
			"name": Net.players[id],
			"tint": PLAYER_COLORS[i % PLAYER_COLORS.size()],
			"pos": entries[i % entries.size()],
		})


func _make_entity(d: Dictionary) -> Node:
	match d["kind"]:
		"player":
			var p = PlayerScript.new()
			p.setup(d)
			p.world = self
			p.slash_requested.connect(_on_player_slash)
			return p
		"enemy":
			var e = EnemyScript.new()
			e.setup(d, self)
			return e
		"bullet":
			var b = ProjectileScript.new()
			b.setup(d)
			return b
		"pickup":
			var pk = PickupScript.new()
			pk.setup(d)
			return pk
	return Node.new()


# ---------------------------------------------------------------- Stanze

@rpc("authority", "call_local", "reliable")
func _load_room(idx: int, from_left: bool, cleared_now: bool) -> void:
	room_index = idx
	room = Room.build(idx)
	room_cleared = cleared_now
	_transitioning = false
	var th := Themes.get_theme(room["theme"])
	_backdrop.build(room["theme"], room["size"], room["floor"], Room.CAMERA_ZOOM)
	_terrain.build(room, th)
	_terrain.set_doors(_left_open(), _right_open())
	_build_walls()
	_build_decor(th)
	_apply_grade(th)
	_fade_in()
	if idx != _shown_room:
		_shown_room = idx
		_hud.area_title(room["name"], room["subtitle"])

	var ids := _player_order()
	var spawns: Array = Room.entry_points(room, from_left)
	# Solo per test visivi: --at=X fa comparire i giocatori in quel punto del pavimento.
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--at="):
			for i in spawns.size():
				spawns[i] = Vector2(float(a.trim_prefix("--at=")) + i * 44.0, float(room["floor"]) - 30.0)
	for i in ids.size():
		var p = _find_player(ids[i])
		if p and p.is_multiplayer_authority():
			p.teleport(spawns[i % spawns.size()])
			p.apply_room(room["size"])

	if multiplayer.is_server():
		_room_t = 0.0
		_wipe_t = -1.0
		_clear_hostile()
		_revive_dead()
		if not cleared_now:
			for e in room["enemies"]:
				_spawn_enemy(e["type"], e["pos"])


func _left_open() -> bool:
	return room_index > 0


func _right_open() -> bool:
	return room_cleared and room_index < Room.COUNT - 1


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


func _revive_dead() -> void:
	for id in stats:
		var s: Dictionary = stats[id]
		if s["dead"]:
			s["dead"] = false
			s["hp"] = int(s["max_hp"])
			s["iframes"] = 0.0
			_push_stats(id)


func _go(idx: int, from_left: bool) -> void:
	_transitioning = true
	_load_room.rpc(idx, from_left, bool(cleared.get(idx, false)))


func _go_restart() -> void:
	# Tutti caduti: si torna all'ingresso della stanza corrente e si riparte da zero.
	_transitioning = true
	_load_room.rpc(room_index, true, bool(cleared.get(room_index, false)))


func _check_doors() -> void:
	if _transitioning:
		return
	var size: Vector2 = room["size"]
	var door_top: float = float(room["floor"]) - Room.DOOR_H
	for p in _alive_players():
		var pos: Vector2 = p.global_position
		if pos.y < door_top:
			continue
		if _right_open() and pos.x >= size.x - Room.EDGE - 10.0:
			_go(room_index + 1, true)
			return
		if _left_open() and pos.x <= Room.EDGE + 10.0:
			_go(room_index - 1, false)
			return


func _check_cleared() -> void:
	if room_cleared or _room_t < 0.8:
		return
	if not get_tree().get_nodes_in_group("enemies").is_empty():
		return
	cleared[room_index] = true
	_mark_cleared.rpc()
	if room["boss"]:
		_end_game.rpc(true)
	else:
		var size: Vector2 = room["size"]
		_spawn_pickup(Vector2(size.x * 0.5, float(room["floor"]) - 40.0), "centesimi", int(Tuning.data.rewards.room_clear_coins))


func _check_wipe(delta: float) -> void:
	if stats.is_empty() or not _alive_players().is_empty():
		_wipe_t = -1.0
		return
	if _transitioning:
		return
	if _wipe_t < 0.0:
		_wipe_t = RESPAWN_DELAY
	_wipe_t -= delta
	if _wipe_t <= 0.0:
		_wipe_t = -1.0
		_go_restart()


@rpc("authority", "call_local", "reliable")
func _mark_cleared() -> void:
	room_cleared = true
	_build_walls()
	_terrain.open_doors(_left_open(), _right_open())
	if not room["boss"]:
		_hud.toast("Il passaggio si è aperto")


@rpc("authority", "call_local", "reliable")
func _end_game(won: bool) -> void:
	game_over = true
	victory = won
	_hud.show_end(won)


@rpc("authority", "call_local", "reliable")
func _notify(text: String) -> void:
	_hud.toast(text)


@rpc("authority", "call_local", "reliable")
func _sync_coins(value: int) -> void:
	coins = value


## Effetti visivi annunciati dall'host e riprodotti localmente da ogni PC.
@rpc("authority", "call_local", "unreliable")
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
	var p = local_player()
	if p and p.global_position.distance_to(pos) < 1100.0:
		p.add_trauma(amount)


# ---------------------------------------------------------------- Giocatori

func _on_player_slash(pos: Vector2, facing: float, down: bool, air: bool) -> void:
	if multiplayer.is_server():
		_do_slash(multiplayer.get_unique_id(), pos, facing, down, air)
	else:
		_request_slash.rpc_id(1, pos, facing, down, air)


@rpc("any_peer", "call_remote", "reliable")
func _request_slash(pos: Vector2, facing: float, down: bool, air: bool) -> void:
	if not multiplayer.is_server():
		return
	_do_slash(multiplayer.get_remote_sender_id(), pos, facing, down, air)


func _do_slash(peer: int, pos: Vector2, facing: float, down: bool, air: bool) -> void:
	if game_over or not stats.has(peer) or stats[peer]["dead"]:
		return
	var center := pos + Vector2(0, 42) if down else pos + Vector2(facing * 46.0, -6.0)
	var half := Vector2(30, 32) if down else Vector2(40, 30)
	var bounce := false
	for e in get_tree().get_nodes_in_group("enemies"):
		if e.is_queued_for_deletion():
			continue
		if _overlap(center, half, e.global_position, e.half):
			_hit_enemy(e, 1, Color(1.0, 0.95, 0.85), facing)
			if down and air:
				bounce = true
	if bounce:
		_bounce.rpc(peer)


@rpc("authority", "call_local", "reliable")
func _bounce(peer: int) -> void:
	var p = _find_player(peer)
	if p and p.is_multiplayer_authority():
		p.bounce()


@rpc("authority", "call_local", "reliable")
func _knock(peer: int, dir: float) -> void:
	var p = _find_player(peer)
	if p and p.is_multiplayer_authority():
		p.knock(dir)


func _hurt_player(p: Node, dmg: int, from_x: float) -> void:
	if game_over or not stats.has(p.peer_id):
		return
	var s: Dictionary = stats[p.peer_id]
	if s["dead"] or float(s["iframes"]) > 0.0:
		return
	s["hp"] = maxi(0, int(s["hp"]) - dmg)
	s["iframes"] = 0.9
	var dir := 1.0 if p.global_position.x >= from_x else -1.0
	_fx.rpc("hurt", p.global_position, Color.WHITE, dir)
	if s["hp"] <= 0:
		s["dead"] = true
		_notify.rpc("%s è caduto" % _name_of(p.peer_id))
	else:
		_knock.rpc(p.peer_id, dir)
	_push_stats(p.peer_id)


func _push_stats(id: int) -> void:
	_sync_stats.rpc(id, stats[id])


@rpc("authority", "call_local", "reliable")
func _sync_stats(id: int, s: Dictionary) -> void:
	stats[id] = s
	var p = _find_player(id)
	if p:
		p.apply_stats(s)


func _on_peer_left(id: int) -> void:
	if not multiplayer.is_server():
		return
	var p = _find_player(id)
	if p:
		p.queue_free()
	stats.erase(id)


func _find_player(id: int) -> Node:
	for p in get_tree().get_nodes_in_group("players"):
		if p.peer_id == id:
			return p
	return null


func _alive_players() -> Array:
	var out: Array = []
	for p in get_tree().get_nodes_in_group("players"):
		if not p.dead:
			out.append(p)
	return out


func _player_order() -> Array:
	var ids: Array = Net.players.keys()
	ids.sort()
	return ids


func _name_of(peer: int) -> String:
	return str(Net.players.get(peer, "Ospite"))


func local_player() -> Node:
	return _find_player(multiplayer.get_unique_id())


## Il boss della stanza, se presente (serve all'HUD per la barra della vita).
func boss() -> Node:
	for e in get_tree().get_nodes_in_group("enemies"):
		if e.kind == "custode" and not e.is_queued_for_deletion():
			return e
	return null


# ---------------------------------------------------------------- Nemici, proiettili, raccolta

func _spawn_enemy(kind: String, pos: Vector2) -> void:
	var hp := 0
	if kind == "custode":
		var b: Dictionary = Tuning.data.enemies.custode
		hp = int(b.hp) + int(b.hp_per_player) * Net.players.size()
	_spawner.spawn({"kind": "enemy", "type": kind, "pos": pos, "hp": hp})


func _spawn_pickup(pos: Vector2, item: String, value: int) -> void:
	_spawner.spawn({"kind": "pickup", "pos": pos, "item": item, "value": value})


func _hit_enemy(e: Node, dmg: int, col: Color, dir: float) -> void:
	var killed: bool = e.take_hit(dmg)
	if killed:
		_fx.rpc("death", e.global_position, Art.enemy_color(e.kind), dir)
		_on_enemy_killed(e)
	else:
		_fx.rpc("hit", e.global_position, col, dir)


func _on_enemy_killed(e: Node) -> void:
	_spawn_pickup(e.global_position, "centesimi", int(e.coins))
	if e.kind != "custode" and _rng.randf() < float(Tuning.data.rewards.heal_chance):
		_spawn_pickup(e.global_position + Vector2(0, -30), "mozzarella", 1)


func _check_contacts() -> void:
	for e in get_tree().get_nodes_in_group("enemies"):
		if e.is_queued_for_deletion():
			continue
		for p in _alive_players():
			if not _overlap(e.global_position, e.half, p.global_position, PlayerScript.HALF):
				continue
			if float(e.touch_cd.get(p.peer_id, 0.0)) > 0.0:
				continue
			e.touch_cd[p.peer_id] = 0.8
			_hurt_player(p, int(e.damage), e.global_position.x)


func _check_bullets() -> void:
	for b in get_tree().get_nodes_in_group("bullets"):
		if b.is_queued_for_deletion():
			continue
		if is_solid(b.global_position):
			b.queue_free()
			continue
		for p in _alive_players():
			if _overlap(b.global_position, Vector2(b.radius, b.radius), p.global_position, PlayerScript.HALF):
				_hurt_player(p, int(b.damage), b.global_position.x)
				b.queue_free()
				break


func _check_pickups() -> void:
	for pk in get_tree().get_nodes_in_group("pickups"):
		if pk.is_queued_for_deletion():
			continue
		for p in _alive_players():
			if _overlap(pk.global_position, Vector2(14, 14), p.global_position, PlayerScript.HALF):
				_collect(pk, p)
				break


func _collect(pk: Node, p: Node) -> void:
	if pk.item == "centesimi":
		coins += int(pk.value)
		_sync_coins.rpc(coins)
		_fx.rpc("collect", pk.global_position, Color(1.0, 0.8, 0.35), 0.0)
	elif pk.item == "mozzarella":
		var s: Dictionary = stats[p.peer_id]
		s["hp"] = mini(int(s["max_hp"]), int(s["hp"]) + 1)
		_push_stats(p.peer_id)
		_fx.rpc("collect", pk.global_position, Color(1.0, 0.97, 0.9), 0.0)
	pk.queue_free()


## Usato dai nemici (solo host): proiettile singolo.
func enemy_fire(pos: Vector2, dir: Vector2, speed: float, col: Color = Color(1.0, 0.68, 0.38)) -> void:
	_spawner.spawn({
		"kind": "bullet", "pos": pos, "vel": dir.normalized() * speed,
		"dmg": 1, "color": col, "life": 3.0, "radius": 6.0,
	})


## Usato dal boss: proiettili radiali.
func enemy_burst(pos: Vector2, count: int) -> void:
	_fx.rpc("burst", pos, Color(1.0, 0.7, 0.3), 0.0)
	for i in count:
		enemy_fire(pos, Vector2.RIGHT.rotated(TAU * float(i) / float(count)), 260.0)


## Usato dal boss all'atterraggio: onda d'urto a terra in entrambe le direzioni.
func enemy_shockwave(pos: Vector2) -> void:
	_fx.rpc("shock", pos, Color(1.0, 0.8, 0.5), 0.0)
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


func nearest_alive_player(pos: Vector2) -> Node2D:
	var best: Node2D = null
	var best_d := INF
	for p in _alive_players():
		var d := pos.distance_squared_to(p.global_position)
		if d < best_d:
			best_d = d
			best = p
	return best


# ---------------------------------------------------------------- Utilità

static func _overlap(a: Vector2, a_half: Vector2, b: Vector2, b_half: Vector2) -> bool:
	return absf(a.x - b.x) < a_half.x + b_half.x and absf(a.y - b.y) < a_half.y + b_half.y


func _fade_in() -> void:
	_fade.modulate = Color(1, 1, 1, 1)
	var tw := create_tween()
	tw.tween_property(_fade, "modulate:a", 0.0, 0.7).set_trans(Tween.TRANS_SINE)
