/**
 * gioco/qa/doni.test.mjs — Test unitari delle storie 023 (modificatori, doni, ganci, sinergie) e 024
 * (catalogo MVP, pool: eleggibilità, probabilità, rimozione, flag), senza DOM.
 *
 * Esecuzione: `node gioco/qa/doni.test.mjs` dalla radice (node:test, Node ≥ 20). Parametri e catalogo
 * sono i JSON reali di `contenuti/parametri/`; dove un criterio cita una statistica che il
 * combattimento non ha ancora (`parata_riflette`) il test aggiunge una statistica di prova ai
 * parametri in memoria, senza toccare i file. Un caso per ogni criterio Given-When-Then della storia e
 * per i criteri del GDD doni-modificatori.md che riguardano il calcolo, i ganci e le sinergie.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import { creaParametri } from '../motore/fondazione/parametri.js';
import { creaBus } from '../motore/fondazione/eventi.js';
import { creaRng, derivato } from '../motore/fondazione/rng.js';
import { creaModificatori } from '../motore/oggetti/modificatori.js';
import { validaCatalogo } from '../motore/oggetti/catalogo.js';
import { creaLibreria } from '../motore/oggetti/effetti.js';
import { creaPool, flagSoddisfatto, scegliPesato } from '../motore/oggetti/pool.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const CARTELLA = join(QUI, '..', 'contenuti', 'parametri');
const leggiJson = (nome) => JSON.parse(readFileSync(join(CARTELLA, `${nome}.json`), 'utf8'));

/** Statistica di prova per il criterio 2 della storia: non esiste (ancora) in combattimento.json. */
const PROVA = Object.freeze({ file: 'combattimento', chiave: 'parata_riflette', voce: { base: 0, min: 0, max: 1 } });

function logFinto() {
  const voci = [];
  return { voci, error: (...a) => voci.push(a.map(String).join(' ')) };
}

/**
 * Mondo di prova: parametri reali (+ statistica di prova), catalogo e sinergie reali, bus, rng seminato.
 * @param {{ seme?: number, senzaCatalogo?: boolean, catalogo?: object, sinergie?: object }} [o]
 */
async function crea({ seme = 1845, senzaCatalogo = false, catalogo = null, sinergie = null } = {}) {
  const log = logFinto();
  const parametri = creaParametri({ log });
  await parametri.carica({
    caricatore: (nome) => {
      const json = leggiJson(nome);
      if (nome === PROVA.file) json[PROVA.chiave] = { ...PROVA.voce };
      return json;
    },
    statistiche: ['ferruccio', 'combattimento', 'stanza'],
  });
  assert.deepEqual(parametri.errori(), []);
  const eventi = creaBus({ log });
  const ricevuti = [];
  for (const nome of ['doni.scintilla', 'doni.catena', 'doni.onda', 'doni.cura', 'doni.ricarica_scatto', 'doni.aggiunto', 'doni.rimosso', 'doni.sinergie']) {
    eventi.on(nome, (p) => ricevuti.push({ nome, payload: p }));
  }
  const mod = creaModificatori(parametri, {
    catalogo: senzaCatalogo ? null : catalogo ?? leggiJson('doni'),
    sinergie: senzaCatalogo ? null : sinergie ?? leggiJson('sinergie'),
    eventi,
    rng: derivato(creaRng(seme), 'doni'),
    log,
  });
  return { parametri, eventi, mod, log, ricevuti };
}

const vicino = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// Valori del Teatro letti dai JSON reali (mai ricopiati come costanti): un dono cambia nel catalogo, il test segue.
const CATALOGO_REALE = leggiJson('doni');
const FERRUCCIO = leggiJson('ferruccio');
const COMBATTIMENTO = leggiJson('combattimento');
const SINERGIE = leggiJson('sinergie');
const donoReale = (id) => CATALOGO_REALE.doni.find((d) => d.id === id);
const sinergiaReale = (id) => SINERGIE.sinergie.find((s) => s.id === id);
/** Somma dei modificatori `somma` dei doni dati su una statistica. */
const sommaSu = (ids, statistica) => ids.reduce((a, id) => a + donoReale(id).modificatori.filter((m) => m.statistica === statistica && m.operazione === 'somma').reduce((s, m) => s + m.valore, 0), 0);
/** Prodotto dei modificatori `moltiplica` dei doni dati su una statistica. */
const prodottoSu = (ids, statistica) => ids.reduce((a, id) => a * donoReale(id).modificatori.filter((m) => m.statistica === statistica && m.operazione === 'moltiplica').reduce((s, m) => s * m.valore, 1), 1);
const clampa = (v, voce) => Math.min(voce.max, Math.max(voce.min, v));

// ---------------------------------------------------------------------------------------------
// Criteri della storia 023
// ---------------------------------------------------------------------------------------------

test('S023-1: danno base 1, +1 somma e ×1,5 → 3 (prima le somme, poi i moltiplicatori); un terzo dono oltre il massimo dà il massimo del JSON (clamp)', async () => {
  const { mod } = await crea();
  assert.equal(mod.valore('combattimento.danno'), 1);
  mod.applica({ statistica: 'combattimento.danno', operazione: 'somma', valore: 1 });
  mod.applica({ statistica: 'combattimento.danno', operazione: 'moltiplica', valore: 1.5 });
  assert.equal(mod.valore('combattimento.danno'), 3, '(1 + 1) × 1,5 = 3, non 1 × 1,5 + 1 = 2,5');
  // terzo dono: ×2 porterebbe (1+1)×1,5×2 = 6 → Π cap 2,0 → (1+1)×2 = 4; con una somma +2 in più → (1+1+2)×2 = 8 → clamp 5
  mod.applica({ statistica: 'combattimento.danno', operazione: 'moltiplica', valore: 2 });
  assert.equal(mod.valore('combattimento.danno'), 4, 'Π = 3,0 bloccato al cap 2,0 di danno');
  // storia P04: il massimo del danno viene dal JSON (il Teatro arriva oltre 30 di danno): si somma fino a superarlo
  const maxDanno = leggiJson('combattimento').danno.max;
  const via = mod.applica({ statistica: 'combattimento.danno', operazione: 'somma', valore: maxDanno });
  assert.equal(mod.valore('combattimento.danno'), maxDanno, 'clamp al massimo della statistica (letto dal JSON)');
  via();
  assert.equal(mod.valore('combattimento.danno'), 4, 'il clamp è sul risultato, non sulla lista');
});

test('S023-2: un dono che imposta parata_riflette = true vince su somme e moltiplicatori', async () => {
  const { mod } = await crea();
  const nome = `${PROVA.file}.${PROVA.chiave}`;
  assert.equal(mod.valore(nome), 0);
  mod.applica({ statistica: nome, operazione: 'somma', valore: -5 });
  mod.applica({ statistica: nome, operazione: 'moltiplica', valore: 0.5 });
  assert.equal(mod.valore(nome), 0, 'senza imposta: (0 − 5) × 0,5 → clamp 0');
  const via = mod.applica({ statistica: nome, operazione: 'imposta', valore: true });
  // imposta sostituisce la base: (1 − 5) × 0,5 = −2 → clamp 0. Per vedere che imposta vince, isoliamo:
  via();
  mod.azzera();
  mod.applica({ statistica: nome, operazione: 'imposta', valore: true });
  assert.equal(mod.valore(nome), 1, 'imposta true → 1');
  mod.applica({ statistica: nome, operazione: 'somma', valore: 3 });
  mod.applica({ statistica: nome, operazione: 'moltiplica', valore: 2 });
  assert.equal(mod.valore(nome), 1, 'imposta sostituisce la base; somme e moltiplicatori agiscono dopo e il clamp 0–1 tiene');
  // con il catalogo reale: Grembiule di cuoio imposta armatura 1 (GDD criterio 3)
  assert.equal(mod.valore('ferruccio.armatura'), 0);
  assert.ok(mod.aggiungiDono('grembiule-di-cuoio'));
  assert.equal(mod.valore('ferruccio.armatura'), 1);
  assert.equal(mod.valore('armatura'), 1, 'anche con il nome corto del registro');
  // imposta e somma sulla stessa statistica: 1 + 1 → 2 → clamp 1 (edge case del GDD)
  mod.applica({ statistica: 'armatura', operazione: 'somma', valore: 1 });
  assert.equal(mod.valore('armatura'), 1);
});

test('S023-2b: due imposta sulla stessa statistica: vince il dono raccolto per ultimo; a parità di istante l\'id minore', async () => {
  const { mod } = await crea();
  const nome = `${PROVA.file}.${PROVA.chiave}`;
  mod.applica({ statistica: nome, operazione: 'imposta', valore: 1 });
  mod.applica({ statistica: nome, operazione: 'imposta', valore: 0 });
  assert.equal(mod.valore(nome), 0, 'l\'ultimo imposta vince, non si sommano');
  mod.applica({ statistica: nome, operazione: 'imposta', valore: 1 });
  assert.equal(mod.valore(nome), 1);
});

test('S023-3: un dono iscritto a su_parata con effetto lancia_scintilla: alla parata l\'effetto di libreria è invocato con i suoi parametri', async () => {
  const catalogo = leggiJson('doni');
  catalogo.doni.push({
    id: 'prova-scintilla', nome: 'Prova', categoria: 'fili', rarita: 'comune', mvp: false, modificatori: [],
    ganci: [{ evento: 'su_parata', probabilita: 1.0, ricarica_ms: 0, max_per_stanza: null, effetto: 'lancia_scintilla', parametri: { n: 2, danno: 1 } }],
    tag: [], sagoma: { tipo: 'geometrica', forma: 'prova' }, cartiglio: '', piano_min: 1, piano_fisso: null,
    canale: ['piedistallo'], sblocco: null, richiede_flag: null, escludi_se_flag: null, peso: 1, scelta: null, fonte: 'generico',
  });
  const { mod, ricevuti, log } = await crea({ catalogo });
  assert.deepEqual(mod.errori(), [], log.voci.join('\n'));
  assert.ok(mod.aggiungiDono('prova-scintilla'));
  const attaccante = { x: 400, y: 300 };
  const esiti = mod.ganci.emetti('su_parata', { x: 380, y: 300, direzione: { x: 1, y: 0 }, bersaglio: attaccante });
  assert.equal(esiti.length, 1);
  assert.equal(esiti[0].effetto, 'scintilla');
  assert.equal(esiti[0].n, 2);
  assert.equal(esiti[0].danno, 1);
  assert.equal(esiti[0].rimbalzi, 0, 'predefinito dai dati');
  assert.equal(esiti[0].raggio_rimbalzo_px, 120);
  assert.equal(esiti[0].ventaglio_gradi, 60);
  assert.deepEqual(esiti[0].da, { x: 400, y: 300 }, 'parte dal bersaglio (l\'attaccante parato)');
  assert.equal(esiti[0].origine, 'gancio');
  const evento = ricevuti.find((r) => r.nome === 'doni.scintilla');
  assert.ok(evento, 'la richiesta è emessa sul bus per il livello che la esegue');
  assert.equal(evento.payload.dono, 'prova-scintilla');
  // un gancio non iscritto non fa nulla; un nome di gancio sconosciuto è un errore di programmazione
  assert.deepEqual(mod.ganci.emetti('su_affondo', {}), []);
  assert.throws(() => mod.ganci.emetti('su_inesistente', {}), RangeError);
});

test('S023-4: due doni con tag scintilla e catena: la sinergia S1 si applica una sola volta (rimbalzi +2, non +4)', async () => {
  const { mod, ricevuti } = await crea();
  assert.ok(mod.aggiungiDono('acciarino'));
  assert.deepEqual(mod.sinergieAttive(), [], 'Acciarino da solo: scintilla + fuoco sullo stesso dono non attiva S4');
  assert.ok(mod.aggiungiDono('catena-della-chiusa'));
  // S1 (scintilla da Acciarino, catena da Catena) e S2 (fuoco da Acciarino, ferro da Catena): due doni distinti
  // per entrambe. L'esempio in prosa del GDD dice «S2 no», ma la sua formula `sinergia_attiva` la rende vera.
  assert.deepEqual(mod.sinergieAttive(), ['S1', 'S2']);
  let iscr = mod.ganci.iscrizioni('su_colpo');
  assert.equal(iscr.length, 1);
  assert.equal(iscr[0].parametri.rimbalzi, 2, 'param_extra: rimbalzi 0 + 2');
  // un terzo dono con lo stesso tag `scintilla` (Filo spezzato) non raddoppia la sinergia
  assert.ok(mod.aggiungiDono('filo-spezzato'));
  assert.ok(mod.sinergieAttive().includes('S1'));
  assert.equal(mod.sinergieAttive().filter((s) => s === 'S1').length, 1);
  iscr = mod.ganci.iscrizioni('su_colpo');
  assert.equal(iscr[0].parametri.rimbalzi, 2, 'ancora +2, non +4');
  // Filo spezzato porta `parata` + `scintilla` sullo stesso dono: S6 serve due doni distinti → attiva perché Acciarino ha scintilla
  assert.ok(mod.sinergieAttive().includes('S6'));
  const parata = mod.ganci.iscrizioni('su_parata');
  assert.equal(parata.length, 2, 'Filo spezzato + ganci_extra di S6: due iscrizioni indipendenti, non si fondono');
  // togliendo l'Acciarino, S1 resta (Filo spezzato ha scintilla, Catena ha catena); togliendo anche il Filo si spegne
  assert.ok(mod.rimuoviDono('acciarino'));
  assert.ok(mod.sinergieAttive().includes('S1'));
  assert.ok(mod.rimuoviDono('filo-spezzato'));
  assert.deepEqual(mod.sinergieAttive(), []);
  assert.ok(ricevuti.some((r) => r.nome === 'doni.sinergie'));
});

test('S023-5: il catalogo reale passa il validatore (il resto è in qa/parametri.test.js)', async () => {
  const { parametri } = await crea();
  const catalogo = leggiJson('doni');
  const libreria = creaLibreria(catalogo.effetti).voci;
  const esito = validaCatalogo(catalogo, { parametri, libreria });
  assert.deepEqual(esito.errori, []);
  assert.equal(esito.indice.size, catalogo.doni.length, 'nessun dono del Teatro escluso');
});

// ---------------------------------------------------------------------------------------------
// Criteri del GDD doni-modificatori.md sul calcolo
// ---------------------------------------------------------------------------------------------

test('GDD: senza doni danno 1,0, v_base 220, t_finestra_p 180; Medaglione + ×1,5 → danno 3,0', async () => {
  const { mod } = await crea();
  assert.equal(mod.valore('danno'), 1);
  assert.equal(mod.valore('v_base'), 220);
  assert.equal(mod.valore('t_finestra_p'), 180);
  assert.ok(mod.aggiungiDono('medaglione-di-rosa'));
  mod.applica({ statistica: 'danno', operazione: 'moltiplica', valore: 1.5 });
  assert.equal(mod.valore('danno'), 3);
  assert.deepEqual(mod.doniAttivi(), ['medaglione-di-rosa']);
});

test('GDD/Teatro: t_invuln con Sciarpa cremisi, Fazzoletto e Lettera di Mariella (valori di doni.json) supera il tetto → clamp a t_invuln.max; con S3 resta al tetto; togliendo doni scende senza eccedenza accumulata', async () => {
  const { mod } = await crea();
  const voce = FERRUCCIO.t_invuln;
  const s3 = sinergiaReale('S3').effetto.modificatori[0].valore;
  const attesa = (ids, conS3) => clampa(voce.base + sommaSu(ids, 't_invuln') + (conS3 ? s3 : 0), voce);
  const tre = ['seta-grezza', 'fazzoletto-col-giglio', 'lettera-di-mariella'];
  for (const id of tre) assert.ok(mod.aggiungiDono(id));
  assert.deepEqual(mod.sinergieAttive(), [], 'nessun filo: S3 non attiva');
  assert.ok(voce.base + sommaSu(tre, 't_invuln') > voce.max, 'il caso prova davvero il tetto');
  assert.equal(mod.valore('t_invuln'), voce.max, 'oltre il tetto → clamp');
  assert.ok(mod.aggiungiDono('filo-teso'));
  assert.ok(mod.sinergieAttive().includes('S3'));
  assert.equal(mod.valore('t_invuln'), attesa([...tre, 'filo-teso'], true));
  assert.ok(mod.rimuoviDono('fazzoletto-col-giglio'));
  assert.equal(mod.valore('t_invuln'), attesa(['seta-grezza', 'lettera-di-mariella'], true));
  assert.ok(mod.rimuoviDono('seta-grezza'));
  assert.ok(!mod.sinergieAttive().includes('S3'), 'senza seta S3 cade');
  assert.equal(mod.valore('t_invuln'), attesa(['lettera-di-mariella'], false), 'l\'eccedenza non si accumula');
  assert.ok(mod.valore('t_invuln') < voce.max);
});

test('GDD: t_finestra_p +70 +70 → 300; v_base ×0,5 → 150; tre ×1,3 → Π bloccato al cap del JSON', async () => {
  const { mod } = await crea();
  mod.applica({ statistica: 't_finestra_p', operazione: 'somma', valore: 70 });
  mod.applica({ statistica: 't_finestra_p', operazione: 'somma', valore: 70 });
  assert.equal(mod.valore('t_finestra_p'), 300);
  mod.applica({ statistica: 'v_base', operazione: 'moltiplica', valore: 0.5 });
  assert.equal(mod.valore('v_base'), 150, 'Π = max(0,5; 0,6) = 0,6 → 132 → clamp 150');
  mod.azzera();
  for (let i = 0; i < 3; i++) mod.applica({ statistica: 'v_base', operazione: 'moltiplica', valore: 1.3 });
  // storia P04: il cap Π di v_base e il massimo vengono dai JSON (Teatro: speed fino a 2,0)
  const capV = leggiJson('doni').statistiche.v_base.pi_cap.max;
  const attesoV = Math.min(leggiJson('ferruccio').v_base.max, 220 * Math.min(capV, 1.3 ** 3));
  assert.ok(vicino(mod.valore('v_base'), attesoV), `Π 2,197 → cap ${capV} → ${attesoV}; ottenuto ${mod.valore('v_base')}`);
});

test('GDD/Teatro: Stivali + Martello + Grembiule → v_base = (base + somme) × Π dei moltiplicatori del catalogo (± 0,1); t_recupero_f arrotondato a intero; Martello danno +1; S2 fuoco + ferro', async () => {
  const { mod } = await crea();
  const tre = ['pantofole-di-seta', 'martello-da-fabbro', 'grembiule-di-cuoio'];
  for (const id of tre) assert.ok(mod.aggiungiDono(id));
  const vAtteso = clampa((FERRUCCIO.v_base.base + sommaSu(tre, 'v_base')) * prodottoSu(tre, 'v_base'), FERRUCCIO.v_base);
  assert.ok(Math.abs(mod.valore('v_base') - vAtteso) <= 0.1, `${mod.valore('v_base')} ≠ ${vAtteso}`);
  const tRec = (ids) => Math.round(clampa((COMBATTIMENTO.t_recupero_f.base + sommaSu(ids, 't_recupero_f')) * prodottoSu(ids, 't_recupero_f'), COMBATTIMENTO.t_recupero_f));
  assert.equal(mod.valore('t_recupero_f'), tRec(tre));
  assert.ok(mod.aggiungiDono('mantice'));
  assert.equal(mod.valore('t_recupero_f'), tRec([...tre, 'mantice']), 'ms arrotondati a intero');
  assert.equal(mod.valore('t_recupero_f'), Math.round(mod.valore('t_recupero_f')));
  assert.ok(mod.valore('t_recupero_f') < tRec(tre), 'il Mantice accorcia il recupero');
  assert.equal(mod.valore('danno'), COMBATTIMENTO.danno.base + sommaSu([...tre, 'mantice'], 'danno'), 'Martello: danno +1');
  assert.ok(mod.sinergieAttive().includes('S2'), 'fuoco (Mantice) + ferro (Martello)');
  assert.ok(vicino(mod.valore('molt_f3'), COMBATTIMENTO.molt_f3.base + sinergiaReale('S2').effetto.modificatori[0].valore), 'S2: molt_f3 +0,2');
});

test('GDD: il catalogo rifiuta un dono fuori intervallo (×0,5 su v_base) e lo esclude senza rompere il resto', async () => {
  const catalogo = leggiJson('doni');
  catalogo.doni.push({
    id: 'piombo', nome: 'Piombo', categoria: 'strumenti', rarita: 'comune', mvp: false,
    modificatori: [{ statistica: 'v_base', operazione: 'moltiplica', valore: 0.5 }, { statistica: 'danno', operazione: 'imposta', valore: 3 }, { statistica: 'inesistente', operazione: 'somma', valore: 1 }],
    ganci: [{ evento: 'su_colpo', probabilita: 2, ricarica_ms: -1, max_per_stanza: null, effetto: 'esplosione', parametri: {} }],
    tag: ['piombo'], sagoma: { tipo: 'geometrica', forma: 'disco' }, cartiglio: '', piano_min: 1, piano_fisso: null,
    canale: ['piedistallo'], sblocco: null, richiede_flag: null, escludi_se_flag: null, peso: 1, scelta: { flag: 'x' }, fonte: 'generico',
  });
  const { mod, log } = await crea({ catalogo });
  const errori = mod.errori();
  assert.ok(errori.length >= 7, errori.join('\n'));
  assert.ok(errori.some((e) => e.includes('fuori dall\'intervallo per dono')));
  assert.ok(errori.some((e) => e.includes("operazione 'imposta' non ammessa")));
  assert.ok(errori.some((e) => e.includes('statistica sconosciuta')));
  assert.ok(errori.some((e) => e.includes('probabilita')));
  assert.ok(errori.some((e) => e.includes('ricarica_ms')));
  assert.ok(errori.some((e) => e.includes('effetto sconosciuto')));
  assert.ok(errori.some((e) => e.includes('tag sconosciuto')));
  assert.ok(errori.some((e) => e.includes('forma d\'oro vietata')));
  assert.ok(errori.some((e) => e.includes('scelta')));
  assert.equal(mod.aggiungiDono('piombo'), false);
  assert.ok(log.voci.some((v) => v.includes('piombo')));
  assert.equal(mod.catalogo().length, CATALOGO_REALE.doni.length, 'gli altri doni del catalogo restano validi');
  assert.ok(mod.aggiungiDono('lima'));
});

test('ADR-0002: senza catalogo il modulo resta quello minimo (valore/applica) e i doni sono rifiutati con errore', async () => {
  const { mod, log } = await crea({ senzaCatalogo: true });
  assert.equal(mod.valore('ferruccio.v_base'), 220);
  assert.equal(mod.aggiungiDono('lima'), false);
  assert.ok(log.voci.length >= 1);
  assert.throws(() => mod.valore('v_base'), RangeError, 'senza registro i nomi corti non esistono');
});

// ---------------------------------------------------------------------------------------------
// Ganci: probabilità seminata, ricarica, tetto per stanza, profondità 1, budget per frame, bonus
// ---------------------------------------------------------------------------------------------

test('GDD/Teatro: Acciarino (p e ricarica da doni.json, ricarica < 500 ms) su 10 000 colpi distanziati 500 ms → 10 000 × p scintille (± 4σ), identico con lo stesso seme', async () => {
  const conta = async () => {
    const { mod } = await crea({ seme: 7 });
    mod.aggiungiDono('acciarino');
    let n = 0;
    for (let i = 0; i < 10000; i++) {
      n += mod.ganci.emetti('su_colpo', { x: 0, y: 0, bersaglio: { x: 1, y: 1 } }).length;
      mod.tick(0.5);
    }
    return n;
  };
  const a = await conta();
  const b = await conta();
  assert.equal(a, b, 'deterministico con lo stesso seme');
  const g = donoReale('acciarino').ganci[0];
  assert.ok(g.ricarica_ms < 500, 'la ricarica non blocca colpi distanziati 500 ms');
  const attese = 10000 * g.probabilita;
  const sigma = Math.sqrt(10000 * g.probabilita * (1 - g.probabilita));
  assert.ok(Math.abs(a - attese) <= 4 * sigma, `scintille: ${a} (attese ${attese} ± ${(4 * sigma).toFixed(0)})`);
});

test('GDD: sei colpi nello stesso frame con l\'Acciarino → al più 1 scintilla (la ricarica blocca le altre)', async () => {
  // con probabilità 1 per isolare la ricarica: dono di prova identico all'Acciarino ma p = 1
  const catalogo = leggiJson('doni');
  const acc = catalogo.doni.find((d) => d.id === 'acciarino');
  acc.ganci[0].probabilita = 1.0;
  const { mod } = await crea({ catalogo });
  mod.aggiungiDono('acciarino');
  let n = 0;
  for (let i = 0; i < 6; i++) n += mod.ganci.emetti('su_colpo', { bersaglio: { x: i, y: 0 } }).length;
  assert.equal(n, 1);
  mod.tick(0.4);
  assert.equal(mod.ganci.emetti('su_colpo', {}).length, 1, 'dopo 400 ms riparte');
});

test('GDD: profondità 1: un evento con origine gancio non attiva ganci; max_per_stanza si azzera con nuovaStanza', async () => {
  const catalogo = leggiJson('doni');
  const cat = catalogo.doni.find((d) => d.id === 'catena-della-chiusa');
  cat.ganci[0].max_per_stanza = 2;
  const { mod } = await crea({ catalogo });
  mod.aggiungiDono('catena-della-chiusa');
  assert.equal(mod.ganci.emetti('su_uccisione', { bersaglio: { x: 0, y: 0 } }).length, 1);
  assert.equal(mod.ganci.emetti('su_uccisione', { bersaglio: { x: 0, y: 0 }, origine: 'gancio' }).length, 0, 'la catena che uccide non fa partire una seconda catena');
  assert.equal(mod.ganci.emetti('su_uccisione', { bersaglio: { x: 0, y: 0 } }).length, 1);
  assert.equal(mod.ganci.emetti('su_uccisione', { bersaglio: { x: 0, y: 0 } }).length, 0, 'tetto per stanza 2');
  mod.ganci.nuovaStanza();
  assert.equal(mod.ganci.emetti('su_uccisione', { bersaglio: { x: 0, y: 0 } }).length, 1);
});

test('GDD: budget max_effetti_gancio_frame: gli ultimi iscritti sono scartati per primi; tick azzera il budget', async () => {
  const catalogo = leggiJson('doni');
  // Teatro: al massimo max_slot_doni (5) passivi addosso; il budget si prova con il suo minimo (3) così budget + 2 doni stanno negli slot
  catalogo.limiti.max_effetti_gancio_frame = { ...catalogo.limiti.max_effetti_gancio_frame, base: catalogo.limiti.max_effetti_gancio_frame.min };
  const budget = catalogo.limiti.max_effetti_gancio_frame.base;
  assert.ok(budget + 2 <= catalogo.limiti.max_slot_doni.base, 'i doni di prova stanno nei 5 slot del Teatro');
  for (let i = 0; i < budget + 2; i++) {
    catalogo.doni.push({
      id: `cura-${i}`, nome: `Cura ${i}`, categoria: 'seta', rarita: 'comune', mvp: false, modificatori: [],
      ganci: [{ evento: 'su_stanza_pulita', probabilita: 1, ricarica_ms: 0, max_per_stanza: null, effetto: 'cura', parametri: { maschere: 1 } }],
      tag: [], sagoma: { tipo: 'geometrica', forma: `cura ${i}` }, cartiglio: '', piano_min: 1, piano_fisso: null,
      canale: ['piedistallo'], sblocco: null, richiede_flag: null, escludi_se_flag: null, peso: 1, scelta: null, fonte: 'generico',
    });
  }
  const { mod, ricevuti } = await crea({ catalogo });
  for (let i = 0; i < budget + 2; i++) assert.ok(mod.aggiungiDono(`cura-${i}`));
  const esiti = mod.ganci.emetti('su_stanza_pulita', {});
  assert.equal(esiti.length, budget);
  assert.deepEqual(esiti.map((e) => e.dono), Array.from({ length: budget }, (_, i) => `cura-${i}`), 'in ordine di iscrizione; gli ultimi due scartati');
  assert.equal(mod.ganci.emetti('su_stanza_pulita', {}).length, 0, 'budget del frame esaurito');
  mod.tick(1 / 60);
  assert.equal(mod.ganci.emetti('su_stanza_pulita', {}).length, budget);
  assert.equal(ricevuti.filter((r) => r.nome === 'doni.cura').length, budget * 2);
});

test('GDD/Teatro: Matassa d\'oro: bonus_temporaneo v_base × valore per durata_ms (doni.json: ×1,25 per 2500 ms); rinnova, non si somma; scade con tick; sparisce togliendo il dono', async () => {
  const { mod } = await crea();
  const bonus = donoReale('matassa-d-oro').ganci[0].parametri;
  const base = FERRUCCIO.v_base.base;
  const conBonus = clampa(base * bonus.valore, FERRUCCIO.v_base);
  const durata = bonus.durata_ms / 1000;
  mod.aggiungiDono('matassa-d-oro');
  assert.equal(mod.valore('v_base'), base);
  mod.ganci.emetti('su_uccisione', { bersaglio: { x: 0, y: 0 } });
  assert.ok(vicino(mod.valore('v_base'), conBonus), `${base} × ${bonus.valore}`);
  mod.tick(durata * 0.6);
  mod.ganci.emetti('su_uccisione', { bersaglio: { x: 0, y: 0 } });
  assert.ok(vicino(mod.valore('v_base'), conBonus), 'rinnovato, non moltiplicato due volte');
  mod.tick(durata - 0.1);
  assert.ok(vicino(mod.valore('v_base'), conBonus), 'il bonus rinnovato dura `durata` dal rinnovo');
  mod.tick(0.2);
  assert.equal(mod.valore('v_base'), base, 'scaduto');
  mod.ganci.emetti('su_uccisione', { bersaglio: { x: 0, y: 0 } });
  assert.ok(vicino(mod.valore('v_base'), conBonus));
  mod.rimuoviDono('matassa-d-oro');
  assert.equal(mod.valore('v_base'), base, 'i bonus nati dal dono sono cancellati con lui');
  assert.deepEqual(mod.ganci.iscrizioni('su_uccisione'), []);
});

test('GDD: S4 Scintille calde somma danno +1 ai parametri di ogni scintilla posseduta; S5 Passo di seta moltiplica d_scatto', async () => {
  const { mod } = await crea();
  mod.aggiungiDono('acciarino');
  mod.aggiungiDono('mantice');
  assert.deepEqual(mod.sinergieAttive(), ['S4']);
  assert.equal(mod.ganci.iscrizioni('su_colpo')[0].parametri.danno, donoReale('acciarino').ganci[0].parametri.danno + sinergiaReale('S4').effetto.param_extra.scintilla.danno);
  mod.aggiungiDono('filo-teso');
  mod.aggiungiDono('pantofole-di-seta');
  assert.ok(mod.sinergieAttive().includes('S5'));
  assert.ok(mod.sinergieAttive().includes('S3'), 'filo (Filo teso) + seta (Pantofole)');
  const dScatto = clampa(FERRUCCIO.d_scatto.base * prodottoSu(['filo-teso'], 'd_scatto') * sinergiaReale('S5').effetto.modificatori[0].valore, FERRUCCIO.d_scatto);
  assert.ok(vicino(mod.valore('d_scatto'), dScatto), `${mod.valore('d_scatto')} ≠ ${dScatto}`);
  assert.equal(mod.valore('t_invuln'), FERRUCCIO.t_invuln.base + sinergiaReale('S3').effetto.modificatori[0].valore);
});

test('GDD: doppia raccolta rifiutata; rimozione di un dono non attivo → false; azzera svuota tutto', async () => {
  const { mod, log } = await crea();
  assert.ok(mod.aggiungiDono('lima'));
  assert.equal(mod.aggiungiDono('lima'), false);
  assert.ok(log.voci.some((v) => v.includes('già attivo')));
  assert.equal(mod.rimuoviDono('mantice'), false);
  assert.equal(mod.valore('portata'), COMBATTIMENTO.portata.base + sommaSu(['lima'], 'portata'), 'Lima: portata dal catalogo (Teatro +10)');
  mod.azzera();
  assert.deepEqual(mod.doniAttivi(), []);
  assert.equal(mod.valore('portata'), COMBATTIMENTO.portata.base);
});

test('GDD prestazioni: ricalcolo di tutte le statistiche del registro < 0,05 ms per lettura in cache; il ricalcolo avviene solo al cambio della lista', async () => {
  const { mod } = await crea();
  const catalogo = leggiJson('doni');
  for (const d of catalogo.doni) mod.aggiungiDono(d.id);
  const nomi = Object.keys(catalogo.statistiche).filter((n) => !n.startsWith('_'));
  for (const n of nomi) mod.valore(n); // riempie la cache
  const t0 = performance.now();
  const giri = 200;
  for (let g = 0; g < giri; g++) for (const n of nomi) mod.valore(n);
  const perGiro = (performance.now() - t0) / giri;
  assert.ok(perGiro < 0.05, `lettura di ${nomi.length} statistiche: ${perGiro.toFixed(4)} ms`);
  // il ricalcolo completo dopo un cambio resta sotto 0,05 ms × 4 di margine su macchine lente
  const t1 = performance.now();
  for (let g = 0; g < giri; g++) {
    const via = mod.applica({ statistica: 'danno', operazione: 'somma', valore: 0 });
    for (const n of nomi) mod.valore(n);
    via();
  }
  const perRicalcolo = (performance.now() - t1) / giri;
  assert.ok(perRicalcolo < 0.2, `ricalcolo: ${perRicalcolo.toFixed(4)} ms`);
});

// ---------------------------------------------------------------------------------------------
// Storia 024: catalogo MVP e pool (GDD regola 7, formula probabilita_estrazione)
// ---------------------------------------------------------------------------------------------

/** Pesi W0_r e derive d_r (in percento) di economia.json, come li inietta avvio.js. */
function pesiEconomia() {
  const eco = leggiJson('economia');
  const R = ['comune', 'raro', 'prezioso'];
  return {
    pesi: Object.fromEntries(R.map((r) => [r, eco.banchetto.peso_rarita[r].base])),
    derivePct: Object.fromEntries(R.map((r) => [r, eco.banchetto.deriva_rarita_pct[r].base])),
    fallbackMonete: eco.banchetto.fallback_monete.base,
  };
}

function creaPoolProva({ seme = 1845, flag = () => ({}), soloMvp = true, sblocchi = () => false, eventi = null, restituiti = () => [] } = {}) {
  return creaPool({ catalogo: leggiJson('doni').doni, ...pesiEconomia(), rng: derivato(creaRng(seme), 'pool'), flag, soloMvp, sblocchi, eventi, restituiti });
}

const pct = (x) => Math.round(x * 10000) / 100;

test('S024-1/Teatro: doni.json: i 20 doni d\'oro sono tutti MVP (pool unico stile Isaac) più il Medaglione = 21; modificatori validi (registro, intervalli, ganci, sagome)', async () => {
  const { parametri, mod } = await crea();
  const catalogo = leggiJson('doni');
  const mvp = catalogo.doni.filter((d) => d.mvp);
  const oro = catalogo.doni.filter((d) => d.categoria !== 'ricordi');
  assert.equal(oro.length, 20, 'Teatro: 20 doni d\'oro');
  assert.equal(mvp.length, oro.length + 1);
  const attesi = [...oro.map((d) => d.id), 'medaglione-di-rosa'];
  assert.deepEqual(mvp.map((d) => d.id).sort(), attesi.sort());
  const esito = validaCatalogo(catalogo, { parametri, libreria: creaLibreria(catalogo.effetti).voci });
  assert.deepEqual(esito.errori, []);
  for (const d of mvp) {
    assert.ok(esito.indice.has(d.id), `${d.id} valido`);
    assert.ok(typeof d.nome === 'string' && d.nome.length > 0 && d.nome.length <= 28, `${d.id}: nome ≤ 28`);
    // il Teatro descrive gli oggetti con frasi fino a ~75 caratteri; il cartiglio DOM va a capo
    assert.ok(typeof d.cartiglio === 'string' && d.cartiglio.length > 0 && d.cartiglio.length <= 80, `${d.id}: cartiglio breve (${d.cartiglio.length})`);
    assert.ok(d.modificatori.length + d.ganci.length >= 1, `${d.id}: fa qualcosa`);
    for (const m of d.modificatori) assert.ok(m.statistica in catalogo.statistiche, `${d.id}: statistica ${m.statistica} nel registro`);
    assert.equal(d.sblocco, null, `${d.id}: nell'MVP non c'è la Fucina`);
  }
  // ognuno si raccoglie e cambia almeno una statistica o iscrive un gancio
  for (const d of mvp) {
    mod.azzera();
    assert.ok(mod.aggiungiDono(d.id));
    const toccate = d.modificatori.some((m) => mod.attivi(m.statistica).length > 0);
    const ganci = catalogo.ganci.some((g) => mod.ganci.iscrizioni(g).length > 0);
    assert.ok(toccate || ganci, `${d.id}: modificatori o ganci attivi`);
  }
});

test('S024-3: sagome: un ricordo (azzurro) ha il profilo dell\'oggetto, un dono d\'oro una forma geometrica; mai disco o rombo', () => {
  const catalogo = leggiJson('doni');
  for (const d of catalogo.doni) {
    if (d.categoria === 'ricordi') {
      assert.equal(d.sagoma.tipo, 'profilo', d.id);
      assert.equal(d.rarita, 'unico');
      assert.ok(d.tag.includes('ricordo'));
    } else {
      assert.equal(d.sagoma.tipo, 'geometrica', d.id);
      assert.ok(!catalogo.sagome.vietate_oro.includes(d.sagoma.forma), `${d.id}: ${d.sagoma.forma}`);
    }
  }
});

/** Probabilità attesa di ogni dono: W_r(p) = max(0, W0_r × (1 + d_r/100 × (p − 1))) sulle classi non vuote, poi `peso` dentro la classe. */
function probabilitaAttese(eleggibili, piano) {
  const { pesi, derivePct } = pesiEconomia();
  const W = (r) => Math.max(0, pesi[r] * (1 + (derivePct[r] / 100) * (piano - 1)));
  const classi = [...new Set(eleggibili.map((d) => d.rarita))];
  const totale = classi.reduce((a, r) => a + W(r), 0);
  const attese = new Map();
  for (const r of classi) {
    const della = eleggibili.filter((d) => d.rarita === r);
    const pesoClasse = della.reduce((a, d) => a + d.peso, 0);
    for (const d of della) attese.set(d.id, (W(r) / totale) * (d.peso / pesoClasse));
  }
  return attese;
}

test('GDD pool (Teatro: 20 doni d\'oro eleggibili al piano 1): P(dono) = W_r(1)/ΣW × peso/Σpeso della classe (60/30/10 al piano 1), somma 100 %; dopo il Mantice i comuni si ridistribuiscono', () => {
  const pool = creaPoolProva();
  const p1 = pool.probabilita({ piano: 1, canale: 'piedistallo' });
  const eleggibili = pool.eleggibili({ piano: 1, canale: 'piedistallo' });
  const attesiIds = CATALOGO_REALE.doni.filter((d) => d.mvp && d.rarita !== 'unico' && d.canale.includes('piedistallo') && d.sblocco === null && d.piano_min <= 1).map((d) => d.id).sort();
  assert.deepEqual(eleggibili.map((d) => d.id).sort(), attesiIds, 'pool MVP del Teatro: tutti i doni d\'oro (il Medaglione è unico)');
  assert.equal(eleggibili.length, 20);
  assert.ok(eleggibili.every((d) => d.rarita !== 'unico'));
  const attese = probabilitaAttese(eleggibili, 1);
  for (const d of eleggibili) assert.ok(vicino(p1.get(d.id), attese.get(d.id)), `${d.id} (${d.rarita}): ${pct(p1.get(d.id))} ≠ ${pct(attese.get(d.id))}`);
  assert.ok(vicino(Array.from(p1.values()).reduce((a, b) => a + b, 0), 1), 'somma 100 %');
  assert.ok(pool.raccolto('mantice'));
  const dopo = pool.probabilita({ piano: 1, canale: 'piedistallo' });
  assert.equal(dopo.has('mantice'), false);
  const atteseDopo = probabilitaAttese(eleggibili.filter((d) => d.id !== 'mantice'), 1);
  for (const d of eleggibili.filter((x) => x.rarita === 'comune' && x.id !== 'mantice')) {
    assert.ok(vicino(dopo.get(d.id), atteseDopo.get(d.id)), d.id);
    assert.ok(dopo.get(d.id) > p1.get(d.id), `${d.id}: la quota dei comuni cresce`);
  }
});

test('GDD pool: build piena al piano 5: le classi contano i doni d\'oro del catalogo (Teatro 8/9/3), W(5) somma 100 e P(dono) segue W_r(5) × peso/Σpeso (Broccato e Anello preziosi con pesi 1 e 0,9)', () => {
  const pool = creaPoolProva({ soloMvp: false, sblocchi: () => true });
  const el = pool.eleggibili({ piano: 5, canale: 'piedistallo' });
  const conta = (r) => el.filter((d) => d.rarita === r).length;
  const contaCatalogo = (r) => CATALOGO_REALE.doni.filter((d) => d.rarita === r && d.canale.includes('piedistallo')).length;
  assert.deepEqual([conta('comune'), conta('raro'), conta('prezioso')], ['comune', 'raro', 'prezioso'].map(contaCatalogo));
  assert.deepEqual([conta('comune'), conta('raro'), conta('prezioso')], [8, 9, 3], 'Teatro: 8 comuni, 9 rari, 3 preziosi');
  const w = pool.pesiAl(5);
  assert.ok(vicino(w.comune + w.raro + w.prezioso, 100), JSON.stringify(w));
  const p5 = pool.probabilita({ piano: 5, canale: 'piedistallo' });
  const attese = probabilitaAttese(el, 5);
  for (const d of el) assert.ok(vicino(p5.get(d.id), attese.get(d.id)), `${d.id}: ${pct(p5.get(d.id))} ≠ ${pct(attese.get(d.id))}`);
  assert.ok(p5.get('broccato') > p5.get('anello-cremisi'), 'peso 1 contro 0,9 nella stessa classe');
  // senza sblocchi della Fucina i doni con `sblocco` restano fuori anche in build piena (nel catalogo del Teatro nessuno ne ha: il controllo resta per quando la Fucina tornerà a venderne)
  const chiuso = creaPoolProva({ soloMvp: false });
  assert.ok(chiuso.eleggibili({ piano: 5, canale: 'piedistallo' }).every((d) => d.sblocco === null));
});

test('GDD pool: un dono raccolto non compare in 1000 estrazioni con semi diversi nella stessa notte; offerto e non preso resta per i piani dopo ma non nello stesso', () => {
  for (let seme = 1; seme <= 1000; seme++) {
    const pool = creaPoolProva({ seme });
    pool.raccolto('lima');
    const d = pool.estrai({ piano: 1, canale: 'piedistallo' });
    assert.ok(d && d.id !== 'lima', `seme ${seme}`);
  }
  const pool = creaPoolProva({ seme: 3 });
  const primo = pool.estrai({ piano: 1 });
  assert.ok(pool.offertiIn(1).includes(primo.id));
  assert.equal(pool.eleggibile(primo, { piano: 1, canale: 'piedistallo' }), false, 'offerto: non ricompare nello stesso piano');
  assert.equal(pool.eleggibile(primo, { piano: 2, canale: 'piedistallo' }), true, 'non preso: resta nel pool del piano dopo');
  // estrazione deterministica con lo stesso seme, distinte senza reinserimento fino a esaurire il pool
  const a = creaPoolProva({ seme: 9 });
  const b = creaPoolProva({ seme: 9 });
  const n = a.eleggibili({ piano: 1, canale: 'piedistallo' }).length;
  assert.equal(n, 20, 'Teatro: 20 doni d\'oro al piano 1');
  const ida = []; const idb = [];
  for (let i = 0; i < n; i++) { ida.push(a.estrai({ piano: 1 })?.id); idb.push(b.estrai({ piano: 1 })?.id); }
  assert.deepEqual(ida, idb);
  assert.equal(new Set(ida).size, n, 'tutti doni distinti');
  assert.equal(a.estrai({ piano: 1 }), null, 'pool del piano esaurito');
  assert.deepEqual(a.fallback({ maschere: 3, maschereMax: 5 }), { tipo: 'cuore', valore: 1 });
  assert.deepEqual(a.fallback({ maschere: 5, maschereMax: 5 }), { tipo: 'monete', valore: pesiEconomia().fallbackMonete });
});

test('S024-4: escludi_se_flag: con tonino_ricordo=restituito il Medaglione non è estratto dal canale boss; richiede_flag apre la Lettera di Agnese; i flag sono fotografati alla generazione', () => {
  const flags = {};
  const pool = creaPoolProva({ flag: () => flags, soloMvp: false });
  assert.deepEqual(pool.eleggibili({ piano: 1, canale: 'boss' }).map((d) => d.id), ['medaglione-di-rosa']);
  assert.deepEqual(pool.eleggibili({ piano: 1, canale: 'narrativo' }), [], 'Lettera di Agnese richiede il flag');
  flags.tonino_ricordo = 'restituito';
  assert.deepEqual(pool.eleggibili({ piano: 1, canale: 'boss' }), [], 'il ricordo con la scelta decisa non è estratto');
  assert.deepEqual(pool.eleggibili({ piano: 1, canale: 'narrativo' }).map((d) => d.id), ['lettera-di-agnese']);
  // i ricordi non entrano mai nel pool pesato (regola 7)
  assert.ok(pool.eleggibili({ piano: 1, canale: 'piedistallo' }).every((d) => d.rarita !== 'unico'));
  // fotografia: un flag che cambia a metà notte non tocca il piano già generato
  const f2 = {};
  const p2 = creaPoolProva({ flag: () => f2, soloMvp: false });
  p2.preparaPiano(1);
  f2.tonino_ricordo = 'restituito';
  assert.deepEqual(p2.eleggibili({ piano: 1, canale: 'boss' }).map((d) => d.id), ['medaglione-di-rosa'], 'il piano 1 è stato fotografato prima');
  p2.preparaPiano(2);
  assert.deepEqual(p2.eleggibili({ piano: 2, canale: 'narrativo' }).map((d) => d.id), ['lettera-di-agnese'], 'il piano 2 rivaluta');
  // ricordi restituiti del profilo: mai più nel pool; piano fisso
  const p3 = creaPoolProva({ soloMvp: false, restituiti: () => ['medaglione-di-rosa'] });
  assert.deepEqual(p3.eleggibili({ piano: 1, canale: 'boss' }), []);
  assert.deepEqual(p3.eleggibili({ piano: 2, canale: 'stanza-ricordo' }).map((d) => d.id), [], 'Lettera di Mariella richiede taddeo=perdonato');
  assert.deepEqual(p3.eleggibili({ piano: 3, canale: 'stanza-ricordo' }).map((d) => d.id), ['punzone-gf']);
  assert.equal(flagSoddisfatto(null, {}), false);
  assert.equal(scegliPesato([0, 0], 0.5), 1);
  assert.equal(scegliPesato([1, 3], 0.2), 0);
  assert.equal(scegliPesato([1, 3], 0.3), 1);
});

test('GDD pool: `doni.aggiunto` sul bus (banchetto, piedistallo, anima) toglie il dono dal pool', async () => {
  const { mod, eventi } = await crea();
  const pool = creaPoolProva({ eventi });
  assert.ok(mod.aggiungiDono('lima'));
  assert.deepEqual(pool.raccolti(), ['lima']);
  assert.equal(pool.probabilita({ piano: 1 }).has('lima'), false);
});
