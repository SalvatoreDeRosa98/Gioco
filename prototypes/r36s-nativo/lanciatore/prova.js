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
const fileHtml = path.resolve(arg.gioco || path.join(QUI, '..', '..', '..', 'gioco', 'teatro_marionette.html'));
const dirUscita = path.resolve(arg.uscita || path.join(QUI, '..', 'uscita'));
fs.mkdirSync(dirUscita, { recursive: true });
const N = Number(arg.fotogrammi || 600);

const righeLog = [];
const log = { riga(t) { righeLog.push(t); if (!arg.zitto) console.log('  · ' + t.split('\n').slice(0, 4).join('\n    ')); } };
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
async function passo(n, dt) {
  for (let i = 0; i < (n || 1); i++) { orologio.t += dt || PASSO; browser.fotogramma(orologio.t); if (i % 6 === 5) await cedi(); }
  await cedi();
}
async function premi(code, fotogrammi) { browser.tasto(code, true); await passo(fotogrammi || 3); browser.tasto(code, false); await passo(2); }
const T = () => globalThis.__teatro;
const esiti = [];
const prima = []; // misure prese strada facendo (menu, hub)
function tappa(nome, ok, extra) { esiti.push({ nome, ok: Boolean(ok), extra }); console.log(`${ok ? 'OK  ' : 'FALLITO'} ${nome}${extra ? ' — ' + extra : ''}`); }
function foto(nome) { const f = browser.foto(path.join(dirUscita, nome + '.png')); console.log('     foto ' + f); return f; }

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
  await premi('Space');
  await passo(40);
  for (let i = 0; i < 80 && T().t4qa && T().t4qa.dialogo; i++) await premi(T().t4qa.dialogo.scelta ? 'Digit1' : 'Space');
  await passo(90);
  tappa('hub di Piazza Dante', T().fase === 'hub' && coloriDiversi() > 50, `fase ${T().fase}, ${coloriDiversi()} colori`);
  foto('02-hub');
  if (arg.misura) prima.push(await misura('hub di Piazza Dante (effetti accesi)', 90, PASSO * 2, null));
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
let copia = () => { browser.pixel(); };
let nomeCopia = 'canvas.data() (lettura dei pixel, senza schermo)';
if (arg.sdl) {
  process.env.SDL_VIDEODRIVER = process.env.SDL_VIDEODRIVER || 'dummy';
  process.env.SDL_AUDIODRIVER = process.env.SDL_AUDIODRIVER || 'dummy';
  const sdl = require('@kmamal/sdl');
  const fin = sdl.video.createWindow({ title: 'misura', width: 640, height: 480, vsync: false });
  const rett = { x: 0, y: 60, width: 640, height: 360 };
  copia = () => { fin.render(640, 360, 640 * 4, 'rgba32', browser.pixel(), { scaling: 'nearest', dstRect: rett }); };
  nomeCopia = `canvas.data() + SDL render (driver «${sdl.info.drivers.video.current}», accelerata ${fin.accelerated})`;
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
async function misura(nome, n, dt, azione) {
  for (let i = 0; i < 120; i++) { if (azione) azione(i); orologio.t += dt; browser.fotogramma(orologio.t); copia(); if (i % 30 === 29) await cedi(); } // riscaldamento
  const tot = []; const cop = []; tempi.logica = 0; tempi.disegno = 0; let colpi = 0; let nemici = 0;
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
  const r = { scena: nome, fps: Math.round(1000 / dt), fotogrammi: n, giocoMedia: s.media, giocoP50: s.p50, giocoP95: s.p95, giocoP99: s.p99, giocoMax: s.max, logicaMedia: tempi.logica / n, disegnoMedia: tempi.disegno / n, copiaMedia: c.media, totaleMedia: s.media + c.media, totaleP95: s.p95 + c.p95, nemici: nemici / n, colpi: colpi / n, fase: T().fase };
  console.log(`${nome.padEnd(46)} ${String(r.fps).padStart(2)} fps | logica+disegno ${s.media.toFixed(2)} ms (p95 ${s.p95.toFixed(2)}, max ${s.max.toFixed(1)}) = logica ${r.logicaMedia.toFixed(2)} + disegno ${r.disegnoMedia.toFixed(2)} | copia ${c.media.toFixed(2)} | nemici ${r.nemici.toFixed(1)} colpi ${r.colpi.toFixed(1)}`);
  return r;
}

(async () => {
  console.log(`\n== PROVA: ${path.relative(process.cwd(), fileHtml)} · node ${process.version} ${process.arch} · caricamento ${msCaricamento.toFixed(0)} ms ==`);
  if (arg.misura) agganciaCronometri();
  await arrivaAlPiano();
  const st = stanzaDiCombattimento();
  await passo(150);
  const R = T().interni.statoRun;
  tappa('stanza di combattimento del piano 1', Boolean(st) && R.stanzaCorrente === st && st.nemici.length > 0 && coloriDiversi() > 50, st ? `${st.nemici.length} nemici, ${coloriDiversi()} colori` : 'nessuna stanza normale');
  foto('04-piano1-stanza-nemici');
  tappa('nessun errore segnalato dal gioco', browser.stato.errori === 0, `${browser.stato.errori} errori; immagini chieste ${browser.stato.immagini}, non caricate ${browser.stato.immaginiFallite}`);

  let risultati = null;
  if (arg.misura) {
    console.log(`\n== MISURA: ${N} fotogrammi per riga · copia = ${nomeCopia} ==`);
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
  if (browser.stato.errori) console.log(browser.stato.ultimiErrori.slice(0, 5).join('\n'));
  try { fs.unlinkSync(fileMemoria); } catch (_) { /* mai scritto */ }
  const falliti = esiti.filter((e) => !e.ok).length;
  console.log(`\n${falliti ? 'PROVA FALLITA: ' + falliti + ' tappe' : 'PROVA RIUSCITA: ' + esiti.length + ' tappe'}`);
  process.exit(falliti ? 1 : 0);
})().catch((err) => { console.error('ERRORE nella prova:', err); process.exit(2); });
