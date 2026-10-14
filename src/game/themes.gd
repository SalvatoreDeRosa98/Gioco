class_name Themes
extends RefCounted
## Atmosfera di ogni area di Caserta: cielo, luce, nebbia, colori degli strati, meteo e color grading.
## Chiavi del grading (vedi shaders/post_screen_grade.gdshader): tint, contrast, saturation, bloom,
## vignette, shadows/highlights (viraggio separato), wash_top/wash_bottom (velo di luce).
## Lampioni: lamp_cone (forza del cono volumetrico), lamp_rain (pioggia nella luce), lamp_halo
## (opacità dell'alone largo), moths (falene).
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
				"tint": Vector3(1.02, 0.94, 0.94), "contrast": 1.06, "saturation": 0.82, "bloom": 0.6, "vignette": 0.55,
				"shadows": Vector3(0.98, 0.9, 1.08), "highlights": Vector3(1.12, 0.98, 0.84),
				"wash_top": Vector3(0.012, 0.0, 0.02), "wash_bottom": Vector3(0.05, 0.022, 0.0),
				"lamp_cone": 0.26, "lamp_rain": 1.0, "lamp_halo": 0.09, "moths": 0,
			}
		"giardino":
			return {
				"sky_top": Color("#0E1612"), "sky_bottom": Color("#163226"), "horizon": Color("#2F5A40"),
				"cloud": Color("#0E1612"), "moon_color": Color("#D4E4DC"), "moon": 1.0, "moon_pos": Vector2(0.72, 0.16),
				"stars": 0.4, "clouds": 0.25,
				"far": Color("#0E1612"), "far_glow": Color("#D4B56A"), "mid": Color("#163226"), "mid_glow": Color("#7EA8B4"),
				"fg": Color("#070C09"), "fog": Color("#5C665E"), "fog_density": 0.52,
				"ambient": Color(0.46, 0.54, 0.5), "lamp": Color("#D4B56A"),
				"stone": Color("#5C665E"), "mortar": Color("#0E1612"), "stone_light": Color("#7EA8B4"),
				"weather": "fireflies", "far_kind": "canopy", "mid_kind": "garden", "fg_kind": "foliage",
				"tint": Vector3(0.94, 1.0, 0.98), "contrast": 1.06, "saturation": 0.86, "bloom": 0.7, "vignette": 0.55,
				"shadows": Vector3(0.88, 0.96, 0.94), "highlights": Vector3(1.0, 1.02, 0.94),
				"wash_top": Vector3(0.0, 0.012, 0.01), "wash_bottom": Vector3(0.0, 0.008, 0.01),
				"lamp_cone": 0.16, "lamp_rain": 0.0, "lamp_halo": 0.07, "moths": 7,
			}
		"belvedere":
			return {
				"sky_top": Color("#241810"), "sky_bottom": Color("#4A3428"), "horizon": Color("#F0D7A0"),
				"cloud": Color("#6A5848"), "moon_color": Color("#EFE4CC"), "moon": 0.7, "moon_pos": Vector2(0.08, 0.4),
				"stars": 0.04, "clouds": 0.55,
				"far": Color("#241810"), "far_glow": Color("#C9A15A"), "mid": Color("#3A2A22"), "mid_glow": Color("#EFE4CC"),
				"fg": Color("#120C08"), "fog": Color("#C4B6A4"), "fog_density": 0.5,
				"ambient": Color(0.72, 0.64, 0.52), "lamp": Color("#F0D7A0"),
				"stone": Color("#6B4632"), "mortar": Color("#241810"), "stone_light": Color("#EFE4CC"),
				"weather": "dust", "far_kind": "hills", "mid_kind": "factory", "fg_kind": "grass",
				"tint": Vector3(1.02, 0.98, 0.92), "contrast": 1.05, "saturation": 0.84, "bloom": 0.65, "vignette": 0.48,
				"shadows": Vector3(0.86, 0.78, 0.74), "highlights": Vector3(1.08, 1.0, 0.88),
				"wash_top": Vector3(0.04, 0.02, 0.01), "wash_bottom": Vector3(0.02, 0.012, 0.006),
				"lamp_cone": 0.14, "lamp_rain": 0.0, "lamp_halo": 0.06, "moths": 2,
			}
		"oro":
			return {
				"sky_top": Color("#12151A"), "sky_bottom": Color("#1C2228"), "horizon": Color("#3A4048"),
				"cloud": Color("#161A1E"), "moon_color": Color("#D9D3C7"), "moon": 0.35, "moon_pos": Vector2(0.5, 0.12),
				"stars": 0.2, "clouds": 0.15,
				"far": Color("#12151A"), "far_glow": Color("#B89A62"), "mid": Color("#1A1E24"), "mid_glow": Color("#E2A15A"),
				"fg": Color("#07080A"), "fog": Color("#6E7480"), "fog_density": 0.4,
				"ambient": Color(0.52, 0.54, 0.6), "lamp": Color("#E2A15A"),
				"stone": Color("#8A847C"), "mortar": Color("#1C1916"), "stone_light": Color("#D9D3C7"),
				"weather": "embers", "far_kind": "reggia", "mid_kind": "colonnade", "fg_kind": "columns",
				"tint": Vector3(0.96, 0.98, 1.02), "contrast": 1.1, "saturation": 0.8, "bloom": 0.72, "vignette": 0.58,
				"shadows": Vector3(0.88, 0.9, 0.98), "highlights": Vector3(1.04, 0.98, 0.88),
				"wash_top": Vector3(0.01, 0.012, 0.02), "wash_bottom": Vector3(0.02, 0.012, 0.0),
				"lamp_cone": 0.28, "lamp_rain": 0.0, "lamp_halo": 0.1, "moths": 0,
			}
		"acquedotto":
			return {
				"sky_top": Color("#141820"), "sky_bottom": Color("#1C2430"), "horizon": Color("#4A5160"),
				"cloud": Color("#1A2028"), "moon_color": Color("#A8B0B8"), "moon": 0.1, "moon_pos": Vector2(0.7, 0.22),
				"stars": 0.02, "clouds": 0.15,
				"far": Color("#141820"), "far_glow": Color("#E0B15A"), "mid": Color("#1A2028"), "mid_glow": Color("#8EB4C4"),
				"fg": Color("#07080C"), "fog": Color("#A8B0B8"), "fog_density": 0.5,
				"ambient": Color(0.48, 0.52, 0.58), "lamp": Color("#E0B15A"),
				"stone": Color("#4A5160"), "mortar": Color("#141820"), "stone_light": Color("#8EB4C4"),
				"weather": "dust", "far_kind": "arches", "mid_kind": "channel", "fg_kind": "piers",
				"tint": Vector3(0.94, 0.98, 1.04), "contrast": 1.08, "saturation": 0.76, "bloom": 0.5, "vignette": 0.6,
				"shadows": Vector3(0.84, 0.9, 1.0), "highlights": Vector3(1.0, 0.98, 0.9),
				"wash_top": Vector3(0.0, 0.008, 0.016), "wash_bottom": Vector3(0.008, 0.016, 0.02),
				"lamp_cone": 0.34, "lamp_rain": 0.35, "lamp_halo": 0.08, "moths": 0,
			}
		_:
			return {
				"sky_top": Color("#060a16"), "sky_bottom": Color("#1a2541"), "horizon": Color("#3b4168"),
				"cloud": Color("#121a30"), "moon_color": Color("#f4ecd8"), "moon": 0.0, "moon_pos": Vector2(0.78, 0.18),
				"stars": 0.85, "clouds": 0.35,
				"far": Color("#0c1222"), "far_glow": Color("#ffcf7a"), "mid": Color("#111a2c"), "mid_glow": Color("#ffc46e"),
				"fg": Color("#04060b"), "fog": Color("#29355a"), "fog_density": 0.38,
				"ambient": Color(0.5, 0.52, 0.62), "lamp": Color("#E2A15A"),
				"stone": Color("#535a70"), "mortar": Color("#0c0e15"), "stone_light": Color("#8a91aa"),
				"weather": "motes", "far_kind": "city", "mid_kind": "facades", "fg_kind": "railing",
				"tint": Vector3(0.94, 0.98, 1.06), "contrast": 1.08, "saturation": 0.86, "bloom": 0.65, "vignette": 0.52,
				"shadows": Vector3(0.9, 0.96, 1.12), "highlights": Vector3(1.1, 1.0, 0.86),
				"wash_top": Vector3(0.0, 0.012, 0.035), "wash_bottom": Vector3(0.025, 0.016, 0.0),
				"lamp_cone": 0.4, "lamp_rain": 0.0, "lamp_halo": 0.09, "moths": 6,
			}
