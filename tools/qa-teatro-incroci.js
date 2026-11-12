#!/usr/bin/env node
/*
 * tools/qa-teatro-incroci.js — verifica Playwright degli INCROCI fra le parti del Teatro (d1..d7):
 * casi in cui due file che avvolgono le stesse funzioni si pestano i piedi.
 * Uso: node tools/qa-teatro-incroci.js [file html] [prefisso screenshot]
 *  1. Maglio di Taddeo (d2) contro le mani del Grande Burattinaio (d1) posate a terra: deve ferirle.
 *  2. Generatore deterministico con d5 (quadri, botole) e d4 (Buca): stesso seme, stessa mappa.
 *  3. Mossa di Agnese (d2) ferma in pausa.
 *  4. Arena del Burattinaio (d1): dopo il disegno st.tipo resta 'boss' e le parti restano in st.nemici.
 * Esce con 1 se un controllo salta o ci sono errori (console o pagina).
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');

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

  // 1. maglio contro le mani a terra
  const maglio = await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun;
    R.fase = 'in_gioco'; I.nuovaRun(false); R.siparioAttivo = null; I.provaBurattinaioD1(3);
    R.personaggioId = 'taddeo'; // dopo: la prova dello scontro rimette il personaggio della run
    const B = I.burattinaioD1, st = R.stanzaCorrente;
    let mano = null;
    for (let i = 0; i < 1500 && !mano; i++) {
      B.saltaIntermezzo(); I.player.invuln = 99; I.player.x = 320; I.player.y = 330; passoLogico();
      mano = st.nemici.find((n) => n.bossId === 'gb-mano' && n.hp > 0 && n.faseD1 === 'terra' && n.airZ === 22);
    }
    if (!mano) return { trovata: false };
    const hp0 = mano.hp, z = mano.airZ;
    I.player.x = mano.x - 20; I.player.y = mano.y + 6; I.player.cooldown = 0; I.player.invuln = 99;
    const c0 = I.personaggiD2.d2.colpiMaglio;
    eseguiAttacco4Direzioni(1, 0);
    tick++; // lo sparo è stato lasciato: alla fine del passo parte il maglio
    passoLogico();
    return { trovata: true, hp0, hp1: mano.hp, airZ: z, colpi: I.personaggiD2.d2.colpiMaglio - c0 };
  });
  ok('1. trovata una mano a terra (airZ 22)', maglio.trovata, maglio);
  if (maglio.trovata) {
    ok('1. il maglio è partito', maglio.colpi === 1, maglio);
    ok('1. il maglio ferisce la mano a terra', maglio.hp1 < maglio.hp0, maglio);
  }

  // 2. determinismo del generatore con d4 e d5
  const det = await p.evaluate(() => {
    const I = window.__teatro.interni, diversi = [];
    for (let piano = 1; piano <= 4; piano++) I.mappaConSeme(piano, 1); // la prima generazione di un piano sceglie boss e pozioni (consuma il seme): fuori dal confronto
    const firma = (m) => JSON.stringify(m.stanze.map((s) => [s.id, s.tipo, s.cx, s.cy, Boolean(s.quadriD5), s.botoleD5 ? s.botoleD5.lista.length : 0,
      s.bucaD4 ? s.bucaD4.ondateTot : 0, (s.nemici || []).map((n) => n.tipo).join()]));
    for (let piano = 1; piano <= 4; piano++) for (let seme = 1; seme <= 6; seme++) {
      // stessa sequenza di chiamate → stessa mappa: prima di ogni chiamata si rimette il pool segreto della run, che la
      // generazione legge e svuota. Quel pool NON fa parte del seme: in una run vera la mappa di un piano dipende anche da
      // cosa i piani precedenti ne hanno già preso (voluto, non è un guasto di d4-d6). Rosa dei boss e pozioni sono già
      // fisse dopo il riscaldamento qui sopra.
      const R = I.statoRun, pool = Array.isArray(R.poolSegreto) ? R.poolSegreto.slice() : R.poolSegreto;
      const rimetti = () => { R.poolSegreto = Array.isArray(pool) ? pool.slice() : pool; };
      rimetti(); const a = firma(I.mappaConSeme(piano, seme * 2654435761));
      rimetti(); const b = firma(I.mappaConSeme(piano, seme * 2654435761));
      if (a !== b) diversi.push([piano, seme]);
    }
    return diversi;
  });
  ok('2. stesso seme, stessa mappa (24 mappe)', det.length === 0, det);

  // 3. mossa di Agnese in pausa
  const mossa = await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun;
    R.fase = 'in_gioco'; I.nuovaRun(false); R.siparioAttivo = null; R.personaggioId = 'agnese';
    avviaPiano(1, false); R.siparioAttivo = null;
    const premi = () => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft' })); };
    I.player.invuln = 0; I.personaggiD2.d2.ricarica = 0; R.pausa = true; premi();
    const inPausa = I.personaggiD2.d2.giro; R.pausa = false;
    I.personaggiD2.d2.ricarica = 0; premi();
    return { inPausa, libera: I.personaggiD2.d2.giro };
  });
  ok('3. niente piroetta in pausa', mossa.inPausa === 0, mossa);
  ok('3. piroetta fuori pausa', mossa.libera > 0, mossa);

  // 4. arena: tipo e parti dopo il disegno
  const arena = await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun;
    R.fase = 'in_gioco'; I.nuovaRun(false); R.siparioAttivo = null; R.personaggioId = 'ferruccio';
    I.provaBurattinaioD1(3);
    for (let i = 0; i < 300; i++) { I.burattinaioD1.saltaIntermezzo(); I.player.invuln = 99; passoLogico(); }
    const st = R.stanzaCorrente, n0 = st.nemici.length;
    disegnaFrame(16);
    return { tipo: st.tipo, n0, n1: st.nemici.length };
  });
  ok('4. dopo il disegno l\'arena è ancora «boss» con tutte le parti', arena.tipo === 'boss' && arena.n0 === arena.n1 && arena.n0 > 1, arena);

  ok('nessun errore in console', errori.length === 0, errori.slice(0, 5));
  await browser.close();
  let rosso = 0;
  for (const e of esiti) { if (!e.ok) rosso++; console.log(`${e.ok ? 'OK  ' : 'NO  '} ${e.nome}${e.ok ? '' : ' ' + JSON.stringify(e.info)}`); }
  console.log(rosso ? `${rosso} controlli saltati` : 'tutto a posto');
  process.exit(rosso ? 1 : 0);
})();
