// canvas_char_mesh — Claude Code per "Ferruccio".
// Scopo: personaggio dipinto come mesh deformabile senza giunture (come le mesh pesate di Spine):
//        gambe che si piegano all'anca e al ginocchio, busto che respira, si inclina e si
//        schiaccia/allunga in modo morbido, cappello a molla, sciarpa che ondeggia, orlo che si
//        apre, manica che segue il braccio. Nel fragment: lampo, ricolorazione della sciarpa,
//        chiaroscuro "rotondo" (luce di taglio dal lato della luce, ombra dal lato opposto e in
//        basso) e tinta dell'ambiente per legarlo alla scena.
// Pipeline: Godot 4.6 Compatibility (GLES3). Usato da src/game/char_rig.gd: una MeshInstance2D con
//        la griglia del corpo (UV.x + 2 = strato di dietro: gamba lontana e coda della sciarpa,
//        disegnato prima e con la sua tela), una piccola
//        mesh del polsino sopra la spada e la spada stessa (rigid = true, nessuna deformazione).
//        I pesi vengono da pesi.png (tools/art/rig_ferruccio_mesh.py); i perni sono in pixel della
//        tela dipinta 679x1024, gli stessi di quel file e di char_rig.gd.
// Budget: vertex — 2 letture (textureLod) della mappa dei pesi per vertice (~1500 vertici).
//         fragment — 2 letture di colore + 4 di alfa a mipmap fissa per il chiaroscuro (ogni lettura
//         è doppia perché i due strati hanno tele diverse e si sceglie con mix, senza rami); niente cicli.
shader_type canvas_item;

group_uniforms rig;
// Mappa dei pesi: riquadro sinistro R gamba vicina, G gamba lontana, B cappello;
// riquadro destro R sciarpa, G manica, B orlo. Campionata solo nel vertex shader.
uniform sampler2D weights : filter_linear, repeat_disable;
// Ciò che sta dietro il corpo (gamba lontana, coda della sciarpa), stessa tela: strato con UV.x + 2.
uniform sampler2D back_tex : filter_linear_mipmap, repeat_disable;
// Dimensione della tela dipinta in pixel: UV * canvas_size = posizione a riposo.
uniform vec2 canvas_size = vec2(679.0, 1024.0);
// true per la spada: niente deformazione (ruota il nodo attorno al polso).
uniform bool rigid = false;
group_uniforms;

group_uniforms legs;
// Angoli in radianti: x = anca (negativo = gamba in avanti), y = ginocchio (>= 0, stinco indietro).
uniform vec2 leg_front = vec2(0.0);
uniform vec2 leg_back = vec2(0.0);
// Perni in pixel della tela.
uniform vec2 hip_front = vec2(332.0, 792.0);
uniform vec2 knee_front = vec2(336.0, 872.0);
uniform vec2 hip_back = vec2(392.0, 792.0);
uniform vec2 knee_back = vec2(374.0, 866.0);
// Mezza altezza (px) della zona in cui il ginocchio si piega: più larga = piega più tonda.
uniform float knee_soft = 30.0;
// Tinta della gamba lontana (più scura: è in ombra, dietro); la coda della sciarpa non cambia.
uniform vec4 back_shade : source_color = vec4(0.8, 0.8, 0.86, 1.0);
// Da questa altezza (frazione della tela) lo strato di dietro è gamba.
uniform float back_leg_from = 0.745;
group_uniforms;

group_uniforms body;
// Linea dei piedi, punta del cappello e asse verticale del corpo (px della tela).
uniform float feet_y = 1012.0;
uniform float top_y = 8.0;
uniform float axis_x = 368.0;
// Inclinazione morbida del busto (rad, positivo = in avanti) attorno al bacino; sopra chest_y è piena.
uniform float lean = 0.0;
uniform vec2 hip_center = vec2(364.0, 800.0);
uniform float chest_y = 430.0;
// Schiacciamento/allungamento (frazione dell'altezza, > 0 allunga): i piedi restano a terra,
// la deformazione si concentra nel busto e la vita si allarga quando si schiaccia (volume).
uniform float squash : hint_range(-0.5, 0.5) = 0.0;
uniform float bulge = 0.9;
// Respiro (-1..1): il petto si allarga di breath_widen e le spalle salgono di breath_px.
uniform float breath : hint_range(-1.0, 1.0) = 0.0;
uniform float breath_px = 5.0;
uniform float breath_widen = 0.025;
// Manica (rad attorno alla spalla, positivo = il polso va indietro).
uniform float arm = 0.0;
uniform vec2 shoulder = vec2(350.0, 372.0);
group_uniforms;

group_uniforms cloth;
// Cappello: flessione (rad, positivo = punta in su), crescente verso la punta.
uniform float hat = 0.0;
uniform vec2 hat_pivot = vec2(366.0, 158.0);
// Sciarpa: sollevamento all'indietro (rad) attorno al nodo, onda che corre verso le frange.
uniform float scarf_lift = 0.0;
uniform float scarf_phase = 0.0;
uniform float scarf_wave = 0.0;
uniform float scarf_waves = 1.1;
uniform vec2 scarf_knot = vec2(345.0, 318.0);
// Nello strato principale si muove solo la coda corta davanti (a destra di questa colonna):
// la coda lunga sta nello strato di dietro.
uniform float scarf_front_x = 372.0;
// Orlo del camicione: apertura a campana (0..1) e trascinamento (positivo = indietro).
uniform float hem_open : hint_range(0.0, 1.0) = 0.0;
uniform float hem_drag : hint_range(-1.0, 1.0) = 0.0;
uniform float hem_flare = 0.2;
uniform float hem_lift_px = 22.0;
uniform float hem_drag_px = 28.0;
group_uniforms;

group_uniforms hit;
// 0 = colori dipinti, 1 = sagoma piena di flash_color (colpo, immagini residue dello scatto).
uniform float flash : hint_range(0.0, 1.0) = 0.0;
uniform vec4 flash_color : source_color = vec4(1.0);
group_uniforms;

group_uniforms scarf;
// Colore della sciarpa; scarf_amount = 0 lascia quella dipinta (come canvas_char_sprite).
uniform vec4 scarf_color : source_color = vec4(0.91, 0.28, 0.25, 1.0);
uniform float scarf_amount : hint_range(0.0, 1.0) = 0.0;
uniform float scarf_hue_width = 0.07;
uniform float scarf_min_saturation = 0.28;
uniform float scarf_ref_saturation = 0.62;
group_uniforms;

group_uniforms light;
// Direzione da cui arriva la luce, nello spazio dell'immagine (char_rig la specchia col verso).
uniform vec2 light_dir = vec2(-0.55, -0.83);
uniform vec4 light_color : source_color = vec4(1.0, 0.93, 0.8, 1.0);
// Tinta dell'area (themes.gd): colora il taglio di luce e, di ambient_amount, tutto il personaggio.
uniform vec4 ambient : source_color = vec4(1.0);
uniform float ambient_amount : hint_range(0.0, 1.0) = 0.0;
// Luce di taglio: intensità, spessore (px della tela) e sfocatura (livello di mipmap dell'alfa).
uniform float rim_strength : hint_range(0.0, 2.0) = 0.5;
uniform float rim_px = 11.0;
uniform float rim_lod = 2.0;
// Ombra morbida dal lato opposto alla luce e verso i piedi.
uniform float shade_strength : hint_range(0.0, 1.0) = 0.3;
uniform float ground_shade : hint_range(0.0, 1.0) = 0.22;
group_uniforms;

const float FLASH_MIN_ALPHA = 0.5;

varying float v_layer;
varying vec4 v_color;

vec2 rot_about(vec2 p, vec2 c, float a) {
	float s = sin(a);
	float k = cos(a);
	vec2 d = p - c;
	return c + vec2(k * d.x - s * d.y, s * d.x + k * d.y);
}

void vertex() {
	v_color = COLOR;
	v_layer = step(1.5, UV.x);
	UV.x -= 2.0 * v_layer;
	if (!rigid) {
		vec2 p = UV * canvas_size;
		// Ogni riquadro è largo mezzo atlante: si legge al massimo fino al centro del suo ultimo
		// texel, così il filtro lineare non mescola i due riquadri.
		float half_texel = 0.5 / float(textureSize(weights, 0).x);
		float tu = clamp(UV.x * 0.5, half_texel, 0.5 - half_texel);
		vec3 wa = textureLod(weights, vec2(tu, UV.y), 0.0).rgb;
		vec3 wb = textureLod(weights, vec2(0.5 + tu, UV.y), 0.0).rgb;
		vec2 q = p;

		// Gamba: prima il ginocchio (figlio), poi l'anca. Gli angoli sono scalati dal peso, non
		// i punti: la piega resta un arco e non si affloscia come la miscela lineare.
		vec2 hip = mix(hip_front, hip_back, v_layer);
		vec2 knee = mix(knee_front, knee_back, v_layer);
		vec2 ang = mix(leg_front, leg_back, v_layer);
		float wl = mix(wa.r, wa.g, v_layer);
		float kw = smoothstep(knee.y - knee_soft, knee.y + knee_soft, p.y);
		q = rot_about(q, knee, ang.y * kw * wl);
		q = rot_about(q, hip, ang.x * wl);

		q = rot_about(q, shoulder, arm * wb.g);
		q = rot_about(q, hat_pivot, hat * wa.b);

		// Sciarpa: si solleva attorno al nodo e ondeggia di traverso, più forte verso le frange.
		float ws = wb.r * mix(smoothstep(scarf_front_x - 40.0, scarf_front_x, p.x), 1.0, v_layer);
		q = rot_about(q, scarf_knot, scarf_lift * ws);
		vec2 dir = normalize(p - scarf_knot + vec2(0.0, 0.001));
		q += vec2(-dir.y, dir.x) * scarf_wave * ws * sin(scarf_phase - ws * scarf_waves * TAU);

		// Orlo: si apre a campana (i lati salgono un poco) e si trascina indietro.
		float wh = wb.b;
		float side = p.x - axis_x;
		q.x += (side * hem_flare * hem_open - hem_drag * hem_drag_px) * wh;
		q.y -= (hem_open * hem_lift_px * clamp(abs(side) / 120.0, 0.0, 1.0) + abs(hem_drag) * hem_drag_px * 0.3) * wh;

		// Busto: inclinazione che cresce dal bacino al petto (la schiena si curva, non ruota rigida).
		float bw = 1.0 - smoothstep(chest_y, hip_center.y, p.y);
		q = rot_about(q, hip_center, lean * bw);

		// Schiacciamento e respiro: campi morbidi in altezza, piedi fermi.
		float u = clamp((feet_y - p.y) / (feet_y - top_y), 0.0, 1.0);
		float rise = mix(u, smoothstep(0.12, 0.8, u), 0.6);
		float waist = smoothstep(0.08, 0.42, u) * (1.0 - smoothstep(0.5, 0.92, u));
		float chest = smoothstep(0.35, 0.6, u) * (1.0 - smoothstep(0.7, 0.85, u));
		float side_c = clamp(side, -160.0, 160.0);
		q.y -= squash * (feet_y - top_y) * rise + breath * breath_px * smoothstep(0.3, 0.7, u);
		q.x += side_c * (breath * breath_widen * chest - squash * bulge * waist);

		VERTEX += q - p;
	}
}

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
	vec4 c = mix(texture(TEXTURE, UV), texture(back_tex, UV), v_layer);
	c.rgb *= mix(vec3(1.0), back_shade.rgb, v_layer * smoothstep(back_leg_from - 0.01, back_leg_from + 0.01, UV.y));

	vec3 hsv = rgb2hsv(c.rgb);
	float hue_dist = min(hsv.x, 1.0 - hsv.x);
	float is_scarf = (1.0 - smoothstep(scarf_hue_width * 0.6, scarf_hue_width, hue_dist))
		* smoothstep(scarf_min_saturation, scarf_min_saturation + 0.12, hsv.y)
		* smoothstep(0.06, 0.14, hsv.z);
	vec3 target = rgb2hsv(scarf_color.rgb);
	vec3 recolored = hsv2rgb(vec3(target.x, clamp(hsv.y * target.y / scarf_ref_saturation, 0.0, 1.0), clamp(hsv.z * (0.75 + 0.35 * target.z), 0.0, 1.0)));
	c.rgb = mix(c.rgb, recolored, is_scarf * scarf_amount);

	// Volume: dove verso la luce l'alfa sfocata (mipmap fissa) cala, il bordo è illuminato di
	// taglio; dove cala dal lato opposto è in ombra. Verso i piedi un'ombra leggera di contatto.
	// La figura legge la propria alfa; lo strato di dietro l'unione delle due, così i tagli dove
	// gamba e sciarpa spariscono dietro il corpo non si accendono (2 letture per punto, niente rami).
	vec2 l = normalize(light_dir) * rim_px * TEXTURE_PIXEL_SIZE;
	float main_l = textureLod(TEXTURE, UV + l, rim_lod).a;
	float main_d = textureLod(TEXTURE, UV - l, rim_lod).a;
	float lit = 1.0 - mix(main_l, max(main_l, textureLod(back_tex, UV + l, rim_lod).a), v_layer);
	float dark = 1.0 - mix(main_d, max(main_d, textureLod(back_tex, UV - l, rim_lod).a), v_layer);
	float rimc = clamp(lit * 1.4 - 0.1, 0.0, 1.0);
	float shadow = clamp(dark * 1.2, 0.0, 1.0) * (1.0 - rimc);
	float ground = smoothstep(0.62, 1.0, UV.y);
	c.rgb *= 1.0 - shade_strength * shadow - ground_shade * ground;
	vec3 rim_col = mix(light_color.rgb, light_color.rgb * ambient.rgb, 0.5);
	// Luce aggiunta in proporzione al colore (un guanto nero resta scuro, la stoffa chiara brilla),
	// con un minimo perché anche il nero mostri il filo di luce.
	c.rgb += rim_col * rim_strength * rimc * (0.2 + 0.8 * c.rgb);
	c.rgb = mix(c.rgb, c.rgb * ambient.rgb, ambient_amount);

	c.rgb = mix(c.rgb, flash_color.rgb, flash * step(FLASH_MIN_ALPHA, c.a));
	COLOR = c * v_color;
}
