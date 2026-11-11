#!/usr/bin/env node
'use strict';
/*
 * lanciatore/avvia.js — fa girare «Ferruccio — La Notte Immobile» fuori dal browser, in tempo reale.
 *
 * Uso:  node lanciatore/avvia.js [--gioco=FILE.html] [--dati=CARTELLA] [--impostazioni=FILE.json]
 *                                [--uscita=sdl|nessuna] [--livello=auto|bello|medio|veloce] [--fps=20|30|40|60]
 *                                [--secondi=N] [--zavorra=MS]
 *
 * Il ciclo: la logica del gioco va a passo fisso (60 al secondo); qui si decide ogni quanto DISEGNARE.
 *  - Ritmo: i fotogrammi al secondo voluti, agganciati al refresh dello schermo se SDL lo aspetta (a 60 Hz:
 *    30 = uno ogni due refresh, 20 = uno ogni tre), altrimenti a orologio. Il ritardo non si accumula.
 *  - Qualità automatica ("livello": "auto"): misura il lavoro vero di ogni fotogramma e sale o scende fra gli
 *    scalini di livelli.js per tenere il ritmo; uno scalino per tipo di scena (menu, piazza, stanze).
 *  - Se un fotogramma dura più di 80 ms la logica recupera con passaggi senza disegno: il gioco non rallenta.
 *  - Nei menu fermi (scelta del burattino, pausa, diario) si ridisegna poche volte al secondo finché non si
 *    tocca un comando: sono centinaia di disegni identici.
 * Scrive in <dati>/ferruccio.log: macchina, schermo, tasti, errori, ogni cambio di scalino e, ogni 5 secondi,
 * fotogrammi al secondo veri, velocità di gioco, ms di logica / disegno / resa dei pixel / schermo, memoria.
 */
const fs = require('fs');
const path = require('path');
const { SCALINI, risolviLivello, creaRegolatore } = require('./livelli');
const { macchina, frequenzaMHz } = require('./macchina');

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
if (arg.fps) imp.fps = Number(arg.fps);
const liv = risolviLivello(imp);
const uscitaVoluta = arg.uscita || imp.uscita || 'sdl';
const scalaDi = (i) => (liv.scalaFissa !== null ? liv.scalaFissa : SCALINI[i].scala);
const tagliDi = (i) => Object.assign({}, SCALINI[i].tagli, liv.tagliFissi || {});

log.riga('=== Ferruccio — La Notte Immobile · lanciatore nativo v3 ===');
log.riga(`node ${process.version} · ${process.platform} ${process.arch} · glibc ${(process.report && process.report.getReport().header.glibcVersionRuntime) || '?'}`);
log.riga(macchina());
log.riga(`gioco: ${fileHtml}`);
log.riga(`qualità «${liv.nome}»${liv.auto ? ` (scalini da ${liv.primo} a ${liv.ultimo}, partenza ${liv.partenza}; scala minima ${liv.scalaMinima})` : ` (scalino ${liv.partenza})`} · ${liv.fps} fotogrammi al secondo voluti${liv.scalaFissa !== null ? ' · scala fissata a ' + liv.scalaFissa : ''}`);
log.riga(`impostazioni: ${JSON.stringify(imp)}`);

let browser = null; let uscita = null; let chiuso = false;
function esci(motivo, codice) {
  if (chiuso) return; chiuso = true;
  log.riga(`uscita: ${motivo}`);
  try { if (browser && arg.foto) browser.foto(path.resolve(arg.foto)); } catch (_) { /* solo per le prove */ }
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
  scala: scalaDi(liv.partenza),
  memoriaScritte: imp.memoriaScritte === true, immaginiRidotte: imp.immaginiRidotte !== false,
});
browser.carica();
let scalino = liv.partenza;
function applicaScalino(i, perche) {
  const scala = scalaDi(i), tagli = tagliDi(i);
  if (scala !== browser.stato.scala || !browser.stato.scalaApplicata) { browser.impostaScala(scala); browser.stato.scalaApplicata = true; }
  browser.impostaTagli(tagli);
  if (perche) log.riga(`qualità: scalino ${scalino} → ${i} (palco ${browser.canvas.width}×${browser.canvas.height}, tagli: ${Object.keys(tagli).filter((k) => tagli[k]).join(', ') || 'nessuno'}) · ${perche}`);
  scalino = i;
}
applicaScalino(scalino, null);
log.riga(`gioco pronto in ${(performance.now() - tCarica).toFixed(0)} ms · tela ${browser.canvas.width}×${browser.canvas.height} · immagini in arrivo: ${browser.immaginiInAttesa()}`);

if (uscitaVoluta === 'sdl') {
  try { uscita = require('./uscita-sdl').apriSdl({ browser, imp, log, esci, liscio: liv.liscio, fintoRefreshMs: arg['finto-refresh'] }); } catch (err) { log.riga('ERRORE FATALE: SDL non si apre: ' + (err && err.stack || err)); esci('SDL non disponibile', 2); }
}

// --- ritmo ---------------------------------------------------------------------------------------------
let periodo = 1000 / liv.fps; let agganciato = false; let refresh = 0;
if (uscita && !chiuso) {
  const s = uscita.calibraVsync(Buffer.alloc(browser.canvas.width * browser.canvas.height * 4), browser.canvas.width, browser.canvas.height);
  if (s.vsync) {
    agganciato = true; refresh = s.refreshMs;
    const ogni = Math.max(1, Math.round(periodo / refresh));
    periodo = ogni * refresh;
    log.riga(`ritmo: un fotogramma ogni ${ogni} refresh = ${(1000 / periodo).toFixed(1)} al secondo${Math.abs(1000 / periodo - liv.fps) > 1.5 ? ` (${liv.fps} non divide ${Math.round(1000 / refresh)}: si usa il divisore più vicino)` : ''}`);
  } else log.riga(`ritmo: ${liv.fps} fotogrammi al secondo a orologio`);
}
const regolatore = creaRegolatore(liv, periodo);

// --- cronometri: quanto pesa la logica ----------------------------------------------------------------------
const T = { logica: 0, passi: 0 };
if (typeof globalThis.passoLogico === 'function') {
  const pl = globalThis.passoLogico;
  globalThis.passoLogico = function () { const t = performance.now(); try { return pl.apply(this, arguments); } finally { T.logica += performance.now() - t; T.passi++; } };
}

// --- disegno saltabile: la logica può andare avanti senza ridisegnare ---------------------------------------
// Il gioco fa al massimo 5 passi di logica (83 ms) per fotogramma: sotto i 12 fotogrammi al secondo andrebbe
// al rallentatore. Si dà al gioco un orologio a scatti di 80 ms e disegnaFrame non fa niente: la velocità
// resta giusta. Lo stesso interruttore tiene fermo il disegno dei menu. Il tempo saltato va al disegno seguente.
const D = { salta: false, dt: 0 };
if (typeof globalThis.disegnaFrame === 'function') {
  const df = globalThis.disegnaFrame;
  globalThis.disegnaFrame = function (dtMs) {
    if (D.salta) { D.dt += Number(dtMs) || 0; return undefined; }
    const dt = (Number(dtMs) || 0) + D.dt; D.dt = 0;
    return df.call(this, dt);
  };
}
const PASSO_MAX_MS = 80; const RECUPERI_MAX = 5;
const zavorraMs = Number(arg.zavorra || 0); // solo per le prove sul PC: finge una macchina lenta

// --- che scena è ---------------------------------------------------------------------------------------------
function statoGioco() { const G = globalThis.__teatro; return G && G.interni ? G.interni.statoRun : null; }
/** Il tipo di scena per il regolatore: costano in modo molto diverso. */
function classeScena() { const G = globalThis.__teatro; const f = G ? G.fase : ''; return f === 'in_gioco' ? 'stanze' : f === 'hub' ? 'piazza' : 'menu'; }
/** Uno schermo fermo (menu dei burattini, pausa, diario): si può ridisegnare di rado finché non si tocca niente. */
function schermoFermo() { const G = globalThis.__teatro; const R = statoGioco(); if (!G || !R) return false; return G.fase === 'menu_selezione' || Boolean(R.pausa) || Boolean(R.diarioD); }
function descriviScena() {
  const G = globalThis.__teatro; if (!G) return '?';
  const R = statoGioco(); const st = R && R.stanzaCorrente;
  if (G.fase === 'in_gioco' && st) return `stanza ${st.tipo}${st.pulita ? ' ripulita' : ''} con ${st.nemici.filter((n) => n.hp > 0).length} nemici (piano ${R.piano})`;
  return G.fase === 'menu_selezione' ? 'menu' : String(G.fase);
}

// --- contatore dei fotogrammi al secondo, in basso a destra (impostazioni.json → "contatore") ---------------
const CIFRE = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
const contatore = { acceso: imp.contatore !== false && arg.contatore !== 'no', fps: 0, n: 0, da: performance.now(), fermo: false };
function disegnaContatore() {
  const cv = browser.canvas; const cx = cv.getContext('2d');
  const u = Math.max(1, Math.round(cv.width / 240));
  const testo = (contatore.fermo ? '--' : String(Math.min(99, Math.round(contatore.fps))).padStart(2, ' ')) + ' ' + String(scalino); // «--» = schermo tenuto fermo apposta
  const larg = testo.length * 4 * u; const x0 = cv.width - larg - 3 * u; const y0 = cv.height - 8 * u;
  const pieno = contatore.fps >= liv.fps * 0.9 ? '#7CFC8A' : contatore.fps >= liv.fps * 0.66 ? '#FFD34D' : '#FF6B5E';
  cx.save();
  cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
  cx.fillStyle = 'rgba(0,0,0,0.62)'; cx.fillRect(x0 - 2 * u, y0 - 2 * u, larg + 3 * u, 9 * u);
  for (let i = 0; i < testo.length; i++) {
    const c = testo.charCodeAt(i) - 48; if (c !== -3 && (c < 0 || c > 9)) continue;
    cx.fillStyle = i >= 3 ? '#9aa0a6' : (contatore.fermo ? '#9aa0a6' : pieno);
    const g = c === -3 ? '000000111000000' : CIFRE[c];
    for (let k = 0; k < 15; k++) if (g.charCodeAt(k) === 49) cx.fillRect(x0 + (i * 4 + (k % 3)) * u, y0 + Math.floor(k / 3) * u, u, u);
  }
  cx.restore();
}

// --- ciclo ---------------------------------------------------------------------------------------------
const S = { n: 0, gioco: 0, resa: 0, schermo: 0, max: 0, da: performance.now(), totale: 0, lenti: 0, lunghi: 0, recuperi: 0, fermi: 0, cadenza: {} };
const scadenza = arg.secondi ? performance.now() + Number(arg.secondi) * 1000 : Infinity;
let oraGioco = null;            // l'ultimo istante dato al gioco
let ultimaClasse = '';          // tipo di scena dell'ultimo fotogramma
let ultimoIngresso = performance.now(); let ultimoDisegno = 0; let ultimaPresentazione = 0;
let lavoroStimato = 8;          // media mobile di gioco + resa (ms): serve a partire in tempo per il refresh giusto
let prossimo = performance.now();
const menuFermoMs = 1000 / Math.max(1, Number(imp.menuFermoFps) || 4);
const tastoVero = browser.tasto; browser.tasto = function () { ultimoIngresso = performance.now(); return tastoVero.apply(this, arguments); };

function prenota(tFine) {
  const ora = performance.now();
  if (agganciato && ultimaPresentazione) {
    // si parte in modo che la presentazione cada sul refresh voluto: né uno prima né uno dopo
    // (il lavoro deve finire dentro l'ultimo refresh prima di quello voluto: si mira a metà di quell'intervallo)
    let partenza = ultimaPresentazione + periodo - lavoroStimato - refresh / 2;
    if (partenza < ora) partenza = ora;
    prossimo = partenza;
  } else prossimo = Math.max(prossimo + periodo, ora);
  const attesa = prossimo - ora;
  if (attesa > 1.5) setTimeout(giro, attesa - 1); else setImmediate(giro);
  if (tFine > scadenza) esci(`fine dei ${arg.secondi} secondi di prova`);
}

function giro() {
  if (chiuso) return;
  const t0 = performance.now();
  if (uscita) { uscita.ingressi(t0); if (uscita.stato.attivita) ultimoIngresso = t0; }
  // la logica recupera, senza disegno, il tempo che eccede il massimo di un fotogramma del gioco
  if (oraGioco !== null) {
    for (let k = 0; k < RECUPERI_MAX && t0 - oraGioco > PASSO_MAX_MS; k++) {
      oraGioco += PASSO_MAX_MS; S.recuperi++;
      D.salta = true; try { browser.fotogramma(oraGioco); } finally { D.salta = false; }
    }
  }
  oraGioco = t0;
  // schermo fermo e nessun comando da mezzo secondo: solo logica, niente disegno né schermo
  const fermo = imp.menuFermo !== false && schermoFermo() && t0 - ultimoIngresso > 500 && t0 - ultimoDisegno < menuFermoMs;
  if (fermo) {
    D.salta = true; try { browser.fotogramma(t0); } finally { D.salta = false; }
    S.fermi++; contatore.fermo = true; contatore.n = 0; contatore.da = t0;
    prossimo = Math.max(prossimo + periodo, performance.now()); ultimaPresentazione = 0;
    const attesa = prossimo - performance.now();
    if (attesa > 1.5) setTimeout(giro, attesa - 1); else setImmediate(giro);
    if (t0 > scadenza) esci(`fine dei ${arg.secondi} secondi di prova`);
    return;
  }
  // tipo di scena cambiato: ognuno ha il suo scalino
  const classe = classeScena();
  if (classe !== ultimaClasse) {
    ultimaClasse = classe; regolatore.cambiaScena(classe, t0);
    const voluto = regolatore.scalino(classe, t0);
    if (voluto !== scalino) applicaScalino(voluto, `si entra in: ${classe}`);
  }
  browser.fotogramma(t0);
  if (zavorraMs) { const fine = performance.now() + zavorraMs * browser.stato.scala * browser.stato.scala; while (performance.now() < fine) { /* attesa attiva, in proporzione ai pixel */ } }
  if (contatore.acceso) disegnaContatore();
  const t1 = performance.now();
  const pixel = uscita ? browser.pixel() : null;
  const t2 = performance.now();
  if (uscita) uscita.mostra(pixel, browser.canvas.width, browser.canvas.height);
  const t3 = performance.now();
  const d = t3 - t0; const lavoro = t2 - t0;
  const intervallo = ultimaPresentazione ? t3 - ultimaPresentazione : periodo;
  ultimaPresentazione = t3; ultimoDisegno = t3;
  lavoroStimato += (lavoro - lavoroStimato) * 0.2;
  if (agganciato) { const k = Math.max(1, Math.round(intervallo / refresh)); S.cadenza[k] = (S.cadenza[k] || 0) + 1; }
  S.n++; S.totale++; S.gioco += t1 - t0; S.resa += t2 - t1; S.schermo += t3 - t2; if (d > S.max) S.max = d; if (intervallo > periodo * 1.25) S.lenti++;
  contatore.n++; contatore.fermo = false;
  if (t3 - contatore.da >= 500) { contatore.fps = contatore.n * 1000 / (t3 - contatore.da); contatore.n = 0; contatore.da = t3; }
  if (d > 400 && S.lunghi++ < 25) log.riga(`fotogramma lungo: il n. ${S.totale} è durato ${d.toFixed(0)} ms (gioco ${(t1 - t0).toFixed(0)}, resa ${(t2 - t1).toFixed(0)}, schermo ${(t3 - t2).toFixed(0)}) · ${descriviScena()} · immagini in arrivo ${browser.immaginiInAttesa()}`);
  // qualità automatica
  const cambio = regolatore.nota(classe, lavoro, intervallo, t3);
  if (cambio) applicaScalino(cambio.a, cambio.motivo);
  if (t3 - S.da >= 5000) {
    const n = Math.max(1, S.n); const logica = T.logica / n; const disegno = S.gioco / n - logica; const sec = (t3 - S.da) / 1000;
    log.riga(`fps ${(S.n / sec).toFixed(1)} su ${(1000 / periodo).toFixed(0)} · scalino ${scalino} (${browser.canvas.width}×${browser.canvas.height}) · velocità di gioco ${Math.round(T.passi / sec / 60 * 100)}% · a fotogramma: logica ${logica.toFixed(1)} ms + disegno ${disegno.toFixed(1)} + resa dei pixel ${(S.resa / n).toFixed(1)} + schermo ${(S.schermo / n).toFixed(1)}${agganciato ? ' (con l\'attesa del refresh)' : ''} · in ritardo ${S.lenti}/${S.n} · peggiore ${S.max.toFixed(0)} ms`
      + `${agganciato ? ' · refresh per fotogramma: ' + Object.keys(S.cadenza).map((k) => `${k}×${S.cadenza[k]}`).join(' ') : ''}${S.fermi ? ` · schermo fermo per ${S.fermi} giri (nei menu si ridisegna di rado finché non si tocca un comando)` : ''}${S.recuperi ? ` · ${S.recuperi} recuperi` : ''} · ${descriviScena()} · CPU ${frequenzaMHz() || '?'} MHz · memoria ${(process.memoryUsage().rss / 1048576).toFixed(0)} MB · errori ${browser.stato.errori}`);
    S.n = 0; S.gioco = 0; S.resa = 0; S.schermo = 0; S.max = 0; S.lenti = 0; S.recuperi = 0; S.fermi = 0; S.cadenza = {}; S.da = t3; T.logica = 0; T.passi = 0;
  }
  prenota(t3);
}
// --- solo per le prove sul PC (--auto-entra): il gioco entra da solo in una stanza con 12 nemici e combatte ---
if (arg['auto-entra']) {
  const G = () => globalThis.__teatro; const premi = (c) => { tastoVero.call(browser, c, true); setTimeout(() => tastoVero.call(browser, c, false), 60); };
  let fase = 0;
  const passo = setInterval(() => {
    try {
      const T = G(); if (!T) return; const I = T.interni; const R = I.statoRun;
      if (T.fase === 'menu_selezione') { premi('Space'); return; }
      if (T.t4qa && T.t4qa.dialogo) { premi(T.t4qa.dialogo.scelta ? 'Digit1' : 'Space'); return; }
      if (T.fase === 'hub') { const g = T.t4qa.ingresso; I.player.x = g.x - 12; I.player.y = g.y; tastoVero.call(browser, 'KeyD', true); return; }
      if (T.fase === 'in_gioco' && fase === 0) {
        tastoVero.call(browser, 'KeyD', false); R.siparioAttivo = null;
        const st = R.mappa.stanze.filter((s) => s.tipo === 'normale' && !s.pulita && s.nemici.length)[0]; if (!st) return;
        I.entraInStanza(st, 'W'); R.siparioAttivo = null;
        const m = st.nemici[0]; while (st.nemici.length < 12) st.nemici.push(Object.assign({}, m, { id: 'auto' + st.nemici.length, x: 110 + st.nemici.length * 36, y: 110 + (st.nemici.length % 4) * 45 }));
        for (const n of st.nemici) n.hp = 1e9;
        fase = 1; log.riga('auto-entra: stanza con 12 nemici'); return;
      }
      if (fase >= 1) { I.player.invuln = 1e9; R.graziaIngressoC = 0; const d = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'][fase++ % 4]; for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) tastoVero.call(browser, k, k === d); }
    } catch (err) { log.riga('auto-entra: ' + err.message); }
  }, 350);
  if (passo.unref) passo.unref();
}

if (!chiuso) { log.riga('avvio del ciclo'); giro(); }
