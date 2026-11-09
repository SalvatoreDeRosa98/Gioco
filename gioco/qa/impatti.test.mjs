/**
 * gioco/qa/impatti.test.mjs — Test unitari di resa/impatti.js e resa/trasformazioni.js (storia P12, passo F4).
 *
 * Esecuzione: `node gioco/qa/impatti.test.mjs` dalla radice del repository (node:test, nessun browser).
 * Le funzioni erano nello stato (`combattimento.frameSpada`, `esplosioniProiettili`, `scintilleFulmine`, `camera.applica`)
 * e sono state spostate nella resa senza cambiare comportamento: i test ricostruiscono il comportamento di prima dai
 * numeri di `resa.json › impatti` (il test non ricopia i valori) e verificano che la resa derivi gli stessi fotogrammi.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { creaImpatti } from '../motore/resa/impatti.js';
import { applicaCamera } from '../motore/resa/trasformazioni.js';
import { creaBus } from '../motore/fondazione/eventi.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RESA = JSON.parse(readFileSync(join(QUI, '..', 'contenuti', 'parametri', 'resa.json'), 'utf8'));
const I = RESA.impatti;

/** Parametri finti con i soli valori base di resa.json (come fa `parametri.get`). */
function parametriFinti() {
  return {
    get(percorso) {
      const parti = percorso.split('.');
      let v = RESA;
      for (const p of parti.slice(1)) v = v?.[p];
      if (v && typeof v === 'object' && 'base' in v) return v.base;
      throw new RangeError(`parametro sconosciuto ${percorso}`);
    },
  };
}

/** Bus + orologio dei tick finti e registro degli impatti con 3 fotogrammi di splash. */
function monta() {
  const eventi = creaBus({ log: { error: () => {} } });
  let tick = 0;
  const impatti = creaImpatti({ parametri: parametriFinti(), eventi, contaTick: () => tick, nSplash: 3 });
  return { eventi, impatti, avanza: (n = 1) => { tick += n; return tick; }, tick: () => tick };
}

test('resa.json › impatti: tutte le voci sono {base,min,max} validi e coerenti con lo stato di prima (splash 3×4 = 12 tick, fulmine 6)', () => {
  for (const [k, v] of Object.entries(I)) {
    assert.ok(Number.isFinite(v.base) && Number.isFinite(v.min) && Number.isFinite(v.max), k);
    assert.ok(v.min <= v.base && v.base <= v.max, `${k} fuori range`);
  }
  assert.equal(3 * I.splash_frame_ticks.base, 12, 'lo splash di prima durava 12 tick (maxTick: 12) con tre fotogrammi di 4');
  assert.equal(I.fulmine_ticks.base, 6, 'il fulmine di prima durava 6 tick (maxTick: 6)');
});

test('frameSpada: dallo stato (stato, fase, faseTicks) gli stessi indici 0..5 della funzione che stava in combattimento.js', () => {
  const { impatti } = monta();
  /** La formula di prima, con le soglie lette dal JSON invece che scritte nel codice. */
  const prima = (c) => {
    if (c.stato !== 'fendente') return 0;
    if (c.fase === 'startup') return c.faseTicks > I.spada_startup_ticks.base ? 0 : 1;
    if (c.fase === 'attivo') return c.faseTicks > I.spada_attivo_ticks.base ? 2 : 3;
    return c.faseTicks > I.spada_recupero_ticks.base ? 4 : 5;
  };
  const visti = new Set();
  for (const stato of ['pronto', 'fendente', 'carica', 'affondo', 'parata', 'controcolpo']) {
    for (const fase of ['startup', 'attivo', 'recupero', null]) {
      for (let faseTicks = 0; faseTicks <= 12; faseTicks++) {
        const c = { stato, fase, faseTicks };
        const f = impatti.frameSpada(c);
        assert.equal(f, prima(c), JSON.stringify(c));
        visti.add(f);
      }
    }
  }
  assert.deepEqual([...visti].sort(), [0, 1, 2, 3, 4, 5], 'tutti e sei i fotogrammi sono raggiungibili');
  assert.equal(impatti.frameSpada(null), 0);
  assert.equal(impatti.frameSpada({ stato: 'fendente', fase: 'attivo' }), 3, 'senza faseTicks vale 0 → fotogramma pieno');
});

test('splash: ferruccio.proiettile_spento → fotogrammi 0,1,2 per splash_frame_ticks tick ciascuno, poi sparisce; come la lista di prima', () => {
  const { eventi, impatti, avanza } = monta();
  const per = I.splash_frame_ticks.base;
  assert.deepEqual(impatti.splash(), []);
  eventi.emit('ferruccio.proiettile_spento', { x: 100, y: 50, tipo: 'fuoco', causa: 'muro' });
  eventi.emit('ferruccio.proiettile_spento', { x: NaN, y: 1 }); // ignorato
  assert.deepEqual(impatti.conteggio(), { splash: 1, fulmini: 0 });
  // prima: push con tick 0 e `tick += 1` alla fine dello stesso tick → al primo disegno età 1 → splash0
  avanza(1);
  let s = impatti.splash();
  assert.deepEqual(s, [{ x: 100, y: 50, tipo: 'fuoco', causa: 'muro', frame: 0 }]);
  avanza(per - 1); // età = per → secondo fotogramma
  assert.equal(impatti.splash()[0].frame, 1);
  avanza(per); // età = 2·per → terzo
  assert.equal(impatti.splash()[0].frame, 2);
  avanza(per - 1); // età = 3·per − 1 → ancora vivo
  assert.equal(impatti.splash().length, 1);
  avanza(1); // età = 3·per = 12 → finito (prima: rimosso a tick >= maxTick)
  assert.deepEqual(impatti.splash(), []);
  assert.deepEqual(impatti.conteggio(), { splash: 0, fulmini: 0 });
});

test('fulmini: ferruccio.fulmine → segmento con alpha 1 − età/fulmine_ticks, via a fine durata; il payload incompleto è ignorato', () => {
  const { eventi, impatti, avanza } = monta();
  const durata = I.fulmine_ticks.base;
  eventi.emit('ferruccio.fulmine', { x1: 0, y1: 0, x2: 30, y2: 40 });
  eventi.emit('ferruccio.fulmine', { x1: 0, y1: 0 }); // ignorato
  avanza(1);
  const f = impatti.fulmini();
  assert.equal(f.length, 1);
  assert.deepEqual([f[0].x1, f[0].y1, f[0].x2, f[0].y2], [0, 0, 30, 40]);
  assert.ok(Math.abs(f[0].alpha - (1 - 1 / durata)) < 1e-12, `alpha ${f[0].alpha}`);
  avanza(durata - 2); // età = durata − 1 → ultimo frame visibile
  assert.ok(Math.abs(impatti.fulmini()[0].alpha - 1 / durata) < 1e-12);
  avanza(1); // età = durata → via
  assert.deepEqual(impatti.fulmini(), []);
});

test('creaImpatti: senza parametri o senza fotogrammi di splash lancia; senza bus non ascolta nulla', () => {
  assert.throws(() => creaImpatti({ parametri: null, nSplash: 3 }), TypeError);
  assert.throws(() => creaImpatti({ parametri: parametriFinti(), nSplash: 0 }), RangeError);
  const muto = creaImpatti({ parametri: parametriFinti(), nSplash: 3 });
  assert.deepEqual(muto.splash(), []);
  assert.deepEqual(muto.fulmini(), []);
});

test('applicaCamera: traduce scala e scorrimento della camera in translate/scale attorno al centro della scena (come camera.applica di prima)', () => {
  const chiamate = [];
  const ctx = { translate: (x, y) => chiamate.push(['translate', x, y]), scale: (x, y) => chiamate.push(['scale', x, y]) };
  const scena = { larghezza: 1280, altezza: 720 };
  applicaCamera(ctx, { scala: 0.5, scorrimento: () => ({ x: 10, y: -4 }) }, scena);
  assert.deepEqual(chiamate, [['translate', 650, 356], ['scale', 0.5, 0.5], ['translate', -640, -360]]);
  chiamate.length = 0;
  applicaCamera(ctx, null, scena);
  assert.deepEqual(chiamate, [], 'senza camera nessuna trasformazione');
});
