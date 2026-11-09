/**
 * gioco/qa/audio.test.mjs — Storia P10: audio dinamico minimale (motore/audio/sintesi.js, motore/audio/eventi-audio.js,
 * attori/passi.js, interfaccia/audio.js) con un AudioContext FINTO che registra i nodi creati. I valori attesi sono letti
 * da `contenuti/parametri/audio.json` (cambiare un numero non rompe il test, cambiare la ricetta sì). Casi: JSON valido e
 * mappa completa; senza AudioContext nessun errore; ogni evento produce il grafo di nodi atteso con i parametri del JSON;
 * anti-affollamento (`gap_min_ms`); muto; contesto sospeso; passi dalla distanza percorsa; interruttore DOM finto;
 * regole del codice. Esecuzione: `node gioco/qa/audio.test.mjs` dalla radice.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { creaParametri, validaStatistiche } from '../motore/fondazione/parametri.js';
import { creaBus } from '../motore/fondazione/eventi.js';
import { creaSintesi, fabbricaPredefinita, NOMI_SUONI } from '../motore/audio/sintesi.js';
import { collegaEventiAudio, MAPPA_EVENTI } from '../motore/audio/eventi-audio.js';
import { creaPassi } from '../motore/attori/passi.js';
import { creaInterfacciaAudio } from '../motore/interfaccia/audio.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const leggi = (n) => JSON.parse(readFileSync(join(RADICE, 'contenuti', 'parametri', `${n}.json`), 'utf8'));
const AUDIO = leggi('audio');
const TESTI = JSON.parse(readFileSync(join(RADICE, 'contenuti', 'interfaccia.json'), 'utf8'));
const S = (nome, chiave) => AUDIO.suoni[nome][chiave].base;

async function parametri() {
  const p = creaParametri({ log: { error: () => {} } });
  const errori = await p.carica({ caricatore: leggi, statistiche: ['audio'], tabelle: ['input'] });
  assert.deepEqual(errori, []);
  return p;
}

/** Parametro automatizzato finto: registra ogni chiamata. */
function parametroFinto(valore = 0) {
  const eventi = [];
  return {
    get value() { return valore; },
    set value(v) { valore = v; eventi.push(['value', v]); },
    eventi,
    setValueAtTime: (v, t) => { eventi.push(['set', v, t]); },
    linearRampToValueAtTime: (v, t) => { eventi.push(['lin', v, t]); },
    exponentialRampToValueAtTime: (v, t) => { eventi.push(['exp', v, t]); },
  };
}

/** AudioContext finto: ogni `create*` registra un nodo in `nodi`. */
function contestoFinto({ stato = 'running', sampleRate = 48000 } = {}) {
  const ctx = {
    state: stato, currentTime: 0, sampleRate, destination: { tipo: 'destinazione' }, nodi: [], riprese: 0,
    resume() { ctx.riprese += 1; return Promise.resolve(); },
  };
  const nodo = (tipo, extra = {}) => {
    const n = {
      tipo, type: null, buffer: null, connessioni: [], avvii: [], arresti: [],
      gain: parametroFinto(1), frequency: parametroFinto(0), Q: parametroFinto(1),
      connect(d) { n.connessioni.push(d); }, start(t) { n.avvii.push(t); }, stop(t) { n.arresti.push(t); },
      ...extra,
    };
    ctx.nodi.push(n);
    return n;
  };
  ctx.createGain = () => nodo('gain');
  ctx.createOscillator = () => nodo('oscillatore');
  ctx.createBufferSource = () => nodo('sorgente');
  ctx.createBiquadFilter = () => nodo('filtro');
  ctx.createConvolver = () => nodo('convolver');
  ctx.createBuffer = (canali, n, sr) => { const dati = new Float32Array(n); return { canali, length: n, sampleRate: sr, getChannelData: () => dati }; };
  return ctx;
}

/** Sintetizzatore + bus + mappa, sul contesto finto già svegliato. */
async function scena({ stato = 'running', eBoss } = {}) {
  const p = await parametri();
  const ctx = contestoFinto({ stato });
  const sintesi = creaSintesi({ parametri: p, fabbrica: () => ctx, log: { error: () => {} } });
  const eventi = creaBus({ log: { error: () => { throw new Error('errore in un ascoltatore'); } } });
  const collegamento = collegaEventiAudio({ eventi, sintesi, parametri: p, eBoss });
  sintesi.sveglia();
  const daQui = () => ctx.nodi.length;
  const nuovi = (da) => ctx.nodi.slice(da);
  return { p, ctx, sintesi, eventi, collegamento, daQui, nuovi };
}
const oscillatori = (nodi) => nodi.filter((n) => n.tipo === 'oscillatore');
const filtri = (nodi) => nodi.filter((n) => n.tipo === 'filtro');
const freqIniziale = (n) => n.frequency.eventi.find((e) => e[0] === 'set')[1];
const freqFinale = (n) => n.frequency.eventi.find((e) => e[0] === 'exp')?.[1];

// ---------------------------------------------------------------------------------------------
// Contenuti
// ---------------------------------------------------------------------------------------------

test('A01: audio.json è un file di statistiche valido: ogni suono della mappa ha volume, durata, attacco e gap_min; master.volume in [0, 1]', () => {
  const { errori } = validaStatistiche('audio', JSON.parse(JSON.stringify(AUDIO)));
  assert.deepEqual(errori, []);
  assert.deepEqual(Object.keys(AUDIO.suoni).sort(), [...NOMI_SUONI].sort(), 'NOMI_SUONI ↔ audio.suoni');
  for (const nome of NOMI_SUONI) {
    for (const k of ['volume', 'durata_ms', 'attacco_ms', 'gap_min_ms']) assert.ok(k in AUDIO.suoni[nome], `${nome}.${k}`);
    assert.ok(S(nome, 'volume') >= 0 && S(nome, 'volume') <= 1);
  }
  assert.ok(AUDIO.master.volume.base > 0 && AUDIO.master.volume.max <= 1);
  // ogni voce della mappa punta a un suono esistente (le funzioni si provano con payload tipici)
  const prove = {
    'attore.passo': [{ tipo: 'ferruccio' }, { tipo: 'nemico' }], 'nemico.colpo': [{ id: 'b' }], 'economia.monete': [{ delta: 1 }, { delta: -1 }],
  };
  for (const [evento, voce] of Object.entries(MAPPA_EVENTI)) {
    const nomi = typeof voce === 'function' ? (prove[evento] ?? [{}]).map((x) => voce(x, { eBoss: () => true })) : [voce];
    for (const n of nomi) if (n !== null) assert.ok(NOMI_SUONI.includes(n), `${evento} → '${n}' sconosciuto`);
  }
  assert.equal(MAPPA_EVENTI['economia.monete']({ delta: -3 }), null, 'le monete perse non suonano');
  assert.equal(MAPPA_EVENTI['nemico.colpo']({ id: 'x' }, { eBoss: () => false }), null, 'il colpo di un nemico comune non è un tonfo');
  assert.equal(TESTI.audio.acceso.includes('{tasto}'), true);
  assert.deepEqual(leggi('input').tastiera.muto, ['KeyM']);
});

// ---------------------------------------------------------------------------------------------
// Degradazione senza AudioContext
// ---------------------------------------------------------------------------------------------

test('A02: senza AudioContext (Node) niente errori: fabbrica nulla, sveglia e suona false, tutti gli eventi passano in silenzio', async () => {
  assert.equal(fabbricaPredefinita({}), null);
  assert.equal(typeof AudioContext, 'undefined', 'in Node non c\'è Web Audio');
  const p = await parametri();
  const sintesi = creaSintesi({ parametri: p, fabbrica: fabbricaPredefinita() });
  assert.equal(sintesi.sveglia(), false);
  assert.equal(sintesi.suona('campana'), false);
  assert.equal(sintesi.pronto(), false);
  assert.deepEqual(sintesi.stato(), { disponibile: false, contesto: null, muto: false, volume: null });
  sintesi.collega({ finestra: null });
  sintesi.collega({});
  const eventi = creaBus({ log: { error: () => { throw new Error('errore in un ascoltatore'); } } });
  const c = collegaEventiAudio({ eventi, sintesi, parametri: p });
  for (const evento of Object.keys(MAPPA_EVENTI)) eventi.emit(evento, { tipo: 'ferruccio', delta: 2, id: 'b' });
  assert.deepEqual(c.suonati(), {});
  assert.throws(() => sintesi.suona('inesistente'), RangeError);
  // una fabbrica che lancia spegne l'audio senza propagare
  const rotta = creaSintesi({ parametri: p, fabbrica: () => { throw new Error('niente audio'); }, log: { error: () => {} } });
  assert.equal(rotta.sveglia(), false);
  assert.equal(rotta.stato().disponibile, false);
});

// ---------------------------------------------------------------------------------------------
// Mappa evento → suono con il contesto finto
// ---------------------------------------------------------------------------------------------

test('A03: sveglia crea il master con audio.master.volume collegato alla destinazione; gli ascoltatori dei gesti si tolgono da soli', async () => {
  const { ctx, sintesi } = await scena();
  assert.equal(ctx.nodi.length, 1);
  assert.equal(ctx.nodi[0].tipo, 'gain');
  assert.equal(ctx.nodi[0].gain.value, AUDIO.master.volume.base);
  assert.deepEqual(ctx.nodi[0].connessioni, [ctx.destination]);
  assert.equal(sintesi.pronto(), true);
  assert.equal(sintesi.stato().contesto, 'running');
  // finestra finta: al primo gesto il contesto è pronto e gli ascoltatori vengono rimossi
  const p = await parametri();
  const ctx2 = contestoFinto();
  const s2 = creaSintesi({ parametri: p, fabbrica: () => ctx2 });
  const ascoltatori = new Map();
  const finestra = { addEventListener: (n, fn) => ascoltatori.set(n, fn), removeEventListener: (n) => ascoltatori.delete(n) };
  s2.collega({ finestra });
  assert.ok(ascoltatori.has('keydown') && ascoltatori.has('pointerdown'));
  assert.equal(s2.stato().contesto, null, 'nessun contesto prima del gesto');
  ascoltatori.get('keydown')();
  assert.equal(s2.stato().contesto, 'running');
  assert.equal(ascoltatori.size, 0, 'ascoltatori rimossi');
});

test('A04: stanza.entrata → campana: tre seni (fondamentale, ×parziale_2, ×parziale_3) con il decadimento di durata_ms', async () => {
  const { ctx, eventi, collegamento, daQui, nuovi, sintesi } = await scena();
  const da = daQui();
  ctx.currentTime = 2;
  eventi.emit('stanza.entrata', { id: 'pd-n-01', tipo: 'normale', stato: 'non_visitata' });
  const osc = oscillatori(nuovi(da));
  assert.equal(osc.length, 3);
  assert.ok(osc.every((o) => o.type === 'sine'));
  const f = S('campana', 'freq_hz');
  assert.deepEqual(osc.map(freqIniziale), [f, f * S('campana', 'parziale_2'), f * S('campana', 'parziale_3')]);
  const gain = osc[0].connessioni[0];
  assert.equal(gain.tipo, 'gain');
  assert.deepEqual(gain.gain.eventi.map((e) => e[0]), ['set', 'lin', 'exp']);
  assert.equal(gain.gain.eventi[1][1], S('campana', 'volume'));
  assert.equal(gain.gain.eventi[1][2], 2 + S('campana', 'attacco_ms') / 1000);
  assert.equal(gain.gain.eventi[2][2], 2 + S('campana', 'durata_ms') / 1000);
  assert.equal(osc[1].connessioni[0].gain.eventi[1][1], S('campana', 'volume') * S('campana', 'volume_parziali'));
  assert.deepEqual(osc[0].avvii, [2]);
  assert.deepEqual(osc[0].arresti, [2 + S('campana', 'durata_ms') / 1000]);
  assert.equal(gain.connessioni[0], ctx.nodi[0], 'tutto passa dal master');
  assert.deepEqual(collegamento.suonati(), { campana: 1 });
  assert.equal(sintesi.emessi().campana, 1);
});

test('A05: attore.passo → «toc»: triangolo da freq_hz a freq_fine_hz più sbuffo passa-basso a filtro_hz; nemico → passo_nemico', async () => {
  const { ctx, eventi, daQui, nuovi, collegamento } = await scena();
  let da = daQui();
  eventi.emit('attore.passo', { id: 'ferruccio', tipo: 'ferruccio', x: 0, y: 0 });
  let n = nuovi(da);
  const osc = oscillatori(n);
  assert.equal(osc.length, 1);
  assert.equal(osc[0].type, 'triangle');
  assert.equal(freqIniziale(osc[0]), S('passo', 'freq_hz'));
  assert.equal(freqFinale(osc[0]), S('passo', 'freq_fine_hz'));
  const sorgenti = n.filter((x) => x.tipo === 'sorgente');
  assert.equal(sorgenti.length, 1);
  assert.equal(sorgenti[0].buffer.length, Math.round(ctx.sampleRate * AUDIO.rumore.durata_buffer_ms.base / 1000));
  const f = filtri(n);
  assert.equal(f.length, 1);
  assert.equal(f[0].type, 'lowpass');
  assert.equal(freqIniziale(f[0]), S('passo', 'filtro_hz'));
  assert.equal(f[0].connessioni[0].gain.eventi[1][1], S('passo', 'rumore_volume'));
  // il rumore è seminato: stesso buffer per il passo seguente, campioni in [-1, 1] e non tutti uguali
  const dati = sorgenti[0].buffer.getChannelData(0);
  assert.ok(dati.every((v) => v >= -1 && v <= 1) && new Set(dati.slice(0, 100)).size > 50);
  ctx.currentTime += 1;
  da = daQui();
  eventi.emit('attore.passo', { id: 'guardia#1', tipo: 'nemico', x: 0, y: 0 });
  n = nuovi(da);
  assert.equal(freqIniziale(oscillatori(n)[0]), S('passo_nemico', 'freq_hz'));
  assert.equal(n.find((x) => x.tipo === 'sorgente').buffer, sorgenti[0].buffer, 'buffer di rumore riusato');
  assert.deepEqual(collegamento.suonati(), { passo: 1, passo_nemico: 1 });
});

test('A06: fendente/affondo/sparo → sibilo passa-banda (filtro_hz → filtro_fine_hz, Q); colpo a segno quadra; colpo subito dente di sega; moneta, porta chiusa, attivo', async () => {
  const { ctx, eventi, daQui, nuovi, collegamento } = await scena();
  const casi = [
    ['ferruccio.fendente', {}, 'sibilo'], ['ferruccio.affondo', {}, 'sibilo'], ['ferruccio.sparo', {}, 'sibilo'],
    ['ferruccio.colpo', {}, 'colpo_a_segno'], ['ferruccio.danno', {}, 'colpo_subito'], ['economia.monete', { delta: 2 }, 'moneta'],
    ['economia.monete', { delta: -5 }, null], ['stanza.chiusa', {}, 'porta_chiusa'], ['attivo.usato', {}, 'attivo'],
  ];
  const forme = { colpo_a_segno: 'square', colpo_subito: 'sawtooth', moneta: 'sine', porta_chiusa: 'square', attivo: 'sine' };
  for (const [evento, payload, atteso] of casi) {
    ctx.currentTime += 5;
    const da = daQui();
    eventi.emit(evento, payload);
    const n = nuovi(da);
    if (atteso === null) { assert.equal(n.length, 0, `${evento}: niente`); continue; }
    if (atteso === 'sibilo') {
      const f = filtri(n);
      assert.equal(f.length, 1, evento);
      assert.equal(f[0].type, 'bandpass');
      assert.equal(freqIniziale(f[0]), S('sibilo', 'filtro_hz'));
      assert.equal(freqFinale(f[0]), S('sibilo', 'filtro_fine_hz'));
      assert.equal(f[0].Q.value, S('sibilo', 'q'));
      assert.equal(oscillatori(n).length, 0);
    } else {
      const osc = oscillatori(n);
      assert.equal(osc.length, 1, evento);
      assert.equal(osc[0].type, forme[atteso]);
      assert.equal(freqIniziale(osc[0]), S(atteso, 'freq_hz'));
      assert.equal(freqFinale(osc[0]), S(atteso, 'freq_fine_hz'));
      assert.equal(osc[0].connessioni[0].gain.eventi[1][1], S(atteso, 'volume'));
    }
  }
  assert.deepEqual(collegamento.suonati(), { sibilo: 3, colpo_a_segno: 1, colpo_subito: 1, moneta: 1, porta_chiusa: 1, attivo: 1 });
});

test('A07: esplosione e colpo di un boss → tonfo: rumore passa-basso in caduta più convolver con l\'impulso di riverbero_ms e coda a riverbero_volume; nemico comune → niente', async () => {
  const bersagli = [{ id: 'boss', boss: true }, { id: 'guardia', boss: false }];
  const { ctx, eventi, daQui, nuovi, collegamento } = await scena({ eBoss: (p) => Boolean(bersagli.find((b) => b.id === p?.id)?.boss) });
  let da = daQui();
  eventi.emit('nemico.esplosione', { x: 0, y: 0 });
  let n = nuovi(da);
  const f = filtri(n);
  assert.equal(f.length, 1);
  assert.equal(f[0].type, 'lowpass');
  assert.equal(freqIniziale(f[0]), S('tonfo', 'filtro_hz'));
  assert.equal(freqFinale(f[0]), S('tonfo', 'filtro_fine_hz'));
  const conv = n.filter((x) => x.tipo === 'convolver');
  assert.equal(conv.length, 1);
  assert.equal(conv[0].buffer.length, Math.round(ctx.sampleRate * S('tonfo', 'riverbero_ms') / 1000));
  const ir = conv[0].buffer.getChannelData(0);
  assert.ok(Math.abs(ir[ir.length - 1]) < Math.abs(ir[0]) + 0.5 && Math.abs(ir[ir.length - 1]) < 0.05, 'l\'impulso decade');
  const coda = conv[0].connessioni[0];
  assert.equal(coda.gain.value, S('tonfo', 'riverbero_volume'));
  assert.equal(coda.connessioni[0], ctx.nodi[0]);
  const secco = f[0].connessioni[0];
  assert.ok(secco.connessioni.includes(ctx.nodi[0]) && secco.connessioni.includes(conv[0]), 'il secco va al master e al convolver');
  ctx.currentTime += 1;
  da = daQui();
  eventi.emit('nemico.colpo', { id: 'guardia', esito: 'colpito' });
  assert.equal(nuovi(da).length, 0, 'un colpo comune non è un tonfo');
  eventi.emit('nemico.colpo', { id: 'boss', esito: 'colpito' });
  assert.equal(nuovi(da).filter((x) => x.tipo === 'convolver').length, 1);
  ctx.currentTime += 1;
  da = daQui();
  eventi.emit('nemico.esplosione', { x: 1, y: 1 });
  assert.equal(nuovi(da).filter((x) => x.tipo === 'convolver').length, 1);
  assert.deepEqual(collegamento.suonati(), { tonfo: 3 });
});

test('A08: anti-affollamento: lo stesso suono non si ripete entro gap_min_ms; dopo il gap sì; suoni diversi non si bloccano a vicenda', async () => {
  const { ctx, eventi, daQui, nuovi, collegamento } = await scena();
  const gap = S('passo', 'gap_min_ms');
  const da = daQui();
  for (let i = 0; i < 10; i++) eventi.emit('attore.passo', { tipo: 'ferruccio' });
  assert.equal(oscillatori(nuovi(da)).length, 1, 'dieci passi nello stesso istante → un solo toc');
  eventi.emit('attore.passo', { tipo: 'nemico' });
  assert.equal(oscillatori(nuovi(da)).length, 2, 'il passo del nemico è un altro suono');
  ctx.currentTime += (gap - 1) / 1000;
  eventi.emit('attore.passo', { tipo: 'ferruccio' });
  assert.equal(oscillatori(nuovi(da)).length, 2, 'prima del gap niente');
  ctx.currentTime += 2 / 1000;
  eventi.emit('attore.passo', { tipo: 'ferruccio' });
  assert.equal(oscillatori(nuovi(da)).length, 3, 'dopo il gap sì');
  assert.deepEqual(collegamento.suonati(), { passo: 2, passo_nemico: 1 });
});

test('A09: muto: il master va a zero e non nasce nessun nodo; riacceso torna a master.volume e suona; alternaMuto ritorna il nuovo stato', async () => {
  const { ctx, eventi, sintesi, daQui, nuovi } = await scena();
  assert.equal(sintesi.alternaMuto(), true);
  assert.equal(sintesi.muto, true);
  assert.equal(ctx.nodi[0].gain.value, 0);
  const da = daQui();
  eventi.emit('stanza.entrata', {});
  assert.equal(sintesi.suona('moneta'), false);
  assert.equal(nuovi(da).length, 0);
  assert.equal(sintesi.stato().muto, true);
  assert.equal(sintesi.alternaMuto(), false);
  assert.equal(ctx.nodi[0].gain.value, AUDIO.master.volume.base);
  ctx.currentTime += 1;
  eventi.emit('stanza.entrata', {});
  assert.equal(oscillatori(nuovi(da)).length, 3);
  // il muto impostato prima del contesto vale alla creazione del master
  const p = await parametri();
  const ctx2 = contestoFinto();
  const s2 = creaSintesi({ parametri: p, fabbrica: () => ctx2 });
  s2.impostaMuto(true);
  s2.sveglia();
  assert.equal(ctx2.nodi[0].gain.value, 0);
});

test('A10: contesto sospeso: suona non crea nodi e chiede resume; appena il contesto gira, suona', async () => {
  const { ctx, eventi, sintesi, daQui, nuovi } = await scena({ stato: 'suspended' });
  assert.equal(sintesi.pronto(), false);
  assert.ok(ctx.riprese >= 1, 'sveglia ha chiesto resume');
  const da = daQui();
  eventi.emit('stanza.entrata', {});
  assert.equal(nuovi(da).length, 0);
  assert.ok(ctx.riprese >= 2, 'suona su un contesto sospeso riprova a riprenderlo');
  ctx.state = 'running';
  eventi.emit('stanza.entrata', {});
  assert.equal(oscillatori(nuovi(da)).length, 3);
});

// ---------------------------------------------------------------------------------------------
// Passi e interruttore
// ---------------------------------------------------------------------------------------------

test('A11: passi.js: un attore.passo ogni lunghezza_px percorsi (cadenza = velocità), niente da fermo, da morto o dopo un salto di posizione; nemici con lunghezza_nemico_px', async () => {
  const p = await parametri();
  const eventi = creaBus();
  const ricevuti = [];
  eventi.on('attore.passo', (e) => ricevuti.push(e));
  const ferruccio = { x: 100, y: 100, stato: 'cammina' };
  const nemici = [{ id: 'g1', x: 0, y: 0, stato: 'insegue' }, { id: 'g2', x: 50, y: 50, stato: 'morto' }];
  const passi = creaPassi({ eventi, parametri: p, ferruccio, altri: () => nemici });
  const lF = AUDIO.passi.lunghezza_px.base;
  const lN = AUDIO.passi.lunghezza_nemico_px.base;
  passi.tick(); // prima fotografia
  const v = 3; // px per tick (valore del test)
  for (let i = 0; i < 100; i++) { ferruccio.x += v; nemici[0].y += v; nemici[1].x += v; passi.tick(); }
  const attesiF = Math.floor(100 * v / lF);
  const attesiN = Math.floor(100 * v / lN);
  assert.equal(ricevuti.filter((e) => e.tipo === 'ferruccio').length, attesiF);
  assert.equal(ricevuti.filter((e) => e.id === 'g1').length, attesiN);
  assert.equal(ricevuti.filter((e) => e.id === 'g2').length, 0, 'un nemico morto non cammina');
  assert.equal(passi.passi, attesiF + attesiN);
  assert.deepEqual(Object.keys(ricevuti[0]).sort(), ['id', 'tipo', 'x', 'y']);
  // velocità doppia → cadenza doppia
  const prima = passi.passi;
  for (let i = 0; i < 100; i++) { ferruccio.x += 2 * v; passi.tick(); }
  assert.ok(Math.abs((passi.passi - prima) - Math.floor(200 * v / lF)) <= 1);
  // fermo: nessun passo; salto di posizione (cambio di stanza): nessun passo
  const fermo = passi.passi;
  for (let i = 0; i < 50; i++) passi.tick();
  ferruccio.x += lF * 10;
  passi.tick();
  assert.equal(passi.passi, fermo);
  // morto: nessun passo anche se la posizione cambia
  ferruccio.stato = 'morto';
  for (let i = 0; i < 50; i++) { ferruccio.x += v; passi.tick(); }
  assert.equal(passi.passi, fermo);
  passi.azzera();
  assert.throws(() => creaPassi({ eventi, parametri: p }), TypeError);
});

/** Documento finto minimo per l'interruttore. */
function documentoFinto() {
  const elemento = (tag) => {
    const classi = new Set();
    const e = {
      tag, className: '', hidden: false, textContent: '', title: '', type: '', figli: [], ascoltatori: {},
      classList: { toggle: (c, on) => { if (on) classi.add(c); else classi.delete(c); }, contains: (c) => classi.has(c) },
      addEventListener: (n, fn) => { e.ascoltatori[n] = fn; },
      appendChild: (f) => { e.figli.push(f); },
    };
    return e;
  };
  return { createElement: elemento };
}

test('A12: interruttore DOM finto: visibile solo quando richiesto, testo acceso/spento da interfaccia.json con il tasto di input.json, click → muto', async () => {
  const p = await parametri();
  const sintesi = creaSintesi({ parametri: p, fabbrica: () => contestoFinto() });
  const documento = documentoFinto();
  const contenitore = documento.createElement('div');
  let inMenu = true;
  const ui = creaInterfacciaAudio({ documento, contenitore, testi: TESTI, sintesi, visibile: () => inMenu, tasto: () => p.get('input.tastiera.muto')[0] });
  assert.equal(contenitore.figli.length, 1);
  const b = contenitore.figli[0];
  assert.equal(b.hidden, true, 'nascosto prima del primo aggiorna');
  ui.aggiorna();
  assert.equal(b.hidden, false);
  assert.equal(b.textContent, TESTI.audio.acceso.replace('{tasto}', 'M'));
  assert.equal(b.title, TESTI.audio.titolo);
  b.ascoltatori.click();
  assert.equal(sintesi.muto, true);
  assert.equal(b.textContent, TESTI.audio.spento.replace('{tasto}', 'M'));
  assert.ok(b.classList.contains('muto'));
  assert.deepEqual(ui.stato(), { visibile: true, muto: true, testo: b.textContent });
  ui.clicca();
  assert.equal(sintesi.muto, false);
  inMenu = false;
  ui.aggiorna();
  assert.equal(ui.stato().visibile, false);
  assert.throws(() => creaInterfacciaAudio({ documento, contenitore, testi: {}, sintesi }), TypeError);
});

// ---------------------------------------------------------------------------------------------
// Regole del codice
// ---------------------------------------------------------------------------------------------

test('A13: regole del codice: nessun Math.random nei moduli della storia P10, JSDoc sulle funzioni esportate, nessun nome di suono fuori da NOMI_SUONI nelle ricette', () => {
  const moduli = ['motore/audio/sintesi.js', 'motore/audio/eventi-audio.js', 'motore/attori/passi.js', 'motore/interfaccia/audio.js'];
  for (const m of moduli) {
    const src = readFileSync(join(RADICE, m), 'utf8');
    assert.ok(!src.includes('Math.random'), `${m}: Math.random`);
    for (const match of src.matchAll(/^export function (\w+)/gm)) {
      const prima = src.slice(0, match.index).trimEnd();
      assert.ok(prima.endsWith('*/'), `${m}: ${match[1]} senza JSDoc`);
    }
  }
  const sintesi = readFileSync(join(RADICE, 'motore/audio/sintesi.js'), 'utf8');
  for (const m of sintesi.matchAll(/suoni\.\$\{nome\}|tocco\('(\w+)'|tono\('(\w+)'|sibilo\('(\w+)'|tonfo\('(\w+)'|campana\('(\w+)'/g)) {
    const nome = m.slice(1).find(Boolean);
    if (nome) assert.ok(NOMI_SUONI.includes(nome), `ricetta '${nome}' fuori da NOMI_SUONI`);
  }
  // avvio.js carica audio.json tra le statistiche e il bus è l'unico tramite (nessun modulo di stato importa l'audio)
  const avvio = readFileSync(join(RADICE, 'motore/avvio.js'), 'utf8');
  assert.ok(/'audio'/.test(avvio));
  for (const cartella of ['attori', 'mondo', 'oggetti']) {
    const src = readFileSync(join(RADICE, 'motore', cartella === 'attori' ? 'attori/combattimento.js' : `${cartella}/${cartella === 'mondo' ? 'stanza' : 'economia'}.js`), 'utf8');
    assert.ok(!src.includes('audio/'), `${cartella}: importa l'audio`);
  }
});
