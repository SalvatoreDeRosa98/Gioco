/**
 * motore/resa/fili.js — I fili d'oro del Velo (regola dell'autore, 2026-11-09).
 *
 * Ogni marionetta mossa dal Velo (tutti i nemici, i boss dei piani, gli NPC dell'hub; MAI Ferruccio e i
 * personaggi giocabili, che hanno spezzato i fili) ha SEMPRE DUE fili: uno che scende dalla Mano sinistra e
 * uno dalla Mano destra delle Grandi Mani, attaccati a due punti distinti del corpo (le spalle: all'altezza
 * `resa.fili.ancoraggio_y` del corpo contata dai piedi — l'ancora degli sprite è ai piedi — e scostati ai lati
 * di `resa.fili.scarto_x` della mezza larghezza). Il filo è una linea di `resa.fili.spessore` px, oro al
 * `resa.fili.alpha` di opacità, con una leggera curva quadratica verso il basso (freccia `resa.fili.curva_px`):
 * niente alone, niente tratteggio, niente lampo.
 *
 * Modulo puro di `resa/`: calcola punti e disegna sul contesto che riceve; legge i parametri e non muta nulla
 * dello stato di gioco. Nessun numero di gioco nel codice: tutto in `contenuti/parametri/resa.json`.
 */

/**
 * @typedef {{ x: number, piedi: number, altezza: number, mezzaLarghezza: number }} CorpoMarionetta
 *  `x` centro orizzontale, `piedi` la y dell'ancora ai piedi, `altezza` del corpo in px, `mezzaLarghezza` in px.
 */

/**
 * Crea il disegnatore dei fili.
 * @param {{ parametri: { get: (percorso: string) => any }, colore?: string }} o
 *  `colore` è il colore del filo (oro del tema); i numeri vengono tutti da `resa.fili.*`.
 */
export function creaFili({ parametri, colore = '#000' }) {
  if (!parametri) throw new TypeError('creaFili: manca `parametri`');
  const R = (chiave) => parametri.get(`resa.fili.${chiave}`);

  /**
   * I due punti d'attacco dei fili sul corpo: spalla sinistra e spalla destra (in coordinate del corpo).
   * @param {CorpoMarionetta} corpo
   * @returns {{ sinistro: [number, number], destro: [number, number] }}
   */
  function attacchi(corpo) {
    const y = corpo.piedi - corpo.altezza * R('ancoraggio_y');
    const dx = corpo.mezzaLarghezza * R('scarto_x');
    return { sinistro: [corpo.x - dx, y], destro: [corpo.x + dx, y] };
  }

  /**
   * Disegna un filo da una mano a un punto del corpo: curva quadratica con il punto di controllo
   * sotto il centro della corda (il filo pende), 1 px, oro quasi trasparente, senza ombra né tratteggio.
   * @param {CanvasRenderingContext2D} ctx
   * @param {[number, number]} da   punto della mano
   * @param {[number, number]} a    punto del corpo
   */
  function disegnaFilo(ctx, da, a) {
    const [ax, ay] = da;
    const [bx, by] = a;
    ctx.save();
    ctx.globalAlpha = R('alpha');
    ctx.strokeStyle = colore;
    ctx.lineWidth = R('spessore');
    ctx.lineCap = 'butt';
    ctx.shadowBlur = 0;
    if (typeof ctx.setLineDash === 'function') ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + R('curva_px'), bx, by);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Disegna i DUE fili di una marionetta: dalla Mano sinistra alla spalla sinistra e dalla Mano destra
   * alla spalla destra. Ritorna quanti fili ha disegnato (sempre 2).
   * @param {CanvasRenderingContext2D} ctx
   * @param {{ sinistra: [number, number], destra: [number, number] }} mani  punti delle due Mani
   * @param {CorpoMarionetta} corpo
   */
  function disegnaMarionetta(ctx, mani, corpo) {
    const a = attacchi(corpo);
    disegnaFilo(ctx, mani.sinistra, a.sinistro);
    disegnaFilo(ctx, mani.destra, a.destro);
    return 2;
  }

  /** I parametri in uso (lettura di QA): alpha, spessore, ancoraggio_y, scarto_x, curva_px. */
  function valori() {
    return { alpha: R('alpha'), spessore: R('spessore'), ancoraggio_y: R('ancoraggio_y'), scarto_x: R('scarto_x'), curva_px: R('curva_px') };
  }

  return Object.freeze({ attacchi, disegnaFilo, disegnaMarionetta, valori });
}
