#!/usr/bin/env node
/*
 * tools/sim-bilancio-teatro.js — simulazione dell'economia del Teatro (miglioramento 7, parte B).
 * NON è un bot che gioca: nel browser (Playwright, file://) usa il codice VERO del gioco per generare i piani
 * (generaMappaPiano con lucchetti A1, stanze speciali A3, Fucina A2) e per i drop (danneggiaNemico,
 * verificaStanzaPulita avvolta da T3/A1/A2, spawnaMonetaATerra col filtro del piano 1, apriForziereA1):
 * per ogni piano si «abbattono» d'ufficio tutti i nemici delle stanze di combattimento, del boss e della
 * segreta e si conta cosa cade. Le stanze speciali (sacrificio, rovi, bisca) si valutano in valore atteso
 * dalle loro tabelle (STANZE_SPECIALI_A3) con una politica dichiarata sotto.
 *
 * Politica della chiave: le chiavi si portano da un piano all'altro; a ogni piano si aprono prima i
 * lucchetti (tesoro, poi Fucina), poi i forzieri chiusi con le chiavi avanzate. Si raccoglie tutto.
 *
 * Uso: node tools/sim-bilancio-teatro.js [file html] [run=400] [piani=4] [--json file]
 * Esce con 1 se la media delle monete al piano 1 è fuori da [5, 8].
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const iJson = argv.indexOf('--json');
const fileJson = iJson >= 0 ? argv.splice(iJson, 2)[1] : null;
const file = path.resolve(RADICE, argv[0] || 'gioco/teatro_marionette.html');
const NRUN = Math.max(1, parseInt(argv[1], 10) || 400);
const NPIANI = Math.max(1, parseInt(argv[2], 10) || 4);
const OBIETTIVO_P1 = { min: 5, max: 8 };

/** Nel browser: simula NRUN run di NPIANI piani con il codice del gioco. */
function simulaNelGioco({ nRun, nPiani }) {
  const I = window.__teatro.interni;
  const R = statoRun;
  const P = player;
  const out = [];
  R.fase = 'in_gioco';
  const salvaBanner = mostraBanner;
  for (let k = 0; k < nRun; k++) {
    const run = { piani: [] };
    let chiavi = BOMBE_CHIAVI_A1.inizio.chiavi;
    let bombe = BOMBE_CHIAVI_A1.inizio.bombe;
    R.numeroRun = 100000 + k;
    for (let p = 1; p <= nPiani; p++) {
      const seme = (k * 7919 + p * 104729 + 12345) >>> 0;
      R.piano = p;
      R.chiavi = chiavi; R.bombe = bombe;
      const m = I.mappaConSeme(p, seme);
      R.mappa = m;
      runSeed = (seme ^ 0x5bd1e995) >>> 0;
      const pp = { piano: p, monete: { normale: 0, boss: 0, segreta: 0, forzieri: 0, rovi: 0 }, bombe: 0, chiavi: 0,
        cure: 0, consumabili: 0, forzieriComuni: 0, forzieriChiusi: 0, forzieriChiusiAperti: 0, lucchetti: 0, lucchettiAperti: 0,
        chiaviInizio: chiavi, speciali: {}, rovi: null, chiaveGarantita: false };
      pp.lucchetti = m.stanze.filter((s) => s.chiusaA1).length;
      garantisciChiaveA1(m);
      pp.chiaveGarantita = m.stanze.some((s) => s.chiaveGarantitaA1);
      for (const s of m.stanze) if (['sfida', 'sacrificio', 'maledetta', 'bisca'].includes(s.tipo)) pp.speciali[s.tipo] = (pp.speciali[s.tipo] || 0) + 1;
      const conta = (s, dove) => {
        for (const o of s.oggettiATerra) {
          if (o.contatoSim) continue;
          o.contatoSim = true;
          if (o.tipo === 'moneta') pp.monete[dove] += o.valore || 1;
          else if (o.tipo === 'bomba') pp.bombe += o.valore || 1;
          else if (o.tipo === 'chiave') pp.chiavi += o.valore || 1;
          else if (o.tipo === 'cura') pp.cure += o.valore || 1;
          else if (o.tipo === 'consumabileA2') pp.consumabili++;
        }
      };
      const chiusi = [];
      const ordine = m.stanze.filter((s) => s.tipo === 'normale')
        .concat(m.stanze.filter((s) => s.tipo === 'segreta' || s.tipo === 'boss' || (s.tipo === 'maledetta' && s.nemici.length)));
      for (const s of ordine) {
        R.stanzaCorrente = s;
        P.invuln = 1e9; R.maxHpHalf = 6; R.hpHalf = 5; // ferito di mezza Maschera: le cure possono cadere
        s.pulita = false;
        for (let giro = 0; giro < 6 && s.nemici.some((n) => n.hp > 0); giro++) {
          for (const n of s.nemici.slice()) if (n.hp > 0) { n.airZ = 0; n.maskOpen = true; danneggiaNemico(n, 1e9, 0, 0); }
        }
        verificaStanzaPulita();
        R.proiettiliNemici = [];
        const dove = s.tipo === 'normale' ? 'normale' : s.tipo === 'maledetta' ? 'rovi' : s.tipo;
        conta(s, dove);
        for (const f of s.forzieriA1 || []) {
          if (f.tipo === 'comune') { pp.forzieriComuni++; apriForziereA1(s, f); conta(s, 'forzieri'); } else { pp.forzieriChiusi++; chiusi.push([s, f]); }
        }
      }
      // rovi con monete già a terra (contenuto 'monete')
      for (const s of m.stanze.filter((x) => x.tipo === 'maledetta')) { conta(s, 'rovi'); pp.rovi = s.maledettaA3 && s.maledettaA3.contenuto; }
      // chiavi: lucchetti prima, poi forzieri chiusi (il cui contenuto può dare altre chiavi)
      chiavi += pp.chiavi;
      pp.lucchettiAperti = Math.min(pp.lucchetti, chiavi);
      chiavi -= pp.lucchettiAperti;
      for (const [s, f] of chiusi) {
        if (chiavi <= 0) break;
        chiavi--; pp.forzieriChiusiAperti++;
        const primaC = pp.chiavi;
        apriForziereA1(s, f);
        conta(s, 'forzieri');
        chiavi += pp.chiavi - primaC;
      }
      bombe += pp.bombe;
      pp.chiaviFine = chiavi;
      run.piani.push(pp);
    }
    out.push(run);
  }
  mostraBanner = salvaBanner;
  return {
    runs: out,
    tabelle: { ECONOMIA_T3, BOMBE_CHIAVI_A1, CONS_A2: { drop: CONS_A2.drop }, STANZE_SPECIALI_A3,
      nCarte: CONS_A2_CARTE.length, carteMonete: CONS_A2_CARTE.filter((c) => c.monete).map((c) => ({ id: c.id, monete: c.monete })),
      stanzeCombattimento: STANZE_COMBATTIMENTO_PER_PIANO },
  };
}

// ---------------------------------------------------------------------------
// Valori attesi delle stanze speciali (dalle tabelle; politica dichiarata)
// ---------------------------------------------------------------------------
const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const norm = (pesi) => { const t = Object.values(pesi).reduce((a, b) => a + b, 0) || 1; return (k) => (pesi[k] || 0) / t; };
const mediaInt = (a, b) => (a + b) / 2;

/** Ceppo: n sacrifici (½ Maschera l'uno). Ritorna sangue, monete, mezze Maschere di cura e oggetti attesi. */
function evSacrificio(T, n) {
  const S = T.sacrificio;
  let monete = 0, cura = 0, oggetti = 0;
  for (let i = 1; i <= n; i++) {
    const q = norm(S.premi[Math.min(i, S.premi.length) - 1]);
    monete += q('monete') * mediaInt(S.moneteMin, S.moneteMax);
    cura += q('cuore') * S.cuoreHalf;
    oggetti += q('oggetto');
  }
  return { sangueHalf: n * S.costoHalf, monete, cura, oggetti, nettoHalf: n * S.costoHalf - cura };
}

/** Stanza dei Rovi: entrata + uscita (2 passaggi), contenuto pesato. */
function evRovi(T) {
  const M = T.maledetta;
  const q = norm(M.contenuto);
  const C = T.__forziereComune;
  const monete = q('monete') * mediaInt(M.moneteMin, M.moneteMax) + q('nemici') * M.moneteNemici + q('forziere') * (C ? C.monete : 0);
  return { sangueHalf: 2 * M.costoHalf, monete, oggetti: q('oggetto') + q('nemici') * M.probOggettoNemici };
}

/** Bisca: valore atteso di una giocata al lotto e della Cartomante pagata fino al dono. */
function evBisca(T) {
  const B = T.bisca;
  const q = norm(B.premi);
  const giocata = { costo: B.costo, monete: q('monete') * mediaInt(B.moneteMin, B.moneteMax), cura: q('mezzaMaschera') * 1 + q('cuore') * 2, oggetti: q('oggetto') };
  const C = B.cartomante;
  let pNon = 1, costoAtteso = 0;
  for (let g = 1; g <= 40 && pNon > 1e-6; g++) { costoAtteso += pNon * C.costo; pNon *= 1 - Math.min(1, C.probBase + (g - 1) * C.probPerMoneta); }
  const qc = norm(C.premi);
  const cartomante = { costoAtteso, monete: qc('monete') * C.moneteDono, cura: qc('cuore') * 2, oggetti: qc('oggetto') };
  return { giocata, giocateMax: B.giocateMax, cartomante };
}

/** Valore in monete di un esito (per confrontare con i prezzi della Fucina). */
function valoreMonete(E, { monete = 0, cura = 0, oggetti = 0 }) {
  return monete + (cura / 2) * E.prezzi.cuore + oggetti * E.prezzi.base;
}

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage();
  const errori = [];
  p.on('pageerror', (e) => errori.push(String(e)));
  await p.goto('file://' + file);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await p.waitForTimeout(400);
  const t0 = Date.now();
  const ris = await p.evaluate(simulaNelGioco, { nRun: NRUN, nPiani: NPIANI });
  await browser.close();
  const { runs, tabelle } = ris;
  const E = tabelle.ECONOMIA_T3;
  const T = tabelle.STANZE_SPECIALI_A3;
  const A1 = tabelle.BOMBE_CHIAVI_A1;
  // forziere comune in valore atteso (per i rovi)
  const cc = A1.contenuto.comune; const qc = norm(cc.pesi); const pezzi = mediaInt(cc.pezziMin, cc.pezziMax);
  T.__forziereComune = { monete: pezzi * qc('moneta') };

  const perPiano = [];
  for (let k = 0; k < NPIANI; k++) {
    const L = runs.map((r) => r.piani[k]);
    const tot = L.map((x) => x.monete.normale + x.monete.boss + x.monete.segreta + x.monete.forzieri);
    const ord = tot.slice().sort((a, b) => a - b);
    const q = (f) => ord[Math.min(ord.length - 1, Math.floor(f * ord.length))];
    const conLucchetti = L.filter((x) => x.lucchetti > 0);
    perPiano.push({
      piano: k + 1,
      monete: { media: media(tot), p10: q(0.1), mediana: q(0.5), p90: q(0.9), min: ord[0], max: ord[ord.length - 1],
        normale: media(L.map((x) => x.monete.normale)), boss: media(L.map((x) => x.monete.boss)), segreta: media(L.map((x) => x.monete.segreta)),
        forzieri: media(L.map((x) => x.monete.forzieri)), rovi: media(L.map((x) => x.monete.rovi)), senzaSegreta: media(L.map((x) => x.monete.normale + x.monete.boss + x.monete.forzieri)) },
      bombe: media(L.map((x) => x.bombe)), chiavi: media(L.map((x) => x.chiavi)), cure: media(L.map((x) => x.cure)),
      consumabili: media(L.map((x) => x.consumabili)),
      forzieriComuni: media(L.map((x) => x.forzieriComuni)), forzieriChiusi: media(L.map((x) => x.forzieriChiusi)),
      forzieriChiusiAperti: media(L.map((x) => x.forzieriChiusiAperti)),
      lucchetti: media(L.map((x) => x.lucchetti)),
      chiaviInizio: media(L.map((x) => x.chiaviInizio)),
      pianiConLucchetti: conLucchetti.length / L.length,
      pianiSenzaChiave: conLucchetti.filter((x) => x.lucchettiAperti === 0).length / L.length,
      pianiLucchettoRestaChiuso: conLucchetti.filter((x) => x.lucchettiAperti < x.lucchetti).length / L.length,
      chiaveGarantita: L.filter((x) => x.chiaveGarantita).length / L.length,
      speciali: ['sfida', 'sacrificio', 'maledetta', 'bisca'].reduce((o, t) => { o[t] = L.filter((x) => x.speciali[t]).length / L.length; return o; }, {}),
    });
  }
  const runSenzaChiave = runs.filter((r) => r.piani.some((x) => x.lucchetti > 0 && x.lucchettiAperti === 0)).length / runs.length;
  const runLucchettoChiuso = runs.filter((r) => r.piani.some((x) => x.lucchettiAperti < x.lucchetti)).length / runs.length;
  const sac = [1, 2, 3, 4, 5, 6].map((n) => ({ n, ...evSacrificio(T, n) }));
  const rovi = evRovi(T);
  const bisca = evBisca(T);
  const pC = 1 - tabelle.CONS_A2.drop.probAmpolla;
  const moneteCarta = tabelle.carteMonete.reduce((a, c) => a + c.monete, 0) / tabelle.nCarte; // ~ (scorte dà monete solo senza spazio)
  const report = {
    file: path.relative(RADICE, file), run: NRUN, piani: NPIANI, ms: Date.now() - t0, errori,
    prezzi: E.prezzi, perPiano, runSenzaChiave, runLucchettoChiuso,
    speciali: {
      sacrificio: sac.map((s) => ({ ...s, valore: valoreMonete(E, s) })),
      rovi: { ...rovi, valore: valoreMonete(E, rovi) },
      bisca: {
        giocata: { ...bisca.giocata, valore: valoreMonete(E, bisca.giocata), netto: valoreMonete(E, bisca.giocata) - bisca.giocata.costo },
        banco8: { costo: bisca.giocata.costo * bisca.giocateMax, valore: valoreMonete(E, bisca.giocata) * bisca.giocateMax, moneteRese: bisca.giocata.monete * bisca.giocateMax },
        cartomante: { ...bisca.cartomante, valore: valoreMonete(E, bisca.cartomante) },
      },
      monetePerConsumabile: pC * moneteCarta,
    },
  };
  if (fileJson) fs.writeFileSync(path.resolve(fileJson), JSON.stringify(report, null, 1));
  const f = (x, d = 2) => Number(x).toFixed(d);
  console.log(`Simulazione del Teatro: ${NRUN} run × ${NPIANI} piani (codice del gioco, ${report.ms} ms)`);
  console.log(`  prezzi Fucina: cuore ${E.prezzi.cuore}, consumabile ${E.prezzi.consumabile}, base ${E.prezzi.base}, forte ${E.prezzi.forte}`);
  console.log('  piano | monete media (p10-mediana-p90) [norm/boss/segr/forz] | bombe | chiavi | forz c/ch | cons | lucch | chiavi a inizio | senza chiave | lucch. chiuso');
  for (const x of perPiano) {
    console.log(`  ${x.piano}     | ${f(x.monete.media)} (${x.monete.p10}-${x.monete.mediana}-${x.monete.p90}) [${f(x.monete.normale, 1)}/${f(x.monete.boss, 1)}/${f(x.monete.segreta, 1)}/${f(x.monete.forzieri, 1)}]`
      + ` | ${f(x.bombe)} | ${f(x.chiavi)} | ${f(x.forzieriComuni)}/${f(x.forzieriChiusi)} | ${f(x.consumabili)} | ${f(x.lucchetti)} | ${f(x.chiaviInizio)} | ${f(x.pianiSenzaChiave * 100, 1)}% | ${f(x.pianiLucchettoRestaChiuso * 100, 1)}%`);
  }
  console.log(`  run con un piano a lucchetti e nessuna chiave: ${f(runSenzaChiave * 100, 1)}%; run con almeno un lucchetto rimasto chiuso: ${f(runLucchettoChiuso * 100, 1)}%`);
  console.log(`  stanze speciali per piano (presenza): ${perPiano.map((x) => `P${x.piano} ${Object.entries(x.speciali).map(([t, v]) => `${t} ${f(v * 100, 0)}%`).join(' ')}`).join(' | ')}`);
  console.log(`  ceppo: ${report.speciali.sacrificio.map((s) => `${s.n}×: −${s.sangueHalf}½ +${f(s.cura, 2)}½ ${f(s.monete, 1)}🪙 ${f(s.oggetti, 2)}ogg ≈ ${f(s.valore, 1)}🪙`).join(' | ')}`);
  console.log(`  rovi: −${rovi.sangueHalf}½, ${f(rovi.monete, 2)}🪙, ${f(rovi.oggetti, 2)} oggetti ≈ ${f(report.speciali.rovi.valore, 1)}🪙`);
  const g = report.speciali.bisca.giocata;
  console.log(`  bisca: giocata costa ${g.costo}🪙, rende ${f(g.monete, 2)}🪙 + ${f(g.cura, 2)}½ + ${f(g.oggetti, 3)} ogg ≈ ${f(g.valore, 2)}🪙 (netto ${f(g.netto, 2)}); 8 giocate: −${report.speciali.bisca.banco8.costo}🪙 → ${f(report.speciali.bisca.banco8.moneteRese, 1)}🪙 rese`);
  const c = report.speciali.bisca.cartomante;
  console.log(`  cartomante: costo atteso ${f(c.costoAtteso, 2)}🪙 → ${f(c.monete, 2)}🪙 + ${f(c.cura, 2)}½ + ${f(c.oggetti, 2)} ogg ≈ ${f(c.valore, 2)}🪙`);
  const m1 = perPiano[0].monete.media;
  const ok = m1 >= OBIETTIVO_P1.min && m1 <= OBIETTIVO_P1.max && !errori.length;
  console.log(ok ? `  OK: piano 1 = ${f(m1)} monete in [${OBIETTIVO_P1.min}, ${OBIETTIVO_P1.max}]` : `  FUORI: piano 1 = ${f(m1)} monete (obiettivo ${OBIETTIVO_P1.min}-${OBIETTIVO_P1.max})${errori.length ? ` · errori: ${errori[0]}` : ''}`);
  process.exitCode = ok ? 0 : 1;
})();
