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
    return { ondate, inizio: g0.stato, fine: g1.stato, maxOndata, pulita: st.pulita, chiusa, sale, favore: g1.favoreDato, persi: g1.persi, nuovi: (st.oggettiATerra || []).length - oggetti0 };
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
      if (i === 5) { R.graziaIngressoC = 0; P.invuln = 0; subisciColpoGiocatore(1, 'prova', 300, 190); }
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
