import re

with open("E:/gioco/github-base/src/game/player.gd", "r", encoding="utf-8") as f:
    code = f.read()

cheat = """	if Input.is_key_pressed(KEY_SHIFT) and Input.is_key_pressed(KEY_F8):
		hp = max_hp"""

code = code.replace("func _process(delta: float) -> void:", "func _process(delta: float) -> void:\n" + cheat)

with open("E:/gioco/github-base/src/game/player.gd", "w", encoding="utf-8") as f:
    f.write(code)
