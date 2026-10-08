with open("E:/gioco/github-base/src/game/enemy.gd", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace(
    'const CUSTODE_TEX := preload("res://assets/art/bosses/custode_corpo.png")',
    'const CUSTODE_TEX := preload("res://assets/art/bosses/custode_corpo.png")\nconst CUSTODE_ANIM := preload("res://assets/art/bosses/custode_anim.png")'
)

with open("E:/gioco/github-base/src/game/enemy.gd", "w", encoding="utf-8") as f:
    f.write(code)
