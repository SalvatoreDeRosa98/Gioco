#!/usr/bin/env node
/*
 * tools/qa-teatro-registro-scena.js — verifica Playwright di gioco/teatro/d3-registro-scena.js:
 * leggio nell'hub, libro che si apre e si sfoglia con tastiera, gamepad finto e mouse, nemico battuto che
 * compare (e il Bozzo che scoppia da solo che non conta), boss battuto → trionfo → oggetto che prima non usciva
 * mai in 500 estrazioni e dopo sì, pool mai vuoti, salvataggio corrotto, nessun errore (ERRORI_TEATRO).
 *
 * Uso: node tools/qa-teatro-registro-scena.js <file html> [prefisso screenshot ASSOLUTO]
 * Esce con 1 se un controllo fallisce. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-registro-scena');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (nome, cond, dati) => esiti.push({ nome, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });
  await p.addInitScript(() => {
    window.__padAcceso = false;
    window.__pad = { id: 'Pad finto (QA)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => (window.__padAcceso ? [window.__pad, null, null, null] : [null, null, null, null]) });
  });
  const fase = () => p.evaluate(() => window.__teatro.fase);
  const R = () => p.evaluate(() => window.__teatro.interni.registroScenaD3.registro());
  const libro = () => p.evaluate(() => window.__teatro.interni.registroScenaD3.libro);
  const tasto = async (k) => { await p.keyboard.press(k); await p.waitForTimeout(70); };
  const pad = async (i) => {
    await p.evaluate((i) => { window.__padAcceso = true; const b = window.__pad.buttons[i]; b.pressed = true; b.value = 1; }, i);
    await p.waitForTimeout(90);
    await p.evaluate((i) => { const b = window.__pad.buttons[i]; b.pressed = false; b.value = 0; }, i);
    await p.waitForTimeout(90);
  };
  const libera = async () => {
    for (let i = 0; i < 60; i++) {
      const s = await p.evaluate(() => ({ perg: typeof a7 === 'object' && Boolean(a7.pergamena), d: window.__teatro.t4qa.dialogo, cart: typeof b8 === 'object' && Boolean(b8.cart) }));
      if (!s.perg && !s.d && !s.cart) return;
      await p.keyboard.press(s.d && s.d.scelta ? 'Digit1' : 'Space');
      await p.waitForTimeout(90);
    }
  };
  const alLeggio = async () => {
    await p.evaluate(() => { const L = window.__teatro.interni.registroScenaD3.leggio(); const P = window.__teatro.interni.player; P.x = L.x + 16; P.y = L.y + 8; });
    await p.waitForTimeout(150);
  };
  /** 500 pool della run (con le estrazioni base e forti): quante volte esce `id`, e se un pool è mai vuoto. */
  const estrazioni = (id) => p.evaluate((id) => {
    let visto = 0, vuoti = 0, minimo = 1e9;
    for (let i = 0; i < 500; i++) {
      inizializzaPoolRunB(null);
      const P = window.__teatro.interni.statoRun.poolRunB;
      minimo = Math.min(minimo, P.ids.length);
      if (P.ids.includes(id)) visto++;
      for (let k = 0; k < 3; k++) { const o = k ? estraiOggettoForte() : estraiOggettoBase(); if (!o || !o.id) vuoti++; else if (o.id === id) visto++; }
    }
    return { visto, vuoti, minimo };
  }, id);

  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  await p.keyboard.press('Space');
  await p.waitForTimeout(400);
  for (let i = 0; i < 50 && (await fase()) !== 'hub'; i++) await p.waitForTimeout(100);
  await libera();
  ok('hub', (await fase()) === 'hub', await fase());

  // 1. il leggio e l'invito
  await alLeggio();
  await p.screenshot({ path: foto('01-leggio') });
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(200);
  ok('si-apre-con-E', (await libro()) !== null, await libro());
  await p.screenshot({ path: foto('02-comparse-vuote') });

  // 2. tastiera: carte, schede, sezioni, chiusura
  await tasto('ArrowRight');
  const l1 = await libro();
  await tasto('ArrowUp'); await tasto('ArrowRight');
  const l2 = await libro();
  await tasto('Digit4'); await tasto('ArrowRight');
  const l3 = await libro();
  const giaPrima = await p.evaluate(() => window.__teatro.interni.player.x);
  await tasto('Escape');
  const pausaDopo = await p.evaluate(() => window.__teatro.interni.statoRun.pausa);
  ok('tastiera', l1.sel === 1 && l2.sez === 1 && l2.fuoco === 'schede' && l3.sez === 3 && l3.spread === 1 && (await libro()) === null && !pausaDopo, { l1, l2, l3, pausaDopo });
  ok('fermo-col-libro', giaPrima === (await p.evaluate(() => window.__teatro.interni.player.x)));

  // 3. gamepad finto: A apre (interagisci dell'hub), croce a destra sfoglia, B chiude
  await alLeggio();
  await pad(0);
  const g1 = await libro();
  await pad(15);
  const g2 = await libro();
  const ctx = await p.evaluate(() => window.__teatro.interni.comandiB3.stato.contesto);
  await pad(1);
  const g3 = await libro();
  ok('gamepad', g1 && g2 && g2.sel === 1 && ctx === 'menu' && g3 === null, { g1, g2, ctx, g3 });
  await p.evaluate(() => { window.__padAcceso = false; });

  // 4. mouse: tocco sulla scheda «Primi attori», poi fuori dal libro chiude
  await alLeggio();
  await p.keyboard.press('KeyE'); await p.waitForTimeout(150);
  const tela = await p.$('canvas');
  const bb = await tela.boundingBox();
  const clic = async (x, y) => { await p.mouse.click(bb.x + (x * bb.width) / 640, bb.y + (y * bb.height) / 360); await p.waitForTimeout(90); };
  await clic(106 + 112 + 52, 33);
  const m1 = await libro();
  await clic(10, 10);
  ok('mouse', m1 && m1.sez === 1 && (await libro()) === null, m1);

  // 5. prima del trionfo: il Corno di Corallo non esce mai in 500 estrazioni
  const prima = await estrazioni('corno');
  ok('bloccato-prima', prima.visto === 0 && prima.vuoti === 0 && prima.minimo >= 20, prima);
  const quanti = await p.evaluate(() => {
    const T = window.__teatro.interni.TRIONFI_D3;
    const tutti = tuttiGliOggettiB5();
    const base = T.filter((t) => { const o = trovaOggettoB(t.oggetto); return !o || o.tier !== 'forte'; }).map((t) => t.oggetto);
    return { n: T.length, tot: tutti.length, base };
  });
  ok('al-piu-10-per-cento', quanti.n <= quanti.tot * 0.1 && quanti.base.length === 0, quanti);

  // 6. in scena: un Gatto d'Ombra battuto conta, un Bozzo che scoppia da solo no
  const g = await p.evaluate(() => window.__teatro.t4qa.ingresso);
  await p.evaluate((g) => { const P = window.__teatro.interni.player; P.x = g.x - 40; P.y = g.y; }, g);
  await p.keyboard.down('KeyD');
  for (let i = 0; i < 30 && (await fase()) !== 'in_gioco'; i++) await p.waitForTimeout(100);
  await p.keyboard.up('KeyD');
  await p.waitForTimeout(300);
  ok('in-gioco', (await fase()) === 'in_gioco');
  await p.evaluate(() => {
    const st = window.__teatro.interni.statoRun.stanzaCorrente;
    const n = { id: 'qa-gatto', tipo: 'gatto', patternMob: 'gatto', nome: 'Gatto', boss: false, hp: 5, maxHp: 5, x: 300, y: 200, vx: 0, vy: 0 };
    const b = { id: 'qa-bozzo', tipo: 'bomba_ferma', patternMob: 'bomba_ferma', nome: 'Bozzo', boss: false, hp: 0, maxHp: 5, x: 500, y: 120, fuseTimer: 42, exploded: true };
    st.nemici.push(n, b);
    danneggiaNemico(n, 99, 0, 0);
  });
  await p.waitForTimeout(200);
  const r1 = await R();
  ok('nemico-battuto', r1.nemici.gatto && r1.nemici.gatto.battuti === 1, r1.nemici);
  ok('bozzo-da-solo-non-conta', r1.nemici.bomba_ferma && r1.nemici.bomba_ferma.battuti === 0 && r1.nemici.bomba_ferma.visti === 1, r1.nemici.bomba_ferma);

  // 7. boss battuto: segno di a6, trionfo, notifica, oggetto che ora può uscire
  await p.evaluate(() => {
    const st = window.__teatro.interni.statoRun.stanzaCorrente;
    const boss = { id: 'qa-boss', tipo: 'gatto', patternMob: 'salto_gatto', bossId: 're-gatto', nome: 'Il Gatto dei Quattro Canti', boss: true, hp: 0, maxHp: 175, x: 320, y: 180 };
    st.nemici.push(boss);
    t4Gancio('bossSconfitto', { ...st, nemici: [boss] });
  });
  await p.waitForTimeout(300);
  const r2 = await R();
  const tri = await p.evaluate(() => ({ gatto: window.__teatro.interni.registroScenaD3.trionfoOttenuto('gatto'), notifica: window.__teatro.interni.registroScenaD3.ultimaNotifica }));
  ok('trionfo-assegnato', tri.gatto && r2.trionfi.gatto === true && r2.boss['re-gatto'] && r2.boss['re-gatto'].battuti >= 1, { tri, boss: r2.boss, trionfi: r2.trionfi });
  ok('banner-attrezzeria', /Nuovo nell'attrezzeria/.test(tri.notifica || ''), tri.notifica);
  await p.waitForTimeout(400);
  await p.screenshot({ path: foto('03-notifica') });
  const dopo = await estrazioni('corno');
  ok('sbloccato-dopo', dopo.visto > 0 && dopo.vuoti === 0, dopo);

  // 8. di nuovo in piazza: ogni sezione del libro
  await p.evaluate(() => { const I = window.__teatro.interni; I.statoRun.pausa = false; });
  for (let i = 0; i < 40 && (await fase()) === 'in_gioco'; i++) {
    await p.evaluate(() => {
      const I = window.__teatro.interni, S = I.statoRun;
      S.siparioAttivo = null; S.graziaIngressoC = 0; I.player.invuln = 0; S.hpHalf = 1; S.scudoRosaC = false; S.scudoStanzaD = 0; S.viteExtra = 0;
      S.proiettiliNemici.push({ x: I.player.x, y: I.player.y - 6, vx: 0.01, vy: 0, dist: 0 });
    });
    await p.waitForTimeout(200);
  }
  for (let i = 0; i < 100 && (await fase()) !== 'hub'; i++) await p.waitForTimeout(100);
  await p.waitForTimeout(700);
  await libera();
  await alLeggio();
  await p.keyboard.press('KeyE'); await p.waitForTimeout(150);
  await tasto('ArrowRight'); await tasto('ArrowRight'); await tasto('ArrowRight'); // sul Gatto d'Ombra (quarta carta)
  await p.waitForTimeout(150);
  await p.screenshot({ path: foto('04-comparse') });
  await tasto('Digit2');
  await p.screenshot({ path: foto('05-primi-attori') });
  await tasto('Digit3');
  await p.screenshot({ path: foto('06-attrezzeria') });
  await tasto('Digit4');
  await p.screenshot({ path: foto('07-trionfi-segni') });
  await tasto('ArrowRight');
  await p.screenshot({ path: foto('08-trionfi') });
  await tasto('Escape');

  // 9. salvataggi corrotti o vecchi
  const corrotti = ['{rotto', '[1,2,3]', '{"nemici":[1],"boss":"x","trionfi":{"gatto":5}}', '{"nemici":{"gatto":{"battuti":"mille","visti":-4}},"boss":{"re-gatto":null}}'];
  const esitiC = [];
  for (const c of corrotti) {
    esitiC.push(await p.evaluate((c) => {
      localStorage.setItem('ferruccio.teatro.registroScena', c);
      const D = window.__teatro.interni.registroScenaD3;
      const r = D.ricarica();
      D.apri();
      for (let s = 0; s < 4; s++) { D.tasto('Digit' + (s + 1)); disegnaFrame(16); D.tasto('ArrowRight'); disegnaFrame(16); }
      D.chiudi();
      return typeof r.nemici === 'object' && !Array.isArray(r.nemici) && Object.values(r.nemici).every((v) => v.battuti >= 0 && v.visti >= 0);
    }, c));
  }
  ok('salvataggio-corrotto', esitiC.every(Boolean), esitiC);

  const errTeatro = await p.evaluate(() => (typeof ERRORI_TEATRO !== 'undefined' ? ERRORI_TEATRO.map((e) => `${e.dove}: ${e.messaggio || e.msg || ''}`) : []));
  ok('nessun-errore-teatro', errTeatro.length === 0, errTeatro);
  ok('nessun-errore', errori.length === 0, errori);
  const falliti = esiti.filter((e) => !e.ok);
  console.log(JSON.stringify({ controlli: esiti.length, passati: esiti.length - falliti.length, falliti }, null, 1));
  await browser.close();
  process.exit(falliti.length ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
