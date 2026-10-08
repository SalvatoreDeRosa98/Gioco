// canvas_char_sprite — Claude Code per "Ferruccio".
// Scopo: personaggi dipinti. Lampo bianco quando vengono colpiti e, per Ferruccio,
//        ricolorazione della sciarpa rossa con il colore del giocatore (co-op).
// Pipeline: Godot 4.6 Compatibility (GLES3), materiale sul nodo del personaggio.
// Budget: nessuna lettura extra di texture; conversione RGB<->HSV senza rami.
shader_type canvas_item;

group_uniforms hit;
// 0 = colori dipinti, 1 = sagoma bianca.
uniform float flash : hint_range(0.0, 1.0) = 0.0;
group_uniforms;

group_uniforms scarf;
// Colore della squadra; scarf_amount = 0 lascia la sciarpa dipinta com'è.
uniform vec4 scarf_color : source_color = vec4(0.91, 0.28, 0.25, 1.0);
uniform float scarf_amount : hint_range(0.0, 1.0) = 0.0;
// Il rosso dipinto della sciarpa: tinta attorno a 0 (rosso), saturazione e luminosità medie.
uniform float scarf_hue_width = 0.07;
uniform float scarf_min_saturation = 0.28;
// Saturazione tipica della sciarpa dipinta: riferimento per scalare quella nuova.
uniform float scarf_ref_saturation = 0.62;
group_uniforms;

const float FLASH_MIN_ALPHA = 0.5;

vec3 rgb2hsv(vec3 c) {
	vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
	vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
	float d = q.x - min(q.w, q.y);
	float e = 1.0e-10;
	return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
	vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
	return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

void fragment() {
	vec4 c = COLOR;
	vec3 hsv = rgb2hsv(c.rgb);
	// Distanza dalla tinta rossa sul cerchio dei colori (0 e 1 coincidono).
	float hue_dist = min(hsv.x, 1.0 - hsv.x);
	float is_scarf = (1.0 - smoothstep(scarf_hue_width * 0.6, scarf_hue_width, hue_dist))
		* smoothstep(scarf_min_saturation, scarf_min_saturation + 0.12, hsv.y)
		* smoothstep(0.06, 0.14, hsv.z);
	vec3 target = rgb2hsv(scarf_color.rgb);
	// Stessa luce dipinta, tinta della squadra; i colori chiari si schiariscono un poco.
	vec3 recolored = hsv2rgb(vec3(target.x, clamp(hsv.y * target.y / scarf_ref_saturation, 0.0, 1.0), clamp(hsv.z * (0.75 + 0.35 * target.z), 0.0, 1.0)));
	c.rgb = mix(c.rgb, recolored, is_scarf * scarf_amount);
	// Solo i pixel pieni: ombre a terra e aloni semitrasparenti restano scuri.
	c.rgb = mix(c.rgb, vec3(1.0), flash * step(FLASH_MIN_ALPHA, c.a));
	COLOR = c;
}
