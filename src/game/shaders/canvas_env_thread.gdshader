// canvas_env_thread — Claude Code per "Ferruccio".
// Scopo: i fili d'oro del Velo della Concordia. Ogni filo è una striscia di triangoli costruita
//        una volta sola (env_threads.gd); qui oscilla, brilla e fa scorrere scintille verso la Reggia.
// Pipeline: Godot 4.6 Compatibility (GLES3), canvas_item additivo su un Node2D di parallasse.
// Budget: nessuna texture; ~15 operazioni per pixel, geometria statica (zero lavoro CPU per frame).
// Dati per vertice nel colore: r = fase (0-1), g = lunghezza/4096, b = luminosità, a = 1 se ghirlanda.
// UV.x = posizione lungo il filo (0-1), UV.y = attraverso la striscia (0-1).
shader_type canvas_item;
render_mode blend_add;

group_uniforms look;
uniform vec4 color : source_color = vec4(1.0, 0.8, 0.42, 1.0);
uniform float intensity : hint_range(0.0, 4.0) = 1.0;
// Frazione della striscia occupata dal filo nitido (il resto è alone).
uniform float core : hint_range(0.01, 1.0) = 0.16;
uniform float glow : hint_range(0.0, 2.0) = 0.3;
group_uniforms;

group_uniforms motion;
// Ampiezza dell'oscillazione al centro del filo, in unità di mondo.
uniform float sway = 6.0;
uniform float sway_speed = 0.55;
// Scintille che corrono lungo il filo: distanza (unità), velocità (unità/s) e forza.
uniform float spark_spacing = 260.0;
uniform float spark_speed = 70.0;
uniform float spark : hint_range(0.0, 6.0) = 2.2;
group_uniforms;

const float TAU_F = 6.28318;
const float PI_F = 3.14159;

varying float v_t;
varying float v_len;
varying float v_bright;
varying float v_phase;
varying float v_garland;

void vertex() {
	v_phase = COLOR.r;
	v_len = COLOR.g * 4096.0;
	v_bright = COLOR.b;
	v_garland = COLOR.a;
	v_t = UV.x;
	// Fermo agli estremi, libero al centro; due onde sovrapposte evitano il moto da pendolo.
	float hang = sin(UV.x * PI_F);
	float ph = v_phase * TAU_F;
	float w = sin(TIME * sway_speed + ph) + 0.35 * sin(TIME * sway_speed * 2.3 + ph * 1.7 + UV.x * 5.0);
	VERTEX += vec2(0.25, 1.0) * w * sway * hang;
}

void fragment() {
	float d = abs(UV.y - 0.5) * 2.0;
	float c = smoothstep(core, core * 0.25, d);
	float g = exp(-d * d * 5.0) * glow;
	// Segmento luminoso che viaggia dall'origine verso l'altro capo.
	float s = fract((v_t * v_len - TIME * spark_speed) / spark_spacing + v_phase);
	float pulse = smoothstep(0.0, 0.025, s) * smoothstep(0.1, 0.025, s);
	// I fili verso la Reggia svaniscono nel cielo; le ghirlande restano piene fino all'aggancio.
	float tail = mix(smoothstep(1.0, 0.45, v_t), smoothstep(1.0, 0.97, v_t), v_garland);
	float ends = smoothstep(0.0, 0.03, v_t) * tail;
	float shimmer = 0.7 + 0.3 * sin(TIME * 1.3 + v_phase * 19.0 + v_t * 11.0);
	float k = (c + g) * (shimmer + pulse * spark) * ends * v_bright * intensity;
	COLOR = vec4(color.rgb, clamp(k, 0.0, 1.0));
}
