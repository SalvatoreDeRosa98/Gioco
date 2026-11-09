/**
 * motore/attori/boss/regina-vespa.js — La Regina delle Vespe, pattern `duke_flies` (Teatro loop ~4518).
 *
 * Come il Duke of Flies: **rimbalza in diagonale** sui muri (`vx`, `vy` px/s, versi iniziali dal generatore derivato),
 * sempre, anche durante il telegrafo; a ogni salva **evoca una Vespa** (archetipo `vespa`, volo puro) se nella stanza
 * ci sono meno di `max_vespe` nemici comuni vivi, e lascia un **anello** di `n_anello` proiettili ruotato di
 * `rotazione_gradi` a ogni salva. Numeri in `nemici.json › boss.regina-vespa`.
 */

import { creaMacchinaBoss, cdMs, anello, esponiPattern, rad } from './base.js';

export const PATTERN_DUKE = 'duke_flies';
/** Archetipo evocato (chiave di `nemici.archetipi`). */
export const ARCHETIPO_EVOCATO = 'vespa';

/** @param {object} ctx contesto fornito dalla fabbrica dei nemici */
export function creaPatternRegina(ctx) {
  const macchina = creaMacchinaBoss(ctx);
  const B = ctx.B;
  let vx = B('vx') * ctx.moltVel * (ctx.rng() < 0.5 ? -1 : 1);
  let vy = B('vy') * ctx.moltVel * (ctx.rng() < 0.5 ? -1 : 1);

  /** Un passo di rimbalzo: ogni asse separato, così l'urto inverte solo la sua componente. */
  function rimbalza(dt) {
    if (ctx.muovi(vx * dt, 0, true)) vx = -vx;
    if (ctx.muovi(0, vy * dt, true)) vy = -vy;
  }

  const comuniVivi = () => ctx.altri().filter((a) => a && !a.boss && a.stato !== 'morto' && (a.vita ?? 1) > 0).length;

  function salva() {
    macchina.attacca({
      tick: () => {
        if (comuniVivi() < B('max_vespe')) {
          const s = B('scarto_evocazione');
          ctx.genera(ARCHETIPO_EVOCATO, ctx.corpo.x + (ctx.rng() - 0.5) * s, ctx.corpo.y + (ctx.rng() - 0.5) * s);
        }
        anello(ctx, B('n_anello'), B('v_anello'), rad(B('rotazione_gradi')) * macchina.salve);
        return true;
      },
      cdMs: cdMs(ctx, 't_cd'),
    });
  }

  function tick(dt) {
    const pronto = macchina.tick(dt, null);
    rimbalza(dt);
    if (pronto) salva();
  }

  return esponiPattern({ nome: PATTERN_DUKE, macchina, tick, direzione: () => ({ x: Math.sign(vx) || -1, y: 0 }) });
}
