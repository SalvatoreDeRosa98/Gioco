/**
 * gioco/qa/combattimento.test.mjs — Test unitari delle storie 007-011 (Ferruccio e combattimento), senza DOM.
 *
 * Esecuzione: `node gioco/qa/combattimento.test.mjs` dalla radice del repository (node:test, Node ≥ 20).
 * Ciclo simulato a tick fissi (16,667 ms) nell'ordine del gioco: input → Ferruccio → combattimento →
 * bersagli → proiettili. I parametri sono i JSON reali di `contenuti/parametri/`; l'input è la mappa
 * reale (`input.json`) pilotata con sorgenti sintetiche. Un caso per ogni criterio Given-When-Then
 * delle cinque storie, più fisica, modificatori e prestazioni (20 bersagli, ≤ 0,5 ms per tick).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import { creaTempo } from '../motore/fondazione/tempo.js';
import { creaBus } from '../motore/fondazione/eventi.js';
import { creaInput } from '../motore/fondazione/input.js';
import { creaParametri, validaStatistiche } from '../motore/fondazione/parametri.js';
import { creaModificatori } from '../motore/oggetti/modificatori.js';
import {
  creaCampo, muoviCerchio, settoreColpisceCerchio, rettangoloColpisceCerchio, lineaLibera, separazioneCerchi,
} from '../motore/mondo/fisica.js';
import { creaFerruccio, STATI_CORPO } from '../motore/attori/ferruccio.js';
import { creaCombattimento } from '../motore/attori/combattimento.js';
import { creaFantoccio, creaProiettile } from '../motore/attori/bersaglio.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const CARTELLA_PARAMETRI = join(QUI, '..', 'contenuti', 'parametri');
const SCENA = Object.freeze({ larghezza: 1280, altezza: 720 });

const leggiJson = (nome) => JSON.parse(readFileSync(join(CARTELLA_PARAMETRI, `${nome}.json`), 'utf8'));

/** Logger finto: raccoglie gli errori invece di stamparli. */
function logFinto() {
  const voci = [];
  return { voci, error: (...a) => voci.push(a) };
}

/**
 * Mondo di prova: fondazione + campo + Ferruccio + combattimento, con bersagli e proiettili.
 * Gli override di statistica (`{ 'ferruccio.v_base': 200 }`) si applicano ai parametri.
 */
async function creaMondo({ ostacoli = [], override = {}, ferruccioX = null, ferruccioY = null } = {}) {
  const log = logFinto();
  const parametri = creaParametri({ log });
  await parametri.carica({
    caricatore: (nome) => leggiJson(nome),
    statistiche: ['ferruccio', 'combattimento', 'stanza'],
    tabelle: ['input'],
    override,
  });
  assert.deepEqual(parametri.errori(), [], 'i JSON reali devono essere validi');
  const tempo = creaTempo();
  const eventi = creaBus({ log });
  const input = creaInput(parametri.get('input'));
  const mod = creaModificatori(parametri);
  const campo = creaCampo({
    colonne: parametri.get('stanza.colonne'),
    righe: parametri.get('stanza.righe'),
    cella: parametri.get('stanza.cella'),
    scenaLarghezza: SCENA.larghezza,
    scenaAltezza: SCENA.altezza,
    ostacoli,
  });
  const centro = { x: campo.x + campo.larghezza / 2, y: campo.y + campo.altezza / 2 };
  const ferruccio = creaFerruccio({
    modificatori: mod, tempo, eventi, input, campo, x: ferruccioX ?? centro.x, y: ferruccioY ?? centro.y,
  });
  const bersagli = [];
  const proiettili = [];
  const comb = creaCombattimento({ modificatori: mod, tempo, eventi, input, campo, ferruccio, bersagli: () => bersagli });
  const ricevuti = [];
  for (const nome of ['ferruccio.colpo', 'ferruccio.uccisione', 'ferruccio.parata', 'ferruccio.parata_mancata',
    'ferruccio.affondo', 'ferruccio.danno', 'ferruccio.morto', 'ferruccio.scatto', 'ferruccio.scatto_vuoto']) {
    eventi.on(nome, (p) => ricevuti.push({ nome, payload: p }));
  }
  const tasto = (azione) => `t:${parametri.get(`input.tastiera.${azione}`)[0]}`;
  let contatore = 0;
  const mondo = {
    parametri, tempo, eventi, input, mod, campo, centro, ferruccio, comb, bersagli, proiettili, ricevuti, log,
    get tickCorrente() { return contatore; },
    /** Esegue n tick nell'ordine del gioco. */
    tick(n = 1) {
      for (let i = 0; i < n; i++) {
        input.inizioTick();
        ferruccio.tick(tempo.passoS);
        comb.tick(tempo.passoS);
        for (const b of bersagli) b.tick(tempo.passoS);
        for (const p of proiettili) p.tick(tempo.passoS);
        contatore++;
      }
    },
    tieni: (azione) => input.sorgenteGiu(tasto(azione)),
    lascia: (azione) => input.sorgenteSu(tasto(azione)),
    /** Pressione breve: giù, un tick, su. */
    premi(azione) {
      input.sorgenteGiu(tasto(azione));
      mondo.tick(1);
      input.sorgenteSu(tasto(azione));
    },
    /** Fantoccio collegato a Ferruccio come bersaglio, aggiunto alla lista. */
    fantoccio(opzioni) {
      const f = creaFantoccio({ modificatori: mod, tempo, eventi, campo, bersaglio: comb.comeBersaglio, ...opzioni });
      bersagli.push(f);
      return f;
    },
    eventiDi: (nome) => ricevuti.filter((e) => e.nome === nome),
    msDaTick: (n) => n * tempo.passoMs,
  };
  return mondo;
}

/** Fa correre il mondo finché `cond()` è vera, al massimo `max` tick; restituisce i tick trascorsi. */
function finche(mondo, cond, max = 600) {
  for (let i = 0; i < max; i++) {
    if (cond()) return i;
    mondo.tick(1);
  }
  throw new Error(`condizione non raggiunta in ${max} tick`);
}

// ---------------------------------------------------------------------------------------------
// Contenuti e modificatori (ADR-0002)
// ---------------------------------------------------------------------------------------------

test('contenuti: i nuovi JSON (stanza, voci aggiunte a combattimento) sono statistiche valide', () => {
  for (const nome of ['ferruccio', 'combattimento', 'stanza']) {
    const { errori } = validaStatistiche(nome, leggiJson(nome));
    assert.deepEqual(errori, [], `${nome}.json: ${errori.join('; ')}`);
  }
  const c = leggiJson('combattimento');
  for (const chiave of ['t_startup_affondo', 't_recupero_affondo', 'lama_affondo', 't_buffer_parata', 'v_riflesso']) {
    assert.ok('base' in c[chiave], `combattimento.${chiave}`);
  }
  for (const chiave of ['t_anticipo', 't_lampo', 't_impatto', 't_colpo', 't_recupero', 't_cooldown', 'vita', 'r', 'peso']) {
    assert.ok('base' in c.fantoccio[chiave], `combattimento.fantoccio.${chiave}`);
  }
});

test('modificatori: valore = clamp((base + somme) × moltiplicatori); t_finestra_p 320 → 300', async () => {
  const m = await creaMondo();
  assert.equal(m.mod.valore('ferruccio.v_base'), 220);
  const via = m.mod.applica({ statistica: 'ferruccio.v_base', operazione: 'moltiplica', valore: 1.12 });
  const via2 = m.mod.applica({ statistica: 'ferruccio.v_base', operazione: 'moltiplica', valore: 0.9 });
  assert.ok(Math.abs(m.mod.valore('ferruccio.v_base') - 221.76) < 1e-9);
  via();
  via2();
  m.mod.applica({ statistica: 'combattimento.t_finestra_p', operazione: 'somma', valore: 140 });
  assert.equal(m.mod.valore('combattimento.t_finestra_p'), 300);
  assert.throws(() => m.mod.applica({ statistica: 'combattimento.inesistente', operazione: 'somma', valore: 1 }), RangeError);
  assert.throws(() => m.mod.applica({ statistica: 'combattimento.danno', operazione: 'dividi', valore: 1 }), RangeError);
});

// ---------------------------------------------------------------------------------------------
// Fisica (mondo/fisica.js)
// ---------------------------------------------------------------------------------------------

test('fisica: campo 13×7 centrato in 1280×720, scivolamento lungo il muro, linea di colpo, separazione', async () => {
  const m = await creaMondo({ ostacoli: [{ colonna: 7, riga: 3, id: 'colonna' }] });
  assert.equal(m.campo.x, 224);
  assert.equal(m.campo.y, 136);
  assert.equal(m.campo.larghezza, 832);
  assert.equal(m.campo.altezza, 448);
  // diagonale contro il muro destro: la x si blocca, la y prosegue
  const r = 14;
  const bordo = m.campo.x + m.campo.larghezza;
  const e = muoviCerchio(m.campo, bordo - r - 2, 300, r, 10, 10);
  assert.ok(e.urtoX && !e.urtoY);
  assert.equal(e.x, bordo - r);
  assert.equal(e.y, 310);
  // linea di colpo: la colonna in (7,3) blocca il segmento che la attraversa
  const cx = m.campo.x + 7.5 * 64;
  const cy = m.campo.y + 3.5 * 64;
  assert.equal(lineaLibera(m.campo, cx - 100, cy, cx + 100, cy), false);
  assert.equal(lineaLibera(m.campo, cx - 100, cy - 100, cx + 100, cy - 100), true);
  // separazione di cerchi sovrapposti
  const sep = separazioneCerchi({ x: 0, y: 0, r: 14 }, { x: 20, y: 0, r: 16 });
  assert.ok(Math.abs(sep.x - (-10)) < 1e-9 && sep.y === 0);
  assert.equal(separazioneCerchi({ x: 0, y: 0, r: 14 }, { x: 40, y: 0, r: 16 }), null);
});

test('fisica: area_fendente (esempio del GDD: gatto r 16 a 80 px e 40° fuori asse → colpito) e rettangolo spazzato', () => {
  const settore = { x: 0, y: 0, angolo: 0, portata: 70, arcoGradi: 110 };
  const a = (40 * Math.PI) / 180;
  assert.equal(settoreColpisceCerchio(settore, { x: 80 * Math.cos(a), y: 80 * Math.sin(a), r: 16 }), true);
  assert.equal(settoreColpisceCerchio(settore, { x: 95, y: 0, r: 16 }), false);
  const b = (60 * Math.PI) / 180;
  assert.equal(settoreColpisceCerchio(settore, { x: 80 * Math.cos(b), y: 80 * Math.sin(b), r: 16 }), false);
  assert.equal(settoreColpisceCerchio({ ...settore, arcoGradi: 150 }, { x: 80 * Math.cos(b), y: 80 * Math.sin(b), r: 16 }), true);
  const rett = { x1: 0, y1: 0, x2: 100, y2: 0, larghezza: 32 };
  assert.equal(rettangoloColpisceCerchio(rett, { x: 60, y: 20, r: 10 }), true);
  assert.equal(rettangoloColpisceCerchio(rett, { x: 60, y: 40, r: 10 }), false);
  assert.equal(rettangoloColpisceCerchio(rett, { x: 130, y: 0, r: 10 }), false);
});

// ---------------------------------------------------------------------------------------------
// Storia 007 — movimento, mura, scatto
// ---------------------------------------------------------------------------------------------

test('007: diagonale alto-destra tenuta 1 s → 220 ± 5 px lungo la diagonale (velocità normalizzata)', async () => {
  const m = await creaMondo();
  const x0 = m.ferruccio.x;
  const y0 = m.ferruccio.y;
  m.tieni('su');
  m.tieni('destra');
  m.tick(60);
  const dx = m.ferruccio.x - x0;
  const dy = m.ferruccio.y - y0;
  const d = Math.hypot(dx, dy);
  assert.ok(Math.abs(d - 220) <= 5, `spostamento ${d.toFixed(2)} px`);
  assert.ok(Math.abs(dx + dy) < 1e-6, `diagonale: dx ${dx.toFixed(2)} dy ${dy.toFixed(2)}`);
  assert.equal(m.ferruccio.stato, 'cammina');
  m.lascia('su');
  m.lascia('destra');
  m.tick(5);
  assert.equal(m.ferruccio.stato, 'fermo');
  assert.ok(STATI_CORPO.includes(m.ferruccio.stato));
});

test('007: scatto verso destra → 180 ± 4 px in 160 ± 16 ms, invulnerabile per tutta la durata; il Colpo di un nemico nel tratto non toglie maschere', async () => {
  const m = await creaMondo();
  const nemico = m.fantoccio({ x: m.ferruccio.x + 90, y: m.ferruccio.y });
  const x0 = m.ferruccio.x;
  assert.equal(m.ferruccio.cariche, 1);
  m.premi('scatto');
  assert.equal(m.ferruccio.stato, 'scatta');
  assert.equal(m.eventiDi('ferruccio.scatto').length, 1);
  assert.deepEqual(m.eventiDi('ferruccio.scatto')[0].payload.direzione, { x: 1, y: 0 });
  let tickScatto = 1;
  let sempreInvulnerabile = m.ferruccio.invulnerabile();
  while (m.ferruccio.stato === 'scatta') {
    // un Colpo nemico che lo raggiunge durante lo scatto
    assert.equal(m.comb.ricevi({ pesante: false, x: nemico.x, y: nemico.y, attaccante: nemico }), 'ignorato');
    m.tick(1);
    tickScatto++;
    sempreInvulnerabile = sempreInvulnerabile && (m.ferruccio.stato !== 'scatta' || m.ferruccio.invulnerabile());
  }
  const durataMs = (tickScatto - 1) * m.tempo.passoMs;
  assert.ok(Math.abs(durataMs - 160) <= 16, `durata ${durataMs.toFixed(1)} ms`);
  assert.ok(Math.abs(m.ferruccio.x - x0 - 180) <= 4, `distanza ${(m.ferruccio.x - x0).toFixed(2)} px`);
  assert.ok(sempreInvulnerabile);
  assert.equal(m.ferruccio.maschere, 5);
  assert.equal(m.ferruccio.stato, 'recupero_scatto');
  assert.equal(m.ferruccio.cariche, 0);
  assert.equal(m.eventiDi('ferruccio.danno').length, 0);
});

test('007: con 0 cariche lo scatto non fa nulla e non è accodato; la carica torna dopo 1200 ms', async () => {
  const m = await creaMondo();
  m.premi('scatto');
  const tickConsumo = m.tickCorrente - 1;
  finche(m, () => m.ferruccio.stato === 'fermo');
  assert.equal(m.ferruccio.cariche, 0);
  const x0 = m.ferruccio.x;
  m.premi('scatto');
  assert.equal(m.ferruccio.stato, 'fermo');
  assert.equal(m.eventiDi('ferruccio.scatto').length, 1, 'nessun secondo scatto');
  assert.equal(m.eventiDi('ferruccio.scatto_vuoto').length, 1, 'segnale a vuoto per il suono');
  m.tick(10);
  assert.equal(m.ferruccio.x, x0);
  assert.equal(m.eventiDi('ferruccio.scatto').length, 1, 'niente scatto accodato');
  // la carica torna 1200 ms (72 tick) dopo il consumo
  const n = finche(m, () => m.ferruccio.cariche === 1);
  const msDalConsumo = (m.tickCorrente - tickConsumo) * m.tempo.passoMs;
  assert.ok(Math.abs(msDalConsumo - 1200) <= 2 * m.tempo.passoMs, `carica tornata dopo ${msDalConsumo.toFixed(1)} ms (${n} tick di attesa)`);
});

test('007: scatto verso un muro a 20 px → si ferma al muro e resta invulnerabile fino a 160 ms', async () => {
  const bordo = 224 + 832;
  const m = await creaMondo({ ferruccioX: bordo - 14 - 20 });
  m.premi('scatto');
  let ticks = 1;
  while (m.ferruccio.stato === 'scatta') {
    assert.ok(m.ferruccio.invulnerabile());
    assert.ok(m.ferruccio.x <= bordo - 14 + 1e-9, 'mai dentro il muro');
    m.tick(1);
    ticks++;
  }
  assert.ok(Math.abs(m.ferruccio.x - (bordo - 14)) < 1e-9, `fermo al muro: x ${m.ferruccio.x}`);
  const durataMs = (ticks - 1) * m.tempo.passoMs;
  assert.ok(Math.abs(durataMs - 160) <= 16, `invulnerabile per ${durataMs.toFixed(1)} ms`);
});

test('007: mod_velocita 0,5 → velocità 150 px/s (clamp), non 110', async () => {
  const m = await creaMondo();
  m.mod.applica({ statistica: 'ferruccio.v_base', operazione: 'moltiplica', valore: 0.5 });
  assert.equal(m.mod.valore('ferruccio.v_base'), 150);
  m.tieni('destra');
  m.tick(20);
  const x0 = m.ferruccio.x;
  m.tick(6);
  const v = (m.ferruccio.x - x0) / (6 * m.tempo.passoS);
  assert.ok(Math.abs(v - 150) < 1e-6, `velocità ${v.toFixed(3)} px/s`);
});

// ---------------------------------------------------------------------------------------------
// Storia 008 — maschere, danno, invulnerabilità, spinta, morte
// ---------------------------------------------------------------------------------------------

test('008: Colpo con 5 maschere → 4, spinta a 260 px/s decadente in 150 ms, 800 ms di invulnerabilità', async () => {
  const m = await creaMondo();
  const gatto = m.fantoccio({ x: m.ferruccio.x + 40, y: m.ferruccio.y });
  gatto.attacca();
  const x0 = m.ferruccio.x;
  const tImpatto = finche(m, () => gatto.impatti.length === 1);
  assert.ok(Math.abs(tImpatto * m.tempo.passoMs - (500 + 252)) <= m.tempo.passoMs, `impatto a ${tImpatto} tick`);
  assert.deepEqual(gatto.impatti, ['danno']);
  assert.equal(m.ferruccio.maschere, 4);
  assert.equal(m.ferruccio.stato, 'colpito');
  assert.ok(m.ferruccio.inSpinta());
  const danno = m.eventiDi('ferruccio.danno');
  assert.equal(danno.length, 1);
  assert.equal(danno[0].payload.danno, 1);
  assert.ok(danno[0].payload.direzione.x < 0, 'spinto via dal gatto (che è a destra)');
  // la spinta: 260 px/s al primo tick, decade a zero in 150 ms (9 tick)
  m.tick(1);
  const primoPasso = x0 - m.ferruccio.x;
  assert.ok(Math.abs(primoPasso - 260 * m.tempo.passoS) < 1e-6, `primo passo ${primoPasso.toFixed(3)} px`);
  const nSpinta = finche(m, () => !m.ferruccio.inSpinta(), 30) + 1;
  assert.ok(Math.abs(nSpinta * m.tempo.passoMs - 150) <= m.tempo.passoMs, `spinta durata ${nSpinta} tick`);
  assert.ok(x0 - m.ferruccio.x > 15 && x0 - m.ferruccio.x < 25, `spostato di ${(x0 - m.ferruccio.x).toFixed(1)} px`);
  // un secondo Colpo entro 800 ms non toglie maschere
  assert.equal(m.comb.ricevi({ x: gatto.x, y: gatto.y, attaccante: gatto }), 'ignorato');
  assert.equal(m.ferruccio.maschere, 4);
  const tFine = finche(m, () => !m.ferruccio.invulnerabile());
  const msInvuln = (m.tickCorrente - tImpatto) * m.tempo.passoMs;
  assert.ok(Math.abs(msInvuln - 800) <= m.tempo.passoMs, `invulnerabile per ${msInvuln.toFixed(1)} ms (${tFine})`);
  assert.equal(m.ferruccio.stato, 'fermo');
  assert.equal(m.comb.ricevi({ x: gatto.x, y: gatto.y, attaccante: gatto }), 'danno');
  assert.equal(m.ferruccio.maschere, 3);
});

test('008: il contatto passivo con un gatto in pattuglia non toglie maschere e i corpi si separano', async () => {
  const m = await creaMondo();
  const gatto = m.fantoccio({ x: m.ferruccio.x + 20, y: m.ferruccio.y });
  m.tick(3);
  const d = Math.hypot(gatto.x - m.ferruccio.x, gatto.y - m.ferruccio.y);
  assert.ok(d >= 14 + 16 - 1e-9, `distanza ${d.toFixed(2)} ≥ 30`);
  assert.equal(m.ferruccio.maschere, 5);
  assert.equal(m.eventiDi('ferruccio.danno').length, 0);
  assert.equal(m.ferruccio.stato, 'fermo');
});

test('008: a 1 maschera un attacco pesante porta a 0 ed emette ferruccio.morto entro 200 ms', async () => {
  const m = await creaMondo();
  m.ferruccio.impostaMaschere(1);
  const gatto = m.fantoccio({ x: m.ferruccio.x + 40, y: m.ferruccio.y, pesante: true });
  gatto.attacca();
  const t = finche(m, () => gatto.impatti.length === 1);
  assert.equal(m.ferruccio.maschere, 0);
  assert.equal(m.ferruccio.stato, 'morto');
  const morto = m.eventiDi('ferruccio.morto');
  assert.equal(morto.length, 1);
  assert.equal(m.eventiDi('ferruccio.danno')[0].payload.danno, 1, 'min(2, 1) = 1');
  m.tick(12); // 200 ms dopo: nessun altro evento, stato stabile
  assert.equal(m.eventiDi('ferruccio.morto').length, 1);
  assert.equal(m.ferruccio.stato, 'morto');
  assert.ok(t > 0);
});

test('008: armatura 1 → un attacco pesante toglie 1 maschera (minimo 1); due Colpi nello stesso istante → un solo danno', async () => {
  const m = await creaMondo();
  m.mod.applica({ statistica: 'ferruccio.armatura', operazione: 'somma', valore: 1 });
  assert.equal(m.comb.ricevi({ pesante: true, x: m.ferruccio.x + 30, y: m.ferruccio.y }), 'danno');
  assert.equal(m.ferruccio.maschere, 4);
  // secondo Colpo nello stesso istante: ignorato
  assert.equal(m.comb.ricevi({ pesante: true, x: m.ferruccio.x - 30, y: m.ferruccio.y }), 'ignorato');
  assert.equal(m.ferruccio.maschere, 4);
});

// ---------------------------------------------------------------------------------------------
// Storia 009 — fendente, combo, buffer, cancellazioni, linea di colpo, prestazioni
// ---------------------------------------------------------------------------------------------

test('009: gatto (r 16) a 80 px davanti → 1 danno tra 80 e 180 ms; a 95 px nessun danno', async () => {
  const m = await creaMondo();
  const gatto = m.fantoccio({ x: m.ferruccio.x + 80, y: m.ferruccio.y });
  m.premi('attacco');
  assert.equal(m.comb.stato, 'fendente');
  assert.equal(m.comb.fase, 'startup');
  const t = finche(m, () => gatto.danniSubiti.length === 1) + 1;
  const ms = t * m.tempo.passoMs;
  assert.ok(ms >= 80 && ms <= 180, `colpito a ${ms.toFixed(1)} ms`);
  assert.deepEqual(gatto.danniSubiti, [1]);
  assert.equal(gatto.vita, 5);
  const colpo = m.eventiDi('ferruccio.colpo');
  assert.equal(colpo.length, 1);
  assert.equal(colpo[0].payload.bersaglio, gatto);
  assert.equal(colpo[0].payload.danno, 1);
  assert.deepEqual(colpo[0].payload.direzione, { x: 1, y: 0 });
  assert.equal(Math.hypot(gatto.spinteSubite[0].x, gatto.spinteSubite[0].y), 160, 'spinta_f');
  m.tick(40);
  assert.equal(gatto.danniSubiti.length, 1, 'un solo danno per fendente');

  const m2 = await creaMondo();
  const lontano = m2.fantoccio({ x: m2.ferruccio.x + 95, y: m2.ferruccio.y });
  m2.premi('attacco');
  m2.tick(40);
  assert.deepEqual(lontano.danniSubiti, []);
  assert.equal(m2.comb.stato, 'pronto');
});

test('009: tre pressioni a 200 ms avanzando su un nemico con vita 6 → vita 2,5 e terzo fendente con arco 150°', async () => {
  const m = await creaMondo();
  const nemico = m.fantoccio({ x: m.ferruccio.x + 80, y: m.ferruccio.y, vita: 6, peso: 3 });
  m.tieni('destra');
  let arcoTerzo = null;
  const premiA = (tick) => {
    while (m.tickCorrente < tick) {
      m.tick(1);
      const h = m.comb.hitboxCorrente();
      if (m.comb.numero === 3 && m.comb.fase === 'attivo' && h) arcoTerzo = h.arcoGradi;
    }
    m.premi('attacco');
  };
  premiA(0);
  premiA(12);
  premiA(24);
  for (let i = 0; i < 40; i++) {
    m.tick(1);
    const h = m.comb.hitboxCorrente();
    if (m.comb.numero === 3 && m.comb.fase === 'attivo' && h) arcoTerzo = h.arcoGradi;
  }
  assert.deepEqual(nemico.danniSubiti, [1, 1, 1.5]);
  assert.equal(nemico.vita, 2.5);
  assert.equal(arcoTerzo, 150);
  assert.equal(m.eventiDi('ferruccio.colpo').length, 3);
  assert.equal(m.comb.stato, 'pronto');
});

test('009: la combo si azzera dopo il terzo e se la finestra di 250 ms scade', async () => {
  const m = await creaMondo();
  m.premi('attacco');
  finche(m, () => m.comb.stato === 'pronto');
  m.tick(20); // ben oltre la finestra di combo
  m.premi('attacco');
  assert.equal(m.comb.numero, 1, 'ricomincia dal primo fendente');
});

test('009: attacco premuto durante lo scatto parte se lo scatto finisce entro 150 ms, altrimenti no', async () => {
  // entro: pressione a 2 tick dall'inizio dello scatto (lo scatto finisce 133 ms dopo)
  const m = await creaMondo();
  m.premi('scatto');
  m.tick(1);
  m.premi('attacco');
  assert.equal(m.comb.stato, 'pronto');
  assert.ok(m.comb.bufferAttivo);
  finche(m, () => m.ferruccio.stato !== 'scatta' && m.ferruccio.stato !== 'recupero_scatto');
  m.tick(1);
  assert.equal(m.comb.stato, 'fendente', 'il fendente bufferizzato parte alla fine del recupero dello scatto');
  // oltre: pressione nello stesso tick dello scatto (lo scatto dura 167 ms > 150 ms di buffer)
  const m2 = await creaMondo();
  m2.tieni('scatto');
  m2.tieni('attacco');
  m2.tick(1);
  m2.lascia('scatto');
  m2.lascia('attacco');
  assert.equal(m2.ferruccio.stato, 'scatta');
  finche(m2, () => m2.ferruccio.stato === 'fermo');
  m2.tick(3);
  assert.equal(m2.comb.stato, 'pronto', 'buffer scaduto: nessun fendente');
  assert.equal(m2.eventiDi('ferruccio.colpo').length, 0);
});

test('009: scatto e parata interrompono il recupero del fendente, non lo startup', async () => {
  const m = await creaMondo();
  m.premi('attacco');
  m.premi('scatto'); // durante lo startup
  assert.equal(m.ferruccio.stato, 'fermo', 'lo startup non si cancella');
  assert.equal(m.comb.stato, 'fendente');
  finche(m, () => m.comb.fase === 'recupero');
  m.premi('scatto');
  assert.equal(m.ferruccio.stato, 'scatta');
  assert.equal(m.comb.stato, 'pronto', 'lo scatto ha cancellato il recupero');

  const m2 = await creaMondo();
  m2.premi('attacco');
  finche(m2, () => m2.comb.fase === 'recupero');
  m2.premi('parata');
  assert.equal(m2.comb.stato, 'parata', 'la parata ha cancellato il recupero');
});

test('009: il danno subito interrompe il fendente e svuota combo e buffer', async () => {
  const m = await creaMondo();
  m.premi('attacco');
  m.premi('attacco'); // bufferizzato durante lo startup
  assert.ok(m.comb.bufferAttivo);
  m.comb.ricevi({ x: m.ferruccio.x + 30, y: m.ferruccio.y });
  assert.equal(m.comb.stato, 'pronto');
  assert.equal(m.comb.bufferAttivo, false);
  assert.equal(m.comb.numero, 0);
});

test('009: un nemico dietro una colonna che blocca i colpi non subisce danno anche se portata e arco lo coprono', async () => {
  const centroCella = { x: 224 + 6.5 * 64, y: 136 + 3.5 * 64 };
  const m = await creaMondo({ ferruccioX: centroCella.x, ferruccioY: centroCella.y, ostacoli: [{ colonna: 7, riga: 3, id: 'colonna' }] });
  const dietro = m.fantoccio({ x: centroCella.x + 85, y: centroCella.y });
  const settore = { x: m.ferruccio.x, y: m.ferruccio.y, angolo: 0, portata: 70, arcoGradi: 110 };
  assert.ok(settoreColpisceCerchio(settore, dietro), 'geometricamente sarebbe nel settore');
  m.premi('attacco');
  m.tick(30);
  assert.deepEqual(dietro.danniSubiti, []);
  // la stessa geometria senza colonna colpisce
  const m2 = await creaMondo({ ferruccioX: centroCella.x, ferruccioY: centroCella.y });
  const libero = m2.fantoccio({ x: centroCella.x + 85, y: centroCella.y });
  m2.premi('attacco');
  m2.tick(30);
  assert.deepEqual(libero.danniSubiti, [1]);
});

test('009: prestazioni — 20 bersagli, risoluzione delle hitbox ≤ 0,5 ms per tick in media', async () => {
  const m = await creaMondo();
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    m.fantoccio({ x: m.ferruccio.x + 60 * Math.cos(a), y: m.ferruccio.y + 60 * Math.sin(a), vita: 1000, peso: 3 });
  }
  // riscaldamento del JIT
  for (let i = 0; i < 60; i++) {
    if (i % 6 === 0) m.input.sorgenteGiu('t:KeyJ');
    m.input.inizioTick();
    m.ferruccio.tick(m.tempo.passoS);
    m.comb.tick(m.tempo.passoS);
    m.input.sorgenteSu('t:KeyJ');
  }
  let totale = 0;
  const N = 600;
  let tickAttivi = 0;
  for (let i = 0; i < N; i++) {
    if (i % 6 === 0) m.input.sorgenteGiu('t:KeyJ');
    m.input.inizioTick();
    m.ferruccio.tick(m.tempo.passoS);
    const t0 = performance.now();
    m.comb.tick(m.tempo.passoS);
    totale += performance.now() - t0;
    if (m.comb.fase === 'attivo') tickAttivi++;
    m.input.sorgenteSu('t:KeyJ');
  }
  const media = totale / N;
  assert.ok(tickAttivi > N / 4, `tick con hitbox attiva: ${tickAttivi}`);
  assert.ok(media <= 0.5, `media ${media.toFixed(3)} ms per tick`);
  console.log(`  hitbox con 20 bersagli: ${media.toFixed(3)} ms per tick in media (${tickAttivi} tick attivi su ${N})`);
});

// ---------------------------------------------------------------------------------------------
// Storia 010 — affondo caricato
// ---------------------------------------------------------------------------------------------

test('010: attacco tenuto 450 ms poi rilasciato → affondo: nemico a 60 px sul percorso subisce 2,5 ed è spinto a 320 px/s', async () => {
  const m = await creaMondo();
  m.tieni('attacco');
  m.tick(27); // 450 ms
  assert.equal(m.comb.stato, 'carica');
  assert.ok(m.comb.caricaCompleta);
  const nemico = m.fantoccio({ x: m.ferruccio.x + 60, y: m.ferruccio.y });
  const x0 = m.ferruccio.x;
  m.lascia('attacco');
  m.tick(1);
  assert.equal(m.comb.stato, 'affondo');
  assert.equal(m.comb.fase, 'startup');
  finche(m, () => nemico.danniSubiti.length === 1);
  assert.deepEqual(nemico.danniSubiti, [2.5]);
  assert.equal(nemico.vita, 3.5);
  assert.equal(Math.hypot(nemico.spinteSubite[0].x, nemico.spinteSubite[0].y), 320);
  assert.equal(m.eventiDi('ferruccio.affondo').length, 1);
  assert.deepEqual(m.eventiDi('ferruccio.affondo')[0].payload.direzione, { x: 1, y: 0 });
  finche(m, () => m.comb.stato === 'pronto');
  // Ferruccio avanza; il nemico leggero spinto davanti a lui lo rallenta per separazione dei corpi
  assert.ok(m.ferruccio.x - x0 > 40, `avanzato di ${(m.ferruccio.x - x0).toFixed(1)} px`);
  assert.ok(nemico.x - m.ferruccio.x >= 14 + 16 - 1e-6, 'nessuna sovrapposizione');
});

test('010: rilascio a 300 ms → nessun affondo (il fendente è già partito alla pressione)', async () => {
  const m = await creaMondo();
  const nemico = m.fantoccio({ x: m.ferruccio.x + 60, y: m.ferruccio.y, peso: 3 });
  m.tieni('attacco');
  m.tick(18); // 300 ms
  m.lascia('attacco');
  m.tick(60);
  assert.deepEqual(nemico.danniSubiti, [1], 'solo il fendente');
  assert.equal(m.eventiDi('ferruccio.affondo').length, 0);
  assert.equal(m.comb.stato, 'pronto');
});

test('010: affondo verso un muro → si ferma al muro e la hitbox copre solo il tratto percorso', async () => {
  const bordo = 224 + 832;
  const m = await creaMondo({ ferruccioX: bordo - 14 - 40 });
  const x0 = m.ferruccio.x;
  m.tieni('attacco');
  m.tick(27);
  m.lascia('attacco');
  finche(m, () => m.comb.stato === 'affondo' && m.comb.fase === 'attivo');
  let lunghezzaMax = 0;
  while (m.comb.fase === 'attivo') {
    const h = m.comb.hitboxCorrente();
    assert.equal(h.tipo, 'rettangolo');
    lunghezzaMax = Math.max(lunghezzaMax, h.x2 - h.x1);
    assert.ok(m.ferruccio.x <= bordo - 14 + 1e-9);
    m.tick(1);
  }
  assert.ok(Math.abs(m.ferruccio.x - (bordo - 14)) < 1e-9, `fermo al muro: ${m.ferruccio.x}`);
  assert.ok(lunghezzaMax <= 40 + 46 + 1e-9, `hitbox lunga ${lunghezzaMax.toFixed(1)} (tratto 40 + lama 46)`);
  assert.ok(m.ferruccio.x - x0 < 120);
});

test('010: nemico con peso ≥ 3 → danno sì, spinta no, Ferruccio si ferma a contatto', async () => {
  const m = await creaMondo();
  m.tieni('attacco');
  m.tick(27);
  const boss = m.fantoccio({ x: m.ferruccio.x + 60, y: m.ferruccio.y, peso: 3, r: 22, vita: 50 });
  const x0 = m.ferruccio.x;
  m.lascia('attacco');
  finche(m, () => m.comb.stato === 'pronto');
  assert.deepEqual(boss.danniSubiti, [2.5]);
  assert.deepEqual(boss.spinteSubite, []);
  assert.ok(m.ferruccio.x - x0 < 120, `avanzato solo ${(m.ferruccio.x - x0).toFixed(1)} px`);
  assert.ok(boss.x - m.ferruccio.x >= 14 + 22 - 1e-6, 'nessuna sovrapposizione');
  assert.equal(boss.x, x0 + 60, 'il boss non si è mosso');
});

// ---------------------------------------------------------------------------------------------
// Storia 011 — parata, stordimento, controcolpo, riflesso
// ---------------------------------------------------------------------------------------------

/** Gatto fantoccio che attacca a tick 0: impatto T a 500 + 252 ms (45 tick). */
async function scenarioParata({ imparabile = false } = {}) {
  const m = await creaMondo();
  const gatto = m.fantoccio({ x: m.ferruccio.x + 60, y: m.ferruccio.y, imparabile });
  // consuma la carica di scatto per verificare il ripristino
  m.premi('scatto');
  finche(m, () => m.ferruccio.stato === 'fermo');
  m.ferruccio.posiziona(gatto.x - 60, gatto.y);
  const inizio = m.tickCorrente;
  gatto.attacca();
  const T = inizio + m.tempo.ticksDaMs(500) + m.tempo.ticksDaMs(252);
  return { m, gatto, T };
}

test('011: parata a T−100 ms → maschere invariate, gatto Stordito 600 ms, carica di scatto ripristinata, fendente entro 500 ms fa 2', async () => {
  const { m, gatto, T } = await scenarioParata();
  assert.equal(m.ferruccio.cariche, 0);
  while (m.tickCorrente < T - 6) m.tick(1); // T − 100 ms
  m.premi('parata');
  assert.equal(m.comb.stato, 'parata');
  while (m.tickCorrente <= T) m.tick(1);
  assert.deepEqual(gatto.impatti, ['parata']);
  assert.equal(m.ferruccio.maschere, 5);
  assert.equal(gatto.stato, 'stordito');
  assert.equal(gatto.stordimentoMs, 600);
  assert.equal(m.ferruccio.cariche, 1, 'una carica di scatto ripristinata');
  assert.equal(m.eventiDi('ferruccio.parata').length, 1);
  assert.equal(m.eventiDi('ferruccio.parata')[0].payload.bersaglio, gatto);
  assert.equal(m.eventiDi('ferruccio.danno').length, 0);
  finche(m, () => m.comb.stato === 'controcolpo');
  // il fendente successivo, entro 500 ms, fa 1 × 2 = 2
  m.tick(6);
  m.premi('attacco');
  finche(m, () => gatto.danniSubiti.length === 1);
  assert.deepEqual(gatto.danniSubiti, [2]);
  // il controcolpo è consumato: il fendente dopo fa 1
  finche(m, () => m.comb.stato === 'pronto');
  m.tick(20);
  m.premi('attacco');
  finche(m, () => gatto.danniSubiti.length === 2);
  assert.deepEqual(gatto.danniSubiti, [2, 1]);
  // lo stordimento dura 600 ms
  const tStordito = finche(m, () => gatto.stato !== 'stordito');
  assert.ok(tStordito >= 0);
});

test('011: parata a T−300 ms → la finestra è chiusa all\'impatto: Ferruccio subisce 1 danno', async () => {
  const { m, gatto, T } = await scenarioParata();
  while (m.tickCorrente < T - 18) m.tick(1); // T − 300 ms
  m.premi('parata');
  while (m.tickCorrente <= T) m.tick(1);
  assert.deepEqual(gatto.impatti, ['danno']);
  assert.equal(m.ferruccio.maschere, 4);
  assert.equal(m.eventiDi('ferruccio.parata_mancata').length, 1);
  assert.equal(gatto.stato, 'colpo');
});

test('011: attacco imparabile parato nel tempo giusto → il danno passa comunque', async () => {
  const { m, gatto, T } = await scenarioParata({ imparabile: true });
  while (m.tickCorrente < T - 6) m.tick(1);
  m.premi('parata');
  while (m.tickCorrente <= T) m.tick(1);
  assert.deepEqual(gatto.impatti, ['danno']);
  assert.equal(m.ferruccio.maschere, 4);
  assert.notEqual(gatto.stato, 'stordito');
  assert.equal(m.eventiDi('ferruccio.parata').length, 0);
});

test('011: proiettile parato → riflesso da dove è venuto con danno 2 e colpisce chi lo ha lanciato', async () => {
  const m = await creaMondo();
  const statua = m.fantoccio({ x: m.ferruccio.x + 200, y: m.ferruccio.y, peso: 3 });
  const p = creaProiettile({
    x: statua.x - statua.r, y: statua.y, dirX: -1, dirY: 0, velocita: 280, r: 8, danno: 1, gittata: 560,
    origine: statua, bersaglio: m.comb.comeBersaglio,
  });
  m.proiettili.push(p);
  // para quando il proiettile è a ~5 tick dall'arrivo
  finche(m, () => p.x - m.ferruccio.x <= 14 + 8 + 280 * m.tempo.passoS * 5);
  m.premi('parata');
  finche(m, () => p.riflesso);
  assert.equal(p.danno, 2);
  assert.ok(p.direzione.x > 0, 'torna verso la statua');
  assert.equal(p.velocita, 380);
  assert.equal(m.ferruccio.maschere, 5);
  assert.equal(m.eventiDi('ferruccio.parata').length, 1);
  assert.equal(m.eventiDi('ferruccio.parata')[0].payload.bersaglio, p);
  finche(m, () => !p.vivo);
  assert.deepEqual(statua.danniSubiti, [2]);
});

test('011: parata e attacco nello stesso frame → vince la parata', async () => {
  const m = await creaMondo();
  m.tieni('parata');
  m.tieni('attacco');
  m.tick(1);
  m.lascia('parata');
  m.lascia('attacco');
  assert.equal(m.comb.stato, 'parata');
  assert.equal(m.comb.numero, 0);
  finche(m, () => m.comb.stato !== 'parata');
  assert.equal(m.eventiDi('ferruccio.colpo').length, 0);
});

test('011: due nemici nella stessa finestra → entrambi parati e storditi; finestra 40-220 ms dopo la pressione', async () => {
  const m = await creaMondo();
  const a = m.fantoccio({ x: m.ferruccio.x + 50, y: m.ferruccio.y, id: 'a' });
  const b = m.fantoccio({ x: m.ferruccio.x - 50, y: m.ferruccio.y, id: 'b' });
  m.premi('parata');
  m.tick(1); // startup 40 ms → finestra aperta
  m.tick(2);
  assert.equal(m.comb.ricevi({ x: a.x, y: a.y, attaccante: a }), 'parata');
  assert.equal(m.comb.ricevi({ x: b.x, y: b.y, attaccante: b }), 'parata');
  assert.equal(a.stato, 'stordito');
  assert.equal(b.stato, 'stordito');
  assert.equal(m.comb.fase, 'finestra', 'la finestra resta aperta');
  finche(m, () => m.comb.stato !== 'parata');
  assert.equal(m.comb.stato, 'controcolpo', 'nessun recupero dopo una parata riuscita');
  assert.equal(m.eventiDi('ferruccio.parata_mancata').length, 0);
});

test('011: durante la parata e l\'affondo il corpo è fermo; in carica cammina al 50%, nel recupero al 60%', async () => {
  const m = await creaMondo();
  m.tieni('destra');
  m.tick(20);
  m.premi('parata');
  const x0 = m.ferruccio.x;
  m.tick(3);
  assert.equal(m.comb.modVelocita(), 0);
  assert.ok(m.ferruccio.x - x0 < 220 * m.tempo.passoS * 3, 'decelera e si ferma');
  finche(m, () => m.comb.stato === 'pronto');
  m.tieni('attacco');
  finche(m, () => m.comb.stato === 'carica');
  assert.equal(m.comb.modVelocita(), 0.5);
  m.lascia('attacco');
  m.tick(2);
  m.premi('attacco');
  finche(m, () => m.comb.fase === 'recupero');
  assert.ok(Math.abs(m.comb.modVelocita() - 0.6) < 1e-9);
});

// ---------------------------------------------------------------------------------------------
// Storia P04 — frecce che sparano, cadenza, tipi, triplo/doppia/quadDir, perforazione (Teatro)
// ---------------------------------------------------------------------------------------------

import { creaStatistiche } from '../motore/attori/statistiche.js';

/** Mondo con le statistiche alla Isaac: personaggio scelto e doni equipaggiati (ids del motore). */
async function creaMondoIsaac({ personaggio = 'ferruccio', doni = [], ferruccioX = null, ferruccioY = null } = {}) {
  const log = logFinto();
  const parametri = creaParametri({ log });
  await parametri.carica({
    caricatore: (nome) => leggiJson(nome), statistiche: ['ferruccio', 'combattimento', 'stanza'], tabelle: ['input', 'doni', 'sinergie', 'personaggi'],
  });
  const tempo = creaTempo();
  const eventi = creaBus({ log });
  const input = creaInput(parametri.get('input'));
  const mod = creaModificatori(parametri, { catalogo: parametri.get('doni'), sinergie: parametri.get('sinergie'), eventi });
  const campo = creaCampo({
    colonne: parametri.get('stanza.colonne'), righe: parametri.get('stanza.righe'), cella: parametri.get('stanza.cella'),
    scenaLarghezza: SCENA.larghezza, scenaAltezza: SCENA.altezza, ostacoli: [],
  });
  const centro = { x: campo.x + campo.larghezza / 2, y: campo.y + campo.altezza / 2 };
  const ferruccio = creaFerruccio({ modificatori: mod, tempo, eventi, input, campo, x: ferruccioX ?? centro.x, y: ferruccioY ?? centro.y });
  const statistiche = creaStatistiche({ tabella: parametri.get('personaggi'), modificatori: mod });
  const bersagli = [];
  const comb = creaCombattimento({
    modificatori: mod, tempo, eventi, input, campo, ferruccio, bersagli: () => bersagli, proiettiliBase: true,
    statistiche: () => statistiche.correnti(), isaac: parametri.get('personaggi').isaac,
  });
  statistiche.scegli(personaggio);
  for (const id of doni) mod.aggiungiDono(id);
  const ricevuti = [];
  for (const nome of ['ferruccio.colpo', 'ferruccio.uccisione', 'ferruccio.sparo']) eventi.on(nome, (p) => ricevuti.push({ nome, payload: p }));
  const tasto = (azione) => `t:${parametri.get(`input.tastiera.${azione}`)[0]}`;
  const mondo = {
    parametri, tempo, eventi, input, mod, campo, centro, ferruccio, comb, bersagli, ricevuti, statistiche,
    tick(n = 1) {
      for (let i = 0; i < n; i++) {
        input.inizioTick();
        ferruccio.tick(tempo.passoS);
        comb.tick(tempo.passoS);
        for (const b of bersagli) b.tick(tempo.passoS);
      }
    },
    tieni: (azione) => input.sorgenteGiu(tasto(azione)),
    lascia: (azione) => input.sorgenteSu(tasto(azione)),
    fantoccio(opzioni) {
      const f = creaFantoccio({ modificatori: mod, tempo, eventi, campo, bersaglio: comb.comeBersaglio, ...opzioni });
      bersagli.push(f);
      return f;
    },
    eventiDi: (nome) => ricevuti.filter((e) => e.nome === nome),
  };
  return mondo;
}

test('P04 input: le frecce sono spara_* e non muovono; WASD muove; Q è `attivo`', () => {
  const input = leggiJson('input');
  assert.deepEqual(input.tastiera.spara_destra, ['ArrowRight']);
  assert.deepEqual(input.tastiera.spara_su, ['ArrowUp']);
  for (const a of ['sinistra', 'destra', 'su', 'giu']) assert.ok(!input.tastiera[a].some((c) => c.startsWith('Arrow')), `${a} senza frecce`);
  assert.deepEqual(input.tastiera.attivo, ['KeyQ']);
});

test('P04 frecce: freccia destra tenuta, senza spada → proiettile verso destra alla cadenza cooldownTicks (22 per Ferruccio), Ferruccio non si muove', async () => {
  const m = await creaMondoIsaac();
  const x0 = m.ferruccio.x;
  m.tieni('spara_destra');
  m.tick(1);
  const p = m.comb.proiettiliFerruccio();
  assert.equal(p.length, 1, 'un proiettile al primo tick');
  assert.ok(p[0].vx > 0 && p[0].vy === 0, 'verso destra');
  assert.equal(p[0].tipo, 'base');
  assert.equal(p[0].perforante, false);
  assert.ok(Math.abs(p[0].danno - 3.5) < 1e-9, 'danno = dmg del personaggio');
  assert.equal(p[0].maxDist, 340, 'range 170 × 2');
  assert.equal(m.comb.stato, 'pronto', 'nessun fendente senza spada');
  m.tick(21);
  assert.equal(m.eventiDi('ferruccio.sparo').length, 1, 'niente prima della cadenza');
  m.tick(1);
  assert.equal(m.eventiDi('ferruccio.sparo').length, 2, 'seconda raffica al tick 23 (cooldown 22)');
  assert.equal(m.ferruccio.x, x0, 'la freccia non muove');
  assert.equal(m.ferruccio.stato, 'fermo');
  m.lascia('spara_destra');
  m.tick(40);
  assert.equal(m.eventiDi('ferruccio.sparo').length, 2, 'rilasciata: niente');
  assert.deepEqual(m.ferruccio.direzioneMira(), { x: 1, y: 0 });
});

test('P04 frecce: la freccia su mira in alto anche camminando a destra (direzioneMira preferisce la freccia); il proiettile colpisce e uccide un fantoccio', async () => {
  const m = await creaMondoIsaac();
  m.tieni('destra');
  m.tieni('spara_su');
  m.tick(1);
  assert.deepEqual(m.ferruccio.direzioneMira(), { x: 0, y: -1 });
  const p = m.comb.proiettiliFerruccio()[0];
  assert.ok(p.vy < 0 && Math.abs(p.vx) < 1e-9, 'verso l\'alto');
  m.lascia('destra'); m.lascia('spara_su');
  const f = m.fantoccio({ id: 'alto', x: m.ferruccio.x, y: m.ferruccio.y - 120, vita: 3 });
  m.tieni('spara_su');
  m.tick(60);
  assert.ok(m.eventiDi('ferruccio.colpo').length >= 1, 'colpito');
  assert.ok(f.vita <= 0, 'ucciso: 3.5 ≥ 3');
  assert.equal(m.eventiDi('ferruccio.uccisione').length, 1);
});

test('P04 tipi: Agnese spara coppie (doppia); Triplo Occhio dà ventagli di 3; Maschera dei 4 Venti spara in 4 direzioni (×3 con triplo)', async () => {
  const a = await creaMondoIsaac({ personaggio: 'agnese' });
  a.tieni('spara_sinistra'); a.tick(1);
  const pa = a.comb.proiettiliFerruccio();
  assert.equal(pa.length, 2, 'doppia: due proiettili paralleli');
  assert.ok(pa.every((p) => p.vx < 0 && Math.abs(p.vy) < 1e-9));
  assert.ok(Math.abs(pa[0].y - pa[1].y) > 1, 'paralleli, sfalsati');
  assert.ok(Math.abs(pa[0].danno - 2.56) < 1e-9);
  const t = await creaMondoIsaac({ doni: ['bilancino-spezzato'] });
  t.tieni('spara_giu'); t.tick(1);
  const pt = t.comb.proiettiliFerruccio();
  assert.equal(pt.length, 3, 'triplo');
  assert.ok(pt.every((p) => p.vy > 0));
  assert.ok(pt.some((p) => p.vx < -1) && pt.some((p) => p.vx > 1) && pt.some((p) => Math.abs(p.vx) < 1e-9), 'ventaglio');
  const q = await creaMondoIsaac({ doni: ['broccato', 'bilancino-spezzato'] });
  q.tieni('spara_destra'); q.tick(1);
  assert.equal(q.comb.proiettiliFerruccio().length, 12, 'quadDir × triplo');
});

test('P04 tipi: Anello → cremisi perforante attraversa due fantocci; Tizzone → fuoco con bruciatura; Catena → elettrico e fulmine al vicino; Piombo → overflow', async () => {
  const o = await creaMondoIsaac({ personaggio: 'ombra' });
  const f1 = o.fantoccio({ id: 'a', x: o.ferruccio.x + 90, y: o.ferruccio.y, vita: 50 });
  const f2 = o.fantoccio({ id: 'b', x: o.ferruccio.x + 170, y: o.ferruccio.y, vita: 50 });
  o.tieni('spara_destra'); o.tick(1); o.lascia('spara_destra');
  assert.equal(o.comb.proiettiliFerruccio()[0].tipo, 'cremisi');
  o.tick(40);
  assert.ok(f1.vita < 50 && f2.vita < 50, 'perforante: entrambi colpiti');
  const t = await creaMondoIsaac({ doni: ['tizzone-ardente'] });
  const ft = t.fantoccio({ id: 'c', x: t.ferruccio.x + 90, y: t.ferruccio.y, vita: 200 });
  t.tieni('spara_destra'); t.tick(1); t.lascia('spara_destra');
  assert.equal(t.comb.proiettiliFerruccio()[0].tipo, 'fuoco');
  t.tick(20);
  const dopoColpo = ft.vita;
  assert.ok(t.comb.bruciature().length === 1, 'bruciatura attiva');
  t.tick(60);
  assert.ok(ft.vita < dopoColpo, 'la bruciatura continua a ferire');
  const c = await creaMondoIsaac({ doni: ['catena-della-chiusa'] });
  const c1 = c.fantoccio({ id: 'd', x: c.ferruccio.x + 90, y: c.ferruccio.y, vita: 200 });
  const c2 = c.fantoccio({ id: 'e', x: c.ferruccio.x + 90, y: c.ferruccio.y - 100, vita: 200 });
  c.tieni('spara_destra'); c.tick(1); c.lascia('spara_destra');
  assert.equal(c.comb.proiettiliFerruccio()[0].tipo, 'elettrico');
  c.tick(20);
  assert.ok(c1.vita < 200 && c2.vita < 200, 'catena: anche il vicino entro 144 px');
  assert.ok(Math.abs((200 - c2.vita) - (200 - c1.vita) * 0.45) < 1e-6, 'il vicino prende il 45 %');
  const p = await creaMondoIsaac({ doni: ['martello-da-fabbro'] });
  const p1 = p.fantoccio({ id: 'f', x: p.ferruccio.x + 90, y: p.ferruccio.y, vita: 2 });
  const p2 = p.fantoccio({ id: 'g', x: p.ferruccio.x + 170, y: p.ferruccio.y, vita: 50 });
  p.tieni('spara_destra'); p.tick(1); p.lascia('spara_destra');
  assert.equal(p.comb.proiettiliFerruccio()[0].tipo, 'piombo');
  p.tick(40);
  assert.ok(p1.vita <= 0 && p2.vita < 50, 'overflow: l\'eccesso prosegue');
  assert.ok(Math.abs((50 - p2.vita) - (13.87 - 2)) < 1e-6, 'danno residuo 13.87 − 2');
});

test('P04 spada: Taddeo con la freccia dà il fendente nella direzione della freccia (nessun proiettile), J continua a funzionare', async () => {
  const m = await creaMondoIsaac({ personaggio: 'taddeo' });
  assert.equal(m.comb.haSpada(), true);
  m.tieni('spara_su'); m.tick(1);
  assert.equal(m.comb.stato, 'fendente');
  assert.deepEqual(m.comb.mira, { x: 0, y: -1 });
  assert.equal(m.comb.proiettiliFerruccio().length, 0, 'spada senza doni speciali: niente proiettili');
  m.lascia('spara_su');
  m.tick(60);
  assert.equal(m.comb.stato, 'pronto');
  m.tieni('attacco'); m.tick(1); m.lascia('attacco');
  assert.equal(m.comb.stato, 'fendente');
  assert.ok(Math.abs(m.mod.valore('combattimento.danno') - 7.395) < 1e-9, 'danno del fendente = dmg di Taddeo');
});
