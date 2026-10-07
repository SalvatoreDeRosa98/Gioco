extends Node2D
## Partita co-op a scorrimento laterale. L'host decide stanze, nemici, danni e raccolta;
## ogni client muove il proprio cavaliere e riceve il resto tramite MultiplayerSpawner.

const PlayerScript := preload("res://game/player.gd")
const EnemyScript := preload("res://game/enemy.gd")
const ProjectileScript := preload("res://game/projectile.gd")
const PickupScript := preload("res://game/pickup.gd")
const HudScript := preload("res://game/hud.gd")

const SCREEN := Vector2(1280, 720)
const RESPAWN_DELAY := 2.5

var PLAYER_COLORS := [Color("#f2c46d"), Color("#7fd1c7"), Color("#e58f7a"), Color("#b7a6ff")]

var room: Dictionary = {}
var room_index := 0
var room_cleared := false
var stats: Dictionary = {}     # peer_id -> {hp, max_hp, dead, iframes}
var coins := 0
var cleared: Dictionary = {}   # indice stanza -> bool (verità dell'host)
var game_over := false
var victory := false

var _entities: Node2D
var _walls: Node2D
var _spawner: MultiplayerSpawner
var _hud
var _fade: ColorRect
var _rng := RandomNumberGenerator.new()
var _time := 0.0
var _room_t := 0.0
var _transitioning := false
var _wipe_t := -1.0


func _ready() -> void:
	_rng.randomize()
	_walls = Node2D.new()
	add_child(_walls)
	_entities = Node2D.new()
	_entities.name = "Entities"
	add_child(_entities)

	_spawner = MultiplayerSpawner.new()
	_spawner.name = "Spawner"
	add_child(_spawner)
	_spawner.spawn_path = NodePath("../Entities")
	_spawner.spawn_function = _make_entity
	multiplayer.peer_disconnected.connect(_on_peer_left)

	_build_overlays()
	_add_ambient()

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
		Net.leave()


func _process(delta: float) -> void:
	_time += delta
	queue_redraw()


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


func _draw() -> void:
	if room.is_empty():
		return
	Art.draw_room_bg(self, room["theme"], _time)
	for s in room["solids"]:
		Art.draw_stone(self, s, room["theme"])
	var right_open := room_cleared and room_index < Room.COUNT - 1
	Art.draw_door(self, Rect2(1270, 280, 40, 160), right_open, _time)
	Art.draw_door(self, Rect2(-10, 280, 40, 160), room_index > 0, _time)


# ---------------------------------------------------------------- Costruzione

func _build_overlays() -> void:
	var vignette_layer := CanvasLayer.new()
	vignette_layer.layer = 8
	add_child(vignette_layer)
	var vignette := ColorRect.new()
	vignette.set_anchors_preset(Control.PRESET_FULL_RECT)
	vignette.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var shader := Shader.new()
	shader.code = """
shader_type canvas_item;
void fragment() {
	vec2 d = SCREEN_UV - vec2(0.5);
	COLOR = vec4(0.02, 0.02, 0.04, clamp(dot(d, d) * 1.7 - 0.15, 0.0, 0.8));
}
"""
	var mat := ShaderMaterial.new()
	mat.shader = shader
	vignette.material = mat
	vignette_layer.add_child(vignette)

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
	_fade.color = Color("#07080c")
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	fade_layer.add_child(_fade)


func _add_ambient() -> void:
	# Polvere dorata nell'aria: solo estetica, non sincronizzata.
	var motes := CPUParticles2D.new()
	motes.position = SCREEN * 0.5
	motes.z_index = 6
	motes.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	motes.emission_rect_extents = SCREEN * 0.5
	motes.amount = 60
	motes.lifetime = 7.0
	motes.gravity = Vector2(0, -3)
	motes.spread = 180.0
	motes.initial_velocity_min = 4.0
	motes.initial_velocity_max = 12.0
	motes.scale_amount_min = 1.0
	motes.scale_amount_max = 2.2
	motes.color = Color(1.0, 0.85, 0.5, 0.3)
	add_child(motes)


func _setup_roster() -> void:
	var entries: Array = Room.entry_points(true)
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
	_build_walls()
	queue_redraw()
	_hud.toast(room["name"])
	_fade_in()

	var ids := _player_order()
	var spawns: Array = Room.entry_points(from_left)
	for i in ids.size():
		var p = _find_player(ids[i])
		if p and p.is_multiplayer_authority():
			p.teleport(spawns[i % spawns.size()])

	if multiplayer.is_server():
		_room_t = 0.0
		_wipe_t = -1.0
		_clear_hostile()
		_revive_dead()
		if not cleared_now:
			for e in room["enemies"]:
				_spawn_enemy(e["type"], e["pos"])


func _build_walls() -> void:
	for c in _walls.get_children():
		var old := c as StaticBody2D
		old.collision_layer = 0
		old.queue_free()
	for r in room["solids"]:
		var body := StaticBody2D.new()
		var cs := CollisionShape2D.new()
		var sh := RectangleShape2D.new()
		sh.size = r.size
		cs.shape = sh
		cs.position = r.get_center()
		body.add_child(cs)
		_walls.add_child(body)


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
	for p in _alive_players():
		var pos: Vector2 = p.global_position
		if room_cleared and room_index < Room.COUNT - 1 and pos.x >= SCREEN.x - 30.0 and pos.y > 270.0 and pos.y < 450.0:
			_go(room_index + 1, true)
			return
		if room_index > 0 and pos.x <= 30.0 and pos.y > 270.0 and pos.y < 450.0:
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
		_spawn_pickup(Vector2(640, 560), "centesimi", int(Tuning.data.rewards.room_clear_coins))


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
	_hud.toast("Stanza liberata! Raggiungi la porta.")


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
	_show_slash.rpc(pos, facing, down)
	var center := pos + Vector2(0, 40) if down else pos + Vector2(facing * 46.0, -4.0)
	var half := Vector2(30, 30) if down else Vector2(38, 26)
	var bounce := false
	for e in get_tree().get_nodes_in_group("enemies"):
		if e.is_queued_for_deletion():
			continue
		if _overlap(center, half, e.global_position, e.half):
			_hit_enemy(e, 1, Color("#f3e6c8"))
			if down and air:
				bounce = true
	if bounce:
		_bounce.rpc(peer)


@rpc("authority", "call_local", "unreliable")
func _show_slash(pos: Vector2, facing: float, down: bool) -> void:
	Art.spawn_slash(self, pos, facing, down)


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
	if s["hp"] <= 0:
		s["dead"] = true
		_notify.rpc("%s è caduto." % _name_of(p.peer_id))
	else:
		var dir := 1.0 if p.global_position.x >= from_x else -1.0
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


# ---------------------------------------------------------------- Nemici, proiettili, raccolta

func _spawn_enemy(kind: String, pos: Vector2) -> void:
	var hp := 0
	if kind == "custode":
		var boss: Dictionary = Tuning.data.enemies.custode
		hp = int(boss.hp) + int(boss.hp_per_player) * Net.players.size()
	_spawner.spawn({"kind": "enemy", "type": kind, "pos": pos, "hp": hp})


func _spawn_pickup(pos: Vector2, item: String, value: int) -> void:
	_spawner.spawn({"kind": "pickup", "pos": pos, "item": item, "value": value})


func _hit_enemy(e: Node, dmg: int, col: Color) -> void:
	var killed: bool = e.take_hit(dmg)
	_burst.rpc(e.global_position, col, 8)
	if killed:
		_burst.rpc(e.global_position, Art.enemy_color(e.kind), 24)
		_on_enemy_killed(e)


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
			if _overlap(pk.global_position, Vector2(12, 12), p.global_position, PlayerScript.HALF):
				_collect(pk, p)
				break


func _collect(pk: Node, p: Node) -> void:
	if pk.item == "centesimi":
		coins += int(pk.value)
		_sync_coins.rpc(coins)
	elif pk.item == "mozzarella":
		var s: Dictionary = stats[p.peer_id]
		s["hp"] = mini(int(s["max_hp"]), int(s["hp"]) + 1)
		_push_stats(p.peer_id)
	pk.queue_free()


@rpc("authority", "call_local", "unreliable")
func _burst(pos: Vector2, col: Color, amount: int) -> void:
	var fx := CPUParticles2D.new()
	fx.position = pos
	fx.one_shot = true
	fx.explosiveness = 1.0
	fx.amount = amount
	fx.lifetime = 0.5
	fx.spread = 180.0
	fx.initial_velocity_min = 90.0
	fx.initial_velocity_max = 240.0
	fx.scale_amount_min = 3.0
	fx.scale_amount_max = 6.0
	fx.color = col
	fx.emitting = true
	add_child(fx)
	get_tree().create_timer(1.0).timeout.connect(fx.queue_free)


## Usato dai nemici (solo host): proiettile singolo.
func enemy_fire(pos: Vector2, dir: Vector2, speed: float) -> void:
	_spawner.spawn({
		"kind": "bullet", "pos": pos, "vel": dir.normalized() * speed,
		"dmg": 1, "color": Color("#ffb37a"), "life": 3.0, "radius": 6.0,
	})


## Usato dal boss: otto proiettili radiali.
func enemy_burst(pos: Vector2, count: int) -> void:
	for i in count:
		enemy_fire(pos, Vector2.RIGHT.rotated(TAU * float(i) / float(count)), 260.0)


## Usato dal boss all'atterraggio: onda d'urto a terra in entrambe le direzioni.
func enemy_shockwave(pos: Vector2) -> void:
	enemy_fire(pos, Vector2.LEFT, 380.0)
	enemy_fire(pos, Vector2.RIGHT, 380.0)


func is_solid(p: Vector2) -> bool:
	if room.is_empty():
		return false
	for s in room["solids"]:
		if (s as Rect2).has_point(p):
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
	_fade.color = Color("#07080c")
	_fade.modulate = Color(1, 1, 1, 1)
	var tw := create_tween()
	tw.tween_property(_fade, "modulate:a", 0.0, 0.6)
