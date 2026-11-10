#!/usr/bin/env node
'use strict';
/*
 * lanciatore/avvia.js — fa girare «Ferruccio — La Notte Immobile» fuori dal browser, in tempo reale.
 *
 * Uso:  node lanciatore/avvia.js [--gioco=FILE.html] [--dati=CARTELLA] [--impostazioni=FILE.json]
 *                                [--uscita=sdl|nessuna] [--livello=bello|medio|veloce] [--fps=N] [--secondi=N]
 *
 * Scrive in <dati>/ferruccio.log un registro leggibile: macchina (CPU, regolatore di frequenza, memoria),
 * schermo, tasti, ogni errore e, ogni 5 secondi, i fotogrammi al secondo veri coi millisecondi medi di
 * logica / disegno / resa dei pixel / schermo e la scena in corso.
 * I salvataggi stanno in <dati>/salvataggi.json (il localStorage del gioco).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { risolviLivello } = require('./livelli');

const QUI = __dirname;
const arg = {};
for (const a of process.argv.slice(2)) { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); if (m) arg[m[1]] = m[2] === undefined ? true : m[2]; }

function primoEsistente(lista) { return lista.find((f) => f && fs.existsSync(f)) || lista[0]; }
const fileHtml = path.resolve(arg.gioco || primoEsistente([
  path.join(QUI, '..', 'gioco', 'teatro.html'),                                  // nel pacchetto per la console
  path.join(QUI, '..', '..', '..', 'gioco', 'teatro_marionette.html'),           // nel repository
]));
const dirDati = path.resolve(arg.dati || path.join(QUI, '..', 'dati'));
fs.mkdirSync(dirDati, { recursive: true });

// --- registro ------------------------------------------------------------------------------------------
const fileLog = path.join(dirDati, 'ferruccio.log');
try { if (fs.existsSync(fileLog)) fs.renameSync(fileLog, path.join(dirDati, 'ferruccio.precedente.log')); } catch (_) { /* si scrive sopra */ }
const log = {
  righe: 0,
  riga(testo) {
    if (this.righe++ > 6000) return; // un log che cresce senza fine riempie la scheda
    const r = `[${new Date().toISOString().slice(11, 23)}] ${testo}\n`;
    try { fs.appendFileSync(fileLog, r); } catch (_) { /* disco pieno o in sola lettura */ }
    if (arg.verboso || process.stdout.isTTY) process.stdout.write(r);
  },
};
for (const livello of ['error', 'warn']) {
  const originale = console[livello];
  console[livello] = (...a) => { log.riga(`console.${livello}: ${a.map((v) => (v && v.stack) || String(v)).join(' ')}`); if (process.stdout.isTTY) originale.apply(console, a); };
}

let imp = {};
const fileImp = path.resolve(arg.impostazioni || path.join(QUI, '..', 'impostazioni.json'));
try { imp = JSON.parse(fs.readFileSync(fileImp, 'utf8')); } catch (err) { if (fs.existsSync(fileImp)) console.error('impostazioni.json illeggibile (si usano i valori di fabbrica): ' + err.message); }
if (arg.livello) imp.livello = arg.livello;
const liv = risolviLivello(imp);
const fps = Math.max(5, Math.min(60, Number(arg.fps || liv.fps)));
const uscitaVoluta = arg.uscita || imp.uscita || 'sdl';

const { macchina, frequenzaMHz } = require('./macchina');

log.riga('=== Ferruccio — La Notte Immobile · lanciatore nativo v2 ===');
log.riga(`node ${process.version} · ${process.platform} ${process.arch} · glibc ${(process.report && process.report.getReport().header.glibcVersionRuntime) || '?'}`);
log.riga(macchina());
log.riga(`gioco: ${fileHtml}`);
log.riga(`livello «${liv.nome}»: palco ${Math.round(640 * liv.scala)}×${Math.round(360 * liv.scala)} (scala ${liv.scala}) · ${fps} fotogrammi al secondo voluti · tagli: ${Object.keys(liv.tagli).filter((k) => liv.tagli[k]).join(', ') || 'nessuno'} · ingrandimento ${liv.liscio ? 'liscio' : 'a pixel netti'}`);
log.riga(`impostazioni: ${JSON.stringify(imp)}`);

let browser = null; let uscita = null; let chiuso = false;
function esci(motivo, codice) {
  if (chiuso) return; chiuso = true;
  log.riga(`uscita: ${motivo}`);
  try { if (browser) browser.salva(); } catch (_) { /* niente */ }
  try { if (uscita) uscita.chiudi(); } catch (_) { /* niente */ }
  setTimeout(() => process.exit(codice || 0), 50);
}
process.on('uncaughtException', (err) => { if (browser && browser.stato.caricato) browser.erroreNonGestito(err); else { log.riga('ERRORE FATALE all\'avvio: ' + (err && err.stack || err)); esci('errore all\'avvio', 1); } });
process.on('unhandledRejection', (err) => { log.riga('promessa rifiutata: ' + (err && err.stack || err)); });
process.on('SIGINT', () => esci('SIGINT'));
process.on('SIGTERM', () => esci('SIGTERM'));

// --- audio (facoltativo, sperimentale) -------------------------------------------------------------------
let audio = null;
if (imp.audio) {
  try {
    const wa = require('node-web-audio-api');
    class Contesto extends wa.AudioContext { constructor(o) { super(Object.assign({ latencyHint: 'playback' }, o || {})); } }
    audio = { AudioContext: Contesto, OfflineAudioContext: wa.OfflineAudioContext };
    log.riga('audio: node-web-audio-api caricato (sperimentale)');
  } catch (err) { log.riga('audio: non disponibile, si resta muti (' + String(err.message).split('\n')[0] + ')'); }
} else log.riga('audio: spento (impostazioni.json → "audio": false)');

const { creaFintoBrowser } = require('./finto-browser');
const tCarica = performance.now();
browser = creaFintoBrowser({
  fileHtml, fileMemoria: path.join(dirDati, 'salvataggi.json'), log, audio,
  dirFont: arg.font ? path.resolve(arg.font) : primoEsistente([path.join(QUI, 'font'), path.join(QUI, '..', 'node_modules', 'dejavu-fonts-ttf', 'ttf'), '/usr/share/fonts/truetype/dejavu']),
  opzioniIniziali: imp.opzioniIniziali || null,
});
browser.carica();
browser.impostaScala(liv.scala);
browser.impostaTagli(liv.tagli);
log.riga(`gioco pronto in ${(performance.now() - tCarica).toFixed(0)} ms · tela ${browser.canvas.width}×${browser.canvas.height}`);

if (uscitaVoluta === 'sdl') {
  try { uscita = require('./uscita-sdl').apriSdl({ browser, imp, log, esci, liscio: liv.liscio }); } catch (err) { log.riga('ERRORE FATALE: SDL non si apre: ' + (err && err.stack || err)); esci('SDL non disponibile', 2); }
}

// --- cronometri: quanto pesa la logica e quanto il disegno ------------------------------------------------
const T = { logica: 0, passi: 0 };
if (typeof globalThis.passoLogico === 'function') {
  const pl = globalThis.passoLogico;
  globalThis.passoLogico = function () { const t = performance.now(); try { return pl.apply(this, arguments); } finally { T.logica += performance.now() - t; T.passi++; } };
}

// --- ciclo ---------------------------------------------------------------------------------------------
// La logica del gioco va a passo fisso (60 al secondo, fino a 5 passi per fotogramma): qui si decide solo
// ogni quanto DISEGNARE. Mai più di un disegno ogni `periodo` ms; se un disegno dura di più, il prossimo
// parte subito ma il ritardo non si accumula.
const periodo = 1000 / fps;
const S = { n: 0, gioco: 0, resa: 0, schermo: 0, max: 0, da: performance.now(), totale: 0, lenti: 0, lunghi: 0 };
const scadenza = arg.secondi ? performance.now() + Number(arg.secondi) * 1000 : Infinity;
let prossimo = performance.now();
function scena() {
  const G = globalThis.__teatro; if (!G) return '?';
  const R = G.interni && G.interni.statoRun; const st = R && R.stanzaCorrente;
  if (G.fase === 'in_gioco' && st) return `stanza ${st.tipo} con ${st.nemici.filter((n) => n.hp > 0).length} nemici (piano ${R.piano})`;
  return G.fase === 'menu_selezione' ? 'menu' : String(G.fase);
}
function giro() {
  if (chiuso) return;
  const t0 = performance.now();
  if (uscita) uscita.ingressi(t0);
  browser.fotogramma(t0);
  const t1 = performance.now();
  const pixel = uscita ? browser.pixel() : null;
  const t2 = performance.now();
  if (uscita) uscita.mostra(pixel, browser.canvas.width, browser.canvas.height);
  const t3 = performance.now();
  const d = t3 - t0;
  S.n++; S.totale++; S.gioco += t1 - t0; S.resa += t2 - t1; S.schermo += t3 - t2; if (d > S.max) S.max = d; if (d > periodo) S.lenti++;
  if (d > 400 && S.lunghi++ < 25) log.riga(`fotogramma lungo: il n. ${S.totale} è durato ${d.toFixed(0)} ms (gioco ${(t1 - t0).toFixed(0)}, resa ${(t2 - t1).toFixed(0)}, schermo ${(t3 - t2).toFixed(0)}) · ${scena()} · immagini chieste finora ${browser.stato.immagini}`);
  if (t3 - S.da >= 5000) {
    const n = S.n; const logica = T.logica / n; const disegno = S.gioco / n - logica;
    log.riga(`fps ${(n * 1000 / (t3 - S.da)).toFixed(1)} · a fotogramma: logica ${logica.toFixed(1)} ms (${(T.passi / n).toFixed(1)} passi) + disegno ${disegno.toFixed(1)} + resa dei pixel ${(S.resa / n).toFixed(1)} + schermo ${(S.schermo / n).toFixed(1)} = ${((S.gioco + S.resa + S.schermo) / n).toFixed(1)} ms · peggiore ${S.max.toFixed(0)} ms · oltre il tempo ${S.lenti}/${n}`
      + ` · ${scena()} · CPU ${frequenzaMHz() || '?'} MHz · memoria ${(process.memoryUsage().rss / 1048576).toFixed(0)} MB · errori ${browser.stato.errori}`);
    S.n = 0; S.gioco = 0; S.resa = 0; S.schermo = 0; S.max = 0; S.lenti = 0; S.da = t3; T.logica = 0; T.passi = 0;
  }
  if (t3 > scadenza) { esci(`fine dei ${arg.secondi} secondi di prova`); return; }
  const ora = performance.now();
  prossimo = Math.max(prossimo + periodo, ora);
  const attesa = prossimo - ora;
  if (attesa > 1.5) setTimeout(giro, attesa - 1); else setImmediate(giro);
}
if (!chiuso) { log.riga('avvio del ciclo'); giro(); }
