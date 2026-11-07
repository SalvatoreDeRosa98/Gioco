/**
 * gioco/qa/fondazione.test.mjs — Test unitari della fondazione (storie 001-004), senza DOM.
 *
 * Esecuzione: `node gioco/qa/fondazione.test.mjs` dalla radice del repository.
 * Usa `node:test` (Node ≥ 20): il processo esce con codice 1 se un test fallisce.
 * Copre: rng (determinismo, derivati indipendenti), eventi (payload, off, errore isolato),
 * tempo (60 tick in 1000 ms, max 5 per frame, alpha), ciclo (macchina degli stati, tick forzati),
 * input (parte pura: normalizzazione, fronti, blur, gamepad), parametri (validazione e override).
 * In coda due controlli di contenuto sui file reali: JSON validi e zero `Math.random` nel motore.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { creaRng, derivato, intero, scegli, mescola, hashEtichetta } from '../motore/fondazione/rng.js';
import { creaBus } from '../motore/fondazione/eventi.js';
import { creaTempo, PASSO_MS, MAX_TICK_PER_FRAME } from '../motore/fondazione/tempo.js';
import { creaCiclo, STATI, TRANSIZIONI } from '../motore/fondazione/ciclo.js';
import { creaInput } from '../motore/fondazione/input.js';
import {
  creaParametri, validaStatistiche, leggiOverrideUrl, applicaOverride, eStatistica,
} from '../motore/fondazione/parametri.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE_GIOCO = join(QUI, '..');

/** Logger finto che conta le chiamate a `error`. */
function logFinto() {
  const voci = [];
  return { voci, error: (...a) => voci.push(a) };
}

/** Fixture: albero di statistiche minimo e valido. */
function statisticheValide() {
  return {
    _descrizione: 'fixture',
    v_base: { base: 220, min: 150, max: 330 },
    gruppo: { t_x: { base: 10, min: 0, max: 20 } },
  };
}

/** Fixture: mappa dei tasti minima per l'input. */
function mappaInput() {
  return {
    tastiera: {
      sinistra: ['KeyA', 'ArrowLeft'], destra: ['KeyD', 'ArrowRight'], su: ['KeyW', 'ArrowUp'], giu: ['KeyS', 'ArrowDown'],
      attacco: ['KeyJ'], parata: ['KeyK'], scatto: ['Space'], interagisci: ['KeyE'],
      avanza: ['Space', 'Enter'], conferma: ['Enter'], indietro: ['Escape'], menu: ['Escape'],
    },
    mouse: { attacco: [0], parata: [2] },
    gamepad: {
      zona_morta: 0.2,
      assi: { x: 0, y: 1 },
      bottoni: { attacco: [0], scatto: [1], parata: [2], interagisci: [5], su: [12], giu: [13], sinistra: [14], destra: [15] },
    },
  };
}

/** Gamepad finto con i bottoni e gli assi indicati. */
function gamepadFinto({ premuti = [], assi = [0, 0] } = {}) {
  const buttons = Array.from({ length: 17 }, (_, i) => ({ pressed: premuti.includes(i) }));
  return { buttons, axes: assi, connected: true };
}

// ---------------------------------------------------------------------------------------------
// rng.js (storia 003)
// ---------------------------------------------------------------------------------------------

test('rng: creaRng(1845) produce la stessa sequenza di 1000 numeri due volte, tutti in [0,1)', () => {
  const a = creaRng(1845);
  const b = creaRng(1845);
  for (let i = 0; i < 1000; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
});

test('rng: semi diversi danno sequenze diverse', () => {
  const a = creaRng(1845);
  const b = creaRng(1846);
  const diverse = Array.from({ length: 20 }, () => a() !== b()).some(Boolean);
  assert.ok(diverse);
});

test('rng: derivato(rng, "spawn") non cambia la sequenza di derivato(rng, "drop")', () => {
  const radice = creaRng(1845);
  const dropPrima = Array.from({ length: 50 }, (_, i) => i).map(() => 0);
  const d1 = derivato(radice, 'drop');
  for (let i = 0; i < 50; i++) dropPrima[i] = d1();

  const spawn = derivato(radice, 'spawn');
  for (let i = 0; i < 100; i++) spawn();
  for (let i = 0; i < 100; i++) radice();

  const d2 = derivato(radice, 'drop');
  const dropDopo = Array.from({ length: 50 }, () => d2());
  assert.deepEqual(dropDopo, dropPrima);
  assert.notEqual(derivato(radice, 'spawn').seme, derivato(radice, 'drop').seme);
  assert.notEqual(derivato(radice, 'spawn')(), derivato(radice, 'drop')());
  assert.notEqual(derivato(radice, 'drop').seme, radice.seme);
});

test('rng: hashEtichetta è stabile e gli aiutanti rispettano i limiti', () => {
  assert.equal(hashEtichetta('spawn'), hashEtichetta('spawn'));
  assert.notEqual(hashEtichetta('spawn'), hashEtichetta('drop'));
  const r = creaRng(7);
  for (let i = 0; i < 200; i++) {
    const n = intero(r, 3, 5);
    assert.ok(n >= 3 && n <= 5 && Number.isInteger(n));
  }
  const lista = ['a', 'b', 'c'];
  assert.ok(lista.includes(scegli(r, lista)));
  const mescolata = mescola(r, lista);
  assert.deepEqual([...mescolata].sort(), lista);
  assert.deepEqual(lista, ['a', 'b', 'c']);
});

// ---------------------------------------------------------------------------------------------
// eventi.js (storia 004)
// ---------------------------------------------------------------------------------------------

test('eventi: il payload arriva in modo sincrono e un ascoltatore rimosso non riceve più', () => {
  const bus = creaBus({ log: logFinto() });
  const ricevuti = [];
  const fn = (p) => ricevuti.push(p);
  const off = bus.on('nemico.morto', fn);
  const payload = { id: 'g1', x: 10, y: 20 };
  const raggiunti = bus.emit('nemico.morto', payload);
  assert.equal(raggiunti, 1);
  assert.deepEqual(ricevuti, [payload]);
  assert.equal(ricevuti[0], payload);

  off();
  bus.emit('nemico.morto', { id: 'g2' });
  assert.equal(ricevuti.length, 1);

  bus.on('nemico.morto', fn);
  bus.off('nemico.morto', fn);
  bus.emit('nemico.morto', { id: 'g3' });
  assert.equal(ricevuti.length, 1);
  assert.equal(bus.conta('nemico.morto'), 0);
});

test('eventi: un errore in un ascoltatore è isolato e loggato una volta', () => {
  const log = logFinto();
  const bus = creaBus({ log });
  const ordine = [];
  bus.on('x', () => ordine.push('a'));
  bus.on('x', () => { throw new Error('rotto'); });
  bus.on('x', () => ordine.push('c'));
  bus.emit('x', null);
  assert.deepEqual(ordine, ['a', 'c']);
  assert.equal(log.voci.length, 1);
  bus.emit('x', null);
  assert.equal(log.voci.length, 2);
});

test('eventi: off durante emit è sicuro e azzera svuota tutto', () => {
  const bus = creaBus({ log: logFinto() });
  let conta = 0;
  const off = bus.on('x', () => { conta++; off(); });
  bus.on('x', () => { conta++; });
  bus.emit('x');
  bus.emit('x');
  assert.equal(conta, 3);
  bus.azzera();
  assert.equal(bus.emit('x'), 0);
});

// ---------------------------------------------------------------------------------------------
// tempo.js (storia 001)
// ---------------------------------------------------------------------------------------------

test('tempo: 60 frame da 16,667 ms producono 60 tick in 1000 ms', () => {
  const t = creaTempo();
  assert.ok(Math.abs(t.passoMs - 16.667) < 0.001);
  let tick = 0;
  for (let i = 0; i < 60; i++) tick += t.avanza(1000 / 60);
  assert.equal(tick, 60);
  assert.ok(t.alpha() >= 0 && t.alpha() < 1);
});

test('tempo: frame irregolari che sommano 1000 ms danno 60 ± 1 tick', () => {
  const t = creaTempo();
  const frame = [12, 20, 15, 18, 16, 17, 14, 19, 16, 16, 11, 21, 17, 15, 16, 17, 16, 16, 14, 18];
  const totale = frame.reduce((s, x) => s + x, 0);
  let tick = 0;
  let trascorso = 0;
  let i = 0;
  while (trascorso < 1000) {
    const dt = Math.min(frame[i++ % frame.length], 1000 - trascorso);
    trascorso += dt;
    tick += t.avanza(dt);
  }
  assert.equal(trascorso, 1000);
  assert.ok(totale > 0);
  assert.ok(Math.abs(tick - 60) <= 1, `tick = ${tick}`);
});

test('tempo: un frame di 200 ms esegue al massimo 5 tick e scarta il resto', () => {
  const t = creaTempo();
  assert.equal(t.avanza(200), MAX_TICK_PER_FRAME);
  assert.equal(t.residuo(), 0);
  assert.equal(t.avanza(10), 0);
  assert.ok(Math.abs(t.alpha() - 10 / PASSO_MS) < 1e-9);
});

test('tempo: dt non positivi o NaN non avanzano; ticksDaMs converte i tempi dei GDD', () => {
  const t = creaTempo();
  assert.equal(t.avanza(0), 0);
  assert.equal(t.avanza(-5), 0);
  assert.equal(t.avanza(NaN), 0);
  assert.equal(t.ticksDaMs(160), 10);
  assert.equal(t.ticksDaMs(1000), 60);
  assert.equal(t.ticksDaMs(1), 1);
  assert.equal(t.ticksDaMs(0), 0);
});

// ---------------------------------------------------------------------------------------------
// ciclo.js (storia 001)
// ---------------------------------------------------------------------------------------------

/** Ciclo con rAF finto guidato a mano. */
function cicloFinto(statoIniziale) {
  const coda = [];
  const eventi = creaBus({ log: logFinto() });
  const ciclo = creaCiclo({
    tempo: creaTempo(),
    eventi,
    richiediFrame: (fn) => { coda.push(fn); return coda.length; },
    annullaFrame: () => { coda.length = 0; },
    ora: () => 0,
    statoIniziale,
  });
  const pompa = (oraMs) => { const fn = coda.shift(); if (fn) fn(oraMs); };
  return { ciclo, eventi, pompa, coda };
}

test('ciclo: i sistemi ricevono tick(dt) a passo fisso e disegna(alpha) una volta per frame', () => {
  const { ciclo, pompa } = cicloFinto();
  const registro = [];
  ciclo.registra({ tick: (dt) => registro.push(['tick', dt]), disegna: (a) => registro.push(['disegna', a]) });
  ciclo.avvia();
  pompa(0);
  pompa(1000 / 60 * 2);
  const tick = registro.filter(([k]) => k === 'tick');
  const disegni = registro.filter(([k]) => k === 'disegna');
  assert.equal(tick.length, 2);
  assert.ok(Math.abs(tick[0][1] - PASSO_MS / 1000) < 1e-12);
  assert.equal(disegni.length, 2);
  assert.equal(ciclo.contaTick(), 2);
  ciclo.ferma();
  assert.equal(ciclo.attivo(), false);
});

test('ciclo: un frame lungo 200 ms esegue al massimo 5 tick', () => {
  const { ciclo, pompa } = cicloFinto();
  ciclo.avvia();
  pompa(0);
  pompa(200);
  assert.equal(ciclo.contaTick(), MAX_TICK_PER_FRAME);
});

test('ciclo: tick(n) forza n tick e i sistemi filtrati per stato girano solo lì', () => {
  const { ciclo } = cicloFinto('hub');
  let tuttiGliStati = 0;
  let soloNotte = 0;
  ciclo.registra({ tick: () => tuttiGliStati++ });
  ciclo.registra({ tick: () => soloNotte++ }, { stati: ['notte'] });
  assert.equal(ciclo.tick(3), 3);
  assert.equal(tuttiGliStati, 3);
  assert.equal(soloNotte, 0);
  ciclo.vaiA('notte');
  ciclo.tick(2);
  assert.equal(soloNotte, 2);
});

test('ciclo: la macchina degli stati segue la tabella e annuncia i cambi', () => {
  const { ciclo, eventi } = cicloFinto();
  const cambi = [];
  eventi.on('ciclo.stato', (p) => cambi.push(p));
  assert.equal(ciclo.stato(), 'menu');
  assert.deepEqual([...STATI], ['menu', 'hub', 'notte', 'pausa']);
  assert.throws(() => ciclo.vaiA('notte'), RangeError);
  assert.throws(() => ciclo.vaiA('inesistente'), RangeError);
  ciclo.vaiA('hub');
  ciclo.vaiA('notte');
  ciclo.vaiA('pausa');
  ciclo.vaiA('notte');
  ciclo.vaiA('hub');
  assert.deepEqual(cambi.map((c) => `${c.da}>${c.a}`), ['menu>hub', 'hub>notte', 'notte>pausa', 'pausa>notte', 'notte>hub']);
  for (const [da, versi] of Object.entries(TRANSIZIONI)) {
    for (const a of versi) assert.ok(STATI.includes(a), `${da} -> ${a}`);
  }
});

// ---------------------------------------------------------------------------------------------
// input.js, parte pura (storia 002)
// ---------------------------------------------------------------------------------------------

test('input: WASD o frecce in diagonale danno un vettore di lunghezza 1', () => {
  const input = creaInput(mappaInput());
  input.tastoGiu('KeyW');
  input.tastoGiu('KeyD');
  input.inizioTick();
  const d = input.direzione();
  assert.ok(Math.abs(Math.hypot(d.x, d.y) - 1) < 1e-12);
  assert.ok(d.x > 0 && d.y < 0);
  input.tastoSu('KeyW');
  input.tastoSu('KeyD');
  input.tastoGiu('ArrowLeft');
  input.tastoGiu('ArrowDown');
  input.inizioTick();
  const e = input.direzione();
  assert.ok(Math.abs(Math.hypot(e.x, e.y) - 1) < 1e-12);
  assert.ok(e.x < 0 && e.y > 0);
  input.tastoGiu('ArrowRight');
  assert.deepEqual(input.direzione(), { x: 0, y: 1 });
});

test('input: premuto è vero una sola volta, tenuto finché è giù, rilasciato nel tick del rilascio', () => {
  const input = creaInput(mappaInput());
  input.tastoGiu('KeyJ');
  input.tastoGiu('KeyJ'); // ripetizione automatica: ignorata
  input.inizioTick();
  assert.equal(input.premuto('attacco'), true);
  assert.equal(input.premuto('attacco'), true); // stabile dentro il tick
  assert.equal(input.tenuto('attacco'), true);
  input.inizioTick();
  assert.equal(input.premuto('attacco'), false);
  assert.equal(input.tenuto('attacco'), true);
  input.tastoSu('KeyJ');
  assert.equal(input.tenuto('attacco'), false);
  input.inizioTick();
  assert.equal(input.rilasciato('attacco'), true);
  input.inizioTick();
  assert.equal(input.rilasciato('attacco'), false);
});

test('input: una pressione e un rilascio tra due tick non vanno persi', () => {
  const input = creaInput(mappaInput());
  input.tastoGiu('Space');
  input.tastoSu('Space');
  input.inizioTick();
  assert.equal(input.premuto('scatto'), true);
  assert.equal(input.premuto('avanza'), true);
  assert.equal(input.rilasciato('scatto'), true);
  assert.equal(input.tenuto('scatto'), false);
});

test('input: azzera (blur) non lascia tasti incastrati e segnala il rilascio', () => {
  const input = creaInput(mappaInput());
  input.tastoGiu('KeyD');
  input.tastoGiu('KeyJ');
  input.bottoneMouseGiu(0);
  input.inizioTick();
  assert.equal(input.tenuto('destra'), true);
  input.azzera();
  assert.equal(input.tenuto('destra'), false);
  assert.equal(input.tenuto('attacco'), false);
  assert.deepEqual(input.direzione(), { x: 0, y: 0 });
  input.inizioTick();
  assert.equal(input.rilasciato('destra'), true);
  assert.equal(input.rilasciato('attacco'), true);
  // al ritorno del focus un nuovo keydown è una nuova pressione
  input.tastoGiu('KeyD');
  input.inizioTick();
  assert.equal(input.premuto('destra'), true);
});

test('input: la levetta oltre la zona morta guida la direzione e A/X/B/RB mappano le azioni', () => {
  const input = creaInput(mappaInput());
  input.aggiornaGamepad(gamepadFinto({ assi: [0.1, -0.1] }));
  input.inizioTick();
  assert.deepEqual(input.direzione(), { x: 0, y: 0 });
  input.aggiornaGamepad(gamepadFinto({ assi: [0.6, 0.6], premuti: [0, 2, 1, 5] }));
  input.inizioTick();
  const d = input.direzione();
  assert.ok(Math.abs(Math.hypot(d.x, d.y) - 1) < 1e-12);
  assert.ok(d.x > 0 && d.y > 0);
  assert.equal(input.premuto('attacco'), true);
  assert.equal(input.premuto('parata'), true);
  assert.equal(input.premuto('scatto'), true);
  assert.equal(input.premuto('interagisci'), true);
  input.aggiornaGamepad(gamepadFinto({ assi: [0.6, 0.6] }));
  input.inizioTick();
  assert.equal(input.rilasciato('attacco'), true);
  assert.equal(input.tenuto('attacco'), false);
  input.aggiornaGamepad(null); // scollegato
  input.inizioTick();
  assert.deepEqual(input.direzione(), { x: 0, y: 0 });
});

test('input: la sonda del gamepad è letta a ogni inizioTick e la tastiera ha la precedenza sulla levetta', () => {
  const input = creaInput(mappaInput());
  input.impostaSondaGamepad(() => gamepadFinto({ assi: [-1, 0] }));
  input.inizioTick();
  assert.deepEqual(input.direzione(), { x: -1, y: 0 });
  input.tastoGiu('KeyD');
  assert.deepEqual(input.direzione(), { x: 1, y: 0 });
  input.muoviMouse(640, 360);
  assert.deepEqual(input.mouse(), { x: 640, y: 360, dentro: true });
  assert.throws(() => creaInput({}), TypeError);
});

// ---------------------------------------------------------------------------------------------
// parametri.js (storia 003)
// ---------------------------------------------------------------------------------------------

test('parametri: la validazione accetta {base,min,max} e segnala le voci malformate', () => {
  const ok = validaStatistiche('f', statisticheValide());
  assert.deepEqual(ok.errori, []);
  assert.ok(eStatistica({ base: 1, min: 0, max: 2 }));
  assert.ok(!eStatistica([1, 2]));

  const rotto = validaStatistiche('f', {
    senzaRange: 5,
    minMaggiore: { base: 1, min: 3, max: 2 },
    nonNumerico: { base: 'x', min: 0, max: 1 },
    gruppo: { fuori: { base: 500, min: 150, max: 330 } },
  });
  assert.equal(rotto.errori.length, 4);
  assert.ok(rotto.errori.some((e) => e.startsWith('f.senzaRange')));
  assert.ok(rotto.errori.some((e) => e.startsWith('f.minMaggiore')));
  assert.ok(rotto.errori.some((e) => e.startsWith('f.nonNumerico')));
  assert.ok(rotto.errori.some((e) => e.includes('f.gruppo.fuori') && e.includes('fuori')));
  assert.equal(rotto.albero.gruppo.fuori.base, 330, 'il base fuori range è riportato nel range');
  assert.equal(validaStatistiche('f', 'no').errori.length, 1);
});

test('parametri: leggiOverrideUrl legge p.* solo con debug=1', () => {
  const con = leggiOverrideUrl('?debug=1&p.combattimento.portata=90&p.x.flag=true&altro=1');
  assert.equal(con.debug, true);
  assert.deepEqual(con.override, { 'combattimento.portata': 90, 'x.flag': true });
  const senza = leggiOverrideUrl('?p.combattimento.portata=90');
  assert.equal(senza.debug, false);
  assert.deepEqual(senza.override, {});
  assert.deepEqual(leggiOverrideUrl('').override, {});
});

test('parametri: applicaOverride cambia il base, riporta nel range e segnala le chiavi sconosciute', () => {
  const radice = { f: statisticheValide() };
  const errori = applicaOverride(radice, {
    'f.v_base': 200,
    'f.gruppo.t_x': 999,
    'f.inesistente': 1,
    'f.gruppo': 1,
    'f.v_base_2': 'abc',
  }, 'test');
  assert.equal(radice.f.v_base.base, 200);
  assert.equal(radice.f.gruppo.t_x.base, 20);
  assert.equal(errori.length, 4, errori.join('\n'));
  assert.ok(errori.some((e) => e.includes('t_x') && e.includes('fuori')));
  assert.ok(errori.some((e) => e.includes("'f.inesistente'")));
  assert.ok(errori.some((e) => e.includes("'f.v_base_2'")));
  assert.ok(errori.some((e) => e.includes("'f.gruppo'") && e.includes('gruppo, non un parametro')));
  assert.equal(applicaOverride(radice, { 'f.v_base': 'abc' }).length, 1);
});

test('parametri: carica valida, applica le sovrascritture e get restituisce il base', async () => {
  const log = logFinto();
  const p = creaParametri({ log });
  assert.throws(() => p.get('f.v_base'), RangeError);
  const file = {
    f: statisticheValide(),
    c: { portata: { base: 70, min: 56, max: 96 }, rotta: { base: 1000, min: 0, max: 10 } },
    tab: { tastiera: { attacco: ['KeyJ'] }, soglia: 3 },
    ridotto: { 'f.gruppo.t_x': 0 },
  };
  const errori = await p.carica({
    caricatore: (nome) => Promise.resolve(JSON.parse(JSON.stringify(file[nome]))),
    statistiche: ['f', 'c'],
    tabelle: ['tab'],
    sovrascritture: ['ridotto'],
    override: { 'c.portata': 90, 'tab.soglia': 4 },
  });
  assert.equal(errori.length, 1, errori.join('\n'));
  assert.ok(errori[0].includes('c.rotta'));
  assert.equal(log.voci.length, 1, 'ogni errore di contenuto è loggato una volta');
  assert.equal(p.get('f.v_base'), 220);
  assert.equal(p.get('c.rotta'), 10, 'il base fuori range è riportato nel range');
  assert.equal(p.get('c.portata'), 90, 'override da URL applicato');
  assert.equal(p.get('f.gruppo.t_x'), 0, 'sovrascrittura da file applicata');
  assert.equal(p.get('tab.soglia'), 4);
  assert.deepEqual(p.get('tab.tastiera.attacco'), ['KeyJ']);
  assert.ok(Object.isFrozen(p.get('tab.tastiera')));
  assert.deepEqual(p.statistica('c.portata'), { base: 90, min: 56, max: 96 });
  assert.equal(p.ha('c.portata'), true);
  assert.equal(p.ha('c.nulla'), false);
  assert.throws(() => p.get('c.nulla'), RangeError);
  assert.throws(() => p.statistica('tab.soglia'), RangeError);
  assert.equal(p.imposta('c.portata', 60).length, 0);
  assert.equal(p.get('c.portata'), 60);
  assert.equal(p.imposta('c.portata', 1000).length, 1);
  assert.equal(p.get('c.portata'), 96);
  assert.equal(p.tutti().c.portata.base, 96);
});

test('parametri: senza debug gli override dell\'URL non toccano i valori', async () => {
  const p = creaParametri({ log: logFinto() });
  const { override } = leggiOverrideUrl('?p.c.portata=90');
  await p.carica({
    caricatore: () => ({ portata: { base: 70, min: 56, max: 96 } }),
    statistiche: ['c'],
    override,
  });
  assert.equal(p.get('c.portata'), 70);
});

// ---------------------------------------------------------------------------------------------
// Controlli di contenuto sui file reali (storia 003, criteri 2 e 4)
// ---------------------------------------------------------------------------------------------

test('contenuti: i JSON di statistiche sono validi e la mappa dei tasti copre le 12 azioni', () => {
  const cartella = join(RADICE_GIOCO, 'contenuti', 'parametri');
  const leggi = (nome) => JSON.parse(readFileSync(join(cartella, `${nome}.json`), 'utf8'));
  for (const nome of ['ferruccio', 'combattimento']) {
    const { errori } = validaStatistiche(nome, leggi(nome));
    assert.deepEqual(errori, [], `${nome}.json: ${errori.join('; ')}`);
  }
  const radice = { ferruccio: leggi('ferruccio'), combattimento: leggi('combattimento') };
  assert.deepEqual(applicaOverride(radice, leggi('moto-ridotto'), 'moto-ridotto'), []);
  assert.equal(radice.ferruccio.feel.scossa_px.base, 0);

  const input = leggi('input');
  const azioni = ['sinistra', 'destra', 'su', 'giu', 'attacco', 'parata', 'scatto', 'interagisci', 'avanza', 'conferma', 'indietro', 'menu'];
  for (const a of azioni) assert.ok(Array.isArray(input.tastiera[a]) && input.tastiera[a].length > 0, `tastiera.${a}`);
  for (const a of ['attacco', 'parata', 'scatto', 'interagisci']) assert.ok(input.gamepad.bottoni[a]?.length > 0, `gamepad.${a}`);
  assert.equal(input.gamepad.zona_morta, 0.2);
  creaInput(input); // la mappa reale è accettata
});

test('motore: zero occorrenze di Math.random in gioco/motore/', () => {
  const trova = (cartella) => {
    const esito = [];
    for (const voce of readdirSync(cartella)) {
      const percorso = join(cartella, voce);
      if (statSync(percorso).isDirectory()) esito.push(...trova(percorso));
      else if (voce.endsWith('.js') && readFileSync(percorso, 'utf8').includes('Math.random')) esito.push(percorso);
    }
    return esito;
  };
  assert.deepEqual(trova(join(RADICE_GIOCO, 'motore')), []);
});
