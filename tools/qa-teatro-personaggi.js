#!/usr/bin/env node
/*
 * QA dei quattro personaggi (teatro/d2-personaggi.js): per ognuno parte una run e l'attacco fa danno;
 * Agnese devia un proiettile e supera una fossa con la piroetta (tastiera e RT del gamepad finto);
 * Taddeo rompe un vaso col maglio, carica tenendo premuto e non viene spinto; l'Ombra muore con un colpo,
 * vola sopra una colonna e il colpo attraversa colonna e nemico; bottone MOSSA a tocco solo con Agnese;
 * nessun errore in ERRORI_TEATRO. Uso: node tools/qa-teatro-personaggi.js <html> <prefisso-assoluto>
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-personaggi');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });
  await p.addInitScript(() => {
    window.__pad = { id: 'Pad finto (QA)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => (window.__padAcceso ? [window.__pad, null, null, null] : [null, null, null, null]) });
  });
  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(600);

  /** Run nuova col personaggio, stanza normale ripulita, un nemico robusto (fermo) se richiesto. */
  const prepara = (pid, conNemico = true) => p.evaluate(({ pid, conNemico }) => {
    const I = window.__teatro.interni;
    if (I.progressione && I.progressione.sbloccaTutto) I.progressione.sbloccaTutto(); else if (I.sbloccaTutto) I.sbloccaTutto();
    selezionaPersonaggio(pid);
    statoRun.fase = 'in_gioco';
    nuovaRun(false);
    statoRun.siparioAttivo = null;
    const s = statoRun.mappa.stanze.find((x) => x.tipo === 'normale');
    entraInStanza(s, null);
    statoRun.siparioAttivo = null; statoRun.pausa = false;
    const st = statoRun.stanzaCorrente;
    const modello = st.nemici.find((n) => !n.boss) || st.nemici[0];
    st.nemici = []; st.ostacoli = []; st.fragiliB7 = []; st.oggettiATerra = []; st.muroSegreto = null; st.suoloB7 = [];
    statoRun.proiettili.length = 0; statoRun.proiettiliNemici.length = 0;
    player.x = 300; player.y = 200; player.targetX = null; player.targetY = null; player.invuln = 0; player.cooldown = 0;
    player.dirX = 1; player.dirY = 0; player.flipX = false;
    statoRun.graziaIngressoC = 0; statoRun.scudoRosaC = false; statoRun.scudoStanzaD = 0;
    if (conNemico && modello) {
      const n = Object.assign({}, modello, { id: 'qa1', x: 345, y: 200, hp: 900, maxHp: 900, vx: 0, vy: 0 });
      st.nemici.push(n); st.pulita = false;
    }
    const D = I.personaggiD2.d2; D.giro = 0; D.ricarica = 0; D.carica = null; D.deviati = 0; D.rotti = 0;
    return { pg: statoRun.personaggioId, hp: statoRun.hpHalf, max: statoRun.maxHpHalf, nemici: st.nemici.length };
  }, { pid, conNemico });
  const tieniTasto = async (k, ms) => { await p.keyboard.down(k); await p.waitForTimeout(ms); await p.keyboard.up(k); };
  const hpNemici = () => p.evaluate(() => statoRun.stanzaCorrente.nemici.map((n) => n.hp));
  const quiete = () => p.waitForFunction(() => { const P = window.__teatro.interni.progressione; return !P || (!P.notifica && !(P.coda || []).length); }, null, { timeout: 20000 }).catch(() => {});

  // ---------------------------------------------------------------- 0. scheda del menu
  await p.evaluate(() => { const I = window.__teatro.interni; if (I.progressione && I.progressione.sbloccaTutto) I.progressione.sbloccaTutto(); else if (I.sbloccaTutto) I.sbloccaTutto(); statoRun.fase = 'menu_selezione'; statoRun.personaggioId = 'agnese'; });
  await quiete();
  await p.waitForTimeout(300);
  await p.screenshot({ path: foto('01-menu') });
  const scheda = await p.evaluate(() => ['ferruccio', 'agnese', 'taddeo', 'ombra'].map((id) => ({ id, nome: PERSONAGGI_GIOCABILI[id].nome, titolo: PERSONAGGI_GIOCABILI[id].titolo, ...schedaD2(id) })));
  ok('scheda-riga-stile', scheda.every((s) => s.stile && s.stile.length > 8), scheda);
  ok('ombra-nome-nuovo', scheda[3].nome === 'L\'Ombra Senza Fili' && !/judas|pulcinella/i.test(scheda[3].nome + scheda[3].titolo), scheda[3]);

  // ---------------------------------------------------------------- 1. ogni personaggio: l'attacco fa danno
  for (const pid of ['ferruccio', 'agnese', 'taddeo', 'ombra']) {
    const info = await prepara(pid);
    const h0 = await hpNemici();
    await tieniTasto('ArrowRight', pid === 'taddeo' ? 120 : 400);
    await p.waitForTimeout(250);
    const h1 = await hpNemici();
    ok(`${pid}-run-e-danno`, info.pg === pid && h1[0] < h0[0], { info, h0, h1 });
  }

  // ---------------------------------------------------------------- 2. Agnese
  await prepara('agnese', false);
  const devia = async (premere) => {
    await p.evaluate(() => {
      statoRun.proiettiliNemici.push({ x: player.x + 40, y: player.y - 6, vx: -2.2, vy: 0, dist: 0 });
      window.__teatro.interni.personaggiD2.d2.ricarica = 0; player.invuln = 0;
    });
    await p.waitForTimeout(80);
    await premere();
    await p.waitForTimeout(260);
    return p.evaluate(() => ({ deviati: window.__teatro.interni.personaggiD2.d2.deviati, hp: statoRun.hpHalf, max: statoRun.maxHpHalf, rimandati: statoRun.proiettili.filter((q) => q.deviatoD2).length }));
  };
  const dv = await devia(() => p.keyboard.press('ShiftLeft'));
  ok('agnese-devia-tastiera', dv.deviati >= 1 && dv.hp === dv.max, dv);
  // foto durante il giro con colpi in arrivo
  await p.evaluate(() => {
    for (let i = 0; i < 5; i++) { const a = i * 1.25; statoRun.proiettiliNemici.push({ x: player.x + Math.cos(a) * 45, y: player.y - 6 + Math.sin(a) * 45, vx: -Math.cos(a) * 1.5, vy: -Math.sin(a) * 1.5, dist: 0 }); }
    window.__teatro.interni.personaggiD2.d2.ricarica = 0;
  });
  await p.waitForTimeout(160);
  await p.keyboard.press('ShiftLeft');
  await p.waitForTimeout(70);
  await p.screenshot({ path: foto('02-agnese-piroetta') });
  await p.waitForTimeout(300);
  // gamepad: RT
  await p.evaluate(() => { window.__padAcceso = true; });
  await p.waitForTimeout(150);
  const dvp = await devia(async () => {
    await p.evaluate(() => { window.__pad.buttons[7].pressed = true; window.__pad.buttons[7].value = 1; });
    await p.waitForTimeout(80);
    await p.evaluate(() => { window.__pad.buttons[7].pressed = false; window.__pad.buttons[7].value = 0; });
  });
  ok('agnese-devia-gamepad-RT', dvp.deviati >= 2, dvp);
  await p.evaluate(() => { window.__padAcceso = false; });
  await p.mouse.move(640, 360); // torna la tastiera/mouse
  // fossa: senza piroetta si ferma, con la piroetta passa
  const fossa = async (conMossa) => {
    await prepara('agnese', false);
    await p.evaluate(() => { statoRun.stanzaCorrente.ostacoli.push({ tipo: 'fossa', x: 360, y: 200, r: 16, w: 34, h: 22 }); player.x = 333; });
    await p.keyboard.down('KeyD');
    await p.waitForTimeout(60);
    if (conMossa) await p.keyboard.press('ShiftLeft');
    await p.waitForTimeout(420);
    await p.keyboard.up('KeyD');
    return p.evaluate(() => player.x);
  };
  const xSenza = await fossa(false);
  const xCon = await fossa(true);
  ok('agnese-fossa-ferma-senza-mossa', xSenza < 340, { xSenza });
  ok('agnese-supera-fossa', xCon > 386, { xCon });

  // ---------------------------------------------------------------- 3. Taddeo
  await prepara('taddeo', false);
  const vaso = await p.evaluate(() => {
    const st = statoRun.stanzaCorrente;
    const o = { tipo: 'colonna', variante: 'vaso', x: 335, y: 195, r: 11, w: 22, h: 22, fragileB7: { genere: 'comune', colpi: 3, esplode: false } };
    st.ostacoli.push(o); st.fragiliB7 = [o];
    return st.ostacoli.length;
  });
  await tieniTasto('ArrowRight', 80);
  await p.waitForTimeout(40);
  await p.screenshot({ path: foto('03-taddeo-maglio') });
  await p.waitForTimeout(300);
  const dopoVaso = await p.evaluate(() => ({ ostacoli: statoRun.stanzaCorrente.ostacoli.length, proiettili: statoRun.proiettili.length, rotti: window.__teatro.interni.personaggiD2.d2.rotti }));
  ok('taddeo-rompe-vaso', vaso === 1 && dopoVaso.ostacoli === 0, dopoVaso);
  ok('taddeo-non-spara', dopoVaso.proiettili === 0, dopoVaso);
  // carica: tenuto a lungo fa più danno di un tocco
  await prepara('taddeo');
  await tieniTasto('ArrowRight', 60); await p.waitForTimeout(700);
  const hT = await hpNemici();
  await p.evaluate(() => { player.cooldown = 0; });
  await tieniTasto('ArrowRight', 750); await p.waitForTimeout(200);
  const hC = await hpNemici();
  ok('taddeo-carica-piu-danno', (hC[0] - hT[0]) < -(900 - hT[0]) * 1.5, { tocco: 900 - hT[0], carico: hT[0] - hC[0] });
  // contraccolpo
  const spinta = async (pid) => {
    await prepara(pid, false);
    await p.evaluate(() => { player.invuln = 0; statoRun.hpHalf = statoRun.maxHpHalf; subisciColpoGiocatore(1, 'la QA', player.x + 8, player.y); });
    await p.waitForTimeout(250);
    return p.evaluate(() => Math.abs(player.x - 300) + Math.abs(player.y - 200));
  };
  const sF = await spinta('ferruccio');
  const sT = await spinta('taddeo');
  ok('taddeo-non-spinto', sT < 0.5 && sF > 2, { ferruccio: sF, taddeo: sT });

  // ---------------------------------------------------------------- 4. Ombra
  const om = await prepara('ombra', false);
  ok('ombra-mezza-maschera', om.hp === 1 && om.max === 1, om);
  const conv = await p.evaluate(() => {
    const st = statoRun.stanzaCorrente; const m0 = statoRun.monete;
    st.oggettiATerra.push({ tipo: 'cura', valore: 2, x: player.x + 4, y: player.y });
    return m0;
  });
  await p.waitForTimeout(150);
  const conv1 = await p.evaluate(() => ({ monete: statoRun.monete, hp: statoRun.hpHalf, cure: statoRun.stanzaCorrente.oggettiATerra.filter((k) => k.tipo === 'cura').length }));
  ok('ombra-maschera-in-monete', conv1.monete > conv && conv1.cure === 0 && conv1.hp === 1, { prima: conv, ...conv1 });
  // vola sopra una colonna
  await p.evaluate(() => { statoRun.stanzaCorrente.ostacoli.push({ tipo: 'colonna', x: 345, y: 200, r: 14, w: 26, h: 26 }); player.x = 315; });
  await tieniTasto('KeyD', 450);
  const xO = await p.evaluate(() => player.x);
  ok('ombra-vola-sopra-colonna', xO > 372, { xO });
  // colpo spettrale: attraversa una colonna e un nemico
  await prepara('ombra');
  await p.evaluate(() => {
    const st = statoRun.stanzaCorrente;
    st.ostacoli.push({ tipo: 'colonna', x: 325, y: 194, r: 12, w: 24, h: 24 });
    const n2 = Object.assign({}, st.nemici[0], { id: 'qa2', x: 400, hp: 900, maxHp: 900 });
    st.nemici.push(n2);
  });
  await tieniTasto('ArrowRight', 120);
  await p.waitForTimeout(80);
  await p.screenshot({ path: foto('04-ombra-spettrali') });
  await p.waitForTimeout(400);
  const hO = await hpNemici();
  ok('ombra-colpo-attraversa', hO[0] < 900 && hO[1] < 900, { hO });
  // un colpo e cade
  await prepara('ombra', false);
  await p.evaluate(() => { player.invuln = 0; subisciColpoGiocatore(1, 'la QA', player.x + 8, player.y); });
  await p.waitForTimeout(200);
  const morta = await p.evaluate(() => ({ hp: statoRun.hpHalf, fase: statoRun.fase, morte: window.__teatro.fase }));
  ok('ombra-muore-con-un-colpo', morta.hp === 0 || morta.fase !== 'in_gioco', morta);

  // ---------------------------------------------------------------- 5. tocco: bottone MOSSA solo con Agnese
  const ctxT = await browser.newContext({ viewport: { width: 915, height: 412 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const t = await ctxT.newPage();
  t.on('pageerror', (e) => errori.push('tocco: ' + String(e)));
  await t.goto('file://' + file);
  await t.waitForTimeout(600);
  await t.touchscreen.tap(450, 200);
  await t.waitForTimeout(300);
  const vistaMossa = async (pid) => {
    await t.evaluate((pid) => {
      const I = window.__teatro.interni; if (I.progressione && I.progressione.sbloccaTutto) I.progressione.sbloccaTutto(); else if (I.sbloccaTutto) I.sbloccaTutto();
      selezionaPersonaggio(pid); statoRun.fase = 'in_gioco'; nuovaRun(false); statoRun.siparioAttivo = null;
      const s = statoRun.mappa.stanze.find((x) => x.tipo === 'normale'); entraInStanza(s, null); statoRun.siparioAttivo = null;
      statoRun.stanzaCorrente.nemici = []; window.__teatro.interni.personaggiD2.d2.ricarica = 0;
    }, pid);
    await t.waitForTimeout(400);
    return t.evaluate(() => { const b = document.querySelector('.c2-mossa'); if (!b) return { c: false }; const r = b.getBoundingClientRect(); return { c: true, vis: !b.hidden && r.width > 10, x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  };
  const vA = await vistaMossa('agnese');
  const vF = await vistaMossa('ferruccio');
  ok('tocco-mossa-solo-agnese', vA.vis && !vF.vis, { vA, vF });
  await vistaMossa('agnese');
  await t.screenshot({ path: foto('05-tocco-mossa') });
  if (vA.vis) {
    await t.touchscreen.tap(vA.x, vA.y);
    await t.waitForTimeout(150);
    const giro = await t.evaluate(() => window.__teatro.interni.personaggiD2.d2.ricarica);
    ok('tocco-mossa-parte', giro > 0, { ricarica: giro });
  }
  const erroriTeatro = await p.evaluate(() => (typeof ERRORI_TEATRO !== 'undefined' ? ERRORI_TEATRO.length : -1));
  const erroriT = await t.evaluate(() => (typeof ERRORI_TEATRO !== 'undefined' ? ERRORI_TEATRO.map(String) : []));
  ok('nessun-errore', erroriTeatro === 0 && erroriT.length === 0 && errori.length === 0, { erroriTeatro, erroriT, errori });
  await browser.close();
  const falliti = esiti.filter((e) => !e.ok);
  console.log(JSON.stringify({ totale: esiti.length, falliti: falliti.length, esiti }, null, 1));
  process.exit(falliti.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
