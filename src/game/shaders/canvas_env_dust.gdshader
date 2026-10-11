shader_type canvas_item;
// Pulviscolo di marmo dorato e fasci di luce per il Campanile della Voce
uniform vec4 dust_color : source_color = vec4(1.0, 0.88, 0.62, 0.35);
uniform vec4 beam_color : source_color = vec4(0.95, 0.82, 0.55, 0.22);
uniform float speed : hint_range(0.05, 2.0) = 0.3;
uniform float density : hint_range(0.0, 2.0) = 0.7;

float hash(vec2 p) {
	p = fract(p * vec2(443.897, 441.423));
	p += dot(p, p.yx + 19.19);
	return fract((p.x + p.y) * p.x);
}

float dust_motes(vec2 uv, float time) {
	vec2 grid = uv * vec2(28.0, 18.0) + vec2(sin(time * 0.4) * 0.5, -time * speed);
	vec2 id = floor(grid);
	vec2 f = fract(grid) - 0.5;
	float rnd = hash(id);
	if (rnd < 0.65) return 0.0;
	float d = length(f - vec2(sin(time + rnd * 6.28) * 0.25, cos(time * 0.8 + rnd * 6.28) * 0.25));
	return smoothstep(0.12, 0.0, d) * rnd;
}

void fragment() {
	vec2 uv = UV;
	float time = TIME;
	// Fasci di luce verticali / obliqui
	float beams = sin(uv.x * 12.0 + uv.y * 4.0 + time * 0.2) * 0.5 + 0.5;
	beams *= smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.5, uv.y);
	float motes = dust_motes(uv, time);
	vec4 base = texture(TEXTURE, uv);
	vec4 beam_glow = beam_color * beams * density;
	vec4 mote_glow = dust_color * motes * 2.0;
	COLOR = base + beam_glow + mote_glow;
}
