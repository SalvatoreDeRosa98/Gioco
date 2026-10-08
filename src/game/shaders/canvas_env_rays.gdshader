// canvas_env_rays — Claude Code per "Ferruccio".
// Scopo: luce volumetrica finta: fasci che partono da una sorgente (finestre della Reggia, sole
//        dell'alba, luna tra le chiome) o cono di un lampione, con pioggia che attraversa la luce.
// Pipeline: Godot 4.6 Compatibility (GLES3), ColorRect additivo dentro uno strato di parallasse.
// Budget: nessuna texture; 2 rumori 1D + poche operazioni per pixel. Non è un effetto a schermo intero.
shader_type canvas_item;
render_mode blend_add;

group_uniforms look;
uniform vec4 color : source_color = vec4(1.0, 0.85, 0.6, 1.0);
uniform float intensity : hint_range(0.0, 2.0) = 0.3;
// Dimensioni del rettangolo in unità di mondo (servono a non deformare i fasci).
uniform vec2 size = vec2(1000.0, 800.0);
// Sorgente in UV del rettangolo: può stare fuori (y negativa = sopra il bordo alto).
uniform vec2 origin = vec2(0.3, -1.0);
group_uniforms;

group_uniforms beams;
// Numero di fasci per unità di tangente: più alto = fasci più fitti e sottili.
uniform float density = 6.0;
// Esponente del contrasto tra fasci e vuoti.
uniform float sharpness : hint_range(0.5, 6.0) = 2.2;
// Quanto i fasci sono pieni anche nei vuoti (0 = solo fasci, 1 = luce uniforme).
uniform float floor_light : hint_range(0.0, 1.0) = 0.15;
uniform float speed = 0.04;
// Frazione del rettangolo usata per sfumare in alto e ai lati.
uniform float fade_top : hint_range(0.0, 1.0) = 0.08;
uniform float fade_side : hint_range(0.0, 0.5) = 0.2;
// Esponente della caduta verso il basso (luce che si disperde lontano dalla sorgente).
uniform float falloff = 1.3;
// Semi-ampiezza del cono come tangente dell'angolo; 0 = nessun cono (fasci liberi).
uniform float cone = 0.0;
group_uniforms;

group_uniforms rain;
// Gocce di pioggia illuminate dentro la luce (0 = niente).
uniform float streaks : hint_range(0.0, 2.0) = 0.0;
uniform float streak_slant = 0.18;
group_uniforms;

// Larghezza delle colonne di pioggia (unità) e lunghezza minima/variabile delle gocce.
const float STREAK_COL = 5.0;
const float STREAK_LEN = 70.0;
const float STREAK_LEN_VAR = 50.0;
// Le gocce si vedono solo nel 40% delle colonne.
const float STREAK_CHANCE = 0.6;
// Pesi dei due rumori che compongono i fasci.
const float BEAM_A = 0.65;
const float BEAM_B = 0.35;

float hash1(float n) {
	return fract(sin(n * 127.1) * 43758.5453);
}

float noise1(float x) {
	float i = floor(x);
	float f = fract(x);
	f = f * f * (3.0 - 2.0 * f);
	return mix(hash1(i), hash1(i + 1.0), f);
}

void fragment() {
	vec2 p = UV * size;
	vec2 d = p - origin * size;
	// Tangente dell'angolo rispetto alla verticale della sorgente: fasci a ventaglio.
	float u = d.x / max(d.y, 1.0);
	float a = u * density;
	float b = noise1(a + TIME * speed) * BEAM_A + noise1(a * 2.7 - TIME * speed * 1.6 + 13.0) * BEAM_B;
	b = mix(floor_light, 1.0, pow(clamp(b, 0.0, 1.0), sharpness));

	float y = UV.y;
	float fall = smoothstep(0.0, fade_top, y) * pow(1.0 - y, falloff);
	float side = smoothstep(0.0, fade_side, UV.x) * smoothstep(1.0, 1.0 - fade_side, UV.x);
	// Senza ramificazioni: il cono vale solo se cone > 0.
	float cone_m = mix(1.0, smoothstep(cone, cone * 0.45, abs(u)), step(0.0001, cone));
	// Respiro lento della luce (nuvole che passano davanti alla sorgente).
	float breathe = 0.82 + 0.18 * noise1(TIME * 0.35 + origin.x * 10.0);
	float k = b * fall * side * cone_m * breathe * intensity;

	// Gocce: colonne inclinate, ognuna con lunghezza e velocità proprie (streaks = 0 le spegne).
	float sx = p.x - p.y * streak_slant;
	float h = hash1(floor(sx / STREAK_COL));
	float v = fract(p.y / (STREAK_LEN + h * STREAK_LEN_VAR) - TIME * (9.0 + h * 5.0) + h * 17.0);
	float drop = smoothstep(0.0, 0.04, v) * smoothstep(0.3, 0.06, v) * step(STREAK_CHANCE, h);
	float thin = smoothstep(2.5, 0.5, abs(fract(sx / STREAK_COL) - 0.5) * STREAK_COL);
	k += drop * thin * streaks * fall * cone_m * intensity * 2.5;
	COLOR = vec4(color.rgb, clamp(k, 0.0, 1.0));
}
