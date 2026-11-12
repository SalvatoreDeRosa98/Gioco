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

  // ---- B. NEMICI E GIURAMENTI ----
  /** Run nuova direttamente al piano 3 dell'Anfiteatro (dall'Acquedotto). */
  const alAnfiteatro = (piano = 3) => p.evaluate((piano) => {
    const I = window.__teatro.interni; const R = I.statoRun;
    selezionaPersonaggio('ferruccio'); R.fase = 'in_gioco'; nuovaRun(false); R.siparioAttivo = null;
    I.anfiteatroH7.segna(piano, true); avviaPiano(piano, false); R.siparioAttivo = null; R.cartiglioD = null;
    return { zona: R.zonaP3, q: getQuartierePiano(piano).id };
  }, piano);
  const gen = await p.evaluate(async () => {
    const I = window.__teatro.interni; const R = I.statoRun;
    const tipi = {}; let giur = 0, piani = 0, senza = 0;
    for (let k = 0; k < 30; k++) {
      selezionaPersonaggio('ferruccio'); R.fase = 'in_gioco'; nuovaRun(false);
      I.anfiteatroH7.segna(3, true); avviaPiano(3, false); R.siparioAttivo = null; piani++;
      const g = R.mappa.stanze.filter((s) => s.giuramentoH7).length; giur += g; if (!g) senza++;
      for (const s of R.mappa.stanze) for (const n of s.nemici) if (!n.boss) { tipi[n.tipo] = (tipi[n.tipo] || 0) + 1; if (n.tipo === 'burattino') tipi['in-' + s.tipo + (n.evocatoD || n.evocato ? '-evocato' : '')] = 1; }
    }
    return { tipi, giur, piani, senza };
  });
  const tipiLuogo = ['mirmillone_latta', 'reziario_ombra', 'belva_cartapesta', 'suonatore_corno'];
  ok('B: nessun nemico di San Leucio sostituibile resta', !['burattino', 'maschera', 'guardia', 'vespa_cieca'].some((t) => gen.tipi[t]), gen.tipi);
  ok('B: i tipi del luogo compaiono', tipiLuogo.filter((t) => t !== 'suonatore_corno').every((t) => gen.tipi[t] > 0), gen.tipi);
  ok('B: almeno un giuramento per piano', gen.senza === 0 && gen.giur >= gen.piani, gen);

  // ogni tipo visita i suoi stati (passi contati, giocatore fermo e invulnerabile)
  const statiAttesi = { mirmillone_latta: ['avanza', 'alza', 'affondo', 'scoperto'], reziario_ombra: ['gira', 'rotea', 'recupera'],
    belva_cartapesta: ['aggira', 'acquatta', 'carica'], suonatore_corno: ['tiene', 'gonfia', 'suona'] };
  for (const tipo of tipiLuogo) {
    await alAnfiteatro();
    const visti = await p.evaluate((tipo) => {
      const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
      const st = R.mappa.stanze.find((s) => s.tipo === 'normale' && !s.giuramentoH7) || R.mappa.stanze.find((s) => s.tipo === 'normale');
      st.giuramentoH7 = null;
      entraInStanza(st, 'S'); R.siparioAttivo = null;
      for (const n of st.nemici) n.hp = 0;
      I.giuramentiH7.crea(tipo, 200, 180);
      st.pulita = false;
      P.x = 400; P.y = 200;
      const visti = new Set();
      for (let i = 0; i < 900; i++) {
        P.invuln = 999; R.hpHalf = Math.max(R.hpHalf, 4); P.x = 400; P.y = 200;
        try { passoLogico(); } catch (_) { /* */ }
        const n = st.nemici.find((x) => x.tipo === tipo && x.hp > 0);
        if (n && n.statoH7) visti.add(n.statoH7);
      }
      return { visti: [...visti], vivi: st.nemici.filter((x) => x.hp > 0).length, reti: I.giuramentiH7.reti };
    }, tipo);
    ok(`B: ${tipo} visita i suoi stati`, statiAttesi[tipo].every((s) => visti.visti.includes(s)), visti);
  }
  // foto: tutti e quattro in posa, e uno che sale dal montacarichi
  await alAnfiteatro();
  await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    const st = R.mappa.stanze.find((s) => s.tipo === 'normale');
    st.giuramentoH7 = null; entraInStanza(st, 'S'); R.siparioAttivo = null;
    for (const n of st.nemici) n.hp = 0;
    const pose = [['mirmillone_latta', 200, 170, 'alza'], ['reziario_ombra', 280, 150, 'rotea'], ['belva_cartapesta', 380, 170, 'acquatta'], ['suonatore_corno', 450, 230, 'suona']];
    for (const [t, x, y, s] of pose) { I.giuramentiH7.crea(t, x, y); const n = st.nemici[st.nemici.length - 1]; n.statoH7 = s; n.tH7 = 20; n.angH7 = Math.PI; }
    const sale = st.nemici[st.nemici.length - 1]; void sale;
    I.giuramentiH7.crea('mirmillone_latta', 0, 0, true); const m = st.nemici[st.nemici.length - 1]; m.saleH7 = 20;
    P.x = 320; P.y = 260; P.invuln = 0;
  });
  await disegna(); await scatta('b-nemici');

  // lo scudo del Mirmillone: di fronte para, alle spalle no, scoperto no
  const scudo = await p.evaluate(() => {
    const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
    const n = st.nemici.find((x) => x.tipo === 'mirmillone_latta' && x.hp > 0 && !x.saleH7);
    const hp0 = n.hp; n.statoH7 = 'avanza'; n.angH7 = 0;
    danneggiaNemico(n, 3, -2, 0); const fronte = n.hp; // colpo che arriva da destra (davanti)
    danneggiaNemico(n, 3, 2, 0); const spalle = n.hp;   // da sinistra (alle spalle)
    n.statoH7 = 'scoperto'; danneggiaNemico(n, 3, -2, 0); const scoperto = n.hp;
    return { hp0, fronte, spalle, scoperto };
  });
  ok('B: lo scudo para di fronte', scudo.fronte === scudo.hp0, scudo);
  ok('B: alle spalle e scoperto si ferisce', scudo.spalle < scudo.fronte && scudo.scoperto < scudo.spalle, scudo);
  // la rete rallenta
  const rete = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player; const st = R.stanzaCorrente;
    for (const n of st.nemici) n.hp = 0; st.pulita = false;
    I.giuramentiH7.crea('reziario_ombra', 120, 100); const n = st.nemici[st.nemici.length - 1]; n.stunTicks = 9999;
    P.x = 320; P.y = 200; P.invuln = 0;
    ticksCongelati = 0; R.graziaIngressoC = 0;
    st.retiH7 = [{ x: 314, y: 192, vx: 2, vy: 0, vita: 50, t: 0 }];
    passoLogico();
    return { irretito: I.giuramentiH7.irretito };
  });
  ok('B: la rete prende Ferruccio', rete.irretito > 0, rete);
  await disegna(); await scatta('b-rete');

  // un giuramento intero senza perdere Maschere: ondate, grate, favore
  await alAnfiteatro();
  const giur = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    const st = R.mappa.stanze.find((s) => s.giuramentoH7);
    const ondate = st.giuramentoH7.ondate;
    entraInStanza(st, 'S'); R.siparioAttivo = null;
    const g0 = I.giuramentiH7.qui;
    const oggetti0 = (st.oggettiATerra || []).length;
    let maxOndata = 0, chiusa = 0, sale = 0;
    for (let i = 0; i < 3000 && I.giuramentiH7.qui.stato !== 'fatto'; i++) {
      P.invuln = 999; P.x = 320; P.y = 190;
      try { passoLogico(); } catch (_) { /* */ }
      if (!st.pulita) chiusa++;
      if (st.nemici.some((n) => n.saleH7 > 0)) sale++;
      for (const n of st.nemici) if (n.hp > 0 && !(n.saleH7 > 0) && i % 30 === 29) n.hp = 0; // li abbatte, senza fretta
      maxOndata = Math.max(maxOndata, I.giuramentiH7.qui.ondata);
    }
    for (let i = 0; i < 10; i++) { P.invuln = 999; passoLogico(); }
    const g1 = I.giuramentiH7.qui;
    const resto = st.nemici.filter((n) => n.hp > 0).map((n) => [n.tipo, n.hp, n.saleH7]);
    return { resto, ondate, inizio: g0.stato, fine: g1.stato, maxOndata, pulita: st.pulita, chiusa, sale, favore: g1.favoreDato, persi: g1.persi, nuovi: (st.oggettiATerra || []).length - oggetti0 };
  });
  ok('B: il giuramento parte all\'ingresso', giur.inizio === 'in_corso', giur);
  ok('B: salgono tutte le ondate dai montacarichi', giur.maxOndata === giur.ondate && giur.sale > 0, giur);
  ok('B: le uscite restano chiuse finché dura', giur.chiusa > 100 && giur.fine === 'fatto' && giur.pulita, giur);
  ok('B: senza Maschere perse, il favore delle gradinate', giur.favore && giur.persi === 0 && giur.nuovi >= 2, giur);
  // con un colpo preso: niente favore
  await alAnfiteatro();
  const giur2 = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    const st = R.mappa.stanze.find((s) => s.giuramentoH7);
    entraInStanza(st, 'S'); R.siparioAttivo = null;
    for (let i = 0; i < 3000 && I.giuramentiH7.qui.stato !== 'fatto'; i++) {
      P.x = 320; P.y = 190;
      if (!st.colpitoQA && I.giuramentiH7.qui.stato === 'in_corso' && i >= 5) { st.colpitoQA = true; R.hpHalf -= 1; } // una mezza Maschera persa
      if (i > 5) P.invuln = 999;
      try { passoLogico(); } catch (_) { /* */ }
      if (i === 60) { /* foto a metà */ }
      for (const n of st.nemici) if (n.hp > 0 && !(n.saleH7 > 0) && i % 30 === 29) n.hp = 0;
    }
    const g = I.giuramentiH7.qui;
    return { fine: g.stato, favore: g.favoreDato, persi: g.persi, pulita0: st.pulitaQA, vivi: st.nemici.length };
  });
  ok('B: una Maschera persa, niente favore', giur2.fine === 'fatto' && !giur2.favore && giur2.persi > 0, giur2);
  // foto: grate giù e montacarichi che salgono
  await alAnfiteatro();
  await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    const st = R.mappa.stanze.find((s) => s.giuramentoH7);
    entraInStanza(st, 'S'); R.siparioAttivo = null; P.x = 320; P.y = 200;
    for (let i = 0; i < 40; i++) { P.invuln = 999; passoLogico(); }
  });
  await disegna(); await scatta('b-giuramento');

  // ---- C. IL GIUDICE DELL'ARENA ----
  await alAnfiteatro();
  await p.evaluate(() => { try { window.__teatro.t4qa.impostaFlag({ h7_rivelazione: null }); } catch (_) { /* */ } });
  const giud = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    const st = R.mappa.stanze.find((s) => s.tipo === 'boss');
    entraInStanza(st, 'S'); R.siparioAttivo = null;
    const s0 = I.giudiceH7.stato;
    const visti = new Set(), gesti = new Set(); let maxComb = 0, maxProi = 0, inAria = 0, foto = {};
    const b = st.nemici.find((n) => n.boss);
    for (let i = 0; i < 5000; i++) {
      P.invuln = 999; R.hpHalf = Math.max(R.hpHalf, 4); P.x = 320; P.y = 250;
      try { passoLogico(); } catch (_) { /* */ }
      const g = I.giudiceH7.stato; if (!g) break;
      visti.add(g.stato + (g.fase2 ? '@2' : '')); if (g.gesto) gesti.add(g.gesto);
      maxComb = Math.max(maxComb, g.combattenti); maxProi = Math.max(maxProi, g.proiettili); if (g.airZ > 16) inAria++;
      for (const n of st.nemici) if (!n.boss && n.hp > 0 && !(n.saleH7 > 0) && i % 40 === 39) n.hp = 0;
      if (i === 2500 && !b.fase2H7) b.hp = Math.floor(b.maxHp * 0.45);
    }
    return { s0, visti: [...visti], gesti: [...gesti], maxComb, maxProi, inAria, nome: b.nome, segno: (I.SEGNI_A6 || window.SEGNI_A6 || []).length };
  });
  ok('C: il boss del piano 3 all\'Anfiteatro è il Giudice', giud.s0 && /Giudice/.test(giud.nome), giud.s0);
  const statiG = ['sentenzia', 'pollice', 'scende', 'mira', 'fendente', 'affanno', 'risale', 'chiama', 'indica', 'sentenza', 'cambiaFase@2'];
  ok('C: il Giudice visita tutti i suoi stati', statiG.every((x) => giud.visti.includes(x) || giud.visti.includes(x + '@2')), giud.visti);
  ok('C: due gesti del pollice (su e verso)', giud.gesti.includes('su') && giud.gesti.includes('verso'), giud.gesti);
  ok('C: pollice verso chiama i combattenti', giud.maxComb >= 2, giud.maxComb);
  ok('C: in aria quando scende e risale', giud.inAria > 0, giud.inAria);
  ok('C: tetto dei colpi rispettato', giud.maxProi <= 28 + 12, giud.maxProi); // anche le note dei suonatori chiamati
  // foto: il pollice (verso) sul podio, e il Giudice in arena che mira
  const posa = (stato, gesto, timer) => p.evaluate(({ stato, gesto, timer }) => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    const st = R.stanzaCorrente; const b = st.nemici.find((n) => n.boss);
    for (const n of st.nemici) if (!n.boss) n.hp = 0;
    R.proiettiliNemici.length = 0;
    b.statoH7 = stato; b.gestoH7 = gesto; b.timerH7 = timer; b.tStatoH7 = 30; b.airZ = 0;
    if (stato === 'mira') { b.x = 300; b.y = 190; b.angH7 = Math.PI * 0.4; } else { b.x = I.BOSS_H7.podio.x; b.y = I.BOSS_H7.podio.y; }
    P.x = 360; P.y = 260;
  }, { stato, gesto, timer });
  await posa('pollice', 'verso', 10); await disegna(); await scatta('c-pollice-verso');
  await posa('pollice', 'su', 10); await disegna(); await scatta('c-pollice-su');
  await posa('mira', null, 20); await disegna(); await scatta('c-mira');
  // la caduta: anime e rivelazione (la prima volta sola)
  const cade = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const st = R.stanzaCorrente; const b = st.nemici.find((n) => n.boss);
    b.hp = 0; verificaStanzaPulita(); for (let i = 0; i < 6; i++) passoLogico();
    return { pulita: st.pulita, riv: st.rivelazioneH7 || null, flag: window.__teatro.t4qa.flag.h7_rivelazione, uscita: st.uscitaAperta };
  });
  ok('C: il Giudice cade, la stanza si apre', cade.pulita && cade.uscita, cade);
  ok('C: la rivelazione su Donna Luciana, mai Violante', cade.riv && /Donna Luciana/.test(cade.riv) && /tramandata/.test(cade.riv) && !/Violante/.test(cade.riv), cade.riv);
  ok('C: la rivelazione resta nello slot', Boolean(cade.flag), cade.flag);
  await passi(p, 20); await disegna(); await scatta('c-caduta');
  await alAnfiteatro();
  const di2 = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const st = R.mappa.stanze.find((s) => s.tipo === 'boss');
    entraInStanza(st, 'S'); R.siparioAttivo = null; const b = st.nemici.find((n) => n.boss); b.hp = 0; verificaStanzaPulita();
    for (let i = 0; i < 6; i++) passoLogico();
    return { pulita: st.pulita, riv: st.rivelazioneH7 || null };
  });
  ok('C: alla seconda caduta niente rivelazione', di2.pulita && !di2.riv, di2);

  // ---- D. AGNESE, PREMIO, MUSICA, MESSAGGIO DEL PADRE ----
  const flag = (parz) => p.evaluate((x) => window.__teatro.t4qa.impostaFlag(x), parz);
  const nelGiudice = () => p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    const st = R.mappa.stanze.find((s) => s.tipo === 'boss'); entraInStanza(st, 'S'); R.siparioAttivo = null;
    for (let i = 0; i < 200; i++) { P.invuln = 999; passoLogico(); } // passa la grazia d'ingresso
    return true;
  });
  const colpo = () => p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    R.graziaIngressoC = 0; R.scudoRosaC = false; R.scudoStanzaD = 0; P.invuln = 0; R.hpHalf = 6;
    const h0 = R.hpHalf; subisciColpoGiocatore(2, 'prova', P.x + 20, P.y); return { perso: h0 - R.hpHalf, filo: I.ricordiH7.filo, posa: I.ricordiH7.agnese };
  });
  await flag({ agnese: 'risvegliata' });
  await alAnfiteatro(); await nelGiudice();
  const c1 = await colpo(); const c2 = await colpo();
  ok('D: Agnese risvegliata sulle gradinate para un colpo col filo rosso', c1.posa === 'risvegliata' && c1.perso === 0 && c1.filo, c1);
  ok('D: una volta sola', c2.perso > 0, c2);
  await p.evaluate(() => { const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente; st.agneseH7.t0 = tick - 12; I.statoRun.proiettiliNemici.length = 0; I.player.x = 380; I.player.y = 200; });
  await disegna(); await scatta('d-agnese-filo');
  await flag({ agnese: 'sognante' }); await alAnfiteatro(); await nelGiudice();
  const c3 = await colpo();
  ok('D: Agnese sognante dorme e non interviene', c3.posa === 'sognante' && c3.perso > 0 && !c3.filo, c3);
  await flag({ agnese: null }); await alAnfiteatro(); await nelGiudice();
  const c4 = await colpo();
  ok('D: senza flag un posto vuoto con la sciarpa, nessun filo', c4.posa === 'vuoto' && c4.perso > 0, c4);
  const comeAgnese = await p.evaluate(() => { const I = window.__teatro.interni; const R = I.statoRun; selezionaPersonaggio('agnese'); const x = I.ricordiH7.agnese; selezionaPersonaggio('ferruccio'); return x; });
  ok('D: giocando con Agnese la scena non c\'è', comeAgnese === null, comeAgnese);
  // la musica del luogo
  const tema = await p.evaluate(() => { const I = window.__teatro.interni; const a = I.ricordiH7.tema; const R = I.statoRun; nuovaRun(false); avviaPiano(3, false); R.siparioAttivo = null; return { anf: a, leucio: I.ricordiH7.tema }; });
  ok('D: il tema dell\'Anfiteatro al piano 3 solo lì', tema.anf === 'anfiteatro' && tema.leucio !== 'anfiteatro', tema);
  // la tessera: cade a ogni vittoria; didascalia e riga del Diario una volta per slot
  await flag({ h7_tessera: null, agnese: null });
  await alAnfiteatro();
  const tes = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    const st = R.mappa.stanze.find((s) => s.tipo === 'boss'); entraInStanza(st, 'S'); R.siparioAttivo = null;
    const b = st.nemici.find((n) => n.boss); b.hp = 0; verificaStanzaPulita(); passoLogico();
    const t = I.ricordiH7.tessera; const ago = (st.oggettiATerra || []).some((o) => /ago/.test(o.id || ''));
    return { t, ago };
  });
  ok('D: il Giudice lascia la tessera (e non l\'ago)', tes.t && !tes.t.preso && !tes.ago, tes);
  await disegna(); await scatta('d-tessera');
  const presa = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player; const t = I.ricordiH7.tessera;
    const prima = { dmg: R.dmg, max: R.maxHpHalf, hp: R.hpHalf, n: R.oggettiEquipaggiati.length };
    P.x = t.x; P.y = t.y; passoLogico(); passoLogico();
    const ogg = R.oggettiEquipaggiati.find((o) => o.id === 'tessera-gladiatore-h7') || null;
    return { preso: I.ricordiH7.tessera.preso, flag: window.__teatro.t4qa.flag.h7_tessera, prima,
      dopo: { dmg: R.dmg, max: R.maxHpHalf, hp: R.hpHalf, n: R.oggettiEquipaggiati.length }, ogg: ogg && { nome: ogg.nome, mod: ogg.mod } };
  });
  ok('D: la tessera si raccoglie e resta nello slot', presa.preso && presa.flag, presa);
  // l'effetto dura tutta la notte: è un oggetto di Ferruccio (danno ×1,2, una Maschera in più già piena)
  ok('D: la tessera è un oggetto della notte: più danno e una Maschera in più', Boolean(presa.ogg) && presa.dopo.n === presa.prima.n + 1
    && presa.dopo.dmg > presa.prima.dmg * 1.15 && presa.dopo.max === presa.prima.max + 2 && presa.dopo.hp === presa.prima.hp + 2, presa);
  const restaAlPiano4 = await p.evaluate(() => { const R = window.__teatro.interni.statoRun; const d = R.dmg; avviaPiano(4, false); R.siparioAttivo = null; ricalcolaStatistiche();
    return { dmg: R.dmg, prima: d, ha: R.oggettiEquipaggiati.some((o) => o.id === 'tessera-gladiatore-h7') }; });
  ok('D: la tessera resta anche al piano dopo', restaAlPiano4.ha && Math.abs(restaAlPiano4.dmg - restaAlPiano4.prima) < 0.01, restaAlPiano4);
  const diario = await p.evaluate((n) => { try { const pg = componiPaginaB8({ notte: n, esito: 'caduta', piano: 3, zonaP3H7: 'anfiteatro' }, {}, statoB8(), {}); return pg && pg.righe; } catch (e) { return String(e); } }, presa.flag);
  ok('D: riga nel Diario per la tessera', Array.isArray(diario) && diario.some((r) => /tessera/.test(r)), diario);
  await alAnfiteatro();
  const tes2 = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    const st = R.mappa.stanze.find((s) => s.tipo === 'boss'); entraInStanza(st, 'S'); R.siparioAttivo = null;
    const b = st.nemici.find((n) => n.boss); b.hp = 0; verificaStanzaPulita(); passoLogico();
    return I.ricordiH7.tessera;
  });
  ok('D: il Giudice lascia la tessera a ogni vittoria (in una notte nuova)', Boolean(tes2) && !tes2.preso, tes2);
  // il messaggio del padre all'Acquedotto
  await flag({ messaggio_padre: null });
  const nic = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    selezionaPersonaggio('ferruccio'); R.fase = 'in_gioco'; nuovaRun(false); I.acquedottoD6.segna(2, true); avviaPiano(2, false); R.siparioAttivo = null;
    const st = R.mappa.stanze.find((s) => s.nicchiaH7);
    const boss = R.mappa.stanze.find((s) => s.tipo === 'boss');
    if (!st) return { st: false };
    entraInStanza(st, 'S'); R.siparioAttivo = null;
    const prima = I.ricordiH7.nicchia.visibile;
    for (let i = 0; i < 900 && !st.pulita; i++) { P.invuln = 999; for (const n of st.nemici) if (n.hp > 0) { n.hp = 0; verificaStanzaPulita(); } passoLogico(); }
    P.x = I.ricordiH7.nicchia.x + 34; P.y = I.ricordiH7.nicchia.y + 20;
    return { st: true, tipo: st.tipo, nelBoss: Boolean(boss.nicchiaH7), prima, dopo: I.ricordiH7.nicchia.visibile, quante: R.mappa.stanze.filter((s) => s.nicchiaH7).length };
  });
  ok('D: una nicchia per notte in una stanza normale dell\'Acquedotto, visibile a stanza ripulita', nic.st && nic.tipo === 'normale' && !nic.nelBoss && nic.quante === 1 && !nic.prima && nic.dopo, nic);
  await disegna(); await scatta('d-nicchia');
  const letto = await p.evaluate(() => { interagisciStanza(); return { flag: window.__teatro.t4qa.flag.messaggio_padre, piano: window.__teatro.interni.statoRun.piano }; });
  ok('D: [E] Leggi: il messaggio del padre resta nello slot', letto.flag && letto.piano === 2, letto);
  const vuota = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    nuovaRun(false); I.acquedottoD6.segna(2, true); avviaPiano(2, false); R.siparioAttivo = null;
    return R.mappa.stanze.filter((s) => s.nicchiaH7).length;
  });
  ok('D: dopo la prima volta non si rigenera', vuota === 0, vuota);
  const diario2 = await p.evaluate((n) => { try { return componiPaginaB8({ notte: n, esito: 'caduta', piano: 2 }, {}, statoB8(), {}).righe; } catch (e) { return String(e); } }, letto.flag);
  ok('D: il messaggio del padre nel Diario', Array.isArray(diario2) && diario2.some((r) => /mio padre/.test(r)), diario2);

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
