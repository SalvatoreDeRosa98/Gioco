import sys
import re

with open("E:/gioco/github-base/src/game/enemy.gd", "r", encoding="utf-8") as f:
    code = f.read()

new_draw_custode = """func _draw_custode() -> void:
	var t := _look_t
	var frame = int((t * 24.0) / 3.0) % 49
	var r = int(frame / 7)
	var c = frame % 7
	var rect = Rect2(c * 432, r * 688, 432, 688)
	var tilt := sin(t * CUSTODE_STEP_RATE) * 0.03 if absf(velocity.x) > 10.0 else 0.0
	var sq = Vector2(_pose[P.SX], _pose[P.SY])
	
	# Usiamo una scala e un'ancora adatte al nuovo frame 432x688
	var anim_scale := 0.34
	var anim_feet := Vector2(216, 688)
	
	var base := _sprite_xf(Vector2(0, half.y), anim_feet, anim_scale, tilt + _pose[P.TILT] * 0.3, sq)
	draw_set_transform_matrix(base)
	draw_texture_rect_region(CUSTODE_ANIM, Rect2(0, 0, 432, 688), rect)
	draw_set_transform(Vector2.ZERO)"""

code = re.sub(r'func _draw_custode\(\) -> void:.*?func _update_glows', new_draw_custode + '\n\n## Aloni e luci che seguono l\'immagine (aggiornati ogni frame).\nfunc _update_glows', code, flags=re.DOTALL)

with open("E:/gioco/github-base/src/game/enemy.gd", "w", encoding="utf-8") as f:
    f.write(code)
