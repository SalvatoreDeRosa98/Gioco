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

/** @param {object} contesto contesto fornito dalla fabbrica dei nemici */
export function creaPatternRegina(contesto) {
  const macchina = creaMacchinaBoss(contesto);
  const B = contesto.B;
  let vx = B('vx') * contesto.moltVel * (contesto.rng() < 0.5 ? -1 : 1);
  let vy = B('vy') * contesto.moltVel * (contesto.rng() < 0.5 ? -1 : 1);

  /** Un passo di rimbalzo: ogni asse separato, così l'urto inverte solo la sua componente. */
  function rimbalza(dt) {
    if (contesto.muovi(vx * dt, 0, true)) vx = -vx;
    if (contesto.muovi(0, vy * dt, true)) vy = -vy;
  }

  const comuniVivi = () => contesto.altri().filter((a) => a && !a.boss && a.stato !== 'morto' && (a.vita ?? 1) > 0).length;

  function salva() {
    macchina.attacca({
      tick: () => {
        if (comuniVivi() < B('max_vespe')) {
          const s = B('scarto_evocazione');
          contesto.genera(ARCHETIPO_EVOCATO, contesto.corpo.x + (contesto.rng() - 0.5) * s, contesto.corpo.y + (contesto.rng() - 0.5) * s);
        }
        anello(contesto, B('n_anello'), B('v_anello'), rad(B('rotazione_gradi')) * macchina.salve);
        return true;
      },
      cdMs: cdMs(contesto, 't_cd'),
    });
  }

  function tick(dt) {
    const pronto = macchina.tick(dt, null);
    rimbalza(dt);
    if (pronto) salva();
  }

  return esponiPattern({ nome: PATTERN_DUKE, macchina, tick, direzione: () => ({ x: Math.sign(vx) || -1, y: 0 }) });
}
