/**
 * motore/fondazione/eventi.js — Bus eventi sincrono.
 *
 * Architettura §2: un modulo importa solo dal proprio livello o da quelli sotto; le dipendenze
 * verso l'alto passano per eventi (Feature emette `nemico.morto`, Presentation ascolta).
 * `emit` consegna il payload nello stesso tick a tutti gli ascoltatori registrati; un ascoltatore
 * che lancia un errore non impedisce la consegna agli altri e l'errore è loggato una sola volta.
 * Storia 004. Dipendenze: nessuna.
 */

/**
 * Crea un bus eventi.
 * @param {{ log?: { error: (...a: unknown[]) => void } }} [opzioni] logger iniettabile (default console)
 * @returns {{
 *   on: (nome: string, fn: (payload: unknown) => void) => () => void,
 *   off: (nome: string, fn: (payload: unknown) => void) => void,
 *   emit: (nome: string, payload?: unknown) => number,
 *   conta: (nome: string) => number,
 *   azzera: () => void
 * }}
 */
export function creaBus({ log = console } = {}) {
  /** @type {Map<string, Set<Function>>} */
  const ascoltatori = new Map();

  /**
   * Registra un ascoltatore.
   * @param {string} nome nome dell'evento (es. 'nemico.morto')
   * @param {(payload: unknown) => void} fn
   * @returns {() => void} funzione che rimuove l'ascoltatore
   */
  function on(nome, fn) {
    if (typeof fn !== 'function') throw new TypeError(`eventi.on('${nome}'): ascoltatore non è una funzione`);
    let insieme = ascoltatori.get(nome);
    if (!insieme) {
      insieme = new Set();
      ascoltatori.set(nome, insieme);
    }
    insieme.add(fn);
    return () => off(nome, fn);
  }

  /**
   * Rimuove un ascoltatore; non fa nulla se non era registrato.
   * @param {string} nome
   * @param {(payload: unknown) => void} fn
   */
  function off(nome, fn) {
    const insieme = ascoltatori.get(nome);
    if (!insieme) return;
    insieme.delete(fn);
    if (insieme.size === 0) ascoltatori.delete(nome);
  }

  /**
   * Emette un evento in modo sincrono. Gli ascoltatori vengono copiati prima della consegna, così
   * `off` chiamato durante l'emissione è sicuro. Ogni errore è isolato e loggato una volta.
   * @param {string} nome
   * @param {unknown} [payload]
   * @returns {number} numero di ascoltatori raggiunti
   */
  function emit(nome, payload) {
    const insieme = ascoltatori.get(nome);
    if (!insieme || insieme.size === 0) return 0;
    const copia = Array.from(insieme);
    for (const fn of copia) {
      try {
        fn(payload);
      } catch (errore) {
        log.error(`[eventi] errore nell'ascoltatore di '${nome}':`, errore);
      }
    }
    return copia.length;
  }

  /**
   * Numero di ascoltatori registrati per un evento.
   * @param {string} nome
   * @returns {number}
   */
  function conta(nome) {
    return ascoltatori.get(nome)?.size ?? 0;
  }

  /** Rimuove tutti gli ascoltatori (utile nei test e al cambio di stato). */
  function azzera() {
    ascoltatori.clear();
  }

  return { on, off, emit, conta, azzera };
}
