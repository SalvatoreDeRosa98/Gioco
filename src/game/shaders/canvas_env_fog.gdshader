// canvas_env_fog — Claude Code per "Caserta: Il Custode della Reggia".
// Scopo: banco di nebbia animato in coordinate di mondo, sfumato in alto e in basso.
// Pipeline: Godot 4.6 Compatibility (GLES3), ColorRect dentro uno strato di parallasse.
// Budget: nessuna texture; 8 valutazioni di rumore per pixel, alpha blending.
shader_type canvas_item;

group_uniforms look;
uniform vec4 fog_color : source_color = vec4(0.3, 0.35, 0.5, 1.0);
uniform float density : hint_range(0.0, 1.0) = 0.5;
group_uniforms;

group_uniforms motion;
// Velocità di scorrimento del rumore (unità di rumore al secondo).
uniform float speed = 0.02;
// Scala del rumore in coordinate di mondo: più piccolo = banchi più grandi.
uniform float scale = 0.004;
group_uniforms;

// Quanto sfumare in alto e in basso, in frazione dell'altezza del rettangolo.
const float EDGE_TOP = 0.4;
const float EDGE_BOTTOM = 0.6;

varying vec2 wpos;

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
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
		p *= 2.07;
		a *= 0.5;
	}
	return v;
}

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy;
}

void fragment() {
	vec2 p = wpos * scale;
	// Due strati di rumore che scorrono in direzioni diverse per evitare l'effetto "nastro".
	float n = fbm(p + vec2(TIME * speed, TIME * speed * 0.3));
	float n2 = fbm(p * 2.3 - vec2(TIME * speed * 1.7, 0.0));
	float v = smoothstep(0.25, 0.85, n * 0.65 + n2 * 0.45);
	float edge = smoothstep(0.0, EDGE_TOP, UV.y) * smoothstep(1.0, EDGE_BOTTOM, UV.y);
	COLOR = vec4(fog_color.rgb, v * density * edge);
}
