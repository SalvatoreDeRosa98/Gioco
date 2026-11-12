#!/usr/bin/env node
/*
 * tools/qa-teatro-gregorio.js — verifica Playwright della squadra h3 (gioco/teatro/h3-gregorio.js):
 * Gregorio, il Custode della Reggia, e il Cortile d'Onore.
 *   A. GENERATORE: in 50 mappe del piano 4 (e 20 del piano 8) un solo Cortile, sulla catena, accanto al boss;
 *      mai ai piani 1-3.
 *   B. PRIMO CONFRONTO (tastiera): cartiglio d'ingresso, scelta a due risposte, «Attacca» → flag attacco.
 *   C. RAMO ATTACCO: il mezzo-boss con barra e nome visita i suoi stati (alza, spazzata, abbassa, carica,
 *      chiavi con le guardie), fase 2 (cambiaFase, esita), cade; la scena della morte con la riga del ramo;
 *      porte aperte. Donna Luciana: rabbia, nessuna guardia.
 *   D. NOTTE DOPO: niente scelta, la conseguenza in breve (si combatte di nuovo).
 *   E. RAMO DIALOGO (gamepad simulato): niente scontro, +1 chiave, la riga «Tuo padre era innocente.»;
 *      Donna Luciana: guardie all'ingresso e punto debole in prima fase. Notte dopo: breve, niente scelta.
 *   F. SENZA PROVE: la prima risposta è «Cerca le prove…» e vale attacco.
 *   G. Nessun errore in ERRORI_TEATRO né in console.
 * Uso: node tools/qa-teatro-gregorio.js <file html> [prefisso screenshot]. Esce con 1 se un controllo fallisce.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { passi, aspetta, fermaCiclo } = require('./qa-teatro-comune');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-gregorio');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  await p.addInitScript(() => {
    window.__padAcceso = false;
    window.__pad = { id: 'Pad finto (QA)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => (window.__padAcceso ? [window.__pad, null, null, null] : [null, null, null, null]) });
  });
  const esiti = [];
  const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });
  const scatta = (nome) => p.locator('#c').screenshot({ path: foto(nome) });
  const dialogo = () => p.evaluate(() => window.__teatro.t4qa.dialogo);
  const stato = () => p.evaluate(() => window.__teatro.interni.gregorioH3.stato);
  const tieni = (i, giu) => p.evaluate(([i, giu]) => { const b = window.__pad.buttons[i]; b.pressed = giu; b.value = giu ? 1 : 0; }, [i, giu]);
  const premiPad = async (i) => { await tieni(i, true); await aspetta(p, 90); await tieni(i, false); await aspetta(p, 90); };
  /** Avanza il cartiglio (senza scegliere) e raccoglie i testi visti. */
  const leggiTutto = async (pad = false) => {
    const visti = [];
    for (let i = 0; i < 60; i++) {
      const d = await dialogo();
      if (!d || d.scelta) return { visti, scelta: d ? d.scelta : null };
      if (visti[visti.length - 1] !== d.testo) visti.push(d.testo);
      if (pad) await premiPad(0); else { await p.keyboard.press('Space'); await aspetta(p, 40); }
    }
    return { visti, scelta: null };
  };
  /** Run nuova fino dentro il Cortile del piano `piano`. */
  const nelCortile = (piano) => p.evaluate((piano) => {
    const I = window.__teatro.interni; const R = I.statoRun;
    nuovaRun(false);
    avviaPiano(piano, false);
    R.siparioAttivo = null; R.cartiglioD = null;
    const st = R.mappa.stanze.find((s) => s.cortileH3);
    entraInStanza(st, 'S');
    R.graziaIngressoC = 0;
    I.player.invuln = 1e9;
    return Boolean(st);
  }, piano);
  const entraNelBoss = () => p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    const st = R.mappa.stanze.find((s) => s.tipo === 'boss');
    entraInStanza(st, 'S'); R.graziaIngressoC = 0; R.siparioAttivo = null;
    return true;
  });

  await p.goto('file://' + file);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await aspetta(p, 500);
  // Dal menu all'hub e dentro il teatro come le altre prove
  for (let i = 0; i < 10 && (await p.evaluate(() => window.__teatro.interni.statoRun.fase)) === 'menu_selezione'; i++) { await p.keyboard.press('Space'); await aspetta(p, 150); }
  await p.evaluate(() => { const R = window.__teatro.interni.statoRun; R.fase = 'in_gioco'; });

  // A. GENERATORE
  const gen = await p.evaluate(() => {
    const out = { p4: 0, p4ok: 0, p8ok: 0, altrove: 0, viol: [] };
    nuovaRun(false);
    for (const [piano, n] of [[4, 50], [8, 20], [1, 15], [2, 15], [3, 15]]) {
      for (let i = 0; i < n; i++) {
        const m = generaMappaPiano(piano);
        const c = m.stanze.filter((s) => s.cortileH3);
        if (piano % 4 !== 0) { if (c.length) out.altrove++; continue; }
        const boss = m.stanze.find((s) => s.tipo === 'boss');
        const vicino = c.length === 1 && Object.values(boss.porte).includes(c[0].id) && c[0].tipo === 'normale' && c[0].nemici.length === 0;
        // sulla catena: BFS dall'ingresso, il percorso più breve al boss passa dal Cortile
        const per = new Map(m.stanze.map((s) => [s.id, s]));
        const ing = m.stanze.find((s) => s.tipo === 'ingresso');
        const prec = new Map([[ing.id, null]]); const coda = [ing.id];
        while (coda.length) { const id = coda.shift(); for (const v of Object.values(per.get(id).porte)) if (!prec.has(v) && per.get(v).tipo !== 'segreta' && per.get(v).tipo !== 'patto') { prec.set(v, id); coda.push(v); } }
        const sullaCatena = c.length === 1 && prec.get(boss.id) === c[0].id;
        if (vicino && sullaCatena) { if (piano === 4) out.p4ok++; else out.p8ok++; } else out.viol.push({ piano, n: c.length, vicino, sullaCatena });
      }
    }
    return out;
  });
  ok('A. 50 mappe del piano 4: Cortile unico, sulla catena, accanto al boss', gen.p4ok === 50, gen);
  ok('A. 20 mappe del piano 8 (notte senza fine): il Cortile c\'è', gen.p8ok === 20);
  ok('A. mai ai piani 1-3', gen.altrove === 0);

  // B. PRIMO CONFRONTO (tastiera), con le prove
  await p.evaluate(() => { const q = window.__teatro.t4qa; q.azzeraFlag(); q.impostaFlag({ prove: 'vera' }); });
  ok('B. nel Cortile', await nelCortile(4));
  await passi(p, 3);
  await aspetta(p, 300);
  await scatta('cortile');
  let L = await leggiTutto();
  ok('B. cartiglio d\'ingresso (bibbia: Cortile d\'Onore · Notte)', L.visti.some((t) => t.includes('Cortile d\'Onore')), L.visti);
  ok('B. scelta a due risposte', L.scelta && L.scelta.length === 2 && L.scelta[0] === 'Mostragli le prove' && L.scelta[1] === 'Attacca il Custode', L.scelta);
  await scatta('scelta');
  ok('B. porte chiuse durante la scena', (await stato()).pulita === false);
  await p.keyboard.press('Digit2');
  await aspetta(p, 60);
  ok('B. flag gregorio = attacco', (await p.evaluate(() => window.__teatro.t4qa.flag.gregorio)) === 'attacco');
  L = await leggiTutto();
  ok('C. battuta del ramo attacco', L.visti.includes('Un altro figlio viene a chiedermi conto dei padri.'), L.visti);
  let s = await stato();
  ok('C. il Custode entra in scontro (barra: boss con nome)', s.fase === 'scontro' && s.custode && s.custode.maxHp > 0, s);
  // Stati dell'IA registrati a ogni passo
  await fermaCiclo(p, true);
  await p.evaluate(() => {
    window.__statiH3 = [];
    const base = passoLogico;
    passoLogico = function passoLogicoQaH3(...a) {
      const r = base.apply(this, a);
      const x = window.__teatro.interni.gregorioH3.stato; const v = x && x.custode && x.custode.stato;
      if (v && window.__statiH3[window.__statiH3.length - 1] !== v) window.__statiH3.push(v);
      return r;
    };
  });
  let foto2 = false;
  for (let k = 0; k < 40; k++) {
    await passi(p, 30);
    const st = await p.evaluate(() => window.__statiH3.slice());
    if (!foto2 && st.includes('spazzata')) { await fermaCiclo(p, false); await aspetta(p, 30); await scatta('custode'); await fermaCiclo(p, true); foto2 = true; }
    if (['alza', 'spazzata', 'abbassa', 'carica', 'chiavi'].every((x) => st.includes(x))) break;
  }
  let stati = await p.evaluate(() => window.__statiH3.slice());
  ok('C. fase 1: alza, spazzata, abbassa, carica, chiavi', ['alza', 'spazzata', 'abbassa', 'carica', 'chiavi'].every((x) => stati.includes(x)), stati);
  await p.evaluate(() => { window.__guardieH3 = 0; const b = passoLogico; passoLogico = function (...a) { const r = b.apply(this, a); const x = window.__teatro.interni.gregorioH3.stato; if (x) window.__guardieH3 = Math.max(window.__guardieH3, x.guardie); return r; }; });
  await passi(p, 60);
  ok('C. le chiavi chiamano le Guardie di Piombo', (await p.evaluate(() => window.__guardieH3)) > 0, await stato());
  await p.evaluate(() => { const n = window.__teatro.interni.statoRun.stanzaCorrente.nemici.find((x) => x.bossId === 'gregorio-custode'); n.hp = n.maxHp * 0.45; });
  for (let k = 0; k < 40; k++) {
    await passi(p, 30);
    stati = await p.evaluate(() => window.__statiH3.slice());
    if (stati.includes('cambiaFase') && stati.lastIndexOf('esita') > stati.indexOf('cambiaFase')) break;
  }
  s = await stato();
  ok('C. fase 2: cambiaFase ed esitazione', s.custode.fase2 && stati.includes('cambiaFase') && stati.includes('esita'), stati.slice(-12));
  await fermaCiclo(p, false);
  await p.evaluate(() => { const n = window.__teatro.interni.statoRun.stanzaCorrente.nemici.find((x) => x.bossId === 'gregorio-custode'); n.hp = 1; danneggiaNemico(n, 5, 0, 0); });
  await passi(p, 2);
  await aspetta(p, 100);
  s = await stato();
  ok('C. il Custode cade: scena della morte', s.fase === 'morte' && s.figura === 'ginocchio', s);
  await scatta('morte');
  L = await leggiTutto();
  ok('C. morte: righe della bibbia e quella del ramo attacco', L.visti.includes('Era una promessa fatta a mia moglie.') && L.visti.includes('Anche io avevo paura di perderla.') && !L.visti.includes('Tuo padre era innocente.'), L.visti);
  ok('C. Donna Luciana è chiamata col suo nome', L.visti.includes('Donna Luciana è lì.') && !L.visti.some((t) => t.includes('Violante')));
  await passi(p, 2);
  s = await stato();
  ok('C. Cortile risolto, porte aperte, mantello vuoto', s.risolto && s.pulita && s.figura === 'aTerra', s);
  await aspetta(p, 300);
  await scatta('mantello');
  await entraNelBoss();
  await passi(p, 2);
  let lu = await p.evaluate(() => window.__teatro.interni.gregorioH3.luciana);
  ok('C. Donna Luciana con rabbia, senza guardie', lu && lu.rabbia && !lu.puntoDebole && lu.guardie === 0, lu);

  // D. NOTTE DOPO (attacco): niente scelta, la conseguenza in breve
  await p.evaluate(() => { const d = window.__teatro.t4qa; if (d.dialogo) window.__teatro.interni.statoRun.fase = 'in_gioco'; });
  await leggiTutto();
  await nelCortile(4);
  await passi(p, 3);
  L = await leggiTutto();
  s = await stato();
  ok('D. notte dopo: nessuna scelta, scontro diretto', !L.scelta && s.breve && s.fase === 'scontro', { L, s });

  // E. RAMO DIALOGO col gamepad simulato
  await p.evaluate(() => { const q = window.__teatro.t4qa; q.azzeraFlag(); q.impostaFlag({ prove: 'vera' }); window.__padAcceso = true; });
  await nelCortile(4);
  const chiavi0 = await p.evaluate(() => window.__teatro.interni.statoRun.chiavi || 0);
  await passi(p, 3);
  L = await leggiTutto(true);
  ok('E. (pad) scelta a due risposte', L.scelta && L.scelta.length === 2, L);
  await premiPad(0); // prima risposta: Mostragli le prove
  ok('E. flag gregorio = dialogo', (await p.evaluate(() => window.__teatro.t4qa.flag.gregorio)) === 'dialogo');
  L = await leggiTutto(true);
  s = await stato();
  ok('E. niente scontro, la confessione', !s.custode && L.visti.includes('Gaetano...') && L.visti.includes('Tuo padre era innocente.') && !L.visti.includes('Anche io avevo paura di perderla.'), { s, visti: L.visti });
  await passi(p, 2);
  s = await stato();
  const chiavi1 = await p.evaluate(() => window.__teatro.interni.statoRun.chiavi || 0);
  ok('E. il dono: +1 chiave, porte aperte', chiavi1 === chiavi0 + 1 && s.risolto && s.pulita, { chiavi0, chiavi1, s });
  await aspetta(p, 200);
  await scatta('dono');
  await entraNelBoss();
  await passi(p, 2);
  lu = await p.evaluate(() => window.__teatro.interni.gregorioH3.luciana);
  ok('E. Donna Luciana: guardie e punto debole', lu && lu.puntoDebole && !lu.rabbia && lu.guardie === 2, lu);
  const danno = await p.evaluate(() => {
    const L = window.__teatro.interni.statoRun.stanzaCorrente.nemici.find((n) => n.bossId === 'donna-luciana');
    const h0 = L.hp; danneggiaNemico(L, 10, 0, 0); return h0 - L.hp;
  });
  ok('E. prima fase: il giglio prende più danno (×1,4)', Math.abs(danno - 14) < 0.6, danno);
  await leggiTutto(true);
  await scatta('luciana-guardie');
  await nelCortile(4);
  await passi(p, 3);
  L = await leggiTutto(true);
  s = await stato();
  ok('E. notte dopo: breve, nessuna scelta, nessuno scontro', !L.scelta && s.breve && !s.custode && L.visti.includes('Tuo padre era innocente.'), { L, s });
  await p.evaluate(() => { window.__padAcceso = false; });

  // F. SENZA PROVE
  await p.evaluate(() => { const q = window.__teatro.t4qa; q.azzeraFlag(); q.impostaFlag({ prove: 'falsa', registro: 'bruciato', taddeo: 'accusato' }); });
  await nelCortile(4);
  await passi(p, 3);
  L = await leggiTutto();
  ok('F. senza prove: prima risposta «Cerca le prove nella giubba»', L.scelta && L.scelta[0] === 'Cerca le prove nella giubba', L.scelta);
  await p.keyboard.press('Digit1');
  await aspetta(p, 60);
  ok('F. e vale attacco', (await p.evaluate(() => window.__teatro.t4qa.flag.gregorio)) === 'attacco');
  L = await leggiTutto();
  ok('F. le mani cercano qualcosa che non c\'è', L.visti.some((t) => t.includes('qualcosa che non c\'è')));

  ok('G. Registro di Scena: il Custode fra i Primi attori', await p.evaluate(() => primiAttoriD3().some((b) => b.id === 'gregorio-custode')));
  // G. errori
  const et = await p.evaluate(() => (typeof ERRORI_TEATRO !== 'undefined' ? ERRORI_TEATRO.map((e) => `${e.dove}: ${e.testo}`) : []));
  ok('G. nessun errore in ERRORI_TEATRO', et.length === 0, et);
  ok('G. nessun errore in console', errori.length === 0, errori.slice(0, 5));

  await browser.close();
  let rossi = 0;
  for (const e of esiti) { if (!e.ok) rossi++; console.log(`${e.ok ? 'OK  ' : 'NO  '} ${e.caso}${!e.ok && e.dati !== undefined ? ' — ' + JSON.stringify(e.dati).slice(0, 600) : ''}`); }
  console.log(`\n${esiti.length - rossi}/${esiti.length} controlli verdi`);
  process.exit(rossi ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
