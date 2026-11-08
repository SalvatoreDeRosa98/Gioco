/**
 * gioco/qa/boss-provvisorio.test.mjs — Test della storia P01 (PROVVISORIA, build di prova per l'autore;
 * la storia 022 la sostituisce con il Gatto dei Quattro Canti vero): boss provvisorio e uscita del piano.
 *
 * Esecuzione: `node gioco/qa/boss-provvisorio.test.mjs` dalla radice del repository (node:test, nessun browser).
 * Ciclo simulato a tick fissi come in mondo.test.mjs (stanza reale montata dal modello `pd-b-01`, fantocci
 * come nemici) e notte finta come in notte.test.mjs (stato narrativo, risveglio, notte salvata, economia reali).
 *
 * Criteri coperti:
 *  (a) la stanza `boss` ha una sola ondata con un solo nemico, `boss === true`, archetipo del contenuto;
 *  (b) alla sua morte parte `boss.sconfitto` {id, x, y} e la stanza passa svuotata → pulita (rivisitata resta pulita);
 *  (c) l'uscita è inattiva prima e attiva dopo;
 *  (d) camminarci sopra emette `piano.completato` {piano, notte} UNA sola volta;
 *  (e) il completamento porta a notte + 1 con flag, scintille e piano_max conservati, notte salvata cancellata
 *      (motivo `vittoria`), `risveglio.fine` con motivo `vittoria` e `morti` fermo.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { creaTempo } from '../motore/fondazione/tempo.js';
import { creaBus } from '../motore/fondazione/eventi.js';
import { creaInput } from '../motore/fondazione/input.js';
import { creaParametri } from '../motore/fondazione/parametri.js';
import { creaRng, derivato } from '../motore/fondazione/rng.js';
import { creaModificatori } from '../motore/oggetti/modificatori.js';
import { creaCampo } from '../motore/mondo/fisica.js';
import { creaFerruccio } from '../motore/attori/ferruccio.js';
import { creaCombattimento } from '../motore/attori/combattimento.js';
import { creaFantoccio } from '../motore/attori/bersaglio.js';
import { caricaModelli, creaCatalogo, regoleDaParametri } from '../motore/mondo/modelli.js';
import { creaStanza, TIPO_BOSS, CONTENUTO_BOSS, CONTENUTO_USCITA } from '../motore/mondo/stanza.js';
import { creaEconomia } from '../motore/oggetti/economia.js';
import { creaSalvataggio, memoriaInRam } from '../motore/persistenza/salvataggio.js';
import { creaProfilo } from '../motore/persistenza/profilo.js';
import { crea as creaStato } from '../motore/storia/stato-narrativo.js';
import { creaRisveglio, MOTIVI_RISVEGLIO, FASI_FINE_PIANO, INATTIVO } from '../motore/storia/risveglio.js';
import { creaNotteSalvata, MOTIVI_CANCELLAZIONE } from '../motore/persistenza/notte-salvata.js';
import { schedaBossProvvisorio, applicaSchedaBoss, schedaArchetipo } from '../motore/attori/nemico.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const leggi = (rel) => JSON.parse(readFileSync(join(RADICE, rel), 'utf8'));
const CARTELLA_MODELLI = 'contenuti/modelli-stanza/piazza-dante';
const STORIA = leggi('contenuti/storia.json');
const REGOLE = leggi('contenuti/narrativa.json');
const ANCORAGGI = leggi('contenuti/ancoraggi.json');
const SCENA = Object.freeze({ larghezza: 1280, altezza: 720 });
const SEME = 1845;
const SLOT = 1;
const PIANO = 1;
const MODELLO_BOSS = 'pd-b-01';
const FLAG_PROVA = ['taddeo', 'perdonato'];
const SCINTILLE_PROVA = 7;
const GUARDIA_TICK = 100000;

function logFinto() {
  const voci = [];
  return { voci, error: (...a) => voci.push(a.map(String).join(' ')), warn: () => {} };
}

/** Parametri reali di tutte le statistiche che la stanza boss, l'economia e il risveglio leggono, più il catalogo dei modelli. */
async function caricaContenuti() {
  const log = logFinto();
  const parametri = creaParametri({ log });
  await parametri.carica({
    caricatore: (nome) => leggi(`contenuti/parametri/${nome}.json`),
    statistiche: ['ferruccio', 'combattimento', 'stanza', 'stanze', 'generazione', 'economia', 'nemici', 'risveglio'],
    tabelle: ['input', 'doni', 'sinergie', 'consumabili'],
  });
  assert.deepEqual(parametri.errori(), [], 'i JSON reali devono essere validi');
  const indice = leggi(`${CARTELLA_MODELLI}/indice.json`);
  const { modelli, errori } = await caricaModelli({
    caricatore: (nome) => leggi(`${CARTELLA_MODELLI}/${nome}.json`), indice, regole: regoleDaParametri(parametri), log,
  });
  assert.deepEqual(errori, []);
  return { parametri, catalogo: creaCatalogo(modelli), log };
}

/** Record sintetico della stanza boss per montare il modello da solo (come `recordDi` in mondo.test.mjs). */
function recordBoss(modello) {
  return {
    id: 'r-boss', tipo: TIPO_BOSS, dim: modello.dim, modello: modello.id, seme_stanza: 7, profondita: 4, d_boss: 0,
    porte: { N: 'x', W: 'z' }, finestre: [], ricompensa: { valore: 0, oggetti: [] },
  };
}

/**
 * Mondo di prova: fondazione, campo, Ferruccio, combattimento, fantocci come nemici (con `archetipo` e `boss`
 * dal payload della factory), economia, stato narrativo, risveglio e notte salvata reali su una notte finta.
 */
async function creaMondo({ memoria = memoriaInRam() } = {}) {
  const c = await caricaContenuti();
  const { parametri, log } = c;
  const tempo = creaTempo();
  const eventi = creaBus({ log });
  const input = creaInput(parametri.get('input'));
  const rng = creaRng(SEME);
  const modificatori = creaModificatori(parametri, { catalogo: parametri.get('doni'), sinergie: parametri.get('sinergie'), eventi, rng: derivato(rng, 'doni'), log });
  const campo = creaCampo({
    colonne: parametri.get('stanza.colonne'), righe: parametri.get('stanza.righe'), cella: parametri.get('stanza.cella'),
    scenaLarghezza: SCENA.larghezza, scenaAltezza: SCENA.altezza,
  });
  const ferruccio = creaFerruccio({ modificatori, tempo, eventi, input, campo, x: SCENA.larghezza / 2, y: SCENA.altezza / 2 });
  const bersagli = [];
  const comb = creaCombattimento({ modificatori, tempo, eventi, input, campo, ferruccio, bersagli: () => bersagli });
  const fabbricati = [];
  const creaNemico = ({ archetipo, x, y, id, boss = false }) => {
    const f = creaFantoccio({ modificatori, tempo, eventi, campo, bersaglio: comb.comeBersaglio, id, x, y });
    f.archetipo = archetipo;
    f.boss = boss;
    fabbricati.push({ archetipo, boss, id });
    return f;
  };
  const salvataggio = creaSalvataggio({ memoria, log, ora: () => 0 });
  const profilo = creaProfilo({ salvataggio, slot: SLOT, eventi });
  const economia = creaEconomia({ parametri, eventi, rng: derivato(rng, 'drop'), profilo, ferruccio, modificatori, piano: PIANO, log });
  const stato = creaStato({ storia: STORIA, regole: REGOLE, ancoraggi: ANCORAGGI, eventi, salvataggio, slot: SLOT, log });
  const pool = { azzerato: 0, azzera() { pool.azzerato += 1; }, raccolto() { return true; } };
  const risveglio = creaRisveglio({ parametri, tempo, eventi, narrativa: stato, modificatori, ferruccio, economia, pool, campoNotte: REGOLE.piani.campo_notte, log });
  const notteFinta = { seme: SEME, piano: PIANO, stanza: null };
  let notte = null;
  const notteSalvata = creaNotteSalvata({
    salvataggio, slot: SLOT, eventi, notte: () => notte, ferruccio, modificatori, economia, pool,
    numeroNotte: () => stato.avanzamento()[REGOLE.piani.campo_notte], log,
  });
  const ricevuti = [];
  for (const nome of ['nemico.nato', 'stanza.chiusa', 'stanza.svuotata', 'stanza.pulita', 'boss.sconfitto', 'piano.completato',
    'fine_piano.avvio', 'fine_piano.fase', 'risveglio.fine', 'notte.cancellata', 'economia.fine_notte', 'morte.avvio']) {
    eventi.on(nome, (p) => ricevuti.push({ nome, ...p }));
  }
  const m = {
    ...c, tempo, eventi, input, modificatori, campo, ferruccio, bersagli, creaNemico, fabbricati, economia, profilo, stato, risveglio,
    notteSalvata, salvataggio, ricevuti, pool, stanza: null,
    ticks: (chiave) => tempo.ticksDaMs(parametri.get(chiave)),
    /** n tick nell'ordine di una notte: Ferruccio, combattimento, nemici, stanza, economia, risveglio. */
    tick(n = 1) {
      for (let i = 0; i < n; i++) {
        input.inizioTick();
        if (!risveglio.attivo) {
          ferruccio.tick(tempo.passoS);
          comb.tick(tempo.passoS);
          for (const b of bersagli.slice()) b.tick(tempo.passoS);
          m.stanza?.tick(tempo.passoS);
        }
        economia.tick();
        risveglio.tick(tempo.passoS);
      }
    },
    /** Monta la stanza boss dal modello reale e la annuncia alla notte finta (così la notte salvata la scrive). */
    montaBoss(statoSalvato = null) {
      const modello = c.catalogo.perId(MODELLO_BOSS);
      assert.ok(modello, `modello ${MODELLO_BOSS} nel catalogo`);
      const record = recordBoss(modello);
      m.stanza = creaStanza({ record, modello, piano: PIANO, parametri, tempo, eventi, campo, scena: SCENA, bersagli, creaNemico, ferruccio, statoSalvato, log });
      notte = notteFinta;
      const da = notteFinta.stanza?.id ?? null;
      notteFinta.stanza = { id: record.id };
      m.stanza.entra();
      eventi.emit('notte.stanza', { da, a: record.id, lato: null, tipo: record.tipo });
      return m.stanza;
    },
    eventiDi: (nome) => ricevuti.filter((e) => e.nome === nome),
    /** Uccide il boss e porta la stanza a `pulita` (pausa, ricompensa e riapertura delle porte). */
    uccidiBoss() {
      const boss = m.stanza.boss;
      assert.ok(boss, 'c\'è un boss vivo');
      boss.colpisci(boss.vita, null);
      m.tick(m.ticks('stanze.t_pausa_ondata') + m.ticks('stanze.t_ritardo_apertura') + m.ticks('stanze.t_ricompensa') + 3);
      assert.equal(m.stanza.stato, 'pulita');
    },
    /** Mette Ferruccio in un angolo lontano dall'uscita (il centro). */
    inAngolo() {
      ferruccio.posiziona(m.stanza.origine.x + m.stanza.cella * 1.5, m.stanza.origine.y + m.stanza.cella * 1.5);
    },
  };
  return m;
}

// ---------------------------------------------------------------------------------------------
// Contenuti
// ---------------------------------------------------------------------------------------------

test('P01 contenuti: pd-b-01 ha un contenuto boss con archetipo e un contenuto uscita; nemici.boss_provvisorio e stanze.uscita sono statistiche valide; la scheda boss sostituisce la vita e scala raggio e portata', async () => {
  const { parametri, catalogo } = await caricaContenuti();
  const modello = catalogo.perId(MODELLO_BOSS);
  assert.equal(modello.tipo, TIPO_BOSS);
  const boss = modello.contenuti.find((k) => k.tipo === CONTENUTO_BOSS);
  const uscita = modello.contenuti.find((k) => k.tipo === CONTENUTO_USCITA);
  assert.ok(boss && typeof boss.archetipo === 'string', 'contenuto boss con archetipo');
  assert.ok(uscita, 'contenuto uscita');
  assert.ok(parametri.ha('nemici.boss_provvisorio.vita') && parametri.ha('stanze.uscita.raggio') && parametri.ha('stanze.uscita.t_attesa') && parametri.ha('risveglio.fine_piano.t_velo'));
  const modificatori = creaModificatori(parametri);
  const taglia = schedaBossProvvisorio({ modificatori, parametri });
  assert.equal(taglia.vita, parametri.get('nemici.boss_provvisorio.vita'));
  const base = schedaArchetipo({ modificatori, parametri, archetipo: boss.archetipo, piano: PIANO });
  const scalata = applicaSchedaBoss(base, taglia);
  assert.equal(scalata.vita, Math.round(taglia.vita));
  assert.ok(scalata.vita < 280, 'vita ridotta rispetto al GDD (i pattern veri non esistono)');
  assert.ok(Math.abs(scalata.r - base.r * taglia.scalaRaggio) < 1e-9);
  assert.ok(Math.abs(scalata.attacco.portata - base.attacco.portata * taglia.scalaPortata) < 1e-9);
  assert.deepEqual(base.attacco, schedaArchetipo({ modificatori, parametri, archetipo: boss.archetipo, piano: PIANO }).attacco, 'applicaSchedaBoss è pura');
});

// ---------------------------------------------------------------------------------------------
// (a) (b) (c): un solo boss, boss.sconfitto, pulita, uscita inattiva → attiva, rivisitata pulita
// ---------------------------------------------------------------------------------------------

test('P01 (a)(b)(c): GIVEN la stanza boss, WHEN entra Ferruccio, THEN una sola ondata con un solo nemico boss === true dall\'archetipo del contenuto, porte chiuse, uscita inattiva; WHEN muore, THEN boss.sconfitto {id, x, y} una volta, stanza svuotata → pulita, porte aperte, uscita attiva; rivisitata resta pulita senza nuovi nemici', async () => {
  const m = await creaMondo();
  const st = m.montaBoss();
  assert.equal(st.combatteBoss, true);
  assert.equal(st.boss, null, 'il boss nasce dopo il segnalino');
  assert.equal(st.uscita.attiva, false, '(c) uscita inattiva all\'ingresso');
  m.inAngolo();
  m.tick(m.ticks('stanze.t_marker') + 1);
  // (a) un solo nemico, boss, archetipo del contenuto
  assert.equal(m.bersagli.length, 1, 'un solo nemico');
  assert.deepEqual(m.fabbricati.map((f) => f.boss), [true]);
  assert.equal(m.bersagli[0].boss, true);
  assert.equal(m.bersagli[0].archetipo, 'gatto');
  assert.equal(st.boss, m.bersagli[0]);
  assert.equal(m.eventiDi('nemico.nato').length, 1);
  assert.equal(m.eventiDi('nemico.nato')[0].boss, true);
  assert.ok(st.porte.length >= 1 && st.porte.every((d) => d.stato === 'chiusa'), 'porte chiuse come in una stanza normale');
  assert.equal(st.stato, 'ondata');
  assert.equal(st.uscita.attiva, false, '(c) uscita inattiva con il boss vivo');
  // l'uscita non conta l'attesa finché la stanza non è pulita
  m.ferruccio.posiziona(st.uscita.x, st.uscita.y);
  m.tick(m.ticks('stanze.uscita.t_attesa') * 2 + 5);
  assert.equal(m.eventiDi('piano.completato').length, 0, 'nessun piano.completato con il boss vivo');
  assert.equal(st.uscita.progresso, 0);
  m.inAngolo();
  // (b) morte del boss
  const boss = st.boss;
  boss.colpisci(boss.vita, null);
  m.tick(2);
  assert.equal(st.stato, 'svuotata');
  const sconfitti = m.eventiDi('boss.sconfitto');
  assert.equal(sconfitti.length, 1, 'boss.sconfitto una volta');
  assert.equal(sconfitti[0].id, 'gatto');
  assert.ok(Number.isFinite(sconfitti[0].x) && Number.isFinite(sconfitti[0].y));
  assert.equal(st.boss, null);
  m.tick(m.ticks('stanze.t_ritardo_apertura') + m.ticks('stanze.t_ricompensa') + 3);
  assert.equal(st.stato, 'pulita');
  assert.equal(m.eventiDi('stanza.svuotata').length, 1);
  assert.equal(m.eventiDi('stanza.pulita').length, 1);
  assert.equal(m.eventiDi('stanza.pulita')[0].tipo, TIPO_BOSS);
  m.tick(m.ticks('stanze.t_anim_porta') + 1);
  assert.ok(st.porte.every((d) => d.stato === 'aperta'), 'porte riaperte');
  assert.equal(st.uscita.attiva, true, '(c) uscita attiva a stanza pulita');
  assert.equal(m.eventiDi('boss.sconfitto').length, 1, 'non si ripete');
  // rivisitata dallo stato salvato: pulita, nessun nemico, uscita attiva, nessun nuovo boss.sconfitto
  const salvato = st.statoSalvabile();
  const nati = m.fabbricati.length;
  const st2 = m.montaBoss(salvato);
  m.inAngolo();
  m.tick(m.ticks('stanze.t_marker') + 5);
  assert.equal(st2.stato, 'pulita');
  assert.equal(m.fabbricati.length, nati, 'nessun nuovo nemico');
  assert.equal(st2.boss, null);
  assert.equal(st2.uscita.attiva, true);
  assert.equal(m.eventiDi('boss.sconfitto').length, 1);
  assert.deepEqual(m.log.voci, []);
});

// ---------------------------------------------------------------------------------------------
// (d): piano.completato una sola volta
// ---------------------------------------------------------------------------------------------

test('P01 (d): GIVEN la stanza boss pulita, WHEN Ferruccio resta sull\'uscita per t_attesa, THEN piano.completato {piano, id} UNA sola volta anche restandoci; lasciarla prima azzera l\'attesa', async () => {
  const m = await creaMondo();
  const st = m.montaBoss();
  m.inAngolo();
  m.tick(m.ticks('stanze.t_marker') + 1);
  m.uccidiBoss();
  const attesa = m.ticks('stanze.uscita.t_attesa');
  assert.ok(attesa > 0, 'il test presume un\'attesa positiva');
  // entra e esce prima dell'attesa: nulla
  m.ferruccio.posiziona(st.uscita.x, st.uscita.y);
  m.tick(Math.max(1, attesa - 1));
  assert.equal(m.eventiDi('piano.completato').length, 0);
  assert.ok(st.uscita.progresso > 0 && st.uscita.progresso < 1, `attesa in corso (${st.uscita.progresso})`);
  m.inAngolo();
  m.tick(1);
  assert.equal(st.uscita.progresso, 0, 'lasciare l\'uscita azzera l\'attesa');
  // resta sopra: una sola volta
  m.ferruccio.posiziona(st.uscita.x, st.uscita.y);
  m.tick(attesa + 1);
  const completati = m.eventiDi('piano.completato');
  assert.equal(completati.length, 1, 'piano.completato una volta');
  assert.equal(completati[0].piano, PIANO);
  assert.equal(completati[0].id, 'r-boss');
  assert.equal(st.uscita.attraversata, true);
  assert.equal(m.risveglio.attivo, true, 'il risveglio ha preso il piano.completato');
  for (let g = 0; g < GUARDIA_TICK && m.risveglio.attivo; g++) m.tick(1);
  m.tick(attesa * 3);
  assert.equal(m.eventiDi('piano.completato').length, 1, 'mai una seconda volta nella stessa stanza montata');
  assert.deepEqual(m.log.voci, []);
});

// ---------------------------------------------------------------------------------------------
// (e): notte + 1, flag/scintille/piano_max conservati, notte salvata cancellata
// ---------------------------------------------------------------------------------------------

test('P01 (e): GIVEN flag, scintille e una notte salvata, WHEN il piano è completato, THEN velo di una fase (fine_piano), notte salvata cancellata con motivo vittoria, poi risveglio.fine {motivo: vittoria}: notte + 1, piano_max 2, flag e scintille restano, morti fermo', async () => {
  const m = await creaMondo();
  assert.equal(m.stato.imposta(FLAG_PROVA[0], FLAG_PROVA[1]).ok, true);
  m.economia.aggiungiScintille(SCINTILLE_PROVA, 'test');
  const st = m.montaBoss();
  assert.equal(m.notteSalvata.presente, true, 'la notte è salvata all\'ingresso nella stanza');
  m.inAngolo();
  m.tick(m.ticks('stanze.t_marker') + 1);
  m.uccidiBoss();
  const notte0 = m.stato.avanzamento()[REGOLE.piani.campo_notte];
  const durataVelo = m.risveglio.durataMs(MOTIVI_RISVEGLIO.vittoria);
  assert.equal(durataVelo, FASI_FINE_PIANO.reduce((a, f) => a + m.parametri.get(`risveglio.fine_piano.t_${f}`), 0));
  m.ferruccio.posiziona(st.uscita.x, st.uscita.y);
  m.tick(m.ticks('stanze.uscita.t_attesa') + 1);
  assert.equal(m.eventiDi('piano.completato').length, 1);
  // sequenza di vittoria: una fase, motivo, piano prossimo, niente lanterne; notte salvata già cancellata
  assert.equal(m.risveglio.attivo, true);
  assert.equal(m.risveglio.motivo, MOTIVI_RISVEGLIO.vittoria);
  assert.equal(m.risveglio.fase, FASI_FINE_PIANO[0]);
  assert.equal(m.risveglio.pianoProssimo, PIANO + 1);
  assert.equal(m.risveglio.lanterneSpente(), 0);
  assert.equal(m.eventiDi('fine_piano.avvio').length, 1);
  assert.equal(m.eventiDi('fine_piano.avvio')[0].durata_ms, durataVelo);
  assert.equal(m.eventiDi('morte.avvio').length, 0);
  assert.equal(m.notteSalvata.presente, false, 'notte salvata cancellata');
  const cancellazioni = m.eventiDi('notte.cancellata');
  assert.equal(cancellazioni.length, 1);
  assert.equal(cancellazioni[0].motivo, MOTIVI_CANCELLAZIONE.vittoria);
  assert.equal(m.eventiDi('economia.fine_notte').length, 1, 'l\'economia chiude la notte (residuo accreditato)');
  assert.equal(m.stato.avanzamento()[REGOLE.piani.campo_piano_max], PIANO + 1, 'piano_max registrato subito');
  let ticks = 0;
  for (; ticks < GUARDIA_TICK && m.risveglio.attivo; ticks++) m.tick(1);
  const tVelo = m.tempo.ticksDaMs(durataVelo);
  assert.ok(ticks <= tVelo && ticks >= tVelo - 3, `il velo dura t_velo (${ticks} tick, attesi ~${tVelo}: il completamento scatta a metà dell'ultimo blocco di tick)`);
  assert.equal(m.risveglio.fase, INATTIVO);
  assert.equal(m.risveglio.motivo, null);
  // risveglio: notte + 1 con motivo vittoria; flag, scintille e piano_max restano; morti fermo
  const fine = m.eventiDi('risveglio.fine');
  assert.equal(fine.length, 1);
  assert.equal(fine[0].motivo, MOTIVI_RISVEGLIO.vittoria);
  assert.equal(fine[0].piano, PIANO);
  assert.equal(fine[0].notte, notte0 + 1);
  assert.equal(m.stato.avanzamento()[REGOLE.piani.campo_notte], notte0 + 1);
  assert.equal(m.stato.avanzamento()[REGOLE.piani.campo_piano_max], PIANO + 1);
  assert.equal(m.stato.flag()[FLAG_PROVA[0]], FLAG_PROVA[1]);
  assert.equal(m.profilo.scintille, SCINTILLE_PROVA);
  assert.equal(m.risveglio.morti, 0);
  assert.equal(m.ferruccio.stato, 'fermo');
  assert.equal(m.ferruccio.maschere, m.modificatori.valore('ferruccio.maschere_max'));
  assert.equal(m.pool.azzerato, 1);
  assert.equal(m.economia.conclusa, false);
  assert.equal(m.salvataggio.carica('profilo', SLOT).avanzamento[REGOLE.piani.campo_notte], notte0 + 1);
  assert.equal(m.notteSalvata.presente, false);
  assert.deepEqual(m.log.voci, []);
});

// ---------------------------------------------------------------------------------------------
// Regole del codice
// ---------------------------------------------------------------------------------------------

test('P01 regole: nessun Math.random nel motore; le stringhe mostrate vengono da interfaccia.json (fine_piano.velo con {piano})', () => {
  const testi = leggi('contenuti/interfaccia.json');
  assert.equal(typeof testi.fine_piano?.velo, 'string');
  assert.ok(testi.fine_piano.velo.includes('{piano}'));
  for (const f of ['mondo/stanza.js', 'storia/risveglio.js', 'attori/nemico.js', 'interfaccia/morte.js', 'resa/debug.js']) {
    const src = readFileSync(join(RADICE, 'motore', f), 'utf8');
    assert.ok(!src.includes('Math.random'), `${f} senza Math.random`);
  }
});
