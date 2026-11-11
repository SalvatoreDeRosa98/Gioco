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
  // pad finto col layout standard (come in qa-teatro-comandi.js)
  await p.addInitScript(() => {
    window.__padAcceso = false;
    window.__pad = {
      id: 'Pad finto (QA)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
    };
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true, value: () => (window.__padAcceso ? [window.__pad, null, null, null] : [null, null, null, null]),
    });
  });
  const padAcceso = (v) => p.evaluate((v) => { window.__padAcceso = v; }, v);
  /** Preme un bottone del pad per `quadri` fotogrammi veri (b3 legge il pad una volta per fotogramma), poi lo rilascia. */
  const premiPad = (i, quadri = 4) => p.evaluate(({ i, quadri }) => new Promise((fatto) => {
    const b = window.__pad.buttons[i];
    const aspetta = (n, poi) => { if (n <= 0) poi(); else requestAnimationFrame(() => aspetta(n - 1, poi)); };
    b.pressed = true; b.value = 1;
    aspetta(quadri, () => { b.pressed = false; b.value = 0; aspetta(quadri, fatto); });
  }), { i, quadri });
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


  // =========================================================================
  // T. LA TERNA DELLA SMORFIA AL BANCO DEL LOTTO
  // =========================================================================
  if (SOLO.includes('T')) {
    const tab = await p.evaluate(() => {
      const I = window.__teatro.interni, D = I.stanzeTeatroD4, K = I.STANZE_TEATRO_D4.terna;
      const ev = D.terna.valoreAtteso();
      const doppioni = Object.keys(D.SMORFIA_D4).filter((k) => SMORFIA_A3[k] !== undefined);
      const fuori = Object.keys(D.SMORFIA_D4).filter((k) => !(Number(k) >= 1 && Number(k) <= 90) || !D.SMORFIA_D4[k]);
      const rosa = D.terna.rosa(() => 0.37);
      return { ev, somma: ev.prob.reduce((a, b) => a + b, 0), doppioni, fuori, nuovi: Object.keys(D.SMORFIA_D4).length,
        rosa, conSenso: rosa.every((n) => Boolean(D.smorfia(n))), diversi: new Set(rosa).size === K.rosa,
        aggancio: String(giocaLottoA3).includes('smorfiaD4'), costo: K.costo, premi: K.premi };
    });
    ok('Terna: probabilità ipergeometriche (somma 1; nessuno 26,4% · uno 49,5% · ambo 22,0% · terno 2,2%)',
      Math.abs(tab.somma - 1) < 1e-9 && Math.abs(tab.ev.prob[0] - 0.2637) < 0.001 && Math.abs(tab.ev.prob[1] - 0.4945) < 0.001
      && Math.abs(tab.ev.prob[2] - 0.2198) < 0.001 && Math.abs(tab.ev.prob[3] - 0.022) < 0.001, tab.ev);
    ok('Terna: valore atteso sotto il costo senza il terno, e poco sotto col terno', tab.ev.senzaTerno < tab.costo && tab.ev.conTerno < tab.costo && tab.ev.conTerno > tab.costo * 0.9, tab.ev);
    ok('Terna: premi crescenti (uno < ambo < terno, il terno dà un oggetto Forte)', tab.premi[1].monete > 0 && tab.premi[1].monete < tab.costo && tab.premi[2].monete > tab.costo && tab.premi[3].oggettoForte === true, tab.premi);
    ok('Smorfia ampliata: numeri nuovi fra 1 e 90, nessuno ridefinito, e la giocata semplice la legge', tab.nuovi >= 20 && tab.doppioni.length === 0 && tab.fuori.length === 0 && tab.aggancio, tab);
    ok('Terna: la rosa ha 15 numeri diversi, tutti con un significato', tab.rosa.length === 15 && tab.conSenso && tab.diversi, tab.rosa);

    await prepara(2);
    await vaiIn('bisca');
    const vicino = () => p.evaluate(() => { const I = window.__teatro.interni; const P = I.STANZE_TEATRO_D4.terna.posto; I.player.x = P.x - 6; I.player.y = P.y + 30; I.player.targetX = null; I.player.targetY = null; });
    const terna = () => p.evaluate(() => {
      const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente; const T = st.ternaD4;
      return { monete: I.statoRun.monete, contesto: contestoB3(), banner: I.statoRun.banner,
        aperta: Boolean(T && T.aperta), fase: T && T.fase, scelti: T ? T.scelti.slice() : [], cursore: T && T.cursore, rosa: T && T.rosa ? T.rosa.slice() : [],
        estratti: T ? T.estratti.slice() : [], mostrati: T && T.mostrati, presi: T && T.presi, giocata: Boolean(T && T.giocata), pagata: Boolean(T && T.pagata), premio: T && T.premio,
        aTerra: st.oggettiATerra.filter((o) => o.tipo === 'moneta').length,
        piedistallo: st.oggettoPiedistallo && !st.oggettoPiedistallo.preso ? { tier: st.oggettoPiedistallo.tier, forteGratis: st.oggettoPiedistallo.forteGratis } : null };
    });
    /** Terna nuova (stesso banco), monete date, estrazione forzata: rnd = () => 0 fa uscire i primi cinque della rosa. */
    const nuova = (monete) => p.evaluate((monete) => {
      const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
      st.ternaD4 = null; st.oggettoPiedistallo = null; st.oggettiATerra = [];
      I.statoRun.poolRunB = null; // pool della notte nuovo: i tanti piani rigenerati dalla QA lo avevano svuotato dei Forti
      I.statoRun.monete = monete; I.stanzeTeatroD4.prova.rngTerna = () => 0;
    }, monete);

    // senza monete non si apre
    await nuova(2); await vicino();
    await p.keyboard.press('KeyE'); await p.waitForTimeout(120);
    let t = await terna();
    ok('Terna: senza 3 monete il cartellone non si apre (e lo dice)', !t.aperta && t.monete === 2 && /ce vonno 3/.test(t.banner), t);

    // tastiera: si apre con E, si segna con frecce + Invio, Esc lascia senza pagare
    await nuova(10); await vicino();
    await p.keyboard.press('KeyE'); await p.waitForTimeout(150);
    t = await terna();
    ok('Terna: [E] vicino al cartellone apre il riquadro, che per b3 è un menu', t.aperta && t.fase === 'scegli' && t.contesto === 'menu' && t.rosa.length === 15, t);
    await p.keyboard.press('Enter'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('Enter');
    await p.waitForTimeout(150);
    await scatta('terna-scelta', 200);
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('Enter');
    await p.waitForTimeout(120);
    t = await terna();
    ok('Terna (tastiera): frecce e Invio segnano tre numeri, il cursore va sul bottone, ancora niente pagato',
      t.scelti.length === 3 && t.scelti[0] === t.rosa[0] && t.scelti[1] === t.rosa[1] && t.scelti[2] === t.rosa[5] && t.cursore === 15 && t.monete === 10, t);
    // col riquadro aperto Ferruccio non si muove e non spara (tasti veri tenuti premuti)
    const prima = await p.evaluate(() => { const I = window.__teatro.interni; return { x: I.player.x, y: I.player.y, n: I.statoRun.proiettili.length, cursore: I.statoRun.stanzaCorrente.ternaD4.cursore }; });
    await p.keyboard.down('KeyD'); await p.keyboard.down('ArrowRight');
    await p.waitForTimeout(300);
    const fermo = await p.evaluate((prima) => { const I = window.__teatro.interni; return { dx: I.player.x - prima.x, dy: I.player.y - prima.y, colpi: I.statoRun.proiettili.length - prima.n, tasti: [keys.KeyD, keys.ArrowRight] }; }, prima);
    await p.keyboard.up('KeyD'); await p.keyboard.up('ArrowRight');
    await p.keyboard.press('ArrowDown'); // dal bottone non si scende: il cursore resta sul bottone
    ok('Terna: col riquadro aperto Ferruccio resta fermo e non spara', fermo.dx === 0 && fermo.dy === 0 && fermo.colpi === 0, fermo);
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    t = await terna();
    const pausa = await p.evaluate(() => window.__teatro.interni.statoRun.pausa);
    ok('Terna: Esc lascia il cartellone senza pagare e senza aprire la pausa', !t.aperta && t.monete === 10 && !t.giocata && !pausa, { t, pausa });

    // TERNO con la tastiera: i primi tre della rosa, estrazione forzata sui primi cinque
    await vicino();
    await p.keyboard.press('KeyE'); await p.waitForTimeout(120);
    await p.keyboard.press('Enter'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('Enter'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('Enter');
    await p.waitForTimeout(100);
    await p.keyboard.press('Enter'); // il bottone: paga e si tira
    await p.waitForTimeout(100);
    t = await terna();
    ok('Terna: giocarla costa 3 monete e fa partire l\'estrazione di cinque numeri', t.monete === 7 && t.fase === 'estrazione' && t.estratti.length === 5 && t.giocata, t);
    await p.waitForTimeout(2300); // i primi numeri escono a tempo, uno alla volta
    t = await terna();
    ok('Terna: i numeri escono uno alla volta (dopo ~2,3 s non sono ancora tutti fuori)', t.mostrati >= 1 && t.mostrati < 5 && /estratto|Terzo/.test((await p.evaluate(() => window.__teatro.interni.statoRun.stanzaCorrente.ternaD4.voce))), t.mostrati);
    await scatta('terna-estrazione', 100);
    for (let k = 0; k < 12 && (await terna()).fase === 'estrazione'; k++) { await p.keyboard.press('Enter'); await p.waitForTimeout(160); }
    await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    t = await terna();
    ok('Terna: TERNO → oggetto Forte sul piedistallo e 9 monete', t.presi === 3 && t.pagata && t.piedistallo && t.piedistallo.tier === 'forte' && t.monete + t.aTerra === 16 && /TERNO SECCO/.test(t.banner), t);
    await scatta('terna-terno', 250);
    await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    t = await terna();
    ok('Terna: a esito pagato la conferma chiude il riquadro', !t.aperta, t);
    await vicino();
    await p.keyboard.press('KeyE'); await p.waitForTimeout(120);
    t = await terna();
    ok('Terna: una sola per visita', !t.aperta && t.monete + t.aTerra === 16 && /Na terna pe' sera/.test(t.banner), t);
    const rientro = await p.evaluate(() => { // uscire e rientrare non la ridà
      const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
      const [lato, idG] = Object.entries(st.porte)[0]; const g = I.statoRun.mappa.perId.get(idG);
      entraInStanza(g, { N: 'S', S: 'N', E: 'W', W: 'E' }[lato]); g.pulita = true; g.nemici = [];
      entraInStanza(st, lato);
      return { dentro: I.statoRun.stanzaCorrente === st, giocata: st.ternaD4.giocata, aperta: st.ternaD4.aperta };
    });
    ok('Terna: rientrando nella Bisca resta giocata', rientro.dentro && rientro.giocata && !rientro.aperta, rientro);

    // gli altri esiti, con l'estrazione forzata (escono rosa[0..4]): ambo, uno, nessuno; e il terno col piedistallo occupato
    const esito = (indici, occupa) => p.evaluate(({ indici, occupa }) => {
      const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente; const D = I.stanzeTeatroD4.terna;
      st.ternaD4 = null; st.oggettiATerra = [];
      st.oggettoPiedistallo = occupa ? { id: 'qa', nome: 'qa', sprite: 'dado', x: 320, y: 236, preso: false } : null;
      I.statoRun.monete = 10;
      D.apri(st);
      const T = st.ternaD4;
      for (const i of indici) D.segna(st, T.rosa[i]);
      const estratti = D.gioca(st, () => 0);
      let tick = 0;
      for (; tick < 3000 && T.aperta; tick++) D.passo(st);
      return { presi: T.presi, monete: I.statoRun.monete, aTerra: st.oggettiATerra.filter((o) => o.tipo === 'moneta').length, premio: T.premio,
        estratti, primi: T.rosa.slice(0, 5), tick, banner: I.statoRun.banner, forte: Boolean(st.oggettoPiedistallo && st.oggettoPiedistallo.tier === 'forte') };
    }, { indici, occupa: Boolean(occupa) });
    const ambo = await esito([0, 1, 14]), uno = await esito([0, 13, 14]), zero = await esito([12, 13, 14]), ripiego = await esito([2, 3, 4], true);
    ok('Terna: l\'rng di prova fa uscire i numeri voluti', JSON.stringify(ambo.estratti) === JSON.stringify(ambo.primi), ambo);
    ok('Terna: AMBO → 7 monete', ambo.presi === 2 && ambo.aTerra === 7 && ambo.monete === 7 && !ambo.forte && /AMBO/.test(ambo.banner), ambo);
    ok('Terna: UN NUMERO → 2 monete', uno.presi === 1 && uno.aTerra === 2 && uno.monete === 7 && /Un numero preso/.test(uno.banner), uno);
    ok('Terna: NESSUNO → niente', zero.presi === 0 && zero.aTerra === 0 && zero.monete === 7 && /non esce/.test(zero.banner), zero);
    ok('Terna: terno col piedistallo occupato → le monete di ripiego al posto dell\'oggetto', ripiego.presi === 3 && ripiego.aTerra === 16 && !ripiego.forte, ripiego);
    ok('Terna: l\'estrazione intera dura fra 7 e 12 secondi', ambo.tick > 420 && ambo.tick < 720, ambo.tick);
    // frequenze con l'rng del seme: 4000 terne, entro 2,5 punti dalle probabilità in tabella
    const freq = await p.evaluate(() => {
      const I = window.__teatro.interni; const D = I.stanzeTeatroD4.terna; const K = I.STANZE_TEATRO_D4.terna;
      const n = [0, 0, 0, 0]; const N = 4000;
      for (let k = 0; k < N; k++) { const rosa = D.rosa(); const miei = rosa.slice(0, 3); const e = D.estrai(rosa, K.estratti); n[miei.filter((x) => e.includes(x)).length]++; }
      return n.map((x) => x / N);
    });
    ok('Terna: le frequenze vere seguono la tabella', [0.2637, 0.4945, 0.2198, 0.022].every((q, i) => Math.abs(freq[i] - q) < 0.025), freq);

    // gamepad: RB apre, croce + A segnano, B lascia; poi A sul bottone gioca
    await nuova(10); await vicino();
    await padAcceso(true); await p.waitForTimeout(200);
    await premiPad(5); // RB = interagisci
    t = await terna();
    ok('Terna (gamepad): RB apre il cartellone', t.aperta && t.fase === 'scegli', t);
    await premiPad(0); await premiPad(15); await premiPad(0);
    t = await terna();
    ok('Terna (gamepad): croce e A segnano i numeri', t.scelti.length === 2 && t.scelti[1] === t.rosa[1], t);
    await scatta('terna-gamepad', 150);
    await premiPad(1); // B = indietro
    t = await terna();
    ok('Terna (gamepad): B lascia senza pagare', !t.aperta && t.monete === 10, t);
    await premiPad(5);
    await premiPad(0); await premiPad(13); await premiPad(0); await premiPad(13); await premiPad(0); // tre numeri in colonna
    t = await terna();
    const colonna = t.scelti.length === 3 && t.scelti[1] === t.rosa[5] && t.scelti[2] === t.rosa[10] && t.cursore === 15;
    await premiPad(0); // A sul bottone
    t = await terna();
    ok('Terna (gamepad): tre numeri in colonna e A sul bottone gioca (−3 monete)', colonna && t.monete === 7 && (t.fase === 'estrazione' || t.fase === 'esito'), t);
    for (let k = 0; k < 14 && (await terna()).aperta; k++) { await premiPad(0); await p.waitForTimeout(120); }
    t = await terna();
    ok('Terna (gamepad): A manda avanti l\'estrazione e chiude all\'esito (un numero preso: rosa[0])', !t.aperta && t.pagata && t.presi === 1, t);
    await padAcceso(false); await p.waitForTimeout(150);

    // mouse / tocco: un click sulla cella segna, sul bottone gioca
    await nuova(10); await vicino();
    await p.keyboard.press('KeyE'); await p.waitForTimeout(150);
    const rc = await rettCanvas();
    const clicca = async (r) => { const k = rc.w / 640; await p.mouse.click(rc.x + (r.x + r.w / 2) * k, rc.y + (r.y + r.h / 2) * k); await p.waitForTimeout(90); };
    const rett = await p.evaluate(() => { const D = window.__teatro.interni.stanzeTeatroD4.terna; return { celle: [12, 13, 14].map((i) => D.rettCella(i)), bottone: D.rettBottone() }; });
    for (const r of rett.celle) await clicca(r);
    t = await terna();
    const segnati = t.scelti.length === 3 && t.scelti[0] === t.rosa[12];
    await clicca(rett.bottone);
    t = await terna();
    ok('Terna (click/tocco): tre click segnano, il click sul bottone gioca', segnati && t.monete === 7 && t.fase === 'estrazione', t);
    await p.evaluate(() => { const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente; for (let k = 0; k < 3000 && st.ternaD4.aperta; k++) I.stanzeTeatroD4.terna.passo(st); I.stanzeTeatroD4.prova.rngTerna = null; });
    t = await terna();
    ok('Terna (click): nessun numero preso con gli ultimi tre della rosa', t.presi === 0 && !t.aperta, t);
    await p.evaluate(() => { const I = window.__teatro.interni; I.player.x = 430; I.player.y = 250; I.statoRun.stanzaCorrente.ternaD4 = null; I.statoRun.banner = ''; I.statoRun.bannerTimer = 0; });
    await scatta('terna-bisca', 300);
  }


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
