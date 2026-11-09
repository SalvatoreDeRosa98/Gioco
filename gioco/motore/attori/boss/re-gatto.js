/**
 * motore/attori/boss/re-gatto.js — Il Gatto dei Quattro Canti, pattern `monstro_jump` (Teatro loop ~4452).
 *
 * Come Monstro: insegue a passo corto (`fattore_insegue`); gli attacchi si alternano: **grande balzo** verso il punto
 * in cui era Ferruccio (in aria `quota` > 0: i colpi gli passano sotto oltre `quota_immune`, niente contatto oltre
 * `quota_contatto`) con **schianto** all'atterraggio (`boss.atterraggio`: scossa) e **rosa caotica** di `n_rosa`
 * proiettili con scarto angolare e velocità dal generatore derivato; poi **ventaglio** mirato di `n_ventaglio` colpi a
 * `passo_ventaglio_gradi`. In furia (vita < `soglia_furia`) i cooldown scendono alle varianti `_furia`.
 * Numeri in `nemici.json › boss.re-gatto`; nessun numero qui.
 */

import { creaMacchinaBoss, versoBersaglio, cdMs, insegui, anello, ventaglio, esponiPattern, rad } from './base.js';

export const PATTERN_MONSTRO = 'monstro_jump';

/** @param {object} ctx contesto fornito dalla fabbrica dei nemici */
export function creaPatternReGatto(ctx) {
  const macchina = creaMacchinaBoss(ctx);
  const B = ctx.B;
  let quota = 0;
  let direzione = { x: -1, y: 0 };
  let nAttacchi = 0;

  /** La rosa caotica dello schianto: n_rosa colpi con scarto ±scarto_rosa_gradi/2 e velocità in [v_rosa_min, v_rosa_max]. */
  function rosa() {
    const n = Math.max(0, Math.round(B('n_rosa')));
    const scarto = rad(B('scarto_rosa_gradi'));
    for (let k = 0; k < n; k++) {
      const a = (Math.PI * 2 * k) / n + (ctx.rng() - 0.5) * scarto;
      const v = B('v_rosa_min') + ctx.rng() * (B('v_rosa_max') - B('v_rosa_min'));
      ctx.lancia({ x: Math.cos(a), y: Math.sin(a) }, v);
    }
  }

  function balzo() {
    const b = ctx.bersaglio();
    const da = { x: ctx.corpo.x, y: ctx.corpo.y };
    const a = ctx.dentroCampo(b ? b.x : da.x, b ? b.y : da.y, B('margine_salto'));
    const durata = Math.max(1, ctx.ticks(B('t_salto')));
    let prec = da;
    macchina.attacca({
      tick: (t) => {
        const k = Math.min(1, t / durata);
        quota = Math.sin(k * Math.PI) * B('quota_salto');
        const dest = { x: da.x + (a.x - da.x) * k, y: da.y + (a.y - da.y) * k };
        ctx.muovi(dest.x - prec.x, dest.y - prec.y, true); // in volo: sorvola gli ostacoli, non i muri
        prec = { x: ctx.corpo.x, y: ctx.corpo.y };
        return k >= 1;
      },
      fine: () => {
        quota = 0;
        ctx.emit('boss.atterraggio', { x: ctx.corpo.x, y: ctx.corpo.y });
        rosa();
      },
      cdMs: cdMs(ctx, 't_cd_salto'),
    });
  }

  function sventaglia() {
    macchina.attacca({
      tick: () => {
        const v = versoBersaglio(ctx);
        if (v) ventaglio(ctx, v.angolo, B('n_ventaglio'), rad(B('passo_ventaglio_gradi')), B('v_ventaglio'));
        return true;
      },
      cdMs: cdMs(ctx, 't_cd_ventaglio'),
    });
  }

  function tick(dt) {
    const pronto = macchina.tick(dt, (d) => { const v = insegui(ctx, d); if (v && v.x !== 0) direzione = { x: Math.sign(v.x), y: 0 }; });
    if (!pronto) return;
    nAttacchi += 1;
    if (nAttacchi % 2 === 1) balzo(); else sventaglia();
  }

  return esponiPattern({ nome: PATTERN_MONSTRO, macchina, tick, direzione: () => direzione, quota: () => quota });
}
