// canvas_env_reflect — Claude Code per "Ferruccio".
// Scopo: pavimento bagnato (Corso Trieste): specchia ciò che sta sopra la linea del pavimento,
//        con increspature della pioggia, sfocatura crescente e scurimento della pietra bagnata.
// Pipeline: Godot 4.6 Compatibility (GLES3), ColorRect sopra il terreno e sotto i personaggi.
//           Legge lo schermo già disegnato (sfondi, lampioni, pietra): i personaggi non si specchiano.
// Budget: 2 letture dello schermo per pixel su una fascia bassa; blend premoltiplicato.
shader_type canvas_item;
render_mode blend_premul_alpha;

uniform sampler2D screen_tex : hint_screen_texture, filter_linear_mipmap;

group_uniforms look;
uniform vec4 tint : source_color = vec4(0.8, 0.85, 1.0, 1.0);
// Quanta luce riflessa si somma alla pietra.
uniform float strength : hint_range(0.0, 2.0) = 0.6;
// Quanto la pietra bagnata si scurisce.
uniform float wet : hint_range(0.0, 1.0) = 0.3;
// Altezza del rettangolo in UV di schermo (impostata da backdrop.gd in base allo zoom).
uniform float height_uv = 0.1;
group_uniforms;

group_uniforms ripples;
uniform float ripple : hint_range(0.0, 0.02) = 0.004;
uniform float ripple_freq = 0.09;
// Livello di mipmap della lettura: cresce allontanandosi dalla linea del pavimento.
uniform float blur = 1.0;
group_uniforms;

varying vec2 wpos;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy;
}

void fragment() {
	float floor_uv = SCREEN_UV.y - UV.y * height_uv;
	float dist = SCREEN_UV.y - floor_uv;
	float wave = sin(wpos.y * 0.9 + TIME * 3.1 + sin(wpos.x * ripple_freq + TIME * 1.7) * 2.0);
	vec2 suv = vec2(SCREEN_UV.x + wave * ripple * (0.3 + UV.y), floor_uv - dist * 1.6);
	vec3 refl = textureLod(screen_tex, suv, blur + UV.y * 2.5).rgb;
	refl = max(refl - vec3(0.05), vec3(0.0)) * 1.25;
	float fade = pow(1.0 - UV.y, 1.6) * smoothstep(0.0, 0.06, UV.y + 0.02);
	vec3 add = refl * tint.rgb * strength * fade;
	COLOR = vec4(add, wet * fade);
}
