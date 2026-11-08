/**
 * gioco/qa/notte.test.mjs — Test della storia 030 (morte → risveglio, notte + 1, salvataggio della notte),
 * senza browser (node:test). Esecuzione: `node gioco/qa/notte.test.mjs` dalla radice.
 *
 * Moduli reali: parametri (`risveglio.json`, `ferruccio`, `combattimento`, `stanza`, `economia`, `incontri`, `doni`),
 * modificatori con il catalogo dei doni, Ferruccio vero (campo, input), economia e profilo su salvataggio in RAM,
 * stato narrativo e incontri reali (storia.json). La notte è finta (`{seme, piano, stanza}`): il piano vero è
 * della storia 016 e si prova nella pagina (`notte.wire.test.js`). Casi (uno per criterio Given-When-Then, più i
 * dettagli): M01 sequenza in quattro fasi nell'ordine, lanterne una a una, durata ≤ 5 s, risveglio → notte + 1 e
 * Ferruccio in piedi; M02 alla morte flag, scintille, piano_max e scene viste restano, monete e doni spariscono;
 * M03 i parametri valgono e la somma dei massimi non supera t_max; S01 la notte si salva a ogni `notte.stanza` e si
 * cancella alla morte; S02 «Continua» rigenera dal seme nella stanza salvata e ripristina maschere, doni e monete;
 * S03 la scena in corso alla chiusura non è in `scene_viste` (quella chiusa sì); D01 velo di morte e pannello
 * «Continua» in DOM finto; R01 regole del codice. Nomi di flag, scene e doni compaiono qui perché si verificano i dati reali.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { creaBus } from '../motore/fondazione/eventi.js';
import { creaInput } from '../motore/fondazione/input.js';
import { creaTempo } from '../motore/fondazione/tempo.js';
import { creaRng, derivato } from '../motore/fondazione/rng.js';
import { creaParametri } from '../motore/fondazione/parametri.js';
import { creaModificatori } from '../motore/oggetti/modificatori.js';
import { creaCampo } from '../motore/mondo/fisica.js';
import { creaFerruccio } from '../motore/attori/ferruccio.js';
import { creaSalvataggio, memoriaInRam } from '../motore/persistenza/salvataggio.js';
import { creaProfilo } from '../motore/persistenza/profilo.js';
import { creaEconomia } from '../motore/oggetti/economia.js';
import { crea as creaStato } from '../motore/storia/stato-narrativo.js';
import { creaIncontri } from '../motore/storia/incontri.js';
import { creaRisveglio, FASI_MORTE, INATTIVO } from '../motore/storia/risveglio.js';
import { creaNotteSalvata, normalizzaNotte, MOTIVI_CANCELLAZIONE } from '../motore/persistenza/notte-salvata.js';
import { creaInterfacciaMorte } from '../motore/interfaccia/morte.js';
import { creaInterfacciaRipresa } from '../motore/interfaccia/ripresa.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const leggi = (rel) => JSON.parse(readFileSync(join(RADICE, rel), 'utf8'));
const STORIA = leggi('contenuti/storia.json');
const REGOLE = leggi('contenuti/narrativa.json');
const ANCORAGGI = leggi('contenuti/ancoraggi.json');
const RIPETIZIONI = leggi('contenuti/ripetizioni.json');
const TESTI = leggi('contenuti/interfaccia.json');
const SCENA = { larghezza: 1280, altezza: 720 };
const SEME = 1845;
const SLOT = 1;
/** Limite del criterio: la sequenza di morte dura al più 5 s. */
const T_MAX_CRITERIO_MS = 5000;
const SCENA_TONINO = 'piazza-dante.tonino-primo-incontro';
const DONO = 'mantice';

function logFinto() {
  const voci = [];
  return { voci, error: (...a) => voci.push(a.map(String).join(' ')), warn: () => {} };
}

async function parametriReali(log) {
  const parametri = creaParametri({ log });
  await parametri.carica({
    caricatore: (n) => leggi(`contenuti/parametri/${n}.json`),
    statistiche: ['ferruccio', 'combattimento', 'stanza', 'economia', 'incontri', 'risveglio'],
    tabelle: ['input', 'doni', 'sinergie', 'consumabili'],
  });
  assert.deepEqual(parametri.errori(), []);
  return parametri;
}

/** DOM finto minimo (come incontri.test.mjs) con dataset, style e listeners. */
function documentoFinto() {
  const crea = (tag) => {
    const el = {
      tag, children: [], className: '', hidden: false, textContent: '', dataset: {}, listeners: {}, style: { props: {}, setProperty(k, v) { el.style.props[k] = v; } },
      append(...n) { for (const x of n) if (typeof x !== 'string') el.children.push(x); },
      replaceChildren(...n) { el.children = n.filter((x) => typeof x !== 'string'); },
      addEventListener(nome, fn) { el.listeners[nome] = fn; },
    };
    return el;
  };
  return { createElement: crea };
}

/**
 * Una «pagina»: tutti i moduli reali sopra una memoria condivisa (così due pagine simulano chiusura e riapertura).
 * La notte è finta e si guida con `entraIn(stanza)`.
 */
async function creaPagina({ memoria = memoriaInRam(), pool = null } = {}) {
  const log = logFinto();
  const parametri = await parametriReali(log);
  const eventi = creaBus({ log });
  const ricevuti = [];
  for (const n of ['morte.avvio', 'morte.fase', 'risveglio.fine', 'notte.salvata', 'notte.cancellata', 'notte.ripresa', 'economia.morte', 'narrativa.notte', 'ferruccio.risveglio']) {
    eventi.on(n, (p) => ricevuti.push({ nome: n, ...p }));
  }
  const tempo = creaTempo();
  const rng = creaRng(SEME);
  const modificatori = creaModificatori(parametri, { catalogo: parametri.get('doni'), sinergie: parametri.get('sinergie'), eventi, rng: derivato(rng, 'doni'), log });
  const campo = creaCampo({ colonne: parametri.get('stanza.colonne'), righe: parametri.get('stanza.righe'), cella: parametri.get('stanza.cella'), scenaLarghezza: SCENA.larghezza, scenaAltezza: SCENA.altezza });
  const input = creaInput(parametri.get('input'));
  const ferruccio = creaFerruccio({ modificatori, tempo, eventi, input, campo, x: SCENA.larghezza / 2, y: SCENA.altezza / 2 });
  const salvataggio = creaSalvataggio({ memoria, log, ora: () => 0 });
  const profilo = creaProfilo({ salvataggio, slot: SLOT, eventi });
  const economia = creaEconomia({ parametri, eventi, rng: derivato(rng, 'drop'), profilo, ferruccio, modificatori, piano: 1, log });
  const stato = creaStato({ storia: STORIA, regole: REGOLE, ancoraggi: ANCORAGGI, eventi, salvataggio, slot: SLOT, log });
  const incontri = creaIncontri({
    stato, storia: STORIA, ancoraggi: ANCORAGGI, ripetizioni: RIPETIZIONI, parametri, eventi, log, testi: TESTI.incontri,
    notte: () => stato.avanzamento()[REGOLE.piani.campo_notte], tipiSenzaAttesa: REGOLE.tipi_senza_attesa,
  });
  const poolFinto = pool ?? { azzerato: 0, raccolti: [], azzera() { poolFinto.azzerato += 1; }, raccolto(id) { poolFinto.raccolti.push(id); return true; } };
  const risveglio = creaRisveglio({ parametri, tempo, eventi, narrativa: stato, modificatori, ferruccio, economia, pool: poolFinto, campoNotte: REGOLE.piani.campo_notte, log });
  /** Notte finta: seme, piano e stanza corrente. */
  const notteFinta = { seme: 777, piano: 1, stanza: null };
  let notte = null;
  const notteSalvata = creaNotteSalvata({
    salvataggio, slot: SLOT, eventi, notte: () => notte, ferruccio, modificatori, economia, pool: poolFinto,
    numeroNotte: () => stato.avanzamento()[REGOLE.piani.campo_notte], log,
  });
  const entraIn = (id) => {
    notte = notteFinta;
    const da = notteFinta.stanza?.id ?? null;
    notteFinta.stanza = { id };
    eventi.emit('notte.stanza', { da, a: id, lato: null, tipo: 'combattimento' });
  };
  const tick = (n = 1) => { for (let i = 0; i < n; i++) { input.inizioTick(); risveglio.tick(tempo.passoS); } };
  const ms = (x) => tempo.ticksDaMs(x);
  const muori = () => { ferruccio.impostaMaschere(1); return ferruccio.subisciDanno({ danno: 1, x: ferruccio.x + 1, y: ferruccio.y }); };
  return {
    log, parametri, eventi, ricevuti, tempo, modificatori, ferruccio, salvataggio, profilo, economia, stato, incontri, risveglio, notteSalvata,
    pool: poolFinto, notteFinta, entraIn, tick, ms, muori, memoria, lasciaNotte: () => { notte = null; },
  };
}

// ---------------------------------------------------------------------------------------------
// Morte → risveglio
// ---------------------------------------------------------------------------------------------

test('M01: maschere a 0 → sequenza in quattro fasi nell\'ordine (lanterne una a una, fili, maschera, buio), durata ≤ 5 s, poi hub con notte + 1 e Ferruccio in piedi', async () => {
  const p = await creaPagina();
  assert.equal(p.risveglio.attivo, false);
  assert.equal(p.risveglio.fase, INATTIVO);
  assert.equal(p.stato.avanzamento().notte, 1);
  const durataMs = p.risveglio.durataMs();
  assert.ok(durataMs <= T_MAX_CRITERIO_MS, `la sequenza dura ${durataMs} ms`);
  assert.equal(durataMs, FASI_MORTE.reduce((a, f) => a + p.parametri.get(`risveglio.fasi.${f}`), 0));

  const esito = p.muori();
  assert.equal(esito.maschere, 0);
  assert.equal(p.ferruccio.stato, 'morto');
  assert.equal(p.risveglio.attivo, true);
  assert.equal(p.risveglio.fase, 'lanterne');
  assert.equal(p.ricevuti.filter((e) => e.nome === 'morte.avvio').length, 1);
  assert.equal(p.ricevuti.find((e) => e.nome === 'morte.avvio').durata_ms, durataMs);

  // lanterne: si spengono una a una lungo la prima fase
  const n = p.parametri.get('risveglio.lanterne');
  const tLanterne = p.ms(p.parametri.get('risveglio.fasi.lanterne'));
  const viste = new Set([p.risveglio.lanterneSpente()]);
  let precedente = p.risveglio.lanterneSpente();
  for (let i = 0; i < tLanterne - 1; i++) {
    p.tick(1);
    const s = p.risveglio.lanterneSpente();
    assert.ok(s >= precedente && s - precedente <= 1, `una lanterna alla volta (${precedente} → ${s})`);
    precedente = s;
    viste.add(s);
  }
  assert.equal(p.risveglio.fase, 'lanterne');
  assert.ok(viste.has(0) && viste.has(n - 1), `tutte le tappe 0..${n - 1} viste: ${Array.from(viste)}`);
  p.tick(1);
  assert.equal(p.risveglio.fase, 'fili');
  assert.equal(p.risveglio.lanterneSpente(), n, 'dopo la prima fase tutte spente');

  // le fasi seguono nell'ordine e il progresso cresce fino a 1
  let fasi = [p.ricevuti.filter((e) => e.nome === 'morte.fase').map((e) => e.fase)];
  let tickTotali = tLanterne;
  let ultimo = p.risveglio.progresso();
  for (let g = 0; g < 100000 && p.risveglio.attivo; g++) {
    p.tick(1);
    tickTotali += 1;
    const pr = p.risveglio.progresso();
    assert.ok(pr >= ultimo || !p.risveglio.attivo, 'progresso monotono');
    ultimo = pr;
  }
  fasi = p.ricevuti.filter((e) => e.nome === 'morte.fase').map((e) => e.fase);
  assert.deepEqual(fasi, FASI_MORTE.slice());
  assert.equal(tickTotali, FASI_MORTE.reduce((a, f) => a + p.ms(p.parametri.get(`risveglio.fasi.${f}`)), 0));
  assert.ok(tickTotali * p.tempo.passoS * 1000 <= T_MAX_CRITERIO_MS + p.tempo.passoS * 1000);

  // risveglio: notte + 1, Ferruccio in piedi con tutte le maschere, pool azzerato, economia nuova
  assert.equal(p.risveglio.attivo, false);
  const fine = p.ricevuti.find((e) => e.nome === 'risveglio.fine');
  assert.ok(fine);
  assert.equal(fine.notte, 2);
  assert.equal(p.stato.avanzamento().notte, 2);
  assert.equal(p.ferruccio.stato, 'fermo');
  assert.equal(p.ferruccio.maschere, p.modificatori.valore('ferruccio.maschere_max'));
  assert.equal(p.ferruccio.invulnerabile(), false);
  assert.equal(p.pool.azzerato, 1);
  assert.equal(p.economia.conclusa, false);
  assert.equal(p.economia.stanzeRipulite, 0);
  assert.equal(p.ricevuti.filter((e) => e.nome === 'narrativa.notte').length, 1);
  // il profilo salvato porta la notte nuova
  assert.equal(p.salvataggio.carica('profilo', SLOT).avanzamento.notte, 2);
  // morire di nuovo riparte la sequenza (notte 3)
  p.muori();
  assert.equal(p.risveglio.attivo, true);
  for (let g = 0; g < 100000 && p.risveglio.attivo; g++) p.tick(1);
  assert.equal(p.stato.avanzamento().notte, 3);
  assert.equal(p.risveglio.morti, 2);
  assert.deepEqual(p.log.voci, []);
});

test('M02: alla morte flag, scintille, piano_max e scene viste restano; monete, doni della notte e consumabili spariscono (regola 8)', async () => {
  const p = await creaPagina();
  assert.equal(p.stato.imposta('taddeo', 'perdonato').ok, true);
  assert.equal(p.stato.raggiungiPiano(1), 1);
  assert.equal(p.stato.segnaVista(SCENA_TONINO), true);
  p.economia.aggiungiScintille(7, 'test');
  p.economia.aggiungiMonete(23, 'test');
  assert.equal(p.modificatori.aggiungiDono(DONO), true);
  const consumabile = p.parametri.get('consumabili').consumabili[0];
  const statConsumabile = p.modificatori.valore(consumabile.statistica);
  p.economia.applicaConsumabile(consumabile);
  assert.equal(p.economia.consumabili().length, 1);
  assert.notEqual(p.modificatori.valore(consumabile.statistica), statConsumabile);
  const prima = { flag: p.stato.flag(), avanzamento: p.stato.avanzamento(), scintille: p.profilo.scintille };
  assert.equal(prima.scintille, 7);

  p.muori();
  // subito: monete perse (economia), scintille intatte
  assert.equal(p.economia.monete, 0);
  assert.equal(p.profilo.scintille, 7);
  for (let g = 0; g < 100000 && p.risveglio.attivo; g++) p.tick(1);

  const dopo = { flag: p.stato.flag(), avanzamento: p.stato.avanzamento(), scintille: p.profilo.scintille };
  assert.deepEqual(dopo.flag, prima.flag, 'i flag restano');
  assert.equal(dopo.flag.taddeo, 'perdonato');
  assert.equal(dopo.avanzamento.piano_max, 1, 'piano_max resta');
  assert.ok(dopo.avanzamento.scene_viste.includes(SCENA_TONINO), 'le scene viste restano');
  assert.deepEqual(dopo.avanzamento.boss_battuti, prima.avanzamento.boss_battuti);
  assert.equal(dopo.avanzamento.notte, prima.avanzamento.notte + 1);
  assert.equal(dopo.scintille, 7, 'le scintille restano');
  assert.equal(p.economia.monete, 0, 'le monete della notte spariscono');
  assert.deepEqual(p.modificatori.doniAttivi(), [], 'i doni della notte spariscono');
  assert.deepEqual(p.economia.consumabili(), [], 'i consumabili spariscono');
  assert.equal(p.modificatori.valore(consumabile.statistica), statConsumabile, 'nessun modificatore residuo');
  // su disco: profilo con flag e notte nuova
  const profilo = p.salvataggio.carica('profilo', SLOT);
  assert.equal(profilo.flag.taddeo, 'perdonato');
  assert.equal(profilo.avanzamento.notte, 2);
  assert.equal(profilo.avanzamento.piano_max, 1);
  assert.deepEqual(p.log.voci, []);
});

test('M03: risveglio.json vale: fasi {base,min,max}, la somma dei massimi delle fasi non supera t_max e t_max è il limite del criterio (5 s)', async () => {
  const p = await creaPagina();
  const sommaMax = FASI_MORTE.reduce((a, f) => a + p.parametri.statistica(`risveglio.fasi.${f}`).max, 0);
  assert.ok(sommaMax <= p.parametri.get('risveglio.t_max'), `somma dei massimi ${sommaMax} > t_max`);
  assert.equal(p.parametri.get('risveglio.t_max'), T_MAX_CRITERIO_MS);
  assert.ok(p.parametri.get('risveglio.lanterne') >= 1);
  // una fase a durata zero è saltata senza errori
  const q = await creaPagina();
  q.parametri.imposta('risveglio.fasi.buio', 0);
  q.muori();
  for (let g = 0; g < 100000 && q.risveglio.attivo; g++) q.tick(1);
  assert.deepEqual(q.ricevuti.filter((e) => e.nome === 'morte.fase').map((e) => e.fase), FASI_MORTE.filter((f) => f !== 'buio'));
  assert.equal(q.stato.avanzamento().notte, 2);
  assert.deepEqual(q.log.voci, []);
});

// ---------------------------------------------------------------------------------------------
// Salvataggio della notte
// ---------------------------------------------------------------------------------------------

test('S01: la notte si salva a ogni cambio di stanza con seme, piano, stanza, maschere, doni e monete; mai a metà stanza; alla morte si cancella', async () => {
  const p = await creaPagina();
  assert.equal(p.notteSalvata.presente, false);
  assert.equal(p.notteSalvata.carica(), null);
  assert.equal(p.notteSalvata.salva(), false, 'senza notte nulla da salvare');

  p.entraIn('s0');
  assert.equal(p.notteSalvata.presente, true);
  let d = p.notteSalvata.carica();
  assert.deepEqual(d, { seme: 777, piano: 1, stanza: 's0', notte: 1, maschere: p.ferruccio.maschere, doni: [], monete: 0 });
  assert.equal(p.ricevuti.filter((e) => e.nome === 'notte.salvata').length, 1);

  // cambiamenti dentro la stanza non si salvano finché non si cambia stanza (ADR-0006)
  p.ferruccio.impostaMaschere(2);
  p.modificatori.aggiungiDono(DONO);
  p.economia.aggiungiMonete(15, 'test');
  assert.equal(p.notteSalvata.carica().maschere, d.maschere);
  assert.deepEqual(p.notteSalvata.carica().doni, []);
  p.entraIn('s3');
  d = p.notteSalvata.carica();
  assert.deepEqual(d, { seme: 777, piano: 1, stanza: 's3', notte: 1, maschere: 2, doni: [DONO], monete: 15 });
  assert.deepEqual(p.notteSalvata.fotografa(), d);
  // la busta su disco è dello slot `notte`, il profilo è a parte
  assert.equal(p.salvataggio.elenca()[0].notte !== null, true);
  assert.equal(p.salvataggio.carica('profilo', SLOT), null, 'il profilo si scrive solo alle mutazioni narrative');

  // morte → cancellata
  p.muori();
  assert.equal(p.notteSalvata.presente, false);
  assert.equal(p.notteSalvata.carica(), null);
  assert.equal(p.ricevuti.find((e) => e.nome === 'notte.cancellata').motivo, MOTIVI_CANCELLAZIONE.morte);
  assert.equal(p.salvataggio.elenca().find((e) => e.slot === String(SLOT))?.notte ?? null, null);
  // dati corrotti → nessuna notte
  assert.equal(normalizzaNotte(null), null);
  assert.equal(normalizzaNotte({ seme: 1, piano: 0, stanza: 's' }), null);
  assert.equal(normalizzaNotte({ seme: 1, piano: 1, stanza: '' }), null);
  assert.deepEqual(normalizzaNotte({ seme: 5, piano: 2, stanza: 'x', maschere: -1, doni: [1, 'a'], monete: 'molte' }), { seme: 5, piano: 2, stanza: 'x', notte: null, maschere: null, doni: ['a'], monete: 0 });
  assert.deepEqual(p.log.voci, []);
});

test('S02: chiusura e riapertura: «Continua» rigenera dal seme (gancio avvia con seme, piano e stanza) e ripristina stanza, maschere, doni e monete; «Lascia andare» cancella', async () => {
  const memoria = memoriaInRam();
  const prima = await creaPagina({ memoria });
  prima.entraIn('s0');
  prima.ferruccio.impostaMaschere(3);
  prima.modificatori.aggiungiDono(DONO);
  prima.modificatori.aggiungiDono('lima');
  prima.economia.aggiungiMonete(42, 'test');
  prima.entraIn('s2');
  const salvata = prima.notteSalvata.carica();
  assert.deepEqual(salvata, { seme: 777, piano: 1, stanza: 's2', notte: 1, maschere: 3, doni: [DONO, 'lima'], monete: 42 });

  // «chiusura della pagina»: una nuova pagina sulla stessa memoria
  const dopo = await creaPagina({ memoria });
  assert.equal(dopo.notteSalvata.presente, true, 'la notte salvata è visibile alla riapertura');
  assert.equal(dopo.ferruccio.maschere, dopo.modificatori.valore('ferruccio.maschere_max'));
  assert.deepEqual(dopo.modificatori.doniAttivi(), []);
  assert.equal(dopo.economia.monete, 0);
  const chiamate = [];
  const esito = dopo.notteSalvata.riprendi({
    avvia: (o) => { chiamate.push(o); dopo.notteFinta.seme = o.seme; dopo.notteFinta.piano = o.piano; dopo.entraIn(o.stanza); },
  });
  assert.equal(esito.ok, true);
  assert.deepEqual(chiamate, [{ seme: 777, piano: 1, stanza: 's2' }]);
  assert.equal(dopo.ferruccio.maschere, 3);
  assert.deepEqual(dopo.modificatori.doniAttivi(), [DONO, 'lima']);
  assert.deepEqual(dopo.pool.raccolti, [DONO, 'lima'], 'il pool sa dei doni ripresi');
  assert.equal(dopo.economia.monete, 42);
  assert.equal(dopo.economia.stanzaCorrente, 's2');
  const ripresa = dopo.ricevuti.find((e) => e.nome === 'notte.ripresa');
  assert.equal(ripresa.stanza, 's2');
  // la notte ripresa resta salvata (stessa fotografia)
  assert.deepEqual(dopo.notteSalvata.carica(), salvata);
  assert.equal(dopo.ricevuti.filter((e) => e.nome === 'notte.salvata').length, 1, 'una sola scrittura dopo la ripresa');

  // senza notte salvata «Continua» non fa nulla; «Lascia andare» cancella
  dopo.notteSalvata.cancella(MOTIVI_CANCELLAZIONE.lasciata);
  assert.equal(dopo.notteSalvata.presente, false);
  assert.deepEqual(dopo.notteSalvata.riprendi({ avvia: () => assert.fail('non deve avviare') }), { ok: false, motivo: 'nessuna' });
  const terza = await creaPagina({ memoria });
  assert.equal(terza.notteSalvata.presente, false);
  // un dono ignoto nella notte salvata è scartato con errore di contenuto, il resto si ripristina
  memoria.setItem(`ferruccio.v3.notte.${SLOT}`, JSON.stringify({ versione: 1, tipo: 'notte', slot: String(SLOT), salvato_il: 0, dati: { seme: 9, piano: 1, stanza: 's1', maschere: 2, doni: ['inesistente', DONO], monete: 3 } }));
  const quarta = await creaPagina({ memoria });
  assert.equal(quarta.notteSalvata.riprendi({ avvia: (o) => quarta.entraIn(o.stanza) }).ok, true);
  assert.deepEqual(quarta.modificatori.doniAttivi(), [DONO]);
  assert.equal(quarta.economia.monete, 3);
  assert.ok(quarta.log.voci.some((v) => v.includes('inesistente')));
  assert.deepEqual(prima.log.voci, []);
  assert.deepEqual(dopo.log.voci, []);
});

test('S03: una scena in corso alla chiusura non è in scene_viste alla ripresa; una scena chiusa sì', async () => {
  const memoria = memoriaInRam();
  const p = await creaPagina({ memoria });
  p.entraIn('s0');
  const d = p.incontri.mostra(SCENA_TONINO);
  assert.ok(d, 'la scena parte');
  assert.ok(d.cartigli.length > 1);
  d.avanza(); // a metà
  assert.equal(p.incontri.dialogo()?.id, SCENA_TONINO);
  assert.equal(p.stato.avanzamento().scene_viste.includes(SCENA_TONINO), false);
  // «chiusura»: nessuna chiamata di chiusura del dialogo
  const dopo = await creaPagina({ memoria });
  assert.equal(dopo.stato.avanzamento().scene_viste.includes(SCENA_TONINO), false, 'la scena a metà non è vista');
  assert.equal(dopo.notteSalvata.presente, true, 'la notte invece è salvata (dal cambio di stanza)');
  assert.equal(dopo.incontri.dialogo(), null);
  // chiusa fino in fondo → vista anche alla pagina seguente
  const d2 = dopo.incontri.mostra(SCENA_TONINO);
  assert.ok(d2);
  for (let i = 0; i < 100 && dopo.incontri.dialogo(); i++) dopo.incontri.dialogo().avanza();
  assert.equal(dopo.incontri.dialogo(), null);
  assert.equal(dopo.stato.avanzamento().scene_viste.includes(SCENA_TONINO), true);
  const terza = await creaPagina({ memoria });
  assert.equal(terza.stato.avanzamento().scene_viste.includes(SCENA_TONINO), true);
  assert.deepEqual(p.log.voci, []);
  assert.deepEqual(dopo.log.voci, []);
});

test('S04: la busta del profilo è una sola: flag e avanzamento (stato narrativo) e scintille (profilo) sopravvivono insieme alla riapertura, qualunque sia l\'ultimo a scrivere', async () => {
  const memoria = memoriaInRam();
  const p = await creaPagina({ memoria });
  p.economia.aggiungiScintille(5, 'test');
  assert.equal(p.stato.imposta('taddeo', 'perdonato').ok, true); // ultimo a scrivere: lo stato narrativo
  const q = await creaPagina({ memoria });
  assert.equal(q.profilo.scintille, 5, 'le scintille non sono state sovrascritte dal profilo narrativo');
  assert.equal(q.stato.flag().taddeo, 'perdonato');
  q.economia.aggiungiScintille(2, 'test'); // ultimo a scrivere: il profilo
  const r = await creaPagina({ memoria });
  assert.equal(r.profilo.scintille, 7);
  assert.equal(r.stato.flag().taddeo, 'perdonato', 'i flag non sono stati sovrascritti dalle scintille');
  const busta = JSON.parse(memoria.getItem(`ferruccio.v3.profilo.${SLOT}`));
  assert.deepEqual(Object.keys(busta.dati).sort(), ['avanzamento', 'flag', 'ricordi_restituiti', 'sblocchi', 'scintille']);
  assert.deepEqual(p.log.voci.concat(q.log.voci, r.log.voci), []);
});

// ---------------------------------------------------------------------------------------------
// Interfaccia DOM (finta) e regole del codice
// ---------------------------------------------------------------------------------------------

test('D01: il velo di morte segue le fasi (lanterne spente, fili spezzati, maschera staccata, didascalie) e il pannello «Continua» appare solo nell\'hub con una notte salvata', async () => {
  const p = await creaPagina();
  const documento = documentoFinto();
  const contenitore = documento.createElement('div');
  const velo = creaInterfacciaMorte({ documento, contenitore, testi: TESTI, risveglio: () => p.risveglio });
  velo.aggiorna();
  assert.equal(velo.stato(), null, 'nascosto da inattivo');
  p.muori();
  velo.aggiorna();
  let s = velo.stato();
  assert.equal(s.fase, 'lanterne');
  assert.equal(s.lanterne, p.parametri.get('risveglio.lanterne'));
  assert.equal(s.spente, 0);
  assert.equal(s.fili, 'tesi');
  assert.equal(s.maschera, 'intera');
  assert.equal(s.didascalia, TESTI.morte.lanterne);
  p.tick(p.ms(p.parametri.get('risveglio.fasi.lanterne')));
  velo.aggiorna();
  s = velo.stato();
  assert.equal(s.fase, 'fili');
  assert.equal(s.spente, s.lanterne);
  assert.equal(s.fili, 'spezzati');
  assert.equal(s.didascalia, TESTI.morte.fili);
  p.tick(p.ms(p.parametri.get('risveglio.fasi.fili')));
  velo.aggiorna();
  s = velo.stato();
  assert.equal(s.fase, 'maschera');
  assert.equal(s.maschera, 'staccata');
  assert.equal(s.didascalia, TESTI.morte.maschera);
  p.tick(p.ms(p.parametri.get('risveglio.fasi.maschera')));
  velo.aggiorna();
  assert.equal(velo.stato().fase, 'buio');
  assert.equal(velo.stato().didascalia, TESTI.morte.buio);
  const progresso = Number(velo.velo.style.props['--progresso']);
  assert.ok(progresso > 0.5 && progresso < 1, `progresso ${progresso}`);
  for (let g = 0; g < 100000 && p.risveglio.attivo; g++) p.tick(1);
  velo.aggiorna();
  assert.equal(velo.stato(), null, 'nascosto al risveglio');

  // pannello «Continua»
  let hubAttivo = true;
  let continuate = 0;
  const pannello = creaInterfacciaRipresa({
    documento, contenitore, testi: TESTI, notteSalvata: p.notteSalvata, visibile: () => hubAttivo,
    suContinua: () => { continuate += 1; return p.notteSalvata.riprendi({ avvia: (o) => p.entraIn(o.stanza) }).ok; },
  });
  pannello.aggiorna();
  assert.equal(pannello.stato(), null, 'senza notte salvata niente pannello');
  assert.equal(pannello.continua(), false);
  p.entraIn('s4');
  pannello.aggiorna();
  const st = pannello.stato();
  assert.equal(st.piano, 1);
  assert.equal(st.stanza, 's4');
  assert.equal(st.continua, TESTI.ripresa.continua);
  assert.equal(st.lascia, TESTI.ripresa.lascia);
  assert.ok(st.titolo.includes('1') && !st.titolo.includes('{'), st.titolo);
  hubAttivo = false;
  pannello.aggiorna();
  assert.equal(pannello.stato(), null, 'fuori dall\'hub nascosto');
  hubAttivo = true;
  pannello.aggiorna();
  assert.ok(pannello.stato());
  pannello.radice.children[1].children[0].listeners.click({ preventDefault() {} });
  assert.equal(continuate, 1, 'il click su «Continua» chiama il gancio');
  assert.equal(p.economia.stanzaCorrente, 's4');
  pannello.radice.children[1].children[1].listeners.click({ preventDefault() {} });
  assert.equal(p.notteSalvata.presente, false, 'il click su «Lascia andare» cancella');
  pannello.aggiorna();
  assert.equal(pannello.stato(), null);
  assert.deepEqual(p.log.voci, []);
});

test('R01: regole del codice: nessun Math.random, nessun numero e nessuna stringa di gioco nei moduli della storia 030; JSDoc sulle funzioni esportate', () => {
  const moduli = ['motore/storia/risveglio.js', 'motore/persistenza/notte-salvata.js', 'motore/interfaccia/morte.js', 'motore/interfaccia/ripresa.js'];
  const senzaCommenti = (f) => readFileSync(join(RADICE, f), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  for (const f of moduli) {
    const testo = readFileSync(join(RADICE, f), 'utf8');
    assert.ok(!/Math\.random/.test(testo), `${f}: Math.random`);
    assert.ok(/\/\*\*[\s\S]*?\*\/\s*export function/.test(testo), `${f}: JSDoc sulle funzioni esportate`);
    const codice = senzaCommenti(f);
    for (const t of Object.values(TESTI.morte).concat(Object.values(TESTI.ripresa))) {
      const quotato = new RegExp(`["'\`]${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'\`]`);
      assert.ok(!quotato.test(codice), `${f}: contiene il testo «${t}»`);
    }
  }
  for (const f of ['motore/storia/risveglio.js', 'motore/persistenza/notte-salvata.js']) {
    const codice = senzaCommenti(f);
    for (const n of ['1200', '600', '400', '5000', '3']) {
      assert.ok(!new RegExp(`[^\\w.]${n}(?![\\d.\\w])`).test(codice), `${f} contiene il numero ${n}`);
    }
  }
});
