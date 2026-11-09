#!/usr/bin/env node
/*
 * tools/qa-teatro-generatore.js — verifica del generatore di piani del Teatro (bug autore «il generatore di
 * stanze è sbagliato») su 200 semi per ciascun piano del ciclo, dentro la pagina vera (file://).
 *
 * Uso: node tools/qa-teatro-generatore.js <file html> [semi]
 * Vincoli per ogni mappa: stanze di combattimento = STANZE_COMBATTIMENTO_PER_PIANO; esattamente 1 ingresso,
 * tesoro, fucina, boss, segreta e patto; ≥ MAPPA_PIANO.catenaMin stanze (tutte di combattimento) fra ingresso e
 * boss sul percorso più breve; almeno una stanza di combattimento con 3+ porte (bivio); tutte le stanze della
 * griglia raggiungibili dall'ingresso; porte simmetriche; celle distinte. Stampa la distribuzione in JSON ed
 * esce con 1 se un vincolo salta. Chromium preinstallato nella sessione: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const SEMI = Number(process.argv[3]) || 200;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage();
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  await p.goto('file://' + file);
  await p.waitForTimeout(300);
  const ris = await p.evaluate((SEMI) => {
    const I = window.__teatro.interni;
    const tab = I.STANZE_COMBATTIMENTO_PER_PIANO;
    const out = {};
    const violazioni = [];
    for (const piano of [1, 2, 3, 4]) {
      const dist = { stanzeVisibili: {}, combattimento: {}, catena: {}, viciCiechi: {}, bivi: {}, maxPorte: {} };
      const inc = (o, k) => { o[k] = (o[k] || 0) + 1; };
      let nulle = 0;
      for (let seme = 1; seme <= SEMI; seme++) {
        const m = I.mappaConSeme(piano, seme * 2654435761);
        const v = (msg) => violazioni.push(`piano ${piano} seme ${seme}: ${msg}`);
        if (!m) { nulle++; v('mappa nulla'); continue; }
        const conta = (t) => m.stanze.filter((s) => s.tipo === t).length;
        const nC = conta('normale');
        if (nC !== tab[piano]) v(`combattimento ${nC} invece di ${tab[piano]}`);
        for (const t of ['ingresso', 'tesoro', 'fucina', 'boss', 'segreta', 'patto']) if (conta(t) !== 1) v(`${t} × ${conta(t)}`);
        const griglia = m.stanze.filter((s) => s.tipo !== 'patto');
        const celle = new Set(griglia.map((s) => `${s.cx},${s.cy}`));
        if (celle.size !== griglia.length) v('due stanze nella stessa cella');
        for (const s of m.stanze) for (const [l, id] of Object.entries(s.porte)) {
          const o = m.perId.get(id); const opp = { N: 'S', S: 'N', E: 'W', W: 'E' }[l];
          if (s.tipo !== 'segreta' && (!o || o.porte[opp] !== s.id)) v(`porta ${s.id}.${l} non simmetrica`);
        }
        // BFS dall'ingresso sulle porte (la segreta si apre col muro, il patto dopo il boss)
        const ing = m.stanze.find((s) => s.tipo === 'ingresso');
        const prec = new Map([[ing.id, null]]); const coda = [ing];
        while (coda.length) { const s = coda.shift(); for (const id of Object.values(s.porte)) if (!prec.has(id)) { prec.set(id, s.id); coda.push(m.perId.get(id)); } }
        for (const s of griglia) if (s.tipo !== 'segreta' && !prec.has(s.id)) v(`${s.id} (${s.tipo}) irraggiungibile`);
        const boss = m.stanze.find((s) => s.tipo === 'boss');
        let catena = 0; let soloComb = true;
        for (let id = prec.get(boss.id); id && id !== ing.id; id = prec.get(id)) { catena++; if (m.perId.get(id).tipo !== 'normale') soloComb = false; }
        if (catena < I.MAPPA_PIANO.catenaMin) v(`catena ingresso→boss di ${catena}`);
        if (!soloComb) v('stanza speciale sulla catena del boss');
        const porte = (s) => Object.keys(s.porte).length;
        const bivi = m.stanze.filter((s) => s.tipo === 'normale' && porte(s) >= 3).length;
        if (!bivi) v('nessun bivio: è un corridoio');
        if (Object.keys(boss.porte).length !== 1) v('il boss ha più di una porta');
        inc(dist.stanzeVisibili, griglia.length - 1); inc(dist.combattimento, nC); inc(dist.catena, catena);
        inc(dist.viciCiechi, griglia.filter((s) => s.tipo !== 'segreta' && porte(s) === 1).length);
        inc(dist.bivi, bivi); inc(dist.maxPorte, Math.max(...griglia.map(porte)));
      }
      out[piano] = { combattimentoAtteso: tab[piano], nulle, ...dist };
    }
    return { out, violazioni };
  }, SEMI);
  await browser.close();
  console.log(JSON.stringify({ file: path.relative(RADICE, file), semi: SEMI, piani: ris.out, violazioni: ris.violazioni.slice(0, 20), nViolazioni: ris.violazioni.length, errori }, null, 1));
  process.exit(ris.violazioni.length || errori.length ? 1 : 0);
})();
