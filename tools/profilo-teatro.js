#!/usr/bin/env node
/*
 * tools/profilo-teatro.js — profilo delle prestazioni del Teatro delle Marionette (Playwright + CDP).
 *
 * Apre il gioco da un piccolo server http locale (così il canvas non è «sporco» e si può forzare il disegno a
 * fine fotogramma con getImageData), porta la partita in scene tipiche e, per ognuna, fa girare a mano il ciclo
 * del gioco (passoLogico → iniziaFrame → disegnaFrame → t4Gancio) misurando passo logico e disegno, con la CPU
 * strozzata via CDP (Emulation.setCPUThrottlingRate) e con la vista del telefono verticale e orizzontale.
 *
 * Misure (tutte relative: la macchina è carica, conta il confronto fra scene, strati e prima/dopo):
 *  - media e 95° percentile del passo logico e del disegno (mediana di PROFILO_RIPETI ripetizioni);
 *  - costo di ogni strato di OPZIONI (ombre, grana, vignetta, pubblico, lampi) = disegno acceso − spento;
 *  - tempo «proprio» di ogni funzione globale di disegno (nome con «disegn»), raggruppato per file;
 *  - tele fuori schermo: quante ne crea ogni file, quante restano vive, quanta memoria; tele create per fotogramma;
 *  - memoria JS allocata per fotogramma (usedJSHeapSize, con --enable-precise-memory-info);
 *  - dimensione della release (production/release/teatro.html, anche compressa).
 *
 * Uso: node tools/profilo-teatro.js [file html] [uscita.json]
 *   PROFILO_VISTE=pc,vert4,vert6,orizz4,orizz6   viste da misurare (predefinite tutte)
 *   PROFILO_STRATI=vert4,pc                      viste in cui si misura anche uno strato alla volta
 *   PROFILO_FUNZIONI=vert4                       vista in cui si misura il tempo per funzione
 *   PROFILO_SCENE=hub,normale,...                scene (predefinite tutte)
 *   PROFILO_FRAME=40  PROFILO_RISCALDO=8  PROFILO_RIPETI=3
 *   PROFILO_FOTO=<prefisso>                      foto di ogni scena (vista pc) per guardarle
 * Stampa una tabella leggibile e scrive il JSON completo. Esce con 1 solo se il gioco non si apre.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');
const zlib = require('zlib');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const uscita = process.argv[3] || path.join(RADICE, 'production', 'polish', 'profilo-teatro-ultimo.json');
const env = (k, d) => (process.env[k] === undefined || process.env[k] === '' ? d : process.env[k]);
const lista = (k, d) => env(k, d).split(',').map((s) => s.trim()).filter(Boolean);

/** Viste: finestra, densità, tocco, strozzatura della CPU. */
const VISTE = {
  pc: { viewport: { width: 1280, height: 720 }, dpr: 1, tocco: false, cpu: 1 },
  vert4: { viewport: { width: 416, height: 657 }, dpr: 3, tocco: true, cpu: 4 },
  vert6: { viewport: { width: 416, height: 657 }, dpr: 3, tocco: true, cpu: 6 },
  orizz4: { viewport: { width: 657, height: 416 }, dpr: 3, tocco: true, cpu: 4 },
  orizz6: { viewport: { width: 657, height: 416 }, dpr: 3, tocco: true, cpu: 6 },
};
const SCENE = ['hub', 'normale', 'boss1', 'luciana', 'buca', 'cambio', 'burattinaio', 'menu', 'registro'];
const STRATI = ['ombre', 'grana', 'vignetta', 'pubblico', 'lampi'];
const N_FRAME = Number(env('PROFILO_FRAME', 40));
const N_RISCALDO = Number(env('PROFILO_RISCALDO', 8));
const N_RIPETI = Number(env('PROFILO_RIPETI', 3));
const visteScelte = lista('PROFILO_VISTE', Object.keys(VISTE).join(','));
const visteStrati = new Set(lista('PROFILO_STRATI', 'vert4,pc'));
const visteFunzioni = new Set(lista('PROFILO_FUNZIONI', 'vert4'));
const sceneScelte = lista('PROFILO_SCENE', SCENE.join(','));
const prefFoto = env('PROFILO_FOTO', '');

const mediana = (v) => { const s = v.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : NaN; };
const r2 = (x) => (Number.isFinite(x) ? Math.round(x * 100) / 100 : null);

/** Funzioni globali di disegno per file, dai sorgenti (ordine di caricamento dell'HTML). */
function funzioniPerFile() {
  const html = fs.readFileSync(file, 'utf8');
  const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  const out = {};
  for (const s of srcs) {
    const p = path.resolve(path.dirname(file), s);
    if (!fs.existsSync(p)) continue;
    const testo = fs.readFileSync(p, 'utf8');
    const nomi = new Set([...testo.matchAll(/^function\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]).filter((n) => /disegn/i.test(n)));
    out[path.basename(s)] = [...nomi];
  }
  return out;
}

/** Server http statico sulla cartella del gioco (porta libera). */
function server(radice) {
  const tipi = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg' };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const p = path.join(radice, u);
    if (!p.startsWith(radice) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': tipi[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

/** Contatore delle tele: iniettato prima degli script del gioco. */
const INIZIO = () => {
  const crea = Document.prototype.createElement;
  const tele = [];
  window.__profTele = { tele, durante: 0, misurando: false };
  Document.prototype.createElement = function (nome, ...r) {
    const el = crea.call(this, nome, ...r);
    if (String(nome).toLowerCase() === 'canvas') {
      const riga = String(new Error().stack || '').split('\n').slice(2).find((x) => /\/teatro\//.test(x)) || '';
      const m = /teatro\/([\w.-]+\.js)/.exec(riga);
      tele.push({ rif: new WeakRef(el), file: m ? m[1] : '?' });
      if (window.__profTele.misurando) window.__profTele.durante++;
    }
    return el;
  };
};

/** Strumenti nella pagina: preparazione delle scene e misura del ciclo. Eseguito una volta dopo il caricamento. */
const STRUMENTI = () => {
  const I = window.__teatro.interni;
  const R = () => statoRun;
  const P = () => I.player;
  const sipariVia = () => { const r = R(); r.siparioAttivo = null; r.banner = null; r.bannerTimer = 0; r.cartiglioD = null; r.graziaIngressoC = 1e7; try { a6.coda.length = 0; a6.notifica = null; } catch (_) { /* a6 assente */ } };
  const immortale = () => { const r = R(); r.maxHpHalf = 99; r.hpHalf = 99; P().invuln = 1e9; };
  const inStanza = (tipo, piano, filtro = () => true) => {
    const r = R();
    r.fase = 'in_gioco';
    nuovaRun(false);
    avviaPiano(piano, false);
    const trova = () => r.mappa.stanze.find((x) => x.tipo === tipo && filtro(x));
    for (let k = 0; k < 900 && !trova(); k++) avviaPiano(piano, false);
    const s = trova();
    if (!s) return null;
    const [lato, idG] = Object.entries(s.porte)[0];
    const g = r.mappa.perId.get(idG);
    r.stanzaCorrente = g; g.pulita = true; g.nemici = [];
    r.proiettiliNemici = [];
    entraInStanza(s, lato);
    sipariVia(); immortale();
    return s;
  };
  let colpo = 0;
  /** Tiene la scena «tipica»: vita piena, 40 proiettili nemici in volo, 6 nemici vivi. */
  const tieniNormale = () => {
    const r = R(), st = r.stanzaCorrente;
    immortale();
    for (const n of st.nemici) if (n.hp <= 0) n.hp = n.maxHp || 3;
    while (r.proiettiliNemici.length < 40) {
      colpo++;
      const a = colpo * 2.399;
      r.proiettiliNemici.push({ x: 320 + Math.cos(a) * 140, y: 190 + Math.sin(a) * 70, vx: Math.cos(a * 3) * 1.6, vy: Math.sin(a * 3) * 1.6, dist: 0 });
    }
  };
  const SCENE = {
    hub() { const r = R(); nuovaRun(false); r.fase = 'hub'; sipariVia(); return { tieni: immortale }; },
    normale() {
      const s = inStanza('normale', 1, (x) => !x.pulita && x.nemici.length >= 3 && !x.quadriD5 && !x.botoleD5);
      if (!s) return null;
      const base = s.nemici.filter((n) => !n.boss);
      while (s.nemici.length < 6) { const c = JSON.parse(JSON.stringify(base[s.nemici.length % base.length])); c.x = 140 + s.nemici.length * 60; c.y = 120 + (s.nemici.length % 2) * 110; s.nemici.push(c); }
      s.nemici.length = 6;
      P().x = 320; P().y = 260;
      return { tieni: tieniNormale, nemici: s.nemici.length };
    },
    boss1() { I.bossB6.forza(null); const s = inStanza('boss', 1); return s && { tieni: immortale, boss: (s.nemici.find((n) => n.boss) || {}).bossId }; },
    luciana() { I.bossB6.forza(null); const s = inStanza('boss', 4); return s && { tieni: immortale, boss: (s.nemici.find((n) => n.boss) || {}).bossId }; },
    buca() { const s = inStanza('buca', 2); return s && { tieni: immortale, tipo: s.tipo }; },
    cambio() {
      const r = R(); r.fase = 'in_gioco'; nuovaRun(false);
      let st = null;
      for (let k = 0; k < 50 && !st; k++) { avviaPiano(2, false); st = r.mappa.stanze.find((s) => s.tipo === 'normale' && !s.pulita && s.nemici.length >= 2 && !s.quadriD5 && !s.botoleD5); }
      if (!st || !I.d5.forzaQuadri(st)) return null;
      entraInStanza(st, 'W'); sipariVia(); immortale();
      for (const n of st.nemici) n.hp = 0;
      verificaStanzaPulita();
      const q = st.quadriD5;
      if (!q || q.fase !== 'cambio') return null;
      const tieni = () => { immortale(); if (q.fase === 'cambio') q.t = q.pausa + q.durata * 0.5; };
      tieni();
      return { tieni, fase: q.fase };
    },
    burattinaio() { I.provaBurattinaioD1(0); sipariVia(); immortale(); return { tieni: immortale, boss: (R().stanzaCorrente.nemici.find((n) => n.boss) || {}).nome }; },
    menu() { const r = R(); r.fase = 'menu_selezione'; return { tieni: () => {} }; },
    registro() { const r = R(); nuovaRun(false); r.fase = 'hub'; sipariVia(); apriRegistroScenaD3(); return { tieni: immortale, aperto: I.registroScenaD3.aperto }; },
  };
  let tieni = () => {};
  const p95 = (v) => { const s = [...v].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]; };
  const media = (v) => v.reduce((a, b) => a + b, 0) / Math.max(1, v.length);
  const flush = () => { try { ctx.getImageData(0, 0, 1, 1); } catch (_) { /* canvas sporco: niente flush */ } };
  /** Tempo proprio per funzione (pila di chiamate) quando lo strumento per funzioni è acceso. */
  const fn = { attivo: false, pila: [], proprio: new Map(), conte: new Map() };
  const avvolte = new Set();
  window.__prof = {
    scena(nome) { tieni = () => {}; const e = SCENE[nome](); if (!e) return null; tieni = e.tieni; const { tieni: _t, ...info } = e; return info; },
    opzioni(o) { for (const k of Object.keys(o)) OPZIONI[k] = o[k]; },
    avvolgi(perFile) {
      let n = 0;
      for (const [f, nomi] of Object.entries(perFile)) {
        for (const nome of nomi) {
          const orig = window[nome];
          if (typeof orig !== 'function' || avvolte.has(nome)) continue;
          avvolte.add(nome);
          const chiave = `${f}:${nome}`;
          window[nome] = function (...a) {
            if (!fn.attivo) return orig.apply(this, a);
            const t0 = performance.now(); fn.pila.push(0);
            try { return orig.apply(this, a); } finally {
              const figli = fn.pila.pop(); const tot = performance.now() - t0;
              fn.proprio.set(chiave, (fn.proprio.get(chiave) || 0) + tot - figli);
              fn.conte.set(chiave, (fn.conte.get(chiave) || 0) + 1);
              if (fn.pila.length) fn.pila[fn.pila.length - 1] += tot;
            }
          };
          n++;
        }
      }
      return n;
    },
    /** Fa girare `n` fotogrammi (dopo `riscaldo`) e rende i tempi. */
    misura(n, riscaldo, perFunzione) {
      const T = window.__profTele;
      for (let i = 0; i < riscaldo; i++) { tieni(); passoLogico(); iniziaFrame(); disegnaFrame(MS_PER_TICK); t4Gancio('sopra', MS_PER_TICK); flush(); }
      if (typeof gc === 'function') gc();
      const log = [], dis = [];
      fn.proprio.clear(); fn.conte.clear(); fn.attivo = Boolean(perFunzione);
      T.durante = 0; T.misurando = true;
      const h0 = performance.memory ? performance.memory.usedJSHeapSize : 0;
      for (let i = 0; i < n; i++) {
        tieni();
        const t0 = performance.now();
        passoLogico();
        const t1 = performance.now();
        iniziaFrame(); disegnaFrame(MS_PER_TICK); t4Gancio('sopra', MS_PER_TICK); flush();
        const t2 = performance.now();
        log.push(t1 - t0); dis.push(t2 - t1);
      }
      const h1 = performance.memory ? performance.memory.usedJSHeapSize : 0;
      T.misurando = false; fn.attivo = false;
      return {
        logica: { media: media(log), p95: p95(log) }, disegno: { media: media(dis), p95: p95(dis) },
        heapKBperFrame: (h1 - h0) / 1024 / n, teleDurante: T.durante,
        funzioni: perFunzione ? Object.fromEntries([...fn.proprio].map(([k, v]) => [k, { ms: v / n, chiamate: (fn.conte.get(k) || 0) / n }])) : undefined,
        errori: (window.ERRORI_TEATRO || []).length, fase: statoRun.fase,
      };
    },
    tele() {
      if (typeof gc === 'function') gc();
      const perFile = {};
      for (const t of window.__profTele.tele) {
        const f = perFile[t.file] || (perFile[t.file] = { create: 0, vive: 0, MB: 0 });
        f.create++;
        const c = t.rif.deref();
        if (c) { f.vive++; f.MB += (c.width * c.height * 4) / 1048576; }
      }
      return perFile;
    },
    risoluzione() { const c = document.getElementById('c'); return { w: c.width, h: c.height, scalaBase }; },
  };
};

(async () => {
  const radice = path.dirname(file);
  const srv = await server(radice);
  const url = `http://127.0.0.1:${srv.address().port}/${path.basename(file)}`;
  const perFile = funzioniPerFile();
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const ris = { quando: new Date().toISOString(), html: path.relative(RADICE, file), frame: N_FRAME, ripeti: N_RIPETI, viste: {} };
  const rel = path.join(RADICE, 'production', 'release', 'teatro.html');
  if (fs.existsSync(rel)) { const b = fs.readFileSync(rel); ris.release = { byte: b.length, gzip: zlib.gzipSync(b, { level: 9 }).length }; }

  for (const nomeVista of visteScelte) {
    const V = VISTE[nomeVista];
    if (!V) continue;
    const ctxB = await browser.newContext({ viewport: V.viewport, deviceScaleFactor: V.dpr, hasTouch: V.tocco, isMobile: V.tocco });
    await ctxB.addInitScript(INIZIO);
    const p = await ctxB.newPage();
    const errori = []; p.on('pageerror', (e) => errori.push(String(e)));
    await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800);
    if (V.tocco) { await p.touchscreen.tap(5, 5); await p.waitForTimeout(200); }
    const pronto = await p.evaluate(() => Boolean(window.__teatro && window.__teatro.interni && typeof passoLogico === 'function'));
    if (!pronto) { console.error('il gioco non si apre', errori); process.exit(1); }
    await p.evaluate(STRUMENTI);
    await p.evaluate(() => { OPZIONI.qualitaAuto = false; }); // la regolazione automatica (e4) falserebbe le misure
    const cdp = await ctxB.newCDPSession(p);
    const vista = { ...V, risoluzione: await p.evaluate(() => window.__prof.risoluzione()), scene: {} };
    console.log(`\n== ${nomeVista} (${V.viewport.width}×${V.viewport.height} ×${V.dpr}, CPU ÷${V.cpu}) buffer ${vista.risoluzione.w}×${vista.risoluzione.h}`);
    if (visteFunzioni.has(nomeVista)) console.log('   funzioni avvolte:', await p.evaluate((pf) => window.__prof.avvolgi(pf), perFile));
    const tutteAccese = Object.fromEntries(STRATI.map((k) => [k, true]));

    for (const scena of sceneScelte) {
      const info = await p.evaluate((s) => { try { return window.__prof.scena(s); } catch (e) { return { errore: String(e && e.stack || e) }; } }, scena);
      if (!info || info.errore) { vista.scene[scena] = { nonMisurata: info ? info.errore : 'scena non raggiunta' }; console.log(`   ${scena}: NON MISURATA`, info && info.errore); continue; }
      await p.waitForTimeout(250);
      if (prefFoto && nomeVista === visteScelte[0]) await p.screenshot({ path: `${prefFoto}${nomeVista}-${scena}.png` });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: V.cpu });
      const varianti = ['tutto', ...(visteStrati.has(nomeVista) ? STRATI : [])];
      const prove = Object.fromEntries(varianti.map((v) => [v, []]));
      for (let rip = 0; rip < N_RIPETI; rip++) {
        const ordine = rip % 2 ? [...varianti].reverse() : varianti;
        for (const v of ordine) {
          await p.evaluate((o) => window.__prof.opzioni(o), v === 'tutto' ? tutteAccese : { ...tutteAccese, [v]: false });
          prove[v].push(await p.evaluate(({ n, r }) => window.__prof.misura(n, r, false), { n: N_FRAME, r: N_RISCALDO }));
        }
      }
      await p.evaluate((o) => window.__prof.opzioni(o), tutteAccese);
      let funzioni;
      if (visteFunzioni.has(nomeVista)) funzioni = (await p.evaluate(({ n, r }) => window.__prof.misura(n, r, true), { n: N_FRAME, r: N_RISCALDO })).funzioni;
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const base = prove.tutto;
      const s = {
        info,
        logica: { media: r2(mediana(base.map((x) => x.logica.media))), p95: r2(mediana(base.map((x) => x.logica.p95))) },
        disegno: { media: r2(mediana(base.map((x) => x.disegno.media))), p95: r2(mediana(base.map((x) => x.disegno.p95))) },
        heapKBperFrame: r2(mediana(base.map((x) => x.heapKBperFrame))),
        teleCreatePerFrame: r2(mediana(base.map((x) => x.teleDurante / N_FRAME))),
        fase: base[0].fase, errori: base[base.length - 1].errori,
        strati: {},
      };
      for (const k of STRATI) if (prove[k].length) s.strati[k] = r2(s.disegno.media - mediana(prove[k].map((x) => x.disegno.media)));
      if (funzioni) s.funzioni = Object.fromEntries(Object.entries(funzioni).sort((a, b) => b[1].ms - a[1].ms).slice(0, 25).map(([k, v]) => [k, { ms: r2(v.ms), chiamate: r2(v.chiamate) }]));
      vista.scene[scena] = s;
      console.log(`   ${scena.padEnd(12)} logica ${String(s.logica.media).padStart(6)} (p95 ${s.logica.p95})  disegno ${String(s.disegno.media).padStart(6)} (p95 ${s.disegno.p95})  heap ${s.heapKBperFrame} KB/f  tele/f ${s.teleCreatePerFrame}`
        + (Object.keys(s.strati).length ? `  strati ${JSON.stringify(s.strati)}` : '') + `  ${JSON.stringify(info)}`);
      if (s.funzioni) console.log('     funzioni:', Object.entries(s.funzioni).slice(0, 8).map(([k, v]) => `${k} ${v.ms}`).join(' · '));
    }
    vista.tele = await p.evaluate(() => window.__prof.tele());
    vista.erroriPagina = errori;
    console.log('   tele per file:', JSON.stringify(vista.tele));
    ris.viste[nomeVista] = vista;
    await ctxB.close();
  }
  await browser.close();
  srv.close();
  fs.mkdirSync(path.dirname(uscita), { recursive: true });
  fs.writeFileSync(uscita, JSON.stringify(ris, null, 1));
  if (ris.release) console.log(`\nrelease: ${(ris.release.byte / 1048576).toFixed(2)} MB (gzip ${(ris.release.gzip / 1048576).toFixed(2)} MB)`);
  console.log('scritto', uscita);
})().catch((e) => { console.error(e); process.exit(1); });
