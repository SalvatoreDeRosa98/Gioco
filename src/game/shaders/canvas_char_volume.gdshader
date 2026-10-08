// canvas_char_volume.gdshader — Ombreggiatura volumetrica e rim-lighting 3D per i personaggi dipinti
shader_type canvas_item;

uniform vec2 light_dir = vec2(-0.55, -0.75);
uniform float rim_px = 3.2;
uniform float rim_lod = 1.5;
uniform float rim_strength : hint_range(0.0, 2.0) = 0.55;
uniform float shade_strength : hint_range(0.0, 1.0) = 0.32;
uniform float ground_shade : hint_range(0.0, 1.0) = 0.20;
uniform vec4 light_color : source_color = vec4(1.0, 0.95, 0.88, 1.0);
uniform vec4 ambient_color : source_color = vec4(0.72, 0.76, 0.85, 1.0);
uniform float depth_boost : hint_range(0.0, 2.0) = 0.6;
uniform float flash : hint_range(0.0, 1.0) = 0.0;

void fragment() {
	vec4 c = COLOR;
	if (c.a < 0.02) {
		COLOR = c;
	} else {
		vec2 l = normalize(light_dir) * rim_px * TEXTURE_PIXEL_SIZE;
		float alpha_lit = textureLod(TEXTURE, UV + l, rim_lod).a;
		float alpha_dark = textureLod(TEXTURE, UV - l, rim_lod).a;
		
		float lit = clamp(1.0 - alpha_lit, 0.0, 1.0);
		float dark = clamp(1.0 - alpha_dark, 0.0, 1.0);
		
		float rim = clamp(lit * 1.5 - 0.1, 0.0, 1.0);
		float shadow = clamp(dark * 1.3, 0.0, 1.0) * (1.0 - rim);
		float ground = smoothstep(0.65, 1.0, UV.y);
		
		// Pseudonormale per micro-dettaglio e pieghe della stoffa
		vec2 px = TEXTURE_PIXEL_SIZE * 1.2;
		float lum_l = dot(texture(TEXTURE, UV - vec2(px.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
		float lum_r = dot(texture(TEXTURE, UV + vec2(px.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
		float lum_u = dot(texture(TEXTURE, UV - vec2(0.0, px.y)).rgb, vec3(0.299, 0.587, 0.114));
		float lum_d = dot(texture(TEXTURE, UV + vec2(0.0, px.y)).rgb, vec3(0.299, 0.587, 0.114));
		vec3 norm = normalize(vec3((lum_l - lum_r) * depth_boost, (lum_u - lum_d) * depth_boost, 1.0));
		float normal_diff = clamp(dot(norm, normalize(vec3(-light_dir.x, -light_dir.y, 0.8))), 0.0, 1.0);
		
		c.rgb *= (0.80 + 0.30 * normal_diff);
		c.rgb *= (1.0 - shade_strength * shadow - ground_shade * ground);
		c.rgb += light_color.rgb * rim_strength * rim * (0.25 + 0.75 * c.rgb);
		c.rgb = mix(c.rgb, c.rgb * ambient_color.rgb, 0.22);
		if (flash > 0.0) {
			c.rgb = mix(c.rgb, vec3(1.2), flash);
		}
		COLOR = c;
	}
}
