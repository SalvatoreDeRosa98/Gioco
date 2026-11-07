/**
 * motore/mondo/camera.js — Camera senza scorrimento dentro la stanza e transizione tra stanze (Core).
 *
 * Architettura §4b e storia 015: la camera inquadra sempre la stanza intera (pilastro 1). Per le
 * stanze 1x1 la scala è 1; per le doppie 2x1 (e le arene) riduce la scala con il fattore
 * `min(1, L/larghezza, (A − margine_hud)/altezza)`, dove L×A è la risoluzione logica e
 * `margine_hud` lo spazio riservato all'HUD. La transizione è uno scorrimento di `t_transizione`
 * (250 ms) nella direzione della porta: la nuova stanza entra dal lato verso cui si va. Durante la
 * transizione `inTransizione` è vero e la notte ignora l'input (notte.js).
 *
 * Modulo di logica pura (conta i tick, non disegna): `applica(ctx)` imposta solo la trasformazione
 * del contesto per chi disegna la stanza. Nessun numero di gioco: `stanze.camera.*`.
 */

import { VERSO_LATO } from './modelli.js';

/**
 * @param {{
 *   parametri: { get: (chiave: string) => any },
 *   tempo: { ticksDaMs: (ms: number) => number },
 *   scena: { larghezza: number, altezza: number },
 *   eventi?: { emit: (nome: string, payload?: unknown) => unknown }
 * }} o
 */
export function creaCamera({ parametri, tempo, scena, eventi = null }) {
  if (!parametri || !tempo || !scena) throw new TypeError('creaCamera: dipendenze mancanti');
  const c = { scala: 1, lato: null, ticks: 0, totale: 0 };

  /**
   * Fattore di scala per un'area calpestabile di `larghezza`×`altezza` px (mai sopra 1).
   * @param {number} larghezza
   * @param {number} altezza
   */
  function scalaPer(larghezza, altezza) {
    const margine = parametri.get('stanze.camera.margine_hud');
    return Math.min(1, scena.larghezza / larghezza, (scena.altezza - margine) / altezza);
  }

  /**
   * Inquadra un campo: fissa la scala per la stanza corrente.
   * @param {{ larghezza: number, altezza: number }} campo
   */
  function inquadra(campo) {
    c.scala = scalaPer(campo.larghezza, campo.altezza);
  }

  /**
   * Avvia lo scorrimento verso il lato dato.
   * @param {'N'|'E'|'S'|'W'} lato
   */
  function avviaTransizione(lato) {
    if (!VERSO_LATO[lato]) throw new RangeError(`camera: lato sconosciuto '${lato}'`);
    c.lato = lato;
    c.totale = tempo.ticksDaMs(parametri.get('stanze.camera.t_transizione'));
    c.ticks = c.totale;
    eventi?.emit('camera.transizione', { lato, fase: 'inizio' });
  }

  /** Avanza di un tick; a fine corsa emette `camera.transizione` {fase: 'fine'}. */
  function tick() {
    if (c.ticks <= 0) return;
    c.ticks -= 1;
    if (c.ticks === 0) {
      eventi?.emit('camera.transizione', { lato: c.lato, fase: 'fine' });
      c.lato = null;
    }
  }

  function inTransizione() {
    return c.ticks > 0;
  }

  /** Progresso della transizione 0..1 (1 se ferma). */
  function progresso() {
    return c.totale === 0 || c.ticks === 0 ? 1 : 1 - c.ticks / c.totale;
  }

  /** Spostamento (px logici) da applicare alla stanza che entra: parte fuori schermo dal lato di marcia. */
  function scorrimento() {
    if (!inTransizione() || !c.lato) return { x: 0, y: 0 };
    const v = VERSO_LATO[c.lato];
    const k = 1 - progresso();
    return { x: v.x * scena.larghezza * k, y: v.y * scena.altezza * k };
  }

  /**
   * Imposta sul contesto la trasformazione della stanza: scorrimento, poi scala attorno al centro
   * della scena. Chi chiama fa `save`/`restore`.
   * @param {CanvasRenderingContext2D} ctx
   */
  function applica(ctx) {
    const cx = scena.larghezza / 2;
    const cy = scena.altezza / 2;
    const s = scorrimento();
    ctx.translate(cx + s.x, cy + s.y);
    ctx.scale(c.scala, c.scala);
    ctx.translate(-cx, -cy);
  }

  return {
    get scala() { return c.scala; },
    get lato() { return c.lato; },
    get inTransizione() { return inTransizione(); },
    scalaPer,
    inquadra,
    avviaTransizione,
    tick,
    progresso,
    scorrimento,
    applica,
  };
}
