/**
 * motore/attori/boss/capitano-guardia.js — Il Capitano di Piombo, pattern `chub_charge` (Teatro loop ~4495).
 *
 * Come Chub: insegue a passo corto e, pronto, **carica** in linea retta lungo l'asse (orizzontale o verticale) su cui
 * Ferruccio è più lontano, a `v_carica` (`v_carica_furia` in furia) finché non urta un muro o scade `t_carica`;
 * all'arresto lascia un **anello** di `n_anello` proiettili (`boss.atterraggio`: scossa). Il corpo in carica ferisce
 * al contatto (`boss.comuni.contatto_*`). Numeri in `nemici.json › boss.capitano-guardia`.
 */

import { creaMacchinaBoss, versoBersaglio, cdMs, insegui, anello, esponiPattern } from './base.js';

export const PATTERN_CHUB = 'chub_charge';

/** @param {object} ctx contesto fornito dalla fabbrica dei nemici */
export function creaPatternCapitano(ctx) {
  const macchina = creaMacchinaBoss(ctx);
  const B = ctx.B;
  let direzione = { x: -1, y: 0 };

  function carica() {
    const b = ctx.bersaglio();
    const dx = b ? b.x - ctx.corpo.x : direzione.x;
    const dy = b ? b.y - ctx.corpo.y : 0;
    const orizzontale = Math.abs(dx) >= Math.abs(dy);
    const dir = orizzontale ? { x: Math.sign(dx) || 1, y: 0 } : { x: 0, y: Math.sign(dy) || 1 };
    if (dir.x !== 0) direzione = { x: dir.x, y: 0 };
    const v = (ctx.furia() ? B('v_carica_furia') : B('v_carica')) * ctx.moltVel;
    const durata = Math.max(1, ctx.ticks(B('t_carica')));
    macchina.attacca({
      tick: (t, dt) => {
        const urto = ctx.muovi(dir.x * v * dt, dir.y * v * dt);
        return urto || t >= durata;
      },
      fine: () => {
        ctx.emit('boss.atterraggio', { x: ctx.corpo.x, y: ctx.corpo.y });
        anello(ctx, B('n_anello'), B('v_anello'), 0);
      },
      cdMs: cdMs(ctx, 't_cd'),
    });
  }

  function tick(dt) {
    const pronto = macchina.tick(dt, (d) => { const v = insegui(ctx, d); if (v && v.x !== 0) direzione = { x: Math.sign(v.x), y: 0 }; });
    if (pronto && versoBersaglio(ctx)) carica();
  }

  return esponiPattern({ nome: PATTERN_CHUB, macchina, tick, direzione: () => direzione });
}
