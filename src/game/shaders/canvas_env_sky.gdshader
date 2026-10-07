// canvas_env_sky — Claude Code per "Caserta: Il Custode della Reggia".
// Scopo: cielo procedurale (gradiente, bagliore all'orizzonte, stelle, luna, nuvole).
// Pipeline: Godot 4.6 Compatibility (GLES3), ColorRect a schermo intero su CanvasLayer di fondo.
// Budget: nessuna texture; ~10 valutazioni di rumore per pixel (fbm a 5 ottave x 2).
shader_type canvas_item;

group_uniforms colors;
uniform vec4 top_color : source_color = vec4(0.03, 0.04, 0.09, 1.0);
uniform vec4 bottom_color : source_color = vec4(0.11, 0.15, 0.26, 1.0);
uniform vec4 horizon_color : source_color = vec4(0.2, 0.22, 0.35, 1.0);
uniform vec4 cloud_color : source_color = vec4(0.1, 0.12, 0.2, 1.0);
group_uniforms;

group_uniforms moon;
uniform vec4 moon_color : source_color = vec4(0.95, 0.92, 0.82, 1.0);
uniform float moon : hint_range(0.0, 1.0) = 1.0;
uniform vec2 moon_pos = vec2(0.78, 0.2);
// Raggio del disco lunare in unità di altezza schermo.
uniform float moon_radius = 0.05;
group_uniforms;

group_uniforms details;
uniform float stars : hint_range(0.0, 1.0) = 0.7;
uniform float clouds : hint_range(0.0, 1.0) = 0.3;
uniform float star_grid = 150.0;
uniform vec2 scroll = vec2(0.0);
uniform float aspect = 1.7778;
group_uniforms;

// Esponente della curva del gradiente verticale (>1 tiene il colore alto più a lungo).
const float GRADIENT_CURVE = 1.25;
// Probabilità massima che una cella della griglia contenga una stella.
const float STAR_CHANCE = 0.014;

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	for (int i = 0; i < 5; i++) {
		v += a * noise(p);
		p *= 2.03;
		a *= 0.5;
	}
	return v;
}

void fragment() {
	vec2 uv = UV;
	float t = TIME;
	vec3 col = mix(top_color.rgb, bottom_color.rgb, pow(uv.y, GRADIENT_CURVE));
	col += horizon_color.rgb * smoothstep(0.35, 1.0, uv.y) * 0.65;

	// Stelle: una per cella, senza branch (step sulla probabilità).
	vec2 sp = (uv + scroll * 0.01) * vec2(aspect, 1.0) * star_grid;
	float h = hash(floor(sp));
	float has_star = step(1.0 - STAR_CHANCE * stars, h);
	float twinkle = 0.55 + 0.45 * sin(t * 2.3 + h * 90.0);
	float star = smoothstep(0.14, 0.0, length(fract(sp) - 0.5));
	col += vec3(1.0, 0.95, 0.85) * has_star * star * twinkle * (1.0 - uv.y) * 1.4;

	// Luna: disco con crateri e doppio alone.
	vec2 mp = (uv - moon_pos) * vec2(aspect, 1.0);
	float md = length(mp);
	float disc = smoothstep(moon_radius * 1.04, moon_radius * 0.94, md);
	float crater = fbm(mp * 60.0) * 0.25;
	col = mix(col, moon_color.rgb * (0.95 - crater), disc * moon);
	col += moon * moon_color.rgb * (0.28 * exp(-md * 10.0) + 0.1 * exp(-md * 3.0));

	// Nuvole che scorrono lentamente, più dense in basso.
	float cn = fbm(vec2(uv.x * aspect * 1.6 + t * 0.006 + scroll.x * 0.02, uv.y * 4.5));
	float cm = smoothstep(0.52 - clouds * 0.22, 0.86, cn) * smoothstep(0.98, 0.15, uv.y);
	vec3 cloud = cloud_color.rgb + moon * moon_color.rgb * 0.08 * exp(-md * 2.0);
	col = mix(col, cloud, cm * 0.8 * clouds);
	COLOR = vec4(col, 1.0);
}
