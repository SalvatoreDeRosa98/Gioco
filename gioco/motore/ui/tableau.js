/**
 * motore/ui/tableau.js — Il tableau dei ricordi in DOM (GDD incontri-dialoghi.md regola 6 e formula
 * `durata_tableau`). Storia 027. Non è grafica definitiva: un velo a schermo intero di carta più chiara
 * (`.tableau`, stile in `stile/cartiglio.css`) con una sola voce (nome in maiuscoletto e testo) che resta
 * per `dialogo.durataMs` di tempo di gioco (≥ t_min) e poi si chiude da solo; dopo `t_min` si può anche
 * chiudere con `avanza`/`interagisci`/`conferma` o un click. Le sagome ferme dell'immagine le disegnerà il
 * renderer vero (qui il velo basta). Nessun testo e nessun numero nel codice.
 */

import { FASI } from '../storia/incontri.js';

/**
 * @param {{
 *   documento: Document, contenitore: HTMLElement,
 *   input: { premuto: (azione: string) => boolean },
 *   incontri: { dialogo: () => object | null },
 *   tMinMs: () => number
 * }} o
 */
export function creaTableau({ documento, contenitore, input, incontri, tMinMs }) {
  if (!documento || !contenitore || !input || !incontri || typeof tMinMs !== 'function') {
    throw new TypeError('creaTableau: dipendenze mancanti');
  }
  const radice = documento.createElement('section');
  radice.className = 'tableau';
  radice.hidden = true;
  const voce = documento.createElement('figure');
  voce.className = 'voce';
  const parlante = documento.createElement('figcaption');
  parlante.className = 'parlante';
  const testo = documento.createElement('p');
  testo.className = 'testo';
  voce.append(parlante, testo);
  radice.append(voce);
  contenitore.append(radice);

  let trascorsoMs = 0;
  let idAperto = null;
  let clicPendente = false;
  let firma = '';
  radice.addEventListener?.('click', () => { clicPendente = true; });

  /**
   * Un tick di tempo di gioco: conta la durata e chiude il tableau alla scadenza (o su avanzamento dopo t_min).
   * @param {number} dt secondi
   */
  function tick(dt) {
    const d = incontri.dialogo();
    if (!d || !d.tableau) {
      trascorsoMs = 0;
      idAperto = null;
      clicPendente = false;
      return;
    }
    if (idAperto !== d.id) {
      idAperto = d.id;
      trascorsoMs = 0;
    }
    trascorsoMs += dt * 1000;
    const vuole = input.premuto('avanza') || input.premuto('interagisci') || input.premuto('conferma') || clicPendente;
    clicPendente = false;
    if (trascorsoMs >= d.durataMs || (vuole && trascorsoMs >= tMinMs())) {
      // chiude tutte le battute del tableau in un colpo (una sola immagine, una sola voce)
      while (d.fase !== FASI.finito && d.avanza()) { /* avanza fino alla chiusura */ }
    }
  }

  /** Riscrive il DOM se qualcosa è cambiato. */
  function aggiorna() {
    const d = incontri.dialogo();
    const nuova = d?.tableau ? `${d.id}` : '';
    if (nuova === firma) return;
    firma = nuova;
    if (!d?.tableau) {
      radice.hidden = true;
      return;
    }
    const parlati = d.cartigli.filter((c) => !c.didascalia);
    parlante.textContent = parlati[0]?.nome ?? '';
    testo.textContent = d.voce();
    radice.hidden = false;
  }

  return {
    tick,
    aggiorna,
    disegna: aggiorna,
    /** Stato per debug e test o null. */
    stato: () => {
      const d = incontri.dialogo();
      if (!d?.tableau) return null;
      return { id: d.id, trascorsoMs, durataMs: d.durataMs, voce: d.voce(), parlante: parlante.textContent, nascosto: radice.hidden };
    },
    elementi: { radice, voce, parlante, testo },
  };
}
