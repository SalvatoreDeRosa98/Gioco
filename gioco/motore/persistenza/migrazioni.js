/**
 * motore/persistenza/migrazioni.js — Versione del formato di salvataggio e migrazioni (ADR-0006).
 * Storia 026.
 *
 * Ogni busta salvata porta `versione`. `MIGRAZIONI[n]` trasforma una busta di versione `n` in una di
 * versione `n + 1`; `migra` le applica in sequenza fino a `VERSIONE`. Oggi il formato è il primo
 * (nessuna migrazione reale): la tabella è vuota ma il contratto è fissato e testato con una tabella
 * finta. Una busta più nuova del motore non si migra: è un errore (si restituisce null).
 * Dipendenze: nessuna.
 */

/** Versione corrente del formato della busta `{versione, tipo, slot, salvato_il, dati}`. */
export const VERSIONE = 1;

/** @type {Readonly<Record<number, (busta: object) => object>>} da versione n a n + 1 */
export const MIGRAZIONI = Object.freeze({});

/**
 * Porta una busta alla versione corrente.
 * @param {object} busta
 * @param {{ versione?: number, migrazioni?: Record<number, (b: object) => object>, log?: { error: Function } }} [o]
 * @returns {object | null} busta migrata, o null se non migrabile
 */
export function migra(busta, { versione = VERSIONE, migrazioni = MIGRAZIONI, log = console } = {}) {
  if (!busta || typeof busta !== 'object' || !Number.isInteger(busta.versione)) {
    log?.error?.('[salvataggio] busta senza versione: scartata');
    return null;
  }
  if (busta.versione > versione) {
    log?.error?.(`[salvataggio] busta di versione ${busta.versione} più nuova del motore (${versione}): scartata`);
    return null;
  }
  let corrente = busta;
  while (corrente.versione < versione) {
    const passo = migrazioni[corrente.versione];
    if (typeof passo !== 'function') {
      log?.error?.(`[salvataggio] manca la migrazione dalla versione ${corrente.versione}`);
      return null;
    }
    const prossima = passo(corrente);
    if (!prossima || prossima.versione !== corrente.versione + 1) {
      log?.error?.(`[salvataggio] la migrazione dalla versione ${corrente.versione} non ha prodotto la versione ${corrente.versione + 1}`);
      return null;
    }
    corrente = prossima;
  }
  return corrente;
}
