/**
 * motore/persistenza/notte-salvata.js — La notte in corso su `salvataggio.js` (storia 030, ADR-0006).
 *
 * A ogni cambio di stanza (`notte.stanza`) fotografa `{seme, piano, stanza, notte, maschere, doni,
 * monete}` e la scrive nello slot `notte`; mai a metà combattimento: alla ripresa la stanza corrente
 * riparte con lo stato con cui vi si è entrati (ADR-0006). Alla morte (`ferruccio.morto`) la notte
 * salvata si cancella: non c'è nulla da riprendere. «Continua» (`riprendi`) rigenera il piano dal seme
 * tramite il gancio `avvia({seme, piano, stanza})` della radice di composizione e ripristina doni (anche
 * nel pool, se c'è), maschere e monete. Lo stato delle stanze visitate e dei piedistalli non è
 * serializzato (storia 032): le stanze ripartono non visitate. Storia P01: anche `piano.completato` (l'uscita
 * della stanza boss) cancella la notte salvata, con motivo `vittoria`: la notte è finita, non c'è nulla da riprendere.
 * I dati letti sono normalizzati (campi mancanti o corrotti → predefiniti; doni ignoti scartati dai
 * modificatori con errore di contenuto). Nessun numero e nessuna stringa di gioco.
 * Eventi: `notte.salvata` {stanza}, `notte.cancellata` {motivo}, `notte.ripresa` {seme, piano, stanza, ...}.
 * Dipendenze: solo moduli iniettati.
 */

/** Motivi della cancellazione (codici stabili). */
export const MOTIVI_CANCELLAZIONE = Object.freeze({ morte: 'morte', lasciata: 'lasciata', manuale: 'manuale', vittoria: 'vittoria' });

/**
 * Normalizza i dati di una notte salvata; null se non c'è una notte riprendibile.
 * @param {unknown} dati
 * @returns {{ seme: number, piano: number, stanza: string, notte: number|null, maschere: number|null, doni: string[], monete: number } | null}
 */
export function normalizzaNotte(dati) {
  if (!dati || typeof dati !== 'object') return null;
  const d = /** @type {Record<string, unknown>} */ (dati);
  if (!Number.isFinite(d.seme) || !Number.isInteger(d.piano) || d.piano < 1 || typeof d.stanza !== 'string' || d.stanza === '') return null;
  return {
    seme: Number(d.seme) >>> 0,
    piano: d.piano,
    stanza: d.stanza,
    notte: Number.isInteger(d.notte) ? d.notte : null,
    maschere: Number.isInteger(d.maschere) && d.maschere >= 0 ? d.maschere : null,
    doni: Array.isArray(d.doni) ? d.doni.filter((x) => typeof x === 'string') : [],
    monete: Number.isInteger(d.monete) && d.monete >= 0 ? d.monete : 0,
  };
}

/**
 * Crea il salvataggio della notte.
 * @param {{
 *   salvataggio: { salva: Function, carica: Function, cancella: Function },
 *   slot: string|number,
 *   eventi: { on: Function, emit: Function },
 *   notte: () => ({ seme: number, piano: number, stanza: { id: string } | null } | null),
 *   ferruccio: { maschere: number, impostaMaschere: (n: number) => void },
 *   modificatori: { doniAttivi: () => string[], aggiungiDono: (id: string) => boolean },
 *   economia: { monete: number, aggiungiMonete: (n: number, motivo?: string) => number },
 *   numeroNotte?: (() => number) | null,   numero della notte dall'avanzamento (per il pannello)
 *   pool?: { raccolto: (id: string) => boolean } | null,
 *   log?: { error: Function }
 * }} o
 */
export function creaNotteSalvata({ salvataggio, slot, eventi, notte, ferruccio, modificatori, economia, numeroNotte = null, pool = null, log = console }) {
  if (!salvataggio || slot === undefined || slot === null || !eventi || typeof notte !== 'function' || !ferruccio || !modificatori || !economia) {
    throw new TypeError('creaNotteSalvata: dipendenze mancanti');
  }
  const TIPO = 'notte';
  let sospeso = false;
  let presente = normalizzaNotte(salvataggio.carica(TIPO, slot)) !== null;

  /** Fotografia della notte in corso, o null se non c'è una stanza corrente. */
  function fotografa() {
    const n = notte();
    if (!n || !n.stanza) return null;
    return {
      seme: n.seme, piano: n.piano, stanza: n.stanza.id, notte: numeroNotte ? numeroNotte() : null,
      maschere: ferruccio.maschere, doni: modificatori.doniAttivi(), monete: economia.monete,
    };
  }

  /** Scrive la fotografia nello slot. @returns {boolean} */
  function salva() {
    if (sospeso) return false;
    const dati = fotografa();
    if (!dati) return false;
    const ok = salvataggio.salva(TIPO, slot, dati);
    if (ok) {
      presente = true;
      eventi.emit('notte.salvata', { stanza: dati.stanza, piano: dati.piano });
    }
    return ok;
  }

  /** Legge la notte salvata (normalizzata) o null. */
  function carica() {
    const d = normalizzaNotte(salvataggio.carica(TIPO, slot));
    presente = d !== null;
    return d;
  }

  /**
   * Cancella la notte salvata.
   * @param {string} [motivo] uno di `MOTIVI_CANCELLAZIONE`
   */
  function cancella(motivo = MOTIVI_CANCELLAZIONE.manuale) {
    salvataggio.cancella(slot, TIPO);
    presente = false;
    eventi.emit('notte.cancellata', { motivo });
  }

  /**
   * «Continua»: rigenera la notte dal seme con il gancio `avvia` e ripristina doni, maschere e monete.
   * @param {{ avvia: (o: { seme: number, piano: number, stanza: string }) => unknown }} o
   * @returns {{ ok: boolean, dati?: object, motivo?: string }}
   */
  function riprendi({ avvia }) {
    if (typeof avvia !== 'function') throw new TypeError('notteSalvata.riprendi: manca `avvia`');
    const dati = carica();
    if (!dati) return { ok: false, motivo: 'nessuna' };
    sospeso = true;
    try {
      avvia({ seme: dati.seme, piano: dati.piano, stanza: dati.stanza });
      for (const id of dati.doni) {
        if (modificatori.aggiungiDono(id)) pool?.raccolto?.(id);
        else log?.error?.(`[notte-salvata] dono '${id}' della notte salvata non ripristinato`);
      }
      if (dati.maschere !== null) ferruccio.impostaMaschere(dati.maschere);
      if (dati.monete > 0) economia.aggiungiMonete(dati.monete, 'ripresa');
    } finally {
      sospeso = false;
    }
    salva();
    eventi.emit('notte.ripresa', { ...dati });
    return { ok: true, dati };
  }

  const disiscrizioni = [
    eventi.on('notte.stanza', () => salva()),
    eventi.on('ferruccio.morto', () => cancella(MOTIVI_CANCELLAZIONE.morte)),
    eventi.on('piano.completato', () => cancella(MOTIVI_CANCELLAZIONE.vittoria)),
  ];

  return {
    /** Vero se nello slot c'è una notte riprendibile (senza rileggere la memoria). */
    get presente() { return presente; },
    fotografa,
    salva,
    carica,
    cancella,
    riprendi,
    /** Toglie gli ascoltatori (test). */
    distruggi: () => { for (const d of disiscrizioni) d(); disiscrizioni.length = 0; },
  };
}
