/**
 * gioco/qa/feel.test.mjs — Game feel (storia P08, richieste testuali dell'autore).
 *
 * Esecuzione: `node gioco/qa/feel.test.mjs`. Verifica, con i JSON reali di `contenuti/parametri/`:
 * i-frames ≥ 1000 ms e lampeggio semitrasparente (alpha dal JSON), rimbalzo all'indietro di Ferruccio
 * colpito (Colpo di contatto e proiettile), hit-stop del ciclo (2-3 tick, un solo congelamento per
 * fendente, disegno che continua), spinta ai nemici inversamente proporzionale al peso (tre pesi),
 * macchie a terra che persistono e si azzerano al cambio di stanza (deterministiche), scossa contestuale
 * dai parametri (zero a riposo, zero con moto ridotto).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { creaTempo } from '../motore/fondazione/tempo.js';
import { creaBus } from '../motore/fondazione/eventi.js';
import { creaInput } from '../motore/fondazione/input.js';
import { creaCiclo } from '../motore/fondazione/ciclo.js';
import { creaParametri } from '../motore/fondazione/parametri.js';
import { creaRng } from '../motore/fondazione/rng.js';
import { creaModificatori } from '../motore/oggetti/modificatori.js';
import { creaCampo } from '../motore/mondo/fisica.js';
import { creaFerruccio } from '../motore/attori/ferruccio.js';
import { creaCombattimento, spintaPerPeso } from '../motore/attori/combattimento.js';
import { creaFantoccio, creaProiettile } from '../motore/attori/bersaglio.js';
import { creaFeel } from '../motore/resa/feel.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const PARAMETRI = join(QUI, '..', 'contenuti', 'parametri');
const leggiJson = (nome) => JSON.parse(readFileSync(join(PARAMETRI, `${nome}.json`), 'utf8'));
const SCENA = Object.freeze({ larghezza: 1280, altezza: 720 });
const log = { error() {}, warn() {}, info() {} };

async function caricaParametri({ sovrascritture = [] } = {}) {
  const parametri = creaParametri({ log });
  await parametri.carica({
    caricatore: (nome) => leggiJson(nome),
    statistiche: ['ferruccio', 'combattimento', 'stanza', 'nemici', 'resa'],
    tabelle: ['input'],
    sovrascritture,
  });
  assert.deepEqual(parametri.errori(), [], 'i JSON reali devono essere validi');
  return parametri;
}

/** Mondo minimo: Ferruccio al centro del campo, combattimento, bersagli. */
async function creaMondo() {
  const parametri = await caricaParametri();
  const tempo = creaTempo();
  const eventi = creaBus({ log });
  const input = creaInput(parametri.get('input'));
  const mod = creaModificatori(parametri, { log });
  const campo = creaCampo({
    colonne: parametri.get('stanza.colonne'), righe: parametri.get('stanza.righe'), cella: parametri.get('stanza.cella'),
    scenaLarghezza: SCENA.larghezza, scenaAltezza: SCENA.altezza, ostacoli: [],
  });
  const centro = { x: campo.x + campo.larghezza / 2, y: campo.y + campo.altezza / 2 };
  const ferruccio = creaFerruccio({ modificatori: mod, tempo, eventi, input, campo, x: centro.x, y: centro.y });
  const bersagli = [];
  const comb = creaCombattimento({ modificatori: mod, tempo, eventi, input, campo, ferruccio, bersagli: () => bersagli });
  const tick = (n = 1) => {
    for (let i = 0; i < n; i++) {
      input.inizioTick();
      ferruccio.tick(tempo.passoS);
      comb.tick(tempo.passoS);
      for (const b of bersagli) b.tick(tempo.passoS);
    }
  };
  const bersaglioFerruccio = typeof comb.comeBersaglio === 'function' ? comb.comeBersaglio() : (comb.comeBersaglio ?? {
    get x() { return ferruccio.x; }, get y() { return ferruccio.y; }, get r() { return ferruccio.r; }, colpisci: comb.ricevi,
  });
  const fantoccio = (o) => {
    const f = creaFantoccio({ modificatori: mod, tempo, eventi, campo, bersaglio: bersaglioFerruccio, ...o });
    bersagli.push(f);
    return f;
  };
  const tasto = (azione) => `t:${parametri.get(`input.tastiera.${azione}`)[0]}`;
  const premi = (azione) => { input.sorgenteGiu(tasto(azione)); tick(1); input.sorgenteSu(tasto(azione)); };
  return { parametri, tempo, eventi, input, mod, campo, ferruccio, comb, bersagli, tick, fantoccio, premi, bersaglioFerruccio };
}

test('(a) i-frames: t_invuln ≥ 1000 ms nel JSON (base e min) e il corpo resta invulnerabile per t_invuln', async () => {
  const f = leggiJson('ferruccio');
  assert.ok(f.t_invuln.base >= 1000, `t_invuln.base ${f.t_invuln.base}`);
  assert.ok(f.t_invuln.min >= 1000, `t_invuln.min ${f.t_invuln.min}`);
  const m = await creaMondo();
  m.ferruccio.subisciDanno({ x: m.ferruccio.x + 30, y: m.ferruccio.y });
  const attesi = m.tempo.ticksDaMs(m.parametri.get('ferruccio.t_invuln'));
  let n = 0;
  while (m.ferruccio.invulnerabile() && n < 10000) { m.tick(1); n++; }
  assert.equal(n, attesi, `invulnerabile per ${n} tick (attesi ${attesi} = ${attesi * m.tempo.passoMs} ms)`);
});

test('(a) lampeggio: alpha 0,4 dal JSON, semitrasparente nel tick dopo il colpo, pieno nelle semionde impari e fuori dall\'invulnerabilità', async () => {
  const r = leggiJson('resa');
  assert.equal(r.lampeggio.alpha.base, 0.4);
  const m = await creaMondo();
  const feel = creaFeel({ parametri: m.parametri, tempo: m.tempo, rng: creaRng(1) });
  assert.equal(feel.alphaSagoma(m.ferruccio, 100), 1, 'sano: alpha 1');
  m.ferruccio.subisciDanno({ x: m.ferruccio.x + 30, y: m.ferruccio.y });
  m.tick(1);
  assert.equal(feel.alphaSagoma(m.ferruccio, 101), m.parametri.get('resa.lampeggio.alpha'), 'frame dopo il colpo: alpha del JSON');
  const semi = m.tempo.ticksDaMs(m.parametri.get('resa.lampeggio.semiperiodo_ms'));
  assert.equal(feel.alphaSagoma(m.ferruccio, 101 + semi), 1, 'seconda semionda: piena');
  assert.equal(feel.alphaSagoma(m.ferruccio, 101 + 2 * semi), m.parametri.get('resa.lampeggio.alpha'), 'terza semionda: semitrasparente');
  while (m.ferruccio.invulnerabile()) m.tick(1);
  assert.equal(feel.alphaSagoma(m.ferruccio, 500), 1, 'finita l\'invulnerabilità: alpha 1');
});

test('(a) rimbalzo: Ferruccio arretra rispetto alla fonte del colpo, sia per il Colpo di contatto sia per il proiettile nemico', async () => {
  const m = await creaMondo();
  const x0 = m.ferruccio.x;
  const gatto = m.fantoccio({ x: x0 + 40, y: m.ferruccio.y });
  gatto.attacca();
  let n = 0;
  while (gatto.impatti.length === 0 && n < 600) { m.tick(1); n++; }
  assert.deepEqual(gatto.impatti, ['danno']);
  m.tick(m.tempo.ticksDaMs(m.parametri.get('ferruccio.t_spinta')));
  assert.ok(m.ferruccio.x < x0 - 5, `contatto: arretrato di ${(x0 - m.ferruccio.x).toFixed(1)} px (fonte a destra)`);

  const m2 = await creaMondo();
  const y0 = m2.ferruccio.y;
  const p = creaProiettile({
    x: m2.ferruccio.x, y: y0 - 60, dirX: 0, dirY: 1, velocita: 400, r: 6, danno: 1, gittata: 400,
    origine: null, bersaglio: m2.bersaglioFerruccio,
  });
  n = 0;
  while (p.vivo && n < 200) { p.tick(m2.tempo.passoS); m2.tick(1); n++; }
  assert.ok(!p.vivo, 'il proiettile ha colpito');
  assert.equal(m2.ferruccio.stato, 'colpito');
  m2.tick(m2.tempo.ticksDaMs(m2.parametri.get('ferruccio.t_spinta')));
  assert.ok(m2.ferruccio.y > y0 + 5, `proiettile dall'alto: spinto in basso di ${(m2.ferruccio.y - y0).toFixed(1)} px`);
});

test('(b) hit-stop: congela(ms) salta 2-3 tick di simulazione mentre i frame si disegnano; non si somma (un solo hit-stop per fendente)', async () => {
  const c = leggiJson('combattimento');
  assert.equal(c.feel.hit_stop_ms.base, 40);
  assert.ok(c.feel.hit_stop_ms.min >= 30 && c.feel.hit_stop_ms.max <= 45);
  assert.ok(c.feel.hit_stop_uccisione_ms.base > c.feel.hit_stop_ms.base);
  assert.ok(c.feel.hit_stop_parata_ms.base > c.feel.hit_stop_uccisione_ms.base);
  const tempo = creaTempo();
  const ciclo = creaCiclo({ tempo, statoIniziale: 'notte' });
  let tickSim = 0;
  let disegni = 0;
  ciclo.registra({ tick: () => { tickSim++; }, disegna: () => { disegni++; } });
  let t = 0;
  const frame = () => { t += tempo.passoMs; return ciclo.frame(t); };
  frame();
  frame();
  assert.equal(tickSim, 1);
  const attesi = tempo.ticksDaMs(c.feel.hit_stop_ms.base);
  assert.ok(attesi >= 2 && attesi <= 3, `hit-stop di ${attesi} tick`);
  // tre bersagli colpiti nello stesso fendente: tre richieste, un solo congelamento
  ciclo.congela(c.feel.hit_stop_ms.base);
  ciclo.congela(c.feel.hit_stop_ms.base);
  ciclo.congela(c.feel.hit_stop_ms.base);
  assert.equal(ciclo.congelato(), attesi, 'non si somma');
  const simPrima = tickSim;
  const disegniPrima = disegni;
  const framePrima = ciclo.contaFrame();
  for (let i = 0; i < attesi; i++) assert.equal(frame(), 0, 'frame congelato: 0 tick eseguiti');
  assert.equal(tickSim, simPrima, 'la simulazione è ferma');
  assert.equal(disegni, disegniPrima + attesi, 'ma si disegna a ogni frame');
  assert.equal(ciclo.contaFrame(), framePrima + attesi);
  assert.equal(ciclo.congelato(), 0);
  assert.equal(frame(), 1, 'poi la simulazione riparte');
  assert.equal(tickSim, simPrima + 1);
  // uccisione dentro un colpo: vince la durata più lunga, non la somma
  ciclo.congela(c.feel.hit_stop_ms.base);
  ciclo.congela(c.feel.hit_stop_uccisione_ms.base);
  assert.equal(ciclo.congelato(), tempo.ticksDaMs(c.feel.hit_stop_uccisione_ms.base));
  // i tick forzati (debug) ignorano il congelamento
  const prima = ciclo.contaTick();
  ciclo.tick(2);
  assert.equal(ciclo.contaTick(), prima + 2);
});

test('(c) knockback: spinta = spinta_f / peso con clamp, tre pesi dal JSON (vespa 0, gatto 1, guardia 2) e statua inamovibile', async () => {
  const parametri = await caricaParametri();
  const base = parametri.get('combattimento.spinta_f');
  const o = {
    spinta: base, pesoInamovibile: parametri.get('combattimento.peso_inamovibile'), pesoMin: parametri.get('combattimento.feel.peso_min_spinta'),
    spintaMin: parametri.get('combattimento.feel.spinta_min'), spintaMax: parametri.get('combattimento.feel.spinta_max'),
  };
  const peso = (id) => parametri.get(`nemici.archetipi.${id}.peso`);
  const vespa = spintaPerPeso({ ...o, peso: peso('vespa') });
  const gatto = spintaPerPeso({ ...o, peso: peso('gatto') });
  const guardia = spintaPerPeso({ ...o, peso: peso('guardia') });
  const statua = spintaPerPeso({ ...o, peso: peso('statua') });
  assert.ok(vespa > gatto && gatto > guardia && guardia > 0, `vespa ${vespa} > gatto ${gatto} > guardia ${guardia} > 0`);
  assert.equal(gatto, Math.min(o.spintaMax, Math.max(o.spintaMin, base / Math.max(peso('gatto'), o.pesoMin))));
  assert.equal(guardia, Math.min(o.spintaMax, Math.max(o.spintaMin, base / Math.max(peso('guardia'), o.pesoMin))));
  assert.equal(vespa, Math.min(o.spintaMax, base / Math.max(peso('vespa'), o.pesoMin)), 'la vespa (peso 0) vola via, limitata da spinta_max');
  assert.ok(vespa <= o.spintaMax);
  assert.equal(statua, 0, 'statua e boss (peso ≥ peso_inamovibile) non si muovono');
  assert.equal(spintaPerPeso({ ...o, peso: 99 }), 0);
  assert.equal(spintaPerPeso({ ...o, spinta: 0, peso: 1 }), 0);

  // in gioco: il fendente imprime al fantoccio la spinta proporzionale al suo peso
  const m = await creaMondo();
  const leggero = m.fantoccio({ x: m.ferruccio.x + 50, y: m.ferruccio.y - 20, peso: peso('gatto'), id: 'leggero' });
  const pesante = m.fantoccio({ x: m.ferruccio.x + 50, y: m.ferruccio.y + 20, peso: peso('guardia'), id: 'pesante' });
  const fermo = m.fantoccio({ x: m.ferruccio.x + 50, y: m.ferruccio.y, peso: peso('statua'), id: 'statua' });
  m.premi('attacco');
  m.tick(m.tempo.ticksDaMs(m.parametri.get('combattimento.t_startup_f') + m.parametri.get('combattimento.t_attivo_f')) + 2);
  assert.equal(leggero.spinteSubite.length, 1, 'il fendente ha colpito il leggero');
  assert.equal(pesante.spinteSubite.length, 1, 'il fendente ha colpito il pesante');
  assert.deepEqual(fermo.spinteSubite, [], 'la statua non riceve spinta');
  assert.equal(fermo.danniSubiti.length, 1, 'ma prende il danno');
  const sl = Math.hypot(leggero.spinteSubite[0].x, leggero.spinteSubite[0].y);
  const sp = Math.hypot(pesante.spinteSubite[0].x, pesante.spinteSubite[0].y);
  assert.ok(Math.abs(sl - gatto) < 1e-6, `leggero ${sl} = ${gatto}`);
  assert.ok(Math.abs(sp - guardia) < 1e-6, `pesante ${sp} = ${guardia}`);
  assert.ok(sl > sp, 'il leggero vola più lontano del pesante');
});

test('(e) macchie: una per nemico morto (china, o schegge per statua/guardia/bomba), persistono nella stanza, si azzerano al cambio, deterministiche con derivato(rng, "fx")', async () => {
  const parametri = await caricaParametri();
  const crea = (seme) => {
    const eventi = creaBus({ log });
    const feel = creaFeel({ parametri, eventi, rng: creaRng(seme), tempo: creaTempo() });
    return { eventi, feel };
  };
  const a = crea(7);
  a.eventi.emit('notte.stanza', { da: null, a: 's1' });
  a.eventi.emit('nemico.morto', { id: 'n1', archetipo: 'gatto', x: 300, y: 400 });
  a.eventi.emit('nemico.morto', { id: 'n2', archetipo: 'statua', x: 500, y: 420 });
  assert.equal(a.feel.macchie().length, 2);
  assert.equal(a.feel.macchie()[0].tipo, 'china');
  assert.equal(a.feel.macchie()[0].gocce.length, parametri.get('resa.macchie.gocce_china'));
  assert.equal(a.feel.macchie()[1].tipo, 'legno');
  assert.equal(a.feel.macchie()[1].gocce.length, parametri.get('resa.macchie.schegge'));
  for (const g of a.feel.macchie()[0].gocce) {
    assert.ok(Math.hypot(g.dx, g.dy) <= parametri.get('resa.macchie.raggio_px') + 1e-9);
    assert.ok(g.r >= parametri.get('resa.macchie.dim_min_px') && g.r <= parametri.get('resa.macchie.dim_max_px'));
  }
  a.eventi.emit('notte.stanza', { da: 's1', a: 's1' });
  assert.equal(a.feel.macchie().length, 2, 'stessa stanza: restano');
  a.eventi.emit('ferruccio.colpo', { x: 0, y: 0 });
  assert.equal(a.feel.macchie().length, 2, 'i colpi non le toccano');
  a.eventi.emit('notte.stanza', { da: 's1', a: 's2' });
  assert.equal(a.feel.macchie().length, 0, 'cambio di stanza: azzerate');
  // determinismo
  const b = crea(7);
  const c = crea(7);
  b.eventi.emit('nemico.morto', { id: 'n', archetipo: 'gatto', x: 10, y: 20 });
  c.eventi.emit('nemico.morto', { id: 'n', archetipo: 'gatto', x: 10, y: 20 });
  assert.deepEqual(b.feel.macchie(), c.feel.macchie());
  // disegno: solo lettura, un fill per goccia
  let fill = 0;
  const ctx = { save() {}, restore() {}, translate() {}, rotate() {}, beginPath() {}, ellipse() {}, rect() {}, fill() { fill++; }, fillStyle: '' };
  b.feel.disegnaMacchie(ctx);
  assert.equal(fill, parametri.get('resa.macchie.gocce_china'));
});

test('(d) scossa contestuale: zero a riposo, px e frame dal JSON per colpo, bomba, Re-Gatto e Mani; mai costante; moto ridotto → 0', async () => {
  const parametri = await caricaParametri();
  const eventi = creaBus({ log });
  const feel = creaFeel({ parametri, eventi, rng: creaRng(1), tempo: creaTempo() });
  assert.deepEqual(feel.offsetScossa(), { x: 0, y: 0 }, 'a riposo nessuna scossa');
  const r = leggiJson('resa');
  assert.ok(r.scossa.colpo_px.base >= 1 && r.scossa.colpo_px.base <= 2 && r.scossa.colpo_frame.base === 2, 'colpo: 1-2 px per 2 frame');
  assert.ok(r.scossa.bomba_px.base >= 5 && r.scossa.bomba_px.base <= 6, 'bomba: 5-6 px');
  assert.ok(r.scossa.boss_atterraggio_px.base >= 10 && r.scossa.boss_atterraggio_px.base <= 12, 'Re-Gatto: 10-12 px');
  assert.ok(r.scossa.mani_schianto_px.base >= 10 && r.scossa.mani_schianto_px.base <= 12, 'Mani: 10-12 px');

  eventi.emit('ferruccio.colpo', { x: 0, y: 0 });
  assert.deepEqual(feel.statoScossa(), { px: parametri.get('resa.scossa.colpo_px'), frame: parametri.get('resa.scossa.colpo_frame') });
  const o1 = feel.offsetScossa();
  assert.ok(Math.abs(o1.x) > 0 && Math.abs(o1.x) <= parametri.get('resa.scossa.colpo_px'));
  const o2 = feel.offsetScossa();
  assert.ok(Math.sign(o2.x) !== Math.sign(o1.x), 'il segno alterna');
  assert.deepEqual(feel.offsetScossa(), { x: 0, y: 0 }, 'dopo i frame previsti si ferma');
  assert.deepEqual(feel.offsetScossa(), { x: 0, y: 0 });

  eventi.emit('nemico.esplosione', { x: 0, y: 0 });
  assert.equal(feel.statoScossa().px, parametri.get('resa.scossa.bomba_px'));
  eventi.emit('ferruccio.colpo', { x: 0, y: 0 });
  assert.equal(feel.statoScossa().px, parametri.get('resa.scossa.bomba_px'), 'un colpo durante la bomba non la riduce né la somma');
  feel.azzeraMacchie();
  while (feel.statoScossa().frame > 0) feel.offsetScossa();
  eventi.emit('boss.atterraggio', { id: 're_gatto' });
  assert.deepEqual(feel.statoScossa(), { px: parametri.get('resa.scossa.boss_atterraggio_px'), frame: parametri.get('resa.scossa.boss_atterraggio_frame') });
  while (feel.statoScossa().frame > 0) feel.offsetScossa();
  eventi.emit('boss.mani_schianto', {});
  assert.equal(feel.statoScossa().px, parametri.get('resa.scossa.mani_schianto_px'));
  while (feel.statoScossa().frame > 0) feel.offsetScossa();
  eventi.emit('ferruccio.parata', {});
  assert.equal(feel.statoScossa().px, parametri.get('combattimento.feel.scossa_parata_px'));

  // moto ridotto: i px vanno a 0 dai parametri e non c'è alcuna scossa
  const ridotti = await caricaParametri({ sovrascritture: ['moto-ridotto'] });
  const eventi2 = creaBus({ log });
  const feel2 = creaFeel({ parametri: ridotti, eventi: eventi2, rng: creaRng(1), tempo: creaTempo() });
  for (const nome of ['ferruccio.colpo', 'nemico.esplosione', 'boss.atterraggio', 'boss.mani_schianto', 'ferruccio.parata']) eventi2.emit(nome, {});
  assert.deepEqual(feel2.statoScossa(), { px: 0, frame: 0 });
  assert.deepEqual(feel2.offsetScossa(), { x: 0, y: 0 });
});
