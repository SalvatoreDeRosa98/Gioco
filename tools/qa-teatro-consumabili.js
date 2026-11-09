#!/usr/bin/env node
/*
 * tools/qa-teatro-consumabili.js — verifica Playwright dei consumabili (miglioramento 2, gioco/teatro/a2-consumabili.js).
 * Uso: node tools/qa-teatro-consumabili.js [file html] [prefisso screenshot]
 * Osserva: errori di console; tabelle (≥ 12 ampolle, ≥ 10 carte, sprite presenti); corrispondenza colore → effetto
 * diversa fra semi e stabile con lo stesso seme; slot e tasto F; scambio con lo slot pieno (il vecchio resta a
 * terra e non si riprende subito); identificazione (cartiglio, flag oggettiConosciuti, anche dopo il reload per
 * le carte); effetti campione; drop alla pulizia; slot della Fucina al prezzo «consumabile»; pagina del Diario.
 * Stampa osservazioni in JSON, nessun verdetto. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-consumabili');
fs.mkdirSync(path.dirname(prefisso + '-x.png'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const oss = {};
  const avvia = () => p.evaluate(() => {
    const I = window.__teatro.interni;
    I.statoRun.fase = 'in_gioco';
    I.nuovaRun(false);
    I.statoRun.siparioAttivo = null;
    const st = I.statoRun.stanzaCorrente;
    st.nemici = [];
    I.statoRun.proiettiliNemici = [];
  });

  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  await avvia();
  await p.waitForTimeout(150);

  oss.tabelle = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const pol = {};
    for (const e of I.CONS_A2_AMPOLLE) pol[e.polarita] = (pol[e.polarita] || 0) + 1;
    const sprite = [...I.CONS_A2_COLORI.map((c) => `ampollaA2_${c.id}`), ...I.CONS_A2_CARTE.map((c) => `cartaA2_${c.seme}`)];
    return { ampolle: I.CONS_A2_AMPOLLE.length, colori: I.CONS_A2_COLORI.length, carte: I.CONS_A2_CARTE.length, polarita: pol,
      spriteMancanti: sprite.filter((k) => !I.SPRITE_OGGETTI[k]), tasto: I.CONS_A2.tasto };
  });

  oss.mappaColori = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const a = JSON.stringify(I.statoA2(12345).mappa);
    const b = JSON.stringify(I.statoA2(12345).mappa);
    const c = JSON.stringify(I.statoA2(999).mappa);
    const effUnici = new Set(Object.values(I.statoA2(777).mappa)).size;
    return { stessoSemeUguale: a === b, semeDiversoDiverso: a !== c, effettiDistintiPerRun: effUnici };
  });

  // raccolta, scambio con lo slot pieno, blocco del vecchio
  oss.scambio = await p.evaluate(() => {
    const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
    I.statoA2(42);
    I.player.x = 200; I.player.y = 200;
    I.lasciaConsumabileA2(st, I.creaConsumabileA2('carta', 'tre_denari'), 200, 200);
    return null;
  });
  await p.waitForTimeout(100);
  oss.scambio = await p.evaluate(() => {
    const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
    const primo = I.statoA2().slot && I.statoA2().slot.id;
    I.lasciaConsumabileA2(st, I.creaConsumabileA2('ampolla', 'rossa'), 200, 200);
    return { primo };
  }).then(async (r) => {
    await p.waitForTimeout(150);
    return p.evaluate((r) => {
      const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
      const aTerra = st.oggettiATerra.filter((o) => o.tipo === 'consumabileA2').map((o) => ({ id: o.cons.id || o.cons.colore, blocco: o.bloccoA2 }));
      return { ...r, slotDopo: I.statoA2().slot.colore, aTerra };
    }, r);
  });
  await p.screenshot({ path: foto('01-slot-hud-scambio') });

  // uso col tasto F: identificazione dell'ampolla, cartiglio, flag nello slot
  oss.usoAmpolla = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const c = I.statoA2().slot;
    return { primaNoto: I.notoA2(c), effetto: I.effettoA2(c).id, desc: I.descA2(c) };
  });
  await p.keyboard.press('KeyF');
  await p.waitForTimeout(250);
  Object.assign(oss.usoAmpolla, await p.evaluate(() => {
    const I = window.__teatro.interni;
    const c = I.creaConsumabileA2('ampolla', 'rossa');
    return { slotVuoto: I.statoA2().slot === null, dopoNoto: I.notoA2(c), descDopo: I.descA2(c),
      cartiglio: I.statoRun.cartiglioD && I.statoRun.cartiglioD.item.nome,
      flag: I.conosciutiA2().filter((x) => x.startsWith('a2:')) };
  }));
  await p.screenshot({ path: foto('02-identificata-cartiglio') });

  // effetti campione: Elisir del Gigante, Capogiro, Re di Spade, Tre di Denari, Fante di Denari (senza a1)
  oss.effetti = await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun; const st = S.stanzaCorrente;
    const usa = (c) => { I.statoA2().slot = c; return I.usaConsumabileA2(); };
    const colore = (eff) => Object.keys(I.statoA2().mappa).find((k) => I.statoA2().mappa[k] === eff);
    const out = {};
    const forza = (eff) => { const k = colore(eff) || 'rossa'; I.statoA2().mappa[k] = eff; return k; };
    const dmg0 = S.dmg;
    usa(I.creaConsumabileA2('ampolla', forza('gigante')));
    out.gigante = { scala: I.player.scalaA2, dmgPrima: dmg0, dmgDopo: S.dmg, effetti: I.statoA2().effetti.length };
    usa(I.creaConsumabileA2('ampolla', forza('capogiro')));
    out.capogiroTick = I.statoA2().confusione;
    const m0 = S.monete;
    usa(I.creaConsumabileA2('carta', 'tre_denari'));
    out.treDenari = S.monete - m0;
    const m1 = S.monete;
    usa(I.creaConsumabileA2('carta', 'fante_denari'));
    out.fanteDenariMonete = S.monete - m1;
    st.nemici = [{ hp: 30, maxHp: 30, x: 400, y: 200, r: 10, vx: 0, vy: 0, tipo: 'gatto', nome: 'prova' }];
    usa(I.creaConsumabileA2('carta', 're_spade'));
    out.reSpadeHp = st.nemici[0].hp;
    st.nemici = [];
    S.hpHalf = 2;
    usa(I.creaConsumabileA2('carta', 'asso_coppe'));
    out.assoCoppe = { hp: S.hpHalf, max: S.maxHpHalf };
    const r0 = S.stanzaCorrente.id;
    usa(I.creaConsumabileA2('carta', 'cavallo_bastoni'));
    out.teletrasporto = { da: r0, a: S.stanzaCorrente.id };
    usa(I.creaConsumabileA2('carta', 're_coppe'));
    out.mappaRivelata = I.statoA2().rivelata === S.mappa;
    return out;
  });
  await p.waitForTimeout(150);
  // il Capogiro inverte A/D: premendo D si va a sinistra
  oss.capogiro = await p.evaluate(() => {
    const I = window.__teatro.interni; I.statoRun.siparioAttivo = null; I.statoRun.stanzaCorrente.nemici = [];
    I.player.x = 320; I.player.y = 200; I.statoA2().confusione = 120;
    return I.player.x;
  });
  await p.keyboard.down('KeyD'); await p.waitForTimeout(300); await p.keyboard.up('KeyD');
  oss.capogiro = { xPrima: oss.capogiro, xDopo: await p.evaluate(() => window.__teatro.interni.player.x) };
  await p.screenshot({ path: foto('03-gigante-mappa-rivelata') });

  // drop alla pulizia: 60 stanze finte ripulite con danneggiaNemico (globale, chiama verificaStanzaPulita avvolta)
  oss.drop = await p.evaluate(() => {
    // verificaStanzaPulita non è in interni: la si raggiunge con danneggiaNemico (globale avvolta)
    const I = window.__teatro.interni; const S = I.statoRun;
    let cadute = 0, prove = 0;
    for (let k = 0; k < 60; k++) {
      const s = { ...S.stanzaCorrente, id: 'qa' + k, tipo: 'normale', pulita: false, oggettiATerra: [], oggettoPiedistallo: null, ricompensaOggetto: null,
        nemici: [{ hp: 1, maxHp: 1, x: 500, y: 200, r: 8, vx: 0, vy: 0, tipo: 'gatto', nome: 'x' }] };
      S.stanzaCorrente = s;
      window.__teatroInterno.danneggiaNemico(s.nemici[0], 99, 0, 0);
      prove++;
      if (s.oggettiATerra.some((o) => o.tipo === 'consumabileA2')) cadute++;
    }
    return { prove, cadute, probAttesa: I.CONS_A2.drop.probPulizia };
  });

  // Fucina: quinto slot al prezzo consumabile
  oss.fucina = await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun;
    const f = S.mappa.stanze.find((s) => s.tipo === 'fucina');
    if (!f) return null;
    I.entraInStanza(f, null);
    const sl = f.slotFucina.find((x) => x.tipo === 'consumabileA2');
    S.monete = 10; I.statoA2().slot = null;
    I.player.x = sl.x; I.player.y = sl.y + 10;
    S.bannerTimer = 0; S.cartiglioD = null;
    return true;
  });
  await p.waitForTimeout(150);
  await p.screenshot({ path: foto('04-fucina') });
  oss.fucina = await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun;
    const f = S.stanzaCorrente;
    const sl = f.slotFucina.find((x) => x.tipo === 'consumabileA2');
    if (!sl) return null;
    I.interagisciStanza();
    return { slot: f.slotFucina.map((x) => ({ tipo: x.tipo, x: x.x, prezzo: x.prezzo })), prezzoEconomia: I.ECONOMIA_T3.prezzi.consumabile,
      comprato: sl.comprato, monete: S.monete, slotDopo: Boolean(I.statoA2().slot) };
  });

  // Diario: ESC, O, C
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  await p.keyboard.press('KeyO'); await p.waitForTimeout(100);
  await p.keyboard.press('KeyC'); await p.waitForTimeout(200);
  oss.diario = await p.evaluate(() => Boolean(window.__teatro.interni.statoRun.diarioD && window.__teatro.interni.statoRun.diarioD.paginaA2));
  await p.screenshot({ path: foto('05-diario-consumabili') });
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);

  // nuova run: le ampolle tornano sconosciute, le carte restano note (anche dopo il reload)
  await p.reload();
  await p.waitForTimeout(500);
  await avvia();
  oss.dopoReload = await p.evaluate(() => {
    const I = window.__teatro.interni;
    return { cartaNota: I.notoA2(I.creaConsumabileA2('carta', 'tre_denari')),
      ampolleNoteInRun: Object.keys(I.statoA2().notiRun).length, flag: I.conosciutiA2().filter((x) => x.startsWith('a2:')).length };
  });

  oss.errori = errori;
  console.log(JSON.stringify(oss, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
