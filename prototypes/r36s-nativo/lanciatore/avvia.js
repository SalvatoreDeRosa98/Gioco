#!/usr/bin/env node
'use strict';
/*
 * lanciatore/avvia.js — fa girare «Ferruccio — La Notte Immobile» fuori dal browser, in tempo reale.
 *
 * Uso:  node lanciatore/avvia.js [--gioco=FILE.html] [--dati=CARTELLA] [--impostazioni=FILE.json]
 *                                [--uscita=sdl|nessuna] [--fps=30] [--secondi=N]
 *
 * Scrive in <dati>/ferruccio.log un registro leggibile: versioni, schermo, controller, ogni errore e,
 * ogni 5 secondi, i fotogrammi al secondo coi tempi di logica+disegno e di copia a schermo.
 * I salvataggi stanno in <dati>/salvataggi.json (il localStorage del gioco).
 */
const fs = require('fs');
const path = require('path');

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
try { imp = JSON.parse(fs.readFileSync(fileImp, 'utf8')); } catch (err) { if (fs.existsSync(fileImp)) console.error('impostazioni.json illeggibile: ' + err.message); }
const fps = Math.max(10, Math.min(60, Number(arg.fps || imp.fps || 30)));
const uscitaVoluta = arg.uscita || imp.uscita || 'sdl';

log.riga('=== Ferruccio — La Notte Immobile · lanciatore nativo ===');
log.riga(`node ${process.version} · ${process.platform} ${process.arch} · glibc ${(process.report && process.report.getReport().header.glibcVersionRuntime) || '?'} · ${require('os').cpus().length} core «${(require('os').cpus()[0] || {}).model || '?'}» · RAM ${(require('os').totalmem() / 1048576).toFixed(0)} MB`);
log.riga(`gioco: ${fileHtml}`);
log.riga(`impostazioni: ${JSON.stringify(imp)} · fps voluti ${fps} · uscita ${uscitaVoluta}`);

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
browser = creaFintoBrowser({
  fileHtml, fileMemoria: path.join(dirDati, 'salvataggi.json'), log, audio,
  dirFont: arg.font ? path.resolve(arg.font) : primoEsistente([path.join(QUI, 'font'), path.join(QUI, '..', 'node_modules', 'dejavu-fonts-ttf', 'ttf'), '/usr/share/fonts/truetype/dejavu']),
  opzioniIniziali: imp.opzioniIniziali || null,
});
browser.carica();

if (uscitaVoluta === 'sdl') {
  try { uscita = require('./uscita-sdl').apriSdl({ browser, imp, log, esci }); } catch (err) { log.riga('ERRORE FATALE: SDL non si apre: ' + (err && err.stack || err)); esci('SDL non disponibile', 2); }
}

// --- ciclo ---------------------------------------------------------------------------------------------
const periodo = 1000 / fps;
const S = { n: 0, gioco: 0, copia: 0, max: 0, da: performance.now(), totale: 0, lenti: 0, lunghi: 0 };
const scadenza = arg.secondi ? performance.now() + Number(arg.secondi) * 1000 : Infinity;
let prossimo = performance.now();
function giro() {
  if (chiuso) return;
  const t0 = performance.now();
  if (uscita) uscita.ingressi(t0);
  browser.fotogramma(t0);
  const t1 = performance.now();
  if (uscita) uscita.mostra(browser.pixel());
  const t2 = performance.now();
  S.n++; S.totale++; S.gioco += t1 - t0; S.copia += t2 - t1; if (t2 - t0 > S.max) S.max = t2 - t0; if (t2 - t0 > periodo) S.lenti++;
  if (t2 - t0 > 250 && S.lunghi++ < 25) log.riga(`fotogramma lungo: il n. ${S.totale} è durato ${(t2 - t0).toFixed(0)} ms (logica+disegno ${(t1 - t0).toFixed(0)}, copia ${(t2 - t1).toFixed(0)}) · fase ${globalThis.__teatro ? globalThis.__teatro.fase : '?'} · immagini chieste finora ${browser.stato.immagini}`);
  if (t2 - S.da >= 5000) {
    const T = globalThis.__teatro; const R = T && T.interni && T.interni.statoRun; const st = R && R.stanzaCorrente;
    log.riga(`fps ${(S.n * 1000 / (t2 - S.da)).toFixed(1)} · logica+disegno ${(S.gioco / S.n).toFixed(1)} ms · copia a schermo ${(S.copia / S.n).toFixed(1)} ms · peggiore ${S.max.toFixed(0)} ms · oltre il tempo ${S.lenti}/${S.n}`
      + ` · fase ${T ? T.fase : '?'}${st ? ` · stanza ${st.tipo} con ${st.nemici.filter((n) => n.hp > 0).length} nemici` : ''} · memoria ${(process.memoryUsage().rss / 1048576).toFixed(0)} MB · errori ${browser.stato.errori}`);
    S.n = 0; S.gioco = 0; S.copia = 0; S.max = 0; S.lenti = 0; S.da = t2;
  }
  if (t2 > scadenza) { esci(`fine dei ${arg.secondi} secondi di prova`); return; }
  prossimo += periodo;
  const ora = performance.now();
  if (prossimo < ora - 100) prossimo = ora; // dopo un fotogramma lungo non si rincorre il tempo perso
  const attesa = prossimo - ora;
  if (attesa > 1.5) setTimeout(giro, attesa - 1); else setImmediate(giro);
}
if (!chiuso) { log.riga('avvio del ciclo'); giro(); }
