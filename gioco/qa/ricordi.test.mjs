/**
 * gioco/qa/ricordi.test.mjs — Test d'integrazione della storia 028 (il Medaglione di Rosa: ricordo con
 * scelta ed esiti), senza browser: `node gioco/qa/ricordi.test.mjs` dalla radice (node:test, Node ≥ 20).
 *
 * Mondo REALE: parametri JSON (`ricordi.json`, `doni.json`, `economia.json`, `incontri.json`, …),
 * `storia.json`, `narrativa.json`, `ancoraggi.json`, `ripetizioni.json`, modificatori, Ferruccio, economia,
 * profilo in RAM, stato narrativo, incontri con `puoAprire`, ricordi, HUD dei doni e cartiglio dei dialoghi in
 * DOM finto. Un caso per criterio Given-When-Then della storia più i casi del GDD ricordi-scelta (regole 3,
 * 4, 7) e le regole del codice. Il boss non esiste ancora (storia 022): la dissoluzione è l'evento
 * `boss.sconfitto` {id, x, y} sul bus, come lo emetterà il boss vero.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { creaTempo } from '../motore/fondazione/tempo.js';
import { creaBus } from '../motore/fondazione/eventi.js';
import { creaInput } from '../motore/fondazione/input.js';
import { creaRng, derivato } from '../motore/fondazione/rng.js';
import { creaParametri } from '../motore/fondazione/parametri.js';
import { creaModificatori } from '../motore/oggetti/modificatori.js';
import { creaCampo } from '../motore/mondo/fisica.js';
import { creaFerruccio } from '../motore/attori/ferruccio.js';
import { creaSalvataggio, memoriaInRam } from '../motore/persistenza/salvataggio.js';
import { creaProfilo } from '../motore/persistenza/profilo.js';
import { creaEconomia } from '../motore/oggetti/economia.js';
import { creaPool } from '../motore/oggetti/pool.js';
import { crea as creaStato } from '../motore/storia/stato-narrativo.js';
import { creaIncontri, FASI, RIFIUTI } from '../motore/storia/incontri.js';
import { creaCartiglio } from '../motore/ui/cartiglio.js';
import { creaInterfacciaDoni } from '../motore/interfaccia/doni.js';
import { creaRicordi, validaRicordi, modelloRicordo, EVENTI_RICORDI, MOTIVI_RICORDI } from '../motore/oggetti/ricordi.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const SCENA = Object.freeze({ larghezza: 1280, altezza: 720 });
const leggi = (p) => JSON.parse(readFileSync(join(RADICE, p), 'utf8'));
const STORIA = leggi('contenuti/storia.json');
const REGOLE = leggi('contenuti/narrativa.json');
const ANCORAGGI = leggi('contenuti/ancoraggi.json');
const RIPETIZIONI = leggi('contenuti/ripetizioni.json');
const TESTI = leggi('contenuti/interfaccia.json');
const RICORDI = leggi('contenuti/parametri/ricordi.json');
const DONI = leggi('contenuti/parametri/doni.json');
const STATISTICHE = ['ferruccio', 'combattimento', 'stanza', 'stanze', 'generazione', 'economia', 'incontri'];
const TABELLE = ['input', 'doni', 'sinergie', 'consumabili', 'ricordi'];
const RARITA = ['comune', 'raro', 'prezioso'];
/** Il ricordo di questa storia e la sua scena (letti dal file: il test non li inventa). */
const MEDAGLIONE = Object.keys(RICORDI.ricordi)[0];
const DEF = RICORDI.ricordi[MEDAGLIONE];
const SCENA_SCELTA = STORIA.scene.find((s) => s.id === DEF.scena_scelta);
const ANCORAGGIO_BANCHETTO = ANCORAGGI.scene[DEF.scena_scelta].ancoraggio;
const STANZA = 'banchetto-1';

function logFinto() {
  const voci = [];
  return { voci, error: (...a) => voci.push(a.map(String).join(' ')), warn: () => {} };
}

/** DOM finto minimo (come incontri.test.mjs) con dataset, closest e querySelectorAll per classe. */
function documentoFinto() {
  const crea = (tag) => {
    const el = {
      tag, children: [], className: '', hidden: false, textContent: '', dataset: {}, title: '', listeners: {},
      append(...n) { for (const x of n) if (typeof x !== 'string') el.children.push(x); },
      replaceChildren(...n) { el.children = n.filter((x) => typeof x !== 'string'); },
      addEventListener(nome, fn) { el.listeners[nome] = fn; },
    };
    return el;
  };
  return { createElement: crea };
}

/** Elementi con una classe, in profondità. */
function perClasse(el, classe) {
  const fuori = [];
  const visita = (e) => {
    if (e.className?.split(' ').includes(classe)) fuori.push(e);
    for (const c of e.children ?? []) visita(c);
  };
  visita(el);
  return fuori;
}

/** Mondo di prova con tutto il necessario alla storia. */
async function creaMondo({ seme = 1845, piano = 1 } = {}) {
  const log = logFinto();
  const parametri = creaParametri({ log });
  await parametri.carica({ caricatore: (nome) => leggi(`contenuti/parametri/${nome}.json`), statistiche: STATISTICHE, tabelle: TABELLE });
  assert.deepEqual(parametri.errori(), []);
  const tempo = creaTempo();
  const eventi = creaBus({ log });
  const input = creaInput(parametri.get('input'));
  const rng = creaRng(seme);
  const mod = creaModificatori(parametri, { catalogo: parametri.get('doni'), sinergie: parametri.get('sinergie'), eventi, rng: derivato(rng, 'doni'), log });
  assert.deepEqual(mod.errori(), []);
  const campo = creaCampo({
    colonne: parametri.get('stanza.colonne'), righe: parametri.get('stanza.righe'), cella: parametri.get('stanza.cella'),
    scenaLarghezza: SCENA.larghezza, scenaAltezza: SCENA.altezza,
  });
  const ferruccio = creaFerruccio({ modificatori: mod, tempo, eventi, input, campo, x: 640, y: 360 });
  const salvataggio = creaSalvataggio({ memoria: memoriaInRam(), log, ora: () => 0 });
  const profilo = creaProfilo({ salvataggio, slot: '1', eventi });
  const economia = creaEconomia({ parametri, eventi, rng: derivato(rng, 'drop'), profilo, ferruccio, modificatori: mod, piano, log });
  economia.entraIn(STANZA);
  const narrativa = creaStato({ storia: STORIA, regole: REGOLE, ancoraggi: ANCORAGGI, eventi, salvataggio, slot: '1', log });
  const pool = creaPool({
    catalogo: parametri.get('doni').doni,
    pesi: Object.fromEntries(RARITA.map((r) => [r, parametri.get(`economia.banchetto.peso_rarita.${r}`)])),
    derivePct: Object.fromEntries(RARITA.map((r) => [r, parametri.get(`economia.banchetto.deriva_rarita_pct.${r}`)])),
    fallbackMonete: parametri.get('economia.banchetto.fallback_monete'),
    rng: derivato(rng, 'pool'), flag: () => narrativa.flag(), restituiti: () => profilo.ricordiRestituiti, eventi, log,
  });
  pool.preparaPiano(piano);
  const ricordi = creaRicordi({ parametri, catalogo: parametri.get('doni').doni, storia: STORIA, narrativa, modificatori: mod, profilo, economia, ferruccio, eventi, stanza: STANZA, log });
  assert.deepEqual(ricordi.errori(), []);
  const incontri = creaIncontri({
    stato: narrativa, storia: STORIA, ancoraggi: ANCORAGGI, ripetizioni: RIPETIZIONI, parametri, eventi, log, testi: TESTI.incontri,
    notte: () => narrativa.avanzamento()[REGOLE.piani.campo_notte], tipiSenzaAttesa: REGOLE.tipi_senza_attesa, puoAprire: (s) => ricordi.puoAprire(s),
  });
  const documento = documentoFinto();
  const contenitore = documento.createElement('div');
  const hud = creaInterfacciaDoni({
    documento, contenitore, testi: TESTI, modificatori: mod, eventi, piedistalli: null,
    tCartiglioMs: () => parametri.get('doni').piedistallo.t_cartiglio.base, tastoInteragisci: () => parametri.get('input.tastiera.interagisci')[0],
  });
  const cartiglio = creaCartiglio({ documento, contenitore, testi: TESTI, input, incontri, antirimbalzoMs: () => parametri.get('incontri.antirimbalzo') });
  const ricevuti = [];
  for (const n of [...Object.values(EVENTI_RICORDI), 'doni.aggiunto', 'doni.rimosso', 'economia.scintille', 'incontri.avvio', 'incontri.scelta', 'incontri.fine', 'incontri.rifiutato', 'narrativa.decisione', 'profilo.ricordo']) {
    eventi.on(n, (p) => ricevuti.push({ nome: n, ...p }));
  }
  const tasto = (azione) => `t:${parametri.get(`input.tastiera.${azione}`)[0]}`;
  const m = {
    parametri, log, tempo, eventi, input, mod, campo, ferruccio, profilo, economia, narrativa, pool, ricordi, incontri, hud, cartiglio, contenitore, ricevuti,
    ticksAntirimbalzo: tempo.ticksDaMs(parametri.get('incontri.antirimbalzo')) + 1,
    danno: () => mod.valore('combattimento.danno'),
    dannoBase: () => parametri.statistica('combattimento.danno').base,
    tick(n = 1) {
      for (let i = 0; i < n; i++) {
        input.inizioTick();
        ferruccio.tick(tempo.passoS);
        mod.tick(tempo.passoS);
        economia.tick();
        ricordi.tick();
        hud.tick(tempo.passoS);
        cartiglio.tick(tempo.passoS);
        hud.aggiorna();
        cartiglio.aggiorna();
      }
    },
    premi(azione, n = 1) { input.sorgenteGiu(tasto(azione)); m.tick(n); input.sorgenteSu(tasto(azione)); },
    /** Il Gatto si dissolve a `d` px a destra di Ferruccio (o dove dato). */
    sconfiggiGatto(dove = { x: ferruccio.x + 120, y: ferruccio.y }) { eventi.emit('boss.sconfitto', { id: DEF.archetipo_boss, ...dove }); },
    /** Cammina a destra finché il ricordo è raccolto (o scadono i tick). */
    raccogliCamminando(maxTick = 240) {
      input.sorgenteGiu(tasto('destra'));
      let t = 0;
      while (t < maxTick && ricordi.aTerra().length > 0) { m.tick(1); t++; }
      input.sorgenteSu(tasto('destra'));
      return t;
    },
    /** Gatto sconfitto + raccolta: il Medaglione in mano. */
    prendiMedaglione() {
      m.sconfiggiGatto();
      m.raccogliCamminando();
      assert.deepEqual(ricordi.inMano(), [MEDAGLIONE]);
    },
    /** Interagisce con Tonino al banchetto e avanza fino alla fase di scelta (se la scena è la scelta). */
    apriScelta() {
      const d = incontri.interagisci(ANCORAGGIO_BANCHETTO);
      assert.ok(d, 'un dialogo si apre');
      m.tick(1);
      for (let i = 0; i < 20 && d.fase === FASI.battute; i++) { m.tick(m.ticksAntirimbalzo); m.premi('avanza', 1); }
      return d;
    },
    eventiDi: (nome) => ricevuti.filter((e) => e.nome === nome),
    /** Segna viste le obbligatorie (e il boss) del capitolo prima della scelta: nel gioco lo fanno le scene stesse
     *  (ingresso del piano, dopo-boss); qui il test parte già al banchetto dopo il Gatto. */
    sbloccaFinoAllaScelta() {
      for (const s of narrativa.obbligatorieNonViste(SCENA_SCELTA.capitolo)) if (s.ordine < SCENA_SCELTA.ordine) narrativa.segnaVista(s.id);
    },
  };
  return m;
}

// ---- dati ---------------------------------------------------------------------------------------

test('S028-0: ricordi.json è coerente con doni.json e storia.json; il modello ha persona, flag, scena_scelta, bonus_tenuto, effetto_ceduto', () => {
  const { errori, modelli } = validaRicordi({ tabella: RICORDI, catalogo: DONI.doni, storia: STORIA });
  assert.deepEqual(errori, []);
  const m = modelli.get(MEDAGLIONE);
  assert.ok(m);
  assert.equal(m.persona, DEF.persona);
  assert.equal(m.flag, SCENA_SCELTA.scelta.flag);
  assert.equal(m.scena_scelta, SCENA_SCELTA.id);
  assert.ok(STORIA.boss.some((b) => b.id === m.boss));
  assert.ok(STORIA.flag[m.flag].valori.includes(m.valore_restituzione));
  const dono = DONI.doni.find((d) => d.id === MEDAGLIONE);
  assert.equal(dono.categoria, 'ricordi');
  assert.equal(dono.sagoma.tipo, 'profilo', 'un ricordo è azzurro (profilo)');
  assert.deepEqual(m.bonus_tenuto, dono.modificatori, 'bonus_tenuto è la lista del catalogo');
  assert.equal(m.effetto_ceduto.scintille, DEF.effetto_ceduto.scintille.base);
  assert.ok(m.effetto_ceduto.scintille >= DEF.effetto_ceduto.scintille.min && m.effetto_ceduto.scintille <= DEF.effetto_ceduto.scintille.max);
  // errori di contenuto: dono ignoto, scena che non decide il flag, valore fuori elenco
  const rotto = validaRicordi({
    tabella: { r_raccolta: RICORDI.r_raccolta, ricordi: { 'dono-inesistente': DEF, [MEDAGLIONE]: { ...DEF, valore_restituzione: 'bruciato' } } },
    catalogo: DONI.doni, storia: STORIA,
  });
  assert.equal(rotto.modelli.size, 0);
  assert.ok(rotto.errori.some((e) => e.includes('dono-inesistente')));
  assert.ok(rotto.errori.some((e) => e.includes('bruciato')));
  assert.equal(modelloRicordo(dono, DEF).id, MEDAGLIONE);
});

// ---- criterio 1 -------------------------------------------------------------------------------

test('S028-1: GIVEN tonino_ricordo = null WHEN il Gatto si dissolve THEN lascia il Medaglione a terra; raccolto: +1 danno finché tenuto e goccia azzurra nell\'HUD', async () => {
  const m = await creaMondo();
  assert.equal(m.narrativa.flag()[DEF.flag], null);
  const dannoPrima = m.danno();
  assert.equal(dannoPrima, m.dannoBase());
  const dove = { x: m.ferruccio.x + 120, y: m.ferruccio.y };
  m.sconfiggiGatto(dove);
  const caduti = m.eventiDi(EVENTI_RICORDI.caduto);
  assert.equal(caduti.length, 1);
  assert.equal(caduti[0].id, MEDAGLIONE);
  assert.equal(caduti[0].persona, DEF.persona);
  assert.deepEqual(m.ricordi.aTerra().map((o) => ({ id: o.id, x: o.x, y: o.y, stanza: o.stanza })), [{ id: MEDAGLIONE, ...dove, stanza: STANZA }]);
  // lontano: non si raccoglie da solo
  m.tick(5);
  assert.deepEqual(m.ricordi.inMano(), []);
  // ci cammina sopra: raccolto, dono attivo, +1 danno (il bonus del catalogo), evento
  const t = m.raccogliCamminando();
  assert.ok(t > 0 && t < 240, `raccolto camminando in ${t} tick`);
  assert.deepEqual(m.ricordi.aTerra(), []);
  assert.deepEqual(m.ricordi.inMano(), [MEDAGLIONE]);
  assert.deepEqual(m.mod.doniAttivi(), [MEDAGLIONE]);
  const bonus = DONI.doni.find((d) => d.id === MEDAGLIONE).modificatori.find((x) => x.statistica === 'danno' && x.operazione === 'somma').valore;
  assert.equal(m.danno(), dannoPrima + bonus);
  assert.equal(m.eventiDi(EVENTI_RICORDI.raccolto).length, 1);
  assert.equal(m.eventiDi('doni.aggiunto').length, 1);
  // HUD: una goccia azzurra con il profilo del medaglione; il cartiglio del dono è azzurro
  m.tick(1);
  const gocce = perClasse(m.hud.elementi.lista, 'azzurro');
  assert.equal(gocce.length, 1);
  assert.equal(gocce[0].dataset.id, MEDAGLIONE);
  assert.equal(m.hud.elementi.hud.hidden, false);
  assert.equal(m.hud.cartiglio().azzurro, true);
  assert.equal(m.hud.cartiglio().nome, DONI.doni.find((d) => d.id === MEDAGLIONE).nome);
  // un secondo Gatto nella stessa notte: niente (è già in mano)
  m.sconfiggiGatto();
  assert.deepEqual(m.eventiDi(EVENTI_RICORDI.nessuno).map((e) => e.motivo), [MOTIVI_RICORDI.inMano]);
  assert.deepEqual(m.ricordi.aTerra(), []);
  assert.deepEqual(m.log.voci, []);
});

test('S028-1b: senza x,y il ricordo cade su Ferruccio e si raccoglie al primo tick; boss ignoto → nessuno; in un\'altra stanza non si raccoglie', async () => {
  const m = await creaMondo();
  m.eventi.emit('boss.sconfitto', { id: 'nessun-boss' });
  assert.deepEqual(m.eventiDi(EVENTI_RICORDI.nessuno).map((e) => e.motivo), [MOTIVI_RICORDI.bossIgnoto]);
  m.eventi.emit('boss.sconfitto', { id: DEF.boss }); // id di storia.json, non l'archetipo
  const [c] = m.eventiDi(EVENTI_RICORDI.caduto);
  assert.deepEqual({ x: c.x, y: c.y }, { x: m.ferruccio.x, y: m.ferruccio.y });
  m.tick(1);
  assert.deepEqual(m.ricordi.inMano(), [MEDAGLIONE]);
  // caduto nella stanza A, Ferruccio passa nella stanza B: resta a terra in A
  const m2 = await creaMondo();
  m2.sconfiggiGatto({ x: m2.ferruccio.x, y: m2.ferruccio.y });
  m2.eventi.emit('notte.stanza', { a: 'altra', da: STANZA, tipo: 'normale' });
  m2.tick(3);
  assert.deepEqual(m2.ricordi.inMano(), []);
  assert.equal(m2.ricordi.aTerra(STANZA).length, 1);
  assert.equal(m2.ricordi.aTerra('altra').length, 0);
  m2.eventi.emit('notte.stanza', { a: STANZA, da: 'altra', tipo: 'banchetto' });
  m2.tick(1);
  assert.deepEqual(m2.ricordi.inMano(), [MEDAGLIONE]);
});

// ---- criterio 2 -------------------------------------------------------------------------------

test('S028-2: GIVEN Medaglione in mano e banchetto a porte aperte WHEN interagisci con Tonino THEN parte la scelta: due pulsanti con le etichette e cosa_sacrifica del file, nessuna selezione predefinita', async () => {
  const m = await creaMondo();
  m.sbloccaFinoAllaScelta();
  // senza il Medaglione la scelta NON si apre: Tonino ripete (il GDD: «si apre solo con il ricordo nell'inventario»)
  const prima = m.incontri.interagisci(ANCORAGGIO_BANCHETTO);
  assert.ok(prima);
  assert.notEqual(prima.id, SCENA_SCELTA.id);
  assert.ok(m.narrativa.disponibili(ANCORAGGIO_BANCHETTO).some((s) => s.id === SCENA_SCELTA.id), 'la scena resta disponibile (non vista)');
  m.incontri.abbandona();
  m.tick(1);
  m.prendiMedaglione();
  // porte chiuse: niente
  assert.equal(m.incontri.interagisci(ANCORAGGIO_BANCHETTO, { porteChiuse: true }), null);
  assert.deepEqual(m.eventiDi('incontri.rifiutato').map((e) => e.motivo), [RIFIUTI.porteChiuse]);
  // porte aperte: la scena di scelta, poi i due pulsanti
  const d = m.apriScelta();
  assert.equal(d.id, SCENA_SCELTA.id);
  assert.equal(d.fase, FASI.scelta);
  assert.equal(d.scelta.flag, DEF.flag);
  assert.equal(d.scelta.opzioni.length, 2);
  assert.deepEqual(d.scelta.opzioni.map((o) => o.etichetta), SCENA_SCELTA.scelta.opzioni.map((o) => o.etichetta));
  assert.deepEqual(d.scelta.opzioni.map((o) => o.cosa_sacrifica), SCENA_SCELTA.scelta.opzioni.map((o) => o.cosa_sacrifica));
  assert.ok(d.scelta.opzioni.every((o) => o.cosa_sacrifica.length > 0));
  assert.equal(d.scelta.selezionata, -1, 'nessuna selezione predefinita');
  // DOM: due <li class="opzione"> con etichetta e sacrificio, nessuna `selezionata`; conferma senza selezione non decide
  const li = perClasse(m.cartiglio.elementi.opzioni, 'opzione');
  assert.equal(li.length, 2);
  assert.deepEqual(li.map((l) => l.className), ['opzione', 'opzione']);
  assert.deepEqual(li.map((l) => perClasse(l, 'etichetta')[0].textContent), SCENA_SCELTA.scelta.opzioni.map((o) => o.etichetta));
  assert.deepEqual(li.map((l) => perClasse(l, 'sacrificio')[0].textContent), SCENA_SCELTA.scelta.opzioni.map((o) => o.cosa_sacrifica));
  m.tick(m.ticksAntirimbalzo);
  m.premi('conferma', 1);
  assert.equal(d.fase, FASI.scelta);
  assert.equal(m.narrativa.flag()[DEF.flag], null);
  assert.equal(m.cartiglio.stato().nascosto, false);
  assert.deepEqual(m.log.voci, []);
});

// ---- criterio 3 -------------------------------------------------------------------------------

test('S028-3a: «restituito» confermato → flag deciso, Medaglione sparito, danno alla base, 12 scintille, profilo, parte ricordo-restituito', async () => {
  const m = await creaMondo();
  m.sbloccaFinoAllaScelta();
  m.prendiMedaglione();
  const scintillePrima = m.profilo.scintille;
  const d = m.apriScelta();
  const i = d.scelta.opzioni.findIndex((o) => o.valore === DEF.valore_restituzione);
  assert.ok(i >= 0);
  // giù seleziona la prima opzione (da −1), poi conferma
  for (let k = 0; k <= i; k++) m.premi('giu', 1);
  assert.equal(d.scelta.selezionata, i);
  m.tick(m.ticksAntirimbalzo);
  m.premi('conferma', 1);
  assert.equal(m.narrativa.flag()[DEF.flag], DEF.valore_restituzione);
  assert.deepEqual(m.ricordi.inMano(), []);
  assert.deepEqual(m.mod.doniAttivi(), []);
  assert.equal(m.danno(), m.dannoBase());
  assert.equal(m.profilo.scintille - scintillePrima, DEF.effetto_ceduto.scintille.base);
  assert.equal(m.profilo.scintille - scintillePrima, 12, 'il GDD: 12 scintille');
  assert.deepEqual(m.profilo.ricordiRestituiti, [MEDAGLIONE]);
  assert.deepEqual(m.eventiDi(EVENTI_RICORDI.ceduto).map((e) => ({ id: e.id, valore: e.valore, scintille: e.scintille })), [{ id: MEDAGLIONE, valore: DEF.valore_restituzione, scintille: 12 }]);
  assert.equal(m.eventiDi(EVENTI_RICORDI.tenuto).length, 0);
  assert.equal(m.eventiDi('economia.scintille').at(-1).motivo, 'ricordo');
  assert.equal(d.fase, FASI.esito);
  assert.equal(d.esito, 'piazza-dante.ricordo-restituito');
  assert.equal(m.cartiglio.stato().testo, STORIA.scene.find((s) => s.id === d.esito).battute[0].testo);
  // la decisione è nel profilo salvato e il derivato è vero
  assert.equal(m.narrativa.derivati().lettera_agnese, REGOLE.booleani.vero);
  // il pool non offre più il Medaglione (profilo) e il Gatto non lo lascia più (flag deciso)
  assert.deepEqual(m.pool.eleggibili({ piano: 1, canale: 'boss' }), []);
  m.sconfiggiGatto();
  assert.deepEqual(m.eventiDi(EVENTI_RICORDI.nessuno).map((e) => e.motivo), [MOTIVI_RICORDI.deciso]);
  assert.deepEqual(m.ricordi.aTerra(), []);
  assert.deepEqual(m.log.voci, []);
});

test('S028-3b: «negato» confermato → flag deciso, il bonus resta fino a fine notte, parte ricordo-negato; a fine notte il Medaglione sparisce', async () => {
  const m = await creaMondo();
  m.sbloccaFinoAllaScelta();
  m.prendiMedaglione();
  const scintillePrima = m.profilo.scintille;
  const d = m.apriScelta();
  const i = d.scelta.opzioni.findIndex((o) => o.valore !== DEF.valore_restituzione);
  for (let k = 0; k <= i; k++) m.premi('giu', 1);
  m.tick(m.ticksAntirimbalzo);
  m.premi('conferma', 1);
  const valore = SCENA_SCELTA.scelta.opzioni[i].valore;
  assert.equal(m.narrativa.flag()[DEF.flag], valore);
  assert.deepEqual(m.ricordi.inMano(), [MEDAGLIONE], 'tenuto');
  assert.equal(m.danno(), m.dannoBase() + 1);
  assert.equal(m.profilo.scintille, scintillePrima, 'nessuna scintilla');
  assert.deepEqual(m.profilo.ricordiRestituiti, []);
  assert.deepEqual(m.eventiDi(EVENTI_RICORDI.tenuto).map((e) => e.valore), [valore]);
  assert.equal(d.fase, FASI.esito);
  assert.equal(d.esito, 'piazza-dante.ricordo-negato');
  // chiude l'esito: viste entrambe; Tonino poi ripete una battuta dello stato «negato»
  for (let k = 0; k < 10 && d.fase !== FASI.finito; k++) { m.tick(m.ticksAntirimbalzo); m.premi('avanza', 1); }
  assert.equal(d.fase, FASI.finito);
  assert.ok(m.narrativa.avanzamento().scene_viste.includes(d.esito));
  // fine della notte: il bonus finisce, il flag resta
  m.economia.fineNotte();
  assert.deepEqual(m.ricordi.inMano(), []);
  assert.equal(m.danno(), m.dannoBase());
  assert.equal(m.narrativa.flag()[DEF.flag], valore);
  assert.deepEqual(m.eventiDi(EVENTI_RICORDI.perso).map((e) => e.motivo), [MOTIVI_RICORDI.fineNotte]);
  // nelle notti dopo il Gatto non lo lascia più
  m.sconfiggiGatto();
  assert.deepEqual(m.eventiDi(EVENTI_RICORDI.nessuno).map((e) => e.motivo), [MOTIVI_RICORDI.deciso]);
  assert.deepEqual(m.log.voci, []);
});

test('S028-3c: una decisione forzata (QA) senza il ricordo in mano non toglie nulla e non paga scintille', async () => {
  const m = await creaMondo();
  const prima = m.profilo.scintille;
  assert.equal(m.narrativa.imposta(DEF.flag, DEF.valore_restituzione).ok, true);
  assert.equal(m.profilo.scintille, prima);
  assert.deepEqual(m.profilo.ricordiRestituiti, []);
  assert.equal(m.eventiDi(EVENTI_RICORDI.ceduto).length, 0);
});

// ---- criterio 4 -------------------------------------------------------------------------------

test('S028-4: GIVEN morte con il Medaglione in mano WHEN si ribatte il Gatto THEN lo lascia di nuovo (flag ancora null)', async () => {
  const m = await creaMondo();
  m.prendiMedaglione();
  m.eventi.emit('ferruccio.morto', { x: m.ferruccio.x, y: m.ferruccio.y, direzione: { x: 0, y: 1 } });
  assert.deepEqual(m.ricordi.inMano(), []);
  assert.deepEqual(m.mod.doniAttivi(), []);
  assert.equal(m.danno(), m.dannoBase());
  assert.equal(m.narrativa.flag()[DEF.flag], null, 'nessuna decisione implicita');
  assert.deepEqual(m.profilo.ricordiRestituiti, []);
  // l'economia ascolta `ferruccio.morto` prima e chiude la notte: il motivo registrato è il primo dei due
  const persi = m.eventiDi(EVENTI_RICORDI.perso);
  assert.equal(persi.length, 1, 'un solo evento perso');
  assert.deepEqual(persi[0].ids, [MEDAGLIONE]);
  assert.ok([MOTIVI_RICORDI.morte, MOTIVI_RICORDI.fineNotte].includes(persi[0].motivo));
  // la notte dopo: il Gatto lo lascia di nuovo e si raccoglie di nuovo
  m.sconfiggiGatto();
  assert.equal(m.eventiDi(EVENTI_RICORDI.caduto).length, 2);
  m.raccogliCamminando();
  assert.deepEqual(m.ricordi.inMano(), [MEDAGLIONE]);
  assert.equal(m.danno(), m.dannoBase() + 1);
  // morte con il Medaglione ancora a terra: anche quello sparisce
  const m2 = await creaMondo();
  m2.sconfiggiGatto();
  m2.eventi.emit('ferruccio.morto', { direzione: { x: 0, y: 1 } });
  assert.deepEqual(m2.ricordi.aTerra(), []);
  assert.deepEqual(m2.log.voci, []);
});

// ---- regole del codice ------------------------------------------------------------------------

test('S028-5: regole del codice: nessun Math.random, nessuna virgoletta « » e nessun nome di dono, flag o scena nel modulo dei ricordi', () => {
  const sorgente = readFileSync(join(RADICE, 'motore/oggetti/ricordi.js'), 'utf8');
  assert.ok(!sorgente.includes('Math.random'));
  assert.ok(!/[«»]/.test(sorgente));
  for (const parola of [MEDAGLIONE, DEF.flag, DEF.scena_scelta, DEF.boss, DEF.archetipo_boss, DEF.persona, DEF.valore_restituzione]) {
    assert.ok(!sorgente.includes(`'${parola}'`), `nome di gioco nel codice: ${parola}`);
  }
  assert.ok(!/\b12\b/.test(sorgente.replace(/\/\*[\s\S]*?\*\//g, '')), 'le 12 scintille stanno in ricordi.json');
});
