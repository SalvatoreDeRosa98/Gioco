shader_type canvas_item;
// Contorno e luce di bordo (rim light) sull'intera sagoma di Ferruccio: si applica al
// CanvasGroup che contiene il rig, cosi' i pezzi del cutout danno un solo profilo.
uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;
uniform vec4 outline_color : source_color = vec4(0.98, 0.92, 0.78, 0.9);
uniform float outline_width = 2.0;
uniform vec4 rim_color : source_color = vec4(1.0, 0.86, 0.6, 1.0);
uniform float rim_width = 3.0;
uniform float rim_strength = 0.55;
uniform vec2 rim_dir = vec2(-0.6, -0.8);
uniform float lift = 0.06;

void fragment() {
	vec4 c = textureLod(screen_texture, SCREEN_UV, 0.0);
	if (c.a > 0.0001) { c.rgb /= c.a; }
	vec2 px = SCREEN_PIXEL_SIZE;
	float around = 0.0;
	for (int i = 0; i < 12; i++) {
		float ang = float(i) * 0.5235988;
		vec2 o = vec2(cos(ang), sin(ang)) * outline_width * px;
		around = max(around, textureLod(screen_texture, SCREEN_UV + o, 0.0).a);
	}
	float edge = clamp(around - c.a, 0.0, 1.0);
	// Rim: dove la sagoma finisce nella direzione della luce, il bordo si accende.
	float behind = textureLod(screen_texture, SCREEN_UV + normalize(rim_dir) * rim_width * px, 0.0).a;
	float rim = c.a * clamp(1.0 - behind, 0.0, 1.0) * rim_strength;
	vec3 body = c.rgb * (1.0 + lift) + vec3(lift * 0.5);
	body = mix(body, rim_color.rgb, rim);
	float a = max(c.a, edge * outline_color.a);
	vec3 col = mix(outline_color.rgb, body, c.a / max(a, 0.0001));
	COLOR = vec4(col, a);
}
