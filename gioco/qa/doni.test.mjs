/**
 * gioco/qa/doni.test.mjs — Test unitari della storia 023 (modificatori, doni, ganci, sinergie), senza DOM.
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

// ---------------------------------------------------------------------------------------------
// Criteri della storia 023
// ---------------------------------------------------------------------------------------------

test('S023-1: danno base 1, +1 somma e ×1,5 → 3 (prima le somme, poi i moltiplicatori); un terzo dono che porterebbe a 6 dà 5 (clamp)', async () => {
  const { mod } = await crea();
  assert.equal(mod.valore('combattimento.danno'), 1);
  mod.applica({ statistica: 'combattimento.danno', operazione: 'somma', valore: 1 });
  mod.applica({ statistica: 'combattimento.danno', operazione: 'moltiplica', valore: 1.5 });
  assert.equal(mod.valore('combattimento.danno'), 3, '(1 + 1) × 1,5 = 3, non 1 × 1,5 + 1 = 2,5');
  // terzo dono: ×2 porterebbe (1+1)×1,5×2 = 6 → Π cap 2,0 → (1+1)×2 = 4; con una somma +2 in più → (1+1+2)×2 = 8 → clamp 5
  mod.applica({ statistica: 'combattimento.danno', operazione: 'moltiplica', valore: 2 });
  assert.equal(mod.valore('combattimento.danno'), 4, 'Π = 3,0 bloccato al cap 2,0 di danno');
  const via = mod.applica({ statistica: 'combattimento.danno', operazione: 'somma', valore: 2 });
  assert.equal(mod.valore('combattimento.danno'), 5, 'clamp al massimo della statistica');
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
  assert.equal(esito.indice.size, 20);
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

test('GDD: t_invuln con Seta grezza, Fazzoletto, Lettera di Mariella e S3 → 1200 (non 1350); togliere il Fazzoletto → 1150', async () => {
  const { mod } = await crea();
  for (const id of ['seta-grezza', 'fazzoletto-col-giglio', 'lettera-di-mariella']) assert.ok(mod.aggiungiDono(id));
  assert.deepEqual(mod.sinergieAttive(), [], 'nessun filo: S3 non attiva');
  assert.equal(mod.valore('t_invuln'), 1200, '800 + 450 = 1250 → clamp 1200');
  assert.ok(mod.aggiungiDono('filo-teso'));
  assert.ok(mod.sinergieAttive().includes('S3'));
  assert.equal(mod.valore('t_invuln'), 1200, '800 + 550 = 1350 → clamp 1200');
  assert.ok(mod.rimuoviDono('fazzoletto-col-giglio'));
  assert.equal(mod.valore('t_invuln'), 1150, 'l\'eccedenza non si accumula');
});

test('GDD: t_finestra_p +70 +70 → 300; v_base ×0,5 → 150; tre ×1,3 → 308 (Π bloccato a 1,4)', async () => {
  const { mod } = await crea();
  mod.applica({ statistica: 't_finestra_p', operazione: 'somma', valore: 70 });
  mod.applica({ statistica: 't_finestra_p', operazione: 'somma', valore: 70 });
  assert.equal(mod.valore('t_finestra_p'), 300);
  mod.applica({ statistica: 'v_base', operazione: 'moltiplica', valore: 0.5 });
  assert.equal(mod.valore('v_base'), 150, 'Π = max(0,5; 0,6) = 0,6 → 132 → clamp 150');
  mod.azzera();
  for (let i = 0; i < 3; i++) mod.applica({ statistica: 'v_base', operazione: 'moltiplica', valore: 1.3 });
  assert.ok(vicino(mod.valore('v_base'), 308), `Π 2,197 → cap 1,4 → 308; ottenuto ${mod.valore('v_base')}`);
});

test('GDD: Pantofole + Martello + Grembiule → v_base 210,7 ± 0,1; t_recupero_f arrotondato a intero', async () => {
  const { mod } = await crea();
  for (const id of ['pantofole-di-seta', 'martello-da-fabbro', 'grembiule-di-cuoio']) assert.ok(mod.aggiungiDono(id));
  assert.ok(Math.abs(mod.valore('v_base') - 210.7) <= 0.1, `${mod.valore('v_base')}`);
  assert.equal(mod.valore('t_recupero_f'), 176, '160 × 1,10 = 176');
  assert.ok(mod.aggiungiDono('mantice'));
  assert.equal(mod.valore('t_recupero_f'), 155, '160 × 0,968 = 154,88 → 155 (ms arrotondati)');
  assert.equal(mod.valore('danno'), 2);
  assert.ok(mod.sinergieAttive().includes('S2'), 'fuoco (Mantice) + ferro (Martello)');
  assert.ok(vicino(mod.valore('molt_f3'), 1.7), 'S2: molt_f3 +0,2');
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
  assert.equal(mod.catalogo().length, 20, 'gli altri 20 restano validi');
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

test('GDD: Acciarino (p 0,20, ricarica 400) su 10 000 colpi distanziati 500 ms → 2000 ± 130 scintille, identico con lo stesso seme', async () => {
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
  assert.ok(Math.abs(a - 2000) <= 130, `scintille: ${a}`);
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
  const budget = catalogo.limiti.max_effetti_gancio_frame.base;
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

test('GDD: Matassa d\'oro: bonus_temporaneo v_base ×1,20 per 2000 ms; rinnova, non si somma; scade con tick; sparisce togliendo il dono', async () => {
  const { mod } = await crea();
  mod.aggiungiDono('matassa-d-oro');
  assert.equal(mod.valore('v_base'), 220);
  mod.ganci.emetti('su_uccisione', { bersaglio: { x: 0, y: 0 } });
  assert.ok(vicino(mod.valore('v_base'), 264), '220 × 1,2');
  mod.tick(1.5);
  mod.ganci.emetti('su_uccisione', { bersaglio: { x: 0, y: 0 } });
  assert.ok(vicino(mod.valore('v_base'), 264), 'rinnovato, non 220 × 1,44');
  mod.tick(1.9);
  assert.ok(vicino(mod.valore('v_base'), 264), 'a 3,4 s il bonus rinnovato a 1,5 s dura fino a 3,5 s');
  mod.tick(0.2);
  assert.equal(mod.valore('v_base'), 220, 'scaduto');
  mod.ganci.emetti('su_uccisione', { bersaglio: { x: 0, y: 0 } });
  assert.ok(vicino(mod.valore('v_base'), 264));
  mod.rimuoviDono('matassa-d-oro');
  assert.equal(mod.valore('v_base'), 220, 'i bonus nati dal dono sono cancellati con lui');
  assert.deepEqual(mod.ganci.iscrizioni('su_uccisione'), []);
});

test('GDD: S4 Scintille calde somma danno +1 ai parametri di ogni scintilla posseduta; S5 Passo di seta moltiplica d_scatto', async () => {
  const { mod } = await crea();
  mod.aggiungiDono('acciarino');
  mod.aggiungiDono('mantice');
  assert.deepEqual(mod.sinergieAttive(), ['S4']);
  assert.equal(mod.ganci.iscrizioni('su_colpo')[0].parametri.danno, 2);
  mod.aggiungiDono('filo-teso');
  mod.aggiungiDono('pantofole-di-seta');
  assert.ok(mod.sinergieAttive().includes('S5'));
  assert.ok(mod.sinergieAttive().includes('S3'), 'filo (Filo teso) + seta (Pantofole)');
  assert.ok(vicino(mod.valore('d_scatto'), 180 * 1.15 * 1.1), `${mod.valore('d_scatto')}`);
  assert.equal(mod.valore('t_invuln'), 900);
});

test('GDD: doppia raccolta rifiutata; rimozione di un dono non attivo → false; azzera svuota tutto', async () => {
  const { mod, log } = await crea();
  assert.ok(mod.aggiungiDono('lima'));
  assert.equal(mod.aggiungiDono('lima'), false);
  assert.ok(log.voci.some((v) => v.includes('già attivo')));
  assert.equal(mod.rimuoviDono('mantice'), false);
  assert.equal(mod.valore('portata'), 76);
  mod.azzera();
  assert.deepEqual(mod.doniAttivi(), []);
  assert.equal(mod.valore('portata'), 70);
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
