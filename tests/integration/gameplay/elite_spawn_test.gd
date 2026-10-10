extends SceneTree
## Nessun nemico terrestre può nascere dentro pavimento o blocchi della stanza.
const Rooms := preload("res://game/room.gd")
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _run() -> void:
	var Elite = load("res://game/elite.gd")
	var main = load("res://scripts/main.gd").new()
	root.add_child(main)
	main._on_play_pressed(false)
	var world = main._world
	world.set_physics_process(false)
	world.player.set_physics_process(false)
	var checked := 0
	for idx in range(Rooms.COUNT):
		world.room = Rooms.build(idx)
		for data in world.room.enemies:
			if not data.type in ["guardia", "cavaliere", "capitano", "madre"]:
				continue
			var enemy = Elite.new()
			enemy.setup(data, world)
			var bounds := Rect2(enemy.position - enemy.half, enemy.half * 2)
			check(bounds.end.y <= float(world.room.floor), "Suolo: %s stanza %d" % [data.type, idx])
			for block: Rect2 in world.room.blocks:
				check(not bounds.intersects(block), "Blocco: %s stanza %d" % [data.type, idx])
			enemy.free()
			checked += 1
	# Riproduce anche il vecchio punto di comparsa della guardia dentro il basamento.
	world.room = Rooms.build(0)
	world.room.blocks = [Rect2(1000,900,560,80), Rect2(1100,840,360,60)]
	var guard = Elite.new()
	guard.setup({"type": "guardia", "pos": Vector2(1450, 960)}, world)
	for block: Rect2 in world.room.blocks:
		check(not Rect2(guard.position - guard.half, guard.half * 2).intersects(block), "Recupero vecchio spawn nel basamento")
	guard.free()
	print("elite_spawn_test: %d nemici controllati, %d fallimenti" % [checked, failures])
	main.queue_free()
	await process_frame
	quit(1 if failures else 0)
