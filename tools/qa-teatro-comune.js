/*
 * tools/qa-teatro-comune.js — attrezzi comuni alle prove Playwright del Teatro (tools/qa-teatro-*.js).
 *
 * Nati per rendere le prove DETERMINISTICHE anche a macchina carica (più prove in parallelo, carico 9-16):
 * - niente «aspetta 600 ms e poi conta i tick»: si aspetta una CONDIZIONE con un tetto largo
 *   (`aspettaCondizione`) oppure si fanno PASSI DI LOGICA contati (`passi`, il passo fisso è 60 Hz);
 * - niente soglie di prestazione in millisecondi assoluti: confronto relativo nella stessa pagina
 *   (`mediana` di più campioni); le soglie assolute tornano solo con `QA_TEMPI=stretti`
 *   (`TEMPI_STRETTI`), da usare a macchina libera.
 * Le prove che funzionano non vanno riscritte: questo modulo si usa dove serve.
 */
'use strict';

/** Vero se l'ambiente chiede le soglie di tempo assolute (`QA_TEMPI=stretti`, macchina libera). */
const TEMPI_STRETTI = process.env.QA_TEMPI === 'stretti';

/**
 * Aspetta che `fn(arg)` (valutata nella pagina) diventi vera, controllando ogni `ogni` ms, al massimo
 * `tetto` ms. Non lancia: restituisce true se la condizione si è avverata, false allo scadere del tetto.
 * Il tetto è largo apposta: a macchina libera la condizione arriva in pochi fotogrammi, a macchina
 * carica in qualche secondo; un guasto vero la lascia falsa per sempre.
 * @param {import('playwright').Page} p
 * @param {Function} fn funzione da valutare nella pagina
 * @param {*} [arg] argomento serializzabile per fn
 * @param {{tetto?: number, ogni?: number}} [o]
 * @returns {Promise<boolean>}
 */
async function aspettaCondizione(p, fn, arg, o = {}) {
  const tetto = o.tetto || 15000;
  try {
    await p.waitForFunction(fn, arg, { timeout: tetto, polling: o.ogni || 40 });
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Fa `n` passi di logica (`passoLogico()`, 1/60 s di gioco ciascuno) dentro la pagina, in modo
 * sincrono: il risultato non dipende dal carico della macchina. Gli errori del passo vanno alla
 * rete di sicurezza del gioco come nel ciclo vero.
 * @param {import('playwright').Page} p
 * @param {number} n
 */
async function passi(p, n) {
  await p.evaluate((k) => {
    for (let i = 0; i < k; i++) {
      try { passoLogico(); } catch (err) { if (typeof segnalaErroreTeatro === 'function') segnalaErroreTeatro('logica', err); else throw err; }
    }
  }, n);
}

/** Tick logico corrente del gioco (variabile globale `tick` di 80-ciclo.js). */
const leggiTick = (p) => p.evaluate(() => tick);

/** Mediana di un elenco di numeri (le misure di tempo si confrontano per mediana, non per media). */
function mediana(v) {
  const s = [...v].sort((a, b) => a - b);
  if (!s.length) return NaN;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

module.exports = { TEMPI_STRETTI, aspettaCondizione, passi, leggiTick, mediana };
