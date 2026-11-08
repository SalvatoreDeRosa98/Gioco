/**
 * motore/oggetti/pool.js — Il pool dei doni della notte (GDD doni-modificatori.md regola 7 e formula
 * `probabilita_estrazione`). Storia 024.
 *
 * Il pool di un piano `p` e di un canale è l'insieme dei doni ELEGGIBILI del catalogo:
 *  - `mvp` (o build piena, `soloMvp: false`); canale del dono che contiene il canale richiesto;
 *  - canali pesati (`piedistallo`, `banchetto`): rarità vendibile (mai `unico`), `piano_min ≤ p`,
 *    `sblocco` nullo o acquistato (`sblocchi(id)`), non già offerto in questo piano;
 *  - canali fissi (`boss`, `stanza-ricordo`): `piano_fisso = p`; `narrativo`: `piano_min ≤ p`;
 *  - `richiede_flag` soddisfatto ed `escludi_se_flag` non soddisfatto, con i flag FOTOGRAFATI alla
 *    generazione del piano (`preparaPiano(p)`; senza fotografia si leggono i flag correnti);
 *  - non raccolto in questa notte (`raccolto(id)`, anche via evento `doni.aggiunto`) e non nella lista
 *    dei ricordi restituiti del profilo (`restituiti()`).
 * Estrazione a due stadi: prima la classe di rarità tra quelle non vuote con peso
 * `W_r(p) = max(0, W0_r × (1 + d_r × (p − 1)))` (`pesiRarita` di economia.js), poi un dono nella classe
 * pesato da `peso`. Al massimo due numeri del generatore `rng` (derivato 'pool' del seme della notte).
 * `probabilita()` dà la stessa distribuzione in forma chiusa (criteri del GDD: 10 %, 7,5 %, 12 %, 11 %).
 * Un dono offerto e non preso resta nel pool dei piani successivi; solo la raccolta lo toglie.
 * Pool vuoto → `fallback()`: un cuore se le maschere non sono piene, altrimenti `fallbackMonete` monete.
 *
 * Nessun numero e nessuna stringa di gioco: pesi, derive e monete del sostituto sono iniettati da chi
 * compone (letti da `economia.json`). Dipendenze: `economia.js` (formula dei pesi). Verso l'alto solo eventi.
 */

import { pesiRarita, RARITA_VENDIBILI } from './economia.js';

/** Canali che estraggono dal pool pesato. */
export const CANALI_PESATI = Object.freeze(['piedistallo', 'banchetto']);
/** Canali che consegnano un ricordo al suo piano fisso o per via narrativa. */
export const CANALI_FISSI = Object.freeze(['boss', 'stanza-ricordo', 'narrativo']);

/**
 * Vero se la condizione `{flag, valore}` (o null) è soddisfatta dai flag dati.
 * @param {{ flag: string, valore: string } | null | undefined} cond
 * @param {Record<string, unknown>} flags
 */
export function flagSoddisfatto(cond, flags) {
  if (!cond || typeof cond !== 'object') return false;
  return flags != null && flags[cond.flag] === cond.valore;
}

/**
 * Sceglie un indice pesato con un solo numero del generatore. Pesi tutti nulli → ultimo indice.
 * @param {number[]} pesi
 * @param {number} u numero in [0, 1)
 */
export function scegliPesato(pesi, u) {
  const tot = pesi.reduce((a, w) => a + Math.max(0, w), 0);
  if (tot <= 0) return pesi.length - 1;
  let v = u * tot;
  for (let i = 0; i < pesi.length; i++) {
    v -= Math.max(0, pesi[i]);
    if (v < 0) return i;
  }
  return pesi.length - 1;
}

/**
 * @param {{
 *   catalogo: object[],                           doni.json → doni
 *   pesi: Record<string, number>,                 W0_r per rarità vendibile
 *   derivePct: Record<string, number>,            d_r in percento per rarità
 *   fallbackMonete: number,                       monete del sostituto a pool vuoto
 *   rng: () => number,                            generatore derivato 'pool'
 *   flag?: () => Record<string, unknown>,         flag correnti dello stato narrativo
 *   sblocchi?: (id: string) => boolean,           sblocco della Fucina acquistato?
 *   restituiti?: () => Iterable<string>,          ricordi restituiti (profilo)
 *   soloMvp?: boolean,
 *   eventi?: { on: Function, emit: Function } | null,
 *   log?: { error: Function }
 * }} o
 */
export function creaPool({
  catalogo, pesi, derivePct, fallbackMonete, rng, flag = () => ({}), sblocchi = () => false, restituiti = () => [],
  soloMvp = true, eventi = null, log = console,
}) {
  if (!Array.isArray(catalogo) || !pesi || !derivePct || typeof rng !== 'function' || typeof fallbackMonete !== 'number') {
    throw new TypeError('creaPool: catalogo, pesi, derivePct, fallbackMonete e rng obbligatori');
  }
  /** @type {Set<string>} doni raccolti nella notte */
  const raccolti = new Set();
  /** @type {Map<number, Set<string>>} doni offerti per piano */
  const offerti = new Map();
  /** @type {Map<number, Record<string, unknown>>} flag fotografati alla generazione del piano */
  const istantanee = new Map();

  const offertiIn = (piano) => {
    if (!offerti.has(piano)) offerti.set(piano, new Set());
    return offerti.get(piano);
  };
  const flagsDi = (piano) => istantanee.get(piano) ?? flag() ?? {};

  /**
   * Fotografa i flag per il piano `p` (regola 7: i pool già generati non cambiano se un flag cambia).
   * @param {number} piano
   */
  function preparaPiano(piano) {
    istantanee.set(piano, { ...(flag() ?? {}) });
    offertiIn(piano);
  }

  /**
   * Vero se il dono `d` è eleggibile per il piano e il canale dati.
   * @param {object} d
   * @param {{ piano: number, canale?: string | null }} o
   */
  function eleggibile(d, { piano, canale = null }) {
    if (!d || typeof d.id !== 'string') return false;
    if (soloMvp && d.mvp === false) return false;
    if (raccolti.has(d.id)) return false;
    for (const id of restituiti() ?? []) if (id === d.id) return false;
    if (canale && Array.isArray(d.canale) && !d.canale.includes(canale)) return false;
    const pesato = canale === null || CANALI_PESATI.includes(canale);
    if (pesato) {
      if (!RARITA_VENDIBILI.includes(d.rarita)) return false;
      if ((d.piano_min ?? 1) > piano) return false;
      if (d.sblocco !== null && d.sblocco !== undefined && !sblocchi(d.sblocco)) return false;
      if (offertiIn(piano).has(d.id)) return false;
    } else if (canale === 'narrativo') {
      if ((d.piano_min ?? 1) > piano) return false;
    } else if (d.piano_fisso !== piano) {
      return false;
    }
    const flags = flagsDi(piano);
    if (d.richiede_flag && !flagSoddisfatto(d.richiede_flag, flags)) return false;
    if (d.escludi_se_flag && flagSoddisfatto(d.escludi_se_flag, flags)) return false;
    return true;
  }

  /**
   * Doni eleggibili (copie superficiali), nell'ordine del catalogo.
   * @param {{ piano: number, canale?: string | null }} o
   */
  function eleggibili(o) {
    return catalogo.filter((d) => eleggibile(d, o)).map((d) => ({ ...d }));
  }

  /**
   * Classi di rarità non vuote con il loro peso `W_r(p)`, nell'ordine di `RARITA_VENDIBILI`.
   * @param {object[]} candidati
   * @param {number} piano
   */
  function classi(candidati, piano) {
    const w = pesiRarita({ pesi, derivePct, piano });
    return RARITA_VENDIBILI.filter((r) => w[r] > 0 && candidati.some((d) => d.rarita === r)).map((r) => ({ rarita: r, peso: w[r] }));
  }

  /**
   * Probabilità di estrazione `P(i)` di ogni dono eleggibile (formula del GDD), come Map id → P.
   * @param {{ piano: number, canale?: string | null }} o
   */
  function probabilita(o) {
    const candidati = eleggibili(o);
    const cl = classi(candidati, o.piano);
    const totW = cl.reduce((a, c) => a + c.peso, 0);
    const esito = new Map();
    for (const c of cl) {
      const nella = candidati.filter((d) => d.rarita === c.rarita);
      const totPeso = nella.reduce((a, d) => a + (d.peso ?? 1), 0);
      for (const d of nella) esito.set(d.id, (c.peso / totW) * ((d.peso ?? 1) / totPeso));
    }
    return esito;
  }

  /**
   * Estrae un dono per il canale e lo segna come offerto nel piano. Null se il pool è vuoto.
   * @param {{ piano: number, canale?: string }} o
   * @returns {object | null}
   */
  function estrai({ piano, canale = 'piedistallo' }) {
    const candidati = eleggibili({ piano, canale });
    if (candidati.length === 0) return null;
    const cl = classi(candidati, piano);
    if (cl.length === 0) return null;
    const classe = cl[scegliPesato(cl.map((c) => c.peso), rng())].rarita;
    const nella = candidati.filter((d) => d.rarita === classe);
    const scelto = nella[scegliPesato(nella.map((d) => d.peso ?? 1), rng())];
    offertiIn(piano).add(scelto.id);
    eventi?.emit('pool.offerto', { id: scelto.id, piano, canale });
    return scelto;
  }

  /**
   * Un dono raccolto esce dal pool per il resto della notte.
   * @param {string} id
   */
  function raccolto(id) {
    if (typeof id !== 'string' || raccolti.has(id)) return false;
    raccolti.add(id);
    return true;
  }

  /**
   * Sostituto a pool vuoto: un cuore se le maschere non sono piene, altrimenti monete.
   * @param {{ maschere: number, maschereMax: number }} o
   * @returns {{ tipo: 'cuore' | 'monete', valore: number }}
   */
  function fallback({ maschere, maschereMax }) {
    if (maschere < maschereMax) return { tipo: 'cuore', valore: 1 };
    return { tipo: 'monete', valore: fallbackMonete };
  }

  if (eventi) eventi.on('doni.aggiunto', (p) => { if (p?.id) raccolto(p.id); });

  return {
    preparaPiano,
    eleggibile,
    eleggibili,
    probabilita,
    estrai,
    raccolto,
    fallback,
    raccolti: () => Array.from(raccolti),
    offertiIn: (piano) => Array.from(offertiIn(piano)),
    /** Azzera la notte (morte, nuova notte): raccolti, offerti e fotografie. */
    azzera: () => { raccolti.clear(); offerti.clear(); istantanee.clear(); },
    pesiAl: (piano) => pesiRarita({ pesi, derivePct, piano }),
  };
}
