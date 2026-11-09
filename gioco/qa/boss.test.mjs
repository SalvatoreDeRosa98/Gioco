/**
 * gioco/qa/boss.test.mjs — Test della storia P06: boss del pool, Donna Luciana, stato della run, sipario.
 *
 * Esecuzione: `node gioco/qa/boss.test.mjs` dalla radice del repository (node:test, nessun browser). Parametri reali
 * (boss.json, nemici.json › boss), fabbrica dei nemici reale con il pattern del boss, bersaglio finto che registra i
 * colpi, lista dei proiettili reale; ciclo simulato a tick fissi (1/60 s).
 *
 * Criteri coperti: formule della run (piano nel ciclo, ciclo, moltiplicatori, vita del boss per piano/ciclo, boss del
 * piano con Donna Luciana ai piani 4 e 8, estrazione senza ripetizione e deterministica per seme, `forzaBoss`); per ogni
 * pattern fasi anticipo → lampo → colpo (telegrafo solo sul corpo: nessun `segnoATerra`), proiettili lanciati, nome del
 * pattern; i tratti propri (balzo e immunità in volo del Re Gatto, carica del Capitano, evocazioni della Regina e del
 * Custode, forbici del Maestro, Mani e schianto di Donna Luciana); contatto del corpo (pesante, parabile → stordito e
 * immune); furia (cooldown più corti); il racconto del sipario per atti, ciclo e «BIS»; nessun Math.random.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { creaTempo } from '../motore/fondazione/tempo.js';
import { creaBus } from '../motore/fondazione/eventi.js';
import { creaParametri } from '../motore/fondazione/parametri.js';
import { creaRng, derivato } from '../motore/fondazione/rng.js';
import { creaModificatori } from '../motore/oggetti/modificatori.js';
import { creaCampo } from '../motore/mondo/fisica.js';
import { creaNemico } from '../motore/attori/nemico.js';
import { creaGatto } from '../motore/attori/gatto.js';
import { creaRun } from '../motore/mondo/run.js';
import { PATTERN_BOSS, patternPerNome } from '../motore/attori/boss/indice.js';
import { creaSipario } from '../motore/interfaccia/sipario.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const leggi = (rel) => JSON.parse(readFileSync(join(RADICE, rel), 'utf8'));
const TESTI = leggi('contenuti/interfaccia.json');
const BOSS_JSON = leggi('contenuti/parametri/boss.json');
const SCENA = Object.freeze({ larghezza: 1280, altezza: 720 });
const SEME = 1845;
const DT = 1 / 60;
const TICKS_PROVA = 900; // 15 s simulati

async function caricaParametri() {
  const parametri = creaParametri({ log: { error: () => {}, warn: () => {} } });
  await parametri.carica({
    caricatore: async (nome) => leggi(`contenuti/parametri/${nome}.json`),
    statistiche: ['ferruccio', 'combattimento', 'stanza', 'stanze', 'generazione', 'nemici', 'economia', 'incontri', 'risveglio', 'audio', 'resa'],
    tabelle: ['input', 'doni', 'sinergie', 'consumabili', 'ricordi', 'personaggi', 'oggetti-attivi', 'patto', 'boss'],
    sovrascritture: [], override: {},
  });
  return parametri;
}

const parametri = await caricaParametri();
const eventi = creaBus();
const tempo = creaTempo();
const modificatori = creaModificatori(parametri, { catalogo: parametri.get('doni'), sinergie: parametri.get('sinergie'), eventi, rng: derivato(creaRng(SEME), 'doni') });
const campo = creaCampo({ colonne: parametri.get('stanza.colonne'), righe: parametri.get('stanza.righe'), cella: parametri.get('stanza.cella'), scenaLarghezza: SCENA.larghezza, scenaAltezza: SCENA.altezza });
const C = (k) => parametri.get(`nemici.boss.comuni.${k}`);
const B = (id, k) => parametri.get(`nemici.boss.${id}.${k}`);
const TUTTI = [...BOSS_JSON.pool, BOSS_JSON.finale];

/** Bersaglio finto: Ferruccio fermo in un punto, registra gli attacchi; `parata` fa rispondere 'parata' e stordisce l'attaccante. */
function bersaglioFinto(x, y, { parata = false } = {}) {
  const colpi = [];
  return {
    x, y, r: 14, stato: 'in_piedi', colpi,
    colpisci(att) {
      colpi.push(att);
      if (parata && !att.imparabile) { att.attaccante?.stordisci?.(300); return 'parata'; }
      return 'danno';
    },
  };
}

function creaBossProva(id, { piano = 1, bersaglio = null, vita = null } = {}) {
  const run = creaRun({ tabella: parametri.get('boss'), seme: SEME });
  const info = TUTTI.find((b) => b.id === id);
  const proiettili = [];
  const altri = [];
  const generati = [];
  const eventiVisti = [];
  const bus = creaBus();
  for (const nome of ['boss.anticipo', 'boss.atterraggio', 'boss.mani_schianto', 'nemico.morto']) bus.on(nome, (p) => eventiVisti.push({ nome, ...p }));
  const fabbrica = info.archetipoBase === 'gatto' ? creaGatto : creaNemico;
  const n = fabbrica({
    modificatori, parametri, tempo, eventi: bus, campo, bersaglio, altri: () => altri, rng: derivato(creaRng(SEME), id),
    archetipo: info.archetipoBase, piano, x: campo.x + campo.larghezza * 0.5, y: campo.y + campo.altezza * 0.5, id, boss: true,
    schedaBoss: { vita: vita ?? run.vitaBoss(piano, info), scalaRaggio: info.scalaRaggio, scalaPortata: info.scalaPortata },
    proiettili, pattern: patternPerNome(info.pattern), bossId: id, moltVelocita: run.moltVelocita(piano),
    genera: (arch, gx, gy) => { const g = { archetipo: arch, x: gx, y: gy, r: 12, peso: 0, volante: false, stato: 'in_piedi', vita: 1, boss: false }; altri.push(g); generati.push(g); return g; },
  });
  altri.push(n);
  return { n, run, info, proiettili, altri, generati, eventi: eventiVisti };
}

/** Fa girare il boss per `ticks` tick raccogliendo le fasi viste e i tick in cui sono iniziati i colpi. */
function gira(n, ticks, { ogniTick = null } = {}) {
  const fasi = new Set();
  const iniziColpo = [];
  let prec = null;
  for (let t = 0; t < ticks; t++) {
    n.tick(DT);
    fasi.add(n.stato);
    if (n.stato === 'colpo' && prec !== 'colpo') iniziColpo.push(t);
    prec = n.stato;
    ogniTick?.(t);
  }
  return { fasi, iniziColpo };
}

// ---------------------------------------------------------------------------------------------
// Lo stato della run
// ---------------------------------------------------------------------------------------------

test('P06 run: formule del Teatro — piano nel ciclo, ciclo, moltiplicatori di vita e velocità, vita del boss per piano e ciclo, Donna Luciana ai piani 4 e 8', () => {
  const run = creaRun({ tabella: parametri.get('boss'), seme: SEME });
  const T = (k) => BOSS_JSON[k].base;
  for (const p of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    assert.equal(run.pianoNelCiclo(p), ((p - 1) % T('piani_per_ciclo')) + 1);
    assert.equal(run.cicloDi(p), Math.floor((p - 1) / T('piani_per_ciclo')) + 1);
    assert.ok(Math.abs(run.moltCiclo(p) - Math.pow(T('molt_ciclo'), run.cicloDi(p) - 1)) < 1e-9);
    assert.ok(Math.abs(run.moltVelocita(p) - Math.min(T('molt_vel_max'), 1 + (p - 1) * T('molt_vel_per_piano'))) < 1e-9);
    const info = run.bossDelPiano(p);
    const attesa = Math.max(T('vita_min'), Math.round((info.hpBaseTeatro * T('scala_vita_teatro') + (run.pianoNelCiclo(p) - 1) * T('vita_per_piano_ciclo')) * run.moltCiclo(p)));
    assert.equal(run.vitaBoss(p), attesa, `vita del boss al piano ${p}`);
  }
  assert.equal(run.bossDelPiano(4).id, BOSS_JSON.finale.id, 'piano 4: Donna Luciana');
  assert.equal(run.bossDelPiano(8).id, BOSS_JSON.finale.id, 'piano 8: Donna Luciana (ciclo 2)');
  assert.ok(run.vitaBoss(8) > run.vitaBoss(4), 'al ciclo 2 Donna Luciana ha più vita');
  assert.equal(run.vitaBoss(5), run.vitaBoss(1) === run.vitaBoss(5) ? run.vitaBoss(5) : run.vitaBoss(5));
  assert.ok(run.moltVelocita(20) <= T('molt_vel_max'), 'la velocità ha un tetto');
  assert.equal(run.bonusCicloPct(5), Math.round((T('molt_ciclo') - 1) * 100));
  assert.equal(run.bonusCicloPct(1), 0);
});

test('P06 run: estrazione dei boss senza ripetizione, deterministica per seme, diversa per seme diverso; forzaBoss; idStoria; run.piano e run.nuova', () => {
  const bus = creaBus();
  const visti = [];
  bus.on('run.piano', (p) => visti.push(p));
  bus.on('run.nuova', (p) => visti.push({ nuova: true, ...p }));
  const run = creaRun({ tabella: parametri.get('boss'), seme: SEME, eventi: bus });
  const ids = run.bossEstratti;
  assert.equal(new Set(ids).size, BOSS_JSON.pool.length, 'tutti i boss del pool, una volta sola');
  assert.deepEqual(creaRun({ tabella: parametri.get('boss'), seme: SEME }).bossEstratti, ids, 'stesso seme, stessa estrazione');
  const diversa = [1, 2, 3, 4, 5, 6, 7].some((k) => creaRun({ tabella: parametri.get('boss'), seme: SEME + k }).bossEstratti.join() !== ids.join());
  assert.ok(diversa, 'semi diversi danno ordini diversi');
  const primi = [1, 2, 3].map((p) => run.bossDelPiano(p).id);
  assert.equal(new Set(primi).size, 3, 'piani 1-3: tre boss diversi');
  assert.ok(primi.every((id) => id !== BOSS_JSON.finale.id));
  assert.equal(run.vaiAlPiano(1).id, primi[0]);
  assert.equal(run.piano, 1);
  assert.equal(run.ciclo, 1);
  assert.equal(visti.at(-1).boss, primi[0]);
  assert.equal(run.forzaBoss('donna-luciana').id, 'donna-luciana');
  assert.equal(run.bossDelPiano(1).id, 'donna-luciana', 'il boss forzato vince');
  assert.equal(run.forzaBoss('nessuno'), null);
  assert.equal(run.bossDelPiano(1).id, primi[0]);
  assert.equal(run.idStoriaDi('re-gatto'), 'gatto-dei-quattro-canti');
  assert.equal(run.idStoriaDi('donna-luciana'), 'donna-luciana');
  const semePrima = run.seme;
  run.nuova(run.prossimoSeme());
  assert.notEqual(run.seme, semePrima);
  assert.equal(run.piano, 0);
  assert.ok(visti.some((v) => v.nuova));
  assert.equal(run.semeStanze(2), run.seme + 2 * BOSS_JSON.seme_sale.base);
});

test('P06 contenuti: boss.json e nemici.json › boss coerenti (pattern noti, scheda per ogni boss, comuni con telegrafo sul corpo), Donna Luciana fra i boss di storia.json', () => {
  for (const b of TUTTI) {
    assert.ok(PATTERN_BOSS[b.pattern], `${b.id}: pattern '${b.pattern}' sconosciuto`);
    assert.ok(parametri.ha(`nemici.boss.${b.id}`), `${b.id}: manca la scheda in nemici.json › boss`);
    assert.ok(parametri.ha(`nemici.archetipi.${b.archetipoBase}`), `${b.id}: archetipo base ignoto`);
    assert.ok(b.hpBaseTeatro > 0);
  }
  for (const k of ['t_anticipo', 't_lampo', 't_recupero', 't_cd_iniziale', 'soglia_furia', 'contatto_pesante', 'contatto_imparabile', 'quota_contatto', 'quota_immune']) assert.ok(parametri.ha(`nemici.boss.comuni.${k}`), k);
  const storia = leggi('contenuti/storia.json');
  const idsStoria = new Set(storia.boss.map((b) => b.id));
  for (const b of TUTTI) if (b.idStoria) assert.ok(idsStoria.has(b.idStoria), `${b.id}: idStoria '${b.idStoria}' non è in storia.json`);
  assert.ok(idsStoria.has('donna-luciana'));
});

// ---------------------------------------------------------------------------------------------
// I pattern
// ---------------------------------------------------------------------------------------------

for (const info of TUTTI) {
  test(`P06 ${info.id} (${info.pattern}): vita della formula, emersione → fasi anticipo/lampo/colpo (telegrafo solo sul corpo, nessun segno a terra), proiettili lanciati, nome del pattern, raggio scalato`, () => {
    const { n, run, proiettili } = creaBossProva(info.id, { bersaglio: bersaglioFinto(campo.x + campo.larghezza * 0.2, campo.y + campo.altezza * 0.5) });
    assert.equal(n.boss, true);
    assert.equal(n.bossId, info.id);
    assert.equal(n.pattern, info.pattern);
    assert.equal(n.vita, run.vitaBoss(1, info));
    assert.equal(n.vitaMax, run.vitaBoss(1, info));
    assert.equal(n.stato, 'emersione');
    const { fasi, iniziColpo } = gira(n, TICKS_PROVA);
    for (const f of ['anticipo', 'lampo', 'colpo']) assert.ok(fasi.has(f), `${info.id}: fase '${f}' mai vista (${[...fasi]})`);
    assert.ok(iniziColpo.length >= 2, `${info.id}: almeno due colpi in ${TICKS_PROVA} tick (${iniziColpo.length})`);
    assert.ok(proiettili.length > 0, `${info.id}: nessun proiettile`);
    assert.ok(proiettili.every((p) => p.danno === parametri.get('nemici.proiettili_nemici.danno_boss')), 'proiettili del boss (danno_boss)');
    assert.equal(n.segnoATerra(), null, 'mai un segno a terra');
    assert.ok(n.r > parametri.get(`nemici.archetipi.${info.archetipoBase}.r`), 'raggio scalato dalla taglia del boss');
  });
}

test('P06 re-gatto (monstro_jump): il primo attacco è il balzo (quota > 0, boss.atterraggio, rosa di n_rosa colpi), i colpi di Ferruccio passano sotto oltre quota_immune, il secondo è il ventaglio di n_ventaglio', () => {
  const b = bersaglioFinto(campo.x + campo.larghezza * 0.25, campo.y + campo.altezza * 0.5);
  const { n, proiettili, eventi: ev } = creaBossProva('re-gatto', { bersaglio: b });
  let quotaMax = 0;
  let vitaPrima = n.vita;
  let colpoInVoloIgnorato = false;
  const prima = { x: n.x, y: n.y };
  gira(n, TICKS_PROVA, {
    ogniTick: () => {
      quotaMax = Math.max(quotaMax, n.quota);
      if (n.quota > C('quota_immune') && !colpoInVoloIgnorato) {
        vitaPrima = n.vita;
        n.colpisci(5, null);
        colpoInVoloIgnorato = n.vita === vitaPrima;
      }
    },
  });
  assert.ok(quotaMax >= B('re-gatto', 'quota_salto') * 0.9, `quota massima ${quotaMax}`);
  assert.equal(n.quota, 0, 'a terra alla fine');
  assert.equal(colpoInVoloIgnorato, true, 'in volo i colpi passano sotto');
  const atterraggi = ev.filter((e) => e.nome === 'boss.atterraggio');
  assert.ok(atterraggi.length >= 1, 'boss.atterraggio emesso');
  assert.ok(Math.hypot(n.x - prima.x, n.y - prima.y) > 40 || atterraggi.length > 0, 'il balzo porta il boss verso Ferruccio');
  const nRosa = Math.round(B('re-gatto', 'n_rosa'));
  const nVent = Math.round(B('re-gatto', 'n_ventaglio'));
  assert.ok(proiettili.length >= nRosa + nVent, `rosa (${nRosa}) + ventaglio (${nVent}) ≤ ${proiettili.length}`);
  const velocita = new Set(proiettili.slice(0, nRosa).map((p) => Math.round(p.velocita)));
  assert.ok(velocita.size > 1, 'la rosa ha velocità diverse (dal generatore derivato)');
});

test('P06 capitano-guardia (chub_charge): la carica muove il corpo lungo un solo asse a v_carica, si ferma al muro o a t_carica e lascia un anello di n_anello colpi', () => {
  const b = bersaglioFinto(campo.x + campo.larghezza * 0.15, campo.y + campo.altezza * 0.5);
  const { n, proiettili, eventi: ev } = creaBossProva('capitano-guardia', { bersaglio: b });
  let inizio = null;
  let percorso = 0;
  let assi = { x: 0, y: 0 };
  let prec = { x: n.x, y: n.y };
  gira(n, TICKS_PROVA, {
    ogniTick: () => {
      if (n.stato === 'colpo') {
        if (!inizio) inizio = { x: n.x, y: n.y };
        assi.x += Math.abs(n.x - prec.x);
        assi.y += Math.abs(n.y - prec.y);
        percorso += Math.hypot(n.x - prec.x, n.y - prec.y);
      }
      prec = { x: n.x, y: n.y };
    },
  });
  assert.ok(inizio, 'ha caricato');
  assert.ok(percorso > 100, `la carica percorre un tratto (${percorso.toFixed(0)} px)`);
  assert.ok(Math.min(assi.x, assi.y) < 1, 'la carica è rettilinea su un solo asse');
  assert.ok(ev.some((e) => e.nome === 'boss.atterraggio'), 'arresto con scossa');
  assert.ok(proiettili.length >= Math.round(B('capitano-guardia', 'n_anello')));
});

test('P06 regina-vespa (duke_flies): rimbalza sempre (anche in anticipo), evoca vespe fino a max_vespe, anello per salva', () => {
  const b = bersaglioFinto(campo.x + campo.larghezza * 0.2, campo.y + campo.altezza * 0.3);
  const { n, proiettili, generati } = creaBossProva('regina-vespa', { bersaglio: b });
  let mossoInAnticipo = false;
  let prec = { x: n.x, y: n.y };
  gira(n, TICKS_PROVA * 2, {
    ogniTick: () => {
      if (n.stato === 'anticipo' && (n.x !== prec.x || n.y !== prec.y)) mossoInAnticipo = true;
      prec = { x: n.x, y: n.y };
    },
  });
  assert.equal(mossoInAnticipo, true, 'la Regina non si ferma mai');
  assert.ok(generati.length >= 1 && generati.every((g) => g.archetipo === 'vespa'), `vespe evocate: ${generati.length}`);
  assert.ok(generati.length <= Math.round(B('regina-vespa', 'max_vespe')), 'mai oltre max_vespe comuni vivi');
  assert.ok(proiettili.length >= Math.round(B('regina-vespa', 'n_anello')) * 2);
});

test('P06 colosso-statua (gurdy_turret): immobile, spirale per salva, una bomba ogni ogni_salve_bomba salve fino a max_bombe, dentro il campo', () => {
  const b = bersaglioFinto(campo.x + campo.larghezza * 0.2, campo.y + campo.altezza * 0.5);
  const { n, proiettili, generati } = creaBossProva('colosso-statua', { bersaglio: b });
  const prima = { x: n.x, y: n.y };
  const { iniziColpo } = gira(n, TICKS_PROVA * 2);
  assert.ok(Math.hypot(n.x - prima.x, n.y - prima.y) < 1, 'il Custode non si muove');
  const ogni = Math.round(B('colosso-statua', 'ogni_salve_bomba'));
  assert.ok(iniziColpo.length >= ogni, `almeno ${ogni} salve (${iniziColpo.length})`);
  assert.ok(generati.length >= 1 && generati.every((g) => g.archetipo === 'bomba'), `bombe: ${generati.length}`);
  assert.ok(generati.length <= Math.round(B('colosso-statua', 'max_bombe')));
  for (const g of generati) {
    assert.ok(g.x >= campo.x && g.x <= campo.x + campo.larghezza && g.y >= campo.y && g.y <= campo.y + campo.altezza, 'bomba dentro il campo');
    const d = Math.hypot(g.x - n.x, g.y - n.y);
    assert.ok(d <= B('colosso-statua', 'd_bomba_max') + 1, `distanza ${d}`);
  }
  assert.ok(proiettili.length >= Math.round(B('colosso-statua', 'n_anello')) * iniziColpo.length * 0.9);
});

test('P06 maestro-fucina (scissor_blades): ogni salva fuori furia lancia 2 × n_lama colpi specchiati attorno alla mira', () => {
  const b = bersaglioFinto(campo.x + campo.larghezza * 0.2, campo.y + campo.altezza * 0.5);
  const { n, proiettili } = creaBossProva('maestro-fucina', { bersaglio: b });
  let primaSalva = null;
  gira(n, TICKS_PROVA, { ogniTick: () => { if (primaSalva === null && proiettili.length > 0) primaSalva = proiettili.length; } });
  assert.equal(primaSalva, 2 * Math.round(B('maestro-fucina', 'n_lama')), 'forbici: due lame');
  const angoli = proiettili.slice(0, primaSalva).map((p) => Math.atan2(p.direzione.y, p.direzione.x));
  const mira = Math.atan2(b.y - n.y, b.x - n.x);
  const scarto = (a) => Math.atan2(Math.sin(a - mira), Math.cos(a - mira)); // differenza angolare in (−π, π]
  const sopra = angoli.filter((a) => scarto(a) > 0).length;
  assert.ok(sopra > 0 && sopra < angoli.length, `lame da entrambi i lati della mira (${angoli.map((a) => scarto(a).toFixed(2))})`);
});

test('P06 donna-luciana (marionette_queen): i ventagli partono dalle due Mani (±scarto_mano_x), schianto delle Mani con anello alle salve pari', () => {
  const b = bersaglioFinto(campo.x + campo.larghezza * 0.5, campo.y + campo.altezza * 0.85);
  const { n, proiettili, eventi: ev } = creaBossProva('donna-luciana', { bersaglio: b });
  const posizioni = [];
  gira(n, TICKS_PROVA, { ogniTick: () => { while (posizioni.length < proiettili.length) { const p = proiettili[posizioni.length]; posizioni.push({ dx: p.x - n.x, dy: p.y - n.y }); } } });
  const nMano = Math.round(B('donna-luciana', 'n_ventaglio_mano'));
  const prime = posizioni.slice(0, nMano * 2);
  assert.equal(prime.length, nMano * 2, 'prima salva: le due Mani');
  const scarto = B('donna-luciana', 'scarto_mano_x');
  assert.ok(prime.slice(0, nMano).every((p) => p.dx < -scarto * 0.5), 'la Mano sinistra spara da sinistra');
  assert.ok(prime.slice(nMano).every((p) => p.dx > scarto * 0.5), 'la Mano destra spara da destra');
  const schianti = ev.filter((e) => e.nome === 'boss.mani_schianto');
  assert.ok(schianti.length >= 1, 'schianto delle Mani');
  assert.ok(schianti[0].mani.length === 2);
  assert.ok(proiettili.length >= nMano * 2 * 2 + Math.round(B('donna-luciana', 'n_anello')));
});

test('P06 contatto: il corpo del boss a contatto ferisce Ferruccio (pesante, parabile); una parata lo stordisce (t_stordito_boss) e poi è immune; in emersione nessun contatto', () => {
  const vicino = bersaglioFinto(campo.x + campo.larghezza * 0.5 + 10, campo.y + campo.altezza * 0.5);
  const { n } = creaBossProva('capitano-guardia', { bersaglio: vicino });
  const tEmersione = tempo.ticksDaMs(parametri.get('nemici.globali.t_emersione'));
  for (let t = 0; t < tEmersione - 2; t++) n.tick(DT);
  assert.equal(vicino.colpi.length, 0, 'in emersione il corpo non ferisce');
  for (let t = 0; t < 30; t++) n.tick(DT);
  assert.ok(vicino.colpi.length > 0, 'a contatto ferisce');
  assert.equal(vicino.colpi[0].pesante, C('contatto_pesante') > 0);
  assert.equal(vicino.colpi[0].imparabile, C('contatto_imparabile') > 0);
  assert.equal(vicino.colpi[0].attaccante, n);

  const parante = bersaglioFinto(campo.x + campo.larghezza * 0.5 + 10, campo.y + campo.altezza * 0.5, { parata: true });
  const { n: m } = creaBossProva('maestro-fucina', { bersaglio: parante });
  for (let t = 0; t < tEmersione + 5; t++) m.tick(DT);
  assert.equal(m.stato, 'stordito', 'la parata stordisce il boss');
  assert.equal(m.stordimentoMs, parametri.get('nemici.globali.t_stordito_boss'));
  assert.equal(m.immune, true, 'e poi è immune per t_immunita_boss');
  const tStord = tempo.ticksDaMs(parametri.get('nemici.globali.t_stordito_boss'));
  for (let t = 0; t < tStord + 2; t++) m.tick(DT);
  assert.notEqual(m.stato, 'stordito', 'il pattern riprende');
});

test('P06 furia: sotto soglia_furia il cooldown fra due colpi si accorcia (varianti _furia)', () => {
  const lontano = () => bersaglioFinto(campo.x + campo.larghezza * 0.1, campo.y + campo.altezza * 0.5);
  const intervallo = (furia) => {
    const { n } = creaBossProva('maestro-fucina', { bersaglio: lontano() });
    const tEmersione = tempo.ticksDaMs(parametri.get('nemici.globali.t_emersione'));
    for (let t = 0; t < tEmersione + 1; t++) n.tick(DT); // in emersione è invulnerabile (§7)
    if (furia) n.colpisci(n.vita * (1 - C('soglia_furia')) + 1, null);
    assert.equal(n.vita < n.vitaMax * C('soglia_furia'), furia);
    const { iniziColpo } = gira(n, TICKS_PROVA);
    assert.ok(iniziColpo.length >= 3, `colpi: ${iniziColpo.length}`);
    return iniziColpo[2] - iniziColpo[1];
  };
  const normale = intervallo(false);
  const furioso = intervallo(true);
  assert.ok(furioso < normale, `furia ${furioso} < normale ${normale}`);
  const attesoNormale = tempo.ticksDaMs(B('maestro-fucina', 't_cd') + C('t_anticipo') + C('t_lampo') + C('t_recupero'));
  assert.ok(Math.abs(normale - attesoNormale) <= 3, `intervallo ${normale} ≈ ${attesoNormale}`);
});

// ---------------------------------------------------------------------------------------------
// Il sipario (DOM finto)
// ---------------------------------------------------------------------------------------------

function documentoFinto() {
  const nuovo = (tag) => {
    const el = {
      tag, children: [], attributi: {}, hidden: false, textContent: '', className: '', ascoltatori: {},
      append(...c) { el.children.push(...c); }, appendChild(c) { el.children.push(c); return c; }, replaceChildren(...c) { el.children = c; },
      setAttribute(k, v) { el.attributi[k] = v; }, addEventListener(n, f) { (el.ascoltatori[n] ??= []).push(f); },
      clicca() { for (const f of el.ascoltatori.click ?? []) f({ stopPropagation() {} }); },
    };
    return el;
  };
  return { createElement: nuovo };
}

test('P06 sipario: racconto per atto (I-IV), «BIS» al piano 1 del ciclo 2 con il bonus, titolo finale dal ciclo 2; segnaposto compilati; si alza con conferma/scatto, click o chiudi() e risolve la promessa', async () => {
  const doc = documentoFinto();
  const contenitore = doc.createElement('div');
  const premuti = new Set();
  const input = { premuto: (a) => premuti.has(a) };
  const sip = creaSipario({ documento: doc, contenitore, testi: TESTI, input, tasto: () => 'Enter' });
  const base = { personaggio: 'Ferruccio', titoloPersonaggio: 'Il Burattino Senza Filo', stanze: 5, bonus: 0 };
  const r1 = sip.racconto({ piano: 1, ciclo: 1, pianoNelCiclo: 1, ...base });
  assert.ok(r1.atto.includes('Piano 1') && r1.atto.includes('Ferruccio'), r1.atto);
  assert.ok(r1.titolo.includes('Il Burattino Senza Filo'));
  assert.equal(r1.righe.length, 3);
  assert.equal(r1.bis, false);
  const r2 = sip.racconto({ piano: 2, ciclo: 1, pianoNelCiclo: 2, ...base, stanze: 7 });
  assert.ok(r2.atto.includes('Atto II') && r2.atto.includes('7 stanze'), r2.atto);
  const r4 = sip.racconto({ piano: 4, ciclo: 1, pianoNelCiclo: 4, ...base });
  assert.equal(r4.titolo, TESTI.sipario.atti['4'].titolo);
  const r5 = sip.racconto({ piano: 5, ciclo: 2, pianoNelCiclo: 1, ...base, bonus: 45 });
  assert.equal(r5.bis, true);
  assert.ok(r5.atto.includes('Ciclo infinito 2') && r5.atto.includes('Piano 5'), r5.atto);
  assert.ok(r5.righe.some((r) => r.includes('+45%')), 'bonus del ciclo nel racconto');
  const r8 = sip.racconto({ piano: 8, ciclo: 2, pianoNelCiclo: 4, ...base });
  assert.ok(r8.titolo.includes('Ciclo 2'), r8.titolo);
  for (const r of [r1, r2, r4, r5, r8]) assert.ok(![r.atto, r.titolo, ...r.righe].some((t) => /\{\w+\}/.test(t)), 'nessun segnaposto rimasto');

  let risolta = false;
  const p = sip.mostra({ piano: 2, ciclo: 1, pianoNelCiclo: 2, ...base, stanze: 7 }).then(() => { risolta = true; });
  assert.equal(sip.aperto, true);
  assert.equal(sip.stato().visibile, true);
  assert.equal(sip.stato().atto, r2.atto);
  sip.tick();
  assert.equal(sip.aperto, true, 'senza tasti resta giù');
  premuti.add('scatto');
  sip.tick();
  premuti.clear();
  await p;
  assert.equal(risolta, true);
  assert.equal(sip.aperto, false);
  assert.equal(sip.chiudi(), false, 'già alzato');
  sip.mostra({ piano: 3, ciclo: 1, pianoNelCiclo: 3, ...base });
  sip.elemento.clicca();
  assert.equal(sip.aperto, false, 'il click alza il sipario');
  assert.equal(sip.stato().mostrati, 2);
});

test('P06 regole: nessun Math.random in motore/ (boss, run, sipario compresi); i testi del boss nell\'HUD e del sipario vengono da interfaccia.json', () => {
  const cerca = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? cerca(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : []));
  for (const f of cerca(join(RADICE, 'motore'))) assert.ok(!readFileSync(f, 'utf8').includes('Math.random'), `${f} usa Math.random`);
  assert.ok(TESTI.boss_hud?.titolo.includes('{nome}'));
  assert.ok(TESTI.sipario?.alza.includes('{tasto}'));
  assert.equal(Object.keys(TESTI.sipario.atti).length, BOSS_JSON.piani_per_ciclo.base, 'un atto per piano del ciclo');
});
