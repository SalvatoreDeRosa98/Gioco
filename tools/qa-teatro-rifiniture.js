#!/usr/bin/env node
/*
 * tools/qa-teatro-rifiniture.js — verifica Playwright delle rifiniture d7 (gioco/teatro/d7-rifiniture.js e ritocchi):
 * HUD e balconata non si sovrappongono (rettangoli opachi dell'HUD fuori dal centro della balconata), il Ragno della
 * Seta esce dal vaso, è del tipo nuovo, si muove, lascia seta e muore; col tocco nessuna scritta coi tasti del PC
 * nelle schermate principali; le linguette del Diario aprono le pagine; nessun errore in ERRORI_TEATRO.
 * Uso: node tools/qa-teatro-rifiniture.js <file html> [prefisso screenshot]. Esce con 1 se un controllo fallisce.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const pref = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-rifiniture-qa-');
fs.mkdirSync(path.dirname(pref + 'x'), { recursive: true });
/** Zona della balconata che deve restare libera (coordinate logiche) e parole proibite col tocco. */
const BALCONATA_LIBERA = { x: 184, y: 0, w: 272, h: 54 };
const TASTI_PC = /\b(SPAZIO|Spazio|INVIO|Invio|Click|Clic|click|WASD|Esc\/O|ESC|Mouse)\b/;

(async () => {
  const browser = await chromium.launch();
  const esiti = [];
  const ok = (nome, cond, info) => esiti.push({ nome, ok: Boolean(cond), info });
  const avvia = async (vp, tocco) => {
    const p = await browser.newPage({ viewport: vp, hasTouch: tocco });
    p.errori = []; p.on('pageerror', (e) => p.errori.push(String(e)));
    await p.goto('file://' + file); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
    if (tocco) { await p.touchscreen.tap(5, 5); await p.waitForTimeout(200); }
    await p.evaluate(() => { statoRun.fase = 'in_gioco'; nuovaRun(false); statoRun.siparioAttivo = false; statoRun.bannerTimer = 0; });
    await p.waitForTimeout(900);
    return p;
  };
  const rettHUD = (p) => p.evaluate(() => { // rettangoli pieni disegnati dall'HUD (fuori dagli scontri coi boss)
    const st = window.__teatro.interni.rifinitureD7.stanzaAttualeD7(); statoRun.bannerTimer = 0;
    const out = []; const f = ctx.fillRect;
    ctx.fillRect = function (x, y, w, h) { const c = String(ctx.fillStyle); const m = /rgba\([^)]*,\s*([\d.]+)\)/.exec(c); out.push({ x, y, w, h, a: (m ? +m[1] : 1) * ctx.globalAlpha }); return f.apply(this, arguments); };
    try { disegnaHUDPixelArt(st); } finally { ctx.fillRect = f; }
    return out;
  });
  const interseca = (r, z) => r.x < z.x + z.w && r.x + r.w > z.x && r.y < z.y + z.h && r.y + r.h > z.y;

  for (const [nome, vp, tocco] of [['pc', { width: 1280, height: 720 }, false], ['telefono', { width: 416, height: 657 }, true]]) {
    const p = await avvia(vp, tocco);
    const rr = await rettHUD(p);
    const copre = rr.filter((r) => r.a >= 0.8 && r.w * r.h >= 300 && interseca(r, BALCONATA_LIBERA));
    ok(`${nome}: nessun fondo pieno dell'HUD sulla balconata`, copre.length === 0, JSON.stringify(copre.slice(0, 3)));
    const fondi = rr.filter((r) => r.w * r.h >= 4000);
    ok(`${nome}: fondi grandi dell'HUD semitrasparenti`, fondi.every((r) => r.a < 0.8), JSON.stringify(fondi));
    if (tocco) {
      const bott = await p.evaluate(() => { const c = document.querySelector('canvas').getBoundingClientRect(); const k = c.width / W;
        const hud = [{ x: 6, y: 5, w: 172, h: 52 }, { x: W - 124, y: 8, w: 114, h: 92 }].map((r) => ({ x: c.x + r.x * k, y: c.y + r.y * k, w: r.w * k, h: r.h * k }));
        const el = [...document.querySelectorAll('[class*="c2"] *, [id*="c2"] *')].filter((e) => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0 && e.getClientRects().length; })
          .map((e) => e.getBoundingClientRect()).filter((r) => r.width > 10 && r.height > 10 && r.width < 200 && r.height < 200);
        return el.filter((b) => hud.some((r) => b.x < r.x + r.w && b.x + b.width > r.x && b.y < r.y + r.h && b.y + b.height > r.y)).length; });
      ok('telefono: i bottoni a tocco non coprono HUD e minimappa', bott === 0, bott);
      const scritte = await p.evaluate(async () => {
        const viste = []; const f = ctx.fillText; ctx.fillText = function (t) { viste.push(String(t)); return f.apply(this, arguments); };
        const aspetta = () => new Promise((r) => setTimeout(r, 250));
        try {
          await aspetta(); statoRun.pausa = true; await aspetta();
          apriDiarioD(); await aspetta(); statoRun.diarioD = null; statoRun.pausa = false;
          statoRun.fase = 'menu_selezione'; await aspetta(); statoRun.fase = 'in_gioco';
        } finally { ctx.fillText = f; }
        return [...new Set(viste)];
      });
      const brutte = scritte.filter((t) => TASTI_PC.test(t));
      ok('telefono: nessuna scritta coi tasti del PC (scena, pausa, Diario, menu)', brutte.length === 0, JSON.stringify(brutte.slice(0, 6)));
      const pag = await p.evaluate(async () => {
        statoRun.pausa = true; apriDiarioD(); await new Promise((r) => setTimeout(r, 200));
        const L = window.__teatro.interni.rifinitureD7.linguetteDiarioD7(); const esito = {};
        for (const l of L) { apriDiarioD(); const prima = JSON.stringify(statoRun.diarioD); clickDiarioD(l.x + l.w / 2, l.y + l.h / 2); esito[l.codice] = !!statoRun.diarioD && JSON.stringify(statoRun.diarioD) !== prima; }
        statoRun.diarioD = null; statoRun.pausa = false; return esito;
      });
      ok('telefono: le linguette T / N / F del Diario cambiano pagina', pag.KeyT && pag.KeyN && pag.KeyF, JSON.stringify(pag));
      const vib = await p.evaluate(() => righeB3('scena').some((r) => r.id === 'vibrazione'));
      ok('senza gamepad la riga «Vibrazione del gamepad» non c\'è', !vib);
    }
    await p.screenshot({ path: `${pref}hud-${nome}.png` });
    ok(`${nome}: nessun errore`, p.errori.length === 0 && (await p.evaluate(() => (window.ERRORI_TEATRO || []).length)) === 0, p.errori.join(' | '));
    await p.close();
  }

  // Ragno della Seta
  const p = await avvia({ width: 1280, height: 720 }, false);
  const r0 = await p.evaluate(() => { statoRun.hpHalf = 99; const I = window.__teatro.interni.rifinitureD7; const st = I.stanzaAttualeD7();
    const n = liberaRagnoB7(st, { x: 200, y: 140 }, STANZE_B7.fragili.tipi.capodimonte); window.__ragno = n; return { tipo: n && n.tipo, x: n.x, y: n.y, hp: n.hp }; });
  ok('il vaso libera un ragno del tipo nuovo', r0.tipo === 'ragno_seta', JSON.stringify(r0));
  await p.waitForTimeout(1600);
  const r1 = await p.evaluate(() => { const n = window.__ragno; const st = window.__teatro.interni.rifinitureD7.stanzaAttualeD7(); return { x: n.x, y: n.y, stato: n.statoD7, seta: (st.setaD7 || []).length }; });
  ok('il ragno si muove a scatti', Math.hypot(r1.x - r0.x, r1.y - r0.y) > 10 && ['pausa', 'scatto', 'salto'].includes(r1.stato), JSON.stringify(r1));
  ok('il ragno lascia la seta', r1.seta > 0, r1.seta);
  await p.screenshot({ path: `${pref}ragno.png` });
  const morto = await p.evaluate(async () => { const n = window.__ragno; danneggiaNemico(n, 999); await new Promise((r) => setTimeout(r, 300));
    const st = window.__teatro.interni.rifinitureD7.stanzaAttualeD7(); return !st.nemici.includes(n) || n.hp <= 0; });
  ok('il ragno muore', morto);
  ok('ragno: nessun errore', p.errori.length === 0 && (await p.evaluate(() => (window.ERRORI_TEATRO || []).length)) === 0, p.errori.join(' | '));
  await browser.close();
  for (const e of esiti) console.log(`${e.ok ? 'OK ' : 'NO '} ${e.nome}${e.ok ? '' : ' — ' + e.info}`);
  const ko = esiti.filter((e) => !e.ok).length;
  console.log(ko ? `${ko} controlli falliti su ${esiti.length}` : `tutti i ${esiti.length} controlli passati`);
  process.exit(ko ? 1 : 0);
})();
