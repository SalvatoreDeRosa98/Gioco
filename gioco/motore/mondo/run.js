/**
 * motore/mondo/run.js — Lo stato della run (storia P06; Teatro `statoRun` ~2601, `moltCiclo`/`moltVel` ~3231,
 * boss del piano ~3390, `getRaccontoAtto` ~2535).
 *
 * Una run è una discesa dal piano 1 in poi, senza fine: i piani si ripetono a cicli di `piani_per_ciclo` (4) e
 * l'ultimo piano di ogni ciclo è quello di Donna Luciana (`finale`). Qui vivono il **seme** della run (da cui
 * derivano le piante dei piani, i nemici e l'estrazione dei boss), il **piano** corrente, i **boss estratti**
 * senza ripetizione dal pool (`boss.json › pool`, generatore derivato `boss-run` dal seme: la stessa run dà
 * sempre gli stessi boss), gli **usi dei modelli** di stanza della run (per non ripetere le stanze fra i piani) e
 * le formule del Teatro:
 *
 *   pianoNelCiclo(p) = ((p − 1) mod piani_per_ciclo) + 1          ciclo(p) = ⌊(p − 1) / piani_per_ciclo⌋ + 1
 *   moltCiclo(p)     = molt_ciclo ^ (ciclo(p) − 1)                 (Teatro: 1,45 ^ (ciclo − 1))
 *   moltVelocita(p)  = min(molt_vel_max, 1 + (p − 1) × molt_vel_per_piano)   (Teatro: min(1,55, 1 + (p − 1) × 0,045))
 *   vitaBoss(p)      = max(vita_min, round((hpBaseTeatro × scala_vita_teatro + (pianoNelCiclo(p) − 1) × vita_per_piano_ciclo) × moltCiclo(p)))
 *   bossDelPiano(p)  = finale se pianoNelCiclo(p) = piano_finale_nel_ciclo, altrimenti estratti[(p − 1) mod n]   (Teatro ~3394)
 *
 * Il pool degli oggetti (`oggetti/pool.js`), la Fucina e i piedistalli si preparano per piano ascoltando
 * `run.piano`: questo modulo non li conosce (dipendenze verso il basso, eventi verso l'alto).
 * Nessun numero di gioco qui: tutto da `contenuti/parametri/boss.json` (tabella: si leggono i `.base`).
 *
 * Eventi: `run.nuova` {seme, boss[]}, `run.piano` {piano, ciclo, pianoNelCiclo, boss, finale}.
 */

import { creaRng, derivato, mescola } from '../fondazione/rng.js';

/** Etichetta del generatore derivato che estrae l'ordine dei boss della run (ADR-0003). */
export const ETICHETTA_BOSS_RUN = 'boss-run';

/**
 * @typedef {{ id: string, nome: string, archetipoBase: string, pattern: string, scalaRaggio: number, scalaPortata: number,
 *   hpBaseTeatro: number, idStoria?: string | null }} InfoBoss
 */

/**
 * Crea lo stato della run.
 * @param {{ tabella: object, seme: number, eventi?: { emit: Function } | null }} o `tabella` è `parametri.get('boss')`
 */
export function creaRun({ tabella, seme, eventi = null }) {
  if (!tabella || !Array.isArray(tabella.pool) || !tabella.finale) throw new TypeError('creaRun: manca la tabella dei boss (boss.json)');
  const T = (k) => {
    const v = tabella[k];
    if (!v || typeof v.base !== 'number') throw new RangeError(`creaRun: boss.json non ha '${k}'`);
    return v.base;
  };
  const s = { seme: 0, piano: 0, estratti: [], usiModelli: {}, forzato: null };

  /** Piano dentro il ciclo (1..piani_per_ciclo). */
  function pianoNelCiclo(p) { return ((p - 1) % T('piani_per_ciclo')) + 1; }
  /** Numero del ciclo (1 al primo giro). */
  function cicloDi(p) { return Math.floor((p - 1) / T('piani_per_ciclo')) + 1; }
  /** Moltiplicatore di vita dei nemici e dei boss per ciclo. */
  function moltCiclo(p) { return Math.pow(T('molt_ciclo'), cicloDi(p) - 1); }
  /** Moltiplicatore di velocità per piano assoluto (con tetto). */
  function moltVelocita(p) { return Math.min(T('molt_vel_max'), 1 + (p - 1) * T('molt_vel_per_piano')); }
  /** Vero sul piano di Donna Luciana. */
  function eFinale(p) { return pianoNelCiclo(p) === T('piano_finale_nel_ciclo'); }
  /** Bonus percentuale del ciclo mostrato nel sipario del «BIS» (dal moltiplicatore vero). */
  function bonusCicloPct(p) { return Math.round((moltCiclo(p) - 1) * 100); }
  function estrai(semeRun) { return mescola(derivato(creaRng(semeRun >>> 0), ETICHETTA_BOSS_RUN), tabella.pool); }

  /**
   * Il boss del piano `p`: Donna Luciana sul piano finale del ciclo, altrimenti il prossimo dell'estrazione
   * (un boss forzato con `forzaBoss` vince su tutto: strumento di QA).
   * @param {number} p
   * @returns {InfoBoss}
   */
  function bossDelPiano(p) {
    if (s.forzato) return s.forzato;
    if (eFinale(p)) return tabella.finale;
    const lista = s.estratti.length ? s.estratti : estrai(s.seme);
    return lista[(p - 1) % lista.length];
  }

  /**
   * Vita del boss del piano `p` (formula del Teatro ~3395, scalata da `scala_vita_teatro`).
   * @param {number} p
   * @param {InfoBoss} [info] boss diverso da quello estratto
   */
  function vitaBoss(p, info = bossDelPiano(p)) {
    const base = info.hpBaseTeatro * T('scala_vita_teatro');
    return Math.max(T('vita_min'), Math.round((base + (pianoNelCiclo(p) - 1) * T('vita_per_piano_ciclo')) * moltCiclo(p)));
  }

  /** Avvia una run nuova da `semeRun`: piano 0, modelli non usati, boss riestratti. */
  function nuova(semeRun) {
    s.seme = semeRun >>> 0;
    s.piano = 0;
    s.usiModelli = {};
    s.estratti = estrai(s.seme);
    eventi?.emit('run.nuova', { seme: s.seme, boss: s.estratti.map((b) => b.id) });
    return s.seme;
  }
  /** Seme della run successiva senza `?seme=` (passo fisso, mai l'orologio: ADR-0003). */
  function prossimoSeme() { return (s.seme + T('passo_seme_run')) >>> 0; }
  /** Seme con cui si genera la pianta del piano `p` (Teatro: seme + piano × sale). */
  function semeStanze(p) { return s.seme + p * T('seme_sale'); }
  /** Entra nel piano `p`: lo stato della run lo ricorda ed emette `run.piano`. Ritorna il boss del piano. */
  function vaiAlPiano(p) {
    s.piano = p;
    const info = bossDelPiano(p);
    eventi?.emit('run.piano', { piano: p, ciclo: cicloDi(p), pianoNelCiclo: pianoNelCiclo(p), boss: info.id, finale: eFinale(p) });
    return info;
  }
  /** QA: forza il boss di ogni piano (id del pool o del finale); null o id ignoto toglie la forzatura. */
  function forzaBoss(id) {
    const tutti = [...tabella.pool, tabella.finale];
    s.forzato = id ? tutti.find((b) => b.id === id) ?? null : null;
    return s.forzato;
  }
  /** L'id di storia.json di un boss (per `boss_battuti`), o null se la storia non lo conosce. */
  function idStoriaDi(id) {
    const info = [...tabella.pool, tabella.finale].find((b) => b.id === id);
    return info?.idStoria ?? null;
  }

  nuova(seme);

  return {
    get seme() { return s.seme; },
    get piano() { return s.piano; },
    get ciclo() { return s.piano > 0 ? cicloDi(s.piano) : 1; },
    get pianiPerCiclo() { return T('piani_per_ciclo'); },
    get bossEstratti() { return s.estratti.map((b) => b.id); },
    get forzato() { return s.forzato?.id ?? null; },
    get usiModelli() { return s.usiModelli; },
    set usiModelli(v) { s.usiModelli = v ?? {}; },
    get finale() { return tabella.finale; },
    get pool() { return tabella.pool.slice(); },
    pianoNelCiclo, cicloDi, moltCiclo, moltVelocita, eFinale, bonusCicloPct, bossDelPiano, vitaBoss,
    nuova, prossimoSeme, semeStanze, vaiAlPiano, forzaBoss, idStoriaDi,
  };
}
