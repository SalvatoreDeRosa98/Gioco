/**
 * motore/fondazione/rng.js — Generatori pseudo-casuali seminati (mulberry32).
 *
 * Implementa ADR-0003 (determinismo): ogni notte ha un seme; ogni dominio (generazione, spawn,
 * drop, IA) chiede il proprio generatore con `derivato(rng, etichetta)`, calcolato dal seme e
 * dall'etichetta e NON dallo stato corrente, così aggiungere un'estrazione in un dominio non
 * sposta la sequenza degli altri. Storia 003.
 *
 * Regola di progetto: in `gioco/motore/` non si usa mai il generatore casuale nativo del linguaggio
 * (il test di contenuto in qa/fondazione.test.mjs lo verifica con un grep). Dipendenze: nessuna.
 */

/** Riduce un numero qualsiasi a un intero a 32 bit senza segno. */
function a32(n) {
  return Number(n) >>> 0;
}

/**
 * Hash FNV-1a a 32 bit di una stringa, stabile tra esecuzioni e piattaforme.
 * @param {string} etichetta
 * @returns {number} intero senza segno a 32 bit
 */
export function hashEtichetta(etichetta) {
  let h = 0x811c9dc5;
  const s = String(etichetta);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Crea un generatore mulberry32.
 * @param {number} seme intero (viene ridotto a 32 bit)
 * @returns {(() => number) & { seme: number }} funzione che restituisce un numero in [0, 1);
 *   la proprietà `seme` conserva il seme di partenza per `derivato`.
 */
export function creaRng(seme) {
  const semeIniziale = a32(seme);
  let stato = semeIniziale;
  const rng = function rng() {
    stato = (stato + 0x6d2b79f5) | 0;
    let t = stato;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.seme = semeIniziale;
  return rng;
}

/**
 * Generatore figlio stabile per etichetta: seme = seme del padre XOR hash(etichetta).
 * Non consuma né legge lo stato del padre.
 * @param {{ seme: number }} rng generatore padre
 * @param {string} etichetta nome del dominio (es. 'spawn', 'drop')
 * @returns {(() => number) & { seme: number }}
 */
export function derivato(rng, etichetta) {
  return creaRng((rng.seme ^ hashEtichetta(etichetta)) >>> 0);
}

/**
 * Intero uniforme in [min, max] (estremi inclusi).
 * @param {() => number} rng
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function intero(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Elemento uniforme di una lista non vuota.
 * @template T
 * @param {() => number} rng
 * @param {T[]} lista
 * @returns {T}
 */
export function scegli(rng, lista) {
  return lista[Math.floor(rng() * lista.length)];
}

/**
 * Copia mescolata (Fisher-Yates) di una lista; la lista originale non cambia.
 * @template T
 * @param {() => number} rng
 * @param {T[]} lista
 * @returns {T[]}
 */
export function mescola(rng, lista) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = copia[i];
    copia[i] = copia[j];
    copia[j] = t;
  }
  return copia;
}
