/**
 * motore/attori/gatto.js — Il gatto d'ombra (nemici.md §4.1, storia 020).
 *
 * La logica del gatto è tutta nella scheda `nemici.archetipi.gatto` letta dalla fabbrica generica
 * (`nemico.js` + `ia/base.js`): anello d'attesa (`omega_attesa`), balzo con portata dinamica
 * (`balzo_extra`, `balzo_min`, `portata`), hitbox accesa da `hit_dal` del balzo (impatto costante a
 * `t_lamp + hit_dal × t_imp` dal lampo), anello del lampo (`t_anello`), armatura del telegrafo.
 * Questo modulo aggiunge la **posa**: la descrizione della sagoma per stato (tabella dei pezzi del
 * GDD, fattori in `nemici.archetipi.gatto.posa`), che il fil di ferro disegna oggi e la sagoma vera
 * (storia 020-visiva) disegnerà domani. Niente numeri di gioco qui: solo i fattori del JSON.
 */

import { creaNemico } from './nemico.js';

/** Archetipo di questo modulo (chiave di `nemici.archetipi`). */
export const ARCHETIPO_GATTO = 'gatto';

/**
 * @typedef {object} PosaGatto
 * @property {string} stato stato dell'IA
 * @property {number} progresso 0 → 1 nella fase
 * @property {number} altezza fattore dell'altezza del corpo (1 a riposo, `altezza_anticipo` accucciato)
 * @property {number} lunghezza fattore della lunghezza (accorciato nell'anticipo, `scala_x_colpo` nel balzo)
 * @property {number} area fattore dell'area del corpo (`area_anticipo` a fine anticipo)
 * @property {number} inclinazioneGradi inclinazione del dorso: positiva = posteriore su (anticipo), stordito inclinato
 * @property {number} orecchie scala Y delle orecchie (1 dritte, 0,5 appiattite)
 * @property {number} coda rigidità della coda (0 ondeggia, 1 rigida/stesa)
 * @property {number} occhi 0 fessure di carta, 1 occhi rossi (lampo)
 * @property {number} anello 0 → 1 chiusura dell'anello del lampo (1 fuori dal lampo)
 * @property {{ x: number, y: number }} direzione verso del muso
 */

/**
 * Descrive la sagoma del gatto nello stato corrente a partire dai fattori del JSON (pura).
 * @param {{ stato: string, progresso: number, anello: number, direzione: { x: number, y: number }, dissoluzione?: number }} nemico
 * @param {{ valore: (nome: string) => number }} modificatori
 * @returns {PosaGatto}
 */
export function posaGatto(nemico, modificatori) {
  const P = (k) => modificatori.valore(`nemici.archetipi.${ARCHETIPO_GATTO}.posa.${k}`);
  const p = nemico.progresso;
  const base = {
    stato: nemico.stato, progresso: p, altezza: 1, lunghezza: 1, area: 1, inclinazioneGradi: 0, orecchie: 1, coda: 0, occhi: 0,
    anello: nemico.anello, direzione: { ...nemico.direzione },
  };
  switch (nemico.stato) {
    case 'anticipo': {
      // si accuccia: l'altezza scende a `altezza_anticipo`, la lunghezza si accorcia così che l'area sia `area_anticipo`
      const altezza = 1 - (1 - P('altezza_anticipo')) * p;
      const area = 1 - (1 - P('area_anticipo')) * p;
      return { ...base, altezza, area, lunghezza: area / altezza, inclinazioneGradi: P('posteriore_su_gradi') * p, orecchie: 1 - 0.5 * p, coda: p };
    }
    case 'lampo': {
      const altezza = P('altezza_anticipo');
      const area = P('area_anticipo');
      return { ...base, altezza, area, lunghezza: area / altezza, inclinazioneGradi: P('posteriore_su_gradi'), orecchie: 0.5, coda: 1, occhi: 1 };
    }
    case 'colpo': {
      const lunghezza = P('scala_x_colpo');
      return { ...base, lunghezza, area: lunghezza, coda: 1, occhi: 1 - p };
    }
    case 'stordito':
      return { ...base, inclinazioneGradi: -P('inclinazione_stordito_gradi'), orecchie: 0.5, coda: 0 };
    case 'morto':
      return { ...base, altezza: Math.max(0, 1 - (nemico.dissoluzione ?? 1)), area: Math.max(0, 1 - (nemico.dissoluzione ?? 1)) };
    default:
      return base;
  }
}

/**
 * Crea un gatto d'ombra: la fabbrica generica con l'archetipo `gatto` e la posa agganciata.
 * @param {Omit<Parameters<typeof creaNemico>[0], 'archetipo' | 'posa'> & { archetipo?: string }} o
 */
export function creaGatto(o) {
  const { modificatori } = o;
  return creaNemico({ ...o, archetipo: ARCHETIPO_GATTO, posa: (n) => posaGatto(n, modificatori) });
}
