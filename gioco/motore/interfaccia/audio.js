/**
 * motore/interfaccia/audio.js — Interruttore DOM del muto (storia P10).
 *
 * Un bottone nell'angolo del palco, visibile quando `visibile()` è vero (nel menu): mostra «Audio: acceso/spento (M)»
 * con i testi di `contenuti/interfaccia.json › audio` e il tasto della mappa di input.json; il click inverte il muto del
 * sintetizzatore. Non conosce il ciclo né gli eventi: `aggiorna()` rilegge lo stato a ogni disegno. Stile in
 * `stile/audio.css` (colori dai token). Dipendenze: solo il DOM iniettato.
 */

/**
 * Sostituisce `{nome}` con i valori dati.
 * @param {string} testo
 * @param {Record<string, string | number>} valori
 */
function riempi(testo, valori) {
  return String(testo).replace(/\{(\w+)\}/g, (_, k) => (k in valori ? String(valori[k]) : `{${k}}`));
}

/**
 * @param {{
 *   documento: Document, contenitore: HTMLElement,
 *   testi: { audio: { acceso: string, spento: string, titolo: string } },
 *   sintesi: { muto: boolean, alternaMuto: () => boolean },
 *   visibile: () => boolean,
 *   tasto: () => string
 * }} o `tasto` ritorna il codice del tasto del muto (es. 'KeyM'), mostrato senza il prefisso `Key`
 */
export function creaInterfacciaAudio({ documento, contenitore, testi, sintesi, visibile, tasto }) {
  if (!documento || !contenitore || !testi?.audio || !sintesi) throw new TypeError('creaInterfacciaAudio: dipendenze mancanti');
  const T = testi.audio;
  const bottone = documento.createElement('button');
  bottone.type = 'button';
  bottone.className = 'audio-interruttore';
  bottone.hidden = true;
  bottone.title = T.titolo;
  bottone.addEventListener('click', () => { sintesi.alternaMuto(); aggiorna(); });
  contenitore.appendChild(bottone);

  /** Nome leggibile del tasto: `KeyM` → `M`. */
  const nomeTasto = () => String(tasto?.() ?? '').replace(/^Key/, '');

  function aggiorna() {
    const mostra = Boolean(visibile?.());
    bottone.hidden = !mostra;
    const testo = riempi(sintesi.muto ? T.spento : T.acceso, { tasto: nomeTasto() });
    if (bottone.textContent !== testo) bottone.textContent = testo;
    bottone.classList.toggle('muto', sintesi.muto);
  }

  return {
    aggiorna,
    /** Stato per debug e test. */
    stato: () => ({ visibile: !bottone.hidden, muto: sintesi.muto, testo: bottone.textContent }),
    /** Click simulato (test). */
    clicca: () => { sintesi.alternaMuto(); aggiorna(); },
  };
}
