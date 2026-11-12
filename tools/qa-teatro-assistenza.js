#!/usr/bin/env node
/*
 * tools/qa-teatro-assistenza.js — verifica Playwright di teatro/e6-assistenza.js.
 *
 * Uso: node tools/qa-teatro-assistenza.js <file html> [prefisso screenshot]
 * Da file://, 1280x720. Passi di logica contati (le attese sono sondaggi a numero fisso di tentativi, non tempi):
 *   1. istantanea all'inizio del piano 2 con 3 oggetti → ricarica → «Riprendi» in Piazza Dante → stesso
 *      personaggio, piano, Maschere, monete/bombe/chiavi, oggetti e statistiche derivate; riprese = 1 nel registro;
 *   2. istantanea rotta o di versione vecchia: ignorata, nessun cartello, nessun errore;
 *   3. mira: leggera inclina il colpo verso il nemico nel cono, non fuori dal cono né da vicino; piena sceglie
 *      la direzione verso il più vicino; spenta = colpo dritto; nemico in volo mai bersaglio;
 *   4. morte vera (subisciColpoGiocatore): istantanea cancellata, conto della notte con la causa giusta, chiuso
 *      con tastiera, gamepad simulato e tocco (contesto con schermo a tocco);
 *   5. nessun errore in ERRORI_TEATRO.
 * Foto: menu con «Riprendi», conto della notte, riga delle Opzioni. Esce con 1 se un caso fallisce.
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const arg = process.argv[3] || '';
const foto = (n) => (path.isAbsolute(arg) ? `${arg}-${n}.png`
  : path.join(RADICE, 'production', 'qa', 'evidence', `teatro-assistenza-${arg ? arg + '-' : ''}${n}.png`));

const esiti = [];
const ok = (nome, cond, info) => { esiti.push({ nome, ok: Boolean(cond), info }); console.log(`${cond ? 'OK ' : 'NO '} ${nome}${info !== undefined ? ' ' + JSON.stringify(info) : ''}`); };

/** Sondaggio contato: ripete `f` fino a `n` volte (pausa breve fra un tentativo e l'altro) finché dà un valore vero. */
async function finche(p, f, n = 120) {
  for (let i = 0; i < n; i++) { const v = await p.evaluate(f); if (v) return v; await p.waitForTimeout(50); }
  return null;
}

async function apri(browser, opz = {}) {
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...opz });
  const p = await ctxB.newPage();
  const err = [];
  p.on('pageerror', (e) => err.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
  await p.addInitScript(() => {
    window.__padAcceso = false;
    window.__pad = { id: 'Pad finto (QA)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => (window.__padAcceso ? [window.__pad, null, null, null] : [null, null, null, null]) });
  });
  await p.goto('file://' + file);
  return { ctxB, p, err };
}

/** Dal menu all'hub (Spazio), come fa il giocatore. */
async function allHub(p) {
  await finche(p, () => window.__teatro && window.__teatro.fase === 'menu_selezione', 60);
  await p.keyboard.press('Space');
  const r = await finche(p, () => window.__teatro.fase === 'hub', 120);
  // i dialoghi d'ingresso della piazza si chiudono come fa il giocatore (Invio), contati
  for (let i = 0; i < 40; i++) {
    await p.waitForTimeout(60);
    if (!(await p.evaluate(() => window.__teatro.t4qa && window.__teatro.t4qa.dialogo))) break;
    await p.keyboard.press('Enter');
  }
  return r;
}

/** Run nuova col personaggio dato, piano 1 pronto (niente sipario). */
const nuovaRunQA = (p, pg) => p.evaluate((pg) => {
  selezionaPersonaggio(pg); statoRun.fase = 'in_gioco'; nuovaRun(false); statoRun.siparioAttivo = null; return statoRun.piano;
}, pg);

/** Morte vera dalla logica del gioco: un colpo di una guardia a mezza Maschera. */
async function muori(p) {
  await p.evaluate(() => {
    statoRun.siparioAttivo = null; player.invuln = 0; statoRun.graziaIngressoC = 0; statoRun.scudoRosaC = false; statoRun.scudoStanzaD = 0;
    statoRun.hpHalf = 1; subisciColpoGiocatore(2, 'Guardia Borbonica Reale', player.x + 12, player.y);
  });
  const passata = await finche(p, () => window.__teatro.fase === 'morte', 60);
  const conto = await finche(p, () => window.__teatro.fase === 'hub' && window.__teatro.interni.registroA7.pergamena, 240);
  return { passata: Boolean(passata), conto };
}

(async () => {
  const browser = await chromium.launch();
  let { ctxB, p, err } = await apri(browser);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  ok('hub raggiunto', await allHub(p));

  // ---------- 1. istantanea, ricarica, ripresa ----------
  await nuovaRunQA(p, 'agnese');
  const atteso = await p.evaluate(() => {
    const presi = CATALOGO_OGGETTI.filter((o) => o.mod && !o.mod.volo && (o.mod.dmgUp || o.mod.cadenzaUp || o.mod.rangeUp || o.mod.speedUp)).slice(0, 3);
    for (const o of presi) statoRun.oggettiEquipaggiati.push({ ...o });
    ricalcolaStatistiche();
    statoRun.monete = 7; statoRun.bombe = 2; statoRun.chiavi = 3; statoRun.hpHalf = Math.max(1, statoRun.maxHpHalf - 1);
    avviaPiano(2, false); statoRun.siparioAttivo = null;
    const s = window.__teatro.interni.assistenzaE6.istantanea();
    return { scritta: Boolean(s && s.piano === 2), pg: statoRun.personaggioId, piano: statoRun.piano, hp: statoRun.hpHalf, max: statoRun.maxHpHalf,
      monete: statoRun.monete, bombe: statoRun.bombe, chiavi: statoRun.chiavi, ids: statoRun.oggettiEquipaggiati.map((o) => o.id),
      dmg: statoRun.dmg, cad: statoRun.colpiAlSec, spd: statoRun.speed, range: statoRun.range, attivo: statoRun.oggettoAttivo.id, presi: presi.length };
  });
  ok('istantanea scritta all\'inizio del piano 2 con 3 oggetti', atteso.scritta && atteso.presi === 3, { piano: atteso.piano, ids: atteso.ids });
  await p.reload();
  await allHub(p);
  const cartello = await finche(p, () => window.__teatro.interni.assistenzaE6.cartello, 60);
  ok('cartello «Riprendi» in Piazza Dante', cartello && cartello.piano === 2 && cartello.personaggio === 'agnese', cartello);
  await p.screenshot({ path: foto('riprendi') });
  await p.keyboard.press('Enter');
  const dopo = await finche(p, () => window.__teatro.fase === 'in_gioco' && (() => ({ pg: statoRun.personaggioId, piano: statoRun.piano, hp: statoRun.hpHalf, max: statoRun.maxHpHalf,
    monete: statoRun.monete, bombe: statoRun.bombe, chiavi: statoRun.chiavi, ids: statoRun.oggettiEquipaggiati.map((o) => o.id),
    dmg: statoRun.dmg, cad: statoRun.colpiAlSec, spd: statoRun.speed, range: statoRun.range, attivo: statoRun.oggettoAttivo.id,
    riprese: (window.__teatro.interni.runInCorsoA7() || {}).riprese }))(), 60);
  const uguali = dopo && ['pg', 'piano', 'hp', 'max', 'monete', 'bombe', 'chiavi', 'attivo'].every((k) => dopo[k] === atteso[k])
    && JSON.stringify(dopo.ids) === JSON.stringify(atteso.ids)
    && ['dmg', 'cad', 'spd', 'range'].every((k) => Math.abs(dopo[k] - atteso[k]) < 1e-9);
  ok('ripresa: stessa dotazione e stesse statistiche derivate', uguali, { atteso, dopo });
  ok('registro: riprese = 1', dopo && dopo.riprese === 1, dopo && dopo.riprese);
  ok('istantanea riscritta con la ripresa contata', await p.evaluate(() => { const s = window.__teatro.interni.assistenzaE6.istantanea(); return s && s.piano === 2 && s.riprese === 1; }));

  // ---------- 3. mira ---------- (run pulita: con «triplo»/«doppia» il primo colpo non è quello centrale)
  await nuovaRunQA(p, 'ferruccio');
  const m = await p.evaluate(() => {
    const st = statoRun.stanzaCorrente; const out = {};
    const prova = (modo, ex, ey, extra = {}) => {
      OPZIONI.miraAssistitaScelta = true; OPZIONI.miraAssistita = modo;
      const n = { x: ex, y: ey, hp: 10, r: 8, nome: 'prova', ...extra }; st.nemici.push(n);
      statoRun.siparioAttivo = null; statoRun.proiettili.length = 0; player.cooldown = 0; player.x = 200; player.y = 200;
      eseguiAttacco4Direzioni(1, 0);
      st.nemici.splice(st.nemici.indexOf(n), 1);
      const q = statoRun.proiettili[0]; statoRun.proiettili.length = 0;
      return q ? +(Math.atan2(q.vy, q.vx) * 180 / Math.PI).toFixed(3) : null;
    };
    const salvaNemici = st.nemici.splice(0);
    out.cono = prova('leggera', 330, 225);
    out.fuori = prova('leggera', 330, 300);
    out.vicino = prova('leggera', 232, 208);
    out.inVolo = prova('leggera', 330, 225, { airZ: 40 });
    out.spenta = prova('spenta', 330, 225);
    OPZIONI.miraAssistita = 'piena';
    const n = { x: 200, y: 320, hp: 10, r: 8 }; st.nemici.push(n);
    statoRun.proiettili.length = 0; player.cooldown = 0; player.x = 200; player.y = 200; player.dirX = 1; player.dirY = 0;
    window.__teatro.interni.miraE6.sparaSenzaDirezione();
    const q = statoRun.proiettili[0]; out.piena = q ? [Math.round(q.vx), Math.round(q.vy)] : null;
    st.nemici.splice(st.nemici.indexOf(n), 1); statoRun.proiettili.length = 0;
    st.nemici.push(...salvaNemici);
    out.max = window.__teatro.interni.ASSISTENZA_E6.mira.correzioneMaxGradi;
    delete OPZIONI.miraAssistitaScelta; OPZIONI.miraAssistita = 'spenta';
    return out;
  });
  ok('mira leggera: inclina verso il nemico nel cono (≤ massimo)', m.cono > 0.5 && m.cono <= m.max + 1e-6, m.cono);
  ok('mira leggera: fuori dal cono il colpo resta dritto', m.fuori === 0, m.fuori);
  ok('mira leggera: da vicino nessuna correzione', m.vicino === 0, m.vicino);
  ok('mira: un nemico in volo non è bersaglio', m.inVolo === 0, m.inVolo);
  ok('mira spenta: colpo identico (dritto)', m.spenta === 0, m.spenta);
  ok('mira piena: spara verso il più vicino (giù)', m.piena && m.piena[0] === 0 && m.piena[1] > 0, m.piena);

  // ---------- opzioni ----------
  await p.evaluate(() => { apriOpzioniB3('pausa'); b3.opz.sel = righeB3('scena').findIndex((x) => x.id === 'miraAssistita'); });
  await p.waitForTimeout(120);
  const riga = await p.evaluate(() => window.__teatro.interni.comandiB3.stato.opzioni);
  ok('riga «Mira assistita» nelle Opzioni', riga && riga.riga === 'miraAssistita', riga);
  await p.screenshot({ path: foto('opzioni') });
  await p.keyboard.press('ArrowRight');
  const scelta = await p.evaluate(() => ({ modo: window.__teatro.interni.miraE6.modo(), salvata: JSON.parse(localStorage.getItem('ferruccio.teatro.opzioni') || '{}') }));
  ok('la scelta del giocatore si ricorda', scelta.salvata.miraAssistitaScelta === true && scelta.salvata.miraAssistita === scelta.modo, scelta.modo);
  await p.evaluate(() => { chiudiOpzioniB3(); OPZIONI.miraAssistitaScelta = false; OPZIONI.miraAssistita = 'spenta'; salvaOpzioni(); });

  // ---------- 4. morte: istantanea via, conto, chiusura con tastiera ----------
  let morte = await muori(p);
  ok('morte vera: passa per la sequenza e torna in piazza col conto', morte.passata && morte.conto, morte.conto);
  ok('conto: la causa giusta', morte.conto && /Guardia/.test(morte.conto.causa), morte.conto && morte.conto.causa);
  ok('istantanea cancellata dopo la morte', await p.evaluate(() => window.__teatro.interni.assistenzaE6.istantanea() === null));
  ok('nessun cartello «Riprendi» dopo la morte', await p.evaluate(() => window.__teatro.interni.assistenzaE6.cartello === null));
  await p.waitForTimeout(150);
  await p.screenshot({ path: foto('conto') });
  await p.keyboard.press('Enter');
  ok('conto chiuso con la tastiera', await finche(p, () => !window.__teatro.interni.registroA7.pergamena, 20));

  // gamepad simulato: Ⓐ
  await nuovaRunQA(p, 'ferruccio');
  morte = await muori(p);
  await p.evaluate(() => { window.__padAcceso = true; });
  await p.waitForTimeout(100);
  await p.evaluate(() => { const b = window.__pad.buttons[0]; b.pressed = true; b.value = 1; });
  const chiusoPad = await finche(p, () => !window.__teatro.interni.registroA7.pergamena, 30);
  await p.evaluate(() => { const b = window.__pad.buttons[0]; b.pressed = false; b.value = 0; window.__padAcceso = false; });
  ok('conto chiuso col gamepad simulato (Ⓐ)', morte.conto && chiusoPad);
  ok('nessun errore (desktop)', await p.evaluate(() => ERRORI_TEATRO.length === 0) && err.length === 0, err.slice(0, 3));

  // ---------- 2. istantanea rotta ----------
  for (const [nome, valore] of [['testo rotto', '{non è json'], ['versione vecchia', JSON.stringify({ versione: 0, piano: 2, personaggio: 'ferruccio', oggetti: [], hpHalf: 4 })],
    ['personaggio inesistente', JSON.stringify({ versione: 1, piano: 2, personaggio: 'nessuno', oggetti: [], hpHalf: 4 })]]) {
    await p.evaluate((v) => localStorage.setItem('ferruccio.teatro.ripresa.' + (window.__teatroT3 ? window.__teatroT3.salvataggi.slotAttivo : 0), v), valore);
    await p.reload();
    await allHub(p);
    await p.waitForTimeout(150);
    const s = await p.evaluate(() => ({ snap: window.__teatro.interni.assistenzaE6.istantanea(), cartello: window.__teatro.interni.assistenzaE6.cartello, errori: ERRORI_TEATRO.length }));
    ok(`istantanea ${nome}: ignorata senza errori`, s.snap === null && s.cartello === null && s.errori === 0, s);
  }
  ok('nessun errore della pagina', err.length === 0, err.slice(0, 3));
  await ctxB.close();

  // ---------- tocco: conto chiuso con un tocco ----------
  ({ ctxB, p, err } = await apri(browser, { hasTouch: true, isMobile: false }));
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await allHub(p);
  await nuovaRunQA(p, 'ferruccio');
  morte = await muori(p);
  const box = await p.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.touchscreen.tap(box.x, box.y);
  ok('conto chiuso con un tocco', morte.conto && await finche(p, () => !window.__teatro.interni.registroA7.pergamena, 30));
  ok('nessun errore (tocco)', await p.evaluate(() => ERRORI_TEATRO.length === 0) && err.length === 0, err.slice(0, 3));
  await ctxB.close();
  await browser.close();

  const falliti = esiti.filter((e) => !e.ok);
  console.log(JSON.stringify({ casi: esiti.length, falliti: falliti.map((f) => f.nome) }, null, 1));
  process.exit(falliti.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
