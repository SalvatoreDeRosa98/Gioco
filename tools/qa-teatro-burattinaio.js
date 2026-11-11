#!/usr/bin/env node
/*
 * tools/qa-teatro-burattinaio.js — verifica Playwright della squadra d1 (gioco/teatro/d1-burattinaio.js):
 *   1. lo scontro parte (ingresso di prova con 0 e con 3 sigilli) in una stanza 'boss' vera, barra del capo;
 *   2. le mani attaccano davvero (posa a pugno, poi colpo) e senza segni a terra;
 *   3. gli atti avanzano infliggendo danno: I mani → II mani + marionette d'élite → III forbici;
 *   4. vittoria: scena, poi fine() → finale narrato di b8, e ritorno pulito;
 *   5. pausa (Esc) ferma lo scontro; morte durante lo scontro → flusso di morte normale → hub;
 *   6. l'aggancio vero di b8 (entraSopraLaRibalta) usa lo scontro; nessun errore in ERRORI_TEATRO.
 *
 * Uso: node tools/qa-teatro-burattinaio.js <file html> [prefisso screenshot]
 * Screenshot <prefisso>-NN-nome.png. Esce con 1 se un controllo fallisce.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-burattinaio');
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
  const S = () => p.evaluate(() => window.__teatro.interni.burattinaioD1.stato());
  const fase = () => p.evaluate(() => statoRun.fase);
  const aspetta = async (cond, ms = 15000, passo = 100) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await p.evaluate(cond)) return true; await p.waitForTimeout(passo); }
    return false;
  };
  const immortale = () => p.evaluate(() => { statoRun.maxHpHalf = 99; statoRun.hpHalf = 99; });
  const avvio = async () => {
    await p.goto('file://' + file);
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
    await p.reload();
    await p.waitForTimeout(500);
    await p.keyboard.press('Space'); // menu → hub
    await p.waitForTimeout(400);
  };

  // ---- 1. Zero sigilli: ingresso, attacchi, atti, vittoria ----
  await avvio();
  ok('hub-prima', (await fase()) === 'hub', await fase());
  await p.evaluate(() => window.__teatro.interni.provaBurattinaioD1(0));
  await p.waitForTimeout(300);
  let s = await S();
  const ing = await p.evaluate(() => ({ fase: statoRun.fase, tipo: statoRun.stanzaCorrente.tipo, arena: Boolean(statoRun.stanzaCorrente.arenaD1), primo: statoRun.stanzaCorrente.nemici.find((n) => n.boss && n.hp > 0).nome }));
  ok('ingresso', ing.fase === 'in_gioco' && ing.tipo === 'boss' && ing.arena, ing);
  ok('barra-col-nome', ing.primo === 'Il Grande Burattinaio', ing.primo);
  ok('atto-1-due-mani', s.atto === 1 && s.parti.filter((x) => x.id === 'gb-mano').length === 2, s);
  ok('zero-sigilli', !s.sigilli.tenaglie && !s.sigilli.punzone && !s.sigilli.lima, s.sigilli);
  await immortale();
  await p.waitForTimeout(2200);
  await p.screenshot({ path: foto('01-atto1') });
  const pugno = await aspetta(() => window.__teatro.interni.burattinaioD1.stato().parti.some((x) => x.fase === 'pugno'), 12000, 50);
  ok('mano-a-pugno', pugno);
  await p.screenshot({ path: foto('02-pugno') });
  const colpo = await aspetta(() => window.__teatro.interni.burattinaioD1.stato().parti.some((x) => x.fase === 'terra'), 6000, 50);
  ok('mano-a-terra', colpo);
  await p.screenshot({ path: foto('03-schianto') });

  // pausa: lo scontro si ferma
  await p.keyboard.press('Escape');
  await p.waitForTimeout(150);
  const p1 = await p.evaluate(() => ({ pausa: statoRun.pausa, t: window.__teatro.interni.burattinaioD1.stato().parti.map((x) => x.fase + x.x + x.y).join() }));
  await p.waitForTimeout(600);
  const p2 = await p.evaluate(() => window.__teatro.interni.burattinaioD1.stato().parti.map((x) => x.fase + x.x + x.y).join());
  ok('pausa-ferma', p1.pausa && p1.t === p2, { p1, p2 });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  ok('pausa-tolta', !(await p.evaluate(() => statoRun.pausa)));

  // atto II
  await p.evaluate(() => window.__teatro.interni.burattinaioD1.danneggia(500));
  ok('atto-2', await aspetta(() => window.__teatro.interni.burattinaioD1.stato().atto === 2, 3000));
  await immortale();
  const marionette = await aspetta(() => window.__teatro.interni.burattinaioD1.stato().parti.some((x) => x.elite), 12000);
  ok('marionette-elite', marionette, (await S()).parti);
  await p.waitForTimeout(900);
  await p.screenshot({ path: foto('04-atto2') });
  const presa = await aspetta(() => window.__teatro.interni.burattinaioD1.stato().parti.some((x) => x.fase === 'segui' || x.fase === 'chiude' || x.fase === 'tiene'), 15000, 50);
  ok('presa-tentata', presa);
  await p.screenshot({ path: foto('05-presa') });

  // atto III
  await p.evaluate(() => window.__teatro.interni.burattinaioD1.danneggia(500));
  ok('atto-3', await aspetta(() => window.__teatro.interni.burattinaioD1.stato().atto === 3, 3000));
  ok('marionette-cadute', !(await S()).parti.some((x) => x.elite));
  await immortale();
  const apre = await aspetta(() => window.__teatro.interni.burattinaioD1.stato().parti.some((x) => x.id === 'gb-forbici' && x.fase === 'apre'), 12000, 50);
  ok('forbici-aprono', apre);
  await p.waitForTimeout(400);
  await p.screenshot({ path: foto('06-forbici') });
  const piantate = await aspetta(() => window.__teatro.interni.burattinaioD1.stato().parti.some((x) => x.id === 'gb-forbici' && x.fase === 'piantate'), 8000, 50);
  ok('forbici-tagliano', piantate);
  await p.screenshot({ path: foto('07-taglio') });

  // vittoria
  const capoPrima = (await S()).capo;
  await p.evaluate(() => window.__teatro.interni.burattinaioD1.danneggia(999));
  ok('vittoria-scena', await aspetta(() => window.__teatro.interni.burattinaioD1.stato().vittoria, 3000));
  await p.waitForTimeout(1300);
  await p.screenshot({ path: foto('08-vittoria') });
  ok('fine-chiamata', await aspetta(() => window.__teatro.interni.burattinaioD1.stato().esito === 'vittoria', 8000), capoPrima);
  await p.waitForTimeout(600);
  const dopo = await p.evaluate(() => ({ attivo: window.__teatro.interni.burattinaioD1.stato().attivo, fase: statoRun.fase }));
  ok('scontro-spento', !dopo.attivo, dopo);
  await p.screenshot({ path: foto('09-finale-narrato') });
  // il finale narrato va avanti a Spazio fino al ritorno
  for (let i = 0; i < 80 && (await fase()) === 'in_gioco'; i++) { await p.keyboard.press('Space'); await p.waitForTimeout(120); }
  const fin = await fase();
  ok('ritorno-dopo-finale', fin === 'hub' || fin === 'menu_selezione', fin);
  ok('volto-ritrovato', await p.evaluate(() => Boolean(window.__teatro.interni.finaliB8.stato().segretoVisto)));

  // ---- 2. Tre sigilli e morte ----
  await avvio();
  await p.evaluate(() => window.__teatro.interni.provaBurattinaioD1(3));
  await p.waitForTimeout(300);
  s = await S();
  ok('tre-sigilli', s.sigilli.tenaglie && s.sigilli.punzone && s.sigilli.lima, s.sigilli);
  await p.evaluate(() => { statoRun.hpHalf = 1; });
  const morto = await aspetta(() => statoRun.fase !== 'in_gioco', 25000, 100);
  ok('morte-dal-burattinaio', morto && (await fase()) === 'morte', await fase());
  await p.screenshot({ path: foto('10-morte') });
  ok('torna-hub', await aspetta(() => statoRun.fase === 'hub', 20000), await fase());
  await p.waitForTimeout(300);
  ok('stato-pulito-dopo-morte', !(await S()).attivo, await S());
  await p.screenshot({ path: foto('11-hub-dopo-morte') });

  // ---- 3. Aggancio vero di b8 ----
  const via = await p.evaluate(() => window.__teatro.interni.entraSopraLaRibalta());
  ok('aggancio-b8-scontro', via === 'scontro' && (await S()).attivo, via);
  ok('aggancio-ingresso-gioco', (await fase()) === 'in_gioco');

  const E = await p.evaluate(() => (typeof ERRORI_TEATRO !== 'undefined' ? ERRORI_TEATRO.map((e) => String(e.messaggio || e.msg || e)) : []));
  ok('nessun-errore-teatro', E.length === 0, E);
  ok('nessun-errore-console', errori.length === 0, errori.slice(0, 5));

  await browser.close();
  const falliti = esiti.filter((e) => !e.ok);
  for (const e of esiti) console.log(`${e.ok ? 'OK  ' : 'NO  '} ${e.caso}${!e.ok && e.dati !== undefined ? ' ' + JSON.stringify(e.dati).slice(0, 400) : ''}`);
  console.log(`\n${esiti.length - falliti.length}/${esiti.length} controlli superati`);
  process.exit(falliti.length ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
