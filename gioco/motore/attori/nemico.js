/**
 * motore/attori/nemico.js — Fabbrica generica dei nemici (nemici.md, storia 019).
 *
 * Un nemico è: una **scheda** letta da `contenuti/parametri/nemici.json` per archetipo e scalata
 * per piano (F1 vita, F2 velocità con tetto `v_cap`, F3 anticipo; il lampo non scala mai, R3),
 * un **corpo** (cerchio `x, y, r`, peso, vita) che si muove nel campo e si separa dagli altri
 * nemici (§8.5: raggio `r_i + r_j + extra`, pesanti mai spostati dai leggeri, volanti solo tra
 * volanti), l'**IA base** (`ia/base.js`), il **contratto del combattimento**
 * `{x, y, r, vita, peso, imparabile, pesante, stato, colpisci(danno, spinta), stordisci(ms)}`, e la
 * **morte** (§9): a `vita ≤ 0` perde subito hitbox, gettone e posto tra i vivi, emette
 * `nemico.morto`, si dissolve in `t_dissoluzione` (`dissoluzione` 0→1, `puntini` = pezzi) e a
 * `t_bottino` emette `nemico.bottino` con le monete (`ceil(costo/2)` + extra uniforme) e il cuore
 * (i payload portano `boss`: la storia 025, `oggetti/economia.js`, decide da sola il drop con la tabella di economia.json)
 * (F9, con `ferito()` iniettato; senza, p = 0).
 *
 * Il Colpo ferisce Ferruccio SOLO attraverso la facciata `comeBersaglio` del combattimento
 * (`bersaglio.colpisci(attacco)`), che decide tra parata e danno e richiama `stordisci` (regola 5):
 * la hitbox è un rettangolo spazzato lungo la direzione fissata (o il tratto percorso quando il
 * corpo `avanza`), oppure un settore (`settore_gradi`). Il danno è al primo contatto.
 * Armatura del telegrafo (prototipo): in anticipo/lampo/colpo il danno si applica ma non
 * interrompe e la spinta è ignorata.
 *
 * Storia 020: chiavi facoltative della scheda lette se presenti nel JSON — `omega_attesa` (orbita
 * sull'anello d'attesa), `attacco.t_anello`, `attacco.balzo_extra` + `attacco.balzo_min` (portata
 * dinamica `clamp(d_lampo + extra, min, portata)`), `attacco.hit_dal` (hitbox accesa da quella quota
 * del Colpo: impatto costante). La hitbox del Colpo copre dal punto `hit_dal × L` all'atterraggio
 * (`L` = portata corrente). `segnoATerra()` è la striscia fissata all'inizio del lampo (GDD 4.1).
 * Un gancio `posa` opzionale (es. `attori/gatto.js`) descrive la sagoma per il renderer.
 *
 * Storia P01 (PROVVISORIA, build di prova; la storia 022 porta la scheda vera del boss): `schedaBoss`
 * `{ vita, scalaRaggio, scalaPortata }` sostituisce la vita della scheda (non scalata per piano) e
 * moltiplica il raggio del corpo e la geometria dell'attacco (portata, banda, balzo); si costruisce con
 * `schedaBossProvvisorio()` da `nemici.boss_provvisorio`. Il flag `boss` resta quello della storia 019.
 *
 * Nessun numero di gioco qui; nessuna casualità nativa: `rng` è un generatore derivato (pattuglia,
 * verso di separazione, verso dell'orbita, bottino).
 */

import { muoviCerchio, separazioneCerchi, lineaLibera as lineaLiberaCampo, rettangoloColpisceCerchio, settoreColpisceCerchio } from '../mondo/fisica.js';
import { intero } from '../fondazione/rng.js';
import { creaIaBase, STATI_TELEGRAFO } from './ia/base.js';

/** Archetipi dell'MVP (chiavi di `nemici.archetipi`). */
export const ARCHETIPI_MVP = Object.freeze(['gatto', 'vespa', 'statua', 'guardia']);

/** Chiavi numeriche di una scheda e del suo attacco (lette con `modificatori.valore`, ADR-0002). */
const CHIAVI_SCHEDA = Object.freeze(['vita', 'r', 'peso', 'r_aggro', 'r_lose', 'v_pattuglia', 'v_insegue', 'd_attesa', 'costo', 'pezzi', 'volante']);
const CHIAVI_ATTACCO = Object.freeze(['t_ant', 't_lamp', 't_imp', 't_rec', 't_cd', 'd_min', 'd_max', 'portata', 'larghezza', 'settore_gradi', 'pesante', 'imparabile', 'avanza', 'linea_libera']);
/** Chiavi facoltative (storia 020): lette solo se il JSON le ha, altrimenti il valore di riposo indicato. */
const FACOLTATIVE_SCHEDA = Object.freeze({ omega_attesa: 0 });
const FACOLTATIVE_ATTACCO = Object.freeze({ t_anello: 0, balzo_extra: null, balzo_min: null, hit_dal: 0 });

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// ---------------------------------------------------------------------------------------------
// Formule (pure, testabili)
// ---------------------------------------------------------------------------------------------

/**
 * F1: `vita(n) = max(1, round(vita_base × (1 + k_vita × (n − 1))))`.
 * @param {number} vitaBase
 * @param {number} piano 1-5
 * @param {number} kVita
 */
export function scalaVita(vitaBase, piano, kVita) {
  return Math.max(1, Math.round(vitaBase * (1 + kVita * (piano - 1))));
}

/**
 * F2: `v(n) = min(v_cap, v_base × (1 + k_vel × (n − 1)))`; 0 resta 0.
 * @param {number} vBase
 * @param {number} piano
 * @param {number} kVel
 * @param {number} vCap
 */
export function scalaVelocita(vBase, piano, kVel, vCap) {
  return Math.min(vCap, vBase * (1 + kVel * (piano - 1)));
}

/**
 * F3: `t_ant(n) = max(t_ant_min, round(t_ant_base × (1 − k_tel × (n − 1))))`.
 * @param {number} tAntBase ms
 * @param {number} piano
 * @param {number} kTel
 * @param {number} tAntMin ms
 */
export function scalaAnticipo(tAntBase, piano, kTel, tAntMin) {
  return Math.max(tAntMin, Math.round(tAntBase * (1 - kTel * (piano - 1))));
}

/**
 * §9.4 monete: `ceil(costo/2) + U[0, extra]`, × moltiplicatore élite.
 * @param {{ costo: number, extra: number, rng: () => number, elite?: boolean, moltElite?: number }} o
 */
export function monetePerMorte({ costo, extra, rng, elite = false, moltElite = 1 }) {
  const base = Math.ceil(costo / 2) + intero(rng, 0, Math.max(0, Math.round(extra)));
  return elite ? base * moltElite : base;
}

/**
 * F9: `p_cuore = clamp(p_0 × costo × m_ferito, 0, 1)`; `m_ferito` vale 0 a maschere piene.
 * @param {{ p0: number, costo: number, ferito: boolean, mFerito: number }} o
 */
export function probabilitaCuore({ p0, costo, ferito, mFerito }) {
  return clamp(p0 * costo * (ferito ? mFerito : 0), 0, 1);
}

/**
 * Scheda di un archetipo scalata per piano, in unità del motore (px, px/s, ms).
 * @param {{ modificatori: { valore: (nome: string) => number }, parametri: { get: Function, ha: Function }, archetipo: string, piano?: number }} o
 */
export function schedaArchetipo({ modificatori, parametri, archetipo, piano = 1 }) {
  const radice = `nemici.archetipi.${archetipo}`;
  if (!parametri.ha(radice)) throw new RangeError(`schedaArchetipo: archetipo sconosciuto '${archetipo}'`);
  const val = (k) => modificatori.valore(`${radice}.${k}`);
  const S = (k) => modificatori.valore(`nemici.scalatura.${k}`);
  const G = (k) => modificatori.valore(`nemici.globali.${k}`);
  const scheda = {};
  for (const k of CHIAVI_SCHEDA) scheda[k] = val(k);
  for (const [k, riposo] of Object.entries(FACOLTATIVE_SCHEDA)) scheda[k] = parametri.ha(`${radice}.${k}`) ? val(k) : riposo;
  const attacco = {};
  for (const k of CHIAVI_ATTACCO) attacco[k] = val(`attacco.${k}`);
  for (const [k, riposo] of Object.entries(FACOLTATIVE_ATTACCO)) attacco[k] = parametri.ha(`${radice}.attacco.${k}`) ? val(`attacco.${k}`) : riposo;
  scheda.vita = scalaVita(scheda.vita, piano, S('k_vita'));
  scheda.v_pattuglia = scalaVelocita(scheda.v_pattuglia, piano, S('k_vel'), G('v_cap'));
  scheda.v_insegue = scalaVelocita(scheda.v_insegue, piano, S('k_vel'), G('v_cap'));
  attacco.t_ant = scalaAnticipo(attacco.t_ant, piano, S('k_tel'), S('t_ant_min'));
  scheda.attacco = attacco;
  return scheda;
}

/**
 * Storia P01: la taglia del boss provvisorio da `nemici.boss_provvisorio` (null se il blocco manca:
 * il boss sarebbe un nemico comune con il solo flag `boss`).
 * @param {{ modificatori: { valore: (nome: string) => number }, parametri: { ha: (chiave: string) => boolean } }} o
 * @returns {{ vita: number, scalaRaggio: number, scalaPortata: number } | null}
 */
export function schedaBossProvvisorio({ modificatori, parametri }) {
  const radice = 'nemici.boss_provvisorio';
  if (!parametri.ha(radice)) return null;
  const v = (k) => modificatori.valore(`${radice}.${k}`);
  return { vita: v('vita'), scalaRaggio: v('scala_raggio'), scalaPortata: v('scala_portata') };
}

/**
 * Applica la taglia del boss a una scheda scalata (pura: ritorna una copia). Vita sostituita e mai sotto 1;
 * raggio × `scalaRaggio`; portata, `d_min`, `d_max`, `balzo_min`, `balzo_extra` × `scalaPortata`.
 * @param {object} scheda da `schedaArchetipo`
 * @param {{ vita: number, scalaRaggio: number, scalaPortata: number }} taglia
 */
export function applicaSchedaBoss(scheda, taglia) {
  const a = { ...scheda.attacco };
  for (const k of ['portata', 'd_min', 'd_max']) a[k] *= taglia.scalaPortata;
  for (const k of ['balzo_min', 'balzo_extra']) if (a[k] !== null && a[k] !== undefined) a[k] *= taglia.scalaPortata;
  return { ...scheda, vita: Math.max(1, Math.round(taglia.vita)), r: scheda.r * taglia.scalaRaggio, attacco: a };
}

/**
 * Regole del telegrafo sui dati (R2, R4): errori in parole, vuoto se tutto va bene.
 * @param {{ get: Function }} parametri
 * @returns {string[]}
 */
export function validaSchede(parametri) {
  const errori = [];
  const archetipi = parametri.get('nemici.archetipi');
  const minPar = parametri.get('nemici.scalatura.t_lamp_min_parabile');
  const minImp = parametri.get('nemici.scalatura.t_lamp_min_imparabile');
  const tAntMin = parametri.get('nemici.scalatura.t_ant_min');
  for (const [id, scheda] of Object.entries(archetipi)) {
    if (id.startsWith('_')) continue;
    const a = scheda.attacco;
    const minimo = a.imparabile.base ? minImp : minPar;
    if (a.t_lamp.base < minimo) errori.push(`${id}: t_lamp ${a.t_lamp.base} < ${minimo} (R2)`);
    if (a.t_ant.base < tAntMin) errori.push(`${id}: t_ant ${a.t_ant.base} < ${tAntMin} (R4)`);
    if (a.t_anello && a.t_anello.base > a.t_lamp.base) errori.push(`${id}: t_anello ${a.t_anello.base} > t_lamp ${a.t_lamp.base}`);
    if (a.balzo_min && a.balzo_min.base > a.portata.base) errori.push(`${id}: balzo_min ${a.balzo_min.base} > portata ${a.portata.base}`);
    if (scheda.pezzi.base < 3 || scheda.pezzi.base > 6) errori.push(`${id}: pezzi ${scheda.pezzi.base} fuori da 3-6`);
  }
  return errori;
}

// ---------------------------------------------------------------------------------------------
// La fabbrica
// ---------------------------------------------------------------------------------------------

/**
 * Crea un nemico di un archetipo.
 * @param {{
 *   modificatori: { valore: (nome: string) => number },
 *   parametri: { get: Function, ha: Function },
 *   tempo: { ticksDaMs: (ms: number) => number },
 *   eventi?: { emit: Function },
 *   campo: import('../mondo/fisica.js').Campo,
 *   bersaglio?: { x: number, y: number, r: number, stato: string, colpisci: Function } | null,
 *   altri?: () => object[],
 *   direttore?: object | null,
 *   rng: () => number,
 *   archetipo: string, piano?: number, x: number, y: number, id?: string,
 *   boss?: boolean, elite?: boolean, ferito?: () => boolean,
 *   posa?: ((nemico: object) => object) | null,
 *   schedaBoss?: { vita: number, scalaRaggio: number, scalaPortata: number } | null
 * }} o `altri` ritorna la lista dei bersagli (per la separazione); `ferito` dice se Ferruccio ha maschere non piene;
 *   `posa` descrive la sagoma per stato (storia 020, `attori/gatto.js`); `schedaBoss` è la taglia del boss provvisorio (storia P01)
 */
export function creaNemico({
  modificatori, parametri, tempo, eventi = null, campo, bersaglio = null, altri = () => [], direttore = null, rng,
  archetipo, piano = 1, x, y, id = archetipo, boss = false, elite = false, ferito = () => false, posa = null, schedaBoss = null,
}) {
  if (!modificatori || !parametri || !tempo || !campo || typeof rng !== 'function') throw new TypeError('creaNemico: dipendenze mancanti');
  const schedaBase = schedaArchetipo({ modificatori, parametri, archetipo, piano });
  const scheda = schedaBoss ? applicaSchedaBoss(schedaBase, schedaBoss) : schedaBase;
  const G = (k) => modificatori.valore(`nemici.globali.${k}`);
  const D = (k) => modificatori.valore(`nemici.drop.${k}`);
  const ticks = (ms) => tempo.ticksDaMs(ms);
  const A = scheda.attacco;
  const versoOrbita = rng() < 0.5 ? -1 : 1; // GDD 4.1: verso dell'orbita alternato per gatto (dal seme)

  const corpo = {
    x, y, r: scheda.r, vita: scheda.vita, vitaMax: scheda.vita, peso: scheda.peso + (elite ? 1 : 0),
    volante: scheda.volante > 0,
    spinta: { vx: 0, vy: 0, ticks: 0, totale: 0 },
    morto: false, dissoluzioneTicks: 0, bottinoDato: false, cuoreDato: false, cuore: false, monete: 0,
    immunitaTicks: 0, stordimentoMs: 0,
    danniSubiti: [], spinteSubite: [], impatti: [],
  };

  /** Campo di movimento: i volanti sorvolano gli ostacoli ma non i muri. */
  let cacheSolidi = null;
  let campoVolo = null;
  const campoDi = () => {
    if (!corpo.volante) return campo;
    if (cacheSolidi !== campo.solidi) {
      cacheSolidi = campo.solidi;
      campoVolo = { ...campo, solidi: campo.solidi.filter((s) => s.id === 'muro') };
    }
    return campoVolo;
  };

  function muovi(dx, dy) {
    const e = muoviCerchio(campoDi(), corpo.x, corpo.y, corpo.r, dx, dy);
    corpo.x = e.x;
    corpo.y = e.y;
    return e.urto;
  }

  /** Larghezza della capsula del Colpo: almeno il corpo quando il corpo avanza (GDD: 2r). */
  const larghezzaColpo = () => (A.avanza ? Math.max(A.larghezza, corpo.r * 2) : A.larghezza);

  /**
   * Hitbox del Colpo (debug e test geometrico); `null` fuori dal colpo o prima di `hit_dal`. Parte
   * dal punto `hit_dal × L` del percorso fissato all'inizio del Colpo e copre fino all'atterraggio
   * (`L` = portata corrente: l'impatto cade a `t_lamp + hit_dal × t_imp` dal lampo, qualunque sia la
   * distanza; il corpo che `avanza` percorre `L` durante `t_imp`); settore se `settore_gradi` > 0.
   */
  function hitbox() {
    if (ia.stato !== 'colpo' || !ia.hitboxAttiva) return null;
    const dir = ia.direzione;
    const o = ia.origineColpo;
    const L = ia.portataColpo;
    if (A.settore_gradi > 0) {
      return { tipo: 'settore', x: o.x, y: o.y, angolo: Math.atan2(dir.y, dir.x), portata: L, arcoGradi: A.settore_gradi };
    }
    const da = ia.hitDal * L;
    return { tipo: 'rettangolo', x1: o.x + dir.x * da, y1: o.y + dir.y * da, x2: o.x + dir.x * L, y2: o.y + dir.y * L, larghezza: larghezzaColpo() };
  }

  /**
   * Segno a terra del telegrafo (GDD 4.1: striscia fissata all'inizio del lampo, larga come la
   * capsula, lunga quanto il Colpo); `null` fuori da lampo e colpo o per gli attacchi a settore.
   */
  function segnoATerra() {
    if ((ia.stato !== 'lampo' && ia.stato !== 'colpo') || A.settore_gradi > 0) return null;
    const dir = ia.direzione;
    const o = ia.origineLampo;
    const L = ia.portataColpo;
    return { x1: o.x, y1: o.y, x2: o.x + dir.x * L, y2: o.y + dir.y * L, larghezza: larghezzaColpo() };
  }

  /** Impatto del Colpo su Ferruccio (al primo contatto). */
  function colpisciBersaglio() {
    if (!bersaglio || bersaglio.stato === 'morto') return null;
    const h = hitbox();
    if (!h) return null;
    const cerchio = { x: bersaglio.x, y: bersaglio.y, r: bersaglio.r };
    const dentro = h.tipo === 'settore' ? settoreColpisceCerchio(h, cerchio) : rettangoloColpisceCerchio(h, cerchio);
    if (!dentro) return null;
    if (A.linea_libera && !lineaLiberaCampo(campo, corpo.x, corpo.y, bersaglio.x, bersaglio.y)) return null;
    const esito = bersaglio.colpisci({
      danno: undefined, pesante: A.pesante > 0, x: corpo.x, y: corpo.y, imparabile: A.imparabile > 0, attaccante: facciata,
    });
    corpo.impatti.push(esito);
    return esito;
  }

  const ia = creaIaBase({
    scheda: {
      r: scheda.r, rAggro: scheda.r_aggro, rLose: scheda.r_lose, vPattuglia: scheda.v_pattuglia, vInsegue: scheda.v_insegue,
      dAttesa: scheda.d_attesa, dContatto: G('d_contatto'), tolleranzaAttesa: G('tolleranza_attesa'),
      omegaAttesa: scheda.omega_attesa, versoOrbita,
      tEmersione: ticks(G('t_emersione')), tAllarme: ticks(G('t_allarme')), tPerdita: ticks(G('t_perdita')),
      tRiprova: ticks(modificatori.valore('nemici.direttore.t_riprova')),
      rPattuglia: G('r_pattuglia'), puntiMin: G('punti_pattuglia_min'), puntiMax: G('punti_pattuglia_max'),
      pausaMin: ticks(G('pausa_pattuglia_min')), pausaMax: ticks(G('pausa_pattuglia_max')),
      attacco: {
        tAnt: ticks(A.t_ant), tLamp: ticks(A.t_lamp), tImp: ticks(A.t_imp), tRec: ticks(A.t_rec), tCd: ticks(A.t_cd),
        dMin: A.d_min, dMax: A.d_max, portata: A.portata, larghezza: A.larghezza, settoreGradi: A.settore_gradi,
        pesante: A.pesante > 0, imparabile: A.imparabile > 0, avanza: A.avanza > 0, lineaLibera: A.linea_libera > 0,
        hitDal: A.hit_dal, balzoExtra: A.balzo_extra, balzoMin: A.balzo_min ?? A.portata, tAnello: A.t_anello > 0 ? ticks(A.t_anello) : 0,
      },
    },
    corpo,
    get bersaglio() { return bersaglio; },
    campo,
    rng,
    muovi,
    lineaLibera: (x1, y1, x2, y2) => lineaLiberaCampo(campo, x1, y1, x2, y2),
    colpisci: colpisciBersaglio,
    direttore,
    get chiave() { return facciata; }, // identità stabile per il direttore
    emit: (nome, payload) => eventi?.emit(nome, { archetipo, ...payload }),
    id,
    ferito: () => corpo.vita < corpo.vitaMax,
  });

  function tickSpinta(dt) {
    if (corpo.spinta.ticks <= 0) return;
    const k = corpo.spinta.ticks / corpo.spinta.totale;
    const urto = muovi(corpo.spinta.vx * k * dt, corpo.spinta.vy * k * dt);
    if (urto) corpo.spinta.ticks = 0; // edge case: la spinta si annulla al contatto con un muro
    else corpo.spinta.ticks -= 1;
  }

  /** §8.5: respinge il corpo dagli altri nemici vivi della stessa classe (terra/volo). */
  function separa() {
    const extra = G('extra_separazione');
    const dVol = G('d_separazione_volanti');
    const k = G('k_separazione');
    const inamovibile = corpo.peso >= modificatori.valore('combattimento.peso_inamovibile');
    for (const altro of altri()) {
      if (!altro || altro === facciata || altro.stato === 'morto' || altro.stato === 'emersione') continue;
      if (Boolean(altro.volante) !== corpo.volante) continue;
      const rMe = corpo.volante ? dVol / 2 : corpo.r + extra / 2;
      const rAltro = corpo.volante ? dVol / 2 : altro.r + extra / 2;
      const sep = separazioneCerchi({ x: corpo.x, y: corpo.y, r: rMe }, { x: altro.x, y: altro.y, r: rAltro }, rng() < 0.5 ? -1 : 1);
      if (!sep) continue;
      const altroInamovibile = (altro.peso ?? 0) >= modificatori.valore('combattimento.peso_inamovibile');
      if (inamovibile && !altroInamovibile) continue; // i pesanti non vengono spostati dai leggeri
      const quota = altroInamovibile && !inamovibile ? 1 : k;
      muovi(sep.x * quota, sep.y * quota);
    }
  }

  function tickMorto() {
    corpo.dissoluzioneTicks += 1;
    if (!corpo.bottinoDato && corpo.dissoluzioneTicks >= ticks(G('t_bottino'))) {
      corpo.bottinoDato = true;
      const angolo = rng() * Math.PI * 2;
      eventi?.emit('nemico.bottino', {
        id, archetipo, boss, x: corpo.x, y: corpo.y, monete: corpo.monete, cuore: false,
        direzione: { x: Math.cos(angolo), y: Math.sin(angolo) }, lancio: G('lancio_bottino'),
      });
    }
    if (!corpo.cuoreDato && corpo.cuore && corpo.dissoluzioneTicks >= ticks(G('t_cuore'))) {
      corpo.cuoreDato = true;
      eventi?.emit('nemico.bottino', { id, archetipo, boss, x: corpo.x, y: corpo.y, monete: 0, cuore: true, direzione: { x: 0, y: -1 }, lancio: 0 });
    }
  }

  /**
   * Avanza di un passo fisso.
   * @param {number} dt secondi
   */
  function tick(dt) {
    if (corpo.morto) {
      tickMorto();
      return;
    }
    if (corpo.immunitaTicks > 0) corpo.immunitaTicks -= 1;
    tickSpinta(dt);
    ia.tick(dt);
    if (!corpo.morto && ia.stato !== 'emersione') separa();
  }

  /**
   * Subisce un colpo di Ferruccio (combattimento.md regole 6-7).
   * @param {number} danno decimale
   * @param {{ x: number, y: number, ms: number } | null} spinta
   */
  function colpisci(danno, spinta) {
    if (corpo.morto || ia.stato === 'emersione') return; // emersione invulnerabile (§7)
    corpo.vita -= danno;
    corpo.danniSubiti.push(danno);
    if (spinta && !ia.inTelegrafo) { // armatura del telegrafo: la spinta non sposta chi sta attaccando
      corpo.spinteSubite.push({ x: spinta.x, y: spinta.y });
      const n = tempo.ticksDaMs(spinta.ms);
      corpo.spinta = { vx: spinta.x, vy: spinta.y, ticks: n, totale: n };
    }
    if (corpo.vita <= 0) muori();
  }

  /** §9.1-9.4: entra in Morto, estrae il bottino, emette `nemico.morto`. */
  function muori() {
    if (corpo.morto) return;
    corpo.morto = true;
    corpo.vita = Math.min(corpo.vita, 0);
    ia.muori();
    corpo.monete = monetePerMorte({ costo: scheda.costo, extra: D('monete_extra'), rng, elite, moltElite: D('molt_monete_elite') });
    const p = probabilitaCuore({ p0: D('p_0_cuore'), costo: scheda.costo, ferito: Boolean(ferito()), mFerito: D('m_ferito') });
    corpo.cuore = rng() < p;
    eventi?.emit('nemico.morto', {
      id, archetipo, boss, x: corpo.x, y: corpo.y, monete: corpo.monete, cuore: corpo.cuore, pezzi: scheda.pezzi,
      tDissoluzione: G('t_dissoluzione'),
    });
  }

  /**
   * Stordimento da parata riuscita (regola 5). Il boss usa `t_stordito_boss` e poi è immune per
   * `t_immunita_boss`; un nemico già stordito non si prolunga (edge case stun-lock).
   * @param {number} ms
   */
  function stordisci(ms) {
    if (corpo.morto) return false;
    if (boss && corpo.immunitaTicks > 0) return false;
    const durata = boss ? G('t_stordito_boss') : ms;
    const ok = ia.stordisci(ticks(durata));
    if (!ok) return false;
    corpo.stordimentoMs = durata;
    if (boss) corpo.immunitaTicks = ticks(G('t_immunita_boss'));
    return true;
  }

  const facciata = {
    get id() { return id; },
    get archetipo() { return archetipo; },
    get piano() { return piano; },
    get boss() { return boss; },
    get elite() { return elite; },
    get x() { return corpo.x; },
    set x(v) { corpo.x = v; },
    get y() { return corpo.y; },
    set y(v) { corpo.y = v; },
    get r() { return corpo.r; },
    get vita() { return corpo.vita; },
    get vitaMax() { return corpo.vitaMax; },
    get peso() { return corpo.peso; },
    get volante() { return corpo.volante; },
    get imparabile() { return A.imparabile > 0 && STATI_TELEGRAFO.includes(ia.stato); },
    get pesante() { return A.pesante > 0; },
    get stato() { return corpo.morto ? 'morto' : ia.stato; },
    get lampoAcceso() { return ia.lampoAcceso; },
    get direzione() { return ia.direzione; },
    get gettone() { return ia.gettone; },
    get inTelegrafo() { return ia.inTelegrafo; },
    get stordimentoMs() { return corpo.stordimentoMs; },
    get immune() { return corpo.immunitaTicks > 0; },
    /** 0 → 1 durante la dissoluzione; 0 da vivo. */
    get dissoluzione() { return corpo.morto ? Math.min(1, corpo.dissoluzioneTicks / Math.max(1, ticks(G('t_dissoluzione')))) : 0; },
    get dissolto() { return corpo.morto && corpo.dissoluzioneTicks >= ticks(G('t_dissoluzione')); },
    get puntini() { return scheda.pezzi; },
    get monete() { return corpo.monete; },
    get cuore() { return corpo.cuore; },
    get scheda() { return { ...scheda, attacco: { ...A } }; },
    get puntiPattuglia() { return ia.puntiPattuglia; },
    get danniSubiti() { return corpo.danniSubiti.slice(); },
    get spinteSubite() { return corpo.spinteSubite.slice(); },
    get impatti() { return corpo.impatti.slice(); },
    get esitoColpo() { return ia.esitoColpo; },
    /** Storia 020: progresso della fase, anello del lampo, portata e hitbox del Colpo corrente. */
    get progresso() { return ia.progresso; },
    get anello() { return ia.anello; },
    get portataColpo() { return ia.portataColpo; },
    get hitboxAttiva() { return ia.hitboxAttiva; },
    get hitTicks() { return ia.hitTicks; },
    get istanteImpatto() { return ia.istanteImpatto; },
    get versoOrbita() { return ia.versoOrbita; },
    dFermo: ia.dFermo,
    hitbox,
    segnoATerra,
    /** Sagoma per stato (null senza gancio `posa`). */
    posa: posa ? () => posa(facciata) : null,
    tick,
    colpisci,
    stordisci,
    /** Debug e test: forza lo stato dell'IA (es. 'insegue'). */
    forzaStato: (stato) => ia.forza(stato),
  };
  return facciata;
}
