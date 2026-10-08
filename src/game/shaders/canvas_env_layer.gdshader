// canvas_env_layer — Claude Code per "Ferruccio".
// Scopo: strato dipinto di parallasse (sfondo lontano, medio, primo piano) con tinta,
//        foschia atmosferica e sfocatura leggera per staccarlo dal piano di gioco.
// Pipeline: Godot 4.6 Compatibility (GLES3), Sprite2D con regione ripetuta a specchio.
// Budget: una lettura di texture per pixel (con bias di mipmap), alpha blending.
shader_type canvas_item;

group_uniforms look;
// Moltiplica il colore dipinto: sotto 1 scurisce lo strato.
uniform vec4 tint : source_color = vec4(1.0);
// Colore verso cui sfuma lo strato quando è lontano.
uniform vec4 haze_color : source_color = vec4(0.1, 0.12, 0.2, 1.0);
uniform float haze : hint_range(0.0, 1.0) = 0.0;
// Bias di mipmap: 0 = nitido, 1-2 = morbido. Serve la texture importata con mipmap.
uniform float blur : hint_range(0.0, 4.0) = 0.0;
group_uniforms;

void fragment() {
	vec4 c = texture(TEXTURE, UV, blur);
	vec3 rgb = mix(c.rgb * tint.rgb, haze_color.rgb, haze);
	COLOR = vec4(rgb, c.a * tint.a);
}
