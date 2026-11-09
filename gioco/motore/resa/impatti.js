/**
 * motore/resa/impatti.js — Effetti visivi transitori del combattimento, guidati dagli eventi (storia P12, passo F4).
 *
 * Regola del motore «lo stato non disegna, la resa non muta»: `attori/combattimento.js` manipola solo numeri ed
 * emette eventi; i fotogrammi li deriva questo modulo di `resa/`. Tre cose, tutte dati di `resa.json › impatti`:
 *  - **splash dei proiettili**: a `ferruccio.proiettile_spento` {x, y, tipo, causa} nasce un impatto che mostra
 *    `nSplash` fotogrammi (gli sprite `splash0..n-1` del renderer) di `impatti.splash_frame_ticks` tick ciascuno;
 *  - **fulmini a catena** (Catena della Chiusa): a `ferruccio.fulmine` {x1, y1, x2, y2} un segmento che sfuma in
 *    `impatti.fulmine_ticks` tick (alpha = 1 − età/durata);
 *  - **fotogramma dello stocco**: `frameSpada(combattimento)` legge `stato`, `fase` e `faseTicks` (numeri dello
 *    stato) e dà l'indice 0..5 del fotogramma secondo le soglie `impatti.spada_startup_ticks`, `spada_attivo_ticks`,
 *    `spada_recupero_ticks`.
 * L'orologio è il contatore dei tick del ciclo (`contaTick`): l'animazione segue la simulazione (hit-stop compreso),
 * non il refresh dello schermo. Il modulo legge e non muta nulla dello stato. Nessun numero di gioco nel codice.
 */

/**
 * Crea il registro degli impatti.
 * @param {{
 *   parametri: { get: (percorso: string) => any },
 *   eventi?: { on: (nome: string, fn: Function) => any } | null,
 *   contaTick?: () => number,
 *   nSplash: number
 * }} o `nSplash` è il numero di fotogrammi dello splash disponibili nel renderer
 * @returns {{
 *   splash: () => { x: number, y: number, tipo: string, causa: string, frame: number }[],
 *   fulmini: () => { x1: number, y1: number, x2: number, y2: number, alpha: number }[],
 *   frameSpada: (combattimento: { stato: string, fase: string | null, faseTicks?: number } | null) => number,
 *   conteggio: () => { splash: number, fulmini: number }
 * }}
 */
export function creaImpatti({ parametri, eventi = null, contaTick = () => 0, nSplash }) {
  if (!parametri) throw new TypeError('creaImpatti: manca `parametri`');
  if (!(nSplash >= 1)) throw new RangeError('creaImpatti: `nSplash` deve essere almeno 1');
  const R = (chiave) => parametri.get(`resa.impatti.${chiave}`);

  /** @type {{ x: number, y: number, tipo: string, causa: string, tick0: number }[]} */
  const splashAttivi = [];
  /** @type {{ x1: number, y1: number, x2: number, y2: number, tick0: number }[]} */
  const fulminiAttivi = [];

  if (eventi) {
    eventi.on('ferruccio.proiettile_spento', (ev) => {
      if (!ev || !Number.isFinite(ev.x) || !Number.isFinite(ev.y)) return;
      splashAttivi.push({ x: ev.x, y: ev.y, tipo: ev.tipo ?? 'base', causa: ev.causa ?? '', tick0: contaTick() });
    });
    eventi.on('ferruccio.fulmine', (ev) => {
      if (!ev || ![ev.x1, ev.y1, ev.x2, ev.y2].every(Number.isFinite)) return;
      fulminiAttivi.push({ x1: ev.x1, y1: ev.y1, x2: ev.x2, y2: ev.y2, tick0: contaTick() });
    });
  }

  /** Durata totale dello splash in tick: fotogrammi × tick per fotogramma. */
  function durataSplash() {
    return nSplash * Math.max(1, R('splash_frame_ticks'));
  }

  /**
   * Splash vivi con il fotogramma da disegnare; quelli finiti escono dal registro.
   * @returns {{ x: number, y: number, tipo: string, causa: string, frame: number }[]}
   */
  function splash() {
    const ora = contaTick();
    const perFrame = Math.max(1, R('splash_frame_ticks'));
    const durata = durataSplash();
    const fuori = [];
    for (let i = splashAttivi.length - 1; i >= 0; i--) {
      const eta = ora - splashAttivi[i].tick0;
      if (eta >= durata) splashAttivi.splice(i, 1);
    }
    for (const s of splashAttivi) {
      const eta = Math.max(0, ora - s.tick0);
      fuori.push({ x: s.x, y: s.y, tipo: s.tipo, causa: s.causa, frame: Math.min(nSplash - 1, Math.floor(eta / perFrame)) });
    }
    return fuori;
  }

  /**
   * Fulmini vivi con l'alpha con cui disegnarli; quelli finiti escono dal registro.
   * @returns {{ x1: number, y1: number, x2: number, y2: number, alpha: number }[]}
   */
  function fulmini() {
    const ora = contaTick();
    const durata = Math.max(1, R('fulmine_ticks'));
    for (let i = fulminiAttivi.length - 1; i >= 0; i--) {
      if (ora - fulminiAttivi[i].tick0 >= durata) fulminiAttivi.splice(i, 1);
    }
    return fulminiAttivi.map((f) => ({ x1: f.x1, y1: f.y1, x2: f.x2, y2: f.y2, alpha: 1 - Math.max(0, ora - f.tick0) / durata }));
  }

  /**
   * Indice del fotogramma dello stocco (0 = fermo) dai numeri del combattimento.
   * @param {{ stato: string, fase: string | null, faseTicks?: number } | null} c
   * @returns {number} 0..5
   */
  function frameSpada(c) {
    if (!c || c.stato !== 'fendente') return 0;
    const t = Number.isFinite(c.faseTicks) ? c.faseTicks : 0;
    if (c.fase === 'startup') return t > R('spada_startup_ticks') ? 0 : 1;
    if (c.fase === 'attivo') return t > R('spada_attivo_ticks') ? 2 : 3;
    return t > R('spada_recupero_ticks') ? 4 : 5;
  }

  /** Quanti effetti sono nel registro (lettura di QA; non pota gli scaduti). */
  function conteggio() {
    return { splash: splashAttivi.length, fulmini: fulminiAttivi.length };
  }

  return { splash, fulmini, frameSpada, conteggio };
}
