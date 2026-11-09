#!/usr/bin/env node
/*
 * tools/qa-teatro-progressione.js — verifica Playwright del miglioramento 6 (gioco/teatro/a6-progressione.js):
 * sblocchi dei personaggi e degli oggetti, migrazione degli slot, notifica «SBLOCCATO», segni di completamento,
 * sbloccaTutto()/azzeraSblocchi().
 *
 * Uso: node tools/qa-teatro-progressione.js <file html> [prefisso screenshot]
 * Screenshot <prefisso>-01-menu-bloccati.png, -02-notifica.png, -03-menu-segni.png (prefisso = percorso).
 * Esce con 1 se un controllo fallisce. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-progressione');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });
  const fase = () => p.evaluate(() => window.__teatro.fase);
  const sb = (id) => p.evaluate((id) => window.__teatro.interni.progressione.personaggioSbloccato(id), id);
  const alMenu = async () => {
    await p.evaluate(() => { const R = window.__teatro.interni.statoRun; R.pausa = false; R.fase = 'menu_selezione'; R.siparioAttivo = null; });
    await p.waitForTimeout(150);
  };

  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);

  // 1. Partenza pulita: solo Ferruccio
  ok('ferruccio-sempre', await sb('ferruccio'));
  ok('agnese-bloccata', !(await sb('agnese')));
  ok('taddeo-bloccato', !(await sb('taddeo')));
  ok('ombra-bloccata', !(await sb('ombra')));
  await p.keyboard.press('Digit2');
  await p.waitForTimeout(200);
  await p.screenshot({ path: foto('01-menu-bloccati') });
  await p.keyboard.press('Enter');
  await p.waitForTimeout(300);
  ok('non-parte-con-bloccato', (await fase()) === 'menu_selezione', await fase());

  // 2. Oggetti bloccati fuori dal pool della run
  const pool = await p.evaluate(() => {
    const I = window.__teatro.interni; const bloccati = I.SBLOCCHI_A6.filter((s) => s.cosa.oggetto).map((s) => s.cosa.oggetto);
    let trovati = 0, taglia = 0;
    for (let i = 0; i < 40; i++) {
      inizializzaPoolRunB(null);
      taglia = I.statoRun.poolRunB.ids.length;
      trovati += I.statoRun.poolRunB.ids.filter((id) => bloccati.includes(id)).length;
    }
    return { trovati, taglia, dimensione: I.OGGETTI_B.dimensionePool };
  });
  ok('pool-senza-oggetti-bloccati', pool.trovati === 0 && pool.taglia === pool.dimensione, pool);

  // 3. Ferruccio parte e arriva all'hub; parlare con Tonino sblocca il Burattino di Tonino
  await p.keyboard.press('Digit1');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(400);
  ok('ferruccio-parte-hub', (await fase()) === 'hub', await fase());
  for (let i = 0; i < 30 && (await p.evaluate(() => window.__teatro.t4qa.dialogo)); i++) { await p.keyboard.press('Space'); await p.waitForTimeout(40); }
  await p.evaluate(() => {
    const t = window.__teatro.t4qa.presenze.find((x) => x.id === 'tonino');
    const P = window.__teatro.interni.player; P.x = t.x + 22; P.y = t.y;
  });
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(500);
  const dopoTonino = await p.evaluate(() => window.__teatro.interni.progressione.stato);
  ok('parlato-tonino', dopoTonino.parlato.tonino && dopoTonino.sbloccati['ogg-burattino-tonino'], dopoTonino);
  for (let i = 0; i < 30 && (await p.evaluate(() => window.__teatro.t4qa.dialogo)); i++) { await p.keyboard.press('Space'); await p.waitForTimeout(40); }

  // 4. In gioco: boss sconfitto (gancio vero t4Gancio) → segno per Ferruccio, Taddeo sbloccato, notifica
  await p.evaluate(() => { window.__teatro.interni.nuovaRun(false); });
  await p.waitForTimeout(200);
  await p.evaluate(() => { window.__teatro.interni.statoRun.siparioAttivo = null; window.__teatro.interni.statoRun.cartiglioD = null; });
  await p.evaluate(() => { t4Gancio('bossSconfitto', { nemici: [{ boss: true, bossId: 'capitano-guardia', x: 320, y: 180 }], oggettiATerra: [] }); });
  // la notifica del Burattino (hub) può essere ancora in corso: si aspetta quella di Taddeo nella coda
  for (let i = 0; i < 60; i++) {
    const n = await p.evaluate(() => window.__teatro.interni.progressione.notifica);
    if (n && /Taddeo/.test(n.nome)) break;
    await p.waitForTimeout(150);
  }
  await p.waitForTimeout(400);
  const dopoBoss = await p.evaluate(() => ({ st: window.__teatro.interni.progressione.stato, notifica: window.__teatro.interni.progressione.notifica }));
  ok('segno-ferruccio-capitano', (dopoBoss.st.segni.ferruccio || []).includes('capitano-guardia'), dopoBoss.st.segni);
  ok('taddeo-sbloccato-dal-boss', dopoBoss.st.sbloccati.taddeo);
  ok('notifica-sbloccato', dopoBoss.notifica && /Taddeo/.test(dopoBoss.notifica.nome + dopoBoss.notifica.testo), dopoBoss.notifica);
  await p.screenshot({ path: foto('02-notifica') });

  // 5. Il salvataggio T4 (ponte inline) non riscrive una copia vecchia della progressione
  await p.evaluate(() => window.__teatro.t4qa.impostaFlag({ registro: null }));
  const dopoT4 = await p.evaluate(() => window.__teatro.interni.progressione.stato);
  ok('flag-t4-non-cancellano-progressione', dopoT4.sbloccati.taddeo && (dopoT4.segni.ferruccio || []).length === 1, dopoT4);

  // 6. Persistenza dopo ricarica, Taddeo giocabile, segni nel menu
  await p.reload();
  await p.waitForTimeout(500);
  ok('taddeo-dopo-ricarica', await sb('taddeo'));
  ok('agnese-ancora-bloccata', !(await sb('agnese')));
  await p.keyboard.press('Digit3');
  await p.waitForTimeout(200);
  await p.screenshot({ path: foto('03-menu-segni') });
  await p.keyboard.press('Enter');
  await p.waitForTimeout(400);
  ok('taddeo-parte', (await fase()) === 'hub', await fase());

  // 7. Migrazione: uno slot vecchio che ha giocato con Agnese la ritrova sbloccata
  await alMenu();
  await p.evaluate(() => {
    localStorage.setItem('ferruccio.teatro.slot.3', JSON.stringify({ versione: 1, personaggio: 'agnese', pianoMassimo: 2, scintille: 1, flag: {}, data: new Date().toISOString() }));
  });
  await p.reload();
  await p.waitForTimeout(400);
  await p.evaluate(() => window.__teatroT3.salvataggi.scegli(3));
  await p.waitForTimeout(300);
  ok('migrazione-agnese', await sb('agnese'));
  ok('migrazione-solo-agnese', !(await sb('ombra')) && !(await sb('taddeo')));

  // 8. sbloccaTutto / azzeraSblocchi
  await p.evaluate(() => window.__teatro.interni.sbloccaTutto());
  ok('sblocca-tutto', (await sb('ombra')) && (await sb('taddeo')));
  await p.keyboard.press('Digit4');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(400);
  ok('ombra-parte-con-sbloccatutto', (await fase()) === 'hub', await fase());
  await alMenu();
  await p.evaluate(() => window.__teatro.interni.azzeraSblocchi());
  ok('azzera-sblocchi', !(await sb('agnese')) && !(await sb('ombra')) && (await sb('ferruccio')));
  ok('azzera-torna-a-ferruccio', (await p.evaluate(() => window.__teatro.interni.statoRun.personaggioId)) === 'ferruccio');

  await browser.close();
  console.log(JSON.stringify({ file: path.relative(RADICE, file), esiti, errori }, null, 1));
  process.exit(esiti.every((e) => e.ok) && !errori.length ? 0 : 1);
})();
