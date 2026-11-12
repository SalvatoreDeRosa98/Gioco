#!/usr/bin/env node
/*
 * tools/qa-teatro-t5.js — verifica Playwright del passo T5 (risoluzione interna alta, logica a 640x360).
 *
 * Uso: node tools/qa-teatro-t5.js <file html> [prefisso screenshot|-] [file html di riferimento]
 * Per due configurazioni (1920x1080 dpr 1, 1280x720 dpr 2): errori di console, dimensione a schermo e
 * buffer del canvas, menu → click del mouse su un personaggio (selezione) → secondo click (partita) →
 * frecce (attacco), posizione dopo 1 s di D tenuto (confrontata, se dato, con il file di riferimento).
 * Screenshot a 1920x1080 in production/qa/evidence/teatro-hd-[<prefisso>-]{menu,gioco}.png
 * ('-' = nessuno screenshot, '.' = nessun prefisso). Stampa solo osservazioni in JSON.
 * Chromium preinstallato nella sessione: non serve (e non si deve) lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || '-';
const riferimento = process.argv[4] ? path.resolve(process.argv[4]) : null;
const EVID = path.join(RADICE, 'production', 'qa', 'evidence');
const nomeFoto = (n) => (path.isAbsolute(prefisso) ? `${prefisso}-${n}.png` // prefisso assoluto = percorso delle foto
  : path.join(EVID, `teatro-hd-${prefisso === '.' ? '' : prefisso + '-'}${n}.png`));

/** Click in coordinate di gioco 640x360, convertite nei pixel CSS del canvas. */
async function clickGioco(pagina, gx, gy) {
  const r = await pagina.evaluate(() => { const b = document.getElementById('c').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  await pagina.mouse.click(r.x + gx * r.w / 640, r.y + gy * r.h / 360);
}

/** Stanza senza nemici, giocatore in (200,200), poi D tenuto per 1 s. */
async function corsaD(pagina) {
  await pagina.evaluate(() => {
    const I = window.__teatro.interni;
    I.statoRun.fase = 'in_gioco';
    I.statoRun.pausa = false;
    I.statoRun.siparioAttivo = null;
    if (I.statoRun.stanzaCorrente) I.statoRun.stanzaCorrente.nemici.length = 0;
    I.player.x = 200; I.player.y = 200; I.player.targetX = null; I.player.targetY = null;
    if ('vx' in I.player) { I.player.vx = 0; I.player.vy = 0; }
  });
  await pagina.waitForTimeout(150);
  await pagina.evaluate(() => { const I = window.__teatro.interni; I.player.x = 200; I.player.y = 200; if ('vx' in I.player) { I.player.vx = 0; I.player.vy = 0; } });
  const t0 = await pagina.evaluate(() => window.__teatro.tick);
  await pagina.keyboard.down('KeyD');
  await pagina.waitForTimeout(1000);
  await pagina.keyboard.up('KeyD');
  const reale = await pagina.evaluate((t0) => ({ x: window.__teatro.interni.player.x, y: window.__teatro.interni.player.y, tick: window.__teatro.tick - t0 }), t0);
  // stessa corsa a tick esatti (60 tick = 1 s di logica), indipendente dal jitter dei frame
  await pagina.waitForTimeout(300);
  await pagina.evaluate(() => { const I = window.__teatro.interni; I.player.x = 200; I.player.y = 200; if ('vx' in I.player) { I.player.vx = 0; I.player.vy = 0; } });
  await pagina.waitForTimeout(100);
  await pagina.evaluate(() => { const I = window.__teatro.interni; I.player.x = 200; I.player.y = 200; if ('vx' in I.player) { I.player.vx = 0; I.player.vy = 0; } });
  await pagina.keyboard.down('KeyD');
  const t1 = await pagina.evaluate(() => window.__teatro.tick);
  await pagina.waitForFunction((t1) => window.__teatro.tick >= t1 + 60, t1, { polling: 1 });
  await pagina.keyboard.up('KeyD');
  const tickEsatti = await pagina.evaluate((t1) => ({ x: window.__teatro.interni.player.x, tick: window.__teatro.tick - t1 }), t1);
  return { ...reale, tickEsatti };
}

async function prova(browser, url, vp, dpr, foto) {
  const bctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dpr });
  const pagina = await bctx.newPage();
  const errori = [];
  pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  pagina.on('pageerror', (e) => errori.push(String(e)));
  await pagina.goto(url);
  await pagina.waitForFunction(() => window.__teatro && window.__teatro.interni, null, { timeout: 8000 });
  await pagina.waitForTimeout(500);
  const out = { viewport: `${vp.width}x${vp.height}@${dpr}` };
  out.canvas = await pagina.evaluate(() => {
    const c = document.getElementById('c'); const r = c.getBoundingClientRect();
    const m = c.getContext('2d').getTransform();
    return { cssL: +r.width.toFixed(1), cssA: +r.height.toFixed(1), bufL: c.width, bufA: c.height, scala: m.a };
  });
  if (foto) await pagina.screenshot({ path: nomeFoto('menu') });
  // click del mouse sulla seconda scheda (agnese): la seleziona
  await clickGioco(pagina, 35 + 146 + 66, 168);
  await pagina.waitForTimeout(120);
  out.dopoClick = await pagina.evaluate(() => ({ personaggio: window.__teatro.interni.statoRun.personaggioId, fase: window.__teatro.fase }));
  // secondo click: avvia la partita
  await clickGioco(pagina, 35 + 146 + 66, 168);
  await pagina.waitForTimeout(250);
  for (let i = 0; i < 4 && await pagina.evaluate(() => !!window.__teatro.interni.statoRun.siparioAttivo); i++) {
    await pagina.keyboard.press('Space'); await pagina.waitForTimeout(150);
  }
  out.faseGioco = await pagina.evaluate(() => window.__teatro.fase);
  // frecce: attacco nelle 4 direzioni
  for (const k of ['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown']) { await pagina.keyboard.down(k); await pagina.waitForTimeout(150); await pagina.keyboard.up(k); }
  if (foto) { await pagina.waitForTimeout(200); await pagina.screenshot({ path: nomeFoto('gioco') }); }
  out.corsaD = await corsaD(pagina);
  out.errori = errori;
  await bctx.close();
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const ris = { file: path.relative(RADICE, file), prove: [] };
  const conf = [[{ width: 1920, height: 1080 }, 1], [{ width: 1280, height: 720 }, 2]];
  for (const [vp, dpr] of conf) {
    const p = await prova(browser, 'file://' + file, vp, dpr, prefisso !== '-' && vp.width === 1920);
    if (riferimento) {
      const r = await prova(browser, 'file://' + riferimento, vp, dpr, false);
      p.riferimento = { canvas: r.canvas, corsaD: r.corsaD, errori: r.errori };
      const dx0 = r.corsaD.x - 200, dx1 = p.corsaD.x - 200;
      p.scartoCorsaPercento = +(100 * Math.abs(dx1 - dx0) / Math.max(1e-6, Math.abs(dx0))).toFixed(2);
      const ex0 = r.corsaD.tickEsatti.x - 200, ex1 = p.corsaD.tickEsatti.x - 200;
      p.scartoTickEsattiPercento = +(100 * Math.abs(ex1 - ex0) / Math.max(1e-6, Math.abs(ex0))).toFixed(2);
    }
    ris.prove.push(p);
  }
  await browser.close();
  console.log(JSON.stringify(ris, null, 1));
})();
