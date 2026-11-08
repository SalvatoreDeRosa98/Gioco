/**
 * gioco/qa/incontri.test.mjs — Test unitari della storia 027 (incontri per ancoraggio, cartiglio,
 * tableau), senza browser: `node gioco/qa/incontri.test.mjs` dalla radice (node:test, Node ≥ 20).
 *
 * Dati REALI: `contenuti/storia.json`, `narrativa.json`, `ancoraggi.json`, `ripetizioni.json`,
 * `interfaccia.json`, `parametri/incontri.json`. Casi: spezzatura (140 caratteri → due cartigli dello
 * stesso parlante, testo identico concatenato, punteggiatura vicino alla metà, parola se non c'è
 * punteggiatura); criterio 1 (notte 1, hub, Tonino → `piazza-dante.tonino-primo-incontro` nell'ordine
 * del file, una battuta alla volta, pausa logica via evento; la seconda interazione dà una ripetizione);
 * porte chiuse → nessun cartiglio; tableau di Gaetano ≥ 3 s con una sola voce; scelta → decisione →
 * esito nello stesso cartiglio; chiusura a metà → non vista; ogni scena di piazza-dante ha un ancoraggio
 * e Tonino ha una ripetizione vera per ogni stato di `tonino_ricordo`; cartiglio e tableau in DOM finto
 * (maiuscoletto come classe/elemento, didascalia, antirimbalzo, nessun avanzamento automatico);
 * nessun Math.random, nessuna virgoletta « » e nessun numero di gioco nei moduli nuovi.
 *
 * Storia 029 (H01-H05, R02): l'hub di Piazza Dante come stanza speciale (`mondo/hub.js`, modello
 * `contenuti/modelli-stanza/hub/piazza-dante.json`): modello valido, Tonino al banchetto, porta della bottega
 * chiusa finché `fucina_aperta` è falso, finestra di Mariella sempre accesa e mai un personaggio, luna e fili
 * d'oro, ingresso al piano 1 come unica apertura; presenze per stato (Taddeo se perdonato, Agnese sotto il
 * portico se risvegliata); entrata alla notte 1 → scene automatiche; attraversare l'ingresso → `hub.partenza`
 * UNA volta con il seme derivato dal profilo e dalla notte (diverso dal seme del profilo, uguale a parità di
 * profilo, diverso alla notte dopo) e `notte` che non cambia; interagisci vicino a Tonino → primo incontro,
 * Ferruccio fermo durante il dialogo; cartellino DOM dell'hub (notte, suggerimenti); regole del codice.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { creaBus } from '../motore/fondazione/eventi.js';
import { creaInput } from '../motore/fondazione/input.js';
import { creaParametri } from '../motore/fondazione/parametri.js';
import { creaSalvataggio, memoriaInRam } from '../motore/persistenza/salvataggio.js';
import { crea as creaStato } from '../motore/storia/stato-narrativo.js';
import { creaIncontri, spezza, durataTableau, luogoDi, eAutomatico, FASI, RIFIUTI } from '../motore/storia/incontri.js';
import { creaCartiglio } from '../motore/ui/cartiglio.js';
import { creaTableau } from '../motore/ui/tableau.js';
import { creaCampo } from '../motore/mondo/fisica.js';
import { creaHub, semeNotte, validaModelloHub, TIPO_HUB, ID_INGRESSO, STATI_PORTA_HUB } from '../motore/mondo/hub.js';
import { creaInterfacciaHub } from '../motore/interfaccia/hub.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const leggi = (p) => JSON.parse(readFileSync(join(RADICE, p), 'utf8'));
const STORIA = leggi('contenuti/storia.json');
const REGOLE = leggi('contenuti/narrativa.json');
const ANCORAGGI = leggi('contenuti/ancoraggi.json');
const RIPETIZIONI = leggi('contenuti/ripetizioni.json');
const TESTI = leggi('contenuti/interfaccia.json');
const MODELLO_HUB = leggi('contenuti/modelli-stanza/hub/piazza-dante.json');
const PASSO_S = 1 / 60;
/** Seme del profilo di prova (lo stesso dei test Playwright). */
const SEME_PROFILO = 1845;
/** Risoluzione logica della scena (ADR-0001), non un valore di gioco. */
const SCENA = { larghezza: 1280, altezza: 720 };

function logFinto() {
  const voci = [];
  return { voci, error: (...a) => voci.push(a.map(String).join(' ')), warn: () => {} };
}

async function parametriReali(log, statistiche = ['incontri']) {
  const parametri = creaParametri({ log });
  await parametri.carica({ caricatore: (n) => leggi(`contenuti/parametri/${n}.json`), statistiche, tabelle: ['input'] });
  assert.deepEqual(parametri.errori(), []);
  return parametri;
}

/** DOM finto minimo (come doni.integrazione.test.mjs) con dataset e closest. */
function documentoFinto() {
  const crea = (tag) => {
    const el = {
      tag, children: [], className: '', hidden: false, textContent: '', dataset: {}, listeners: {},
      append(...n) { for (const x of n) if (typeof x !== 'string') el.children.push(x); },
      replaceChildren(...n) { el.children = n.filter((x) => typeof x !== 'string'); },
      addEventListener(nome, fn) { el.listeners[nome] = fn; },
    };
    return el;
  };
  return { createElement: crea };
}

/** Mondo di prova: stato reale, incontri, input, cartiglio e tableau in DOM finto. */
async function creaMondo({ ancoraggi = ANCORAGGI, ripetizioni = RIPETIZIONI } = {}) {
  const log = logFinto();
  const parametri = await parametriReali(log);
  const eventi = creaBus({ log });
  const ricevuti = [];
  for (const n of ['incontri.avvio', 'incontri.battuta', 'incontri.scelta', 'incontri.fine', 'incontri.rifiutato', 'incontri.scena', 'narrativa.vista']) {
    eventi.on(n, (p) => ricevuti.push({ nome: n, ...p }));
  }
  const salvataggio = creaSalvataggio({ memoria: memoriaInRam(), log, ora: () => 0 });
  const stato = creaStato({ storia: STORIA, regole: REGOLE, ancoraggi, eventi, salvataggio, slot: 1, log });
  const incontri = creaIncontri({
    stato, storia: STORIA, ancoraggi, ripetizioni, parametri, eventi, log, testi: TESTI.incontri,
    notte: () => stato.avanzamento()[REGOLE.piani.campo_notte], tipiSenzaAttesa: REGOLE.tipi_senza_attesa,
  });
  const input = creaInput(parametri.get('input'));
  const documento = documentoFinto();
  const contenitore = documento.createElement('div');
  const cartiglio = creaCartiglio({ documento, contenitore, testi: TESTI, input, incontri, antirimbalzoMs: () => parametri.get('incontri.antirimbalzo') });
  const tableau = creaTableau({ documento, contenitore, input, incontri, tMinMs: () => parametri.get('incontri.tableau.t_min') });
  const tasto = (azione) => `t:${parametri.get(`input.tastiera.${azione}`)[0]}`;
  const tick = (n = 1) => {
    for (let i = 0; i < n; i++) {
      input.inizioTick();
      cartiglio.tick(PASSO_S);
      tableau.tick(PASSO_S);
      cartiglio.aggiorna();
      tableau.aggiorna();
    }
  };
  const premi = (azione, n = 1) => { input.sorgenteGiu(tasto(azione)); tick(n); input.sorgenteSu(tasto(azione)); };
  const ms = (x) => Math.ceil(x / (1000 / 60));
  return { log, parametri, eventi, ricevuti, stato, incontri, input, cartiglio, tableau, tick, premi, ms, salvataggio };
}

/** Porta lo stato a «notte 1, hub, appena arrivati»: le scene automatiche dell'ingresso del piano 1. */
function arrivoNotte1(m) {
  const d = m.incontri.automatiche('ingresso-piano:1');
  // risveglio e tutorial sono mute (viste subito); la targa ha una didascalia
  assert.ok(d, 'la targa parte da sola');
  assert.equal(d.id, 'piazza-dante.targa-commemorativa');
  assert.equal(d.cartigli.length, 1);
  assert.equal(d.cartigli[0].didascalia, true);
  assert.equal(d.avanza(), true);
  assert.equal(m.incontri.dialogo(), null);
}

// ---------------------------------------------------------------------------------------------
// spezzatura e formule pure
// ---------------------------------------------------------------------------------------------

test('S01: una battuta di 140 caratteri è spezzata in due cartigli con il testo identico concatenato, alla punteggiatura vicino alla metà', () => {
  const a = 'Uagliò, io stavo qua a vendere mozzarelle quando la luna si è fermata e nessuno in piazza se ne è accorto.';
  const b = 'Nessuno tranne te, pare.';
  const testo = `${a} ${b}`;
  assert.equal(testo.length >= 120 && testo.length <= 140, true, `lunghezza ${testo.length}`);
  const pezzi = spezza(testo, 120);
  assert.equal(pezzi.length, 2);
  assert.ok(pezzi.every((p) => p.length <= 120));
  assert.equal(pezzi.join(' '), testo, 'mai riscritta');
  assert.ok(pezzi[0].endsWith(',') || pezzi[0].endsWith('.'), `taglio alla punteggiatura: «${pezzi[0]}»`);
});

test('S02: senza punteggiatura si spezza alla parola più vicina alla metà; una battuta corta resta intera; i pezzi lunghi si rispezzano', () => {
  const parole = Array.from({ length: 30 }, (_, i) => `parola${i}`).join(' ');
  const pezzi = spezza(parole, 120);
  assert.ok(pezzi.length >= 2);
  assert.ok(pezzi.every((p) => p.length <= 120 && !p.startsWith(' ') && !p.endsWith(' ')));
  assert.equal(pezzi.join(' '), parole);
  assert.deepEqual(spezza('Rosa...', 120), ['Rosa...']);
  const lunga = Array.from({ length: 80 }, (_, i) => `p${i}`).join(' ');
  assert.ok(spezza(lunga, 120).every((p) => p.length <= 120));
  assert.ok(spezza('x'.repeat(250), 120).every((p) => p.length <= 120), 'senza spazi: taglio secco');
});

test('S03: durata del tableau = max(t_min, t_base + 0,06 s × caratteri); luoghi e ancoraggi automatici', () => {
  assert.equal(durataTableau({ caratteri: 27, tMinMs: 3000, tBaseMs: 1500, msPerCarattere: 60 }), 3120);
  assert.equal(durataTableau({ caratteri: 120, tMinMs: 3000, tBaseMs: 1500, msPerCarattere: 60 }), 8700);
  assert.equal(durataTableau({ caratteri: 0, tMinMs: 3000, tBaseMs: 1500, msPerCarattere: 60 }), 3000);
  assert.equal(luogoDi('hub:tonino'), 'hub');
  assert.equal(luogoDi('banchetto'), 'piano');
  assert.equal(eAutomatico('ingresso-piano:1'), true);
  assert.equal(eAutomatico('dopo-boss:gatto-dei-quattro-canti'), true);
  assert.equal(eAutomatico('epilogo'), true);
  assert.equal(eAutomatico('hub:tonino'), false);
});

// ---------------------------------------------------------------------------------------------
// contenuti
// ---------------------------------------------------------------------------------------------

test('K01: ogni scena del capitolo piazza-dante ha un ancoraggio valido in ancoraggi.json; ogni ancoraggio punta a una scena esistente', () => {
  const ids = new Set(STORIA.scene.map((s) => s.id));
  const prefissi = ['hub:', 'banchetto', 'ricordo:', 'dopo-boss:', 'ingresso-piano:', 'fucina', 'epilogo'];
  for (const s of STORIA.scene.filter((x) => x.capitolo === 'piazza-dante')) {
    const a = ANCORAGGI.scene[s.id]?.ancoraggio;
    assert.ok(a, `${s.id} senza ancoraggio`);
    assert.ok(prefissi.some((p) => a.startsWith(p)), `${s.id}: ancoraggio '${a}' fuori dalla regola 1`);
  }
  for (const id of Object.keys(ANCORAGGI.scene)) assert.ok(ids.has(id), `ancoraggio per una scena ignota: ${id}`);
  const tableau = Object.entries(ANCORAGGI.scene).filter(([, v]) => v.tableau).map(([k]) => k);
  assert.ok(tableau.includes('villa-comunale.ricordo-gaetano'));
});

test('K02: Tonino ha almeno una battuta di ripetizione vera per ogni stato di tonino_ricordo, breve, con un parlante noto', async () => {
  const m = await creaMondo();
  const valori = [null, ...STORIA.flag.tonino_ricordo.valori];
  for (const v of valori) {
    m.stato.imposta('tonino_ricordo', v);
    const b = m.incontri.ripetizione('tonino');
    assert.equal(b.generica, false, `stato ${v}: nessuna ripetizione vera`);
    assert.ok(b.testo.length > 0 && b.testo.length <= 120, b.testo);
    assert.ok(['tonino', 'didascalia'].includes(b.chi));
    assert.equal(b.nome, b.chi === 'tonino' ? 'Tonino' : 'didascalia');
  }
  assert.equal(RIPETIZIONI.canon, 'Provisional');
  assert.deepEqual(m.log.voci, []);
});

// ---------------------------------------------------------------------------------------------
// criteri della storia
// ---------------------------------------------------------------------------------------------

test('A01: notte 1, hub, interagisci con Tonino → piazza-dante.tonino-primo-incontro, battute nell\'ordine del file, nome, didascalie, pausa logica (evento)', async () => {
  const m = await creaMondo();
  arrivoNotte1(m);
  const attese = STORIA.scene.find((s) => s.id === 'piazza-dante.tonino-primo-incontro').battute;
  const d = m.incontri.interagisci('hub:tonino');
  assert.ok(d);
  assert.equal(d.id, 'piazza-dante.tonino-primo-incontro');
  assert.equal(d.tipo, 'scena');
  assert.equal(d.tableau, false);
  assert.equal(m.ricevuti.at(-2).nome, 'incontri.avvio', 'la radice di composizione mette il ciclo in pausa su questo evento');
  assert.equal(d.cartigli.length, attese.length, 'nessuna battuta supera 120 caratteri: una per cartiglio');
  for (let i = 0; i < attese.length; i++) {
    const c = d.corrente();
    assert.equal(c.testo, attese[i].testo);
    assert.equal(c.chi, attese[i].chi);
    assert.equal(c.didascalia, attese[i].chi === 'didascalia');
    assert.equal(c.nome, attese[i].chi === 'tonino' ? 'Tonino' : 'didascalia');
    assert.equal(m.stato.avanzamento().scene_viste.includes(d.id), false, 'non vista finché il cartiglio è aperto');
    d.avanza();
  }
  assert.equal(d.fase, FASI.finito);
  assert.equal(m.incontri.dialogo(), null);
  assert.ok(m.stato.avanzamento().scene_viste.includes('piazza-dante.tonino-primo-incontro'), 'vista alla chiusura');
  assert.equal(m.ricevuti.at(-1).nome, 'incontri.fine');
  assert.equal(m.incontri.nuoveMostrate('tonino', 'hub'), 1);
  assert.deepEqual(m.log.voci.filter((v) => !v.includes('bottega-di-gaetano')), [], 'solo la scena muta della bottega è segnalata');
});

test('A02: la seconda interazione della stessa notte dà una ripetizione, non una scena nuova; la notte dopo Tonino ha di nuovo una scena (se ce n\'è una con battute)', async () => {
  const m = await creaMondo();
  arrivoNotte1(m);
  let d = m.incontri.interagisci('hub:tonino');
  while (d.fase !== FASI.finito) d.avanza();
  d = m.incontri.interagisci('hub:tonino');
  assert.ok(d);
  assert.equal(d.tipo, 'ripetizione');
  assert.equal(d.id, null);
  assert.equal(d.cartigli.length, 1);
  assert.equal(d.saltabile, true);
  const prima = d.cartigli[0].testo;
  assert.ok(RIPETIZIONI.npc.tonino.some((b) => b.testo === prima));
  assert.equal(d.salta(), true, 'una ripetizione si salta con indietro');
  d = m.incontri.interagisci('hub:tonino');
  assert.notEqual(d.cartigli[0].testo, prima, 'le ripetizioni vere si alternano');
  d.avanza();
  // la scena della bottega (hub:tonino, ordine 50) è muta: segnalata una volta e saltata, mai «vista»
  assert.equal(m.log.voci.filter((v) => v.includes('bottega-di-gaetano')).length, 1);
  assert.equal(m.stato.avanzamento().scene_viste.includes('piazza-dante.bottega-di-gaetano'), false);
});

test('A03: scena di tipo che non aspetta (obbligatoria/scelta) parte anche se l\'NPC ha già parlato stanotte; le altre aspettano', async () => {
  const m = await creaMondo();
  // storia finta: due scene di Tonino nell'hub, una obbligatoria e un indizio
  const storia = {
    ...STORIA,
    scene: [
      { id: 'x.a', capitolo: 'piazza-dante', tipo: 'indizio', quando: {}, ordine: 10, battute: [{ chi: 'tonino', testo: 'Uno.' }] },
      { id: 'x.b', capitolo: 'piazza-dante', tipo: 'indizio', quando: {}, ordine: 20, battute: [{ chi: 'tonino', testo: 'Due.' }] },
      { id: 'x.c', capitolo: 'piazza-dante', tipo: 'obbligatoria', quando: {}, ordine: 30, battute: [{ chi: 'tonino', testo: 'Tre.' }] },
    ],
  };
  const ancoraggi = { scene: { 'x.a': { ancoraggio: 'hub:tonino' }, 'x.b': { ancoraggio: 'hub:tonino' }, 'x.c': { ancoraggio: 'hub:tonino' } } };
  const log = logFinto();
  const stato = creaStato({ storia, regole: REGOLE, ancoraggi, log });
  const incontri = creaIncontri({ stato, storia, ancoraggi, ripetizioni: RIPETIZIONI, parametri: m.parametri, log, notte: () => stato.avanzamento().notte, tipiSenzaAttesa: REGOLE.tipi_senza_attesa, testi: TESTI.incontri });
  let d = incontri.interagisci('hub:tonino');
  assert.equal(d.id, 'x.a');
  d.avanza();
  d = incontri.interagisci('hub:tonino');
  assert.equal(d.tipo, 'ripetizione', 'x.b (indizio) aspetta la notte dopo');
  d.avanza();
  stato.segnaVista('x.b');
  d = incontri.interagisci('hub:tonino');
  assert.equal(d.id, 'x.c', 'l\'obbligatoria non aspetta');
  d.avanza();
  stato.nuovaNotte();
  stato.imposta('tonino_ricordo', null);
  assert.equal(incontri.nuoveMostrate('tonino', 'hub'), 0, 'il contatore è per notte');
});

test('A04: con nemici vivi nella stanza (porte chiuse) nessun cartiglio e un evento di rifiuto; un dialogo aperto rifiuta il secondo', async () => {
  const m = await creaMondo();
  arrivoNotte1(m);
  const d = m.incontri.interagisci('banchetto', { porteChiuse: true });
  assert.equal(d, null);
  assert.equal(m.ricevuti.at(-1).nome, 'incontri.rifiutato');
  assert.equal(m.ricevuti.at(-1).motivo, RIFIUTI.porteChiuse);
  m.tick(1);
  assert.equal(m.cartiglio.stato(), null);
  assert.equal(m.cartiglio.elementi.radice.hidden, true);
  const a = m.incontri.interagisci('hub:tonino');
  assert.ok(a);
  assert.equal(m.incontri.interagisci('hub:tonino'), null);
  assert.equal(m.ricevuti.at(-1).motivo, RIFIUTI.occupato);
});

test('A05: villa-comunale.ricordo-gaetano parte come tableau: resta ≥ 3 s, una sola voce «Prima fate uscire i ragazzi!», poi si chiude da solo', async () => {
  const m = await creaMondo();
  const d = m.incontri.mostra('villa-comunale.ricordo-gaetano');
  assert.ok(d);
  assert.equal(d.tableau, true);
  assert.equal(d.voce(), 'Prima fate uscire i ragazzi!');
  assert.equal(d.durataMs, 3180, "28 caratteri (il GDD ne conta 27): 1500 + 60 × 28");
  assert.ok(d.durataMs >= m.parametri.get('incontri.tableau.t_min'));
  m.tick(1);
  const t = m.tableau.stato();
  assert.equal(t.nascosto, false);
  assert.equal(t.voce, 'Prima fate uscire i ragazzi!');
  assert.equal(t.parlante, 'Gaetano');
  assert.equal(m.cartiglio.stato(), null, 'il cartiglio non si apre per un tableau');
  // avanzare prima di t_min non lo chiude
  m.premi('avanza', 1);
  m.tick(m.ms(2900) - 3);
  assert.ok(m.tableau.stato(), 'ancora aperto a 2,9 s');
  m.tick(m.ms(300));
  assert.equal(m.tableau.stato(), null, 'chiuso dopo la durata');
  assert.equal(m.tableau.elementi.radice.hidden, true);
  assert.ok(m.stato.avanzamento().scene_viste.includes('villa-comunale.ricordo-gaetano'));
});

test('A06: tableau della filastrocca: dopo t_min un avanzamento lo chiude', async () => {
  const m = await creaMondo();
  const d = m.incontri.mostra('piazza-dante.filastrocca');
  assert.equal(d.tableau, true);
  assert.equal(d.voce(), '', 'una didascalia sola: nessuna voce parlata');
  assert.equal(d.durataMs, m.parametri.get('incontri.tableau.t_min'));
  m.tick(m.ms(3000) - 2);
  assert.ok(m.tableau.stato());
  m.tick(2);
  m.premi('avanza', 1);
  assert.equal(m.tableau.stato(), null);
});

test('A07: scelta di Tonino al banchetto: battute, poi le opzioni (nessuna selezionata), conferma → decisione definitiva → esito nello stesso cartiglio → viste', async () => {
  const m = await creaMondo();
  arrivoNotte1(m);
  for (const id of ['piazza-dante.tonino-primo-incontro', 'piazza-dante.gatto-dei-quattro-canti']) m.stato.segnaVista(id);
  const d = m.incontri.interagisci('banchetto');
  assert.ok(d);
  assert.equal(d.id, 'piazza-dante.scelta-tonino');
  assert.equal(d.saltabile, false, 'una scelta non si salta');
  assert.equal(d.cartigli.length, 3, 'la prima didascalia (127 caratteri) è spezzata in due');
  while (d.fase === FASI.battute) d.avanza();
  assert.equal(d.fase, FASI.scelta);
  assert.equal(d.scelta.flag, 'tonino_ricordo');
  assert.deepEqual(d.scelta.opzioni.map((o) => o.valore), ['restituito', 'negato']);
  assert.equal(d.scelta.selezionata, -1);
  assert.ok(d.scelta.opzioni.every((o) => o.etichetta && o.cosa_sacrifica));
  assert.equal(d.avanza(), false, 'in scelta non si avanza');
  assert.equal(d.salta(), false);
  assert.equal(m.ricevuti.some((e) => e.nome === 'incontri.scelta'), true);
  // cartiglio DOM: le due opzioni, la seconda selezionata con giù
  m.tick(1);
  assert.equal(m.cartiglio.elementi.opzioni.children.length, 2);
  m.premi('giu', 1);
  assert.equal(d.scelta.selezionata, 0);
  m.premi('giu', 1);
  assert.equal(d.scelta.selezionata, 1);
  assert.ok(m.cartiglio.elementi.opzioni.children[1].className.includes('selezionata'));
  m.premi('su', 1);
  assert.equal(d.scelta.selezionata, 0);
  m.tick(m.ms(200));
  m.premi('conferma', 1);
  assert.equal(m.stato.flag().tonino_ricordo, 'restituito');
  assert.equal(d.fase, FASI.esito);
  assert.equal(d.esito, 'piazza-dante.ricordo-restituito');
  assert.equal(d.corrente().testo, 'Tonino riconosce un vecchio medaglione appartenuto a Rosa.');
  assert.ok(m.stato.avanzamento().scene_viste.includes('piazza-dante.scelta-tonino'));
  assert.equal(m.stato.avanzamento().scene_viste.includes('piazza-dante.ricordo-restituito'), false);
  const n = d.cartigli.length;
  assert.ok(n >= 8, 'la didascalia lunga (>120) è spezzata: più cartigli delle battute');
  while (d.fase !== FASI.finito) d.avanza();
  assert.ok(m.stato.avanzamento().scene_viste.includes('piazza-dante.ricordo-restituito'));
  assert.equal(m.stato.decidi('tonino_ricordo', 'negato').ok, false, 'definitiva');
  // dopo la scelta, Tonino ripete una battuta dello stato «restituito»
  const r = m.incontri.interagisci('banchetto');
  assert.equal(r.tipo, 'ripetizione');
  assert.ok(RIPETIZIONI.npc.tonino.filter((b) => b.quando.tonino_ricordo === 'restituito').some((b) => b.testo === r.cartigli[0].testo));
});

test('A08: chiusura del gioco a metà scena (abbandona) → la scena non è in scene_viste e riparte dall\'inizio', async () => {
  const m = await creaMondo();
  arrivoNotte1(m);
  let d = m.incontri.interagisci('hub:tonino');
  d.avanza();
  d.avanza();
  assert.equal(m.incontri.abbandona(), true);
  assert.equal(m.incontri.dialogo(), null);
  assert.equal(m.stato.avanzamento().scene_viste.includes('piazza-dante.tonino-primo-incontro'), false);
  // nuovo mondo con lo stesso salvataggio: la scena riparte dall'inizio
  const stato2 = creaStato({ storia: STORIA, regole: REGOLE, ancoraggi: ANCORAGGI, salvataggio: m.salvataggio, slot: 1, log: m.log });
  assert.equal(stato2.avanzamento().scene_viste.includes('piazza-dante.tonino-primo-incontro'), false);
  assert.ok(stato2.disponibili('hub:tonino').some((s) => s.id === 'piazza-dante.tonino-primo-incontro'));
  d = m.incontri.interagisci('hub:tonino');
  assert.equal(d.indice, 0);
});

// ---------------------------------------------------------------------------------------------
// cartiglio DOM
// ---------------------------------------------------------------------------------------------

test('U01: cartiglio DOM: una battuta alla volta, nome del parlante nell\'elemento .parlante (maiuscoletto via CSS), didascalia senza nome, nessun avanzamento automatico, antirimbalzo', async () => {
  const m = await creaMondo();
  arrivoNotte1(m);
  // il tasto che apre il dialogo è premuto in questo stesso tick: non deve avanzare
  m.input.sorgenteGiu(`t:${m.parametri.get('input.tastiera.interagisci')[0]}`);
  m.input.inizioTick();
  const d = m.incontri.interagisci('hub:tonino');
  m.cartiglio.tick(PASSO_S);
  m.cartiglio.aggiorna();
  m.input.sorgenteSu(`t:${m.parametri.get('input.tastiera.interagisci')[0]}`);
  assert.equal(d.indice, 0, 'antirimbalzo: il tasto di apertura non avanza');
  const el = m.cartiglio.elementi;
  assert.equal(el.radice.hidden, false);
  assert.ok(el.radice.className.includes('parlato'));
  assert.equal(el.parlante.textContent, 'Tonino');
  assert.equal(el.parlante.hidden, false);
  assert.equal(el.battuta.textContent, "Uagliò, ma che è 'sta faccia?");
  assert.equal(el.suggerimento.textContent, TESTI.incontri.continua);
  // senza input, il tempo passa e non avanza
  m.tick(m.ms(5000));
  assert.equal(d.indice, 0, 'nessun avanzamento automatico');
  // avanza → didascalia in corsivo (classe) senza nome
  m.premi('avanza', 1);
  assert.equal(d.indice, 1);
  assert.ok(el.radice.className.includes('didascalia'));
  assert.equal(el.parlante.hidden, true);
  assert.equal(el.parlante.textContent, '');
  assert.equal(el.battuta.textContent, 'Ferruccio indica la propria maschera.');
  // antirimbalzo: una seconda pressione entro 160 ms non avanza, dopo sì
  m.premi('avanza', 1);
  assert.equal(d.indice, 1, 'rimbalzo ignorato');
  m.tick(m.ms(160));
  m.premi('interagisci', 1);
  assert.equal(d.indice, 2, 'interagisci avanza dopo l\'antirimbalzo');
  // click sul cartiglio
  m.tick(m.ms(160));
  el.radice.listeners.click({ target: { closest: () => null } });
  m.tick(1);
  assert.equal(d.indice, 3, 'il click avanza');
  m.tick(m.ms(160));
  m.premi('conferma', 1);
  assert.equal(d.indice, 4);
  m.tick(m.ms(160));
  m.premi('avanza', 1);
  assert.equal(d.fase, FASI.finito);
  m.tick(1);
  assert.equal(el.radice.hidden, true);
  assert.equal(m.cartiglio.stato(), null);
});

test('U02: una battuta lunga appare in due cartigli consecutivi dello stesso parlante (storia finta a 140 caratteri)', async () => {
  const m = await creaMondo();
  const testo = 'Uagliò, io stavo qua a vendere mozzarelle quando la luna si è fermata e nessuno in piazza se ne è accorto. Nessuno tranne te, pare.';
  const storia = { ...STORIA, scene: [{ id: 'x.lunga', capitolo: 'piazza-dante', tipo: 'indizio', quando: {}, ordine: 10, battute: [{ chi: 'tonino', testo }] }] };
  const ancoraggi = { scene: { 'x.lunga': { ancoraggio: 'hub:tonino' } } };
  const log = logFinto();
  const stato = creaStato({ storia, regole: REGOLE, ancoraggi, log });
  const incontri = creaIncontri({ stato, storia, ancoraggi, ripetizioni: RIPETIZIONI, parametri: m.parametri, log, notte: () => 1, tipiSenzaAttesa: [], testi: TESTI.incontri });
  const d = incontri.interagisci('hub:tonino');
  assert.equal(d.cartigli.length, 2);
  assert.deepEqual(d.cartigli.map((c) => c.nome), ['Tonino', 'Tonino']);
  assert.deepEqual(d.cartigli.map((c) => [c.parte, c.parti]), [[0, 2], [1, 2]]);
  assert.equal(d.cartigli.map((c) => c.testo).join(' '), testo);
  assert.ok(d.cartigli.every((c) => c.testo.length <= 120));
  assert.deepEqual(log.voci, []);
});

test('U03: nessuna ripetizione vera → errore di contenuto e didascalia generica con il nome dell\'NPC', async () => {
  const m = await creaMondo({ ripetizioni: { npc_per_ancoraggio: { banchetto: 'tonino' }, npc: { tonino: [{ quando: { tonino_ricordo: 'negato' }, chi: 'tonino', testo: 'x' }] } } });
  const b = m.incontri.ripetizione('tonino');
  assert.equal(b.generica, true);
  assert.equal(b.didascalia, true);
  assert.equal(b.testo, TESTI.incontri.ripetizione_generica.replace('{nome}', 'Tonino'));
  assert.equal(m.log.voci.length, 1);
});


// ---------------------------------------------------------------------------------------------
// storia 029: l'hub di Piazza Dante
// ---------------------------------------------------------------------------------------------

/** Ferruccio finto per l'hub: solo corpo (x, y, r), `tick` contato e `posiziona`. */
function ferruccioFinto(r) {
  const f = { x: 0, y: 0, r, ticks: 0, tick() { f.ticks += 1; }, posiziona(nx, ny) { f.x = nx; f.y = ny; } };
  return f;
}

/** Mondo di prova con l'hub: stato reale, incontri, campo condiviso, Ferruccio finto, hub e cartellino DOM. */
async function creaMondoHub({ modello = MODELLO_HUB } = {}) {
  const log = logFinto();
  const parametri = await parametriReali(log, ['incontri', 'stanza', 'ferruccio']);
  const eventi = creaBus({ log });
  const ricevuti = [];
  for (const n of ['hub.entrata', 'hub.partenza', 'hub.interazione', 'incontri.avvio', 'incontri.fine', 'incontri.rifiutato']) {
    eventi.on(n, (p) => ricevuti.push({ nome: n, ...p }));
  }
  const salvataggio = creaSalvataggio({ memoria: memoriaInRam(), log, ora: () => 0 });
  const stato = creaStato({ storia: STORIA, regole: REGOLE, ancoraggi: ANCORAGGI, eventi, salvataggio, slot: 1, log });
  const incontri = creaIncontri({
    stato, storia: STORIA, ancoraggi: ANCORAGGI, ripetizioni: RIPETIZIONI, parametri, eventi, log, testi: TESTI.incontri,
    notte: () => stato.avanzamento()[REGOLE.piani.campo_notte], tipiSenzaAttesa: REGOLE.tipi_senza_attesa,
  });
  const input = creaInput(parametri.get('input'));
  const campo = creaCampo({ colonne: parametri.get('stanza.colonne'), righe: parametri.get('stanza.righe'), cella: parametri.get('stanza.cella'), scenaLarghezza: SCENA.larghezza, scenaAltezza: SCENA.altezza });
  const ferruccio = ferruccioFinto(parametri.get('ferruccio.r_corpo'));
  const hub = creaHub({ modello, parametri, eventi, campo, scena: SCENA, ferruccio, input, narrativa: stato, incontri, semeProfilo: SEME_PROFILO, campoNotte: REGOLE.piani.campo_notte, log });
  const documento = documentoFinto();
  const contenitore = documento.createElement('div');
  const cartellino = creaInterfacciaHub({
    documento, contenitore, testi: TESTI, hub: () => hub, ferruccio,
    nomeDi: (id) => STORIA.personaggi[id]?.nome ?? id, tastoInteragisci: () => parametri.get('input.tastiera.interagisci')[0],
  });
  const tasto = (azione) => `t:${parametri.get(`input.tastiera.${azione}`)[0]}`;
  const tick = (n = 1) => { for (let i = 0; i < n; i++) { input.inizioTick(); hub.tick(PASSO_S); cartellino.aggiorna(); } };
  const premi = (azione, n = 1) => { input.sorgenteGiu(tasto(azione)); tick(n); input.sorgenteSu(tasto(azione)); };
  const presenza = (id) => hub.presenze().find((p) => p.id === id);
  return { log, parametri, eventi, ricevuti, stato, incontri, input, campo, ferruccio, hub, cartellino, tick, premi, presenza };
}

test('H01: il modello dell\'hub è valido: Tonino al banchetto, porta della bottega chiusa finché fucina_aperta è falso, finestra di Mariella accesa (mai un personaggio), luna e fili d\'oro, l\'ingresso al piano 1 è l\'unica apertura delle mura', async () => {
  const m = await creaMondoHub();
  assert.deepEqual(validaModelloHub(MODELLO_HUB, { colonne: m.parametri.get('stanza.colonne'), righe: m.parametri.get('stanza.righe') }), []);
  assert.deepEqual(m.hub.errori(), []);
  assert.equal(m.hub.tipo, TIPO_HUB);
  m.hub.entra();
  // Tonino: npc sempre presente, ancoraggio hub:tonino, accanto a un banco (B) della griglia
  const tonino = m.presenza('tonino');
  assert.equal(tonino.tipo, 'npc');
  assert.equal(tonino.presente, true);
  assert.equal(tonino.ancoraggio, 'hub:tonino');
  const banchi = m.hub.ostacoli.filter((o) => o.id === 'banco');
  assert.ok(banchi.length > 0, 'un banco nella griglia');
  assert.ok(banchi.some((b) => Math.hypot(b.x + b.w / 2 - tonino.x, b.y + b.h / 2 - tonino.y) <= m.hub.cella * 1.5), 'Tonino sta al banchetto');
  // bottega: porta chiusa; aperta solo con fucina_aperta
  assert.equal(m.presenza('bottega').tipo, 'porta');
  assert.equal(m.presenza('bottega').stato, STATI_PORTA_HUB.chiusa);
  m.stato.segnaAvanzamento('fucina_aperta', true);
  assert.equal(m.presenza('bottega').stato, STATI_PORTA_HUB.aperta);
  m.stato.segnaAvanzamento('fucina_aperta', false);
  // Mariella: una finestra accesa, sempre presente, mai un npc
  const mariella = m.presenza('mariella');
  assert.equal(mariella.tipo, 'finestra');
  assert.equal(mariella.accesa, true);
  assert.equal(mariella.presente, true);
  assert.ok(!m.hub.presenze().some((p) => p.tipo === 'npc' && p.personaggio === 'mariella'));
  // luna immobile e fili d'oro
  assert.equal(m.presenza('luna').forma, 'luna');
  assert.ok(m.hub.presenze().filter((p) => p.forma === 'filo_oro' && p.fino_a).length >= 1);
  // ingresso al piano 1: unica apertura, passabile, segnata nel campo condiviso
  assert.equal(m.hub.piano, 1);
  assert.equal(m.hub.ingresso.slot, MODELLO_HUB.ingresso.slot);
  const ingressi = m.campo.solidi.filter((s) => s.id === ID_INGRESSO);
  assert.equal(ingressi.length, 1);
  assert.equal(ingressi[0].ferma_passo, false);
  const mura = m.campo.solidi.filter((s) => s.id === 'muro');
  assert.equal(mura.length, 5, 'quattro lati, uno spezzato dall\'ingresso');
  assert.ok(!m.campo.solidi.some((s) => s.id === 'porta'), 'nessuna porta di stanza');
  assert.deepEqual(m.log.voci, []);
});

test('H02: presenze per stato: Taddeo compare solo se perdonato, Agnese sotto il portico solo se risvegliata; senza flag nessuno dei due', async () => {
  const m = await creaMondoHub();
  m.hub.entra();
  assert.equal(m.presenza('taddeo').presente, false);
  assert.equal(m.presenza('agnese').presente, false);
  assert.equal(m.stato.imposta('taddeo', 'perdonato').ok, true);
  assert.equal(m.presenza('taddeo').presente, true);
  assert.equal(m.presenza('taddeo').ancoraggio, 'hub:taddeo');
  assert.equal(m.stato.imposta('taddeo', 'accusato').ok, true);
  assert.equal(m.presenza('taddeo').presente, false);
  assert.equal(m.stato.imposta('agnese', 'risvegliata').ok, true);
  assert.equal(m.presenza('agnese').presente, true);
  assert.equal(m.presenza('agnese').etichetta, 'portico');
  assert.equal(m.stato.imposta('agnese', 'sognante').ok, true);
  assert.equal(m.presenza('agnese').presente, false);
  // Mariella resta una finestra qualunque sia lo stato
  assert.equal(m.presenza('mariella').presente, true);
  assert.deepEqual(m.log.voci, []);
});

test('H03: entrare nell\'hub alla notte 1 fa partire le scene automatiche; attraversare l\'ingresso emette hub.partenza UNA volta con il seme derivato dal profilo e dalla notte, e `notte` non cambia', async () => {
  const m = await creaMondoHub();
  const d = m.hub.entra();
  assert.equal(m.hub.attivo, true);
  const arrivo = m.hub.centroCella(MODELLO_HUB.arrivo.c, MODELLO_HUB.arrivo.r);
  assert.deepEqual([m.ferruccio.x, m.ferruccio.y], [arrivo.x, arrivo.y]);
  assert.equal(m.ricevuti[0].nome, 'hub.entrata');
  assert.equal(m.ricevuti[0].notte, 1);
  assert.ok(d, 'la targa parte da sola alla notte 1');
  assert.equal(d.id, 'piazza-dante.targa-commemorativa');
  assert.ok(m.stato.avanzamento().scene_viste.includes('piazza-dante.risveglio'));
  assert.equal(d.avanza(), true);
  // il seme della notte è derivato dal profilo e dalla notte: deterministico e diverso dal seme del profilo
  const attesoN1 = semeNotte(SEME_PROFILO, 1);
  assert.equal(m.hub.semeNotte(), attesoN1);
  assert.notEqual(attesoN1, SEME_PROFILO);
  assert.notEqual(semeNotte(SEME_PROFILO, 2), attesoN1);
  assert.equal(semeNotte(SEME_PROFILO, 1), attesoN1, 'stesso profilo, stessa notte → stesso seme');
  // lontano dall'ingresso nessuna partenza; sulla cella dell'ingresso una sola
  m.tick(3);
  assert.equal(m.ricevuti.filter((e) => e.nome === 'hub.partenza').length, 0);
  const i = m.hub.ingresso;
  m.ferruccio.posiziona(i.x + i.w / 2, i.y + i.h / 2);
  m.tick(5);
  const partenze = m.ricevuti.filter((e) => e.nome === 'hub.partenza');
  assert.equal(partenze.length, 1);
  assert.equal(partenze[0].piano, 1);
  assert.equal(partenze[0].seme, attesoN1);
  assert.equal(partenze[0].notte, 1);
  assert.equal(m.hub.partito, true);
  assert.equal(m.stato.avanzamento()[REGOLE.piani.campo_notte], 1, 'la notte non cambia finché non si muore');
  // la notte dopo (storia 030: nuovaNotte alla morte) l'hub dà un altro seme
  m.hub.esci();
  m.stato.nuovaNotte();
  m.hub.entra();
  assert.equal(m.hub.partito, false);
  assert.equal(m.hub.semeNotte(), semeNotte(SEME_PROFILO, 2));
  assert.notEqual(m.hub.semeNotte(), attesoN1);
  assert.equal(m.hub.entra(), null, 'alla notte 2 nessuna scena automatica');
  assert.deepEqual(m.log.voci, []);
});

test('H04: interagisci vicino a Tonino (notte 1, dopo le automatiche) apre il primo incontro; lontano no; Ferruccio sta fermo durante il dialogo; un NPC assente non risponde', async () => {
  const m = await creaMondoHub();
  m.hub.entra().avanza();
  assert.equal(m.incontri.dialogo(), null);
  // lontano: nessun dialogo e nessun evento di interazione
  m.premi('interagisci', 1);
  assert.equal(m.incontri.dialogo(), null);
  assert.equal(m.hub.vicino(), null);
  // vicino a Tonino, entro r_interazione
  const tonino = m.presenza('tonino');
  const r = m.parametri.get('incontri.r_interazione');
  m.ferruccio.posiziona(tonino.x + r * 0.9, tonino.y);
  assert.equal(m.hub.vicino()?.id, 'tonino');
  const ticksPrima = m.ferruccio.ticks;
  m.premi('interagisci', 1);
  const d = m.incontri.dialogo();
  assert.ok(d, 'dialogo aperto');
  assert.equal(d.id, 'piazza-dante.tonino-primo-incontro');
  assert.equal(m.ricevuti.filter((e) => e.nome === 'hub.interazione').length, 1);
  assert.equal(m.ferruccio.ticks, ticksPrima + 1, 'il tick che apre il dialogo fa ancora camminare');
  m.tick(5);
  assert.equal(m.ferruccio.ticks, ticksPrima + 1, 'a dialogo aperto Ferruccio è fermo');
  m.premi('interagisci', 1);
  assert.equal(m.ricevuti.filter((e) => e.nome === 'hub.interazione').length, 1, 'a dialogo aperto interagisci non riapre');
  m.incontri.abbandona();
  m.tick(2);
  assert.equal(m.ferruccio.ticks, ticksPrima + 3);
  // Taddeo assente: la sua cella non risponde
  const taddeo = m.presenza('taddeo');
  m.ferruccio.posiziona(taddeo.x, taddeo.y);
  assert.equal(m.hub.vicino(), null);
  m.premi('interagisci', 1);
  assert.equal(m.incontri.dialogo(), null);
  assert.deepEqual(m.log.voci, []);
});

test('H05: cartellino DOM dell\'hub: nascosto fuori dall\'hub, notte 1 dentro, suggerimento con il nome di Tonino vicino a lui e della partenza davanti all\'ingresso', async () => {
  const m = await creaMondoHub();
  m.cartellino.aggiorna();
  assert.equal(m.cartellino.stato(), null);
  m.hub.entra().avanza();
  m.tick(1);
  const s0 = m.cartellino.stato();
  assert.equal(s0.notte, TESTI.hub.notte.replace('{n}', '1'));
  assert.equal(s0.suggerimento, '');
  const tonino = m.presenza('tonino');
  m.ferruccio.posiziona(tonino.x + m.ferruccio.r, tonino.y);
  m.tick(1);
  const tasto = m.parametri.get('input.tastiera.interagisci')[0];
  assert.equal(m.cartellino.stato().suggerimento, TESTI.hub.parla.replace('{tasto}', tasto).replace('{nome}', 'Tonino'));
  const i = m.hub.ingresso;
  m.ferruccio.posiziona(i.x - m.ferruccio.r, i.y + i.h / 2);
  m.tick(1);
  assert.equal(m.cartellino.stato().suggerimento, TESTI.hub.parti.replace('{piano}', '1'));
  m.hub.esci();
  m.tick(1);
  assert.equal(m.cartellino.stato(), null);
});

test('R02: nei moduli dell\'hub nessun Math.random, nessuna virgoletta « », nessun numero di gioco; i testi del cartellino sono in interfaccia.json', () => {
  for (const f of ['motore/mondo/hub.js', 'motore/interfaccia/hub.js']) {
    const testo = readFileSync(join(RADICE, f), 'utf8');
    assert.ok(!/Math\.random/.test(testo), `${f}: Math.random`);
    assert.ok(!/[«»]/.test(testo), `${f}: virgolette di gioco`);
    const codice = testo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.ok(!/\b(13|7|64|56|1845)\b/.test(codice), `${f}: numero di gioco nel codice`);
  }
  for (const k of ['notte', 'parla', 'parti']) assert.equal(typeof TESTI.hub[k], 'string', k);
});

// ---------------------------------------------------------------------------------------------
// regole del codice
// ---------------------------------------------------------------------------------------------

test('R01: nei moduli nuovi nessun Math.random, nessuna virgoletta « », nessun numero di gioco (i tempi vengono da incontri.json)', () => {
  for (const f of ['motore/storia/incontri.js', 'motore/ui/cartiglio.js', 'motore/ui/tableau.js']) {
    const testo = readFileSync(join(RADICE, f), 'utf8');
    assert.ok(!/Math\.random/.test(testo), `${f}: Math.random`);
    assert.ok(!/[«»]/.test(testo), `${f}: virgolette di gioco`);
    const codice = testo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.ok(!/\b(120|160|3000|1500|56)\b/.test(codice), `${f}: numero di gioco nel codice`);
  }
  const incontri = leggi('contenuti/parametri/incontri.json');
  for (const k of ['max_nuove_per_notte', 'max_caratteri_battuta', 'antirimbalzo', 'r_interazione']) assert.ok(incontri[k]?.base !== undefined, k);
  assert.equal(incontri.max_caratteri_battuta.base, 120);
});
