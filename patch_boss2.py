# -*- coding: utf-8 -*-
import re

with open("E:/gioco/github-base/src/game/enemy.gd", "r", encoding="utf-8") as f:
    code = f.read()

new_draw_custode = """func _draw_custode() -> void:
	var t := _look_t
	var walk := absf(velocity.x) > 10.0
	var bob := -absf(sin(t * CUSTODE_STEP_RATE)) * 4.0 if walk else sin(t * 1.6) * 1.0
	var tilt := sin(t * CUSTODE_STEP_RATE) * 0.03 if walk else 0.0
	var sq := Vector2.ONE
	match anim:
		"crouch":
			sq = Vector2(1.08, 0.88)
		"leap":
			sq = Vector2(0.94, 1.08)
		"burst":
			tilt = -0.07 * _anim_progress(0.4)
	sq *= Vector2(_pose[P.SX], _pose[P.SY])
	
	if anim in ["sword_windup", "sword_swing", "sword_recovery"]:
		var anim_t = 0.0
		if anim == "sword_windup":
			anim_t = 0.0
		elif anim == "sword_swing":
			anim_t = 0.35 - _state_t
		elif anim == "sword_recovery":
			anim_t = 0.35 + (0.75 - _state_t)
		
		var total_attack_time = 0.35 + 0.75
		var k = clampf(anim_t / total_attack_time, 0.0, 1.0)
		var frame = clampi(int(k * 48), 0, 48)
		
		var r = int(frame / 7)
		var c = frame % 7
		var rect = Rect2(c * 432, r * 688, 432, 688)
		
		var anim_scale := 0.274
		var anim_feet := Vector2(216, 650)
		var base := _sprite_xf(Vector2(0, half.y + bob), anim_feet, anim_scale, tilt + _pose[P.TILT] * 0.3, sq)
		draw_set_transform_matrix(base)
		draw_texture_rect_region(CUSTODE_ANIM, Rect2(0, 0, 432, 688), rect)
		draw_set_transform(Vector2.ZERO)
	else:
		var base := _sprite_xf(Vector2(0, half.y + bob), CUSTODE_FEET, CUSTODE_SCALE, tilt + _pose[P.TILT] * 0.3, sq)
		_piece(base, CUSTODE_TEX, Vector2.ZERO)
		var sword_size := CUSTODE_SWORD.get_size() * (float(_cfg.sword_reach) / (CUSTODE_SWORD.get_width() * 0.84))
		draw_set_transform(Vector2(facing * CUSTODE_HAND.x, CUSTODE_HAND.y), facing * sword_angle(), Vector2(facing, 1))
		draw_texture_rect(CUSTODE_SWORD, Rect2(Vector2(-sword_size.x * 0.16, -sword_size.y * 0.5), sword_size), false)
		draw_set_transform(Vector2.ZERO)"""

code = re.sub(r'func _draw_custode\(\) -> void:.*?func _update_glows', new_draw_custode + '\n\n## Aloni e luci che seguono l\'immagine (aggiornati ogni frame).\nfunc _update_glows', code, flags=re.DOTALL)

with open("E:/gioco/github-base/src/game/enemy.gd", "w", encoding="utf-8") as f:
    f.write(code)
