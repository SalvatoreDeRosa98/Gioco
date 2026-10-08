import sys

with open("E:/gioco/github-base/src/game/player.gd", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Revert rig class
code = code.replace('_rig = preload("res://game/sprite_rig.gd").new()', '_rig = CharRig.new()')

# 2. Revert process call
code = code.replace('_rig.select_state(self, running)', '_rig.set_target(_pose(running))')

# 3. Add _pose method right before _update_spin or at the end
pose_code = """
func _pose(running: bool) -> Dictionary:
	var pose: Dictionary
	if dead:
		pose = CharRig.pose_dead()
	elif parry_window > 0.0:
		pose = CharRig.pose_parry()
	elif hammer_time > 0.0:
		var k := 1.0 - hammer_time / float(_cfg.get("hammer_time", 0.4))
		pose = CharRig.pose_hammer(k)
	elif _heal_t > 0.0:
		pose = CharRig.pose_heal()
	elif wall_gripping:
		pose = CharRig.pose_wall()
	elif grapple_anchor != Vector2.INF:
		pose = CharRig.pose_grapple()
	elif dashing:
		pose = CharRig.pose_dash()
	elif _spin_t >= 0.0:
		pose = CharRig.pose_double_jump()
	elif not grounded:
		pose = CharRig.pose_air(move_vel.y)
	elif _skid_t > 0.0:
		pose = CharRig.pose_skid()
	elif running:
		pose = CharRig.pose_run(_run, _run_amount)
	else:
		pose = CharRig.pose_idle(_t)
	if attacking > 0.0 and not dead:
		var k := 1.0 - attacking / float(_cfg.attack_time)
		pose.merge(CharRig.pose_slash_down(k) if attack_down else CharRig.pose_slash(k, slash_side), true)
	pose["squash"] = float(pose.get("squash", 0.0)) + _squash
	return pose
"""

if "func _pose" not in code:
    code += "\n" + pose_code + "\n"

with open("E:/gioco/github-base/src/game/player.gd", "w", encoding="utf-8") as f:
    f.write(code)

print("Patched player.gd")
