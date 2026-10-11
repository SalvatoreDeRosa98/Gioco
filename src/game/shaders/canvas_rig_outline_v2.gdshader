shader_type canvas_item;
// Ferruccio v2: contorno, livelli e rim light secondo CORREZIONI-FERRUCCIO-INGAME.md §3.4.
// Applicato al CanvasGroup del rig (legge la sagoma composta di tutti i pezzi), quindi il
// contorno gira attorno all'intera figura e non attorno a ogni pezzo. Le distanze sono in
// pixel dello schermo finale (3 px di contorno e 2 px di rim a 1080p).
render_mode unshaded;
uniform sampler2D screen_texture : hint_screen_texture, repeat_disable, filter_linear;
uniform vec4 outline_color : source_color = vec4(0.051, 0.055, 0.067, 1.0); // #0D0E11
uniform float outline_px = 3.0;
uniform vec4 rim_color : source_color = vec4(1.0, 0.902, 0.690, 1.0);      // #FFE6B0
uniform float rim_px = 2.0;
uniform float rim_strength = 0.7;
uniform vec2 rim_dir = vec2(-1.0, -0.4); // verso la luce; il rig lo inverte con il flip
uniform float white_point = 0.82;
uniform float highlight_desat = 0.65;

void fragment() {
	vec4 c = textureLod(screen_texture, SCREEN_UV, 0.0);
	if (c.a > 0.0001) {
		c.rgb /= c.a;
	}
	vec2 px = SCREEN_PIXEL_SIZE;
	float a = 0.0;
	for (int i = 0; i < 8; i++) {
		float ang = float(i) * 0.785398;
		a = max(a, textureLod(screen_texture, SCREEN_UV + vec2(cos(ang), sin(ang)) * px * outline_px, 0.0).a);
	}
	vec3 col = clamp(c.rgb / white_point, 0.0, 1.0);
	float l = dot(col, vec3(0.299, 0.587, 0.114));
	col = mix(col, vec3(l), highlight_desat * smoothstep(0.55, 0.9, l));
	float edge = 1.0 - textureLod(screen_texture, SCREEN_UV + normalize(rim_dir) * px * rim_px, 0.0).a;
	col = mix(col, rim_color.rgb, edge * rim_strength * c.a);
	vec4 outc = vec4(col, c.a);
	COLOR = mix(vec4(outline_color.rgb, a * outline_color.a), outc, c.a);
	COLOR.a = max(c.a, a * outline_color.a);
}
