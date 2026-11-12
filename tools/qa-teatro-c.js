#!/usr/bin/env node
/*
 * tools/qa-teatro-c.js — verifica Playwright del feedback autore C sul Teatro delle Marionette.
 * Uso: node tools/qa-teatro-c.js [file html]
 * Osserva: errori di console; banner e cartiglio in alto (porta sud libera); nemici a ≥ STANZE_C.distanzaPorte
 * dalle porte (20 stanze generate + 20 stanze attraversate, col punto di entrata) e grazia d'ingresso;
 * E non apre la Stanza Segreta, 3 colpi sì; novità delle notti; Medaglione attivo solo dalla notte dopo.
 * Screenshot in production/qa/evidence/teatro-c-*.png. Stampa osservazioni in JSON, nessun verdetto.
 * Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const foto = (n) => path.join(RADICE, 'production', 'qa', 'evidence', `teatro-c-${n}.png`);

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const oss = {};
  const chiudi = async () => {
    for (let i = 0; i < 40; i++) {
      const d = await p.evaluate(() => window.__teatro.t4qa.dialogo);
      if (!d) return;
      await p.keyboard.press(d.scelta ? 'Digit1' : 'Space');
      await p.waitForTimeout(60);
    }
  };
  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  await p.keyboard.press('Space');
  await p.waitForTimeout(400);
  await chiudi();

  // Notte 1: hub; cartiglio di Tonino
  const ton = await p.evaluate(() => window.__teatro.t4qa.presenze.find((x) => x.id === 'tonino'));
  await p.evaluate((t) => { const P = window.__teatro.interni.player; P.x = t.x + 26; P.y = t.y + 4; }, ton);
  await p.waitForTimeout(120);
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(200);
  await p.screenshot({ path: foto('01-hub-notte1-cartiglio-tonino') });
  await chiudi();

  // Ingresso al piano
  const ing = await p.evaluate(() => window.__teatro.t4qa.ingresso);
  await p.evaluate((g) => { const P = window.__teatro.interni.player; P.x = g.x - 40; P.y = g.y; }, ing);
  await p.keyboard.down('KeyD'); await p.waitForTimeout(900); await p.keyboard.up('KeyD');
  await p.keyboard.press('Space');
  await p.waitForTimeout(300);
  oss.inGioco = await p.evaluate(() => window.__teatro.fase);

  // 1. banner + cartiglio attivi in stanza: porta sud libera
  await p.evaluate(() => {
    const I = window.__teatro.interni;
    I.statoRun.siparioAttivo = null;
    const st = I.statoRun.mappa.stanze.find((s) => s.porte.S) || I.statoRun.stanzaCorrente;
    I.statoRun.stanzaCorrente = st; st.pulita = true;
    I.player.x = 320; I.player.y = 200;
    I.mostraBanner('Banner di prova: Stanza ripulita! (+1 Carica Attivo [Q]) — il testo sta in alto sotto l\'HUD', 600);
  });
  await p.waitForTimeout(150);
  await p.screenshot({ path: foto('02-banner-porta-sud') });
  await p.evaluate(() => window.__teatro.t4qa.apriDialogoC('tonino', 'Cartiglio di prova: la porta sud deve restare visibile sotto di me.'));
  await p.waitForTimeout(150);
  await p.screenshot({ path: foto('03-cartiglio-porta-sud') });
  oss.cartiglio = await p.evaluate(() => window.__teatro.t4qa.dialogo);
  await chiudi();

  // 2a. 20 stanze generate (normali e boss con nemici): distanza dalle porte
  oss.generate = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const PORTE = { N: [320, 61], S: [320, 313], W: [59, 187], E: [581, 187] };
    const D = I.STANZE_C.distanzaPorte;
    const righe = [];
    for (let seme = 1; righe.length < 20 && seme < 200; seme++) {
      const m = I.mappaConSeme(1 + (seme % 4), seme * 7919);
      if (!m) continue;
      for (const s of m.stanze) {
        if (righe.length >= 20 || !s.nemici || !s.nemici.length) continue;
        const lati = new Set(Object.keys(s.porte)); if (s.muroSegreto) lati.add(s.muroSegreto.lato);
        let min = Infinity;
        for (const n of s.nemici) for (const l of lati) min = Math.min(min, Math.hypot(n.x - PORTE[l][0], n.y - PORTE[l][1]));
        righe.push({ tipo: s.tipo, nemici: s.nemici.length, minPx: Math.round(min) });
      }
    }
    return { D, stanze: righe.length, sotto: righe.filter((r) => r.minPx < D).length, minimo: Math.min(...righe.map((r) => r.minPx)), righe };
  });

  // 2b. 20 stanze attraversate davvero: entrata, porte, grazia
  oss.attraversate = [];
  for (let k = 0; k < 20; k++) {
    const r = await p.evaluate((k) => {
      const I = window.__teatro.interni;
      const st = I.statoRun.stanzaCorrente;
      st.pulita = true; I.statoRun.siparioAttivo = null; I.statoRun.pausa = false;
      const lati = Object.keys(st.porte);
      // preferisce una porta verso una stanza con nemici non ancora pulita (così si misura l'entrata vera)
      const conNemici = lati.filter((x) => { const d = I.statoRun.mappa.perId.get(st.porte[x]); return d && !d.pulita && d.nemici && d.nemici.length; });
      const l = conNemici.length ? conNemici[k % conNemici.length] : lati[k % lati.length];
      const pos = { N: [320, 80], S: [320, 296], W: [78, 188], E: [562, 188] }[l];
      I.player.x = pos[0]; I.player.y = pos[1];
      return l;
    }, k);
    await p.waitForTimeout(80);
    const m = await p.evaluate(() => {
      const I = window.__teatro.interni;
      const st = I.statoRun.stanzaCorrente;
      const PORTE = { N: [320, 61], S: [320, 313], W: [59, 187], E: [581, 187] };
      const lati = new Set(Object.keys(st.porte)); if (st.muroSegreto) lati.add(st.muroSegreto.lato);
      let minPorta = Infinity, minEntrata = Infinity;
      for (const n of st.nemici || []) {
        if (n.hp <= 0) continue;
        for (const l of lati) minPorta = Math.min(minPorta, Math.hypot(n.x - PORTE[l][0], n.y - PORTE[l][1]));
        minEntrata = Math.min(minEntrata, Math.hypot(n.x - I.player.x, n.y - I.player.y));
      }
      return { id: st.id, tipo: st.tipo, pulita: st.pulita, nemici: (st.nemici || []).filter((n) => n.hp > 0).length,
        minPorta: Math.round(minPorta), minEntrata: Math.round(minEntrata), grazia: I.statoRun.graziaIngressoC };
    });
    oss.attraversate.push({ lato: r, ...m });
    if (k === 1) await p.screenshot({ path: foto('04-ingresso-stanza-nemici-lontani') });
  }
  oss.attraversateSotto110 = oss.attraversate.filter((a) => a.nemici && (a.minPorta < 110 || a.minEntrata < 110)).length;

  // Grazia: un proiettile addosso subito dopo l'ingresso non toglie maschere
  oss.grazia = await p.evaluate(() => new Promise((ok) => {
    const I = window.__teatro.interni;
    I.statoRun.graziaIngressoC = 40; I.player.invuln = 0;
    const hp = I.statoRun.hpHalf;
    I.statoRun.proiettiliNemici.push({ x: I.player.x, y: I.player.y - 6, vx: 0.01, vy: 0, dist: 0 });
    setTimeout(() => ok({ hpPrima: hp, hpDopo: I.statoRun.hpHalf }), 120);
  }));

  // 3. Stanza Segreta: E non apre, 3 colpi sì
  oss.segreta = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const st = I.statoRun.mappa.stanze.find((s) => s.muroSegreto);
    st.pulita = true; st.muroSegreto.aperto = false; st.muroSegreto.colpi = 0;
    I.statoRun.stanzaCorrente = st;
    I.player.x = 320; I.player.y = 190;
    return { lato: st.muroSegreto.lato };
  });
  await p.waitForTimeout(100);
  for (let i = 0; i < 3; i++) { await p.keyboard.press('KeyE'); await p.waitForTimeout(80); }
  oss.segreta.dopoE = await p.evaluate(() => window.__teatro.interni.statoRun.stanzaCorrente.muroSegreto.aperto);
  await p.screenshot({ path: foto('05-segreta-nascosta-dopo-E') });
  await p.evaluate(() => {
    const I = window.__teatro.interni;
    const ms = I.statoRun.stanzaCorrente.muroSegreto;
    const pos = { N: [320, 96], S: [320, 280], W: [96, 188], E: [544, 188] }[ms.lato];
    I.player.x = pos[0]; I.player.y = pos[1];
  });
  await p.waitForTimeout(100);
  await p.screenshot({ path: foto('06-segreta-crepa-da-vicino') });
  oss.segreta.colpi = await p.evaluate(() => {
    const T = window.__teatroInterno; const st = T.statoRun.stanzaCorrente;
    const r = [];
    for (let i = 0; i < 3; i++) { T.colpisciMuroSegretoC(st, 320, 188); r.push(st.muroSegreto.aperto); }
    return r;
  });

  // 4 + 5. Medaglione restituito nella notte corrente, effetto dalla notte dopo; novità delle notti
  oss.medaglione = {};
  await p.evaluate(() => {
    const I = window.__teatro.interni;
    window.__teatro.t4qa.impostaFlag({ tonino_ricordo: 'restituito', medaglione_notte_c: I.getNumeroNotte() });
    I.nuovaRun(false);
  });
  oss.medaglione.stessaNotte = await p.evaluate(() => { const s = window.__teatro.interni.statoRun; return { notte: s.numeroNotte, eff: s.medaglioneC && s.medaglioneC.id, maxHpHalf: s.maxHpHalf }; });
  await p.evaluate(() => window.__teatro.interni.nuovaRun(true)); // notte successiva
  await p.waitForTimeout(200);
  await p.keyboard.press('Space');
  oss.medaglione.notteDopo = await p.evaluate(() => { const s = window.__teatro.interni.statoRun; return { notte: s.numeroNotte, eff: s.medaglioneC && s.medaglioneC.id, maxHpHalf: s.maxHpHalf, hpHalf: s.hpHalf, scudo: s.scudoRosaC }; });
  oss.medaglione.primoColpo = await p.evaluate(() => new Promise((ok) => {
    const I = window.__teatro.interni;
    I.statoRun.siparioAttivo = null; I.statoRun.graziaIngressoC = 0; I.statoRun.scudoRosaC = true; I.player.invuln = 0;
    const hp = I.statoRun.hpHalf;
    I.statoRun.proiettiliNemici.push({ x: I.player.x, y: I.player.y - 6, vx: 0.01, vy: 0, dist: 0 });
    setTimeout(() => {
      const hp1 = I.statoRun.hpHalf; I.player.invuln = 0;
      I.statoRun.proiettiliNemici.push({ x: I.player.x, y: I.player.y - 6, vx: 0.01, vy: 0, dist: 0 });
      setTimeout(() => ok({ hp, dopoPrimo: hp1, dopoSecondo: I.statoRun.hpHalf }), 150);
    }, 150);
  }));
  await p.screenshot({ path: foto('07-hud-benedizione-di-rosa') });
  oss.medaglione.slot = await p.evaluate(() => ({ ricordo: window.__teatroT3.salvataggi.leggiFlag('tonino_ricordo'), notte: window.__teatroT3.salvataggi.leggiFlag('medaglione_notte_c') }));
  // negato
  await p.evaluate(() => { const I = window.__teatro.interni; window.__teatro.t4qa.impostaFlag({ tonino_ricordo: 'negato', medaglione_notte_c: I.getNumeroNotte() - 1 }); I.nuovaRun(false); });
  oss.medaglione.oblio = await p.evaluate(() => { const s = window.__teatro.interni.statoRun; return { eff: s.medaglioneC && s.medaglioneC.id, maxHpHalf: s.maxHpHalf, dmg: +s.dmg.toFixed(2) }; });
  oss.notti = await p.evaluate(() => [1, 2, 3, 4, 5, 6].map((n) => window.__teatro.interni.effettiNotteC(n)));

  // Hub alla notte 4+ (buio, festaiola, Mariella, luna) e cartiglio di Tonino con l'effetto
  await p.evaluate(() => { const I = window.__teatro.interni; while (I.getNumeroNotte() < 4) I.incrementaNumeroNotte(); window.__teatro.t4qa.impostaFlag({ tonino_ricordo: 'restituito', medaglione_notte_c: 1 }); });
  await p.evaluate(() => { const I = window.__teatro.interni; I.statoRun.hpHalf = 0; window.__teatro.t4qa.morteForzata(); });
  await p.waitForTimeout(800);
  await p.screenshot({ path: foto('08-morte-testo-in-alto') });
  await p.waitForTimeout(5000);
  await chiudi();
  oss.hubNotte = await p.evaluate(() => ({ fase: window.__teatro.fase, notte: window.__teatro.interni.getNumeroNotte(), presenze: window.__teatro.t4qa.presenze.map((x) => x.id) }));
  await p.screenshot({ path: foto('09-hub-notte-avanzata') });
  await p.evaluate((t) => { const P = window.__teatro.interni.player; P.x = t.x + 26; P.y = t.y + 4; }, ton);
  await p.waitForTimeout(120);
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(200);
  for (let i = 0; i < 12; i++) {
    const d = await p.evaluate(() => window.__teatro.t4qa.dialogo);
    if (!d || d.chi === 'tonino' || d.scelta) break;
    await p.keyboard.press('Space'); await p.waitForTimeout(80);
  }
  oss.toninoNotte = await p.evaluate(() => window.__teatro.t4qa.dialogo);
  await p.screenshot({ path: foto('10-cartiglio-tonino-benedizione') });
  await chiudi();
  const fest = await p.evaluate(() => window.__teatro.t4qa.presenze.find((x) => x.id === 'assunta' || x.id === 'festaiola'));
  if (fest) {
    await p.evaluate((t) => { const P = window.__teatro.interni.player; P.x = t.x - 26; P.y = t.y + 4; }, fest);
    await p.waitForTimeout(120);
    await p.keyboard.press('KeyE');
    await p.waitForTimeout(200);
    oss.festaiola = await p.evaluate(() => window.__teatro.t4qa.dialogo);
    await p.screenshot({ path: foto('11-festaiola') });
    await chiudi();
  }
  oss.errori = errori;
  console.log(JSON.stringify(oss, null, 1));
  await browser.close();
})();
