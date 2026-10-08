// canvas_env_reflect — Claude Code per "Ferruccio".
// Scopo: pavimento bagnato (Corso Trieste): specchia ciò che sta sopra la linea del pavimento,
//        con increspature della pioggia, sfocatura crescente e scurimento della pietra bagnata.
// Pipeline: Godot 4.6 Compatibility (GLES3), ColorRect sopra il terreno e sotto i personaggi.
//           Legge lo schermo già disegnato (sfondi, lampioni, pietra): i personaggi non si specchiano.
// Budget: 1 lettura dello schermo (mip) per pixel su una fascia bassa, 2 rumori 1D, 4 hash; blend premoltiplicato.
shader_type canvas_item;
render_mode blend_premul_alpha;

uniform sampler2D screen_tex : hint_screen_texture, filter_linear_mipmap;

group_uniforms look;
uniform vec4 tint : source_color = vec4(0.8, 0.85, 1.0, 1.0);
// Quanta luce riflessa si somma alla pietra.
uniform float strength : hint_range(0.0, 2.0) = 0.6;
// Quanto la pietra bagnata si scurisce.
uniform float wet : hint_range(0.0, 1.0) = 0.3;
// Altezza del rettangolo in UV di schermo (impostata da backdrop.gd in base allo zoom).
uniform float height_uv = 0.1;
group_uniforms;

group_uniforms ripples;
uniform float ripple : hint_range(0.0, 0.02) = 0.004;
uniform float ripple_freq = 0.09;
// Livello di mipmap della lettura vicino alla linea del pavimento e quanto cresce allontanandosi.
uniform float blur = 0.3;
uniform float blur_grow = 1.6;
group_uniforms;

group_uniforms puddles;
// Quanto le pozzanghere si staccano dalla pietra solo umida (0 = riflesso uniforme).
uniform float puddles : hint_range(0.0, 1.0) = 0.7;
// Frequenza delle pozzanghere lungo x (più piccolo = pozzanghere più lunghe).
uniform float puddle_scale = 0.007;
// Cerchi delle gocce nelle pozzanghere: forza, gocce al secondo per cella, profondità della fascia (unità).
uniform float rings : hint_range(0.0, 2.0) = 0.8;
uniform float ring_rate = 0.9;
uniform float depth_units = 90.0;
group_uniforms;

// Soglia di luminanza sotto cui il riflesso non conta (evita di specchiare il buio).
const float REFL_FLOOR = 0.05;
// Quanto la lettura si allontana dalla linea del pavimento rispetto alla distanza vera.
const float MIRROR_STRETCH = 1.6;
// Larghezza di una cella dei cerchi (unità), raggio massimo, schiacciamento verticale dell'ellisse.
const float RING_CELL = 26.0;
const float RING_R = 13.0;
const float RING_FLAT = 3.5;

varying vec2 wpos;

float hash1(float n) {
	return fract(sin(n * 127.1) * 43758.5453);
}

float noise1(float x) {
	float i = floor(x);
	float f = fract(x);
	f = f * f * (3.0 - 2.0 * f);
	return mix(hash1(i), hash1(i + 1.0), f);
}

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy;
}

void fragment() {
	float floor_uv = SCREEN_UV.y - UV.y * height_uv;
	float dist = SCREEN_UV.y - floor_uv;
	float wave = sin(wpos.y * 0.9 + TIME * 3.1 + sin(wpos.x * ripple_freq + TIME * 1.7) * 2.0);
	vec2 suv = vec2(SCREEN_UV.x + wave * ripple * (0.3 + UV.y), floor_uv - dist * MIRROR_STRETCH);
	vec3 refl = textureLod(screen_tex, suv, blur + UV.y * blur_grow).rgb;
	refl = max(refl - vec3(REFL_FLOOR), vec3(0.0)) * 1.25;
	float fade = pow(1.0 - UV.y, 1.6) * smoothstep(0.0, 0.06, UV.y + 0.02);
	// Pozzanghere: chiazze lungo x che riflettono pienamente; tra l'una e l'altra pietra solo umida.
	float n = noise1(wpos.x * puddle_scale) * 0.7 + noise1(wpos.x * puddle_scale * 3.1 + 5.0) * 0.3;
	float mask = mix(1.0, smoothstep(0.35, 0.65, n), puddles);
	vec3 add = refl * tint.rgb * strength * fade * (0.25 + 0.75 * mask);

	// Cerchi delle gocce: una goccia per cella che si ripete con fase casuale; ellissi schiacciate.
	float ly = UV.y * depth_units;
	float cell = floor(wpos.x / RING_CELL);
	float h = hash1(cell);
	float ph = fract(TIME * ring_rate * (0.7 + 0.6 * h) + h * 7.3);
	vec2 c = vec2((cell + 0.25 + 0.5 * hash1(cell + 31.0)) * RING_CELL, (0.15 + 0.45 * hash1(cell + 57.0)) * depth_units);
	float rd = length(vec2(wpos.x - c.x, (ly - c.y) * RING_FLAT));
	float ring = smoothstep(1.6, 0.0, abs(rd - ph * RING_R)) * (1.0 - ph) * step(0.35, hash1(cell + 91.0));
	add += tint.rgb * ring * rings * mask * fade * 0.6;
	COLOR = vec4(add, wet * fade * (0.5 + 0.5 * mask));
}
