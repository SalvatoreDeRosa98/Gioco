/**
 * gioco/qa/architettura.test.mjs — Audit programmatico dell'architettura (storia P12, passo F4).
 *
 * Esecuzione: `node gioco/qa/architettura.test.mjs` dalla radice del repository (node:test, nessun browser).
 * Regola «lo stato non disegna, la resa non muta» (README › Regole del codice):
 *  - i moduli di STATO (`attori/`, `mondo/`, `oggetti/`, `storia/`, `persistenza/`) manipolano solo numeri ed eventi:
 *    nessun vocabolario Canvas (`getContext`, `fillStyle`, `strokeStyle`, `Path2D`, `ctx.`, `drawImage`, `globalAlpha`,
 *    gradienti, `fillRect`, `beginPath`, curve di Bézier), nessun colore esadecimale, nessun DOM (`document.`, `window.`,
 *    `requestAnimationFrame`), nessun nome di sprite o di fotogramma;
 *  - i moduli di RESA (`resa/`) non importano lo stato (lo ricevono per iniezione e lo leggono), non chiamano `tick(`,
 *    non assegnano campi dello stato e non leggono l'orologio reale (`performance.now`, `Date.now`): il tempo della
 *    resa è il contatore dei tick, così il disegno non dipende dal refresh dello schermo;
 *  - nessun `Math.random` in tutto `motore/` (solo `fondazione/rng.js`);
 *  - il passo fisso: `PASSO_MS` = 1000/60, `MAX_TICK_PER_FRAME` = 5 e un frame di 1000 ms esegue 5 tick, non 60.
 * I commenti sono tolti prima del controllo, così la documentazione può nominare ciò che il codice non deve fare.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { creaTempo, PASSO_MS, MAX_TICK_PER_FRAME } from '../motore/fondazione/tempo.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const MOTORE = join(QUI, '..', 'motore');

/** Cartelle dei due lati della regola. `fondazione/` (input, ciclo) e `avvio.js` (radice di composizione) sono neutri. */
export const CARTELLE_STATO = Object.freeze(['attori', 'mondo', 'oggetti', 'storia', 'persistenza']);
export const CARTELLE_RESA = Object.freeze(['resa']);

/** Vocabolario che nello stato non deve comparire (fuori dai commenti). */
const VIETATO_NELLO_STATO = [
  /getContext/, /fillStyle/, /strokeStyle/, /Path2D/, /\bctx\./, /drawImage/, /globalAlpha/,
  /create(?:Linear|Radial|Conic)Gradient/, /fillRect/, /strokeRect/, /beginPath/, /bezierCurveTo|quadraticCurveTo/,
  /#[0-9a-fA-F]{6}\b/, /#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/,
  /\bdocument\./, /\bwindow\./, /requestAnimationFrame/, /HTMLCanvasElement|CanvasRenderingContext2D/,
  /\bframeSpada\b/, /\bsplash\d/, /SPRITE_/,
];

/** Vocabolario che nella resa non deve comparire (fuori dai commenti). */
const VIETATO_NELLA_RESA = [
  /from\s+'\.\.\/(?:attori|mondo|oggetti|storia|persistenza)\//, // lo stato arriva per iniezione, non per import
  /performance\.now|Date\.now|new Date\(/, // il tempo della resa è il contatore dei tick
  /\.tick\(/, // la resa non fa avanzare nulla
  /\b(?:ferruccio|combattimento|camera|notte|campo)\.[a-zA-Z_]+\s*=[^=]/, // la resa non assegna campi dello stato
];

/** Elenca ricorsivamente i file .js di una cartella. */
function fileJs(cartella) {
  const fuori = [];
  for (const nome of readdirSync(cartella)) {
    const p = join(cartella, nome);
    if (statSync(p).isDirectory()) fuori.push(...fileJs(p));
    else if (nome.endsWith('.js')) fuori.push(p);
  }
  return fuori;
}

/** Toglie i commenti `/* ... *\/` e `// ...` (a inizio riga o dopo uno spazio) da un sorgente. */
export function senzaCommenti(sorgente) {
  return sorgente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[ \t])\/\/.*$/gm, '$1');
}

/** Righe (1-based) di `sorgente` in cui compare `regex`. */
function righeCon(sorgente, regex) {
  const righe = [];
  sorgente.split('\n').forEach((r, i) => { if (regex.test(r)) righe.push(i + 1); });
  return righe;
}

/** Controlla ogni file delle cartelle date contro il vocabolario vietato e torna le violazioni. */
function violazioni(cartelle, vietati) {
  const trovate = [];
  for (const c of cartelle) {
    for (const f of fileJs(join(MOTORE, c))) {
      const s = senzaCommenti(readFileSync(f, 'utf8'));
      for (const re of vietati) {
        const righe = righeCon(s, re);
        if (righe.length) trovate.push(`${relative(MOTORE, f)}:${righe.join(',')} → ${re}`);
      }
    }
  }
  return trovate;
}

test('architettura: le cartelle dei due lati esistono e non sono vuote', () => {
  for (const c of [...CARTELLE_STATO, ...CARTELLE_RESA]) {
    assert.ok(fileJs(join(MOTORE, c)).length > 0, `motore/${c}/ senza file .js`);
  }
});

test('stato: attori/, mondo/, oggetti/, storia/, persistenza/ non disegnano (niente Canvas, colori, DOM, sprite o fotogrammi)', () => {
  const v = violazioni(CARTELLE_STATO, VIETATO_NELLO_STATO);
  assert.deepEqual(v, [], `lo stato disegna:\n${v.join('\n')}`);
});

test('resa: resa/ non importa lo stato, non chiama tick(, non assegna campi dello stato e non legge l\'orologio reale', () => {
  const v = violazioni(CARTELLE_RESA, VIETATO_NELLA_RESA);
  assert.deepEqual(v, [], `la resa muta o dipende dal tempo reale:\n${v.join('\n')}`);
});

test('resa: gli effetti transitori del combattimento vivono in resa/impatti.js e la camera trasforma in resa/trasformazioni.js', () => {
  const impatti = readFileSync(join(MOTORE, 'resa', 'impatti.js'), 'utf8');
  const trasformazioni = readFileSync(join(MOTORE, 'resa', 'trasformazioni.js'), 'utf8');
  const renderer = senzaCommenti(readFileSync(join(MOTORE, 'resa', 'renderer.js'), 'utf8'));
  const debug = senzaCommenti(readFileSync(join(MOTORE, 'resa', 'debug.js'), 'utf8'));
  for (const nome of ['frameSpada', 'splash', 'fulmini', 'ferruccio.proiettile_spento', 'ferruccio.fulmine']) {
    assert.ok(impatti.includes(nome), `impatti.js senza ${nome}`);
  }
  assert.ok(trasformazioni.includes('export function applicaCamera'));
  assert.ok(renderer.includes('applicaCamera(') && debug.includes('applicaCamera('), 'renderer e debug applicano la camera dalla resa');
  assert.ok(!renderer.includes('camera.applica(') && !debug.includes('camera.applica('), 'nessuna chiamata a camera.applica');
});

test('motore: zero occorrenze di Math.random fuori da fondazione/rng.js (che non lo usa nemmeno)', () => {
  const colpevoli = fileJs(MOTORE).filter((f) => /Math\.random/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(colpevoli.map((f) => relative(MOTORE, f)), []);
});

test('passo fisso: PASSO_MS = 1000/60, tetto di 5 tick per frame, un frame di 1000 ms esegue 5 tick e scarta il resto', () => {
  assert.equal(PASSO_MS, 1000 / 60);
  assert.equal(MAX_TICK_PER_FRAME, 5);
  const t = creaTempo();
  assert.equal(t.maxTickPerFrame, 5);
  assert.equal(t.avanza(1000), 5, 'il dt reale è limitato a 5 passi');
  assert.equal(t.residuo(), 0, 'il tempo in eccesso è scartato, non recuperato dopo');
  assert.equal(t.avanza(PASSO_MS), 1);
});
