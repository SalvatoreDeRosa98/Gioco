import re

with open("E:/gioco/github-base/src/game/char_rig.gd", "r", encoding="utf-8") as f:
    code = f.read()

new_pose_slash = """static func pose_slash(k: float, side: float) -> Dictionary:
	# Stile animazione "Frame by Frame" (Salt and Sanctuary / Metroidvania)
	# Il tempo viene discretizzato per dare il senso di 'pose' mantenute.
	# Anticipazione (0-0.25), Colpo violento (0.25-0.35), Follow-through (0.35-0.6), Recupero (0.6-1.0)
	
	var from := -2.4 if side > 0.0 else 0.8
	var to := 0.8 if side > 0.0 else -2.2
	var dir := signf(to - from)
	
	var p := {}
	
	if k < 0.25:
		# Anticipazione: si tira indietro, accumula potenza
		var t = k / 0.25
		p = {
			"sword": from - 0.4 * dir * t,
			"arm": -0.3 * dir * t,
			"lean": -0.15 * t,
			"squash": 0.05 * t,
			"hat": 0.1 * t,
			"scarf_lift": 0.3 * t,
			"leg_front": Vector2(-0.1, 0.4) * t,
			"leg_back": Vector2(0.2, 0.6) * t,
		}
	elif k < 0.35:
		# L'ATTACCO: smear frame rapidissimo! Scatta in avanti
		var t = (k - 0.25) / 0.1
		p = {
			"sword": lerpf(from, to, t),
			"arm": lerpf(-0.3 * dir, 0.4 * dir, t),
			"lean": lerpf(-0.15, 0.3, t),
			"squash": lerpf(0.05, -0.1, t),
			"hat": lerpf(0.1, -0.3, t),
			"scarf_lift": lerpf(0.3, -0.5, t),
			"hem_open": lerpf(0.0, 0.5, t),
			"leg_front": Vector2(lerpf(-0.1, -0.4, t), lerpf(0.4, 0.8, t)),
			"leg_back": Vector2(lerpf(0.2, 0.4, t), lerpf(0.6, 0.2, t)),
		}
	elif k < 0.6:
		# Follow-through (hold frame d'impatto prolungato)
		var t = (k - 0.35) / 0.25
		# Curva ease-out per assorbire l'impatto
		var e = 1.0 - pow(1.0 - t, 3.0)
		p = {
			"sword": to + 0.1 * dir * e,
			"arm": 0.4 * dir - 0.1 * dir * e,
			"lean": 0.3 + 0.05 * e,
			"squash": -0.1 + 0.05 * e,
			"hat": -0.3 + 0.1 * e,
			"scarf_lift": -0.5 + 0.2 * e,
			"hem_open": 0.5 - 0.2 * e,
			"leg_front": Vector2(-0.4, 0.8),
			"leg_back": Vector2(0.4, 0.2),
		}
	else:
		# Recupero
		var t = (k - 0.6) / 0.4
		var e = t * t # ease in
		p = {
			"sword": lerpf(to + 0.1 * dir, 0.0, e),
			"arm": lerpf(0.3 * dir, 0.0, e),
			"lean": lerpf(0.35, 0.0, e),
			"squash": lerpf(-0.05, 0.0, e),
			"hat": lerpf(-0.2, 0.0, e),
			"scarf_lift": lerpf(-0.3, 0.0, e),
			"hem_open": lerpf(0.3, 0.0, e),
			"leg_front": Vector2(-0.4 * (1-e), 0.8 * (1-e)),
			"leg_back": Vector2(0.4 * (1-e), 0.2 * (1-e)),
		}
	
	return p"""

code = re.sub(r'static func pose_slash\(k: float, side: float\) -> Dictionary:.*?return {.*?}\n', new_pose_slash + '\n', code, flags=re.DOTALL)

with open("E:/gioco/github-base/src/game/char_rig.gd", "w", encoding="utf-8") as f:
    f.write(code)
