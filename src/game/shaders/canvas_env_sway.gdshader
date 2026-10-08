// canvas_env_sway — Claude Code per "Ferruccio".
// Scopo: erba, felci e catene disegnate una volta sola che ondeggiano al vento sulla GPU.
// Il peso dell'oscillazione arriva nell'alpha del colore di vertice (0 = radice/aggancio, 1 = punta),
// il colore vero nell'rgb: l'output è sempre opaco (sagome piene, senza trasparenze).
// Pipeline: Godot 4.6 Compatibility (GLES3), materiale di un Node2D che usa draw_polygon.
// Budget: nessuna texture, 2 seni per vertice, fragment banale.
shader_type canvas_item;

group_uniforms wind;
// Spostamento massimo della punta, in unità di mondo.
uniform float amplitude = 4.0;
uniform float speed = 1.4;
// Lunghezza d'onda delle raffiche lungo x (più piccolo = raffiche più larghe).
uniform float gust_scale = 0.006;
// Inclinazione costante sottovento.
uniform float lean = 1.0;
group_uniforms;

void vertex() {
	vec2 w = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy;
	float k = COLOR.a;
	float gust = 0.5 + 0.5 * sin(TIME * 0.45 + w.x * gust_scale);
	float s = sin(TIME * speed + w.x * 0.05) * (0.45 + gust) + lean;
	VERTEX.x += s * amplitude * k * k;
	VERTEX.y += abs(s) * amplitude * 0.15 * k * k;
}

void fragment() {
	COLOR = vec4(COLOR.rgb, 1.0);
}
