class_name Themes
extends RefCounted
## Atmosfera di ogni area di Caserta: cielo, luce, nebbia, colori degli strati, meteo e color grading.
## Chiavi del grading (vedi shaders/post_screen_grade.gdshader): tint, contrast, saturation, bloom,
## vignette, shadows/highlights (viraggio separato), wash_top/wash_bottom (velo di luce).
## Lampioni: lamp_cone (forza del cono volumetrico), lamp_rain (pioggia nella luce), moths (falene).
## Disposizione e densità di strati, fili, raggi e particelle stanno in data/areas.json.

## Parametri del post-processing presi dal tema (nome uniform -> chiave del tema).
const GRADE_KEYS := {
	"tint": "tint", "contrast": "contrast", "saturation": "saturation", "bloom_strength": "bloom",
	"vignette": "vignette", "shadow_tint": "shadows", "highlight_tint": "highlights",
	"wash_top": "wash_top", "wash_bottom": "wash_bottom",
}


## Applica il color grading del tema al materiale del post-processing (post_screen_grade).
static func apply_grade(mat: ShaderMaterial, th: Dictionary) -> void:
	if mat == null:
		return
	for uniform_name in GRADE_KEYS:
		var key: String = GRADE_KEYS[uniform_name]
		if th.has(key):
			mat.set_shader_parameter(uniform_name, th[key])


static func get_theme(theme_name: String) -> Dictionary:
	match theme_name:
		"strada":
			return {
				"sky_top": Color("#0d0710"), "sky_bottom": Color("#3a1b2a"), "horizon": Color("#7a3433"),
				"cloud": Color("#24131d"), "moon_color": Color("#f2d7c4"), "moon": 0.0, "moon_pos": Vector2(0.2, 0.18),
				"stars": 0.1, "clouds": 0.85,
				"far": Color("#160c14"), "far_glow": Color("#ffb07a"), "mid": Color("#1d1119"), "mid_glow": Color("#ffa368"),
				"fg": Color("#070407"), "fog": Color("#4a2534"), "fog_density": 0.42,
				"ambient": Color(0.62, 0.52, 0.58), "lamp": Color("#ffa86e"),
				"stone": Color("#5a4c55"), "mortar": Color("#130c12"), "stone_light": Color("#8d7682"),
				"weather": "rain", "far_kind": "rooftops", "mid_kind": "arcade", "fg_kind": "awnings",
				"tint": Vector3(1.06, 0.96, 0.96), "contrast": 1.1, "saturation": 1.0, "bloom": 0.75, "vignette": 0.55,
				"shadows": Vector3(0.98, 0.9, 1.08), "highlights": Vector3(1.12, 0.98, 0.84),
				"wash_top": Vector3(0.012, 0.0, 0.02), "wash_bottom": Vector3(0.05, 0.022, 0.0),
				"lamp_cone": 0.26, "lamp_rain": 1.0, "moths": 0,
			}
		"giardino":
			return {
				"sky_top": Color("#040b09"), "sky_bottom": Color("#10261d"), "horizon": Color("#244636"),
				"cloud": Color("#0d1c16"), "moon_color": Color("#e4f2dc"), "moon": 1.0, "moon_pos": Vector2(0.72, 0.16),
				"stars": 0.55, "clouds": 0.25,
				"far": Color("#06110c"), "far_glow": Color("#d8f2a0"), "mid": Color("#0a1a12"), "mid_glow": Color("#ffd28a"),
				"fg": Color("#020604"), "fog": Color("#1f3d30"), "fog_density": 0.5,
				"ambient": Color(0.5, 0.64, 0.56), "lamp": Color("#ffd690"),
				"stone": Color("#4d5947"), "mortar": Color("#0b120d"), "stone_light": Color("#7d9270"),
				"weather": "fireflies", "far_kind": "canopy", "mid_kind": "garden", "fg_kind": "foliage",
				"tint": Vector3(0.95, 1.04, 0.98), "contrast": 1.08, "saturation": 1.05, "bloom": 0.8, "vignette": 0.55,
				"shadows": Vector3(0.9, 1.04, 1.04), "highlights": Vector3(1.04, 1.06, 0.88),
				"wash_top": Vector3(0.0, 0.025, 0.02), "wash_bottom": Vector3(0.0, 0.012, 0.008),
				"lamp_cone": 0.2, "lamp_rain": 0.0, "moths": 7,
			}
		"belvedere":
			return {
				"sky_top": Color("#17243b"), "sky_bottom": Color("#6f7286"), "horizon": Color("#e09a70"),
				"cloud": Color("#7f8196"), "moon_color": Color("#ffe2b8"), "moon": 1.0, "moon_pos": Vector2(0.08, 0.4),
				"stars": 0.04, "clouds": 0.6,
				"far": Color("#1d2c38"), "far_glow": Color("#ffd8a0"), "mid": Color("#16222d"), "mid_glow": Color("#ffcf96"),
				"fg": Color("#060a0e"), "fog": Color("#93b2ba"), "fog_density": 0.5,
				"ambient": Color(0.7, 0.77, 0.84), "lamp": Color("#ffe0a8"),
				"stone": Color("#5d6670"), "mortar": Color("#11161b"), "stone_light": Color("#9aa6ae"),
				"weather": "motes", "far_kind": "hills", "mid_kind": "factory", "fg_kind": "grass",
				"tint": Vector3(1.0, 1.01, 1.04), "contrast": 1.06, "saturation": 0.95, "bloom": 0.7, "vignette": 0.45,
				"shadows": Vector3(0.9, 0.97, 1.1), "highlights": Vector3(1.14, 0.98, 0.9),
				"wash_top": Vector3(0.05, 0.028, 0.03), "wash_bottom": Vector3(0.02, 0.03, 0.035),
				"lamp_cone": 0.14, "lamp_rain": 0.0, "moths": 3,
			}
		"oro":
			return {
				"sky_top": Color("#0a0604"), "sky_bottom": Color("#2c1a0b"), "horizon": Color("#6e3d12"),
				"cloud": Color("#1d1209"), "moon_color": Color("#ffe1a8"), "moon": 0.6, "moon_pos": Vector2(0.5, 0.12),
				"stars": 0.3, "clouds": 0.2,
				"far": Color("#170e06"), "far_glow": Color("#ffbe63"), "mid": Color("#1f1409"), "mid_glow": Color("#ffb04c"),
				"fg": Color("#060302"), "fog": Color("#5c3a17"), "fog_density": 0.38,
				"ambient": Color(0.66, 0.54, 0.42), "lamp": Color("#ffac4a"),
				"stone": Color("#6e5c44"), "mortar": Color("#160e07"), "stone_light": Color("#b69a6c"),
				"weather": "embers", "far_kind": "reggia", "mid_kind": "colonnade", "fg_kind": "columns",
				"tint": Vector3(1.08, 1.0, 0.9), "contrast": 1.12, "saturation": 1.05, "bloom": 0.9, "vignette": 0.6,
				"shadows": Vector3(0.92, 0.96, 1.1), "highlights": Vector3(1.14, 0.98, 0.78),
				"wash_top": Vector3(0.05, 0.03, 0.0), "wash_bottom": Vector3(0.015, 0.008, 0.0),
				"lamp_cone": 0.24, "lamp_rain": 0.0, "moths": 0,
			}
		_:
			return {
				"sky_top": Color("#060a16"), "sky_bottom": Color("#1a2541"), "horizon": Color("#3b4168"),
				"cloud": Color("#121a30"), "moon_color": Color("#f4ecd8"), "moon": 0.0, "moon_pos": Vector2(0.78, 0.18),
				"stars": 0.85, "clouds": 0.35,
				"far": Color("#0c1222"), "far_glow": Color("#ffcf7a"), "mid": Color("#111a2c"), "mid_glow": Color("#ffc46e"),
				"fg": Color("#04060b"), "fog": Color("#29355a"), "fog_density": 0.38,
				"ambient": Color(0.56, 0.6, 0.78), "lamp": Color("#ffc878"),
				"stone": Color("#535a70"), "mortar": Color("#0c0e15"), "stone_light": Color("#8a91aa"),
				"weather": "motes", "far_kind": "city", "mid_kind": "facades", "fg_kind": "railing",
				"tint": Vector3(0.96, 1.0, 1.08), "contrast": 1.1, "saturation": 1.0, "bloom": 0.75, "vignette": 0.5,
				"shadows": Vector3(0.9, 0.96, 1.12), "highlights": Vector3(1.1, 1.0, 0.86),
				"wash_top": Vector3(0.0, 0.012, 0.035), "wash_bottom": Vector3(0.025, 0.016, 0.0),
				"lamp_cone": 0.4, "lamp_rain": 0.0, "moths": 6,
			}
