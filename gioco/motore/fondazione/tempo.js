/**
 * motore/fondazione/tempo.js — Passo fisso e accumulatore.
 *
 * Implementa ADR-0003 e architettura §1.4: la logica gira a 60 Hz con passo fisso di 16,667 ms;
 * il tempo reale di ogni frame si versa in un accumulatore e si eseguono tanti tick quanti passi
 * interi contiene, al massimo `MAX_TICK_PER_FRAME` (il resto si scarta: niente spirale della
 * morte). La frazione residua è la `alpha` con cui il rendering interpola. Storia 001.
 *
 * Modulo puro: nessun accesso al DOM, testabile in Node. Dipendenze: nessuna.
 * Le due costanti sono vincoli del motore (non valori di gioco): i GDD esprimono i tempi in ms e
 * `ticksDaMs` li converte una volta sola.
 */

/** Durata di un tick di simulazione in millisecondi (60 Hz). */
export const PASSO_MS = 1000 / 60;

/** Numero massimo di tick recuperati in un singolo frame. */
export const MAX_TICK_PER_FRAME = 5;

/** Tolleranza per gli errori di arrotondamento in virgola mobile nel conteggio dei passi. */
const EPSILON = 1e-9;

/**
 * Crea un accumulatore a passo fisso.
 * @param {{ passoMs?: number, maxTickPerFrame?: number }} [opzioni]
 * @returns {{
 *   passoMs: number,
 *   passoS: number,
 *   maxTickPerFrame: number,
 *   avanza: (dtMs: number) => number,
 *   alpha: () => number,
 *   residuo: () => number,
 *   azzera: () => void,
 *   ticksDaMs: (ms: number) => number
 * }}
 */
export function creaTempo({ passoMs = PASSO_MS, maxTickPerFrame = MAX_TICK_PER_FRAME } = {}) {
  let accumulatore = 0;

  /**
   * Versa il tempo trascorso nell'accumulatore e restituisce quanti tick eseguire.
   * Se i tick dovuti superano `maxTickPerFrame`, ne restituisce `maxTickPerFrame` e scarta il resto.
   * @param {number} dtMs millisecondi trascorsi dall'ultimo frame (valori non positivi o NaN = 0)
   * @returns {number} numero di tick da eseguire (0..maxTickPerFrame)
   */
  function avanza(dtMs) {
    if (!(dtMs > 0)) return 0;
    accumulatore += dtMs;
    let n = Math.floor(accumulatore / passoMs + EPSILON);
    if (n > maxTickPerFrame) {
      n = maxTickPerFrame;
      accumulatore = 0;
    } else {
      accumulatore -= n * passoMs;
      if (accumulatore < 0) accumulatore = 0;
    }
    return n;
  }

  /**
   * Frazione del tick successivo già trascorsa, in [0, 1): serve al rendering per interpolare.
   * @returns {number}
   */
  function alpha() {
    const a = accumulatore / passoMs;
    return a >= 1 ? 1 - EPSILON : a;
  }

  /** Millisecondi ancora nell'accumulatore. */
  function residuo() {
    return accumulatore;
  }

  /** Svuota l'accumulatore (es. dopo una pausa lunga). */
  function azzera() {
    accumulatore = 0;
  }

  /**
   * Converte una durata dei GDD (ms) in tick, almeno 1 per durate positive.
   * @param {number} ms
   * @returns {number} intero ≥ 0
   */
  function ticksDaMs(ms) {
    if (!(ms > 0)) return 0;
    return Math.max(1, Math.round(ms / passoMs));
  }

  return {
    passoMs,
    passoS: passoMs / 1000,
    maxTickPerFrame,
    avanza,
    alpha,
    residuo,
    azzera,
    ticksDaMs,
  };
}
