#!/usr/bin/env node
/*
 * tools/qa-teatro-t4.js — verifica Playwright del passo T4 riattivato (hub, storia, morte e risveglio).
 *
 * Uso: node tools/qa-teatro-t4.js <file html> [prefisso screenshot]
 * A 1920x1080 da file://: errori di console; menu → hub (Voce nel cartiglio); Tonino; menu ESC nell'hub;
 * ingresso al piano; morte vera (proiettile nemico) → lanterne → hub con la notte successiva;
 * Medaglione forzato via t4qa → scelta da Tonino → flag nello slot T3, ritrovato dopo il reload.
 * Screenshot in production/qa/evidence/teatro-t4r-[<prefisso>-]*.png. Stampa osservazioni in JSON.
 * Chromium preinstallato nella sessione: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] ? process.argv[3] + '-' : '';
// un prefisso assoluto (es. cartella scratchpad) scrive lì, fuori dal repo
const foto = (n) => (path.isAbsolute(process.argv[3] || '') ? process.argv[3] + '-' + n + '.png'
  : path.join(RADICE, 'production', 'qa', 'evidence', `teatro-t4r-${prefisso}${n}.png`));

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const oss = {};
  const stato = () => p.evaluate(() => ({ fase: window.__teatro.fase, d: window.__teatro.t4qa.dialogo, notte: window.__teatro.interni.statoRun.numeroNotte, pausa: window.__teatro.interni.statoRun.pausa }));
  const chiudiDialogo = async () => {
    for (let i = 0; i < 40; i++) {
      const s = await stato();
      if (!s.d) return i;
      await p.keyboard.press(s.d.scelta ? 'Digit1' : 'Space');
      await p.waitForTimeout(60);
    }
    return -1;
  };

  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  await p.keyboard.press('Space');
  await p.waitForTimeout(400);
  oss.hub = await stato();
  await p.screenshot({ path: foto('01-hub-voce') });
  oss.battuteIngresso = await chiudiDialogo();

  // Tonino
  const ton = await p.evaluate(() => window.__teatro.t4qa.presenze.find((x) => x.id === 'tonino'));
  await p.evaluate((t) => { const P = window.__teatro.interni.player; P.x = t.x + 26; P.y = t.y + 4; }, ton);
  await p.waitForTimeout(150);
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(200);
  oss.tonino = await stato();
  await p.screenshot({ path: foto('02-dialogo-tonino') });
  await chiudiDialogo();

  // Menu ESC dell'autore nell'hub
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  oss.escHub = await stato();
  await p.screenshot({ path: foto('03-hub-menu-esc') });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(150);
  oss.escHubChiuso = (await stato()).pausa;

  // Ingresso al piano
  const ing = await p.evaluate(() => window.__teatro.t4qa.ingresso);
  await p.evaluate((g) => { const P = window.__teatro.interni.player; P.x = g.x - 40; P.y = g.y; }, ing);
  await p.keyboard.down('KeyD');
  await p.waitForTimeout(900);
  await p.keyboard.up('KeyD');
  oss.piano = { ...(await stato()), stanza: await p.evaluate(() => window.__teatro.stanza) };
  await p.screenshot({ path: foto('04-piano1') });
  await p.keyboard.press('Space'); // alza il sipario
  await p.waitForTimeout(200);

  // Morte vera: maschere a 1/2, un proiettile nemico addosso
  const notteprima = (await stato()).notte;
  await p.evaluate(() => {
    const I = window.__teatro.interni;
    I.statoRun.siparioAttivo = null;
    I.statoRun.hpHalf = 1; I.player.invuln = 0;
    I.statoRun.proiettiliNemici.push({ x: I.player.x, y: I.player.y - 6, vx: 0.01, vy: 0, dist: 0 });
  });
  await p.waitForTimeout(700);
  oss.morte = { ...(await stato()), seq: await p.evaluate(() => window.__teatro.t4qa.morte) };
  await p.screenshot({ path: foto('05-morte-lanterne') });
  await p.waitForTimeout(4200);
  oss.risveglio = { ...(await stato()), notteprima };
  await p.waitForTimeout(1200);
  await p.screenshot({ path: foto('06-risveglio-hub') });
  await chiudiDialogo();

  // Medaglione forzato → scelta da Tonino
  await p.evaluate(() => window.__teatro.t4qa.impostaFlag({ medaglione_in_mano: true }));
  await p.evaluate((t) => { const P = window.__teatro.interni.player; P.x = t.x + 26; P.y = t.y + 4; }, ton);
  await p.waitForTimeout(150);
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(150);
  const passi = [];
  for (let i = 0; i < 20; i++) {
    const s = await stato();
    if (!s.d) break;
    passi.push(s.d.scelta ? 'SCELTA:' + s.d.scelta.join('|') : s.d.chi);
    if (s.d.scelta) { await p.screenshot({ path: foto('07-scelta-tonino') }); await p.keyboard.press('Digit1'); }
    else await p.keyboard.press('Space');
    await p.waitForTimeout(80);
  }
  oss.scelta = { passi, flag: await p.evaluate(() => window.__teatro.t4qa.flag.tonino_ricordo) };
  await p.reload();
  await p.waitForTimeout(500);
  oss.dopoReload = await p.evaluate(() => {
    const sv = window.__teatroT3.salvataggi;
    return { slot: sv.slotAttivo, flagSlot: sv.leggiFlag('tonino_ricordo'), lettera: sv.leggiFlag('lettera_agnese'), notte: window.__teatro.interni.statoRun.numeroNotte };
  });
  await p.keyboard.press('Space');
  await p.waitForTimeout(300);
  oss.dopoReload.t4flag = await p.evaluate(() => window.__teatro.t4qa.flag.tonino_ricordo);
  await p.screenshot({ path: foto('08-hub-dopo-reload') });

  oss.errori = errori;
  console.log(JSON.stringify(oss, null, 1));
  await browser.close();
})();
