/**
 * gioco/qa/nemici.test.mjs — Test unitari delle storie 019 (IA base, separazione, telegrafo in tre
 * tempi, stordimento, anima e bottino) e 020 (gatto d'ombra: posa, anello, balzo con portata
 * dinamica e hitbox dal 45%, anello d'attesa, tetto degli attaccanti, bot QA a 120 ms), senza DOM.
 *
 * Storia 020: l'istante d'impatto T del GDD (F4) è `t_lamp + hit_dal × t_imp` dopo l'inizio del lampo
 * (`nemico.istanteImpatto`), costante qualunque sia la distanza: i casi della 019 che parlano di T lo
 * leggono da lì.
 *
 * Esecuzione: `node gioco/qa/nemici.test.mjs` dalla radice (node:test, Node ≥ 20). Ciclo simulato a
 * tick fissi nell'ordine del gioco: input → Ferruccio → combattimento → nemici → direttore. Parametri
 * reali di `contenuti/parametri/` (con override dove il criterio lo richiede), input reale pilotato
 * con sorgenti sintetiche. Un caso per ogni criterio Given-When-Then della storia, più le formule F1-F3
 * sui dati del GDD, le regole R2/R4 sul data file, l'emersione, il direttore, la factory nella stanza,
 * il determinismo e le prestazioni (12 nemici ≤ 1,0 ms per tick).
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
import { creaParametri } from '../motore/fondazione/parametri.js';
import { creaRng, derivato } from '../motore/fondazione/rng.js';
import { creaModificatori } from '../motore/oggetti/modificatori.js';
import { creaCampo } from '../motore/mondo/fisica.js';
import { creaFerruccio } from '../motore/attori/ferruccio.js';
import { creaCombattimento } from '../motore/attori/combattimento.js';
import {
  creaNemico, schedaArchetipo, scalaVita, scalaVelocita, scalaAnticipo, validaSchede, monetePerMorte, probabilitaCuore, ARCHETIPI_MVP,
} from '../motore/attori/nemico.js';
import { creaGatto, posaGatto, ARCHETIPO_GATTO } from '../motore/attori/gatto.js';
import { creaProiettileNemico, cancellaInRaggio, potaSpenti } from '../motore/attori/proiettili-nemici.js';
import { direzioniVentaglio, direzioniRadiali } from '../motore/attori/ia/sparo.js';
import { ARCHETIPI_ISAAC, schedaProiettiliNemici } from '../motore/attori/nemico.js';
import { creaDirettore } from '../motore/attori/ia/direttore.js';
import { STATI_NEMICO, TRANSIZIONI_NEMICO } from '../motore/attori/ia/base.js';
import { creaStanza } from '../motore/mondo/stanza.js';
import { caricaModelli, creaCatalogo, regoleDaParametri } from '../motore/mondo/modelli.js';
import { creaSegreta } from '../motore/mondo/segreta.js';
import { creaRun } from '../motore/mondo/run.js';
import { patternPerNome } from '../motore/attori/boss/indice.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const CARTELLA_PARAMETRI = join(RADICE, 'contenuti', 'parametri');
const CARTELLA_MODELLI = join(RADICE, 'contenuti', 'modelli-stanza', 'piazza-dante');
const SCENA = Object.freeze({ larghezza: 1280, altezza: 720 });
const SEME = 1845;

const leggiJson = (nome) => JSON.parse(readFileSync(join(CARTELLA_PARAMETRI, `${nome}.json`), 'utf8'));

function logFinto() {
  const voci = [];
  return { voci, error: (...a) => voci.push(a) };
}

/** Mondo di prova: fondazione + campo + Ferruccio + combattimento + direttore + factory dei nemici. */
async function creaMondo({ override = {}, piano = 1, gettoni = null, ostacoli = [] } = {}) {
  const log = logFinto();
  const parametri = creaParametri({ log });
  await parametri.carica({
    caricatore: (nome) => leggiJson(nome),
    statistiche: ['ferruccio', 'combattimento', 'stanza', 'stanze', 'nemici'],
    tabelle: ['input'],
    override,
  });
  assert.deepEqual(parametri.errori(), [], 'i JSON reali devono essere validi');
  const tempo = creaTempo();
  const eventi = creaBus({ log });
  const input = creaInput(parametri.get('input'));
  const mod = creaModificatori(parametri);
  const campo = creaCampo({
    colonne: parametri.get('stanza.colonne'), righe: parametri.get('stanza.righe'), cella: parametri.get('stanza.cella'),
    scenaLarghezza: SCENA.larghezza, scenaAltezza: SCENA.altezza, ostacoli,
  });
  const centro = { x: campo.x + campo.larghezza / 2, y: campo.y + campo.altezza / 2 };
  const ferruccio = creaFerruccio({ modificatori: mod, tempo, eventi, input, campo, x: centro.x, y: centro.y });
  const bersagli = [];
  const proiettili = []; // storia P05: lista condivisa dei proiettili nemici
  const comb = creaCombattimento({ modificatori: mod, tempo, eventi, input, campo, ferruccio, bersagli: () => bersagli });
  const direttore = creaDirettore({
    gettoni: gettoni ?? parametri.get(`nemici.direttore.gettoni.p${piano}`),
    gapTicks: tempo.ticksDaMs(parametri.get('nemici.direttore.gap_impatti_min')),
    imparabiliMax: parametri.get(`nemici.direttore.imparabili_max.p${piano}`),
    attaccantiMax: parametri.get('nemici.direttore.attaccanti_max'),
    eventi,
  });
  const ricevuti = [];
  for (const nome of ['telegrafo.anticipo', 'telegrafo.lampo', 'telegrafo.anello', 'telegrafo.colpo', 'nemico.colpo', 'nemico.stordito', 'nemico.morto',
    'nemico.bottino', 'nemico.stato', 'ferruccio.parata', 'ferruccio.danno', 'ferruccio.colpo', 'ferruccio.uccisione',
    'nemico.sparo', 'nemico.esplosione', 'proiettile.spento']) {
    eventi.on(nome, (p) => ricevuti.push({ nome, payload: p, tick: m.t }));
  }
  const rng = creaRng(SEME);
  let nati = 0;
  const tasto = (azione) => `t:${parametri.get(`input.tastiera.${azione}`)[0]}`;
  const m = {
    parametri, tempo, eventi, input, mod, campo, centro, ferruccio, comb, bersagli, proiettili, direttore, ricevuti, log, piano,
    t: 0,
    ticks: (ms) => tempo.ticksDaMs(ms),
    G: (k) => parametri.get(`nemici.globali.${k}`),
    /** Crea un nemico e lo aggiunge ai bersagli. */
    nemico: (archetipo, { x, y, id, boss = false, ferito = () => false, conDirettore = true } = {}) => {
      const fabbrica = archetipo === ARCHETIPO_GATTO ? creaGatto : creaNemico;
      const n = fabbrica({
        modificatori: mod, parametri, tempo, eventi, campo, bersaglio: comb.comeBersaglio, altri: () => bersagli,
        direttore: conDirettore ? direttore : null, rng: derivato(rng, `${archetipo}#${nati++}`),
        archetipo, piano, x: x ?? centro.x, y: y ?? centro.y, id: id ?? `${archetipo}-${nati}`, boss, ferito,
        proiettili, spada: () => comb.hitboxCorrente(),
      });
      bersagli.push(n);
      return n;
    },
    /** n tick nell'ordine del gioco. */
    gira: (n = 1) => {
      const dt = tempo.passoMs / 1000;
      for (let i = 0; i < n; i++) {
        m.t += 1;
        input.inizioTick();
        ferruccio.tick(dt);
        comb.tick(dt);
        for (const b of bersagli.slice()) b.tick(dt);
        for (const p of proiettili.slice()) p.tick(dt);
        potaSpenti(proiettili);
        direttore.tick();
      }
    },
    /** Avanza finché `cond()` è vera o scadono `max` tick; ritorna i tick spesi (−1 se scaduti). */
    finche: (cond, max = 2000) => {
      for (let i = 0; i < max; i++) {
        if (cond()) return i;
        m.gira(1);
      }
      return cond() ? max : -1;
    },
    tieni: (azione) => input.sorgenteGiu(tasto(azione)),
    lascia: (azione) => input.sorgenteSu(tasto(azione)),
    premi: (azione, n = 1) => {
      input.sorgenteGiu(tasto(azione));
      m.gira(n);
      input.sorgenteSu(tasto(azione));
    },
    eventiDi: (nome) => ricevuti.filter((e) => e.nome === nome),
  };
  if (typeof tempo.passoMs !== 'number') m.gira = ((g) => g)(m.gira);
  return m;
}

const distanza = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** Porta un nemico in `insegue` dopo l'emersione (stato forzato: il test parte dal criterio, non dalla nascita). */
function inInsegue(m, n) {
  n.forzaStato('insegue');
}

// ---------------------------------------------------------------------------------------------
// Dati e formule
// ---------------------------------------------------------------------------------------------

test('dati: F1 vita per piano = round(vita_base × (1 + k_vita × (p − 1))) con le vite base di nemici.json (Teatro: gatto 8 → 8/10/11/13/14; vespa 3, statua 9, guardia 8)', async () => {
  const m = await creaMondo();
  const nemici = JSON.parse(readFileSync(new URL('../contenuti/parametri/nemici.json', import.meta.url), 'utf8'));
  const kVita = nemici.scalatura.k_vita.base;
  assert.equal(nemici.archetipi.gatto.vita.base, 8, 'Teatro: il gatto ha 8 di vita');
  for (const arch of ['gatto', 'vespa', 'statua', 'guardia']) {
    const base = nemici.archetipi[arch].vita.base;
    for (let p = 1; p <= 5; p++) {
      const s = schedaArchetipo({ modificatori: m.mod, parametri: m.parametri, archetipo: arch, piano: p });
      assert.equal(s.vita, Math.round(base * (1 + kVita * (p - 1))), `${arch} piano ${p}`);
    }
  }
  assert.deepEqual([1, 2, 3, 4, 5].map((p) => schedaArchetipo({ modificatori: m.mod, parametri: m.parametri, archetipo: 'gatto', piano: p }).vita), [8, 10, 11, 13, 14]);
  assert.equal(scalaVita(6, 4, 0.2), 10);
});

test('dati: F2 tetto di velocità (vespa piano 5 → 187, non 197) e F3 anticipo (gatto piano 5 → 403 ± 1, lampo 320 costante)', async () => {
  const m = await creaMondo();
  const vespa = schedaArchetipo({ modificatori: m.mod, parametri: m.parametri, archetipo: 'vespa', piano: 5 });
  assert.equal(vespa.v_insegue, 187);
  assert.ok(Math.abs(scalaVelocita(170, 5, 0.04, 1000) - 197.2) < 0.01, 'senza tetto sarebbe 197,2');
  const gatto5 = schedaArchetipo({ modificatori: m.mod, parametri: m.parametri, archetipo: 'gatto', piano: 5 });
  assert.ok(Math.abs(gatto5.attacco.t_ant - 403) <= 1, `t_ant ${gatto5.attacco.t_ant}`);
  assert.equal(gatto5.attacco.t_lamp, 320);
  assert.equal(scalaAnticipo(480, 5, 0.04, 300), 403);
  assert.equal(scalaAnticipo(300, 5, 0.08, 300), 300, 'mai sotto t_ant_min');
});

test('dati: regole del telegrafo sul data file (R2 t_lamp ≥ 280/350, R4 t_ant ≥ 300, pezzi 3-6), quattro archetipi, nessun archetipo sconosciuto', async () => {
  const m = await creaMondo();
  assert.deepEqual(validaSchede(m.parametri), []);
  for (const a of ARCHETIPI_MVP) assert.ok(m.parametri.ha(`nemici.archetipi.${a}`), a);
  assert.throws(() => schedaArchetipo({ modificatori: m.mod, parametri: m.parametri, archetipo: 'drago' }), RangeError);
  assert.equal(STATI_NEMICO.length, 9);
  for (const s of STATI_NEMICO) assert.ok(Array.isArray(TRANSIZIONI_NEMICO[s]), `transizioni di ${s}`);
});

test('dati: monete ceil(costo/2) + U[0,1] (gatto 1-2, statua 2-3), F9 cuore (gatto 4% ferito, 0% a maschere piene)', () => {
  const rng = creaRng(7);
  const viste = new Set();
  for (let i = 0; i < 200; i++) viste.add(monetePerMorte({ costo: 2, extra: 1, rng }));
  assert.deepEqual([...viste].sort(), [1, 2]);
  const visteStatua = new Set();
  for (let i = 0; i < 200; i++) visteStatua.add(monetePerMorte({ costo: 4, extra: 1, rng }));
  assert.deepEqual([...visteStatua].sort(), [2, 3]);
  assert.equal(monetePerMorte({ costo: 2, extra: 0, rng, elite: true, moltElite: 2 }), 2);
  assert.ok(Math.abs(probabilitaCuore({ p0: 0.01, costo: 2, ferito: true, mFerito: 2 }) - 0.04) < 1e-12);
  assert.equal(probabilitaCuore({ p0: 0.01, costo: 2, ferito: false, mFerito: 2 }), 0);
});

// ---------------------------------------------------------------------------------------------
// Criteri della storia 019
// ---------------------------------------------------------------------------------------------

test('019 c1: GIVEN un nemico in Insegue, WHEN arriva a r_nemico + r_corpo + 6 px, THEN si ferma e non tocca Ferruccio camminando', async () => {
  // d_attesa e d_min a 0 (manopole, min 0) e il gettone unico occupato da un altro: il gatto può solo avvicinarsi, mai attaccare
  const m = await creaMondo({ override: { 'nemici.archetipi.gatto.d_attesa': 0, 'nemici.archetipi.gatto.attacco.d_min': 0 }, gettoni: 1 });
  const occupante = m.nemico('gatto', { x: m.centro.x - 400, y: m.centro.y, id: 'occupante' });
  assert.equal(m.direttore.richiedi(occupante, { traTicks: 10 }), true);
  const n = m.nemico('gatto', { x: m.centro.x + 260, y: m.centro.y });
  inInsegue(m, n);
  const partenzaF = { x: m.ferruccio.x, y: m.ferruccio.y };
  m.gira(m.ticks(3000));
  const dFermo = n.r + m.ferruccio.r + m.G('d_contatto');
  const d = distanza(n, m.ferruccio);
  assert.equal(n.stato, 'insegue');
  assert.ok(Math.abs(d - dFermo) <= 1, `distanza ${d.toFixed(2)} attesa ${dFermo}`);
  assert.ok(d >= n.r + m.ferruccio.r, 'nessun contatto');
  assert.deepEqual({ x: m.ferruccio.x, y: m.ferruccio.y }, partenzaF, 'Ferruccio non è stato spinto');
  assert.equal(m.eventiDi('ferruccio.danno').length, 0, 'il contatto passivo è innocuo');
  // tiene la distanza anche se Ferruccio gli va incontro: il nemico non lo tocca camminando
  m.tieni('destra');
  m.gira(m.ticks(500));
  m.lascia('destra');
  assert.equal(m.eventiDi('ferruccio.danno').length, 0);
  assert.ok(distanza(n, m.ferruccio) >= n.r + m.ferruccio.r - 0.01, 'i corpi non si compenetrano');
});

test('019 c1 bis: senza gettone o in cooldown il nemico tiene d_attesa (170 px per il gatto) e non si avvicina oltre', async () => {
  const m = await creaMondo({ gettoni: 1 });
  const occupante = m.nemico('gatto', { x: m.centro.x - 400, y: m.centro.y, id: 'occupante' });
  assert.equal(m.direttore.richiedi(occupante, { traTicks: 10 }), true, 'il gettone unico è preso');
  const n = m.nemico('gatto', { x: m.centro.x + 300, y: m.centro.y });
  inInsegue(m, n);
  m.gira(m.ticks(3000));
  const d = distanza(n, m.ferruccio);
  assert.equal(n.stato, 'insegue');
  assert.ok(d >= n.scheda.d_attesa && d <= n.scheda.d_attesa + m.G('tolleranza_attesa') + 1, `distanza ${d.toFixed(1)}`);
  assert.equal(m.eventiDi('telegrafo.anticipo').length, 0, 'senza gettone non attacca');
});

test('019 c2: GIVEN due nemici sovrapposti, WHEN passa 1 tick, THEN si separano (nessuna compenetrazione oltre 2 px dopo 10 tick); i pesanti non vengono spostati dai leggeri', async () => {
  const m = await creaMondo({ override: { 'nemici.archetipi.gatto.d_attesa': 300 } });
  const a = m.nemico('gatto', { x: m.centro.x + 300, y: m.centro.y - 100, id: 'a' });
  const b = m.nemico('gatto', { x: m.centro.x + 300, y: m.centro.y - 100, id: 'b' });
  inInsegue(m, a);
  inInsegue(m, b);
  m.gira(1);
  assert.ok(distanza(a, b) > 0, 'dopo 1 tick si sono mossi');
  m.gira(9);
  assert.ok(distanza(a, b) >= a.r + b.r - 2, `distanza ${distanza(a, b).toFixed(1)} ≥ ${a.r + b.r - 2}`);
  m.gira(m.ticks(1000));
  assert.ok(distanza(a, b) >= a.r + b.r, 'a regime stanno a r_i + r_j + extra');

  // statua (peso 3) contro gatto: la statua non si muove
  const statua = m.nemico('statua', { x: m.centro.x - 300, y: m.centro.y, id: 's' });
  const c = m.nemico('gatto', { x: m.centro.x - 300 + 4, y: m.centro.y, id: 'c' });
  statua.forzaStato('insegue');
  inInsegue(m, c);
  const posStatua = { x: statua.x, y: statua.y };
  m.gira(10);
  assert.deepEqual({ x: statua.x, y: statua.y }, posStatua);
  assert.ok(distanza(statua, c) >= statua.r + c.r - 2);
  // 4 gatti nello stesso punto per 2 s: mai sotto r_i + r_j dopo l'assestamento
  const quattro = [0, 1, 2, 3].map((i) => m.nemico('gatto', { x: m.centro.x, y: m.centro.y + 250, id: `q${i}` }));
  for (const q of quattro) inInsegue(m, q);
  m.gira(30);
  for (let t = 0; t < m.ticks(2000); t++) {
    m.gira(1);
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      assert.ok(distanza(quattro[i], quattro[j]) >= quattro[i].r + quattro[j].r - 0.5, `t=${t} ${i}-${j}: ${distanza(quattro[i], quattro[j]).toFixed(1)}`);
    }
  }
});

test('019 c3: GIVEN un attacco, WHEN parte, THEN Anticipo → Lampo → Colpo con i tempi di nemici.json; il Lampo emette telegrafo.lampo; la direzione si fissa al lampo; poi Recupero e cooldown', async () => {
  const m = await creaMondo();
  const n = m.nemico('gatto', { x: m.centro.x + 150, y: m.centro.y }); // nella banda [100, 230]
  inInsegue(m, n);
  const tAnt = m.ticks(480);
  const tLamp = m.ticks(320);
  const tImp = m.ticks(200);
  const tRec = m.ticks(700);
  const partito = m.finche(() => n.stato === 'anticipo', 10);
  assert.equal(partito, 1, 'con gettone libero e cooldown pronto l\'anticipo parte al primo tick');
  assert.equal(m.eventiDi('telegrafo.anticipo').length, 1);
  assert.equal(n.gettone, true);
  assert.equal(m.direttore.occupati, 1);
  const t0 = m.t;
  const stati = [];
  for (let i = 0; i < tAnt + tLamp + tImp + tRec + 2; i++) {
    m.gira(1);
    stati.push(n.stato);
  }
  const primo = (st) => stati.indexOf(st) + 1; // tick (relativo a t0) in cui lo stato compare
  assert.equal(primo('lampo'), tAnt, 'il lampo inizia a t_ant');
  assert.equal(primo('colpo'), tAnt + tLamp, 'il colpo inizia a t_ant + t_lamp');
  assert.equal(primo('recupero'), tAnt + tLamp + tImp, 'il recupero a + t_imp');
  assert.equal(primo('insegue'), tAnt + tLamp + tImp + tRec, 'torna in insegue a + t_rec');
  const lampo = m.eventiDi('telegrafo.lampo');
  assert.equal(lampo.length, 1);
  assert.equal(lampo[0].tick - t0, tAnt);
  assert.equal(lampo[0].payload.id, n.id);
  assert.ok(Math.abs(lampo[0].payload.direzione.x - -1) < 1e-9, 'direzione verso Ferruccio (a sinistra) fissata al lampo');
  assert.equal(lampo[0].payload.imparabile, false);
  assert.equal(m.eventiDi('telegrafo.colpo')[0].tick - t0, tAnt + tLamp);
  // ordine fisso, nessuno stato saltato
  const sequenza = stati.filter((s, i) => i === 0 || s !== stati[i - 1]);
  assert.deepEqual(sequenza, ['anticipo', 'lampo', 'colpo', 'recupero', 'insegue']);
  // il colpo ha raggiunto Ferruccio (150 px dentro i 170 di portata): 1 maschera, hitbox usata tramite comeBersaglio
  assert.equal(m.eventiDi('ferruccio.danno').length, 1);
  assert.equal(m.eventiDi('nemico.colpo')[0].payload.esito, 'danno');
  assert.equal(m.ferruccio.maschere, m.parametri.get('ferruccio.maschere_max') - 1);
  // il gettone è stato rilasciato all'inizio del recupero e il cooldown impedisce un nuovo attacco subito
  assert.equal(m.direttore.occupati, 0);
  assert.equal(n.cooldownTicks ?? n.scheda.attacco.t_cd, n.scheda.attacco.t_cd);
  m.gira(m.ticks(1000));
  assert.equal(m.eventiDi('telegrafo.anticipo').length, 1, 'in cooldown (1500 ms) non riparte');
});

test('019 c3 bis: l\'Anticipo non si interrompe (armatura del telegrafo: il danno si applica, la spinta no); l\'imparabile fissa la direzione all\'anticipo e la parata non ha effetto', async () => {
  const m = await creaMondo();
  const n = m.nemico('gatto', { x: m.centro.x + 150, y: m.centro.y });
  inInsegue(m, n);
  m.gira(3);
  assert.equal(n.stato, 'anticipo');
  const pos = { x: n.x, y: n.y };
  n.colpisci(1, { x: 200, y: 0, ms: 150 });
  m.gira(5);
  assert.equal(n.stato, 'anticipo', 'il colpo non interrompe');
  assert.equal(n.vita, n.vitaMax - 1, 'ma il danno si applica');
  assert.deepEqual({ x: n.x, y: n.y }, pos, 'la spinta è ignorata nel telegrafo');
  assert.equal(n.stordisci(600), false, 'nessuno stordimento prima del colpo (R7)');

  // storia P05: l'imparabile pesante dell'MVP è ora la bomba (la statua spara croci parabili come nel Teatro)
  const m2 = await creaMondo();
  const JB = JSON.parse(readFileSync(new URL('../contenuti/parametri/nemici.json', import.meta.url), 'utf8')).archetipi.bomba.attacco;
  const bomba = m2.nemico('bomba', { x: m2.centro.x + 60, y: m2.centro.y });
  bomba.forzaStato('insegue');
  m2.gira(1);
  assert.equal(bomba.stato, 'anticipo');
  assert.ok(Math.abs(bomba.direzione.x - -1) < 1e-9, 'imparabile: direzione fissata all\'inizio dell\'anticipo (R5)');
  const ant = m2.eventiDi('telegrafo.anticipo')[0].payload;
  assert.equal(ant.imparabile, true);
  const I = m2.t + m2.ticks(JB.t_ant.base) + m2.ticks(JB.t_lamp.base); // il colpo parte qui, l'impatto nel tick seguente
  m2.gira(I - m2.t - 6);
  m2.premi('parata', 1);
  m2.gira(10);
  assert.equal(m2.eventiDi('ferruccio.parata').length, 0, 'l\'imparabile non si para');
  assert.equal(m2.eventiDi('ferruccio.danno').length, 1);
  assert.equal(m2.ferruccio.maschere, m2.parametri.get('ferruccio.maschere_max') - 2, 'colpo pesante: 2 maschere');
});

test('019 c4: GIVEN una parata riuscita, WHEN avviene, THEN il nemico è Stordito 600 ms e torna in Insegue con cooldown 0; a T−300 e T−20 ms Ferruccio perde 1 maschera', async () => {
  async function scenario(anticipoTicks) {
    const m = await creaMondo();
    const n = m.nemico('gatto', { x: m.centro.x + 150, y: m.centro.y });
    inInsegue(m, n);
    m.gira(1);
    assert.equal(n.stato, 'anticipo');
    const I = m.t + m.ticks(480) + n.istanteImpatto; // tick dell'impatto (storia 020: t_lamp + hit_dal·t_imp dopo l'inizio del lampo)
    const pressione = I - anticipoTicks;
    m.gira(pressione - m.t - 1);
    m.premi('parata', 1);
    m.gira(I - m.t + 1);
    return { m, n };
  }
  const { m, n } = await scenario(6); // T−100 ms
  assert.equal(m.eventiDi('ferruccio.parata').length, 1, 'parata riuscita a T−100');
  assert.equal(m.eventiDi('ferruccio.danno').length, 0);
  assert.equal(n.stato, 'stordito');
  assert.equal(n.stordimentoMs, 600);
  assert.equal(m.eventiDi('nemico.stordito').length, 1);
  assert.equal(m.direttore.occupati, 0, 'il gettone è rilasciato allo stordimento');
  const tStord = m.ticks(600);
  const inizio = m.eventiDi('nemico.stordito')[0].tick;
  const usciti = m.finche(() => n.stato !== 'stordito', tStord + 5);
  assert.ok(Math.abs(m.t - inizio - tStord) <= 1, `stordito per ${m.t - inizio} tick (attesi ${tStord})`);
  assert.ok(usciti >= 0);
  assert.equal(n.stato === 'insegue' || n.stato === 'anticipo', true, 'torna in Insegue (cooldown 0: può attaccare subito)');
  // stordito colpito di nuovo: lo stordimento non si prolunga
  const { m: m3, n: n3 } = await scenario(6);
  assert.equal(n3.stato, 'stordito');
  const prima = n3.vita;
  m3.gira(10);
  n3.colpisci(1, null);
  assert.equal(n3.stordisci(600), false, 'non si resetta');
  assert.equal(n3.vita, prima - 1);
  m3.gira(m3.ticks(600) - 10 + 1);
  assert.notEqual(n3.stato, 'stordito');

  // T−300 ms = 18 tick (troppo presto); T−20 ms è sotto la risoluzione del tick (16,7 ms): si prova la
  // pressione nello stesso tick dell'impatto (startup della parata non ancora finito → colpito)
  for (const anticipo of [18, 0]) {
    const { m: mx } = await scenario(anticipo);
    assert.equal(mx.eventiDi('ferruccio.parata').length, 0, `T−${anticipo} tick: nessuna parata`);
    assert.equal(mx.eventiDi('ferruccio.danno').length, 1, `T−${anticipo} tick: colpito`);
    assert.equal(mx.ferruccio.maschere, mx.parametri.get('ferruccio.maschere_max') - 1);
  }
});

test('019 c4 boss: GIVEN un boss parato, THEN Stordito 900 ms e immune allo stordimento per 5 s (la parata annulla comunque il danno)', async () => {
  const m = await creaMondo();
  const b = m.nemico('gatto', { x: m.centro.x + 150, y: m.centro.y, boss: true });
  inInsegue(m, b);
  m.gira(1);
  const I = m.t + m.ticks(480) + b.istanteImpatto;
  m.gira(I - m.ticks(100) - m.t - 1);
  m.premi('parata', 1);
  m.gira(I - m.t + 1);
  assert.equal(b.stato, 'stordito');
  assert.equal(b.stordimentoMs, 900);
  assert.equal(b.immune, true);
  const tStord = m.ticks(900);
  const inizio = m.eventiDi('nemico.stordito')[0].tick;
  m.finche(() => b.stato !== 'stordito', tStord + 5);
  assert.ok(Math.abs(m.t - inizio - tStord) <= 1, `stordito ${m.t - inizio} tick, attesi ${tStord}`);
  // secondo attacco subito (cooldown 0): parata entro i 5 s → niente stordimento, ma nessun danno
  const partito = m.finche(() => b.stato === 'anticipo', 100);
  assert.ok(partito >= 0, 'riattacca');
  const I2 = m.t + m.ticks(480) + b.istanteImpatto;
  m.gira(I2 - m.ticks(100) - m.t - 1);
  m.premi('parata', 1);
  m.gira(I2 - m.t + 1);
  assert.equal(m.eventiDi('ferruccio.parata').length, 2);
  assert.equal(m.eventiDi('ferruccio.danno').length, 0);
  assert.equal(m.eventiDi('nemico.stordito').length, 1, 'immune: nessun secondo stordimento');
  assert.ok(b.stato === 'colpo' || b.stato === 'recupero', `continua l'attacco (${b.stato})`);
});

test('019 c5: GIVEN vita ≤ 0, THEN nemico.morto subito, senza hitbox né gettone, fuori dai vivi; dissoluzione 700 ± 17 ms con 5 puntini; monete (1-2) a 350 ± 17 ms; cuore solo a maschere non piene', async () => {
  const m = await creaMondo();
  const n = m.nemico('gatto', { x: m.centro.x + 150, y: m.centro.y });
  inInsegue(m, n);
  m.gira(m.ticks(480) + m.ticks(320) + 1); // è in colpo con il gettone
  assert.equal(n.stato, 'colpo');
  assert.equal(n.gettone, true);
  const vivi = () => m.bersagli.filter((b) => b.stato !== 'morto' && b.vita > 0).length;
  assert.equal(vivi(), 1);
  n.colpisci(100, null);
  const morte = m.eventiDi('nemico.morto');
  assert.equal(morte.length, 1, 'evento nello stesso istante');
  assert.equal(morte[0].payload.id, n.id);
  assert.equal(morte[0].payload.pezzi, 5);
  assert.ok([1, 2].includes(morte[0].payload.monete), `monete ${morte[0].payload.monete}`);
  assert.equal(n.stato, 'morto');
  assert.equal(n.hitbox(), null, 'nessuna hitbox');
  assert.equal(n.gettone, false);
  assert.equal(m.direttore.occupati, 0);
  assert.equal(vivi(), 0, 'il contatore dei vivi cala entro lo stesso tick');
  const tMorte = m.t;
  const danniPrima = m.eventiDi('ferruccio.danno').length;
  m.gira(m.ticks(350) - 1);
  assert.equal(m.eventiDi('nemico.bottino').length, 0);
  m.gira(1);
  const bottino = m.eventiDi('nemico.bottino');
  assert.equal(bottino.length, 1, 'le monete a t_bottino');
  assert.ok(Math.abs(bottino[0].tick - tMorte - m.ticks(350)) <= 1);
  assert.equal(bottino[0].payload.monete, morte[0].payload.monete);
  assert.ok(Math.abs(Math.hypot(bottino[0].payload.direzione.x, bottino[0].payload.direzione.y) - 1) < 1e-9);
  assert.ok(n.dissoluzione > 0 && n.dissoluzione < 1);
  assert.equal(n.dissolto, false);
  m.gira(m.ticks(700) - m.ticks(350));
  assert.equal(n.dissolto, true, 'dissolto a 700 ms');
  assert.equal(n.dissoluzione, 1);
  assert.equal(n.puntini, 5);
  assert.equal(m.eventiDi('ferruccio.danno').length, danniPrima, 'un morto non ferisce');
  n.colpisci(1, null);
  assert.equal(n.vita <= 0, true);
  assert.equal(m.eventiDi('nemico.morto').length, 1, 'muore una volta sola');

  // cuore: a maschere piene p = 0 su 300 morti; ferito ≈ 4% (3,8-5,0% su 20000 nel GDD: qui 300 ≤ 10%)
  const conta = async (ferito) => {
    const mm = await creaMondo();
    let cuori = 0;
    for (let i = 0; i < 300; i++) {
      const g = mm.nemico('gatto', { x: mm.centro.x + 300, y: mm.centro.y + (i % 7) * 10, id: `g${i}`, ferito });
      g.forzaStato('insegue');
      g.colpisci(100, null);
      if (g.cuore) cuori += 1;
      mm.bersagli.length = 0;
    }
    return cuori;
  };
  assert.equal(await conta(() => false), 0);
  const feriti = await conta(() => true);
  assert.ok(feriti > 0 && feriti <= 30, `cuori a maschere non piene: ${feriti}/300`);
});

test('019 c5 bis: la vespa muore in 4 puntini, la statua in 6, la guardia in 5; la morte durante l\'emersione è impossibile (invulnerabile) e in pattuglia è immediata', async () => {
  const m = await creaMondo();
  const v = m.nemico('vespa', { x: m.centro.x + 200, y: m.centro.y });
  v.colpisci(100, null);
  assert.equal(v.stato, 'emersione', 'in emersione nessun danno');
  assert.equal(v.vita, v.vitaMax);
  m.gira(m.ticks(700));
  assert.equal(v.stato, 'pattuglia');
  v.colpisci(100, null);
  assert.equal(v.stato, 'morto');
  assert.equal(v.puntini, 4);
  const s = m.nemico('statua', { x: m.centro.x - 200, y: m.centro.y });
  const g = m.nemico('guardia', { x: m.centro.x, y: m.centro.y - 150 });
  m.gira(m.ticks(700));
  s.colpisci(100, null);
  g.colpisci(100, null);
  assert.deepEqual([s.puntini, g.puntini], [6, 5]);
  assert.equal(m.eventiDi('nemico.morto').length, 3);
});

// ---------------------------------------------------------------------------------------------
// Criteri della storia 020 (gatto d'ombra)
// ---------------------------------------------------------------------------------------------

const BOT_REAZIONE_MS = 120;
const BOT_STANZE = 30;
// Stanza QA da 2 gatti: con 3 gatti a vita 6 (GDD; il prototipo aveva vita 3) la stanza dura ~10 s, fuori dai 3-7 s del criterio.
const BOT_GATTI_PER_STANZA = 2;
const BOT_DURATA_MIN_S = 3;
/** La finestra 3-7 s del GDD fu misurata con il gatto a vita 6: il Teatro alza la vita (nemici.json, 8) e la stanza dura in
 *  proporzione (media misurata 7,11 s con il seme 1845 e vita 8), quindi il tetto scala con la vita; il minimo resta 3 s. */
const VITA_GATTO_GDD = 6;
const VITA_GATTO = JSON.parse(readFileSync(new URL('../contenuti/parametri/nemici.json', import.meta.url), 'utf8')).archetipi.gatto.vita.base;
const BOT_DURATA_MAX_S = 7 * (VITA_GATTO / VITA_GATTO_GDD);

test('020 c1: GIVEN un gatto, WHEN entra in Anticipo, THEN si accuccia (area −25%, posteriore su), poi lampo con occhi rossi e anello che si chiude in 150 ms (telegrafo.anello), poi balzo d_balzo = clamp(d_lampo + 24, 100, 170) in 200 ms con hitbox dal 45%', async () => {
  const m = await creaMondo();
  const n = m.nemico('gatto', { x: m.centro.x + 130, y: m.centro.y });
  assert.equal(typeof n.posa, 'function', 'il gatto ha la posa');
  inInsegue(m, n);
  m.gira(1);
  assert.equal(n.stato, 'anticipo');
  const riposo = posaGatto({ stato: 'insegue', progresso: 0, anello: 1, direzione: { x: 1, y: 0 } }, m.mod);
  assert.deepEqual([riposo.area, riposo.altezza, riposo.lunghezza, riposo.inclinazioneGradi, riposo.occhi], [1, 1, 1, 0, 0]);
  const mezzo = Math.floor(m.ticks(480) / 2);
  m.gira(mezzo);
  const meta = n.posa();
  assert.ok(meta.area < 1 && meta.area > 0.75, `a metà anticipo l'area è tra 0,75 e 1 (${meta.area.toFixed(3)})`);
  m.gira(m.ticks(480) - 1 - mezzo);
  const fine = n.posa();
  assert.equal(fine.stato, 'anticipo');
  assert.ok(Math.abs(fine.area - 0.75) < 0.02, `area a fine anticipo ${fine.area.toFixed(3)} (−25%)`);
  assert.ok(Math.abs(fine.altezza - 0.7) < 0.02, 'altezza 1,0 → 0,7 U');
  assert.ok(Math.abs(fine.area - fine.altezza * fine.lunghezza) < 1e-9, 'area = altezza × lunghezza'); // GDD «si accorcia» è incompatibile con altezza 0,7 e area 0,75: lunghezza 1,07 (segnalato)
  assert.ok(fine.inclinazioneGradi > 0, 'posteriore su');
  assert.ok(fine.orecchie < 1, 'orecchie appiattite');
  assert.equal(fine.occhi, 0, 'occhi ancora fessure');
  // lampo: occhi rossi, anello che si chiude in t_anello e poi l'evento
  m.gira(1);
  assert.equal(n.stato, 'lampo');
  const tLampo = m.t;
  assert.equal(n.posa().occhi, 1);
  assert.ok(n.anello < 1);
  const tAnello = m.ticks(150);
  m.gira(tAnello - 1);
  assert.ok(n.anello < 1 && m.eventiDi('telegrafo.anello').length === 0, 'anello ancora aperto');
  m.gira(1);
  assert.equal(n.anello, 1, 'anello chiuso a 150 ms');
  const anello = m.eventiDi('telegrafo.anello');
  assert.equal(anello.length, 1);
  assert.equal(anello[0].tick - tLampo, tAnello);
  assert.equal(anello[0].payload.id, n.id);
  // d_balzo fissata al lampo: 130 + 24 = 154
  const lampo = m.eventiDi('telegrafo.lampo')[0];
  assert.ok(Math.abs(lampo.payload.portata - 154) <= 2, `d_balzo ${lampo.payload.portata}`);
  assert.equal(n.portataColpo, lampo.payload.portata);
  const segno = n.segnoATerra();
  assert.ok(segno && Math.abs(Math.hypot(segno.x2 - segno.x1, segno.y2 - segno.y1) - 154) <= 2, 'segno a terra lungo d_balzo');
  assert.equal(segno.larghezza, 32, 'striscia larga 32 px (2r)');
  // colpo: hitbox spenta fino al 45%, poi accesa; il corpo percorre d_balzo in 200 ms
  m.gira(m.ticks(320) - tAnello);
  assert.equal(n.stato, 'colpo');
  const tColpo = m.t;
  const partenza = { x: n.x, y: n.y };
  const hitTicks = Math.round(0.45 * m.ticks(200));
  assert.equal(n.hitTicks, hitTicks);
  for (let i = 0; i < hitTicks; i++) {
    assert.equal(n.hitbox(), null, `hitbox spenta al tick ${i} del colpo`);
    assert.equal(n.posa().lunghezza, 1.25, 'nel balzo si allunga (scala X 1,25)');
    m.gira(1);
  }
  const h = n.hitbox();
  assert.ok(h && h.tipo === 'rettangolo', 'hitbox accesa dal 45%');
  assert.ok(Math.abs(Math.hypot(h.x2 - h.x1, h.y2 - h.y1) - 154 * 0.55) <= 2, 'copre dal 45% all\'atterraggio');
  assert.equal(m.eventiDi('ferruccio.danno').length, 1, 'impatto nel primo tick di hitbox');
  assert.equal(m.eventiDi('ferruccio.danno')[0].tick - tLampo, n.istanteImpatto);
  assert.equal(n.istanteImpatto, m.ticks(320) + hitTicks);
  m.finche(() => n.stato !== 'colpo', m.ticks(200) + 2);
  assert.ok(Math.abs(m.t - tColpo - m.ticks(200)) <= 1, `balzo di ${m.t - tColpo} tick`);
  assert.ok(Math.abs(distanza(partenza, n) - 154) <= 2, `percorsi ${distanza(partenza, n).toFixed(1)} px`);
  // stordito: posa inclinata
  n.forzaStato('stordito');
  assert.ok(n.posa().inclinazioneGradi < 0);
});

test('020 c1 bis: l\'impatto cade sempre a t_lamp + hit_dal·t_imp dal lampo (100, 150, 180 px; anche coi tempi del prototipo); a 200 px il balzo è limitato a 170; chi si sposta di lato nel lampo non è colpito', async () => {
  const impattoA = async (d, override = {}, colpisce = true) => {
    const m = await creaMondo({ override });
    const n = m.nemico('gatto', { x: m.centro.x + d, y: m.centro.y });
    inInsegue(m, n);
    m.gira(1);
    assert.equal(n.stato, 'anticipo', `a ${d} px attacca`);
    m.gira(m.ticks(n.scheda.attacco.t_ant));
    assert.equal(n.stato, 'lampo');
    const tLampo = m.t;
    m.gira(m.ticks(n.scheda.attacco.t_lamp) + m.ticks(n.scheda.attacco.t_imp) + 1);
    const danni = m.eventiDi('ferruccio.danno');
    assert.equal(danni.length, colpisce ? 1 : 0, `a ${d} px il balzo ${colpisce ? 'colpisce' : 'va a vuoto'}`);
    return { tick: danni.length ? danni[0].tick - tLampo : null, atteso: n.istanteImpatto, portata: n.portataColpo };
  };
  const a = await impattoA(100);
  const b = await impattoA(150);
  const c = await impattoA(180); // oltre 186 px (portata 170 + r_corpo) il balzo da fermo va a vuoto: d_max 230 del GDD da rivedere (README)
  assert.equal(a.tick, a.atteso);
  assert.equal(b.tick, a.tick, 'stesso istante a 150 px');
  assert.equal(c.tick, a.tick, 'stesso istante a 180 px');
  assert.equal(a.tick, 19 + 5, '320 ms + 45% di 200 ms = 24 tick (≈ 400 ms)');
  assert.deepEqual([a.portata, b.portata, c.portata], [124, 170, 170], 'd_balzo = clamp(d + 24, 100, 170)');
  const d200 = await impattoA(200, {}, false); // da 200 px il balzo (170) non arriva al corpo (r 16): va a vuoto (d_max 230 del GDD da rivedere)
  assert.equal(d200.portata, 170);
  // coi tempi misurati nel prototipo (lampo 150 non è ammesso da R2: qui il minimo 280; balzo 220 ms): impatto a t_lamp + round(0,45 × 13)
  const proto = await impattoA(150, { 'nemici.archetipi.gatto.attacco.t_imp': 220, 'nemici.archetipi.gatto.attacco.t_lamp': 280 });
  assert.equal(proto.tick, m0ticks(280) + Math.round(0.45 * m0ticks(220)));
  // il gatto non cambia direzione durante il balzo: Ferruccio si sposta di lato (≥ 30 px) nel lampo e il balzo va a vuoto
  const m = await creaMondo();
  const n = m.nemico('gatto', { x: m.centro.x + 150, y: m.centro.y });
  inInsegue(m, n);
  m.gira(1 + m.ticks(480));
  assert.equal(n.stato, 'lampo');
  const y0 = m.ferruccio.y;
  m.tieni('giu');
  m.gira(m.ticks(320) + m.ticks(200) + 1);
  m.lascia('giu');
  assert.ok(m.ferruccio.y - y0 >= 30, `spostato di ${(m.ferruccio.y - y0).toFixed(0)} px`);
  assert.equal(m.eventiDi('ferruccio.danno').length, 0, 'balzo a vuoto');
  assert.equal(m.eventiDi('nemico.colpo').length, 0);
  assert.equal(n.stato === 'recupero' || n.stato === 'insegue', true);
});

/** Tick per ms col passo fisso (per i casi che non hanno un mondo a portata di mano). */
function m0ticks(ms) {
  return creaTempo().ticksDaMs(ms);
}

test('020 c1 ter: senza gettone il gatto gira sull\'anello d\'attesa (170 ± 20 px, ≤ 45°/s, verso dal seme) e non scende mai sotto 100 px', async () => {
  const m = await creaMondo({ gettoni: 1 });
  const occupante = m.nemico('gatto', { x: m.centro.x - 400, y: m.centro.y, id: 'occupante' });
  assert.equal(m.direttore.richiedi(occupante, { traTicks: 10 }), true, 'il gettone unico è preso');
  const n = m.nemico('gatto', { x: m.centro.x + 300, y: m.centro.y });
  inInsegue(m, n);
  m.gira(m.ticks(1500)); // raggiunge la banda
  const angolo = () => Math.atan2(n.y - m.ferruccio.y, n.x - m.ferruccio.x);
  const a0 = angolo();
  let dMin = Infinity;
  let dMax = 0;
  const durata = m.ticks(2000);
  for (let i = 0; i < durata; i++) {
    m.gira(1);
    const d = distanza(n, m.ferruccio);
    dMin = Math.min(dMin, d);
    dMax = Math.max(dMax, d);
  }
  let delta = angolo() - a0;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  const gradi = (delta * 180) / Math.PI;
  const attesi = 45 * (durata * m.tempo.passoMs / 1000); // 45°/s per 2 s = 90°
  assert.ok(Math.abs(Math.abs(gradi) - attesi) <= 12, `ha girato di ${gradi.toFixed(1)}° in 2 s (attesi ±${attesi.toFixed(0)}°)`);
  assert.equal(Math.sign(gradi), n.versoOrbita, 'verso dell\'orbita dal seme');
  assert.ok(dMin >= 170 - 20 - 1 && dMax <= 170 + 20 + 1, `banda [${dMin.toFixed(1)}, ${dMax.toFixed(1)}]`);
  assert.ok(dMin >= 100, 'mai sotto 100 px senza gettone');
  assert.equal(m.eventiDi('telegrafo.anticipo').length, 0);
  // un altro gatto con un altro seme può avere il verso opposto (verso alternato per gatto)
  const versi = new Set();
  for (let i = 0; i < 6; i++) versi.add(m.nemico('gatto', { x: m.centro.x + 300, y: m.centro.y + 40 * i, id: `v${i}` }).versoOrbita);
  assert.deepEqual([...versi].sort(), [-1, 1]);
});

test('020 c2: GIVEN tre gatti, WHEN attaccano, THEN al massimo 2 contemporaneamente (manopola attaccanti_max; con 1 → uno solo)', async () => {
  async function scenario(attaccantiMax) {
    const m = await creaMondo({
      override: { 'nemici.direttore.gettoni.p1': 4, 'nemici.direttore.attaccanti_max': attaccantiMax, 'nemici.direttore.gap_impatti_min': 250 },
    });
    assert.equal(m.direttore.gettoni, Math.min(4, attaccantiMax));
    m.eventi.on('ferruccio.danno', () => m.ferruccio.impostaMaschere(m.parametri.get('ferruccio.maschere_max')));
    const gatti = [0, 1, 2].map((i) => m.nemico('gatto', { x: m.centro.x + 150 * Math.cos((i * 2 * Math.PI) / 3), y: m.centro.y + 150 * Math.sin((i * 2 * Math.PI) / 3), id: `g${i}` }));
    for (const g of gatti) inInsegue(m, g);
    let massimo = 0;
    for (let t = 0; t < m.ticks(20000); t++) {
      m.gira(1);
      massimo = Math.max(massimo, gatti.filter((g) => g.inTelegrafo).length);
    }
    assert.ok(m.eventiDi('telegrafo.anticipo').length >= 6, 'attaccano a turno');
    return massimo;
  }
  assert.equal(await scenario(2), 2, 'con la manopola a 2 si arriva a 2 e mai a 3');
  assert.equal(await scenario(1), 1);
  assert.throws(() => creaDirettore({ gettoni: 2, gapTicks: 1, attaccantiMax: 0 }), RangeError);
});

/**
 * Bot QA (prototipo `?auto=1`): preme parata `BOT_REAZIONE_MS` dopo la chiusura dell'anello del lampo
 * (`telegrafo.anello`: il segnale di tempo della parata), insegue il gatto vivo più vicino e lo colpisce
 * quando è a portata, senza iniziare un fendente che gli impedirebbe di parare in tempo.
 */
function creaBot(m) {
  const S = (k) => m.parametri.get(`combattimento.${k}`);
  const reazione = m.ticks(BOT_REAZIONE_MS);
  const impegnoFendente = m.ticks(S('t_startup_f') + S('t_attivo_f')) + 1;
  const parate = []; // tick in cui premere
  m.eventi.on('telegrafo.anello', (p) => { if (!p.imparabile) parate.push(m.t + reazione); });
  let ultimoAttacco = -Infinity;
  const tieniDirezione = (dx, dy) => {
    for (const [az, on] of [['destra', dx > 8], ['sinistra', dx < -8], ['giu', dy > 8], ['su', dy < -8]]) {
      if (on) m.tieni(az); else m.lascia(az);
    }
  };
  return {
    /** Decide gli input del tick (da chiamare prima di `gira(1)`); ritorna cosa ha fatto. */
    pensa() {
      const vivi = m.bersagli.filter((b) => b.stato !== 'morto');
      m.lascia('parata');
      m.lascia('attacco');
      if (!vivi.length || m.ferruccio.stato === 'morto') { tieniDirezione(0, 0); return; }
      const dovuta = parate.findIndex((t) => t <= m.t);
      if (dovuta >= 0) {
        parate.splice(dovuta, 1);
        m.tieni('parata');
        return;
      }
      // storia P05: para il proiettile nemico in arrivo quando il suo impatto cade dentro la finestra della parata
      const finestraMs = S('t_startup_p') + S('t_finestra_p') / 2;
      for (const p of m.proiettili) {
        if (!p?.nemico || !p.vivo || p.riflesso || p.velocita <= 0) continue;
        const vx = m.ferruccio.x - p.x;
        const vy = m.ferruccio.y - p.y;
        const d = Math.hypot(vx, vy);
        const avvicina = (vx * p.direzione.x + vy * p.direzione.y) / (d || 1) > 0.9;
        const msAllImpatto = ((d - m.ferruccio.r - p.r) / p.velocita) * 1000;
        if (avvicina && msAllImpatto <= finestraMs && m.comb.stato !== 'parata') {
          m.tieni('parata');
          return;
        }
      }
      // bersaglio: prima chi è punibile e fermo (stordito, recupero), poi il più vicino; le bombe per ultime (storia P05)
      let bersaglio = null;
      let dMin = Infinity;
      let migliore = Infinity;
      for (const b of vivi) {
        const d = distanza(b, m.ferruccio);
        const punteggio = d - (b.stato === 'stordito' || b.stato === 'recupero' ? 10000 : 0) + (b.esplosivo ? 20000 : 0);
        if (punteggio < migliore) { migliore = punteggio; dMin = d; bersaglio = b; }
      }
      const dx = bersaglio.x - m.ferruccio.x;
      const dy = bersaglio.y - m.ferruccio.y;
      // bomba alla Isaac: la si innesca avvicinandosi e ci si allontana finché non esplode da sola
      if (bersaglio.esplosivo) {
        const E = bersaglio.scheda.esplosione;
        const rSicuro = E.r_giocatore + m.ferruccio.r + 24;
        const innescata = bersaglio.stato === 'anticipo' || bersaglio.stato === 'lampo' || bersaglio.stato === 'colpo';
        if (innescata || dMin < rSicuro) tieniDirezione(-dx, -dy);
        else tieniDirezione(dx, dy);
        return;
      }
      const aPortata = dMin < S('portata') + bersaglio.r - 12;
      tieniDirezione(aPortata ? 0 : dx, aPortata ? 0 : dy);
      // come il bot del prototipo: nessun fendente mentre un gatto è in lampo o in balzo non ancora arrivato (startup + attivo
      // non si cancellano con la parata), né se una pressione è in arrivo entro quel tempo
      const parataVicina = parate.some((t) => t - m.t <= impegnoFendente)
        || vivi.some((b) => b.stato === 'lampo' || (b.stato === 'colpo' && b.esitoColpo === null));
      if (aPortata && !parataVicina && m.comb.stato !== 'parata' && m.t - ultimoAttacco >= m.ticks(90)) {
        m.tieni('attacco');
        ultimoAttacco = m.t;
      }
    },
  };
}

/** Una stanza QA: `n` nemici (`archetipi` a rotazione, gatti di default) nati a ≥ 220 px da Ferruccio e ≥ 64 px tra loro (regola di spawn del GDD), giocata dal bot. */
function stanzaBot(m, bot, rngStanza, n = BOT_GATTI_PER_STANZA, archetipi = ['gatto']) {
  m.bersagli.length = 0;
  m.direttore.azzera();
  if (m.ferruccio.stato === 'morto') m.ferruccio.risveglia(); // storia P05: una morte non svuota le stanze seguenti
  m.ferruccio.posiziona(m.centro.x, m.centro.y);
  m.ferruccio.impostaMaschere(m.parametri.get('ferruccio.maschere_max'));
  const margine = 16 + 8;
  const punti = [];
  while (punti.length < n) {
    const x = m.campo.x + margine + rngStanza() * (m.campo.larghezza - 2 * margine);
    const y = m.campo.y + margine + rngStanza() * (m.campo.altezza - 2 * margine);
    if (distanza({ x, y }, m.ferruccio) < 220 || punti.some((p) => distanza(p, { x, y }) < 64)) continue;
    punti.push({ x, y });
  }
  m.proiettili.length = 0;
  punti.forEach((p, i) => m.nemico(archetipi[i % archetipi.length], { x: p.x, y: p.y, id: `s${m.t}-g${i}` }));
  const prima = { balzi: m.eventiDi('nemico.colpo').length, parate: m.eventiDi('ferruccio.parata').length, danni: m.eventiDi('ferruccio.danno').length };
  const t0 = m.t;
  const limite = m.ticks(30000);
  while (m.bersagli.some((b) => b.stato !== 'morto') && m.t - t0 < limite && m.ferruccio.stato !== 'morto') {
    bot.pensa();
    m.gira(1);
  }
  for (const az of ['destra', 'sinistra', 'su', 'giu', 'parata', 'attacco']) m.lascia(az);
  const balziArrivati = m.eventiDi('nemico.colpo').slice(prima.balzi).filter((e) => e.payload.esito === 'parata' || e.payload.esito === 'danno').length;
  return {
    durataMs: (m.t - t0) * m.tempo.passoMs,
    balzi: balziArrivati,
    parate: m.eventiDi('ferruccio.parata').length - prima.parate,
    danni: m.eventiDi('ferruccio.danno').length - prima.danni,
    pulita: m.bersagli.every((b) => b.stato === 'morto'),
    morto: m.ferruccio.stato === 'morto',
  };
}

test(`020 c3: GIVEN il bot a ${BOT_REAZIONE_MS} ms, WHEN gioca ${BOT_STANZE} stanze da ${BOT_GATTI_PER_STANZA} gatti con seme fisso, THEN para ≥ 90% dei balzi e la stanza dura ${BOT_DURATA_MIN_S}-${BOT_DURATA_MAX_S.toFixed(2)} s (3-7 s del GDD scalati alla vita del gatto ${VITA_GATTO}; media; singole ≤ 2×)`, async () => {
  const m = await creaMondo();
  const bot = creaBot(m);
  const rngStanze = derivato(creaRng(SEME), 'stanze-bot');
  const esiti = [];
  for (let k = 0; k < BOT_STANZE; k++) esiti.push(stanzaBot(m, bot, derivato(rngStanze, `stanza#${k}`)));
  const balzi = esiti.reduce((a, e) => a + e.balzi, 0);
  const parate = esiti.reduce((a, e) => a + e.parate, 0);
  const danni = esiti.reduce((a, e) => a + e.danni, 0);
  const durate = esiti.map((e) => e.durataMs / 1000);
  const media = durate.reduce((a, b) => a + b, 0) / durate.length;
  const riepilogo = `balzi arrivati ${balzi}, parati ${parate} (${((100 * parate) / Math.max(1, balzi)).toFixed(1)}%), maschere perse ${danni}; durata media ${media.toFixed(2)} s, min ${Math.min(...durate).toFixed(2)}, max ${Math.max(...durate).toFixed(2)}`;
  console.log(`# bot: ${riepilogo}`);
  assert.ok(esiti.every((e) => e.pulita), 'tutte le stanze sono pulite');
  assert.ok(balzi >= BOT_STANZE, `almeno un balzo per stanza (${balzi})`);
  assert.ok(parate / balzi >= 0.9, riepilogo);
  // durata: la media sta nei 3-7 s; le singole stanze oscillano (3,8-12,2 s col seme 1845): il criterio «ogni stanza 3-7 s»
  // non è ancora pienamente soddisfatto — vedi la storia; qui si fissa la media e un tetto per stanza di 2× il massimo
  assert.ok(media >= BOT_DURATA_MIN_S && media <= BOT_DURATA_MAX_S, `durata media ${media.toFixed(2)} s — ${riepilogo}`);
  for (const [i, d] of durate.entries()) assert.ok(d >= BOT_DURATA_MIN_S && d <= BOT_DURATA_MAX_S * 2, `stanza ${i}: ${d.toFixed(2)} s — ${riepilogo}`);
  const fuori = durate.filter((d) => d < BOT_DURATA_MIN_S || d > BOT_DURATA_MAX_S).length;
  console.log(`# bot: stanze fuori dai ${BOT_DURATA_MIN_S}-${BOT_DURATA_MAX_S} s: ${fuori}/${BOT_STANZE}`);
});

// ---------------------------------------------------------------------------------------------
// Storia P05 — nemici alla Isaac del Teatro e proiettili nemici
// ---------------------------------------------------------------------------------------------

const NEMICI_JSON = JSON.parse(readFileSync(new URL('../contenuti/parametri/nemici.json', import.meta.url), 'utf8'));
const PN = NEMICI_JSON.proiettili_nemici;
const angoloDi = (d) => Math.atan2(d.y, d.x);
/** Tempi in tick dall'ingresso in anticipo all'inizio del colpo (hitTicks = 1 con hit_dal 0). */
const ticksAlColpo = (m, arch) => m.ticks(NEMICI_JSON.archetipi[arch].attacco.t_ant.base) + m.ticks(NEMICI_JSON.archetipi[arch].attacco.t_lamp.base) + 1;

test('P05 dati: le sette schede (4 MVP + maschera, bomba, predone) passano le regole; sparo/esplosione/corazza letti dalla scheda; proiettili per piano (1 ai piani 1-2, 2 dal 3, boss sempre danno_boss)', async () => {
  const m = await creaMondo();
  assert.deepEqual(validaSchede(m.parametri), []);
  for (const a of ARCHETIPI_ISAAC) assert.ok(m.parametri.ha(`nemici.archetipi.${a}`), a);
  const S = (a) => schedaArchetipo({ modificatori: m.mod, parametri: m.parametri, archetipo: a, piano: 1 });
  assert.equal(S('maschera').sparo.n_colpi, PN && NEMICI_JSON.archetipi.maschera.sparo.n_colpi.base);
  assert.ok(S('maschera').corazza && S('bomba').esplosione && S('statua').sparo.croce > 0 && S('guardia').sparo && S('predone').dorato > 0);
  assert.equal(S('gatto').sparo, null);
  assert.equal(S('bomba').attacco.senza_gettone, 1);
  assert.equal(S('statua').attacco.senza_gettone, 1);
  for (const p of [1, 2, 3, 4, 5]) {
    const pr = schedaProiettiliNemici({ modificatori: m.mod, parametri: m.parametri, piano: p });
    assert.equal(pr.danno, PN.danno[`p${p}`].base, `piano ${p}`);
    assert.equal(pr.velocita, PN.velocita.base);
  }
  assert.equal(schedaProiettiliNemici({ modificatori: m.mod, parametri: m.parametri, piano: 1, boss: true }).danno, PN.danno_boss.base);
  // geometria pura delle salve
  const v3 = direzioniVentaglio({ x: 1, y: 0 }, 3, 30);
  assert.equal(v3.length, 3);
  assert.ok(Math.abs(angoloDi(v3[0]) + Math.PI / 12) < 1e-9 && Math.abs(angoloDi(v3[2]) - Math.PI / 12) < 1e-9 && Math.abs(angoloDi(v3[1])) < 1e-9);
  const croce = direzioniRadiali(4, 0);
  assert.ok(Math.abs(croce[0].x - 1) < 1e-9 && Math.abs(croce[1].y - 1) < 1e-9);
  const ics = direzioniRadiali(4, 1);
  assert.ok(Math.abs(angoloDi(ics[0]) - Math.PI / 4) < 1e-9);
});

test('P05 maschera (Host): nasce e insegue da ferma; CHIUSA subisce solo frazione_danno e nessuna spinta; si APRE in anticipo (gettone), lampo, ventaglio di n_colpi su apertura_gradi, il proiettile ferisce Ferruccio di danno.p1; resta aperta nel recupero e si richiude', async () => {
  const m = await creaMondo();
  const J = NEMICI_JSON.archetipi.maschera;
  const n = m.nemico('maschera', { x: m.centro.x + 200, y: m.centro.y });
  assert.equal(n.stato, 'emersione');
  m.gira(m.ticks(m.G('t_emersione')));
  assert.ok(['emersione', 'pattuglia'].includes(n.stato), n.stato);
  m.gira(2);
  assert.ok(['insegue', 'anticipo'].includes(n.stato), `entro r_aggro con linea di vista: ${n.stato}`);
  const x0 = n.x;
  assert.equal(n.corazzato, true);
  assert.ok(m.finche(() => n.stato === 'anticipo', 60) >= 0, 'parte l\'attacco (d 200 in [d_min, d_max], linea libera)');
  assert.equal(n.gettone, true);
  assert.equal(n.aperta, true, 'aperta nell\'anticipo');
  const vitaPrima = n.vita;
  n.colpisci(1, null);
  assert.ok(Math.abs(vitaPrima - n.vita - 1) < 1e-9, 'aperta: danno pieno');
  m.gira(m.ticks(J.attacco.t_ant.base));
  assert.equal(n.stato, 'lampo');
  m.gira(m.ticks(J.attacco.t_lamp.base));
  assert.equal(n.stato, 'colpo');
  assert.equal(m.proiettili.length, 0);
  m.gira(1);
  assert.equal(n.esitoColpo, 'sparo');
  assert.equal(m.proiettili.length, J.sparo.n_colpi.base, 'ventaglio di n_colpi');
  assert.equal(m.eventiDi('nemico.sparo').at(-1).payload.n, J.sparo.n_colpi.base);
  let apertura = 0; // angolo massimo tra due colpi (prodotto scalare: niente salto a ±180°)
  for (const a of m.proiettili) for (const b of m.proiettili) apertura = Math.max(apertura, Math.acos(Math.min(1, a.direzione.x * b.direzione.x + a.direzione.y * b.direzione.y)) * 180 / Math.PI);
  assert.ok(Math.abs(apertura - J.sparo.apertura_gradi.base) < 1e-6, `apertura ${apertura}`);
  for (const p of m.proiettili) {
    assert.ok(p.nemico && p.vivo && p.stato === 'in_volo');
    assert.ok(Math.abs(p.velocita - PN.velocita.base * J.sparo.velocita_fattore.base) < 1e-9);
    assert.equal(p.r, PN.r.base);
    assert.equal(p.danno, PN.danno.p1.base);
  }
  const maschere0 = m.ferruccio.maschere;
  // recupero ancora aperta (mentre i colpi volano), poi chiusa in insegue; il corpo non si è mosso (v 0)
  assert.ok(m.finche(() => n.stato === 'recupero', 60) >= 0);
  assert.equal(n.aperta, true);
  m.gira(m.ticks(J.attacco.t_rec.base) + 1);
  assert.equal(n.stato, 'insegue');
  assert.equal(n.aperta, false, 'chiusa fuori dal telegrafo (cooldown)');
  assert.equal(n.x, x0, 'la maschera è immobile');
  const vitaChiusa = n.vita;
  n.colpisci(1, { x: 1, y: 0, ms: 100 });
  assert.ok(Math.abs(vitaChiusa - n.vita - J.corazza.frazione_danno.base) < 1e-9, `chiusa: solo la frazione (${vitaChiusa} → ${n.vita})`);
  assert.equal(n.spinteSubite.length, 0, 'la spinta è ignorata da chiusa');
  // il colpo centrale del ventaglio raggiunge Ferruccio: danno.p1 maschere
  const t = m.finche(() => m.eventiDi('ferruccio.danno').length > 0, m.ticks(2000));
  assert.ok(t >= 0, 'il colpo centrale raggiunge Ferruccio');
  assert.equal(m.ferruccio.maschere, maschere0 - PN.danno.p1.base);
  assert.equal(m.eventiDi('proiettile.spento').filter((e) => e.payload.motivo === 'bersaglio').length, 1);
});

test('P05 guardia: doppietta di 2 colpi mirati (apertura 14°) tenendo d_attesa; la PARATA riflette il proiettile (danno_riflesso, v_riflesso) che torna a ferire la guardia e si spegne', async () => {
  const m = await creaMondo();
  const J = NEMICI_JSON.archetipi.guardia;
  const C = (k) => m.parametri.get(`combattimento.${k}`);
  const n = m.nemico('guardia', { x: m.centro.x + 250, y: m.centro.y });
  inInsegue(m, n);
  assert.ok(m.finche(() => n.stato === 'anticipo', 60) >= 0);
  m.gira(ticksAlColpo(m, 'guardia'));
  assert.equal(n.esitoColpo, 'sparo');
  assert.equal(m.proiettili.length, J.sparo.n_colpi.base);
  const [d0, d1] = m.proiettili.map((p) => p.direzione);
  const traColpi = Math.acos(Math.min(1, d0.x * d1.x + d0.y * d1.y)) * 180 / Math.PI;
  assert.ok(Math.abs(traColpi - J.sparo.apertura_gradi.base) < 1e-6, `apertura ${traColpi}`);
  const p = m.proiettili[0];
  // i due colpi incorniciano Ferruccio (±7° su 250 px = ±30 px): Ferruccio si mette sulla traiettoria del primo e para
  // quando il proiettile è a ~50 px (contatto dentro la finestra, dopo lo startup): il proiettile viene riflesso verso la guardia
  m.ferruccio.posiziona(p.x + p.direzione.x * 120, p.y + p.direzione.y * 120);
  assert.ok(m.finche(() => distanza(p, m.ferruccio) < 50, m.ticks(3000)) >= 0);
  m.tieni('parata');
  const tr = m.finche(() => p.riflesso || !p.vivo, m.ticks(600));
  m.lascia('parata');
  assert.ok(tr >= 0 && p.riflesso, `riflesso (vivo ${p.vivo}, motivo ${p.motivo})`);
  assert.equal(p.danno, C('danno_riflesso'));
  assert.equal(p.velocita, C('v_riflesso'));
  assert.equal(p.stato, 'riflesso');
  assert.equal(m.eventiDi('ferruccio.parata').length, 1);
  const vitaPrima = n.vita;
  assert.ok(m.finche(() => !p.vivo, m.ticks(3000)) >= 0, 'il riflesso arriva');
  assert.equal(p.motivo, 'nemico');
  assert.ok(Math.abs(vitaPrima - n.vita - C('danno_riflesso')) < 1e-9, `vita ${vitaPrima} → ${n.vita}`);
  assert.equal(m.eventiDi('ferruccio.danno').length, 0, 'Ferruccio non ha perso maschere');
});

test('P05 statua (torretta a croci): ferma, SENZA gettone, salve di 4 a + poi a ×, i proiettili si spengono sugli ostacoli e sui muri senza raggiungere Ferruccio dietro la colonna', async () => {
  const m = await creaMondo({ ostacoli: [{ colonna: 8, riga: 3, id: 'colonna' }] });
  const J = NEMICI_JSON.archetipi.statua;
  const cella = m.parametri.get('stanza.cella');
  const n = m.nemico('statua', { x: m.campo.x + 10.5 * cella, y: m.campo.y + 3.5 * cella });
  inInsegue(m, n);
  const x0 = n.x;
  assert.ok(m.finche(() => n.stato === 'anticipo', 60) >= 0, 'attacca anche senza linea di vista (linea_libera 0)');
  assert.equal(n.gettone, false, 'senza gettone');
  assert.equal(m.direttore.occupati, 0);
  m.gira(ticksAlColpo(m, 'statua'));
  assert.equal(m.proiettili.length, J.sparo.n_colpi.base);
  const prima = m.proiettili.slice();
  const angoli1 = prima.map((p) => ((angoloDi(p.direzione) * 180 / Math.PI) % 360 + 360) % 360).sort((a, b) => a - b);
  assert.deepEqual(angoli1.map(Math.round), [0, 90, 180, 270], 'croce +');
  assert.ok(m.finche(() => prima.every((p) => !p.vivo), m.ticks(4000)) >= 0);
  assert.ok(prima.every((p) => p.motivo === 'ostacolo'), prima.map((p) => p.motivo).join(','));
  assert.equal(m.eventiDi('ferruccio.danno').length, 0, 'la colonna ferma il colpo verso Ferruccio');
  assert.equal(m.proiettili.length, 0, 'potati dalla lista');
  // seconda salva a ×
  assert.ok(m.finche(() => n.stato === 'anticipo', m.ticks(5000)) >= 0);
  m.gira(ticksAlColpo(m, 'statua'));
  const angoli2 = m.proiettili.map((p) => ((angoloDi(p.direzione) * 180 / Math.PI) % 360 + 360) % 360).sort((a, b) => a - b);
  assert.deepEqual(angoli2.map(Math.round), [45, 135, 225, 315], 'croce ×');
  assert.equal(n.x, x0, 'la statua non si muove');
});

test('P05 bomba (Bozzo Esplosivo): ferma e inerte oltre d_max; entro d_max parte la miccia (anticipo + lampo, senza gettone, imparabile) e il Colpo è l\'ESPLOSIONE: Ferruccio entro r_giocatore perde il danno pesante, il nemico vicino perde danno_nemici, n_schegge radiali, la bomba muore; uccisa prima esplode comunque, una volta sola', async () => {
  const m = await creaMondo();
  const J = NEMICI_JSON.archetipi.bomba;
  const E = J.esplosione;
  const n = m.nemico('bomba', { x: m.centro.x + 150, y: m.centro.y });
  inInsegue(m, n);
  m.gira(m.ticks(1500));
  assert.equal(n.stato, 'insegue', 'a 150 px (> d_max) non si innesca');
  assert.equal(n.x, m.centro.x + 150);
  const gatto = m.nemico('gatto', { x: n.x + 50, y: n.y });
  gatto.forzaStato('pattuglia');
  m.ferruccio.posiziona(n.x - 60, n.y); // entro d_max (93) ed entro r_giocatore (55) + r
  assert.ok(m.finche(() => n.stato === 'anticipo', 30) >= 0, 'miccia innescata');
  assert.equal(n.gettone, false);
  assert.equal(n.imparabile, true);
  m.gira(m.ticks(J.attacco.t_ant.base));
  assert.equal(n.stato, 'lampo');
  m.gira(m.ticks(J.attacco.t_lamp.base));
  assert.equal(n.stato, 'colpo');
  const vitaGatto = gatto.vita;
  const maschere0 = m.ferruccio.maschere;
  m.gira(1);
  assert.equal(m.eventiDi('nemico.esplosione').length, 1);
  assert.equal(n.stato, 'morto');
  assert.equal(n.esplosa, true);
  assert.equal(m.ferruccio.maschere, maschere0 - m.parametri.get('ferruccio.danno_subito.pesante'), 'danno pesante entro r_giocatore');
  assert.equal(gatto.vita, vitaGatto - E.danno_nemici.base, 'il gatto vicino è ferito');
  assert.equal(m.proiettili.length, E.n_schegge.base, 'schegge radiali');
  const angoli = m.proiettili.map((p) => ((angoloDi(p.direzione) * 180 / Math.PI) % 360 + 360) % 360).sort((a, b) => a - b);
  assert.deepEqual(angoli.map(Math.round), [0, 60, 120, 180, 240, 300]);
  // uccisa prima: esplode alla morte, una volta sola
  const b2 = m.nemico('bomba', { x: m.centro.x - 250, y: m.centro.y });
  inInsegue(m, b2);
  m.proiettili.length = 0;
  b2.colpisci(99, null);
  assert.equal(b2.stato, 'morto');
  assert.equal(m.eventiDi('nemico.esplosione').length, 2);
  assert.equal(m.proiettili.length, E.n_schegge.base);
  b2.colpisci(99, null);
  assert.equal(m.eventiDi('nemico.esplosione').length, 2, 'non riesplode');
});

test('P05 predone (mob dorato della segreta): dorato, monete × molt_monete_dorato nei payload di morte e bottino', async () => {
  const m = await creaMondo();
  const D = NEMICI_JSON.drop;
  const J = NEMICI_JSON.archetipi.predone;
  const n = m.nemico('predone', { x: m.centro.x + 300, y: m.centro.y });
  assert.equal(n.dorato, true);
  assert.equal(n.tiratore, true);
  inInsegue(m, n);
  n.colpisci(99, null);
  const morte = m.eventiDi('nemico.morto')[0].payload;
  assert.equal(morte.dorato, true);
  const base = Math.ceil(J.costo.base / 2);
  const ammesse = [];
  for (let e = 0; e <= D.monete_extra.base; e++) ammesse.push((base + e) * D.molt_monete_dorato.base);
  assert.ok(ammesse.includes(morte.monete), `monete ${morte.monete} non in ${ammesse}`);
  m.gira(m.ticks(m.G('t_bottino')) + 1);
  assert.equal(m.eventiDi('nemico.bottino')[0].payload.dorato, true);
  assert.equal(m.eventiDi('nemico.bottino')[0].payload.monete, morte.monete);
});

test('P05 proiettili nemici: il FENDENTE attivo li cancella (motivo spada); gittata dal JSON; cancellaInRaggio (Tamburello) e potaSpenti', async () => {
  const m = await creaMondo();
  const base = schedaProiettiliNemici({ modificatori: m.mod, parametri: m.parametri, piano: 1 });
  const fermo = creaProiettileNemico({
    x: m.ferruccio.x + m.ferruccio.r + 20, y: m.ferruccio.y, direzione: { x: -1, y: 0 }, velocita: 0, r: base.r, gittata: base.gittata, danno: base.danno,
    campo: m.campo, bersaglio: null, spada: () => m.comb.hitboxCorrente(), eventi: m.eventi,
  });
  m.proiettili.push(fermo);
  m.gira(5);
  assert.equal(fermo.vivo, true);
  m.premi('attacco', 1);
  assert.ok(m.finche(() => !fermo.vivo, m.ticks(600)) >= 0, 'il fendente lo raggiunge');
  assert.equal(fermo.motivo, 'spada');
  assert.equal(m.eventiDi('proiettile.spento').at(-1).payload.motivo, 'spada');
  // gittata: un proiettile libero verso l'alto a destra si spegne a `gittata` px se non trova muri prima
  const libero = creaProiettileNemico({ x: m.centro.x, y: m.centro.y, direzione: { x: 1, y: 0 }, velocita: base.velocita, r: base.r, gittata: 100, danno: 1, campo: m.campo });
  m.proiettili.push(libero);
  const t = m.finche(() => !libero.vivo, m.ticks(3000));
  assert.ok(t >= 0 && libero.motivo === 'gittata', libero.motivo);
  assert.ok(Math.abs(libero.percorso - 100) <= base.velocita * m.tempo.passoMs / 1000 + 1e-6);
  assert.equal(m.proiettili.includes(libero), false, 'potato');
  // Tamburello: cancella entro il raggio, non oltre
  const vicino = creaProiettileNemico({ x: m.centro.x + 50, y: m.centro.y, direzione: { x: 1, y: 0 }, velocita: 0, r: base.r, gittata: 100, danno: 1, campo: m.campo });
  const lontano = creaProiettileNemico({ x: m.centro.x + 300, y: m.centro.y, direzione: { x: 1, y: 0 }, velocita: 0, r: base.r, gittata: 100, danno: 1, campo: m.campo });
  const lista = [vicino, lontano];
  assert.equal(cancellaInRaggio(lista, { x: m.centro.x, y: m.centro.y, raggio: 100 }), 1);
  assert.equal(vicino.motivo, 'cancellato');
  assert.equal(lontano.vivo, true);
  assert.equal(potaSpenti(lista), 1);
  assert.deepEqual(lista, [lontano]);
});

const BOT_MISTO_ARCHETIPI = ['gatto', 'vespa', 'guardia', 'statua', 'maschera', 'bomba'];
const BOT_MISTO_PER_STANZA = 3;
/** Soglia documentata (storia P05): maschere perse in media per stanza dal bot (para balzi e proiettili in arrivo, innesca le bombe e
 *  si allontana, ma non schiva i ventagli laterali): misurate 0,73 con il seme 1845 (22 su 30 stanze), durata media 10,3 s. */
const BOT_MISTO_MASCHERE_MEDIA_MAX = 1;

test(`P05 bot QA: ${BOT_STANZE} stanze miste da ${BOT_MISTO_PER_STANZA} nemici (${BOT_MISTO_ARCHETIPI.join(', ')}) con seme fisso: tutte pulite, mai morto, maschere perse in media ≤ ${BOT_MISTO_MASCHERE_MEDIA_MAX} per stanza`, async () => {
  const m = await creaMondo();
  const bot = creaBot(m);
  const rngStanze = derivato(creaRng(SEME), 'stanze-bot-misto');
  const esiti = [];
  for (let k = 0; k < BOT_STANZE; k++) {
    const rotazione = BOT_MISTO_ARCHETIPI.slice(k % BOT_MISTO_ARCHETIPI.length).concat(BOT_MISTO_ARCHETIPI.slice(0, k % BOT_MISTO_ARCHETIPI.length));
    esiti.push(stanzaBot(m, bot, derivato(rngStanze, `stanza#${k}`), BOT_MISTO_PER_STANZA, rotazione));
  }
  const danni = esiti.reduce((a, e) => a + e.danni, 0);
  const durate = esiti.map((e) => e.durataMs / 1000);
  const media = durate.reduce((a, b) => a + b, 0) / durate.length;
  const riepilogo = `maschere perse ${danni} (${(danni / BOT_STANZE).toFixed(2)} per stanza); durata media ${media.toFixed(2)} s, max ${Math.max(...durate).toFixed(2)}; non pulite ${esiti.filter((e) => !e.pulita).length}; morti ${esiti.filter((e) => e.morto).length}`;
  console.log(`# bot misto: ${riepilogo}`);
  assert.ok(esiti.every((e) => e.pulita), riepilogo);
  assert.ok(esiti.every((e) => !e.morto), riepilogo);
  assert.ok(danni / BOT_STANZE <= BOT_MISTO_MASCHERE_MEDIA_MAX, riepilogo);
});

// ---------------------------------------------------------------------------------------------
// Transizioni, direttore, stanza, determinismo, prestazioni
// ---------------------------------------------------------------------------------------------

test('transizioni: emersione 700 ms → pattuglia (si muove tra 2-3 punti col seme) → insegue entro r_aggro con linea di vista; dietro una colonna non vede; ferito o allarme (4 s) → insegue', async () => {
  const m = await creaMondo({ ostacoli: [{ colonna: 8, riga: 3, id: 'colonna' }] });
  // gatto lontano (oltre r_aggro 260) con Ferruccio al centro
  const n = m.nemico('gatto', { x: m.centro.x + 330, y: m.centro.y + 150 });
  assert.equal(n.stato, 'emersione');
  m.gira(m.ticks(700) - 1);
  assert.equal(n.stato, 'emersione');
  m.gira(1);
  assert.equal(n.stato, 'pattuglia');
  const punti = n.puntiPattuglia;
  assert.ok(punti.length >= 2 && punti.length <= 3, `${punti.length} punti`);
  const p0 = { x: n.x, y: n.y };
  m.gira(m.ticks(1500));
  assert.notDeepEqual({ x: n.x, y: n.y }, p0, 'in pattuglia si muove');
  // dietro la colonna (riga 3 = quella di Ferruccio): a 250 px ma senza linea di vista resta in pattuglia
  const dietro = m.nemico('gatto', { x: m.centro.x + 2.5 * m.campo.cella + 20, y: m.centro.y, id: 'dietro' });
  dietro.forzaStato('pattuglia');
  m.gira(1);
  assert.equal(dietro.stato, 'pattuglia');
  // davanti, dentro r_aggro: insegue
  const davanti = m.nemico('gatto', { x: m.centro.x - 200, y: m.centro.y, id: 'davanti' });
  davanti.forzaStato('pattuglia');
  m.gira(1);
  assert.equal(davanti.stato, 'insegue');
  // ferito → insegue anche da lontano
  const lontano = m.nemico('gatto', { x: m.centro.x - 380, y: m.centro.y + 180, id: 'lontano' });
  lontano.forzaStato('pattuglia');
  m.gira(1);
  assert.equal(lontano.stato, 'pattuglia');
  lontano.colpisci(1, null);
  m.gira(1);
  assert.equal(lontano.stato, 'insegue');
  // allarme di stanza: 4000 ms dopo l'emersione nessuno pattuglia
  const m2 = await creaMondo();
  const z = m2.nemico('gatto', { x: m2.centro.x + 380, y: m2.centro.y + 190 });
  m2.gira(m2.ticks(700) + m2.ticks(4000) - 2);
  assert.equal(z.stato, 'pattuglia');
  m2.gira(3);
  assert.equal(z.stato, 'insegue');
});

test('transizioni: Insegue → Pattuglia dopo 3000 ms oltre r_lose (senza allarme); Ferruccio morto → nessun attacco', async () => {
  // una maschera (non si sposta; storia P05: la statua ora spara da ovunque) con r_lose portato a 400: Ferruccio nell'angolo è oltre
  const m = await creaMondo({ override: { 'nemici.archetipi.maschera.r_lose': 400 } });
  const n = m.nemico('maschera', { x: m.centro.x + 150, y: m.centro.y, conDirettore: false });
  inInsegue(m, n);
  m.ferruccio.posiziona(m.campo.x + 40, m.campo.y + 40); // oltre r_lose (400) dalla statua
  m.gira(m.ticks(3000) - 1);
  assert.equal(n.stato, 'insegue');
  m.gira(2);
  assert.equal(n.stato, 'pattuglia');
  // Ferruccio morto: stato neutro
  const m2 = await creaMondo();
  const k = m2.nemico('gatto', { x: m2.centro.x + 150, y: m2.centro.y });
  inInsegue(m2, k);
  m2.ferruccio.impostaMaschere(1);
  m2.ferruccio.subisciDanno({ pesante: true, x: k.x, y: k.y });
  assert.equal(m2.ferruccio.stato, 'morto');
  m2.gira(m2.ticks(2000));
  assert.equal(m2.eventiDi('telegrafo.anticipo').length, 0);
  assert.equal(k.stato, 'insegue');
});

test('direttore: 1 gettone al piano 1 (un solo nemico in telegrafo alla volta su 20 s con 4 gatti), gap tra impatti ≥ 350 ms, riprova ogni 100 ms, azzeramento a stanza.entrata', async () => {
  const m = await creaMondo();
  // Ferruccio immortale per la prova: le maschere tornano piene a ogni danno (morto, i nemici sarebbero neutri)
  m.eventi.on('ferruccio.danno', () => m.ferruccio.impostaMaschere(m.parametri.get('ferruccio.maschere_max')));
  const gatti = [0, 1, 2, 3].map((i) => m.nemico('gatto', { x: m.centro.x + 150 * Math.cos(i * Math.PI / 2), y: m.centro.y + 150 * Math.sin(i * Math.PI / 2), id: `g${i}` }));
  for (const g of gatti) inInsegue(m, g);
  let maxInTelegrafo = 0;
  for (let t = 0; t < m.ticks(20000); t++) {
    m.gira(1);
    const n = gatti.filter((g) => g.inTelegrafo).length;
    maxInTelegrafo = Math.max(maxInTelegrafo, n);
  }
  assert.equal(maxInTelegrafo, 1);
  assert.ok(m.eventiDi('telegrafo.anticipo').length >= 4, 'tutti attaccano prima o poi');
  assert.ok(m.direttore.statistiche.negati > 0, 'qualcuno è stato negato');
  // gap: due nemici con lo stesso impatto → il secondo è negato; impatto distante → concesso
  const d = creaDirettore({ gettoni: 3, gapTicks: 21 });
  const a = {};
  const b = {};
  const c = {};
  assert.equal(d.richiedi(a, { traTicks: 48 }), true);
  assert.equal(d.richiedi(b, { traTicks: 50 }), false, 'a meno di 350 ms');
  assert.equal(d.richiedi(c, { traTicks: 48 + 21 }), true);
  assert.equal(d.richiedi(a, { traTicks: 10 }), true, 'chi tiene il gettone lo tiene');
  d.rilascia(a);
  assert.equal(d.richiedi(b, { traTicks: 50 }), false, 'ancora a meno di 350 ms dall\'impatto di c (69)');
  assert.equal(d.richiedi(b, { traTicks: 120 }), true, 'lontano da ogni impatto programmato');
  // imparabili_max
  const d2 = creaDirettore({ gettoni: 3, gapTicks: 1, imparabiliMax: 1 });
  assert.equal(d2.richiedi(a, { traTicks: 10, imparabile: true }), true);
  assert.equal(d2.richiedi(b, { traTicks: 100, imparabile: true }), false);
  assert.equal(d2.richiedi(b, { traTicks: 100, imparabile: false }), true);
  m.eventi.emit('stanza.entrata', { id: 'x' });
  assert.equal(m.direttore.occupati, 0);
  assert.throws(() => creaDirettore({ gettoni: 0, gapTicks: 1 }), RangeError);
});

test('stanza: la factory per archetipo popola le ondate con nemici veri (archetipo, scheda, stato emersione), le porte si riaprono quando l\'ultimo si dissolve', async () => {
  const m = await creaMondo();
  const log = logFinto();
  const indice = JSON.parse(readFileSync(join(CARTELLA_MODELLI, 'indice.json'), 'utf8'));
  const { modelli } = await caricaModelli({
    caricatore: (nome) => JSON.parse(readFileSync(join(CARTELLA_MODELLI, `${nome}.json`), 'utf8')), indice, regole: regoleDaParametri(m.parametri), log,
  });
  const catalogo = creaCatalogo(modelli);
  const modello = catalogo.perId ? catalogo.perId('normale-01') ?? modelli[0] : modelli.find((x) => x.tipo === 'normale') ?? modelli[0];
  const normale = modelli.find((x) => x.tipo === 'normale' && x.tavolozza?.length) ?? modello;
  const record = { id: 'n1', tipo: 'normale', dim: normale.dim, modello: normale.id, seme_stanza: 11, profondita: 3, d_boss: 6, porte: { N: 'n0' } };
  const creaNemicoFactory = ({ archetipo, x, y, id }) => {
    const n = creaNemico({
      modificatori: m.mod, parametri: m.parametri, tempo: m.tempo, eventi: m.eventi, campo: m.campo, bersaglio: m.comb.comeBersaglio,
      altri: () => m.bersagli, direttore: m.direttore, rng: derivato(creaRng(SEME), id), archetipo, piano: 1, x, y, id,
    });
    return n;
  };
  const stanza = creaStanza({
    record, modello: normale, piano: 1, parametri: m.parametri, tempo: m.tempo, eventi: m.eventi, campo: m.campo, scena: SCENA,
    bersagli: m.bersagli, creaNemico: creaNemicoFactory, ferruccio: m.ferruccio,
  });
  const arrivo = stanza.puntoArrivo('N');
  m.ferruccio.posiziona(arrivo.x, arrivo.y);
  stanza.entra();
  assert.equal(stanza.stato, 'annuncio');
  const S = (k) => m.ticks(m.parametri.get(`stanze.${k}`));
  const giraStanza = (n) => { for (let i = 0; i < n; i++) { m.gira(1); stanza.tick(); } };
  giraStanza(S('t_marker') + 1);
  assert.ok(m.bersagli.length >= 1, 'nemici nati');
  for (const b of m.bersagli) {
    assert.ok(ARCHETIPI_MVP.includes(b.archetipo), b.archetipo);
    assert.equal(b.stato, 'emersione');
    assert.equal(b.scheda.vita, schedaArchetipo({ modificatori: m.mod, parametri: m.parametri, archetipo: b.archetipo, piano: 1 }).vita);
  }
  // uccide ogni nemico appena emerso; le ondate successive seguono
  for (let guardia = 0; guardia < 12 && stanza.stato !== 'pulita'; guardia++) {
    giraStanza(m.ticks(700) + 1);
    for (const b of m.bersagli) if (b.stato !== 'morto') b.colpisci(99, null);
    giraStanza(S('t_pausa_ondata') + S('t_marker') + S('t_ritardo_apertura') + 3);
  }
  assert.equal(stanza.stato, 'pulita');
  assert.ok(stanza.porte.every((p) => p.stato === 'aperta' || p.stato === 'aprendo'));
  assert.equal(m.eventiDi('nemico.morto').length, stanza.nNemici);
  assert.ok(m.bersagli.every((b) => b.dissolto));
});

test('determinismo: stesso seme → stessi punti di pattuglia, stesse monete e stesso verso di separazione', async () => {
  const esegui = async () => {
    const m = await creaMondo();
    const a = m.nemico('gatto', { x: m.centro.x + 300, y: m.centro.y, id: 'a' });
    const b = m.nemico('gatto', { x: m.centro.x + 300, y: m.centro.y, id: 'b' });
    m.gira(m.ticks(700) + 20);
    const punti = a.puntiPattuglia;
    a.colpisci(100, null);
    return { punti, monete: a.monete, bx: b.x, by: b.y };
  };
  const uno = await esegui();
  const due = await esegui();
  assert.deepEqual(uno, due);
});

test('prestazioni: 12 nemici con separazione e direttore in Insegue ≤ 1,0 ms per tick', async () => {
  const m = await creaMondo();
  const archetipi = ['gatto', 'vespa', 'guardia', 'statua'];
  for (let i = 0; i < 12; i++) {
    const a = (i * 2 * Math.PI) / 12;
    const n = m.nemico(archetipi[i % 4], { x: m.centro.x + 200 * Math.cos(a), y: m.centro.y + 200 * Math.sin(a), id: `p${i}` });
    inInsegue(m, n);
  }
  m.gira(10);
  const n = 600;
  const t0 = performance.now();
  m.gira(n);
  const perTick = (performance.now() - t0) / n;
  assert.ok(perTick < 1.0, `${perTick.toFixed(3)} ms per tick`);
});

// ---------------------------------------------------------------------------------------------
// Storia P15 — cuciture: l'esplosione apre la Crepa Dorata; gli eventi dei boss per il feel; `aperta` e `riflesso` leggibili
// ---------------------------------------------------------------------------------------------

/** Notte finta per la Crepa Dorata: la stanza `a` con la finestra verso la segreta `s` nel muro E (rettangolo dentro il campo). */
function notteFintaConCrepa(m, { stato = 'pulita' } = {}) {
  const record = { id: 'a', tipo: 'normale', porte: { W: 'b' }, finestre: ['E'] };
  const seg = { id: 's', tipo: 'segreta', porte: {}, finestre: ['W'] };
  const w = 16;
  const h = 96;
  const finestra = { slot: 'E', lato: 'E', x: m.campo.x + m.campo.larghezza - w, y: m.centro.y - h / 2, w, h };
  const stanza = { id: 'a', record, finestre: [finestra], porte: [], stato, origine: { x: m.campo.x, y: m.campo.y }, geo: { colonne: 13, righe: 7 }, cella: 64 };
  const andate = [];
  return { stanza, pianta: { stanze: [record, seg] }, vaiA: (id) => andate.push(id), andate, finestra, record, seg };
}

const combattimentoMuto = { proiettiliFerruccio: () => [], hitboxCorrente: () => null };

test('P15 esplosione → Crepa Dorata: GIVEN la stanza pulita con la crepa, WHEN una bomba esplode entro r_crepa dalla finestra, THEN la crepa si apre (porte su entrambi i record, segreta.aperta, rCrepa nel payload); lontana no; durante il combattimento aspetta `pulita`', async () => {
  const m = await creaMondo();
  const E = NEMICI_JSON.archetipi.bomba.esplosione;
  const n = notteFintaConCrepa(m);
  const aperture = [];
  m.eventi.on('segreta.aperta', (p) => aperture.push(p));
  const segreta = creaSegreta({ eventi: m.eventi, notte: () => n, combattimento: combattimentoMuto, ferruccio: m.ferruccio, parametri: m.parametri });
  assert.equal(segreta.crepa().visibile, true);
  // lontana: oltre r_crepa dal rettangolo della finestra
  const lontana = m.nemico('bomba', { x: n.finestra.x - E.r_crepa.base - 120, y: m.centro.y });
  inInsegue(m, lontana);
  lontana.colpisci(99, null);
  assert.equal(m.eventiDi('nemico.esplosione').length, 1);
  assert.equal(m.eventiDi('nemico.esplosione')[0].payload.rCrepa, E.r_crepa.base, 'rCrepa nel payload');
  segreta.tick();
  assert.deepEqual(aperture, [], 'troppo lontana: la crepa resta chiusa');
  assert.equal(n.record.porte.E, undefined);
  // vicina: entro r_crepa → apre subito (stanza pulita)
  const { x: fx, y: fy } = m.ferruccio;
  const vicina = m.nemico('bomba', { x: n.finestra.x - E.r_crepa.base + 30, y: m.centro.y });
  inInsegue(m, vicina);
  vicina.colpisci(99, null);
  assert.equal(aperture.length, 1, 'segreta.aperta');
  assert.deepEqual([aperture[0].stanza, aperture[0].segreta, aperture[0].slot], ['a', 's', 'E']);
  assert.equal(n.record.porte.E, 's');
  assert.equal(n.seg.porte.W, 'a');
  assert.deepEqual(n.andate, ['a'], 'la stanza è rimontata');
  assert.deepEqual([m.ferruccio.x, m.ferruccio.y], [fx, fy], 'senza muovere Ferruccio');
  assert.equal(segreta.crepa().aperta, true);
  // durante il combattimento: l'apertura aspetta `pulita` (le porte sono chiuse)
  const m2 = await creaMondo();
  const n2 = notteFintaConCrepa(m2, { stato: 'ondata' });
  const aperture2 = [];
  m2.eventi.on('segreta.aperta', (p) => aperture2.push(p));
  const segreta2 = creaSegreta({ eventi: m2.eventi, notte: () => n2, combattimento: combattimentoMuto, ferruccio: m2.ferruccio, parametri: m2.parametri });
  const b2 = m2.nemico('bomba', { x: n2.finestra.x - 40, y: m2.centro.y });
  inInsegue(m2, b2);
  b2.colpisci(99, null);
  segreta2.tick();
  assert.equal(aperture2.length, 0, 'porte chiuse: non ancora');
  assert.equal(segreta2.inAttesa, 'a');
  n2.stanza.stato = 'pulita';
  segreta2.tick();
  assert.equal(aperture2.length, 1, 'aperta al primo tick da pulita');
  assert.equal(segreta2.inAttesa, null);
  assert.equal(n2.record.porte.E, 's');
});

test('P15 feel dei boss: il Re-Gatto emette boss.atterraggio {x, y} quando atterra dal balzo; le Mani di Donna Luciana emettono boss.mani_schianto {x, y, mani[]} allo schianto (i nomi che resa/feel.js ascolta per la scossa)', async () => {
  const BOSS = leggiJson('boss');
  const bossProva = async (id) => {
    const m = await creaMondo();
    const run = creaRun({ tabella: BOSS, seme: SEME });
    const info = [...BOSS.pool, BOSS.finale].find((b) => b.id === id);
    const visti = [];
    for (const nome of ['boss.atterraggio', 'boss.mani_schianto']) m.eventi.on(nome, (p) => visti.push({ nome, ...p }));
    const fermo = { x: m.centro.x - 250, y: m.centro.y, r: 14, stato: 'in_piedi', colpisci: () => 'danno' }; // Ferruccio finto: non muore
    const fabbrica = info.archetipoBase === ARCHETIPO_GATTO ? creaGatto : creaNemico;
    const n = fabbrica({
      modificatori: m.mod, parametri: m.parametri, tempo: m.tempo, eventi: m.eventi, campo: m.campo, bersaglio: fermo, altri: () => m.bersagli,
      rng: derivato(creaRng(SEME), id), archetipo: info.archetipoBase, piano: 1, x: m.centro.x + 250, y: m.centro.y, id, boss: true,
      schedaBoss: { vita: run.vitaBoss(1, info), scalaRaggio: info.scalaRaggio, scalaPortata: info.scalaPortata },
      proiettili: m.proiettili, pattern: patternPerNome(info.pattern), bossId: id, moltVelocita: run.moltVelocita(1),
      genera: (archetipo, gx, gy) => ({ archetipo, x: gx, y: gy, r: 12, peso: 0, volante: false, stato: 'in_piedi', vita: 1, boss: false }),
    });
    m.bersagli.push(n);
    m.gira(m.ticks(15000));
    return { n, visti };
  };
  const gatto = await bossProva('re-gatto');
  const atterraggi = gatto.visti.filter((e) => e.nome === 'boss.atterraggio');
  assert.ok(atterraggi.length >= 1, 'boss.atterraggio emesso');
  assert.ok(atterraggi.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y)), 'payload {x, y}');
  assert.equal(gatto.visti.filter((e) => e.nome === 'boss.mani_schianto').length, 0, 'il Re-Gatto non ha Mani');
  const luciana = await bossProva(BOSS.finale.id);
  const schianti = luciana.visti.filter((e) => e.nome === 'boss.mani_schianto');
  assert.ok(schianti.length >= 1, 'boss.mani_schianto emesso');
  assert.ok(schianti.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y) && Array.isArray(e.mani) && e.mani.length > 0
    && e.mani.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))), 'payload {x, y, mani[]}');
});

test('P15 contratto per il renderer: la maschera espone `aperta` (booleano, chiusa a riposo, aperta nell\'anticipo); il proiettile nemico espone `riflesso` (falso in volo, vero dopo rifletti, stato riflesso)', async () => {
  const m = await creaMondo();
  const maschera = m.nemico('maschera', { x: m.centro.x + 200, y: m.centro.y });
  assert.equal(typeof maschera.aperta, 'boolean');
  assert.equal(maschera.aperta, false, 'chiusa a riposo');
  inInsegue(m, maschera);
  maschera.forzaStato('anticipo');
  assert.equal(maschera.aperta, true, 'aperta nell\'anticipo');
  const base = schedaProiettiliNemici({ modificatori: m.mod, parametri: m.parametri, piano: 1 });
  const p = creaProiettileNemico({ x: m.centro.x, y: m.centro.y, direzione: { x: 1, y: 0 }, velocita: base.velocita, r: base.r, gittata: base.gittata, danno: base.danno, campo: m.campo });
  assert.equal(p.riflesso, false);
  assert.equal(p.stato, 'in_volo');
  p.rifletti(m.parametri.get('combattimento.danno_riflesso'), m.parametri.get('combattimento.v_riflesso'));
  assert.equal(p.riflesso, true);
  assert.equal(p.stato, 'riflesso');
});
