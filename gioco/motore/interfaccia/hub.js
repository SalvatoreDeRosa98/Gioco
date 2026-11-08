/**
 * motore/interfaccia/hub.js — Interfaccia DOM MINIMALE dell'hub (storia 029).
 *
 * Non è grafica definitiva (il renderer vero aspetta l'approvazione dell'autore): un cartellino con il
 * numero della notte e, quando Ferruccio è vicino a un NPC presente, il suggerimento per parlargli;
 * davanti all'ingresso, il suggerimento della partenza. Testi da `contenuti/interfaccia.json › hub`
 * ({n}, {tasto}, {nome}, {piano} sono segnaposto); nomi degli NPC da storia.json via `nomeDi`.
 * Visibile solo quando l'hub è attivo. Dipendenze: solo il DOM iniettato e `riempi` di interfaccia/banchetto.js.
 */

import { riempi } from './banchetto.js';

/**
 * @param {{
 *   documento: Document, contenitore: HTMLElement,
 *   testi: { hub: { notte: string, parla: string, parti: string } },
 *   hub: () => (object | null),            l'hub (mondo/hub.js) o null
 *   nomeDi: (personaggio: string) => string,
 *   tastoInteragisci: () => string,
 *   ferruccio: { x: number, y: number, r: number }
 * }} o
 */
export function creaInterfacciaHub({ documento, contenitore, testi, hub, nomeDi, tastoInteragisci, ferruccio }) {
  if (!documento || !contenitore || !testi?.hub || typeof hub !== 'function' || !ferruccio) throw new TypeError('creaInterfacciaHub: dipendenze mancanti');
  const T = testi.hub;
  const radice = documento.createElement('div');
  radice.className = 'hub-cartellino';
  radice.hidden = true;
  const notte = documento.createElement('div');
  notte.className = 'hub-notte';
  const suggerimento = documento.createElement('div');
  suggerimento.className = 'hub-suggerimento';
  radice.append(notte, suggerimento);
  contenitore.append(radice);

  /** Vero se il corpo di Ferruccio tocca la cella dell'ingresso. */
  function davantiAllIngresso(h) {
    const i = h.ingresso;
    if (!i) return false;
    const cx = Math.max(i.x, Math.min(ferruccio.x, i.x + i.w));
    const cy = Math.max(i.y, Math.min(ferruccio.y, i.y + i.h));
    return Math.hypot(cx - ferruccio.x, cy - ferruccio.y) <= ferruccio.r * 2;
  }

  /** Allinea il DOM allo stato dell'hub (chiamata a ogni disegno). */
  function aggiorna() {
    const h = hub();
    if (!h || !h.attivo) {
      radice.hidden = true;
      return;
    }
    radice.hidden = false;
    notte.textContent = riempi(T.notte, { n: h.notte() });
    const v = h.vicino();
    if (v) suggerimento.textContent = riempi(T.parla, { tasto: tastoInteragisci(), nome: nomeDi(v.personaggio ?? v.id) });
    else if (davantiAllIngresso(h)) suggerimento.textContent = riempi(T.parti, { piano: h.piano });
    else suggerimento.textContent = '';
  }

  /** Stato del DOM per i test, o null se nascosto. */
  function stato() {
    if (radice.hidden) return null;
    return { notte: notte.textContent, suggerimento: suggerimento.textContent };
  }

  return { aggiorna, stato, radice };
}
