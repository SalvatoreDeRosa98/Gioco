/**
 * motore/interfaccia/ripresa.js — Pannello DOM MINIMALE «Continua» (storia 030, ADR-0006).
 *
 * Non è grafica definitiva: nell'hub, se nello slot c'è una notte salvata, un pannello con il titolo
 * (notte e piano della notte interrotta) e due bottoni: «Continua» (rigenera la notte dal seme e
 * ripristina stanza, maschere, doni e monete: `notteSalvata.riprendi`) e «Lascia andare» (cancella la
 * notte salvata e si resta nell'hub). Testi da `contenuti/interfaccia.json › ripresa`. I bottoni rispondono
 * al click; `continua()` e `lascia()` sono anche chiamabili (debug e test). Visibile solo quando `visibile()`
 * è vero (l'hub attivo) e c'è una notte salvata. Dipendenze: solo il DOM iniettato e `riempi`.
 */

import { riempi } from './banchetto.js';

/**
 * @param {{
 *   documento: Document, contenitore: HTMLElement,
 *   testi: { ripresa: { titolo: string, continua: string, lascia: string } },
 *   notteSalvata: { presente: boolean, carica: () => (object | null), cancella: (motivo?: string) => void },
 *   visibile: () => boolean,
 *   suContinua: () => unknown,          gancio della radice di composizione: riprende la notte
 *   motivoLasciata?: string
 * }} o
 */
export function creaInterfacciaRipresa({ documento, contenitore, testi, notteSalvata, visibile, suContinua, motivoLasciata = 'lasciata' }) {
  if (!documento || !contenitore || !testi?.ripresa || !notteSalvata || typeof visibile !== 'function' || typeof suContinua !== 'function') {
    throw new TypeError('creaInterfacciaRipresa: dipendenze mancanti');
  }
  const T = testi.ripresa;
  const radice = documento.createElement('div');
  radice.className = 'ripresa';
  radice.hidden = true;
  const titolo = documento.createElement('p');
  titolo.className = 'ripresa-titolo';
  const bottoni = documento.createElement('div');
  bottoni.className = 'ripresa-bottoni';
  const bContinua = documento.createElement('button');
  bContinua.type = 'button';
  bContinua.className = 'ripresa-continua';
  bContinua.textContent = T.continua;
  const bLascia = documento.createElement('button');
  bLascia.type = 'button';
  bLascia.className = 'ripresa-lascia';
  bLascia.textContent = T.lascia;
  bottoni.append(bContinua, bLascia);
  radice.append(titolo, bottoni);
  contenitore.append(radice);
  let dati = null;

  /** «Continua»: riprende la notte salvata (falso se non c'è). */
  function continua() {
    if (!notteSalvata.presente) return false;
    const esito = suContinua();
    return esito !== false;
  }

  /** «Lascia andare»: cancella la notte salvata. */
  function lascia() {
    if (!notteSalvata.presente) return false;
    notteSalvata.cancella(motivoLasciata);
    return true;
  }

  bContinua.addEventListener('click', (e) => { e?.preventDefault?.(); continua(); });
  bLascia.addEventListener('click', (e) => { e?.preventDefault?.(); lascia(); });

  /** Allinea il DOM (chiamata a ogni disegno). */
  function aggiorna() {
    const mostra = visibile() && notteSalvata.presente;
    if (!mostra) {
      radice.hidden = true;
      dati = null;
      return;
    }
    if (radice.hidden || !dati) dati = notteSalvata.carica();
    radice.hidden = !dati;
    if (dati) titolo.textContent = riempi(T.titolo, { piano: dati.piano, notte: dati.notte ?? '' });
  }

  /** Stato del DOM per i test, o null se nascosto. */
  function stato() {
    if (radice.hidden) return null;
    return { titolo: titolo.textContent, continua: bContinua.textContent, lascia: bLascia.textContent, piano: dati?.piano ?? null, stanza: dati?.stanza ?? null };
  }

  return { aggiorna, stato, continua, lascia, radice };
}
