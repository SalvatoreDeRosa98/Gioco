#!/usr/bin/env node
/*
 * tools/qa-teatro-regatto.js — misura i proiettili del boss Re-Gatto (pattern 'salto_gatto') in 10 s di gioco.
 *
 * Uso: node tools/qa-teatro-regatto.js <file html> [prefisso screenshot]
 * Da file://: menu → hub → piano 1, stanza del boss forzata sul Re-Gatto, giocatore invulnerabile e fermo.
 * Conta i proiettili spawnati dal boss in 600 tick (10 s a 60 Hz), a vita piena e in rabbia (sotto il 50%),
 * con il giocatore vicino e lontano, e le raffiche (spawn in tick consecutivi). Screenshot dell'atterraggio in
 * production/qa/evidence/teatro-bug-regatto-[<prefisso>-]*.png. Chromium preinstallato: niente `playwright install`.
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] ? process.argv[3] + '-' : '';
const foto = (n) => (path.isAbsolute(process.argv[3] || '') ? `${prefisso}${n}.png` // prefisso assoluto = percorso delle foto
  : path.join(RADICE, 'production', 'qa', 'evidence', `teatro-bug-regatto-${prefisso}${n}.png`));
const TICK = 600;

(async () => {
  const browser = await chromium.launch();
  const out = [];
  const errori = [];
  for (const caso of [{ id: 'piena-vicino', rabbia: false, px: 300 }, { id: 'piena-lontano', rabbia: false, px: 110 },
    { id: 'rabbia-vicino', rabbia: true, px: 300 }, { id: 'rabbia-lontano', rabbia: true, px: 110 }]) {
    const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
    p.on('pageerror', (e) => errori.push(String(e)));
    await p.goto('file://' + file);
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.waitForTimeout(400);
    await p.keyboard.press('Space');
    await p.waitForTimeout(300);
    for (let i = 0; i < 30; i++) {
      const d = await p.evaluate(() => window.__teatro.t4qa.dialogo);
      if (!d) break;
      await p.keyboard.press(d.scelta ? 'Digit1' : 'Space');
      await p.waitForTimeout(40);
    }
    const ing = await p.evaluate(() => window.__teatro.t4qa.ingresso);
    await p.evaluate((g) => { const P = window.__teatro.interni.player; P.x = g.x - 40; P.y = g.y; }, ing);
    await p.keyboard.down('KeyD'); await p.waitForTimeout(900); await p.keyboard.up('KeyD');
    await p.keyboard.press('Space');
    await p.waitForTimeout(150);
    await p.evaluate((c) => {
      const T = window.__teatro; const I = T.interni; const R = I.statoRun;
      R.siparioAttivo = null;
      const st = R.mappa.stanze.find((s) => s.tipo === 'boss');
      const b = st.nemici[0];
      Object.assign(b, { bossId: 're-gatto', pattern: 'salto_gatto', tipo: 'gatto', nome: 'Il Gatto dei Quattro Canti', airZ: 0, shootCd: 40, state: 'idle' });
      if (c.rabbia) b.hp = Math.floor(b.maxHp * 0.4);
      b.hp = Math.max(b.hp, 1); b.maxHp = Math.max(b.maxHp, b.hp);
      st.visitata = true; R.stanzaCorrente = st; R.proiettiliNemici = [];
      I.player.x = c.px; I.player.y = 250;
      const arr = R.proiettiliNemici; const push = arr.push;
      T.__qaRG = { t0: T.tick, spari: [], hpBoss: b.hp };
      arr.push = function (...q) { const t = T.tick - T.__qaRG.t0; if (t <= 600) for (const x of q) if (x.bossShot) T.__qaRG.spari.push(t); return push.apply(this, q); };
      // invulnerabile e fermo; il boss non perde vita (nessun colpo del giocatore)
      T.__qaRGint = setInterval(() => { I.player.invuln = 999; I.player.x = c.px; I.player.y = 250; b.hp = T.__qaRG.hpBoss; }, 5);
    }, caso);
    let fotoFatta = false;
    for (;;) {
      const s = await p.evaluate(() => ({ t: window.__teatro.tick - window.__teatro.__qaRG.t0, n: window.__teatro.interni.statoRun.proiettiliNemici.length }));
      if (!fotoFatta && s.n >= 6 && s.t > 60) { fotoFatta = true; await p.waitForTimeout(450); await p.screenshot({ path: foto(caso.id) }); }
      if (s.t > TICK) break;
      await p.waitForTimeout(100);
    }
    const r = await p.evaluate(() => window.__teatro.__qaRG.spari);
    // raffiche: gruppi di spawn separati da meno di 2 tick
    const raffiche = [];
    for (const t of r) { const g = raffiche[raffiche.length - 1]; if (g && t - g.fine <= 1) { g.fine = t; g.n++; } else raffiche.push({ inizio: t, fine: t, n: 1 }); }
    out.push({ caso: caso.id, proiettili10s: r.length, attacchi: raffiche.length, perAttacco: raffiche.map((g) => g.n).join(',') });
    await p.close();
  }
  await browser.close();
  console.log(JSON.stringify({ file: path.relative(RADICE, file), esiti: out, erroriConsole: errori }, null, 1));
})();
