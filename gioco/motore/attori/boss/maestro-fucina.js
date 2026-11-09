/**
 * motore/attori/boss/maestro-fucina.js — Lo Spezzafili d'Ottone, pattern `scissor_blades` (Teatro POOL_BOSS ~2524).
 *
 * Il Teatro dichiara il pattern ma nel suo `loop()` non ha un ramo per `maestro-fucina` (resterebbe fermo): qui il
 * pattern è scritto dal nome, come Peep. Insegue a passo corto e, pronto, apre le **forbici**: due ventagli di `n_lama`
 * colpi, specchiati di ±`scarto_forbice_gradi` attorno alla mira, che si incrociano davanti a Ferruccio; in furia
 * aggiunge un **anello** di `n_anello_furia` proiettili. Numeri in `nemici.json › boss.maestro-fucina`.
 */

import { creaMacchinaBoss, versoBersaglio, cdMs, insegui, anello, ventaglio, esponiPattern, rad } from './base.js';

export const PATTERN_SCISSOR = 'scissor_blades';

/** @param {object} contesto contesto fornito dalla fabbrica dei nemici */
export function creaPatternMaestro(contesto) {
  const macchina = creaMacchinaBoss(contesto);
  const B = contesto.B;
  let direzione = { x: -1, y: 0 };

  function forbici() {
    macchina.attacca({
      tick: () => {
        const v = versoBersaglio(contesto);
        if (!v) return true;
        for (const segno of [-1, 1]) {
          ventaglio(contesto, v.angolo + segno * rad(B('scarto_forbice_gradi')), B('n_lama'), rad(B('passo_lama_gradi')), B('v_lama'));
        }
        if (contesto.furia()) anello(contesto, B('n_anello_furia'), B('v_anello'), v.angolo);
        return true;
      },
      cdMs: cdMs(contesto, 't_cd'),
    });
  }

  function tick(dt) {
    const pronto = macchina.tick(dt, (d) => { const v = insegui(contesto, d); if (v && v.x !== 0) direzione = { x: Math.sign(v.x), y: 0 }; });
    if (pronto && versoBersaglio(contesto)) forbici();
  }

  return esponiPattern({ nome: PATTERN_SCISSOR, macchina, tick, direzione: () => direzione });
}
