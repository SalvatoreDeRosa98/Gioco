/**
 * gioco/qa/fili.test.mjs — I due fili d'oro di ogni marionetta del Velo (regola dell'autore, 2026-11-09).
 *
 * Esecuzione: `node gioco/qa/fili.test.mjs`. Verifica che `resa.json › fili` rispetti la richiesta (1 px, oro al
 * 25-35 %, attacco alle spalle a circa 3/4 dell'altezza dai piedi, tutti {base,min,max} validi) e che `resa/fili.js`
 * calcoli due punti d'attacco distinti e simmetrici e disegni, su un contesto finto, esattamente due curve quadratiche
 * che pendono verso il basso, senza tratteggio, senza ombra e senza segmenti retti o cerchi (niente alone).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { creaFili } from '../motore/resa/fili.js';

const QUI = path.dirname(fileURLToPath(import.meta.url));
const RESA = JSON.parse(readFileSync(path.join(QUI, '..', 'contenuti', 'parametri', 'resa.json'), 'utf8'));
const CHIAVI = ['alpha', 'spessore', 'ancoraggio_y', 'scarto_x', 'curva_px'];

/** Parametri finti con i soli valori base di resa.json (come fa `parametri.get`). */
function parametriBase() {
  return { get: (percorso) => RESA.fili[percorso.replace('resa.fili.', '')].base };
}

/** Contesto 2D finto che registra le chiamate. */
function ctxFinto() {
  const chiamate = [];
  const ctx = { globalAlpha: 1, strokeStyle: '#000', lineWidth: 1, shadowBlur: 3, lineCap: 'round' };
  for (const nome of ['save', 'restore', 'beginPath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'arc', 'stroke', 'setLineDash']) {
    ctx[nome] = (...args) => chiamate.push({ nome, args, alpha: ctx.globalAlpha, spessore: ctx.lineWidth, colore: ctx.strokeStyle, ombra: ctx.shadowBlur });
  }
  return { ctx, chiamate };
}

test('resa.json › fili: richiesta dell\'autore (1 px, oro al 25-35 %, spalle a circa 3/4 dell\'altezza), tutti {base,min,max} validi', () => {
  for (const k of CHIAVI) {
    const v = RESA.fili[k];
    assert.ok(v && ['base', 'min', 'max'].every((c) => typeof v[c] === 'number'), `fili.${k} deve essere {base,min,max}`);
    assert.ok(v.min <= v.base && v.base <= v.max, `fili.${k}: min ≤ base ≤ max`);
  }
  assert.ok(RESA.fili.alpha.base >= 0.25 && RESA.fili.alpha.base <= 0.35, 'oro al 25-35 % di opacità');
  assert.ok(RESA.fili.alpha.max <= 0.35, 'nemmeno al massimo il filo supera il 35 %');
  assert.equal(RESA.fili.spessore.base, 1, 'linea di 1 px');
  assert.ok(Math.abs(RESA.fili.ancoraggio_y.base - 0.75) <= 0.1, 'spalle a circa 3/4 dell\'altezza dai piedi');
  assert.ok(RESA.fili.curva_px.base > 0, 'leggera curva verso il basso');
});

test('attacchi: due punti distinti, simmetrici attorno a x, alla quota delle spalle (piedi − altezza × ancoraggio_y)', () => {
  const fili = creaFili({ parametri: parametriBase(), colore: '#f3c14b' });
  const corpo = { x: 300, piedi: 400, altezza: 40, mezzaLarghezza: 20 };
  const a = fili.attacchi(corpo);
  const yAtteso = 400 - 40 * RESA.fili.ancoraggio_y.base;
  assert.equal(a.sinistro[1], yAtteso);
  assert.equal(a.destro[1], yAtteso);
  assert.ok(a.sinistro[0] < corpo.x && a.destro[0] > corpo.x, 'una spalla per lato');
  assert.equal(corpo.x - a.sinistro[0], a.destro[0] - corpo.x, 'simmetrici');
  assert.notDeepEqual(a.sinistro, a.destro, 'due punti distinti');
});

test('disegnaMarionetta: esattamente due curve (una per Mano) di spessore e alpha dai parametri, che pendono, senza tratteggio né alone', () => {
  const fili = creaFili({ parametri: parametriBase(), colore: '#f3c14b' });
  const { ctx, chiamate } = ctxFinto();
  const mani = { sinistra: [100, 40], destra: [900, 40] };
  const corpo = { x: 500, piedi: 500, altezza: 60, mezzaLarghezza: 24 };
  assert.equal(fili.disegnaMarionetta(ctx, mani, corpo), 2);
  const curve = chiamate.filter((c) => c.nome === 'quadraticCurveTo');
  const tratti = chiamate.filter((c) => c.nome === 'stroke');
  assert.equal(curve.length, 2, 'due fili');
  assert.equal(tratti.length, 2, 'due tratti');
  assert.equal(chiamate.filter((c) => c.nome === 'lineTo' || c.nome === 'arc').length, 0, 'niente segmenti retti né cerchi (nessun alone)');
  for (const t of tratti) {
    assert.equal(t.spessore, RESA.fili.spessore.base);
    assert.equal(t.alpha, RESA.fili.alpha.base);
    assert.equal(t.colore, '#f3c14b');
    assert.equal(t.ombra, 0, 'senza alone');
  }
  const dash = chiamate.filter((c) => c.nome === 'setLineDash');
  assert.ok(dash.length === 2 && dash.every((d) => d.args[0].length === 0), 'tratteggio azzerato');
  const partenze = chiamate.filter((c) => c.nome === 'moveTo').map((c) => c.args);
  assert.deepEqual(partenze, [mani.sinistra, mani.destra], 'un filo parte dalla Mano sinistra, uno dalla destra');
  const att = fili.attacchi(corpo);
  for (const [i, c] of curve.entries()) {
    const [cx, cy, bx, by] = c.args;
    const da = i === 0 ? mani.sinistra : mani.destra;
    const a = i === 0 ? att.sinistro : att.destro;
    assert.deepEqual([bx, by], a, 'arriva alla spalla');
    assert.equal(cx, (da[0] + a[0]) / 2);
    assert.ok(cy > (da[1] + a[1]) / 2, 'il controllo sta sotto la corda: il filo pende');
  }
  // dopo il disegno il contesto è ripristinato (save/restore appaiati)
  assert.equal(chiamate.filter((c) => c.nome === 'save').length, chiamate.filter((c) => c.nome === 'restore').length);
});

test('creaFili senza parametri lancia', () => {
  assert.throws(() => creaFili({}), TypeError);
});
