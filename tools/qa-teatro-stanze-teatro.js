#!/usr/bin/env node
/*
 * tools/qa-teatro-stanze-teatro.js — verifica Playwright della squadra d4 (gioco/teatro/d4-stanze-teatro.js):
 * la Buca dell'Orchestra, la terna della Smorfia al Banco del Lotto, i Camerini dietro le Quinte.
 * Uso: node tools/qa-teatro-stanze-teatro.js [file html] [prefisso screenshot] [semi]
 *   QA_D4_SOLO=CTB limita le parti (C = Camerini e tappeto, T = terna, B = Buca).
 * Esce con 1 se un controllo fallisce o se ERRORI_TEATRO / la console hanno errori. Gli screenshot vanno GUARDATI.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-stanze-teatro');
const SEMI = Number(process.argv[4]) || 150;
const SOLO = (process.env.QA_D4_SOLO || 'CTB').toUpperCase();
const foto = (n) => (fs.existsSync(prefisso) && fs.statSync(prefisso).isDirectory()
  ? path.join(prefisso, `${n}.png`) : `${prefisso}-${n}.png`);

(async () => {
  fs.mkdirSync(path.dirname(foto('x')), { recursive: true });
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  const esiti = [];
  const ok = (nome, vero, dati) => { esiti.push({ nome, ok: Boolean(vero), dati }); return Boolean(vero); };
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);

  /** Run nuova al piano dato, sipario chiuso. */
  const prepara = (piano, notte = 3) => p.evaluate(({ piano, notte }) => {
    const I = window.__teatro.interni;
    I.statoRun.fase = 'in_gioco';
    nuovaRun(false);
    I.statoRun.numeroNotte = notte;
    I.statoRun.siparioAttivo = null;
    avviaPiano(piano, false);
    I.statoRun.siparioAttivo = null;
    I.statoRun.maxHpHalf = 6; I.statoRun.hpHalf = 6;
    return I.statoRun.piano;
  }, { piano, notte });

  /**
   * Rigenera il piano finché c'è una stanza `tipo` che soddisfa `filtro` (sorgente di una funzione s => bool),
   * poi ci entra dalla sua porta partendo dalla stanza genitore.
   */
  const vaiIn = (tipo, filtro = '() => true') => p.evaluate(({ tipo, filtro }) => {
    const I = window.__teatro.interni;
    const f = eval(filtro);
    const trova = () => I.statoRun.mappa.stanze.find((x) => x.tipo === tipo && f(x));
    for (let k = 0; k < 900 && !trova(); k++) avviaPiano(I.statoRun.piano, false);
    I.statoRun.siparioAttivo = null;
    const s = trova();
    if (!s) return { dentro: false, motivo: 'non trovata' };
    const m = I.statoRun.mappa;
    const [lato, idG] = Object.entries(s.porte)[0];
    const g = m.perId.get(idG);
    I.statoRun.stanzaCorrente = g; g.pulita = true; g.nemici = [];
    I.statoRun.proiettiliNemici = [];
    I.player.invuln = 0;
    const h0 = I.statoRun.hpHalf;
    entraInStanza(s, lato);
    return { dentro: I.statoRun.stanzaCorrente === s, lato, costo: h0 - I.statoRun.hpHalf, banner: I.statoRun.banner, idG };
  }, { tipo, filtro });

  const scatta = async (nome, attesa = 300) => { await p.waitForTimeout(attesa); await p.screenshot({ path: foto(nome) }); };
  const rettCanvas = () => p.evaluate(() => { const r = document.getElementById('c').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  /** Ritaglio dello schermo attorno a un punto del palco (coordinate 640×360). */
  const ritaglio = async (cx, cy, mezzo = 40) => {
    const r = await rettCanvas();
    const k = r.w / 640;
    return p.screenshot({ clip: { x: r.x + (cx - mezzo) * k, y: r.y + (cy - mezzo) * k, width: mezzo * 2 * k, height: mezzo * 2 * k } });
  };

  // =========================================================================
  // C. I CAMERINI DIETRO LE QUINTE (stanza `maledetta` di a3) e il premio sotto il tappeto
  // =========================================================================
  if (SOLO.includes('C')) {
    await prepara(2);
    // la regola resta quella dei rovi: ½ Maschera a ogni passaggio, rifiuto all'ultima mezza
    const reg = await p.evaluate(() => {
      const I = window.__teatro.interni;
      const T = I.STANZE_SPECIALI_A3.maledetta;
      for (let k = 0; k < 900 && !I.statoRun.mappa.stanze.some((x) => x.tipo === 'maledetta' && x.maledettaA3.contenuto !== 'nemici'); k++) avviaPiano(I.statoRun.piano, false);
      I.statoRun.siparioAttivo = null;
      const m = I.statoRun.mappa; const s = m.stanze.find((x) => x.tipo === 'maledetta');
      const [lato, idG] = Object.entries(s.porte)[0]; const g = m.perId.get(idG);
      I.statoRun.stanzaCorrente = g; g.pulita = true; g.nemici = [];
      I.statoRun.hpHalf = I.statoRun.maxHpHalf; I.player.invuln = 0;
      const banner = [];
      const h0 = I.statoRun.hpHalf;
      entraInStanza(s, lato);
      const h1 = I.statoRun.hpHalf; banner.push(I.statoRun.banner);
      entraInStanza(g, { N: 'S', S: 'N', E: 'W', W: 'E' }[lato]);
      const h2 = I.statoRun.hpHalf;
      I.statoRun.hpHalf = T.costoHalf;
      entraInStanza(s, lato);
      const rifiuto = I.statoRun.stanzaCorrente === g && I.statoRun.hpHalf === T.costoHalf; banner.push(I.statoRun.banner);
      I.statoRun.hpHalf = I.statoRun.maxHpHalf;
      return { costoEntrata: h0 - h1, costoUscita: h1 - h2, rifiuto, banner, contenuto: s.maledettaA3.contenuto };
    });
    ok('Camerini: ½ Maschera in entrata e in uscita (regola di a3)', reg.costoEntrata === 1 && reg.costoUscita === 1, reg);
    ok('Camerini: rifiuto all\'ultima mezza Maschera', reg.rifiuto, reg);
    ok('Camerini: banner d\'ingresso col nome nuovo', /CAMERINI DIETRO LE QUINTE/.test(reg.banner[0]) || /chiodo/.test(reg.banner[0]), reg.banner);
    ok('Camerini: nessun banner parla più di rovi', reg.banner.every((b) => !/\brov[io]\b/i.test(b)) && /chiodo/i.test(reg.banner[1]), reg.banner);
    const sost = await p.evaluate(() => {
      // ogni testo dei rovi che a3 può mostrare viene sostituito (la chiave deve esistere ancora nel sorgente di a3)
      const I = window.__teatro.interni; const fuori = [];
      const src = [primaDellaPortaA3, dopoIngressoA3, premioCustodiA3].map(String).join('\n');
      for (const [da, a] of I.stanzeTeatroD4.sostituzioni) {
        if (!src.includes(da)) fuori.push('chiave non più in a3: ' + da);
        mostraBanner(da, 10);
        if (I.statoRun.banner !== a) fuori.push('non sostituito: ' + da);
      }
      const chiavi = [...I.stanzeTeatroD4.sostituzioni.keys()];
      const rimasti = src.split('\n').map((r) => r.replace(/\/\/.*$/, '')).filter((r) => /\brov[io]\b/i.test(r))
        .filter((r) => !chiavi.some((k) => r.includes(k)) && !r.includes("'i rovi della porta'"));
      return { fuori, rimasti, quante: I.stanzeTeatroD4.sostituzioni.size };
    });
    ok('Camerini: tutti i testi dei rovi di a3 hanno la loro sostituzione', sost.fuori.length === 0 && sost.rimasti.length === 0 && sost.quante === 6, sost);

    // custodi = manichini
    const cust = await vaiIn('maledetta', '(s) => s.maledettaA3.contenuto === "nemici"');
    const custodi = await p.evaluate(() => {
      const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
      I.player.x = 320; I.player.y = 250; I.player.invuln = 99999;
      return { n: st.nemici.length, tutti: st.nemici.every((n) => n.manichinoD4 && n.tipo === 'burattino' && /Manichino/.test(n.nome) && n.speed > 0), pulita: st.pulita, banner: I.statoRun.banner };
    });
    ok('Camerini: i custodi sono manichini (IA del burattino) e la stanza è chiusa', cust.dentro && custodi.n > 0 && custodi.tutti && !custodi.pulita, custodi);
    ok('Camerini: banner dei manichini che si animano', /manichini si animano/.test(custodi.banner), custodi.banner);
    await scatta('camerini-custodi', 1600);
    // la posa dell'anticipo: ago alzato
    await p.evaluate(() => { const I = window.__teatro.interni; for (const n of I.statoRun.stanzaCorrente.nemici) n.shootCd = 16; });
    await scatta('camerini-anticipo', 60);
    const caduti = await p.evaluate(() => {
      const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
      for (const n of st.nemici) n.hp = 0;
      verificaStanzaPulita();
      I.player.invuln = 0;
      return { pulita: st.pulita, banner: I.statoRun.banner, monete: st.oggettiATerra.filter((o) => o.tipo === 'moneta').length };
    });
    ok('Camerini: caduti i manichini il premio c\'è (regola di a3)', caduti.pulita && caduti.monete >= 3 && /manichini tornano di legno/.test(caduti.banner), caduti);

    // forziere: prima era sotto il tappeto
    const forz = await vaiIn('maledetta', '(s) => s.maledettaA3.contenuto === "forziere"');
    const fz = await p.evaluate(() => {
      const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
      I.player.x = 250; I.player.y = 250;
      const f = (st.forzieriA1 || [])[0];
      return { forzieri: (st.forzieriA1 || []).length, x: f && f.x, y: f && f.y, ripassati: I.stanzeTeatroD4.sopraIlTappeto(st, 0) };
    });
    ok('Camerini col forziere: il forziere c\'è e viene ripassato sopra il fondo', forz.dentro && fz.forzieri === 1 && fz.ripassati >= 1, fz);
    await scatta('camerini-forziere', 400);

    // ogni tipo di stanza di a3 con un forziere: prima (correzione spenta) e dopo
    const diversi = {};
    for (const tipo of ['sfida', 'sacrificio', 'bisca', 'maledetta']) {
      await p.evaluate(() => { const I = window.__teatro.interni; I.statoRun.hpHalf = I.statoRun.maxHpHalf; });
      const v = await vaiIn(tipo);
      if (!v.dentro) { diversi[tipo] = 'non entrato'; continue; }
      await p.evaluate(() => {
        const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
        st.forzieriA1 = []; I.generaForziere('comune', 380, 214, st);
        I.player.x = 300; I.player.y = 270; I.statoRun.banner = ''; I.statoRun.bannerTimer = 0;
        I.stanzeTeatroD4.prova.sopraIlTappeto = false;
      });
      await p.waitForTimeout(200);
      const prima = await ritaglio(380, 210, 26);
      await p.screenshot({ path: foto(`tappeto-${tipo}-prima`) });
      await p.evaluate(() => { window.__teatro.interni.stanzeTeatroD4.prova.sopraIlTappeto = true; });
      await p.waitForTimeout(200);
      const dopo = await ritaglio(380, 210, 26);
      await p.screenshot({ path: foto(`tappeto-${tipo}-dopo`) });
      diversi[tipo] = !prima.equals(dopo);
    }
    ok('Tappeto: in sfida, sacrificio e bisca il forziere ora si vede sopra il fondo (prima/dopo diversi)', diversi.sfida === true && diversi.sacrificio === true && diversi.bisca === true, diversi);

    // minimappa e porta vista da fuori
    const fuori = await p.evaluate(() => {
      const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente; // siamo nei Camerini
      const [lato, idG] = Object.entries(st.porte)[0]; const g = I.statoRun.mappa.perId.get(idG);
      I.statoRun.hpHalf = I.statoRun.maxHpHalf; I.player.invuln = 0;
      entraInStanza(g, { N: 'S', S: 'N', E: 'W', W: 'E' }[lato]);
      g.pulita = true; g.nemici = [];
      return { stanza: I.statoRun.stanzaCorrente.tipo, lato: Object.entries(g.porte).find(([, id]) => id === st.id)[0] };
    });
    ok('Camerini: usciti, la porta di servizio si vede dalla stanza accanto', fuori.stanza === 'normale', fuori);
    await scatta('camerini-porta-da-fuori', 400);
  }

  // %%QA-TERNA%%

  // %%QA-BUCA%%

  const erroriTeatro = await p.evaluate(() => (typeof ERRORI_TEATRO !== 'undefined' ? ERRORI_TEATRO.map((e) => `${e.dove}: ${e.testo}`) : ['ERRORI_TEATRO assente']));
  ok('nessun errore in ERRORI_TEATRO', erroriTeatro.length === 0, erroriTeatro);
  ok('nessun errore di console', errori.length === 0, errori.slice(0, 8));
  await browser.close();
  const falliti = esiti.filter((e) => !e.ok);
  console.log(JSON.stringify({ file: path.relative(RADICE, file), solo: SOLO, controlli: esiti.length, falliti: falliti.length,
    esiti: esiti.map((e) => (e.ok ? `ok  ${e.nome}` : `NO  ${e.nome} ${JSON.stringify(e.dati)}`)) }, null, 1));
  process.exit(falliti.length ? 1 : 0);
})();
