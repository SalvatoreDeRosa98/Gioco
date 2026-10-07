// canvas_env_stone — Claude Code per "Caserta: Il Custode della Reggia".
// Scopo: pietra procedurale in coordinate di mondo (conci sfalsati, malta, variazione, rugosità).
// Il colore base arriva dal colore di disegno (draw_rect), così la stessa pietra cambia per area.
// Pipeline: Godot 4.6 Compatibility (GLES3), materiale di un Node2D che disegna rettangoli.
// Budget: nessuna texture; 8 valutazioni di rumore per pixel.
shader_type canvas_item;

group_uniforms masonry;
// Dimensione di un concio in pixel di mondo.
uniform vec2 brick = vec2(72.0, 36.0);
uniform vec4 mortar : source_color = vec4(0.04, 0.04, 0.06, 1.0);
// Spessore della malta come frazione dell'altezza del concio.
uniform float mortar_width : hint_range(0.0, 0.3) = 0.09;
group_uniforms;

group_uniforms surface;
uniform float variation : hint_range(0.0, 1.0) = 0.22;
uniform float roughness : hint_range(0.0, 1.0) = 0.35;
// Scala del rumore grande (macchie) e fine (grana).
uniform float coarse_scale = 0.045;
uniform float fine_scale = 0.21;
// Intensità della smussatura: alto più chiaro, basso più scuro.
uniform float bevel = 0.065;
group_uniforms;

varying vec2 wpos;

float hash(vec2 p) {
	p = fract(p * vec2(234.34, 435.345));
	p += dot(p, p + 34.23);
	return fract(p.x * p.y);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	for (int i = 0; i < 4; i++) {
		v += a * noise(p);
		p *= 2.1;
		a *= 0.5;
	}
	return v;
}

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy;
}

void fragment() {
	// Righe alterne sfalsate di mezzo concio.
	vec2 p = wpos / brick;
	p.x += mod(floor(p.y), 2.0) * 0.5;
	vec2 id = floor(p);
	vec2 f = fract(p);

	vec3 base = COLOR.rgb * (1.0 - variation * 0.5 + variation * hash(id));
	float n = fbm(wpos * coarse_scale);
	float n2 = fbm(wpos * fine_scale);
	base *= 0.78 + roughness * n + 0.12 * n2;

	// Maschera della malta: 0 sui giunti, 1 dentro il concio (giunti verticali proporzionati).
	float ex = mortar_width * brick.y / brick.x;
	float m = smoothstep(0.0, ex, f.x) * smoothstep(0.0, ex, 1.0 - f.x)
		* smoothstep(0.0, mortar_width, f.y) * smoothstep(0.0, mortar_width, 1.0 - f.y);
	base += vec3(bevel) * smoothstep(0.3, 0.0, f.y) - vec3(bevel) * smoothstep(0.7, 1.0, f.y);
	COLOR = vec4(mix(mortar.rgb, base, m), COLOR.a);
}
