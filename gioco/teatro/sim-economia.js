#!/usr/bin/env node
/**
 * Simulazione dell'economia del Piano 1 del Teatro delle Marionette (roadmap «Novità nel Teatro», passo T3).
 *
 * Obiettivo dell'autore: 5-8 monete in media al Piano 1.
 *
 * (bilancio 7) Il vecchio modello in Node riscriveva a mano la struttura del gioco ed era rimasto indietro:
 * leggeva ECONOMIA_T3 dall'HTML (ora sta in gioco/teatro/00-config.js), contava 4 Predoni d'Oro nella segreta
 * (che oggi non ha nemici: 3-5 monete o un oggetto) e ignorava forzieri, consumabili e stanze speciali, così
 * stimava 9 monete dove il gioco ne dà 5,3. Ora questo comando delega a tools/sim-bilancio-teatro.js, che
 * genera i piani e i drop con il codice VERO del gioco (Playwright, nessun bot che gioca) e stampa anche i
 * piani 2-4, chiavi/lucchetti e stanze speciali. Risultati e motivazioni: production/bilancio-teatro.md.
 *
 * Uso: node gioco/teatro/sim-economia.js [numeroRun=1000]
 * Esce con codice 1 se la media del piano 1 (piano completo, segreta compresa) è fuori da [5, 8].
 */
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');

const radice = path.join(__dirname, '..', '..');
const n = String(Math.max(1, parseInt(process.argv[2], 10) || 1000));
const r = spawnSync(process.execPath, [path.join(radice, 'tools', 'sim-bilancio-teatro.js'),
  path.join(radice, 'gioco', 'teatro_marionette.html'), n, '1'], { stdio: 'inherit' });
process.exitCode = r.status === null ? 1 : r.status;
