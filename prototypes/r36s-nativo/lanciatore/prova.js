#!/usr/bin/env node
'use strict';
/*
 * lanciatore/prova.js — prova automatica e misura, senza schermo (orologio virtuale).
 *
 * Uso:  node lanciatore/prova.js [--gioco=FILE.html] [--uscita=CARTELLA] [--misura] [--fotogrammi=600] [--sdl]
 *
 *  1. PROVA: menu → Spazio → hub di Piazza Dante → ingresso del piano 1 → stanza di combattimento, salvando
 *     un PNG del canvas a ogni tappa. Esce con 1 se una tappa non si raggiunge o se il gioco segnala errori.
 *  2. MISURA (--misura): tempo per fotogramma (logica, disegno, copia) in più scene, con gli effetti accesi
 *     e spenti, a 60 e a 30 fotogrammi al secondo (a 30 il gioco fa due passi di logica per fotogramma).
 *     Con --sdl la copia passa davvero da SDL (driver video «dummy», resa software).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const QUI = __dirname;
const arg = {};
for (const a of process.argv.slice(2)) { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); if (m) arg[m[1]] = m[2] === undefined ? true : m[2]; }
// --console: la MISURA SULLA CONSOLE (FerruccioMisura.sh). Schermo vero, pochi fotogrammi, il gioco si gioca
// da solo per qualche minuto e tutto finisce in <dati>/misura.log; niente foto.
const CONSOLE = Boolean(arg.console);
if (CONSOLE) { arg.livelli = true; arg.zitto = true; }
const fileHtml = path.resolve(arg.gioco || [path.join(QUI, '..', 'gioco', 'teatro.html'), path.join(QUI, '..', '..', '..', 'gioco', 'teatro_marionette.html')].find((f) => fs.existsSync(f)));
const dirDati = path.resolve(arg.dati || path.join(QUI, '..', 'dati'));
const dirUscita = CONSOLE ? dirDati : path.resolve(arg.uscita || path.join(QUI, '..', 'uscita'));
fs.mkdirSync(dirUscita, { recursive: true });
const N = Number(arg.fotogrammi || 600);
const { LIVELLI } = require('./livelli');
const { macchina, frequenzaMHz } = require('./macchina');
if (CONSOLE) {
  const f = path.join(dirDati, 'misura.log');
  try { fs.writeFileSync(f, ''); } catch (_) { /* sola lettura */ }
  const scrivi = (...a) => { const r = a.map((v) => (v && v.stack) || String(v)).join(' '); try { fs.appendFileSync(f, r + '\n'); } catch (_) { /* niente */ } if (process.stdout.isTTY) process.stdout.write(r + '\n'); };
  console.log = scrivi; console.error = scrivi; console.warn = scrivi;
  setTimeout(() => { console.log('tempo massimo (12 minuti) superato: la misura si ferma qui'); process.exit(0); }, 12 * 60000).unref();
  process.on('uncaughtException', (err) => { console.log('ERRORE: ' + (err && err.stack || err)); });
}

const righeLog = [];
const log = { riga(t) { righeLog.push(t); if (!arg.zitto || CONSOLE) console.log('  · ' + t.split('\n').slice(0, 4).join('\n    ')); } };
const orologio = { t: 1000 };
const ms = () => Number(process.hrtime.bigint()) / 1e6;

const fileMemoria = path.join(os.tmpdir(), `ferruccio-prova-${process.pid}.json`);
const { creaFintoBrowser } = require('./finto-browser');
const tAvvio = ms();
const browser = creaFintoBrowser({
  fileHtml, fileMemoria, log, orologio, filtroNero: !arg['senza-filtro-nero'],
  dirFont: [path.join(QUI, 'font'), path.join(QUI, '..', 'node_modules', 'dejavu-fonts-ttf', 'ttf'), '/usr/share/fonts/truetype/dejavu'].find((d) => fs.existsSync(d)),
});
browser.carica();
const msCaricamento = ms() - tAvvio;

const cedi = () => new Promise((r) => setImmediate(r));
const PASSO = 1000 / 60;
// Sulla console, per arrivare alle scene, si disegna un fotogramma ogni 5 passi di logica (il massimo che il
// gioco fa in un fotogramma) e lo si mostra: si vede il gioco che cammina da solo e non si spreca tempo.
const PASSI_PER_DISEGNO = CONSOLE ? 5 : 1;
async function passo(n, dt) {
  const quanti = dt ? (n || 1) : Math.ceil((n || 1) / PASSI_PER_DISEGNO);
  for (let i = 0; i < quanti; i++) { orologio.t += dt || PASSO * PASSI_PER_DISEGNO; browser.fotogramma(orologio.t); if (CONSOLE) copia(); if (i % 6 === 5) await cedi(); }
  await cedi();
}
async function premi(code, fotogrammi) { browser.tasto(code, true); await passo(fotogrammi || 3); browser.tasto(code, false); await passo(2); }
const T = () => globalThis.__teatro;
const esiti = [];
const prima = []; // misure prese strada facendo (menu, hub)
const ablazioni = [];
function tappa(nome, ok, extra) { esiti.push({ nome, ok: Boolean(ok), extra }); console.log(`${ok ? 'OK  ' : 'FALLITO'} ${nome}${extra ? ' — ' + extra : ''}`); }
function foto(nome) { if (CONSOLE) return ''; const f = browser.foto(path.join(dirUscita, nome + '.png')); console.log('     foto ' + f); return f; }

/** Colori diversi in una griglia di campioni: un fotogramma «vero» ne ha tanti, uno vuoto uno solo. */
function coloriDiversi() {
  const d = browser.pixel(); const visti = new Set();
  for (let y = 4; y < 360; y += 8) for (let x = 4; x < 640; x += 8) { const i = (y * 640 + x) * 4; visti.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]); }
  return visti.size;
}

async function arrivaAlPiano() {
  await passo(90);
  tappa('menu di selezione', T().fase === 'menu_selezione' && coloriDiversi() > 50, `fase ${T().fase}, ${coloriDiversi()} colori`);
  foto('01-menu');
  if (arg.misura) prima.push(await misura('menu (tre burattini in ombra, effetti accesi)', 90, PASSO * 2, null));
  if (arg.ablazione) ablazioni.push(await ablazione('menu', null, 60));
  if (arg.livelli) await giroLivelli('menu', 'menu', null);
  await premi('Space');
  await passo(40);
  for (let i = 0; i < 80 && T().t4qa && T().t4qa.dialogo; i++) await premi(T().t4qa.dialogo.scelta ? 'Digit1' : 'Space');
  await passo(90);
  tappa('hub di Piazza Dante', T().fase === 'hub' && coloriDiversi() > 50, `fase ${T().fase}, ${coloriDiversi()} colori`);
  foto('02-hub');
  if (arg.misura) prima.push(await misura('hub di Piazza Dante (effetti accesi)', 90, PASSO * 2, null));
  if (arg.ablazione) ablazioni.push(await ablazione('hub di Piazza Dante', null, 60));
  if (arg.livelli) await giroLivelli('hub di Piazza Dante', 'hub', null);
  for (let giro = 0; giro < 6 && T().fase === 'hub'; giro++) {
    for (let i = 0; i < 80 && T().t4qa.dialogo; i++) await premi(T().t4qa.dialogo.scelta ? 'Digit1' : 'Space');
    const g = T().t4qa.ingresso; const P = T().interni.player;
    P.x = g.x - 40; P.y = g.y;
    browser.tasto('KeyD', true); await passo(60); browser.tasto('KeyD', false); await passo(10);
  }
  await premi('Space'); // il sipario del piano
  await passo(120);
  const R = T().interni.statoRun;
  tappa('ingresso nel piano 1', T().fase === 'in_gioco' && R.piano === 1, `fase ${T().fase}, piano ${R.piano}, stanza ${T().stanza}`);
  R.siparioAttivo = null;
  await passo(30);
  foto('03-piano1-stanza-iniziale');
}

function stanzaDiCombattimento() {
  const I = T().interni; const R = I.statoRun;
  const st = R.mappa.stanze.filter((s) => s.tipo === 'normale' && !s.pulita && s.nemici.length).sort((a, b) => b.nemici.length - a.nemici.length)[0];
  if (!st) return null;
  I.entraInStanza(st, 'W');
  R.siparioAttivo = null;
  return st;
}

/** Riempie la stanza corrente fino a `quanti` nemici (cloni del primo, come tools/qa-teatro-ribalta.js) che non muoiono. */
function riempi(quanti) {
  const st = T().interni.statoRun.stanzaCorrente; const modello = st.nemici[0];
  while (st.nemici.length < quanti) st.nemici.push(Object.assign({}, modello, { id: 'prova' + st.nemici.length, x: 110 + st.nemici.length * 36, y: 110 + (st.nemici.length % 4) * 45 }));
  for (const n of st.nemici) { n.hp = 1e9; if ('hpMax' in n) n.hpMax = 1e9; }
  return st.nemici.length;
}

// --- misura ----------------------------------------------------------------------------------------------
let schermo = null; // (pixel, l, a) → mostra a schermo; null = si leggono solo i pixel
const tCopia = { resa: 0, schermo: 0 };
let copia = () => { const t = ms(); const px = browser.pixel(); const t1 = ms(); if (schermo) schermo(px, browser.canvas.width, browser.canvas.height); tCopia.resa += t1 - t; tCopia.schermo += ms() - t1; };
let nomeCopia = 'canvas.data() (lettura dei pixel, senza schermo)';
if (arg.sdl) {
  process.env.SDL_VIDEODRIVER = process.env.SDL_VIDEODRIVER || 'dummy';
  process.env.SDL_AUDIODRIVER = process.env.SDL_AUDIODRIVER || 'dummy';
  const sdl = require('@kmamal/sdl');
  const fin = sdl.video.createWindow({ title: 'misura', width: 640, height: 480, vsync: false });
  const rett = { x: 0, y: 60, width: 640, height: 360 };
  schermo = (px, l, a) => { fin.render(l, a, l * 4, 'rgba32', px, { scaling: l === 640 ? 'nearest' : 'linear', dstRect: rett }); };
  nomeCopia = `canvas.data() + SDL render (driver «${sdl.info.drivers.video.current}», accelerata ${fin.accelerated})`;
}

if (CONSOLE && !arg['senza-schermo']) {
  let imp = {}; try { imp = JSON.parse(fs.readFileSync(path.join(QUI, '..', 'impostazioni.json'), 'utf8')); } catch (_) { /* valori di fabbrica */ }
  try {
    const uscita = require('./uscita-sdl').apriSdl({ browser, imp, log, liscio: true, esci: (m) => { console.log('misura interrotta: ' + m); process.exit(0); } });
    schermo = (px, l, a) => { uscita.ingressi(ms()); uscita.mostra(px, l, a); };
    nomeCopia = 'schermo vero (SDL)';
  } catch (err) { console.log('SDL non si apre, si misura senza schermo: ' + (err && err.message)); }
}

const tempi = { logica: 0, disegno: 0 };
function agganciaCronometri() {
  const G = globalThis;
  const pl = G.passoLogico; G.passoLogico = function () { const t = ms(); try { return pl.apply(this, arguments); } finally { tempi.logica += ms() - t; } };
  const df = G.disegnaFrame; G.disegnaFrame = function () { const t = ms(); try { return df.apply(this, arguments); } finally { tempi.disegno += ms() - t; } };
}
const statistiche = (v) => { const s = v.slice().sort((a, b) => a - b); const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))]; return { media: v.reduce((a, b) => a + b, 0) / v.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: s[s.length - 1] }; };

/**
 * Misura `n` fotogrammi con passo `dt` (16,67 = 60 fps; 33,33 = 30 fps con due passi di logica).
 * `azione(i)` muove il giocatore e tiene viva la scena.
 */
async function misura(nome, n, dt, azione, riscaldamento) {
  for (let i = 0; i < (riscaldamento === undefined ? 120 : riscaldamento); i++) { if (azione) azione(i); orologio.t += dt; browser.fotogramma(orologio.t); copia(); if (i % 30 === 29) await cedi(); } // riscaldamento
  const tot = []; const cop = []; tempi.logica = 0; tempi.disegno = 0; let colpi = 0; let nemici = 0; tCopia.resa = 0; tCopia.schermo = 0;
  for (let i = 0; i < n; i++) {
    if (azione) azione(i);
    orologio.t += dt;
    const t0 = ms(); browser.fotogramma(orologio.t); const t1 = ms(); copia(); const t2 = ms();
    tot.push(t1 - t0); cop.push(t2 - t1);
    const R = T().interni.statoRun; const st = R.stanzaCorrente && T().fase === 'in_gioco' ? R.stanzaCorrente : null;
    colpi += (R.proiettili ? R.proiettili.length : 0) + (R.proiettiliNemici ? R.proiettiliNemici.length : 0);
    nemici += st ? st.nemici.filter((x) => x.hp > 0).length : 0;
    if (i % 30 === 29) await cedi();
  }
  const s = statistiche(tot); const c = statistiche(cop);
  const r = { scena: nome, fps: Math.round(1000 / dt), fotogrammi: n, giocoMedia: s.media, giocoP50: s.p50, giocoP95: s.p95, giocoP99: s.p99, giocoMax: s.max, logicaMedia: tempi.logica / n, disegnoMedia: tempi.disegno / n, copiaMedia: c.media, resaMedia: tCopia.resa / n, schermoMedia: tCopia.schermo / n, totaleMedia: s.media + c.media, totaleP95: s.p95 + c.p95, nemici: nemici / n, colpi: colpi / n, fase: T().fase };
  if (!zittaMisura) console.log(`${nome.padEnd(46)} ${String(r.fps).padStart(2)} fps | logica+disegno ${s.media.toFixed(2)} ms (p95 ${s.p95.toFixed(2)}, max ${s.max.toFixed(1)}) = logica ${r.logicaMedia.toFixed(2)} + disegno ${r.disegnoMedia.toFixed(2)} | copia ${c.media.toFixed(2)} | nemici ${r.nemici.toFixed(1)} colpi ${r.colpi.toFixed(1)}`);
  return r;
}

// --- ablazione: quanto costa davvero ogni tipo di disegno ---------------------------------------------
// Il canvas disegna in differita (il lavoro vero avviene quando si leggono i pixel), quindi cronometrare i
// metodi non basta: qui si SALTA un tipo di operazione alla volta e si guarda di quanto scende il tempo
// totale del fotogramma. In più si contano chiamate e pixel toccati (quello che pesa su una CPU lenta).
const AB = { salta: null, conti: null, installata: false };
function installaAblazione() {
  if (AB.installata) return; AB.installata = true;
  const proto = Object.getPrototypeOf(browser.canvas.getContext('2d'));
  const eTela = (o) => Boolean(o) && typeof o.getContext === 'function';
  const pieno = (cx) => typeof cx.fillStyle === 'string';
  const classi = {
    drawImage: (cx, a) => (eTela(a[0]) ? 'drawImage da una tela' : 'drawImage da una Image'),
    fill: (cx) => (pieno(cx) ? 'fill a tinta unita' : 'fill con sfumatura'),
    fillRect: (cx) => (pieno(cx) ? 'fillRect a tinta unita' : 'fillRect con sfumatura'),
    stroke: () => 'stroke / strokeRect', strokeRect: () => 'stroke / strokeRect',
    fillText: () => 'testo (fillText, strokeText)', strokeText: () => 'testo (fillText, strokeText)',
    clearRect: () => 'clearRect',
  };
  const det = (cx) => { const m = cx.getTransform(); return Math.abs(m.a * m.d - m.b * m.c); };
  const punto = (cx, x, y) => { const m = cx.getTransform(); const X = m.a * x + m.c * y + m.e, Y = m.b * x + m.d * y + m.f; const b = cx.bbProfilo || (cx.bbProfilo = [1e9, 1e9, -1e9, -1e9]); if (X < b[0]) b[0] = X; if (Y < b[1]) b[1] = Y; if (X > b[2]) b[2] = X; if (Y > b[3]) b[3] = Y; };
  const tracciato = {
    beginPath(cx) { cx.bbProfilo = [1e9, 1e9, -1e9, -1e9]; },
    moveTo(cx, a) { punto(cx, a[0], a[1]); }, lineTo(cx, a) { punto(cx, a[0], a[1]); },
    quadraticCurveTo(cx, a) { punto(cx, a[0], a[1]); punto(cx, a[2], a[3]); },
    bezierCurveTo(cx, a) { punto(cx, a[0], a[1]); punto(cx, a[2], a[3]); punto(cx, a[4], a[5]); },
    arc(cx, a) { punto(cx, a[0] - a[2], a[1] - a[2]); punto(cx, a[0] + a[2], a[1] + a[2]); },
    ellipse(cx, a) { const r = Math.max(a[2], a[3]); punto(cx, a[0] - r, a[1] - r); punto(cx, a[0] + r, a[1] + r); },
    rect(cx, a) { punto(cx, a[0], a[1]); punto(cx, a[0] + a[2], a[1] + a[3]); },
    roundRect(cx, a) { punto(cx, a[0], a[1]); punto(cx, a[0] + a[2], a[1] + a[3]); },
  };
  for (const [nome, f] of Object.entries(tracciato)) { const orig = proto[nome]; if (typeof orig !== 'function') continue; proto[nome] = function () { if (AB.conti) f(this, arguments); return orig.apply(this, arguments); }; }
  const area = (nome, cx, a) => {
    const L = cx.canvas.width, A = cx.canvas.height;
    if (nome === 'drawImage') { const w = a.length >= 9 ? a[7] : a.length >= 5 ? a[3] : a[0].width; const h = a.length >= 9 ? a[8] : a.length >= 5 ? a[4] : a[0].height; return Math.min(L * A, Math.abs(w * h) * det(cx)); }
    if (nome === 'fillRect' || nome === 'strokeRect' || nome === 'clearRect') return Math.min(L * A, Math.abs(a[2] * a[3]) * det(cx));
    if (nome === 'fill' || nome === 'stroke') { const b = cx.bbProfilo; if (!b || b[2] < b[0]) return 0; const x0 = Math.max(0, b[0]), y0 = Math.max(0, b[1]), x1 = Math.min(L, b[2]), y1 = Math.min(A, b[3]); return Math.max(0, x1 - x0) * Math.max(0, y1 - y0); }
    return 0;
  };
  for (const [nome, classe] of Object.entries(classi)) {
    const orig = proto[nome];
    proto[nome] = function () {
      const c = classe(this, arguments);
      if (AB.conti) {
        const v = AB.conti[c] || (AB.conti[c] = { n: 0, px: 0, pxSorgente: 0, sulPalco: 0 });
        v.n++; v.px += area(nome, this, arguments);
        if (this.canvas === browser.canvas) v.sulPalco++;
        if (nome === 'drawImage' && eTela(arguments[0])) v.pxSorgente += arguments[0].width * arguments[0].height;
        // i disegni grandi (più di 15.000 pixel): chi li chiede? (prime funzioni del gioco nella pila)
        const ar = area(nome, this, arguments);
        if (ar > 15000 && AB.grandi) {
          const pila = new Error('p').stack.split('\n').slice(2, 9).map((r) => (/at (\S+) /.exec(r) || [])[1]).filter((f) => f && !/^(Object\.|proto\.|CanvasRenderingContext2D|new |async)/.test(f)).slice(0, 3).join(' < ');
          const k = `${nome}${this.canvas === browser.canvas ? '' : ' [su tela fuori schermo]'} · ${pila}`;
          const g = AB.grandi[k] || (AB.grandi[k] = { n: 0, px: 0 }); g.n++; g.px += ar;
        }
      }
      if (AB.salta && (AB.salta === 'tutto' || AB.salta === c)) return undefined;
      return orig.apply(this, arguments);
    };
  }
}
async function ablazione(scena, azione, fot) {
  installaAblazione();
  const n = fot || 100; const dt = PASSO * 2;
  const media = async (salta) => { AB.salta = salta; zittaMisura = true; try { const r = await misura('', n, dt, azione, CONSOLE && n < 60 ? 3 : 20); return r.totaleMedia; } finally { AB.salta = null; zittaMisura = false; } };
  AB.conti = {}; AB.grandi = {}; const quanti = CONSOLE ? 10 : 30;
  for (let i = 0; i < quanti; i++) { if (azione) azione(i); orologio.t += dt; browser.fotogramma(orologio.t); copia(); }
  const conti = AB.conti; AB.conti = null;
  const grandi = Object.entries(AB.grandi).sort((x, y) => y[1].px - x[1].px).slice(0, 14); AB.grandi = null;
  console.log(`\n-- DISEGNI GRANDI · ${scena} (pixel toccati a fotogramma; 640×360 = 230.400)`);
  for (const [k, g] of grandi) console.log(`   ${String(Math.round(g.px / quanti)).padStart(8)} px  ×${(g.n / quanti).toFixed(1).padStart(5)}  ${k.slice(0, 150)}`);
  const base = (await media(null) + await media(null)) / 2;
  const nulla = await media('tutto');
  console.log(`\n-- ABLAZIONE · ${scena} · fotogramma intero ${base.toFixed(2)} ms · senza nessun disegno ${nulla.toFixed(2)} ms (logica, JavaScript, lettura dei pixel)`);
  console.log('   tipo di disegno                      chiamate/fot  di cui sul palco   Mpx toccati/fot   Mpx di tele sorgente   ms tolti saltandolo');
  const righe = [];
  for (const c of Object.keys(conti).sort()) { const t = await media(c); righe.push({ c, v: conti[c], tolti: base - t }); }
  righe.sort((a, b) => b.tolti - a.tolti);
  for (const r of righe) console.log(`   ${r.c.padEnd(34)} ${(r.v.n / quanti).toFixed(1).padStart(10)} ${(r.v.sulPalco / quanti).toFixed(1).padStart(14)} ${(r.v.px / quanti / 1e6).toFixed(3).padStart(17)} ${(r.v.pxSorgente / quanti / 1e6).toFixed(3).padStart(20)} ${r.tolti.toFixed(2).padStart(18)}`);
  return { scena, base, nulla, righe: righe.map((r) => ({ tipo: r.c, chiamate: r.v.n / quanti, mpx: r.v.px / quanti / 1e6, mpxSorgente: r.v.pxSorgente / quanti / 1e6, msTolti: r.tolti })) };
}
let zittaMisura = false;

// --- i tre livelli a confronto, scena per scena ---------------------------------------------------------
const risultatiLivelli = [];
/** Il palco ingrandito a 640×360 come lo mostrerà lo schermo (per guardare se le scritte si leggono). */
function fotoIngrandita(nome, liscio) {
  if (CONSOLE) return '';
  const c = require('@napi-rs/canvas').createCanvas(640, 360); const g = c.getContext('2d');
  g.imageSmoothingEnabled = Boolean(liscio) && browser.canvas.width !== 640; if (g.imageSmoothingEnabled) g.imageSmoothingQuality = 'low';
  g.drawImage(browser.canvas, 0, 0, 640, 360);
  const f = path.join(dirUscita, nome + '.png'); fs.writeFileSync(f, c.toBuffer('image/png')); return f;
}
async function giroLivelli(scena, chiave, azione) {
  const O = browser.leggi('OPZIONI'); const com = { ombre: O.ombre, grana: O.grana, vignetta: O.vignetta, pubblico: O.pubblico };
  O.ombre = false; O.grana = false; O.vignetta = false; O.pubblico = false; // come parte sulla console
  installaAblazione();
  const n = CONSOLE ? 30 : Math.min(N, 150); const risc = CONSOLE ? 8 : 40; const q = CONSOLE ? 6 : 15;
  for (const nome of ['bello', 'medio', 'veloce']) {
    const L = LIVELLI[nome]; const dt = 1000 / L.fps;
    browser.impostaScala(L.scala); browser.impostaTagli(L.tagli);
    for (let i = 0; i < risc; i++) { if (azione) azione(i); orologio.t += dt; browser.fotogramma(orologio.t); copia(); if (i % 10 === 9) await cedi(); }
    AB.conti = {}; AB.grandi = null;
    for (let i = 0; i < q; i++) { if (azione) azione(i); orologio.t += dt; browser.fotogramma(orologio.t); copia(); }
    const conti = Object.values(AB.conti); AB.conti = null;
    const mpx = conti.reduce((a, v) => a + v.px, 0) / q / 1e6; const disegni = conti.reduce((a, v) => a + v.n, 0) / q;
    zittaMisura = true; let r; try { r = await misura('', n, dt, azione, 0); } finally { zittaMisura = false; }
    const riga = { scena, livello: nome, tela: `${browser.canvas.width}×${browser.canvas.height}`, fpsVoluti: L.fps, totale: r.totaleMedia, p95: r.totaleP95, logica: r.logicaMedia, disegno: r.giocoMedia - r.logicaMedia, resa: r.resaMedia, schermo: r.schermoMedia, mpx, disegni, mhz: frequenzaMHz() };
    risultatiLivelli.push(riga);
    console.log(`${scena.padEnd(36)} ${nome.padEnd(7)} ${riga.tela.padEnd(8)} ${riga.totale.toFixed(1).padStart(7)} ms (95° ${riga.p95.toFixed(0)}) = logica ${riga.logica.toFixed(1)} + disegno ${riga.disegno.toFixed(1)} + resa ${riga.resa.toFixed(1)} + schermo ${riga.schermo.toFixed(1)} → ${Math.min(L.fps, 1000 / riga.totale).toFixed(1)} fps su ${L.fps} voluti | ${mpx.toFixed(2)} Mpx toccati in ${disegni.toFixed(0)} disegni${riga.mhz ? ' | CPU ' + riga.mhz + ' MHz' : ''}`);
    fotoIngrandita(`livello-${chiave}-${nome}`, L.liscio);
  }
  browser.impostaScala(1); browser.impostaTagli({}); Object.assign(O, com);
  for (let i = 0; i < 4; i++) { orologio.t += PASSO; browser.fotogramma(orologio.t); copia(); }
}

(async () => {
  console.log(`\n== PROVA: ${path.relative(process.cwd(), fileHtml)} · node ${process.version} ${process.arch} · caricamento ${msCaricamento.toFixed(0)} ms ==`);
  console.log(macchina());
  if (arg.misura || arg.livelli) agganciaCronometri();
  await arrivaAlPiano();
  const st = stanzaDiCombattimento();
  await passo(150);
  const R = T().interni.statoRun;
  tappa('stanza di combattimento del piano 1', Boolean(st) && R.stanzaCorrente === st && st.nemici.length > 0 && coloriDiversi() > 50, st ? `${st.nemici.length} nemici, ${coloriDiversi()} colori` : 'nessuna stanza normale');
  foto('04-piano1-stanza-nemici');
  tappa('nessun errore segnalato dal gioco', browser.stato.errori === 0, `${browser.stato.errori} errori; immagini chieste ${browser.stato.immagini}, non caricate ${browser.stato.immaginiFallite}`);

  const I = T().interni; const P = I.player; const OPZIONI = browser.leggi('OPZIONI');
  const accendi = (v) => { OPZIONI.ombre = v; OPZIONI.grana = v; OPZIONI.vignetta = v; OPZIONI.pubblico = v; };
  const immortale = () => { P.invuln = 1e9; R.graziaIngressoC = 0; if (R.hpHalf !== undefined && R.hpHalf < 4) R.hpHalf = 12; };
  const fermo = () => { immortale(); };
  // il giocatore corre avanti e indietro e spara a raffica; i nemici (immortali) restano 12 e sparano anche loro
  const TASTI = ['KeyA', 'KeyD', 'KeyW', 'KeyS', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  const battaglia = (i) => {
    immortale();
    const f = Math.floor(i / 45) % 4;
    const voluti = new Set([['KeyD', 'ArrowRight'], ['KeyS', 'ArrowDown'], ['KeyA', 'ArrowLeft'], ['KeyW', 'ArrowUp']][f]);
    for (const k of TASTI) { const giu = voluti.has(k); if (Boolean(I.keys[k]) !== giu) browser.tasto(k, giu); }
    const s = R.stanzaCorrente;
    if (i % 4 === 0 && s && s.nemici.length) { // colpi nemici in più, come una stanza di tiratori
      const n = s.nemici[(i / 4) % s.nemici.length | 0]; const a = Math.atan2(P.y - n.y, P.x - n.x) + ((i % 3) - 1) * 0.3;
      R.proiettiliNemici.push({ x: n.x, y: n.y - 6, vx: Math.cos(a) * 2.0, vy: Math.sin(a) * 2.0, dist: 0 });
    }
  };
  const rilascia = () => { for (const k of TASTI) if (I.keys[k]) browser.tasto(k, false); };
  if (arg.livelli) {
    console.log(`\n== LIVELLI A CONFRONTO (effetti del gioco spenti come sulla console; copia = ${nomeCopia}) ==`);
    await giroLivelli('stanza normale', 'stanza', fermo);
    const quantiL = riempi(12);
    await giroLivelli(`stanza pesante (${quantiL} nemici, raffiche)`, 'pesante', battaglia);
    if (CONSOLE) {
      accendi(false); browser.impostaScala(LIVELLI.medio.scala); browser.impostaTagli(LIVELLI.medio.tagli);
      await ablazione('stanza pesante al livello medio', battaglia, Number(arg['fot-ablazione'] || 20));
      browser.impostaScala(1); browser.impostaTagli({});
    }
    rilascia();
    if (!CONSOLE) fs.writeFileSync(path.join(dirUscita, 'livelli.json'), JSON.stringify(risultatiLivelli, null, 1));
  }
  let risultati = null;
  if (arg.misura) {
    console.log(`\n== MISURA: ${N} fotogrammi per riga · copia = ${nomeCopia} ==`);
    risultati = prima.slice();
    for (const effetti of [true, false]) {
      accendi(effetti); const e = effetti ? 'tutto acceso' : 'effetti spenti';
      await passo(60);
      risultati.push(Object.assign(await misura(`stanza normale (${e})`, N, PASSO, fermo), { effetti }));
    }
    const quanti = riempi(12);
    for (const effetti of [true, false]) {
      accendi(effetti); const e = effetti ? 'tutto acceso' : 'effetti spenti';
      await passo(60);
      risultati.push(Object.assign(await misura(`stanza pesante: ${quanti} nemici, raffiche (${e})`, N, PASSO, battaglia), { effetti }));
      if (effetti) foto('05-stanza-pesante-tutto-acceso'); else foto('06-stanza-pesante-effetti-spenti');
      risultati.push(Object.assign(await misura(`stanza pesante: ${quanti} nemici, raffiche (${e})`, Math.round(N / 2), PASSO * 2, battaglia), { effetti }));
    }
    if (arg.ablazione) {
      accendi(false);
      ablazioni.push(await ablazione('stanza pesante, effetti spenti', battaglia, 100));
      accendi(true);
      ablazioni.push(await ablazione('stanza pesante, tutto acceso', battaglia, 100));
      accendi(false);
      fs.writeFileSync(path.join(dirUscita, 'ablazione.json'), JSON.stringify(ablazioni, null, 1));
    }
    if (arg.profilo) {
      // dove va il tempo di disegno: cronometro su ogni metodo del contesto 2D (stanza pesante, effetti come da --profilo=accesi|spenti)
      accendi(arg.profilo === 'accesi');
      const proto = Object.getPrototypeOf(browser.canvas.getContext('2d')); const conti = {};
      for (const k of Object.getOwnPropertyNames(proto)) {
        const d = Object.getOwnPropertyDescriptor(proto, k);
        if (!d || typeof d.value !== 'function' || k === 'constructor') continue;
        const f = d.value; const c = conti[k] = { n: 0, ms: 0 };
        proto[k] = function () { const t = ms(); try { return f.apply(this, arguments); } finally { c.n++; c.ms += ms() - t; } };
      }
      const r = await misura(`PROFILO stanza pesante (${arg.profilo})`, 300, PASSO, battaglia);
      const righe = Object.entries(conti).filter((e) => e[1].n).sort((a, b) => b[1].ms - a[1].ms).slice(0, 14);
      console.log('  metodo: chiamate per fotogramma · ms per fotogramma (il cronometro aggiunge ~0,1 µs a chiamata)');
      for (const [k, c] of righe) console.log(`  ${k.padEnd(24)} ${(c.n / 300).toFixed(1).padStart(8)} · ${(c.ms / 300).toFixed(3)} ms`);
      console.log(`  somma dei metodi nativi ${(Object.values(conti).reduce((a, c) => a + c.ms, 0) / 300).toFixed(2)} ms su ${r.giocoMedia.toFixed(2)} ms di fotogramma`);
    }
    rilascia();
    const mem = process.memoryUsage(); const picco = process.resourceUsage().maxRSS / 1024;
    console.log(`\nmemoria: RSS ${(mem.rss / 1048576).toFixed(0)} MB (picco ${picco.toFixed(0)} MB) · heap JS ${(mem.heapUsed / 1048576).toFixed(0)} MB · esterna ${(mem.external / 1048576).toFixed(0)} MB`);
    const mg = browser.memoriaGrafica();
    console.log(`memoria grafica del gioco: ${mg.immagini} immagini decodificate = ${mg.immaginiMB.toFixed(0)} MB · ${mg.tele} tele fuori schermo = ${mg.teleMB.toFixed(0)} MB`);
    const cpu = os.cpus()[0] || {};
    fs.writeFileSync(path.join(dirUscita, 'misura.json'), JSON.stringify({ quando: new Date().toISOString(), node: process.version, arch: process.arch, cpu: cpu.model, gioco: path.basename(fileHtml), copia: nomeCopia, caricamentoMs: msCaricamento, rssMB: mem.rss / 1048576, piccoRssMB: picco, heapMB: mem.heapUsed / 1048576, memoriaGrafica: mg, risultati }, null, 1));
    console.log('scritto ' + path.join(dirUscita, 'misura.json'));
  }
  tappa('nessun errore alla fine', browser.stato.errori === 0, `${browser.stato.errori} errori`);
  if (CONSOLE) console.log(`memoria ${(process.memoryUsage().rss / 1048576).toFixed(0)} MB · ${macchina()}`);
  if (browser.stato.errori) console.log(browser.stato.ultimiErrori.slice(0, 5).join('\n'));
  try { fs.unlinkSync(fileMemoria); } catch (_) { /* mai scritto */ }
  const falliti = esiti.filter((e) => !e.ok).length;
  console.log(`\n${falliti ? 'PROVA FALLITA: ' + falliti + ' tappe' : 'PROVA RIUSCITA: ' + esiti.length + ' tappe'}`);
  process.exit(falliti ? 1 : 0);
})().catch((err) => { console.error('ERRORE nella prova:', err); process.exit(2); });
