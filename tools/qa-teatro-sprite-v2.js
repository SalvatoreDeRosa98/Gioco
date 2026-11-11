#!/usr/bin/env node
/*
 * tools/qa-teatro-sprite-v2.js — foto vere prima/dopo degli sprite migliorati (SPRITE_V2 di teatro/10-sprite.js).
 *
 * Uso: node tools/qa-teatro-sprite-v2.js <file html> <prefisso assoluto>
 * Apre la pagina due volte da file://: «prima» con window.__spriteV2 = false (originali), «dopo» con la tabella.
 * Fotografa 4 scene: menu dei personaggi, hub, stanza con 3 nemici diversi (gatto, guardia, burattino), boss
 * (Capitano della Guardia). Screenshot <prefisso>-<scena>-<prima|dopo>.png. Esce con 1 se ci sono errori di
 * console o se nel «dopo» uno sprite acceso non risulta caricato dalla cartella v2.
 * Chromium preinstallato nella sessione: non serve `playwright install`.
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-sprite-v2');

async function giro(browser, versione) {
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  if (versione === 'prima') await p.addInitScript(() => { window.__spriteV2 = false; });
  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForFunction(() => window.__teatro && window.__teatro.t2 && window.__teatro.t2.caricati.length >= 20, null, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(600);
  const tela = p.locator('canvas#c');
  const foto = (scena) => tela.screenshot({ path: `${prefisso}-${scena}-${versione}.png` });
  /** Primo piano: riquadro [x0, y0, x1, y1] in px di gioco (palco 640x360). */
  const zoom = async (scena, r) => {
    const bb = await tela.boundingBox();
    const k = bb.width / 640;
    await p.screenshot({ path: `${prefisso}-${scena}-zoom-${versione}.png`,
      clip: { x: bb.x + r[0] * k, y: bb.y + r[1] * k, width: (r[2] - r[0]) * k, height: (r[3] - r[1]) * k } });
  };
  await foto('menu');
  await zoom('menu', [0, 60, 640, 300]);

  await p.keyboard.press('Space');
  await p.waitForTimeout(700);
  await foto('hub');

  await p.evaluate(() => {
    const I = window.__teatro.interni;
    nuovaRun(false);
    const R = I.statoRun;
    R.fase = 'in_gioco'; R.siparioAttivo = null; R.cartiglioD = null;
    const st = R.stanzaCorrente;
    const base = { boss: false, flash: 0, burnTicks: 0, stunTicks: 0, state: 'idle', stateTimer: 40, maskOpen: false, r: 11 };
    st.nemici.length = 0;
    st.nemici.push({ ...base, id: 'qa-gatto', tipo: 'gatto', nome: 'Gatto', x: 200, y: 160, hp: 99, maxHp: 99, speed: 0, shootCd: 9999 });
    st.nemici.push({ ...base, id: 'qa-guardia', tipo: 'guardia', nome: 'Guardia', x: 440, y: 160, hp: 99, maxHp: 99, speed: 0, shootCd: 9999 });
    st.nemici.push({ ...base, id: 'qa-burattino', tipo: 'burattino', nome: 'Burattino', x: 320, y: 120, hp: 99, maxHp: 99, speed: 0, shootCd: 9999 });
    I.player.x = 320; I.player.y = 230;
  });
  await p.waitForTimeout(600);
  await foto('stanza');
  await zoom('stanza', [160, 80, 480, 260]);

  const boss = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    if (I.bossB6 && I.bossB6.forza) I.bossB6.forza('capitano-guardia');
    nuovaRun(false);
    R.siparioAttivo = null; R.cartiglioD = null;
    const st = R.mappa.stanze.find((s) => s.tipo === 'boss');
    entraInStanza(st, 'S');
    R.graziaIngressoC = 0;
    I.player.invuln = 1e9; I.player.x = 520; I.player.y = 280;
    const b = st.nemici.find((n) => n.boss);
    if (b) { b.x = 200; b.y = 200; b.speed = 0; }
    return b ? b.bossId : null;
  });
  await p.waitForTimeout(900);
  await foto('boss');
  const bp = await p.evaluate(() => { const b = window.__teatro.interni.statoRun.stanzaCorrente.nemici.find((n) => n.boss); return b ? [b.x, b.y] : [200, 200]; });
  await zoom('boss', [Math.max(0, bp[0] - 80), Math.max(0, bp[1] - 110), Math.min(640, bp[0] + 80), Math.min(360, bp[1] + 30)]);

  const fonti = await p.evaluate(() => {
    const t2 = window.__teatro.t2;
    return { caricati: t2.caricati.length };
  });
  const v2 = await p.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.name.includes('sprite_teatro_v2/')).length);
  await p.close();
  return { versione, errori, boss, caricati: fonti.caricati, daV2: v2 };
}

(async () => {
  const browser = await chromium.launch();
  const esiti = [];
  for (const v of ['prima', 'dopo']) esiti.push(await giro(browser, v));
  await browser.close();
  console.log(JSON.stringify(esiti, null, 1));
  const ok = esiti.every((e) => e.errori.length === 0) && esiti[0].daV2 === 0;
  process.exit(ok ? 0 : 1);
})();
