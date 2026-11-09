/**
 * gioco/qa/economia.test.mjs — Test unitari della storia 025 (monete di luce, drop, scintille, banchetto di Tonino), senza DOM.
 *
 * Esecuzione: `node gioco/qa/economia.test.mjs` dalla radice del repository (node:test, Node ≥ 20).
 * Parametri, catalogo dei doni, consumabili e testi sono i JSON reali di `contenuti/`. Un caso per
 * ogni criterio Given-When-Then della storia e per i criteri calcolabili del GDD economia.md
 * (formule, tetto, morte, boss, residuo, costi della Fucina, rientro al banchetto, prestazioni,
 * nessun numero nel codice, nessun generatore nativo). La notte di prova usa il piano generato dal
 * seme con la factory dei fantocci (come mondo.test.mjs) e il salvataggio in RAM.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import { creaTempo } from '../motore/fondazione/tempo.js';
import { creaBus } from '../motore/fondazione/eventi.js';
import { creaInput } from '../motore/fondazione/input.js';
import { creaParametri, validaStatistiche } from '../motore/fondazione/parametri.js';
import { creaRng, derivato } from '../motore/fondazione/rng.js';
import { creaModificatori } from '../motore/oggetti/modificatori.js';
import { creaCampo } from '../motore/mondo/fisica.js';
import { creaFerruccio } from '../motore/attori/ferruccio.js';
import { creaCombattimento } from '../motore/attori/combattimento.js';
import { creaFantoccio } from '../motore/attori/bersaglio.js';
import { caricaModelli, creaCatalogo, regoleDaParametri } from '../motore/mondo/modelli.js';
import { creaCamera } from '../motore/mondo/camera.js';
import { generaPiano } from '../motore/mondo/generazione.js';
import { creaNotte } from '../motore/mondo/notte.js';
import { creaSalvataggio, memoriaInRam } from '../motore/persistenza/salvataggio.js';
import { creaProfilo, normalizzaProfilo } from '../motore/persistenza/profilo.js';
import {
  creaEconomia, prezzo, moneteBoss, scintilleBoss, pCuore, residuoNotte, costoSblocco, valoreMedioMoneta,
  moneteAtteseStanza, redditoPiano, estraiMoneta, pesiRarita, estraiDono, PCT,
} from '../motore/oggetti/economia.js';
import { creaBanchetto, puntiSlot, TIPI_SLOT } from '../motore/oggetti/banchetto.js';
import { riempi } from '../motore/interfaccia/banchetto.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const SCENA = Object.freeze({ larghezza: 1280, altezza: 720 });
const SEME = 1845;
const leggi = (percorso) => JSON.parse(readFileSync(join(RADICE, percorso), 'utf8'));
const CARTELLA_MODELLI = 'contenuti/modelli-stanza/piazza-dante';
const STATISTICHE = ['ferruccio', 'combattimento', 'stanza', 'stanze', 'generazione', 'economia'];
const TABELLE = ['input', 'doni', 'sinergie', 'consumabili'];

function logFinto() {
  const voci = [];
  return { voci, error: (...a) => voci.push(a.map(String).join(' ')), warn: () => {} };
}

async function caricaParametri({ override = {}, ritocca = null } = {}) {
  const log = logFinto();
  const parametri = creaParametri({ log });
  await parametri.carica({
    caricatore: (nome) => {
      const j = leggi(`contenuti/parametri/${nome}.json`);
      if (ritocca) ritocca(nome, j);
      return j;
    },
    statistiche: STATISTICHE,
    tabelle: TABELLE,
    override,
  });
  assert.deepEqual(parametri.errori(), [], 'i JSON reali devono essere validi');
  return { parametri, log };
}

/**
 * Mondo di prova: fondazione, campo, Ferruccio, combattimento, salvataggio in RAM, profilo, economia,
 * notte sul piano 1 generato dal seme (factory dei fantocci), banchetto del piano.
 */
async function creaMondo({ override = {}, seme = SEME, memoria = memoriaInRam(), piano = 1, slot = '1' } = {}) {
  const { parametri, log } = await caricaParametri({ override });
  const tempo = creaTempo();
  const eventi = creaBus({ log });
  const input = creaInput(parametri.get('input'));
  const rng = creaRng(seme);
  const mod = creaModificatori(parametri, { catalogo: parametri.get('doni'), sinergie: parametri.get('sinergie'), eventi, rng: derivato(rng, 'doni') });
  const campo = creaCampo({
    colonne: parametri.get('stanza.colonne'), righe: parametri.get('stanza.righe'), cella: parametri.get('stanza.cella'),
    scenaLarghezza: SCENA.larghezza, scenaAltezza: SCENA.altezza,
  });
  const ferruccio = creaFerruccio({ modificatori: mod, tempo, eventi, input, campo, x: 640, y: 360 });
  const bersagli = [];
  const proiettili = [];
  const comb = creaCombattimento({ modificatori: mod, tempo, eventi, input, campo, ferruccio, bersagli: () => bersagli });
  const creaNemico = ({ archetipo, x, y, id }) => {
    const f = creaFantoccio({ modificatori: mod, tempo, eventi, campo, bersaglio: comb.comeBersaglio, id, x, y });
    f.archetipo = archetipo;
    return f;
  };
  const salvataggio = creaSalvataggio({ memoria, log, ora: () => 0 });
  const profilo = creaProfilo({ salvataggio, slot, eventi });
  const economia = creaEconomia({ parametri, eventi, rng: derivato(rng, 'drop'), profilo, ferruccio, modificatori: mod, piano, log });
  const ricevuti = [];
  for (const nome of ['economia.monete', 'economia.oggetto', 'economia.scintille', 'economia.morte', 'economia.fine_notte', 'economia.consumabile',
    'banchetto.acquisto', 'banchetto.rifiutato', 'stanza.pulita', 'stanza.ricompensa', 'profilo.scintille', 'doni.aggiunto']) {
    eventi.on(nome, (p) => ricevuti.push({ nome, payload: p }));
  }
  const tasto = (azione) => `t:${parametri.get(`input.tastiera.${azione}`)[0]}`;
  const consumabili = parametri.get('consumabili').consumabili;
  const catalogoDoni = parametri.get('doni').doni;
  const banchetto = creaBanchetto({
    economia, modificatori: mod, parametri, catalogo: catalogoDoni, consumabili, rng: derivato(rng, 'banchetto'), piano, ferruccio, input, eventi, log,
  });
  const m = {
    parametri, log, tempo, eventi, input, mod, campo, ferruccio, comb, bersagli, proiettili, salvataggio, memoria, profilo, economia, banchetto,
    consumabili, catalogoDoni, ricevuti, rng, slot,
    notte: null,
    ticks: (chiave) => tempo.ticksDaMs(parametri.get(chiave)),
    E: (k) => parametri.get(`economia.${k}`),
    tick(n = 1) {
      for (let i = 0; i < n; i++) {
        input.inizioTick();
        if (m.notte) m.notte.tick(tempo.passoS);
        else {
          ferruccio.tick(tempo.passoS);
          comb.tick(tempo.passoS);
          for (const b of bersagli.slice()) b.tick(tempo.passoS);
        }
        economia.tick();
        banchetto.tick();
      }
    },
    premi(azione) {
      input.sorgenteGiu(tasto(azione));
      m.tick(1);
      input.sorgenteSu(tasto(azione));
    },
    async avviaNotte() {
      const indice = leggi(`${CARTELLA_MODELLI}/indice.json`);
      const { modelli } = await caricaModelli({ caricatore: (nome) => leggi(`${CARTELLA_MODELLI}/${nome}.json`), indice, regole: regoleDaParametri(parametri), log });
      const catalogo = creaCatalogo(modelli);
      const riserva = leggi('contenuti/piani/piazza-dante-riserva.json');
      const esito = generaPiano({ seme, piano, parametri, catalogo, riserva, log });
      const camera = creaCamera({ parametri, tempo, scena: SCENA, eventi });
      m.notte = creaNotte({
        seme, numeroPiano: piano, pianta: esito.pianta, catalogo, parametri, tempo, eventi, campo, scena: SCENA,
        ferruccio, combattimento: comb, bersagli, proiettili, camera, creaNemico,
      });
      m.notte.entra(esito.pianta.stanze.find((s) => s.tipo === 'ingresso').id);
      return m.notte;
    },
    /** Entra nella stanza di tipo dato (debug vaiA) e aspetta la fine della transizione. */
    vaiA(tipo) {
      const st = m.notte.pianta.stanze.find((s) => s.tipo === tipo);
      m.notte.vaiA(st.id);
      m.tick(m.ticks('stanze.camera.t_transizione') + 2);
      return st;
    },
    eventiDi: (nome) => ricevuti.filter((e) => e.nome === nome),
    uccidiTutti() {
      for (const b of bersagli) if (b.stato !== 'morto') b.colpisci(b.vita, null);
    },
  };
  return m;
}

// ---------------------------------------------------------------------------------------------
// Contenuti e regole del codice
// ---------------------------------------------------------------------------------------------

/** Prezzi del Teatro (stile The Binding of Isaac, economia.json › prezzi): costanti sui piani (inc_pct 0). */
const PREZZI_TEATRO = Object.freeze({ cuore: 3, consumabile: 5, comune: 10, raro: 15, prezioso: 20 });

test('contenuti: economia.json è una statistica valida con i valori del Teatro (prezzi 3/5/10/15/20 costanti sui piani, p_drop_moneta 0,12); consumabili e testi coerenti', async () => {
  const { errori } = validaStatistiche('economia', leggi('contenuti/parametri/economia.json'));
  assert.deepEqual(errori, []);
  const { parametri } = await caricaParametri();
  const pDrop = parametri.get('economia.p_drop_moneta');
  assert.ok(pDrop > 0 && pDrop < 1, `p_drop_moneta è una probabilità (${pDrop})`);
  assert.equal(pDrop, leggi('contenuti/parametri/economia.json').p_drop_moneta.base, 'il valore effettivo è il base (dentro il Safe Range)');
  assert.equal(parametri.get('economia.tetto_monete'), 99);
  assert.equal(parametri.get('economia.r_raccolta_moneta'), 24);
  assert.equal(parametri.get('economia.prezzi.base_dono'), PREZZI_TEATRO.comune);
  assert.equal(parametri.get('economia.prezzi.base_cuore'), PREZZI_TEATRO.cuore);
  assert.equal(parametri.get('economia.prezzi.base_consumabile'), PREZZI_TEATRO.consumabile);
  assert.equal(parametri.get('economia.prezzi.inc_pct'), 0, 'Teatro: i prezzi non crescono con il piano');
  const consumabili = parametri.get('consumabili').consumabili;
  const testi = leggi('contenuti/interfaccia.json');
  assert.equal(consumabili.length, 2);
  const registro = parametri.get('doni').statistiche;
  for (const c of consumabili) {
    assert.ok(testi.consumabili[c.id]?.nome, `testo del consumabile ${c.id}`);
    assert.ok(registro[c.statistica], `statistica '${c.statistica}' nel registro dei doni`);
  }
  for (const k of ['titolo', 'istruzione', 'cuore', 'comprato', 'esito_monete', 'esito_comprato']) assert.ok(testi.banchetto[k]);
  assert.equal(riempi(testi.banchetto.istruzione, { tasto: 'KeyE' }).includes('KeyE'), true);
});

test('regole: nessun Math.random, nessun numero di gioco e nessuna stringa di gioco nei moduli dell\'economia', () => {
  for (const f of ['motore/oggetti/economia.js', 'motore/oggetti/banchetto.js', 'motore/persistenza/profilo.js', 'motore/interfaccia/banchetto.js']) {
    const testo = readFileSync(join(RADICE, f), 'utf8');
    assert.ok(!/Math\.random/.test(testo), `${f}: Math.random`);
  }
  const eco = readFileSync(join(RADICE, 'motore/oggetti/economia.js'), 'utf8');
  for (const n of ['0.4', '0.40', '99', '15', '180', '300', '0.08', '1.25', '60']) {
    assert.ok(!new RegExp(`[^\\w.]${n.replace('.', '\\.')}(?![\\d.\\w])`).test(eco.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')), `economia.js contiene il numero ${n}`);
  }
  assert.equal(PCT, 100);
});

// ---------------------------------------------------------------------------------------------
// Formule (GDD Formulas e Acceptance Criteria)
// ---------------------------------------------------------------------------------------------

test('prezzo: tabella del Teatro (cuore 3, consumabile 5, dono 10/15/20) uguale sui piani 1-5 in aritmetica intera; sconti, minimo e tetto con la formula', async () => {
  const { parametri } = await caricaParametri();
  const P = (k) => parametri.get(`economia.prezzi.${k}`);
  const cinque = (v) => Array(5).fill(v);
  const attesi = {
    comune: cinque(PREZZI_TEATRO.comune), raro: cinque(PREZZI_TEATRO.raro), prezioso: cinque(PREZZI_TEATRO.prezioso), cuore: cinque(PREZZI_TEATRO.cuore), consumabile: cinque(PREZZI_TEATRO.consumabile),
  };
  for (let p = 1; p <= 5; p++) {
    for (const r of ['comune', 'raro', 'prezioso']) {
      assert.equal(prezzo({ base: P('base_dono'), rarPct: P(`rar_pct.${r}`), incPct: P('inc_pct'), piano: p }), attesi[r][p - 1], `${r} piano ${p}`);
    }
    assert.equal(prezzo({ base: P('base_cuore'), rarPct: PCT, incPct: P('inc_pct'), piano: p }), attesi.cuore[p - 1], `cuore piano ${p}`);
    assert.equal(prezzo({ base: P('base_consumabile'), rarPct: PCT, incPct: P('inc_pct'), piano: p }), attesi.consumabile[p - 1], `consumabile piano ${p}`);
  }
  // sconto 10 % → comune piano 1 = 16; sconto oltre sconto_max tagliato; mai sotto il minimo; piano 8 prezioso = 99 ≤ tetto
  assert.equal(prezzo({ base: 15, rarPct: 100, incPct: 15, piano: 1, scontoPct: 10 }), 16);
  assert.equal(prezzo({ base: 15, rarPct: 100, incPct: 15, piano: 1, scontoPct: 90, scontoMax: 30 }), prezzo({ base: 15, rarPct: 100, incPct: 15, piano: 1, scontoPct: 30 }));
  assert.equal(prezzo({ base: 1, rarPct: 100, incPct: 15, piano: 1, scontoPct: 90, scontoMax: 100, minimo: 1 }), 1);
  assert.equal(prezzo({ base: 15, rarPct: 300, incPct: 15, piano: 8 }), 99);
  assert.ok(prezzo({ base: 15, rarPct: 300, incPct: 15, piano: 8 }) <= parametri.get('economia.tetto_monete'));
});

test('formule: monete_boss = s0 + k × p (Teatro: 2 al piano 1), scintille_boss (3,5,7,9,11; +1 con la miglioria), p_cuore, residuo, costo_sblocco, E_stanza e T(3) dai valori di economia.json', async () => {
  const { parametri } = await caricaParametri();
  const E = (k) => parametri.get(`economia.${k}`);
  assert.deepEqual([1, 2, 3, 4, 5].map((p) => moneteBoss({ s0: E('monete_boss.s0'), k: E('monete_boss.k'), piano: p })), [1, 2, 3, 4, 5].map((p) => E('monete_boss.s0') + E('monete_boss.k') * p));
  assert.equal(moneteBoss({ s0: E('monete_boss.s0'), k: E('monete_boss.k'), piano: 1 }), 2, 'Teatro: il boss del piano 1 lascia 2 monete');
  assert.deepEqual([1, 2, 3, 4, 5].map((p) => scintilleBoss({ s0: E('scintille.s0'), ds: E('scintille.ds'), piano: p })), [3, 5, 7, 9, 11]);
  assert.equal(scintilleBoss({ s0: E('scintille.s0'), ds: E('scintille.ds'), piano: 3, bonus: 1 }), 8);
  const pc = (m) => pCuore({ m, k: E('p_cuore.k'), max: E('p_cuore.max') });
  assert.ok(Math.abs(pc(1) - 0.08) < 1e-12 && Math.abs(pc(3) - 0.24) < 1e-12 && pc(0) === 0 && Math.abs(pc(5) - 0.4) < 1e-12 && Math.abs(pc(8) - 0.4) < 1e-12);
  assert.equal(residuoNotte({ stanze: 11, perScintilla: E('scintille.stanze_per_scintilla') }), 2);
  assert.equal(residuoNotte({ stanze: 11, perScintilla: 0 }), 0);
  assert.equal(residuoNotte({ stanze: 0, perScintilla: 4 }), 0);
  const costo = (k) => costoSblocco({ k, c0: E('fucina.c0'), g: E('fucina.g'), costoMax: E('fucina.costo_max') });
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(costo), [4, 5, 6, 8, 10, 12, 15, 19, 24, 30, 37, 47]);
  assert.equal(costo(20), 60);
  const vMedio = valoreMedioMoneta({ qGrande: E('q_moneta_grande'), vPiccola: E('v_moneta_piccola'), vGrande: E('v_moneta_grande') });
  const vMedioAtteso = (1 - E('q_moneta_grande')) * E('v_moneta_piccola') + E('q_moneta_grande') * E('v_moneta_grande');
  assert.ok(Math.abs(vMedio - vMedioAtteso) < 1e-12, `v_medio ${vMedio}`);
  const eStanza = (p) => moneteAtteseStanza({ nNem: E('bilancio.n_nem_base') + p, pDrop: E('p_drop_moneta'), vMedio, bonus: E('bonus_stanza') });
  const eAttesa = (p) => (E('bilancio.n_nem_base') + p) * E('p_drop_moneta') * vMedioAtteso + E('bonus_stanza');
  assert.ok(Math.abs(eStanza(1) - eAttesa(1)) < 1e-9, `E_stanza(1) = ${eStanza(1)}`);
  assert.ok(Math.abs(eStanza(3) - eAttesa(3)) < 1e-9);
  const t3 = redditoPiano({ rho: E('bilancio.rho'), nComb: E('bilancio.n_comb'), eStanza: eStanza(3), pSegreta: E('p_segreta'), moneteSegreta: E('monete_segreta'), moneteBoss: moneteBoss({ s0: E('monete_boss.s0'), k: E('monete_boss.k'), piano: 3 }) });
  const t3Atteso = E('bilancio.rho') * E('bilancio.n_comb') * eAttesa(3) + E('p_segreta') * E('monete_segreta') + (E('monete_boss.s0') + E('monete_boss.k') * 3);
  assert.ok(Math.abs(t3 - t3Atteso) <= 1e-9, `T(3) = ${t3} ≠ ${t3Atteso}`);
});

test('drop: 10 000 stanze simulate al piano 1 con 5 nemici danno E = 5 × p_drop × v_medio + bonus_stanza (Teatro ≈ 0,70) ± 0,05 monete; 10 000 stanze con m = 3 danno 2400 ± 130 cuori; determinismo dal seme', async () => {
  const { parametri } = await caricaParametri();
  const E = (k) => parametri.get(`economia.${k}`);
  const rng = derivato(creaRng(SEME), 'drop');
  let totale = 0;
  for (let i = 0; i < 10000; i++) {
    let stanza = E('bonus_stanza');
    for (let n = 0; n < 5; n++) stanza += estraiMoneta({ rng, pDrop: E('p_drop_moneta'), qGrande: E('q_moneta_grande'), vPiccola: E('v_moneta_piccola'), vGrande: E('v_moneta_grande') });
    totale += stanza;
  }
  const media = totale / 10000;
  const vMedio = (1 - E('q_moneta_grande')) * E('v_moneta_piccola') + E('q_moneta_grande') * E('v_moneta_grande');
  const attesa = 5 * E('p_drop_moneta') * vMedio + E('bonus_stanza');
  assert.ok(Math.abs(media - attesa) <= 0.05, `media ${media} (attesa ${attesa.toFixed(3)})`);
  const pc = pCuore({ m: 3, k: E('p_cuore.k'), max: E('p_cuore.max') });
  let cuori = 0;
  for (let i = 0; i < 10000; i++) if (rng() < pc) cuori += 1;
  assert.ok(Math.abs(cuori - 2400) <= 130, `cuori ${cuori}`);
  // determinismo: stesso seme, stessa sequenza di drop
  const a = derivato(creaRng(7), 'drop');
  const b = derivato(creaRng(7), 'drop');
  const seqA = Array.from({ length: 50 }, () => estraiMoneta({ rng: a, pDrop: 0.4, qGrande: 0.1, vPiccola: 1, vGrande: 5 }));
  const seqB = Array.from({ length: 50 }, () => estraiMoneta({ rng: b, pDrop: 0.4, qGrande: 0.1, vPiccola: 1, vGrande: 5 }));
  assert.deepEqual(seqA, seqB);
  assert.ok(seqA.some((v) => v === 1) && seqA.some((v) => v === 0));
});

test('pool del banchetto: pesi di rarità per piano (60/30/10 al piano 1, somma 100 ai piani 1-5), estrazione solo tra i vendibili, null a pool vuoto', async () => {
  const { parametri } = await caricaParametri();
  const E = (k) => parametri.get(`economia.banchetto.${k}`);
  const pesi0 = { comune: E('peso_rarita.comune'), raro: E('peso_rarita.raro'), prezioso: E('peso_rarita.prezioso') };
  const derive = { comune: E('deriva_rarita_pct.comune'), raro: E('deriva_rarita_pct.raro'), prezioso: E('deriva_rarita_pct.prezioso') };
  assert.deepEqual(pesiRarita({ pesi: pesi0, derivePct: derive, piano: 1 }), { comune: 60, raro: 30, prezioso: 10 });
  for (let p = 1; p <= 5; p++) {
    const w = pesiRarita({ pesi: pesi0, derivePct: derive, piano: p });
    assert.ok(Math.abs(w.comune + w.raro + w.prezioso - 100) < 1e-9, `piano ${p}: ${JSON.stringify(w)}`);
    assert.ok(w.comune >= 0);
  }
  const catalogo = parametri.get('doni').doni;
  const rng = creaRng(3);
  const conteggi = new Map();
  for (let i = 0; i < 2000; i++) {
    const d = estraiDono({ catalogo, piano: 1, rng, pesi: pesiRarita({ pesi: pesi0, derivePct: derive, piano: 1 }) });
    assert.ok(d && ['comune', 'raro', 'prezioso'].includes(d.rarita) && d.piano_min <= 1 && d.mvp !== false);
    conteggi.set(d.rarita, (conteggi.get(d.rarita) ?? 0) + 1);
  }
  assert.ok(conteggi.get('comune') > conteggi.get('raro') && conteggi.get('raro') > conteggi.get('prezioso'), JSON.stringify([...conteggi]));
  // esclusi e pool vuoto
  const tutti = catalogo.map((d) => d.id);
  assert.equal(estraiDono({ catalogo, piano: 1, esclusi: tutti, rng, pesi: pesi0 }), null);
  const soloRari = estraiDono({ catalogo, piano: 1, esclusi: catalogo.filter((d) => d.rarita !== 'raro').map((d) => d.id), rng, pesi: pesi0 });
  assert.equal(soloRari.rarita, 'raro', 'classe vuota saltata, le altre rinormalizzate');
});

// ---------------------------------------------------------------------------------------------
// Criteri della storia (Given-When-Then)
// ---------------------------------------------------------------------------------------------

test('025.1: nemico morto → drop dalla tabella (p_drop_moneta del Teatro, 0,12; monete piccola/grande di economia.json) con il generatore `drop`; monete raccolte passandoci sopra; tetto 99 (la moneta resta a terra)', async () => {
  const m = await creaMondo();
  await m.avviaNotte();
  const stanza = m.notte.stanza.id;
  assert.equal(m.economia.stanzaCorrente, stanza);
  // N bottini sintetici di nemici comuni: la tabella dà p_drop_moneta monete (± 4σ binomiali), piccole o grandi
  const N_BOTTINI = 1000;
  const pDrop = m.E('p_drop_moneta');
  const sigma = Math.sqrt(N_BOTTINI * pDrop * (1 - pDrop));
  const [vPiccola, vGrande] = [m.E('v_moneta_piccola'), m.E('v_moneta_grande')];
  const lontano = { x: m.ferruccio.x + 300, y: m.ferruccio.y };
  for (let i = 0; i < N_BOTTINI; i++) m.eventi.emit('nemico.bottino', { id: `n${i}`, archetipo: 'gatto', ...lontano, monete: 7, cuore: false, direzione: { x: 1, y: 0 }, lancio: 0 });
  const aTerra = m.economia.aTerra(stanza);
  assert.ok(Math.abs(aTerra.length - N_BOTTINI * pDrop) <= 4 * sigma, `monete cadute ${aTerra.length} su ${N_BOTTINI} (attese ${N_BOTTINI * pDrop} ± ${(4 * sigma).toFixed(0)})`);
  assert.ok(aTerra.every((o) => o.tipo === 'moneta' && (o.valore === vPiccola || o.valore === vGrande)), 'valori della tabella, non quelli del nemico (7)');
  assert.ok(aTerra.some((o) => o.valore === vGrande), 'qualche moneta grande');
  // determinismo: un secondo mondo con lo stesso seme cade uguale
  const m2 = await creaMondo();
  await m2.avviaNotte();
  for (let i = 0; i < N_BOTTINI; i++) m2.eventi.emit('nemico.bottino', { id: `n${i}`, archetipo: 'gatto', ...lontano, monete: 7, cuore: false, direzione: { x: 1, y: 0 }, lancio: 0 });
  assert.deepEqual(m2.economia.aTerra(stanza).map((o) => o.valore), aTerra.map((o) => o.valore));
  // raccolta passandoci sopra: nessun tasto; una moneta a 1 px dentro il raggio e una appena fuori
  const prima = m.economia.monete;
  const r = m.E('r_raccolta_moneta');
  const moneta = m.economia.lascia(stanza, { tipo: 'moneta', valore: 1, x: m.ferruccio.x + r - 1, y: m.ferruccio.y });
  const fuori = m.economia.lascia(stanza, { tipo: 'moneta', valore: 1, x: m.ferruccio.x + r + 2, y: m.ferruccio.y });
  m.tick(1);
  assert.equal(m.economia.monete, prima + 1);
  assert.ok(!m.economia.aTerra(stanza).some((o) => o.id === moneta.id));
  assert.ok(m.economia.aTerra(stanza).some((o) => o.id === fuori.id), 'la moneta fuori raggio resta');
  const presa = m.eventiDi('economia.oggetto').filter((e) => e.payload.preso);
  assert.equal(presa.length, 1);
  // tetto 99: con 99 monete la moneta resta a terra e il contatore non cambia
  m.economia.aggiungiMonete(500);
  assert.equal(m.economia.monete, 99);
  const vicina = m.economia.lascia(stanza, { tipo: 'moneta', valore: 1, x: m.ferruccio.x, y: m.ferruccio.y });
  m.tick(3);
  assert.equal(m.economia.monete, 99);
  assert.ok(m.economia.aTerra(stanza).some((o) => o.id === vicina.id), 'a 99 la moneta resta a terra');
  // dopo aver speso si può riprenderla
  assert.equal(m.economia.togliMonete(10), true);
  m.tick(1);
  assert.equal(m.economia.monete, 90);
  assert.ok(!m.economia.aTerra(stanza).some((o) => o.id === vicina.id));
});

test('025.1b: stanza ripulita → bonus_stanza monete al centro e cuore con p_cuore; le monete restano a terra anche dopo l\'uscita dalla stanza', async () => {
  const m = await creaMondo();
  await m.avviaNotte();
  // stanza di combattimento: entra, aspetta i nemici, uccidi, aspetta la ricompensa
  const normale = m.vaiA('normale');
  m.tick(m.ticks('stanze.t_marker') + 2);
  assert.ok(m.bersagli.length > 0, 'nemici comparsi');
  m.ferruccio.impostaMaschere(2); // m = 3 → p_cuore 0,24
  // Ferruccio lontano dal centro (il bonus cade lì e si raccoglie passandoci sopra)
  const st = m.notte.stanza;
  m.ferruccio.posiziona(st.origine.x + st.cella * 1.5, st.origine.y + st.cella * 1.5);
  m.uccidiTutti();
  m.tick(m.ticks('stanze.t_ritardo_apertura') + 2);
  assert.equal(m.notte.stanza.stato, 'pulita');
  assert.equal(m.eventiDi('stanza.ricompensa').length, 1);
  const monete = m.economia.aTerra(normale.id).filter((o) => o.tipo === 'moneta');
  assert.ok(monete.length >= m.E('bonus_stanza'), `bonus di stanza: ${monete.length} monete`);
  assert.equal(m.economia.stanzeRipulite, 1);
  // uscita e rientro: gli oggetti non presi restano nella stanza
  const nPrima = m.economia.aTerra(normale.id).length;
  m.vaiA('ingresso');
  assert.equal(m.economia.aTerra(normale.id).length, nPrima);
  assert.equal(m.economia.aTerra().length, 0, 'l\'ingresso non ha oggetti');
  // cuore: a maschere piene resta a terra e la vita non cambia; a maschere mancanti ripristina 1
  m.ferruccio.impostaMaschere(m.mod.valore('ferruccio.maschere_max'));
  const qui = m.notte.stanza.id;
  const cuore = m.economia.lascia(qui, { tipo: 'cuore', valore: 1, x: m.ferruccio.x, y: m.ferruccio.y });
  m.tick(2);
  assert.ok(m.economia.aTerra(qui).some((o) => o.id === cuore.id), 'a maschere piene il cuore resta');
  m.ferruccio.impostaMaschere(1);
  m.tick(1);
  assert.equal(m.ferruccio.maschere, 2);
  assert.ok(!m.economia.aTerra(qui).some((o) => o.id === cuore.id));
});

test('025.2: banchetto con tre slot (dono, cuore, consumabile) e prezzi dalla formula; a monete insufficienti il prezzo è barrato (non accessibile) e l\'acquisto rifiutato', async () => {
  const m = await creaMondo();
  await m.avviaNotte();
  const slots = m.banchetto.slots();
  assert.deepEqual(slots.map((s) => s.tipo), TIPI_SLOT);
  assert.ok(m.catalogoDoni.some((d) => d.id === slots[0].id), 'il dono viene dal catalogo');
  assert.equal(slots[0].prezzo, m.economia.prezzoDi({ tipo: 'dono', rarita: slots[0].rarita, piano: 1 }));
  assert.equal(slots[1].prezzo, PREZZI_TEATRO.cuore);
  assert.equal(slots[2].prezzo, PREZZI_TEATRO.consumabile);
  assert.ok(m.consumabili.some((c) => c.id === slots[2].id));
  assert.equal(slots[0].prezzo, PREZZI_TEATRO[slots[0].rarita]);
  // monete 0: tutto non accessibile (prezzo barrato), acquisto rifiutato senza cambiamenti
  assert.ok(slots.every((s) => s.accessibile === false));
  const esito = m.banchetto.compra(0);
  assert.deepEqual([esito.esito, esito.motivo], ['rifiutato', 'monete']);
  assert.equal(m.economia.monete, 0);
  assert.deepEqual(m.mod.doniAttivi(), []);
  assert.equal(m.eventiDi('banchetto.rifiutato').length, 1);
  // prezzo − 1: ancora rifiutato; prezzo esatto: comprato, monete a 0, dono attivo nello stesso frame
  const prezzoDono = slots[0].prezzo;
  m.economia.aggiungiMonete(prezzoDono - 1);
  assert.equal(m.banchetto.slots()[0].accessibile, false);
  assert.equal(m.banchetto.compra(0).esito, 'rifiutato');
  assert.equal(m.economia.monete, prezzoDono - 1);
  m.economia.aggiungiMonete(1);
  assert.equal(m.banchetto.slots()[0].accessibile, true);
  const ok = m.banchetto.compra(0);
  assert.equal(ok.esito, 'comprato');
  assert.equal(m.economia.monete, 0);
  assert.deepEqual(m.mod.doniAttivi(), [slots[0].id]);
  assert.equal(m.banchetto.slots()[0].comprato, true);
  assert.equal(m.banchetto.compra(0).motivo, 'vuoto', 'uno slot comprato è vuoto');
  assert.equal(m.eventiDi('banchetto.acquisto').length, 1);
  // cuore a maschere piene: negato, monete invariate; a maschere mancanti: +1 maschera
  m.economia.aggiungiMonete(50);
  assert.equal(m.banchetto.slots()[1].accessibile, false, 'a maschere piene il cuore non è accessibile');
  assert.equal(m.banchetto.compra(1).motivo, 'maschere_piene');
  assert.equal(m.economia.monete, 50);
  m.ferruccio.impostaMaschere(1);
  assert.equal(m.banchetto.compra(1).esito, 'comprato');
  assert.equal(m.ferruccio.maschere, 2);
  assert.equal(m.economia.monete, 50 - PREZZI_TEATRO.cuore);
  // consumabile: applicato subito, dura N stanze ripulite, il riacquisto rinnova
  const def = m.consumabili.find((c) => c.id === m.banchetto.slots()[2].id);
  const statistica = m.parametri.get('doni').statistiche[def.statistica].parametro;
  const prima = m.mod.valore(statistica);
  // il valore effettivo resta nel Safe Range della statistica (ADR-0002): con un dono già addosso la somma può toccare il tetto
  const tetto = m.parametri.statistica(statistica).max;
  const conConsumabile = Math.min(tetto, prima + def.valore);
  assert.equal(m.banchetto.compra(2).esito, 'comprato');
  assert.equal(m.mod.valore(statistica), conConsumabile);
  assert.deepEqual(m.economia.consumabili(), [{ id: def.id, restanti: def.durata_stanze }]);
  for (let i = 0; i < def.durata_stanze - 1; i++) m.eventi.emit('stanza.pulita', { id: 'x', tipo: 'normale', combattuta: true });
  assert.equal(m.economia.consumabili()[0].restanti, 1);
  const rinnovo = m.economia.applicaConsumabile(def);
  assert.equal(rinnovo.rinnovato, true);
  assert.equal(m.economia.consumabili()[0].restanti, def.durata_stanze, 'la durata si rinnova, non si somma');
  assert.equal(m.mod.valore(statistica), conConsumabile, 'l\'effetto non si somma');
  for (let i = 0; i < def.durata_stanze; i++) m.eventi.emit('stanza.pulita', { id: 'x', tipo: 'normale', combattuta: true });
  assert.deepEqual(m.economia.consumabili(), []);
  assert.equal(m.mod.valore(statistica), prima);
});

test('025.2b: nella stanza del banchetto gli slot hanno una posizione; `interagisci` entro r_interagisci compra lo slot vicino; fuori portata no; rientro → slot conservati', async () => {
  const m = await creaMondo();
  await m.avviaNotte();
  const banchettoRecord = m.vaiA('banchetto');
  assert.equal(m.notte.stanza.tipo, 'banchetto');
  const punti = puntiSlot(m.notte.stanza, 3);
  assert.equal(punti.length, 3);
  m.banchetto.posiziona(punti);
  m.banchetto.attiva(true);
  // lontano: niente
  m.economia.aggiungiMonete(99);
  m.ferruccio.posiziona(punti[1].x, punti[1].y + m.E('r_interagisci') + 40);
  m.premi('interagisci');
  assert.equal(m.eventiDi('banchetto.acquisto').length, 0);
  assert.equal(m.banchetto.vicino(), -1);
  // vicino allo slot 2 (consumabile): comprato con il tasto
  m.ferruccio.posiziona(punti[2].x, punti[2].y);
  assert.equal(m.banchetto.vicino(), 2);
  m.premi('interagisci');
  assert.equal(m.eventiDi('banchetto.acquisto').length, 1);
  assert.equal(m.eventiDi('banchetto.acquisto')[0].payload.tipo, 'consumabile');
  assert.equal(m.economia.monete, 99 - PREZZI_TEATRO.consumabile);
  // uscita e rientro: lo slot comprato resta vuoto, gli altri uguali
  const primaUscita = m.banchetto.slots().map((s) => [s.tipo, s.id, s.prezzo, s.comprato]);
  m.banchetto.attiva(false);
  m.vaiA('ingresso');
  m.notte.vaiA(banchettoRecord.id);
  m.tick(m.ticks('stanze.camera.t_transizione') + 2);
  m.banchetto.attiva(true);
  assert.deepEqual(m.banchetto.slots().map((s) => [s.tipo, s.id, s.prezzo, s.comprato]), primaUscita);
  assert.equal(m.banchetto.slots()[2].comprato, true);
  // con il banchetto disattivo il tasto non compra
  m.banchetto.attiva(false);
  m.ferruccio.posiziona(punti[1].x, punti[1].y);
  m.ferruccio.impostaMaschere(1);
  m.premi('interagisci');
  assert.equal(m.eventiDi('banchetto.acquisto').length, 1);
});

test('025.3: alla morte le monete della notte si perdono (34 → 0) e le scintille (3) restano nel profilo, anche ricaricando il salvataggio; il residuo di notte è accreditato una volta', async () => {
  const memoria = memoriaInRam();
  const m = await creaMondo({ memoria });
  await m.avviaNotte();
  m.economia.aggiungiMonete(34);
  m.economia.aggiungiScintille(3, 'prova');
  assert.equal(m.profilo.scintille, 3);
  assert.equal(m.economia.scintille, 3);
  // già persistite prima della morte
  assert.equal(m.salvataggio.carica('profilo', m.slot).scintille, 3);
  for (let i = 0; i < 11; i++) m.eventi.emit('stanza.pulita', { id: 'x', tipo: 'normale', combattuta: true });
  m.ferruccio.impostaMaschere(1);
  m.ferruccio.subisciDanno({ danno: 1, x: m.ferruccio.x + 30, y: m.ferruccio.y });
  assert.equal(m.ferruccio.stato, 'morto');
  assert.equal(m.economia.monete, 0);
  assert.equal(m.eventiDi('economia.morte')[0].payload.monete_perse, 34);
  assert.equal(m.economia.conclusa, true);
  const residuo = m.eventiDi('economia.fine_notte')[0].payload.residuo;
  assert.equal(residuo, 2, 'floor(11 / 4)');
  assert.equal(m.profilo.scintille, 3 + 2);
  // il profilo riletto da un altro modulo di salvataggio sulla stessa memoria ha le scintille
  const altro = creaProfilo({ salvataggio: creaSalvataggio({ memoria, log: m.log, ora: () => 1 }), slot: m.slot });
  assert.equal(altro.scintille, 5);
  // morte ripetuta o fine notte ripetuta: nessun secondo residuo
  assert.equal(m.economia.fineNotte(), 0);
  assert.equal(m.economia.morte(), 0);
  assert.equal(m.profilo.scintille, 5);
  // rubinetto spento: residuo 0 senza errore
  const m0 = await creaMondo({ override: { 'economia.scintille.stanze_per_scintilla': 0 } });
  for (let i = 0; i < 11; i++) m0.eventi.emit('stanza.pulita', { id: 'x', tipo: 'normale', combattuta: true });
  assert.equal(m0.economia.fineNotte(), 0);
  // profilo corrotto o assente → predefiniti
  assert.deepEqual(normalizzaProfilo(null), { scintille: 0, sblocchi: [], ricordi_restituiti: [] });
  assert.equal(normalizzaProfilo({ scintille: -4 }).scintille, 0);
});

test('025.4: boss battuto → cadono le scintille del piano (3 al piano 1, 7 al piano 3; 8 con la miglioria) subito nel profilo e le monete del boss (s0 + k × p: Teatro 2 e 4) a terra; un solo pagamento per piano', async () => {
  const m = await creaMondo();
  const mb = (p) => m.E('monete_boss.s0') + m.E('monete_boss.k') * p;
  m.economia.entraIn('b');
  const bottino = { id: 'boss', archetipo: 'guardia', boss: true, x: 100, y: 100, monete: 0, cuore: false, direzione: { x: 0, y: 1 }, lancio: 40 };
  m.eventi.emit('nemico.bottino', bottino);
  assert.equal(m.profilo.scintille, 3);
  assert.equal(m.eventiDi('economia.scintille')[0].payload.motivo, 'boss');
  const monete = m.economia.aTerra('b').filter((o) => o.tipo === 'moneta');
  assert.equal(monete.reduce((a, o) => a + o.valore, 0), mb(1));
  assert.deepEqual([monete[0].x, monete[0].y], [100, 140], 'lanciata nella direzione del bottino');
  m.eventi.emit('nemico.bottino', bottino);
  assert.equal(m.profilo.scintille, 3, 'un solo pagamento per piano');
  // piano 3 e miglioria «Scintilla in più»
  const m3 = await creaMondo({ piano: 3 });
  m3.economia.entraIn('b');
  m3.eventi.emit('nemico.bottino', bottino);
  assert.equal(m3.profilo.scintille, 7);
  assert.equal(m3.economia.aTerra('b').reduce((a, o) => a + o.valore, 0), mb(3));
  const m3b = await creaMondo({ piano: 3, override: { 'economia.scintille.bonus_boss': 1 } });
  m3b.economia.entraIn('b');
  m3b.eventi.emit('nemico.bottino', bottino);
  assert.equal(m3b.profilo.scintille, 8);
  // il cuore del boss (payload cuore: true) cade a terra come gli altri
  m.eventi.emit('nemico.bottino', { ...bottino, cuore: true, monete: 0 });
  assert.equal(m.economia.aTerra('b').filter((o) => o.tipo === 'cuore').length, 1);
  // tetto tecnico delle scintille
  m.economia.aggiungiScintille(10 ** 9, 'prova');
  assert.equal(m.profilo.scintille, m.E('tetto_scintille'));
});

test('prestazioni: drop e prezzo sotto 0,05 ms per evento; il tick dell\'economia senza oggetti è gratuito', async () => {
  const { parametri } = await caricaParametri();
  const E = (k) => parametri.get(`economia.${k}`);
  const rng = derivato(creaRng(SEME), 'drop');
  const n = 20000;
  const t0 = performance.now();
  let somma = 0;
  for (let i = 0; i < n; i++) {
    somma += estraiMoneta({ rng, pDrop: E('p_drop_moneta'), qGrande: E('q_moneta_grande'), vPiccola: E('v_moneta_piccola'), vGrande: E('v_moneta_grande') });
    somma += prezzo({ base: E('prezzi.base_dono'), rarPct: E('prezzi.rar_pct.raro'), incPct: E('prezzi.inc_pct'), piano: 1 + (i % 5) });
  }
  const perEvento = (performance.now() - t0) / n;
  assert.ok(somma > 0);
  assert.ok(perEvento < 0.05, `${perEvento.toFixed(4)} ms per evento`);
  const m = await creaMondo();
  m.economia.entraIn('x');
  const t1 = performance.now();
  for (let i = 0; i < 10000; i++) m.economia.tick();
  assert.ok((performance.now() - t1) / 10000 < 0.01);
});
