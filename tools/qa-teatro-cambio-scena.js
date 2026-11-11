#!/usr/bin/env node
/*
 * tools/qa-teatro-cambio-scena.js — verifica Playwright di gioco/teatro/d5-cambio-scena.js
 * (stanze in due quadri e botole di scena).
 * Uso: node tools/qa-teatro-cambio-scena.js [file html] [prefisso screenshot]
 *  0. Generatore: stanze in due quadri e con botole solo fra le normali, al massimo 2 per piano, mai l'ingresso.
 *  1. Stanza forzata in due quadri: dopo il primo quadro le porte restano chiuse e parte il cambio; nessun danno
 *     durante il cambio; gli arredi cambiano; Ferruccio mai dentro un arredo; entra la seconda compagnia; dopo il
 *     secondo quadro la stanza è pulita e arriva il premio più ricco; rientro nella stanza pulita.
 *  2. Morte durante il secondo quadro.
 *  3. Botole: un nemico sale (fuori da st.nemici durante l'ascesa), la botola aperta respinge chi cammina, chi vola passa.
 * Esce con 1 se un controllo salta o ci sono errori (console o ERRORI_TEATRO).
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-cambio-scena');
const foto = (n) => (fs.existsSync(prefisso) && fs.statSync(prefisso).isDirectory() ? path.join(prefisso, `${n}.png`) : `${prefisso}-${n}.png`);
fs.mkdirSync(path.dirname(foto('x')), { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [], esiti = [];
  const ok = (nome, cond, info) => esiti.push({ nome, ok: Boolean(cond), info });
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(600);
  await p.evaluate(() => {
    const I = window.__teatro.interni;
    I.statoRun.fase = 'in_gioco';
    I.nuovaRun(false);
    I.statoRun.siparioAttivo = null;
    window.__qa = {
      stanza(piano) {
        const R = I.statoRun;
        avviaPiano(piano, false); R.siparioAttivo = null;
        return R.mappa.stanze.find((s) => s.tipo === 'normale' && !s.pulita && s.nemici.length >= 2 && !s.quadriD5 && !s.botoleD5);
      },
      dentro() {
        const st = I.statoRun.stanzaCorrente, P = I.player;
        return (st.ostacoli || []).some((o) => o.tipo !== 'fossa' && Math.hypot(P.x - o.x, P.y - o.y) < (o.r || 0) + 8);
      },
      arredi() { return JSON.stringify((I.statoRun.stanzaCorrente.ostacoli || []).map((o) => [o.tipo, Math.round(o.x), Math.round(o.y)])); },
      calma() { const R = I.statoRun; R.banner = null; R.bannerTimer = 0; R.graziaIngressoC = 1e7; },
    };
  });

  // 0. generatore
  const gen = await p.evaluate(() => {
    const R = window.__teatro.interni.statoRun, v = [];
    let quadri = 0, botole = 0;
    for (let giro = 0; giro < 40; giro++) {
      const piano = 1 + (giro % 4);
      avviaPiano(piano, false); R.siparioAttivo = null;
      const q = R.mappa.stanze.filter((s) => s.quadriD5), b = R.mappa.stanze.filter((s) => s.botoleD5);
      quadri += q.length; botole += b.length;
      if (q.length > 2 || b.length > 2) v.push(`piano ${piano}: ${q.length} quadri, ${b.length} botole`);
      for (const s of [...q, ...b]) if (s.tipo !== 'normale') v.push(`tipo ${s.tipo}`);
    }
    return { v, quadri, botole };
  });
  ok('generatore: solo stanze normali, al massimo 2 per piano', gen.v.length === 0, gen.v.slice(0, 5));
  ok('generatore: in 40 piani compaiono stanze in due quadri e con botole', gen.quadri > 0 && gen.botole > 0, gen);

  // 1. stanza forzata in due quadri
  const ing = await p.evaluate(() => {
    const I = window.__teatro.interni, st = window.__qa.stanza(2);
    window.__qa.st = st;
    const fatto = I.d5.forzaQuadri(st);
    entraInStanza(st, 'W'); window.__qa.calma();
    return { fatto, fase: st.quadriD5 && st.quadriD5.fase, nemici: st.nemici.length, arredi: window.__qa.arredi() };
  });
  ok('stanza forzata in due quadri, fase «primo»', ing.fatto && ing.fase === 'primo', ing);
  ing.disp2 = await p.evaluate(() => JSON.parse(JSON.stringify(window.__qa.st.quadriD5.disp2)));
  ok('la disposizione del secondo quadro è nello stato (JSON) della stanza', ing.disp2 && ing.disp2.id && ing.disp2.variante !== undefined, ing.disp2);
  await p.waitForTimeout(500);
  await p.screenshot({ path: foto('1-quadro-primo') });
  const avvio = await p.evaluate(() => {
    const I = window.__teatro.interni, st = window.__qa.st, R = I.statoRun;
    for (const n of st.nemici) n.hp = 0;
    verificaStanzaPulita();
    if (st.quadriD5.fase === 'cambio') st.quadriD5.durata *= 6; // al rallentatore: le foto cadono dove devono
    // Ferruccio in mezzo alla scena: dove salirà un arredo deve essere spostato
    I.player.x = 320; I.player.y = 188;
    R.proiettiliNemici.push({ x: 0, y: 0, vx: 0, vy: 0 });
    return { pulita: st.pulita, fase: st.quadriD5.fase };
  });
  ok('primo quadro finito: porte chiuse (stanza non pulita), parte il cambio', !avvio.pulita && avvio.fase === 'cambio', avvio);
  const campioni = [];
  for (const [nome, frazione] of [['1-quarto', 0.25], ['2-meta', 0.5], ['3-tre-quarti', 0.75], ['4-fine', 0.97]]) {
    await p.waitForFunction((f) => {
      const q = window.__qa.st.quadriD5;
      return q.fase !== 'cambio' || (q.t - q.pausa) / q.durata >= f;
    }, frazione, { timeout: 5000 });
    await p.screenshot({ path: foto(`2-cambio-${nome}`) });
    campioni.push(await p.evaluate(() => {
      const I = window.__teatro.interni, R = I.statoRun, st = window.__qa.st;
      const hp = R.hpHalf; R.graziaIngressoC = 0;
      let ricevuto = null;
      if (I.d5.cambioInCorso()) { subisciColpoGiocatore(1, 'qa', 0, 0); ricevuto = R.hpHalf < hp; R.hpHalf = hp; }
      R.graziaIngressoC = 1e7;
      return { fase: st.quadriD5.fase, dentro: window.__qa.dentro(), pnem: R.proiettiliNemici.length, ricevuto, pulita: st.pulita };
    }));
  }
  ok('durante il cambio nessun danno e nessun proiettile nemico', campioni.every((c) => c.ricevuto !== true && (c.fase !== 'cambio' || c.pnem === 0)), campioni);
  ok('Ferruccio mai dentro un arredo', campioni.every((c) => !c.dentro), campioni);
  ok('porte chiuse per tutto il cambio', campioni.every((c) => !c.pulita), campioni);
  await p.waitForFunction(() => window.__qa.st.quadriD5.fase === 'secondo' && !window.__teatro.interni.d5.inAttesaBotole(window.__qa.st), null, { timeout: 15000 });
  await p.waitForTimeout(300);
  await p.screenshot({ path: foto('3-quadro-secondo') });
  const sec = await p.evaluate(() => {
    const st = window.__qa.st;
    return { fase: st.quadriD5.fase, nemici: st.nemici.filter((n) => n.hp > 0).length, attesa: window.__teatro.interni.d5.inAttesaBotole(st), arredi: window.__qa.arredi(), dentro: window.__qa.dentro(), pulita: st.pulita };
  });
  ok('secondo quadro: entra la seconda compagnia', sec.fase === 'secondo' && sec.nemici > 0 && !sec.attesa && !sec.pulita, sec);
  ok('gli arredi sono cambiati', sec.arredi !== ing.arredi, { prima: ing.arredi, dopo: sec.arredi });
  const d2 = await p.evaluate(() => window.__qa.st.disposizioneB7 && window.__qa.st.disposizioneB7.id);
  ok('il secondo quadro usa la disposizione salvata', d2 === ing.disp2.id, { d2, salvata: ing.disp2 });
  ok('Ferruccio fuori dagli arredi nuovi', !sec.dentro);
  const fine = await p.evaluate(() => {
    const st = window.__qa.st, prima = st.oggettiATerra.length;
    for (const n of st.nemici) n.hp = 0;
    verificaStanzaPulita();
    return { pulita: st.pulita, fase: st.quadriD5.fase, premi: st.oggettiATerra.length - prima };
  });
  ok('dopo il secondo quadro: stanza pulita e premio più ricco', fine.pulita && fine.fase === 'finito' && fine.premi >= 2, fine);
  await p.waitForTimeout(500);
  await p.screenshot({ path: foto('4-pulita') });
  const rientro = await p.evaluate(() => {
    const R = window.__teatro.interni.statoRun, st = window.__qa.st;
    const altra = R.mappa.perId.get(Object.values(st.porte)[0]);
    entraInStanza(altra, 'W'); entraInStanza(st, 'E'); window.__qa.calma();
    return { pulita: st.pulita, vivi: st.nemici.filter((n) => n.hp > 0).length, fase: st.quadriD5.fase, arredi: window.__qa.arredi() };
  });
  ok('rientro: stanza pulita, secondo quadro, nessun nemico', rientro.pulita && rientro.vivi === 0 && rientro.fase === 'finito' && rientro.arredi === sec.arredi, rientro);
  await p.waitForTimeout(400);

  // 2. morte durante il secondo quadro
  const morte = await p.evaluate(async () => {
    const I = window.__teatro.interni, R = I.statoRun, st = window.__qa.stanza(3);
    I.d5.forzaQuadri(st); entraInStanza(st, 'S'); window.__qa.calma();
    for (const n of st.nemici) n.hp = 0;
    verificaStanzaPulita();
    await new Promise((r) => setTimeout(r, 3600));
    const fase = st.quadriD5.fase;
    R.graziaIngressoC = 0; R.scudoRosaC = false; R.scudoStanzaD = 0; R.viteExtra = 0;
    for (let i = 0; i < 30 && R.fase === 'in_gioco'; i++) { player.invuln = 0; player.iframes = 0; subisciColpoGiocatore(2, 'qa', 0, 0); }
    await new Promise((r) => setTimeout(r, 400));
    return { faseQuadro: fase, faseRun: R.fase, hp: R.hpHalf };
  });
  ok('morte durante il secondo quadro', morte.faseQuadro === 'secondo' && (morte.faseRun !== 'in_gioco' || morte.hp <= 0), morte);
  await p.screenshot({ path: foto('5-morte') });

  // 3. botole
  await p.evaluate(() => {
    const I = window.__teatro.interni;
    I.statoRun.fase = 'in_gioco'; I.nuovaRun(false); I.statoRun.siparioAttivo = null;
  });
  const bot = await p.evaluate(() => {
    const I = window.__teatro.interni, st = window.__qa.stanza(2);
    window.__qa.sb = st;
    const fatto = I.d5.forzaBotole(st), prima = st.nemici.length;
    entraInStanza(st, 'W'); window.__qa.calma();
    return { fatto, prima, dopo: st.nemici.length, attesa: I.d5.inAttesaBotole(st), botole: st.botoleD5.lista.length };
  });
  ok('botole: i nemici aspettano sotto il palco', bot.fatto && bot.dopo < bot.prima && bot.attesa, bot);
  const stato = (x) => p.waitForFunction((x) => window.__qa.sb.botoleD5.lista.some((b) => b.stato === x), x, { timeout: 6000 });
  await stato('trema');
  await p.screenshot({ path: foto('6-botola-trema') });
  await p.waitForFunction(() => window.__qa.sb.botoleD5.lista.some((b) => b.stato === 'ascesa' && b.t > 12), null, { timeout: 6000 });
  const asc = await p.evaluate(() => {
    const st = window.__qa.sb, b = st.botoleD5.lista.find((x) => x.stato === 'ascesa');
    return { ascesa: Boolean(b), fuori: b ? st.nemici.indexOf(b.nemico) < 0 && Boolean(b.nemico) : null };
  });
  await p.screenshot({ path: foto('7-botola-ascesa') });
  ok('un nemico sale dalla botola e intanto non è in scena (né colpisce né è colpibile)', asc.ascesa && asc.fuori, asc);
  await stato('aperta');
  const buco = await p.evaluate(async () => {
    const I = window.__teatro.interni, st = window.__qa.sb, P = I.player;
    const b = st.botoleD5.lista.find((x) => x.stato === 'aperta');
    if (!b) return { b: false };
    P.volo = false; P.x = b.x + 1; P.y = b.y; await new Promise((r) => setTimeout(r, 120));
    const dCammina = Math.hypot(P.x - b.x, P.y - b.y);
    P.volo = true; P.x = b.x + 1; P.y = b.y; await new Promise((r) => setTimeout(r, 120));
    const dVola = Math.hypot(P.x - b.x, P.y - b.y);
    P.volo = false;
    return { b: true, dCammina, dVola, raggio: I.BOTOLE_D5.raggioBuco, salito: st.nemici.length };
  });
  ok('la botola aperta blocca chi cammina, chi vola passa', buco.b && buco.dCammina >= buco.raggio && buco.dVola < buco.raggio, buco);
  await p.screenshot({ path: foto('8-botola-aperta') });

  const errTeatro = await p.evaluate(() => (typeof ERRORI_TEATRO !== 'undefined' ? ERRORI_TEATRO.map((e) => String(e.messaggio || e.msg || e)) : []));
  ok('nessun errore in ERRORI_TEATRO', errTeatro.length === 0, errTeatro.slice(0, 5));
  ok('nessun errore di console', errori.length === 0, errori.slice(0, 5));
  await browser.close();
  for (const e of esiti) console.log(`${e.ok ? 'OK  ' : 'FALLITO'} ${e.nome}${e.ok ? '' : ' → ' + JSON.stringify(e.info)}`);
  process.exit(esiti.every((e) => e.ok) ? 0 : 1);
})();
