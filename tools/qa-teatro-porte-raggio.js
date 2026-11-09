#!/usr/bin/env node
/**
 * QA (segnalazione dell'autore, 2026-11-09): porte che restano chiuse con i nemici a terra, raggio col mouse.
 * 1. Stanze normali dei piani 1-4: i nemici muoiono SENZA danneggiaNemico (hp = 0, come un Bozzo che esplode);
 *    dopo qualche tick del loop vero la stanza deve essere pulita (porte aperte).
 * 2. Col Raggio Cremisi, il click tenuto sul canvas accende il raggio verso il cursore e non spara lacrime.
 * Uso: node tools/qa-teatro-porte-raggio.js <html> [prefisso screenshot]. Esce con 1 se qualcosa fallisce.
 */
const path = require('path');
const { chromium } = require('playwright');
const file = path.resolve(process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || null;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = []; const violazioni = [];
  p.on('pageerror', (e) => errori.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  const prepara = (piano) => p.evaluate((piano) => {
    const I = window.__teatro.interni; const R = I.statoRun;
    R.fase = 'in_gioco'; I.nuovaRun(false); R.siparioAttivo = null; I.avviaPiano(piano, false); R.siparioAttivo = null;
  }, piano);
  // 1. porte
  let provate = 0;
  for (const piano of [1, 2, 3, 4]) {
    await prepara(piano);
    const n = await p.evaluate(() => window.__teatro.interni.statoRun.mappa.stanze.filter((x) => x.tipo === 'normale').length);
    for (let i = 0; i < Math.min(n, 3); i++) {
      const ok = await p.evaluate((i) => {
        const I = window.__teatro.interni; const R = I.statoRun;
        const s = R.mappa.stanze.filter((x) => x.tipo === 'normale')[i];
        const lato = Object.keys(s.porte)[0]; const g = R.mappa.perId.get(s.porte[lato]);
        R.stanzaCorrente = g; g.pulita = true; g.nemici = []; R.siparioAttivo = null;
        I.entraInStanza(s, { N: 'S', S: 'N', E: 'W', W: 'E' }[lato]);
        if (R.stanzaCorrente !== s || s.pulita) return null;
        R.hpHalf = R.maxHpHalf; R.proiettiliNemici = [];
        for (const nem of s.nemici) nem.hp = 0; // morte senza colpo
        return true;
      }, i);
      if (!ok) continue;
      await p.waitForTimeout(150);
      const pulita = await p.evaluate(() => window.__teatro.interni.statoRun.stanzaCorrente.pulita);
      provate++;
      if (!pulita) violazioni.push(`piano ${piano}: porte chiuse con tutti i nemici a terra`);
    }
  }
  if (!provate) violazioni.push('nessuna stanza provata');
  // 2. raggio col mouse
  await prepara(1);
  const pos = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    const o = I.CATALOGO_PATTO ? I.CATALOGO_PATTO.find((x) => x.id === 'patto_raggio') : null;
    const T = window.__teatroInterno; const cat = (o || T.CATALOGO_PATTO.find((x) => x.id === 'patto_raggio'));
    R.oggettiEquipaggiati.push({ ...cat });
    const st = R.stanzaCorrente; st.pulita = false;
    R.proiettili = []; I.player.x = 200; I.player.y = 190;
    const c = T.canvas.getBoundingClientRect();
    return { x: c.left + (420 / T.W) * c.width, y: c.top + (190 / T.H) * c.height };
  });
  await p.mouse.move(pos.x, pos.y); await p.mouse.down(); await p.waitForTimeout(250);
  const r = await p.evaluate(() => ({ raggio: window.__teatroT3.raggioAttivo, lacrime: window.__teatro.interni.statoRun.proiettili.length }));
  if (prefisso) await p.screenshot({ path: prefisso + '-raggio-mouse.png' });
  await p.mouse.up(); await p.waitForTimeout(120);
  const dopo = await p.evaluate(() => window.__teatroT3.raggioAttivo);
  if (!r.raggio) violazioni.push('raggio spento col mouse premuto');
  if (r.lacrime) violazioni.push(`col raggio il click ha sparato ${r.lacrime} lacrime`);
  if (dopo) violazioni.push('raggio ancora acceso dopo aver lasciato il mouse');
  console.log(JSON.stringify({ stanzeProvate: provate, raggio: r, raggioDopo: dopo, violazioni, errori }, null, 1));
  await b.close();
  process.exit(violazioni.length || errori.length ? 1 : 0);
})();
