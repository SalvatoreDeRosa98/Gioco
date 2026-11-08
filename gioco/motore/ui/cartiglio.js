/**
 * motore/ui/cartiglio.js — Il cartiglio dei dialoghi in DOM (GDD incontri-dialoghi.md regole 4-5, 9;
 * ricordi-scelta.md regola 3). Storia 027. Non è grafica definitiva: elementi in `#interfaccia` con
 * classi semantiche e stile in `stile/cartiglio.css` (colori dai token; riferimento visivo
 * `design/mockup/teatro-delle-ombre.html`, il cartiglio scuro bordato d'oro).
 *
 * Mostra il dialogo corrente di `storia/incontri.js` quando NON è un tableau (quello è di `ui/tableau.js`):
 * una battuta alla volta; il nome del parlante in maiuscoletto (`.parlante`, CSS `font-variant: small-caps`);
 * le didascalie in corsivo senza nome (classe `didascalia`); il suggerimento CONTINUA; nella fase di scelta
 * le opzioni con etichetta e `cosa_sacrifica`, nessuna evidenziata per default, su/giù per selezionare e
 * `conferma` per decidere. Avanzamento con `avanza`/`interagisci`/`conferma` o con un click/tap sul
 * cartiglio, mai automatico, con antirimbalzo (`incontri.antirimbalzo` ms di tempo di gioco tra due
 * avanzamenti: il tasto che ha aperto il dialogo non lo fa avanzare). `indietro` salta un dialogo
 * saltabile. La pausa logica la fa la radice di composizione sugli eventi `incontri.avvio`/`incontri.fine`.
 * Testi delle etichette da `contenuti/interfaccia.json › incontri`; tutto il resto dal dialogo.
 */

import { FASI } from '../storia/incontri.js';

/**
 * @param {{
 *   documento: Document, contenitore: HTMLElement,
 *   testi: object,                                   contenuti/interfaccia.json
 *   input: { premuto: (azione: string) => boolean },
 *   incontri: { dialogo: () => object | null },
 *   antirimbalzoMs: () => number
 * }} o
 */
export function creaCartiglio({ documento, contenitore, testi, input, incontri, antirimbalzoMs }) {
  if (!documento || !contenitore || !testi || !input || !incontri || typeof antirimbalzoMs !== 'function') {
    throw new TypeError('creaCartiglio: dipendenze mancanti');
  }
  const T = testi.incontri ?? {};

  const radice = documento.createElement('aside');
  radice.className = 'cartiglio-scena';
  radice.hidden = true;
  const parlante = documento.createElement('h3');
  parlante.className = 'parlante';
  const battuta = documento.createElement('p');
  battuta.className = 'battuta';
  const opzioni = documento.createElement('ol');
  opzioni.className = 'opzioni';
  const suggerimento = documento.createElement('p');
  suggerimento.className = 'suggerimento';
  radice.append(parlante, battuta, opzioni, suggerimento);
  contenitore.append(radice);

  let daUltimoMs = 0;
  let clicPendente = false;
  let firma = '';
  radice.addEventListener?.('click', (e) => {
    const li = e.target?.closest?.('li.opzione');
    const d = incontri.dialogo();
    if (li && d?.fase === FASI.scelta) {
      const i = Number(li.dataset.indice);
      if (d.scelta.selezionata === i) clicPendente = true; // secondo click: conferma
      else d.seleziona(i);
      return;
    }
    clicPendente = true;
  });

  /** Vero se è passato l'antirimbalzo dall'ultimo avanzamento. */
  const libero = () => daUltimoMs >= antirimbalzoMs();

  /**
   * Un tick di tempo di gioco (gira anche in pausa): legge i fronti dell'input e avanza il dialogo.
   * @param {number} dt secondi
   */
  function tick(dt) {
    const d = incontri.dialogo();
    if (!d || d.tableau) {
      daUltimoMs = 0;
      clicPendente = false;
      return;
    }
    daUltimoMs += dt * 1000;
    const clic = clicPendente;
    clicPendente = false;
    const vuoleAvanzare = input.premuto('avanza') || input.premuto('interagisci') || clic;
    const vuoleConfermare = input.premuto('conferma');
    if (d.fase === FASI.scelta) {
      if (input.premuto('su') || input.premuto('sinistra')) d.seleziona(Math.max(0, (d.scelta.selezionata < 0 ? d.scelta.opzioni.length : d.scelta.selezionata) - 1));
      else if (input.premuto('giu') || input.premuto('destra')) d.seleziona(Math.min(d.scelta.opzioni.length - 1, d.scelta.selezionata + 1));
      // conferma con il tasto `conferma` o con un secondo click sull'opzione già selezionata
      if ((vuoleConfermare || clic) && libero() && d.scelta.selezionata >= 0) {
        d.scegli(d.scelta.selezionata);
        daUltimoMs = 0;
      }
      return;
    }
    if (input.premuto('indietro') && d.saltabile) {
      d.salta();
      daUltimoMs = 0;
      return;
    }
    if ((vuoleAvanzare || vuoleConfermare) && libero()) {
      d.avanza();
      daUltimoMs = 0;
    }
  }

  /** Riscrive il DOM se qualcosa è cambiato (una volta per frame). */
  function aggiorna() {
    const d = incontri.dialogo();
    const c = d && !d.tableau ? d.corrente() : null;
    const nuova = d && !d.tableau ? `${d.id}|${d.fase}|${d.indice}|${d.esito}|${c?.testo ?? ''}|${d.scelta?.selezionata ?? ''}` : '';
    if (nuova === firma) return;
    firma = nuova;
    if (!d || d.tableau) {
      radice.hidden = true;
      return;
    }
    radice.hidden = false;
    const scelta = d.fase === FASI.scelta;
    radice.className = `cartiglio-scena ${d.tipo} ${scelta ? 'scelta' : c?.didascalia ? 'didascalia' : 'parlato'}`;
    if (scelta) {
      parlante.textContent = '';
      parlante.hidden = true;
      battuta.textContent = '';
      battuta.hidden = true;
      opzioni.replaceChildren();
      d.scelta.opzioni.forEach((o, i) => {
        const li = documento.createElement('li');
        li.className = `opzione${d.scelta.selezionata === i ? ' selezionata' : ''}`;
        li.dataset.indice = String(i);
        const etichetta = documento.createElement('span');
        etichetta.className = 'etichetta';
        etichetta.textContent = o.etichetta;
        const sacrificio = documento.createElement('span');
        sacrificio.className = 'sacrificio';
        sacrificio.textContent = o.cosa_sacrifica;
        li.append(etichetta, sacrificio);
        opzioni.append(li);
      });
      opzioni.hidden = false;
      suggerimento.textContent = `${T.scegli ?? ''} · ${T.conferma ?? ''}`;
      return;
    }
    opzioni.replaceChildren();
    opzioni.hidden = true;
    parlante.textContent = c?.didascalia ? '' : c?.nome ?? '';
    parlante.hidden = Boolean(c?.didascalia);
    battuta.textContent = c?.testo ?? '';
    battuta.hidden = false;
    suggerimento.textContent = d.saltabile ? `${T.continua ?? ''} · ${T.salta ?? ''}` : T.continua ?? '';
  }

  return {
    tick,
    aggiorna,
    disegna: aggiorna,
    /** Stato del cartiglio per debug e test o null. */
    stato: () => {
      const d = incontri.dialogo();
      if (!d || d.tableau) return null;
      const c = d.corrente();
      return { id: d.id, tipo: d.tipo, fase: d.fase, indice: d.indice, esito: d.esito, parlante: c?.didascalia ? null : c?.nome ?? null, didascalia: Boolean(c?.didascalia), testo: c?.testo ?? '', selezionata: d.scelta?.selezionata ?? -1, nascosto: radice.hidden };
    },
    elementi: { radice, parlante, battuta, opzioni, suggerimento },
  };
}
