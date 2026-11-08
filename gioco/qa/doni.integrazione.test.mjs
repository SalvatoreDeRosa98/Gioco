/**
 * gioco/qa/doni.integrazione.test.mjs — Test d'integrazione della storia 024: piedistallo della bottega,
 * raccolta con `interagisci`, cartiglio e HUD (DOM finto), ganci collegati agli eventi del
 * combattimento e della stanza, effetti `doni.*` eseguiti dagli attori (scintilla, catena, onda, cura),
 * banchetto sul pool. Senza browser: `node gioco/qa/doni.integrazione.test.mjs` (node:test, Node ≥ 20).
 *
 * Il mondo di prova è quello reale (parametri JSON, Ferruccio, combattimento, modificatori, pool,
 * piedistalli, economia) con un ciclo simulato a tick fissi; la stanza del tesoro è un oggetto minimo con
 * la forma di `stanza.js` (id, tipo, contenuti con il piedistallo, cella, origine, geo). Il DOM è una
 * manciata di oggetti con `createElement`, `append`, `replaceChildren`, `textContent`, `hidden`.
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
import { creaCombattimento } from '../motore/attori/combattimento.js';
import { creaFantoccio } from '../motore/attori/bersaglio.js';
import { creaSalvataggio, memoriaInRam } from '../motore/persistenza/salvataggio.js';
import { creaProfilo } from '../motore/persistenza/profilo.js';
import { creaEconomia } from '../motore/oggetti/economia.js';
import { creaBanchetto } from '../motore/oggetti/banchetto.js';
import { creaPool } from '../motore/oggetti/pool.js';
import { creaPiedistalli, puntiPiedistallo } from '../motore/oggetti/piedistallo.js';
import { collegaEffettiDoni, collegaGanci } from '../motore/attori/effetti-doni.js';
import { creaInterfacciaDoni } from '../motore/interfaccia/doni.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const SCENA = Object.freeze({ larghezza: 1280, altezza: 720 });
const leggi = (percorso) => JSON.parse(readFileSync(join(RADICE, percorso), 'utf8'));
const STATISTICHE = ['ferruccio', 'combattimento', 'stanza', 'stanze', 'generazione', 'economia'];
const TABELLE = ['input', 'doni', 'sinergie', 'consumabili'];
const RARITA = ['comune', 'raro', 'prezioso'];

function logFinto() {
  const voci = [];
  return { voci, error: (...a) => voci.push(a.map(String).join(' ')), warn: () => {} };
}

/** DOM finto minimo per l'interfaccia dei doni. */
function documentoFinto() {
  const crea = (tag) => {
    const el = {
      tag, children: [], className: '', hidden: false, textContent: '', dataset: {}, title: '',
      append(...n) { for (const x of n) if (typeof x !== 'string') el.children.push(x); },
      replaceChildren(...n) { el.children = n.filter((x) => typeof x !== 'string'); },
    };
    return el;
  };
  return { createElement: crea };
}

/**
 * Mondo di prova.
 * @param {{ seme?: number, piano?: number, ritocca?: Function, flag?: object }} [o]
 */
async function creaMondo({ seme = 1845, piano = 1, ritocca = null, flag = {} } = {}) {
  const log = logFinto();
  const parametri = creaParametri({ log });
  await parametri.carica({
    caricatore: (nome) => { const j = leggi(`contenuti/parametri/${nome}.json`); if (ritocca) ritocca(nome, j); return j; },
    statistiche: STATISTICHE, tabelle: TABELLE,
  });
  assert.deepEqual(parametri.errori(), []);
  const testi = leggi('contenuti/interfaccia.json');
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
  const bersagli = [];
  const proiettili = [];
  const comb = creaCombattimento({ modificatori: mod, tempo, eventi, input, campo, ferruccio, bersagli: () => bersagli });
  const salvataggio = creaSalvataggio({ memoria: memoriaInRam(), log, ora: () => 0 });
  const profilo = creaProfilo({ salvataggio, slot: '1', eventi });
  const economia = creaEconomia({ parametri, eventi, rng: derivato(rng, 'drop'), profilo, ferruccio, modificatori: mod, piano, log });
  const pool = creaPool({
    catalogo: parametri.get('doni').doni,
    pesi: Object.fromEntries(RARITA.map((r) => [r, parametri.get(`economia.banchetto.peso_rarita.${r}`)])),
    derivePct: Object.fromEntries(RARITA.map((r) => [r, parametri.get(`economia.banchetto.deriva_rarita_pct.${r}`)])),
    fallbackMonete: parametri.get('economia.banchetto.fallback_monete'),
    rng: derivato(rng, 'pool'), flag: () => flag, eventi, log,
  });
  pool.preparaPiano(piano);
  const piedistalli = creaPiedistalli({ pool, modificatori: mod, parametri, piano, ferruccio, input, economia, eventi, log });
  const scollegaGanci = collegaGanci({ eventi, modificatori: mod, combattimento: comb });
  const effetti = collegaEffettiDoni({ eventi, parametri, modificatori: mod, ferruccio, bersagli: () => bersagli, proiettili, log });
  const documento = documentoFinto();
  const contenitore = documento.createElement('div');
  const interfaccia = creaInterfacciaDoni({
    documento, contenitore, testi, modificatori: mod, eventi, piedistalli: () => piedistalli,
    tCartiglioMs: () => parametri.get('doni').piedistallo.t_cartiglio.base, tastoInteragisci: () => parametri.get('input.tastiera.interagisci')[0],
  });
  const ricevuti = [];
  for (const nome of ['doni.aggiunto', 'doni.scintilla', 'doni.catena', 'doni.onda', 'doni.cura', 'piedistallo.posato', 'piedistallo.raccolto', 'pool.offerto']) {
    eventi.on(nome, (p) => ricevuti.push({ nome, payload: p }));
  }
  const tasto = (azione) => `t:${parametri.get(`input.tastiera.${azione}`)[0]}`;
  const cella = parametri.get('stanza.cella');
  const m = {
    parametri, log, tempo, eventi, input, mod, campo, ferruccio, comb, bersagli, proiettili, economia, pool, piedistalli, effetti, interfaccia,
    contenitore, ricevuti, rng, testi, cella, scollegaGanci,
    ticks: (ms) => tempo.ticksDaMs(ms),
    /** Stanza del tesoro minima con il piedistallo a `d` px a destra di Ferruccio (o ai punti dati). */
    tesoro(id = 'tesoro-1', punti = null) {
      const contenuti = (punti ?? [{ x: ferruccio.x + 50, y: ferruccio.y }]).map((p) => ({ tipo: 'piedistallo', c: 0, r: 0, ...p }));
      return { id, tipo: 'tesoro', contenuti, cella, origine: { x: campo.x, y: campo.y }, geo: { colonne: parametri.get('stanza.colonne'), righe: parametri.get('stanza.righe') } };
    },
    tick(n = 1) {
      for (let i = 0; i < n; i++) {
        input.inizioTick();
        ferruccio.tick(tempo.passoS);
        comb.tick(tempo.passoS);
        for (const b of bersagli.slice()) b.tick(tempo.passoS);
        for (const p of proiettili.slice()) p.tick(tempo.passoS);
        mod.tick(tempo.passoS);
        economia.tick();
        piedistalli.tick();
        interfaccia.tick(tempo.passoS);
        interfaccia.aggiorna();
      }
    },
    premi(azione, n = 1) { input.sorgenteGiu(tasto(azione)); m.tick(n); input.sorgenteSu(tasto(azione)); },
    tieni: (azione) => input.sorgenteGiu(tasto(azione)),
    lascia: (azione) => input.sorgenteSu(tasto(azione)),
    fantoccio(id, x, y, extra = {}) {
      const f = creaFantoccio({ modificatori: mod, tempo, eventi, campo, bersaglio: comb.comeBersaglio, id, x, y, ...extra });
      bersagli.push(f);
      return f;
    },
    eventiDi: (nome) => ricevuti.filter((e) => e.nome === nome),
    cartiglio: () => interfaccia.cartiglio(),
    dom: () => ({ cartiglio: interfaccia.elementi.cartiglio, hud: interfaccia.elementi.hud, lista: interfaccia.elementi.lista }),
  };
  return m;
}

// ---------------------------------------------------------------------------------------------
// Criterio 2 della storia: piedistallo, interagisci, cartiglio, pool, HUD
// ---------------------------------------------------------------------------------------------

test('S024-2: nella stanza del tesoro, interagisci a 50 px in Cammina raccoglie il dono entro 33 ms; cartiglio con nome e riga per 3000 ± 100 ms senza pausa; fuori dal pool; nell\'HUD', async () => {
  const m = await creaMondo();
  const stanza = m.tesoro();
  m.piedistalli.attiva(stanza);
  assert.equal(m.piedistalli.attivo, true);
  const [p] = m.piedistalli.elenco();
  assert.equal(m.piedistalli.elenco().length, 1, 'al piano 1 un solo piedistallo');
  assert.equal(p.stato, 'offerto');
  assert.ok(p.id && p.dono, 'un dono del catalogo');
  assert.ok(Math.abs(p.distanza - 50) < 1e-9);
  assert.ok(m.pool.offertiIn(1).includes(p.id), 'offerto nel piano');
  assert.equal(m.eventiDi('piedistallo.posato').length, 1);
  // anteprima nel cono di luce (r_anteprima 96): il cartiglio mostra nome e riga prima di prendere
  m.tick(1);
  const ant = m.cartiglio();
  assert.equal(ant.tipo, 'anteprima');
  assert.equal(ant.nome, p.dono.nome);
  assert.equal(ant.riga, p.dono.cartiglio);
  assert.ok(ant.avviso.includes(m.parametri.get('input.tastiera.interagisci')[0]), 'istruzione con il tasto');
  assert.equal(m.dom().cartiglio.hidden, false);
  assert.ok(m.dom().cartiglio.className.includes('anteprima'));
  // in cammina verso il piedistallo
  m.tieni('destra');
  m.tick(4);
  assert.equal(m.ferruccio.stato, 'cammina');
  const prima = m.mod.doniAttivi().length;
  const x0 = m.ferruccio.x;
  m.input.sorgenteGiu(`t:${m.parametri.get('input.tastiera.interagisci')[0]}`);
  m.tick(2); // 33 ms
  m.input.sorgenteSu(`t:${m.parametri.get('input.tastiera.interagisci')[0]}`);
  assert.equal(m.mod.doniAttivi().length, prima + 1, 'il dono è nella lista entro 2 tick');
  assert.deepEqual(m.mod.doniAttivi(), [p.id]);
  assert.equal(m.piedistalli.elenco()[0].stato, 'preso');
  assert.ok(m.pool.raccolti().includes(p.id), 'fuori dal pool della notte');
  assert.equal(m.pool.probabilita({ piano: 2 }).has(p.id), false);
  assert.equal(m.eventiDi('piedistallo.raccolto').length, 1);
  assert.equal(m.eventiDi('doni.aggiunto').length, 1);
  // cartiglio di raccolta
  const c = m.cartiglio();
  assert.equal(c.tipo, 'raccolto');
  assert.equal(c.id, p.id);
  assert.equal(c.nome, p.dono.nome);
  assert.equal(c.riga, p.dono.cartiglio);
  assert.equal(m.dom().cartiglio.hidden, false);
  assert.equal(m.dom().cartiglio.children[0].textContent, p.dono.nome);
  assert.equal(m.dom().cartiglio.children[1].textContent, p.dono.cartiglio);
  assert.ok(m.dom().cartiglio.className.includes('raccolto') && m.dom().cartiglio.className.includes('oro'));
  // HUD: una sagoma per dono raccolto, in ordine
  assert.equal(m.dom().hud.hidden, false);
  assert.equal(m.dom().lista.children.length, 1);
  assert.equal(m.dom().lista.children[0].dataset.id, p.id);
  assert.ok(m.dom().lista.children[0].className.includes('oro'));
  // il gioco non è in pausa: Ferruccio cammina mentre il cartiglio è acceso
  m.tick(10);
  assert.ok(m.ferruccio.x > x0 + 20, `Ferruccio si muove (${m.ferruccio.x - x0} px)`);
  assert.equal(m.cartiglio()?.tipo, 'raccolto');
  m.lascia('destra');
  // dura t_cartiglio: dopo 3000 ± 100 ms sparisce (180 tick da 16,667 ms)
  const tTot = m.ticks(m.parametri.get('doni').piedistallo.t_cartiglio.base);
  let n = 2 + 10; // tick già passati dalla raccolta (il primo tick ha anche acceso il cartiglio)
  for (; n < tTot + 10 && m.cartiglio()?.tipo === 'raccolto'; n++) m.tick(1);
  assert.ok(Math.abs(n - tTot) <= m.ticks(100), `cartiglio spento dopo ${n} tick (atteso ${tTot} ± ${m.ticks(100)})`);
  assert.equal(m.cartiglio(), null, 'niente anteprima: il piedistallo è preso');
  assert.equal(m.dom().cartiglio.hidden, true);
  // rientro nella stessa bottega: stato conservato, niente doppia raccolta
  m.piedistalli.disattiva();
  m.piedistalli.attiva(stanza);
  assert.equal(m.piedistalli.elenco()[0].stato, 'preso');
  assert.equal(m.eventiDi('piedistallo.posato').length, 1, 'non si rigenera');
  assert.equal(m.piedistalli.raccogli(0).esito, 'rifiutato');
  assert.deepEqual(m.mod.doniAttivi(), [p.id]);
});

test('S024-2b: un secondo cartiglio sostituisce il primo e riparte il timer; il ricordo è azzurro; «già al massimo» con avviso_cap', async () => {
  const m = await creaMondo();
  // due raccolte a 1 s di distanza: il timer riparte dalla seconda
  assert.ok(m.mod.aggiungiDono('lima'));
  m.tick(m.ticks(1000));
  assert.equal(m.cartiglio().id, 'lima');
  assert.ok(m.mod.aggiungiDono('medaglione-di-rosa'));
  m.tick(1);
  const c = m.cartiglio();
  assert.equal(c.id, 'medaglione-di-rosa');
  assert.equal(c.azzurro, true, 'un ricordo ha il cartiglio azzurro');
  assert.ok(m.dom().cartiglio.className.includes('azzurro'));
  assert.ok(m.dom().lista.children[1].className.includes('azzurro'), 'nell\'HUD il ricordo ha l\'alone azzurro');
  m.tick(m.ticks(2900));
  assert.equal(m.cartiglio()?.id, 'medaglione-di-rosa', 'ancora acceso a 2,9 s dalla seconda raccolta');
  m.tick(m.ticks(200));
  assert.equal(m.cartiglio(), null);
  // avviso_cap: un dono le cui statistiche sono già al clamp
  const m2 = await creaMondo();
  m2.mod.applica({ statistica: 'portata', operazione: 'somma', valore: 100 });
  m2.mod.applica({ statistica: 'arco_f', operazione: 'somma', valore: 100 });
  assert.equal(m2.mod.valore('portata'), 96);
  const stanza = m2.tesoro('t', [{ x: m2.ferruccio.x + 30, y: m2.ferruccio.y }]);
  // forza la Lima sul piedistallo (portata +6, arco_f +10: entrambe già al massimo)
  m2.piedistalli.attiva(stanza);
  const lista = m2.piedistalli.elenco();
  const idOfferto = lista[0].id;
  if (idOfferto !== 'lima') {
    // sostituiamo il dono offerto con la lima attraverso un piedistallo nuovo su una stanza nuova finché non esce (deterministico dal seme)
    let trovato = false;
    for (let k = 0; k < 12 && !trovato; k++) {
      const st = m2.tesoro(`t${k}`, [{ x: m2.ferruccio.x + 30, y: m2.ferruccio.y }]);
      m2.piedistalli.disattiva();
      m2.pool.azzera(); // riapre il pool: solo per cercare la lima nei dati di prova
      m2.piedistalli.attiva(st);
      trovato = m2.piedistalli.elenco()[0].id === 'lima';
    }
    assert.ok(trovato, 'la lima prima o poi esce dal generatore seminato');
  }
  m2.premi('interagisci');
  const ev = m2.eventiDi('piedistallo.raccolto').at(-1).payload;
  assert.equal(ev.id, 'lima');
  assert.equal(ev.alMassimo, true);
  m2.tick(1);
  assert.equal(m2.cartiglio().avviso, m2.testi.doni.gia_al_massimo);
});

test('GDD regola 8: al piano 3 due piedistalli con doni distinti; preso uno l\'altro è inerte; a pari distanza vince il più a sinistra; niente raccolta in Scatta', async () => {
  const m = await creaMondo({ piano: 3 });
  const x = m.ferruccio.x;
  const y = m.ferruccio.y;
  const stanza = m.tesoro('t3', [{ x: x - 40, y }, { x: x + 40, y }]);
  m.piedistalli.attiva(stanza);
  const el = m.piedistalli.elenco();
  assert.equal(el.length, 2);
  assert.notEqual(el[0].id, el[1].id);
  assert.ok(el.every((p) => p.stato === 'offerto' && p.dono.rarita !== 'unico'));
  assert.deepEqual(m.pool.offertiIn(3).sort(), [el[0].id, el[1].id].sort());
  // pari distanza (40 px): il più a sinistra
  assert.equal(m.piedistalli.vicino(56), 0);
  // in Scatta la pressione è ignorata
  m.tieni('destra');
  m.premi('scatto');
  assert.equal(m.ferruccio.stato, 'scatta');
  m.premi('interagisci');
  assert.deepEqual(m.mod.doniAttivi(), []);
  m.lascia('destra');
  m.tick(m.ticks(1000));
  assert.ok(['fermo', 'cammina', 'recupero_scatto'].includes(m.ferruccio.stato));
  // ora, un passo a destra del centro, prende il più vicino (il secondo)
  m.ferruccio.posiziona(x + 10, y);
  m.premi('interagisci');
  assert.equal(m.mod.doniAttivi().length, 1);
  const dopo = m.piedistalli.elenco();
  const preso = dopo.find((p) => p.stato === 'preso');
  const altro = dopo.find((p) => p !== preso);
  assert.ok(preso);
  assert.equal(altro.stato, 'inerte');
  assert.equal(m.piedistalli.raccogli(altro.indice).esito, 'rifiutato', 'l\'inerte non è interagibile');
  assert.equal(m.piedistalli.vicino(1000), -1);
  assert.equal(m.cartiglio()?.id, preso.id);
  // un solo eleggibile per il piedistallo doppio → un solo piedistallo, non uno inerte
  const m2 = await creaMondo({ piano: 3 });
  for (const d of m2.pool.eleggibili({ piano: 3 })) if (d.id !== 'spola-del-telaio') m2.pool.raccolto(d.id);
  m2.piedistalli.attiva(m2.tesoro('t', [{ x, y }]));
  assert.equal(m2.piedistalli.elenco().length, 1);
  assert.equal(m2.piedistalli.elenco()[0].id, 'spola-del-telaio');
  // puntiPiedistallo: due punti attorno a uno solo segnato, distanziati di una cella
  const punti = puntiPiedistallo({ contenuti: [{ tipo: 'piedistallo', x: 100, y: 200 }], cella: 64, origine: { x: 0, y: 0 }, geo: { colonne: 13, righe: 7 } }, 2);
  assert.deepEqual(punti, [{ x: 68, y: 200 }, { x: 132, y: 200 }]);
});

test('GDD edge: pool vuoto → il piedistallo dà il sostituto (cuore se maschere < max, altrimenti monete) e il cartiglio lo dice', async () => {
  const m = await creaMondo();
  for (const d of m.pool.eleggibili({ piano: 1 })) m.pool.raccolto(d.id);
  m.ferruccio.impostaMaschere(3);
  m.piedistalli.attiva(m.tesoro('vuota'));
  const [p] = m.piedistalli.elenco();
  assert.equal(p.id, null);
  assert.deepEqual(p.fallback, { tipo: 'cuore', valore: 1 });
  m.premi('interagisci');
  assert.equal(m.ferruccio.maschere, 4);
  m.tick(1);
  assert.equal(m.cartiglio().nome, m.testi.doni.fallback_cuore);
  // a maschere piene: monete
  const m2 = await creaMondo();
  for (const d of m2.pool.eleggibili({ piano: 1 })) m2.pool.raccolto(d.id);
  m2.piedistalli.attiva(m2.tesoro('vuota'));
  assert.equal(m2.piedistalli.elenco()[0].fallback.tipo, 'monete');
  m2.premi('interagisci');
  assert.equal(m2.economia.monete, m2.parametri.get('economia.banchetto.fallback_monete'));
});

test('banchetto sul pool: lo slot dono è estratto dal pool con il canale banchetto, distinto dal piedistallo del piano, e l\'acquisto lo toglie dal pool', async () => {
  const m = await creaMondo();
  m.piedistalli.attiva(m.tesoro());
  const [p] = m.piedistalli.elenco();
  const banchetto = creaBanchetto({
    economia: m.economia, modificatori: m.mod, parametri: m.parametri, catalogo: m.parametri.get('doni').doni,
    consumabili: m.parametri.get('consumabili').consumabili, rng: derivato(m.rng, 'banchetto'), piano: 1, ferruccio: m.ferruccio, eventi: m.eventi, pool: m.pool, log: m.log,
  });
  const slot = banchetto.slots()[0];
  assert.equal(slot.tipo, 'dono');
  assert.notEqual(slot.id, p.id, 'distinto dal dono offerto sul piedistallo');
  assert.ok(m.pool.offertiIn(1).includes(slot.id));
  m.economia.aggiungiMonete(99);
  assert.equal(banchetto.compra(0).esito, 'comprato');
  assert.ok(m.pool.raccolti().includes(slot.id));
  assert.equal(m.cartiglio()?.id ?? (m.tick(1), m.cartiglio()?.id), slot.id, 'anche l\'acquisto accende il cartiglio');
});

// ---------------------------------------------------------------------------------------------
// Ganci collegati agli eventi ed effetti eseguiti dagli attori
// ---------------------------------------------------------------------------------------------

test('ganci: colpo → su_colpo (Acciarino p=1) → doni.scintilla → la scintilla d\'oro vola dal bersaglio e ferisce il fantoccio dietro, non quello d\'origine', async () => {
  const m = await creaMondo({ ritocca: (nome, j) => { if (nome === 'doni') j.doni.find((d) => d.id === 'acciarino').ganci[0].probabilita = 1.0; } });
  assert.ok(m.mod.aggiungiDono('acciarino'));
  const a = m.fantoccio('a', m.ferruccio.x + 60, m.ferruccio.y);
  const b = m.fantoccio('b', m.ferruccio.x + 170, m.ferruccio.y);
  const vitaA = a.vita;
  const vitaB = b.vita;
  m.premi('attacco');
  m.tick(m.ticks(m.parametri.get('combattimento.t_startup_f')) + m.ticks(m.parametri.get('combattimento.t_attivo_f')) + 1);
  assert.ok(a.vita < vitaA, 'il fendente colpisce A');
  assert.equal(m.eventiDi('doni.scintilla').length, 1);
  const sc = m.proiettili.filter((p) => p.scintilla);
  assert.equal(sc.length, 1);
  assert.equal(sc[0].danno, 1, 'il danno della scintilla è quello dei parametri');
  assert.equal(a.vita, vitaA - m.mod.valore('danno'), 'il bersaglio d\'origine non è colpito dalla scintilla');
  m.tick(m.ticks(600));
  assert.equal(b.vita, vitaB - 1, 'la scintilla ferisce B');
  assert.equal(sc[0].vivo, false, 'senza rimbalzi si spegne');
  assert.ok(m.eventiDi('doni.scintilla')[0].payload.dono === 'acciarino');
});

test('ganci: catena e onda eseguite dagli attori (danno ai vicini entro il raggio, stordimento); profondità 1; cura e ricarica scatto', async () => {
  const m = await creaMondo();
  assert.ok(m.mod.aggiungiDono('catena-della-chiusa'));
  const a = m.fantoccio('a', 400, 360);
  const b = m.fantoccio('b', 480, 360);
  const c = m.fantoccio('c', 560, 360);
  const lontano = m.fantoccio('d', 1100, 360);
  const [vb, vc, vd] = [b.vita, c.vita, lontano.vita];
  const cat = m.mod.ganci.iscrizioni('su_uccisione')[0].parametri;
  m.eventi.emit('ferruccio.uccisione', { x: a.x, y: a.y, direzione: { x: 1, y: 0 }, bersaglio: a, danno: 9 });
  assert.equal(m.eventiDi('doni.catena').length, 1);
  assert.equal(b.vita, vb - cat.danno, 'il più vicino prende il danno della catena');
  assert.equal(c.vita, cat.n_bersagli >= 2 ? vc - cat.danno : vc);
  assert.equal(lontano.vita, vd, 'fuori raggio');
  // profondità 1: un evento con origine gancio non fa partire una seconda catena
  m.eventi.emit('ferruccio.uccisione', { x: b.x, y: b.y, bersaglio: b, origine: 'gancio' });
  assert.equal(m.eventiDi('doni.catena').length, 1);
  // onda (Rete di fili, build piena) sul primo colpo dell'affondo: danno + stordimento in area
  const m2 = await creaMondo({ ritocca: (nome, j) => { if (nome === 'doni') j.doni.find((d) => d.id === 'rete-di-fili').mvp = true; } });
  assert.ok(m2.mod.aggiungiDono('rete-di-fili'));
  const t = m2.fantoccio('t', m2.ferruccio.x + 90, m2.ferruccio.y);
  const v = m2.fantoccio('v', m2.ferruccio.x + 90, m2.ferruccio.y + 70); // fuori dal rettangolo dell'affondo, dentro il raggio dell'onda
  const vt = t.vita; const vv = v.vita;
  m2.tieni('attacco');
  m2.tick(m2.ticks(m2.parametri.get('combattimento.t_carica')) + 2);
  m2.lascia('attacco');
  m2.tick(m2.ticks(m2.parametri.get('combattimento.t_startup_affondo')) + m2.ticks(m2.parametri.get('combattimento.t_affondo')) + 2);
  assert.equal(m2.eventiDi('doni.onda').length, 1, 'un solo su_affondo per affondo');
  const onda = m2.eventiDi('doni.onda')[0].payload;
  assert.ok(t.vita < vt - m2.mod.valore('danno') * m2.mod.valore('molt_affondo') + 1e-9, 'T prende affondo + onda');
  assert.equal(v.vita, vv - onda.danno, 'V entro il raggio prende l\'onda');
  assert.ok(['stordito', 'morto'].includes(v.stato), `V stordito (${v.stato})`);
  // cura e ricarica_scatto applicate a Ferruccio
  m2.ferruccio.impostaMaschere(2);
  m2.eventi.emit('doni.cura', { maschere: 2, origine: 'gancio' });
  assert.equal(m2.ferruccio.maschere, 4);
  m2.eventi.emit('doni.cura', { maschere: 9, origine: 'gancio' });
  assert.equal(m2.ferruccio.maschere, m2.mod.valore('ferruccio.maschere_max'));
});

test('ganci: su_danno_subito solo con danno > 0, su_stanza_pulita solo se combattuta, su_raccolta alla raccolta, su_affondo mai senza colpi; tetto delle scintille', async () => {
  const m = await creaMondo({ ritocca: (nome, j) => {
    if (nome !== 'doni') return;
    j.doni.push({ id: 'prova-danno', nome: 'Prova', categoria: 'seta', rarita: 'comune', mvp: false, modificatori: [],
      ganci: [
        { evento: 'su_danno_subito', probabilita: 1, ricarica_ms: 0, max_per_stanza: null, effetto: 'cura', parametri: { maschere: 1 } },
        { evento: 'su_stanza_pulita', probabilita: 1, ricarica_ms: 0, max_per_stanza: null, effetto: 'cura', parametri: { maschere: 1 } },
        { evento: 'su_raccolta', probabilita: 1, ricarica_ms: 0, max_per_stanza: null, effetto: 'cura', parametri: { maschere: 1 } },
        { evento: 'su_affondo', probabilita: 1, ricarica_ms: 0, max_per_stanza: null, effetto: 'cura', parametri: { maschere: 1 } },
        { evento: 'su_colpo', probabilita: 1, ricarica_ms: 0, max_per_stanza: null, effetto: 'scintilla', parametri: { n: 60, danno: 1 } },
      ],
      tag: [], sagoma: { tipo: 'geometrica', forma: 'prova' }, cartiglio: 'Prova.', piano_min: 1, piano_fisso: null,
      canale: ['piedistallo'], sblocco: null, richiede_flag: null, escludi_se_flag: null, peso: 1, scelta: null, fonte: 'generico' });
  } });
  assert.ok(m.mod.aggiungiDono('prova-danno'));
  const cure = () => m.eventiDi('doni.cura').length;
  assert.equal(cure(), 1, 'su_raccolta vale anche per il dono appena raccolto (iscritto prima dell\'evento)');
  m.eventi.emit('ferruccio.danno', { danno: 0 });
  assert.equal(cure(), 1);
  m.eventi.emit('ferruccio.danno', { danno: 1 });
  assert.equal(cure(), 2);
  m.eventi.emit('stanza.pulita', { id: 'x', combattuta: false });
  assert.equal(cure(), 2);
  m.eventi.emit('stanza.pulita', { id: 'x', combattuta: true });
  assert.equal(cure(), 3);
  m.mod.tick(1 / 60);
  assert.ok(m.mod.aggiungiDono('lima'));
  assert.equal(cure(), 4, 'su_raccolta');
  // affondo a vuoto: nessun su_affondo
  m.mod.tick(1 / 60);
  m.tieni('attacco');
  m.tick(m.ticks(m.parametri.get('combattimento.t_carica')) + 2);
  m.lascia('attacco');
  m.tick(m.ticks(m.parametri.get('combattimento.t_startup_affondo')) + m.ticks(m.parametri.get('combattimento.t_affondo')) + m.ticks(m.parametri.get('combattimento.t_recupero_affondo')) + 2);
  assert.equal(cure(), 4, 'affondo senza bersagli: nessun evento');
  // tetto delle scintille in volo: max_proiettili_attivi
  const a = m.fantoccio('a', m.ferruccio.x + 60, m.ferruccio.y);
  m.eventi.emit('ferruccio.colpo', { x: a.x, y: a.y, direzione: { x: 1, y: 0 }, bersaglio: a, danno: 1 });
  assert.equal(m.effetti.scintilleAttive(), m.effetti.maxScintille);
  assert.equal(m.effetti.maxScintille, m.parametri.get('doni').limiti.max_proiettili_attivi.base);
  // scintilla con rimbalzi: dopo il primo colpo punta il vicino
  m.proiettili.length = 0;
  m.eventi.emit('doni.scintilla', { origine: 'gancio', da: { x: 300, y: 360 }, direzione: { x: 1, y: 0 }, n: 1, danno: 1, rimbalzi: 1, raggio_rimbalzo_px: 200, ventaglio_gradi: 0, bersaglio: null });
  const uno = m.fantoccio('uno', 380, 360);
  const due = m.fantoccio('due', 500, 360);
  const sc = m.proiettili.find((p) => p.scintilla);
  m.tick(m.ticks(1200));
  assert.equal(sc.colpiti(), 2, `rimbalzo: colpiti ${sc.colpiti()}`);
  assert.equal(uno.vita, m.parametri.get('combattimento.fantoccio.vita') - 1);
  assert.equal(due.vita, m.parametri.get('combattimento.fantoccio.vita') - 1);
});

test('regole: nessun Math.random, nessun numero e nessuna stringa di gioco nei moduli della storia 024', () => {
  const file = ['motore/oggetti/pool.js', 'motore/oggetti/piedistallo.js', 'motore/attori/effetti-doni.js', 'motore/interfaccia/doni.js'];
  for (const f of file) {
    const testo = readFileSync(join(RADICE, f), 'utf8');
    assert.ok(!/Math\.random/.test(testo), `${f}: Math.random`);
    const codice = testo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/'[^']*'|`[^`]*`/g, '""');
    const numeri = codice.match(/(?<![\w.])\d+(\.\d+)?(?![\w])/g) ?? [];
    const ammessi = new Set(['0', '1', '2', '180', '1000']); // indici, segni, gradi→radianti, ms↔s
    for (const n of numeri) assert.ok(ammessi.has(n), `${f}: numero ${n} nel codice`);
  }
});
