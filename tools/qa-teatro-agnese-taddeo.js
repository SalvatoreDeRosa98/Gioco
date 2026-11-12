#!/usr/bin/env node
/*
 * tools/qa-teatro-agnese-taddeo.js — verifica Playwright della squadra h1 (gioco/teatro/h1-agnese-taddeo.js):
 *   1. il Telaio di Agnese esiste al piano 3 (San Leucio, anche al ciclo 2) e mai ai piani 1, 2, 4;
 *   2. primo incontro con le battute della bibbia; la notte dopo una scena diversa, poi una variante col dono;
 *   3. la scelta su Agnese solo dopo aver battuto il guardiano di San Leucio; le quattro combinazioni A-D e la
 *      variante neutra (con tastiera e con gamepad simulato);
 *   4. Agnese sotto il portico solo se risvegliata; Taddeo in piazza secondo la scelta;
 *   5. il confronto con Taddeo alla prima caduta del Capitano di Piombo, e mai più; non c'è giocando Taddeo;
 *   6. la lettera nel Diario (una volta), giocando Agnese il telaio è vuoto, le righe dei finali;
 *   7. nessun errore in ERRORI_TEATRO.
 * Passi di logica contati (passi/fermaCiclo), niente attese a tempo reale per lo stato del gioco.
 *
 * Uso: node tools/qa-teatro-agnese-taddeo.js <file html> [prefisso foto]
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { fermaCiclo, passi, aspettaFotogrammi } = require('./qa-teatro-comune');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-h1');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const err = [];
  p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
  p.on('pageerror', (e) => err.push(String(e)));
  await p.addInitScript(() => {
    window.__padAcceso = false;
    window.__pad = { id: 'Pad finto (QA)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => (window.__padAcceso ? [window.__pad, null, null, null] : [null, null, null, null]) });
  });
  const esiti = [];
  const ok = (caso, cond, dati) => { if (process.env.QA_H1_TRACCIA) console.log('·', caso, Boolean(cond)); esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) }); };

  await p.goto('file://' + file);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await p.waitForFunction(() => window.__teatro && window.__teatro.fase === 'menu_selezione', null, { timeout: 30000 });
  await p.keyboard.press('Space');
  await p.waitForFunction(() => window.__teatro.fase === 'hub', null, { timeout: 30000 });
  await fermaCiclo(p, true);
  const senzaCartigli = () => p.evaluate(() => { try { a6.coda.length = 0; a6.notifica = null; } catch (_) { /* a6 assente */ } });
  const dlg = () => p.evaluate(() => window.__teatro.t4qa.dialogo);
  const flag = (parz) => p.evaluate((x) => window.__teatro.t4qa.impostaFlag(x), parz);
  const disegna = () => p.evaluate(() => { try { disegnaFrame(16); } catch (e) { /* il disegno ha la sua rete */ } try { t4Gancio('sopra', 16); } catch (_) { /* */ } });
  /** [E] come il giocatore: se un cartiglio di sblocco (a6) si prende il primo tasto, si ripreme (al massimo 3 volte). */
  async function premiE() {
    for (let k = 0; k < 3; k++) { await senzaCartigli(); await p.keyboard.press('KeyE'); if (await dlg()) return true; await passi(p, 2); }
    return false;
  }
  /** Legge tutte le battute del cartiglio aperto premendo Invio; si ferma su una scelta. */
  async function leggi(max = 30) {
    const testi = [];
    for (let i = 0; i < max; i++) {
      const d = await dlg();
      if (!d) break;
      if (d.scelta) { testi.push({ scelta: d.scelta }); break; }
      testi.push(d.testo);
      await p.keyboard.press('Enter');
    }
    return testi;
  }
  const run = (pg) => p.evaluate((pg) => {
    selezionaPersonaggio(pg); statoRun.fase = 'in_gioco'; nuovaRun(false); statoRun.siparioAttivo = null;
    avviaPiano(3, false); statoRun.siparioAttivo = null; return statoRun.piano;
  }, pg);
  const alTelaio = () => p.evaluate(() => { const r = window.__teatro.h1qa.vaiAlTelaio(); statoRun.siparioAttivo = null; return r; });
  const T = await p.evaluate(() => window.__teatro.h1qa.testi);
  const base = { agnese: null, taddeo: null, h1_esito: null, h1_incontro: null, h1_leucio: null, h1_sciarpa: null, h1_dono_notte: null, lettera_agnese: null };

  // ---- 1. generazione ----
  const gen = await p.evaluate(() => {
    selezionaPersonaggio('ferruccio'); statoRun.fase = 'in_gioco'; nuovaRun(false);
    const r = {};
    for (const piano of [1, 2, 3, 4, 7]) {
      let n = 0;
      for (let k = 0; k < 40; k++) { avviaPiano(piano, false); if (statoRun.mappa.stanze.some((s) => s.tipo === 'telaio')) n++; }
      r[piano] = { n, leucio: window.__teatro.h1qa.sanLeucio(piano) };
    }
    statoRun.siparioAttivo = null;
    return r;
  });
  ok('telaio sempre al piano 3', gen[3].n === 40 && gen[3].leucio, gen);
  ok('telaio al piano 7 (San Leucio, ciclo 2)', gen[7].n === 40, gen[7]);
  ok('mai ai piani 1, 2, 4', gen[1].n + gen[2].n + gen[4].n === 0, gen);

  // ---- 2. primo incontro ----
  await flag(base);
  await run('ferruccio');
  ok('entrato al telaio', await alTelaio());
  await passi(p, 3);
  const vuota = await p.evaluate(() => ({ nemici: statoRun.stanzaCorrente.nemici.length, pulita: statoRun.stanzaCorrente.pulita }));
  ok('telaio senza nemici', vuota.nemici === 0 && vuota.pulita, vuota);
  await disegna(); await senzaCartigli(); await disegna();
  await p.screenshot({ path: foto('00-telaio') });
  await premiE();
  await disegna(); await senzaCartigli(); await disegna();
  await p.screenshot({ path: foto('01-primo-incontro') });
  let t = await leggi();
  ok('primo incontro: «Siete venuto ad aggiustarlo o a finirlo?»', t.includes('Siete venuto ad aggiustarlo o a finirlo?'), t);
  ok('primo incontro: «Almeno quelle non le rompete.»', t.some((x) => typeof x === 'string' && x.endsWith('Almeno quelle non le rompete.')), t);
  ok('nessuna scelta al primo incontro', !t.some((x) => x && x.scelta));

  // ---- notte dopo: scena diversa (la sciarpa) col dono; e la notte dopo ancora una variante ----
  await p.evaluate(() => incrementaNumeroNotte());
  await run('ferruccio'); await alTelaio(); await passi(p, 2);
  await premiE();
  t = await leggi();
  ok('notte 2: la sciarpa riconosciuta', t.includes(T.telaio.sciarpa[0][1]), t);
  ok('notte 2: un dono', t.includes(T.telaio.donoCura[1]) || t.includes(T.telaio.donoFilo[1]), t);
  await p.evaluate(() => incrementaNumeroNotte());
  await run('ferruccio'); await alTelaio(); await passi(p, 2);
  await premiE();
  const t3 = await leggi();
  const varianti = T.telaio.notti.map((r) => r[1]);
  ok('notte 3: una variante delle notti', t3.some((x) => varianti.includes(x)), t3);
  ok('notte 3: scelta ancora non disponibile', !t3.some((x) => x && x.scelta));
  const filo = await p.evaluate(() => window.__teatro.h1qa.filoPendente);

  // ---- 3. scelta disponibile solo alla condizione; le quattro combinazioni ----
  async function prova(taddeo, valore, conPad = false) {
    await flag({ ...base, h1_incontro: 1, h1_sciarpa: true, h1_leucio: true, taddeo });
    await run('ferruccio'); await alTelaio(); await passi(p, 2);
    await premiE();
    const prima = await leggi();
    const d = await dlg();
    if (!d || !d.scelta) return { prima, scelta: null };
    const idx = valore === 'risvegliata' ? 0 : 1;
    if (conPad) {
      await fermaCiclo(p, false);
      await p.evaluate(() => { window.__padAcceso = true; });
      await aspettaFotogrammi(p, 4);
      const premi = async (b) => {
        await p.evaluate((b) => { const x = window.__pad.buttons[b]; x.pressed = true; x.value = 1; }, b);
        await aspettaFotogrammi(p, 4);
        await p.evaluate((b) => { const x = window.__pad.buttons[b]; x.pressed = false; x.value = 0; }, b);
        await aspettaFotogrammi(p, 4);
      };
      if (idx === 1) await premi(13); // croce giù
      const sel = (await dlg()).sel;
      await premi(0); // Ⓐ
      await p.evaluate(() => { window.__padAcceso = false; });
      await fermaCiclo(p, true);
      const dopo = await leggiTesti();
      return { prima, scelta: d.scelta, sel, dopo, flag: await p.evaluate(() => window.__teatro.t4qa.flag.agnese) };
    }
    if (idx === 1) await p.keyboard.press('ArrowDown');
    if (taddeo === 'perdonato' && valore === 'risvegliata') { await disegna(); await senzaCartigli(); await disegna(); await p.screenshot({ path: foto('02-scelta-agnese') }); }
    await p.keyboard.press('Enter');
    const dopo = await leggiTesti();
    return { prima, scelta: d.scelta, dopo, flag: await p.evaluate(() => window.__teatro.t4qa.flag.agnese) };
  }
  async function leggiTesti() { const r = await leggi(); return r.filter((x) => typeof x === 'string'); }

  await flag({ ...base, h1_incontro: 1, h1_sciarpa: true });
  await p.evaluate(() => { try { const s = statoA6(); s.boss = []; scriviA6(s); } catch (_) { /* */ } });
  await run('ferruccio'); await alTelaio(); await passi(p, 2);
  await premiE();
  t = await leggi();
  ok('senza aver battuto San Leucio: niente scelta', !t.some((x) => x && x.scelta), t);

  const A = await prova('perdonato', 'risvegliata');
  ok('scelta con le due risposte', A.scelta && A.scelta[0] === T.scelta.risveglia && A.scelta[1] === T.scelta.sogna, A.scelta);
  ok('A (risvegliata+perdonato): «Non sapevo più il tuo nome.»', A.flag === 'risvegliata' && A.dopo.includes('Non sapevo più il tuo nome.'), A);
  const B = await prova('accusato', 'risvegliata');
  ok('B (risvegliata+accusato): «Ho aspettato un uomo per anni.»', B.flag === 'risvegliata' && B.dopo.includes('Ho aspettato un uomo per anni.'), B);
  const C = await prova('perdonato', 'sognante');
  ok('C (sognante+perdonato): Taddeo «Stai scegliendo al posto suo.»', C.flag === 'sognante' && C.dopo.includes('Stai scegliendo al posto suo.'), C);
  const D = await prova('accusato', 'sognante', true);
  ok('D col gamepad simulato (croce giù, Ⓐ)', D.sel === 1 && D.flag === 'sognante', D);
  ok('D (sognante+accusato): «Prendila…» e «Che tipo buffo.»', D.dopo.includes('Prendila. Non so perché, ma credo che debba averla tu.') && D.dopo.includes('Che tipo buffo.'), D.dopo);
  const N = await prova(null, 'risvegliata');
  ok('neutra senza confronto', N.flag === 'risvegliata' && N.dopo.includes(T.esiti.neutroRisvegliata[1][1]), N.dopo);

  // ---- 4. piazza ----
  const presenze = async (f) => {
    await flag(f);
    await p.evaluate(() => { selezionaPersonaggio('ferruccio'); window.__teatro.t4.ricomincia(); });
    await passi(p, 3);
    return p.evaluate(() => window.__teatro.t4qa.presenze.filter((x) => x.tipo === 'npc').map((x) => x.id));
  };
  let pr = await presenze({ agnese: 'risvegliata', taddeo: 'perdonato', h1_esito: 'A' });
  ok('portico: Agnese se risvegliata, Taddeo se perdonato', pr.includes('agnese') && pr.includes('taddeo'), pr);
  // parla con Agnese sotto il portico
  await p.evaluate(() => { const a = window.__teatro.t4qa.presenze.find((x) => x.id === 'agnese'); player.x = a.x; player.y = a.y + 14; });
  await disegna(); await disegna();
  await p.screenshot({ path: foto('03-portico') });
  await premiE();
  t = await leggi();
  ok('portico: la sciarpa «Dicono che il rosso protegga dal malocchio.»', t.includes('Dicono che il rosso protegga dal malocchio.'), t);
  await premiE();
  t = await leggi();
  ok('portico: battuta del percorso A', t.some((x) => T.portico.A.map((r) => r[1]).includes(x)), t);
  pr = await presenze({ agnese: 'sognante', taddeo: 'accusato' });
  ok('niente Agnese se sognante; Taddeo accusato c\'è', !pr.includes('agnese') && pr.includes('taddeo'), pr);
  await p.evaluate(() => { const a = window.__teatro.t4qa.presenze.find((x) => x.id === 'taddeo'); player.x = a.x; player.y = a.y + 14; });
  await premiE();
  t = await leggi();
  ok('Taddeo accusato: battuta sua', t.some((x) => T.piazzaTaddeo.accusato.map((r) => r[1]).includes(x)), t);
  pr = await presenze({ agnese: null, taddeo: null });
  ok('senza scelte: né Agnese né Taddeo', !pr.includes('agnese') && !pr.includes('taddeo'), pr);

  // ---- 5. confronto con Taddeo ----
  const uccidiCapitano = async (pg) => {
    await p.evaluate((pg) => {
      window.__teatro.interni.bossB6 && window.__teatro.interni.bossB6.forza('capitano-guardia');
      selezionaPersonaggio(pg); statoRun.fase = 'in_gioco'; nuovaRun(false); avviaPiano(3, false); statoRun.siparioAttivo = null;
      const b = statoRun.mappa.stanze.find((s) => s.tipo === 'boss');
      entraInStanza(b, null); statoRun.siparioAttivo = null;
    }, pg);
    await passi(p, 2);
    const id = await p.evaluate(() => (statoRun.stanzaCorrente.nemici.find((n) => n.boss) || {}).bossId);
    await p.evaluate(() => { for (const n of statoRun.stanzaCorrente.nemici.slice()) danneggiaNemico(n, 1e6, 0, 0); });
    for (let k = 0; k < 40 && !(await dlg()); k++) await passi(p, 5);
    return id;
  };
  await flag({ taddeo: null, agnese: null });
  const capo = await uccidiCapitano('ferruccio');
  ok('boss del piano 3: il Capitano', capo === 'capitano-guardia', capo);
  await disegna(); await senzaCartigli(); await disegna();
  await p.screenshot({ path: foto('04-confronto') });
  t = await leggi();
  ok('confronto: «Quella l\'abbiamo forgiata insieme.»', t.includes('No... Quella l\'abbiamo forgiata insieme.') && t.some((x) => x && x.scelta), t);
  const sc = t.find((x) => x && x.scelta);
  ok('confronto: Perdonalo / Accusalo', sc && sc.scelta[0] === T.scelta.perdona && sc.scelta[1] === T.scelta.accusa, sc);
  const dmg0 = await p.evaluate(() => statoRun.dmg);
  await p.keyboard.press('Enter'); // Perdonalo
  t = await leggiTesti();
  const fT = await p.evaluate(() => window.__teatro.t4qa.flag.taddeo);
  ok('perdonato: «E io le ho creduto. Che Dio mi perdoni.»', fT === 'perdonato' && t.includes('E io le ho creduto. Che Dio mi perdoni.'), { fT, t });
  const dmg1 = await p.evaluate(() => statoRun.dmg);
  ok('effetto perdonato: danno un poco più basso', dmg1 < dmg0, { dmg0, dmg1 });
  await uccidiCapitano('ferruccio');
  ok('mai più: seconda caduta senza confronto', !(await dlg()));
  await flag({ taddeo: null });
  await uccidiCapitano('taddeo');
  ok('giocando Taddeo: niente confronto', !(await dlg()) && (await p.evaluate(() => window.__teatro.t4qa.flag.taddeo)) === null);
  await p.evaluate(() => window.__teatro.interni.bossB6 && window.__teatro.interni.bossB6.forza(null));

  // ---- 6. Diario, Agnese giocata, finali ----
  const diario = await p.evaluate(() => {
    window.__teatro.t4qa.impostaFlag({ lettera_agnese: 'vera', h1_diario_lettera: null, taddeo: 'accusato', h1_diario_taddeo: null });
    const v = { notte: 4, esito: 'morte', piano: 3, causa: 'Guardia', personaggio: 'ferruccio' };
    const a = componiPaginaB8(v, {}, statoB8(), {}).righe;
    const b = componiPaginaB8({ ...v, notte: 5 }, {}, statoB8(), {}).righe;
    return { a, b };
  });
  ok('Diario: la lettera per intero', diario.a.some((r) => r.includes('cercami al telaio')) && diario.a.some((r) => r.includes('— A.»')), diario.a);
  ok('Diario: riga di Taddeo', diario.a.includes(T.diario.taddeo.accusato));
  ok('Diario: una volta sola', !diario.b.some((r) => r.includes('cercami al telaio')), diario.b);

  await flag({ ...base });
  await run('agnese'); await alTelaio(); await passi(p, 2);
  await premiE();
  await disegna(); await senzaCartigli(); await disegna();
  await p.screenshot({ path: foto('05-agnese-giocata') });
  t = await leggi();
  ok('giocando Agnese: il telaio vuoto con la sciarpa a metà', t.includes(T.telaio.giocataAgnese[0][1]), t);
  pr = await presenze({ agnese: 'risvegliata', taddeo: 'perdonato' });
  await p.evaluate(() => selezionaPersonaggio('agnese'));
  await passi(p, 2);
  pr = await p.evaluate(() => window.__teatro.t4qa.presenze.filter((x) => x.tipo === 'npc').map((x) => x.id));
  ok('giocando Agnese: non è anche sotto il portico', !pr.includes('agnese'), pr);
  await p.evaluate(() => selezionaPersonaggio('ferruccio'));

  const fin = await p.evaluate(() => {
    const out = {};
    for (const [ag, td] of [['risvegliata', 'perdonato'], ['sognante', 'accusato']]) {
      window.__teatro.t4qa.impostaFlag({ agnese: ag, taddeo: td });
      const cx = contestoFinaleB8();
      const testi = (ramo) => preparaSceneB8(FINALE_B8.vero.rami[ramo], cx).flatMap((s) => (s.battute || []).map((b) => b.testo));
      out[`${ag}-${td}`] = { uccisa: testi('uccisa'), risparmiata: testi('risparmiata') };
    }
    return out;
  });
  const A1 = fin['risvegliata-perdonato'], D1 = fin['sognante-accusato'];
  ok('finale uccisa A: «Fermati! Non voglio perderti un\'altra volta!» e Taddeo «Una volta ti ho consegnato…»',
    A1.uccisa.includes('Fermati! Non voglio perderti un\'altra volta!') && A1.uccisa.includes(T.finale.uccisa.taddeoPerdonato), A1.uccisa);
  ok('finale uccisa D: l\'accusa di Agnese', D1.uccisa.includes(T.finale.uccisa.agneseAccusa) && !D1.uccisa.includes(T.finale.uccisa.agneseAma), D1.uccisa);
  ok('finale risparmiata: «Devo finire una sciarpa…»', A1.risparmiata.includes(T.finale.risparmiata.agneseUltima) && A1.risparmiata.includes(T.finale.risparmiata.agneseRisvegliata), A1.risparmiata);
  ok('finale risparmiata D: continua a tessere', D1.risparmiata.includes(T.finale.risparmiata.agneseSognante), D1.risparmiata);
  ok('finale: «Ferruccio riesce a fuggire.» resta l\'ultima della folla', A1.uccisa.indexOf('Ferruccio riesce a fuggire.') > A1.uccisa.indexOf(T.finale.uccisa.taddeoPerdonato));
  ok('filo di seta: dono registrato', filo >= 0, filo);

  const errT = await p.evaluate(() => ERRORI_TEATRO.slice(0, 3).map(String));
  ok('nessun errore in ERRORI_TEATRO né in console', errT.length === 0 && err.length === 0, { errT, err: err.slice(0, 3) });

  await browser.close();
  const rossi = esiti.filter((e) => !e.ok);
  for (const e of esiti) console.log(`${e.ok ? 'OK ' : 'KO '} ${e.caso}${e.ok ? '' : '  ' + JSON.stringify(e.dati || '').slice(0, 600)}`);
  console.log(`\n${esiti.length - rossi.length}/${esiti.length} controlli verdi`);
  process.exit(rossi.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
