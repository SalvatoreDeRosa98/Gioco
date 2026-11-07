/**
 * motore/persistenza/salvataggio.js — Profilo e notte in localStorage, tre slot, chiavi versionate
 * (ADR-0006). Storia 026.
 *
 * Chiavi `ferruccio.v3.profilo.<slot>` e `ferruccio.v3.notte.<slot>`; dentro, una busta JSON
 * `{versione, tipo, slot, salvato_il, dati}` con `versione` di `migrazioni.js`. Il modulo è isolato
 * dietro `salva()/carica()/elenca()/cancella()`: la memoria è iniettabile (interfaccia di
 * localStorage: getItem/setItem/removeItem/key/length) e i test usano `memoriaInRam()`. Gli errori
 * di quota o di parsing sono loggati, mai lanciati: un salvataggio che fallisce non ferma la notte.
 * `esporta`/`importa` muovono uno slot come testo JSON (ADR-0006: desktop e supporto).
 * Dipendenze: `persistenza/migrazioni.js`.
 */

import { VERSIONE, MIGRAZIONI, migra } from './migrazioni.js';

/** Prefisso delle chiavi (ADR-0006). */
export const PREFISSO = 'ferruccio.v3';

/** Tipi di salvataggio. */
export const TIPI = Object.freeze(['profilo', 'notte']);

/**
 * Memoria in RAM con l'interfaccia di localStorage (per i test e per i browser senza storage).
 * @returns {{ getItem: (k: string) => string | null, setItem: (k: string, v: string) => void, removeItem: (k: string) => void, key: (i: number) => string | null, readonly length: number, clear: () => void }}
 */
export function memoriaInRam() {
  const mappa = new Map();
  return {
    getItem: (k) => (mappa.has(k) ? mappa.get(k) : null),
    setItem: (k, v) => { mappa.set(k, String(v)); },
    removeItem: (k) => { mappa.delete(k); },
    key: (i) => Array.from(mappa.keys())[i] ?? null,
    get length() { return mappa.size; },
    clear: () => mappa.clear(),
  };
}

/**
 * Chiave di uno slot.
 * @param {'profilo'|'notte'} tipo
 * @param {number|string} slot
 */
export function chiave(tipo, slot) {
  if (!TIPI.includes(tipo)) throw new RangeError(`salvataggio: tipo sconosciuto '${tipo}'`);
  if (slot === null || slot === undefined || String(slot) === '') throw new RangeError('salvataggio: slot mancante');
  return `${PREFISSO}.${tipo}.${slot}`;
}

/**
 * Crea il modulo di salvataggio.
 * @param {{
 *   memoria?: object,                    localStorage o `memoriaInRam()` (default: localStorage se esiste, altrimenti RAM)
 *   log?: { error: Function, warn?: Function },
 *   ora?: () => number,                  orologio per `salvato_il` (default Date.now; nei test una costante)
 *   versione?: number, migrazioni?: object   per testare le migrazioni
 * }} [o]
 */
export function creaSalvataggio({ memoria = null, log = console, ora = () => Date.now(), versione = VERSIONE, migrazioni = MIGRAZIONI } = {}) {
  let mem = memoria;
  if (!mem) {
    mem = globalThis.localStorage ?? null;
    if (!mem) {
      log?.warn?.('[salvataggio] localStorage assente: salvataggio solo in memoria');
      mem = memoriaInRam();
    }
  }

  const copia = (v) => JSON.parse(JSON.stringify(v));

  /**
   * Scrive i dati di uno slot.
   * @param {'profilo'|'notte'} tipo
   * @param {number|string} slot
   * @param {object} dati JSON-serializzabile
   * @returns {boolean} falso se la memoria rifiuta (quota) o i dati non sono serializzabili
   */
  function salva(tipo, slot, dati) {
    const k = chiave(tipo, slot);
    try {
      const busta = { versione, tipo, slot: String(slot), salvato_il: ora(), dati: copia(dati ?? {}) };
      mem.setItem(k, JSON.stringify(busta));
      return true;
    } catch (errore) {
      log?.error?.(`[salvataggio] impossibile salvare '${k}':`, errore);
      return false;
    }
  }

  function leggiBusta(k) {
    const testo = mem.getItem(k);
    if (testo === null || testo === undefined) return null;
    let busta;
    try {
      busta = JSON.parse(testo);
    } catch (errore) {
      log?.error?.(`[salvataggio] '${k}' non è JSON valido:`, errore);
      return null;
    }
    return migra(busta, { versione, migrazioni, log });
  }

  /**
   * Legge i dati di uno slot (migrati alla versione corrente) o null se assenti o illeggibili.
   * @param {'profilo'|'notte'} tipo
   * @param {number|string} slot
   * @returns {object | null}
   */
  function carica(tipo, slot) {
    const busta = leggiBusta(chiave(tipo, slot));
    return busta && busta.dati && typeof busta.dati === 'object' ? busta.dati : null;
  }

  /**
   * Elenca gli slot presenti in memoria: per ciascuno, `salvato_il` di profilo e notte (o null).
   * @returns {{ slot: string, profilo: { salvato_il: number } | null, notte: { salvato_il: number } | null }[]}
   */
  function elenca() {
    const perSlot = new Map();
    for (let i = 0; i < mem.length; i++) {
      const k = mem.key(i);
      if (!k || !k.startsWith(`${PREFISSO}.`)) continue;
      const [tipo, ...resto] = k.slice(PREFISSO.length + 1).split('.');
      const slot = resto.join('.');
      if (!TIPI.includes(tipo) || slot === '') continue;
      const voce = perSlot.get(slot) ?? { slot, profilo: null, notte: null };
      const busta = leggiBusta(k);
      voce[tipo] = busta ? { salvato_il: busta.salvato_il ?? null } : null;
      perSlot.set(slot, voce);
    }
    return Array.from(perSlot.values()).sort((a, b) => a.slot.localeCompare(b.slot, undefined, { numeric: true }));
  }

  /**
   * Cancella uno slot: un tipo solo, o profilo e notte insieme.
   * @param {number|string} slot
   * @param {'profilo'|'notte'} [tipo]
   */
  function cancella(slot, tipo) {
    for (const t of tipo ? [tipo] : TIPI) mem.removeItem(chiave(t, slot));
  }

  /**
   * Esporta profilo e notte di uno slot come testo JSON (null se lo slot è vuoto).
   * @param {number|string} slot
   * @returns {string | null}
   */
  function esporta(slot) {
    const contenuto = {};
    let qualcosa = false;
    for (const t of TIPI) {
      const busta = leggiBusta(chiave(t, slot));
      if (busta) {
        contenuto[t] = busta;
        qualcosa = true;
      }
    }
    return qualcosa ? JSON.stringify({ versione, slot: String(slot), contenuto }) : null;
  }

  /**
   * Importa in uno slot il testo prodotto da `esporta` (sovrascrive). Falso se il testo non è valido.
   * @param {number|string} slot
   * @param {string} testo
   * @returns {boolean}
   */
  function importa(slot, testo) {
    let pacco;
    try {
      pacco = JSON.parse(testo);
    } catch (errore) {
      log?.error?.('[salvataggio] importazione: JSON non valido', errore);
      return false;
    }
    if (!pacco || typeof pacco.contenuto !== 'object') {
      log?.error?.('[salvataggio] importazione: manca `contenuto`');
      return false;
    }
    let esito = false;
    for (const t of TIPI) {
      const busta = pacco.contenuto[t] ? migra(pacco.contenuto[t], { versione, migrazioni, log }) : null;
      if (busta?.dati) esito = salva(t, slot, busta.dati) || esito;
    }
    return esito;
  }

  return { salva, carica, elenca, cancella, esporta, importa, versione: () => versione };
}
