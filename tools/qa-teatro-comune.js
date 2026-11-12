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

/**
 * Aspetta `n` fotogrammi veri della pagina (requestAnimationFrame), al massimo `tetto` ms. Serve dopo un
 * input vero (tasto, dito, gamepad): il gioco lo legge al fotogramma successivo, e a macchina carica un
 * fotogramma può durare più di 100 ms.
 * @returns {Promise<boolean>} false se il tetto è scaduto prima degli n fotogrammi
 */
function aspettaFotogrammi(p, n, tetto = 15000) {
  return p.evaluate(([k, t]) => new Promise((fine) => {
    let c = 0; const f = () => { if (++c >= k) fine(true); else requestAnimationFrame(f); };
    requestAnimationFrame(f); setTimeout(() => fine(false), t);
  }), [Math.max(1, n), tetto]);
}

/**
 * Sostituto di `page.waitForTimeout(ms)` per le attese DOPO un'azione: aspetta almeno `ms` ms reali E almeno
 * ms/16,7 fotogrammi (+1), così a macchina carica il gioco ha avuto almeno il tempo di gioco previsto. Non
 * accorcia mai un'attesa, la allunga solo quando i fotogrammi rallentano. Le durate di un INPUT (dito tenuto
 * premuto per 80 ms) restano `waitForTimeout`: sono parte della prova.
 */
async function aspetta(p, ms) {
  await Promise.all([p.waitForTimeout(ms), aspettaFotogrammi(p, Math.ceil(ms / (1000 / 60)) + 1)]);
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

module.exports = { TEMPI_STRETTI, aspettaCondizione, aspettaFotogrammi, aspetta, passi, leggiTick, mediana };
