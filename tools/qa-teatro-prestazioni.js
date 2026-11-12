#!/usr/bin/env node
/*
 * tools/qa-teatro-prestazioni.js — verifica Playwright della qualità automatica (gioco/teatro/e4-prestazioni.js).
 * Con tempi finti (passo(ora)) controlla: ordine grana → ombre → pubblico → vignetta, solo dopo l'attesa; le opzioni
 * salvate restano quelle del giocatore; ciò che il giocatore ha spento o cambiato a mano non si tocca; con margine
 * si riaccende in ordine inverso; la riga «Qualità automatica» c'è nelle Opzioni e spegnendola torna tutto acceso.
 * Foto del menu Opzioni su PC e telefono. Uso: node tools/qa-teatro-prestazioni.js <file html> [prefisso foto]
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const pref = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-prestazioni-');
fs.mkdirSync(path.dirname(pref + 'x'), { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const esiti = [];
  const ok = (nome, cond, info) => esiti.push({ nome, ok: Boolean(cond), info });
  for (const [nome, vp, tocco] of [['pc', { width: 1280, height: 720 }, false], ['telefono', { width: 657, height: 416 }, true]]) {
    const p = await browser.newPage({ viewport: vp, hasTouch: tocco, deviceScaleFactor: tocco ? 2 : 1 });
    const errori = []; p.on('pageerror', (e) => errori.push(String(e)));
    await p.goto('file://' + file); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(600);
    if (tocco) { await p.touchscreen.tap(5, 5); await p.waitForTimeout(200); }
    if (nome === 'pc') {
      const r = await p.evaluate(() => {
        const Q = window.__teatro.interni.qualitaAutoE4, K = window.__teatro.interni.QUALITA_E4;
        const out = {};
        out.spentaSottoProva = Q.stato().attiva === false;
        Q.forza(true); Q.azzera();
        for (const k of ['grana', 'ombre', 'pubblico', 'vignetta', 'lampi']) OPZIONI[k] = true;
        OPZIONI.vignetta = false; salvaOpzioni(); // spenta a mano dal giocatore
        let ora = 1000; const giro = (ms, quanto) => { for (let t = 0; t < quanto; t += ms) { ora += ms; Q.passo(ora); } };
        giro(16.7, 2000); out.fluido = Q.stato().spenti.join();
        giro(40, 1500); out.dopo1500 = Q.stato().spenti.join(); // meno dell'attesa: niente
        giro(40, 3000); out.primo = Q.stato().spenti.join();
        giro(40, 14000); out.tutti = Q.stato().spenti.join();
        out.vignettaIntatta = OPZIONI.vignetta === false && !Q.stato().spenti.includes('vignetta');
        out.salvate = JSON.parse(localStorage.getItem('ferruccio.teatro.opzioni'));
        impostaOpzioneB3('volumeMusica', 0.5); // il giocatore salva un'altra opzione mentre è tutto spento
        out.salvateDopo = JSON.parse(localStorage.getItem('ferruccio.teatro.opzioni'));
        out.inMemoria = { grana: OPZIONI.grana, ombre: OPZIONI.ombre, pubblico: OPZIONI.pubblico };
        impostaOpzioneB3('ombre', true); // a mano: non si tocca più
        giro(40, 8000); out.ombreAMano = OPZIONI.ombre === true && !Q.stato().spenti.includes('ombre');
        giro(16.7, 10500); out.riacceso1 = Q.stato().spenti.join();
        giro(16.7, 40000); out.riaccesi = Q.stato().spenti.join();
        out.finale = { grana: OPZIONI.grana, pubblico: OPZIONI.pubblico, vignetta: OPZIONI.vignetta };
        giro(40, 4000); out.dinuovo = Q.stato().spenti.join();
        OPZIONI.qualitaAuto = false; Q.passo(ora += 16);
        out.disattivata = Q.stato().spenti.length === 0 && OPZIONI.grana === true;
        OPZIONI.qualitaAuto = true; Q.forza(null);
        out.ordine = K.ordine.join();
        return out;
      });
      ok('sotto le prove automatiche è spenta da sé', r.spentaSottoProva);
      ok('fluido: non spegne niente', r.fluido === '', r.fluido);
      ok('lenta da meno dell\'attesa: niente', r.dopo1500 === '', r.dopo1500);
      ok('dopo l\'attesa spegne prima la grana', r.primo === 'grana', r.primo);
      ok('poi ombre e pubblico (la vignetta l\'aveva spenta il giocatore)', r.tutti === 'grana,ombre,pubblico', r.tutti);
      ok('la vignetta spenta a mano resta com\'era', r.vignettaIntatta);
      ok('le opzioni salvate restano quelle del giocatore', r.salvate.grana === true && r.salvate.ombre === true && r.salvate.pubblico === true && r.salvate.vignetta === false, r.salvate);
      ok('anche salvando un\'altra opzione', r.salvateDopo.grana === true && r.salvateDopo.pubblico === true && r.salvateDopo.volumeMusica === 0.5 && r.inMemoria.grana === false, { s: r.salvateDopo, m: r.inMemoria });
      ok('un effetto riacceso a mano non si rispegne', r.ombreAMano);
      ok('con margine riaccende l\'ultimo spento (pubblico)', r.riacceso1 === 'grana', r.riacceso1);
      ok('poi tutto', r.riaccesi === '' && r.finale.grana && r.finale.pubblico && r.finale.vignetta === false, r);
      ok('se rallenta di nuovo rispegne', r.dinuovo === 'grana', r.dinuovo);
      ok('«Qualità automatica» spenta: riaccende subito', r.disattivata);
    }
    const riga = await p.evaluate(() => { const R = righeB3('scena'); const i = R.findIndex((x) => x.id === 'qualitaAuto'); return { i, dopoOmbre: i > 0 && R[i - 1].id === 'ombre', n: R.length }; });
    ok(`${nome}: riga «Qualità automatica» dopo «Ombre lunghe»`, riga.dopoOmbre, riga);
    await p.evaluate(() => { apriOpzioniB3('menu'); });
    await p.waitForTimeout(150);
    const scelta = await p.evaluate(() => { const o = b3.opz; o.sel = righeB3(o.pagina).findIndex((x) => x.id === 'qualitaAuto'); return o.sel; });
    await p.waitForTimeout(250);
    await p.screenshot({ path: `${pref}opzioni-${nome}.png` });
    const cambia = await p.evaluate(() => { const prima = OPZIONI.qualitaAuto; impostaOpzioneB3('qualitaAuto', !prima); const s = JSON.parse(localStorage.getItem('ferruccio.teatro.opzioni')); impostaOpzioneB3('qualitaAuto', prima); return { prima, salvata: s.qualitaAuto }; });
    ok(`${nome}: la riga cambia e salva l'opzione`, scelta >= 0 && cambia.prima === true && cambia.salvata === false, cambia);
    ok(`${nome}: nessun errore`, errori.length === 0 && (await p.evaluate(() => (window.ERRORI_TEATRO || []).length)) === 0, errori.join(' | '));
    await p.close();
  }
  await browser.close();
  const falliti = esiti.filter((e) => !e.ok);
  for (const e of esiti) console.log(`${e.ok ? 'OK  ' : 'NO  '} ${e.nome}${e.ok ? '' : '  ' + JSON.stringify(e.info)}`);
  console.log(`\n${esiti.length - falliti.length}/${esiti.length} controlli superati`);
  process.exit(falliti.length ? 1 : 0);
})();
