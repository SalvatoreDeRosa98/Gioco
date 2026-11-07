/**
 * gioco/qa/condizioni.test.mjs — Test unitari della storia 026 (condizioni, stato narrativo,
 * salvataggio), senza DOM. Esecuzione: `node gioco/qa/condizioni.test.mjs` dalla radice (node:test).
 *
 * Dati reali: `contenuti/storia.json` (copia di trama/storia.json), `contenuti/narrativa.json`,
 * `contenuti/ancoraggi.json`. Casi: tutti gli operatori di `valuta`/`valutaOr` ("*", "", "!x",
 * uguaglianza, confronti numerici, appartenenza), derivati, errori di contenuto (flag ignoto, valore
 * fuori elenco, condizione malformata → falso e loggato), ordine e obbligatorie con scene reali, rifiuti
 * di `decidi`, finale → mondo, conflitto allo stesso ordine (storia finta), round-trip del salvataggio
 * con memoria finta, migrazioni, elenca/cancella/esporta/importa. Nessun nome di flag o di scena è
 * nel motore: qui nei test sì, perché il test verifica i dati reali.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { creaBus } from '../motore/fondazione/eventi.js';
import { creaSchema, valuta, valutaOr } from '../motore/storia/condizioni.js';
import { crea, MOTIVI } from '../motore/storia/stato-narrativo.js';
import { creaSalvataggio, memoriaInRam, chiave, PREFISSO } from '../motore/persistenza/salvataggio.js';
import { migra, VERSIONE } from '../motore/persistenza/migrazioni.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const CONTENUTI = join(QUI, '..', 'contenuti');
const leggi = (nome) => JSON.parse(readFileSync(join(CONTENUTI, `${nome}.json`), 'utf8'));
const STORIA = leggi('storia');
const REGOLE = leggi('narrativa');
const ANCORAGGI = leggi('ancoraggi');

function logFinto() {
  const voci = [];
  return { voci, error: (...a) => voci.push(a.map(String).join(' ')), warn: () => {} };
}

/** Schema reale + logger finto, per i test puri di `valuta`. */
function schemaReale() {
  const log = logFinto();
  const { schema, errori } = creaSchema({ storia: STORIA, regole: REGOLE });
  assert.deepEqual(errori, []);
  return { schema, log };
}

/** Stato narrativo reale con bus e (opzionale) salvataggio in RAM. */
function statoReale({ salvataggio = null, slot = 1, storia = STORIA, ancoraggi = ANCORAGGI } = {}) {
  const log = logFinto();
  const eventi = creaBus({ log });
  const ricevuti = [];
  for (const n of ['narrativa.decisione', 'narrativa.vista', 'narrativa.boss', 'narrativa.piano', 'narrativa.notte', 'narrativa.avanzamento']) {
    eventi.on(n, (p) => ricevuti.push({ nome: n, payload: p }));
  }
  const sn = crea({ storia, regole: REGOLE, ancoraggi, eventi, salvataggio, slot, log });
  return { sn, log, eventi, ricevuti };
}

/** Stato piatto di partenza (tutto null) con l'avanzamento iniziale. */
function statoIniziale() {
  const { sn } = statoReale();
  return sn.stato();
}

// ---------------------------------------------------------------------------------------------
// condizioni.js — operatori
// ---------------------------------------------------------------------------------------------

test('C01: condizione vuota o assente è sempre vera', () => {
  const { schema, log } = schemaReale();
  assert.equal(valuta({}, statoIniziale(), schema, { log }), true);
  assert.equal(valuta(null, statoIniziale(), schema, { log }), true);
  assert.equal(valuta(undefined, statoIniziale(), schema, { log }), true);
  assert.deepEqual(log.voci, []);
});

test('C02: uguaglianza su un flag di scelta: vera solo con quel valore, falsa se non deciso', () => {
  const { schema, log } = schemaReale();
  const st = statoIniziale();
  assert.equal(valuta({ taddeo: 'perdonato' }, st, schema, { log }), false);
  assert.equal(valuta({ taddeo: 'perdonato' }, { ...st, taddeo: 'perdonato' }, schema, { log }), true);
  assert.equal(valuta({ taddeo: 'perdonato' }, { ...st, taddeo: 'accusato' }, schema, { log }), false);
  assert.deepEqual(log.voci, []);
});

test('C03: "*" = deciso con qualunque valore', () => {
  const { schema, log } = schemaReale();
  const st = statoIniziale();
  assert.equal(valuta({ registro: '*' }, st, schema, { log }), false);
  assert.equal(valuta({ registro: '*' }, { ...st, registro: 'bruciato' }, schema, { log }), true);
  assert.equal(valuta({ registro: '*' }, { ...st, registro: 'conservato' }, schema, { log }), true);
});

test('C04: "" = non deciso', () => {
  const { schema, log } = schemaReale();
  const st = statoIniziale();
  assert.equal(valuta({ violante: '' }, st, schema, { log }), true);
  assert.equal(valuta({ violante: '' }, { ...st, violante: 'uccisa' }, schema, { log }), false);
});

test('C05: "!x" = diverso da x, anche non deciso', () => {
  const { schema, log } = schemaReale();
  const st = statoIniziale();
  assert.equal(valuta({ agnese: '!sognante' }, st, schema, { log }), true, 'non deciso è diverso da sognante');
  assert.equal(valuta({ agnese: '!sognante' }, { ...st, agnese: 'risvegliata' }, schema, { log }), true);
  assert.equal(valuta({ agnese: '!sognante' }, { ...st, agnese: 'sognante' }, schema, { log }), false);
});

test('C06: più coppie sono in AND', () => {
  const { schema, log } = schemaReale();
  const st = { ...statoIniziale(), agnese: 'risvegliata', taddeo: 'perdonato' };
  assert.equal(valuta({ agnese: 'risvegliata', taddeo: 'perdonato' }, st, schema, { log }), true);
  assert.equal(valuta({ agnese: 'risvegliata', taddeo: 'accusato' }, st, schema, { log }), false);
  assert.equal(valuta({ agnese: 'risvegliata', taddeo: '*', registro: '' }, st, schema, { log }), true);
});

test('C07: valutaOr: basta un\'alternativa vera; lista vuota è falsa; non lista è errore', () => {
  const { schema, log } = schemaReale();
  const st = { ...statoIniziale(), agnese: 'risvegliata', taddeo: 'perdonato' };
  const or = STORIA.scene.find((s) => s.id === 'epilogo.agnese-fermati').quando_or;
  assert.equal(valutaOr(or, st, schema, { log }), true, 'risvegliata + perdonato');
  assert.equal(valutaOr(or, { ...st, taddeo: 'accusato' }, schema, { log }), false);
  assert.equal(valutaOr(or, { ...st, agnese: 'sognante', taddeo: 'accusato' }, schema, { log }), true, 'sognante');
  assert.equal(valutaOr([], st, schema, { log }), false);
  assert.deepEqual(log.voci, []);
  assert.equal(valutaOr({ agnese: 'sognante' }, st, schema, { log }), false);
  assert.equal(log.voci.length, 1);
});

test('C08: derivati nelle condizioni valgono "vera"/"falsa"', () => {
  const { sn } = statoReale();
  assert.equal(valuta({ prove: 'falsa' }, sn.stato(), sn.schema()), true);
  assert.equal(valuta({ prove: 'vera' }, sn.stato(), sn.schema()), false);
  sn.imposta('registro', 'conservato');
  assert.equal(valuta({ prove: 'vera', lettera_mariella: 'falsa', lettera_agnese: 'falsa' }, sn.stato(), sn.schema()), true);
  sn.imposta('tonino_ricordo', 'restituito');
  assert.equal(valuta({ lettera_agnese: 'vera' }, sn.stato(), sn.schema()), true);
  assert.equal(valuta({ lettera_agnese: '*' }, sn.stato(), sn.schema()), true, 'un derivato è sempre deciso');
});

test('C09: confronti numerici su notte: ">=2", "<5", ">", "<=", "=", numero puro, "*"', () => {
  const { schema, log } = schemaReale();
  const st = { ...statoIniziale(), notte: 2 };
  assert.equal(valuta({ notte: '>=2' }, st, schema, { log }), true);
  assert.equal(valuta({ notte: '>=3' }, st, schema, { log }), false);
  assert.equal(valuta({ notte: '<5' }, st, schema, { log }), true);
  assert.equal(valuta({ notte: '<2' }, st, schema, { log }), false);
  assert.equal(valuta({ notte: '>1' }, st, schema, { log }), true);
  assert.equal(valuta({ notte: '<=2' }, st, schema, { log }), true);
  assert.equal(valuta({ notte: '=2' }, st, schema, { log }), true);
  assert.equal(valuta({ notte: '2' }, st, schema, { log }), true);
  assert.equal(valuta({ notte: 2 }, st, schema, { log }), true);
  assert.equal(valuta({ notte: 3 }, st, schema, { log }), false);
  assert.equal(valuta({ notte: '*' }, st, schema, { log }), true);
  assert.deepEqual(log.voci, []);
});

test('C10: confronti numerici su piano_max con spazi; confronto malformato è errore → falso', () => {
  const { schema, log } = schemaReale();
  const st = { ...statoIniziale(), piano_max: 3 };
  assert.equal(valuta({ piano_max: '>= 3' }, st, schema, { log }), true);
  assert.equal(valuta({ piano_max: '< 3' }, st, schema, { log }), false);
  assert.equal(valuta({ piano_max: 'tre' }, st, schema, { log }), false);
  assert.equal(valuta({ piano_max: '>>3' }, st, schema, { log }), false);
  assert.equal(log.voci.length, 2);
});

test('C11: appartenenza agli insiemi: "x" contiene, "!x" non contiene, "*" non vuoto, "" vuoto', () => {
  const { schema, log } = schemaReale();
  const st = { ...statoIniziale(), boss_battuti: ['gatto-dei-quattro-canti'] };
  assert.equal(valuta({ boss_battuti: 'gatto-dei-quattro-canti' }, st, schema, { log }), true);
  assert.equal(valuta({ boss_battuti: 'regina-dei-debiti' }, st, schema, { log }), false);
  assert.equal(valuta({ boss_battuti: '!regina-dei-debiti' }, st, schema, { log }), true);
  assert.equal(valuta({ boss_battuti: '!gatto-dei-quattro-canti' }, st, schema, { log }), false);
  assert.equal(valuta({ boss_battuti: '*' }, st, schema, { log }), true);
  assert.equal(valuta({ boss_battuti: '' }, st, schema, { log }), false);
  assert.equal(valuta({ boss_battuti: '' }, { ...st, boss_battuti: [] }, schema, { log }), true);
  assert.equal(valuta({ scene_viste: 'piazza-dante.risveglio' }, { ...st, scene_viste: new Set(['piazza-dante.risveglio']) }, schema, { log }), true, 'anche come Set');
  assert.deepEqual(log.voci, []);
});

test('C12: membro ignoto di un insieme è errore di contenuto → falso', () => {
  const { schema, log } = schemaReale();
  const st = { ...statoIniziale(), boss_battuti: ['gatto-dei-quattro-canti'] };
  assert.equal(valuta({ boss_battuti: 'drago' }, st, schema, { log }), false);
  assert.equal(valuta({ scene_viste: 'scena.inesistente' }, st, schema, { log }), false);
  assert.equal(log.voci.length, 2);
});

test('C13: booleani dell\'avanzamento (fucina_aperta, identita) si confrontano con vera/falsa', () => {
  const { schema, log } = schemaReale();
  const st = { ...statoIniziale(), fucina_aperta: 'vera' };
  assert.equal(valuta({ fucina_aperta: 'vera' }, st, schema, { log }), true);
  assert.equal(valuta({ identita: 'falsa' }, st, schema, { log }), true);
  assert.equal(valuta({ identita: 'vera' }, st, schema, { log }), false);
  assert.equal(valuta({ identita: 'sì' }, st, schema, { log }), false);
  assert.equal(log.voci.length, 1);
});

test('C14: finale_visto e mondo sono flag di scelta: "" prima del finale, poi il valore', () => {
  const { sn, log } = statoReale();
  assert.equal(valuta({ finale_visto: '', mondo: '' }, sn.stato(), sn.schema(), { log }), true);
  sn.imposta('violante', 'uccisa');
  assert.equal(valuta({ finale_visto: 'uccisa', mondo: 'A' }, sn.stato(), sn.schema(), { log }), true);
  assert.equal(valuta({ mondo: 'C' }, sn.stato(), sn.schema(), { log }), false, 'C non esiste');
  assert.equal(log.voci.length, 1);
});

// ---------------------------------------------------------------------------------------------
// condizioni.js — errori di contenuto (regola 10)
// ---------------------------------------------------------------------------------------------

test('C15 (storia criterio 5): un flag ignoto in una condizione è falso e logga un errore di contenuto', () => {
  const { schema, log } = schemaReale();
  assert.equal(valuta({ flag_inesistente: 'x' }, statoIniziale(), schema, { log }), false);
  assert.equal(log.voci.length, 1);
  assert.match(log.voci[0], /errore di contenuto/);
  assert.match(log.voci[0], /flag_inesistente/);
});

test('C16: valore fuori dall\'elenco nella condizione (anche con "!") è falso e loggato', () => {
  const { schema, log } = schemaReale();
  const st = { ...statoIniziale(), taddeo: 'perdonato' };
  assert.equal(valuta({ taddeo: 'graziato' }, st, schema, { log }), false);
  assert.equal(valuta({ taddeo: '!graziato' }, st, schema, { log }), false, 'sarebbe banalmente vera: deve essere falsa');
  assert.equal(log.voci.length, 2);
});

test('C17: valore fuori dall\'elenco nello STATO è falso e loggato (mai vero)', () => {
  const { schema, log } = schemaReale();
  const st = { ...statoIniziale(), registro: 'strappato' };
  assert.equal(valuta({ registro: '*' }, st, schema, { log }), false);
  assert.equal(valuta({ registro: '!bruciato' }, st, schema, { log }), false);
  assert.equal(log.voci.length, 2);
});

test('C18: condizione malformata (lista, stringa, numero su flag di scelta) → falso e loggato; una coppia errata non salva le altre', () => {
  const { schema, log } = schemaReale();
  const st = { ...statoIniziale(), taddeo: 'perdonato' };
  assert.equal(valuta(['taddeo'], st, schema, { log }), false);
  assert.equal(valuta('taddeo=perdonato', st, schema, { log }), false);
  assert.equal(valuta({ taddeo: 1 }, st, schema, { log }), false);
  assert.equal(valuta({ taddeo: 'perdonato', ignoto: 'x' }, st, schema, { log }), false);
  assert.equal(log.voci.length, 4);
});

test('C19: creaSchema segnala regole incoerenti (derivato assente, valori_da sconosciuto)', () => {
  const regole = JSON.parse(JSON.stringify(REGOLE));
  regole.derivati.fantasma = [{ taddeo: 'perdonato' }];
  regole.avanzamento.extra = { tipo: 'insieme', valori_da: 'nulla' };
  const { errori } = creaSchema({ storia: STORIA, regole });
  assert.equal(errori.length, 2, errori.join('\n'));
});

// ---------------------------------------------------------------------------------------------
// stato-narrativo.js — derivati, decidi, imposta
// ---------------------------------------------------------------------------------------------

test('S026-1: stato iniziale → prove falsa; decidi taddeo = perdonato → prove e lettera_mariella vere; ridecidere è rifiutato', () => {
  const { sn, ricevuti } = statoReale();
  assert.deepEqual(sn.flag(), { tonino_ricordo: null, taddeo: null, registro: null, agnese: null, gregorio: null, violante: null });
  assert.equal(sn.derivati().prove, 'falsa');
  assert.deepEqual(sn.decidi('taddeo', 'perdonato'), { ok: true });
  assert.equal(sn.derivati().prove, 'vera');
  assert.equal(sn.derivati().lettera_mariella, 'vera');
  assert.equal(sn.derivati().lettera_agnese, 'falsa');
  assert.deepEqual(sn.decidi('taddeo', 'accusato'), { ok: false, motivo: MOTIVI.giaDeciso });
  assert.deepEqual(sn.decidi('taddeo', 'perdonato'), { ok: false, motivo: MOTIVI.giaDeciso });
  assert.equal(sn.flag().taddeo, 'perdonato', 'lo stato non cambia');
  assert.equal(ricevuti.filter((r) => r.nome === 'narrativa.decisione').length, 1);
});

test('S026-2: prove = falsa → decidi gregorio = dialogo rifiutato (non offerto); attacco accettato; con prove vera dialogo accettato', () => {
  const a = statoReale().sn;
  assert.equal(a.derivati().prove, 'falsa');
  assert.deepEqual(a.decidi('gregorio', 'dialogo'), { ok: false, motivo: MOTIVI.nonOfferto });
  assert.equal(a.flag().gregorio, null);
  assert.deepEqual(a.decidi('gregorio', 'attacco'), { ok: true }, 'reggia.attacco-senza-prove offre attacco con prove falsa');
  const b = statoReale().sn;
  b.imposta('registro', 'conservato');
  assert.deepEqual(b.decidi('gregorio', 'dialogo'), { ok: true });
  const c = statoReale().sn;
  c.imposta('taddeo', 'accusato');
  c.imposta('registro', 'bruciato');
  assert.deepEqual(c.decidi('gregorio', 'dialogo'), { ok: false, motivo: MOTIVI.nonOfferto });
});

test('S026-3: decidi rifiuta flag ignoti, derivati e valori fuori elenco; imposta accetta null e valori validi', () => {
  const { sn } = statoReale();
  assert.deepEqual(sn.decidi('bianca', 'salvata'), { ok: false, motivo: MOTIVI.flagIgnoto });
  assert.deepEqual(sn.decidi('prove', 'vera'), { ok: false, motivo: MOTIVI.derivato });
  assert.deepEqual(sn.decidi('taddeo', 'graziato'), { ok: false, motivo: MOTIVI.valoreIgnoto });
  assert.deepEqual(sn.imposta('taddeo', 'graziato'), { ok: false, motivo: MOTIVI.valoreIgnoto });
  assert.deepEqual(sn.imposta('taddeo', 'accusato'), { ok: true });
  assert.deepEqual(sn.imposta('taddeo', null), { ok: true });
  assert.equal(sn.flag().taddeo, null);
});

test('S026-4: decidere violante imposta finale_visto e mondo (A per uccisa, B per risparmiata); le altre decisioni restano', () => {
  const { sn } = statoReale();
  sn.imposta('taddeo', 'perdonato');
  assert.deepEqual(sn.decidi('violante', 'uccisa'), { ok: true });
  assert.equal(sn.avanzamento().finale_visto, 'uccisa');
  assert.equal(sn.avanzamento().mondo, 'A');
  assert.equal(sn.flag().taddeo, 'perdonato');
  const altro = statoReale().sn;
  altro.imposta('violante', 'risparmiata');
  assert.equal(altro.avanzamento().mondo, 'B');
  altro.imposta('violante', null);
  assert.equal(altro.avanzamento().finale_visto, null);
  assert.equal(altro.avanzamento().mondo, null);
});

// ---------------------------------------------------------------------------------------------
// stato-narrativo.js — disponibilità, ordine, obbligatorie (scene reali)
// ---------------------------------------------------------------------------------------------

test('S026-5 (GDD): piazza-dante.filastrocca (60) non è disponibile finché tonino-primo-incontro (40, obbligatoria) non è vista', () => {
  const { sn } = statoReale();
  assert.equal(sn.disponibile('piazza-dante.filastrocca'), false);
  assert.equal(sn.disponibile('piazza-dante.risveglio'), true, 'la prima obbligatoria è disponibile');
  assert.equal(sn.disponibile('piazza-dante.tutorial'), false, 'bloccata dal risveglio');
  for (const id of ['piazza-dante.risveglio', 'piazza-dante.tutorial', 'piazza-dante.targa-commemorativa']) assert.ok(sn.segnaVista(id));
  assert.equal(sn.disponibile('piazza-dante.filastrocca'), false, 'manca ancora tonino-primo-incontro');
  sn.segnaVista('piazza-dante.tonino-primo-incontro');
  assert.equal(sn.disponibile('piazza-dante.filastrocca'), true);
  assert.equal(sn.disponibile('piazza-dante.bottega-di-gaetano'), true, 'indizio a 50');
  assert.equal(sn.disponibile('piazza-dante.scelta-tonino'), false, 'bloccata dal boss a 70');
  assert.deepEqual(sn.obbligatorieNonViste('piazza-dante').map((s) => s.id), ['piazza-dante.gatto-dei-quattro-canti']);
});

test('S026-6 (GDD esempio): san-leucio.amore-ritrovato con agnese=risvegliata, taddeo=perdonato e le obbligatorie precedenti viste → vera; senza arrivo-manifattura → falsa', () => {
  const { sn } = statoReale();
  sn.imposta('agnese', 'risvegliata');
  sn.imposta('taddeo', 'perdonato');
  assert.equal(sn.disponibile('san-leucio.amore-ritrovato'), false, 'tessitrice (boss, 10) e arrivo-manifattura (20) non viste');
  sn.segnaVista('san-leucio.tessitrice-di-pietra');
  assert.equal(sn.disponibile('san-leucio.amore-ritrovato'), false, 'arrivo-manifattura non vista');
  sn.segnaVista('san-leucio.arrivo-manifattura');
  assert.equal(sn.disponibile('san-leucio.amore-ritrovato'), true);
  assert.equal(sn.disponibile('san-leucio.amore-dimenticato'), false, 'quando falso (agnese sognante)');
  const a90 = sn.disponibiliPer((s) => s.capitolo === 'san-leucio' && s.ordine === 90).map((s) => s.id);
  assert.deepEqual(a90, ['san-leucio.amore-ritrovato'], 'una sola delle quattro a 90');
});

test('S026-7: una scena vista non è più disponibile (salvo ripetibile via ancoraggi.json); id ignoto → falso e loggato', () => {
  const ancoraggi = { scene: { 'piazza-dante.risveglio': { ancoraggio: 'ingresso-piano:1', ripetibile: true }, 'piazza-dante.tutorial': { ancoraggio: 'ingresso-piano:1' } } };
  const { sn, log } = statoReale({ ancoraggi });
  sn.segnaVista('piazza-dante.risveglio');
  assert.equal(sn.disponibile('piazza-dante.risveglio'), true, 'ripetibile');
  sn.segnaVista('piazza-dante.tutorial');
  assert.equal(sn.disponibile('piazza-dante.tutorial'), false);
  assert.deepEqual(sn.disponibili('ingresso-piano:1').map((s) => s.id), ['piazza-dante.risveglio']);
  assert.deepEqual(sn.disponibili('hub:tonino'), [], 'ancoraggio senza scene');
  assert.equal(sn.disponibile('scena.che-non-esiste'), false);
  assert.equal(sn.segnaVista('scena.che-non-esiste'), false);
  assert.equal(log.voci.length, 2);
});

test('S026-8: epilogo a ordine 50 con violante=uccisa, agnese=risvegliata, taddeo=accusato → solo agnese-accusa (fermati esclusa dal quando_or)', () => {
  const { sn, log } = statoReale();
  sn.imposta('violante', 'uccisa');
  sn.imposta('agnese', 'risvegliata');
  sn.imposta('taddeo', 'accusato');
  const a50 = sn.disponibiliPer((s) => s.capitolo === 'epilogo' && s.ordine === 50).map((s) => s.id);
  assert.deepEqual(a50, ['epilogo.agnese-accusa']);
  assert.deepEqual(log.voci, [], 'nessun conflitto: storia.json ha già reso esclusive le due scene (Open Question del GDD chiusa)');
  sn.imposta('taddeo', 'perdonato');
  assert.deepEqual(sn.disponibiliPer((s) => s.capitolo === 'epilogo' && s.ordine === 50).map((s) => s.id), ['epilogo.agnese-fermati']);
});

test('S026-9: conflitto allo stesso ordine (storia finta): vince la più specifica, poi la prima nel file, e viene loggato', () => {
  const storia = JSON.parse(JSON.stringify(STORIA));
  storia.scene.push(
    { id: 'epilogo.prova-generica', capitolo: 'epilogo', tipo: 'epilogo', quando: { violante: 'uccisa' }, ordine: 55, battute: [] },
    { id: 'epilogo.prova-specifica', capitolo: 'epilogo', tipo: 'epilogo', quando: { violante: 'uccisa', taddeo: 'accusato' }, ordine: 55, battute: [] },
    { id: 'epilogo.prova-gemella', capitolo: 'epilogo', tipo: 'epilogo', quando: { violante: 'uccisa' }, ordine: 56, battute: [] },
    { id: 'epilogo.prova-gemella-2', capitolo: 'epilogo', tipo: 'epilogo', quando: { violante: 'uccisa' }, ordine: 56, battute: [] },
  );
  const { sn, log } = statoReale({ storia });
  sn.imposta('violante', 'uccisa');
  sn.imposta('taddeo', 'accusato');
  const ids = sn.disponibiliPer((s) => s.capitolo === 'epilogo' && s.ordine >= 55 && s.ordine <= 56).map((s) => s.id);
  assert.deepEqual(ids, ['epilogo.prova-specifica', 'epilogo.prova-gemella']);
  assert.equal(log.voci.length, 2);
  assert.match(log.voci[0], /stesso ordine 55/);
});

test('S026-10: battute filtrate con `se`; ordine e capitolo delle scene disponibili', () => {
  const { sn } = statoReale();
  const conSe = STORIA.scene.find((s) => s.battute.some((b) => b.se));
  assert.ok(conSe, 'storia.json ha battute con se');
  const primoSe = conSe.battute.find((b) => b.se).se;
  const tutte = conSe.battute.length;
  const senzaSe = conSe.battute.filter((b) => !b.se).length;
  assert.equal(sn.battute(conSe.id).length, senzaSe, 'con i flag non decisi restano solo le battute senza se');
  for (const [f, v] of Object.entries(primoSe)) sn.imposta(f, v); // `se` è un AND (regola 4): si impostano tutte le coppie
  const st = sn.stato();
  const attese = conSe.battute.filter((b) => !b.se || Object.entries(b.se).every(([f, v]) => st[f] === v)).length;
  assert.ok(attese > senzaSe, 'almeno una battuta con se diventa visibile');
  assert.equal(sn.battute(conSe.id).length, attese);
  assert.ok(attese <= tutte);
  assert.deepEqual(sn.battute('scena.ignota'), []);
});

// ---------------------------------------------------------------------------------------------
// avanzamento, serializza/ripristina, salvataggio (ADR-0006)
// ---------------------------------------------------------------------------------------------

test('S026-11: avanzamento: boss, piano (solo in su, clamp al massimo), notte, booleani; errori su id ignoti', () => {
  const { sn, log } = statoReale();
  assert.equal(sn.pianoMassimo(), 5);
  assert.equal(sn.pianoDi('reggia'), 5);
  assert.equal(sn.pianoDi('epilogo'), null);
  assert.ok(sn.registraBoss('gatto-dei-quattro-canti'));
  assert.equal(sn.registraBoss('drago'), false);
  assert.equal(sn.raggiungiPiano(2), 2);
  assert.equal(sn.raggiungiPiano(1), 2, 'solo in su');
  assert.equal(sn.raggiungiPiano(9), 5, 'clamp al massimo disponibile');
  assert.equal(sn.nuovaNotte(), 2);
  assert.ok(sn.segnaAvanzamento('fucina_aperta', true));
  assert.equal(sn.segnaAvanzamento('notte', true), false);
  assert.deepEqual(sn.avanzamento(), { notte: 2, piano_max: 5, boss_battuti: ['gatto-dei-quattro-canti'], scene_viste: [], fucina_aperta: true, identita: false, finale_visto: null, mondo: null });
  assert.equal(log.voci.length, 2);
});

test('S026-12 (storia criterio 4): una decisione salva il profilo in ferruccio.v3.profilo.<slot> e un nuovo stato lo ricarica identico', () => {
  const memoria = memoriaInRam();
  const salvataggio = creaSalvataggio({ memoria, log: logFinto(), ora: () => 1000 });
  const { sn } = statoReale({ salvataggio, slot: 2 });
  sn.decidi('taddeo', 'perdonato');
  sn.segnaVista('piazza-dante.risveglio');
  sn.registraBoss('gatto-dei-quattro-canti');
  sn.raggiungiPiano(3);
  assert.ok(memoria.getItem('ferruccio.v3.profilo.2'), 'chiave dell\'ADR-0006');
  assert.equal(chiave('profilo', 2), `${PREFISSO}.profilo.2`);
  assert.equal(memoria.getItem('ferruccio.v3.profilo.1'), null);
  const busta = JSON.parse(memoria.getItem('ferruccio.v3.profilo.2'));
  assert.equal(busta.versione, VERSIONE);
  assert.equal(busta.salvato_il, 1000);
  // «reload»: un nuovo stato sullo stesso slot
  const dopo = statoReale({ salvataggio, slot: 2 }).sn;
  assert.deepEqual(dopo.serializza(), sn.serializza());
  assert.equal(dopo.flag().taddeo, 'perdonato');
  assert.equal(dopo.derivati().prove, 'vera');
  assert.deepEqual(dopo.decidi('taddeo', 'accusato'), { ok: false, motivo: MOTIVI.giaDeciso }, 'la decisione sopravvive');
  // uno slot diverso è vuoto
  assert.equal(statoReale({ salvataggio, slot: 3 }).sn.flag().taddeo, null);
});

test('S026-13: ripristina tollera contenuti cambiati: scene e boss spariti ignorati, piano_max clampato, flag/valori ignoti loggati', () => {
  const { sn, log } = statoReale();
  const errori = sn.ripristina({
    flag: { taddeo: 'perdonato', bianca: 'salvata', registro: 'strappato' },
    avanzamento: { notte: 4, piano_max: 9, scene_viste: ['piazza-dante.risveglio', 'scena.rimossa'], boss_battuti: ['drago', 'custode'], mondo: 'Z', campo_ignoto: 1 },
  });
  assert.equal(errori.length, 4, errori.join('\n'));
  assert.equal(log.voci.length, 4);
  assert.equal(sn.flag().taddeo, 'perdonato');
  assert.equal(sn.flag().registro, null);
  assert.deepEqual(sn.avanzamento().scene_viste, ['piazza-dante.risveglio']);
  assert.deepEqual(sn.avanzamento().boss_battuti, ['custode']);
  assert.equal(sn.avanzamento().piano_max, 5);
  assert.equal(sn.avanzamento().notte, 4);
  assert.equal(sn.avanzamento().mondo, null);
});

test('S026-14: salvataggio: salva/carica/elenca/cancella con memoria finta; chiavi profilo e notte separate', () => {
  const memoria = memoriaInRam();
  const log = logFinto();
  const s = creaSalvataggio({ memoria, log, ora: () => 42 });
  assert.equal(s.carica('profilo', 1), null);
  assert.ok(s.salva('profilo', 1, { a: 1 }));
  assert.ok(s.salva('notte', 1, { seme: 1845, piano: 2 }));
  assert.ok(s.salva('profilo', 3, { a: 3 }));
  assert.deepEqual(s.carica('profilo', 1), { a: 1 });
  assert.deepEqual(s.carica('notte', 1), { seme: 1845, piano: 2 });
  assert.deepEqual(s.elenca(), [
    { slot: '1', profilo: { salvato_il: 42 }, notte: { salvato_il: 42 } },
    { slot: '3', profilo: { salvato_il: 42 }, notte: null },
  ]);
  s.cancella(1, 'notte');
  assert.equal(s.carica('notte', 1), null);
  assert.deepEqual(s.carica('profilo', 1), { a: 1 });
  s.cancella(1);
  assert.equal(s.carica('profilo', 1), null);
  assert.equal(memoria.length, 1);
  assert.throws(() => s.salva('inventario', 1, {}), RangeError);
  // dati non JSON → false, loggato, nulla lanciato
  memoria.setItem('ferruccio.v3.profilo.9', '{non json');
  assert.equal(s.carica('profilo', 9), null);
  assert.ok(log.voci.length >= 1);
});

test('S026-15: migrazioni: busta vecchia migrata in sequenza, busta più nuova scartata, migrazione mancante scartata', () => {
  const log = logFinto();
  const migrazioni = { 1: (b) => ({ ...b, versione: 2, dati: { ...b.dati, nuovo: true } }), 2: (b) => ({ ...b, versione: 3 }) };
  assert.deepEqual(migra({ versione: 1, dati: { a: 1 } }, { versione: 3, migrazioni, log }), { versione: 3, dati: { a: 1, nuovo: true } });
  assert.equal(migra({ versione: 4, dati: {} }, { versione: 3, migrazioni, log }), null);
  assert.equal(migra({ versione: 1, dati: {} }, { versione: 3, migrazioni: {}, log }), null);
  assert.equal(migra({ dati: {} }, { log }), null);
  assert.equal(log.voci.length, 3);
  // attraverso il salvataggio: una busta di versione 1 letta da un motore a versione 2
  const memoria = memoriaInRam();
  const vecchio = creaSalvataggio({ memoria, log, ora: () => 0, versione: 1 });
  vecchio.salva('profilo', 1, { a: 1 });
  const nuovo = creaSalvataggio({ memoria, log, ora: () => 0, versione: 2, migrazioni: { 1: migrazioni[1] } });
  assert.deepEqual(nuovo.carica('profilo', 1), { a: 1, nuovo: true });
  const senzaMigrazione = creaSalvataggio({ memoria, log, ora: () => 0, versione: 2, migrazioni: {} });
  assert.equal(senzaMigrazione.carica('profilo', 1), null);
});

test('S026-16: esporta/importa uno slot come testo JSON (ADR-0006)', () => {
  const log = logFinto();
  const a = creaSalvataggio({ memoria: memoriaInRam(), log, ora: () => 7 });
  assert.equal(a.esporta(1), null);
  a.salva('profilo', 1, { flag: { taddeo: 'perdonato' } });
  a.salva('notte', 1, { seme: 3 });
  const testo = a.esporta(1);
  assert.equal(typeof testo, 'string');
  const b = creaSalvataggio({ memoria: memoriaInRam(), log, ora: () => 8 });
  assert.ok(b.importa(2, testo));
  assert.deepEqual(b.carica('profilo', 2), { flag: { taddeo: 'perdonato' } });
  assert.deepEqual(b.carica('notte', 2), { seme: 3 });
  assert.equal(b.importa(2, 'non json'), false);
  assert.equal(b.importa(2, '{"x":1}'), false);
});

test('S026-17: ogni mutazione emette un evento narrativa.*; senza salvataggio nulla si rompe', () => {
  const { sn, ricevuti } = statoReale();
  sn.decidi('tonino_ricordo', 'restituito');
  sn.segnaVista('piazza-dante.risveglio');
  sn.registraBoss('custode');
  sn.raggiungiPiano(1);
  sn.nuovaNotte();
  sn.segnaAvanzamento('identita', true);
  assert.deepEqual(ricevuti.map((r) => r.nome), ['narrativa.decisione', 'narrativa.vista', 'narrativa.boss', 'narrativa.piano', 'narrativa.notte', 'narrativa.avanzamento']);
  assert.equal(ricevuti[0].payload.derivati.lettera_agnese, 'vera');
});

test('S026-18: la copia in contenuti/storia.json è identica a trama/storia.json e lo schema reale non ha errori', () => {
  const originale = readFileSync(join(QUI, '..', '..', 'trama', 'storia.json'), 'utf8');
  const copia = readFileSync(join(CONTENUTI, 'storia.json'), 'utf8');
  assert.equal(copia, originale);
  const { sn } = statoReale();
  assert.deepEqual(sn.errori(), []);
  assert.deepEqual(sn.decisioni(), ['tonino_ricordo', 'taddeo', 'registro', 'agnese', 'gregorio', 'violante']);
  assert.equal(ANCORAGGI.scene && typeof ANCORAGGI.scene === 'object', true);
});
