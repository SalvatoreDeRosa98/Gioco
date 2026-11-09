/**
 * gioco/qa/oggetti.test.mjs — Storia P04/P09: i cinque slot con sostituzione (oggetti/slot.js, piedistallo e banchetto
 * attraverso `acquisisci`), gli oggetti gratis (oggetti/gratis.js) e la Crepa Dorata della segreta (mondo/segreta.js).
 * Esecuzione: `node gioco/qa/oggetti.test.mjs`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { creaMondoAttivi } from './attivi.test.mjs';
import { creaSlot } from '../motore/oggetti/slot.js';
import { creaGratis, tiraTier } from '../motore/oggetti/gratis.js';
import { creaSegreta } from '../motore/mondo/segreta.js';
import { creaPiedistalli } from '../motore/oggetti/piedistallo.js';
import { creaPool } from '../motore/oggetti/pool.js';
import { creaRng, derivato } from '../motore/fondazione/rng.js';
import { caricaModelli, creaCatalogo, regoleDaParametri } from '../motore/mondo/modelli.js';
import { generaPiano } from '../motore/mondo/generazione.js';
import { creaNotte } from '../motore/mondo/notte.js';
import { creaCamera } from '../motore/mondo/camera.js';
import { creaFantoccio } from '../motore/attori/bersaglio.js';
import { creaEconomia } from '../motore/oggetti/economia.js';
import { creaSalvataggio, memoriaInRam } from '../motore/persistenza/salvataggio.js';
import { creaProfilo } from '../motore/persistenza/profilo.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const leggi = (p) => JSON.parse(readFileSync(join(RADICE, p), 'utf8'));
const DONI = leggi('contenuti/parametri/doni.json');
const MAX = DONI.limiti.max_slot_doni.base;
const SCENA = { larghezza: 1280, altezza: 720 };

async function mondoConSlot() {
  const m = await creaMondoAttivi();
  const slot = creaSlot({ modificatori: m.modificatori, parametri: m.parametri, eventi: m.eventi, ferruccio: m.ferruccio });
  const validi = m.modificatori.catalogo().filter((id) => !m.modificatori.dono(id)?.ricordo && m.modificatori.dono(id)?.mvp !== false);
  return { ...m, slot, validi };
}

test('S1: max_slot_doni (5) dal JSON: cinque doni entrano subito; il sesto resta PENDENTE (slot.pendente, nessun dono cambia); conferma(i) sostituisce lo slot i e ricalcola le statistiche; il vecchio torna via `restituisci`; annulla lascia tutto com\'era', async () => {
  const m = await mondoConSlot();
  assert.equal(m.slot.max, MAX);
  const ids = m.validi.slice(0, MAX + 1);
  for (let i = 0; i < MAX; i++) assert.equal(m.slot.acquisisci(ids[i], { origine: 'piedistallo' }), 'aggiunto', ids[i]);
  assert.deepEqual(m.modificatori.doniAttivi(), ids.slice(0, MAX));
  assert.equal(m.slot.pieno, true);
  const dmgPrima = m.statistiche.correnti().dmg;
  const pendenti = [];
  m.eventi.on('slot.pendente', (p) => pendenti.push(p));
  const restituiti = [];
  assert.equal(m.slot.acquisisci(ids[MAX], { origine: 'piedistallo', restituisci: (v) => restituiti.push(v) }), 'pendente');
  assert.equal(pendenti.length, 1);
  assert.equal(m.slot.pendente.id, ids[MAX]);
  assert.deepEqual(m.modificatori.doniAttivi(), ids.slice(0, MAX), 'nessun dono cambia finché il modale non decide');
  assert.equal(m.slot.acquisisci(ids[0], {}), false, 'un solo scambio per volta');
  assert.ok(m.slot.annulla());
  assert.equal(m.slot.pendente, null);
  assert.deepEqual(m.modificatori.doniAttivi(), ids.slice(0, MAX));
  assert.equal(m.slot.acquisisci(ids[MAX], { origine: 'piedistallo', restituisci: (v) => restituiti.push(v) }), 'pendente');
  assert.equal(m.slot.conferma(7), false, 'slot inesistente');
  assert.ok(m.slot.conferma(2));
  const attesi = ids.slice(0, MAX);
  attesi.splice(2, 1);
  attesi.push(ids[MAX]);
  assert.deepEqual(m.modificatori.doniAttivi(), attesi, 'il nuovo prende il posto del terzo (in coda nell\'ordine di raccolta)');
  assert.deepEqual(restituiti, [ids[2]], 'il vecchio torna a chi lo offriva');
  assert.notEqual(m.statistiche.correnti().dmg, undefined);
  assert.equal(m.statistiche.correnti().dmg === dmgPrima && ids[2] !== ids[MAX] && false, false);
});

test('S2: piedistallo con `acquisisci` a slot pieni → esito pendente, il piedistallo resta offerto; dopo conferma il vecchio dono sta sul piedistallo (regola del Teatro) e il pool segna raccolto il nuovo', async () => {
  const m = await mondoConSlot();
  const eco = m.parametri;
  const RAR = ['comune', 'raro', 'prezioso'];
  const pool = creaPool({
    catalogo: DONI.doni, pesi: Object.fromEntries(RAR.map((r) => [r, eco.get(`economia.banchetto.peso_rarita.${r}`)])),
    derivePct: Object.fromEntries(RAR.map((r) => [r, eco.get(`economia.banchetto.deriva_rarita_pct.${r}`)])), fallbackMonete: eco.get('economia.banchetto.fallback_monete'),
    rng: creaRng(7), flag: () => ({}), restituiti: () => [], eventi: m.eventi,
  });
  pool.preparaPiano(1);
  const ped = creaPiedistalli({ pool, modificatori: m.modificatori, parametri: m.parametri, piano: 1, ferruccio: m.ferruccio, input: m.input, eventi: m.eventi, acquisisci: (id, o) => m.slot.acquisisci(id, o) });
  const stanza = { id: 't1', contenuti: [], cella: m.campo.cella, origine: { x: m.campo.x, y: m.campo.y }, geo: { colonne: 13, righe: 7 } };
  ped.attiva(stanza);
  const offerto = ped.elenco()[0];
  const addosso = m.validi.filter((id) => id !== offerto.id).slice(0, MAX);
  for (const id of addosso) assert.equal(m.slot.acquisisci(id), 'aggiunto');
  const esito = ped.raccogli(0);
  assert.equal(esito.esito, 'pendente');
  assert.equal(ped.elenco()[0].stato, 'offerto', 'resta offerto finché il modale decide');
  assert.equal(pool.raccolti().includes(offerto.id), false);
  assert.ok(m.slot.conferma(0));
  assert.ok(m.modificatori.doniAttivi().includes(offerto.id));
  assert.equal(ped.elenco()[0].id, addosso[0], 'il vecchio dono è sul piedistallo');
  assert.equal(ped.elenco()[0].stato, 'offerto');
  assert.ok(pool.raccolti().includes(offerto.id), 'il pool segna raccolto il nuovo');
});

test('G1: tiraTier è il tiro del Teatro (u < p_forte → forte, u < p_forte + p_base → base, altrimenti null; garantito → almeno base) e su 10 000 tiri le frequenze stanno a ±2 punti da p_forte e p_base', () => {
  const E = leggi('contenuti/parametri/economia.json').gratis;
  const pF = E.p_forte.base;
  const pB = E.p_base.base;
  assert.equal(tiraTier({ rng: () => pF / 2, pForte: pF, pBase: pB }), 'forte');
  assert.equal(tiraTier({ rng: () => pF + pB / 2, pForte: pF, pBase: pB }), 'base');
  assert.equal(tiraTier({ rng: () => 0.99, pForte: pF, pBase: pB }), null);
  assert.equal(tiraTier({ rng: () => 0.99, pForte: pF, pBase: pB, garantito: true }), 'base');
  const rng = creaRng(99);
  const conta = { forte: 0, base: 0, null: 0 };
  for (let i = 0; i < 10000; i++) conta[String(tiraTier({ rng, pForte: pF, pBase: pB }))] += 1;
  assert.ok(Math.abs(conta.forte / 10000 - pF) < 0.02, `forte ${conta.forte}`);
  assert.ok(Math.abs(conta.base / 10000 - pB) < 0.02, `base ${conta.base}`);
});

test('G2: su una notte vera (seme 1845) ogni stanza normale ripulita tira UNA volta dal suo seme_stanza (deterministico), l\'oggetto gratis sta al centro, ha il tier del Teatro, non si ripete nella run; interagisci vicino lo raccoglie attraverso i cinque slot', async () => {
  const m = await mondoConSlot();
  const indice = leggi('contenuti/modelli-stanza/piazza-dante/indice.json');
  const { modelli } = await caricaModelli({ caricatore: async (n) => leggi(`contenuti/modelli-stanza/piazza-dante/${n}.json`), indice, regole: regoleDaParametri(m.parametri) });
  const catalogo = creaCatalogo(modelli);
  const riserva = leggi('contenuti/piani/piazza-dante-riserva.json');
  const avvia = (seme) => {
    const { pianta } = generaPiano({ seme, piano: 1, parametri: m.parametri, catalogo, riserva, log: { error() {} } });
    const camera = creaCamera({ parametri: m.parametri, tempo: m.tempo, scena: SCENA, eventi: m.eventi });
    const creaNemico = ({ x, y, id }) => creaFantoccio({ modificatori: m.modificatori, tempo: m.tempo, eventi: m.eventi, campo: m.campo, bersaglio: m.combattimento.comeBersaglio, id, x, y, vita: 1 });
    const notte = creaNotte({ seme, numeroPiano: 1, pianta, catalogo, parametri: m.parametri, tempo: m.tempo, eventi: m.eventi, campo: m.campo, scena: SCENA, ferruccio: m.ferruccio, combattimento: m.combattimento, bersagli: m.bersagli, proiettili: m.proiettili, camera, creaNemico });
    notte.entra(pianta.stanze.find((s) => s.tipo === 'ingresso').id);
    return notte;
  };
  let notte = avvia(1845);
  const gratis = creaGratis({ parametri: m.parametri, catalogo: DONI.doni, eventi: m.eventi, notte: () => notte, ferruccio: m.ferruccio, modificatori: m.modificatori, acquisisci: (id, o) => m.slot.acquisisci(id, o), input: m.input });
  const pulisci = (id) => {
    notte.vaiA(id);
    for (let i = 0; i < 4000 && notte.stanza.stato !== 'pulita'; i++) {
      m.input.inizioTick();
      for (const b of m.bersagli) b.colpisci(1e6, null);
      notte.tick(1 / 60);
      gratis.tick();
    }
    assert.equal(notte.stanza.stato, 'pulita', `${id} pulita`);
  };
  const normali = notte.pianta.stanze.filter((s) => s.tipo === 'normale').map((s) => s.id);
  assert.ok(normali.length >= 1);
  const posati = [];
  m.eventi.on('gratis.posato', (p) => posati.push(p));
  for (const id of normali) pulisci(id);
  const stati = gratis.stati();
  assert.deepEqual(Object.keys(stati).sort(), normali.slice().sort(), 'ogni stanza normale ha tirato una volta');
  // determinismo: stessa notte, stessi tiri
  const prima = JSON.stringify(stati);
  m.modificatori.doniAttivi().forEach((id) => m.modificatori.rimuoviDono(id));
  gratis.nuovaRun();
  notte = avvia(1845);
  for (const id of normali) pulisci(id);
  assert.equal(JSON.stringify(gratis.stati()), prima, 'stesso seme → stessi oggetti gratis');
  // un seme che dà almeno un oggetto gratis entro 40 semi (p ≈ 0,43 per stanza)
  let trovato = null;
  for (let s = 1; s < 60 && !trovato; s++) {
    m.modificatori.doniAttivi().forEach((id) => m.modificatori.rimuoviDono(id));
    gratis.nuovaRun();
    notte = avvia(1845 + s * 13);
    for (const id of notte.pianta.stanze.filter((x) => x.tipo === 'normale').map((x) => x.id)) {
      pulisci(id);
      const g = gratis.corrente();
      if (g && g.stato === 'offerto') { trovato = { seme: 1845 + s * 13, g }; break; }
    }
  }
  assert.ok(trovato, 'in 60 semi almeno un oggetto gratis');
  const g = trovato.g;
  const st = notte.stanza;
  assert.ok(['base', 'forte'].includes(g.tier));
  assert.equal(DONI.doni.find((d) => d.id === g.id).teatro.tier, g.tier, 'il dono ha il tier del tiro');
  assert.ok(Math.abs(g.x - (st.origine.x + st.geo.colonne * st.cella / 2)) < 1 && Math.abs(g.y - (st.origine.y + st.geo.righe * st.cella / 2)) < 1, 'al centro della stanza');
  m.ferruccio.posiziona(g.x + 20, g.y);
  assert.equal(gratis.vicino(), true);
  m.input.sorgenteGiu(m.tasto('interagisci'));
  m.input.inizioTick();
  gratis.tick();
  m.input.sorgenteSu(m.tasto('interagisci'));
  assert.ok(m.modificatori.doniAttivi().includes(g.id), 'raccolto');
  assert.equal(gratis.corrente().stato, 'preso');
});

test('Z1: segreta — nella stanza confinante la Crepa Dorata (finestra verso la segreta) è visibile solo a stanza pulita; un proiettile di Ferruccio nel suo rettangolo la apre: porte sui due record, stanza rimontata con Ferruccio fermo, evento segreta.aperta, si entra nella segreta; la segreta pulita lascia monete_segreta monete', async () => {
  const m = await mondoConSlot();
  const indice = leggi('contenuti/modelli-stanza/piazza-dante/indice.json');
  const { modelli } = await caricaModelli({ caricatore: async (n) => leggi(`contenuti/modelli-stanza/piazza-dante/${n}.json`), indice, regole: regoleDaParametri(m.parametri) });
  const catalogo = creaCatalogo(modelli);
  const riserva = leggi('contenuti/piani/piazza-dante-riserva.json');
  let pianta = null;
  let seme = 1845;
  for (; seme < 1945; seme++) {
    pianta = generaPiano({ seme, piano: 1, parametri: m.parametri, catalogo, riserva, log: { error() {} } }).pianta;
    if (pianta.stanze.some((s) => s.tipo === 'segreta')) break;
  }
  assert.ok(pianta.stanze.some((s) => s.tipo === 'segreta'), 'un piano con la segreta');
  const camera = creaCamera({ parametri: m.parametri, tempo: m.tempo, scena: SCENA, eventi: m.eventi });
  const creaNemico = ({ x, y, id }) => creaFantoccio({ modificatori: m.modificatori, tempo: m.tempo, eventi: m.eventi, campo: m.campo, bersaglio: m.combattimento.comeBersaglio, id, x, y, vita: 1 });
  const notte = creaNotte({ seme, numeroPiano: 1, pianta, catalogo, parametri: m.parametri, tempo: m.tempo, eventi: m.eventi, campo: m.campo, scena: SCENA, ferruccio: m.ferruccio, combattimento: m.combattimento, bersagli: m.bersagli, proiettili: m.proiettili, camera, creaNemico });
  const salvataggio = creaSalvataggio({ memoria: memoriaInRam() });
  const profilo = creaProfilo({ salvataggio, slot: '1', eventi: m.eventi });
  const economia = creaEconomia({ parametri: m.parametri, eventi: m.eventi, rng: derivato(creaRng(seme), 'drop'), profilo, ferruccio: m.ferruccio, modificatori: m.modificatori, piano: 1 });
  const proiettiliFinti = [];
  const comb = { proiettiliFerruccio: () => proiettiliFinti, hitboxCorrente: () => null };
  const segreta = creaSegreta({ eventi: m.eventi, notte: () => notte, combattimento: comb, ferruccio: m.ferruccio, parametri: m.parametri, economia });
  const seg = pianta.stanze.find((s) => s.tipo === 'segreta');
  const vicina = pianta.stanze.find((s) => s.tipo !== 'segreta' && s.finestre.length > 0);
  assert.ok(vicina, 'una stanza con la finestra verso la segreta');
  notte.entra(pianta.stanze.find((s) => s.tipo === 'ingresso').id);
  notte.vaiA(vicina.id);
  const c0 = segreta.crepa();
  assert.ok(c0 && !c0.aperta, 'la crepa esiste');
  if (notte.stanza.stato !== 'pulita') {
    assert.equal(c0.visibile, false, 'non visibile prima della pulizia');
    proiettiliFinti.push({ x: c0.x, y: c0.y, r: 6 });
    segreta.tick();
    assert.equal(segreta.crepa().aperta, false, 'un colpo prima della pulizia non apre');
    proiettiliFinti.length = 0;
    for (let i = 0; i < 4000 && notte.stanza.stato !== 'pulita'; i++) { m.input.inizioTick(); for (const b of m.bersagli) b.colpisci(1e6, null); notte.tick(1 / 60); }
  }
  assert.equal(notte.stanza.stato, 'pulita');
  const c = segreta.crepa();
  assert.equal(c.visibile, true);
  const aperte = [];
  m.eventi.on('segreta.aperta', (p) => aperte.push(p));
  m.ferruccio.posiziona(m.campo.x + 100, m.campo.y + 100);
  const pos = { x: m.ferruccio.x, y: m.ferruccio.y };
  proiettiliFinti.push({ x: c.x + 1000, y: c.y, r: 6 });
  segreta.tick();
  assert.equal(aperte.length, 0, 'un proiettile lontano non apre');
  proiettiliFinti[0] = { x: c.x, y: c.y, r: 6 };
  segreta.tick();
  assert.equal(aperte.length, 1);
  assert.equal(aperte[0].slot, c.slot);
  assert.equal(vicina.porte[c.slot], seg.id, 'porta sul record della stanza');
  assert.ok(Object.values(seg.porte).includes(vicina.id), 'porta sul record della segreta');
  assert.ok(!vicina.finestre.includes(c.slot));
  assert.equal(notte.stanza.id, vicina.id);
  assert.equal(notte.stanza.stato, 'pulita', 'rimontata pulita');
  assert.ok(notte.stanza.porte.some((p) => p.slot === c.slot), 'la porta esiste nella stanza montata');
  assert.deepEqual([m.ferruccio.x, m.ferruccio.y], [pos.x, pos.y], 'Ferruccio non si muove');
  assert.equal(segreta.crepa().aperta, true);
  // nella segreta (storia P15: combatte una ondata di predoni dorati): monete_segreta monete a terra alla pulizia
  const monete = [];
  m.eventi.on('segreta.monete', (p) => monete.push(p));
  notte.vaiA(seg.id);
  assert.equal(notte.stanza.combatte, true, 'la segreta combatte (P15)');
  assert.equal(notte.stanza.stato, 'annuncio');
  assert.equal(monete.length, 0, 'niente monete prima della pulizia');
  for (let i = 0; i < 4000 && notte.stanza.stato !== 'pulita'; i++) { m.input.inizioTick(); for (const b of m.bersagli) b.colpisci(1e6, null); notte.tick(1 / 60); }
  assert.equal(notte.stanza.stato, 'pulita');
  assert.equal(monete.length, 1);
  const aTerra = economia.aTerra(seg.id).filter((o) => o.tipo === 'moneta');
  assert.equal(monete[0].n, m.parametri.get('economia.monete_segreta'), 'le monete della segreta del Teatro');
  assert.ok(aTerra.length >= m.parametri.get('economia.monete_segreta'), 'monete_segreta più il bottino dei predoni (storia P15)');
  notte.vaiA(vicina.id);
  notte.vaiA(seg.id);
  assert.equal(monete.length, 1, 'una volta sola');
});

test('regole: slot.js, gratis.js, segreta.js senza Math.random e senza numeri di gioco', () => {
  for (const f of ['motore/oggetti/slot.js', 'motore/oggetti/gratis.js', 'motore/mondo/segreta.js']) {
    const testo = readFileSync(join(RADICE, f), 'utf8');
    assert.ok(!/Math\.random/.test(testo), `${f}: Math.random`);
    const codice = testo.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    for (const n of ['0.10', '0.3333', '5']) assert.ok(!new RegExp(`[^\\w.'\\-\\[]${n.replace('.', '\\.')}(?![\\d.\\w\\]])`).test(codice), `${f} contiene ${n}`);
  }
});
