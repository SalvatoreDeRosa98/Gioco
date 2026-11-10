#!/usr/bin/env node
/*
 * tools/qa-teatro-ribalta.js — verifica Playwright della squadra b2 (gioco/teatro/b2-ribalta.js):
 * luci della ribalta e ombre lunghe, scenografia che scende appesa ai cavi (collisioni invariate),
 * crollo in pezzi alla morte (nemici, boss, Ferruccio), trucioli/scintille per materiale, grana e
 * vignettatura (OPZIONI), riflessi bagnati al piano 1, suoni, costo per frame.
 * Uso: node tools/qa-teatro-ribalta.js <file html> [cartella/prefisso screenshot]
 * Esce con 1 se un controllo fallisce. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const pref = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-ribalta-');
const foto = (n) => (pref.endsWith('/') ? path.join(pref, `ribalta-${n}.png`) : `${pref}${n}.png`);
if (pref.endsWith('/')) fs.mkdirSync(pref, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (nome, cond, info) => esiti.push({ nome, ok: Boolean(cond), info });
  const stato = () => p.evaluate(() => window.__teatro.interni.ribaltaB2.stato());

  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(700);
  await p.evaluate(() => {
    const I = window.__teatro.interni;
    I.statoRun.fase = 'in_gioco';
    I.nuovaRun(false);
    I.statoRun.siparioAttivo = null;
    // Per la QA: entra in una stanza di combattimento del piano dato, con la scenografia chiesta.
    window.__qaStanza = (piano, ostacoli, vuole) => {
      const R = I.statoRun;
      let st = null;
      for (let giro = 0; giro < 12 && !st; giro++) {
        I.avviaPiano(piano, false); R.siparioAttivo = null;
        st = R.mappa.stanze.find((s) => s.tipo === 'normale' && !s.pulita && (!vuole || s.nemici.some((n) => n.tipo === vuole)));
      }
      if (!st) return null;
      if (ostacoli) st.ostacoli = ostacoli.map((o) => ({ tipo: o[0], x: o[1], y: o[2], r: o[0] === 'colonna' ? 14 : o[0] === 'braciere' ? 10 : 16, acceso: o[0] === 'braciere', w: o[0] === 'fossa' ? 34 : 26, h: o[0] === 'fossa' ? 22 : 26 }));
      entraInStanza(st, 'W');
      R.siparioAttivo = null; R.banner = null; R.bannerTimer = 0;
      R.graziaIngressoC = 1e7; // i nemici non attaccano: le foto restano leggibili
      return { tipi: st.nemici.map((n) => n.tipo), ostacoli: st.ostacoli.map((o) => [o.tipo, o.x, o.y]) };
    };
  });
  await p.waitForTimeout(200);

  const presente = await p.evaluate(() => Boolean(window.__teatro.interni.ribaltaB2 && window.__teatro.interni.RIBALTA_B2));
  ok('sonda ribaltaB2 e tabella RIBALTA_B2 esposte', presente);
  if (!presente) { console.log(JSON.stringify(esiti, null, 1)); await browser.close(); process.exit(1); }

  // 1. scenografia a mezza discesa: quote in aria, posizioni logiche e collisioni invariate
  const SCENA = [['colonna', 220, 140], ['colonna', 420, 140], ['braciere', 320, 204], ['fossa', 470, 232]];
  const ing = await p.evaluate((sc) => window.__qaStanza(1, sc, null), SCENA);
  const meta = await p.evaluate(() => {
    const I = window.__teatro.interni; const B = I.ribaltaB2;
    B.fermaDiscesa(27);
    const st = I.statoRun.stanzaCorrente; const o = st.ostacoli[0];
    I.player.x = o.x + 4; I.player.y = o.y + 2; // dentro la colonna che è ancora per aria
    const D = I.RIBALTA_B2.scenografia;
    return { durata: B.durataDiscesa(), perPezzo: D.cadutaTick + D.rimbalzo1Tick + D.rimbalzo2Tick };
  });
  await p.waitForTimeout(250);
  await p.screenshot({ path: foto('discesa') });
  const inAria = await p.evaluate(() => {
    const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente; const o = st.ostacoli[0];
    const s = I.ribaltaB2.stato();
    return { quote: s.quote, attiva: s.discesaAttiva, logiche: st.ostacoli.map((q) => [q.tipo, q.x, q.y, q.w]), dist: Math.hypot(I.player.x - o.x, I.player.y - o.y), rMin: o.r + 9 };
  });
  ok('discesa: i pezzi sono per aria (quota negativa) e sfalsati', inAria.attiva && inAria.quote[0] < -20 && inAria.quote[0] !== inAria.quote[1], inAria.quote);
  ok('discesa: posizioni logiche degli ostacoli invariate', JSON.stringify(inAria.logiche.map((q) => q.slice(0, 3))) === JSON.stringify(ing.ostacoli) && inAria.logiche[3][3] === 34, { ing: ing.ostacoli, ora: inAria.logiche });
  ok('discesa: la collisione c\'è dal primo istante (Ferruccio respinto dalla colonna in aria)', inAria.dist >= inAria.rMin - 0.5, inAria);
  await p.evaluate(() => { const I = window.__teatro.interni; I.ribaltaB2.fermaDiscesa(0); I.ribaltaB2.riprendiDiscesa(); I.player.x = 120; I.player.y = 200; });
  await p.waitForTimeout(Math.ceil(meta.durata * 1000 / 60) + 500);
  const aTerra = await stato();
  ok('discesa: finisce entro la durata dichiarata (≤ 0,6 s a pezzo) e i pezzi sono a terra', !aTerra.discesaAttiva && aTerra.quote.every((q) => q === 0) && meta.perPezzo >= 24 && meta.perPezzo <= 36, { aTerra: aTerra.quote, tickPerPezzo: meta.perPezzo, tickStanza: meta.durata });

  // 2. ombre lunghe e riflessi (piano 1)
  await p.evaluate(() => {
    const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
    I.player.x = 300; I.player.y = 138; // sopra la pozzanghera centrale
    const posti = [[150, 232], [250, 150], [400, 214], [520, 260], [470, 110]];
    st.nemici.forEach((n, i) => { const q = posti[i % posti.length]; n.x = q[0]; n.y = q[1]; n.speed = 0; n.vx = 0; n.vy = 0; });
  });
  await p.waitForTimeout(400);
  await p.screenshot({ path: foto('ombre-riflessi') });
  const om = await p.evaluate(() => {
    const I = window.__teatro.interni; const s = I.ribaltaB2.stato();
    return { sagome: s.sagome, vivi: I.statoRun.stanzaCorrente.nemici.filter((n) => n.hp > 0).length, riflessi: s.conteggi.riflessi, ombre: s.conteggi.ombre };
  });
  ok('ombre: una sagoma per Ferruccio e per ogni nemico vivo', om.sagome === Math.min(14, om.vivi + 1) && om.ombre > 0, om);
  ok('riflessi: al piano 1 le figure si specchiano nelle pozzanghere', om.riflessi > 0, om);

  // 3. colpi: schegge per materiale
  const colpi = await p.evaluate(() => {
    const I = window.__teatro.interni; const B = I.ribaltaB2; const st = I.statoRun.stanzaCorrente;
    const prima = B.stato().conteggi;
    const finto = (tipo, extra) => Object.assign({ tipo, patternMob: tipo, x: 300, y: 200, hp: 50, maxHp: 50, r: 11, flash: 0 }, extra || {});
    const mat = { guardia: B.materialeDi(finto('guardia')), burattino: B.materialeDi(finto('burattino')), mascheraChiusa: B.materialeDi(finto('maschera', { maskOpen: false })), capitano: B.materialeDi(finto('x', { boss: true, bossId: 'capitano-guardia' })), spezzafili: B.materialeDi(finto('x', { boss: true, bossId: 'maestro-fucina' })) };
    const n = st.nemici.find((q) => q.hp > 0 && q.tipo !== 'maschera');
    const hp0 = n.hp;
    n.hp = n.maxHp = 500;
    danneggiaNemico(n, 1, 1, 0);
    const dopo = B.stato().conteggi;
    n.hp = n.maxHp = hp0;
    return { mat, tipo: n.tipo, trucioli: dopo.trucioli - prima.trucioli, polvere: dopo.polvere - prima.polvere, vive: B.stato().particelle };
  });
  ok('materiali: guardia, capitano e spezzafili fanno scintille; il legno trucioli', colpi.mat.guardia === 'metallo' && colpi.mat.capitano === 'metallo' && colpi.mat.spezzafili === 'metallo' && colpi.mat.burattino === 'legno' && colpi.mat.mascheraChiusa === 'corazza', colpi.mat);
  ok('colpo a segno: schegge e polvere', colpi.trucioli > 0 && colpi.polvere > 0 && colpi.vive > 0, colpi);

  // 4. morte di un nemico: fili spezzati, pezzi che cadono e restano
  const morte = await p.evaluate(() => {
    const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
    const n = st.nemici.find((q) => q.hp > 0 && q.tipo !== 'bomba_ferma' && q.tipo !== 'maschera');
    n.x = 330; n.y = 215; I.player.x = 270; I.player.y = 215;
    danneggiaNemico(n, 99999, 1, 0);
    return { tipo: n.tipo, hp: n.hp };
  });
  await p.waitForTimeout(170);
  const inVolo = await stato();
  await p.screenshot({ path: foto('crollo') });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: foto('resti') });
  const resti = await stato();
  ok('morte: i due fili si spezzano e il corpo va in pezzi', inVolo.pezzi >= 4 && inVolo.catture === 1 && (inVolo.fili === 2 || inVolo.pezziFermi < inVolo.pezzi), { morte, inVolo: { pezzi: inVolo.pezzi, fili: inVolo.fili, fermi: inVolo.pezziFermi } });
  ok('morte: i pezzi si fermano e restano a terra', resti.pezzi === inVolo.pezzi && resti.pezziFermi === resti.pezzi && resti.fili === 0, { pezzi: resti.pezzi, fermi: resti.pezziFermi });

  // 5. grana e vignettatura accese e spente (OPZIONI)
  await p.screenshot({ path: foto('pellicola-accesa') });
  const pel = await p.evaluate(async () => {
    const I = window.__teatro.interni; const B = I.ribaltaB2;
    const attendi = (ms) => new Promise((r) => setTimeout(r, ms));
    const a = B.stato().conteggi;
    await attendi(200);
    const b = B.stato().conteggi;
    OPZIONI.grana = false; OPZIONI.vignetta = false;
    await attendi(100);
    const c = B.stato().conteggi;
    await attendi(200);
    const d = B.stato().conteggi;
    return { accesa: [b.grana - a.grana, b.vignetta - a.vignetta], spenta: [d.grana - c.grana, d.vignetta - c.vignetta] };
  });
  await p.screenshot({ path: foto('pellicola-spenta') });
  await p.evaluate(() => { OPZIONI.grana = true; OPZIONI.vignetta = true; });
  ok('OPZIONI.grana / OPZIONI.vignetta: accese si disegnano, spente no', pel.accesa[0] > 0 && pel.accesa[1] > 0 && pel.spenta[0] === 0 && pel.spenta[1] === 0, pel);

  // 6. stanza ripulita: i cavi si tendono, gli ostacoli restano (e con loro le collisioni)
  const pul = await p.evaluate(async () => {
    const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
    const prima = st.ostacoli.length;
    for (const n of st.nemici) if (n.hp > 0) danneggiaNemico(n, 99999, 0, 1);
    await new Promise((r) => setTimeout(r, 1400));
    const s = I.ribaltaB2.stato();
    return { pulita: st.pulita, prima, dopo: st.ostacoli.length, tensione: s.tensione, pezzi: s.pezzi, max: I.RIBALTA_B2.crollo.pezziMax, y: st.ostacoli.map((o) => o.y) };
  });
  await p.screenshot({ path: foto('ripulita') });
  ok('stanza ripulita: cavi tesi, ostacoli tutti al loro posto', pul.pulita && pul.dopo === pul.prima && pul.tensione > 0.9 && JSON.stringify(pul.y) === JSON.stringify(ing.ostacoli.map((o) => o[2])), pul);
  ok('resti: mai più del limite per stanza', pul.pezzi <= pul.max, { pezzi: pul.pezzi, max: pul.max });

  // 7. uscita dalla stanza: i resti spariscono; in una stanza già ripulita niente discesa
  const esce = await p.evaluate(async () => {
    const I = window.__teatro.interni; const R = I.statoRun; const st = R.stanzaCorrente;
    const lato = Object.keys(st.porte)[0]; const altra = R.mappa.perId.get(st.porte[lato]);
    entraInStanza(altra, lato);
    const fuori = I.ribaltaB2.stato();
    entraInStanza(st, lato);
    await new Promise((r) => setTimeout(r, 120));
    const dentro = I.ribaltaB2.stato();
    return { fuori: [fuori.pezzi, fuori.particelle], rientro: [dentro.discesaAttiva, dentro.quote, dentro.pezzi] };
  });
  ok('cambio stanza: resti e particelle azzerati; rientro senza discesa', esce.fuori[0] === 0 && esce.fuori[1] === 0 && esce.rientro[0] === false && esce.rientro[2] === 0, esce);

  // 8. piano 3/4: guardie (scintille), piano senza riflessi
  let guardia = null;
  for (const piano of [3, 4]) {
    guardia = await p.evaluate((pn) => window.__qaStanza(pn, [['colonna', 220, 140], ['colonna', 420, 140]], 'guardia'), piano);
    if (guardia) break;
  }
  if (guardia) {
    await p.waitForTimeout(900);
    const sc = await p.evaluate(() => {
      const I = window.__teatro.interni; const B = I.ribaltaB2; const st = I.statoRun.stanzaCorrente;
      const n = st.nemici.find((q) => q.tipo === 'guardia');
      n.x = 340; n.y = 210; I.player.x = 290; I.player.y = 212;
      const a = B.stato().conteggi;
      n.hp = n.maxHp = 500;
      danneggiaNemico(n, 1, 1, 0);
      const b = B.stato().conteggi;
      return { scintille: b.scintille - a.scintille, riflessi: b.riflessi - a.riflessi, piano: I.statoRun.piano };
    });
    await p.waitForTimeout(90);
    await p.screenshot({ path: foto('scintille') });
    const rf = await p.evaluate(() => window.__teatro.interni.ribaltaB2.stato().conteggi.riflessi);
    await p.waitForTimeout(200);
    const rf2 = await p.evaluate(() => window.__teatro.interni.ribaltaB2.stato().conteggi.riflessi);
    ok('guardia colpita: scintille metalliche', sc.scintille > 0, sc);
    ok('riflessi bagnati solo al piano 1', rf2 === rf, { piano: sc.piano, rf, rf2 });
    await p.evaluate(() => { const st = window.__teatro.interni.statoRun.stanzaCorrente; const n = st.nemici.find((q) => q.tipo === 'guardia'); danneggiaNemico(n, 99999, 1, 0); });
    await p.waitForTimeout(260);
    await p.screenshot({ path: foto('crollo-guardia') });
  } else ok('una stanza con la guardia ai piani 3-4', false, 'non trovata');

  // 9. boss: ombra lunga e crollo in pezzi
  const boss = await p.evaluate(async () => {
    const I = window.__teatro.interni; const R = I.statoRun;
    I.avviaPiano(1, false); R.siparioAttivo = null;
    const st = R.mappa.stanze.find((s) => s.tipo === 'boss');
    entraInStanza(st, 'S');
    R.siparioAttivo = null; R.banner = null; R.bannerTimer = 0; R.graziaIngressoC = 1e7;
    const b = st.nemici[0];
    b.x = 330; b.y = 190; I.player.x = 250; I.player.y = 240;
    await new Promise((r) => setTimeout(r, 300));
    return { id: b.bossId, sagome: I.ribaltaB2.stato().sagome };
  });
  await p.screenshot({ path: foto('boss-ombra') });
  const bossGiu = await p.evaluate(async () => {
    const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente; const b = st.nemici[0];
    b.airZ = 0; b.x = 330; b.y = 190;
    danneggiaNemico(b, 999999, 1, 0);
    await new Promise((r) => setTimeout(r, 330));
    return I.ribaltaB2.stato();
  });
  await p.screenshot({ path: foto('boss-crollo') });
  ok('boss: ha l\'ombra lunga e alla morte crolla in pezzi', boss.sagome >= 2 && bossGiu.pezzi >= 5, { boss, pezzi: bossGiu.pezzi });

  // 10. suoni: dopo un gesto l'audio parte e i suoni nuovi vengono emessi
  await p.mouse.click(640, 600);
  await p.waitForTimeout(150);
  const suoni = await p.evaluate(async () => {
    const I = window.__teatro.interni; const B = I.ribaltaB2;
    const acceso = Boolean(I.AudioSys.ctx && I.AudioSys.ctx.state === 'running');
    const a = B.stato().conteggi;
    for (let k = 0; k < 12; k++) { I.AudioSys.playPasso(); I.AudioSys.playFendente(); await new Promise((r) => setTimeout(r, 110)); }
    const b = B.stato().conteggi;
    I.AudioSys.attivo = false;
    for (let k = 0; k < 6; k++) { I.AudioSys.playFendente(); await new Promise((r) => setTimeout(r, 110)); }
    const c = B.stato().conteggi;
    I.AudioSys.attivo = true;
    return { acceso, scricchiolii: b.scricchiolio - a.scricchiolio, muto: c.scricchiolio - b.scricchiolio, tot: b };
  });
  if (suoni.acceso) {
    ok('scricchiolio a passi e fendenti: c\'è, ma non a ogni colpo', suoni.scricchiolii > 0, suoni);
    ok('scricchiolio: meno di uno per chiamata (variato) e zitto col muto', suoni.scricchiolii < 24 && suoni.muto === 0, suoni);
    ok('schiocco dei fili e legno dei pezzi emessi', suoni.tot.schiocco > 0, suoni.tot);
  } else ok('audio (contesto non avviato in questo browser: controllo saltato)', true, suoni);

  // 11. costo per frame: effetti accesi contro spenti, stanza piena
  const costo = await p.evaluate(async () => {
    const I = window.__teatro.interni; const C = I.RIBALTA_B2;
    window.__qaStanza(1, [['colonna', 220, 140], ['colonna', 420, 140]], null);
    await new Promise((r) => setTimeout(r, 900));
    const st = I.statoRun.stanzaCorrente;
    const modello = st.nemici[0];
    while (st.nemici.length < 12) st.nemici.push(Object.assign({}, modello, { id: 'qa' + st.nemici.length, x: 110 + st.nemici.length * 36, y: 110 + (st.nemici.length % 4) * 45 }));
    const base = disegnaFrame; let tot = 0, n = 0;
    disegnaFrame = function (...a) { const t = performance.now(); const r = base.apply(this, a); tot += performance.now() - t; n++; return r; };
    const misura = async () => { tot = 0; n = 0; await new Promise((r) => setTimeout(r, 1500)); return { ms: Number((tot / Math.max(1, n)).toFixed(3)), fps: Math.round(n / 1.5) }; };
    const accesi = await misura();
    const salvati = Object.assign({}, C.attivi);
    for (const k of Object.keys(C.attivi)) C.attivi[k] = false;
    OPZIONI.grana = false; OPZIONI.vignetta = false;
    const spenti = await misura();
    Object.assign(C.attivi, salvati); OPZIONI.grana = true; OPZIONI.vignetta = true;
    disegnaFrame = base;
    return { accesi, spenti, nemici: st.nemici.length };
  });
  ok('costo: con 12 nemici il frame resta sotto 8 ms di disegno (60 fps = 16,7 ms)', costo.accesi.ms < 8, costo);

  // 12. morte di Ferruccio: il corpo crolla quando la sequenza spezza i fili, poi si torna in piazza
  const mf = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    window.__qaStanza(1, [['colonna', 220, 140], ['colonna', 420, 140]], null);
    R.graziaIngressoC = 0; I.player.invuln = 0; I.player.x = 320; I.player.y = 230;
    R.viteExtra = 0; R.scudoRosaC = false; R.scudoStanzaD = 0; R.oggettiEquipaggiati = [];
    subisciColpoGiocatore(99, 'la prova', 300, 230);
    return { fase: R.fase };
  });
  await p.waitForTimeout(1250);
  const primaDelCrollo = await stato();
  await p.waitForTimeout(850);
  await p.screenshot({ path: foto('morte-ferruccio') });
  const dopoIlCrollo = await stato();
  ok('morte di Ferruccio: in piedi finché i fili reggono, poi in pezzi', mf.fase === 'morte' && !primaDelCrollo.giocatoreCrollato && dopoIlCrollo.giocatoreCrollato && dopoIlCrollo.pezzi >= 4, { mf, prima: primaDelCrollo.giocatoreCrollato, dopo: dopoIlCrollo.giocatoreCrollato, pezzi: dopoIlCrollo.pezzi });
  await p.waitForTimeout(3200);
  const fine = await p.evaluate(() => ({ fase: window.__teatro.interni.statoRun.fase, s: window.__teatro.interni.ribaltaB2.stato() }));
  await p.screenshot({ path: foto('dopo-la-morte') });
  ok('dopo la sequenza di morte il gioco prosegue (hub) e Ferruccio torna intero', fine.fase !== 'morte' && !fine.s.giocatoreCrollato, { fase: fine.fase });

  ok('nessun errore interno di b2', (await stato()).errori === 0, (await stato()).errori);
  ok('nessun errore di console', errori.length === 0, errori.slice(0, 5));
  console.log(JSON.stringify(esiti, null, 1));
  await browser.close();
  process.exit(esiti.every((e) => e.ok) ? 0 : 1);
})();
