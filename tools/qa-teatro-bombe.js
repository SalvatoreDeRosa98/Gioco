#!/usr/bin/env node
/*
 * tools/qa-teatro-bombe.js — verifica Playwright del miglioramento 1 (gioco/teatro/a1-bombe-chiavi.js):
 * inventario iniziale e HUD, lucchetti su tesoro/Fucina dal piano 2 (foglie, fuori dal percorso per il boss)
 * su 200 semi, porta chiusa senza/con chiave, chiave garantita, bomba col tasto E (miccia, danno, colonne,
 * muro segreto), forziere comune e chiuso, raccolta di bombe/chiavi, drop alla pulizia.
 * Uso: node tools/qa-teatro-bombe.js <file html> [cartella/prefisso screenshot]
 * Esce con 1 se un controllo fallisce. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const pref = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-bombe-');
const foto = (n) => (pref.endsWith('/') ? path.join(pref, `bombe-${n}.png`) : `${pref}${n}.png`);
if (pref.endsWith('/')) fs.mkdirSync(pref, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (nome, cond, info) => esiti.push({ nome, ok: Boolean(cond), info });

  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  await p.evaluate(() => {
    const I = window.__teatro.interni;
    I.statoRun.fase = 'in_gioco';
    I.nuovaRun(false);
    I.statoRun.siparioAttivo = null;
  });
  await p.waitForTimeout(150);

  // 1. inventario iniziale
  const inv = await p.evaluate(() => {
    const I = window.__teatro.interni;
    return { b: I.statoRun.bombe, c: I.statoRun.chiavi, hud: I.testoInventarioA1(), tab: I.BOMBE_CHIAVI_A1.inizio };
  });
  ok('inventario iniziale da tabella', inv.b === inv.tab.bombe && inv.c === inv.tab.chiavi, inv);

  // 2. generatore: lucchetti solo dal piano 2, foglie, fuori dal percorso del boss
  const gen = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const viol = []; const conta = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const piano of [1, 2, 3, 4]) {
      for (let seme = 1; seme <= 200; seme++) {
        const m = I.mappaConSeme(piano, seme * 2654435761);
        if (!m) { viol.push(`p${piano} s${seme} nulla`); continue; }
        const perc = I.percorsoBossA1(m);
        for (const s of m.stanze) {
          if (!s.chiusaA1) {
            if (piano >= 2 && (s.tipo === 'tesoro' || s.tipo === 'fucina')) viol.push(`p${piano} s${seme} ${s.tipo} aperto`);
            continue;
          }
          conta[piano]++;
          if (piano < 2) viol.push(`p1 s${seme} chiusa`);
          if (Object.keys(s.porte).length !== 1) viol.push(`p${piano} s${seme} ${s.id} non foglia`);
          if (perc.has(s.id)) viol.push(`p${piano} s${seme} ${s.id} sul percorso`);
        }
      }
    }
    return { viol: viol.slice(0, 10), nViol: viol.length, conta };
  });
  ok('lucchetti: piano>=2, foglie, mai sul percorso per il boss', gen.nViol === 0, gen);

  // 3. porta chiusa al piano 2
  const porta = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    I.avviaPiano(2, false); R.siparioAttivo = null;
    const tes = R.mappa.stanze.find((s) => s.tipo === 'tesoro');
    const lato = Object.keys(tes.porte)[0];
    const gen = R.mappa.perId.get(tes.porte[lato]);
    const opp = { N: 'S', S: 'N', E: 'W', W: 'E' }[lato];
    I.entraInStanzaA1(gen, null); gen.pulita = true; gen.nemici = [];
    R.chiavi = 0;
    I.entraInStanzaA1(tes, lato);
    const bloccato = R.stanzaCorrente === gen && tes.chiusaA1 === true;
    return { bloccato, lato: opp, gen: gen.id, tes: tes.id };
  });
  await p.waitForTimeout(200);
  await p.screenshot({ path: foto('lucchetto') });
  const porta2 = await p.evaluate((d) => {
    const I = window.__teatro.interni; const R = I.statoRun;
    const tes = R.mappa.perId.get(d.tes);
    R.chiavi = 1;
    I.entraInStanzaA1(tes, d.lato);
    return { dentro: R.stanzaCorrente === tes, chiavi: R.chiavi, aperta: !tes.chiusaA1 };
  }, porta);
  ok('porta chiusa senza chiave: respinge', porta.bloccato, porta);
  ok('porta chiusa con chiave: si apre e consuma 1 chiave', porta2.dentro && porta2.chiavi === 0 && porta2.aperta, porta2);

  // 4. chiave garantita senza chiavi
  const garantita = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    R.chiavi = 0;
    I.avviaPiano(3, false); R.siparioAttivo = null;
    const s = R.mappa.stanze.find((x) => x.chiaveGarantitaA1);
    if (!s) return { marcata: false };
    I.entraInStanzaA1(s, null);
    for (const n of s.nemici) n.hp = 0;
    I.verificaStanzaPulitaA1();
    return { marcata: true, chiaviATerra: s.oggettiATerra.filter((o) => o.tipo === 'chiave').length };
  });
  ok('chiave garantita a inizio piano senza chiavi', garantita.marcata && garantita.chiaviATerra >= 1, garantita);

  // 5. raccolta di bombe e chiavi
  const racc = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const st = R.stanzaCorrente;
    st.oggettiATerra = []; R.bombe = 0; R.chiavi = 0;
    st.oggettiATerra.push({ tipo: 'bomba', valore: 1, sprite: 'bombaA1', x: I.player.x, y: I.player.y });
    st.oggettiATerra.push({ tipo: 'chiave', valore: 1, sprite: 'chiaveA1', x: I.player.x + 2, y: I.player.y });
    return true;
  });
  await p.waitForTimeout(200);
  const racc2 = await p.evaluate(() => ({ b: window.__teatro.interni.statoRun.bombe, c: window.__teatro.interni.statoRun.chiavi }));
  ok('raccolta bomba e chiave', racc && racc2.b === 1 && racc2.c === 1, racc2);

  // 6. bomba col tasto E: nemico, colonna, muro segreto
  const prep = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    I.avviaPiano(1, false); R.siparioAttivo = null;
    const g = R.mappa.stanze.find((s) => s.muroSegreto);
    I.entraInStanzaA1(g, null);
    g.pulita = false;
    const pm = { N: [320, I.ARENA.y1 + 14], S: [320, I.ARENA.y2 - 14], W: [I.ARENA.x1 + 14, 188], E: [I.ARENA.x2 - 14, 188] }[g.muroSegreto.lato];
    I.player.x = pm[0]; I.player.y = pm[1];
    g.nemici = [{ id: 'qa-n', tipo: 'guardia', patternMob: 'guardia', nome: 'qa', x: pm[0] + 30, y: pm[1], hp: 200, maxHp: 200, speed: 0, r: 11, flash: 0, burnTicks: 0, stunTicks: 999999, state: 'idle', stateTimer: 999, shootCd: 9999 }];
    g.ostacoli = [{ tipo: 'colonna', x: pm[0] - 30, y: pm[1], r: 14, w: 26, h: 26 }];
    R.proiettiliNemici = []; R.bombe = 2; R.graziaIngressoC = 0;
    return { lato: g.muroSegreto.lato };
  });
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(120);
  const accesa = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    I.player.x = 320; I.player.y = 188; // si allontana
    return { accese: (R.bombeA1 || []).length, bombe: R.bombe };
  });
  await p.waitForTimeout(500);
  await p.screenshot({ path: foto('bomba') });
  await p.waitForTimeout(1300);
  const dopo = await p.evaluate(() => {
    const st = window.__teatro.interni.statoRun.stanzaCorrente;
    return { hpNemico: st.nemici[0].hp, colonne: st.ostacoli.length, muroAperto: st.muroSegreto.aperto, accese: (window.__teatro.interni.statoRun.bombeA1 || []).length };
  });
  ok('E piazza una bomba e consuma 1 bomba', accesa.accese === 1 && accesa.bombe === 1, accesa);
  ok('esplosione: danno, colonna rotta, muro segreto aperto', dopo.accese === 0 && dopo.hpNemico < 200 && dopo.colonne === 0 && dopo.muroAperto, { prep, dopo });

  // 7. forzieri
  const forz = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const st = R.stanzaCorrente;
    st.nemici = []; st.pulita = true; st.oggettiATerra = []; st.forzieriA1 = [];
    R.chiavi = 0;
    I.player.x = 200; I.player.y = 200;
    I.generaForziere('chiuso', 200, 200);
    I.generaForziere('comune', 440, 220);
    I.generaForziere('chiuso', 320, 240);
    return true;
  });
  await p.waitForTimeout(150);
  const forz1 = await p.evaluate(() => {
    const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
    const chiusoSenza = st.forzieriA1[0].aperto;
    I.statoRun.chiavi = 1;
    return { chiusoSenza };
  });
  await p.waitForTimeout(150);
  const forz2 = await p.evaluate(() => {
    const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
    const r = { chiusoCon: st.forzieriA1[0].aperto, chiavi: I.statoRun.chiavi };
    I.player.x = 440; I.player.y = 220;
    return r;
  });
  await p.waitForTimeout(150);
  const forz3 = await p.evaluate(() => {
    const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
    I.player.x = 300; I.player.y = 150;
    return { comuneAperto: st.forzieriA1[1].aperto, aTerra: st.oggettiATerra.length, piedistallo: Boolean(st.oggettoPiedistallo && !st.oggettoPiedistallo.preso) };
  });
  await p.waitForTimeout(200);
  await p.screenshot({ path: foto('forzieri') });
  ok('forziere chiuso: resta chiuso senza chiave', forz && !forz1.chiusoSenza, forz1);
  ok('forziere chiuso: si apre con 1 chiave', forz2.chiusoCon && forz2.chiavi === 0, forz2);
  ok('forziere comune: si apre toccandolo e dà qualcosa', forz3.comuneAperto && (forz3.aTerra > 0 || forz3.piedistallo), forz3);

  // 8. drop alla pulizia: frequenze su 400 stanze finte
  const drop = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    const vero = R.stanzaCorrente; const conta = { bomba: 0, chiave: 0, comune: 0, chiuso: 0 };
    for (let k = 0; k < 400; k++) {
      const s = { id: 'qa' + k, tipo: 'normale', porte: {}, pulita: false, nemici: [{ hp: 0 }], ostacoli: [], oggettiATerra: [] };
      R.stanzaCorrente = s;
      I.verificaStanzaPulitaA1();
      for (const o of s.oggettiATerra) if (o.tipo === 'bomba' || o.tipo === 'chiave') conta[o.tipo]++;
      for (const f of s.forzieriA1 || []) conta[f.tipo]++;
    }
    R.stanzaCorrente = vero;
    return conta;
  });
  ok('drop alla pulizia: bombe, chiavi e forzieri escono', drop.bomba > 0 && drop.chiave > 0 && drop.comune > 0 && drop.chiuso > 0, drop);

  ok('nessun errore di console', errori.length === 0, errori.slice(0, 5));
  console.log(JSON.stringify(esiti, null, 1));
  await browser.close();
  process.exit(esiti.every((e) => e.ok) ? 0 : 1);
})();
