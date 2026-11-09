/**
 * motore/attori/statistiche.js — Statistiche alla Isaac del corpo giocabile (storia P04, Teatro).
 *
 * Riproduce `ricalcolaStatisticheIsaac` del Teatro (teatro_marionette.html ~2652-2700) come funzione
 * PURA: dal personaggio scelto (`personaggi.json`), dai doni equipaggiati (blocco `teatro.mod` di
 * `doni.json`) e dai patti stretti (`patto.json`) calcola
 * `{ dmg, tearsPerSec, cooldownTicks, speed, range, maxHpHalf, maschereMax, flags, projScale, tipoProiettile }`.
 *
 * Formule del Teatro (costanti nel blocco `isaac` di personaggi.json):
 *   dmg          = max(dmg_min, (baseDmg × sqrt(max(0, ΣdmgUp × dmg_k + 1)) + ΣflatDmg) × ΠdmgMult)
 *   tearsPerSec  = clamp((tears_base + ΣtearsUp × tears_per_up) × ΠtearsMult, tears_min, tears_max)
 *   cooldownTicks = max(cooldown_min_ticks, round(tick_al_secondo / tearsPerSec))
 *   speed        = clamp(baseSpd + ΣspeedUp, speed_min, speed_max)   (moltiplicatore di ferruccio.v_base)
 *   range        = min(range_max, range_base + ΣrangeUp) × scala_px  (px del motore)
 *   maxHpHalf    = clamp(hpHalf + ΣbonusMaxHp − ΣcostoMaxHpHalf dei patti, hp_half_min, hp_half_max)
 *   maschereMax  = ceil(maxHpHalf / 2): il corpo del motore conta maschere intere (decisione documentata nel README).
 *
 * `applicaAlModificatori` traduce il risultato in voci dei modificatori (origine 'personaggio'):
 *   combattimento.danno ← imposta dmg, ferruccio.v_base ← moltiplica speed, ferruccio.maschere_max ← imposta maschereMax.
 * Nessun numero di gioco qui: tutto viene dai JSON iniettati. Dipendenze: nessuna (modulo puro).
 */

/** Chiavi booleane di `mod` che diventano flag (Teatro: haSpada, triplo, doppia, quadDir, piercing, overflowPierce, burn, chain). */
export const FLAG_MOD = Object.freeze(['spada', 'triplo', 'doppia', 'quadDir', 'piercing', 'overflowPierce', 'burn', 'chain']);

/** Origine delle voci dei modificatori scritte da `applicaAlModificatori`. */
export const ORIGINE_PERSONAGGIO = 'personaggio';

const base = (v) => (v && typeof v === 'object' && 'base' in v ? v.base : v);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Somma i `mod` di una lista di oggetti (doni con `teatro.mod`, patti con `mod`, personaggio con il passivo iniziale).
 * @param {object[]} mods lista di `mod` del Teatro
 */
export function sommaMod(mods) {
  const acc = {
    dmgUp: 0, flatDmg: 0, dmgMult: 1, tearsUp: 0, tearsMult: 1, speedUp: 0, rangeUp: 0, bonusMaxHp: 0, healOnEquip: 0,
    tipoProiettile: 'base', size: 1, flags: Object.fromEntries(FLAG_MOD.map((f) => [f, false])),
  };
  for (const m of mods) {
    if (!m) continue;
    if (m.dmgUp) acc.dmgUp += m.dmgUp;
    if (m.flatDmg) acc.flatDmg += m.flatDmg;
    if (m.dmgMult) acc.dmgMult *= m.dmgMult;
    if (m.tearsUp) acc.tearsUp += m.tearsUp;
    if (m.tearsMult) acc.tearsMult *= m.tearsMult;
    if (m.speedUp) acc.speedUp += m.speedUp;
    if (m.rangeUp) acc.rangeUp += m.rangeUp;
    if (m.bonusMaxHp) acc.bonusMaxHp += m.bonusMaxHp;
    if (m.healOnEquip) acc.healOnEquip += m.healOnEquip;
    if (m.tipoProiettile) acc.tipoProiettile = m.tipoProiettile;
    if (m.size) acc.size = Math.max(acc.size, m.size);
    for (const f of FLAG_MOD) if (m[f]) acc.flags[f] = true;
  }
  return acc;
}

/**
 * Calcola le statistiche alla Isaac.
 * @param {{
 *   personaggio: { hpHalf: number, baseDmg: number, baseSpd: number, passivoIniziale?: string|null },
 *   isaac: object,                       blocco `isaac` di personaggi.json ({base,min,max} o numeri)
 *   doni?: object[],                     doni equipaggiati: oggetti del catalogo (si legge `teatro.mod`) o `mod` diretti
 *   patti?: { costoMaxHpHalf?: number, mod?: object }[],
 *   catalogo?: object[],                 catalogo dei doni, per risolvere `passivoIniziale` (id del Teatro o del motore)
 * }} o
 */
export function calcolaStatistiche({ personaggio, isaac, doni = [], patti = [], catalogo = [] }) {
  if (!personaggio || !isaac) throw new TypeError('calcolaStatistiche: personaggio e isaac obbligatori');
  const k = (nome) => base(isaac[nome]);
  const mods = [];
  if (personaggio.passivoIniziale) {
    const dono = catalogo.find((d) => d.teatro?.id_teatro === personaggio.passivoIniziale || d.id === personaggio.passivoIniziale);
    if (dono) mods.push(dono.teatro?.mod ?? null);
  }
  for (const d of doni) mods.push(d?.teatro?.mod ?? (d && !('id' in d) ? d : null));
  let costoPatti = 0;
  for (const p of patti) {
    mods.push(p?.mod ?? null);
    costoPatti += p?.costoMaxHpHalf ?? 0;
  }
  const s = sommaMod(mods);
  const dmg = Math.max(k('dmg_min'), (personaggio.baseDmg * Math.sqrt(Math.max(0, s.dmgUp * k('dmg_k') + 1)) + s.flatDmg) * s.dmgMult);
  const tearsPerSec = clamp((k('tears_base') + s.tearsUp * k('tears_per_up')) * s.tearsMult, k('tears_min'), k('tears_max'));
  const cooldownTicks = Math.max(k('cooldown_min_ticks'), Math.round(k('tick_al_secondo') / tearsPerSec));
  const speed = clamp(personaggio.baseSpd + s.speedUp, k('speed_min'), k('speed_max'));
  const range = Math.min(k('range_max'), k('range_base') + s.rangeUp) * k('scala_px');
  const maxHpHalf = clamp(personaggio.hpHalf + s.bonusMaxHp - costoPatti, k('hp_half_min'), k('hp_half_max'));
  return {
    dmg, tearsPerSec, cooldownTicks, speed, range, maxHpHalf,
    maschereMax: Math.ceil(maxHpHalf / 2),
    flags: s.flags,
    tipoProiettile: s.tipoProiettile,
    projScale: s.size,
    healOnEquip: s.healOnEquip,
  };
}

/**
 * Traduce le statistiche in voci dei modificatori del motore. Ritorna la funzione che le toglie.
 * @param {{ applica: (v: { statistica: string, operazione: string, valore: number, origine?: string }) => () => void }} modificatori
 * @param {{ dmg: number, speed: number, maschereMax: number }} stat
 * @returns {() => void}
 */
export function applicaAlModificatori(modificatori, stat) {
  const via = [
    modificatori.applica({ statistica: 'combattimento.danno', operazione: 'imposta', valore: stat.dmg, origine: ORIGINE_PERSONAGGIO }),
    modificatori.applica({ statistica: 'ferruccio.v_base', operazione: 'moltiplica', valore: stat.speed, origine: ORIGINE_PERSONAGGIO }),
    modificatori.applica({ statistica: 'ferruccio.maschere_max', operazione: 'imposta', valore: stat.maschereMax, origine: ORIGINE_PERSONAGGIO }),
  ];
  return () => { for (const f of via) if (typeof f === 'function') f(); };
}

/**
 * Stato vivo delle statistiche: personaggio corrente, patti stretti, ricalcolo quando cambiano i doni.
 * @param {{
 *   tabella: { personaggi: Record<string, object>, isaac: object, predefinito?: string },
 *   modificatori: { applica: Function, doniAttivi: () => string[], dono: (id: string) => object | null },
 *   patti?: object[]
 * }} o
 */
export function creaStatistiche({ tabella, modificatori, patti = [] }) {
  if (!tabella?.personaggi || !tabella.isaac || !modificatori) throw new TypeError('creaStatistiche: tabella e modificatori obbligatori');
  const catalogo = typeof modificatori.catalogo === 'function' ? modificatori.catalogo().map((id) => modificatori.dono(id)).filter(Boolean) : [];
  let idPersonaggio = tabella.predefinito ?? Object.keys(tabella.personaggi)[0];
  let strettiPatti = patti.slice();
  let corrente = null;
  let togli = null;
  let firma = '';
  let scelto = false; // finché è falso `correnti()` è null: Ferruccio con i valori del GDD (QA senza `?personaggio=`)

  function ricalcola() {
    const personaggio = tabella.personaggi[idPersonaggio];
    const doni = modificatori.doniAttivi().map((id) => modificatori.dono(id)).filter(Boolean);
    corrente = calcolaStatistiche({ personaggio, isaac: tabella.isaac, doni, patti: strettiPatti, catalogo });
    if (togli) togli();
    togli = applicaAlModificatori(modificatori, corrente);
    firma = `${idPersonaggio}|${modificatori.doniAttivi().join(',')}|${strettiPatti.map((p) => p.id).join(',')}`;
    return corrente;
  }

  return {
    /** Sceglie il personaggio (id di personaggi.json) e ricalcola. */
    scegli(id) {
      if (!tabella.personaggi[id]) throw new RangeError(`statistiche: personaggio sconosciuto '${id}'`);
      idPersonaggio = id;
      scelto = true;
      return ricalcola();
    },
    /** Stringe un patto (voce di patto.json) e ricalcola. */
    stringiPatto(patto) { strettiPatti.push(patto); return ricalcola(); },
    get personaggio() { return tabella.personaggi[idPersonaggio]; },
    get id() { return idPersonaggio; },
    get attive() { return scelto; },
    get patti() { return strettiPatti.slice(); },
    /** Statistiche correnti (ricalcolate se i doni sono cambiati). */
    correnti() {
      if (!scelto) return null;
      const f = `${idPersonaggio}|${modificatori.doniAttivi().join(',')}|${strettiPatti.map((p) => p.id).join(',')}`;
      if (!corrente || f !== firma) ricalcola();
      return corrente;
    },
    ricalcola,
    /** Toglie le voci dai modificatori (fine della run). */
    azzera() { if (togli) togli(); togli = null; corrente = null; strettiPatti = []; scelto = false; },
  };
}
