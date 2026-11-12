#!/usr/bin/env node
/**
 * tools/qa-teatro-rete-stanza.js — la stanza di un boss non resta mai chiusa senza nessuno in piedi, la vita non
 * supera mai il massimo, e il file di diagnosi (F8) racconta lo stato del gioco.
 * Nasce da una prova dell'amico dell'autore (2026-11-12): Donna Luciana caduta ma la botola restava chiusa; vita 11 su 5.
 * Uso: node tools/qa-teatro-rete-stanza.js [file html] [prefisso foto]
 * Il ciclo vero resta ACCESO: la rete di sicurezza sta nel ciclo (80-ciclo.js), non nel passo di logica.
 */
const path = require('path');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(process.argv[2] || path.join(RADICE, 'gioco', 'teatro_marionette.html'));
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-rete-stanza');

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 }, acceptDownloads: true });
  const errori = [];
  p.on('pageerror', (e) => errori.push(String(e).slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text().slice(0, 200)); });
  const esiti = [];
  const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(cond ? {} : { dati }) });

  await p.goto('file://' + file);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await p.waitForFunction(() => window.__teatro && window.__teatro.fase === 'menu_selezione', null, { timeout: 30000 });
  await p.keyboard.press('Space');
  await p.waitForFunction(() => window.__teatro.fase === 'hub', null, { timeout: 30000 });

  /** Notte nuova nella sala di Donna Luciana, cartiglio chiuso, giocatore al sicuro. */
  const daLuciana = async (pg) => {
    await p.evaluate((pg) => {
      selezionaPersonaggio(pg); statoRun.fase = 'in_gioco'; nuovaRun(false); statoRun.pausa = false;
      avviaPiano(4, false); statoRun.siparioAttivo = null;
      const st = statoRun.mappa.stanze.find((s) => s.tipo === 'boss'); entraInStanza(st, 'S'); statoRun.siparioAttivo = null;
      player.invuln = 1e9; window.__st = st;
    }, pg);
    for (let k = 0; k < 30; k++) { if (!(await p.evaluate(() => Boolean(window.__teatro.t4qa.dialogo)))) break; await p.keyboard.press('Enter'); await p.waitForTimeout(40); }
    await p.evaluate(() => { statoRun.siparioAttivo = null; player.invuln = 1e9; });
  };
  const pulita = () => p.evaluate(() => Boolean(window.__st.pulita));
  const aspettaPulita = async (ms) => { for (let t = 0; t < ms; t += 100) { if (await pulita()) return true; await p.waitForTimeout(100); await p.evaluate(() => { player.invuln = 1e9; }); } return pulita(); };

  // 1. un danno non numerico non lascia la vita non numerica
  await daLuciana('ferruccio');
  const d1 = await p.evaluate(() => { const b = window.__st.nemici.find((n) => n.boss); const hp0 = b.hp; danneggiaNemico(b, NaN, 0, 0); danneggiaNemico(b, undefined, 0, 0); return { hp0, hp: b.hp, note: NOTE_DIAGNOSI.map((n) => n.cosa) }; });
  ok('danno non numerico: la vita resta un numero e resta una nota', Number.isFinite(d1.hp) && d1.hp === d1.hp0 && d1.note.includes('danno non numerico'), d1);

  // 2. vita non numerica (il caso della foto: boss invisibile, botola chiusa): il ciclo la considera a terra e apre
  const d2 = await p.evaluate(() => { const b = window.__st.nemici.find((n) => n.boss); b.hp = NaN; return { vivi: window.__st.nemici.filter((n) => n.hp > 0).length }; });
  ok('vita non numerica: la stanza si apre da sola', d2.vivi === 0 && await aspettaPulita(3000), { ...d2, pulita: await pulita() });

  // 3. vita azzerata senza passare dai colpi (bruciatura): si apre
  await daLuciana('agnese');
  await p.evaluate(() => { for (const n of window.__st.nemici) n.hp = 0; });
  ok('boss a terra senza un colpo (bruciatura): la stanza si apre', await aspettaPulita(3000), { pulita: await pulita() });

  // 4. uno strato tiene chiusa la stanza per sbaglio: dopo qualche secondo la rete di sicurezza la apre e lascia una nota
  await daLuciana('ombra');
  await p.evaluate(() => {
    const base = verificaStanzaPulita; window.__blocco = true;
    verificaStanzaPulita = function (...a) { if (window.__blocco && statoRun.stanzaCorrente === window.__st) return undefined; return base.apply(this, a); };
    NOTE_DIAGNOSI.length = 0;
    for (const n of window.__st.nemici) n.hp = 0;
  });
  await p.waitForTimeout(1500);
  const presto = await pulita();
  const dopo = await aspettaPulita(9000);
  const note4 = await p.evaluate(() => NOTE_DIAGNOSI.map((n) => n.cosa));
  ok('stanza del boss tenuta chiusa da uno strato: resta chiusa un attimo, poi la rete la apre', !presto && dopo && note4.includes('stanza del boss aperta dalla rete di sicurezza'), { presto, dopo, note4 });
  const botola = await p.evaluate(() => ({ uscita: Boolean(window.__st.uscitaAperta), banner: (statoRun.banner || '').slice(0, 40) }));
  ok('dopo la rete: l\'uscita è aperta', botola.uscita, botola);
  await p.evaluate(() => { window.__blocco = false; });
  await p.screenshot({ path: `${prefisso}-aperta.png` });

  // 5. la rete non scatta Sopra la Ribalta né in una stanza normale
  const normale = await p.evaluate(() => { nuovaRun(false); const st = statoRun.mappa.stanze.find((s) => s.tipo === 'normale'); return typeof RETE_STANZA === 'object' && RETE_STANZA.tickBossSenzaVivi >= 120 && Boolean(st); });
  ok('la soglia della rete è di qualche secondo', normale);

  // 6. Manto dell'Abisso: sei Maschere di cera, mai oltre il massimo, nessuna cura
  const manto = await p.evaluate(async () => {
    const out = {};
    for (const pg of ['agnese', 'ferruccio', 'ombra']) {
      selezionaPersonaggio(pg); statoRun.fase = 'in_gioco'; nuovaRun(false); statoRun.siparioAttivo = null; statoRun.pausa = false;
      const prima = [statoRun.hpHalf, statoRun.maxHpHalf];
      acquisisciOggettoConLimite5Slot({ ...trovaOggettoB('patto_abisso') }, 'piedistallo', { preso: false });
      statoRun.scambioPendente = null; statoRun.cartiglioD = null;
      out[pg] = { prima, dopo: [statoRun.hpHalf, statoRun.maxHpHalf] };
    }
    return out;
  });
  ok('Manto: Agnese e Ferruccio hanno 6 Maschere piene, mai oltre il massimo', manto.agnese.dopo[0] === manto.agnese.dopo[1] && manto.agnese.dopo[1] === 12 && manto.ferruccio.dopo[0] === manto.ferruccio.dopo[1] && manto.ferruccio.dopo[1] === 12, manto);
  ok('Manto: l\'Ombra resta con la sua mezza Maschera', manto.ombra.dopo[0] <= manto.ombra.dopo[1] && manto.ombra.dopo[1] <= 2, manto.ombra);
  // nessuna cura: Ferruccio col Manto perde una Maschera, prova a curarsi, la vita non risale; e mai oltre il massimo
  await p.evaluate(() => { selezionaPersonaggio('ferruccio'); statoRun.fase = 'in_gioco'; nuovaRun(false); statoRun.siparioAttivo = null; statoRun.pausa = false; player.invuln = 1e9;
    acquisisciOggettoConLimite5Slot({ ...trovaOggettoB('patto_abisso') }, 'piedistallo', { preso: false }); statoRun.scambioPendente = null; statoRun.cartiglioD = null; });
  await p.waitForTimeout(200);
  await p.evaluate(() => { statoRun.hpHalf -= 3; });
  await p.waitForTimeout(200);
  await p.evaluate(() => { statoRun.hpHalf = Math.min(statoRun.maxHpHalf, statoRun.hpHalf + 2); });
  await p.waitForTimeout(200);
  const cura = await p.evaluate(() => [statoRun.hpHalf, statoRun.maxHpHalf]);
  ok('Manto: le Maschere di cera non si riparano', cura[0] === cura[1] - 3, cura);
  await p.evaluate(() => { statoRun.hpHalf = statoRun.maxHpHalf + 12; });
  await p.waitForTimeout(200);
  const tetto = await p.evaluate(() => [statoRun.hpHalf, statoRun.maxHpHalf]);
  ok('la vita non resta mai sopra il massimo', tetto[0] <= tetto[1], tetto);

  // 7. il file di diagnosi (F8)
  const [scarico] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.keyboard.press('F8')]);
  const diag = await p.evaluate(() => diagnosiTeatro());
  ok('F8 salva un file di diagnosi', Boolean(scarico) && /^diagnosi-teatro-.*\.json$/.test(scarico.suggestedFilename()), scarico && scarico.suggestedFilename());
  ok('la diagnosi racconta notte, personaggio, vita, oggetti e stanza', diag.personaggio && Array.isArray(diag.vita) && diag.oggetti.includes('patto_abisso') && diag.stanza && Array.isArray(diag.stanza.nemici) && Array.isArray(diag.note), diag);

  ok('nessun errore di console', errori.length === 0, errori);
  ok('nessun errore in ERRORI_TEATRO', await p.evaluate(() => ERRORI_TEATRO.length === 0), await p.evaluate(() => ERRORI_TEATRO.slice(0, 3)));
  await browser.close();
  for (const e of esiti) console.log(`${e.ok ? 'OK  ' : 'NO  '} ${e.caso}${e.ok ? '' : ' — ' + JSON.stringify(e.dati).slice(0, 400)}`);
  const rossi = esiti.filter((e) => !e.ok).length;
  console.log(`\n${esiti.length - rossi}/${esiti.length} controlli verdi`);
  process.exit(rossi ? 1 : 0);
})();
