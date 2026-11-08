/**
 * gioco/qa/mondo.test.mjs — Test unitari delle storie 014-017 (stanze, porte, transizioni, generazione, modelli), senza DOM.
 *
 * Esecuzione: `node gioco/qa/mondo.test.mjs` dalla radice del repository (node:test, Node ≥ 20).
 * Usa i JSON reali di `contenuti/` (parametri, 14 modelli di Piazza Dante, piano di riserva). Ciclo
 * simulato a tick fissi nell'ordine della notte (input → Ferruccio → combattimento → bersagli →
 * stanza), un caso per ogni criterio Given-When-Then delle quattro storie più le formule dei GDD e
 * le prestazioni. Stampa il conteggio dei 200 semi senza violatori.
 * Storia 018 (pericoli e ricompense): bracieri (ciclo, danno solo in attivo, spinta, scatto, morte,
 * determinismo) e ricompensa pre-estratta a stanza pulita con l'economia reale (generatore `drop`),
 * nessuna ricompensa al rientro.
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
import { creaRng } from '../motore/fondazione/rng.js';
import { creaModificatori } from '../motore/oggetti/modificatori.js';
import { creaCampo } from '../motore/mondo/fisica.js';
import { creaFerruccio } from '../motore/attori/ferruccio.js';
import { creaCombattimento } from '../motore/attori/combattimento.js';
import { creaFantoccio } from '../motore/attori/bersaglio.js';
import {
  caricaModelli, creaCatalogo, regoleDaParametri, validaModello, validaParametriGenerazione, TAG_DIFFICOLTA,
} from '../motore/mondo/modelli.js';
import { creaPorta, STATI_PORTA } from '../motore/mondo/porte.js';
import { creaCamera } from '../motore/mondo/camera.js';
import {
  creaStanza, nNemici, quoteOndate, valoreRicompensa, composizione, puntoValido, STATI_STANZA,
} from '../motore/mondo/stanza.js';
import {
  generaPiano, validaPianta, punteggioQ, pesoModello, diffTarget, dimensioniPiano, piantaDaRiserva, esplora,
} from '../motore/mondo/generazione.js';
import { creaNotte } from '../motore/mondo/notte.js';
import { creaEconomia } from '../motore/oggetti/economia.js';
import { derivato } from '../motore/fondazione/rng.js';
import { fasePericolo, puntoSicuro, FASI_PERICOLO, ID_BRACIERE } from '../motore/mondo/stanza.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const SCENA = Object.freeze({ larghezza: 1280, altezza: 720 });
const SEME = 1845;
const leggi = (percorso) => JSON.parse(readFileSync(join(RADICE, percorso), 'utf8'));
const CARTELLA_MODELLI = 'contenuti/modelli-stanza/piazza-dante';

function logFinto() {
  const voci = [];
  return { voci, error: (...a) => voci.push(a) };
}

/** Modello di prova per il criterio «colonna/panca» (fixture, non contenuto di gioco). */
function modelloColonnaPanca() {
  return {
    id: 'test-colonna-panca', tipo: 'normale', dim: '1x1', piani: [1], difficolta: 1, tag: ['facile'], peso_base: 1,
    griglia: ['.............', '.............', '.............', '.....C.P.....', '.............', '.............', '.............'],
    spawn: [{ c: 2, r: 1, tipo: 'T' }, { c: 10, r: 1, tipo: 'T' }, { c: 2, r: 5, tipo: 'T' }, { c: 10, r: 5, tipo: 'T' },
      { c: 4, r: 1, tipo: 'T' }, { c: 8, r: 1, tipo: 'T' }, { c: 4, r: 5, tipo: 'T' }, { c: 8, r: 5, tipo: 'T' }],
    tavolozza: [{ tipo: 'gatto', peso: 1, min: 1, max: 6 }],
  };
}

/**
 * Parametri reali (con eventuale ritocco del JSON prima della validazione e override di statistica),
 * catalogo dei 14 modelli, piano di riserva.
 */
async function caricaContenuti({ override = {}, ritocca = null, conEconomia = false } = {}) {
  const log = logFinto();
  const parametri = creaParametri({ log });
  await parametri.carica({
    caricatore: (nome) => {
      const j = leggi(`contenuti/parametri/${nome}.json`);
      if (ritocca) ritocca(nome, j);
      return j;
    },
    statistiche: ['ferruccio', 'combattimento', 'stanza', 'stanze', 'generazione', ...(conEconomia ? ['economia'] : [])],
    tabelle: ['input'],
    override,
  });
  assert.deepEqual(parametri.errori(), [], 'i JSON reali devono essere validi');
  const indice = leggi(`${CARTELLA_MODELLI}/indice.json`);
  const { modelli, errori } = await caricaModelli({
    caricatore: (nome) => leggi(`${CARTELLA_MODELLI}/${nome}.json`), indice, regole: regoleDaParametri(parametri), log,
  });
  const riserva = leggi('contenuti/piani/piazza-dante-riserva.json');
  return { parametri, catalogo: creaCatalogo(modelli), modelli, erroriModelli: errori, riserva, indice, log };
}

/** Mondo di prova: fondazione + campo condiviso + Ferruccio + combattimento + factory dei fantocci. */
async function creaMondo(opzioni = {}) {
  const c = await caricaContenuti(opzioni);
  const { parametri } = c;
  const tempo = creaTempo();
  const eventi = creaBus({ log: c.log });
  const input = creaInput(parametri.get('input'));
  const mod = creaModificatori(parametri);
  const campo = creaCampo({
    colonne: parametri.get('stanza.colonne'), righe: parametri.get('stanza.righe'), cella: parametri.get('stanza.cella'),
    scenaLarghezza: SCENA.larghezza, scenaAltezza: SCENA.altezza,
  });
  const ferruccio = creaFerruccio({ modificatori: mod, tempo, eventi, input, campo, x: 640, y: 360 });
  const bersagli = [];
  const proiettili = [];
  const comb = creaCombattimento({ modificatori: mod, tempo, eventi, input, campo, ferruccio, bersagli: () => bersagli });
  const creaNemico = ({ archetipo, x, y, id }) => {
    const f = creaFantoccio({ modificatori: mod, tempo, eventi, campo, bersaglio: comb.comeBersaglio, id, x, y });
    f.archetipo = archetipo;
    return f;
  };
  // storia 018: economia reale opzionale (profilo in RAM, generatore derivato 'drop' dal seme)
  const profilo = { scintille: 0, aggiungiScintille(n, tetto) { const prima = this.scintille; this.scintille = Math.min(tetto, prima + n); return this.scintille - prima; } };
  const economia = opzioni.conEconomia
    ? creaEconomia({ parametri, eventi, rng: derivato(creaRng(opzioni.seme ?? SEME), 'drop'), profilo, ferruccio, modificatori: mod, piano: 1, log: c.log })
    : null;
  const ricevuti = [];
  for (const nome of ['stanza.entrata', 'stanza.chiusa', 'ondata.inizio', 'nemico.nato', 'stanza.svuotata', 'stanza.ricompensa',
    'stanza.pulita', 'stanza.abbandonata', 'porta.stato', 'notte.stanza', 'camera.transizione', 'ferruccio.colpo',
    'stanza.pericolo', 'ferruccio.danno', 'ferruccio.morto', 'economia.oggetto', 'economia.scintille']) {
    eventi.on(nome, (p) => ricevuti.push({ nome, payload: p }));
  }
  const tasto = (azione) => `t:${parametri.get(`input.tastiera.${azione}`)[0]}`;
  const m = {
    ...c, tempo, eventi, input, mod, campo, ferruccio, comb, bersagli, proiettili, creaNemico, ricevuti, economia, profilo,
    stanza: null,
    notte: null,
    ticks: (chiave) => tempo.ticksDaMs(parametri.get(chiave)),
    /** n tick nell'ordine della notte (se c'è una notte la guida lei). */
    tick(n = 1) {
      for (let i = 0; i < n; i++) {
        input.inizioTick();
        if (m.notte) {
          m.notte.tick(tempo.passoS);
          economia?.tick();
          continue;
        }
        ferruccio.tick(tempo.passoS);
        comb.tick(tempo.passoS);
        for (const b of bersagli.slice()) b.tick(tempo.passoS);
        m.stanza?.tick(tempo.passoS);
      }
    },
    tieni: (azione) => input.sorgenteGiu(tasto(azione)),
    lascia: (azione) => input.sorgenteSu(tasto(azione)),
    premi(azione) {
      input.sorgenteGiu(tasto(azione));
      m.tick(1);
      input.sorgenteSu(tasto(azione));
    },
    /** Monta una stanza da record e modello nel campo condiviso. */
    monta(record, modello, statoSalvato = null) {
      m.stanza = creaStanza({
        record, modello, piano: 1, parametri, tempo, eventi, campo, scena: SCENA, bersagli, creaNemico, ferruccio, statoSalvato,
      });
      return m.stanza;
    },
    /** Notte completa sul piano generato dal seme (o su una pianta data). */
    avviaNotte({ seme = SEME, pianta = null, catalogo = c.catalogo } = {}) {
      const esito = pianta ? { pianta } : generaPiano({ seme, piano: 1, parametri, catalogo, riserva: c.riserva, log: c.log });
      const camera = creaCamera({ parametri, tempo, scena: SCENA, eventi });
      m.notte = creaNotte({
        seme, numeroPiano: 1, pianta: esito.pianta, catalogo, parametri, tempo, eventi, campo, scena: SCENA,
        ferruccio, combattimento: comb, bersagli, proiettili, camera, creaNemico,
      });
      m.notte.entra(esito.pianta.stanze.find((s) => s.tipo === 'ingresso').id);
      return m.notte;
    },
    eventiDi: (nome) => ricevuti.filter((e) => e.nome === nome),
    uccidiTutti() {
      for (const b of bersagli) if (b.stato !== 'morto') b.colpisci(b.vita, null);
    },
  };
  return m;
}

/** Record di stanza sintetico per montare un modello da solo. */
function recordDi(modello, { porte = { N: 'x', S: 'y', W: 'z', E: 'w' }, seme = 7, profondita = 3, dBoss = 4, tipo = modello.tipo } = {}) {
  return { id: 'r-test', tipo, dim: modello.dim, modello: modello.id, seme_stanza: seme, profondita, d_boss: dBoss, porte, finestre: [], ricompensa: { valore: 0, oggetti: [] } };
}

const DIST = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ---------------------------------------------------------------------------------------------
// Contenuti (storia 017 e parametri)
// ---------------------------------------------------------------------------------------------

test('contenuti: stanze.json e generazione.json sono statistiche valide e rispettano L_min ≤ n_min − 4', async () => {
  for (const nome of ['stanze', 'generazione']) {
    const { errori } = validaStatistiche(nome, leggi(`contenuti/parametri/${nome}.json`));
    assert.deepEqual(errori, [], `${nome}.json: ${errori.join('; ')}`);
  }
  const { parametri } = await caricaContenuti();
  assert.deepEqual(validaParametriGenerazione(parametri), []);
  assert.equal(parametri.get('stanze.t_chiusura_porte'), 500);
  assert.equal(parametri.get('stanze.r_sicurezza'), 160);
  assert.equal(parametri.get('generazione.piani.p1.n_min'), 8);
  // il validatore dei parametri trova l'incoerenza con il nome del parametro
  const rotti = await caricaContenuti({ ritocca: (nome, j) => { if (nome === 'generazione') j.piani.p1.L_min.base = 5; } });
  assert.match(validaParametriGenerazione(rotti.parametri)[0], /generazione\.piani\.p1\.L_min/);
});

test('017: i 14 modelli si caricano senza errori di contenuto: 6 normali 1x1, 2 doppie 2x1, ingresso, ricordo, boss, tesoro, banchetto, segreta; tutti con tag di difficoltà e spawn validi', async () => {
  const { catalogo, modelli, erroriModelli, indice, parametri } = await caricaContenuti();
  assert.deepEqual(erroriModelli, []);
  assert.equal(indice.modelli.length, 14);
  assert.equal(modelli.length, 14);
  assert.deepEqual(catalogo.conteggi(), {
    'ingresso/1x1': 1, 'normale/1x1': 6, 'normale/2x1': 2, 'ricordo/1x1': 1, 'boss/1x1': 1, 'tesoro/1x1': 1, 'banchetto/1x1': 1, 'segreta/1x1': 1,
  });
  const regole = regoleDaParametri(parametri);
  for (const m of modelli) {
    assert.ok(m.tag.includes(TAG_DIFFICOLTA[m.difficolta]), `${m.id}: tag di difficoltà`);
    assert.deepEqual(validaModello(m, regole), []);
    // ogni punto di nascita è fuori dall'anello di sicurezza di una porta: ≥ d_porta_min da ogni slot (statico)
    for (const s of m.spawn) {
      const geo = { colonne: m.dim === '2x1' ? 26 : 13 };
      const slots = m.dim === '2x1'
        ? [[6, -1], [19, -1], [6, 7], [19, 7], [-1, 3], [26, 3]]
        : [[6, -1], [13, 3], [6, 7], [-1, 3]];
      for (const [c, r] of slots) assert.ok(Math.hypot((s.c - c) * 64, (s.r - r) * 64) >= 128, `${m.id} spawn (${s.c},${s.r}) vicino allo slot (${c},${r}) ${geo.colonne}`);
    }
  }
  assert.equal(catalogo.perId('pd-m-01').scena_id, 'piazza-dante.targa-commemorativa');
  // il validatore rifiuta: colonna nel vestibolo, spawn su ostacolo, porta irraggiungibile, simbolo ignoto
  const base = modelloColonnaPanca();
  const conVestibolo = { ...base, griglia: base.griglia.map((r, i) => (i === 1 ? '......C......' : r)) };
  assert.match(validaModello(conVestibolo, regole).join(' '), /vestibolo dello slot N/);
  const spawnSuOstacolo = { ...base, spawn: [...base.spawn, { c: 5, r: 3, tipo: 'T' }] };
  assert.match(validaModello(spawnSuOstacolo, regole).join(' '), /\(5, 3\)/);
  const murata = { ...base, griglia: base.griglia.map(() => '....C........') }; // muro verticale: la porta W è isolata
  assert.match(validaModello(murata, regole).join(' '), /non è raggiungibile/);
  assert.match(validaModello({ ...base, griglia: base.griglia.map((r, i) => (i === 0 ? '?............' : r)) }, regole).join(' '), /simbolo sconosciuto '\?'/);
});

// ---------------------------------------------------------------------------------------------
// Formule dei GDD
// ---------------------------------------------------------------------------------------------

test('formule: n_nemici (piano 3 → 4; piano 1 d=1 ≤ 2), ondate (6 → 3+3), valore_ricompensa (→ 5), peso_modello (0,114 / 0,02), diff_target, dimensioni (11, 6)', async () => {
  const { parametri } = await caricaContenuti();
  assert.equal(nNemici({ parametri, p: 3, d: 3, dBoss: 6, diff: 3, dim: '1x1' }), 4);
  assert.equal(nNemici({ parametri, p: 1, d: 1, dBoss: 4, diff: 1, dim: '1x1', variazione: 1 }), 2);
  for (const v of [-1, 0, 1]) for (const diff of [1, 2, 3]) assert.ok(nNemici({ parametri, p: 1, d: 1, dBoss: 4, diff, dim: '2x1', variazione: v }) <= 2);
  assert.deepEqual(quoteOndate({ parametri, p: 3, n: 6 }), [3, 3]);
  assert.deepEqual(quoteOndate({ parametri, p: 1, n: 3 }), [3]);
  assert.deepEqual(quoteOndate({ parametri, p: 1, n: 9 }), [5, 4], 'ondate_max[1] = 2 limita a due ondate');
  assert.deepEqual(quoteOndate({ parametri, p: 3, n: 10 }), [4, 4, 3].map((x, i) => (i === 0 ? 10 - 4 - 3 : i === 1 ? 4 : 3)));
  assert.equal(valoreRicompensa({ parametri, p: 3, prof: 0.5, diff: 4, molt: 1.5, rng: () => 0 }), 5);
  assert.equal(valoreRicompensa({ parametri, p: 3, prof: 0.5, diff: 4, molt: 1.5, rng: () => 0.71 }), 0, 'p_ricompensa = 0,7');
  assert.equal(valoreRicompensa({ parametri, p: 1, prof: 0.25, diff: 3, molt: 1, rng: () => 0 }), 2);
  const m = { difficolta: 2, peso_base: 1 };
  assert.ok(Math.abs(pesoModello({ parametri, modello: m, usi: 1, vicinoUsa: false, diffTarget: 3, combattimento: true }) - 0.114) < 0.001);
  assert.equal(pesoModello({ parametri, modello: m, usi: 1, vicinoUsa: true, diffTarget: 3, combattimento: true }), 0.02);
  assert.equal(pesoModello({ parametri, modello: { difficolta: 3, peso_base: 1 }, usi: 0, vicinoUsa: false, diffTarget: 3, combattimento: true }), 1);
  assert.equal(diffTarget({ parametri, piano: 4, prof: 0.5 }), 4);
  assert.equal(diffTarget({ parametri, piano: 1, prof: 0.25 }), 1);
  assert.deepEqual(dimensioniPiano({ parametri, piano: 3, u: 0.62, u2: 0.3 }), { nStanze: 11, L: 6, nExtra: 1 });
  assert.deepEqual(dimensioniPiano({ parametri, piano: 1, u: 0.99, u2: 0.99 }), { nStanze: 8, L: 4, nExtra: 0 });
  const comp = composizione({ tavolozza: [{ tipo: 'gatto', peso: 1, min: 1, max: 2 }, { tipo: 'vespa', peso: 1, min: 1, max: 1 }], n: 5, rng: creaRng(3) });
  assert.deepEqual(comp.slice(0, 2), ['gatto', 'vespa']);
  assert.equal(comp.length, 3, 'i massimi limitano la composizione');
  assert.equal(puntoValido({ punto: { x: 608, y: 96 }, ferruccio: { x: 200, y: 224 }, r: 160, porte: [], dPortaMin: 128, scelti: [], dMinSpawn: 48 }), true);
  assert.equal(puntoValido({ punto: { x: 288, y: 160 }, ferruccio: { x: 200, y: 224 }, r: 160, porte: [], dPortaMin: 128, scelti: [], dMinSpawn: 48 }), false);
});

test('formule: il piano di riserva (esempio del GDD) rispetta H1-H10 e totalizza Q = 100', async () => {
  const { parametri, catalogo, riserva } = await caricaContenuti();
  const rngPiano = creaRng(1);
  const pianta = piantaDaRiserva(riserva, { piano: 1, parametri, catalogo, rngPiano });
  assert.deepEqual(validaPianta(pianta, { parametri, catalogo }), []);
  assert.equal(punteggioQ(pianta, { parametri, piano: 1 }), 100);
  assert.equal(pianta.d_boss, 4);
  assert.equal(pianta.stanze.find((s) => s.tipo === 'ricordo').scena_id, 'piazza-dante.targa-commemorativa');
  assert.deepEqual(pianta.stanze.find((s) => s.id === 'r1').finestre, ['E']);
  assert.deepEqual(pianta.stanze.find((s) => s.id === 's').finestre.sort(), ['N', 'W']);
});

// ---------------------------------------------------------------------------------------------
// Storia 016: generazione
// ---------------------------------------------------------------------------------------------

test('016: GIVEN il seme 1845, WHEN si genera il piano 1 due volte, THEN le due piante sono identiche', async () => {
  const { parametri, catalogo, riserva } = await caricaContenuti();
  const a = generaPiano({ seme: SEME, piano: 1, parametri, catalogo, riserva });
  const b = generaPiano({ seme: SEME, piano: 1, parametri, catalogo, riserva });
  assert.equal(JSON.stringify(a.pianta), JSON.stringify(b.pianta));
  assert.deepEqual(a.usiModelli, b.usiModelli);
  const c = generaPiano({ seme: SEME + 1, piano: 1, parametri, catalogo, riserva });
  assert.notEqual(JSON.stringify(a.pianta.stanze.map((s) => s.cella)), JSON.stringify(c.pianta.stanze.map((s) => s.cella)));
  assert.equal(a.pianta.p, 1);
  assert.ok(a.pianta.stanze.every((s) => Number.isInteger(s.seme_stanza)));
});

test('016: GIVEN 200 semi, WHEN si generano, THEN 1 ingresso, 1 boss, 1 tesoro, 1 banchetto, 1 ricordo (grado 1), boss non adiacente all\'ingresso, ricordo a distanza 1, nessuna stanza vuota; violatori zero', async () => {
  const { parametri, catalogo, riserva } = await caricaContenuti();
  let violatori = 0;
  let riserve = 0;
  const t0 = performance.now();
  for (let seme = 1; seme <= 200; seme++) {
    const esito = generaPiano({ seme, piano: 1, parametri, catalogo, riserva, log: logFinto() });
    const p = esito.pianta;
    if (esito.origine === 'riserva') riserve += 1;
    const v = validaPianta(p, { parametri, catalogo });
    if (v.length) violatori += 1;
    const conta = (tipo) => p.stanze.filter((s) => s.tipo === tipo).length;
    assert.deepEqual([conta('ingresso'), conta('boss'), conta('tesoro'), conta('banchetto'), conta('ricordo')], [1, 1, 1, 1, 1], `seme ${seme}`);
    const { distanze } = esplora(p, p.stanze.find((s) => s.tipo === 'ingresso').id);
    const ingresso = p.stanze.find((s) => s.tipo === 'ingresso');
    const boss = p.stanze.find((s) => s.tipo === 'boss');
    assert.ok(Math.abs(boss.cella[0] - ingresso.cella[0]) + Math.abs(boss.cella[1] - ingresso.cella[1]) > 1, `seme ${seme}: boss adiacente all'ingresso`);
    assert.ok(distanze.get(boss.id) >= 4, `seme ${seme}: d_boss ${distanze.get(boss.id)}`);
    for (const tipo of ['boss', 'tesoro', 'banchetto', 'ricordo']) {
      const s = p.stanze.find((x) => x.tipo === tipo);
      assert.equal(Object.keys(s.porte).length, 1, `seme ${seme}: ${tipo} di grado ${Object.keys(s.porte).length}`);
    }
    assert.equal(distanze.get(p.stanze.find((s) => s.tipo === 'ricordo').id), 1, `seme ${seme}: ricordo non a distanza 1`);
    assert.equal(p.stanze.find((s) => s.tipo === 'ricordo').scena_id, 'piazza-dante.targa-commemorativa');
    assert.equal(p.stanze.filter((s) => s.tipo !== 'segreta').length, 8, `seme ${seme}: n_stanze`);
    for (const s of p.stanze) {
      const m = catalogo.perId(s.modello);
      assert.ok(m && m.tipo === s.tipo && m.dim === s.dim, `seme ${seme}: ${s.id} senza modello compatibile`);
      if (s.tipo === 'normale') {
        assert.ok(m.spawn.length > 0 && m.tavolozza.length > 0);
        assert.ok(nNemici({ parametri, p: 1, d: s.profondita, dBoss: p.d_boss, diff: m.difficolta, dim: s.dim }) >= 1);
      }
      assert.ok(distanze.has(s.id) || s.tipo === 'segreta', `seme ${seme}: ${s.id} non raggiungibile`);
    }
    if (p.segreta) {
      const seg = p.stanze.find((s) => s.tipo === 'segreta');
      const vicine = p.stanze.filter((s) => s.id !== seg.id && Math.abs(s.celle[0][0] - seg.cella[0]) + Math.abs(s.celle[0][1] - seg.cella[1]) === 1
        || (s.celle[1] && Math.abs(s.celle[1][0] - seg.cella[0]) + Math.abs(s.celle[1][1] - seg.cella[1]) === 1));
      assert.ok(vicine.length >= 2 && !vicine.some((s) => s.tipo === 'boss'), `seme ${seme}: segreta`);
      assert.ok(vicine.every((s) => s.finestre.length >= 1), `seme ${seme}: finestre`);
    }
  }
  const ms = performance.now() - t0;
  console.log(`  200 semi generati: violatori ${violatori}, piani di riserva ${riserve}, ${(ms / 200).toFixed(2)} ms/piano`);
  assert.equal(violatori, 0);
  assert.equal(riserve, 0);
  assert.ok(ms / 200 < 100, 'un piano in meno di 100 ms');
});

test('016: GIVEN un piano sotto soglia_Q, WHEN si rigenera, THEN al massimo max_tentativi volte (poi il migliore); senza tentativi validi il piano di riserva con errore QA', async () => {
  // soglia irraggiungibile: tutti i 12 tentativi vengono provati e si tiene il migliore
  const alta = await caricaContenuti({ ritocca: (nome, j) => { if (nome === 'generazione') j.piani.p1.soglia_Q = { base: 101, min: 0, max: 200 }; } });
  const esito = generaPiano({ seme: SEME, piano: 1, parametri: alta.parametri, catalogo: alta.catalogo, riserva: alta.riserva, log: logFinto() });
  assert.equal(esito.tentativi, alta.parametri.get('generazione.max_tentativi'));
  assert.equal(esito.tentativi, 12);
  assert.equal(esito.origine, 'migliore');
  assert.ok(esito.pianta.Q <= 100);
  assert.equal(esito.errori.filter((e) => /Q .* < soglia/.test(e)).length + esito.errori.filter((e) => !/Q .* < soglia/.test(e)).length, 12);
  assert.deepEqual(validaPianta(esito.pianta, { parametri: alta.parametri, catalogo: alta.catalogo }), []);
  // nessun modello di banchetto: ogni tentativo fallisce (H7) → piano di riserva, errore per il QA
  const { parametri, catalogo, modelli, riserva } = await caricaContenuti();
  const senzaBanchetto = creaCatalogo(modelli.filter((m) => m.tipo !== 'banchetto'));
  const log = logFinto();
  const r = generaPiano({ seme: SEME, piano: 1, parametri, catalogo: senzaBanchetto, riserva, log });
  assert.equal(r.origine, 'riserva');
  assert.equal(r.tentativi, 12);
  assert.equal(r.pianta.riserva, true);
  assert.equal(r.pianta.stanze.filter((s) => s.tipo !== 'segreta').length, 8);
  assert.equal(log.voci.length, 1);
  assert.match(String(log.voci[0][0]), /piano di riserva/);
  assert.deepEqual(validaPianta(r.pianta, { parametri, catalogo }), [], 'la riserva è valida con il catalogo completo');
  assert.throws(() => generaPiano({ seme: SEME, piano: 1, parametri, catalogo: senzaBanchetto, riserva: null, log }), /nessun piano di riserva/);
});

test('016: GIVEN la pianta, WHEN si salva la notte, THEN contiene solo seme, piano e stanza corrente', async () => {
  const m = await creaMondo();
  const notte = m.avviaNotte();
  const salvato = notte.salvataggio();
  assert.deepEqual(Object.keys(salvato).sort(), ['piano', 'seme', 'stanza']);
  assert.deepEqual(salvato, { seme: SEME, piano: 1, stanza: notte.stanza.id });
  assert.equal(notte.stanza.tipo, 'ingresso');
  assert.ok(!('stanze' in salvato) && !('pianta' in salvato));
  // la pianta si ricava dal seme: stessa pianta della generazione diretta
  const diretta = generaPiano({ seme: SEME, piano: 1, parametri: m.parametri, catalogo: m.catalogo, riserva: m.riserva });
  assert.equal(JSON.stringify(diretta.pianta), JSON.stringify(notte.pianta));
});

// ---------------------------------------------------------------------------------------------
// Storia 014: stanza e porte
// ---------------------------------------------------------------------------------------------

test('014: GIVEN un modello con 3 nemici, WHEN Ferruccio entra, THEN le porte si chiudono (chiudendo a t_chiusura_porte, chiuse quando i nemici compaiono a t_marker) e si riaprono quando l\'ultimo muore', async () => {
  const m = await creaMondo();
  const modello = m.catalogo.perId('pd-n-01');
  // cerco deterministicamente un seme di stanza con composizione da 3 nemici in una sola ondata
  let record = null;
  for (let seme = 1; seme < 200 && !record; seme++) {
    const r = recordDi(modello, { seme, profondita: 2 });
    const st = m.monta(r, modello);
    if (st.nNemici === 3 && st.quote.length === 1) record = r;
  }
  assert.ok(record, 'un seme con 3 nemici');
  const stanza = m.monta(record, modello);
  assert.equal(stanza.stato, 'non_visitata');
  assert.equal(stanza.porte.length, 4);
  const arrivo = stanza.puntoArrivo('W');
  m.ferruccio.posiziona(arrivo.x, arrivo.y);
  stanza.entra();
  assert.equal(stanza.stato, 'annuncio');
  assert.equal(stanza.segnalini.length, 3);
  assert.ok(stanza.porte.every((p) => p.stato === 'aperta'));
  const tChiusura = m.ticks('stanze.t_chiusura_porte');
  const tMarker = m.ticks('stanze.t_marker');
  m.tick(tChiusura - 1);
  assert.ok(stanza.porte.every((p) => p.stato === 'aperta'), 'prima di t_chiusura_porte le porte sono aperte (si può sbirciare)');
  m.tick(1);
  assert.ok(stanza.porte.every((p) => p.stato === 'chiudendo'), 'a t_chiusura_porte (entro 1 tick) le porte si chiudono');
  assert.equal(m.eventiDi('stanza.chiusa').length, 1);
  m.tick(tMarker - tChiusura);
  assert.equal(m.bersagli.length, 3, 'i nemici compaiono a t_marker');
  assert.ok(stanza.porte.every((p) => p.stato === 'chiusa'), 'le porte sono già chiuse quando i nemici compaiono');
  assert.ok(stanza.porte.every((p) => p.solido.ferma_passo && p.solido.ferma_colpi));
  assert.equal(stanza.stato, 'ondata');
  assert.ok(m.bersagli.every((b) => ['gatto', 'vespa', 'statua', 'guardia'].includes(b.archetipo)));
  // le porte chiuse sono muro: Ferruccio sulla soglia W non riesce a uscire
  m.ferruccio.posiziona(arrivo.x, arrivo.y);
  m.tieni('sinistra');
  m.tick(60);
  m.lascia('sinistra');
  assert.ok(m.ferruccio.x >= stanza.origine.x - 1, 'la porta chiusa blocca il passo');
  assert.equal(stanza.attraversata(), null);
  // muoiono due: le porte restano chiuse; muore l'ultimo: svuotata → aprendo dopo t_ritardo_apertura → aperta
  m.bersagli[0].colpisci(99, null);
  m.bersagli[1].colpisci(99, null);
  m.tick(1);
  assert.equal(stanza.stato, 'ondata');
  assert.ok(stanza.porte.every((p) => p.stato === 'chiusa'));
  m.bersagli[2].colpisci(99, null);
  m.tick(1);
  assert.equal(stanza.stato, 'svuotata');
  m.tick(m.ticks('stanze.t_ricompensa'));
  assert.equal(m.eventiDi('stanza.ricompensa').length, 1);
  m.tick(m.ticks('stanze.t_ritardo_apertura') - m.ticks('stanze.t_ricompensa'));
  assert.equal(stanza.stato, 'pulita');
  assert.equal(m.eventiDi('stanza.pulita').length, 1);
  assert.ok(stanza.porte.every((p) => p.stato === 'aprendo'));
  m.tick(m.ticks('stanze.t_anim_porta'));
  assert.ok(stanza.porte.every((p) => p.stato === 'aperta' && p.passabile()));
  assert.deepEqual(STATI_STANZA, ['non_visitata', 'annuncio', 'ondata', 'intervallo', 'svuotata', 'pulita']);
  assert.deepEqual(STATI_PORTA, ['aperta', 'chiudendo', 'chiusa', 'aprendo']);
});

test('014: porta — la chiusura aspetta se Ferruccio occupa la cella; uscire prima della chiusura riporta la stanza a non_visitata', async () => {
  const m = await creaMondo();
  const porta = creaPorta({ slot: 'N', lato: 'N', verso: 'x', rett: { x: 0, y: 0, w: 64, h: 64 }, tempo: m.tempo, parametri: m.parametri });
  porta.chiudi();
  porta.tick(true);
  porta.tick(true);
  assert.equal(porta.stato, 'aperta', 'aspetta finché la cella è occupata');
  assert.equal(porta.richiestaChiusura, true);
  porta.tick(false);
  assert.equal(porta.stato, 'chiudendo');
  const n = m.ticks('stanze.t_anim_porta');
  for (let i = 0; i < Math.floor(n / 2) - 1; i++) porta.tick(false);
  assert.equal(porta.passabile(), true, 'passabile prima di metà corsa');
  porta.tick(false);
  assert.equal(porta.passabile(), false, 'solida a metà corsa');
  for (let i = 0; i < n; i++) porta.tick(false);
  assert.equal(porta.stato, 'chiusa');
  porta.apri();
  assert.equal(porta.stato, 'aprendo');
  for (let i = 0; i < n; i++) porta.tick(false);
  assert.equal(porta.stato, 'aperta');
  assert.doesNotThrow(() => porta.tick(), 'tick senza argomento non lancia');
  // stanza: uscita prima della chiusura
  const modello = m.catalogo.perId('pd-n-02');
  const stanza = m.monta(recordDi(modello, { seme: 11, profondita: 2 }), modello);
  stanza.entra();
  assert.equal(stanza.stato, 'annuncio');
  m.tick(5);
  const stato = stanza.esci();
  assert.equal(stanza.stato, 'non_visitata');
  assert.equal(stato.stato, 'non_visitata');
  assert.equal(stanza.segnalini.length, 0);
  assert.equal(m.eventiDi('stanza.abbandonata').length, 1);
});

test('014: GIVEN uno spawn, WHEN avviene, THEN nessun nemico nasce entro l\'anello di sicurezza (200 semi, Ferruccio su ogni soglia, tutte le ondate), né a meno di d_porta_min dalle porte, né a meno di d_min_spawn da un altro', async () => {
  const m = await creaMondo();
  const rSic = m.parametri.get('stanze.r_sicurezza');
  const dPorta = m.parametri.get('stanze.d_porta_min');
  const dMin = m.parametri.get('stanze.d_min_spawn');
  const normali = m.catalogo.filtra({ tipo: 'normale' });
  let nati = 0;
  let ondate = 0;
  for (let seme = 1; seme <= 200; seme++) {
    const modello = normali[seme % normali.length];
    const porte = modello.dim === '2x1' ? { N0: 'a', N1: 'b', S0: 'c', S1: 'd', W: 'e', E: 'f' } : { N: 'a', E: 'b', S: 'c', W: 'd' };
    const slot = Object.keys(porte)[seme % Object.keys(porte).length];
    const stanza = m.monta(recordDi(modello, { seme, porte, profondita: 1 + (seme % 3) }), modello);
    const arrivo = stanza.puntoArrivo(slot);
    m.ferruccio.posiziona(arrivo.x, arrivo.y);
    stanza.entra();
    assert.ok(stanza.nNemici >= 1);
    for (let guardia = 0; guardia < 20 && stanza.stato !== 'pulita'; guardia++) {
      const prima = m.bersagli.length;
      m.tick(m.ticks('stanze.t_marker') + 1);
      const nuovi = m.bersagli.slice(prima);
      if (nuovi.length) ondate += 1;
      for (const b of nuovi) {
        nati += 1;
        assert.ok(DIST(b, m.ferruccio) >= rSic, `seme ${seme} ${modello.id} slot ${slot}: nato a ${DIST(b, m.ferruccio).toFixed(0)} px da Ferruccio`);
        for (const p of stanza.porte) assert.ok(DIST(b, p.centro) >= dPorta, `seme ${seme}: nato a ${DIST(b, p.centro).toFixed(0)} px dalla porta ${p.slot}`);
        for (const altro of nuovi) if (altro !== b) assert.ok(DIST(b, altro) >= dMin, `seme ${seme}: due nascite a ${DIST(b, altro).toFixed(0)} px`);
      }
      m.uccidiTutti();
      m.tick(m.ticks('stanze.t_pausa_ondata') + m.ticks('stanze.t_ritardo_apertura') + 2);
    }
    assert.equal(stanza.stato, 'pulita', `seme ${seme}: la stanza si pulisce`);
  }
  console.log(`  200 stanze: ${nati} nascite in ${ondate} ondate, tutte fuori dall'anello di ${rSic} px`);
  assert.ok(nati >= 200);
  assert.ok(ondate > 200, 'alcune stanze hanno due ondate');
});

test('014: GIVEN una colonna, WHEN Ferruccio e un fendente la incontrano, THEN il corpo si ferma e il colpo non passa; una panca blocca il movimento e non i colpi', async () => {
  const m = await creaMondo({ override: { 'combattimento.portata': 96 } });
  const modello = modelloColonnaPanca();
  assert.deepEqual(validaModello(modello, regoleDaParametri(m.parametri)), []);
  const stanza = m.monta(recordDi(modello, { tipo: 'ingresso' }), modello); // tipo ingresso: niente ondate, solo geometria
  stanza.entra();
  assert.equal(stanza.stato, 'pulita');
  const colonna = stanza.ostacoli.find((o) => o.id === 'colonna');
  const panca = stanza.ostacoli.find((o) => o.id === 'panca');
  assert.ok(colonna.ferma_passo && colonna.ferma_colpi && panca.ferma_passo && !panca.ferma_colpi);
  // colonna: il corpo si ferma al bordo, il fendente non passa
  const a = stanza.centroCella(4, 3);
  m.ferruccio.posiziona(a.x, a.y);
  const dietroColonna = m.creaNemico({ archetipo: 'gatto', ...stanza.centroCella(6, 3), id: 'dietro-colonna' });
  m.bersagli.push(dietroColonna);
  m.tieni('destra');
  m.tick(60);
  m.lascia('destra');
  assert.ok(Math.abs(m.ferruccio.x - (colonna.x - m.ferruccio.r)) < 0.01, `fermo contro la colonna (${m.ferruccio.x} vs ${colonna.x - m.ferruccio.r})`);
  assert.ok(DIST(m.ferruccio, dietroColonna) <= 96 + dietroColonna.r, 'il bersaglio è a portata del settore');
  m.tick(10);
  m.premi('attacco');
  m.tick(12);
  assert.equal(dietroColonna.vita, 6, 'nessun danno oltre la colonna');
  assert.equal(m.eventiDi('ferruccio.colpo').length, 0);
  // panca: il corpo si ferma, il fendente passa
  m.bersagli.length = 0;
  const b = stanza.centroCella(6, 3);
  m.ferruccio.posiziona(b.x, b.y);
  const dietroPanca = m.creaNemico({ archetipo: 'gatto', ...stanza.centroCella(8, 3), id: 'dietro-panca' });
  m.bersagli.push(dietroPanca);
  m.tick(30);
  m.tieni('destra');
  m.tick(60);
  m.lascia('destra');
  assert.ok(Math.abs(m.ferruccio.x - (panca.x - m.ferruccio.r)) < 0.01, 'fermo contro la panca');
  m.tick(10);
  m.premi('attacco');
  m.tick(12);
  assert.equal(dietroPanca.vita, 5, 'la panca non ferma il colpo');
  assert.equal(m.eventiDi('ferruccio.colpo').length, 1);
});

test('014: GIVEN una stanza pulita, WHEN si rientra, THEN resta pulita e senza nemici (stato salvato nella notte)', async () => {
  const m = await creaMondo();
  const notte = m.avviaNotte();
  const ingresso = notte.stanza.id;
  const normale = notte.pianta.stanze.find((s) => s.tipo === 'normale');
  assert.equal(notte.vaiA(normale.id), true);
  assert.equal(notte.stanza.stato, 'annuncio');
  m.tick(m.ticks('stanze.t_marker') + 1);
  assert.ok(m.bersagli.length >= 1);
  assert.equal(notte.statoDi(normale.id).stato, 'in_corso');
  for (let guardia = 0; guardia < 10 && notte.stanza.stato !== 'pulita'; guardia++) {
    m.uccidiTutti();
    m.tick(m.ticks('stanze.t_pausa_ondata') + m.ticks('stanze.t_marker') + m.ticks('stanze.t_ritardo_apertura') + 3);
  }
  assert.equal(notte.stanza.stato, 'pulita');
  assert.equal(notte.statoDi(normale.id).stato, 'pulita');
  const pulite = m.eventiDi('stanza.pulita').length;
  notte.vaiA(ingresso);
  assert.equal(m.bersagli.length, 0);
  notte.vaiA(normale.id);
  assert.equal(notte.stanza.stato, 'pulita');
  assert.equal(m.bersagli.length, 0);
  assert.equal(notte.stanza.segnalini.length, 0);
  assert.ok(notte.stanza.porte.every((p) => p.stato === 'aperta'));
  m.tick(m.ticks('stanze.t_marker') + 10);
  assert.equal(m.bersagli.length, 0, 'non nasce mai più un nemico');
  assert.equal(m.eventiDi('stanza.pulita').length, pulite, 'nessuna nuova chiusura');
  assert.equal(notte.vaiA('inesistente'), false);
  // una stanza senza nemici è pulita alla prima visita
  const ricordo = notte.pianta.stanze.find((s) => s.tipo === 'ricordo');
  notte.vaiA(ricordo.id);
  assert.equal(notte.stanza.stato, 'pulita');
  assert.ok(notte.stanza.contenuti.some((c) => c.tipo === 'reperto'));
});

// ---------------------------------------------------------------------------------------------
// Storia 015: transizioni e camera
// ---------------------------------------------------------------------------------------------

test('015: GIVEN Ferruccio sulla soglia nord a porte aperte, WHEN la attraversa, THEN la stanza scorre 250 ms verso nord e Ferruccio appare sulla soglia sud della nuova stanza', async () => {
  const m = await creaMondo();
  const notte = m.avviaNotte();
  // una stanza con una porta N verso una stanza 1x1 (il seme 1845 ne ha; altrimenti si cerca)
  const coppia = notte.pianta.stanze.map((s) => [s, s.porte.N && notte.pianta.stanze.find((t) => t.id === s.porte.N)]).find(([s, t]) => s.dim === '1x1' && t && t.dim === '1x1');
  assert.ok(coppia, 'una porta N tra due stanze 1x1');
  const [da, a] = coppia;
  notte.vaiA(da.id);
  const soglia = notte.stanza.puntoArrivo('N');
  m.ferruccio.posiziona(soglia.x, soglia.y);
  m.tick(1);
  const nTransizione = m.ticks('stanze.camera.t_transizione');
  assert.equal(nTransizione, 15, '250 ms = 15 tick');
  m.tieni('su');
  let passati = 0;
  for (; passati < 60 && !notte.inTransizione; passati++) m.tick(1);
  assert.ok(notte.inTransizione, 'la transizione parte attraversando la soglia');
  assert.equal(notte.camera.lato, 'N');
  assert.equal(notte.stanza.id, a.id, 'la stanza corrente è già quella a nord');
  assert.deepEqual(m.eventiDi('notte.stanza').at(-1).payload, { da: da.id, a: a.id, lato: 'N', tipo: a.tipo });
  // lo scorrimento parte dall'alto (la stanza entra da nord) e si azzera alla fine
  const s0 = notte.camera.scorrimento();
  assert.ok(s0.y < 0 && s0.x === 0, `scorrimento iniziale ${JSON.stringify(s0)}`);
  const campoSud = { y: m.campo.y + m.campo.altezza };
  const attesoY = campoSud.y - m.campo.cella / 2;
  assert.ok(Math.abs(m.ferruccio.y - attesoY) < 0.01, `Ferruccio sulla soglia sud (y ${m.ferruccio.y} vs ${attesoY})`);
  assert.ok(Math.abs(m.ferruccio.x - notte.stanza.portaIn('S').centro.x) < 0.01, 'allineato alla porta sud');
  const yDurante = m.ferruccio.y;
  m.tick(nTransizione - 1);
  assert.ok(notte.inTransizione);
  assert.equal(m.ferruccio.y, yDurante, 'durante la transizione nessuno si muove');
  m.tick(1);
  assert.equal(notte.inTransizione, false, 'la transizione dura esattamente 15 tick');
  assert.deepEqual(notte.camera.scorrimento(), { x: 0, y: 0 });
  m.lascia('su');
  assert.equal(m.eventiDi('camera.transizione').length, 2);
});

test('015: GIVEN una stanza 2x1 (1664 px), WHEN si entra, THEN la scala è min(1280/1664, 720/448) con margine per l\'HUD e tutta la stanza è visibile', async () => {
  const m = await creaMondo();
  const camera = creaCamera({ parametri: m.parametri, tempo: m.tempo, scena: SCENA });
  assert.equal(camera.scala, 1);
  const attesa = Math.min(1280 / 1664, 720 / 448);
  assert.equal(camera.scalaPer(1664, 448), attesa);
  assert.ok(Math.abs(attesa - 0.769) < 0.001);
  assert.equal(camera.scalaPer(832, 448), 1, 'la 1x1 resta a scala 1 anche con il margine HUD');
  assert.equal(camera.scalaPer(1152, 640), Math.min(1, 1280 / 1152, (720 - m.parametri.get('stanze.camera.margine_hud')) / 640), 'arena: il margine HUD conta sull\'altezza, mai sopra 1');
  assert.ok(camera.scalaPer(1152, 700) < 1, 'con il margine HUD un\'arena alta 700 px viene ridotta');
  const doppia = m.catalogo.perId('pd-d-01');
  const stanza = m.monta(recordDi(doppia, { porte: { N0: 'a', S1: 'b', W: 'c', E: 'd' } }), doppia);
  assert.equal(m.campo.larghezza, 1664);
  assert.equal(m.campo.altezza, 448);
  camera.inquadra(m.campo);
  assert.equal(camera.scala, attesa);
  // tutta l'area calpestabile sta dentro la scena dopo la trasformazione
  const trasforma = (x, y) => ({ x: 640 + (x - 640) * camera.scala, y: 360 + (y - 360) * camera.scala });
  const tl = trasforma(m.campo.x, m.campo.y);
  const br = trasforma(m.campo.x + m.campo.larghezza, m.campo.y + m.campo.altezza);
  assert.ok(tl.x >= -0.01 && tl.y >= 0 && br.x <= 1280.01 && br.y <= 720, `area visibile ${JSON.stringify([tl, br])}`);
  assert.deepEqual(Object.keys(stanza.geo.slots).sort(), ['E', 'N0', 'N1', 'S0', 'S1', 'W']);
  assert.equal(stanza.porte.length, 4);
  assert.ok(stanza.spawnPunti.length >= m.parametri.get('stanze.spawn_min_2x1'));
});

test('015: GIVEN una transizione in corso, WHEN si preme attacco, THEN l\'input è ignorato fino alla fine', async () => {
  const m = await creaMondo();
  const notte = m.avviaNotte();
  const da = notte.pianta.stanze.find((s) => Object.keys(s.porte).length >= 1 && s.dim === '1x1');
  const slot = Object.keys(da.porte)[0];
  notte.vaiA(da.id);
  const soglia = notte.stanza.puntoArrivo(slot);
  m.ferruccio.posiziona(soglia.x, soglia.y);
  const dir = { N: 'su', S: 'giu', E: 'destra', W: 'sinistra' }[slot[0]];
  m.tieni(dir);
  for (let i = 0; i < 60 && !notte.inTransizione; i++) m.tick(1);
  m.lascia(dir);
  assert.ok(notte.inTransizione);
  const x0 = m.ferruccio.x;
  const y0 = m.ferruccio.y;
  m.premi('attacco');
  assert.equal(m.comb.stato, 'pronto', 'l\'attacco non parte');
  assert.equal(m.comb.bufferAttivo, false, 'e non viene nemmeno accodato');
  const statoCorpo = m.ferruccio.stato;
  m.premi('scatto');
  assert.equal(m.ferruccio.stato, statoCorpo, 'lo scatto non parte: il corpo resta com\'era');
  assert.equal(m.ferruccio.cariche, 1);
  m.tieni('destra');
  m.tick(5);
  m.lascia('destra');
  assert.deepEqual([m.ferruccio.x, m.ferruccio.y], [x0, y0], 'nessun movimento');
  for (let i = 0; i < 20 && notte.inTransizione; i++) m.tick(1);
  assert.equal(notte.inTransizione, false);
  assert.equal(m.comb.stato, 'pronto');
  m.premi('attacco');
  assert.equal(m.comb.stato, 'fendente', 'finita la transizione l\'input torna a funzionare');
});

// ---------------------------------------------------------------------------------------------
// Prestazioni
// ---------------------------------------------------------------------------------------------

test('prestazioni: creare una stanza costa meno di 5 ms; un tick della notte con una stanza piena meno di 2 ms', async () => {
  const m = await creaMondo();
  const notte = m.avviaNotte();
  const normale = notte.pianta.stanze.find((s) => s.tipo === 'normale');
  const t0 = performance.now();
  for (let i = 0; i < 20; i++) notte.vaiA(normale.id);
  const perStanza = (performance.now() - t0) / 20;
  m.tick(m.ticks('stanze.t_marker') + 1);
  const t1 = performance.now();
  m.tick(120);
  const perTick = (performance.now() - t1) / 120;
  console.log(`  stanza montata in ${perStanza.toFixed(2)} ms; tick della notte ${perTick.toFixed(3)} ms`);
  assert.ok(perStanza < 5);
  assert.ok(perTick < 2);
});

// ---------------------------------------------------------------------------------------------
// Storia 018: pericoli ambientali e ricompense a stanza pulita
// ---------------------------------------------------------------------------------------------

/** Ferruccio con il bordo del corpo appena dentro il disco di fiamma del pericolo `p`, sul lato `lato` (±1 in x). */
function appoggiaAlBraciere(m, p, lato = 1) {
  m.ferruccio.posiziona(p.x + lato * (p.rFiamma + m.ferruccio.r - 1), p.y);
}

/** Avanza di un tick alla volta finché il pericolo `p` non è nella fase `fase` (al più `max` tick); ritorna i tick spesi. */
function finoAFase(m, p, fase, max) {
  let n = 0;
  while (p.fase !== fase && n < max) {
    m.tick(1);
    n += 1;
  }
  assert.equal(p.fase, fase, `fase ${fase} raggiunta entro ${max} tick`);
  return n;
}

test('018 formule: fasePericolo (riposo → anticipo → attivo, periodico) e puntoSicuro (cella libera più vicina)', async () => {
  const ciclo = { riposo: 108, anticipo: 42, attivo: 60 };
  assert.deepEqual(fasePericolo({ t: 0, ...ciclo }), { fase: 'riposo', progresso: 0 });
  assert.equal(fasePericolo({ t: 107, ...ciclo }).fase, 'riposo');
  assert.deepEqual(fasePericolo({ t: 108, ...ciclo }), { fase: 'anticipo', progresso: 0 });
  assert.equal(fasePericolo({ t: 149, ...ciclo }).fase, 'anticipo');
  assert.deepEqual(fasePericolo({ t: 150, ...ciclo }), { fase: 'attivo', progresso: 0 });
  assert.equal(fasePericolo({ t: 209, ...ciclo }).fase, 'attivo');
  assert.equal(fasePericolo({ t: 210, ...ciclo }).fase, 'riposo', 'periodico');
  assert.equal(fasePericolo({ t: 210 + 108 + 42 + 59, ...ciclo }).fase, 'attivo');
  assert.deepEqual(FASI_PERICOLO, ['riposo', 'anticipo', 'attivo']);
  const celle = [{ x: 0, y: 0 }, { x: 64, y: 0 }, { x: 128, y: 0 }];
  assert.deepEqual(puntoSicuro({ x: 10, y: 5, occupato: () => false, celleLibere: celle }), { x: 10, y: 5 }, 'libero: resta dov\'è');
  assert.deepEqual(puntoSicuro({ x: 100, y: 5, occupato: () => true, celleLibere: celle }), { x: 128, y: 0 }, 'occupato: la cella più vicina');
  assert.deepEqual(puntoSicuro({ x: 100, y: 5, occupato: () => true, celleLibere: [] }), { x: 100, y: 5 }, 'senza celle: il punto stesso');
});

test('018: GIVEN un braciere, WHEN Ferruccio lo tocca senza invulnerabilità, THEN perde 1 maschera solo in attivo ed è spinto via; il tratteggio (anticipo) precede l\'attivo di t_anticipo; una sola maschera per fase attiva; stessa fase iniziale con lo stesso seme', async () => {
  const m = await creaMondo();
  const modello = m.catalogo.perId('pd-n-04');
  assert.ok(modello, 'pd-n-04 ha due bracieri (tag "bracieri")');
  // tipo non di combattimento: la stanza è pulita alla prima visita, e i pericoli funzionano anche lì (hazard_in_pulita)
  const st = m.monta(recordDi(modello, { tipo: 'ingresso' }), modello);
  m.ferruccio.posiziona(st.origine.x + st.cella * 6.5, st.origine.y + st.cella * 5.5);
  st.entra();
  assert.equal(st.stato, 'pulita');
  const bracieri = st.pericoli.filter((p) => p.id === ID_BRACIERE);
  assert.equal(bracieri.length, 2);
  const periodo = m.ticks('stanze.braciere.t_riposo') + m.ticks('stanze.braciere.t_anticipo') + m.ticks('stanze.braciere.t_attivo');
  for (const b of bracieri) {
    assert.ok(FASI_PERICOLO.includes(b.fase));
    assert.ok(b.sfasamento >= 0 && b.sfasamento < periodo, 'fase iniziale a seme dentro il periodo');
    assert.equal(b.rFiamma, m.parametri.get('stanze.braciere.r_fiamma'));
    assert.ok(b.solido?.ferma_passo && !b.solido.ferma_colpi, 'il piede ferma il passo, non i colpi');
  }
  const p = bracieri[0];
  const max = m.mod.valore('ferruccio.maschere_max');
  const x0 = p.x + p.rFiamma + m.ferruccio.r - 1;
  // Ferruccio tocca il disco di fiamma: in riposo e anticipo nessun danno
  appoggiaAlBraciere(m, p, 1);
  finoAFase(m, p, 'riposo', periodo);
  assert.equal(m.ferruccio.maschere, max);
  const inRiposo = finoAFase(m, p, 'anticipo', periodo);
  assert.ok(inRiposo >= 1);
  assert.equal(m.ferruccio.maschere, max, 'nessun danno in riposo');
  const inAnticipo = finoAFase(m, p, 'attivo', periodo);
  assert.equal(inAnticipo, m.ticks('stanze.braciere.t_anticipo'), 'il tratteggio è leggibile per tutto t_anticipo (700 ms)');
  assert.ok(inAnticipo * m.tempo.passoMs >= 700 - 1, `anticipo ≥ 700 ms (${inAnticipo} tick)`);
  // attivo: danno 1 nello stesso tick, Colpito, spinta radiale (via dal braciere, +x), evento stanza.pericolo
  assert.equal(m.ferruccio.maschere, max - 1, 'nessun danno in anticipo, 1 maschera al primo tick attivo');
  assert.equal(m.ferruccio.stato, 'colpito');
  assert.ok(m.ferruccio.inSpinta());
  assert.ok(m.ferruccio.invulnerabile());
  const pericolo = m.eventiDi('stanza.pericolo');
  assert.equal(pericolo.length, 1);
  assert.equal(pericolo[0].payload.pericolo, 'braciere');
  assert.equal(pericolo[0].payload.danno, m.parametri.get('stanze.danno_pericolo'));
  const danno = m.eventiDi('ferruccio.danno');
  assert.equal(danno.length, 1);
  assert.ok(danno[0].payload.direzione.x > 0.99, 'spinta radiale dal piede del braciere');
  m.tick(m.ticks('ferruccio.t_spinta') + 1);
  assert.ok(m.ferruccio.x > x0 + 5, `spinto via: ${m.ferruccio.x.toFixed(1)} > ${x0}`);
  // per tutta la fase attiva (1000 ms > t_invuln 800 ms) resta una sola maschera persa: la spinta lo ha portato fuori
  finoAFase(m, p, 'riposo', periodo);
  assert.equal(m.ferruccio.maschere, max - 1);
  assert.equal(m.eventiDi('stanza.pericolo').length, 1);
  // scatto attraverso il braciere attivo: invulnerabile, nessun danno
  m.ferruccio.posiziona(p.x - p.rFiamma - m.ferruccio.r - 8, p.y);
  finoAFase(m, p, 'attivo', periodo);
  const prima = m.ferruccio.maschere;
  m.tieni('destra');
  m.premi('scatto');
  assert.equal(m.ferruccio.stato, 'scatta');
  let toccatoInScatto = false;
  for (let guardia = 0; guardia < 40 && m.ferruccio.stato === 'scatta'; guardia++) {
    if (Math.hypot(m.ferruccio.x - p.x, m.ferruccio.y - p.y) <= p.rFiamma + m.ferruccio.r && p.fase === 'attivo') toccatoInScatto = true;
    assert.equal(m.ferruccio.maschere, prima, 'lo scatto attraversa senza danno');
    m.tick(1);
  }
  m.lascia('destra');
  assert.ok(toccatoInScatto, 'durante lo scatto Ferruccio è stato dentro la fiamma attiva');
  // con 1 maschera muore (hazard_letale): prima si lascia finire l'invulnerabilità (e la spinta) del colpo preso
  // uscendo dallo scatto dentro la fiamma, poi lo si appoggia al disco
  finoAFase(m, p, 'riposo', periodo);
  m.tick(m.ticks('ferruccio.t_invuln') + 1);
  assert.ok(!m.ferruccio.invulnerabile() && !m.ferruccio.inSpinta());
  assert.equal(p.fase, 'riposo');
  m.ferruccio.impostaMaschere(1);
  appoggiaAlBraciere(m, p, -1);
  finoAFase(m, p, 'attivo', periodo);
  assert.equal(m.ferruccio.maschere, 0);
  assert.equal(m.ferruccio.stato, 'morto');
  assert.equal(m.eventiDi('ferruccio.morto').length, 1);
  // determinismo: stesso seme_stanza → stesse fasi iniziali; i due bracieri non vanno all'unisono
  const m2 = await creaMondo();
  const st2 = m2.monta(recordDi(modello, { tipo: 'ingresso' }), modello);
  assert.deepEqual(st2.pericoli.map((q) => q.sfasamento), st.pericoli.map((q) => q.sfasamento));
  assert.notEqual(st.pericoli[0].sfasamento, st.pericoli[1].sfasamento);
});

/** Stanza normale premiata con almeno una moneta tra gli oggetti pre-estratti, sul piano del seme dato. */
function stanzaPremiata(notte) {
  return notte.pianta.stanze.find((s) => s.tipo === 'normale' && (s.ricompensa?.oggetti ?? []).some((o) => o.tipo === 'moneta')) ?? null;
}

/** Ripulisce la stanza corrente uccidendo i fantocci ondata dopo ondata; Ferruccio fermo in un angolo. */
function ripulisci(m, notte) {
  m.tick(m.ticks('stanze.t_marker') + 1);
  const st = notte.stanza;
  m.ferruccio.posiziona(st.origine.x + st.cella * 1.5, st.origine.y + st.cella * 1.5);
  for (let guardia = 0; guardia < 10 && notte.stanza.stato !== 'pulita'; guardia++) {
    m.uccidiTutti();
    m.tick(m.ticks('stanze.t_pausa_ondata') + m.ticks('stanze.t_marker') + m.ticks('stanze.t_ritardo_apertura') + 3);
  }
  assert.equal(notte.stanza.stato, 'pulita');
}

test('018: GIVEN una stanza normale pulita, WHEN le porte si riaprono, THEN cadono gli oggetti della ricompensa pre-estratta (formula del GDD stanze) sparsi con il generatore drop entro 48 px dal centro, mai su ostacoli o pericoli; stesso seme → stesse posizioni', async () => {
  let seme = SEME;
  let m = await creaMondo({ conEconomia: true, seme });
  let notte = m.avviaNotte({ seme });
  let premiata = stanzaPremiata(notte);
  for (let k = 1; !premiata && k < 20; k++) {
    seme = SEME + k;
    m = await creaMondo({ conEconomia: true, seme });
    notte = m.avviaNotte({ seme });
    premiata = stanzaPremiata(notte);
  }
  assert.ok(premiata, 'una stanza normale con monete nella ricompensa pre-estratta');
  const attese = premiata.ricompensa.oggetti;
  const nMonete = attese.filter((o) => o.tipo === 'moneta').length;
  const nCuori = attese.filter((o) => o.tipo === 'cuore').length;
  const nScintille = attese.filter((o) => o.tipo === 'scintilla').length;
  assert.equal(attese.reduce((a, o) => a + o.valore, 0), premiata.ricompensa.valore, 'gli oggetti valgono le unità della formula');
  assert.equal(notte.vaiA(premiata.id), true);
  assert.equal(m.economia.aTerra(premiata.id).length, 0);
  ripulisci(m, notte);
  const ric = m.eventiDi('stanza.ricompensa');
  assert.equal(ric.length, 1);
  assert.equal(ric[0].payload.dispersione, m.parametri.get('stanze.r_dispersione_ricompensa'));
  assert.equal(typeof ric[0].payload.puntoSicuro, 'function');
  assert.deepEqual(ric[0].payload.ricompensa, premiata.ricompensa);
  const aTerra = m.economia.aTerra(premiata.id);
  const bonus = m.parametri.get('economia.bonus_stanza');
  assert.equal(aTerra.filter((o) => o.tipo === 'moneta').length, bonus + nMonete, `bonus di stanza ${bonus} + ${nMonete} monete della ricompensa`);
  assert.equal(aTerra.filter((o) => o.tipo === 'cuore').length, nCuori, 'a maschere piene p_cuore = 0: solo i cuori pre-estratti');
  assert.equal(m.profilo.scintille, nScintille, 'le scintille della ricompensa vanno subito al profilo');
  // gli oggetti della ricompensa (dopo i `bonus` del centro) cadono entro la dispersione o sulla cella sicura più vicina
  const centro = { x: ric[0].payload.x, y: ric[0].payload.y };
  const st = notte.stanza;
  const dentroSolido = (o) => st.record && m.campo.solidi.some((s) => s.ferma_passo && o.x >= s.x && o.x < s.x + s.w && o.y >= s.y && o.y < s.y + s.h);
  const suPericolo = (o) => st.pericoli.some((p) => Math.hypot(p.x - o.x, p.y - o.y) < p.rFiamma);
  const sparsi = aTerra.filter((o) => o.tipo !== 'cuore' || nCuori > 0).slice(bonus);
  assert.equal(sparsi.length, nMonete + nCuori);
  for (const o of sparsi) {
    const d = DIST(o, centro);
    const suCella = st.centroCella(Math.floor((o.x - st.origine.x) / st.cella), Math.floor((o.y - st.origine.y) / st.cella));
    assert.ok(d <= ric[0].payload.dispersione + 1e-6 || (Math.abs(suCella.x - o.x) < 1e-6 && Math.abs(suCella.y - o.y) < 1e-6), `entro 48 px dal centro o al centro di una cella sicura (d = ${d.toFixed(1)})`);
    assert.ok(!dentroSolido(o) && !suPericolo(o), 'mai su ostacolo o pericolo');
  }
  // determinismo: un secondo mondo con lo stesso seme lascia gli stessi oggetti negli stessi punti
  const m2 = await creaMondo({ conEconomia: true, seme });
  const notte2 = m2.avviaNotte({ seme });
  notte2.vaiA(premiata.id);
  ripulisci(m2, notte2);
  const forma = (lista) => lista.map((o) => ({ tipo: o.tipo, x: o.x, y: o.y }));
  assert.deepEqual(forma(m2.economia.aTerra(premiata.id)), forma(aTerra));
  // il punto sicuro riporta su una cella libera un punto dentro un ostacolo del modello (se il modello ne ha)
  const ostacolo = m.campo.solidi.find((s) => s.ferma_passo && s.id !== 'muro' && s.id !== 'porta');
  if (ostacolo) {
    const q = ric[0].payload.puntoSicuro(ostacolo.x + ostacolo.w / 2, ostacolo.y + ostacolo.h / 2);
    assert.ok(!dentroSolido(q) && !suPericolo(q));
  }
});

test('018: GIVEN una stanza già pulita, WHEN si rientra (anche rimontandola dallo stato salvato), THEN nessuna nuova ricompensa e gli oggetti non raccolti restano dove sono', async () => {
  let seme = SEME;
  let m = await creaMondo({ conEconomia: true, seme });
  let notte = m.avviaNotte({ seme });
  let premiata = stanzaPremiata(notte);
  for (let k = 1; !premiata && k < 20; k++) {
    seme = SEME + k;
    m = await creaMondo({ conEconomia: true, seme });
    notte = m.avviaNotte({ seme });
    premiata = stanzaPremiata(notte);
  }
  const ingresso = notte.stanza.id;
  notte.vaiA(premiata.id);
  ripulisci(m, notte);
  const prima = m.economia.aTerra(premiata.id).map((o) => ({ ...o }));
  assert.ok(prima.length > 0);
  assert.equal(notte.statoDi(premiata.id).ricompensa_data, true);
  const attesa = m.ticks('stanze.t_ritardo_apertura') + m.ticks('stanze.t_ricompensa') + m.ticks('stanze.t_marker') + 5;
  // rientro dalla notte
  notte.vaiA(ingresso);
  m.tick(3);
  notte.vaiA(premiata.id);
  assert.equal(notte.stanza.stato, 'pulita');
  // vaiA mette Ferruccio al centro, dove giacciono le monete: lo si sposta in un angolo prima che l'economia raccolga
  m.ferruccio.posiziona(notte.stanza.origine.x + notte.stanza.cella * 1.5, notte.stanza.origine.y + notte.stanza.cella * 1.5);
  m.tick(attesa);
  assert.equal(m.eventiDi('stanza.ricompensa').length, 1, 'nessuna nuova ricompensa');
  assert.deepEqual(m.economia.aTerra(premiata.id), prima, 'gli oggetti restano dove sono (Ferruccio lontano dal centro)');
  // rimontare la stanza dallo stato salvato (resume, ADR-0006): ricompensa_data resta vero
  const stato = notte.statoDi(premiata.id);
  const modello = m.catalogo.perId(premiata.modello);
  const ricEventi = m.eventiDi('stanza.ricompensa').length;
  const st = creaStanza({
    record: premiata, modello, piano: 1, parametri: m.parametri, tempo: m.tempo, eventi: m.eventi, campo: m.campo, scena: SCENA,
    bersagli: m.bersagli, creaNemico: m.creaNemico, ferruccio: m.ferruccio, statoSalvato: stato,
  });
  st.entra();
  assert.equal(st.stato, 'pulita');
  for (let i = 0; i < attesa; i++) st.tick(m.tempo.passoS);
  assert.equal(m.eventiDi('stanza.ricompensa').length, ricEventi);
  assert.equal(st.statoSalvabile().ricompensa_data, true);
  // la ricompensa è pre-estratta: un'altra stanza con lo stesso record ma stato nuovo la darebbe una sola volta
  const monete0 = m.economia.monete;
  // raccolta: Ferruccio passa sul centro e prende le monete; al rientro successivo non ricompaiono
  notte.vaiA(ingresso);
  notte.vaiA(premiata.id);
  const centro = { x: notte.stanza.origine.x + notte.stanza.geo.colonne * notte.stanza.cella / 2, y: notte.stanza.origine.y + notte.stanza.geo.righe * notte.stanza.cella / 2 };
  for (const o of m.economia.aTerra(premiata.id)) {
    if (o.tipo !== 'moneta') continue;
    m.ferruccio.posiziona(o.x, o.y);
    m.tick(2);
  }
  assert.ok(m.economia.monete > monete0, `monete raccolte: ${m.economia.monete}`);
  assert.equal(m.economia.aTerra(premiata.id).filter((o) => o.tipo === 'moneta').length, 0);
  notte.vaiA(ingresso);
  notte.vaiA(premiata.id);
  m.tick(attesa);
  assert.equal(m.economia.aTerra(premiata.id).filter((o) => o.tipo === 'moneta').length, 0, 'le monete raccolte non ricompaiono');
  assert.ok(Number.isFinite(centro.x));
});
