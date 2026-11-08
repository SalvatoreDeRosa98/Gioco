/**
 * motore/persistenza/profilo.js — Il profilo del giocatore (ciò che sopravvive alla notte), su
 * `salvataggio.js`. Storia 025 (scintille), storia 028 (`restituisci`: ricordi restituiti), ADR-0006.
 *
 * Il profilo tiene le scintille, gli sblocchi della Fucina e i ricordi restituiti. È letto una volta
 * alla creazione (slot dato) e scritto ad ogni cambiamento: le scintille si accreditano nel momento in
 * cui sono raccolte (GDD economia regola 4), così una morte nella stanza dopo non le tocca. Il tetto
 * delle scintille è passato da chi chiama (viene da `economia.json`): qui nessun numero di gioco.
 * Dipendenze: solo `persistenza/salvataggio.js` (iniettato).
 */

/** Dati vuoti di un profilo nuovo. */
export function profiloVuoto() {
  return { scintille: 0, sblocchi: [], ricordi_restituiti: [] };
}

/**
 * Normalizza dati letti dal salvataggio (tollerante: campi mancanti o corrotti → predefiniti).
 * @param {unknown} dati
 */
export function normalizzaProfilo(dati) {
  const base = profiloVuoto();
  if (!dati || typeof dati !== 'object') return base;
  const d = /** @type {Record<string, unknown>} */ (dati);
  if (Number.isInteger(d.scintille) && d.scintille >= 0) base.scintille = d.scintille;
  if (Array.isArray(d.sblocchi)) base.sblocchi = d.sblocchi.filter((s) => typeof s === 'string');
  if (Array.isArray(d.ricordi_restituiti)) base.ricordi_restituiti = d.ricordi_restituiti.filter((s) => typeof s === 'string');
  return base;
}

/**
 * Crea il profilo legato a uno slot del salvataggio.
 * @param {{
 *   salvataggio: { salva: (tipo: string, slot: string|number, dati: object) => boolean, carica: (tipo: string, slot: string|number) => object | null },
 *   slot: string | number,
 *   eventi?: { emit: Function } | null
 * }} o
 */
export function creaProfilo({ salvataggio, slot, eventi = null }) {
  if (!salvataggio || slot === undefined || slot === null) throw new TypeError('creaProfilo: salvataggio e slot obbligatori');
  const dati = normalizzaProfilo(salvataggio.carica('profilo', slot));

  /**
   * Scrive il profilo nello slot, conservando i campi che vi scrive lo stato narrativo (flag e
   * avanzamento, `storia/stato-narrativo.js`): la busta del profilo è una sola (ADR-0006, storia 030).
   * @returns {boolean}
   */
  function salva() {
    const altri = salvataggio.carica('profilo', slot) ?? {};
    return salvataggio.salva('profilo', slot, { ...altri, ...dati });
  }

  /**
   * Accredita `n` scintille (intero ≥ 0) fino a `tetto`, e salva subito.
   * @param {number} n
   * @param {number} tetto
   * @returns {number} scintille accreditate davvero
   */
  function aggiungiScintille(n, tetto) {
    const q = Math.max(0, Math.floor(n));
    const prima = dati.scintille;
    dati.scintille = Math.min(tetto, prima + q);
    const accreditate = dati.scintille - prima;
    if (accreditate > 0) {
      salva();
      eventi?.emit('profilo.scintille', { scintille: dati.scintille, accreditate });
    }
    return accreditate;
  }

  /**
   * Scala `n` scintille se bastano (acquisto alla Fucina: atomico), e salva.
   * @param {number} n
   * @returns {boolean}
   */
  function togliScintille(n) {
    const q = Math.max(0, Math.floor(n));
    if (dati.scintille < q) return false;
    dati.scintille -= q;
    salva();
    eventi?.emit('profilo.scintille', { scintille: dati.scintille, accreditate: -q });
    return true;
  }

  /**
   * Registra un ricordo restituito alla sua persona (storia 028, GDD ricordi-scelta regola 7): il pool
   * non lo offre più in nessuna notte successiva. Idempotente; salva subito.
   * @param {string} id id del dono-ricordo (catalogo)
   * @returns {boolean} vero se è stato aggiunto ora
   */
  function restituisci(id) {
    if (typeof id !== 'string' || id === '' || dati.ricordi_restituiti.includes(id)) return false;
    dati.ricordi_restituiti.push(id);
    salva();
    eventi?.emit('profilo.ricordo', { id, ricordi_restituiti: dati.ricordi_restituiti.slice() });
    return true;
  }

  return {
    get slot() { return slot; },
    get scintille() { return dati.scintille; },
    get sblocchi() { return dati.sblocchi.slice(); },
    get ricordiRestituiti() { return dati.ricordi_restituiti.slice(); },
    /** Copia dei dati (per i test e il debug). */
    dati: () => JSON.parse(JSON.stringify(dati)),
    aggiungiScintille,
    togliScintille,
    restituisci,
    salva,
  };
}
