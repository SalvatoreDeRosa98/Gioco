#!/usr/bin/env node
/*
 * tools/qa-teatro-anfiteatro.js — verifica Playwright della squadra h7 (gioco/teatro/h7-anfiteatro.js):
 * l'Anfiteatro Campano, seconda uscita del piano 3 venendo dall'Acquedotto.
 *   A. IL PERCORSO: dopo il Guardiano delle Acque compare il condotto asciutto (mai dopo il boss della Villa);
 *      [E] → il piano 3 è l'Anfiteatro (zonaP3); la botola → San Leucio di sempre; il piano 4 azzera zonaP3;
 *      niente telaio di Agnese all'Anfiteatro; HUD, sipario, conto della notte.
 *   B. I NEMICI e i GIURAMENTI. C. IL GIUDICE DELL'ARENA. D. AGNESE, PREMIO, MUSICA, MESSAGGIO DEL PADRE.
 *   Z. Nessun errore in console.
 * Uso: node tools/qa-teatro-anfiteatro.js <file html> [prefisso screenshot]
 * Passi di logica contati (passoLogico) a ciclo fermo: niente attese a tempo reale per la logica.
 * Esce con 1 se un controllo fallisce. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { fermaCiclo, passi } = require('./qa-teatro-comune');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-h7');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const err = [];
  p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
  p.on('pageerror', (e) => err.push(String(e)));
  const esiti = [];
  const ok = (caso, cond, dati) => { if (process.env.QA_H7_TRACCIA) console.log('·', caso, Boolean(cond)); esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) }); };
  const scatta = (nome) => p.locator('#c').screenshot({ path: foto(nome) });
  const disegna = () => p.evaluate(() => { try { a6.coda.length = 0; a6.notifica = null; } catch (_) { /* */ } try { disegnaFrame(16); } catch (_) { /* rete del disegno */ } });

  await p.goto('file://' + file);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await p.waitForFunction(() => window.__teatro && window.__teatro.fase === 'menu_selezione', null, { timeout: 30000 });
  await p.keyboard.press('Space');
  await p.waitForFunction(() => window.__teatro.fase === 'hub', null, { timeout: 30000 });
  await fermaCiclo(p, true);

  /** Run nuova al piano 2 (Acquedotto se `acq`), dentro la stanza del boss, boss abbattuto e stanza pulita. */
  const battiBossP2 = (acq) => p.evaluate((acq) => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    selezionaPersonaggio('ferruccio'); R.fase = 'in_gioco'; nuovaRun(false); R.siparioAttivo = null;
    if (acq) I.acquedottoD6.segna(2, true);
    avviaPiano(2, false); R.siparioAttivo = null; R.cartiglioD = null;
    const st = R.mappa.stanze.find((s) => s.tipo === 'boss');
    entraInStanza(st, 'S');
    for (const n of st.nemici) n.hp = 0;
    verificaStanzaPulita();
    P.x = 320; P.y = 250;
    return { pulita: st.pulita, boss: (st.nemici.find((n) => n.boss) || {}).bossId, condotto: I.anfiteatroH7.condotto };
  }, acq);

  // ---- A. IL PERCORSO ----
  const villa = await battiBossP2(false);
  ok('A: alla Villa nessun condotto', villa.pulita && !villa.condotto, villa);
  const acq = await battiBossP2(true);
  ok('A: dopo il Guardiano compare il condotto', acq.pulita && acq.boss === 'guardiano-acque' && acq.condotto, acq);
  await passi(p, 50); await disegna(); await scatta('a-condotto');
  const giu = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const c = I.anfiteatroH7.condotto;
    I.player.x = c.x; I.player.y = c.y + 10; interagisciStanza(); R.siparioAttivo = null;
    const q = getQuartierePiano(R.piano);
    return { piano: R.piano, zona: R.zonaP3, q: q.id, nome: q.nome, telaio: R.mappa.stanze.some((s) => s.tipo === 'telaio'),
      luogo: I.anfiteatroH7.attivo(), atto: getRaccontoAtto(R.piano, 1).titolo, voce: a7.run && a7.run.zonaP3H7 };
  });
  ok('A: [E] → piano 3 all\'Anfiteatro', giu.piano === 3 && giu.zona === 'anfiteatro' && giu.q === 'anfiteatro-campano' && giu.luogo, giu);
  ok('A: niente telaio di Agnese all\'Anfiteatro', !giu.telaio, giu);
  ok('A: sipario e voce del registro', /DIMENTICATI/.test(giu.atto) && giu.voce === 'anfiteatro', giu);
  const note = await p.evaluate(() => noteVoceE6({ zonaP3H7: 'anfiteatro' }).map((x) => x.join(' ')));
  ok('A: riga «Percorso» nel conto della notte', note.some((t) => /Anfiteatro/.test(t)), note);
  await p.evaluate(() => { const R = window.__teatro.interni.statoRun; entraInStanza(R.mappa.stanze.find((s) => s.tipo === 'normale'), 'S'); R.siparioAttivo = null; });
  await passi(p, 5); await disegna(); await scatta('a-stanza');
  const quattro = await p.evaluate(() => { avviaPiano(4, false); const R = window.__teatro.interni.statoRun; R.siparioAttivo = null; return { zona: R.zonaP3 || null, q: getQuartierePiano(4).id }; });
  ok('A: il piano 4 azzera zonaP3', quattro.zona === null && quattro.q === 'la-reggia', quattro);
  // lontano dal condotto [E] è la botola: San Leucio di sempre
  await battiBossP2(true);
  const leucio = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; I.player.x = 440; I.player.y = 260; interagisciStanza(); R.siparioAttivo = null;
    return { piano: R.piano, zona: R.zonaP3 || null, q: getQuartierePiano(3).id, telaio: R.mappa.stanze.some((s) => s.tipo === 'telaio') };
  });
  ok('A: la botola porta a San Leucio di sempre', leucio.piano === 3 && leucio.zona === null && leucio.q === 'san-leucio' && leucio.telaio, leucio);

  // ---- Z. ERRORI ----
  const erroriTeatro = await p.evaluate(() => (window.ERRORI_TEATRO || []).map((e) => String(e.messaggio || e.msg || e)));
  ok('Z: nessun errore in console', err.length === 0, err.slice(0, 5));
  ok('Z: nessun errore in ERRORI_TEATRO', erroriTeatro.length === 0, erroriTeatro.slice(0, 5));

  await browser.close();
  const rossi = esiti.filter((e) => !e.ok);
  for (const e of esiti) console.log(`${e.ok ? 'OK ' : 'NO '} ${e.caso}${!e.ok && e.dati !== undefined ? ' — ' + JSON.stringify(e.dati).slice(0, 400) : ''}`);
  console.log(`\n${esiti.length - rossi.length}/${esiti.length} controlli superati`);
  process.exit(rossi.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
