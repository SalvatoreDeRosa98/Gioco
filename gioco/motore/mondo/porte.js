/**
 * motore/mondo/porte.js — Le porte della stanza (Core, stanze-porte.md regole 5-7, tabella «Stato della porta»).
 *
 * Macchina a stati con tabella esplicita: aperta → chiudendo → chiusa → aprendo → aperta (più
 * chiudendo → aperta quando la chiusura è annullata perché Ferruccio esce prima). La porta chiusa è
 * un muro: il suo `solido` espone `ferma_passo`/`ferma_colpi` come getter, così `fisica.js` la
 * tratta come qualunque rettangolo senza sapere che cambia stato. «Già solida a metà corsa»: in
 * `chiudendo` diventa solida a progresso ≥ 0,5, in `aprendo` torna passabile a progresso ≥ 0,5.
 * Edge case «Ferruccio sulla cella di una porta quando deve chiudersi»: la chiusura richiesta
 * aspetta che la cella sia libera (`tick(occupata)`).
 *
 * Nessun numero di gioco: `t_anim_porta` arriva da `stanze.json` via `parametri`.
 */

import { cerchioInRettangolo } from './fisica.js';

/** Stati della porta. */
export const STATI_PORTA = Object.freeze(['aperta', 'chiudendo', 'chiusa', 'aprendo']);

/** Transizioni ammesse. */
export const TRANSIZIONI_PORTA = Object.freeze({
  aperta: Object.freeze(['chiudendo']),
  chiudendo: Object.freeze(['chiusa', 'aperta']),
  chiusa: Object.freeze(['aprendo']),
  aprendo: Object.freeze(['aperta']),
});

/**
 * Crea una porta.
 * @param {{
 *   slot: string, lato: 'N'|'E'|'S'|'W', verso: string,
 *   rett: { x: number, y: number, w: number, h: number },
 *   tempo: { ticksDaMs: (ms: number) => number },
 *   parametri: { get: (chiave: string) => any },
 *   eventi?: { emit: (nome: string, payload?: unknown) => unknown },
 *   stanza?: string
 * }} o `verso` è l'id della stanza di destinazione; `rett` la cella della porta nel muro
 */
export function creaPorta({ slot, lato, verso, rett, tempo, parametri, eventi = null, stanza = null }) {
  if (!slot || !lato || !rett || !tempo || !parametri) throw new TypeError('creaPorta: dipendenze mancanti');
  const p = {
    stato: 'aperta',
    ticks: 0,
    totale: 0,
    richiesta: null, // 'chiudi' in attesa che la cella sia libera
  };

  function vai(nuovo) {
    if (p.stato === nuovo) return;
    if (!TRANSIZIONI_PORTA[p.stato].includes(nuovo)) throw new RangeError(`porta ${slot}: transizione non ammessa ${p.stato} -> ${nuovo}`);
    p.stato = nuovo;
    eventi?.emit('porta.stato', { stanza, slot, lato, stato: nuovo });
  }

  function avviaAnimazione(nuovo) {
    vai(nuovo);
    p.totale = tempo.ticksDaMs(parametri.get('stanze.t_anim_porta'));
    p.ticks = p.totale;
  }

  /** Progresso dell'animazione in corso, 0..1 (1 negli stati fermi). */
  function progresso() {
    if (p.stato === 'aperta' || p.stato === 'chiusa' || p.totale === 0) return 1;
    return 1 - p.ticks / p.totale;
  }

  /** Vero se si può passare (regola 5 e «solida a metà corsa»). */
  function passabile() {
    switch (p.stato) {
      case 'aperta': return true;
      case 'chiusa': return false;
      case 'chiudendo': return progresso() < 0.5;
      case 'aprendo': return progresso() >= 0.5;
      default: return false;
    }
  }

  /** Chiede la chiusura: parte al primo tick in cui la cella è libera. */
  function chiudi() {
    if (p.stato === 'aperta') p.richiesta = 'chiudi';
  }

  /** Riapre (da chiusa) o annulla una chiusura in corso. */
  function apri() {
    p.richiesta = null;
    if (p.stato === 'chiusa') avviaAnimazione('aprendo');
    else if (p.stato === 'chiudendo') vai('aperta');
  }

  /** Annulla la chiusura richiesta o in corso (Ferruccio è uscito prima). */
  function annulla() {
    p.richiesta = null;
    if (p.stato === 'chiudendo') vai('aperta');
  }

  /**
   * Avanza di un tick.
   * @param {boolean} occupata vero se Ferruccio occupa (anche in parte) la cella della porta
   */
  function tick(occupata = false) {
    if (p.richiesta === 'chiudi' && p.stato === 'aperta' && !occupata) {
      p.richiesta = null;
      avviaAnimazione('chiudendo');
      return; // il primo passo dell'animazione è nel tick successivo
    }
    if (p.stato === 'chiudendo' || p.stato === 'aprendo') {
      p.ticks -= 1;
      if (p.ticks <= 0) {
        p.ticks = 0;
        vai(p.stato === 'chiudendo' ? 'chiusa' : 'aperta');
      }
    }
  }

  /**
   * Vero se il cerchio tocca la cella della porta.
   * @param {{ x: number, y: number, r: number }} cerchio
   */
  function occupataDa(cerchio) {
    return cerchioInRettangolo(cerchio.x, cerchio.y, cerchio.r, rett);
  }

  const solido = {
    id: 'porta',
    slot,
    lato,
    x: rett.x,
    y: rett.y,
    w: rett.w,
    h: rett.h,
    get ferma_passo() { return !passabile(); },
    get ferma_colpi() { return !passabile(); },
  };

  return {
    slot,
    lato,
    verso,
    rett,
    solido,
    get stato() { return p.stato; },
    get richiestaChiusura() { return p.richiesta === 'chiudi'; },
    get centro() { return { x: rett.x + rett.w / 2, y: rett.y + rett.h / 2 }; },
    progresso,
    passabile,
    chiudi,
    apri,
    annulla,
    tick,
    occupataDa,
  };
}
