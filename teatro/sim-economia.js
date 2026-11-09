#!/usr/bin/env node
/**
 * Simulazione dell'economia del Piano 1 del Teatro delle Marionette (roadmap «Novità nel Teatro», passo T3).
 *
 * Obiettivo dell'autore: 5-8 monete in media al Piano 1.
 *
 * I NUMERI non sono copiati: si leggono dal blocco `const ECONOMIA_T3 = {...}` di gioco/teatro_marionette.html.
 * La STRUTTURA (quante stanze, quanti nemici, probabilità dei campioni, chi lascia monete e quando) riproduce
 * generaMappaPiano / popolaStanzaIsaac / danneggiaNemico / verificaStanzaPulita / spawnaMonetaATerra del file:
 *   - Piano 1: ingresso, STANZE_COMBATTIMENTO_PER_PIANO[1] stanze normali (letto dal file), tesoro, fucina,
 *     boss + 1 segreta + patto. (Fino al bug autore del generatore le normali erano 1.)
 *   - Stanza normale: 3 + floor(rng*2) nemici; ognuno è campione al 20%, e il campione è dorato al 33%.
 *     Il dorato morendo lascia 1 moneta (da 3 con prob3) e una seconda da 1 con probExtra.
 *   - Pulizia della stanza normale: una moneta da 1 con probMoneta.
 *   - Boss: due monete (1 e, con prob3, 3); la stanza del boss non dà il premio di pulizia.
 *   - Segreta: 4 Predoni d'Oro (stesso drop del dorato) + premio di pulizia da valoreSegreta.
 *   - Al Piano 1 ogni moneta compare con probMonetaAltre (probMonetaSegreta nella segreta).
 * Ingresso, tesoro, fucina e patto non danno monete. Le monete spese non contano: si misura quanto si raccoglie.
 * La segreta si apre con [E] in una stanza pulita che ha la crepa, quindi la media di riferimento la comprende.
 *
 * Uso: node gioco/teatro/sim-economia.js [numeroPiani=1000]
 * Esce con codice 1 se la media (piano completo, segreta compresa) è fuori da [5, 8].
 */
'use strict';
const fs = require('fs');
const path = require('path');

const OBIETTIVO = { min: 5, max: 8 };
const FILE_GIOCO = path.join(__dirname, '..', 'teatro_marionette.html');

/** Legge ECONOMIA_T3 dal file del gioco (una sola fonte per i numeri). */
function leggiEconomia(file) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/const ECONOMIA_T3 = (\{[\s\S]*?\n {2}\});/);
  if (!m) throw new Error(`ECONOMIA_T3 non trovato in ${file}`);
  return Function(`"use strict"; return (${m[1]});`)();
}

/** Stanze di combattimento del Piano 1 dalla tabella STANZE_COMBATTIMENTO_PER_PIANO del gioco. */
const STANZE_PIANO1 = (() => {
  const m = fs.readFileSync(FILE_GIOCO, 'utf8').match(/const STANZE_COMBATTIMENTO_PER_PIANO = \{\s*1:\s*(\d+)/);
  if (!m) throw new Error('STANZE_COMBATTIMENTO_PER_PIANO non trovato');
  return Number(m[1]);
})();

/** Stesso generatore del gioco (rng() di teatro_marionette.html), con seme esplicito per il determinismo. */
function creaRng(seme) {
  let s = seme | 0;
  return function rng() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simula un Piano 1 completo. Ritorna { normale, boss, segreta } in monete raccolte. */
function simulaPiano1(E, rng) {
  const conta = { normale: 0, boss: 0, segreta: 0 };
  const moneta = (dove, valore) => {
    const p = dove === 'segreta' ? E.piano1.probMonetaSegreta : E.piano1.probMonetaAltre;
    if (rng() > p) return;
    conta[dove] += valore;
  };
  const dropDorato = (dove) => {
    moneta(dove, rng() < E.dorato.prob3 ? 3 : 1);
    if (rng() < E.dorato.probExtra) moneta(dove, 1);
  };

  // Stanze di combattimento del Piano 1: STANZE_COMBATTIMENTO_PER_PIANO[1] letta dal file del gioco
  const nNormali = STANZE_PIANO1;
  for (let r = 0; r < nNormali; r++) {
    const nNem = 3 + Math.floor(rng() * 2) + Math.min(3, Math.floor(1 * 0.5));
    for (let i = 0; i < nNem; i++) {
      rng(); // tipo del nemico
      let champion = null;
      if (rng() < 0.20) {
        const rCh = rng();
        champion = rCh < 0.34 ? 'cremisi' : rCh < 0.67 ? 'dorato' : 'elettrico';
      }
      if (champion === 'dorato') dropDorato('normale');
    }
    if (rng() < E.pulizia.probMoneta) moneta('normale', 1);
  }

  // Boss
  moneta('boss', 1);
  moneta('boss', rng() < E.boss.prob3 ? 3 : 1);

  // Segreta: 4 + min(2, floor(1 * 0.5)) Predoni d'Oro
  const nPredoni = 4 + Math.min(2, Math.floor(1 * 0.5));
  for (let i = 0; i < nPredoni; i++) dropDorato('segreta');
  moneta('segreta', E.pulizia.valoreSegreta);

  return conta;
}

function main() {
  const nPiani = Math.max(1, parseInt(process.argv[2], 10) || 1000);
  const E = leggiEconomia(FILE_GIOCO);
  const totali = [];
  const senzaSegreta = [];
  for (let k = 0; k < nPiani; k++) {
    const c = simulaPiano1(E, creaRng(1000 + k));
    totali.push(c.normale + c.boss + c.segreta);
    senzaSegreta.push(c.normale + c.boss);
  }
  const media = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const ord = totali.slice().sort((a, b) => a - b);
  const perc = (q) => ord[Math.min(ord.length - 1, Math.floor(q * ord.length))];
  const m = media(totali);
  console.log(`Economia T3 — Piano 1, ${nPiani} piani simulati (semi 1000..${1000 + nPiani - 1})`);
  console.log(`  prezzi: cuore ${E.prezzi.cuore}, consumabile ${E.prezzi.consumabile}, base ${E.prezzi.base}, forte ${E.prezzi.forte}`);
  console.log(`  media monete, piano completo (segreta compresa): ${m.toFixed(2)}  [obiettivo ${OBIETTIVO.min}-${OBIETTIVO.max}]`);
  console.log(`  media monete senza la segreta: ${media(senzaSegreta).toFixed(2)}`);
  console.log(`  distribuzione: min ${ord[0]}, 10° perc ${perc(0.1)}, mediana ${perc(0.5)}, 90° perc ${perc(0.9)}, max ${ord[ord.length - 1]}`);
  const ok = m >= OBIETTIVO.min && m <= OBIETTIVO.max;
  console.log(ok ? '  OK: la media sta nell\'intervallo.' : '  FUORI INTERVALLO: ritarare ECONOMIA_T3.');
  process.exitCode = ok ? 0 : 1;
}

if (require.main === module) main();
module.exports = { leggiEconomia, creaRng, simulaPiano1 };
