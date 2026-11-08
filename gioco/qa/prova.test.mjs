/**
 * gioco/qa/prova.test.mjs — Parametri di avvio dalla pagina (storia P02, PROVVISORIA): `fondiDefault` e
 * `leggiMetaAvvio` di `motore/fondazione/avvio-url.js`, puri, senza browser. Esecuzione: `node gioco/qa/prova.test.mjs`.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fondiDefault, leggiMetaAvvio, META_AVVIO } from '../motore/fondazione/avvio-url.js';

test('fondiDefault: la meta riempie solo le chiavi assenti, l\'URL vince', () => {
  assert.equal(fondiDefault('', 'debug=1&wire=1&hub=1'), '?debug=1&wire=1&hub=1');
  assert.equal(fondiDefault('?seme=1845', 'debug=1&wire=1&hub=1'), '?seme=1845&debug=1&wire=1&hub=1');
  assert.equal(fondiDefault('?hub=0&piano=1', 'debug=1&hub=1'), '?hub=0&piano=1&debug=1');
});

test('fondiDefault: senza meta la query resta uguale, senza nulla è vuota', () => {
  assert.equal(fondiDefault('?a=1', null), '?a=1');
  assert.equal(fondiDefault('?a=1', ''), '?a=1');
  assert.equal(fondiDefault('', null), '');
});

test('leggiMetaAvvio: null senza meta, contenuto (anche vuoto) con la meta', () => {
  const doc = (content) => ({ querySelector: (sel) => (sel === `meta[name="${META_AVVIO}"]` && content !== undefined ? { getAttribute: () => content } : null) });
  assert.equal(leggiMetaAvvio(doc(undefined)), null);
  assert.equal(leggiMetaAvvio(doc('debug=1')), 'debug=1');
  assert.equal(leggiMetaAvvio(doc(null)), '');
  assert.equal(leggiMetaAvvio(null), null);
});
