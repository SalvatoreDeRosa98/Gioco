extends Node2D
## Proiettile nemico. Solo l'host lo muove e ne controlla le collisioni; i client vedono la posizione replicata.

var vel := Vector2.ZERO
var damage := 1
var life := 3.0
var color := Color.WHITE
var radius := 6.0


func setup(d: Dictionary) -> void:
	position = d["pos"]
	vel = d["vel"]
	damage = int(d["dmg"])
	color = d["color"]
	life = float(d["life"])
	radius = float(d["radius"])
	set_multiplayer_authority(1)
	var sync := MultiplayerSynchronizer.new()
	sync.set_multiplayer_authority(1)
	var cfg := SceneReplicationConfig.new()
	cfg.add_property(NodePath(":position"))
	sync.replication_config = cfg
	add_child(sync)
	add_to_group("bullets")


func _physics_process(delta: float) -> void:
	if not multiplayer.is_server():
		return
	position += vel * delta
	life -= delta
	if life <= 0.0:
		queue_free()


func _process(_delta: float) -> void:
	queue_redraw()


func _draw() -> void:
	draw_circle(Vector2.ZERO, radius * 2.0, Color(color, 0.22))
	draw_circle(Vector2.ZERO, radius, color)
	draw_circle(Vector2(-radius * 0.3, -radius * 0.3), radius * 0.35, Color(1, 1, 1, 0.8))
