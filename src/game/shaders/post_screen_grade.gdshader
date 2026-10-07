// post_screen_grade — Claude Code per "Caserta: Il Custode della Reggia".
// Scopo: post-processing a schermo intero (bloom da mipmap, aberrazione cromatica,
// color grading, vignetta, grana).
// Pipeline: Godot 4.6 Compatibility (GLES3), canvas_item su ColorRect a schermo intero.
// Budget: 11 letture di texture per pixel (3 colore + 8 bloom su mip bassi), nessun loop.
// Il bloom legge i livelli mip dello schermo: il filtro mipmap fa già la sfocatura,
// quindi non serve una sfocatura a due passaggi.
shader_type canvas_item;

uniform sampler2D screen_tex : hint_screen_texture, filter_linear_mipmap;

group_uniforms grading;
uniform vec3 tint = vec3(1.0);
uniform float contrast : hint_range(0.5, 2.0) = 1.08;
uniform float saturation : hint_range(0.0, 2.0) = 1.0;
uniform float lift : hint_range(-0.2, 0.2) = 0.0;
group_uniforms;

group_uniforms bloom;
uniform float bloom_strength : hint_range(0.0, 3.0) = 0.6;
uniform float bloom_threshold : hint_range(0.0, 1.0) = 0.5;
// Ampiezza della soglia morbida sopra bloom_threshold.
uniform float bloom_knee : hint_range(0.01, 1.0) = 0.35;
// Distanza in pixel dei campioni vicini e lontani.
uniform float bloom_near_px = 9.0;
uniform float bloom_far_px = 26.0;
// Livelli mip letti: più alto = alone più largo e morbido.
uniform float bloom_near_lod = 2.5;
uniform float bloom_far_lod = 4.5;
group_uniforms;

group_uniforms lens;
uniform float vignette : hint_range(0.0, 1.0) = 0.5;
uniform float grain : hint_range(0.0, 0.2) = 0.03;
uniform float aberration : hint_range(0.0, 0.01) = 0.0012;
group_uniforms;

// Pesi di luminanza Rec. 601.
const vec3 LUMA = vec3(0.299, 0.587, 0.114);
// Diagonale normalizzata per i campioni a croce ruotata.
const float DIAG = 0.7071;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 bright(vec2 uv, float lod) {
	vec3 c = textureLod(screen_tex, uv, lod).rgb;
	float l = max(c.r, max(c.g, c.b));
	return c * smoothstep(bloom_threshold, bloom_threshold + bloom_knee, l);
}

void fragment() {
	vec2 uv = SCREEN_UV;
	vec2 d = uv - vec2(0.5);

	// Aberrazione: rosso e blu spostati in direzioni opposte rispetto al centro.
	vec3 col;
	col.r = textureLod(screen_tex, uv + d * aberration, 0.0).r;
	col.g = textureLod(screen_tex, uv, 0.0).g;
	col.b = textureLod(screen_tex, uv - d * aberration, 0.0).b;

	// Bloom: 4 campioni a croce vicini e 4 diagonali lontani su mip sfocati.
	vec2 n = SCREEN_PIXEL_SIZE * bloom_near_px;
	vec2 f = SCREEN_PIXEL_SIZE * bloom_far_px * DIAG;
	vec3 b = bright(uv + vec2(n.x, 0.0), bloom_near_lod)
		+ bright(uv - vec2(n.x, 0.0), bloom_near_lod)
		+ bright(uv + vec2(0.0, n.y), bloom_near_lod)
		+ bright(uv - vec2(0.0, n.y), bloom_near_lod)
		+ bright(uv + f, bloom_far_lod)
		+ bright(uv - f, bloom_far_lod)
		+ bright(uv + vec2(f.x, -f.y), bloom_far_lod)
		+ bright(uv + vec2(-f.x, f.y), bloom_far_lod);
	col += b * (bloom_strength / 4.0);

	float l = dot(col, LUMA);
	col = mix(vec3(l), col, saturation);
	col = (col - 0.5) * contrast + 0.5 + lift;
	col *= tint;

	// Vignetta ellittica, più stretta in orizzontale.
	float v = smoothstep(0.95, 0.3, length(d * vec2(1.25, 1.0)));
	col *= mix(1.0 - vignette, 1.0, v);
	col += (hash(uv * 1013.0 + fract(TIME) * 37.0) - 0.5) * grain;
	COLOR = vec4(max(col, vec3(0.0)), 1.0);
}
