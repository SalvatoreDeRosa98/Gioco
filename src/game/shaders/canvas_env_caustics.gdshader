shader_type canvas_item;
// Caustiche e riflessi d'olio/acqua scura per le Cisterne Reali e Cisterne Sepolte
uniform vec4 water_tint : source_color = vec4(0.08, 0.22, 0.28, 0.65);
uniform vec4 caustic_color : source_color = vec4(0.45, 0.75, 0.85, 0.4);
uniform float speed : hint_range(0.1, 4.0) = 0.8;
uniform float scale : hint_range(1.0, 50.0) = 16.0;
uniform float intensity : hint_range(0.0, 2.0) = 0.55;

float caustic_pattern(vec2 uv, float time) {
	vec2 p = uv * scale;
	vec2 p1 = p + vec2(sin(p.y * 0.8 + time * speed), cos(p.x * 0.8 + time * speed));
	vec2 p2 = p + vec2(cos(p.y * 1.1 - time * speed * 0.7), sin(p.x * 1.1 - time * speed * 0.7));
	float c1 = sin(p1.x + p1.y) * cos(p1.x - p1.y);
	float c2 = cos(p2.x + p2.y) * sin(p2.x - p2.y);
	return clamp(pow(abs(c1 + c2), 3.0), 0.0, 1.0);
}

void fragment() {
	vec2 uv = UV;
	float time = TIME;
	float c = caustic_pattern(uv, time);
	float fade = smoothstep(0.0, 0.25, uv.y) * smoothstep(1.0, 0.7, uv.y);
	vec4 base = texture(TEXTURE, uv);
	vec4 col = mix(base, water_tint, water_tint.a);
	vec4 caustic = caustic_color * c * intensity * fade;
	COLOR = col + caustic;
}
