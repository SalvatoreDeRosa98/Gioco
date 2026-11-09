/**
 * motore/attori/ia/sparo.js — Geometria pura dei colpi a distanza dei nemici alla Isaac (storia P05).
 *
 * Il Teatro (`teatro_marionette.html` ~4657-4712) ha tre tiratori: la **guardia** (doppietta di
 * moschetto: 2 colpi a ±0,12 rad mirati su Ferruccio), la **maschera** (Host: ventaglio di 3 colpi a
 * ±0,22 rad) e la **statua** (Stone Grimace: 4 croci fisse, salve alternate a `+` e `×`); la **bomba**
 * lancia 6 schegge radiali. Qui ci sono solo le direzioni: i numeri (`n_colpi`, `apertura_gradi`,
 * `croce`) arrivano dal blocco `sparo` della scheda in `nemici.json`, mai da costanti.
 * Il modulo non conosce nemici, proiettili né il campo: funzioni pure, testabili.
 */

const GRADI = Math.PI / 180;

/**
 * Direzioni unitarie di un ventaglio centrato su `direzione`, largo `aperturaGradi` in tutto
 * (n = 1 → la sola direzione; n = 2 → ±apertura/2; n = 3 → −apertura/2, 0, +apertura/2 …).
 * @param {{ x: number, y: number }} direzione verso del tiro (normalizzato qui)
 * @param {number} n numero di colpi (≥ 1)
 * @param {number} aperturaGradi apertura totale del ventaglio
 * @returns {{ x: number, y: number }[]}
 */
export function direzioniVentaglio(direzione, n, aperturaGradi) {
  const colpi = Math.max(1, Math.round(n));
  const l = Math.hypot(direzione.x, direzione.y) || 1;
  const base = Math.atan2(direzione.y / l, direzione.x / l);
  if (colpi === 1) return [{ x: Math.cos(base), y: Math.sin(base) }];
  const passo = (aperturaGradi * GRADI) / (colpi - 1);
  const inizio = base - (aperturaGradi * GRADI) / 2;
  const esito = [];
  for (let i = 0; i < colpi; i++) esito.push({ x: Math.cos(inizio + passo * i), y: Math.sin(inizio + passo * i) });
  return esito;
}

/**
 * Direzioni unitarie di una salva radiale di `n` colpi equidistanti (croce `+` con n = 4 e parità 0,
 * `×` con parità 1: la salva è ruotata di mezzo passo; schegge della bomba con n = 6).
 * @param {number} n colpi (≥ 1)
 * @param {number} [parita=0] 0 = allineata agli assi, 1 = ruotata di mezzo passo
 * @returns {{ x: number, y: number }[]}
 */
export function direzioniRadiali(n, parita = 0) {
  const colpi = Math.max(1, Math.round(n));
  const passo = (Math.PI * 2) / colpi;
  const base = parita % 2 === 1 ? passo / 2 : 0;
  const esito = [];
  for (let i = 0; i < colpi; i++) esito.push({ x: Math.cos(base + passo * i), y: Math.sin(base + passo * i) });
  return esito;
}

/**
 * Direzioni di una salva secondo il blocco `sparo` della scheda: croce (radiale, parità alternata)
 * oppure ventaglio mirato.
 * @param {{ n_colpi: number, apertura_gradi: number, croce: number }} sparo
 * @param {{ direzione: { x: number, y: number }, parita?: number }} o
 */
export function direzioniSalva(sparo, { direzione, parita = 0 }) {
  return sparo.croce > 0 ? direzioniRadiali(sparo.n_colpi, parita) : direzioniVentaglio(direzione, sparo.n_colpi, sparo.apertura_gradi);
}
