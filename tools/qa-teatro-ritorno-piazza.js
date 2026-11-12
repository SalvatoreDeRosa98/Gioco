#!/usr/bin/env node
/*
 * tools/qa-teatro-ritorno-piazza.js — verifica Playwright della squadra h4 (gioco/teatro/h4-ritorno-piazza.js):
 *   1. porta NON pronta: dopo Donna Luciana resta tutto com'è (cordone di b8, niente ritorno);
 *   2. porta pronta: la seconda uscita «Torna in piazza», piazza con la notte viva (stessa run, stessi oggetti,
 *      Maschere piene, nessuna pergamena nuova, nessuna istantanea di e6), battuta di Tonino, riga nel menu di pausa;
 *   3. Fucina «Sali» → rastrelliera dei ferri (tastiera e pad simulato via b3) → d1 senza nuovaRun: statistiche
 *      uguali a prima di salire (passo a parte, il costo dei ferri), per i quattro personaggi;
 *   4. vita del boss che cresce con la dotazione e col ciclo, nei limiti; i ferri cambiano lo scontro;
 *   5. vittoria → finale di b8 e chiusura della notte (conto, notte+1); morte → morte normale;
 *   6. rinuncia: porta di destra → primo piano del ciclo seguente; ciclo 2: il ritorno si ripresenta;
 *   7. a mani nude (sera nuova) lo scontro è quello di prima (nuovaRun); nessun errore in ERRORI_TEATRO.
 * Passi di logica contati (passi), niente attese a tempo reale per la logica.
 *
 * Uso: node tools/qa-teatro-ritorno-piazza.js <file html> [prefisso screenshot]
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { fermaCiclo, passi } = require('./qa-teatro-comune');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-h4');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });
  const H = () => p.evaluate(() => window.__teatro.interni.ritornoH4.stato());
  const disegna = () => p.evaluate(() => { try { disegnaFrame(16); t4Gancio('sopra', 16); } catch (e) { console.error(e); } });
  const scatta = async (n) => { await p.evaluate(() => { try { a6.coda.length = 0; a6.notifica = null; } catch (_) { /* a6 */ } }); await disegna(); await p.screenshot({ path: foto(n) }); };
  const tasto = async (code) => {
    await p.evaluate((c) => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c, key: c, bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { code: c, key: c, bubbles: true })); }, code);
  };

  const avvio = async (pid = 'ferruccio', pronta = true) => {
    await p.goto('file://' + file);
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
    await p.reload();
    await p.waitForTimeout(400);
    await fermaCiclo(p, true);
    await p.evaluate(([id, pr]) => {
      statoRun.personaggioId = id;
      if (pr) { const s = statoB8(); s.ferri = { tenaglie: 1, punzone: 1, ago: 1 }; s.finaleVisto = true; s.senzaFine = true; s.sigilliMostrati = 3; scriviB8(s); }
      else { const s = statoB8(); s.finaleVisto = true; s.senzaFine = true; s.ferri = { tenaglie: 1 }; scriviB8(s); }
      avviaPartitaConPersonaggio(id);
    }, [pid, pronta]);
    await passi(p, 5);
  };
  /** Una notte con qualche oggetto, fino a Donna Luciana caduta (piano 4 × ciclo). */
  const finoALuciana = async (piano = 4, oggetti = 4) => p.evaluate(([pi, k]) => {
    if (statoRun.fase === 'hub') nuovaRun(false);
    const forti = CATALOGO_OGGETTI.filter((x) => x.tier === 'forte' && x.mod && (x.mod.dmgUp || x.mod.cadenzaUp)).slice(0, k);
    for (const it of forti) statoRun.oggettiEquipaggiati.push({ ...it });
    statoRun.monete = 17;
    ricalcolaStatistiche();
    avviaPiano(pi, true);
    statoRun.siparioAttivo = null;
    const boss = statoRun.mappa.stanze.find((s) => s.tipo === 'boss');
    entraInStanza(boss, 'S');
    statoRun.siparioAttivo = null;
    for (const n of boss.nemici) n.hp = 0;
    verificaStanzaPulita();
    return { id: (boss.nemici.find((n) => n.boss) || {}).bossId, run: statoRun.numeroRun };
  }, [piano, oggetti]);
  const dotazione = () => p.evaluate(() => ({ run: statoRun.numeroRun, pid: statoRun.personaggioId, ogg: statoRun.oggettiEquipaggiati.map((o) => o.id).join(','),
    dmg: +statoRun.dmg.toFixed(3), colpi: +statoRun.colpiAlSec.toFixed(3), speed: +statoRun.speed.toFixed(3), max: statoRun.maxHpHalf, hp: statoRun.hpHalf,
    monete: statoRun.monete, attivo: statoRun.oggettoAttivo && statoRun.oggettoAttivo.id, notte: statoRun.numeroNotte, ciclo: statoRun.ciclo }));
  const errTeatro = () => p.evaluate(() => (window.ERRORI_TEATRO || []).length);

  // ---- 1. Porta non pronta: tutto come prima ----
  await avvio('ferruccio', false);
  let l = await finoALuciana();
  await passi(p, 80);
  let st = await p.evaluate(() => ({ cordone: Boolean(statoRun.stanzaCorrente.cordoneB8), ritorno: Boolean(statoRun.stanzaCorrente.ritornoH4) }));
  ok('non-pronta-luciana', l.id === 'donna-luciana', l);
  ok('non-pronta-cordone-come-prima', st.cordone && !st.ritorno, st);

  // ---- 2. Porta pronta: seconda uscita e piazza con la notte viva ----
  await avvio('ferruccio', true);
  l = await finoALuciana();
  await passi(p, 80);
  st = await p.evaluate(() => ({ cordone: Boolean(statoRun.stanzaCorrente.cordoneB8), ritorno: Boolean(statoRun.stanzaCorrente.ritornoH4) }));
  ok('pronta-uscita-accanto-al-cordone', st.ritorno && st.cordone, st);
  await p.evaluate(() => { try { a7.pergamena = null; } catch (_) { /* a7 */ } statoRun.hpHalf = 1; const U = window.__teatro.interni.RITORNO_H4.uscita; player.x = U.x; player.y = U.y + 4; });
  await scatta('01-seconda-uscita');
  const prima = await dotazione();
  await tasto('KeyE');
  await passi(p, 3);
  const dopo = await dotazione();
  let h = await H();
  const piazza = await p.evaluate(() => ({ fase: statoRun.fase, perg: Boolean(a7.pergamena || a7.inAttesaHub), snap: localStorage.getItem('ferruccio.teatro.ripresa.' + window.__teatroT3.salvataggi.slotAttivo) }));
  ok('piazza-fase-hub', piazza.fase === 'hub', piazza.fase);
  ok('piazza-notte-viva', h.notteViva && h.viva.piano === 5, h.viva);
  ok('piazza-stessa-dotazione', dopo.run === prima.run && dopo.ogg === prima.ogg && dopo.dmg === prima.dmg && dopo.monete === prima.monete && dopo.attivo === prima.attivo && dopo.notte === prima.notte, { prima, dopo });
  ok('piazza-maschere-piene', dopo.hp === dopo.max, dopo);
  ok('piazza-niente-pergamena-ne-istantanea', !piazza.perg && !piazza.snap, piazza);
  await passi(p, 400);
  for (let i = 0; i < 12; i++) { await p.evaluate(() => { try { const q = window.__teatro.t4qa; if (q && q.dialogo) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ' })); } catch (_) { /* */ } }); await passi(p, 20); }
  await passi(p, 60);
  h = await H();
  ok('piazza-tonino', h.battuta === prima.run, h.battuta);
  await scatta('02-piazza-viva');
  await p.evaluate(() => { b8.cart = null; statoRun.pausa = true; });
  await scatta('03-pausa-notte-viva');
  await p.evaluate(() => { statoRun.pausa = false; });

  // ---- 3. Fucina → rastrelliera → scontro con la dotazione ----
  const salita = await dotazione();
  await p.evaluate(() => { fineFucinaB8({ scelta: 'sali', cx: {} }); });
  h = await H();
  ok('rastrelliera-aperta', Boolean(h.rastrelliera), h.rastrelliera);
  await tasto('ArrowUp'); await tasto('ArrowUp'); await tasto('ArrowUp'); // tenaglie
  await tasto('KeyE');
  await tasto('ArrowDown'); await tasto('ArrowDown'); // ago
  await tasto('Enter');
  h = await H();
  ok('rastrelliera-tastiera', h.rastrelliera && h.rastrelliera.presi.tenaglie && h.rastrelliera.presi.ago && !h.rastrelliera.presi.punzone, h.rastrelliera);
  const padMenu = await p.evaluate(() => (window.__teatro.interni.comandiB3 || {}).menuAperti.some((f) => f()));
  ok('rastrelliera-registrata-nei-menu-b3', padMenu);
  await scatta('04-rastrelliera');
  await tasto('ArrowDown'); await tasto('KeyE'); // Sali
  await passi(p, 30);
  const inScontro = await dotazione();
  h = await H();
  const s1 = await p.evaluate(() => window.__teatro.interni.burattinaioD1.stato());
  ok('scontro-senza-nuovaRun', s1.attivo && inScontro.run === salita.run && inScontro.ogg === salita.ogg, { salita, inScontro });
  ok('scontro-statistiche-uguali', inScontro.dmg === salita.dmg && inScontro.colpi === salita.colpi && inScontro.max === salita.max && inScontro.hp === salita.max, { salita, inScontro });
  ok('ferri-costano-passo', Math.abs(inScontro.speed - salita.speed * 0.8) < 0.01, { prima: salita.speed, dopo: inScontro.speed });
  ok('ferri-nello-scontro', s1.sigilli.tenaglie && s1.sigilli.ago && !s1.sigilli.punzone, s1.sigilli);
  ok('boss-scalato', h.scontro && s1.capo.maxHp > 650 && h.scontro.forza >= 1 && h.scontro.forza <= 4.5, { forza: h.scontro && h.scontro.forza, max: s1.capo.maxHp });
  await passi(p, 200);
  await scatta('05-scontro-dotazione');
  // vittoria
  await p.evaluate(() => { statoRun.maxHpHalf = 99; statoRun.hpHalf = 99; });
  for (let k = 0; k < 6; k++) { await p.evaluate(() => window.__teatro.interni.burattinaioD1.danneggia(99999)); await passi(p, 140); }
  await passi(p, 300);
  const vit = await p.evaluate(() => ({ fase: statoRun.fase, esito: window.__teatro.interni.burattinaioD1.stato().esito, notte: getNumeroNotte(), attesa: Boolean(a7.inAttesaHub || a7.pergamena), run: Boolean(a7.run) }));
  ok('vittoria-finale', vit.esito === 'vittoria' && vit.fase === 'finale', vit);
  ok('vittoria-chiude-notte', vit.notte === salita.notte + 1 && !vit.run && vit.attesa, vit);
  await p.evaluate(() => saltaFinaleB8());
  await passi(p, 20);
  ok('vittoria-torna-in-piazza', (await p.evaluate(() => statoRun.fase)) === 'hub' && !(await H()).notteViva);

  // ---- 4. Scala: dotazione e ciclo, limiti ----
  const sc = await p.evaluate(() => { const I = window.__teatro.interni.ritornoH4; const t = (f, c) => Object.values(I.scala(f, c).vita).reduce((a, b) => a + b * 1, 0);
    return { nudo: t(1, 1), debole: t(1.8, 1), forte: t(3, 1), ciclo2: t(3, 2), ciclo9: t(3, 9), ciclo99: t(3, 99), ritmo9: I.scala(4.5, 9).ritmo }; });
  ok('scala-cresce-con-dotazione', sc.forte > sc.nudo && sc.debole === sc.nudo && sc.nudo === 455, sc); // somma della tabella (mano1+mano2+mano3+forbici); 650 col doppio delle mani
  ok('scala-cresce-col-ciclo-con-tetto', sc.ciclo2 > sc.forte && sc.ciclo9 === sc.ciclo99 && sc.ritmo9 >= 0.6, sc);

  // ---- 5. Quattro personaggi, morte normale, zero ferri ----
  for (const pid of ['agnese', 'taddeo', 'ombra']) {
    await avvio(pid, true);
    await finoALuciana();
    await passi(p, 80);
    await p.evaluate(() => { a7.pergamena = null; window.__teatro.interni.ritornoH4.tornaInPiazza(); });
    await passi(p, 3);
    const a = await dotazione();
    await p.evaluate(() => { b8.cart = null; fineFucinaB8({ scelta: 'sali', cx: {} }); window.__teatro.interni.ritornoH4.sali(); });
    await passi(p, 10);
    const b = await dotazione();
    const sd = await p.evaluate(() => window.__teatro.interni.burattinaioD1.stato());
    ok(`personaggio-${pid}`, sd.attivo && a.pid === pid && b.pid === pid && a.run === b.run && a.dmg === b.dmg && a.speed === b.speed && b.hp === a.max && !sd.sigilli.tenaglie, { a, b });
    if (pid === 'ombra') {
      // due colpi: il primo lo para il Volto Ritrovato (una volta per notte, sbloccato dalla Fucina)
      const colpo = await p.evaluate(() => { b8.voltoUsatoRun = statoRun.numeroRun; statoRun.hpHalf = 1; player.invuln = 0; subisciColpoGiocatore(2, 'qa', player.x, player.y); return { hp: statoRun.hpHalf, fase: statoRun.fase }; });
      // (il colpo diretto può cadere nella grazia dell'ingresso: a una Maschera, le Mani finiscono il lavoro)
      void colpo;
      for (let k = 0; k < 20 && (await p.evaluate(() => statoRun.fase)) === 'in_gioco'; k++) await passi(p, 120);
      const m = await p.evaluate(() => ({ fase: statoRun.fase, esito: window.__teatro.interni.burattinaioD1.stato().esito }));
      ok('morte-normale', m.fase === 'morte' || m.fase === 'hub', m);
      ok('morte-pulisce-h4', !(await H()).scontro);
    }
  }

  // ---- 6. Rinuncia: porta di destra → ciclo seguente; il ritorno si ripresenta al ciclo 2 ----
  await avvio('ferruccio', true);
  await finoALuciana();
  await passi(p, 80);
  await p.evaluate(() => { a7.pergamena = null; window.__teatro.interni.ritornoH4.tornaInPiazza(); window.__teatro.interni.nuovaRun(); });
  await passi(p, 3);
  const rin = await dotazione();
  ok('rinuncia-ciclo-seguente', rin.ciclo === 2 && (await p.evaluate(() => statoRun.piano)) === 5 && (await p.evaluate(() => statoRun.fase)) === 'in_gioco', rin);
  const snap = await p.evaluate(() => Boolean(localStorage.getItem('ferruccio.teatro.ripresa.' + window.__teatroT3.salvataggi.slotAttivo)));
  ok('rinuncia-istantanea-e6-riscritta', snap);
  await p.evaluate(() => {
    avviaPiano(8, true); statoRun.siparioAttivo = null;
    const boss = statoRun.mappa.stanze.find((s) => s.tipo === 'boss'); entraInStanza(boss, 'S'); statoRun.siparioAttivo = null; for (const n of boss.nemici) n.hp = 0; verificaStanzaPulita();
  });
  await passi(p, 80);
  ok('ciclo2-ritorno-di-nuovo', await p.evaluate(() => Boolean(statoRun.stanzaCorrente.ritornoH4)));
  await p.evaluate(() => { a7.pergamena = null; window.__teatro.interni.ritornoH4.tornaInPiazza(); });
  await passi(p, 3);
  h = await H();
  ok('ciclo2-viva', h.notteViva && h.viva.ciclo === 2 && h.viva.piano === 9, h.viva);
  // la vita scala col ciclo
  await p.evaluate(() => { b8.cart = null; fineFucinaB8({ scelta: 'sali', cx: {} }); window.__teatro.interni.ritornoH4.sali(); });
  await passi(p, 5);
  h = await H();
  ok('ciclo2-boss-piu-duro', h.scontro && h.scontro.ciclo === 2 && h.scontro.molt > (await p.evaluate((f) => window.__teatro.interni.ritornoH4.scala(f, 1).molt, h.scontro.forza)), h.scontro && { molt: h.scontro.molt, forza: h.scontro.forza });
  // Ricomincia notte dalla piazza chiude la notte
  await avvio('ferruccio', true);
  await finoALuciana();
  await passi(p, 80);
  await p.evaluate(() => { a7.pergamena = null; window.__teatro.interni.ritornoH4.tornaInPiazza(); });
  const n0 = await p.evaluate(() => getNumeroNotte());
  await p.evaluate(() => ricominciaNotte());
  await passi(p, 3);
  const ric = await p.evaluate(() => ({ fase: statoRun.fase, notte: getNumeroNotte(), run: Boolean(a7.run) }));
  ok('ricomincia-chiude-notte', ric.fase === 'hub' && ric.notte === n0 + 1 && !ric.run && !(await H()).notteViva, ric);

  // ---- 7. A mani nude da una sera nuova: come prima ----
  await avvio('ferruccio', true);
  const run0 = await p.evaluate(() => statoRun.numeroRun);
  await p.evaluate(() => fineFucinaB8({ scelta: 'sali', cx: {} }));
  await passi(p, 5);
  const nudo = await p.evaluate(() => ({ run: statoRun.numeroRun, ogg: statoRun.oggettiEquipaggiati.length, s: window.__teatro.interni.burattinaioD1.stato() }));
  ok('mani-nude-come-prima', nudo.s.attivo && nudo.run === run0 + 1 && nudo.s.capo.maxHp === 650 && !(await H()).rastrelliera, { run: nudo.run, max: nudo.s.capo.maxHp });

  ok('nessun-errore-teatro', (await errTeatro()) === 0, await p.evaluate(() => (window.ERRORI_TEATRO || []).slice(0, 3)));
  ok('nessun-errore-console', errori.length === 0, errori.slice(0, 5));
  await browser.close();
  const falliti = esiti.filter((e) => !e.ok);
  for (const e of esiti) console.log(`${e.ok ? 'OK  ' : 'FAIL'} ${e.caso}${!e.ok && e.dati !== undefined ? ' ' + JSON.stringify(e.dati) : ''}`);
  console.log(`\n${esiti.length - falliti.length}/${esiti.length} controlli superati`);
  process.exit(falliti.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
