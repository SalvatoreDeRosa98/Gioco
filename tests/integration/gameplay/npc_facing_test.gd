extends SceneTree
## Attraversa ripetutamente l'NPC e verifica che non diventi mai un foglio.
class PlayerStub extends Node2D:
	var dead := false
class StoryStub extends RefCounted:
	## Il personaggio della prova è sempre presente.
	func check(_when: Dictionary, _context: Dictionary) -> bool:
		return true
class WorldStub extends Node2D:
	var player: Node2D
	var story := StoryStub.new()
	## Contesto narrativo vuoto per la sola prova di orientamento.
	func story_ctx() -> Dictionary:
		return {}

func _initialize() -> void:
	_run.call_deferred()

func _run() -> void:
	var world := WorldStub.new()
	root.add_child(world)
	world.player = PlayerStub.new()
	world.add_child(world.player)
	var npc = load("res://game/npc.gd").new()
	npc.world = world
	world.add_child(npc)
	npc.set_process(false)
	var failures := 0
	for direction in [-1,1,-1,1]:
		world.player.position.x = direction*70
		for frame in 30:
			npc._update_attention(1.0/60.0)
			if absf(npc._face) != 1:
				failures += 1
		if npc._face != direction:
			failures += 1
	# Oscillations shorter than turn_time must not trigger repeated mirroring.
	for frame in 20:
		world.player.position.x = -70 if frame%2 == 0 else 70
		npc._update_attention(1.0/60.0)
		if npc._face != 1:
			failures += 1
	world.free()
	print("npc_facing_test: %d fallimenti" % failures)
	quit(1 if failures else 0)
