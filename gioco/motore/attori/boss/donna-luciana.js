/**
 * motore/attori/boss/donna-luciana.js — Donna Luciana, la Burattinaia del Velo, pattern `marionette_queen`
 * (Teatro loop ~4592, BOSS_FINALE ~2527). Il renderer disegna le due Grandi Mani scese ai suoi lati, con i fili.
 *
 * Come Mom/Satan: insegue lentamente (`fattore_insegue`); a ogni salva **le due Mani sparano un ventaglio** di
 * `n_ventaglio_mano` colpi mirati ciascuna, dall'origine scostata di ±`scarto_mano_x`, −`scarto_mano_y` dal corpo; alle
 * salve pari (sempre, in furia) aggiunge lo **schianto delle Mani** (`boss.mani_schianto`: scossa) con un **anello** di
 * `n_anello` proiettili ruotato di `rotazione_gradi` per salva. Numeri in `nemici.json › boss.donna-luciana`.
 */

import { creaMacchinaBoss, cdMs, insegui, anello, ventaglio, esponiPattern, rad } from './base.js';

export const PATTERN_QUEEN = 'marionette_queen';

/** @param {object} contesto contesto fornito dalla fabbrica dei nemici */
export function creaPatternDonnaLuciana(contesto) {
  const macchina = creaMacchinaBoss(contesto);
  const B = contesto.B;
  let direzione = { x: -1, y: 0 };

  /** Le origini dei colpi delle due Mani (sinistra e destra) nelle coordinate del palco. */
  function mani() {
    return [-1, 1].map((lato) => ({ x: contesto.corpo.x + lato * B('scarto_mano_x'), y: contesto.corpo.y - B('scarto_mano_y'), lato }));
  }

  function salva() {
    macchina.attacca({
      tick: () => {
        const b = contesto.bersaglio();
        if (!b) return true;
        for (const mano of mani()) {
          const a = Math.atan2(b.y - mano.y, b.x - mano.x);
          ventaglio(contesto, a, B('n_ventaglio_mano'), rad(B('passo_ventaglio_gradi')), B('v_ventaglio'), mano);
        }
        if (contesto.furia() || macchina.salve % 2 === 0) {
          contesto.emit('boss.mani_schianto', { x: contesto.corpo.x, y: contesto.corpo.y, mani: mani().map(({ x, y }) => ({ x, y })) });
          anello(contesto, B('n_anello'), B('v_anello'), rad(B('rotazione_gradi')) * macchina.salve);
        }
        return true;
      },
      cdMs: cdMs(contesto, 't_cd'),
    });
  }

  function tick(dt) {
    const pronto = macchina.tick(dt, (d) => { const v = insegui(contesto, d); if (v && v.x !== 0) direzione = { x: Math.sign(v.x), y: 0 }; });
    if (pronto && contesto.bersaglio()) salva();
  }

  return esponiPattern({ nome: PATTERN_QUEEN, macchina, tick, direzione: () => direzione, extra: { mani } });
}
