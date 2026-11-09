#!/usr/bin/env node
/*
 * tools/qa-teatro-t5.js — verifica Playwright del passo T5 (palco a tutto schermo, risoluzione interna alta).
 *
 * Uso: node tools/qa-teatro-t5.js <file html> [prefisso screenshot] [file html di riferimento]
 * Per due configurazioni (1920x1080 dpr 1, 1280x720 dpr 2): errori di console, quota del palco sulla
 * dimensione limitante, buffer del canvas, menu → click su un personaggio → hub → partita con le frecce,
 * mira col mouse (click → player.targetX/Y in coordinate 640x360), posizione dopo 1 s di D tenuto
 * (confrontata, se dato, con il file di riferimento). Screenshot a 1920x1080 in production/qa/evidence/
 * teatro-hd-[<prefisso>-]{menu,hub,gioco}.png se il prefisso è dato ('.' = nessun prefisso). Stampa solo osservazioni in JSON.
 * Chromium preinstallato nella sessione: non serve (e non si deve) lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || '';
const riferimento = process.argv[4] ? path.resolve(process.argv[4]) : null;
const EVID = path.join(RADICE, 'production', 'qa', 'evidence');

/** Porta la partita in una stanza vuota con il giocatore al centro, poi tiene D per 1 s. */
async function corsaD(pagina) {
  for (let i = 0; i < 60 && await pagina.evaluate(() => !!(window.__teatro.t4qa && window.__teatro.t4qa.dialogo)); i++) {
    await pagina.keyboard.press('Enter'); await pagina.waitForTimeout(40);
  }
  await pagina.evaluate(() => {
    const I = window.__teatro.interni;
    I.selezionaPersonaggio('ferruccio');
    I.nuovaRun();
    I.statoRun.fase = 'in_gioco';
    I.statoRun.siparioAttivo = null;
    I.statoRun.stanzaCorrente.nemici.length = 0;
    I.player.x = 200; I.player.y = 200; I.player.targetX = null; I.player.targetY = null;
  });
  await pagina.waitForTimeout(200);
  await pagina.evaluate(() => { const I = window.__teatro.interni; I.player.x = 200; I.player.y = 200; });
  await pagina.keyboard.down('KeyD');
  await pagina.waitForTimeout(1000);
  await pagina.keyboard.up('KeyD');
  return pagina.evaluate(() => ({ x: window.__teatro.interni.player.x, y: window.__teatro.interni.player.y }));
}

async function prova(browser, url, vp, dpr, foto) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dpr });
  const pagina = await ctx.newPage();
  const errori = [];
  pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  pagina.on('pageerror', (e) => errori.push(String(e)));
  await pagina.goto(url);
  await pagina.waitForFunction(() => window.__teatro && window.__teatro.interni, null, { timeout: 8000 });
  await pagina.waitForFunction(() => !window.__teatro.t2 || window.__teatro.t2.caricati.length === 12, null, { timeout: 8000 }).catch(() => {});
  await pagina.waitForTimeout(400);
  const misura = () => pagina.evaluate(() => {
    const c = document.getElementById('c'); const r = c.getBoundingClientRect();
    return { cssL: Math.round(r.width), cssA: Math.round(r.height), bufL: c.width, bufA: c.height,
      scroll: document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth,
      barra: getComputedStyle(document.querySelector('.toolbar')).display !== 'none' };
  });
  const out = { vp: `${vp.width}x${vp.height}@${dpr}` };
  out.menu = await misura();
  if (foto !== null) await pagina.screenshot({ path: path.join(EVID, `teatro-hd-${foto}menu.png`) });

  // click sul secondo personaggio (Agnese) del menu: carta 2 a x 181..313, y 56..280 in coordinate di gioco
  const r = await pagina.locator('canvas#c').boundingBox();
  const aSchermo = (gx, gy) => ({ x: r.x + gx * r.width / 640, y: r.y + gy * r.height / 360 });
  let p = aSchermo(247, 160);
  await pagina.mouse.click(p.x, p.y);
  await pagina.waitForTimeout(100);
  out.clickMenu = await pagina.evaluate(() => window.__teatro.interni.statoRun.personaggioId);

  // hub (Spazio dal menu → T4 porta all'hub di Piazza Dante)
  await pagina.keyboard.press('Space');
  await pagina.waitForTimeout(600);
  out.faseDopoSpazio = await pagina.evaluate(() => window.__teatro.interni.statoRun.fase);
  out.hub = await misura();
  if (foto !== null) await pagina.screenshot({ path: path.join(EVID, `teatro-hd-${foto}hub.png`) });

  // partita: corsa con D
  out.dopoD = await corsaD(pagina);
  out.gioco = await misura();
  // frecce: un colpo verso destra crea un proiettile
  out.proiettiliPrima = await pagina.evaluate(() => window.__teatro.interni.statoRun.proiettili?.length ?? -1);
  await pagina.keyboard.down('ArrowRight'); await pagina.waitForTimeout(250); await pagina.keyboard.up('ArrowRight');
  out.proiettiliDopoFreccia = await pagina.evaluate(() => window.__teatro.interni.statoRun.proiettili?.length ?? -1);
  // mira col mouse
  p = aSchermo(500, 240);
  await pagina.mouse.click(p.x, p.y);
  await pagina.waitForTimeout(30);
  out.miraMouse = await pagina.evaluate(() => ({ tx: window.__teatro.interni.player.targetX, ty: window.__teatro.interni.player.targetY }));
  // Scena di partita per lo screenshot: due nemici fermi accanto al giocatore
  await pagina.evaluate(() => {
    const I = window.__teatro.interni;
    const st = I.statoRun.stanzaCorrente;
    const base = { boss: false, flash: 0, burnTicks: 0, stunTicks: 0, state: 'idle', stateTimer: 40, maskOpen: false, r: 11 };
    st.nemici.length = 0;
    st.nemici.push({ ...base, id: 'qa-gatto', tipo: 'gatto', nome: 'Gatto del Velo', x: 230, y: 170, hp: 99, maxHp: 99, speed: 0, shootCd: 9999 });
    st.nemici.push({ ...base, id: 'qa-guardia', tipo: 'guardia', nome: 'Guardia di Piombo', x: 420, y: 170, hp: 99, maxHp: 99, speed: 0, shootCd: 9999 });
    I.player.x = 320; I.player.y = 220; I.player.targetX = null; I.player.targetY = null;
  });
  await pagina.waitForTimeout(400);
  if (foto !== null) await pagina.screenshot({ path: path.join(EVID, `teatro-hd-${foto}gioco.png`) });
  const lim = Math.min(vp.width / 16, vp.height / 9);
  out.quotaMenu = +(Math.min(out.menu.cssL / (lim * 16), out.menu.cssA / (lim * 9))).toFixed(3);
  out.quotaGioco = +(Math.min(out.gioco.cssL / (lim * 16), out.gioco.cssA / (lim * 9))).toFixed(3);
  out.errori = errori;
  await ctx.close();
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const ris = { file: path.relative(RADICE, file) };
  // prefisso '.' → teatro-hd-menu.png; 'xyz' → teatro-hd-xyz-menu.png; assente → nessuno screenshot
  const foto = prefisso ? (prefisso === '.' ? '' : prefisso + '-') : null;
  ris.hd = await prova(browser, 'file://' + file, { width: 1920, height: 1080 }, 1, foto);
  ris.hd2x = await prova(browser, 'file://' + file, { width: 1280, height: 720 }, 2, null);
  if (riferimento) {
    const rif = await prova(browser, 'file://' + riferimento, { width: 1920, height: 1080 }, 1, null);
    ris.riferimento = { dopoD: rif.dopoD, errori: rif.errori };
    const dx = (q) => (q.x - 200);
    ris.scartoCorsaD = +((dx(ris.hd.dopoD) - dx(rif.dopoD)) / dx(rif.dopoD)).toFixed(4);
    ris.scartoCorsaD2x = +((dx(ris.hd2x.dopoD) - dx(rif.dopoD)) / dx(rif.dopoD)).toFixed(4);
  }
  await browser.close();
  console.log(JSON.stringify(ris, null, 1));
})();
