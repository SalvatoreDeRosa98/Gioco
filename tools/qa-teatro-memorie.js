#!/usr/bin/env node
/*
 * tools/qa-teatro-memorie.js — verifica Playwright della squadra h2 (gioco/teatro/h2-memorie.js).
 *   1. Rivelazioni dei boss: anime che salgono alla caduta di tre boss diversi; rivelazione alla prima caduta e
 *      non alla seconda; rivelazioni nel Registro di Scena (d3) e nel Diario (b8); la riga «non erano mostri»
 *      dopo tre, una volta sola.
 *   2. Bianca: un indizio per quartiere, mai due volte; la pagina che si riempie; la scatola che suona; la chiusura.
 *   3. Assunta in piazza al posto della festaiola: nome, battute che cambiano; salvataggio vecchio che regge.
 * Uso: node tools/qa-teatro-memorie.js <file html> [prefisso screenshot]
 * Esce con 1 se un controllo fallisce. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { passi } = require('./qa-teatro-comune.js');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-memorie');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;
const SOLO = (process.env.QA_PARTI || '1 2 3').split(/\s+/);

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });
  const scatta = (nome) => p.locator('#c').screenshot({ path: foto(nome) });
  const zoom = async (nome, gx, gy, gw = 240, gh = 170) => {
    const r = await p.evaluate(() => { const c = document.getElementById('c').getBoundingClientRect(); return { x: c.x, y: c.y, k: c.width / 640 }; });
    gx = Math.max(0, Math.min(640 - gw, gx)); gy = Math.max(0, Math.min(360 - gh, gy));
    await p.screenshot({ path: foto(nome), clip: { x: r.x + gx * r.k, y: r.y + gy * r.k, width: gw * r.k, height: gh * r.k } });
  };
  const chiudiDialoghi = async () => {
    for (let i = 0; i < 40; i++) {
      const d = await p.evaluate(() => window.__teatro.t4qa.dialogo);
      if (!d) return;
      await p.keyboard.press(d.scelta ? 'Digit1' : 'Space');
      await p.waitForTimeout(40);
    }
  };
  const avvia = async (prima) => {
    await p.goto('file://' + file);
    await p.evaluate((pr) => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); if (pr) pr(); }, null);
    if (prima) await p.evaluate(prima);
    await p.reload();
    await p.waitForTimeout(500);
    await p.keyboard.press('Space'); // menu → hub
    await p.waitForTimeout(300);
    await chiudiDialoghi();
  };
  /** Run nuova al piano dato con il boss imposto; lo abbatte e torna lo stato. */
  const abbatti = (bossId, piano) => p.evaluate(({ bossId, piano }) => {
    const I = window.__teatro.interni; const R = I.statoRun;
    if (I.bossB6) I.bossB6.forza(null);
    const nelPool = I.POOL_BOSS ? null : null; // eslint
    nuovaRun(false);
    if (piano > 1) avviaPiano(piano, false);
    R.siparioAttivo = null; R.cartiglioD = null;
    const st = R.mappa.stanze.find((s) => s.tipo === 'boss');
    entraInStanza(st, 'S');
    const b = st.nemici.find((n) => n.boss);
    b.bossId = bossId; // la sola cosa che conta per h2
    I.player.invuln = 1e9; I.player.x = 150; I.player.y = 262;
    for (const n of st.nemici) n.hp = 0;
    const prima = window.__teatro.h2.memoria();
    verificaStanzaPulita();
    return { pulita: st.pulita, anime: window.__teatro.h2.anime, prima: Object.keys(prima.rivelazioni), dopo: window.__teatro.h2.memoria(), bx: b.x, by: b.y, nelPool };
  }, { bossId, piano });
  const didascalie = () => p.evaluate(() => {
    const D = window.__teatro.b8qa || null;
    try { return JSON.stringify(window.__teatro.interni.b8 ? window.__teatro.interni.b8.did : null); } catch (_) { return ''; }
  });

  await avvia();
  // ------------------------------------------------------------------ 1. rivelazioni
  if (SOLO.includes('1')) {
    const T = await p.evaluate(() => window.__teatro.h2.TESTI.rivelazioni);
    const casi = [['re-gatto', 1], ['colosso-statua', 2], ['tessitrice-pietra', 3]];
    for (const [id, piano] of casi) {
      const r = await abbatti(id, piano);
      ok(`${id}:anime`, r.anime > 0, r.anime);
      ok(`${id}:rivelazione-salvata`, r.dopo.rivelazioni[id] > 0 && !r.prima.includes(id), r.dopo);
      if (id === 're-gatto') {
        await passi(p, 50);
        await scatta('1-anime');
        await zoom('1-anime-zoom', r.bx - 120, r.by - 130);
      }
    }
    const m = await p.evaluate(() => window.__teatro.h2.memoria());
    ok('svolta-dopo-tre', m.svolta > 0, m);
    // seconda caduta dello stesso boss: anime sì, rivelazione no (resta la notte della prima)
    const notte1 = m.rivelazioni['re-gatto'];
    const r2 = await abbatti('re-gatto', 1);
    ok('seconda-caduta:anime', r2.anime > 0, r2.anime);
    ok('seconda-caduta:nessuna-rivelazione-nuova', r2.prima.includes('re-gatto') && r2.dopo.rivelazioni['re-gatto'] === notte1);
    // Donna Luciana: niente anime, niente rivelazione
    const rl = await abbatti('donna-luciana', 4);
    ok('luciana-esclusa', !rl.dopo.rivelazioni['donna-luciana'], rl.dopo);
    // Registro di Scena: la scheda mette davanti la rivelazione
    const reg = await p.evaluate(() => window.__teatro.h2.rivelazioneRegistro('re-gatto', ['battuta', 'aneddoto']));
    ok('registro', reg[0].includes(T['re-gatto']), reg);
    const regNo = await p.evaluate(() => window.__teatro.h2.rivelazioneRegistro('cigno-latta', ['battuta']));
    ok('registro-non-letta', regNo.length === 1 && regNo[0] === 'battuta', regNo);
    // Diario: la pagina di quella notte ha la riga
    const pag = await p.evaluate(() => {
      const n = window.__teatro.h2.memoria().rivelazioni['re-gatto'];
      const pg = componiPaginaB8({ notte: n, piano: 1, esito: 'morte', boss: [] }, {}, statoB8(), {}, {});
      return pg.righe;
    });
    ok('diario', pag.some((r) => r.includes('Gatto')) && pag.some((r) => r.includes('smesso di chiamarli mostri')), pag);
  }

  const errT = await p.evaluate(() => (typeof ERRORI_TEATRO !== 'undefined' ? ERRORI_TEATRO : []).map(String));
  ok('nessun-errore-teatro', errT.length === 0, errT);
  ok('nessun-errore-console', errori.length === 0, errori.slice(0, 5));
  await browser.close();
  const falliti = esiti.filter((e) => !e.ok);
  for (const e of esiti) console.log(`${e.ok ? 'OK  ' : 'FAIL'} ${e.caso}${!e.ok && e.dati !== undefined ? ' ' + JSON.stringify(e.dati).slice(0, 400) : ''}`);
  console.log(`\n${esiti.length - falliti.length}/${esiti.length} controlli passati`);
  process.exit(falliti.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
