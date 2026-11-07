/**
 * motore/mondo/generazione.js — Generatore del piano (Feature, GDD generazione-piani.md).
 *
 * Storia 016. `generaPiano` è una funzione PURA (regola 15): dal seme della notte, dal numero del
 * piano, dagli usi dei modelli, dai parametri e dal catalogo produce la pianta; nessun I/O, nessun
 * orologio, nessun profilo. Fasi per tentativo (tabella «Fasi del generatore»): dimensioni (flusso
 * `dim`, uguale per tutti i tentativi) → cammino critico (passeggiata auto-evitante, regola 6) →
 * anelli (7) → rami (8) → foglie speciali banchetto/tesoro/ricordo (9) → doppie (10) → modelli
 * pesati (19-22) → segreta (12) → ricompense con riparazione (13) → vincoli rigidi H1-H10 (16) →
 * punteggio Q (14). Si accetta il primo tentativo valido con `Q ≥ soglia_Q`; altrimenti il valido
 * con Q massimo; se nessuno è valido, il piano di riserva disegnato a mano (18) con un errore per
 * gli strumenti di QA.
 *
 * Determinismo (ADR-0003): generatori derivati per etichetta da `rng.js` — `derivato(radice,'piano')`
 * → `p<N>` → `dim` e `tentativo-<k>`; il seme di ogni stanza è `derivato(rngPiano,'stanza-<cx>-<cy>')`
 * (sostituisce il `derive(seme, sale)` numerico del GDD con lo stesso scopo). Lo stesso seme dà la
 * stessa pianta. Nessun numero di gioco: tutto da `generazione.json` e `stanze.json`.
 */

import { creaRng, derivato } from '../fondazione/rng.js';
import { VERSO_LATO, LATO_OPPOSTO } from './modelli.js';
import { profondita, nNemici, valoreRicompensa, oggettiRicompensa } from './stanza.js';

/** Lati nell'ordine di esplorazione. */
const LATI = Object.freeze(['N', 'E', 'S', 'W']);

/** Tipi idonei a confinare con la segreta (regola 12). */
export const TIPI_IDONEI_SEGRETA = Object.freeze(new Set(['normale', 'ricordo', 'tesoro', 'banchetto', 'ingresso']));

/** Foglie speciali che devono avere grado 1 (H5). */
export const FOGLIE_SPECIALI = Object.freeze(['boss', 'tesoro', 'banchetto', 'ricordo']);

/** Tipi che azzerano la serie «senza ricompensa» (regola 13). */
const TIPI_SPECIALI = new Set(['ingresso', 'tesoro', 'banchetto', 'ricordo', 'boss', 'segreta']);

const chiave = (c) => `${c[0]},${c[1]}`;
const adiacenti = (c) => LATI.map((l) => [c[0] + VERSO_LATO[l].x, c[1] + VERSO_LATO[l].y]);
const confinano = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;

/**
 * Estrazione pesata.
 * @template T
 * @param {() => number} rng
 * @param {T[]} lista
 * @param {(x: T) => number} pesoDi
 * @returns {T}
 */
function pesato(rng, lista, pesoDi) {
  const pesi = lista.map(pesoDi);
  const tot = pesi.reduce((a, b) => a + b, 0);
  let u = rng() * tot;
  for (let i = 0; i < lista.length; i++) {
    u -= pesi[i];
    if (u < 0) return lista[i];
  }
  return lista[lista.length - 1];
}

// ---------------------------------------------------------------------------------------------
// Formule
// ---------------------------------------------------------------------------------------------

/**
 * Formule `n_stanze` e `L` (dimensioni del piano) da due estrazioni del flusso `dim`.
 * @param {{ parametri: { get: Function }, piano: number, u: number, u2: number }} o
 */
export function dimensioniPiano({ parametri, piano, u, u2 }) {
  const G = (k) => parametri.get(`generazione.${k}`);
  const PP = (k) => parametri.get(`generazione.piani.p${piano}.${k}`);
  const nStanze = Math.min(G('n_clamp_max'), Math.max(G('n_clamp_min'), PP('n_min') + Math.floor(u * (PP('n_var') + 1))));
  const L = Math.min(PP('L_min') + Math.floor(u2 * (PP('L_var') + 1)), nStanze - 4);
  return { nStanze, L, nExtra: nStanze - (L + 1) - 3 };
}

/**
 * Formula `diff_target`.
 * @param {{ parametri: { get: Function }, piano: number, prof: number }} o
 */
export function diffTarget({ parametri, piano, prof }) {
  const base = parametri.get(`generazione.piani.p${piano}.diff_base`);
  const k = parametri.get('generazione.k_dt');
  return Math.min(5, Math.max(1, base + Math.floor(k * prof)));
}

/**
 * Formula `peso_modello`.
 * @param {{ parametri: { get: Function }, modello: { difficolta: number, peso_base: number }, usi: number, vicinoUsa: boolean, diffTarget: number, combattimento: boolean }} o
 */
export function pesoModello({ parametri, modello, usi, vicinoUsa, diffTarget: dt, combattimento }) {
  const W = (k) => parametri.get(`generazione.peso.${k}`);
  const g = combattimento ? Math.exp(-((modello.difficolta - dt) ** 2) / (2 * W('sigma') ** 2)) : 1;
  const grezzo = W('k_rip') ** usi * (vicinoUsa ? W('k_adj') : 1) * g;
  return Math.max(W('f_min'), grezzo) * modello.peso_base;
}

// ---------------------------------------------------------------------------------------------
// Grafo della pianta (funzioni comuni a generatore, validatore e punteggio)
// ---------------------------------------------------------------------------------------------

/** Indice id → stanza. */
function indice(pianta) {
  return new Map(pianta.stanze.map((s) => [s.id, s]));
}

/** Vicini collegati da porte. */
function vicini(stanza) {
  return Array.from(new Set(Object.values(stanza.porte ?? {})));
}

/**
 * Distanze nel grafo delle porte da una stanza (BFS); le stanze non raggiunte mancano.
 * @returns {{ distanze: Map<string, number>, genitore: Map<string, string|null>, ordine: string[] }}
 */
export function esplora(pianta, daId) {
  const perId = indice(pianta);
  const distanze = new Map([[daId, 0]]);
  const genitore = new Map([[daId, null]]);
  const ordine = [daId];
  const coda = [daId];
  while (coda.length) {
    const id = coda.shift();
    for (const v of vicini(perId.get(id))) {
      if (distanze.has(v)) continue;
      distanze.set(v, distanze.get(id) + 1);
      genitore.set(v, id);
      ordine.push(v);
      coda.push(v);
    }
  }
  return { distanze, genitore, ordine };
}

/**
 * Nome dello slot della stanza `a` rivolto verso la cella `cellaB` adiacente (regola 3).
 * @returns {string | null}
 */
export function slotVerso(a, cellaB) {
  const celle = a.celle;
  for (let i = 0; i < celle.length; i++) {
    const ca = celle[i];
    if (!confinano(ca, cellaB)) continue;
    const dx = cellaB[0] - ca[0];
    const dy = cellaB[1] - ca[1];
    const lato = dx === 1 ? 'E' : dx === -1 ? 'W' : dy === 1 ? 'S' : 'N';
    if (a.dim === '2x1' && (lato === 'N' || lato === 'S')) return `${lato}${i}`;
    return lato;
  }
  return null;
}

/** Slot ammessi per una dimensione. */
export function slotAmmessi(dim) {
  return dim === '2x1' ? ['N0', 'N1', 'S0', 'S1', 'W', 'E'] : ['N', 'E', 'S', 'W'];
}

/** Celle di una stanza a partire dalla cella base e dalla dimensione (la doppia si estende a est). */
function celleDa(cella, dim, celle = null) {
  if (celle) return celle.map((c) => [c[0], c[1]]);
  return dim === '2x1' ? [[cella[0], cella[1]], [cella[0] + 1, cella[1]]] : [[cella[0], cella[1]]];
}

// ---------------------------------------------------------------------------------------------
// Completamento: semi, profondità, ricompense, punteggio
// ---------------------------------------------------------------------------------------------

/**
 * Completa una pianta «grezza» (stanze con id, celle, dim, tipo, modello, porte, finestre):
 * profondità, d_boss, semi di stanza, scena_id, ricompense pre-estratte con riparazione (regola 13),
 * cammino (se assente, il più breve ingresso→boss), punteggio Q. Muta e restituisce la pianta.
 * @param {object} pianta
 * @param {{ piano: number, parametri: { get: Function }, catalogo: { perId: Function }, rngPiano: { seme: number } }} ctx
 */
export function completaPianta(pianta, { piano, parametri, catalogo, rngPiano }) {
  const G = (k) => parametri.get(`generazione.${k}`);
  const perId = indice(pianta);
  const ingresso = pianta.stanze.find((s) => s.tipo === 'ingresso');
  const boss = pianta.stanze.find((s) => s.tipo === 'boss');
  const { distanze, genitore } = esplora(pianta, ingresso.id);
  const dBoss = boss ? (distanze.get(boss.id) ?? 0) : 0;
  pianta.d_boss = dBoss;
  for (const s of pianta.stanze) {
    s.celle = celleDa(s.cella, s.dim, s.celle);
    s.profondita = distanze.get(s.id) ?? (Math.min(...vicini(s).map((v) => distanze.get(v) ?? 0)) + 1);
    s.d_boss = dBoss;
    s.seme_stanza = derivato(rngPiano, `stanza-${s.cella[0]}-${s.cella[1]}`).seme;
    s.finestre = s.finestre ?? [];
    s.elite = Boolean(s.elite);
    const m = catalogo.perId(s.modello);
    s.difficolta = m?.difficolta ?? 3;
    if (m?.scena_id) s.scena_id = m.scena_id;
  }
  if (!pianta.cammino && boss) {
    const cammino = [];
    for (let id = boss.id; id; id = genitore.get(id)) cammino.unshift(id);
    pianta.cammino = cammino;
  }
  // ricompense (regola 13; formula valore_ricompensa di stanze-porte.md)
  const M = (k) => parametri.get(`stanze.ricompensa.molt_stanza.${k}`);
  for (const s of pianta.stanze) {
    const rngRic = derivato(creaRng(s.seme_stanza), 'ric');
    s.rngRic = rngRic;
    let valore = 0;
    if (s.tipo === 'normale' || s.tipo === 'boss' || s.tipo === 'segreta') {
      const molt = Math.max(
        s.tipo === 'boss' ? M('boss') : s.tipo === 'segreta' ? M('segreta') : M('normale'),
        s.dim === '2x1' ? M('doppia') : 0,
        s.elite ? M('elite') : 0,
      );
      valore = valoreRicompensa({ parametri, p: piano, prof: profondita(s.profondita, dBoss), diff: s.difficolta, molt, rng: rngRic });
    } else if (s.tipo === 'ricordo') {
      valore = parametri.get('stanze.ricompensa.unita_ricordo');
    }
    s.ricompensa = { valore, oggetti: oggettiRicompensa({ parametri, valore, rng: rngRic }) };
  }
  // riparazione: su ogni percorso radice→foglia, al massimo N_max stanze di combattimento consecutive senza ricompensa
  const nMax = G('n_max_senza_ricompensa');
  const foglie = pianta.stanze.filter((s) => distanze.has(s.id) && !pianta.stanze.some((t) => genitore.get(t.id) === s.id));
  for (const foglia of foglie) {
    const percorso = [];
    for (let id = foglia.id; id; id = genitore.get(id)) percorso.unshift(perId.get(id));
    let serie = 0;
    for (const s of percorso) {
      if (TIPI_SPECIALI.has(s.tipo)) { serie = 0; continue; }
      if (s.ricompensa.valore > 0) { serie = 0; continue; }
      serie += 1;
      if (serie > nMax) {
        s.ricompensa = { valore: 1, oggetti: oggettiRicompensa({ parametri, valore: 1, rng: s.rngRic }), riparata: true };
        serie = 0;
      }
    }
  }
  for (const s of pianta.stanze) delete s.rngRic;
  pianta.Q = punteggioQ(pianta, { parametri, piano });
  return pianta;
}

/**
 * Formula `Q` (punteggio di qualità, 0-100).
 * @param {object} pianta con `cammino` (ids) e stanze complete
 * @param {{ parametri: { get: Function }, piano: number }} o
 */
export function punteggioQ(pianta, { parametri, piano }) {
  const Qp = (k) => parametri.get(`generazione.q.${k}`);
  const perId = indice(pianta);
  const nonSegrete = pianta.stanze.filter((s) => s.tipo !== 'segreta');
  const bivi = nonSegrete.filter((s) => vicini(s).length >= 3).length;
  const sBivi = Math.min(1, bivi / parametri.get(`generazione.piani.p${piano}.bivi_target`));
  const tesoro = pianta.stanze.find((s) => s.tipo === 'tesoro');
  const banchetto = pianta.stanze.find((s) => s.tipo === 'banchetto');
  const dTQ = tesoro && banchetto ? (esplora(pianta, tesoro.id).distanze.get(banchetto.id) ?? 0) : 0;
  const sTq = Math.min(1, dTQ / Qp('d_tq_ideale'));
  // tratti dritti del cammino
  const celle = (pianta.cammino ?? []).map((id) => perId.get(id).cella);
  const direzioni = [];
  for (let i = 1; i < celle.length; i++) direzioni.push(`${Math.sign(celle[i][0] - celle[i - 1][0])},${Math.sign(celle[i][1] - celle[i - 1][1])}`);
  let eccesso = 0;
  let run = 0;
  for (let i = 0; i < direzioni.length; i++) {
    run = i > 0 && direzioni[i] === direzioni[i - 1] ? run + 1 : 1;
    if (i === direzioni.length - 1 || direzioni[i + 1] !== direzioni[i]) eccesso += Math.max(0, run - Qp('run_ideale'));
  }
  const sRett = 1 - Math.min(1, eccesso / Qp('run_norm'));
  const combattimento = pianta.stanze.filter((s) => s.tipo === 'normale');
  const sVar = combattimento.length ? new Set(combattimento.map((s) => s.modello)).size / combattimento.length : 1;
  const camminoStanze = (pianta.cammino ?? []).map((id) => perId.get(id)).filter((s) => s.tipo === 'normale');
  let inversioni = 0;
  for (let i = 1; i < camminoStanze.length; i++) if (camminoStanze[i - 1].difficolta - camminoStanze[i].difficolta >= 2) inversioni += 1;
  const passi = Math.max(1, (pianta.cammino?.length ?? 1) - 1);
  const sCurva = 1 - Math.min(1, inversioni / passi);
  const tutte = pianta.stanze.flatMap((s) => s.celle);
  const xs = tutte.map((c) => c[0]);
  const ys = tutte.map((c) => c[1]);
  const bbox = (Math.max(...xs) - Math.min(...xs) + 1) * (Math.max(...ys) - Math.min(...ys) + 1);
  const sForma = Math.min(1, tutte.length / bbox / Qp('occ_target'));
  const Q = 100 * (Qp('w_b') * sBivi + Qp('w_t') * sTq + Qp('w_r') * sRett + Qp('w_v') * sVar + Qp('w_c') * sCurva + Qp('w_f') * sForma);
  return Math.round(Q * 10) / 10;
}

// ---------------------------------------------------------------------------------------------
// Vincoli rigidi (regola 16)
// ---------------------------------------------------------------------------------------------

/**
 * Verifica H1-H10 (più la regola 9 sulla stanza-ricordo del piano 1). Restituisce le violazioni.
 * @param {object} pianta completa
 * @param {{ parametri: { get: Function }, catalogo: { perId: Function } }} o
 * @returns {string[]}
 */
export function validaPianta(pianta, { parametri, catalogo }) {
  const v = [];
  const piano = pianta.p;
  const G = (k) => parametri.get(`generazione.${k}`);
  const PP = (k) => parametri.get(`generazione.piani.p${piano}.${k}`);
  const perId = indice(pianta);
  const conta = (tipo) => pianta.stanze.filter((s) => s.tipo === tipo).length;
  const nonSegrete = pianta.stanze.filter((s) => s.tipo !== 'segreta');
  const ingresso = pianta.stanze.find((s) => s.tipo === 'ingresso');
  const boss = pianta.stanze.find((s) => s.tipo === 'boss');

  const nMin = Math.max(G('n_clamp_min'), PP('n_min'));
  const nMax = Math.min(G('n_clamp_max'), PP('n_min') + PP('n_var'));
  if (nonSegrete.length < nMin || nonSegrete.length > nMax) v.push(`H1: n_stanze ${nonSegrete.length} fuori da [${nMin}, ${nMax}]`);
  if (!ingresso || !boss) {
    v.push('H4: manca ingresso o boss');
    return v;
  }
  const { distanze, genitore } = esplora(pianta, ingresso.id);
  const dBoss = distanze.get(boss.id);
  if (dBoss === undefined) v.push('H2: il boss non è raggiungibile');
  else if (dBoss < PP('L_min')) v.push(`H2: d_boss ${dBoss} < L_min ${PP('L_min')}`);
  if (boss.celle.some((cb) => ingresso.celle.some((ci) => confinano(cb, ci)))) v.push('H3: il boss confina con l\'ingresso');
  for (const tipo of ['ingresso', 'boss', 'tesoro', 'banchetto', 'ricordo']) {
    if (conta(tipo) !== 1) v.push(`H4: ${conta(tipo)} stanze di tipo ${tipo}`);
  }
  for (const s of pianta.stanze) {
    if (FOGLIE_SPECIALI.includes(s.tipo) && vicini(s).length !== 1) v.push(`H5: ${s.tipo} ${s.id} ha grado ${vicini(s).length}`);
  }
  const segreta = pianta.stanze.find((s) => s.tipo === 'segreta');
  if (segreta) {
    const confinanti = pianta.stanze.filter((s) => s.id !== segreta.id && s.celle.some((c) => segreta.celle.some((cs) => confinano(c, cs))));
    const idonee = confinanti.filter((s) => TIPI_IDONEI_SEGRETA.has(s.tipo));
    if (idonee.length < 2) v.push(`H6: la segreta confina con ${idonee.length} stanze idonee`);
    if (confinanti.some((s) => s.tipo === 'boss')) v.push('H6: la segreta confina con il boss');
    for (const s of idonee) {
      const slot = slotVerso(s, segreta.cella);
      if (!s.finestre?.includes(slot)) v.push(`H6: ${s.id} senza finestra nello slot ${slot} verso la segreta`);
    }
  }
  for (const s of pianta.stanze) {
    const m = catalogo.perId(s.modello);
    if (!m) { v.push(`H7: ${s.id} senza modello ('${s.modello}')`); continue; }
    if (m.tipo !== s.tipo || m.dim !== s.dim) v.push(`H7: ${s.id} usa ${m.id} (${m.tipo} ${m.dim}) ma è ${s.tipo} ${s.dim}`);
    if (!m.piani.some((p) => Math.abs(p - piano) <= 1)) v.push(`H7: ${s.id} usa ${m.id} non ammesso al piano ${piano}`);
    if (s.tipo === 'normale') {
      if (!m.spawn?.length || !m.tavolozza?.length) v.push(`H8: ${s.id} (${m.id}) senza spawn o tavolozza`);
      const n = nNemici({ parametri, p: piano, d: s.profondita, dBoss: dBoss ?? 1, diff: m.difficolta, dim: s.dim });
      if (n < 1) v.push(`H8: ${s.id} con n_nemici ${n}`);
    }
    if (s.tipo === 'ricordo' && !(s.scena_id || m.scena_id)) v.push(`H8: la stanza-ricordo ${s.id} non ha scena_id`);
  }
  // H9: serie senza ricompensa sui percorsi radice→foglia
  const nMaxSerie = G('n_max_senza_ricompensa');
  const foglie = pianta.stanze.filter((s) => distanze.has(s.id) && !pianta.stanze.some((t) => genitore.get(t.id) === s.id));
  let serieMax = 0;
  for (const foglia of foglie) {
    let serie = 0;
    const percorso = [];
    for (let id = foglia.id; id; id = genitore.get(id)) percorso.unshift(perId.get(id));
    for (const s of percorso) {
      if (TIPI_SPECIALI.has(s.tipo) || (s.ricompensa?.valore ?? 0) > 0) serie = 0;
      else serie += 1;
      serieMax = Math.max(serieMax, serie);
    }
  }
  if (serieMax > nMaxSerie) v.push(`H9: ${serieMax} stanze di combattimento consecutive senza ricompensa`);
  // H10: grado dell'ingresso e slot
  if (vicini(ingresso).length < G('grado_ingresso_min')) v.push(`H10: grado(ingresso) ${vicini(ingresso).length} < ${G('grado_ingresso_min')}`);
  for (const s of pianta.stanze) {
    const ammessi = slotAmmessi(s.dim);
    for (const [slot, verso] of Object.entries(s.porte ?? {})) {
      if (!ammessi.includes(slot)) v.push(`H10: ${s.id} ha lo slot ${slot} non ammesso per ${s.dim}`);
      if (s.finestre?.includes(slot)) v.push(`H10: ${s.id} ha porta e finestra nello slot ${slot}`);
      const altra = perId.get(verso);
      if (!altra) { v.push(`H10: ${s.id}.${slot} verso una stanza inesistente '${verso}'`); continue; }
      if (!Object.values(altra.porte ?? {}).includes(s.id)) v.push(`H10: la porta ${s.id}.${slot} → ${verso} non è reciproca`);
      const atteso = altra.celle.map((c) => slotVerso(s, c)).find(Boolean);
      if (atteso !== slot) v.push(`H10: ${s.id}.${slot} → ${verso} non corrisponde alla geometria (atteso ${atteso})`);
    }
    for (const slot of s.finestre ?? []) if (!ammessi.includes(slot)) v.push(`H10: ${s.id} ha la finestra ${slot} non ammessa per ${s.dim}`);
  }
  // regola 9: al piano 1 la stanza-ricordo è a distanza ≤ d_ricordo_max[1] dall'ingresso
  if (piano === 1) {
    const ricordo = pianta.stanze.find((s) => s.tipo === 'ricordo');
    if (ricordo && (distanze.get(ricordo.id) ?? Infinity) > G('d_ricordo_max_p1')) v.push(`R9: la stanza-ricordo è a distanza ${distanze.get(ricordo.id)} dall'ingresso`);
  }
  return v;
}

// ---------------------------------------------------------------------------------------------
// Un tentativo
// ---------------------------------------------------------------------------------------------

function tentativo({ rng, rngPiano, piano, nStanze, L, parametri, catalogo, usi }) {
  const G = (k) => parametri.get(`generazione.${k}`);
  const PP = (k) => parametri.get(`generazione.piani.p${piano}.${k}`);
  const w = G('griglia_w');
  const h = G('griglia_h');
  const occupate = new Map();
  /** @type {object[]} */
  const stanze = [];
  /** @type {[string, string][]} */
  const archi = [];
  const perId = (id) => stanze.find((s) => s.id === id);
  const dentro = (c) => c[0] >= 0 && c[1] >= 0 && c[0] < w && c[1] < h;
  const idIn = (c) => occupate.get(chiave(c)) ?? null;
  const confinanti = (c) => new Set(adiacenti(c).map(idIn).filter(Boolean));
  const grado = (id) => archi.filter(([a, b]) => a === id || b === id).length;
  const viciniDi = (id) => archi.filter(([a, b]) => a === id || b === id).map(([a, b]) => (a === id ? b : a));
  const aggiungi = (tipo, cella) => {
    const s = { id: `r${stanze.length}`, tipo, cella: [cella[0], cella[1]], celle: [[cella[0], cella[1]]], dim: '1x1', ramo: 0, elite: false, finestre: [], modello: null };
    stanze.push(s);
    occupate.set(chiave(cella), s.id);
    return s;
  };
  const collega = (a, b) => archi.push([a.id, b.id]);
  /** Cella libera che confina solo con le stanze ammesse e mai con il boss. */
  const ammessa = (c, ammessi) => {
    if (!dentro(c) || idIn(c)) return false;
    for (const id of confinanti(c)) {
      if (!ammessi.has(id) || perId(id).tipo === 'boss') return false;
    }
    return true;
  };
  const libereAccanto = (s) => {
    const esito = [];
    const viste = new Set();
    for (const c of s.celle) {
      for (const a of adiacenti(c)) {
        if (viste.has(chiave(a))) continue;
        viste.add(chiave(a));
        if (ammessa(a, new Set([s.id]))) esito.push(a);
      }
    }
    return esito;
  };
  const distanze = () => {
    const d = new Map([['r0', 0]]);
    const coda = ['r0'];
    while (coda.length) {
      const id = coda.shift();
      for (const v of viciniDi(id)) if (!d.has(v)) { d.set(v, d.get(id) + 1); coda.push(v); }
    }
    return d;
  };
  const fallisci = (motivo) => ({ ok: false, motivo });

  // 1. cammino critico
  const ingresso = aggiungi('ingresso', [G('cella_ingresso.cx'), G('cella_ingresso.cy')]);
  const cammino = [ingresso];
  let dirPrec = null;
  let run = 0;
  for (let i = 1; i <= L; i++) {
    const ultimo = cammino[i - 1];
    const cu = ultimo.cella;
    const candidati = [];
    for (const lato of LATI) {
      const c = [cu[0] + VERSO_LATO[lato].x, cu[1] + VERSO_LATO[lato].y];
      if (!ammessa(c, new Set([ultimo.id]))) continue;
      if (lato === dirPrec && run >= G('max_rettilineo_walk')) continue;
      candidati.push({ c, lato, peso: lato === dirPrec ? G('k_dritto') : 1 });
    }
    if (!candidati.length) return fallisci(`cammino bloccato al passo ${i}`);
    const scelto = pesato(rng, candidati, (x) => x.peso);
    run = scelto.lato === dirPrec ? run + 1 : 1;
    dirPrec = scelto.lato;
    const s = aggiungi(i === L ? 'boss' : 'normale', scelto.c);
    collega(ultimo, s);
    cammino.push(s);
  }
  const nExtra = nStanze - (L + 1) - 3;
  let extra = 0;

  // 2. anelli (angolo interno di ogni svolta)
  let anelli = 0;
  for (let i = 0; i + 2 <= L && anelli < PP('anelli_max') && extra < nExtra; i++) {
    const a = cammino[i];
    const b = cammino[i + 1];
    const c2 = cammino[i + 2];
    const d1 = [b.cella[0] - a.cella[0], b.cella[1] - a.cella[1]];
    const d2 = [c2.cella[0] - b.cella[0], c2.cella[1] - b.cella[1]];
    if (d1[0] === d2[0] && d1[1] === d2[1]) continue;
    const angolo = [a.cella[0] + d2[0], a.cella[1] + d2[1]];
    if (!ammessa(angolo, new Set([a.id, c2.id]))) continue;
    if (rng() >= PP('p_anello')) continue;
    const s = aggiungi('normale', angolo);
    collega(a, s);
    collega(s, c2);
    anelli += 1;
    extra += 1;
  }

  // 3. rami e vicoli ciechi
  while (extra < nExtra) {
    const genitori = stanze.filter((s) => (s.tipo === 'ingresso' || s.tipo === 'normale') && s.ramo < G('lung_vicolo_max') && libereAccanto(s).length > 0);
    if (!genitori.length) return fallisci('nessun genitore libero per i rami');
    const g = pesato(rng, genitori, (s) => 1 / (1 + grado(s.id)));
    const celle = libereAccanto(g);
    const s = aggiungi('normale', celle[Math.floor(rng() * celle.length)]);
    s.ramo = g.ramo + 1;
    collega(g, s);
    extra += 1;
  }

  // 4. foglie speciali
  const coppie = (genitori) => genitori.flatMap((g) => libereAccanto(g).map((c) => ({ g, c })));
  const posa = (tipo, candidati) => {
    if (!candidati.length) return null;
    const { g, c } = candidati[Math.floor(rng() * candidati.length)];
    const s = aggiungi(tipo, c);
    collega(g, s);
    return { s, g };
  };
  let dist = distanze();
  const iMin = Math.floor(G('f_banchetto') * L);
  let candidati = coppie(cammino.filter((s, i) => i >= iMin && i <= L - 1));
  if (!candidati.length) candidati = coppie(stanze.filter((s) => s.tipo === 'normale' && dist.get(s.id) >= 2));
  const banchetto = posa('banchetto', candidati);
  if (!banchetto) return fallisci('nessun posto per il banchetto');
  candidati = coppie(stanze.filter((s) => s.tipo === 'normale' && dist.get(s.id) + 1 >= G('d_tesoro_min') && s.id !== banchetto.g.id));
  const tesoro = posa('tesoro', candidati);
  if (!tesoro) return fallisci('nessun posto per il tesoro');
  const genitoriRicordo = piano === 1 ? [ingresso] : stanze.filter((s) => s.tipo === 'normale' || s.tipo === 'ingresso');
  const ricordo = posa('ricordo', coppie(genitoriRicordo));
  if (!ricordo) return fallisci('nessun posto per la stanza-ricordo');

  // 5. élite e doppie
  let elite = 0;
  for (const s of stanze) {
    if (s.tipo !== 'normale' || elite >= PP('max_elite')) continue;
    if (rng() < PP('p_elite')) { s.elite = true; elite += 1; }
  }
  let doppie = 0;
  for (const s of stanze.slice()) {
    if (s.tipo !== 'normale' || s.elite || doppie >= PP('max_doppie')) continue;
    if (rng() >= PP('p_doppia')) continue;
    const opzioni = [[s.cella[0] + 1, s.cella[1]], [s.cella[0] - 1, s.cella[1]]].filter((c) => ammessa(c, new Set([s.id])));
    if (!opzioni.length) continue;
    const c = opzioni.length === 1 ? opzioni[0] : opzioni[Math.floor(rng() * opzioni.length)];
    s.celle = [s.cella, c].sort((p, q) => p[0] - q[0]);
    s.dim = '2x1';
    occupate.set(chiave(c), s.id);
    doppie += 1;
  }

  // 6. modelli, in ampiezza dall'ingresso
  dist = distanze();
  const dBoss = dist.get(cammino[L].id);
  const pool = (tipo, dim) => {
    let m = catalogo.filtra({ tipo, dim, piano });
    if (!m.length) m = catalogo.filtra({ tipo, dim, piani: [piano - 1, piano + 1] });
    return m;
  };
  const scegliModello = (s) => {
    const m = pool(s.tipo, s.dim);
    if (!m.length) return null;
    const prof = profondita(dist.get(s.id) ?? 0, dBoss);
    const dt = diffTarget({ parametri, piano, prof });
    const usatiDaiVicini = new Set(viciniDi(s.id).map((id) => perId(id).modello).filter(Boolean));
    return pesato(rng, m, (mod) => pesoModello({
      parametri, modello: mod, usi: usi[mod.id] ?? 0, vicinoUsa: usatiDaiVicini.has(mod.id), diffTarget: dt, combattimento: s.tipo === 'normale',
    }));
  };
  const ordine = [];
  {
    const coda = ['r0'];
    const visti = new Set(coda);
    while (coda.length) {
      const id = coda.shift();
      ordine.push(id);
      for (const v of viciniDi(id)) if (!visti.has(v)) { visti.add(v); coda.push(v); }
    }
  }
  for (const id of ordine) {
    const s = perId(id);
    let m = scegliModello(s);
    if (!m && s.dim === '2x1') {
      const altra = s.celle.find((c) => c[0] !== s.cella[0] || c[1] !== s.cella[1]);
      occupate.delete(chiave(altra));
      s.celle = [s.cella];
      s.dim = '1x1';
      m = scegliModello(s);
    }
    if (!m) return fallisci(`nessun modello per ${s.tipo} ${s.dim}`);
    s.modello = m.id;
    usi[m.id] = (usi[m.id] ?? 0) + 1;
  }

  // 7. segreta
  let segreta = null;
  if (rng() < PP('p_segreta')) {
    const cand = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = [x, y];
        if (idIn(c)) continue;
        const conf = Array.from(confinanti(c)).map(perId);
        if (conf.length < 2 || conf.some((s) => s.tipo === 'boss') || !conf.every((s) => TIPI_IDONEI_SEGRETA.has(s.tipo))) continue;
        cand.push(c);
      }
    }
    const m = pool('segreta', '1x1');
    if (cand.length && m.length) {
      const c = cand[Math.floor(rng() * cand.length)];
      const mod = pesato(rng, m, (x) => pesoModello({ parametri, modello: x, usi: usi[x.id] ?? 0, vicinoUsa: false, diffTarget: 1, combattimento: false }));
      segreta = { id: 's', tipo: 'segreta', cella: c, celle: [c], dim: '1x1', ramo: 0, elite: false, finestre: [], modello: mod.id, porte: {} };
      usi[mod.id] = (usi[mod.id] ?? 0) + 1;
      const confinantiIds = Array.from(confinanti(c));
      confinantiIds.forEach((id, i) => {
        if (i > 0 && rng() >= G('p_finestra_visibile')) return;
        const s = perId(id);
        const slot = slotVerso(s, c);
        if (slot) s.finestre.push(slot);
        const cellaVicina = s.celle.find((cs) => confinano(cs, c));
        segreta.finestre.push(slotVerso(segreta, cellaVicina));
      });
    }
  }

  // 8. assemblaggio dei record (porte dagli archi)
  const records = stanze.map((s) => ({
    id: s.id, tipo: s.tipo, cella: s.cella, celle: s.celle, dim: s.dim, modello: s.modello, elite: s.elite, finestre: s.finestre, porte: {},
    indice_cammino: cammino.indexOf(s) >= 0 ? cammino.indexOf(s) : null,
  }));
  const recordPerId = new Map(records.map((r) => [r.id, r]));
  for (const [a, b] of archi) {
    const ra = recordPerId.get(a);
    const rb = recordPerId.get(b);
    const slotA = rb.celle.map((c) => slotVerso(ra, c)).find(Boolean);
    const slotB = ra.celle.map((c) => slotVerso(rb, c)).find(Boolean);
    if (!slotA || !slotB) return fallisci(`arco ${a}-${b} senza slot`);
    if (ra.porte[slotA] || rb.porte[slotB]) return fallisci(`slot doppio su ${a}-${b}`);
    ra.porte[slotA] = b;
    rb.porte[slotB] = a;
  }
  if (segreta) records.push(segreta);
  const pianta = {
    p: piano, griglia: { w, h }, n_stanze: stanze.length, L, cammino: cammino.map((s) => s.id), stanze: records,
    segreta: segreta ? { id: segreta.id, cella: segreta.cella, modello: segreta.modello, finestre: records.filter((r) => r.id !== 's' && r.finestre.length).flatMap((r) => r.finestre.map((f) => [r.id, f])) } : null,
  };
  completaPianta(pianta, { piano, parametri, catalogo, rngPiano });
  return { ok: true, pianta };
}

// ---------------------------------------------------------------------------------------------
// Piano di riserva
// ---------------------------------------------------------------------------------------------

/**
 * Trasforma il JSON del piano di riserva (`contenuti/piani/`) in una pianta completa.
 * @param {object} riserva
 * @param {{ piano: number, parametri: { get: Function }, catalogo: { perId: Function }, rngPiano: { seme: number } }} ctx
 */
export function piantaDaRiserva(riserva, ctx) {
  const G = (k) => ctx.parametri.get(`generazione.${k}`);
  const stanze = riserva.stanze.map((s) => ({
    id: s.id, tipo: s.tipo, cella: [s.cella[0], s.cella[1]], celle: celleDa(s.cella, s.dim, s.celle), dim: s.dim, modello: s.modello,
    elite: Boolean(s.elite), finestre: [], porte: { ...s.porte }, indice_cammino: riserva.cammino ? riserva.cammino.indexOf(s.id) : null,
  }));
  if (riserva.segreta) {
    const seg = riserva.segreta;
    const record = { id: seg.id ?? 's', tipo: 'segreta', cella: [seg.cella[0], seg.cella[1]], celle: [[seg.cella[0], seg.cella[1]]], dim: '1x1', modello: seg.modello, elite: false, finestre: [], porte: {}, indice_cammino: null };
    for (const [id, slot] of seg.finestre ?? []) {
      const s = stanze.find((x) => x.id === id);
      if (s) {
        s.finestre.push(slot);
        const cellaVicina = s.celle.find((c) => confinano(c, record.cella));
        if (cellaVicina) record.finestre.push(slotVerso(record, cellaVicina));
      }
    }
    stanze.push(record);
  }
  const pianta = {
    p: riserva.p ?? ctx.piano, griglia: { w: G('griglia_w'), h: G('griglia_h') }, n_stanze: riserva.stanze.length,
    L: riserva.cammino ? riserva.cammino.length - 1 : null, cammino: riserva.cammino ?? null, stanze,
    segreta: riserva.segreta ? { id: riserva.segreta.id ?? 's', cella: riserva.segreta.cella, modello: riserva.segreta.modello, finestre: riserva.segreta.finestre ?? [] } : null,
    riserva: true,
  };
  completaPianta(pianta, ctx);
  if (pianta.L === null) pianta.L = pianta.d_boss;
  return pianta;
}

// ---------------------------------------------------------------------------------------------
// Ingresso principale
// ---------------------------------------------------------------------------------------------

/**
 * Genera il piano `piano` della notte `seme`.
 * @param {{
 *   seme: number, piano: number, usiModelli?: Record<string, number>,
 *   parametri: { get: Function }, catalogo: { perId: Function, filtra: Function },
 *   riserva?: object | null, log?: { error: Function }
 * }} o
 * @returns {{ pianta: object, usiModelli: Record<string, number>, tentativi: number, origine: 'generato'|'migliore'|'riserva', errori: string[] }}
 */
export function generaPiano({ seme, piano, usiModelli = {}, parametri, catalogo, riserva = null, log = console }) {
  if (!parametri || !catalogo) throw new TypeError('generaPiano: dipendenze mancanti');
  if (!Number.isInteger(piano) || piano < 1 || piano > 5) throw new RangeError(`generaPiano: piano ${piano} fuori da 1..5`);
  const G = (k) => parametri.get(`generazione.${k}`);
  const PP = (k) => parametri.get(`generazione.piani.p${piano}.${k}`);
  const radice = creaRng(seme);
  const rngPiano = derivato(derivato(radice, 'piano'), `p${piano}`);
  const rngDim = derivato(rngPiano, 'dim');
  const { nStanze, L } = dimensioniPiano({ parametri, piano, u: rngDim(), u2: rngDim() });
  const maxTentativi = G('max_tentativi');
  const errori = [];
  let migliore = null;
  for (let k = 0; k < maxTentativi; k++) {
    const rng = derivato(rngPiano, `tentativo-${k}`);
    const usi = { ...usiModelli };
    const esito = tentativo({ rng, rngPiano, piano, nStanze, L, parametri, catalogo, usi });
    if (!esito.ok) {
      errori.push(`tentativo ${k}: ${esito.motivo}`);
      continue;
    }
    const violazioni = validaPianta(esito.pianta, { parametri, catalogo });
    if (violazioni.length) {
      errori.push(`tentativo ${k}: ${violazioni.join('; ')}`);
      continue;
    }
    esito.pianta.tentativo = k;
    if (esito.pianta.Q >= PP('soglia_Q')) {
      return { pianta: esito.pianta, usiModelli: usi, tentativi: k + 1, origine: 'generato', errori };
    }
    errori.push(`tentativo ${k}: Q ${esito.pianta.Q} < soglia ${PP('soglia_Q')}`);
    if (!migliore || esito.pianta.Q > migliore.pianta.Q) migliore = { pianta: esito.pianta, usi };
  }
  if (migliore) return { pianta: migliore.pianta, usiModelli: migliore.usi, tentativi: maxTentativi, origine: 'migliore', errori };
  if (!riserva) throw new Error(`generaPiano: nessun tentativo valido per il piano ${piano} e nessun piano di riserva (${errori.join(' | ')})`);
  const pianta = piantaDaRiserva(riserva, { piano, parametri, catalogo, rngPiano });
  pianta.tentativo = null;
  const usi = { ...usiModelli };
  for (const s of pianta.stanze) usi[s.modello] = (usi[s.modello] ?? 0) + 1;
  const violazioni = validaPianta(pianta, { parametri, catalogo });
  log.error(`[generazione] piano ${piano}, seme ${seme}: ${maxTentativi} tentativi senza piano valido, uso il piano di riserva${violazioni.length ? ` (che viola: ${violazioni.join('; ')})` : ''}`);
  return { pianta, usiModelli: usi, tentativi: maxTentativi, origine: 'riserva', errori };
}

export { LATO_OPPOSTO };
