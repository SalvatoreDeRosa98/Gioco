shader_type canvas_item;
// Contorno a china scura (stile Silksong / fumetto d'autore), volume e luce di bordo (rim light)
// sull'intera sagoma di Ferruccio: si applica al CanvasGroup che contiene il rig.
uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;
uniform vec4 outline_color : source_color = vec4(0.07, 0.08, 0.11, 0.95); // China scura profonda
uniform float outline_width = 2.4;
uniform vec4 rim_color : source_color = vec4(1.0, 0.88, 0.68, 1.0);
uniform float rim_width = 3.2;
uniform float rim_strength = 0.65;
uniform vec2 rim_dir = vec2(-0.6, -0.8);
uniform float lift = 0.02;
uniform float depth_boost = 0.45;

void fragment() {
	vec4 c = textureLod(screen_texture, SCREEN_UV, 0.0);
	if (c.a > 0.0001) { c.rgb /= c.a; }
	vec2 px = SCREEN_PIXEL_SIZE;
	
	// Contorno continuo attorno all'intera silhouette
	float around = 0.0;
	for (int i = 0; i < 12; i++) {
		float ang = float(i) * 0.5235988;
		vec2 o = vec2(cos(ang), sin(ang)) * outline_width * px;
		around = max(around, textureLod(screen_texture, SCREEN_UV + o, 0.0).a);
	}
	float edge = clamp(around - c.a, 0.0, 1.0);
	
	// Rim lighting direzionale: bordo acceso rivolto verso la luce
	float behind = textureLod(screen_texture, SCREEN_UV + normalize(rim_dir) * rim_width * px, 0.0).a;
	float rim = c.a * clamp(1.0 - behind, 0.0, 1.0) * rim_strength;
	
	// Profondità volumetrica pseudo-normale ricavata dal contrasto del dipinto
	vec2 pxd = px * 1.5;
	float lum_l = dot(textureLod(screen_texture, SCREEN_UV - vec2(pxd.x, 0.0), 0.0).rgb, vec3(0.299, 0.587, 0.114));
	float lum_r = dot(textureLod(screen_texture, SCREEN_UV + vec2(pxd.x, 0.0), 0.0).rgb, vec3(0.299, 0.587, 0.114));
	float lum_u = dot(textureLod(screen_texture, SCREEN_UV - vec2(0.0, pxd.y), 0.0).rgb, vec3(0.299, 0.587, 0.114));
	float lum_d = dot(textureLod(screen_texture, SCREEN_UV + vec2(0.0, pxd.y), 0.0).rgb, vec3(0.299, 0.587, 0.114));
	vec3 norm = normalize(vec3((lum_l - lum_r) * depth_boost, (lum_u - lum_d) * depth_boost, 1.0));
	float normal_diff = clamp(dot(norm, normalize(vec3(-rim_dir.x, -rim_dir.y, 0.75))), 0.0, 1.0);
	
	vec3 body = c.rgb * (0.88 + 0.22 * normal_diff);
	body = body * (1.0 + lift) + vec3(lift * 0.3);
	body = mix(body, rim_color.rgb * (0.35 + 0.65 * body), rim);
	
	float a = max(c.a, edge * outline_color.a);
	vec3 col = mix(outline_color.rgb, body, c.a / max(a, 0.0001));
	COLOR = vec4(col, a);
}
