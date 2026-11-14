#!/usr/bin/env node
/**
 * tools/qa-teatro-passi.js — i personaggi poggiano i piedi sul pavimento e camminano, non restano sospesi.
 * Nasce da una prova dell'autore (2026-11-14): «i personaggi sembrano fluttuare e non camminare sui pavimenti».
 * Prima tutta la figura dipinta, piedi compresi, andava su e giù a tempo fisso, e le gambe non seguivano la strada.
 * Controlla, ascoltando le chiamate di disegno delle figure:
 *  - da fermi e in cammino il punto più basso della figura (le scarpe) resta alla stessa quota, mentre il corpo si muove;
 *  - in cammino i due piedi si alternano (non si allargano e stringono insieme);
 *  - la fase della camminata del giocatore viene dalla strada fatta (una volta per tick, i salti non contano);
 *  - sotto i piedi c'è l'ombra di contatto, anche per i nemici a terra; i nemici fermi stanno nella posa «fermo»,
 *    quelli che camminano contano la strada e guardano dove vanno.
 * Uso: node tools/qa-teatro-passi.js [file html] [prefisso foto]
 */
const path = require('path');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(process.argv[2] || path.join(RADICE, 'gioco', 'teatro_marionette.html'));
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-passi');

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const errori = [];
  p.on('pageerror', (e) => errori.push(String(e).slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text().slice(0, 200)); });
  const esiti = [];
  const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(cond ? {} : { dati }) });

  await p.goto('file://' + file);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await p.waitForFunction(() => window.__teatro && window.__teatro.fase === 'menu_selezione' && window.__teatro.t2 && window.__teatro.t2.caricati.length > 8, null, { timeout: 30000 });

  // 1. le figure dipinte: dove finiscono le scarpe e dove sta il corpo, tick per tick. Le figure si disegnano sul
  //    contesto del gioco: si ascoltano le sue chiamate (le scarpe sono le ellissi inclinate di 0,1 e 0,12 radianti;
  //    il corpo è il primo `translate`) e si portano i punti in coordinate dello schermo con la trasformazione corrente.
  const figure = await p.evaluate(() => {
    const misura = (pg, tick, moving) => {
      const scarpe = []; let corpo = null;
      const ellisse = ctx.ellipse, trasla = ctx.translate;
      ctx.ellipse = function (x, y, rx, ry, rot, ...resto) {
        if (Math.abs(rot - 0.1) < 1e-9 || Math.abs(rot - 0.12) < 1e-9) { const m = this.getTransform(); scarpe.push({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f, k: Math.hypot(m.b, m.d) }); }
        return ellisse.call(this, x, y, rx, ry, rot, ...resto);
      };
      // il primo translate su px è l'ombra a terra (py + 9), il secondo è il corpo (py + dondolio)
      let quanti = 0;
      ctx.translate = function (x, y) { const r = trasla.call(this, x, y); if (x === 60 && ++quanti === 2) { const m = this.getTransform(); corpo = { y: m.f, k: Math.hypot(m.b, m.d) }; } return r; };
      ctx.save();
      try { disegnaFerruccioPittorico(60, 80, { tick, moving, charId: pg, charInfo: { id: pg } }); } finally { ctx.restore(); delete ctx.ellipse; delete ctx.translate; }
      const k = (corpo && corpo.k) || 1; // px dello schermo per unità di gioco
      const s = scarpe.sort((u, v) => u.x - v.x);
      return { n: s.length, sx: s[0] ? s[0].x / k : null, dx: s[1] ? s[1].x / k : null, ySx: s[0] ? s[0].y / k : null, yDx: s[1] ? s[1].y / k : null, corpo: corpo ? corpo.y / k : null };
    };
    const out = {};
    for (const pg of ['ferruccio', 'agnese', 'taddeo']) {
      const fermo = [], cammina = [];
      for (let t = 0; t < 70; t += 5) fermo.push(misura(pg, t, false));
      for (let t = 0; t < 26; t++) cammina.push(misura(pg, t, true));
      out[pg] = { fermo, cammina };
    }
    return out;
  });
  const giro = (v) => Math.max(...v) - Math.min(...v);
  for (const [pg, F] of Object.entries(figure)) {
    const due = F.fermo.every((m) => m.n === 2) && F.cammina.every((m) => m.n === 2);
    const terra = Math.max(F.fermo[0].ySx, F.fermo[0].yDx); // la quota del piede più basso a riposo
    ok(`${pg} da fermo: le scarpe non si muovono da terra, il corpo respira appena`, due && giro(F.fermo.map((m) => m.ySx)) < 0.01 && giro(F.fermo.map((m) => m.yDx)) < 0.01
      && giro(F.fermo.map((m) => m.corpo)) > 0.2 && giro(F.fermo.map((m) => m.corpo)) <= 1.2, { ySx: F.fermo.map((m) => m.ySx), corpo: F.fermo.map((m) => m.corpo) });
    // in cammino: nessun piede scende sotto terra, e a ogni istante almeno uno dei due è (quasi) a terra
    const sotto = F.cammina.filter((m) => m.ySx > F.fermo[0].ySx + 0.01 || m.yDx > F.fermo[0].yDx + 0.01).length;
    const sospesi = F.cammina.filter((m) => F.fermo[0].ySx - m.ySx > 0.2 && F.fermo[0].yDx - m.yDx > 0.2).length;
    ok(`${pg} in cammino: un piede poggia sempre a terra, nessuno ci affonda`, due && sotto === 0 && sospesi === 0, { sotto, sospesi, terra, ySx: F.cammina.map((m) => +m.ySx.toFixed(2)) });
    ok(`${pg} in cammino: ogni piede si alza mentre avanza`, giro(F.cammina.map((m) => m.ySx)) >= 1 && giro(F.cammina.map((m) => m.yDx)) >= 1, { ySx: F.cammina.map((m) => +m.ySx.toFixed(2)) });
    // un passo dopo l'altro: quando il sinistro va avanti il destro va indietro (prima si allargavano e stringevano insieme)
    const dS = F.cammina.map((m) => m.sx - F.fermo[0].sx), dD = F.cammina.map((m) => m.dx - F.fermo[0].dx);
    const opposti = dS.filter((v, i) => Math.abs(v) > 0.5 && v * dD[i] < 0).length, insieme = dS.filter((v, i) => Math.abs(v) > 0.5 && v * dD[i] > 0).length;
    ok(`${pg} in cammino: i piedi si alternano`, opposti >= 8 && insieme === 0, { opposti, insieme, dS: dS.map((v) => +v.toFixed(1)) });
    ok(`${pg} in cammino: il corpo si alza a metà passo`, giro(F.cammina.map((m) => m.corpo)) >= 0.8, { corpo: F.cammina.map((m) => +m.corpo.toFixed(2)) });
  }

  // 2. la fase della camminata del giocatore viene dalla strada fatta
  const fase = await p.evaluate(() => {
    const P = CAMMINATA_T1; const x0 = player.x, y0 = player.y;
    const f = (tick, moving) => faseCamminataT1(player.x, player.y, tick, moving);
    f(1000, false);
    const a = f(1001, true);
    player.x += P.passoPx; const b = f(1002, true); const b2 = f(1002, true); // stesso tick: non si conta due volte
    player.x += P.passoPx; const c = f(1003, true);
    player.x += 200; const d = f(1004, true); // un salto di posto non è un passo
    const altrove = faseCamminataT1(player.x + 50, player.y, 20, true);
    player.x = x0; player.y = y0; f(1005, false);
    return { a, b, b2, c, d, passo: Math.PI, altrove, fermo: f(1006, false) };
  });
  const vicino = (x, y) => Math.abs(x - y) < 0.2;
  ok('un passo ogni CAMMINATA_T1.passoPx di strada', vicino(fase.b - fase.a, fase.passo) && vicino(fase.c - fase.b, fase.passo), fase);
  ok('nello stesso tick la strada non si conta due volte', fase.b === fase.b2, fase);
  ok('un cambio di posto non conta come strada, e da fermo la fase è zero', vicino(fase.d, fase.c) && fase.fermo === 0, fase);
  ok('le figure fuori dal gioco camminano a tempo', fase.altrove === 10, fase);

  // 3. i nemici a terra: ombra di contatto, strada contata, posa «fermo» da fermi, verso dove vanno
  const nemici = await p.evaluate(() => {
    const T2 = window.__teatro.t2;
    const tela = document.createElement('canvas'); tela.width = 160; tela.height = 120;
    const g = tela.getContext('2d', { willReadFrequently: true });
    const n = { tipo: 'guardia', x: 80, y: 70, hp: 5, maxHp: 5, shootCd: 40, flash: 0 };
    const disegna = (tick) => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 160, 120); g.translate(n.x, n.y); return T2.nemico(g, n, tick); };
    const out = { disegnato: disegna(1) };
    // l'ombra di contatto: pixel scuri e semitrasparenti ai lati dei piedi, alla quota dei piedi
    // (dalla pagina di sviluppo, file://, i fogli dell'autore rendono la tela illeggibile: lo si controlla sul file unico)
    try {
      const d = g.getImageData(0, 0, 160, 120).data; const py = Math.round(n.y + T2.CONFIG.piediNemico);
      const rx = T2.CONFIG.altezza.guardia * T2.CONFIG.ombraContatto.larghezza;
      const a = (x, y) => d[(y * 160 + Math.round(x)) * 4 + 3];
      out.ombra = [a(n.x + rx * 1.1, py), a(n.x - rx * 1.1, py), a(n.x + rx * 1.1, py + 7)]; // ai lati dei piedi sì, più sotto no
    } catch (e) { out.ombra = null; }
    // cammina verso sinistra, lontano dal giocatore che sta a destra: strada contata, guarda dove va
    player.x = 600;
    for (let t = 2; t < 22; t++) { n.x -= 1; disegna(t); }
    const m1 = { ...T2.memoriaNemico(n) };
    for (let t = 22; t < 40; t++) disegna(t); // poi sta ferma
    const m2 = { ...T2.memoriaNemico(n) };
    out.cammina = { strada: m1.strada, verso: m1.verso, fermoDa: m1.fermoDa };
    out.ferma = { strada: m2.strada, fermoDa: m2.fermoDa, verso: m2.verso };
    return out;
  });
  if (nemici.ombra) ok('nemico a terra: sotto i piedi c\'è l\'ombra di contatto', nemici.disegnato && nemici.ombra[0] > 20 && nemici.ombra[1] > 20 && nemici.ombra[2] === 0, nemici.ombra);
  else console.log('(ombra di contatto dei nemici: non controllabile da file://, si controlla sul file unico)');
  ok('nemico che cammina: la strada è contata e guarda dove va', Math.abs(nemici.cammina.strada - 20) < 0.01 && nemici.cammina.verso === -1 && nemici.cammina.fermoDa === 0, nemici.cammina);
  ok('nemico che si ferma: dopo qualche tick sta fermo (niente passi sul posto)', nemici.ferma.strada === nemici.cammina.strada && nemici.ferma.fermoDa >= 10 && nemici.ferma.verso === 0, nemici.ferma);

  // 4. foto: il giocatore fermo e in cammino in una stanza
  await p.keyboard.press('Space');
  await p.waitForFunction(() => window.__teatro.fase === 'hub', null, { timeout: 30000 });
  await p.evaluate(() => { selezionaPersonaggio('ferruccio'); statoRun.fase = 'in_gioco'; nuovaRun(false); statoRun.siparioAttivo = null; statoRun.pausa = false; statoRun.banner = null; player.invuln = 0; statoRun.graziaIngressoC = 0; });
  await p.waitForTimeout(500);
  const centro = () => p.evaluate(() => { const c = document.getElementById('c').getBoundingClientRect(); return { x: c.left + player.x / 640 * c.width, y: c.top + player.y / 360 * c.height }; });
  let c = await centro();
  await p.screenshot({ path: `${prefisso}-fermo.png`, clip: { x: Math.max(0, c.x - 110), y: Math.max(0, c.y - 120), width: 220, height: 170 } });
  await p.keyboard.down('d'); await p.waitForTimeout(260); c = await centro();
  await p.screenshot({ path: `${prefisso}-cammina.png`, clip: { x: Math.max(0, c.x - 110), y: Math.max(0, c.y - 120), width: 220, height: 170 } });
  await p.keyboard.up('d');

  ok('nessun errore di console', errori.length === 0, errori);
  ok('nessun errore in ERRORI_TEATRO', await p.evaluate(() => ERRORI_TEATRO.length === 0), await p.evaluate(() => ERRORI_TEATRO.slice(0, 3)));
  await browser.close();
  for (const e of esiti) console.log(`${e.ok ? 'OK  ' : 'NO  '} ${e.caso}${e.ok ? '' : ' — ' + JSON.stringify(e.dati).slice(0, 500)}`);
  const rossi = esiti.filter((e) => !e.ok).length;
  console.log(`\n${esiti.length - rossi}/${esiti.length} controlli verdi`);
  process.exit(rossi ? 1 : 0);
})();
