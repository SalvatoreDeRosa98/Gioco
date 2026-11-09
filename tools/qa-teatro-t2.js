#!/usr/bin/env node
/*
 * tools/qa-teatro-t2.js — verifica Playwright del passo T2 (sprite dei fogli dell'autore nel Teatro).
 *
 * Uso: node tools/qa-teatro-t2.js <file html> <prefisso>   (es. gioco/teatro_marionette.html sorgente)
 * Apre la pagina da file://, conta gli errori di console, fotografa il menu dei personaggi, avvia una
 * partita con Agnese, mette nella stanza un gatto e una guardia e fotografa la partita (sprite e, per
 * confronto, il disegno pittorico di prima con i ganci T2 spenti). Screenshot in
 * production/qa/evidence/teatro-t2-<prefisso>-*.png. Esce con codice 1 se ci sono errori di console o se
 * i 12 fogli non risultano caricati.
 * Chromium preinstallato nella sessione: non serve (e non si deve) lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || 'sorgente';
const EVID = path.join(RADICE, 'production', 'qa', 'evidence');

(async () => {
  const browser = await chromium.launch();
  const pagina = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errori = [];
  pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  pagina.on('pageerror', (e) => errori.push(String(e)));
  await pagina.goto('file://' + file);
  await pagina.waitForFunction(() => window.__teatro && window.__teatro.t2 && window.__teatro.t2.caricati.length === 12, null, { timeout: 8000 })
    .catch(() => {});
  const caricati = await pagina.evaluate(() => (window.__teatro && window.__teatro.t2 ? window.__teatro.t2.caricati : []));
  await pagina.waitForTimeout(400);
  const tela = pagina.locator('canvas#c');
  await tela.screenshot({ path: path.join(EVID, `teatro-t2-${prefisso}-menu.png`) });

  // Partita con Agnese, un gatto e una guardia nella stanza d'ingresso.
  await pagina.evaluate(() => {
    const I = window.__teatro.interni;
    I.selezionaPersonaggio('agnese');
    I.nuovaRun();
    I.statoRun.fase = 'in_gioco';
    I.statoRun.siparioAttivo = null;
    const st = I.statoRun.stanzaCorrente;
    const base = { boss: false, flash: 0, burnTicks: 0, stunTicks: 0, state: 'idle', stateTimer: 40, maskOpen: false, r: 11 };
    st.nemici.length = 0;
    st.nemici.push({ ...base, id: 'qa-gatto', tipo: 'gatto', nome: 'Gatto del Velo', x: 230, y: 170, hp: 99, maxHp: 99, speed: 0, shootCd: 9999 });
    st.nemici.push({ ...base, id: 'qa-guardia', tipo: 'guardia', nome: 'Guardia di Piombo', x: 420, y: 170, hp: 99, maxHp: 99, speed: 0, shootCd: 9999 });
    I.player.x = 320; I.player.y = 220;
  });
  await pagina.waitForTimeout(500);
  await tela.screenshot({ path: path.join(EVID, `teatro-t2-${prefisso}-partita.png`) });
  // Smoothing spento, per il confronto (CONFIG.liscio)
  await pagina.evaluate(() => { window.__t2Liscio = false; });
  await pagina.waitForTimeout(150);
  await tela.screenshot({ path: path.join(EVID, `teatro-t2-${prefisso}-partita-nitido.png`) });
  await pagina.evaluate(() => { delete window.__t2Liscio; });
  // Confronto con il disegno pittorico di prima (ganci T2 spenti)
  await pagina.evaluate(() => { window.__qaT2 = window.__teatro.t2; window.__teatro.t2 = null; });
  await pagina.waitForTimeout(150);
  await tela.screenshot({ path: path.join(EVID, `teatro-t2-${prefisso}-partita-pittorico.png`) });
  await pagina.evaluate(() => { window.__teatro.t2 = window.__qaT2; });
  // Il gatto balza e la guardia spara: pose in movimento; poi un colpo alla guardia (morte)
  await pagina.evaluate(() => {
    const st = window.__teatro.interni.statoRun.stanzaCorrente;
    st.nemici[0].shootCd = 12; st.nemici[1].shootCd = 10;
  });
  await pagina.waitForTimeout(250);
  await tela.screenshot({ path: path.join(EVID, `teatro-t2-${prefisso}-pose.png`) });
  await pagina.evaluate(() => { window.__teatro.interni.statoRun.stanzaCorrente.nemici[1].hp = 0; });
  await pagina.waitForTimeout(120);
  await tela.screenshot({ path: path.join(EVID, `teatro-t2-${prefisso}-morte.png`) });
  await pagina.waitForTimeout(800);

  await browser.close();
  console.log(JSON.stringify({ file: path.relative(RADICE, file), caricati: caricati.length, errori }, null, 1));
  process.exit(errori.length === 0 && caricati.length === 12 ? 0 : 1);
})();
