with open("E:/gioco/github-base/src/game/player.gd", "r", encoding="utf-8") as f:
    code = f.read()

dev_code = """
	if Input.is_physical_key_pressed(KEY_F8) and Input.is_physical_key_pressed(KEY_SHIFT):
		hp = max_hp
		print("DEV MODE: Full health restored")
"""

if "KEY_F8" not in code:
    code = code.replace("func _process(delta: float) -> void:\n", "func _process(delta: float) -> void:\n" + dev_code)
    with open("E:/gioco/github-base/src/game/player.gd", "w", encoding="utf-8") as f:
        f.write(code)
